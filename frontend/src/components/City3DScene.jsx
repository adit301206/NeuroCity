import React, { useRef, useState, useEffect, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Edges } from '@react-three/drei';
import * as THREE from 'three';

// 1. Procedural Window Grid Texture
function createThemeWindowTexture(bodyColor) {
  const canvasMap = document.createElement('canvas');
  canvasMap.width = 128;
  canvasMap.height = 256;
  const ctxMap = canvasMap.getContext('2d');

  const canvasEm = document.createElement('canvas');
  canvasEm.width = 128;
  canvasEm.height = 256;
  const ctxEm = canvasEm.getContext('2d');

  // Fill diffuse map with building body color
  ctxMap.fillStyle = bodyColor;
  ctxMap.fillRect(0, 0, 128, 256);

  // Fill emissive map with black (representing off lights)
  ctxEm.fillStyle = '#000000';
  ctxEm.fillRect(0, 0, 128, 256);

  const cols = 6;
  const rows = 20;
  const winW = 128 / cols;
  const winH = 256 / rows;
  const padX = winW * 0.22;
  const padY = winH * 0.22;

  // Illuminated colors matching NeuroCity specification
  const windowColors = ['#00B4D8', '#CAF0F8'];

  for (let r = 0; r < rows; r++) {
    const rowLitChance = Math.sin(r * 0.45) * 0.45 + 0.5;
    for (let c = 0; c < cols; c++) {
      // Dark Slate window frame glass base
      ctxMap.fillStyle = '#0A192F';
      ctxMap.fillRect(c * winW + padX, r * winH + padY, winW - padX * 2, winH - padY * 2);

      const isLit = Math.random() < rowLitChance * 0.75;
      if (isLit) {
        const winColor = windowColors[Math.floor(Math.random() * windowColors.length)];

        // Draw onto diffuse map
        ctxMap.fillStyle = winColor;
        ctxMap.fillRect(c * winW + padX, r * winH + padY, winW - padX * 2, winH - padY * 2);

        // Draw onto emissive map
        ctxEm.fillStyle = winColor;
        ctxEm.fillRect(c * winW + padX, r * winH + padY, winW - padX * 2, winH - padY * 2);
      }
    }
  }

  const mapTex = new THREE.CanvasTexture(canvasMap);
  const emissiveTex = new THREE.CanvasTexture(canvasEm);

  mapTex.wrapS = THREE.RepeatWrapping;
  mapTex.wrapT = THREE.RepeatWrapping;
  emissiveTex.wrapS = THREE.RepeatWrapping;
  emissiveTex.wrapT = THREE.RepeatWrapping;

  return { map: mapTex, emissiveMap: emissiveTex };
}

// Glowing Beacon Component with pulsating light
function GlowingBeacon({ position }) {
  const materialRef = useRef();

  useFrame((state) => {
    if (materialRef.current) {
      const t = state.clock.getElapsedTime();
      materialRef.current.emissiveIntensity = 3.0 + Math.sin(t * 8) * 1.5;
    }
  });

  return (
    <mesh position={position}>
      <sphereGeometry args={[0.09, 8, 8]} />
      <meshStandardMaterial
        ref={materialRef}
        color="#FF2A6D"
        emissive="#FF2A6D"
        emissiveIntensity={3.0}
      />
    </mesh>
  );
}

