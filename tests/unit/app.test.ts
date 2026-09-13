// The store, end to end: drafts that survive a reload, people coming and going, needs of
// your own, and undo across all of it. The browser bits the store touches are stubbed,
// which is enough because everything interesting happens in `data`.
import { beforeAll, describe, expect, it } from 'vitest';
import 'fake-indexeddb/auto';

const hist = { state: { d: 0 }, pushState() {}, replaceState() {}, back() {} };

/** Enough of a browser for the store: history for the router, a window for the folder picker. */
let picked: unknown = null;
beforeAll(() => {
  Object.defineProperty(globalThis, 'history', { value: hist, configurable: true, writable: true });
  Object.defineProperty(globalThis, 'location', { value: { hash: '' }, configurable: true, writable: true });
  Object.defineProperty(globalThis, 'window', {
    value: { addEventListener() {}, showDirectoryPicker: async () => picked },
    configurable: true,
    writable: true
  });
  Object.defineProperty(globalThis, 'document', {
    value: { addEventListener() {}, visibilityState: 'visible' },
    configurable: true,
    writable: true
  });
});

const { App } = await import('../../src/lib/store/app.svelte');
const { fakeFolder } = await import('./helpers/fake-folder');
const { AUTO_BACKUP_NAME } = await import('../../src/lib/core/filebackup');
const { saveBackupDir } = await import('../../src/lib/store/db');
const { GiraffyDB, savePrefs } = await import('../../src/lib/store/db');
const { parseBackup } = await import('../../src/lib/core/backup');
const { customNeedId } = await import('../../src/lib/data/vocab');
type AppInstance = InstanceType<typeof App>;

let dbName = '';
function fresh(): { app: AppInstance; name: string } {
  dbName = 'giraffy-app-' + Math.random().toString(36).slice(2);
  return { app: new App(new GiraffyDB(dbName)), name: dbName };
}

async function ready(seedOwner = 'Ash'): Promise<AppInstance> {
  const { app } = fresh();
  await app.init();
  app.finishOnboarding(seedOwner);
  return app;
}

/** The store writes on a 250 ms debounce; flush() makes it immediate. */
async function settle(app: AppInstance): Promise<void> {
  app.flush();
  await new Promise((r) => setTimeout(r, 30));
}

