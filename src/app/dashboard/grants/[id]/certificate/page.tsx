import Link from "next/link";
import { notFound } from "next/navigation";
import { auth0 } from "@/lib/auth0";
import { db, getMembership, resolveGrantStatus, verifyEventChain, type Grant } from "@/lib/db";
import { Badge, Chip, KV, btnSecondary } from "@/components/ui";
import { PrintButton } from "@/components/copy-field";
import { eventTitle, type EventRow } from "@/lib/events";

type GrantDetail = Grant & { talent_name: string; talent_email: string; org_name: string };

export default async function CertificatePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth0.getSession();
  if (!session) return null;
  const m = getMembership(session.user.sub);
  if (!m) return null;

  const grant = db.prepare(`
    SELECT g.*, mem.name AS talent_name, mem.email AS talent_email, o.name AS org_name
    FROM grants g
    JOIN members mem ON mem.id = g.talent_member_id
    JOIN orgs o ON o.id = g.org_id
    WHERE g.id = ?
  `).get(id) as GrantDetail | undefined;
  if (!grant) notFound();
  const authorized =
    m.role === "talent" ? grant.talent_member_id === m.id : grant.org_id === m.org_id;
  if (!authorized) notFound();

  const status = resolveGrantStatus(grant);
  const platforms = JSON.parse(grant.scope_platforms) as string[];
  const restrictions = JSON.parse(grant.restrictions) as string[];
  const events = db.prepare(
    "SELECT * FROM events WHERE grant_id = ? ORDER BY created_at"
  ).all(id) as EventRow[];
  const receipts = new Map(
    (db.prepare("SELECT id, signature FROM receipts WHERE grant_id = ?")
      .all(id) as { id: string; signature: string }[]).map((r) => [r.id, r.signature])
  );
  const base = process.env.APP_BASE_URL ?? "http://localhost:3000";
  const chain = verifyEventChain(grant.org_id);

  return (
    <div className="mx-auto max-w-2xl text-ink">
      <div className="no-print mb-6 flex items-center justify-between">
        <Link href={`/dashboard/grants/${id}`} className="text-[13px] text-ink-3 hover:text-ink">
          ← Back to grant
        </Link>
        <PrintButton className={btnSecondary} />
      </div>

      <div className="rounded-2xl border border-line bg-white p-8 shadow-[0_2px_12px_rgba(0,0,0,0.07)] print:border-0 print:p-0 print:shadow-none">
        <header className="border-b border-line pb-6">
          <p className="text-xs font-medium uppercase tracking-widest text-ink-3">
            cameo · consent ledger
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-[-0.01em]">
            Certificate of Verification
          </h1>
          <p className="mt-2 text-sm text-ink-3">
            This certificate records the complete chain of custody for a likeness
            license grant, including every verification decision issued against it.
          </p>
        </header>

        <section className="mt-6">
          <h2 className="text-xs font-medium uppercase tracking-wider text-ink-3">
            License grant
          </h2>
          <div className="mt-2">
            <KV
              rows={[
                ["Grant ID", <span key="id" className="font-mono text-xs">{grant.id}</span>],
                ["Title", grant.title],
                ["Rights holder", `${grant.talent_name} (${grant.talent_email})`],
                ["Licensee (studio)", grant.org_name],
                ["Project", grant.scope_project],
                ["Platforms",
                  <span key="p" className="flex flex-wrap gap-1">
                    {platforms.map((p) => <Chip key={p}>{p}</Chip>)}
                  </span>],
                ["Restrictions",
                  restrictions.length === 0
                    ? "none"
                    : restrictions.map((r) => `no ${r.replace("_", " ")}`).join(", ")],
                ["Term",
                  <span key="t" className="tabular-nums">
                    {grant.created_at.slice(0, 10)} → {grant.expires_at.slice(0, 10)}
                  </span>],
                ["Render budget",
                  <span key="b" className="tabular-nums">
                    {grant.max_renders === null
                      ? "unlimited"
                      : `${grant.renders_used} / ${grant.max_renders} spent`}
                  </span>],
                ["Status", <Badge key="s" status={status} />],
              ]}
            />
          </div>
        </section>

        <section className="mt-8">
          <h2 className="text-xs font-medium uppercase tracking-wider text-ink-3">
            Chain of custody
          </h2>
          <table className="mt-2 w-full text-left">
            <thead>
              <tr className="border-b border-line text-xs font-medium text-ink-3">
                <th className="py-2 pr-3">Timestamp (UTC)</th>
                <th className="py-2 pr-3">Event</th>
                <th className="py-2 pr-3">Actor</th>
                <th className="py-2 pr-3">Signature</th>
                <th className="py-2">Chain hash</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cream-2">
              {events.map((e) => {
                const meta = JSON.parse(e.meta) as { receipt_id?: string };
                const sig = meta.receipt_id ? receipts.get(meta.receipt_id) : undefined;
                return (
                  <tr key={e.id} className="align-top">
                    <td className="py-2 pr-3 font-mono text-[11px] tabular-nums text-ink-3">
                      {e.created_at.slice(0, 19).replace("T", " ")}
                    </td>
                    <td className="py-2 pr-3 text-[13px]">{eventTitle(e)}</td>
                    <td className="py-2 pr-3 text-[13px] text-ink-3">{e.actor_label}</td>
                    <td className="py-2 pr-3 font-mono text-[11px] text-ink-3">
                      {sig ? `${sig.slice(0, 12)}…` : "—"}
                    </td>
                    <td className="py-2 font-mono text-[11px] text-ink-3">
                      {e.hash ? `${e.hash.slice(0, 12)}…` : "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </section>

        <section className="mt-8 rounded-md border border-line bg-cream p-4 print:bg-white">
          <h2 className="text-xs font-medium uppercase tracking-wider text-ink-3">
            Independent verification
          </h2>
          <p className="mt-2 text-[13px] leading-relaxed text-ink-2">
            Each verification receipt above is signed with HMAC-SHA256 over{" "}
            <code className="font-mono text-[11px]">
              receipt_id.grant_id.result.timestamp
            </code>
            . Any party can confirm a receipt&apos;s authenticity:
          </p>
          <pre className="mt-2 overflow-x-auto font-mono text-[11px] leading-relaxed text-ink-2">
{`curl -X POST ${base}/api/v1/verify \\
  -H "Content-Type: application/json" \\
  -d '{"receipt_id": "<id>", "signature": "<signature>"}'`}
          </pre>
          <p className="mt-3 border-t border-line pt-3 text-[13px] leading-relaxed text-ink-2">
            Events form a per-studio hash chain: each entry&apos;s hash covers its
            contents plus the previous entry&apos;s hash, so any retroactive edit or
            deletion breaks every hash after it.{" "}
            {chain.valid ? (
              <span className="font-medium text-grass">
                ✓ Chain verified intact at time of generation.
              </span>
            ) : (
              <span className="font-medium text-rust">
                ✗ Chain integrity check FAILED — ledger has been altered.
              </span>
            )}
          </p>
        </section>

        <footer className="mt-8 border-t border-line pt-4 text-xs text-ink-3">
          Generated {new Date().toISOString()} · Sandbox environment — records are
          not legally binding.
        </footer>
      </div>
    </div>
  );
}
