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
  try {
    await getDb();
    return app(req, res);
  } catch (e: any) {
    console.error("API handler failed:", e);
    if (!res.headersSent) {
      res.status(500).json({ error: e?.message || "API unavailable. Please retry." });
    }
  }
}
