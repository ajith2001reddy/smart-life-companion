"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/context/AuthContext";

type Review = {
    _id: string;
    author: string;
    text: string;
    rating: number;
    sentiment: "Positive" | "Neutral" | "Negative" | "Pending";
    category: string;
    aiResponse: string;
    status: "pending" | "processed" | "sent";
    createdAt: string;
};

const SENTIMENT_COLORS = {
    Positive: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    Neutral: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    Negative: "bg-red-500/10 text-red-400 border-red-500/20",
    Pending: "bg-white/5 text-white/40 border-white/10",
};

export default function FeedbackEngine() {
    const { token } = useAuth();
    const [reviews, setReviews] = useState<Review[]>([]);
    const [loading, setLoading] = useState(true);
    const [analyzing, setAnalyzing] = useState<string | null>(null);
    const [drafting, setDrafting] = useState<string | null>(null);
    const [activeEdit, setActiveEdit] = useState<string | null>(null);
    const [tempResponse, setTempResponse] = useState("");

    const base = process.env.NEXT_PUBLIC_API_URL;

    useEffect(() => {
        fetchReviews();
    }, [token]);

    const fetchReviews = async () => {
        try {
            const res = await fetch(`${base}/api/feedback`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            setReviews(data);
            setLoading(false);
        } catch (e) {
            console.error(e);
        }
    };

    const handleSeed = async () => {
        await fetch(`${base}/api/feedback/seed`, { method: "POST" });
        fetchReviews();
    };

    const analyzeReview = async (id: string) => {
        setAnalyzing(id);
        await fetch(`${base}/api/feedback/analyze/${id}`, { method: "POST" });
        setAnalyzing(null);
        fetchReviews();
    };

    const draftResponse = async (id: string) => {
        setDrafting(id);
        const res = await fetch(`${base}/api/feedback/respond/${id}`, { method: "POST" });
        const data = await res.json();
        setTempResponse(data.aiResponse);
        setActiveEdit(id);
        setDrafting(null);
    };

    return (
        <div className="space-y-8 pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Feedback Engine</h1>
                    <p className="text-white/40 text-sm mt-1">LLM-powered review classification and empathetic response drafting.</p>
                </div>
                <button 
                    onClick={handleSeed}
                    className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-xs hover:bg-white/10 transition"
                >
                    Refresh / Seed Data
                </button>
            </div>

            {loading ? (
                <div className="flex items-center justify-center h-64">
                    <div className="w-8 h-8 border-2 border-[#c8ff00] border-t-transparent rounded-full animate-spin" />
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-4">
                    <AnimatePresence mode="popLayout">
                        {reviews.map((review) => (
                            <motion.div
                                key={review._id}
                                layout
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="group relative bg-white/5 border border-white/10 rounded-3xl p-6 hover:border-[#c8ff00]/30 transition-all duration-300"
                            >
                                <div className="flex flex-col md:flex-row gap-6">
                                    {/* Sentiment & Info */}
                                    <div className="md:w-48 shrink-0">
                                        <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${SENTIMENT_COLORS[review.sentiment]}`}>
                                            {review.sentiment}
                                        </div>
                                        <div className="mt-3">
                                            <p className="font-bold text-white/90">{review.author}</p>
                                            <div className="flex gap-1 mt-1 text-[#c8ff00]">
                                                {Array.from({ length: review.rating }).map((_, i) => <span key={i}>★</span>)}
                                            </div>
                                            <p className="text-[10px] text-white/30 uppercase tracking-widest mt-4">Category</p>
                                            <p className="text-xs text-white/60">{review.category || "Unclassified"}</p>
                                        </div>
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 space-y-4">
                                        <p className="text-white/80 leading-relaxed italic text-sm">"{review.text}"</p>
                                        
                                        <div className="pt-4 border-t border-white/5 flex flex-wrap gap-2">
                                            {review.sentiment === "Pending" && (
                                                <button 
                                                    onClick={() => analyzeReview(review._id)}
                                                    disabled={analyzing === review._id}
                                                    className="px-4 py-2 bg-[#c8ff00] text-black text-xs font-bold rounded-xl hover:scale-105 transition disabled:opacity-50"
                                                >
                                                    {analyzing === review._id ? "Analyzing..." : "Analyze with AI"}
                                                </button>
                                            )}
                                            
                                            {review.sentiment !== "Pending" && !review.aiResponse && (
                                                <button 
                                                    onClick={() => draftResponse(review._id)}
                                                    disabled={drafting === review._id}
                                                    className="px-4 py-2 border border-[#c8ff00]/40 text-[#c8ff00] text-xs font-bold rounded-xl hover:bg-[#c8ff00]/5 transition disabled:opacity-50"
                                                >
                                                    {drafting === review._id ? "Drafting..." : "Generate Draft"}
                                                </button>
                                            )}

                                            {review.aiResponse && activeEdit !== review._id && (
                                                <div className="w-full mt-2">
                                                    <p className="text-[10px] text-white/30 uppercase tracking-widest mb-2">AI Drafted Response</p>
                                                    <div className="bg-white/5 border border-white/5 rounded-2xl p-4 text-xs text-white/60 leading-relaxed">
                                                        {review.aiResponse}
                                                    </div>
                                                    <button 
                                                        onClick={() => { setTempResponse(review.aiResponse); setActiveEdit(review._id); }}
                                                        className="mt-2 text-[10px] text-[#c8ff00] hover:underline"
                                                    >
                                                        Edit Response
                                                    </button>
                                                </div>
                                            )}

                                            {activeEdit === review._id && (
                                                <div className="w-full mt-2 space-y-3">
                                                    <textarea 
                                                        value={tempResponse}
                                                        onChange={(e) => setTempResponse(e.target.value)}
                                                        className="w-full h-32 bg-black/40 border border-[#c8ff00]/30 rounded-2xl p-4 text-xs text-white/90 outline-none focus:border-[#c8ff00] transition"
                                                    />
                                                    <div className="flex gap-2">
                                                        <button 
                                                            className="px-4 py-2 bg-[#c8ff00] text-black text-xs font-bold rounded-xl"
                                                            onClick={() => setActiveEdit(null)}
                                                        >
                                                            Approve & Send
                                                        </button>
                                                        <button 
                                                            className="px-4 py-2 bg-white/5 text-white/40 text-xs font-bold rounded-xl"
                                                            onClick={() => setActiveEdit(null)}
                                                        >
                                                            Cancel
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            )}
        </div>
    );
}
