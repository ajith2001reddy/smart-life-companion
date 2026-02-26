// ============================================================
// frontend/lib/firebase.ts
// ============================================================

import { initializeApp, getApps } from "firebase/app";
import {
    getAuth,
    GoogleAuthProvider,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    sendPasswordResetEmail,
    setPersistence,
    browserLocalPersistence,
    signInWithRedirect,
    signInWithPopup,
    getRedirectResult,
} from "firebase/auth";

// ─────────────────────────────────────────────
// Firebase Config (from .env.local)
// ─────────────────────────────────────────────
const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Prevent duplicate initialization
const app =
    getApps().length === 0
        ? initializeApp(firebaseConfig)
        : getApps()[0];

export const firebaseAuth = getAuth(app);

setPersistence(firebaseAuth, browserLocalPersistence).catch((err) => {
    console.error("Persistence error:", err);
});

// ─────────────────────────────────────────────
// Google Provider
// ─────────────────────────────────────────────
const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: "select_account" });

// ============================================================
// GOOGLE LOGIN
// Uses redirect flow (works reliably on Vercel deployments).
// Falls back to popup on localhost for faster dev iteration.
// ============================================================
export async function signInWithGoogle() {
    const isLocalhost =
        typeof window !== "undefined" &&
        (window.location.hostname === "localhost" ||
            window.location.hostname === "127.0.0.1");

    if (isLocalhost) {
        // Popup is faster in local dev and avoids localhost redirect issues
        const result = await signInWithPopup(firebaseAuth, googleProvider);
        const idToken = await result.user.getIdToken();

        const res = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/api/auth/firebase-login`,
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ idToken }),
            }
        );

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Backend authentication failed.");
        return data; // { token, ... }
    }

    // Production (Vercel): use redirect flow
    await signInWithRedirect(firebaseAuth, googleProvider);
    // NOTE: page reloads — caller should not expect a return value
}

// ============================================================
// EMAIL REGISTER
// ============================================================
export async function registerWithEmail(email: string, password: string) {
    const result = await createUserWithEmailAndPassword(
        firebaseAuth,
        email,
        password
    );

    const idToken = await result.user.getIdToken();

    const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/auth/firebase-login`,
        {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ idToken }),
        }
    );

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Registration failed.");

    return data;
}

// ============================================================
// EMAIL LOGIN
// ============================================================
export async function loginWithEmail(email: string, password: string) {
    const result = await signInWithEmailAndPassword(
        firebaseAuth,
        email,
        password
    );

    const idToken = await result.user.getIdToken();

    const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/auth/firebase-login`,
        {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ idToken }),
        }
    );

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Login failed.");

    return data;
}

// ============================================================
// FORGOT PASSWORD
// ============================================================
export async function forgotPassword(email: string) {
    await sendPasswordResetEmail(firebaseAuth, email);
}