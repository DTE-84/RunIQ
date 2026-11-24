import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useSubscription } from '@/hooks/useSubscription';
import { motion } from 'framer-motion';
import { Check, Sparkles, ArrowLeft, Loader2 } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { apiPost } from '@/lib/apiFetch';

const TIERS = [
  {
    id: 'monthly',
    name: 'Monthly',
    price: '$9.99',
    period: 'month',
    target: 'Cancel anytime',
    isPopular: true,
    trial: '7-day free trial',
    features: [
      'Screenshot scan: up to 150 a day',
      'Unlimited saved trips, daily and all-time totals',
      'AI offer ratings with deadhead and gas costs',
      'Android overlay auto-capture'
    ]
  },
  {
    id: 'annual',
    name: 'Annual',
    price: '$79.99',
    period: 'year',
    target: 'Best value: save 33%',
    features: [
      'Everything in Monthly',
      'Two months free vs. paying monthly'
    ]
  }
];

export default function Pricing() {
  const { user } = useAuth();
  const { tier, isPremium } = useSubscription();
  const navigate = useNavigate();
  const [loadingId, setLoadingId] = useState(null);

  const handleSubscribe = async (plan) => {
    if (!user) return;
    try {
      setLoadingId(plan);
      const data = await apiPost('/api/create-checkout-session', { plan });
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error('Failed to create checkout session');
      }
    } catch (err) {
      console.error(err);
      alert('Error: ' + err.message);
      setLoadingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white p-6 relative overflow-hidden flex flex-col items-center justify-center">
      {/* Background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-4xl h-[600px] bg-[#00FF85]/5 blur-[150px] rounded-full pointer-events-none" />
      
      <button 
        onClick={() => navigate(-1)} 
        className="absolute top-6 left-6 p-2 bg-white/5 border border-white/10 rounded-full hover:bg-white/10 transition-colors z-20"
      >
        <ArrowLeft className="w-5 h-5 text-neutral-400" />
      </button>

      <div className="relative z-10 w-full max-w-5xl mx-auto space-y-12">
        <div className="text-center space-y-4">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#00FF85]/10 border border-[#00FF85]/20 text-[#00FF85] text-xs font-bold uppercase tracking-widest mb-4"
          >
            <Sparkles className="w-4 h-4" />
            Upgrade to Pro
          </motion.div>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">Maximize Your Earnings.</h1>
          <p className="text-neutral-400 max-w-lg mx-auto text-lg">
            Scan an offer, see if it's worth it, and keep every trip. Manual entry stays free, with a few free scans a day.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
          {TIERS.map((t, idx) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1, duration: 0.5 }}
              className={`relative rounded-[2rem] p-8 border ${t.isPopular ? 'bg-gradient-to-b from-[#1A1A1A] to-[#0A0A0A] border-[#00FF85]/30 shadow-2xl shadow-[#00FF85]/10' : 'bg-[#0A0A0A]/50 border-white/5 backdrop-blur-md'}`}
            >
              {t.isPopular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-[#00FF85] text-black text-xs font-bold uppercase tracking-widest rounded-full">
                  Most Popular
                </div>
              )}
              
              <div className="space-y-4 mb-8">
                <h3 className="text-xl font-bold text-white">{t.name}</h3>
                <p className="text-sm font-medium text-neutral-500 uppercase tracking-widest">{t.target}</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-extrabold">{t.price}</span>
                  <span className="text-neutral-400">/{t.period}</span>
                </div>
              </div>

              <ul className="space-y-4 mb-8">
                {t.features.map((f, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <div className={`mt-1 rounded-full p-0.5 ${t.isPopular ? 'bg-[#00FF85]/20 text-[#00FF85]' : 'bg-white/10 text-white/50'}`}>
                      <Check className="w-3 h-3" />
                    </div>
                    <span className="text-sm text-neutral-300">{f}</span>
                  </li>
                ))}
              </ul>

              <button
                disabled={loadingId === t.id || tier === t.id}
                onClick={() => handleSubscribe(t.id)}
                className={`w-full py-4 rounded-2xl font-bold tracking-wide transition-all flex items-center justify-center gap-2 ${
                  tier === t.id 
                    ? 'bg-white/10 text-white/50 cursor-not-allowed'
                    : t.isPopular 
                      ? 'bg-[#00FF85] text-black hover:bg-[#00FF85]/90 hover:scale-[1.02] active:scale-95 shadow-lg shadow-[#00FF85]/20'
                      : 'bg-white/10 text-white hover:bg-white/20 active:scale-95'
                }`}
              >
                {loadingId === t.id ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : tier === t.id ? (
                  'Current Plan'
                ) : (
                  t.trial ? 'Start Free Trial' : 'Subscribe Now'
                )}
              </button>
            </motion.div>
          ))}
        </div>

        <p className="text-center text-xs text-neutral-500 max-w-xl mx-auto">
          Plans renew automatically until cancelled. Cancel anytime in Settings, then Manage Subscription. Payments are handled by Stripe.{' '}
          <Link to="/terms" className="underline">Terms</Link> · <Link to="/privacy" className="underline">Privacy</Link>
        </p>
      </div>
    </div>
  );
}
