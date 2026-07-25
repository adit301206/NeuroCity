import React, { useState, useEffect, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Edges } from '@react-three/drei';
import * as THREE from 'three';
import { 
  Activity, 
  ArrowLeft, 
  AlertTriangle, 
  ShieldAlert, 
  Gauge, 
  Zap, 
  Terminal,
  Cpu,
  Tv
} from 'lucide-react';

// Signal Pole 3D Component with glowing Red (#EF4444) and Green (#10B981) bulb lenses
function SignalPole({ position, isGreen, rotationY = 0 }) {
  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      {/* Vertical metal pole */}
      <mesh position={[0, 1.5, 0]}>
        <cylinderGeometry args={[0.07, 0.09, 3, 12]} />
        <meshStandardMaterial color="#64748B" metalness={0.9} roughness={0.15} />
      </mesh>
      {/* Horizontal metal arm */}
      <mesh position={[0.4, 2.8, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.05, 0.05, 0.8, 12]} />
        <meshStandardMaterial color="#64748B" metalness={0.9} roughness={0.15} />
      </mesh>
      {/* Signal box container */}
      <mesh position={[0.8, 2.8, 0]}>
        <boxGeometry args={[0.3, 0.8, 0.3]} />
        <meshStandardMaterial color="#0F172A" metalness={0.5} roughness={0.4} />
      </mesh>
      {/* RED bulb lens (#EF4444) */}
      <mesh position={[0.8, 3.0, 0.16]}>
        <sphereGeometry args={[0.08, 16, 16]} />
        <meshStandardMaterial
          color={!isGreen ? '#EF4444' : '#3d050d'}
          emissive={!isGreen ? '#EF4444' : '#1a0205'}
          emissiveIntensity={!isGreen ? 3.5 : 0.15}
        />
      </mesh>
      {/* GREEN bulb lens (#10B981) */}
      <mesh position={[0.8, 2.6, 0.16]}>
        <sphereGeometry args={[0.08, 16, 16]} />
        <meshStandardMaterial
          color={isGreen ? '#10B981' : '#033a18'}
          emissive={isGreen ? '#10B981' : '#011a08'}
          emissiveIntensity={isGreen ? 3.5 : 0.15}
        />
      </mesh>
      {/* Dynamic lens bulb spot glow */}
      {isGreen ? (
        <pointLight position={[0.8, 2.6, 0.4]} color="#10B981" intensity={2.5} distance={6} decay={2} />
      ) : (
        <pointLight position={[0.8, 3.0, 0.4]} color="#EF4444" intensity={2.5} distance={6} decay={2} />
      )}
    </group>
  );
}

// Dynamic 3D model for cars, buses, and ambulances
function Vehicle3DModel({ car, sirenActiveRef }) {
  const meshRef = useRef();

  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.position.set(car.x, 0.1, car.z);
    }
  });

  const isHorizontal = car.lane === 'EAST' || car.lane === 'WEST';
  let chassisSize, cabinSize, cabinOffset, headlightOffset1, headlightOffset2;

  if (!isHorizontal) {
    const isNorth = car.lane === 'NORTH';
    const directionZ = isNorth ? 1 : -1;

    if (car.type === 'CAR') {
      chassisSize = [0.5, 0.2, 1.0];
      cabinSize = [0.4, 0.16, 0.65];
      cabinOffset = [0, 0.18, -0.05];
      headlightOffset1 = [-0.18, 0.05, 0.48 * directionZ];
      headlightOffset2 = [0.18, 0.05, 0.48 * directionZ];
    } else if (car.type === 'BUS') {
      chassisSize = [0.6, 0.38, 1.9];
      cabinSize = [0.54, 0.2, 1.5];
      cabinOffset = [0, 0.29, 0];
      headlightOffset1 = [-0.22, 0.1, 0.93 * directionZ];
      headlightOffset2 = [0.22, 0.1, 0.93 * directionZ];
    } else {
      // AMBULANCE
      chassisSize = [0.52, 0.26, 1.25];
      cabinSize = [0.46, 0.22, 0.85];
      cabinOffset = [0, 0.24, -0.1];
      headlightOffset1 = [-0.19, 0.06, 0.60 * directionZ];
      headlightOffset2 = [0.19, 0.06, 0.60 * directionZ];
    }
  } else {
    const isWest = car.lane === 'WEST';
    const directionX = isWest ? 1 : -1;

    if (car.type === 'CAR') {
      chassisSize = [1.0, 0.2, 0.5];
      cabinSize = [0.65, 0.16, 0.4];
      cabinOffset = [-0.05, 0.18, 0];
      headlightOffset1 = [0.48 * directionX, 0.05, -0.18];
      headlightOffset2 = [0.48 * directionX, 0.05, 0.18];
    } else if (car.type === 'BUS') {
      chassisSize = [1.9, 0.38, 0.6];
      cabinSize = [1.5, 0.2, 0.54];
      cabinOffset = [0, 0.29, 0];
      headlightOffset1 = [0.93 * directionX, 0.1, -0.22];
      headlightOffset2 = [0.93 * directionX, 0.1, 0.22];
    } else {
      // AMBULANCE
      chassisSize = [1.25, 0.26, 0.52];
      cabinSize = [0.85, 0.22, 0.46];
      cabinOffset = [-0.1, 0.24, 0];
      headlightOffset1 = [0.60 * directionX, 0.06, -0.19];
      headlightOffset2 = [0.60 * directionX, 0.06, 0.19];
    }
  }

  const sirenColor = sirenActiveRef.current ? '#EF4444' : '#45050a';

  return (
    <group ref={meshRef}>
      {/* 1. Vehicle Lower Chassis */}
      <mesh position={[0, chassisSize[1] / 2, 0]}>
        <boxGeometry args={chassisSize} />
        <meshStandardMaterial color={car.color} roughness={0.2} metalness={0.7} />
        <Edges threshold={15} color="#00B4D8" width={0.4} />
      </mesh>

      {/* 2. Cabin Roof Box */}
      <mesh position={[cabinOffset[0], (chassisSize[1] + cabinSize[1] / 2) + cabinOffset[1] - 0.15, cabinOffset[2]]}>
        <boxGeometry args={cabinSize} />
        <meshStandardMaterial color="#0A192F" roughness={0.15} metalness={0.8} />
        <Edges threshold={15} color="#CAF0F8" width={0.4} />
      </mesh>

      {/* 3. Luminous Cyan Headlights (#48CAE4) */}
      <mesh position={headlightOffset1}>
        <sphereGeometry args={[0.05, 8, 8]} />
        <meshBasicMaterial color="#48CAE4" />
      </mesh>
      <mesh position={headlightOffset2}>
        <sphereGeometry args={[0.05, 8, 8]} />
        <meshBasicMaterial color="#48CAE4" />
      </mesh>

      {/* 4. Siren beacon for Ambulance */}
      {car.type === 'AMBULANCE' && (
        <group>
          <mesh position={[cabinOffset[0], chassisSize[1] + cabinSize[1] + 0.12, cabinOffset[2]]}>
            <sphereGeometry args={[0.08, 8, 8]} />
            <meshStandardMaterial 
              color={sirenColor} 
              emissive={sirenColor} 
              emissiveIntensity={sirenActiveRef.current ? 4.0 : 0.15} 
            />
          </mesh>
          {sirenActiveRef.current && (
            <pointLight 
              position={[cabinOffset[0], chassisSize[1] + cabinSize[1] + 0.2, cabinOffset[2]]} 
              color="#EF4444" 
              intensity={2.5} 
              distance={4} 
              decay={2} 
            />
          )}
        </group>
      )}
    </group>
  );
}

