// People (spec §5.12): what a name gathers across cards and needs.
import type { Card, Person, NeedPerson } from './types';
import { cardPerson, peopleOnNeed } from './cards';
import type { Need } from '$lib/data/needs';

/** Every card that sits under a name, self-cards included. */
function cardsWith(name: string, cards: Card[], owner: string): Card[] {
  return cards.filter((c) => cardPerson(c, owner) === name);
}

/**
 * What a name gathers. A draft is counted, but on its own: it has not been sent, so calling it
 * an open request would claim something of the other person that is not true yet.
 */
export function personSummary(name: string, cards: Card[], owner: string): string {
  const all = cardsWith(name, cards, owner);
  const cs = all.filter((c) => c.status !== 'draft');
  const drafts = all.length - cs.length;
  const open = cs.filter((c) => c.kind === 'request' && !['given', 'withdrawn', 'no', 'celebrated'].includes(c.status)).length;
  const grat = cs.filter((c) => c.kind === 'gratitude').length;
  const bits: string[] = [];
  if (open) bits.push(open + ' open ' + (open === 1 ? 'request' : 'requests'));
  if (grat) bits.push(grat + ' gratitude');
  if (!bits.length && cs.length) bits.push('all settled');
  if (drafts) bits.push(drafts === 1 ? '1 draft' : drafts + ' drafts');
  if (!bits.length) bits.push('no cards yet');
  return bits.join(' · ');
}

/** Drafts are left out: a card acquires its links when it is finished, never before. */
export function linksWith(name: string, cards: Card[], owner: string): number {
  return cardsWith(name, cards, owner).filter((c) => c.status !== 'draft').reduce((n, c) => n + c.links.length, 0);
}

/** The finished cards with a person, newest first. */
export function cardsWithPerson(name: string, cards: Card[], owner: string): Card[] {
  return cardsWith(name, cards, owner)
    .filter((c) => c.status !== 'draft')
    .sort((a, b) => b.updated.localeCompare(a.updated));
}

/** The unfinished ones, which is where a card you have not sent them yet shows up. */
export function draftsWithPerson(name: string, cards: Card[], owner: string): Card[] {
  return cardsWith(name, cards, owner)
    .filter((c) => c.status === 'draft')
    .sort((a, b) => b.updated.localeCompare(a.updated));
}

/** Needs this person is named on. Hidden needs count: the intention was still made. */
export function needsWithPerson(p: Person, needs: Need[], cards: Card[], needPeople: NeedPerson[], people: Person[], owner: string): Need[] {
  return needs.filter((n) => peopleOnNeed(n.id, cards, needPeople, people, owner).some((x) => x.name === p.name));
}
