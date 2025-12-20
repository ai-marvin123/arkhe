import { DriftService } from '../services/DriftService';
import { StructureNode } from '../types';

describe('DriftService.calculateDrift', () => {
  it('correctly detects matched, missing, and untracked nodes', () => {
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

    // 🟢 Matched
    expect(result.matched.map(n => n.id)).toEqual(['src/index.ts']);

    // 🔴 Missing (in plan, not on disk)
    expect(result.missing.map(n => n.id)).toEqual(['src/app.ts']);

    // 🟡 Untracked (on disk, not in plan)
    expect(result.untracked.map(n => n.id)).toEqual(['src/new.ts']);

    // Optional debug (safe here)
    console.log('Matched:', result.matched.map(n => n.id));
    console.log('Missing:', result.missing.map(n => n.id));
    console.log('Untracked:', result.untracked.map(n => n.id));
  });
});