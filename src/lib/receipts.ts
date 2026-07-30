import { createHmac, createHash } from "node:crypto";
import { db } from "@/lib/db";

function signingKey(): string {
  const key = process.env.RECEIPT_SIGNING_KEY;
  if (!key) throw new Error("RECEIPT_SIGNING_KEY is not set — run `stripe projects env --pull`");
  return key;
}

export function hashApiKey(raw: string): string {
  return createHash("sha256").update(raw).digest("hex");
}

export function writeReceipt(input: {
  grantId: string; orgId: string; action: string; platform: string;
  result: "allowed" | "denied"; reason: string;
}) {
  const id = crypto.randomUUID();
  const timestamp = new Date().toISOString();
  const signature = createHmac("sha256", signingKey())
    .update(`${id}.${input.grantId}.${input.result}.${timestamp}`)
    .digest("hex");
  db.prepare(`INSERT INTO receipts (id, grant_id, org_id, action, platform, result, reason, signature, created_at)
    VALUES (?,?,?,?,?,?,?,?,?)`)
    .run(id, input.grantId, input.orgId, input.action, input.platform,
         input.result, input.reason, signature, timestamp);
  return { id, signature, timestamp };
}
