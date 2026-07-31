import Database from "better-sqlite3";
import { createHash } from "node:crypto";
import { mkdirSync } from "node:fs";
import path from "node:path";

const dbDir = process.env.VERCEL ? "/tmp" : path.join(process.cwd(), "data");
mkdirSync(dbDir, { recursive: true });

export const db = new Database(path.join(dbDir, "cameo.db"));
db.pragma("journal_mode = WAL");

const SCHEMA_VERSION = 3;
const version = db.pragma("user_version", { simple: true }) as number;
if (version < 2) {
  db.exec(`
    DROP TABLE IF EXISTS grants;
    DROP TABLE IF EXISTS receipts;
    DROP TABLE IF EXISTS api_keys;
    DROP TABLE IF EXISTS events;
  `);
}

db.exec(`
CREATE TABLE IF NOT EXISTS orgs (
  id TEXT PRIMARY KEY, name TEXT NOT NULL, slug TEXT NOT NULL UNIQUE,
  owner_sub TEXT NOT NULL, stripe_customer_id TEXT, stripe_subscription_id TEXT,
  plan TEXT NOT NULL DEFAULT 'free', created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS members (
  id TEXT PRIMARY KEY, org_id TEXT NOT NULL REFERENCES orgs(id),
  auth0_sub TEXT NOT NULL, email TEXT NOT NULL, name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('owner','producer','talent')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(org_id, auth0_sub)
);
CREATE TABLE IF NOT EXISTS invites (
  id TEXT PRIMARY KEY, org_id TEXT NOT NULL REFERENCES orgs(id),
  email TEXT NOT NULL, role TEXT NOT NULL CHECK (role IN ('producer','talent')),
  token TEXT NOT NULL UNIQUE, status TEXT NOT NULL DEFAULT 'pending',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS grants (
  id TEXT PRIMARY KEY, org_id TEXT NOT NULL REFERENCES orgs(id),
  talent_member_id TEXT NOT NULL REFERENCES members(id),
  title TEXT NOT NULL, scope_platforms TEXT NOT NULL,
  scope_project TEXT NOT NULL, restrictions TEXT NOT NULL DEFAULT '[]',
  expires_at TEXT NOT NULL,
  max_renders INTEGER, renders_used INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','active','declined','revoked','expired')),
  created_by_sub TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  decided_at TEXT, revoked_at TEXT
);
CREATE TABLE IF NOT EXISTS receipts (
  id TEXT PRIMARY KEY, grant_id TEXT NOT NULL, org_id TEXT NOT NULL,
  action TEXT NOT NULL, platform TEXT NOT NULL,
  result TEXT NOT NULL CHECK (result IN ('allowed','denied')),
  reason TEXT NOT NULL, reason_code TEXT NOT NULL,
  valid_until TEXT, signature TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS api_keys (
  id TEXT PRIMARY KEY, org_id TEXT NOT NULL REFERENCES orgs(id),
  key_hash TEXT NOT NULL UNIQUE, prefix TEXT NOT NULL,
  mode TEXT NOT NULL DEFAULT 'live' CHECK (mode IN ('live','test')),
  label TEXT NOT NULL DEFAULT 'Default key', last_used_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS events (
  id TEXT PRIMARY KEY, org_id TEXT NOT NULL REFERENCES orgs(id),
  grant_id TEXT,
  actor_type TEXT NOT NULL CHECK (actor_type IN ('member','api_key','system')),
  actor_label TEXT NOT NULL, type TEXT NOT NULL, meta TEXT NOT NULL DEFAULT '{}',
  prev_hash TEXT, hash TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_events_org ON events(org_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_events_grant ON events(grant_id, created_at);
`);

const GENESIS_HASH = "0".repeat(64);

function eventHash(prevHash: string, e: {
  id: string; type: string; actor_label: string;
  grant_id: string | null; meta: string; created_at: string;
}): string {
  return createHash("sha256")
    .update(`${prevHash}.${e.id}.${e.type}.${e.actor_label}.${e.grant_id ?? ""}.${e.meta}.${e.created_at}`)
    .digest("hex");
}

