<script lang="ts">
  // The launcher's `#install` contract and the browser's own install prompt, in one quiet bar.
  import { onMount } from 'svelte';
  import { router } from '$lib/store/router.svelte';
  import { S } from '$lib/strings';

  let deferred: (Event & { prompt: () => Promise<void> }) | null = $state(null);
  let show = $state(false);
  let installed = $state(false);
  const standalone = $derived(typeof window !== 'undefined' && (window.matchMedia('(display-mode: standalone)').matches || (navigator as unknown as { standalone?: boolean }).standalone === true));
  const ios = typeof navigator !== 'undefined' && /iphone|ipad|ipod/i.test(navigator.userAgent);

  onMount(() => {
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      deferred = e as typeof deferred;
      if (router.installRequested) show = true;
    });
    window.addEventListener('appinstalled', () => { installed = true; deferred = null; setTimeout(() => (show = false), 3000); });
  });
  $effect(() => { if (router.installRequested && !standalone) show = true; });

  async function install() {
    if (!deferred) return;
    await deferred.prompt();
    deferred = null;
    show = false;
  }
</script>

{#if show}
  <div class="bar">
    <span class="ah-caption c-head grow">
      {#if installed}{S.install.installed}{:else if deferred}{S.install.prompt}{:else if ios}{S.install.ios}{:else}{S.install.generic}{/if}
    </span>
    {#if deferred && !installed}<button class="btn sm" onclick={install}>{S.install.button}</button>{/if}
    <button class="x" onclick={() => (show = false)} aria-label={S.common.close}>×</button>
  </div>
{/if}

<style>
  .bar { position: absolute; left: 12px; right: 12px; top: calc(var(--safe-top) + 8px); z-index: 45; display: flex; align-items: center; gap: 10px; padding: 10px 12px 10px 16px; border-radius: 18px; background: var(--glass-overlay-strong); backdrop-filter: blur(14px); -webkit-backdrop-filter: blur(14px); box-shadow: var(--shadow-md); }
  .x { border: none; background: var(--surface-sunk); color: var(--text-secondary); width: 28px; height: 28px; border-radius: 99px; cursor: pointer; font-size: 15px; line-height: 1; flex-shrink: 0; }
</style>
