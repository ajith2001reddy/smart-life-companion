const express = require("express");
const router = express.Router();
const Feedback = require("../models/Feedback");
const OpenAI = require("openai");

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// GET all reviews
router.get("/", async (req, res) => {
    try {
        const reviews = await Feedback.find().sort({ createdAt: -1 });
        res.json(reviews);
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch reviews" });
    }
});

// POST: Seed dummy reviews for the demo
router.post("/seed", async (req, res) => {
    try {
        const dummyReviews = [
            {
                author: "Sarah J.",
                text: "The sleep tracking is okay, but I've noticed it misses my wake-up times by about 20 minutes consistently.",
                sentiment: "Neutral",
                category: "Sleep Tracking",
                rating: 3,
                status: "pending"
            },
            {
                author: "Mike R.",
                text: "Absolutely love the new high-fidelity dashboard! The 3D weather effects are stunning and really set this apart.",
                sentiment: "Positive",
                category: "UI/UX",
                rating: 5,
                status: "processed"
            },
            {
                author: "David K.",
                text: "The app crashed three times during my HIIT session today. Very frustrating when trying to log reps.",
                sentiment: "Negative",
                category: "App Stability",
                rating: 1,
                status: "pending"
            }
        ];
        await Feedback.deleteMany({}); // Clear existing for demo
        const created = await Feedback.insertMany(dummyReviews);
        res.json({ message: "Seeded reviews", count: created.length });
    } catch (err) {
        res.status(500).json({ error: "Seeding failed" });
    }
});

// POST: Analyze sentiment and category
router.post("/analyze/:id", async (req, res) => {
    try {
        const review = await Feedback.findById(req.params.id);
        if (!review) return res.status(404).json({ error: "Review not found" });

        const prompt = `Analyze this customer review for a health/fitness SaaS app:
"${review.text}"

Classify into:
1. Sentiment: Positive, Neutral, or Negative
2. Category: (e.g., Sleep Tracking, UI/UX, App Stability, Sensor Accuracy)

Return ONLY JSON:
{ "sentiment": "...", "category": "..." }`;

        const completion = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [{ role: "user", content: prompt }],
        });

        const result = JSON.parse(completion.choices[0].message.content.match(/\{[\s\S]*\}/)[0]);
        
        review.sentiment = result.sentiment;
        review.category = result.category;
        review.status = "processed";
        await review.save();

        res.json(review);
    } catch (err) {
        console.error("Analysis error:", err);
        res.status(500).json({ error: "Analysis failed" });
    }
});

// POST: Generate AI Draft Response
router.post("/respond/:id", async (req, res) => {
    try {
        const review = await Feedback.findById(req.params.id);
        if (!review) return res.status(404).json({ error: "Review not found" });

        const prompt = `Generate a professional, empathetic customer support response for this review:
Rating: ${review.rating}/5
Sentiment: ${review.sentiment}
Category: ${review.category}
Comment: "${review.text}"

The company is Smart Life Companion. Be concise and helpful.`;

        const completion = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [{ role: "user", content: prompt }],
        });

        const draft = completion.choices[0].message.content;
        review.aiResponse = draft;
        await review.save();

        res.json({ aiResponse: draft });
    } catch (err) {
        res.status(500).json({ error: "Draft generation failed" });
    }
});

module.exports = router;
