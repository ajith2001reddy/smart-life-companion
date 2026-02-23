const mongoose = require("mongoose");

const mealSchema = new mongoose.Schema({
    name: { type: String, required: true },
    calories: { type: Number, default: 0 },
    protein: { type: Number, default: 0 },
    carbs: { type: Number, default: 0 },
    fat: { type: Number, default: 0 },
    time: { type: String, default: "Anytime" }, // Breakfast, Lunch, Dinner, Snack
});

const nutritionSchema = new mongoose.Schema({
    userId: { type: String, required: true },
    date: { type: Date, default: Date.now },
    targetCalories: { type: Number, default: 2200 },
    targetProtein: { type: Number, default: 150 },
    targetCarbs: { type: Number, default: 210 },
    targetFat: { type: Number, default: 65 },
    meals: [mealSchema],
});

// Virtual: total calories from meals
nutritionSchema.virtual("totalCalories").get(function () {
    return this.meals.reduce((sum, m) => sum + m.calories, 0);
});

nutritionSchema.virtual("totalProtein").get(function () {
    return this.meals.reduce((sum, m) => sum + m.protein, 0);
});

nutritionSchema.virtual("totalCarbs").get(function () {
    return this.meals.reduce((sum, m) => sum + m.carbs, 0);
});

nutritionSchema.virtual("totalFat").get(function () {
    return this.meals.reduce((sum, m) => sum + m.fat, 0);
});

nutritionSchema.set("toJSON", { virtuals: true });

module.exports = mongoose.model("Nutrition", nutritionSchema);