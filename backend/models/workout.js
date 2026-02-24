const workoutSchema = new mongoose.Schema({
    userId: String,
    date: { type: Date, default: Date.now },
    exercises: [{ name: String, sets: Number, reps: Number, weight: Number }],
    duration: Number,
    completed: { type: Boolean, default: false },
    goal: String,
});