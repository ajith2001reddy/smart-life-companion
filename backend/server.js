require("dotenv").config();

const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const OpenAI = require("openai");

const weatherRoute = require("./routes/weather");
const dashboardRoute = require("./routes/dashboard");
const nutritionRoute = require("./routes/nutrition");
const healthRoute = require("./routes/health");
const authRoute = require("./routes/auth");
const foodScanRoute = require("./routes/foodScan"); // ✅ ADDED
const auth = require("./middleware/auth");

const Health = require("./models/health");

const app = express();

/* ================= DATABASE CONNECTION ================= */

mongoose
    .connect(process.env.MONGO_URI)
    .then(() => console.log("🟢 MongoDB Connected"))
    .catch((err) => console.error("MongoDB Error:", err));

/* ================= MIDDLEWARE ================= */

app.use(cors({
    origin: "*",
    credentials: true,
}));
app.use(express.json());

/* ================= ROUTES ================= */

app.use("/api/weather", weatherRoute);
app.use("/api/dashboard", dashboardRoute);
app.use("/api/nutrition", nutritionRoute);
app.use("/api/health", healthRoute);
app.use("/api/auth", authRoute);
app.use("/api/food-scan", foodScanRoute); // ✅ ADDED

/* ================= OPENAI ================= */

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

/* ================= HEALTH CHECK ================= */

app.get("/", (req, res) => {
    res.json({ message: "Backend running successfully 🚀" });
});

/* ================= SMART PLAN ================= */

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
    const dayNames = [
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
    ];

    for (let i = 0; i < days; i++) {
        week[dayNames[i]] = templates[goal] || templates["Maintain"];
    }

    return week;
}

app.post("/api/generate-plan", async (req, res) => {
    try {
        const { mode, goal, days, bmi } = req.body;

        if (mode === "smart") {
            const plan = generateSmartPlan(goal, days);
            return res.json({ plan });
        }

        if (mode === "pro") {
            const prompt = `
You are a professional fitness coach.

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
Return JSON only.
`;

            const completion = await openai.chat.completions.create({
                model: "gpt-4o-mini",
                messages: [{ role: "user", content: prompt }],
            });

            let raw = completion.choices[0].message.content;
            const match = raw.match(/\{[\s\S]*\}/);

            if (!match) {
                return res.status(500).json({
                    error: "AI returned invalid format",
                });
            }

            const plan = JSON.parse(match[0]);
            return res.json({ plan });
        }

        res.status(400).json({ error: "Invalid mode" });
    } catch (error) {
        console.error("PLAN ERROR:", error);
        res.status(500).json({ error: "Plan generation failed" });
    }
});

/* ================= AI COACH (PROTECTED + HEALTH AWARE) ================= */

app.post("/api/coach", auth, async (req, res) => {
    try {
        const { messages } = req.body;

        const userId = req.user.userId;

        const latestHealth = await Health.findOne({ userId }).sort({
            date: -1,
        });

        let healthContext = "";

        if (latestHealth) {
            healthContext = `
User Current Health Data:
- Steps: ${latestHealth.steps}
- Heart Rate: ${latestHealth.heartRate}
- Sleep Hours: ${latestHealth.sleepHours}
- Resting HR: ${latestHealth.restingHR}
- Calories Burned: ${latestHealth.caloriesBurned}
`;
        } else {
            healthContext = `
No health data available for this user.
`;
        }

        const completion = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                {
                    role: "system",
                    content: `
You are Smart Life AI Coach.

${healthContext}

Rules:
- Keep responses short (2–4 sentences max)
- No markdown
- No bullet points
- Speak conversationally
- Give actionable advice
- If health data shows poor recovery, reduce intensity
- If recovery looks strong, encourage performance
`,
                },
                ...messages,
            ],
            temperature: 0.7,
        });

        res.json({
            message: completion.choices[0].message.content.trim(),
        });
    } catch (error) {
        console.error("Coach Error:", error);
        res.status(500).json({ error: "AI failed" });
    }
});

/* ================= START SERVER ================= */

const PORT = process.env.PORT || 5000;

app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on ${PORT}`);
});