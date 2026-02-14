-- ============================================
-- Supabase SQL Editor で実行するコード（全文）
-- products テーブルをゼロから作成します
-- ============================================

-- 1. 商品テーブル作成
create table public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null default '',
  price integer not null default 0,
  condition text not null default '',
  description text not null default '',
  status text not null default 'not_listed' check (status in ('not_listed', 'listed')),
  salesmode text not null default 'auction' check (salesmode in ('auction', 'buynow')),
  images text[] not null default '{}',
  updated_at timestamptz not null default now(),
  closing_ymd text,
  closing_time integer check (closing_time >= 0 and closing_time <= 23),
  shipping text check (shipping in ('seller', 'buyer')),
  shipschedule text check (shipschedule in ('1', '7', '2')),
  loc_cd text,
  ship_method text
);

-- 2. RLS（セキュリティ）の設定
alter table public.products enable row level security;

create policy "Allow all for products"
  on public.products
  for all
  using (true)
  with check (true);

-- 3. 更新日時を自動更新するトリガー
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger products_updated_at
  before update on public.products
  for each row execute function public.set_updated_at();

-- ※既にテーブルがある場合は、上記の代わりに以下を実行して ship_method を追加
-- alter table public.products add column if not exists ship_method text;
