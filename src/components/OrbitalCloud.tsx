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

// Vertex shader: GPU-based subtle floating animation
const vertexShader = /* glsl */ `
  uniform float uTime;
  uniform float uAmplitude;
  uniform float uPointSize;

  attribute vec3 randomOffset;
  attribute float randomSpeed;
  attribute vec3 color;

  varying vec3 vColor;

  void main() {
    vColor = color;

    float speed = randomSpeed;
    float phase = float(gl_VertexID) * 0.1;

    vec3 displaced = position;
    displaced.x += sin(uTime * speed + phase) * randomOffset.x * uAmplitude;
    displaced.y += cos(uTime * speed * 0.8 + phase) * randomOffset.y * uAmplitude;
    displaced.z += sin(uTime * speed * 0.6 + phase + 1.0) * randomOffset.z * uAmplitude;

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

    // Discard outside circle
    if (dist > 0.5) discard;

    // Solid core with soft edge falloff — much more opaque than before
    float alpha = 1.0 - smoothstep(0.3, 0.5, dist);

    gl_FragColor = vec4(vColor, alpha * 0.85);
  }
`;

interface OrbitalCloudProps {
  orbital: OrbitalConfig;
  offset?: [number, number, number];
  pointCount?: number;
}

export function OrbitalCloud({ orbital, offset = [0, 0, 0], pointCount }: OrbitalCloudProps) {
  const materialRef = useRef<THREE.ShaderMaterial>(null);

  // Many more points for dense, solid-looking orbital lobes
  const numPoints = pointCount ?? Math.max(4000, Math.min(12000, orbital.n * 3000));

  const { geometry, amplitude, pointSize } = useMemo(() => {
    const { positions, phases } = generateOrbitalPoints(orbital, numPoints, offset);

    const colArray = new Float32Array(numPoints * 3);
    const posColor = new THREE.Color(phasePositiveColors[orbital.l] || '#ffffff');
    const negColor = new THREE.Color(phaseNegativeColors[orbital.l] || '#ffffff');

    for (let i = 0; i < numPoints; i++) {
      const c = phases[i] >= 0 ? posColor : negColor;
      colArray[i * 3] = c.r;
      colArray[i * 3 + 1] = c.g;
      colArray[i * 3 + 2] = c.b;
    }

    // Per-particle random offsets for floating animation
    const randOffsets = new Float32Array(numPoints * 3);
    for (let i = 0; i < numPoints * 3; i++) {
      randOffsets[i] = (Math.random() - 0.5) * 2;
    }

    const randSpeeds = new Float32Array(numPoints);
    for (let i = 0; i < numPoints; i++) {
      randSpeeds[i] = 0.3 + Math.random() * 0.7;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colArray, 3));
    geo.setAttribute('randomOffset', new THREE.BufferAttribute(randOffsets, 3));
    geo.setAttribute('randomSpeed', new THREE.BufferAttribute(randSpeeds, 1));

    // Larger point sizes so points overlap and form solid-looking surfaces
    const sz = orbital.n === 1 ? 0.18 : orbital.n === 2 ? 0.20 : orbital.n === 3 ? 0.22 : 0.24;
    // Very subtle animation — keeps lobes crisp while feeling alive
    const amp = 0.008 * orbital.n;

    return { geometry: geo, amplitude: amp, pointSize: sz };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orbital.n, orbital.l, orbital.m, numPoints, offset[0], offset[1], offset[2]]);

  // Only update the time uniform each frame — no per-point CPU work
  useFrame((_, delta) => {
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value += delta;
    }
  });

  return (
    <points geometry={geometry}>
      <shaderMaterial
        ref={materialRef}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={{
          uTime: { value: 0 },
          uAmplitude: { value: amplitude },
          uPointSize: { value: pointSize },
        }}
        transparent
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
}
