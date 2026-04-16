require("dotenv").config();

const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const OpenAI = require("openai");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const cron = require("node-cron");

const weatherRoute = require("./routes/weather");
const dashboardRoute = require("./routes/dashboard");
const nutritionRoute = require("./routes/nutrition");
const healthRoute = require("./routes/health");
const authRoute = require("./routes/auth");
const foodScanRoute = require("./routes/foodScan");
const workoutRoute = require("./routes/workout");
const feedbackRoute = require("./routes/feedback");


const Health = require("./models/health");
const User = require("./models/User");
const ChatLog = require("./models/ChatLog");
const auth = require("./middleware/auth");

const app = express();
app.set("trust proxy", 1);

// ✅ FIX: Accept your main domain + ANY Vercel preview deploy + localhost
app.use(cors({
    origin: function (origin, callback) {
        const allowedExact = [
            "https://smart-life-companion.vercel.app",
            "http://localhost:3000",
            "http://localhost:3001",
        ];

        // Allow requests with no origin (mobile apps, curl, Postman)
        if (!origin) return callback(null, true);

        // Allow exact matches
        if (allowedExact.includes(origin)) return callback(null, true);

        // Allow ANY Vercel preview deploy (smart-life-companion-*.vercel.app)
        if (origin.endsWith(".vercel.app")) return callback(null, true);

        callback(new Error(`CORS blocked: ${origin}`));
    },
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    credentials: true,
}));

app.use(express.json());

const connectDB = require("./config/db");
connectDB();

app.use(
    helmet({
        crossOriginResourcePolicy: false,
        crossOriginOpenerPolicy: false,
    })
);

const globalLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: "Too many requests, please slow down." },
});
app.use(globalLimiter);

const aiLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 20,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: "AI rate limit reached. Try again in a minute." },
});

app.use("/api/weather", weatherRoute);
app.use("/api/dashboard", dashboardRoute);
app.use("/api/nutrition", nutritionRoute);
app.use("/api/health", healthRoute);
app.use("/api/auth", authRoute);
app.use("/api/food-scan", foodScanRoute);
app.use("/api/workout", workoutRoute);
app.use("/api/feedback", feedbackRoute);

app.use("/uploads", express.static("uploads"));

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

app.get("/", (_req, res) => {
    res.json({ message: "Backend running successfully 🚀", timestamp: new Date() });
});

// ✅ Health check for Railway
app.get("/api/ping", (_req, res) => {
    res.json({ ok: true });
});

function generateSmartPlan(goal, days) {
    const templates = {
        "Lose fat": [
            { name: "Jump Squats", sets: 3, reps: 15 },
            { name: "Push Ups", sets: 3, reps: 12 },
            { name: "Plank", sets: 3, reps: 60 },
        ],
        "Gain muscle": [
            { name: "Bench Press", sets: 4, reps: 8 },
            { name: "Squats", sets: 4, reps: 6 },
            { name: "Deadlifts", sets: 3, reps: 5 },
        ],
        Maintain: [
            { name: "Lat Pulldown", sets: 3, reps: 10 },
            { name: "Shoulder Press", sets: 3, reps: 10 },
            { name: "Leg Press", sets: 3, reps: 12 },
        ],
    };

    const week = {};
    const dayNames = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    for (let i = 0; i < days; i++) {
        week[dayNames[i]] = templates[goal] || templates["Maintain"];
    }
    return week;
}

app.post("/api/generate-plan", aiLimiter, async (req, res) => {
    try {
        const { mode, goal, days, bmi } = req.body;

        if (mode === "smart") {
            return res.json({ plan: generateSmartPlan(goal, days) });
        }

        if (mode === "pro") {
            const prompt = `You are a professional fitness coach.
Goal: ${goal}
BMI: ${bmi}
Days per week: ${days}
Return ONLY valid JSON in this exact format:
{ "Monday": [{ "name": "Exercise Name", "sets": 3, "reps": 10 }], "Tuesday": [] }
Do NOT include explanations or markdown.`;

            const completion = await openai.chat.completions.create({
                model: "gpt-4o-mini",
                messages: [{ role: "user", content: prompt }],
            });

            const raw = completion.choices[0].message.content;
            const match = raw.match(/\{[\s\S]*\}/);
            if (!match) return res.status(500).json({ error: "AI returned invalid format" });

            return res.json({ plan: JSON.parse(match[0]) });
        }

        res.status(400).json({ error: "Invalid mode" });
    } catch (error) {
        console.error("PLAN ERROR:", error);
        res.status(500).json({ error: "Plan generation failed" });
    }
});

app.post("/api/coach", aiLimiter, auth, async (req, res) => {
    try {
        const userId = req.user.userId;
        const { message } = req.body;

        if (!message) return res.status(400).json({ error: "message is required" });

        let chatLog = await ChatLog.findOne({ userId });
        if (!chatLog) {
            chatLog = new ChatLog({ userId, messages: [] });
        }

        const latestHealth = await Health.findOne({ userId }).sort({ date: -1 });
        let healthContext = latestHealth
            ? `User Health Data: Steps=${latestHealth.steps}, HR=${latestHealth.heartRate}bpm, Sleep=${latestHealth.sleepHours}h, RestingHR=${latestHealth.restingHR}, Cals burned=${latestHealth.caloriesBurned}`
            : "No health data available.";

        const systemPrompt = {
            role: "system",
            content: `You are Smart Life AI Coach. ${healthContext}. Be concise, motivating, and specific.`,
        };

        chatLog.messages.push({ role: "user", content: message });

        const openaiMessages = [
            systemPrompt,
            ...chatLog.messages.slice(-20).map((m) => ({ role: m.role, content: m.content })),
        ];

        const completion = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: openaiMessages,
            max_tokens: 500,
        });

        const reply = completion.choices[0].message.content;
        chatLog.messages.push({ role: "assistant", content: reply });
        await chatLog.save();

        res.json({ reply });
    } catch (error) {
        console.error("COACH ERROR:", error);
        res.status(500).json({ error: "Coach request failed" });
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));