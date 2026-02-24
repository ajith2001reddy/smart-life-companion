"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { useAuth } from "@/context/AuthContext";

export interface NavItem {
    name: string;
    href: string;
    icon: string;
}

interface SidebarProps {
    items: NavItem[];
    mobileOpen?: boolean;
    onClose?: () => void;
}

export default function Sidebar({ items, mobileOpen = false, onClose }: SidebarProps) {
    const pathname = usePathname();
    const { logout } = useAuth();

    const normalizedPath = pathname?.toLowerCase() ?? "";

    return (
        <>
            {/* Mobile overlay */}
            {mobileOpen && (
                <div
                    onClick={onClose}
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
                />
            )}

            <aside
                className={[
                    "fixed md:relative z-50 md:z-auto",
                    "w-20 h-full md:h-auto min-h-screen",
                    "bg-black/40 backdrop-blur-xl border-r border-white/10",
                    "flex flex-col items-center py-6 gap-2",
                    "transition-transform duration-300",
                    mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
                ].join(" ")}
            >
                {/* Logo mark */}
                <motion.div
                    whileHover={{ scale: 1.08 }}
                    className="w-11 h-11 bg-[#c8ff00] rounded-xl flex items-center justify-center mb-6 text-black font-black text-sm select-none"
                >
                    SL
                </motion.div>

                {/* Nav items */}
                <nav className="flex flex-col gap-1.5 flex-1 w-full px-2">
                    {items.map((item) => {
                        const active =
                            normalizedPath === item.href.toLowerCase() ||
                            (item.href !== "/dashboard" &&
                                normalizedPath.startsWith(item.href.toLowerCase()));

                        return (
                            <Link key={item.href} href={item.href}>
                                <motion.div
                                    whileHover={{ scale: 1.08 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={onClose}
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
                                        {item.name.slice(0, 3)}
                                    </span>
                                </motion.div>
                            </Link>
                        );
                    })}
                </nav>

                {/* Logout */}
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
        </>
    );
}