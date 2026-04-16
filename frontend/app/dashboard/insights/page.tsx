"use client";

import { motion } from "framer-motion";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, BarChart, Bar } from "recharts";

const correlationData = [
    { day: "Mon", sentiment: 85, accuracy: 92, sleep: 7.2 },
    { day: "Tue", sentiment: 72, accuracy: 88, sleep: 6.5 },
    { day: "Wed", sentiment: 60, accuracy: 82, sleep: 5.8 }, // Drop in sentiment correlates with drop in sleep
    { day: "Thu", sentiment: 45, accuracy: 75, sleep: 5.2 }, // Low accuracy feedback peaks here
    { day: "Fri", sentiment: 78, accuracy: 90, sleep: 7.5 },
    { day: "Sat", sentiment: 92, accuracy: 95, sleep: 8.2 },
    { day: "Sun", sentiment: 95, accuracy: 96, sleep: 8.5 },
];

const categoryDistribution = [
    { name: "Sleep Tracking", value: 35, color: "#38bdf8" },
    { name: "App Stability", value: 25, color: "#fb7185" },
    { name: "UI/UX", value: 25, color: "#c8ff00" },
    { name: "Sensor Accuracy", value: 15, color: "#f59e0b" },
];

export default function AIInsights() {
    return (
        <div className="space-y-8 pb-20">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold tracking-tight">AI Insights & Correlation</h1>
                <p className="text-white/40 text-sm mt-1">Bridging the gap between user health metrics and product sentiment.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Sentiment vs Health Data Chart */}
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="lg:col-span-2 bg-white/5 border border-white/10 rounded-3xl p-6 sm:p-8"
                >
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h3 className="text-lg font-bold">Bridge Intelligence</h3>
                            <p className="text-white/30 text-xs">Sentiment Score vs. Sensor Accuracy Reporting</p>
                        </div>
                        <div className="flex gap-4">
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-[#c8ff00]" />
                                <span className="text-[10px] text-white/40 uppercase">Sentiment</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-blue-400" />
                                <span className="text-[10px] text-white/40 uppercase">Accuracy</span>
                            </div>
                        </div>
                    </div>

                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={correlationData}>
                                <defs>
                                    <linearGradient id="colorSent" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#c8ff00" stopOpacity={0.3}/>
                                        <stop offset="95%" stopColor="#c8ff00" stopOpacity={0}/>
                                    </linearGradient>
                                    <linearGradient id="colorAcc" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.3}/>
                                        <stop offset="95%" stopColor="#38bdf8" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                                <XAxis 
                                    dataKey="day" 
                                    stroke="#ffffff20" 
                                    fontSize={10} 
                                    tickLine={false} 
                                    axisLine={false} 
                                />
                                <YAxis hide />
                                <Tooltip 
                                    contentStyle={{ background: "#0d0d0d", border: "1px solid #ffffff10", borderRadius: "12px", fontSize: "12px" }}
                                    itemStyle={{ color: "#fff" }}
                                />
                                <Area 
                                    type="monotone" 
                                    dataKey="sentiment" 
                                    stroke="#c8ff00" 
                                    fillOpacity={1} 
                                    fill="url(#colorSent)" 
                                    strokeWidth={3}
                                />
                                <Area 
                                    type="monotone" 
                                    dataKey="accuracy" 
                                    stroke="#38bdf8" 
                                    fillOpacity={1} 
                                    fill="url(#colorAcc)" 
                                    strokeWidth={3}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </motion.div>

                {/* Feedback Distribution */}
                <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.1 }}
                    className="bg-white/5 border border-white/10 rounded-3xl p-6 sm:p-8"
                >
                    <h3 className="text-lg font-bold mb-6">Topic Distro</h3>
                    <div className="space-y-6">
                        {categoryDistribution.map((cat) => (
                            <div key={cat.name} className="space-y-2">
                                <div className="flex justify-between text-xs">
                                    <span className="text-white/60">{cat.name}</span>
                                    <span className="text-white/40">{cat.value}%</span>
                                </div>
                                <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                                    <motion.div 
                                        initial={{ width: 0 }}
                                        animate={{ width: `${cat.value}%` }}
                                        transition={{ duration: 1, ease: "easeOut" }}
                                        className="h-full rounded-full"
                                        style={{ backgroundColor: cat.color }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="mt-10 p-4 rounded-2xl bg-[#c8ff00]/5 border border-[#c8ff00]/10">
                        <p className="text-[10px] text-[#c8ff00] uppercase tracking-widest font-bold mb-2">Automated Finding</p>
                        <p className="text-xs text-white/70 leading-relaxed italic">
                            "Significant correlation detected between poor sleep quality data and 'Sensor Accuracy' complaints on Wednesday/Thursday."
                        </p>
                    </div>
                </motion.div>
            </div>

            {/* Strategic Summary */}
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white/5 border border-white/10 rounded-3xl p-8"
            >
                <div className="flex flex-col md:flex-row gap-8 items-start">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#c8ff00] to-emerald-400 flex items-center justify-center shrink-0">
                        <span className="text-2xl">🧠</span>
                    </div>
                    <div>
                        <h2 className="text-xl font-bold mb-2">Adaptive Insight Engine</h2>
                        <p className="text-white/40 text-sm leading-relaxed max-w-3xl">
                            Our engine has detected that when user heart rate levels during high-intensity training exceed the 180bpm threshold, reporting for 'Sensor Sync Lag' increases by 42%. We recommend prioritizing firmware update v2.4 to address heart-rate-dependent sync latency.
                        </p>
                        <div className="flex gap-4 mt-6">
                            <div className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-[10px] text-white/40 uppercase tracking-widest">
                                Priority High
                            </div>
                            <div className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-[10px] text-white/40 uppercase tracking-widest">
                                Firmware Issue
                            </div>
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
