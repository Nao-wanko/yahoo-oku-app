# ヤフオク出品アシスト（Chrome拡張機能）

商品管理アプリの未出品リストを取得し、ヤフオクの出品フォームに自動入力する拡張機能です。

## セットアップ

1. 商品管理アプリ（Next.js）を起動しておく: `npm run dev`（`http://localhost:3000`）
2. Chrome で `chrome://extensions/` を開く
3. 「デベロッパーモード」をオン
4. 「パッケージ化されていない拡張機能を読み込む」で、この `chrome-extension` フォルダを選択

## 使い方

1. ヤフオクの出品ページを開く: https://auctions.yahoo.co.jp/sell/jp/show/submit*
2. 拡張機能アイコンをクリックしてポップアップを開く
3. 「商品リストを更新」で未出品商品を取得
4. リストから商品をクリック → 現在のタブの出品フォームに自動入力
5. 同じ商品を再度クリックすると、その下に画像URL一覧が開く。各「コピー」でURLをコピーし、ヤフオクの画像欄に手動で貼り付け

## API URL の変更（Vercel デプロイ時）

`popup.js` の先頭で `API_BASE` を変更してください。

```js
const API_BASE = "https://your-app.vercel.app";
```

## ファイル構成

- `manifest.json` - Manifest V3 設定
- `popup.html` / `popup.js` - ポップアップUI・API取得・タブへ送信・画像URLコピー
- `content.js` - 出品ページでメッセージを受信しフォームに入力
