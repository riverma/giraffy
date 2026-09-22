<script lang="ts">
  // The four colours, named. Shown wherever a need can be marked.
  import { tierDot } from '$lib/core/tiers';
  import Icon from './Icon.svelte';
  let { entangled = false }: { entangled?: boolean } = $props();
  const items: [string, string][] = [[tierDot('met'), 'met'], [tierDot('partly'), 'partly'], [tierDot('unmet'), 'unmet'], [tierDot(null), 'unexamined']];
</script>

<div class="row wrap" style="gap:4px 10px">
  {#each items as [dot, label]}
    <span class="row" style="gap:4px"><span class="sdot" style="background:{dot}"></span><span class="ah-micro-caps c-faint">{label}</span></span>
  {/each}
  {#if entangled}
    <span class="row" style="gap:4px;color:var(--peacock-700)"><Icon name="link" size={11} /><span class="ah-micro-caps c-faint">entangled</span></span>
  {/if}
</div>
