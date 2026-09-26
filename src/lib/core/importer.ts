// Import (spec §5.10): read pasted text or a file, decide whether it is a new card, a card coming
// back, or a backup, and prepare exactly what applying it would do. Nothing here touches state.
import type { Card, HistoryEntry } from './types';
import { parseCard, GnvcError, looksLikeCard } from './gnvc';
import { isBackupText, parseBackup, type Backup } from './backup';
import { mergeCards } from './merge';
import { cloneCard } from './cards';
import { now } from './time';

export type ImportResult =
  | { type: 'error'; error: string }
  | { type: 'backup'; backup: Backup }
  | { type: 'merge'; target: Card; incoming: Card; merged: Card; added: HistoryEntry[] }
  | { type: 'new'; card: Card; incoming: Card; entangled: string[]; unknownPerson: boolean };

export const IMPORT_ERRORS = {
  empty: 'The paste area is empty. Paste the whole card, comments and all.',
  noVersion: 'No "gnvc:" version key found (expected gnvc: "1.0", near the end of the file). Line 1 onward parsed as YAML, but the schema requires the version key.'
};

export interface ImportContext {
  owner: string;
  cards: Card[];
  peopleNames: string[];
}

export function classifyImport(text: string, ctx: ImportContext): ImportResult {
  const t = text.trim();
  if (!t) return { type: 'error', error: IMPORT_ERRORS.empty };
  if (isBackupText(t)) {
    try {
      return { type: 'backup', backup: parseBackup(t) };
    } catch (e) {
      return { type: 'error', error: e instanceof Error ? e.message : String(e) };
    }
  }
  if (!looksLikeCard(t)) return { type: 'error', error: IMPORT_ERRORS.noVersion };
  let incoming: Card;
  try {
    incoming = parseCard(t, ctx.owner).card;
  } catch (e) {
    return { type: 'error', error: e instanceof GnvcError ? e.message : 'This could not be read: ' + (e instanceof Error ? e.message : String(e)) };
  }
  // a share never carries the private tail, so `mine` follows the author's name
  incoming.mine = incoming.from === ctx.owner;
  delete incoming.needIds;

  const target = ctx.cards.find((c) => c.id === incoming.id);
  if (target) {
    const { card, added } = mergeCards(target, incoming);
    return { type: 'merge', target, incoming, merged: card, added };
  }

  const at = now();
  const card = cloneCard(incoming);
  const entangled = incoming.links.map((l) => l.id).filter((id) => ctx.cards.some((c) => c.id === id));
  // links to cards this device does not hold stay as pointers; their lineage applies when they arrive
  // a draft is not a card anyone has sent yet: it is a guess waiting to be put right, so it
  // is not marked received and does not move out of the drafts (spec §5.7)
  if (!card.mine && card.status !== 'draft') {
    if (!card.to) card.to = ctx.owner;
    card.history = [...card.history, { state: 'received', by: ctx.owner, at }];
    if (card.status !== 'withdrawn') card.status = 'received';
    card.updated = at;
  }
  const unknownPerson = !card.mine && !ctx.peopleNames.includes(card.from);
  return { type: 'new', card, incoming, entangled, unknownPerson };
}
