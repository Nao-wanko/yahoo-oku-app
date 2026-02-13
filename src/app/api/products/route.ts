import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import type { Product } from "@/types/product";
import type { ListingStatus } from "@/types/product";

const PRODUCTS_TABLE = "products";

/** 未出品のみ取得用の CORS 付きレスポンスヘッダー */
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

/** OPTIONS（preflight）対応 */
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders,
  });
}

/** DB 行 → Product 型 */
function rowToProduct(row: {
  id: string;
  name: string;
  price: number;
  condition: string;
  description: string;
  status: string;
  images: string[];
  updated_at: string;
}): Product {
  return {
    id: row.id,
    name: row.name ?? "",
    price: Number(row.price) ?? 0,
    condition: row.condition ?? "",
    description: row.description ?? "",
    status: (row.status as ListingStatus) ?? "not_listed",
    images: Array.isArray(row.images) ? row.images : [],
    updatedAt: row.updated_at ?? new Date().toISOString(),
  };
}

/**
 * GET: 未出品の商品リストを返す（Chrome 拡張機能用）
 * Supabase products テーブルで status = 'not_listed' のものを取得
 */
export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    return NextResponse.json(
      { error: "Supabase が未設定です" },
      { status: 503, headers: corsHeaders }
    );
  }

  const supabase = createClient(url, key);

  const { data, error } = await supabase
    .from(PRODUCTS_TABLE)
    .select("*")
    .eq("status", "not_listed")
    .order("updated_at", { ascending: false });

  if (error) {
    console.error("GET /api/products error:", error);
    return NextResponse.json(
      { error: error.message },
      { status: 500, headers: corsHeaders }
    );
  }

  const products: Product[] = (data ?? []).map(rowToProduct);

  return NextResponse.json(products, {
    headers: corsHeaders,
  });
}
