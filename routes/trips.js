const express = require("express");
const mongoose = require("mongoose");
const auth = require("../middleware/auth");
const upload = require("../middleware/upload");
const cloudinary = require("../config/cloudinary");
const Trip = require("../models/Trip");
const { fetchHistoricalWeather } = require("../services/weatherService");

const router = express.Router();

// Applies JWT authentication to all trip endpoints.
router.use(auth);

// Uploads an in-memory image file to Cloudinary and returns secure URL.
const uploadTripImage = (fileBuffer) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { folder: "mountain-logbook/trips", resource_type: "image" },
      (error, result) => {
        if (error) {
          return reject(error);
        }

        return resolve(result.secure_url);
      }
    );

    uploadStream.end(fileBuffer);
  });
};

// Runs Multer single-file parser and converts its errors to HTTP responses.
const parseImageUpload = (req, res) => {
  return new Promise((resolve, reject) => {
    upload.single("image")(req, res, (error) => {
      if (!error) {
        return resolve();
      }

      if (error.name === "MulterError") {
        if (error.code === "LIMIT_FILE_SIZE") {
          return reject({ status: 400, message: "Image is too large (max 5MB)" });
        }

        return reject({ status: 400, message: "Invalid image upload payload" });
      }

      return reject({ status: 400, message: error.message || "Image upload failed" });
    });
  });
};

/**
 * @route   POST /api/trips
 * @desc    Create a new trip for authenticated user
 * @access  Private
 */
router.post("/", async (req, res) => {
  try {
    await parseImageUpload(req, res);

    const { title, location, date, distance, elevationGain, difficulty, notes } = req.body;

    if (!title || !date) {
      return res.status(400).json({ message: "Title and date are required" });
    }

    const normalizedLocation = location ? String(location).trim() : "Tatry";

    // Weather API failures should not block trip creation.
    let weatherSummary = "Weather unavailable";
    try {
      weatherSummary = await fetchHistoricalWeather({
        date,
        mountain: normalizedLocation,
      });
    } catch (weatherError) {
      console.error("Historical weather lookup failed:", weatherError.message);
    }

    let uploadedImageUrl;
    if (req.file) {
      uploadedImageUrl = await uploadTripImage(req.file.buffer);
    }

    const trip = await Trip.create({
      user: req.user.id,
      title: String(title).trim(),
      location: normalizedLocation,
      date,
      distance,
      elevationGain,
      difficulty: difficulty ? String(difficulty).trim() : undefined,
      weather: weatherSummary,
      notes: notes ? String(notes).trim() : undefined,
      imageUrl: uploadedImageUrl,
    });

    return res.status(201).json({
      message: "Trip created successfully",
      trip,
    });
  } catch (error) {
    if (error.status) {
      return res.status(error.status).json({ message: error.message });
    }

    if (error.name === "ValidationError") {
      return res.status(400).json({ message: error.message });
    }

    if (error.http_code) {
      return res.status(400).json({ message: "Failed to upload image to Cloudinary" });
    }

    return res.status(500).json({ message: "Server error while creating trip" });
  }
});

/**
 * @route   GET /api/trips
 * @desc    List all trips for authenticated user
 * @access  Private
 */
router.get("/", async (req, res) => {
  try {
    const trips = await Trip.find({ user: req.user.id }).sort({ date: -1, createdAt: -1 });
    return res.status(200).json({ trips });
  } catch (error) {
    return res.status(500).json({ message: "Server error while fetching trips" });
  }
});

/**
 * @route   GET /api/trips/:id
 * @desc    Get one trip by id for authenticated user
 * @access  Private
 */
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid trip id" });
    }

    const trip = await Trip.findOne({ _id: id, user: req.user.id });
    if (!trip) {
      return res.status(404).json({ message: "Trip not found" });
    }

    return res.status(200).json({ trip });
  } catch (error) {
    return res.status(500).json({ message: "Server error while fetching trip" });
  }
});

/**
 * @route   PUT /api/trips/:id
 * @desc    Update one trip by id for authenticated user
 * @access  Private
 */
router.put("/:id", async (req, res) => {
  try {
    await parseImageUpload(req, res);

    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid trip id" });
    }

    const updates = {};
    const allowedFields = [
      "title",
      "location",
      "date",
      "distance",
      "elevationGain",
      "difficulty",
      "weather",
      "notes",
    ];

    for (const field of allowedFields) {
      if (Object.prototype.hasOwnProperty.call(req.body, field)) {
        const value = req.body[field];
        updates[field] = typeof value === "string" ? value.trim() : value;
      }
    }

    if (req.file) {
      updates.imageUrl = await uploadTripImage(req.file.buffer);
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ message: "No valid fields provided for update" });
    }

    const trip = await Trip.findOneAndUpdate({ _id: id, user: req.user.id }, updates, {
      new: true,
      runValidators: true,
    });

    if (!trip) {
      return res.status(404).json({ message: "Trip not found" });
    }

    return res.status(200).json({
      message: "Trip updated successfully",
      trip,
    });
  } catch (error) {
    if (error.status) {
      return res.status(error.status).json({ message: error.message });
    }

    if (error.name === "ValidationError") {
      return res.status(400).json({ message: error.message });
    }

    if (error.http_code) {
      return res.status(400).json({ message: "Failed to upload image to Cloudinary" });
    }

    return res.status(500).json({ message: "Server error while updating trip" });
  }
});

/**
 * @route   DELETE /api/trips/:id
 * @desc    Delete one trip by id for authenticated user
 * @access  Private
 */
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid trip id" });
    }

    const trip = await Trip.findOneAndDelete({ _id: id, user: req.user.id });
    if (!trip) {
      return res.status(404).json({ message: "Trip not found" });
    }

    return res.status(200).json({ message: "Trip deleted successfully" });
  } catch (error) {
    return res.status(500).json({ message: "Server error while deleting trip" });
  }
});

module.exports = router;
