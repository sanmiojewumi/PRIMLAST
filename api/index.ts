import app from "../server/src/index";
import { getDb } from "../server/src/db";

function applyCors(res: any) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,HEAD,POST,PUT,PATCH,DELETE,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, bypass-tunnel-reminder");
}

export default async function handler(req: any, res: any) {
  applyCors(res);
  if (req.method === "OPTIONS") {
    res.status(204).end();
    return;
  }

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

  try {
    return app(req, res);
  } catch (e: any) {
    console.error("API handler failed:", e);
    if (!res.headersSent) {
      res.status(500).json({ error: e?.message || "API unavailable. Please retry." });
    }
  }
}
