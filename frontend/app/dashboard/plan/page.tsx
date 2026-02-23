"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence, Reorder } from "framer-motion";
import { generatePlan } from "@/lib/api";
import GlassSelect from "@/components/GlassSelect";

type Exercise = { name: string; sets: number; reps: number };
type WeeklyPlan = { [day: string]: Exercise[] };

type SavedPlan = {
    id: string;
    label: string;
    goal: string;
    days: number;
    mode: string;
    plan: WeeklyPlan;
    savedAt: string;
};

const DAY_COLORS: Record<string, string> = {
    Monday: "#c8ff00",
    Tuesday: "#00BFFF",
    Wednesday: "#ff4d6d",
    Thursday: "#c8ff00",
    Friday: "#00BFFF",
    Saturday: "#ff4d6d",
    Sunday: "#ffffff30",
};

// Rest day suggestions based on goal + day count
function getRestDaySuggestion(goal: string, days: number): string {
    if (days <= 3) return "With 3 days of training, you have plenty of recovery time. Consider active rest: walking or light stretching on off days.";
    if (days === 4 && goal === "Lose fat") return "4-day split detected. Ideal: rest Wednesday and Sunday to allow lower body recovery.";
    if (days === 5 && goal === "Gain muscle") return "5-day plan: ensure at least 1 full rest day. Avoid training the same muscle group on consecutive days.";
    if (days === 6) return "High volume week! At least 1 complete rest day is essential. Watch for signs of overtraining: poor sleep, elevated resting HR.";
    return "Balance intensity with recovery. At least 1–2 rest days per week keeps performance high and injuries low.";
}

