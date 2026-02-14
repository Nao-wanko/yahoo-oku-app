"use client";

import { useCallback, useRef, useState } from "react";
import { Plus, X, Loader2, Camera, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";

/** ヤフオク対応: JPG/GIF のみ、最大10枚 */
const MAX_IMAGES = 10;
const ACCEPT_IMAGES = "image/jpeg,image/jpg,image/gif,.jpg,.jpeg,.gif";
const isYahooImage = (f: File) =>
  (/\.(jpg|jpeg|gif)$/i.test(f.name)) ||
  (f.type && ["image/jpeg", "image/jpg", "image/gif"].includes(f.type));

type ProductImageManagerProps = {
  images: string[];
  onChange: (images: string[]) => void;
  productId: string;
  /** Supabase 使用時: ファイルをアップロードし公開URLを返す。未指定時は DataURL でローカル表示のみ */
  onUploadImage?: (file: File) => Promise<string>;
  /** 画像削除時に Storage からも削除する場合に指定（Supabase の URL のとき） */
  onRemoveImage?: (url: string) => Promise<void>;
  /** アップロードエラー時に呼ばれる。null でクリア */
  onUploadError?: (message: string | null) => void;
  className?: string;
};

export function ProductImageManager({
  images,
  onChange,
  productId,
  onUploadImage,
  onRemoveImage,
  onUploadError,
  className,
}: ProductImageManagerProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const replaceAtRef = useRef<number | null>(null);
  const [uploading, setUploading] = useState(false);

  const addImages = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>, insertAt?: number) => {
      const files = e.target.files;
      if (!files?.length) return;
      onUploadError?.(null);
      const replaceIndex = insertAt ?? replaceAtRef.current;
      replaceAtRef.current = null;

      const next: string[] = [...images];
      const insertIndex = replaceIndex != null && replaceIndex >= 0 ? replaceIndex : undefined;

      if (onUploadImage) {
        setUploading(true);
        try {
          for (let i = 0; i < files.length; i++) {
            const file = files[i];
            if (!isYahooImage(file)) continue;
            try {
              const url = await onUploadImage(file);
              if (insertIndex !== undefined) {
                next.splice(insertIndex, 0, url);
                break; // 撮り直しは1枚のみ
              } else if (next.length < MAX_IMAGES) {
                next.push(url);
              }
            } catch (err) {
              const msg = err instanceof Error ? err.message : "画像のアップロードに失敗しました";
              onUploadError?.(msg);
              console.error("uploadProductImage error:", err);
            }
          }
          onChange(next.slice(0, MAX_IMAGES));
        } finally {
          setUploading(false);
        }
      } else {
        for (let i = 0; i < files.length; i++) {
          const file = files[i];
          if (!isYahooImage(file)) continue;
          const url = URL.createObjectURL(file);
          if (insertIndex !== undefined) {
            next.splice(insertIndex, 0, url);
            break;
          } else if (next.length < MAX_IMAGES) {
            next.push(url);
          }
        }
        onChange(next.slice(0, MAX_IMAGES));
      }
      e.target.value = "";
    },
    [images, onChange, onUploadImage, onUploadError]
  );

  const handleAddImages = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => addImages(e),
    [addImages]
  );

  const removeAt = useCallback(
    async (index: number) => {
      const url = images[index];
      if (onRemoveImage && !url.startsWith("blob:")) {
        await onRemoveImage(url);
      }
      if (url.startsWith("blob:")) URL.revokeObjectURL(url);
      const next = images.filter((_, i) => i !== index);
      onChange(next);
    },
    [images, onChange, onRemoveImage]
  );

  const retakeAt = useCallback(
    async (index: number) => {
      await removeAt(index);
      replaceAtRef.current = index;
      cameraRef.current?.click();
    },
    [removeAt]
  );

  const canAdd = images.length < MAX_IMAGES;

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex flex-wrap items-start gap-2">
        {images.map((src, index) => (
          <div
            key={`${productId}-${index}`}
            className="group relative size-20 shrink-0 overflow-hidden rounded-lg border bg-muted"
          >
            <img
              src={src}
              alt={`商品画像 ${index + 1}`}
              className="size-full object-cover"
            />
            <div className="absolute right-1 top-1 flex gap-0.5 opacity-70 transition-opacity hover:opacity-100 sm:opacity-0 sm:group-hover:opacity-100">
              <button
                type="button"
                onClick={() => retakeAt(index)}
                className="rounded-full bg-black/60 p-1 text-white hover:bg-black/80"
                aria-label="撮り直し"
                title="撮り直し"
              >
                <RotateCcw className="size-3.5" />
              </button>
              <button
                type="button"
                onClick={() => removeAt(index)}
                className="rounded-full bg-black/60 p-1 text-white hover:bg-black/80"
                aria-label="画像を削除"
                title="削除"
              >
                <X className="size-3.5" />
              </button>
            </div>
          </div>
        ))}
        {canAdd && (
          <>
            <input
              ref={inputRef}
              type="file"
              accept={ACCEPT_IMAGES}
              multiple
              onChange={handleAddImages}
              className="sr-only"
              aria-label="画像を追加"
              disabled={uploading}
            />
            <input
              ref={cameraRef}
              type="file"
              accept={ACCEPT_IMAGES}
              capture="environment"
              onChange={(e) => addImages(e)}
              className="sr-only"
              aria-label="カメラで撮影"
              disabled={uploading}
            />
            <div className="flex gap-1">
              <button
                type="button"
                onClick={() => {
                  replaceAtRef.current = null;
                  cameraRef.current?.click();
                }}
                disabled={uploading}
                className="flex size-20 shrink-0 flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-muted-foreground/30 bg-muted/30 px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground disabled:opacity-50"
                title="スマホでカメラが起動します"
              >
                {uploading ? (
                  <Loader2 className="size-6 animate-spin" />
                ) : (
                  <>
                    <Camera className="size-6" />
                    <span>撮影</span>
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => {
                  replaceAtRef.current = null;
                  inputRef.current?.click();
                }}
                disabled={uploading}
                className="flex size-20 shrink-0 flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-muted-foreground/30 bg-muted/30 px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground disabled:opacity-50"
                title="ファイル・ギャラリーから選択"
              >
                {uploading ? (
                  <Loader2 className="size-6 animate-spin" />
                ) : (
                  <>
                    <Plus className="size-6" />
                    <span>追加</span>
                  </>
                )}
              </button>
            </div>
          </>
        )}
      </div>
      <p className="text-xs text-muted-foreground">
        {images.length} / {MAX_IMAGES} 枚（JPG・GIFのみ／ヤフオク仕様）
      </p>
    </div>
  );
}
