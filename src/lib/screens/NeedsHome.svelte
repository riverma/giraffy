<script lang="ts">
  // Needs home (spec §5.3): every category, its bar, its needs; tap a dot to say how it feels.
  import { app } from '$lib/store/app.svelte';
  import { router } from '$lib/store/router.svelte';
  import type { Need } from '$lib/data/needs';
  import { catStats, pct, tierDot } from '$lib/core/tiers';
  import { cardsOnNeed, peopleOnNeed } from '$lib/core/cards';
  import UndoBar from '$lib/ui/UndoBar.svelte';
  import Icon from '$lib/ui/Icon.svelte';
  import TierLegend from '$lib/ui/TierLegend.svelte';
  import { rowTap } from '$lib/ui/tap.js';

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
  function cycleCat(e: Event, cat: string): void { e.stopPropagation(); app.record('Marked ' + cat); app.cycleCatTier(cat); }
  function cycleNeed(e: Event, n: Need): void { e.stopPropagation(); app.cycleTier(n.id, 'Marked ' + n.word); }
  function openThread(e: Event, n: Need): void {
    e.stopPropagation();
    const c = cardsOnNeed(app.data.cards, n.id, app.vocab.match).find((x) => x.links.length > 0);
    if (c) router.go('/thread/' + c.id);
  }
  function people(n: Need) { return peopleOnNeed(n.id, app.data.cards, app.data.needPeople, app.data.people, app.data.owner, app.vocab.match); }
  function startCheckin(): void { app.checkinPage = -1; router.go('/checkin'); }
</script>

