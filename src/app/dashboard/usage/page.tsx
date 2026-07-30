import Link from "next/link";
import { auth0 } from "@/lib/auth0";
import { db, getMembership } from "@/lib/db";
import { Badge, CardTable, EmptyState, PageHeader } from "@/components/ui";

type UsageRow = {
  id: string; grant_id: string; action: string; platform: string;
  result: string; reason_code: string; created_at: string;
  title: string; scope_project: string;
};

export default async function UsagePage() {
  const session = await auth0.getSession();
  if (!session) return null;
  const m = getMembership(session.user.sub);
  if (!m || m.role !== "talent") return null;

  const rows = db.prepare(`
    SELECT r.id, r.grant_id, r.action, r.platform, r.result, r.reason_code,
           r.created_at, g.title, g.scope_project
    FROM receipts r JOIN grants g ON g.id = r.grant_id
    WHERE g.talent_member_id = ?
    ORDER BY r.created_at DESC LIMIT 100
  `).all(m.id) as UsageRow[];

  return (
    <>
      <PageHeader
        title="Usage"
        description="Every time a render pipeline checked a license to your likeness — allowed or denied."
      />
      {rows.length === 0 ? (
        <EmptyState
          icon="◉"
          title="No render checks yet"
          body="When a studio's pipeline verifies a grant to your likeness, the signed receipt appears here — you see every use of your face."
        />
      ) : (
        <CardTable headers={["Result", "Project", "Use", "Reason", "Time"]}>
          {rows.map((r) => (
            <tr key={r.id}>
              <td className="px-4 py-2.5"><Badge status={r.result} /></td>
              <td className="px-4 py-2.5">
                <Link href={`/dashboard/grants/${r.grant_id}`}
                  className="text-[13px] font-medium text-zinc-900 hover:underline">
                  {r.scope_project}
                </Link>
                <p className="text-xs text-zinc-500">{r.title}</p>
              </td>
              <td className="px-4 py-2.5 text-[13px] text-zinc-600">
                {r.action} · {r.platform}
              </td>
              <td className="px-4 py-2.5 font-mono text-[11px] text-zinc-500">{r.reason_code}</td>
              <td className="px-4 py-2.5 text-[13px] tabular-nums text-zinc-500">
                {r.created_at.slice(0, 19).replace("T", " ")}
              </td>
            </tr>
          ))}
        </CardTable>
      )}
    </>
  );
}
