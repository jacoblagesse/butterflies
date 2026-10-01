const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { defineSecret, defineString } = require("firebase-functions/params");
const { initializeApp } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");

initializeApp();
const db = getFirestore();

const stripeSecretKey = defineSecret("STRIPE_SECRET_KEY");
const isEmulator = process.env.FUNCTIONS_EMULATOR === "true";

// In production, read from Firebase secret. In the emulator, read from env.
const getStripeKey = () => {
  if (!isEmulator) {
    try { return stripeSecretKey.value(); } catch {}
  }
  return process.env.STRIPE_SECRET_KEY;
};

// Only declare secrets in production — the emulator reads from env vars.
const fnConfig = isEmulator ? {} : { secrets: [stripeSecretKey] };

// Input constraints — keep server-side so the client can't write oversized
// or unexpected values into world-readable documents.
const ALLOWED_COLORS = ["blue", "green", "orange", "pink", "purple", "yellow"];
const ALLOWED_STYLES = ["mountain", "tropical", "lake", "desert", "japanese garden", "flowers"];
const MAX_GIFTER_LEN = 80;
const MAX_MESSAGE_LEN = 500;
const MAX_NAME_LEN = 80;
const MAX_DATES_LEN = 40;

// Confirm the authenticated caller owns the referenced garden. Returns the
// garden snapshot data on success, throws otherwise.
const assertGardenOwner = async (gardenId, uid) => {
  const gardenSnap = await db.doc(`gardens/${gardenId}`).get();
  if (!gardenSnap.exists) {
    throw new HttpsError("not-found", "Garden does not exist.");
  }
  const owner = gardenSnap.data().user;
  if (!owner || owner.path !== `users/${uid}`) {
    throw new HttpsError("permission-denied", "You do not own this garden.");
  }
  return gardenSnap.data();
};

exports.createPaymentIntent = onCall(
  fnConfig,
  async (request) => {
    // Buying is allowed anonymously; capture uid when present so the
    // purchase can be tied to an account and ownership-checked on confirm.
    const uid = request.auth?.uid || null;

    const { gardenId, color, gifter, email, message } = request.data;

    if (!gardenId || !gifter || !message) {
      throw new HttpsError(
        "invalid-argument",
        "gardenId, gifter, and message are required."
      );
    }
    if (typeof gifter !== "string" || gifter.length > MAX_GIFTER_LEN) {
      throw new HttpsError("invalid-argument", "Invalid gifter name.");
    }
    if (typeof message !== "string" || message.length > MAX_MESSAGE_LEN) {
      throw new HttpsError("invalid-argument", "Message is too long.");
    }
    if (color && !ALLOWED_COLORS.includes(color)) {
      throw new HttpsError("invalid-argument", "Unknown butterfly color.");
    }

    const stripe = require("stripe")(getStripeKey());

    // Only attach a receipt email when it's well-formed — a malformed value
    // (e.g. "test") makes Stripe reject the whole PaymentIntent.
    const validEmail =
      email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : undefined;

    const paymentIntent = await stripe.paymentIntents.create({
      amount: 199, // $1.99 in cents
      currency: "usd",
      payment_method_types: ["card"],
      receipt_email: validEmail,
      metadata: { gardenId, uid: uid || "" },
    });

    // The pending payment record is the source of truth confirmPayment reads
    // back — it must be written, so a failure here fails the request.
    await db.collection("payments").doc(paymentIntent.id).set({
      uid,
      gardenId,
      color: color || null,
      gifter,
      email: validEmail || null,
      message,
      amount: 199,
      currency: "usd",
      status: "pending",
      butterflyId: null,
      createdAt: new Date(),
    });

    return { clientSecret: paymentIntent.client_secret };
  }
);

