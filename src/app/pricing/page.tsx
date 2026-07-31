import Link from "next/link";

const TIERS = [
  {
    name: "Rights holder",
    price: "Free",
    per: "forever",
    blurb: "For talent and estates. You are the product's beneficiary, not its customer.",
    features: [
      "Approve or decline license grant requests",
      "Scope by platform, project, category, and term",
      "One-tap revoke — API flips on the next check",
      "Usage feed: every render check against your likeness",
    ],
    cta: false,
  },
  {
    name: "Studio",
    price: "$29",
    per: "/producer seat/mo",
    blurb: "For studios and production teams running AI render pipelines.",
    features: [
      "License grant requests with scoped terms",
      "Verification API with signed receipts",
      "Hash-chained audit trail + Certificate of Verification",
      "Live and test API keys",
      "Unlimited rights-holder seats",
    ],
    cta: true,
  },
];

export default function Pricing() {
  return (
    <main className="min-h-screen bg-cream text-ink">
      <nav className="flex items-center justify-between border-b border-line px-8 py-5">
        <Link href="/" className="text-lg font-extrabold tracking-[-0.02em]">
          cameo<span className="text-accent">.</span>
        </Link>
        <div className="flex gap-6 text-sm font-medium text-ink-2">
          <Link href="/docs" className="hover:text-ink">Docs</Link>
          <Link href="/dashboard" className="hover:text-ink">Dashboard</Link>
        </div>
      </nav>

      <div className="mx-auto max-w-4xl px-8 py-16">
        <p className="text-label !text-accent-dark">pricing</p>
        <h1 className="display-lg mt-4">Free for the people being rendered.</h1>
        <p className="mt-4 max-w-xl text-sm leading-relaxed text-ink-2">
          Studios pay per producer seat. Rights holders never pay — consent
          infrastructure only works if saying yes or no costs nothing.
        </p>

        <div className="mt-12 grid gap-5 md:grid-cols-2">
          {TIERS.map((t) => (
            <div key={t.name}
              className={`rounded-2xl border bg-white p-7 ${
                t.cta
                  ? "border-accent/40 shadow-[0_4px_24px_rgba(124,111,247,0.15)]"
                  : "border-line shadow-[0_2px_12px_rgba(0,0,0,0.07)]"
              }`}>
              <h2 className="text-label">{t.name}</h2>
              <p className="mt-3 text-[34px] font-extrabold tracking-[-0.02em]">
                {t.price}
                <span className="ml-1 text-sm font-medium text-ink-3">{t.per}</span>
              </p>
              <p className="mt-2 text-[13px] leading-relaxed text-ink-2">{t.blurb}</p>
              <ul className="mt-5 space-y-2.5 border-t border-cream-2 pt-5 text-sm text-ink-2">
                {t.features.map((f) => (
                  <li key={f} className="flex gap-2.5">
                    <span className={t.cta ? "text-accent" : "text-ink-3"}>—</span>
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              {t.cta ? (
                <form method="POST" action="/api/checkout" className="mt-6">
                  <button className="w-full rounded-[10px] bg-accent px-5 py-2.5 text-sm font-bold text-white transition hover:bg-accent-dark hover:shadow-[0_4px_16px_rgba(124,111,247,0.35)]">
                    Upgrade to Studio
                  </button>
                </form>
              ) : (
                <a href="/auth/login?returnTo=/dashboard"
                  className="mt-6 block w-full rounded-[10px] border-[1.5px] border-line-2 px-5 py-2.5 text-center text-sm font-semibold text-ink transition hover:border-ink-3 hover:bg-black/[0.02]">
                  Sign in — it&apos;s free
                </a>
              )}
            </div>
          ))}
        </div>

        <p className="mt-10 font-mono text-[11px] text-ink-3">
          Sandbox environment — payments use Stripe test mode (4242 4242 4242 4242).
        </p>
      </div>
    </main>
  );
}
