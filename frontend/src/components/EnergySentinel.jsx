import React, { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import {
  Activity, Sun, Wind, Droplets, Zap, MapPin, Cpu, RefreshCw, Power, BatteryCharging, Gauge, Search, ChevronDown, Sliders
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

const STATE_CITY_NODES = {
  Rajasthan: {
    model: 'rajasthan_model.pkl',
    cities: [
      { name: 'AJMER', code: '42343', latlng: [26.4499, 74.6399] },
      { name: 'ALWAR', code: '42255', latlng: [27.5530, 76.6346] },
      { name: 'ANUPGARH', code: '42122', latlng: [29.1911, 73.2086] },
      { name: 'BANSTHALI VIDYAPITH', code: '42346', latlng: [26.4061, 75.9525] },
      { name: 'BANSWARA', code: '42655', latlng: [23.5461, 74.4340] },
      { name: 'BARMER', code: '42435', latlng: [25.7521, 71.4181] },
      { name: 'BHARATPUR', code: '42258', latlng: [27.2152, 77.5030] },
      { name: 'BHILWARA', code: '42447', latlng: [25.3407, 74.6313] },
      { name: 'BIKANER', code: '42165', latlng: [28.0229, 73.3119] },
      { name: 'BUNDI', code: '42450', latlng: [25.4414, 75.6421] },
      { name: 'CHITTORGARH', code: '42546', latlng: [24.8887, 74.6269] },
      { name: 'CHURU', code: '42170', latlng: [28.2900, 74.9600] },
      { name: 'DHOLPUR', code: '42354', latlng: [26.7025, 77.8934] },
      { name: 'DUNGARPUR', code: '42652', latlng: [23.8400, 73.7147] },
      { name: 'JAIPUR', code: '42348', latlng: [26.9124, 75.7873] },
      { name: 'JAISALMER', code: '42328', latlng: [26.9157, 70.9083] },
      { name: 'JALORE', code: '42439', latlng: [25.3451, 72.6186] },
      { name: 'JAWAI BANDH', code: '42441', latlng: [25.1300, 73.1600] },
      { name: 'JHALAWAR', code: '42555', latlng: [24.5973, 76.1610] },
      { name: 'JODHPUR', code: '42339', latlng: [26.2389, 73.0243] },
      { name: 'KOTA', code: '42452', latlng: [25.2138, 75.8648] },
      { name: 'MOUNT ABU', code: '42540', latlng: [24.5926, 72.7156] },
      { name: 'NAGAUR', code: '42242', latlng: [27.2070, 73.7423] },
      { name: 'PHALODI', code: '42237', latlng: [27.1311, 72.3622] },
      { name: 'PILANI', code: '42174', latlng: [28.3636, 75.6025] },
      { name: 'RAWATBHATA', code: '42552', latlng: [24.9300, 75.5800] },
      { name: 'SAWAI MADHOPUR', code: '42453', latlng: [25.9928, 76.3524] },
      { name: 'SIKAR', code: '42249', latlng: [27.6094, 75.1398] },
      { name: 'SRIGANGANAGAR', code: '42123', latlng: [29.9038, 73.8772] },
      { name: 'UDAIPUR', code: '42543', latlng: [24.5854, 73.7125] }
    ]
  },
  Maharashtra: {
    model: 'maharashtra_model.pkl',
    cities: [
      { name: 'AHMEDNAGAR', code: '43009', latlng: [19.0952, 74.7496] },
      { name: 'AKOLA', code: '42933', latlng: [20.7002, 77.0082] },
      { name: 'ALIBAG', code: '43058', latlng: [18.6414, 72.8722] },
      { name: 'AMRAVATI', code: '42937', latlng: [20.9374, 77.7796] },
      { name: 'AURANGABAD (CHIKALTHANA)', code: '43014', latlng: [19.8762, 75.3433] },
      { name: 'BARAMATI', code: '43069', latlng: [18.1517, 74.5800] },
      { name: 'BEED', code: '43011', latlng: [18.9891, 75.7601] },
      { name: 'BRAHMAPURI', code: '42946', latlng: [20.6100, 79.8600] },
      { name: 'BULDHANA', code: '42931', latlng: [20.5293, 76.1837] },
      { name: 'CHANDRAPUR', code: '43029', latlng: [19.9615, 79.2961] },
      { name: 'DAHANU', code: '43001', latlng: [19.9702, 72.7303] },
      { name: 'GADCHIROLI', code: '42947', latlng: [20.1800, 79.9900] },
      { name: 'GONDIA', code: '42871', latlng: [21.4600, 80.2000] },
      { name: 'HARNAI', code: '43109', latlng: [17.8100, 73.1000] },
      { name: 'JALGAON', code: '42851', latlng: [21.0077, 75.5626] },
      { name: 'JALNA', code: '43012', latlng: [19.8347, 75.8816] },
      { name: 'JEUR', code: '43071', latlng: [18.2500, 75.1600] },
      { name: 'KOLHAPUR', code: '43157', latlng: [16.7050, 74.2433] },
      { name: 'MAHABALESHWAR', code: '43111', latlng: [17.9307, 73.6477] },
      { name: 'MALEGAON', code: '42925', latlng: [20.5532, 74.5273] },
      { name: 'MATHERAN', code: '43060', latlng: [18.9863, 73.2679] },
      { name: 'MUMBAI (COLABA)', code: '43057', latlng: [18.9067, 72.8147] },
      { name: 'MUMBAI (SANTACRUZ)', code: '43003', latlng: [19.0896, 72.8656] },
      { name: 'NAGPUR', code: '42867', latlng: [21.1458, 79.0882] },
      { name: 'NANDED', code: '43021', latlng: [19.1383, 77.3210] },
      { name: 'NANDURBAR', code: '42846', latlng: [21.3700, 74.2400] },
      { name: 'NASHIK', code: '42921', latlng: [19.9975, 73.7898] },
      { name: 'OSMANABAD', code: '43075', latlng: [18.2070, 76.1784] },
      { name: 'PARBHANI', code: '43017', latlng: [19.2686, 76.7709] },
      { name: 'PUNE', code: '43063', latlng: [18.5204, 73.8567] },
      { name: 'RATNAGIRI', code: '43110', latlng: [16.9902, 73.3120] },
      { name: 'SANGLI', code: '43158', latlng: [16.8524, 74.5815] },
      { name: 'SATARA', code: '43113', latlng: [17.6805, 74.0183] },
      { name: 'SOLAPUR', code: '43117', latlng: [17.6599, 75.9064] },
      { name: 'T B I A', code: '43005', latlng: [19.0300, 73.0200] },
      { name: 'UDGIR', code: '43076', latlng: [18.3900, 77.1200] },
      { name: 'WARDHA', code: '42939', latlng: [20.7453, 78.6022] },
      { name: 'WASHIM', code: '42935', latlng: [20.1000, 77.1300] },
      { name: 'YAVATMAL', code: '42943', latlng: [20.3888, 78.1204] }
    ]
  },
  'Uttar Pradesh': {
    model: 'uttar_pradesh_model.pkl',
    cities: [
      { name: 'AGRA', code: '42261', latlng: [27.1767, 78.0081] },
      { name: 'AGRA (TAJ)', code: '42259', latlng: [27.1750, 78.0422] },
      { name: 'ALIGARH', code: '42262', latlng: [27.8974, 78.0880] },
      { name: 'AZAMGARH', code: '42381', latlng: [26.0688, 83.1859] },
      { name: 'BADAUN', code: '42191', latlng: [28.0300, 79.1200] },
      { name: 'BAHRAICH', code: '42273', latlng: [27.5706, 81.5977] },
      { name: 'BALLIA (MIRDHA)', code: '42384', latlng: [25.7580, 84.1482] },
      { name: 'BANDA', code: '42473', latlng: [25.4764, 80.3353] },
      { name: 'BARABANKI', code: '42370', latlng: [26.9268, 81.1834] },
      { name: 'BAREILLY', code: '42189', latlng: [28.3670, 79.4304] },
      { name: 'BASTI', code: '42279', latlng: [26.7972, 82.7523] },
      { name: 'BULANDSHAHAR', code: '42183', latlng: [28.4069, 77.8498] },
      { name: 'CHURK', code: '42589', latlng: [24.5800, 83.0500] },
      { name: 'ETAWAH', code: '42364', latlng: [26.7769, 79.0238] },
      { name: 'FAIZABAD', code: '42374', latlng: [26.7730, 82.1458] },
      { name: 'FATEHGARH (FARRUKHABAD)', code: '42267', latlng: [27.3500, 79.6200] },
      { name: 'FATEHPUR', code: '42471', latlng: [25.9300, 80.8000] },
      { name: 'FURSATGANJ', code: '42372', latlng: [26.2200, 81.3800] },
      { name: 'GAZIPUR', code: '42482', latlng: [25.5800, 83.5700] },
      { name: 'GONDA', code: '42274', latlng: [27.1300, 81.9600] },
      { name: 'GORAKHPUR', code: '42379', latlng: [26.7606, 83.3732] },
      { name: 'HAMIRPUR', code: '42469', latlng: [25.9500, 80.1500] },
      { name: 'HARDOI', code: '42271', latlng: [27.3900, 80.1300] },
      { name: 'JAUNPUR', code: '42477', latlng: [25.7464, 82.6837] },
      { name: 'JHANSI', code: '42463', latlng: [25.4484, 78.5685] },
      { name: 'KANPUR', code: '42367', latlng: [26.4499, 80.3319] },
      { name: 'LAKHIMPUR KHERI', code: '42270', latlng: [27.9400, 80.7800] },
      { name: 'LUCKNOW', code: '42369', latlng: [26.8467, 80.9462] },
      { name: 'MAINPURI', code: '42265', latlng: [27.2300, 79.0200] },
      { name: 'MATHURA', code: '42257', latlng: [27.4924, 77.6737] },
      { name: 'MEERUT', code: '42139', latlng: [28.9845, 77.7064] },
      { name: 'MORADABAD', code: '42187', latlng: [28.8386, 78.7733] },
      { name: 'MUZAFFAR NAGAR', code: '42138', latlng: [29.4727, 77.7085] },
      { name: 'NAJIBABAD', code: '42143', latlng: [29.6200, 78.3300] },
      { name: 'NAUTANWA BAZAR', code: '42282', latlng: [27.4300, 83.4200] },
      { name: 'ORAI', code: '42468', latlng: [25.9800, 79.4500] },
      { name: 'PILIBHIT', code: '42190', latlng: [28.6300, 79.8000] },
      { name: 'PRATAPGARH', code: '42472', latlng: [25.8900, 81.9400] },
      { name: 'PRAYAGRAJ (ALLAHABAD)', code: '42474', latlng: [25.4358, 81.8463] },
      { name: 'RAMPUR', code: '42188', latlng: [28.8100, 79.0200] },
      { name: 'SHAHJAHANPUR', code: '42266', latlng: [27.8800, 79.9100] },
      { name: 'SULTANPUR', code: '42377', latlng: [26.2600, 82.0700] },
      { name: 'UNNAO', code: '42365', latlng: [26.5400, 80.4900] },
      { name: 'VARANASI', code: '42483', latlng: [25.3176, 82.9739] },
      { name: 'VARANASI (A) (BABATPUR)', code: '42479', latlng: [25.4500, 82.8500] }
    ]
  },
  Gujarat: {
    model: 'gujarat_model.pkl',
    cities: [
      { name: 'AHMEDABAD', code: '42647', latlng: [23.0225, 72.5714] },
      { name: 'AMRELI', code: '42834', latlng: [21.6032, 71.2221] },
      { name: 'BHAVNAGAR', code: '42838', latlng: [21.7645, 72.1519] },
      { name: 'BHUJ', code: '42634', latlng: [23.2420, 69.6669] },
      { name: 'DEESA', code: '42539', latlng: [24.2582, 72.1809] },
      { name: 'DIU', code: '42914', latlng: [20.7144, 70.9874] },
      { name: 'DWARKA', code: '42731', latlng: [22.2442, 68.9685] },
      { name: 'GANDHINAGAR', code: '42654', latlng: [23.2156, 72.6369] },
      { name: 'KANDLA (A)', code: '42638', latlng: [23.0100, 70.2200] },
      { name: 'KESHOD', code: '42832', latlng: [21.3000, 70.2500] },
      { name: 'MAHUVA', code: '42837', latlng: [21.0900, 71.7600] },
      { name: 'NALIYA', code: '42631', latlng: [23.2600, 68.8300] },
      { name: 'NEW KANDLA', code: '42639', latlng: [23.0200, 70.2200] },
      { name: 'OKHA', code: '42730', latlng: [22.4600, 69.0700] },
      { name: 'PORBANDAR (A)', code: '42830', latlng: [21.6417, 69.6293] },
      { name: 'RAJKOT', code: '42737', latlng: [22.3025, 70.7942] },
      { name: 'SURAT', code: '42840', latlng: [21.1702, 72.8311] },
      { name: 'SURENDRANAGAR', code: '42740', latlng: [22.7200, 71.6300] },
      { name: 'VADODARA (A)', code: '42748', latlng: [22.3072, 73.1812] },
      { name: 'VALLABH VIDYANAGAR', code: '42744', latlng: [22.5300, 72.9300] },
      { name: 'VALSAD', code: '42915', latlng: [20.6100, 72.9300] },
      { name: 'VERAVAL', code: '42909', latlng: [20.9000, 70.3667] }
    ]
  }
};

const generateCityTelemetry = (city, stateName, modelFile) => {
  const codeInt = parseInt(city.code) || 42000;
  const statuses = ['OPTIMAL', 'MODERATE', 'HIGH_LOAD'];
  const status = statuses[codeInt % 3];
  const loadVal = 2000 + (codeInt % 61) * 100;
  const load = `${loadVal} MW`;
  const util = 55 + (codeInt % 41);
  const baseTemp = stateName === 'Rajasthan' ? 36.0 : stateName === 'Gujarat' ? 34.0 : 30.0;
  const temp = (baseTemp + (codeInt % 9) + (city.latlng[0] % 3)).toFixed(1) + '°C';
  const baseHumid = stateName === 'Maharashtra' ? 65 : stateName === 'Rajasthan' ? 25 : 45;
  const humidity = (baseHumid + (codeInt % 21)) + '%';
  const wind = (8.0 + (codeInt % 15)).toFixed(1) + ' km/h';
  const solar = (400 + (codeInt % 41) * 10) + ' W/m²';
  return {
    name: city.name,
    code: city.code,
    latlng: city.latlng,
    region: `${stateName} Neural Grid`,
    coords: `${city.latlng[0].toFixed(4)}° N, ${city.latlng[1].toFixed(4)}° E`,
    status,
    load,
    util,
    temp,
    humidity,
    wind,
    solar,
    model: modelFile,
    state: stateName
  };
};

const flatCities = [];
Object.entries(STATE_CITY_NODES).forEach(([stateName, stateData]) => {
  stateData.cities.forEach(city => {
    flatCities.push(generateCityTelemetry(city, stateName, stateData.model));
  });
});

export default function EnergySentinel() {
  const [selectedCity, setSelectedCity] = useState(flatCities.find(c => c.name === 'SURAT') || flatCities[0]);
  const [searchTerm, setSearchTerm] = useState('');
  const [autoOptimize, setAutoOptimize] = useState(true);
  const [tempDelta, setTempDelta] = useState(0);
  const [humidityDelta, setHumidityDelta] = useState(0);
  const [gridInertia, setGridInertia] = useState(50);
  const [loading, setLoading] = useState(false);
  const [liveData, setLiveData] = useState({
    temperature: 0,
    humidity: 0,
    windSpeed: 0,
    predictedLoadMW: 0,
    gridStatus: 'NORMAL',
    latlng: [21.1702, 72.8311] // default coords for Surat
  });

  const fetchLivePrediction = async (cityName, stateName) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const headers = {
        'Content-Type': 'application/json'
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch('/api/energy/predict-live', {
        method: 'POST',
        headers: headers,
        body: JSON.stringify({ cityName, stateName })
      });

      const result = await response.json();
      if (response.ok && result.status === 'success') {
        const data = result.data;
        let mappedStatus = 'NORMAL';
        if (data.gridStatus === 'CRITICAL_PEAK' || data.gridStatus === 'CRITICAL') {
          mappedStatus = 'CRITICAL';
        } else if (data.gridStatus === 'MODERATE_HIGH' || data.gridStatus === 'STRESSED' || data.gridStatus === 'HIGH_LOAD') {
          mappedStatus = 'STRESSED';
        }
        setLiveData({
          temperature: data.temperature,
          humidity: data.humidity,
          windSpeed: data.windSpeed,
          predictedLoadMW: data.predictedLoadMW,
          gridStatus: mappedStatus,
          latlng: [data.lat, data.lon]
        });
      }
    } catch (err) {
      console.error("[Live Weather Forecast API Request Failed]", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLivePrediction("SURAT", "Gujarat");
  }, []);

  const handleSelectCity = (stateName, city) => {
    const enriched = flatCities.find(c => c.code === city.code);
    if (enriched) {
      setSelectedCity(enriched);
      setSearchTerm(enriched.name);
      fetchLivePrediction(enriched.name, stateName);
    }
  };

  const handleCitySelect = (cityName) => {
    const enriched = flatCities.find(c => c.name.toLowerCase() === cityName.toLowerCase());
    if (enriched) {
      setSelectedCity(enriched);
      setSearchTerm(enriched.name);
      fetchLivePrediction(enriched.name, enriched.state);
    }
  };

  // Grouped cities filtered by search term
  const filteredStateCities = {};
  let totalFound = 0;
  Object.keys(STATE_CITY_NODES).forEach((state) => {
    const matched = STATE_CITY_NODES[state].cities.filter(city =>
      city.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      city.code.includes(searchTerm)
    );
    if (matched.length > 0) {
      filteredStateCities[state] = {
        model: STATE_CITY_NODES[state].model,
        cities: matched
      };
      totalFound += matched.length;
    }
  });

  const current = selectedCity || flatCities[0];
  const baseLoad = parseInt(liveData.predictedLoadMW) || 0;

  // Dynamic calculations for What-If Scenarios
  const loadFactor = (1 + tempDelta * 0.02) * (1 + humidityDelta * 0.005);
  const simulatedLoadMW = Math.round(baseLoad * loadFactor);

  const inertiaFactor = 1 + (50 - gridInertia) * 0.002;
  const simulatedUtilPct = Math.min(100, Math.max(0, Math.round(current.util * loadFactor * inertiaFactor)));

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

  const dynamicHourlyData = hourlyData.map(item => ({
    ...item,
    load: Math.round(item.load * loadFactor)
  }));

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const matchedCity = flatCities.find(
      (c) => c.name.toLowerCase() === searchTerm.trim().toLowerCase()
    );
    if (matchedCity) {
      setSelectedCity(matchedCity);
      setSearchTerm(matchedCity.name);
      fetchLivePrediction(matchedCity.name, matchedCity.state);
    } else {
      // Try partial match
      const partialMatched = flatCities.find((c) =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
      if (partialMatched) {
        setSelectedCity(partialMatched);
        setSearchTerm(partialMatched.name);
        fetchLivePrediction(partialMatched.name, partialMatched.state);
      }
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
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-mono font-bold transition-all shadow-lg ${autoOptimize
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

        <div className="lg:col-span-6 bg-[#03045E] text-[#CAF0F8] rounded-3xl p-6 border border-[#0077B6]/40 shadow-2xl flex flex-col space-y-4">
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
                value={selectedCity.code}
                onChange={(e) => {
                  const matched = flatCities.find(c => c.code === e.target.value);
                  if (matched) {
                    setSelectedCity(matched);
                    setSearchTerm(matched.name);
                    fetchLivePrediction(matched.name, matched.state);
                  }
                }}
                className="w-full appearance-none bg-[#023E8A] text-[#CAF0F8] text-xs font-mono px-3 py-2.5 rounded-xl border border-[#0077B6]/50 focus:outline-none focus:border-[#48CAE4] cursor-pointer font-bold"
              >
                {flatCities.map((city) => (
                  <option key={city.code} value={city.code} className="bg-[#03045E] text-white">
                    {city.name} Node ({city.status})
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-[#48CAE4] absolute right-3 top-3 pointer-events-none" />
            </div>
          </div>

          {/* Live Map */}
          <div className="relative h-[420px] rounded-2xl border border-[#0077B6]/50 overflow-hidden shadow-2xl mb-4">
            <MapContainer
              center={liveData.latlng}
              zoom={9}
              scrollWheelZoom={false}
              className="h-full w-full z-0"
            >
              <ChangeView center={liveData.latlng} />
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />

              {flatCities.map((city) => (
                <Marker
                  key={city.code}
                  position={city.latlng}
                  eventHandlers={{
                    click: () => {
                      setSelectedCity(city);
                      setSearchTerm(city.name);
                      fetchLivePrediction(city.name, city.state);
                    },
                  }}
                >
                  <Popup>
                    <div className="font-mono text-xs">
                      <strong className="text-[#03045E]">{city.name} Node</strong><br />
                      Load: {city.load}<br />
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
              <span className="text-slate-300">{totalFound} Found</span>
            </div>

            <div className="space-y-4 max-h-64 overflow-y-auto pr-1">
              {totalFound > 0 ? (
                Object.keys(filteredStateCities).map((state) => (
                  <div key={state} className="space-y-2">
                    <div className="sticky top-0 bg-[#03045E] text-[11px] font-mono font-bold text-[#48CAE4] uppercase tracking-widest border-b border-[#0077B6]/40 pb-1 pt-1 flex justify-between items-center z-10">
                      <span>{state}</span>
                      <span className="text-[9px] text-slate-400">({filteredStateCities[state].model})</span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {filteredStateCities[state].cities.map((city) => (
                        <button
                          key={city.code}
                          onClick={() => handleSelectCity(state, city)}
                          className={`p-2 rounded-xl border text-left transition-all cursor-pointer ${selectedCity.code === city.code
                            ? 'bg-[#0077B6] text-white border-[#48CAE4] shadow-[0_0_12px_rgba(72,202,228,0.4)]'
                            : 'bg-[#03045E]/60 text-[#CAF0F8] border-[#0077B6]/40 hover:border-[#48CAE4]/60'
                            }`}
                        >
                          <span className="font-bold text-xs block truncate">{city.name}</span>
                          <span className="text-[9px] font-mono text-slate-300">[{city.code}]</span>
                        </button>
                      ))}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center text-xs text-slate-400 py-4 font-mono">
                  No city found
                </div>
              )}
            </div>
          </div>

          {/* ML Model Diagnostics */}
          <div className="bg-[#023E8A]/40 p-4 rounded-2xl border border-[#0077B6]/30 shadow-md space-y-4">
            <div className="font-mono text-[10px] text-[#48CAE4] font-bold tracking-wider flex items-center justify-between">
              <span>[ AI MODEL DIAGNOSTICS & FEATURE IMPORTANCE ]</span>
              <span className="text-slate-300">ACTIVE MODEL: {current.model}</span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-[#03045E]/60 p-2.5 rounded-xl border border-[#0077B6]/30">
                <div className="text-[9px] font-mono text-slate-400">ACCURACY SCORE</div>
                <div className="text-sm font-bold text-white font-mono">R²: 0.962</div>
              </div>
              <div className="bg-[#03045E]/60 p-2.5 rounded-xl border border-[#0077B6]/30">
                <div className="text-[9px] font-mono text-slate-400">MEAN ABSOLUTE ERROR</div>
                <div className="text-sm font-bold text-white font-mono">MAE: ±12.4 MW</div>
              </div>
            </div>

            <div className="space-y-2.5">
              <div className="text-[9px] font-mono text-slate-400 font-bold uppercase tracking-wider">[ Feature Weights ]</div>

              {/* Feature 1 */}
              <div className="space-y-1">
                <div className="flex justify-between text-[10px] font-mono">
                  <span className="text-slate-300">Ambient Temperature</span>
                  <span className="text-[#48CAE4] font-bold">45%</span>
                </div>
                <div className="w-full bg-[#03045E]/60 h-1.5 rounded-full overflow-hidden p-0.5 border border-[#0077B6]/20">
                  <div className="h-full bg-[#48CAE4] rounded-full" style={{ width: '45%' }}></div>
                </div>
              </div>

              {/* Feature 2 */}
              <div className="space-y-1">
                <div className="flex justify-between text-[10px] font-mono">
                  <span className="text-slate-300">Hour of Day</span>
                  <span className="text-[#48CAE4] font-bold">30%</span>
                </div>
                <div className="w-full bg-[#03045E]/60 h-1.5 rounded-full overflow-hidden p-0.5 border border-[#0077B6]/20">
                  <div className="h-full bg-[#0077B6] rounded-full" style={{ width: '30%' }}></div>
                </div>
              </div>

              {/* Feature 3 */}
              <div className="space-y-1">
                <div className="flex justify-between text-[10px] font-mono">
                  <span className="text-slate-300">Relative Humidity</span>
                  <span className="text-[#48CAE4] font-bold">15%</span>
                </div>
                <div className="w-full bg-[#03045E]/60 h-1.5 rounded-full overflow-hidden p-0.5 border border-[#0077B6]/20">
                  <div className="h-full bg-[#023E8A] rounded-full" style={{ width: '15%' }}></div>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: ANALYTICS PANEL */}
        <div className="lg:col-span-6 space-y-6">

          <div className="bg-[#E6F7FF] rounded-2xl p-6 border border-[#0077B6]/20 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
              <div>
                <h2 className="text-2xl font-black text-[#03045E]">{current.name}</h2>
                <p className="text-xs font-mono text-[#0077B6] uppercase tracking-wider">{current.region}</p>
                <p className="text-[11px] font-mono text-slate-500 mt-0.5">{current.coords} • Last Sync: Just now</p>
              </div>
              <span className={`px-3 py-1 rounded-full font-mono text-xs font-bold border ${liveData.gridStatus === 'CRITICAL'
                ? 'bg-rose-100 text-rose-800 border-rose-300'
                : liveData.gridStatus === 'STRESSED'
                  ? 'bg-amber-100 text-amber-800 border-amber-300'
                  : 'bg-emerald-100 text-emerald-800 border-emerald-300'
                }`}>
                {liveData.gridStatus}
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
              <span className="text-4xl lg:text-5xl font-black text-[#03045E]">{simulatedLoadMW} MW</span>
              <span className="text-xs font-mono text-slate-500 uppercase font-bold">predicted load</span>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-mono">
                <span className="font-bold text-[#03045E]">GRID UTILIZATION CAPACITY</span>
                <span className="text-[#0077B6] font-bold">{simulatedUtilPct}%</span>
              </div>
              <div className="w-full bg-white h-3 rounded-full overflow-hidden p-0.5 border border-[#0077B6]/20">
                <div
                  className="h-full bg-[#0077B6] rounded-full transition-all duration-500"
                  style={{ width: `${simulatedUtilPct}%` }}
                ></div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-[#E6F7FF] rounded-2xl p-4 border border-[#0077B6]/20 shadow-sm relative">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-mono text-slate-600 font-bold">TEMPERATURE</span>
                <Activity className="w-4 h-4 text-[#0077B6]" />
              </div>
              <div className="text-lg font-black text-[#03045E]">{liveData.temperature}°C</div>
              {loading && <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-[#0077B6] animate-ping" />}
            </div>

            <div className="bg-[#E6F7FF] rounded-2xl p-4 border border-[#0077B6]/20 shadow-sm relative">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-mono text-slate-600 font-bold">HUMIDITY</span>
                <Droplets className="w-4 h-4 text-cyan-600" />
              </div>
              <div className="text-lg font-black text-[#03045E]">{liveData.humidity}%</div>
              {loading && <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-[#0077B6] animate-ping" />}
            </div>

            <div className="bg-[#E6F7FF] rounded-2xl p-4 border border-[#0077B6]/20 shadow-sm relative">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-mono text-slate-600 font-bold">WIND SPEED</span>
                <Wind className="w-4 h-4 text-blue-500" />
              </div>
              <div className="text-lg font-black text-[#03045E]">{liveData.windSpeed} km/h</div>
              {loading && <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-[#0077B6] animate-ping" />}
            </div>

            <div className="bg-[#E6F7FF] rounded-2xl p-4 border border-[#0077B6]/20 shadow-sm relative">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-mono text-slate-600 font-bold">SOLAR RAD.</span>
                <Sun className="w-4 h-4 text-amber-500" />
              </div>
              <div className="text-lg font-black text-[#03045E]">{current.solar}</div>
              {loading && <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-[#0077B6] animate-ping" />}
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
                <AreaChart data={dynamicHourlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorLoad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0077B6" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#0077B6" stopOpacity={0.05} />
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

          {/* WHAT-IF SCENARIO SIMULATOR CARD */}
          <div className="bg-[#03045E] text-[#CAF0F8] rounded-3xl p-6 border border-[#0077B6]/40 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-[#0077B6]/40 pb-4">
              <span className="font-bold text-sm tracking-wide text-[#48CAE4] flex items-center gap-2">
                <Sliders className="w-4 h-4 text-[#48CAE4]" /> WHAT-IF SCENARIO SIMULATOR
              </span>
              <span className="text-[10px] font-mono bg-[#023E8A] px-2 py-1 rounded text-[#48CAE4] font-bold border border-[#0077B6]/50">
                AI PREDICTIVE MODE
              </span>
            </div>

            <div className="space-y-4">
              {/* Slider 1: Temperature Delta */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-slate-300">Ambient Temperature Delta</span>
                  <span className="text-[#48CAE4] font-bold">{tempDelta > 0 ? `+${tempDelta}` : tempDelta}°C</span>
                </div>
                <input
                  type="range"
                  min="-10"
                  max="10"
                  value={tempDelta}
                  onChange={(e) => setTempDelta(parseInt(e.target.value))}
                  className="w-full h-1.5 rounded-lg appearance-none cursor-pointer bg-slate-700 accent-[#48CAE4]"
                  style={{
                    background: `linear-gradient(to right, #48CAE4 0%, #48CAE4 ${((tempDelta + 10) / 20) * 100}%, #334155 ${((tempDelta + 10) / 20) * 100}%, #334155 100%)`
                  }}
                />
              </div>

              {/* Slider 2: Humidity Delta */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-slate-300">Relative Humidity Delta</span>
                  <span className="text-amber-400 font-bold">{humidityDelta > 0 ? `+${humidityDelta}` : humidityDelta}%</span>
                </div>
                <input
                  type="range"
                  min="-30"
                  max="30"
                  value={humidityDelta}
                  onChange={(e) => setHumidityDelta(parseInt(e.target.value))}
                  className="w-full h-1.5 rounded-lg appearance-none cursor-pointer bg-slate-700 accent-amber-400"
                  style={{
                    background: `linear-gradient(to right, #fbbf24 0%, #fbbf24 ${((humidityDelta + 30) / 60) * 100}%, #334155 ${((humidityDelta + 30) / 60) * 100}%, #334155 100%)`
                  }}
                />
              </div>

              {/* Slider 3: Grid Structural Inertia */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-slate-300">Grid Structural Inertia</span>
                  <span className="text-purple-400 font-bold">{gridInertia}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={gridInertia}
                  onChange={(e) => setGridInertia(parseInt(e.target.value))}
                  className="w-full h-1.5 rounded-lg appearance-none cursor-pointer bg-slate-700 accent-purple-400"
                  style={{
                    background: `linear-gradient(to right, #c084fc 0%, #c084fc ${gridInertia}%, #334155 ${gridInertia}%, #334155 100%)`
                  }}
                />
              </div>
            </div>

            <div className="p-3 bg-[#023E8A]/50 rounded-xl border border-[#0077B6]/30 text-[10px] font-mono text-slate-300 flex items-center justify-between">
              <span>LOAD MULTIPLIER: <span className="text-[#48CAE4] font-bold">x{loadFactor.toFixed(2)}</span></span>
              <span>INERTIA STABILITY: <span className="text-purple-400 font-bold">{gridInertia < 30 ? 'CRITICAL' : gridInertia < 70 ? 'NOMINAL' : 'MAXIMUM'}</span></span>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}