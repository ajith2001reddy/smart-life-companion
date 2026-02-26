"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import { signInWithGoogle, loginWithEmail } from "@/lib/firebase";

/* ── Floating stat cards shown on the right panel ── */
const FLOAT_CARDS = [
    {
        id: "steps",
        icon: "👟",
        label: "Daily Steps",
        value: "12,480",
        sub: "↑ 18% vs yesterday",
        color: "#c8ff00",
        top: "8%",
        left: "5%",
        delay: 0,
    },
    {
        id: "readiness",
        icon: "⚡",
        label: "Readiness Score",
        value: "87",
        sub: "High intensity recommended",
        color: "#00CFFF",
        top: "38%",
        right: "4%",
        delay: 0.15,
    },
    {
        id: "sleep",
        icon: "🌙",
        label: "Sleep Last Night",
        value: "8.2 hrs",
        sub: "Deep sleep: 2h 14m",
        color: "#a78bfa",
        bottom: "14%",
        left: "8%",
        delay: 0.3,
    },
];

/* ── Weekly bar data for the mini chart ── */
const BARS = [
    { day: "M", h: 55, active: false },
    { day: "T", h: 80, active: false },
    { day: "W", h: 65, active: false },
    { day: "T", h: 90, active: false },
    { day: "F", h: 72, active: true },
    { day: "S", h: 40, active: false },
    { day: "S", h: 0, active: false },
];

