import type { OrbitalConfig } from '../data/atoms';

/**
 * Generate point cloud positions for a given orbital configuration.
 * Uses rejection sampling based on approximate hydrogen-like wavefunctions.
 */

// Bohr radius scale factor for visualization
const A0 = 1.0;

/**
 * Radial probability function R(n,l,r)^2 * r^2
 * Simplified but captures the essential shape
 */
function radialProbability(n: number, l: number, r: number): number {
  const rho = (2 * r) / (n * A0);
  // Simplified radial function: r^(2l) * exp(-rho) * Laguerre-like modulation
  const rPart = Math.pow(r, 2 * l) * Math.exp(-rho);

  // Add radial nodes for higher n
  const nodes = n - l - 1;
  let laguerreApprox = 1;
  for (let k = 1; k <= nodes; k++) {
    laguerreApprox *= (1 - rho / (2 * k + 2 * l + 1));
  }

  return rPart * laguerreApprox * laguerreApprox * r * r;
}

/**
 * Angular probability |Y(l,m,theta,phi)|^2
 * Real spherical harmonics
 */
function angularProbability(l: number, m: number, theta: number, phi: number): number {
  const cosTheta = Math.cos(theta);
  const sinTheta = Math.sin(theta);

  if (l === 0) {
    // s orbital: spherically symmetric
    return 1.0 / (4 * Math.PI);
  }

  if (l === 1) {
    if (m === 0) {
      // pz orbital: cos^2(theta)
      return (3 / (4 * Math.PI)) * cosTheta * cosTheta;
    }
    if (m === 1) {
      // px orbital: sin^2(theta) * cos^2(phi)
      return (3 / (4 * Math.PI)) * sinTheta * sinTheta * Math.cos(phi) * Math.cos(phi);
    }
    if (m === -1) {
      // py orbital: sin^2(theta) * sin^2(phi)
      return (3 / (4 * Math.PI)) * sinTheta * sinTheta * Math.sin(phi) * Math.sin(phi);
    }
  }

  if (l === 2) {
    const sin2Theta = sinTheta * sinTheta;
    const cos2Theta = cosTheta * cosTheta;

    if (m === 0) {
      // dz^2: (3cos^2(theta) - 1)^2
      const val = 3 * cos2Theta - 1;
      return (5 / (16 * Math.PI)) * val * val;
    }
    if (m === 1) {
      // dxz: sin(theta)*cos(theta)*cos(phi)
      return (15 / (4 * Math.PI)) * sin2Theta * cos2Theta * Math.cos(phi) * Math.cos(phi);
    }
    if (m === -1) {
      // dyz: sin(theta)*cos(theta)*sin(phi)
      return (15 / (4 * Math.PI)) * sin2Theta * cos2Theta * Math.sin(phi) * Math.sin(phi);
    }
    if (m === 2) {
      // dx^2-y^2: sin^2(theta)*cos(2*phi)
      const cos2phi = Math.cos(2 * phi);
      return (15 / (16 * Math.PI)) * sin2Theta * sin2Theta * cos2phi * cos2phi;
    }
    if (m === -2) {
      // dxy: sin^2(theta)*sin(2*phi)
      const sin2phi = Math.sin(2 * phi);
      return (15 / (16 * Math.PI)) * sin2Theta * sin2Theta * sin2phi * sin2phi;
    }
  }

  // Fallback: spherical
  return 1.0 / (4 * Math.PI);
}

/**
 * Generate point cloud for a single orbital using rejection sampling.
 * Returns Float32Array of [x, y, z, x, y, z, ...] positions.
 */
export function generateOrbitalPoints(
  orbital: OrbitalConfig,
  numPoints: number,
  offset: [number, number, number] = [0, 0, 0]
): Float32Array {
  const { n, l, m } = orbital;
  const positions = new Float32Array(numPoints * 3);

  // Maximum radius to sample (scales with n^2)
  const rMax = n * n * A0 * 3.5;

  // Find approximate max probability for rejection sampling
  let maxProb = 0;
  for (let i = 0; i < 200; i++) {
    const r = (i / 200) * rMax;
    const radProb = radialProbability(n, l, r);
    if (radProb > maxProb) maxProb = radProb;
  }
  // Multiply by max angular contribution
  if (l === 0) maxProb *= 1.0 / (4 * Math.PI);
  else if (l === 1) maxProb *= 3 / (4 * Math.PI);
  else if (l === 2) maxProb *= 15 / (4 * Math.PI);
  else maxProb *= 1.0;

  if (maxProb === 0) maxProb = 1;

  let count = 0;
  let attempts = 0;
  const maxAttempts = numPoints * 50;

  while (count < numPoints && attempts < maxAttempts) {
    attempts++;

    // Random point in spherical coordinates
    const r = Math.random() * rMax;
    const theta = Math.acos(2 * Math.random() - 1); // uniform on sphere
    const phi = Math.random() * 2 * Math.PI;

    // Calculate probability density
    const radProb = radialProbability(n, l, r);
    const angProb = angularProbability(l, m, theta, phi);
    const prob = radProb * angProb;

    // Rejection sampling
    if (Math.random() < prob / maxProb) {
      // Convert to Cartesian
      const sinTheta = Math.sin(theta);
      const x = r * sinTheta * Math.cos(phi) + offset[0];
      const y = r * sinTheta * Math.sin(phi) + offset[1];
      const z = r * Math.cos(theta) + offset[2];

      positions[count * 3] = x;
      positions[count * 3 + 1] = y;
      positions[count * 3 + 2] = z;
      count++;
    }
  }

  // Fill remaining with last valid point if we ran out of attempts
  if (count > 0 && count < numPoints) {
    const lastX = positions[(count - 1) * 3];
    const lastY = positions[(count - 1) * 3 + 1];
    const lastZ = positions[(count - 1) * 3 + 2];
    for (let i = count; i < numPoints; i++) {
      positions[i * 3] = lastX + (Math.random() - 0.5) * 0.1;
      positions[i * 3 + 1] = lastY + (Math.random() - 0.5) * 0.1;
      positions[i * 3 + 2] = lastZ + (Math.random() - 0.5) * 0.1;
    }
  }

  return positions;
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
  const nucleusRadius = Math.pow(total, 1 / 3) * 0.15;

  const protonPositions = new Float32Array(protons * 3);
  const neutronPositions = new Float32Array(neutrons * 3);

  // Place nucleons in a roughly spherical cluster
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
