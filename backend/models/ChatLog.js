// ============================================================
// backend/models/ChatLog.js
// Persists AI Coach conversation history per user (rolling window)
// ============================================================

const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema({
    role: { type: String, enum: ["user", "assistant", "system"], required: true },
    content: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
});

const chatLogSchema = new mongoose.Schema(
    {
        userId: { type: String, required: true, unique: true, index: true },
        messages: {
            type: [messageSchema],
            default: [],
            // Only keep the last 40 messages to keep context window sane
        },
        updatedAt: { type: Date, default: Date.now },
    },
    { timestamps: true }
);

// Trim to last 40 messages before saving
chatLogSchema.pre("save", function (next) {
    const MAX = 40;
    if (this.messages.length > MAX) {
        this.messages = this.messages.slice(-MAX);
    }
    this.updatedAt = new Date();
    next();
});

module.exports = mongoose.model("ChatLog", chatLogSchema);