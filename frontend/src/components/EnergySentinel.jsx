import React, { useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { 
  Activity, Sun, Wind, Droplets, Zap, MapPin, Cpu, RefreshCw, Power, BatteryCharging, Gauge, Search, ChevronDown
} from 'lucide-react';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Leaflet Default Marker Icon Fix
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

// Helper component to smoothly animate map zoom/fly-to
function ChangeView({ center }) {
  const map = useMap();
  map.flyTo(center, 9, { duration: 1.5 });
  return null;
}

export default function EnergySentinel() {
  const [selectedCity, setSelectedCity] = useState('Delhi');
  const [searchTerm, setSearchTerm] = useState('');
  const [autoOptimize, setAutoOptimize] = useState(true);

  // Expanded City Data
  const cityData = {
    Delhi: { name: 'Delhi', region: 'National Capital Territory', coords: '28.6139° N, 77.2090° E', latlng: [28.6139, 77.2090], status: 'MODERATE', load: '6840 MW', util: 78, temp: '38.2°C', humidity: '44%', wind: '12.8 km/h', solar: '612 W/m²', model: 'RF_v2.1' },
    Ahmedabad: { name: 'Ahmedabad', region: 'Western Industrial Zone', coords: '23.0225° N, 72.5714° E', latlng: [23.0225, 72.5714], status: 'OPTIMAL', load: '4520 MW', util: 65, temp: '40.1°C', humidity: '38%', wind: '14.2 km/h', solar: '720 W/m²', model: 'RF_v2.1' },
    Mumbai: { name: 'Mumbai', region: 'Coastal Metro Hub', coords: '19.0760° N, 72.8777° E', latlng: [19.0760, 72.8777], status: 'HIGH_LOAD', load: '7910 MW', util: 91, temp: '33.5°C', humidity: '78%', wind: '18.5 km/h', solar: '480 W/m²', model: 'RF_v2.1' },
    Bengaluru: { name: 'Bengaluru', region: 'Southern Tech Corridor', coords: '12.9716° N, 77.5946° E', latlng: [12.9716, 77.5946], status: 'OPTIMAL', load: '3850 MW', util: 58, temp: '28.4°C', humidity: '65%', wind: '10.1 km/h', solar: '550 W/m²', model: 'RF_v2.1' },
    Kolkata: { name: 'Kolkata', region: 'Eastern Power Grid', coords: '22.5726° N, 88.3639° E', latlng: [22.5726, 88.3639], status: 'MODERATE', load: '4120 MW', util: 72, temp: '35.0°C', humidity: '82%', wind: '9.4 km/h', solar: '490 W/m²', model: 'RF_v2.1' },
    Chennai: { name: 'Chennai', region: 'Southern Coastal Grid', coords: '13.0827° N, 80.2707° E', latlng: [13.0827, 80.2707], status: 'HIGH_LOAD', load: '5200 MW', util: 84, temp: '36.8°C', humidity: '75%', wind: '16.2 km/h', solar: '680 W/m²', model: 'RF_v2.1' },
    Hyderabad: { name: 'Hyderabad', region: 'Deccan Tech Hub', coords: '17.3850° N, 78.4867° E', latlng: [17.3850, 78.4867], status: 'OPTIMAL', load: '4890 MW', util: 69, temp: '34.2°C', humidity: '52%', wind: '11.5 km/h', solar: '610 W/m²', model: 'RF_v2.1' },
    Pune: { name: 'Pune', region: 'Western Industrial Hub', coords: '18.5204° N, 73.8567° E', latlng: [18.5204, 73.8567], status: 'OPTIMAL', load: '3600 MW', util: 62, temp: '31.0°C', humidity: '58%', wind: '13.0 km/h', solar: '590 W/m²', model: 'RF_v2.1' },
    Jaipur: { name: 'Jaipur', region: 'Northern Desert Grid', coords: '26.9124° N, 75.7873° E', latlng: [26.9124, 75.7873], status: 'MODERATE', load: '3100 MW', util: 70, temp: '39.5°C', humidity: '30%', wind: '15.0 km/h', solar: '750 W/m²', model: 'RF_v2.1' },
    Surat: { name: 'Surat', region: 'Gujarat Industrial Belt', coords: '21.1702° N, 72.8311° E', latlng: [21.1702, 72.8311], status: 'OPTIMAL', load: '3980 MW', util: 66, temp: '37.0°C', humidity: '60%', wind: '12.0 km/h', solar: '690 W/m²', model: 'RF_v2.1' },
    Rajkot: { name: 'Rajkot', region: 'Saurashtra Power Hub', coords: '22.3025° N, 70.7942° E', latlng: [22.3025, 70.7942], status: 'OPTIMAL', load: '2950 MW', util: 61, temp: '39.0°C', humidity: '41%', wind: '11.0 km/h', solar: '730 W/m²', model: 'RF_v2.1' }
  };

  // Synchronized Selection Handler
  const handleCitySelect = (cityName) => {
    if (cityData[cityName]) {
      setSelectedCity(cityName);
      setSearchTerm(cityName); // Synchronizes Search Bar with Selection
    }
  };

  // Filtered list for Quick Selection buttons
  const filteredCities = Object.keys(cityData).filter((cityName) =>
    cityName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const current = cityData[selectedCity] || cityData['Delhi'];
  const baseLoad = parseInt(current.load);

  // Dynamic Graph Data
  const hourlyData = [
    { time: '00:00', load: Math.round(baseLoad * 0.65) },
    { time: '04:00', load: Math.round(baseLoad * 0.55) },
    { time: '08:00', load: Math.round(baseLoad * 0.75) },
    { time: '12:00', load: baseLoad },
    { time: '16:00', load: Math.round(baseLoad * 0.90) },
    { time: '20:00', load: Math.round(baseLoad * 0.85) },
    { time: '24:00', load: Math.round(baseLoad * 0.70) },
  ];

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const matchedCity = Object.keys(cityData).find(
      (c) => c.toLowerCase() === searchTerm.trim().toLowerCase()
    );
    if (matchedCity) {
      handleCitySelect(matchedCity);
    } else if (filteredCities.length > 0) {
      handleCitySelect(filteredCities[0]);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-[#03045E] p-6 font-sans">
      
      {/* 1. HERO BANNER */}
      <div className="w-full bg-[#0F1264] text-white rounded-3xl p-6 lg:p-8 border border-[#0077B6]/40 shadow-2xl mb-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-7 space-y-5">
            <div>
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#0077B6]/30 text-[#48CAE4] text-xs font-mono font-bold tracking-widest border border-[#48CAE4]/30 mb-3">
                <Cpu className="w-3.5 h-3.5" /> QUANTUM POWER GRID // MODEL 02
              </span>
              <h1 className="text-3xl lg:text-5xl font-black tracking-tight leading-tight text-white">
                ENERGY SENTINEL: <span className="text-[#48CAE4]">NEURAL GRID</span>
              </h1>
            </div>

            <p className="text-slate-200 text-sm font-light leading-relaxed max-w-2xl">
              Autonomous load-balancing and predictive power distribution across Smart City sectors. Real-time telemetry monitoring carbon offset and automated micro-grid overrides.
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-2">
              <button 
                onClick={() => setAutoOptimize(!autoOptimize)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-mono font-bold transition-all shadow-lg ${
                  autoOptimize 
                    ? 'bg-[#0077B6] hover:bg-[#0096C7] text-white shadow-cyan-950/50' 
                    : 'bg-[#131971] text-slate-300 border border-[#0077B6]/40'
                }`}
              >
                <Power className="w-4 h-4" />
                Auto-Optimize: {autoOptimize ? 'ACTIVE' : 'OFF'}
              </button>

              <button className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#131971] hover:bg-[#181F87] text-[#CAF0F8] border border-[#0077B6]/50 text-xs font-mono font-bold transition-all">
                <RefreshCw className="w-4 h-4 text-[#48CAE4]" />
                Sync Telemetry
              </button>
            </div>
          </div>

          <div className="lg:col-span-5">
            <div className="bg-[#131971] rounded-2xl p-5 border border-[#0077B6]/50 shadow-2xl relative overflow-hidden">
              <div className="flex items-center justify-between text-[11px] font-mono text-[#CAF0F8] border-b border-[#0077B6]/40 pb-3 mb-4">
                <div className="flex items-center gap-2 font-bold text-[#48CAE4]">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  GRID_STABILITY: 99.98%
                </div>
                <div className="text-slate-300">
                  SURGE_PROTECTION: <span className="text-emerald-400 font-bold">ON</span>
                </div>
              </div>

              <div className="bg-[#0B0E4E] rounded-xl p-6 border border-[#0077B6]/30 text-center flex flex-col items-center justify-center relative">
                <div className="relative w-20 h-20 rounded-full border-2 border-dashed border-[#0077B6] flex items-center justify-center mb-3 shadow-[0_0_25px_rgba(0,119,182,0.4)]">
                  <div className="w-14 h-14 rounded-full bg-[#0077B6]/30 flex items-center justify-center">
                    <Zap className="w-7 h-7 text-[#48CAE4] animate-pulse" />
                  </div>
                </div>

                <p className="font-mono text-xs text-[#CAF0F8] tracking-widest font-semibold">
                  [ DYNAMIC LOAD DISTRIBUTION HIGHWAY ]
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. TOP METRICS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-6">
        <div className="bg-[#E6F7FF] rounded-2xl p-5 border border-[#0077B6]/20 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-mono font-bold tracking-wider text-[#0077B6] uppercase">TOTAL POWER DEMAND</span>
            <div className="text-2xl font-black text-[#03045E] mt-1">842.5 MW</div>
            <span className="text-[11px] font-mono font-semibold text-sky-600 mt-0.5 inline-block">+4.2% Peak Load</span>
          </div>
          <div className="w-10 h-10 rounded-full bg-white border border-[#0077B6]/20 flex items-center justify-center shadow-xs">
            <Zap className="w-5 h-5 text-[#0077B6]" />
          </div>
        </div>

        <div className="bg-[#E6F7FF] rounded-2xl p-5 border border-[#0077B6]/20 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-mono font-bold tracking-wider text-[#0077B6] uppercase">RENEWABLE SHARE</span>
            <div className="text-2xl font-black text-[#03045E] mt-1">68.4%</div>
            <span className="text-[11px] font-mono font-semibold text-sky-600 mt-0.5 inline-block">Solar & Wind Primary</span>
          </div>
          <div className="w-10 h-10 rounded-full bg-white border border-[#0077B6]/20 flex items-center justify-center shadow-xs">
            <Sun className="w-5 h-5 text-amber-500" />
          </div>
        </div>

        <div className="bg-[#E6F7FF] rounded-2xl p-5 border border-[#0077B6]/20 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-mono font-bold tracking-wider text-[#0077B6] uppercase">GRID FREQUENCY</span>
            <div className="text-2xl font-black text-[#03045E] mt-1">50.02 Hz</div>
            <span className="text-[11px] font-mono font-semibold text-emerald-600 mt-0.5 inline-block">Optimal Stability</span>
          </div>
          <div className="w-10 h-10 rounded-full bg-white border border-[#0077B6]/20 flex items-center justify-center shadow-xs">
            <Gauge className="w-5 h-5 text-emerald-600" />
          </div>
        </div>

        <div className="bg-[#E6F7FF] rounded-2xl p-5 border border-[#0077B6]/20 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-mono font-bold tracking-wider text-[#0077B6] uppercase">STORAGE CAPACITY</span>
            <div className="text-2xl font-black text-[#03045E] mt-1">91.8%</div>
            <span className="text-[11px] font-mono font-semibold text-sky-600 mt-0.5 inline-block">BESS Online (1.2 GW)</span>
          </div>
          <div className="w-10 h-10 rounded-full bg-white border border-[#0077B6]/20 flex items-center justify-center shadow-xs">
            <BatteryCharging className="w-5 h-5 text-blue-600" />
          </div>
        </div>
      </div>

      {/* 3. MAIN DASHBOARD GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT COLUMN: COMMAND PANEL */}
        <div className="lg:col-span-5 bg-[#03045E] text-[#CAF0F8] rounded-3xl p-6 border border-[#0077B6]/40 shadow-2xl flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between border-b border-[#0077B6]/40 pb-4 mb-4">
              <span className="font-bold text-sm tracking-wide text-[#48CAE4] flex items-center gap-2">
                <MapPin className="w-4 h-4 text-[#48CAE4]" /> GEOGRAPHIC COMMAND PANEL
              </span>
              <span className="text-[10px] font-mono bg-[#023E8A] px-2 py-1 rounded text-[#48CAE4] font-bold border border-[#0077B6]/50">
                ACTIVE NODES
              </span>
            </div>

            {/* SEARCH AND DROPDOWN PANEL (SYNCHRONIZED) */}
            <div className="space-y-3 mb-4">
              {/* Search Bar */}
              <form onSubmit={handleSearchSubmit} className="relative">
                <input
                  type="text"
                  placeholder="Search city..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-[#023E8A]/80 text-white placeholder-slate-400 text-xs font-mono px-9 py-2.5 rounded-xl border border-[#0077B6]/50 focus:outline-none focus:border-[#48CAE4] transition-all"
                />
                <Search className="w-4 h-4 text-[#48CAE4] absolute left-3 top-3" />
                <button 
                  type="submit" 
                  className="absolute right-2 top-1.5 px-2.5 py-1 bg-[#0077B6] text-white text-[10px] font-mono rounded-lg hover:bg-[#0096C7] font-bold"
                >
                  SELECT
                </button>
              </form>

              {/* Dropdown Menu */}
              <div className="relative">
                <select
                  value={selectedCity}
                  onChange={(e) => handleCitySelect(e.target.value)}
                  className="w-full appearance-none bg-[#023E8A] text-[#CAF0F8] text-xs font-mono px-3 py-2.5 rounded-xl border border-[#0077B6]/50 focus:outline-none focus:border-[#48CAE4] cursor-pointer font-bold"
                >
                  {Object.keys(cityData).map((cityName) => (
                    <option key={cityName} value={cityName} className="bg-[#03045E] text-white">
                      {cityName} Node ({cityData[cityName].status})
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 text-[#48CAE4] absolute right-3 top-3 pointer-events-none" />
              </div>
            </div>

            {/* Live Map */}
            <div className="relative h-[360px] rounded-2xl border border-[#0077B6]/50 overflow-hidden shadow-2xl mb-4">
              <MapContainer 
                center={current.latlng} 
                zoom={9} 
                scrollWheelZoom={false} 
                className="h-full w-full z-0"
              >
                <ChangeView center={current.latlng} />
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                
                {Object.values(cityData).map((city) => (
                  <Marker 
                    key={city.name} 
                    position={city.latlng}
                    eventHandlers={{
                      click: () => handleCitySelect(city.name),
                    }}
                  >
                    <Popup>
                      <div className="font-mono text-xs">
                        <strong className="text-[#03045E]">{city.name} Node</strong><br/>
                        Load: {city.load}<br/>
                        Status: {city.status}
                      </div>
                    </Popup>
                  </Marker>
                ))}
              </MapContainer>
            </div>

            {/* Quick Select Buttons */}
            <div className="bg-[#023E8A]/60 p-3.5 rounded-2xl border border-[#0077B6]/40 shadow-inner mb-4">
              <div className="font-mono text-[10px] text-[#48CAE4] font-bold mb-2 tracking-wider flex justify-between">
                <span>[ QUICK SELECT NODES ]</span>
                <span className="text-slate-300">{filteredCities.length} Found</span>
              </div>
              
              <div className="grid grid-cols-2 gap-2 max-h-36 overflow-y-auto pr-1">
                {filteredCities.length > 0 ? (
                  filteredCities.map((cityName) => (
                    <button
                      key={cityName}
                      onClick={() => handleCitySelect(cityName)}
                      className={`p-2 rounded-xl border text-left transition-all flex items-center justify-between cursor-pointer ${
                        selectedCity === cityName 
                          ? 'bg-[#0077B6] text-white border-[#48CAE4] shadow-[0_0_12px_rgba(72,202,228,0.3)]' 
                          : 'bg-[#03045E]/60 text-[#CAF0F8] border-[#0077B6]/40 hover:border-[#48CAE4]/60'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 truncate">
                        <MapPin className={`w-3 h-3 flex-shrink-0 ${selectedCity === cityName ? 'text-[#48CAE4]' : 'text-[#0077B6]'}`} />
                        <span className="font-bold text-xs truncate">{cityName}</span>
                      </div>
                      <span className="text-[8px] font-mono opacity-80 ml-1">ONLINE</span>
                    </button>
                  ))
                ) : (
                  <div className="col-span-2 text-center text-xs text-slate-400 py-2 font-mono">
                    No city found
                  </div>
                )}
              </div>
            </div>

          </div>

          <div className="p-3 bg-[#023E8A]/80 rounded-xl border border-[#0077B6]/40 text-xs font-mono text-[#48CAE4] flex items-center justify-between">
            <span>NETWORK PROTOCOL: SECURE_MESH</span>
            <span className="text-emerald-400 font-bold flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span> LIVE STREAM
            </span>
          </div>
        </div>

        {/* RIGHT COLUMN: ANALYTICS PANEL */}
        <div className="lg:col-span-7 space-y-6">
          
          <div className="bg-[#E6F7FF] rounded-2xl p-6 border border-[#0077B6]/20 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
              <div>
                <h2 className="text-2xl font-black text-[#03045E]">{current.name}</h2>
                <p className="text-xs font-mono text-[#0077B6] uppercase tracking-wider">{current.region}</p>
                <p className="text-[11px] font-mono text-slate-500 mt-0.5">{current.coords} • Last Sync: Just now</p>
              </div>
              <span className={`px-3 py-1 rounded-full font-mono text-xs font-bold border ${
                current.status === 'HIGH_LOAD' 
                  ? 'bg-rose-100 text-rose-800 border-rose-300' 
                  : 'bg-amber-100 text-amber-800 border-amber-300'
              }`}>
                {current.status}
              </span>
            </div>

            <div className="flex items-center justify-between bg-white px-4 py-3 rounded-xl border border-[#0077B6]/20 text-xs font-mono">
              <span className="text-[#03045E] font-semibold flex items-center gap-2">
                <Cpu className="w-4 h-4 text-[#0077B6]" /> MODEL: <span className="text-[#0077B6]">{current.model}</span>
              </span>
              <span className="text-emerald-600 font-bold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span> SYSTEM STABLE
              </span>
            </div>
          </div>

          <div className="bg-[#E6F7FF] rounded-2xl p-6 border border-[#0077B6]/20 shadow-sm">
            <div className="flex items-center justify-between mb-3 text-xs font-mono text-[#0077B6]">
              <span className="flex items-center gap-1.5 font-bold">
                <Zap className="w-4 h-4 text-[#0077B6]" /> SENTINEL POWER PREDICTION - NEXT 24H
              </span>
              <span>ESTIMATED PEAK</span>
            </div>

            <div className="flex items-baseline gap-3 mb-4">
              <span className="text-4xl lg:text-5xl font-black text-[#03045E]">{current.load}</span>
              <span className="text-xs font-mono text-slate-500 uppercase font-bold">predicted load</span>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-mono">
                <span className="font-bold text-[#03045E]">GRID UTILIZATION CAPACITY</span>
                <span className="text-[#0077B6] font-bold">{current.util}%</span>
              </div>
              <div className="w-full bg-white h-3 rounded-full overflow-hidden p-0.5 border border-[#0077B6]/20">
                <div 
                  className="h-full bg-[#0077B6] rounded-full transition-all duration-500"
                  style={{ width: `${current.util}%` }}
                ></div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-[#E6F7FF] rounded-2xl p-4 border border-[#0077B6]/20 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-mono text-slate-600 font-bold">TEMPERATURE</span>
                <Activity className="w-4 h-4 text-[#0077B6]" />
              </div>
              <div className="text-lg font-black text-[#03045E]">{current.temp}</div>
            </div>

            <div className="bg-[#E6F7FF] rounded-2xl p-4 border border-[#0077B6]/20 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-mono text-slate-600 font-bold">HUMIDITY</span>
                <Droplets className="w-4 h-4 text-cyan-600" />
              </div>
              <div className="text-lg font-black text-[#03045E]">{current.humidity}</div>
            </div>

            <div className="bg-[#E6F7FF] rounded-2xl p-4 border border-[#0077B6]/20 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-mono text-slate-600 font-bold">WIND SPEED</span>
                <Wind className="w-4 h-4 text-blue-500" />
              </div>
              <div className="text-lg font-black text-[#03045E]">{current.wind}</div>
            </div>

            <div className="bg-[#E6F7FF] rounded-2xl p-4 border border-[#0077B6]/20 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-mono text-slate-600 font-bold">SOLAR RAD.</span>
                <Sun className="w-4 h-4 text-amber-500" />
              </div>
              <div className="text-lg font-black text-[#03045E]">{current.solar}</div>
            </div>
          </div>

          <div className="bg-[#E6F7FF] rounded-2xl p-6 border border-[#0077B6]/20 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <span className="font-bold text-xs font-mono text-[#03045E] tracking-wide flex items-center gap-2">
                <Activity className="w-4 h-4 text-[#0077B6]" /> 24-HOUR POWER LOAD FORECAST (MW)
              </span>
              <span className="text-[10px] font-mono bg-white text-[#0077B6] px-2 py-1 rounded border border-[#0077B6]/20 font-bold">
                REALTIME AI ANALYTICS
              </span>
            </div>

            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={hourlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorLoad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0077B6" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#0077B6" stopOpacity={0.05}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="time" stroke="#0077B6" fontSize={11} tickLine={false} />
                  <YAxis stroke="#0077B6" fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#03045E', borderRadius: '12px', border: 'none', color: '#fff', fontSize: '12px' }}
                    labelStyle={{ color: '#48CAE4', fontWeight: 'bold' }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="load" 
                    stroke="#0077B6" 
                    strokeWidth={3}
                    fillOpacity={1} 
                    fill="url(#colorLoad)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}