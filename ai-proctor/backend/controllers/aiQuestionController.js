const asyncHandler = require('express-async-handler');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const Material = require('../models/materialModel');
const Question = require('../models/questionModel');
const multer = require('multer');
const os = require('os');
const path = require('path');
const fs = require('fs');
const https = require('https');
const http = require('http');
const axios = require('axios');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || 'placeholder');

// ── Multer for direct file upload ────────────────────────────────────
const aiUploadStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, os.tmpdir()),
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, unique + path.extname(file.originalname));
  },
});

const aiFileFilter = (req, file, cb) => {
  const allowed = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ];
  if (allowed.includes(file.mimetype)) cb(null, true);
  else cb(new Error('Only PDF and Word files are allowed'), false);
};

const aiUpload = multer({
  storage: aiUploadStorage,
  fileFilter: aiFileFilter,
  limits: { fileSize: 20 * 1024 * 1024 }, // 20 MB
});

// ── Helper: download file from URL to buffer ─────────────────────────
function downloadFile(url) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    client.get(url, (res) => {
      // Follow redirects
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return downloadFile(res.headers.location).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) {
        return reject(new Error(`Failed to download: HTTP ${res.statusCode}`));
      }
      const chunks = [];
      res.on('data', (chunk) => chunks.push(chunk));
      res.on('end', () => resolve(Buffer.concat(chunks)));
      res.on('error', reject);
    }).on('error', reject);
  });
}

// ── Helper: extract text from file buffer ────────────────────────────
async function extractText(buffer, fileType) {
  if (fileType === 'pdf') {
    const pdfParse = require('pdf-parse');
    const data = await pdfParse(buffer);
    return data.text;
  } else if (fileType === 'word' || fileType === 'docx') {
    const mammoth = require('mammoth');
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
  }
  throw new Error('Unsupported file type. Only PDF and Word files are supported.');
}

// ── Helper: download file from Cloudflare R2 using SDK ────────────────
async function downloadFromR2(key) {
  const { GetObjectCommand } = require('@aws-sdk/client-s3');
  const r2Client = require('../config/r2');
  const command = new GetObjectCommand({
    Bucket: process.env.R2_BUCKET_NAME,
    Key: key,
  });
  const response = await r2Client.send(command);
  const chunks = [];
  for await (const chunk of response.Body) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}

