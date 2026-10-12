<script lang="ts">
  // Needs home (spec §5.3): every category, its bar, its needs; tap a dot to say how it feels.
  import { app } from '$lib/store/app.svelte';
  import { router } from '$lib/store/router.svelte';
  import type { Need } from '$lib/data/needs';
  import { catStats, pct, tierDot, tierLabel } from '$lib/core/tiers';
  import { cardsOnNeed, peopleOnNeed } from '$lib/core/cards';
  import UndoBar from '$lib/ui/UndoBar.svelte';
  import TierLegend from '$lib/ui/TierLegend.svelte';

  const FILTERS: [string, string][] = [['all', 'All'], ['unmet', 'Unmet'], ['partly', 'Partly'], ['met', 'Met'], ['none', 'Unexamined']];

  // hidden needs keep what was marked on them, but they are not part of the count
  const ratedTotal = $derived(app.vocab.visible.filter((n) => app.tierOf(n.id)).length);
  const total = $derived(app.vocab.visible.length);
  const showFirstRun = $derived(ratedTotal === 0 && !app.prefs.firstRunDismissed);

  function filterOk(n: Need): boolean {
    const t = app.tierOf(n.id);
    const f = app.needFilter;
    return f === 'all' ? true : f === 'none' ? !t : t === f;
  }
  const cats = $derived(app.vocab.areas.map((a) => {
    const st = catStats(a.name, a.needs, app.data.needTiers, app.data.catTiers, app.data.derivedMethod);
    const rows = st.leaves.filter(filterOk);
    const open = app.needFilter !== 'all' ? rows.length > 0 : !!app.needOpen[a.name];
    return { name: a.name, custom: a.custom, st, rows, open, hidden: app.needFilter !== 'all' && rows.length === 0 };
  }));
  const visible = $derived(cats.filter((c) => !c.hidden));

  function pick(id: string): void { app.needFilter = app.needFilter === id ? 'all' : id; }
  function toggle(cat: string, open: boolean): void { app.needOpen = { ...app.needOpen, [cat]: !open }; }
  function cycleCat(cat: string): void { app.record('Marked ' + cat); app.cycleCatTier(cat); }
  function cycleNeed(n: Need): void { app.cycleTier(n.id, 'Marked ' + n.word); }
  function openThread(n: Need): void {
    const c = cardsOnNeed(app.data.cards, n.id, app.vocab.match).find((x) => x.links.length > 0);
    if (c) router.go('/thread/' + c.id);
  }
  function people(n: Need) { return peopleOnNeed(n.id, app.data.cards, app.data.needPeople, app.data.people, app.data.owner, app.vocab.match); }
  function startCheckin(): void { app.checkinPage = -1; router.go('/checkin'); }
</script>

