// The needs list a person actually sees (spec §5.4).
//
// The shipped vocabulary in needs.ts is fixed: it is a released structure, and data is
// entered against it, so it is never rewritten. What a person adds or hides lives in their
// data instead, and this module folds the two into one list that every screen reads.
//
// Two rules hold the seams together:
//   - a custom need's id always begins `custom/`, so it can never collide with a shipped id
//     and the vocabulary migration (need-migration.ts) leaves it alone;
//   - a word is unique within its area, not across the whole list, so "space" may sit under
//     Autonomy and under an area of your own.

import type { AppData } from '$lib/core/types';
import { ALL_NEEDS, NEED_CATEGORIES, slug, type Need } from './needs';
import { needMeaning } from './need-meanings';

export interface VocabArea {
  name: string;
  custom: boolean;
  /** Visible needs only, alphabetical, shipped and custom together. */
  needs: Need[];
}

export interface Vocab {
  /** The seven shipped areas in their shipped order, then areas of your own, alphabetical. */
  areas: VocabArea[];
  /** Every visible need, flat, in area order. Totals and the check-in count these. */
  visible: Need[];
  /** Every need there is, hidden ones included: for cards, people, and need detail. */
  byId: Map<string, Need>;
  /** Shipped needs that are hidden right now, for the list in Settings. */
  hidden: Need[];
  hiddenIds: Set<string>;
  /** The need a word points at, or null. A shipped need wins over a custom of the same word. */
  match(word: string | null | undefined): string | null;
}

const BY_WORD = new Map<string, Need>();
for (const n of ALL_NEEDS) BY_WORD.set(n.id, n);

/** `custom/<area>/<word>`. The prefix is what keeps a custom need out of the shipped namespace. */
export function customNeedId(area: string, word: string): string {
  return 'custom/' + slug(area) + '/' + slug(word);
}

/** Every spelling a word answers to: itself, and each half of an "a / b" pair. */
function wordKeys(word: string): string[] {
  const bare = word.replace(/\(.*?\)/g, '');
  return [word.toLowerCase(), ...bare.split('/').map((a) => a.trim().toLowerCase())].filter(Boolean);
}

function byWord(a: Need, b: Need): number {
  return a.word.localeCompare(b.word, 'en');
}

export function buildVocab(d: Pick<AppData, 'customAreas' | 'customNeeds' | 'hiddenNeeds'>): Vocab {
  const hiddenIds = new Set((d.hiddenNeeds ?? []).filter((id) => BY_WORD.has(id)));
  const customs: Need[] = (d.customNeeds ?? []).map((c) => ({
    id: c.id, category: c.area, word: c.word, custom: true, meaning: c.meaning
  }));

  const byId = new Map<string, Need>(BY_WORD);
  for (const n of customs) byId.set(n.id, n);

  const names = [
    ...NEED_CATEGORIES.map((c) => ({ name: c.name, custom: false })),
    ...(d.customAreas ?? []).map((a) => ({ name: a.name, custom: true })).sort((a, b) => a.name.localeCompare(b.name, 'en'))
  ];

  const areas: VocabArea[] = names.map(({ name, custom }) => ({
    name,
    custom,
    needs: [...ALL_NEEDS.filter((n) => n.category === name && !hiddenIds.has(n.id)), ...customs.filter((n) => n.category === name)].sort(byWord)
  }));

  const visible = areas.flatMap((a) => a.needs);
  const hidden = ALL_NEEDS.filter((n) => hiddenIds.has(n.id));

  const wordIndex = new Map<string, string>();
  // customs first so a shipped need of the same word overwrites them and wins the lookup
  for (const n of [...visible.filter((x) => x.custom), ...visible.filter((x) => !x.custom)]) {
    for (const k of wordKeys(n.word)) wordIndex.set(k, n.id);
  }

  return {
    areas,
    visible,
    byId,
    hidden,
    hiddenIds,
    match(word) {
      const w = String(word ?? '').trim().toLowerCase();
      return (w && wordIndex.get(w)) || null;
    }
  };
}

/** What each need means, wherever it comes from. */
export function meaningOf(v: Vocab, id: string | null | undefined): string {
  const n = id ? v.byId.get(id) : undefined;
  return n?.meaning ?? needMeaning(id);
}

/** Why this word cannot be added under this area, in words the sheet can show. Null means go ahead. */
export function vocabProblem(v: Vocab, word: string, area: string): string | null {
  const w = word.trim();
  if (!w) return 'Give it a word first.';
  if (!area) return 'Pick an area for it.';
  if (!v.areas.some((a) => a.name === area)) return 'That area is not in your list.';
  if (!slug(w)) return 'Give it a word with a letter or a number in it.';
  const lower = w.toLowerCase();
  // slugs as well as words, so "self care" meets the "self-care" that is already there
  const same = [...v.byId.values()].find((n) => n.category === area && (n.word.toLowerCase() === lower || slug(n.word) === slug(w)));
  if (same) {
    if (v.hiddenIds.has(same.id)) return 'Already under ' + area + ', and hidden. Settings can show it again.';
    return same.word.toLowerCase() === lower ? 'Already under ' + area + '.' : 'Already under ' + area + ', as "' + same.word + '".';
  }
  return null;
}

/** Why this area name cannot be added. Null means go ahead. */
export function areaProblem(v: Vocab, name: string): string | null {
  const nm = name.trim();
  if (!nm) return 'Give the area a name first.';
  if (!slug(nm)) return 'Give it a name with a letter or a number in it.';
  const lower = nm.toLowerCase();
  if (v.areas.some((a) => a.name.toLowerCase() === lower)) return 'You have an area by that name already.';
  if (v.areas.some((a) => slug(a.name) === slug(nm))) return 'Too close to an area you have already.';
  return null;
}
