"use client";

// ============================================================
// frontend/app/dashboard/Profile/page.tsx  (FULL REPLACEMENT)
// Goals are now persisted to backend via PUT /api/auth/goals
// with localStorage as a fast-load fallback
// ============================================================

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import type { Variants } from "framer-motion";

type Profile = {
    name: string;
    email: string;
    userId: string;
    avatar?: string | null;
};

type Goals = {
    weightTarget: string;
    weeklySteps: number;
    dailyCalories: number;
    sleepTarget: number;
    fitnessGoal: string;
};

type Notifications = {
    dailyReminder: boolean;
    weeklyReport: boolean;
    recoveryAlerts: boolean;
    goalAchievements: boolean;
};

type ActivityEntry = { action: string; time: string; icon: string };

const DEFAULT_GOALS: Goals = {
    weightTarget: "",
    weeklySteps: 70000,
    dailyCalories: 2200,
    sleepTarget: 8,
    fitnessGoal: "Lose fat",
};

const DEFAULT_NOTIFS: Notifications = {
    dailyReminder: true,
    weeklyReport: true,
    recoveryAlerts: false,
    goalAchievements: true,
};

const FITNESS_GOALS = [
    "Lose fat",
    "Gain muscle",
    "Maintain",
    "Improve endurance",
    "Increase flexibility",
];

const stagger = {
    hidden: {},
    show: { transition: { staggerChildren: 0.08 } },
} satisfies Variants;

const fadeUp = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: "easeOut" } },
} satisfies Variants;

