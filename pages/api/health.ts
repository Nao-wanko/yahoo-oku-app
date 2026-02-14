import type { NextApiRequest, NextApiResponse } from "next";

/**
 * デプロイ確認用: GET /api/health
 * ルートの pages/api で Vercel が確実に認識するように
 */
export default function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  if (req.method === "OPTIONS") {
    res.status(204).end();
    return;
  }
  if (req.method !== "GET") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }
  res.status(200).json({ ok: true, api: "health" });
}
