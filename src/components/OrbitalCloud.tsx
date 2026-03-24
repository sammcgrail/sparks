import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { OrbitalConfig } from '../data/atoms';
import { orbitalColors } from '../data/atoms';
import { generateOrbitalPoints } from '../utils/orbitals';

interface OrbitalCloudProps {
  orbital: OrbitalConfig;
  offset?: [number, number, number];
  pointCount?: number;
}

export function OrbitalCloud({ orbital, offset = [0, 0, 0], pointCount }: OrbitalCloudProps) {
  const pointsRef = useRef<THREE.Points>(null);
  const timeRef = useRef(0);

  // Scale point count by orbital: inner orbitals get fewer points
  const numPoints = pointCount ?? Math.max(400, Math.min(2500, orbital.n * 800));

  const { positions, basePositions, color, size } = useMemo(() => {
    const pos = generateOrbitalPoints(orbital, numPoints, offset);
    const base = new Float32Array(pos);
    const col = orbitalColors[orbital.l] || '#ffffff';
    // Inner orbitals get smaller points
    const sz = orbital.n === 1 ? 0.04 : orbital.n === 2 ? 0.05 : orbital.n === 3 ? 0.055 : 0.06;
    return { positions: pos, basePositions: base, color: col, size: sz };
  }, [orbital.n, orbital.l, orbital.m, numPoints, offset[0], offset[1], offset[2]]);

  // Generate per-particle random offsets for animation
  const randomOffsets = useMemo(() => {
    const offsets = new Float32Array(numPoints * 3);
    for (let i = 0; i < numPoints * 3; i++) {
      offsets[i] = (Math.random() - 0.5) * 2;
    }
    return offsets;
  }, [numPoints]);

  // Per-particle random speeds
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
    const geo = pointsRef.current.geometry;
    const posAttr = geo.getAttribute('position') as THREE.BufferAttribute;
    const arr = posAttr.array as Float32Array;

    // Gentle floating animation - each point oscillates slightly around its base position
    const amplitude = 0.06 * orbital.n;
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

  // Create opacity based on electron count (fuller orbital = more opaque)
  const opacity = 0.4 + (orbital.electrons / (2 * (2 * orbital.l + 1))) * 0.4;

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
          count={numPoints}
        />
      </bufferGeometry>
      <pointsMaterial
        size={size}
        color={color}
        transparent
        opacity={opacity}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
}