exports.confirmPayment = onCall(
  fnConfig,
  async (request) => {
    const uid = request.auth?.uid || null;

    const { paymentIntentId } = request.data;
    if (!paymentIntentId) {
      throw new HttpsError("invalid-argument", "paymentIntentId is required.");
    }

    const stripe = require("stripe")(getStripeKey());
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.status !== "succeeded") {
      throw new HttpsError(
        "failed-precondition",
        `Payment not succeeded. Status: ${paymentIntent.status}`
      );
    }

    const paymentRef = db.collection("payments").doc(paymentIntentId);

    // Run in a transaction so a replayed call can't mint a second butterfly:
    // the butterfly is created exactly once, gated on the payment record.
    const result = await db.runTransaction(async (tx) => {
      const snap = await tx.get(paymentRef);
      if (!snap.exists) {
        throw new HttpsError("not-found", "Payment record not found.");
      }
      const data = snap.data();

      // If the purchase was tied to an account, only that account may confirm
      // it. Anonymous purchases (no uid on record) skip this check — replay is
      // still prevented by the one-butterfly-per-payment guard below.
      if (data.uid && data.uid !== uid) {
        throw new HttpsError("permission-denied", "This payment is not yours.");
      }

      // Idempotency: if a butterfly was already minted, return it unchanged.
      if (data.butterflyId) {
        return {
          butterflyId: data.butterflyId,
          gardenId: data.gardenId,
          color: data.color,
          gifter: data.gifter,
          message: data.message,
        };
      }

      // Create the butterfly. Note: no email / uid on this doc — it is
      // world-readable. PII stays on the locked-down payments record.
      const butterflyRef = db.collection("butterflies").doc();
      tx.set(butterflyRef, {
        gifter: data.gifter,
        message: data.message,
        garden: db.doc(`gardens/${data.gardenId}`),
        gardenId: data.gardenId,
        color: data.color || null,
        created: new Date(),
      });
      tx.update(paymentRef, {
        status: "succeeded",
        confirmedAt: new Date(),
        butterflyId: butterflyRef.id,
      });

      return {
        butterflyId: butterflyRef.id,
        gardenId: data.gardenId,
        color: data.color,
        gifter: data.gifter,
        message: data.message,
      };
    });

    return { verified: true, ...result };
  }
);

// The free "white" butterfly created at garden creation time. Client-side
// butterfly writes are denied by Firestore rules, so this runs server-side
// and is gated on garden ownership + one-per-garden idempotency.
exports.createInitialButterfly = onCall(
  {},
  async (request) => {
    const uid = request.auth?.uid;
    if (!uid) {
      throw new HttpsError("unauthenticated", "You must be signed in.");
    }

    const { gardenId, gifter, message } = request.data;
    if (!gardenId || !gifter) {
      throw new HttpsError("invalid-argument", "gardenId and gifter are required.");
    }
    if (typeof gifter !== "string" || gifter.length > MAX_GIFTER_LEN) {
      throw new HttpsError("invalid-argument", "Invalid gifter name.");
    }
    if (message && (typeof message !== "string" || message.length > MAX_MESSAGE_LEN)) {
      throw new HttpsError("invalid-argument", "Message is too long.");
    }

    await assertGardenOwner(gardenId, uid);

    // One free white butterfly per garden.
    const existing = await db
      .collection("butterflies")
      .where("gardenId", "==", gardenId)
      .where("color", "==", "white")
      .limit(1)
      .get();
    if (!existing.empty) {
      return { butterflyId: existing.docs[0].id, alreadyExists: true };
    }

    const butterflyRef = await db.collection("butterflies").add({
      gifter,
      message: message || "",
      garden: db.doc(`gardens/${gardenId}`),
      gardenId,
      color: "white",
      created: new Date(),
    });

    return { butterflyId: butterflyRef.id };
  }
);