export default function LoginPage() {
    const router = useRouter();
    const { login } = useAuth();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPass, setShowPass] = useState(false);
    const [loading, setLoading] = useState(false);
    const [gLoading, setGLoading] = useState(false);
    const [error, setError] = useState("");
    const [mounted, setMounted] = useState(false);

    useEffect(() => { setMounted(true); }, []);

    const handleGoogle = async () => {
        try {
            setGLoading(true);
            setError("");
            const data = await signInWithGoogle();
            login(data.token);
            router.replace("/dashboard");
        } catch (err: any) {
            if (err?.code !== "auth/popup-closed-by-user") {
                setError(err.message || "Google sign-in failed.");
            }
            setGLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email || !password) { setError("Please fill all fields."); return; }
        try {
            setLoading(true);
            setError("");
            const data = await loginWithEmail(email, password);
            login(data.token);
            router.replace("/dashboard");
        } catch (err: any) {
            setError(err.message || "Login failed.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a] px-4 py-8"
            style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}>

            {/* ── Ambient background glow ── */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden">
                <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full"
                    style={{ background: "radial-gradient(circle, rgba(200,255,0,0.06) 0%, transparent 70%)" }} />
                <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full"
                    style={{ background: "radial-gradient(circle, rgba(0,207,255,0.05) 0%, transparent 70%)" }} />
            </div>

            {/* ── Card container ── */}
            <motion.div
                initial={{ opacity: 0, scale: 0.96, y: 24 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                className="relative w-full max-w-5xl flex rounded-[2.5rem] overflow-hidden shadow-2xl"
                style={{
                    background: "#111111",
                    border: "1px solid rgba(255,255,255,0.07)",
                    boxShadow: "0 40px 120px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.04)",
                    minHeight: "600px",
                }}
            >
                {/* ════════ LEFT — FORM PANEL ════════ */}
                <div className="relative z-10 flex flex-col justify-between w-full md:w-[45%] p-8 sm:p-10 lg:p-12">

                    {/* Logo */}
                    <motion.div
                        initial={{ opacity: 0, x: -16 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 }}
                        className="flex items-center gap-2.5"
                    >
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center text-black font-black text-sm"
                            style={{ background: "#c8ff00" }}>
                            SL
                        </div>
                        <span className="text-white font-semibold tracking-tight">Smart Life</span>
                    </motion.div>

                    {/* Heading */}
                    <div className="my-8">
                        <motion.h1
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.15 }}
                            className="text-3xl sm:text-4xl font-bold text-white mb-2 tracking-tight"
                        >
                            Welcome back
                        </motion.h1>
                        <motion.p
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="text-sm"
                            style={{ color: "rgba(255,255,255,0.4)" }}
                        >
                            Sign in to your performance dashboard
                        </motion.p>
                    </div>

                    {/* Form */}
                    <motion.form
                        onSubmit={handleSubmit}
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.25 }}
                        className="space-y-4 flex-1"
                    >
                        {/* Email */}
                        <div className="space-y-1.5">
                            <label className="text-[11px] font-semibold uppercase tracking-widest"
                                style={{ color: "rgba(255,255,255,0.35)" }}>
                                Email
                            </label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="you@example.com"
                                required
                                className="w-full px-4 py-3.5 rounded-2xl text-sm text-white outline-none transition-all placeholder:text-white/20"
                                style={{
                                    background: "rgba(255,255,255,0.05)",
                                    border: "1px solid rgba(255,255,255,0.08)",
                                }}
                                onFocus={(e) => e.currentTarget.style.borderColor = "rgba(200,255,0,0.4)"}
                                onBlur={(e) => e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"}
                            />
                        </div>

                        {/* Password */}
                        <div className="space-y-1.5">
                            <div className="flex items-center justify-between">
                                <label className="text-[11px] font-semibold uppercase tracking-widest"
                                    style={{ color: "rgba(255,255,255,0.35)" }}>
                                    Password
                                </label>
                                <span
                                    onClick={() => router.push("/forgot-password")}
                                    className="text-[11px] cursor-pointer transition-colors"
                                    style={{ color: "rgba(200,255,0,0.7)" }}
                                    onMouseEnter={(e) => (e.currentTarget.style.color = "#c8ff00")}
                                    onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(200,255,0,0.7)")}
                                >
                                    Forgot password?
                                </span>
                            </div>
                            <div className="relative">
                                <input
                                    type={showPass ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••••••"
                                    required
                                    className="w-full px-4 py-3.5 pr-12 rounded-2xl text-sm text-white outline-none transition-all placeholder:text-white/20"
                                    style={{
                                        background: "rgba(255,255,255,0.05)",
                                        border: "1px solid rgba(255,255,255,0.08)",
                                    }}
                                    onFocus={(e) => e.currentTarget.style.borderColor = "rgba(200,255,0,0.4)"}
                                    onBlur={(e) => e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPass((v) => !v)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-base transition-opacity"
                                    style={{ color: "rgba(255,255,255,0.3)" }}
                                >
                                    {showPass ? "🙈" : "👁"}
                                </button>
                            </div>
                        </div>

                        {/* Error */}
                        <AnimatePresence>
                            {error && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: "auto" }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="text-sm text-red-400 px-4 py-2.5 rounded-xl"
                                    style={{ background: "rgba(255,77,77,0.1)", border: "1px solid rgba(255,77,77,0.2)" }}
                                >
                                    {error}
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Submit */}
                        <motion.button
                            type="submit"
                            disabled={loading || gLoading}
                            whileHover={{ scale: 1.01 }}
                            whileTap={{ scale: 0.98 }}
                            className="w-full py-3.5 rounded-2xl font-bold text-sm text-black transition-all disabled:opacity-60 flex items-center justify-center gap-2"
                            style={{ background: "linear-gradient(135deg, #c8ff00 0%, #aaee00 100%)" }}
                        >
                            {loading ? (
                                <motion.div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full"
                                    animate={{ rotate: 360 }} transition={{ duration: 0.7, repeat: Infinity, ease: "linear" }} />
                            ) : "Sign In →"}
                        </motion.button>

                        {/* Divider */}
                        <div className="flex items-center gap-3 py-1">
                            <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.07)" }} />
                            <span className="text-[11px] font-medium tracking-widest uppercase"
                                style={{ color: "rgba(255,255,255,0.2)" }}>or</span>
                            <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.07)" }} />
                        </div>

                        {/* Google */}
                        <motion.button
                            type="button"
                            onClick={handleGoogle}
                            disabled={loading || gLoading}
                            whileHover={{ scale: 1.01 }}
                            whileTap={{ scale: 0.98 }}
                            className="w-full py-3.5 rounded-2xl text-sm font-semibold transition-all disabled:opacity-60 flex items-center justify-center gap-3"
                            style={{
                                background: "rgba(255,255,255,0.05)",
                                border: "1px solid rgba(255,255,255,0.1)",
                                color: "rgba(255,255,255,0.8)",
                            }}
                        >
                            {gLoading ? (
                                <motion.div className="w-4 h-4 border-2 border-white/40 border-t-transparent rounded-full"
                                    animate={{ rotate: 360 }} transition={{ duration: 0.7, repeat: Infinity, ease: "linear" }} />
                            ) : (
                                <>
                                    <svg width="18" height="18" viewBox="0 0 24 24">
                                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                                    </svg>
                                    Continue with Google
                                </>
                            )}
                        </motion.button>
                    </motion.form>

                    {/* Footer */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.4 }}
                        className="mt-8 flex items-center justify-between text-xs"
                        style={{ color: "rgba(255,255,255,0.3)" }}
                    >
                        <span>
                            No account?{" "}
                            <span
                                onClick={() => router.push("/register")}
                                className="cursor-pointer underline underline-offset-2 transition-colors"
                                style={{ color: "#c8ff00" }}
                            >
                                Sign up free
                            </span>
                        </span>
                        <span className="text-[10px]">Privacy · Terms</span>
                    </motion.div>
                </div>

                {/* ════════ RIGHT — VISUAL PANEL ════════ */}
                <div
                    className="hidden md:block relative flex-1 rounded-r-[2.5rem] overflow-hidden"
                    style={{
                        background: "linear-gradient(145deg, #0f1a00 0%, #0a1200 40%, #050d00 100%)",
                    }}
                >
                    {/* Mesh gradient */}
                    <div className="absolute inset-0">
                        <div className="absolute top-0 right-0 w-80 h-80 rounded-full opacity-30"
                            style={{ background: "radial-gradient(circle, #c8ff00 0%, transparent 70%)", filter: "blur(60px)" }} />
                        <div className="absolute bottom-0 left-0 w-64 h-64 rounded-full opacity-20"
                            style={{ background: "radial-gradient(circle, #00cfff 0%, transparent 70%)", filter: "blur(50px)" }} />
                    </div>

                    {/* Grid pattern overlay */}
                    <div className="absolute inset-0 opacity-[0.04]"
                        style={{
                            backgroundImage: `linear-gradient(rgba(200,255,0,1) 1px, transparent 1px), linear-gradient(90deg, rgba(200,255,0,1) 1px, transparent 1px)`,
                            backgroundSize: "40px 40px",
                        }} />

                    {/* Central glow orb */}
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-48 h-48 rounded-full opacity-15"
                            style={{ background: "radial-gradient(circle, #c8ff00 0%, transparent 70%)", filter: "blur(20px)" }} />
                    </div>

                    {/* Mini bar chart */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 }}
                        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-2xl p-5"
                        style={{
                            background: "rgba(255,255,255,0.04)",
                            border: "1px solid rgba(255,255,255,0.08)",
                            backdropFilter: "blur(20px)",
                            width: "200px",
                        }}
                    >
                        <p className="text-[10px] font-semibold uppercase tracking-widest mb-3"
                            style={{ color: "rgba(255,255,255,0.4)" }}>
                            Weekly Volume
                        </p>
                        <div className="flex items-end gap-1.5 h-14">
                            {BARS.map((b, i) => (
                                <motion.div
                                    key={i}
                                    className="flex-1 flex flex-col items-center gap-1"
                                    initial={{ scaleY: 0 }}
                                    animate={{ scaleY: 1 }}
                                    transition={{ delay: 0.6 + i * 0.06, duration: 0.4, ease: "easeOut" }}
                                    style={{ transformOrigin: "bottom" }}
                                >
                                    <div
                                        className="w-full rounded-sm"
                                        style={{
                                            height: `${b.h}%`,
                                            background: b.active ? "#c8ff00" : b.h === 0 ? "rgba(255,255,255,0.06)" : "rgba(200,255,0,0.25)",
                                            boxShadow: b.active ? "0 0 8px rgba(200,255,0,0.5)" : "none",
                                        }}
                                    />
                                </motion.div>
                            ))}
                        </div>
                        <div className="flex items-center justify-between mt-2">
                            {BARS.map((b, i) => (
                                <span key={i} className="flex-1 text-center text-[9px]"
                                    style={{ color: b.active ? "#c8ff00" : "rgba(255,255,255,0.25)" }}>
                                    {b.day}
                                </span>
                            ))}
                        </div>
                    </motion.div>

                    {/* Floating stat cards */}
                    {mounted && FLOAT_CARDS.map((card) => (
                        <motion.div
                            key={card.id}
                            initial={{ opacity: 0, y: 16, scale: 0.9 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            transition={{ delay: 0.5 + card.delay, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                            style={{
                                position: "absolute",
                                top: card.top,
                                bottom: (card as any).bottom,
                                left: (card as any).left,
                                right: (card as any).right,
                                background: "rgba(10,10,10,0.85)",
                                border: "1px solid rgba(255,255,255,0.1)",
                                backdropFilter: "blur(24px)",
                                borderRadius: "1.25rem",
                                padding: "14px 16px",
                                minWidth: "185px",
                                boxShadow: `0 8px 32px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.04), inset 0 1px 0 rgba(255,255,255,0.06)`,
                            }}
                        >
                            {/* Colored top accent */}
                            <div className="absolute top-0 left-4 right-4 h-px rounded-full"
                                style={{ background: `linear-gradient(90deg, transparent, ${card.color}60, transparent)` }} />

                            <div className="flex items-center gap-2 mb-2">
                                <span className="text-base">{card.icon}</span>
                                <span className="text-[10px] font-semibold uppercase tracking-widest"
                                    style={{ color: "rgba(255,255,255,0.35)" }}>
                                    {card.label}
                                </span>
                            </div>
                            <p className="text-xl font-bold" style={{ color: card.color, lineHeight: 1.2 }}>
                                {card.value}
                            </p>
                            <p className="text-[11px] mt-0.5" style={{ color: "rgba(255,255,255,0.35)" }}>
                                {card.sub}
                            </p>

                            {/* Subtle glow behind card */}
                            <div className="absolute inset-0 rounded-[1.25rem] opacity-10 pointer-events-none"
                                style={{ background: `radial-gradient(circle at 30% 50%, ${card.color}, transparent 70%)` }} />
                        </motion.div>
                    ))}

                    {/* Brand watermark */}
                    <div className="absolute bottom-6 right-6">
                        <p className="text-[10px] font-semibold tracking-[0.3em] uppercase"
                            style={{ color: "rgba(200,255,0,0.2)" }}>
                            Smart Life
                        </p>
                    </div>

                    {/* Floating ring decorations */}
                    <div className="absolute top-[30%] right-[25%] w-20 h-20 rounded-full pointer-events-none"
                        style={{ border: "1px solid rgba(200,255,0,0.08)" }} />
                    <div className="absolute top-[28%] right-[22%] w-32 h-32 rounded-full pointer-events-none"
                        style={{ border: "1px solid rgba(200,255,0,0.04)" }} />
                    <div className="absolute bottom-[30%] left-[20%] w-16 h-16 rounded-full pointer-events-none"
                        style={{ border: "1px solid rgba(0,207,255,0.08)" }} />
                </div>
            </motion.div>
        </div>
    );
}