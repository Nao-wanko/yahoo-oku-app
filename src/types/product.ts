/**
 * 商品・出品管理の型定義
 * 後で Supabase のテーブルと対応させる想定
 */

export type ListingStatus = "not_listed" | "listed";

/** 販売形式 */
export type SalesMode = "auction" | "buynow";

/** 送料負担: 出品者 / 落札者 */
export type Shipping = "seller" | "buyer";

/** 発送までの日数: 1〜2日=1, 2〜3日=7, 3〜7日=2 */
export type Shipschedule = "1" | "7" | "2";

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
  /** 販売形式: オークション / フリマ（定額） */
  salesmode?: SalesMode;
  /** ステータス */
  status: ListingStatus;
  /** 画像URLまたはDataURL（最大10枚、ローカルState用） */
  images: string[];
  /** 更新日時（ソート用） */
  updatedAt: string;
  /** 終了日（YYYY-MM-DD）オークション用 */
  closingYMD?: string;
  /** 終了時刻（0-23時）オークション用 */
  closingTime?: number;
  /** 送料負担: seller=出品者, buyer=落札者 */
  shipping?: Shipping;
  /** 発送までの日数: 1=1〜2日, 7=2〜3日, 2=3〜7日 */
  shipschedule?: Shipschedule;
  /** 発送元の地域（都道府県コード 1-47, 48=海外） */
  locCd?: string;
}

/** ヤフオク商品の状態（istatus）の選択肢 */
export const YAHOO_CONDITION_OPTIONS = [
  "未使用",
  "未使用に近い",
  "目立った傷や汚れなし",
  "やや傷や汚れあり",
  "傷や汚れあり",
  "全体的に状態が悪い",
] as const;

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
  "販売形式": "salesmode",
  salesmode: "salesmode",
  "終了日": "closingYMD",
  closingYMD: "closingYMD",
  "終了時刻": "closingTime",
  closingTime: "closingTime",
  "送料負担": "shipping",
  shipping: "shipping",
  "発送までの日数": "shipschedule",
  shipschedule: "shipschedule",
  "発送元": "locCd",
  locCd: "locCd",
};

export function createEmptyProduct(overrides?: Partial<Product>): Product {
  return {
    id: crypto.randomUUID(),
    name: "",
    price: 0,
    condition: "",
    description: "",
    salesmode: "auction",
    status: "not_listed",
    images: [],
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}
