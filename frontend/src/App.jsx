import React, { useState } from 'react';
import Navbar from './components/Navbar.jsx';
import TrafficEye from './pages/TrafficEye.jsx';
import EnergySentinel from './components/EnergySentinel.jsx';
import CitizenDesk from './pages/CitizenDesk.jsx'; // Make sure the path matches your folder structure
import LoginPage from './components/LoginPage.jsx';     
import SignupPage from './components/SignupPage.jsx';   
import NetworkBackground from './components/NetworkBackground.jsx'; 
import './components/auth.css'; 

export default function App() {
  const [activeTab, setActiveTab] = useState('global-hub');
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('user');
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  });

  const isAuthView = activeTab === 'login' || activeTab === 'signup';

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setActiveTab('login');
  };

  const handleLoginSuccess = (userData) => {
    setUser(userData);
    setActiveTab('citizen-desk');
  };

  const handleSignupSuccess = (userData) => {
    setUser(userData);
    setActiveTab('citizen-desk');
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
        />
      )}

      {/* Dynamic Content Views */}
      <main className={isAuthView ? "" : "p-4"}>
        {activeTab === 'global-hub' && (
          <div className="p-8 text-center text-[#03045E] font-bold text-xl">
            Welcome to Global Hub
          </div>
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

        {/* Login Page */}
        {activeTab === 'login' && (
          <LoginPage 
            onLoginSuccess={handleLoginSuccess}
            onSwitchToSignup={() => setActiveTab('signup')} 
            onBackToHome={() => setActiveTab('global-hub')}
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
            currentUser={user}
            onLogout={handleLogout}
          />
        )}
      </main>
    </div>
  );
}