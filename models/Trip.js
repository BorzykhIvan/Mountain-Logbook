const mongoose = require("mongoose");

// Stores a mountain trip entry that belongs to a specific authenticated user.
const tripSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: [true, "Trip title is required"],
      trim: true,
      minlength: [2, "Title must be at least 2 characters long"],
      maxlength: [200, "Title must be at most 200 characters long"],
    },
    location: {
      type: String,
      default: "Tatry",
      trim: true,
      maxlength: [200, "Location must be at most 200 characters long"],
    },
    date: {
      type: Date,
      required: [true, "Trip date is required"],
    },
    distance: {
      type: Number,
      min: [0, "Distance cannot be negative"],
    },
    elevationGain: {
      type: Number,
      min: [0, "Elevation gain cannot be negative"],
    },
    difficulty: {
      type: String,
      trim: true,
      maxlength: [50, "Difficulty must be at most 50 characters long"],
    },
    weather: {
      type: String,
      trim: true,
      maxlength: [120, "Weather must be at most 120 characters long"],
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [3000, "Notes must be at most 3000 characters long"],
    },
    imageUrl: {
      type: String,
      trim: true,
      maxlength: [1000, "Image URL must be at most 1000 characters long"],
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Trip", tripSchema);
