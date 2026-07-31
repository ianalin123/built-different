import Link from "next/link";
import { notFound } from "next/navigation";
import { auth0 } from "@/lib/auth0";
import { db, getMembership, resolveGrantStatus, type Grant } from "@/lib/db";
import {
  Badge, Card, Chip, KV, PageHeader, TimelineItem,
  btnPrimary, btnSecondary, btnDanger,
} from "@/components/ui";
import { CopyField } from "@/components/copy-field";
import { daysUntil, eventTitle, type EventRow } from "@/lib/events";

type GrantDetail = Grant & { talent_name: string; org_name: string };

export default async function GrantDetailPage({
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
    SELECT g.*, mem.name AS talent_name, o.name AS org_name
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
  const receiptSigs = new Map(
    (db.prepare("SELECT id, signature FROM receipts WHERE grant_id = ?")
      .all(id) as { id: string; signature: string }[]).map((r) => [r.id, r.signature])
  );
  const usage = db.prepare(
    "SELECT result, COUNT(*) AS n, MAX(created_at) AS last FROM receipts WHERE grant_id = ? GROUP BY result"
  ).all(id) as { result: string; n: number; last: string }[];
  const allowed = usage.find((u) => u.result === "allowed");
  const denied = usage.find((u) => u.result === "denied");
  const lastCheck = [allowed?.last, denied?.last].filter(Boolean).sort().at(-1);

  const isTalent = m.role === "talent";
  const detailPath = `/dashboard/grants/${grant.id}`;

  return (
    <>
      <PageHeader
        title={grant.title}
        description={`License grant · ${grant.org_name} ↔ ${grant.talent_name}`}
        action={
          <div className="flex items-center gap-2">
            <Badge status={status} />
            <Link href={`${detailPath}/certificate`} className={btnSecondary}>
              Certificate
            </Link>
          </div>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          <Card title="Scope">
            <KV
              rows={[
                ["Grant ID", <CopyField key="id" value={grant.id} />],
                ["Rights holder", grant.talent_name],
                ["Studio", grant.org_name],
                ["Project", grant.scope_project],
                ["Platforms",
                  <span key="p" className="flex flex-wrap gap-1">
                    {platforms.map((p) => <Chip key={p}>{p}</Chip>)}
                  </span>],
                ["Restrictions",
                  restrictions.length === 0 ? (
                    <span className="text-zinc-400">none</span>
                  ) : (
                    <span key="r" className="flex flex-wrap gap-1">
                      {restrictions.map((r) => <Chip key={r}>no {r.replace("_", " ")}</Chip>)}
                    </span>
                  )],
                ["Term",
                  <span key="t" className="tabular-nums">
                    {grant.created_at.slice(0, 10)} → {grant.expires_at.slice(0, 10)}
                    {status === "active" && ` · ${daysUntil(grant.expires_at)} days remaining`}
                  </span>],
              ]}
            />
            {isTalent && (
              <div className="mt-4 flex gap-2 border-t border-zinc-100 pt-4">
                {status === "pending" && (
                  <>
                    <DecisionForm grantId={grant.id} action="grant" returnTo={detailPath}
                      label="Grant license" cls={btnPrimary} />
                    <DecisionForm grantId={grant.id} action="decline" returnTo={detailPath}
                      label="Decline" cls={btnSecondary} />
                  </>
                )}
                {status === "active" && (
                  <DecisionForm grantId={grant.id} action="revoke" returnTo={detailPath}
                    label="Revoke license" cls={btnDanger} />
                )}
              </div>
            )}
          </Card>

          <Card title="Audit trail">
            {events.length === 0 ? (
              <p className="text-sm text-zinc-400">No events recorded.</p>
            ) : (
              <ul>
                {events.map((e, i) => {
                  const meta = JSON.parse(e.meta) as { receipt_id?: string };
                  const sig = meta.receipt_id ? receiptSigs.get(meta.receipt_id) : undefined;
                  return (
                    <TimelineItem
                      key={e.id}
                      title={eventTitle(e)}
                      actor={e.actor_label}
                      timestamp={e.created_at.slice(0, 19).replace("T", " ")}
                      hash={sig ? `${sig.slice(0, 24)}…` : undefined}
                      type={e.type}
                      last={i === events.length - 1}
                    />
                  );
                })}
              </ul>
            )}
          </Card>
        </div>

        <div className="space-y-6">
          <Card title="Usage">
            <KV
              rows={[
                ["Render budget",
                  <span key="b" className="tabular-nums">
                    {grant.max_renders === null
                      ? "unlimited"
                      : `${grant.renders_used} / ${grant.max_renders} spent`}
                  </span>],
                ["Checks allowed",
                  <span key="a" className="tabular-nums">{allowed?.n ?? 0}</span>],
                ["Checks denied",
                  <span key="d" className="tabular-nums">{denied?.n ?? 0}</span>],
                ["Last check",
                  <span key="l" className="tabular-nums">
                    {lastCheck ? lastCheck.slice(0, 19).replace("T", " ") : "never"}
                  </span>],
              ]}
            />
          </Card>
          <Card title="Verification">
            <p className="text-[13px] leading-relaxed text-zinc-500">
              Render pipelines verify this grant with{" "}
              <code className="font-mono text-xs text-zinc-700">POST /api/v1/check</code>.
              Every decision — allow or deny — produces an HMAC-signed receipt that appears
              in the audit trail and can be verified by anyone via{" "}
              <code className="font-mono text-xs text-zinc-700">POST /api/v1/verify</code>.
            </p>
            <Link href="/docs" className="mt-3 inline-block text-[13px] text-zinc-700 underline hover:text-zinc-900">
              API reference →
            </Link>
          </Card>
        </div>
      </div>
    </>
  );
}

function DecisionForm({
  grantId, action, returnTo, label, cls,
}: { grantId: string; action: string; returnTo: string; label: string; cls: string }) {
  return (
    <form method="POST" action="/api/grants/decision">
      <input type="hidden" name="grant_id" value={grantId} />
      <input type="hidden" name="action" value={action} />
      <input type="hidden" name="return_to" value={returnTo} />
      <button className={cls}>{label}</button>
    </form>
  );
}
