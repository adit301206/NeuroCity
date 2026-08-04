import React, { useState, useEffect } from 'react';
import { 
  Zap, 
  Wind, 
  Thermometer, 
  Droplets, 
  Clock, 
  Calendar, 
  RefreshCw, 
  ShieldAlert, 
  Database, 
  Activity, 
  MapPin, 
  TrendingUp, 
  CheckCircle2, 
  AlertTriangle 
} from 'lucide-react';

export default function EnergyWorkspace() {
  // --- Form & Prediction State Matrix ---
  const [city, setCity] = useState('Surat');
  const [temperature, setTemperature] = useState(30);
  const [humidity, setHumidity] = useState(60);
  const [windSpeed, setWindSpeed] = useState(15);
  const [hour, setHour] = useState(12);
  const [month, setMonth] = useState(6);
  
  const [isLoading, setIsLoading] = useState(false);
  const [prediction, setPrediction] = useState({
    predicted_load_mw: 245.50,
    grid_capacity_mw: 800,
    capacity_utilization_pct: 30.69,
    grid_status: 'STABLE', // STABLE, MODERATE_HIGH, CRITICAL_PEAK
    source: 'initial'
  });

  // Table Logs state (loaded live from MongoDB Atlas)
  const [logs, setLogs] = useState([]);
  const [logsLoading, setLogsLoading] = useState(false);

  // --- Fetch Historical Logs from Node Backend ---
  const fetchLogs = async () => {
    setLogsLoading(true);
    const token = localStorage.getItem('neurocity_token') || localStorage.getItem('token') || localStorage.getItem('authToken');
    const headers = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    try {
      const response = await fetch('/api/energy/logs', {
        method: 'GET',
        headers: headers
      });
      if (response.ok) {
        const result = await response.json();
        if (result.status === 'success' && Array.isArray(result.data)) {
          const mapped = result.data.map(log => ({
            id: log._id,
            timestamp: new Date(log.createdAt).toLocaleString('en-GB', { hour12: false }).replace(/\//g, '-'),
            city: log.city || 'Surat',
            metrics: `${log.temperature}°C | ${log.humidity}% | ${log.windSpeed || 0} km/h`,
            timeInfo: `H: ${String(log.hour || 0).padStart(2, '0')} | M: ${log.month || 1}`,
            load: `${log.predictedLoadMW.toFixed(2)} MW`,
            status: log.gridStatus || 'STABLE',
            checkedBy: log.checkedBy ? log.checkedBy.name : 'System Scheduler'
          }));
          setLogs(mapped);
        }
      }
    } catch (error) {
      console.error("Failed to fetch historical energy logs:", error);
    } finally {
      setLogsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  // --- Handle Predictive Request POST ---
  const handleExecuteForecast = async () => {
    setIsLoading(true);

    const token = localStorage.getItem('neurocity_token') || localStorage.getItem('token') || localStorage.getItem('authToken');
    const headers = {
      'Content-Type': 'application/json'
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const payload = {
      city,
      temperature,
      humidity,
      wind_speed: windSpeed,
      hour,
      month
    };

    try {
      const response = await fetch('/api/energy/predict', {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(payload)
      });

      const result = await response.json();

      if (response.ok && result.status === 'success') {
        const data = result.data;
        const load = Number(data.predictedLoadMW);
        const utilization = (load / 800) * 100;
        
        setPrediction({
          predicted_load_mw: load,
          grid_capacity_mw: 800,
          capacity_utilization_pct: Number(utilization.toFixed(2)),
          grid_status: data.gridStatus, // STABLE, MODERATE_HIGH, CRITICAL_PEAK
          source: result.source || 'django'
        });

        // Trigger log refresh to prepend new entry
        fetchLogs();
      } else {
        throw new Error(result.message || "Endpoint returned error, running simulation");
      }
    } catch (err) {
      console.log("[Node Backend Connection Failed or Unauthorized - Running High-Fidelity Simulation Fallback]", err);
      
      // High-Fidelity Fallback Logic matching Node backend calculation
      setTimeout(() => {
        const tempFactor = Math.max(0, temperature - 20) * 12.5; // Cooling load above 20C
        const humidFactor = humidity * 1.5;
        const windFactor = windSpeed * -0.5; // Wind cooling effect
        const peakHourBonus = (hour >= 17 && hour <= 21) ? 120 : (hour >= 9 && hour <= 16) ? 60 : 0; 
        
        // Base demand (250) + effects + random noise
        const rawPrediction = 250 + tempFactor + humidFactor + windFactor + peakHourBonus + (Math.random() * 20 - 10);
        const load = Math.round(Math.max(100, Math.min(790, rawPrediction)) * 100) / 100;
        const utilization = Number(((load / 800) * 100).toFixed(2));
        
        let status = 'STABLE';
        if (load > 600) {
          status = 'CRITICAL_PEAK';
        } else if (load > 400) {
          status = 'MODERATE_HIGH';
        }

        setPrediction({
          predicted_load_mw: load,
          grid_capacity_mw: 800,
          capacity_utilization_pct: utilization,
          grid_status: status,
          source: 'simulation'
        });

        // Prepend a mock log entry
        const mockLog = {
          id: `mock-log-${Date.now()}`,
          timestamp: new Date().toLocaleString('en-GB', { hour12: false }).replace(/\//g, '-'),
          city: city,
          metrics: `${temperature}°C | ${humidity}% | ${windSpeed} km/h`,
          timeInfo: `H: ${String(hour).padStart(2, '0')} | M: ${month}`,
          load: `${load.toFixed(2)} MW`,
          status: status,
          checkedBy: token ? 'Session User' : 'Local Administrator (Offline)'
        };
        setLogs(prev => [mockLog, ...prev]);
      }, 1200);
    } finally {
      setTimeout(() => setIsLoading(false), 1200);
    }
  };

  // --- Dynamic Color Schemes and Operational Recommendations ---
  const getGridTheme = (status) => {
    switch (status) {
      case 'CRITICAL_PEAK':
        return {
          color: 'text-rose-500',
          border: 'border-rose-500/30',
          bg: 'bg-rose-500/10',
          shadow: 'shadow-[0_0_20px_rgba(244,63,94,0.25)]',
          badgeBg: 'bg-rose-500',
          progressGrad: 'from-rose-500 to-red-600',
          gaugeColor: '#F43F5E',
          icon: <ShieldAlert className="w-5 h-5 text-rose-500 animate-pulse" />,
          recommendation: "Peak critical demand. Deploy emergency battery reserves and schedule rolling load-shedding alerts for heavy consumers."
        };
      case 'MODERATE_HIGH':
        return {
          color: 'text-amber-500',
          border: 'border-amber-500/30',
          bg: 'bg-amber-500/10',
          shadow: 'shadow-[0_0_20px_rgba(245,158,11,0.2)]',
          badgeBg: 'bg-amber-500',
          progressGrad: 'from-amber-400 to-orange-500',
          gaugeColor: '#F59E0B',
          icon: <AlertTriangle className="w-5 h-5 text-amber-500 animate-bounce" />,
          recommendation: "Stressed grid conditions. Recommend voluntary industrial demand-response participation."
        };
      case 'STABLE':
      default:
        return {
          color: 'text-emerald-500',
          border: 'border-emerald-500/30',
          bg: 'bg-emerald-500/10',
          shadow: 'shadow-[0_0_20px_rgba(16,185,129,0.15)]',
          badgeBg: 'bg-emerald-500',
          progressGrad: 'from-emerald-400 to-teal-500',
          gaugeColor: '#10B981',
          icon: <CheckCircle2 className="w-5 h-5 text-emerald-500" />,
          recommendation: "Grid operating within optimal parameters. No curtailment required."
        };
    }
  };

  const gridTheme = getGridTheme(prediction.grid_status);

  // SVG Gauge Calculations
  const radius = 50;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (circumference * prediction.capacity_utilization_pct) / 100;

  // Month Display mapping
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  return (
    <div className="w-full bg-white relative transition-all duration-500">
      
      {/* Component Title & Status Bar */}
      <div className="mx-6 mt-8 flex flex-col md:flex-row md:items-center justify-between border-b border-[#00B4D8]/20 pb-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-[#03045E] flex items-center gap-2">
            <Zap className="w-6 h-6 text-[#00B4D8] animate-pulse" />
            ENERGY SENTINEL // REGIONAL GRID FORECASTING COMMAND
          </h1>
          <p className="text-slate-500 text-xs mt-1">
            Machine learning grid stress simulator using deep regressors powered by MongoDB Atlas.
          </p>
        </div>
        <div className="mt-3 md:mt-0 flex items-center gap-4">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#CAF0F8]/50 border border-[#00B4D8]/20">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00B4D8] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#0077B6]"></span>
            </span>
            <span className="font-mono text-[10px] text-[#03045E] font-semibold">
              PREDICTOR: {prediction.source.toUpperCase()}
            </span>
          </div>
          <button
            onClick={fetchLogs}
            disabled={logsLoading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#03045E] hover:bg-[#023E8A] border border-[#00B4D8]/30 text-white font-mono text-[10px] transition-all cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${logsLoading ? 'animate-spin' : ''}`} />
            <span>SYNC ATLAS</span>
          </button>
        </div>
      </div>

      {/* Main 3-Column Dashboard Matrix */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mx-6 mt-8 mb-12">

        {/* COLUMN 1: ENVIRONMENTAL INPUT DECK */}
        <section className="bg-[#CAF0F8]/20 backdrop-blur-md border border-slate-200/80 shadow-md rounded-2xl p-6 flex flex-col justify-between min-h-[500px]">
          <div>
            <div className="flex justify-between items-center mb-5 border-b border-[#00B4D8]/20 pb-2">
              <span className="font-mono text-xs font-bold tracking-wider text-[#03045E] flex items-center gap-1.5">
                <Activity className="w-4 h-4 text-[#00B4D8]" />
                ENVIRONMENTAL METRIC INPUTS
              </span>
              <div className="h-1.5 w-1.5 rounded-full bg-[#00B4D8]" />
            </div>

            {/* City Selection */}
            <div className="mb-4">
              <label className="block text-[11px] font-mono font-bold text-[#03045E] mb-1.5 uppercase">
                1. MUNICIPAL TARGET CITY
              </label>
              <div className="relative">
                <select
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 focus:outline-none focus:border-[#00B4D8] transition-all cursor-pointer appearance-none"
                >
                  <option value="Surat">Surat (Gujarat - West Zone)</option>
                  <option value="Ahmedabad">Ahmedabad (Gujarat - North Zone)</option>
                  <option value="Vadodara">Vadodara (Gujarat - Central Zone)</option>
                  <option value="Rajkot">Rajkot (Gujarat - Saurashtra Zone)</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-500 border-l border-slate-200">
                  <MapPin className="w-3.5 h-3.5 text-[#00B4D8]" />
                </div>
              </div>
            </div>

            {/* Sliders Area */}
            <div className="space-y-4">
              {/* Temperature */}
              <div>
                <div className="flex justify-between text-[11px] font-mono font-bold text-[#03045E] mb-1">
                  <span className="flex items-center gap-1">
                    <Thermometer className="w-3.5 h-3.5 text-orange-500" />
                    TEMPERATURE
                  </span>
                  <span>{temperature} °C</span>
                </div>
                <input
                  type="range"
                  min="-10"
                  max="50"
                  value={temperature}
                  onChange={(e) => setTemperature(Number(e.target.value))}
                  className="w-full h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#0077B6]"
                />
                <div className="flex justify-between text-[9px] text-slate-400 font-mono mt-0.5">
                  <span>-10°C</span>
                  <span>Freezing</span>
                  <span>Optimal</span>
                  <span>Peak Heat (50°C)</span>
                </div>
              </div>

              {/* Humidity */}
              <div>
                <div className="flex justify-between text-[11px] font-mono font-bold text-[#03045E] mb-1">
                  <span className="flex items-center gap-1">
                    <Droplets className="w-3.5 h-3.5 text-[#00B4D8]" />
                    HUMIDITY
                  </span>
                  <span>{humidity} %</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={humidity}
                  onChange={(e) => setHumidity(Number(e.target.value))}
                  className="w-full h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#0077B6]"
                />
                <div className="flex justify-between text-[9px] text-slate-400 font-mono mt-0.5">
                  <span>0% (Dry)</span>
                  <span>Comfortable</span>
                  <span>100% (Dense)</span>
                </div>
              </div>

              {/* Wind Speed */}
              <div>
                <div className="flex justify-between text-[11px] font-mono font-bold text-[#03045E] mb-1">
                  <span className="flex items-center gap-1">
                    <Wind className="w-3.5 h-3.5 text-sky-500" />
                    WIND SPEED
                  </span>
                  <span>{windSpeed} km/h</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={windSpeed}
                  onChange={(e) => setWindSpeed(Number(e.target.value))}
                  className="w-full h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#0077B6]"
                />
                <div className="flex justify-between text-[9px] text-slate-400 font-mono mt-0.5">
                  <span>Calm (0)</span>
                  <span>Moderate</span>
                  <span>Storm (100)</span>
                </div>
              </div>

              {/* Hour of Day */}
              <div>
                <div className="flex justify-between text-[11px] font-mono font-bold text-[#03045E] mb-1">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-[#03045E]" />
                    HOUR OF DAY
                  </span>
                  <span>{String(hour).padStart(2, '0')}:00</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="23"
                  value={hour}
                  onChange={(e) => setHour(Number(e.target.value))}
                  className="w-full h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#03045E]"
                />
                <div className="flex justify-between text-[9px] text-slate-400 font-mono mt-0.5">
                  <span>00:00 (Midnight)</span>
                  <span>12:00 (Noon)</span>
                  <span>23:00</span>
                </div>
              </div>

              {/* Month */}
              <div>
                <div className="flex justify-between text-[11px] font-mono font-bold text-[#03045E] mb-1">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-[#03045E]" />
                    FORECAST MONTH
                  </span>
                  <span>{monthNames[month - 1]} ({month})</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="12"
                  value={month}
                  onChange={(e) => setMonth(Number(e.target.value))}
                  className="w-full h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#03045E]"
                />
                <div className="flex justify-between text-[9px] text-slate-400 font-mono mt-0.5">
                  <span>Jan</span>
                  <span>Apr</span>
                  <span>Jul</span>
                  <span>Oct</span>
                  <span>Dec</span>
                </div>
              </div>
            </div>
          </div>

          {/* Action Trigger */}
          <div className="mt-8">
            <button
              onClick={handleExecuteForecast}
              disabled={isLoading}
              className="w-full py-3 rounded-xl font-mono text-xs font-bold text-white bg-[#03045E] hover:bg-[#023E8A] border border-[#00B4D8] shadow-[0_0_15px_rgba(72,202,228,0.25)] hover:shadow-[0_0_20px_rgba(72,202,228,0.4)] transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>INTERPRETING METRICS...</span>
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 text-amber-300" />
                  <span>EXECUTE PREDICTIVE FORECAST</span>
                </>
              )}
            </button>
          </div>
        </section>

        {/* COLUMN 2: ANALYTICS & VISUALIZER DECK */}
        <section className="bg-white border border-slate-200 shadow-md rounded-2xl p-6 flex flex-col justify-between min-h-[500px]">
          <div>
            <div className="flex justify-between items-center mb-5 border-b border-[#00B4D8]/20 pb-2">
              <span className="font-mono text-xs font-bold tracking-wider text-[#03045E] flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4 text-[#0077B6]" />
                PREDICTIVE GRID ANALYTICS
              </span>
              <div className="h-1.5 w-1.5 rounded-full bg-[#0077B6]" />
            </div>

            {/* Circular Gauge and Stats */}
            <div className="flex flex-col items-center justify-center my-6">
              <div className="relative flex items-center justify-center w-36 h-36">
                <svg className="w-full h-full transform -rotate-90">
                  {/* Gauge Background circle */}
                  <circle
                    cx="72"
                    cy="72"
                    r={radius}
                    stroke="#E2E8F0"
                    strokeWidth="10"
                    fill="transparent"
                  />
                  {/* Active gauge bar */}
                  <circle
                    cx="72"
                    cy="72"
                    r={radius}
                    stroke={gridTheme.gaugeColor}
                    strokeWidth="10"
                    fill="transparent"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    className="transition-all duration-1000 ease-out"
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute flex flex-col items-center justify-center font-mono">
                  <span className="text-xl font-bold text-[#03045E]">
                    {prediction.capacity_utilization_pct}%
                  </span>
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                    UTILIZATION
                  </span>
                </div>
              </div>

              {/* Big Megawatt Load Status */}
              <div className="text-center mt-5">
                <span className="text-3xl font-mono font-bold text-[#03045E] tracking-tight">
                  {prediction.predicted_load_mw.toFixed(2)}
                </span>
                <span className="text-sm font-semibold text-slate-400 ml-1.5 font-mono">
                  MW
                </span>
                <div className="text-[10px] font-mono text-slate-500 uppercase mt-1 tracking-wider">
                  PREDICTED DEMAND / {prediction.grid_capacity_mw}.00 MW CAPACITY
                </div>
              </div>
            </div>
          </div>

          <div>
            {/* Linear Progress Bar */}
            <div className="w-full mb-6">
              <div className="flex justify-between text-[10px] font-mono text-slate-500 mb-1 font-bold">
                <span>GRID LOAD RATIO</span>
                <span>{prediction.predicted_load_mw.toFixed(1)} / 800.0 MW</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                <div 
                  style={{ width: `${prediction.capacity_utilization_pct}%` }} 
                  className={`h-full bg-gradient-to-r ${gridTheme.progressGrad} transition-all duration-1000 ease-out`}
                />
              </div>
            </div>

            {/* Dynamic Grid Status Alert Box */}
            <div className={`p-4 rounded-xl border ${gridTheme.border} ${gridTheme.bg} ${gridTheme.shadow} transition-all duration-500 flex items-start gap-3`}>
              <div className="mt-0.5">{gridTheme.icon}</div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500">
                    GRID OPERATION STATUS
                  </span>
                  <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded text-white ${gridTheme.badgeBg}`}>
                    {prediction.grid_status.replace('_', ' ')}
                  </span>
                </div>
                <p className={`text-xs font-sans mt-2 font-medium leading-relaxed ${gridTheme.color}`}>
                  {gridTheme.recommendation}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* COLUMN 3: HISTORICAL LOGS DECK */}
        <section className="bg-white border border-slate-200 shadow-md rounded-2xl p-6 flex flex-col justify-between min-h-[500px] lg:col-span-1">
          <div className="w-full flex flex-col h-full">
            <div className="flex justify-between items-center mb-5 border-b border-[#00B4D8]/20 pb-2">
              <span className="font-mono text-xs font-bold tracking-wider text-[#03045E] flex items-center gap-1.5">
                <Database className="w-4 h-4 text-[#0077B6]" />
                ATLAS HISTORICAL LOGS
              </span>
              <span className="text-[10px] text-slate-400 font-mono">
                [ LIMIT 50 ]
              </span>
            </div>

            {/* Scrollable Logs Container */}
            <div className="flex-1 overflow-y-auto max-h-[360px] pr-1 scrollbar-thin">
              {logsLoading && logs.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-48 font-mono text-slate-400 text-xs">
                  <RefreshCw className="w-5 h-5 animate-spin text-[#00B4D8] mb-2" />
                  <span>POLLING MONGO ATLAS RECORDS...</span>
                </div>
              ) : logs.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-48 text-slate-400 text-xs font-mono border border-dashed border-slate-200 rounded-xl">
                  <span>NO LOG ENTRIES DETECTED</span>
                  <span className="text-[9px] text-slate-300 mt-1 uppercase">[ DB STANDBY ]</span>
                </div>
              ) : (
                <div className="space-y-3">
                  {logs.map((log) => {
                    const logTheme = getGridTheme(log.status);
                    return (
                      <div 
                        key={log.id} 
                        className="p-3 border border-slate-100 hover:border-[#00B4D8]/30 rounded-xl bg-slate-50/50 hover:bg-slate-50 transition-all font-mono text-[10px] text-slate-600 flex flex-col gap-1.5"
                      >
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-[#03045E] flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-[#00B4D8]" />
                            {log.city}
                          </span>
                          <span className="text-slate-400 text-[9px]">{log.timestamp}</span>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-1 text-[9px] text-slate-500">
                          <div>METRICS: <span className="font-bold text-slate-700">{log.metrics}</span></div>
                          <div>SCHEDULE: <span className="font-bold text-slate-700">{log.timeInfo}</span></div>
                        </div>

                        <div className="flex justify-between items-center border-t border-slate-200/50 pt-1.5 mt-0.5">
                          <div className="flex items-center gap-1.5">
                            <span className="text-slate-400 text-[8px] uppercase">LOAD:</span>
                            <span className="font-bold text-slate-800 text-xs">{log.load}</span>
                          </div>
                          <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold text-white ${logTheme.badgeBg}`}>
                            {log.status.replace('_', ' ')}
                          </span>
                        </div>

                        <div className="text-[8px] text-slate-400 flex items-center gap-1 border-t border-slate-200/30 pt-1.5">
                          <span>OPERATOR:</span>
                          <span className="font-bold text-slate-600 truncate">{log.checkedBy}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <p className="text-[9px] text-slate-400 font-mono mt-4 leading-relaxed uppercase border-t border-slate-100 pt-3">
              * Database synchronization is maintained in real-time. Direct operations query local cluster replica sets.
            </p>
          </div>
        </section>

      </div>
      
    </div>
  );
}
