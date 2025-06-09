const Quiz = require('../models/quiz');

const createResult = async (req, res) => {
    try {
        const { score, materi_id: materiId } = req.body

        await Quiz.create(score, req.user.userId, materiId)

        return res.status(201).json({ message: 'Quiz recorded!' })
    } catch (error) {
        return res.status(500).json(error)
    }
}

const getHistory = async (req, res) => {
    try {
        const quizes = await Quiz.get(req.user.userId)

        return res.status(200).json({ message: 'Quiz recorded!', data: { quiz: quizes } })
    } catch (error) {
        return res.status(500).json(error)
    }
}

const getAllHistory = async (req, res) => {
    try {
        const quizes = await Quiz.getAll();

        return res.status(200).json({ message: 'All quiz history retrieved!', data: { quiz: quizes } });
    } catch (error) {
        return res.status(500).json(error);
    }
}


const getUserPerformance = async (req, res) => {
  try {
    const userId = req.params.id;
    const userAvg = await Quiz.getUserAverageScore(userId);
    const allAverages = await Quiz.getAllUsersAverageScores();

    const betterThanCount = allAverages.filter(avg => userAvg > avg).length;
    const percentage = allAverages.length > 0
      ? Math.round((betterThanCount / allAverages.length) * 100)
      : 0;

    const message = userAvg >= 70
      ? `Better than ${percentage}% of students`
      : `Keep going! You're on your way to improving!`;

    return res.json({
      averageScore: userAvg,
      comparison: message,
      betterThan: percentage
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};


module.exports = { createResult, getHistory, getAllHistory, getUserPerformance };