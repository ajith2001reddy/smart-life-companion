"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import { registerWithEmail } from "@/lib/firebase";

export default function RegisterPage() {
    const router = useRouter();
    const { login } = useAuth();

    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    async function handleRegister(e: React.FormEvent) {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            // 1️⃣ Firebase register
            const data = await registerWithEmail(email, password);

            // 2️⃣ Store backend JWT
            login(data.token);

            // 3️⃣ Redirect
            router.replace("/dashboard");

        } catch (err: any) {
            setError(err.message || "Registration failed.");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-black text-white px-6">
            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-md backdrop-blur-2xl bg-black/40 border border-white/20 rounded-3xl p-10"
            >
                <h1 className="text-4xl font-semibold mb-8 text-center">
                    Create Account
                </h1>

                <form onSubmit={handleRegister} className="space-y-6">

                    <input
                        type="text"
                        placeholder="Full Name"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full px-6 py-4 rounded-2xl bg-black/40 border border-white/20 outline-none"
                    />

                    <input
                        type="email"
                        placeholder="Email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full px-6 py-4 rounded-2xl bg-black/40 border border-white/20 outline-none"
                    />

                    <input
                        type="password"
                        placeholder="Password"
                        required
                        minLength={6}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full px-6 py-4 rounded-2xl bg-black/40 border border-white/20 outline-none"
                    />

                    {error && (
                        <div className="text-red-400 text-sm">
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-[#c8ff00] text-black py-4 rounded-2xl font-semibold disabled:opacity-50"
                    >
                        {loading ? "Creating account..." : "Register"}
                    </button>

                </form>

                <div className="mt-6 text-center text-sm text-white/60">
                    Already have an account?{" "}
                    <span
                        onClick={() => router.push("/login")}
                        className="text-[#c8ff00] cursor-pointer"
                    >
                        Login
                    </span>
                </div>

            </motion.div>
        </div>
    );
}