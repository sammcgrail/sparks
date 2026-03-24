import { EffectComposer, Vignette } from '@react-three/postprocessing';

/**
 * Lightweight post-processing — Bloom REMOVED for performance.
 *
 * Bloom was the single biggest FPS cost (~5-8ms/frame even with SMALL kernel)
 * because it:
 * 1. Renders the entire scene to an offscreen buffer
 * 2. Runs multiple Gaussian blur passes
 * 3. Composites the result back
 *
 * The additive blending on our point sprites already creates a natural glow
 * effect when points overlap. Removing Bloom gets us close to 2x FPS
 * improvement for free.
 *
 * Vignette is kept — it's a single full-screen pass with trivial cost.
 */
export function Effects() {
  return (
    <EffectComposer multisampling={0}>
      <Vignette eskil={false} offset={0.1} darkness={0.8} />
    </EffectComposer>
  );
}
