import { useRef, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

const MOVE_SPEED = 8;

/**
 * WASD camera movement controls.
 * W/S = move forward/backward along the ground plane (XZ)
 * A/D = strafe (pan) left/right
 * Q/Space = up, E/Shift = down
 *
 * Movement is projected onto the XZ plane so W never "zooms in"
 * (which happens when the camera is angled downward and you move
 * along the raw camera direction vector).
 */
export function WASDControls() {
  const { camera } = useThree();
  const keys = useRef<Set<string>>(new Set());
  const forward = useRef(new THREE.Vector3());
  const right = useRef(new THREE.Vector3());
  // Smooth velocity to eliminate the initial "bump" when starting movement
  const velocity = useRef(new THREE.Vector3());

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

    // Compute target velocity based on pressed keys
    const targetVel = new THREE.Vector3();

    if (k.size > 0) {
      // Get camera forward direction projected onto XZ plane (ground plane movement)
      camera.getWorldDirection(forward.current);
      forward.current.y = 0; // Project to ground plane
      forward.current.normalize();

      // Right vector is perpendicular to forward on the ground plane
      right.current.crossVectors(forward.current, camera.up).normalize();

      const speed = MOVE_SPEED;

      // W/S = forward/backward along XZ ground plane (not into the ground)
      if (k.has('w')) targetVel.addScaledVector(forward.current, speed);
      if (k.has('s')) targetVel.addScaledVector(forward.current, -speed);

      // A/D = strafe left/right
      if (k.has('a')) targetVel.addScaledVector(right.current, -speed);
      if (k.has('d')) targetVel.addScaledVector(right.current, speed);

      // Q/Space = up, E/Shift = down
      if (k.has('q') || k.has(' ')) targetVel.y += speed;
      if (k.has('e') || k.has('shift')) targetVel.y -= speed;
    }

    // Smooth interpolation toward target velocity (eliminates initial bump)
    const smoothing = 1 - Math.exp(-12 * delta); // ~12Hz smoothing
    velocity.current.lerp(targetVel, smoothing);

    // Apply velocity
    if (velocity.current.lengthSq() > 0.001) {
      camera.position.addScaledVector(velocity.current, delta);
    }
  });

  return null;
}
