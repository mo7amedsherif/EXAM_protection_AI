// ── Imports ──────────────────────────────────────────────────────────
const mongoose = require("mongoose");

// ── Schema ───────────────────────────────────────────────────────────
const materialSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
      maxlength: [200, "Title cannot exceed 200 characters"],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, "Description cannot exceed 500 characters"],
      default: "",
    },
    subject: {
      type: String,
      required: [true, "Subject is required"],
      trim: true,
    },
    teacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    // Original file name shown to students e.g. "Lecture1.pdf"
    fileName: {
      type: String,
      required: true,
    },
    // Disk path relative to backend root e.g. "uploads/materials/xxx.pdf"
    filePath: {
      type: String,
      required: true,
    },
    fileType: {
      type: String,
      enum: ["pdf", "word", "powerpoint", "other"],
      required: true,
    },
    // Size in bytes
    fileSize: {
      type: Number,
      required: true,
    },
    // false = hidden from students, still visible to teacher
    isVisible: {
      type: Boolean,
      default: true,
    },
    downloadCount: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

// ── Export ────────────────────────────────────────────────────────────
module.exports = mongoose.model("Material", materialSchema);
