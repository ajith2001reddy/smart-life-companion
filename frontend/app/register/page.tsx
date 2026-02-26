"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import { registerWithEmail, signInWithGoogle } from "@/lib/firebase";

/* ── Feature highlights shown on right panel ── */
const FEATURES = [
    { icon: "🤖", title: "AI Coach", desc: "Personalised guidance powered by GPT-4o" },
    { icon: "📊", title: "Smart Analytics", desc: "Deep insights across health & fitness data" },
    { icon: "⚡", title: "Readiness Score", desc: "Daily recovery score from your biometrics" },
    { icon: "🏆", title: "Streaks & Goals", desc: "Stay consistent with habit tracking" },
];

/* ── Stat pills floating on right panel ── */
const STATS = [
    { value: "12k+", label: "Active Users", color: "#c8ff00", top: "10%", right: "8%" },
    { value: "4.9★", label: "App Rating", color: "#00CFFF", bottom: "22%", left: "6%" },
    { value: "98%", label: "Goal Success", color: "#a78bfa", top: "52%", right: "4%" },
];

/* ── Password strength ── */
function getStrength(p: string): { score: number; label: string; color: string } {
    if (!p) return { score: 0, label: "", color: "transparent" };
    let s = 0;
    if (p.length >= 8) s++;
    if (/[A-Z]/.test(p)) s++;
    if (/[0-9]/.test(p)) s++;
    if (/[^A-Za-z0-9]/.test(p)) s++;
    const map = [
        { score: 0, label: "", color: "transparent" },
        { score: 1, label: "Weak", color: "#ff4d6d" },
        { score: 2, label: "Fair", color: "#FF8C00" },
        { score: 3, label: "Good", color: "#00CFFF" },
        { score: 4, label: "Strong", color: "#c8ff00" },
    ];
    return map[s];
}

