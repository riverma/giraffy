// The gNVC card format (spec §6): emit a card as a human-first YAML file, and read one back.
// Emission uses the yaml Document API so comments and block styles come out exactly as the spec shows;
// parsing keeps unknown keys so a hand-annotated file survives a round trip.
import { Document, Scalar, YAMLSeq, YAMLMap, Pair, parseDocument } from 'yaml';
import type { Card, CardState, DraftState, HistoryEntry, Kind, Link } from './types';
import { CARD_STATES } from './types';
import { sanitizeDraft } from './drafts';
import { validate } from './gnvc-validate.js';

export const GNVC_VERSION = '1.0';
export const SPEC_URL = 'https://w3id.org/gnvc/1.0';
export const APP_URL = 'https://giraffy.riverma.com';

const LINE_WIDTH = 64;

/** Keys the app understands; anything else is carried in `card.extra`. */
const KNOWN_KEYS = new Set([
  'gnvc', 'kind', 'id', 'from', 'to', 'about', 'summary', 'observation', 'feelings', 'needs', 'requests',
  'status', 'status_history', 'entangled_with', 'created', 'updated', 'x-private'
]);

function folded(text: string): Scalar {
  // nothing to fold on a card that is still a draft: a plain empty string reads better
  if (!text.trim()) return new Scalar('');
  // a trailing newline makes yaml emit the clip form (`>`) the spec shows, not `>-`
  const s = new Scalar(text.trim() + '\n');
  s.type = Scalar.BLOCK_FOLDED;
  return s;
}

function quoted(text: string): Scalar {
  const s = new Scalar(text);
  s.type = Scalar.QUOTE_DOUBLE;
  return s;
}

function flow<T extends { flow?: boolean }>(node: T): T {
  node.flow = true;
  if (node instanceof YAMLSeq || node instanceof YAMLMap) {
    for (const it of node.items as unknown[]) {
      const v = it instanceof Pair ? it.value : it;
      if (v instanceof YAMLSeq || v instanceof YAMLMap) flow(v);
    }
  }
  return node;
}

function plainList(items: string[]): YAMLSeq {
  const seq = new YAMLSeq();
  for (const it of items) seq.items.push(new Scalar(it));
  return seq;
}

function historySeq(history: HistoryEntry[]): YAMLSeq {
  const seq = new YAMLSeq();
  for (const h of history) {
    const m = new YAMLMap();
    m.set('state', h.state);
    m.set('by', h.by);
    m.set('at', h.at);
    if (h.note) {
      m.set('note', folded(h.note));
    } else {
      m.flow = true;
    }
    seq.items.push(m);
  }
  return seq;
}

function linksSeq(links: Link[]): YAMLSeq {
  const seq = new YAMLSeq();
  for (const l of links) {
    const m = new YAMLMap();
    m.set('id', l.id);
    seq.items.push(m);
  }
  if (!links.length) seq.flow = true;
  return seq;
}

/** Options for the app-only tail a backup carries (never present in a share). */
export interface PrivateTail {
  mine: boolean;
  needIds?: (string | null)[];
  linkPairs?: Record<string, [number, number][]>;
  /** The composer's state, on a card that is still a draft. */
  draft?: DraftState;
}

