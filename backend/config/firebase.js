// ============================================================
// backend/config/firebase.js
// Firebase Admin SDK (v13+ modular setup)
// ============================================================

const { initializeApp, cert, getApps } = require("firebase-admin/app");
const { getAuth } = require("firebase-admin/auth");

// Prevent duplicate initialization (important in dev)
if (!getApps().length) {
    initializeApp({
        credential: cert({
            projectId: process.env.FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey: process.env.FIREBASE_PRIVATE_KEY
                ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n")
                : undefined,
        }),
    });

    console.log("🔥 Firebase Admin initialized");
}

module.exports = { getAuth };