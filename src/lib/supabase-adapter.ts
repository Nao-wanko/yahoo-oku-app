"use client";

/**
 * Supabase 接続アダプター
 * - 商品テキストデータ: Database (products テーブル)
 * - 画像ファイル: Storage (product-images バケット)
 */

import type { Product } from "@/types/product";
import type { ListingStatus } from "@/types/product";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

const PRODUCTS_TABLE = "products";
const STORAGE_BUCKET = "product-images";

/** DB の行型（スネークケース） */
interface ProductRow {
  id: string;
  name: string;
  price: number;
  condition: string;
  description: string;
  salesmode?: string;
  status: string;
  images: string[];
  updated_at: string;
  closing_ymd?: string | null;
  closing_time?: number | null;
  shipping?: string | null;
  shipschedule?: string | null;
  loc_cd?: string | null;
  ship_method?: string | null;
}

function rowToProduct(row: ProductRow): Product {
  return {
    id: row.id,
    name: row.name ?? "",
    price: Number(row.price) ?? 0,
    condition: row.condition ?? "",
    description: row.description ?? "",
    salesmode: (row.salesmode as "auction" | "buynow") ?? "auction",
    status: (row.status as ListingStatus) ?? "not_listed",
    images: Array.isArray(row.images) ? row.images : [],
    updatedAt: row.updated_at ?? new Date().toISOString(),
    closingYMD: row.closing_ymd ?? undefined,
    closingTime: row.closing_time ?? undefined,
    shipping: (row.shipping as "seller" | "buyer") ?? undefined,
    shipschedule: (row.shipschedule as "1" | "7" | "2") ?? undefined,
    locCd: row.loc_cd ?? undefined,
    shipMethod: row.ship_method ?? undefined,
  };
}

function productToRow(p: Partial<Product>): Partial<ProductRow> {
  const row: Partial<ProductRow> = {};
  if (p.name !== undefined) row.name = p.name;
  if (p.price !== undefined) row.price = p.price;
  if (p.condition !== undefined) row.condition = p.condition;
  if (p.description !== undefined) row.description = p.description;
  if (p.salesmode !== undefined) row.salesmode = p.salesmode;
  if (p.status !== undefined) row.status = p.status;
  if (p.images !== undefined) row.images = p.images;
  if (p.updatedAt !== undefined) row.updated_at = p.updatedAt;
  if (p.closingYMD !== undefined) row.closing_ymd = p.closingYMD;
  if (p.closingTime !== undefined) row.closing_time = p.closingTime;
  if (p.shipping !== undefined) row.shipping = p.shipping;
  if (p.shipschedule !== undefined) row.shipschedule = p.shipschedule;
  if (p.locCd !== undefined) row.loc_cd = p.locCd;
  if (p.shipMethod !== undefined) row.ship_method = p.shipMethod;
  return row;
}

/**
 * 商品一覧を取得（更新日時の降順）
 */
export async function fetchProducts(): Promise<Product[]> {
  if (!supabase || !isSupabaseConfigured()) return [];
  const { data, error } = await supabase
    .from(PRODUCTS_TABLE)
    .select("*")
    .order("updated_at", { ascending: false });
  if (error) {
    console.error("fetchProducts error:", error);
    throw error;
  }
  return (data ?? []).map((row: ProductRow) => rowToProduct(row));
}

/**
 * 商品を1件更新
 */
export async function updateProduct(
  id: string,
  updates: Partial<Product>
): Promise<void> {
  if (!supabase || !isSupabaseConfigured()) return;
  const row = productToRow(updates);
  if (Object.keys(row).length === 0) return;
  const { error } = await supabase
    .from(PRODUCTS_TABLE)
    .update(row)
    .eq("id", id);
  if (error) {
    console.error("updateProduct error:", error);
    throw error;
  }
}

/**
 * 商品を1件追加
 */
export async function addProduct(product: Product): Promise<void> {
  if (!supabase || !isSupabaseConfigured()) return;
  // 新カラム（closing_ymd等）はマイグレーション未実行だと失敗するため、insertでは含めない
  const row: ProductRow = {
    id: product.id,
    name: product.name,
    price: product.price,
    condition: product.condition,
    description: product.description,
    salesmode: product.salesmode ?? "auction",
    status: product.status,
    images: product.images ?? [],
    updated_at: product.updatedAt ?? new Date().toISOString(),
  };
  const { error } = await supabase.from(PRODUCTS_TABLE).insert(row);
  if (error) {
    console.error("addProduct error:", error);
    throw error;
  }
}

/**
 * 商品を複数件一括追加（CSV取り込み用）
 */
export async function addProducts(products: Product[]): Promise<void> {
  if (!supabase || !isSupabaseConfigured() || products.length === 0) return;
  // 新カラム（closing_ymd等）はマイグレーション未実行だと失敗するため、insertでは含めない
  const rows: ProductRow[] = products.map((p) => ({
    id: p.id,
    name: p.name,
    price: p.price,
    condition: p.condition,
    description: p.description,
    salesmode: p.salesmode ?? "auction",
    status: p.status,
    images: p.images ?? [],
    updated_at: p.updatedAt ?? new Date().toISOString(),
  }));
  const { error } = await supabase.from(PRODUCTS_TABLE).insert(rows);
  if (error) {
    console.error("addProducts error:", error);
    throw error;
  }
}

/**
 * 商品を1件削除
 */
export async function removeProduct(id: string): Promise<void> {
  if (!supabase || !isSupabaseConfigured()) return;
  const { error } = await supabase.from(PRODUCTS_TABLE).delete().eq("id", id);
  if (error) {
    console.error("removeProduct error:", error);
    throw error;
  }
}

/**
 * 商品画像を Storage にアップロードし、公開URLを返す
 * パス: product-images/{productId}/{uuid}.{ext}
 */
export async function uploadProductImage(
  productId: string,
  file: File
): Promise<string> {
  if (!supabase || !isSupabaseConfigured()) {
    throw new Error("Supabase が未設定です");
  }
  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const safeExt = /^(jpg|jpeg|gif)$/.test(ext) ? ext : "jpg";
  const path = `${productId}/${crypto.randomUUID()}.${safeExt}`;
  const contentType = file.type || (safeExt === "gif" ? "image/gif" : "image/jpeg");
  const { error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .upload(path, file, { contentType, upsert: false });
  if (error) {
    console.error("uploadProductImage error:", error);
    throw error;
  }
  const { data } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

/**
 * 商品画像を Storage から削除
 * URL からパスを抽出して削除する
 */
export async function deleteProductImage(imageUrl: string): Promise<void> {
  if (!supabase || !isSupabaseConfigured()) return;
  try {
    const url = new URL(imageUrl);
    const pathMatch = url.pathname.match(
      /\/storage\/v1\/object\/public\/[^/]+\/(.+)$/
    );
    const path = pathMatch?.[1];
    if (!path) return;
    await supabase.storage.from(STORAGE_BUCKET).remove([path]);
  } catch {
    // URL が自前の Storage でない場合は無視
  }
}
