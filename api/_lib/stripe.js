import Stripe from 'stripe';
import { supabaseAdmin } from './auth.js';

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Everything Stripe-side that belongs to this user: subscription ids and the customer id.
// Reads the saved subscription row (whatever columns it has) and also searches Stripe by the userId we stamp on subscriptions.
export async function findStripeRecords(userId) {
  const subscriptionIds = new Set();
  let customerId = null;

  const { data: row } = await supabaseAdmin
    .from('subscriptions')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();
  if (row?.stripe_subscription_id) subscriptionIds.add(row.stripe_subscription_id);
  if (row?.stripe_customer_id) customerId = row.stripe_customer_id;

  try {
    const found = await stripe.subscriptions.search({
      query: `metadata['userId']:'${userId}'`,
      limit: 100,
    });
    for (const sub of found.data) {
      subscriptionIds.add(sub.id);
      customerId = customerId || (typeof sub.customer === 'string' ? sub.customer : sub.customer?.id);
    }
  } catch (err) {
    console.error('Stripe subscription search failed:', err.message);
  }

  return { subscriptionIds: [...subscriptionIds], customerId };
}
