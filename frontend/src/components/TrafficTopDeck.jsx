import React from 'react';

export default function TrafficTopDeck({ onLaunchSimulator }) {
  return (
    <section className="mx-6 mt-20 mb-6 p-8 lg:p-10 rounded-3xl bg-[#03045E] text-white shadow-[0_20px_50px_rgba(3,4,94,0.4)] border border-[#00B4D8]/40 relative overflow-hidden">
      
      {/* Local Styles for scanning scanline */}
      <style>{`
        @keyframes scan {
          0% { top: 4%; }
          50% { top: 96%; }
          100% { top: 4%; }
        }
      `}</style>

      {/* Background FX: Radial dots matrix & Glows */}
      <div className="absolute inset-0 bg-[radial-gradient(#00B4D8_1px,transparent_1px)] [background-size:20px_24px] opacity-15 pointer-events-none z-0" />
      <div className="absolute -top-24 -right-24 w-96 h-96 bg-[#00B4D8]/20 rounded-full blur-3xl pointer-events-none z-0" />
      <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-[#023E8A]/50 rounded-full blur-3xl pointer-events-none z-0" />

      {/* Sweeping scanline */}
      <div 
        className="absolute left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-[#48CAE4] to-transparent animate-[pulse_3s_infinite] shadow-[0_0_15px_#48CAE4] pointer-events-none z-10"
        style={{ animation: 'scan 6s ease-in-out infinite' }}
      />

      {/* L-shaped cybernetic corner accents */}
      <div className="absolute top-4 left-4 w-4 h-4 border-t-2 border-l-2 border-[#48CAE4]/60 z-10 pointer-events-none" />
      <div className="absolute top-4 right-4 w-4 h-4 border-t-2 border-r-2 border-[#48CAE4]/60 z-10 pointer-events-none" />
      <div className="absolute bottom-4 left-4 w-4 h-4 border-b-2 border-l-2 border-[#48CAE4]/60 z-10 pointer-events-none" />
      <div className="absolute bottom-4 right-4 w-4 h-4 border-b-2 border-r-2 border-[#48CAE4]/60 z-10 pointer-events-none" />

      {/* Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center h-full relative z-10">
        
        {/* LEFT COLUMN - Command Metrics & CTA (7 Columns) */}
        <div className="col-span-1 lg:col-span-7 flex flex-col items-start gap-6">
          {/* Monospace Badge Tag */}
          <span className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-[#023E8A]/80 border border-[#00B4D8]/30 text-[10px] font-mono font-bold tracking-wider uppercase text-white shadow-md">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00B4D8] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#00B4D8]"></span>
            </span>
            NEUROCITY // DIGITAL TWIN CONTROL NODE 01
          </span>

          {/* Ultra-Bold Gradient Headline */}
          <h1 className="text-4xl lg:text-5xl font-extrabold tracking-tight text-white leading-tight font-sans">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#48CAE4] via-[#00B4D8] to-emerald-400 block">
              ADAPTIVE SIGNAL SIMULATION MATRIX
            </span>
          </h1>

          {/* Description Copy */}
          <p className="text-slate-300 text-sm lg:text-base leading-relaxed max-w-xl font-sans">
            Autonomous multi-intersection routing engine. Evaluates cross-junction commuter density, dynamically recalculates phase timers, and executes emergency green-waves.
          </p>

          {/* 3 Telemetry Data Glass Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full">
            {/* Card 1 */}
            <div className="bg-white/5 border border-white/10 backdrop-blur-md p-4 rounded-2xl transition-all duration-300 hover:bg-white/10">
              <span className="block text-2xl font-extrabold text-[#48CAE4] font-mono">148</span>
              <span className="text-[10px] font-mono tracking-wider text-slate-300 uppercase mt-1 block">CAM NODES</span>
            </div>
            {/* Card 2 */}
            <div className="bg-white/5 border border-white/10 backdrop-blur-md p-4 rounded-2xl transition-all duration-300 hover:bg-white/10">
              <span className="block text-2xl font-extrabold text-[#34d399] font-mono">0.004s</span>
              <span className="text-[10px] font-mono tracking-wider text-slate-300 uppercase mt-1 block">YOLO FPS</span>
            </div>
            {/* Card 3 */}
            <div className="bg-white/5 border border-white/10 backdrop-blur-md p-4 rounded-2xl transition-all duration-300 hover:bg-white/10">
              <span className="block text-2xl font-extrabold text-[#fbbf24] font-mono">12</span>
              <span className="text-[10px] font-mono tracking-wider text-slate-300 uppercase mt-1 block">GREEN WAVES</span>
            </div>
          </div>

          {/* Interactive Action Callout Button */}
          <button 
            onClick={onLaunchSimulator}
            className="w-full sm:w-auto px-6 py-4 rounded-2xl text-xs font-mono font-extrabold tracking-wider bg-[#0077B6] hover:bg-[#0096C7] text-white border border-[#48CAE4]/40 hover:border-[#48CAE4] shadow-md hover:shadow-[0_0_30px_rgba(72,202,228,0.6)] transition-all duration-300 cursor-pointer text-center"
          >
            ⚡ ENTER 4-WAY INTERSECTION CONTROL SIMULATOR →
          </button>
        </div>

        {/* RIGHT COLUMN - PrepWise-Style Interactive Holographic Signal Orb (5 Columns) */}
        <div className="col-span-1 lg:col-span-5 flex items-center justify-center">
          <div 
            onClick={onLaunchSimulator}
            className="relative cursor-pointer group flex items-center justify-center w-64 h-64 lg:w-72 lg:h-72"
          >
            {/* Floating Glass Hover Badge */}
            <div className="opacity-0 group-hover:opacity-100 group-hover:-translate-y-3 transition-all duration-300 pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 z-40 bg-[#CAF0F8] text-[#03045E] text-xs font-mono font-extrabold px-4 py-2 rounded-2xl border-2 border-white shadow-[0_10px_30px_rgba(0,180,216,0.6)] whitespace-nowrap">
              ⚡ LAUNCH 4-WAY INTERSECTION SIMULATOR →
            </div>

            {/* Concentric Rotating Laser Rings */}
            {/* Outer ring */}
            <div className="absolute inset-0 rounded-full border border-dashed border-[#00B4D8]/40 group-hover:border-[#48CAE4] group-hover:scale-105 animate-[spin_18s_linear_infinite] transition-all duration-500" />
            {/* Inner ring */}
            <div className="absolute inset-4 rounded-full border border-[#00B4D8]/30 group-hover:border-emerald-400/60 animate-[spin_10s_linear_infinite_reverse] transition-all duration-500" />

            {/* Energy Glow Halo */}
            <div className="absolute inset-8 rounded-full bg-gradient-to-tr from-[#00B4D8]/20 via-[#48CAE4]/30 to-emerald-400/20 blur-xl group-hover:blur-2xl transition-all duration-500 pointer-events-none" />

            {/* Center Glass Sphere Capsule */}
            <div className="relative w-44 h-44 lg:w-48 lg:h-48 rounded-full bg-gradient-to-b from-[#023E8A]/90 to-[#03045E]/95 border-2 border-[#00B4D8] group-hover:border-[#48CAE4] group-hover:scale-110 shadow-[0_0_30px_rgba(0,180,216,0.4)] group-hover:shadow-[0_0_60px_rgba(72,202,228,0.8)] flex flex-col items-center justify-center gap-3 transition-all duration-500">
              
              {/* Active Signal Core Lights */}
              <div className="flex items-center gap-3">
                {/* Red Light */}
                <div className="w-3.5 h-3.5 rounded-full bg-red-500 shadow-[0_0_12px_#ef4444]" />
                
                {/* Amber Light */}
                <div className="w-3.5 h-3.5 rounded-full bg-amber-400 opacity-60 group-hover:opacity-100 group-hover:animate-pulse shadow-[0_0_12px_#f59e0b]" />
                
                {/* Green Light with Ping Aura */}
                <div className="relative flex items-center justify-center">
                  <span className="absolute -inset-1 rounded-full bg-[#00B4D8]/40 animate-ping group-hover:bg-emerald-400/50" />
                  <span className="relative w-3.5 h-3.5 rounded-full bg-emerald-400 shadow-[0_0_15px_#34d399]" />
                </div>
              </div>

              {/* Monospace Sub-Labels */}
              <div className="flex flex-col items-center text-center select-none">
                <span className="text-2xl group-hover:scale-125 transition-transform duration-300">🚦</span>
                <span className="text-[11px] font-mono font-bold text-[#CAF0F8] tracking-wider mt-1">
                  SIMULATOR NODE
                </span>
                <span className="text-[9px] font-mono text-emerald-400 font-bold group-hover:text-emerald-300 mt-0.5">
                  [ CLICK TO OVERRIDE ]
                </span>
              </div>

            </div>

          </div>
        </div>

      </div>

    </section>
  );
}
