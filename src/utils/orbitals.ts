import type { OrbitalConfig } from '../data/atoms';

/**
 * Generate point cloud positions for a given orbital configuration.
 * Uses rejection sampling based on hydrogen-like wavefunctions
 * with proper spherical harmonics for accurate orbital shapes.
 */

// Visualization scale factor
const A0 = 0.8;

/**
 * Associated Laguerre polynomial L_p^k(x)
 * Using the explicit formula for small p values
 */
function associatedLaguerre(p: number, k: number, x: number): number {
  if (p === 0) return 1;
  if (p === 1) return 1 + k - x;
  if (p === 2) return 0.5 * ((k + 1) * (k + 2) - 2 * (k + 2) * x + x * x);
  if (p === 3) {
    return (1 / 6) * (
      -(x * x * x) + 3 * (k + 3) * x * x
      - 3 * (k + 2) * (k + 3) * x
      + (k + 1) * (k + 2) * (k + 3)
    );
  }
  // Recurrence relation for higher p
  let lkm1 = 1;
  let lk = 1 + k - x;
  for (let i = 2; i <= p; i++) {
    const next = ((2 * i - 1 + k - x) * lk - (i - 1 + k) * lkm1) / i;
    lkm1 = lk;
    lk = next;
  }
  return lk;
}

/**
 * Radial wavefunction R(n,l,r) for hydrogen-like atom
 * Returns R(r)^2 * r^2 (the radial probability density)
 */
function radialProbability(n: number, l: number, r: number): number {
  const rho = (2 * r) / (n * A0);
  const p = n - l - 1; // degree of Laguerre polynomial

  // R(r) = (2/(n*a0))^(3/2) * sqrt((n-l-1)!/(2n*((n+l)!)^3)) * e^(-rho/2) * rho^l * L_{n-l-1}^{2l+1}(rho)
  // We only need relative probability, so skip normalization constants
  const radial = Math.exp(-rho / 2) * Math.pow(rho, l) * associatedLaguerre(p, 2 * l + 1, rho);

  // Return R^2 * r^2 (radial probability density)
  return radial * radial * r * r;
}

/**
 * Angular probability |Y_l^m(theta, phi)|^2
 * Real spherical harmonics - these define the SHAPE of each orbital
 */
function angularProbability(l: number, m: number, theta: number, phi: number): number {
  const cosTheta = Math.cos(theta);
  const sinTheta = Math.sin(theta);
  const sin2Theta = sinTheta * sinTheta;
  const cos2Theta = cosTheta * cosTheta;

  // s orbitals: perfect sphere
  if (l === 0) {
    return 0.25 / Math.PI;
  }

  // p orbitals: dumbbell shapes along each axis
  if (l === 1) {
    if (m === 0) {
      // pz: dumbbell along z-axis — cos²θ
      return (3 / (4 * Math.PI)) * cos2Theta;
    }
    if (m === 1) {
      // px: dumbbell along x-axis — sin²θ cos²φ
      return (3 / (4 * Math.PI)) * sin2Theta * Math.cos(phi) * Math.cos(phi);
    }
    if (m === -1) {
      // py: dumbbell along y-axis — sin²θ sin²φ
      return (3 / (4 * Math.PI)) * sin2Theta * Math.sin(phi) * Math.sin(phi);
    }
  }

  // d orbitals: cloverleaf and donut shapes
  if (l === 2) {
    if (m === 0) {
      // dz²: donut with lobes along z — (3cos²θ - 1)²
      const val = 3 * cos2Theta - 1;
      return (5 / (16 * Math.PI)) * val * val;
    }
    if (m === 1) {
      // dxz: cloverleaf in xz plane — sin²θ cos²θ cos²φ
      return (15 / (4 * Math.PI)) * sin2Theta * cos2Theta * Math.cos(phi) * Math.cos(phi);
    }
    if (m === -1) {
      // dyz: cloverleaf in yz plane — sin²θ cos²θ sin²φ
      return (15 / (4 * Math.PI)) * sin2Theta * cos2Theta * Math.sin(phi) * Math.sin(phi);
    }
    if (m === 2) {
      // dx²-y²: cloverleaf in xy plane along axes — sin²θ cos²(2φ)
      const cos2phi = Math.cos(2 * phi);
      return (15 / (16 * Math.PI)) * sin2Theta * cos2phi * cos2phi;
    }
    if (m === -2) {
      // dxy: cloverleaf in xy plane, rotated 45° — sin²θ sin²(2φ)
      const sin2phi = Math.sin(2 * phi);
      return (15 / (16 * Math.PI)) * sin2Theta * sin2phi * sin2phi;
    }
  }

  // f orbitals (l=3): complex multi-lobed shapes
  if (l === 3) {
    if (m === 0) {
      // fz³: triple lobes along z
      const val = 5 * cos2Theta * cosTheta - 3 * cosTheta;
      return (7 / (16 * Math.PI)) * val * val;
    }
    if (m === 1) {
      // fxz²
      const val = (5 * cos2Theta - 1) * sinTheta * Math.cos(phi);
      return (21 / (32 * Math.PI)) * val * val;
    }
    if (m === -1) {
      // fyz²
      const val = (5 * cos2Theta - 1) * sinTheta * Math.sin(phi);
      return (21 / (32 * Math.PI)) * val * val;
    }
    if (m === 2) {
      // fz(x²-y²)
      const val = sin2Theta * cosTheta * Math.cos(2 * phi);
      return (105 / (16 * Math.PI)) * val * val;
    }
    if (m === -2) {
      // fxyz
      const val = sin2Theta * cosTheta * Math.sin(2 * phi);
      return (105 / (16 * Math.PI)) * val * val;
    }
    if (m === 3) {
      // fx(x²-3y²)
      const val = sinTheta * sin2Theta * Math.cos(3 * phi);
      return (35 / (32 * Math.PI)) * val * val;
    }
    if (m === -3) {
      // fy(3x²-y²)
      const val = sinTheta * sin2Theta * Math.sin(3 * phi);
      return (35 / (32 * Math.PI)) * val * val;
    }
  }

  return 0.25 / Math.PI;
}

