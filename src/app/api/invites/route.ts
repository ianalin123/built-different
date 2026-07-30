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
  const email = String(form.get("email") ?? "").trim();
  const role = String(form.get("role") ?? "talent");
  if (!email || !["producer", "talent"].includes(role))
    return NextResponse.json({ error: "invalid invite" }, { status: 400 });
  db.prepare("INSERT INTO invites (id, org_id, email, role, token) VALUES (?,?,?,?,?)")
    .run(crypto.randomUUID(), m.org_id, email, role, crypto.randomUUID().replace(/-/g, ""));
  return NextResponse.redirect(new URL("/dashboard", request.url), 303);
}
