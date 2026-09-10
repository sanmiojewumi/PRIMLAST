import multer from 'multer';
import path from 'path';
import crypto from 'crypto';
import { getUploadsDir } from '../uploadsPath';

const UPLOAD_DIR = getUploadsDir();

const ALLOWED_EXTENSIONS = ['.pdf', '.docx', '.doc', '.jpg', '.jpeg', '.png', '.webp', '.heic', '.heif'];
const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'image/jpeg',
  'image/jpg',
  'image/pjpeg',
  'image/png',
  'image/webp',
  'image/heic',
  'image/heif',
  'application/octet-stream'
];

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, getUploadsDir());
  },
  filename: (_req, file, cb) => {
    let ext = path.extname(file.originalname).toLowerCase();
    if (ext === '.jpeg') ext = '.jpg';
    if (!ext) ext = '.bin';
    cb(null, crypto.randomUUID() + ext);
  }
});

const fileFilter = (_req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const ext = path.extname(file.originalname).toLowerCase();

  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    return cb(new Error(`Extension not allowed. Supported types: ${ALLOWED_EXTENSIONS.join(', ')}`));
  }

  const mime = (file.mimetype || '').toLowerCase();
  if (mime && !ALLOWED_MIME_TYPES.includes(mime)) {
    return cb(new Error('File type not allowed. Use PDF, DOCX, JPG, PNG, or WEBP.'));
  }

  cb(null, true);
};

export const uploadSecure = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 15 * 1024 * 1024
  }
});

export { UPLOAD_DIR };
