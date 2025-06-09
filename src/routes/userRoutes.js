// routes/userRoutes.js
const express = require('express');
const router = express.Router();
const upload = require('../middleware/uploadMiddleware');
const userController = require('../controllers/userController');
const {authenticateToken} = require('../middleware/authMiddleware'); // pastikan user terautentikasi

router.post('/upload-profile', authenticateToken, upload.single('profileImage'), authenticateToken, userController.uploadProfilePicture);
router.get('/profile-picture', authenticateToken, userController.getProfilePicture);

module.exports = router;
