/**
 * HTML overlay for FPS + point count display, placed outside Canvas.
 * Point count is fixed-width to prevent layout jitter.
 */
export function FPSOverlay({ fps, pointCount }: { fps: number; pointCount: number }) {
  const color = fps >= 50 ? '#4ade80' : fps >= 30 ? '#facc15' : '#ef4444';
  const pointLabel = pointCount.toLocaleString();

  return (
    <div style={{
      position: 'absolute',
      top: 20,
      right: 24,
      pointerEvents: 'none',
      fontFamily: "'JetBrains Mono', 'SF Mono', monospace",
      fontSize: 12,
      background: 'rgba(0, 0, 0, 0.5)',
      padding: '4px 8px',
      borderRadius: 6,
      border: `1px solid ${color}33`,
      zIndex: 100,
      display: 'flex',
      gap: 12,
      alignItems: 'center',
      // Fixed minimum width prevents the counter from bouncing when values change
      minWidth: 170,
    }}>
      <span style={{ color: '#888', minWidth: 80 }}>
        {pointLabel} pts
      </span>
      <span style={{ color, minWidth: 50, textAlign: 'right' }}>
        {fps} FPS
      </span>
    </div>
  );
}
