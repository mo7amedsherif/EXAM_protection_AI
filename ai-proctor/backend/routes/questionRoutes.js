const express = require('express');
const router = express.Router();
const {
  getWarehouse,
  createQuestion,
  getQuestion,
  updateQuestion,
  toggleActivateQuestion,
} = require('../controllers/questionController');
const { protect, authorizeRoles } = require('../middleware/authMiddleware');

router.use(protect);

// Warehouse (teacher only)
router.get('/warehouse', authorizeRoles('teacher'), getWarehouse);

// Standalone question CRUD (teacher only)
router.post('/', authorizeRoles('teacher'), createQuestion);
router.get('/:id', getQuestion);
router.put('/:id', authorizeRoles('teacher'), updateQuestion);
router.patch('/:id/activate', authorizeRoles('teacher'), toggleActivateQuestion);

module.exports = router;
