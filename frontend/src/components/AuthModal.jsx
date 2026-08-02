import React, { useState } from 'react';
import { X, Mail, Lock, User, Shield, CheckCircle2, AlertCircle, Eye, EyeOff, Sparkles, UserCheck, KeyRound } from 'lucide-react';
import { registerLocalUser, loginLocalUser } from '../utils/localAuth';

export default function AuthModal({ isOpen, onClose, onLoginSuccess }) {
  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'citizen' // 'citizen' | 'operator' | 'admin'
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState(null); // { type: 'success' | 'error', text: string }

  if (!isOpen) return null;

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setStatusMsg(null);
  };

  const handleQuickLogin = (demoUser) => {
    setIsLoading(true);
    registerLocalUser({
      name: demoUser.name,
      email: demoUser.email,
      password: 'password123',
      role: demoUser.role
    });

    setStatusMsg({ type: 'success', text: `Authenticating demo session as [ ${demoUser.role.toUpperCase()} ]...` });
    
    setTimeout(() => {
      setIsLoading(false);
      const mockToken = 'mock_jwt_token_' + Date.now();
      onLoginSuccess(demoUser, mockToken);
      onClose();
    }, 600);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setStatusMsg(null);

    const isLogin = mode === 'login';
    const endpoint = isLogin 
      ? 'http://localhost:5000/api/auth/login' 
      : 'http://localhost:5000/api/auth/register';

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(isLogin ? {
          email: formData.email,
          password: formData.password
        } : {
          name: formData.name,
          email: formData.email,
          password: formData.password,
          role: formData.role
        })
      });

      const data = await response.json();

      if (response.ok && data.status === 'success') {
        if (!isLogin) {
          registerLocalUser({
            name: formData.name,
            email: formData.email,
            password: formData.password,
            role: formData.role
          });
        }
        setStatusMsg({ type: 'success', text: isLogin ? 'Access granted. Welcome back!' : 'Account registered successfully!' });
        setTimeout(() => {
          setIsLoading(false);
          onLoginSuccess(data.user, data.token);
          onClose();
        }, 500);
      } else {
        setIsLoading(false);
        const errDetail = data.message === 'Invalid credentials'
          ? 'Account not registered or invalid credentials. Please click [ CREATE ACCOUNT ] to register first.'
          : (data.message || 'Authentication failed. Please verify credentials.');
        setStatusMsg({ type: 'error', text: errDetail });
      }
    } catch (err) {
      console.warn('Backend endpoint offline. Falling back to local authentication mode:', err);
      setTimeout(() => {
        setIsLoading(false);
        if (isLogin) {
          const res = loginLocalUser({ email: formData.email, password: formData.password });
          if (res.success) {
            setStatusMsg({ type: 'success', text: 'Access granted. Welcome back!' });
            setTimeout(() => {
              onLoginSuccess(res.user, res.token);
              onClose();
            }, 400);
          } else {
            setStatusMsg({ type: 'error', text: res.message });
          }
        } else {
          const res = registerLocalUser({
            name: formData.name,
            email: formData.email,
            password: formData.password,
            role: formData.role
          });
          if (res.success) {
            setStatusMsg({ type: 'success', text: 'Account registered successfully! Signing in...' });
            setTimeout(() => {
              onLoginSuccess(res.user, res.token);
              onClose();
            }, 400);
          } else {
            setStatusMsg({ type: 'error', text: res.message });
          }
        }
      }, 500);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-[fadeIn_0.2s_ease-out]">
      <div className="relative w-full max-w-md max-h-[92vh] flex flex-col rounded-2xl bg-[#03045E]/95 border border-[#48CAE4]/40 shadow-[0_20px_50px_rgba(3,4,94,0.8),0_0_30px_rgba(72,202,228,0.25)] overflow-hidden text-[#CAF0F8]">
        
        {/* Header Bar */}
        <div className="flex items-center justify-between p-4 border-b border-[#0077B6]/40 bg-[#023E8A]/50 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#48CAE4]/10 border border-[#48CAE4]/40 flex items-center justify-center text-[#48CAE4]">
              <Shield className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white tracking-wider font-mono uppercase">
                NeuroCity // Gateway Auth
              </h2>
              <p className="text-[10px] text-[#48CAE4]/80 font-mono tracking-wide">
                {mode === 'login' ? 'SECURE_LOGIN_TERMINAL' : 'NEW_AGENT_REGISTRATION'}
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-lg border border-[#0077B6]/50 flex items-center justify-center text-slate-300 hover:text-white hover:border-[#48CAE4] hover:bg-[#0077B6]/40 transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Mode Switcher Tabs */}
        <div className="flex p-1.5 bg-[#023E8A]/30 border-b border-[#0077B6]/30 shrink-0">
          <button
            type="button"
            onClick={() => { setMode('login'); setStatusMsg(null); }}
            className={`flex-1 py-1.5 rounded-lg text-xs font-mono font-semibold tracking-wider transition-all cursor-pointer ${
              mode === 'login' 
                ? 'bg-[#0077B6] text-white shadow-[0_0_12px_rgba(72,202,228,0.3)] border border-[#48CAE4]/40' 
                : 'text-[#CAF0F8]/60 hover:text-white'
            }`}
          >
            [ SIGN IN ]
          </button>
          <button
            type="button"
            onClick={() => { setMode('register'); setStatusMsg(null); }}
            className={`flex-1 py-1.5 rounded-lg text-xs font-mono font-semibold tracking-wider transition-all cursor-pointer ${
              mode === 'register' 
                ? 'bg-[#0077B6] text-white shadow-[0_0_12px_rgba(72,202,228,0.3)] border border-[#48CAE4]/40' 
                : 'text-[#CAF0F8]/60 hover:text-white'
            }`}
          >
            [ CREATE ACCOUNT ]
          </button>
        </div>

        {/* Scrollable Form Body Container */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
          
          {/* Status Notification Message */}
          {statusMsg && (
            <div className={`p-2.5 rounded-xl border flex items-center gap-2 text-xs font-mono ${
              statusMsg.type === 'success' 
                ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300' 
                : 'bg-rose-500/10 border-rose-500/40 text-rose-300'
            }`}>
              {statusMsg.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" /> : <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />}
              <span>{statusMsg.text}</span>
            </div>
          )}

          {/* Form Body */}
          <form onSubmit={handleSubmit} className="space-y-3">
            
            {/* Full Name Field (Register Mode Only) */}
            {mode === 'register' && (
              <div>
                <label className="block text-[10px] font-mono text-[#CAF0F8]/90 mb-1 tracking-wider uppercase font-semibold">
                  Full Agent Name
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#48CAE4]/70" />
                  <input
                    type="text"
                    name="name"
                    required
                    placeholder="e.g. Officer Alex Vance"
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#023E8A]/40 border border-[#0077B6]/50 text-white placeholder-slate-400 text-xs focus:outline-none focus:border-[#48CAE4] focus:ring-1 focus:ring-[#48CAE4] transition-all"
                  />
                </div>
              </div>
            )}

            {/* Email Address Field */}
            <div>
              <label className="block text-[10px] font-mono text-[#CAF0F8]/90 mb-1 tracking-wider uppercase font-semibold">
                Municipal Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#48CAE4]/70" />
                <input
                  type="email"
                  name="email"
                  required
                  placeholder="agent@neurocity.gov"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#023E8A]/40 border border-[#0077B6]/50 text-white placeholder-slate-400 text-xs focus:outline-none focus:border-[#48CAE4] focus:ring-1 focus:ring-[#48CAE4] transition-all"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-[10px] font-mono text-[#CAF0F8]/90 mb-1 tracking-wider uppercase font-semibold">
                Access Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#48CAE4]/70" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  required
                  minLength={6}
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full pl-9 pr-9 py-2 rounded-xl bg-[#023E8A]/40 border border-[#0077B6]/50 text-white placeholder-slate-400 text-xs focus:outline-none focus:border-[#48CAE4] focus:ring-1 focus:ring-[#48CAE4] transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Role Selector (Register Mode Only) */}
            {mode === 'register' && (
              <div>
                <label className="block text-[10px] font-mono text-[#CAF0F8]/90 mb-1 tracking-wider uppercase font-semibold">
                  Access Clearance Role
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'citizen', label: 'Citizen', desc: 'Public Reporter' },
                    { id: 'operator', label: 'Operator', desc: 'Grid Controller' },
                    { id: 'admin', label: 'Admin', desc: 'Root Command' }
                  ].map((r) => (
                    <button
                      type="button"
                      key={r.id}
                      onClick={() => setFormData({ ...formData, role: r.id })}
                      className={`p-2 rounded-xl border text-left transition-all cursor-pointer ${
                        formData.role === r.id
                          ? 'bg-[#0077B6] border-[#48CAE4] text-white shadow-[0_0_10px_rgba(72,202,228,0.3)]'
                          : 'bg-[#023E8A]/30 border-[#0077B6]/40 text-[#CAF0F8]/70 hover:border-[#48CAE4]/60'
                      }`}
                    >
                      <div className="text-xs font-mono font-bold capitalize">{r.label}</div>
                      <div className="text-[10px] text-slate-300 opacity-80 leading-tight">{r.desc}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Form Action Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 mt-1 rounded-xl bg-gradient-to-r from-[#0077B6] to-[#00B4D8] text-white font-mono text-xs font-bold tracking-wider hover:from-[#0096C7] hover:to-[#48CAE4] transition-all shadow-[0_0_18px_rgba(72,202,228,0.3)] disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
              ) : (
                <>
                  <KeyRound className="w-4 h-4" />
                  <span>{mode === 'login' ? 'AUTHENTICATE SESSION' : 'REGISTER MUNICIPAL ACCOUNT'}</span>
                </>
              )}
            </button>

          </form>

        </div>

        {/* Quick Demo Shortcuts Footer */}
        <div className="p-3 bg-[#023E8A]/50 border-t border-[#0077B6]/40 text-center shrink-0">
          <div className="flex items-center justify-center gap-1.5 text-[10px] font-mono text-[#48CAE4] mb-2 font-semibold tracking-wider">
            <Sparkles className="w-3 h-3" />
            <span>QUICK DEMO ACCELERATORS</span>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => handleQuickLogin({ id: 'usr_c1', name: 'Citizen Observer', email: 'citizen@neurocity.gov', role: 'citizen' })}
              className="flex-1 py-1 px-2 rounded-lg bg-[#0077B6]/30 border border-[#0077B6]/60 text-[10px] font-mono text-[#CAF0F8] hover:bg-[#0077B6]/60 hover:text-white transition-all cursor-pointer flex items-center justify-center gap-1"
            >
              <UserCheck className="w-3 h-3 text-[#48CAE4]" />
              <span>Citizen</span>
            </button>
            <button
              type="button"
              onClick={() => handleQuickLogin({ id: 'usr_op1', name: 'Traffic Operator', email: 'operator@neurocity.gov', role: 'operator' })}
              className="flex-1 py-1 px-2 rounded-lg bg-[#0077B6]/30 border border-[#0077B6]/60 text-[10px] font-mono text-[#CAF0F8] hover:bg-[#0077B6]/60 hover:text-white transition-all cursor-pointer flex items-center justify-center gap-1"
            >
              <UserCheck className="w-3 h-3 text-[#48CAE4]" />
              <span>Operator</span>
            </button>
            <button
              type="button"
              onClick={() => handleQuickLogin({ id: 'usr_ad1', name: 'System Root Admin', email: 'admin@neurocity.gov', role: 'admin' })}
              className="flex-1 py-1 px-2 rounded-lg bg-[#0077B6]/30 border border-[#0077B6]/60 text-[10px] font-mono text-[#CAF0F8] hover:bg-[#0077B6]/60 hover:text-white transition-all cursor-pointer flex items-center justify-center gap-1"
            >
              <UserCheck className="w-3 h-3 text-[#48CAE4]" />
              <span>Admin</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
