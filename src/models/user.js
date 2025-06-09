
// File: src/models/user.js
const supabase = require('../config/supabase');

const User = {
  findByEmail: async (email) => {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  findById: async (userId) => {
    const { data, error } = await supabase
      .from('users') // Nama tabelnya 'users'
      .select('*') // Pilih semua kolom
      .eq('user_id', userId) // Kondisi where user_id = userId
      .single(); // Hanya ambil satu data user

    if (error) {
      console.error(error);
      return null; // Jika terjadi error, return null
    }
    
    return data; // Kembalikan data user yang ditemukan
  },
  findByUsername: async (username) => {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('username', username)
      .single();

    if (error) throw error;
    return data;
  },

  create: async (user) => {
    const { data, error } = await supabase
      .from('users')
      .insert([user])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  verifyUser: async (token) => {
    const { data, error } = await supabase
      .from('users')
      .update({ is_verified: true, verification_token: null })
      .eq('verification_token', token)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  updateResetToken: async (email, reset_token, reset_token_expiration) => {
    const { data, error } = await supabase
      .from('users')
      .update({ reset_token, reset_token_expiration })
      .eq('email', email)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  findByResetToken: async (token) => {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('reset_token', token)
      .single();

    if (error) throw error;
    return data;
  },

  updatePassword: async (email, newPassword) => {
    const { data, error } = await supabase
      .from('users')
      .update({ password: newPassword, reset_token: null, reset_token_expiration: null })
      .eq('email', email)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

updateProfilePicture: async (userId, profileUrl) => {
  const { data, error } = await supabase
    .from('users')
    .update({ profile_picture: profileUrl })
    .eq('user_id', userId)
    .select()
    .single();

  if (error) throw error;
  return data;
},
  changePassword: async (userId, newPassword) => {
    const { data, error } = await supabase
      .from('users')
      .update({ password: newPassword })
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

updateProfile: async (userId, updatedFields) => {
  const { data, error } = await supabase
    .from('users')
    .update(updatedFields)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) throw error;
  return data;
}};
module.exports = User;


