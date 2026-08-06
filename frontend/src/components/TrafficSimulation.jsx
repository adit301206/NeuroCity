import React, { useState, useEffect, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Edges } from '@react-three/drei';
import Navbar from './Navbar';
import JunctionIngestionDeck from './JunctionIngestionDeck';
import {
  Activity,
  ShieldAlert,
  Gauge,
  Terminal,
  Cpu,
  Tv
} from 'lucide-react';

// --- HELPER FUNCTIONS FOR PHYSICS & ROUTING (INDIAN LEFT-HAND DRIVE) ---

// Helper to spawn/initialize vehicles with varying properties and lanes
function createVehicle(id, approach, intent, initialOffset = 0) {
  const type = id === 'n3' || id === 'e3' ? 'AMBULANCE' : (Math.random() > 0.75 ? 'BUS' : 'CAR');

  // Realistic speeds
  const baseSpeed = type === 'AMBULANCE' ? 5.5 : (type === 'BUS' ? 3.6 : 4.4);

  // Indian Left-Hand Drive Sub-Lane Assignment:
  // Lane 0 (Leftmost curb lane): Dedicated Left Turns & Straight passes (X = +2.5 or -2.5)
  // Lane 1 (Center lane): Straight movement (X = +1.5 or -1.5)
  // Lane 2 (Rightmost median lane): Dedicated Right turns (X = +0.5 or -0.5)
  let laneIndex = 1;
  if (intent === 'LEFT_TURN') {
    laneIndex = 0;
  } else if (intent === 'RIGHT_TURN') {
    laneIndex = 2;
  } else {
    // Straight vehicles can distribute across Left (0) or Center (1) lanes
    laneIndex = Math.random() > 0.5 ? 1 : 0;
  }

  const colors = ['#CAF0F8', '#48CAE4', '#FFFFFF', '#00B4D8'];
  const color = type === 'AMBULANCE' ? '#FFFFFF' : colors[Math.floor(Math.random() * colors.length)];

  return {
    id,
    type,
    color,
    approach,
    intent,
    laneIndex,
    speed: baseSpeed + (Math.random() * 0.4 - 0.2),
    currentSpeed: baseSpeed,
    phase: 'APPROACHING',
    progress: initialOffset,
    x: 0,
    z: 0,
    rotationY: 0,
    angle: 0,
    stoppedBriefly: false,
    stopTimer: 0,
    t: 0
  };
}

// Get coordinates for APPROACHING phase under Indian Left-Hand Drive (LHD)
function getApproachCoords(approach, laneIndex, progress) {
  let x = 0, z = 0, angle = 0;
  // Lanes center offset: Left=2.5, Center=1.5, Right=0.5
  const offset = laneIndex === 0 ? 2.5 : (laneIndex === 1 ? 1.5 : 0.5);

  if (approach === 'NORTH') {
    x = offset; // Southbound drives on LHD left side (X = +offset)
    z = -22 + progress;
    angle = 0; // Southbound (+z)
  } else if (approach === 'SOUTH') {
    x = -offset; // Northbound drives on LHD left side (X = -offset)
    z = 22 - progress;
    angle = Math.PI; // Northbound (-z)
  } else if (approach === 'EAST') {
    x = 22 - progress;
    z = offset; // Westbound drives on LHD left side (Z = +offset)
    angle = -Math.PI / 2; // Westbound (-x)
  } else if (approach === 'WEST') {
    x = -22 + progress;
    z = -offset; // Eastbound drives on LHD left side (Z = -offset)
    angle = Math.PI / 2; // Eastbound (+x)
  }
  return { x, z, angle };
}

// Get Bezier control points for intersection traversal (Phase 2) under LHD
function getBezierPoints(approach, laneIndex, intent) {
  const inOffset = laneIndex === 0 ? 2.5 : (laneIndex === 1 ? 1.5 : 0.5);
  // Left turns execute tight curb-to-curb arcs (2.5), Right turns cross wide to median lanes (0.5)
  const outOffset = intent === 'LEFT_TURN' ? 2.5 : (intent === 'RIGHT_TURN' ? 0.5 : inOffset);

  let P0 = [0, 0, 0];
  let P1 = [0, 0, 0];
  let P2 = [0, 0, 0];

  if (approach === 'NORTH') {
    P0 = [inOffset, 0, -5.0];
    if (intent === 'STRAIGHT') {
      P2 = [inOffset, 0, 5.0];
      P1 = [inOffset, 0, 0];
    } else if (intent === 'LEFT_TURN') {
      // Turn left to East (+x, outgoing z = -outOffset)
      P2 = [4.0, 0, -outOffset];
      P1 = [inOffset, 0, -outOffset];
    } else if (intent === 'RIGHT_TURN') {
      // Turn right to West (-x, outgoing z = outOffset)
      P2 = [-4.0, 0, outOffset];
      P1 = [inOffset, 0, outOffset];
    }
  } else if (approach === 'SOUTH') {
    P0 = [-inOffset, 0, 5.0];
    if (intent === 'STRAIGHT') {
      P2 = [-inOffset, 0, -5.0];
      P1 = [-inOffset, 0, 0];
    } else if (intent === 'LEFT_TURN') {
      // Turn left to West (-x, outgoing z = outOffset)
      P2 = [-5.0, 0, outOffset];
      P1 = [-inOffset, 0, outOffset];
    } else if (intent === 'RIGHT_TURN') {
      // Turn right to East (+x, outgoing z = -outOffset)
      P2 = [5.0, 0, -outOffset];
      P1 = [-inOffset, 0, -outOffset];
    }
  } else if (approach === 'EAST') {
    P0 = [5.0, 0, inOffset];
    if (intent === 'STRAIGHT') {
      P2 = [-5.0, 0, inOffset];
      P1 = [0, 0, inOffset];
    } else if (intent === 'LEFT_TURN') {
      // Turn left to South (+z, outgoing x = outOffset)
      P2 = [outOffset, 0, 5.0];
      P1 = [outOffset, 0, inOffset];
    } else if (intent === 'RIGHT_TURN') {
      // Turn right to North (-z, outgoing x = -outOffset)
      P2 = [-outOffset, 0, -5.0];
      P1 = [-outOffset, 0, inOffset];
    }
  } else if (approach === 'WEST') {
    P0 = [-5.0, 0, -inOffset];
    if (intent === 'STRAIGHT') {
      P2 = [5.0, 0, -inOffset];
      P1 = [0, 0, -inOffset];
    } else if (intent === 'LEFT_TURN') {
      // Turn left to North (-z, outgoing x = -outOffset)
      P2 = [-outOffset, 0, -5.0];
      P1 = [-outOffset, 0, -inOffset];
    } else if (intent === 'RIGHT_TURN') {
      // Turn right to South (+z, outgoing x = outOffset)
      P2 = [outOffset, 0, 5.0];
      P1 = [outOffset, 0, -inOffset];
    }
  }
  return { P0, P1, P2 };
}

// Quadratic Bezier interpolation for coordinates & angles
function getBezierPoint(P0, P1, P2, t) {
  const x = (1 - t) * (1 - t) * P0[0] + 2 * (1 - t) * t * P1[0] + t * t * P2[0];
  const z = (1 - t) * (1 - t) * P0[2] + 2 * (1 - t) * t * P1[2] + t * t * P2[2];

  // Derivative vectors for rotation angle
  const dx = 2 * (1 - t) * (P1[0] - P0[0]) + 2 * t * (P2[0] - P1[0]);
  const dz = 2 * (1 - t) * (P1[2] - P0[2]) + 2 * t * (P2[2] - P1[2]);

  const angle = Math.atan2(dx, dz);
  return { x, z, angle };
}