describe('a draft', () => {
  it('is a card from the first keystroke, and is not counted among finished cards', async () => {
    const app = await ready();
    app.startCompose('request');
    expect(app.drafts.length).toBe(1);
    expect(app.mine.length).toBe(0);
    const cm = app.composer!;
    cm.newPerson = 'Robin';
    cm.observation = 'When the light was still on at 2am';
    app.touchComposer();
    const card = app.card(cm.draftId!)!;
    expect(card.status).toBe('draft');
    expect(card.to).toBe('Robin');
    expect(card.observation).toBe('When the light was still on at 2am');
    expect(card.draft?.observation).toBe('When the light was still on at 2am');
  });

  it('comes back on the same step after the app is closed and opened', async () => {
    const app = await ready();
    app.startCompose('gratitude');
    const cm = app.composer!;
    cm.observation = 'When you drove out at midnight';
    cm.step = 2;
    app.touchComposer();
    await settle(app);

    const again = new App(new GiraffyDB(dbName));
    await again.init();
    expect(again.drafts.length).toBe(1);
    expect(again.composer?.step).toBe(2);
    expect(again.composer?.observation).toBe('When you drove out at midnight');
    expect(again.composer?.draftId).toBe(cm.draftId);
  });

  it('goes quietly when nothing was written into it, undo step and all', async () => {
    const app = await ready();
    const before = app.history.length;
    app.startCompose('request');
    expect(app.drafts.length).toBe(1);
    expect(app.leaveComposer()).toBe('empty');
    expect(app.drafts.length).toBe(0);
    expect(app.history.length).toBe(before);
    expect(app.prefs.openDraft).toBe(null);
  });

  it('is kept when a word was written, and picked up again where it was left', async () => {
    const app = await ready();
    app.startCompose('request');
    app.composer!.observation = 'When I saw the note';
    app.composer!.step = 1;
    app.touchComposer();
    const id = app.composer!.draftId!;
    expect(app.leaveComposer()).toBe('draft');
    expect(app.composer).toBe(null);
    expect(app.drafts.length).toBe(1);

    app.resumeDraft(id);
    expect(app.composer?.step).toBe(1);
    expect(app.composer?.observation).toBe('When I saw the note');
    // a resumed draft that is simply put down again stays put
    expect(app.leaveComposer()).toBe('draft');
    expect(app.drafts.length).toBe(1);
  });

  it('becomes the finished card, keeping its id and starting its history clean', async () => {
    const app = await ready();
    app.startCompose('request');
    const cm = app.composer!;
    const id = cm.draftId!;
    cm.newPerson = 'Robin';
    cm.observation = 'When the light was still on at 2am';
    cm.feelings = ['weary'];
    cm.needs = ['rest / sleep'];
    cm.needIds = { 'rest / sleep': 'physical-well-being/rest-sleep' };
    cm.request = 'Would you be willing to turn it off?';
    app.touchComposer();
    expect(app.saveComposer()).toBe(id);

    const card = app.card(id)!;
    expect(card.status).toBe('ready');
    expect(card.draft).toBe(undefined);
    expect(card.history).toEqual([{ state: 'ready', by: 'Ash', at: card.created }]);
    expect(app.drafts.length).toBe(0);
    expect(app.mine.length).toBe(1);
    expect(app.prefs.openDraft).toBe(null);
    expect(app.data.people.some((p) => p.name === 'Robin')).toBe(true);
  });

  it('can be discarded, and undo brings it back', async () => {
    const app = await ready();
    app.startCompose('request');
    app.composer!.observation = 'When I saw the note';
    app.touchComposer();
    const id = app.composer!.draftId!;
    app.leaveComposer();

    app.discardDraft(id);
    expect(app.drafts.length).toBe(0);
    app.undo();
    expect(app.drafts.length).toBe(1);
    expect(app.card(id)?.observation).toBe('When I saw the note');
    app.redo();
    expect(app.drafts.length).toBe(0);
  });

  it('is never shared half-written', async () => {
    const app = await ready();
    app.startCompose('request');
    const card = app.card(app.composer!.draftId!)!;
    app.openShare(card);
    expect(app.sheet).toBe(null);
    expect(app.toastMsg).toMatch(/Finish the draft/);
  });

  it('written before drafts were cards becomes one on the next open', async () => {
    const { name } = fresh();
    const db = new GiraffyDB(name);
    await savePrefs(db, { onboarded: true, draft: { step: 3, kind: 'request', observation: 'When you said you would call' } as unknown as Prefs['draft'] });
    db.close();

    const app = new App(new GiraffyDB(name));
    await app.init();
    expect(app.drafts.length).toBe(1);
    expect(app.drafts[0].observation).toBe('When you said you would call');
    expect(app.composer?.step).toBe(3);
    expect(app.prefs.draft).toBe(null);
  });
});

describe('people', () => {
  it('can be added by name, once', async () => {
    const app = await ready();
    const p = app.addPerson('Robin');
    expect(p?.name).toBe('Robin');
    expect(app.addPerson('robin')?.id).toBe(p?.id);
    expect(app.data.people.filter((x) => x.name === 'Robin').length).toBe(1);
    expect(app.addPerson('Ash')).toBe(null);
    expect(app.toastMsg).toMatch(/that is you/i);
  });

  it('can be removed, keeping their cards, and undo puts them back', async () => {
    const app = await ready();
    const p = app.addPerson('Robin')!;
    app.startCompose('request');
    Object.assign(app.composer!, { persons: ['Robin'], observation: 'When the light was on', feelings: ['weary'], needs: ['rest / sleep'] });
    app.saveComposer();
    app.addNeedPerson('connection/closeness', 'Robin');
    expect(app.data.needPeople.length).toBe(1);

    app.removePerson(p.id);
    expect(app.data.people.some((x) => x.id === p.id)).toBe(false);
    expect(app.data.needPeople.length).toBe(0);
    expect(app.mine.length).toBe(1);
    expect(app.mine[0].to).toBe('Robin');

    app.undo();
    expect(app.data.people.some((x) => x.id === p.id)).toBe(true);
    expect(app.data.needPeople.length).toBe(1);
  });

  it('never loses Myself', async () => {
    const app = await ready();
    app.removePerson('self');
    expect(app.data.people.some((x) => x.id === 'self')).toBe(true);
  });

  it('are renamed on their cards too', async () => {
    const app = await ready();
    const p = app.addPerson('Robin')!;
    app.startCompose('request');
    Object.assign(app.composer!, { persons: ['Robin'], observation: 'When the light was on', feelings: ['weary'], needs: ['rest / sleep'] });
    app.saveComposer();
    app.renamePerson(p.id, 'Robin B');
    expect(app.personName(p.id)).toBe('Robin B');
    expect(app.mine[0].to).toBe('Robin B');
    app.undo();
    expect(app.mine[0].to).toBe('Robin');
  });
});