/**
 * Get the sign of the angular wavefunction Y(l,m,theta,phi)
 * Used for phase coloring (positive lobe vs negative lobe)
 */
function angularSign(l: number, m: number, theta: number, phi: number): number {
  const cosTheta = Math.cos(theta);
  const sinTheta = Math.sin(theta);

  if (l === 0) return 1;

  if (l === 1) {
    if (m === 0) return cosTheta >= 0 ? 1 : -1; // pz
    if (m === 1) return Math.cos(phi) >= 0 ? 1 : -1; // px
    if (m === -1) return Math.sin(phi) >= 0 ? 1 : -1; // py
  }

  if (l === 2) {
    if (m === 0) return (3 * cosTheta * cosTheta - 1) >= 0 ? 1 : -1; // dz²
    if (m === 1) return (cosTheta * Math.cos(phi)) >= 0 ? 1 : -1; // dxz
    if (m === -1) return (cosTheta * Math.sin(phi)) >= 0 ? 1 : -1; // dyz
    if (m === 2) return Math.cos(2 * phi) >= 0 ? 1 : -1; // dx²-y²
    if (m === -2) return Math.sin(2 * phi) >= 0 ? 1 : -1; // dxy
  }

  if (l === 3) {
    if (m === 0) return (5 * cosTheta * cosTheta * cosTheta - 3 * cosTheta) >= 0 ? 1 : -1;
    if (m === 1) return ((5 * cosTheta * cosTheta - 1) * sinTheta * Math.cos(phi)) >= 0 ? 1 : -1;
    if (m === -1) return ((5 * cosTheta * cosTheta - 1) * sinTheta * Math.sin(phi)) >= 0 ? 1 : -1;
    if (m === 2) return (sinTheta * sinTheta * cosTheta * Math.cos(2 * phi)) >= 0 ? 1 : -1;
    if (m === -2) return (sinTheta * sinTheta * cosTheta * Math.sin(2 * phi)) >= 0 ? 1 : -1;
    if (m === 3) return (sinTheta * sinTheta * sinTheta * Math.cos(3 * phi)) >= 0 ? 1 : -1;
    if (m === -3) return (sinTheta * sinTheta * sinTheta * Math.sin(3 * phi)) >= 0 ? 1 : -1;
  }

  return 1;
}

/**
 * Generate point cloud for a single orbital using rejection sampling.
 * Returns Float32Array of [x, y, z, x, y, z, ...] positions
 * and a Float32Array of phase signs (+1 or -1) for coloring.
 *
 * For l>0 orbitals, uses isosurface-biased sampling to concentrate
 * points near the surface boundary for solid-looking lobes.
 */
