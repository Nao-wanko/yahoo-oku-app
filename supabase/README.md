# Supabase セットアップ

## 1. プロジェクト作成

1. [Supabase](https://supabase.com) でプロジェクトを作成する
2. **Settings > API** で以下を控える:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** キー → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## 2. 環境変数（Vercel）

Vercel の **Project > Settings > Environment Variables** で次を追加:

| Name | Value | Environment |
|------|--------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | 上記 Project URL | Production, Preview, Development |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | 上記 anon public キー | Production, Preview, Development |

ローカル開発の場合は `.env.local` に同じキーで設定してください。

## 3. Database: 商品テーブル

**SQL Editor** で `migrations/20250214000000_create_products_and_storage.sql` の  
`create table` から `products_updated_at` トリガーまでを実行する。

（RLS ポリシーで「Allow all」にしているため、本番では認証を有効にしてポリシーを絞ることを推奨します。）

## 4. Storage: 画像バケット

1. **Storage** を開き **New bucket** をクリック
2. Name: `product-images`
3. **Public bucket** をオンにする（画像の公開 URL 取得のため）
4. **Create bucket** を実行

### ストレージポリシー（開発用: anon で読み書き許可）

Storage > **Policies** で `product-images` に以下を追加:

- **New policy** > "For full customization"
  - Policy name: `Allow all for product-images`
  - Allowed operation: すべてチェック（SELECT, INSERT, UPDATE, DELETE）
  - Target roles: `public`
  - USING expression: `true`
  - WITH CHECK expression: `true`

本番では認証済みユーザーのみに制限することを推奨します。
