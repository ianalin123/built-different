import type { ReactNode } from "react";

const STATUS_TINT: Record<string, string> = {
  pending: "bg-hay-bg text-hay border-hay/25",
  active: "bg-grass-bg text-grass border-grass/25",
  allowed: "bg-grass-bg text-grass border-grass/25",
  live: "bg-grass-bg text-grass border-grass/25",
  pro: "bg-accent-2 text-accent-dark border-accent/25",
  declined: "bg-rust-bg text-rust border-rust/25",
  denied: "bg-rust-bg text-rust border-rust/25",
  revoked: "bg-cream-2 text-ink-2 border-line",
  expired: "bg-cream-2 text-ink-2 border-line",
  test: "bg-cream-2 text-ink-2 border-line",
  free: "bg-cream-2 text-ink-2 border-line",
  "rights holder": "bg-accent-2 text-accent-dark border-accent/25",
  owner: "bg-hay-bg text-hay border-hay/25",
  producer: "bg-cream-2 text-ink-2 border-line",
};

export function Badge({ status }: { status: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${
        STATUS_TINT[status] ?? STATUS_TINT.revoked
      }`}
    >
      <span className="size-1.5 rounded-full bg-current opacity-70" />
      {status}
    </span>
  );
}

export function Chip({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-md border border-line bg-cream-2 px-1.5 py-0.5 font-mono text-[11px] font-medium text-ink-2">
      {children}
    </span>
  );
}

export const btnPrimary =
  "inline-flex items-center justify-center gap-1.5 rounded-[10px] bg-accent px-4 py-2 text-[13px] font-bold text-white transition hover:-translate-y-px hover:bg-accent-dark hover:shadow-[0_4px_16px_rgba(124,111,247,0.35)] focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2";
export const btnSecondary =
  "inline-flex items-center justify-center gap-1.5 rounded-[10px] border-[1.5px] border-line-2 bg-transparent px-4 py-2 text-[13px] font-semibold text-ink transition hover:border-ink-3 hover:bg-black/[0.02]";
export const btnDanger =
  "inline-flex items-center justify-center gap-1.5 rounded-[10px] border-[1.5px] border-rust/30 bg-transparent px-4 py-2 text-[13px] font-semibold text-rust transition hover:border-rust hover:bg-rust-bg/50";
export const inputCls =
  "rounded-[10px] border border-line-2 bg-white px-3 py-2 text-[13px] text-ink placeholder:text-ink-3 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20";

export function PageHeader({
  title, description, action,
}: { title: string; description?: string; action?: ReactNode }) {
  return (
    <div className="mb-6 flex items-end justify-between border-b border-line pb-5">
      <div>
        <h1 className="text-[22px] font-extrabold tracking-[-0.02em] text-ink">{title}</h1>
        {description && <p className="mt-1 text-sm text-ink-2">{description}</p>}
      </div>
      {action}
    </div>
  );
}

export function Card({
  title, children, className = "",
}: { title?: string; children: ReactNode; className?: string }) {
  return (
    <section
      className={`rounded-2xl border border-line bg-white shadow-[0_2px_12px_rgba(0,0,0,0.07)] ${className}`}
    >
      {title && (
        <h2 className="text-label border-b border-cream-2 px-5 py-3.5">{title}</h2>
      )}
      <div className="p-5">{children}</div>
    </section>
  );
}

export function CardTable({
  headers, children,
}: { headers: string[]; children: ReactNode }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-white shadow-[0_2px_12px_rgba(0,0,0,0.07)]">
      <table className="w-full">
        <thead>
          <tr className="border-b border-line bg-cream-2/60 text-left">
            {headers.map((h) => (
              <th key={h} className="text-label px-4 py-3">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-cream-2">{children}</tbody>
      </table>
    </div>
  );
}

export function EmptyState({
  icon, title, body, action,
}: { icon: string; title: string; body: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-line-2 py-16 text-center">
      <div className="flex size-10 items-center justify-center rounded-xl bg-accent-2 font-mono text-base text-accent-dark">
        {icon}
      </div>
      <p className="mt-3 text-sm font-bold text-ink">{title}</p>
      <p className="mt-1 max-w-sm text-sm text-ink-2">{body}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function KV({ rows }: { rows: [string, ReactNode][] }) {
  return (
    <dl className="divide-y divide-cream-2">
      {rows.map(([k, v]) => (
        <div key={k} className="grid grid-cols-[160px_1fr] items-baseline py-2.5">
          <dt className="text-[13px] text-ink-3">{k}</dt>
          <dd className="text-[13px] font-medium text-ink">{v}</dd>
        </div>
      ))}
    </dl>
  );
}

const EVENT_TONE: Record<string, string> = {
  "grant.granted": "bg-grass",
  "check.allowed": "bg-grass",
  "invite.accepted": "bg-grass",
  "grant.requested": "bg-hay",
  "invite.created": "bg-hay",
  "grant.declined": "bg-rust",
  "check.denied": "bg-rust",
  "grant.revoked": "bg-rust",
};

export function TimelineItem({
  title, actor, timestamp, hash, type, last = false,
}: {
  title: string; actor: string; timestamp: string; hash?: string;
  type: string; last?: boolean;
}) {
  return (
    <li
      className={`relative pl-6 ${
        last ? "" : "pb-6 before:absolute before:bottom-0 before:left-[5px] before:top-5 before:w-px before:bg-line"
      }`}
    >
      <span
        className={`absolute left-0 top-1.5 size-2.5 rounded-full border-2 border-white ring-1 ring-line ${
          EVENT_TONE[type] ?? "bg-ink-3"
        }`}
      />
      <p className="text-[13px] font-medium text-ink">{title}</p>
      <p className="mt-0.5 text-xs tabular-nums text-ink-3">
        {actor} · {timestamp}
      </p>
      {hash && (
        <p className="mt-0.5 truncate font-mono text-[11px] text-ink-3/80">sig {hash}</p>
      )}
    </li>
  );
}

export function StatCard({
  label, value, sub,
}: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-2xl border border-line bg-white p-5 shadow-[0_1px_4px_rgba(0,0,0,0.05)]">
      <p className="text-label">{label}</p>
      <p className="mt-2 text-[28px] font-extrabold tabular-nums tracking-[-0.02em] text-ink">
        {value}
      </p>
      {sub && <p className="mt-1 text-xs tabular-nums text-ink-3">{sub}</p>}
    </div>
  );
}
