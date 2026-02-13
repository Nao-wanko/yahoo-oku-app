"use client";

import { useCallback, useRef, useState } from "react";
import { Plus, X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const MAX_IMAGES = 10;

type ProductImageManagerProps = {
  images: string[];
  onChange: (images: string[]) => void;
  productId: string;
  /** Supabase 使用時: ファイルをアップロードし公開URLを返す。未指定時は DataURL でローカル表示のみ */
  onUploadImage?: (file: File) => Promise<string>;
  /** 画像削除時に Storage からも削除する場合に指定（Supabase の URL のとき） */
  onRemoveImage?: (url: string) => Promise<void>;
  className?: string;
};

export function ProductImageManager({
  images,
  onChange,
  productId,
  onUploadImage,
  onRemoveImage,
  className,
}: ProductImageManagerProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const addImages = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (!files?.length) return;
      const next: string[] = [...images];
      if (onUploadImage) {
        setUploading(true);
        try {
          for (let i = 0; i < files.length && next.length < MAX_IMAGES; i++) {
            const file = files[i];
            if (!file.type.startsWith("image/")) continue;
            const url = await onUploadImage(file);
            next.push(url);
          }
          onChange(next.slice(0, MAX_IMAGES));
        } finally {
          setUploading(false);
        }
      } else {
        for (let i = 0; i < files.length && next.length < MAX_IMAGES; i++) {
          const file = files[i];
          if (!file.type.startsWith("image/")) continue;
          next.push(URL.createObjectURL(file));
        }
        onChange(next.slice(0, MAX_IMAGES));
      }
      e.target.value = "";
    },
    [images, onChange, onUploadImage]
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

  const canAdd = images.length < MAX_IMAGES;

  return (
    <div className={cn("flex flex-wrap items-start gap-2", className)}>
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
          <button
            type="button"
            onClick={() => removeAt(index)}
            className="absolute right-1 top-1 rounded-full bg-black/60 p-1 text-white opacity-0 transition-opacity hover:bg-black/80 group-hover:opacity-100"
            aria-label="画像を削除"
          >
            <X className="size-3.5" />
          </button>
        </div>
      ))}
      {canAdd && (
        <>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={addImages}
            className="sr-only"
            aria-label="画像を追加"
            disabled={uploading}
          />
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="flex size-20 shrink-0 items-center justify-center rounded-lg border border-dashed border-muted-foreground/30 bg-muted/30 text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground disabled:opacity-50"
          >
            {uploading ? (
              <Loader2 className="size-6 animate-spin" />
            ) : (
              <Plus className="size-6" />
            )}
          </button>
        </>
      )}
      <span className="w-full text-xs text-muted-foreground">
        {images.length} / {MAX_IMAGES} 枚
      </span>
    </div>
  );
}
