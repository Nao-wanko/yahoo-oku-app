/**
 * Supabase 接続用アダプター（将来実装）
 * 現在はローカル State を使用しているため、このファイルは参照されません。
 * 接続時は以下を実装し、page や context からこのアダプターを利用するように切り替えてください。
 *
 * - fetchProducts(): Promise<Product[]>
 * - updateProduct(id: string, updates: Partial<Product>): Promise<void>
 * - uploadProductImage(productId: string, file: File): Promise<string>
 */

import type { Product } from "@/types/product";

export type SupabaseProductsAdapter = {
  fetchProducts: () => Promise<Product[]>;
  updateProduct: (id: string, updates: Partial<Product>) => Promise<void>;
  addProduct: (product: Product) => Promise<void>;
  removeProduct: (id: string) => Promise<void>;
};

// 例: 接続時の実装イメージ
// import { createClient } from '@supabase/supabase-js';
// const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
// export async function fetchProducts(): Promise<Product[]> {
//   const { data, error } = await supabase.from('products').select('*').order('updated_at', { ascending: false });
//   if (error) throw error;
//   return (data ?? []).map(row => ({ ...row, updatedAt: row.updated_at, ... }));
// }
