import React, { useState } from 'react';
import Navbar from '../components/Navbar';
import TrafficHero from '../components/TrafficHero';
import TrafficWorkspace from '../components/TrafficWorkspace';
import TrafficSimulation from '../components/TrafficSimulation';

export default function TrafficEye({ onNavigate }) {
  // Navigation State inside Traffic Eye
  const [activeTab, setActiveTab] = useState('analyzer');

  return (
    <div className="min-h-screen bg-white">
      {/* Global Navbar */}
      <Navbar activeTab="traffic-eye" onNavigate={onNavigate} />

      {/* Sub-Header Mode Switcher UI Deck */}
      <div className="flex justify-center pt-24 pb-4">
        <div className="bg-[#CAF0F8]/50 backdrop-blur-md p-1.5 rounded-2xl border border-white/80 shadow-md flex gap-2 z-30 relative">
          <button
            type="button"
            onClick={() => setActiveTab('analyzer')}
            className={`px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer ${activeTab === 'analyzer'
                ? 'bg-[#03045E] text-white shadow-lg'
                : 'text-[#03045E] hover:bg-white/60 font-medium'
              }`}
          >
            📷 Live Frame Analyzer
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('simulator')}
            className={`px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer ${activeTab === 'simulator'
                ? 'bg-[#03045E] text-white shadow-lg'
                : 'text-[#03045E] hover:bg-white/60 font-medium'
              }`}
          >
            🚦 4-Way Signal Simulator
          </button>
        </div>
      </div>

      {/* DYNAMIC CONTENT RENDERING */}
      <main className="w-full">
        {activeTab === 'analyzer' ? (
          <>
            <TrafficHero
              onLaunchAnalyzer={() => {
                const workspaceSection = document.getElementById('traffic-workspace-deck');
                if (workspaceSection) {
                  workspaceSection.scrollIntoView({ behavior: 'smooth' });
                }
              }}
              onViewLogs={() => {
                const logsSection = document.getElementById('traffic-logs-deck');
                if (logsSection) {
                  logsSection.scrollIntoView({ behavior: 'smooth' });
                }
              }}
            />
            <div id="traffic-workspace-deck">
              <TrafficWorkspace />
            </div>
          </>
        ) : (
          <div className="pt-2 px-6 pb-12">
            <TrafficSimulation />
          </div>
        )}
      </main>
    </div>
  );
}