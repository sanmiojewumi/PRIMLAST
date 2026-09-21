import app from "../server/src/index";
import { getDb } from "../server/src/db";

export default async function handler(req: any, res: any) {
  // Ensure req.url preserves original request path for Express router on Vercel
  const originalUri = req.headers['x-forwarded-uri'] || req.headers['x-matched-path'] || req.url;
  if (originalUri && typeof originalUri === 'string' && !originalUri.startsWith('/api/index.ts')) {
    req.url = originalUri;
  } else if (req.url && req.url.startsWith('/api/index.ts')) {
    req.url = req.url.replace('/api/index.ts', '') || '/api/health';
  }

  try {
    await getDb();
  } catch (e) {
    console.error("Vercel DB initialization notice:", e);
  }
  return app(req, res);
}
