import { useRef, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';

const MOVE_SPEED = 8;
// Movement keys — Shift REMOVED to avoid conflict with Cmd+Shift+4 (screenshot)
// Down is now E only (Q = up, E = down, or Space = up)
const MOVEMENT_KEYS = new Set(['w', 'a', 's', 'd', 'q', 'e', ' ']);

interface WASDControlsProps {
  controlsRef: React.RefObject<OrbitControlsImpl | null>;
}

/**
 * WASD camera movement that works WITH OrbitControls.
 *
 * W/S = forward/backward on XZ ground plane
 * A/D = strafe left/right
 * Q/Space = up, E = down
 *
 * Modifier-key awareness:
 * - Any keydown with meta/ctrl/alt held → clear all movement keys
 *   (prevents Cmd+Shift+4 screenshot from triggering downward movement)
 * - Shift removed from movement keys entirely to avoid OS shortcut conflicts
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

      // If any system modifier is held, clear all movement — user is doing
      // a keyboard shortcut (Cmd+Shift+4, Ctrl+C, Alt+Tab, etc.), not WASD
      if (e.metaKey || e.ctrlKey || e.altKey) {
        clearKeys();
        return;
      }

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
    window.addEventListener('blur', clearKeys);
    document.addEventListener('visibilitychange', handleVisibilityChange);
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
      if (k.has('e')) targetVel.y -= speed;
    }

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
