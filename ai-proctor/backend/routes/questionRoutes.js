const express = require('express');
const router = express.Router();
const { getWarehouse } = require('../controllers/questionController');
const { protect, authorizeRoles } = require('../middleware/authMiddleware');

router.use(protect);
router.get('/warehouse', authorizeRoles('teacher'), getWarehouse);

module.exports = router;
