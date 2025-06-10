// File: src/controllers/authController.js
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const User = require("../models/user");
const { hashPassword, comparePassword } = require("../utils/hash");
const sendEmail = require("../utils/sendEmail");
const { OAuth2Client } = require("google-auth-library");
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
const cookieParser = require("cookie-parser");

const supabase = require("../config/supabase"); // Pastikan ini sesuai dengan konfigurasi Supabase Anda

// --- PERBAIKAN UTAMA ---
// Fungsi helper untuk membuat opsi cookie yang standar dan adaptif.
// Ini akan digunakan di semua fungsi agar konsisten dan benar.
const getCookieOptions = (maxAgeInMs) => {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    maxAge: maxAgeInMs,
  };
};
// --- PERBAIKAN UTAMA ---

// File: src/controllers/authController.js
exports.register = async (req, res) => {
  const { username, email, password, confirmPassword } = req.body;

  if (password !== confirmPassword) {
    return res
      .status(400)
      .json({ message: "confirmPassword tidak sama dengan password" });
  }

  try {
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      return res.status(409).json({
        message: "Email sudah digunakan, silahkan ke halaman lupa password",
      });
    }

    const hashedPassword = await hashPassword(password);
    const verification_token = crypto.randomBytes(32).toString("hex");

    await User.create({
      username,
      email,
      password: hashedPassword,
      provider: "local",
      verification_token,
    });

    // PERBAIKAN: Menggunakan URL backend dari environment variable
    const verifyLink = `${process.env.BACKEND_URL}/api/auth/verify-email?token=${verification_token}`;
    const html = `
      <p>Halo ${username},</p>
      <p>Silakan klik link berikut untuk verifikasi email Anda:</p>
      <a href="${verifyLink}">${verifyLink}</a>
    `;

    await sendEmail(email, "Verifikasi Email Anda", html);

    res.status(201).json({
      message: "Registrasi berhasil. Silakan cek email untuk verifikasi.",
    });
  } catch (error) {
    console.error("Register Error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.verifyEmail = async (req, res) => {
  const { token } = req.query;
  try {
    const user = await User.verifyUser(token);
    if (!user) {
      return res
        .status(400)
        .json({ message: "Token tidak valid atau sudah dipakai" });
    }
    // PERBAIKAN: Redirect ke URL frontend dari environment variable
    res.redirect(`${process.env.FRONTEND_URL}/login`);
  } catch (err) {
    console.error("Verify Email Error:", err);
    res.status(500).json({ message: "Gagal memverifikasi email", error: err.message });
  }
};

exports.login = async (req, res) => {
  const { email, password, rememberMe } = req.body;

  try {
    const user = await User.findByEmail(email);
    if (!user) {
      return res.status(400).json({ message: "Email atau password salah" });
    }

    if (user.provider !== "local") {
      return res.status(400).json({
        message: "Akun ini terdaftar dengan metode lain.",
      });
    }

    const isPasswordValid = await comparePassword(password, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({ message: "Email atau password salah" });
    }

    if (!user.is_verified) {
      return res.status(400).json({ message: "Email Anda belum diverifikasi" });
    }

    const payload = { userId: user.user_id, email: user.email, username: user.username };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "1h" });

    // PERBAIKAN: Menggunakan opsi cookie standar
    const maxAge = rememberMe ? 7 * 24 * 60 * 60 * 1000 : 60 * 60 * 1000;
    res.cookie("token", token, getCookieOptions(maxAge));

    res.status(200).json({
      message: "Login berhasil",
      token,
      user: { userId: user.user_id, username: user.username, email: user.email },
    });
  } catch (error) {
    console.error("Login Error:", error);
    res.status(500).json({ message: "Terjadi kesalahan pada server", error: error.message });
  }
};

exports.logout = (req, res) => {
  // PERBAIKAN: Menggunakan clearCookie dengan path agar bekerja konsisten
  res.clearCookie("token", { path: '/' });
  res.status(200).json({ message: "Logout berhasil" });
};

exports.loginWithGoogle = async (req, res) => {
    const { idToken } = req.body;

    try {
        const ticket = await client.verifyIdToken({
            idToken,
            audience: process.env.GOOGLE_CLIENT_ID,
        });
        const googlePayload = ticket.getPayload();
        const { email, name } = googlePayload;

        let customUser = await User.findByEmail(email);

        if (!customUser) {
            customUser = await User.create({
                nama_depan: name.split(" ")[0] || "User",
                nama_belakang: name.split(" ").slice(1).join(" ") || "",
                username: email.split("@")[0],
                email: email,
                password: null,
                provider: "google",
                is_verified: true,
            });
        }

        const payload = { userId: customUser.user_id, email: customUser.email, username: customUser.username };
        const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "1h" });

        // PERBAIKAN: Menggunakan opsi cookie standar
        res.cookie("token", token, getCookieOptions(60 * 60 * 1000));

        res.status(200).json({
            message: "Login berhasil",
            user: { userId: customUser.user_id, username: customUser.username, email: customUser.email },
        });
    } catch (err) {
        console.error("Login Google Gagal:", err);
        res.status(500).json({ message: "Login gagal", error: err.message });
    }
};

