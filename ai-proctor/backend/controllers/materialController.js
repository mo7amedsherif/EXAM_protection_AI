// ── Imports ──────────────────────────────────────────────────────────
const asyncHandler = require("express-async-handler");
const path = require("path");
const fs = require("fs");
const os = require("os");
const multer = require("multer");
const jwt = require("jsonwebtoken");
const { DeleteObjectCommand } = require("@aws-sdk/client-s3");
const { Upload } = require("@aws-sdk/lib-storage");
const r2Client = require("../config/r2");
const Material = require("../models/materialModel");

// ── Multer configuration (temp disk — avoids holding file in RAM) ────
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, os.tmpdir()),
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

// ── Helper: stream file to R2 (parallel multipart upload) ───────────
async function uploadToR2(fileStream, mimetype, originalName, fileSize) {
  const ext = path.extname(originalName);
  const unique = Date.now() + "-" + Math.round(Math.random() * 1e9);
  const key = `materials/${unique}${ext}`;

  const parallelUpload = new Upload({
    client: r2Client,
    params: {
      Bucket: process.env.R2_BUCKET_NAME,
      Key: key,
      Body: fileStream,
      ContentType: mimetype,
      ContentLength: fileSize,
    },
    queueSize: 4,             // 4 parallel upload parts
    partSize: 5 * 1024 * 1024, // 5 MB per part
    leavePartsOnError: false,
  });

  await parallelUpload.done();

  const fileUrl = `${process.env.R2_PUBLIC_URL}/${key}`;
  return { key, fileUrl };
}

// ── Helper: delete object from R2 ────────────────────────────────────
async function deleteFromR2(key) {
  try {
    await r2Client.send(
      new DeleteObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME,
        Key: key,
      })
    );
  } catch (err) {
    console.error("R2 delete error:", err.message);
  }
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

  try {
    const fileStream = fs.createReadStream(req.file.path);
    const { key, fileUrl } = await uploadToR2(
      fileStream,
      req.file.mimetype,
      req.file.originalname,
      req.file.size
    );

    // Clean up temp file after successful R2 upload
    fs.unlink(req.file.path, (err) => {
      if (err) console.error("Failed to delete temp file:", err.message);
    });

    const material = await Material.create({
      title,
      description: description || "",
      subject,
      teacher: req.user._id,
      fileName: req.file.originalname,
      r2Key: key,
      fileUrl,
      fileType: getFileType(req.file.mimetype),
      fileSize: req.file.size,
      isVisible: true,
    });

    res.status(201).json(material);
  } catch (err) {
    // Clean up temp file if R2 upload fails
    fs.unlink(req.file.path, () => {});
    throw err;
  }
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

// ── Replace file (keep same document, swap R2 object) ────────────────
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

  try {
    // Delete old file from R2
    await deleteFromR2(material.r2Key);

    // Stream new file to R2
    const fileStream = fs.createReadStream(req.file.path);
    const { key, fileUrl } = await uploadToR2(
      fileStream,
      req.file.mimetype,
      req.file.originalname,
      req.file.size
    );

    // Clean up temp file after successful R2 upload
    fs.unlink(req.file.path, (err) => {
      if (err) console.error("Failed to delete temp file:", err.message);
    });

    material.fileName = req.file.originalname;
    material.r2Key = key;
    material.fileUrl = fileUrl;
    material.fileType = getFileType(req.file.mimetype);
    material.fileSize = req.file.size;

    // Allow updating metadata alongside file replacement
    if (req.body.title) material.title = req.body.title;
    if (req.body.description !== undefined) material.description = req.body.description;
    if (req.body.subject) material.subject = req.body.subject;

    await material.save();
    res.json(material);
  } catch (err) {
    // Clean up temp file if R2 upload fails
    fs.unlink(req.file.path, () => {});
    throw err;
  }
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

  // Delete from R2 (log errors but don't block DB deletion)
  await deleteFromR2(material.r2Key);

  await Material.findByIdAndDelete(req.params.id);
  res.json({ message: "Material deleted successfully" });
});

// ── Generate short-lived view token ──────────────────────────────────
// @route  GET /api/materials/:id/view-token
// @access Protected (both roles)
const generateViewToken = asyncHandler(async (req, res) => {
  const material = await Material.findById(req.params.id);
  if (!material) {
    res.status(404);
    throw new Error("Material not found");
  }

  if (!material.isVisible && req.user.role === "student") {
    res.status(403);
    throw new Error("This material is not available");
  }

  const viewToken = jwt.sign(
    { materialId: material._id.toString(), userId: req.user._id.toString() },
    process.env.JWT_SECRET,
    { expiresIn: "2m" }
  );

  res.json({ viewToken, fileUrl: material.fileUrl, fileName: material.fileName });
});

// ── Download (increment count, return R2 URL) ────────────────────────
// @route  GET /api/materials/:id/download
// @access Protected (both roles)
const downloadMaterial = asyncHandler(async (req, res) => {
  const material = await Material.findById(req.params.id);
  if (!material) {
    res.status(404);
    throw new Error("Material not found");
  }

  if (!material.isVisible && req.user.role === "student") {
    res.status(403);
    throw new Error("This material is not available");
  }

  material.downloadCount += 1;
  await material.save();
  res.json({ fileUrl: material.fileUrl, fileName: material.fileName });
});

// ── Exports ──────────────────────────────────────────────────────────
module.exports = {
  upload,
  uploadMaterial,
  getMaterials,
  getAllMaterials,
  toggleVisibility,
  updateMaterial,
  replaceMaterial,
  deleteMaterial,
  generateViewToken,
  downloadMaterial,
};
