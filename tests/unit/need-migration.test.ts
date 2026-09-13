// Nobody loses a need they already marked when the vocabulary is settled.
import { describe, expect, it } from 'vitest';
import { ALL_NEEDS } from '../../src/lib/data/needs';
import { migrateNeedId, migrateNeedIds, needsMigration, NEED_ID_CHANGES } from '../../src/lib/core/need-migration';
import type { AppData, Card } from '../../src/lib/core/types';

const card = (needIds: (string | null)[]): Card => ({
  id: 'c1', mine: true, kind: 'request', from: 'Maya', to: 'Sam', about: '', observation: '',
  feelings: [], needs: [], needIds, requests: [], summary: '', status: 'ready',
  created: '2026-07-01T00:00:00Z', updated: '2026-07-01T00:00:00Z', history: [], links: []
});

const data = (over: Partial<AppData> = {}): AppData => ({
  owner: 'Maya', coaching: true, preamble: true, derivedMethod: 'majority', filter: 'all', sort: 'updated',
  people: [], cards: [], needTiers: {}, catTiers: {}, needPeople: [], needNotes: {},
  customAreas: [], customNeeds: [], hiddenNeeds: [], ...over
});

describe('need id migration', () => {
  it('points every old id at a need that exists today', () => {
    const ids = new Set(ALL_NEEDS.map((n) => n.id));
    const broken = Object.entries(NEED_ID_CHANGES).filter(([, to]) => !ids.has(to));
    expect(broken).toEqual([]);
  });

  it('covers every id that disappeared, and no id that did not', () => {
    const ids = new Set(ALL_NEEDS.map((n) => n.id));
    // nothing in the map should still be a live need
    expect(Object.keys(NEED_ID_CHANGES).filter((from) => ids.has(from))).toEqual([]);
  });

  it('leaves ids that did not move alone', () => {
    expect(migrateNeedId('play/fun')).toBe('play/fun');
    expect(migrateNeedId('connection/trust')).toBe('connection/trust');
  });

  it('carries a marked need to its new home', () => {
    const d = data({ needTiers: { 'meaning/awareness': { tier: 'partly', changed: '2026-07-01T00:00:00Z', was: null } } });
    migrateNeedIds(d);
    expect(d.needTiers['honesty/awareness']?.tier).toBe('partly');
    expect(d.needTiers['meaning/awareness']).toBeUndefined();
  });

  it('keeps the later mark when two needs merge into one', () => {
    const d = data({
      needTiers: {
        'connection/self-care': { tier: 'met', changed: '2026-07-01T00:00:00Z', was: null },
        'physical-well-being/care': { tier: 'unmet', changed: '2026-07-09T00:00:00Z', was: null }
      }
    });
    migrateNeedIds(d);
    expect(Object.keys(d.needTiers)).toEqual(['physical-well-being/self-care']);
    expect(d.needTiers['physical-well-being/self-care'].tier).toBe('unmet');
  });

  it('keeps both private notes when two needs merge', () => {
    const d = data({ needNotes: { 'meaning/movement': 'still moving', 'meaning/progress': 'nearly there' } });
    migrateNeedIds(d);
    expect(d.needNotes['meaning/progress']).toContain('still moving');
    expect(d.needNotes['meaning/progress']).toContain('nearly there');
  });

  it('moves named people without duplicating them', () => {
    const d = data({
      needPeople: [
        { needId: 'connection/presence', personId: 'sam', created: '2026-07-01T00:00:00Z' },
        { needId: 'connection/attentiveness', personId: 'sam', created: '2026-07-02T00:00:00Z' }
      ]
    });
    migrateNeedIds(d);
    expect(d.needPeople).toHaveLength(1);
    expect(d.needPeople[0].needId).toBe('connection/attentiveness');
  });

  it('rewrites the needs a card is linked to, nulls and all', () => {
    const d = data({ cards: [card(['peace/space', null, 'play/fun'])] });
    migrateNeedIds(d);
    expect(d.cards[0].needIds).toEqual(['autonomy/space', null, 'play/fun']);
  });

  it('changes nothing on data that has already moved', () => {
    const d = data({ needTiers: { 'honesty/awareness': { tier: 'met', changed: '2026-07-01T00:00:00Z', was: null } } });
    expect(needsMigration(d)).toBe(false);
    const before = JSON.stringify(d);
    migrateNeedIds(d);
    expect(JSON.stringify(d)).toBe(before);
  });

  it('notices when there is work to do', () => {
    expect(needsMigration(data({ needTiers: { 'peace/space': { tier: 'met', changed: '2026-07-01T00:00:00Z', was: null } } }))).toBe(true);
  });
});

describe('ids that are not ids', () => {
  it('leaves a word borrowed from Object.prototype alone', () => {
    // a file can carry any string as a need id; a plain lookup object would answer
    // 'toString' with a function, and a function cannot be stored or cloned
    for (const odd of ['toString', 'constructor', 'valueOf', 'hasOwnProperty', '__proto__']) {
      expect(typeof migrateNeedId(odd)).toBe('string');
      expect(migrateNeedId(odd)).toBe(odd);
    }
  });

  it('does not think such a card needs migrating', () => {
    const d = data({ cards: [card(['toString', 'constructor'])], needNotes: { valueOf: 'x' } });
    expect(needsMigration(d)).toBe(false);
    const out = migrateNeedIds(d);
    expect(out.cards[0].needIds).toEqual(['toString', 'constructor']);
    expect(out.needNotes).toEqual({ valueOf: 'x' });
    // and what comes out can still be stored
    expect(() => structuredClone(out)).not.toThrow();
  });
});
