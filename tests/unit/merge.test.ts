import { describe, expect, test } from 'vitest';
import { mergeCards, unionHistory } from '$lib/core/merge';
import { classifyImport } from '$lib/core/importer';
import { emitBackup, parseBackup } from '$lib/core/backup';
import { threads, webPairs } from '$lib/core/threads';
import { sampleEntangledYaml, sampleMergeYaml, sampleNewYaml, seedCards, seedData } from '$lib/data/samples';
import { cloneCard } from '$lib/core/cards';

const owner = 'Maya';
const ctx = () => ({ owner, cards: seedCards(owner), peopleNames: ['Myself', 'Sam', 'Priya', 'Dad'] });

describe('merge (spec §6.4)', () => {
  test('history is a union by (state, by, at), sorted, notes kept', () => {
    const a = [{ state: 'ready', by: 'A', at: '2026-01-01T00:00:00Z' }, { state: 'shared', by: 'A', at: '2026-01-02T00:00:00Z' }] as const;
    const b = [{ state: 'shared', by: 'A', at: '2026-01-02T00:00:00Z', note: 'sent' }, { state: 'heard', by: 'B', at: '2026-01-03T00:00:00Z' }] as const;
    const u = unionHistory([...a], [...b]);
    expect(u.map((h) => h.state)).toEqual(['ready', 'shared', 'heard']);
    expect(u[1].note).toBe('sent');
  });

  test('a reply merges into the local card: new entries, status follows the latest', () => {
    const r = classifyImport(sampleMergeYaml(owner), ctx());
    expect(r.type).toBe('merge');
    if (r.type !== 'merge') return;
    expect(r.added.map((h) => h.state)).toEqual(['yes']);
    expect(r.merged.status).toBe('yes');
    expect(r.merged.history.length).toBe(5);
    expect(r.merged.links).toEqual(ctx().cards[0].links); // pairs untouched
    expect(r.merged.needIds).toEqual(['connection/cooperation', 'connection/trust']);
    expect(r.merged.updated).toBe('2026-07-10T09:05:00Z');
  });

  test('only the original author can change the body', () => {
    const local = seedCards(owner)[0];
    const bySam = cloneCard(local);
    bySam.from = 'Sam'; bySam.observation = 'rewritten'; bySam.updated = '2027-01-01T00:00:00Z';
    expect(mergeCards(local, bySam).card.observation).toBe(local.observation);
    const byMe = cloneCard(local);
    byMe.observation = 'rewritten'; byMe.updated = '2027-01-01T00:00:00Z';
    expect(mergeCards(local, byMe).card.observation).toBe('rewritten');
    const older = cloneCard(local);
    older.observation = 'older'; older.updated = '2020-01-01T00:00:00Z';
    expect(mergeCards(local, older).card.observation).toBe(local.observation);
  });

  test('unknown keys are preserved', () => {
    const local = seedCards(owner)[0];
    local.extra = { colour: 'teal' };
    const inc = cloneCard(local);
    inc.extra = { mood: 'calm' };
    expect(mergeCards(local, inc).card.extra).toEqual({ colour: 'teal', mood: 'calm' });
  });
});

describe('import classification (spec §5.10)', () => {
  test('a new card gets a received entry and keeps its own history', () => {
    const r = classifyImport(sampleNewYaml(owner), ctx());
    expect(r.type).toBe('new');
    if (r.type !== 'new') return;
    expect(r.card.mine).toBe(false);
    expect(r.card.status).toBe('received');
    expect(r.card.history.map((h) => h.state)).toEqual(['shared', 'received']);
    expect(r.card.created).toBe('2026-07-11T09:10:00Z');
    expect(r.unknownPerson).toBe(true);
    expect(r.entangled).toEqual([]);
  });

  test('an entangled card finds the local cards it points to', () => {
    const r = classifyImport(sampleEntangledYaml(owner), ctx());
    expect(r.type).toBe('new');
    if (r.type !== 'new') return;
    expect(r.entangled).toEqual(['c1', 'c6']);
    expect(r.unknownPerson).toBe(false);
  });

  test('errors read as sentences', () => {
    expect(classifyImport('', ctx())).toEqual({ type: 'error', error: 'The paste area is empty. Paste the whole card, comments and all.' });
    const r = classifyImport('hello: world', ctx());
    expect(r.type).toBe('error');
    if (r.type === 'error') expect(r.error).toMatch(/No "gnvc:" version key/);
  });
});

describe('backup (spec §5.15)', () => {
  test('round-trips the whole app state exactly', () => {
    const d = seedData(owner);
    d.catTiers = { Autonomy: 'met' };
    d.owner = 'Maya "M"';
    d.needNotes['play/humor'] = 'Board games with "the crew".';
    d.customAreas = [{ name: 'Work', created: '2026-09-10T09:00:00Z' }];
    d.customNeeds = [
      { id: 'custom/work/being-consulted', area: 'Work', word: 'being consulted', meaning: 'asked before it is settled', created: '2026-09-10T09:01:00Z' },
      { id: 'custom/play/kite-flying', area: 'Play', word: 'kite flying', meaning: '', created: '2026-09-10T09:02:00Z' }
    ];
    d.hiddenNeeds = ['connection/communion'];
    const text = emitBackup(d, '2026-09-07T10:00:00Z');
    expect(text.split('\n---\n').length).toBe(1 + d.cards.length);
    expect(text).toContain('giraffy-backup: "1"');
    const b = parseBackup(text);
    expect(b.saved).toBe('2026-09-07T10:00:00Z');
    const { saved, ...rest } = b;
    expect(rest).toEqual(d);
  });

  test('import recognises a backup', () => {
    const r = classifyImport(emitBackup(seedData(owner)), ctx());
    expect(r.type).toBe('backup');
    if (r.type === 'backup') expect(r.backup.cards.length).toBe(6);
  });
});

describe('threads', () => {
  test('chains and pairs from the seed', () => {
    const cards = seedCards(owner);
    expect(threads(cards)).toEqual([['c1', 'c2']]);
    const chain = cards.filter((c) => ['c1', 'c2'].includes(c.id));
    expect(webPairs(chain)).toEqual([
      { my: 'shared care for our home', their: 'ease in the evenings' },
      { my: 'reliability around agreements', their: 'rest' }
    ]);
  });
});
