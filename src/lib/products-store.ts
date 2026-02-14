"use client";

/**
 * 商品データの取得・更新
 * - 画面読み込み時: Supabase Database から商品一覧を取得
 * - 未設定時: ローカル State のみ（空配列）
 */

import { useState, useCallback, useEffect } from "react";
import type { Product } from "@/types/product";
import { createEmptyProduct } from "@/types/product";
import { isSupabaseConfigured } from "@/lib/supabase";
import {
  fetchProducts,
  updateProduct as updateProductApi,
  addProducts as addProductsApi,
  uploadProductImage as uploadProductImageApi,
  deleteProductImage as deleteProductImageApi,
} from "@/lib/supabase-adapter";

export type UseProductsReturn = {
  products: Product[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  updateProduct: (id: string, updates: Partial<Product>) => Promise<void>;
  /** CSV 取り込み: 渡した商品を DB に追加し、一覧を再取得 */
  addProductsFromCsv: (products: Product[]) => Promise<void>;
  uploadProductImage: (productId: string, file: File) => Promise<string>;
  deleteProductImage: (imageUrl: string) => Promise<void>;
};

export function useProducts(): UseProductsReturn {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (isSupabaseConfigured()) {
        const list = await fetchProducts();
        setProducts(list);
      } else {
        setProducts([]);
      }
    } catch (e) {
      const message = e instanceof Error ? e.message : "商品の取得に失敗しました";
      setError(message);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const updateProduct = useCallback(
    async (id: string, updates: Partial<Product>) => {
      if (isSupabaseConfigured()) {
        await updateProductApi(id, updates);
        setProducts((prev) =>
          prev.map((p) => (p.id === id ? { ...p, ...updates } : p))
        );
      } else {
        setProducts((prev) =>
          prev.map((p) => (p.id === id ? { ...p, ...updates } : p))
        );
      }
    },
    []
  );

  const addProductsFromCsv = useCallback(
    async (newProducts: Product[]) => {
      setError(null);
      try {
        if (isSupabaseConfigured() && newProducts.length > 0) {
          await addProductsApi(newProducts);
          await load();
        } else {
          setProducts(newProducts);
        }
      } catch (e) {
        const message =
          e instanceof Error ? e.message : "CSVの取り込みに失敗しました。";
        setError(message);
      }
    },
    [load]
  );

  const uploadProductImage = useCallback(
    async (productId: string, file: File): Promise<string> => {
      const url = await uploadProductImageApi(productId, file);
      return url;
    },
    []
  );

  const deleteProductImage = useCallback(async (imageUrl: string) => {
    await deleteProductImageApi(imageUrl);
  }, []);

  return {
    products,
    loading,
    error,
    refetch: load,
    updateProduct,
    addProductsFromCsv,
    uploadProductImage,
    deleteProductImage,
  };
}

/** 初期値（Supabase 未使用時のフォールバック用） */
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
  const status =
    statusRaw === "listed" || statusRaw === "出品済み" ? "listed" : "not_listed";
  const salesmodeRaw = get(["販売形式", "salesmode", "SalesMode"]).toLowerCase();
  const salesmode =
    salesmodeRaw === "auction" || salesmodeRaw === "オークション" ? "auction" : "buynow";
  const shippingRaw = get(["送料負担", "shipping", "Shipping"]).toLowerCase();
  const shipping =
    shippingRaw === "buyer" || shippingRaw === "落札者" ? "buyer" : "seller";
  const scheduleRaw = get(["発送までの日数", "shipschedule", "Shipschedule"]);
  const shipschedule =
    scheduleRaw === "7" || scheduleRaw === "2〜3日" ? "7" : scheduleRaw === "2" || scheduleRaw === "3〜7日" ? "2" : "1";
  const priceStr = get(["価格", "price", "Price"]);
  const price = parseInt(priceStr, 10) || 0;

  return createEmptyProduct({
    name: get(["商品名", "name", "Name"]),
    price,
    condition: get(["商品の状態", "condition", "Condition"]),
    description: get(["説明", "description", "Description"]),
    salesmode,
    status,
    closingYMD: get(["終了日", "closingYMD", "ClosingYMD"]) || undefined,
    closingTime: (() => {
      const t = parseInt(get(["終了時刻", "closingTime", "ClosingTime"]), 10);
      return Number.isFinite(t) && t >= 0 && t <= 23 ? t : undefined;
    })(),
    shipping,
    shipschedule: shipschedule as "1" | "7" | "2",
    locCd: get(["発送元", "locCd", "LocCd"]) || undefined,
  });
}
