import { useMemo } from 'react';
import type { AtomData } from '../data/atoms';
import { OrbitalCloud } from './OrbitalCloud';
import { Nucleus } from './Nucleus';

interface AtomViewerProps {
  atom: AtomData;
  offset?: [number, number, number];
}

export function AtomViewer({ atom, offset = [0, 0, 0] }: AtomViewerProps) {
  const orbitals = useMemo(() => atom.orbitals, [atom]);

  return (
    <group>
      <Nucleus
        protons={atom.protons}
        neutrons={atom.neutrons}
        offset={offset}
      />
      {orbitals.map((orbital, i) => (
        <OrbitalCloud
          key={`${atom.symbol}-${orbital.n}-${orbital.l}-${orbital.m}-${i}`}
          orbital={orbital}
          offset={offset}
        />
      ))}
    </group>
  );
}
