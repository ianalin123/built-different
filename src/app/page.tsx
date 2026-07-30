import Link from "next/link";
import { auth0 } from "@/lib/auth0";

export default async function Home() {
  const session = await auth0.getSession();
  return (
    <main className="flex min-h-screen flex-col bg-neutral-950 text-neutral-100">
      <nav className="flex items-center justify-between px-8 py-5">
        <span className="font-semibold tracking-tight">cameo</span>
        <div className="flex gap-5 text-sm text-neutral-400">
          <Link href="/pricing" className="hover:text-white">Pricing</Link>
          {session ? (
            <Link href="/dashboard" className="hover:text-white">Dashboard</Link>
          ) : (
            <a href="/auth/login" className="hover:text-white">Log in</a>
          )}
        </div>
      </nav>
      <section className="mx-auto flex max-w-3xl flex-1 flex-col justify-center gap-6 px-8 pb-24">
        <p className="text-sm font-medium uppercase tracking-widest text-red-400">
          consent infrastructure for ai video
        </p>
        <h1 className="text-5xl font-semibold leading-tight tracking-tight">
          Every face in your feed
          <br />
          signed off. <span className="text-neutral-500">Or didn&apos;t.</span>
        </h1>
        <p className="max-w-xl text-lg text-neutral-400">
          470 AI microdramas ship every day. Cameo is the consent ledger behind them:
          talent grants scoped rights to their likeness, studios verify every render,
          and each check produces a signed receipt.
        </p>
        <div className="flex gap-3">
          <a href="/auth/login" className="rounded-lg bg-white px-6 py-3 font-medium text-black">
            Start your studio
          </a>
          <Link href="/pricing" className="rounded-lg border border-neutral-700 px-6 py-3 text-neutral-300">
            Pricing
          </Link>
        </div>
        <p className="pt-6 font-mono text-xs text-neutral-600">
          POST /api/v1/check → {"{"} &quot;result&quot;: &quot;allowed&quot;, &quot;receipt&quot;: signed {"}"}
        </p>
      </section>
    </main>
  );
}
