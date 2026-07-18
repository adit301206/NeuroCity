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
      
      {/* Left Side - The NeuroCity Integrated Artistic Signature */}
      <div 
        className="flex items-center cursor-pointer h-10" 
        onClick={() => onNavigate && onNavigate('global-hub')}
      >
        <svg 
          width="240" 
          height="40" 
          viewBox="0 0 240 40" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
          className="overflow-visible"
        >
          <defs>
            {/* Seamless Linear Gradient across typography footprint */}
            <linearGradient id="brand-grad" x1="10" y1="0" x2="200" y2="0" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#FFFFFF" />
              <stop offset="100%" stopColor="#48CAE4" />
            </linearGradient>
            
            {/* Luminous Glow Filter for neural filaments & diamond core */}
            <filter id="node-glow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="1.5" result="blur1" />
              <feGaussianBlur in="SourceGraphic" stdDeviation="3" result="blur2" />
              <feMerge>
                <feMergeNode in="blur2" />
                <feMergeNode in="blur1" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Infrastructure Pipelines flowing asynchronously underneath */}
          <path 
            d="M 22 24 C 60 31, 100 31, 150 27 C 170 25, 190 29, 215 29" 
            stroke="#48CAE4" 
            strokeWidth="0.8" 
            opacity="0.3" 
            fill="none" 
            className="animate-pulse"
          />
          <path 
            d="M 12 30 C 50 35, 110 35, 170 33 C 185 32, 205 35, 218 35" 
            stroke="#48CAE4" 
            strokeWidth="0.6" 
            opacity="0.25" 
            fill="none" 
            className="animate-pulse"
          />

          {/* Capital 'N' Hybrid Element */}
          <g>
            {/* Solid vertical stems */}
            <rect x="10" y="8" width="4.5" height="20" rx="0.75" fill="url(#brand-grad)" />
            <rect x="25.5" y="8" width="4.5" height="20" rx="0.75" fill="url(#brand-grad)" />
            
            {/* Diagonal spine dissolving into neural node filaments */}
            <line x1="14.5" y1="9.5" x2="25.5" y2="26.5" stroke="#48CAE4" strokeWidth="1.2" opacity="0.7" className="animate-pulse" filter="url(#node-glow)" />
            <line x1="14.5" y1="14.5" x2="21" y2="24.5" stroke="#48CAE4" strokeWidth="0.8" opacity="0.5" className="animate-pulse" />
            <line x1="19.5" y1="11.5" x2="25.5" y2="21.5" stroke="#48CAE4" strokeWidth="0.8" opacity="0.5" className="animate-pulse" />

            {/* Pulsing Neural Vertices */}
            <circle cx="17.5" cy="14" r="1.75" fill="#48CAE4" className="animate-pulse" filter="url(#node-glow)" />
            <circle cx="21" cy="19.5" r="1.25" fill="#FFFFFF" className="animate-pulse" />
            <circle cx="23.5" cy="23.5" r="1.75" fill="#48CAE4" className="animate-pulse" filter="url(#node-glow)" />
          </g>

          {/* Explicit Text Layout with Kerned Alignment for "CITY" */}
          <g>
            <text 
              y="26" 
              fill="url(#brand-grad)" 
              fontFamily="system-ui, -apple-system, sans-serif" 
              fontWeight="900" 
              fontSize="20"
              style={{ letterSpacing: '0.12em' }}
            >
              {/* EURO segment */}
              <tspan x="34">E</tspan>
              <tspan x="53">U</tspan>
              <tspan x="72">R</tspan>
              <tspan x="91">O</tspan>
              
              {/* CITY segment with custom kerned offsets */}
              <tspan x="110">C</tspan>
              
              {/* 'I' stem sits closer to 'C' (offset from 110 is 16px instead of standard 19px) */}
              <tspan x="126" style={{ letterSpacing: '0.06em' }}>I</tspan>
              
              {/* 'T' and 'Y' positioned cleanly */}
              <tspan x="135">T</tspan>
              <tspan x="154">Y</tspan>
            </text>

            {/* 'I' dot core - glowing diamond-vertex positioned manually over the 'I' stem */}
            <polygon 
              points="128.25,5.5 131.25,8.5 128.25,11.5 125.25,8.5" 
              fill="#48CAE4" 
              className="animate-pulse" 
              filter="url(#node-glow)" 
            />
          </g>
        </svg>
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
