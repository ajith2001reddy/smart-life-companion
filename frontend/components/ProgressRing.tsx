"use client";

import { motion } from "framer-motion";

interface ProgressRingProps {
    value: number;   // 0–100
    size?: number;   // px diameter (default 120)
    stroke?: number;   // stroke width (default 8)
    color?: string;   // hex (default #c8ff00)
    bgColor?: string;   // track color
    label?: string;   // text inside ring (defaults to value%)
    subLabel?: string;   // smaller text below main label
    glow?: boolean;  // enables drop-shadow filter
    animate?: boolean;  // animate on mount (default true)
    className?: string;
}

export default function ProgressRing({
    value,
    size = 120,
    stroke = 8,
    color = "#c8ff00",
    bgColor = "rgba(255,255,255,0.08)",
    label,
    subLabel,
    glow = true,
    animate = true,
    className = "",
}: ProgressRingProps) {
    const clamped = Math.min(Math.max(value, 0), 100);
    const radius = (size - stroke) / 2;
    const circumference = 2 * Math.PI * radius;
    const dashOffset = circumference - (clamped / 100) * circumference;
    const center = size / 2;

    const displayLabel = label ?? `${Math.round(clamped)}%`;

    return (
        <div className={`flex items-center justify-center ${className}`}>
            <div className="relative" style={{ width: size, height: size }}>
                <svg
                    width={size}
                    height={size}
                    viewBox={`0 0 ${size} ${size}`}
                    style={{ transform: "rotate(-90deg)" }}
                >
                    {/* Track */}
                    <circle
                        cx={center}
                        cy={center}
                        r={radius}
                        fill="none"
                        stroke={bgColor}
                        strokeWidth={stroke}
                    />

                    {/* Progress arc — animated via Framer Motion */}
                    <motion.circle
                        cx={center}
                        cy={center}
                        r={radius}
                        fill="none"
                        stroke={color}
                        strokeWidth={stroke}
                        strokeLinecap="round"
                        strokeDasharray={circumference}
                        initial={{ strokeDashoffset: circumference }}
                        animate={{ strokeDashoffset: animate ? dashOffset : dashOffset }}
                        transition={
                            animate
                                ? { duration: 1.4, ease: "easeOut" }
                                : { duration: 0 }
                        }
                        style={{
                            filter: glow
                                ? `drop-shadow(0 0 6px ${color}88)`
                                : undefined,
                        }}
                    />
                </svg>

                {/* Center text */}
                <div
                    className="absolute inset-0 flex flex-col items-center justify-center"
                    style={{ transform: "rotate(0deg)" }}
                >
                    <span
                        className="font-bold tabular-nums leading-none"
                        style={{
                            fontSize: size * 0.22,
                            color,
                        }}
                    >
                        {displayLabel}
                    </span>
                    {subLabel && (
                        <span
                            className="text-white/30 uppercase tracking-wider leading-none mt-1"
                            style={{ fontSize: size * 0.09 }}
                        >
                            {subLabel}
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
}