import { NextResponse } from "next/server";
import { auth0 } from "@/lib/auth0";
import { db, getMembership, logEvent } from "@/lib/db";

export async function POST(request: Request) {
  const session = await auth0.getSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const m = getMembership(session.user.sub);
  if (!m || m.role !== "talent")
    return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const form = await request.formData();
  const headline = String(form.get("headline") ?? "").trim();
  const bio = String(form.get("bio") ?? "").trim();
  const rateRaw = Number(form.get("rate") ?? 0);
  const rateCents = Number.isFinite(rateRaw) && rateRaw > 0 ? Math.round(rateRaw * 100) : 0;
  const faceImage = String(form.get("face_image") ?? "");
  const active = form.get("active") === "on" ? 1 : 0;

  if (!headline)
    return NextResponse.json({ error: "headline required" }, { status: 400 });
  if (faceImage && (!faceImage.startsWith("data:image/jpeg;base64,") || faceImage.length > 700_000))
    return NextResponse.json({ error: "invalid face scan" }, { status: 400 });

  const existing = db.prepare("SELECT id, active FROM listings WHERE talent_member_id = ?")
    .get(m.id) as { id: string; active: number } | undefined;

  if (existing) {
    db.prepare(`
      UPDATE listings SET headline = ?, bio = ?, rate_cents = ?, active = ?,
        face_image = CASE WHEN ? != '' THEN ? ELSE face_image END,
        updated_at = datetime('now')
      WHERE id = ?
    `).run(headline, bio, rateCents, active, faceImage, faceImage, existing.id);
  } else {
    db.prepare(`
      INSERT INTO listings (id, talent_member_id, headline, bio, rate_cents, face_image, active)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(crypto.randomUUID(), m.id, headline, bio, rateCents, faceImage || null, active);
  }

  const wasActive = existing?.active ?? 0;
  if (active !== wasActive) {
    logEvent({
      org_id: m.org_id, actor_type: "member", actor_label: m.name,
      type: active ? "listing.published" : "listing.unlisted",
      meta: active ? { headline } : {},
    });
  }

  return NextResponse.redirect(new URL("/dashboard/listing", request.url), 303);
}
