import React, { useState, useEffect, useRef, useMemo } from 'react';
import './GlobalHub.css';

/* ==========================================
   0. GLOBAL NETWORK CANVAS
   The page's signature element: a single fixed
   node-network that lives behind every section,
   glowing brighter near the cursor. Content sits
   on translucent glass above it, so the "digital
   twin" motif is always faintly alive underneath.
   ========================================== */
function GlobalNetworkCanvas() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let w, h, nodes, frameId;
    const mouse = { x: -9999, y: -9999 };

    function resize() {
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = w * devicePixelRatio;
      canvas.height = h * devicePixelRatio;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
    }

    function initNodes() {
      const count = w < 700 ? 34 : 78;
      nodes = Array.from({ length: count }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.1,
        vy: (Math.random() - 0.5) * 0.1,
        r: Math.random() * 1.4 + 1
      }));
    }

    function draw() {
      ctx.clearRect(0, 0, w, h);

      nodes.forEach((n) => {
        n.x += n.vx;
        n.y += n.vy;
        if (n.x < 0 || n.x > w) n.vx *= -1;
        if (n.y < 0 || n.y > h) n.vy *= -1;

        const dxm = n.x - mouse.x;
        const dym = n.y - mouse.y;
        const distM = Math.hypot(dxm, dym);
        if (distM < 160) {
          const pull = (160 - distM) / 160 * 0.02;
          n.vx += (dxm / (distM || 1)) * -pull * 0.02;
          n.vy += (dym / (distM || 1)) * -pull * 0.02;
        }
      });

      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const a = nodes[i], b = nodes[j];
          const d = Math.hypot(a.x - b.x, a.y - b.y);
          if (d < 140) {
            const midX = (a.x + b.x) / 2;
            const midY = (a.y + b.y) / 2;
            const distM = Math.hypot(midX - mouse.x, midY - mouse.y);
            const proximity = Math.max(0, 1 - distM / 260);
            const alpha = (0.12 + proximity * 0.22) * (1 - d / 140);
            ctx.strokeStyle = `rgba(2,132,199,${alpha})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        }
      }

      nodes.forEach((n) => {
        const distM = Math.hypot(n.x - mouse.x, n.y - mouse.y);
        const proximity = Math.max(0, 1 - distM / 220);
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r + proximity * 1.6, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(2,132,199,${0.4 + proximity * 0.5})`;
        ctx.shadowColor = 'rgba(56,189,248,0.55)';
        ctx.shadowBlur = 4 + proximity * 8;
        ctx.fill();
      });
      ctx.shadowBlur = 0;

      frameId = requestAnimationFrame(draw);
    }

    function handleMove(e) {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    }
    function handleLeave() {
      mouse.x = -9999;
      mouse.y = -9999;
    }

    resize();
    initNodes();

    if (reduceMotion) {
      draw();
      cancelAnimationFrame(frameId);
    } else {
      draw();
      window.addEventListener('mousemove', handleMove);
      window.addEventListener('mouseleave', handleLeave);
    }
    window.addEventListener('resize', resize);

    return () => {
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseleave', handleLeave);
      cancelAnimationFrame(frameId);
    };
  }, []);

  return <canvas ref={canvasRef} className="network-canvas" aria-hidden="true" />;
}

/* ==========================================
   Scroll-reveal: observes every .reveal element
   once on mount and toggles .in-view as it enters
   the viewport. One observer for the whole tree.
   ========================================== */
function useScrollReveal() {
  useEffect(() => {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const els = document.querySelectorAll('.reveal');
    if (reduceMotion || !('IntersectionObserver' in window)) {
      els.forEach((el) => el.classList.add('in-view'));
      return;
    }
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('in-view');
            obs.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: '0px 0px -60px 0px' }
    );
    els.forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, []);
}

/* ==========================================
   1. HERO
   First CTA now jumps straight into the real
   Traffic Eye module; second still scrolls to
   the live console preview on this page.
   ========================================== */
function Hero({ onNavigate }) {
  return (
    <section className="hero">
      <div className="hero-content reveal">
        <span className="eyebrow">
          <span className="pip" />
          DIGITAL TWIN &nbsp;·&nbsp; 12,400 NODES ONLINE
        </span>
        <h1>
          The city, <span className="grad">thinking</span>
          <br />
          in real time.
        </h1>
        <p className="hero-sub">
          NeuroCity fuses traffic, energy, and citizen data into one living model
          of the city — so problems get solved before residents ever notice them.
        </p>
        <div className="hero-cta">
          
            href="#"
            className="btn btn-solid btn-lg"
            onClick={(e) => { e.preventDefault(); onNavigate && onNavigate('traffic-eye'); }}
          <a>
            Launch Traffic Eye →
          </a>
          <a href="#console" className="btn btn-ghost btn-lg">Watch the grid live</a>
        </div>
        <div className="hero-footnote">
          <span className="live">Live sync</span>
          <span className="mono">·</span>
          <span>256 city sensors reporting this second</span>
        </div>
      </div>
    </section>
  );
}

