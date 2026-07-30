import { NextResponse } from "next/server";
import { auth0 } from "@/lib/auth0";
import { db, getMembership } from "@/lib/db";
import { hashApiKey } from "@/lib/receipts";

export async function POST(request: Request) {
  const session = await auth0.getSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const m = getMembership(session.user.sub);
  if (!m || m.role === "talent")
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  const raw = "cam_" + crypto.randomUUID().replace(/-/g, "");
  db.prepare("INSERT INTO api_keys (id, org_id, key_hash, prefix) VALUES (?,?,?,?)")
    .run(crypto.randomUUID(), m.org_id, hashApiKey(raw), raw.slice(0, 8));
  const url = new URL("/dashboard", request.url);
  url.searchParams.set("new_key", raw);
  return NextResponse.redirect(url, 303);
}
