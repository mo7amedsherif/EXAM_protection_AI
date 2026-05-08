// ── Imports ──────────────────────────────────────────────────────────
const express = require("express");
const router = express.Router();
const { protect, teacherOnly } = require("../middleware/authMiddleware");
const {
  upload,
  uploadMaterial,
  getMaterials,
  getAllMaterials,
  toggleVisibility,
  replaceMaterial,
  updateMaterial,
  deleteMaterial,
  generateViewToken,
  downloadMaterial,
} = require("../controllers/materialController");

// ── Routes ───────────────────────────────────────────────────────────
router.get("/",                 protect,               getAllMaterials);
router.get("/my",               protect, teacherOnly,   getMaterials);
router.post("/",                protect, teacherOnly,   upload.single("file"), uploadMaterial);
router.put("/:id",              protect, teacherOnly,   updateMaterial);
router.put("/:id/file",         protect, teacherOnly,   upload.single("file"), replaceMaterial);
router.patch("/:id/visibility", protect, teacherOnly,   toggleVisibility);
router.delete("/:id",           protect, teacherOnly,   deleteMaterial);
router.get("/:id/view-token",   protect,               generateViewToken);
router.get("/:id/download",     protect,               downloadMaterial);

// ── Export ────────────────────────────────────────────────────────────
module.exports = router;