// Lets the garden owner edit garden + honoree info after creation. Honoree
// docs deny client updates in Firestore rules (no owner field of their own),
// so this runs server-side and derives ownership through the garden's
// `user` reference instead.
exports.updateGardenInfo = onCall(
  {},
  async (request) => {
    const uid = request.auth?.uid;
    if (!uid) {
      throw new HttpsError("unauthenticated", "You must be signed in.");
    }

    const { gardenId, name, style, honoree, passwordHash } = request.data;
    if (!gardenId) {
      throw new HttpsError("invalid-argument", "gardenId is required.");
    }

    const garden = await assertGardenOwner(gardenId, uid);

    const gardenUpdates = {};
    if (name !== undefined) {
      if (typeof name !== "string" || !name.trim() || name.length > MAX_NAME_LEN) {
        throw new HttpsError("invalid-argument", "Invalid garden name.");
      }
      gardenUpdates.name = name.trim();
    }
    if (style !== undefined) {
      if (!ALLOWED_STYLES.includes(style)) {
        throw new HttpsError("invalid-argument", "Invalid style.");
      }
      gardenUpdates.style = style;
    }
    // passwordHash is a client-computed SHA-256 hex digest (see
    // src/utils/hash.js) — this is a simple UI-level gate, not real access
    // control (the garden's data stays publicly readable the same way it
    // always has been), so the goal is only to avoid ever writing a
    // visitor-chosen plaintext password into a publicly-readable document.
    // null explicitly clears protection; undefined leaves it unchanged.
    if (passwordHash !== undefined) {
      if (passwordHash !== null && !/^[0-9a-f]{64}$/.test(passwordHash)) {
        throw new HttpsError("invalid-argument", "Invalid password hash.");
      }
      gardenUpdates.passwordHash = passwordHash;
    }
    if (Object.keys(gardenUpdates).length > 0) {
      await db.doc(`gardens/${gardenId}`).update(gardenUpdates);
    }

    if (honoree && typeof honoree === "object") {
      const { first_name, last_name, dates, obit } = honoree;
      const honoreeUpdates = {};
      if (first_name !== undefined) {
        if (typeof first_name !== "string" || !first_name.trim() || first_name.length > MAX_NAME_LEN) {
          throw new HttpsError("invalid-argument", "Invalid first name.");
        }
        honoreeUpdates.first_name = first_name.trim();
      }
      if (last_name !== undefined) {
        if (typeof last_name !== "string" || last_name.length > MAX_NAME_LEN) {
          throw new HttpsError("invalid-argument", "Invalid last name.");
        }
        honoreeUpdates.last_name = last_name.trim();
      }
      if (dates !== undefined) {
        if (typeof dates !== "string" || dates.length > MAX_DATES_LEN) {
          throw new HttpsError("invalid-argument", "Invalid dates.");
        }
        honoreeUpdates.dates = dates.trim();
      }
      if (obit !== undefined) {
        if (typeof obit !== "string" || obit.length > MAX_MESSAGE_LEN) {
          throw new HttpsError("invalid-argument", "Dedication is too long.");
        }
        honoreeUpdates.obit = obit.trim();
      }
      if (Object.keys(honoreeUpdates).length > 0) {
        if (!garden.honoree) {
          throw new HttpsError("failed-precondition", "Garden has no honoree.");
        }
        await garden.honoree.update(honoreeUpdates);
      }
    }

    return { success: true };
  }
);

// Lets the garden owner remove a single butterfly. Client-side butterfly
// writes are denied by Firestore rules (see the payment-integrity comment
// on the `butterflies` match block), so this runs server-side and is gated
// on garden ownership.
exports.deleteButterfly = onCall(
  {},
  async (request) => {
    const uid = request.auth?.uid;
    if (!uid) {
      throw new HttpsError("unauthenticated", "You must be signed in.");
    }

    const { gardenId, butterflyId } = request.data;
    if (!gardenId || !butterflyId) {
      throw new HttpsError("invalid-argument", "gardenId and butterflyId are required.");
    }

    await assertGardenOwner(gardenId, uid);

    const butterflyRef = db.doc(`butterflies/${butterflyId}`);
    const snap = await butterflyRef.get();
    if (!snap.exists) {
      // Already gone — deleting is idempotent from the caller's perspective.
      return { success: true };
    }
    const data = snap.data();
    if (data.gardenId !== gardenId) {
      throw new HttpsError("permission-denied", "This butterfly does not belong to that garden.");
    }
    if (data.color === "white") {
      throw new HttpsError("failed-precondition", "The garden's spirit butterfly can't be deleted.");
    }

    await butterflyRef.delete();
    return { success: true };
  }
);

