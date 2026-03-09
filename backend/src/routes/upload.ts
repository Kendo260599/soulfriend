/**
 * Upload Routes - Image upload for chat
 * Supports Cloudinary (production) and local storage (development fallback)
 */

import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import cloudinary from '../config/cloudinary';
import { logger } from '../utils/logger';

const router = Router();

// Allowed MIME types
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const MAX_SIZE = 5 * 1024 * 1024; // 5MB

// Multer config — memory storage for Cloudinary upload
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_SIZE },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_TYPES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Chỉ hỗ trợ file ảnh (JPEG, PNG, GIF, WebP)'));
    }
  },
});

/**
 * POST /api/v2/upload/image
 * Upload a single image
 * Returns: { url: string, publicId: string }
 */
router.post('/image', upload.single('image'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      res.status(400).json({ error: 'Không có file ảnh' });
      return;
    }

    // Check if Cloudinary is configured
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    if (cloudName) {
      // Upload to Cloudinary
      const result = await new Promise<any>((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder: 'soulfriend/chat',
            resource_type: 'image',
            transformation: [
              { width: 1200, height: 1200, crop: 'limit' }, // Max dimensions
              { quality: 'auto:good' },
              { fetch_format: 'auto' },
            ],
          },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        );
        uploadStream.end(req.file!.buffer);
      });

      logger.info('Image uploaded to Cloudinary', { publicId: result.public_id });

      res.json({
        url: result.secure_url,
        publicId: result.public_id,
        width: result.width,
        height: result.height,
      });
      return;
    }

    // Fallback: save locally (development)
    const uploadsDir = path.join(__dirname, '../../uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const ext = path.extname(req.file.originalname) || '.jpg';
    const safeName = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}${ext}`;
    const filePath = path.join(uploadsDir, safeName);
    
    fs.writeFileSync(filePath, req.file.buffer);

    logger.info('Image saved locally', { filename: safeName });

    const baseUrl = `${req.protocol}://${req.get('host')}`;
    res.json({
      url: `${baseUrl}/uploads/${safeName}`,
      publicId: safeName,
    });
  } catch (error) {
    logger.error('Image upload failed', { error });
    res.status(500).json({ error: 'Tải ảnh thất bại' });
  }
});

export default router;