if (version >= 2 && version < 3) {
  db.exec(`
    ALTER TABLE events ADD COLUMN prev_hash TEXT;
    ALTER TABLE events ADD COLUMN hash TEXT;
    ALTER TABLE grants ADD COLUMN max_renders INTEGER;
    ALTER TABLE grants ADD COLUMN renders_used INTEGER NOT NULL DEFAULT 0;
  `);
  const backfill = db.transaction(() => {
    const orgs = db.prepare("SELECT DISTINCT org_id FROM events").all() as { org_id: string }[];
    const update = db.prepare("UPDATE events SET prev_hash = ?, hash = ? WHERE id = ?");
    for (const { org_id } of orgs) {
      const rows = db.prepare(`
        SELECT id, type, actor_label, grant_id, meta, created_at
        FROM events WHERE org_id = ? ORDER BY created_at, rowid
      `).all(org_id) as {
        id: string; type: string; actor_label: string;
        grant_id: string | null; meta: string; created_at: string;
      }[];
      let prev = GENESIS_HASH;
      for (const row of rows) {
        const hash = eventHash(prev, row);
        update.run(prev, hash, row.id);
        prev = hash;
      }
    }
  });
  backfill();
}
if (version < SCHEMA_VERSION) db.pragma(`user_version = ${SCHEMA_VERSION}`);

export type Membership = {
  id: string; org_id: string; auth0_sub: string; email: string;
  name: string; role: "owner" | "producer" | "talent";
  org_name: string; org_slug: string; plan: string;
  stripe_subscription_id: string | null;
};

export type Grant = {
  id: string; org_id: string; talent_member_id: string; title: string;
  scope_platforms: string; scope_project: string; restrictions: string;
  expires_at: string; max_renders: number | null; renders_used: number;
  status: "pending" | "active" | "declined" | "revoked" | "expired";
  created_by_sub: string; created_at: string;
  decided_at: string | null; revoked_at: string | null;
};

export function getMembership(sub: string): Membership | undefined {
  return db.prepare(`
    SELECT m.*, o.name AS org_name, o.slug AS org_slug, o.plan,
           o.stripe_subscription_id
    FROM members m JOIN orgs o ON o.id = m.org_id
    WHERE m.auth0_sub = ? ORDER BY m.created_at LIMIT 1
  `).get(sub) as Membership | undefined;
}

const insertEvent = db.transaction((e: {
  org_id: string; grant_id: string | null;
  actor_type: "member" | "api_key" | "system"; actor_label: string;
  type: string; meta: string;
}) => {
  const last = db.prepare(`
    SELECT hash FROM events WHERE org_id = ?
    ORDER BY created_at DESC, rowid DESC LIMIT 1
  `).get(e.org_id) as { hash: string | null } | undefined;
  const prevHash = last?.hash ?? GENESIS_HASH;
  const row = {
    id: crypto.randomUUID(), type: e.type, actor_label: e.actor_label,
    grant_id: e.grant_id, meta: e.meta, created_at: new Date().toISOString(),
  };
  db.prepare(`
    INSERT INTO events (id, org_id, grant_id, actor_type, actor_label, type, meta, prev_hash, hash, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    row.id, e.org_id, e.grant_id, e.actor_type, e.actor_label,
    e.type, e.meta, prevHash, eventHash(prevHash, row), row.created_at
  );
});

export function logEvent(e: {
  org_id: string; grant_id?: string | null;
  actor_type: "member" | "api_key" | "system"; actor_label: string;
  type: string; meta?: Record<string, unknown>;
}): void {
  insertEvent({
    org_id: e.org_id, grant_id: e.grant_id ?? null, actor_type: e.actor_type,
    actor_label: e.actor_label, type: e.type, meta: JSON.stringify(e.meta ?? {}),
  });
}

export function verifyEventChain(orgId: string): { valid: boolean; brokenAt: string | null } {
  const rows = db.prepare(`
    SELECT id, type, actor_label, grant_id, meta, prev_hash, hash, created_at
    FROM events WHERE org_id = ? ORDER BY created_at, rowid
  `).all(orgId) as {
    id: string; type: string; actor_label: string; grant_id: string | null;
    meta: string; prev_hash: string | null; hash: string | null; created_at: string;
  }[];
  let prev = GENESIS_HASH;
  for (const row of rows) {
    if (row.prev_hash !== prev || row.hash !== eventHash(prev, row)) {
      return { valid: false, brokenAt: row.id };
    }
    prev = row.hash;
  }
  return { valid: true, brokenAt: null };
}

export function resolveGrantStatus(grant: Grant): Grant["status"] {
  if (grant.status === "active" && grant.expires_at < new Date().toISOString()) {
    db.prepare("UPDATE grants SET status = 'expired' WHERE id = ?").run(grant.id);
    logEvent({
      org_id: grant.org_id, grant_id: grant.id, actor_type: "system",
      actor_label: "cameo", type: "grant.expired",
    });
    return "expired";
  }
  return grant.status;
}
