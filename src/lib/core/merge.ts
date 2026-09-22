// Merging a card that came back (spec §6.4): union the history, take the body from the newest
// `updated` by the original author only, keep unknown keys, and union the links.
import type { Card, HistoryEntry } from './types';
import { cloneCard } from './cards';

const key = (h: HistoryEntry) => h.state + ' ' + h.by + ' ' + h.at;

export function unionHistory(a: HistoryEntry[], b: HistoryEntry[]): HistoryEntry[] {
  const seen = new Map<string, HistoryEntry>();
  for (const h of [...a, ...b]) {
    const k = key(h);
    const prev = seen.get(k);
    // the same entry twice: keep whichever carries a note
    if (!prev || (!prev.note && h.note)) seen.set(k, { ...h });
  }
  return [...seen.values()].sort((x, y) => x.at.localeCompare(y.at));
}

export interface MergeResult {
  card: Card;
  /** History entries the local card did not have before. */
  added: HistoryEntry[];
}

export function mergeCards(local: Card, incoming: Card): MergeResult {
  const out = cloneCard(local);
  const before = new Set(local.history.map(key));
  out.history = unionHistory(local.history, incoming.history);
  const added = out.history.filter((h) => !before.has(key(h)));

  // body: only the original author's newer copy may change what the card says
  if (incoming.from === local.from && incoming.updated > local.updated) {
    out.to = incoming.to;
    out.about = incoming.about;
    out.observation = incoming.observation;
    out.feelings = [...incoming.feelings];
    out.needs = [...incoming.needs];
    out.requests = [...incoming.requests];
    out.summary = incoming.summary;
    out.kind = incoming.kind;
    if (out.needIds && out.needIds.length !== out.needs.length) {
      out.needIds = out.needs.map((w) => local.needIds?.[local.needs.indexOf(w)] ?? null);
    }
  }

  // links: a plain union by id; app-only pairs stay with the local copy
  for (const l of incoming.links) if (!out.links.some((x) => x.id === l.id)) out.links.push({ id: l.id });

  // unknown keys: preserved verbatim, incoming wins on a clash
  if (incoming.extra || out.extra) out.extra = { ...(out.extra ?? {}), ...(incoming.extra ?? {}) };

  // status follows the latest entry in the merged history
  const last = out.history[out.history.length - 1];
  if (last) out.status = last.state;
  out.updated = [local.updated, incoming.updated, ...added.map((h) => h.at)].sort().pop() ?? local.updated;
  out.created = local.created || incoming.created;
  return { card: out, added };
}
