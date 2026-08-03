import React, { useState } from 'react';
import Navbar from './components/Navbar.jsx';
import TrafficEye from './pages/TrafficEye.jsx';
import EnergySentinel from './components/EnergySentinel.jsx';
import LoginPage from './components/LoginPage.jsx';     // તમારો લૉગિન પેજ કમ્પોનન્ટ
import SignupPage from './components/SignupPage.jsx';   // તમારો સાઇનઅપ પેજ કમ્પોનન્ટ
import NetworkBackground from './components/NetworkBackground.jsx'; // બેકગ્રાઉન્ડ એનિમેશન
import './components/auth.css'; // ઓથેન્ટિકેશન માટેની CSS ફાઇલ

export default function App() {
  // 'activeTab' માં ટેબ્સ અથવા 'login'/'signup' સેવ થશે
  const [activeTab, setActiveTab] = useState('global-hub');

  // ચેક કરો કે હાલનું વ્યૂ ઓથેન્ટિકેશન પેજ છે કે નહીં
  const isAuthView = activeTab === 'login' || activeTab === 'signup';

  return (
    <div className="min-h-screen bg-white" style={{ position: 'relative', background: isAuthView ? 'var(--bg)' : '#fff' }}>
      
      {/* જો લૉગિન કે સાઇનઅપ હોય તો જ NetworkBackground દેખાશે */}
      {isAuthView && <NetworkBackground />}

      {/* Navbar માં activeTab અને onNavigate પાસ કર્યું છે, 
          જેથી Navbar ના બટનથી લૉગિન/સાઇનઅપ કે અન્ય ટેબ ઓપન થઈ શકે */}
{/* જો લૉગિન કે સાઇનઅપ ન હોય તો જ Navbar દેખાડો */}
{!isAuthView && <Navbar activeTab={activeTab} onNavigate={(tab) => setActiveTab(tab)} />}
      {/* Dynamic Content Views */}
      <main className={isAuthView ? "" : "p-4"}>
        {activeTab === 'global-hub' && (
          <div className="p-8 text-center text-[#03045E] font-bold text-xl">
            Welcome to Global Hub
          </div>
        )}
        
        {activeTab === 'traffic-eye' && <TrafficEye />}
        {activeTab === 'energy-sentinel' && <EnergySentinel />}
        
        {activeTab === 'citizen-desk' && (
          <div className="p-8 text-center text-[#03045E] font-bold text-xl">
            Citizen Desk Portal
          </div>
        )}

        {/* લૉગિન પેજ */}
        {activeTab === 'login' && (
          <LoginPage 
            onSwitchToSignup={() => setActiveTab('signup')} 
            onBackToHome={() => setActiveTab('global-hub')}
          />
        )}

        {/* સાઇનઅપ પેજ */}
        {activeTab === 'signup' && (
          <SignupPage 
            onSwitchToLogin={() => setActiveTab('login')} 
            onBackToHome={() => setActiveTab('global-hub')}
          />
        )}
      </main>
    </div>
  );
}