const express = require("express");
const router = express.Router();
const { authenticateToken } = require("../middleware/authMiddleware");
const {
  register,
  verifyEmail,
  login,
  forgotPassword,
  resetPassword,
  loginWithGoogle,
  logout,
  me,
  handleOAuthCallback,
  verifyToken,
} = require("../controllers/authController");
const validate = require("../middleware/validate");
const {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  googleAuthSchema,
} = require("../validator/authValidator");
const { changePasswordSchema } = require("../validator/authValidator"); // Tambahkan schema validasi
const { changePassword } = require("../controllers/authController"); // Tambahkan controller-nya

// Register route
router.post("/register", validate(registerSchema), register);

// Email verification route
router.get("/verify-email", verifyEmail);

// Login route
router.post("/login", validate(loginSchema), login);

// Forgot password (Mengirim email dengan token)
router.post("/forgot-password", validate(forgotPasswordSchema), forgotPassword);

// Reset password (Menggunakan token untuk mereset password)
router.post("/reset-password", validate(resetPasswordSchema), resetPassword);

// Google OAuth routes
router.post("/google", loginWithGoogle);

router.post("/logout", logout);
router.get("/me", authenticateToken, me);

router.post("/verify", verifyToken);

router.get("/callback", handleOAuthCallback);

router.post(
  "/change-password",
  authenticateToken,
  validate(changePasswordSchema),
  changePassword
);

module.exports = router;
