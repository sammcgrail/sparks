import { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { generateNucleusPositions } from '../utils/orbitals';

interface NucleusProps {
  protons: number;
  neutrons: number;
  offset?: [number, number, number];
}

const protonColor = new THREE.Color('#ff6b35');
const neutronColor = new THREE.Color('#7eb8da');

export function Nucleus({ protons, neutrons, offset = [0, 0, 0] }: NucleusProps) {
  const protonMeshRef = useRef<THREE.InstancedMesh>(null);
  const neutronMeshRef = useRef<THREE.InstancedMesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  const timeRef = useRef(0);
  // Per-instance tempObject to avoid shared state race condition
  const tempObject = useMemo(() => new THREE.Object3D(), []);

  const { protonPositions, neutronPositions } = useMemo(
    () => generateNucleusPositions(protons, neutrons, offset),
    [protons, neutrons, offset[0], offset[1], offset[2]]
  );

  const nucleonSize = Math.max(0.06, 0.12 - (protons + neutrons) * 0.001);
  const glowSize = Math.pow(protons + neutrons, 1 / 3) * 0.25 + 0.2;

  // Initialize instanced meshes via useEffect (not useMemo)
  useEffect(() => {
    if (protonMeshRef.current) {
      for (let i = 0; i < protons; i++) {
        tempObject.position.set(
          protonPositions[i * 3],
          protonPositions[i * 3 + 1],
          protonPositions[i * 3 + 2]
        );
        tempObject.updateMatrix();
        protonMeshRef.current.setMatrixAt(i, tempObject.matrix);
        protonMeshRef.current.setColorAt(i, protonColor);
      }
      protonMeshRef.current.instanceMatrix.needsUpdate = true;
      if (protonMeshRef.current.instanceColor)
        protonMeshRef.current.instanceColor.needsUpdate = true;
    }
  }, [protonPositions, protons, tempObject]);

  useEffect(() => {
    if (neutronMeshRef.current) {
      for (let i = 0; i < neutrons; i++) {
        tempObject.position.set(
          neutronPositions[i * 3],
          neutronPositions[i * 3 + 1],
          neutronPositions[i * 3 + 2]
        );
        tempObject.updateMatrix();
        neutronMeshRef.current.setMatrixAt(i, tempObject.matrix);
        neutronMeshRef.current.setColorAt(i, neutronColor);
      }
      neutronMeshRef.current.instanceMatrix.needsUpdate = true;
      if (neutronMeshRef.current.instanceColor)
        neutronMeshRef.current.instanceColor.needsUpdate = true;
    }
  }, [neutronPositions, neutrons, tempObject]);

  useFrame((_, delta) => {
    timeRef.current += delta;

    if (glowRef.current) {
      const scale = glowSize * (1 + Math.sin(timeRef.current * 2) * 0.08);
      glowRef.current.scale.setScalar(scale);
    }

    // Subtle jiggle on nucleons
    if (protonMeshRef.current) {
      const t = timeRef.current;
      for (let i = 0; i < protons; i++) {
        tempObject.position.set(
          protonPositions[i * 3] + Math.sin(t * 3 + i) * 0.01,
          protonPositions[i * 3 + 1] + Math.cos(t * 2.5 + i * 0.7) * 0.01,
          protonPositions[i * 3 + 2] + Math.sin(t * 2 + i * 1.3) * 0.01
        );
        tempObject.updateMatrix();
        protonMeshRef.current.setMatrixAt(i, tempObject.matrix);
      }
      protonMeshRef.current.instanceMatrix.needsUpdate = true;
    }

    if (neutronMeshRef.current) {
      const t = timeRef.current;
      for (let i = 0; i < neutrons; i++) {
        tempObject.position.set(
          neutronPositions[i * 3] + Math.cos(t * 2.8 + i) * 0.01,
          neutronPositions[i * 3 + 1] + Math.sin(t * 3.2 + i * 0.5) * 0.01,
          neutronPositions[i * 3 + 2] + Math.cos(t * 2.3 + i * 1.1) * 0.01
        );
        tempObject.updateMatrix();
        neutronMeshRef.current.setMatrixAt(i, tempObject.matrix);
      }
      neutronMeshRef.current.instanceMatrix.needsUpdate = true;
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
          <meshStandardMaterial
            color="#ff6b35"
            emissive="#ff6b35"
            emissiveIntensity={0.5}
            roughness={0.3}
          />
        </instancedMesh>
      )}

      {neutrons > 0 && (
        <instancedMesh ref={neutronMeshRef} args={[undefined, undefined, neutrons]}>
          <sphereGeometry args={[nucleonSize, 8, 8]} />
          <meshStandardMaterial
            color="#7eb8da"
            emissive="#7eb8da"
            emissiveIntensity={0.3}
            roughness={0.3}
          />
        </instancedMesh>
      )}
    </group>
  );
}