<div class="screen">
  <div class="hdr" style="justify-content:space-between;padding-bottom:2px">
    <div class="ah-heading-l c-head">Needs</div>
    <div class="row" style="gap:8px">
      <button class="pill outline" onclick={() => app.openAddNeed()}>Add</button>
      <button class="pill outline" class:active={app.editing} onclick={() => (app.editing = !app.editing)}>Edit</button>
      <UndoBar />
    </div>
  </div>
  <div style="padding:0 var(--gutter) 12px">
    <span class="ah-caption c-sec" style="font-style:italic">
      {app.editing ? 'Add needs of your own, and hide the ones you do not use. Nothing you marked is lost either way.' : 'What’s alive in you, by name. Nothing here to fix in a hurry.'}
    </span>
  </div>
  <div class="hrow" style="padding:0 var(--gutter) 10px;align-items:center;mask-image:none;-webkit-mask-image:none">
    <button class="pill checkin" onclick={startCheckin}><Icon name="check" size={12} />Check in</button>
    <span style="width:1px;height:16px;background:var(--border-medium);margin:0 3px"></span>
    {#each FILTERS as [id, label]}
      <button class="pill outline" class:active={app.needFilter === id} onclick={() => pick(id)}>{label}</button>
    {/each}
  </div>
  <div class="scroll" style="padding-top:4px">
    {#if showFirstRun}
      <div class="card" style="padding:18px;background:var(--gradient-cream)">
        <div class="col" style="gap:12px">
          <div class="ah-body-serif c-head" style="font-style:italic">Begin with a quiet pass through your needs, or simply tap any need as it feels today.</div>
          <div class="ah-caption c-head" style="opacity:0.7">A full pass is about 20 minutes, and it keeps every tap if you stop part-way.</div>
          <div class="row" style="gap:8px">
            <button class="btn glass sm" onclick={startCheckin}>Check in</button>
            <button class="btn ghost sm" onclick={() => app.setPrefs({ firstRunDismissed: true })}>Later</button>
          </div>
        </div>
      </div>
    {/if}
    <div class="col" style="gap:6px;padding:2px 4px 0">
      <span class="ah-caption c-faint">{ratedTotal} of {total} looked at</span>
      <TierLegend entangled />
    </div>
    {#each visible as cat (cat.name)}
      <div class="card list p0">
        <div class="row plain" style="width:100%;padding:12px 16px 12px 12px;gap:10px" role="button" tabindex="0" onclick={rowTap(() => toggle(cat.name, cat.open))} onkeydown={(e) => e.key === 'Enter' && toggle(cat.name, cat.open)}>
          <span class="dotbtn" role="button" tabindex="0" title="tap to say how this whole area feels" onclick={(e) => cycleCat(e, cat.name)} onkeydown={(e) => e.key === 'Enter' && cycleCat(e, cat.name)}><span style="width:11px;height:11px;border-radius:99px;background:{tierDot(cat.st.tier)}"></span></span>
          <div class="grow col" style="gap:5px;min-width:0">
            <span class="ah-title-m c-head" style="white-space:nowrap">{cat.name}</span>
            <div class="row" style="gap:8px">
              <div class="bar"><span style="width:{pct(cat.st, 'met')};background:var(--bodhi-500)"></span><span style="width:{pct(cat.st, 'partly')};background:var(--turmeric-500)"></span><span style="width:{pct(cat.st, 'unmet')};background:var(--clay-500)"></span></div>
              <span class="ah-caption c-faint">{cat.st.rated} of {cat.st.total} looked at</span>
            </div>
          </div>
          {#if app.editing && cat.custom}
            <button class="pill outline" onclick={(e) => { e.stopPropagation(); app.confirm('deleteArea', { areaName: cat.name }); }}>Remove</button>
          {/if}
          <span class="chev" aria-label={(cat.open ? 'Collapse ' : 'Expand ') + cat.name}>{cat.open ? '−' : '+'}</span>
        </div>
        {#if cat.open}
          <div class="hairline need-rows" style="padding:4px 10px 6px">
            {#each cat.rows as n (n.id)}
              {@const ppl = people(n)}
              {@const cards = cardsOnNeed(app.data.cards, n.id, app.vocab.match)}
              <div class="row plain" style="width:100%;gap:8px;padding:6px 6px 6px 2px" role="button" tabindex="0" onclick={rowTap(() => router.go('/need/' + n.id))} onkeydown={(e) => e.key === 'Enter' && router.go('/need/' + n.id)}>
                <span class="dotbtn" role="button" tabindex="0" title="tap to change how it feels" onclick={(e) => cycleNeed(e, n)} onkeydown={(e) => e.key === 'Enter' && cycleNeed(e, n)}><span style="width:9px;height:9px;border-radius:99px;background:{tierDot(app.tierOf(n.id))}"></span></span>
                <span class="col grow" style="min-width:0;gap:1px">
                  <span class="ah-body-serif c-body ellipsis">{n.word}</span>
                  <span class="ah-caption c-faint clamp2">{app.meaningOf(n.id)}</span>
                </span>
                {#if ppl.length}
                  <div class="row" style="gap:3px">
                    {#each ppl as p}<span class="mono sunk" style="width:20px;height:20px;font-size:12px;font-weight:400">{p.name.charAt(0)}</span>{/each}
                  </div>
                {/if}
                {#if cards.length}
                  <span class="row c-faint" style="gap:3px" title="cards on this need"><Icon name="card" size={12} /><span class="ah-micro-caps">{cards.length}</span></span>
                {/if}
                {#if cards.some((c) => c.links.length > 0)}
                  <span class="linkish row" style="padding:3px 6px;border-radius:99px;background:var(--surface-sunk)" title="entangled need, tap to see the thread" role="button" tabindex="0" onclick={(e) => openThread(e, n)} onkeydown={(e) => e.key === 'Enter' && openThread(e, n)}><Icon name="link" size={13} /></span>
                {/if}
                {#if app.editing}
                  <button class="pill outline" onclick={(e) => { e.stopPropagation(); n.custom ? app.confirm('deleteNeed', { needId: n.id }) : app.confirm('hideNeed', { needId: n.id }); }}>
                    {n.custom ? 'Remove' : 'Hide'}
                  </button>
                {/if}
              </div>
            {/each}
            {#if app.editing}
              <button class="plain ah-caption c-sec" style="padding:6px 2px;text-align:left" onclick={() => app.openAddNeed(cat.name)}>+ a need under {cat.name}</button>
            {:else if !cat.rows.length}
              <span class="ah-caption c-faint" style="padding:6px 2px">Nothing under {cat.name} yet.</span>
            {/if}
          </div>
        {/if}
      </div>
    {/each}
    {#if app.editing}
      <div class="row" style="gap:8px;padding:4px 4px 0">
        <button class="btn ghost sm" onclick={() => app.openAddArea()}>+ an area</button>
      </div>
    {/if}
    {#if !visible.length}
      <div style="padding:32px 16px"><p class="quote md c-muted">Nothing sits here right now.</p></div>
    {/if}
  </div>
</div>

<style>
  /* The dot palette is reserved for how a need feels, so this carries a check mark instead. */
  .checkin { gap: 6px; color: var(--text-heading); }
  .dotbtn { width: 26px; height: 26px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; cursor: pointer; }
  .bar { width: 88px; height: 3px; border-radius: 99px; background: var(--surface-sunk); display: flex; overflow: hidden; flex-shrink: 0; }
  /* One column on a phone; the extra width on a desktop goes to more needs at once. */
  .need-rows { display: flex; flex-direction: column; }
  @media (min-width: 900px) { .need-rows { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); column-gap: 18px; } }
  .chev { width: 26px; height: 26px; border-radius: 99px; background: var(--surface-sunk); color: var(--text-secondary); box-shadow: inset 0 0 0 1px var(--border-subtle); display: flex; align-items: center; justify-content: center; font-family: var(--font-body); font-size: 17px; line-height: 1; flex-shrink: 0; }
</style>
