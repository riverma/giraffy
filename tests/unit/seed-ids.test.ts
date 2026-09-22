import { describe, expect, it } from 'vitest';
import { ALL_NEEDS } from '../../src/lib/data/needs';
import { seedTiers, seedNeedPeople } from '../../src/lib/data/samples';

describe('seed data', () => {
  it('only references needs that exist', () => {
    const ids = new Set(ALL_NEEDS.map((n) => n.id));
    const used = [...Object.keys(seedTiers()), ...seedNeedPeople().map((p) => p.needId)];
    expect(used.filter((id) => !ids.has(id))).toEqual([]);
  });
});
