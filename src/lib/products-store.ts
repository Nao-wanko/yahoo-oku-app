"use client";

/**
 * 商品データの取得・更新の抽象層
 * 現在はローカル State で管理。後で Supabase に差し替え可能なように
 * このモジュールのインターフェースを維持する。
 */

import type { Product } from "@/types/product";
import { createEmptyProduct } from "@/types/product";

export type ProductsStore = {
  products: Product[];
  setProducts: (products: Product[] | ((prev: Product[]) => Product[])) => void;
  updateProduct: (id: string, updates: Partial<Product>) => void;
  addProduct: (product: Product) => void;
  removeProduct: (id: string) => void;
};

/** 初期値（空の商品を1件入れておくことも可。ここでは空配列） */
export const initialProducts: Product[] = [];

export function createProductFromCsvRow(row: Record<string, string>): Product {
  const get = (keys: string[]): string => {
    for (const k of keys) {
      const v = row[k];
      if (v != null && String(v).trim() !== "") return String(v).trim();
    }
    return "";
  };
  const statusRaw = get(["ステータス", "status", "Status"]).toLowerCase();
  const status = statusRaw === "listed" || statusRaw === "出品済み" ? "listed" : "not_listed";
  const priceStr = get(["価格", "price", "Price"]);
  const price = parseInt(priceStr, 10) || 0;

  return createEmptyProduct({
    name: get(["商品名", "name", "Name"]),
    price,
    condition: get(["商品の状態", "condition", "Condition"]),
    description: get(["説明", "description", "Description"]),
    status,
  });
}
