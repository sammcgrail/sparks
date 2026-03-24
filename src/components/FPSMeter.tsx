/**
 * HTML overlay for FPS display, placed outside Canvas
 */
export function FPSOverlay({ fps }: { fps: number }) {
  const color = fps >= 50 ? '#4ade80' : fps >= 30 ? '#facc15' : '#ef4444';

  return (
    <div style={{
      position: 'absolute',
      top: 20,
      right: 24,
      pointerEvents: 'none',
      fontFamily: "'JetBrains Mono', 'SF Mono', monospace",
      fontSize: 12,
      color,
      background: 'rgba(0, 0, 0, 0.5)',
      padding: '4px 8px',
      borderRadius: 6,
      border: `1px solid ${color}33`,
      zIndex: 100,
    }}>
      {fps} FPS
    </div>
  );
}
