"use client";

import { motion } from "framer-motion";
import type { ReactNode, CSSProperties } from "react";

// ── Types ────────────────────────────────────────────────────

export type BentoSpan = 1 | 2 | 3 | 4;

export interface BentoItem {
    id: string;
    children: ReactNode;
    colSpan?: BentoSpan;   // default 1
    rowSpan?: BentoSpan;   // default 1
    className?: string;
    style?: CSSProperties;
    onClick?: () => void;
}

interface BentoGridProps {
    items: BentoItem[];
    cols?: 2 | 3 | 4;   // grid columns on desktop (default 4)
    gap?: number;       // gap in px (default 16)
    className?: string;
    stagger?: boolean;      // animate items in sequence (default true)
}

// ── Column span class maps ───────────────────────────────────
const COL_SPAN: Record<BentoSpan, string> = {
    1: "col-span-1",
    2: "col-span-2",
    3: "col-span-3",
    4: "col-span-4",
};

const ROW_SPAN: Record<BentoSpan, string> = {
    1: "row-span-1",
    2: "row-span-2",
    3: "row-span-3",
    4: "row-span-4",
};

const GRID_COLS: Record<2 | 3 | 4, string> = {
    2: "grid-cols-2",
    3: "grid-cols-3",
    4: "grid-cols-4",
};

// ── Component ────────────────────────────────────────────────

export default function BentoGrid({
    items,
    cols = 4,
    gap = 16,
    className = "",
    stagger = true,
}: BentoGridProps) {
    return (
        <div
            className={`grid ${GRID_COLS[cols]} ${className}`}
            style={{ gap }}
        >
            {items.map((item, index) => (
                <motion.div
                    key={item.id}
                    initial={stagger ? { opacity: 0, y: 16 } : false}
                    animate={stagger ? { opacity: 1, y: 0 } : undefined}
                    transition={stagger ? { duration: 0.45, delay: index * 0.07, ease: "easeOut" } : undefined}
                    whileHover={item.onClick ? { y: -3 } : undefined}
                    whileTap={item.onClick ? { scale: 0.98 } : undefined}
                    onClick={item.onClick}
                    className={[
                        COL_SPAN[item.colSpan ?? 1],
                        ROW_SPAN[item.rowSpan ?? 1],
                        "backdrop-blur-2xl bg-white/5 border border-white/10 rounded-3xl p-5 sm:p-6 transition-all",
                        item.onClick ? "cursor-pointer hover:border-white/20" : "",
                        item.className ?? "",
                    ].join(" ")}
                    style={item.style}
                >
                    {item.children}
                </motion.div>
            ))}
        </div>
    );
}

// ── Convenience sub-components ───────────────────────────────

/** Small label row typically at top of a bento cell */
export function BentoLabel({ children }: { children: ReactNode }) {
    return (
        <p className="text-xs text-white/40 uppercase tracking-widest font-medium mb-4">
            {children}
        </p>
    );
}