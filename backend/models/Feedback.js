const mongoose = require("mongoose");

const feedbackSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: false, // Can be anonymous or from external survey
        },
        author: {
            type: String,
            required: true,
            default: "Anonymous User",
        },
        text: {
            type: String,
            required: true,
        },
        rating: {
            type: Number,
            min: 1,
            max: 5,
        },
        sentiment: {
            type: String,
            enum: ["Positive", "Neutral", "Negative", "Pending"],
            default: "Pending",
        },
        category: {
            type: String,
            default: "General",
        },
        aiResponse: {
            type: String,
            default: "",
        },
        status: {
            type: String,
            enum: ["pending", "processed", "sent"],
            default: "pending",
        },
        metadata: {
            os: String,
            appVersion: String,
            device: String,
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model("Feedback", feedbackSchema);
