import { NextResponse } from "next/server";

/**
 * デプロイ確認用: GET /api/health が 200 JSON を返れば API ルートは有効
 * ブラウザで https://あなたのドメイン.vercel.app/api/health を開いて確認
 */
export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({ ok: true, api: "health" });
}
