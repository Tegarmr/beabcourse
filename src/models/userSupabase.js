//File: src/models/user.js
const supabase = require('../config/db');

const User = {
  findByEmail: async (email) => {
    const { rows } = await supabase.query('SELECT * FROM users WHERE email = $1', [email]);
    return rows[0];
  },

  findById: async (userId) => {
    const { rows } = await supabase.query(
      'SELECT * FROM users WHERE user_id = $1',
      [userId]
    );
    return rows[0];
  },  

  findByUsername: async (username) => {
    const { rows } = await supabase.query('SELECT * FROM users WHERE username = $1', [username]);
    return rows[0];
  },

  create: async (user) => {
    const { nama_depan, nama_belakang, username, email, password, provider, verification_token } = user;
    const { rows } = await supabase.query(
      `INSERT INTO users (nama_depan, nama_belakang, username, email, password, provider, verification_token)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [nama_depan, nama_belakang, username, email, password, provider, verification_token]
    );
    return rows[0];
  },

  verifyUser: async (token) => {
    const { rows } = await supabase.query(
      `UPDATE users SET is_verified = TRUE, verification_token = NULL
       WHERE verification_token = $1
       RETURNING *`,
      [token]
    );
    return rows[0];
  },

  updateResetToken: async (email, resetToken, resetTokenExpiration) => {
    const { rows } = await supabase.query(
      `UPDATE users SET reset_token = $1, reset_token_expiration = $2
       WHERE email = $3 RETURNING *`,
      [resetToken, resetTokenExpiration, email]
    );
    return rows[0];
  },

  findByResetToken: async (token) => {
    const { rows } = await supabase.query(
      `SELECT * FROM users WHERE reset_token = $1`,
      [token]
    );
    return rows[0];
  },

  updatePassword: async (email, newPassword) => {
    const { rows } = await supabase.query(
      `UPDATE users SET password = $1, reset_token = NULL, reset_token_expiration = NULL
       WHERE email = $2 RETURNING *`,
      [newPassword, email]
    );
    return rows[0];
  }
};

module.exports = User;

