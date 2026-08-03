import React, { useState } from 'react';
import Navbar from '../components/Navbar';
import { 
  Shield, Mail, Lock, User, CheckCircle2, AlertCircle, Eye, EyeOff, 
  Sparkles, UserCheck, KeyRound, ArrowLeft, Terminal, Cpu, Radio, Zap
} from 'lucide-react';
import { registerLocalUser, loginLocalUser } from '../utils/localAuth';

export default function AuthPage({ onNavigate, onLoginSuccess, previousTab, user, onLogout }) {
  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'citizen' // 'citizen' | 'operator' | 'admin'
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState(null);

  const returnTarget = previousTab && previousTab !== 'auth' ? previousTab : 'traffic-eye';

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setStatusMsg(null);
  };

  const handleQuickLogin = (demoUser) => {
    setIsLoading(true);
    // Ensure demo user is registered locally as well
    registerLocalUser({
      name: demoUser.name,
      email: demoUser.email,
      password: 'password123',
      role: demoUser.role
    });

    setStatusMsg({ type: 'success', text: `Authenticating demo clearance as [ ${demoUser.role.toUpperCase()} ]...` });
    
    setTimeout(() => {
      setIsLoading(false);
      const mockToken = 'mock_jwt_token_' + Date.now();
      onLoginSuccess(demoUser, mockToken);
      onNavigate(returnTarget);
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
        setStatusMsg({ type: 'success', text: isLogin ? 'Access granted. Redirecting to command deck...' : 'Account registered successfully!' });
        setTimeout(() => {
          setIsLoading(false);
          onLoginSuccess(data.user, data.token);
          onNavigate(returnTarget);
        }, 500);
      } else {
        setIsLoading(false);
        const errDetail = data.message === 'Invalid credentials'
          ? 'Account not registered or invalid credentials. Please switch to [ CREATE ACCOUNT ] to register first.'
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
            setStatusMsg({ type: 'success', text: 'Access granted. Redirecting...' });
            setTimeout(() => {
              onLoginSuccess(res.user, res.token);
              onNavigate(returnTarget);
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
              onNavigate(returnTarget);
            }, 400);
          } else {
            setStatusMsg({ type: 'error', text: res.message });
          }
        }
      }, 500);
    }
  };

  return (
    <div className="min-h-screen bg-[#B0E0E6] text-slate-900 relative overflow-hidden flex flex-col font-sans select-none">
      
      {/* Powder Blue Luminous Ambient Background Mesh */}
      <div className="absolute inset-0 pointer-events-none z-0">
        {/* Soft Radiant White Halo behind card */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[750px] h-[750px] bg-white/70 rounded-full blur-[130px]" />
        
        {/* Top-Left Sky Powder Blue Glow */}
        <div className="absolute top-0 left-10 w-[550px] h-[550px] bg-[#E0F2FE]/80 rounded-full blur-[110px]" />
        
        {/* Bottom-Right Deep Azure Powder Accent */}
        <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-[#90E0EF]/60 rounded-full blur-[140px]" />
        
        {/* Crisp Subtle Grid Overlay */}
        <div className="absolute inset-0 bg-[radial-gradient(#0077B6_1.2px,transparent_1.2px)] [background-size:24px_24px] opacity-15" />
      </div>

      {/* Top Navbar Header */}
      <Navbar 
        activeTab="auth" 
        onNavigate={onNavigate} 
        user={user} 
        onLogout={onLogout} 
      />

      {/* Main Authentication Terminal Content */}
      <main className="flex-1 relative z-10 flex flex-col items-center justify-center p-6 my-4">
        
        {/* Back Link Button */}
        <button
          onClick={() => onNavigate(returnTarget)}
          className="mb-6 px-4 py-2.5 rounded-2xl bg-white/95 border border-white text-xs font-mono font-bold text-slate-800 hover:text-[#0077B6] hover:border-[#0077B6]/30 hover:bg-white transition-all flex items-center gap-2 cursor-pointer shadow-[0_4px_20px_rgba(0,119,182,0.12)] backdrop-blur-md group"
        >
          <ArrowLeft className="w-4 h-4 text-[#0077B6] group-hover:-translate-x-1 transition-transform" />
          <span>RETURN TO MUNICIPAL DASHBOARD</span>
        </button>

        {/* Auth Card Container (Ultra-Clean Glass Card over Powder Blue) */}
        <div className="w-full max-w-lg rounded-3xl bg-white/95 border border-white shadow-[0_20px_60px_rgba(0,119,182,0.18),0_4px_25px_rgba(255,255,255,0.8)] backdrop-blur-2xl overflow-hidden flex flex-col text-slate-900">
          
          {/* Header Banner */}
          <div className="p-6 border-b border-[#0077B6]/30 bg-gradient-to-r from-[#03045E] via-[#023E8A] to-[#0077B6] flex items-center justify-between text-white">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-[#48CAE4] shadow-[0_0_15px_rgba(255,255,255,0.2)]">
                <Shield className="w-6 h-6 animate-pulse text-[#48CAE4]" />
              </div>
              <div>
                <h1 className="text-base font-bold text-white tracking-wider font-mono uppercase flex items-center gap-2">
                  <span>NEUROCITY AUTH GATEWAY</span>
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></span>
                </h1>
                <p className="text-xs text-[#CAF0F8] font-mono tracking-wide mt-0.5 font-semibold">
                  {mode === 'login' ? 'SECURE_LOGIN_TERMINAL_V4.2' : 'NEW_AGENT_REGISTRATION_TERMINAL'}
                </p>
              </div>
            </div>

            <div className="text-right hidden sm:block font-mono">
              <span className="text-[10px] text-[#CAF0F8]/70 block">ENCRYPTION</span>
              <span className="text-xs font-bold text-emerald-400">AES-256 GCM</span>
            </div>
          </div>

          {/* Mode Switcher Tabs (Sign In vs Create Account) */}
          <div className="flex p-2 bg-slate-100/90 border-b border-slate-200">
            <button
              type="button"
              onClick={() => { setMode('login'); setStatusMsg(null); }}
              className={`flex-1 py-3 rounded-xl text-xs font-mono font-bold tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2 ${
                mode === 'login' 
                  ? 'bg-gradient-to-r from-[#03045E] via-[#023E8A] to-[#0077B6] text-white shadow-[0_4px_15px_rgba(3,4,94,0.3)] border border-[#0077B6]/40' 
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/80'
              }`}
            >
              <KeyRound className="w-4 h-4" />
              <span>[ SIGN IN ]</span>
            </button>

            <button
              type="button"
              onClick={() => { setMode('register'); setStatusMsg(null); }}
              className={`flex-1 py-3 rounded-xl text-xs font-mono font-bold tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2 ${
                mode === 'register' 
                  ? 'bg-gradient-to-r from-[#03045E] via-[#023E8A] to-[#0077B6] text-white shadow-[0_4px_15px_rgba(3,4,94,0.3)] border border-[#0077B6]/40' 
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/80'
              }`}
            >
              <UserCheck className="w-4 h-4" />
              <span>[ CREATE ACCOUNT ]</span>
            </button>
          </div>

          {/* Form Body */}
          <div className="p-6 space-y-5 bg-white">
            
            {/* Status Notification Message */}
            {statusMsg && (
              <div className={`p-3.5 rounded-2xl border flex items-center gap-3 text-xs font-mono animate-[fadeIn_0.2s_ease-out] ${
                statusMsg.type === 'success' 
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800 shadow-sm' 
                  : 'bg-rose-50 border-rose-200 text-rose-800 shadow-sm'
              }`}>
                {statusMsg.type === 'success' 
                  ? <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> 
                  : <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />}
                <span>{statusMsg.text}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              
              {/* Full Name (Register Mode Only) */}
              {mode === 'register' && (
                <div>
                  <label className="block text-xs font-mono text-slate-700 mb-1.5 tracking-wider uppercase font-semibold">
                    Full Agent Name
                  </label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#0077B6]" />
                    <input
                      type="text"
                      name="name"
                      required
                      placeholder="e.g. Officer Alex Vance"
                      value={formData.name}
                      onChange={handleChange}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 text-xs font-sans focus:outline-none focus:bg-white focus:border-[#0077B6] focus:ring-2 focus:ring-[#0077B6]/20 transition-all shadow-sm"
                    />
                  </div>
                </div>
              )}

              {/* Email Address */}
              <div>
                <label className="block text-xs font-mono text-slate-700 mb-1.5 tracking-wider uppercase font-semibold">
                  Municipal Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#0077B6]" />
                  <input
                    type="email"
                    name="email"
                    required
                    placeholder="agent@neurocity.gov"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 text-xs font-sans focus:outline-none focus:bg-white focus:border-[#0077B6] focus:ring-2 focus:ring-[#0077B6]/20 transition-all shadow-sm"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-mono text-slate-700 mb-1.5 tracking-wider uppercase font-semibold">
                  Access Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#0077B6]" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    required
                    minLength={6}
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 text-xs font-sans focus:outline-none focus:bg-white focus:border-[#0077B6] focus:ring-2 focus:ring-[#0077B6]/20 transition-all shadow-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Clearance Role Selector (Register Mode Only) */}
              {mode === 'register' && (
                <div>
                  <label className="block text-xs font-mono text-slate-700 mb-1.5 tracking-wider uppercase font-semibold">
                    Select Access Clearance Role
                  </label>
                  <div className="grid grid-cols-3 gap-2.5">
                    {[
                      { id: 'citizen', label: 'Citizen', desc: 'Public Reporter' },
                      { id: 'operator', label: 'Operator', desc: 'Grid Controller' },
                      { id: 'admin', label: 'Admin', desc: 'Root Command' }
                    ].map((r) => (
                      <button
                        type="button"
                        key={r.id}
                        onClick={() => setFormData({ ...formData, role: r.id })}
                        className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                          formData.role === r.id
                            ? 'bg-gradient-to-r from-[#03045E] to-[#023E8A] border-[#0077B6] text-white shadow-sm'
                            : 'bg-slate-50 border-slate-200 text-slate-700 hover:border-[#0077B6]/50 hover:bg-slate-100/80'
                        }`}
                      >
                        <div className={`text-xs font-mono font-bold capitalize ${formData.role === r.id ? 'text-white' : 'text-[#0077B6]'}`}>{r.label}</div>
                        <div className={`text-[10px] leading-tight mt-0.5 ${formData.role === r.id ? 'text-slate-200' : 'text-slate-500'}`}>{r.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 mt-2 rounded-xl bg-gradient-to-r from-[#03045E] via-[#023E8A] to-[#0077B6] text-white font-mono text-xs font-bold tracking-wider hover:from-[#023E8A] hover:to-[#0096C7] transition-all shadow-[0_4px_20px_rgba(3,4,94,0.3)] disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                ) : (
                  <>
                    <KeyRound className="w-4 h-4" />
                    <span>{mode === 'login' ? 'AUTHENTICATE & ENTER PLATFORM' : 'COMPLETE REGISTRATION'}</span>
                  </>
                )}
              </button>

            </form>

          </div>

          {/* Quick Demo Accelerators Footer */}
          <div className="p-4 bg-slate-50/90 border-t border-slate-200 text-center">
            <div className="flex items-center justify-center gap-2 text-xs font-mono text-[#0077B6] mb-3 font-bold tracking-wider">
              <Sparkles className="w-4 h-4 animate-spin text-[#0077B6]" />
              <span>1-CLICK QUICK DEMO ACCELERATORS</span>
            </div>
            
            <div className="grid grid-cols-3 gap-2.5">
              <button
                type="button"
                onClick={() => handleQuickLogin({ id: 'usr_c1', name: 'Citizen Observer', email: 'citizen@neurocity.gov', role: 'citizen' })}
                className="py-2 px-3 rounded-xl bg-white border border-slate-200 text-xs font-mono text-slate-700 hover:border-[#0077B6] hover:text-[#0077B6] hover:shadow-md transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-sm font-semibold"
              >
                <UserCheck className="w-3.5 h-3.5 text-[#0077B6]" />
                <span>Citizen</span>
              </button>
              
              <button
                type="button"
                onClick={() => handleQuickLogin({ id: 'usr_op1', name: 'Traffic Operator', email: 'operator@neurocity.gov', role: 'operator' })}
                className="py-2 px-3 rounded-xl bg-white border border-slate-200 text-xs font-mono text-slate-700 hover:border-[#0077B6] hover:text-[#0077B6] hover:shadow-md transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-sm font-semibold"
              >
                <UserCheck className="w-3.5 h-3.5 text-[#0077B6]" />
                <span>Operator</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin({ id: 'usr_ad1', name: 'System Root Admin', email: 'admin@neurocity.gov', role: 'admin' })}
                className="py-2 px-3 rounded-xl bg-white border border-slate-200 text-xs font-mono text-slate-700 hover:border-[#0077B6] hover:text-[#0077B6] hover:shadow-md transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-sm font-semibold"
              >
                <UserCheck className="w-3.5 h-3.5 text-[#0077B6]" />
                <span>Admin</span>
              </button>
            </div>
          </div>

        </div>

      </main>

      {/* Footer Banner */}
      <footer className="p-4 border-t border-slate-200/80 bg-white/80 backdrop-blur-md text-center text-xs font-mono text-slate-500 flex items-center justify-between px-8 z-10">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-[#0077B6]" />
          <span>NEUROCITY MUNICIPAL AUTH GATEWAY</span>
        </div>
        <div>
          <span>OPERATIONAL MODE: <span className="text-emerald-600 font-bold">ONLINE</span></span>
        </div>
      </footer>

    </div>
  );
}
