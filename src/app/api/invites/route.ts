import { NextResponse } from "next/server";
import { auth0 } from "@/lib/auth0";
import { db, getMembership, logEvent } from "@/lib/db";

export async function POST(request: Request) {
  const session = await auth0.getSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const m = getMembership(session.user.sub);
  if (!m || m.role === "talent")
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  const form = await request.formData();
  const email = String(form.get("email") ?? "").trim();
  const role = String(form.get("role") ?? "talent");
  if (!email || !["producer", "talent"].includes(role))
    return NextResponse.json({ error: "invalid invite" }, { status: 400 });
  db.prepare("INSERT INTO invites (id, org_id, email, role, token) VALUES (?,?,?,?,?)")
    .run(crypto.randomUUID(), m.org_id, email, role, crypto.randomUUID().replace(/-/g, ""));
  logEvent({
    org_id: m.org_id, actor_type: "member", actor_label: m.name,
    type: "invite.created", meta: { email, role },
  });
  return NextResponse.redirect(new URL("/dashboard/team", request.url), 303);
}
