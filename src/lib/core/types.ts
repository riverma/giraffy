// Core data shapes. Cards mirror the gNVC card (spec §6); everything else is app-only (§5.16.1).

import type { FeelingHalf } from '$lib/data/feelings';

export type Kind = 'request' | 'gratitude';

export type CardState =
  | 'draft' | 'ready' | 'shared' | 'received' | 'heard'
  | 'yes' | 'no' | 'maybe' | 'given' | 'celebrated' | 'withdrawn';

export const CARD_STATES: CardState[] = [
  'draft', 'ready', 'shared', 'received', 'heard', 'yes', 'no', 'maybe', 'given', 'celebrated', 'withdrawn'
];

export interface HistoryEntry {
  state: CardState;
  by: string;
  at: string;
  note?: string;
}

/** A pointer to a neighbouring card. `pairs` is app-only: [theirNeedIndex, myNeedIndex] tuples. */
export interface Link {
  id: string;
  pairs?: [number, number][];
}

/**
 * A card still being written: everything the composer holds, so closing the app and coming
 * back lands on the same step with the same words. Rides on the draft card itself (spec §5.7),
 * which is why it is in a backup and in the undo history like any other part of a card.
 */
export interface DraftState {
  step: number;
  kind: Kind;
  persons: string[];
  newPerson: string;
  context: string;
  observation: string;
  feelings: string[];
  needs: string[];
  request: string;
  customFeeling: string;
  customNeed: string;
  summary: string;
  summaryCustom: boolean;
  showExamples: boolean;
  expandedFamily: string | null;
  expandedCat: string | null;
  feelSearch: string;
  half: FeelingHalf;
  quiet: boolean;
  linkTo: string | null;
  /**
   * Whose voice this is being written in, when it is not your own (spec §5.7). A guess at
   * someone else's card: written by you, as them, addressed to you, and theirs to correct.
   */
  asPerson: string | null;
  /** Word to need id, for the words picked from the needs list. */
  needIds: Record<string, string>;
}

export interface Card {
  id: string;
  /** Written on this device (from === owner at the time). Never serialized in a share. */
  mine: boolean;
  kind: Kind;
  from: string;
  to: string;
  about: string;
  observation: string;
  feelings: string[];
  needs: string[];
  /** Parallel to `needs`: the id in the needs inventory each word is linked to, or null. App-only. */
  needIds?: (string | null)[];
  requests: string[];
  summary: string;
  status: CardState;
  created: string;
  updated: string;
  history: HistoryEntry[];
  links: Link[];
  /** The composer's own state, present only while the card is a draft. App-only. */
  draft?: DraftState;
  /** Unknown top-level keys from an imported file, preserved verbatim (spec §6.4). */
  extra?: Record<string, unknown>;
}

export interface Person {
  id: string;
  name: string;
}

export type Tier = 'met' | 'partly' | 'unmet';

export interface TierRecord {
  tier: Tier;
  changed: string;
  was: Tier | null;
}

export interface NeedPerson {
  needId: string;
  personId: string;
  created: string;
}

export type DerivedMethod = 'worst' | 'majority' | 'average';

/** An area of a person's own, sitting after the seven that ship. Its name is its identity. */
export interface CustomArea {
  name: string;
  created: string;
}

/** A need a person added. Its id always begins `custom/`, so it can never be taken for a shipped one. */
export interface CustomNeed {
  id: string;
  area: string;
  word: string;
  meaning: string;
  created: string;
}

export type CardFilter = string; // 'all' | 'attention' | 'request' | 'gratitude' | 'entangled' | 'history' | 's:<state>' | 'p:<name>'
export type CardSort = 'updated' | 'created' | 'oldest' | 'kind' | 'entangled' | 'person' | 'state';

/** Everything that goes into a backup and comes back from a restore. */
export interface AppData {
  owner: string;
  coaching: boolean;
  preamble: boolean;
  derivedMethod: DerivedMethod;
  filter: CardFilter;
  sort: CardSort;
  people: Person[];
  cards: Card[];
  needTiers: Record<string, TierRecord>;
  catTiers: Record<string, Tier>;
  needPeople: NeedPerson[];
  needNotes: Record<string, string>;
  customAreas: CustomArea[];
  customNeeds: CustomNeed[];
  /** Shipped needs the person has hidden. Everything they marked on one is kept. */
  hiddenNeeds: string[];
}

export const SELF_ID = 'self';
export const SELF_NAME = 'Myself';
