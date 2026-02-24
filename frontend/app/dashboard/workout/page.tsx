"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
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

    // History
    const [history, setHistory] = useState<WorkoutLog[]>([]);
    const [historyLoading, setHistoryLoading] = useState(false);
    const [deleteId, setDeleteId] = useState<string | null>(null);

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
            await fetch(`${base}/api/workout/${id}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` },
            });
            setHistory((prev) => prev.filter((w) => w._id !== id));
        } catch {
            // silent
        } finally {
            setDeleteId(null);
        }
    }

    // ── Render ───────────────────────────────────────────────

    return (
        <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-6 max-w-4xl mx-auto">

            {/* Header */}
            <motion.div variants={fadeUp}>
                <p className="text-[#c8ff00] text-xs tracking-widest uppercase mb-2">Training</p>
                <h1 className="text-4xl sm:text-5xl font-bold tracking-tight">Workout Log</h1>
            </motion.div>

            {/* Tabs */}
            <motion.div variants={fadeUp} className="flex gap-1 p-1 bg-white/5 border border-white/10 rounded-2xl w-fit">
                {(["log", "history"] as const).map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`px-5 py-2 rounded-xl text-sm font-medium transition-all capitalize ${activeTab === tab ? "bg-white/10 text-white" : "text-white/40 hover:text-white/70"
                            }`}
                    >
                        {tab === "log" ? "📝 Log Workout" : "📅 History"}
                    </button>
                ))}
            </motion.div>

            <AnimatePresence mode="wait">

                {/* ── LOG TAB ─────────────────────────────── */}
                {activeTab === "log" && (
                    <motion.div
                        key="log"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="space-y-5"
                    >
                        {/* Session info */}
                        <div className="backdrop-blur-2xl bg-white/5 border border-white/10 rounded-3xl p-5 sm:p-8 space-y-5">
                            <h3 className="text-xs text-white/40 uppercase tracking-widest">Session Details</h3>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs text-white/40 uppercase tracking-widest mb-2 block">Workout Name</label>
                                    <input
                                        value={workoutName}
                                        onChange={(e) => setWorkoutName(e.target.value)}
                                        placeholder="e.g. Push Day, Leg Day..."
                                        className="w-full px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-white outline-none focus:border-[#c8ff00]/50 transition text-sm placeholder:text-white/20"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs text-white/40 uppercase tracking-widest mb-2 block">Duration (minutes)</label>
                                    <input
                                        type="number"
                                        value={durationMinutes}
                                        onChange={(e) => setDurationMinutes(Number(e.target.value))}
                                        min={10} max={300}
                                        className="w-full px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-white outline-none focus:border-[#c8ff00]/50 transition text-sm"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Exercises */}
                        <div className="backdrop-blur-2xl bg-white/5 border border-white/10 rounded-3xl p-5 sm:p-8 space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="text-xs text-white/40 uppercase tracking-widest">Exercises</h3>
                                <motion.button
                                    whileHover={{ scale: 1.04 }}
                                    whileTap={{ scale: 0.97 }}
                                    onClick={addExercise}
                                    className="text-xs px-4 py-2 rounded-xl bg-[#c8ff00]/10 border border-[#c8ff00]/25 text-[#c8ff00] hover:bg-[#c8ff00]/20 transition"
                                >
                                    + Add Exercise
                                </motion.button>
                            </div>

                            <div className="space-y-3">
                                <AnimatePresence>
                                    {exercises.map((ex, index) => (
                                        <motion.div
                                            key={ex.id}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, x: -20 }}
                                            className="bg-white/4 border border-white/8 rounded-2xl p-4 space-y-3"
                                        >
                                            <div className="flex items-center justify-between">
                                                <span className="text-xs text-white/30 font-mono">#{index + 1}</span>
                                                {exercises.length > 1 && (
                                                    <button
                                                        onClick={() => removeExercise(ex.id)}
                                                        className="text-xs text-white/20 hover:text-red-400 transition"
                                                    >
                                                        ✕ Remove
                                                    </button>
                                                )}
                                            </div>

                                            <input
                                                value={ex.name}
                                                onChange={(e) => updateExercise(ex.id, "name", e.target.value)}
                                                placeholder="Exercise name (e.g. Bench Press)"
                                                className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white outline-none focus:border-[#c8ff00]/40 transition text-sm placeholder:text-white/20"
                                            />

                                            <div className="grid grid-cols-3 gap-3">
                                                {[
                                                    { label: "Sets", field: "sets" as const, placeholder: "3" },
                                                    { label: "Reps", field: "reps" as const, placeholder: "10" },
                                                    { label: "kg", field: "weight" as const, placeholder: "0" },
                                                ].map((f) => (
                                                    <div key={f.field}>
                                                        <label className="text-[10px] text-white/30 uppercase tracking-wider mb-1 block">{f.label}</label>
                                                        <input
                                                            type="number"
                                                            value={ex[f.field]}
                                                            onChange={(e) => updateExercise(ex.id, f.field, Number(e.target.value))}
                                                            placeholder={f.placeholder}
                                                            min={0}
                                                            className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-sm outline-none focus:border-[#c8ff00]/40 transition"
                                                        />
                                                    </div>
                                                ))}
                                            </div>

                                            <input
                                                value={ex.notes}
                                                onChange={(e) => updateExercise(ex.id, "notes", e.target.value)}
                                                placeholder="Notes (optional)"
                                                className="w-full px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white/70 text-xs outline-none focus:border-white/20 transition placeholder:text-white/15"
                                            />
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                            </div>
                        </div>

                        {/* Session notes */}
                        <div className="backdrop-blur-2xl bg-white/5 border border-white/10 rounded-3xl p-5 sm:p-8">
                            <h3 className="text-xs text-white/40 uppercase tracking-widest mb-3">Session Notes</h3>
                            <textarea
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                placeholder="How did it go? Any PRs or observations..."
                                rows={3}
                                className="w-full px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-white outline-none focus:border-[#c8ff00]/50 transition text-sm placeholder:text-white/20 resize-none"
                            />
                        </div>

                        {error && <p className="text-sm text-red-400">{error}</p>}

                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.97 }}
                            onClick={handleSave}
                            disabled={saving}
                            className="bg-[#c8ff00] text-black px-10 py-3.5 rounded-2xl font-bold text-sm disabled:opacity-50 w-full sm:w-auto"
                        >
                            {saved ? "✓ Workout Saved!" : saving ? "Saving..." : "Log Workout"}
                        </motion.button>
                    </motion.div>
                )}

                {/* ── HISTORY TAB ─────────────────────────────── */}
                {activeTab === "history" && (
                    <motion.div
                        key="history"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="space-y-4"
                    >
                        {historyLoading ? (
                            <div className="flex justify-center py-16">
                                <motion.div
                                    className="w-10 h-10 border-2 border-[#c8ff00] border-t-transparent rounded-full"
                                    animate={{ rotate: 360 }}
                                    transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
                                />
                            </div>
                        ) : history.length === 0 ? (
                            <div className="text-center py-16 text-white/30">
                                <p className="text-4xl mb-3">🏋️</p>
                                <p className="text-sm">No workouts logged yet. Start your first session!</p>
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