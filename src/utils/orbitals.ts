import type { OrbitalConfig } from '../data/atoms';

/**
 * Generate point cloud positions for a given orbital configuration.
 *
 * Strategy: Sample points concentrated on the ISOSURFACE (the boundary
 * where |ψ|² = constant fraction of max). This produces the crisp
 * dumbbell/cloverleaf shapes from textbook diagrams, rather than
 * diffuse probability clouds.
 */

// Visualization scale factor (Bohr radius in scene units)
const A0 = 0.8;

/**
 * Associated Laguerre polynomial L_p^k(x)
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
 * Returns R(r)² × r² (radial probability density)
 */
function radialProbability(n: number, l: number, r: number): number {
  const rho = (2 * r) / (n * A0);
  const p = n - l - 1;
  const radial = Math.exp(-rho / 2) * Math.pow(rho, l) * associatedLaguerre(p, 2 * l + 1, rho);
  return radial * radial * r * r;
}

/**
 * Angular probability |Y_l^m(θ, φ)|²
 * Real spherical harmonics — these define the SHAPE of each orbital
 */
function angularProbability(l: number, m: number, theta: number, phi: number): number {
  const cosTheta = Math.cos(theta);
  const sinTheta = Math.sin(theta);
  const sin2Theta = sinTheta * sinTheta;
  const cos2Theta = cosTheta * cosTheta;

  if (l === 0) {
    return 0.25 / Math.PI;
  }

  if (l === 1) {
    if (m === 0) return (3 / (4 * Math.PI)) * cos2Theta;
    if (m === 1) return (3 / (4 * Math.PI)) * sin2Theta * Math.cos(phi) * Math.cos(phi);
    if (m === -1) return (3 / (4 * Math.PI)) * sin2Theta * Math.sin(phi) * Math.sin(phi);
  }

  if (l === 2) {
    if (m === 0) {
      const val = 3 * cos2Theta - 1;
      return (5 / (16 * Math.PI)) * val * val;
    }
    if (m === 1) return (15 / (4 * Math.PI)) * sin2Theta * cos2Theta * Math.cos(phi) * Math.cos(phi);
    if (m === -1) return (15 / (4 * Math.PI)) * sin2Theta * cos2Theta * Math.sin(phi) * Math.sin(phi);
    if (m === 2) {
      const cos2phi = Math.cos(2 * phi);
      return (15 / (16 * Math.PI)) * sin2Theta * cos2phi * cos2phi;
    }
    if (m === -2) {
      const sin2phi = Math.sin(2 * phi);
      return (15 / (16 * Math.PI)) * sin2Theta * sin2phi * sin2phi;
    }
  }

  if (l === 3) {
    if (m === 0) {
      const val = 5 * cos2Theta * cosTheta - 3 * cosTheta;
      return (7 / (16 * Math.PI)) * val * val;
    }
    if (m === 1) {
      const val = (5 * cos2Theta - 1) * sinTheta * Math.cos(phi);
      return (21 / (32 * Math.PI)) * val * val;
    }
    if (m === -1) {
      const val = (5 * cos2Theta - 1) * sinTheta * Math.sin(phi);
      return (21 / (32 * Math.PI)) * val * val;
    }
    if (m === 2) {
      const val = sin2Theta * cosTheta * Math.cos(2 * phi);
      return (105 / (16 * Math.PI)) * val * val;
    }
    if (m === -2) {
      const val = sin2Theta * cosTheta * Math.sin(2 * phi);
      return (105 / (16 * Math.PI)) * val * val;
    }
    if (m === 3) {
      const val = sinTheta * sin2Theta * Math.cos(3 * phi);
      return (35 / (32 * Math.PI)) * val * val;
    }
    if (m === -3) {
      const val = sinTheta * sin2Theta * Math.sin(3 * phi);
      return (35 / (32 * Math.PI)) * val * val;
    }
  }

  return 0.25 / Math.PI;
}

/**
 * Get the sign of the angular wavefunction Y(l,m,θ,φ)
 * Used for phase coloring (positive lobe vs negative lobe)
 */
