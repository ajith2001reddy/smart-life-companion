"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    ResponsiveContainer,
    CartesianGrid,
    XAxis,
    YAxis,
    Tooltip,
    AreaChart,
    Area,
    BarChart,
    Bar,
    LineChart,
    Line,
    ComposedChart,
    Legend,
} from "recharts";
import { useAuth } from "@/context/AuthContext";

/* ─── Types ─── */
type HealthData = {
    _id: string;
    steps: number;
    heartRate: number;
    sleepHours: number;
    restingHR: number;
    caloriesBurned: number;
    date: string;
};

type Readiness = { readinessScore: number; message: string; noData?: boolean };

type Stats = {
    noData?: boolean;
    totalRecords: number;
    period: number;
    averages: { steps: number; heartRate: number; sleepHours: number; caloriesBurned: number };
    bests: { steps: number; sleepHours: number; caloriesBurned: number };
    trends: { steps: number; heartRate: number; sleepHours: number; caloriesBurned: number };
};

type DateRange = 7 | 14 | 30 | 90 | 0;

type SymptomEntry = {
    id: string;
    date: string;
    tags: string[];
    note: string;
    severity: 1 | 2 | 3;
};

/* ─── Constants ─── */
const EMPTY = { steps: "", heartRate: "", sleepHours: "", restingHR: "", caloriesBurned: "" };

const TOOLTIP_STYLE = {
    backgroundColor: "#080808",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: "12px",
    fontSize: "12px",
    color: "#fff",
};

const METRICS = [
    { key: "steps", label: "Steps", color: "#c8ff00", unit: "", target: 10000, icon: "👟" },
    { key: "heartRate", label: "Heart Rate", color: "#ff4d6d", unit: "bpm", target: 75, icon: "❤️" },
    { key: "sleepHours", label: "Sleep", color: "#00BFFF", unit: "hrs", target: 8, icon: "🌙" },
    { key: "caloriesBurned", label: "Calories", color: "#FF8C00", unit: "kcal", target: 600, icon: "🔥" },
] as const;

type MetricKey = (typeof METRICS)[number]["key"];

const SYMPTOM_TAGS = ["Fatigue", "Soreness", "Headache", "Low Energy", "Great", "Stressed", "Motivated", "Sick", "Joint Pain", "Nausea"];

/* ─── Helpers ─── */
function fmtDate(iso: string, short = true) {
    const d = new Date(iso);
    if (short) return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" });
}

function fmtTime(iso: string) {
    return new Date(iso).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
}

function trendLabel(v: number) {
    if (v === 0) return { text: "—", color: "text-white/30" };
    return v > 0
        ? { text: `↑ ${v}%`, color: "text-[#c8ff00]" }
        : { text: `↓ ${Math.abs(v)}%`, color: "text-[#ff4d6d]" };
}

/** Compute stats from a history array (used for custom date range) */
function computeStats(records: HealthData[]): Stats | null {
    if (!records.length) return null;
    const avg = (arr: number[]) => arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;
    const max = (arr: number[]) => arr.length ? Math.max(...arr) : 0;

    const steps = records.map((r) => r.steps);
    const hr = records.map((r) => r.heartRate).filter((v) => v > 0);
    const sleep = records.map((r) => r.sleepHours).filter((v) => v > 0);
    const cals = records.map((r) => r.caloriesBurned).filter((v) => v > 0);

    const mid = Math.floor(records.length / 2);
    const trend = (key: keyof HealthData) => {
        const fh = records.slice(0, mid).map((r) => r[key] as number).filter((v) => v > 0);
        const sh = records.slice(mid).map((r) => r[key] as number).filter((v) => v > 0);
        const a = avg(fh), b = avg(sh);
        return a === 0 ? 0 : Math.round(((b - a) / a) * 100);
    };

    return {
        totalRecords: records.length,
        period: 0,
        averages: {
            steps: Math.round(avg(steps)),
            heartRate: Math.round(avg(hr)),
            sleepHours: Math.round(avg(sleep) * 10) / 10,
            caloriesBurned: Math.round(avg(cals)),
        },
        bests: {
            steps: max(steps),
            sleepHours: max(sleep),
            caloriesBurned: max(cals),
        },
        trends: {
            steps: trend("steps"),
            heartRate: trend("heartRate"),
            sleepHours: trend("sleepHours"),
            caloriesBurned: trend("caloriesBurned"),
        },
    };
}

/* ─── Readiness Arc ─── */
function ReadinessArc({ score }: { score: number }) {
    const r = 70, cx = 100, cy = 90;
    const startAngle = Math.PI;
    const angle = startAngle - (score / 100) * Math.PI;
    const x1 = cx + r * Math.cos(startAngle), y1 = cy + r * Math.sin(startAngle);
    const x2 = cx + r * Math.cos(angle), y2 = cy + r * Math.sin(angle);
    const color = score > 80 ? "#c8ff00" : score > 60 ? "#00BFFF" : "#ff4d6d";
    return (
        <svg className="w-44 sm:w-[200px]" viewBox="0 0 200 110">
            <path d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="12" strokeLinecap="round" />
            <motion.path d={`M ${x1} ${y1} A ${r} ${r} 0 ${score > 50 ? 1 : 0} 1 ${x2} ${y2}`} fill="none" stroke={color} strokeWidth="12" strokeLinecap="round" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.4, ease: "easeOut" }} />
            <text x={cx} y={cy - 10} textAnchor="middle" fill={color} fontSize="26" fontWeight="bold">{score}</text>
            <text x={cx} y={cy + 14} textAnchor="middle" fill="rgba(255,255,255,0.3)" fontSize="10">/ 100</text>
        </svg>
    );
}

/* ─── Custom Tooltip ─── */
function CustomTooltip({ active, payload, label }: any) {
    if (!active || !payload?.length) return null;
    return (
        <div className="rounded-2xl bg-black/90 border border-white/10 px-4 py-3 shadow-xl">
            <p className="text-[11px] text-white/40 mb-2">{label}</p>
            {payload.map((p: any) => (
                <div key={p.dataKey} className="flex items-center gap-2 text-xs">
                    <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
                    <span className="text-white/60 capitalize">{p.dataKey}:</span>
                    <span className="font-bold text-white">{typeof p.value === "number" ? p.value.toLocaleString() : p.value}</span>
                </div>
            ))}
        </div>
    );
}

