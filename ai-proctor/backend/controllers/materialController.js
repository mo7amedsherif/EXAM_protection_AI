// ── Imports ──────────────────────────────────────────────────────────
const asyncHandler = require("express-async-handler");
const path = require("path");
const fs = require("fs");
const multer = require("multer");
const Material = require("../models/materialModel");

// ── Multer configuration ─────────────────────────────────────────────
const uploadDir = path.join(__dirname, "../uploads/materials");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const unique = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, unique + path.extname(file.originalname));
  },
});

const fileFilter = (req, file, cb) => {
  const allowed = [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-powerpoint",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  ];
  if (allowed.includes(file.mimetype)) cb(null, true);
  else cb(new Error("Only PDF, Word, and PowerPoint files are allowed"), false);
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50 MB
});

// ── Helper: derive fileType from mimetype ────────────────────────────
function getFileType(mimetype) {
  if (mimetype === "application/pdf") return "pdf";
  if (mimetype.includes("word")) return "word";
  if (mimetype.includes("powerpoint") || mimetype.includes("presentation"))
    return "powerpoint";
  return "other";
}

// ── Upload a new material ────────────────────────────────────────────
// @route  POST /api/materials
// @access Teacher only
const uploadMaterial = asyncHandler(async (req, res) => {
  if (!req.file) {
    res.status(400);
    throw new Error("No file uploaded");
  }

  const { title, description, subject } = req.body;

  const material = await Material.create({
    title,
    description: description || "",
    subject,
    teacher: req.user._id,
    fileName: req.file.originalname,
    filePath: req.file.path,
    fileType: getFileType(req.file.mimetype),
    fileSize: req.file.size,
    isVisible: true,
  });

  res.status(201).json(material);
});

// ── Get teacher's own materials (including hidden) ───────────────────
// @route  GET /api/materials/my
// @access Teacher only
const getMaterials = asyncHandler(async (req, res) => {
  const materials = await Material.find({ teacher: req.user._id }).sort({
    createdAt: -1,
  });
  res.json(materials);
});

// ── Get all visible materials (for students) ─────────────────────────
// @route  GET /api/materials
// @access Protected (both roles)
const getAllMaterials = asyncHandler(async (req, res) => {
  const materials = await Material.find({ isVisible: true })
    .populate("teacher", "name")
    .sort({ createdAt: -1 });
  res.json(materials);
});

// ── Toggle visibility ────────────────────────────────────────────────
// @route  PATCH /api/materials/:id/visibility
// @access Teacher only
const toggleVisibility = asyncHandler(async (req, res) => {
  const material = await Material.findById(req.params.id);
  if (!material) {
    res.status(404);
    throw new Error("Material not found");
  }
  if (material.teacher.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error("Not authorized");
  }

  material.isVisible = !material.isVisible;
  await material.save();
  res.json(material);
});

// ── Replace file (keep same document, swap physical file) ────────────
// @route  PUT /api/materials/:id/file
// @access Teacher only
const replaceMaterial = asyncHandler(async (req, res) => {
  const material = await Material.findById(req.params.id);
  if (!material) {
    res.status(404);
    throw new Error("Material not found");
  }
  if (material.teacher.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error("Not authorized");
  }
  if (!req.file) {
    res.status(400);
    throw new Error("No replacement file uploaded");
  }

  // Delete old file from disk
  fs.unlink(material.filePath, (err) => {
    if (err) console.error("Old file cleanup error:", err.message);
  });

  material.fileName = req.file.originalname;
  material.filePath = req.file.path;
  material.fileType = getFileType(req.file.mimetype);
  material.fileSize = req.file.size;

  // Allow updating metadata alongside file replacement
  if (req.body.title) material.title = req.body.title;
  if (req.body.description !== undefined) material.description = req.body.description;
  if (req.body.subject) material.subject = req.body.subject;

  await material.save();
  res.json(material);
});

// ── Update metadata only (no file change) ────────────────────────────
// @route  PUT /api/materials/:id
// @access Teacher only
const updateMaterial = asyncHandler(async (req, res) => {
  const material = await Material.findById(req.params.id);
  if (!material) {
    res.status(404);
    throw new Error("Material not found");
  }
  if (material.teacher.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error("Not authorized");
  }

  if (req.body.title) material.title = req.body.title;
  if (req.body.description !== undefined) material.description = req.body.description;
  if (req.body.subject) material.subject = req.body.subject;

  await material.save();
  res.json(material);
});

// ── Delete a material ────────────────────────────────────────────────
// @route  DELETE /api/materials/:id
// @access Teacher only
const deleteMaterial = asyncHandler(async (req, res) => {
  const material = await Material.findById(req.params.id);
  if (!material) {
    res.status(404);
    throw new Error("Material not found");
  }
  if (material.teacher.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error("Not authorized");
  }

  // Delete file from disk (don't throw if file is already missing)
  fs.unlink(material.filePath, (err) => {
    if (err) console.error("File cleanup error:", err.message);
  });

  await Material.findByIdAndDelete(req.params.id);
  res.json({ message: "Material deleted successfully" });
});

// ── Download a material ──────────────────────────────────────────────
// @route  GET /api/materials/:id/download
// @access Protected (both roles)
const downloadMaterial = asyncHandler(async (req, res) => {
  const material = await Material.findById(req.params.id);
  if (!material) {
    res.status(404);
    throw new Error("Material not found");
  }

  // Students cannot download hidden materials
  if (!material.isVisible && req.user.role === "student") {
    res.status(403);
    throw new Error("This material is not available");
  }

  if (!fs.existsSync(material.filePath)) {
    res.status(404);
    throw new Error("File not found on server");
  }

  material.downloadCount += 1;
  await material.save();
  res.download(material.filePath, material.fileName);
});

// ── Exports ──────────────────────────────────────────────────────────
module.exports = {
  upload,
  uploadMaterial,
  getMaterials,
  getAllMaterials,
  toggleVisibility,
  replaceMaterial,
  updateMaterial,
  deleteMaterial,
  downloadMaterial,
};
