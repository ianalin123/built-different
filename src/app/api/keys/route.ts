import { NextResponse } from "next/server";
import { auth0 } from "@/lib/auth0";
import { db, getMembership, logEvent } from "@/lib/db";
import { hashApiKey } from "@/lib/receipts";

export async function POST(request: Request) {
  const session = await auth0.getSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const m = getMembership(session.user.sub);
  if (!m || m.role === "talent")
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  const form = await request.formData();
  const mode = String(form.get("mode") ?? "live") === "test" ? "test" : "live";
  const label = String(form.get("label") ?? "").trim() || `${mode} key`;
  const raw = `cam_${mode}_` + crypto.randomUUID().replace(/-/g, "");
  db.prepare(
    "INSERT INTO api_keys (id, org_id, key_hash, prefix, mode, label) VALUES (?,?,?,?,?,?)"
  ).run(crypto.randomUUID(), m.org_id, hashApiKey(raw),
        `cam_${mode}_…${raw.slice(-4)}`, mode, label);
  logEvent({
    org_id: m.org_id, actor_type: "member", actor_label: m.name,
    type: "key.created", meta: { mode, label },
  });
  const url = new URL("/dashboard/developers", request.url);
  url.searchParams.set("new_key", raw);
  return NextResponse.redirect(url, 303);
}
