import Link from "next/link";
import { auth0 } from "@/lib/auth0";
import { getActiveSubscription } from "@/lib/billing";

export default async function DashboardPage() {
  const session = await auth0.getSession();
  if (!session) return null; // middleware redirects before this renders

  const subscription = session.user.email
    ? await getActiveSubscription(session.user.email)
    : null;

  return (
    <main className="mx-auto max-w-2xl p-8">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <a href="/auth/logout" className="text-sm text-neutral-500 underline">
          Log out
        </a>
      </header>

      <section className="mt-8 rounded-2xl border p-6">
        <p className="font-medium">{session.user.name}</p>
        <p className="text-sm text-neutral-500">{session.user.email}</p>
        <p className="mt-4 text-sm">
          Plan:{" "}
          {subscription ? (
            <span className="font-semibold text-green-600">Pro (active)</span>
          ) : (
            <>
              <span className="font-semibold">Free</span> —{" "}
              <Link href="/pricing" className="underline">
                upgrade
              </Link>
            </>
          )}
        </p>
      </section>

      <section className="mt-8 rounded-2xl border border-dashed p-6 text-neutral-500">
        Product goes here. Gate premium features on the subscription above.
      </section>
    </main>
  );
}
