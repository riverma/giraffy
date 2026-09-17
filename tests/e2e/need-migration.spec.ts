import { expect, test } from '@playwright/test';

// A device that has been marking needs since before the vocabulary was settled must lose
// nothing when it opens the new build. This drives the real Dexie upgrade in a real
// browser, rather than trusting the pure function that the unit tests cover.

// Dexie keeps its own version numbering: its version 1 is native version 10. Seeding with
// plain IndexedDB rather than injecting Dexie keeps the page's Content-Security-Policy intact.
const V1_NATIVE_VERSION = 10;
const V1_STORES: [string, string][] = [
  ['cards', 'id'], ['people', 'id'], ['needTiers', 'id'], ['catTiers', 'cat'],
  ['needPeople', 'key'], ['needNotes', 'id'], ['settings', 'key']
];

test('an older database is carried across on first open', async ({ page }) => {
  await page.goto('/');
  // start from nothing, then write the database the previous release would have left
  await page.evaluate(async () => {
    for (const r of await navigator.serviceWorker.getRegistrations()) await r.unregister();
    await new Promise((res) => {
      const d = indexedDB.deleteDatabase('giraffy');
      d.onsuccess = d.onerror = d.onblocked = () => res(null);
    });
  });

  await page.evaluate(async ({ version, stores }) => {
    const db: IDBDatabase = await new Promise((res, rej) => {
      const r = indexedDB.open('giraffy', version);
      r.onupgradeneeded = () => {
        for (const [name, keyPath] of stores) r.result.createObjectStore(name, { keyPath });
      };
      r.onsuccess = () => res(r.result);
      r.onerror = () => rej(r.error);
    });
    const put = (name: string, rows: Record<string, unknown>[]) => new Promise((res, rej) => {
      const tx = db.transaction(name, 'readwrite');
      for (const row of rows) tx.objectStore(name).put(row);
      tx.oncomplete = () => res(null);
      tx.onerror = () => rej(tx.error);
    });
    await put('needTiers', [
      { id: 'meaning/awareness', tier: 'partly', changed: '2026-07-01T00:00:00Z', was: null },
      { id: 'connection/presence', tier: 'unmet', changed: '2026-07-05T00:00:00Z', was: null },
      { id: 'peace/space', tier: 'met', changed: '2026-07-03T00:00:00Z', was: null },
      { id: 'play/fun', tier: 'unmet', changed: '2026-07-02T00:00:00Z', was: null }
    ]);
    await put('needNotes', [{ id: 'connection/integrity', note: 'the thing I keep coming back to' }]);
    await put('needPeople', [{ key: 'connection/presence|sam', needId: 'connection/presence', personId: 'sam', created: '2026-07-01T00:00:00Z' }]);
    await put('people', [{ id: 'self', name: 'Myself' }, { id: 'sam', name: 'Sam' }]);
    await put('settings', [{ key: 'owner', value: 'Maya' }, { key: 'onboarded', value: true }]);
    db.close();
  }, { version: V1_NATIVE_VERSION, stores: V1_STORES });

  // a real reload, so the app boots again and Dexie runs the upgrade
  await page.reload({ waitUntil: 'networkidle' });
  await page.evaluate(() => { location.hash = '#/needs'; });

  // all four marks survived, at their new addresses
  await expect(page.getByText('4 of 103 looked at')).toBeVisible();

  const stored = await page.evaluate(async () => {
    const db: IDBDatabase = await new Promise((res, rej) => {
      const r = indexedDB.open('giraffy');
      r.onsuccess = () => res(r.result);
      r.onerror = () => rej(r.error);
    });
    const read = (name: string): Promise<Record<string, unknown>[]> => new Promise((res) => {
      const out: Record<string, unknown>[] = [];
      const cur = db.transaction(name).objectStore(name).openCursor();
      cur.onsuccess = (e) => {
        const c = (e.target as IDBRequest<IDBCursorWithValue>).result;
        if (c) { out.push(c.value); c.continue(); } else res(out);
      };
    });
    const result = {
      tiers: await read('needTiers'),
      notes: await read('needNotes'),
      people: await read('needPeople')
    };
    db.close();
    return result;
  });

  const tiers = Object.fromEntries(stored.tiers.map((t) => [t.id as string, t.tier]));
  expect(tiers).toEqual({
    'honesty/awareness': 'partly',        // moved from Meaning
    'connection/attentiveness': 'unmet',  // renamed from presence
    'autonomy/space': 'met',              // Peace's space folded into Autonomy's
    'play/fun': 'unmet'                   // never moved
  });
  expect(stored.notes).toEqual([{ id: 'connection/alignment', note: 'the thing I keep coming back to' }]);
  expect(stored.people.map((p) => p.needId)).toEqual(['connection/attentiveness']);
});
