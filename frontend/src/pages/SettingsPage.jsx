import React, { useState, useEffect } from 'react';
import { 
  User, KeyRound, Trash2, Shield, Lock, CheckCircle2, AlertCircle, Eye, EyeOff, UserCheck, Mail, BadgeCheck, Sparkles, AlertTriangle, Check, Info, ArrowLeft, Bell
} from 'lucide-react';
import { changePasswordLocal, deleteAccountLocal, updateProfileLocal } from '../utils/localAuth';

export default function SettingsPage({ currentUser, onUpdateUser, onLogout, onNavigate, initialSubTab = 'profile', onRefreshNotifications }) {
  const [activeSubTab, setActiveSubTab] = useState(initialSubTab);

  // Profile Details State
  const [profileData, setProfileData] = useState({
    name: '',
    email: ''
  });

  // Notifications State
  const [notifications, setNotifications] = useState([]);
  const [loadingNotifications, setLoadingNotifications] = useState(false);
  const [selectedNotif, setSelectedNotif] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleNotificationClick = async (notif) => {
    setSelectedNotif(notif);
    setIsModalOpen(true);

    if (!notif.isRead) {
      const token = localStorage.getItem('token');
      if (!token) return;

      try {
        const res = await fetch(`http://localhost:5000/api/complaints/notifications/${notif._id || notif.id}/read`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        });
        const result = await res.json();
        if (res.ok && result.status === 'success') {
          // Update local state
          setNotifications(prev => prev.map(n => (n._id === notif._id || n.id === notif.id) ? { ...n, isRead: true } : n));
          // Refresh navbar count
          if (onRefreshNotifications) {
            onRefreshNotifications();
          }
        }
      } catch (err) {
        console.error('Error marking notification as read:', err);
      }
    }
  };

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
    if (currentUser) {
      setProfileData({
        name: currentUser.name || '',
        email: currentUser.email || ''
      });
    }
  }, [currentUser]);

  useEffect(() => {
    if (activeSubTab === 'notifications' && currentUser) {
      const fetchNotifications = async () => {
        const token = localStorage.getItem('token');
        if (!token) return;
        setLoadingNotifications(true);
        try {
          const res = await fetch('http://localhost:5000/api/complaints/notifications/my-alerts', {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          const result = await res.json();
          if (res.ok && result.status === 'success') {
            setNotifications(result.data || []);
          }
        } catch (err) {
          console.error('Error fetching notifications:', err);
        } finally {
          setLoadingNotifications(false);
        }
      };
      fetchNotifications();
    }
  }, [activeSubTab, currentUser]);

  useEffect(() => {
    if (initialSubTab) {
      setActiveSubTab(initialSubTab);
      setStatusMsg(null);
    }
  }, [initialSubTab]);

  if (!currentUser) {
    return (
      <div className="max-w-4xl mx-auto py-12 px-4 text-center">
        <p className="text-slate-600 font-mono">Please log in to access account settings.</p>
        <button 
          onClick={() => onNavigate && onNavigate('login')}
          className="mt-4 px-4 py-2 bg-[#0077B6] text-white rounded-xl font-mono text-xs font-bold"
        >
          Go to Sign In
        </button>
      </div>
    );
  }

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
      const response = await fetch('http://localhost:5000/api/users/profile', {
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
      const response = await fetch('http://localhost:5000/api/users/password', {
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
      const response = await fetch('http://localhost:5000/api/users/profile', {
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
    <div className="max-w-6xl mx-auto my-6 p-4 sm:p-6 lg:p-8 animate-[fadeIn_0.25s_ease-out]">
      
      {/* Top Banner & Navigation Header */}
      <div className="mb-8 p-6 rounded-3xl bg-gradient-to-r from-[#03045E] via-[#023E8A] to-[#0077B6] text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="relative w-16 h-16 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-[#48CAE4] shadow-md shrink-0">
            <User className="w-8 h-8 text-[#48CAE4]" />
            <Sparkles className="w-4 h-4 absolute -top-1 -right-1 text-amber-300 animate-spin" />
          </div>
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-black text-white tracking-tight font-sans">
                Account Settings & Profile
              </h1>
              <span className={`text-xs px-3 py-1 rounded-full font-mono font-bold tracking-wider uppercase border shadow-sm ${
                currentUser.role === 'admin' 
                  ? 'bg-rose-500/30 text-rose-200 border-rose-400/50' 
                  : 'bg-white/20 text-[#CAF0F8] border-white/30'
              }`}>
                {currentUser.role === 'admin' ? 'City Admin Clearance' : 'Citizen Access'}
              </span>
            </div>
            <p className="text-sm text-[#CAF0F8]/90 font-mono tracking-wide mt-1">
              Manage your personal details, security credentials, and account options
            </p>
          </div>
        </div>

        {onNavigate && (
          <button
            onClick={() => onNavigate('global-hub')}
            className="self-start md:self-center px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-mono text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Hub</span>
          </button>
        )}
      </div>

      {/* Main Standalone Grid: Sidebar Navigation + Sub-Page Content */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Sub-Page Sidebar Navigation */}
        <div className="lg:col-span-4 space-y-3">
          <div className="p-4 rounded-3xl bg-white border border-slate-200/90 shadow-md space-y-2">
            <p className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider px-3 mb-2">
              Settings Options
            </p>

            {/* Option 1: Profile Details */}
            <button
              type="button"
              onClick={() => { setActiveSubTab('profile'); setStatusMsg(null); }}
              className={`w-full p-3.5 rounded-2xl text-xs font-mono font-bold tracking-wider transition-all cursor-pointer flex items-center justify-between ${
                activeSubTab === 'profile'
                  ? 'bg-gradient-to-r from-[#03045E] via-[#023E8A] to-[#0077B6] text-white shadow-md border border-[#0077B6]/50'
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200/80'
              }`}
            >
              <div className="flex items-center gap-3">
                <User className={`w-4 h-4 ${activeSubTab === 'profile' ? 'text-white' : 'text-[#0077B6]'}`} />
                <span>PROFILE DETAILS</span>
              </div>
              {activeSubTab === 'profile' && <Check className="w-4 h-4 text-[#48CAE4]" />}
            </button>

            {/* Option 2: Change Password */}
            <button
              type="button"
              onClick={() => { setActiveSubTab('password'); setStatusMsg(null); }}
              className={`w-full p-3.5 rounded-2xl text-xs font-mono font-bold tracking-wider transition-all cursor-pointer flex items-center justify-between ${
                activeSubTab === 'password'
                  ? 'bg-gradient-to-r from-[#03045E] via-[#023E8A] to-[#0077B6] text-white shadow-md border border-[#0077B6]/50'
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200/80'
              }`}
            >
              <div className="flex items-center gap-3">
                <KeyRound className={`w-4 h-4 ${activeSubTab === 'password' ? 'text-white' : 'text-[#0077B6]'}`} />
                <span>CHANGE PASSWORD</span>
              </div>
              {activeSubTab === 'password' && <Check className="w-4 h-4 text-[#48CAE4]" />}
            </button>

            {/* Option 3: Notifications */}
            <button
              type="button"
              onClick={() => { setActiveSubTab('notifications'); setStatusMsg(null); }}
              className={`w-full p-3.5 rounded-2xl text-xs font-mono font-bold tracking-wider transition-all cursor-pointer flex items-center justify-between ${
                activeSubTab === 'notifications'
                  ? 'bg-gradient-to-r from-[#03045E] via-[#023E8A] to-[#0077B6] text-white shadow-md border border-[#0077B6]/50'
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200/80'
              }`}
            >
              <div className="flex items-center gap-3">
                <Bell className={`w-4 h-4 ${activeSubTab === 'notifications' ? 'text-white' : 'text-[#0077B6]'}`} />
                <span>NOTIFICATIONS</span>
              </div>
              {activeSubTab === 'notifications' && <Check className="w-4 h-4 text-[#48CAE4]" />}
            </button>

            {/* Option 4: Delete Account */}
            <button
              type="button"
              onClick={() => { setActiveSubTab('delete'); setStatusMsg(null); }}
              className={`w-full p-3.5 rounded-2xl text-xs font-mono font-bold tracking-wider transition-all cursor-pointer flex items-center justify-between ${
                activeSubTab === 'delete'
                  ? 'bg-rose-600 text-white shadow-md border border-rose-600'
                  : 'bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200/80'
              }`}
            >
              <div className="flex items-center gap-3">
                <Trash2 className={`w-4 h-4 ${activeSubTab === 'delete' ? 'text-white' : 'text-rose-600'}`} />
                <span>DELETE ACCOUNT</span>
              </div>
              {activeSubTab === 'delete' && <Check className="w-4 h-4 text-white" />}
            </button>
          </div>

          {/* Quick User Summary Info Box */}
          <div className="p-5 rounded-3xl bg-slate-50 border border-slate-200/90 text-xs font-mono text-slate-600 space-y-2 shadow-sm">
            <div className="flex items-center gap-2 font-bold text-slate-800">
              <BadgeCheck className="w-4 h-4 text-[#0077B6]" />
              <span>Active Account Status</span>
            </div>
            <p className="text-[11px] leading-relaxed text-slate-600">
              Logged in as <strong className="text-slate-900 font-sans">{currentUser.name || currentUser.email}</strong>
            </p>
            <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between text-[10px] text-slate-500">
              <span>Security Token: Active</span>
              <span className="text-emerald-600 font-bold">● Protected</span>
            </div>
          </div>
        </div>

        {/* Right Area: Dedicated Sub-Page Content */}
        <div className="lg:col-span-8">
          <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200/90 shadow-lg space-y-6">
            
            {/* Status Message Notification Banner */}
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

            {/* SUB-PAGE 1: VIEW DETAILS & EDIT PROFILE */}
            {activeSubTab === 'profile' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-bold text-slate-900 font-sans">
                    Personal Profile Details
                  </h2>
                  <p className="text-xs text-slate-500 font-mono mt-0.5">
                    View and update your registered account credentials
                  </p>
                </div>

                <form onSubmit={handleProfileSubmit} className="space-y-5">
                  <div>
                    <label className="block text-xs font-mono text-slate-700 mb-1.5 tracking-wider uppercase font-semibold">
                      Full Name
                    </label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#0077B6]" />
                      <input
                        type="text"
                        name="name"
                        required
                        placeholder="Enter your full name"
                        value={profileData.name}
                        onChange={handleProfileChange}
                        className="w-full pl-11 pr-4 py-3.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 text-xs font-sans focus:outline-none focus:bg-white focus:border-[#0077B6] focus:ring-2 focus:ring-[#0077B6]/20 transition-all shadow-sm"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-mono text-slate-700 mb-1.5 tracking-wider uppercase font-semibold">
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#0077B6]" />
                      <input
                        type="email"
                        name="email"
                        required
                        placeholder="name@neurocity.gov"
                        value={profileData.email}
                        onChange={handleProfileChange}
                        className="w-full pl-11 pr-4 py-3.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 text-xs font-sans focus:outline-none focus:bg-white focus:border-[#0077B6] focus:ring-2 focus:ring-[#0077B6]/20 transition-all shadow-sm"
                      />
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs font-mono">
                    <div className="flex items-center gap-2">
                      <BadgeCheck className="w-5 h-5 text-[#0077B6]" />
                      <span className="text-slate-700 font-semibold">System Authorization Role:</span>
                    </div>
                    <span className={`px-3 py-1 rounded-full font-bold uppercase tracking-wider text-[11px] ${
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
                    className="w-full py-4 rounded-xl bg-gradient-to-r from-[#03045E] via-[#023E8A] to-[#0077B6] text-white font-mono text-xs font-bold tracking-wider hover:from-[#023E8A] hover:to-[#0096C7] transition-all shadow-md disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
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
              </div>
            )}

            {/* SUB-PAGE 2: CHANGE PASSWORD */}
            {activeSubTab === 'password' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-bold text-slate-900 font-sans">
                    Change Password Page
                  </h2>
                  <p className="text-xs text-slate-500 font-mono mt-0.5">
                    Update your security password to protect your account access
                  </p>
                </div>

                <form onSubmit={handlePasswordSubmit} className="space-y-5">
                  <div>
                    <label className="block text-xs font-mono text-slate-700 mb-1.5 tracking-wider uppercase font-semibold">
                      Current Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#0077B6]" />
                      <input
                        type={showCurrentPass ? 'text' : 'password'}
                        name="currentPassword"
                        required
                        placeholder="Enter current password"
                        value={passData.currentPassword}
                        onChange={handlePassChange}
                        className="w-full pl-11 pr-11 py-3.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 text-xs font-sans focus:outline-none focus:bg-white focus:border-[#0077B6] focus:ring-2 focus:ring-[#0077B6]/20 transition-all shadow-sm"
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrentPass(!showCurrentPass)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 cursor-pointer"
                      >
                        {showCurrentPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-mono text-slate-700 mb-1.5 tracking-wider uppercase font-semibold">
                      New Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#0077B6]" />
                      <input
                        type={showNewPass ? 'text' : 'password'}
                        name="newPassword"
                        required
                        minLength={6}
                        placeholder="Minimum 6 characters"
                        value={passData.newPassword}
                        onChange={handlePassChange}
                        className="w-full pl-11 pr-11 py-3.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 text-xs font-sans focus:outline-none focus:bg-white focus:border-[#0077B6] focus:ring-2 focus:ring-[#0077B6]/20 transition-all shadow-sm"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPass(!showNewPass)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 cursor-pointer"
                      >
                        {showNewPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-mono text-slate-700 mb-1.5 tracking-wider uppercase font-semibold">
                      Confirm New Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#0077B6]" />
                      <input
                        type={showConfirmPass ? 'text' : 'password'}
                        name="confirmPassword"
                        required
                        placeholder="Re-enter new password"
                        value={passData.confirmPassword}
                        onChange={handlePassChange}
                        className="w-full pl-11 pr-11 py-3.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 text-xs font-sans focus:outline-none focus:bg-white focus:border-[#0077B6] focus:ring-2 focus:ring-[#0077B6]/20 transition-all shadow-sm"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPass(!showConfirmPass)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 cursor-pointer"
                      >
                        {showConfirmPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {passData.newPassword.length > 0 && (
                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono space-y-2">
                      <div className="flex items-center gap-2">
                        {isMinLength ? (
                          <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                        ) : (
                          <Info className="w-4 h-4 text-amber-500 shrink-0" />
                        )}
                        <span className={isMinLength ? 'text-emerald-700 font-semibold' : 'text-slate-600'}>
                          At least 6 characters long
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {isMatching ? (
                          <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                        ) : (
                          <Info className="w-4 h-4 text-amber-500 shrink-0" />
                        )}
                        <span className={isMatching ? 'text-emerald-700 font-semibold' : 'text-slate-600'}>
                          Passwords match
                        </span>
                      </div>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-4 rounded-xl bg-gradient-to-r from-[#03045E] via-[#023E8A] to-[#0077B6] text-white font-mono text-xs font-bold tracking-wider hover:from-[#023E8A] hover:to-[#0096C7] transition-all shadow-md disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
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
              </div>
            )}

            {/* SUB-PAGE 3: NOTIFICATIONS */}
            {activeSubTab === 'notifications' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-bold text-slate-900 font-sans flex items-center gap-2">
                    <Bell className="w-5 h-5 text-[#0077B6]" />
                    <span>Citizen Notifications & Alerts</span>
                  </h2>
                  <p className="text-xs text-slate-500 font-mono mt-0.5">
                    Real-time status updates and triage alerts for your submitted municipal tickets
                  </p>
                </div>

                {loadingNotifications ? (
                  <div className="flex flex-col items-center justify-center py-12 space-y-3">
                    <span className="w-8 h-8 border-4 border-[#0077B6] border-t-transparent rounded-full animate-spin"></span>
                    <p className="text-xs font-mono text-slate-500">Retrieving system alerts...</p>
                  </div>
                ) : notifications.length === 0 ? (
                  <div className="p-8 rounded-2xl border border-dashed border-[#0077B6]/30 text-center bg-slate-50 space-y-2">
                    <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto opacity-80" />
                    <h3 className="text-xs font-mono font-bold text-slate-700">ALL CLEAR</h3>
                    <p className="text-xs text-slate-500 max-w-sm mx-auto font-sans">
                      You have no active status notifications. Updates will appear here when an operator or administrator initiates action on your complaints.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {notifications.map((notif) => {
                      const notifId = notif._id || notif.id;
                      const notifTime = notif.createdAt 
                        ? new Date(notif.createdAt).toLocaleDateString() + ' ' + new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
                        : 'Just now';

                      return (
                        <div
                          key={notifId}
                          onClick={() => handleNotificationClick(notif)}
                          className={`p-5 rounded-2xl border hover:border-[#0077B6] hover:shadow-md transition-all space-y-2 animate-[fadeIn_0.2s_ease-out] cursor-pointer relative overflow-hidden ${
                            notif.isRead 
                              ? 'bg-slate-50 border-slate-200/80 text-slate-800' 
                              : 'bg-blue-50/40 border-blue-200 text-blue-900 shadow-sm'
                          }`}
                        >
                          {/* Unread Indicator Dot */}
                          {!notif.isRead && (
                            <span className="absolute top-3 right-3 w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse"></span>
                          )}
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-mono font-bold text-[#023E8A]">
                              {notif.title}
                            </span>
                            <span className="text-[10px] font-mono text-slate-500">
                              {notifTime}
                            </span>
                          </div>
                          <p className="text-xs text-slate-700 font-sans leading-relaxed font-medium">
                            {notif.message}
                          </p>
                          {notif.complaint && (
                            <div className="mt-2 pt-2 border-t border-slate-200/60 flex items-center justify-between text-[10px] font-mono text-slate-500">
                              <span>Complaint Ref: {typeof notif.complaint === 'object' ? notif.complaint._id : notif.complaint}</span>
                              {notif.complaint.status && (
                                <span className={`px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                                  notif.complaint.status === 'Resolved' 
                                    ? 'bg-emerald-100 text-emerald-800' 
                                    : notif.complaint.status === 'In Progress'
                                      ? 'bg-amber-100 text-amber-800'
                                      : 'bg-rose-100 text-rose-800'
                                }`}>
                                  {notif.complaint.status}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* SUB-PAGE 4: DELETE ACCOUNT */}
            {activeSubTab === 'delete' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-bold text-rose-700 font-sans">
                    Delete Account Page
                  </h2>
                  <p className="text-xs text-rose-600 font-mono mt-0.5">
                    Permanent account removal and access clearance revocation
                  </p>
                </div>

                <form onSubmit={handleDeleteSubmit} className="space-y-5">
                  <div className="p-5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 text-xs font-mono space-y-3 shadow-sm">
                    <div className="flex items-center gap-2 font-bold text-rose-700 text-sm">
                      <AlertTriangle className="w-5 h-5 shrink-0 text-rose-600 animate-bounce" />
                      <span>CRITICAL WARNING: IRREVERSIBLE ACTION</span>
                    </div>
                    <p className="text-xs leading-relaxed text-rose-800">
                      Deleting your account will immediately purge your credentials from NeuroCity server databases:
                    </p>
                    <ul className="list-disc list-inside space-y-1.5 text-xs text-rose-800 font-semibold pl-1">
                      <li>Permanent revocation of access clearance and privileges</li>
                      <li>Purging of user records from Mongo database and local storage</li>
                      <li>Immediate invalidation of active security tokens</li>
                    </ul>
                  </div>

                  <div>
                    <label className="block text-xs font-mono text-rose-900 mb-1.5 tracking-wider uppercase font-semibold">
                      Confirm Current Password to Authorize Deletion
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-rose-600" />
                      <input
                        type={showDeletePass ? 'text' : 'password'}
                        required
                        placeholder="Enter current password to authorize"
                        value={deletePassword}
                        onChange={(e) => { setDeletePassword(e.target.value); setStatusMsg(null); }}
                        className="w-full pl-11 pr-11 py-3.5 rounded-xl bg-slate-50 border border-rose-200 text-slate-900 placeholder-slate-400 text-xs font-sans focus:outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 transition-all shadow-sm"
                      />
                      <button
                        type="button"
                        onClick={() => setShowDeletePass(!showDeletePass)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 cursor-pointer"
                      >
                        {showDeletePass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-4 rounded-xl bg-gradient-to-r from-red-600 via-rose-600 to-red-600 text-white font-mono text-xs font-bold tracking-wider hover:from-red-700 hover:to-rose-700 transition-all shadow-md disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
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
              </div>
            )}

          </div>
        </div>

      </div>

      {/* Complaint Detail Modal */}
      {isModalOpen && selectedNotif && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-[fadeIn_0.2s_ease-out]">
          <div 
            className="w-full max-w-lg rounded-3xl bg-white border border-slate-200 shadow-2xl p-6 relative overflow-hidden font-sans animate-[scaleIn_0.2s_ease-out]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top Glowing Deco Line */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#03045E] via-[#023E8A] to-[#0077B6]"></div>

            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
              <div className="flex items-center gap-2">
                <Bell className="w-5 h-5 text-[#0077B6]" />
                <h3 className="text-base font-bold text-slate-900 font-mono tracking-wider uppercase">
                  Alert Details
                </h3>
              </div>
              <button 
                onClick={() => { setIsModalOpen(false); setSelectedNotif(null); }}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-all cursor-pointer font-bold text-sm"
              >
                ✕
              </button>
            </div>

            {/* Modal Content */}
            <div className="space-y-4 font-mono text-xs text-slate-800">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-150 space-y-1">
                <div className="text-[10px] text-slate-400 font-bold uppercase">Update Title</div>
                <div className="font-bold text-sm text-[#023E8A]">{selectedNotif.title}</div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-150 space-y-1">
                <div className="text-[10px] text-slate-400 font-bold uppercase">Message Detail</div>
                <p className="text-xs font-sans text-slate-700 leading-relaxed font-medium">
                  {selectedNotif.message}
                </p>
              </div>

              {selectedNotif.complaint && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-150 space-y-0.5">
                    <div className="text-[10px] text-slate-400 font-bold uppercase">Ticket ID</div>
                    <div className="font-bold truncate text-slate-900">{selectedNotif.complaint._id || selectedNotif.complaint.id}</div>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-150 space-y-0.5">
                    <div className="text-[10px] text-slate-400 font-bold uppercase">City Location</div>
                    <div className="font-bold truncate text-slate-900">{selectedNotif.complaint.location || 'Surat'}</div>
                  </div>
                </div>
              )}

              {selectedNotif.complaint && selectedNotif.complaint.status && (
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-150 flex items-center justify-between">
                  <span className="text-[10px] text-slate-400 font-bold uppercase">Resolution Status:</span>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                    selectedNotif.complaint.status === 'Resolved' 
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' 
                      : selectedNotif.complaint.status === 'In Progress'
                        ? 'bg-amber-100 text-amber-800 border border-amber-300'
                        : 'bg-rose-100 text-rose-800 border border-rose-300'
                  }`}>
                    {selectedNotif.complaint.status}
                  </span>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="mt-6 pt-4 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => { setIsModalOpen(false); setSelectedNotif(null); }}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#03045E] via-[#023E8A] to-[#0077B6] text-white font-mono text-xs font-bold tracking-wider hover:from-[#023E8A] hover:to-[#0077B6] transition-all shadow-md cursor-pointer"
              >
                CLOSE DETAIL
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scaleIn {
          from { transform: scale(0.95); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
