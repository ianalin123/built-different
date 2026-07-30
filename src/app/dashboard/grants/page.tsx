import Link from "next/link";
import { auth0 } from "@/lib/auth0";
import { db, getMembership, resolveGrantStatus, type Grant } from "@/lib/db";
import {
  Badge, Card, CardTable, Chip, EmptyState, PageHeader, btnPrimary, inputCls,
} from "@/components/ui";
import { daysUntil } from "@/lib/events";

const PLATFORMS = ["dramabox", "reelshort", "tiktok", "youtube"];
const RESTRICTIONS: [string, string][] = [
  ["political", "No political"],
  ["medical", "No medical"],
  ["sexual_content", "No sexual content"],
  ["endorsement", "No endorsements"],
];

type GrantRow = Grant & { talent_name: string; checks: number };

export default async function GrantsPage() {
  const session = await auth0.getSession();
  if (!session) return null;
  const m = getMembership(session.user.sub);
  if (!m) return null;
  const isTalent = m.role === "talent";

  const grants = (db.prepare(`
    SELECT g.*, mem.name AS talent_name,
      (SELECT COUNT(*) FROM receipts r WHERE r.grant_id = g.id) AS checks
    FROM grants g JOIN members mem ON mem.id = g.talent_member_id
    WHERE ${isTalent ? "g.talent_member_id = ?" : "g.org_id = ?"}
    ORDER BY g.created_at DESC
  `).all(isTalent ? m.id : m.org_id) as GrantRow[])
    .map((g) => ({ ...g, status: resolveGrantStatus(g) }));

  const talent = isTalent
    ? []
    : (db.prepare(
        "SELECT id, name, email FROM members WHERE org_id = ? AND role = 'talent'"
      ).all(m.org_id) as { id: string; name: string; email: string }[]);

  return (
    <>
      <PageHeader
        title={isTalent ? "My grants" : "Grants"}
        description={
          isTalent
            ? "Every license you have granted, declined, or revoked."
            : "License grants across your roster — scope, term, and verification activity."
        }
      />

      {grants.length === 0 ? (
        <EmptyState
          icon="§"
          title="No license grants yet"
          body={
            isTalent
              ? "Clearance requests you receive will appear here after you decide on them."
              : "Request clearance from a rights holder below. They grant or decline from their inbox."
          }
        />
      ) : (
        <CardTable
          headers={["Grant", "Rights holder", "Scope", "Term", "Status", "Checks"]}
        >
          {grants.map((g) => (
            <tr key={g.id} className="hover:bg-zinc-50">
              <td className="px-4 py-3">
                <Link href={`/dashboard/grants/${g.id}`}
                  className="text-[13px] font-medium text-zinc-900 hover:underline">
                  {g.title}
                </Link>
                <p className="text-xs text-zinc-500">{g.scope_project}</p>
              </td>
              <td className="px-4 py-3 text-[13px] text-zinc-700">{g.talent_name}</td>
              <td className="px-4 py-3">
                <div className="flex flex-wrap gap-1">
                  {(JSON.parse(g.scope_platforms) as string[]).map((p) => (
                    <Chip key={p}>{p}</Chip>
                  ))}
                </div>
              </td>
              <td className="px-4 py-3 text-[13px] tabular-nums text-zinc-500">
                {g.status === "expired" ? "Expired" : `${daysUntil(g.expires_at)}d left`}
              </td>
              <td className="px-4 py-3"><Badge status={g.status} /></td>
              <td className="px-4 py-3 text-[13px] tabular-nums text-zinc-500">{g.checks}</td>
            </tr>
          ))}
        </CardTable>
      )}

      {!isTalent && (
        <div className="mt-6">
          <Card title="Request clearance">
            {talent.length === 0 ? (
              <p className="text-sm text-zinc-500">
                No rights holders on your roster yet —{" "}
                <Link href="/dashboard/team" className="underline hover:text-zinc-900">
                  invite one from Team
                </Link>
                .
              </p>
            ) : (
              <form method="POST" action="/api/grants" className="space-y-4 text-sm">
                <div className="grid gap-3 md:grid-cols-3">
                  <select name="talent_member_id" className={inputCls}>
                    {talent.map((t) => (
                      <option key={t.id} value={t.id}>{t.name} ({t.email})</option>
                    ))}
                  </select>
                  <input name="title" required placeholder="Grant title (e.g. Lead role, S1)"
                    className={inputCls} />
                  <input name="project" required placeholder="Project (e.g. Billionaire's Regret)"
                    className={inputCls} />
                </div>
                <div className="flex flex-wrap items-center gap-4">
                  <span className="text-xs font-medium uppercase tracking-wider text-zinc-500">
                    Platforms
                  </span>
                  {PLATFORMS.map((p) => (
                    <label key={p} className="flex items-center gap-1.5 text-[13px] text-zinc-700">
                      <input type="checkbox" name="platforms" value={p} /> {p}
                    </label>
                  ))}
                </div>
                <div className="flex flex-wrap items-center gap-4">
                  <span className="text-xs font-medium uppercase tracking-wider text-zinc-500">
                    Restrictions
                  </span>
                  {RESTRICTIONS.map(([value, label]) => (
                    <label key={value} className="flex items-center gap-1.5 text-[13px] text-zinc-700">
                      <input type="checkbox" name="restrictions" value={value} /> {label}
                    </label>
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <input name="days" type="number" defaultValue={90} className={`w-24 ${inputCls}`} />
                  <span className="text-[13px] text-zinc-500">day term</span>
                  <button className={`ml-auto ${btnPrimary}`}>Send clearance request</button>
                </div>
              </form>
            )}
          </Card>
        </div>
      )}
    </>
  );
}