export default function PlanPage() {
    const [goal, setGoal] = useState("Lose fat");
    const [days, setDays] = useState(3);
    const [mode, setMode] = useState<"smart" | "pro">("smart");
    const [plan, setPlan] = useState<WeeklyPlan | null>(null);
    const [loading, setLoading] = useState(false);
    const [activeDay, setActiveDay] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<"plan" | "history">("plan");

    // Saved plan history
    const [savedPlans, setSavedPlans] = useState<SavedPlan[]>(() => {
        try { return JSON.parse(localStorage.getItem("smartlife-plans") || "[]"); } catch { return []; }
    });
    const [planSaved, setPlanSaved] = useState(false);
    const [planLabel, setPlanLabel] = useState("");
    const [showSaveModal, setShowSaveModal] = useState(false);

    // Drag-to-reorder state per day
    const [dayExercises, setDayExercises] = useState<Record<string, Exercise[]>>({});

    async function handleGenerate() {
        setLoading(true);
        setPlan(null);
        try {
            const res = await generatePlan({ mode, goal, days, bmi: 24 });
            setPlan(res.plan);
            // Init reorderable exercises
            const init: Record<string, Exercise[]> = {};
            Object.keys(res.plan).forEach((d) => { init[d] = [...res.plan[d]]; });
            setDayExercises(init);
            setActiveDay(Object.keys(res.plan)[0] || null);
            setActiveTab("plan");
        } catch {
            console.error("Plan failed");
        }
        setLoading(false);
    }

    function savePlan() {
        if (!plan) return;
        const saved: SavedPlan = {
            id: Date.now().toString(),
            label: planLabel.trim() || `${goal} – ${days}d plan`,
            goal,
            days,
            mode,
            plan: dayExercises,
            savedAt: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
        };
        const updated = [saved, ...savedPlans].slice(0, 10);
        setSavedPlans(updated);
        localStorage.setItem("smartlife-plans", JSON.stringify(updated));
        setPlanSaved(true);
        setShowSaveModal(false);
        setPlanLabel("");
        setTimeout(() => setPlanSaved(false), 2000);
    }

    function loadSavedPlan(saved: SavedPlan) {
        setPlan(saved.plan);
        setDayExercises(saved.plan);
        setGoal(saved.goal);
        setDays(saved.days);
        setMode(saved.mode as "smart" | "pro");
        setActiveDay(Object.keys(saved.plan)[0] || null);
        setActiveTab("plan");
    }

    function deleteSavedPlan(id: string) {
        const updated = savedPlans.filter((p) => p.id !== id);
        setSavedPlans(updated);
        localStorage.setItem("smartlife-plans", JSON.stringify(updated));
    }

    const restSuggestion = getRestDaySuggestion(goal, days);
    const currentExercises = activeDay ? (dayExercises[activeDay] ?? plan?.[activeDay] ?? []) : [];

    return (
        <div className="space-y-8 sm:space-y-10">

            {/* ── HEADER ── */}
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
                <p className="text-[#c8ff00] text-xs tracking-widest uppercase mb-2">AI Training System</p>
                <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight">Training Plan</h1>
            </motion.div>

            {/* ── CONFIG CARD ── */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="backdrop-blur-2xl bg-white/5 border border-white/10 rounded-3xl p-5 sm:p-8">
                <h2 className="text-xs sm:text-sm text-white/50 uppercase tracking-widest mb-6">Configure Plan</h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                    <GlassSelect label="Goal" value={goal} onChange={setGoal} options={[
                        { label: "Lose fat", value: "Lose fat" },
                        { label: "Gain muscle", value: "Gain muscle" },
                        { label: "Maintain", value: "Maintain" },
                    ]} />
                    <GlassSelect label="Days / Week" value={days} onChange={(v) => setDays(Number(v))} options={[3, 4, 5, 6].map((n) => ({ label: `${n} days`, value: n }))} />
                    <GlassSelect label="Mode" value={mode} onChange={(v) => setMode(v as any)} options={[
                        { label: "⚡ Smart", value: "smart" },
                        { label: "🤖 Pro AI", value: "pro" },
                    ]} />
                </div>

                {/* ── NEW: Rest Day Suggestion ── */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex items-start gap-3 px-4 py-3.5 rounded-2xl bg-blue-500/8 border border-blue-400/15 mb-6"
                >
                    <span className="text-lg mt-0.5">😴</span>
                    <div>
                        <p className="text-[10px] text-blue-300/60 uppercase tracking-widest mb-1">Recovery Tip</p>
                        <p className="text-sm text-white/50 leading-relaxed">{restSuggestion}</p>
                    </div>
                </motion.div>

                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                    <motion.button
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={handleGenerate}
                        disabled={loading}
                        className="bg-[#c8ff00] text-black px-8 sm:px-10 py-3 sm:py-4 rounded-2xl font-bold text-sm disabled:opacity-50 flex items-center justify-center gap-3"
                    >
                        {loading ? (
                            <>
                                <motion.div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full" animate={{ rotate: 360 }} transition={{ duration: 0.6, repeat: Infinity }} />
                                Generating...
                            </>
                        ) : "Generate Plan"}
                    </motion.button>

                    {mode === "pro" && <span className="text-xs text-white/40">Pro mode uses GPT-4o for a personalized plan</span>}
                    {planSaved && <span className="text-xs text-[#c8ff00]">✓ Plan saved to history!</span>}
                </div>
            </motion.div>

            {/* ── PLAN OUTPUT ── */}
            <AnimatePresence>
                {plan && (
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">

                        {/* Tabs: Plan / History */}
                        <div className="flex items-center justify-between gap-4">
                            <div className="flex gap-1 p-1 bg-white/5 border border-white/10 rounded-2xl w-fit">
                                {([
                                    { id: "plan", label: "📋 This Plan" },
                                    { id: "history", label: `🗂 History ${savedPlans.length > 0 ? `(${savedPlans.length})` : ""}` },
                                ] as const).map((tab) => (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id)}
                                        className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${activeTab === tab.id ? "bg-white/10 text-white" : "text-white/40 hover:text-white/70"}`}
                                    >
                                        {tab.label}
                                    </button>
                                ))}
                            </div>

                            {/* Save button */}
                            {activeTab === "plan" && (
                                <motion.button
                                    whileHover={{ scale: 1.03 }}
                                    whileTap={{ scale: 0.97 }}
                                    onClick={() => setShowSaveModal(true)}
                                    className="text-sm px-4 py-2 rounded-xl border border-white/15 text-white/50 hover:text-white hover:border-white/30 transition"
                                >
                                    💾 Save Plan
                                </motion.button>
                            )}
                        </div>

                        {/* ── CURRENT PLAN VIEW ── */}
                        {activeTab === "plan" && (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                                {/* Day Tabs */}
                                <div className="flex flex-wrap gap-2">
                                    {Object.keys(plan).map((day) => (
                                        <button
                                            key={day}
                                            onClick={() => setActiveDay(day)}
                                            className={`px-4 sm:px-5 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all ${activeDay === day ? "text-black" : "text-white/40 hover:text-white bg-white/5"}`}
                                            style={activeDay === day ? { background: DAY_COLORS[day] || "#c8ff00" } : {}}
                                        >
                                            {day}
                                            {plan[day].length === 0 && <span className="ml-1.5 text-[10px] opacity-60">REST</span>}
                                        </button>
                                    ))}
                                </div>

                                {/* Active Day */}
                                {activeDay && (
                                    <motion.div key={activeDay} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="backdrop-blur-2xl bg-white/5 border border-white/10 rounded-3xl p-5 sm:p-8">
                                        <div className="flex items-center gap-3 mb-6">
                                            <div className="w-2 h-8 rounded-full" style={{ background: DAY_COLORS[activeDay] || "#c8ff00" }} />
                                            <h2 className="text-lg sm:text-xl font-bold">{activeDay}</h2>
                                            <span className="text-xs text-white/30 ml-auto">
                                                {currentExercises.length > 0 ? `${currentExercises.length} exercises` : "Rest Day"}
                                            </span>
                                            {currentExercises.length > 1 && (
                                                <span className="text-[10px] text-white/20 hidden sm:block">drag to reorder</span>
                                            )}
                                        </div>

                                        {currentExercises.length === 0 ? (
                                            <div className="flex items-center gap-3 py-4">
                                                <span className="text-2xl">😴</span>
                                                <p className="text-white/40 text-sm">Rest day — focus on recovery, mobility, and nutrition.</p>
                                            </div>
                                        ) : (
                                            // ── NEW: Drag-to-reorder exercises ──
                                            <Reorder.Group
                                                axis="y"
                                                values={currentExercises}
                                                onReorder={(newOrder) => {
                                                    setDayExercises((prev) => ({ ...prev, [activeDay]: newOrder }));
                                                }}
                                                className="space-y-2"
                                            >
                                                {currentExercises.map((ex, i) => (
                                                    <Reorder.Item
                                                        key={ex.name + i}
                                                        value={ex}
                                                        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 py-4 px-4 rounded-2xl bg-white/3 border border-white/6 hover:bg-white/5 hover:border-white/10 transition-colors cursor-grab active:cursor-grabbing"
                                                        whileDrag={{ scale: 1.02, boxShadow: "0 8px 32px rgba(0,0,0,0.4)" }}
                                                    >
                                                        <div className="flex items-center gap-4">
                                                            <div className="flex flex-col gap-0.5 opacity-25 hover:opacity-50 transition shrink-0">
                                                                <div className="w-4 h-0.5 bg-white rounded" />
                                                                <div className="w-4 h-0.5 bg-white rounded" />
                                                                <div className="w-4 h-0.5 bg-white rounded" />
                                                            </div>
                                                            <span className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center text-xs text-white/40 font-mono shrink-0">
                                                                {String(i + 1).padStart(2, "0")}
                                                            </span>
                                                            <span className="font-medium text-sm sm:text-base">{ex.name}</span>
                                                        </div>
                                                        <div className="ml-14 sm:ml-0">
                                                            <span className="text-sm px-3 py-1.5 rounded-lg bg-white/5 text-white/60 font-mono">
                                                                {ex.sets} × {ex.reps}
                                                            </span>
                                                        </div>
                                                    </Reorder.Item>
                                                ))}
                                            </Reorder.Group>
                                        )}
                                    </motion.div>
                                )}
                            </motion.div>
                        )}

                        {/* ── NEW: HISTORY TAB ── */}
                        {activeTab === "history" && (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
                                {savedPlans.length === 0 ? (
                                    <div className="backdrop-blur-2xl bg-white/5 border border-white/10 rounded-3xl p-10 text-center">
                                        <p className="text-3xl mb-3">🗂</p>
                                        <p className="text-white/30 text-sm">No saved plans yet.</p>
                                        <p className="text-white/20 text-xs mt-1">Generate a plan and hit "Save Plan" to keep it here.</p>
                                    </div>
                                ) : (
                                    savedPlans.map((saved, i) => (
                                        <motion.div
                                            key={saved.id}
                                            initial={{ opacity: 0, y: 8 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: i * 0.05 }}
                                            className="backdrop-blur-2xl bg-white/5 border border-white/10 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center gap-4"
                                        >
                                            <div className="flex-1 min-w-0">
                                                <p className="font-semibold text-sm truncate">{saved.label}</p>
                                                <div className="flex flex-wrap items-center gap-2 mt-1.5">
                                                    <span className="text-[10px] px-2 py-0.5 rounded-lg bg-[#c8ff00]/10 border border-[#c8ff00]/20 text-[#c8ff00]">{saved.goal}</span>
                                                    <span className="text-[10px] px-2 py-0.5 rounded-lg bg-white/5 border border-white/10 text-white/40">{saved.days} days/week</span>
                                                    <span className="text-[10px] px-2 py-0.5 rounded-lg bg-white/5 border border-white/10 text-white/40">{saved.mode === "pro" ? "🤖 Pro AI" : "⚡ Smart"}</span>
                                                    <span className="text-[10px] text-white/20">{saved.savedAt}</span>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2 shrink-0">
                                                <motion.button
                                                    whileHover={{ scale: 1.04 }}
                                                    whileTap={{ scale: 0.96 }}
                                                    onClick={() => loadSavedPlan(saved)}
                                                    className="px-4 py-2 rounded-xl bg-[#c8ff00] text-black text-xs font-bold"
                                                >
                                                    Load
                                                </motion.button>
                                                <button onClick={() => deleteSavedPlan(saved.id)} className="px-3 py-2 rounded-xl border border-white/10 text-white/25 hover:text-red-400 hover:border-red-400/30 transition text-xs">
                                                    Delete
                                                </button>
                                            </div>
                                        </motion.div>
                                    ))
                                )}
                            </motion.div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── SAVE PLAN MODAL ── */}
            <AnimatePresence>
                {showSaveModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
                        onClick={(e) => e.target === e.currentTarget && setShowSaveModal(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.93, y: 16 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.93, y: 16 }}
                            className="w-full max-w-sm bg-[#0d0d0d] border border-white/15 rounded-3xl p-6 space-y-5"
                        >
                            <div className="flex items-center justify-between">
                                <h3 className="font-bold">Save This Plan</h3>
                                <button onClick={() => setShowSaveModal(false)} className="text-white/30 hover:text-white">✕</button>
                            </div>
                            <div>
                                <label className="text-xs text-white/40 uppercase tracking-widest mb-2 block">Plan Name (optional)</label>
                                <input
                                    value={planLabel}
                                    onChange={(e) => setPlanLabel(e.target.value)}
                                    placeholder={`${goal} – ${days}d plan`}
                                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm outline-none focus:border-[#c8ff00]/40 transition placeholder:text-white/20"
                                />
                            </div>
                            <motion.button whileTap={{ scale: 0.97 }} onClick={savePlan} className="w-full py-3 rounded-2xl bg-[#c8ff00] text-black font-bold text-sm">
                                Save to History
                            </motion.button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}