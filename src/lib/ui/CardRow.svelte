<script lang="ts">
  // One card in a list: who, when, what, and where it stands (spec §5.7).
  import type { Card } from '$lib/core/types';
  import { fmtDate } from '$lib/core/time';
  import { kindLine, otherName, statusDot, statusLabel } from '$lib/core/cards';
  import { draftLabel } from '$lib/core/drafts';
  import { app } from '$lib/store/app.svelte';
  import { router } from '$lib/store/router.svelte';
  import Icon from './Icon.svelte';
  import { rowTap } from './tap.js';
  let { card, compact = false, onremove }: { card: Card; compact?: boolean; onremove?: () => void } = $props();
  const dot = $derived(statusDot(card.status));
  const isDraft = $derived(card.status === 'draft');
  // a draft has nowhere else to go: tapping it carries on writing
  function open(): void {
    if (isDraft) app.resumeDraft(card.id);
    else router.go('/card/' + card.id);
  }
  const words = $derived(card.summary || (isDraft ? draftLabel(card) : ''));
</script>

{#if compact}
  <div class="plain col hairline" style="width:100%;padding:10px 16px 12px;gap:5px" role="button" tabindex="0" onclick={open} onkeydown={(e) => e.key === 'Enter' && open()}>
    <div class="row" style="justify-content:space-between;align-items:baseline"><span class="ah-micro-caps c-muted">{kindLine(card)}</span><span class="ah-caption c-faint">{fmtDate(card.updated)}</span></div>
    <span class="ah-body-serif c-body clamp2">{words}</span>
    <div class="row" style="gap:7px;min-width:0"><span class="sdot" style="background:{dot}"></span><span class="ah-micro-caps c-muted ellipsis">{statusLabel(card)}</span></div>
  </div>
{:else}
  <div class="card list p0 tap" role="button" tabindex="0" onclick={rowTap(open)} onkeydown={(e) => e.key === 'Enter' && open()}>
    <div class="col" style="background:color-mix(in srgb, {dot} 14%, var(--surface-elevated));padding:12px 16px 9px;gap:4px">
      <div class="row" style="justify-content:space-between;align-items:baseline;gap:8px">
        <span class="ah-title-m c-head ellipsis">{otherName(card)}</span>
        <span class="ah-caption c-sec" style="flex-shrink:0">{fmtDate(card.updated)}</span>
      </div>
      <span class="ah-micro-caps c-sec">{kindLine(card)}</span>
    </div>
    <div class="col" style="padding:10px 16px 14px;gap:6px;min-width:0">
      <div class="ah-body-serif c-body clamp2">{words}</div>
      <div class="row" style="gap:7px">
        <span class="sdot" style="background:{dot}"></span>
        <span class="ah-micro-caps c-muted ellipsis">{statusLabel(card)}</span>
        <div class="grow"></div>
        {#if card.history.length > 1}
          <span class="c-faint" title="has history" style="display:inline-flex"><Icon name="history" size={13} /></span>
        {/if}
        {#if card.links.length}
          <span class="row" title="entangled" style="color:var(--peacock-700);gap:3px"><Icon name="link" size={13} /><span class="ah-micro-caps">{card.links.length}</span></span>
        {/if}
        {#if onremove}
          <button class="pill outline" onclick={(e) => { e.stopPropagation(); onremove(); }}>{isDraft ? 'Discard' : 'Remove'}</button>
        {/if}
      </div>
    </div>
  </div>
{/if}
