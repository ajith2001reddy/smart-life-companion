const express = require("express");

const router = express.Router();

/**
 * GET /api/dashboard/stats
 */
router.get("/", (req, res) => {
    res.json({
        performanceScore: 82,
        weeklyVolume: 14200,
        completionRate: 75,
        weeklyStats: [
            { day: "Mon", volume: 2000 },
            { day: "Tue", volume: 2200 },
            { day: "Wed", volume: 1800 },
            { day: "Thu", volume: 2500 },
            { day: "Fri", volume: 2700 },
            { day: "Sat", volume: 3000 },
            { day: "Sun", volume: 0 },
        ],
    });
});


module.exports = router;
