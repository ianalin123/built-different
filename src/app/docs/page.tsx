import Link from "next/link";

const REASON_CODES: [string, string, string][] = [
  ["WITHIN_SCOPE", "Allowed — render may proceed", "Proceed; cache until valid_until"],
  ["GRANT_NOT_FOUND", "Grant ID does not belong to your organization", "Fail the job; check config"],
  ["GRANT_PENDING", "Rights holder has not approved yet", "Queue and retry after approval"],
  ["GRANT_DECLINED", "Rights holder declined the request", "Fail the job; request new clearance"],
  ["GRANT_REVOKED", "Rights holder revoked the license", "Halt renders and purge cached allows"],
  ["GRANT_EXPIRED", "License term has ended", "Request renewal from the rights holder"],
  ["PLATFORM_OUT_OF_SCOPE", "Platform not in the granted scope", "Do not publish to this platform"],
  ["CATEGORY_RESTRICTED", "Content category restricted by the rights holder", "Do not render this content"],
  ["RENDER_BUDGET_EXHAUSTED", "The grant's render budget has been spent", "Halt renders; request a larger budget"],
];

function Code({ children }: { children: string }) {
  return (
    <pre className="overflow-x-auto rounded-xl border border-line bg-ink p-4 font-mono text-[12px] leading-relaxed text-cream shadow-[0_2px_12px_rgba(0,0,0,0.07)]">
      {children}
    </pre>
  );
}

function H2({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <h2 id={id} className="mt-12 text-lg font-bold tracking-[-0.01em] text-ink">
      {children}
    </h2>
  );
}

function P({ children }: { children: React.ReactNode }) {
  return <p className="mt-3 text-sm leading-relaxed text-ink-2">{children}</p>;
}

function Mono({ children }: { children: React.ReactNode }) {
  return <code className="rounded bg-cream-2 px-1 py-0.5 font-mono text-xs text-ink">{children}</code>;
}

