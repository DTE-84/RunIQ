import React, { useState } from 'react';
import { Lock, Eye, EyeOff } from 'lucide-react';

export default function PasswordInput({ value, onChange, placeholder = '••••••••', autoComplete }) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative">
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <Lock className="h-5 w-5 text-neutral-500" />
      </div>
      <input
        type={visible ? 'text' : 'password'}
        value={value}
        onChange={onChange}
        autoComplete={autoComplete}
        placeholder={placeholder}
        className="block w-full pl-10 pr-11 py-3 border border-white/10 rounded-xl bg-black/50 text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-[#10B981] focus:border-transparent transition-all sm:text-sm"
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? 'Hide password' : 'Show password'}
        aria-pressed={visible}
        className="absolute inset-y-0 right-0 pr-3 flex items-center text-neutral-500 hover:text-white transition-colors"
      >
        {visible ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
      </button>
    </div>
  );
}
