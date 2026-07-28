import app from "../server/src/index";
import { getDb } from "../server/src/db";

export default async function handler(req: any, res: any) {
  try {
    await getDb();
  } catch (e) {
    console.error("Vercel DB initialization error:", e);
  }
  return app(req, res);
}
