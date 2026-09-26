// Card helpers: status colours and labels, the people a card touches, and the response rules of spec §5.8.
import type { Card, CardState, HistoryEntry, NeedPerson, Person } from './types';
import { SELF_NAME } from './types';
import { matchNeed } from '$lib/data/needs';

export const STATE_NAMES: Record<CardState, string> = {
  received: 'New to you', heard: 'Heard, being held', maybe: 'Exploring together', shared: 'Shared, waiting',
  ready: 'Ready to share', yes: 'A yes, from the heart', given: 'Given', celebrated: 'Celebrated',
  no: 'A no, honored', withdrawn: 'Withdrawn', draft: 'Still a draft'
};

/** Waiting on you first, then along the journey. */
export const STATE_ORDER: CardState[] = ['received', 'heard', 'maybe', 'shared', 'ready', 'yes', 'given', 'celebrated', 'no', 'withdrawn', 'draft'];

export function statusDot(s: CardState | string): string {
  return ({
    draft: 'var(--neutral-400)', ready: 'var(--turmeric-500)', shared: 'var(--saffron-500)',
    received: 'var(--indigo-400)', heard: 'var(--peacock-500)', yes: 'var(--bodhi-500)',
    no: 'var(--clay-500)', maybe: 'var(--indigo-500)', given: 'var(--bodhi-600)',
    celebrated: 'var(--indigo-600)', withdrawn: 'var(--neutral-400)'
  } as Record<string, string>)[s] ?? 'var(--neutral-400)';
}

export function otherName(c: Pick<Card, 'mine' | 'from' | 'to'>): string {
  return c.mine ? c.to : c.from;
}

/**
 * The person a card sits under in People, which is not the same question as `otherName`.
 * A card of your own to yourself belongs to Myself, whichever way it spells you: the composer
 * writes the owner's name into `to`, while seeded and imported cards carry the literal
 * "Myself". Accepting both is what lets self-cards be found without rewriting anyone's data,
 * and keeps working for a card that arrives from somebody else's app.
 */
export function cardPerson(c: Pick<Card, 'mine' | 'from' | 'to'>, owner: string): string {
  if (!c.mine) return c.from;
  return c.to === owner || c.to === SELF_NAME ? SELF_NAME : c.to;
}

/** Who actually sat down and wrote a draft, which is not always who it is from. */
export function drafterOf(c: Pick<Card, 'history'>): string {
  return c.history.find((h) => h.state === 'draft')?.by ?? '';
}

/**
 * A card being written in someone else's voice: your guess at what they might say, addressed
 * to you, and not from them until they send it (spec §5.7). On their device the same card is
 * simply their own draft, because `mine` follows the author's name.
 *
 * Two of the three tests matter. `from !== owner` alone would call any draft somebody sent you
 * a guess, including one they wrote in their own voice and shared to be read: the drafting
 * entry is what tells the two apart, because only a guess was written down by someone other
 * than the person it comes from.
 */
export function isGuess(c: Pick<Card, 'from' | 'status' | 'history'>, owner: string): boolean {
  return c.status === 'draft' && !!c.from && c.from !== owner && drafterOf(c) !== c.from;
}

/** A draft somebody else wrote in their own voice and shared with you, to read or add to. */
export function isTheirDraft(c: Pick<Card, 'from' | 'status' | 'history'>, owner: string): boolean {
  return c.status === 'draft' && !!c.from && c.from !== owner && drafterOf(c) === c.from;
}

export function statusLabel(c: Pick<Card, 'mine' | 'from' | 'to' | 'status' | 'history'>): string {
  const o = otherName(c), s = c.status;
  if (!c.mine && s === 'draft') {
    return drafterOf(c) === c.from
      ? 'Still a draft, shared by ' + c.from
      : 'Still a guess, in ' + c.from + "'s words";
  }
  if (c.mine) {
    return ({
      draft: 'Draft', ready: 'Ready to share', shared: 'Shared with ' + c.to,
      heard: o + ' heard you, sitting with it', yes: o + ' would love to',
      no: o + ' cannot', maybe: 'Wants to explore',
      given: 'Given from the heart', celebrated: 'Celebrated', withdrawn: 'Withdrawn'
    } as Record<string, string>)[s] ?? s;
  }
  return ({
    received: 'New from ' + c.from, heard: 'Heard · sitting with it', yes: "I'd love to",
    no: 'I cannot', maybe: "Let's explore", given: 'Given to', celebrated: 'Celebrated',
    withdrawn: 'Withdrawn by ' + c.from, shared: 'New from ' + c.from
  } as Record<string, string>)[s] ?? s;
}

