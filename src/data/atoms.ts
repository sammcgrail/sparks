export interface OrbitalConfig {
  n: number;       // principal quantum number
  l: number;       // azimuthal quantum number (0=s, 1=p, 2=d)
  m: number;       // magnetic quantum number
  electrons: number; // electrons in this orbital
}

export interface AtomData {
  symbol: string;
  name: string;
  atomicNumber: number;
  protons: number;
  neutrons: number;
  color: string;
  radius: number; // van der waals radius scale
  orbitals: OrbitalConfig[];
}

// Orbital type labels
export const orbitalLabels: Record<number, string> = {
  0: 's',
  1: 'p',
  2: 'd',
  3: 'f',
};

// Color scheme for orbital types
export const orbitalColors: Record<number, string> = {
  0: '#4ecdc4', // s - teal
  1: '#45b7d1', // p - blue
  2: '#f7dc6f', // d - gold
  3: '#e74c3c', // f - red
};

export const atoms: AtomData[] = [
  {
    symbol: 'H',
    name: 'Hydrogen',
    atomicNumber: 1,
    protons: 1,
    neutrons: 0,
    color: '#ffffff',
    radius: 0.53,
    orbitals: [
      { n: 1, l: 0, m: 0, electrons: 1 },
    ],
  },
  {
    symbol: 'He',
    name: 'Helium',
    atomicNumber: 2,
    protons: 2,
    neutrons: 2,
    color: '#d9ffff',
    radius: 0.31,
    orbitals: [
      { n: 1, l: 0, m: 0, electrons: 2 },
    ],
  },
  {
    symbol: 'Li',
    name: 'Lithium',
    atomicNumber: 3,
    protons: 3,
    neutrons: 4,
    color: '#cc80ff',
    radius: 1.67,
    orbitals: [
      { n: 1, l: 0, m: 0, electrons: 2 },
      { n: 2, l: 0, m: 0, electrons: 1 },
    ],
  },
  {
    symbol: 'Be',
    name: 'Beryllium',
    atomicNumber: 4,
    protons: 4,
    neutrons: 5,
    color: '#c2ff00',
    radius: 1.12,
    orbitals: [
      { n: 1, l: 0, m: 0, electrons: 2 },
      { n: 2, l: 0, m: 0, electrons: 2 },
    ],
  },
  {
    symbol: 'B',
    name: 'Boron',
    atomicNumber: 5,
    protons: 5,
    neutrons: 6,
    color: '#ffb5b5',
    radius: 0.87,
    orbitals: [
      { n: 1, l: 0, m: 0, electrons: 2 },
      { n: 2, l: 0, m: 0, electrons: 2 },
      { n: 2, l: 1, m: -1, electrons: 1 },
    ],
  },
  {
    symbol: 'C',
    name: 'Carbon',
    atomicNumber: 6,
    protons: 6,
    neutrons: 6,
    color: '#909090',
    radius: 0.77,
    orbitals: [
      { n: 1, l: 0, m: 0, electrons: 2 },
      { n: 2, l: 0, m: 0, electrons: 2 },
      { n: 2, l: 1, m: -1, electrons: 1 },
      { n: 2, l: 1, m: 0, electrons: 1 },
    ],
  },
  {
    symbol: 'N',
    name: 'Nitrogen',
    atomicNumber: 7,
    protons: 7,
    neutrons: 7,
    color: '#3050f8',
    radius: 0.75,
    orbitals: [
      { n: 1, l: 0, m: 0, electrons: 2 },
      { n: 2, l: 0, m: 0, electrons: 2 },
      { n: 2, l: 1, m: -1, electrons: 1 },
      { n: 2, l: 1, m: 0, electrons: 1 },
      { n: 2, l: 1, m: 1, electrons: 1 },
    ],
  },
  {
    symbol: 'O',
    name: 'Oxygen',
    atomicNumber: 8,
    protons: 8,
    neutrons: 8,
    color: '#ff0d0d',
    radius: 0.73,
    orbitals: [
      { n: 1, l: 0, m: 0, electrons: 2 },
      { n: 2, l: 0, m: 0, electrons: 2 },
      { n: 2, l: 1, m: -1, electrons: 2 },
      { n: 2, l: 1, m: 0, electrons: 1 },
      { n: 2, l: 1, m: 1, electrons: 1 },
    ],
  },
  {
    symbol: 'F',
    name: 'Fluorine',
    atomicNumber: 9,
    protons: 9,
    neutrons: 10,
    color: '#90e050',
    radius: 0.71,
    orbitals: [
      { n: 1, l: 0, m: 0, electrons: 2 },
      { n: 2, l: 0, m: 0, electrons: 2 },
      { n: 2, l: 1, m: -1, electrons: 2 },
      { n: 2, l: 1, m: 0, electrons: 2 },
      { n: 2, l: 1, m: 1, electrons: 1 },
    ],
  },
  {
    symbol: 'Ne',
    name: 'Neon',
    atomicNumber: 10,
    protons: 10,
    neutrons: 10,
    color: '#b3e3f5',
    radius: 0.69,
    orbitals: [
      { n: 1, l: 0, m: 0, electrons: 2 },
      { n: 2, l: 0, m: 0, electrons: 2 },
      { n: 2, l: 1, m: -1, electrons: 2 },
      { n: 2, l: 1, m: 0, electrons: 2 },
      { n: 2, l: 1, m: 1, electrons: 2 },
    ],
  },
  {
    symbol: 'Na',
    name: 'Sodium',
    atomicNumber: 11,
    protons: 11,
    neutrons: 12,
    color: '#ab5cf2',
    radius: 1.90,
    orbitals: [
      { n: 1, l: 0, m: 0, electrons: 2 },
      { n: 2, l: 0, m: 0, electrons: 2 },
      { n: 2, l: 1, m: -1, electrons: 2 },
      { n: 2, l: 1, m: 0, electrons: 2 },
      { n: 2, l: 1, m: 1, electrons: 2 },
      { n: 3, l: 0, m: 0, electrons: 1 },
    ],
  },
  {
    symbol: 'Fe',
    name: 'Iron',
    atomicNumber: 26,
    protons: 26,
    neutrons: 30,
    color: '#e06633',
    radius: 1.56,
    orbitals: [
      { n: 1, l: 0, m: 0, electrons: 2 },
      { n: 2, l: 0, m: 0, electrons: 2 },
      { n: 2, l: 1, m: -1, electrons: 2 },
      { n: 2, l: 1, m: 0, electrons: 2 },
      { n: 2, l: 1, m: 1, electrons: 2 },
      { n: 3, l: 0, m: 0, electrons: 2 },
      { n: 3, l: 1, m: -1, electrons: 2 },
      { n: 3, l: 1, m: 0, electrons: 2 },
      { n: 3, l: 1, m: 1, electrons: 2 },
      { n: 3, l: 2, m: -2, electrons: 2 },
      { n: 3, l: 2, m: -1, electrons: 1 },
      { n: 3, l: 2, m: 0, electrons: 1 },
      { n: 3, l: 2, m: 1, electrons: 1 },
      { n: 3, l: 2, m: 2, electrons: 1 },
      { n: 4, l: 0, m: 0, electrons: 2 },
    ],
  },
];

export function getAtomBySymbol(symbol: string): AtomData | undefined {
  return atoms.find(a => a.symbol === symbol);
}
