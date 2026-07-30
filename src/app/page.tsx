import Link from "next/link";
import { auth0 } from "@/lib/auth0";

const PERSONAS = [
  {
    who: "Studios",
    headline: "Clearance in one API call",
    body: "Request a scoped license grant, get talent approval, and gate every render on POST /api/v1/check. No more spreadsheet-and-email clearance loops.",
  },
  {
    who: "Rights holders",
    headline: "Your likeness, your terms",
    body: "Grant by platform, project, and term. Restrict categories outright. Revoke in one tap — the API flips to denied on the next check, receipted.",
  },
  {
    who: "Render pipelines",
    headline: "Fail closed, ship provenance",
    body: "Enum'd reason codes, 15-minute decision leases, HMAC-signed receipts anyone can verify. Gate before the expensive step, re-check before the irreversible one.",
  },
];

const REQUEST = `POST /api/v1/check
Authorization: Bearer cam_live_4f2a…

{
  "grant_id": "9c1e07ab-…",
  "platform": "dramabox",
  "action": "render",
  "category": "romance"
}`;

const RESPONSE = `{
  "result": "allowed",
  "reason_code": "WITHIN_SCOPE",
  "valid_until": "2026-07-30T21:41:03Z",
  "receipt": {
    "id": "b7f3a2c1-…",
    "signature": "3f9ac2…",
    "verify_url": "…/api/v1/verify"
  }
}`;

export default async function Home() {
  const session = await auth0.getSession();
  return (
    <main className="flex min-h-screen flex-col bg-[#08090a] text-[#f7f8f8]">
      <nav className="flex items-center justify-between border-b border-white/10 px-8 py-5">
        <span className="font-semibold tracking-tight">cameo</span>
        <div className="flex items-center gap-5 text-sm text-[#8a8f98]">
          <Link href="/docs" className="hover:text-white">Docs</Link>
          <Link href="/pricing" className="hover:text-white">Pricing</Link>
          {session ? (
            <Link href="/dashboard" className="rounded-md bg-white px-3.5 py-1.5 font-medium text-black">
              Dashboard
            </Link>
          ) : (
            <a href="/auth/login?returnTo=/dashboard" className="rounded-md bg-white px-3.5 py-1.5 font-medium text-black">
              Log in
            </a>
          )}
        </div>
      </nav>

      <section className="mx-auto w-full max-w-5xl px-8 pt-24">
        <p className="text-xs font-medium uppercase tracking-widest text-red-400">
          consent infrastructure for ai likeness
        </p>
        <h1 className="mt-4 max-w-3xl text-5xl font-semibold leading-[1.05] tracking-[-0.03em] md:text-6xl">
          OAuth for your face.
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-relaxed text-[#8a8f98]">
          Contracts are signed once. Pipelines render continuously. Cameo turns a
          likeness license into a scoped, revocable grant your render pipeline
          verifies on every job — and every decision comes back as a signed receipt.
        </p>
        <div className="mt-8 flex gap-3">
          <a href="/auth/login?returnTo=/dashboard"
            className="rounded-lg bg-white px-6 py-3 text-sm font-medium text-black">
            Start your studio
          </a>
          <Link href="/docs"
            className="rounded-lg border border-white/15 px-6 py-3 text-sm text-[#c9cdd3] hover:border-white/30">
            Read the API docs
          </Link>
        </div>

        <div className="mt-14 flex flex-wrap gap-x-12 gap-y-4 border-y border-white/10 py-6">
          <div>
            <p className="text-2xl font-semibold tabular-nums tracking-[-0.02em]">470<span className="text-[#8a8f98]">/day</span></p>
            <p className="mt-1 text-xs text-[#8a8f98]">AI microdramas shipping with synthetic faces</p>
          </div>
          <div>
            <p className="text-2xl font-semibold tabular-nums tracking-[-0.02em]">82<span className="text-[#8a8f98]">:1</span></p>
            <p className="mt-1 text-xs text-[#8a8f98]">machine-to-human identity ratio — pipelines are the callers now</p>
          </div>
          <div>
            <p className="text-2xl font-semibold tabular-nums tracking-[-0.02em]">~50<span className="text-[#8a8f98]">ms</span></p>
            <p className="mt-1 text-xs text-[#8a8f98]">per check, fail closed, receipted either way</p>
          </div>
        </div>
      </section>

      <section className="mx-auto grid w-full max-w-5xl gap-4 px-8 pt-14 md:grid-cols-3">
        {PERSONAS.map((p) => (
          <div key={p.who} className="rounded-lg border border-white/10 bg-[#0f1011] p-6">
            <p className="text-xs font-medium uppercase tracking-wider text-[#8a8f98]">{p.who}</p>
            <h2 className="mt-2 text-base font-semibold tracking-[-0.01em]">{p.headline}</h2>
            <p className="mt-2 text-sm leading-relaxed text-[#8a8f98]">{p.body}</p>
          </div>
        ))}
      </section>

      <section className="mx-auto w-full max-w-5xl px-8 pt-14">
        <h2 className="text-lg font-semibold tracking-[-0.01em]">
          The check that sits in front of every render
        </h2>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[#8a8f98]">
          A grant is a scoped token for a likeness. The check is the authorization
          decision. The receipt is the audit log. Identity infrastructure — applied
          to faces instead of accounts.
        </p>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <pre className="overflow-x-auto rounded-lg border border-white/10 bg-[#0f1011] p-5 font-mono text-[12px] leading-relaxed text-[#c9cdd3]">
            {REQUEST}
          </pre>
          <pre className="overflow-x-auto rounded-lg border border-white/10 bg-[#0f1011] p-5 font-mono text-[12px] leading-relaxed text-[#c9cdd3]">
            {RESPONSE}
          </pre>
        </div>
      </section>

      <footer className="mt-20 border-t border-white/10">
        <div className="mx-auto flex w-full max-w-5xl flex-wrap items-center justify-between gap-3 px-8 py-6">
          <p className="font-mono text-[11px] text-[#5e646e]">
            receipt b7f3a2c1 · allowed · WITHIN_SCOPE · sig 3f9ac2… · verify at /api/v1/verify
          </p>
          <p className="text-xs text-[#8a8f98]">
            Sandbox — consent records are not legally binding
          </p>
        </div>
      </footer>
    </main>
  );
}