exports.handleOAuthCallback = async (req, res) => {
  try {
    const accessToken = req.query.access_token;
    
    if (!accessToken) {
      console.error("Missing access_token");
      return res.status(400).send("Missing access_token");
    }

    const decoded = jwt.decode(accessToken, { complete: true });

    if (!decoded) {
      return res.status(401).send("Invalid access token");
    }

    const email = decoded.payload.email;
    const name = decoded.payload.name || "User";
    const [firstName, ...lastNameParts] = name.split(" ");
    const lastName = lastNameParts.join(" ") || "";

    let customUser = await User.findByEmail(email);
    if (!customUser) {
      customUser = await User.create({
        nama_depan: firstName,
        nama_belakang: lastName,
        username: email.split("@")[0],
        email,
        password: null,
        provider: "google",
        is_verified: true,
      });
    }

    const token = jwt.sign(
      {
        userId: customUser.user_id,
        email: customUser.email,
        username: customUser.username,
      },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    // PERBAIKAN: Mengganti opsi manual dengan fungsi standar getCookieOptions.
    // Ini memastikan sameSite: 'none' dan secure: true digunakan di produksi.
    res.cookie("token", token, getCookieOptions(3600000)); // 3600000ms = 1 jam

    return res.json({
      status: true,
    });
  } catch (err) {
    console.error("OAuth Callback Error:", err);
    res.status(500).send("Internal Server Error");
  }
};

exports.resetPassword = async (req, res) => {
  const { token, newPassword, confirmPassword } = req.body;

  if (newPassword !== confirmPassword) {
    return res.status(400).json({ message: "Password dan konfirmasi password tidak cocok" });
  }

  try {
    const user = await User.findByResetToken(token);
    if (!user || new Date(user.reset_token_expiration) < Date.now()) {
      return res.status(400).json({ message: "Token tidak valid atau telah kedaluwarsa" });
    }

    const hashedPassword = await hashPassword(newPassword);
    await User.updatePassword(user.email, hashedPassword);

    res.status(200).json({ message: "Password berhasil direset. Silakan login." });
  } catch (error) {
    console.error("Reset Password Error:", error);
    res.status(500).json({ message: "Terjadi kesalahan pada server", error: error.message });
  }
};

exports.me = async (req, res) => {
  try {
    const token = req.cookies.token;
    if (!token) {
      return res.status(401).json({ message: "Unauthorized: Token tidak ditemukan" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId);

    if (!user) {
      return res.status(404).json({ message: "User tidak ditemukan" });
    }

    res.status(200).json({
      token,
      user: { userId: user.user_id, username: user.username, email: user.email },
    });
  } catch (error) {
    return res.status(401).json({ message: "Token tidak valid atau sudah expired" });
  }
};

exports.verifyToken = async (req, res) => {
  const { accessToken } = req.body;
  if (!accessToken) {
    return res.status(400).json({ error: "Missing accessToken" });
  }

  try {
    const decoded = jwt.verify(accessToken, process.env.JWT_SECRET);

    const appToken = jwt.sign(
      { userId: decoded.userId, email: decoded.email },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.cookie("token", appToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 3600000,
      sameSite: "lax",
    });

    res.json({ message: "Token verified and session created" });
  } catch (err) {
    console.error("Token verification failed:", err);
    res.status(401).json({ error: "Invalid or expired token" });
  }
};

exports.forgotPassword = async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findByEmail(email);
    if (!user || user.provider !== "local") {
      // Mengirim respons sukses palsu untuk mencegah enumerasi email
      return res.status(200).json({
        message: "Jika email Anda terdaftar, kami telah mengirimkan link reset password.",
      });
    }

    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetTokenExpiration = new Date(Date.now() + 3600000).toISOString();

    await User.updateResetToken(email, resetToken, resetTokenExpiration);

    // PERBAIKAN: Menggunakan URL frontend dari environment variable
    const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
    const html = `<p>Klik link ini untuk reset password Anda: <a href="${resetLink}">Reset Password</a></p>`;
    
    await sendEmail(email, "Reset Password", html);

    res.status(200).json({
      message: "Jika email Anda terdaftar, kami telah mengirimkan link reset password.",
    });
  } catch (error) {
    console.error("Forgot Password Error:", error);
    res.status(500).json({ message: "Terjadi kesalahan pada server", error: error.message });
  }
};

exports.changePassword = async (req, res) => {
  const { oldPassword, newPassword, confirmPassword } = req.body;
  const token = req.cookies.token;

  if (newPassword !== confirmPassword) {
    return res.status(400).json({ message: "Konfirmasi password tidak sesuai" });
  }

  try {
    if (!token) {
        return res.status(401).json({ message: "Unauthorized: Anda harus login" });
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId);

    if (!user || user.provider !== 'local') {
      return res.status(400).json({ message: "Akun ini tidak mendukung penggantian password." });
    }

    const isOldPasswordValid = await comparePassword(oldPassword, user.password);
    if (!isOldPasswordValid) {
      return res.status(400).json({ message: "Password lama tidak sesuai" });
    }

    const hashedNewPassword = await hashPassword(newPassword);
    await User.changePassword(user.user_id, hashedNewPassword);

    res.status(200).json({ message: "Password berhasil diubah" });
  } catch (error) {
    console.error("Change Password Error:", error);
    res.status(500).json({ message: "Terjadi kesalahan pada server", error: error.message });
  }
};
