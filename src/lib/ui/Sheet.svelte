<script lang="ts">
  // Bottom sheet with a grab handle, a dismissible scrim, and a visible close. Never a trap.
  import type { Snippet } from 'svelte';
  import { S } from '$lib/strings';
  let { title, onclose, children }: { title?: string; onclose: () => void; children: Snippet } = $props();
  function key(e: KeyboardEvent) { if (e.key === 'Escape') onclose(); }
</script>

<svelte:window onkeydown={key} />
<div class="scrim" onclick={onclose} role="presentation">
  <!-- clicks inside the sheet must not reach the scrim; the sheet itself is not a control -->
  <div class="sheet" role="dialog" tabindex="-1" aria-modal="true" aria-label={title} onclick={(e) => e.stopPropagation()} onkeydown={(e) => e.stopPropagation()}>
    <div class="grab"></div>
    {#if title}
      <div class="title-row">
        <span class="t">{title}</span>
        <button class="x" onclick={onclose} aria-label={S.common.close}>×</button>
      </div>
    {/if}
    {@render children()}
  </div>
</div>
