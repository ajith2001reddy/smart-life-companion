"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { forgotPassword } from "@/lib/firebase";

/* ── Steps shown on right panel ── */
const STEPS = [
    { num: "01", title: "Enter your email", desc: "Provide the email linked to your account", active: true },
    { num: "02", title: "Check your inbox", desc: "We'll send a secure reset link within seconds", active: false },
    { num: "03", title: "Set new password", desc: "Create a strong password to protect your account", active: false },
];

/* ── Security badges ── */
const BADGES = [
    { icon: "🔐", label: "256-bit encryption", color: "#c8ff00" },
    { icon: "⏱", label: "Link expires in 1hr", color: "#00CFFF" },
    { icon: "🛡", label: "Zero-knowledge auth", color: "#a78bfa" },
];

export default function ForgotPasswordPage() {
    const router = useRouter();

    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!email) { setError("Please enter your email."); return; }
        try {
            setLoading(true);
            setError("");
            await forgotPassword(email);
            setSuccess(true);
        } catch (err: any) {
            setError(err.message || "Something went wrong.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a] px-4 py-8"
            style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}>

            {/* Ambient glows */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden">
                <div className="absolute top-[-20%] left-[-5%] w-[500px] h-[500px] rounded-full"
                    style={{ background: "radial-gradient(circle, rgba(0,207,255,0.06) 0%, transparent 70%)" }} />
                <div className="absolute bottom-[-15%] right-[-10%] w-[400px] h-[400px] rounded-full"
                    style={{ background: "radial-gradient(circle, rgba(200,255,0,0.04) 0%, transparent 70%)" }} />
            </div>

            {/* Card */}
            <motion.div
                initial={{ opacity: 0, scale: 0.96, y: 24 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                className="relative w-full max-w-5xl flex rounded-[2.5rem] overflow-hidden"
                style={{
                    background: "#111111",
                    border: "1px solid rgba(255,255,255,0.07)",
                    boxShadow: "0 40px 120px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.04)",
                    minHeight: "560px",
                }}
            >
                {/* ════ LEFT FORM PANEL ════ */}
                <div className="relative z-10 flex flex-col justify-between w-full md:w-[45%] p-8 sm:p-10 lg:p-12">

                    {/* Logo */}
                    <motion.div initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}
                        className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center text-black font-black text-sm"
                            style={{ background: "#c8ff00" }}>SL</div>
                        <span className="text-white font-semibold tracking-tight">Smart Life</span>
                    </motion.div>

                    {/* Content — switches between form and success */}
                    <div className="flex-1 flex flex-col justify-center my-8">
                        <AnimatePresence mode="wait">
                            {!success ? (
                                /* ── REQUEST FORM ── */
                                <motion.div key="form"
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 20 }}
                                    transition={{ duration: 0.35 }}>

                                    {/* Icon */}
                                    <motion.div
                                        initial={{ scale: 0, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                        transition={{ delay: 0.15, type: "spring", stiffness: 200 }}
                                        className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl mb-6"
                                        style={{ background: "rgba(0,207,255,0.1)", border: "1px solid rgba(0,207,255,0.2)" }}>
                                        🔑
                                    </motion.div>

                                    <motion.h1 initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                                        className="text-3xl sm:text-4xl font-bold text-white mb-2 tracking-tight">
                                        Reset password
                                    </motion.h1>
                                    <motion.p initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
                                        className="text-sm mb-8" style={{ color: "rgba(255,255,255,0.4)" }}>
                                        Enter your email and we'll send a reset link instantly
                                    </motion.p>

                                    <motion.form onSubmit={handleSubmit}
                                        initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                                        className="space-y-4">

                                        {/* Email */}
                                        <div className="space-y-1.5">
                                            <label className="text-[11px] font-semibold uppercase tracking-widest"
                                                style={{ color: "rgba(255,255,255,0.35)" }}>Email address</label>
                                            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                                                placeholder="you@example.com" required
                                                className="w-full px-4 py-3.5 rounded-2xl text-sm text-white outline-none transition-all placeholder:text-white/20"
                                                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}
                                                onFocus={(e) => e.currentTarget.style.borderColor = "rgba(0,207,255,0.4)"}
                                                onBlur={(e) => e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"} />
                                        </div>

                                        {/* Error */}
                                        <AnimatePresence>
                                            {error && (
                                                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
                                                    exit={{ opacity: 0, height: 0 }}
                                                    className="text-sm text-red-400 px-4 py-2.5 rounded-xl overflow-hidden"
                                                    style={{ background: "rgba(255,77,77,0.1)", border: "1px solid rgba(255,77,77,0.2)" }}>
                                                    {error}
                                                </motion.div>
                                            )}
                                        </AnimatePresence>

                                        {/* Submit */}
                                        <motion.button type="submit" disabled={loading}
                                            whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
                                            className="w-full py-3.5 rounded-2xl font-bold text-sm text-black transition-all disabled:opacity-60 flex items-center justify-center gap-2"
                                            style={{ background: "linear-gradient(135deg, #00cfff 0%, #0099cc 100%)" }}>
                                            {loading ? (
                                                <motion.div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full"
                                                    animate={{ rotate: 360 }} transition={{ duration: 0.7, repeat: Infinity, ease: "linear" }} />
                                            ) : "Send Reset Link →"}
                                        </motion.button>
                                    </motion.form>
                                </motion.div>
                            ) : (
                                /* ── SUCCESS STATE ── */
                                <motion.div key="success"
                                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                                    className="text-center">

                                    {/* Animated checkmark */}
                                    <motion.div
                                        initial={{ scale: 0, rotate: -180 }}
                                        animate={{ scale: 1, rotate: 0 }}
                                        transition={{ type: "spring", stiffness: 200, damping: 15 }}
                                        className="w-20 h-20 rounded-full flex items-center justify-center text-3xl mx-auto mb-6"
                                        style={{ background: "rgba(200,255,0,0.1)", border: "2px solid rgba(200,255,0,0.3)" }}>
                                        ✅
                                    </motion.div>

                                    {/* Pulse ring */}
                                    <motion.div
                                        className="absolute w-24 h-24 rounded-full left-1/2 -translate-x-1/2 -mt-[6.5rem]"
                                        style={{ border: "2px solid rgba(200,255,0,0.15)" }}
                                        animate={{ scale: [1, 1.5, 1.5], opacity: [0.5, 0, 0] }}
                                        transition={{ duration: 1.5, repeat: Infinity, ease: "easeOut" }}
                                    />

                                    <motion.h2 initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                                        className="text-2xl font-bold text-white mb-2">
                                        Check your inbox
                                    </motion.h2>
                                    <motion.p initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                                        className="text-sm mb-2" style={{ color: "rgba(255,255,255,0.5)" }}>
                                        We sent a reset link to
                                    </motion.p>
                                    <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.35 }}
                                        className="text-sm font-semibold mb-8 px-4 py-2 rounded-xl inline-block"
                                        style={{ color: "#c8ff00", background: "rgba(200,255,0,0.08)", border: "1px solid rgba(200,255,0,0.15)" }}>
                                        {email}
                                    </motion.p>

                                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
                                        className="space-y-3">
                                        <motion.button onClick={() => router.push("/login")}
                                            whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
                                            className="w-full py-3.5 rounded-2xl font-bold text-sm text-black"
                                            style={{ background: "linear-gradient(135deg, #c8ff00 0%, #aaee00 100%)" }}>
                                            Back to Sign In →
                                        </motion.button>
                                        <button onClick={() => setSuccess(false)}
                                            className="w-full py-3 text-sm transition-colors"
                                            style={{ color: "rgba(255,255,255,0.3)" }}
                                            onMouseEnter={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.7)")}
                                            onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.3)")}>
                                            Didn't receive it? Try again
                                        </button>
                                    </motion.div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Footer */}
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
                        className="flex items-center justify-between text-xs"
                        style={{ color: "rgba(255,255,255,0.3)" }}>
                        <span onClick={() => router.push("/login")}
                            className="cursor-pointer flex items-center gap-1.5 transition-colors"
                            style={{ color: "rgba(255,255,255,0.35)" }}
                            onMouseEnter={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.7)")}
                            onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.35)")}>
                            ← Back to login
                        </span>
                        <span>
                            New here?{" "}
                            <span onClick={() => router.push("/register")} className="cursor-pointer underline underline-offset-2"
                                style={{ color: "#c8ff00" }}>Sign up free</span>
                        </span>
                    </motion.div>
                </div>

                {/* ════ RIGHT VISUAL PANEL ════ */}
                <div className="hidden md:block relative flex-1 rounded-r-[2.5rem] overflow-hidden"
                    style={{ background: "linear-gradient(145deg, #00111a 0%, #000d14 50%, #000609 100%)" }}>

                    {/* Mesh glows */}
                    <div className="absolute inset-0">
                        <div className="absolute top-[-10%] right-[-5%] w-80 h-80 rounded-full opacity-30"
                            style={{ background: "radial-gradient(circle, #00cfff 0%, transparent 70%)", filter: "blur(65px)" }} />
                        <div className="absolute bottom-[10%] left-[-5%] w-56 h-56 rounded-full opacity-20"
                            style={{ background: "radial-gradient(circle, #c8ff00 0%, transparent 70%)", filter: "blur(50px)" }} />
                    </div>

                    {/* Grid lines */}
                    <div className="absolute inset-0 opacity-[0.04]"
                        style={{
                            backgroundImage: `linear-gradient(rgba(0,207,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(0,207,255,1) 1px, transparent 1px)`,
                            backgroundSize: "40px 40px",
                        }} />

                    {/* Steps card */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.45 }}
                        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-2xl p-5 w-56"
                        style={{
                            background: "rgba(0,17,26,0.88)",
                            border: "1px solid rgba(255,255,255,0.09)",
                            backdropFilter: "blur(24px)",
                            boxShadow: "0 8px 40px rgba(0,0,0,0.5)",
                        }}>
                        <div className="absolute top-0 left-4 right-4 h-px rounded-full"
                            style={{ background: "linear-gradient(90deg, transparent, rgba(0,207,255,0.5), transparent)" }} />
                        <p className="text-[10px] font-semibold uppercase tracking-widest mb-5"
                            style={{ color: "rgba(255,255,255,0.3)" }}>How it works</p>

                        <div className="space-y-4">
                            {STEPS.map((step, i) => (
                                <motion.div key={step.num}
                                    initial={{ opacity: 0, x: -12 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.55 + i * 0.1 }}
                                    className="flex items-start gap-3">
                                    <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-[10px] font-black"
                                        style={{
                                            background: i === 0 ? "rgba(0,207,255,0.15)" : "rgba(255,255,255,0.04)",
                                            border: `1px solid ${i === 0 ? "rgba(0,207,255,0.3)" : "rgba(255,255,255,0.08)"}`,
                                            color: i === 0 ? "#00cfff" : "rgba(255,255,255,0.25)",
                                        }}>
                                        {step.num}
                                    </div>
                                    <div>
                                        <p className={`text-xs font-semibold ${i === 0 ? "text-white" : ""}`}
                                            style={{ color: i === 0 ? "white" : "rgba(255,255,255,0.4)" }}>
                                            {step.title}
                                        </p>
                                        <p className="text-[10px] leading-snug mt-0.5"
                                            style={{ color: "rgba(255,255,255,0.25)" }}>{step.desc}</p>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>

                    {/* Security badges */}
                    {BADGES.map((b, i) => {
                        const positions = [
                            { top: "10%", left: "8%" },
                            { bottom: "16%", right: "6%" },
                            { top: "60%", left: "5%" },
                        ];
                        const pos = positions[i];
                        return (
                            <motion.div key={b.label}
                                initial={{ opacity: 0, scale: 0.85 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 0.6 + i * 0.12, duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                                style={{
                                    position: "absolute",
                                    ...pos,
                                    background: "rgba(0,17,26,0.85)",
                                    border: "1px solid rgba(255,255,255,0.09)",
                                    backdropFilter: "blur(20px)",
                                    borderRadius: "0.875rem",
                                    padding: "10px 14px",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "8px",
                                    boxShadow: `0 4px 20px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.04)`,
                                }}>
                                <div className="absolute top-0 left-2 right-2 h-px rounded-full"
                                    style={{ background: `linear-gradient(90deg, transparent, ${b.color}40, transparent)` }} />
                                <span className="text-sm">{b.icon}</span>
                                <span className="text-[10px] font-semibold whitespace-nowrap"
                                    style={{ color: "rgba(255,255,255,0.5)" }}>
                                    {b.label}
                                </span>
                            </motion.div>
                        );
                    })}

                    {/* Decorative rings */}
                    <div className="absolute top-[35%] right-[20%] w-20 h-20 rounded-full pointer-events-none"
                        style={{ border: "1px solid rgba(0,207,255,0.08)" }} />
                    <div className="absolute top-[32%] right-[16%] w-36 h-36 rounded-full pointer-events-none"
                        style={{ border: "1px solid rgba(0,207,255,0.04)" }} />

                    {/* Brand watermark */}
                    <div className="absolute bottom-6 right-6">
                        <p className="text-[10px] font-semibold tracking-[0.3em] uppercase"
                            style={{ color: "rgba(0,207,255,0.2)" }}>Smart Life</p>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}