/* ==========================================
   2. SECTORS
   ========================================== */
const SECTORS = [
  'Municipal Governance',
  'Public Safety & Emergency',
  'Utilities & Grid Ops',
  'Transit Authorities',
  'Urban Planning'
];

function SectorsSection() {
  return (
    <section className="sectors">
      <div className="sectors-inner reveal">
        <div className="label">Built to run alongside</div>
        <div className="sector-list">
          {SECTORS.map((s) => (
            <span key={s}>{s}</span>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ==========================================
   3. STATS
   ========================================== */
const DEFAULTS = {
  sensorNodes: 12400,
  dataPointsPerSecond: 2.8,
  incidentResponseSeconds: 41,
  energySavedPercent: 18.6,
  uptimePercent: 99.98
};

const STAT_CONFIG = [
  { key: 'sensorNodes', label: 'Active sensor nodes', suffix: '+', decimals: 0 },
  { key: 'dataPointsPerSecond', label: 'Data points / second', suffix: 'M', decimals: 1 },
  { key: 'incidentResponseSeconds', label: 'Faster incident response', suffix: 's', decimals: 0 },
  { key: 'energySavedPercent', label: 'Grid energy saved', suffix: '%', decimals: 1 },
  { key: 'uptimePercent', label: 'Platform uptime', suffix: '%', decimals: 2 }
];

function CountUp({ target, decimals, suffix }) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setVisible(true);
          obs.disconnect();
        }
      },
      { threshold: 0.5 }
    );
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    if (!visible) return;
    const dur = 1400;
    const start = performance.now();
    let frame;
    function tick(now) {
      const p = Math.min((now - start) / dur, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      const val = target * eased;
      if (ref.current) {
        ref.current.textContent = val.toFixed(decimals).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
      }
      if (p < 1) frame = requestAnimationFrame(tick);
    }
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [visible, target, decimals]);

  return (
    <span className="stat-value">
      <span ref={ref}>0</span>
      <span className="unit">{suffix}</span>
    </span>
  );
}

function StatsSection() {
  const [data, setData] = useState(DEFAULTS);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/stats')
      .then((res) => res.json())
      .then((json) => {
        if (!cancelled) setData(json);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section className="stats">
      <div className="stats-inner reveal">
        {STAT_CONFIG.map((cfg) => (
          <div className="stat" key={cfg.key}>
            <CountUp target={data[cfg.key]} decimals={cfg.decimals} suffix={cfg.suffix} />
            <div className="stat-label">{cfg.label}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ==========================================
   SHARED FEATURE PANEL
   Every "live module" demo (corridor, climate,
   citizen desk, transit, AQI) shares this glass
   shell so the five sections read as one system
   instead of five differently-styled widgets.
   ========================================== */
function FeaturePanel({ id, index, title, description, controls, children, reverse }) {
  return (
    <section className="section feature-section" id={id}>
      <div className="feature-panel reveal">
        <div className={`feature-grid${reverse ? ' reverse' : ''}`}>
          <div className="feature-copy">
            <span className="kicker">Live Feature — {index}</span>
            <h3>{title}</h3>
            <p>{description}</p>
            {controls}
          </div>
          <div className="feature-console data-console">
            {children}
          </div>
        </div>
      </div>
    </section>
  );
}

function toneFor(status) {
  if (status === 'Resolved' || status === 'OnTime' || status === 'Good') return 'good';
  if (status === 'Moderate') return 'warn';
  return 'bad';
}

/* ==========================================
   FEATURE 1: EMERGENCY GREEN CORRIDOR
   Preview lives here; the "Open full Traffic Eye
   workspace" link takes the operator to the real
   YOLOv8 analyzer + 3D intersection simulator.
   ========================================== */
function EmergencyCorridorSection({ onNavigate }) {
  const [activeNode, setActiveNode] = useState(0);
  const [isSimulating, setIsSimulating] = useState(false);
  const [route, setRoute] = useState('Iscon → Sterling');

  const nodesList = ['Iscon', 'Junction 01', 'Junction 02', 'Junction 03', 'Sterling Hospital'];

  useEffect(() => {
    let interval;
    if (isSimulating) {
      interval = setInterval(() => {
        setActiveNode((prev) => {
          if (prev < nodesList.length - 1) {
            return prev + 1;
          } else {
            setIsSimulating(false);
            return prev;
          }
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isSimulating]);

  const startSimulation = (selectedRoute) => {
    setRoute(selectedRoute);
    setActiveNode(0);
    setIsSimulating(true);
  };

  return (
    <FeaturePanel
      id="traffic-eye"
      index="01"
      title="Emergency Green Corridor Simulator"
      description="Trigger live dispatch overrides. A Node.js gateway talks directly to Django's NetworkX graph-theory routing to turn lights green dynamically, block by block."
      controls={
        <>
          <div className="route-selector">
            <button
              className={`route-btn ${route === 'Iscon → Sterling' ? 'active' : ''}`}
              onClick={() => startSimulation('Iscon → Sterling')}
            >
              Ambulance: Iscon → Sterling
            </button>
            <button
              className={`route-btn ${route === 'SG Highway → Civil' ? 'active' : ''}`}
              onClick={() => startSimulation('SG Highway → Civil')}
            >
              Ambulance: SG Highway → Civil
            </button>
          </div>
          <button
            className="btn btn-solid btn-feature"
            onClick={() => startSimulation(route)}
            disabled={isSimulating}
          >
            {isSimulating ? 'Dispatching Emergency…' : '⚡ Trigger Emergency Dispatch'}
          </button>
          <button
            type="button"
            className="feature-more-link"
            onClick={() => onNavigate && onNavigate('traffic-eye')}
          >
            Open full Traffic Eye workspace (YOLOv8 analyzer + 3D simulator) →
          </button>
        </>
      }
    >
      <div className="console-bar">
        <span className="tag mono">
          <span className="pip-dot" /> TRAFFIC_EYE // NETWORKX_ROUTING
        </span>
        <span className="console-meta">Route: {route}</span>
      </div>

      <div className="map-nodes-line">
        {nodesList.map((nodeName, index) => {
          let statusClass = '';
          if (index === activeNode && isSimulating) {
            statusClass = 'active-ambulance';
          } else if (index < activeNode || (!isSimulating && activeNode === nodesList.length - 1)) {
            statusClass = 'light-green';
          }
          return (
            <div key={nodeName}>
              <div className={`map-node ${statusClass}`}>{index + 1}</div>
              <span className="map-node-label">{nodeName}</span>
            </div>
          );
        })}
      </div>

      <div className="data-status">
        <span>Status: {isSimulating ? `Ambulance moving to node ${activeNode + 1}` : 'Corridor standby / all green'}</span>
        <span className="ok">Django Graph API: OK</span>
      </div>
    </FeaturePanel>
  );
}

/* ==========================================
   FEATURE 2: WHAT-IF CLIMATE & ENERGY KNOBS
   Links out to the real Energy Sentinel dashboard
   (10-city map, live load forecast, storage %).
   ========================================== */
function ClimateKnobsSection({ onNavigate }) {
  const [temp, setTemp] = useState(40);
  const [evLoad, setEvLoad] = useState(50);

  const gridStrain = Math.min(100, Math.round((temp - 30) * 2.2 + evLoad * 0.6));
  const solarOutput = Math.max(10, Math.round(85 - (temp - 35) * 1.5));
  const co2Offset = Math.round(evLoad * 1.4 + (100 - gridStrain) * 0.5);

  return (
    <FeaturePanel
      id="energy-sentinel"
      index="02"
      reverse
      title="What-If Climate & Energy Simulator"
      description="Simulate extreme weather events and surging EV adoption rates. Watch Energy Sentinel dynamically rebalance micro-grids in real time as conditions shift."
      controls={
        <div className="field-group">
          <div className="slider-row">
            <label><span>Ambient Temperature</span><span className="live-val">{temp}°C</span></label>
            <input type="range" min="30" max="50" value={temp} onChange={(e) => setTemp(Number(e.target.value))} />
          </div>
          <div className="slider-row">
            <label><span>EV Fleet Surge</span><span className="live-val">{evLoad}% Load</span></label>
            <input type="range" min="10" max="100" value={evLoad} onChange={(e) => setEvLoad(Number(e.target.value))} />
          </div>
          <button
            type="button"
            className="feature-more-link"
            onClick={() => onNavigate && onNavigate('energy-sentinel')}
          >
            Open full Energy Sentinel dashboard (live city map + load forecast) →
          </button>
        </div>
      }
    >
      <div className="console-bar">
        <span className="tag mono">
          <span className="pip-dot" /> ENERGY_SENTINEL // PREDICTIVE_AI
        </span>
      </div>

      <div className="metric-grid">
        <div className="metric-card">
          <span className="m-label">Grid Load Index</span>
          <span className="m-val">{gridStrain}%</span>
        </div>
        <div className="metric-card">
          <span className="m-label">Solar Efficiency</span>
          <span className="m-val">{solarOutput}%</span>
        </div>
        <div className="metric-card">
          <span className="m-label">CO₂ Offset Rate</span>
          <span className="m-val">+{co2Offset} kt/h</span>
        </div>
        <div className="metric-card">
          <span className="m-label">Micro-Grid Status</span>
          <span className="m-val accent-green" style={{ fontSize: '16px' }}>Auto-Balanced</span>
        </div>
      </div>

      <div className="data-status" style={{ marginTop: '18px' }}>
        <span>AI recommendation: {gridStrain > 80 ? 'Rerouting industrial power to residential sectors' : 'Standard distribution active'}</span>
      </div>
    </FeaturePanel>
  );
}

/* ==========================================
   FEATURE 3: CITIZEN POTHOLE / ISSUE FEED
   Links out to the real Citizen Desk (AI NLP
   triage + urgency scoring + Kanban resolver).
   ========================================== */
function CitizenHeatmapSection({ onNavigate }) {
  const [issues, setIssues] = useState([
    { id: 1, title: 'Pothole near Sindhu Bhavan Road', category: 'Roads', status: 'Pending' },
    { id: 2, title: 'Streetlight outage at Vastrapur Lake', category: 'Lighting', status: 'Resolved' },
    { id: 3, title: 'Water leakage near CG Road', category: 'Water', status: 'Pending' }
  ]);
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState('Roads');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    const newItem = { id: Date.now(), title: newTitle, category: newCategory, status: 'Pending' };
    setIssues([newItem, ...issues]);
    setNewTitle('');
  };

  return (
    <FeaturePanel
      id="citizen-desk"
      index="03"
      title="Citizen Issue & Pothole Heatmap Feed"
      description="Empower residents to report civic problems instantly. Citizen Desk automatically routes issues to the correct municipal ward dashboard with live tracking."
      controls={
        <form onSubmit={handleSubmit} className="feature-form">
          <input
            type="text"
            placeholder="Describe issue (e.g., Broken drainage cover)…"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
          />
          <select value={newCategory} onChange={(e) => setNewCategory(e.target.value)}>
            <option value="Roads">Roads & Potholes</option>
            <option value="Lighting">Street Lighting</option>
            <option value="Water">Water Supply</option>
            <option value="Waste">Waste Management</option>
          </select>
          <button type="submit" className="btn btn-solid btn-feature">Submit Citizen Report 🚀</button>
          <button
            type="button"
            className="feature-more-link"
            onClick={() => onNavigate && onNavigate('citizen-desk')}
          >
            Open full Citizen Desk (AI NLP triage + resolver Kanban) →
          </button>
        </form>
      }
    >
      <div className="console-bar">
        <span className="tag mono">
          <span className="pip-dot" /> CITIZEN_DESK // LIVE_FEED
        </span>
        <span className="console-meta">Total reports: {issues.length}</span>
      </div>

      <div className="data-feed">
        {issues.map((item) => (
          <div key={item.id} className="data-row">
            <div>
              <div className="row-title">{item.title}</div>
              <span className="row-sub">Category: {item.category}</span>
            </div>
            <span className={`status-badge ${toneFor(item.status)}`}>{item.status}</span>
          </div>
        ))}
      </div>
    </FeaturePanel>
  );
}

/* ==========================================
   FEATURE 4: SMART TRANSIT / METRO & BUS FEED
   ========================================== */
function SmartTransitSection() {
  const [transitList] = useState([
    { id: 1, routeNo: 'AMTS Route 13/1', name: 'Kalupur to Vastrapur', eta: '3 mins', status: 'OnTime' },
    { id: 2, routeNo: 'Metro East-West Corridor', name: 'Apparel Park to Vastral Gam', eta: 'Arriving', status: 'OnTime' },
    { id: 3, routeNo: 'BRTS Corridor 1', name: 'RTO Circle to Maninagar', eta: '12 mins', status: 'Delayed' }
  ]);
  const [filterType, setFilterType] = useState('All');

  const filteredTransit = transitList.filter((item) => {
    if (filterType === 'All') return true;
    if (filterType === 'Bus') return item.routeNo.includes('AMTS');
    if (filterType === 'Metro') return item.routeNo.includes('Metro');
    if (filterType === 'BRTS') return item.routeNo.includes('BRTS');
    return false;
  });

  return (
    <FeaturePanel
      id="transit-eye"
      index="04"
      reverse
      title="Smart Transit & Fleet Tracking Feed"
      description="Monitor real-time GPS coordinates and schedules for municipal buses, BRTS corridors, and Metro lines across the entire transit network."
      controls={
        <div className="feature-form">
          <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--navy)' }}>Filter transit mode</label>
          <select value={filterType} onChange={(e) => setFilterType(e.target.value)}>
            <option value="All">All networks (Bus, BRTS, Metro)</option>
            <option value="Bus">AMTS city buses</option>
            <option value="BRTS">BRTS express corridors</option>
            <option value="Metro">Metro rail lines</option>
          </select>
          <div className="hint">Synced directly with the GTFS real-time municipal telemetry gateway.</div>
        </div>
      }
    >
      <div className="console-bar">
        <span className="tag mono">
          <span className="pip-dot" /> TRANSIT_EYE // GTFS_FEED
        </span>
        <span className="console-meta">Active units: {filteredTransit.length}</span>
      </div>

      <div className="data-feed">
        {filteredTransit.map((item) => (
          <div key={item.id} className="data-row">
            <div>
              <div className="row-title">{item.routeNo} — {item.name}</div>
              <span className="row-sub">Next arrival/ETA: <strong>{item.eta}</strong></span>
            </div>
            <span className={`status-badge ${toneFor(item.status)}`}>{item.status}</span>
          </div>
        ))}
      </div>
    </FeaturePanel>
  );
}

/* ==========================================
   FEATURE 5: AIR QUALITY (AQI) LIVE MONITOR
   ========================================== */
function SmartAQISection() {
  const [aqiList] = useState([
    { id: 1, zone: 'SG Highway Zone', aqi: 68, pm25: '22 µg/m³', status: 'Good' },
    { id: 2, zone: 'Maninagar Industrial Pocket', aqi: 154, pm25: '64 µg/m³', status: 'Poor' },
    { id: 3, zone: 'Vastrapur Lake Park', aqi: 45, pm25: '14 µg/m³', status: 'Good' },
    { id: 4, zone: 'CG Road Commercial Hub', aqi: 112, pm25: '42 µg/m³', status: 'Moderate' }
  ]);
  const [zoneFilter, setZoneFilter] = useState('All');

  const filteredAqi = aqiList.filter((item) => zoneFilter === 'All' || item.status === zoneFilter);

  return (
    <FeaturePanel
      id="eco-sentinel"
      index="05"
      title="Air Quality & Pollution Index (AQI) Live Monitor"
      description="Track real-time PM2.5, PM10, and gaseous pollutant metrics collected from municipal sensor arrays deployed across different urban zones."
      controls={
        <div className="feature-form">
          <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--navy)' }}>Filter by AQI status</label>
          <select value={zoneFilter} onChange={(e) => setZoneFilter(e.target.value)}>
            <option value="All">All zones</option>
            <option value="Good">Good AQI (0–50)</option>
            <option value="Moderate">Moderate AQI (51–100)</option>
            <option value="Poor">Poor AQI (100+)</option>
          </select>
          <div className="hint">Connected via IoT wireless sensor nodes and real-time environmental APIs.</div>
        </div>
      }
    >
      <div className="console-bar">
        <span className="tag mono">
          <span className="pip-dot" /> ECO_SENTINEL // AQI_MONITOR
        </span>
        <span className="console-meta">Active stations: {filteredAqi.length}</span>
      </div>

      <div className="data-feed">
        {filteredAqi.map((item) => (
          <div key={item.id} className="data-row">
            <div>
              <div className="row-title">{item.zone}</div>
              <span className="row-sub">PM2.5: {item.pm25} | AQI Index: <strong>{item.aqi}</strong></span>
            </div>
            <span className={`status-badge ${toneFor(item.status)}`}>{item.status}</span>
          </div>
        ))}
      </div>
    </FeaturePanel>
  );
}

/* ==========================================
   4. GLOBAL HUB CONSOLE
   ========================================== */
function ConsoleSection() {
  const bars = useMemo(
    () => Array.from({ length: 28 }, () => ({ height: 30 + Math.random() * 140, delay: Math.random() * 4 })),
    []
  );

  return (
    <section className="section" id="console">
      <div className="section-head reveal">
        <span className="kicker">One Grid, Every System</span>
        <h2>Every borough, on a single screen.</h2>
        <p>
          Global Hub pulls live telemetry from every module into one command view —
          traffic flow, grid load, and citizen requests, all reconciled against the
          same city clock.
        </p>
      </div>

      <div className="console-wrap reveal">
        <div className="console data-console">
          <div className="console-bar">
            <span className="tag mono">
              <span className="pip-dot" />
              GLOBAL_HUB // SESSION_ACTIVE
            </span>
            <div className="dots"><span /><span /><span /></div>
          </div>

          <div className="console-grid">
            <div className="panel">
              <div className="panel-title"><b>Digital Twin — Skyline Load</b><span className="badge ok">STABLE</span></div>
              <div className="skyline">
                {bars.map((bar, i) => (
                  <i key={i} style={{ height: `${bar.height}px`, animationDelay: `${bar.delay}s` }} />
                ))}
              </div>
            </div>

            <div className="panel">
              <div className="panel-title"><b>Module Status</b></div>
              <div className="metric-row"><span className="k">Traffic Eye</span><span className="v up">Optimal</span></div>
              <div className="metric-row"><span className="k">Energy Sentinel</span><span className="v up">99.9% stable</span></div>
              <div className="metric-row"><span className="k">Citizen Desk</span><span className="v">1,204 open</span></div>
              <div className="metric-row"><span className="k">Network mesh</span><span className="v up">Secure</span></div>
            </div>

            <div className="panel">
              <div className="panel-title"><b>Renewable Share</b></div>
              <div className="ring-wrap">
                <div className="ring">
                  <svg width="120" height="120">
                    <circle cx="60" cy="60" r="52" stroke="rgba(255,255,255,0.12)" strokeWidth="10" fill="none" />
                    <circle
                      cx="60" cy="60" r="52" stroke="url(#g1)" strokeWidth="10" fill="none"
                      strokeLinecap="round" strokeDasharray="326.7" strokeDashoffset="103"
                    />
                    <defs>
                      <linearGradient id="g1" x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0%" stopColor="#00B4D8" />
                        <stop offset="100%" stopColor="#22D3EE" />
                      </linearGradient>
                    </defs>
                  </svg>
                  <div className="ring-label"><span className="n">68.4%</span><span className="l">SOLAR + WIND</span></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ==========================================
   5. MODULES
   Cards now actually navigate to the real page
   instead of a dead href="#" link.
   ========================================== */
const MODULES_DATA = [
  {
    title: 'Traffic Eye',
    id: 'traffic-eye',
    desc: 'Reads municipal camera feeds in real time and triggers green-wave overrides for emergency vehicles.',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#00B4D8" strokeWidth="1.8">
        <rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" />
      </svg>
    )
  },
  {
    title: 'Energy Sentinel',
    id: 'energy-sentinel',
    desc: 'Balances power load and predicts demand across every sector, sixty seconds at a time.',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#00B4D8" strokeWidth="1.8">
        <path d="M13 2 3 14h7l-1 8 10-12h-7l1-8z" />
      </svg>
    )
  },
  {
    title: 'Citizen Desk',
    id: 'citizen-desk',
    desc: "Routes resident reports straight to the team responsible, with live status every step of the way.",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#00B4D8" strokeWidth="1.8">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
    )
  }
];

function ModulesSection({ onNavigate }) {
  return (
    <section className="section" id="modules">
      <div className="section-head reveal">
        <span className="kicker">The Modules</span>
        <h2>Four systems. One city brain.</h2>
        <p>Each module runs independently, but nothing happens in isolation — every decision is cross-checked against the whole city's state.</p>
      </div>
      <div className="modules-grid">
        {MODULES_DATA.map((m, i) => (
          <div className={`module-card reveal reveal-${i % 4}`} key={m.title}>
            <div className="module-icon">{m.icon}</div>
            <h3>{m.title}</h3>
            <p>{m.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ==========================================
   6. TESTIMONIALS
   ========================================== */
const QUOTES = [
  {
    initials: 'RS',
    name: 'R. Shah',
    role: 'Grid Operations, Energy Sentinel pilot',
    text: "We caught a substation overload forty minutes before it would have caused an outage. That's the difference NeuroCity makes."
  },
  {
    initials: 'PN',
    name: 'P. Nair',
    role: 'Traffic Operations Lead',
    text: 'Ambulance response times in the pilot corridor dropped by nearly a third once Traffic Eye started clearing the route automatically.'
  },
  {
    initials: 'AK',
    name: 'A. Kulkarni',
    role: 'Citizen Services Coordinator',
    text: "Residents used to call three departments for one pothole. Now it's one report, and they can watch it move to done."
  }
];

function TestimonialsSection() {
  return (
    <section className="section">
      <div className="section-head reveal">
        <span className="kicker">From The Field</span>
        <h2>Trusted where response time matters.</h2>
      </div>
      <div className="quote-grid">
        {QUOTES.map((q, i) => (
          <div className={`quote-card reveal reveal-${i}`} key={q.initials}>
            <div className="mark">&ldquo;</div>
            <p>{q.text}</p>
            <div className="quote-who">
              <div className="quote-avatar">{q.initials}</div>
              <div>
                <div className="name">{q.name}</div>
                <div className="role">{q.role}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ==========================================
   7. FAQ
   ========================================== */
const FAQ_ITEMS = [
  {
    q: 'What exactly is NeuroCity?',
    a: "A digital twin platform that mirrors a city's traffic, energy, and citizen-service systems in real time, so operators can see and act on problems as they form rather than after the fact."
  },
  {
    q: 'Can it run on our existing infrastructure?',
    a: 'Yes. NeuroCity ingests feeds from existing traffic cameras, smart meters, and municipal sensor networks — no need to replace hardware already in the ground.'
  },
  {
    q: 'How is citizen data protected?',
    a: 'Telemetry is anonymized at the edge before it reaches Global Hub, and every module runs on an isolated, encrypted mesh with role-based access for city staff.'
  },
  {
    q: 'How fast is the response, really?',
    a: 'Across current pilots, incident detection to first automated action averages under a minute — down from the 15–20 minute manual baseline.'
  },
  {
    q: 'Who is NeuroCity built for?',
    a: "City operations teams, utility providers, transit authorities, and emergency services who need one shared, live picture of what's happening across the city."
  }
];

function FAQSection() {
  const [openIndex, setOpenIndex] = useState(0);

  return (
    <section className="section">
      <div className="section-head reveal">
        <span className="kicker">Questions</span>
        <h2>Before you sign in.</h2>
      </div>
      <div className="faq-list reveal">
        {FAQ_ITEMS.map((item, i) => (
          <div className={`faq-item ${openIndex === i ? 'open' : ''}`} key={item.q}>
            <button className="faq-q" onClick={() => setOpenIndex(openIndex === i ? -1 : i)}>
              {item.q}
              <span className="plus">+</span>
            </button>
            <div className="faq-a">{item.a}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ==========================================
   8. CTA
   Bottom CTA now opens Traffic Eye directly.
   ========================================== */
function CTASection({ onNavigate }) {
  return (
    <section className="cta-section">
      <div className="cta-box reveal">
        <h2>Give your city a nervous system.</h2>
        <p>Start with Traffic Eye — clear an emergency corridor in under a minute.</p>
        
          href="#"
          className="btn btn-solid btn-lg"
          onClick={(e) => { e.preventDefault(); onNavigate && onNavigate('traffic-eye'); }}
        <a>
          Launch Traffic Eye →
        </a>
      </div>
    </section>
  );
}

/* ==========================================
   9. FOOTER
   ========================================== */
function FooterSection() {
  return (
    <footer>
      <div className="footer-inner">
        <div className="footer-top">
          <div className="footer-brand">
            <a href="#" className="footer-logo">
              <span className="footer-dot" />
              NEUROCITY
            </a>
            <p>A living digital twin for modern cities — traffic, energy, and citizen services, unified.</p>
          </div>
          <div className="footer-cols">
            <div className="footer-col">
              <h4>Modules</h4>
              <a href="#">Global Hub</a>
              <a href="#">Traffic Eye</a>
              <a href="#">Energy Sentinel</a>
              <a href="#">Citizen Desk</a>
            </div>
            <div className="footer-col">
              <h4>Platform</h4>
              <a href="#">Security</a>
              <a href="#">Documentation</a>
              <a href="#">System status</a>
            </div>
            <div className="footer-col">
              <h4>Company</h4>
              <a href="#">About</a>
              <a href="#">Contact</a>
              <a href="#">Careers</a>
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          <span>© 2026 NeuroCity. All systems nominal.</span>
          <span className="status mono">GRID_STATUS: ONLINE</span>
        </div>
      </div>
    </footer>
  );
}

/* ==========================================
   10. ROBOT MASCOT
   ========================================== */
const ZONE = { xMin: 6, xMax: 84, yMin: 20, yMax: 80 };
const MOVE_EVERY_MS = 5000;
const TIPS = [
  "Hi, I'm Byte — ask me anything!",
  'Traffic Eye just cleared an ambulance route.',
  'Grid stability is holding at 99.9%.',
  '12,400 sensors reporting in, all good.',
  'Try the Global Hub for the full picture.'
];

function randomInRange(min, max) {
  return min + Math.random() * (max - min);
}

function RobotMascot() {
  const stageRef = useRef(null);
  const headRef = useRef(null);
  const pupilLRef = useRef(null);
  const pupilRRef = useRef(null);

  const [pos, setPos] = useState({ x: 82, y: 72 });
  const [tipIndex, setTipIndex] = useState(0);
  const [showTip, setShowTip] = useState(false);

  useEffect(() => {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduceMotion) return;

    const id = setInterval(() => {
      setPos({
        x: randomInRange(ZONE.xMin, ZONE.xMax),
        y: randomInRange(ZONE.yMin, ZONE.yMax)
      });
    }, MOVE_EVERY_MS);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduceMotion) return;

    function handleMove(e) {
      const stage = stageRef.current;
      if (!stage) return;
      const rect = stage.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height * 0.32;
      const dx = e.clientX - cx;
      const dy = e.clientY - cy;
      const angle = Math.atan2(dy, dx);
      const pupilTravel = 5;
      const px = Math.cos(angle) * pupilTravel;
      const py = Math.sin(angle) * pupilTravel;

      if (pupilLRef.current) pupilLRef.current.setAttribute('transform', `translate(${px},${py})`);
      if (pupilRRef.current) pupilRRef.current.setAttribute('transform', `translate(${px},${py})`);

      const tilt = Math.max(-9, Math.min(9, (dx / window.innerWidth) * 22));
      if (headRef.current) headRef.current.style.transform = `rotate(${tilt}deg)`;
    }

    window.addEventListener('mousemove', handleMove);
    return () => window.removeEventListener('mousemove', handleMove);
  }, []);

  useEffect(() => {
    const t = setTimeout(() => {
      setShowTip(true);
      setTimeout(() => setShowTip(false), 2800);
    }, 1200);
    return () => clearTimeout(t);
  }, []);

  function handleClick() {
    setTipIndex((i) => (i + 1) % TIPS.length);
    setShowTip(true);
    setTimeout(() => setShowTip(false), 2600);
  }

  return (
    <div
      className="robot-buddy"
      style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
      onClick={handleClick}
      role="button"
      aria-label="Byte, the NeuroCity assistant"
    >
      <div className={`robot-bubble ${showTip ? 'visible' : ''}`}>{TIPS[tipIndex]}</div>
      <div className="robot-stage" ref={stageRef}>
        <div className="robot-shadow" />
        <svg viewBox="0 0 160 190" className="robot-svg">
          <ellipse cx="122" cy="118" rx="9" ry="15" fill="#E8F6FD" stroke="#0B1340" strokeWidth="2.5" className="arm-r" />
          <ellipse cx="38" cy="118" rx="9" ry="15" fill="#E8F6FD" stroke="#0B1340" strokeWidth="2.5" className="arm-l" />
          <rect x="46" y="98" width="68" height="70" rx="26" fill="#FFFFFF" stroke="#0B1340" strokeWidth="3" />
          <circle cx="80" cy="122" r="6" fill="#10B981" className="antenna-glow" />
          <g ref={headRef} className="robot-head">
            <line x1="80" y1="30" x2="80" y2="14" stroke="#0B1340" strokeWidth="3" strokeLinecap="round" />
            <circle cx="80" cy="11" r="5" fill="#22D3EE" className="antenna-glow" />
            <rect x="30" y="30" width="100" height="86" rx="40" fill="#FFFFFF" stroke="#0B1340" strokeWidth="3.5" />
            <rect x="46" y="52" width="68" height="40" rx="18" fill="#0B1340" />
            <circle cx="65" cy="72" r="17" fill="#0B1340" />
            <circle cx="95" cy="72" r="17" fill="#0B1340" />
            <circle ref={pupilLRef} cx="65" cy="72" r="6.5" fill="#22D3EE" />
            <circle ref={pupilRRef} cx="95" cy="72" r="6.5" fill="#22D3EE" />
            <ellipse cx="47" cy="95" rx="6" ry="3.5" fill="#38BDF8" opacity="0.55" />
            <ellipse cx="113" cy="95" rx="6" ry="3.5" fill="#38BDF8" opacity="0.55" />
          </g>
        </svg>
      </div>
    </div>
  );
}

/* ==========================================
   11. MAIN GLOBAL HUB COMPONENT
   Accepts onNavigate(tabId) from App.jsx so the
   preview widgets on this page can open the real
   Traffic Eye / Energy Sentinel / Citizen Desk
   modules instead of just simulating them here.
   ========================================== */
export default function GlobalHub({ onNavigate }) {
  useScrollReveal();

  return (
    <div className="nc-root min-h-screen text-slate-900 font-sans relative selection:bg-cyan-500 selection:text-white">
      <GlobalNetworkCanvas />
      <RobotMascot />

      <Hero onNavigate={onNavigate} />
      <SectorsSection />
      <StatsSection />
      <EmergencyCorridorSection onNavigate={onNavigate} />
      <ClimateKnobsSection onNavigate={onNavigate} />
      <CitizenHeatmapSection onNavigate={onNavigate} />
      <SmartTransitSection />
      <SmartAQISection />
      <ConsoleSection />
      <ModulesSection onNavigate={onNavigate} />
      <TestimonialsSection />
      <FAQSection />
      <CTASection onNavigate={onNavigate} />
      <FooterSection />
    </div>
  );
}