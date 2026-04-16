"use client";

import { motion } from "framer-motion";

const nodes = [
    { id: "health", icon: "❤️", label: "Health Engine", sub: "Biometric Stream", x: "10%", y: "20%", color: "bg-red-500" },
    { id: "feedback", icon: "💬", label: "Feedback Engine", sub: "Review Queue", x: "10%", y: "70%", color: "bg-blue-500" },
    { id: "llm", icon: "🧠", label: "Intelligence Layer", sub: "GPT-4o / Claude", x: "50%", y: "45%", color: "bg-[#c8ff00]" },
    { id: "db", icon: "💽", label: "MongoDB Sync", sub: "Unified Data Store", x: "90%", y: "45%", color: "bg-emerald-500" },
];

export default function ArchitectureView() {
    return (
        <div className="space-y-8 pb-20 h-full">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">System Architecture</h1>
                <p className="text-white/40 text-sm mt-1">Technical visualization of the integrated companion & feedback ecosystem.</p>
            </div>

            <div className="relative w-full h-[500px] border border-white/5 bg-white/[0.02] rounded-[40px] overflow-hidden">
                {/* Visual grid background */}
                <div className="absolute inset-0 bg-[radial-gradient(#ffffff08_1px,transparent_1px)] [background-size:32px_32px]" />
                
                {/* SVG Connections Overlay */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none">
                    {/* Path from Health -> LLM */}
                    <motion.path 
                        d="M 150 150 Q 300 150 450 250" 
                        stroke="#ffffff10" 
                        strokeWidth="2" 
                        fill="none"
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{ duration: 1.5 }}
                    />
                    {/* Path from Feedback -> LLM */}
                    <motion.path 
                        d="M 150 350 Q 300 350 450 250" 
                        stroke="#ffffff10" 
                        strokeWidth="2" 
                        fill="none"
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{ duration: 1.5, delay: 0.2 }}
                    />
                    {/* Path from LLM -> DB */}
                    <motion.path 
                        d="M 550 250 L 850 250" 
                        stroke="#c8ff0040" 
                        strokeWidth="3" 
                        fill="none"
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{ duration: 1.5, delay: 0.5 }}
                    />
                </svg>

                {/* Nodes */}
                {nodes.map((node, i) => (
                    <motion.div
                        key={node.id}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.1 }}
                        className="absolute w-48 h-24 p-4 rounded-3xl bg-black border border-white/10 backdrop-blur-xl flex items-center gap-4 z-10"
                        style={{ left: node.x, top: node.y, transform: "translate(-50%, -50%)" }}
                    >
                        <div className={`w-12 h-12 rounded-2xl ${node.color} flex items-center justify-center text-xl shrink-0 shadow-2xl`}>
                            {node.icon}
                        </div>
                        <div className="min-w-0">
                            <p className="font-bold text-xs truncate">{node.label}</p>
                            <p className="text-[10px] text-white/30 truncate uppercase tracking-widest">{node.sub}</p>
                        </div>
                    </motion.div>
                ))}

                {/* Highlight Pulse for LLM */}
                <div className="absolute left-1/2 top-[45%] -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-[#c8ff00]/5 rounded-full blur-3xl animate-pulse" />
            </div>

            {/* Tech Stack Info */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                    { title: "Core Stack", content: "Next.js 16, Node.js v20, MongoDB Atlas, Firebase Auth" },
                    { title: "Intelligence", content: "OpenAI GPT-4o-mini, Empathetic Prompting, Sentiment Analysis" },
                    { title: "UI/UX", content: "Glassmorphism, Framer Motion, Tailwind 4, Recharts" },
                ].map((item, i) => (
                    <motion.div 
                        key={i}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 + i * 0.1 }}
                        className="bg-white/5 border border-white/10 rounded-3xl p-6"
                    >
                        <h4 className="text-[10px] text-[#c8ff00] uppercase tracking-widest font-bold mb-2">{item.title}</h4>
                        <p className="text-sm text-white/70 leading-relaxed">{item.content}</p>
                    </motion.div>
                ))}
            </div>

            {/* Integration Action */}
            <div className="p-8 rounded-[40px] bg-white/5 border border-white/10 flex flex-col md:flex-row items-center justify-between gap-6">
                <div>
                    <h3 className="text-lg font-bold">Ready for full deployment?</h3>
                    <p className="text-white/40 text-sm">All routes, models, and UI components are successfully initialized.</p>
                </div>
                <button className="px-8 py-3 bg-[#c8ff00] text-black font-black text-sm rounded-2xl hover:scale-105 transition">
                    Sync Intelligence Cluster
                </button>
            </div>
        </div>
    );
}
