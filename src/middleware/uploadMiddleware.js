//file: src/middleware/uploadMiddleware.js
const multer = require('multer');

const storage = multer.memoryStorage(); // Simpan sementara di memori
const upload = multer({ storage });

module.exports = upload;
