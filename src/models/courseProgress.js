const supabase = require('../config/supabase');

const CourseProgress = {
  // Get overall progress for a user
  getUserProgress: async (userId) => {
    // First get all course materials
    const { data: materials, error: materialError } = await supabase
      .from('materi')
      .select('materi_id')
      .order('materi_id');
    
    if (materialError) throw materialError;
    
    // Then get the user's quiz results
    const { data: quizResults, error: quizError } = await supabase
      .from('quiz')
      .select('materi_id, nilai_quiz')
      .eq('user_id', userId);
    
    if (quizError) throw quizError;
    
    // Calculate overall progress
    const totalMaterials = materials.length;
    const completedMaterials = quizResults
      .filter((quiz) => quiz.nilai_quiz >= 80)
      .map((quiz) => quiz.materi_id)
      .filter((value, index, self) => self.indexOf(value) === index) // Remove duplicates
      .length;
    
    const progressPercentage = totalMaterials > 0 
      ? Math.round((completedMaterials / totalMaterials) * 100) 
      : 0;
    
    const isCompleted = completedMaterials === totalMaterials && totalMaterials > 0;
    
    return {
      totalMaterials,
      completedMaterials,
      progressPercentage,
      isCompleted
    };
  },
  
  // Check if a specific course is completed by the user
  isCourseCompleted: async (userId) => {
    const progress = await CourseProgress.getUserProgress(userId);
    return progress.isCompleted;
  },
  
  // Get detailed progress for all materials
  getDetailedProgress: async (userId) => {
    // Use the existing Material.get method which already includes progress data
    const Material = require('./material');
    return await Material.get(userId);
  }
};

module.exports = CourseProgress; 