import { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { generateNucleusPositions } from '../utils/orbitals';

interface NucleusProps {
  protons: number;
  neutrons: number;
  offset?: [number, number, number];
}

/**
 * GPU-animated nucleus — jiggle animation runs entirely on the vertex shader.
 * No per-frame CPU iteration over nucleons.
 */

const nucleonVertexShader = /* glsl */ `
  uniform float uTime;
  varying vec3 vNormal;
  varying vec3 vViewPosition;
  varying vec3 vInstanceColor;

  attribute vec3 instanceColorAttr;

  void main() {
    vInstanceColor = instanceColorAttr;

    // Subtle jiggle: each instance gets a unique phase from its position
    float phase = position.x * 31.7 + position.y * 17.3 + position.z * 11.1;
    vec3 jiggle = vec3(
      sin(uTime * 3.0 + phase) * 0.01,
      cos(uTime * 2.5 + phase * 0.7) * 0.01,
      sin(uTime * 2.0 + phase * 1.3) * 0.01
    );

    vec3 transformed = position + jiggle;
    vec4 mvPosition = modelViewMatrix * instanceMatrix * vec4(transformed, 1.0);
    vViewPosition = -mvPosition.xyz;
    vNormal = normalMatrix * mat3(instanceMatrix) * normal;

    gl_Position = projectionMatrix * mvPosition;
  }
`;

const nucleonFragmentShader = /* glsl */ `
  varying vec3 vNormal;
  varying vec3 vViewPosition;
  varying vec3 vInstanceColor;

  void main() {
    vec3 normal = normalize(vNormal);
    vec3 viewDir = normalize(vViewPosition);

    // Simple diffuse + emissive lighting
    float diffuse = max(dot(normal, vec3(0.5, 0.5, 0.5)), 0.0);
    vec3 color = vInstanceColor * (0.5 + 0.5 * diffuse);

    // Emissive glow
    color += vInstanceColor * 0.4;

    gl_FragColor = vec4(color, 1.0);
  }
`;

export function Nucleus({ protons, neutrons, offset = [0, 0, 0] }: NucleusProps) {
  const protonMeshRef = useRef<THREE.InstancedMesh>(null);
  const neutronMeshRef = useRef<THREE.InstancedMesh>(null);
  const protonMatRef = useRef<THREE.ShaderMaterial>(null);
  const neutronMatRef = useRef<THREE.ShaderMaterial>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  const timeRef = useRef(0);
  const tempObject = useMemo(() => new THREE.Object3D(), []);

  const { protonPositions, neutronPositions } = useMemo(
    () => generateNucleusPositions(protons, neutrons, offset),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [protons, neutrons, offset[0], offset[1], offset[2]]
  );

  const nucleonSize = Math.max(0.06, 0.12 - (protons + neutrons) * 0.001);
  const glowSize = Math.pow(protons + neutrons, 1 / 3) * 0.25 + 0.2;

  // Initialize instanced meshes + per-instance colors
  useEffect(() => {
    if (protonMeshRef.current) {
      const colors = new Float32Array(protons * 3);
      for (let i = 0; i < protons; i++) {
        tempObject.position.set(
          protonPositions[i * 3],
          protonPositions[i * 3 + 1],
          protonPositions[i * 3 + 2]
        );
        tempObject.updateMatrix();
        protonMeshRef.current.setMatrixAt(i, tempObject.matrix);
        colors[i * 3] = 1.0;     // R
        colors[i * 3 + 1] = 0.42; // G
        colors[i * 3 + 2] = 0.21; // B (#ff6b35)
      }
      protonMeshRef.current.instanceMatrix.needsUpdate = true;
      // Set per-instance color attribute
      protonMeshRef.current.geometry.setAttribute(
        'instanceColorAttr',
        new THREE.InstancedBufferAttribute(colors, 3)
      );
    }
  }, [protonPositions, protons, tempObject]);

  useEffect(() => {
    if (neutronMeshRef.current) {
      const colors = new Float32Array(neutrons * 3);
      for (let i = 0; i < neutrons; i++) {
        tempObject.position.set(
          neutronPositions[i * 3],
          neutronPositions[i * 3 + 1],
          neutronPositions[i * 3 + 2]
        );
        tempObject.updateMatrix();
        neutronMeshRef.current.setMatrixAt(i, tempObject.matrix);
        colors[i * 3] = 0.494;   // R
        colors[i * 3 + 1] = 0.718; // G
        colors[i * 3 + 2] = 0.855; // B (#7eb8da)
      }
      neutronMeshRef.current.instanceMatrix.needsUpdate = true;
      neutronMeshRef.current.geometry.setAttribute(
        'instanceColorAttr',
        new THREE.InstancedBufferAttribute(colors, 3)
      );
    }
  }, [neutronPositions, neutrons, tempObject]);

  // Only update the time uniform — no per-nucleon CPU work
  useFrame((_, delta) => {
    timeRef.current += delta;

    if (glowRef.current) {
      const scale = glowSize * (1 + Math.sin(timeRef.current * 2) * 0.08);
      glowRef.current.scale.setScalar(scale);
    }

    if (protonMatRef.current) {
      protonMatRef.current.uniforms.uTime.value = timeRef.current;
    }
    if (neutronMatRef.current) {
      neutronMatRef.current.uniforms.uTime.value = timeRef.current;
    }
  });

  return (
    <group>
      <mesh ref={glowRef} position={offset}>
        <sphereGeometry args={[1, 16, 16]} />
        <meshBasicMaterial
          color="#ff8c42"
          transparent
          opacity={0.15}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      <mesh position={offset}>
        <sphereGeometry args={[glowSize * 0.3, 16, 16]} />
        <meshBasicMaterial
          color="#ffcc80"
          transparent
          opacity={0.6}
        />
      </mesh>

      {protons > 0 && (
        <instancedMesh ref={protonMeshRef} args={[undefined, undefined, protons]}>
          <sphereGeometry args={[nucleonSize, 8, 8]} />
          <shaderMaterial
            ref={protonMatRef}
            vertexShader={nucleonVertexShader}
            fragmentShader={nucleonFragmentShader}
            uniforms={{ uTime: { value: 0 } }}
          />
        </instancedMesh>
      )}

      {neutrons > 0 && (
        <instancedMesh ref={neutronMeshRef} args={[undefined, undefined, neutrons]}>
          <sphereGeometry args={[nucleonSize, 8, 8]} />
          <shaderMaterial
            ref={neutronMatRef}
            vertexShader={nucleonVertexShader}
            fragmentShader={nucleonFragmentShader}
            uniforms={{ uTime: { value: 0 } }}
          />
        </instancedMesh>
      )}
    </group>
  );
}
