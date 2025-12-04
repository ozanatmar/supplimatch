// Load environment variables from .env
const dotenv = require("dotenv");
dotenv.config();

// Firebase Functions v2 (CommonJS)
const {onCall, HttpsError} = require("firebase-functions/v2/https");
const logger = require("firebase-functions/logger");

// Admin SDK
const admin = require("firebase-admin");
admin.initializeApp();
const db = admin.firestore();

// Import moderation handler
const {moderateProduct} = require("./moderation");

// ========== CREATE REQUEST (CALLABLE) ==========
exports.createRequest = onCall(async (request) => {
  logger.debug("Callable request verification passed", {
    verifications: request.verifications,
  });

  const uid = (request.auth && request.auth.uid) || null;
  if (!uid) {
    throw new HttpsError("unauthenticated", "Must be logged in.");
  }

  const {
    product,
    form,
    packageQty,
    packagingType,
    unitQty,
    unitType,
    locationScope,
    locationValue,
    locationLabel,
  } = request.data || {};

  // Validate required fields
  if (
    !product ||
    !form ||
    !packagingType ||
    !unitType ||
    !locationScope ||
    !locationLabel ||
    typeof packageQty !== "number" ||
    typeof unitQty !== "number"
  ) {
    throw new HttpsError(
        "invalid-argument",
        "Missing or invalid request fields.",
    );
  }

  // Run moderation check
  const moderationResult = await moderateProduct(product);

  const docRef = await db.collection("requests").add({
    brandOwnerId: uid,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    product,
    form,
    packageQty,
    packagingType,
    unitQty,
    unitType,
    locationScope,
    locationValue,
    locationLabel,
    active: moderationResult.passed,
    moderationReason: moderationResult.reason,
  });

  return {
    id: docRef.id,
    active: moderationResult.passed,
    reason: moderationResult.reason,
  };
});