const ENTRY_LABELS: Record<string, string> = {
  draft: 'Draft', ready: 'Ready', shared: 'Shared', received: 'Received', heard: 'Heard, sitting with it',
  yes: "I'd love to", no: 'I cannot', maybe: "Let's explore", given: 'Given from the heart',
  celebrated: 'Celebrated', withdrawn: 'Withdrawn'
};

export function entryLabel(h: HistoryEntry): string {
  return (ENTRY_LABELS[h.state] ?? h.state) + ' · ' + h.by;
}

export function kindLine(c: Card): string {
  return c.mine ? (c.kind === 'gratitude' ? 'gratitude · to ' : 'request · for ') + c.to : c.kind + ' · from ' + c.from;
}

/** A received card still waiting on the owner. */
export function needsAttention(c: Card): boolean {
  return !c.mine && (c.status === 'received' || c.status === 'heard');
}

export function canRespond(c: Card): boolean {
  return !c.mine && c.kind === 'request' && (c.status === 'received' || c.status === 'heard');
}
export function canGive(c: Card): boolean {
  return c.kind === 'request' && c.status === 'yes';
}
export function canCelebrate(c: Card): boolean {
  return !c.mine && c.kind === 'gratitude' && (c.status === 'received' || c.status === 'heard');
}
export function canEdit(c: Card): boolean {
  return c.mine && (c.status === 'draft' || c.status === 'ready');
}
export function canWithdraw(c: Card): boolean {
  return c.mine && !['given', 'withdrawn', 'draft', 'ready'].includes(c.status);
}
/**
 * A card you wrote can be pointed at someone else until they have answered it: once there
 * is a reply, the exchange belongs to the two of you and rewriting who it was for would
 * make the history a lie. A draft changes hands in the composer instead.
 */
export function canReassign(c: Pick<Card, 'mine' | 'status'>): boolean {
  return c.mine && ['ready', 'shared', 'withdrawn'].includes(c.status);
}

export type NeedMatch = (word: string | null | undefined) => string | null;

/**
 * The inventory ids behind a card's needs: the stored link, or an exact vocabulary match.
 * The stored link always wins, so a card never quietly re-points at a need added later.
 */
export function cardNeedIds(c: Card, match: NeedMatch = matchNeed): (string | null)[] {
  return c.needs.map((w, i) => c.needIds?.[i] ?? match(w));
}

/** My finished cards on a need. A draft is not yet a card about anything. */
export function cardsOnNeed(cards: Card[], needId: string, match: NeedMatch = matchNeed): Card[] {
  return cards.filter((c) => c.mine && c.status !== 'draft' && cardNeedIds(c, match).includes(needId));
}

export interface NeedPersonRow {
  name: string;
  cards: Card[];
}

/** Named intentions plus the people my cards on this need are addressed to; Myself pinned first. */
export function peopleOnNeed(
  needId: string, cards: Card[], needPeople: NeedPerson[], people: Person[], owner: string, match: NeedMatch = matchNeed
): NeedPersonRow[] {
  const personName = (pid: string) => people.find((p) => p.id === pid)?.name ?? pid;
  const toName = (c: Card) => (c.to === owner ? SELF_NAME : c.to);
  const names = new Set(needPeople.filter((np) => np.needId === needId).map((np) => personName(np.personId)));
  const on = cardsOnNeed(cards, needId, match);
  for (const c of on) names.add(toName(c));
  return [...names]
    .sort((a, b) => (a === SELF_NAME ? -1 : b === SELF_NAME ? 1 : a.localeCompare(b)))
    .map((name) => ({ name, cards: on.filter((c) => toName(c) === name).sort((a, b) => b.updated.localeCompare(a.updated)) }));
}

export function shareFilename(c: Card): string {
  const author = c.from.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'card';
  return author + '-' + c.kind + '-' + c.created.slice(0, 10) + '-' + c.id.slice(0, 6) + '.gnvc.yaml';
}

export function searchText(c: Card): string {
  return [c.summary, c.about, c.observation, otherName(c), ...c.feelings, ...c.needs].join(' ').toLowerCase();
}

/** A deep-enough copy for undo snapshots and edits. */
export function cloneCard(c: Card): Card {
  return {
    ...c,
    feelings: [...c.feelings], needs: [...c.needs], requests: [...c.requests],
    needIds: c.needIds ? [...c.needIds] : undefined,
    history: c.history.map((h) => ({ ...h })),
    links: c.links.map((l) => ({ id: l.id, ...(l.pairs ? { pairs: l.pairs.map((p) => [p[0], p[1]] as [number, number]) } : {}) })),
    ...(c.draft ? { draft: structuredClone(c.draft) } : {}),
    extra: c.extra ? structuredClone(c.extra) : undefined
  };
}
