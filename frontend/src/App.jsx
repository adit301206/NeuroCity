import React, { useState } from 'react';
import Navbar from './components/Navbar';
import TrafficHero from './components/TrafficHero';
import TrafficWorkspace from './components/TrafficWorkspace';

function App() {
  const [activeTab, setActiveTab] = useState('traffic-eye');

  return (
    <div className="min-h-screen bg-white">
      <Navbar activeTab={activeTab} onNavigate={setActiveTab} />
      
      {activeTab === 'traffic-eye' ? (
        <>
          <TrafficHero 
            onLaunchAnalyzer={() => console.log('Launch Analyzer')} 
            onViewLogs={() => console.log('View Active Logs')} 
          />
          <TrafficWorkspace />
        </>
      ) : (
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-[#03045E] font-mono">
          <span className="text-sm font-bold uppercase tracking-widest">[ {activeTab.replace('-', ' ')} // SYSTEM STANDBY ]</span>
          <span className="text-xs text-slate-400 mt-2">Integrating diagnostic streaming pipelines for this municipal node...</span>
        </div>
      )}
    </div>
  );
}

export default App;