// 3D Vehicles Manager & Simulation Logic inside useFrame
function Vehicles({ isNorthGreen, isSouthGreen, isEastGreen, isWestGreen }) {
  const carsRef = useRef([
    // North lane: x = -0.8, moves +z. Colors: White, Ice Tint, Cyan
    { id: 'n1', lane: 'NORTH', type: 'CAR', x: -0.8, y: 0, z: -18, speed: 4.5, color: '#48CAE4', stopOffset: -4.0 },
    { id: 'n2', lane: 'NORTH', type: 'BUS', x: -0.8, y: 0, z: -10, speed: 3.8, color: '#CAF0F8', stopOffset: -2.0 },
    { id: 'n3', lane: 'NORTH', type: 'AMBULANCE', x: -0.8, y: 0, z: -3, speed: 5.5, color: '#FFFFFF', stopOffset: 0 },

    // South lane: x = 0.8, moves -z
    { id: 's1', lane: 'SOUTH', type: 'CAR', x: 0.8, y: 0, z: 18, speed: 4.8, color: '#FFFFFF', stopOffset: 4.0 },
    { id: 's2', lane: 'SOUTH', type: 'BUS', x: 0.8, y: 0, z: 11, speed: 3.9, color: '#48CAE4', stopOffset: 2.0 },
    { id: 's3', lane: 'SOUTH', type: 'CAR', x: 0.8, y: 0, z: 4, speed: 4.6, color: '#CAF0F8', stopOffset: 0 },

    // East lane: z = -0.8, moves -x
    { id: 'e1', lane: 'EAST', type: 'CAR', x: 18, y: 0, z: -0.8, speed: 4.7, color: '#CAF0F8', stopOffset: 4.0 },
    { id: 'e2', lane: 'EAST', type: 'BUS', x: 11, y: 0, z: -0.8, speed: 3.7, color: '#FFFFFF', stopOffset: 2.0 },
    { id: 'e3', lane: 'EAST', type: 'AMBULANCE', x: 4, y: 0, z: -0.8, speed: 5.6, color: '#48CAE4', stopOffset: 0 },

    // West lane: z = 0.8, moves +x
    { id: 'w1', lane: 'WEST', type: 'CAR', x: -18, y: 0, z: 0.8, speed: 4.9, color: '#FFFFFF', stopOffset: -4.0 },
    { id: 'w2', lane: 'WEST', type: 'BUS', x: -11, y: 0, z: 0.8, speed: 4.0, color: '#CAF0F8', stopOffset: -2.0 },
    { id: 'w3', lane: 'WEST', type: 'CAR', x: -4, y: 0, z: 0.8, speed: 4.4, color: '#48CAE4', stopOffset: 0 },
  ]);

  const sirenActiveRef = useRef(false);

  useFrame((state, delta) => {
    const d = Math.min(delta, 0.1);
    
    // Siren blinking cycle
    sirenActiveRef.current = Math.sin(state.clock.getElapsedTime() * 15) > 0;

    carsRef.current.forEach((car) => {
      let speed = car.speed;

      if (car.lane === 'NORTH') {
        const stopZ = -3.5 + car.stopOffset;
        if (!isNorthGreen && car.z < stopZ) {
          const dist = stopZ - car.z;
          if (dist < 4) {
            speed = Math.max(0, car.speed * (dist / 4));
          }
        }
        car.z += speed * d;
        if (car.z > 22) car.z = -22;
      } else if (car.lane === 'SOUTH') {
        const stopZ = 3.5 + car.stopOffset;
        if (!isSouthGreen && car.z > stopZ) {
          const dist = car.z - stopZ;
          if (dist < 4) {
            speed = Math.max(0, car.speed * (dist / 4));
          }
        }
        car.z -= speed * d;
        if (car.z < -22) car.z = 22;
      } else if (car.lane === 'EAST') {
        const stopX = 3.5 + car.stopOffset;
        if (!isEastGreen && car.x > stopX) {
          const dist = car.x - stopX;
          if (dist < 4) {
            speed = Math.max(0, car.speed * (dist / 4));
          }
        }
        car.x -= speed * d;
        if (car.x < -22) car.x = 22;
      } else if (car.lane === 'WEST') {
        const stopX = -3.5 + car.stopOffset;
        if (!isWestGreen && car.x < stopX) {
          const dist = stopX - car.x;
          if (dist < 4) {
            speed = Math.max(0, car.speed * (dist / 4));
          }
        }
        car.x += speed * d;
        if (car.x > 22) car.x = -22;
      }
    });
  });

  return (
    <group>
      {carsRef.current.map((car) => (
        <Vehicle3Model key={car.id} car={car} sirenActiveRef={sirenActiveRef} />
      ))}
    </group>
  );
}

