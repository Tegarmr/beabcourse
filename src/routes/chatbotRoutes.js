const express = require('express');
const router = express.Router();
const chatbotController = require('../controllers/chatbotController');
const { optionalAuthenticate } = require('../middleware/authMiddleware'); // import yang benar
const {authenticateToken} = require('../middleware/authMiddleware');
router.post('/chat', optionalAuthenticate, chatbotController.chat);
router.get('/chat/history', optionalAuthenticate, chatbotController.getChatHistory);
router.get('/conversation-id', authenticateToken, chatbotController.getConversationId);

module.exports = router;
