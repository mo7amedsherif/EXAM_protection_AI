const mongoose = require("mongoose");

const examSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Exam title is required"],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      default: "",
    },
    duration: {
      type: Number,
      required: [true, "Exam duration is required"],
      min: [1, "Duration must be at least 1 minute"],
    },
    teacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isPublished: {
      type: Boolean,
      default: false,
    },
    totalMarks: {
      type: Number,
      default: 0,
      min: 0,
    },
    proctoringOptions: {
      faceDetection:      { type: Boolean, default: true },
      headPose:           { type: Boolean, default: true },
      objectDetection:    { type: Boolean, default: true },
      voiceDetection:     { type: Boolean, default: true },
      tabSwitchDetection: { type: Boolean, default: true },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Exam", examSchema);