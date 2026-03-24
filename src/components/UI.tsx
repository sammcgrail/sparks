import { atoms, orbitalLabels, orbitalColors } from '../data/atoms';
import type { AtomData } from '../data/atoms';
import type { PlacedAtom } from './MoleculeBuilder';

interface UIProps {
  selectedAtom: AtomData;
  onSelectAtom: (atom: AtomData) => void;
  placedAtoms: PlacedAtom[];
  onAddAtom: () => void;
  onClearAtoms: () => void;
  onResetToSingle: () => void;
  moleculeMode: boolean;
  onToggleMoleculeMode: () => void;
}

export function UI({
  selectedAtom,
  onSelectAtom,
  placedAtoms,
  onAddAtom,
  onClearAtoms,
  onResetToSingle,
  moleculeMode,
  onToggleMoleculeMode,
}: UIProps) {
  return (
    <div style={{
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      pointerEvents: 'none',
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
      color: '#e0e0e0',
    }}>
      {/* Title */}
      <div style={{
        position: 'absolute',
        top: 20,
        left: 24,
        pointerEvents: 'none',
      }}>
        <h1 style={{
          margin: 0,
          fontSize: 22,
          fontWeight: 600,
          color: '#ffffff',
          letterSpacing: '-0.02em',
        }}>
          Atomic Viewer
        </h1>
        <p style={{
          margin: '4px 0 0',
          fontSize: 12,
          color: '#888',
          letterSpacing: '0.02em',
        }}>
          Quantum orbital visualization
        </p>
      </div>

      {/* Atom selector */}
      <div style={{
        position: 'absolute',
        top: 56,
        right: 24,
        pointerEvents: 'auto',
        background: 'rgba(10, 10, 20, 0.85)',
        backdropFilter: 'blur(12px)',
        borderRadius: 12,
        padding: 16,
        border: '1px solid rgba(255,255,255,0.08)',
        maxWidth: 280,
      }}>
        <div style={{ fontSize: 11, color: '#888', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
          Select Atom
        </div>
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 6,
        }}>
          {atoms.map((atom) => (
            <button
              key={atom.symbol}
              onClick={() => onSelectAtom(atom)}
              style={{
                background: selectedAtom.symbol === atom.symbol
                  ? 'rgba(78, 205, 196, 0.3)'
                  : 'rgba(255,255,255,0.05)',
                border: selectedAtom.symbol === atom.symbol
                  ? '1px solid rgba(78, 205, 196, 0.6)'
                  : '1px solid rgba(255,255,255,0.1)',
                borderRadius: 8,
                color: selectedAtom.symbol === atom.symbol ? '#4ecdc4' : '#ccc',
                padding: '6px 10px',
                cursor: 'pointer',
                fontSize: 13,
                fontWeight: 600,
                fontFamily: 'inherit',
                transition: 'all 0.15s',
                minWidth: 40,
                textAlign: 'center',
              }}
              title={atom.name}
            >
              {atom.symbol}
            </button>
          ))}
        </div>

        {/* Molecule mode toggle */}
        <div style={{ marginTop: 12, borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 12 }}>
          <button
            onClick={onToggleMoleculeMode}
            style={{
              background: moleculeMode ? 'rgba(69, 183, 209, 0.3)' : 'rgba(255,255,255,0.05)',
              border: moleculeMode ? '1px solid rgba(69, 183, 209, 0.6)' : '1px solid rgba(255,255,255,0.1)',
              borderRadius: 8,
              color: moleculeMode ? '#45b7d1' : '#999',
              padding: '8px 14px',
              cursor: 'pointer',
              fontSize: 12,
              fontFamily: 'inherit',
              width: '100%',
              transition: 'all 0.15s',
            }}
          >
            {moleculeMode ? 'Molecule Mode ON' : 'Molecule Mode'}
          </button>
        </div>

        {moleculeMode && (
          <div style={{ marginTop: 8, display: 'flex', gap: 6 }}>
            <button
              onClick={onAddAtom}
              style={{
                background: 'rgba(78, 205, 196, 0.2)',
                border: '1px solid rgba(78, 205, 196, 0.4)',
                borderRadius: 8,
                color: '#4ecdc4',
                padding: '6px 12px',
                cursor: 'pointer',
                fontSize: 12,
                fontFamily: 'inherit',
                flex: 1,
              }}
            >
              + Add {selectedAtom.symbol}
            </button>
            <button
              onClick={onClearAtoms}
              style={{
                background: 'rgba(231, 76, 60, 0.15)',
                border: '1px solid rgba(231, 76, 60, 0.3)',
                borderRadius: 8,
                color: '#e74c3c',
                padding: '6px 12px',
                cursor: 'pointer',
                fontSize: 12,
                fontFamily: 'inherit',
              }}
            >
              Clear
            </button>
            <button
              onClick={onResetToSingle}
              style={{
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 8,
                color: '#999',
                padding: '6px 12px',
                cursor: 'pointer',
                fontSize: 12,
                fontFamily: 'inherit',
              }}
            >
              Reset
            </button>
          </div>
        )}

        {moleculeMode && placedAtoms.length > 0 && (
          <div style={{ marginTop: 8, fontSize: 11, color: '#666' }}>
            {placedAtoms.length} atom{placedAtoms.length !== 1 ? 's' : ''} placed
          </div>
        )}
      </div>

      {/* Atom info */}
      <div style={{
        position: 'absolute',
        bottom: 24,
        left: 24,
        pointerEvents: 'none',
        background: 'rgba(10, 10, 20, 0.85)',
        backdropFilter: 'blur(12px)',
        borderRadius: 12,
        padding: 16,
        border: '1px solid rgba(255,255,255,0.08)',
        minWidth: 200,
      }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 8 }}>
          <span style={{ fontSize: 28, fontWeight: 700, color: '#fff' }}>
            {selectedAtom.symbol}
          </span>
          <span style={{ fontSize: 14, color: '#aaa' }}>
            {selectedAtom.name}
          </span>
        </div>
        <div style={{ fontSize: 12, color: '#888', lineHeight: 1.6 }}>
          <div>Atomic Number: {selectedAtom.atomicNumber}</div>
          <div>Protons: {selectedAtom.protons} / Neutrons: {selectedAtom.neutrons}</div>
          <div style={{ marginTop: 6, fontSize: 11, color: '#666' }}>
            Electron configuration:
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 4 }}>
            {selectedAtom.orbitals.map((o, i) => (
              <span
                key={i}
                style={{
                  background: `${orbitalColors[o.l]}20`,
                  border: `1px solid ${orbitalColors[o.l]}40`,
                  borderRadius: 4,
                  padding: '2px 6px',
                  fontSize: 11,
                  color: orbitalColors[o.l],
                  fontFamily: 'monospace',
                }}
              >
                {o.n}{orbitalLabels[o.l]}<sup>{o.electrons}</sup>
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Controls hint */}
      <div style={{
        position: 'absolute',
        bottom: 24,
        right: 24,
        pointerEvents: 'none',
        fontSize: 11,
        color: '#555',
        textAlign: 'right',
        lineHeight: 1.6,
      }}>
        <div>Drag to rotate</div>
        <div>Scroll to zoom</div>
        <div>Right-drag to pan</div>
      </div>

      {/* Orbital legend with phase colors */}
      <div style={{
        position: 'absolute',
        bottom: 24,
        left: '50%',
        transform: 'translateX(-50%)',
        pointerEvents: 'none',
        display: 'flex',
        gap: 16,
        fontSize: 11,
        color: '#888',
        flexWrap: 'wrap',
        justifyContent: 'center',
      }}>
        {selectedAtom.orbitals.some(o => o.l === 0) && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#4ecdc4', boxShadow: '0 0 6px #4ecdc4' }} />
            <span>s orbital</span>
          </div>
        )}
        {selectedAtom.orbitals.some(o => o.l === 1) && (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#ff6b6b', boxShadow: '0 0 6px #ff6b6b' }} />
              <span>p +phase</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#4ecdc4', boxShadow: '0 0 6px #4ecdc4' }} />
              <span>p −phase</span>
            </div>
          </>
        )}
        {selectedAtom.orbitals.some(o => o.l === 2) && (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#ffb347', boxShadow: '0 0 6px #ffb347' }} />
              <span>d +phase</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#45b7d1', boxShadow: '0 0 6px #45b7d1' }} />
              <span>d −phase</span>
            </div>
          </>
        )}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#ff6b35', boxShadow: '0 0 6px #ff6b35' }} />
          <span>proton</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#7eb8da', boxShadow: '0 0 6px #7eb8da' }} />
          <span>neutron</span>
        </div>
      </div>
    </div>
  );
}
