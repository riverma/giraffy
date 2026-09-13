// A card being written is a card, and picking it back up lands where it was left.
import { describe, expect, it } from 'vitest';
import { draftCardFrom, draftContent, draftLabel, freshDraft, isEmptyDraft, linkedNeedId, sanitizeDraft } from '../../src/lib/core/drafts';

describe('a draft card', () => {
  it('carries the words on the card and the composer state alongside', () => {
    const d = freshDraft('request', 'Robin');
    d.observation = 'When the kitchen light was still on at 2am';
    d.feelings = ['weary'];
    d.needs = ['rest / sleep'];
    d.needIds = { 'rest / sleep': 'physical-well-being/rest-sleep' };
    d.request = 'Would you be willing to turn it off?';
    d.step = 4;
    const c = draftCardFrom(d, 'Ash', 'c1', '2026-09-12T09:00:00Z');
    expect(c.status).toBe('draft');
    expect(c.mine).toBe(true);
    expect(c.from).toBe('Ash');
    expect(c.to).toBe('Robin');
    expect(c.observation).toBe(d.observation);
    expect(c.needIds).toEqual(['physical-well-being/rest-sleep']);
    expect(c.requests).toEqual([d.request]);
    expect(c.history).toEqual([{ state: 'draft', by: 'Ash', at: '2026-09-12T09:00:00Z' }]);
    expect(c.links).toEqual([]);
    expect(c.draft?.step).toBe(4);
  });

  it('sends a card with nobody named to Myself, as the owner', () => {
    const c = draftCardFrom(freshDraft('gratitude'), 'Ash', 'c2', '2026-09-12T09:00:00Z');
    expect(c.to).toBe('Ash');
    expect(c.requests).toEqual([]);
  });

  it('reads back exactly what it wrote', () => {
    const d = freshDraft('gratitude', 'Dad');
    d.summary = 'Thank you for the lift.';
    const c = draftCardFrom(d, 'Ash', 'c3', '2026-09-12T09:00:00Z');
    expect(sanitizeDraft(c.draft)).toEqual(d);
  });
});

describe('a draft with nothing in it', () => {
  it('is empty when nothing has been written', () => {
    expect(isEmptyDraft(freshDraft())).toBe(true);
    const d = freshDraft();
    d.observation = 'When I saw the note';
    expect(isEmptyDraft(d)).toBe(false);
  });

  it('is untouched when it matches how it was opened, even with a need seeded', () => {
    const seeded = freshDraft('request', 'Dad');
    seeded.needs = ['closeness'];
    seeded.needIds = { closeness: 'connection/closeness' };
    const seed = draftContent(seeded);
    expect(isEmptyDraft(seeded, seed)).toBe(true);
    // moving through the steps and opening an accordion is not writing
    seeded.step = 2;
    seeded.expandedCat = 'Connection';
    expect(isEmptyDraft(seeded, seed)).toBe(true);
    seeded.observation = 'When you called on Sunday';
    expect(isEmptyDraft(seeded, seed)).toBe(false);
  });
});

describe('knowing a draft by its line', () => {
  const card = (over: Record<string, unknown>) =>
    ({ ...draftCardFrom(freshDraft(), 'Ash', 'c', '2026-09-12T09:00:00Z'), ...over }) as Parameters<typeof draftLabel>[0];

  it('prefers the summary, then the observation, then the context', () => {
    expect(draftLabel(card({ summary: 'When you left, I felt.' }))).toBe('When you left, I felt.');
    expect(draftLabel(card({ observation: 'When I saw the dishes\nand the pan' }))).toBe('When I saw the dishes');
    expect(draftLabel(card({ about: 'Last night' }))).toBe('Last night');
    expect(draftLabel(card({}))).toBe('Nothing written yet');
  });
});

describe('reading a draft from a file', () => {
  it('fills in everything missing, and drops what does not belong', () => {
    const d = sanitizeDraft({ kind: 'gratitude', step: 99, feelings: ['glad', 7], needIds: { closeness: 'connection/closeness', x: 3 }, half: 'nonsense', quiet: 'yes' });
    expect(d.kind).toBe('gratitude');
    expect(d.step).toBe(5);
    expect(d.feelings).toEqual(['glad']);
    expect(d.needIds).toEqual({ closeness: 'connection/closeness' });
    expect(d.half).toBe('met');
    expect(d.quiet).toBe(false);
    expect(d.observation).toBe('');
  });

  it('survives complete rubbish', () => {
    expect(sanitizeDraft(null)).toEqual(freshDraft());
    expect(sanitizeDraft('nope')).toEqual(freshDraft());
  });
});

describe('a need word that names something on Object.prototype', () => {
  it('links like any other word, and never turns into a function', () => {
    const d = freshDraft('request', 'Robin');
    d.needs = ['constructor', 'toString'];
    expect(linkedNeedId(d, 'constructor')).toBe(null);
    const card = draftCardFrom(d, 'Ash', 'c1', '2026-09-13T09:00:00Z');
    expect(card.needIds).toEqual([null, null]);
    // the whole point: this card has to survive being stored
    expect(() => structuredClone(card)).not.toThrow();

    d.needIds['constructor'] = 'custom/work/constructor';
    expect(linkedNeedId(d, 'constructor')).toBe('custom/work/constructor');
    expect(draftCardFrom(d, 'Ash', 'c2', '2026-09-13T09:00:00Z').needIds).toEqual(['custom/work/constructor', null]);
  });

  it('survives a round trip through a file, where prototypes come back', () => {
    const plain = JSON.parse(JSON.stringify(freshDraft())) as ReturnType<typeof freshDraft>;
    plain.needs = ['valueOf'];
    expect(linkedNeedId(plain, 'valueOf')).toBe(null);
    expect(sanitizeDraft(plain).needIds).toEqual({});
  });
});
