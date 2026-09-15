<script lang="ts">
  // A new version has finished downloading and is waiting for the old one to let go.
  // Without this, an installed app keeps running the old version until every window of it
  // is closed, which on a phone means knowing to swipe it away first.
  import { app } from '$lib/store/app.svelte';
  import { S } from '$lib/strings';

  let dismissed = $state(false);
  let reloading = $state(false);

  async function reload(): Promise<void> {
    if (reloading) return;
    reloading = true;
    app.flush();
    const reg = await navigator.serviceWorker?.getRegistration();
    // hand over to the waiting version, then come back on it
    reg?.waiting?.postMessage('skip-waiting');
    setTimeout(() => location.reload(), 220);
  }
</script>

{#if app.updateReady && !dismissed}
  <div class="bar">
    <span class="ah-caption c-head grow">{S.update.ready}</span>
    <button class="btn sm" onclick={reload} disabled={reloading}>{reloading ? S.update.updating : S.update.button}</button>
    <button class="x" onclick={() => (dismissed = true)} aria-label={S.common.close}>×</button>
  </div>
{/if}

<style>
  .bar { position: absolute; left: 12px; right: 12px; top: calc(var(--safe-top) + 8px); z-index: 46; display: flex; align-items: center; gap: 10px; padding: 10px 12px 10px 16px; border-radius: 18px; background: var(--glass-overlay-strong); backdrop-filter: blur(14px); -webkit-backdrop-filter: blur(14px); box-shadow: var(--shadow-md); }
  .x { border: none; background: var(--surface-sunk); color: var(--text-secondary); width: 28px; height: 28px; border-radius: 99px; cursor: pointer; font-size: 15px; line-height: 1; flex-shrink: 0; }
</style>
