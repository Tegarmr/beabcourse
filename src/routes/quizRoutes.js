const express = require('express');
const router = express.Router();
const {authenticateToken} = require('../middleware/authMiddleware');
const controller = require('../controllers/quizController')
const { getUserPerformance } = require('../controllers/quizController');

router.get('/performance/:id', authenticateToken, getUserPerformance);
router.get('/', authenticateToken, controller.getHistory)
router.post('/', authenticateToken, controller.createResult)
router.get('/all', authenticateToken, controller.getAllHistory)
module.exports = router;