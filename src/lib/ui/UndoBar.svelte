<script lang="ts">
  // Undo, redo, and the session history count (spec §5.14). Sits in every list header.
  import { app } from '$lib/store/app.svelte';
  import { S } from '$lib/strings';
</script>

<div class="row" style="gap:8px">
  <button class="iconbtn" class:off={!app.history.length} disabled={!app.history.length} onclick={() => app.undo()} aria-label={S.common.undo}>
    <span>{S.common.undo}</span>
  </button>
  <button class="iconbtn" class:off={!app.redoStack.length} disabled={!app.redoStack.length} onclick={() => app.redo()} aria-label={S.common.redo}>
    <span>{S.common.redo}</span>
  </button>
  {#if app.history.length}
    <button class="iconbtn count" onclick={() => app.open({ kind: 'history' })} aria-label={S.common.history}>
      <span>{S.common.history} {app.history.length}</span>
    </button>
  {/if}
</div>
