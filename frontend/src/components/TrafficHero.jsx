import React from 'react';

export default function TrafficHero({ onLaunchAnalyzer, onViewLogs }) {
  return (
    <section className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center mx-6 mt-8 p-8 bg-[#caf0f8]/60 backdrop-blur-xl border border-white/80 rounded-3xl shadow-xl">
      
      {/* Local Styles for HUD animations */}
      <style>{`
        @keyframes scan {
          0% { top: 4%; }
          50% { top: 96%; }
          100% { top: 4%; }
        }
      `}</style>

      {/* LEFT COLUMN - Command Metrics & Action Copy */}
      <div className="flex flex-col items-start pr-0 lg:pr-6">
        {/* Engineering Tag Badge */}
        <span className="inline-flex px-3 py-1.5 rounded-full text-[10px] font-mono font-bold tracking-wider uppercase bg-[#03045E]/10 text-[#03045E] mb-6">
          [ COGNITIVE DATA STREAM // MODEL 01 ]
        </span>
        
        {/* Headline */}
        <h1 className="text-4xl lg:text-5xl font-extrabold tracking-tight text-[#03045E] leading-[1.1] mb-6 font-sans">
          TRAFFIC EYE:{' '}
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#03045E] to-[#48CAE4] block lg:inline-block">
            ADAPTIVE ENGINE
          </span>
        </h1>
        
        {/* Sub-paragraph */}
        <p className="text-slate-500 text-base lg:text-lg mb-8 leading-relaxed font-sans">
          Intercepting real-time municipal camera frames, processing instant vehicle class distributions via calibrated YOLOv8 matrices, and triggering automated green-wave emergency overrides.
        </p>
        
        {/* Action Control Layer Button Deck */}
        <div className="flex flex-wrap items-center gap-4 w-full sm:w-auto">
          <button 
            onClick={onLaunchAnalyzer}
            className="w-full sm:w-auto px-6 py-3.5 rounded-xl text-sm font-semibold tracking-wide bg-[#03045E] text-white hover:bg-[#023E8A] border border-[#48CAE4]/40 hover:border-[#48CAE4]/80 shadow-[0_4px_12px_rgba(3,4,94,0.15),0_0_10px_rgba(72,202,228,0.1)] transition-all duration-300 cursor-pointer text-center"
          >
            Launch Analyzer View
          </button>
          
          <button 
            onClick={onViewLogs}
            className="w-full sm:w-auto px-6 py-3.5 rounded-xl text-sm font-semibold tracking-wide border border-[#03045E]/20 text-[#03045E] hover:bg-[#03045E]/5 transition-all duration-300 cursor-pointer text-center"
          >
            View Active Logs
          </button>
        </div>
      </div>

      {/* RIGHT COLUMN - Sci-Fi Computer Vision Radar & Intersection Tracker */}
      <div className="w-full h-[400px] bg-[#03045E] rounded-3xl p-8 relative overflow-hidden shadow-2xl flex flex-col justify-between border border-[#48CAE4]/25 shadow-[0_15px_35px_rgba(3,4,94,0.35),0_0_20px_rgba(72,202,228,0.1)]">
        
        {/* Luminous Corner Accent Brackets */}
        <div className="absolute top-4 left-4 w-4 h-4 border-t-2 border-l-2 border-[#48CAE4] z-10" />
        <div className="absolute top-4 right-4 w-4 h-4 border-t-2 border-r-2 border-[#48CAE4] z-10" />
        <div className="absolute bottom-4 left-4 w-4 h-4 border-b-2 border-l-2 border-[#48CAE4] z-10" />
        <div className="absolute bottom-4 right-4 w-4 h-4 border-b-2 border-r-2 border-[#48CAE4] z-10" />

        {/* Isometric Matrix Blueprint Grid representing 4-way traffic junction */}
        <svg 
          className="absolute inset-0 w-full h-full pointer-events-none opacity-40 z-0" 
          viewBox="0 0 300 200" 
          fill="none" 
          stroke="currentColor"
        >
          {/* Base perspective boundary grid */}
          <path d="M -20 100 L 150 15 L 320 100 L 150 185 Z" stroke="#48CAE4" strokeWidth="0.5" strokeDasharray="3 6" opacity="0.3" />
          <path d="M 20 100 L 150 35 L 280 100 L 150 165 Z" stroke="#48CAE4" strokeWidth="0.5" strokeDasharray="3 6" opacity="0.2" />
          
          {/* Road 1: Top-Left to Bottom-Right */}
          <line x1="30" y1="55" x2="270" y2="145" stroke="#48CAE4" strokeWidth="1.5" opacity="0.3" />
          <line x1="40" y1="45" x2="280" y2="135" stroke="#48CAE4" strokeWidth="1" strokeDasharray="4 4" opacity="0.25" />
          <line x1="50" y1="35" x2="290" y2="125" stroke="#48CAE4" strokeWidth="1.5" opacity="0.3" />
          
          {/* Road 2: Top-Right to Bottom-Left */}
          <line x1="270" y1="55" x2="30" y2="145" stroke="#48CAE4" strokeWidth="1.5" opacity="0.3" />
          <line x1="260" y1="45" x2="20" y2="135" stroke="#48CAE4" strokeWidth="1" strokeDasharray="4 4" opacity="0.25" />
          <line x1="250" y1="35" x2="10" y2="125" stroke="#48CAE4" strokeWidth="1.5" opacity="0.3" />

          {/* Perspective Crossroads Center alignment */}
          <line x1="150" y1="10" x2="150" y2="190" stroke="#48CAE4" strokeWidth="0.5" strokeDasharray="2 4" opacity="0.2" />
          <line x1="10" y1="100" x2="290" y2="100" stroke="#48CAE4" strokeWidth="0.5" strokeDasharray="2 4" opacity="0.2" />
        </svg>

        {/* Central Crossroads Core Pulsing Target */}
        <div className="absolute top-[50%] left-[50%] -translate-x-1/2 -translate-y-1/2 w-10 h-10 pointer-events-none z-10 flex items-center justify-center">
          <span className="absolute w-10 h-10 rounded-full bg-[#48CAE4]/25 animate-ping" />
          <span className="absolute w-6 h-6 rounded-full bg-[#48CAE4]/40 animate-pulse" />
          <span className="w-2.5 h-2.5 rounded-full bg-[#48CAE4] shadow-[0_0_10px_#48CAE4] z-20" />
        </div>

        {/* Continuous Scanning Laser Sweep scanline */}
        <div 
          className="absolute left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-[#48CAE4] to-transparent shadow-[0_0_12px_rgba(72,202,228,1)] pointer-events-none z-20"
          style={{ animation: 'scan 5s ease-in-out infinite' }}
        />

        {/* Frame 2: Commuter Distribution Stream (Auto Rickshaw Bounding Box) */}
        <div className="absolute top-[16%] left-[8%] w-[38%] h-[38%] border border-[#48CAE4]/80 shadow-[0_0_10px_rgba(72,202,228,0.2)] rounded p-2 z-10">
          <div className="absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 border-[#48CAE4]" />
          <div className="absolute top-0 right-0 w-2 h-2 border-t-2 border-r-2 border-[#48CAE4]" />
          <div className="absolute bottom-0 left-0 w-2 h-2 border-b-2 border-l-2 border-[#48CAE4]" />
          <div className="absolute bottom-0 right-0 w-2 h-2 border-b-2 border-r-2 border-[#48CAE4]" />
          
          {/* Metadata Ribbon */}
          <div className="absolute -top-5 left-0 font-mono text-[8px] font-bold text-[#48CAE4] bg-[#03045E] px-1.5 py-0.5 border border-[#48CAE4]/30 rounded whitespace-nowrap">
            CLASS: AUTO_RICKSHAW // CONF: 99.12%
          </div>
          
          {/* Isometric vehicle vector representation inside outline */}
          <svg className="w-full h-full text-[#48CAE4]/15 opacity-60 p-2" viewBox="0 0 100 100" fill="none" stroke="currentColor">
            <path d="M 25 65 L 15 50 L 30 35 L 70 35 L 85 50 L 75 65 Z" strokeWidth="1.5" />
            <circle cx="50" cy="45" r="8" strokeWidth="1.5" />
            <circle cx="35" cy="65" r="7" strokeWidth="1.5" fill="#03045E" />
            <circle cx="65" cy="65" r="7" strokeWidth="1.5" fill="#03045E" />
          </svg>
        </div>

        {/* Frame 1: Ambulance Priority Bounding Box with Upgraded Target Reticle */}
        <div className="absolute bottom-[16%] right-[8%] w-[42%] h-[42%] border border-amber-500/80 shadow-[0_0_10px_rgba(245,158,11,0.2)] rounded p-2 z-10">
          <div className="absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 border-amber-500" />
          <div className="absolute top-0 right-0 w-2 h-2 border-t-2 border-r-2 border-amber-500" />
          <div className="absolute bottom-0 left-0 w-2 h-2 border-b-2 border-l-2 border-amber-500" />
          <div className="absolute bottom-0 right-0 w-2 h-2 border-b-2 border-r-2 border-amber-500" />
          
          {/* Warning badge label (pulsing generic dot removed) */}
          <div className="absolute -top-5 left-0 font-mono text-[8px] font-bold text-amber-400 bg-[#03045E] px-1.5 py-0.5 border border-amber-500/30 rounded whitespace-nowrap">
            <span>TARGET: AMBULANCE</span>
          </div>
          
          {/* Upgraded Complex Target Reticle for Active Ambulance Detection */}
          <div className="absolute inset-0 flex items-center justify-center p-4">
            <div className="w-20 h-20 flex items-center justify-center rounded-xl bg-red-500/5 border border-red-500/20 animate-[pulse_2s_infinite] shadow-[0_0_25px_rgba(255,0,0,0.5)]">
              {/* Bold Neon Red (#FF0000) Classic Medical Indicator Cross Symbol */}
              <svg 
                className="w-12 h-12 text-[#FF0000] drop-shadow-[0_0_10px_rgba(255,0,0,0.85)]" 
                viewBox="0 0 100 100" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="3"
              >
                <path d="M 40 20 H 60 V 40 H 80 V 60 H 60 V 80 H 40 V 60 H 20 V 40 Z" />
              </svg>
            </div>
          </div>

          {/* Priority Text Anchor Underneath the Reticle */}
          <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 font-mono text-[8px] font-bold text-[#FFBF00]/80 tracking-wider whitespace-nowrap bg-[#03045E]/90 px-1.5 py-0.5 border border-[#FFBF00]/30 rounded shadow-[0_0_8px_rgba(255,191,0,0.3)]">
            [ PRIORITY_OVERRIDE_ACTIVE // CAL: 0.99 ]
          </div>
        </div>

        {/* Cybernetic Telemetry Border Details */}
        {/* Top-Left */}
        <div className="absolute top-6 left-6 flex flex-col gap-0.5 z-10">
          <span className="text-[#CAF0F8]/80 text-[9px] font-mono tracking-wider font-bold">
            SYS_LATENCY: 0.004s
          </span>
          <span className="text-white/20 text-[8px] font-mono">STREAM_ACTIVE</span>
        </div>

        {/* Top-Right */}
        <div className="absolute top-6 right-6 flex flex-col items-end gap-0.5 z-10">
          <span className="text-[#CAF0F8]/80 text-[9px] font-mono tracking-wider font-bold">
            CALIBRATION_MATRIX: ENG_CONNECTED
          </span>
          <span className="text-white/20 text-[8px] font-mono">NODE_INDEX_04</span>
        </div>

        {/* Bottom-Left */}
        <div className="absolute bottom-6 left-6 flex flex-col gap-0.5 z-10">
          <span className="text-white/20 text-[8px] font-mono">TE_STREAM // ACTIVE_HUD</span>
          <span className="text-[#CAF0F8]/80 text-[9px] font-mono tracking-wider font-bold">
            FOCUS_COORD: [21.1702° N, 72.8311° E]
          </span>
        </div>

        {/* Bottom-Right */}
        <div className="absolute bottom-6 right-6 flex flex-col items-end gap-0.5 z-10">
          <span className="text-white/20 text-[8px] font-mono">INF_YOLOv8s_LOADED</span>
          <span className="text-[#CAF0F8]/80 text-[9px] font-mono tracking-wider font-bold">
            [ RESOLUTION: 4K_RAW_FEED ]
          </span>
        </div>

      </div>

    </section>
  );
}