describe('needs of your own', () => {
  it('join the list under the area they were filed in', async () => {
    const app = await ready();
    const id = app.addCustomNeed('kite flying', 'Play', 'string, wind, and nowhere to be');
    expect(id).toBe(customNeedId('Play', 'kite flying'));
    expect(app.needsIn('Play').map((n) => n.word)).toContain('kite flying');
    expect(app.meaningOf(id!)).toBe('string, wind, and nowhere to be');
    expect(app.vocab.visible.length).toBe(104);
  });

  it('refuse a word already under that area, and allow it under another', async () => {
    const app = await ready();
    expect(app.addCustomNeed('fun', 'Play')).toBe(null);
    expect(app.toastMsg).toMatch(/Already under Play/);
    app.addCustomArea('Work');
    expect(app.addCustomNeed('fun', 'Work')).toBe(customNeedId('Work', 'fun'));
  });

  it('let go of what was marked on them, while cards keep the word', async () => {
    const app = await ready();
    const id = app.addCustomNeed('kite flying', 'Play')!;
    app.setTier(id, 'met');
    app.setNeedNote(id, 'Saturday, the long field.');
    app.addNeedPerson(id, 'Robin');
    app.startCompose('gratitude');
    Object.assign(app.composer!, { persons: ['Robin'], observation: 'When we went out to the field', feelings: ['glad'], needs: ['kite flying'], needIds: { 'kite flying': id } });
    app.saveComposer();

    app.removeCustomNeed(id);
    expect(app.data.needTiers[id]).toBe(undefined);
    expect(app.data.needNotes[id]).toBe(undefined);
    expect(app.data.needPeople.some((np) => np.needId === id)).toBe(false);
    expect(app.mine[0].needs).toEqual(['kite flying']);
    expect(app.mine[0].needIds).toEqual([null]);

    app.undo();
    expect(app.data.needTiers[id]?.tier).toBe('met');
    expect(app.mine[0].needIds).toEqual([id]);
  });

  it('go with the area they were filed under', async () => {
    const app = await ready();
    app.addCustomArea('Work');
    const id = app.addCustomNeed('being consulted', 'Work')!;
    app.setTier(id, 'unmet');
    app.removeCustomArea('Work');
    expect(app.vocab.areas.some((a) => a.name === 'Work')).toBe(false);
    expect(app.data.customNeeds.length).toBe(0);
    expect(app.data.needTiers[id]).toBe(undefined);
    app.undo();
    expect(app.needsIn('Work').map((n) => n.word)).toEqual(['being consulted']);
  });
});

describe('hiding a need that ships', () => {
  it('keeps everything marked on it, and shows it again on request', async () => {
    const app = await ready();
    app.setTier('autonomy/choice', 'unmet');
    app.setNeedNote('autonomy/choice', 'The rota at work.');
    app.hideNeed('autonomy/choice');
    expect(app.vocab.visible.length).toBe(102);
    expect(app.needsIn('Autonomy').some((n) => n.word === 'choice')).toBe(false);
    expect(app.data.needTiers['autonomy/choice'].tier).toBe('unmet');
    expect(app.needOf('autonomy/choice')?.word).toBe('choice');

    app.unhideNeed('autonomy/choice');
    expect(app.vocab.visible.length).toBe(103);
    expect(app.data.needNotes['autonomy/choice']).toBe('The rota at work.');
  });
});

describe('a backup', () => {
  it('brings back drafts, needs and areas of your own, and hidden needs', async () => {
    const app = await ready();
    app.addCustomArea('Work');
    const id = app.addCustomNeed('being consulted', 'Work', 'asked before it is settled')!;
    app.setTier(id, 'unmet');
    app.hideNeed('connection/communion');
    app.startCompose('request');
    Object.assign(app.composer!, { newPerson: 'Robin', observation: 'When the rota went up without me', step: 2 });
    app.touchComposer();
    app.leaveComposer();

    const text = app.backupText();
    const back = parseBackup(text);
    const { saved, ...data } = back;
    expect(data).toEqual(JSON.parse(JSON.stringify(app.data)));
    expect(back.cards.filter((c) => c.status === 'draft').length).toBe(1);
    expect(back.cards.find((c) => c.status === 'draft')?.draft?.step).toBe(2);

    const other = await ready('Someone');
    other.restore(back);
    expect(other.data.customNeeds.length).toBe(1);
    expect(other.data.hiddenNeeds).toEqual(['connection/communion']);
    expect(other.drafts.length).toBe(1);
    expect(other.composer).toBe(null);
  });
});

