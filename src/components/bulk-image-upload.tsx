"use client";

import { useCallback, useRef, useState } from "react";
import { ImagePlus, FolderOpen, Loader2, CheckCircle2, X } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Product } from "@/types/product";

const MAX_IMAGES_PER_PRODUCT = 10;

/** ファイル名から商品マッチ用のキーを抽出（先頭の _ または - の前まで） */
function getFilenameKey(filename: string): string {
  const base = filename.replace(/\.[^.]+$/, "");
  const parts = base.split(/[-_]/);
  return parts[0]?.trim() || base;
}

/** 商品名にキーが含まれるか（部分一致） */
function matchProduct(product: Product, key: string): boolean {
  if (!key) return false;
  return product.name.includes(key) || key.includes(product.name);
}

type BulkImageUploadProps = {
  products: Product[];
  onUploadImage: (productId: string, file: File) => Promise<string>;
  onUpdateProduct: (id: string, updates: Partial<Product>) => Promise<void>;
};

type ImageGroup = {
  productId: string;
  productName: string;
  files: File[];
};

export function BulkImageUpload({
  products,
  onUploadImage,
  onUpdateProduct,
}: BulkImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const folderRef = useRef<HTMLInputElement>(null);
  const [selectedProductId, setSelectedProductId] = useState<string>("");
  const [mode, setMode] = useState<"manual" | "auto">("manual");
  const [groups, setGroups] = useState<ImageGroup[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{
    current: number;
    total: number;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const collectImageFiles = useCallback((fileList: FileList | null): File[] => {
    if (!fileList) return [];
    const files: File[] = [];
    for (let i = 0; i < fileList.length; i++) {
      const f = fileList[i];
      if (f?.type?.startsWith("image/")) files.push(f);
    }
    return files;
  }, []);

  const collectFromFolder = useCallback(
    async (entries: FileSystemEntry[]): Promise<File[]> => {
      const files: File[] = [];
      const read = async (entry: FileSystemEntry): Promise<void> => {
        if (entry.isFile) {
          return new Promise((resolve) => {
            (entry as FileSystemFileEntry).file((f) => {
              if (f.type.startsWith("image/")) files.push(f);
              resolve();
            });
          });
        }
        if (entry.isDirectory) {
          const dir = entry as FileSystemDirectoryEntry;
          return new Promise((resolve) => {
            dir.createReader().readEntries(async (entries) => {
              for (const e of entries) await read(e);
              resolve();
            });
          });
        }
      };
      for (const e of entries) await read(e);
      return files;
    },
    []
  );

  const buildGroups = useCallback(
    (files: File[]): ImageGroup[] => {
      if (mode === "manual" && selectedProductId) {
        const product = products.find((p) => p.id === selectedProductId);
        if (!product) return [];
        return [{ productId: product.id, productName: product.name, files }];
      }
      // auto: ファイル名から商品をマッチング
      const map = new Map<string, File[]>();
      for (const f of files) {
        const key = getFilenameKey(f.name);
        if (!map.has(key)) map.set(key, []);
        map.get(key)!.push(f);
      }
      const result: ImageGroup[] = [];
      for (const [key, groupFiles] of map) {
        const product = products.find((p) => matchProduct(p, key));
        if (product) {
          result.push({
            productId: product.id,
            productName: product.name,
            files: groupFiles,
          });
        }
      }
      return result;
    },
    [mode, selectedProductId, products]
  );

  const handleFiles = useCallback(
    (files: File[]) => {
      setError(null);
      setSuccess(null);
      if (files.length === 0) {
        setError("画像ファイルが見つかりません。");
        return;
      }
      if (mode === "manual" && !selectedProductId) {
        setError("登録先の商品を選択してください。");
        return;
      }
      const grps = buildGroups(files);
      if (grps.length === 0) {
        setError(
          mode === "auto"
            ? "ファイル名から商品をマッチできませんでした。ファイル名の先頭に商品名の一部を含めてください（例: 商品名-1.jpg）。"
            : "登録先の商品を選択してください。"
        );
        return;
      }
      setGroups(grps);
    },
    [mode, selectedProductId, buildGroups]
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = collectImageFiles(e.target.files);
      handleFiles(files);
      e.target.value = "";
    },
    [collectImageFiles, handleFiles]
  );

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setError(null);
      setSuccess(null);

      const items = e.dataTransfer.items;
      const files: File[] = [];

      if (items) {
        const entries: FileSystemEntry[] = [];
        for (let i = 0; i < items.length; i++) {
          const entry = items[i].webkitGetAsEntry?.();
          if (entry) entries.push(entry);
        }
        if (entries.some((e) => e?.isDirectory)) {
          const collected = await collectFromFolder(entries);
          handleFiles(collected);
          return;
        }
      }

      for (let i = 0; i < (e.dataTransfer.files?.length ?? 0); i++) {
        const f = e.dataTransfer.files[i];
        if (f?.type?.startsWith("image/")) files.push(f);
      }
      handleFiles(files);
    },
    [collectFromFolder, handleFiles]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const clearGroups = useCallback(() => {
    setGroups([]);
    setError(null);
    setSuccess(null);
  }, []);

  const startUpload = useCallback(async () => {
    if (groups.length === 0) return;
    setUploading(true);
    setError(null);
    setSuccess(null);
    const total = groups.reduce((s, g) => s + g.files.length, 0);
    let done = 0;

    try {
      for (const group of groups) {
        const product = products.find((p) => p.id === group.productId);
        if (!product) continue;

        const existing = product.images ?? [];
        const urls: string[] = [...existing];
        const spaceLeft = MAX_IMAGES_PER_PRODUCT - urls.length;
        const toUpload = group.files.slice(0, spaceLeft);

        for (const file of toUpload) {
          const url = await onUploadImage(product.id, file);
          urls.push(url);
          done++;
          setUploadProgress({ current: done, total });
        }

        if (urls.length > existing.length) {
          await onUpdateProduct(product.id, {
            images: urls,
            updatedAt: new Date().toISOString(),
          });
        }
      }
      setSuccess(`${done} 枚の画像を登録しました。`);
      setGroups([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "アップロードに失敗しました。");
    } finally {
      setUploading(false);
      setUploadProgress(null);
    }
  }, [groups, products, onUploadImage, onUpdateProduct]);

  const totalImages = groups.reduce((s, g) => s + g.files.length, 0);

  return (
    <Card>
      <CardContent className="p-0">
        <div className="space-y-4 p-6">
          <div>
            <h3 className="text-base font-medium">画像一括登録</h3>
            <p className="text-sm text-muted-foreground">
              複数の画像をドラッグ＆ドロップ、またはフォルダを選択して一括で商品に登録できます。
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">登録モード:</span>
              <Select
                value={mode}
                onValueChange={(v) => {
                  setMode(v as "manual" | "auto");
                  setGroups([]);
                  setError(null);
                }}
              >
                <SelectTrigger className="w-[200px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="manual">商品を指定して登録</SelectItem>
                  <SelectItem value="auto">ファイル名から自動割り当て</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {mode === "manual" && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">登録先:</span>
                <Select
                  value={selectedProductId}
                  onValueChange={(v) => {
                    setSelectedProductId(v);
                    setGroups([]);
                  }}
                >
                  <SelectTrigger className="w-[280px]">
                    <SelectValue placeholder="商品を選択" />
                  </SelectTrigger>
                  <SelectContent>
                    {products.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name || "(無題)"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {mode === "auto" && products.length > 0 && (
              <p className="text-xs text-muted-foreground">
                ファイル名の先頭が商品名と一致すると自動で割り当てます（例: ソニーα7-1.jpg）
              </p>
            )}
          </div>

          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            className="flex flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed border-muted-foreground/20 bg-muted/30 px-6 py-10 transition-colors hover:bg-muted/50"
          >
            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleInputChange}
              className="sr-only"
            />
            <input
              ref={folderRef}
              type="file"
              // @ts-expect-error - webkitdirectory は非標準属性
              webkitdirectory=""
              multiple
              onChange={handleInputChange}
              className="sr-only"
            />
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => inputRef.current?.click()}
                disabled={uploading}
              >
                <ImagePlus className="mr-2 size-4" />
                画像を選択
              </Button>
              <Button
                variant="outline"
                onClick={() => folderRef.current?.click()}
                disabled={uploading}
              >
                <FolderOpen className="mr-2 size-4" />
                フォルダを選択
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              ドラッグ＆ドロップでも追加できます
            </p>
          </div>

          {groups.length > 0 && (
            <div className="space-y-3 rounded-lg border bg-muted/20 p-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">
                  登録予定: {groups.length} 商品 / {totalImages} 枚
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearGroups}
                    disabled={uploading}
                  >
                    <X className="mr-1 size-4" />
                    クリア
                  </Button>
                  <Button
                    size="sm"
                    onClick={startUpload}
                    disabled={uploading}
                  >
                    {uploading ? (
                      <>
                        <Loader2 className="mr-2 size-4 animate-spin" />
                        {uploadProgress
                          ? `${uploadProgress.current}/${uploadProgress.total}`
                          : "登録中"}
                      </>
                    ) : (
                      <>
                        <ImagePlus className="mr-2 size-4" />
                        登録する
                      </>
                    )}
                  </Button>
                </div>
              </div>
              <ul className="max-h-48 space-y-1 overflow-y-auto text-sm text-muted-foreground">
                {groups.map((g, i) => (
                  <li key={i}>
                    {g.productName || "(無題)"}: {g.files.length} 枚
                  </li>
                ))}
              </ul>
            </div>
          )}

          {error && (
            <p className="rounded-md bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {error}
            </p>
          )}
          {success && (
            <p className="flex items-center gap-2 rounded-md bg-green-500/10 px-4 py-3 text-sm text-green-700 dark:text-green-400">
              <CheckCircle2 className="size-4 shrink-0" />
              {success}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
