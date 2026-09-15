// The app's one store: data (backed by Dexie), session history for undo, and transient UI state.
// Every mutation that a person would call "a change" goes through record() first, so undo can return there.
import type { AppData, Card, CardState, DerivedMethod, DraftState, Kind, Tier, Person, HistoryEntry } from '$lib/core/types';
import { SELF_ID, SELF_NAME } from '$lib/core/types';
import { draftCardFrom, draftContent, draftFace, draftPeople, emptyIds, freshDraft, isEmptyDraft, linkedNeedId, sanitizeDraft } from '$lib/core/drafts';
import { now, uid, fmtTime } from '$lib/core/time';
import { nextTier, tierRecord } from '$lib/core/tiers';
import { canReassign, cloneCard, shareFilename } from '$lib/core/cards';
import { filterTest } from '$lib/core/sorts';
import { download } from '$lib/share';
import { emitCard } from '$lib/core/gnvc';
import { emitBackup, type Backup } from '$lib/core/backup';
import { classifyImport, type ImportResult } from '$lib/core/importer';
import { synthesize } from '$lib/core/synthesize';
import { migrateNeedIds } from '$lib/core/need-migration';
import { areaProblem, buildVocab, customNeedId, meaningOf, vocabProblem, type Vocab } from '$lib/data/vocab';
import type { Need } from '$lib/data/needs';
import type { FeelingHalf } from '$lib/data/feelings';
import { AUTO_BACKUP_NAME, folderPermission, pickBackupFolder, supportsFolderBackup, writeInto, type FolderPermission } from '$lib/core/filebackup';
import { GiraffyDB, loadAll, loadBackupDir, saveBackupDir, saveData, savePrefs, wipe, emptyData, DEFAULT_PREFS, type Prefs } from './db';
import { router } from './router.svelte';
import { S } from '$lib/strings';

export type SheetKind =
  | 'share' | 'heard' | 'no' | 'explore' | 'picker' | 'new' | 'filters' | 'sort' | 'erase' | 'confirm' | 'history'
  | 'addPerson' | 'addNeed' | 'addArea' | 'reassign';
export type ConfirmKind =
  | 'revert' | 'delete' | 'withdraw' | 'derived' | 'leaveSetup' | 'shareUnanswered' | 'restore'
  | 'deletePerson' | 'deleteNeed' | 'hideNeed' | 'deleteArea' | 'discardDraft';

export interface Sheet {
  kind: SheetKind;
  cardId?: string;
  confirm?: ConfirmKind;
  historyIndex?: number;
  method?: DerivedMethod;
  needId?: string;
  personId?: string;
  /** The area an "add a need" sheet should start on. */
  areaName?: string;
  /** A word typed in the composer, carried into the "add a need" sheet. */
  word?: string;
  eraseStep?: 1 | 2;
}

/** A draft being written, plus where it lives and where to go when it is put down. */
export interface Composer extends DraftState {
  /** The draft card this composer is writing into, or null while editing a finished card. */
  draftId: string | null;
  editId: string | null;
  returnTo: string | null;
}

export interface Snapshot {
  label: string;
  at: string;
  data: AppData;
}

const MAX_HISTORY = 50;
/** How long the changes have to stop before the folder copy is rewritten, and the floor between writes. */
const QUIET_MS = 60_000;
const MIN_BACKUP_GAP_MS = 5 * 60_000;

export function freshComposer(kind: Kind = 'request', personName: string | null = null, linkTo: string | null = null): Composer {
  return { ...freshDraft(kind, personName, linkTo), draftId: null, editId: null, returnTo: null };
}

/** The draft inside a composer, without the bookkeeping that is only about navigation. */
export function draftOf(cm: Composer): DraftState {
  const { draftId, editId, returnTo, ...draft } = cm;
  return $state.snapshot(draft) as DraftState;
}

export function composerSeq(kind: Kind): number[] {
  return kind === 'gratitude' ? [0, 1, 2, 3, 5] : [0, 1, 2, 3, 4, 5];
}

export const composerPeople = draftPeople;

export class App {
  data = $state<AppData>(emptyData());
  prefs = $state<Prefs>({ ...DEFAULT_PREFS });
  ready = $state(false);
  persisted = $state<boolean | null>(null);

  history = $state<Snapshot[]>([]);
  redoStack = $state<Snapshot[]>([]);

  sheet = $state<Sheet | null>(null);
  toastMsg = $state<string | null>(null);
  composer = $state<Composer | null>(null);

  /** The needs list as this person has it: shipped, plus their own, minus what they hid. */
  vocab = $derived.by<Vocab>(() => buildVocab(this.data));

  /** Where the folder permission stands this session (spec §5.15). */
  backupPerm = $state<FolderPermission>('prompt');

  // transient, per-session UI memory
  editing = $state(false);
  tab = $state<'mine' | 'received'>('mine');
  cardQuery = $state('');
  groupOn = $state(false);
  peopleQuery = $state('');
  needFilter = $state('all');
  needOpen = $state<Record<string, boolean>>({});
  dismissed = $state<Record<string, boolean>>({});
  shiftDismissed = $state<Record<string, boolean>>({});
  suggestDismissed = $state<Record<string, boolean>>({});
  heardVal = $state('');
  noVal = $state('');
  // the add sheets: a name, an area, and what a need means to you
  nameVal = $state('');
  areaVal = $state('');
  meaningVal = $state('');
  importVal = $state('');
  importResult = $state<ImportResult | null>(null);
  threadMode = $state<'timeline' | 'web'>('timeline');
  checkinPage = $state(0);
  updateReady = $state(false);

