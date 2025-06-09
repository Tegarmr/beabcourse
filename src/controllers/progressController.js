const CourseProgress = require('../models/courseProgress');

// Get overall progress statistics for a user
const getUserProgress = async (req, res) => {
  try {
    const userId = req.user.userId;
    const progress = await CourseProgress.getUserProgress(userId);
    
    return res.status(200).json({ 
      message: 'Success', 
      data: { progress } 
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ 
      message: 'Failed to fetch user progress', 
      error: error.message 
    });
  }
};

// Check if a user has completed all courses
const checkCourseCompletion = async (req, res) => {
  try {
    const userId = req.user.userId;
    const isCompleted = await CourseProgress.isCourseCompleted(userId);
    
    return res.status(200).json({ 
      message: 'Success', 
      data: { isCompleted } 
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ 
      message: 'Failed to check course completion', 
      error: error.message 
    });
  }
};

// Get detailed progress for all materials
const getDetailedProgress = async (req, res) => {
  try {
    const userId = req.user.userId;
    const detailedProgress = await CourseProgress.getDetailedProgress(userId);
    
    return res.status(200).json({ 
      message: 'Success', 
      data: { materials: detailedProgress } 
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ 
      message: 'Failed to fetch detailed progress', 
      error: error.message 
    });
  }
};

module.exports = {
  getUserProgress,
  checkCourseCompletion,
  getDetailedProgress
}; 