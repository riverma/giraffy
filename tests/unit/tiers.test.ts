import { describe, expect, test } from 'vitest';
import { catStats, deriveTier, nextTier, tierLabel } from '$lib/core/tiers';
import { synthesize } from '$lib/core/synthesize';
import { seedTiers } from '$lib/data/samples';
import { matchNeed, ALL_NEEDS, needIdFor } from '$lib/data/needs';

describe('tiers', () => {
  test('cycle and labels', () => {
    expect(nextTier(null)).toBe('met');
    expect(nextTier('unmet')).toBe(null);
    expect(tierLabel(null)).toBe('unexamined');
    expect(tierLabel('partly')).toBe('partly met');
  });

  test('derived methods', () => {
    const counts = { met: 2, partly: 1, unmet: 1 };
    expect(deriveTier(counts, 4, 'worst')).toBe('unmet');
    expect(deriveTier(counts, 4, 'majority')).toBe('met');
    expect(deriveTier({ met: 1, partly: 1, unmet: 1 }, 3, 'majority')).toBe('unmet'); // ties lean less met
    expect(deriveTier(counts, 4, 'average')).toBe('partly'); // (2+2+3)/4 = 1.75
    expect(deriveTier({ met: 3, partly: 0, unmet: 0 }, 3, 'average')).toBe('met');
  });

  test('category stats honour the hand-set override', () => {
    const autonomy = ALL_NEEDS.filter((n) => n.category === 'Autonomy');
    const st = catStats('Autonomy', autonomy, seedTiers(), {}, 'majority');
    expect(st.rated).toBe(7);
    expect(st.tier).toBe('partly');
    expect(catStats('Autonomy', autonomy, seedTiers(), { Autonomy: 'met' }).tier).toBe('met');
    expect(catStats('Play', ALL_NEEDS.filter((n) => n.category === 'Play'), {}, {}).tier).toBe(null);
  });

  test('category stats count the needs they are given, so hiding one leaves it out', () => {
    const autonomy = ALL_NEEDS.filter((n) => n.category === 'Autonomy');
    const withoutChoice = autonomy.filter((n) => n.id !== 'autonomy/choice');
    expect(catStats('Autonomy', withoutChoice, seedTiers(), {}).rated).toBe(6);
    expect(catStats('Autonomy', withoutChoice, seedTiers(), {}).total).toBe(6);
  });

  test('a need of your own counts in its area', () => {
    const play = ALL_NEEDS.filter((n) => n.category === 'Play');
    const mine = { id: 'custom/play/kite-flying', category: 'Play', word: 'kite flying', custom: true as const };
    const tiers = { 'custom/play/kite-flying': { tier: 'met' as const, changed: '2026-09-12T00:00:00Z', was: null } };
    const st = catStats('Play', [...play, mine], tiers, {});
    expect(st.total).toBe(play.length + 1);
    expect(st.rated).toBe(1);
    expect(st.tier).toBe('met');
  });

  test('every seed tier id exists in the vocabulary', () => {
    const ids = new Set(ALL_NEEDS.map((n) => n.id));
    for (const id of Object.keys(seedTiers())) expect(ids.has(id), id).toBe(true);
  });

  test('need matching is exact, including slashed halves', () => {
    expect(matchNeed('rest')).toBe(needIdFor('Physical well-being', 'rest / sleep'));
    expect(matchNeed('Support')).toBe('connection/support');
    expect(matchNeed('ease in the evenings')).toBe(null);
  });
});

describe('synthesize', () => {
  test('request and gratitude sentences', () => {
    expect(synthesize({ kind: 'request', observation: 'When I saw the dishes.', feelings: ['tired', 'sad'], needs: ['rest'], request: 'Would you be willing to wash them?' }))
      .toBe('When I saw the dishes, I felt tired and sad, because I need rest. Would you be willing to wash them?');
    expect(synthesize({ kind: 'gratitude', observation: 'you drove out', feelings: ['moved'], needs: ['support', 'ease'] }))
      .toBe('When you drove out, I felt moved, because it met my need for support and ease. Thank you.');
  });
});
