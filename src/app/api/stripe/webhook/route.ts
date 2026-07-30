import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { getStripe } from "@/lib/stripe";
import { db } from "@/lib/db";

export async function POST(request: Request) {
  const signature = request.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!signature || !webhookSecret) {
    return NextResponse.json({ error: "Missing webhook signature or secret" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    const payload = await request.text();
    event = getStripe().webhooks.constructEvent(payload, signature, webhookSecret);
  } catch (err) {
    console.error("Webhook signature verification failed", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object;
      const sub = session.metadata?.auth0_sub;
      if (sub) {
        db.prepare(`UPDATE orgs SET plan = 'pro', stripe_customer_id = ?, stripe_subscription_id = ?
          WHERE owner_sub = ?`)
          .run(String(session.customer), String(session.subscription), sub);
      }
      break;
    }
    case "customer.subscription.updated":
    case "customer.subscription.deleted": {
      const subscription = event.data.object;
      if (event.type === "customer.subscription.deleted") {
        db.prepare("UPDATE orgs SET plan = 'free', stripe_subscription_id = NULL WHERE stripe_subscription_id = ?")
          .run(subscription.id);
      }
      break;
    }
    default:
      break;
  }

  return NextResponse.json({ received: true });
}
