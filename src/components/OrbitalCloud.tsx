import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { OrbitalConfig } from '../data/atoms';
import { generateOrbitalPoints } from '../utils/orbitals';

// Phase colors: warm = positive lobe, cool = negative lobe
const phasePositiveColors: Record<number, string> = {
  0: '#4ecdc4', // s - teal (no phase distinction)
  1: '#ff6b6b', // p - red for positive
  2: '#ffb347', // d - orange for positive
  3: '#ff6b6b', // f - red for positive
};

const phaseNegativeColors: Record<number, string> = {
  0: '#4ecdc4', // s - same (spherically symmetric)
  1: '#4ecdc4', // p - teal for negative
  2: '#45b7d1', // d - blue for negative
  3: '#45b7d1', // f - blue for negative
};

interface OrbitalCloudProps {
  orbital: OrbitalConfig;
  offset?: [number, number, number];
  pointCount?: number;
}

export function OrbitalCloud({ orbital, offset = [0, 0, 0], pointCount }: OrbitalCloudProps) {
  const pointsRef = useRef<THREE.Points>(null);
  const timeRef = useRef(0);

  // More points for higher-n orbitals (they cover more volume)
  const numPoints = pointCount ?? Math.max(600, Math.min(3500, orbital.n * 1000));

  const { positions, basePositions, colors, size } = useMemo(() => {
    const { positions: pos, phases } = generateOrbitalPoints(orbital, numPoints, offset);
    const base = new Float32Array(pos);

    // Generate per-point colors based on phase
    const colArray = new Float32Array(numPoints * 3);
    const posColor = new THREE.Color(phasePositiveColors[orbital.l] || '#ffffff');
    const negColor = new THREE.Color(phaseNegativeColors[orbital.l] || '#ffffff');

    for (let i = 0; i < numPoints; i++) {
      const c = phases[i] >= 0 ? posColor : negColor;
      colArray[i * 3] = c.r;
      colArray[i * 3 + 1] = c.g;
      colArray[i * 3 + 2] = c.b;
    }

    // Smaller points for crisper shapes
    const sz = orbital.n === 1 ? 0.035 : orbital.n === 2 ? 0.04 : orbital.n === 3 ? 0.045 : 0.05;
    return { positions: pos, basePositions: base, colors: colArray, size: sz };
  }, [orbital.n, orbital.l, orbital.m, numPoints, offset[0], offset[1], offset[2]]);

  // Per-particle random offsets for gentle floating
  const randomOffsets = useMemo(() => {
    const offsets = new Float32Array(numPoints * 3);
    for (let i = 0; i < numPoints * 3; i++) {
      offsets[i] = (Math.random() - 0.5) * 2;
    }
    return offsets;
  }, [numPoints]);

  const randomSpeeds = useMemo(() => {
    const speeds = new Float32Array(numPoints);
    for (let i = 0; i < numPoints; i++) {
      speeds[i] = 0.3 + Math.random() * 0.7;
    }
    return speeds;
  }, [numPoints]);

  useFrame((_, delta) => {
    if (!pointsRef.current) return;
    timeRef.current += delta;
    const t = timeRef.current;
    const posAttr = pointsRef.current.geometry.getAttribute('position') as THREE.BufferAttribute;
    const arr = posAttr.array as Float32Array;

    // Gentle floating animation
    const amplitude = 0.04 * orbital.n;
    for (let i = 0; i < numPoints; i++) {
      const speed = randomSpeeds[i];
      const phase = i * 0.1;
      const dx = Math.sin(t * speed + phase) * randomOffsets[i * 3] * amplitude;
      const dy = Math.cos(t * speed * 0.8 + phase) * randomOffsets[i * 3 + 1] * amplitude;
      const dz = Math.sin(t * speed * 0.6 + phase + 1) * randomOffsets[i * 3 + 2] * amplitude;

      arr[i * 3] = basePositions[i * 3] + dx;
      arr[i * 3 + 1] = basePositions[i * 3 + 1] + dy;
      arr[i * 3 + 2] = basePositions[i * 3 + 2] + dz;
    }
    posAttr.needsUpdate = true;
  });

  const opacity = 0.5 + (orbital.electrons / (2 * (2 * orbital.l + 1))) * 0.3;

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
          count={numPoints}
        />
        <bufferAttribute
          attach="attributes-color"
          args={[colors, 3]}
          count={numPoints}
        />
      </bufferGeometry>
      <pointsMaterial
        size={size}
        vertexColors
        transparent
        opacity={opacity}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
}
