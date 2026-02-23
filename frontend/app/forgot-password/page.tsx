"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { forgotPassword } from "@/lib/firebase";

export default function ForgotPasswordPage() {
    const router = useRouter();

    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (!email) {
            setError("Please enter your email.");
            return;
        }

        try {
            setLoading(true);
            setError("");

            // 🔥 Firebase reset email
            await forgotPassword(email);

            setSuccess(true);

        } catch (err: any) {
            setError(err.message || "Something went wrong.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-black text-white px-6">
            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-md backdrop-blur-2xl bg-black/40 border border-white/20 rounded-3xl p-10"
            >
                {!success ? (
                    <>
                        <h1 className="text-3xl font-semibold mb-6 text-center">
                            Reset Password
                        </h1>

                        <p className="text-sm text-white/60 mb-6 text-center">
                            Enter your email and we’ll send you a password reset link.
                        </p>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div>
                                <label className="block text-sm text-white/70 mb-2">
                                    Email
                                </label>
                                <input
                                    type="email"
                                    className="w-full bg-black/50 border border-white/20 rounded-xl px-4 py-3 focus:outline-none focus:border-[#c8ff00]"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
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
                                disabled={loading}
                                className="w-full bg-[#c8ff00] text-black py-3 rounded-xl font-semibold hover:opacity-90 transition disabled:opacity-60"
                            >
                                {loading ? "Sending..." : "Send Reset Link"}
                            </button>
                        </form>

                        <div className="text-center mt-6 text-sm">
                            <span
                                onClick={() => router.push("/login")}
                                className="text-white/50 hover:text-white cursor-pointer"
                            >
                                Back to Login
                            </span>
                        </div>
                    </>
                ) : (
                    <>
                        <h1 className="text-2xl font-semibold text-center mb-4">
                            Check Your Email
                        </h1>

                        <p className="text-white/70 text-center">
                            If an account with that email exists, you will receive a password
                            reset link shortly.
                        </p>

                        <button
                            onClick={() => router.push("/login")}
                            className="w-full mt-8 bg-[#c8ff00] text-black py-3 rounded-xl font-semibold"
                        >
                            Back to Login
                        </button>
                    </>
                )}
            </motion.div>
        </div>
    );
}