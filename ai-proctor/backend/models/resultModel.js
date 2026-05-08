const mongoose = require("mongoose");

const resultSchema = new mongoose.Schema(
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
    answers: [
      {
        question: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Question",
        },
        selectedOption: {
          type: Number,
          default: null,
        },
      },
    ],
    score:      { type: Number, default: 0 },
    totalMarks: { type: Number, default: 0 },
    percentage: { type: Number, default: 0 },
    terminated: { type: Boolean, default: false },
    visibleToStudent: { type: Boolean, default: true },
    submittedAt:{ type: Date,   default: Date.now },
  },
  { timestamps: true }
);

// Prevent double submission
resultSchema.index({ student: 1, exam: 1 }, { unique: true });

module.exports = mongoose.model("Result", resultSchema);