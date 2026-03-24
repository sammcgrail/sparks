import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing';
import { KernelSize } from 'postprocessing';

/**
 * Post-processing effects.
 *
 * Performance notes:
 * - mipmapBlur was removed — it's the most expensive Bloom option,
 *   requiring many extra full-resolution render passes
 * - Using a smaller kernel size (SMALL instead of default LARGE)
 * - Raised luminance threshold so only bright highlights bloom
 */
export function Effects() {
  return (
    <EffectComposer multisampling={0}>
      <Bloom
        luminanceThreshold={0.4}
        luminanceSmoothing={0.6}
        intensity={0.8}
        kernelSize={KernelSize.SMALL}
      />
      <Vignette eskil={false} offset={0.1} darkness={0.8} />
    </EffectComposer>
  );
}
