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

// File: src/controllers/authController.js
exports.register = async (req, res) => {
  const { username, email, password, confirmPassword } = req.body;

  // Memastikan password dan confirmPassword sama
  if (password !== confirmPassword) {
    return res
      .status(400)
      .json({ message: "confirmPassword tidak sama dengan password" });
  }

  try {
    // Mengecek apakah email sudah digunakan
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      return res.status(409).json({
        message: "Email sudah digunakan, silahkan ke halaman lupa password",
      });
    }

    // Meng-hash password
    const hashedPassword = await hashPassword(password);
    const verification_token = crypto.randomBytes(32).toString("hex");

    // Membuat pengguna baru
    const newUser = await User.create({
      username,
      email,
      password: hashedPassword,
      provider: "local",
      verification_token,
    });

    // Membuat link verifikasi
    const verifyLink = `http://localhost:5000/api/auth/verify-email?token=${verification_token}`;
    const html = `
      <p>Halo ${username},</p>
      <p>Silakan klik link berikut untuk verifikasi email Anda:</p>
      <a href="${verifyLink}">${verifyLink}</a>
    `;

    // Mengirim email verifikasi
    await sendEmail(email, "Verifikasi Email Anda", html);

    res.status(201).json({
      message: "Registrasi berhasil. Silakan cek email untuk verifikasi.",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", error });
  }
};

exports.verifyEmail = async (req, res) => {
  const { token } = req.query;
  try {
    const user = await User.verifyUser(token);
    if (!user)
      return res
        .status(400)
        .json({ message: "Token tidak valid atau sudah dipakai" });

    // res.status(200).json({ message: 'Email berhasil diverifikasi' });
    res.redirect("https://ab-course-fe-go-live.vercel.app/login");
  } catch (err) {
    res.status(500).json({ message: "Gagal memverifikasi email", error: err });
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
        message:
          "Akun ini terdaftar dengan metode lain. Silakan coba login menggunakan metode yang sesuai.",
      });
    }

    const isPasswordValid = await comparePassword(password, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({ message: "Email atau password salah" });
    }

    if (!user.is_verified) {
      return res.status(400).json({ message: "Email Anda belum diverifikasi" });
    }

    const payload = {
      userId: user.user_id,
      email: user.email,
      username: user.username,
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });

    // Simpan token di cookies jika rememberMe
    const options = {
      httpOnly: true, // Prevent access to the cookie from JavaScript
      secure: process.env.NODE_ENV === "production", // Use secure cookies in production
      maxAge: rememberMe ? 7 * 24 * 60 * 60 * 1000 : 60 * 60 * 1000, // 1 week if rememberMe, 1 hour otherwise
      // sameSite: "Strict", // Prevents CSRF attacks
    };
    res.cookie("token", token, options);
    res.status(200).json({
      message: "Login berhasil",
      token,
      user: {
        userId: user.user_id,
        nama_depan: user.nama_depan,
        nama_belakang: user.nama_belakang,
        email: user.email,
        username: user.username,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Terjadi kesalahan pada server", error });
  }
};

exports.logout = (req, res) => {
  // Hapus token dari cookies
  res.clearCookie("token");
  res.status(200).json({ message: "Logout berhasil" });
};

exports.loginWithGoogle = async (req, res) => {
  const { idToken } = req.body;

  try {
    // Verifikasi ID Token dengan Supabase
    const { user, error } = await supabase.auth.api.getUser(idToken);

    if (error || !user) {
      return res.status(401).json({ message: "Token Supabase tidak valid." });
    }

    const { email, user_metadata } = user;
    const { full_name, name, picture } = user_metadata || {};

    // Cek apakah user sudah ada di custom table
    let customUser = await User.findByEmail(email);

    if (!customUser) {
      // Jika belum ada, buat pengguna baru
      customUser = await User.create({
        nama_depan: full_name?.split(" ")[0] || name || "User",
        nama_belakang: full_name?.split(" ")[1] || "",
        username: email.split("@")[0],
        email: email,
        password: null, // Google login tidak perlu password
        provider: "google",
        is_verified: true,
      });
    }

    // Buat JWT token
    const payload = {
      userId: customUser.user_id,
      email: customUser.email,
      username: customUser.username,
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });

     const options = {
      maxAge: 60 * 60 * 1000, // 1 jam
      path: "/",
      domain: "localhost",
    };

    res.cookie("token", token, options);
    console.log("Token set in cookie");
    // Kirim response
    res.status(200).json({
      message: "Login berhasil",
      user: {
        userId: customUser.user_id,
        nama_depan: customUser.nama_depan,
        nama_belakang: customUser.nama_belakang,
        email: customUser.email,
        username: customUser.username,
        is_verified: customUser.is_verified,
      },
    });
  } catch (err) {
    console.error("Login Supabase gagal:", err);
    res.status(500).json({ message: "Login gagal", error: err });
  }
};

