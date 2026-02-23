// ============================================================
//  backend/models/User.js
//
//  Supports:
//  - Email/Password login
//  - Google login (Firebase)
//  - Account linking (both)
//  - Password reset flow
// ============================================================

const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
    {
        // ─────────────────────────────────────────────
        // Core Identity Fields
        // ─────────────────────────────────────────────
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

        // Password required ONLY for local users
        password: {
            type: String,
            required: function () {
                return this.authProvider === "local";
            },
        },

        // ─────────────────────────────────────────────
        // Google OAuth Fields
        // ─────────────────────────────────────────────
        googleId: {
            type: String,
            default: null,
        },

        avatar: {
            type: String,
            default: null,
        },

        authProvider: {
            type: String,
            enum: ["local", "google", "both"],
            default: "local",
        },

        // ─────────────────────────────────────────────
        // Password Reset
        // ─────────────────────────────────────────────
        passwordResetToken: {
            type: String,
            default: undefined,
        },

        passwordResetExpires: {
            type: Date,
            default: undefined,
        },

        // ─────────────────────────────────────────────
        // Future onboarding wizard support
        // ─────────────────────────────────────────────
        onboardingComplete: {
            type: Boolean,
            default: false,
        },
    },
    {
        timestamps: true, // createdAt + updatedAt
    }
);

// Index for fast Google login lookups
userSchema.index({ googleId: 1 }, { sparse: true });

module.exports = mongoose.model("User", userSchema);