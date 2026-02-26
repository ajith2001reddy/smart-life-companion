"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence, Reorder } from "framer-motion";
import { useRouter } from "next/navigation";
import { generatePlan } from "@/lib/api";
import GlassSelect from "@/components/GlassSelect";

/* ─── Types ─── */
type Exercise = {
    name: string;
    sets: number;
    reps: number;
    muscle?: string;
    difficulty?: "beginner" | "intermediate" | "advanced";
    notes?: string;
};
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

/* ─── Constants ─── */
const DAY_COLORS: Record<string, string> = {
    Monday: "#c8ff00",
    Tuesday: "#00BFFF",
    Wednesday: "#ff4d6d",
    Thursday: "#FF8C00",
    Friday: "#a78bfa",
    Saturday: "#00BFFF",
    Sunday: "#ffffff20",
};

const DAY_ICONS: Record<string, string> = {
    Monday: "💪", Tuesday: "🔥", Wednesday: "⚡",
    Thursday: "🏋️", Friday: "🚀", Saturday: "🏃", Sunday: "😴",
};

const MUSCLE_COLORS: Record<string, { bg: string; text: string }> = {
    Chest: { bg: "rgba(255,77,109,0.15)", text: "#ff4d6d" },
    Back: { bg: "rgba(0,191,255,0.15)", text: "#00BFFF" },
    Legs: { bg: "rgba(200,255,0,0.15)", text: "#c8ff00" },
    Shoulders: { bg: "rgba(255,140,0,0.15)", text: "#FF8C00" },
    Arms: { bg: "rgba(167,139,250,0.15)", text: "#a78bfa" },
    Core: { bg: "rgba(0,255,180,0.15)", text: "#00ffb4" },
    Cardio: { bg: "rgba(255,200,0,0.15)", text: "#ffc800" },
    "Full Body": { bg: "rgba(255,255,255,0.08)", text: "rgba(255,255,255,0.6)" },
};

const DIFFICULTY_MAP = {
    beginner: { label: "Beginner", color: "#c8ff00", bars: 1 },
    intermediate: { label: "Intermediate", color: "#FF8C00", bars: 2 },
    advanced: { label: "Advanced", color: "#ff4d6d", bars: 3 },
};

/* ─── Helpers ─── */
function getDayVolume(exercises: Exercise[]) {
    return exercises.reduce((sum, ex) => sum + ex.sets * ex.reps, 0);
}

function getDayMuscles(exercises: Exercise[]): string[] {
    const seen = new Set<string>();
    exercises.forEach((ex) => { if (ex.muscle) seen.add(ex.muscle); });
    return Array.from(seen);
}

function getRestDaySuggestion(goal: string, days: number): string {
    if (days <= 3) return "3-day split: great for recovery. Active rest (walk, stretch) on off days.";
    if (days === 4 && goal === "Lose fat") return "4-day split: rest Wed & Sun for optimal lower body recovery.";
    if (days === 5 && goal === "Gain muscle") return "5-day plan: avoid training same muscle group on consecutive days.";
    if (days === 6) return "High volume! 1 full rest day is essential. Watch for overtraining signs.";
    return "Balance intensity with recovery. 1–2 rest days per week keeps performance high.";
}

function getWeekStats(plan: WeeklyPlan) {
    const days = Object.keys(plan);
    const trainingDays = days.filter((d) => plan[d].length > 0);
    const totalExercises = days.reduce((s, d) => s + plan[d].length, 0);
    const totalSets = days.reduce((s, d) => s + plan[d].reduce((ss, ex) => ss + ex.sets, 0), 0);
    const totalVolume = days.reduce((s, d) => s + getDayVolume(plan[d]), 0);
    return { trainingDays: trainingDays.length, totalExercises, totalSets, totalVolume };
}

/* ─── Difficulty Bars ─── */
function DifficultyBars({ level }: { level?: string }) {
    const d = DIFFICULTY_MAP[(level as keyof typeof DIFFICULTY_MAP) || "intermediate"];
    if (!d) return null;
    return (
        <div className="flex items-center gap-1">
            {[1, 2, 3].map((i) => (
                <div key={i} className="w-1.5 h-3 rounded-sm"
                    style={{ background: i <= d.bars ? d.color : "rgba(255,255,255,0.1)" }} />
            ))}
        </div>
    );
}