// Get departure motion direction and rotation angle
function getDepartureDirAndAngle(approach, intent) {
  let dir = [0, 0, 0];
  let angle = 0;

  if (approach === 'NORTH') {
    if (intent === 'STRAIGHT') { dir = [0, 0, 1]; angle = 0; }
    else if (intent === 'LEFT_TURN') { dir = [1, 0, 0]; angle = Math.PI / 2; }
    else if (intent === 'RIGHT_TURN') { dir = [-1, 0, 0]; angle = -Math.PI / 2; }
  } else if (approach === 'SOUTH') {
    if (intent === 'STRAIGHT') { dir = [0, 0, -1]; angle = Math.PI; }
    else if (intent === 'LEFT_TURN') { dir = [-1, 0, 0]; angle = -Math.PI / 2; }
    else if (intent === 'RIGHT_TURN') { dir = [1, 0, 0]; angle = Math.PI / 2; }
  } else if (approach === 'EAST') {
    if (intent === 'STRAIGHT') { dir = [-1, 0, 0]; angle = -Math.PI / 2; }
    else if (intent === 'LEFT_TURN') { dir = [0, 0, 1]; angle = 0; }
    else if (intent === 'RIGHT_TURN') { dir = [0, 0, -1]; angle = Math.PI; }
  } else if (approach === 'WEST') {
    if (intent === 'STRAIGHT') { dir = [1, 0, 0]; angle = Math.PI / 2; }
    else if (intent === 'LEFT_TURN') { dir = [0, 0, -1]; angle = Math.PI; }
    else if (intent === 'RIGHT_TURN') { dir = [0, 0, 1]; angle = 0; }
  }
  return { dir, angle };
}

// --- 3D ENVIRONMENT PROPS COMPONENTS ---

// 3D Tree prop Component with Stacked Cones and Slate trunk
function Tree3D({ position }) {
  return (
    <group position={position}>
      {/* Trunk */}
      <mesh position={[0, 0.4, 0]}>
        <cylinderGeometry args={[0.08, 0.12, 0.8, 8]} />
        <meshStandardMaterial color="#334155" roughness={0.9} />
      </mesh>
      {/* Stacked Conical Foliage meshes */}
      <mesh position={[0, 1.0, 0]}>
        <coneGeometry args={[0.45, 0.8, 8]} />
        <meshStandardMaterial color="#059669" emissive="#10B981" emissiveIntensity={0.25} roughness={0.7} />
      </mesh>
      <mesh position={[0, 1.4, 0]}>
        <coneGeometry args={[0.35, 0.6, 8]} />
        <meshStandardMaterial color="#059669" emissive="#10B981" emissiveIntensity={0.25} roughness={0.7} />
      </mesh>
    </group>
  );
}

// 3D LED Streetlight Component casting spotlights onto road
function StreetLight3D({ position, rotationY }) {
  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      {/* Tall Pole */}
      <mesh position={[0, 1.8, 0]}>
        <cylinderGeometry args={[0.04, 0.06, 3.6, 8]} />
        <meshStandardMaterial color="#475569" metalness={0.8} roughness={0.2} />
      </mesh>
      {/* Arm outreach */}
      <mesh position={[0.4, 3.6, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.03, 0.03, 0.8, 8]} />
        <meshStandardMaterial color="#475569" metalness={0.8} roughness={0.2} />
      </mesh>
      {/* Light Head */}
      <mesh position={[0.8, 3.6, 0]}>
        <boxGeometry args={[0.2, 0.06, 0.12]} />
        <meshStandardMaterial color="#0F172A" />
      </mesh>
      {/* Illuminated cyan LED fixture - #00B4D8 */}
      <mesh position={[0.8, 3.55, 0]}>
        <boxGeometry args={[0.16, 0.01, 0.08]} />
        <meshStandardMaterial color="#00B4D8" emissive="#00B4D8" emissiveIntensity={2.5} />
      </mesh>
      {/* pointLight casting light onto road */}
      <pointLight position={[0.8, 3.4, 0]} color="#00B4D8" intensity={2.0} distance={8} decay={2} />
    </group>
  );
}

// Guard Rail Barricade along the sidewalk edge
function GuardRail({ position, rotationY, length = 4 }) {
  const postsCount = Math.ceil(length / 0.8) + 1;
  const posts = [];
  for (let i = 0; i < postsCount; i++) {
    posts.push(-length / 2 + (i * length) / (postsCount - 1));
  }
  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      {/* Horizontal rail bars */}
      <mesh position={[0, 0.5, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.02, 0.02, length, 8]} />
        <meshStandardMaterial color="#00B4D8" metalness={0.9} roughness={0.1} />
      </mesh>
      <mesh position={[0, 0.3, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.015, 0.015, length, 8]} />
        <meshStandardMaterial color="#00B4D8" metalness={0.9} roughness={0.1} />
      </mesh>
      {/* Posts */}
      {posts.map((offsetX, idx) => (
        <mesh key={idx} position={[offsetX, 0.25, 0]}>
          <cylinderGeometry args={[0.025, 0.03, 0.5, 8]} />
          <meshStandardMaterial color="#334155" metalness={0.8} roughness={0.3} />
        </mesh>
      ))}
    </group>
  );
}

// Bus Stop Glass Shelter Component (BusShelter3D)
function BusShelter3D({ position, rotationY }) {
  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      {/* Back posts */}
      <mesh position={[-0.8, 0.75, -0.4]}>
        <cylinderGeometry args={[0.03, 0.03, 1.5, 8]} />
        <meshStandardMaterial color="#334155" metalness={0.8} />
      </mesh>
      <mesh position={[0.8, 0.75, -0.4]}>
        <cylinderGeometry args={[0.03, 0.03, 1.5, 8]} />
        <meshStandardMaterial color="#334155" metalness={0.8} />
      </mesh>
      {/* Front posts */}
      <mesh position={[-0.8, 0.75, 0.4]}>
        <cylinderGeometry args={[0.03, 0.03, 1.5, 8]} />
        <meshStandardMaterial color="#334155" metalness={0.8} />
      </mesh>
      <mesh position={[0.8, 0.75, 0.4]}>
        <cylinderGeometry args={[0.03, 0.03, 1.5, 8]} />
        <meshStandardMaterial color="#334155" metalness={0.8} />
      </mesh>
      {/* Translucent glass back panel - #023E8A frame */}
      <mesh position={[0, 0.75, -0.4]}>
        <boxGeometry args={[1.5, 1.2, 0.02]} />
        <meshStandardMaterial color="#023E8A" transparent opacity={0.6} roughness={0.15} metalness={0.4} />
      </mesh>
      {/* Translucent glass side panels */}
      <mesh position={[-0.8, 0.75, 0]} rotation={[0, Math.PI / 2, 0]}>
        <boxGeometry args={[0.8, 1.2, 0.02]} />
        <meshStandardMaterial color="#023E8A" transparent opacity={0.6} roughness={0.15} metalness={0.4} />
      </mesh>
      <mesh position={[0.8, 0.75, 0]} rotation={[0, Math.PI / 2, 0]}>
        <boxGeometry args={[0.8, 1.2, 0.02]} />
        <meshStandardMaterial color="#023E8A" transparent opacity={0.6} roughness={0.15} metalness={0.4} />
      </mesh>
      {/* Cyan Glowing Roof canopy - #00B4D8 */}
      <mesh position={[0, 1.52, 0]} rotation={[0.08, 0, 0]}>
        <boxGeometry args={[1.7, 0.04, 1.0]} />
        <meshStandardMaterial color="#00B4D8" emissive="#00B4D8" emissiveIntensity={1.2} metalness={0.7} roughness={0.3} />
      </mesh>
      {/* Seat Bench */}
      <mesh position={[0, 0.35, -0.2]}>
        <boxGeometry args={[1.2, 0.06, 0.25]} />
        <meshStandardMaterial color="#334155" roughness={0.6} />
      </mesh>
    </group>
  );
}

