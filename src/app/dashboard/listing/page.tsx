import Link from "next/link";
import { auth0 } from "@/lib/auth0";
import { db, getMembership, type Listing } from "@/lib/db";
import { Badge, Card, PageHeader, btnPrimary, inputCls } from "@/components/ui";
import { FaceScan } from "@/components/face-scan";

export default async function ListingPage() {
  const session = await auth0.getSession();
  if (!session) return null;
  const m = getMembership(session.user.sub);
  if (!m || m.role !== "talent") return null;

  const listing = db.prepare("SELECT * FROM listings WHERE talent_member_id = ?")
    .get(m.id) as Listing | undefined;

  return (
    <>
      <PageHeader
        title="My listing"
        description="Advertise your likeness on the open marketplace. Studios browse, you approve every license."
        action={
          listing?.active ? (
            <Link href="/marketplace" className="text-[13px] text-accent-dark hover:underline">
              View on marketplace →
            </Link>
          ) : undefined
        }
      />

      <Card>
        <form method="POST" action="/api/listings" className="flex flex-col gap-8 md:flex-row">
          <div className="shrink-0">
            <p className="text-label mb-3">face scan</p>
            <FaceScan initialImage={listing?.face_image ?? null} />
          </div>

          <div className="flex min-w-0 flex-1 flex-col gap-4 text-sm">
            <div className="flex items-center justify-between">
              <p className="text-label">listing details</p>
              {listing && <Badge status={listing.active ? "live" : "unlisted"} />}
            </div>
            <input
              name="headline" required maxLength={80}
              defaultValue={listing?.headline ?? ""}
              placeholder="Headline (e.g. Lead-role face for vertical drama)"
              className={inputCls}
            />
            <textarea
              name="bio" rows={4} maxLength={400}
              defaultValue={listing?.bio ?? ""}
              placeholder="What you're open to — genres, platforms, the vibe you bring."
              className={`${inputCls} resize-none`}
            />
            <div className="flex items-center gap-2">
              <span className="text-[13px] text-ink-3">Advertised rate $</span>
              <input
                name="rate" type="number" min={0} step={1}
                defaultValue={listing ? Math.round(listing.rate_cents / 100) : 500}
                className={`w-28 ${inputCls}`}
              />
              <span className="text-[13px] text-ink-3">/ project</span>
            </div>
            <label className="flex items-center gap-2 text-[13px] text-ink-2">
              <input type="checkbox" name="active" defaultChecked={listing ? listing.active === 1 : true} />
              Listed publicly on the marketplace
            </label>
            <div className="mt-auto flex justify-end border-t border-cream-2 pt-4">
              <button className={btnPrimary}>
                {listing ? "Update listing" : "Publish listing"}
              </button>
            </div>
          </div>
        </form>
      </Card>

      <p className="mt-4 text-[13px] text-ink-3">
        Your face scan is only shown on the marketplace card. Every license still goes
        through your inbox — listing your face never grants anyone anything.
      </p>
    </>
  );
}
