"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import type { Variants } from "framer-motion";

// ── Types ────────────────────────────────────────────────────

interface ExerciseEntry {
    id: string;
    name: string;
    sets: number;
    reps: number;
    weight: number;
    notes: string;
}

interface WorkoutLog {
    _id: string;
    name: string;
    dayLabel: string;
    date: string;
    exercises: ExerciseEntry[];
    durationMinutes: number;
    totalVolume?: number;
    notes: string;
}

// ── Animations ───────────────────────────────────────────────

const stagger: Variants = {
    hidden: {},
    show: { transition: { staggerChildren: 0.07 } },
};
const fadeUp: Variants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: "easeOut" } },
};

// ── Blank exercise factory ────────────────────────────────────

function blankExercise(): ExerciseEntry {
    return {
        id: crypto.randomUUID(),
        name: "",
        sets: 3,
        reps: 10,
        weight: 0,
        notes: "",
    };
}

// ── Component ────────────────────────────────────────────────

export default function WorkoutPage() {
    const { token } = useAuth();
    const router = useRouter();
    const base = process.env.NEXT_PUBLIC_API_URL;

    const [activeTab, setActiveTab] = useState<"log" | "history">("log");

    // Logging form
    const [workoutName, setWorkoutName] = useState("");
    const [durationMinutes, setDurationMinutes] = useState(60);
    const [exercises, setExercises] = useState<ExerciseEntry[]>([blankExercise()]);
    const [notes, setNotes] = useState("");
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [error, setError] = useState("");

    // ✅ NEW: banner shown when pre-filled from plan
    const [fromPlan, setFromPlan] = useState(false);

    // History
    const [history, setHistory] = useState<WorkoutLog[]>([]);
    const [historyLoading, setHistoryLoading] = useState(false);
    const [deleteId, setDeleteId] = useState<string | null>(null);

    // ✅ NEW: On mount, check if plan page left a prefill in localStorage
    useEffect(() => {
        try {
            const raw = localStorage.getItem("smartlife-workout-prefill");
            if (raw) {
                const prefill = JSON.parse(raw);
                if (prefill.workoutName) setWorkoutName(prefill.workoutName);
                if (Array.isArray(prefill.exercises) && prefill.exercises.length > 0) {
                    setExercises(prefill.exercises);
                }
                setFromPlan(true);
                // Clear immediately so refreshing the page doesn't re-apply it
                localStorage.removeItem("smartlife-workout-prefill");
            }
        } catch {
            // ignore corrupt localStorage
        }
    }, []);

    // Load history when tab switches
    useEffect(() => {
        if (activeTab === "history" && token) {
            loadHistory();
        }
    }, [activeTab, token]);

    async function loadHistory() {
        setHistoryLoading(true);
        try {
            const res = await fetch(`${base}/api/workout/history?days=90`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) setHistory(await res.json());
        } catch {
            // silent
        } finally {
            setHistoryLoading(false);
        }
    }

    // Exercise CRUD
    function addExercise() {
        setExercises((prev) => [...prev, blankExercise()]);
    }

    function removeExercise(id: string) {
        setExercises((prev) => prev.filter((e) => e.id !== id));
    }

    function updateExercise(id: string, field: keyof ExerciseEntry, value: string | number) {
        setExercises((prev) =>
            prev.map((e) => (e.id === id ? { ...e, [field]: value } : e))
        );
    }

    // Submit
    async function handleSave() {
        const validExercises = exercises.filter((e) => e.name.trim());
        if (!validExercises.length) {
            setError("Add at least one exercise name.");
            return;
        }
        setSaving(true);
        setError("");
        try {
            const res = await fetch(`${base}/api/workout`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    name: workoutName || "Workout",
                    exercises: validExercises,
                    durationMinutes,
                    notes,
                }),
            });
            if (!res.ok) throw new Error((await res.json()).error || "Save failed");
            setSaved(true);
            setFromPlan(false);
            setTimeout(() => {
                setSaved(false);
                // Reset form
                setWorkoutName("");
                setExercises([blankExercise()]);
                setNotes("");
                setDurationMinutes(60);
            }, 2000);
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "Save failed");
        } finally {
            setSaving(false);
        }
    }

    async function handleDelete(id: string) {
        try {
            const res = await fetch(`${base}/api/workout/${id}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
                setHistory((prev) => prev.filter((w) => w._id !== id));
            }
        } catch {
            // silent
        } finally {
            setDeleteId(null);
        }
    }

    return (
        <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-6">

            {/* ── TAB BAR ── */}
            <motion.div variants={fadeUp} className="flex gap-1 p-1 bg-white/5 border border-white/10 rounded-2xl w-fit">
                {(["log", "history"] as const).map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`px-5 py-2 rounded-xl text-sm font-medium transition-all capitalize ${activeTab === tab ? "bg-white/10 text-white" : "text-white/40 hover:text-white/70"}`}
                    >
                        {tab === "log" ? "🏋️ Log Workout" : "📜 History"}
                    </button>
                ))}
            </motion.div>

            <AnimatePresence mode="wait">

                {/* ── LOG TAB ── */}
                {activeTab === "log" && (
                    <motion.div
                        key="log"
                        variants={stagger}
                        initial="hidden"
                        animate="show"
                        exit={{ opacity: 0 }}
                        className="space-y-5"
                    >

                        {/* ✅ NEW: Banner when prefilled from plan */}
                        {fromPlan && (
                            <motion.div
                                initial={{ opacity: 0, y: -8 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="flex items-center justify-between gap-4 px-5 py-3.5 rounded-2xl bg-[#c8ff00]/10 border border-[#c8ff00]/20"
                            >
                                <div className="flex items-center gap-3">
                                    <span className="text-[#c8ff00] text-lg">📋</span>
                                    <div>
                                        <p className="text-sm font-semibold text-[#c8ff00]">Pre-filled from your plan</p>
                                        <p className="text-xs text-white/50 mt-0.5">Add weights, adjust sets/reps, then save to log it.</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setFromPlan(false)}
                                    className="text-white/30 hover:text-white text-lg shrink-0"
                                >
                                    ✕
                                </button>
                            </motion.div>
                        )}

                        {/* Workout name + duration */}
                        <motion.div
                            variants={fadeUp}
                            className="backdrop-blur-2xl bg-white/5 border border-white/10 rounded-3xl p-5 sm:p-7 space-y-5"
                        >
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs text-white/40 uppercase tracking-widest mb-2 block">Workout Name</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. Push Day"
                                        value={workoutName}
                                        onChange={(e) => setWorkoutName(e.target.value)}
                                        className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm outline-none focus:border-[#c8ff00]/40 transition placeholder:text-white/20"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs text-white/40 uppercase tracking-widest mb-2 block">Duration (minutes)</label>
                                    <input
                                        type="number"
                                        min={1}
                                        value={durationMinutes}
                                        onChange={(e) => setDurationMinutes(Number(e.target.value))}
                                        className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm outline-none focus:border-[#c8ff00]/40 transition"
                                    />
                                </div>
                            </div>
                        </motion.div>

                        {/* Exercise list */}
                        <motion.div
                            variants={fadeUp}
                            className="backdrop-blur-2xl bg-white/5 border border-white/10 rounded-3xl p-5 sm:p-7 space-y-4"
                        >
                            <div className="flex items-center justify-between mb-2">
                                <h2 className="text-sm font-semibold text-white/80">Exercises</h2>
                                <span className="text-xs text-white/30">{exercises.filter(e => e.name).length} logged</span>
                            </div>

                            <AnimatePresence>
                                {exercises.map((ex, idx) => (
                                    <motion.div
                                        key={ex.id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, x: -20 }}
                                        transition={{ duration: 0.2 }}
                                        className="rounded-2xl bg-white/3 border border-white/8 p-4 space-y-3"
                                    >
                                        {/* Exercise header */}
                                        <div className="flex items-center gap-3">
                                            <span className="w-6 h-6 rounded-lg bg-white/5 flex items-center justify-center text-[10px] text-white/30 font-mono shrink-0">
                                                {String(idx + 1).padStart(2, "0")}
                                            </span>
                                            <input
                                                type="text"
                                                placeholder="Exercise name"
                                                value={ex.name}
                                                onChange={(e) => updateExercise(ex.id, "name", e.target.value)}
                                                className="flex-1 bg-transparent text-white text-sm outline-none placeholder:text-white/20 border-b border-white/10 pb-1 focus:border-[#c8ff00]/40 transition"
                                            />
                                            <button
                                                onClick={() => removeExercise(ex.id)}
                                                className="text-white/20 hover:text-red-400 transition text-sm shrink-0"
                                            >
                                                ✕
                                            </button>
                                        </div>

                                        {/* Sets / Reps / Weight */}
                                        <div className="grid grid-cols-3 gap-3">
                                            {(["sets", "reps", "weight"] as const).map((field) => (
                                                <div key={field}>
                                                    <label className="text-[10px] text-white/30 uppercase tracking-widest mb-1 block">
                                                        {field}{field === "weight" ? " (kg)" : ""}
                                                    </label>
                                                    <input
                                                        type="number"
                                                        min={0}
                                                        value={ex[field]}
                                                        onChange={(e) => updateExercise(ex.id, field, Number(e.target.value))}
                                                        className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-sm outline-none focus:border-[#c8ff00]/40 transition text-center tabular-nums"
                                                    />
                                                </div>
                                            ))}
                                        </div>

                                        {/* Notes */}
                                        <input
                                            type="text"
                                            placeholder="Notes (optional)"
                                            value={ex.notes}
                                            onChange={(e) => updateExercise(ex.id, "notes", e.target.value)}
                                            className="w-full bg-transparent text-white/50 text-xs outline-none placeholder:text-white/20 border-b border-white/5 pb-1 focus:border-white/20 transition"
                                        />
                                    </motion.div>
                                ))}
                            </AnimatePresence>

                            <button
                                onClick={addExercise}
                                className="w-full py-3 rounded-2xl border border-dashed border-white/15 text-white/40 hover:text-white hover:border-white/30 transition text-sm flex items-center justify-center gap-2"
                            >
                                + Add Exercise
                            </button>
                        </motion.div>

                        {/* Workout notes */}
                        <motion.div variants={fadeUp} className="backdrop-blur-2xl bg-white/5 border border-white/10 rounded-3xl p-5 sm:p-7">
                            <label className="text-xs text-white/40 uppercase tracking-widest mb-3 block">Session Notes</label>
                            <textarea
                                rows={3}
                                placeholder="How did it feel? Any PRs?"
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm outline-none focus:border-[#c8ff00]/40 transition placeholder:text-white/20 resize-none"
                            />
                        </motion.div>

                        {/* Save button */}
                        <motion.div variants={fadeUp}>
                            {error && (
                                <p className="text-red-400 text-xs mb-3">{error}</p>
                            )}
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.97 }}
                                onClick={handleSave}
                                disabled={saving || saved}
                                className="w-full py-4 rounded-2xl bg-[#c8ff00] text-black font-bold text-sm disabled:opacity-60 flex items-center justify-center gap-2"
                            >
                                {saving ? (
                                    <>
                                        <motion.div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full" animate={{ rotate: 360 }} transition={{ duration: 0.6, repeat: Infinity }} />
                                        Saving...
                                    </>
                                ) : saved ? "✓ Workout Saved!" : "Save Workout"}
                            </motion.button>

                            {saved && (
                                <motion.p
                                    initial={{ opacity: 0, y: 4 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="text-center text-xs text-white/40 mt-3"
                                >
                                    Your workout has been logged — head to <span className="text-[#c8ff00]">Analytics</span> to see your progress.
                                </motion.p>
                            )}
                        </motion.div>
                    </motion.div>
                )}

                {/* ── HISTORY TAB ── */}
                {activeTab === "history" && (
                    <motion.div
                        key="history"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="space-y-4"
                    >
                        {historyLoading ? (
                            <div className="flex items-center justify-center h-40">
                                <motion.div
                                    className="w-8 h-8 border-2 border-[#c8ff00] border-t-transparent rounded-full"
                                    animate={{ rotate: 360 }}
                                    transition={{ duration: 0.8, repeat: Infinity }}
                                />
                            </div>
                        ) : history.length === 0 ? (
                            <div className="backdrop-blur-2xl bg-white/5 border border-white/10 rounded-3xl p-12 text-center">
                                <p className="text-4xl mb-4">🏋️</p>
                                <p className="text-white/40 text-sm">No workouts logged yet.</p>
                                <p className="text-white/25 text-xs mt-1">Switch to the Log tab or use your Plan to get started.</p>
                            </div>
                        ) : (
                            history.map((workout) => (
                                <motion.div
                                    key={workout._id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="backdrop-blur-2xl bg-white/5 border border-white/10 rounded-3xl p-5"
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <div>
                                            <h3 className="font-semibold text-base">{workout.name}</h3>
                                            <p className="text-xs text-white/40 mt-0.5">
                                                {new Date(workout.date).toLocaleDateString("en-US", {
                                                    weekday: "short", month: "short", day: "numeric",
                                                })} · {workout.durationMinutes}min
                                                {workout.totalVolume ? ` · ${workout.totalVolume.toLocaleString()} vol` : ""}
                                            </p>
                                        </div>
                                        <button
                                            onClick={() => setDeleteId(workout._id)}
                                            className="text-xs text-white/20 hover:text-red-400 transition shrink-0"
                                        >
                                            ✕
                                        </button>
                                    </div>

                                    <div className="flex flex-wrap gap-2 mt-3">
                                        {workout.exercises.slice(0, 6).map((ex) => (
                                            <span
                                                key={ex.id}
                                                className="text-[11px] px-3 py-1 rounded-xl bg-white/8 border border-white/10 text-white/60"
                                            >
                                                {ex.name} {ex.sets}×{ex.reps}{ex.weight > 0 ? ` @${ex.weight}kg` : ""}
                                            </span>
                                        ))}
                                        {workout.exercises.length > 6 && (
                                            <span className="text-[11px] px-3 py-1 rounded-xl bg-white/5 text-white/30">
                                                +{workout.exercises.length - 6} more
                                            </span>
                                        )}
                                    </div>
                                </motion.div>
                            ))
                        )}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Delete confirmation modal */}
            <AnimatePresence>
                {deleteId && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
                    >
                        <motion.div
                            initial={{ scale: 0.9 }}
                            animate={{ scale: 1 }}
                            exit={{ scale: 0.9 }}
                            className="bg-[#111] border border-white/15 rounded-3xl p-6 max-w-sm w-full space-y-4"
                        >
                            <h3 className="font-bold">Delete workout?</h3>
                            <p className="text-sm text-white/50">This cannot be undone.</p>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setDeleteId(null)}
                                    className="flex-1 py-2.5 rounded-2xl border border-white/15 text-white/60 hover:text-white hover:bg-white/5 transition text-sm"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={() => handleDelete(deleteId)}
                                    className="flex-1 py-2.5 rounded-2xl bg-red-500/20 border border-red-500/30 text-red-400 hover:bg-red-500/30 transition text-sm"
                                >
                                    Delete
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}