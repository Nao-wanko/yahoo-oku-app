"use client";

import { useCallback, useState } from "react";
import Papa from "papaparse";
import { Upload, FileSpreadsheet } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { createProductFromCsvRow } from "@/lib/products-store";
import type { Product } from "@/types/product";

type CsvUploadProps = {
  onParsed: (products: Product[]) => void;
};

export function CsvUpload({ onParsed }: CsvUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const parseFile = useCallback(
    (file: File) => {
      setError(null);
      if (!file.name.toLowerCase().endsWith(".csv")) {
        setError("CSVファイルを選択してください。");
        return;
      }
      Papa.parse<string[]>(file, {
        header: true,
        skipEmptyLines: true,
        encoding: "UTF-8",
        complete: (results) => {
          if (results.errors.length > 0) {
            setError(results.errors[0].message ?? "CSVの解析に失敗しました。");
            return;
          }
          try {
            const rows = results.data as unknown as Record<string, string>[];
            const products: Product[] = rows.map((row) => createProductFromCsvRow(row));
            onParsed(products);
          } catch (err) {
            setError(
              err instanceof Error ? err.message : "CSVの取り込みに失敗しました。"
            );
          }
        },
      });
    },
    [onParsed]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) parseFile(file);
    },
    [parseFile]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) parseFile(file);
      e.target.value = "";
    },
    [parseFile]
  );

  return (
    <Card className="border-2 border-dashed transition-colors">
      <CardContent className="p-0">
        <label
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className={`
            flex cursor-pointer flex-col items-center justify-center gap-3 px-6 py-10
            transition-colors
            ${isDragging ? "border-primary bg-primary/5" : "hover:bg-muted/50"}
          `}
        >
          <input
            type="file"
            accept=".csv"
            onChange={handleChange}
            className="sr-only"
            aria-label="CSVファイルを選択"
          />
          <div className="rounded-full bg-muted p-4">
            <Upload className="size-8 text-muted-foreground" />
          </div>
          <div className="text-center">
            <p className="font-medium text-foreground">
              CSVファイルをドラッグ＆ドロップ
            </p>
            <p className="text-sm text-muted-foreground">
              またはクリックしてファイルを選択
            </p>
          </div>
          <p className="flex items-center gap-2 text-xs text-muted-foreground">
            <FileSpreadsheet className="size-4" />
            商品名・価格・商品の状態・説明・ステータス を含むCSVに対応（商品の状態はヤフオクの選択肢推奨：未使用、目立った傷や汚れなし など）
          </p>
        </label>
        {error && (
          <p className="border-t bg-destructive/10 px-6 py-3 text-sm text-destructive">
            {error}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