  private db: GiraffyDB;
  private saveTimer: ReturnType<typeof setTimeout> | null = null;
  private prefTimer: ReturnType<typeof setTimeout> | null = null;
  private toastTimer: ReturnType<typeof setTimeout> | null = null;
  private pendingPrefs: Partial<Prefs> = {};
  /** The draft as it was opened, while nothing has been written into it yet. */
  private draftSeed: string | null = null;
  /** The backup folder, kept out of $state: a handle is not a value, and proxying one breaks it. */
  private backupDir: FileSystemDirectoryHandle | null = null;
  private autoTimer: ReturnType<typeof setTimeout> | null = null;
  private lastAutoAt = 0;
  private autoBusy = false;
  private backupDirty = false;
  private backupWarned = false;

  constructor(db?: GiraffyDB) {
    this.db = db ?? new GiraffyDB();
  }

  // ── lifecycle ──

  async init(seed?: AppData): Promise<void> {
    const loaded = await loadAll(this.db);
    if (seed && loaded.fresh) {
      this.data = seed;
      this.prefs = { ...DEFAULT_PREFS, onboarded: true };
      await saveData(this.db, seed);
      await savePrefs(this.db, this.prefs);
    } else {
      this.data = loaded.data;
      this.prefs = loaded.prefs;
      this.adoptDraft();
    }
    this.ready = true;
    // awaited: a folder chosen while this was still reading would otherwise be forgotten
    await this.adoptBackupFolder();
    if (typeof window !== 'undefined') {
      window.addEventListener('pagehide', () => this.flush());
      document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') this.flush(); });
      if (navigator.storage?.persisted) navigator.storage.persisted().then((p) => { this.persisted = p; }).catch(() => {});
    }
  }

  /** Ask the browser to keep the data (spec §5.16.1). Best effort; a no is fine. */
  async askPersist(): Promise<boolean> {
    if (!navigator.storage?.persist) return false;
    try {
      const ok = await navigator.storage.persist();
      this.persisted = ok;
      return ok;
    } catch {
      return false;
    }
  }

  private scheduleSave(): void {
    if (this.saveTimer) clearTimeout(this.saveTimer);
    this.saveTimer = setTimeout(() => this.flushData(), 250);
  }

  private flushData(): void {
    if (this.saveTimer) clearTimeout(this.saveTimer);
    this.saveTimer = null;
    if (!this.ready) return;
    const plain = $state.snapshot(this.data) as AppData;
    saveData(this.db, plain).catch((e) => console.error('save failed', e));
  }

  setPrefs(p: Partial<Prefs>): void {
    Object.assign(this.prefs, p);
    Object.assign(this.pendingPrefs, p);
    if (this.prefTimer) clearTimeout(this.prefTimer);
    this.prefTimer = setTimeout(() => this.flushPrefs(), 250);
  }

  private flushPrefs(): void {
    if (this.prefTimer) clearTimeout(this.prefTimer);
    this.prefTimer = null;
    const p = $state.snapshot(this.pendingPrefs) as Partial<Prefs>;
    this.pendingPrefs = {};
    if (Object.keys(p).length) savePrefs(this.db, p).catch((e) => console.error('save failed', e));
  }

  flush(): void {
    if (this.composer) this.syncDraft(this.composer);
    this.flushData();
    this.flushPrefs();
    // the app may be closing: get what changed into the folder copy while there is still time
    if (this.backupDirty && this.autoBackupOn) this.writeAutoBackup();
  }

  /**
   * A draft written before drafts were cards becomes one, and a draft that was open when
   * the app was last closed opens again on the step it was left on (spec §5.7).
   */
  private adoptDraft(): void {
    const legacy = this.prefs.draft;
    if (legacy && typeof legacy === 'object' && 'step' in (legacy as Record<string, unknown>)) {
      const card = draftCardFrom(sanitizeDraft(legacy), this.data.owner, uid(), now());
      this.data.cards.push(card);
      this.setPrefs({ draft: null, openDraft: card.id });
      this.commit();
    }
    const open = this.card(this.prefs.openDraft);
    if (open && open.status === 'draft') {
      this.composer = { ...sanitizeDraft(open.draft ?? {}), draftId: open.id, editId: null, returnTo: null };
    } else if (this.prefs.openDraft) {
      this.setPrefs({ openDraft: null });
    }
  }

  /** Call after any direct change to `data`. */
  commit(): void {
    this.scheduleSave();
    this.scheduleAutoBackup();
  }

  // ── toasts and sheets ──

  toast(msg: string): void {
    if (this.toastTimer) clearTimeout(this.toastTimer);
    this.toastMsg = msg;
    this.toastTimer = setTimeout(() => { this.toastMsg = null; }, 2600);
  }

  open(sheet: Sheet): void {
    this.sheet = sheet;
  }

  closeSheet(): void {
    this.sheet = null;
  }

  confirm(kind: ConfirmKind, extra: Omit<Sheet, 'kind' | 'confirm'> = {}): void {
    this.sheet = { kind: 'confirm', confirm: kind, ...extra };
  }

  /** The add sheets carry their own fields, so opening one starts them off. */
  openAddPerson(personId?: string): void {
    this.nameVal = personId ? this.data.people.find((p) => p.id === personId)?.name ?? '' : '';
    this.sheet = { kind: 'addPerson', personId };
  }

  openAddNeed(areaName?: string, word?: string): void {
    this.nameVal = word ?? '';
    this.areaVal = areaName ?? this.vocab.areas[0]?.name ?? '';
    this.meaningVal = '';
    this.sheet = { kind: 'addNeed', areaName, word };
  }

  openAddArea(): void {
    this.nameVal = '';
    this.sheet = { kind: 'addArea' };
  }

  // ── lookups ──

  card(id: string | null | undefined): Card | undefined {
    return id ? this.data.cards.find((c) => c.id === id) : undefined;
  }

  get owner(): string {
    return this.data.owner;
  }

  personName(pid: string): string {
    return this.data.people.find((p) => p.id === pid)?.name ?? pid;
  }

  tierOf(needId: string): Tier | null {
    return this.data.needTiers[needId]?.tier ?? null;
  }

  needOf(id: string | null | undefined): Need | undefined {
    return id ? this.vocab.byId.get(id) : undefined;
  }

