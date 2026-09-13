// People (spec §5.12): what a name gathers across cards and needs.
import type { Card, Person, NeedPerson } from './types';
import { otherName, peopleOnNeed } from './cards';
import type { Need } from '$lib/data/needs';

/** What a name gathers, counting finished cards: a draft is not yet a card with anyone. */
export function personSummary(name: string, cards: Card[]): string {
  const cs = cards.filter((c) => otherName(c) === name && c.status !== 'draft');
  const open = cs.filter((c) => c.kind === 'request' && !['given', 'withdrawn', 'no', 'celebrated'].includes(c.status)).length;
  const grat = cs.filter((c) => c.kind === 'gratitude').length;
  const bits: string[] = [];
  if (open) bits.push(open + ' open ' + (open === 1 ? 'request' : 'requests'));
  if (grat) bits.push(grat + ' gratitude');
  if (!bits.length) bits.push(cs.length ? 'all settled' : 'no cards yet');
  return bits.join(' · ');
}

export function linksWith(name: string, cards: Card[]): number {
  return cards.filter((c) => otherName(c) === name && c.status !== 'draft').reduce((n, c) => n + c.links.length, 0);
}

/** Needs this person is named on. Hidden needs count: the intention was still made. */
export function needsWithPerson(p: Person, needs: Need[], cards: Card[], needPeople: NeedPerson[], people: Person[], owner: string): Need[] {
  return needs.filter((n) => peopleOnNeed(n.id, cards, needPeople, people, owner).some((x) => x.name === p.name));
}
