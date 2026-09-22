// The Dexie upgrade is where real data on a real device gets carried across, so it is
// exercised against an actual database rather than trusted to the pure function.
import { beforeEach, describe, expect, it } from 'vitest';
import 'fake-indexeddb/auto';
import Dexie from 'dexie';
import { GiraffyDB, loadAll } from '../../src/lib/store/db';

const V1_STORES = {
  cards: 'id', people: 'id', needTiers: 'id', catTiers: 'cat',
  needPeople: 'key', needNotes: 'id', settings: 'key'
};

async function seedV1(name: string) {
  const db = new Dexie(name);
  db.version(1).stores(V1_STORES);
  await db.open();
  await db.table('needTiers').bulkPut([
    { id: 'meaning/awareness', tier: 'partly', changed: '2026-07-01T00:00:00Z', was: null },
    { id: 'connection/self-care', tier: 'met', changed: '2026-07-01T00:00:00Z', was: null },
    { id: 'physical-well-being/care', tier: 'unmet', changed: '2026-07-09T00:00:00Z', was: null },
    { id: 'play/fun', tier: 'met', changed: '2026-07-02T00:00:00Z', was: null }
  ]);
  await db.table('needNotes').bulkPut([{ id: 'peace/space', note: 'a quiet hour' }]);
  await db.table('needPeople').bulkPut([
    { key: 'connection/presence|sam', needId: 'connection/presence', personId: 'sam', created: '2026-07-01T00:00:00Z' }
  ]);
  await db.table('cards').bulkPut([
    {
      id: 'c1', mine: true, kind: 'request', from: 'Maya', to: 'Sam', about: '', observation: '',
      feelings: [], needs: [], needIds: ['peace/acceptance', null], requests: [], summary: '',
      status: 'ready', created: '2026-07-01T00:00:00Z', updated: '2026-07-01T00:00:00Z', history: [], links: []
    }
  ]);
  await db.table('people').bulkPut([{ id: 'sam', name: 'Sam' }]);
  await db.table('settings').bulkPut([{ key: 'owner', value: 'Maya' }]);
  db.close();
}

describe('opening a database written before the vocabulary was settled', () => {
  let name = '';
  beforeEach(() => { name = 'giraffy-test-' + Math.random().toString(36).slice(2); });

  it('carries every marked need, note, person, and card link across', async () => {
    await seedV1(name);
    const db = new GiraffyDB(name);
    const { data } = await loadAll(db);

    expect(data.needTiers['honesty/awareness']?.tier).toBe('partly');
    expect(data.needTiers['meaning/awareness']).toBeUndefined();

    // two needs became one; the later mark is the one that survives
    expect(data.needTiers['physical-well-being/self-care']?.tier).toBe('unmet');
    expect(data.needTiers['connection/self-care']).toBeUndefined();
    expect(data.needTiers['physical-well-being/care']).toBeUndefined();

    // a need that never moved is untouched
    expect(data.needTiers['play/fun']?.tier).toBe('met');

    expect(data.needNotes['autonomy/space']).toBe('a quiet hour');
    expect(data.needPeople).toEqual([
      { needId: 'connection/attentiveness', personId: 'sam', created: '2026-07-01T00:00:00Z' }
    ]);
    expect(data.cards[0].needIds).toEqual(['peace/contentment', null]);
    expect(data.owner).toBe('Maya');
    db.close();
  });

  it('writes the moved rows back, so the change survives a second open', async () => {
    await seedV1(name);
    const first = new GiraffyDB(name);
    await loadAll(first);
    first.close();

    const raw = new Dexie(name);
    raw.version(2).stores(V1_STORES);
    await raw.open();
    const ids = (await raw.table('needTiers').toArray()).map((r) => r.id).sort();
    expect(ids).toEqual(['honesty/awareness', 'physical-well-being/self-care', 'play/fun']);
    const keys = (await raw.table('needPeople').toArray()).map((r) => r.key);
    expect(keys).toEqual(['connection/attentiveness|sam']);
    raw.close();
  });
});