  /** What a need means, whether it shipped with the app or the person wrote it. */
  meaningOf(id: string | null | undefined): string {
    return meaningOf(this.vocab, id);
  }

  /** Needs in an area, as shown: the check-in and the area colour count these. */
  needsIn(area: string): Need[] {
    return this.vocab.areas.find((a) => a.name === area)?.needs ?? [];
  }

  /** My finished cards. A draft is still being written, so it lists on its own. */
  get mine(): Card[] {
    return this.data.cards.filter((c) => c.mine && c.status !== 'draft');
  }
  get received(): Card[] {
    return this.data.cards.filter((c) => !c.mine);
  }
  get drafts(): Card[] {
    return this.data.cards.filter((c) => c.mine && c.status === 'draft').sort((a, b) => b.updated.localeCompare(a.updated));
  }

  // ── undo / redo (spec §5.14) ──

  private snap(): AppData {
    return $state.snapshot(this.data) as AppData;
  }

  /**
   * A snapshot read back out of the history is proxied again, and a proxy cannot be
   * structured-cloned, so unwrap it the same way it was put in.
   */
  private unsnap(d: AppData): AppData {
    return $state.snapshot(d) as AppData;
  }

  record(label: string): void {
    this.history = [...this.history, { label, at: now(), data: this.snap() }].slice(-MAX_HISTORY);
    this.redoStack = [];
  }

  undo(): void {
    if (!this.history.length) { this.toast(S.history.nothingToUndo); return; }
    const cur: Snapshot = { label: 'before undo', at: now(), data: this.snap() };
    const prev = this.history[this.history.length - 1];
    this.history = this.history.slice(0, -1);
    this.redoStack = [...this.redoStack, cur];
    this.data = this.unsnap(prev.data);
    this.sheet = null;
    this.commit();
    this.toast(S.history.undone(prev.label));
  }

  redo(): void {
    if (!this.redoStack.length) { this.toast(S.history.nothingToRedo); return; }
    const cur: Snapshot = { label: 'before redo', at: now(), data: this.snap() };
    const nxt = this.redoStack[this.redoStack.length - 1];
    this.redoStack = this.redoStack.slice(0, -1);
    this.history = [...this.history, cur];
    this.data = this.unsnap(nxt.data);
    this.sheet = null;
    this.commit();
    this.toast(S.history.redone);
  }

  revertTo(i: number): void {
    const target = this.history[i];
    if (!target) return;
    const cur: Snapshot = { label: 'current', at: now(), data: this.snap() };
    const popped = this.history.slice(i + 1).reverse();
    this.redoStack = [...this.redoStack, cur, ...popped];
    this.history = this.history.slice(0, i);
    this.data = this.unsnap(target.data);
    this.sheet = null;
    this.commit();
    this.toast(S.history.reverted);
  }

  historyRows(): { label: string; when: string; stepNo: string; index: number }[] {
    const n = this.history.length;
    return this.history.slice().reverse().map((h, ri) => ({ label: h.label, when: fmtTime(h.at), stepNo: '#' + (n - ri), index: n - 1 - ri }));
  }

  // ── settings ──

  setOwner(name: string): void {
    const trimmed = name;
    const old = this.data.owner;
    this.data.owner = trimmed;
    // cards keep the name they were written with; only `mine` follows the author name
    if (old !== trimmed) for (const c of this.data.cards) if (c.from === old && c.mine) c.from = trimmed;
    this.commit();
  }

  finishOnboarding(name: string): void {
    this.data.owner = name.trim() || 'Me';
    this.setPrefs({ onboarded: true });
    this.commit();
  }

  setCoaching(on: boolean): void { this.data.coaching = on; this.commit(); }
  setPreamble(on: boolean): void { this.data.preamble = on; this.commit(); }
  setFilter(f: string): void { this.data.filter = f; this.commit(); }

  /** Toggle a filter; when it only matches one side of the list, jump to that side (spec §5.7). */
  pickFilter(id: string): void {
    const next = this.data.filter === id ? 'all' : id;
    const t = filterTest(next);
    if (next !== 'all' && t) {
      const m = this.data.cards.filter((c) => c.mine && t(c)).length;
      const r = this.data.cards.filter((c) => !c.mine && t(c)).length;
      if (m === 0 && r > 0) this.tab = 'received';
      else if (r === 0 && m > 0) this.tab = 'mine';
    }
    this.cardQuery = '';
    this.setFilter(next);
  }
  setSort(s: AppData['sort']): void { this.data.sort = s; this.commit(); }

  applyDerivedMethod(m: DerivedMethod): void {
    this.record(S.settings.recordRecalc);
    this.data.derivedMethod = m;
    this.data.catTiers = {};
    this.sheet = null;
    this.commit();
    this.toast(S.settings.recalculated);
  }

  // ── needs (spec §5.3–5.5) ──

  setTier(needId: string, tier: Tier | null): void {
    if (tier) this.data.needTiers[needId] = tierRecord(tier, this.data.needTiers[needId], now());
    else delete this.data.needTiers[needId];
    this.commit();
  }

  cycleTier(needId: string, label?: string): void {
    if (label) this.record(label);
    this.setTier(needId, nextTier(this.tierOf(needId)));
  }

  cycleCatTier(cat: string): void {
    const nxt = nextTier(this.data.catTiers[cat] ?? null);
    if (nxt) this.data.catTiers[cat] = nxt;
    else delete this.data.catTiers[cat];
    this.commit();
  }

  setNeedNote(needId: string, text: string): void {
    if (text) this.data.needNotes[needId] = text;
    else delete this.data.needNotes[needId];
    this.commit();
  }

  // ── needs and areas of your own (spec §5.4) ──

