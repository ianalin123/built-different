import Link from "next/link";
import { auth0 } from "@/lib/auth0";

export default async function Home() {
  const session = await auth0.getSession();

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 p-8">
      <h1 className="text-4xl font-bold">Built Different</h1>
      <p className="text-lg text-neutral-500">
        Auth0 x Stripe hackathon — product TBD, plumbing done.
      </p>
      <div className="flex gap-4">
        {session ? (
          <>
            <Link href="/dashboard" className="rounded-lg bg-black px-5 py-2.5 text-white dark:bg-white dark:text-black">
              Dashboard
            </Link>
            <a href="/auth/logout" className="rounded-lg border px-5 py-2.5">
              Log out
            </a>
          </>
        ) : (
          <a href="/auth/login" className="rounded-lg bg-black px-5 py-2.5 text-white dark:bg-white dark:text-black">
            Log in
          </a>
        )}
        <Link href="/pricing" className="rounded-lg border px-5 py-2.5">
          Pricing
        </Link>
      </div>
    </main>
  );
}
