import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import TrafficEye from './pages/TrafficEye';
import CitizenDesk from './pages/CitizenDesk';
import AuthPage from './pages/AuthPage';

function App() {
  const [activeTab, setActiveTab] = useState('traffic-eye');
  const [previousTab, setPreviousTab] = useState('traffic-eye');
  const [user, setUser] = useState(null);

  // Restore stored user session on load
  useEffect(() => {
    try {
      const savedUser = localStorage.getItem('neurocity_user');
      if (savedUser) {
        setUser(JSON.parse(savedUser));
      }
    } catch (e) {
      console.warn('Could not parse stored session:', e);
    }
  }, []);

  const handleNavigate = (nextTab) => {
    if (nextTab === 'auth') {
      if (activeTab !== 'auth') {
        setPreviousTab(activeTab);
      }
    }
    setActiveTab(nextTab);
  };

  const handleLoginSuccess = (userData, token) => {
    setUser(userData);
    try {
      localStorage.setItem('neurocity_user', JSON.stringify(userData));
      localStorage.setItem('neurocity_token', token);
    } catch (e) {
      console.warn('Could not save session to localStorage:', e);
    }
  };

  const handleLogout = () => {
    setUser(null);
    try {
      localStorage.removeItem('neurocity_user');
      localStorage.removeItem('neurocity_token');
    } catch (e) {
      console.warn('Could not remove session:', e);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Dynamic Main App Tab Switcher */}
      {activeTab === 'auth' ? (
        <AuthPage 
          onNavigate={handleNavigate} 
          onLoginSuccess={handleLoginSuccess}
          previousTab={previousTab}
          user={user}
          onLogout={handleLogout}
        />
      ) : activeTab === 'traffic-eye' ? (
        <TrafficEye 
          onNavigate={handleNavigate} 
          user={user} 
          onOpenAuth={() => handleNavigate('auth')} 
          onLogout={handleLogout} 
        />
      ) : activeTab === 'citizen-desk' ? (
        <CitizenDesk 
          onNavigate={handleNavigate} 
          user={user} 
          onOpenAuth={() => handleNavigate('auth')} 
          onLogout={handleLogout} 
        />
      ) : (
        <>
          <Navbar 
            activeTab={activeTab} 
            onNavigate={handleNavigate} 
            user={user} 
            onOpenAuth={() => handleNavigate('auth')} 
            onLogout={handleLogout} 
          />
          <div className="flex flex-col items-center justify-center min-h-[60vh] text-[#03045E] font-mono">
            <span className="text-sm font-bold uppercase tracking-widest">
              [ {activeTab.replace('-', ' ')} // SYSTEM STANDBY ]
            </span>
            <span className="text-xs text-slate-400 mt-2">
              Integrating diagnostic streaming pipelines for this municipal node...
            </span>
          </div>
        </>
      )}
    </div>
  );
}

export default App;