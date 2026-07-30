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
    <div className="flex min-h-screen flex-col bg-zinc-50 text-zinc-900">
      <div className="no-print border-b border-amber-200 bg-amber-50 py-1.5 text-center text-xs font-medium text-amber-800">
        Sandbox — consent records are not legally binding
      </div>
      <div className="flex flex-1">
        <aside className="no-print flex w-56 shrink-0 flex-col border-r border-zinc-200 bg-zinc-50 px-3 py-4">
          <Link href="/" className="mb-6 px-2 font-semibold tracking-tight text-zinc-900">
            cameo
          </Link>
          <SidebarNav items={isTalent ? TALENT_NAV : STUDIO_NAV} />
          <div className="mt-auto space-y-3 border-t border-zinc-200 px-2 pt-4">
            {!isTalent && m.plan === "free" && (
              <form method="POST" action="/api/checkout">
                <button className="w-full rounded-md bg-zinc-900 px-3 py-1.5 text-[13px] font-medium text-white shadow-sm hover:bg-zinc-800">
                  Upgrade to Pro
                </button>
              </form>
            )}
            <div className="flex items-center justify-between">
              <div className="min-w-0">
                <p className="truncate text-[13px] font-medium text-zinc-900">{m.org_name}</p>
                <p className="truncate text-xs text-zinc-500">{session.user.email}</p>
              </div>
              <Badge status={m.plan === "pro" ? "pro" : "free"} />
            </div>
            <a
              href="/auth/logout"
              className="block text-xs text-zinc-500 hover:text-zinc-900"
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
