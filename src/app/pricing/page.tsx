import Link from "next/link";

const TIERS = [
  {
    name: "Talent", price: "Free", per: "",
    features: ["Approve or deny likeness requests", "Scope by platform, project, time",
      "One-click revoke", "See every use of your face"],
    cta: false,
  },
  {
    name: "Studio", price: "$29", per: "/producer seat/mo",
    features: ["Request likeness grants", "Consent checks via API",
      "HMAC-signed receipts", "Unlimited talent seats"],
    cta: true,
  },
];

export default function Pricing() {
  return (
    <main className="min-h-screen bg-neutral-950 px-8 py-16 text-neutral-100">
      <div className="mx-auto max-w-3xl">
        <Link href="/" className="text-sm text-neutral-500 hover:text-white">← cameo</Link>
        <h1 className="mt-6 text-4xl font-semibold tracking-tight">Pricing</h1>
        <div className="mt-10 grid gap-6 md:grid-cols-2">
          {TIERS.map((t) => (
            <div key={t.name} className="rounded-2xl border border-neutral-800 bg-neutral-900 p-6">
              <h2 className="text-lg font-medium">{t.name}</h2>
              <p className="mt-2 text-3xl font-semibold">
                {t.price}<span className="text-base text-neutral-500">{t.per}</span>
              </p>
              <ul className="mt-4 space-y-2 text-sm text-neutral-400">
                {t.features.map((f) => <li key={f}>· {f}</li>)}
              </ul>
              {t.cta && (
                <form method="POST" action="/api/checkout" className="mt-6">
                  <button className="w-full rounded-lg bg-white px-5 py-2.5 font-medium text-black">
                    Subscribe
                  </button>
                </form>
              )}
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
