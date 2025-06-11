const GrammarCheck = require('../models/grammar_check');
const axios = require('axios')

// Fungsi untuk memeriksa grammar dan menyimpan hasilnya
const checkGrammar = async (req, res) => {
  try {
    const { text } = req.body;
    const { userId } = req.user

    const response = await axios.post("https://web-production-748c7.up.railway.app/correct", {
      text,
    });

    await GrammarCheck.create(userId, text, response.data.hasil)

    res.status(200).json({
      original: text,
      corrected: response.data.hasil,
    });
  } catch (err) {
    console.error("Grammar correction failed:", err.message);
    res.status(500).json({ message: "Error during grammar correction" });
  }
};

// Fungsi untuk mengambil riwayat grammar check user
const getHistory = async (req, res) => {
  const userId = req.user.userId; // Dapatkan userId dari sesi/authorization

  try {
    const history = await GrammarCheck.getHistory(userId);
    res.status(200).json(history);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error retrieving grammar history", error });
  }
};

module.exports = { checkGrammar, getHistory };
