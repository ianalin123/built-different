import { auth0 } from "@/lib/auth0";
import { db, getMembership } from "@/lib/db";

type GrantRow = {
  id: string; title: string; scope_platforms: string; scope_project: string;
  expires_at: string; status: string; talent_name: string;
};
type ReceiptRow = {
  id: string; grant_id: string; action: string; platform: string;
  result: string; reason: string; signature: string; created_at: string;
};

const PILL: Record<string, string> = {
  requested: "bg-amber-50 text-amber-700 border-amber-200",
  active: "bg-emerald-50 text-emerald-700 border-emerald-200",
  allowed: "bg-emerald-50 text-emerald-700 border-emerald-200",
  denied: "bg-neutral-100 text-neutral-500 border-neutral-200",
  revoked: "bg-red-50 text-red-700 border-red-200",
};

function Pill({ label }: { label: string }) {
  return (
    <span className={`rounded-full border px-2 py-0.5 text-xs font-medium ${PILL[label] ?? PILL.denied}`}>
      {label}
    </span>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-neutral-200 bg-white p-5">
      <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-neutral-500">{title}</h2>
      {children}
    </section>
  );
}

export default async function Dashboard({
  searchParams,
}: {
  searchParams: Promise<{ new_key?: string }>;
}) {
  const { new_key } = await searchParams;
  const session = await auth0.getSession();
  if (!session) return null; // proxy redirects unauthenticated users
  const m = getMembership(session.user.sub);

  if (!m) {
    return (
      <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-6 p-8">
        <h1 className="text-2xl font-semibold">Create your studio</h1>
        <p className="text-neutral-500">
          Set up an organization to start requesting likeness grants. Talent joins via invite.
        </p>
        <form method="POST" action="/api/orgs" className="flex gap-2">
          <input name="name" required placeholder="Studio name"
            className="flex-1 rounded-lg border border-neutral-300 px-3 py-2" />
          <button className="rounded-lg bg-black px-5 py-2 text-white">Create</button>
        </form>
      </main>
    );
  }

  const isTalent = m.role === "talent";
  const grants = (isTalent
    ? db.prepare(`SELECT g.*, mem.name AS talent_name FROM grants g
        JOIN members mem ON mem.id = g.talent_member_id
        WHERE g.talent_member_id = ? ORDER BY g.created_at DESC`).all(m.id)
    : db.prepare(`SELECT g.*, mem.name AS talent_name FROM grants g
        JOIN members mem ON mem.id = g.talent_member_id
        WHERE g.org_id = ? ORDER BY g.created_at DESC`).all(m.org_id)) as GrantRow[];
  const receipts = (isTalent
    ? db.prepare(`SELECT r.* FROM receipts r JOIN grants g ON g.id = r.grant_id
        WHERE g.talent_member_id = ? ORDER BY r.created_at DESC LIMIT 20`).all(m.id)
    : db.prepare(`SELECT * FROM receipts WHERE org_id = ? ORDER BY created_at DESC LIMIT 20`)
        .all(m.org_id)) as ReceiptRow[];

  return (
    <main className="min-h-screen bg-neutral-50 text-neutral-900">
      <div className="mx-auto max-w-5xl space-y-6 p-8">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold">{m.org_name}</h1>
            <p className="text-sm text-neutral-500">
              {session.user.name} · {m.role} · {m.plan === "free" ? "Free" : "Pro"}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {!isTalent && m.plan === "free" && (
              <form method="POST" action="/api/checkout">
                <button className="rounded-lg bg-black px-4 py-2 text-sm text-white">
                  Upgrade to Pro — $29/seat
                </button>
              </form>
            )}
            <a href="/auth/logout" className="text-sm text-neutral-500 hover:text-black">Log out</a>
          </div>
        </header>

        {new_key && (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm">
            <p className="font-medium text-emerald-800">API key created — copy it now, shown once:</p>
            <code className="mt-1 block font-mono text-emerald-900">{new_key}</code>
          </div>
        )}

        {!isTalent && <StudioPanels orgId={m.org_id} />}

        <Section title={isTalent ? "Requests for your likeness" : "Grants"}>
          {grants.length === 0 && <p className="text-sm text-neutral-400">No grants yet.</p>}
          <ul className="divide-y divide-neutral-100">
            {grants.map((g) => (
              <li key={g.id} className="flex items-center justify-between gap-4 py-3">
                <div>
                  <p className="font-medium">{g.title}</p>
                  <p className="text-sm text-neutral-500">
                    {g.talent_name} · {g.scope_project} ·{" "}
                    {(JSON.parse(g.scope_platforms) as string[]).join(", ")} · until{" "}
                    {g.expires_at.slice(0, 10)}
                  </p>
                  <p className="font-mono text-xs text-neutral-400">{g.id}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Pill label={g.status} />
                  {isTalent && g.status === "requested" && (
                    <>
                      <DecisionButton grantId={g.id} action="approve" label="Approve"
                        cls="bg-black text-white" />
                      <DecisionButton grantId={g.id} action="deny" label="Deny"
                        cls="border border-neutral-300" />
                    </>
                  )}
                  {isTalent && g.status === "active" && (
                    <DecisionButton grantId={g.id} action="revoke" label="Revoke"
                      cls="border border-red-300 text-red-700" />
                  )}
                </div>
              </li>
            ))}
          </ul>
        </Section>

        <Section title={isTalent ? "Where your likeness was used" : "Consent receipts"}>
          {receipts.length === 0 && <p className="text-sm text-neutral-400">No checks yet.</p>}
          <table className="w-full text-sm">
            <tbody className="divide-y divide-neutral-100">
              {receipts.map((r) => (
                <tr key={r.id}>
                  <td className="py-2 pr-3"><Pill label={r.result} /></td>
                  <td className="py-2 pr-3">{r.action} · {r.platform}</td>
                  <td className="py-2 pr-3 text-neutral-500">{r.reason}</td>
                  <td className="py-2 pr-3 font-mono text-xs text-neutral-400">
                    sig {r.signature.slice(0, 12)}…
                  </td>
                  <td className="py-2 font-mono text-xs text-neutral-400">{r.created_at.slice(0, 19)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Section>
      </div>
    </main>
  );
}

function DecisionButton({ grantId, action, label, cls }: {
  grantId: string; action: string; label: string; cls: string;
}) {
  return (
    <form method="POST" action="/api/grants/decision">
      <input type="hidden" name="grant_id" value={grantId} />
      <input type="hidden" name="action" value={action} />
      <button className={`rounded-lg px-3 py-1.5 text-sm ${cls}`}>{label}</button>
    </form>
  );
}

function StudioPanels({ orgId }: { orgId: string }) {
  const talent = db.prepare(
    "SELECT id, name, email FROM members WHERE org_id = ? AND role = 'talent'"
  ).all(orgId) as { id: string; name: string; email: string }[];
  const invites = db.prepare(
    "SELECT token, email, role FROM invites WHERE org_id = ? AND status = 'pending'"
  ).all(orgId) as { token: string; email: string; role: string }[];

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Section title="Request a grant">
        {talent.length === 0 ? (
          <p className="text-sm text-neutral-400">Invite talent first.</p>
        ) : (
          <form method="POST" action="/api/grants" className="space-y-3 text-sm">
            <select name="talent_member_id" className="w-full rounded-lg border border-neutral-300 px-3 py-2">
              {talent.map((t) => <option key={t.id} value={t.id}>{t.name} ({t.email})</option>)}
            </select>
            <input name="title" required placeholder="Grant title (e.g. Lead role, S1)"
              className="w-full rounded-lg border border-neutral-300 px-3 py-2" />
            <input name="project" required placeholder="Project (e.g. Billionaire's Regret)"
              className="w-full rounded-lg border border-neutral-300 px-3 py-2" />
            <div className="flex flex-wrap gap-3">
              {["dramabox", "reelshort", "tiktok", "youtube"].map((p) => (
                <label key={p} className="flex items-center gap-1.5">
                  <input type="checkbox" name="platforms" value={p} /> {p}
                </label>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <input name="days" type="number" defaultValue={90}
                className="w-24 rounded-lg border border-neutral-300 px-3 py-2" />
              <span className="text-neutral-500">days</span>
              <button className="ml-auto rounded-lg bg-black px-4 py-2 text-white">Request</button>
            </div>
          </form>
        )}
      </Section>

      <Section title="Team & API">
        <form method="POST" action="/api/invites" className="flex gap-2 text-sm">
          <input name="email" type="email" required placeholder="email"
            className="flex-1 rounded-lg border border-neutral-300 px-3 py-2" />
          <select name="role" className="rounded-lg border border-neutral-300 px-2">
            <option value="talent">talent</option>
            <option value="producer">producer</option>
          </select>
          <button className="rounded-lg bg-black px-4 py-2 text-white">Invite</button>
        </form>
        <ul className="mt-3 space-y-1 text-xs text-neutral-500">
          {invites.map((i) => (
            <li key={i.token} className="font-mono">
              {i.email} ({i.role}): /invite/{i.token}
            </li>
          ))}
        </ul>
        <form method="POST" action="/api/keys" className="mt-4">
          <button className="rounded-lg border border-neutral-300 px-4 py-2 text-sm">
            Mint API key
          </button>
        </form>
      </Section>
    </div>
  );
}
