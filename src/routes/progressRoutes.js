const express = require('express');
const router = express.Router();
const progressController = require('../controllers/progressController');
const {authenticateToken} = require('../middleware/authMiddleware');

// Apply authentication middleware to all progress routes
router.use(authenticateToken);

// Get overall progress
router.get('/', progressController.getUserProgress);

// Check if course is completed
router.get('/completed', progressController.checkCourseCompletion);

// Get detailed progress for all materials
router.get('/detailed', progressController.getDetailedProgress);

module.exports = router; 