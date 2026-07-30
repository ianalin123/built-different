import { auth0 } from "@/lib/auth0";
import { db, getMembership } from "@/lib/db";
import {
  Badge, Card, CardTable, EmptyState, PageHeader, btnPrimary, inputCls,
} from "@/components/ui";
import { CopyField } from "@/components/copy-field";

type MemberRow = { id: string; name: string; email: string; role: string; created_at: string };
type InviteRow = { token: string; email: string; role: string };

export default async function TeamPage() {
  const session = await auth0.getSession();
  if (!session) return null;
  const m = getMembership(session.user.sub);
  if (!m || m.role === "talent") return null;

  const members = db.prepare(
    "SELECT id, name, email, role, created_at FROM members WHERE org_id = ? ORDER BY created_at"
  ).all(m.org_id) as MemberRow[];
  const invites = db.prepare(
    "SELECT token, email, role FROM invites WHERE org_id = ? AND status = 'pending' ORDER BY created_at DESC"
  ).all(m.org_id) as InviteRow[];
  const base = process.env.APP_BASE_URL ?? "http://localhost:3000";

  return (
    <>
      <PageHeader
        title="Team"
        description="Producers request clearance; rights holders grant it. Invites are share-links — no emails are sent."
      />

      <CardTable headers={["Name", "Email", "Role", "Identity", "Joined"]}>
        {members.map((mem) => (
          <tr key={mem.id}>
            <td className="px-4 py-3 text-[13px] font-medium text-zinc-900">{mem.name}</td>
            <td className="px-4 py-3 text-[13px] text-zinc-500">{mem.email}</td>
            <td className="px-4 py-3">
              <Badge status={mem.role === "talent" ? "active" : "pending"} />
              <span className="ml-1.5 text-[13px] text-zinc-600">
                {mem.role === "talent" ? "rights holder" : mem.role}
              </span>
            </td>
            <td className="px-4 py-3 text-[13px] text-emerald-700">✓ Auth0 verified</td>
            <td className="px-4 py-3 text-[13px] tabular-nums text-zinc-500">
              {mem.created_at.slice(0, 10)}
            </td>
          </tr>
        ))}
      </CardTable>

      <div className="mt-6 grid gap-6 md:grid-cols-2">
        <Card title="Invite">
          <form method="POST" action="/api/invites" className="flex gap-2">
            <input name="email" type="email" required placeholder="email"
              className={`flex-1 ${inputCls}`} />
            <select name="role" className={inputCls}>
              <option value="talent">rights holder</option>
              <option value="producer">producer</option>
            </select>
            <button className={btnPrimary}>Create invite</button>
          </form>
          <p className="mt-3 text-xs text-zinc-500">
            Creates a share-link below. Send it however you like — Cameo never emails
            your roster.
          </p>
        </Card>

        <Card title="Pending invites">
          {invites.length === 0 ? (
            <EmptyState icon="⌁" title="No pending invites"
              body="Invite links you create appear here until they are accepted." />
          ) : (
            <ul className="space-y-2">
              {invites.map((i) => (
                <li key={i.token}>
                  <p className="mb-1 text-xs text-zinc-500">
                    {i.email} · {i.role === "talent" ? "rights holder" : i.role}
                  </p>
                  <CopyField value={`${base}/invite/${i.token}`}
                    display={`/invite/${i.token.slice(0, 12)}…`} />
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </>
  );
}
