<script lang="ts">
  // Cards home (spec §5.7): mine and received, searched, filtered, sorted, optionally by person.
  import { app } from '$lib/store/app.svelte';
  import { router } from '$lib/store/router.svelte';
  import { needsAttention, otherName, STATE_NAMES } from '$lib/core/cards';
  import { applyListQuery, sortDef } from '$lib/core/sorts';
  import type { CardState } from '$lib/core/types';
  import UndoBar from '$lib/ui/UndoBar.svelte';
  import Icon from '$lib/ui/Icon.svelte';
  import CardRow from '$lib/ui/CardRow.svelte';

  const filters = $derived.by(() => {
    const f = app.data.filter;
    const defs: [string, string][] = [['all', 'All']];
    if (f.startsWith('s:')) {
      const state = f.slice(2);
      defs.push([f, Object.hasOwn(STATE_NAMES, state) ? STATE_NAMES[state as CardState] : state]);
    }
    defs.push(['attention', 'Needs attention'], ['request', 'Requests'], ['gratitude', 'Gratitude'], ['entangled', 'Entangled'], ['history', 'With history']);
    if (f.startsWith('p:')) defs.push([f, f.slice(2)]);
    return defs;
  });
  // drafts sit out of the main list, except when the draft filter is the one asked for
  const source = $derived(app.tab === 'received' ? app.received : app.data.filter === 's:draft' ? app.drafts : app.mine);
  const list = $derived(applyListQuery(source, app.data.filter, app.cardQuery, app.data.sort));
  const showDrafts = $derived(app.tab === 'mine' && app.data.filter === 'all' && !app.cardQuery.trim() && app.drafts.length > 0);
  const groups = $derived.by(() => {
    if (!app.groupOn) return [{ name: '', rows: list }];
    const by: Record<string, typeof list> = {};
    for (const c of list) (by[otherName(c)] ??= []).push(c);
    return Object.keys(by).sort().map((name) => ({ name, rows: by[name] }));
  });
  const emptyText = $derived(
    app.data.filter !== 'all' || app.cardQuery.trim()
      ? 'Nothing here matches. Clear the filter to see every card.'
      : app.tab === 'received'
        ? 'When someone sends you a card file, import it here, or try sending yourself one to see how it feels.'
        : 'A quiet place to begin. Tap + when something is asking to be put into words.'
  );
  // a folder that keeps itself up to date needs no nudging
  const showBackupNote = $derived(!app.autoBackupOn && !app.prefs.backupDismissed && app.tab === 'mine');
</script>

<div class="screen">
  <div class="hdr" style="justify-content:space-between;padding-bottom:10px">
    <div class="ah-heading-l c-head">Cards</div>
    <div class="row" style="gap:8px">
      <button class="pill outline" onclick={() => app.startCompose('request')}>Add</button>
      <button class="pill outline" class:active={app.editing} onclick={() => (app.editing = !app.editing)}>Edit</button>
      <UndoBar />
    </div>
  </div>
  <div class="row" style="padding:0 var(--gutter) 10px;gap:8px">
    <button class="pill" class:active={app.tab === 'mine'} onclick={() => (app.tab = 'mine')}>Mine · {app.mine.length}</button>
    <button class="pill" class:active={app.tab === 'received'} onclick={() => (app.tab = 'received')}>
      {#if app.received.some(needsAttention)}<span class="dot" style="background:var(--saffron-500)"></span>{/if}Received · {app.received.length}
    </button>
    <div class="grow"></div>
    <button class="pill outline" onclick={() => router.go('/import')}>Import</button>
  </div>
  <div class="row" style="padding:0 var(--gutter) 4px;gap:8px">
    <label class="field grow" style="min-width:0"><input bind:value={app.cardQuery} placeholder="Search cards" autocomplete="off" /></label>
    <button class="pill outline" class:active={app.data.sort !== 'updated'} onclick={() => app.open({ kind: 'sort' })} style="gap:5px"><Icon name="sort" size={11} />{sortDef(app.data.sort).short}</button>
  </div>
  <div class="row" style="padding:10px 0 8px var(--gutter);flex-shrink:0">
    <div class="hrow grow" style="min-width:0">
      {#each filters as [id, label] (id)}
        <button class="pill outline" class:active={app.data.filter === id} onclick={() => app.pickFilter(id)}>{label}</button>
      {/each}
      <button class="pill outline" class:active={app.groupOn} onclick={() => (app.groupOn = !app.groupOn)}>By person</button>
    </div>
    <button class="more" onclick={() => app.open({ kind: 'filters' })}>More filters <span style="font-style:normal">›</span></button>
  </div>
  <div class="scroll">
    {#if showBackupNote}
      <div class="card sunk" style="padding:16px">
        <div class="col" style="gap:10px">
          <div class="ah-caption c-sec">Your cards and needs live only on this device. It has been a while since your last backup. One tap keeps them safe.</div>
          <div class="row" style="gap:8px">
            <button class="btn sm" onclick={() => app.backupNow()}>Back up now</button>
            <button class="btn ghost sm" onclick={() => app.setPrefs({ backupDismissed: true })}>Later</button>
          </div>
        </div>
      </div>
    {/if}
    {#if showDrafts}
      <div class="col" style="gap:8px">
        <div class="rule-row"><span class="ah-small-caps c-muted">Drafts · {app.drafts.length}</span></div>
        <span class="ah-caption c-faint" style="padding:0 2px">Unfinished cards, exactly where you left them, and any guesses you have written in someone else's voice.</span>
        <div class="list-grid">
          {#each app.drafts as c (c.id)}
            <CardRow card={c} onremove={app.editing ? () => app.confirm('discardDraft', { cardId: c.id }) : undefined} />
          {/each}
        </div>
      </div>
    {/if}
    {#if showDrafts && list.length}
      <div class="rule-row"><span class="ah-small-caps c-muted">Cards · {list.length}</span></div>
    {/if}
    {#each groups as g (g.name)}
      {#if app.groupOn}
        <div class="row" style="align-items:baseline;gap:8px;padding:8px 2px 0">
          <span class="ah-small-caps c-muted">{g.name}</span>
          <span class="ah-caption c-faint">{g.rows.length} {g.rows.length === 1 ? 'card' : 'cards'}</span>
        </div>
      {/if}
      <div class="list-grid">
        {#each g.rows as c (c.id)}
          <CardRow card={c} onremove={app.editing ? () => app.confirm(c.status === 'draft' ? 'discardDraft' : 'delete', { cardId: c.id }) : undefined} />
        {/each}
      </div>
    {/each}
    {#if !list.length && !showDrafts}
      <div style="padding:44px 16px"><p class="quote md c-muted">{emptyText}</p></div>
    {/if}
  </div>
</div>

<style>
  .field input { font-family: var(--font-body); font-size: 13px; }
  .more { flex-shrink: 0; margin-right: var(--gutter); cursor: pointer; display: inline-flex; align-items: center; gap: 4px; height: 28px; padding: 0 12px; border-radius: 999px; border: 1px solid var(--peacock-500); color: var(--peacock-700); font-family: var(--font-display); font-style: italic; font-size: 12.5px; line-height: 1; background: var(--glass-overlay); }
</style>
