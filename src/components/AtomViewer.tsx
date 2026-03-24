import { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { AtomData } from '../data/atoms';
import { generateOrbitalPoints } from '../utils/orbitals';
import { Nucleus } from './Nucleus';

interface AtomViewerProps {
  atom: AtomData;
  offset?: [number, number, number];
}

// Phase colors per orbital type
const phasePositiveColors: Record<number, THREE.Color> = {
  0: new THREE.Color('#4ecdc4'),
  1: new THREE.Color('#ff6b6b'),
  2: new THREE.Color('#ffb347'),
  3: new THREE.Color('#ff6b6b'),
};

const phaseNegativeColors: Record<number, THREE.Color> = {
  0: new THREE.Color('#4ecdc4'),
  1: new THREE.Color('#4ecdc4'),
  2: new THREE.Color('#45b7d1'),
  3: new THREE.Color('#45b7d1'),
};

// Vertex shader: GPU-based subtle floating animation
const vertexShader = /* glsl */ `
  uniform float uTime;
  uniform float uPointSize;

  attribute vec3 randomOffset;
  attribute float randomSpeed;
  attribute float amplitude;
  attribute vec3 color;

  varying vec3 vColor;

  void main() {
    vColor = color;

    float speed = randomSpeed;
    float phase = float(gl_VertexID) * 0.1;

    vec3 displaced = position;
    displaced.x += sin(uTime * speed + phase) * randomOffset.x * amplitude;
    displaced.y += cos(uTime * speed * 0.8 + phase) * randomOffset.y * amplitude;
    displaced.z += sin(uTime * speed * 0.6 + phase + 1.0) * randomOffset.z * amplitude;

    vec4 mvPosition = modelViewMatrix * vec4(displaced, 1.0);
    gl_PointSize = uPointSize * (300.0 / -mvPosition.z);
    gl_Position = projectionMatrix * mvPosition;
  }
`;

// Fragment shader: solid circular points with soft edge
const fragmentShader = /* glsl */ `
  varying vec3 vColor;

  void main() {
    vec2 center = gl_PointCoord - vec2(0.5);
    float dist = length(center);

    if (dist > 0.5) discard;

    float alpha = 1.0 - smoothstep(0.3, 0.5, dist);

    gl_FragColor = vec4(vColor, alpha * 0.85);
  }
`;

/**
 * Performance budget: cap total points so heavy atoms stay fast.
 * All orbitals are merged into a SINGLE draw call (one BufferGeometry).
 * This eliminates per-orbital WebGL draw call overhead.
 */
const MAX_TOTAL_POINTS = 50000;

function computePointBudgets(atom: AtomData): number[] {
  const numOrbitals = atom.orbitals.length;
  const budgetPerOrbital = Math.floor(MAX_TOTAL_POINTS / numOrbitals);

  return atom.orbitals.map((orbital) => {
    const baseCount = Math.max(1500, Math.min(8000, orbital.n * 2500));
    return Math.min(baseCount, Math.max(1500, budgetPerOrbital));
  });
}

export function AtomViewer({ atom, offset = [0, 0, 0] }: AtomViewerProps) {
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const geometryRef = useRef<THREE.BufferGeometry | null>(null);

  // Merge ALL orbital points into a single geometry = single draw call
  const { geometry, totalPoints } = useMemo(() => {
    const budgets = computePointBudgets(atom);
    const totalPts = budgets.reduce((s, b) => s + b, 0);

    const allPositions = new Float32Array(totalPts * 3);
    const allColors = new Float32Array(totalPts * 3);
    const allRandOffsets = new Float32Array(totalPts * 3);
    const allRandSpeeds = new Float32Array(totalPts);
    const allAmplitudes = new Float32Array(totalPts);

    let writeIndex = 0;

    for (let oi = 0; oi < atom.orbitals.length; oi++) {
      const orbital = atom.orbitals[oi];
      const numPoints = budgets[oi];
      const { positions, phases } = generateOrbitalPoints(orbital, numPoints, offset);

      const posColor = phasePositiveColors[orbital.l] || phasePositiveColors[0];
      const negColor = phaseNegativeColors[orbital.l] || phaseNegativeColors[0];
      const amp = 0.008 * orbital.n;

      for (let i = 0; i < numPoints; i++) {
        const idx = writeIndex + i;
        allPositions[idx * 3] = positions[i * 3];
        allPositions[idx * 3 + 1] = positions[i * 3 + 1];
        allPositions[idx * 3 + 2] = positions[i * 3 + 2];

        const c = phases[i] >= 0 ? posColor : negColor;
        allColors[idx * 3] = c.r;
        allColors[idx * 3 + 1] = c.g;
        allColors[idx * 3 + 2] = c.b;

        allRandOffsets[idx * 3] = (Math.random() - 0.5) * 2;
        allRandOffsets[idx * 3 + 1] = (Math.random() - 0.5) * 2;
        allRandOffsets[idx * 3 + 2] = (Math.random() - 0.5) * 2;

        allRandSpeeds[idx] = 0.3 + Math.random() * 0.7;
        allAmplitudes[idx] = amp;
      }

      writeIndex += numPoints;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(allPositions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(allColors, 3));
    geo.setAttribute('randomOffset', new THREE.BufferAttribute(allRandOffsets, 3));
    geo.setAttribute('randomSpeed', new THREE.BufferAttribute(allRandSpeeds, 1));
    geo.setAttribute('amplitude', new THREE.BufferAttribute(allAmplitudes, 1));

    // Dispose previous geometry
    if (geometryRef.current) {
      geometryRef.current.dispose();
    }
    geometryRef.current = geo;

    return { geometry: geo, totalPoints: totalPts };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [atom, offset[0], offset[1], offset[2]]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (geometryRef.current) {
        geometryRef.current.dispose();
      }
    };
  }, []);

  // Average point size based on max n
  const maxN = Math.max(...atom.orbitals.map(o => o.n));
  const pointSize = maxN <= 1 ? 0.18 : maxN <= 2 ? 0.20 : maxN <= 3 ? 0.22 : 0.24;

  // Only update time uniform per frame — everything else is GPU
  useFrame((_, delta) => {
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value += delta;
    }
  });

  return (
    <group>
      <Nucleus
        protons={atom.protons}
        neutrons={atom.neutrons}
        offset={offset}
      />
      {totalPoints > 0 && (
        <points geometry={geometry}>
          <shaderMaterial
            ref={materialRef}
            vertexShader={vertexShader}
            fragmentShader={fragmentShader}
            uniforms={{
              uTime: { value: 0 },
              uPointSize: { value: pointSize },
            }}
            transparent
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </points>
      )}
    </group>
  );
}
