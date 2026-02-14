import type { NextApiRequest, NextApiResponse } from "next";

/**
 * GET /api/health - ルートの pages/api（app と同階層）で Vercel が認識
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
