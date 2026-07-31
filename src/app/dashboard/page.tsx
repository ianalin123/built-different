import Link from "next/link";
import { auth0 } from "@/lib/auth0";
import { db, getMembership, resolveGrantStatus, type Grant } from "@/lib/db";
import {
  Badge, Card, Chip, EmptyState, PageHeader, StatCard, TimelineItem,
  btnPrimary, btnSecondary, btnDanger, inputCls,
} from "@/components/ui";
import { daysUntil, eventTitle, type EventRow } from "@/lib/events";

export default async function Dashboard() {
  const session = await auth0.getSession();
  if (!session) return null;
  const m = getMembership(session.user.sub);

  if (!m) {
    return (
      <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-6 p-8 text-ink">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-ink-3">cameo</p>
          <h1 className="mt-2 text-2xl font-semibold tracking-[-0.01em]">Set up your studio</h1>
          <p className="mt-2 text-sm text-ink-3">
            Create an organization to start requesting license grants. Rights holders
            join via invite link — no emails are sent.
          </p>
        </div>
        <form method="POST" action="/api/orgs" className="flex gap-2">
          <input name="name" required placeholder="Studio name" className={`flex-1 ${inputCls}`} />
          <button className={btnPrimary}>Create studio</button>
        </form>
      </main>
    );
  }

  if (m.role === "talent") return <TalentInbox memberId={m.id} orgName={m.org_name} />;
  return <StudioOverview orgId={m.org_id} />;
}

function StudioOverview({ orgId }: { orgId: string }) {
  const grants = (db.prepare("SELECT * FROM grants WHERE org_id = ?").all(orgId) as Grant[])
    .map((g) => ({ ...g, status: resolveGrantStatus(g) }));
  const pending = grants.filter((g) => g.status === "pending").length;
  const active = grants.filter((g) => g.status === "active");
  const expiringSoon = active.filter((g) => daysUntil(g.expires_at) <= 30).length;
  const dayAgo = new Date(Date.now() - 86400_000).toISOString();
  const checks = db.prepare(
    "SELECT result, COUNT(*) AS n FROM receipts WHERE org_id = ? AND created_at > ? GROUP BY result"
  ).all(orgId, dayAgo) as { result: string; n: number }[];
  const allowed24 = checks.find((c) => c.result === "allowed")?.n ?? 0;
  const denied24 = checks.find((c) => c.result === "denied")?.n ?? 0;
  const events = db.prepare(
    "SELECT * FROM events WHERE org_id = ? ORDER BY created_at DESC LIMIT 15"
  ).all(orgId) as EventRow[];
  const members = db.prepare(
    "SELECT COUNT(*) AS n FROM members WHERE org_id = ? AND role = 'talent'"
  ).get(orgId) as { n: number };
  const keys = db.prepare("SELECT COUNT(*) AS n FROM api_keys WHERE org_id = ?")
    .get(orgId) as { n: number };

  return (
    <>
      <PageHeader
        title="Overview"
        description="Your consent ledger at a glance."
        action={
          <Link href="/dashboard/grants" className={btnPrimary}>Request clearance</Link>
        }
      />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Pending clearance" value={String(pending)}
          sub={pending > 0 ? "awaiting rights holders" : "all clear"} />
        <StatCard label="Active grants" value={String(active.length)} />
        <StatCard label="Expiring ≤ 30d" value={String(expiringSoon)}
          sub={expiringSoon > 0 ? "renewals needed" : "no renewals due"} />
        <StatCard label="Checks · 24h" value={String(allowed24 + denied24)}
          sub={`${allowed24} allowed / ${denied24} denied`} />
      </div>

      <div className="mt-6">
        <Card title="Recent activity">
          {events.length === 0 ? (
            <EmptyState
              icon="◎"
              title="Nothing in the ledger yet"
              body="Three steps to your first signed receipt: invite a rights holder, request a license grant, mint an API key."
              action={
                <div className="flex gap-2">
                  <Link href="/dashboard/team" className={btnSecondary}>1 · Invite</Link>
                  <Link href="/dashboard/grants" className={btnSecondary}>2 · Request grant</Link>
                  <Link href="/dashboard/developers" className={btnSecondary}>3 · Mint key</Link>
                </div>
              }
            />
          ) : (
            <ul>
              {events.map((e, i) => (
                <TimelineItem
                  key={e.id}
                  title={eventTitle(e)}
                  actor={e.actor_label}
                  timestamp={e.created_at.slice(0, 19).replace("T", " ")}
                  type={e.type}
                  last={i === events.length - 1}
                />
              ))}
            </ul>
          )}
        </Card>
      </div>

      {(members.n === 0 || keys.n === 0) && events.length > 0 && (
        <p className="mt-4 text-sm text-ink-3">
          Setup:{" "}
          {members.n === 0 && (
            <Link href="/dashboard/team" className="underline hover:text-ink">
              invite a rights holder
            </Link>
          )}
          {members.n === 0 && keys.n === 0 && " · "}
          {keys.n === 0 && (
            <Link href="/dashboard/developers" className="underline hover:text-ink">
              mint an API key
            </Link>
          )}
        </p>
      )}
    </>
  );
}

