import Database from "better-sqlite3";
import { mkdirSync } from "node:fs";
import path from "node:path";

const dbDir = process.env.VERCEL ? "/tmp" : path.join(process.cwd(), "data");
mkdirSync(dbDir, { recursive: true });

export const db = new Database(path.join(dbDir, "cameo.db"));
db.pragma("journal_mode = WAL");

const SCHEMA_VERSION = 2;
if ((db.pragma("user_version", { simple: true }) as number) < SCHEMA_VERSION) {
  db.exec(`
    DROP TABLE IF EXISTS grants;
    DROP TABLE IF EXISTS receipts;
    DROP TABLE IF EXISTS api_keys;
    DROP TABLE IF EXISTS events;
  `);
  db.pragma(`user_version = ${SCHEMA_VERSION}`);
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
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_events_org ON events(org_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_events_grant ON events(grant_id, created_at);
`);

export type Membership = {
  id: string; org_id: string; auth0_sub: string; email: string;
  name: string; role: "owner" | "producer" | "talent";
  org_name: string; org_slug: string; plan: string;
  stripe_subscription_id: string | null;
};

export type Grant = {
  id: string; org_id: string; talent_member_id: string; title: string;
  scope_platforms: string; scope_project: string; restrictions: string;
  expires_at: string; status: "pending" | "active" | "declined" | "revoked" | "expired";
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

export function logEvent(e: {
  org_id: string; grant_id?: string | null;
  actor_type: "member" | "api_key" | "system"; actor_label: string;
  type: string; meta?: Record<string, unknown>;
}): void {
  db.prepare(`
    INSERT INTO events (id, org_id, grant_id, actor_type, actor_label, type, meta, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    crypto.randomUUID(), e.org_id, e.grant_id ?? null, e.actor_type,
    e.actor_label, e.type, JSON.stringify(e.meta ?? {}), new Date().toISOString()
  );
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
