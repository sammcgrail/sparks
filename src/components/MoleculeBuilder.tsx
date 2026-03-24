import type { AtomData } from '../data/atoms';
import { AtomViewer } from './AtomViewer';

export interface PlacedAtom {
  atom: AtomData;
  position: [number, number, number];
  id: string;
}

interface MoleculeBuilderProps {
  placedAtoms: PlacedAtom[];
}

export function MoleculeBuilder({ placedAtoms }: MoleculeBuilderProps) {
  return (
    <group>
      {placedAtoms.map((placed) => (
        <AtomViewer
          key={placed.id}
          atom={placed.atom}
          offset={placed.position}
        />
      ))}
    </group>
  );
}
