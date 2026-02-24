// ============================================================
// backend/routes/workout.js
// Full CRUD for completed workout sessions
// ============================================================

const express = require("express");
const Workout = require("../models/workout");
const auth = require("../middleware/auth");

const router = express.Router();

/* ============================================================
   POST /api/workout
   Log a completed workout session
============================================================ */
router.post("/", auth, async (req, res) => {
    try {
        const userId = req.user.userId;
        const {
            name,
            dayLabel,
            goal,
            exercises,
            durationMinutes,
            notes,
        } = req.body;

        if (!exercises || !Array.isArray(exercises) || exercises.length === 0) {
            return res.status(400).json({ error: "At least one exercise is required." });
        }

        const workout = await Workout.create({
            userId,
            name: name || "Workout",
            dayLabel: dayLabel || "",
            goal: goal || "",
            exercises,
            durationMinutes: durationMinutes || 0,
            notes: notes || "",
            completed: true,
            date: new Date(),
        });

        res.status(201).json({ message: "Workout logged!", workout });
    } catch (err) {
        console.error("Workout log error:", err);
        res.status(500).json({ error: "Failed to log workout" });
    }
});

/* ============================================================
   GET /api/workout/history?days=30&limit=20
   Returns recent workouts for the authenticated user
============================================================ */
router.get("/history", auth, async (req, res) => {
    try {
        const userId = req.user.userId;
        const days = req.query.days ? parseInt(req.query.days) : 30;
        const limit = req.query.limit ? parseInt(req.query.limit) : 20;

        const since = new Date();
        since.setDate(since.getDate() - days);

        const workouts = await Workout.find({ userId, date: { $gte: since } })
            .sort({ date: -1 })
            .limit(limit);

        res.json(workouts);
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch workout history" });
    }
});

/* ============================================================
   GET /api/workout/latest
   Most recent workout (for dashboard display)
============================================================ */
router.get("/latest", auth, async (req, res) => {
    try {
        const userId = req.user.userId;
        const latest = await Workout.findOne({ userId }).sort({ date: -1 });
        res.json(latest || null);
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch latest workout" });
    }
});

/* ============================================================
   GET /api/workout/stats
   Aggregated stats: total sessions, volume, streaks
============================================================ */
router.get("/stats", auth, async (req, res) => {
    try {
        const userId = req.user.userId;
        const days = req.query.days ? parseInt(req.query.days) : 30;

        const since = new Date();
        since.setDate(since.getDate() - days);

        const workouts = await Workout.find({ userId, date: { $gte: since } })
            .sort({ date: 1 });

        if (!workouts.length) {
            return res.json({ noData: true, totalSessions: 0, totalVolume: 0, streak: 0 });
        }

        // Total sessions
        const totalSessions = workouts.length;

        // Total volume
        const totalVolume = workouts.reduce((sum, w) => sum + (w.totalVolume || 0), 0);

        // Average session duration
        const avgDuration = Math.round(
            workouts.reduce((s, w) => s + (w.durationMinutes || 0), 0) / totalSessions
        );

        // Current streak (consecutive days working out)
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        let streak = 0;
        let checkDate = new Date(today);
        const workoutDates = new Set(
            workouts.map((w) => {
                const d = new Date(w.date);
                d.setHours(0, 0, 0, 0);
                return d.toDateString();
            })
        );
        for (let i = 0; i <= days; i++) {
            if (workoutDates.has(checkDate.toDateString())) {
                streak++;
                checkDate.setDate(checkDate.getDate() - 1);
            } else {
                break;
            }
        }

        // Volume by day for charting
        const volumeByDay = workouts.map((w) => ({
            date: w.date,
            volume: w.totalVolume || 0,
            name: w.name,
        }));

        res.json({
            totalSessions,
            totalVolume,
            avgDuration,
            streak,
            volumeByDay,
        });
    } catch (err) {
        res.status(500).json({ error: "Failed to calculate workout stats" });
    }
});

/* ============================================================
   GET /api/workout/:id
   Single workout detail
============================================================ */
router.get("/:id", auth, async (req, res) => {
    try {
        const workout = await Workout.findOne({ _id: req.params.id, userId: req.user.userId });
        if (!workout) return res.status(404).json({ error: "Workout not found" });
        res.json(workout);
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch workout" });
    }
});

/* ============================================================
   PUT /api/workout/:id
   Update notes / exercises after logging
============================================================ */
router.put("/:id", auth, async (req, res) => {
    try {
        const workout = await Workout.findOne({ _id: req.params.id, userId: req.user.userId });
        if (!workout) return res.status(404).json({ error: "Workout not found" });

        const { notes, exercises, durationMinutes } = req.body;
        if (notes !== undefined) workout.notes = notes;
        if (exercises !== undefined) workout.exercises = exercises;
        if (durationMinutes !== undefined) workout.durationMinutes = durationMinutes;

        await workout.save();
        res.json({ message: "Workout updated", workout });
    } catch (err) {
        res.status(500).json({ error: "Failed to update workout" });
    }
});

/* ============================================================
   DELETE /api/workout/:id
============================================================ */
router.delete("/:id", auth, async (req, res) => {
    try {
        const workout = await Workout.findOne({ _id: req.params.id, userId: req.user.userId });
        if (!workout) return res.status(404).json({ error: "Workout not found" });
        await Workout.deleteOne({ _id: req.params.id });
        res.json({ message: "Workout deleted" });
    } catch (err) {
        res.status(500).json({ error: "Failed to delete workout" });
    }
});

module.exports = router;