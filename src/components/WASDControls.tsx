import { useRef, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';

const MOVE_SPEED = 8;

interface WASDControlsProps {
  /** Ref to OrbitControls — WASD moves both camera and target together */
  controlsRef: React.RefObject<OrbitControlsImpl | null>;
}

/**
 * WASD camera movement that works WITH OrbitControls.
 *
 * The key insight: OrbitControls orbits the camera around a target point.
 * If we only move the camera, OrbitControls pulls it back toward the target.
 * Fix: move BOTH camera.position AND controls.target by the same delta.
 * This translates the entire orbit rig through the scene.
 *
 * W/S = forward/backward on XZ ground plane
 * A/D = strafe left/right
 * Q/Space = up, E/Shift = down
 */
export function WASDControls({ controlsRef }: WASDControlsProps) {
  const { camera } = useThree();
  const keys = useRef<Set<string>>(new Set());
  const forward = useRef(new THREE.Vector3());
  const right = useRef(new THREE.Vector3());
  const velocity = useRef(new THREE.Vector3());
  const moveDelta = useRef(new THREE.Vector3());

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      keys.current.add(e.key.toLowerCase());
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      keys.current.delete(e.key.toLowerCase());
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  useFrame((_, delta) => {
    const k = keys.current;
    const targetVel = new THREE.Vector3();

    if (k.size > 0) {
      // Forward direction projected onto XZ ground plane
      camera.getWorldDirection(forward.current);
      forward.current.y = 0;
      forward.current.normalize();

      right.current.crossVectors(forward.current, camera.up).normalize();

      const speed = MOVE_SPEED;

      if (k.has('w')) targetVel.addScaledVector(forward.current, speed);
      if (k.has('s')) targetVel.addScaledVector(forward.current, -speed);
      if (k.has('a')) targetVel.addScaledVector(right.current, -speed);
      if (k.has('d')) targetVel.addScaledVector(right.current, speed);
      if (k.has('q') || k.has(' ')) targetVel.y += speed;
      if (k.has('e') || k.has('shift')) targetVel.y -= speed;
    }

    // Smooth interpolation (eliminates initial bump)
    const smoothing = 1 - Math.exp(-12 * delta);
    velocity.current.lerp(targetVel, smoothing);

    if (velocity.current.lengthSq() > 0.001) {
      // Compute the movement delta for this frame
      moveDelta.current.copy(velocity.current).multiplyScalar(delta);

      // Move camera
      camera.position.add(moveDelta.current);

      // Move OrbitControls target by the SAME delta — this is the fix.
      // Without this, OrbitControls fights WASD because it keeps
      // orbiting around the old (0,0,0) target.
      if (controlsRef.current) {
        controlsRef.current.target.add(moveDelta.current);
      }
    }
  });

  return null;
}
