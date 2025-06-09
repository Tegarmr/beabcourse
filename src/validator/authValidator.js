const { z } = require('zod');

const passwordSchema = z.string()
  .min(8, 'Password minimal 8 karakter')
  .max(256, 'Password maksimal 256 karakter')
  .refine(val => /[a-z]/.test(val), 'Harus mengandung huruf kecil')
  .refine(val => /[A-Z]/.test(val), 'Harus mengandung huruf besar')
  .refine(val => /[0-9]/.test(val), 'Harus mengandung angka')
  .refine(val => /[\W_]/.test(val), 'Harus mengandung karakter khusus');

const registerSchema = z.object({
  // nama_depan: z.string().min(1, 'Nama depan wajib diisi'),
  // nama_belakang: z.string().min(1, 'Nama belakang wajib diisi'),
  username: z.string().min(3, 'Username minimal 3 karakter'),
  email: z.string().email('Email tidak valid'),
  password: passwordSchema,
  confirmPassword: z.string()
}).refine(data => data.password === data.confirmPassword, {
  message: 'Konfirmasi password tidak cocok',
  path: ['confirmPassword'],
});

const loginSchema = z.object({
  email: z.string().email('Email tidak valid'),
  password: z.string().min(1, 'Password wajib diisi'),
});

const googleAuthSchema = z.object({
  idToken: z.string().min(1, 'ID Token Google wajib diisi'),
});
const changePasswordSchema = z.object({
  oldPassword: z.string().min(8, 'Password lama wajib diisi dan minimal 8 karakter'),
  newPassword: passwordSchema,
  confirmPassword: z.string()
}).refine(data => data.newPassword === data.confirmPassword, {
  message: 'Konfirmasi password tidak cocok',
  path: ['confirmPassword'],
});
const forgotPasswordSchema = z.object({
  email: z.string().email('Email tidak valid'),
});

const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Token reset password wajib diisi'),
  newPassword: passwordSchema,
  confirmPassword: z.string()
}).refine(data => data.newPassword === data.confirmPassword, {
  message: 'Konfirmasi password tidak cocok',
  path: ['confirmPassword'],
});


module.exports = {
  registerSchema,
  loginSchema,
  googleAuthSchema,
  changePasswordSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
};

