// Fixed Chatbot Model (models/chatbot.js)
const supabase = require('../config/supabase');

const Chatbot = {
  /**
   * Menyimpan pesan user ke dalam message_pairs, bot_reply NULL dulu
   */
  saveUserMessage: async (userId, conversationId, userMessage) => {
    // Validasi / pastikan percakapan ada
    if (!conversationId) {
      conversationId = await Chatbot.createConversationIfNotExists(userId);
    }

    const { data, error } = await supabase
      .from('message_pairs')
      .insert({ conversation_id: conversationId, user_message: userMessage })
      .select('pair_id');

    if (error) throw error;
    return data[0].pair_id; // return pair_id untuk dipakai saat update reply
  },

  /**
   * Update balasan bot ke pesan yang sebelumnya
   */
  saveBotReply: async (pairId, botReply) => {
    const { error } = await supabase
      .from('message_pairs')
      .update({ bot_reply: botReply })
      .eq('pair_id', pairId);

    if (error) throw error;
  },

  /**
   * Simpan pesan dan balasan sekaligus (untuk flow yang lebih sederhana)
   */
  saveMessagePair: async (conversationId, userMessage, botReply) => {
    const { data, error } = await supabase
      .from('message_pairs')
      .insert({ 
        conversation_id: conversationId, 
        user_message: userMessage,
        bot_reply: botReply 
      })
      .select('pair_id');

    if (error) throw error;
    return data[0].pair_id;
  },

  /**
   * Hitung jumlah pesan user dalam 1 jam terakhir - FIXED QUERY
   */
 getMessageCountLastHour: async (userId) => {
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();

  // Ambil dulu conversation_id milik user
  const { data: conversations, error: convError } = await supabase
    .from('conversations')
    .select('conversation_id')
    .eq('user_id', userId);

  if (convError) throw convError;

  const conversationIds = conversations.map(c => c.conversation_id);

  // Jika tidak ada conversation, berikan array dummy supaya .in() valid tapi tidak match apa-apa
  if (conversationIds.length === 0) return 0;

  // Query message_pairs berdasarkan conversation_id yang dimiliki user dan dalam 1 jam terakhir
  const { count, error } = await supabase
    .from('message_pairs')
    .select('pair_id', { count: 'exact', head: true })
    .in('conversation_id', conversationIds)
    .gt('timestamp', oneHourAgo);

  if (error) throw error;
  return count || 0;
},


  /**
   * Cek atau buat conversation - FIXED ORDER
   */
  createConversationIfNotExists: async (userId) => {
    // Cek conversation yang sudah ada (ambil yang terbaru)
    const { data: existing, error } = await supabase
      .from('conversations')
      .select('conversation_id')
      .eq('user_id', userId)
      .order('created_at', { ascending: false }) // FIXED: ambil yang terbaru
      .limit(1);

    if (error) throw error;
    if (existing && existing.length > 0) return existing[0].conversation_id;

    // Buat conversation baru jika belum ada
    const { data, error: insertError } = await supabase
      .from('conversations')
      .insert({ user_id: userId, title: 'Chatbot Session' })
      .select('conversation_id')
      .single();

    if (insertError) throw insertError;
    return data.conversation_id;
  },

  /**
   * Ambil pesan & balasan (dengan pagination) - FIXED FORMAT
   */
  getMessagesWithPagination: async (conversationId, offset = 0, limit = 10) => {
    const { data, error } = await supabase
      .from('message_pairs')
      .select('user_message, bot_reply, timestamp')
      .eq('conversation_id', conversationId)
      .order('timestamp', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;
    if (!data) return [];

    // Convert format untuk frontend
    const messages = [];
    const reversedData = data.reverse(); // dari lama ke baru
    
    reversedData.forEach(item => {
      if (item.user_message) {
        messages.push({
          sender: 'user',
          message: item.user_message,
          timestamp: item.timestamp
        });
      }
      if (item.bot_reply) {
        messages.push({
          sender: 'bot',
          message: item.bot_reply,
          timestamp: item.timestamp
        });
      }
    });

    return messages;
  },

  /**
   * Ambil pesan terakhir untuk context - COMPLETELY FIXED
   */
  getLastMessages: async (conversationId, limit = 5) => {
    try {
      const { data, error } = await supabase
        .from('message_pairs')
        .select('user_message, bot_reply, timestamp')
        .eq('conversation_id', conversationId)
        .order('timestamp', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Database error in getLastMessages:', error);
        return [];
      }

      // Return empty array if no data
      if (!data || !Array.isArray(data) || data.length === 0) {
        return [];
      }

      const messages = [];
      // Process from oldest to newest untuk context yang benar
      for (let i = data.length - 1; i >= 0; i--) {
        const item = data[i];
        if (item.user_message) {
          messages.push({ sender: 'user', message: item.user_message });
        }
        if (item.bot_reply) {
          messages.push({ sender: 'model', message: item.bot_reply });
        }
      }
      
      return messages;
    } catch (err) {
      console.error('Exception in getLastMessages:', err);
      return [];
    }
  },

getLatestConversationIdByUser: async (userId) => {
  const { data, error } = await supabase
    .from('conversations')
    .select('conversation_id')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (error) throw error;
  return data?.conversation_id || null;
}};

module.exports = Chatbot;