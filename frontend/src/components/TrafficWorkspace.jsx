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

  // --- Presets for Instant Interactive Testing ---
  const loadPreset = (presetType) => {
    if (isScanning) return;
    if (presetType === 'surat') {
      setActiveImage('preset-surat');
      runSimulation('Surat_Central_Junction_04', { cars: 14, bikes: 8, trucks: 3 }, true);
    } else if (presetType === 'majura') {
      setActiveImage('preset-majura');
      runSimulation('Majura_Gate_Junction_01', { cars: 9, bikes: 5, trucks: 1 }, false);
    } else {
      setActiveImage('preset-varachha');
      runSimulation('Varachha_Transit_Hub_02', { cars: 4, bikes: 2, trucks: 0 }, false);
    }
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
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mx-6 mt-6">
        
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

          {/* Interactive Drag & Drop Box */}
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={activeImage ? null : triggerBrowse}
            onMouseEnter={() => setIsHoveredUpload(true)}
            onMouseLeave={() => setIsHoveredUpload(false)}
            className={`relative flex-1 flex flex-col items-center justify-center border-2 border-dashed rounded-xl p-4 transition-all duration-300 ${
              isDragActive 
                ? 'border-[#0077B6] bg-[#90E0EF]/20' 
                : 'border-[#00B4D8]/40 hover:border-[#00B4D8] bg-white/30 cursor-pointer'
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
              <div className="w-full h-full flex flex-col items-center justify-center text-center p-2">
                <div className="w-16 h-16 rounded-xl bg-[#0077B6]/15 flex items-center justify-center text-[#03045E] mb-3">
                  <Layers className="h-8 w-8 animate-pulse text-[#0077B6]" />
                </div>
                <span className="text-xs font-mono font-bold text-[#03045E] break-all max-w-full px-2 block mb-1">
                  {fileName || 'custom_upload.png'}
                </span>
                <span className="text-[10px] text-slate-400 font-mono mb-4 uppercase">
                  [ Ingested Ready for Inference ]
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    resetWorkspace();
                  }}
                  className="px-4 py-1.5 rounded-lg text-[11px] font-mono font-bold bg-[#03045E] text-white hover:bg-[#023E8A] transition-all cursor-pointer shadow-md"
                >
                  DISCARD // UNLINK FRAME
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center text-center">
                {/* Glowing cloud upload icon */}
                <div className="mb-4 transition-transform duration-300 animate-float">
                  <svg
                    className="w-14 h-14 transition-all duration-300"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="url(#cloudGrad)"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <defs>
                      <linearGradient id="cloudGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor={isHoveredUpload ? '#00B4D8' : '#0077B6'} />
                        <stop offset="100%" stopColor={isHoveredUpload ? '#48CAE4' : '#48CAE4'} />
                      </linearGradient>
                    </defs>
                    <path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242" />
                    <path d="M12 12v9" />
                    <path d="m8 16 4-4 4 4" />
                  </svg>
                </div>
                
                <span className="text-xs font-mono font-bold text-[#03045E] tracking-wider mb-1 uppercase">
                  INGEST_FEED // ATTACH INTERSECTION FRAME
                </span>
                <span className="text-[10px] text-slate-400 font-mono tracking-tight">
                  Supports JPG, PNG up to 10MB
                </span>
              </div>
            )}
          </div>

          {/* Quick Sandbox Simulation Presets */}
          <div className="mt-4 pt-4 border-t border-[#00B4D8]/20 flex flex-col gap-2">
            <span className="text-[10px] font-mono font-bold tracking-wider text-slate-400 uppercase">
              [ INTERACTIVE SANDBOX PRESETS ]
            </span>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => loadPreset('surat')}
                disabled={isScanning}
                className="px-2 py-2 rounded-lg border border-[#0077B6]/30 text-[10px] font-mono font-bold text-[#03045E] hover:bg-[#90E0EF]/30 bg-white/40 transition-all cursor-pointer text-center truncate disabled:opacity-50"
              >
                SURAT_C_04
              </button>
              <button
                onClick={() => loadPreset('majura')}
                disabled={isScanning}
                className="px-2 py-2 rounded-lg border border-[#0077B6]/30 text-[10px] font-mono font-bold text-[#03045E] hover:bg-[#90E0EF]/30 bg-white/40 transition-all cursor-pointer text-center truncate disabled:opacity-50"
              >
                MAJURA_G_01
              </button>
              <button
                onClick={() => loadPreset('varachha')}
                disabled={isScanning}
                className="px-2 py-2 rounded-lg border border-[#0077B6]/30 text-[10px] font-mono font-bold text-[#03045E] hover:bg-[#90E0EF]/30 bg-white/40 transition-all cursor-pointer text-center truncate disabled:opacity-50"
              >
                VARACHHA_02
              </button>
            </div>
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

          {/* CRT Monitor Viewport Deck */}
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

            {/* Bright metallic corner brackets */}
            <div className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-[#0096C7] z-20" />
            <div className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-[#0096C7] z-20" />
            <div className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 border-[#0096C7] z-20" />
            <div className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-[#0096C7] z-20" />

            {/* Laser scanning beam */}
            {activeImage && (
              <div className="absolute left-0 w-full h-[3px] bg-gradient-to-r from-transparent via-[#00B4D8] to-transparent shadow-[0_0_12px_#00B4D8] pointer-events-none z-30 animate-scan-beam" />
            )}

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
              /* Active processed camera frame viewport output */
              <div className="relative w-full h-full flex items-center justify-center z-20">
                
                {/* Virtualized Wireframe Silhouette Asset Layout */}
                <div className="absolute inset-0 flex flex-col items-center justify-center p-2">
                  
                  {/* Grid Lines Pattern */}
                  <svg className="absolute inset-0 w-full h-full text-white/5" fill="none" stroke="currentColor" strokeWidth="0.5">
                    <line x1="0" y1="25%" x2="100%" y2="25%" strokeDasharray="3 3" />
                    <line x1="0" y1="50%" x2="100%" y2="50%" strokeDasharray="3 3" />
                    <line x1="0" y1="75%" x2="100%" y2="75%" strokeDasharray="3 3" />
                    <line x1="25%" y1="0" x2="25%" y2="100%" strokeDasharray="3 3" />
                    <line x1="50%" y1="0" x2="50%" y2="100%" strokeDasharray="3 3" />
                    <line x1="75%" y1="0" x2="75%" y2="100%" strokeDasharray="3 3" />
                  </svg>

                  {/* YOLOv8 Wireframe Bounding Box 1 (Main Target) */}
                  <div className="absolute top-[20%] left-[15%] w-[45%] h-[55%] border border-[#48CAE4] rounded shadow-[0_0_15px_rgba(72,202,228,0.25)] flex flex-col justify-between p-1.5">
                    
                    {/* Glowing Reticle Corner Accents */}
                    <span className="absolute top-0 left-0 w-1.5 h-1.5 border-t border-l border-white" />
                    <span className="absolute top-0 right-0 w-1.5 h-1.5 border-t border-r border-white" />
                    <span className="absolute bottom-0 left-0 w-1.5 h-1.5 border-b border-l border-white" />
                    <span className="absolute bottom-0 right-0 w-1.5 h-1.5 border-b border-r border-white" />
                    
                    {/* Bounding box header label */}
                    <div className="bg-[#03045E] text-[#48CAE4] border border-[#00B4D8]/30 px-1 py-0.5 rounded text-[8px] font-mono font-bold self-start mt-[-14px] ml-[-5px] shadow-sm tracking-wider whitespace-nowrap">
                      [ PROCESSING_ACTIVE // ENGINE_YOLOv8x ]
                    </div>

                    {/* Vector vehicle silhouette placeholder overlay */}
                    <svg className="w-full h-full text-[#48CAE4]/20 p-2" viewBox="0 0 100 100" fill="none" stroke="currentColor">
                      <path d="M15 70h70l-8-25H23z" strokeWidth="1.5" />
                      <path d="M28 45l4-15h36l4 15" strokeWidth="1.2" />
                      <circle cx="32" cy="70" r="7" strokeWidth="1.5" fill="#023E8A" />
                      <circle cx="68" cy="70" r="7" strokeWidth="1.5" fill="#023E8A" />
                    </svg>

                    {/* Laser Target Ticks */}
                    <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 font-mono text-[8px] text-[#CAF0F8] opacity-75">
                      LOC: [X_440 // Y_208]
                    </div>
                  </div>

                  {/* YOLOv8 Wireframe Bounding Box 2 (Secondary Target, e.g. Emergency Vehicle if flag active) */}
                  <div className={`absolute bottom-[15%] right-[10%] w-[32%] h-[40%] border rounded p-1 flex flex-col justify-between ${
                    hasEmergency 
                      ? 'border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.4)]' 
                      : 'border-[#48CAE4]/60 shadow-[0_0_8px_rgba(72,202,228,0.15)]'
                  }`}>
                    {/* Corner accents */}
                    <span className={`absolute top-0 left-0 w-1 h-1 border-t border-l ${hasEmergency ? 'border-red-400' : 'border-[#48CAE4]'}`} />
                    <span className={`absolute top-0 right-0 w-1 h-1 border-t border-r ${hasEmergency ? 'border-red-400' : 'border-[#48CAE4]'}`} />
                    <span className={`absolute bottom-0 left-0 w-1 h-1 border-b border-l ${hasEmergency ? 'border-red-400' : 'border-[#48CAE4]'}`} />
                    <span className={`absolute bottom-0 right-0 w-1 h-1 border-b border-r ${hasEmergency ? 'border-red-400' : 'border-[#48CAE4]'}`} />

                    <div className={`text-[7px] font-mono font-bold px-1 py-0.5 rounded self-start mt-[-12px] ml-[-4px] shadow-sm tracking-wider whitespace-nowrap ${
                      hasEmergency 
                        ? 'bg-red-950 text-red-400 border border-red-500/50 animate-pulse' 
                        : 'bg-[#03045E] text-[#48CAE4] border border-[#00B4D8]/30'
                    }`}>
                      {hasEmergency ? '[ TARGET: AMBULANCE // PRIORITY ]' : '[ TARGET: COMPACT_VEHICLE ]'}
                    </div>

                    <svg className={`w-full h-full p-1 ${hasEmergency ? 'text-red-500/30' : 'text-[#48CAE4]/20'}`} viewBox="0 0 100 100" fill="none" stroke="currentColor">
                      {hasEmergency ? (
                        /* Medical Cross Ambulance silhouette */
                        <>
                          <rect x="20" y="30" width="60" height="40" rx="3" strokeWidth="1.5" />
                          <rect x="55" y="20" width="20" height="12" strokeWidth="1.5" />
                          <circle cx="35" cy="70" r="6" strokeWidth="1.5" />
                          <circle cx="65" cy="70" r="6" strokeWidth="1.5" />
                          <path d="M 45 42 h 10 m -5 -5 v 10" strokeWidth="2.5" strokeLinecap="round" />
                        </>
                      ) : (
                        /* Moto silhouette */
                        <>
                          <circle cx="30" cy="65" r="10" strokeWidth="1.5" />
                          <circle cx="70" cy="65" r="10" strokeWidth="1.5" />
                          <path d="M 30 65 L 45 45 L 60 45 L 70 65" strokeWidth="1.5" />
                          <path d="M 45 45 L 50 30" strokeWidth="1.5" />
                        </>
                      )}
                    </svg>
                  </div>
                </div>

                {/* Tracking Absolute Diagnostic Badging overlay */}
                <div className="absolute top-2 right-2 bg-black/60 border border-[#00B4D8]/30 text-white font-mono text-[8px] px-2 py-0.5 rounded tracking-widest uppercase">
                  [ DETECTED // YOLOv8x_CORE ]
                </div>
                
                <div className="absolute bottom-2 left-2 bg-black/60 border border-[#00B4D8]/20 text-[#CAF0F8] font-mono text-[8px] px-2 py-0.5 rounded">
                  FPS: 60.0 // LATENCY: 0.005s
                </div>
              </div>
            ) : (
              /* Awaiting feed state screen placeholder */
              <div className="text-center text-white/30 font-mono text-xs font-semibold px-4 tracking-wider z-20 select-none">
                [ STANDBY // AWAITING INGESTION FEED ]
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

          {/* CRISIS INCIDENT ALERT BLOCK */}
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
                    CRITICAL ALERT: EMERGENCY VEHICLE (AMBULANCE) IDENTIFIED // TRIGGERING GREEN-WAVE SIGNAL OVERRIDE
                  </p>
                </div>
              </div>
            ) : (
              <div className="bg-[#023E8A]/10 border border-[#0077B6]/20 p-3 rounded-xl flex items-center gap-3">
                <ShieldAlert className="h-5 w-5 text-[#0077B6]/80 flex-shrink-0" />
                <span className="font-mono text-[9px] text-[#03045E] font-bold">
                  AMBULANCE_OVERRIDE_SCANNER: ENGAGED // NO ACTIVE INCIDENTS
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
