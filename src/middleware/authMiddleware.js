const jwt = require('jsonwebtoken');

// Middleware wajib: verifikasi token dari cookies
const authenticateToken = (req, res, next) => {
  const token = req.cookies.token; // ambil dari cookies

  if (!token) {
    return res.status(401).json({ message: 'Unauthorized: No token provided' });
  }

  try {
    const user = jwt.verify(token, process.env.JWT_SECRET);
    req.user = user;
    next();
  } catch (error) {
    return res.status(403).json({ message: 'Invalid or expired token' });
  }
};

// Middleware opsional: token dari cookies, tapi lanjut meskipun token tidak ada atau invalid
const optionalAuthenticate = (req, res, next) => {
  const token = req.cookies.token; // ambil dari cookies juga

  if (!token) {
    // Tidak ada token, lanjut sebagai guest
    return next();
  }

  try {
    const user = jwt.verify(token, process.env.JWT_SECRET);
    req.user = user;
  } catch (error) {
    // Token invalid, abaikan error dan lanjut sebagai guest
  }

  next();
};

module.exports = {
  authenticateToken,
  optionalAuthenticate,
};
