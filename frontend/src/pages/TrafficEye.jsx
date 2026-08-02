import React, { useState } from 'react';
import Navbar from '../components/Navbar';
import TrafficHero from '../components/TrafficHero';
import TrafficTopDeck from '../components/TrafficTopDeck';
import TrafficWorkspace from '../components/TrafficWorkspace';
import TrafficSimulation from '../components/TrafficSimulation';

export default function TrafficEye({ onNavigate, user, onOpenAuth, onLogout }) {
  const [activeTab, setActiveTab] = useState('analyzer');

  return (
    <div className="min-h-screen bg-white text-slate-900">
      {/* Global Floating Navbar */}
      <Navbar 
        activeTab="traffic-eye" 
        onNavigate={onNavigate} 
        user={user} 
        onOpenAuth={onOpenAuth} 
        onLogout={onLogout} 
      />

      {/* Dynamic View Rendering */}
      <main className="w-full">
        {activeTab === 'analyzer' ? (
          <>
            <TrafficTopDeck onLaunchSimulator={() => setActiveTab('simulator')} />
            <TrafficHero
              onLaunchSimulator={() => setActiveTab('simulator')}
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
          <TrafficSimulation
            onBackToAnalyzer={() => setActiveTab('analyzer')}
            onNavigate={onNavigate}
          />
        )}
      </main>
    </div>
  );
}