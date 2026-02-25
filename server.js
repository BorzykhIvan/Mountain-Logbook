const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");

dotenv.config();

const authRoutes = require("./routes/auth");
const tripRoutes = require("./routes/trips");

const app = express();

// Core middleware.
app.use(cors());
app.use(express.json());

// API routes.
app.use("/api/auth", authRoutes);
app.use("/api/trips", tripRoutes);

// Health check route.
app.get("/api/health", (req, res) => {
  return res.status(200).json({ status: "ok" });
});

// Fallback for unknown routes.
app.use((req, res) => {
  return res.status(404).json({ message: "Route not found" });
});

// Centralized error handler.
app.use((err, req, res, next) => {
  console.error(err);
  return res.status(500).json({ message: "Internal server error" });
});

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  if (!process.env.MONGO_URI) {
    throw new Error("MONGO_URI is not set in environment variables");
  }

  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is not set in environment variables");
  }

  await mongoose.connect(process.env.MONGO_URI);
  console.log("MongoDB connected successfully");

  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
};

startServer().catch((error) => {
  console.error("Failed to start server:", error.message);
  process.exit(1);
});
