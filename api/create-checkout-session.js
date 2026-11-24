import Stripe from 'stripe';
import { requireUser } from './_lib/auth.js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const APP_URL = process.env.APP_URL || 'https://runiq-ashen.vercel.app';

const PLANS = {
  monthly: { priceId: () => process.env.STRIPE_PRICE_MONTHLY, trialDays: 7 },
  annual: { priceId: () => process.env.STRIPE_PRICE_ANNUAL, trialDays: 0 },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const user = await requireUser(req, res);
  if (!user) return;

  const plan = PLANS[req.body?.plan];
  const priceId = plan?.priceId();
  if (!plan || !priceId) {
    return res.status(400).json({ error: 'Unknown plan' });
  }

  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${APP_URL}/?checkout=success`,
      cancel_url: `${APP_URL}/pricing`,
      client_reference_id: user.id,
      // The webhook reads the user from the subscription, so it must be set here.
      subscription_data: {
        metadata: { userId: user.id },
        ...(plan.trialDays ? { trial_period_days: plan.trialDays } : {}),
      },
    });

    return res.status(200).json({ url: session.url });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
