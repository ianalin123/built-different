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
      "Audit trail + Certificate of Verification",
      "Live and test API keys",
      "Unlimited rights-holder seats",
    ],
    cta: true,
  },
];

export default function Pricing() {
  return (
    <main className="min-h-screen bg-[#08090a] text-[#f7f8f8]">
      <nav className="flex items-center justify-between border-b border-white/10 px-8 py-5">
        <Link href="/" className="font-semibold tracking-tight">cameo</Link>
        <div className="flex gap-5 text-sm text-[#8a8f98]">
          <Link href="/docs" className="hover:text-white">Docs</Link>
          <Link href="/dashboard" className="hover:text-white">Dashboard</Link>
        </div>
      </nav>

      <div className="mx-auto max-w-4xl px-8 py-16">
        <p className="text-xs font-medium uppercase tracking-widest text-red-400">pricing</p>
        <h1 className="mt-3 text-4xl font-semibold tracking-[-0.02em]">
          Free for the people being rendered.
        </h1>
        <p className="mt-4 max-w-xl text-sm leading-relaxed text-[#8a8f98]">
          Studios pay per producer seat. Rights holders never pay — consent
          infrastructure only works if saying yes or no costs nothing.
        </p>

        <div className="mt-12 grid gap-4 md:grid-cols-2">
          {TIERS.map((t) => (
            <div key={t.name}
              className={`rounded-lg border p-6 ${t.cta ? "border-white/25 bg-[#0f1011]" : "border-white/10"}`}>
              <h2 className="text-sm font-medium uppercase tracking-wider text-[#8a8f98]">
                {t.name}
              </h2>
              <p className="mt-3 text-3xl font-semibold tracking-[-0.02em]">
                {t.price}
                <span className="ml-1 text-sm font-normal text-[#8a8f98]">{t.per}</span>
              </p>
              <p className="mt-2 text-[13px] leading-relaxed text-[#8a8f98]">{t.blurb}</p>
              <ul className="mt-5 space-y-2.5 border-t border-white/10 pt-5 text-sm text-[#c9cdd3]">
                {t.features.map((f) => (
                  <li key={f} className="flex gap-2.5">
                    <span className="text-[#5e646e]">—</span>
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              {t.cta ? (
                <form method="POST" action="/api/checkout" className="mt-6">
                  <button className="w-full rounded-lg bg-white px-5 py-2.5 text-sm font-medium text-black">
                    Upgrade to Studio
                  </button>
                </form>
              ) : (
                <a href="/auth/login?returnTo=/dashboard"
                  className="mt-6 block w-full rounded-lg border border-white/15 px-5 py-2.5 text-center text-sm text-[#c9cdd3] hover:border-white/30">
                  Sign in — it&apos;s free
                </a>
              )}
            </div>
          ))}
        </div>

        <p className="mt-10 text-xs text-[#5e646e]">
          Sandbox environment — payments use Stripe test mode (4242 4242 4242 4242).
        </p>
      </div>
    </main>
  );
}