// @desc   Generate questions using Gemini AI from material content
// @route  POST /api/exams/:examId/questions/generate
// @access Teacher only
const generateQuestions = asyncHandler(async (req, res) => {
  const { materialId, count = 5 } = req.body;

  let contentText = '';

  // Source 1: existing material by ID
  if (materialId) {
    const material = await Material.findById(materialId);
    if (!material) {
      res.status(404);
      throw new Error('Material not found');
    }

    try {
      let fileBuffer;
      if (material.r2Key) {
        fileBuffer = await downloadFromR2(material.r2Key);
      } else {
        fileBuffer = await downloadFile(material.fileUrl);
      }
      contentText = await extractText(fileBuffer, material.fileType);
    } catch (err) {
      console.warn('R2 direct download failed, trying HTTP download fallback. Error:', err.message);
      try {
        const fileBuffer = await downloadFile(material.fileUrl);
        contentText = await extractText(fileBuffer, material.fileType);
      } catch (fallbackErr) {
        console.error('Text extraction error:', fallbackErr.message);
        // Fallback to metadata if extraction fails
        contentText = `Material Title: ${material.title}\nSubject: ${material.subject}\nDescription: ${material.description || 'N/A'}`;
      }
    }
  }

  // Source 2: directly uploaded file
  if (req.file && !contentText) {
    try {
      const fileBuffer = fs.readFileSync(req.file.path);
      const ext = path.extname(req.file.originalname).toLowerCase();
      const fileType = ext === '.pdf' ? 'pdf' : 'word';
      contentText = await extractText(fileBuffer, fileType);
    } catch (err) {
      console.error('Upload text extraction error:', err.message);
      res.status(400);
      throw new Error('Failed to read the uploaded file. Make sure it is a valid PDF or Word document.');
    } finally {
      // Clean up temp file
      fs.unlink(req.file.path, () => {});
    }
  }

  if (!contentText || contentText.trim().length < 50) {
    res.status(400);
    throw new Error('Could not extract enough content from the file. Please select a different material.');
  }

  // Truncate to ~30k chars to stay within Gemini context limits
  const truncated = contentText.substring(0, 30000);

  const systemPrompt = `You are an exam question generator. Based ONLY on the provided material content, generate exactly ${count} multiple-choice questions.

Requirements:
- Questions must be directly based on the material content
- Each question must have exactly 4 options
- Only one option should be correct
- Questions should test understanding, not just memorization
- Vary difficulty: mix easy, medium, and hard questions

Respond ONLY with a valid JSON array. No markdown, no explanation, just the raw JSON array.
Format:
[
  {
    "text": "Question text here?",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correctOption": 0,
    "marks": 1
  }
]

Material Content:
${truncated}`;

  let responseText;
  const providers = [];

  // Add Groq models first if API key is present
  if (process.env.GROQ_API_KEY) {
    providers.push(
      { type: 'groq', model: 'llama-3.3-70b-versatile' },
      { type: 'groq', model: 'llama-3.1-8b-instant' }
    );
  }

  // Add Gemini models as fallback
  if (process.env.GEMINI_API_KEY) {
    providers.push(
      { type: 'gemini', model: 'gemini-2.0-flash' },
      { type: 'gemini', model: 'gemini-1.5-flash' },
      { type: 'gemini', model: 'gemini-1.5-pro' }
    );
  }

  let lastError = null;
  for (const prov of providers) {
    try {
      if (prov.type === 'groq') {
        const response = await axios.post(
          'https://api.groq.com/openai/v1/chat/completions',
          {
            model: prov.model,
            messages: [
              {
                role: 'user',
                content: systemPrompt
              }
            ]
          },
          {
            headers: {
              'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
              'Content-Type': 'application/json'
            },
            timeout: 15000
          }
        );
        
        if (response.data && response.data.choices && response.data.choices[0]) {
          responseText = response.data.choices[0].message.content;
          lastError = null;
          break;
        } else {
          throw new Error('Invalid response structure from Groq API');
        }
      } else if (prov.type === 'gemini') {
        const model = genAI.getGenerativeModel({ model: prov.model });
        const result = await model.generateContent(systemPrompt);
        responseText = result.response.text();
        lastError = null;
        break;
      }
    } catch (err) {
      console.warn(`${prov.type.toUpperCase()} model ${prov.model} failed. Error:`, err.message);
      lastError = err;
    }
  }

  if (lastError || !responseText) {
    const errMsg = lastError ? lastError.message : 'No API provider available';
    console.error('All Question Generation API models failed:', errMsg);
    res.status(500);
    if (errMsg.includes('429') || errMsg.includes('quota') || errMsg.includes('Quota') || errMsg.includes('rate_limit')) {
      throw new Error('API rate limit or quota exceeded. Please try again in a few seconds.');
    } else {
      throw new Error(`Failed to generate questions: ${errMsg}`);
    }
  }

  try {
    // Extract JSON from response (handle markdown code blocks)
    let jsonStr = responseText;
    const jsonMatch = responseText.match(/\[\s*\{[\s\S]*\}\s*\]/);
    if (jsonMatch) {
      jsonStr = jsonMatch[0];
    }
    
    const questions = JSON.parse(jsonStr);
    
    if (!Array.isArray(questions)) {
      res.status(500);
      throw new Error('AI returned invalid format');
    }

    // Validate and sanitize each question
    const validated = questions.map((q, i) => ({
      text: q.text || `Question ${i + 1}`,
      options: Array.isArray(q.options) && q.options.length === 4 
        ? q.options 
        : ['Option A', 'Option B', 'Option C', 'Option D'],
      correctOption: typeof q.correctOption === 'number' && q.correctOption >= 0 && q.correctOption <= 3 
        ? q.correctOption 
        : 0,
      marks: q.marks || 1,
      source: 'ai_generated',
    }));

    // Automatically save all generated questions to the warehouse
    try {
      const toCreate = validated.map(q => ({
        text: q.text,
        options: q.options,
        correctOption: q.correctOption,
        marks: q.marks,
        teacher: req.user._id,
        source: 'ai_generated',
      }));
      await Question.insertMany(toCreate);
    } catch (dbErr) {
      console.error('Failed to auto-save generated questions to warehouse:', dbErr.message);
    }

    res.json(validated);
  } catch (error) {
    res.status(500);
    throw new Error('AI returned questions in an invalid format. Please try generating again.');
  }
});

module.exports = { generateQuestions, aiUpload };
