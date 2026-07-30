import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyReceiptSignature } from "@/lib/receipts";

export async function POST(request: Request) {
  let body: { receipt_id?: string; signature?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }
  const { receipt_id, signature } = body;
  if (!receipt_id || !signature)
    return NextResponse.json({ error: "receipt_id, signature required" }, { status: 400 });

  const receipt = db.prepare("SELECT * FROM receipts WHERE id = ?").get(receipt_id) as
    | { id: string; grant_id: string; result: string; reason_code: string;
        platform: string; action: string; created_at: string; signature: string }
    | undefined;
  if (!receipt) return NextResponse.json({ valid: false, error: "receipt not found" }, { status: 404 });

  const valid = verifyReceiptSignature(receipt, signature);
  return NextResponse.json({
    valid,
    ...(valid
      ? {
          receipt: {
            id: receipt.id, grant_id: receipt.grant_id, result: receipt.result,
            reason_code: receipt.reason_code, platform: receipt.platform,
            action: receipt.action, timestamp: receipt.created_at,
          },
        }
      : {}),
  });
}
