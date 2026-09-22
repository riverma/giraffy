// A backup is the whole app state in one YAML stream (spec §5.15): a header document, then one
// ordinary gNVC document per card with its app-only tail under `x-private:`.
import { Document, Scalar, YAMLMap, parseAllDocuments } from 'yaml';
import type { AppData, Card, CustomArea, CustomNeed, DerivedMethod, NeedPerson, Person, Tier, TierRecord } from './types';
import { cardDocument, parseCard, GnvcError } from './gnvc';
import { now } from './time';
import { NEED_CATEGORIES } from '$lib/data/needs';

export const BACKUP_VERSION = '1';

export interface Backup extends AppData {
  saved: string;
}

const TIERS: Tier[] = ['met', 'partly', 'unmet'];
const METHODS: DerivedMethod[] = ['worst', 'majority', 'average'];

export function isBackupText(text: string): boolean {
  return /^\s*giraffy-backup\s*:/m.test(text);
}

export function emitBackup(d: AppData, savedAt: string = now()): string {
  const head = new Document({});
  head.commentBefore =
    ' A Giraffy backup. Everything the app holds is in this one file:\n' +
    ' your name, settings, people, needs, any needs and areas of your\n' +
    ' own, and every card including drafts, each card as its own\n' +
    ' document below. Restore it from Settings, or from Import.';
  const root = head.contents as YAMLMap;
  root.set('giraffy-backup', BACKUP_VERSION);
  root.set('saved', savedAt);
  root.set('owner', d.owner);
  root.set('settings', head.createNode({
    coaching: d.coaching,
    preamble: d.preamble,
    'derived-method': d.derivedMethod,
    'card-filter': d.filter,
    'card-sort': d.sort
  }));
  root.set('people', head.createNode(d.people.map((p) => ({ id: p.id, name: p.name }))));
  if (d.customAreas.length) root.set('custom-areas', head.createNode(d.customAreas.map((a) => ({ name: a.name, created: a.created }))));
  if (d.customNeeds.length) {
    root.set('custom-needs', head.createNode(d.customNeeds.map((n) => ({ id: n.id, area: n.area, word: n.word, meaning: n.meaning, created: n.created }))));
  }
  const needTiers: Record<string, unknown> = {};
  for (const [id, r] of Object.entries(d.needTiers)) needTiers[id] = { tier: r.tier, changed: r.changed, ...(r.was ? { was: r.was } : {}) };
  const needNotes: Record<string, string> = {};
  for (const [id, n] of Object.entries(d.needNotes)) if (n) needNotes[id] = n;
  root.set('x-private', head.createNode({
    'need-tiers': needTiers,
    'area-tiers': { ...d.catTiers },
    'need-people': d.needPeople.map((p) => ({ need: p.needId, person: p.personId, created: p.created })),
    'need-notes': needNotes,
    ...(d.hiddenNeeds.length ? { 'hidden-needs': [...d.hiddenNeeds] } : {})
  }));
  const count = new Scalar(d.cards.length);
  count.comment = ' each one follows as its own document';
  root.set('cards', count);

  const opts = { lineWidth: 64, minContentWidth: 20 };
  const docs = [head.toString(opts)];
  for (const c of d.cards) {
    const pairs: Record<string, [number, number][]> = {};
    for (const l of c.links) if (l.pairs) pairs[l.id] = l.pairs;
    docs.push(cardDocument(c, { mine: c.mine, needIds: c.needIds, linkPairs: pairs, draft: c.draft }).toString(opts));
  }
  return docs.join('---\n');
}

const str = (v: unknown, fallback = ''): string => (v == null ? fallback : String(v));
const rec = (v: unknown): Record<string, unknown> => (v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : {});

