import type Stripe from "stripe";
import { getStripe } from "@/lib/stripe";

// DB-free for hackathon speed: Stripe is the source of truth for plan status.
export async function getActiveSubscription(
  email: string
): Promise<Stripe.Subscription | null> {
  const stripe = getStripe();
  const customers = await stripe.customers.list({ email, limit: 1 });
  const customer = customers.data[0];
  if (!customer) return null;

  const subscriptions = await stripe.subscriptions.list({
    customer: customer.id,
    status: "active",
    limit: 1,
  });
  return subscriptions.data[0] ?? null;
}

export async function bumpSeatQuantity(subscriptionId: string): Promise<void> {
  const stripe = getStripe();
  const sub = await stripe.subscriptions.retrieve(subscriptionId);
  const item = sub.items.data[0];
  await stripe.subscriptions.update(subscriptionId, {
    items: [{ id: item.id, quantity: (item.quantity ?? 1) + 1 }],
  });
}
