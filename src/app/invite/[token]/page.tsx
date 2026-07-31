import Link from "next/link";
import { auth0 } from "@/lib/auth0";
import { db } from "@/lib/db";

export default async function InvitePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const session = await auth0.getSession();
  const invite = db.prepare(`
    SELECT i.role, i.status, o.name AS org_name FROM invites i
    JOIN orgs o ON o.id = i.org_id WHERE i.token = ?
  `).get(token) as { role: string; status: string; org_name: string } | undefined;

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center p-8">
      <div className="rounded-2xl border border-line bg-white p-8 shadow-[0_4px_24px_rgba(0,0,0,0.09)]">
        {!invite || invite.status !== "pending" ? (
          <p className="text-ink-3">This invite is invalid or already used.</p>
        ) : (
          <div className="flex flex-col gap-5">
            <p className="text-label">
              cameo · {invite.role === "talent" ? "rights holder" : invite.role} invite
            </p>
            <h1 className="text-2xl font-extrabold tracking-[-0.02em] text-ink">
              Join {invite.org_name}
            </h1>
            <p className="text-sm leading-relaxed text-ink-2">
              {invite.role === "talent"
                ? "You control every use of your likeness. Approve, scope, and revoke at any time."
                : "You'll be able to request likeness grants and run consent checks."}
            </p>
            {session ? (
              <form method="POST" action="/api/invites/accept">
                <input type="hidden" name="token" value={token} />
                <button className="w-full rounded-[10px] bg-accent px-5 py-2.5 text-sm font-bold text-white transition hover:bg-accent-dark hover:shadow-[0_4px_16px_rgba(124,111,247,0.35)]">
                  Accept invite
                </button>
              </form>
            ) : (
              <Link href={`/auth/login?returnTo=/invite/${token}`}
                className="w-full rounded-[10px] bg-accent px-5 py-2.5 text-center text-sm font-bold text-white transition hover:bg-accent-dark">
                Log in to accept
              </Link>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
