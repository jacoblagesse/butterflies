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

exports.createPaymentIntent = onCall(
  fnConfig,
  async (request) => {
    const { gardenId, color, gifter, email, message } = request.data;

    if (!gardenId || !gifter || !message) {
      throw new HttpsError(
        "invalid-argument",
        "gardenId, gifter, and message are required."
      );
    }

    const uid = request.auth?.uid || null;
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
      metadata: {
        gardenId,
        color: color || "",
        gifter,
        email: email || "",
        message,
        uid: uid || "",
      },
    });

    // Write pending payment record to Firestore (non-critical in emulator)
    try {
      await db.collection("payments").doc(paymentIntent.id).set({
        uid,
        gardenId,
        color: color || null,
        gifter,
        email: email || null,
        message,
        amount: 199,
        currency: "usd",
        status: "pending",
        createdAt: new Date(),
      });
    } catch (err) {
      console.warn("Firestore write failed (ok in emulator):", err.message);
    }

    return { clientSecret: paymentIntent.client_secret };
  }
);

exports.confirmPayment = onCall(
  fnConfig,
  async (request) => {
    const { paymentIntentId } = request.data;

    if (!paymentIntentId) {
      throw new HttpsError(
        "invalid-argument",
        "paymentIntentId is required."
      );
    }

    const stripe = require("stripe")(getStripeKey());

    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.status !== "succeeded") {
      throw new HttpsError(
        "failed-precondition",
        `Payment not succeeded. Status: ${paymentIntent.status}`
      );
    }

    // Update payment record in Firestore (non-critical in emulator)
    try {
      await db.collection("payments").doc(paymentIntentId).update({
        status: "succeeded",
        confirmedAt: new Date(),
      });
    } catch (err) {
      console.warn("Firestore update failed (ok in emulator):", err.message);
    }

    const meta = paymentIntent.metadata;

    // Create the butterfly document server-side so no client auth is needed
    let butterflyId = null;
    try {
      const gardenRef = db.doc(`gardens/${meta.gardenId}`);
      const butterflyRef = await db.collection("butterflies").add({
        gifter: meta.gifter,
        email: meta.email || null,
        message: meta.message,
        garden: gardenRef,
        gardenId: meta.gardenId,
        color: meta.color || null,
        uid: meta.uid || null,
        created: new Date(),
      });
      butterflyId = butterflyRef.id;
    } catch (err) {
      console.warn("Butterfly creation failed:", err.message);
    }

    return {
      verified: true,
      butterflyId,
      gardenId: meta.gardenId,
      color: meta.color,
      gifter: meta.gifter,
      message: meta.message,
    };
  }
);
