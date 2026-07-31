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
    <pre className="overflow-x-auto rounded-lg border border-white/10 bg-[#0f1011] p-4 font-mono text-[12px] leading-relaxed text-[#c9cdd3]">
      {children}
    </pre>
  );
}

function H2({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <h2 id={id} className="mt-12 text-lg font-semibold tracking-[-0.01em] text-[#f7f8f8]">
      {children}
    </h2>
  );
}

function P({ children }: { children: React.ReactNode }) {
  return <p className="mt-3 text-sm leading-relaxed text-[#8a8f98]">{children}</p>;
}

export default function DocsPage() {
  return (
    <main className="min-h-screen bg-[#08090a] text-[#f7f8f8]">
      <nav className="flex items-center justify-between border-b border-white/10 px-8 py-5">
        <Link href="/" className="font-semibold tracking-tight">cameo</Link>
        <div className="flex gap-5 text-sm text-[#8a8f98]">
          <Link href="/pricing" className="hover:text-white">Pricing</Link>
          <Link href="/dashboard" className="hover:text-white">Dashboard</Link>
        </div>
      </nav>

      <div className="mx-auto max-w-3xl px-8 py-14">
        <p className="text-xs font-medium uppercase tracking-widest text-red-400">
          api reference
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-[-0.02em]">
          Consent verification API
        </h1>
        <P>
          One endpoint gates your render pipeline; one lets anyone verify a receipt.
          Check pre-render, re-check at publish, attach the receipt to your provenance
          manifest.
        </P>

        <H2 id="auth">Authentication</H2>
        <P>
          Bearer token with an API key minted from Developers. <code className="font-mono text-xs text-[#c9cdd3]">cam_live_</code> and{" "}
          <code className="font-mono text-xs text-[#c9cdd3]">cam_test_</code> keys behave
          identically — test keys keep integration traffic separate.
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
        <P>Branch on <code className="font-mono text-xs text-[#c9cdd3]">reason_code</code>, not the prose.</P>
        <div className="mt-4 overflow-hidden rounded-lg border border-white/10">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-white/10 bg-[#0f1011] text-xs font-medium text-[#8a8f98]">
                <th className="px-4 py-2.5">Code</th>
                <th className="px-4 py-2.5">Meaning</th>
                <th className="px-4 py-2.5">Pipeline behavior</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {REASON_CODES.map(([code, meaning, behavior]) => (
                <tr key={code}>
                  <td className="px-4 py-2.5 font-mono text-[11px] text-[#c9cdd3]">{code}</td>
                  <td className="px-4 py-2.5 text-[13px] text-[#8a8f98]">{meaning}</td>
                  <td className="px-4 py-2.5 text-[13px] text-[#8a8f98]">{behavior}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <H2 id="leases">Decision leases &amp; revocation</H2>
        <P>
          Allows carry a <code className="font-mono text-xs text-[#c9cdd3]">valid_until</code>{" "}
          timestamp — at most 15 minutes, never past the grant&apos;s term. Cache the decision
          until then; re-check at publish time. Revocation flips the API immediately: the
          next check returns <code className="font-mono text-xs text-[#c9cdd3]">GRANT_REVOKED</code>{" "}
          and is receipted like every other decision. Design your pipeline to fail closed —
          no valid lease, no render.
        </P>

        <H2 id="verify">POST /api/v1/verify</H2>
        <P>
          Public, unauthenticated. Recomputes the HMAC over{" "}
          <code className="font-mono text-xs text-[#c9cdd3]">receipt_id.grant_id.result.timestamp</code>{" "}
          so platforms, brands, or counsel can confirm a receipt without a Cameo account.
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

        <footer className="mt-16 border-t border-white/10 pt-6 text-xs text-[#8a8f98]">
          Sandbox environment — consent records are not legally binding.{" "}
          <Link href="/" className="underline hover:text-white">cameo</Link>
        </footer>
      </div>
    </main>
  );
}