// Fixed reference name
const Vehicle3Model = Vehicle3DModel;

export default function TrafficSimulation({ onBackToAnalyzer }) {
  // Simulation phase controller states
  const [phaseState, setPhaseState] = useState('NS_GREEN'); 
  const [emergencyOverride, setEmergencyOverride] = useState(null); 
  const [countdown, setCountdown] = useState(14); 

  // Simulation timer sequence
  useEffect(() => {
    const timer = setInterval(() => {
      if (emergencyOverride) return;
      setCountdown((prev) => {
        if (prev <= 1) {
          setPhaseState((p) => (p === 'NS_GREEN' ? 'EW_GREEN' : 'NS_GREEN'));
          return 15; 
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [emergencyOverride]);

  const handleToggleEmergency = (direction) => {
    if (emergencyOverride === direction) {
      setEmergencyOverride(null);
      setCountdown(15);
    } else {
      setEmergencyOverride(direction);
      if (direction === 'NORTH' || direction === 'SOUTH') {
        setPhaseState('NS_GREEN');
      } else {
        setPhaseState('EW_GREEN');
      }
    }
  };

  const isNorthGreen = emergencyOverride ? emergencyOverride === 'NORTH' : phaseState === 'NS_GREEN';
  const isSouthGreen = emergencyOverride ? emergencyOverride === 'SOUTH' : phaseState === 'NS_GREEN';
  const isEastGreen = emergencyOverride ? emergencyOverride === 'EAST' : phaseState === 'EW_GREEN';
  const isWestGreen = emergencyOverride ? emergencyOverride === 'WEST' : phaseState === 'EW_GREEN';

  // Crosswalk positions helper
  const crosswalkPositions = [-1.2, -0.6, 0, 0.6, 1.2];

  return (
    <div className={`w-full min-h-screen bg-[#030712] text-[#CAF0F8] p-6 transition-all duration-700 relative overflow-hidden select-none ${
      emergencyOverride ? 'shadow-[inset_0_0_100px_rgba(239,68,68,0.25)] border border-red-500/20' : ''
    }`}>
      {/* Injected CSS Animations */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes scanline {
          0% { top: 0%; opacity: 0.15; }
          50% { opacity: 0.75; }
          100% { top: 100%; opacity: 0.15; }
        }
        .animate-scanline {
          animation: scanline 5s linear infinite;
        }
        @keyframes pulse-red-border {
          0%, 100% { border-color: rgba(239, 68, 68, 0.2); box-shadow: 0 0 15px rgba(239, 68, 68, 0.05); }
          50% { border-color: rgba(239, 68, 68, 0.75); box-shadow: 0 0 30px rgba(239, 68, 68, 0.35); }
        }
        .animate-emergency-alert {
          animation: pulse-red-border 1.5s ease-in-out infinite;
        }
        @keyframes emergency-glow {
          0%, 100% { opacity: 0.05; }
          50% { opacity: 0.22; }
        }
        .animate-emergency-glow {
          animation: emergency-glow 1.2s ease-in-out infinite;
        }
      `}} />

      {/* Emergency Ambient Glow Overlay */}
      {emergencyOverride && (
        <div className="absolute inset-0 bg-red-600 animate-emergency-glow pointer-events-none z-0" />
      )}

      {/* Main Grid Wrapper */}
      <div className="max-w-7xl mx-auto relative z-10 space-y-6">
        
        {/* Terminal Header */}
        <header className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 pb-4 border-b border-[#00B4D8]/25">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Terminal className="h-6 w-6 text-[#00B4D8]" />
              <h1 className="text-xl font-extrabold tracking-widest text-[#00B4D8] uppercase">
                NEUROCITY // INTERACTION COMMAND CORE
              </h1>
            </div>
            <p className="text-[10px] font-mono text-slate-400">
              SECURE MULTIPLEXED WEBGL SIGNAL TERMINAL // REAL-TIME DECENTRALISED NODE
            </p>
          </div>

          <div>
            <button
              onClick={() => onBackToAnalyzer?.()}
              className="px-4 py-2 rounded-xl border font-mono font-extrabold text-[11px] tracking-wider transition-all duration-300 flex items-center gap-2 cursor-pointer bg-cyan-950/80 border-[#00B4D8]/30 hover:border-[#48CAE4] hover:bg-[#00B4D8]/10 text-cyan-300 shadow-[0_0_10px_rgba(0,180,216,0.1)] hover:shadow-[0_0_20px_rgba(0,180,216,0.2)]"
            >
              <ArrowLeft className="h-4 w-4" />
              ← RETURN TO MAIN COMMAND DECK
            </button>
          </div>
        </header>

        {/* Runtime grid columns */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Main 3D Canvas Box */}
          <div className="lg:col-span-2 space-y-4">
            <div className={`relative w-full h-[500px] border rounded-2xl overflow-hidden bg-[#020C24] shadow-inner transition-all duration-500 ${
              emergencyOverride 
                ? 'border-red-500/50 shadow-[inset_0_0_50px_rgba(239,68,68,0.2)]' 
                : 'border-[#00B4D8]/30 shadow-[inset_0_0_50px_rgba(0,180,216,0.15)]'
            }`}>
              
              {/* Scanline Sweep animation */}
              <div className={`absolute top-0 left-0 w-full h-[2.5px] shadow-lg pointer-events-none z-10 animate-scanline ${
                emergencyOverride ? 'bg-red-500 shadow-red-500' : 'bg-cyan-500 shadow-cyan-500'
              }`} />

              {/* Feed Status overlay */}
              <div className="absolute top-4 left-4 bg-[#0A192F]/80 backdrop-blur-md border border-[#00B4D8]/20 px-3 py-2 rounded-xl font-mono text-[10px] text-[#CAF0F8] space-y-1 shadow-lg pointer-events-none z-10 flex items-center gap-2">
                <Tv className={`h-4 w-4 ${emergencyOverride ? 'text-red-400' : 'text-cyan-400'}`} />
                <div>
                  <span className="text-slate-400 font-normal">SIMULATOR FEED:</span>{' '}
                  <span className={`font-extrabold ${emergencyOverride ? 'text-red-400 animate-pulse' : 'text-cyan-300'}`}>
                    {emergencyOverride ? '🚨 EMERGENCY_LOCKED' : 'CYCLIC_AUTO'}
                  </span>
                </div>
              </div>

              {/* Telemetry Badge */}
              <div className="absolute top-4 right-4 bg-[#0A192F]/85 backdrop-blur-md border border-[#00B4D8]/20 px-4 py-3 rounded-xl font-mono text-[11px] text-[#CAF0F8] space-y-1 shadow-lg pointer-events-none z-10">
                <div className="flex items-center gap-1.5 text-cyan-400 font-extrabold">
                  <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-ping" />
                  SYS STATE: {emergencyOverride ? 'OVERRIDE' : 'AUTO_SYNC'}
                </div>
                <div>PHASE: <span className="text-[#10B981] font-bold">{emergencyOverride ? `EMERGENCY_${emergencyOverride}` : phaseState}</span></div>
                <div>TIMER: {emergencyOverride ? 'LOCKED' : `${countdown}s`}</div>
                <div className="text-[10px] text-slate-400 flex items-center gap-1">
                  <Activity className="h-3 w-3 text-green-400 animate-pulse" />
                  WEBGL STATUS: <span className="text-green-400">60 FPS / ACTIVE</span>
                </div>
              </div>

              {/* Countdown timer overlay */}
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-[#0A192F]/80 backdrop-blur-xl border border-[#00B4D8]/30 px-6 py-3 rounded-full shadow-[0_4px_30px_rgba(0,180,216,0.15)] flex items-center gap-4 font-mono text-[#CAF0F8] z-10">
                <div className="text-[10px] text-[#00B4D8] font-bold tracking-widest uppercase">CYCLE TIMER</div>
                <div className="h-4 w-px bg-cyan-500/30" />
                <div className={`text-xl font-extrabold tracking-wider ${emergencyOverride ? 'text-red-500 animate-pulse' : 'text-cyan-300'}`}>
                  {emergencyOverride ? '🚨 --:--' : `00:${String(countdown).padStart(2, '0')}`}
                </div>
              </div>

              {/* 3D WebGL Scene */}
              <Canvas camera={{ position: [0, 16, 12], fov: 45 }}>
                {/* 1. Base Canvas Ground: Dark Sapphire (#03045E) */}
                <color attach="background" args={['#03045E']} />
                <fog attach="fog" args={['#03045E', 12, 35]} />

                <ambientLight intensity={0.7} />
                <directionalLight position={[12, 24, 12]} intensity={2.0} castShadow />
                <pointLight position={[0, 6, 0]} intensity={1.8} distance={15} color="#00B4D8" />
                
                {/* 1. Base Sapphire Ground Plate */}
                <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.08, 0]}>
                  <planeGeometry args={[50, 50]} />
                  <meshStandardMaterial color="#03045E" roughness={0.9} />
                </mesh>

                {/* Road Channels: Deep Ocean Blue (#023E8A) */}
                {/* North-South Road */}
                <mesh position={[0, 0.02, 0]}>
                  <boxGeometry args={[3.2, 0.04, 45]} />
                  <meshStandardMaterial color="#023E8A" roughness={0.8} />
                </mesh>
                {/* East-West Road */}
                <mesh position={[0, 0.015, 0]}>
                  <boxGeometry args={[45, 0.03, 3.2]} />
                  <meshStandardMaterial color="#023E8A" roughness={0.8} />
                </mesh>

                {/* Luminous Ice Cyan borders (#00B4D8) */}
                {/* North-South borders */}
                <mesh position={[-1.65, 0.041, 0]}>
                  <boxGeometry args={[0.08, 0.01, 45]} />
                  <meshStandardMaterial color="#00B4D8" emissive="#00B4D8" emissiveIntensity={1.5} />
                </mesh>
                <mesh position={[1.65, 0.041, 0]}>
                  <boxGeometry args={[0.08, 0.01, 45]} />
                  <meshStandardMaterial color="#00B4D8" emissive="#00B4D8" emissiveIntensity={1.5} />
                </mesh>
                {/* East-West borders */}
                <mesh position={[0, 0.031, -1.65]}>
                  <boxGeometry args={[45, 0.01, 0.08]} />
                  <meshStandardMaterial color="#00B4D8" emissive="#00B4D8" emissiveIntensity={1.5} />
                </mesh>
                <mesh position={[0, 0.031, 1.65]}>
                  <boxGeometry args={[45, 0.01, 0.08]} />
                  <meshStandardMaterial color="#00B4D8" emissive="#00B4D8" emissiveIntensity={1.5} />
                </mesh>

                {/* Corner Pads: Deep Sapphire (#0077B6) */}
                {/* NW Side */}
                <mesh position={[-10.8, 0.04, -10.8]}>
                  <boxGeometry args={[18.4, 0.08, 18.4]} />
                  <meshStandardMaterial color="#0077B6" roughness={0.9} />
                  <Edges threshold={15} color="#00B4D8" width={0.5} />
                </mesh>
                {/* NE Side */}
                <mesh position={[10.8, 0.04, -10.8]}>
                  <boxGeometry args={[18.4, 0.08, 18.4]} />
                  <meshStandardMaterial color="#0077B6" roughness={0.9} />
                  <Edges threshold={15} color="#00B4D8" width={0.5} />
                </mesh>
                {/* SW Side */}
                <mesh position={[-10.8, 0.04, 10.8]}>
                  <boxGeometry args={[18.4, 0.08, 18.4]} />
                  <meshStandardMaterial color="#0077B6" roughness={0.9} />
                  <Edges threshold={15} color="#00B4D8" width={0.5} />
                </mesh>
                {/* SE Side */}
                <mesh position={[10.8, 0.04, 10.8]}>
                  <boxGeometry args={[18.4, 0.08, 18.4]} />
                  <meshStandardMaterial color="#0077B6" roughness={0.9} />
                  <Edges threshold={15} color="#00B4D8" width={0.5} />
                </mesh>

                {/* Median Dividers: Luminous Cyan (#48CAE4) */}
                <mesh position={[0, 0.045, -12]}>
                  <boxGeometry args={[0.05, 0.01, 16]} />
                  <meshBasicMaterial color="#48CAE4" />
                </mesh>
                <mesh position={[0, 0.045, 12]}>
                  <boxGeometry args={[0.05, 0.01, 16]} />
                  <meshBasicMaterial color="#48CAE4" />
                </mesh>
                <mesh position={[-12, 0.04, 0]}>
                  <boxGeometry args={[16, 0.01, 0.05]} />
                  <meshBasicMaterial color="#48CAE4" />
                </mesh>
                <mesh position={[12, 0.04, 0]}>
                  <boxGeometry args={[16, 0.01, 0.05]} />
                  <meshBasicMaterial color="#48CAE4" />
                </mesh>

                {/* Crosswalks: Soft Ice (#CAF0F8) */}
                {/* Zebra North (Z = -3.2) */}
                {crosswalkPositions.map(x => (
                  <mesh key={`zw-n-${x}`} position={[x, 0.042, -3.2]}>
                    <boxGeometry args={[0.15, 0.01, 0.6]} />
                    <meshBasicMaterial color="#CAF0F8" />
                  </mesh>
                ))}
                {/* Zebra South (Z = 3.2) */}
                {crosswalkPositions.map(x => (
                  <mesh key={`zw-s-${x}`} position={[x, 0.042, 3.2]}>
                    <boxGeometry args={[0.15, 0.01, 0.6]} />
                    <meshBasicMaterial color="#CAF0F8" />
                  </mesh>
                ))}
                {/* Zebra East (X = 3.2) */}
                {crosswalkPositions.map(z => (
                  <mesh key={`zw-e-${z}`} position={[3.2, 0.038, z]}>
                    <boxGeometry args={[0.6, 0.01, 0.15]} />
                    <meshBasicMaterial color="#CAF0F8" />
                  </mesh>
                ))}
                {/* Zebra West (X = -3.2) */}
                {crosswalkPositions.map(z => (
                  <mesh key={`zw-w-${z}`} position={[-3.2, 0.038, z]}>
                    <boxGeometry args={[0.6, 0.01, 0.15]} />
                    <meshBasicMaterial color="#CAF0F8" />
                  </mesh>
                ))}

                {/* Background Skyscrapers (White & Navy) */}
                {/* NW Corner skyscrapers */}
                <mesh position={[-6, 4, -6]}>
                  <boxGeometry args={[2, 8, 2]} />
                  <meshStandardMaterial color="#020C24" roughness={0.3} metalness={0.7} />
                  <Edges threshold={15} color="#00B4D8" width={1.0} />
                </mesh>
                <mesh position={[-12, 6, -8]}>
                  <boxGeometry args={[3, 12, 3]} />
                  <meshStandardMaterial color="#FFFFFF" roughness={0.2} metalness={0.8} />
                  <Edges threshold={15} color="#0A192F" width={1.0} />
                </mesh>

                {/* NE Corner skyscrapers */}
                <mesh position={[6, 5, -6]}>
                  <boxGeometry args={[2.2, 10, 2.2]} />
                  <meshStandardMaterial color="#FFFFFF" roughness={0.2} metalness={0.8} />
                  <Edges threshold={15} color="#0A192F" width={1.0} />
                </mesh>
                <mesh position={[11, 7, -11]}>
                  <boxGeometry args={[3, 14, 3]} />
                  <meshStandardMaterial color="#020C24" roughness={0.3} metalness={0.7} />
                  <Edges threshold={15} color="#00B4D8" width={1.0} />
                </mesh>

                {/* SW Corner skyscrapers */}
                <mesh position={[-7, 6, 7]}>
                  <boxGeometry args={[2.4, 12, 2.4]} />
                  <meshStandardMaterial color="#020C24" roughness={0.3} metalness={0.7} />
                  <Edges threshold={15} color="#00B4D8" width={1.0} />
                </mesh>
                <mesh position={[-11, 4, 11]}>
                  <boxGeometry args={[3, 8, 3]} />
                  <meshStandardMaterial color="#FFFFFF" roughness={0.2} metalness={0.8} />
                  <Edges threshold={15} color="#0A192F" width={1.0} />
                </mesh>

                {/* SE Corner skyscrapers */}
                <mesh position={[7, 4.5, 7]}>
                  <boxGeometry args={[2, 9, 2]} />
                  <meshStandardMaterial color="#FFFFFF" roughness={0.2} metalness={0.8} />
                  <Edges threshold={15} color="#0A192F" width={1.0} />
                </mesh>
                <mesh position={[12, 6.5, 8]}>
                  <boxGeometry args={[2.8, 13, 2.8]} />
                  <meshStandardMaterial color="#020C24" roughness={0.3} metalness={0.7} />
                  <Edges threshold={15} color="#00B4D8" width={1.0} />
                </mesh>

                {/* 4 Realistic Metal Light signal posts */}
                <SignalPole position={[-1.8, 0, -2.5]} isGreen={isNorthGreen} rotationY={Math.PI} />
                <SignalPole position={[1.8, 0, 2.5]} isGreen={isSouthGreen} rotationY={0} />
                <SignalPole position={[2.5, 0, -1.8]} isGreen={isEastGreen} rotationY={Math.PI / 2} />
                <SignalPole position={[-2.5, 0, 1.8]} isGreen={isWestGreen} rotationY={-Math.PI / 2} />

                {/* Animated multi-part vehicles with traffic physics */}
                <Vehicles
                  isNorthGreen={isNorthGreen}
                  isSouthGreen={isSouthGreen}
                  isEastGreen={isEastGreen}
                  isWestGreen={isWestGreen}
                />

                <OrbitControls
                  enableZoom={true}
                  enablePan={true}
                  maxPolarAngle={Math.PI / 2.3}
                  minDistance={6}
                  maxDistance={22}
                />
              </Canvas>
            </div>

            {/* LIVE CONSOLE LOG STREAM */}
            <div className="bg-[#020C24]/50 border border-[#00B4D8]/20 p-4 rounded-xl font-mono text-[10px] text-[#48CAE4] space-y-1">
              <div className="flex items-center gap-2 border-b border-[#00B4D8]/10 pb-1.5 mb-2">
                <Terminal className="h-3.5 w-3.5" />
                <span className="font-extrabold uppercase">SYSTEM CONSOLE OPERATIONAL LOGS</span>
              </div>
              <div className="h-16 overflow-y-auto space-y-0.5 text-slate-400">
                <div>[INFO] AI Decision Engine initialized successfully.</div>
                {emergencyOverride ? (
                  <div className="text-red-400 font-semibold animate-pulse">
                    [WARN] Emergency override active on approach: {emergencyOverride}. Cross conflicts RED-locked.
                  </div>
                ) : (
                  <div>[INFO] Phase cycle rotating automatically. State: {phaseState}. Timer countdown: {countdown}s.</div>
                )}
                <div>[YOLO] Frame rate stable at 28.5 FPS. Telemetry pipeline online.</div>
              </div>
            </div>
          </div>

          {/* Side Telemetry Controls & HUD */}
          <div className="space-y-6">
            
            {/* YOLO Computer Vision breakdown metrics */}
            <section className="bg-[#0A192F]/60 backdrop-blur-md border border-[#00B4D8]/20 p-5 rounded-2xl font-mono text-xs space-y-4">
              <div className="flex items-center justify-between border-b border-[#00B4D8]/20 pb-2">
                <span className="text-cyan-400 font-bold flex items-center gap-1.5 uppercase">
                  <Gauge className="h-4 w-4 text-[#00B4D8]" />
                  YOLOv8 CV breakdowns
                </span>
                <span className="bg-[#00B4D8]/10 text-[#00B4D8] border border-[#00B4D8]/30 px-2 py-0.5 rounded text-[8px]">
                  LIVE_MATRIX
                </span>
              </div>

              <p className="text-[10px] text-slate-400 leading-relaxed">
                Aggregated real-time detection parameters across all intersection cameras.
              </p>
              
              <div className="space-y-3.5">
                {/* Cars */}
                <div>
                  <div className="flex justify-between mb-1.5 text-slate-300">
                    <span className="flex items-center gap-1">🚗 CARS</span>
                    <span className="font-extrabold text-cyan-400">18 UNITS</span>
                  </div>
                  <div className="w-full bg-[#03045E] h-1.5 rounded-full overflow-hidden">
                    <div className="bg-cyan-400 h-full rounded-full" style={{ width: '75%' }} />
                  </div>
                </div>

                {/* Auto-Rickshaws */}
                <div>
                  <div className="flex justify-between mb-1.5 text-slate-300">
                    <span className="flex items-center gap-1">🛺 AUTO-RICKSHAWS</span>
                    <span className="font-extrabold text-cyan-400">6 UNITS</span>
                  </div>
                  <div className="w-full bg-[#03045E] h-1.5 rounded-full overflow-hidden">
                    <div className="bg-cyan-400 h-full rounded-full" style={{ width: '40%' }} />
                  </div>
                </div>

                {/* Buses */}
                <div>
                  <div className="flex justify-between mb-1.5 text-slate-300">
                    <span className="flex items-center gap-1">🚌 BUSES</span>
                    <span className="font-extrabold text-cyan-400">3 UNITS</span>
                  </div>
                  <div className="w-full bg-[#03045E] h-1.5 rounded-full overflow-hidden">
                    <div className="bg-cyan-400 h-full rounded-full" style={{ width: '25%' }} />
                  </div>
                </div>

                {/* Ambulance */}
                <div className={`p-2 rounded-lg transition-all duration-300 ${emergencyOverride ? 'bg-red-500/10 border border-red-500/30' : ''}`}>
                  <div className="flex justify-between mb-1 text-slate-300">
                    <span className={`flex items-center gap-1 ${emergencyOverride ? 'text-red-400 font-bold animate-pulse' : ''}`}>
                      🚑 AMBULANCE
                    </span>
                    <span className={`font-extrabold ${emergencyOverride ? 'text-red-400 animate-pulse text-sm' : 'text-cyan-400'}`}>
                      {emergencyOverride ? '1 DETECTED' : '1 UNIT'}
                    </span>
                  </div>
                  <div className="w-full bg-[#03045E] h-1.5 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ${
                        emergencyOverride ? 'bg-red-500 shadow-[0_0_10px_#ef4444]' : 'bg-cyan-400'
                      }`} 
                      style={{ width: emergencyOverride ? '100%' : '15%' }} 
                    />
                  </div>
                </div>
              </div>
            </section>

            {/* EMERGENCY OVERRIDE PANEL */}
            <section className={`p-5 rounded-2xl border font-mono text-xs space-y-4 transition-all duration-500 ${
              emergencyOverride 
                ? 'bg-red-950/40 border-red-500/50 shadow-[0_0_30px_rgba(239,68,68,0.2)] animate-emergency-alert' 
                : 'bg-[#0A192F]/60 border-[#00B4D8]/20 text-[#CAF0F8]'
            }`}>
              <div className="flex items-center gap-2 border-b border-[#00B4D8]/20 pb-2">
                <ShieldAlert className={`h-5 w-5 ${emergencyOverride ? 'text-red-400 animate-bounce' : 'text-[#00B4D8]'}`} />
                <span className={emergencyOverride ? 'text-red-400 font-extrabold tracking-wider' : 'text-cyan-400 font-bold'}>
                  EMERGENCY GREEN OVERRIDE
                </span>
              </div>

              <p className="text-[10px] text-slate-400 leading-relaxed">
                Manual priority lock. Locks target approach signal to Green, clear all conflicting signals to Red.
              </p>

              <div className="grid grid-cols-1 gap-2.5">
                {/* NORTH LANE */}
                <button
                  onClick={() => handleToggleEmergency('NORTH')}
                  className={`py-3 px-4 rounded-xl border font-extrabold text-center transition-all cursor-pointer text-[10px] flex items-center justify-center gap-2 tracking-wide uppercase ${
                    emergencyOverride === 'NORTH'
                      ? 'bg-red-600 border-red-400 text-white shadow-[0_0_15px_#ef4444] animate-pulse'
                      : 'bg-[#023E8A]/50 hover:bg-[#023E8A]/80 border-[#00B4D8]/30 hover:border-[#48CAE4] text-[#CAF0F8]'
                  }`}
                >
                  🚑 NORTH LANE
                </button>
                {/* SOUTH LANE */}
                <button
                  onClick={() => handleToggleEmergency('SOUTH')}
                  className={`py-3 px-4 rounded-xl border font-extrabold text-center transition-all cursor-pointer text-[10px] flex items-center justify-center gap-2 tracking-wide uppercase ${
                    emergencyOverride === 'SOUTH'
                      ? 'bg-red-600 border-red-400 text-white shadow-[0_0_15px_#ef4444] animate-pulse'
                      : 'bg-[#023E8A]/50 hover:bg-[#023E8A]/80 border-[#00B4D8]/30 hover:border-[#48CAE4] text-[#CAF0F8]'
                  }`}
                >
                  SOUTH LANE
                </button>
                {/* EAST LANE */}
                <button
                  onClick={() => handleToggleEmergency('EAST')}
                  className={`py-3 px-4 rounded-xl border font-extrabold text-center transition-all cursor-pointer text-[10px] flex items-center justify-center gap-2 tracking-wide uppercase ${
                    emergencyOverride === 'EAST'
                      ? 'bg-red-600 border-red-400 text-white shadow-[0_0_15px_#ef4444] animate-pulse'
                      : 'bg-[#023E8A]/50 hover:bg-[#023E8A]/80 border-[#00B4D8]/30 hover:border-[#48CAE4] text-[#CAF0F8]'
                  }`}
                >
                  EAST LANE
                </button>
                {/* WEST LANE */}
                <button
                  onClick={() => handleToggleEmergency('WEST')}
                  className={`py-3 px-4 rounded-xl border font-extrabold text-center transition-all cursor-pointer text-[10px] flex items-center justify-center gap-2 tracking-wide uppercase ${
                    emergencyOverride === 'WEST'
                      ? 'bg-red-600 border-red-400 text-white shadow-[0_0_15px_#ef4444] animate-pulse'
                      : 'bg-[#023E8A]/50 hover:bg-[#023E8A]/80 border-[#00B4D8]/30 hover:border-[#48CAE4] text-[#CAF0F8]'
                  }`}
                >
                  WEST LANE
                </button>
              </div>

              {emergencyOverride && (
                <button
                  onClick={() => {
                    setEmergencyOverride(null);
                    setCountdown(15);
                  }}
                  className="w-full py-2 mt-2 rounded bg-red-950 border border-red-500/60 hover:bg-red-900 text-red-200 font-mono text-[9px] uppercase tracking-wider font-extrabold transition-all cursor-pointer"
                >
                  [ DEACTIVATE MANUAL OVERRIDE ]
                </button>
              )}
            </section>
          </div>
        </div>

        {/* Bottom notifications info banner */}
        <footer className="pt-2">
          {emergencyOverride ? (
            <div className="relative bg-gradient-to-r from-red-950/40 via-red-900/20 to-transparent backdrop-blur-lg border-l-4 border-red-500 border-y border-r border-red-500/30 rounded-r-xl p-5 shadow-lg flex items-start gap-4 overflow-hidden">
              <div className="relative flex h-5 w-5 items-center justify-center flex-shrink-0 mt-0.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75"></span>
                <span className="absolute inline-flex rounded-full h-4 w-4 bg-red-600/40"></span>
                <ShieldAlert className="h-4 w-4 text-red-200" />
              </div>
              <div className="flex-1 font-mono">
                <h3 className="text-red-400 font-bold tracking-widest text-xs uppercase flex items-center gap-1.5">
                  [ ALERT // MANUAL EMERGENCY ROUTE LOCK ACTIVE ]
                </h3>
                <p className="text-[11px] text-red-200/90 mt-1 leading-relaxed">
                  ⚠️ Priority green-wave lock forced on approach: <strong>{emergencyOverride} APPROACH</strong>. All intersection conflict points configured as safety RED. Do not interrupt override until path is clear.
                </p>
              </div>
            </div>
          ) : (
            <div className="bg-[#0A192F]/60 border border-[#00B4D8]/20 rounded-2xl p-5 text-[#CAF0F8] flex items-start gap-4 shadow-lg">
              <Cpu className="h-5 w-5 text-[#00B4D8] flex-shrink-0 mt-0.5 animate-pulse" />
              <div className="flex-1 font-mono">
                <h3 className="text-[#48CAE4] font-bold text-xs tracking-wider uppercase mb-1">
                  [ OPERATION STATE // DECISION PIPELINE ACTIVE ]
                </h3>
                <p className="text-[11px] text-[#CAF0F8] leading-relaxed">
                  Adaptive phase cycle timing is actively computed from telemetry. Next automatic cycle rotation triggered in {countdown} seconds. Current phase pattern: <span className="text-[#10B981] font-bold">{phaseState}</span>.
                </p>
              </div>
            </div>
          )}
        </footer>
      </div>
    </div>
  );
}