/** Read a backup back. Throws GnvcError when the header or any card is unreadable. */
export function parseBackup(text: string): Backup {
  const docs = parseAllDocuments(text, { prettyErrors: true });
  if (!docs.length) throw new GnvcError('The backup is empty.');
  const headDoc = docs[0];
  if (headDoc.errors.length) throw new GnvcError('The backup header is not readable as YAML: ' + headDoc.errors[0].message);
  const h = rec(headDoc.toJS());
  if (h['giraffy-backup'] == null) throw new GnvcError('This does not start with a Giraffy backup header.');
  if (str(h['giraffy-backup']) !== BACKUP_VERSION) throw new GnvcError('This backup is version ' + str(h['giraffy-backup']) + '; Giraffy reads version ' + BACKUP_VERSION + '.');

  const settings = rec(h.settings);
  const owner = str(h.owner, 'You');
  const priv = rec(h['x-private']);

  const needTiers: Record<string, TierRecord> = {};
  for (const [id, v] of Object.entries(rec(priv['need-tiers']))) {
    const r = rec(v);
    const tier = str(r.tier) as Tier;
    if (!TIERS.includes(tier)) continue;
    const was = str(r.was) as Tier;
    needTiers[id] = { tier, changed: str(r.changed, now()), was: TIERS.includes(was) ? was : null };
  }
  const catTiers: Record<string, Tier> = {};
  for (const [cat, v] of Object.entries(rec(priv['area-tiers']))) if (TIERS.includes(str(v) as Tier)) catTiers[cat] = str(v) as Tier;
  const needPeople: NeedPerson[] = (Array.isArray(priv['need-people']) ? priv['need-people'] : [])
    .map((x) => rec(x))
    .filter((x) => x.need && x.person)
    .map((x) => ({ needId: str(x.need), personId: str(x.person), created: str(x.created, now()) }));
  const needNotes: Record<string, string> = {};
  for (const [id, v] of Object.entries(rec(priv['need-notes']))) if (v) needNotes[id] = str(v);

  const people: Person[] = (Array.isArray(h.people) ? h.people : [])
    .map((x) => rec(x))
    .filter((x) => x.id && x.name)
    .map((x) => ({ id: str(x.id), name: str(x.name) }));
  if (!people.some((p) => p.id === 'self')) people.unshift({ id: 'self', name: 'Myself' });

  const customAreas: CustomArea[] = (Array.isArray(h['custom-areas']) ? h['custom-areas'] : [])
    .map((x) => rec(x))
    .filter((x) => x.name)
    .map((x) => ({ name: str(x.name), created: str(x.created, now()) }));
  const areaNames = new Set([...NEED_CATEGORIES.map((c) => c.name), ...customAreas.map((a) => a.name)]);
  const customNeeds: CustomNeed[] = (Array.isArray(h['custom-needs']) ? h['custom-needs'] : [])
    .map((x) => rec(x))
    // a custom need without its prefix, its word, or an area to sit under has nowhere to go
    .filter((x) => str(x.id).startsWith('custom/') && x.word && areaNames.has(str(x.area)))
    .map((x) => ({ id: str(x.id), area: str(x.area), word: str(x.word), meaning: str(x.meaning), created: str(x.created, now()) }));
  const hiddenNeeds: string[] = (Array.isArray(priv['hidden-needs']) ? priv['hidden-needs'] : []).map((x) => str(x)).filter(Boolean);

  const cards: Card[] = [];
  for (const d of docs.slice(1)) {
    const raw = d.toString();
    if (!/gnvc\s*:/.test(raw)) continue;
    const { card, priv: tail } = parseCard(raw, owner);
    if (!tail) card.mine = card.from === owner;
    cards.push(card);
  }

  const method = str(settings['derived-method'], 'majority') as DerivedMethod;
  return {
    saved: str(h.saved),
    owner,
    coaching: settings.coaching !== false,
    preamble: settings.preamble !== false,
    derivedMethod: METHODS.includes(method) ? method : 'majority',
    filter: str(settings['card-filter'], 'all'),
    sort: (str(settings['card-sort'], 'updated') as AppData['sort']),
    people,
    cards,
    needTiers,
    catTiers,
    needPeople,
    needNotes,
    customAreas,
    customNeeds,
    hiddenNeeds
  };
}
