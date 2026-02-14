"use client";

import { useState } from "react";
import { useProducts } from "@/lib/products-store";
import { CsvUpload } from "@/components/csv-upload";
import { BulkImageUpload } from "@/components/bulk-image-upload";
import { ProductTable } from "@/components/product-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

export default function DashboardPage() {
  const [uploadError, setUploadError] = useState<string | null>(null);
  const {
    products,
    loading,
    error,
    updateProduct,
    addProductsFromCsv,
    uploadProductImage,
    deleteProductImage,
  } = useProducts();

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="border-b bg-background">
        <div className="container mx-auto px-4 py-4">
          <h1 className="text-xl font-semibold tracking-tight text-foreground">
            ヤフオク出品管理
          </h1>
          <p className="text-sm text-muted-foreground">
            CSVで商品を読み込み、一覧で編集・画像を管理できます（Supabase に保存）
          </p>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 space-y-6">
        <section className="grid gap-6 md:grid-cols-2">
          <div>
            <h2 className="mb-3 text-sm font-medium text-muted-foreground">
              CSVアップロード
            </h2>
            <CsvUpload onParsed={addProductsFromCsv} />
          </div>
          <div>
            <h2 className="mb-3 text-sm font-medium text-muted-foreground">
              画像一括登録
            </h2>
            <BulkImageUpload
              products={products}
              onUploadImage={uploadProductImage}
              onUpdateProduct={updateProduct}
            />
          </div>
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
              {(error || uploadError) && (
                <p className="mb-4 rounded-md bg-destructive/10 px-4 py-3 text-sm text-destructive">
                  {uploadError ?? error}
                </p>
              )}
              {loading ? (
                <div className="flex items-center justify-center py-16">
                  <Loader2 className="size-8 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <ProductTable
                  products={products}
                  onUpdate={updateProduct}
                  onUploadImage={uploadProductImage}
                  onRemoveImage={deleteProductImage}
                  onUploadError={setUploadError}
                />
              )}
            </CardContent>
          </Card>
        </section>
      </main>
    </div>
  );
}
