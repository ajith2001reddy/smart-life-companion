// ============================================================
// backend/server.js  (FULL REPLACEMENT)
// Added: helmet, rate limiting, workout routes, coach memory,
//        weekly report cron job
// ============================================================
const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);
require("dotenv").config();

const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const OpenAI = require("openai");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const cron = require("node-cron");

// ── Routes ──────────────────────────────────────────────────
const weatherRoute = require("./routes/weather");
const dashboardRoute = require("./routes/dashboard");
const nutritionRoute = require("./routes/nutrition");
const healthRoute = require("./routes/health");
const authRoute = require("./routes/auth");
const foodScanRoute = require("./routes/foodScan");
const workoutRoute = require("./routes/workout");

// ── Models ──────────────────────────────────────────────────
const Health = require("./models/health");
const User = require("./models/User");
const ChatLog = require("./models/ChatLog");

// ── Middleware ───────────────────────────────────────────────
const auth = require("./middleware/auth");

const app = express();

/* ═══════════ DATABASE ═══════════ */
const connectDB = require("./config/db");

connectDB();

/* ═══════════ SECURITY MIDDLEWARE ═══════════ */

// Helmet sets secure HTTP headers
app.use(
    helmet({
        crossOriginResourcePolicy: false, // allow Next.js image requests
    })
);

// Global rate limiter — 100 requests per minute per IP
const globalLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: "Too many requests, please slow down." },
});
app.use(globalLimiter);

// Stricter limiter for AI endpoints (OpenAI costs money)
const aiLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 20,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: "AI rate limit reached. Try again in a minute." },
});

/* ═══════════ STANDARD MIDDLEWARE ═══════════ */
app.use(
    cors({
        origin: process.env.FRONTEND_URL || "*",
        credentials: true,
    })
);
app.use(express.json({ limit: "5mb" }));

/* ═══════════ ROUTES ═══════════ */
app.use("/api/weather", weatherRoute);
app.use("/api/dashboard", dashboardRoute);
app.use("/api/nutrition", nutritionRoute);
app.use("/api/health", healthRoute);
app.use("/api/auth", authRoute);
app.use("/api/food-scan", foodScanRoute);
app.use("/api/workout", workoutRoute);
app.use("/uploads", express.static("uploads"));// ✅ NEW

/* ═══════════ OPENAI ═══════════ */
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

/* ═══════════ HEALTH CHECK ═══════════ */
app.get("/", (_req, res) => {
    res.json({ message: "Backend running successfully 🚀", timestamp: new Date() });
});

/* ═══════════ SMART PLAN (unchanged logic) ═══════════ */
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

{
  "Monday": [
    { "name": "Exercise Name", "sets": 3, "reps": 10 }
  ],
  "Tuesday": []
}

Do NOT include explanations.
Do NOT include markdown.
Return JSON only.`;

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

/* ═══════════ AI COACH (with persistent memory) ═══════════ */
app.post("/api/coach", aiLimiter, auth, async (req, res) => {
    try {
        const userId = req.user.userId;
        const { message } = req.body; // single new message string

        if (!message) return res.status(400).json({ error: "message is required" });

        // Load or create chat log
        let chatLog = await ChatLog.findOne({ userId });
        if (!chatLog) {
            chatLog = new ChatLog({ userId, messages: [] });
        }

        // Fetch latest health data for context
        const latestHealth = await Health.findOne({ userId }).sort({ date: -1 });
        let healthContext = latestHealth
            ? `User Health Data: Steps=${latestHealth.steps}, HR=${latestHealth.heartRate}bpm, Sleep=${latestHealth.sleepHours}h, RestingHR=${latestHealth.restingHR}, Cals burned=${latestHealth.caloriesBurned}`
            : "No health data available.";

        // Build messages array for OpenAI
        const systemPrompt = {
            role: "system",
            content: `You are Smart Life AI Coach.
${healthContext}
Rules:
- Keep responses short (2–4 sentences max)
- No markdown
- No bullet points
- Speak conversationally
- Give actionable advice
- If health data shows poor recovery (sleep < 6h), reduce intensity
- If recovery looks strong (sleep >= 7h, low resting HR), encourage performance`,
        };

        // Add user message to history
        chatLog.messages.push({ role: "user", content: message });

        const completion = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [systemPrompt, ...chatLog.messages.map(m => ({ role: m.role, content: m.content }))],
            temperature: 0.7,
        });

        const reply = completion.choices[0].message.content.trim();

        // Add assistant reply to history
        chatLog.messages.push({ role: "assistant", content: reply });
        await chatLog.save();

        res.json({ message: reply });
    } catch (error) {
        console.error("Coach Error:", error);
        res.status(500).json({ error: "AI failed" });
    }
});

/* ═══════════ CLEAR COACH HISTORY ═══════════ */
app.delete("/api/coach/history", auth, async (req, res) => {
    try {
        await ChatLog.findOneAndDelete({ userId: req.user.userId });
        res.json({ message: "Chat history cleared" });
    } catch (err) {
        res.status(500).json({ error: "Failed to clear history" });
    }
});

/* ═══════════ GET COACH HISTORY ═══════════ */
app.get("/api/coach/history", auth, async (req, res) => {
    try {
        const chatLog = await ChatLog.findOne({ userId: req.user.userId });
        res.json(chatLog?.messages || []);
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch history" });
    }
});

/* ═══════════ SCHEDULED WEEKLY REPORT (every Sunday 8am) ═══════════ */
cron.schedule("0 8 * * 0", async () => {
    console.log("📊 Running weekly report generation...");
    try {
        const users = await User.find({}).limit(100);
        const since = new Date();
        since.setDate(since.getDate() - 7);

        for (const user of users) {
            const recentHealth = await Health.find({
                userId: user._id.toString(),
                date: { $gte: since },
            });

            if (!recentHealth.length) continue;

            const avgSteps = Math.round(
                recentHealth.reduce((s, h) => s + h.steps, 0) / recentHealth.length
            );
            const avgSleep = (
                recentHealth.reduce((s, h) => s + h.sleepHours, 0) / recentHealth.length
            ).toFixed(1);

            // Store summary in a simple log (extend to email via SendGrid/etc later)
            console.log(
                `📬 ${user.name}: avg ${avgSteps} steps/day, avg ${avgSleep}h sleep this week`
            );
        }
        console.log("✅ Weekly reports done");
    } catch (err) {
        console.error("Cron error:", err);
    }
});

/* ═══════════ START SERVER ═══════════ */
const PORT = process.env.PORT || 5000;
app.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 Server running on port ${PORT}`);
});