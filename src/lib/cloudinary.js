import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';
import path from 'path';

const isCloudinaryConfigured = 
  process.env.CLOUDINARY_CLOUD_NAME && 
  process.env.CLOUDINARY_API_KEY && 
  process.env.CLOUDINARY_API_SECRET;

if (isCloudinaryConfigured) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
}

/**
 * Uploads a base64 image to Cloudinary or falls back to local storage.
 * @param {string} base64String - Base64 encoded image data (with or without data URI prefix).
 * @param {string} prefix - Filename prefix (e.g. 'avatar', 'post').
 * @returns {Promise<string>} The URL/path of the uploaded image.
 */
export async function uploadImage(base64String, prefix = 'upload') {
  if (!base64String) return null;

  // Check if it's already a URL
  if (
    typeof base64String === 'string' &&
    (base64String.startsWith('http://') || base64String.startsWith('https://') || base64String.startsWith('/'))
  ) {
    return base64String;
  }

  if (isCloudinaryConfigured) {
    try {
      const uploadResponse = await cloudinary.uploader.upload(base64String, {
        folder: 'post_share_app',
      });
      return uploadResponse.secure_url;
    } catch (error) {
      console.error('Cloudinary upload error, falling back to local:', error);
      // Fall through to local fallback on failure
    }
  }

  // Local fallback
  try {
    // Extract base64 data
    const matches = base64String.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    let imageBuffer;
    let extension = 'png';

    if (matches && matches.length === 3) {
      const type = matches[1];
      extension = type.split('/')[1] || 'png';
      imageBuffer = Buffer.from(matches[2], 'base64');
    } else {
      // Try parsing direct base64 without prefix
      imageBuffer = Buffer.from(base64String, 'base64');
    }

    const filename = `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${extension}`;
    const uploadDir = path.join(process.cwd(), 'public', 'uploads');

    // Ensure uploads directory exists
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const filePath = path.join(uploadDir, filename);
    fs.writeFileSync(filePath, imageBuffer);

    return `/uploads/${filename}`;
  } catch (error) {
    console.error('Local file write error:', error);
    throw new Error('Failed to save image locally.');
  }
}
