/**
 * 商品・出品管理の型定義
 * 後で Supabase のテーブルと対応させる想定
 */

export type ListingStatus = "not_listed" | "listed";

export interface Product {
  id: string;
  /** 商品名 */
  name: string;
  /** 価格（円） */
  price: number;
  /** 商品の状態（例: 新品、中古） */
  condition: string;
  /** 説明文 */
  description: string;
  /** ステータス */
  status: ListingStatus;
  /** 画像URLまたはDataURL（最大10枚、ローカルState用） */
  images: string[];
  /** 更新日時（ソート用） */
  updatedAt: string;
}

/** CSV 1行からマッピングするときのキー候補（ヘッダー名のゆらぎに対応） */
export const CSV_FIELD_MAP: Record<string, keyof Omit<Product, "id" | "images" | "updatedAt">> = {
  "商品名": "name",
  name: "name",
  "価格": "price",
  price: "price",
  "商品の状態": "condition",
  condition: "condition",
  "説明": "description",
  description: "description",
  "ステータス": "status",
  status: "status",
};

export function createEmptyProduct(overrides?: Partial<Product>): Product {
  return {
    id: crypto.randomUUID(),
    name: "",
    price: 0,
    condition: "",
    description: "",
    status: "not_listed",
    images: [],
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}
