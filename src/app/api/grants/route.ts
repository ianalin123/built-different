import { NextResponse } from "next/server";
import { auth0 } from "@/lib/auth0";
import { db, getMembership, logEvent } from "@/lib/db";

const RESTRICTIONS = ["political", "medical", "sexual_content", "endorsement"];

export async function POST(request: Request) {
  const session = await auth0.getSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const m = getMembership(session.user.sub);
  if (!m || m.role === "talent")
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  const form = await request.formData();
  const talentMemberId = String(form.get("talent_member_id") ?? "");
  const title = String(form.get("title") ?? "").trim();
  const project = String(form.get("project") ?? "").trim();
  const platforms = form.getAll("platforms").map(String);
  const restrictions = form.getAll("restrictions").map(String)
    .filter((r) => RESTRICTIONS.includes(r));
  const days = Number(form.get("days") ?? 90);
  const talent = db.prepare(
    "SELECT id, name FROM members WHERE id = ? AND org_id = ? AND role = 'talent'"
  ).get(talentMemberId, m.org_id) as { id: string; name: string } | undefined;
  if (!talent || !title || !project || platforms.length === 0)
    return NextResponse.json({ error: "invalid clearance request" }, { status: 400 });
  const expires = new Date(Date.now() + days * 86400_000).toISOString();
  const grantId = crypto.randomUUID();
  db.prepare(`INSERT INTO grants
    (id, org_id, talent_member_id, title, scope_platforms, scope_project,
     restrictions, expires_at, created_by_sub)
    VALUES (?,?,?,?,?,?,?,?,?)`)
    .run(grantId, m.org_id, talentMemberId, title, JSON.stringify(platforms),
         project, JSON.stringify(restrictions), expires, session.user.sub);
  logEvent({
    org_id: m.org_id, grant_id: grantId, actor_type: "member", actor_label: m.name,
    type: "grant.requested",
    meta: { rights_holder: talent.name, project, platforms, restrictions, days },
  });
  return NextResponse.redirect(new URL(`/dashboard/grants/${grantId}`, request.url), 303);
}
