<script lang="ts">
  // Check-in (spec §5.4): one category per page, every tap kept, closing part-way is fine.
  import { app } from '$lib/store/app.svelte';
  import { router } from '$lib/store/router.svelte';
  import { catStats, chipStyle, pct, tierDot, tierTitle } from '$lib/core/tiers';
  import type { Tier } from '$lib/core/types';
  import Dots from '$lib/ui/Dots.svelte';

  const cats = $derived(app.vocab.areas.map((a) => a.name));
  const N = $derived(cats.length);
  const step = $derived(app.checkinPage);
  const cat = $derived(step >= 0 && step < N ? cats[step] : null);
  const st = $derived(cat ? stats(cat) : null);
  const total = $derived(app.vocab.visible.length);
  const ratedTotal = $derived(app.vocab.visible.filter((n) => app.tierOf(n.id)).length);
  const unmet = $derived(app.vocab.visible.filter((n) => app.tierOf(n.id) === 'unmet'));
  const TIERS: Tier[] = ['met', 'partly', 'unmet'];

  // The last need you touched, so its meaning can be shown without crowding the chips.
  let touched = $state<{ word: string; meaning: string } | null>(null);

  function close(): void { router.root('/needs'); }
  function closeMidway(): void {
    const midway = step >= 0 && step < N;
    close();
    if (midway) app.toast('Every tap is kept. Pick it up whenever you like.');
  }
  function begin(): void { app.record('Checked in'); app.checkinPage = 0; }
  function pickCat(t: Tier): void {
    if (!cat) return;
    if (st?.felt === t) delete app.data.catTiers[cat];
    else app.data.catTiers[cat] = t;
    app.commit();
  }
  function stats(c: string) { return catStats(c, app.needsIn(c), app.data.needTiers, app.data.catTiers, app.data.derivedMethod); }

  $effect(() => { void step; touched = null; });
</script>

