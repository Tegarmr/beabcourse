const express = require('express');
const { checkGrammar, getHistory } = require('../controllers/grammarCheckerController');
const router = express.Router();
const {authenticateToken} = require('../middleware/authMiddleware');

// Endpoint untuk memeriksa grammar
router.post('/check', authenticateToken, checkGrammar);

// Endpoint untuk mengambil riwayat grammar check
router.get('/history', authenticateToken, getHistory);

module.exports = router;
