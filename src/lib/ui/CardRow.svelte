<script lang="ts">
  // One card in a list: who, when, what, and where it stands (spec §5.7).
  import type { Card } from '$lib/core/types';
  import { fmtDate } from '$lib/core/time';
  import { isGuess, isTheirDraft, kindLine, otherName, statusDot, statusLabel } from '$lib/core/cards';
  import { draftLabel } from '$lib/core/drafts';
  import { app } from '$lib/store/app.svelte';
  import { router } from '$lib/store/router.svelte';
  let { card, compact = false, onremove }: { card: Card; compact?: boolean; onremove?: () => void } = $props();
  const dot = $derived(statusDot(card.status));
  const isDraft = $derived(card.status === 'draft');
  // a plain draft has nowhere else to go, so tapping it carries on writing. A guess has its
  // own screen, because sending it to the person it is about is the point of it.
  function open(): void {
    // a draft of your own goes straight back to writing; one that came from somebody else
    // opens its own screen, where sending it back lives
    if (isDraft && !isGuess(card, app.owner) && !isTheirDraft(card, app.owner)) app.resumeDraft(card.id);
    else router.go('/card/' + card.id);
  }
  const words = $derived(card.summary || (isDraft ? draftLabel(card) : ''));
</script>

{#if compact}
  <div class="col hairline" style="position:relative;width:100%;padding:10px 16px 12px;gap:5px">
    <button class="plain stretch col" style="gap:5px" onclick={open}>
      <span class="row" style="justify-content:space-between;align-items:baseline;width:100%"><span class="ah-micro-caps c-sec">{kindLine(card)}</span><span class="ah-caption c-sec">{fmtDate(card.updated)}</span></span>
      <span class="ah-body-serif c-body clamp2">{words}</span>
      <span class="row" style="gap:7px;min-width:0"><span class="ah-sdot" style="background:{dot}"></span><span class="ah-micro-caps c-sec ellipsis">{statusLabel(card)}</span></span>
    </button>
  </div>
{:else}
  <div class="ah-card ah-card--list ah-card--p0 is-tappable">
    <button class="plain stretch col" style="width:100%;gap:0" onclick={open}>
      <span class="col" style="width:100%;background:color-mix(in srgb, {dot} 14%, var(--surface-elevated));padding:12px 16px 9px;gap:4px">
        <span class="row" style="justify-content:space-between;align-items:baseline;gap:8px">
          <span class="ah-title-m c-head ellipsis">{otherName(card)}</span>
          <span class="ah-caption c-sec" style="flex-shrink:0">{fmtDate(card.updated)}</span>
        </span>
        <span class="ah-micro-caps c-sec">{kindLine(card)}</span>
      </span>
      <span class="col" style="padding:10px 16px 14px;gap:6px;min-width:0">
        <span class="ah-body-serif c-body clamp2">{words}</span>
        <span class="row" style="gap:7px">
          <span class="ah-sdot" style="background:{dot}"></span>
          <span class="ah-micro-caps c-sec ellipsis">{statusLabel(card)}</span>
        </span>
      </span>
    </button>
    {#if card.history.length > 1 || card.links.length || onremove}
      <div class="row" style="gap:8px;padding:0 16px 14px;justify-content:flex-end;margin-top:-6px;position:relative">
        {#if card.history.length > 1}<span class="ah-micro-caps c-sec">has history</span>{/if}
        {#if card.links.length}<span class="ah-micro-caps c-sec">{card.links.length} entangled</span>{/if}
        {#if onremove}
          <button class="ah-pill ah-pill--outline ah-hit above" onclick={onremove}>{isDraft ? 'Discard' : 'Remove'}</button>
        {/if}
      </div>
    {/if}
  </div>
{/if}
