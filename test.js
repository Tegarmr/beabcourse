const fs = require('fs');
const path = require('path');
const { uploadProfilePhoto } = require('./src/services/storageService');

(async () => {
  try {
    const filePath = "C:/Users/Alif/Pictures/Screenshots/Screenshot 2025-05-06 160847.png";

    // Baca file jadi buffer
    const fileBuffer = fs.readFileSync(filePath);

    // Dapatkan nama file dari path
    const fileName = path.basename(filePath); // "Screenshot 2025-05-06 160847.png"

    // User id contoh
    const userId = 8;

    // Tentukan mimetype gambar png
    const mimetype = 'image/png';

    // Upload ke supabase
    const publicUrl = await uploadProfilePhoto(fileBuffer, fileName, userId, mimetype);

    console.log('Public URL:', publicUrl);
  } catch (err) {
    console.error('Error:', err);
  }
})();