// Skyscraper with Cyber-Window Grids and Rooftop Beacon
function BuildingWithWindows({ position, size, beaconColor = '#EF4444' }) {
  const [w, h, d] = size;
  return (
    <group position={position}>
      {/* Main building core */}
      <mesh position={[0, h / 2, 0]}>
        <boxGeometry args={[w, h, d]} />
        <meshStandardMaterial color="#020C24" roughness={0.35} metalness={0.65} />
        <Edges threshold={15} color="#00B4D8" width={0.6} />
      </mesh>
      {/* Cyan Window Grids */}
      <mesh position={[0, h / 2, d / 2 + 0.01]}>
        <planeGeometry args={[w * 0.8, h * 0.85]} />
        <meshStandardMaterial
          color="#00B4D8"
          emissive="#00B4D8"
          emissiveIntensity={0.35}
          transparent
          opacity={0.3}
          roughness={0.1}
          metalness={0.9}
        />
      </mesh>
      <mesh position={[0, h / 2, -d / 2 - 0.01]} rotation={[0, Math.PI, 0]}>
        <planeGeometry args={[w * 0.8, h * 0.85]} />
        <meshStandardMaterial
          color="#00B4D8"
          emissive="#00B4D8"
          emissiveIntensity={0.35}
          transparent
          opacity={0.3}
          roughness={0.1}
          metalness={0.9}
        />
      </mesh>
      <mesh position={[-w / 2 - 0.01, h / 2, 0]} rotation={[0, -Math.PI / 2, 0]}>
        <planeGeometry args={[d * 0.8, h * 0.85]} />
        <meshStandardMaterial
          color="#00B4D8"
          emissive="#00B4D8"
          emissiveIntensity={0.35}
          transparent
          opacity={0.3}
          roughness={0.1}
          metalness={0.9}
        />
      </mesh>
      <mesh position={[w / 2 + 0.01, h / 2, 0]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[d * 0.8, h * 0.85]} />
        <meshStandardMaterial
          color="#00B4D8"
          emissive="#00B4D8"
          emissiveIntensity={0.35}
          transparent
          opacity={0.3}
          roughness={0.1}
          metalness={0.9}
        />
      </mesh>
      {/* Rooftop beacon */}
      <mesh position={[0, h + 0.15, 0]}>
        <cylinderGeometry args={[0.02, 0.02, 0.3, 8]} />
        <meshStandardMaterial color="#64748B" metalness={0.9} />
      </mesh>
      <mesh position={[0, h + 0.3, 0]}>
        <sphereGeometry args={[0.08, 8, 8]} />
        <meshBasicMaterial color={beaconColor} />
      </mesh>
      <pointLight position={[0, h + 0.35, 0]} color={beaconColor} intensity={2.0} distance={5} decay={2} />
    </group>
  );
}

// --- 3D VEHICLES & SIGNAL POLES ---

// Signal Pole 3D Component with standard RED, GREEN lenses
function SignalPole({ position, status, rotationY = 0 }) {
  const isRed = status === 'RED';
  const isGreen = status === 'GREEN';

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
      {/* RED bulb lens */}
      <mesh position={[0.8, 3.0, 0.16]}>
        <sphereGeometry args={[0.07, 16, 16]} />
        <meshStandardMaterial
          color={isRed ? '#EF4444' : '#3d050d'}
          emissive={isRed ? '#EF4444' : '#1a0205'}
          emissiveIntensity={isRed ? 3.5 : 0.15}
        />
      </mesh>
      {/* GREEN bulb lens */}
      <mesh position={[0.8, 2.6, 0.16]}>
        <sphereGeometry args={[0.07, 16, 16]} />
        <meshStandardMaterial
          color={isGreen ? '#10B981' : '#033a18'}
          emissive={isGreen ? '#10B981' : '#011a08'}
          emissiveIntensity={isGreen ? 3.5 : 0.15}
        />
      </mesh>
      {/* Point light spot glow */}
      {isRed && <pointLight position={[0.8, 3.0, 0.4]} color="#EF4444" intensity={2.0} distance={5} decay={2} />}
      {isGreen && <pointLight position={[0.8, 2.6, 0.4]} color="#10B981" intensity={2.0} distance={5} decay={2} />}
    </group>
  );
}

