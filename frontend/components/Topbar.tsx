"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import type { ReactNode } from "react";

interface TopbarProps {
    title: string;
    initials?: string;
    userName?: string;
    right?: ReactNode;       // optional right-side slot
    onMenuClick?: () => void;     // mobile hamburger callback
    className?: string;
}

export default function Topbar({
    title,
    initials = "U",
    userName = "User",
    right,
    onMenuClick,
    className = "",
}: TopbarProps) {
    const [time, setTime] = useState(new Date());

    useEffect(() => {
        const t = setInterval(() => setTime(new Date()), 1000);
        return () => clearInterval(t);
    }, []);

    return (
        <header
            className={[
                "h-14 border-b border-white/10 flex items-center justify-between px-4 md:px-8",
                "bg-black/20 backdrop-blur-md shrink-0",
                className,
            ].join(" ")}
        >
            {/* Left: breadcrumb */}
            <div className="flex items-center gap-3">
                {onMenuClick && (
                    <button
                        onClick={onMenuClick}
                        className="md:hidden text-xl text-white/70"
                    >
                        ☰
                    </button>
                )}

                <span className="text-xs font-bold tracking-[0.25em] text-white/20 uppercase">
                    Smart Life
                </span>
                <span className="text-white/15">/</span>

                <motion.span
                    key={title}
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-sm font-semibold text-white"
                >
                    {title}
                </motion.span>
            </div>

            {/* Right: clock + avatar + optional slot */}
            <div className="flex items-center gap-5">
                {right && <div className="flex items-center gap-3">{right}</div>}

                <div className="text-right hidden sm:block">
                    <div className="text-xs font-mono text-white/50">
                        {time.toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                            second: "2-digit",
                        })}
                    </div>
                    <div className="text-[10px] text-white/25">
                        {time.toLocaleDateString("en-US", {
                            weekday: "short",
                            month: "short",
                            day: "numeric",
                        })}
                    </div>
                </div>

                <Link href="/dashboard/Profile">
                    <motion.div
                        whileHover={{ scale: 1.05 }}
                        className="flex items-center gap-2.5 cursor-pointer"
                    >
                        <div className="w-8 h-8 rounded-xl bg-[#c8ff00] flex items-center justify-center text-black text-xs font-bold">
                            {initials}
                        </div>
                        <span className="text-sm text-white/60 hidden md:block">{userName}</span>
                    </motion.div>
                </Link>
            </div>
        </header>
    );
}