  /**
   * File a need of your own under an area. Returns its id, or null with a toast saying why not.
   * A word already sitting under that area is a no; the same word under another area is fine.
   */
  addCustomNeed(word: string, area: string, meaning = ''): string | null {
    const w = word.trim();
    const problem = vocabProblem(this.vocab, w, area);
    if (problem) { this.toast(problem); return null; }
    const id = customNeedId(area, w);
    this.record(S.need.recordAdded);
    this.data.customNeeds.push({ id, area, word: w, meaning: meaning.trim(), created: now() });
    // a word typed into the composer becomes a link the moment it becomes a need
    const cm = this.composer;
    if (cm && cm.needs.includes(w) && !linkedNeedId(cm, w)) { cm.needIds[w] = id; this.touchComposer(); }
    this.sheet = null;
    this.commit();
    this.toast(S.need.added(area));
    return id;
  }

  /** Take a need of your own out. Cards that used the word keep the word. */
  removeCustomNeed(id: string): void {
    const n = this.data.customNeeds.find((c) => c.id === id);
    if (!n) return;
    this.record(S.need.recordRemoved);
    this.forgetNeed(id);
    this.data.customNeeds = this.data.customNeeds.filter((c) => c.id !== id);
    this.sheet = null;
    this.commit();
    this.toast(S.need.removed);
  }

  /** Everything stored against a need that is going away. Cards keep their words. */
  private forgetNeed(id: string): void {
    delete this.data.needTiers[id];
    delete this.data.needNotes[id];
    this.data.needPeople = this.data.needPeople.filter((np) => np.needId !== id);
    for (const c of this.data.cards) if (c.needIds) c.needIds = c.needIds.map((x) => (x === id ? null : x));
  }

  /** Hide a shipped need. Everything marked on it is kept, and Settings can show it again. */
  hideNeed(id: string): void {
    if (!this.vocab.byId.get(id) || this.data.hiddenNeeds.includes(id)) return;
    this.record(S.need.recordHid);
    this.data.hiddenNeeds.push(id);
    this.sheet = null;
    this.commit();
    this.toast(S.need.hidden);
  }

  unhideNeed(id: string): void {
    if (!this.data.hiddenNeeds.includes(id)) return;
    this.record(S.need.recordShowed);
    this.data.hiddenNeeds = this.data.hiddenNeeds.filter((x) => x !== id);
    this.sheet = null;
    this.commit();
    this.toast(S.need.showed);
  }

  addCustomArea(name: string): boolean {
    const nm = name.trim();
    const problem = areaProblem(this.vocab, nm);
    if (problem) { this.toast(problem); return false; }
    this.record(S.need.recordAreaAdded);
    this.data.customAreas.push({ name: nm, created: now() });
    this.needOpen = { ...this.needOpen, [nm]: true };
    this.sheet = null;
    this.commit();
    this.toast(S.need.areaAdded(nm));
    return true;
  }

  /** Take an area of your own out, and the needs filed under it with it. */
  removeCustomArea(name: string): void {
    if (!this.data.customAreas.some((a) => a.name === name)) return;
    this.record(S.need.recordAreaRemoved);
    for (const n of this.data.customNeeds.filter((c) => c.area === name)) this.forgetNeed(n.id);
    this.data.customNeeds = this.data.customNeeds.filter((c) => c.area !== name);
    this.data.customAreas = this.data.customAreas.filter((a) => a.name !== name);
    delete this.data.catTiers[name];
    const open = { ...this.needOpen };
    delete open[name];
    this.needOpen = open;
    this.sheet = null;
    this.commit();
    this.toast(S.need.areaRemoved);
  }

  // ── people (spec §5.9) ──

  ensurePerson(name: string): Person {
    const nm = name.trim();
    if (nm === SELF_NAME || nm === this.data.owner) return this.data.people.find((p) => p.id === SELF_ID) as Person;
    let p = this.data.people.find((x) => x.name === nm);
    if (!p) {
      p = { id: uid(), name: nm };
      this.data.people.push(p);
    }
    return p;
  }

  /** Someone your cards are with, named before there is a card. */
  addPerson(name: string): Person | null {
    const nm = name.trim();
    if (!nm) return null;
    if (nm === SELF_NAME || nm === this.data.owner) { this.toast(S.people.isYou); return null; }
    const held = this.data.people.find((p) => p.name.toLowerCase() === nm.toLowerCase());
    if (held) { this.sheet = null; this.toast(S.people.exists); return held; }
    this.record(S.people.recordAdded);
    const p = this.ensurePerson(nm);
    this.sheet = null;
    this.commit();
    this.toast(S.people.added(p.name));
    return p;
  }

  /** Take a name out of your people. Their cards are history, and stay. */
  removePerson(id: string): void {
    if (id === SELF_ID) return;
    const p = this.data.people.find((x) => x.id === id);
    if (!p) return;
    this.record(S.people.recordRemoved);
    this.data.people = this.data.people.filter((x) => x.id !== id);
    this.data.needPeople = this.data.needPeople.filter((np) => np.personId !== id);
    if (this.data.filter === 'p:' + p.name) this.data.filter = 'all';
    this.sheet = null;
    this.commit();
    router.back('/people');
    this.toast(S.people.removed);
  }

  /** A person is a display name, so renaming one renames them on their cards too (spec §5.9). */
  renamePerson(id: string, name: string): void {
    const nm = name.trim();
    const p = this.data.people.find((x) => x.id === id);
    if (!p || !nm || nm === p.name || id === SELF_ID) { this.sheet = null; return; }
    if (this.data.people.some((x) => x.id !== id && x.name.toLowerCase() === nm.toLowerCase())) { this.toast(S.people.exists); return; }
    this.record(S.people.recordRenamed);
    const old = p.name;
    p.name = nm;
    for (const c of this.data.cards) {
      if (c.mine && c.to === old) c.to = nm;
      if (!c.mine && c.from === old) c.from = nm;
    }
    if (this.data.filter === 'p:' + old) this.data.filter = 'p:' + nm;
    this.sheet = null;
    this.commit();
    this.toast(S.people.renamed);
  }

