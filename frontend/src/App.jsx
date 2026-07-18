import React, { useState, useRef } from 'react';
import { 
  Camera, 
  UploadCloud, 
  TrendingUp, 
  AlertTriangle, 
  Activity, 
  Clock, 
  Layers, 
  CheckCircle,
  FileImage,
  RefreshCw
} from 'lucide-react';
import Navbar from './components/Navbar';
import TrafficHero from './components/TrafficHero';

function App() {
  const [activeTab, setActiveTab] = useState('traffic-eye');
  // Pre-seed some realistic historical logs
  const [logs, setLogs] = useState([
    {
      id: 1,
      timestamp: new Date(Date.now() - 1000 * 60 * 12).toLocaleString(), // 12 mins ago
      location: 'Surat Center',
      count: 22,
      congestion: 'HEAVY',
      emergency: 'ACTIVE'
    },
    {
      id: 2,
      timestamp: new Date(Date.now() - 1000 * 60 * 35).toLocaleString(), // 35 mins ago
      location: 'Majura Gate',
      count: 4,
      congestion: 'LOW',
      emergency: 'INACTIVE'
    },
    {
      id: 3,
      timestamp: new Date(Date.now() - 1000 * 60 * 75).toLocaleString(), // 1 hr 15m ago
      location: 'Zone Alpha',
      count: 12,
      congestion: 'MODERATE',
      emergency: 'INACTIVE'
    }
  ]);

  // UI and State hooks
  const [location, setLocation] = useState('Majura Gate');
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isDragActive, setIsDragActive] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [telemetry, setTelemetry] = useState(null);
  const fileInputRef = useRef(null);

  // Handle Drag Over
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragActive(true);
    } else if (e.type === "dragleave") {
      setIsDragActive(false);
    }
  };

  // Process File Selection
  const processFile = (file) => {
    if (file && (file.type === "image/jpeg" || file.type === "image/png")) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result);
      };
      reader.readAsDataURL(file);
    } else {
      alert("Please upload a valid JPG or PNG traffic frame snapshot.");
    }
  };

  // Handle Drop
  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  // Handle Browse Click
  const handleBrowse = () => {
    fileInputRef.current.click();
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  // Trigger YOLOv8 Simulation Analysis
  const triggerAnalysis = () => {
    if (!selectedFile) {
      alert("Please select or drop a traffic snapshot image first.");
      return;
    }

    setIsAnalyzing(true);

    // Simulate 2 seconds of deep neural network frame inference delay
    setTimeout(() => {
      // Analyze file name for keywords to make demo interactive and cool
      const lowerName = selectedFile.name.toLowerCase();
      const isEmergency = lowerName.includes('ambulance') || lowerName.includes('emergency') || lowerName.includes('red');
      
      // Determine randomized/mock vehicle counts based on keyword heuristics
      let vehicleCount = Math.floor(Math.random() * 18) + 2; // default: 2 - 20
      if (lowerName.includes('heavy') || lowerName.includes('congestion')) {
        vehicleCount = Math.floor(Math.random() * 10) + 18; // 18 - 28
      } else if (lowerName.includes('empty') || lowerName.includes('low')) {
        vehicleCount = Math.floor(Math.random() * 4) + 1; // 1 - 5
      }

      // Map congestion level based on vehicles detected
      let congestionLevel = "LOW";
      if (vehicleCount > 15) {
        congestionLevel = "HEAVY";
      } else if (vehicleCount > 7) {
        congestionLevel = "MODERATE";
      }

      const mockTelemetry = {
        count: vehicleCount,
        congestion: congestionLevel,
        emergency: isEmergency ? 'ACTIVE' : 'INACTIVE',
        timestamp: new Date().toLocaleString()
      };

      setTelemetry(mockTelemetry);
      setIsAnalyzing(false);

      // Append results to historical table log
      const newLog = {
        id: Date.now(),
        timestamp: mockTelemetry.timestamp,
        location: location,
        count: mockTelemetry.count,
        congestion: mockTelemetry.congestion,
        emergency: mockTelemetry.emergency
      };

      setLogs(prevLogs => [newLog, ...prevLogs]);

    }, 1800);
  };

  // Reset current upload
  const resetUpload = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setTelemetry(null);
  };

  return (
    <div className="min-h-screen bg-white">
      <Navbar activeTab={activeTab} onNavigate={setActiveTab} />
      <TrafficHero 
        onLaunchAnalyzer={() => console.log('Launch Analyzer')} 
        onViewLogs={() => console.log('View Active Logs')} 
      />
      <div className="dashboard-container">
      {/* Header Section */}
      <header className="header">
        <div className="header-title-container">
          <Camera size={32} className="text-sapphire-medium" style={{ color: '#023E8A' }} />
          <h1 className="header-title">Traffic Eye: Real-Time Frame Analyzer</h1>
        </div>
        <div className="status-badge">
          <span className="status-indicator-dot"></span>
          <span>AI Core: Online</span>
        </div>
      </header>

      {/* Main Two-Column Panel Layout */}
      <main className="main-grid">
        
        {/* Interactive Control Panel (Left Card) */}
        <section className="card-panel">
          <h2 className="panel-title">
            <Layers size={20} style={{ color: '#48CAE4' }} />
            Control Hub
          </h2>

          <div style={{ marginBottom: '1.25rem' }}>
            <label className="panel-label">Intersection Camera Location</label>
            <select 
              className="form-select" 
              value={location} 
              onChange={(e) => setLocation(e.target.value)}
            >
              <option value="Majura Gate">Majura Gate (Surat Central)</option>
              <option value="Zone Alpha">Zone Alpha (Industrial Belt)</option>
              <option value="Surat Center">Surat Center (Commercial Plaza)</option>
              <option value="Varachha Main">Varachha Main (Transit Hub)</option>
            </select>
          </div>

          <label className="panel-label">Traffic snapshot frame (.jpg / .png)</label>
          <div 
            className={`dropzone ${isDragActive ? 'active' : ''}`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={previewUrl ? null : handleBrowse}
          >
            <input 
              ref={fileInputRef}
              type="file" 
              style={{ display: 'none' }} 
              accept=".jpg,.jpeg,.png"
              onChange={handleFileChange}
            />

            {previewUrl ? (
              <div style={{ width: '100%', position: 'relative' }}>
                <div className="preview-container">
                  <img src={previewUrl} alt="Traffic snapshot" className="preview-image" />
                </div>
                <div style={{ display: 'flex', justifyContent: 'center', gap: '0.75rem' }}>
                  <button 
                    onClick={resetUpload}
                    className="btn-primary" 
                    style={{ 
                      background: 'rgba(255,255,255,0.1)', 
                      border: '1.5px solid rgba(255,255,255,0.2)',
                      boxShadow: 'none',
                      padding: '0.5rem 1rem',
                      fontSize: '0.85rem'
                    }}
                  >
                    Remove Frame
                  </button>
                </div>
              </div>
            ) : (
              <>
                <UploadCloud size={48} className="dropzone-icon" />
                <p className="dropzone-text">Drag & drop camera frame or click to browse</p>
                <p className="dropzone-subtext">Supports JPEG, JPG, and PNG camera outputs up to 15MB</p>
              </>
            )}
          </div>

          {previewUrl && (
            <button 
              className="btn-primary" 
              onClick={triggerAnalysis} 
              disabled={isAnalyzing}
            >
              {isAnalyzing ? (
                <>
                  <div className="spinner"></div>
                  <span>YOLOv8 Processing Frame...</span>
                </>
              ) : (
                <>
                  <Activity size={20} />
                  <span>Trigger YOLOv8 Frame Analysis</span>
                </>
              )}
            </button>
          )}
        </section>

        {/* Live Analytics Telemetry Panel (Right Card) */}
        <section className="card-panel">
          <h2 className="panel-title">
            <TrendingUp size={20} style={{ color: '#48CAE4' }} />
            Live Telemetry Results
          </h2>

          {isAnalyzing ? (
            <div className="placeholder-telemetry">
              <RefreshCw size={40} className="spinner" style={{ animation: 'spin 1.5s linear infinite', marginBottom: '1rem', color: '#48CAE4' }} />
              <p style={{ margin: 0, fontWeight: 600, color: '#CAF0F8' }}>YOLOv8 Neural Core is executing object segmentation...</p>
              <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.8rem', opacity: 0.6 }}>Scanning vehicles, profiling dimension parameters, checking overrides</p>
            </div>
          ) : telemetry ? (
            <div style={{ width: '100%' }}>
              <div className="metric-display">
                <span className="metric-label">Total Vehicles Detected</span>
                <span className="metric-value">{telemetry.count}</span>
                <span className="metric-label">classified objects (cars, trucks, buses, motorcycles)</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)' }}>
                <div>
                  <span className="panel-label" style={{ marginBottom: 0 }}>Congestion Index Level</span>
                </div>
                <div className={`congestion-badge ${
                  telemetry.congestion === 'LOW' ? 'congestion-low' : 
                  telemetry.congestion === 'MODERATE' ? 'congestion-moderate' : 'congestion-heavy'
                }`}>
                  {telemetry.congestion}
                </div>
              </div>

              {telemetry.emergency === 'ACTIVE' ? (
                <div className="emergency-banner">
                  <div className="emergency-icon-container">
                    <AlertTriangle size={24} />
                  </div>
                  <div>
                    <p className="emergency-title">Emergency Override Activated</p>
                    <p className="emergency-desc">Priority green phase forced for Ambulance/Emergency response unit.</p>
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', marginTop: '1.5rem', padding: '1rem', backgroundColor: 'rgba(6, 214, 160, 0.05)', border: '1px solid rgba(6, 214, 160, 0.15)', borderRadius: '8px', color: '#06D6A0' }}>
                  <CheckCircle size={20} />
                  <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>Emergency overrides inactive. Grid operates on default schedules.</span>
                </div>
              )}
            </div>
          ) : (
            <div className="placeholder-telemetry">
              <Camera size={48} style={{ color: 'rgba(255, 255, 255, 0.2)', marginBottom: '1rem' }} />
              <p style={{ margin: 0, fontWeight: 600 }}>Waiting for frame upload</p>
              <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.8rem', opacity: 0.5 }}>Select a traffic snapshot on the left control hub to run predictive analytics</p>
            </div>
          )}
        </section>
      </main>

      {/* Historical Logs Table Section */}
      <section className="logs-section">
        <div className="logs-title-container">
          <h2 className="logs-title">
            <Clock size={20} style={{ verticalAlign: 'middle', marginRight: '0.5rem', display: 'inline', color: '#023E8A' }} />
            Historical Frame Telemetry Log
          </h2>
          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#64748B' }}>
            Showing {logs.length} processed intersections
          </span>
        </div>

        <div className="table-wrapper">
          <table className="logs-table">
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Camera Location</th>
                <th>Vehicle Count</th>
                <th>Congestion Status</th>
                <th>Emergency Status</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id}>
                  <td>{log.timestamp}</td>
                  <td style={{ color: '#023E8A', fontWeight: 700 }}>{log.location}</td>
                  <td>{log.count} classified vehicles</td>
                  <td>
                    <span className={`badge-status ${
                      log.congestion === 'LOW' ? 'badge-status-low' :
                      log.congestion === 'MODERATE' ? 'badge-status-moderate' : 'badge-status-heavy'
                    }`}>
                      {log.congestion}
                    </span>
                  </td>
                  <td>
                    <span className={`badge-emergency ${
                      log.emergency === 'ACTIVE' ? 'badge-emergency-active' : 'badge-emergency-inactive'
                    }`}>
                      {log.emergency}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  </div>
  );
}

export default App;
