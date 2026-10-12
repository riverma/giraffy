<script lang="ts">
  let { count, active, onselect }: { count: number; active: number; onselect?: (i: number) => void } = $props();
</script>

<div class="ah-dots">
  {#each Array(count) as _, i}
    {#if onselect}
      <button type="button" class:is-on={i === active} aria-label={`Step ${i + 1} of ${count}`} aria-current={i === active ? 'step' : undefined} onclick={() => onselect(i)}></button>
    {:else}
      <span class:is-on={i === active}></span>
    {/if}
  {/each}
</div>