  addNeedPerson(needId: string, name: string): void {
    this.record(S.need.named);
    const p = this.ensurePerson(name);
    if (!this.data.needPeople.some((np) => np.needId === needId && np.personId === p.id)) {
      this.data.needPeople.push({ needId, personId: p.id, created: now() });
    }
    this.commit();
  }

  removeNeedPerson(needId: string, name: string): void {
    const p = this.data.people.find((x) => x.name === name || (name === SELF_NAME && x.id === SELF_ID));
    if (!p) return;
    this.record(S.need.cleared(name));
    this.data.needPeople = this.data.needPeople.filter((np) => !(np.needId === needId && np.personId === p.id));
    this.commit();
  }

  // ── composer (spec §5.9) ──

  startCompose(kind: Kind = 'request', personName: string | null = null, linkTo: string | null = null, returnTo: string | null = null): void {
    const cm = freshComposer(kind, personName, linkTo);
    cm.returnTo = returnTo;
    this.beginDraft(cm);
  }

  /** A card about one need. A need can be asked about or thanked for, so the kind is asked for. */
  composeForNeed(need: Need, personName: string | null = null, returnTo: string | null = null, kind: Kind = 'request'): void {
    const cm = freshComposer(kind, personName);
    cm.needs = [need.word];
    cm.needIds = { [need.word]: need.id };
    cm.step = personName ? 1 : 0;
    cm.returnTo = returnTo ?? '/need/' + need.id;
    this.beginDraft(cm);
  }

  /** Open the composer on a new draft card, so the words are safe from the first keystroke. */
  private beginDraft(cm: Composer): void {
    this.record(S.composer.recordStarted);
    const draft = draftOf(cm);
    const card = draftCardFrom(draft, this.data.owner, uid(), now());
    cm.draftId = card.id;
    this.data.cards.push(card);
    this.composer = cm;
    this.draftSeed = draftContent(draft);
    this.setPrefs({ openDraft: card.id });
    this.sheet = null;
    this.flush();
    router.go('/compose');
  }

  editCard(c: Card): void {
    if (c.status === 'draft') { this.resumeDraft(c.id); return; }
    const cm = freshComposer(c.kind, c.to === this.data.owner ? SELF_NAME : c.to);
    Object.assign(cm, {
      context: c.about, observation: c.observation, feelings: [...c.feelings], needs: [...c.needs],
      request: c.requests[0] ?? '', summary: c.summary, summaryCustom: true, editId: c.id,
      needIds: Object.assign(emptyIds(), Object.fromEntries(c.needs.map((w, i) => [w, c.needIds?.[i]]).filter(([, id]) => id) as [string, string][])),
      returnTo: '/card/' + c.id
    });
    this.composer = cm;
    this.draftSeed = null;
    router.go('/compose');
  }

  /** Pick a draft back up, on the step it was left on. */
  resumeDraft(id: string): void {
    const c = this.card(id);
    if (!c || c.status !== 'draft') return;
    this.composer = { ...sanitizeDraft(c.draft ?? {}), draftId: c.id, editId: null, returnTo: null };
    this.draftSeed = null;
    this.setPrefs({ openDraft: c.id });
    this.sheet = null;
    router.go('/compose');
    this.toast(S.newSheet.resumed);
  }

  /** The × in the composer: put it down, keeping every word. */
  closeComposer(): void {
    const returnTo = this.composer?.returnTo ?? '/cards';
    const left = this.leaveComposer();
    router.back(returnTo);
    if (left === 'draft') this.toast(S.composer.draftSaved);
    else if (left === 'edit') this.toast(S.composer.editDropped);
  }

  /**
   * Put the composer down without going anywhere: what the × does, and what leaving the
   * screen any other way does. A draft nothing was written into goes quietly, undo step
   * and all, so opening the composer and changing your mind leaves no trace.
   */
  leaveComposer(): 'draft' | 'edit' | 'empty' | 'none' {
    const cm = this.composer;
    if (!cm) return 'none';
    this.composer = null;
    this.setPrefs({ openDraft: null });
    const seed = this.draftSeed;
    this.draftSeed = null;
    if (cm.editId) return 'edit';
    if (!cm.draftId) return 'none';
    this.syncDraft(cm);
    if (isEmptyDraft(cm, seed)) {
      this.data.cards = this.data.cards.filter((c) => c.id !== cm.draftId);
      const top = this.history[this.history.length - 1];
      if (top?.label === S.composer.recordStarted) this.history = this.history.slice(0, -1);
      this.flush();
      return 'empty';
    }
    // on the disk before the screen changes, so closing the app right now loses nothing
    this.flush();
    return 'draft';
  }

  /** Throw a draft away on purpose. */
  discardDraft(id: string): void {
    const c = this.card(id);
    if (!c || c.status !== 'draft') return;
    this.record(S.composer.recordDiscarded);
    this.data.cards = this.data.cards.filter((x) => x.id !== id);
    if (this.composer?.draftId === id) {
      this.composer = null;
      this.draftSeed = null;
      this.setPrefs({ openDraft: null });
    }
    this.sheet = null;
    this.commit();
    if (router.route.screen === 'card' && router.route.id === id) router.back('/cards');
    this.toast(S.composer.draftDiscarded);
  }

  /** Keep the draft card in step with the composer. Autosave, so no undo step. */
  private syncDraft(cm: Composer): void {
    if (!cm.draftId) return;
    const c = this.card(cm.draftId);
    if (!c) return;
    const draft = draftOf(cm);
    Object.assign(c, draftFace(draft, this.data.owner), { draft, updated: now() });
  }

  touchComposer(): void {
    if (this.composer) {
      this.syncDraft(this.composer);
      this.commit();
    }
  }

