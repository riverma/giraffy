<script lang="ts">
  // One need (spec §5.5): how it feels, who might help meet it, and a private note.
  import { app } from '$lib/store/app.svelte';
  import { router } from '$lib/store/router.svelte';
  import { SELF_NAME_SORT } from '$lib/data/needs';
  import { tierDot, tierLabel, tierTitle } from '$lib/core/tiers';
  import { SELF_NAME, type Tier } from '$lib/core/types';
  import { S } from '$lib/strings';
  import { peopleOnNeed } from '$lib/core/cards';
  import { fmtDate } from '$lib/core/time';
  import CardRow from '$lib/ui/CardRow.svelte';

  let { id }: { id: string } = $props();
  const need = $derived(app.needOf(id));
  const tier = $derived(need ? app.tierOf(need.id) : null);
  const rec = $derived(need ? app.data.needTiers[need.id] : undefined);
  const people = $derived(need ? peopleOnNeed(need.id, app.data.cards, app.data.needPeople, app.data.people, app.data.owner, app.vocab.match) : []);
  const addable = $derived(app.data.people.filter((p) => !people.some((x) => x.name === p.name)).sort(SELF_NAME_SORT));
  const TIERS: Tier[] = ['met', 'partly', 'unmet'];

  function pick(t: Tier): void {
    if (!need) return;
    app.record('Marked ' + need.word + ' ' + t);
    app.setTier(need.id, tier === t ? null : t);
  }
  function clear(): void {
    if (!need) return;
    app.record('Cleared ' + need.word);
    app.setTier(need.id, null);
  }
  function summary(n: number): string {
    return n ? n + (n === 1 ? ' card on this need' : ' cards on this need') : 'named, no card yet, an intention';
  }
</script>

