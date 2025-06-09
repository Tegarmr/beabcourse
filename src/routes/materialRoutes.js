const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/authMiddleware');
const controller = require('../controllers/materialController');

// GET semua materi (dengan token)
router.get('/latest', authenticateToken, controller.getLatestInProgress);
router.get('/', authenticateToken, controller.getMateri);

// GET satu materi berdasarkan ID (tanpa token, jika memang public)
router.get('/:id', controller.getOneMateri);

// POST log akses materi (dengan token)
router.post('/log', authenticateToken, controller.logMaterialAccess);

module.exports = router;
