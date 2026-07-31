import Link from "next/link";
import { auth0 } from "@/lib/auth0";
import { getMembership } from "@/lib/db";
import { Badge } from "@/components/ui";
import { SidebarNav } from "@/components/sidebar-nav";

const STUDIO_NAV = [
  { href: "/dashboard", label: "Overview" },
  { href: "/dashboard/grants", label: "Grants" },
  { href: "/dashboard/team", label: "Team" },
  { href: "/dashboard/developers", label: "Developers" },
];

const TALENT_NAV = [
  { href: "/dashboard", label: "Inbox" },
  { href: "/dashboard/grants", label: "My grants" },
  { href: "/dashboard/usage", label: "Usage" },
];

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth0.getSession();
  if (!session) return null; // proxy redirects unauthenticated users
  const m = getMembership(session.user.sub);

  if (!m) return <>{children}</>;

  const isTalent = m.role === "talent";

  return (
    <div className="flex min-h-screen flex-col bg-cream text-ink">
      <div className="no-print border-b border-hay/25 bg-hay-bg py-1.5 text-center font-mono text-[11px] font-medium uppercase tracking-[0.1em] text-hay">
        Sandbox — consent records are not legally binding
      </div>
      <div className="flex flex-1">
        <aside className="no-print flex w-56 shrink-0 flex-col border-r border-line bg-cream px-3 py-5">
          <Link href="/" className="mb-6 px-2 text-lg font-extrabold tracking-[-0.02em] text-ink">
            cameo<span className="text-accent">.</span>
          </Link>
          <SidebarNav items={isTalent ? TALENT_NAV : STUDIO_NAV} />
          <div className="mt-auto space-y-3 border-t border-line px-2 pt-4">
            {!isTalent && m.plan === "free" && (
              <form method="POST" action="/api/checkout">
                <button className="w-full rounded-[10px] bg-accent px-3 py-2 text-[13px] font-bold text-white transition hover:bg-accent-dark hover:shadow-[0_4px_16px_rgba(124,111,247,0.35)]">
                  Upgrade to Pro
                </button>
              </form>
            )}
            <div className="flex items-center justify-between">
              <div className="min-w-0">
                <p className="truncate text-[13px] font-semibold text-ink">{m.org_name}</p>
                <p className="truncate text-xs text-ink-3">{session.user.email}</p>
              </div>
              <Badge status={m.plan === "pro" ? "pro" : "free"} />
            </div>
            <a
              href="/auth/logout"
              className="block text-xs text-ink-3 hover:text-ink"
            >
              Log out
            </a>
          </div>
        </aside>
        <main className="min-w-0 flex-1 overflow-auto">
          <div className="mx-auto max-w-5xl px-8 py-8">{children}</div>
        </main>
      </div>
    </div>
  );
}
