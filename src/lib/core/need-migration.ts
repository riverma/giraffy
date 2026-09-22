// Carrying data across the needs vocabulary change (spec §5.5).
//
// A need's id is built from its area and its word, so renaming a word or moving a need to
// another area changes the id that marked tiers, named people, private notes, and card
// links are stored against. This maps every id that existed before the vocabulary was
// settled onto the need it became, so nothing anyone has already marked is lost.
//
// The vocabulary is fixed now. If it ever changes again, add another map rather than
// editing this one, and bump the database version so old data passes through both.

import type { AppData, TierRecord } from './types';

/**
 * Old need id to the need it is now. Every id that disappeared appears here.
 *
 * Prototype-less on purpose: a file can carry any string as a need id, and with an ordinary
 * object `NEED_ID_CHANGES['toString']` would hand back a function rather than nothing.
 */
export const NEED_ID_CHANGES: Record<string, string> = Object.assign(Object.create(null) as Record<string, string>, {
  // the three self-expressions became one, under Meaning
  'autonomy/self-expression': 'meaning/self-expression',
  'connection/self-expression': 'meaning/self-expression',

  // renamed in place, same meaning
  'connection/authenticity': 'connection/vulnerability',
  'connection/integrity': 'connection/alignment',
  'connection/presence': 'connection/attentiveness',
  'connection/respect-self-respect': 'connection/respect',
  'meaning/consciousness': 'meaning/intentional',
  'meaning/integrity': 'meaning/wholeness',
  'meaning/understanding': 'meaning/insight',
  'peace/acceptance': 'peace/contentment',
  'peace/communion': 'peace/transcendence',

  // moved to the area that owns them now
  'connection/self-acceptance': 'honesty/self-acceptance',
  'connection/self-connection': 'honesty/self-connection',
  'meaning/awareness': 'honesty/awareness',

  // said twice, now said once
  'connection/self-care': 'physical-well-being/self-care',
  'physical-well-being/care': 'physical-well-being/self-care',
  'meaning/movement': 'meaning/progress',
  'meaning/stimulation': 'play/stimulation',
  'peace/space': 'autonomy/space',

  // being present was three needs; it is one, under Peace
  'honesty/presence': 'peace/present',
  'meaning/presence': 'peace/present'
});

/** The need this id points at today. Ids that never moved are returned unchanged. */
export function migrateNeedId(id: string): string {
  // a need someone added is theirs alone; the shipped vocabulary's history is none of its business
  if (id.startsWith('custom/')) return id;
  return Object.hasOwn(NEED_ID_CHANGES, id) ? NEED_ID_CHANGES[id] : id;
}

export function needsMigration(data: Pick<AppData, 'needTiers' | 'needPeople' | 'needNotes' | 'cards'>): boolean {
  if (Object.keys(data.needTiers).some((id) => id in NEED_ID_CHANGES)) return true;
  if (Object.keys(data.needNotes).some((id) => id in NEED_ID_CHANGES)) return true;
  if (data.needPeople.some((p) => p.needId in NEED_ID_CHANGES)) return true;
  return data.cards.some((c) => (c.needIds ?? []).some((id) => id && id in NEED_ID_CHANGES));
}

/**
 * The later mark wins when two old needs merge into one, so the freshest reading survives.
 *
 * Plain objects, deliberately: what this returns is assigned into the app's reactive state,
 * and Svelte does not proxy an object with no prototype, so a prototype-less one here would
 * leave every later change invisible to the screen. The safety is `Object.hasOwn` on the way
 * in, not the shape of the object.
 */
function mergeTiers(tiers: Record<string, TierRecord>): Record<string, TierRecord> {
  const out: Record<string, TierRecord> = {};
  for (const [id, rec] of Object.entries(tiers)) {
    const now = migrateNeedId(id);
    const held = Object.hasOwn(out, now) ? out[now] : undefined;
    if (!held || rec.changed > held.changed) out[now] = { ...rec };
  }
  return out;
}

/** Rewrites every stored need id in place. Safe to run on data that has already moved. */
export function migrateNeedIds<T extends Pick<AppData, 'needTiers' | 'needPeople' | 'needNotes' | 'cards'>>(data: T): T {
  data.needTiers = mergeTiers(data.needTiers);

  const notes: Record<string, string> = {};
  for (const [id, note] of Object.entries(data.needNotes)) {
    const now = migrateNeedId(id);
    // two needs merging into one keeps both notes rather than dropping either
    const held = Object.hasOwn(notes, now) ? notes[now] : '';
    notes[now] = held ? held + '\n\n' + note : note;
  }
  data.needNotes = notes;

  const seen = new Set<string>();
  data.needPeople = data.needPeople
    .map((p) => ({ ...p, needId: migrateNeedId(p.needId) }))
    .filter((p) => {
      const key = p.needId + '|' + p.personId;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

  for (const card of data.cards) {
    if (card.needIds) card.needIds = card.needIds.map((id) => (id ? migrateNeedId(id) : id));
  }
  return data;
}
