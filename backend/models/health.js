const mongoose = require("mongoose");

const healthSchema = new mongoose.Schema({
    userId: {
        type: String,
        required: true,
    },
    date: {
        type: Date,
        default: Date.now,
    },
    steps: {
        type: Number,
        default: 0,
    },
    heartRate: {
        type: Number,
        default: 0,
    },
    sleepHours: {
        type: Number,
        default: 0,
    },
    restingHR: {
        type: Number,
        default: 0,
    },
    caloriesBurned: {
        type: Number,
        default: 0,
    },
});

module.exports = mongoose.model("Health", healthSchema);
