import Link from "next/link";
import { db, type Listing } from "@/lib/db";

export const dynamic = "force-dynamic";

type ListingRow = Listing & { talent_name: string; org_name: string };

export default function MarketplacePage() {
  const listings = db.prepare(`
    SELECT l.*, m.name AS talent_name, o.name AS org_name
    FROM listings l
    JOIN members m ON m.id = l.talent_member_id
    JOIN orgs o ON o.id = m.org_id
    WHERE l.active = 1
    ORDER BY l.updated_at DESC
  `).all() as ListingRow[];

  return (
    <main className="min-h-screen bg-cream text-ink">
      <nav className="flex items-center justify-between border-b border-line px-8 py-5">
        <Link href="/" className="text-lg font-extrabold tracking-[-0.02em]">
          cameo<span className="text-accent">.</span>
        </Link>
        <div className="flex gap-6 text-sm font-medium text-ink-2">
          <Link href="/docs" className="hover:text-ink">Docs</Link>
          <Link href="/pricing" className="hover:text-ink">Pricing</Link>
          <Link href="/dashboard" className="hover:text-ink">Dashboard</Link>
        </div>
      </nav>

      <div className="mx-auto max-w-5xl px-8 py-14">
        <p className="text-label !text-accent-dark">marketplace</p>
        <h1 className="display-lg mt-4">
          Faces, licensed by their owners<span className="text-accent">.</span>
        </h1>
        <p className="mt-4 max-w-xl text-sm leading-relaxed text-ink-2">
          Every face below was scanned in by the person who owns it. Request a scoped
          license — platforms, term, render budget — and they approve it on their terms.
          No listing ever grants anything by itself.
        </p>

        {listings.length === 0 ? (
          <div className="mt-12 flex flex-col items-center rounded-2xl border border-dashed border-line-2 py-20 text-center">
            <div className="flex size-12 items-center justify-center rounded-xl bg-accent-2 font-mono text-xl text-accent-dark">
              ◉
            </div>
            <p className="mt-4 text-sm font-bold">No faces listed yet</p>
            <p className="mt-1 max-w-sm text-sm text-ink-2">
              Rights holders publish a listing with a live face scan from their dashboard.
            </p>
            <Link
              href="/dashboard/listing"
              className="mt-5 rounded-[10px] bg-accent px-5 py-2.5 text-sm font-bold text-white transition hover:bg-accent-dark hover:shadow-[0_4px_16px_rgba(124,111,247,0.35)]"
            >
              Scan in your face
            </Link>
          </div>
        ) : (
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {listings.map((l) => (
              <div
                key={l.id}
                className="group overflow-hidden rounded-2xl border border-line bg-white shadow-[0_2px_12px_rgba(0,0,0,0.07)] transition hover:-translate-y-0.5 hover:shadow-[0_8px_40px_rgba(0,0,0,0.12)]"
              >
                <div className="face-card relative aspect-square overflow-hidden bg-ink">
                  {l.face_image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={l.face_image} alt={l.talent_name}
                      className="absolute inset-0 size-full object-cover" />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center font-mono text-4xl text-cream/25">
                      ◉
                    </div>
                  )}
                  <div className="scanline-hover" />
                  {["top-2.5 left-2.5 border-t-2 border-l-2", "top-2.5 right-2.5 border-t-2 border-r-2",
                    "bottom-2.5 left-2.5 border-b-2 border-l-2", "bottom-2.5 right-2.5 border-b-2 border-r-2",
                  ].map((pos) => (
                    <div key={pos} className={`absolute size-5 border-accent ${pos}`} />
                  ))}
                  <span className="absolute bottom-2.5 left-1/2 -translate-x-1/2 rounded-full bg-ink/70 px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.12em] text-cream backdrop-blur">
                    id {l.talent_member_id.slice(0, 8)}
                  </span>
                </div>

                <div className="p-4">
                  <div className="flex items-baseline justify-between gap-2">
                    <p className="truncate text-sm font-bold">{l.talent_name}</p>
                    <p className="shrink-0 font-mono text-[12px] font-medium text-accent-dark">
                      ${Math.round(l.rate_cents / 100).toLocaleString()}
                      <span className="text-ink-3"> /project</span>
                    </p>
                  </div>
                  <p className="mt-0.5 truncate text-[13px] text-ink-2">{l.headline}</p>
                  {l.bio && (
                    <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-ink-3">{l.bio}</p>
                  )}
                  <Link
                    href={`/dashboard/grants?talent=${l.talent_member_id}`}
                    className="mt-4 flex w-full items-center justify-center rounded-[10px] bg-accent px-4 py-2 text-[13px] font-bold text-white transition hover:bg-accent-dark hover:shadow-[0_4px_16px_rgba(124,111,247,0.35)]"
                  >
                    Request license
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}

        <footer className="mt-16 border-t border-line pt-6 text-xs text-ink-3">
          Sandbox environment — consent records are not legally binding.{" "}
          <Link href="/" className="underline hover:text-ink">cameo</Link>
        </footer>
      </div>
    </main>
  );
}
