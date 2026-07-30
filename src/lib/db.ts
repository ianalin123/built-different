import Database from "better-sqlite3";
import { mkdirSync } from "node:fs";
import path from "node:path";

const dbDir = process.env.VERCEL ? "/tmp" : path.join(process.cwd(), "data");
mkdirSync(dbDir, { recursive: true });

export const db = new Database(path.join(dbDir, "cameo.db"));
db.pragma("journal_mode = WAL");

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
  scope_project TEXT NOT NULL, expires_at TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'requested'
    CHECK (status IN ('requested','active','denied','revoked')),
  created_by_sub TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  decided_at TEXT, revoked_at TEXT
);
CREATE TABLE IF NOT EXISTS receipts (
  id TEXT PRIMARY KEY, grant_id TEXT NOT NULL, org_id TEXT NOT NULL,
  action TEXT NOT NULL, platform TEXT NOT NULL,
  result TEXT NOT NULL CHECK (result IN ('allowed','denied')),
  reason TEXT NOT NULL, signature TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS api_keys (
  id TEXT PRIMARY KEY, org_id TEXT NOT NULL REFERENCES orgs(id),
  key_hash TEXT NOT NULL UNIQUE, prefix TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
`);

export type Membership = {
  id: string; org_id: string; auth0_sub: string; email: string;
  name: string; role: "owner" | "producer" | "talent";
  org_name: string; org_slug: string; plan: string;
  stripe_subscription_id: string | null;
};

export function getMembership(sub: string): Membership | undefined {
  return db.prepare(`
    SELECT m.*, o.name AS org_name, o.slug AS org_slug, o.plan,
           o.stripe_subscription_id
    FROM members m JOIN orgs o ON o.id = m.org_id
    WHERE m.auth0_sub = ? ORDER BY m.created_at LIMIT 1
  `).get(sub) as Membership | undefined;
}