// Unified 3D vehicle model with local heading along Y-axis
function Vehicle3DModel({ car, sirenActiveRef }) {
  const meshRef = useRef();

  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.position.set(car.x, 0.1, car.z);
      meshRef.current.rotation.y = car.rotationY || 0;
    }
  });

  let chassisSize, cabinSize, cabinOffset, headlightOffset1, headlightOffset2;

  if (car.type === 'CAR') {
    chassisSize = [0.5, 0.2, 1.0];
    cabinSize = [0.4, 0.16, 0.65];
    cabinOffset = [0, 0.1, -0.05];
    headlightOffset1 = [-0.18, 0.05, 0.48];
    headlightOffset2 = [0.18, 0.05, 0.48];
  } else if (car.type === 'BUS') {
    chassisSize = [0.6, 0.38, 1.9];
    cabinSize = [0.54, 0.2, 1.5];
    cabinOffset = [0, 0.22, 0];
    headlightOffset1 = [-0.22, 0.1, 0.93];
    headlightOffset2 = [0.22, 0.1, 0.93];
  } else {
    // AMBULANCE
    chassisSize = [0.52, 0.26, 1.25];
    cabinSize = [0.46, 0.22, 0.85];
    cabinOffset = [0, 0.18, -0.1];
    headlightOffset1 = [-0.19, 0.06, 0.60];
    headlightOffset2 = [0.19, 0.06, 0.60];
  }

  const sirenColor = sirenActiveRef.current ? '#EF4444' : '#45050a';

  return (
    <group ref={meshRef}>
      {/* Lower Chassis */}
      <mesh position={[0, chassisSize[1] / 2, 0]}>
        <boxGeometry args={chassisSize} />
        <meshStandardMaterial color={car.color} roughness={0.2} metalness={0.7} />
        <Edges threshold={15} color="#00B4D8" width={0.4} />
      </mesh>

      {/* Cabin Roof */}
      <mesh position={[cabinOffset[0], chassisSize[1] + cabinSize[1] / 2 + cabinOffset[1] - 0.15, cabinOffset[2]]}>
        <boxGeometry args={cabinSize} />
        <meshStandardMaterial color="#0A192F" roughness={0.15} metalness={0.8} />
        <Edges threshold={15} color="#CAF0F8" width={0.4} />
      </mesh>

      {/* Luminous Headlights */}
      <mesh position={headlightOffset1}>
        <sphereGeometry args={[0.05, 8, 8]} />
        <meshBasicMaterial color="#48CAE4" />
      </mesh>
      <mesh position={headlightOffset2}>
        <sphereGeometry args={[0.05, 8, 8]} />
        <meshBasicMaterial color="#48CAE4" />
      </mesh>

      {/* Ambulance Emergency Siren */}
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

// 3D Vehicles Manager & Physics Updates Loop
function Vehicles({ phaseState, emergencyOverride, onEmergencyPassed, vehicleList }) {
  const carsRef = useRef(vehicleList);

  useEffect(() => {
    carsRef.current = vehicleList;
  }, [vehicleList]);

  const sirenActiveRef = useRef(false);

  useFrame((state, delta) => {
    const d = Math.min(delta, 0.1);

    // Blinking timer for sirens
    sirenActiveRef.current = Math.sin(state.clock.getElapsedTime() * 15) > 0;

    // Automatic Emergency clearance detection
    if (emergencyOverride) {
      const ambulance = carsRef.current.find(c => c.approach === emergencyOverride && c.type === 'AMBULANCE');
      if (ambulance) {
        // If the ambulance has passed the center of the intersection (t > 0.5)
        const hasCleared = (ambulance.phase === 'INTERSECTION' && ambulance.t > 0.5) || ambulance.phase === 'DEPARTING';
        if (hasCleared) {
          onEmergencyPassed?.();
        }
      }
    }

    carsRef.current.forEach((car) => {
      // AI / Compliance tracking fields
      car.subLane = car.laneIndex === 0 ? 'LEFT' : (car.laneIndex === 1 ? 'CENTER' : 'RIGHT');
      car.action = car.intent;

      const activeApproach = phaseState.split('_')[0];
      const signal = car.approach === activeApproach ? 'GREEN' : 'RED';

      // Track speed dynamically
      let currentSpeed = car.currentSpeed ?? car.speed;
      let targetSpeed = car.speed;

      if (car.phase === 'APPROACHING') {
        // 1. CAR-FOLLOWING QUEUE PHYSICS (RELATIVE PROGRESS CLAMPING)
        let frontCar = null;
        let minAheadDist = 999;

        carsRef.current.forEach((other) => {
          if (
            other.id !== car.id &&
            other.approach === car.approach &&
            other.laneIndex === car.laneIndex &&
            other.phase === 'APPROACHING'
          ) {
            const dist = other.progress - car.progress;
            if (dist > 0 && dist < minAheadDist) {
              minAheadDist = dist;
              frontCar = other;
            }
          }
        });

        // Speed check for queue spacing deceleration
        if (frontCar) {
          if (minAheadDist < 3.0) {
            targetSpeed = Math.min(targetSpeed, frontCar.currentSpeed * ((minAheadDist - 1.0) / 2.0));
          }
          if (minAheadDist < 2.0) {
            targetSpeed = 0;
          }
        }

        // 2. RED SIGNAL DECELERATION CONTROL
        if (signal === 'RED') {
          // Indian Free Left-Turn Rule: Vehicle in left sub-lane turning left
          if (car.subLane === 'LEFT' && car.action === 'LEFT_TURN') {
            const distToStop = 17.0 - car.progress;
            if (distToStop > 0) {
              if (distToStop < 4.0) {
                targetSpeed = Math.min(targetSpeed, car.speed * (distToStop / 4.0));
              }
              if (distToStop <= 0.1) {
                targetSpeed = 0;
              }
            }
          } else {
            // Normal red stopping deceleration
            const distToStop = 17.0 - car.progress;
            if (distToStop > 0) {
              if (distToStop < 4.0) {
                targetSpeed = Math.min(targetSpeed, car.speed * (distToStop / 4.0));
              }
              if (distToStop <= 0.1) {
                targetSpeed = 0;
              }
            }
          }
        } else {
          // GREEN - reset free-left stop timer
          car.stopTimer = 0;
          car.stoppedBriefly = false;
        }

        // Smooth physics interpolation
        const rate = targetSpeed > currentSpeed ? 4.0 : 8.0;
        currentSpeed += (targetSpeed - currentSpeed) * rate * d;
        car.currentSpeed = Math.max(0, currentSpeed);

        // Advance progress
        car.progress += car.currentSpeed * d;

        // Bumper-to-Bumper Queue progress clamping (maintain strict 2.0 safety distance)
        if (frontCar) {
          if (frontCar.progress - car.progress < 2.0) {
            car.progress = Math.max(0, frontCar.progress - 2.0);
            car.currentSpeed = 0;
          }
        }

        // 3. HARD STOP-LINE CLAMPING & STRICT PHASE TRANSITION GATE
        if (signal === 'RED') {
          if (car.subLane === 'LEFT' && car.action === 'LEFT_TURN') {
            // Free Left Turn Rule
            if (car.progress >= 17.0) {
              car.progress = 17.0;
              car.currentSpeed = 0;
              car.stopTimer = (car.stopTimer || 0) + d;
              if (car.stopTimer >= 0.8) {
                // Stopped briefly for 0.8s -> gate opens
                car.stoppedBriefly = true;
                car.phase = 'INTERSECTION';
                car.t = 0;
                car.currentSpeed = 1.5; // slow speed traversal
              }
            }
          } else {
            // Normal red light clamping: hard-stop at progress 17.0 (±5.0 coordinate)
            if (car.progress >= 17.0) {
              car.progress = 17.0;
              car.currentSpeed = 0;
            }
          }
        } else {
          // GREEN light - transition opens once progress reaches the stop line at 17.0
          if (car.progress >= 17.0) {
            car.phase = 'INTERSECTION';
            car.t = 0;
          }
        }

        // Update position variables
        const coords = getApproachCoords(car.approach, car.laneIndex, car.progress);
        car.x = coords.x;
        car.z = coords.z;
        car.rotationY = coords.angle;
        car.angle = coords.angle;

      } else if (car.phase === 'INTERSECTION') {
        const pathLength =
          car.intent === 'STRAIGHT' ? 10.0 :
          car.intent === 'LEFT_TURN' ? 6.5 : 7.5;

        // Traverse intersection smoothly
        const intersectSpeed = (car.stoppedBriefly && car.intent === 'LEFT_TURN') ? 1.5 : car.speed;
        currentSpeed += (intersectSpeed - currentSpeed) * 3.0 * d;
        car.currentSpeed = currentSpeed;

        car.t = (car.t || 0) + (currentSpeed / pathLength) * d;

        if (car.t >= 1.0) {
          car.phase = 'DEPARTING';
          car.progress = 0;
        }

        const { P0, P1, P2 } = getBezierPoints(car.approach, car.laneIndex, car.intent);
        const coords = getBezierPoint(P0, P1, P2, Math.min(1.0, car.t));
        car.x = coords.x;
        car.z = coords.z;
        car.rotationY = coords.angle;
        car.angle = coords.angle;

      } else if (car.phase === 'DEPARTING') {
        // Accelerate back to normal speed
        currentSpeed += (car.speed - currentSpeed) * 3.0 * d;
        car.currentSpeed = currentSpeed;

        car.progress += currentSpeed * d;

        if (car.progress >= 20.0) {
          // Recycle vehicle with a new random intent
          const roll = Math.random();
          const nextIntent = roll < 0.6 ? 'STRAIGHT' : (roll < 0.8 ? 'LEFT_TURN' : 'RIGHT_TURN');
          const resetCar = createVehicle(car.id, car.approach, nextIntent, 0);
          resetCar.currentSpeed = car.speed;
          resetCar.stoppedBriefly = false;
          resetCar.stopTimer = 0;
          Object.assign(car, resetCar);
        } else {
          const { P2 } = getBezierPoints(car.approach, car.laneIndex, car.intent);
          const { dir, angle } = getDepartureDirAndAngle(car.approach, car.intent);
          car.x = P2[0] + dir[0] * car.progress;
          car.z = P2[2] + dir[2] * car.progress;
          car.rotationY = angle;
          car.angle = angle;
        }
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

const Vehicle3Model = Vehicle3DModel;

// --- MAIN EXPORTED APPLICATION COMPONENT ---
export default function TrafficSimulation({ onBackToAnalyzer, onNavigate }) {
  // Sequential 4-Phase Cycle states: NORTH -> WEST -> SOUTH -> EAST
  const [phaseState, setPhaseState] = useState('NORTH_GREEN');
  const [emergencyOverride, setEmergencyOverride] = useState(null);
  
  // Custom approach durations calculated by YOLOv8 ingestion
  const [directionalTimers, setDirectionalTimers] = useState({
    NORTH: 15,
    WEST: 15,
    SOUTH: 15,
    EAST: 15
  });

  const [vehicleCounts, setVehicleCounts] = useState({
    NORTH: 0,
    WEST: 0,
    SOUTH: 0,
    EAST: 0
  });

  const [countdown, setCountdown] = useState(directionalTimers.NORTH);

  // Dynamic vehicle queue list state
  const [vehicleList, setVehicleList] = useState([
    createVehicle('n1', 'NORTH', 'LEFT_TURN', 0),
    createVehicle('n2', 'NORTH', 'STRAIGHT', 6),
    createVehicle('n3', 'NORTH', 'RIGHT_TURN', 12),

    createVehicle('s1', 'SOUTH', 'LEFT_TURN', 3),
    createVehicle('s2', 'SOUTH', 'STRAIGHT', 9),
    createVehicle('s3', 'SOUTH', 'RIGHT_TURN', 15),

    createVehicle('e1', 'EAST', 'LEFT_TURN', 1),
    createVehicle('e2', 'EAST', 'STRAIGHT', 7),
    createVehicle('e3', 'EAST', 'RIGHT_TURN', 13),

    createVehicle('w1', 'WEST', 'LEFT_TURN', 4),
    createVehicle('w2', 'WEST', 'STRAIGHT', 10),
    createVehicle('w3', 'WEST', 'RIGHT_TURN', 16),
  ]);

  // Rebuild 3D vehicles list when vehicleCounts or emergencyOverride changes
  useEffect(() => {
    if (vehicleCounts.NORTH === 0 && vehicleCounts.SOUTH === 0 && vehicleCounts.EAST === 0 && vehicleCounts.WEST === 0) {
      return;
    }

    const newCars = [];
    const directions = ['NORTH', 'SOUTH', 'EAST', 'WEST'];
    
    directions.forEach(dir => {
      const count = vehicleCounts[dir] || 0;
      const isEmergencyDir = emergencyOverride === dir;
      
      const laneCounters = [0, 0, 0];

      for (let i = 0; i < count; i++) {
        let laneIndex = i % 3;
        
        const isAmbulance = isEmergencyDir && i === 0;
        if (isAmbulance) {
          laneIndex = 1;
        }

        const laneCount = laneCounters[laneIndex];
        laneCounters[laneIndex]++;

        const initialProgress = Math.max(0, 16.5 - laneCount * 2.8);

        let intent = 'STRAIGHT';
        if (laneIndex === 0) {
          intent = 'LEFT_TURN';
        } else if (laneIndex === 2) {
          intent = 'RIGHT_TURN';
        }

        const id = `${dir.toLowerCase()}-${laneIndex}-${laneCount}-${i}`;
        const car = createVehicle(id, dir, intent, initialProgress);
        
        if (isAmbulance) {
          car.type = 'AMBULANCE';
          car.color = '#FFFFFF';
          car.speed = 6.0;
        }

        newCars.push(car);
      }
    });

    setVehicleList(newCars);
  }, [vehicleCounts, emergencyOverride]);

  // Unified timer sequence running every second
  useEffect(() => {
    const timer = setInterval(() => {
      // If in active emergency green lock without countdown (e.g. manual override), countdown remains 0
      if (emergencyOverride && countdown === 0) {
        return;
      }

      setCountdown((prev) => {
        if (prev <= 1) {
          // If emergency override is active, clear it when countdown completes
          if (emergencyOverride) {
            setEmergencyOverride(null);
          }

          // Normal sequential rotation: NORTH -> WEST -> SOUTH -> EAST
          const sequence = ['NORTH_GREEN', 'WEST_GREEN', 'SOUTH_GREEN', 'EAST_GREEN'];
          const activeApproach = phaseState.split('_')[0];
          const idx = sequence.findIndex(p => p.startsWith(activeApproach));
          const nextIdx = (idx === -1 ? 0 : idx + 1) % sequence.length;
          const nextPhase = sequence[nextIdx];
          setPhaseState(nextPhase);
          
          const nextDirection = nextPhase.split('_')[0];
          return directionalTimers[nextPhase] || directionalTimers[nextDirection] || 15;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [phaseState, emergencyOverride, directionalTimers, countdown]);

  const handleToggleEmergency = (direction) => {
    if (emergencyOverride === direction) {
      // Manually cleared -> resume sequential rotation starting from next direction in sequence
      const nextPhases = {
        'NORTH': 'WEST_GREEN',
        'WEST': 'SOUTH_GREEN',
        'SOUTH': 'EAST_GREEN',
        'EAST': 'NORTH_GREEN'
      };
      const nextPhase = nextPhases[direction] || 'NORTH_GREEN';
      const nextDirection = nextPhase.split('_')[0];
      setEmergencyOverride(null);
      setPhaseState(nextPhase);
      setCountdown(directionalTimers[nextPhase] || directionalTimers[nextDirection] || 15);
    } else {
      setEmergencyOverride(direction);
      setPhaseState(direction + '_GREEN');
      setCountdown(0);
    }
  };

  const handleEmergencyPassed = () => {
    // Dynamically resume normal rotation starting from the NEXT direction in sequence
    const nextPhases = {
      'NORTH': 'WEST_GREEN',
      'WEST': 'SOUTH_GREEN',
      'SOUTH': 'EAST_GREEN',
      'EAST': 'NORTH_GREEN'
    };
    const nextPhase = nextPhases[emergencyOverride] || 'NORTH_GREEN';
    const nextDirection = nextPhase.split('_')[0];
    setEmergencyOverride(null);
    setPhaseState(nextPhase);
    setCountdown(directionalTimers[nextPhase] || directionalTimers[nextDirection] || 15);
  };

  const handleAnalysisComplete = (result) => {
    if (result.status === 'success') {
      const timers = result.directionalTimers || { NORTH: 15, WEST: 15, SOUTH: 15, EAST: 15 };
      const counts = result.vehicleCounts || { NORTH: 0, WEST: 0, SOUTH: 0, EAST: 0 };
      
      setDirectionalTimers(timers);
      setVehicleCounts(counts);

      if (result.emergencyOverrideTriggered) {
        setEmergencyOverride(result.emergencyApproach);
        setPhaseState(result.emergencyApproach);
        setCountdown(45);
      } else {
        setEmergencyOverride(null);
        const activeApproach = phaseState.split('_')[0];
        const nextCountdown = timers[phaseState] || timers[activeApproach] || 15;
        setCountdown(nextCountdown);
      }
    }
  };

  // Signal pole display calculations
  const getPoleStatus = (poleApproach) => {
    const activeApproach = phaseState.split('_')[0];
    if (activeApproach === poleApproach) {
      return 'GREEN';
    }
    return 'RED';
  };

  // Crosswalk zebra layout positions mapping the 8.0 road width
  const crosswalkPositions = [-3.6, -3.0, -2.4, -1.8, -1.2, -0.6, 0, 0.6, 1.2, 1.8, 2.4, 3.0, 3.6];

  // Helper arrays for dashed divider lines at ±2.0 and ±3.0
  const dividerOffsets = [-3.0, -2.0, 2.0, 3.0];
  const dashPositions = [];
  for (let d = 4.6; d <= 23; d += 1.8) {
    dashPositions.push(d);
  }

  return (
    <div style={{ backgroundColor: '#F8FAFC' }} className={`w-full min-h-screen text-[#CAF0F8] transition-all duration-700 relative overflow-hidden select-none pb-12 ${emergencyOverride ? 'shadow-[inset_0_0_100px_rgba(239,68,68,0.25)] border border-red-500/20' : ''
      }`}>
      {/* Injected CSS Animations */}
      <style dangerouslySetInnerHTML={{
        __html: `
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

      {/* Main Simulation Container */}
      <main className="w-full max-w-7xl mx-auto px-6 mt-8 lg:mt-10">
        <div className="relative z-10 bg-[#03045E] p-6 lg:p-8 rounded-3xl border border-[#00B4D8]/50 shadow-[0_25px_60px_rgba(3,4,94,0.35)] space-y-6">

          {/* Runtime grid columns */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* Main 3D Canvas Box */}
            <div className="lg:col-span-2 space-y-4">
              <div className={`relative w-full h-[500px] border rounded-2xl overflow-hidden bg-[#020C24] shadow-inner transition-all duration-500 ${emergencyOverride
                  ? 'border-red-500/50 shadow-[inset_0_0_50px_rgba(239,68,68,0.2)]'
                  : 'border-[#00B4D8]/30 shadow-[inset_0_0_50px_rgba(0,180,216,0.15)]'
                }`}>

                {/* Scanline Sweep animation */}
                <div className={`absolute top-0 left-0 w-full h-[2.5px] shadow-lg pointer-events-none z-10 animate-scanline ${emergencyOverride ? 'bg-red-500 shadow-red-500' : 'bg-cyan-500 shadow-cyan-500'
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
                  <div>
                    SIGNAL: <span className="text-[#10B981] font-bold">
                      {phaseState.split('_')[0]}: GREEN [{countdown === 0 ? 'LOCKED' : `${countdown}s`}]
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-350">
                    QUEUES: <span className="text-cyan-300 font-bold">
                      N: {vehicleCounts.NORTH} | S: {vehicleCounts.SOUTH} | E: {vehicleCounts.EAST} | W: {vehicleCounts.WEST}
                    </span>
                  </div>
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
                    {countdown === 0 ? '🚨 --:--' : `00:${String(countdown).padStart(2, '0')}`}
                  </div>
                </div>

                {/* 3D WebGL Scene */}
                <Canvas camera={{ position: [0, 16, 12], fov: 45 }}>
                  <color attach="background" args={['#03045E']} />
                  <fog attach="fog" args={['#03045E', 12, 35]} />

                  <ambientLight intensity={0.7} />
                  <directionalLight position={[12, 24, 12]} intensity={2.0} castShadow />
                  <pointLight position={[0, 6, 0]} intensity={1.8} distance={15} color="#00B4D8" />

                  {/* Base Sapphire Ground Plate */}
                  <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.08, 0]}>
                    <planeGeometry args={[50, 50]} />
                    <meshStandardMaterial color="#03045E" roughness={0.9} />
                  </mesh>

                  {/* Expanded Roads (8.0 units width = 3 lanes each way, 50 units length) */}
                  {/* North-South Road */}
                  <mesh position={[0, 0.02, 0]}>
                    <boxGeometry args={[8.0, 0.04, 50]} />
                    <meshStandardMaterial color="#023E8A" roughness={0.8} />
                  </mesh>
                  {/* East-West Road */}
                  <mesh position={[0, 0.015, 0]}>
                    <boxGeometry args={[50, 0.03, 8.0]} />
                    <meshStandardMaterial color="#023E8A" roughness={0.8} />
                  </mesh>

                  {/* Solid Double Amber Median lines (#F59E0B) */}
                  <mesh position={[-0.04, 0.045, -14.2]}>
                    <boxGeometry args={[0.02, 0.01, 21.6]} />
                    <meshBasicMaterial color="#F59E0B" />
                  </mesh>
                  <mesh position={[0.04, 0.045, -14.2]}>
                    <boxGeometry args={[0.02, 0.01, 21.6]} />
                    <meshBasicMaterial color="#F59E0B" />
                  </mesh>
                  <mesh position={[-0.04, 0.045, 14.2]}>
                    <boxGeometry args={[0.02, 0.01, 21.6]} />
                    <meshBasicMaterial color="#F59E0B" />
                  </mesh>
                  <mesh position={[0.04, 0.045, 14.2]}>
                    <boxGeometry args={[0.02, 0.01, 21.6]} />
                    <meshBasicMaterial color="#F59E0B" />
                  </mesh>

                  <mesh position={[-14.2, 0.045, -0.04]}>
                    <boxGeometry args={[21.6, 0.01, 0.02]} />
                    <meshBasicMaterial color="#F59E0B" />
                  </mesh>
                  <mesh position={[-14.2, 0.045, 0.04]}>
                    <boxGeometry args={[21.6, 0.01, 0.02]} />
                    <meshBasicMaterial color="#F59E0B" />
                  </mesh>
                  <mesh position={[14.2, 0.045, -0.04]}>
                    <boxGeometry args={[21.6, 0.01, 0.02]} />
                    <meshBasicMaterial color="#F59E0B" />
                  </mesh>
                  <mesh position={[14.2, 0.045, 0.04]}>
                    <boxGeometry args={[21.6, 0.01, 0.02]} />
                    <meshBasicMaterial color="#F59E0B" />
                  </mesh>

                  {/* Dashed Lane Divider lines (separating 3 incoming and 3 outgoing lanes) - #48CAE4 */}
                  {/* NS road dashed dividers */}
                  {dividerOffsets.map(x => (
                    <group key={`div-ns-${x}`}>
                      {dashPositions.map(z => (
                        <React.Fragment key={`dash-${z}`}>
                          <mesh position={[x, 0.045, -z]}>
                            <boxGeometry args={[0.03, 0.01, 0.8]} />
                            <meshBasicMaterial color="#48CAE4" transparent opacity={0.8} />
                          </mesh>
                          <mesh position={[x, 0.045, z]}>
                            <boxGeometry args={[0.03, 0.01, 0.8]} />
                            <meshBasicMaterial color="#48CAE4" transparent opacity={0.8} />
                          </mesh>
                        </React.Fragment>
                      ))}
                    </group>
                  ))}
                  {/* EW road dashed dividers */}
                  {dividerOffsets.map(z => (
                    <group key={`div-ew-${z}`}>
                      {dashPositions.map(x => (
                        <React.Fragment key={`dash-${x}`}>
                          <mesh position={[-x, 0.045, z]}>
                            <boxGeometry args={[0.8, 0.01, 0.03]} />
                            <meshBasicMaterial color="#48CAE4" transparent opacity={0.8} />
                          </mesh>
                          <mesh position={[x, 0.045, z]}>
                            <boxGeometry args={[0.8, 0.01, 0.03]} />
                            <meshBasicMaterial color="#48CAE4" transparent opacity={0.8} />
                          </mesh>
                        </React.Fragment>
                      ))}
                    </group>
                  ))}

                  {/* Luminous Ice Cyan Road Borders (at ±4.05) */}
                  <mesh position={[-4.05, 0.041, 0]}>
                    <boxGeometry args={[0.08, 0.01, 50]} />
                    <meshStandardMaterial color="#00B4D8" emissive="#00B4D8" emissiveIntensity={1.5} />
                  </mesh>
                  <mesh position={[4.05, 0.041, 0]}>
                    <boxGeometry args={[0.08, 0.01, 50]} />
                    <meshStandardMaterial color="#00B4D8" emissive="#00B4D8" emissiveIntensity={1.5} />
                  </mesh>
                  <mesh position={[0, 0.031, -4.05]}>
                    <boxGeometry args={[50, 0.01, 0.08]} />
                    <meshStandardMaterial color="#00B4D8" emissive="#00B4D8" emissiveIntensity={1.5} />
                  </mesh>
                  <mesh position={[0, 0.031, 4.05]}>
                    <boxGeometry args={[50, 0.01, 0.08]} />
                    <meshStandardMaterial color="#00B4D8" emissive="#00B4D8" emissiveIntensity={1.5} />
                  </mesh>

                  {/* Corner Sidewalk Pads (moved outward to ±13.2, dimensions 18.4) */}
                  {/* NW Side */}
                  <mesh position={[-13.2, 0.04, -13.2]}>
                    <boxGeometry args={[18.4, 0.08, 18.4]} />
                    <meshStandardMaterial color="#0077B6" roughness={0.9} />
                    <Edges threshold={15} color="#00B4D8" width={0.5} />
                  </mesh>
                  {/* NE Side */}
                  <mesh position={[13.2, 0.04, -13.2]}>
                    <boxGeometry args={[18.4, 0.08, 18.4]} />
                    <meshStandardMaterial color="#0077B6" roughness={0.9} />
                    <Edges threshold={15} color="#00B4D8" width={0.5} />
                  </mesh>
                  {/* SW Side */}
                  <mesh position={[-13.2, 0.04, 13.2]}>
                    <boxGeometry args={[18.4, 0.08, 18.4]} />
                    <meshStandardMaterial color="#0077B6" roughness={0.9} />
                    <Edges threshold={15} color="#00B4D8" width={0.5} />
                  </mesh>
                  {/* SE Side */}
                  <mesh position={[13.2, 0.04, 13.2]}>
                    <boxGeometry args={[18.4, 0.08, 18.4]} />
                    <meshStandardMaterial color="#0077B6" roughness={0.9} />
                    <Edges threshold={15} color="#00B4D8" width={0.5} />
                  </mesh>

                  {/* Zebra Crosswalk Lines */}
                  {/* Zebra North (Z = -4.4) */}
                  {crosswalkPositions.map(x => (
                    <mesh key={`zw-n-${x}`} position={[x, 0.042, -4.4]}>
                      <boxGeometry args={[0.15, 0.01, 0.6]} />
                      <meshBasicMaterial color="#CAF0F8" />
                    </mesh>
                  ))}
                  {/* Zebra South (Z = 4.4) */}
                  {crosswalkPositions.map(x => (
                    <mesh key={`zw-s-${x}`} position={[x, 0.042, 4.4]}>
                      <boxGeometry args={[0.15, 0.01, 0.6]} />
                      <meshBasicMaterial color="#CAF0F8" />
                    </mesh>
                  ))}
                  {/* Zebra East (X = 4.4) */}
                  {crosswalkPositions.map(z => (
                    <mesh key={`zw-e-${z}`} position={[4.4, 0.038, z]}>
                      <boxGeometry args={[0.6, 0.01, 0.15]} />
                      <meshBasicMaterial color="#CAF0F8" />
                    </mesh>
                  ))}
                  {/* Zebra West (X = -4.4) */}
                  {crosswalkPositions.map(z => (
                    <mesh key={`zw-w-${z}`} position={[-4.4, 0.038, z]}>
                      <boxGeometry args={[0.6, 0.01, 0.15]} />
                      <meshBasicMaterial color="#CAF0F8" />
                    </mesh>
                  ))}

                  {/* Skyscrapers with Window Grids and Rooftop Signal Beacons */}
                  {/* NW Corner */}
                  <BuildingWithWindows position={[-7.5, 0, -7.5]} size={[2.0, 8, 2.0]} beaconColor="#EF4444" />
                  <BuildingWithWindows position={[-14.5, 0, -9.5]} size={[3.0, 12, 3.0]} beaconColor="#F59E0B" />

                  {/* NE Corner */}
                  <BuildingWithWindows position={[7.5, 0, -7.5]} size={[2.2, 10, 2.2]} beaconColor="#10B981" />
                  <BuildingWithWindows position={[14.5, 0, -12.5]} size={[3.0, 14, 3.0]} beaconColor="#EF4444" />

                  {/* SW Corner */}
                  <BuildingWithWindows position={[-8.5, 0, 8.5]} size={[2.4, 12, 2.4]} beaconColor="#EF4444" />
                  <BuildingWithWindows position={[-14.5, 0, 14.5]} size={[3.0, 8, 3.0]} beaconColor="#F59E0B" />

                  {/* SE Corner */}
                  <BuildingWithWindows position={[8.5, 0, 8.5]} size={[2.0, 9, 2.0]} beaconColor="#10B981" />
                  <BuildingWithWindows position={[14.5, 0, 9.5]} size={[2.8, 13, 2.8]} beaconColor="#EF4444" />

                  {/* 3D Trees: Scatter 16 trees systematically onto sidewalks (X/Z >= 6.0) */}
                  {/* NW Sidewalk */}
                  <Tree3D position={[-6.5, 0.08, -6.5]} />
                  <Tree3D position={[-9.5, 0.08, -6.5]} />
                  <Tree3D position={[-6.5, 0.08, -9.5]} />
                  <Tree3D position={[-12.5, 0.08, -6.5]} />

                  {/* NE Sidewalk */}
                  <Tree3D position={[6.5, 0.08, -6.5]} />
                  <Tree3D position={[9.5, 0.08, -6.5]} />
                  <Tree3D position={[6.5, 0.08, -9.5]} />
                  <Tree3D position={[12.5, 0.08, -6.5]} />

                  {/* SW Sidewalk */}
                  <Tree3D position={[-6.5, 0.08, 6.5]} />
                  <Tree3D position={[-9.5, 0.08, 6.5]} />
                  <Tree3D position={[-6.5, 0.08, 9.5]} />
                  <Tree3D position={[-12.5, 0.08, 6.5]} />

                  {/* SE Sidewalk */}
                  <Tree3D position={[6.5, 0.08, 6.5]} />
                  <Tree3D position={[9.5, 0.08, 6.5]} />
                  <Tree3D position={[6.5, 0.08, 9.5]} />
                  <Tree3D position={[12.5, 0.08, 6.5]} />

                  {/* 3D LED Streetlights casting spotlights onto road (X/Z >= 6.0) */}
                  <StreetLight3D position={[-6.2, 0.08, -6.2]} rotationY={Math.PI / 4} />
                  <StreetLight3D position={[6.2, 0.08, -6.2]} rotationY={-Math.PI / 4} />
                  <StreetLight3D position={[-6.2, 0.08, 6.2]} rotationY={(3 * Math.PI) / 4} />
                  <StreetLight3D position={[6.2, 0.08, 6.2]} rotationY={-(3 * Math.PI) / 4} />

                  {/* Pedestrian Infrastructure: Bus Shelter 3D components on sidewalk edges (X/Z >= 6.0) */}
                  <BusShelter3D position={[-9.0, 0.08, -6.2]} rotationY={Math.PI} />
                  <BusShelter3D position={[9.0, 0.08, 6.2]} rotationY={0} />

                  {/* Guard Rail Barricades along the sidewalk curbs (at ±4.2) */}
                  {/* NW Corner Guard Rails */}
                  <GuardRail position={[-10.0, 0.08, -4.2]} rotationY={0} />
                  <GuardRail position={[-4.2, 0.08, -10.0]} rotationY={Math.PI / 2} />

                  {/* NE Corner Guard Rails */}
                  <GuardRail position={[10.0, 0.08, -4.2]} rotationY={0} />
                  <GuardRail position={[4.2, 0.08, -10.0]} rotationY={Math.PI / 2} />

                  {/* SW Corner Guard Rails */}
                  <GuardRail position={[-10.0, 0.08, 4.2]} rotationY={0} />
                  <GuardRail position={[-4.2, 0.08, 10.0]} rotationY={Math.PI / 2} />

                  {/* SE Corner Guard Rails */}
                  <GuardRail position={[10.0, 0.08, 4.2]} rotationY={0} />
                  <GuardRail position={[4.2, 0.08, 10.0]} rotationY={Math.PI / 2} />

                  {/* Indian LHD Curb Signal Poles (moved outward to align with 8.0-wide road) */}
                  <SignalPole position={[4.2, 0, -4.5]} status={getPoleStatus('NORTH')} rotationY={Math.PI} />
                  <SignalPole position={[-4.2, 0, 4.5]} status={getPoleStatus('SOUTH')} rotationY={0} />
                  <SignalPole position={[4.5, 0, 4.2]} status={getPoleStatus('EAST')} rotationY={Math.PI / 2} />
                  <SignalPole position={[-4.5, 0, -4.2]} status={getPoleStatus('WEST')} rotationY={-Math.PI / 2} />

                  {/* Interactive Vehicles */}
                  <Vehicles
                    phaseState={phaseState}
                    emergencyOverride={emergencyOverride}
                    onEmergencyPassed={handleEmergencyPassed}
                    vehicleList={vehicleList}
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
                    <div>[INFO] 4-Phase sequential cycle rotating. State: {phaseState}. Timer countdown: {countdown}s.</div>
                  )}
                  <div>[INFO] 6-Lane boulevard expanded to 8.0 units width. Sub-lane containment active.</div>
                  <div>[INFO] Detailed urban props and sidewalks pushed outward (X/Z &gt;= 6.0). Overlap resolved.</div>
                </div>
              </div>

              {/* DIRECTIONAL STATUS HUD CARDS */}
              <div className="grid grid-cols-4 gap-3 font-mono">
                {['NORTH', 'SOUTH', 'EAST', 'WEST'].map((dir) => {
                  const isActive = phaseState.split('_')[0] === dir;
                  const isEmergency = emergencyOverride === dir;
                  const cars = vehicleCounts[dir] || 0;
                  const timer = directionalTimers[dir] || 15;

                  return (
                    <div 
                      key={dir} 
                      className={`p-3 rounded-xl border transition-all duration-300 ${
                        isEmergency
                          ? 'bg-red-955/45 border-red-500/50 shadow-[0_0_10px_rgba(239,68,68,0.2)] animate-pulse'
                          : isActive
                            ? 'bg-[#0077B6]/20 border-[#00B4D8]/60 shadow-[0_0_10px_rgba(0,180,216,0.15)]'
                            : 'bg-[#020C24]/40 border-[#00B4D8]/10 text-slate-400'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className={`text-[9px] font-bold ${isActive ? 'text-cyan-300' : isEmergency ? 'text-red-400 font-bold' : 'text-slate-400'}`}>
                          {dir}
                        </span>
                        {isEmergency && (
                          <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-ping" />
                        )}
                        {!isEmergency && isActive && (
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        )}
                      </div>
                      <div className="space-y-0.5">
                        <div className="text-[10px] text-slate-350 flex justify-between">
                          <span>VEHICLES:</span>
                          <span className="font-extrabold text-cyan-400">{cars}</span>
                        </div>
                        <div className="text-[10px] text-slate-350 flex justify-between">
                          <span>GREEN SEC:</span>
                          <span className="font-extrabold text-cyan-400">{timer}s</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* JUNCTION INGESTION DECK */}
              <JunctionIngestionDeck onAnalysisComplete={handleAnalysisComplete} />
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
                        className={`h-full rounded-full transition-all duration-500 ${emergencyOverride ? 'bg-red-500 shadow-[0_0_10px_#ef4444]' : 'bg-cyan-400'
                          }`}
                        style={{ width: emergencyOverride ? '100%' : '15%' }}
                      />
                    </div>
                  </div>
                </div>
              </section>

              {/* EMERGENCY OVERRIDE PANEL */}
              <section className={`p-5 rounded-2xl border font-mono text-xs space-y-4 transition-all duration-500 ${emergencyOverride
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
                    className={`py-3 px-4 rounded-xl border font-extrabold text-center transition-all cursor-pointer text-[10px] flex items-center justify-center gap-2 tracking-wide uppercase ${emergencyOverride === 'NORTH'
                        ? 'bg-red-600 border-red-400 text-white shadow-[0_0_15px_#ef4444] animate-pulse'
                        : 'bg-[#023E8A]/50 hover:bg-[#023E8A]/80 border-[#00B4D8]/30 hover:border-[#48CAE4] text-[#CAF0F8]'
                      }`}
                  >
                    🚑 NORTH LANE
                  </button>
                  {/* SOUTH LANE */}
                  <button
                    onClick={() => handleToggleEmergency('SOUTH')}
                    className={`py-3 px-4 rounded-xl border font-extrabold text-center transition-all cursor-pointer text-[10px] flex items-center justify-center gap-2 tracking-wide uppercase ${emergencyOverride === 'SOUTH'
                        ? 'bg-red-600 border-red-400 text-white shadow-[0_0_15px_#ef4444] animate-pulse'
                        : 'bg-[#023E8A]/50 hover:bg-[#023E8A]/80 border-[#00B4D8]/30 hover:border-[#48CAE4] text-[#CAF0F8]'
                      }`}
                  >
                    SOUTH LANE
                  </button>
                  {/* EAST LANE */}
                  <button
                    onClick={() => handleToggleEmergency('EAST')}
                    className={`py-3 px-4 rounded-xl border font-extrabold text-center transition-all cursor-pointer text-[10px] flex items-center justify-center gap-2 tracking-wide uppercase ${emergencyOverride === 'EAST'
                        ? 'bg-red-600 border-red-400 text-white shadow-[0_0_15px_#ef4444] animate-pulse'
                        : 'bg-[#023E8A]/50 hover:bg-[#023E8A]/80 border-[#00B4D8]/30 hover:border-[#48CAE4] text-[#CAF0F8]'
                      }`}
                  >
                    EAST LANE
                  </button>
                  {/* WEST LANE */}
                  <button
                    onClick={() => handleToggleEmergency('WEST')}
                    className={`py-3 px-4 rounded-xl border font-extrabold text-center transition-all cursor-pointer text-[10px] flex items-center justify-center gap-2 tracking-wide uppercase ${emergencyOverride === 'WEST'
                        ? 'bg-red-600 border-red-400 text-white shadow-[0_0_15px_#ef4444] animate-pulse'
                        : 'bg-[#023E8A]/50 hover:bg-[#023E8A]/80 border-[#00B4D8]/30 hover:border-[#48CAE4] text-[#CAF0F8]'
                      }`}
                  >
                    WEST LANE
                  </button>
                </div>

                {emergencyOverride && (
                  <button
                    onClick={() => handleEmergencyPassed()}
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
                    [ ALERT // EMERGENCY PRIORITY LOCK ACTIVE ]
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
                    [ OPERATION STATE // 4-PHASE SEQUENTIAL CYCLE ]
                  </h3>
                  <p className="text-[11px] text-[#CAF0F8] leading-relaxed">
                    Sequential phase cycle timing is actively computed from telemetry. Next automatic cycle rotation triggered in {countdown} seconds. Active phase: <span className="text-[#10B981] font-bold">{phaseState}</span>.
                  </p>
                </div>
              </div>
            )}
          </footer>
        </div>
      </main>
    </div>
  );
}