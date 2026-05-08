// ── Imports ──────────────────────────────────────────────────────────
const express = require("express");
const router = express.Router();
const {
  submitExam,
  getMyResults,
  getExamResults,
  toggleResultVisibility,
  deleteResult,
} = require("../controllers/resultController");
const { protect, authorizeRoles } = require("../middleware/authMiddleware");

// ── Middleware: require authentication for all routes ─────────────
router.use(protect);

// ── Routes ───────────────────────────────────────────────────────────
router.post("/",              authorizeRoles("student"), submitExam);
router.get("/my",             authorizeRoles("student"), getMyResults);
router.get("/exam/:examId",   authorizeRoles("teacher"), getExamResults);
router.put("/:id/visibility", authorizeRoles("teacher"), toggleResultVisibility);
router.delete("/:id",         authorizeRoles("teacher"), deleteResult);

// ── Export ────────────────────────────────────────────────────────────
module.exports = router;