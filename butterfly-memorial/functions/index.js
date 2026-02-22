const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { defineSecret } = require("firebase-functions/params");
const { initializeApp } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");

initializeApp();
const db = getFirestore();

const stripeSecretKey = defineSecret("STRIPE_SECRET_KEY");

exports.createPaymentIntent = onCall(
  { secrets: [stripeSecretKey] },
  async (request) => {
    // Require authentication
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "You must be signed in.");
    }

    const { gardenId, color, gifter, message } = request.data;

    if (!gardenId || !gifter || !message) {
      throw new HttpsError(
        "invalid-argument",
        "gardenId, gifter, and message are required."
      );
    }

    const stripe = require("stripe")(stripeSecretKey.value());

    const paymentIntent = await stripe.paymentIntents.create({
      amount: 99, // $0.99 in cents
      currency: "usd",
      payment_method_types: ["card"],
      metadata: {
        gardenId,
        color: color || "",
        gifter,
        message,
        uid: request.auth.uid,
      },
    });

    // Write pending payment record to Firestore
    await db.collection("payments").doc(paymentIntent.id).set({
      uid: request.auth.uid,
      gardenId,
      color: color || null,
      gifter,
      message,
      amount: 99,
      currency: "usd",
      status: "pending",
      createdAt: new Date(),
    });

    return { clientSecret: paymentIntent.client_secret };
  }
);

exports.confirmPayment = onCall(
  { secrets: [stripeSecretKey] },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "You must be signed in.");
    }

    const { paymentIntentId } = request.data;

    if (!paymentIntentId) {
      throw new HttpsError(
        "invalid-argument",
        "paymentIntentId is required."
      );
    }

    const stripe = require("stripe")(stripeSecretKey.value());

    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.status !== "succeeded") {
      throw new HttpsError(
        "failed-precondition",
        `Payment not succeeded. Status: ${paymentIntent.status}`
      );
    }

    // Verify the payment belongs to this user
    if (paymentIntent.metadata.uid !== request.auth.uid) {
      throw new HttpsError("permission-denied", "Payment does not belong to you.");
    }

    // Update payment record in Firestore
    await db.collection("payments").doc(paymentIntentId).update({
      status: "succeeded",
      confirmedAt: new Date(),
    });

    return {
      verified: true,
      gardenId: paymentIntent.metadata.gardenId,
      color: paymentIntent.metadata.color,
      gifter: paymentIntent.metadata.gifter,
      message: paymentIntent.metadata.message,
    };
  }
);
