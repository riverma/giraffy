<script lang="ts">
  let { count, active, onselect, tone }: { count: number; active: number; onselect?: (i: number) => void; tone?: string } = $props();
</script>

<div class="dots" class:tap={!!onselect} style={tone ? '--dot:' + tone : ''}>
  {#each Array(count) as _, i}
    <span class:on={i === active} style={tone ? 'background:' + tone : ''} onclick={() => onselect?.(i)} role={onselect ? 'button' : undefined}></span>
  {/each}
</div>
