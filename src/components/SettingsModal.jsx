import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Settings, Trash2, ShieldAlert, KeyRound, Copy, Check, CreditCard } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { apiPost } from '@/lib/apiFetch';

export default function SettingsModal({ isOpen, onClose, onClearHistory, isClearing, isPremium }) {
  const [autoClear, setAutoClear] = useState('never');
  const [deviceKey, setDeviceKey] = useState('');
  const [keyBusy, setKeyBusy] = useState(false);
  const [keyError, setKeyError] = useState('');
  const [copied, setCopied] = useState(false);

  const generateKey = async () => {
    if (window.confirm('Create a new key? If you already have one, phones using it will stop syncing until you paste in the new key.')) {
      setKeyBusy(true);
      setKeyError('');
      try {
        const { key } = await apiPost('/api/device-key', {});
        setDeviceKey(key);
        setCopied(false);
      } catch (err) {
        setKeyError(err.message);
      } finally {
        setKeyBusy(false);
      }
    }
  };

  const [billingBusy, setBillingBusy] = useState(false);
  const [billingError, setBillingError] = useState('');
  const [deleteText, setDeleteText] = useState('');
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const [showDelete, setShowDelete] = useState(false);

  const openBilling = async () => {
    setBillingBusy(true);
    setBillingError('');
    try {
      const { url } = await apiPost('/api/create-portal-session', {});
      window.location.href = url;
    } catch (err) {
      setBillingError(err.message);
      setBillingBusy(false);
    }
  };

  const deleteAccount = async () => {
    setDeleteBusy(true);
    setDeleteError('');
    try {
      await apiPost('/api/delete-account', { confirm: deleteText });
      Object.keys(localStorage)
        .filter((k) => k.startsWith('runiq_') || k === 'spark_defaults')
        .forEach((k) => localStorage.removeItem(k));
      await supabase.auth.signOut();
    } catch (err) {
      setDeleteError(err.message);
      setDeleteBusy(false);
    }
  };

  const copyKey = async () => {
    try {
      await navigator.clipboard.writeText(deviceKey);
      setCopied(true);
    } catch {
      setKeyError('Copy failed. Select the key and copy it manually.');
    }
  };

  useEffect(() => {
    const saved = localStorage.getItem('runiq_auto_clear');
    if (saved) setAutoClear(saved);
  }, []);

  const handleAutoClearChange = (val) => {
    setAutoClear(val);
    localStorage.setItem('runiq_auto_clear', val);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            className="relative w-full max-w-sm glass-panel rounded-3xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto bg-[#0A0A0A]"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2 text-white">
                <Settings className="w-5 h-5 text-[#00FF85]" />
                <h2 className="text-lg font-black tracking-tight">App Settings</h2>
              </div>
              <button
                onClick={onClose}
                className="p-2 text-neutral-400 hover:text-white bg-white/5 rounded-full transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-6">
              {/* Auto Clear Setting */}
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <Label className="text-sm font-bold text-white">Auto-Clear History</Label>
                    <p className="text-[11px] text-neutral-400 font-medium mt-1">Automatically delete saved offers.</p>
                  </div>
                </div>
                <div className="relative">
                  <select
                    value={autoClear}
                    onChange={(e) => handleAutoClearChange(e.target.value)}
                    className="w-full h-12 bg-white/5 border border-white/10 rounded-xl font-semibold text-white px-4 appearance-none focus:outline-none focus:ring-1 focus:ring-[#00FF85] cursor-pointer"
                  >
                    <option value="never" className="bg-[#121212] text-white">Never</option>
                    <option value="1_day" className="bg-[#121212] text-white">After 24 hours</option>
                    <option value="app_close" className="bg-[#121212] text-white">On App Close (New Session)</option>
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-white/50">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                  </div>
                </div>
              </div>

              <div className="h-[1px] bg-white/5 w-full my-4" />

              {/* Subscription */}
              <div className="space-y-3">
                <div>
                  <Label className="text-sm font-bold text-white flex items-center gap-1">
                    <CreditCard className="w-4 h-4 text-[#00FF85]" /> Subscription
                  </Label>
                  <p className="text-[11px] text-neutral-400 font-medium mt-1">
                    {isPremium ? 'Cancel, change plan, or update your card.' : 'You are on the free plan.'}
                  </p>
                </div>
                {billingError && <p className="text-xs font-semibold text-red-500">{billingError}</p>}
                {isPremium ? (
                  <Button
                    onClick={openBilling}
                    disabled={billingBusy}
                    className="w-full h-12 bg-white/5 hover:bg-white/10 text-white border border-white/10 font-bold rounded-xl"
                  >
                    {billingBusy ? 'Opening...' : 'Manage Subscription'}
                  </Button>
                ) : (
                  <Link
                    to="/pricing"
                    onClick={onClose}
                    className="w-full h-12 flex items-center justify-center bg-[#00FF85] text-black font-bold rounded-xl hover:bg-[#34D399]"
                  >
                    See Plans
                  </Link>
                )}
              </div>

              <div className="h-[1px] bg-white/5 w-full my-4" />

              {/* Phone connection key */}
              <div className="space-y-3">
                <div>
                  <Label className="text-sm font-bold text-white flex items-center gap-1">
                    <KeyRound className="w-4 h-4 text-[#00FF85]" /> Phone Connection Key
                  </Label>
                  <p className="text-[11px] text-neutral-400 font-medium mt-1">
                    Paste this into the Android overlay app or the iPhone Shortcut so offers save to your account. Shown once.
                  </p>
                </div>
                {deviceKey && (
                  <div className="flex items-center gap-2">
                    <code className="flex-1 min-w-0 truncate text-[11px] bg-black/50 border border-white/10 rounded-xl px-3 py-3 text-[#00FF85] select-all">
                      {deviceKey}
                    </code>
                    <button
                      type="button"
                      onClick={copyKey}
                      className="h-10 w-10 shrink-0 flex items-center justify-center bg-white/5 border border-white/10 rounded-xl text-white hover:bg-white/10"
                    >
                      {copied ? <Check className="w-4 h-4 text-[#00FF85]" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                )}
                {keyError && <p className="text-xs font-semibold text-red-500">{keyError}</p>}
                <Button
                  onClick={generateKey}
                  disabled={keyBusy}
                  className="w-full h-12 bg-white/5 hover:bg-white/10 text-white border border-white/10 font-bold rounded-xl"
                >
                  {keyBusy ? 'Working...' : deviceKey ? 'Generate a New Key' : 'Create Key'}
                </Button>
              </div>

              <div className="h-[1px] bg-white/5 w-full my-4" />

              {/* Manual Clear */}
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <Label className="text-sm font-bold text-red-500 flex items-center gap-1">
                      <ShieldAlert className="w-4 h-4" /> Danger Zone
                    </Label>
                    <p className="text-[11px] text-neutral-400 font-medium mt-1">Permanently delete all your offer history.</p>
                  </div>
                </div>
                <Button 
                  onClick={onClearHistory}
                  disabled={isClearing}
                  className="w-full h-12 bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 font-bold rounded-xl transition-all flex items-center gap-2 justify-center"
                >
                  <Trash2 className="w-4 h-4" />
                  {isClearing ? 'Clearing...' : 'Clear All History Now'}
                </Button>

                {!showDelete ? (
                  <button
                    type="button"
                    onClick={() => setShowDelete(true)}
                    className="w-full text-xs font-semibold text-red-500/80 hover:text-red-500 underline"
                  >
                    Delete my account
                  </button>
                ) : (
                  <div className="space-y-2 rounded-xl border border-red-500/20 bg-red-500/5 p-3">
                    <p className="text-[11px] text-neutral-300 font-medium">
                      This permanently deletes your account and all trips, and cancels any subscription. Type DELETE to confirm.
                    </p>
                    <input
                      value={deleteText}
                      onChange={(e) => setDeleteText(e.target.value)}
                      className="w-full h-10 bg-black/50 border border-white/10 rounded-lg px-3 text-white text-sm focus:outline-none focus:ring-1 focus:ring-red-500"
                      placeholder="DELETE"
                    />
                    {deleteError && <p className="text-xs font-semibold text-red-500">{deleteError}</p>}
                    <Button
                      onClick={deleteAccount}
                      disabled={deleteText !== 'DELETE' || deleteBusy}
                      className="w-full h-10 bg-red-500 hover:bg-red-600 text-white font-bold rounded-lg disabled:opacity-40"
                    >
                      {deleteBusy ? 'Deleting...' : 'Permanently Delete Account'}
                    </Button>
                  </div>
                )}
              </div>

              <div className="flex justify-center gap-4 text-[11px] text-neutral-500">
                <Link to="/terms" onClick={onClose} className="hover:text-white">Terms</Link>
                <Link to="/privacy" onClick={onClose} className="hover:text-white">Privacy</Link>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
