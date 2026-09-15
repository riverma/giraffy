// IndexedDB through Dexie (spec §5.16.1). One database, version 1; every table keyed by a plain id.
import Dexie, { type Table } from 'dexie';
import type { AppData, Card, CustomArea, CustomNeed, DerivedMethod, NeedPerson, Person, Tier, TierRecord } from '$lib/core/types';
import { SELF_ID, SELF_NAME } from '$lib/core/types';
import { migrateNeedId, migrateNeedIds, NEED_ID_CHANGES } from '$lib/core/need-migration';
import { NEED_CATEGORIES } from '$lib/data/needs';

export interface NeedTierRow extends TierRecord { id: string }
export interface CatTierRow { cat: string; tier: Tier }
export interface NeedPersonRow extends NeedPerson { key: string }
export interface NeedNoteRow { id: string; note: string }
export interface SettingRow { key: string; value: unknown }

export class GiraffyDB extends Dexie {
  cards!: Table<Card, string>;
  people!: Table<Person, string>;
  needTiers!: Table<NeedTierRow, string>;
  catTiers!: Table<CatTierRow, string>;
  needPeople!: Table<NeedPersonRow, string>;
  needNotes!: Table<NeedNoteRow, string>;
  settings!: Table<SettingRow, string>;

  constructor(name = 'giraffy') {
    super(name);
    const stores = {
      cards: 'id',
      people: 'id',
      needTiers: 'id',
      catTiers: 'cat',
      needPeople: 'key',
      needNotes: 'id',
      settings: 'key'
    };
    this.version(1).stores(stores);
    // v2: the needs vocabulary was settled, so some need ids became other need ids.
    // The rows are keyed by those ids, so they are rewritten rather than modified in place.
    this.version(2).stores(stores).upgrade(async (tx) => {
      const tiers = await tx.table('needTiers').toArray();
      const moved = tiers.filter((r) => r.id in NEED_ID_CHANGES);
      if (moved.length) {
        await tx.table('needTiers').bulkDelete(moved.map((r) => r.id));
        // when two needs merge, the later mark is the one that still means something
        const keep = new Map<string, NeedTierRow>();
        for (const r of moved) {
          const id = migrateNeedId(r.id);
          const held = keep.get(id);
          if (!held || r.changed > held.changed) keep.set(id, { ...r, id });
        }
        for (const [id, row] of keep) {
          const existing = await tx.table('needTiers').get(id);
          if (!existing || row.changed > existing.changed) await tx.table('needTiers').put(row);
        }
      }

      const notes = await tx.table('needNotes').toArray();
      const movedNotes = notes.filter((r) => r.id in NEED_ID_CHANGES);
      if (movedNotes.length) {
        await tx.table('needNotes').bulkDelete(movedNotes.map((r) => r.id));
        for (const r of movedNotes) {
          const id = migrateNeedId(r.id);
          const existing = await tx.table('needNotes').get(id);
          await tx.table('needNotes').put({ id, note: existing?.note ? existing.note + '\n\n' + r.note : r.note });
        }
      }

      const people = await tx.table('needPeople').toArray();
      const movedPeople = people.filter((r) => r.needId in NEED_ID_CHANGES);
      if (movedPeople.length) {
        await tx.table('needPeople').bulkDelete(movedPeople.map((r) => r.key));
        for (const r of movedPeople) {
          const needId = migrateNeedId(r.needId);
          await tx.table('needPeople').put({ ...r, needId, key: needId + '|' + r.personId });
        }
      }

      await tx.table('cards').toCollection().modify((c) => {
        if (c.needIds) c.needIds = c.needIds.map((id: string | null) => (id ? migrateNeedId(id) : id));
      });
    });
  }
}

/** Settings that live outside the undo history but inside a backup, plus app-only flags. */
export interface Prefs {
  onboarded: boolean;
  lastBackup: string | null;
  backupDismissed: boolean;
  firstRunDismissed: boolean;
  /** A draft written before drafts were cards, read once at boot and then cleared. */
  draft: unknown | null;
  /** The draft card the composer had open, so a reload lands back in it. */
  openDraft: string | null;
  /** Keep the backup file in the chosen folder up to date on its own (spec §5.15). */
  autoBackup: boolean;
  /** The folder's name, for saying where backups go. The handle itself is kept apart. */
  backupFolder: string | null;
  lastAutoBackup: string | null;
}

export const DEFAULT_PREFS: Prefs = {
  onboarded: false, lastBackup: null, backupDismissed: false, firstRunDismissed: false,
  draft: null, openDraft: null, autoBackup: false, backupFolder: null, lastAutoBackup: null
};

export function emptyData(): AppData {
  return {
    owner: '', coaching: true, preamble: true, derivedMethod: 'majority', filter: 'all', sort: 'updated',
    people: [{ id: SELF_ID, name: SELF_NAME }], cards: [], needTiers: {}, catTiers: {}, needPeople: [], needNotes: {},
    customAreas: [], customNeeds: [], hiddenNeeds: []
  };
}

const DATA_KEYS = ['owner', 'coaching', 'preamble', 'derivedMethod', 'filter', 'sort', 'customAreas', 'customNeeds', 'hiddenNeeds'] as const;
const PREF_KEYS = ['onboarded', 'lastBackup', 'backupDismissed', 'firstRunDismissed', 'draft', 'openDraft', 'autoBackup', 'backupFolder', 'lastAutoBackup'] as const;

