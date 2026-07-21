import React, { useState } from 'react';
import Navbar from './components/Navbar';
import TrafficEye from './pages/TrafficEye'; // 👈 Import TrafficEye page component

function App() {
  const [activeTab, setActiveTab] = useState('traffic-eye');

  return (
    <div className="min-h-screen bg-white">
      {/* Dynamic Main App Tab Switcher */}
      {activeTab === 'traffic-eye' ? (
        <TrafficEye /> // 👈 Renders TrafficEye (which has the mode switcher & simulation!)
      ) : (
        <>
          <Navbar activeTab={activeTab} onNavigate={setActiveTab} />
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