export default function RegisterPage() {
    const router = useRouter();
    const { login } = useAuth();

    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPass, setShowPass] = useState(false);
    const [agreed, setAgreed] = useState(false);
    const [loading, setLoading] = useState(false);
    const [gLoading, setGLoading] = useState(false);
    const [error, setError] = useState("");
    const [mounted, setMounted] = useState(false);

    useEffect(() => { setMounted(true); }, []);

    const strength = getStrength(password);

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

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) { setError("Please enter your full name."); return; }
        if (!agreed) { setError("Please accept the Terms & Conditions."); return; }
        setError("");
        setLoading(true);
        try {
            const data = await registerWithEmail(email, password);
            login(data.token);
            router.replace("/dashboard");
        } catch (err: any) {
            setError(err.message || "Registration failed.");
        } finally {
            setLoading(false);
        }
    };

    const inputBase = "w-full px-4 py-3.5 rounded-2xl text-sm text-white outline-none transition-all placeholder:text-white/20";
    const inputStyle = {
        background: "rgba(255,255,255,0.05)",
        border: "1px solid rgba(255,255,255,0.08)",
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a] px-4 py-8"
            style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}>

            {/* Ambient glows */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden">
                <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full"
                    style={{ background: "radial-gradient(circle, rgba(167,139,250,0.06) 0%, transparent 70%)" }} />
                <div className="absolute bottom-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full"
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
                    minHeight: "640px",
                }}
            >
                {/* ════ LEFT FORM PANEL ════ */}
                <div className="relative z-10 flex flex-col w-full md:w-[45%] p-8 sm:p-10 lg:p-12">

                    {/* Logo */}
                    <motion.div initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}
                        className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center text-black font-black text-sm"
                            style={{ background: "#c8ff00" }}>SL</div>
                        <span className="text-white font-semibold tracking-tight">Smart Life</span>
                    </motion.div>

                    {/* Heading */}
                    <div className="mt-8 mb-6">
                        <motion.h1 initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
                            className="text-3xl sm:text-4xl font-bold text-white mb-2 tracking-tight">
                            Create account
                        </motion.h1>
                        <motion.p initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                            className="text-sm" style={{ color: "rgba(255,255,255,0.4)" }}>
                            Start your 30-day free trial — no card required
                        </motion.p>
                    </div>

                    {/* Form */}
                    <motion.form onSubmit={handleRegister} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.25 }} className="space-y-4 flex-1">

                        {/* Full Name */}
                        <div className="space-y-1.5">
                            <label className="text-[11px] font-semibold uppercase tracking-widest"
                                style={{ color: "rgba(255,255,255,0.35)" }}>Full Name</label>
                            <input type="text" value={name} onChange={(e) => setName(e.target.value)}
                                placeholder="Alex Johnson" required className={inputBase} style={inputStyle}
                                onFocus={(e) => e.currentTarget.style.borderColor = "rgba(200,255,0,0.4)"}
                                onBlur={(e) => e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"} />
                        </div>

                        {/* Email */}
                        <div className="space-y-1.5">
                            <label className="text-[11px] font-semibold uppercase tracking-widest"
                                style={{ color: "rgba(255,255,255,0.35)" }}>Email</label>
                            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                                placeholder="you@example.com" required className={inputBase} style={inputStyle}
                                onFocus={(e) => e.currentTarget.style.borderColor = "rgba(200,255,0,0.4)"}
                                onBlur={(e) => e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"} />
                        </div>

                        {/* Password + strength */}
                        <div className="space-y-1.5">
                            <label className="text-[11px] font-semibold uppercase tracking-widest"
                                style={{ color: "rgba(255,255,255,0.35)" }}>Password</label>
                            <div className="relative">
                                <input type={showPass ? "text" : "password"} value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Min. 8 characters" required minLength={6}
                                    className={`${inputBase} pr-12`} style={inputStyle}
                                    onFocus={(e) => e.currentTarget.style.borderColor = "rgba(200,255,0,0.4)"}
                                    onBlur={(e) => e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"} />
                                <button type="button" onClick={() => setShowPass((v) => !v)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-base"
                                    style={{ color: "rgba(255,255,255,0.3)" }}>
                                    {showPass ? "🙈" : "👁"}
                                </button>
                            </div>

                            {/* Strength bar */}
                            <AnimatePresence>
                                {password && (
                                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
                                        exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                                        <div className="flex gap-1 mt-2">
                                            {[1, 2, 3, 4].map((i) => (
                                                <motion.div key={i} className="h-1 flex-1 rounded-full"
                                                    initial={{ scaleX: 0 }}
                                                    animate={{ scaleX: 1 }}
                                                    transition={{ delay: i * 0.05 }}
                                                    style={{
                                                        background: i <= strength.score ? strength.color : "rgba(255,255,255,0.08)",
                                                        transformOrigin: "left",
                                                    }} />
                                            ))}
                                        </div>
                                        <p className="text-[11px] mt-1 font-medium" style={{ color: strength.color }}>
                                            {strength.label}
                                        </p>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* Terms checkbox */}
                        <label className="flex items-start gap-3 cursor-pointer group">
                            <div
                                onClick={() => setAgreed((v) => !v)}
                                className="w-5 h-5 rounded-md flex items-center justify-center shrink-0 mt-0.5 transition-all"
                                style={{
                                    background: agreed ? "#c8ff00" : "rgba(255,255,255,0.05)",
                                    border: agreed ? "1px solid #c8ff00" : "1px solid rgba(255,255,255,0.12)",
                                }}
                            >
                                {agreed && <span className="text-black text-xs font-black">✓</span>}
                            </div>
                            <span className="text-xs leading-relaxed" style={{ color: "rgba(255,255,255,0.4)" }}>
                                I agree to the{" "}
                                <span className="underline underline-offset-2" style={{ color: "#c8ff00" }}>Terms of Service</span>
                                {" "}and{" "}
                                <span className="underline underline-offset-2" style={{ color: "#c8ff00" }}>Privacy Policy</span>
                            </span>
                        </label>

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
                        <motion.button type="submit" disabled={loading || gLoading}
                            whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
                            className="w-full py-3.5 rounded-2xl font-bold text-sm text-black transition-all disabled:opacity-60 flex items-center justify-center gap-2"
                            style={{ background: "linear-gradient(135deg, #c8ff00 0%, #aaee00 100%)" }}>
                            {loading ? (
                                <motion.div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full"
                                    animate={{ rotate: 360 }} transition={{ duration: 0.7, repeat: Infinity, ease: "linear" }} />
                            ) : "Create Account →"}
                        </motion.button>

                        {/* Divider */}
                        <div className="flex items-center gap-3">
                            <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.07)" }} />
                            <span className="text-[11px] font-medium tracking-widest uppercase"
                                style={{ color: "rgba(255,255,255,0.2)" }}>or</span>
                            <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.07)" }} />
                        </div>

                        {/* Google */}
                        <motion.button type="button" onClick={handleGoogle} disabled={loading || gLoading}
                            whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
                            className="w-full py-3.5 rounded-2xl text-sm font-semibold transition-all disabled:opacity-60 flex items-center justify-center gap-3"
                            style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.8)" }}>
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
                                    Sign up with Google
                                </>
                            )}
                        </motion.button>
                    </motion.form>

                    {/* Footer */}
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
                        className="mt-6 flex items-center justify-between text-xs"
                        style={{ color: "rgba(255,255,255,0.3)" }}>
                        <span>
                            Already have an account?{" "}
                            <span onClick={() => router.push("/login")} className="cursor-pointer underline underline-offset-2"
                                style={{ color: "#c8ff00" }}>Sign in</span>
                        </span>
                        <span className="text-[10px]">Privacy · Terms</span>
                    </motion.div>
                </div>

                {/* ════ RIGHT VISUAL PANEL ════ */}
                <div className="hidden md:block relative flex-1 rounded-r-[2.5rem] overflow-hidden"
                    style={{ background: "linear-gradient(145deg, #0a001a 0%, #06000f 50%, #020008 100%)" }}>

                    {/* Mesh glows */}
                    <div className="absolute inset-0">
                        <div className="absolute top-0 right-0 w-96 h-96 rounded-full opacity-30"
                            style={{ background: "radial-gradient(circle, #a78bfa 0%, transparent 70%)", filter: "blur(70px)" }} />
                        <div className="absolute bottom-0 left-0 w-64 h-64 rounded-full opacity-20"
                            style={{ background: "radial-gradient(circle, #c8ff00 0%, transparent 70%)", filter: "blur(50px)" }} />
                    </div>

                    {/* Dot grid */}
                    <div className="absolute inset-0 opacity-[0.06]"
                        style={{
                            backgroundImage: `radial-gradient(circle, rgba(167,139,250,1) 1px, transparent 1px)`,
                            backgroundSize: "28px 28px",
                        }} />

                    {/* Central feature list card */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.45 }}
                        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-2xl p-5 w-56"
                        style={{
                            background: "rgba(10,0,26,0.85)",
                            border: "1px solid rgba(255,255,255,0.09)",
                            backdropFilter: "blur(24px)",
                            boxShadow: "0 8px 40px rgba(0,0,0,0.5)",
                        }}
                    >
                        <p className="text-[10px] font-semibold uppercase tracking-widest mb-4"
                            style={{ color: "rgba(255,255,255,0.35)" }}>What's included</p>
                        <div className="space-y-3.5">
                            {FEATURES.map((f, i) => (
                                <motion.div key={f.title}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.55 + i * 0.08 }}
                                    className="flex items-start gap-3">
                                    <span className="text-lg leading-none mt-0.5">{f.icon}</span>
                                    <div>
                                        <p className="text-xs font-semibold text-white">{f.title}</p>
                                        <p className="text-[10px] leading-snug mt-0.5" style={{ color: "rgba(255,255,255,0.35)" }}>{f.desc}</p>
                                    </div>
                                </motion.div>
                            ))}
                        </div>

                        {/* Top accent line */}
                        <div className="absolute top-0 left-4 right-4 h-px rounded-full"
                            style={{ background: "linear-gradient(90deg, transparent, rgba(167,139,250,0.5), transparent)" }} />
                    </motion.div>

                    {/* Floating stat pills */}
                    {mounted && STATS.map((s, i) => (
                        <motion.div key={s.value}
                            initial={{ opacity: 0, scale: 0.85, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            transition={{ delay: 0.6 + i * 0.12, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                            style={{
                                position: "absolute",
                                top: s.top, bottom: (s as any).bottom,
                                left: (s as any).left, right: s.right,
                                background: "rgba(10,0,26,0.85)",
                                border: "1px solid rgba(255,255,255,0.09)",
                                backdropFilter: "blur(20px)",
                                borderRadius: "1rem",
                                padding: "12px 16px",
                                minWidth: "110px",
                            }}>
                            <p className="text-xl font-bold" style={{ color: s.color }}>{s.value}</p>
                            <p className="text-[10px] mt-0.5" style={{ color: "rgba(255,255,255,0.35)" }}>{s.label}</p>
                            <div className="absolute top-0 left-3 right-3 h-px rounded-full"
                                style={{ background: `linear-gradient(90deg, transparent, ${s.color}50, transparent)` }} />
                        </motion.div>
                    ))}

                    {/* Decorative rings */}
                    <div className="absolute top-[28%] right-[22%] w-24 h-24 rounded-full pointer-events-none"
                        style={{ border: "1px solid rgba(167,139,250,0.1)" }} />
                    <div className="absolute top-[25%] right-[18%] w-40 h-40 rounded-full pointer-events-none"
                        style={{ border: "1px solid rgba(167,139,250,0.05)" }} />

                    {/* Brand watermark */}
                    <div className="absolute bottom-6 right-6">
                        <p className="text-[10px] font-semibold tracking-[0.3em] uppercase"
                            style={{ color: "rgba(167,139,250,0.25)" }}>Smart Life</p>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}