const express = require("express");
const multer = require("multer");
const auth = require("../middleware/auth");
const Nutrition = require("../models/nutrition");
const OpenAI = require("openai");

const router = express.Router();
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
});

/* ================= GET OR CREATE TODAY LOG ================= */
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
        log = await Nutrition.create({
            userId,
            meals: [],
        });
    }

    return log;
}

/* ================= FOOD IMAGE SCAN ================= */
router.post("/", auth, upload.single("image"), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: "Image required" });
        }

        const base64Image = req.file.buffer.toString("base64");

        const completion = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                {
                    role: "system",
                    content: `
You are a professional nutritionist.

Return ONLY valid JSON.
No markdown.
No explanation.

Format:
{
  "name": "Food name",
  "calories": 500,
  "protein": 30,
  "carbs": 60,
  "fat": 15
}
`,
                },
                {
                    role: "user",
                    content: [
                        {
                            type: "text",
                            text: "Analyze this food image and estimate nutrition values.",
                        },
                        {
                            type: "image_url",
                            image_url: {
                                url: `data:image/jpeg;base64,${base64Image}`,
                            },
                        },
                    ],
                },
            ],
            max_tokens: 250,
            temperature: 0.3,
        });

        const raw = completion.choices[0].message.content;
        const match = raw.match(/\{[\s\S]*\}/);

        if (!match) {
            return res.status(500).json({
                error: "AI returned invalid format",
            });
        }

        const nutritionData = JSON.parse(match[0]);

        const log = await getTodayLog(req.user.userId);

        log.meals.push({
            name: nutritionData.name,
            calories: Number(nutritionData.calories) || 0,
            protein: Number(nutritionData.protein) || 0,
            carbs: Number(nutritionData.carbs) || 0,
            fat: Number(nutritionData.fat) || 0,
            time: "Anytime",
        });

        await log.save();

        res.json({
            message: "Food scanned successfully",
            meal: nutritionData,
            log,
        });
    } catch (error) {
        console.error("FOOD SCAN ERROR:", error);
        res.status(500).json({ error: "Food scan failed" });
    }
});

module.exports = router;