/** The YAML Document for a card, ready to stringify. */
export function cardDocument(c: Card, priv?: PrivateTail): Document {
  const doc = new Document({});
  const root = doc.contents as YAMLMap;
  const add = (key: string, value: unknown, opts: { space?: boolean; commentBefore?: string; comment?: string } = {}) => {
    const k = new Scalar(key);
    if (opts.space) k.spaceBefore = true;
    if (opts.commentBefore) k.commentBefore = opts.commentBefore;
    const v = value instanceof Scalar || value instanceof YAMLSeq || value instanceof YAMLMap ? value : new Scalar(value);
    if (opts.comment) (v as Scalar).comment = opts.comment;
    root.items.push(new Pair(k, v));
  };
  doc.commentBefore = ' A Giraffy card, written with care. Read it top to\n bottom, or open it at ' + APP_URL;
  add('from', c.from);
  if (c.to) add('to', c.to);
  if (c.about) add('about', quoted(c.about));
  add('summary', folded(c.summary || ''), { space: true });
  add('observation', folded(c.observation || ''), { space: true });
  add('feelings', plainList(c.feelings), { space: true });
  add('needs', plainList(c.needs), { space: true });
  if (c.kind === 'request') add('requests', plainList(c.requests), { space: true });
  add('status', c.status, { space: true });
  add('status_history', historySeq(c.history));
  add('entangled_with', linksSeq(c.links), { space: true });
  if (c.extra) {
    let first = true;
    for (const [k, v] of Object.entries(c.extra)) {
      add(k, doc.createNode(v), { space: first });
      first = false;
    }
  }
  add('kind', c.kind, { space: true, commentBefore: ' ---- giraffy app-only details ----' });
  add('id', c.id);
  add('created', c.created);
  add('updated', c.updated);
  add('gnvc', quoted(GNVC_VERSION), { comment: ' spec: ' + SPEC_URL });
  if (priv) {
    const m = new YAMLMap();
    m.set('mine', priv.mine);
    if (priv.needIds) m.set('need-ids', flow(doc.createNode(priv.needIds.map((x) => x ?? null)) as YAMLSeq));
    if (priv.linkPairs && Object.keys(priv.linkPairs).length) m.set('link-pairs', flow(doc.createNode(priv.linkPairs) as YAMLMap));
    if (priv.draft) m.set('draft', doc.createNode(priv.draft));
    add('x-private', m, { space: true, commentBefore: ' only a Giraffy backup carries this; a shared card never does' });
  }
  return doc;
}

export function emitCard(c: Card, priv?: PrivateTail): string {
  return cardDocument(c, priv).toString({ lineWidth: LINE_WIDTH, minContentWidth: 20 });
}

export class GnvcError extends Error {}

export interface ParsedCard {
  card: Card;
  /** The app-only tail, when the document came from a backup. */
  priv?: PrivateTail;
}

const asStr = (v: unknown): string => (v == null ? '' : typeof v === 'string' ? v : String(v));
const asList = (v: unknown): string[] => (Array.isArray(v) ? v.map(asStr).map((s) => s.trim()).filter(Boolean) : []);

/** Turn a parse error into a sentence the Import screen can show. */
function friendly(msg: string): string {
  return msg.replace(/\s+at line (\d+), column (\d+):?[\s\S]*$/, ' (line $1, column $2).').trim();
}

