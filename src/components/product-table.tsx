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
  onUploadError?: (message: string | null) => void;
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
  onUploadError,
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

      <div className="-mx-4 overflow-x-auto px-4 md:mx-0 md:px-0">
        <div className="min-w-[800px] rounded-md border">
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
              <TableHead>販売形式</TableHead>
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
                <TableCell colSpan={9} className="h-24 text-center text-muted-foreground">
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
                    <TableCell>
                      <Select
                        value={product.salesmode ?? "auction"}
                        onValueChange={(v) =>
                          handleFieldChange(
                            product.id,
                            "salesmode",
                            v as "auction" | "buynow"
                          )
                        }
                      >
                        <SelectTrigger className="h-8 w-[120px] border-0 bg-transparent shadow-none focus:ring-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="buynow">フリマ（定額）</SelectItem>
                          <SelectItem value="auction">オークション</SelectItem>
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
                      <TableCell colSpan={9} className="py-4">
                        <div className="space-y-4">
                          <div className="rounded-lg border bg-background p-4">
                            <p className="mb-3 text-sm font-medium text-muted-foreground">
                              出品詳細（オークション用）
                            </p>
                            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
                              <div>
                                <label className="mb-1 block text-xs text-muted-foreground">終了日 (YYYY-MM-DD)</label>
                                <Input
                                  value={product.closingYMD ?? ""}
                                  onChange={(e) =>
                                    handleFieldChange(product.id, "closingYMD", e.target.value || undefined)
                                  }
                                  placeholder="2026-02-15"
                                  className="h-8 text-sm"
                                />
                              </div>
                              <div>
                                <label className="mb-1 block text-xs text-muted-foreground">終了時刻</label>
                                <Select
                                  value={product.closingTime != null ? String(product.closingTime) : ""}
                                  onValueChange={(v) =>
                                    handleFieldChange(product.id, "closingTime", v === "" ? undefined : parseInt(v, 10))
                                  }
                                >
                                  <SelectTrigger className="h-8">
                                    <SelectValue placeholder="選択" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {Array.from({ length: 24 }, (_, i) => (
                                      <SelectItem key={i} value={String(i)}>
                                        {i}時
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                              <div>
                                <label className="mb-1 block text-xs text-muted-foreground">送料負担</label>
                                <Select
                                  value={product.shipping ?? "seller"}
                                  onValueChange={(v) =>
                                    handleFieldChange(product.id, "shipping", v as "seller" | "buyer")
                                  }
                                >
                                  <SelectTrigger className="h-8">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="seller">出品者</SelectItem>
                                    <SelectItem value="buyer">落札者</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <div>
                                <label className="mb-1 block text-xs text-muted-foreground">発送までの日数</label>
                                <Select
                                  value={product.shipschedule ?? "1"}
                                  onValueChange={(v) =>
                                    handleFieldChange(product.id, "shipschedule", v as "1" | "7" | "2")
                                  }
                                >
                                  <SelectTrigger className="h-8">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="1">1〜2日</SelectItem>
                                    <SelectItem value="7">2〜3日</SelectItem>
                                    <SelectItem value="2">3〜7日</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <div>
                                <label className="mb-1 block text-xs text-muted-foreground">発送元の地域</label>
                                <Select
                                  value={product.locCd ?? "27"}
                                  onValueChange={(v) =>
                                    handleFieldChange(product.id, "locCd", v || undefined)
                                  }
                                >
                                  <SelectTrigger className="h-8">
                                    <SelectValue placeholder="選択" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="1">北海道</SelectItem>
                                    <SelectItem value="2">青森県</SelectItem>
                                    <SelectItem value="3">岩手県</SelectItem>
                                    <SelectItem value="4">宮城県</SelectItem>
                                    <SelectItem value="5">秋田県</SelectItem>
                                    <SelectItem value="6">山形県</SelectItem>
                                    <SelectItem value="7">福島県</SelectItem>
                                    <SelectItem value="8">茨城県</SelectItem>
                                    <SelectItem value="9">栃木県</SelectItem>
                                    <SelectItem value="10">群馬県</SelectItem>
                                    <SelectItem value="11">埼玉県</SelectItem>
                                    <SelectItem value="12">千葉県</SelectItem>
                                    <SelectItem value="13">東京都</SelectItem>
                                    <SelectItem value="14">神奈川県</SelectItem>
                                    <SelectItem value="15">山梨県</SelectItem>
                                    <SelectItem value="16">長野県</SelectItem>
                                    <SelectItem value="17">新潟県</SelectItem>
                                    <SelectItem value="18">富山県</SelectItem>
                                    <SelectItem value="19">石川県</SelectItem>
                                    <SelectItem value="20">福井県</SelectItem>
                                    <SelectItem value="21">岐阜県</SelectItem>
                                    <SelectItem value="22">静岡県</SelectItem>
                                    <SelectItem value="23">愛知県</SelectItem>
                                    <SelectItem value="24">三重県</SelectItem>
                                    <SelectItem value="25">滋賀県</SelectItem>
                                    <SelectItem value="26">京都府</SelectItem>
                                    <SelectItem value="27">大阪府</SelectItem>
                                    <SelectItem value="28">兵庫県</SelectItem>
                                    <SelectItem value="29">奈良県</SelectItem>
                                    <SelectItem value="30">和歌山県</SelectItem>
                                    <SelectItem value="31">鳥取県</SelectItem>
                                    <SelectItem value="32">島根県</SelectItem>
                                    <SelectItem value="33">岡山県</SelectItem>
                                    <SelectItem value="34">広島県</SelectItem>
                                    <SelectItem value="35">山口県</SelectItem>
                                    <SelectItem value="36">徳島県</SelectItem>
                                    <SelectItem value="37">香川県</SelectItem>
                                    <SelectItem value="38">愛媛県</SelectItem>
                                    <SelectItem value="39">高知県</SelectItem>
                                    <SelectItem value="40">福岡県</SelectItem>
                                    <SelectItem value="41">佐賀県</SelectItem>
                                    <SelectItem value="42">長崎県</SelectItem>
                                    <SelectItem value="43">熊本県</SelectItem>
                                    <SelectItem value="44">大分県</SelectItem>
                                    <SelectItem value="45">宮崎県</SelectItem>
                                    <SelectItem value="46">鹿児島県</SelectItem>
                                    <SelectItem value="47">沖縄県</SelectItem>
                                    <SelectItem value="48">海外</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <div>
                                <label className="mb-1 block text-xs text-muted-foreground">配送方法</label>
                                <Select
                                  value={product.shipMethod ?? "is_jp_yupacket_official_ship"}
                                  onValueChange={(v) =>
                                    handleFieldChange(product.id, "shipMethod", v || undefined)
                                  }
                                >
                                  <SelectTrigger className="h-8">
                                    <SelectValue placeholder="選択" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="is_yahuneko_nekoposu_ship">ネコポス</SelectItem>
                                    <SelectItem value="is_jp_yupacket_post_mini_official_ship">ゆうパケットポストmini</SelectItem>
                                    <SelectItem value="is_jp_yupacket_official_ship">ゆうパケット</SelectItem>
                                    <SelectItem value="is_jp_yupacket_plus_official_ship">ゆうパケットプラス</SelectItem>
                                    <SelectItem value="is_jp_yupack_official_ship">ゆうパック</SelectItem>
                                    <SelectItem value="is_yahuneko_taqbin_compact_ship">宅急便コンパクト（EAZY）</SelectItem>
                                    <SelectItem value="is_yahuneko_taqbin_ship">宅急便（EAZY）60〜160</SelectItem>
                                    <SelectItem value="is_yahuneko_taqbin_big_ship">宅急便（EAZY）180〜200</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                          </div>
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
                            onUploadError={onUploadError}
                          />
                        </div>
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
    </div>
  );
}