export default function DocsPage() {
  return (
    <main className="min-h-screen bg-cream text-ink">
      <nav className="flex items-center justify-between border-b border-line px-8 py-5">
        <Link href="/" className="text-lg font-extrabold tracking-[-0.02em]">
          cameo<span className="text-accent">.</span>
        </Link>
        <div className="flex gap-6 text-sm font-medium text-ink-2">
          <Link href="/pricing" className="hover:text-ink">Pricing</Link>
          <Link href="/dashboard" className="hover:text-ink">Dashboard</Link>
        </div>
      </nav>

      <div className="mx-auto max-w-3xl px-8 py-14">
        <p className="text-label !text-accent-dark">api reference</p>
        <h1 className="display-md mt-4">Consent verification API</h1>
        <P>
          One endpoint gates your render pipeline; one lets anyone verify a receipt.
          Check pre-render, re-check at publish, attach the receipt to your provenance
          manifest.
        </P>

        <H2 id="auth">Authentication</H2>
        <P>
          Bearer token with an API key minted from Developers. <Mono>cam_live_</Mono> and{" "}
          <Mono>cam_test_</Mono> keys behave identically — test keys keep integration
          traffic separate.
        </P>
        <div className="mt-3">
          <Code>{`Authorization: Bearer cam_live_4f2a…`}</Code>
        </div>

        <H2 id="check">POST /api/v1/check</H2>
        <P>
          The pre-render gate. Verifies that a license grant covers the render you are
          about to run. Every call — allowed or denied — writes an HMAC-signed receipt
          and an audit-trail event.
        </P>
        <div className="mt-4 space-y-3">
          <Code>{`curl -X POST https://built-different-eosin.vercel.app/api/v1/check \\
  -H "Authorization: Bearer cam_live_…" \\
  -H "Content-Type: application/json" \\
  -d '{
    "grant_id": "9c1e07ab-…",
    "platform": "dramabox",
    "action": "render",
    "category": "romance"
  }'`}</Code>
          <Code>{`{
  "result": "allowed",
  "reason_code": "WITHIN_SCOPE",
  "reason": "within granted scope",
  "valid_until": "2026-07-30T21:41:03.512Z",
  "receipt": {
    "id": "b7f3a2c1-…",
    "signature": "3f9ac2…",
    "timestamp": "2026-07-30T21:26:03.512Z",
    "verify_url": "https://built-different-eosin.vercel.app/api/v1/verify"
  }
}`}</Code>
        </div>

        <H2 id="reason-codes">Reason codes</H2>
        <P>Branch on <Mono>reason_code</Mono>, not the prose.</P>
        <div className="mt-4 overflow-hidden rounded-xl border border-line bg-white shadow-[0_2px_12px_rgba(0,0,0,0.07)]">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-line bg-cream-2/60">
                <th className="text-label px-4 py-3">Code</th>
                <th className="text-label px-4 py-3">Meaning</th>
                <th className="text-label px-4 py-3">Pipeline behavior</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cream-2">
              {REASON_CODES.map(([code, meaning, behavior]) => (
                <tr key={code}>
                  <td className="px-4 py-2.5 font-mono text-[11px] font-medium text-accent-dark">{code}</td>
                  <td className="px-4 py-2.5 text-[13px] text-ink-2">{meaning}</td>
                  <td className="px-4 py-2.5 text-[13px] text-ink-2">{behavior}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <H2 id="leases">Decision leases &amp; revocation</H2>
        <P>
          Allows carry a <Mono>valid_until</Mono> timestamp — at most 15 minutes, never
          past the grant&apos;s term. Cache the decision until then; re-check at publish
          time. Revocation flips the API immediately: the next check returns{" "}
          <Mono>GRANT_REVOKED</Mono> and is receipted like every other decision. Design
          your pipeline to fail closed — no valid lease, no render.
        </P>

        <H2 id="budgets">Render budgets</H2>
        <P>
          A grant may carry a render budget. Each allowed check with{" "}
          <Mono>action: &quot;render&quot;</Mono> spends one render; once the budget is
          spent, further render checks return <Mono>RENDER_BUDGET_EXHAUSTED</Mono>.
          Non-render actions (previews, dry runs) never draw down the budget.
        </P>

        <H2 id="verify">POST /api/v1/verify</H2>
        <P>
          Public, unauthenticated. Recomputes the HMAC over{" "}
          <Mono>receipt_id.grant_id.result.timestamp</Mono> so platforms, brands, or
          counsel can confirm a receipt without a Cameo account.
        </P>
        <div className="mt-4 space-y-3">
          <Code>{`curl -X POST https://built-different-eosin.vercel.app/api/v1/verify \\
  -H "Content-Type: application/json" \\
  -d '{"receipt_id": "b7f3a2c1-…", "signature": "3f9ac2…"}'`}</Code>
          <Code>{`{
  "valid": true,
  "receipt": {
    "id": "b7f3a2c1-…",
    "grant_id": "9c1e07ab-…",
    "result": "allowed",
    "reason_code": "WITHIN_SCOPE",
    "platform": "dramabox",
    "action": "render",
    "timestamp": "2026-07-30T21:26:03.512Z"
  }
}`}</Code>
        </div>

        <H2 id="audit">Audit integrity</H2>
        <P>
          Every event in a studio&apos;s ledger is hash-chained: each entry&apos;s
          SHA-256 hash covers its contents plus the previous entry&apos;s hash. Editing
          or deleting any past event breaks every hash after it, so the Certificate of
          Verification can attest that the chain of custody is intact. Two-stage
          consent — approving the actual output before release, not just the scope —
          is on the roadmap.
        </P>

        <H2 id="integration">Where the check sits</H2>
        <div className="mt-4">
          <Code>{`┌─────────────┐   check    ┌──────────────┐   re-check   ┌─────────────┐
│ render job  │ ─────────► │ Runway/Kling │ ───────────► │  publish    │
│ (pre-gate)  │  allowed?  │   render     │  still valid?│  + receipt  │
└─────────────┘            └──────────────┘              │  in C2PA    │
      50ms · fail closed        $1/clip                  └─────────────┘`}</Code>
        </div>
        <P>
          Gate before the expensive step, re-verify before the irreversible one, and ship
          the receipt with the asset&apos;s provenance manifest.
        </P>

        <footer className="mt-16 border-t border-line pt-6 text-xs text-ink-3">
          Sandbox environment — consent records are not legally binding.{" "}
          <Link href="/" className="underline hover:text-ink">cameo</Link>
        </footer>
      </div>
    </main>
  );
}
