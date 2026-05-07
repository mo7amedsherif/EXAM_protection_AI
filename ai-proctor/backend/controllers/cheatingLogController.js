const asyncHandler = require("express-async-handler");
const CheatingLog = require("../models/cheatingLogModel");
const Exam = require("../models/examModel");

// Severity map — auto-assign if not provided by client
const SEVERITY_MAP = {
  no_face_detected:       "high",
  multiple_faces:         "critical",
  cell_phone_detected:    "critical",
  laptop_detected:        "critical",
  tab_switch:             "medium",
  fullscreen_exit:        "low",
  copy_paste:             "medium",
  right_click:            "low",
  devtools_open:          "high",
  window_blur:            "medium",
  camera_obstruction:     "high",
  microphone_muted:       "low",
  unauthorized_device:    "critical",
  suspicious_movement:    "medium",
  copy_paste_attempt:     "medium",
  right_click_attempt:    "low",
  keyboard_shortcut:      "medium",
  browser_dev_tools:      "high",
  screen_recording:       "critical",
  unauthorized_access:    "critical",
  time_anomaly:           "high",
  answer_pattern_anomaly: "high",
  speech_detected:        "high",
  other:                  "medium",
};

// @desc   Log a cheating event from the proctoring engine
// @route  POST /api/cheating-logs
// @access Student only
const logCheatingEvent = asyncHandler(async (req, res) => {
  const { examId, type, confidence, description } = req.body;

  if (!examId || !type) {
    res.status(400);
    throw new Error("Please provide examId and type");
  }

  const exam = await Exam.findById(examId);
  if (!exam) {
    res.status(404);
    throw new Error("Exam not found");
  }

  const log = await CheatingLog.create({
    student:     req.user._id,
    exam:        examId,
    type,
    severity:    SEVERITY_MAP[type] || "medium",
    confidence:  confidence ?? null,
    description: description || "",
  });

  res.status(201).json(log);
});

// @desc   Get all cheating logs for an exam
// @route  GET /api/cheating-logs/exam/:examId
// @access Teacher only (own exams)
const getExamCheatingLogs = asyncHandler(async (req, res) => {
  const exam = await Exam.findById(req.params.examId);
  if (!exam) {
    res.status(404);
    throw new Error("Exam not found");
  }

  if (exam.teacher.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error("Not authorized to view cheating logs for this exam");
  }

  const { type, severity } = req.query;
  const filter = { exam: req.params.examId };
  if (type)     filter.type = type;
  if (severity) filter.severity = severity;

  const logs = await CheatingLog.find(filter)
    .populate("student", "name email")
    .sort("-timestamp");

  res.json(logs);
});

// @desc   Get cheating logs for one student in one exam
// @route  GET /api/cheating-logs/exam/:examId/student/:studentId
// @access Teacher only (own exams)
const getStudentCheatingLogs = asyncHandler(async (req, res) => {
  const exam = await Exam.findById(req.params.examId);
  if (!exam) {
    res.status(404);
    throw new Error("Exam not found");
  }

  if (exam.teacher.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error("Not authorized to view these logs");
  }

  const logs = await CheatingLog.find({
    exam:    req.params.examId,
    student: req.params.studentId,
  })
    .populate("student", "name email")
    .sort("-timestamp");

  res.json(logs);
});

// @desc   Get cheating summary per student for an exam
// @route  GET /api/cheating-logs/exam/:examId/summary
// @access Teacher only (own exams)
const getExamCheatingSummary = asyncHandler(async (req, res) => {
  const exam = await Exam.findById(req.params.examId);
  if (!exam) {
    res.status(404);
    throw new Error("Exam not found");
  }

  if (exam.teacher.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error("Not authorized");
  }

  const summary = await CheatingLog.aggregate([
    { $match: { exam: exam._id } },
    {
      $group: {
        _id:      "$student",
        total:    { $sum: 1 },
        critical: { $sum: { $cond: [{ $eq: ["$severity", "critical"] }, 1, 0] } },
        high:     { $sum: { $cond: [{ $eq: ["$severity", "high"] }, 1, 0] } },
        types:    { $addToSet: "$type" },
      },
    },
    {
      $lookup: {
        from:         "users",
        localField:   "_id",
        foreignField: "_id",
        as:           "student",
      },
    },
    { $unwind: "$student" },
    {
      $project: {
        student: { name: 1, email: 1 },
        total:   1,
        critical:1,
        high:    1,
        types:   1,
      },
    },
    { $sort: { critical: -1, total: -1 } },
  ]);

  res.json(summary);
});

module.exports = {
  logCheatingEvent,
  getExamCheatingLogs,
  getStudentCheatingLogs,
  getExamCheatingSummary,
};