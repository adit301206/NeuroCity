import React, { useState, useRef } from 'react';
import { UploadCloud, RefreshCw, Layers, ShieldAlert, Clock, Database } from 'lucide-react';

export default function TrafficWorkspace() {
  // --- Component State Matrix ---
  const [activeImage, setActiveImage] = useState(null);
  const [fileName, setFileName] = useState('');
  const [isDragActive, setIsDragActive] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [hasEmergency, setHasEmergency] = useState(false);
  const [isHoveredUpload, setIsHoveredUpload] = useState(false);

  // Telemetry metric counters
  const [vehicleCounts, setVehicleCounts] = useState({
    cars: 0,
    bikes: 0,
    trucks: 0
  });

  // Table Logs state initialized with sample data
  const [logs, setLogs] = useState([
    {
      id: 'log-1',
      timestamp: '19-07-2026 10:08:02',
      location: 'Surat_Central_Junction_04',
      volume: 'Heavy (25 Units)',
      override: 'AMBULANCE_PRIORITY'
    },
    {
      id: 'log-2',
      timestamp: '19-07-2026 10:02:15',
      location: 'Majura_Gate_Junction_01',
      volume: 'Moderate (12 Units)',
      override: 'NONE'
    },
    {
      id: 'log-3',
      timestamp: '19-07-2026 09:55:40',
      location: 'Varachha_Transit_Hub_02',
      volume: 'Low (04 Units)',
      override: 'NONE'
    }
  ]);

  const fileInputRef = useRef(null);

  // --- Scan Simulation Logic ---
  const runSimulation = (name, customCounts = null, emergencyFlag = null) => {
    setIsScanning(true);
    setScanProgress(0);
    setFileName(name);

    // Dynamic telemetry calculations
    const isEmergency = emergencyFlag !== null 
      ? emergencyFlag 
      : (name.toLowerCase().includes('ambulance') || name.toLowerCase().includes('emergency') || Math.random() > 0.6);

    const counts = customCounts || {
      cars: Math.floor(Math.random() * 15) + 5,
      bikes: Math.floor(Math.random() * 10) + 2,
      trucks: Math.floor(Math.random() * 5) + 1
    };

    // Incremental progress scanner line simulation
    const interval = setInterval(() => {
      setScanProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 10;
      });
    }, 150);

    setTimeout(() => {
      setVehicleCounts(counts);
      setHasEmergency(isEmergency);
      setIsScanning(false);

      // Append new event transaction to logs database
      const totalUnits = counts.cars + counts.bikes + counts.trucks;
      const volumeLevel = totalUnits > 18 ? 'Heavy' : totalUnits > 8 ? 'Moderate' : 'Low';
      
      const newLog = {
        id: `log-${Date.now()}`,
        timestamp: new Date().toLocaleString('en-GB', { hour12: false }).replace(/\//g, '-'),
        location: name.replace(/\s+/g, '_').substring(0, 25),
        volume: `${volumeLevel} (${String(totalUnits).padStart(2, '0')} Units)`,
        override: isEmergency ? 'AMBULANCE_PRIORITY' : 'NONE'
      };

      setLogs((prev) => [newLog, ...prev]);
    }, 1800);
  };

  // --- Drag and Drop File Handlers ---
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragActive(true);
    } else if (e.type === "dragleave") {
      setIsDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const processFile = (file) => {
    if (file && (file.type === "image/jpeg" || file.type === "image/png")) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setActiveImage(reader.result);
        runSimulation(file.name);
      };
      reader.readAsDataURL(file);
    } else {
      alert("Please upload a valid JPG or PNG traffic frame snapshot.");
    }
  };

  const resetWorkspace = () => {
    setActiveImage(null);
    setFileName('');
    setVehicleCounts({ cars: 0, bikes: 0, trucks: 0 });
    setHasEmergency(false);
    setScanProgress(0);
  };

  const triggerBrowse = () => {
    fileInputRef.current.click();
  };

  return (
    <div className="w-full bg-[#FFFFFF]">
      {/* HUD Embedded Keyframe Animations */}
      <style>{`
        @keyframes hover-float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-6px); }
        }
        @keyframes horizontal-scan {
          0% { top: 0%; opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { top: 100%; opacity: 0; }
        }
        @keyframes crt-flicker {
          0% { opacity: 0.98; }
          50% { opacity: 1; }
          100% { opacity: 0.99; }
        }
        .animate-float {
          animation: hover-float 3s ease-in-out infinite;
        }
        .animate-scan-beam {
          animation: horizontal-scan 2.8s linear infinite;
        }
        .crt-monitor {
          animation: crt-flicker 0.15s infinite;
        }
      `}</style>

      {/* THREE-COLUMN WORKSPACE MATRIX */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mx-6 mt-14 lg:mt-16">
        
        {/* COLUMN 1: THE INTAKE DECK */}
        <section className="bg-[#CAF0F8]/40 backdrop-blur-md border border-white/60 shadow-lg rounded-2xl p-6 flex flex-col justify-between min-h-[420px]">
          <div>
            <div className="flex justify-between items-center mb-4 border-b border-[#00B4D8]/20 pb-2">
              <span className="font-mono text-xs font-bold tracking-wider text-[#03045E]">
                INGEST_FEED // ATTACH INTERSECTION FRAME
              </span>
              <div className="h-2 w-2 rounded-full bg-[#00B4D8] animate-ping" />
            </div>
            
            <p className="text-slate-500 text-xs mb-4 font-sans leading-relaxed">
              Feed raw municipal sensor telemetry images into the YOLOv8x computer vision inference pipelines.
            </p>
          </div>

          {/* Sleek, large Drag-and-Drop Image Dropzone Area */}
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={activeImage ? null : triggerBrowse}
            onMouseEnter={() => setIsHoveredUpload(true)}
            onMouseLeave={() => setIsHoveredUpload(false)}
            className={`relative flex-1 flex flex-col items-center justify-center border-2 border-dashed rounded-xl p-6 transition-all duration-300 ${
              isDragActive 
                ? 'border-[#48CAE4] bg-[#CAF0F8]/50 shadow-[0_0_15px_rgba(72,202,228,0.2)]' 
                : 'border-[#00B4D8] hover:border-solid hover:border-[#48CAE4] bg-[#CAF0F8]/40 backdrop-blur-md cursor-pointer'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".jpg,.jpeg,.png"
              onChange={handleFileChange}
              className="hidden"
            />

            {activeImage ? (
              <div className="w-full h-full flex flex-col items-center justify-center text-center p-2 z-10">
                {/* Micro Thumbnail */}
                <div className="relative w-28 h-20 rounded-lg overflow-hidden border border-[#00B4D8]/50 mb-4 shadow-md bg-[#023E8A]">
                  <img src={activeImage} className="w-full h-full object-cover" alt="Ingested frame" />
                  <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                    <span className="text-[9px] font-mono font-bold text-[#48CAE4] tracking-widest bg-black/60 px-1 py-0.5 rounded border border-[#48CAE4]/30">INGESTED</span>
                  </div>
                </div>
                
                <span className="text-xs font-mono font-bold text-[#03045E] break-all max-w-full px-2 block mb-1">
                  {fileName || 'custom_upload.png'}
                </span>
                
                <span className="text-[10px] text-slate-500 font-mono mb-4 uppercase">
                  [ READY FOR INFERENCE PIPELINE ]
                </span>

                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={triggerBrowse}
                    className="px-4 py-2 rounded-xl text-xs font-mono font-bold bg-[#03045E] text-white hover:bg-[#023E8A] border border-[#48CAE4] shadow-[0_0_12px_rgba(72,202,228,0.25)] transition-all cursor-pointer"
                  >
                    CHANGE FRAME
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      resetWorkspace();
                    }}
                    className="px-4 py-2 rounded-xl text-xs font-mono font-bold bg-red-600/10 text-red-700 hover:bg-red-600/20 border border-red-500/30 transition-all cursor-pointer"
                  >
                    DISCARD
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center text-center p-2 z-10">
                {/* Animated Pulsing Cloud Upload Icon */}
                <div className="mb-4 animate-[pulse_2s_infinite] transition-transform duration-300">
                  <svg
                    className="w-16 h-16 text-[#0077B6] drop-shadow-[0_0_8px_rgba(72,202,228,0.4)]"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242" />
                    <path d="M12 12v9" />
                    <path d="m8 16 4-4 4 4" />
                  </svg>
                </div>
                
                <span className="text-sm font-mono font-bold text-[#03045E] tracking-wider mb-2 uppercase">
                  INGEST_TRAFFIC_FEED // BROWSE OR DRAG IMAGE
                </span>
                
                <span className="text-xs text-slate-500 font-mono tracking-tight mb-4">
                  Supports JPG, PNG up to 10MB
                </span>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    triggerBrowse();
                  }}
                  className="px-6 py-3 rounded-xl font-mono text-xs font-bold bg-[#03045E] text-white hover:bg-[#023E8A] border border-[#48CAE4] shadow-[0_0_15px_rgba(72,202,228,0.25)] hover:shadow-[0_0_20px_rgba(72,202,228,0.5)] transition-all cursor-pointer"
                >
                  UPLOAD & PROCESS FRAME
                </button>
              </div>
            )}
          </div>
        </section>

        {/* COLUMN 2: THE INFERENCE SCREEN */}
        <section className="bg-[#CAF0F8]/40 backdrop-blur-md border border-white/60 shadow-lg rounded-2xl p-6 flex flex-col justify-between min-h-[420px]">
          <div>
            <div className="flex justify-between items-center mb-4 border-b border-[#00B4D8]/20 pb-2">
              <span className="font-mono text-xs font-bold tracking-wider text-[#03045E]">
                INFERENCE SCREEN // YOLOv8x_MATRIX
              </span>
              <span className="text-[10px] font-mono text-[#0077B6] font-semibold bg-[#CAF0F8] px-2 py-0.5 rounded">
                {isScanning ? 'SCANNING_FEED' : activeImage ? 'FEED_CONNECTED' : 'PORT_STANDBY'}
              </span>
            </div>
          </div>

          {/* High-Fidelity CRT/LED Diagnostic Viewport Frame */}
          <div className="relative flex-1 w-full bg-[#023E8A] overflow-hidden rounded-xl border border-[#0077B6]/30 shadow-inner flex flex-col items-center justify-center p-4 min-h-[260px] crt-monitor">
            
            {/* CRT Screen Scanline Overlay Effect */}
            <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_center,rgba(72,202,228,0.12)_0%,rgba(3,4,94,0.45)_100%)] z-10" />
            <div 
              className="absolute inset-0 pointer-events-none opacity-[0.04] z-10" 
              style={{
                backgroundImage: 'linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.25) 50%), linear-gradient(90deg, rgba(255, 0, 0, 0.06), rgba(0, 255, 0, 0.02), rgba(0, 0, 255, 0.06))',
                backgroundSize: '100% 4px, 6px 100%'
              }}
            />

            {/* Bright Metallic Corner Brackets */}
            <div className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-[#0096C7] z-20" />
            <div className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-[#0096C7] z-20" />
            <div className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 border-[#0096C7] z-20" />
            <div className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-[#0096C7] z-20" />

            {isScanning ? (
              /* Processing Diagnostics HUD */
              <div className="text-center z-20 flex flex-col items-center">
                <RefreshCw className="h-10 w-10 text-[#48CAE4] animate-spin mb-3" />
                <span className="font-mono text-xs font-bold text-[#48CAE4] tracking-widest uppercase mb-1">
                  [ INFERENCE CORE COMPUTING... ]
                </span>
                <div className="w-48 bg-white/10 rounded-full h-1.5 mt-2 border border-[#48CAE4]/20 overflow-hidden">
                  <div 
                    className="bg-gradient-to-r from-[#0077B6] to-[#48CAE4] h-full transition-all duration-150" 
                    style={{ width: `${scanProgress}%` }}
                  />
                </div>
                <span className="font-mono text-[9px] text-[#CAF0F8] mt-2 block">
                  RESOLVING BOUNDING_BOXES: {scanProgress}%
                </span>
              </div>
            ) : activeImage ? (
              /* Active processed camera frame viewport output - Renders only clean image */
              <div className="relative w-full h-full rounded-xl overflow-hidden z-20">
                {/* The Processed Image Render Area */}
                <img src={activeImage} className="w-full h-full object-contain rounded-xl" alt="Processed output" />

                {/* Laser Scanning Sweep Line */}
                <div className="absolute left-0 w-full h-[2px] bg-[#00B4D8] shadow-[0_0_12px_rgba(0,180,216,1)] pointer-events-none z-30 animate-scan-beam" />

                {/* Glowing Neon Badge in top corner */}
                <div className="absolute top-3 left-3 bg-[#03045E]/90 border border-[#00B4D8]/40 shadow-[0_0_10px_rgba(72,202,228,0.25)] text-[#48CAE4] font-mono text-[9px] font-bold px-2 py-1 rounded tracking-widest uppercase z-30 animate-pulse">
                  [ YOLOv8 DEEP_INFERENCE // ACTIVE ]
                </div>

                {/* Corner Metadata Ticks */}
                <div className="absolute bottom-3 left-3 bg-black/75 border border-[#00B4D8]/20 text-[#CAF0F8] font-mono text-[8px] px-2 py-1 rounded z-30">
                  COMPUTE_LATENCY: 0.104s
                </div>
                <div className="absolute bottom-3 right-3 bg-black/75 border border-[#00B4D8]/20 text-[#48CAE4] font-mono text-[8px] px-2 py-1 rounded z-30">
                  CONFIDENCE: 98.4%
                </div>
              </div>
            ) : (
              /* Standby Tech Wireframe State */
              <div className="relative w-full h-full flex flex-col items-center justify-center z-20">
                {/* Tech Wireframe Isometric Grid */}
                <svg className="absolute inset-0 w-full h-full opacity-20 pointer-events-none" viewBox="0 0 300 200" fill="none" stroke="currentColor">
                  <path d="M -20 100 L 150 15 L 320 100 L 150 185 Z" stroke="#48CAE4" strokeWidth="0.5" strokeDasharray="3 6" />
                  <path d="M 20 100 L 150 35 L 280 100 L 150 165 Z" stroke="#48CAE4" strokeWidth="0.5" strokeDasharray="3 6" />
                  <line x1="30" y1="55" x2="270" y2="145" stroke="#48CAE4" strokeWidth="1.5" />
                  <line x1="270" y1="55" x2="30" y2="145" stroke="#48CAE4" strokeWidth="1.5" />
                  <line x1="150" y1="10" x2="150" y2="190" stroke="#48CAE4" strokeWidth="0.5" strokeDasharray="2 4" />
                </svg>

                {/* Standby Message HUD */}
                <div className="text-center z-20 px-4">
                  <span className="font-mono text-xs font-bold text-[#48CAE4] tracking-widest uppercase block mb-1">
                    STANDBY // READY FOR INFERENCE STREAM
                  </span>
                  <span className="font-mono text-[9px] text-slate-400 uppercase">
                    [ AWAITING INPUT FROM INTAKE DECK ]
                  </span>
                </div>
              </div>
            )}
          </div>

          <div className="mt-4 pt-4 border-t border-[#00B4D8]/20 flex justify-between items-center text-[10px] font-mono text-slate-400">
            <span>DIAG_PORT: ENG_CONNECTED</span>
            <span>MODEL_VERSION: YOLO_v8.4.1</span>
          </div>
        </section>

        {/* COLUMN 3: THE TELEMETRY MONITOR */}
        <section className="bg-[#90E0EF]/30 backdrop-blur-md border border-[#0077B6]/30 shadow-lg rounded-2xl p-6 flex flex-col justify-between min-h-[420px]">
          <div>
            <div className="flex justify-between items-center mb-4 border-b border-[#0077B6]/20 pb-2">
              <span className="font-mono text-xs font-bold tracking-wider text-[#03045E]">
                REAL-TIME TELEMETRY MATRIX
              </span>
              <Database className="h-4 w-4 text-[#0077B6]" />
            </div>
            
            <p className="text-slate-500 text-xs mb-6 font-sans leading-relaxed">
              Real-time vehicle class distribution metrics computed dynamically from raw frame scan lines.
            </p>
          </div>

          {/* Vehicle Distribution Metric Rows */}
          <div className="flex-1 flex flex-col gap-4">
            
            {/* CARS row */}
            <div className="flex flex-col">
              <div className="flex justify-between items-center mb-1">
                <div className="flex items-center gap-2">
                  {/* Car SVG Icon */}
                  <svg className="w-5 h-5 text-[#0077B6]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="11" width="18" height="8" rx="2" />
                    <path d="M5 11V7a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v4" />
                    <circle cx="7" cy="19" r="1.5" fill="currentColor" />
                    <circle cx="17" cy="19" r="1.5" fill="currentColor" />
                  </svg>
                  <span className="font-mono text-xs font-bold text-[#03045E]">CARS // PASSENGER</span>
                </div>
                <span className="font-mono text-base font-extrabold text-[#03045E]">
                  {String(vehicleCounts.cars).padStart(2, '0')}
                </span>
              </div>
              <div className="w-full bg-[#CAF0F8] rounded-full h-2 overflow-hidden border border-white/60">
                <div 
                  className="bg-[#0077B6] h-full rounded-full transition-all duration-500" 
                  style={{ width: `${Math.min(100, (vehicleCounts.cars / 25) * 100)}%` }}
                />
              </div>
            </div>

            {/* BIKES row */}
            <div className="flex flex-col">
              <div className="flex justify-between items-center mb-1">
                <div className="flex items-center gap-2">
                  {/* Bike SVG Icon */}
                  <svg className="w-5 h-5 text-[#00B4D8]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="5" cy="15" r="3" />
                    <circle cx="19" cy="15" r="3" />
                    <path d="M12 15V7.5L14 5" />
                    <path d="m12 9-3-3" />
                    <path d="M5 15h14" />
                  </svg>
                  <span className="font-mono text-xs font-bold text-[#03045E]">BIKES // TWO-WHEEL</span>
                </div>
                <span className="font-mono text-base font-extrabold text-[#03045E]">
                  {String(vehicleCounts.bikes).padStart(2, '0')}
                </span>
              </div>
              <div className="w-full bg-[#CAF0F8] rounded-full h-2 overflow-hidden border border-white/60">
                <div 
                  className="bg-[#00B4D8] h-full rounded-full transition-all duration-500" 
                  style={{ width: `${Math.min(100, (vehicleCounts.bikes / 15) * 100)}%` }}
                />
              </div>
            </div>

            {/* TRUCKS row */}
            <div className="flex flex-col">
              <div className="flex justify-between items-center mb-1">
                <div className="flex items-center gap-2">
                  {/* Truck SVG Icon */}
                  <svg className="w-5 h-5 text-[#48CAE4]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="1" y="3" width="15" height="13" rx="2" />
                    <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
                    <circle cx="5.5" cy="18.5" r="2.5" fill="currentColor" />
                    <circle cx="18.5" cy="18.5" r="2.5" fill="currentColor" />
                  </svg>
                  <span className="font-mono text-xs font-bold text-[#03045E]">TRUCKS // FREIGHT</span>
                </div>
                <span className="font-mono text-base font-extrabold text-[#03045E]">
                  {String(vehicleCounts.trucks).padStart(2, '0')}
                </span>
              </div>
              <div className="w-full bg-[#CAF0F8] rounded-full h-2 overflow-hidden border border-white/60">
                <div 
                  className="bg-[#48CAE4] h-full rounded-full transition-all duration-500" 
                  style={{ width: `${Math.min(100, (vehicleCounts.trucks / 8) * 100)}%` }}
                />
              </div>
            </div>

          </div>

          {/* CRISIS INCIDENT ALERT BLOCK (DYNAMIC EMERGENCY ALERT CONDITIONAL RENDERING) */}
          <div className="mt-6">
            {hasEmergency ? (
              <div className="bg-red-500/10 border border-red-500/30 animate-pulse p-3 rounded-xl flex items-start gap-3 shadow-md">
                <div className="flex-shrink-0 mt-0.5">
                  <div className="h-5 w-5 bg-red-600 rounded-full flex items-center justify-center shadow-[0_0_8px_#EF4444]">
                    <span className="text-white text-xs font-mono font-bold">+</span>
                  </div>
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[9px] font-mono font-extrabold text-[#FFBF00] bg-red-950/80 px-1.5 py-0.5 rounded border border-[#FFBF00]/30 shadow-sm">
                      [ CRITICAL // EMERGENCY_VEHICLE_OVERRIDE ]
                    </span>
                  </div>
                  <p className="font-mono text-[9px] text-[#03045E] leading-relaxed font-bold">
                    CRITICAL ALERT: EMERGENCY VEHICLE (AMBULANCE) IDENTIFIED // TRIGGERING GREEN-WAVE OVERRIDE
                  </p>
                </div>
              </div>
            ) : (
              <div className="bg-[#0077B6]/20 border border-[#00B4D8]/40 p-3 rounded-xl flex items-center gap-3 text-[#03045E]">
                <ShieldAlert className="h-5 w-5 text-[#0077B6] flex-shrink-0" />
                <span className="font-mono text-[9px] font-bold">
                  SYS_STATUS: OPTIMAL // NORMAL SIGNAL TIMING ACTIVE (NO EMERGENCY OVERRIDE)
                </span>
              </div>
            )}
          </div>
        </section>

      </div>

      {/* BOTTOM SPAN: THE ARCHIVED DATA HISTORY LOGS */}
      <section className="mx-6 mt-6 mb-12">
        <div className="bg-[#ADE8F4]/20 backdrop-blur-md border border-[#023E8A] shadow-lg rounded-2xl p-6">
          
          {/* Section Header */}
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-4 border-b border-[#023E8A]/20 pb-3">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-[#023E8A]" />
              <h2 className="font-sans text-sm font-extrabold tracking-wider text-[#03045E] uppercase">
                MUNICIPAL TRANSACTION MATRIX // MONGO_ATLAS_STREAM
              </h2>
            </div>
            <span className="text-[10px] font-mono text-slate-500 bg-[#CAF0F8]/80 px-2.5 py-1 rounded-full border border-white/60 shadow-sm font-semibold">
              CONNECTED NODES: Surat_Node_04, Majura_Node_01, Varachha_Node_02
            </span>
          </div>

          {/* Matrix Data Grid Table */}
          <div className="overflow-x-auto w-full rounded-lg border border-slate-200 bg-white/65">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-[#023E8A] text-white">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-mono font-bold tracking-wider uppercase">
                    Timestamp
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-mono font-bold tracking-wider uppercase">
                    Node Location
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-mono font-bold tracking-wider uppercase">
                    Traffic Volume
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-mono font-bold tracking-wider uppercase">
                    Status Override
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono text-[11px] text-slate-700">
                {logs.map((log, index) => (
                  <tr 
                    key={log.id} 
                    className={`transition-all duration-200 hover:bg-[#90E0EF] cursor-pointer ${
                      index % 2 === 0 ? 'bg-[#CAF0F8]/30' : 'bg-white/40'
                    }`}
                  >
                    <td className="px-6 py-3 whitespace-nowrap tracking-tighter">
                      {log.timestamp}
                    </td>
                    <td className="px-6 py-3 whitespace-nowrap font-bold text-[#03045E]">
                      {log.location}
                    </td>
                    <td className="px-6 py-3 whitespace-nowrap font-semibold">
                      {log.volume}
                    </td>
                    <td className="px-6 py-3 whitespace-nowrap">
                      {log.override === 'AMBULANCE_PRIORITY' ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 border border-red-200 text-red-700 animate-pulse">
                          AMBULANCE_PRIORITY
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 border border-slate-200 text-slate-400">
                          STANDARD_FLOW
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* MongoDB Atlas stream details */}
          <div className="mt-4 flex justify-between items-center text-[9px] font-mono text-slate-400 uppercase">
            <span>[ MongoDB_Connection: Active // cluster0.x6jka.mongodb.net ]</span>
            <span>Refreshed: Just Now</span>
          </div>

        </div>
      </section>
    </div>
  );
}
