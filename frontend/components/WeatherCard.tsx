"use client";

import { motion, AnimatePresence } from "framer-motion";

type Props = {
    city: string;
    temperature: number;
    condition: string;
};

export default function WeatherCard({
    city,
    temperature,
    condition,
}: Props) {
    const lower = condition.toLowerCase();

    /* ---------------- VIDEO SELECTOR ---------------- */

    const getVideo = () => {
        if (lower.includes("thunder") || lower.includes("storm"))
            return "/weather/storm.mp4";
        if (lower.includes("rain"))
            return "/weather/rain.mp4";
        if (lower.includes("snow"))
            return "/weather/snow.mp4";
        if (lower.includes("clear"))
            return "/weather/sunny.mp4";
        if (lower.includes("cloud"))
            return "/weather/cloudy.mp4";
        return "/weather/night.mp4";
    };

    /* ---------------- SKY COLOR MOOD ---------------- */

    const getOverlay = () => {
        if (lower.includes("storm"))
            return "from-black/80 via-black/70 to-black/90";
        if (lower.includes("rain"))
            return "from-slate-900/70 via-slate-800/60 to-slate-900/80";
        if (lower.includes("snow"))
            return "from-blue-900/50 via-blue-800/40 to-black/60";
        if (lower.includes("clear"))
            return "from-blue-900/40 via-transparent to-black/50";
        if (lower.includes("cloud"))
            return "from-gray-900/60 via-gray-800/50 to-black/70";
        return "from-black/60 via-black/50 to-black/80";
    };

    /* ---------------- TEMP COLOR ---------------- */

    const tempColor =
        temperature >= 30
            ? "text-orange-400"
            : temperature <= 0
                ? "text-blue-300"
                : "text-white";

    const videoSrc = getVideo();

    return (
        <div className="relative overflow-hidden rounded-3xl border border-white/10 h-full">

            {/* VIDEO BACKGROUND */}
            <AnimatePresence mode="wait">
                <motion.video
                    key={videoSrc}
                    autoPlay
                    muted
                    loop
                    playsInline
                    preload="auto"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 1 }}
                    className="absolute inset-0 w-full h-full object-cover scale-110"
                    style={{
                        filter: "contrast(1.05) saturate(1.1)",
                    }}
                >
                    <source src={videoSrc} type="video/mp4" />
                </motion.video>
            </AnimatePresence>

            {/* STORM LIGHTNING FLASH */}
            {lower.includes("storm") && (
                <motion.div
                    className="absolute inset-0 bg-white"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: [0, 0.7, 0] }}
                    transition={{
                        duration: 0.3,
                        repeat: Infinity,
                        repeatDelay: 6,
                    }}
                />
            )}

            {/* GRADIENT OVERLAY */}
            <div
                className={`absolute inset-0 bg-gradient-to-b ${getOverlay()}`}
            />

            {/* CONTENT */}
            <div className="relative z-10 p-7 h-full flex flex-col justify-between text-white">

                <div>
                    <p className="text-xs uppercase tracking-widest text-white/70 mb-4">
                        Current Weather
                    </p>

                    <h2
                        className={`text-5xl font-bold mb-2 tracking-tight ${tempColor}`}
                    >
                        {temperature}°
                    </h2>

                    <p className="text-white/80 text-lg capitalize">
                        {condition}
                    </p>
                </div>

                <div className="text-sm text-white/70">
                    {city}
                </div>

            </div>
        </div>
    );
}