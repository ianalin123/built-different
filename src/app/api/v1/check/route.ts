import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { hashApiKey, writeReceipt } from "@/lib/receipts";

type Grant = {
  id: string; org_id: string; status: string;
  scope_platforms: string; expires_at: string;
};

export async function POST(request: Request) {
  const auth = request.headers.get("authorization") ?? "";
  const raw = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  const key = db.prepare("SELECT org_id FROM api_keys WHERE key_hash = ?")
    .get(hashApiKey(raw)) as { org_id: string } | undefined;
  if (!key) return NextResponse.json({ error: "invalid api key" }, { status: 401 });

  let body: { grant_id?: string; platform?: string; action?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }
  const { grant_id, platform, action } = body;
  if (!grant_id || !platform || !action)
    return NextResponse.json({ error: "grant_id, platform, action required" }, { status: 400 });

  const grant = db.prepare("SELECT * FROM grants WHERE id = ? AND org_id = ?")
    .get(grant_id, key.org_id) as Grant | undefined;

  let result: "allowed" | "denied" = "denied";
  let reason: string;
  if (!grant) reason = "grant not found for this organization";
  else if (grant.status !== "active") reason = `grant is ${grant.status}`;
  else if (!(JSON.parse(grant.scope_platforms) as string[]).includes(platform))
    reason = `platform "${platform}" is outside granted scope`;
  else if (new Date(grant.expires_at) < new Date()) reason = "grant expired";
  else { result = "allowed"; reason = "within scope"; }

  const receipt = writeReceipt({
    grantId: grant_id, orgId: key.org_id, action, platform, result, reason,
  });
  return NextResponse.json({ result, reason, receipt });
}
