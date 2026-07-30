import { NextResponse } from "next/server";
import { db, logEvent, resolveGrantStatus, type Grant } from "@/lib/db";
import { hashApiKey, writeReceipt } from "@/lib/receipts";

const LEASE_MINUTES = 15;

export async function POST(request: Request) {
  const auth = request.headers.get("authorization") ?? "";
  const raw = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  const key = db.prepare("SELECT id, org_id, label, prefix FROM api_keys WHERE key_hash = ?")
    .get(hashApiKey(raw)) as
    { id: string; org_id: string; label: string; prefix: string } | undefined;
  if (!key) return NextResponse.json({ error: "invalid api key" }, { status: 401 });
  db.prepare("UPDATE api_keys SET last_used_at = ? WHERE id = ?")
    .run(new Date().toISOString(), key.id);

  let body: { grant_id?: string; platform?: string; action?: string; category?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }
  const { grant_id, platform, action, category } = body;
  if (!grant_id || !platform || !action)
    return NextResponse.json({ error: "grant_id, platform, action required" }, { status: 400 });

  const grant = db.prepare("SELECT * FROM grants WHERE id = ? AND org_id = ?")
    .get(grant_id, key.org_id) as Grant | undefined;

  let result: "allowed" | "denied" = "denied";
  let reasonCode: string;
  let reason: string;
  let validUntil: string | null = null;

  if (!grant) {
    reasonCode = "GRANT_NOT_FOUND";
    reason = "grant not found for this organization";
  } else {
    const status = resolveGrantStatus(grant);
    if (status === "pending") {
      reasonCode = "GRANT_PENDING";
      reason = "grant has not been approved by the rights holder";
    } else if (status === "declined") {
      reasonCode = "GRANT_DECLINED";
      reason = "grant was declined by the rights holder";
    } else if (status === "revoked") {
      reasonCode = "GRANT_REVOKED";
      reason = "grant was revoked by the rights holder";
    } else if (status === "expired") {
      reasonCode = "GRANT_EXPIRED";
      reason = "grant term has ended";
    } else if (!(JSON.parse(grant.scope_platforms) as string[]).includes(platform)) {
      reasonCode = "PLATFORM_OUT_OF_SCOPE";
      reason = `platform "${platform}" is outside the granted scope`;
    } else if (category && (JSON.parse(grant.restrictions) as string[]).includes(category)) {
      reasonCode = "CATEGORY_RESTRICTED";
      reason = `category "${category}" is restricted by the rights holder`;
    } else {
      result = "allowed";
      reasonCode = "WITHIN_SCOPE";
      reason = "within granted scope";
      const lease = new Date(Date.now() + LEASE_MINUTES * 60_000).toISOString();
      validUntil = lease < grant.expires_at ? lease : grant.expires_at;
    }
  }

  const receipt = writeReceipt({
    grantId: grant_id, orgId: key.org_id, action, platform,
    result, reason, reasonCode, validUntil,
  });
  logEvent({
    org_id: key.org_id, grant_id: grant?.id ?? null, actor_type: "api_key",
    actor_label: key.label || key.prefix,
    type: result === "allowed" ? "check.allowed" : "check.denied",
    meta: { platform, action, reason_code: reasonCode, receipt_id: receipt.id },
  });

  return NextResponse.json({
    result,
    reason_code: reasonCode,
    reason,
    ...(validUntil ? { valid_until: validUntil } : {}),
    receipt,
  });
}