/** The backup folder's handle. Kept out of prefs: it is not a value, and it is not reactive. */
const DIR_KEY = 'backupDir';

export async function saveBackupDir(db: GiraffyDB, dir: FileSystemDirectoryHandle | null): Promise<void> {
  try {
    if (dir) await db.settings.put({ key: DIR_KEY, value: dir });
    else await db.settings.delete(DIR_KEY);
  } catch {
    // a browser that will not store the handle can still use it until the tab closes
  }
}

export async function loadBackupDir(db: GiraffyDB): Promise<FileSystemDirectoryHandle | null> {
  try {
    const row = await db.settings.get(DIR_KEY);
    const v = row?.value as FileSystemDirectoryHandle | undefined;
    return v && typeof (v as { getFileHandle?: unknown }).getFileHandle === 'function' ? v : null;
  } catch {
    return null;
  }
}

export async function loadAll(db: GiraffyDB): Promise<{ data: AppData; prefs: Prefs; fresh: boolean }> {
  const [cards, people, needTiers, catTiers, needPeople, needNotes, settings] = await Promise.all([
    db.cards.toArray(), db.people.toArray(), db.needTiers.toArray(), db.catTiers.toArray(),
    db.needPeople.toArray(), db.needNotes.toArray(), db.settings.toArray()
  ]);
  const s = Object.fromEntries(settings.map((r) => [r.key, r.value]));
  const data = emptyData();
  if (typeof s.owner === 'string') data.owner = s.owner;
  if (typeof s.coaching === 'boolean') data.coaching = s.coaching;
  if (typeof s.preamble === 'boolean') data.preamble = s.preamble;
  if (['worst', 'majority', 'average'].includes(s.derivedMethod as string)) data.derivedMethod = s.derivedMethod as DerivedMethod;
  if (typeof s.filter === 'string') data.filter = s.filter;
  if (typeof s.sort === 'string') data.sort = s.sort as AppData['sort'];
  // needs and areas of someone's own ride in the settings table as whole arrays
  if (Array.isArray(s.customAreas)) {
    data.customAreas = (s.customAreas as CustomArea[])
      .filter((a) => a && typeof a.name === 'string' && a.name)
      .map((a) => ({ name: a.name, created: String(a.created ?? '') }));
  }
  if (Array.isArray(s.customNeeds)) {
    const areas = new Set([...NEED_CATEGORIES.map((c) => c.name), ...data.customAreas.map((a) => a.name)]);
    data.customNeeds = (s.customNeeds as CustomNeed[])
      .filter((n) => n && typeof n.id === 'string' && n.id.startsWith('custom/') && n.word && areas.has(n.area))
      .map((n) => ({ id: n.id, area: n.area, word: n.word, meaning: String(n.meaning ?? ''), created: String(n.created ?? '') }));
  }
  if (Array.isArray(s.hiddenNeeds)) data.hiddenNeeds = (s.hiddenNeeds as unknown[]).filter((x): x is string => typeof x === 'string');
  data.cards = cards;
  if (people.length) data.people = people;
  if (!data.people.some((p) => p.id === SELF_ID)) data.people.unshift({ id: SELF_ID, name: SELF_NAME });
  for (const r of needTiers) data.needTiers[r.id] = { tier: r.tier, changed: r.changed, was: r.was ?? null };
  for (const r of catTiers) data.catTiers[r.cat] = r.tier;
  data.needPeople = needPeople.map(({ needId, personId, created }) => ({ needId, personId, created }));
  for (const r of needNotes) if (r.note) data.needNotes[r.id] = r.note;
  migrateNeedIds(data);
  const prefs: Prefs = { ...DEFAULT_PREFS };
  for (const k of PREF_KEYS) if (k in s) (prefs as unknown as Record<string, unknown>)[k] = s[k];
  return { data, prefs, fresh: settings.length === 0 && cards.length === 0 };
}

/** Write the whole data slice. Small enough to replace wholesale; one transaction keeps it atomic. */
export async function saveData(db: GiraffyDB, d: AppData): Promise<void> {
  await db.transaction('rw', [db.cards, db.people, db.needTiers, db.catTiers, db.needPeople, db.needNotes, db.settings], async () => {
    await Promise.all([
      db.cards.clear(), db.people.clear(), db.needTiers.clear(), db.catTiers.clear(), db.needPeople.clear(), db.needNotes.clear()
    ]);
    await Promise.all([
      db.cards.bulkPut(d.cards),
      db.people.bulkPut(d.people),
      db.needTiers.bulkPut(Object.entries(d.needTiers).map(([id, r]) => ({ id, ...r }))),
      db.catTiers.bulkPut(Object.entries(d.catTiers).map(([cat, tier]) => ({ cat, tier }))),
      db.needPeople.bulkPut(d.needPeople.map((p) => ({ key: p.needId + '|' + p.personId, ...p }))),
      db.needNotes.bulkPut(Object.entries(d.needNotes).filter(([, n]) => n).map(([id, note]) => ({ id, note }))),
      db.settings.bulkPut(DATA_KEYS.map((key) => ({ key, value: d[key] })))
    ]);
  });
}

export async function savePrefs(db: GiraffyDB, p: Partial<Prefs>): Promise<void> {
  await db.settings.bulkPut(Object.entries(p).map(([key, value]) => ({ key, value })));
}

export async function wipe(db: GiraffyDB): Promise<void> {
  await db.transaction('rw', db.tables, async () => {
    await Promise.all(db.tables.map((t) => t.clear()));
  });
}