// Lets the garden owner permanently delete the garden: every butterfly in
// it, its honoree record, and the garden document itself.
exports.deleteGarden = onCall(
  {},
  async (request) => {
    const uid = request.auth?.uid;
    if (!uid) {
      throw new HttpsError("unauthenticated", "You must be signed in.");
    }

    const { gardenId } = request.data;
    if (!gardenId) {
      throw new HttpsError("invalid-argument", "gardenId is required.");
    }

    const garden = await assertGardenOwner(gardenId, uid);

    // A garden's butterfly count is realistically nowhere near Firestore's
    // 500-write batch limit, so a single batch covers it.
    const butterfliesSnap = await db.collection("butterflies").where("gardenId", "==", gardenId).get();
    const batch = db.batch();
    butterfliesSnap.forEach((doc) => batch.delete(doc.ref));
    if (garden.honoree) {
      batch.delete(garden.honoree);
    }
    batch.delete(db.doc(`gardens/${gardenId}`));
    await batch.commit();

    return { success: true };
  }
);

// Contact form. Sends straight to the inbox over SMTP — nothing is stored.
// SMTP_HOST / SMTP_PORT / SMTP_USER are plain params (set in functions/.env);
// SMTP_PASS is a Firebase secret. Works with any SMTP provider (Google
// Workspace, Gmail app password, Resend, SendGrid, ...).
const smtpHost = defineString("SMTP_HOST");
const smtpPort = defineString("SMTP_PORT", { default: "465" });
const smtpUser = defineString("SMTP_USER");
const smtpPass = defineSecret("SMTP_PASS");

const CONTACT_TO = "info@butterflytribute.com";
const MAX_CONTACT_NAME_LEN = 80;
const MAX_CONTACT_MESSAGE_LEN = 3000;

const getSmtpPass = () => {
  if (!isEmulator) {
    try { return smtpPass.value(); } catch {}
  }
  return process.env.SMTP_PASS;
};

const escapeHtml = (s) =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

exports.sendContactMessage = onCall(
  isEmulator ? {} : { secrets: [smtpPass] },
  async (request) => {
    const { name, email, message, website } = request.data || {};

    // Honeypot: real visitors never see or fill this field. Pretend success
    // so bots don't learn to skip it.
    if (website) {
      return { success: true };
    }

    if (typeof email !== "string" || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      throw new HttpsError("invalid-argument", "Please enter a valid email address.");
    }
    if (typeof message !== "string" || !message.trim()) {
      throw new HttpsError("invalid-argument", "Please enter a message.");
    }
    if (message.length > MAX_CONTACT_MESSAGE_LEN) {
      throw new HttpsError("invalid-argument", "Message is too long.");
    }
    if (name !== undefined && (typeof name !== "string" || name.length > MAX_CONTACT_NAME_LEN)) {
      throw new HttpsError("invalid-argument", "Invalid name.");
    }

    // Strip CR/LF so visitor input can't inject extra mail headers.
    const cleanEmail = email.trim();
    const cleanName = (name || "").trim().replace(/[\r\n]+/g, " ");
    const cleanMessage = message.trim();
    const from = cleanName ? `${cleanName} <${cleanEmail}>` : cleanEmail;

    const port = Number(smtpPort.value());
    const transporter = require("nodemailer").createTransport({
      host: smtpHost.value(),
      port,
      secure: port === 465,
      auth: { user: smtpUser.value(), pass: getSmtpPass() },
    });

    try {
      await transporter.sendMail({
        // Send as the authenticated account (providers reject spoofed From
        // addresses); replying goes to the visitor via Reply-To.
        from: { name: "Butterfly Tribute Contact Form", address: smtpUser.value() },
        to: CONTACT_TO,
        replyTo: { name: cleanName, address: cleanEmail },
        subject: `Contact form: ${cleanName || cleanEmail}`,
        text: `From: ${from}\n\n${cleanMessage}`,
        html:
          `<p><strong>From:</strong> ${escapeHtml(from)}</p>` +
          `<p style="white-space:pre-wrap">${escapeHtml(cleanMessage)}</p>`,
      });
    } catch (err) {
      console.error("Contact email failed:", err);
      throw new HttpsError("internal", "We couldn't send your message right now. Please try again later.");
    }

    return { success: true };
  }
);
