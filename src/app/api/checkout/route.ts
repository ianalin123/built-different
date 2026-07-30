import { NextResponse } from "next/server";
import { auth0 } from "@/lib/auth0";
import { getStripe } from "@/lib/stripe";

export async function POST(request: Request) {
  const session = await auth0.getSession();
  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const origin = new URL(request.url).origin;
  const priceId = process.env.STRIPE_PRICE_ID;

  const checkout = await getStripe().checkout.sessions.create({
    mode: "subscription",
    customer_email: session.user.email,
    line_items: [
      priceId
        ? { price: priceId, quantity: 1 }
        : {
            price_data: {
              currency: "usd",
              recurring: { interval: "month" },
              unit_amount: 2900,
              product_data: { name: "Studio — producer seat" },
            },
            quantity: 1,
          },
    ],
    metadata: { auth0_sub: session.user.sub },
    subscription_data: { metadata: { auth0_sub: session.user.sub } },
    success_url: `${origin}/dashboard?checkout=success`,
    cancel_url: `${origin}/pricing?checkout=cancelled`,
  });

  if (!checkout.url) {
    return NextResponse.json({ error: "No checkout URL returned" }, { status: 500 });
  }
  return NextResponse.redirect(checkout.url, 303);
}
