import { NextResponse } from "next/server";
import { auth0 } from "@/lib/auth0";
import { db, getMembership } from "@/lib/db";

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
  const days = Number(form.get("days") ?? 90);
  const talent = db.prepare("SELECT id FROM members WHERE id = ? AND org_id = ? AND role = 'talent'")
    .get(talentMemberId, m.org_id);
  if (!talent || !title || !project || platforms.length === 0)
    return NextResponse.json({ error: "invalid grant request" }, { status: 400 });
  const expires = new Date(Date.now() + days * 86400_000).toISOString();
  db.prepare(`INSERT INTO grants
    (id, org_id, talent_member_id, title, scope_platforms, scope_project, expires_at, created_by_sub)
    VALUES (?,?,?,?,?,?,?,?)`)
    .run(crypto.randomUUID(), m.org_id, talentMemberId, title,
         JSON.stringify(platforms), project, expires, session.user.sub);
  return NextResponse.redirect(new URL("/dashboard", request.url), 303);
}