// Skyscraper building mesh with custom parameters
function Skyscraper({ b, windowTextureCache }) {
  const baseTextures = windowTextureCache[b.color];

  // Clone textures to allow unique tiling repeat & offsets per building
  const { map, emissiveMap } = useMemo(() => {
    const mapClone = baseTextures.map.clone();
    const emissiveClone = baseTextures.emissiveMap.clone();

    const repeatX = Math.max(1, Math.round(b.w * 1.5));
    const repeatY = Math.max(1, Math.round(b.h * 1.5));
    mapClone.repeat.set(repeatX, repeatY);
    emissiveClone.repeat.set(repeatX, repeatY);

    const seed = b.randSeed;
    mapClone.offset.set(seed, seed * 1.3);
    emissiveClone.offset.set(seed, seed * 1.3);

    mapClone.needsUpdate = true;
    emissiveClone.needsUpdate = true;

    return { map: mapClone, emissiveMap: emissiveClone };
  }, [baseTextures, b.w, b.h, b.randSeed]);

  // Clean up textures on unmount to prevent GPU memory leaks
  useEffect(() => {
    return () => {
      map.dispose();
      emissiveMap.dispose();
    };
  }, [map, emissiveMap]);

  return (
    <group>
      {/* Primary Skyscraper Box */}
      <mesh position={[b.x, b.h / 2, b.z]} castShadow receiveShadow>
        <boxGeometry args={[b.w, b.h, b.d]} />
        <meshStandardMaterial
          color={b.color}
          map={map}
          emissiveMap={emissiveMap}
          emissive="#FFFFFF"
          emissiveIntensity={1.8}
          roughness={0.2}
          metalness={0.7}
        />
        {/* Neon blue outlines */}
        <Edges threshold={15} color="#00B4D8" width={1.0} />
      </mesh>

      {/* Rooftop Antenna Spire */}
      {b.detailType === 'antenna' && (
        <group>
          <mesh position={[b.x, b.h + 0.55, b.z]}>
            <cylinderGeometry args={[0.025, 0.025, 1.1, 6]} />
            <meshStandardMaterial color="#94A3B8" roughness={0.3} metalness={0.8} />
          </mesh>
          <GlowingBeacon position={[b.x, b.h + 1.1, b.z]} />
        </group>
      )}

      {/* Rooftop Glowing Helipad Ring */}
      {b.detailType === 'helipad' && (
        <group>
          <mesh position={[b.x, b.h + 0.01, b.z]} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[0, b.w * 0.34, 32]} />
            <meshStandardMaterial color="#0A192F" roughness={0.9} />
          </mesh>
          <mesh position={[b.x, b.h + 0.02, b.z]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[b.w * 0.28, 0.03, 8, 24]} />
            <meshStandardMaterial
              color="#00B4D8"
              emissive="#00B4D8"
              emissiveIntensity={2.5}
            />
          </mesh>
        </group>
      )}
    </group>
  );
}

// Central rotating, floating 3D traffic light node
function CentralIntersectionNode({ onLaunchSimulator }) {
  const groupRef = useRef();
  const [currentColor, setCurrentColor] = useState('#10B981'); // Starts Green
  const [hovered, setHovered] = useState(false);

  // Cycle colors (Green -> Yellow -> Red)
  useEffect(() => {
    const colors = ['#10B981', '#F59E0B', '#EF4444'];
    let idx = 0;
    const interval = setInterval(() => {
      idx = (idx + 1) % colors.length;
      setCurrentColor(colors[idx]);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (groupRef.current) {
      groupRef.current.position.y = 3.8 + Math.sin(t * 1.5) * 0.35;
      groupRef.current.rotation.y = t * 1.0;
      groupRef.current.rotation.z = t * 0.25;
    }
  });

  return (
    <group
      ref={groupRef}
      onClick={(e) => {
        e.stopPropagation();
        onLaunchSimulator();
      }}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHovered(true);
      }}
      onPointerOut={() => setHovered(false)}
    >
      {/* Outer rotating cyber cage */}
      <mesh>
        <octahedronGeometry args={[1.3, 0]} />
        <meshBasicMaterial
          color={currentColor}
          wireframe
          transparent
          opacity={0.65}
        />
      </mesh>

      {/* Central Solid core */}
      <mesh>
        <sphereGeometry args={[0.52, 16, 16]} />
        <meshStandardMaterial
          color={currentColor}
          emissive={currentColor}
          emissiveIntensity={3.2}
          roughness={0.1}
          metalness={0.9}
        />
      </mesh>

      {/* Orbiting ring */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[1.6, 0.05, 12, 32]} />
        <meshBasicMaterial
          color={hovered ? '#FFFFFF' : '#00B4D8'}
          transparent
          opacity={0.8}
        />
      </mesh>

      <pointLight color={currentColor} intensity={3.5} distance={15} decay={2} />
    </group>
  );
}

