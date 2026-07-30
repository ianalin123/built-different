import { NextResponse } from "next/server";
import { auth0 } from "@/lib/auth0";
import { db, getMembership } from "@/lib/db";

const TRANSITIONS: Record<string, { from: string[]; to: string; stamp: string }> = {
  approve: { from: ["requested"], to: "active", stamp: "decided_at" },
  deny: { from: ["requested"], to: "denied", stamp: "decided_at" },
  revoke: { from: ["active"], to: "revoked", stamp: "revoked_at" },
};

export async function POST(request: Request) {
  const session = await auth0.getSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const m = getMembership(session.user.sub);
  if (!m) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  const form = await request.formData();
  const grantId = String(form.get("grant_id") ?? "");
  const t = TRANSITIONS[String(form.get("action") ?? "")];
  if (!t) return NextResponse.json({ error: "invalid action" }, { status: 400 });
  const grant = db.prepare("SELECT * FROM grants WHERE id = ? AND talent_member_id = ?")
    .get(grantId, m.id) as { status: string } | undefined;
  if (!grant || !t.from.includes(grant.status))
    return NextResponse.json({ error: "invalid transition" }, { status: 400 });
  db.prepare(`UPDATE grants SET status = ?, ${t.stamp} = datetime('now') WHERE id = ?`)
    .run(t.to, grantId);
  return NextResponse.redirect(new URL("/dashboard", request.url), 303);
}
