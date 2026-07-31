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
    body: "Grant by platform, project, term — even a render budget. Restrict categories outright. Revoke in one tap — the API flips to denied on the next check, receipted.",
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
    <main className="flex min-h-screen flex-col bg-cream text-ink">
      <nav className="flex items-center justify-between border-b border-line px-8 py-5">
        <span className="text-lg font-extrabold tracking-[-0.02em]">
          cameo<span className="text-accent">.</span>
        </span>
        <div className="flex items-center gap-6 text-sm font-medium text-ink-2">
          <Link href="/docs" className="hover:text-ink">Docs</Link>
          <Link href="/pricing" className="hover:text-ink">Pricing</Link>
          {session ? (
            <Link href="/dashboard"
              className="rounded-[10px] bg-accent px-4 py-2 text-[13px] font-bold text-white transition hover:bg-accent-dark">
              Dashboard
            </Link>
          ) : (
            <a href="/auth/login?returnTo=/dashboard"
              className="rounded-[10px] bg-accent px-4 py-2 text-[13px] font-bold text-white transition hover:bg-accent-dark">
              Log in
            </a>
          )}
        </div>
      </nav>

      <section className="mx-auto w-full max-w-5xl px-8 pt-24">
        <p className="text-label !text-accent-dark">
          consent infrastructure for ai likeness
        </p>
        <h1 className="display-xl mt-5 max-w-3xl">
          OAuth for your face<span className="text-accent">.</span>
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-relaxed text-ink-2">
          Contracts are signed once. Pipelines render continuously. Cameo turns a
          likeness license into a scoped, revocable grant your render pipeline
          verifies on every job — and every decision comes back as a signed receipt.
        </p>
        <div className="mt-8 flex gap-3">
          <a href="/auth/login?returnTo=/dashboard"
            className="rounded-[10px] bg-accent px-6 py-3 text-sm font-bold text-white transition hover:-translate-y-px hover:bg-accent-dark hover:shadow-[0_4px_16px_rgba(124,111,247,0.35)]">
            Start your studio
          </a>
          <Link href="/docs"
            className="rounded-[10px] border-[1.5px] border-line-2 px-6 py-3 text-sm font-semibold text-ink transition hover:border-ink-3 hover:bg-black/[0.02]">
            Read the API docs
          </Link>
        </div>

        <div className="mt-14 flex flex-wrap gap-x-12 gap-y-4 border-y border-line py-6">
          <div>
            <p className="text-[26px] font-extrabold tabular-nums tracking-[-0.02em]">
              470<span className="text-ink-3">/day</span>
            </p>
            <p className="mt-1 text-xs text-ink-3">AI microdramas shipping with synthetic faces</p>
          </div>
          <div>
            <p className="text-[26px] font-extrabold tabular-nums tracking-[-0.02em]">
              82<span className="text-ink-3">:1</span>
            </p>
            <p className="mt-1 text-xs text-ink-3">machine-to-human identity ratio — pipelines are the callers now</p>
          </div>
          <div>
            <p className="text-[26px] font-extrabold tabular-nums tracking-[-0.02em]">
              ~50<span className="text-ink-3">ms</span>
            </p>
            <p className="mt-1 text-xs text-ink-3">per check, fail closed, receipted either way</p>
          </div>
        </div>
      </section>

      <section className="mx-auto grid w-full max-w-5xl gap-4 px-8 pt-14 md:grid-cols-3">
        {PERSONAS.map((p) => (
          <div key={p.who}
            className="rounded-2xl border border-line bg-white p-6 shadow-[0_2px_12px_rgba(0,0,0,0.07)]">
            <p className="text-label">{p.who}</p>
            <h2 className="mt-2 text-base font-bold tracking-[-0.01em]">{p.headline}</h2>
            <p className="mt-2 text-sm leading-relaxed text-ink-2">{p.body}</p>
          </div>
        ))}
      </section>

      <section className="mx-auto w-full max-w-5xl px-8 pt-16">
        <h2 className="display-md">The check that sits in front of every render</h2>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-ink-2">
          A grant is a scoped token for a likeness. The check is the authorization
          decision. The receipt is the audit log. Identity infrastructure — applied
          to faces instead of accounts.
        </p>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {[REQUEST, RESPONSE].map((code, i) => (
            <div key={i} className="overflow-hidden rounded-2xl border border-line shadow-[0_2px_12px_rgba(0,0,0,0.07)]">
              <div className="flex items-center gap-1.5 border-b border-white/10 bg-ink px-4 py-2.5">
                <span className="size-2 rounded-full bg-rust/70" />
                <span className="size-2 rounded-full bg-hay/70" />
                <span className="size-2 rounded-full bg-grass/70" />
                <span className="ml-2 font-mono text-[10px] uppercase tracking-[0.1em] text-white/40">
                  {i === 0 ? "request" : "response"}
                </span>
              </div>
              <pre className="overflow-x-auto bg-ink p-5 font-mono text-[12px] leading-relaxed text-cream">
                {code}
              </pre>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto w-full max-w-5xl px-8 pt-16">
        <div className="rounded-2xl border border-accent/25 bg-accent-3 p-6">
          <p className="text-label !text-accent-dark">roadmap</p>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-ink-2">
            <span className="font-bold text-ink">Two-stage consent is next:</span>{" "}
            approve the scope up front, then approve the actual output before
            release. Grants already carry render budgets and a per-studio hash
            chain — every event&apos;s hash covers the one before it, so history
            can&apos;t be quietly rewritten.
          </p>
        </div>
      </section>

      <footer className="mt-20 border-t border-line">
        <div className="mx-auto flex w-full max-w-5xl flex-wrap items-center justify-between gap-3 px-8 py-6">
          <p className="font-mono text-[11px] text-ink-3">
            receipt b7f3a2c1 · allowed · WITHIN_SCOPE · sig 3f9ac2… · verify at /api/v1/verify
          </p>
          <p className="text-xs text-ink-3">
            Sandbox — consent records are not legally binding
          </p>
        </div>
      </footer>
    </main>
  );
}
