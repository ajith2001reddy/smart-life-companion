"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import WeatherCard from "@/components/WeatherCard";
import { useAuth } from "@/context/AuthContext";
import type { Variants } from "framer-motion";
type Stats = {
    performanceScore: number;
    weeklyVolume: number;
    completionRate: number;
    weeklyStats: { day: string; volume: number }[];
};

type Weather = {
    location: string;
    temperature: number;
    condition: string;
};

type HealthSnapshot = {
    steps: number;
    heartRate: number;
    sleepHours: number;
    caloriesBurned: number;
};

type DailyTip = {
    text: string;
    category: "recovery" | "nutrition" | "performance" | "mindset";
};

const TIPS: DailyTip[] = [
    { text: "Your heart rate trend looks great — push intensity today.", category: "performance" },
    { text: "Sleep under 7hrs detected. Consider a lighter session.", category: "recovery" },
    { text: "Fuel up 90 mins before training for peak output.", category: "nutrition" },
    { text: "Consistency beats perfection. Keep the streak alive.", category: "mindset" },
    { text: "Hydrate first thing — even mild dehydration cuts strength by 10%.", category: "nutrition" },
    { text: "Active recovery today: walk, stretch, breathe.", category: "recovery" },
];

const TIP_COLORS = {
    recovery: { bg: "bg-blue-500/10", border: "border-blue-400/20", text: "text-blue-300", dot: "bg-blue-400" },
    nutrition: { bg: "bg-emerald-500/10", border: "border-emerald-400/20", text: "text-emerald-300", dot: "bg-emerald-400" },
    performance: { bg: "bg-[#c8ff00]/10", border: "border-[#c8ff00]/20", text: "text-[#c8ff00]", dot: "bg-[#c8ff00]" },
    mindset: { bg: "bg-purple-500/10", border: "border-purple-400/20", text: "text-purple-300", dot: "bg-purple-400" },
};

const stagger = {
    hidden: {},
    show: { transition: { staggerChildren: 0.08 } },
};

const fadeUp: Variants = {
    hidden: { opacity: 0, y: 20 },
    show: {
        opacity: 1,
        y: 0,
        transition: {
            duration: 0.5,
            ease: [0.16, 1, 0.3, 1], // ← FIXED
        },
    },
};

// Quick log moods
const MOODS = ["😴", "😐", "🙂", "💪", "🔥"];

