"use client";

import {
    LineChart,
    Line,
    XAxis,
    Tooltip,
    ResponsiveContainer,
} from "recharts";

type Props = {
    data: number[];
};

export default function WeeklyProgressChart({ data }: Props) {
    const chartData = data.map((value, index) => ({
        day: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"][index],
        value,
    }));

    return (
        <div className="backdrop-blur-2xl bg-white/5 border border-white/10 rounded-3xl p-8">
            <h2 className="text-sm text-white/60 uppercase mb-6 tracking-wide">
                Weekly Performance
            </h2>

            <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                        <XAxis dataKey="day" stroke="#ffffff50" />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: "#111",
                                border: "1px solid #333",
                            }}
                        />
                        <Line
                            type="monotone"
                            dataKey="value"
                            stroke="#c8ff00"
                            strokeWidth={3}
                            dot={false}
                        />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