  saveComposer(): string | null {
    const d = this.composer;
    if (!d) return null;
    this.record(d.editId ? S.composer.recordEdit : S.composer.recordNew);
    const at = now();
    const owner = this.data.owner;
    const persons = composerPeople(d).map((nm) => (nm === SELF_NAME ? owner : nm));
    for (const nm of composerPeople(d)) if (nm !== SELF_NAME && nm !== owner) this.ensurePerson(nm);
    const summary = d.summary || synthesize({ kind: d.kind, observation: d.observation, feelings: d.feelings, needs: d.needs, request: d.request });

    if (d.editId) {
      const c = this.card(d.editId);
      if (c) {
        Object.assign(c, {
          to: persons[0], about: d.context, observation: d.observation, feelings: [...d.feelings], needs: [...d.needs],
          needIds: d.needs.map((w) => linkedNeedId(d, w) ?? c.needIds?.[c.needs.indexOf(w)] ?? null),
          requests: d.kind === 'request' && d.request ? [d.request] : [], summary, kind: d.kind, updated: at
        });
      }
      this.composer = null;
      this.draftSeed = null;
      this.setPrefs({ openDraft: null });
      this.commit();
      router.replace('/card/' + d.editId, Math.max(0, router.depth - 1));
      this.toast(S.composer.updated);
      return d.editId;
    }

    // one card per person: same words, separate lives from here on; a link only ever joins the first
    const cardFor = (to: string, i: number): Card => ({
      id: uid(), mine: true, kind: d.kind, from: owner, to, about: d.context,
      observation: d.observation, feelings: [...d.feelings], needs: [...d.needs],
      needIds: d.needs.map((w) => linkedNeedId(d, w)),
      requests: d.kind === 'request' && d.request ? [d.request] : [], summary,
      status: 'ready', created: at, updated: at,
      history: [{ state: 'ready', by: owner, at }],
      links: d.linkTo && i === 0 ? [{ id: d.linkTo }] : []
    });
    // the draft becomes the first card, so its id and its place in the list carry over
    const held = d.draftId ? this.card(d.draftId) : undefined;
    const ncs = persons.map((to, i) => {
      if (i > 0 || !held) return cardFor(to, i);
      const face = cardFor(to, i);
      const { id, ...rest } = face;
      Object.assign(held, rest);
      // a draft's only history was that it was a draft; a finished card starts clean
      delete held.draft;
      return held;
    });
    const nc = ncs[0];
    this.data.cards.push(...ncs.filter((c) => c !== held));
    if (d.linkTo) {
      const t = this.card(d.linkTo);
      if (t) {
        t.links.push({ id: nc.id });
        t.history.push({ state: 'maybe', by: owner, at, note: S.explore.composeNote });
        t.status = 'maybe';
        t.updated = at;
      }
    }
    this.composer = null;
    this.draftSeed = null;
    this.setPrefs({ openDraft: null });
    this.tab = 'mine';
    this.commit();
    router.replace('/card/' + nc.id, Math.max(1, router.depth));
    if (d.linkTo) {
      this.sheet = { kind: 'share', cardId: nc.id };
      this.toast(S.composer.savedLinked);
    } else if (ncs.length > 1) {
      this.toast(S.composer.savedMany(ncs.length, listNames(composerPeople(d))));
    } else {
      this.toast(S.composer.saved);
    }
    return nc.id;
  }

  // ── card states (spec §5.8) ──

  appendState(id: string, state: CardState, note?: string, label?: string): void {
    const c = this.card(id);
    if (!c) return;
    this.record(label ?? 'Marked ' + state);
    const at = now();
    const entry: HistoryEntry = { state, by: this.data.owner, at };
    if (note) entry.note = note;
    c.history.push(entry);
    c.status = state;
    c.updated = at;
    this.commit();
  }

  /** Ask who a card is for, with the people already known offered first. */
  openReassign(c: Card): void {
    this.nameVal = '';
    this.sheet = { kind: 'reassign', cardId: c.id };
  }

  /**
   * Point a card you wrote at someone else, rather than writing it again (spec §5.8).
   * A card that had been shared goes back to ready, because the person it is for now
   * has not seen it.
   */
  reassignCard(id: string, name: string): void {
    const c = this.card(id);
    const nm = name.trim();
    if (!c || !nm || !canReassign(c)) { this.sheet = null; return; }
    const to = nm === SELF_NAME || nm.toLowerCase() === this.data.owner.toLowerCase() ? this.data.owner : nm;
    if (to === c.to) { this.sheet = null; this.toast(S.cardTo.same); return; }
    this.record(S.cardTo.record);
    const was = c.to === this.data.owner ? SELF_NAME : c.to;
    if (to !== this.data.owner) this.ensurePerson(to);
    const at = now();
    c.to = to;
    c.updated = at;
    if (c.status === 'shared') {
      c.status = 'ready';
      c.history = [...c.history, { state: 'ready', by: this.data.owner, at, note: S.cardTo.note(was) }];
    }
    this.sheet = null;
    this.commit();
    this.toast(S.cardTo.done(to === this.data.owner ? SELF_NAME : to));
  }

  openShare(c: Card): void {
    if (c.status === 'draft') { this.toast(S.composer.finishFirst); return; }
    if (!c.mine && c.status === 'received') { this.confirm('shareUnanswered', { cardId: c.id }); return; }
    if (c.status === 'ready') this.appendState(c.id, 'shared', undefined, S.detail.records.shared);
    this.sheet = { kind: 'share', cardId: c.id };
  }

