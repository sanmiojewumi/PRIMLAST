import fs from 'fs';
import path from 'path';

export function getUploadsDir(): string {
  const isVercel = Boolean(process.env.VERCEL || process.env.VERCEL_ENV || process.env.NOW_REGION);
  const dir = isVercel ? '/tmp/uploads' : path.resolve(__dirname, '..', 'uploads');
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return dir;
}
