<script lang="ts">
  // One need (spec §5.5): how it feels, who might help meet it, and a private note.
  import { app } from '$lib/store/app.svelte';
  import { router } from '$lib/store/router.svelte';
  import { SELF_NAME_SORT } from '$lib/data/needs';
  import { tierDot, tierLabel, tierTitle } from '$lib/core/tiers';
  import type { Tier } from '$lib/core/types';
  import { peopleOnNeed } from '$lib/core/cards';
  import { fmtDate } from '$lib/core/time';
  import Icon from '$lib/ui/Icon.svelte';
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

<div class="screen over">
  <div class="hdr">
    <button class="back" onclick={() => router.back('/needs')} aria-label="Back">←</button>
    <span class="ah-small-caps c-muted grow">{need?.category ?? 'a need'}</span>
    <button class="iconbtn" class:off={!app.history.length} onclick={() => app.undo()} aria-label="Undo"><Icon name="undo" size={19} /><span>undo</span></button>
  </div>
  {#if !need}
    <div class="scroll" style="padding-top:8px;gap:16px">
      <div class="col" style="gap:10px;padding-top:8px">
        <span class="ah-heading-m c-head">Not in your needs</span>
        <span class="ah-body-serif c-sec">This need is not in your list. It may have been one you removed.</span>
        <div><button class="btn ghost sm" onclick={() => router.back('/needs')}>Back to your needs</button></div>
      </div>
    </div>
  {:else}
  <div class="scroll" style="padding-top:8px;gap:16px">
    <div class="col" style="gap:8px;padding-top:4px">
      <div class="row" style="gap:12px">
        <span style="width:13px;height:13px;border-radius:99px;background:{tierDot(tier)};flex-shrink:0"></span>
        <span class="ah-heading-m c-head">{need.word}</span>
      </div>
      <span class="ah-body-serif c-sec">{app.meaningOf(need.id)}</span>
      {#if app.vocab.hiddenIds.has(need.id)}
        <div class="row" style="gap:8px;align-items:baseline">
          <span class="ah-caption c-faint">Hidden from your list, with everything you marked on it kept.</span>
          <button class="plain ah-caption c-sec" onclick={() => app.unhideNeed(need.id)}>Show it again</button>
        </div>
      {:else if need.custom}
        <div class="row" style="gap:8px;align-items:baseline">
          <span class="ah-caption c-faint">A need of your own, under {need.category}.</span>
          <button class="plain ah-caption c-sec" onclick={() => app.confirm('deleteNeed', { needId: need.id })}>Remove it</button>
        </div>
      {/if}
    </div>

    <div class="card sunk" style="padding:16px">
      <div class="col" style="gap:10px">
        <span class="ah-micro-caps c-muted">How it feels today</span>
        <div class="row wrap" style="gap:7px">
          {#each TIERS as t}
            <button class="pill" class:active={tier === t} onclick={() => pick(t)}><span class="dot" style="background:{tierDot(t)}"></span>{tierTitle(t)}</button>
          {/each}
          <div class="grow"></div>
          {#if tier}<button class="plain ah-caption c-faint" onclick={clear}>clear</button>{/if}
        </div>
        <span class="ah-caption c-faint">{rec ? 'changed ' + fmtDate(rec.changed) + (rec.was ? ' · was ' + tierLabel(rec.was) : '') : 'Unexamined. Tap how it feels today.'}</span>
      </div>
    </div>

    <div class="col" style="gap:10px">
      <div class="rule-row"><span class="ah-small-caps c-muted">Who to reach out to</span></div>
      {#each people as p (p.name)}
        <div class="card list p0">
          <div class="row" style="padding:12px 14px 12px 16px;gap:12px">
            <span class="mono sunk" style="width:36px;height:36px;font-size:22px">{p.name.charAt(0)}</span>
            <div class="col grow" style="gap:3px;min-width:0">
              <span class="ah-title-m c-head">{p.name}</span>
              <span class="ah-caption c-sec">{summary(p.cards.length)}</span>
            </div>
            <div class="col" style="gap:5px;flex-shrink:0;align-items:flex-end">
              <span class="ah-micro-caps c-faint">write a card</span>
              <button class="pill outline" onclick={() => app.composeForNeed(need, p.name, router.route.path, 'request')}>Request</button>
              <button class="pill outline" onclick={() => app.composeForNeed(need, p.name, router.route.path, 'gratitude')}>Gratitude</button>
            </div>
          </div>
          {#each p.cards as c (c.id)}
            <CardRow card={c} compact />
          {/each}
        </div>
      {/each}
      {#if addable.length}
        <div class="row wrap" style="gap:7px;padding:2px 4px">
          <span class="ah-caption c-muted">+ someone</span>
          {#each addable as p (p.id)}
            <button class="pill outline" onclick={() => app.addNeedPerson(need.id, p.name)}>{p.name}</button>
          {/each}
        </div>
      {/if}
      {#if people.length}
        <div class="ah-caption c-faint" style="padding:0 4px">A person with no card yet is fine. It is an intention.</div>
      {/if}
    </div>

    <div class="col" style="gap:10px">
      <div class="rule-row"><span class="ah-small-caps c-muted">A private note</span></div>
      <textarea class="note" rows="3" value={app.data.needNotes[need.id] ?? ''} onchange={(e) => app.setNeedNote(need.id, (e.currentTarget as HTMLTextAreaElement).value)} placeholder="Only for you. It never leaves this device."></textarea>
    </div>
  </div>
  {/if}
</div>

<style>
  /* a flex item in a scrolling column, so it must not be squeezed flat by what sits above it */
  .note { flex-shrink: 0; font-family: var(--font-display); font-style: italic; font-size: 15px; line-height: 1.5; color: var(--text-body); background: var(--surface-elevated); border: none; border-radius: 16px; padding: 14px 16px; width: 100%; box-shadow: var(--shadow-sm); resize: none; outline: none; }
  .note::placeholder { color: var(--text-faint); }
</style>