  respondHeard(c: Card): void {
    this.heardVal = S.heard.reflection(c.feelings.join(' and '), c.needs.join(' and '));
    this.sheet = { kind: 'heard', cardId: c.id };
  }
  sendHeard(id: string, note?: string): void {
    this.appendState(id, 'heard', note, S.detail.records.heard);
    this.sheet = { kind: 'share', cardId: id };
    if (note) this.toast(S.detail.toasts.heard);
  }
  respondYes(id: string): void {
    this.appendState(id, 'yes', undefined, S.detail.records.yes);
    this.sheet = { kind: 'share', cardId: id };
    this.toast(S.detail.toasts.yes);
  }
  respondNo(c: Card): void {
    this.noVal = '';
    this.sheet = { kind: 'no', cardId: c.id };
  }
  sendNo(id: string, note?: string): void {
    this.appendState(id, 'no', note, S.detail.records.no);
    this.sheet = { kind: 'share', cardId: id };
    if (note) this.toast(S.detail.toasts.no);
  }
  respondExplore(c: Card): void {
    this.sheet = { kind: 'explore', cardId: c.id };
  }
  respondGiven(id: string): void {
    this.appendState(id, 'given', undefined, S.detail.records.given);
    this.toast(S.detail.toasts.given);
  }
  respondCelebrated(id: string): void {
    this.appendState(id, 'celebrated', undefined, S.detail.records.celebrated);
    this.sheet = { kind: 'share', cardId: id };
    this.toast(S.detail.toasts.celebrated);
  }

  /** Link one of my existing cards to a received one; my card carries the response. */
  linkExisting(mineId: string, theirsId: string): void {
    const m = this.card(mineId), t = this.card(theirsId);
    if (!m || !t) return;
    this.record(S.detail.records.linked);
    const at = now();
    if (!m.links.some((l) => l.id === t.id)) m.links.push({ id: t.id });
    m.updated = at;
    if (!t.links.some((l) => l.id === m.id)) t.links.push({ id: m.id });
    t.history.push({ state: 'maybe', by: this.data.owner, at, note: S.explore.linkNote });
    t.status = 'maybe';
    t.updated = at;
    this.commit();
    this.sheet = { kind: 'share', cardId: m.id };
    this.toast(S.detail.toasts.linked);
  }

  withdraw(id: string): void {
    this.appendState(id, 'withdrawn', undefined, S.detail.records.withdrew);
    this.sheet = null;
    this.toast(S.detail.toasts.withdrawn);
  }

  deleteCard(id: string): void {
    this.record(S.detail.records.deleted);
    this.data.cards = this.data.cards.filter((c) => c.id !== id);
    for (const c of this.data.cards) c.links = c.links.filter((l) => l.id !== id);
    this.sheet = null;
    this.commit();
    if (router.route.screen === 'card' && router.route.id === id) router.back('/cards');
    this.toast(S.detail.toasts.deleted);
  }

  // ── share ──

  shareText(c: Card): string {
    return emitCard(c);
  }

  shareFilename(c: Card): string {
    return shareFilename(c);
  }

  shareBody(c: Card): string {
    return (this.data.preamble ? S.share.preambleText + '\n\n' : '') + emitCard(c);
  }

  // ── import (spec §5.10) ──

  previewImport(): void {
    this.importResult = classifyImport(this.importVal, {
      owner: this.data.owner,
      cards: $state.snapshot(this.data.cards) as Card[],
      peopleNames: this.data.people.map((p) => p.name)
    });
  }

  clearImport(): void {
    this.importVal = '';
    this.importResult = null;
  }

  applyImport(): void {
    const ir = this.importResult;
    if (!ir) return;
    if (ir.type === 'error') return;
    if (ir.type === 'backup') { this.confirm('restore'); return; }
    this.record(ir.type === 'merge' ? S.importScreen.records.merged : S.importScreen.records.imported);
    if (ir.type === 'merge') {
      const i = this.data.cards.findIndex((c) => c.id === ir.target.id);
      if (i >= 0) this.data.cards[i] = cloneCard($state.snapshot(ir.merged) as Card);
      this.clearImport();
      this.commit();
      router.replace('/card/' + ir.merged.id, router.depth);
      this.toast(S.importScreen.toasts.merged);
      return;
    }
    const nc = cloneCard($state.snapshot(ir.card) as Card);
    const at = now();
    const linked = ir.entangled.filter((id) => this.card(id));
    for (const id of linked) {
      const c = this.card(id) as Card;
      if (!c.links.some((l) => l.id === nc.id)) c.links.push({ id: nc.id });
      c.updated = at;
    }
    if (ir.unknownPerson) this.ensurePerson(nc.from);
    this.data.cards.push(nc);
    this.tab = nc.mine ? 'mine' : 'received';
    this.clearImport();
    this.commit();
    router.replace('/card/' + nc.id, router.depth);
    this.toast(linked.length ? S.importScreen.toasts.thread(linked.length)
      : nc.mine ? S.importScreen.toasts.addedMine
      : ir.unknownPerson ? S.importScreen.toasts.personAdded(nc.from)
      : S.importScreen.toasts.added);
  }

  loadSample(text: string): void {
    this.importVal = text;
    this.importResult = null;
  }

  // ── backup and restore (spec §5.15) ──

  backupText(): string {
    return emitBackup($state.snapshot(this.data) as AppData);
  }

  backupFilename(): string {
    return 'giraffy-backup-' + now().slice(0, 10) + '.gnvc.yaml';
  }

  /** Save a backup and remember when. Into the chosen folder when there is one (spec §5.15). */
  async backupNow(): Promise<void> {
    const name = this.backupFilename();
    if (this.backupDir && (await folderPermission(this.backupDir)) === 'granted') {
      try {
        await writeInto(this.backupDir, name, this.backupText());
        this.markBackedUp();
        this.toast(S.backup.savedTo(this.prefs.backupFolder ?? 'your folder', name));
        return;
      } catch {
        this.backupPerm = 'prompt';
        // the folder is out of reach, so fall through to a download rather than lose the tap
      }
    }
    download(name, this.backupText());
    this.markBackedUp();
    this.toast(S.cards.backupSaved);
  }

  markBackedUp(): void {
    this.setPrefs({ lastBackup: now(), backupDismissed: true });
  }

  // ── backups that keep themselves (spec §5.15) ──

  /** Only Chromium on a desktop can write to a folder without asking every time. */
  get canFolderBackup(): boolean {
    return supportsFolderBackup();
  }

