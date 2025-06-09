// Fixed Controller (controllers/chatbotController.js)
const Chatbot = require('../models/chatbot');
const axios = require('axios');

// Konstanta
const PROHIBITED_KEYWORDS = [
  'crime', 'violence', 'terror', 'kill', 'bomb', 'drugs',
  'porn', 'sex', 'racist', 'hate', 'politics', 'illegal',
];

function containsProhibitedContent(text) {
  const textLower = text.toLowerCase();
  return PROHIBITED_KEYWORDS.some(keyword => textLower.includes(keyword));
}

const API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_URL = process.env.GEMINI_MODEL_URL;
let guestChats = {}; // penyimpanan sementara untuk guest (berdasarkan IP)

const chat = async (req, res) => {
  try {
    const userInput = req.body.message?.trim();
    const userId = req.user?.userId || null;
    const isGuest = !userId;

    if (!userInput || userInput.length > 120) {
      return res.status(400).json({ error: 'Invalid or too long message (max 120 chars)' });
    }

    if (containsProhibitedContent(userInput)) {
      return res.status(403).json({
        error: 'This topic is not allowed. Please keep the conversation educational and appropriate.'
      });
    }

    // Guest limitation
    if (isGuest) {
      const ip = req.ip || req.connection.remoteAddress || 'unknown';
      guestChats[ip] = (guestChats[ip] || 0) + 1;
      if (guestChats[ip] > 2) {
        return res.status(403).json({ error: 'Guest limit reached. Please log in to continue.' });
      }
    }

    // User chat limitation and conversation ID
    let conversationId = null;
    if (userId) {
      try {
        const count = await Chatbot.getMessageCountLastHour(userId);
        if (count >= 20) {
          return res.status(429).json({ error: 'Chat limit exceeded (20 messages/hour)' });
        }
        conversationId = await Chatbot.createConversationIfNotExists(userId);
      } catch (dbError) {
        console.error('Database error:', dbError);
        return res.status(500).json({ error: 'Database connection error' });
      }
    }

    // System prompt
    const systemPrompt = `
You are an English tutor chatbot named ABCourse.
Always respond only in English.
If the user greets you (e.g., says "hello", "hi", "hey", etc.), respond with: "Hello, I'm ABCourse chatbot! How can I help you today with your English?" before continuing the conversation.
Do not discuss any topic related to crime, violence, politics, or any inappropriate content.
If the user asks about such topics or speaks in other languages, politely remind them to speak in English and focus on learning English.
Respond in plain text only — no HTML, images, or special formatting  like bold annd others.
`.trim();

    // History (context) - COMPLETELY FIXED
    let history = [];
    if (userId && conversationId) {
      try {
        const previousMessages = await Chatbot.getLastMessages(conversationId, 5);
        // Double check that we have a valid array
        if (Array.isArray(previousMessages) && previousMessages.length > 0) {
          history = previousMessages.map(msg => ({
            role: msg.sender === 'user' ? 'user' : 'model',
            parts: [{ text: msg.message || '' }]
          }));
        }
      } catch (historyError) {
        console.error('Error fetching history:', historyError);
        // Continue without history if there's an error
        history = [];
      }
    }

    // Prepare contents for Gemini API
    const contents = [
      { role: 'user', parts: [{ text: systemPrompt }] },
      ...history,
      { role: 'user', parts: [{ text: userInput }] }
    ];

    // Kirim ke Gemini
    const response = await axios.post(GEMINI_URL, { contents }, {
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': API_KEY
      },
      timeout: 30000 // 30 second timeout
    });

    const reply = response.data?.candidates?.[0]?.content?.parts?.[0]?.text || 
                  'Sorry, I could not respond.';

    // Simpan ke DB jika user login
    if (userId && conversationId) {
      try {
        await Chatbot.saveMessagePair(conversationId, userInput, reply);
      } catch (saveError) {
        console.error('Error saving message:', saveError);
        // Don't fail the entire request if saving fails
      }
    }

    // Return response with conversationId
    const responseData = { reply };
    if (conversationId) {
      responseData.conversationId = conversationId;
    }

    res.json(responseData);

  } catch (error) {
    console.error('Chatbot error:', error.response?.data || error.message);
    
    if (error.code === 'ECONNABORTED') {
      res.status(408).json({ error: 'Request timeout. Please try again.' });
    } else if (error.response?.status === 429) {
      res.status(429).json({ error: 'API rate limit exceeded. Please try again later.' });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
};

const getChatHistory = async (req, res) => {
  try {
    const { conversationId, offset = 0, limit = 10 } = req.query;

    if (!conversationId) {
      return res.status(400).json({ error: 'Missing conversationId' });
    }

    const messages = await Chatbot.getMessagesWithPagination(
      conversationId,
      parseInt(offset),
      parseInt(limit)
    );

    res.json({ messages: messages || [] });

  } catch (error) {
    console.error('Error loading chat history:', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
};
const getConversationId = async (req, res) => {
  const userId = req.user?.userId;

  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const conversationId = await Chatbot.getLatestConversationIdByUser(userId);
    return res.json({ conversationId });
  } catch (error) {
    console.error('Error fetching conversation ID:', error);
    return res.status(500).json({ error: 'Failed to fetch conversation ID' });
  }
};


module.exports = {
  chat,
  getChatHistory,
  getConversationId
};