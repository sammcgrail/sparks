import { useRef, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';

const MOVE_SPEED = 8;
// Only these keys drive camera movement — ignore everything else
const MOVEMENT_KEYS = new Set(['w', 'a', 's', 'd', 'q', 'e', ' ', 'shift']);

interface WASDControlsProps {
  controlsRef: React.RefObject<OrbitControlsImpl | null>;
}

/**
 * WASD camera movement that works WITH OrbitControls.
 *
 * Moves both camera.position AND controls.target by the same delta
 * so the orbit rig translates through the scene as a unit.
 *
 * Stuck-key prevention:
 * - Only tracks WASD/Q/E/Space/Shift (ignores all other keys)
 * - Clears all keys on window blur, visibilitychange, and pointerdown
 *   (covers tab-away, alt-tab, clicking UI buttons, etc.)
 * - Smooth velocity decay means even a stuck key resolves quickly
 *   when the clear fires
 */
export function WASDControls({ controlsRef }: WASDControlsProps) {
  const { camera } = useThree();
  const keys = useRef<Set<string>>(new Set());
  const forward = useRef(new THREE.Vector3());
  const right = useRef(new THREE.Vector3());
  const velocity = useRef(new THREE.Vector3());
  const moveDelta = useRef(new THREE.Vector3());

  useEffect(() => {
    const clearKeys = () => {
      keys.current.clear();
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      const key = e.key.toLowerCase();
      if (MOVEMENT_KEYS.has(key)) {
        keys.current.add(key);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keys.current.delete(e.key.toLowerCase());
    };

    const handleVisibilityChange = () => {
      if (document.hidden) clearKeys();
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    // Clear keys when window loses focus (alt-tab, clicking another window)
    window.addEventListener('blur', clearKeys);
    // Clear keys when tab becomes hidden
    document.addEventListener('visibilitychange', handleVisibilityChange);
    // Clear keys when user clicks UI elements (pointer goes to buttons etc.)
    // Use capture phase so it fires before the click handler
    window.addEventListener('pointerdown', clearKeys, true);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('blur', clearKeys);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('pointerdown', clearKeys, true);
    };
  }, []);

  useFrame((_, delta) => {
    const k = keys.current;
    const targetVel = new THREE.Vector3();

    if (k.size > 0) {
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

    // Smooth interpolation — also means stuck keys decelerate smoothly
    // when clearKeys fires
    const smoothing = 1 - Math.exp(-12 * delta);
    velocity.current.lerp(targetVel, smoothing);

    if (velocity.current.lengthSq() > 0.001) {
      moveDelta.current.copy(velocity.current).multiplyScalar(delta);

      camera.position.add(moveDelta.current);

      if (controlsRef.current) {
        controlsRef.current.target.add(moveDelta.current);
      }
    }
  });

  return null;
}
