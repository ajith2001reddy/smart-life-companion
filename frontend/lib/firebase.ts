// ============================================================
// frontend/lib/firebase.ts
//
// Handles:
// - Google Login
// - Email/Password Register
// - Email/Password Login
// - Forgot Password
//
// Firebase handles authentication.
// Backend verifies ID token and returns JWT.
// ============================================================

import { initializeApp, getApps } from "firebase/app";
import { getRedirectResult } from "firebase/auth";
import {
    getAuth,
    GoogleAuthProvider,
    signInWithPopup,
    signInWithRedirect,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    sendPasswordResetEmail,
    signOut,
    type UserCredential,
} from "firebase/auth";
// ============================================================
// HANDLE GOOGLE REDIRECT RESULT (NEW - ADD ONLY)
// ============================================================
export async function handleGoogleRedirectResult() {
    const result = await getRedirectResult(firebaseAuth);

    if (!result?.user) return null;

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

    if (!res.ok) {
        throw new Error(data.error || "Backend authentication failed.");
    }

    await signOut(firebaseAuth);

    return data;
}
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

// ─────────────────────────────────────────────
// Google Provider
// ─────────────────────────────────────────────
const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
    prompt: "select_account",
});

// ============================================================
// GOOGLE LOGIN
// ============================================================
export async function signInWithGoogle() {
    let result: UserCredential;

    try {
        result = await signInWithRedirect(firebaseAuth, googleProvider);
    } catch (err: any) {
        if (err.code === "auth/popup-closed-by-user") {
            throw new Error("Sign-in cancelled.");
        }
        if (err.code === "auth/popup-blocked") {
            throw new Error("Popup blocked. Allow popups for this site.");
        }
        throw new Error(err.message || "Google sign-in failed.");
    }

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

    if (!res.ok) {
        throw new Error(data.error || "Backend authentication failed.");
    }

    await signOut(firebaseAuth);

    return data; // { token, userId }
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

    if (!res.ok) {
        throw new Error(data.error || "Registration failed.");
    }

    await signOut(firebaseAuth);

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

    if (!res.ok) {
        throw new Error(data.error || "Login failed.");
    }

    await signOut(firebaseAuth);

    return data;
}

// ============================================================
// FORGOT PASSWORD
// ============================================================
export async function forgotPassword(email: string) {
    await sendPasswordResetEmail(firebaseAuth, email);
}