/* ══════════════════════════════════════════════════ MAIN PAGE ══ */
export default function HealthPage() {
    const { token, logout } = useAuth();
    const base = process.env.NEXT_PUBLIC_API_URL;

    const [latest, setLatest] = useState<HealthData | null>(null);
    const [history, setHistory] = useState<HealthData[]>([]);
    const [allHistory, setAllHistory] = useState<HealthData[]>([]); // full unfiltered data
    const [stats, setStats] = useState<Stats | null>(null);
    const [readiness, setReadiness] = useState<Readiness | null>(null);

    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState(EMPTY);
    const [syncing, setSyncing] = useState(false);
    const [msg, setMsg] = useState("");

    const [dateRange, setDateRange] = useState<DateRange>(30);
    const [activeMetric, setActiveMetric] = useState<MetricKey>("steps");
    const [chartType, setChartType] = useState<"area" | "bar" | "multi">("area");
    const [activeTab, setActiveTab] = useState<"overview" | "charts" | "history" | "journal" | "export">("overview");
    const [deleteId, setDeleteId] = useState<string | null>(null);

    // ── Custom date range ──
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [customFrom, setCustomFrom] = useState("");
    const [customTo, setCustomTo] = useState("");
    const [isCustomRange, setIsCustomRange] = useState(false);

    // ── Symptom Journal ──
    const [symptoms, setSymptoms] = useState<SymptomEntry[]>([]);
    const [journalOpen, setJournalOpen] = useState(false);
    const [selectedTags, setSelectedTags] = useState<string[]>([]);
    const [symptomNote, setSymptomNote] = useState("");
    const [symptomSeverity, setSymptomSeverity] = useState<1 | 2 | 3>(2);
    const [journalSaved, setJournalSaved] = useState(false);

    // ── Export ──
    const [exportLoading, setExportLoading] = useState(false);

    const headers = { "Content-Type": "application/json", Authorization: `Bearer ${token}` };

    // Load symptoms from localStorage
    useEffect(() => {
        const saved = localStorage.getItem("smartlife-symptoms");
        if (saved) setSymptoms(JSON.parse(saved));
    }, []);

    // ── Fetch from API ──
    const load = useCallback(async () => {
        if (!token) return;
        setLoading(true);
        try {
            // Always fetch "all" data so we can filter custom ranges client-side
            const [l, h, r, s] = await Promise.all([
                fetch(`${base}/api/health/latest`, { headers }).then((res) =>
                    res.status === 401 ? (logout(), null) : res.json()
                ),
                fetch(`${base}/api/health/history`, { headers }).then((r) => r.json()),  // fetch ALL
                fetch(`${base}/api/health/readiness`, { headers }).then((r) => r.json()),
                fetch(`${base}/api/health/stats?days=${dateRange > 0 ? dateRange : 0}`, { headers }).then((r) => r.json()),
            ]);
            setLatest(l);
            const all = Array.isArray(h) ? h : [];
            setAllHistory(all);
            setReadiness(r);
            setStats(s);

            // Apply the correct filter immediately
            if (isCustomRange && customFrom && customTo) {
                applyCustomFilter(all, customFrom, customTo);
            } else {
                applyPresetFilter(all, dateRange, s);
            }
        } catch (err) {
            console.error("Health load failed", err);
        } finally {
            setLoading(false);
        }
    }, [token, dateRange]);  // eslint-disable-line

    useEffect(() => { load(); }, [load]);

    // ── Filter helpers ──
    function applyPresetFilter(all: HealthData[], range: DateRange, serverStats: Stats | null) {
        if (range === 0) {
            setHistory(all);
            setStats(serverStats);
            return;
        }
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - range);
        const filtered = all.filter((h) => new Date(h.date) >= cutoff);
        setHistory(filtered);
        setStats(serverStats);
    }

    function applyCustomFilter(all: HealthData[], from: string, to: string) {
        if (!from || !to) return;
        const fromDate = new Date(from);
        fromDate.setHours(0, 0, 0, 0);
        const toDate = new Date(to);
        toDate.setHours(23, 59, 59, 999);
        const filtered = all.filter((h) => {
            const d = new Date(h.date);
            return d >= fromDate && d <= toDate;
        });
        setHistory(filtered);
        const computed = computeStats(filtered);
        setStats(computed ? { ...computed } : null);
    }

    // ── When preset button clicked ──
    function handlePresetRange(range: DateRange) {
        setDateRange(range);
        setIsCustomRange(false);
        setShowDatePicker(false);
        setCustomFrom("");
        setCustomTo("");
        applyPresetFilter(allHistory, range, stats);
    }

    // ── Apply custom date filter ──
    function handleApplyCustom() {
        if (!customFrom || !customTo) return;
        if (new Date(customFrom) > new Date(customTo)) {
            setMsg("'From' date must be before 'To' date.");
            setTimeout(() => setMsg(""), 2500);
            return;
        }
        setIsCustomRange(true);
        setShowDatePicker(false);
        applyCustomFilter(allHistory, customFrom, customTo);
    }

    // ── Clear custom filter ──
    function clearCustomRange() {
        setIsCustomRange(false);
        setCustomFrom("");
        setCustomTo("");
        handlePresetRange(30);
    }

    async function handleSync() {
        setSyncing(true);
        setMsg("");
        try {
            await fetch(`${base}/api/health/sync`, {
                method: "POST",
                headers,
                body: JSON.stringify({
                    steps: Number(form.steps) || 0,
                    heartRate: Number(form.heartRate) || 0,
                    sleepHours: Number(form.sleepHours) || 0,
                    restingHR: Number(form.restingHR) || 0,
                    caloriesBurned: Number(form.caloriesBurned) || 0,
                }),
            });
            setForm(EMPTY);
            setShowForm(false);
            setMsg("Saved!");
            await load();
        } catch {
            setMsg("Error saving.");
        }
        setSyncing(false);
        setTimeout(() => setMsg(""), 2500);
    }

    async function handleDelete(id: string) {
        try {
            await fetch(`${base}/api/health/${id}`, { method: "DELETE", headers });
            await load();
            setDeleteId(null);
        } catch {
            console.error("Delete failed");
        }
    }

    // ── Symptom Journal ──
    function saveSymptom() {
        if (selectedTags.length === 0 && !symptomNote.trim()) return;
        const entry: SymptomEntry = {
            id: Date.now().toString(),
            date: new Date().toISOString(),
            tags: selectedTags,
            note: symptomNote.trim(),
            severity: symptomSeverity,
        };
        const updated = [entry, ...symptoms];
        setSymptoms(updated);
        localStorage.setItem("smartlife-symptoms", JSON.stringify(updated));
        setSelectedTags([]);
        setSymptomNote("");
        setSymptomSeverity(2);
        setJournalSaved(true);
        setTimeout(() => { setJournalSaved(false); setJournalOpen(false); }, 1200);
    }

    function deleteSymptom(id: string) {
        const updated = symptoms.filter((s) => s.id !== id);
        setSymptoms(updated);
        localStorage.setItem("smartlife-symptoms", JSON.stringify(updated));
    }

    // ── Export CSV ──
    function exportCSV() {
        if (history.length === 0) return;
        setExportLoading(true);
        const hdrs = ["Date", "Steps", "Heart Rate (bpm)", "Resting HR (bpm)", "Sleep (hrs)", "Calories Burned"];
        const rows = [...history].reverse().map((h) => [
            new Date(h.date).toLocaleDateString(),
            h.steps,
            h.heartRate,
            h.restingHR,
            h.sleepHours,
            h.caloriesBurned,
        ]);
        const csv = [hdrs, ...rows].map((r) => r.join(",")).join("\n");
        const blob = new Blob([csv], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `smartlife-health-${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
        URL.revokeObjectURL(url);
        setExportLoading(false);
    }

    // ── Recovery trend ──
    const recoveryTrend = history.map((h) => {
        const sleepScore = Math.min((h.sleepHours / 8) * 40, 40);
        const hrScore = h.heartRate > 0 ? Math.max(0, 30 - Math.abs(h.heartRate - 65) * 0.8) : 15;
        const stepsScore = Math.min((h.steps / 10000) * 30, 30);
        return {
            label: fmtDate(h.date),
            recovery: Math.round(sleepScore + hrScore + stepsScore),
        };
    });

    /* ── Chart data ── */
    const chartData = history.map((h) => ({
        ...h,
        label: fmtDate(h.date),
        fullDate: fmtDate(h.date, false),
    }));

    const activeMetricInfo = METRICS.find((m) => m.key === activeMetric)!;

    // ── Friendly range label ──
    const rangeLabel = isCustomRange && customFrom && customTo
        ? `${new Date(customFrom).toLocaleDateString("en-US", { month: "short", day: "numeric" })} – ${new Date(customTo).toLocaleDateString("en-US", { month: "short", day: "numeric" })}`
        : dateRange === 0 ? "All time" : `Last ${dateRange} days`;

    if (loading)
        return (
            <div className="flex items-center justify-center h-64">
                <motion.div className="w-12 h-12 border-2 border-[#c8ff00] border-t-transparent rounded-full" animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity }} />
            </div>
        );

    return (
        <div className="space-y-6 sm:space-y-8">

            {/* ── HEADER ── */}
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div>
                    <p className="text-[#c8ff00] text-xs tracking-widest uppercase mb-2">Biometric Tracking</p>
                    <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight">Health</h1>
                </div>

                <div className="flex flex-col gap-3">
                    {/* ── Row 1: preset buttons + Log Data ── */}
                    <div className="flex flex-wrap items-center gap-3">
                        {/* Preset range pills */}
                        <div className="flex gap-1 p-1 bg-white/5 border border-white/10 rounded-xl">
                            {([7, 14, 30, 90, 0] as DateRange[]).map((d) => (
                                <button
                                    key={d}
                                    onClick={() => handlePresetRange(d)}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${!isCustomRange && dateRange === d ? "bg-[#c8ff00] text-black" : "text-white/50 hover:text-white"}`}
                                >
                                    {d === 0 ? "All" : `${d}d`}
                                </button>
                            ))}
                        </div>

                        {/* Custom date range button */}
                        <button
                            onClick={() => setShowDatePicker((v) => !v)}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${isCustomRange ? "bg-[#c8ff00]/15 border-[#c8ff00]/40 text-[#c8ff00]" : "border-white/10 bg-white/5 text-white/50 hover:text-white"}`}
                        >
                            📅 Custom
                            {isCustomRange && (
                                <span className="ml-1 text-[10px] font-normal opacity-70">
                                    {rangeLabel}
                                </span>
                            )}
                        </button>

                        {/* Clear custom */}
                        {isCustomRange && (
                            <button
                                onClick={clearCustomRange}
                                className="text-white/30 hover:text-white/70 text-xs px-2 py-1 rounded-lg transition"
                                title="Clear custom range"
                            >
                                ✕
                            </button>
                        )}

                        {msg && <span className="text-[#c8ff00] text-sm">{msg}</span>}

                        <button onClick={() => setShowForm((v) => !v)} className="px-5 py-2.5 rounded-xl bg-[#c8ff00] text-black font-semibold text-sm hover:bg-[#d4ff20] transition">
                            {showForm ? "Cancel" : "+ Log Data"}
                        </button>
                    </div>

                    {/* ── Row 2: Date picker panel ── */}
                    <AnimatePresence>
                        {showDatePicker && (
                            <motion.div
                                initial={{ opacity: 0, y: -8, height: 0 }}
                                animate={{ opacity: 1, y: 0, height: "auto" }}
                                exit={{ opacity: 0, y: -8, height: 0 }}
                                className="overflow-hidden"
                            >
                                <div className="flex flex-wrap items-end gap-3 p-4 bg-white/5 border border-white/10 rounded-2xl">
                                    <div>
                                        <label className="block text-[10px] text-white/40 uppercase tracking-widest mb-1.5">From</label>
                                        <input
                                            type="date"
                                            value={customFrom}
                                            max={customTo || new Date().toISOString().slice(0, 10)}
                                            onChange={(e) => setCustomFrom(e.target.value)}
                                            className="px-3 py-2 rounded-xl bg-black/40 border border-white/15 text-white text-sm outline-none focus:border-[#c8ff00]/50 transition [color-scheme:dark]"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] text-white/40 uppercase tracking-widest mb-1.5">To</label>
                                        <input
                                            type="date"
                                            value={customTo}
                                            min={customFrom}
                                            max={new Date().toISOString().slice(0, 10)}
                                            onChange={(e) => setCustomTo(e.target.value)}
                                            className="px-3 py-2 rounded-xl bg-black/40 border border-white/15 text-white text-sm outline-none focus:border-[#c8ff00]/50 transition [color-scheme:dark]"
                                        />
                                    </div>
                                    <motion.button
                                        whileTap={{ scale: 0.97 }}
                                        onClick={handleApplyCustom}
                                        disabled={!customFrom || !customTo}
                                        className="px-5 py-2 rounded-xl bg-[#c8ff00] text-black font-bold text-sm disabled:opacity-40 transition"
                                    >
                                        Apply
                                    </motion.button>

                                    {/* Quick-fill shortcuts */}
                                    <div className="flex gap-2 flex-wrap">
                                        {[
                                            { label: "This week", days: 7 },
                                            { label: "This month", days: 30 },
                                            { label: "Last 3 months", days: 90 },
                                        ].map((s) => {
                                            const to = new Date().toISOString().slice(0, 10);
                                            const from = new Date(Date.now() - s.days * 86400000).toISOString().slice(0, 10);
                                            return (
                                                <button
                                                    key={s.label}
                                                    onClick={() => { setCustomFrom(from); setCustomTo(to); }}
                                                    className="text-[10px] px-2.5 py-1 rounded-lg border border-white/10 text-white/40 hover:text-white/70 hover:border-white/20 transition"
                                                >
                                                    {s.label}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* ── Active range badge ── */}
            {(isCustomRange || true) && (
                <div className="flex items-center gap-2 text-xs text-white/40">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#c8ff00] inline-block" />
                    Showing <span className="text-white/70 font-medium">{history.length} records</span> for <span className="text-[#c8ff00] font-medium">{rangeLabel}</span>
                </div>
            )}

            {/* ── LOG DATA FORM ── */}
            <AnimatePresence>
                {showForm && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                    >
                        <div className="backdrop-blur-2xl bg-white/5 border border-white/10 rounded-3xl p-5 sm:p-7">
                            <h2 className="text-xs text-white/40 uppercase tracking-widest mb-5">Log Health Data</h2>
                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                                {[
                                    { key: "steps", label: "Steps", placeholder: "8000" },
                                    { key: "heartRate", label: "Heart Rate (bpm)", placeholder: "72" },
                                    { key: "sleepHours", label: "Sleep (hrs)", placeholder: "7.5" },
                                    { key: "restingHR", label: "Resting HR (bpm)", placeholder: "58" },
                                    { key: "caloriesBurned", label: "Calories Burned", placeholder: "450" },
                                ].map((f) => (
                                    <div key={f.key}>
                                        <label className="text-[10px] text-white/30 uppercase tracking-widest mb-1.5 block">{f.label}</label>
                                        <input
                                            type="number"
                                            value={form[f.key as keyof typeof EMPTY]}
                                            onChange={(e) => setForm((p) => ({ ...p, [f.key]: e.target.value }))}
                                            placeholder={f.placeholder}
                                            className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm outline-none focus:border-[#c8ff00]/50 transition placeholder:text-white/20"
                                        />
                                    </div>
                                ))}
                            </div>
                            <div className="mt-5">
                                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={handleSync} disabled={syncing} className="bg-[#c8ff00] text-black px-7 py-3 rounded-xl font-bold text-sm disabled:opacity-50">
                                    {syncing ? "Saving..." : "Save Entry"}
                                </motion.button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── RECOVERY BANNER ── */}
            {readiness && !readiness.noData && (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`rounded-2xl px-5 py-3.5 border text-sm font-medium flex items-center gap-3 ${readiness.readinessScore > 80 ? "bg-[#c8ff00]/10 border-[#c8ff00]/20 text-[#c8ff00]" : readiness.readinessScore > 60 ? "bg-[#00BFFF]/10 border-[#00BFFF]/20 text-[#00BFFF]" : "bg-[#ff4d6d]/10 border-[#ff4d6d]/20 text-[#ff4d6d]"}`}
                >
                    <span className="text-lg">{readiness.readinessScore > 80 ? "⚡" : readiness.readinessScore > 60 ? "💫" : "🛌"}</span>
                    {readiness.message}
                </motion.div>
            )}

            {/* ── TABS ── */}
            <div className="flex flex-wrap gap-1 p-1 bg-white/5 border border-white/10 rounded-2xl w-fit">
                {([
                    { id: "overview", label: "📊 Overview" },
                    { id: "charts", label: "📈 Charts" },
                    { id: "history", label: "📋 History" },
                    { id: "journal", label: "🩺 Journal" },
                    { id: "export", label: "⬇️ Export" },
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

            {/* ══════════ OVERVIEW TAB ══════════ */}
            {activeTab === "overview" && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                    {stats && !stats.noData && (
                        <p className="text-xs text-white/30">
                            Showing stats for {stats.totalRecords} records — {rangeLabel}
                        </p>
                    )}

                    {latest && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            {METRICS.map((m, i) => {
                                const val = latest[m.key as keyof HealthData] as number;
                                const pct = Math.min((val / m.target) * 100, 100);
                                const trend = stats?.trends?.[m.key as keyof typeof stats.trends] ?? 0;
                                const { text: trendText, color: trendColor } = trendLabel(trend);

                                return (
                                    <motion.div
                                        key={m.key}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: i * 0.07 }}
                                        whileHover={{ y: -3 }}
                                        className="backdrop-blur-2xl bg-white/5 border border-white/10 rounded-2xl p-6 cursor-pointer"
                                        onClick={() => { setActiveMetric(m.key as MetricKey); setActiveTab("charts"); }}
                                    >
                                        <div className="flex items-start justify-between mb-3">
                                            <p className="text-xs text-white/40 uppercase tracking-widest">{m.label}</p>
                                            <span className="text-base">{m.icon}</span>
                                        </div>
                                        <p className="text-2xl sm:text-3xl font-bold mb-1" style={{ color: m.color }}>
                                            {val.toLocaleString()}
                                            {m.unit && <span className="text-base font-normal text-white/30 ml-1">{m.unit}</span>}
                                        </p>
                                        <div className={`text-xs font-medium mb-3 ${trendColor}`}>{trendText} vs prev period</div>
                                        <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                                            <motion.div className="h-full rounded-full" style={{ background: m.color }} initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 1 }} />
                                        </div>
                                        <p className="text-[10px] text-white/20 mt-1">Target: {m.target.toLocaleString()} {m.unit}</p>
                                    </motion.div>
                                );
                            })}
                        </div>
                    )}

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                        {stats && !stats.noData && (
                            <div className="backdrop-blur-2xl bg-white/5 border border-white/10 rounded-3xl p-6">
                                <h3 className="text-xs text-white/40 uppercase tracking-widest mb-4">Period Averages</h3>
                                <div className="space-y-4">
                                    {METRICS.map((m) => {
                                        const avg = stats.averages[m.key as keyof typeof stats.averages];
                                        const pct = Math.min((avg / m.target) * 100, 100);
                                        return (
                                            <div key={m.key}>
                                                <div className="flex justify-between text-xs mb-1.5">
                                                    <span className="text-white/50">{m.label}</span>
                                                    <span style={{ color: m.color }} className="font-mono font-medium">{avg.toLocaleString()} {m.unit}</span>
                                                </div>
                                                <div className="h-1.5 bg-white/8 rounded-full overflow-hidden">
                                                    <motion.div className="h-full rounded-full" style={{ background: m.color }} initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 1.2 }} />
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {stats && !stats.noData && (
                            <div className="backdrop-blur-2xl bg-white/5 border border-white/10 rounded-3xl p-6">
                                <h3 className="text-xs text-white/40 uppercase tracking-widest mb-4">Personal Bests</h3>
                                <div className="space-y-3">
                                    {[
                                        { label: "Best Step Day", value: stats.bests.steps.toLocaleString(), unit: "steps", color: "#c8ff00", icon: "🏆" },
                                        { label: "Best Sleep Night", value: stats.bests.sleepHours.toString(), unit: "hrs", color: "#00BFFF", icon: "💤" },
                                        { label: "Most Calories Burned", value: stats.bests.caloriesBurned.toLocaleString(), unit: "kcal", color: "#FF8C00", icon: "🔥" },
                                    ].map((b) => (
                                        <div key={b.label} className="flex items-center gap-3 py-2 border-b border-white/5 last:border-0">
                                            <span className="text-xl">{b.icon}</span>
                                            <div className="flex-1">
                                                <p className="text-[11px] text-white/30">{b.label}</p>
                                                <p className="text-lg font-bold" style={{ color: b.color }}>{b.value} <span className="text-sm font-normal text-white/30">{b.unit}</span></p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {readiness && !readiness.noData && (
                            <div className="backdrop-blur-2xl bg-white/5 border border-white/10 rounded-3xl p-6 flex flex-col items-center justify-center">
                                <p className="text-xs text-white/40 uppercase tracking-widest mb-2">Recovery Score</p>
                                <ReadinessArc score={readiness.readinessScore} />
                                <p className="text-center text-xs text-white/50 mt-3 max-w-xs leading-relaxed">{readiness.message}</p>
                            </div>
                        )}
                    </div>

                    {recoveryTrend.length > 1 && (
                        <div className="backdrop-blur-2xl bg-white/5 border border-white/10 rounded-3xl p-5 sm:p-7">
                            <div className="flex items-center justify-between mb-5">
                                <div>
                                    <h3 className="text-sm font-semibold">Recovery Score Trend</h3>
                                    <p className="text-xs text-white/30 mt-0.5">Calculated from sleep, heart rate & steps</p>
                                </div>
                                <div className="flex items-center gap-2 text-xs text-white/30">
                                    <span className="w-3 h-0.5 bg-[#c8ff00] inline-block rounded" /> Score
                                </div>
                            </div>
                            <div className="h-48">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={recoveryTrend}>
                                        <defs>
                                            <linearGradient id="recoveryGrad" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#c8ff00" stopOpacity={0.2} />
                                                <stop offset="95%" stopColor="#c8ff00" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid stroke="rgba(255,255,255,0.04)" vertical={false} />
                                        <XAxis dataKey="label" stroke="#ffffff20" tick={{ fontSize: 10, fill: "#ffffff50" }} interval="preserveStartEnd" />
                                        <YAxis stroke="#ffffff20" tick={{ fontSize: 10, fill: "#ffffff50" }} domain={[0, 100]} />
                                        <Tooltip content={<CustomTooltip />} />
                                        <Area type="monotone" dataKey="recovery" stroke="#c8ff00" strokeWidth={2.5} fill="url(#recoveryGrad)" dot={{ r: 3, fill: "#c8ff00", strokeWidth: 0 }} activeDot={{ r: 5 }} />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    )}
                </motion.div>
            )}

            {/* ══════════ CHARTS TAB ══════════ */}
            {activeTab === "charts" && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                    {history.length === 0 && (
                        <div className="text-center py-20 text-white/30">
                            <p className="text-4xl mb-4">📊</p>
                            <p>No data in this period. Log some health entries first.</p>
                        </div>
                    )}

                    {history.length > 0 && (
                        <>
                            <div className="flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
                                <div className="flex flex-wrap gap-2">
                                    {METRICS.map((m) => (
                                        <button
                                            key={m.key}
                                            onClick={() => { setActiveMetric(m.key as MetricKey); setChartType("area"); }}
                                            className={`px-4 py-2 rounded-xl text-xs font-medium transition-all flex items-center gap-2 ${activeMetric === m.key && chartType !== "multi" ? "text-black font-bold" : "bg-white/5 text-white/50 hover:text-white"}`}
                                            style={activeMetric === m.key && chartType !== "multi" ? { background: m.color } : {}}
                                        >
                                            {m.icon} {m.label}
                                        </button>
                                    ))}
                                    <button onClick={() => setChartType("multi")} className={`px-4 py-2 rounded-xl text-xs font-medium transition-all ${chartType === "multi" ? "bg-white/20 text-white" : "bg-white/5 text-white/50 hover:text-white"}`}>
                                        All Metrics
                                    </button>
                                </div>

                                {chartType !== "multi" && (
                                    <div className="flex gap-1 p-1 bg-white/5 rounded-xl border border-white/10">
                                        {(["area", "bar"] as const).map((t) => (
                                            <button key={t} onClick={() => setChartType(t)} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all capitalize ${chartType === t ? "bg-white/10 text-white" : "text-white/40 hover:text-white"}`}>
                                                {t === "area" ? "📈 Area" : "📊 Bar"}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {chartType !== "multi" && (
                                <div className="backdrop-blur-2xl bg-white/5 border border-white/10 rounded-3xl p-5 sm:p-8">
                                    <div className="flex items-center justify-between mb-6">
                                        <div>
                                            <h2 className="text-base sm:text-lg font-semibold">{activeMetricInfo.icon} {activeMetricInfo.label}</h2>
                                            <p className="text-xs text-white/30 mt-1">{history.length} data points · {rangeLabel}</p>
                                        </div>
                                        {stats && !stats.noData && (
                                            <div className="text-right">
                                                <p className="text-xs text-white/30">Avg</p>
                                                <p className="font-bold text-lg" style={{ color: activeMetricInfo.color }}>
                                                    {stats.averages[activeMetric as keyof typeof stats.averages].toLocaleString()}
                                                    <span className="text-xs font-normal text-white/30 ml-1">{activeMetricInfo.unit}</span>
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                    <div className="h-64 sm:h-80">
                                        <ResponsiveContainer width="100%" height="100%">
                                            {chartType === "area" ? (
                                                <AreaChart data={chartData}>
                                                    <defs>
                                                        <linearGradient id="metricGrad" x1="0" y1="0" x2="0" y2="1">
                                                            <stop offset="5%" stopColor={activeMetricInfo.color} stopOpacity={0.25} />
                                                            <stop offset="95%" stopColor={activeMetricInfo.color} stopOpacity={0} />
                                                        </linearGradient>
                                                    </defs>
                                                    <CartesianGrid stroke="rgba(255,255,255,0.04)" vertical={false} />
                                                    <XAxis dataKey="label" stroke="#ffffff20" tick={{ fontSize: 10, fill: "#ffffff50" }} interval="preserveStartEnd" />
                                                    <YAxis stroke="#ffffff20" tick={{ fontSize: 10, fill: "#ffffff50" }} />
                                                    <Tooltip content={<CustomTooltip />} />
                                                    <Area type="monotone" dataKey={activeMetric} stroke={activeMetricInfo.color} strokeWidth={2.5} fill="url(#metricGrad)" dot={{ r: 3, fill: activeMetricInfo.color, strokeWidth: 0 }} activeDot={{ r: 5 }} />
                                                </AreaChart>
                                            ) : (
                                                <BarChart data={chartData}>
                                                    <CartesianGrid stroke="rgba(255,255,255,0.04)" vertical={false} />
                                                    <XAxis dataKey="label" stroke="#ffffff20" tick={{ fontSize: 10, fill: "#ffffff50" }} interval="preserveStartEnd" />
                                                    <YAxis stroke="#ffffff20" tick={{ fontSize: 10, fill: "#ffffff50" }} />
                                                    <Tooltip content={<CustomTooltip />} />
                                                    <Bar dataKey={activeMetric} fill={activeMetricInfo.color} radius={[4, 4, 0, 0]} fillOpacity={0.85} />
                                                </BarChart>
                                            )}
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                            )}

                            {chartType === "multi" && (
                                <div className="space-y-4">
                                    <div className="backdrop-blur-2xl bg-white/5 border border-white/10 rounded-3xl p-5 sm:p-8">
                                        <h2 className="text-sm font-semibold text-white/70 mb-6">👟 Steps & 🔥 Calories Over Time</h2>
                                        <div className="h-56">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <ComposedChart data={chartData}>
                                                    <CartesianGrid stroke="rgba(255,255,255,0.04)" vertical={false} />
                                                    <XAxis dataKey="label" stroke="#ffffff20" tick={{ fontSize: 10, fill: "#ffffff50" }} interval="preserveStartEnd" />
                                                    <YAxis yAxisId="steps" stroke="#ffffff20" tick={{ fontSize: 10, fill: "#ffffff50" }} />
                                                    <YAxis yAxisId="cal" orientation="right" stroke="#ffffff20" tick={{ fontSize: 10, fill: "#ffffff50" }} />
                                                    <Tooltip content={<CustomTooltip />} />
                                                    <Legend />
                                                    <defs>
                                                        <linearGradient id="stepsGrad" x1="0" y1="0" x2="0" y2="1">
                                                            <stop offset="5%" stopColor="#c8ff00" stopOpacity={0.2} />
                                                            <stop offset="95%" stopColor="#c8ff00" stopOpacity={0} />
                                                        </linearGradient>
                                                    </defs>
                                                    <Area yAxisId="steps" type="monotone" dataKey="steps" stroke="#c8ff00" strokeWidth={2} fill="url(#stepsGrad)" />
                                                    <Bar yAxisId="cal" dataKey="caloriesBurned" fill="#FF8C00" opacity={0.6} radius={[3, 3, 0, 0]} />
                                                </ComposedChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                        <div className="backdrop-blur-2xl bg-white/5 border border-white/10 rounded-3xl p-5 sm:p-7">
                                            <h2 className="text-sm font-semibold text-white/70 mb-5">❤️ Heart Rate Trend</h2>
                                            <div className="h-48">
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <LineChart data={chartData}>
                                                        <CartesianGrid stroke="rgba(255,255,255,0.04)" vertical={false} />
                                                        <XAxis dataKey="label" stroke="#ffffff20" tick={{ fontSize: 10, fill: "#ffffff50" }} interval="preserveStartEnd" />
                                                        <YAxis stroke="#ffffff20" tick={{ fontSize: 10, fill: "#ffffff50" }} domain={["auto", "auto"]} />
                                                        <Tooltip content={<CustomTooltip />} />
                                                        <Line type="monotone" dataKey="heartRate" stroke="#ff4d6d" strokeWidth={2.5} dot={{ r: 3, fill: "#ff4d6d", strokeWidth: 0 }} activeDot={{ r: 5 }} />
                                                        <Line type="monotone" dataKey="restingHR" stroke="#ff4d6d88" strokeWidth={1.5} strokeDasharray="5 5" dot={false} />
                                                    </LineChart>
                                                </ResponsiveContainer>
                                            </div>
                                        </div>

                                        <div className="backdrop-blur-2xl bg-white/5 border border-white/10 rounded-3xl p-5 sm:p-7">
                                            <h2 className="text-sm font-semibold text-white/70 mb-5">🌙 Sleep Duration</h2>
                                            <div className="h-48">
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <BarChart data={chartData}>
                                                        <CartesianGrid stroke="rgba(255,255,255,0.04)" vertical={false} />
                                                        <XAxis dataKey="label" stroke="#ffffff20" tick={{ fontSize: 10, fill: "#ffffff50" }} interval="preserveStartEnd" />
                                                        <YAxis stroke="#ffffff20" tick={{ fontSize: 10, fill: "#ffffff50" }} domain={[0, 12]} />
                                                        <Tooltip content={<CustomTooltip />} />
                                                        <Bar dataKey="sleepHours" fill="#00BFFF" opacity={0.75} radius={[4, 4, 0, 0]} />
                                                    </BarChart>
                                                </ResponsiveContainer>
                                            </div>
                                            <p className="text-[10px] text-white/20 mt-2">Target: 8 hrs/night</p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </motion.div>
            )}

            {/* ══════════ HISTORY TAB ══════════ */}
            {activeTab === "history" && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                    {history.length === 0 ? (
                        <div className="text-center py-20 text-white/30">
                            <p className="text-4xl mb-4">📋</p>
                            <p>No records in this period.</p>
                        </div>
                    ) : (
                        <div className="backdrop-blur-2xl bg-white/5 border border-white/10 rounded-3xl overflow-hidden">
                            <div className="px-5 sm:px-7 py-4 border-b border-white/10 flex items-center justify-between">
                                <h2 className="text-sm font-semibold">All Records</h2>
                                <span className="text-xs text-white/30">{history.length} entries · {rangeLabel}</span>
                            </div>

                            <div className="hidden sm:grid grid-cols-6 px-5 sm:px-7 py-3 border-b border-white/5 text-[10px] text-white/30 uppercase tracking-widest">
                                <span>Date</span><span>Steps</span><span>Heart Rate</span><span>Sleep</span><span>Calories</span><span className="text-right">Actions</span>
                            </div>

                            <div className="divide-y divide-white/5">
                                {[...history].reverse().map((record, i) => (
                                    <motion.div key={record._id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.02 }} className="px-5 sm:px-7 py-4">
                                        <div className="sm:hidden">
                                            <div className="flex items-center justify-between mb-3">
                                                <div>
                                                    <p className="text-sm font-medium">{fmtDate(record.date, false)}</p>
                                                    <p className="text-xs text-white/30">{fmtTime(record.date)}</p>
                                                </div>
                                                <button onClick={() => setDeleteId(record._id)} className="text-white/20 hover:text-red-400 transition text-sm px-2 py-1 rounded-lg hover:bg-red-400/10">×</button>
                                            </div>
                                            <div className="grid grid-cols-2 gap-3 text-xs">
                                                <div><span className="text-white/30">Steps</span><p className="text-[#c8ff00] font-bold">{record.steps.toLocaleString()}</p></div>
                                                <div><span className="text-white/30">Heart Rate</span><p className="text-[#ff4d6d] font-bold">{record.heartRate} bpm</p></div>
                                                <div><span className="text-white/30">Sleep</span><p className="text-[#00BFFF] font-bold">{record.sleepHours} hrs</p></div>
                                                <div><span className="text-white/30">Calories</span><p className="text-[#FF8C00] font-bold">{record.caloriesBurned} kcal</p></div>
                                            </div>
                                        </div>
                                        <div className="hidden sm:grid grid-cols-6 items-center text-sm">
                                            <div>
                                                <p className="font-medium text-white/90">{fmtDate(record.date)}</p>
                                                <p className="text-[10px] text-white/30">{fmtTime(record.date)}</p>
                                            </div>
                                            <span className="text-[#c8ff00] font-mono font-bold">{record.steps.toLocaleString()}</span>
                                            <span className="text-[#ff4d6d] font-mono font-bold">{record.heartRate} <span className="text-xs font-normal text-white/30">bpm</span></span>
                                            <span className="text-[#00BFFF] font-mono font-bold">{record.sleepHours} <span className="text-xs font-normal text-white/30">hrs</span></span>
                                            <span className="text-[#FF8C00] font-mono font-bold">{record.caloriesBurned} <span className="text-xs font-normal text-white/30">kcal</span></span>
                                            <div className="text-right">
                                                <button onClick={() => setDeleteId(record._id)} className="text-white/20 hover:text-red-400 transition text-xs px-3 py-1.5 rounded-lg hover:bg-red-400/10">Delete</button>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                    )}
                </motion.div>
            )}

            {/* ══════════ SYMPTOM JOURNAL TAB ══════════ */}
            {activeTab === "journal" && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
                    <div className="flex items-center justify-between">
                        <p className="text-xs text-white/30">Track how you feel each day alongside your biometrics.</p>
                        <button onClick={() => setJournalOpen(true)} className="px-4 py-2.5 rounded-xl bg-[#c8ff00] text-black font-semibold text-sm hover:bg-[#d4ff20] transition">
                            + Add Entry
                        </button>
                    </div>

                    {symptoms.length === 0 ? (
                        <div className="text-center py-20 text-white/30">
                            <p className="text-4xl mb-4">🩺</p>
                            <p>No journal entries yet. How are you feeling today?</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {symptoms.map((s) => {
                                const sevColor = s.severity === 1 ? "#c8ff00" : s.severity === 2 ? "#00BFFF" : "#ff4d6d";
                                const sevLabel = s.severity === 1 ? "Feeling Good" : s.severity === 2 ? "Moderate" : "Struggling";
                                return (
                                    <motion.div key={s.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="bg-white/5 border border-white/10 rounded-2xl p-4 sm:p-5">
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <span className="text-[10px] text-white/30">{fmtDate(s.date, false)}</span>
                                                    <span className="text-[10px] px-2 py-0.5 rounded-full font-medium" style={{ background: `${sevColor}20`, color: sevColor }}>{sevLabel}</span>
                                                </div>
                                                {s.tags.length > 0 && (
                                                    <div className="flex flex-wrap gap-1.5 mb-2">
                                                        {s.tags.map((tag) => (
                                                            <span key={tag} className="text-[11px] px-2 py-0.5 rounded-lg bg-white/5 border border-white/10 text-white/60">{tag}</span>
                                                        ))}
                                                    </div>
                                                )}
                                                {s.note && <p className="text-sm text-white/60 leading-relaxed">{s.note}</p>}
                                            </div>
                                            <button onClick={() => deleteSymptom(s.id)} className="text-white/15 hover:text-red-400 transition text-sm px-2 py-1 rounded-lg hover:bg-red-400/10 shrink-0">×</button>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </div>
                    )}

                    <AnimatePresence>
                        {journalOpen && (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={(e) => e.target === e.currentTarget && setJournalOpen(false)}>
                                <motion.div initial={{ scale: 0.93, y: 16 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.93, y: 16 }} className="w-full max-w-md bg-[#0d0d0d] border border-white/15 rounded-3xl p-6 space-y-5">
                                    <div className="flex items-center justify-between">
                                        <h3 className="font-bold">How are you feeling?</h3>
                                        <button onClick={() => setJournalOpen(false)} className="text-white/30 hover:text-white">✕</button>
                                    </div>
                                    <div>
                                        <p className="text-xs text-white/40 uppercase tracking-widest mb-3">Overall Feeling</p>
                                        <div className="grid grid-cols-3 gap-2">
                                            {([{ val: 1, label: "😊 Good", color: "#c8ff00" }, { val: 2, label: "😐 Okay", color: "#00BFFF" }, { val: 3, label: "😔 Rough", color: "#ff4d6d" }] as const).map((s) => (
                                                <button key={s.val} onClick={() => setSymptomSeverity(s.val)} className={`py-2.5 rounded-xl text-sm font-medium border transition ${symptomSeverity === s.val ? "border-opacity-50 text-black font-bold" : "border-white/10 bg-white/5 text-white/50 hover:bg-white/10"}`} style={symptomSeverity === s.val ? { background: s.color, borderColor: s.color } : {}}>{s.label}</button>
                                            ))}
                                        </div>
                                    </div>
                                    <div>
                                        <p className="text-xs text-white/40 uppercase tracking-widest mb-3">Symptoms / Tags</p>
                                        <div className="flex flex-wrap gap-2">
                                            {SYMPTOM_TAGS.map((tag) => (
                                                <button key={tag} onClick={() => setSelectedTags((prev) => prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag])} className={`text-xs px-3 py-1.5 rounded-xl border transition ${selectedTags.includes(tag) ? "bg-[#c8ff00]/15 border-[#c8ff00]/40 text-[#c8ff00]" : "bg-white/5 border-white/10 text-white/40 hover:text-white/70 hover:border-white/20"}`}>{tag}</button>
                                            ))}
                                        </div>
                                    </div>
                                    <div>
                                        <p className="text-xs text-white/40 uppercase tracking-widest mb-2">Notes (optional)</p>
                                        <textarea value={symptomNote} onChange={(e) => setSymptomNote(e.target.value)} placeholder="How's the body feeling?" rows={3} className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm outline-none focus:border-[#c8ff00]/40 transition resize-none placeholder:text-white/20" />
                                    </div>
                                    <motion.button whileTap={{ scale: 0.97 }} onClick={saveSymptom} className="w-full py-3 rounded-2xl bg-[#c8ff00] text-black font-bold text-sm">
                                        {journalSaved ? "✓ Saved!" : "Save Entry"}
                                    </motion.button>
                                </motion.div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>
            )}

            {/* ══════════ EXPORT TAB ══════════ */}
            {activeTab === "export" && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-5 max-w-2xl">
                    <div className="backdrop-blur-2xl bg-white/5 border border-white/10 rounded-3xl p-6 sm:p-8 space-y-6">
                        <div>
                            <h2 className="text-lg font-bold mb-1">Export Health Data</h2>
                            <p className="text-white/40 text-sm">Download your health records as a CSV file.</p>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                            {[
                                { label: "Total Records", value: history.length, color: "#c8ff00" },
                                { label: "Date Range", value: rangeLabel, color: "#00BFFF" },
                                { label: "Metrics", value: "5 fields", color: "#FF8C00" },
                            ].map((item) => (
                                <div key={item.label} className="bg-white/5 border border-white/10 rounded-2xl p-4">
                                    <p className="text-[10px] text-white/30 uppercase tracking-widest mb-1">{item.label}</p>
                                    <p className="text-lg font-bold" style={{ color: item.color }}>{item.value}</p>
                                </div>
                            ))}
                        </div>
                        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={exportCSV} disabled={exportLoading || history.length === 0} className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-[#c8ff00] text-black font-bold text-sm disabled:opacity-40 transition flex items-center justify-center gap-2">
                            {exportLoading ? "Preparing..." : `⬇️ Download CSV (${history.length} records)`}
                        </motion.button>
                        {history.length === 0 && <p className="text-xs text-white/30">No data available for the selected range.</p>}
                    </div>

                    {symptoms.length > 0 && (
                        <div className="backdrop-blur-2xl bg-white/5 border border-white/10 rounded-3xl p-6 sm:p-8 space-y-4">
                            <div>
                                <h3 className="text-base font-bold mb-1">Symptom Journal</h3>
                                <p className="text-white/40 text-sm">{symptoms.length} journal entries available.</p>
                            </div>
                            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => {
                                const rows = symptoms.map((s) => [new Date(s.date).toLocaleDateString(), s.severity === 1 ? "Good" : s.severity === 2 ? "Moderate" : "Struggling", s.tags.join("; "), s.note]);
                                const csv = [["Date", "Feeling", "Tags", "Notes"], ...rows].map((r) => r.map((v) => `"${v}"`).join(",")).join("\n");
                                const blob = new Blob([csv], { type: "text/csv" });
                                const url = URL.createObjectURL(blob);
                                const a = document.createElement("a");
                                a.href = url;
                                a.download = `smartlife-journal-${new Date().toISOString().slice(0, 10)}.csv`;
                                a.click();
                                URL.revokeObjectURL(url);
                            }} className="px-6 py-3 rounded-2xl border border-white/10 text-white/60 hover:text-white hover:border-white/20 text-sm font-medium transition">
                                ⬇️ Download Journal CSV
                            </motion.button>
                        </div>
                    )}
                </motion.div>
            )}

            {/* ── DELETE CONFIRM MODAL ── */}
            <AnimatePresence>
                {deleteId && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4" onClick={() => setDeleteId(null)}>
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} onClick={(e) => e.stopPropagation()} className="bg-[#0a0a0a] border border-white/10 rounded-3xl p-8 max-w-sm w-full text-center">
                            <p className="text-3xl mb-4">🗑️</p>
                            <h3 className="text-lg font-bold mb-2">Delete Record?</h3>
                            <p className="text-white/50 text-sm mb-6">This action cannot be undone.</p>
                            <div className="flex gap-3">
                                <button onClick={() => setDeleteId(null)} className="flex-1 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-white/60 hover:text-white transition">Cancel</button>
                                <button onClick={() => handleDelete(deleteId)} className="flex-1 px-4 py-2.5 rounded-xl bg-red-500/20 border border-red-500/30 text-red-400 text-sm font-semibold hover:bg-red-500/30 transition">Delete</button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}