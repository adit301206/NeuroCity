import React, { useState } from 'react';
import { ChevronDown, Shield, Settings, LogOut, Terminal } from 'lucide-react';

export default function Navbar({ onNavigate, activeTab }) {
  const [profileOpen, setProfileOpen] = useState(false);

  const links = [
    { id: 'global-hub', label: 'Global Hub' },
    { id: 'traffic-eye', label: 'Traffic Eye' },
    { id: 'energy-sentinel', label: 'Energy Sentinel' },
    { id: 'citizen-desk', label: 'Citizen Desk' },
  ];

  return (
    <nav className="mx-6 mt-4 p-4 rounded-2xl bg-[#03045E]/95 backdrop-blur-md border border-[#48CAE4]/30 shadow-[0_10px_30px_rgba(3,4,94,0.3),0_0_25px_rgba(72,202,228,0.15)] flex items-center justify-between select-none relative z-50">
      
      {/* Left Side - The NeuroCity Branding Concept */}
      <div className="flex items-center gap-3 cursor-pointer" onClick={() => onNavigate && onNavigate('global-hub')}>
        {/* Digital Twin Urban Nexus Core SVG Asset */}
        <div className="relative flex items-center justify-center w-9 h-9 rounded-lg bg-[#023E8A]/50 border border-[#0096C7]/50 shadow-[0_0_10px_rgba(72,202,228,0.3)]">
          <svg 
            className="w-6 h-6 text-[#48CAE4] drop-shadow-[0_0_8px_rgba(72,202,228,0.7)]" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="1.5" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          >
            {/* Pipelines */}
            <line x1="12" y1="4" x2="12" y2="8" />
            <line x1="12" y1="16" x2="12" y2="20" />
            <line x1="4" y1="12" x2="8" y2="12" />
            <line x1="16" y1="12" x2="20" y2="12" />
            
            {/* Satellite Vertices */}
            <circle cx="12" cy="4" r="1.5" className="fill-[#48CAE4] animate-pulse" />
            <circle cx="12" cy="20" r="1.5" className="fill-[#48CAE4] animate-pulse" />
            <circle cx="4" cy="12" r="1.5" className="fill-[#48CAE4] animate-pulse" />
            <circle cx="20" cy="12" r="1.5" className="fill-[#48CAE4] animate-pulse" />
            
            {/* Central Diamond Node */}
            <polygon points="12,8 16,12 12,16 8,12" className="fill-[#48CAE4]/20 stroke-[#48CAE4] stroke-[1.5] animate-pulse" />
            <circle cx="12" cy="12" r="1" className="fill-[#48CAE4]" />
          </svg>
        </div>

        {/* Branding Typography & Version Details */}
        <div className="flex flex-col">
          <span className="font-sans text-2xl font-bold tracking-widest uppercase bg-clip-text text-transparent bg-gradient-to-r from-white via-white to-[#48CAE4] leading-none">
            NeuroCity
          </span>
          <span className="font-mono text-[10px] tracking-widest text-[#CAF0F8]/40 leading-none mt-1 uppercase">
            NC_OS // ENGINE_v2.0
          </span>
        </div>
      </div>

      {/* Center Area - Unified Command Links */}
      <div className="flex items-center gap-8">
        {links.map((link) => {
          const isActive = activeTab === link.id;
          return (
            <button
              key={link.id}
              onClick={() => onNavigate && onNavigate(link.id)}
              className="relative py-1 text-sm font-medium tracking-wide transition-all duration-300 cursor-pointer group"
            >
              <span className={`transition-colors duration-300 ${
                isActive ? 'text-[#48CAE4] font-semibold' : 'text-[#CAF0F8]/70 group-hover:text-[#48CAE4]'
              }`}>
                {link.label}
              </span>
              
              {/* Micro dot indicator beam */}
              <span className={`absolute bottom-[-8px] left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-[#48CAE4] rounded-full transition-all duration-300 shadow-[0_0_8px_#48CAE4] ${
                isActive ? 'scale-100 opacity-100' : 'scale-0 opacity-0 group-hover:scale-100 group-hover:opacity-100'
              }`}></span>
            </button>
          );
        })}
      </div>

      {/* Right Side - Operational Status & Profile Deck */}
      <div className="flex items-center gap-6">
        
        {/* System Status Ping Widget */}
        <div className="flex items-center gap-2 px-3 py-1 rounded bg-[#023E8A]/40 border border-[#0077B6]/30">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500 shadow-[0_0_8px_#10B981]"></span>
          </span>
          <span className="font-mono text-[10px] tracking-wider text-[#CAF0F8]/80 font-medium">
            SYS_STATUS: <span className="text-emerald-400">ACTIVE</span>
          </span>
        </div>

        {/* Profile Deck with Dropdown Trigger */}
        <div className="relative">
          <div 
            onClick={() => setProfileOpen(!profileOpen)}
            className="flex items-center gap-2 cursor-pointer group"
          >
            {/* Circular Avatar Container with Cyan Ring */}
            <div className="w-8 h-8 rounded-full border-2 border-[#48CAE4]/60 overflow-hidden bg-[#023E8A] flex items-center justify-center transition-all duration-300 group-hover:border-[#90E0EF] shadow-[0_0_8px_rgba(72,202,228,0.2)]">
              {/* Elegant futuristic line-art avatar representation */}
              <svg viewBox="0 0 32 32" className="w-6 h-6 text-[#90E0EF]/80" fill="currentColor">
                <path d="M16 4a6 6 0 100 12 6 6 0 000-12zm-8 16c-2.2 0-4 1.8-4 4v4h24v-4c0-2.2-1.8-4-4-4H8z" />
              </svg>
            </div>
            
            {/* Dropdown Arrow */}
            <ChevronDown 
              className={`w-4 h-4 text-[#CAF0F8]/80 transition-transform duration-300 group-hover:text-white ${
                profileOpen ? 'rotate-180' : ''
              }`}
            />
          </div>

          {/* Interactive Dropdown Menu */}
          {profileOpen && (
            <>
              {/* Transparent overlay to close dropdown */}
              <div 
                className="fixed inset-0 z-40" 
                onClick={() => setProfileOpen(false)}
              />
              
              <div className="absolute right-0 mt-3 w-56 rounded-xl bg-[#023E8A] border border-[#0077B6] shadow-[0_10px_25px_rgba(3,4,94,0.6),0_0_15px_rgba(72,202,228,0.1)] p-1.5 z-50 animate-[fadeIn_0.2s_ease-out] text-[#CAF0F8]">
                {/* Header segment */}
                <div className="px-3 py-2 border-b border-[#0077B6]/40 text-xs font-mono text-[#CAF0F8]/50">
                  ADMIN_LEVEL_01
                </div>

                {/* Menu items */}
                <button 
                  onClick={() => { setProfileOpen(false); }}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm hover:bg-[#0077B6]/40 hover:text-white transition-all text-left mt-1 cursor-pointer"
                >
                  <Shield className="w-4 h-4 text-[#48CAE4]" />
                  <span>Security Console</span>
                </button>
                <button 
                  onClick={() => { setProfileOpen(false); }}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm hover:bg-[#0077B6]/40 hover:text-white transition-all text-left cursor-pointer"
                >
                  <Settings className="w-4 h-4 text-[#48CAE4]" />
                  <span>Platform Config</span>
                </button>
                <button 
                  onClick={() => { setProfileOpen(false); }}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm hover:bg-[#0077B6]/40 hover:text-white transition-all text-left cursor-pointer"
                >
                  <Terminal className="w-4 h-4 text-[#48CAE4]" />
                  <span>Logs Terminal</span>
                </button>
                
                <div className="h-px bg-[#0077B6]/40 my-1" />
                
                <button 
                  onClick={() => { setProfileOpen(false); }}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm hover:bg-red-500/20 hover:text-red-300 transition-all text-left text-red-400 cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Disconnect</span>
                </button>
              </div>
            </>
          )}
        </div>

      </div>
    </nav>
  );
}
