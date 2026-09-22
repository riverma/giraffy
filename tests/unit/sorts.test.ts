// The card filters, and the one that had to tell a guess from any other draft.
import { describe, expect, it } from 'vitest';
import { filterTest, filterGroups, filterLabel } from '../../src/lib/core/sorts';
import type { Card } from '../../src/lib/core/types';

const base: Card = {
  id: 'c', mine: true, kind: 'request', from: 'Maya', to: 'Robin', about: '',
  observation: 'When the rota went up', feelings: ['weary'], needs: ['rest'], requests: ['Would you ask first?'],
  summary: 'a summary', status: 'ready', created: '2026-09-22T10:00:00Z', updated: '2026-09-22T10:00:00Z',
  history: [{ state: 'ready', by: 'Maya', at: '2026-09-22T10:00:00Z' }], links: []
};
const card = (o: Partial<Card>): Card => ({ ...base, ...o });

/** Maya's guess at Robin's card: from Robin, drafted by Maya, so not hers. */
const guess = card({ id: 'g', mine: false, from: 'Robin', to: 'Maya', status: 'draft',
  history: [{ state: 'draft', by: 'Maya', at: '2026-09-22T10:00:00Z' }] });
/** Robin's own half-written card, shared with Maya: from and drafter both Robin. */
const theirs = card({ id: 't', mine: false, from: 'Robin', to: 'Sam', status: 'draft',
  history: [{ state: 'draft', by: 'Robin', at: '2026-09-22T10:00:00Z' }] });
/** Maya's own draft. */
const ownDraft = card({ id: 'd', status: 'draft', history: [{ state: 'draft', by: 'Maya', at: '2026-09-22T10:00:00Z' }] });
const received = card({ id: 'r', mine: false, from: 'Robin', to: 'Maya', status: 'received' });

describe('the imagined-cards filter', () => {
  const t = filterTest('guess')!;

  it('picks out a guess', () => {
    expect(t(guess)).toBe(true);
  });

  it('leaves a draft somebody simply shared with you alone', () => {
    // the distinction the filter exists to make: both are drafts that are not yours
    expect(t(theirs)).toBe(false);
  });

  it('leaves your own drafts and your own cards alone', () => {
    expect(t(ownDraft)).toBe(false);
    expect(t(base)).toBe(false);
  });

  it('leaves received cards alone', () => {
    expect(t(received)).toBe(false);
  });

  it('is named for what it makes', () => {
    expect(filterLabel('guess')).toBe('Imagined');
  });

  it('is offered only once there is something to filter for', () => {
    const without = filterGroups([base, ownDraft, received], []);
    const other = (gs: ReturnType<typeof filterGroups>) => gs.find((g) => g.name === 'Other')!.items.map((i) => i.id);
    expect(other(without)).not.toContain('guess');

    const withOne = filterGroups([base, guess], []);
    expect(other(withOne)).toContain('guess');
    expect(withOne.find((g) => g.name === 'Other')!.items.find((i) => i.id === 'guess')!.count).toBe(1);
  });
});
