import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import PasswordInput from '@/components/PasswordInput';

export default function ResetPassword() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (password.length < 8) {
      setError('Use at least 8 characters.');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }
    setLoading(true);
    try {
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) throw updateError;
      setDone(true);
      setTimeout(() => navigate('/'), 1500);
    } catch (err) {
      setError(err.message || 'Could not update your password.');
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="min-h-screen bg-[#050505] text-white flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-[#0A0A0A]/60 rounded-[2rem] border border-white/5 p-8 space-y-6">
        <h1 className="text-2xl font-extrabold">Set a new password</h1>

        {!user ? (
          <div className="space-y-4">
            <p className="text-sm text-neutral-400">
              This reset link is invalid or has expired. Request a new one from the sign-in page.
            </p>
            <Link to="/auth" className="inline-block text-sm font-bold text-[#00FF85]">Back to sign in</Link>
          </div>
        ) : done ? (
          <div className="flex items-center gap-2 text-[#10B981] text-sm bg-[#10B981]/10 p-3 rounded-lg border border-[#10B981]/20">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            <p>Password updated. Taking you in...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <PasswordInput value={password} onChange={(e) => setPassword(e.target.value)} placeholder="New password" autoComplete="new-password" />
            <PasswordInput value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="Confirm new password" autoComplete="new-password" />
            {error && (
              <div className="flex items-center gap-2 text-red-400 text-sm bg-red-400/10 p-3 rounded-lg border border-red-400/20">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <p>{error}</p>
              </div>
            )}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 rounded-xl text-sm font-bold text-black bg-[#00FF85] hover:bg-[#34D399] disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Update password'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
