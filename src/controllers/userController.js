const { uploadProfilePhoto, deleteProfilePhoto } = require('../services/storageService');
const User = require('../models/user');

const uploadProfilePicture = async (req, res) => {
  try {
    const userId = req.user.userId;
    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const file = req.file;
    if (!file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    // Cari user dan dapatkan foto lama
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.profile_picture) {
      try {
        await deleteProfilePhoto(user.profile_picture);
      } catch (err) {
        // Log error hapus foto lama, tapi jangan stop proses upload baru
        console.error('Failed to delete old profile picture:', err.message);
      }
    }

    // Upload foto baru
    const publicUrl = await uploadProfilePhoto(file.buffer, file.originalname, userId, file.mimetype);

    // Update user dengan URL baru
    const updatedUser = await User.updateProfilePicture(userId, publicUrl);

    res.json({ message: 'Profile picture updated', user: updatedUser });
  } catch (err) {
    res.status(500).json({ message: 'Upload failed', error: err.message });
  }
};



const getProfilePicture = async (req, res) => {
  try {
    const userId = req.user.userId;
    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (!user.profile_picture) {
      return res.status(404).json({ message: 'No profile picture found' });
    }

    // Bisa kirim URL public langsung
    res.json({ profile_picture: user.profile_picture });
  } catch (err) {
    res.status(500).json({ message: 'Failed to get profile picture', error: err.message });
  }
};



module.exports = {
  uploadProfilePicture,
    getProfilePicture
};