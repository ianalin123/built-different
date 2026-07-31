import Link from "next/link";
import { auth0 } from "@/lib/auth0";
import { db, getMembership } from "@/lib/db";
import {
  Badge, Card, CardTable, EmptyState, PageHeader, btnPrimary, inputCls,
} from "@/components/ui";
import { CopyField } from "@/components/copy-field";

type KeyRow = {
  id: string; prefix: string; mode: string; label: string;
  last_used_at: string | null; created_at: string;
};
type ReceiptRow = {
  id: string; grant_id: string; action: string; platform: string;
  result: string; reason_code: string; signature: string; created_at: string;
};

function relativeTime(iso: string | null): string {
  if (!iso) return "never";
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

export default async function DevelopersPage({
  searchParams,
}: {
  searchParams: Promise<{ new_key?: string }>;
}) {
  const { new_key } = await searchParams;
  const session = await auth0.getSession();
  if (!session) return null;
  const m = getMembership(session.user.sub);
  if (!m || m.role === "talent") return null;

  const keys = db.prepare(
    "SELECT id, prefix, mode, label, last_used_at, created_at FROM api_keys WHERE org_id = ? ORDER BY created_at DESC"
  ).all(m.org_id) as KeyRow[];
  const receipts = db.prepare(
    "SELECT * FROM receipts WHERE org_id = ? ORDER BY created_at DESC LIMIT 50"
  ).all(m.org_id) as ReceiptRow[];

  return (
    <>
      <PageHeader
        title="Developers"
        description="Machine identities for your render pipeline, and the log of every verification decision."
        action={
          <Link href="/docs" className="text-[13px] text-ink-2 underline hover:text-ink">
            API reference →
          </Link>
        }
      />

      {new_key && (
        <div className="mb-6 rounded-lg border border-grass/25 bg-grass-bg p-4">
          <p className="text-sm font-medium text-grass">
            API key created — copy it now. This key is shown once.
          </p>
          <div className="mt-2">
            <CopyField value={new_key} />
          </div>
        </div>
      )}

      {keys.length === 0 ? (
        <EmptyState
          icon="⚿"
          title="No API keys"
          body="Mint a key below, then call POST /api/v1/check from your render pipeline. Test-mode keys work identically and keep demo traffic separate."
        />
      ) : (
        <CardTable headers={["Label", "Key", "Mode", "Created", "Last used"]}>
          {keys.map((k) => (
            <tr key={k.id}>
              <td className="px-4 py-3 text-[13px] font-medium text-ink">{k.label}</td>
              <td className="px-4 py-3 font-mono text-xs text-ink-3">
                {k.prefix.replace("…", "••••")}
              </td>
              <td className="px-4 py-3"><Badge status={k.mode} /></td>
              <td className="px-4 py-3 text-[13px] tabular-nums text-ink-3">
                {k.created_at.slice(0, 10)}
              </td>
              <td className="px-4 py-3 text-[13px] tabular-nums text-ink-3">
                {relativeTime(k.last_used_at)}
              </td>
            </tr>
          ))}
        </CardTable>
      )}

      <div className="mt-4">
        <Card title="Mint a key">
          <form method="POST" action="/api/keys" className="flex gap-2">
            <input name="label" placeholder="Label (e.g. render-pipeline)"
              className={`flex-1 ${inputCls}`} />
            <select name="mode" className={inputCls}>
              <option value="live">live</option>
              <option value="test">test</option>
            </select>
            <button className={btnPrimary}>Mint API key</button>
          </form>
        </Card>
      </div>

      <div className="mt-6">
        <h2 className="mb-3 text-xs font-medium uppercase tracking-wider text-ink-3">
          Request log
        </h2>
        {receipts.length === 0 ? (
          <EmptyState
            icon="⇄"
            title="No verification checks yet"
            body="Every POST /api/v1/check — allowed or denied — is receipted here with its signature."
            action={
              <code className="block rounded-md bg-cream-2 px-3 py-2 text-left font-mono text-[11px] text-ink-2">
                curl -X POST /api/v1/check -H &quot;Authorization: Bearer cam_live_…&quot; \<br />
                &nbsp;&nbsp;-d &apos;{"{"}&quot;grant_id&quot;:&quot;…&quot;,&quot;platform&quot;:&quot;dramabox&quot;,&quot;action&quot;:&quot;render&quot;{"}"}&apos;
              </code>
            }
          />
        ) : (
          <CardTable headers={["Result", "Reason", "Grant", "Request", "Signature", "Time"]}>
            {receipts.map((r) => (
              <tr key={r.id}>
                <td className="px-4 py-2.5"><Badge status={r.result} /></td>
                <td className="px-4 py-2.5 font-mono text-[11px] text-ink-2">{r.reason_code}</td>
                <td className="px-4 py-2.5">
                  <Link href={`/dashboard/grants/${r.grant_id}`}
                    className="font-mono text-[11px] text-ink-3 hover:text-ink hover:underline">
                    {r.grant_id.slice(0, 8)}…
                  </Link>
                </td>
                <td className="px-4 py-2.5 text-[13px] text-ink-2">
                  {r.action} · {r.platform}
                </td>
                <td className="px-4 py-2.5 font-mono text-[11px] text-ink-3">
                  {r.signature.slice(0, 12)}…
                </td>
                <td className="px-4 py-2.5 text-[13px] tabular-nums text-ink-3">
                  {r.created_at.slice(5, 19).replace("T", " ")}
                </td>
              </tr>
            ))}
          </CardTable>
        )}
      </div>
    </>
  );
}
