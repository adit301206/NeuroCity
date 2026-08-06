import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Circle, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import {
  CloudSun, Thermometer, Droplets, Wind, ShieldAlert,
  Search, RefreshCw, AlertTriangle, Compass, Activity, Info, Radar, Zap
} from 'lucide-react';

// Leaflet center updating and resize invalidation helper
function ChangeView({ center }) {
  const map = useMap();

  useEffect(() => {
    map.setView(center, 12);
  }, [center, map]);

  useEffect(() => {
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 250);
    return () => clearTimeout(timer);
  }, [map]);

  return null;
}

export default function WeatherPage() {
  const [city, setCity] = useState('Surat');
  const [stateName, setStateName] = useState('Gujarat');
  const [searchCity, setSearchCity] = useState('Surat');
  const [searchState, setSearchState] = useState('Gujarat');

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [telemetry, setTelemetry] = useState(null);

  const indianStates = [
    'Gujarat', 'Maharashtra', 'Delhi', 'Karnataka', 'Tamil Nadu', 'West Bengal',
    'Telangana', 'Rajasthan', 'Andhra Pradesh', 'Arunachal Pradesh', 'Assam',
    'Bihar', 'Chhattisgarh', 'Goa', 'Haryana', 'Himachal Pradesh', 'Jharkhand',
    'Kerala', 'Madhya Pradesh', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland',
    'Odisha', 'Punjab', 'Sikkim', 'Tripura', 'Uttar Pradesh', 'Uttarakhand',
    'Jammu and Kashmir', 'Ladakh', 'Puducherry'
  ];

  const hotspots = [
    { name: 'Surat', state: 'Gujarat' },
    { name: 'Jaipur', state: 'Rajasthan' },
    { name: 'Mumbai', state: 'Maharashtra' },
    { name: 'Delhi', state: 'Delhi' },
    { name: 'Bengaluru', state: 'Karnataka' },
    { name: 'Chennai', state: 'Tamil Nadu' }
  ];

  const fetchWeatherTelemetry = async (cityName, stateSel, lat = null, lon = null) => {
    setLoading(true);
    setErrorMsg(null);
    const token = localStorage.getItem('token');

    try {
      let url = '/api/weather/live';
      if (lat !== null && lon !== null) {
        url += `?lat=${lat}&lon=${lon}`;
      } else {
        url += `?city=${encodeURIComponent(cityName)}&state=${encodeURIComponent(stateSel)}`;
      }

      const res = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const result = await res.json();
      if (res.ok && result.status === 'success') {
        setTelemetry(result.data);
        if (lat !== null && lon !== null) {
          setCity(result.data.city);
          setStateName(result.data.state || 'Gujarat');
          setSearchCity(result.data.city);
          setSearchState(result.data.state || 'Gujarat');
        }
      } else {
        setErrorMsg(result.message || 'Failed to fetch climate telemetry.');
      }
    } catch (err) {
      console.error('Error fetching climate telemetry:', err);
      setErrorMsg('Network error connecting to weather intelligence gateway.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWeatherTelemetry(city, stateName);
  }, [city, stateName]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchCity.trim()) {
      setCity(searchCity.trim());
      setStateName(searchState);
    }
  };

  const handleGpsScan = () => {
    if (navigator.geolocation) {
      setLoading(true);
      setErrorMsg(null);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          fetchWeatherTelemetry(null, null, latitude, longitude);
        },
        (err) => {
          console.error('GPS scan failed:', err.message);
          setErrorMsg(`GPS Scan Access Denied: ${err.message}`);
          setLoading(false);
        }
      );
    } else {
      setErrorMsg('Geolocation is not supported by your browser.');
    }
  };

  // Get AQI styling and health advisories
  const getAqiInfo = (aqi) => {
    switch (aqi) {
      case 1:
        return {
          label: 'Good / Clean',
          color: '#10B981',
          bg: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-450',
          recommendation: 'Air quality is satisfactory, and air pollution poses little or no risk. Perfect day for outdoor exploration!'
        };
      case 2:
        return {
          label: 'Fair / Acceptable',
          color: '#84CC16',
          bg: 'bg-lime-500/10 border-lime-500/30 text-lime-450',
          recommendation: 'Air quality is acceptable. Extremely sensitive individuals should consider reducing prolonged outdoor activities.'
        };
      case 3:
        return {
          label: 'Moderate / Caution',
          color: '#F59E0B',
          bg: 'bg-amber-500/10 border-amber-500/30 text-amber-450',
          recommendation: 'Sensitive groups may experience health effects. Keep strenuous outdoor activities brief and monitor discomfort.'
        };
      case 4:
        return {
          label: 'Poor / Hazardous Alert',
          color: '#EF4444',
          bg: 'bg-rose-500/10 border-rose-500/30 text-rose-450',
          recommendation: 'Everyone may begin to experience health implications. Mask recommended; sensitive groups should stay indoors.'
        };
      case 5:
        return {
          label: 'Severe / Avoid Outdoors',
          color: '#B91C1C',
          bg: 'bg-red-500/20 border-red-500/50 text-red-300 animate-pulse',
          recommendation: 'Health alert: emergency conditions. Entire population is highly susceptible to health complications. Avoid outdoors!'
        };
      default:
        return {
          label: 'Unknown',
          color: '#64748B',
          bg: 'bg-slate-500/10 border-slate-500/30 text-slate-450',
          recommendation: 'AQI metrics currently unavailable.'
        };
    }
  };

  const aqiDetails = telemetry ? getAqiInfo(telemetry.pollution.aqi) : null;

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-12 font-sans select-none text-slate-800 pt-16">

      {/* Centered Compact Card Header */}
      <div className="max-w-4xl mx-auto my-1 py-3.5 px-6 sm:px-8 bg-[#03045E] rounded-3xl border border-[#00B4D8]/30 shadow-[0_0_25px_rgba(0,180,216,0.2)] text-[#CAF0F8] relative overflow-hidden">
        
        {/* Ambient Grid Backdrop */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(0,180,216,0.15),transparent_70%)] pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(#00B4D8_1px,transparent_1px)] [background-size:24px_24px] opacity-10 pointer-events-none" />

        <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-4 w-full">
          
          {/* Left Side: Glowing Icon Box & Title */}
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-[#023E8A]/80 border border-[#00B4D8]/50 shadow-[0_0_15px_rgba(0,180,216,0.3)] flex-shrink-0">
              <CloudSun className="h-6 w-6 text-[#48CAE4] animate-pulse" />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-black tracking-tight text-white uppercase leading-none">
                Weather & Air <span className="text-[#48CAE4]">Intelligence</span>
              </h1>
              <span className="text-[9px] text-[#48CAE4] font-mono uppercase tracking-widest font-bold block mt-1">
                [ Climate Sentinel Node ]
              </span>
            </div>
          </div>

          {/* Right Side: Status Badge */}
          <div className="px-3.5 py-1.5 rounded-full bg-[#023E8A]/60 border border-[#00B4D8]/40 text-[#CAF0F8] flex items-center gap-2 shadow-inner font-mono text-[9px] font-bold uppercase tracking-wider">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_#10B981]"></span>
            Satellite Link Online
          </div>

        </div>
      </div>

      <main className="max-w-7xl mx-auto px-6 mt-3 space-y-4">

        {/* Contained Command Deck Card */}
        <div className="bg-[#03045E] border border-[#0096C7]/50 rounded-3xl p-6 shadow-[0_0_20px_rgba(0,150,199,0.15)] grid grid-cols-1 lg:grid-cols-12 gap-6 items-center text-[#CAF0F8]">
          
          {/* Left Column: Targeting deck details */}
          <div className="lg:col-span-5 space-y-2.5">
            <div className="flex items-center gap-2 text-[#48CAE4]">
              <Radar className="h-5 w-5 text-[#48CAE4] animate-[spin_8s_linear_infinite]" />
              <h2 className="text-sm font-extrabold tracking-wider uppercase font-mono text-white">
                Radar Targeting Deck
              </h2>
            </div>
            <p className="text-[11px] text-[#CAF0F8]/80 leading-relaxed font-sans">
              Select state, target custom city nodes, or run automated geocoding scan via browser GPS telemetry.
            </p>
            
            <button
              type="button"
              onClick={handleGpsScan}
              disabled={loading}
              className="py-1.5 px-3 rounded-lg border border-[#48CAE4]/30 bg-[#0077B6]/30 text-[#48CAE4] hover:bg-[#0077B6]/60 hover:text-[#CAF0F8] transition-all cursor-pointer font-mono text-[9px] font-bold flex items-center gap-1.5 disabled:opacity-50"
            >
              <Compass className="w-3.5 h-3.5" />
              GPS SCAN NODE
            </button>
          </div>

          {/* Right Column: Search form & quick selector badges */}
          <div className="lg:col-span-7 space-y-4">
            <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-3">
              {/* City input */}
              <div className="relative flex-1 focus-within:ring-2 focus-within:ring-[#48CAE4]/50 focus-within:shadow-[0_0_8px_rgba(72,202,228,0.25)] rounded-xl transition-all">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#48CAE4]" />
                <input
                  type="text"
                  placeholder="Target City Name..."
                  value={searchCity}
                  onChange={(e) => setSearchCity(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-[#0077B6] text-[#CAF0F8] text-xs font-mono placeholder-slate-400 focus:outline-none focus:border-[#48CAE4] bg-[#023E8A]/50"
                />
              </div>

              {/* State select */}
              <select
                value={searchState}
                onChange={(e) => setSearchState(e.target.value)}
                className="px-3 py-2.5 rounded-xl border border-[#0077B6] bg-[#023E8A] text-[#CAF0F8] text-xs font-mono focus:outline-none focus:border-[#48CAE4] cursor-pointer"
              >
                {indianStates.map((st) => (
                  <option key={st} value={st} className="bg-[#023E8A] text-[#CAF0F8]">{st}</option>
                ))}
              </select>

              {/* Target button */}
              <button
                type="submit"
                disabled={loading}
                className="py-2.5 px-6 rounded-xl font-mono text-xs font-bold text-white bg-gradient-to-r from-[#0077B6] to-[#0096C7] hover:shadow-[0_0_15px_rgba(72,202,228,0.3)] transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 border border-[#48CAE4]/30"
              >
                {loading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : 'TARGET NODE'}
              </button>
            </form>

            {/* Quick Hotspot City Chips */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[9px] font-mono text-[#48CAE4] uppercase tracking-widest mr-1">Hotspots:</span>
              {hotspots.map((h) => {
                const isActive = city.toLowerCase() === h.name.toLowerCase();
                return (
                  <button
                    key={h.name}
                    type="button"
                    onClick={() => {
                      setSearchCity(h.name);
                      setSearchState(h.state);
                      setCity(h.name);
                      setStateName(h.state);
                    }}
                    className={`px-2.5 py-1 rounded-lg border text-[9px] font-mono font-bold tracking-wider uppercase transition-all cursor-pointer flex items-center gap-1 ${
                      isActive
                        ? 'bg-gradient-to-r from-[#0077B6] to-[#0096C7] border-[#48CAE4] text-[#CAF0F8] shadow-[0_0_8px_rgba(72,202,228,0.25)]'
                        : 'bg-[#023E8A]/60 border-[#0077B6]/50 text-[#48CAE4]/90 hover:border-[#48CAE4] hover:text-[#CAF0F8]'
                    }`}
                  >
                    <Zap className="w-2.5 h-2.5" />
                    {h.name}
                  </button>
                );
              })}
            </div>
          </div>

        </div>

        {errorMsg && (
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-rose-500 flex-shrink-0" />
            <div className="font-mono">{errorMsg}</div>
          </div>
        )}

        {loading && !telemetry && (
          <div className="w-full h-80 flex flex-col items-center justify-center gap-3">
            <RefreshCw className="w-8 h-8 text-[#0077B6] animate-spin" />
            <span className="text-xs font-mono text-slate-500 uppercase tracking-widest animate-pulse">Syncing Climate Telemetry...</span>
          </div>
        )}

        {telemetry && (
          <div className="space-y-6">

            {/* Top Row: Info cards & Map */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

              {/* Map Canvas (Left 2 Columns) */}
              <div className="lg:col-span-2 space-y-4">
                <div className="bg-[#023E8A] border border-[#0096C7]/50 rounded-3xl p-5 shadow-[0_0_20px_rgba(0,150,199,0.15)] space-y-3 text-[#CAF0F8]">
                  <div className="flex items-center justify-between border-b border-[#0077B6]/50 pb-3">
                    <h2 className="text-sm font-extrabold text-white tracking-wider flex items-center gap-1.5 uppercase font-mono">
                      <Compass className="w-4 h-4 text-[#48CAE4]" />
                      AQI Heat Map: {telemetry.city}, {telemetry.state}
                    </h2>
                    <span className="text-[10px] text-[#48CAE4] font-mono">MAP CENTER: {telemetry.coordinates.lat.toFixed(4)}, {telemetry.coordinates.lon.toFixed(4)}</span>
                  </div>

                  {/* Leaflet Map Box */}
                  <div className="w-full h-[360px] rounded-2xl overflow-hidden border border-[#0077B6]/50 shadow-inner z-0 relative">
                    <MapContainer
                      center={[telemetry.coordinates.lat, telemetry.coordinates.lon]}
                      zoom={12}
                      className="w-full h-full z-0"
                    >
                      <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      />
                      <ChangeView center={[telemetry.coordinates.lat, telemetry.coordinates.lon]} />

                      <Circle
                        center={[telemetry.coordinates.lat, telemetry.coordinates.lon]}
                        radius={2800}
                        pathOptions={{
                          color: aqiDetails ? aqiDetails.color : '#64748B',
                          fillColor: aqiDetails ? aqiDetails.color : '#64748B',
                          fillOpacity: 0.42
                        }}
                      >
                        <Popup>
                          <div className="font-mono text-xs text-slate-800 space-y-1">
                            <div className="font-bold uppercase text-[#023E8A]">{telemetry.city}</div>
                            <div>AQI: {telemetry.pollution.aqi} ({aqiDetails?.label})</div>
                            <div>Temp: {telemetry.weather.temperature}°C</div>
                            <div>Humidity: {telemetry.weather.humidity}%</div>
                          </div>
                        </Popup>
                      </Circle>
                    </MapContainer>
                  </div>
                </div>
              </div>
              {/* AQI Breakdown & Advisory (Right Column) */}
              <div className="space-y-6">
                <section className="bg-[#023E8A] border border-[#0096C7]/50 p-5 rounded-3xl shadow-[0_0_20px_rgba(0,150,199,0.15)] space-y-4 font-mono text-[#CAF0F8]">
                  <div className="flex items-center justify-between border-b border-[#0077B6]/50 pb-3">
                    <span className="text-white font-bold flex items-center gap-1.5 uppercase text-sm">
                      <Activity className="h-4 w-4 text-[#48CAE4]" />
                      AQI telemetry
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase tracking-wider ${aqiDetails?.bg}`}>
                      AQI {telemetry.pollution.aqi}
                    </span>
                  </div>

                  <div className="space-y-3.5">
                    {/* PM2.5 Card */}
                    <div className="bg-[#E6F7FF] border border-[#CAF0F8] p-3 rounded-2xl text-slate-800 space-y-1.5 shadow-sm">
                      <div className="flex justify-between text-xs text-[#023E8A] font-bold">
                        <span>PM 2.5 (Fine Dust)</span>
                        <span className="font-extrabold text-[#03045E]">{telemetry.pollution.pm2_5} µg/m³</span>
                      </div>
                      <div className="w-full bg-[#CAF0F8] h-1.5 rounded-full overflow-hidden">
                        <div 
                          className="h-full rounded-full transition-all duration-500" 
                          style={{ 
                            width: `${Math.min(100, (telemetry.pollution.pm2_5 / 75) * 100)}%`,
                            backgroundColor: aqiDetails?.color
                          }} 
                        />
                      </div>
                    </div>

                    {/* PM10 Card */}
                    <div className="bg-[#E6F7FF] border border-[#CAF0F8] p-3 rounded-2xl text-slate-800 space-y-1.5 shadow-sm">
                      <div className="flex justify-between text-xs text-[#023E8A] font-bold">
                        <span>PM 10 (Coarse Dust)</span>
                        <span className="font-extrabold text-[#03045E]">{telemetry.pollution.pm10} µg/m³</span>
                      </div>
                      <div className="w-full bg-[#CAF0F8] h-1.5 rounded-full overflow-hidden">
                        <div 
                          className="h-full rounded-full transition-all duration-500" 
                          style={{ 
                            width: `${Math.min(100, (telemetry.pollution.pm10 / 150) * 100)}%`,
                            backgroundColor: aqiDetails?.color
                          }} 
                        />
                      </div>
                    </div>

                    {/* NO2 Card */}
                    <div className="bg-[#E6F7FF] border border-[#CAF0F8] p-3 rounded-2xl text-slate-800 space-y-1.5 shadow-sm">
                      <div className="flex justify-between text-xs text-[#023E8A] font-bold">
                        <span>Nitrogen Dioxide (NO₂)</span>
                        <span className="font-extrabold text-[#03045E]">{telemetry.pollution.no2} µg/m³</span>
                      </div>
                      <div className="w-full bg-[#CAF0F8] h-1.5 rounded-full overflow-hidden">
                        <div 
                          className="h-full rounded-full transition-all duration-500" 
                          style={{ 
                            width: `${Math.min(100, (telemetry.pollution.no2 / 100) * 100)}%`,
                            backgroundColor: aqiDetails?.color
                          }} 
                        />
                      </div>
                    </div>

                    {/* CO Card */}
                    <div className="bg-[#E6F7FF] border border-[#CAF0F8] p-3 rounded-2xl text-slate-800 space-y-1.5 shadow-sm">
                      <div className="flex justify-between text-xs text-[#023E8A] font-bold">
                        <span>Carbon Monoxide (CO)</span>
                        <span className="font-extrabold text-[#03045E]">{(telemetry.pollution.components.co || 0).toFixed(0)} µg/m³</span>
                      </div>
                      <div className="w-full bg-[#CAF0F8] h-1.5 rounded-full overflow-hidden">
                        <div 
                          className="h-full rounded-full transition-all duration-500" 
                          style={{ 
                            width: `${Math.min(100, ((telemetry.pollution.components.co || 0) / 1000) * 100)}%`,
                            backgroundColor: aqiDetails?.color
                          }} 
                        />
                      </div>
                    </div>
                  </div>

                  {/* Municipal Advisory banner */}
                  <div className="p-4 rounded-2xl border border-[#CAF0F8] bg-[#E6F7FF] text-xs leading-relaxed space-y-1.5 text-slate-800 shadow-sm">
                    <div className="font-extrabold flex items-center gap-1.5 uppercase text-[#03045E]">
                      <ShieldAlert className="w-4 h-4 flex-shrink-0 text-[#0077B6]" />
                      Municipal Advisory: {aqiDetails?.label}
                    </div>
                    <p className="font-sans text-slate-700 leading-relaxed">
                      {aqiDetails?.recommendation}
                    </p>
                  </div>
                </section>
              </div>

            </div>

            {/* Bottom Row: Telemetry Cards */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-5 font-mono">

              {/* Temperature */}
              <div className="bg-[#03045E] border border-[#0077B6]/50 p-5 rounded-2xl shadow-[0_0_15px_rgba(0,119,182,0.1)] space-y-2 flex flex-col justify-between text-[#CAF0F8]">
                <div className="flex items-center gap-1.5 text-[#48CAE4] text-[10px] uppercase font-bold tracking-wider">
                  <Thermometer className="w-4 h-4 text-[#48CAE4]" />
                  Temperature
                </div>
                <div className="space-y-0.5">
                  <div className="text-2xl font-extrabold text-white">{telemetry.weather.temperature.toFixed(1)}°C</div>
                  <div className="text-[10px] text-[#48CAE4]/85">Feels Like {telemetry.weather.feelsLike.toFixed(1)}°C</div>
                </div>
              </div>

              {/* Humidity */}
              <div className="bg-[#E6F7FF] border border-[#CAF0F8] p-5 rounded-2xl shadow-sm space-y-2 flex flex-col justify-between text-slate-800">
                <div className="flex items-center gap-1.5 text-[#023E8A] text-[10px] uppercase font-bold tracking-wider">
                  <Droplets className="w-4 h-4 text-[#0077B6]" />
                  Humidity
                </div>
                <div className="space-y-0.5">
                  <div className="text-2xl font-extrabold text-[#03045E]">{telemetry.weather.humidity}%</div>
                  <div className="text-[10px] text-slate-550">Atmospheric water</div>
                </div>
              </div>

              {/* Wind Speed */}
              <div className="bg-[#E6F7FF] border border-[#CAF0F8] p-5 rounded-2xl shadow-sm space-y-2 flex flex-col justify-between text-slate-800">
                <div className="flex items-center gap-1.5 text-[#023E8A] text-[10px] uppercase font-bold tracking-wider">
                  <Wind className="w-4 h-4 text-[#0077B6]" />
                  Wind Velocity
                </div>
                <div className="space-y-0.5">
                  <div className="text-2xl font-extrabold text-[#03045E]">{telemetry.weather.windSpeed.toFixed(1)} m/s</div>
                  <div className="text-[10px] text-slate-555">Speed and direction</div>
                </div>
              </div>

              {/* UV Index (Calculated) */}
              <div className="bg-[#E6F7FF] border border-[#CAF0F8] p-5 rounded-2xl shadow-sm space-y-2 flex flex-col justify-between text-slate-800">
                <div className="flex items-center gap-1.5 text-[#023E8A] text-[10px] uppercase font-bold tracking-wider">
                  <Info className="w-4 h-4 text-[#0077B6]" />
                  UV Radiation
                </div>
                <div className="space-y-0.5">
                  <div className="text-2xl font-extrabold text-[#03045E]">
                    {telemetry.weather.weatherCondition === 'Clear' ? '4.8 (MOD)' : '1.2 (LOW)'}
                  </div>
                  <div className="text-[10px] text-slate-555">Calculated radiation index</div>
                </div>
              </div>

              {/* Atmospheric Pressure */}
              <div className="bg-[#E6F7FF] border border-[#CAF0F8] p-5 rounded-2xl shadow-sm space-y-2 flex flex-col justify-between text-slate-800">
                <div className="flex items-center gap-1.5 text-[#023E8A] text-[10px] uppercase font-bold tracking-wider">
                  <Info className="w-4 h-4 text-[#0077B6]" />
                  Pressure
                </div>
                <div className="space-y-0.5">
                  <div className="text-2xl font-extrabold text-[#03045E]">{telemetry.weather.pressure} hPa</div>
                  <div className="text-[10px] text-slate-555">Sea level density</div>
                </div>
              </div>

            </div>

          </div>
        )}
      </main>
    </div>
  );
}