export function generateOrbitalPoints(
  orbital: OrbitalConfig,
  numPoints: number,
  offset: [number, number, number] = [0, 0, 0]
): { positions: Float32Array; phases: Float32Array } {
  const { n, l, m } = orbital;
  const positions = new Float32Array(numPoints * 3);
  const phases = new Float32Array(numPoints);

  // Tighter radius bound — most probability is within ~n² * 2 * a0
  const rMax = n * n * A0 * 2.5;

  // Find max probability for rejection sampling by scanning
  let maxProb = 0;
  const scanSteps = 500;
  for (let ir = 0; ir < scanSteps; ir++) {
    const r = (ir / scanSteps) * rMax;
    const radProb = radialProbability(n, l, r);
    for (let it = 0; it < 30; it++) {
      const theta = (it / 30) * Math.PI;
      for (let ip = 0; ip < 30; ip++) {
        const phi = (ip / 30) * 2 * Math.PI;
        const angProb = angularProbability(l, m, theta, phi);
        const prob = radProb * angProb;
        if (prob > maxProb) maxProb = prob;
      }
    }
  }

  if (maxProb === 0) maxProb = 1;

  // Cutoff: discard points below this fraction of max probability
  // Higher = crisper but needs more points to fill; lower = blobbier
  const cutoffFraction = l === 0 ? 0.10 : 0.15;
  const probCutoff = maxProb * cutoffFraction;

  // For l>0 orbitals, strongly bias sampling toward the isosurface boundary
  // Tight band (25-70% of max) concentrates points on the orbital surface
  const isosurfaceLow = maxProb * 0.25;
  const isosurfaceHigh = maxProb * 0.70;
  const useIsosurfaceBias = l > 0;

  let count = 0;
  let attempts = 0;
  const maxAttempts = numPoints * 200;

  while (count < numPoints && attempts < maxAttempts) {
    attempts++;

    // Sample r from r² distribution (concentrates near peak)
    const u = Math.random();
    const r = rMax * Math.cbrt(u); // cube root for r² weighting
    const theta = Math.acos(2 * Math.random() - 1);
    const phi = Math.random() * 2 * Math.PI;

    const radProb = radialProbability(n, l, r);
    const angProb = angularProbability(l, m, theta, phi);
    const prob = radProb * angProb;

    // Skip very low probability regions for crisper orbital shapes
    if (prob < probCutoff) continue;

    // Rejection sampling with strong isosurface bias for l>0
    let accept: boolean;
    if (useIsosurfaceBias && prob >= isosurfaceLow && prob <= isosurfaceHigh) {
      // Points near the isosurface boundary get 5x acceptance boost for solid shell look
      accept = Math.random() < Math.min(1, (prob / maxProb) * 5.0);
    } else {
      accept = Math.random() < prob / maxProb;
    }

    if (accept) {
      const sinTheta = Math.sin(theta);
      const x = r * sinTheta * Math.cos(phi) + offset[0];
      const y = r * sinTheta * Math.sin(phi) + offset[1];
      const z = r * Math.cos(theta) + offset[2];

      positions[count * 3] = x;
      positions[count * 3 + 1] = y;
      positions[count * 3 + 2] = z;
      phases[count] = angularSign(l, m, theta, phi);
      count++;
    }
  }

  // Fill remaining with jittered copies of existing points
  if (count > 0 && count < numPoints) {
    for (let i = count; i < numPoints; i++) {
      const src = i % count;
      positions[i * 3] = positions[src * 3] + (Math.random() - 0.5) * 0.03;
      positions[i * 3 + 1] = positions[src * 3 + 1] + (Math.random() - 0.5) * 0.03;
      positions[i * 3 + 2] = positions[src * 3 + 2] + (Math.random() - 0.5) * 0.03;
      phases[i] = phases[src];
    }
  }

  return { positions, phases };
}

/**
 * Generate nucleus particle positions (clustered protons and neutrons).
 */
export function generateNucleusPositions(
  protons: number,
  neutrons: number,
  offset: [number, number, number] = [0, 0, 0]
): { protonPositions: Float32Array; neutronPositions: Float32Array } {
  const total = protons + neutrons;
  const nucleusRadius = Math.pow(total, 1 / 3) * 0.12;

  const protonPositions = new Float32Array(protons * 3);
  const neutronPositions = new Float32Array(neutrons * 3);

  for (let i = 0; i < protons; i++) {
    const r = Math.random() * nucleusRadius;
    const theta = Math.acos(2 * Math.random() - 1);
    const phi = Math.random() * 2 * Math.PI;
    protonPositions[i * 3] = r * Math.sin(theta) * Math.cos(phi) + offset[0];
    protonPositions[i * 3 + 1] = r * Math.sin(theta) * Math.sin(phi) + offset[1];
    protonPositions[i * 3 + 2] = r * Math.cos(theta) + offset[2];
  }

  for (let i = 0; i < neutrons; i++) {
    const r = Math.random() * nucleusRadius;
    const theta = Math.acos(2 * Math.random() - 1);
    const phi = Math.random() * 2 * Math.PI;
    neutronPositions[i * 3] = r * Math.sin(theta) * Math.cos(phi) + offset[0];
    neutronPositions[i * 3 + 1] = r * Math.sin(theta) * Math.sin(phi) + offset[1];
    neutronPositions[i * 3 + 2] = r * Math.cos(theta) + offset[2];
  }

  return { protonPositions, neutronPositions };
}
