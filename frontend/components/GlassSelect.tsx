"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

type Option = {
    label: string;
    value: string | number;
};

type Props = {
    label: string;
    options: Option[];
    value: string | number;
    onChange: (value: any) => void;
};

export default function GlassSelect({
    label,
    options,
    value,
    onChange,
}: Props) {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    // Close on outside click
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (ref.current && !ref.current.contains(event.target as Node)) {
                setOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const selected = options.find((opt) => opt.value === value);

    return (
        <div
            ref={ref}
            className="relative backdrop-blur-2xl bg-black/40 border border-white/20 rounded-3xl p-6"
        >
            <div className="text-xs text-white/60 uppercase mb-4 tracking-wide">
                {label}
            </div>

            {/* Selected */}
            <button
                onClick={() => setOpen(!open)}
                className="w-full text-left text-white flex justify-between items-center"
            >
                <span>{selected?.label}</span>
                <span className="text-white/60">▾</span>
            </button>

            {/* Dropdown */}
            <AnimatePresence>
                {open && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                        className="absolute left-0 right-0 mt-4 bg-black/80 backdrop-blur-xl border border-white/20 rounded-2xl overflow-hidden z-50"
                    >
                        {options.map((option) => (
                            <div
                                key={option.value}
                                onClick={() => {
                                    onChange(option.value);
                                    setOpen(false);
                                }}
                                className="px-6 py-3 text-white hover:bg-white/10 cursor-pointer transition"
                            >
                                {option.label}
                            </div>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
