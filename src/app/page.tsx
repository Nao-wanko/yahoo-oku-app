"use client";

import { useCallback, useState } from "react";
import { CsvUpload } from "@/components/csv-upload";
import { ProductTable } from "@/components/product-table";
import type { Product } from "@/types/product";
import { initialProducts } from "@/lib/products-store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function DashboardPage() {
  const [products, setProducts] = useState<Product[]>(initialProducts);

  const handleCsvParsed = useCallback((parsed: Product[]) => {
    setProducts(parsed);
  }, []);

  const handleUpdateProduct = useCallback((id: string, updates: Partial<Product>) => {
    setProducts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...updates } : p))
    );
  }, []);

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="border-b bg-background">
        <div className="container mx-auto px-4 py-4">
          <h1 className="text-xl font-semibold tracking-tight text-foreground">
            ヤフオク出品管理
          </h1>
          <p className="text-sm text-muted-foreground">
            CSVで商品を読み込み、一覧で編集・画像を管理できます
          </p>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 space-y-6">
        <section>
          <h2 className="mb-3 text-sm font-medium text-muted-foreground">
            CSVアップロード
          </h2>
          <CsvUpload onParsed={handleCsvParsed} />
        </section>

        <section>
          <Card>
            <CardHeader>
              <CardTitle>商品一覧</CardTitle>
              <p className="text-sm font-normal text-muted-foreground">
                行をクリックして画像を追加・編集。フィルタとソートで絞り込み可能です。
              </p>
            </CardHeader>
            <CardContent>
              <ProductTable
                products={products}
                onUpdate={handleUpdateProduct}
              />
            </CardContent>
          </Card>
        </section>
      </main>
    </div>
  );
}
