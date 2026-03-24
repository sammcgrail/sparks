import { useRef, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

const MOVE_SPEED = 8;

/**
 * WASD camera movement controls.
 * W/S = forward/backward, A/D = strafe left/right
 * Q/E = up/down
 */
export function WASDControls() {
  const { camera } = useThree();
  const keys = useRef<Set<string>>(new Set());
  const direction = useRef(new THREE.Vector3());
  const right = useRef(new THREE.Vector3());

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't capture if user is typing in an input
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
    if (k.size === 0) return;

    const speed = MOVE_SPEED * delta;

    // Get camera forward direction (projected to xz plane for FPS-style movement)
    camera.getWorldDirection(direction.current);
    right.current.crossVectors(direction.current, camera.up).normalize();

    if (k.has('w')) {
      camera.position.addScaledVector(direction.current, speed);
    }
    if (k.has('s')) {
      camera.position.addScaledVector(direction.current, -speed);
    }
    if (k.has('a')) {
      camera.position.addScaledVector(right.current, -speed);
    }
    if (k.has('d')) {
      camera.position.addScaledVector(right.current, speed);
    }
    if (k.has('q') || k.has(' ')) {
      camera.position.y += speed;
    }
    if (k.has('e') || k.has('shift')) {
      camera.position.y -= speed;
    }
  });

  return null;
}
