const supabase = require('../config/supabase');

const GrammarCheck = {
  // Menyimpan hasil grammar check ke database
  create: async (userId, inputText, correctedText) => {
    const { data, error } = await supabase
      .from('grammar_checks') // Nama tabel grammar_checks
      .insert([
        {
          user_id: userId,
          check_grammar: inputText,
          hasil: correctedText,
          created_at: new Date().toISOString()
        }
      ])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Mengambil riwayat pemeriksaan grammar berdasarkan user_id
  getHistory: async (userId) => {
    const { data, error } = await supabase
      .from('grammar_checks') // Nama tabel grammar_checks
      .select('*')
      .eq('user_id', userId) // Filter berdasarkan user_id
      .order('created_at', { ascending: false }); // Urutkan berdasarkan tanggal terbaru

    if (error) throw error;
    return data;
  }
};

module.exports = GrammarCheck;
