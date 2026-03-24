import { useState, useCallback, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import { AtomViewer } from './components/AtomViewer';
import { MoleculeBuilder } from './components/MoleculeBuilder';
import type { PlacedAtom } from './components/MoleculeBuilder';
import { Background } from './components/Background';
import { Effects } from './components/Effects';
import { UI } from './components/UI';
import { FPSOverlay } from './components/FPSMeter';
import { WASDControls } from './components/WASDControls';
import { atoms } from './data/atoms';
import type { AtomData } from './data/atoms';

/** In-canvas component to track FPS */
function FPSTracker({ onFps }: { onFps: (fps: number) => void }) {
  const frames = useRef(0);
  const lastTime = useRef(performance.now());

  useFrame(() => {
    frames.current++;
    const now = performance.now();
    if (now - lastTime.current >= 500) {
      const elapsed = (now - lastTime.current) / 1000;
      onFps(Math.round(frames.current / elapsed));
      frames.current = 0;
      lastTime.current = now;
    }
  });

  return null;
}

function App() {
  const [selectedAtom, setSelectedAtom] = useState<AtomData>(
    atoms.find(a => a.symbol === 'C')!
  );
  const [moleculeMode, setMoleculeMode] = useState(false);
  const [placedAtoms, setPlacedAtoms] = useState<PlacedAtom[]>([]);
  const [nextPlacementIndex, setNextPlacementIndex] = useState(0);
  const [fps, setFps] = useState(0);
  const orbitControlsRef = useRef<OrbitControlsImpl>(null);

  const handleSelectAtom = useCallback((atom: AtomData) => {
    setSelectedAtom(atom);
  }, []);

  const handleAddAtom = useCallback(() => {
    const spacing = 6;
    const cols = 4;
    const row = Math.floor(nextPlacementIndex / cols);
    const col = nextPlacementIndex % cols;
    const x = (col - (cols - 1) / 2) * spacing;
    const y = 0;
    const z = row * -spacing;

    const newAtom: PlacedAtom = {
      atom: selectedAtom,
      position: [x, y, z],
      id: `${selectedAtom.symbol}-${Date.now()}-${nextPlacementIndex}`,
    };

    setPlacedAtoms(prev => [...prev, newAtom]);
    setNextPlacementIndex(prev => prev + 1);
  }, [selectedAtom, nextPlacementIndex]);

  const handleClearAtoms = useCallback(() => {
    setPlacedAtoms([]);
    setNextPlacementIndex(0);
  }, []);

  const handleResetToSingle = useCallback(() => {
    setMoleculeMode(false);
    setPlacedAtoms([]);
    setNextPlacementIndex(0);
  }, []);

  const handleToggleMoleculeMode = useCallback(() => {
    setMoleculeMode(prev => !prev);
  }, []);

  const maxN = Math.max(...selectedAtom.orbitals.map(o => o.n));
  const cameraDistance = moleculeMode ? 20 : Math.max(6, maxN * 5);

  return (
    <div style={{ width: '100vw', height: '100vh', background: '#050510' }}>
      {/* FPS overlay - top right */}
      <FPSOverlay fps={fps} />

      <Canvas
        camera={{
          position: [0, cameraDistance * 0.4, cameraDistance],
          fov: 50,
          near: 0.1,
          far: 500,
        }}
        gl={{
          antialias: true,
          alpha: false,
          powerPreference: 'high-performance',
        }}
        dpr={[1, 2]}
      >
        <color attach="background" args={['#050510']} />

        <ambientLight intensity={0.3} />
        <pointLight position={[10, 10, 10]} intensity={0.8} color="#ffffff" />
        <pointLight position={[-5, -5, 5]} intensity={0.3} color="#4ecdc4" />

        <Background />
        <FPSTracker onFps={setFps} />

        {moleculeMode && placedAtoms.length > 0 ? (
          <MoleculeBuilder placedAtoms={placedAtoms} />
        ) : (
          !moleculeMode && <AtomViewer atom={selectedAtom} />
        )}

        <Effects />

        <WASDControls controlsRef={orbitControlsRef} />

        <OrbitControls
          ref={orbitControlsRef}
          enableDamping
          dampingFactor={0.05}
          rotateSpeed={0.5}
          zoomSpeed={0.8}
          panSpeed={0.5}
          minDistance={1}
          maxDistance={100}
          autoRotate
          autoRotateSpeed={0.3}
        />
      </Canvas>

      <UI
        selectedAtom={selectedAtom}
        onSelectAtom={handleSelectAtom}
        placedAtoms={placedAtoms}
        onAddAtom={handleAddAtom}
        onClearAtoms={handleClearAtoms}
        onResetToSingle={handleResetToSingle}
        moleculeMode={moleculeMode}
        onToggleMoleculeMode={handleToggleMoleculeMode}
      />
    </div>
  );
}

export default App;
