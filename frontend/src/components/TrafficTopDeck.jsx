import React from 'react';
import City3DScene from './City3DScene';

export default function TrafficTopDeck({ onLaunchSimulator }) {
  return (
    <section className="mx-6 mt-16 mb-6 relative overflow-hidden rounded-3xl border border-[#00B4D8]/50 shadow-2xl bg-[#03045E]">
      {/* Local Styles for sweeping laser line */}
      <style>{`
        @keyframes scan-laser {
          0% { top: 0%; opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { top: 100%; opacity: 0; }
        }
        .animate-scan-laser {
          animation: scan-laser 4.5s linear infinite;
        }
      `}</style>

      {/* Inner Canvas Wrapper with touch-scrolling support */}
      <div 
        onClick={onLaunchSimulator}
        className="w-full h-[480px] lg:h-[520px] relative touch-pan-y group cursor-pointer"
      >
        {/* 3D WebGL Scene */}
        <City3DScene onLaunchSimulator={onLaunchSimulator} />

        {/* Digital Grid Overlay HUD Pattern */}
        <div className="absolute inset-0 bg-[radial-gradient(#00B4D8_1px,transparent_1px)] [background-size:24px_24px] opacity-10 pointer-events-none z-10" />

        {/* Top Telemetry Badge */}
        <div className="absolute top-5 left-6 z-20 pointer-events-none flex items-center gap-2 bg-[#023E8A]/75 backdrop-blur-sm border border-[#00B4D8]/45 px-3 py-1.5 rounded-md font-mono text-[10px] text-[#CAF0F8] tracking-widest uppercase">
          <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse" />
          Twin Feed: 256 Nodes Active
        </div>

        {/* Sweeping Scanning Laser Line */}
        <div 
          className="absolute left-0 w-full h-[3px] bg-gradient-to-r from-transparent via-[#00B4D8] to-transparent pointer-events-none z-20 animate-scan-laser"
          style={{
            boxShadow: '0 0 10px #00B4D8, 0 0 20px #48CAE4'
          }}
        />

        {/* HUD Corner Accents (L-shaped brackets) */}
        {/* Top-Left */}
        <div className="absolute top-6 left-6 w-6 h-6 border-t-2 border-l-2 border-[#00B4D8] z-20 pointer-events-none group-hover:border-[#48CAE4] transition-colors duration-300" />
        {/* Top-Right */}
        <div className="absolute top-6 right-6 w-6 h-6 border-t-2 border-r-2 border-[#00B4D8] z-20 pointer-events-none group-hover:border-[#48CAE4] transition-colors duration-300" />
        {/* Bottom-Left */}
        <div className="absolute bottom-6 left-6 w-6 h-6 border-b-2 border-l-2 border-[#00B4D8] z-20 pointer-events-none group-hover:border-[#48CAE4] transition-colors duration-300" />
        {/* Bottom-Right */}
        <div className="absolute bottom-6 right-6 w-6 h-6 border-b-2 border-r-2 border-[#00B4D8] z-20 pointer-events-none group-hover:border-[#48CAE4] transition-colors duration-300" />

        {/* Floating CTA Callout Pill Button at bottom */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 pointer-events-auto">
          <button 
            onClick={(e) => {
              e.stopPropagation();
              onLaunchSimulator();
            }}
            className="px-6 py-3 rounded-full bg-[#023E8A]/85 backdrop-blur-md border border-[#00B4D8]/50 text-[#CAF0F8] text-xs font-mono font-extrabold shadow-[0_10px_30px_rgba(3,4,94,0.6)] transition-all duration-500 hover:scale-105 hover:bg-[#0077B6]/90 hover:text-white hover:border-[#48CAE4] hover:shadow-[0_15px_40px_rgba(0,180,216,0.6)] cursor-pointer"
          >
            ⚡ CLICK TO LAUNCH 4-WAY INTERSECTION CONTROL SIMULATOR →
          </button>
        </div>
      </div>
    </section>
  );
}
