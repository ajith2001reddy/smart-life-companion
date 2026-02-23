"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

type Message = {
    role: "user" | "assistant";
    content: string;
    timestamp?: Date;
};

// Extended quick prompts organized by category
const QUICK_PROMPTS = {
    "Training": [
        "How should I train today?",
        "Am I overtraining?",
        "Best workout for fat loss?",
    ],
    "Recovery": [
        "Optimize my recovery",
        "How much rest do I need?",
        "Cold vs hot therapy?",
    ],
    "Nutrition": [
        "Best pre-workout meal?",
        "How much protein do I need?",
        "Should I fast today?",
    ],
};

const INITIAL_MSG: Message = {
    role: "assistant",
    content: "Hey! I'm your Smart Life AI Coach. I have access to your health data and I'm here to give you personalized advice. What's on your mind?",
    timestamp: new Date(),
};

function formatTime(date?: Date) {
    if (!date) return "";
    return new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit", hour12: true }).format(date);
}

export default function CoachPage() {
    const [messages, setMessages] = useState<Message[]>([INITIAL_MSG]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const [activeCategory, setActiveCategory] = useState<string>("Training");
    const [showPrompts, setShowPrompts] = useState(true);
    const [showTimestamps, setShowTimestamps] = useState(false);
    const bottomRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const chatRef = useRef<HTMLDivElement>(null);

    // Load saved messages
    useEffect(() => {
        const saved = localStorage.getItem("smartlife-chat");
        if (saved) {
            const parsed = JSON.parse(saved);
            // Restore timestamps as Date objects
            const withDates = parsed.map((m: any) => ({
                ...m,
                timestamp: m.timestamp ? new Date(m.timestamp) : undefined,
            }));
            setMessages(withDates);
            setShowPrompts(false);
        }
    }, []);

    // Save messages & scroll
    useEffect(() => {
        localStorage.setItem("smartlife-chat", JSON.stringify(messages));
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    function clearChat() {
        localStorage.removeItem("smartlife-chat");
        setMessages([{ ...INITIAL_MSG, timestamp: new Date() }]);
        setShowPrompts(true);
        inputRef.current?.focus();
    }

    async function handleSend(text?: string) {
        const content = text || input.trim();
        if (!content || loading) return;

        const token = localStorage.getItem("token");
        if (!token) { window.location.href = "/login"; return; }

        const userMsg: Message = { role: "user", content, timestamp: new Date() };
        const updated = [...messages, userMsg];
        setMessages(updated);
        setInput("");
        setLoading(true);
        setShowPrompts(false);

        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/coach`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ messages: updated }),
            });

            if (res.status === 401) {
                localStorage.removeItem("token");
                window.location.href = "/login";
                return;
            }

            const data = await res.json();
            const full = data.message;
            const aiTimestamp = new Date();

            setMessages((prev) => [...prev, { role: "assistant", content: "", timestamp: aiTimestamp }]);

            // Typewriter effect
            let i = 0;
            const iv = setInterval(() => {
                i += 2; // slightly faster
                setMessages((prev) => {
                    const n = [...prev];
                    n[n.length - 1] = { ...n[n.length - 1], content: full.slice(0, i) };
                    return n;
                });
                if (i >= full.length) {
                    clearInterval(iv);
                    setLoading(false);
                }
            }, 10);
        } catch {
            setMessages((prev) => [...prev, {
                role: "assistant",
                content: "Sorry, I couldn't reach the server. Please try again.",
                timestamp: new Date(),
            }]);
            setLoading(false);
        }
    }

    const messageCount = messages.filter((m) => m.role === "user").length;

    return (
        <div className="flex flex-col h-[calc(100vh-120px)] sm:h-[calc(100vh-80px)] max-h-[900px]">

            {/* ── HEADER ── */}
            <motion.div
                initial={{ opacity: 0, y: -16 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center justify-between mb-4 shrink-0"
            >
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <div className="w-11 h-11 rounded-2xl bg-[#c8ff00]/10 border border-[#c8ff00]/30 flex items-center justify-center text-xl">
                            🤖
                        </div>
                        <motion.div
                            className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-[#c8ff00] rounded-full border-2 border-black"
                            animate={{ scale: [1, 1.3, 1] }}
                            transition={{ duration: 2, repeat: Infinity }}
                        />
                    </div>
                    <div>
                        <h1 className="text-lg font-bold">Smart Life Coach</h1>
                        <p className="text-[11px] text-[#c8ff00]">Online · Health data connected</p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {/* Message count badge */}
                    {messageCount > 0 && (
                        <span className="text-xs px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-white/40">
                            {messageCount} {messageCount === 1 ? "message" : "messages"}
                        </span>
                    )}
                    {/* Timestamp toggle */}
                    <button
                        onClick={() => setShowTimestamps((v) => !v)}
                        title="Toggle timestamps"
                        className={`text-xs px-3 py-1.5 rounded-lg transition ${showTimestamps ? "bg-white/10 text-white/60" : "hover:bg-white/5 text-white/20 hover:text-white/40"}`}
                    >
                        🕐
                    </button>
                    <button
                        onClick={clearChat}
                        className="text-xs text-white/20 hover:text-white/50 transition px-3 py-1.5 rounded-lg hover:bg-white/5"
                    >
                        Clear
                    </button>
                </div>
            </motion.div>

            {/* ── MESSAGES ── */}
            <div ref={chatRef} className="flex-1 overflow-y-auto space-y-3 pr-1 pb-4 scroll-smooth">
                <AnimatePresence initial={false}>
                    {messages.map((msg, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 10, scale: 0.98 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            transition={{ duration: 0.2 }}
                            className={`flex flex-col ${msg.role === "user" ? "items-end" : "items-start"}`}
                        >
                            <div className={`flex items-end gap-2 max-w-[88%] sm:max-w-[75%] ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
                                {msg.role === "assistant" && (
                                    <div className="w-7 h-7 rounded-xl bg-[#c8ff00]/10 border border-[#c8ff00]/20 flex items-center justify-center text-sm shrink-0 mb-0.5">
                                        🤖
                                    </div>
                                )}

                                <div
                                    className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${msg.role === "user"
                                        ? "bg-[#c8ff00] text-black font-medium rounded-br-sm"
                                        : "backdrop-blur-xl bg-white/5 border border-white/10 text-white rounded-bl-sm"
                                        }`}
                                >
                                    {msg.content}
                                    {/* Typing indicator */}
                                    {msg.role === "assistant" && msg.content === "" && loading && (
                                        <span className="inline-flex gap-1 ml-1">
                                            {[0, 1, 2].map((d) => (
                                                <motion.span
                                                    key={d}
                                                    className="w-1.5 h-1.5 bg-[#c8ff00] rounded-full inline-block"
                                                    animate={{ y: [0, -4, 0] }}
                                                    transition={{ duration: 0.55, repeat: Infinity, delay: d * 0.15 }}
                                                />
                                            ))}
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Timestamp */}
                            <AnimatePresence>
                                {showTimestamps && msg.timestamp && (
                                    <motion.span
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: "auto" }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className={`text-[10px] text-white/20 mt-1 ${msg.role === "user" ? "mr-1" : "ml-9"}`}
                                    >
                                        {formatTime(msg.timestamp)}
                                    </motion.span>
                                )}
                            </AnimatePresence>
                        </motion.div>
                    ))}
                </AnimatePresence>
                <div ref={bottomRef} />
            </div>

            {/* ── QUICK PROMPTS ── */}
            <AnimatePresence>
                {showPrompts && (
                    <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 8 }}
                        className="mb-3 shrink-0 space-y-2"
                    >
                        {/* Category tabs */}
                        <div className="flex gap-2">
                            {Object.keys(QUICK_PROMPTS).map((cat) => (
                                <button
                                    key={cat}
                                    onClick={() => setActiveCategory(cat)}
                                    className={`text-[11px] px-3 py-1.5 rounded-lg border transition ${activeCategory === cat
                                        ? "border-[#c8ff00]/40 bg-[#c8ff00]/10 text-[#c8ff00]"
                                        : "border-white/10 text-white/30 hover:text-white/60 hover:border-white/20"
                                        }`}
                                >
                                    {cat}
                                </button>
                            ))}
                        </div>

                        {/* Prompt chips */}
                        <div className="flex flex-wrap gap-2">
                            {QUICK_PROMPTS[activeCategory as keyof typeof QUICK_PROMPTS].map((p) => (
                                <button
                                    key={p}
                                    onClick={() => handleSend(p)}
                                    className="text-[11px] px-3 py-2 rounded-xl border border-white/10 text-white/50 hover:text-white hover:border-white/30 transition bg-white/3"
                                >
                                    {p}
                                </button>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── INPUT ── */}
            <div className="flex gap-2 sm:gap-3 shrink-0">
                {/* Show prompts toggle when hidden */}
                {!showPrompts && (
                    <button
                        onClick={() => setShowPrompts(true)}
                        title="Quick prompts"
                        className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 text-white/30 hover:text-white/60 hover:bg-white/10 transition flex items-center justify-center text-lg"
                    >
                        ⚡
                    </button>
                )}

                <input
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSend()}
                    placeholder="Ask about training, recovery, nutrition..."
                    className="flex-1 px-5 py-3.5 rounded-2xl bg-white/5 border border-white/10 text-white text-sm outline-none focus:border-[#c8ff00]/40 transition placeholder:text-white/25"
                />

                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleSend()}
                    disabled={loading || !input.trim()}
                    className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-[#c8ff00] text-black flex items-center justify-center font-bold text-lg disabled:opacity-40 shrink-0"
                >
                    {loading ? (
                        <motion.div
                            className="w-4 h-4 border-2 border-black border-t-transparent rounded-full"
                            animate={{ rotate: 360 }}
                            transition={{ duration: 0.7, repeat: Infinity, ease: "linear" }}
                        />
                    ) : "↑"}
                </motion.button>
            </div>
        </div>
    );
}