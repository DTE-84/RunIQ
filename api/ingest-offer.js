import { supabaseAdmin, requireDeviceUser, consumeUsage } from './_lib/auth.js';

const num = (v) => (Number.isFinite(Number(v)) ? Number(v) : null);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const userId = await requireDeviceUser(req, res);
  if (!userId) return;

  if (!(await consumeUsage(userId, 'ingest', req.body?.timezone, res))) return;

  const offerData = req.body || {};
  const pay = num(offerData.pay);
  const miles = num(offerData.miles);
  if (pay === null || miles === null) {
    return res.status(400).json({ error: 'pay and miles are required numbers' });
  }

  const dbPayload = {
    user_id: userId,
    platform: String(offerData.platform || 'Spark').slice(0, 30),
    pay,
    tips: num(offerData.tips) ?? 0,
    miles,
    miles_back: num(offerData.miles_back) ?? 0,
    time_minutes: num(offerData.time_minutes) ?? 30,
    items: num(offerData.items) ?? 0,
    dropoff_zone: String(offerData.dropoff_zone || 'Unknown').slice(0, 100),
    rating: String(offerData.rating || 'Pending').slice(0, 20),
    net_profit: num(offerData.net_profit) ?? pay,
    hourly_rate: num(offerData.hourly_rate) ?? 0,
    per_mile_rate: num(offerData.per_mile_rate) ?? 0,
    gas_cost: num(offerData.gas_cost) ?? 0,
  };

  const { error } = await supabaseAdmin.from('offers').insert([dbPayload]);
  if (error) {
    console.error('Error during offer ingest:', error);
    return res.status(500).json({ error: 'Failed to save offer.' });
  }

  return res.status(200).json({ success: true });
}
