/**
 * HTML overlay for FPS + point count display, placed outside Canvas.
 * Point count is fixed-width to prevent layout jitter.
 * Compact layout on mobile to avoid overlapping UI elements.
 */
export function FPSOverlay({ fps, pointCount }: { fps: number; pointCount: number }) {
  const color = fps >= 50 ? '#4ade80' : fps >= 30 ? '#facc15' : '#ef4444';
  const pointLabel = pointCount.toLocaleString();
  // Simple mobile check — matches UI.tsx breakpoint
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 640;

  return (
    <div style={{
      position: 'absolute',
      top: isMobile ? 12 : 20,
      right: isMobile ? 14 : 24,
      pointerEvents: 'none',
      fontFamily: "'JetBrains Mono', 'SF Mono', monospace",
      fontSize: isMobile ? 10 : 12,
      background: 'rgba(0, 0, 0, 0.5)',
      padding: isMobile ? '3px 6px' : '4px 8px',
      borderRadius: 6,
      border: `1px solid ${color}33`,
      zIndex: 100,
      display: 'flex',
      gap: isMobile ? 8 : 12,
      alignItems: 'center',
      minWidth: isMobile ? undefined : 170,
    }}>
      <span style={{ color: '#888', minWidth: isMobile ? undefined : 80 }}>
        {pointLabel} pts
      </span>
      <span style={{ color, minWidth: isMobile ? undefined : 50, textAlign: 'right' }}>
        {fps} FPS
      </span>
    </div>
  );
}
