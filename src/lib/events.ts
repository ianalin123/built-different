export type EventRow = {
  id: string; grant_id: string | null; actor_type: string; actor_label: string;
  type: string; meta: string; prev_hash: string | null; hash: string | null;
  created_at: string;
};

const EVENT_TITLES: Record<string, (meta: Record<string, string>) => string> = {
  "org.created": (m) => `Studio "${m.name}" created`,
  "invite.created": (m) => `Invited ${m.email} as ${m.role === "talent" ? "rights holder" : m.role}`,
  "invite.accepted": (m) => `Joined as ${m.role === "talent" ? "rights holder" : m.role}`,
  "grant.requested": (m) => `Requested license grant · ${m.project}`,
  "grant.granted": () => "License grant approved",
  "grant.declined": () => "License grant declined",
  "grant.revoked": () => "License grant revoked",
  "grant.expired": () => "License grant expired",
  "check.allowed": (m) => `Render check allowed · ${m.platform}`,
  "check.denied": (m) => `Render check denied · ${m.reason_code}`,
  "key.created": (m) => `API key minted (${m.mode})`,
  "listing.published": (m) => `Marketplace listing published · "${m.headline}"`,
  "listing.unlisted": () => "Marketplace listing unlisted",
};

export function eventTitle(e: EventRow): string {
  const meta = JSON.parse(e.meta) as Record<string, string>;
  return EVENT_TITLES[e.type]?.(meta) ?? e.type;
}

export function daysUntil(iso: string): number {
  return Math.max(0, Math.ceil((new Date(iso).getTime() - Date.now()) / 86400_000));
}
