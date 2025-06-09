const supabase = require('../config/supabase');

const Quiz = {
    create: async (score, userId, materiId) => {
        const { data, error } = await supabase
            .from('quiz')
            .insert([
                {
                    nilai_quiz: score,
                    user_id: userId,
                    materi_id: materiId,
                    created_at: new Date().toISOString()
                }
            ])
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    get: async (userId) => {
        const { data, error } = await supabase
            .from('quiz')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data;
    },

    getAll: async () => {
        const { data, error } = await supabase
            .from('quiz')
            .select('*') 
            .order('created_at', { ascending: false });
    
        if (error) throw error;
        return data;
    },

getUserAverageScore: async (userId) => {
    const { data, error } = await supabase
      .from('quiz')
      .select('nilai_quiz')
      .eq('user_id', userId);

    if (error) throw error;
    const total = data.reduce((sum, q) => sum + q.nilai_quiz, 0);
    const avg = data.length > 0 ? total / data.length : 0;
    return parseFloat(avg.toFixed(2));
  },

  getAllUsersAverageScores: async () => {
    const { data, error } = await supabase
      .from('quiz')
      .select('user_id, nilai_quiz');

    if (error) throw error;

    const userScores = {};
    data.forEach(({ user_id, nilai_quiz }) => {
      if (!userScores[user_id]) userScores[user_id] = [];
      userScores[user_id].push(nilai_quiz);
    });

    const averages = Object.values(userScores).map(scores => {
      const total = scores.reduce((sum, s) => sum + s, 0);
      return total / scores.length;
    });

    return averages;
  }
};

module.exports = Quiz;