// 3. Multi-Lane Traffic Particles
function TrafficParticles({ trafficConfig }) {
  const particlesRef = useRef([]);

  useFrame((state, delta) => {
    particlesRef.current.forEach((mesh, index) => {
      if (mesh) {
        const config = trafficConfig[index];
        if (config.axis === 'X') {
          let newX = mesh.position.x + config.direction * config.speed * delta;
          if (config.direction > 0 && newX > 70) newX = -70;
          if (config.direction < 0 && newX < -70) newX = 70;
          mesh.position.x = newX;
        } else {
          let newZ = mesh.position.z + config.direction * config.speed * delta;
          if (config.direction > 0 && newZ > 70) newZ = -70;
          if (config.direction < 0 && newZ < -70) newZ = 70;
          mesh.position.z = newZ;
        }
      }
    });
  });

  return (
    <group>
      {trafficConfig.map((p, i) => (
        <mesh
          key={i}
          ref={el => particlesRef.current[i] = el}
          position={
            p.axis === 'X'
              ? [p.startPos, 0.05, p.roadOffset + p.laneOffset]
              : [p.roadOffset + p.laneOffset, 0.05, p.startPos]
          }
        >
          <boxGeometry args={p.axis === 'X' ? [0.8, 0.06, 0.2] : [0.2, 0.06, 0.8]} />
          <meshBasicMaterial color={p.color} />
        </mesh>
      ))}
    </group>
  );
}

// MultiStageCameraRig for 2-Phase Cinematic Zoom Animation Sequence
function MultiStageCameraRig({ isZooming, onAnimationComplete }) {
  const progressRef = useRef(0);
  const completedRef = useRef(false);

  useFrame((state, delta) => {
    if (!isZooming) {
      progressRef.current = 0;
      completedRef.current = false;
      return;
    }

    // Increment progress by delta * 0.22 to target a ~4.5 seconds duration
    if (progressRef.current < 1) {
      progressRef.current = Math.min(progressRef.current + delta * 0.22, 1);
    }

    const progress = progressRef.current;
    const pos = new THREE.Vector3();
    const target = new THREE.Vector3();

    if (progress < 0.45) {
      // Phase 1: Descent to Main Street (0% to 45% duration)
      const t1 = progress / 0.45;
      // Gentle sine curve easing: 0.5 - Math.cos(t1 * Math.PI) / 2
      const ease1 = 0.5 - Math.cos(t1 * Math.PI) / 2;

      const startPos = new THREE.Vector3(24, 20, 24);
      const midPos = new THREE.Vector3(0, 0.7, 18);
      pos.lerpVectors(startPos, midPos, ease1);

      // Look ahead down the road
      const startTarget = new THREE.Vector3(0, 2, 0);
      const midTarget = new THREE.Vector3(0, 0.4, 0);
      target.lerpVectors(startTarget, midTarget, ease1);
    } else {
      // Phase 2: Smooth street-level cruise directly into central core (45% to 100% duration)
      const t2 = (progress - 0.45) / 0.55;
      // Linear transition for a smooth steady road cruise
      const ease2 = t2;

      const midPos = new THREE.Vector3(0, 0.7, 18);
      const endPos = new THREE.Vector3(0, 0.4, 0.2);
      pos.lerpVectors(midPos, endPos, ease2);

      const midTarget = new THREE.Vector3(0, 0.4, 0);
      const endTarget = new THREE.Vector3(0, 0.2, 0);
      target.lerpVectors(midTarget, endTarget, ease2);
    }

    state.camera.position.copy(pos);
    state.camera.lookAt(target);

    if (progress >= 0.98 && !completedRef.current) {
      completedRef.current = true;
      if (onAnimationComplete) {
        onAnimationComplete();
      }
    }
  });

  return null;
}

