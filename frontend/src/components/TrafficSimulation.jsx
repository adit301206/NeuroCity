import React, { useState, useEffect } from 'react';
import { Camera, Cpu, Zap, ShieldAlert, AlertTriangle, Play, RefreshCw } from 'lucide-react';

export default function TrafficSimulation() {
  // Preset scenarios matching the specifications
  const presets = {
    majuraGate: [
      {
        laneId: 'Lane A',
        laneName: 'North Approach',
        camId: 'CAM_NODE_MJ_01',
        image: 'https://images.unsplash.com/photo-1542362567-b07eac790931?auto=format&fit=crop&w=600&q=80',
        cars: 12,
        rickshaws: 5,
        trucks: 1,
        ambulances: 0
      },
      {
        laneId: 'Lane B',
        laneName: 'South Approach',
        camId: 'CAM_NODE_MJ_02',
        image: 'https://images.unsplash.com/photo-1494783367193-149034c05e8f?auto=format&fit=crop&w=600&q=80',
        cars: 22,
        rickshaws: 8,
        trucks: 3,
        ambulances: 0
      },
      {
        laneId: 'Lane C',
        laneName: 'East Approach',
        camId: 'CAM_NODE_MJ_03',
        image: 'https://images.unsplash.com/photo-1506015391300-4802dc74de2e?auto=format&fit=crop&w=600&q=80',
        cars: 6,
        rickshaws: 2,
        trucks: 0,
        ambulances: 0
      },
      {
        laneId: 'Lane D',
        laneName: 'West Approach',
        camId: 'CAM_NODE_MJ_04',
        image: 'https://images.unsplash.com/photo-1568605114967-8130f3a36994?auto=format&fit=crop&w=600&q=80',
        cars: 4,
        rickshaws: 1,
        trucks: 0,
        ambulances: 0
      }
    ],
    ringRoad: [
      {
        laneId: 'Lane A',
        laneName: 'North Approach',
        camId: 'CAM_NODE_RR_01',
        image: 'https://images.unsplash.com/photo-1494783367193-149034c05e8f?auto=format&fit=crop&w=600&q=80',
        cars: 15,
        rickshaws: 4,
        trucks: 2,
        ambulances: 1
      },
      {
        laneId: 'Lane B',
        laneName: 'South Approach',
        camId: 'CAM_NODE_RR_02',
        image: 'https://images.unsplash.com/photo-1542362567-b07eac790931?auto=format&fit=crop&w=600&q=80',
        cars: 9,
        rickshaws: 3,
        trucks: 1,
        ambulances: 0
      },
      {
        laneId: 'Lane C',
        laneName: 'East Approach',
        camId: 'CAM_NODE_RR_03',
        image: 'https://images.unsplash.com/photo-1568605114967-8130f3a36994?auto=format&fit=crop&w=600&q=80',
        cars: 8,
        rickshaws: 3,
        trucks: 1,
        ambulances: 0
      },
      {
        laneId: 'Lane D',
        laneName: 'West Approach',
        camId: 'CAM_NODE_RR_04',
        image: 'https://images.unsplash.com/photo-1506015391300-4802dc74de2e?auto=format&fit=crop&w=600&q=80',
        cars: 10,
        rickshaws: 2,
        trucks: 0,
        ambulances: 0
      }
    ],
    varachhaCrossroad: [
      {
        laneId: 'Lane A',
        laneName: 'North Approach',
        camId: 'CAM_NODE_VC_01',
        image: 'https://images.unsplash.com/photo-1506015391300-4802dc74de2e?auto=format&fit=crop&w=600&q=80',
        cars: 5,
        rickshaws: 2,
        trucks: 0,
        ambulances: 0
      },
      {
        laneId: 'Lane B',
        laneName: 'South Approach',
        camId: 'CAM_NODE_VC_02',
        image: 'https://images.unsplash.com/photo-1568605114967-8130f3a36994?auto=format&fit=crop&w=600&q=80',
        cars: 14,
        rickshaws: 4,
        trucks: 1,
        ambulances: 0
      },
      {
        laneId: 'Lane C',
        laneName: 'East Approach',
        camId: 'CAM_NODE_VC_03',
        image: 'https://images.unsplash.com/photo-1542362567-b07eac790931?auto=format&fit=crop&w=600&q=80',
        cars: 28,
        rickshaws: 11,
        trucks: 4,
        ambulances: 0
      },
      {
        laneId: 'Lane D',
        laneName: 'West Approach',
        camId: 'CAM_NODE_VC_04',
        image: 'https://images.unsplash.com/photo-1494783367193-149034c05e8f?auto=format&fit=crop&w=600&q=80',
        cars: 8,
        rickshaws: 3,
        trucks: 0,
        ambulances: 0
      }
    ]
  };

  // State initialization
  const [activePreset, setActivePreset] = useState('majuraGate');
  const [lanes, setLanes] = useState(presets.majuraGate);
  const [activeGreenLane, setActiveGreenLane] = useState('Lane B');
  const [countdown, setCountdown] = useState(45);
  const [isLoading, setIsLoading] = useState(false);

  // Auto countdown clock effect
  useEffect(() => {
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          // Cycle to the next lane dynamically
          const currentIdx = lanes.findIndex((l) => l.laneId === activeGreenLane);
          const nextIdx = (currentIdx + 1) % lanes.length;
          setActiveGreenLane(lanes[nextIdx].laneId);
          return 30 + Math.floor(Math.random() * 15); // standard dynamic timer reset
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [activeGreenLane, lanes]);

  // Load a designated preset location
  const handleLoadPreset = (key) => {
    setActivePreset(key);
    const presetData = presets[key];
    setLanes(presetData);
    
    // Automatically trigger decision intelligence for this preset
    evaluateAIPhaseDecision(presetData);
  };

  // Core decision logic representing the AI inference engine
  const evaluateAIPhaseDecision = (currentLanes) => {
    // 1. Check for Emergency Override (any ambulance > 0)
    const emergencyLane = currentLanes.find((l) => l.ambulances > 0);
    if (emergencyLane) {
      setActiveGreenLane(emergencyLane.laneId);
      setCountdown(0); // Trigger override status
      return;
    }

    // 2. Identify lane with the highest traffic load (Cars + Rickshaws + Trucks)
    let maxWeight = -1;
    let chosenLane = 'Lane A';
    currentLanes.forEach((l) => {
      const weight = l.cars + l.rickshaws + l.trucks;
      if (weight > maxWeight) {
        maxWeight = weight;
        chosenLane = l.laneId;
      }
    });

    setActiveGreenLane(chosenLane);
    setCountdown(30 + Math.floor(Math.random() * 20)); // Calculated green light timing based on density
  };

  // Generate completely random data simulation
  const handleRandomAIInference = () => {
    setIsLoading(true);
    
    setTimeout(() => {
      const hasAmbulance = Math.random() > 0.70; // 30% chance of emergency scenario
      const ambulanceLaneIndex = hasAmbulance ? Math.floor(Math.random() * 4) : -1;

      const randomImages = [
        'https://images.unsplash.com/photo-1542362567-b07eac790931?auto=format&fit=crop&w=600&q=80',
        'https://images.unsplash.com/photo-1494783367193-149034c05e8f?auto=format&fit=crop&w=600&q=80',
        'https://images.unsplash.com/photo-1506015391300-4802dc74de2e?auto=format&fit=crop&w=600&q=80',
        'https://images.unsplash.com/photo-1568605114967-8130f3a36994?auto=format&fit=crop&w=600&q=80'
      ];

      const randomizedLanes = ['Lane A', 'Lane B', 'Lane C', 'Lane D'].map((id, index) => {
        const laneNames = ['North Approach', 'South Approach', 'East Approach', 'West Approach'];
        return {
          laneId: id,
          laneName: laneNames[index],
          camId: `CAM_NODE_RAND_${index + 1}`,
          image: randomImages[Math.floor(Math.random() * randomImages.length)],
          cars: Math.floor(Math.random() * 20) + 2,
          rickshaws: Math.floor(Math.random() * 10) + 1,
          trucks: Math.floor(Math.random() * 6),
          ambulances: index === ambulanceLaneIndex ? 1 : 0
        };
      });

      setLanes(randomizedLanes);
      setActivePreset('custom_random');
      evaluateAIPhaseDecision(randomizedLanes);
      setIsLoading(false);
    }, 800);
  };

  // Determine if emergency override is active globally
  const activeEmergencyLaneObj = lanes.find((l) => l.ambulances > 0);
  const isEmergencyOverrideActive = !!activeEmergencyLaneObj;

  // Total weight values for summary metrics
  const activeGreenLaneObj = lanes.find((l) => l.laneId === activeGreenLane);
  const totalVehiclesActiveGreen = activeGreenLaneObj 
    ? activeGreenLaneObj.cars + activeGreenLaneObj.rickshaws + activeGreenLaneObj.trucks + activeGreenLaneObj.ambulances 
    : 0;

  return (
    <div className={`w-full min-h-screen p-6 bg-[#FFFFFF] transition-all duration-700 relative ${
      isEmergencyOverrideActive 
        ? 'shadow-[inset_0_0_60px_rgba(220,38,38,0.25)] border border-red-500/30 animate-[pulse_2.5s_ease-in-out_infinite]' 
        : ''
    }`}>
      {/* Container Deck styled with Light Ice-Cyan Glassmorphism */}
      <div className="max-w-7xl mx-auto bg-[#CAF0F8]/40 backdrop-blur-xl border border-white/80 shadow-xl rounded-3xl p-6">
        
        {/* CONTROL DECK HEADER */}
        <header className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 pb-6 border-b border-[#03045E]/10 mb-8">
          <div>
            <h1 className="text-2xl font-extrabold text-[#03045E] tracking-tight uppercase flex items-center gap-2">
              <Cpu className="h-6 w-6 text-[#00B4D8] animate-pulse" />
              NEUROCITY // ADAPTIVE TRAFFIC SIGNAL CONTROLLER
            </h1>
            <p className="text-slate-500 text-xs font-mono mt-1">
              MULTIPLEXED AI SCENARIO MATRIX // SIGNAL CYCLE INTELLIGENCE
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Location Preset Selector */}
            <div className="flex bg-[#CAF0F8] p-1 rounded-xl border border-[#00B4D8]/20 shadow-inner">
              <button
                type="button"
                onClick={() => handleLoadPreset('majuraGate')}
                className={`px-3 py-1.5 text-xs font-mono font-bold rounded-lg transition-all ${
                  activePreset === 'majuraGate'
                    ? 'bg-[#023E8A] text-white shadow'
                    : 'text-[#03045E] hover:bg-[#90E0EF]/50'
                }`}
              >
                📷 Majura Gate
              </button>
              <button
                type="button"
                onClick={() => handleLoadPreset('ringRoad')}
                className={`px-3 py-1.5 text-xs font-mono font-bold rounded-lg transition-all ${
                  activePreset === 'ringRoad'
                    ? 'bg-[#023E8A] text-white shadow'
                    : 'text-[#03045E] hover:bg-[#90E0EF]/50'
                }`}
              >
                📷 Ring Road
              </button>
              <button
                type="button"
                onClick={() => handleLoadPreset('varachhaCrossroad')}
                className={`px-3 py-1.5 text-xs font-mono font-bold rounded-lg transition-all ${
                  activePreset === 'varachhaCrossroad'
                    ? 'bg-[#023E8A] text-white shadow'
                    : 'text-[#03045E] hover:bg-[#90E0EF]/50'
                }`}
              >
                📷 Varachha Crossroad
              </button>
            </div>

            {/* AI Inference Trigger Button */}
            <button
              type="button"
              disabled={isLoading}
              onClick={handleRandomAIInference}
              className="px-5 py-2 text-xs font-mono font-extrabold bg-[#03045E] hover:bg-[#023E8A] border border-[#00B4D8] text-white rounded-xl shadow-md hover:shadow-lg transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin text-[#48CAE4]" />
                  COMPUTING INFERENCE...
                </>
              ) : (
                <>
                  <Zap className="h-4 w-4 text-[#00B4D8]" />
                  RUN RANDOM AI INFERENCE FRAME
                </>
              )}
            </button>
          </div>
        </header>

        {/* CENTRAL 4-LANE INTERSECTION MATRIX */}
        <main className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {lanes.map((lane) => {
            const isGreenActive = activeGreenLane === lane.laneId;
            const laneTotal = lane.cars + lane.rickshaws + lane.trucks + lane.ambulances;

            return (
              <section
                key={lane.laneId}
                className="bg-[#023E8A] border border-[#00B4D8]/20 shadow-xl rounded-2xl p-5 flex flex-col justify-between text-[#CAF0F8] transition-all hover:scale-[1.01] hover:shadow-2xl relative"
              >
                {/* Emergency highlight indicator within lane card */}
                {lane.ambulances > 0 && (
                  <div className="absolute inset-0 border-2 border-red-500 rounded-2xl animate-pulse pointer-events-none z-10" />
                )}

                {/* Header row containing titles */}
                <div className="flex justify-between items-center mb-3 border-b border-[#00B4D8]/20 pb-2">
                  <div>
                    <h2 className="font-mono text-xs font-bold text-[#48CAE4]">
                      {lane.laneId} // {lane.laneName}
                    </h2>
                    <span className="text-[9px] font-mono text-slate-300 block">
                      [{lane.camId}]
                    </span>
                  </div>
                  {lane.ambulances > 0 && (
                    <span className="bg-red-600/80 border border-red-500 text-white font-mono text-[8px] font-bold px-1.5 py-0.5 rounded animate-bounce">
                      AMBULANCE INB
                    </span>
                  )}
                </div>

                {/* Image Frame Preview */}
                <div className="relative h-36 w-full rounded-xl overflow-hidden mb-4 border border-[#00B4D8]/30">
                  <img
                    src={lane.image}
                    alt={`${lane.laneName} camera feed`}
                    className="h-full w-full object-cover transition-all hover:scale-105"
                  />
                  {/* Glassmorphic Live Indicator */}
                  <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-md px-2 py-0.5 rounded-full flex items-center gap-1.5 border border-white/10">
                    <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-ping" />
                    <span className="text-[8px] font-mono font-bold tracking-widest text-[#CAF0F8]">FEED_LIVE</span>
                  </div>
                  <div className="absolute bottom-2 right-2 bg-black/60 text-[8px] font-mono text-[#48CAE4] px-1.5 py-0.5 rounded">
                    Q-LOAD: {laneTotal}
                  </div>
                </div>

                {/* Vehicle Breakdown List */}
                <div className="space-y-2 mb-4 bg-black/20 p-2.5 rounded-xl border border-[#00B4D8]/10 text-xs font-mono">
                  <div className="flex justify-between">
                    <span className="text-slate-300">CARS:</span>
                    <span className="font-extrabold text-[#48CAE4]">{String(lane.cars).padStart(2, '0')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-300">RICKSHAWS:</span>
                    <span className="font-extrabold text-[#48CAE4]">{String(lane.rickshaws).padStart(2, '0')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-300">TRUCKS:</span>
                    <span className="font-extrabold text-[#48CAE4]">{String(lane.trucks).padStart(2, '0')}</span>
                  </div>
                  <div className={`flex justify-between ${lane.ambulances > 0 ? 'text-red-400 font-bold' : ''}`}>
                    <span className={lane.ambulances > 0 ? 'text-red-400' : 'text-slate-300'}>AMBULANCES:</span>
                    <span>{String(lane.ambulances).padStart(2, '0')}</span>
                  </div>
                </div>

                {/* Traffic Light Widget & Timer */}
                <div className="flex items-center justify-between border-t border-[#00B4D8]/20 pt-3">
                  {/* Traffic Light Widget */}
                  <div className="bg-[#03045E] p-1.5 rounded-lg border border-[#00B4D8]/30 flex gap-2 items-center">
                    {/* RED light */}
                    <div
                      className={`h-4.5 w-4.5 rounded-full transition-all duration-300 ${
                        !isGreenActive
                          ? 'bg-red-500 shadow-[0_0_15px_#ef4444]'
                          : 'bg-red-950/80'
                      }`}
                    />
                    {/* GREEN light */}
                    <div
                      className={`h-4.5 w-4.5 rounded-full transition-all duration-300 ${
                        isGreenActive
                          ? 'bg-green-500 shadow-[0_0_15px_#22c55e]'
                          : 'bg-green-950/80'
                      }`}
                    />
                  </div>

                  {/* Countdown Timer */}
                  <div className="text-right">
                    <span className="text-[9px] font-mono text-[#00B4D8] block">TIMER COUNT</span>
                    <span className={`font-mono text-sm font-bold ${
                      isGreenActive 
                        ? 'text-green-400 font-extrabold' 
                        : 'text-red-400'
                    }`}>
                      {isEmergencyOverrideActive && isGreenActive
                        ? 'OVERRIDE'
                        : isGreenActive
                          ? `${countdown}s REMAINING`
                          : 'STANDBY'}
                    </span>
                  </div>
                </div>
              </section>
            );
          })}
        </main>

        {/* AI SIGNAL DECISION & OVERRIDE SUMMARY BANNER */}
        <footer className="mt-8">
          {isEmergencyOverrideActive ? (
            /* Emergency override banner */
            <div className="relative bg-gradient-to-r from-red-950/40 via-red-900/20 to-transparent backdrop-blur-lg border-l-4 border-red-500 border-y border-r border-red-500/30 rounded-r-xl p-5 shadow-lg flex items-start gap-4 overflow-hidden">
              {/* Corner Cybernetic Ticks */}
              <span className="absolute top-1 left-2.5 text-red-500/50 font-mono text-[9px] select-none">┌</span>
              <span className="absolute top-1 right-2 text-red-500/50 font-mono text-[9px] select-none">┐</span>
              <span className="absolute bottom-1 left-2.5 text-red-500/50 font-mono text-[9px] select-none">└</span>
              <span className="absolute bottom-1 right-2 text-red-500/50 font-mono text-[9px] select-none">┘</span>

              <div className="relative flex h-5 w-5 items-center justify-center flex-shrink-0 mt-0.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75"></span>
                <span className="absolute inline-flex rounded-full h-4 w-4 bg-red-600/40"></span>
                <ShieldAlert className="h-4 w-4 text-red-200" />
              </div>

              <div className="flex-1 font-mono">
                <h3 className="text-red-400 font-bold tracking-widest text-xs uppercase flex items-center gap-1.5">
                  [ 🚨 EMERGENCY PRIORITY SIGNAL OVERRIDE ACTIVATED ]
                </h3>
                <p className="text-[11px] text-red-200/90 mt-1 leading-relaxed">
                  🚨 EMERGENCY GREEN-WAVE ACTIVATED FOR{' '}
                  <strong className="text-white underline">
                    {activeEmergencyLaneObj.laneId} ({activeEmergencyLaneObj.laneName})
                  </strong>{' '}
                  // CLEARING AMBULANCE ROUTE // DETECTED {activeEmergencyLaneObj.ambulances} AMBULANCE UNIT // SIGNAL CYCLE SUSPENDED FOR EMERGENCY CLEARANCE ROUTE
                </p>
              </div>
            </div>
          ) : (
            /* Standard adaptive signal calculation banner */
            <div className="bg-[#023E8A] border border-[#00B4D8]/30 rounded-2xl p-5 text-[#CAF0F8] flex items-start gap-4 shadow-lg">
              <Cpu className="h-5 w-5 text-[#00B4D8] flex-shrink-0 mt-0.5 animate-pulse" />
              <div className="flex-1 font-mono">
                <h3 className="text-[#48CAE4] font-bold text-xs tracking-wider uppercase mb-1">
                  [ AI SYSTEM OPERATION STREAM // DECENTRALIZED JUNCTION CALC ]
                </h3>
                <p className="text-[11px] text-[#CAF0F8] leading-relaxed">
                  <span className="font-bold text-[#00B4D8]">PRIORITY PHASE:</span>{' '}
                  {activeGreenLaneObj?.laneId} GREEN ({activeGreenLaneObj?.laneName} - Traffic Density:{' '}
                  {totalVehiclesActiveGreen} vehicles) //{' '}
                  <span className="font-bold text-[#00B4D8]">TIMING CALC:</span> {countdown}s REMAINING FOR CYCLE
                </p>
              </div>
            </div>
          )}
        </footer>

      </div>
    </div>
  );
}
