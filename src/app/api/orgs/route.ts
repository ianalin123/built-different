import { NextResponse } from "next/server";
import { auth0 } from "@/lib/auth0";
import { db, logEvent } from "@/lib/db";

export async function POST(request: Request) {
  const session = await auth0.getSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const form = await request.formData();
  const name = String(form.get("name") ?? "").trim();
  if (!name) return NextResponse.json({ error: "name required" }, { status: 400 });
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")
    + "-" + crypto.randomUUID().slice(0, 4);
  const orgId = crypto.randomUUID();
  const { sub, email, name: userName } = session.user;
  db.prepare("INSERT INTO orgs (id, name, slug, owner_sub) VALUES (?,?,?,?)")
    .run(orgId, name, slug, sub);
  db.prepare("INSERT INTO members (id, org_id, auth0_sub, email, name, role) VALUES (?,?,?,?,?,'owner')")
    .run(crypto.randomUUID(), orgId, sub, email ?? "", userName ?? email ?? "Owner");
  logEvent({
    org_id: orgId, actor_type: "member", actor_label: userName ?? email ?? "Owner",
    type: "org.created", meta: { name },
  });
  return NextResponse.redirect(new URL("/dashboard", request.url), 303);
}