function angularSign(l: number, m: number, theta: number, phi: number): number {
  const cosTheta = Math.cos(theta);
  const sinTheta = Math.sin(theta);

  if (l === 0) return 1;

  if (l === 1) {
    if (m === 0) return cosTheta >= 0 ? 1 : -1;
    if (m === 1) return Math.cos(phi) >= 0 ? 1 : -1;
    if (m === -1) return Math.sin(phi) >= 0 ? 1 : -1;
  }

  if (l === 2) {
    if (m === 0) return (3 * cosTheta * cosTheta - 1) >= 0 ? 1 : -1;
    if (m === 1) return (cosTheta * Math.cos(phi)) >= 0 ? 1 : -1;
    if (m === -1) return (cosTheta * Math.sin(phi)) >= 0 ? 1 : -1;
    if (m === 2) return Math.cos(2 * phi) >= 0 ? 1 : -1;
    if (m === -2) return Math.sin(2 * phi) >= 0 ? 1 : -1;
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
 * Find the radial peak (most probable radius) for a given (n, l) orbital.
 * This is the r where radialProbability(n, l, r) is maximized.
 */
function findRadialPeak(n: number, l: number, rMax: number): number {
  let bestR = 0;
  let bestProb = 0;
  const steps = 1000;
  for (let i = 1; i <= steps; i++) {
    const r = (i / steps) * rMax;
    const prob = radialProbability(n, l, r);
    if (prob > bestProb) {
      bestProb = prob;
      bestR = r;
    }
  }
  return bestR;
}

/**
 * Generate point cloud for a single orbital using isosurface-shell sampling.
 *
 * KEY INSIGHT: Textbook orbital diagrams show isosurface contours, not
 * the full probability distribution. We sample points concentrated in a
 * thin shell around the peak probability radius, then use the angular
 * probability to accept/reject. This produces solid-looking lobes with
 * crisp boundaries.
 *
 * For s orbitals: thin spherical shell at peak r
 * For p orbitals: dumbbell-shaped shells
 * For d orbitals: cloverleaf-shaped shells
 */
export function generateOrbitalPoints(
  orbital: OrbitalConfig,
  numPoints: number,
  offset: [number, number, number] = [0, 0, 0]
): { positions: Float32Array; phases: Float32Array } {
  const { n, l, m } = orbital;
  const positions = new Float32Array(numPoints * 3);
  const phases = new Float32Array(numPoints);

  const rMax = n * n * A0 * 2.5;

  // Find the peak radius for this orbital's radial distribution
  const rPeak = findRadialPeak(n, l, rMax);

  // Shell thickness: narrow band around the peak radius
  // Thinner shells = crisper shapes, thicker = more diffuse
  const shellThickness = rPeak * (l === 0 ? 0.35 : 0.25);
  const rMin = Math.max(0, rPeak - shellThickness);
  const rMaxShell = rPeak + shellThickness;

  // Find max angular probability for this (l, m) for rejection sampling
  let maxAngProb = 0;
  for (let it = 0; it < 60; it++) {
    const theta = (it / 60) * Math.PI;
    for (let ip = 0; ip < 60; ip++) {
      const phi = (ip / 60) * 2 * Math.PI;
      const angProb = angularProbability(l, m, theta, phi);
      if (angProb > maxAngProb) maxAngProb = angProb;
    }
  }
  if (maxAngProb === 0) maxAngProb = 1;

  // Angular cutoff — reject points below this fraction of max angular probability
  // This carves out the nodal planes and makes lobe boundaries sharp
  const angularCutoff = l === 0 ? 0.0 : 0.08;

  let count = 0;
  let attempts = 0;
  const maxAttempts = numPoints * 300;

  while (count < numPoints && attempts < maxAttempts) {
    attempts++;

    // Sample r within the shell using a Gaussian-like distribution centered on rPeak
    // This concentrates points at the shell surface
    let r: number;
    if (l === 0) {
      // For s orbitals, use broader sampling within the shell
      r = rMin + Math.random() * (rMaxShell - rMin);
    } else {
      // For p/d/f, use Gaussian-biased sampling centered on rPeak
      // Box-Muller approximation: sum of randoms → roughly Gaussian
      const u = (Math.random() + Math.random() + Math.random()) / 3; // mean 0.5, low variance
      r = rMin + u * (rMaxShell - rMin);
    }

    // Uniform direction sampling
    const theta = Math.acos(2 * Math.random() - 1);
    const phi = Math.random() * 2 * Math.PI;

    const angProb = angularProbability(l, m, theta, phi);
    const normalizedAng = angProb / maxAngProb;

    // Cut off low-probability angular regions (creates sharp lobe boundaries)
    if (normalizedAng < angularCutoff) continue;

    // For s orbitals, accept all (spherical shell)
    // For others, use angular probability for rejection sampling
    if (l > 0) {
      // Steep acceptance curve: raise to power < 1 to fill lobes more solidly
      // while still respecting the angular shape
      const acceptProb = Math.pow(normalizedAng, 0.4);
      if (Math.random() > acceptProb) continue;
    }

    // Gentle radial density falloff from peak (Gaussian-ish envelope)
    const dr = (r - rPeak) / shellThickness;
    const radialWeight = Math.exp(-dr * dr * 2.0);
    if (Math.random() > radialWeight) continue;

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

  // Fill remaining with slightly jittered copies
  if (count > 0 && count < numPoints) {
    for (let i = count; i < numPoints; i++) {
      const src = i % count;
      positions[i * 3] = positions[src * 3] + (Math.random() - 0.5) * 0.02;
      positions[i * 3 + 1] = positions[src * 3 + 1] + (Math.random() - 0.5) * 0.02;
      positions[i * 3 + 2] = positions[src * 3 + 2] + (Math.random() - 0.5) * 0.02;
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
