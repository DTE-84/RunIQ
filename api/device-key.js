import crypto from 'crypto';
import { supabaseAdmin, requireUser, hashKey } from './_lib/auth.js';

// Creates (or replaces) the signed-in user's phone key. The plain key is only ever returned here.
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const user = await requireUser(req, res);
  if (!user) return;

  const key = `riq_${crypto.randomBytes(24).toString('hex')}`;

  const { error } = await supabaseAdmin
    .from('device_keys')
    .upsert({ user_id: user.id, key_hash: hashKey(key), created_at: new Date().toISOString() });

  if (error) {
    console.error('device-key upsert failed:', error);
    return res.status(500).json({ error: 'Could not create key.' });
  }

  return res.status(200).json({ key });
}
