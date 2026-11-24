import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

export const supabaseAdmin = createClient(
  process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY
);

// Daily caps per user. free = no active subscription.
export const LIMITS = {
  scan: { free: 5, premium: 150 },
  evaluate: { free: 40, premium: 400 },
  ingest: { free: 20, premium: 1000 },
};

const PAID_TIERS = ['weekly', 'monthly', 'annual'];
const PAID_STATUSES = ['active', 'trialing'];

export const hashKey = (key) => crypto.createHash('sha256').update(key).digest('hex');

// Verifies the Supabase access token sent by the web app. Sends the 401 itself.
export async function requireUser(req, res) {
  const token = (req.headers.authorization || '').replace(/^Bearer\s+/i, '');
  if (!token) {
    res.status(401).json({ error: 'Please sign in.' });
    return null;
  }
  const { data, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !data?.user) {
    res.status(401).json({ error: 'Session expired. Please sign in again.' });
    return null;
  }
  return data.user;
}

// Resolves the user that owns a phone/overlay key. Sends the 401 itself.
export async function requireDeviceUser(req, res) {
  const key = req.headers['x-runiq-key'];
  if (!key || typeof key !== 'string') {
    res.status(401).json({ error: 'Missing device key.' });
    return null;
  }
  const { data, error } = await supabaseAdmin
    .from('device_keys')
    .select('user_id')
    .eq('key_hash', hashKey(key))
    .maybeSingle();
  if (error || !data) {
    res.status(401).json({ error: 'Invalid device key.' });
    return null;
  }
  return data.user_id;
}

export async function isPremium(userId) {
  const { data } = await supabaseAdmin
    .from('subscriptions')
    .select('tier, status')
    .eq('user_id', userId)
    .maybeSingle();
  return !!data && PAID_TIERS.includes(data.tier) && PAID_STATUSES.includes(data.status);
}

function dayInTimezone(timezone) {
  try {
    // en-CA formats as YYYY-MM-DD
    return new Intl.DateTimeFormat('en-CA', { timeZone: timezone }).format(new Date());
  } catch {
    return new Date().toISOString().slice(0, 10);
  }
}

// Counts one use against today's cap. Sends the 429 itself when the cap is hit.
export async function consumeUsage(userId, kind, timezone, res) {
  const premium = await isPremium(userId);
  const limit = LIMITS[kind][premium ? 'premium' : 'free'];
  const { data: allowed, error } = await supabaseAdmin.rpc('consume_usage', {
    p_user_id: userId,
    p_kind: kind,
    p_day: dayInTimezone(timezone),
    p_limit: limit,
  });
  if (error) {
    console.error('consume_usage failed:', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
    return false;
  }
  if (!allowed) {
    res.status(429).json({
      error: premium
        ? 'Daily fair-use limit reached. It resets tomorrow.'
        : `You've used your ${limit} free ${kind === 'scan' ? 'scans' : 'checks'} for today. Upgrade for more.`,
      code: 'limit_reached',
      premium,
    });
    return false;
  }
  return true;
}
