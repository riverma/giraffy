import { describe, expect, test } from 'vitest';
import { emitCard, parseCard, GnvcError } from '$lib/core/gnvc';
import { seedCards } from '$lib/data/samples';
import type { Card } from '$lib/core/types';

const owner = 'Maya';
const cards = seedCards(owner);

describe('gNVC emit', () => {
  test('a request card comes out in the human-first order of spec §6.1', () => {
    const y = emitCard(cards[0]);
    const order = ['from:', 'to:', 'about:', 'summary: >', 'observation: >', 'feelings:', 'needs:', 'requests:', 'status:', 'status_history:', 'entangled_with:', '# ---- giraffy app-only details ----', 'kind:', 'id:', 'created:', 'updated:', 'gnvc: "1.0" # spec: https://w3id.org/gnvc/1.0'];
    let last = -1;
    for (const k of order) {
      const i = y.indexOf('\n' + k);
      expect(i, k).toBeGreaterThan(last);
      last = i;
    }
    expect(y.startsWith('# A Giraffy card, written with care.')).toBe(true);
    expect(y).toContain('  - { state: ready, by: Maya, at: 2026-07-08T18:20:00Z }');
    expect(y).toContain('    note: >\n');
    expect(y).not.toContain('x-private');
    expect(y).not.toContain('mine');
    expect(y).not.toContain('pairs');
  });

  test('a gratitude card has no requests key; an unlinked card has entangled_with: []', () => {
    const y = emitCard(cards[2]);
    expect(y).not.toContain('requests:');
    expect(y).toContain('entangled_with: []');
  });

  test('the private tail only appears when asked for', () => {
    const y = emitCard(cards[0], { mine: true, needIds: ['connection/cooperation', null], linkPairs: { c2: [[1, 0]] } });
    expect(y).toContain('x-private:\n  mine: true\n  need-ids: [ connection/cooperation, null ]\n  link-pairs: { c2: [ [ 1, 0 ] ] }');
  });
});

describe('gNVC parse', () => {
  test('round-trips every seed card', () => {
    for (const c of cards) {
      const { card } = parseCard(emitCard(c), owner);
      const expected: Card = { ...c };
      delete expected.needIds;
      expected.links = c.links.map((l) => ({ id: l.id }));
      expect(card).toEqual(expected);
    }
  });

  test('round-trips the private tail from a backup document', () => {
    const c = cards[0];
    const { card, priv } = parseCard(emitCard(c, { mine: true, needIds: c.needIds, linkPairs: { c2: c.links[0].pairs! } }), 'Someone else');
    expect(card).toEqual(c);
    expect(priv?.mine).toBe(true);
  });

  test('keeps unknown keys and hand-written comments survive a re-emit of known content', () => {
    const y = emitCard(cards[0]).replace('\nkind: request', '\nmapping:\n  feelings_to_needs: [[0, 1]]\ncolour: teal\n\nkind: request');
    const { card } = parseCard(y, owner);
    expect(card.extra).toEqual({ mapping: { feelings_to_needs: [[0, 1]] }, colour: 'teal' });
    const again = parseCard(emitCard(card), owner).card;
    expect(again.extra).toEqual(card.extra);
  });

  test('accepts any 1.x, refuses 2.x and missing versions', () => {
    const y = emitCard(cards[0]);
    expect(parseCard(y.replace('gnvc: "1.0"', 'gnvc: "1.7"'), owner).card.id).toBe('c1');
    expect(() => parseCard(y.replace('gnvc: "1.0"', 'gnvc: "2.0"'), owner)).toThrow(/1\.x/);
    expect(() => parseCard(y.replace(/gnvc: "1.0".*/, ''), owner)).toThrow(/No "gnvc:" version key/);
  });

  test('friendly errors for bad YAML, bad states, and a request without requests', () => {
    expect(() => parseCard('from: [oops', owner)).toThrow(GnvcError);
    expect(() => parseCard(emitCard(cards[0]).replace('status: maybe', 'status: perhaps'), owner)).toThrow(/must be one of/);
    expect(() => parseCard(emitCard(cards[0]).replace(/requests:\n  - .*\n/, ''), owner)).toThrow(/missing "requests"/);
  });

  test('mine follows the author name when there is no private tail', () => {
    const { card } = parseCard(emitCard(cards[1]), owner);
    expect(card.mine).toBe(false);
    expect(parseCard(emitCard(cards[1]), 'Sam').card.mine).toBe(true);
  });

  test('a hand-written minimal card parses with sensible defaults', () => {
    const { card } = parseCard(['gnvc: "1.0"', 'kind: gratitude', 'id: abc', 'from: Lee', 'created: 2026-01-01T00:00:00Z', 'updated: 2026-01-01T00:00:00Z', 'observation: When you called.', 'feelings: [warm]', 'needs: [connection]'].join('\n'), owner);
    expect(card.status).toBe('ready');
    expect(card.history).toEqual([]);
    expect(card.links).toEqual([]);
    expect(card.requests).toEqual([]);
  });
});
