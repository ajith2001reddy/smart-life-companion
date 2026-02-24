"use client";

import { motion } from "framer-motion";

type Trend = "up" | "down" | "neutral";

interface StatCardProps {
    label:      string;
    value:      string | number;
    suffix?:    string;
    icon?:      string;
    color?:     string;       // hex or tailwind text class
    trend?:     Trend;
    trendLabel?: string;
    progress?:  number;       // 0–100 for progress bar
    onClick?:   () => void;
    className?: string;
}

const TREND_ICONS: Record<Trend, string> = {
    up:      "↑",
    down:    "↓",
    neutral: "→",
};

const TREND_COLORS: Record<Trend, string> = {
    up:      "text-emerald-400",
    down:    "text-red-400",
    neutral: "text-white/40",
};

export default function StatCard({
    label,
    value,
    suffix     = "",
    icon,
    color      = "#c8ff00",
    trend,
    trendLabel,
    progress,
    onClick,
    className  = "",
}: StatCardProps) {
    return (
        <motion.div
            whileHover={{ y: -3 }}
            whileTap={onClick ? { scale: 0.98 } : undefined}
            onClick={onClick}
            className={[
                "backdrop-blur-2xl bg-white/5 border border-white/10 rounded-3xl p-5 sm:p-6 group transition-all",
                onClick ? "cursor-pointer hover:border-white/20" : "",
                className,
            ].join(" ")}
        >
            {/* Header row */}
            <div className="flex items-start justify-between mb-4">
                <p className="text-xs text-white/40 uppercase tracking-widest font-medium">
                    {label}
                </p>
                {icon && (
                    <span className="text-lg opacity-50 group-hover:opacity-100 transition">
                        {icon}
                    </span>
                )}
            </div>

            {/* Value */}
            <p
                className="text-3xl sm:text-4xl font-bold mb-1 tabular-nums"
                style={{ color }}
            >
                {value}
                {suffix && (
                    <span className="text-lg font-normal text-white/40 ml-1">
                        {suffix}
                    </span>
                )}
            </p>

            {/* Trend line */}
            {trend && trendLabel && (
                <p className={`text-xs mt-1 font-medium ${TREND_COLORS[trend]}`}>
                    {TREND_ICONS[trend]} {trendLabel}
                </p>
            )}

            {/* Progress bar */}
            {progress !== undefined && (
                <div className="mt-4 h-1 bg-white/10 rounded-full overflow-hidden">
                    <motion.div
                        className="h-full rounded-full"
                        style={{ background: color }}
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(Math.max(progress, 0), 100)}%` }}
                        transition={{ duration: 1.2, ease: "easeOut" }}
                    />
                </div>
            )}
        </motion.div>
    );
}