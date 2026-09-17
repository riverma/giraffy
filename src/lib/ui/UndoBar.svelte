<script lang="ts">
  // Undo, redo, and the session history count (spec §5.14). Sits in every list header.
  import { app } from '$lib/store/app.svelte';
  import Icon from './Icon.svelte';
  import { S } from '$lib/strings';
  let { size = 19 }: { size?: number } = $props();
</script>

<div class="row" style="gap:8px">
  <button class="iconbtn" class:off={!app.history.length} onclick={() => app.undo()} aria-label={S.common.undo}>
    <Icon name="undo" {size} /><span>{S.common.undo}</span>
  </button>
  <button class="iconbtn" class:off={!app.redoStack.length} onclick={() => app.redo()} aria-label={S.common.redo}>
    <Icon name="redo" {size} /><span>{S.common.redo}</span>
  </button>
  {#if app.history.length}
    <button class="iconbtn count" onclick={() => app.open({ kind: 'history' })} aria-label={S.common.history}>
      <Icon name="history" size={size - 2} /><span>{app.history.length}</span>
    </button>
  {/if}
</div>
