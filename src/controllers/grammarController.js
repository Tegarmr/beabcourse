//File: src/controllers/grammarController.js
const axios = require("axios");
const GrammarCheck = require("../models/grammar_check")

const correctGrammar = async (req, res) => {
  try {
    const { text } = req.body;
    const { userId } = req.user

    const response = await axios.post("http://localhost:8000/correct", {
      text,
    });

    await GrammarCheck.create(userId, text, response.data.corrected)

    res.status(200).json({
      original: text,
      corrected: response.data.corrected,
    });
  } catch (err) { 
    res.status(500).json({ message: "Error during grammar correction" });
  }
};

module.exports = { correctGrammar };