export default function City3DScene({ onLaunchSimulator, isZooming, onAnimationComplete }) {
  // Sector alignments adjusted to prevent clipping with widened roads
  const sectors = [-28, -20, -13, -5, 5, 13, 20, 28];
  
  // Secondary street offsets
  const secondaryRoads = [-24, -17, -9, 9, 17, 24];

  // 1. Generate window texture cache
  const windowTextureCache = useMemo(() => {
    const cache = {};
    const palette = ['#FFFFFF', '#CBD5E1', '#94A3B8', '#023E8A', '#CAF0F8'];
    palette.forEach((color) => {
      cache[color] = createThemeWindowTexture(color);
    });
    return cache;
  }, []);

  // Clean up cache
  useEffect(() => {
    return () => {
      Object.values(windowTextureCache).forEach((texSet) => {
        texSet.map.dispose();
        texSet.emissiveMap.dispose();
      });
    };
  }, [windowTextureCache]);

  // Procedural deterministic building generation
  const buildings = useMemo(() => {
    const list = [];
    const palette = [
      '#FFFFFF', // Crisp White
      '#CBD5E1', // Slate Grey Light
      '#94A3B8', // Slate Grey Dark
      '#023E8A', // Deep Sapphire
      '#CAF0F8', // Soft Ice Tint
    ];

    // 2x2 cluster offsets within blocks (reduced to 1.3 units to align safely off roads)
    const subGrid = [
      { dx: -1.3, dz: -1.3 },
      { dx: 1.3, dz: -1.3 },
      { dx: -1.3, dz: 1.3 },
      { dx: 1.3, dz: 1.3 },
    ];

    sectors.forEach((bx) => {
      sectors.forEach((bz) => {
        subGrid.forEach((offset, idx) => {
          const x = bx + offset.dx;
          const z = bz + offset.dz;

          const hash = Math.sin(x * 12.9898 + z * 78.233) * 43758.5453;
          const rand = hash - Math.floor(hash);

          const h = rand * 14.0 + 4.5;
          const w = rand * 0.4 + 1.25;
          const d = rand * 0.4 + 1.25;

          const colorIdx = Math.floor(rand * palette.length);
          const color = palette[colorIdx];

          let detailType = 'none';
          if (h > 13.0) {
            detailType = 'antenna';
          } else if (h > 8.0) {
            detailType = 'helipad';
          }

          list.push({
            id: `b-${bx}-${bz}-${idx}`,
            x,
            z,
            w,
            d,
            h,
            color,
            detailType,
            randSeed: rand,
          });
        });
      });
    });

    return list;
  }, []);

  // Generate traffic configs for primary and secondary routes (60+ active signals)
  const trafficConfig = useMemo(() => {
    const list = [];
    const colors = ['#00B4D8', '#CAF0F8', '#10B981', '#FF2A6D'];

    // Primary central highways (X axis) - 16 particles dual lane
    for (let i = 0; i < 16; i++) {
      const direction = i % 2 === 0 ? 1 : -1;
      list.push({
        axis: 'X',
        roadOffset: 0,
        laneOffset: direction > 0 ? 0.8 : -0.8,
        direction,
        speed: 10.0 + Math.random() * 8.0,
        color: colors[i % colors.length],
        startPos: (Math.random() - 0.5) * 140,
      });
    }

    // Primary central highways (Z axis) - 16 particles dual lane
    for (let i = 0; i < 16; i++) {
      const direction = i % 2 === 0 ? 1 : -1;
      list.push({
        axis: 'Z',
        roadOffset: 0,
        laneOffset: direction > 0 ? 0.8 : -0.8,
        direction,
        speed: 10.0 + Math.random() * 8.0,
        color: colors[i % colors.length],
        startPos: (Math.random() - 0.5) * 140,
      });
    }

    // Secondary streets traffic (X axis) - 24 particles
    secondaryRoads.forEach((offset, idx) => {
      for (let i = 0; i < 3; i++) {
        const direction = i % 2 === 0 ? 1 : -1;
        list.push({
          axis: 'X',
          roadOffset: offset,
          laneOffset: 0,
          direction,
          speed: 6.0 + Math.random() * 6.0,
          color: colors[(idx + i) % colors.length],
          startPos: (Math.random() - 0.5) * 140,
        });
      }
    });

    // Secondary streets traffic (Z axis) - 24 particles
    secondaryRoads.forEach((offset, idx) => {
      for (let i = 0; i < 3; i++) {
        const direction = i % 2 === 0 ? 1 : -1;
        list.push({
          axis: 'Z',
          roadOffset: offset,
          laneOffset: 0,
          direction,
          speed: 6.0 + Math.random() * 6.0,
          color: colors[(idx + i) % colors.length],
          startPos: (Math.random() - 0.5) * 140,
        });
      }
    });

    return list;
  }, []);

  return (
    <div className="w-full h-full relative">
      <Canvas
        camera={{ position: [34, 28, 34], fov: 42 }}
        shadows
        gl={{ antialias: true }}
      >
        {/* Canvas Background: Exact dark ocean sapphire */}
        <color attach="background" args={['#03045E']} />

        {/* Cinematic depth fog */}
        <fog attach="fog" args={['#03045E', 35, 90]} />

        {/* Lighting setup */}
        <ambientLight intensity={0.55} />
        <directionalLight
          position={[25, 45, 20]}
          intensity={1.4}
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
        />
        <directionalLight position={[-35, 5, -35]} intensity={0.5} color="#0077B6" />
        <pointLight position={[0, 8, 0]} intensity={1.8} distance={18} color="#00B4D8" />

        {/* Base ground plate */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
          <planeGeometry args={[140, 140]} />
          <meshStandardMaterial color="#020C24" roughness={0.9} metalness={0.2} />
        </mesh>
        
        {/* Holographic scanning grid */}
        <gridHelper args={[140, 64, '#00B4D8', '#0A192F']} position={[0, 0.01, 0]} />

        {/* 1. Widened Grand Boulevards Network */}
        <group>
          {/* X axis Central Highway (3.2 units wide) */}
          <mesh position={[0, 0.005, 0]}>
            <boxGeometry args={[140, 0.01, 3.2]} />
            <meshStandardMaterial color="#0A192F" roughness={0.7} />
          </mesh>
          <mesh position={[0, 0.008, 0]}>
            <boxGeometry args={[140, 0.01, 0.12]} />
            <meshBasicMaterial color="#CAF0F8" />
          </mesh>

          {/* Z axis Central Highway (3.2 units wide) */}
          <mesh position={[0, 0.005, 0]}>
            <boxGeometry args={[3.2, 0.01, 140]} />
            <meshStandardMaterial color="#0A192F" roughness={0.7} />
          </mesh>
          <mesh position={[0, 0.008, 0]}>
            <boxGeometry args={[0.12, 0.01, 140]} />
            <meshBasicMaterial color="#CAF0F8" />
          </mesh>
        </group>

        {/* 2. Dense Secondary Street Grid */}
        <group>
          {secondaryRoads.map((offset) => (
            <group key={offset}>
              {/* X direction secondary street */}
              <mesh position={[0, 0.004, offset]}>
                <boxGeometry args={[140, 0.01, 1.0]} />
                <meshStandardMaterial color="#0B132B" roughness={0.8} />
              </mesh>
              <mesh position={[0, 0.007, offset]}>
                <boxGeometry args={[140, 0.01, 0.04]} />
                <meshBasicMaterial color="#00B4D8" />
              </mesh>

              {/* Z direction secondary street */}
              <mesh position={[offset, 0.004, 0]}>
                <boxGeometry args={[1.0, 0.01, 140]} />
                <meshStandardMaterial color="#0B132B" roughness={0.8} />
              </mesh>
              <mesh position={[offset, 0.007, 0]}>
                <boxGeometry args={[0.04, 0.01, 140]} />
                <meshBasicMaterial color="#00B4D8" />
              </mesh>
            </group>
          ))}
        </group>

        {/* Traffic Light Signal Packets (60+ across lanes) */}
        <TrafficParticles trafficConfig={trafficConfig} />

        {/* Dense Skyscrapers Grid */}
        <group>
          {buildings.map((b) => (
            <Skyscraper
              key={b.id}
              b={b}
              windowTextureCache={windowTextureCache}
            />
          ))}
        </group>

        {/* Central Rotating Bobbing Trigger Signal Core */}
        <CentralIntersectionNode onLaunchSimulator={onLaunchSimulator} />

        {/* Camera flight sequence rig */}
        <MultiStageCameraRig isZooming={isZooming} onAnimationComplete={onAnimationComplete} />

        {/* Orbit Control setup */}
        <OrbitControls
          enabled={!isZooming}
          enableZoom={true}
          autoRotate={!isZooming}
          autoRotateSpeed={0.35}
          enablePan={false}
          maxPolarAngle={Math.PI / 2.1}
          minDistance={15}
          maxDistance={60}
          target={[0, 2, 0]}
        />
      </Canvas>
    </div>
  );
}
