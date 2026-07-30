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
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-6 p-8">
      {!invite || invite.status !== "pending" ? (
        <p className="text-neutral-500">This invite is invalid or already used.</p>
      ) : (
        <>
          <h1 className="text-2xl font-semibold">
            Join {invite.org_name} as {invite.role}
          </h1>
          <p className="text-neutral-500">
            {invite.role === "talent"
              ? "You control every use of your likeness. Approve, scope, and revoke at any time."
              : "You'll be able to request likeness grants and run consent checks."}
          </p>
          {session ? (
            <form method="POST" action="/api/invites/accept">
              <input type="hidden" name="token" value={token} />
              <button className="rounded-lg bg-black px-5 py-2.5 text-white">Accept invite</button>
            </form>
          ) : (
            <Link href={`/auth/login?returnTo=/invite/${token}`}
              className="rounded-lg bg-black px-5 py-2.5 text-center text-white">
              Log in to accept
            </Link>
          )}
        </>
      )}
    </main>
  );
}
