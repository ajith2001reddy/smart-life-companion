"use client";

import { useEffect, useState, useCallback } from "react";
import {
    AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip,
    ResponsiveContainer, CartesianGrid, Legend, PieChart, Pie, Cell,
} from "recharts";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/context/AuthContext";

/* ================= TYPES ================= */

type Meal = {
    _id: string;
    name: string;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    time: string;
};

type NutritionLog = {
    _id: string;
    targetCalories: number;
    targetProtein: number;
    targetCarbs: number;
    targetFat: number;
    meals: Meal[];
    totalCalories: number;
    totalProtein: number;
    totalCarbs: number;
    totalFat: number;
};

type HistoryEntry = {
    date: string;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    targetCalories: number;
};

type Suggestion = {
    name: string;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    time: string;
    reason: string;
};

type FavoriteMeal = {
    id: string;
    name: string;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    time: string;
};

/* ================= CONSTANTS ================= */

const MEAL_TIMES = ["Breakfast", "Lunch", "Dinner", "Snack", "Anytime"];
const GOALS = ["Lose fat", "Gain muscle", "Maintain fitness"];
const COLORS = { calories: "#c8ff00", protein: "#00BFFF", carbs: "#FF8C00", fat: "#ff4d6d" };
const PIE_COLORS = ["#00BFFF", "#FF8C00", "#ff4d6d"];
const EMPTY_FORM = { name: "", calories: "", protein: "", carbs: "", fat: "", time: "Anytime" };

/* ================= PROGRESS RING ================= */

function Ring({ value, max, color, label }: { value: number; max: number; color: string; label: string }) {
    const pct = Math.min((value / Math.max(max, 1)) * 100, 100);
    const r = 36;
    const circ = 2 * Math.PI * r;
    const offset = circ - (pct / 100) * circ;

    return (
        <div className="flex flex-col items-center gap-2">
            <div className="relative w-24 h-24">
                <svg className="-rotate-90 w-full h-full" viewBox="0 0 88 88">
                    <circle cx="44" cy="44" r={r} stroke="rgba(255,255,255,0.08)" strokeWidth="8" fill="none" />
                    <motion.circle cx="44" cy="44" r={r} stroke={color} strokeWidth="8" fill="none"
                        strokeLinecap="round" strokeDasharray={circ}
                        initial={{ strokeDashoffset: circ }}
                        animate={{ strokeDashoffset: offset }}
                        transition={{ duration: 1, ease: "easeOut" }}
                    />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-sm font-bold" style={{ color }}>{value}</span>
                    <span className="text-[9px] text-white/40">/ {max}</span>
                </div>
            </div>
            <span className="text-xs text-white/60">{label}</span>
        </div>
    );
}

/* ================= CUSTOM TOOLTIP ================= */

function CustomTooltip({ active, payload, label }: any) {
    if (!active || !payload?.length) return null;
    return (
        <div className="rounded-2xl bg-black/90 border border-white/10 px-4 py-3 shadow-xl">
            <p className="text-[11px] text-white/40 mb-2">{label}</p>
            {payload.map((p: any) => (
                <div key={p.dataKey} className="flex items-center gap-2 text-xs">
                    <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
                    <span className="text-white/60">{p.name || p.dataKey}:</span>
                    <span className="font-bold text-white">{p.value}</span>
                </div>
            ))}
        </div>
    );
}

/* ================= MAIN PAGE ================= */