exports.handleOAuthCallback = async (req, res) => {
  try {
    const accessToken = req.query.access_token;
    const next = req.query.next ?? "/";

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
    const username = email.split("@")[0];

    let customUser = await User.findByEmail(email);
    if (!customUser) {
      customUser = await User.create({
        nama_depan: firstName,
        nama_belakang: lastName,
        username,
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

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 3600000,
      sameSite: "lax",
    });

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
  const password = newPassword;

  if (password !== confirmPassword) {
    return res
      .status(400)
      .json({ message: "Password dan konfirmasi password tidak cocok" });
  }

  try {
    const user = await User.findByResetToken(token);
    if (!user || user.reset_token_expiration < Date.now()) {
      return res
        .status(400)
        .json({ message: "Token tidak valid atau telah kedaluwarsa" });
    }

    if (user.provider !== "local") {
      return res.status(400).json({
        message: "Akun ini tidak mendukung reset password melalui metode ini",
      });
    }

    // Hash password baru
    const hashedPassword = await hashPassword(password);

    // Update password di database
    await User.updatePassword(user.email, hashedPassword);

    res.status(200).json({
      message:
        "Password berhasil direset. Silakan login dengan password baru Anda.",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Terjadi kesalahan pada server", error });
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
    if (!user) {
      return res.status(400).json({ message: "Email tidak ditemukan" });
    }

    if (user.provider !== "local") {
      return res.status(400).json({
        message:
          "Reset password hanya berlaku untuk akun yang menggunakan email dan password",
      });
    }

    // Generate token reset password
    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetTokenExpiration = new Date(Date.now() + 3600000).toISOString(); // Token berlaku selama 1 jam

    // Simpan token dan waktu kedaluwarsa di database
    await User.updateResetToken(email, resetToken, resetTokenExpiration);

    // Kirim email dengan link reset password
    const resetLink = `https://ab-course-fe-go-live.vercel.app/reset-password?token=${resetToken}`;
    const html = `
      <p>Halo,</p>
      <p>Silakan klik link berikut untuk mereset password Anda:</p>
      <a href="${resetLink}">${resetLink}</a>
    `;
    await sendEmail(email, "Reset Password", html);

    res.status(200).json({
      message: "Kami telah mengirimkan email untuk mereset password Anda.",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Terjadi kesalahan pada server", error });
  }
};

exports.me = async (req, res) => {
  try {
    const token = req.cookies.token;
    if (!token) {
      return res
        .status(401)
        .json({ message: "Unauthorized: Token tidak ditemukan" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.userId); // atau cari berdasarkan email jika user model tidak punya findById
    if (!user) {
      return res.status(404).json({ message: "User tidak ditemukan" });
    }

    res.status(200).json({
      token,
      user: {
        userId: user.user_id,
        username: user.username,
        email: user.email,
        nama_depan: user.nama_depan,
        nama_belakang: user.nama_belakang,
      },
    });
  } catch (error) {
    console.error("Error di /me:", error.message);
    res.status(401).json({ message: "Token tidak valid atau sudah expired" });
  }
};

exports.changePassword = async (req, res) => {
  const { oldPassword, newPassword, confirmPassword } = req.body;

  // Validasi input
  if (!oldPassword || !newPassword || !confirmPassword) {
    return res.status(400).json({ message: "Semua field harus diisi" });
  }

  if (newPassword !== confirmPassword) {
    return res.status(400).json({
      message: "Konfirmasi password tidak sesuai dengan password baru",
    });
  }

  try {
    // Ambil user dari JWT token
    const token = req.cookies.token || req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res
        .status(401)
        .json({ message: "Unauthorized: Token tidak ditemukan" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId);

    if (!user) {
      return res.status(404).json({ message: "User tidak ditemukan" });
    }

    if (user.provider !== "local") {
      return res
        .status(400)
        .json({ message: "Akun ini tidak mendukung penggantian password" });
    }

    // Bandingkan old password
    const isOldPasswordValid = await comparePassword(
      oldPassword,
      user.password
    );
    if (!isOldPasswordValid) {
      return res.status(400).json({ message: "Password lama tidak sesuai" });
    }

    // Hash password baru dan update
    const hashedNewPassword = await hashPassword(newPassword);
    await User.changePassword(user.user_id, hashedNewPassword);

    res.status(200).json({ message: "Password berhasil diubah" });
  } catch (error) {
    console.error("Gagal mengubah password:", error);
    res.status(500).json({ message: "Terjadi kesalahan pada server", error });
  }
};
