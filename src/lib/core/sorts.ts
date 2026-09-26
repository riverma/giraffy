// The Cards list: filters and sorts (spec §5.7).
import type { Card, CardSort, Person } from './types';
import { cardPerson, drafterOf, needsAttention, otherName, STATE_NAMES, STATE_ORDER, statusDot, searchText } from './cards';

export interface SortDef {
  id: CardSort;
  label: string;
  hint: string;
  short: string;
  cmp: (a: Card, b: Card) => number;
}

const by = (k: 'updated' | 'created', dir: 1 | -1) => (a: Card, b: Card) => dir * a[k].localeCompare(b[k]);
const latest = by('updated', -1);

export const SORTS: SortDef[] = [
  { id: 'updated', label: 'Latest change', hint: 'Most recently touched first', short: 'Latest', cmp: latest },
  { id: 'created', label: 'Date written', hint: 'Newest card first', short: 'Written', cmp: by('created', -1) },
  { id: 'oldest', label: 'Oldest first', hint: 'The card you have lived with longest', short: 'Oldest', cmp: by('updated', 1) },
  { id: 'kind', label: 'Type', hint: 'Gratitude, then requests', short: 'Type', cmp: (a, b) => a.kind.localeCompare(b.kind) || latest(a, b) },
  { id: 'entangled', label: 'Most entangled', hint: 'Cards with the most threads first', short: 'Entangled', cmp: (a, b) => b.links.length - a.links.length || latest(a, b) },
  { id: 'person', label: 'Person', hint: 'A to Z by who the card is with', short: 'Person', cmp: (a, b) => otherName(a).localeCompare(otherName(b)) || latest(a, b) },
  { id: 'state', label: 'Where it stands', hint: 'Waiting on you first, then along the journey', short: 'State', cmp: (a, b) => STATE_ORDER.indexOf(a.status) - STATE_ORDER.indexOf(b.status) || latest(a, b) }
];

export function sortDef(id: string): SortDef {
  return SORTS.find((s) => s.id === id) ?? SORTS[0];
}

/**
 * The predicate behind a filter id, or null for 'all'. `owner` is needed by the person
 * filter alone, so that a card to yourself is found under Myself like anywhere else.
 */
export function filterTest(filter: string, owner = ''): ((c: Card) => boolean) | null {
  if (filter === 'attention') return (c) => needsAttention(c) || (c.mine && ['yes', 'no', 'maybe'].includes(c.status));
  if (filter === 'request') return (c) => c.kind === 'request';
  if (filter === 'gratitude') return (c) => c.kind === 'gratitude';
  if (filter === 'entangled') return (c) => c.links.length > 0;
  if (filter === 'history') return (c) => c.history.length > 1;
  // owner-free, because a filter has no owner in scope: `mine` already settled whether the
  // card is yours when it was stored, and the drafting entry separates a guess from a draft
  // somebody simply sent you
  if (filter === 'guess') return (c) => !c.mine && c.status === 'draft' && drafterOf(c) !== c.from;
  if (filter.startsWith('p:')) return (c) => cardPerson(c, owner) === filter.slice(2);
  if (filter.startsWith('s:')) return (c) => c.status === filter.slice(2);
  return null;
}

const FIXED_LABELS: Record<string, string> = {
  all: 'All', attention: 'Needs attention', request: 'Requests', gratitude: 'Gratitude', entangled: 'Entangled', history: 'With history',
  guess: 'Imagined'
};

export function filterLabel(filter: string): string {
  if (FIXED_LABELS[filter]) return FIXED_LABELS[filter];
  if (filter.startsWith('s:')) return STATE_NAMES[filter.slice(2) as keyof typeof STATE_NAMES] ?? filter.slice(2);
  if (filter.startsWith('p:')) return filter.slice(2);
  return filter;
}

export interface FilterItem {
  id: string;
  label: string;
  count: number;
  dot: string | null;
}
export interface FilterGroup {
  name: string;
  items: FilterItem[];
}

/** Every filter in one place, with counts across all cards. */
export function filterGroups(cards: Card[], people: Person[], owner = ''): FilterGroup[] {
  const item = (id: string, dot: string | null = null): FilterItem => {
    const t = filterTest(id, owner);
    return { id, label: filterLabel(id), count: t ? cards.filter(t).length : cards.length, dot };
  };
  return [
    { name: 'Kind', items: [item('request'), item('gratitude')] },
    { name: 'Where it stands', items: STATE_ORDER.filter((st) => cards.some((c) => c.status === st)).map((st) => item('s:' + st, statusDot(st))) },
    { name: 'People', items: people.filter((p) => p.name !== 'Myself').map((p) => item('p:' + p.name)) },
    { name: 'Other', items: [item('attention'), item('entangled'), item('history'), ...(cards.some((c) => filterTest('guess')!(c)) ? [item('guess')] : [])] }
  ].filter((g) => g.items.length);
}

export function applyListQuery(list: Card[], filter: string, query: string, sort: string, owner = ''): Card[] {
  const t = filterTest(filter, owner);
  const q = query.trim().toLowerCase();
  return list
    .filter((c) => (t ? t(c) : true))
    .filter((c) => (q ? searchText(c).includes(q) : true))
    .sort(sortDef(sort).cmp);
}
