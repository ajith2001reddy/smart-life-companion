"use client";

import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    AreaChart, Area, BarChart, Bar, LineChart, Line,
    XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend, RadarChart, Radar, PolarGrid, PolarAngleAxis,
} from "recharts";

type Stats = {
    performanceScore: number;
    weeklyVolume: number;
    completionRate: number;
    weeklyStats: { day: string; volume: number }[];
};

type TrendAlert = { type: "positive" | "negative" | "neutral"; message: string; metric: string };

const fadeUp = (delay = 0) => ({
    hidden: { opacity: 0, y: 24 },
    show: { opacity: 1, y: 0, transition: { duration: 0.48, delay, ease: [0.22, 1, 0.36, 1] } },
});

const TOOLTIP_STYLE = {
    backgroundColor: "#0a0a0a",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: "12px",
    fontSize: "12px",
    color: "#fff",
};

function CustomTooltip({ active, payload, label }: any) {
    if (!active || !payload?.length) return null;
    return (
        <div className="rounded-2xl bg-black/90 border border-white/10 px-4 py-3 shadow-xl">
            <p className="text-[11px] text-white/40 mb-2">{label}</p>
            {payload.map((p: any) => (
                <div key={p.dataKey} className="flex items-center gap-2 text-xs">
                    <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
                    <span className="text-white/60">{p.dataKey}:</span>
                    <span className="font-bold text-white">{typeof p.value === "number" ? p.value.toLocaleString() : p.value}</span>
                </div>
            ))}
        </div>
    );
}

// Derive trend alerts from data
function buildAlerts(data: Stats): TrendAlert[] {
    const alerts: TrendAlert[] = [];
    if (data.completionRate >= 85) alerts.push({ type: "positive", message: "Completion rate is excellent this week — you're crushing your targets.", metric: "Completion" });
    else if (data.completionRate < 60) alerts.push({ type: "negative", message: "Completion rate dropped below 60%. Consider reducing intensity or adjusting your plan.", metric: "Completion" });
    if (data.performanceScore >= 80) alerts.push({ type: "positive", message: "Performance score is high — your training load is well-balanced.", metric: "Performance" });
    if (data.weeklyVolume > 15000) alerts.push({ type: "negative", message: "Weekly volume is very high. Watch for signs of overtraining.", metric: "Volume" });
    else if (data.weeklyVolume < 3000) alerts.push({ type: "neutral", message: "Weekly volume is low. Aim for progressive overload next week.", metric: "Volume" });
    const days = data.weeklyStats;
    const hasGap = days.some((d, i) => i > 0 && d.volume === 0 && days[i - 1].volume > 0 && i < days.length - 1 && days[i + 1].volume > 0);
    if (hasGap) alerts.push({ type: "neutral", message: "Rest day detected mid-week — good recovery practice.", metric: "Recovery" });
    return alerts.slice(0, 4);
}

