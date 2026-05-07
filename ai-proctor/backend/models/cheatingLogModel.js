const mongoose = require("mongoose");

const cheatingLogSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    exam: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Exam",
      required: true,
    },
    type: {
      type: String,
      required: true,
      enum: [
        "no_face_detected",
        "multiple_faces",
        "cell_phone_detected",
        "laptop_detected",
        "tab_switch",
        "fullscreen_exit",
        "copy_paste",
        "right_click",
        "devtools_open",
        "window_blur",
        "camera_obstruction",
        "microphone_muted",
        "unauthorized_device",
        "suspicious_movement",
        "copy_paste_attempt",
        "right_click_attempt",
        "keyboard_shortcut",
        "browser_dev_tools",
        "screen_recording",
        "unauthorized_access",
        "time_anomaly",
        "answer_pattern_anomaly",
        "speech_detected",
        "other",
      ],
    },
    severity: {
      type: String,
      enum: ["low", "medium", "high", "critical"],
      default: "medium",
    },
    confidence: {
      type: Number,
      min: 0,
      max: 100,
      default: null,
    },
    description: {
      type: String,
      trim: true,
      default: "",
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

cheatingLogSchema.index({ student: 1, exam: 1 });
cheatingLogSchema.index({ exam: 1, type: 1 });
cheatingLogSchema.index({ timestamp: -1 });

module.exports = mongoose.model("CheatingLog", cheatingLogSchema);