  /** A folder is chosen and reachable, so the file keeps itself up to date. */
  get autoBackupOn(): boolean {
    return !!this.backupDir && this.prefs.autoBackup && this.backupPerm === 'granted';
  }

  /** A folder is chosen but the browser has forgotten the permission: one tap fixes it. */
  get autoBackupPaused(): boolean {
    return !!this.backupDir && this.prefs.autoBackup && this.backupPerm !== 'granted';
  }

  private async adoptBackupFolder(): Promise<void> {
    this.backupDir = await loadBackupDir(this.db);
    if (!this.backupDir) {
      if (this.prefs.backupFolder) this.setPrefs({ backupFolder: null, autoBackup: false });
      return;
    }
    this.backupPerm = await folderPermission(this.backupDir);
    if (this.autoBackupOn) this.writeAutoBackup();
  }

  /** Choose where backups go. Asking for the folder is itself the permission. */
  async chooseBackupFolder(): Promise<boolean> {
    const dir = await pickBackupFolder();
    if (!dir) return false;
    this.backupDir = dir;
    this.backupPerm = await folderPermission(dir, true);
    if (this.backupPerm !== 'granted') { this.toast(S.backup.notAllowed); return false; }
    await saveBackupDir(this.db, dir);
    this.setPrefs({ backupFolder: dir.name, autoBackup: true });
    this.backupDirty = true;
    await this.writeAutoBackup();
    this.toast(S.backup.chosen(dir.name));
    return true;
  }

  /** After a restart the browser may have forgotten the permission; this asks for it again. */
  async resumeBackups(): Promise<void> {
    if (!this.backupDir) return;
    this.backupPerm = await folderPermission(this.backupDir, true);
    if (this.backupPerm === 'granted') {
      this.backupDirty = true;
      await this.writeAutoBackup();
      this.toast(S.backup.resumed);
    } else {
      this.toast(S.backup.notAllowed);
    }
  }

  async stopFolderBackup(): Promise<void> {
    this.backupDir = null;
    this.backupPerm = 'prompt';
    if (this.autoTimer) clearTimeout(this.autoTimer);
    this.autoTimer = null;
    await saveBackupDir(this.db, null);
    this.setPrefs({ autoBackup: false, backupFolder: null, lastAutoBackup: null });
    this.toast(S.backup.stopped);
  }

  setAutoBackup(on: boolean): void {
    this.setPrefs({ autoBackup: on });
    if (on) { this.backupDirty = true; this.scheduleAutoBackup(); }
    else if (this.autoTimer) { clearTimeout(this.autoTimer); this.autoTimer = null; }
  }

  /**
   * A little after the changes stop, and never oftener than once every few minutes. The
   * file is also written when the app goes away, so what is on disk is never far behind.
   */
  private scheduleAutoBackup(): void {
    if (!this.autoBackupOn) return;
    this.backupDirty = true;
    if (this.autoTimer) clearTimeout(this.autoTimer);
    const since = Date.now() - this.lastAutoAt;
    this.autoTimer = setTimeout(() => this.writeAutoBackup(), Math.max(QUIET_MS, MIN_BACKUP_GAP_MS - since));
  }

  /** Write the one file that keeps itself up to date. Quiet: it says nothing when it works. */
  private async writeAutoBackup(): Promise<void> {
    if (this.autoTimer) clearTimeout(this.autoTimer);
    this.autoTimer = null;
    if (!this.backupDir || !this.prefs.autoBackup || !this.ready || this.autoBusy) return;
    this.autoBusy = true;
    const dir = this.backupDir;
    try {
      const text = this.backupText();
      await writeInto(dir, AUTO_BACKUP_NAME, text);
      // stopped while that was in flight: the write landed, but it is not ours to remember
      if (this.backupDir !== dir) return;
      this.backupDirty = false;
      this.lastAutoAt = Date.now();
      this.backupPerm = 'granted';
      this.setPrefs({ lastAutoBackup: now(), lastBackup: now(), backupDismissed: true });
    } catch {
      // usually the permission lapsed while the app was closed; Settings offers it back
      this.backupPerm = 'prompt';
      if (!this.backupWarned) { this.backupWarned = true; this.toast(S.backup.paused); }
    } finally {
      this.autoBusy = false;
    }
  }

  restore(b: Backup): void {
    this.record(S.importScreen.records.restored);
    const { saved, ...data } = b;
    // a backup can predate the needs vocabulary being settled, so carry its ids forward too
    this.data = migrateNeedIds($state.snapshot(data) as AppData);
    this.setPrefs({ lastBackup: saved || now(), backupDismissed: true, onboarded: true, draft: null, openDraft: null });
    this.composer = null;
    this.draftSeed = null;
    this.clearImport();
    this.sheet = null;
    this.commit();
    router.root('/settings');
    this.toast(S.importScreen.toasts.restored(b.cards.length, b.people.length));
  }

  async eraseAll(): Promise<void> {
    if (this.saveTimer) clearTimeout(this.saveTimer);
    if (this.prefTimer) clearTimeout(this.prefTimer);
    this.pendingPrefs = {};
    this.data = emptyData();
    this.prefs = { ...DEFAULT_PREFS };
    this.history = [];
    this.redoStack = [];
    this.composer = null;
    this.draftSeed = null;
    this.editing = false;
    this.backupDir = null;
    this.backupDirty = false;
    if (this.autoTimer) clearTimeout(this.autoTimer);
    this.autoTimer = null;
    this.sheet = null;
    this.importVal = '';
    this.importResult = null;
    this.needOpen = {};
    this.dismissed = {};
    this.shiftDismissed = {};
    this.suggestDismissed = {};
    await wipe(this.db);
    router.root('/needs');
    this.toast(S.erase.done);
  }
}

export function listNames(xs: string[]): string {
  return xs.length <= 1 ? xs.join('') : xs.slice(0, -1).join(', ') + ' and ' + xs[xs.length - 1];
}

export const app = new App();