<div class="ah-screen ah-screen--over">
  <div class="ah-hdr">
    <button class="back" onclick={() => router.back('/needs')} aria-label="Back">←</button>
    <span class="ah-small-caps c-sec grow">{need?.category ?? 'a need'}</span>
    <button class="iconbtn" class:off={!app.history.length} onclick={() => app.undo()} aria-label="Undo"><span>undo</span></button>
  </div>
  {#if !need}
    <div class="ah-scroll" style="padding-top:8px;gap:16px">
      <div class="col" style="gap:10px;padding-top:8px">
        <span class="ah-heading-m c-head">Not in your needs</span>
        <span class="ah-body-serif c-sec">This need is not in your list. It may have been one you removed.</span>
        <div><button class="ah-btn ah-btn--ghost ah-btn--sm ah-hit" onclick={() => router.back('/needs')}>Back to your needs</button></div>
      </div>
    </div>
  {:else}
  <div class="ah-scroll" style="padding-top:8px;gap:16px">
    <div class="col" style="gap:8px;padding-top:4px">
      <div class="row" style="gap:12px">
        <span style="width:13px;height:13px;border-radius:var(--radius-full);background:{tierDot(tier)};flex-shrink:0"></span>
        <span class="ah-heading-m c-head">{need.word}</span>
      </div>
      <span class="ah-body-serif c-sec">{app.meaningOf(need.id)}</span>
      {#if app.vocab.hiddenIds.has(need.id)}
        <div class="row" style="gap:8px;align-items:baseline">
          <span class="ah-caption c-sec">Hidden from your list, with everything you marked on it kept.</span>
          <button class="plain ah-caption c-sec ah-hit" onclick={() => app.unhideNeed(need.id)}>Show it again</button>
        </div>
      {:else if need.custom}
        <div class="row" style="gap:8px;align-items:baseline">
          <span class="ah-caption c-sec">A need of your own, under {need.category}.</span>
          <button class="plain ah-caption c-sec ah-hit" onclick={() => app.confirm('deleteNeed', { needId: need.id })}>Remove it</button>
        </div>
      {/if}
    </div>

    <div class="ah-card ah-card--sunk" style="padding:16px">
      <div class="col" style="gap:10px">
        <span class="ah-micro-caps c-sec">How it feels today</span>
        <div class="row wrap" style="gap:7px">
          {#each TIERS as t}
            <button class="ah-pill ah-hit" class:is-active={tier === t} aria-pressed={tier === t} onclick={() => pick(t)}><span class="ah-pill__dot" style="background:{tierDot(t)}"></span>{tierTitle(t)}</button>
          {/each}
          <div class="grow"></div>
          {#if tier}<button class="plain ah-caption c-sec ah-hit" onclick={clear}>clear</button>{/if}
        </div>
        <span class="ah-caption c-sec">{rec ? 'changed ' + fmtDate(rec.changed) + (rec.was ? ' · was ' + tierLabel(rec.was) : '') : 'Unexamined. Tap how it feels today.'}</span>
      </div>
    </div>

    <div class="col" style="gap:10px">
      <div class="ah-rule-row"><span class="ah-small-caps c-sec">Who to reach out to</span></div>
      {#each people as p (p.name)}
        <div class="ah-card ah-card--list ah-card--p0">
          <div class="row" style="padding:12px 14px 12px 16px;gap:12px">
            <span class="ah-mono ah-mono--sunk" style="width:36px;height:36px;font-size:var(--size-xl)">{p.name.charAt(0)}</span>
            <div class="col grow" style="gap:3px;min-width:0">
              <span class="ah-title-m c-head">{p.name}</span>
              <span class="ah-caption c-sec">{summary(p.cards.length)}</span>
            </div>
            <div class="col" style="gap:5px;flex-shrink:0;align-items:flex-end">
              <span class="ah-micro-caps c-sec">write a card</span>
              <button class="ah-pill ah-pill--outline ah-hit" onclick={() => app.composeForNeed(need, p.name, router.route.path, 'request')}>Request</button>
              <button class="ah-pill ah-pill--outline ah-hit" onclick={() => app.composeForNeed(need, p.name, router.route.path, 'gratitude')}>Gratitude</button>
              {#if p.name !== SELF_NAME}
                <button class="ah-pill ah-pill--outline ah-hit" onclick={() => app.startGuess(p.name, 'request', router.route.path, need)}>Imagine theirs</button>
              {/if}
            </div>
          </div>
          {#each p.cards as c (c.id)}
            <CardRow card={c} compact />
          {/each}
        </div>
      {/each}
      {#if addable.length}
        <div class="row wrap" style="gap:7px;padding:2px 4px">
          <span class="ah-caption c-sec">+ someone</span>
          {#each addable as p (p.id)}
            <button class="ah-pill ah-pill--outline ah-hit" onclick={() => app.addNeedPerson(need.id, p.name)}>{p.name}</button>
          {/each}
        </div>
      {/if}
      {#if people.length}
        <div class="ah-caption c-sec" style="padding:0 4px">A person with no card yet is fine. It is an intention.</div>
      {/if}
    </div>

    <div class="col" style="gap:10px">
      <div class="ah-rule-row"><span class="ah-small-caps c-sec">A private note</span></div>
      <textarea class="note" rows="3" value={app.data.needNotes[need.id] ?? ''} onchange={(e) => app.setNeedNote(need.id, (e.currentTarget as HTMLTextAreaElement).value)} placeholder="Only for you. It never leaves this device."></textarea>
    </div>
  </div>
  {/if}
</div>

<style>
  /* a flex item in a scrolling column, so it must not be squeezed flat by what sits above it */
  .note { flex-shrink: 0; font-family: var(--font-display); font-style: italic; font-size:var(--size-md); line-height: 1.5; color: var(--text-body); background: var(--surface-elevated); border: none; border-radius:var(--radius-lg); padding: 14px 16px; width: 100%; box-shadow: var(--shadow-sm); resize: none;  }
  .note::placeholder { color: var(--text-secondary); }
</style>
