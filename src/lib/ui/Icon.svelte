<script lang="ts">
  // A few quiet glyphs, stroked in the current colour. No icon font, no CDN.
  let { name, size = 18 }: { name: 'undo' | 'redo' | 'history' | 'sort' | 'link' | 'card' | 'heart' | 'check'; size?: number } = $props();
</script>

{#if name === 'heart'}
  <svg viewBox="0 0 24 24" width={size} height={size} fill="var(--clay-500)" aria-label="love" style="flex-shrink:0;margin-top:-1px"><path d="M12 21s-7.5-4.6-9.6-9.2C.9 8.4 3 5 6.4 5c2 0 3.4 1 4.6 2.6C12.2 6 13.6 5 15.6 5 19 5 21.1 8.4 19.6 11.8 17.5 16.4 12 21 12 21z"/></svg>
{:else if name === 'sort'}
  <svg viewBox="0 0 16 16" width={size} height={size} fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 2.5v11M2.5 10.5l2.5 3 2.5-3M11 13.5v-11M8.5 5.5l2.5-3 2.5 3"/></svg>
{:else}
  <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    {#if name === 'undo'}
      <path d="M9 14 4 9l5-5"/><path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H9"/>
    {:else if name === 'redo'}
      <path d="m15 14 5-5-5-5"/><path d="M20 9H9.5a5.5 5.5 0 0 0 0 11H15"/>
    {:else if name === 'history'}
      <path d="M5 22h14"/><path d="M5 2h14"/><path d="M17 22v-4.17a2 2 0 0 0-.59-1.41L12 12l-4.41 4.42A2 2 0 0 0 7 17.83V22"/><path d="M7 2v4.17a2 2 0 0 0 .59 1.41L12 12l4.41-4.42A2 2 0 0 0 17 6.17V2"/>
    {:else if name === 'link'}
      <path d="M9 17H7A5 5 0 0 1 7 7h2"/><path d="M15 7h2a5 5 0 1 1 0 10h-2"/><path d="M8 12h8"/>
    {:else if name === 'card'}
      <rect x="5" y="3" width="14" height="18" rx="2"/><path d="M9 8h6M9 12h6M9 16h3"/>
    {:else if name === 'check'}
      <path d="m4.5 12.5 5 5 10-11"/>
    {/if}
  </svg>
{/if}