function schemaMessage(): string {
  const e = validate.errors?.find((x) => x.keyword !== 'if');
  if (!e) return 'the card does not match the gNVC schema.';
  const where = e.instancePath ? e.instancePath.slice(1).replace(/\//g, ' › ') : 'the card';
  if (e.keyword === 'required') return 'missing "' + (e.params as { missingProperty: string }).missingProperty + '" in ' + where + '.';
  if (e.keyword === 'enum') return where + ' must be one of ' + ((e.params as { allowedValues: string[] }).allowedValues || []).join(', ') + '.';
  if (e.keyword === 'pattern' && /created|updated|at$/.test(where)) return where + ' is not an ISO-8601 timestamp.';
  if (e.keyword === 'pattern' && where === 'gnvc') return 'this is not a 1.x card.';
  return where + ' ' + (e.message ?? 'is not valid') + '.';
}

/**
 * Parse one gNVC document. `owner` decides `mine` when the file carries no private tail.
 * Throws GnvcError with a friendly message when the text is not a valid 1.x card.
 */
export function parseCard(text: string, owner: string): ParsedCard {
  const doc = parseDocument(text, { prettyErrors: true });
  if (doc.errors.length) throw new GnvcError('This is not readable as YAML: ' + friendly(doc.errors[0].message));
  const data = doc.toJS({ mapAsMap: false }) as Record<string, unknown> | null;
  if (!data || typeof data !== 'object' || Array.isArray(data)) throw new GnvcError('The file does not contain a card (expected a mapping of keys).');
  if (data.gnvc == null) throw new GnvcError('No "gnvc:" version key found (expected gnvc: "1.0", near the end of the file). Line 1 onward parsed as YAML, but the schema requires the version key.');
  if (typeof data.gnvc !== 'string' || !/^1\.\d+$/.test(data.gnvc)) throw new GnvcError('This card says gnvc: ' + JSON.stringify(data.gnvc) + '. Giraffy reads 1.x cards.');
  if (!validate(data)) throw new GnvcError('Validation failed: ' + schemaMessage());

  const status = asStr(data.status) as CardState;
  const history: HistoryEntry[] = (Array.isArray(data.status_history) ? data.status_history : [])
    .filter((h: unknown) => h && typeof h === 'object')
    .map((h: Record<string, unknown>) => {
      const e: HistoryEntry = { state: asStr(h.state) as CardState, by: asStr(h.by), at: asStr(h.at) };
      if (h.note) e.note = asStr(h.note).trim();
      return e;
    });
  const links: Link[] = (Array.isArray(data.entangled_with) ? data.entangled_with : [])
    .filter((l: unknown) => l && typeof l === 'object' && (l as { id?: unknown }).id != null)
    .map((l: { id: unknown }) => ({ id: asStr(l.id) }));

  const extra: Record<string, unknown> = {};
  // prototype-less: a hand-written file may carry a __proto__ key, and it is just a key here
  for (const [k, v] of Object.entries(data)) if (!KNOWN_KEYS.has(k)) Object.defineProperty(extra, k, { value: v, enumerable: true, writable: true, configurable: true });

  let priv: PrivateTail | undefined;
  const xp = data['x-private'];
  if (xp && typeof xp === 'object') {
    const p = xp as Record<string, unknown>;
    priv = { mine: p.mine === true };
    if (Array.isArray(p['need-ids'])) priv.needIds = p['need-ids'].map((x) => (x == null ? null : asStr(x)));
    if (p.draft && typeof p.draft === 'object') priv.draft = sanitizeDraft(p.draft);
    if (p['link-pairs'] && typeof p['link-pairs'] === 'object') {
      priv.linkPairs = {};
      for (const [id, pairs] of Object.entries(p['link-pairs'] as Record<string, unknown>)) {
        if (Array.isArray(pairs)) priv.linkPairs[id] = pairs.filter((x) => Array.isArray(x) && x.length === 2).map((x) => [Number(x[0]), Number(x[1])]);
      }
      for (const l of links) if (priv.linkPairs[l.id]) l.pairs = priv.linkPairs[l.id];
    }
  }

  const from = asStr(data.from).trim();
  const kind = asStr(data.kind) as Kind;
  const card: Card = {
    id: asStr(data.id).trim(),
    mine: priv ? priv.mine : from === owner,
    kind,
    from,
    to: asStr(data.to).trim(),
    about: asStr(data.about).trim(),
    observation: asStr(data.observation).trim(),
    feelings: asList(data.feelings),
    needs: asList(data.needs),
    requests: kind === 'request' ? asList(data.requests) : [],
    summary: asStr(data.summary).trim(),
    status: CARD_STATES.includes(status) ? status : (history.length ? history[history.length - 1].state : 'ready'),
    created: asStr(data.created),
    updated: asStr(data.updated),
    history,
    links
  };
  if (priv?.needIds) card.needIds = priv.needIds;
  if (priv?.draft && card.status === 'draft') card.draft = priv.draft;
  if (Object.keys(extra).length) card.extra = extra;
  return { card, priv };
}

/** True when the text looks like it is meant to be a card (used before a full parse). */
export function looksLikeCard(text: string): boolean {
  return /^\s*gnvc\s*:/m.test(text);
}

