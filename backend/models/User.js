// ============================================================
// backend/models/User.js  (FULL REPLACEMENT)
// Added: goals subdocument, lastHealthSync field
// ============================================================

const mongoose = require("mongoose");

const goalsSchema = new mongoose.Schema(
    {
        fitnessGoal: { type: String, default: "Maintain" },
        weeklySteps: { type: Number, default: 70000 },
        dailyCalories: { type: Number, default: 2200 },
        sleepTarget: { type: Number, default: 8 },
        weightTarget: { type: String, default: "" },
    },
    { _id: false }
);

const userSchema = new mongoose.Schema(
    {
        // ── Core Identity ────────────────────────────────
        name: {
            type: String,
            required: true,
            trim: true,
        },
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
        },
        password: {
            type: String,
            required: function () {
                return this.authProvider === "local";
            },
        },

        // ── Google OAuth ─────────────────────────────────
        googleId: { type: String, default: null },
        avatar: { type: String, default: null },
        authProvider: {
            type: String,
            enum: ["local", "google", "both"],
            default: "local",
        },

        // ── Password Reset ───────────────────────────────
        passwordResetToken: { type: String, default: undefined },
        passwordResetExpires: { type: Date, default: undefined },

        // ── Goals (persisted to backend) ─────────────────
        goals: { type: goalsSchema, default: () => ({}) },

        // ── Apple Shortcut sync timestamp ────────────────
        lastHealthSync: { type: Date, default: null },

        // ── Onboarding ───────────────────────────────────
        onboardingComplete: { type: Boolean, default: false },
    },
    { timestamps: true }
);

userSchema.index({ googleId: 1 }, { sparse: true });

module.exports = mongoose.model("User", userSchema);