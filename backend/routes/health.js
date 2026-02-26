// ============================================================
// backend/routes/health.js  (FULL REPLACEMENT)
// Fix: Apple Shortcut name lookup is now case-insensitive
// ============================================================

const express = require("express");
const Health = require("../models/health");
const User = require("../models/User");
const auth = require("../middleware/auth");

const router = express.Router();

/* ============================================================
   DEBUG — list last 10 records (remove in production)
============================================================ */
router.get("/debug", async (req, res) => {
    try {
        const records = await Health.find({}).sort({ date: -1 }).limit(10);
        res.json({ totalRecords: records.length, records });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

/* ============================================================
   APPLE SHORTCUT SYNC — case-insensitive username fix
============================================================ */
router.post("/shortcut", async (req, res) => {
    try {
        const { apiKey, username, steps, heartRate, sleepHours, restingHR, caloriesBurned } = req.body;

        if (!apiKey || apiKey !== process.env.SHORTCUT_API_KEY)
            return res.status(401).json({ error: "Invalid API key" });
        if (!username)
            return res.status(400).json({ error: "username is required" });

        // ✅ FIX: case-insensitive regex search instead of exact match
        const user = await User.findOne({
            name: { $regex: new RegExp(`^${username.trim()}$`, "i") },
        });

        if (!user)
            return res.status(404).json({
                error: `No user found with username "${username}"`,
            });

        const newHealth = await Health.create({
            userId: user._id.toString(),
            steps: Number(steps) || 0,
            heartRate: heartRate ? Math.round(Number(heartRate) * 10) / 10 : 0,
            sleepHours: sleepHours ? Math.round(Number(sleepHours) * 10) / 10 : 0,
            restingHR: restingHR ? Math.round(Number(restingHR) * 10) / 10 : 0,
            caloriesBurned: caloriesBurned ? Math.round(Number(caloriesBurned) * 10) / 10 : 0,
            date: new Date(),
        });

        // Update lastSync timestamp for activity log display
        await User.findByIdAndUpdate(user._id, {
            $set: { lastHealthSync: new Date() },
        });

        res.json({
            success: true,
            message: `Health data synced for ${user.name} ✅`,
            resolvedUserId: user._id,
            data: newHealth,
        });
    } catch (err) {
        console.error("Shortcut Sync Error:", err);
        res.status(500).json({ error: "Sync failed", details: err.message });
    }
});

/* ============================================================
   SAVE HEALTH DATA (JWT-authenticated)
============================================================ */
router.post("/sync", auth, async (req, res) => {
    try {
        const userId = req.user.userId;
        const { steps, heartRate, sleepHours, restingHR, caloriesBurned } = req.body;

        const newHealth = await Health.create({
            userId,
            steps: Number(steps) || 0,
            heartRate: Number(heartRate) || 0,
            sleepHours: Number(sleepHours) || 0,
            restingHR: Number(restingHR) || 0,
            caloriesBurned: Number(caloriesBurned) || 0,
            date: new Date(),
        });

        res.json({ message: "Health data saved", data: newHealth });
    } catch (err) {
        res.status(500).json({ error: "Health sync failed", details: err.message });
    }
});

/* ============================================================
   GET LATEST health entry
============================================================ */
router.get("/latest", auth, async (req, res) => {
    try {
        const userId = req.user.userId;
        const latest = await Health.findOne({ userId }).sort({ date: -1 });
        res.json(latest || null);
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch latest health data" });
    }
});

/* ============================================================
   GET HISTORY
   GET /api/health/history?days=30
============================================================ */
router.get("/history", auth, async (req, res) => {
    try {
        const userId = req.user.userId;
        const days = req.query.days ? parseInt(req.query.days) : null;

        let query = { userId };
        if (days && days > 0) {
            const since = new Date();
            since.setDate(since.getDate() - days);
            query.date = { $gte: since };
        }

        const history = await Health.find(query).sort({ date: 1 });
        res.json(history);
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch health history" });
    }
});

/* ============================================================
   GET STATS SUMMARY
   GET /api/health/stats?days=30
============================================================ */
router.get("/stats", auth, async (req, res) => {
    try {
        const userId = req.user.userId;
        const days = req.query.days ? parseInt(req.query.days) : 30;

        const since = new Date();
        since.setDate(since.getDate() - days);

        const records = await Health.find({ userId, date: { $gte: since } }).sort({ date: 1 });
        if (!records.length) return res.json({ noData: true });

        const avg = (arr) => arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;
        const max = (arr) => arr.length ? Math.max(...arr) : 0;

        const steps = records.map((r) => r.steps);
        const hr = records.map((r) => r.heartRate).filter((v) => v > 0);
        const sleep = records.map((r) => r.sleepHours).filter((v) => v > 0);
        const cals = records.map((r) => r.caloriesBurned).filter((v) => v > 0);

        const mid = Math.floor(records.length / 2);
        const trend = (key) => {
            const fh = records.slice(0, mid).map((r) => r[key]).filter((v) => v > 0);
            const sh = records.slice(mid).map((r) => r[key]).filter((v) => v > 0);
            const a = avg(fh), b = avg(sh);
            return a === 0 ? 0 : Math.round(((b - a) / a) * 100);
        };

        res.json({
            totalRecords: records.length,
            period: days,
            averages: {
                steps: Math.round(avg(steps)),
                heartRate: Math.round(avg(hr)),
                sleepHours: Math.round(avg(sleep) * 10) / 10,
                caloriesBurned: Math.round(avg(cals)),
            },
            bests: {
                steps: max(steps),
                sleepHours: max(sleep),
                caloriesBurned: max(cals),
            },
            trends: {
                steps: trend("steps"),
                heartRate: trend("heartRate"),
                sleepHours: trend("sleepHours"),
                caloriesBurned: trend("caloriesBurned"),
            },
        });
    } catch (err) {
        res.status(500).json({ error: "Failed to calculate stats", details: err.message });
    }
});

/* ============================================================
   READINESS SCORE
============================================================ */
router.get("/readiness", auth, async (req, res) => {
    try {
        const userId = req.user.userId;
        const latest = await Health.findOne({ userId }).sort({ date: -1 });

        if (!latest)
            return res.json({ readinessScore: 0, message: "No health data synced yet.", noData: true });

        let score = 50;
        if (latest.sleepHours >= 7) score += 20;
        if (latest.restingHR <= 60) score += 15;
        if (latest.steps >= 8000) score += 10;
        if (latest.heartRate <= 75) score += 5;
        score = Math.min(score, 100);

        res.json({
            readinessScore: score,
            message:
                score > 80 ? "Your body is fully recovered. High intensity training recommended."
                    : score > 60 ? "Moderate recovery. Train smart today."
                        : "Low recovery. Focus on rest and mobility.",
            noData: false,
            factors: {
                sleep: latest.sleepHours,
                restingHR: latest.restingHR,
                steps: latest.steps,
                heartRate: latest.heartRate,
            },
        });
    } catch (err) {
        res.status(500).json({ error: "Failed to calculate readiness", details: err.message });
    }
});

/* ============================================================
   DELETE A RECORD
============================================================ */
router.delete("/:id", auth, async (req, res) => {
    try {
        const userId = req.user.userId;
        const record = await Health.findOne({ _id: req.params.id, userId });
        if (!record) return res.status(404).json({ error: "Record not found" });
        await Health.deleteOne({ _id: req.params.id });
        res.json({ message: "Record deleted" });
    } catch (err) {
        res.status(500).json({ error: "Delete failed" });
    }
});

module.exports = router;