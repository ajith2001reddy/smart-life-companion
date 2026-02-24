"use client";

// frontend/app/dashboard/layout.tsx  (UPDATED)
// Added: Workout nav item, ErrorBoundary wrapping

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { useAuth } from "@/context/AuthContext";
import { motion } from "framer-motion";
import ErrorBoundary from "@/components/ErrorBoundary";

const GlobalWeatherBackground = dynamic(
    () => import("@/components/GlobalWeatherBackground"),
    { ssr: false }
);

interface DashboardLayoutProps {
    children: ReactNode;
}

const navItems = [
    { name: "Dashboard", href: "/dashboard", icon: "⚡" },
    { name: "Earth", href: "/dashboard/Earth", icon: "🌍" },
    { name: "Plan", href: "/dashboard/plan", icon: "📋" },
    { name: "Workout", href: "/dashboard/workout", icon: "🏋️" },
    { name: "Coach", href: "/dashboard/coach", icon: "🤖" },
    { name: "Analytics", href: "/dashboard/analytics", icon: "📊" },
    { name: "Nutrition", href: "/dashboard/nutrition", icon: "🥗" },
    { name: "Health", href: "/dashboard/health", icon: "❤️" },
    { name: "Profile", href: "/dashboard/Profile", icon: "👤" },
];

const pageTitles: Record<string, string> = {
    "/dashboard": "Dashboard",
    "/dashboard/earth": "Earth Globe",
    "/dashboard/plan": "Training Plan",
    "/dashboard/workout": "Workout Log",
    "/dashboard/coach": "AI Coach",
    "/dashboard/analytics": "Analytics",
    "/dashboard/nutrition": "Nutrition",
    "/dashboard/health": "Health",
    "/dashboard/profile": "Profile",
};

