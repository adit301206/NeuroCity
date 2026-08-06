import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar.jsx';
import TrafficEye from './pages/TrafficEye.jsx';
import EnergySentinel from './components/EnergySentinel.jsx';
import LoginPage from './components/LoginPage.jsx';     // તમારો લૉગિન પેજ કમ્પોનન્ટ
import SignupPage from './components/SignupPage.jsx';   // તમારો સાઇનઅપ પેજ કમ્પોનન્ટ
import SettingsPage from './pages/SettingsPage.jsx';   // ફૂલ પેજ સેટીંગ્સ કમ્પોનન્ટ
import NetworkBackground from './components/NetworkBackground.jsx'; // બેકગ્રાઉન્ડ એનિમેશન
import './components/auth.css'; // ઓથેન્ટિકેશન માટેની CSS ફાઇલ
import CitizenDesk from './pages/CitizenDesk.jsx'; // Make sure the path matches your folder structure
import GlobalHub from './pages/GlobalHub.jsx';

export default function App() {
  const [activeTab, setActiveTab] = useState('global-hub');
  const [settingsSubTab, setSettingsSubTab] = useState('profile');
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('user');
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  });

  const [unreadCount, setUnreadCount] = useState(0);

  const fetchUnreadCount = async () => {
    if (!user) {
      setUnreadCount(0);
      return;
    }
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const res = await fetch('http://localhost:5000/api/complaints/notifications/my-alerts', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const result = await res.json();
      if (res.ok && result.status === 'success') {
        const alerts = result.data || [];
        const unread = alerts.filter(notif => notif.isRead === false).length;
        setUnreadCount(unread);
      }
    } catch (err) {
      console.error('Error fetching unread notifications count:', err);
    }
  };

  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 15000);
    return () => clearInterval(interval);
  }, [user]);

  const isAuthView = activeTab === 'login' || activeTab === 'signup';

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setActiveTab('login');
  };

  const handleLoginSuccess = (userData) => {
    setUser(userData);
    setActiveTab('global-hub');
  };

  const handleSignupSuccess = (userData) => {
    setUser(userData);
    setActiveTab('global-hub');
  };

  const handleOpenSettings = (subTab = 'profile') => {
    setSettingsSubTab(subTab);
    setActiveTab('settings');
  };

  return (
    <div className="min-h-screen bg-white" style={{ position: 'relative', background: isAuthView ? 'var(--bg)' : '#fff' }}>
      
      {isAuthView && <NetworkBackground />}

      {!isAuthView && (
        <Navbar 
          activeTab={activeTab} 
          onNavigate={(tab) => setActiveTab(tab)} 
          currentUser={user} 
          onLogout={handleLogout} 
          onOpenSettings={handleOpenSettings}
          unreadNotificationsCount={unreadCount}
        />
      )}

      {/* Dynamic Content Views */}
      <main className={isAuthView ? "" : "p-0"}>
        {activeTab === 'global-hub' && (
          <GlobalHub onNavigate={(tab) => setActiveTab(tab)} />
        )}
        
        {activeTab === 'traffic-eye' && <TrafficEye />}
        {activeTab === 'energy-sentinel' && <EnergySentinel />}
        
        {/* Render CitizenDesk Component */}
        {activeTab === 'citizen-desk' && (
          <CitizenDesk
            onNavigate={(tab) => setActiveTab(tab)}
            user={user}
            onOpenAuth={() => setActiveTab('login')}
            onLogout={handleLogout}
          />
        )}

        {/* full Standalone Settings Page */}
        {activeTab === 'settings' && (
          <SettingsPage 
            currentUser={user}
            onUpdateUser={(updated) => setUser(updated)}
            onLogout={handleLogout}
            onNavigate={(tab) => setActiveTab(tab)}
            initialSubTab={settingsSubTab}
            onRefreshNotifications={fetchUnreadCount}
          />
        )}

        {/* લૉગિન પેજ */}
        {/* Login Page */}
        {activeTab === 'login' && (
          <LoginPage 
            onLoginSuccess={handleLoginSuccess}
            onSwitchToSignup={() => setActiveTab('signup')} 
            onBackToHome={() => setActiveTab('global-hub')}
            onNavigate={(tab) => setActiveTab(tab)}
            activeTab={activeTab}
            currentUser={user}
            onLogout={handleLogout}
          />
        )}

        {/* Signup Page */}
        {activeTab === 'signup' && (
          <SignupPage 
            onSignupSuccess={handleSignupSuccess}
            onSwitchToLogin={() => setActiveTab('login')} 
            onBackToHome={() => setActiveTab('global-hub')}
            onNavigate={(tab) => setActiveTab(tab)}
            activeTab={activeTab}
            currentUser={user}
            onLogout={handleLogout}
          />
        )}
      </main>
    </div>
  );
}