import { auth0 } from "@/lib/auth0";

export default async function PricingPage() {
  const session = await auth0.getSession();

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 p-8">
      <h1 className="text-3xl font-bold">Pricing</h1>
      <div className="w-full max-w-sm rounded-2xl border p-8">
        <h2 className="text-xl font-semibold">Pro</h2>
        <p className="mt-2 text-4xl font-bold">
          $10<span className="text-base font-normal text-neutral-500">/mo</span>
        </p>
        <ul className="mt-4 space-y-2 text-sm text-neutral-500">
          <li>Everything in the demo</li>
          <li>Powered by Stripe subscriptions</li>
        </ul>
        {session ? (
          <form action="/api/checkout" method="POST">
            <button className="mt-6 w-full rounded-lg bg-black py-2.5 text-white dark:bg-white dark:text-black">
              Subscribe
            </button>
          </form>
        ) : (
          <a
            href="/auth/login?returnTo=/pricing"
            className="mt-6 block w-full rounded-lg border py-2.5 text-center"
          >
            Log in to subscribe
          </a>
        )}
      </div>
    </main>
  );
}
