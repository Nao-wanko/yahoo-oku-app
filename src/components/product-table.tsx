"use client";

import React, { useMemo, useState } from "react";
import {
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { ProductImageManager } from "@/components/product-image-manager";
import type { Product } from "@/types/product";
import type { ListingStatus } from "@/types/product";
import { cn } from "@/lib/utils";

type SortKey = "price" | "updatedAt" | null;
type SortOrder = "asc" | "desc";

type ProductTableProps = {
  products: Product[];
  onUpdate: (id: string, updates: Partial<Product>) => void | Promise<void>;
  onUploadImage?: (productId: string, file: File) => Promise<string>;
  onRemoveImage?: (imageUrl: string) => Promise<void>;
};

const STATUS_LABEL: Record<ListingStatus, string> = {
  not_listed: "未出品",
  listed: "出品済み",
};

export function ProductTable({
  products,
  onUpdate,
  onUploadImage,
  onRemoveImage,
}: ProductTableProps) {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortKey, setSortKey] = useState<SortKey>(null);
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let list = [...products];
    if (statusFilter !== "all") {
      list = list.filter((p) => p.status === statusFilter);
    }
    return list;
  }, [products, statusFilter]);

  const sorted = useMemo(() => {
    if (!sortKey) return filtered;
    return [...filtered].sort((a, b) => {
      let cmp = 0;
      if (sortKey === "price") {
        cmp = a.price - b.price;
      } else if (sortKey === "updatedAt") {
        cmp = a.updatedAt.localeCompare(b.updatedAt);
      }
      return sortOrder === "asc" ? cmp : -cmp;
    });
  }, [filtered, sortKey, sortOrder]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortOrder((o) => (o === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortOrder("asc");
    }
  };

  const handleFieldChange = (id: string, field: keyof Product, value: unknown) => {
    onUpdate(id, { [field]: value, updatedAt: new Date().toISOString() });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">ステータス:</span>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">すべて</SelectItem>
              <SelectItem value="not_listed">未出品</SelectItem>
              <SelectItem value="listed">出品済み</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <span className="text-sm text-muted-foreground">
          {sorted.length} 件
        </span>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-8" />
              <TableHead>商品名</TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  size="sm"
                  className="-ml-2 h-8"
                  onClick={() => toggleSort("price")}
                >
                  価格
                  {sortKey === "price" ? (
                    sortOrder === "asc" ? (
                      <ArrowUp className="ml-1 size-4" />
                    ) : (
                      <ArrowDown className="ml-1 size-4" />
                    )
                  ) : (
                    <ArrowUpDown className="ml-1 size-4 opacity-50" />
                  )}
                </Button>
              </TableHead>
              <TableHead>商品の状態</TableHead>
              <TableHead className="min-w-[200px]">説明文</TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  size="sm"
                  className="-ml-2 h-8"
                  onClick={() => toggleSort("updatedAt")}
                >
                  更新日
                  {sortKey === "updatedAt" ? (
                    sortOrder === "asc" ? (
                      <ArrowUp className="ml-1 size-4" />
                    ) : (
                      <ArrowDown className="ml-1 size-4" />
                    )
                  ) : (
                    <ArrowUpDown className="ml-1 size-4 opacity-50" />
                  )}
                </Button>
              </TableHead>
              <TableHead>ステータス</TableHead>
              <TableHead className="w-24">画像</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sorted.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">
                  ＣＳＶをアップロードするか、データがありません。
                </TableCell>
              </TableRow>
            ) : (
              sorted.map((product) => (
                <React.Fragment key={product.id}>
                  <TableRow
                    key={product.id}
                    className={cn(expandedId === product.id && "border-b-0")}
                  >
                    <TableCell className="w-8 p-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-7"
                        onClick={() =>
                          setExpandedId((id) =>
                            id === product.id ? null : product.id
                          )
                        }
                        aria-label={expandedId === product.id ? "閉じる" : "開く"}
                      >
                        {expandedId === product.id ? (
                          <ChevronDown className="size-4" />
                        ) : (
                          <ChevronRight className="size-4" />
                        )}
                      </Button>
                    </TableCell>
                    <TableCell>
                      <Input
                        value={product.name}
                        onChange={(e) =>
                          handleFieldChange(product.id, "name", e.target.value)
                        }
                        placeholder="商品名"
                        className="h-8 border-0 bg-transparent shadow-none focus-visible:ring-1"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        min={0}
                        value={product.price || ""}
                        onChange={(e) =>
                          handleFieldChange(
                            product.id,
                            "price",
                            parseInt(e.target.value, 10) || 0
                          )
                        }
                        placeholder="0"
                        className="h-8 w-24 border-0 bg-transparent shadow-none focus-visible:ring-1"
                      />
                    </TableCell>
                    <TableCell>
                      <Select
                        value={
                          [
                            "未使用",
                            "未使用に近い",
                            "目立った傷や汚れなし",
                            "やや傷や汚れあり",
                            "傷や汚れあり",
                            "全体的に状態が悪い",
                          ].includes(product.condition)
                            ? product.condition
                            : product.condition || "__none__"
                        }
                        onValueChange={(v) =>
                          handleFieldChange(
                            product.id,
                            "condition",
                            v === "__none__" ? "" : v
                          )
                        }
                      >
                        <SelectTrigger className="h-8 min-w-[160px] border-0 bg-transparent shadow-none focus:ring-1">
                          <SelectValue placeholder="商品の状態" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__none__">選択してください</SelectItem>
                          <SelectItem value="未使用">未使用</SelectItem>
                          <SelectItem value="未使用に近い">未使用に近い</SelectItem>
                          <SelectItem value="目立った傷や汚れなし">
                            目立った傷や汚れなし
                          </SelectItem>
                          <SelectItem value="やや傷や汚れあり">
                            やや傷や汚れあり
                          </SelectItem>
                          <SelectItem value="傷や汚れあり">傷や汚れあり</SelectItem>
                          <SelectItem value="全体的に状態が悪い">
                            全体的に状態が悪い
                          </SelectItem>
                          {product.condition &&
                            ![
                              "未使用",
                              "未使用に近い",
                              "目立った傷や汚れなし",
                              "やや傷や汚れあり",
                              "傷や汚れあり",
                              "全体的に状態が悪い",
                            ].includes(product.condition) && (
                              <SelectItem value={product.condition}>
                                {product.condition}（CSVより）
                              </SelectItem>
                            )}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="min-w-[200px]">
                      <Textarea
                        value={product.description}
                        onChange={(e) =>
                          handleFieldChange(
                            product.id,
                            "description",
                            e.target.value
                          )
                        }
                        placeholder="説明文"
                        rows={1}
                        className="min-h-8 resize-none border-0 bg-transparent shadow-none focus-visible:ring-1"
                      />
                    </TableCell>
                    <TableCell className="text-muted-foreground text-xs">
                      {new Date(product.updatedAt).toLocaleString("ja-JP")}
                    </TableCell>
                    <TableCell>
                      <Select
                        value={product.status}
                        onValueChange={(v) =>
                          handleFieldChange(
                            product.id,
                            "status",
                            v as ListingStatus
                          )
                        }
                      >
                        <SelectTrigger className="h-8 w-[100px] border-0 bg-transparent shadow-none focus:ring-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="not_listed">
                            {STATUS_LABEL.not_listed}
                          </SelectItem>
                          <SelectItem value="listed">
                            {STATUS_LABEL.listed}
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="w-24">
                      <Badge variant="secondary" className="text-xs">
                        {product.images.length}枚
                      </Badge>
                    </TableCell>
                  </TableRow>
                  {expandedId === product.id && (
                    <TableRow key={`${product.id}-images`} className="bg-muted/30">
                      <TableCell colSpan={8} className="py-4">
                        <div className="rounded-lg border bg-background p-4">
                          <p className="mb-3 text-sm font-medium text-muted-foreground">
                            画像管理（最大10枚）
                          </p>
                          <ProductImageManager
                            productId={product.id}
                            images={product.images}
                            onChange={(images) =>
                              onUpdate(product.id, {
                                images,
                                updatedAt: new Date().toISOString(),
                              })
                            }
                            onUploadImage={
                              onUploadImage
                                ? (file) => onUploadImage(product.id, file)
                                : undefined
                            }
                            onRemoveImage={onRemoveImage}
                          />
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </React.Fragment>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
