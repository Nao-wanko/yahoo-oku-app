"use client";

import { useCallback, useRef } from "react";
import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const MAX_IMAGES = 10;

type ProductImageManagerProps = {
  images: string[];
  onChange: (images: string[]) => void;
  productId: string;
  className?: string;
};

export function ProductImageManager({
  images,
  onChange,
  productId,
  className,
}: ProductImageManagerProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const addImages = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (!files?.length) return;
      const next: string[] = [...images];
      for (let i = 0; i < files.length && next.length < MAX_IMAGES; i++) {
        const file = files[i];
        if (!file.type.startsWith("image/")) continue;
        const url = URL.createObjectURL(file);
        next.push(url);
      }
      onChange(next.slice(0, MAX_IMAGES));
      e.target.value = "";
    },
    [images, onChange]
  );

  const removeAt = useCallback(
    (index: number) => {
      const url = images[index];
      if (url.startsWith("blob:")) URL.revokeObjectURL(url);
      const next = images.filter((_, i) => i !== index);
      onChange(next);
    },
    [images, onChange]
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
          />
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="flex size-20 shrink-0 items-center justify-center rounded-lg border border-dashed border-muted-foreground/30 bg-muted/30 text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground"
          >
            <Plus className="size-6" />
          </button>
        </>
      )}
      <span className="w-full text-xs text-muted-foreground">
        {images.length} / {MAX_IMAGES} 枚
      </span>
    </div>
  );
}
