-- 終了日時・送料・発送日数・発送元カラム追加
alter table public.products
add column if not exists closing_ymd text,
add column if not exists closing_time integer check (closing_time >= 0 and closing_time <= 23),
add column if not exists shipping text check (shipping in ('seller', 'buyer')),
add column if not exists shipschedule text check (shipschedule in ('1', '7', '2')),
add column if not exists loc_cd text;
