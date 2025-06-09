//src/services/storageService.js

const supabase = require('../config/supabase');
const { v4: uuidv4 } = require('uuid');
const path = require('path');

const uploadProfilePhoto = async (fileBuffer, fileName, userId, mimetype) => {
  try {
    const fileExt = path.extname(fileName);
    const uniqueFileName = `${userId}/${uuidv4()}${fileExt}`;

    const { data, error: uploadError } = await supabase.storage
      .from('profile-photos')
      .upload(uniqueFileName, fileBuffer, {
        contentType: mimetype,
        upsert: true,
        metadata: {
          user_id: userId.toString(), // ← Tambahkan ini
        },
      });

    if (uploadError) throw uploadError;

    const { data: publicUrlData } = supabase.storage
      .from('profile-photos')
      .getPublicUrl(uniqueFileName);

    return publicUrlData.publicUrl;
  } catch (err) {
    console.error('Upload error:', err.message);
    throw err;
  }
};

const deleteProfilePhoto = async (fileUrl) => {
  try {
    // fileUrl contoh: https://xyz.supabase.co/storage/v1/object/public/profile-photos/userid/uuid.jpg
    // Kita perlu ambil path relatif di bucket, misal: 'userid/uuid.jpg'
    const url = new URL(fileUrl);
    const pathname = url.pathname; // /storage/v1/object/public/profile-photos/userid/uuid.jpg

    // Karena bucket 'profile-photos', path setelah itu adalah file path di bucket
    // pathname = /storage/v1/object/public/profile-photos/ + filePath
    const prefix = `/storage/v1/object/public/profile-photos/`;
    if (!pathname.startsWith(prefix)) {
      throw new Error('Invalid file URL');
    }
    const filePath = pathname.slice(prefix.length); // 'userid/uuid.jpg'

    const { error } = await supabase.storage
      .from('profile-photos')
      .remove([filePath]);

    if (error) throw error;

    return true;
  } catch (err) {
    console.error('Delete error:', err.message);
    throw err;
  }
};

module.exports = {
  uploadProfilePhoto,
  deleteProfilePhoto,
};
