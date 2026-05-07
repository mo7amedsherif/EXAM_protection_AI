const asyncHandler = require("express-async-handler");
const Question = require("../models/questionModel");
const Exam = require("../models/examModel");

// Helper: Sanitize question for students (remove correctOption)
const sanitizeForStudent = (question) => ({
  _id: question._id,
  text: question.text,
  options: question.options,
  marks: question.marks,
  exam: question.exam,
});

// Helper: Build role-based query for questions
const buildRoleBasedQuery = async (user) => {
  if (user.role === 'student') {
    const activeExams = await Exam.find({ isActive: true }).select('_id');
    return { exam: { $in: activeExams.map(e => e._id) } };
  } else if (user.role === 'teacher') {
    const teacherExams = await Exam.find({ teacher: user._id }).select('_id');
    return { exam: { $in: teacherExams.map(e => e._id) } };
  }
  return {};
};

// @desc   Add question to an exam
// @route  POST /api/exams/:examId/questions
// @access Teacher only (own exams)
const addQuestion = asyncHandler(async (req, res) => {
  const exam = await Exam.findById(req.params.examId);

  if (!exam) {
    res.status(404);
    throw new Error("Exam not found");
  }

  if (exam.teacher.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error("Not authorized to add questions to this exam");
  }

  const { text, options, correctOption, marks } = req.body;

  if (!text || !options || correctOption === undefined) {
    res.status(400);
    throw new Error("Please provide text, options and correctOption");
  }

  const question = await Question.create({
    exam: exam._id,
    text,
    options,
    correctOption,
    marks,
  });

  res.status(201).json(question);
});

// @desc   Get all questions for an exam
// @route  GET /api/exams/:examId/questions
// @access Private
// @note   Students do NOT get correctOption
const getQuestions = asyncHandler(async (req, res) => {
  const exam = await Exam.findById(req.params.examId);

  if (!exam) {
    res.status(404);
    throw new Error("Exam not found");
  }

  const questions = await Question.find({ exam: req.params.examId });

  // Hide correct answer from students
  if (req.user.role === "student") {
    const sanitized = questions.map(sanitizeForStudent);
    return res.json(sanitized);
  }

  res.json(questions);
});

// @desc   Delete a question
// @route  DELETE /api/exams/:examId/questions/:questionId
// @access Teacher only (own exams)
const deleteQuestion = asyncHandler(async (req, res) => {
  const exam = await Exam.findById(req.params.examId);

  if (!exam) {
    res.status(404);
    throw new Error("Exam not found");
  }

  if (exam.teacher.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error("Not authorized to delete questions from this exam");
  }

  const question = await Question.findById(req.params.questionId);
  
  if (!question) {
    res.status(404);
    throw new Error('Question not found');
  }

  if (question.exam.toString() !== req.params.examId) {
    res.status(400);
    throw new Error('Question does not belong to this exam');
  }

  await question.deleteOne();
  res.json({ message: 'Question deleted successfully' });
});

// @desc   Create standalone question
// @route  POST /api/questions
// @access Teacher only
const createQuestion = asyncHandler(async (req, res) => {
  const { text, options, correctOption, marks, exam } = req.body;

  if (!text || !options || correctOption === undefined) {
    res.status(400);
    throw new Error("Please provide text, options and correctOption");
  }

  // If exam is provided, verify it exists and user owns it
  if (exam) {
    const examDoc = await Exam.findById(exam);
    if (!examDoc) {
      res.status(404);
      throw new Error("Exam not found");
    }
    if (examDoc.teacher.toString() !== req.user._id.toString()) {
      res.status(403);
      throw new Error("Not authorized to add questions to this exam");
    }
  }

  const question = await Question.create({
    exam,
    text,
    options,
    correctOption,
    marks,
  });

  res.status(201).json(question);
});

// @desc   Get single question
// @route  GET /api/questions/:id
// @access Private
const getQuestion = asyncHandler(async (req, res) => {
  const question = await Question.findById(req.params.id).populate('exam', 'title');

  if (!question) {
    res.status(404);
    throw new Error('Question not found');
  }

  // Check permissions
  if (question.exam) {
    const exam = await Exam.findById(question.exam);
    if (req.user.role === 'student' && (!exam.isPublished || !exam.isActive)) {
      res.status(403);
      throw new Error('Question not available');
    }
    if (req.user.role === 'teacher' && exam.teacher.toString() !== req.user._id.toString()) {
      res.status(403);
      throw new Error('Not authorized to view this question');
    }
  }

  // Hide correct answer from students
  if (req.user.role === 'student') {
    return res.json(sanitizeForStudent(question));
  }

  res.json(question);
});

// @desc   Update question
// @route  PUT /api/questions/:id
// @access Teacher only
const updateQuestion = asyncHandler(async (req, res) => {
  const question = await Question.findById(req.params.id);

  if (!question) {
    res.status(404);
    throw new Error('Question not found');
  }

  // Check permissions
  if (question.exam) {
    const exam = await Exam.findById(question.exam);
    if (!exam) {
      res.status(404);
      throw new Error('Associated exam not found');
    }
    if (exam.teacher.toString() !== req.user._id.toString()) {
      res.status(403);
      throw new Error('Not authorized to update this question');
    }
  }

  const { text, options, correctOption, marks } = req.body;
  question.text = text || question.text;
  question.options = options || question.options;
  question.correctOption = correctOption !== undefined ? correctOption : question.correctOption;
  question.marks = marks || question.marks;

  const updatedQuestion = await question.save();
  res.json(updatedQuestion);
});

// @desc   Toggle question activation
// @route  PATCH /api/questions/:id/activate
// @access Teacher only
const toggleActivateQuestion = asyncHandler(async (req, res) => {
  const question = await Question.findById(req.params.id);

  if (!question) {
    res.status(404);
    throw new Error('Question not found');
  }

  // Check permissions
  if (question.exam) {
    const exam = await Exam.findById(question.exam);
    if (!exam) {
      res.status(404);
      throw new Error('Associated exam not found');
    }
    if (exam.teacher.toString() !== req.user._id.toString()) {
      res.status(403);
      throw new Error('Not authorized to modify this question');
    }
  }

  question.isActive = !question.isActive;
  await question.save();

  res.json({ 
    message: `Question ${question.isActive ? 'activated' : 'deactivated'} successfully`,
    isActive: question.isActive
  });
});

module.exports = { 
  addQuestion, 
  getQuestions, 
  deleteQuestion,
  createQuestion,
  getQuestion,
  updateQuestion,
  toggleActivateQuestion,
};