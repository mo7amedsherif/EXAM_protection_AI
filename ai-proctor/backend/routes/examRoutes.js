const express = require("express");
const router = express.Router();
const {
  createExam,
  getExams,
  getExamById,
  updateExam,
  deleteExam,
} = require("../controllers/examController");

const {
  addQuestion,
  getQuestions,
  deleteQuestion,
  bulkAddQuestions,
} = require("../controllers/questionController");
const { generateQuestions, aiUpload } = require("../controllers/aiQuestionController");
const { protect, authorizeRoles } = require("../middleware/authMiddleware");

router.use(protect);

router.route("/")
  .get(getExams)
  .post(authorizeRoles("teacher"), createExam);

router.route("/:id")
  .get(getExamById)
  .put(authorizeRoles("teacher"), updateExam)
  .delete(authorizeRoles("teacher"), deleteExam);

router.route("/:examId/questions")
  .get(getQuestions)
  .post(authorizeRoles("teacher"), addQuestion);

router.route("/:examId/questions/bulk")
  .post(authorizeRoles("teacher"), bulkAddQuestions);

router.route("/:examId/questions/generate")
  .post(authorizeRoles("teacher"), aiUpload.single("file"), generateQuestions);

router.route("/:examId/questions/:questionId")
  .delete(authorizeRoles("teacher"), deleteQuestion);

module.exports = router;