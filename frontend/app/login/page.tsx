"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import { signInWithGoogle, loginWithEmail } from "@/lib/firebase";
import { handleGoogleRedirectResult } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { firebaseAuth } from "@/lib/firebase";

export default function LoginPage() {
    const router = useRouter();
    const { login } = useAuth();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [gLoading, setGLoading] = useState(false);
    const [error, setError] = useState("");
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(firebaseAuth, async (user) => {
            if (!user) return;

            try {
                const idToken = await user.getIdToken();

                const res = await fetch(
                    `${process.env.NEXT_PUBLIC_API_URL}/api/auth/firebase-login`,
                    {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ idToken }),
                    }
                );

                const data = await res.json();

                if (res.ok && data.token) {
                    login(data.token);
                    router.replace("/dashboard");
                }
            } catch (err) {
                console.error("Google login failed:", err);
            }
        });

        return () => unsubscribe();
    }, []);
    // ─────────────────────────────────────────────
    // Email / Password Login (Firebase)
    // ─────────────────────────────────────────────
    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (!email || !password) {
            setError("Please fill all fields.");
            return;
        }

        try {
            setLoading(true);
            setError("");

            // 1️⃣ Firebase login
            const data = await loginWithEmail(email, password);

            // 2️⃣ Save backend JWT
            login(data.token);

            router.replace("/dashboard");

        } catch (err: any) {
            setError(err.message || "Login failed.");
        } finally {
            setLoading(false);
        }
    };

    // ─────────────────────────────────────────────
    // Google Login
    // ─────────────────────────────────────────────
    const handleGoogle = async () => {
        try {
            setGLoading(true);
            setError("");

            await signInWithGoogle(); // this redirects

        } catch (err: any) {
            if (err.message !== "Sign-in cancelled.") {
                setError(err.message || "Google sign-in failed.");
            }
            setGLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-black text-white px-6">
            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-md backdrop-blur-2xl bg-black/40 border border-white/20 rounded-3xl p-10"
            >
                <h1 className="text-3xl font-semibold mb-8 text-center">
                    Welcome Back
                </h1>

                {/* Google Button */}
                <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleGoogle}
                    disabled={gLoading || loading}
                    className="w-full flex items-center justify-center gap-3 bg-white text-black py-3 rounded-xl font-semibold hover:bg-gray-100 transition disabled:opacity-60 mb-6"
                >
                    {gLoading ? (
                        <motion.div
                            className="w-5 h-5 border-2 border-black border-t-transparent rounded-full"
                            animate={{ rotate: 360 }}
                            transition={{ duration: 0.7, repeat: Infinity, ease: "linear" }}
                        />
                    ) : (
                        <svg width="20" height="20" viewBox="0 0 24 24">
                            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                        </svg>
                    )}
                    {gLoading ? "Signing in..." : "Continue with Google"}
                </motion.button>

                {/* Divider */}
                <div className="flex items-center gap-4 mb-6">
                    <div className="flex-1 h-px bg-white/10" />
                    <span className="text-xs text-white/30 uppercase tracking-widest">or</span>
                    <div className="flex-1 h-px bg-white/10" />
                </div>

                {/* Email Form */}
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-sm text-white/70 mb-2">Email</label>
                        <input
                            type="email"
                            className="w-full bg-black/50 border border-white/20 rounded-xl px-4 py-3 focus:outline-none focus:border-[#c8ff00]"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm text-white/70 mb-2">Password</label>
                        <input
                            type="password"
                            className="w-full bg-black/50 border border-white/20 rounded-xl px-4 py-3 focus:outline-none focus:border-[#c8ff00]"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>

                    {error && (
                        <div className="text-red-400 text-sm text-center">
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading || gLoading}
                        className="w-full bg-[#c8ff00] text-black py-3 rounded-xl font-semibold hover:opacity-90 transition disabled:opacity-60"
                    >
                        {loading ? "Logging in..." : "Login"}
                    </button>
                </form>

                <div className="text-center mt-6 text-sm text-white/60">
                    Don't have an account?{" "}
                    <span
                        onClick={() => router.push("/register")}
                        className="text-[#c8ff00] cursor-pointer hover:underline"
                    >
                        Register
                    </span>
                </div>

                <div className="text-center mt-3 text-sm">
                    <span
                        onClick={() => router.push("/forgot-password")}
                        className="text-white/50 hover:text-white cursor-pointer"
                    >
                        Forgot Password?
                    </span>
                </div>
            </motion.div>
        </div>
    );
}