<div class="ah-screen">
  <div class="ah-hdr" style="justify-content:space-between;padding-bottom:2px">
    <div class="ah-heading-l c-head">Needs</div>
    <div class="row" style="gap:8px">
      <button class="ah-pill ah-pill--outline ah-hit" onclick={() => app.openAddNeed()}>Add</button>
      <button class="ah-pill ah-pill--outline ah-hit" class:is-active={app.editing} aria-pressed={app.editing} onclick={() => (app.editing = !app.editing)}>Edit</button>
      <UndoBar />
    </div>
  </div>
  <div style="padding:0 var(--gutter) 12px">
    <span class="ah-caption c-sec" style="font-style:italic">
      {app.editing ? 'Add needs of your own, and hide the ones you do not use. Nothing you marked is lost either way.' : 'What’s alive in you, by name. Nothing here to fix in a hurry.'}
    </span>
  </div>
  <div class="ah-hrow" style="padding:0 var(--gutter) 10px;align-items:center;mask-image:none;-webkit-mask-image:none">
    <button class="ah-pill ah-hit checkin" onclick={startCheckin}>Check in</button>
    <span style="width:1px;height:16px;background:var(--border-medium);margin:0 3px"></span>
    {#each FILTERS as [id, label]}
      <button class="ah-pill ah-pill--outline ah-hit" class:is-active={app.needFilter === id} aria-pressed={app.needFilter === id} onclick={() => pick(id)}>{label}</button>
    {/each}
  </div>
  <div class="ah-scroll" style="padding-top:4px">
    {#if showFirstRun}
      <div class="ah-card ah-surface--cream" style="padding:18px">
        <div class="col" style="gap:12px">
          <div class="ah-body-serif c-head" style="font-style:italic">Begin with a quiet pass through your needs, or simply tap any need as it feels today.</div>
          <div class="ah-caption c-head" style="opacity:0.7">A full pass is about 20 minutes, and it keeps every tap if you stop part-way.</div>
          <div class="row" style="gap:8px">
            <button class="ah-btn ah-btn--glass ah-btn--sm ah-hit" onclick={startCheckin}>Check in</button>
            <button class="ah-btn ah-btn--ghost ah-btn--sm ah-hit" onclick={() => app.setPrefs({ firstRunDismissed: true })}>Later</button>
          </div>
        </div>
      </div>
    {/if}
    <div class="col" style="gap:6px;padding:2px 4px 0">
      <span class="ah-caption c-sec">{ratedTotal} of {total} looked at</span>
      <TierLegend entangled />
    </div>
    {#each visible as cat (cat.name)}
      <div class="ah-card ah-card--list ah-card--p0">
        <div class="row" style="position:relative;width:100%;padding:12px 16px 12px 12px;gap:10px">
          <button class="dotbtn ah-hit above" aria-label={`How ${cat.name} feels as a whole: ${tierLabel(cat.st.tier)}. Press to change it.`} onclick={() => cycleCat(cat.name)}><span style="width:11px;height:11px;border-radius:var(--radius-full);background:{tierDot(cat.st.tier)}"></span></button>
          <button class="plain stretch grow col" style="gap:5px;min-width:0" aria-expanded={cat.open} onclick={() => toggle(cat.name, cat.open)}>
            <span class="ah-title-m c-head" style="white-space:nowrap">{cat.name}</span>
            <div class="row" style="gap:8px">
              <div class="bar"><span style="width:{pct(cat.st, 'met')};background:var(--accent-success)"></span><span style="width:{pct(cat.st, 'partly')};background:var(--accent-secondary)"></span><span style="width:{pct(cat.st, 'unmet')};background:var(--accent-warning)"></span></div>
              <span class="ah-caption c-sec">{cat.st.rated} of {cat.st.total} looked at</span>
            </div>
          </button>
          {#if app.editing && cat.custom}
            <button class="ah-pill ah-pill--outline ah-hit above" onclick={() => app.confirm('deleteArea', { areaName: cat.name })}>Remove</button>
          {/if}
          <span class="chev" aria-hidden="true">{cat.open ? '−' : '+'}</span>
        </div>
        {#if cat.open}
          <div class="hairline need-rows" style="padding:4px 10px 6px">
            {#each cat.rows as n (n.id)}
              {@const ppl = people(n)}
              {@const cards = cardsOnNeed(app.data.cards, n.id, app.vocab.match)}
              <div class="row" style="position:relative;width:100%;gap:8px;padding:6px 6px 6px 2px">
                <button class="dotbtn ah-hit above" aria-label={`${n.word}: ${tierLabel(app.tierOf(n.id))}. Press to change how it feels.`} onclick={() => cycleNeed(n)}><span style="width:9px;height:9px;border-radius:var(--radius-full);background:{tierDot(app.tierOf(n.id))}"></span></button>
                <button class="plain stretch col grow" style="min-width:0;gap:1px" onclick={() => router.go('/need/' + n.id)}>
                  <span class="ah-body-serif c-body ellipsis">{n.word}</span>
                  <span class="ah-caption c-sec clamp2">{app.meaningOf(n.id)}</span>
                </button>
                {#if ppl.length}
                  <div class="row" style="gap:3px">
                    {#each ppl as p}<span class="ah-mono ah-mono--sunk" style="width:20px;height:20px;font-size:var(--size-base);font-weight:400">{p.name.charAt(0)}</span>{/each}
                  </div>
                {/if}
                {#if cards.length}
                  <span class="ah-micro-caps c-sec">{cards.length} {cards.length === 1 ? 'card' : 'cards'}</span>
                {/if}
                {#if cards.some((c) => c.links.length > 0)}
                  <button class="ah-pill ah-pill--outline ah-hit above" onclick={() => openThread(n)}>Entangled</button>
                {/if}
                {#if app.editing}
                  <button class="ah-pill ah-pill--outline ah-hit above" onclick={() => { n.custom ? app.confirm('deleteNeed', { needId: n.id }) : app.confirm('hideNeed', { needId: n.id }); }}>
                    {n.custom ? 'Remove' : 'Hide'}
                  </button>
                {/if}
              </div>
            {/each}
            {#if app.editing}
              <button class="plain ah-caption c-sec ah-hit" style="padding:6px 2px;text-align:left" onclick={() => app.openAddNeed(cat.name)}>+ a need under {cat.name}</button>
            {:else if !cat.rows.length}
              <span class="ah-caption c-sec" style="padding:6px 2px">Nothing under {cat.name} yet.</span>
            {/if}
          </div>
        {/if}
      </div>
    {/each}
    {#if app.editing}
      <div class="row" style="gap:8px;padding:4px 4px 0">
        <button class="ah-btn ah-btn--ghost ah-btn--sm ah-hit" onclick={() => app.openAddArea()}>+ an area</button>
      </div>
    {/if}
    {#if !visible.length}
      <div style="padding:32px 16px"><p class="ah-quote ah-quote--md c-sec">Nothing sits here right now.</p></div>
    {/if}
  </div>
</div>

<style>
  .checkin { color: var(--text-heading); }
  .dotbtn { width: 26px; height: 26px; padding: 0; border: none; background: none; display: flex; align-items: center; justify-content: center; flex-shrink: 0; cursor: pointer; }
  .bar { width: 88px; height: 3px; border-radius:var(--radius-full); background: var(--surface-sunk); display: flex; overflow: hidden; flex-shrink: 0; }
  /* One column on a phone; the extra width on a desktop goes to more needs at once. */
  .need-rows { display: flex; flex-direction: column; }
  @media (min-width: 900px) { .need-rows { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); column-gap: 18px; } }
  .chev { width: 26px; height: 26px; border-radius:var(--radius-full); background: var(--surface-sunk); color: var(--text-secondary); box-shadow: inset 0 0 0 1px var(--border-subtle); display: flex; align-items: center; justify-content: center; font-family: var(--font-body); font-size:var(--size-lg); line-height: 1; flex-shrink: 0; }
</style>
