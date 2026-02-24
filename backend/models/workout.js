// ============================================================
// backend/models/Workout.js
// Logs completed workout sessions per user
// ============================================================

const mongoose = require("mongoose");

const exerciseLogSchema = new mongoose.Schema({
    name: { type: String, required: true },
    sets: { type: Number, default: 0 },
    reps: { type: Number, default: 0 },
    weight: { type: Number, default: 0 },   // kg; 0 = bodyweight
    duration: { type: Number, default: 0 },   // seconds (for planks, cardio)
    notes: { type: String, default: "" },
});

const workoutSchema = new mongoose.Schema(
    {
        userId: { type: String, required: true, index: true },
        date: { type: Date, default: Date.now, index: true },
        name: { type: String, default: "Workout" },  // e.g. "Push Day"
        dayLabel: { type: String, default: "" },          // e.g. "Monday"
        goal: { type: String, default: "" },          // e.g. "Gain muscle"
        exercises: [exerciseLogSchema],
        durationMinutes: { type: Number, default: 0 },
        notes: { type: String, default: "" },
        completed: { type: Boolean, default: true },
    },
    { timestamps: true }
);

// Virtual: total volume (sets × reps × weight) for weighted exercises
workoutSchema.virtual("totalVolume").get(function () {
    return this.exercises.reduce((sum, ex) => {
        if (ex.weight > 0) return sum + ex.sets * ex.reps * ex.weight;
        return sum + ex.sets * ex.reps;
    }, 0);
});

workoutSchema.set("toJSON", { virtuals: true });

module.exports = mongoose.model("Workout", workoutSchema);