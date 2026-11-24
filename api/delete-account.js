import { supabaseAdmin, requireUser } from './_lib/auth.js';
import { stripe, findStripeRecords } from './_lib/stripe.js';

// Permanently deletes the signed-in user: cancels billing first, then removes their data and login.
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const user = await requireUser(req, res);
  if (!user) return;

  if (req.body?.confirm !== 'DELETE') {
    return res.status(400).json({ error: 'Type DELETE to confirm.' });
  }

  try {
    // Cancel billing first. If this fails we stop, so nobody keeps getting charged for a deleted account.
    const { subscriptionIds } = await findStripeRecords(user.id);
    for (const id of subscriptionIds) {
      try {
        await stripe.subscriptions.cancel(id);
      } catch (err) {
        if (err?.code !== 'resource_missing' && !/already (been )?canceled/i.test(err?.message || '')) throw err;
      }
    }

    for (const table of ['offers', 'subscriptions', 'device_keys', 'usage_counters']) {
      const { error } = await supabaseAdmin.from(table).delete().eq('user_id', user.id);
      if (error) throw new Error(`Failed clearing ${table}: ${error.message}`);
    }

    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(user.id);
    if (deleteError) throw deleteError;

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Account deletion failed:', error);
    return res.status(500).json({ error: 'Could not delete the account. Please try again or contact support.' });
  }
}
