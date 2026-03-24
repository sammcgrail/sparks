import { useMemo } from 'react';
import type { AtomData } from '../data/atoms';
import { OrbitalCloud } from './OrbitalCloud';
import { Nucleus } from './Nucleus';

interface AtomViewerProps {
  atom: AtomData;
  offset?: [number, number, number];
}

/**
 * Performance budget: cap total points across all orbitals so heavy atoms
 * (like Iron with 15 orbitals) don't tank the framerate.
 * Budget is split proportionally by electron count.
 */
const MAX_TOTAL_POINTS = 60000;

export function AtomViewer({ atom, offset = [0, 0, 0] }: AtomViewerProps) {
  const orbitalPointCounts = useMemo(() => {
    const totalElectrons = atom.orbitals.reduce((sum, o) => sum + o.electrons, 0);
    const numOrbitals = atom.orbitals.length;

    // Base count per orbital, scaled down when there are many orbitals
    const budgetPerOrbital = Math.floor(MAX_TOTAL_POINTS / numOrbitals);

    return atom.orbitals.map((orbital) => {
      // Give more points to orbitals with more electrons and higher n
      const weight = orbital.electrons / totalElectrons;
      const baseCount = Math.max(2000, Math.min(10000, orbital.n * 3000));
      // Use the smaller of the weighted budget or the per-orbital base count
      return Math.min(baseCount, Math.max(2000, Math.floor(budgetPerOrbital * (1 + weight))));
    });
  }, [atom]);

  return (
    <group>
      <Nucleus
        protons={atom.protons}
        neutrons={atom.neutrons}
        offset={offset}
      />
      {atom.orbitals.map((orbital, i) => (
        <OrbitalCloud
          key={`${atom.symbol}-${orbital.n}-${orbital.l}-${orbital.m}-${i}`}
          orbital={orbital}
          offset={offset}
          pointCount={orbitalPointCounts[i]}
        />
      ))}
    </group>
  );
}
