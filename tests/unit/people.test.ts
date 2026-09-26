// What a name gathers. This file did not exist while the bug below shipped: every card to
// yourself was invisible on People, because the row is called Myself and the card says Maya.
import { describe, expect, it } from 'vitest';
import { cardsWithPerson, draftsWithPerson, linksWith, personSummary } from '../../src/lib/core/people';
import { cardPerson } from '../../src/lib/core/cards';
import { filterTest } from '../../src/lib/core/sorts';
import type { Card } from '../../src/lib/core/types';

const OWNER = 'Maya';
const base: Card = {
  id: 'c', mine: true, kind: 'request', from: OWNER, to: 'Sam', about: '',
  observation: 'o', feelings: ['weary'], needs: ['rest'], requests: ['Would you?'],
  summary: 's', status: 'ready', created: '2026-07-01T10:00:00Z', updated: '2026-07-01T10:00:00Z',
  history: [{ state: 'ready', by: OWNER, at: '2026-07-01T10:00:00Z' }], links: []
};
const card = (o: Partial<Card>): Card => ({ ...base, ...o });

/** The composer writes the owner's own name into `to` for a card to yourself. */
const selfByOwnerName = card({ id: 'self-owner', to: OWNER });
/** Seeded and imported cards spell the same thing the other way. */
const selfByMyself = card({ id: 'self-literal', to: 'Myself' });
const toSam = card({ id: 'to-sam', to: 'Sam', updated: '2026-07-01T10:00:00Z' });
const fromSam = card({ id: 'from-sam', mine: false, from: 'Sam', to: OWNER, status: 'received', updated: '2026-07-03T10:00:00Z' });
const draftToSam = card({ id: 'draft-sam', to: 'Sam', status: 'draft', history: [{ state: 'draft', by: OWNER, at: '2026-07-02T10:00:00Z' }] });
const draftToSelf = card({ id: 'draft-self', to: OWNER, status: 'draft', history: [{ state: 'draft', by: OWNER, at: '2026-07-02T10:00:00Z' }] });

describe('which person a card sits under', () => {
  it('puts a card to yourself under Myself, however it spells you', () => {
    expect(cardPerson(selfByOwnerName, OWNER)).toBe('Myself');
    expect(cardPerson(selfByMyself, OWNER)).toBe('Myself');
  });

  it('puts a card to someone under their name, and a received card under its sender', () => {
    expect(cardPerson(toSam, OWNER)).toBe('Sam');
    expect(cardPerson(fromSam, OWNER)).toBe('Sam');
  });

  it('does not mistake a card from someone whose name matches the owner', () => {
    // a card received from another Maya belongs to that Maya, not to you
    expect(cardPerson(card({ id: 'x', mine: false, from: OWNER, to: 'Sam' }), OWNER)).toBe(OWNER);
  });
});

describe('the summary under a name', () => {
  const all = [selfByOwnerName, selfByMyself, toSam, fromSam, draftToSam, draftToSelf];

  it('finds cards to yourself, both spellings, counted once each', () => {
    // the reported bug: this said "no cards yet" while two cards sat under it
    expect(personSummary('Myself', all, OWNER)).toBe('2 open requests · 1 draft');
    expect(cardsWithPerson('Myself', all, OWNER).map((c) => c.id).sort())
      .toEqual(['self-literal', 'self-owner']);
  });

  it('counts a draft on its own, not as an open request', () => {
    expect(personSummary('Sam', [toSam, draftToSam], OWNER)).toBe('1 open request · 1 draft');
    // a person with only a draft has nothing open with you yet
    expect(personSummary('Sam', [draftToSam], OWNER)).toBe('1 draft');
  });

  it('still says when there is nothing, and when everything is settled', () => {
    expect(personSummary('Nobody', all, OWNER)).toBe('no cards yet');
    expect(personSummary('Sam', [card({ to: 'Sam', status: 'given' })], OWNER)).toBe('all settled');
  });

  it('separates drafts from finished cards on a person screen', () => {
    expect(draftsWithPerson('Sam', all, OWNER).map((c) => c.id)).toEqual(['draft-sam']);
    // newest first: the received card is the more recent of the two
    expect(cardsWithPerson('Sam', all, OWNER).map((c) => c.id)).toEqual(['from-sam', 'to-sam']);
  });

  it('leaves drafts out of the entangled count, since a draft has no links yet', () => {
    const linked = card({ id: 'l', to: 'Sam', links: [{ id: 'other' }] });
    const linkedDraft = card({ id: 'ld', to: 'Sam', status: 'draft', links: [{ id: 'other' }] });
    expect(linksWith('Sam', [linked, linkedDraft], OWNER)).toBe(1);
  });
});

describe('filtering the Cards list by a person', () => {
  it('finds cards to yourself under Myself, which it could not before', () => {
    const t = filterTest('p:Myself', OWNER)!;
    expect(t(selfByOwnerName)).toBe(true);
    expect(t(selfByMyself)).toBe(true);
    expect(t(toSam)).toBe(false);
  });

  it('still finds cards with a named person, in both directions', () => {
    const t = filterTest('p:Sam', OWNER)!;
    expect(t(toSam)).toBe(true);
    expect(t(fromSam)).toBe(true);
    expect(t(selfByOwnerName)).toBe(false);
  });
});
