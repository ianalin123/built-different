import type { ReactNode } from "react";

const STATUS_TINT: Record<string, string> = {
  pending: "bg-amber-50 text-amber-700 border-amber-200",
  active: "bg-emerald-50 text-emerald-700 border-emerald-200",
  allowed: "bg-emerald-50 text-emerald-700 border-emerald-200",
  live: "bg-emerald-50 text-emerald-700 border-emerald-200",
  pro: "bg-emerald-50 text-emerald-700 border-emerald-200",
  declined: "bg-red-50 text-red-700 border-red-200",
  denied: "bg-red-50 text-red-700 border-red-200",
  revoked: "bg-zinc-100 text-zinc-600 border-zinc-200",
  expired: "bg-zinc-100 text-zinc-600 border-zinc-200",
  test: "bg-zinc-100 text-zinc-600 border-zinc-200",
  free: "bg-zinc-100 text-zinc-600 border-zinc-200",
  "rights holder": "bg-emerald-50 text-emerald-700 border-emerald-200",
  owner: "bg-amber-50 text-amber-700 border-amber-200",
  producer: "bg-zinc-100 text-zinc-600 border-zinc-200",
};

export function Badge({ status }: { status: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs font-medium ${
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
    <span className="inline-flex items-center rounded-md border border-zinc-200 bg-zinc-50 px-1.5 py-0.5 text-xs font-medium text-zinc-600">
      {children}
    </span>
  );
}

export const btnPrimary =
  "inline-flex items-center gap-1.5 rounded-md bg-zinc-900 px-3 py-1.5 text-[13px] font-medium text-white shadow-sm hover:bg-zinc-800 focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2";
export const btnSecondary =
  "inline-flex items-center gap-1.5 rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-[13px] font-medium text-zinc-700 shadow-sm hover:bg-zinc-50";
export const btnDanger =
  "inline-flex items-center gap-1.5 rounded-md border border-red-200 bg-white px-3 py-1.5 text-[13px] font-medium text-red-700 shadow-sm hover:bg-red-50";
export const inputCls =
  "rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-[13px] text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-400 focus:outline-none";

export function PageHeader({
  title, description, action,
}: { title: string; description?: string; action?: ReactNode }) {
  return (
    <div className="mb-6 flex items-end justify-between border-b border-zinc-200 pb-4">
      <div>
        <h1 className="text-xl font-semibold tracking-[-0.01em] text-zinc-900">{title}</h1>
        {description && <p className="mt-1 text-sm text-zinc-500">{description}</p>}
      </div>
      {action}
    </div>
  );
}

export function Card({
  title, children, className = "",
}: { title?: string; children: ReactNode; className?: string }) {
  return (
    <section className={`rounded-lg border border-zinc-200 bg-white ${className}`}>
      {title && (
        <h2 className="border-b border-zinc-100 px-4 py-3 text-xs font-medium uppercase tracking-wider text-zinc-500">
          {title}
        </h2>
      )}
      <div className="p-4">{children}</div>
    </section>
  );
}

export function CardTable({
  headers, children,
}: { headers: string[]; children: ReactNode }) {
  return (
    <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white">
      <table className="w-full">
        <thead>
          <tr className="border-b border-zinc-200 bg-zinc-50 text-left">
            {headers.map((h) => (
              <th key={h} className="px-4 py-2.5 text-xs font-medium text-zinc-500">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-100">{children}</tbody>
      </table>
    </div>
  );
}

export function EmptyState({
  icon, title, body, action,
}: { icon: string; title: string; body: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-zinc-300 py-16 text-center">
      <div className="flex size-10 items-center justify-center rounded-lg bg-zinc-100 text-base text-zinc-400">
        {icon}
      </div>
      <p className="mt-3 text-sm font-medium text-zinc-900">{title}</p>
      <p className="mt-1 max-w-sm text-sm text-zinc-500">{body}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function KV({ rows }: { rows: [string, ReactNode][] }) {
  return (
    <dl className="divide-y divide-zinc-100">
      {rows.map(([k, v]) => (
        <div key={k} className="grid grid-cols-[160px_1fr] items-baseline py-2.5">
          <dt className="text-[13px] text-zinc-500">{k}</dt>
          <dd className="text-[13px] text-zinc-900">{v}</dd>
        </div>
      ))}
    </dl>
  );
}

const EVENT_TONE: Record<string, string> = {
  "grant.granted": "bg-emerald-500",
  "check.allowed": "bg-emerald-500",
  "invite.accepted": "bg-emerald-500",
  "grant.requested": "bg-amber-400",
  "invite.created": "bg-amber-400",
  "grant.declined": "bg-red-500",
  "check.denied": "bg-red-500",
  "grant.revoked": "bg-red-500",
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
        last ? "" : "pb-6 before:absolute before:bottom-0 before:left-[5px] before:top-5 before:w-px before:bg-zinc-200"
      }`}
    >
      <span
        className={`absolute left-0 top-1.5 size-2.5 rounded-full border-2 border-white ring-1 ring-zinc-200 ${
          EVENT_TONE[type] ?? "bg-zinc-400"
        }`}
      />
      <p className="text-[13px] text-zinc-900">{title}</p>
      <p className="mt-0.5 text-xs tabular-nums text-zinc-500">
        {actor} · {timestamp}
      </p>
      {hash && (
        <p className="mt-0.5 truncate font-mono text-[11px] text-zinc-400">sig {hash}</p>
      )}
    </li>
  );
}

export function StatCard({
  label, value, sub,
}: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-4">
      <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">{label}</p>
      <p className="mt-2 text-2xl font-semibold tabular-nums tracking-[-0.01em] text-zinc-900">
        {value}
      </p>
      {sub && <p className="mt-1 text-xs tabular-nums text-zinc-500">{sub}</p>}
    </div>
  );
}