export default function NutritionPage() {
    const { token } = useAuth();
    const base = process.env.NEXT_PUBLIC_API_URL;

    const [log, setLog] = useState<NutritionLog | null>(null);
    const [history, setHistory] = useState<HistoryEntry[]>([]);
    const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
    const [loading, setLoading] = useState(true);
    const [aiLoading, setAiLoading] = useState(false);
    const [activeTab, setActiveTab] = useState<"today" | "history" | "ai">("today");
    const [showForm, setShowForm] = useState(false);
    const [showTargets, setShowTargets] = useState(false);
    const [form, setForm] = useState(EMPTY_FORM);
    const [targets, setTargets] = useState({ targetCalories: "", targetProtein: "", targetCarbs: "", targetFat: "" });
    const [goal, setGoal] = useState("Maintain fitness");
    const [saveMsg, setSaveMsg] = useState("");
    const [scanLoading, setScanLoading] = useState(false);

    // ── NEW: Favorites ──
    const [favorites, setFavorites] = useState<FavoriteMeal[]>(() => {
        try { return JSON.parse(localStorage.getItem("smartlife-fav-meals") || "[]"); } catch { return []; }
    });
    const [showFavorites, setShowFavorites] = useState(false);

    // ── NEW: Streak ──
    const [streak, setStreak] = useState(0);

    const headers = { "Content-Type": "application/json", Authorization: `Bearer ${token}` };

    const loadToday = useCallback(async () => {
        if (!token) return;
        try {
            const res = await fetch(`${base}/api/nutrition/today`, { headers });
            const data = await res.json();
            setLog(data);
            setTargets({
                targetCalories: String(data.targetCalories),
                targetProtein: String(data.targetProtein),
                targetCarbs: String(data.targetCarbs),
                targetFat: String(data.targetFat),
            });
        } catch { console.error("Failed to load nutrition"); }
    }, [token]);

    const loadHistory = useCallback(async () => {
        if (!token) return;
        try {
            const res = await fetch(`${base}/api/nutrition/history`, { headers });
            const data = await res.json();
            setHistory(data);
            // ── NEW: Calculate streak from history ──
            if (Array.isArray(data) && data.length > 0) {
                let s = 0;
                const sorted = [...data].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
                for (const entry of sorted) {
                    if (entry.calories >= entry.targetCalories * 0.7) s++;
                    else break;
                }
                setStreak(s);
            }
        } catch { console.error("Failed to load history"); }
    }, [token]);

    useEffect(() => {
        async function init() {
            setLoading(true);
            await Promise.all([loadToday(), loadHistory()]);
            setLoading(false);
        }
        init();
    }, [token]);

    async function handleAddMeal(mealData?: Partial<typeof EMPTY_FORM>) {
        const data = mealData ?? form;
        if (!data.name) return;
        try {
            const res = await fetch(`${base}/api/nutrition/meal`, {
                method: "POST",
                headers,
                body: JSON.stringify({
                    name: data.name,
                    calories: Number(data.calories) || 0,
                    protein: Number(data.protein) || 0,
                    carbs: Number(data.carbs) || 0,
                    fat: Number(data.fat) || 0,
                    time: data.time || "Anytime",
                }),
            });
            const res2 = await res.json();
            setLog(res2.log);
            setForm(EMPTY_FORM);
            setShowForm(false);
            await loadHistory();
        } catch { console.error("Failed to add meal"); }
    }

    async function handleDeleteMeal(mealId: string) {
        try {
            const res = await fetch(`${base}/api/nutrition/meal/${mealId}`, { method: "DELETE", headers });
            const data = await res.json();
            setLog(data.log);
            await loadHistory();
        } catch { console.error("Failed to delete meal"); }
    }

    async function handleSaveTargets() {
        try {
            const res = await fetch(`${base}/api/nutrition/targets`, {
                method: "PUT",
                headers,
                body: JSON.stringify({
                    targetCalories: Number(targets.targetCalories),
                    targetProtein: Number(targets.targetProtein),
                    targetCarbs: Number(targets.targetCarbs),
                    targetFat: Number(targets.targetFat),
                }),
            });
            const data = await res.json();
            setLog(data.log);
            setShowTargets(false);
            setSaveMsg("Targets saved!");
            setTimeout(() => setSaveMsg(""), 2000);
        } catch { console.error("Failed to update targets"); }
    }

    async function handlePhotoScan(e: React.ChangeEvent<HTMLInputElement>) {
        if (!e.target.files?.[0] || !token) return;
        const formData = new FormData();
        formData.append("image", e.target.files[0]);
        try {
            setScanLoading(true);
            const res = await fetch(`${base}/api/food-scan`, {
                method: "POST",
                headers: { Authorization: `Bearer ${token}` },
                body: formData,
            });
            const data = await res.json();
            if (res.ok) { setLog(data.log); await loadHistory(); setActiveTab("today"); }
            else alert(data.error || "Scan failed");
        } catch (err) { console.error(err); }
        finally { setScanLoading(false); }
    }

    async function handleAISuggest() {
        if (!log) return;
        setAiLoading(true);
        setSuggestions([]);
        try {
            const remaining = log.targetCalories - log.totalCalories;
            const remainingProtein = log.targetProtein - log.totalProtein;
            const res = await fetch(`${base}/api/nutrition/suggest`, {
                method: "POST",
                headers,
                body: JSON.stringify({ goal, remainingCalories: Math.max(remaining, 0), remainingProtein: Math.max(remainingProtein, 0) }),
            });
            const data = await res.json();
            setSuggestions(data.suggestions || []);
        } catch { console.error("AI suggest failed"); }
        finally { setAiLoading(false); }
    }

    async function handleAddSuggestion(s: Suggestion) {
        try {
            const res = await fetch(`${base}/api/nutrition/meal`, { method: "POST", headers, body: JSON.stringify(s) });
            const data = await res.json();
            setLog(data.log);
            setActiveTab("today");
            await loadHistory();
        } catch { console.error("Failed to add suggestion"); }
    }

    // ── NEW: Save/remove favorites ──
    function saveFavorite(meal: Meal) {
        const fav: FavoriteMeal = { id: meal._id + Date.now(), name: meal.name, calories: meal.calories, protein: meal.protein, carbs: meal.carbs, fat: meal.fat, time: meal.time };
        const updated = [fav, ...favorites.filter((f) => f.name !== meal.name)].slice(0, 12);
        setFavorites(updated);
        localStorage.setItem("smartlife-fav-meals", JSON.stringify(updated));
    }

    function removeFavorite(id: string) {
        const updated = favorites.filter((f) => f.id !== id);
        setFavorites(updated);
        localStorage.setItem("smartlife-fav-meals", JSON.stringify(updated));
    }

    if (loading) return (
        <div className="flex items-center justify-center h-64">
            <motion.div className="w-12 h-12 border-2 border-[#c8ff00] border-t-transparent rounded-full" animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity }} />
        </div>
    );
    if (!log) return <div className="text-white/60">No data found.</div>;

    const calPct = Math.min((log.totalCalories / log.targetCalories) * 100, 100);
    const remaining = log.targetCalories - log.totalCalories;

    // ── NEW: Macro split pie data ──
    const macroTotal = log.totalProtein + log.totalCarbs + log.totalFat;
    const pieData = macroTotal > 0 ? [
        { name: "Protein", value: Math.round((log.totalProtein / macroTotal) * 100), grams: log.totalProtein },
        { name: "Carbs", value: Math.round((log.totalCarbs / macroTotal) * 100), grams: log.totalCarbs },
        { name: "Fat", value: Math.round((log.totalFat / macroTotal) * 100), grams: log.totalFat },
    ] : [];

    const mealsByTime = MEAL_TIMES.filter((t) => log.meals.some((m) => m.time === t));

    return (
        <div className="space-y-7">

            {/* ── HEADER ── */}
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div>
                    <p className="text-[#c8ff00] text-xs tracking-widest uppercase mb-2">Daily Fuel</p>
                    <h1 className="text-3xl sm:text-5xl font-bold tracking-tight">Nutrition</h1>
                    <p className="text-white/40 mt-2 text-sm">
                        {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
                    </p>
                </div>

                {/* ── NEW: Streak badge ── */}
                {streak > 0 && (
                    <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-[#c8ff00]/10 border border-[#c8ff00]/25 self-start sm:self-auto"
                    >
                        <span className="text-xl">🔥</span>
                        <div>
                            <p className="text-[#c8ff00] text-sm font-bold">{streak} day streak</p>
                            <p className="text-white/30 text-[10px]">hitting your targets</p>
                        </div>
                    </motion.div>
                )}
            </div>

            {/* ── ACTION BUTTONS ── */}
            <div className="flex flex-wrap items-center gap-3">
                <label className="cursor-pointer">
                    <input type="file" accept="image/*" className="hidden" onChange={handlePhotoScan} />
                    <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                        className="px-4 py-2.5 rounded-xl border border-white/15 text-sm text-white/60 hover:text-white hover:border-white/30 transition cursor-pointer">
                        {scanLoading ? "Scanning..." : "📸 Scan Food"}
                    </motion.div>
                </label>

                <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                    onClick={() => { setShowTargets((v) => !v); setShowForm(false); }}
                    className="px-4 py-2.5 rounded-xl border border-white/15 text-sm text-white/60 hover:text-white hover:border-white/30 transition">
                    {showTargets ? "Cancel" : "⚙️ Targets"}
                </motion.button>

                {/* ── NEW: Favorites button ── */}
                {favorites.length > 0 && (
                    <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                        onClick={() => setShowFavorites(true)}
                        className="px-4 py-2.5 rounded-xl border border-white/15 text-sm text-white/60 hover:text-white hover:border-white/30 transition">
                        ⭐ Favorites ({favorites.length})
                    </motion.button>
                )}

                <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                    onClick={() => { setShowForm((v) => !v); setShowTargets(false); }}
                    className="px-5 py-2.5 rounded-xl bg-[#c8ff00] text-black font-semibold text-sm">
                    {showForm ? "Cancel" : "+ Add Meal"}
                </motion.button>
            </div>

            {saveMsg && <p className="text-[#c8ff00] text-sm">{saveMsg}</p>}

            {/* ── TARGETS FORM ── */}
            <AnimatePresence>
                {showTargets && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                        <div className="backdrop-blur-2xl bg-white/5 border border-white/10 rounded-3xl p-5 sm:p-8">
                            <h2 className="text-sm font-semibold mb-5 text-white/70">Daily Targets</h2>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                {[
                                    { key: "targetCalories", label: "Calories (kcal)" },
                                    { key: "targetProtein", label: "Protein (g)" },
                                    { key: "targetCarbs", label: "Carbs (g)" },
                                    { key: "targetFat", label: "Fat (g)" },
                                ].map(({ key, label }) => (
                                    <div key={key}>
                                        <label className="text-xs text-white/40 uppercase tracking-widest mb-1.5 block">{label}</label>
                                        <input type="number"
                                            value={targets[key as keyof typeof targets]}
                                            onChange={(e) => setTargets((t) => ({ ...t, [key]: e.target.value }))}
                                            className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white outline-none focus:border-[#c8ff00]/50 transition text-sm" />
                                    </div>
                                ))}
                            </div>
                            <button onClick={handleSaveTargets} className="mt-5 bg-[#c8ff00] text-black px-7 py-3 rounded-xl font-semibold text-sm">
                                Save Targets
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── ADD MEAL FORM ── */}
            <AnimatePresence>
                {showForm && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                        <div className="backdrop-blur-2xl bg-white/5 border border-white/10 rounded-3xl p-5 sm:p-8">
                            <h2 className="text-sm font-semibold mb-5 text-white/70">Log a Meal</h2>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                <div className="col-span-2 md:col-span-1">
                                    <label className="text-xs text-white/40 uppercase tracking-widest mb-1.5 block">Meal Name *</label>
                                    <input placeholder="e.g. Grilled Chicken" value={form.name}
                                        onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                                        className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white outline-none focus:border-[#c8ff00]/50 transition text-sm placeholder:text-white/20" />
                                </div>
                                {[
                                    { key: "calories", label: "Calories" },
                                    { key: "protein", label: "Protein (g)" },
                                    { key: "carbs", label: "Carbs (g)" },
                                    { key: "fat", label: "Fat (g)" },
                                ].map(({ key, label }) => (
                                    <div key={key}>
                                        <label className="text-xs text-white/40 uppercase tracking-widest mb-1.5 block">{label}</label>
                                        <input type="number" placeholder="0"
                                            value={form[key as keyof typeof EMPTY_FORM]}
                                            onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                                            className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white outline-none focus:border-[#c8ff00]/50 transition text-sm placeholder:text-white/20" />
                                    </div>
                                ))}
                                <div>
                                    <label className="text-xs text-white/40 uppercase tracking-widest mb-1.5 block">Time</label>
                                    <select value={form.time} onChange={(e) => setForm((f) => ({ ...f, time: e.target.value }))}
                                        className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white outline-none focus:border-[#c8ff00]/50 transition text-sm">
                                        {MEAL_TIMES.map((t) => <option key={t} value={t}>{t}</option>)}
                                    </select>
                                </div>
                            </div>
                            <button onClick={() => handleAddMeal()} className="mt-5 bg-[#c8ff00] text-black px-7 py-3 rounded-xl font-semibold text-sm">
                                Add Meal
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── CALORIE OVERVIEW ── */}
            <div className="grid md:grid-cols-3 gap-5">
                {/* Big calorie bar */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                    className="md:col-span-2 backdrop-blur-2xl bg-white/5 border border-white/10 rounded-3xl p-6 sm:p-8">
                    <div className="flex justify-between items-start mb-5">
                        <div>
                            <p className="text-xs text-white/40 uppercase tracking-widest mb-1">Calories Today</p>
                            <div className="flex items-end gap-2">
                                <span className="text-4xl sm:text-5xl font-bold text-[#c8ff00]">{log.totalCalories}</span>
                                <span className="text-white/30 mb-1 text-sm">/ {log.targetCalories} kcal</span>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-xs text-white/40 mb-1">Remaining</p>
                            <p className={`text-xl sm:text-2xl font-bold ${remaining < 0 ? "text-red-400" : "text-white"}`}>
                                {remaining < 0 ? `+${Math.abs(remaining)}` : remaining} kcal
                            </p>
                        </div>
                    </div>
                    <div className="h-2.5 bg-white/8 rounded-full overflow-hidden">
                        <motion.div className="h-full rounded-full"
                            style={{ background: calPct >= 100 ? "#ff4d6d" : "#c8ff00" }}
                            initial={{ width: 0 }}
                            animate={{ width: `${calPct}%` }}
                            transition={{ duration: 1, ease: "easeOut" }} />
                    </div>
                    <p className="text-xs text-white/30 mt-2">{Math.round(calPct)}% of daily goal</p>
                </motion.div>

                {/* Macro rings */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                    className="backdrop-blur-2xl bg-white/5 border border-white/10 rounded-3xl p-5 flex items-center justify-around">
                    <Ring value={log.totalProtein} max={log.targetProtein} color={COLORS.protein} label="Protein" />
                    <Ring value={log.totalCarbs} max={log.targetCarbs} color={COLORS.carbs} label="Carbs" />
                    <Ring value={log.totalFat} max={log.targetFat} color={COLORS.fat} label="Fat" />
                </motion.div>
            </div>

            {/* ── NEW: Macro Split Pie + Stats row ── */}
            {macroTotal > 0 && (
                <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
                    className="backdrop-blur-2xl bg-white/5 border border-white/10 rounded-3xl p-5 sm:p-7">
                    <h3 className="text-sm font-semibold text-white/70 mb-5">Today's Macro Split</h3>
                    <div className="flex flex-col sm:flex-row items-center gap-6">
                        {/* Pie */}
                        <div className="w-40 h-40 shrink-0">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie data={pieData} dataKey="value" innerRadius={40} outerRadius={64} paddingAngle={3} startAngle={90} endAngle={-270}>
                                        {pieData.map((_, i) => (
                                            <Cell key={i} fill={PIE_COLORS[i]} opacity={0.9} />
                                        ))}
                                    </Pie>
                                    <Tooltip formatter={(val: any) => `${val}%`} contentStyle={{ background: "#0a0a0a", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px", fontSize: "12px" }} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                        {/* Legend + values */}
                        <div className="flex-1 space-y-3 w-full">
                            {pieData.map((d, i) => (
                                <div key={d.name} className="flex items-center justify-between">
                                    <div className="flex items-center gap-2.5">
                                        <span className="w-3 h-3 rounded-full shrink-0" style={{ background: PIE_COLORS[i] }} />
                                        <span className="text-sm text-white/60">{d.name}</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className="text-sm font-bold" style={{ color: PIE_COLORS[i] }}>{d.grams}g</span>
                                        <span className="text-xs text-white/25 w-9 text-right">{d.value}%</span>
                                        {/* Mini bar */}
                                        <div className="w-20 h-1.5 bg-white/8 rounded-full overflow-hidden">
                                            <motion.div className="h-full rounded-full" style={{ background: PIE_COLORS[i] }}
                                                initial={{ width: 0 }} animate={{ width: `${d.value}%` }} transition={{ duration: 1, delay: i * 0.1 }} />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </motion.div>
            )}

            {/* ── TABS ── */}
            <div className="flex flex-wrap gap-1 p-1 bg-white/5 border border-white/10 rounded-2xl w-fit">
                {([
                    { id: "today", label: "🍽️ Today" },
                    { id: "history", label: "📅 History" },
                    { id: "ai", label: "✨ AI Suggest" },
                ] as const).map((tab) => (
                    <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                        className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${activeTab === tab.id ? "bg-[#c8ff00] text-black font-bold" : "text-white/40 hover:text-white/70"}`}>
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* ══════════ TODAY TAB ══════════ */}
            {activeTab === "today" && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
                    {log.meals.length === 0 ? (
                        <div className="backdrop-blur-2xl bg-white/5 border border-white/10 rounded-3xl p-12 text-center">
                            <div className="text-5xl mb-4">🥗</div>
                            <p className="text-white/40">No meals logged today. Hit "+ Add Meal" to get started.</p>
                        </div>
                    ) : (
                        // Group by meal time
                        mealsByTime.length > 0 ? (
                            <div className="space-y-5">
                                {mealsByTime.map((timeSlot) => (
                                    <div key={timeSlot}>
                                        <p className="text-xs text-white/30 uppercase tracking-widest mb-2 ml-1">{timeSlot}</p>
                                        <div className="space-y-2">
                                            {log.meals.filter((m) => m.time === timeSlot).map((meal) => (
                                                <motion.div key={meal._id}
                                                    initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                                                    className="backdrop-blur-2xl bg-white/5 border border-white/8 rounded-2xl px-5 py-4 flex items-center justify-between group">
                                                    <div className="flex items-center gap-3 min-w-0">
                                                        <span className="font-medium text-sm truncate">{meal.name}</span>
                                                    </div>
                                                    <div className="flex items-center gap-4 text-sm shrink-0">
                                                        <span className="text-[#c8ff00] font-semibold">{meal.calories} kcal</span>
                                                        <span className="text-white/30 hidden md:block text-xs">P: {meal.protein}g · C: {meal.carbs}g · F: {meal.fat}g</span>
                                                        {/* ── NEW: Star/save to favorites ── */}
                                                        <button onClick={() => saveFavorite(meal)}
                                                            title="Save to favorites"
                                                            className={`opacity-0 group-hover:opacity-100 transition text-sm ${favorites.some((f) => f.name === meal.name) ? "text-yellow-400" : "text-white/25 hover:text-yellow-400"}`}>
                                                            ⭐
                                                        </button>
                                                        <button onClick={() => handleDeleteMeal(meal._id)} className="text-white/20 hover:text-red-400 transition text-lg leading-none">×</button>
                                                    </div>
                                                </motion.div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                                {/* Meals with "Anytime" time not in time slots */}
                                {log.meals.filter((m) => !mealsByTime.includes(m.time)).map((meal) => (
                                    <motion.div key={meal._id}
                                        initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                                        className="backdrop-blur-2xl bg-white/5 border border-white/8 rounded-2xl px-5 py-4 flex items-center justify-between group">
                                        <div className="flex items-center gap-3">
                                            <span className="text-xs px-2 py-1 rounded-lg bg-white/8 text-white/40">{meal.time}</span>
                                            <span className="font-medium text-sm">{meal.name}</span>
                                        </div>
                                        <div className="flex items-center gap-4 text-sm">
                                            <span className="text-[#c8ff00] font-semibold">{meal.calories} kcal</span>
                                            <button onClick={() => saveFavorite(meal)} className="opacity-0 group-hover:opacity-100 text-white/25 hover:text-yellow-400 transition text-sm">⭐</button>
                                            <button onClick={() => handleDeleteMeal(meal._id)} className="text-white/20 hover:text-red-400 transition text-lg leading-none">×</button>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        ) : (
                            log.meals.map((meal) => (
                                <motion.div key={meal._id}
                                    initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                                    className="backdrop-blur-2xl bg-white/5 border border-white/8 rounded-2xl px-5 py-4 flex items-center justify-between group">
                                    <div className="flex items-center gap-3">
                                        <span className="text-xs px-2 py-1 rounded-lg bg-white/8 text-white/40">{meal.time}</span>
                                        <span className="font-medium text-sm">{meal.name}</span>
                                    </div>
                                    <div className="flex items-center gap-4 text-sm">
                                        <span className="text-[#c8ff00] font-semibold">{meal.calories} kcal</span>
                                        <button onClick={() => saveFavorite(meal)} className="opacity-0 group-hover:opacity-100 text-white/25 hover:text-yellow-400 transition text-sm">⭐</button>
                                        <button onClick={() => handleDeleteMeal(meal._id)} className="text-white/20 hover:text-red-400 transition text-lg leading-none">×</button>
                                    </div>
                                </motion.div>
                            ))
                        )
                    )}
                </motion.div>
            )}

            {/* ══════════ HISTORY TAB ══════════ */}
            {activeTab === "history" && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
                    {history.length === 0 ? (
                        <div className="backdrop-blur-2xl bg-white/5 border border-white/10 rounded-3xl p-12 text-center">
                            <p className="text-white/40">No history yet. Log meals for a few days to see trends.</p>
                        </div>
                    ) : (
                        <>
                            {/* Calorie area chart */}
                            <div className="backdrop-blur-2xl bg-white/5 border border-white/10 rounded-3xl p-5 sm:p-8">
                                <h3 className="text-sm font-semibold text-white/70 mb-5">Calories vs Target</h3>
                                <div className="h-64">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={history.map((h) => ({
                                            date: new Date(h.date).toLocaleDateString("en-US", { weekday: "short" }),
                                            Calories: h.calories,
                                            Target: h.targetCalories,
                                        }))}>
                                            <defs>
                                                <linearGradient id="calGrad" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#c8ff00" stopOpacity={0.3} />
                                                    <stop offset="95%" stopColor="#c8ff00" stopOpacity={0} />
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} />
                                            <XAxis dataKey="date" stroke="#ffffff30" tick={{ fontSize: 11, fill: "#ffffff50" }} />
                                            <YAxis stroke="#ffffff30" tick={{ fontSize: 11, fill: "#ffffff50" }} />
                                            <Tooltip content={<CustomTooltip />} />
                                            <Legend />
                                            <Area type="monotone" dataKey="Calories" stroke="#c8ff00" strokeWidth={2.5} fill="url(#calGrad)" dot={{ r: 3, fill: "#c8ff00", strokeWidth: 0 }} />
                                            <Area type="monotone" dataKey="Target" stroke="#ffffff25" strokeWidth={1.5} strokeDasharray="4 4" fill="none" />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>

                            {/* Macro bar chart */}
                            <div className="backdrop-blur-2xl bg-white/5 border border-white/10 rounded-3xl p-5 sm:p-8">
                                <h3 className="text-sm font-semibold text-white/70 mb-5">Macro Breakdown (g)</h3>
                                <div className="h-56">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={history.map((h) => ({
                                            date: new Date(h.date).toLocaleDateString("en-US", { weekday: "short" }),
                                            Protein: h.protein,
                                            Carbs: h.carbs,
                                            Fat: h.fat,
                                        }))}>
                                            <CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} />
                                            <XAxis dataKey="date" stroke="#ffffff30" tick={{ fontSize: 11, fill: "#ffffff50" }} />
                                            <YAxis stroke="#ffffff30" tick={{ fontSize: 11, fill: "#ffffff50" }} />
                                            <Tooltip content={<CustomTooltip />} />
                                            <Legend />
                                            <Bar dataKey="Protein" fill={COLORS.protein} radius={[4, 4, 0, 0]} />
                                            <Bar dataKey="Carbs" fill={COLORS.carbs} radius={[4, 4, 0, 0]} />
                                            <Bar dataKey="Fat" fill={COLORS.fat} radius={[4, 4, 0, 0]} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        </>
                    )}
                </motion.div>
            )}

            {/* ══════════ AI SUGGEST TAB ══════════ */}
            {activeTab === "ai" && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
                    <div className="backdrop-blur-2xl bg-white/5 border border-white/10 rounded-3xl p-5 sm:p-8">
                        <h2 className="text-base font-bold mb-1">AI Meal Suggestions</h2>
                        <p className="text-white/40 text-sm mb-6">
                            Based on your remaining {Math.max(log.targetCalories - log.totalCalories, 0)} kcal today,
                            AI will suggest meals to hit your targets.
                        </p>
                        <div className="flex flex-wrap items-end gap-4 mb-6">
                            <div>
                                <label className="text-xs text-white/40 uppercase tracking-widest mb-1.5 block">Your Goal</label>
                                <select value={goal} onChange={(e) => setGoal(e.target.value)}
                                    className="px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white outline-none focus:border-[#c8ff00]/50 transition text-sm">
                                    {GOALS.map((g) => <option key={g} value={g}>{g}</option>)}
                                </select>
                            </div>
                            <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                                onClick={handleAISuggest} disabled={aiLoading}
                                className="px-7 py-3 bg-[#c8ff00] text-black rounded-xl font-bold text-sm disabled:opacity-50 flex items-center gap-2">
                                {aiLoading ? (
                                    <>
                                        <motion.div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full" animate={{ rotate: 360 }} transition={{ duration: 0.6, repeat: Infinity }} />
                                        Thinking...
                                    </>
                                ) : "✨ Generate Suggestions"}
                            </motion.button>
                        </div>

                        <AnimatePresence>
                            {suggestions.map((s, i) => (
                                <motion.div key={i}
                                    initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
                                    className="mt-4 bg-white/3 border border-white/8 rounded-2xl p-5 flex items-start justify-between gap-4">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1.5">
                                            <span className="font-semibold text-sm">{s.name}</span>
                                            <span className="text-xs px-2 py-0.5 rounded-lg bg-white/8 text-white/40">{s.time}</span>
                                        </div>
                                        <div className="flex flex-wrap gap-3 text-xs text-white/40 mb-2">
                                            <span className="text-[#c8ff00] font-semibold">{s.calories} kcal</span>
                                            <span>P: {s.protein}g</span>
                                            <span>C: {s.carbs}g</span>
                                            <span>F: {s.fat}g</span>
                                        </div>
                                        <p className="text-xs text-white/30 italic">{s.reason}</p>
                                    </div>
                                    <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                                        onClick={() => handleAddSuggestion(s)}
                                        className="shrink-0 bg-[#c8ff00] text-black px-4 py-2 rounded-xl text-sm font-bold">
                                        + Add
                                    </motion.button>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                </motion.div>
            )}

            {/* ── NEW: Favorites Modal ── */}
            <AnimatePresence>
                {showFavorites && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
                        onClick={(e) => e.target === e.currentTarget && setShowFavorites(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.93, y: 16 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.93, y: 16 }}
                            className="w-full max-w-md bg-[#0d0d0d] border border-white/12 rounded-3xl p-6 max-h-[80vh] overflow-y-auto"
                        >
                            <div className="flex items-center justify-between mb-5">
                                <div>
                                    <h3 className="font-bold">Favorite Meals</h3>
                                    <p className="text-xs text-white/30 mt-0.5">Tap to add instantly to today</p>
                                </div>
                                <button onClick={() => setShowFavorites(false)} className="text-white/30 hover:text-white">✕</button>
                            </div>

                            <div className="space-y-2">
                                {favorites.map((fav) => (
                                    <motion.div key={fav.id} whileHover={{ scale: 1.01 }}
                                        className="flex items-center justify-between gap-3 p-3.5 rounded-2xl bg-white/5 border border-white/8 group">
                                        <div className="flex-1 min-w-0 cursor-pointer" onClick={() => {
                                            handleAddMeal({
                                                name: fav.name,
                                                calories: String(fav.calories),
                                                protein: String(fav.protein),
                                                carbs: String(fav.carbs),
                                                fat: String(fav.fat),
                                                time: fav.time,
                                            });
                                            setShowFavorites(false);
                                        }}>
                                            <p className="text-sm font-medium truncate">{fav.name}</p>
                                            <p className="text-xs text-white/30 mt-0.5">{fav.calories} kcal · P:{fav.protein}g · C:{fav.carbs}g · F:{fav.fat}g</p>
                                        </div>
                                        <div className="flex items-center gap-2 shrink-0">
                                            <motion.button whileTap={{ scale: 0.95 }}
                                                onClick={() => {
                                                    handleAddMeal({
                                                        name: fav.name,
                                                        calories: String(fav.calories),
                                                        protein: String(fav.protein),
                                                        carbs: String(fav.carbs),
                                                        fat: String(fav.fat),
                                                        time: fav.time,
                                                    });
                                                    setShowFavorites(false);
                                                }}
                                                className="text-xs px-3 py-1.5 rounded-xl bg-[#c8ff00] text-black font-bold">
                                                + Add
                                            </motion.button>
                                            <button onClick={() => removeFavorite(fav.id)} className="text-white/20 hover:text-red-400 transition opacity-0 group-hover:opacity-100 text-sm">×</button>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}