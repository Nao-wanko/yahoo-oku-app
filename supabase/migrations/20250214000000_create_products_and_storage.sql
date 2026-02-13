-- 商品テーブル（テキストデータ）
create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null default '',
  price integer not null default 0,
  condition text not null default '',
  description text not null default '',
  status text not null default 'not_listed' check (status in ('not_listed', 'listed')),
  images text[] not null default '{}',
  updated_at timestamptz not null default now()
);

-- RLS: 認証なしでも読み書き可能（本番では認証を有効にしポリシーを絞ることを推奨）
alter table public.products enable row level security;

create policy "Allow all for products"
  on public.products
  for all
  using (true)
  with check (true);

-- 更新日時を自動更新
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

-- Storage バケットは Dashboard > Storage から手動で作成してください。
-- バケット名: product-images、Public: オン。詳細は supabase/README.md を参照。