/* ─── Muscle Tag ─── */
function MuscleTag({ muscle }: { muscle?: string }) {
    if (!muscle) return null;
    const style = MUSCLE_COLORS[muscle] || MUSCLE_COLORS["Full Body"];
    return (
        <span className="text-[10px] px-2 py-0.5 rounded-md font-semibold"
            style={{ background: style.bg, color: style.text }}>
            {muscle}
        </span>
    );
}

/* ─── Week Overview Bar ─── */
function WeekOverview({ plan, activeDay, onSelectDay }: {
    plan: WeeklyPlan;
    activeDay: string | null;
    onSelectDay: (d: string) => void;
}) {
    const days = Object.keys(plan);
    const maxVol = Math.max(...days.map((d) => getDayVolume(plan[d])), 1);

    return (
        <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${days.length}, 1fr)` }}>
            {days.map((day, i) => {
                const exs = plan[day];
                const vol = getDayVolume(exs);
                const pct = vol / maxVol;
                const isRest = exs.length === 0;
                const isActive = activeDay === day;
                const color = DAY_COLORS[day] || "#c8ff00";

                return (
                    <motion.button
                        key={day}
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                        onClick={() => onSelectDay(day)}
                        className="flex flex-col items-center gap-2 p-2.5 rounded-2xl transition-all cursor-pointer"
                        style={{
                            background: isActive ? `${color}15` : "rgba(255,255,255,0.03)",
                            border: `1px solid ${isActive ? `${color}40` : "rgba(255,255,255,0.06)"}`,
                        }}
                        whileHover={{ scale: 1.04 }}
                        whileTap={{ scale: 0.97 }}
                    >
                        {/* Bar */}
                        <div className="w-full flex flex-col items-center gap-1">
                            <div className="w-full h-16 flex items-end justify-center">
                                <motion.div
                                    className="w-3 rounded-t-sm"
                                    initial={{ height: 0 }}
                                    animate={{ height: isRest ? 4 : `${Math.max(pct * 100, 8)}%` }}
                                    transition={{ delay: 0.3 + i * 0.05, duration: 0.6, ease: "easeOut" }}
                                    style={{
                                        background: isRest ? "rgba(255,255,255,0.08)" : isActive ? color : `${color}60`,
                                        boxShadow: isActive && !isRest ? `0 0 8px ${color}50` : "none",
                                    }}
                                />
                            </div>
                        </div>
                        {/* Day label */}
                        <span className="text-[10px] font-bold uppercase tracking-wider"
                            style={{ color: isActive ? color : "rgba(255,255,255,0.3)" }}>
                            {day.slice(0, 3)}
                        </span>
                        {/* Exercise count */}
                        <span className="text-[9px]" style={{ color: isRest ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.4)" }}>
                            {isRest ? "Rest" : `${exs.length} ex`}
                        </span>
                    </motion.button>
                );
            })}
        </div>
    );
}

/* ══════════════════════════════════ MAIN PAGE ══ */
export default function PlanPage() {
    const router = useRouter();

    const [goal, setGoal] = useState("Lose fat");
    const [days, setDays] = useState(3);
    const [mode, setMode] = useState<"smart" | "pro">("smart");
    const [plan, setPlan] = useState<WeeklyPlan | null>(null);
    const [loading, setLoading] = useState(false);
    const [activeDay, setActiveDay] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<"plan" | "history">("plan");

    const [savedPlans, setSavedPlans] = useState<SavedPlan[]>(() => {
        try { return JSON.parse(localStorage.getItem("smartlife-plans") || "[]"); } catch { return []; }
    });
    const [planSaved, setPlanSaved] = useState(false);
    const [planLabel, setPlanLabel] = useState("");
    const [showSaveModal, setShowSaveModal] = useState(false);

    const [dayExercises, setDayExercises] = useState<Record<string, Exercise[]>>({});

    // ── Note editing ──
    const [editingNote, setEditingNote] = useState<string | null>(null); // "day:index"
    const [noteValue, setNoteValue] = useState("");

    // ── Swap exercise ──
    const [swapTarget, setSwapTarget] = useState<{ day: string; index: number } | null>(null);
    const [swapName, setSwapName] = useState("");

    async function handleGenerate() {
        setLoading(true);
        setPlan(null);
        try {
            const res = await generatePlan({ mode, goal, days, bmi: 24 });
            // Enrich with muscle/difficulty metadata
            const enriched: WeeklyPlan = {};
            Object.keys(res.plan).forEach((day) => {
                enriched[day] = res.plan[day].map((ex: Exercise, i: number) => ({
                    ...ex,
                    muscle: ex.muscle || inferMuscle(ex.name, day),
                    difficulty: ex.difficulty || inferDifficulty(ex.name),
                    notes: ex.notes || "",
                }));
            });
            setPlan(enriched);
            const init: Record<string, Exercise[]> = {};
            Object.keys(enriched).forEach((d) => { init[d] = [...enriched[d]]; });
            setDayExercises(init);
            setActiveDay(Object.keys(enriched)[0] || null);
            setActiveTab("plan");
        } catch {
            console.error("Plan generation failed");
        }
        setLoading(false);
    }

    function inferMuscle(name: string, day: string): string {
        const n = name.toLowerCase();
        if (/bench|chest|fly|push.up/.test(n)) return "Chest";
        if (/row|pull|lat|deadlift|back/.test(n)) return "Back";
        if (/squat|lunge|leg|hamstring|glute|calf/.test(n)) return "Legs";
        if (/shoulder|press|lateral|delt/.test(n)) return "Shoulders";
        if (/curl|tricep|bicep|arm/.test(n)) return "Arms";
        if (/plank|crunch|abs|core|sit.up/.test(n)) return "Core";
        if (/run|cardio|jump|sprint|bike/.test(n)) return "Cardio";
        return "Full Body";
    }

    function inferDifficulty(name: string): "beginner" | "intermediate" | "advanced" {
        const n = name.toLowerCase();
        if (/deadlift|clean|snatch|muscle.up|pistol/.test(n)) return "advanced";
        if (/squat|bench|row|pull.up|dip/.test(n)) return "intermediate";
        return "beginner";
    }

    function savePlan() {
        if (!plan) return;
        const saved: SavedPlan = {
            id: Date.now().toString(),
            label: planLabel.trim() || `${goal} – ${days}d plan`,
            goal, days, mode,
            plan: dayExercises,
            savedAt: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
        };
        const updated = [saved, ...savedPlans].slice(0, 10);
        setSavedPlans(updated);
        localStorage.setItem("smartlife-plans", JSON.stringify(updated));
        setPlanSaved(true);
        setShowSaveModal(false);
        setPlanLabel("");
        setTimeout(() => setPlanSaved(false), 2500);
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

    function handleStartWorkout(day: string) {
        const exercises = dayExercises[day] ?? plan?.[day] ?? [];
        if (!exercises.length) return;
        const prefill = {
            workoutName: `${day} – ${goal}`,
            exercises: exercises.map((ex) => ({
                id: crypto.randomUUID(),
                name: ex.name,
                sets: ex.sets,
                reps: ex.reps,
                weight: 0,
                notes: ex.notes || "",
            })),
        };
        localStorage.setItem("smartlife-workout-prefill", JSON.stringify(prefill));
        router.push("/dashboard/workout");
    }

    function saveNote(day: string, index: number) {
        setDayExercises((prev) => {
            const updated = [...(prev[day] || [])];
            updated[index] = { ...updated[index], notes: noteValue };
            return { ...prev, [day]: updated };
        });
        setEditingNote(null);
        setNoteValue("");
    }

    function swapExercise() {
        if (!swapTarget || !swapName.trim()) return;
        const { day, index } = swapTarget;
        setDayExercises((prev) => {
            const updated = [...(prev[day] || [])];
            updated[index] = { ...updated[index], name: swapName.trim() };
            return { ...prev, [day]: updated };
        });
        setSwapTarget(null);
        setSwapName("");
    }

    const currentExercises = activeDay ? (dayExercises[activeDay] ?? plan?.[activeDay] ?? []) : [];
    const weekStats = plan ? getWeekStats(dayExercises as WeeklyPlan) : null;
    const restSuggestion = getRestDaySuggestion(goal, days);

    return (
        <div className="space-y-6 sm:space-y-8">

            {/* ── PAGE HEADER ── */}
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
                <p className="text-[#c8ff00] text-xs tracking-widest uppercase mb-2">AI-Powered</p>
                <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight">Workout Plan</h1>
                <p className="text-white/40 text-sm mt-2">Generate a personalised weekly training plan with muscle targeting and difficulty levels.</p>
            </motion.div>

            {/* ── CONFIG PANEL ── */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 }}
                className="backdrop-blur-2xl bg-white/5 border border-white/10 rounded-3xl p-5 sm:p-8 space-y-6"
            >
                {/* Goal / Days / Mode selects */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <GlassSelect
                        label="Fitness Goal"
                        options={[
                            { label: "🔥 Lose Fat", value: "Lose fat" },
                            { label: "💪 Gain Muscle", value: "Gain muscle" },
                            { label: "⚡ Maintain Fitness", value: "Maintain" },
                            { label: "🏃 Build Endurance", value: "Endurance" },
                        ]}
                        value={goal}
                        onChange={setGoal}
                    />
                    <GlassSelect
                        label="Days per Week"
                        options={[3, 4, 5, 6].map((d) => ({ label: `${d} days / week`, value: d }))}
                        value={days}
                        onChange={setDays}
                    />
                    <GlassSelect
                        label="Plan Mode"
                        options={[
                            { label: "⚡ Smart (instant)", value: "smart" },
                            { label: "🤖 Pro AI (GPT-4o)", value: "pro" },
                        ]}
                        value={mode}
                        onChange={setMode}
                    />
                </div>

                {/* Recovery tip */}
                <motion.div
                    key={`${goal}-${days}`}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-start gap-3 px-4 py-3.5 rounded-2xl"
                    style={{ background: "rgba(0,191,255,0.05)", border: "1px solid rgba(0,191,255,0.1)" }}
                >
                    <span className="text-[#00BFFF] text-lg mt-0.5">💡</span>
                    <div>
                        <p className="text-[10px] text-[#00BFFF]/60 uppercase tracking-widest mb-1">Recovery Tip</p>
                        <p className="text-sm text-white/50 leading-relaxed">{restSuggestion}</p>
                    </div>
                </motion.div>

                {/* Action row */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={handleGenerate}
                        disabled={loading}
                        className="relative overflow-hidden bg-[#c8ff00] text-black px-8 py-3.5 rounded-2xl font-bold text-sm disabled:opacity-50 flex items-center justify-center gap-3 w-full sm:w-auto"
                    >
                        {loading ? (
                            <>
                                <motion.div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full"
                                    animate={{ rotate: 360 }} transition={{ duration: 0.6, repeat: Infinity }} />
                                Generating your plan...
                            </>
                        ) : (
                            <>✨ Generate Plan</>
                        )}
                        {/* Shimmer on hover */}
                        {!loading && (
                            <motion.div
                                className="absolute inset-0 -translate-x-full"
                                style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)" }}
                                whileHover={{ translateX: "200%" }}
                                transition={{ duration: 0.6 }}
                            />
                        )}
                    </motion.button>

                    {mode === "pro" && (
                        <span className="text-xs flex items-center gap-1.5 text-white/30">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#a78bfa] inline-block" />
                            GPT-4o — highly personalised output
                        </span>
                    )}
                    {planSaved && (
                        <motion.span
                            initial={{ opacity: 0, x: -8 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0 }}
                            className="text-xs text-[#c8ff00] flex items-center gap-1.5">
                            ✓ Plan saved to history!
                        </motion.span>
                    )}
                </div>
            </motion.div>

            {/* ── PLAN OUTPUT ── */}
            <AnimatePresence>
                {plan && (
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">

                        {/* ── WEEK STATS ROW ── */}
                        {weekStats && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="grid grid-cols-2 sm:grid-cols-4 gap-3"
                            >
                                {[
                                    { label: "Training Days", value: weekStats.trainingDays, unit: "/ week", color: "#c8ff00", icon: "📅" },
                                    { label: "Total Exercises", value: weekStats.totalExercises, unit: "movements", color: "#00BFFF", icon: "🏋️" },
                                    { label: "Total Sets", value: weekStats.totalSets, unit: "sets", color: "#FF8C00", icon: "🔄" },
                                    { label: "Weekly Volume", value: weekStats.totalVolume.toLocaleString(), unit: "reps", color: "#ff4d6d", icon: "📊" },
                                ].map((s, i) => (
                                    <motion.div key={s.label}
                                        initial={{ opacity: 0, y: 12 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: i * 0.07 }}
                                        className="backdrop-blur-2xl bg-white/5 border border-white/10 rounded-2xl p-4">
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className="text-base">{s.icon}</span>
                                            <p className="text-[10px] text-white/40 uppercase tracking-widest">{s.label}</p>
                                        </div>
                                        <p className="text-xl font-bold" style={{ color: s.color }}>
                                            {s.value}
                                            <span className="text-xs font-normal text-white/30 ml-1.5">{s.unit}</span>
                                        </p>
                                    </motion.div>
                                ))}
                            </motion.div>
                        )}

                        {/* ── WEEK OVERVIEW BARS ── */}
                        <div className="backdrop-blur-2xl bg-white/5 border border-white/10 rounded-3xl p-5 sm:p-6">
                            <p className="text-[10px] text-white/30 uppercase tracking-widest mb-4">Weekly Volume Distribution</p>
                            <WeekOverview
                                plan={dayExercises as WeeklyPlan}
                                activeDay={activeDay}
                                onSelectDay={setActiveDay}
                            />
                        </div>

                        {/* ── TABS ── */}
                        <div className="flex items-center justify-between gap-4">
                            <div className="flex gap-1 p-1 bg-white/5 border border-white/10 rounded-2xl w-fit">
                                {([
                                    { id: "plan", label: "📋 This Plan" },
                                    { id: "history", label: `🗂 History${savedPlans.length > 0 ? ` (${savedPlans.length})` : ""}` },
                                ] as const).map((tab) => (
                                    <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                                        className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${activeTab === tab.id ? "bg-white/10 text-white" : "text-white/40 hover:text-white/70"}`}>
                                        {tab.label}
                                    </button>
                                ))}
                            </div>

                            {activeTab === "plan" && (
                                <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                                    onClick={() => setShowSaveModal(true)}
                                    className="text-sm px-4 py-2 rounded-xl border border-white/15 text-white/50 hover:text-white hover:border-white/30 transition flex items-center gap-2">
                                    💾 Save Plan
                                </motion.button>
                            )}
                        </div>

                        {/* ══════════ PLAN TAB ══════════ */}
                        {activeTab === "plan" && (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-1 lg:grid-cols-3 gap-5">

                                {/* ── LEFT: Day selector sidebar ── */}
                                <div className="space-y-2">
                                    <p className="text-[10px] text-white/30 uppercase tracking-widest mb-3">Select Day</p>
                                    {Object.keys(plan).map((day, i) => {
                                        const exs = dayExercises[day] ?? plan[day] ?? [];
                                        const isRest = exs.length === 0;
                                        const isActive = activeDay === day;
                                        const color = DAY_COLORS[day] || "#c8ff00";
                                        const muscles = getDayMuscles(exs);

                                        return (
                                            <motion.button
                                                key={day}
                                                initial={{ opacity: 0, x: -10 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: i * 0.04 }}
                                                onClick={() => setActiveDay(day)}
                                                className="w-full text-left p-4 rounded-2xl transition-all"
                                                style={{
                                                    background: isActive ? `${color}10` : "rgba(255,255,255,0.03)",
                                                    border: `1px solid ${isActive ? `${color}30` : "rgba(255,255,255,0.07)"}`,
                                                }}
                                                whileHover={{ scale: 1.01 }}
                                                whileTap={{ scale: 0.99 }}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <span className="text-xl">{DAY_ICONS[day] || "🏋️"}</span>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2">
                                                            <p className="text-sm font-semibold" style={{ color: isActive ? color : "white" }}>
                                                                {day}
                                                            </p>
                                                            {isRest && (
                                                                <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-white/5 text-white/30 font-medium">
                                                                    REST
                                                                </span>
                                                            )}
                                                        </div>
                                                        {!isRest && (
                                                            <p className="text-[11px] text-white/30 mt-0.5">
                                                                {exs.length} exercises · {getDayVolume(exs)} reps
                                                            </p>
                                                        )}
                                                        {muscles.length > 0 && (
                                                            <div className="flex flex-wrap gap-1 mt-1.5">
                                                                {muscles.slice(0, 2).map((m) => (
                                                                    <MuscleTag key={m} muscle={m} />
                                                                ))}
                                                                {muscles.length > 2 && (
                                                                    <span className="text-[9px] text-white/20">+{muscles.length - 2}</span>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                    {isActive && (
                                                        <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: color }} />
                                                    )}
                                                </div>
                                            </motion.button>
                                        );
                                    })}
                                </div>

                                {/* ── RIGHT: Exercise list ── */}
                                <div className="lg:col-span-2">
                                    <AnimatePresence mode="wait">
                                        {activeDay && (
                                            <motion.div
                                                key={activeDay}
                                                initial={{ opacity: 0, x: 16 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                exit={{ opacity: 0, x: -16 }}
                                                transition={{ duration: 0.25 }}
                                                className="backdrop-blur-2xl bg-white/5 border border-white/10 rounded-3xl p-5 sm:p-7 space-y-5"
                                            >
                                                {/* Day header */}
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-1.5 h-10 rounded-full" style={{ background: DAY_COLORS[activeDay] || "#c8ff00" }} />
                                                        <div>
                                                            <h2 className="text-xl font-bold">{DAY_ICONS[activeDay]} {activeDay}</h2>
                                                            <p className="text-xs text-white/30 mt-0.5">
                                                                {currentExercises.length > 0
                                                                    ? `${currentExercises.length} exercises · ${getDayVolume(currentExercises)} total reps`
                                                                    : "Rest day"}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    {currentExercises.length > 0 && (
                                                        <div className="flex flex-wrap gap-1">
                                                            {getDayMuscles(currentExercises).map((m) => (
                                                                <MuscleTag key={m} muscle={m} />
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>

                                                {currentExercises.length === 0 ? (
                                                    <div className="flex items-center gap-4 py-8 px-4 rounded-2xl"
                                                        style={{ background: "rgba(255,255,255,0.02)", border: "1px dashed rgba(255,255,255,0.08)" }}>
                                                        <span className="text-4xl">😴</span>
                                                        <div>
                                                            <p className="font-semibold text-white/60">Rest Day</p>
                                                            <p className="text-sm text-white/30 mt-1">Focus on recovery, mobility, hydration and good sleep.</p>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <>
                                                        {currentExercises.length > 1 && (
                                                            <p className="text-[10px] text-white/20 uppercase tracking-widest">
                                                                Drag to reorder · click 🔄 to swap · click 📝 to add notes
                                                            </p>
                                                        )}

                                                        <Reorder.Group
                                                            axis="y"
                                                            values={currentExercises}
                                                            onReorder={(newOrder) => {
                                                                setDayExercises((prev) => ({ ...prev, [activeDay]: newOrder }));
                                                            }}
                                                            className="space-y-2"
                                                        >
                                                            {currentExercises.map((ex, i) => {
                                                                const noteKey = `${activeDay}:${i}`;
                                                                const isEditingThisNote = editingNote === noteKey;
                                                                const color = DAY_COLORS[activeDay] || "#c8ff00";

                                                                return (
                                                                    <Reorder.Item
                                                                        key={ex.name + i}
                                                                        value={ex}
                                                                        className="rounded-2xl overflow-hidden cursor-grab active:cursor-grabbing"
                                                                        style={{
                                                                            background: "rgba(255,255,255,0.03)",
                                                                            border: "1px solid rgba(255,255,255,0.07)",
                                                                        }}
                                                                        whileDrag={{ scale: 1.02, boxShadow: "0 12px 40px rgba(0,0,0,0.5)", zIndex: 10 }}
                                                                    >
                                                                        {/* Main row */}
                                                                        <div className="flex items-center gap-3 p-4">
                                                                            {/* Drag handle */}
                                                                            <div className="flex flex-col gap-0.5 opacity-20 hover:opacity-50 shrink-0">
                                                                                {[0, 1, 2].map((k) => (
                                                                                    <div key={k} className="w-3.5 h-0.5 bg-white rounded" />
                                                                                ))}
                                                                            </div>

                                                                            {/* Number */}
                                                                            <div className="w-7 h-7 rounded-lg flex items-center justify-center text-[11px] font-mono shrink-0"
                                                                                style={{ background: `${color}15`, color: `${color}80` }}>
                                                                                {String(i + 1).padStart(2, "0")}
                                                                            </div>

                                                                            {/* Name + muscle */}
                                                                            <div className="flex-1 min-w-0">
                                                                                <p className="font-semibold text-sm truncate">{ex.name}</p>
                                                                                <div className="flex items-center gap-2 mt-1">
                                                                                    <MuscleTag muscle={ex.muscle} />
                                                                                    <DifficultyBars level={ex.difficulty} />
                                                                                </div>
                                                                            </div>

                                                                            {/* Sets × Reps badge */}
                                                                            <div className="shrink-0 text-center px-3 py-2 rounded-xl"
                                                                                style={{ background: `${color}10`, border: `1px solid ${color}25` }}>
                                                                                <p className="text-sm font-bold font-mono" style={{ color }}>
                                                                                    {ex.sets} × {ex.reps}
                                                                                </p>
                                                                                <p className="text-[9px] text-white/30">sets×reps</p>
                                                                            </div>

                                                                            {/* Action buttons */}
                                                                            <div className="flex gap-1 shrink-0">
                                                                                <button
                                                                                    onClick={() => {
                                                                                        setSwapTarget({ day: activeDay, index: i });
                                                                                        setSwapName(ex.name);
                                                                                    }}
                                                                                    className="w-8 h-8 rounded-xl flex items-center justify-center text-sm transition-colors"
                                                                                    style={{ background: "rgba(255,255,255,0.05)" }}
                                                                                    title="Swap exercise"
                                                                                >
                                                                                    🔄
                                                                                </button>
                                                                                <button
                                                                                    onClick={() => {
                                                                                        setEditingNote(isEditingThisNote ? null : noteKey);
                                                                                        setNoteValue(ex.notes || "");
                                                                                    }}
                                                                                    className="w-8 h-8 rounded-xl flex items-center justify-center text-sm transition-all"
                                                                                    style={{
                                                                                        background: isEditingThisNote ? "rgba(200,255,0,0.15)" : "rgba(255,255,255,0.05)",
                                                                                    }}
                                                                                    title="Add note"
                                                                                >
                                                                                    📝
                                                                                </button>
                                                                            </div>
                                                                        </div>

                                                                        {/* Note display */}
                                                                        <AnimatePresence>
                                                                            {ex.notes && !isEditingThisNote && (
                                                                                <motion.div
                                                                                    initial={{ opacity: 0, height: 0 }}
                                                                                    animate={{ opacity: 1, height: "auto" }}
                                                                                    exit={{ opacity: 0, height: 0 }}
                                                                                    className="px-4 pb-3 overflow-hidden"
                                                                                >
                                                                                    <p className="text-xs text-white/40 px-3 py-2 rounded-xl"
                                                                                        style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                                                                                        📝 {ex.notes}
                                                                                    </p>
                                                                                </motion.div>
                                                                            )}

                                                                            {/* Note editor */}
                                                                            {isEditingThisNote && (
                                                                                <motion.div
                                                                                    initial={{ opacity: 0, height: 0 }}
                                                                                    animate={{ opacity: 1, height: "auto" }}
                                                                                    exit={{ opacity: 0, height: 0 }}
                                                                                    className="px-4 pb-4 overflow-hidden"
                                                                                >
                                                                                    <div className="flex gap-2">
                                                                                        <input
                                                                                            value={noteValue}
                                                                                            onChange={(e) => setNoteValue(e.target.value)}
                                                                                            placeholder="e.g. slow the eccentric, use dumbbells..."
                                                                                            className="flex-1 px-3 py-2 rounded-xl text-xs text-white outline-none"
                                                                                            style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(200,255,0,0.3)" }}
                                                                                            autoFocus
                                                                                            onKeyDown={(e) => {
                                                                                                if (e.key === "Enter") saveNote(activeDay, i);
                                                                                                if (e.key === "Escape") { setEditingNote(null); setNoteValue(""); }
                                                                                            }}
                                                                                        />
                                                                                        <button onClick={() => saveNote(activeDay, i)}
                                                                                            className="px-3 py-2 rounded-xl text-xs font-bold text-black"
                                                                                            style={{ background: "#c8ff00" }}>
                                                                                            Save
                                                                                        </button>
                                                                                    </div>
                                                                                </motion.div>
                                                                            )}
                                                                        </AnimatePresence>
                                                                    </Reorder.Item>
                                                                );
                                                            })}
                                                        </Reorder.Group>

                                                        {/* Start Workout */}
                                                        <motion.button
                                                            whileHover={{ scale: 1.01 }}
                                                            whileTap={{ scale: 0.98 }}
                                                            onClick={() => handleStartWorkout(activeDay)}
                                                            className="w-full py-4 rounded-2xl font-bold text-sm text-black flex items-center justify-center gap-3 relative overflow-hidden"
                                                            style={{ background: "linear-gradient(135deg, #c8ff00 0%, #aaee00 100%)" }}
                                                        >
                                                            <span className="text-lg">🏋️</span>
                                                            Start {activeDay} Workout
                                                            <span className="text-black/40 text-xs font-normal">
                                                                {currentExercises.length} exercises ready
                                                            </span>
                                                        </motion.button>
                                                    </>
                                                )}
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            </motion.div>
                        )}

                        {/* ══════════ HISTORY TAB ══════════ */}
                        {activeTab === "history" && (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
                                {savedPlans.length === 0 ? (
                                    <div className="backdrop-blur-2xl bg-white/5 border border-white/10 rounded-3xl p-12 text-center">
                                        <p className="text-4xl mb-4">🗂</p>
                                        <p className="text-white/30 text-sm">No saved plans yet.</p>
                                        <p className="text-white/20 text-xs mt-1">Generate a plan and hit "Save Plan" to keep it here.</p>
                                    </div>
                                ) : (
                                    savedPlans.map((saved, i) => (
                                        <motion.div key={saved.id}
                                            initial={{ opacity: 0, y: 8 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: i * 0.05 }}
                                            className="backdrop-blur-2xl bg-white/5 border border-white/10 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center gap-4">
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
                                                <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                                                    onClick={() => loadSavedPlan(saved)}
                                                    className="px-4 py-2 rounded-xl bg-[#c8ff00] text-black text-xs font-bold">
                                                    Load Plan
                                                </motion.button>
                                                <button onClick={() => deleteSavedPlan(saved.id)}
                                                    className="px-3 py-2 rounded-xl border border-white/10 text-white/25 hover:text-red-400 hover:border-red-400/30 transition text-xs">
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

            {/* ── Empty state before generation ── */}
            {!plan && !loading && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="flex flex-col items-center justify-center py-20 text-center"
                    style={{ border: "1px dashed rgba(255,255,255,0.08)", borderRadius: "1.5rem" }}
                >
                    <div className="text-5xl mb-4">✨</div>
                    <p className="text-white/40 text-base font-medium">Your plan will appear here</p>
                    <p className="text-white/20 text-sm mt-1">Configure your goal and click Generate Plan above</p>
                </motion.div>
            )}

            {/* ── SWAP MODAL ── */}
            <AnimatePresence>
                {swapTarget && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
                        onClick={(e) => e.target === e.currentTarget && setSwapTarget(null)}>
                        <motion.div initial={{ scale: 0.93, y: 16 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.93, y: 16 }}
                            className="w-full max-w-sm bg-[#0d0d0d] border border-white/15 rounded-3xl p-6 space-y-5">
                            <div className="flex items-center justify-between">
                                <h3 className="font-bold">🔄 Swap Exercise</h3>
                                <button onClick={() => setSwapTarget(null)} className="text-white/30 hover:text-white">✕</button>
                            </div>
                            <div>
                                <label className="text-xs text-white/40 uppercase tracking-widest mb-2 block">New Exercise Name</label>
                                <input value={swapName} onChange={(e) => setSwapName(e.target.value)}
                                    placeholder="e.g. Incline Dumbbell Press"
                                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm outline-none focus:border-[#c8ff00]/40 transition placeholder:text-white/20"
                                    onKeyDown={(e) => { if (e.key === "Enter") swapExercise(); }}
                                    autoFocus />
                            </div>
                            <motion.button whileTap={{ scale: 0.97 }} onClick={swapExercise}
                                disabled={!swapName.trim()}
                                className="w-full py-3 rounded-2xl bg-[#c8ff00] text-black font-bold text-sm disabled:opacity-40">
                                Swap Exercise
                            </motion.button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── SAVE PLAN MODAL ── */}
            <AnimatePresence>
                {showSaveModal && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
                        onClick={(e) => e.target === e.currentTarget && setShowSaveModal(false)}>
                        <motion.div initial={{ scale: 0.93, y: 16 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.93, y: 16 }}
                            className="w-full max-w-sm bg-[#0d0d0d] border border-white/15 rounded-3xl p-6 space-y-5">
                            <div className="flex items-center justify-between">
                                <h3 className="font-bold">💾 Save This Plan</h3>
                                <button onClick={() => setShowSaveModal(false)} className="text-white/30 hover:text-white">✕</button>
                            </div>
                            {weekStats && (
                                <div className="grid grid-cols-3 gap-2">
                                    {[
                                        { label: "Days", value: weekStats.trainingDays },
                                        { label: "Exercises", value: weekStats.totalExercises },
                                        { label: "Total Sets", value: weekStats.totalSets },
                                    ].map((s) => (
                                        <div key={s.label} className="text-center p-3 rounded-xl"
                                            style={{ background: "rgba(200,255,0,0.05)", border: "1px solid rgba(200,255,0,0.1)" }}>
                                            <p className="text-lg font-bold text-[#c8ff00]">{s.value}</p>
                                            <p className="text-[10px] text-white/30">{s.label}</p>
                                        </div>
                                    ))}
                                </div>
                            )}
                            <div>
                                <label className="text-xs text-white/40 uppercase tracking-widest mb-2 block">Plan Name (optional)</label>
                                <input value={planLabel} onChange={(e) => setPlanLabel(e.target.value)}
                                    placeholder={`${goal} – ${days}d plan`}
                                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm outline-none focus:border-[#c8ff00]/40 transition placeholder:text-white/20" />
                            </div>
                            <motion.button whileTap={{ scale: 0.97 }} onClick={savePlan}
                                className="w-full py-3 rounded-2xl bg-[#c8ff00] text-black font-bold text-sm">
                                Save to History
                            </motion.button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}