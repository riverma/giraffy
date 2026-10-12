<script lang="ts">
  // Cards home (spec §5.7): mine and received, searched, filtered, sorted, optionally by person.
  import { app } from '$lib/store/app.svelte';
  import { router } from '$lib/store/router.svelte';
  import { isGuess, otherName, STATE_NAMES } from '$lib/core/cards';
  import { applyListQuery, sortDef } from '$lib/core/sorts';
  import type { CardState } from '$lib/core/types';
  import UndoBar from '$lib/ui/UndoBar.svelte';
  import CardRow from '$lib/ui/CardRow.svelte';

  const filters = $derived.by(() => {
    const f = app.data.filter;
    const defs: [string, string][] = [['all', 'All']];
    if (f.startsWith('s:')) {
      const state = f.slice(2);
      defs.push([f, Object.hasOwn(STATE_NAMES, state) ? STATE_NAMES[state as CardState] : state]);
    }
    defs.push(['attention', 'Needs attention'], ['request', 'Requests'], ['gratitude', 'Gratitude'], ['entangled', 'Entangled'], ['history', 'With history']);
    if (app.drafts.some((c) => isGuess(c, app.owner))) defs.push(['guess', 'Imagined']);
    if (f.startsWith('p:')) defs.push([f, f.slice(2)]);
    return defs;
  });
  // drafts sit out of the main list, except when the draft filter is the one asked for
  const source = $derived(
    app.data.filter === 's:draft' || app.data.filter === 'guess' ? app.drafts
    : app.tab === 'received' ? app.received
    : app.mine
  );
  const list = $derived(applyListQuery(source, app.data.filter, app.cardQuery, app.data.sort, app.owner));
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
</script>

<div class="ah-screen">
  <div class="ah-hdr" style="justify-content:space-between;padding-bottom:10px">
    <div class="ah-heading-l c-head">Cards</div>
    <div class="row" style="gap:8px">
      <button class="ah-pill ah-pill--outline ah-hit" onclick={() => app.startCompose('request')}>Add</button>
      <button class="ah-pill ah-pill--outline ah-hit" class:is-active={app.editing} aria-pressed={app.editing} onclick={() => (app.editing = !app.editing)}>Edit</button>
      <UndoBar />
    </div>
  </div>
  <div class="row" style="padding:0 var(--gutter) 10px;gap:8px">
    <button class="ah-pill ah-hit" class:is-active={app.tab === 'mine'} aria-pressed={app.tab === 'mine'} onclick={() => (app.tab = 'mine')}>Mine · {app.mine.length}</button>
    <button class="ah-pill ah-hit" class:is-active={app.tab === 'received'} aria-pressed={app.tab === 'received'} onclick={() => (app.tab = 'received')}>
      Received · {app.received.length}
    </button>
    <div class="grow"></div>
    <button class="ah-pill ah-pill--outline ah-hit" onclick={() => router.go('/import')}>Import</button>
  </div>
  <div class="row" style="padding:0 var(--gutter) 4px;gap:8px">
    <label class="ah-field grow" style="min-width:0"><input bind:value={app.cardQuery} placeholder="Search cards" autocomplete="off" /></label>
    <button class="ah-pill ah-pill--outline ah-hit" class:is-active={app.data.sort !== 'updated'} aria-pressed={app.data.sort !== 'updated'} onclick={() => app.open({ kind: 'sort' })} >Sort: {sortDef(app.data.sort).short}</button>
  </div>
  <div class="row" style="padding:10px 0 8px var(--gutter);flex-shrink:0">
    <div class="ah-hrow grow" style="min-width:0">
      {#each filters as [id, label] (id)}
        <button class="ah-pill ah-pill--outline ah-hit" class:is-active={app.data.filter === id} aria-pressed={app.data.filter === id} onclick={() => app.pickFilter(id)}>{label}</button>
      {/each}
      <button class="ah-pill ah-pill--outline ah-hit" class:is-active={app.groupOn} aria-pressed={app.groupOn} onclick={() => (app.groupOn = !app.groupOn)}>By person</button>
    </div>
    <button class="ah-pill ah-pill--outline ah-hit" onclick={() => app.open({ kind: 'filters' })}>More filters</button>
  </div>
  <div class="ah-scroll">
    {#if showDrafts}
      <div class="col" style="gap:8px">
        <div class="ah-rule-row"><span class="ah-small-caps c-sec">Drafts · {app.drafts.length}</span></div>
        <span class="ah-caption c-sec" style="padding:0 2px">Unfinished cards, exactly where you left them, and any guesses you have written in someone else's voice.</span>
        <div class="ah-list">
          {#each app.drafts as c (c.id)}
            <CardRow card={c} onremove={app.editing ? () => app.confirm('discardDraft', { cardId: c.id }) : undefined} />
          {/each}
        </div>
      </div>
    {/if}
    {#if showDrafts && list.length}
      <div class="ah-rule-row"><span class="ah-small-caps c-sec">Cards · {list.length}</span></div>
    {/if}
    {#each groups as g (g.name)}
      {#if app.groupOn}
        <div class="row" style="align-items:baseline;gap:8px;padding:8px 2px 0">
          <span class="ah-small-caps c-sec">{g.name}</span>
          <span class="ah-caption c-sec">{g.rows.length} {g.rows.length === 1 ? 'card' : 'cards'}</span>
        </div>
      {/if}
      <div class="ah-list">
        {#each g.rows as c (c.id)}
          <CardRow card={c} onremove={app.editing ? () => app.confirm(c.status === 'draft' ? 'discardDraft' : 'delete', { cardId: c.id }) : undefined} />
        {/each}
      </div>
    {/each}
    {#if !list.length && !showDrafts}
      <div style="padding:44px 16px"><p class="ah-quote ah-quote--md c-sec">{emptyText}</p></div>
    {/if}
  </div>
</div>

