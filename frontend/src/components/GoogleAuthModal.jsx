import React, { useState } from 'react';
import { X, User, Plus, ArrowRight, ShieldCheck } from 'lucide-react';

export default function GoogleAuthModal({ isOpen, onClose, onSelectAccount }) {
  const [customEmail, setCustomEmail] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);

  if (!isOpen) return null;

  const accounts = [
    { name: 'Citizen Observer', email: 'citizen@gmail.com', avatar: 'C' },
    { name: 'Google User', email: 'user@gmail.com', avatar: 'G' }
  ];

  const handleAccountClick = (acc) => {
    onSelectAccount({ name: acc.name, email: acc.email });
  };

  const handleCustomSubmit = (e) => {
    e.preventDefault();
    if (!customEmail.includes('@')) return;
    const nameStr = customEmail.split('@')[0].replace('.', ' ');
    const formattedName = nameStr.charAt(0).toUpperCase() + nameStr.slice(1);
    onSelectAccount({ name: formattedName, email: customEmail });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-[fadeIn_0.2s_ease-out]">
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden font-sans text-slate-800">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-all cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Content */}
        <div className="p-8 text-center space-y-6">
          
          {/* Authentic Multicolored Google G Logo */}
          <div className="flex justify-center">
            <svg width="44" height="44" viewBox="0 0 24 24">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.85z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.85c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
          </div>

          <div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              Sign in with Google
            </h2>
            <p className="text-xs text-slate-500 font-medium mt-1">
              Choose an account to continue to <strong className="text-slate-800">NeuroCity</strong>
            </p>
          </div>

          {/* Accounts Selector List */}
          <div className="space-y-2.5 text-left">
            {accounts.map((acc, idx) => (
              <button
                key={idx}
                onClick={() => handleAccountClick(acc)}
                className="w-full p-3.5 rounded-2xl border border-slate-200 bg-slate-50 hover:bg-slate-100 hover:border-[#1a73e8] transition-all cursor-pointer flex items-center justify-between group"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-full bg-[#1a73e8] text-white font-bold text-sm flex items-center justify-center shadow-sm">
                    {acc.avatar}
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-900 group-hover:text-[#1a73e8] transition-colors">
                      {acc.name}
                    </h3>
                    <p className="text-[11px] text-slate-500 font-mono">
                      {acc.email}
                    </p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-[#1a73e8] group-hover:translate-x-0.5 transition-all" />
              </button>
            ))}

            {/* Custom Account Input Toggle */}
            {!showCustomInput ? (
              <button
                onClick={() => setShowCustomInput(true)}
                className="w-full p-3 rounded-2xl border border-dashed border-slate-300 text-xs font-semibold text-slate-600 hover:text-[#1a73e8] hover:border-[#1a73e8] hover:bg-blue-50/50 transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" />
                <span>Use another Google account</span>
              </button>
            ) : (
              <form onSubmit={handleCustomSubmit} className="pt-2 space-y-2">
                <input
                  type="email"
                  required
                  placeholder="Enter Google email address"
                  value={customEmail}
                  onChange={(e) => setCustomEmail(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 text-xs font-sans focus:outline-none focus:border-[#1a73e8] focus:ring-2 focus:ring-[#1a73e8]/20"
                />
                <button
                  type="submit"
                  className="w-full py-3 bg-[#1a73e8] hover:bg-blue-700 text-white rounded-xl font-semibold text-xs transition-all shadow-md cursor-pointer"
                >
                  Continue with this Account
                </button>
              </form>
            )}
          </div>

          <div className="pt-4 border-t border-slate-100 text-[10px] text-slate-400 leading-relaxed">
            <p className="flex items-center justify-center gap-1 text-slate-500 font-medium mb-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Protected by Google Identity Services</span>
            </p>
            To continue, Google will share your name, email address, and profile picture with NeuroCity.
          </div>

        </div>
      </div>
    </div>
  );
}
