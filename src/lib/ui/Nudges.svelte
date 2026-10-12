<script lang="ts">
  // Coaching nudges (spec §5.10): a word, a reason, an x. Suggestions when there are some.
  import type { Nudge } from '$lib/core/rules';
  import { app } from '$lib/store/app.svelte';
  let { nudges, suggests, onsuggest }: { nudges: Nudge[]; suggests?: Record<string, string[]>; onsuggest?: (w: string) => void } = $props();
  function dismiss(key: string): void { app.dismissed = { ...app.dismissed, [key]: true }; }
</script>

{#each nudges as n (n.key)}
  <div class="nudge">
    <div class="row" style="justify-content:space-between;gap:10px;align-items:baseline">
      <span class="ah-caption c-body"><strong>{n.word}</strong>: {n.msg}</span>
      <button class="plain ah-hit c-sec" style="font-size:var(--size-md);flex-shrink:0;min-width:44px;min-height:44px;text-align:center" onclick={() => dismiss(n.key)} aria-label="Dismiss">×</button>
    </div>
    {#if suggests?.[n.key]?.length}
      <div class="row wrap" style="gap:6px">
        {#each suggests[n.key] as w}<button class="ah-pill ah-pill--outline ah-hit" onclick={() => onsuggest?.(w)}>{w}</button>{/each}
      </div>
    {/if}
  </div>
{/each}
