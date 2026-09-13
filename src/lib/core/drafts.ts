// Drafts (spec §5.7). A card being written is a card: it sits in the cards list with
// status 'draft', so it is in the undo history, in a backup, and in the Cards tab like
// anything else. The composer's own state, including which step you were on, rides along
// under `draft` and is dropped the moment the card is finished.

import type { Card, DraftState, Kind } from './types';
import { SELF_NAME } from './types';

/**
 * The word-to-id map is keyed by whatever someone types, so it must not answer for words
 * like "constructor" or "toString" with something off Object.prototype. Reads go through
 * linkedNeedId below for the same reason: a map that has been through storage is plain again.
 */
export function emptyIds(): Record<string, string> {
  return Object.create(null) as Record<string, string>;
}

/** The id a draft has linked this word to, or null. Never an inherited member. */
export function linkedNeedId(d: Pick<DraftState, 'needIds'>, word: string): string | null {
  return Object.hasOwn(d.needIds, word) ? d.needIds[word] : null;
}

export function freshDraft(kind: Kind = 'request', personName: string | null = null, linkTo: string | null = null): DraftState {
  return {
    step: 0, kind, persons: personName ? [personName] : [], newPerson: '', context: '',
    observation: '', feelings: [], needs: [], request: '', customFeeling: '', customNeed: '',
    summary: '', summaryCustom: false, showExamples: false, expandedFamily: null, expandedCat: null,
    feelSearch: '', half: kind === 'gratitude' ? 'met' : 'unmet', quiet: false, linkTo, needIds: emptyIds()
  };
}

/** Everyone a card is for: the picked chips plus a typed new name; nobody means Myself. */
export function draftPeople(d: Pick<DraftState, 'persons' | 'newPerson'>): string[] {
  const out = [...d.persons];
  const typed = d.newPerson.trim();
  if (typed && !out.includes(typed)) out.push(typed);
  return out.length ? out : [SELF_NAME];
}

/** The parts of a draft that show on the card itself, so a list can read it like any card. */
export function draftFace(d: DraftState, owner: string): Pick<Card, 'kind' | 'to' | 'about' | 'observation' | 'feelings' | 'needs' | 'needIds' | 'requests' | 'summary'> {
  const to = draftPeople(d).map((nm) => (nm === SELF_NAME ? owner : nm))[0];
  return {
    kind: d.kind,
    to,
    about: d.context,
    observation: d.observation,
    feelings: [...d.feelings],
    needs: [...d.needs],
    needIds: d.needs.map((w) => linkedNeedId(d, w)),
    requests: d.kind === 'request' && d.request ? [d.request] : [],
    summary: d.summary
  };
}

/** A new draft card. No links yet: a draft joins a thread only when it is finished. */
export function draftCardFrom(d: DraftState, owner: string, id: string, at: string): Card {
  return {
    id,
    mine: true,
    from: owner,
    ...draftFace(d, owner),
    status: 'draft',
    created: at,
    updated: at,
    history: [{ state: 'draft', by: owner, at }],
    links: [],
    draft: structuredClone(d)
  };
}

/** What makes a draft worth keeping: the words, not which accordion was open. */
export function draftContent(d: DraftState): string {
  return JSON.stringify([
    d.kind, d.persons, d.newPerson.trim(), d.context.trim(), d.observation.trim(),
    d.feelings, d.needs, d.needIds, d.request.trim(), d.summary.trim(), d.linkTo
  ]);
}

/**
 * Nothing here worth keeping. With `seed` (the draft as it was opened a moment ago) this
 * means untouched, so opening the composer and closing it again leaves nothing behind.
 */
export function isEmptyDraft(d: DraftState, seed?: string | null): boolean {
  if (seed) return draftContent(d) === seed;
  return !d.context.trim() && !d.observation.trim() && !d.request.trim() && !d.summary.trim()
    && !d.feelings.length && !d.needs.length && !d.newPerson.trim();
}

/** One line to know a draft by, in a list of drafts. */
export function draftLabel(c: Card): string {
  const first = (s: string) => s.trim().split('\n')[0].trim();
  return first(c.summary) || first(c.observation) || first(c.about) || 'Nothing written yet';
}

const str = (v: unknown, fallback = ''): string => (typeof v === 'string' ? v : fallback);
const strs = (v: unknown): string[] => (Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : []);

/** Read a draft back from a backup, or from a version of Giraffy that held fewer fields. */
export function sanitizeDraft(raw: unknown): DraftState {
  const r = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  const kind: Kind = r.kind === 'gratitude' ? 'gratitude' : 'request';
  const d = freshDraft(kind);
  const needIds = emptyIds();
  if (r.needIds && typeof r.needIds === 'object' && !Array.isArray(r.needIds)) {
    for (const [w, id] of Object.entries(r.needIds as Record<string, unknown>)) if (typeof id === 'string') needIds[w] = id;
  }
  return {
    ...d,
    step: Math.max(0, Math.min(5, Math.round(Number(r.step) || 0))),
    persons: strs(r.persons),
    newPerson: str(r.newPerson),
    context: str(r.context),
    observation: str(r.observation),
    feelings: strs(r.feelings),
    needs: strs(r.needs),
    request: str(r.request),
    customFeeling: str(r.customFeeling),
    customNeed: str(r.customNeed),
    summary: str(r.summary),
    summaryCustom: r.summaryCustom === true,
    showExamples: r.showExamples === true,
    expandedFamily: typeof r.expandedFamily === 'string' ? r.expandedFamily : null,
    expandedCat: typeof r.expandedCat === 'string' ? r.expandedCat : null,
    feelSearch: str(r.feelSearch),
    half: r.half === 'met' ? 'met' : r.half === 'unmet' ? 'unmet' : d.half,
    quiet: r.quiet === true,
    linkTo: typeof r.linkTo === 'string' ? r.linkTo : null,
    needIds
  };
}