function TalentInbox({ memberId, orgName }: { memberId: string; orgName: string }) {
  const grants = (db.prepare(
    "SELECT * FROM grants WHERE talent_member_id = ? ORDER BY created_at DESC"
  ).all(memberId) as Grant[]).map((g) => ({ ...g, status: resolveGrantStatus(g) }));
  const pending = grants.filter((g) => g.status === "pending");
  const active = grants.filter((g) => g.status === "active");

  return (
    <>
      <PageHeader
        title="Inbox"
        description="Clearance requests for your likeness. Your likeness, your terms."
      />
      {pending.length === 0 ? (
        <EmptyState
          icon="✓"
          title="No pending requests"
          body={`When ${orgName} requests a license to your likeness, it appears here in plain language for you to grant or decline.`}
        />
      ) : (
        <div className="space-y-4">
          {pending.map((g) => (
            <GrantRequestCard key={g.id} grant={g} orgName={orgName} />
          ))}
        </div>
      )}

      {active.length > 0 && (
        <div className="mt-8">
          <h2 className="mb-3 text-xs font-medium uppercase tracking-wider text-ink-3">
            Active grants
          </h2>
          <div className="space-y-3">
            {active.map((g) => (
              <div key={g.id}
                className="flex items-center justify-between rounded-lg border border-line bg-white p-4">
                <div>
                  <Link href={`/dashboard/grants/${g.id}`}
                    className="text-sm font-medium text-ink hover:underline">
                    {g.title}
                  </Link>
                  <p className="mt-0.5 text-[13px] tabular-nums text-ink-3">
                    {g.scope_project} · expires in {daysUntil(g.expires_at)} days
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Badge status="active" />
                  <form method="POST" action="/api/grants/decision">
                    <input type="hidden" name="grant_id" value={g.id} />
                    <input type="hidden" name="action" value="revoke" />
                    <button className={btnDanger}>Revoke</button>
                  </form>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}

function GrantRequestCard({ grant, orgName }: { grant: Grant; orgName: string }) {
  const platforms = JSON.parse(grant.scope_platforms) as string[];
  const restrictions = JSON.parse(grant.restrictions) as string[];
  return (
    <div className="rounded-2xl border border-hay/30 bg-white p-5 shadow-[0_2px_12px_rgba(0,0,0,0.07)]">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-ink">{grant.title}</p>
          <p className="mt-1 text-[13px] text-ink-3">
            <span className="font-medium text-ink-2">{orgName}</span> requests a license
            to your likeness for <span className="font-medium text-ink-2">{grant.scope_project}</span>.
          </p>
        </div>
        <Badge status="pending" />
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        {platforms.map((p) => <Chip key={p}>{p}</Chip>)}
        {restrictions.map((r) => <Chip key={r}>no {r.replace("_", " ")}</Chip>)}
        <Chip>{daysUntil(grant.expires_at)}-day term</Chip>
      </div>
      <div className="mt-4 flex items-center gap-2">
        <form method="POST" action="/api/grants/decision">
          <input type="hidden" name="grant_id" value={grant.id} />
          <input type="hidden" name="action" value="grant" />
          <button className={btnPrimary}>Grant license</button>
        </form>
        <form method="POST" action="/api/grants/decision">
          <input type="hidden" name="grant_id" value={grant.id} />
          <input type="hidden" name="action" value="decline" />
          <button className={btnSecondary}>Decline</button>
        </form>
        <Link href={`/dashboard/grants/${grant.id}`}
          className="ml-auto text-[13px] text-ink-3 hover:text-ink">
          Details →
        </Link>
      </div>
    </div>
  );
}
