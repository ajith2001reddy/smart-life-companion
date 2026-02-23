const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const Nutrition = require("../models/Nutrition");
const OpenAI = require("openai");

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

/* ================= HELPERS ================= */

// Get or create today's nutrition log for this user
async function getTodayLog(userId) {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date();
    end.setHours(23, 59, 59, 999);

    let log = await Nutrition.findOne({
        userId,
        date: { $gte: start, $lte: end },
    });

    if (!log) {
        log = await Nutrition.create({ userId, meals: [] });
    }

    return log;
}

/* ================= GET TODAY ================= */
router.get("/today", auth, async (req, res) => {
    try {
        const log = await getTodayLog(req.user.userId);
        res.json(log);
    } catch (err) {
        res.status(500).json({ error: "Failed to load today's nutrition" });
    }
});

/* ================= ADD MEAL ================= */
router.post("/meal", auth, async (req, res) => {
    try {
        const { name, calories, protein, carbs, fat, time } = req.body;

        if (!name) return res.status(400).json({ error: "Meal name required" });

        const log = await getTodayLog(req.user.userId);

        log.meals.push({
            name,
            calories: Number(calories) || 0,
            protein: Number(protein) || 0,
            carbs: Number(carbs) || 0,
            fat: Number(fat) || 0,
            time: time || "Anytime",
        });

        await log.save();
        res.json({ message: "Meal added", log });
    } catch (err) {
        res.status(500).json({ error: "Failed to add meal" });
    }
});

/* ================= DELETE MEAL ================= */
router.delete("/meal/:mealId", auth, async (req, res) => {
    try {
        const log = await getTodayLog(req.user.userId);
        log.meals = log.meals.filter(
            (m) => m._id.toString() !== req.params.mealId
        );
        await log.save();
        res.json({ message: "Meal removed", log });
    } catch (err) {
        res.status(500).json({ error: "Failed to remove meal" });
    }
});

/* ================= UPDATE TARGETS ================= */
router.put("/targets", auth, async (req, res) => {
    try {
        const { targetCalories, targetProtein, targetCarbs, targetFat } = req.body;
        const log = await getTodayLog(req.user.userId);

        if (targetCalories) log.targetCalories = Number(targetCalories);
        if (targetProtein) log.targetProtein = Number(targetProtein);
        if (targetCarbs) log.targetCarbs = Number(targetCarbs);
        if (targetFat) log.targetFat = Number(targetFat);

        await log.save();
        res.json({ message: "Targets updated", log });
    } catch (err) {
        res.status(500).json({ error: "Failed to update targets" });
    }
});

/* ================= WEEKLY HISTORY ================= */
router.get("/history", auth, async (req, res) => {
    try {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const logs = await Nutrition.find({
            userId: req.user.userId,
            date: { $gte: sevenDaysAgo },
        }).sort({ date: 1 });

        const history = logs.map((log) => ({
            date: log.date,
            calories: log.meals.reduce((s, m) => s + m.calories, 0),
            protein: log.meals.reduce((s, m) => s + m.protein, 0),
            carbs: log.meals.reduce((s, m) => s + m.carbs, 0),
            fat: log.meals.reduce((s, m) => s + m.fat, 0),
            targetCalories: log.targetCalories,
        }));

        res.json(history);
    } catch (err) {
        res.status(500).json({ error: "Failed to load history" });
    }
});

/* ================= AI MEAL SUGGESTIONS ================= */
router.post("/suggest", auth, async (req, res) => {
    try {
        const { goal, remainingCalories, remainingProtein } = req.body;

        const prompt = `
You are a professional sports nutritionist.

The user's goal is: ${goal || "maintain fitness"}
Remaining calories for today: ${remainingCalories || 500} kcal
Remaining protein needed: ${remainingProtein || 30}g

Suggest exactly 3 meals or snacks to hit these targets.
Return ONLY valid JSON, no markdown, no explanation:

[
  {
    "name": "Meal name",
    "calories": 300,
    "protein": 25,
    "carbs": 30,
    "fat": 8,
    "time": "Dinner",
    "reason": "One short sentence why this fits the goal"
  }
]
`;

        const completion = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [{ role: "user", content: prompt }],
            temperature: 0.7,
        });

        let raw = completion.choices[0].message.content;
        const match = raw.match(/\[[\s\S]*\]/);

        if (!match) {
            return res.status(500).json({ error: "AI returned invalid format" });
        }

        const suggestions = JSON.parse(match[0]);
        res.json({ suggestions });

    } catch (err) {
        console.error("AI Suggest Error:", err);
        res.status(500).json({ error: "AI suggestion failed" });
    }
});

module.exports = router;