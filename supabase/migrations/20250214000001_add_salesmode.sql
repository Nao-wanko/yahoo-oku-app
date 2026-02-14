-- 販売形式（オークション/フリマ）カラム追加
alter table public.products
add column if not exists salesmode text not null default 'buynow' check (salesmode in ('auction', 'buynow'));