export default function DashboardLayout({ children }: DashboardLayoutProps) {
    const pathname = usePathname();
    const router = useRouter();
    const { token, loading, logout, user } = useAuth();

    const [userName, setUserName] = useState<string>("User");
    const [time, setTime] = useState(new Date());
    const [mobileOpen, setMobileOpen] = useState(false);

    const normalizedPath = pathname?.toLowerCase() ?? "";

    useEffect(() => {
        const t = setInterval(() => setTime(new Date()), 1000);
        return () => clearInterval(t);
    }, []);

    useEffect(() => {
        if (user?.name) { setUserName(user.name); return; }
        const storedToken = token || localStorage.getItem("token");
        if (!storedToken) return;
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/me`, {
            headers: { Authorization: `Bearer ${storedToken}` },
        })
            .then((r) => (r.ok ? r.json() : null))
            .then((d) => { if (d?.name) setUserName(d.name); })
            .catch(() => { });
    }, [token, user]);

    useEffect(() => {
        if (!loading && !token) router.replace("/login");
    }, [loading, token, router]);

    const weatherType = useMemo(() => {
        if (normalizedPath === "/dashboard") return "clear";
        if (normalizedPath.includes("/earth")) return "night";
        if (normalizedPath.includes("/plan")) return "rain";
        if (normalizedPath.includes("/workout")) return "clouds";
        if (normalizedPath.includes("/profile")) return "fog";
        if (normalizedPath.includes("/coach")) return "clouds";
        if (normalizedPath.includes("/analytics")) return "clear";
        if (normalizedPath.includes("/nutrition")) return "clouds";
        if (normalizedPath.includes("/health")) return "clear";
        return "clouds";
    }, [normalizedPath]);

    const pageTitle = pageTitles[normalizedPath] ?? "Smart Life";

    const initials = userName
        .split(" ")
        .map((w) => w[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);

    const isFullScreenPage = normalizedPath.includes("/earth");

    if (loading || !token) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-black text-white">
                <motion.div
                    className="w-10 h-10 border-2 border-[#c8ff00] border-t-transparent rounded-full"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
                />
            </div>
        );
    }

    return (
        <div className="relative min-h-screen text-white overflow-hidden">
            <GlobalWeatherBackground type={weatherType} />

            <div className="relative z-10 flex min-h-screen">

                {/* Mobile overlay */}
                {mobileOpen && (
                    <div
                        onClick={() => setMobileOpen(false)}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
                    />
                )}

                {/* Sidebar */}
                <aside
                    className={`
                        fixed md:relative z-50 md:z-auto
                        w-20 h-full md:h-auto min-h-screen
                        bg-black/40 backdrop-blur-xl border-r border-white/10
                        flex flex-col items-center py-6 gap-2
                        transition-transform duration-300
                        ${mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
                    `}
                >
                    <motion.div
                        whileHover={{ scale: 1.08 }}
                        className="w-11 h-11 bg-[#c8ff00] rounded-xl flex items-center justify-center mb-6 text-black font-black text-sm"
                    >
                        SL
                    </motion.div>

                    <nav className="flex flex-col gap-1.5 flex-1 w-full px-2 overflow-y-auto">
                        {navItems.map((item) => {
                            const active =
                                normalizedPath === item.href.toLowerCase() ||
                                (item.href !== "/dashboard" &&
                                    normalizedPath.startsWith(item.href.toLowerCase()));

                            return (
                                <Link key={item.href} href={item.href}>
                                    <motion.div
                                        whileHover={{ scale: 1.08 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={() => setMobileOpen(false)}
                                        title={item.name}
                                        className={[
                                            "w-full h-12 rounded-xl flex flex-col items-center justify-center gap-0.5 transition-all cursor-pointer",
                                            active
                                                ? "bg-[#c8ff00] text-black shadow-lg shadow-[#c8ff00]/20"
                                                : "text-white/40 hover:text-white hover:bg-white/10",
                                        ].join(" ")}
                                    >
                                        <span className="text-base leading-none">{item.icon}</span>
                                        <span className="text-[9px] font-medium leading-none tracking-wide">
                                            {item.name.slice(0, 4)}
                                        </span>
                                    </motion.div>
                                </Link>
                            );
                        })}
                    </nav>

                    <motion.button
                        whileHover={{ scale: 1.08 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={logout}
                        title="Logout"
                        className="w-12 h-12 rounded-xl flex items-center justify-center text-white/20 hover:text-red-400 hover:bg-red-400/10 transition-all text-lg"
                    >
                        ⏻
                    </motion.button>
                </aside>

                {/* Main area */}
                <div className="flex-1 flex flex-col min-w-0">

                    {/* Topbar */}
                    <header className="h-14 border-b border-white/10 flex items-center justify-between px-4 md:px-8 bg-black/20 backdrop-blur-md shrink-0">
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => setMobileOpen(true)}
                                className="md:hidden text-xl text-white/70"
                            >
                                ☰
                            </button>
                            <span className="text-xs font-bold tracking-[0.25em] text-white/20 uppercase">Smart Life</span>
                            <span className="text-white/15">/</span>
                            <motion.span
                                key={pageTitle}
                                initial={{ opacity: 0, y: -4 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="text-sm font-semibold text-white"
                            >
                                {pageTitle}
                            </motion.span>
                        </div>

                        <div className="flex items-center gap-5">
                            <div className="text-right hidden sm:block">
                                <div className="text-xs font-mono text-white/50">
                                    {time.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                                </div>
                                <div className="text-[10px] text-white/25">
                                    {time.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
                                </div>
                            </div>
                            <Link href="/dashboard/Profile">
                                <motion.div whileHover={{ scale: 1.05 }} className="flex items-center gap-2.5 cursor-pointer">
                                    <div className="w-8 h-8 rounded-xl bg-[#c8ff00] flex items-center justify-center text-black text-xs font-bold">
                                        {initials}
                                    </div>
                                    <span className="text-sm text-white/60 hidden md:block">{userName}</span>
                                </motion.div>
                            </Link>
                        </div>
                    </header>

                    {/* Page content */}
                    <main
                        className={[
                            "flex-1 overflow-auto",
                            isFullScreenPage ? "p-0 overflow-hidden" : "p-4 sm:p-6 md:p-8",
                        ].join(" ")}
                    >
                        <ErrorBoundary>
                            {children}
                        </ErrorBoundary>
                    </main>
                </div>
            </div>
        </div>
    );
}