// the legacy pref shape, only needed for the one test that writes it
type Prefs = { draft: unknown };


describe('backups that keep themselves', () => {
  it('are offered where the browser can write to a folder', async () => {
    const app = await ready();
    expect(app.canFolderBackup).toBe(true);
    expect(app.autoBackupOn).toBe(false);
    expect(app.prefs.backupFolder).toBe(null);
  });

  it('write the file as soon as a folder is chosen, and remember which one', async () => {
    const app = await ready();
    const dir = fakeFolder('Giraffy backups');
    picked = dir;
    expect(await app.chooseBackupFolder()).toBe(true);
    expect(app.prefs.backupFolder).toBe('Giraffy backups');
    expect(app.prefs.autoBackup).toBe(true);
    expect(app.autoBackupOn).toBe(true);
    expect(dir.files.get(AUTO_BACKUP_NAME)).toContain('giraffy-backup:');
    expect(app.prefs.lastAutoBackup).toBeTruthy();
  });

  it('rewrite the same file when the app goes away, changes and all', async () => {
    const app = await ready();
    const dir = fakeFolder();
    picked = dir;
    await app.chooseBackupFolder();
    app.addPerson('Robin');
    app.flush();
    await new Promise((r) => setTimeout(r, 20));
    expect(dir.files.size).toBe(1);
    expect(dir.files.get(AUTO_BACKUP_NAME)).toContain('Robin');
  });

  it('keep a backup taken by hand under its own date, beside the one that keeps itself', async () => {
    const app = await ready();
    const dir = fakeFolder();
    picked = dir;
    await app.chooseBackupFolder();
    await app.backupNow();
    expect([...dir.files.keys()].sort()).toEqual([app.backupFilename(), AUTO_BACKUP_NAME].sort());
    expect(app.toastMsg).toContain('Saved to');
  });

  it('wait, rather than fail, when the browser forgets the permission', async () => {
    const app = await ready();
    const dir = fakeFolder();
    picked = dir;
    await app.chooseBackupFolder();
    dir.files.clear();

    // what a restart looks like from here: the handle is still ours, the permission is not
    app.backupPerm = 'prompt';
    expect(app.autoBackupPaused).toBe(true);
    expect(app.autoBackupOn).toBe(false);
    app.addPerson('Robin');
    app.flush();
    await new Promise((r) => setTimeout(r, 20));
    expect(dir.files.size).toBe(0);

    await app.resumeBackups();
    expect(app.autoBackupOn).toBe(true);
    expect(dir.files.get(AUTO_BACKUP_NAME)).toContain('Robin');
  });

  it('refuse to pretend when permission is refused', async () => {
    const app = await ready();
    picked = fakeFolder('Giraffy', 'prompt', false);
    expect(await app.chooseBackupFolder()).toBe(false);
    expect(app.prefs.backupFolder).toBe(null);
    expect(app.toastMsg).toMatch(/cannot keep the copy up to date/);
  });

  it('ignore a folder row that is not a folder', async () => {
    const { name } = fresh();
    const db = new GiraffyDB(name);
    await db.settings.put({ key: 'backupDir', value: { name: 'not a handle' } });
    db.close();
    const app = new App(new GiraffyDB(name));
    await app.init();
    await new Promise((r) => setTimeout(r, 20));
    expect(app.autoBackupOn).toBe(false);
    expect(app.autoBackupPaused).toBe(false);
  });

  it('stop when asked, leaving what is already in the folder alone', async () => {
    const app = await ready();
    const dir = fakeFolder();
    picked = dir;
    await app.chooseBackupFolder();
    await app.stopFolderBackup();
    expect(app.autoBackupOn).toBe(false);
    expect(app.prefs.backupFolder).toBe(null);
    app.addPerson('Robin');
    app.flush();
    await new Promise((r) => setTimeout(r, 20));
    expect(dir.files.get(AUTO_BACKUP_NAME)).not.toContain('Robin');
  });
});
