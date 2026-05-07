const asyncHandler = require("express-async-handler");
const Result = require("../models/resultModel");
const Exam = require("../models/examModel");
const calculateMarks = require("../utils/calculateMarks");

// @desc   Submit exam answers and calculate score
// @route  POST /api/results
// @access Student only
const submitExam = asyncHandler(async (req, res) => {
  const { examId, answers, terminated } = req.body;

  if (!examId || !answers || !Array.isArray(answers)) {
    res.status(400);
    throw new Error("Please provide examId and answers array");
  }

  const exam = await Exam.findById(examId);
  if (!exam) {
    res.status(404);
    throw new Error("Exam not found");
  }

  const existing = await Result.findOne({
    student: req.user._id,
    exam: examId,
  });
  if (existing) {
    res.status(409);
    throw new Error("You have already submitted this exam");
  }

  const { score, totalMarks, percentage } = await calculateMarks(
    examId,
    answers,
    exam
  );

  const result = await Result.create({
    student: req.user._id,
    exam: examId,
    answers,
    score,
    totalMarks,
    percentage,
    terminated: terminated === true,
  });

  res.status(201).json({
    _id: result._id,
    score,
    totalMarks,
    percentage,
    submittedAt: result.submittedAt,
  });
});

// @desc   Get current student's results
// @route  GET /api/results/my
// @access Student only
const getMyResults = asyncHandler(async (req, res) => {
  const results = await Result.find({ student: req.user._id })
    .populate("exam", "title duration")
    .sort("-submittedAt");
  res.json(results);
});

// @desc   Get all results for a specific exam
// @route  GET /api/results/exam/:examId
// @access Teacher only (own exams)
const getExamResults = asyncHandler(async (req, res) => {
  const exam = await Exam.findById(req.params.examId);
  if (!exam) {
    res.status(404);
    throw new Error("Exam not found");
  }

  if (exam.teacher.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error("Not authorized to view results for this exam");
  }

  const results = await Result.find({ exam: req.params.examId })
    .populate("student", "name email")
    .sort("-submittedAt");
  res.json(results);
});

module.exports = { submitExam, getMyResults, getExamResults };