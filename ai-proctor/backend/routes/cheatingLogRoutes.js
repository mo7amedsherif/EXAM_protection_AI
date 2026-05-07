const express = require("express");
const router = express.Router();
const {
  logCheatingEvent,
  getExamCheatingLogs,
  getStudentCheatingLogs,
  getExamCheatingSummary,
} = require("../controllers/cheatingLogController");
const { protect, authorizeRoles } = require("../middleware/authMiddleware");

router.use(protect);

router.post("/",
  authorizeRoles("student"),
  logCheatingEvent
);

router.get("/exam/:examId",
  authorizeRoles("teacher"),
  getExamCheatingLogs
);

router.get("/exam/:examId/summary",
  authorizeRoles("teacher"),
  getExamCheatingSummary
);

router.get("/exam/:examId/student/:studentId",
  authorizeRoles("teacher"),
  getStudentCheatingLogs
);

module.exports = router;