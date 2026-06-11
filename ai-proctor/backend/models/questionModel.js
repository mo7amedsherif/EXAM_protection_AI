const mongoose = require("mongoose");

const questionSchema = new mongoose.Schema(
  {
    exam: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Exam",
      required: false,
    },
    text: {
      type: String,
      required: [true, "Question text is required"],
      trim: true,
    },
    options: {
      type: [String],
      validate: {
        validator: (val) => val.length === 4,
        message: "Each question must have exactly 4 options",
      },
    },
    correctOption: {
      type: Number,
      required: [true, "Correct option index is required"],
      min: 0,
      max: 3,
    },
    marks: {
      type: Number,
      default: 1,
      min: 1,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    teacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    source: {
      type: String,
      enum: ['manual', 'ai_generated', 'warehouse'],
      default: 'manual',
    },
    tags: [{
      type: String,
      trim: true,
    }],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Question", questionSchema);