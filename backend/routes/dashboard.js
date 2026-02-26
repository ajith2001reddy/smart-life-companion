// backend/routes/dashboard.js
// Returns REAL per-user analytics from the Workout collection.
// Requires JWT auth — every user sees only their own data.
// New users get all zeros.

const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const Workout = require("../models/workout");

/**
 * GET /api/dashboard
 * Returns performanceScore, weeklyVolume, completionRate, weeklyStats
 * All calculated from the logged-in user's actual workout data.
 */
router.get("/", auth, async (req, res) => {
    try {
        const userId = req.user.userId;

        // ── Get this week's workouts (Mon → today) ──────────────────
        const now = new Date();
        const dayOfWeek = now.getDay(); // 0=Sun, 1=Mon...
        const monday = new Date(now);
        monday.setDate(now.getDate() - ((dayOfWeek + 6) % 7)); // roll back to Monday
        monday.setHours(0, 0, 0, 0);

        const workouts = await Workout.find({
            userId,
            date: { $gte: monday },
        }).sort({ date: 1 });

        // ── Build weeklyStats (Mon–Sun) ─────────────────────────────
        const dayNames = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
        const volumeByDay = { Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0, Sat: 0, Sun: 0 };

        for (const w of workouts) {
            const d = new Date(w.date);
            // getDay(): 0=Sun,1=Mon...6=Sat → map to Mon=0 index
            const idx = (d.getDay() + 6) % 7; // Mon=0 ... Sun=6
            const dayName = dayNames[idx];
            volumeByDay[dayName] += w.totalVolume || 0;
        }

        const weeklyStats = dayNames.map((day) => ({
            day,
            volume: volumeByDay[day],
        }));

        // ── Weekly totals ───────────────────────────────────────────
        const weeklyVolume = Object.values(volumeByDay).reduce((a, b) => a + b, 0);
        const daysWorkedOut = Object.values(volumeByDay).filter((v) => v > 0).length;

        // ── Completion rate: days worked out / 6 target days × 100 ──
        const completionRate = Math.round((daysWorkedOut / 6) * 100);

        // ── Performance score: weighted formula ─────────────────────
        // Based on volume consistency + completion rate
        // 0 workouts → 0, great week → up to 100
        let performanceScore = 0;
        if (workouts.length > 0) {
            const volumeScore = Math.min((weeklyVolume / 15000) * 100, 100); // 15000 reps = perfect
            const consistencyScore = completionRate;
            performanceScore = Math.round(volumeScore * 0.5 + consistencyScore * 0.5);
        }

        res.json({
            performanceScore,
            weeklyVolume,
            completionRate,
            weeklyStats,
        });

    } catch (err) {
        console.error("Dashboard error:", err);
        res.status(500).json({ error: "Failed to load dashboard data" });
    }
});

module.exports = router;