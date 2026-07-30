import { NextResponse } from "next/server";
import { auth0 } from "@/lib/auth0";
import { db } from "@/lib/db";

export async function POST(request: Request) {
  const session = await auth0.getSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const form = await request.formData();
  const token = String(form.get("token") ?? "");
  const invite = db.prepare("SELECT * FROM invites WHERE token = ? AND status = 'pending'")
    .get(token) as { id: string; org_id: string; role: string } | undefined;
  if (!invite) return NextResponse.json({ error: "invalid or used invite" }, { status: 404 });
  const { sub, email, name } = session.user;
  db.prepare("INSERT OR IGNORE INTO members (id, org_id, auth0_sub, email, name, role) VALUES (?,?,?,?,?,?)")
    .run(crypto.randomUUID(), invite.org_id, sub, email ?? "", name ?? email ?? "Member", invite.role);
  db.prepare("UPDATE invites SET status = 'accepted' WHERE id = ?").run(invite.id);
  return NextResponse.redirect(new URL("/dashboard", request.url), 303);
}
