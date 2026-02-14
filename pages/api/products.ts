import type { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@supabase/supabase-js";

const PRODUCTS_TABLE = "products";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

function setCors(res: NextApiResponse) {
  Object.entries(corsHeaders).forEach(([key, value]) => {
    res.setHeader(key, value);
  });
}

/**
 * GET: 未出品の商品リスト（Chrome 拡張機能用）
 * ルートの pages/api（app と同階層）で Vercel が認識
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  setCors(res);
  if (req.method === "OPTIONS") {
    res.status(204).end();
    return;
  }
  if (req.method !== "GET") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    res.status(503).json({ error: "Supabase が未設定です" });
    return;
  }

  const supabase = createClient(url, key);
  const { data, error } = await supabase
    .from(PRODUCTS_TABLE)
    .select("*")
    .eq("status", "not_listed")
    .order("updated_at", { ascending: false });

  if (error) {
    console.error("GET /api/products error:", error);
    res.status(500).json({ error: error.message });
    return;
  }

  const products = (data ?? []).map((row: Record<string, unknown>) => ({
    id: row.id,
    name: row.name ?? "",
    price: Number(row.price) ?? 0,
    condition: row.condition ?? "",
    description: row.description ?? "",
    status: row.status ?? "not_listed",
    images: Array.isArray(row.images) ? row.images : [],
    updatedAt: row.updated_at ?? new Date().toISOString(),
  }));

  res.status(200).json(products);
}
