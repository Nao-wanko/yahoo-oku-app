# Vercel で /api/products が 404 になる場合の確認手順

**※ 現在は `app/` と `pages/` をプロジェクトルート直下に配置しています。**  
Next.js 16 では「同じフォルダ配下」が必要なため、どちらもルートに置き、Vercel が API を認識しやすいようにしています。

## 1. ヘルスチェックで API が有効か確認

デプロイ後、ブラウザで次の **2つ** を開いてください。

- `https://あなたのドメイン.vercel.app/api/health`
- `https://あなたのドメイン.vercel.app/api/products`

| 結果 | 意味 |
|------|------|
| `/api/health` が `{"ok":true,"api":"health"}` と表示される | API ルートは動いている。`/api/products` だけ 404 なら要調査。 |
| `/api/health` も 404 | **API ルートがビルドに含まれていない**。以下 2〜4 を確認。 |

## 2. GitHub に API が含まれているか

Vercel がデプロイしている **ブランチ** のリポジトリに、次のファイルがあるか確認してください（**ルート直下**の `pages` フォルダ）。

- `pages/api/health.ts`
- `pages/api/products.ts`

ない場合は、ローカルの変更を push してから再デプロイしてください。

## 2.5 キャッシュをクリアして再デプロイ

まだ 404 の場合、Vercel の **キャッシュ** が原因のことがあります。

1. Vercel ダッシュボード → 対象プロジェクト → **Deployments**
2. 直近のデプロイの **⋯** メニュー → **Redeploy**
3. **「Redeploy with cleared cache」**（キャッシュをクリアして再デプロイ）にチェックを入れて実行

## 3. Vercel の Root Directory

1. Vercel ダッシュボード → 対象プロジェクト → **Settings** → **General**
2. **Root Directory** を確認
   - リポジトリの**ルート**に `package.json` と `src/` がある場合 → **空**（何も入れない）
   - リポジトリが `yahoo-oku-app/` などの**サブフォルダ**で、その中に `package.json` がある場合 → `yahoo-oku-app` のように**そのフォルダ名**を指定
3. 変更したら **Save** し、**Redeploy** する

## 4. ビルドの確認

- **Deployments** → 最新のデプロイ → **Building** のログを開く
- `Route (app)` や `api/products` のような行が出ているか確認
- エラーで止まっていないか確認

## 5. ローカルでビルドできるか

```bash
npm run build
```

成功し、`pages/api/products.ts` を削除するとビルド結果が変わることを確認できれば、コードと Next の設定は問題ありません。あとは Vercel の「Root Directory」とデプロイブランチの一致を確認してください。