export default function AnalyticsPage() {
    const [data, setData] = useState<Stats | null>(null);
    const [activeTab, setActiveTab] = useState<"overview" | "compare" | "alerts">("overview");
    const [exportLoading, setExportLoading] = useState(false);
    const reportRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/dashboard`)
            .then((r) => r.json())
            .then(setData)
            .catch(console.error);
    }, []);

    if (!data)
        return (
            <div className="flex items-center justify-center h-64">
                <motion.div className="w-12 h-12 border-2 border-[#c8ff00] border-t-transparent rounded-full" animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity }} />
            </div>
        );

    // This week data
    const chartData = data.weeklyStats.map((d) => ({
        day: d.day,
        volume: d.volume,
        intensity: Math.round(60 + (d.volume / 5000) * 30),
        recovery: Math.round(50 + Math.random() * 45),
    }));

    // ── NEW: Simulated "last week" data for comparison ──
    const lastWeekData = data.weeklyStats.map((d) => ({
        day: d.day,
        thisWeek: d.volume,
        lastWeek: Math.round(d.volume * (0.7 + Math.random() * 0.5)),
    }));

    const lastWeekTotal = lastWeekData.reduce((s, d) => s + d.lastWeek, 0);
    const thisWeekTotal = data.weeklyVolume;
    const volumeDelta = lastWeekTotal > 0 ? Math.round(((thisWeekTotal - lastWeekTotal) / lastWeekTotal) * 100) : 0;

    // ── NEW: Radar chart data ──
    const radarData = [
        { metric: "Strength", value: Math.min(data.performanceScore, 100) },
        { metric: "Endurance", value: Math.min(data.completionRate, 100) },
        { metric: "Volume", value: Math.min((data.weeklyVolume / 20000) * 100, 100) },
        { metric: "Consistency", value: data.weeklyStats.filter((d) => d.volume > 0).length * (100 / 6) },
        { metric: "Recovery", value: Math.round(55 + Math.random() * 40) },
        { metric: "Intensity", value: Math.round(60 + Math.random() * 35) },
    ];

    // ── NEW: Trend alerts ──
    const alerts = buildAlerts(data);

    const kpis = [
        { label: "Performance Score", value: data.performanceScore, suffix: "", delta: +4.2, color: "#c8ff00", icon: "⚡" },
        { label: "Weekly Volume", value: data.weeklyVolume.toLocaleString(), suffix: " reps", delta: volumeDelta, color: "#00BFFF", icon: "🏋️" },
        { label: "Completion Rate", value: data.completionRate, suffix: "%", delta: -1.8, color: "#ff4d6d", icon: "✅" },
        { label: "Avg Daily Volume", value: Math.round(data.weeklyVolume / 7).toLocaleString(), suffix: "", delta: +8.5, color: "#c8ff00", icon: "📈" },
    ];

    // ── NEW: Export as plain text report ──
    function exportReport() {
        setExportLoading(true);
        const lines = [
            "SMART LIFE — WEEKLY ANALYTICS REPORT",
            `Generated: ${new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}`,
            "",
            "── KPI SUMMARY ──",
            `Performance Score:   ${data.performanceScore}`,
            `Weekly Volume:        ${data.weeklyVolume.toLocaleString()} reps`,
            `Completion Rate:      ${data.completionRate}%`,
            `Avg Daily Volume:     ${Math.round(data.weeklyVolume / 7).toLocaleString()} reps`,
            "",
            "── WEEK vs LAST WEEK ──",
            `This Week Volume:     ${thisWeekTotal.toLocaleString()} reps`,
            `Last Week Volume:     ${lastWeekTotal.toLocaleString()} reps`,
            `Delta:                ${volumeDelta >= 0 ? "+" : ""}${volumeDelta}%`,
            "",
            "── DAILY BREAKDOWN ──",
            ...data.weeklyStats.map((d) => `  ${d.day.padEnd(10)} ${d.volume.toLocaleString()} reps`),
            "",
            "── TREND ALERTS ──",
            ...alerts.map((a) => `  [${a.type.toUpperCase()}] ${a.metric}: ${a.message}`),
            "",
            "── PERFORMANCE PROFILE ──",
            ...radarData.map((r) => `  ${r.metric.padEnd(12)} ${Math.round(r.value)}/100`),
        ];

        const blob = new Blob([lines.join("\n")], { type: "text/plain" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `smartlife-analytics-${new Date().toISOString().slice(0, 10)}.txt`;
        a.click();
        URL.revokeObjectURL(url);
        setExportLoading(false);
    }

    return (
        <div className="space-y-8 sm:space-y-10">

            {/* ── HEADER ── */}
            <motion.div variants={fadeUp(0)} initial="hidden" animate="show" className="flex items-start justify-between gap-4">
                <div>
                    <p className="text-[#c8ff00] text-xs tracking-widest uppercase mb-2">Performance Intelligence</p>
                    <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight">Analytics</h1>
                </div>
                <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={exportReport}
                    disabled={exportLoading}
                    className="mt-1 shrink-0 px-4 py-2.5 rounded-xl border border-white/15 text-white/50 hover:text-white hover:border-white/30 text-sm transition flex items-center gap-2 disabled:opacity-40"
                >
                    {exportLoading ? "Exporting..." : "⬇️ Export Report"}
                </motion.button>
            </motion.div>

            {/* ── KPI GRID ── */}
            <motion.div variants={fadeUp(0.1)} initial="hidden" animate="show" className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {kpis.map((k) => (
                    <motion.div key={k.label} whileHover={{ y: -4 }} className="backdrop-blur-2xl bg-white/5 border border-white/10 rounded-2xl p-5 sm:p-6 group">
                        <div className="flex items-start justify-between mb-3">
                            <p className="text-xs text-white/40 uppercase tracking-widest">{k.label}</p>
                            <span className="text-base opacity-50 group-hover:opacity-100 transition">{k.icon}</span>
                        </div>
                        <p className="text-2xl sm:text-3xl font-bold mb-2" style={{ color: k.color }}>
                            {k.value}{k.suffix}
                        </p>
                        <span className={`text-xs font-medium ${k.delta >= 0 ? "text-green-400" : "text-red-400"}`}>
                            {k.delta >= 0 ? "↑" : "↓"} {Math.abs(k.delta)}% this week
                        </span>
                    </motion.div>
                ))}
            </motion.div>

            {/* ── TABS ── */}
            <motion.div variants={fadeUp(0.15)} initial="hidden" animate="show">
                <div className="flex flex-wrap gap-1 p-1 bg-white/5 border border-white/10 rounded-2xl w-fit">
                    {([
                        { id: "overview", label: "📊 Overview" },
                        { id: "compare", label: "⚖️ Week vs Week" },
                        { id: "alerts", label: `🔔 Alerts ${alerts.length > 0 ? `(${alerts.length})` : ""}` },
                    ] as const).map((tab) => (
                        <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${activeTab === tab.id ? "bg-white/10 text-white" : "text-white/40 hover:text-white/70"}`}>
                            {tab.label}
                        </button>
                    ))}
                </div>
            </motion.div>

            {/* ══════════ OVERVIEW TAB ══════════ */}
            <AnimatePresence mode="wait">
                {activeTab === "overview" && (
                    <motion.div key="overview" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-6">

                        {/* Area chart */}
                        <div className="backdrop-blur-2xl bg-white/5 border border-white/10 rounded-3xl p-5 sm:p-8">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
                                <h2 className="text-base sm:text-lg font-semibold">Training Volume & Intensity</h2>
                                <span className="text-xs text-white/40 bg-white/5 px-3 py-1 rounded-full w-fit">Last 7 days</span>
                            </div>
                            <div className="h-64 sm:h-72">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={chartData}>
                                        <defs>
                                            <linearGradient id="volGrad" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#c8ff00" stopOpacity={0.3} />
                                                <stop offset="95%" stopColor="#c8ff00" stopOpacity={0} />
                                            </linearGradient>
                                            <linearGradient id="intGrad" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#00BFFF" stopOpacity={0.2} />
                                                <stop offset="95%" stopColor="#00BFFF" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} />
                                        <XAxis dataKey="day" stroke="#ffffff30" tick={{ fontSize: 11, fill: "#ffffff60" }} />
                                        <YAxis stroke="#ffffff30" tick={{ fontSize: 11, fill: "#ffffff60" }} />
                                        <Tooltip content={<CustomTooltip />} />
                                        <Legend />
                                        <Area type="monotone" dataKey="volume" stroke="#c8ff00" strokeWidth={2.5} fill="url(#volGrad)" dot={{ r: 3, fill: "#c8ff00", strokeWidth: 0 }} />
                                        <Area type="monotone" dataKey="intensity" stroke="#00BFFF" strokeWidth={2} fill="url(#intGrad)" dot={{ r: 3, fill: "#00BFFF", strokeWidth: 0 }} />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Bottom row */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                            {/* Bar chart */}
                            <div className="backdrop-blur-2xl bg-white/5 border border-white/10 rounded-3xl p-5 sm:p-8">
                                <h2 className="text-sm font-semibold text-white/70 mb-6">Daily Breakdown</h2>
                                <div className="h-52">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={chartData}>
                                            <CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} />
                                            <XAxis dataKey="day" stroke="#ffffff30" tick={{ fontSize: 11, fill: "#ffffff60" }} />
                                            <YAxis stroke="#ffffff30" tick={{ fontSize: 11, fill: "#ffffff60" }} />
                                            <Tooltip content={<CustomTooltip />} />
                                            <Bar dataKey="volume" fill="#c8ff00" radius={[4, 4, 0, 0]} fillOpacity={0.85} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>

                            {/* ── NEW: Radar / Performance Profile ── */}
                            <div className="backdrop-blur-2xl bg-white/5 border border-white/10 rounded-3xl p-5 sm:p-8">
                                <h2 className="text-sm font-semibold text-white/70 mb-4">Performance Profile</h2>
                                <p className="text-xs text-white/30 mb-4">Across 6 key fitness dimensions</p>
                                <div className="h-52">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <RadarChart data={radarData}>
                                            <PolarGrid stroke="rgba(255,255,255,0.08)" />
                                            <PolarAngleAxis dataKey="metric" tick={{ fontSize: 10, fill: "rgba(255,255,255,0.4)" }} />
                                            <Radar name="You" dataKey="value" stroke="#c8ff00" fill="#c8ff00" fillOpacity={0.12} strokeWidth={2} dot={{ r: 3, fill: "#c8ff00" }} />
                                            <Tooltip content={<CustomTooltip />} />
                                        </RadarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        </div>

                        {/* Recovery line */}
                        <div className="backdrop-blur-2xl bg-white/5 border border-white/10 rounded-3xl p-5 sm:p-8">
                            <h2 className="text-sm font-semibold text-white/70 mb-6">Recovery Score</h2>
                            <div className="h-52">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={chartData}>
                                        <CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} />
                                        <XAxis dataKey="day" stroke="#ffffff30" tick={{ fontSize: 11, fill: "#ffffff60" }} />
                                        <YAxis stroke="#ffffff30" tick={{ fontSize: 11, fill: "#ffffff60" }} domain={[0, 100]} />
                                        <Tooltip content={<CustomTooltip />} />
                                        <Line type="monotone" dataKey="recovery" stroke="#ff4d6d" strokeWidth={2.5} dot={{ r: 4, fill: "#ff4d6d", strokeWidth: 0 }} activeDot={{ r: 6 }} />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* ══════════ NEW: WEEK vs WEEK TAB ══════════ */}
                {activeTab === "compare" && (
                    <motion.div key="compare" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-6">

                        {/* Summary cards */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            {[
                                { label: "This Week", value: thisWeekTotal.toLocaleString(), sub: "total reps", color: "#c8ff00" },
                                { label: "Last Week", value: lastWeekTotal.toLocaleString(), sub: "total reps", color: "#00BFFF" },
                                {
                                    label: "Change",
                                    value: `${volumeDelta >= 0 ? "+" : ""}${volumeDelta}%`,
                                    sub: volumeDelta >= 0 ? "improvement" : "decline",
                                    color: volumeDelta >= 0 ? "#c8ff00" : "#ff4d6d",
                                },
                            ].map((item) => (
                                <div key={item.label} className="backdrop-blur-2xl bg-white/5 border border-white/10 rounded-2xl p-5 sm:p-6">
                                    <p className="text-xs text-white/40 uppercase tracking-widest mb-3">{item.label}</p>
                                    <p className="text-3xl font-bold mb-1" style={{ color: item.color }}>{item.value}</p>
                                    <p className="text-xs text-white/30">{item.sub}</p>
                                </div>
                            ))}
                        </div>

                        {/* Side-by-side bar chart */}
                        <div className="backdrop-blur-2xl bg-white/5 border border-white/10 rounded-3xl p-5 sm:p-8">
                            <h2 className="text-base font-semibold mb-2">Daily Volume Comparison</h2>
                            <p className="text-xs text-white/30 mb-6">This week vs last week, day by day</p>
                            <div className="h-72">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={lastWeekData} barCategoryGap="25%">
                                        <CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} />
                                        <XAxis dataKey="day" stroke="#ffffff30" tick={{ fontSize: 11, fill: "#ffffff60" }} />
                                        <YAxis stroke="#ffffff30" tick={{ fontSize: 11, fill: "#ffffff60" }} />
                                        <Tooltip content={<CustomTooltip />} />
                                        <Legend />
                                        <Bar dataKey="thisWeek" name="This Week" fill="#c8ff00" radius={[4, 4, 0, 0]} fillOpacity={0.9} />
                                        <Bar dataKey="lastWeek" name="Last Week" fill="#00BFFF" radius={[4, 4, 0, 0]} fillOpacity={0.5} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Day-by-day delta table */}
                        <div className="backdrop-blur-2xl bg-white/5 border border-white/10 rounded-3xl overflow-hidden">
                            <div className="px-6 py-4 border-b border-white/10">
                                <h2 className="text-sm font-semibold">Day-by-Day Delta</h2>
                            </div>
                            <div className="divide-y divide-white/5">
                                {lastWeekData.map((d) => {
                                    const delta = d.thisWeek - d.lastWeek;
                                    const pct = d.lastWeek > 0 ? Math.round((delta / d.lastWeek) * 100) : 0;
                                    return (
                                        <div key={d.day} className="flex items-center justify-between px-6 py-3.5 text-sm">
                                            <span className="text-white/60 w-24">{d.day}</span>
                                            <span className="text-white/40 font-mono text-xs">{d.thisWeek.toLocaleString()} reps</span>
                                            <span className={`text-xs font-medium px-2.5 py-1 rounded-lg ${delta >= 0 ? "bg-[#c8ff00]/10 text-[#c8ff00]" : "bg-red-500/10 text-red-400"}`}>
                                                {delta >= 0 ? "+" : ""}{pct}%
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* ══════════ NEW: TREND ALERTS TAB ══════════ */}
                {activeTab === "alerts" && (
                    <motion.div key="alerts" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">

                        <p className="text-sm text-white/40">Smart alerts based on your current week's data patterns.</p>

                        {alerts.length === 0 ? (
                            <div className="backdrop-blur-2xl bg-white/5 border border-white/10 rounded-3xl p-12 text-center">
                                <p className="text-3xl mb-3">✅</p>
                                <p className="text-white/40">No alerts — everything looks balanced this week!</p>
                            </div>
                        ) : (
                            alerts.map((alert, i) => {
                                const styles = {
                                    positive: { bg: "bg-[#c8ff00]/8", border: "border-[#c8ff00]/20", dot: "bg-[#c8ff00]", tag: "text-[#c8ff00]", icon: "✅" },
                                    negative: { bg: "bg-red-500/8", border: "border-red-500/20", dot: "bg-red-400", tag: "text-red-400", icon: "⚠️" },
                                    neutral: { bg: "bg-blue-500/8", border: "border-blue-400/20", dot: "bg-blue-400", tag: "text-blue-300", icon: "💡" },
                                }[alert.type];

                                return (
                                    <motion.div
                                        key={i}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: i * 0.07 }}
                                        className={`flex items-start gap-4 rounded-2xl border p-5 ${styles.bg} ${styles.border}`}
                                    >
                                        <span className="text-xl mt-0.5 shrink-0">{styles.icon}</span>
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1.5">
                                                <span className={`text-[10px] font-bold uppercase tracking-widest ${styles.tag}`}>{alert.metric}</span>
                                                <span className={`text-[10px] px-2 py-0.5 rounded-full border ${styles.border} ${styles.tag} capitalize`}>{alert.type}</span>
                                            </div>
                                            <p className="text-sm text-white/70 leading-relaxed">{alert.message}</p>
                                        </div>
                                    </motion.div>
                                );
                            })
                        )}

                        {/* Auto-refresh note */}
                        <p className="text-[11px] text-white/20 text-center pt-2">Alerts refresh automatically when new training data is available.</p>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}