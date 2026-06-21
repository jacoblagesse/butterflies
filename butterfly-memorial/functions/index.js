const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { defineSecret } = require("firebase-functions/params");
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
const MAX_GIFTER_LEN = 80;
const MAX_MESSAGE_LEN = 500;

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