export default function ProfilePage() {
    const { token, logout } = useAuth();
    const base = process.env.NEXT_PUBLIC_API_URL;

    const [profile, setProfile] = useState<Profile | null>(null);
    const [name, setName] = useState("");
    const [password, setPassword] = useState("");
    const [confirm, setConfirm] = useState("");
    const [loading, setLoading] = useState(false);
    const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);
    const [copied, setCopied] = useState(false);

    const [activeTab, setActiveTab] = useState<"account" | "goals" | "notifications" | "activity" | "support">("account");

    const [goals, setGoals] = useState<Goals>(DEFAULT_GOALS);
    const [goalSaved, setGoalSaved] = useState(false);
    const [goalSaving, setGoalSaving] = useState(false);

    const [notifs, setNotifs] = useState<Notifications>(DEFAULT_NOTIFS);
    const [notifSaved, setNotifSaved] = useState(false);

    const [activityLog, setActivityLog] = useState<ActivityEntry[]>([]);

    // ── FEEDBACK STATE ──
    const [fbText, setFbText] = useState("");
    const [fbRating, setFbRating] = useState(5);
    const [fbSubmitting, setFbSubmitting] = useState(false);
    const [fbSuccess, setFbSuccess] = useState(false);

    const TABS = [
        { id: "account", label: "👤 Account" },
        { id: "goals", label: "🎯 Goals" },
        { id: "notifications", label: "🔔 Alerts" },
        { id: "activity", label: "🕐 Activity" },
        { id: "support", label: "💬 Support" },
    ] as const;

    async function submitFeedback() {
        if (!fbText.trim()) return;
        setFbSubmitting(true);
        try {
            const res = await fetch(`${base}/api/feedback/submit`, {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify({ text: fbText, rating: fbRating }),
            });
            if (res.ok) {
                setFbText("");
                setFbRating(5);
                setFbSuccess(true);
                setTimeout(() => setFbSuccess(false), 3000);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setFbSubmitting(false);
        }
    }

    // ── Load profile + goals ──────────────────────────────────

    useEffect(() => {
        if (!token) return;

        // Fast load goals from localStorage while fetching from backend
        try {
            const cached = localStorage.getItem("smartlife-goals");
            if (cached) setGoals(JSON.parse(cached));
            const cachedNotifs = localStorage.getItem("smartlife-notifs");
            if (cachedNotifs) setNotifs(JSON.parse(cachedNotifs));
        } catch { /* ignore */ }

        // Fetch profile
        fetch(`${base}/api/auth/me`, { headers: { Authorization: `Bearer ${token}` } })
            .then((r) => (r.status === 401 ? (logout(), null) : r.json()))
            .then((d) => {
                if (d) {
                    setProfile(d);
                    setName(d.name);
                }
            })
            .catch(console.error);

        // Fetch goals from backend (overrides localStorage)
        fetch(`${base}/api/auth/goals`, { headers: { Authorization: `Bearer ${token}` } })
            .then((r) => r.ok ? r.json() : null)
            .then((g) => {
                if (g && Object.keys(g).length > 0) {
                    const merged = { ...DEFAULT_GOALS, ...g };
                    setGoals(merged);
                    localStorage.setItem("smartlife-goals", JSON.stringify(merged));
                }
            })
            .catch(() => { /* use localStorage fallback */ });

        // Build activity log
        const log: ActivityEntry[] = [
            { action: "Logged in", time: new Date().toLocaleString(), icon: "🔑" },
        ];
        const lastSync = localStorage.getItem("smartlife-last-sync");
        if (lastSync) log.push({ action: "Health data synced", time: lastSync, icon: "📱" });
        const chatCount = (() => {
            try { return JSON.parse(localStorage.getItem("smartlife-chat") || "[]").length; } catch { return 0; }
        })();
        if (chatCount > 0) log.push({ action: `${chatCount} AI coach messages`, time: "This session", icon: "🤖" });
        const pins = (() => {
            try { return JSON.parse(localStorage.getItem("smartlife-pins") || "[]").length; } catch { return 0; }
        })();
        if (pins > 0) log.push({ action: `${pins} location${pins > 1 ? "s" : ""} pinned on globe`, time: "Saved", icon: "📍" });
        setActivityLog(log);
    }, [token]);

    // ── Update profile ────────────────────────────────────────

    async function handleUpdate() {
        if (password && password !== confirm) {
            setMsg({ text: "Passwords don't match.", ok: false });
            return;
        }
        setLoading(true);
        setMsg(null);
        try {
            const res = await fetch(`${base}/api/auth/update`, {
                method: "PUT",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify({ name, password: password || undefined }),
            });
            const data = await res.json();
            setMsg(res.ok
                ? { text: "Profile updated successfully!", ok: true }
                : { text: data.error || "Update failed", ok: false }
            );
            if (res.ok) { setPassword(""); setConfirm(""); }
        } catch {
            setMsg({ text: "Server error.", ok: false });
        }
        setLoading(false);
    }
    // ── Upload avatar ──────────────────────────────────────────

    async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
        if (!e.target.files?.[0]) return;

        const formData = new FormData();
        formData.append("avatar", e.target.files[0]);

        try {
            const res = await fetch(`${base}/api/auth/avatar`, {
                method: "POST",
                headers: { Authorization: `Bearer ${token}` },
                body: formData,
            });

            const data = await res.json();
            if (res.ok) {
                setProfile((p) => p ? { ...p, avatar: data.avatar } : p);
            }
        } catch (err) {
            console.error("Avatar upload failed", err);
        }
    }

    // ── Save goals to backend + localStorage ─────────────────

    async function saveGoals() {
        setGoalSaving(true);
        try {
            if (token) {
                await fetch(`${base}/api/auth/goals`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                    body: JSON.stringify(goals),
                });
            }
            localStorage.setItem("smartlife-goals", JSON.stringify(goals));
            setGoalSaved(true);
            setTimeout(() => setGoalSaved(false), 1800);
        } catch {
            // Still save to localStorage even if backend fails
            localStorage.setItem("smartlife-goals", JSON.stringify(goals));
            setGoalSaved(true);
            setTimeout(() => setGoalSaved(false), 1800);
        } finally {
            setGoalSaving(false);
        }
    }

    function saveNotifs() {
        localStorage.setItem("smartlife-notifs", JSON.stringify(notifs));
        setNotifSaved(true);
        setTimeout(() => setNotifSaved(false), 1800);
    }

    function copyId() {
        if (!profile) return;
        navigator.clipboard.writeText(profile.userId);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    }

    if (!profile)
        return (
            <div className="flex items-center justify-center h-64">
                <motion.div
                    className="w-12 h-12 border-2 border-[#c8ff00] border-t-transparent rounded-full"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
                />
            </div>
        );

    const initials = profile?.name
        ? profile.name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2)
        : "U";


    return (
        <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-7 max-w-3xl mx-auto px-2 sm:px-0">

            {/* Header */}
            <motion.div variants={fadeUp}>
                <p className="text-[#c8ff00] text-xs tracking-widest uppercase mb-2">Account</p>
                <h1 className="text-3xl sm:text-5xl font-bold tracking-tight">Profile</h1>
            </motion.div>

            {/* Avatar hero card */}
            <motion.div variants={fadeUp} className="backdrop-blur-2xl bg-white/5 border border-white/10 rounded-3xl p-5 sm:p-8">
                <div className="flex flex-col sm:flex-row sm:items-center gap-5">
                    <div className="relative">
                        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden bg-[#c8ff00] flex items-center justify-center text-black text-xl sm:text-2xl font-bold select-none">
                            {profile.avatar ? (
                                <img
                                    src={profile.avatar}
                                    alt="Profile"
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                initials
                            )}
                        </div>

                        {/* Upload Button */}
                        <label className="absolute bottom-0 right-0 cursor-pointer text-[10px] bg-black/70 px-2 py-1 rounded-lg text-white/60">
                            Edit
                            <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={handleAvatarUpload}
                            />
                        </label>
                    </div>
                    <div className="flex-1 min-w-0">
                        <h2 className="text-xl sm:text-2xl font-bold truncate">{profile.name}</h2>
                        <p className="text-white/40 text-sm mt-0.5">{profile.email}</p>
                        <div className="flex items-center gap-2 mt-2.5">
                            <span className="text-[10px] px-2.5 py-1 rounded-lg bg-[#c8ff00]/10 border border-[#c8ff00]/20 text-[#c8ff00] font-medium">
                                {goals.fitnessGoal}
                            </span>
                            <span className="text-[10px] px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-white/40">
                                Smart Life Member
                            </span>
                        </div>
                    </div>
                    <motion.button
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={logout}
                        className="px-5 py-2.5 rounded-2xl border border-red-500/25 text-red-400/70 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/40 transition text-sm font-medium self-start sm:self-auto shrink-0"
                    >
                        Sign Out
                    </motion.button>
                </div>
            </motion.div>

            {/* Tabs */}
            <motion.div variants={fadeUp} className="flex flex-wrap gap-1 p-1 bg-white/5 border border-white/10 rounded-2xl w-fit">
                {TABS.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${activeTab === tab.id ? "bg-white/10 text-white" : "text-white/40 hover:text-white/70"}`}
                    >
                        {tab.label}
                    </button>
                ))}
            </motion.div>

            <AnimatePresence mode="wait">

                {/* ── ACCOUNT ── */}
                {activeTab === "account" && (
                    <motion.div key="account" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
                        <div className="backdrop-blur-2xl bg-white/5 border border-white/10 rounded-3xl p-5 sm:p-8 space-y-5">
                            <h3 className="text-xs text-white/40 uppercase tracking-widest">Edit Details</h3>
                            <div>
                                <label className="text-xs text-white/40 uppercase tracking-widest mb-2 block">Display Name</label>
                                <input value={name} onChange={(e) => setName(e.target.value)} className="w-full px-5 py-3 rounded-2xl bg-white/5 border border-white/10 text-white outline-none focus:border-[#c8ff00]/50 transition text-sm" />
                            </div>
                            <div>
                                <label className="text-xs text-white/40 uppercase tracking-widest mb-2 block">Email</label>
                                <input value={profile.email} disabled className="w-full px-5 py-3 rounded-2xl bg-white/3 border border-white/5 text-white/30 text-sm cursor-not-allowed" />
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs text-white/40 uppercase tracking-widest mb-2 block">New Password</label>
                                    <input type="password" placeholder="Leave blank to keep current" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-5 py-3 rounded-2xl bg-white/5 border border-white/10 text-white outline-none focus:border-[#c8ff00]/50 transition text-sm placeholder:text-white/20" />
                                </div>
                                <div>
                                    <label className="text-xs text-white/40 uppercase tracking-widest mb-2 block">Confirm Password</label>
                                    <input type="password" placeholder="Repeat new password" value={confirm} onChange={(e) => setConfirm(e.target.value)} className={`w-full px-5 py-3 rounded-2xl bg-white/5 border text-white outline-none focus:border-[#c8ff00]/50 transition text-sm placeholder:text-white/20 ${confirm && confirm !== password ? "border-red-500/50" : "border-white/10"}`} />
                                </div>
                            </div>
                            {msg && <p className={`text-sm ${msg.ok ? "text-[#c8ff00]" : "text-red-400"}`}>{msg.text}</p>}
                            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} onClick={handleUpdate} disabled={loading} className="bg-[#c8ff00] text-black px-8 py-3 rounded-2xl font-bold text-sm disabled:opacity-50">
                                {loading ? "Saving..." : "Save Changes"}
                            </motion.button>
                        </div>

                        {/* Shortcut ID */}
                        <div className="backdrop-blur-2xl bg-white/3 border border-white/8 rounded-3xl p-5 sm:p-8">
                            <h3 className="text-sm font-semibold text-white/60 mb-1">Apple Shortcut User ID</h3>
                            <p className="text-white/30 text-sm mb-4">Use this ID in your Apple Shortcut to sync health data.</p>
                            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                                <code className="flex-1 px-4 py-3 rounded-xl bg-black/40 border border-white/10 text-[#c8ff00] text-sm font-mono break-all">{profile.userId}</code>
                                <button onClick={copyId} className="px-4 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition text-sm whitespace-nowrap">
                                    {copied ? "✓ Copied" : "Copy"}
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* ── GOALS ── */}
                {activeTab === "goals" && (
                    <motion.div key="goals" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                        <div className="backdrop-blur-2xl bg-white/5 border border-white/10 rounded-3xl p-5 sm:p-8 space-y-6">
                            <div>
                                <h3 className="text-base font-bold mb-1">Goal Settings</h3>
                                <p className="text-white/40 text-sm">These are synced to your account and used by the AI Coach.</p>
                            </div>

                            <div>
                                <label className="text-xs text-white/40 uppercase tracking-widest mb-3 block">Primary Fitness Goal</label>
                                <div className="flex flex-wrap gap-2">
                                    {FITNESS_GOALS.map((g) => (
                                        <button
                                            key={g}
                                            onClick={() => setGoals((p) => ({ ...p, fitnessGoal: g }))}
                                            className={`px-4 py-2 rounded-xl text-sm font-medium border transition ${goals.fitnessGoal === g ? "bg-[#c8ff00] text-black border-[#c8ff00]" : "bg-white/5 border-white/10 text-white/50 hover:text-white hover:border-white/25"}`}
                                        >
                                            {g}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                {[
                                    { key: "weeklySteps", label: "Weekly Steps Target", unit: "steps", min: 10000, max: 200000, step: 5000 },
                                    { key: "dailyCalories", label: "Daily Calorie Target", unit: "kcal", min: 1200, max: 5000, step: 100 },
                                    { key: "sleepTarget", label: "Sleep Target", unit: "hrs", min: 5, max: 12, step: 0.5 },
                                    { key: "weightTarget", label: "Weight Target (optional)", unit: "kg", min: 0, max: 300, step: 0.5 },
                                ].map((field) => (
                                    <div key={field.key}>
                                        <div className="flex items-center justify-between mb-2">
                                            <label className="text-xs text-white/40 uppercase tracking-widest">{field.label}</label>
                                            <span className="text-xs text-white/25">{field.unit}</span>
                                        </div>
                                        <input
                                            type="number"
                                            value={goals[field.key as keyof Goals]}
                                            onChange={(e) => setGoals((p) => ({ ...p, [field.key]: field.key === "weightTarget" ? e.target.value : Number(e.target.value) }))}
                                            min={field.min} max={field.max} step={field.step}
                                            className="w-full px-5 py-3 rounded-2xl bg-white/5 border border-white/10 text-white outline-none focus:border-[#c8ff00]/50 transition text-sm"
                                        />
                                    </div>
                                ))}
                            </div>

                            <div className="space-y-3 pt-2 border-t border-white/8">
                                <p className="text-xs text-white/30 uppercase tracking-widest">Summary</p>
                                {[
                                    { label: "Steps / week", value: Number(goals.weeklySteps).toLocaleString(), color: "#c8ff00" },
                                    { label: "Calories / day", value: `${Number(goals.dailyCalories).toLocaleString()} kcal`, color: "#FF8C00" },
                                    { label: "Sleep / night", value: `${goals.sleepTarget} hrs`, color: "#00BFFF" },
                                ].map((item) => (
                                    <div key={item.label} className="flex items-center justify-between text-sm">
                                        <span className="text-white/40">{item.label}</span>
                                        <span className="font-bold font-mono" style={{ color: item.color }}>{item.value}</span>
                                    </div>
                                ))}
                            </div>

                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.97 }}
                                onClick={saveGoals}
                                disabled={goalSaving}
                                className="bg-[#c8ff00] text-black px-8 py-3 rounded-2xl font-bold text-sm disabled:opacity-60"
                            >
                                {goalSaving ? "Saving..." : goalSaved ? "✓ Goals Saved!" : "Save Goals"}
                            </motion.button>
                        </div>
                    </motion.div>
                )}

                {/* ── NOTIFICATIONS ── */}
                {activeTab === "notifications" && (
                    <motion.div key="notifications" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                        <div className="backdrop-blur-2xl bg-white/5 border border-white/10 rounded-3xl p-5 sm:p-8 space-y-6">
                            <div>
                                <h3 className="text-base font-bold mb-1">Notification Preferences</h3>
                                <p className="text-white/40 text-sm">Choose what alerts Smart Life surfaces.</p>
                            </div>
                            <div className="space-y-1">
                                {([
                                    { key: "dailyReminder", label: "Daily Training Reminder", desc: "A nudge each morning to log activity", icon: "⏰" },
                                    { key: "weeklyReport", label: "Weekly Progress Report", desc: "Summary of your week every Sunday", icon: "📊" },
                                    { key: "recoveryAlerts", label: "Recovery Alerts", desc: "Notified when recovery score drops below 60", icon: "😴" },
                                    { key: "goalAchievements", label: "Goal Achievements", desc: "Celebrate when you hit daily/weekly targets", icon: "🏆" },
                                ] as const).map((item, i) => (
                                    <motion.div
                                        key={item.key}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: i * 0.06 }}
                                        className="flex items-center justify-between gap-4 py-4 border-b border-white/5 last:border-0"
                                    >
                                        <div className="flex items-start gap-3">
                                            <span className="text-xl mt-0.5">{item.icon}</span>
                                            <div>
                                                <p className="text-sm font-medium text-white/80">{item.label}</p>
                                                <p className="text-xs text-white/30 mt-0.5">{item.desc}</p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => setNotifs((p) => ({ ...p, [item.key]: !p[item.key] }))}
                                            className={`relative w-11 h-6 rounded-full transition-colors shrink-0 ${notifs[item.key] ? "bg-[#c8ff00]" : "bg-white/10"}`}
                                        >
                                            <motion.div
                                                className="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm"
                                                animate={{ left: notifs[item.key] ? "calc(100% - 22px)" : "2px" }}
                                                transition={{ type: "spring", stiffness: 500, damping: 30 }}
                                            />
                                        </button>
                                    </motion.div>
                                ))}
                            </div>
                            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} onClick={saveNotifs} className="bg-[#c8ff00] text-black px-8 py-3 rounded-2xl font-bold text-sm">
                                {notifSaved ? "✓ Preferences Saved!" : "Save Preferences"}
                            </motion.button>
                        </div>
                    </motion.div>
                )}

                {/* ── ACTIVITY ── */}
                {activeTab === "activity" && (
                    <motion.div key="activity" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                        <div className="backdrop-blur-2xl bg-white/5 border border-white/10 rounded-3xl p-5 sm:p-8 space-y-5">
                            <div>
                                <h3 className="text-base font-bold mb-1">Account Activity</h3>
                                <p className="text-white/40 text-sm">Recent actions and data summary.</p>
                            </div>
                            {activityLog.length === 0 ? (
                                <div className="text-center py-12 text-white/30">
                                    <p className="text-3xl mb-3">🕐</p>
                                    <p className="text-sm">No activity recorded yet.</p>
                                </div>
                            ) : (
                                <div className="space-y-0 divide-y divide-white/5">
                                    {activityLog.map((entry, i) => (
                                        <motion.div
                                            key={i}
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: i * 0.07 }}
                                            className="flex items-center gap-4 py-4"
                                        >
                                            <div className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-base shrink-0">{entry.icon}</div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-white/80 truncate">{entry.action}</p>
                                                <p className="text-xs text-white/25 mt-0.5">{entry.time}</p>
                                            </div>
                                            <div className="w-2 h-2 rounded-full bg-[#c8ff00]/40 shrink-0" />
                                        </motion.div>
                                    ))}
                                </div>
                            )}
                            <div className="pt-4 border-t border-white/8 grid grid-cols-2 sm:grid-cols-4 gap-3">
                                {[
                                    { label: "Chat Messages", value: (() => { try { return JSON.parse(localStorage.getItem("smartlife-chat") || "[]").length; } catch { return 0; } })(), icon: "💬" },
                                    { label: "Pinned Cities", value: (() => { try { return JSON.parse(localStorage.getItem("smartlife-pins") || "[]").length; } catch { return 0; } })(), icon: "📍" },
                                    { label: "Journal Entries", value: (() => { try { return JSON.parse(localStorage.getItem("smartlife-symptoms") || "[]").length; } catch { return 0; } })(), icon: "🩺" },
                                    { label: "Goals Synced", value: 1, icon: "🎯" },
                                ].map((stat) => (
                                    <div key={stat.label} className="bg-white/4 border border-white/8 rounded-2xl p-3.5">
                                        <span className="text-lg">{stat.icon}</span>
                                        <p className="text-xl font-bold text-[#c8ff00] mt-1.5">{stat.value}</p>
                                        <p className="text-[10px] text-white/30 uppercase tracking-widest mt-0.5">{stat.label}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* ── SUPPORT ── */}
                {activeTab === "support" && (
                    <motion.div key="support" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                        <div className="backdrop-blur-2xl bg-white/5 border border-white/10 rounded-3xl p-5 sm:p-8 space-y-6">
                            <div>
                                <h3 className="text-base font-bold mb-1">Give Feedback</h3>
                                <p className="text-white/40 text-sm">We'd love to hear how Smart Life is helping you.</p>
                            </div>

                            <div>
                                <label className="text-xs text-white/40 uppercase tracking-widest mb-3 block">Rating</label>
                                <div className="flex gap-2 text-2xl">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <button
                                            key={star}
                                            onClick={() => setFbRating(star)}
                                            className={`transition-transform hover:scale-125 ${fbRating >= star ? "text-[#c8ff00]" : "text-white/10"}`}
                                        >
                                            ★
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="text-xs text-white/40 uppercase tracking-widest mb-2 block">Your Comments</label>
                                <textarea
                                    value={fbText}
                                    onChange={(e) => setFbText(e.target.value)}
                                    placeholder="Tell us what you think..."
                                    className="w-full h-32 bg-white/5 border border-white/10 rounded-2xl p-4 text-sm text-white outline-none focus:border-[#c8ff00]/50 transition placeholder:text-white/10"
                                />
                            </div>

                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.97 }}
                                onClick={submitFeedback}
                                disabled={fbSubmitting || !fbText.trim()}
                                className="bg-[#c8ff00] text-black px-8 py-3 rounded-2xl font-bold text-sm disabled:opacity-50"
                            >
                                {fbSubmitting ? "Sending..." : fbSuccess ? "✓ Feedback Sent!" : "Submit Feedback"}
                            </motion.button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}