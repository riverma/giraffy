// The needs vocabulary is a released structure: every need explains itself, and no word
// means two different things in two different places.
import { describe, expect, it } from 'vitest';
import { ALL_NEEDS, NEED_CATEGORIES } from '../../src/lib/data/needs';
import { needMeaning } from '../../src/lib/data/need-meanings';

describe('need meanings', () => {
  it('covers every need', () => {
    const missing = ALL_NEEDS.filter((n) => !needMeaning(n.id)).map((n) => n.id);
    expect(missing).toEqual([]);
  });

  it('stays short enough to read in place', () => {
    const tooLong = ALL_NEEDS.filter((n) => needMeaning(n.id).length > 90).map((n) => n.id);
    expect(tooLong).toEqual([]);
  });

  it('uses no em dashes', () => {
    expect(ALL_NEEDS.filter((n) => needMeaning(n.id).includes('—'))).toEqual([]);
  });
});

describe('the vocabulary', () => {
  it('gives every word exactly one home, so a need never means two things', () => {
    const areas = new Map<string, string[]>();
    for (const n of ALL_NEEDS) areas.set(n.word, [...(areas.get(n.word) ?? []), n.category]);
    const repeated = [...areas].filter(([, where]) => where.length > 1);
    expect(repeated).toEqual([]);
  });

  it('gives every need a distinct id', () => {
    const ids = ALL_NEEDS.map((n) => n.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('lists each area\'s needs alphabetically, implying no preference between them', () => {
    for (const cat of NEED_CATEGORIES) {
      expect(cat.words, cat.name).toEqual([...cat.words].sort((a, b) => a.localeCompare(b, 'en')));
    }
  });

  it('keeps the areas and their order', () => {
    expect(NEED_CATEGORIES.map((c) => c.name)).toEqual([
      'Autonomy', 'Connection', 'Honesty', 'Meaning', 'Peace', 'Physical well-being', 'Play'
    ]);
  });
});
