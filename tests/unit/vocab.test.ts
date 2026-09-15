// The list a person sees: the shipped vocabulary, plus what they added, minus what they hid.
import { describe, expect, it } from 'vitest';
import { ALL_NEEDS, NEED_CATEGORIES } from '../../src/lib/data/needs';
import { areaProblem, buildVocab, customNeedId, meaningOf, vocabProblem } from '../../src/lib/data/vocab';
import { migrateNeedId } from '../../src/lib/core/need-migration';
import type { CustomArea, CustomNeed } from '../../src/lib/core/types';

const EMPTY = { customAreas: [], customNeeds: [], hiddenNeeds: [] };

function need(area: string, word: string, meaning = ''): CustomNeed {
  return { id: customNeedId(area, word), area, word, meaning, created: '2026-09-12T00:00:00Z' };
}
function area(name: string): CustomArea {
  return { name, created: '2026-09-12T00:00:00Z' };
}

describe('a vocabulary with nothing added', () => {
  const v = buildVocab(EMPTY);

  it('is exactly the shipped list, in the shipped areas', () => {
    expect(v.areas.map((a) => a.name)).toEqual(NEED_CATEGORIES.map((c) => c.name));
    expect(v.visible.length).toBe(ALL_NEEDS.length);
    expect(v.visible.map((n) => n.id).sort()).toEqual(ALL_NEEDS.map((n) => n.id).sort());
    expect(v.hidden).toEqual([]);
    expect(v.areas.every((a) => !a.custom)).toBe(true);
  });

  it('matches words the way the shipped list always did', () => {
    expect(v.match('closeness')).toBe('connection/closeness');
    expect(v.match('sleep')).toBe('physical-well-being/rest-sleep');
    expect(v.match('nothing like this')).toBe(null);
  });
});

describe('a need of your own', () => {
  it('sits with the shipped ones, alphabetically, under the area you chose', () => {
    const v = buildVocab({ ...EMPTY, customNeeds: [need('Play', 'kite flying')] });
    const play = v.areas.find((a) => a.name === 'Play');
    expect(play?.needs.map((n) => n.word)).toEqual(['adventure', 'excitement', 'fun', 'humor', 'joy', 'kite flying', 'relaxation', 'stimulation']);
    expect(v.visible.length).toBe(ALL_NEEDS.length + 1);
  });

  it('carries an id that can never be taken for a shipped one', () => {
    const id = customNeedId('Connection', 'presence');
    expect(id).toBe('custom/connection/presence');
    // 'connection/presence' is a key in the vocabulary migration; the prefixed id must pass through
    expect(migrateNeedId('connection/presence')).toBe('connection/attentiveness');
    expect(migrateNeedId(id)).toBe(id);
  });

  it('carries its own meaning', () => {
    const v = buildVocab({ ...EMPTY, customNeeds: [need('Play', 'kite flying', 'string, wind, and nowhere to be')] });
    expect(meaningOf(v, customNeedId('Play', 'kite flying'))).toBe('string, wind, and nowhere to be');
    expect(meaningOf(v, 'play/fun')).toBe('doing a thing for no reason but the doing');
    expect(meaningOf(v, 'nothing/here')).toBe('');
  });
});

describe('an area of your own', () => {
  const v = buildVocab({ customAreas: [area('Work'), area('Ancestry')], customNeeds: [need('Work', 'being consulted')], hiddenNeeds: [] });

  it('comes after the seven, alphabetically among its own', () => {
    expect(v.areas.map((a) => a.name)).toEqual([...NEED_CATEGORIES.map((c) => c.name), 'Ancestry', 'Work']);
    expect(v.areas.filter((a) => a.custom).length).toBe(2);
  });

  it('lists even before it holds a need', () => {
    expect(v.areas.find((a) => a.name === 'Ancestry')?.needs).toEqual([]);
    expect(v.areas.find((a) => a.name === 'Work')?.needs.map((n) => n.word)).toEqual(['being consulted']);
  });
});

describe('hiding a shipped need', () => {
  const v = buildVocab({ ...EMPTY, hiddenNeeds: ['autonomy/choice'] });

  it('leaves the list but stays findable, so old cards still resolve', () => {
    expect(v.areas.find((a) => a.name === 'Autonomy')?.needs.map((n) => n.word)).not.toContain('choice');
    expect(v.visible.length).toBe(ALL_NEEDS.length - 1);
    expect(v.byId.get('autonomy/choice')?.word).toBe('choice');
    expect(v.hidden.map((n) => n.id)).toEqual(['autonomy/choice']);
    expect(v.match('choice')).toBe(null);
  });

  it('ignores an id that is not a shipped need', () => {
    const odd = buildVocab({ ...EMPTY, hiddenNeeds: ['made/up', 'custom/work/x'] });
    expect(odd.hidden).toEqual([]);
    expect(odd.visible.length).toBe(ALL_NEEDS.length);
  });
});

describe('the same word in two areas', () => {
  const v = buildVocab({ customAreas: [area('Work')], customNeeds: [need('Work', 'space')], hiddenNeeds: [] });

  it('is allowed, and the shipped need keeps the word lookup', () => {
    expect(v.areas.find((a) => a.name === 'Work')?.needs.map((n) => n.id)).toEqual(['custom/work/space']);
    expect(v.match('space')).toBe('autonomy/space');
  });

  it('lets a custom win the lookup once the shipped one is hidden', () => {
    const hidden = buildVocab({ customAreas: [area('Work')], customNeeds: [need('Work', 'space')], hiddenNeeds: ['autonomy/space'] });
    expect(hidden.match('space')).toBe('custom/work/space');
  });
});

describe('what a need may be called', () => {
  const v = buildVocab({ customAreas: [area('Work')], customNeeds: [need('Work', 'being consulted')], hiddenNeeds: ['autonomy/choice'] });

  it('wants a word and an area', () => {
    expect(vocabProblem(v, '  ', 'Play')).toMatch(/word/);
    expect(vocabProblem(v, 'kite flying', '')).toMatch(/area/);
    expect(vocabProblem(v, 'kite flying', 'Nowhere')).toMatch(/not in your list/);
    expect(vocabProblem(v, '???', 'Play')).toMatch(/letter/);
  });

  it('refuses a word already under that area, however it is typed', () => {
    expect(vocabProblem(v, 'Fun', 'Play')).toBe('Already under Play.');
    expect(vocabProblem(v, 'being consulted', 'Work')).toBe('Already under Work.');
    expect(vocabProblem(v, 'self care', 'Physical well-being')).toBe('Already under Physical well-being, as "self-care".');
  });

  it('says so when the word is only hidden', () => {
    expect(vocabProblem(v, 'choice', 'Autonomy')).toMatch(/hidden/);
  });

  it('allows the same word under a different area', () => {
    expect(vocabProblem(v, 'space', 'Work')).toBe(null);
    expect(vocabProblem(v, 'fun', 'Work')).toBe(null);
  });
});

describe('what an area may be called', () => {
  const v = buildVocab({ customAreas: [area('Work')], customNeeds: [], hiddenNeeds: [] });

  it('wants a name that is not taken', () => {
    expect(areaProblem(v, '')).toMatch(/name/);
    expect(areaProblem(v, 'connection')).toMatch(/already/);
    expect(areaProblem(v, 'WORK')).toMatch(/already/);
    expect(areaProblem(v, 'Physical well being')).toMatch(/Too close/);
    expect(areaProblem(v, 'Ancestry')).toBe(null);
  });
});
