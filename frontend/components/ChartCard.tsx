"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";

interface ChartCardProps {
    title: string;
    subtitle?: string;
    children: ReactNode;
    action?: ReactNode;   // optional top-right button/badge
    height?: number;      // chart area height px (default 200)
    className?: string;
    loading?: boolean;
    empty?: boolean;
    emptyLabel?: string;
}

export default function ChartCard({
    title,
    subtitle,
    children,
    action,
    height = 200,
    className = "",
    loading = false,
    empty = false,
    emptyLabel = "No data yet",
}: ChartCardProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className={[
                "backdrop-blur-2xl bg-white/5 border border-white/10 rounded-3xl p-5 sm:p-7",
                className,
            ].join(" ")}
        >
            {/* Header */}
            <div className="flex items-start justify-between mb-5">
                <div>
                    <p className="text-xs text-white/40 uppercase tracking-widest font-medium">
                        {title}
                    </p>
                    {subtitle && (
                        <p className="text-[11px] text-white/25 mt-0.5">{subtitle}</p>
                    )}
                </div>
                {action && <div className="shrink-0">{action}</div>}
            </div>

            {/* Content area */}
            <div style={{ minHeight: height }} className="relative flex items-center justify-center">
                {loading ? (
                    <div className="flex flex-col gap-3 w-full">
                        <div className="h-4 bg-white/5 rounded-full w-3/4 animate-pulse" />
                        <div className="h-4 bg-white/5 rounded-full w-1/2 animate-pulse" />
                        <div className="h-4 bg-white/5 rounded-full w-2/3 animate-pulse" />
                        <div className="h-4 bg-white/5 rounded-full w-1/3 animate-pulse" />
                    </div>
                ) : empty ? (
                    <div className="text-center py-8">
                        <p className="text-3xl mb-3">📊</p>
                        <p className="text-sm text-white/30">{emptyLabel}</p>
                    </div>
                ) : (
                    <div className="w-full">{children}</div>
                )}
            </div>
        </motion.div>
    );
}