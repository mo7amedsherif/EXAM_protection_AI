const asyncHandler = require("express-async-handler");
const Exam = require("../models/examModel");
const Question = require("../models/questionModel");

// @desc   Create a new exam
// @route  POST /api/exams
// @access Teacher only
const createExam = asyncHandler(async (req, res) => {
  const { title, description, duration } = req.body;

  if (!title || !duration) {
    res.status(400);
    throw new Error("Please provide title and duration");
  }

  const exam = await Exam.create({
    title,
    description,
    duration,
    teacher: req.user._id,
  });

  res.status(201).json(exam);
});

// @desc   Get all exams
// @route  GET /api/exams
// @access Teacher gets own exams — Student gets all active exams
const getExams = asyncHandler(async (req, res) => {
  let exams;

  if (req.user.role === "teacher") {
    exams = await Exam.find({ teacher: req.user._id }).sort("-createdAt");
  } else {
    exams = await Exam.find({ isActive: true })
      .populate("teacher", "name email")
      .sort("-createdAt");
  }

  res.json(exams);
});

// @desc   Get single exam by ID
// @route  GET /api/exams/:id
// @access Private
const getExamById = asyncHandler(async (req, res) => {
  const exam = await Exam.findById(req.params.id).populate(
    "teacher",
    "name email"
  );

  if (!exam) {
    res.status(404);
    throw new Error("Exam not found");
  }

  res.json(exam);
});

// @desc   Update exam
// @route  PUT /api/exams/:id
// @access Teacher only (own exams)
const updateExam = asyncHandler(async (req, res) => {
  const exam = await Exam.findById(req.params.id);

  if (!exam) {
    res.status(404);
    throw new Error("Exam not found");
  }

  if (exam.teacher.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error("Not authorized to update this exam");
  }

  const { title, description, duration, isActive } = req.body;

  if (duration !== undefined && duration < 1) {
    res.status(400);
    throw new Error("Duration must be at least 1 minute");
  }

  exam.title       = title       ?? exam.title;
  exam.description = description ?? exam.description;
  exam.duration    = duration    ?? exam.duration;
  exam.isActive    = isActive    ?? exam.isActive;

  const updated = await exam.save();
  res.json(updated);
});

// @desc   Delete exam and its questions
// @route  DELETE /api/exams/:id
// @access Teacher only (own exams)
const deleteExam = asyncHandler(async (req, res) => {
  const exam = await Exam.findById(req.params.id);

  if (!exam) {
    res.status(404);
    throw new Error("Exam not found");
  }

  if (exam.teacher.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error("Not authorized to delete this exam");
  }

  await Question.deleteMany({ exam: exam._id });
  await exam.deleteOne();

  res.json({ message: "Exam and its questions deleted successfully" });
});

module.exports = {
  createExam,
  getExams,
  getExamById,
  updateExam,
  deleteExam,
};