<div class="screen ck">
  <div class="hdr" style="justify-content:space-between;padding-bottom:10px">
    <button class="plain" style="font-size:19px;color:var(--text-secondary);padding:4px 10px 4px 0" onclick={closeMidway} aria-label="Close">×</button>
    <Dots count={N} active={Math.max(0, Math.min(N - 1, step))} />
    <span style="min-width:48px;display:flex;justify-content:flex-end">
      {#if cat}<button class="plain ah-caption c-sec" style="white-space:nowrap;padding:4px 0" onclick={() => (app.checkinPage = N)}>Skip to end</button>{/if}
    </span>
  </div>
  <div class="scroll" style="padding:8px var(--gutter) 24px;gap:16px;--scroll-tail:0">
    {#if step < 0}
      <div class="col grow" style="justify-content:center;gap:20px;padding:24px 0">
        <div class="ah-small-caps c-muted">a quiet pass</div>
        <div class="ah-heading-m c-head">Check in</div>
        <div class="ah-pull-quote c-head">Take a quiet pass through your needs, one area per page. Tap each one as it feels today: met, partly, unmet. Skip any you like.</div>
        <div class="col" style="gap:9px;padding:0 4px">
          {#each [[tierDot('met'), 'met: nourished right now'], [tierDot('partly'), 'partly: some of it, some of the time'], [tierDot('unmet'), 'unmet: this one is aching'], [tierDot(null), 'unexamined: not looked at yet']] as [dot, text]}
            <div class="row" style="gap:10px"><span style="width:9px;height:9px;border-radius:99px;background:{dot};flex-shrink:0"></span><span class="ah-caption c-sec">{text}</span></div>
          {/each}
        </div>
        <div class="ah-caption c-sec">{N} areas, about 20 minutes for all of them. One area takes two or three. There is no need to finish today.</div>
        <div class="ah-caption c-faint">No timer, no score. Closing part-way keeps every tap.</div>
      </div>
    {:else if cat && st}
      <div class="col" style="gap:14px;padding-top:8px">
        <div class="row wrap" style="gap:6px 14px">
          {#each [[tierDot('met'), 'met'], [tierDot('partly'), 'partly'], [tierDot('unmet'), 'unmet'], [tierDot(null), 'unexamined']] as [dot, text]}
            <span class="row" style="gap:5px"><span style="width:8px;height:8px;border-radius:99px;background:{dot}"></span><span class="ah-caption c-sec">{text}</span></span>
          {/each}
        </div>
        <span class="caps rule">{cat} Need</span>
        <div class="ah-pull-quote c-head">How do your {cat.toLowerCase()}-related needs feel right now?</div>
        <div class="ah-caption c-faint" style="margin-top:-6px">Each tap moves a need along: met → partly → unmet → unexamined.</div>
        <div class="row wrap" style="gap:7px">
          {#each st.leaves as n (n.id)}
            {@const cs = chipStyle(false, app.tierOf(n.id))}
            <button class="chip" title={app.meaningOf(n.id)} style="background:{cs.bg};color:{cs.color};box-shadow:{cs.shadow}"
              onclick={() => { touched = { word: n.word, meaning: app.meaningOf(n.id) }; app.cycleTier(n.id); }}><span class="dot" style="background:{cs.dot}"></span>{n.word}</button>
          {/each}
        </div>
        <div class="gloss">
          {#if touched}<span class="ah-caption c-sec"><strong>{touched.word}</strong>: {touched.meaning}</span>
          {:else}<span class="ah-caption c-faint">Tap a need to mark it. Its meaning here appears on this line.</span>{/if}
        </div>
        <div class="card sunk" style="padding:14px 16px">
          <div class="col" style="gap:9px">
            <span class="ah-micro-caps c-muted">Overall, this area feels</span>
            <div class="row wrap" style="gap:7px">
              {#each TIERS as t}
                <button class="pill" class:active={st.tier === t} onclick={() => pickCat(t)}><span class="dot" style="background:{tierDot(t)}"></span>{tierTitle(t)}</button>
              {/each}
            </div>
            <span class="ah-caption c-faint">{st.felt ? 'set by you, it stays until you change it' : st.derived ? 'worked out from the needs above, tap to say otherwise' : 'tap a few needs above, or say how the whole area feels'}</span>
          </div>
        </div>
      </div>
    {:else}
      <div class="col" style="gap:16px;padding-top:8px">
        <span class="caps rule">Summary</span>
        <div class="ah-pull-quote c-head">{ratedTotal} of {total} needs looked at. That is plenty for one pass.</div>
        <div class="card sunk" style="padding:16px">
          <div class="col" style="gap:11px">
            {#each cats as c (c)}
              {@const s2 = stats(c)}
              <div class="row" style="gap:10px">
                <span style="width:9px;height:9px;border-radius:99px;background:{tierDot(s2.tier)};flex-shrink:0"></span>
                <span class="ah-body-serif c-body grow ellipsis">{c}</span>
                <div class="bar"><span style="width:{pct(s2, 'met')};background:var(--bodhi-500)"></span><span style="width:{pct(s2, 'partly')};background:var(--turmeric-500)"></span><span style="width:{pct(s2, 'unmet')};background:var(--clay-500)"></span></div>
                <span class="ah-caption c-faint" style="width:44px;text-align:right;flex-shrink:0">{s2.rated} of {s2.total}</span>
              </div>
            {/each}
          </div>
        </div>
        {#if unmet.length}
          <div class="ah-body-serif c-sec" style="font-style:italic">Would you like to write a card about any of these? Tapping one finishes setup and opens a new card.</div>
          <div class="row wrap" style="gap:7px">
            {#each unmet as n (n.id)}
              <button class="pill" onclick={() => app.confirm('leaveSetup', { needId: n.id })}><span class="dot" style="background:{tierDot('unmet')}"></span>{n.word}</button>
            {/each}
          </div>
        {/if}
      </div>
    {/if}
  </div>
  <div class="foot">
    {#if step < 0}
      <div class="grow"><button class="btn wide" onclick={begin}>Begin</button></div>
      <button class="btn ghost" onclick={close}>Not now</button>
    {:else if cat}
      <div style={step > 0 ? '' : 'opacity:0.35;pointer-events:none'}><button class="btn ghost" onclick={() => (app.checkinPage = step - 1)}>Back</button></div>
      <div class="grow" style="text-align:center"><span class="ah-caption c-muted">Page {step + 1} of {N}</span></div>
      <button class="btn" onclick={() => (app.checkinPage = step + 1)}>{step === N - 1 ? 'Finish' : 'Next'}</button>
    {:else}
      <div class="grow"><button class="btn wide" onclick={close}>Done Setup</button></div>
    {/if}
  </div>
</div>

<style>
  .ck { background: var(--canvas-checkin); z-index: 20; }
  .gloss { min-height: 34px; display: flex; align-items: flex-start; }
  .bar { width: 88px; height: 3px; border-radius: 99px; background: var(--surface-elevated); display: flex; overflow: hidden; flex-shrink: 0; }
  .foot { padding: 12px var(--gutter) calc(20px + var(--safe-bottom)); display: flex; align-items: center; gap: 10px; border-top: 1px solid var(--border-subtle); background: var(--glass-overlay-strong); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px); }
</style>
