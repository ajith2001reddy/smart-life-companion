// ============================================================
// backend/routes/auth.js  (FULL REPLACEMENT)
// Added: PUT /goals endpoint for backend goals persistence
// ============================================================

const express = require("express");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const auth = require("../middleware/auth");
const { getAuth } = require("../config/firebase");

const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const uploadDir = path.join(__dirname, "../uploads");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

const storage = multer.diskStorage({
    destination: uploadDir,
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    },
});

const upload = multer({ storage });

/* ============================================================
   FIREBASE LOGIN (Email / Google)
============================================================ */
router.post("/firebase-login", async (req, res) => {
    try {
        const { idToken } = req.body;
        if (!idToken) return res.status(400).json({ error: "No ID token provided" });

        const decoded = await getAuth().verifyIdToken(idToken);
        const { uid, email, name, picture } = decoded;

        if (!email) return res.status(400).json({ error: "Email not available from Firebase" });

        let user = await User.findOne({ email });

        if (!user) {
            user = await User.create({
                name: name || email.split("@")[0],
                email,
                googleId: uid,
                avatar: picture || null,
                authProvider: "google",
            });
        } else {
            if (!user.googleId) user.googleId = uid;
            if (!user.avatar && picture) user.avatar = picture;
            if (user.authProvider === "local") user.authProvider = "both";
            await user.save();
        }

        const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: "7d" });

        res.json({
            token,
            userId: user._id,
            name: user.name,
            email: user.email,
            avatar: user.avatar,
            authProvider: user.authProvider,
        });
    } catch (err) {
        console.error("Firebase auth failed:", err);
        res.status(401).json({ error: "Firebase authentication failed" });
    }
});

/* ============================================================
   GET PROFILE
============================================================ */
router.get("/me", auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.userId).select("-password");
        if (!user) return res.status(404).json({ error: "User not found" });

        // Return userId as string field for Apple Shortcut display
        res.json({ ...user.toJSON(), userId: user._id.toString() });
    } catch (err) {
        console.error("Profile error:", err);
        res.status(500).json({ error: "Failed to fetch profile" });
    }
});

/* ============================================================
   UPDATE PROFILE (name / password)
============================================================ */
router.put("/update", auth, async (req, res) => {
    try {
        const { name, password } = req.body;

        const user = await User.findById(req.user.userId);
        if (!user) return res.status(404).json({ error: "User not found" });

        if (name) user.name = name;
        if (password) user.password = await bcrypt.hash(password, 12);

        await user.save();
        res.json({ message: "Profile updated", name: user.name });
    } catch (err) {
        console.error("Update error:", err);
        res.status(500).json({ error: "Update failed" });
    }
});

/* ============================================================
   SAVE / UPDATE GOALS  ← NEW
   PUT /api/auth/goals
   Body: { fitnessGoal, weeklySteps, dailyCalories, sleepTarget, weightTarget }
============================================================ */
router.put("/goals", auth, async (req, res) => {
    try {
        const {
            fitnessGoal,
            weeklySteps,
            dailyCalories,
            sleepTarget,
            weightTarget,
        } = req.body;

        const user = await User.findById(req.user.userId);
        if (!user) return res.status(404).json({ error: "User not found" });

        // Merge into goals subdocument (create if missing)
        user.goals = {
            fitnessGoal: fitnessGoal ?? user.goals?.fitnessGoal ?? "Maintain",
            weeklySteps: weeklySteps ?? user.goals?.weeklySteps ?? 70000,
            dailyCalories: dailyCalories ?? user.goals?.dailyCalories ?? 2200,
            sleepTarget: sleepTarget ?? user.goals?.sleepTarget ?? 8,
            weightTarget: weightTarget ?? user.goals?.weightTarget ?? "",
        };

        await user.save();
        res.json({ message: "Goals saved", goals: user.goals });
    } catch (err) {
        console.error("Goals save error:", err);
        res.status(500).json({ error: "Failed to save goals" });
    }
});

/* ============================================================
   GET GOALS
============================================================ */
router.get("/goals", auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.userId).select("goals");
        if (!user) return res.status(404).json({ error: "User not found" });
        res.json(user.goals || {});
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch goals" });
    }
});
router.post("/avatar", auth, upload.single("avatar"), async (req, res) => {
    try {
        const user = await User.findById(req.user.userId);
        if (!user) return res.status(404).json({ error: "User not found" });

        user.avatar = `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}`;
        await user.save();

        res.json({ avatar: user.avatar });
    } catch (err) {
        res.status(500).json({ error: "Upload failed" });
    }
});

module.exports = router;