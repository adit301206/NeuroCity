import React, { useState, useEffect } from 'react';
import { 
  X, Shield, Lock, Trash2, KeyRound, CheckCircle2, AlertCircle, Eye, EyeOff, User, AlertTriangle, Sparkles, Check, Info, UserCheck, Mail, BadgeCheck
} from 'lucide-react';
import { changePasswordLocal, deleteAccountLocal, updateProfileLocal } from '../utils/localAuth';

export default function AccountSettingsModal({ isOpen, onClose, currentUser, onLogout, onUpdateUser, initialTab = 'profile' }) {
  const [activeTab, setActiveTab] = useState(initialTab);

  // Profile Details State
  const [profileData, setProfileData] = useState({
    name: '',
    email: ''
  });

  // Password Change State
  const [passData, setPassData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);

  // Delete Account State
  const [deletePassword, setDeletePassword] = useState('');
  const [showDeletePass, setShowDeletePass] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState(null); // { type: 'success' | 'error', text: string }

  useEffect(() => {
    if (isOpen && currentUser) {
      setActiveTab(initialTab || 'profile');
      setStatusMsg(null);
      setProfileData({
        name: currentUser.name || '',
        email: currentUser.email || ''
      });
      setPassData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setDeletePassword('');
    }
  }, [isOpen, initialTab, currentUser]);

  if (!isOpen || !currentUser) return null;

  const handleProfileChange = (e) => {
    setProfileData({ ...profileData, [e.target.name]: e.target.value });
    if (statusMsg) setStatusMsg(null);
  };

  const handlePassChange = (e) => {
    setPassData({ ...passData, [e.target.name]: e.target.value });
    if (statusMsg) setStatusMsg(null);
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setStatusMsg(null);

    if (!profileData.name.trim() || !profileData.email.trim()) {
      setStatusMsg({ type: 'error', text: 'Please fill in both full name and email address.' });
      return;
    }

    setIsLoading(true);
    const token = localStorage.getItem('token');

    try {
      const response = await fetch('/api/auth/update-profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: profileData.name,
          email: profileData.email
        })
      });

      const data = await response.json();

      if (response.ok && data.status === 'success' && data.user) {
        const updatedUser = { ...currentUser, ...data.user };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        if (onUpdateUser) onUpdateUser(updatedUser);
        setStatusMsg({ type: 'success', text: 'Profile details updated successfully!' });
        setIsLoading(false);
      } else {
        const localRes = updateProfileLocal({
          currentEmail: currentUser.email,
          name: profileData.name,
          email: profileData.email
        });
        setIsLoading(false);
        if (localRes.success && localRes.user) {
          const updatedUser = { ...currentUser, ...localRes.user };
          localStorage.setItem('user', JSON.stringify(updatedUser));
          if (onUpdateUser) onUpdateUser(updatedUser);
          setStatusMsg({ type: 'success', text: localRes.message });
        } else {
          setStatusMsg({ type: 'error', text: data.message || localRes.message || 'Failed to update profile.' });
        }
      }
    } catch (err) {
      const localRes = updateProfileLocal({
        currentEmail: currentUser.email,
        name: profileData.name,
        email: profileData.email
      });
      setIsLoading(false);
      if (localRes.success && localRes.user) {
        const updatedUser = { ...currentUser, ...localRes.user };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        if (onUpdateUser) onUpdateUser(updatedUser);
        setStatusMsg({ type: 'success', text: localRes.message });
      } else {
        setStatusMsg({ type: 'error', text: localRes.message || 'Failed to update profile.' });
      }
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setStatusMsg(null);

    if (!passData.currentPassword || !passData.newPassword || !passData.confirmPassword) {
      setStatusMsg({ type: 'error', text: 'Please fill in all password fields.' });
      return;
    }

    if (passData.newPassword.length < 6) {
      setStatusMsg({ type: 'error', text: 'New password must be at least 6 characters long.' });
      return;
    }

    if (passData.newPassword !== passData.confirmPassword) {
      setStatusMsg({ type: 'error', text: 'New password and confirmation do not match.' });
      return;
    }

    setIsLoading(true);
    const token = localStorage.getItem('token');

    try {
      const response = await fetch('/api/auth/change-password', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          currentPassword: passData.currentPassword,
          newPassword: passData.newPassword
        })
      });

      const data = await response.json();

      if (response.ok && data.status === 'success') {
        setStatusMsg({ type: 'success', text: 'Password updated successfully!' });
        setPassData({ currentPassword: '', newPassword: '', confirmPassword: '' });
        setTimeout(() => {
          setIsLoading(false);
        }, 1200);
      } else {
        const localRes = changePasswordLocal({
          email: currentUser.email,
          currentPassword: passData.currentPassword,
          newPassword: passData.newPassword
        });
        setIsLoading(false);
        if (localRes.success) {
          setStatusMsg({ type: 'success', text: localRes.message });
          setPassData({ currentPassword: '', newPassword: '', confirmPassword: '' });
        } else {
          setStatusMsg({ type: 'error', text: data.message || localRes.message || 'Failed to update password.' });
        }
      }
    } catch (err) {
      const localRes = changePasswordLocal({
        email: currentUser.email,
        currentPassword: passData.currentPassword,
        newPassword: passData.newPassword
      });
      setIsLoading(false);
      if (localRes.success) {
        setStatusMsg({ type: 'success', text: localRes.message });
        setPassData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      } else {
        setStatusMsg({ type: 'error', text: localRes.message || 'Failed to update password.' });
      }
    }
  };

  const handleDeleteSubmit = async (e) => {
    e.preventDefault();
    setStatusMsg(null);

    if (!deletePassword) {
      setStatusMsg({ type: 'error', text: 'Please enter your current password to confirm account deletion.' });
      return;
    }

    setIsLoading(true);
    const token = localStorage.getItem('token');

    try {
      const response = await fetch('/api/auth/delete-account', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ password: deletePassword })
      });

      const data = await response.json();

      if (response.ok && data.status === 'success') {
        setStatusMsg({ type: 'success', text: 'Account permanently deleted. Signing out...' });
        setTimeout(() => {
          setIsLoading(false);
          onClose();
          onLogout && onLogout();
        }, 1400);
      } else {
        const localRes = deleteAccountLocal({
          email: currentUser.email,
          password: deletePassword
        });
        if (localRes.success) {
          setStatusMsg({ type: 'success', text: 'Account permanently deleted. Signing out...' });
          setTimeout(() => {
            setIsLoading(false);
            onClose();
            onLogout && onLogout();
          }, 1400);
        } else {
          setIsLoading(false);
          setStatusMsg({ type: 'error', text: data.message || localRes.message || 'Failed to delete account.' });
        }
      }
    } catch (err) {
      const localRes = deleteAccountLocal({
        email: currentUser.email,
        password: deletePassword
      });
      if (localRes.success) {
        setStatusMsg({ type: 'success', text: 'Account permanently deleted. Signing out...' });
        setTimeout(() => {
          setIsLoading(false);
          onClose();
          onLogout && onLogout();
        }, 1400);
      } else {
        setIsLoading(false);
        setStatusMsg({ type: 'error', text: localRes.message || 'Failed to delete account.' });
      }
    }
  };

  const isMinLength = passData.newPassword.length >= 6;
  const isMatching = passData.newPassword.length > 0 && passData.newPassword === passData.confirmPassword;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-md animate-[fadeIn_0.2s_ease-out]">
      
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] bg-gradient-to-tr from-[#0077B6]/15 via-[#48CAE4]/10 to-sky-300/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="relative w-full max-w-lg flex flex-col rounded-3xl bg-white border border-slate-200/90 shadow-[0_25px_60px_rgba(3,4,94,0.18),0_4px_25px_rgba(0,119,182,0.08)] overflow-hidden text-slate-900 transition-all">
        
        <div className="relative p-6 border-b border-[#0077B6]/30 bg-gradient-to-r from-[#03045E] via-[#023E8A] to-[#0077B6] flex items-center justify-between text-white">
          <div className="flex items-center gap-3.5">
            <div className="relative w-12 h-12 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-[#48CAE4] shadow-sm shrink-0">
              <Shield className="w-6 h-6 animate-pulse text-[#48CAE4]" />
              <Sparkles className="w-3 h-3 absolute -top-1 -right-1 text-amber-300 animate-spin" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white tracking-wider font-mono uppercase">
                  Account Console
                </h2>
                <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-mono font-bold tracking-wider uppercase border shadow-sm ${
                  currentUser.role === 'admin' 
                    ? 'bg-rose-500/20 text-rose-200 border-rose-400/40' 
                    : 'bg-white/20 text-[#CAF0F8] border-white/30'
                }`}>
                  {currentUser.role === 'admin' ? 'City Admin' : 'Citizen'}
                </span>
              </div>
              <p className="text-xs text-[#CAF0F8]/90 font-mono tracking-wide mt-0.5 truncate max-w-[260px]">
                {currentUser.name || currentUser.email}
              </p>
            </div>
          </div>

          <button 
            onClick={onClose}
            aria-label="Close Settings Modal"
            className="w-9 h-9 rounded-xl border border-white/20 bg-white/10 flex items-center justify-center text-slate-100 hover:text-white hover:border-white/40 hover:bg-white/20 transition-all cursor-pointer shadow-sm"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex p-1.5 bg-slate-100/90 border-b border-slate-200 gap-1">
          <button
            type="button"
            onClick={() => { setActiveTab('profile'); setStatusMsg(null); }}
            className={`flex-1 py-2.5 rounded-xl text-xs font-mono font-bold tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'profile' 
                ? 'bg-gradient-to-r from-[#03045E] via-[#023E8A] to-[#0077B6] text-white shadow-[0_4px_15px_rgba(3,4,94,0.25)] border border-[#0077B6]/40' 
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/80'
            }`}
          >
            <User className="w-4 h-4" />
            <span>[ PROFILE ]</span>
          </button>

          <button
            type="button"
            onClick={() => { setActiveTab('password'); setStatusMsg(null); }}
            className={`flex-1 py-2.5 rounded-xl text-xs font-mono font-bold tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'password' 
                ? 'bg-gradient-to-r from-[#03045E] via-[#023E8A] to-[#0077B6] text-white shadow-[0_4px_15px_rgba(3,4,94,0.25)] border border-[#0077B6]/40' 
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/80'
            }`}
          >
            <KeyRound className="w-4 h-4" />
            <span>[ PASSWORD ]</span>
          </button>

          <button
            type="button"
            onClick={() => { setActiveTab('delete'); setStatusMsg(null); }}
            className={`flex-1 py-2.5 rounded-xl text-xs font-mono font-bold tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'delete' 
                ? 'bg-rose-600 text-white shadow-[0_4px_15px_rgba(225,29,72,0.3)] border border-rose-600' 
                : 'text-rose-600/80 hover:text-rose-700 hover:bg-rose-50'
            }`}
          >
            <Trash2 className="w-4 h-4 text-rose-500 group-hover:text-rose-600" />
            <span>[ DELETE ]</span>
          </button>
        </div>

        <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto bg-white">
          
          {statusMsg && (
            <div className={`p-4 rounded-2xl border flex items-center gap-3 text-xs font-mono animate-[fadeIn_0.2s_ease-out] shadow-sm ${
              statusMsg.type === 'success' 
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
                : 'bg-rose-50 border-rose-200 text-rose-800'
            }`}>
              {statusMsg.type === 'success' 
                ? <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" /> 
                : <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />}
              <span className="leading-relaxed font-semibold">{statusMsg.text}</span>
            </div>
          )}

          {activeTab === 'profile' && (
            <form onSubmit={handleProfileSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-mono text-slate-700 mb-1.5 tracking-wider uppercase font-semibold">
                  Full Name
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#0077B6]" />
                  <input
                    type="text"
                    name="name"
                    required
                    placeholder="Enter your full name"
                    value={profileData.name}
                    onChange={handleProfileChange}
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 text-xs font-sans focus:outline-none focus:bg-white focus:border-[#0077B6] focus:ring-2 focus:ring-[#0077B6]/20 transition-all shadow-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-700 mb-1.5 tracking-wider uppercase font-semibold">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#0077B6]" />
                  <input
                    type="email"
                    name="email"
                    required
                    placeholder="name@neurocity.gov"
                    value={profileData.email}
                    onChange={handleProfileChange}
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 text-xs font-sans focus:outline-none focus:bg-white focus:border-[#0077B6] focus:ring-2 focus:ring-[#0077B6]/20 transition-all shadow-sm"
                  />
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs font-mono">
                <div className="flex items-center gap-2">
                  <BadgeCheck className="w-4 h-4 text-[#0077B6]" />
                  <span className="text-slate-600 font-semibold">Assigned Access Clearance:</span>
                </div>
                <span className={`px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider text-[10px] ${
                  currentUser.role === 'admin' 
                    ? 'bg-rose-100 text-rose-800 border border-rose-200' 
                    : 'bg-[#0077B6]/10 text-[#0077B6] border border-[#0077B6]/30'
                }`}>
                  {currentUser.role === 'admin' ? 'City Admin' : 'Citizen'}
                </span>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 mt-2 rounded-xl bg-gradient-to-r from-[#03045E] via-[#023E8A] to-[#0077B6] text-white font-mono text-xs font-bold tracking-wider hover:from-[#023E8A] hover:to-[#0096C7] transition-all shadow-[0_4px_20px_rgba(3,4,94,0.3)] disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                ) : (
                  <>
                    <UserCheck className="w-4 h-4" />
                    <span>SAVE PROFILE DETAILS</span>
                  </>
                )}
              </button>
            </form>
          )}

          {activeTab === 'password' && (
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-mono text-slate-700 mb-1.5 tracking-wider uppercase font-semibold">
                  Current Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#0077B6]" />
                  <input
                    type={showCurrentPass ? 'text' : 'password'}
                    name="currentPassword"
                    required
                    placeholder="Enter current password"
                    value={passData.currentPassword}
                    onChange={handlePassChange}
                    className="w-full pl-10 pr-10 py-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 text-xs font-sans focus:outline-none focus:bg-white focus:border-[#0077B6] focus:ring-2 focus:ring-[#0077B6]/20 transition-all shadow-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPass(!showCurrentPass)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 cursor-pointer"
                  >
                    {showCurrentPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* New Password Field */}
              <div>
                <label className="block text-xs font-mono text-slate-700 mb-1.5 tracking-wider uppercase font-semibold">
                  New Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#0077B6]" />
                  <input
                    type={showNewPass ? 'text' : 'password'}
                    name="newPassword"
                    required
                    minLength={6}
                    placeholder="Minimum 6 characters"
                    value={passData.newPassword}
                    onChange={handlePassChange}
                    className="w-full pl-10 pr-10 py-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 text-xs font-sans focus:outline-none focus:bg-white focus:border-[#0077B6] focus:ring-2 focus:ring-[#0077B6]/20 transition-all shadow-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPass(!showNewPass)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 cursor-pointer"
                  >
                    {showNewPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Confirm New Password Field */}
              <div>
                <label className="block text-xs font-mono text-slate-700 mb-1.5 tracking-wider uppercase font-semibold">
                  Confirm New Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#0077B6]" />
                  <input
                    type={showConfirmPass ? 'text' : 'password'}
                    name="confirmPassword"
                    required
                    placeholder="Re-enter new password"
                    value={passData.confirmPassword}
                    onChange={handlePassChange}
                    className="w-full pl-10 pr-10 py-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 text-xs font-sans focus:outline-none focus:bg-white focus:border-[#0077B6] focus:ring-2 focus:ring-[#0077B6]/20 transition-all shadow-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPass(!showConfirmPass)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 cursor-pointer"
                  >
                    {showConfirmPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Password Quality & Match Checklist */}
              {passData.newPassword.length > 0 && (
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-[11px] font-mono space-y-1.5">
                  <div className="flex items-center gap-2">
                    {isMinLength ? (
                      <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    ) : (
                      <Info className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                    )}
                    <span className={isMinLength ? 'text-emerald-700 font-semibold' : 'text-slate-600'}>
                      At least 6 characters long
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {isMatching ? (
                      <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    ) : (
                      <Info className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                    )}
                    <span className={isMatching ? 'text-emerald-700 font-semibold' : 'text-slate-600'}>
                      Passwords match
                    </span>
                  </div>
                </div>
              )}

              {/* Submit Password Button */}
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
                    <span>UPDATE PASSWORD</span>
                  </>
                )}
              </button>
            </form>
          )}

          {/* TAB 2: DELETE ACCOUNT CONFIRMATION */}
          {activeTab === 'delete' && (
            <form onSubmit={handleDeleteSubmit} className="space-y-4">
              
              {/* Danger Warning Box (Light Red / Rose Card) */}
              <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 text-xs font-mono space-y-2 shadow-sm">
                <div className="flex items-center gap-2 font-bold text-rose-700 text-sm">
                  <AlertTriangle className="w-5 h-5 shrink-0 text-rose-600 animate-bounce" />
                  <span>DANGER ZONE: PERMANENT ACCOUNT DELETION</span>
                </div>
                <p className="text-[11px] leading-relaxed text-rose-800">
                  This operation is irreversible. Deleting your account will immediately result in:
                </p>
                <ul className="list-disc list-inside space-y-1 text-[11px] text-rose-800/90 pl-1 font-semibold">
                  <li>Permanent revocation of access clearance and privileges</li>
                  <li>Purging of municipal profile data from server records</li>
                  <li>Invalidation of active security tokens</li>
                </ul>
              </div>

              {/* Password Confirmation */}
              <div>
                <label className="block text-xs font-mono text-rose-900 mb-1.5 tracking-wider uppercase font-semibold">
                  Confirm Current Password to Authorize Deletion
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-rose-600" />
                  <input
                    type={showDeletePass ? 'text' : 'password'}
                    required
                    placeholder="Enter current password"
                    value={deletePassword}
                    onChange={(e) => { setDeletePassword(e.target.value); setStatusMsg(null); }}
                    className="w-full pl-10 pr-10 py-3 rounded-xl bg-slate-50 border border-rose-200 text-slate-900 placeholder-slate-400 text-xs font-sans focus:outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 transition-all shadow-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowDeletePass(!showDeletePass)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 cursor-pointer"
                  >
                    {showDeletePass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Confirm Delete Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-red-600 via-rose-600 to-red-600 text-white font-mono text-xs font-bold tracking-wider hover:from-red-700 hover:to-rose-700 transition-all shadow-[0_4px_20px_rgba(225,29,72,0.3)] disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    <span>PERMANENTLY DELETE MY ACCOUNT</span>
                  </>
                )}
              </button>
            </form>
          )}

        </div>

      </div>
    </div>
  );
}

