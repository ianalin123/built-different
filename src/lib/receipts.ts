import { createHmac, createHash, timingSafeEqual } from "node:crypto";
import { db } from "@/lib/db";

function signingKey(): string {
  const key = process.env.RECEIPT_SIGNING_KEY;
  if (!key) throw new Error("RECEIPT_SIGNING_KEY is not set — run `stripe projects env --pull`");
  return key;
}

function sign(id: string, grantId: string, result: string, timestamp: string): string {
  return createHmac("sha256", signingKey())
    .update(`${id}.${grantId}.${result}.${timestamp}`)
    .digest("hex");
}

export function hashApiKey(raw: string): string {
  return createHash("sha256").update(raw).digest("hex");
}

export function writeReceipt(input: {
  grantId: string; orgId: string; action: string; platform: string;
  result: "allowed" | "denied"; reason: string; reasonCode: string;
  validUntil: string | null;
}) {
  const id = crypto.randomUUID();
  const timestamp = new Date().toISOString();
  const signature = sign(id, input.grantId, input.result, timestamp);
  db.prepare(`INSERT INTO receipts
      (id, grant_id, org_id, action, platform, result, reason, reason_code, valid_until, signature, created_at)
    VALUES (?,?,?,?,?,?,?,?,?,?,?)`)
    .run(id, input.grantId, input.orgId, input.action, input.platform,
         input.result, input.reason, input.reasonCode, input.validUntil,
         signature, timestamp);
  const base = process.env.APP_BASE_URL ?? "http://localhost:3000";
  return { id, signature, timestamp, verify_url: `${base}/api/v1/verify` };
}

export function verifyReceiptSignature(receipt: {
  id: string; grant_id: string; result: string; created_at: string; signature: string;
}, presentedSignature: string): boolean {
  const expected = sign(receipt.id, receipt.grant_id, receipt.result, receipt.created_at);
  const a = Buffer.from(expected, "hex");
  const b = Buffer.from(presentedSignature.padEnd(expected.length, "0").slice(0, expected.length), "hex");
  return timingSafeEqual(a, b) && presentedSignature === receipt.signature;
}
