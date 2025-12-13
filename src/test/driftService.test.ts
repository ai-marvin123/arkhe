import { DriftService } from '../services/DriftService';
import { StructureNode } from '../types';

const plan: StructureNode[] = [
  {
    id: 'src/index.ts',
    label: 'index.ts',
    type: 'FILE',
    path: 'src/index.ts',
    level: 1,
    parentId: 'src',
  },
  {
    id: 'src/app.ts',
    label: 'app.ts',
    type: 'FILE',
    path: 'src/app.ts',
    level: 1,
    parentId: 'src',
  },
];

const actual: StructureNode[] = [
  {
    id: 'src/index.ts',
    label: 'index.ts',
    type: 'FILE',
    path: 'src/index.ts',
    level: 1,
    parentId: 'src',
  },
  {
    id: 'src/new.ts',
    label: 'new.ts',
    type: 'FILE',
    path: 'src/new.ts',
    level: 1,
    parentId: 'src',
  },
];

const result = DriftService.calculateDrift(plan, actual);

console.log('Matched:', result.matched.map(n => n.id));
console.log('Missing:', result.missing.map(n => n.id));
console.log('Untracked:', result.untracked.map(n => n.id));