export default function DashboardPage() {
    const { token } = useAuth();
    const base = process.env.NEXT_PUBLIC_API_URL;

    const [stats, setStats] = useState<Stats | null>(null);
    const [weather, setWeather] = useState<Weather | null>(null);
    const [health, setHealth] = useState<HealthSnapshot | null>(null);
    const [time, setTime] = useState(new Date());
    const [tip] = useState<DailyTip>(TIPS[Math.floor(Math.random() * TIPS.length)]);
    const [streak, setStreak] = useState(7);

    // Quick log state
    const [quickLogOpen, setQuickLogOpen] = useState(false);
    const [selectedMood, setSelectedMood] = useState<number | null>(null);
    const [quickSteps, setQuickSteps] = useState("");
    const [quickWater, setQuickWater] = useState(0);
    const [logSaved, setLogSaved] = useState(false);

    // Hover tooltip for chart
    const [hoveredDay, setHoveredDay] = useState<string | null>(null);

    useEffect(() => {
        const t = setInterval(() => setTime(new Date()), 1000);
        return () => clearInterval(t);
    }, []);

    useEffect(() => {
        async function load() {
            try {
                const s = await fetch(`${base}/api/dashboard`).then((r) => r.json());
                setStats(s);

                // Load health snapshot
                if (token) {
                    const h = await fetch(`${base}/api/health/latest`, {
                        headers: { Authorization: `Bearer ${token}` },
                    }).then((r) => r.ok ? r.json() : null);
                    if (h) setHealth(h);
                }

                try {
                    const pos = await new Promise<GeolocationPosition>((res, rej) =>
                        navigator.geolocation.getCurrentPosition(res, rej)
                    );
                    const w = await fetch(`${base}/api/weather?lat=${pos.coords.latitude}&lon=${pos.coords.longitude}`).then((r) => r.json());
                    setWeather(w);
                } catch {
                    const w = await fetch(`${base}/api/weather?city=New York`).then((r) => r.json());
                    setWeather(w);
                }
            } catch (e) {
                console.error(e);
            }
        }
        load();
    }, [token]);

    function handleQuickLogSave() {
        setLogSaved(true);
        setTimeout(() => { setLogSaved(false); setQuickLogOpen(false); }, 1500);
    }

    const hour = time.getHours();
    const greeting = hour < 12 ? "Good Morning" : hour < 17 ? "Good Afternoon" : "Good Evening";

    if (!stats)
        return (
            <div className="flex items-center justify-center h-64">
                <motion.div
                    className="w-12 h-12 border-2 border-[#c8ff00] border-t-transparent rounded-full"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 0.8, repeat: Infinity }}
                />
            </div>
        );

    const maxVol = Math.max(...stats.weeklyStats.map((d) => d.volume), 1);
    const tipStyle = TIP_COLORS[tip.category];

    return (
        <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-6">

            {/* ── HERO ── */}
            <motion.div
                variants={fadeUp}
                className="relative overflow-hidden rounded-3xl border border-white/10 p-6 sm:p-10"
                style={{ background: "linear-gradient(135deg, rgba(200,255,0,0.08) 0%, rgba(0,0,0,0) 60%)" }}
            >
                <div className="absolute top-0 right-0 w-72 h-72 bg-[#c8ff00]/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4" />
                <div className="absolute bottom-0 left-1/3 w-48 h-48 bg-blue-500/5 rounded-full blur-2xl" />

                <div className="relative z-10 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6">
                    <div>
                        <p className="text-[#c8ff00] text-xs font-medium tracking-widest uppercase mb-2">{greeting}</p>
                        <h1 className="text-5xl sm:text-6xl font-bold tracking-tight tabular-nums">
                            {time.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </h1>
                        <p className="text-white/40 text-sm mt-2">
                            {time.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
                        </p>
                        <div className="flex items-center gap-3 mt-4">
                            <motion.div className="w-2 h-2 bg-[#c8ff00] rounded-full" animate={{ scale: [1, 1.5, 1] }} transition={{ duration: 1.5, repeat: Infinity }} />
                            <span className="text-xs text-[#c8ff00]/70">AI Engine Active</span>
                        </div>
                    </div>

                    {/* Streak counter */}
                    <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-2xl px-5 py-4 self-start sm:self-auto">
                        <span className="text-2xl">🔥</span>
                        <div>
                            <p className="text-2xl font-bold text-[#c8ff00]">{streak}</p>
                            <p className="text-[10px] text-white/40 uppercase tracking-widest">Day Streak</p>
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* ── DAILY TIP ── */}
            <motion.div
                variants={fadeUp}
                className={`flex items-start gap-4 rounded-2xl border p-4 sm:p-5 ${tipStyle.bg} ${tipStyle.border}`}
            >
                <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${tipStyle.dot}`} />
                <div>
                    <p className={`text-[10px] uppercase tracking-widest mb-1 ${tipStyle.text}`}>
                        Today's Insight · {tip.category}
                    </p>
                    <p className="text-white/80 text-sm">{tip.text}</p>
                </div>
                <button
                    onClick={() => setQuickLogOpen(true)}
                    className="ml-auto shrink-0 text-xs px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/50 hover:text-white transition whitespace-nowrap"
                >
                    Quick Log →
                </button>
            </motion.div>

            {/* ── QUICK LOG MODAL ── */}
            <AnimatePresence>
                {quickLogOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
                        onClick={(e) => e.target === e.currentTarget && setQuickLogOpen(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.92, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.92, y: 20 }}
                            className="w-full max-w-sm bg-[#0d0d0d] border border-white/15 rounded-3xl p-6 space-y-5"
                        >
                            <div className="flex items-center justify-between">
                                <h3 className="font-bold text-base">Quick Log</h3>
                                <button onClick={() => setQuickLogOpen(false)} className="text-white/30 hover:text-white">✕</button>
                            </div>

                            {/* Mood */}
                            <div>
                                <p className="text-xs text-white/40 uppercase tracking-widest mb-3">How are you feeling?</p>
                                <div className="flex gap-2">
                                    {MOODS.map((m, i) => (
                                        <button
                                            key={i}
                                            onClick={() => setSelectedMood(i)}
                                            className={`flex-1 py-2.5 rounded-xl text-xl transition border ${selectedMood === i ? "border-[#c8ff00]/50 bg-[#c8ff00]/10" : "border-white/10 bg-white/5 hover:bg-white/10"}`}
                                        >
                                            {m}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Steps */}
                            <div>
                                <p className="text-xs text-white/40 uppercase tracking-widest mb-2">Steps Today</p>
                                <input
                                    type="number"
                                    placeholder="e.g. 8000"
                                    value={quickSteps}
                                    onChange={(e) => setQuickSteps(e.target.value)}
                                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm outline-none focus:border-[#c8ff00]/40 transition"
                                />
                            </div>

                            {/* Water */}
                            <div>
                                <p className="text-xs text-white/40 uppercase tracking-widest mb-2">Glasses of Water</p>
                                <div className="flex gap-1.5">
                                    {Array.from({ length: 8 }).map((_, i) => (
                                        <button
                                            key={i}
                                            onClick={() => setQuickWater(i + 1)}
                                            className={`flex-1 h-8 rounded-lg text-sm transition ${i < quickWater ? "bg-blue-400/40 border border-blue-400/40 text-blue-300" : "bg-white/5 border border-white/10 text-white/30"}`}
                                        >
                                            💧
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <motion.button
                                whileTap={{ scale: 0.97 }}
                                onClick={handleQuickLogSave}
                                className="w-full py-3 rounded-2xl bg-[#c8ff00] text-black font-bold text-sm"
                            >
                                {logSaved ? "✓ Saved!" : "Save Log"}
                            </motion.button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── KPI GRID ── */}
            <motion.div variants={fadeUp} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                    { label: "Performance", value: stats.performanceScore, suffix: "", color: "#c8ff00", bar: stats.performanceScore, icon: "⚡" },
                    { label: "Weekly Volume", value: stats.weeklyVolume.toLocaleString(), suffix: " reps", color: "#38bdf8", bar: (stats.weeklyVolume / 20000) * 100, icon: "🏋️" },
                    { label: "Completion", value: stats.completionRate, suffix: "%", color: "#fb7185", bar: stats.completionRate, icon: "✅" },
                ].map((kpi) => (
                    <motion.div
                        key={kpi.label}
                        whileHover={{ y: -3 }}
                        className="backdrop-blur-2xl bg-white/5 border border-white/10 rounded-3xl p-5 sm:p-6 group"
                    >
                        <div className="flex items-start justify-between mb-4">
                            <p className="text-xs text-white/40 uppercase tracking-widest">{kpi.label}</p>
                            <span className="text-lg opacity-60 group-hover:opacity-100 transition">{kpi.icon}</span>
                        </div>
                        <p className="text-3xl sm:text-4xl font-bold mb-5" style={{ color: kpi.color }}>
                            {kpi.value}{kpi.suffix}
                        </p>
                        <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                            <motion.div
                                className="h-full rounded-full"
                                style={{ background: kpi.color }}
                                initial={{ width: 0 }}
                                animate={{ width: `${Math.min(kpi.bar, 100)}%` }}
                                transition={{ duration: 1.2, ease: "easeOut" }}
                            />
                        </div>
                    </motion.div>
                ))}
            </motion.div>

            {/* ── HEALTH SNAPSHOT ── */}
            {health && (
                <motion.div variants={fadeUp} className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                        { label: "Steps", value: health.steps.toLocaleString(), icon: "👟", color: "text-emerald-400" },
                        { label: "Heart Rate", value: `${health.heartRate} bpm`, icon: "❤️", color: "text-red-400" },
                        { label: "Sleep", value: `${health.sleepHours}h`, icon: "🌙", color: "text-blue-400" },
                        { label: "Calories", value: health.caloriesBurned.toLocaleString(), icon: "🔥", color: "text-orange-400" },
                    ].map((item) => (
                        <motion.div
                            key={item.label}
                            whileHover={{ y: -2 }}
                            className="bg-white/5 border border-white/10 rounded-2xl p-4"
                        >
                            <span className="text-xl">{item.icon}</span>
                            <p className={`text-lg font-bold mt-2 ${item.color}`}>{item.value}</p>
                            <p className="text-[10px] text-white/30 uppercase tracking-widest mt-0.5">{item.label}</p>
                        </motion.div>
                    ))}
                </motion.div>
            )}

            {/* ── BOTTOM ROW ── */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">

                {/* Weekly Volume Chart */}
                <motion.div
                    variants={fadeUp}
                    className="lg:col-span-3 backdrop-blur-2xl bg-white/5 border border-white/10 rounded-3xl p-5 sm:p-7"
                >
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xs text-white/50 uppercase tracking-widest">Weekly Volume</h2>
                        {hoveredDay && (
                            <span className="text-xs text-[#c8ff00] font-mono">
                                {hoveredDay} · {stats.weeklyStats.find(d => d.day === hoveredDay)?.volume.toLocaleString()} reps
                            </span>
                        )}
                    </div>

                    <div className="flex items-end gap-2 h-32 sm:h-40">
                        {stats.weeklyStats.map((d) => (
                            <div
                                key={d.day}
                                className="flex-1 flex flex-col items-center gap-2 cursor-pointer"
                                onMouseEnter={() => setHoveredDay(d.day)}
                                onMouseLeave={() => setHoveredDay(null)}
                            >
                                <motion.div
                                    className={`w-full rounded-t-lg transition-colors ${hoveredDay === d.day ? "bg-[#c8ff00]" : "bg-[#c8ff00]/60 hover:bg-[#c8ff00]/80"}`}
                                    style={{ height: `${(d.volume / maxVol) * 100}%`, minHeight: "4px" }}
                                    initial={{ scaleY: 0 }}
                                    animate={{ scaleY: 1 }}
                                    transition={{ duration: 0.6, ease: "easeOut" }}
                                />
                                <span className="text-[10px] text-white/40">{d.day}</span>
                            </div>
                        ))}
                    </div>
                </motion.div>

                {/* Weather */}
                <motion.div variants={fadeUp} className="lg:col-span-2">
                    {weather ? (
                        <WeatherCard city={weather.location} temperature={weather.temperature} condition={weather.condition} />
                    ) : (
                        <div className="h-full backdrop-blur-2xl bg-white/5 border border-white/10 rounded-3xl p-7 flex items-center justify-center text-white/30 text-sm">
                            Loading weather...
                        </div>
                    )}
                </motion.div>
            </div>

            {/* ── AI STATUS ── */}
            <motion.div
                variants={fadeUp}
                className="backdrop-blur-2xl bg-white/5 border border-white/10 rounded-3xl p-5 sm:p-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
            >
                <div>
                    <h2 className="text-base sm:text-lg font-semibold mb-1">Adaptive Intelligence Engine</h2>
                    <p className="text-white/40 text-sm max-w-lg">
                        Analyzing workload, optimizing progressive overload, and adjusting performance strategies in real time.
                    </p>
                </div>
                <div className="flex items-center gap-4 shrink-0">
                    <button
                        onClick={() => setQuickLogOpen(true)}
                        className="text-xs px-4 py-2 rounded-xl border border-[#c8ff00]/30 text-[#c8ff00] hover:bg-[#c8ff00]/10 transition"
                    >
                        Log Today
                    </button>
                    <div className="flex items-center gap-2">
                        <motion.div
                            className="w-2.5 h-2.5 bg-[#c8ff00] rounded-full"
                            animate={{ scale: [1, 1.4, 1], opacity: [1, 0.5, 1] }}
                            transition={{ duration: 2, repeat: Infinity }}
                        />
                        <span className="text-[#c8ff00] text-sm font-medium">Operational</span>
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
}