<script lang="ts">
  import { router, TAB_ROOTS } from '$lib/store/router.svelte';
  import { app } from '$lib/store/app.svelte';
  import { S } from '$lib/strings';
  const tabs: [string, string][] = [['needs', S.tabs.needs], ['cards', S.tabs.cards]];
  const tabs2: [string, string][] = [['people', S.tabs.people], ['settings', S.tabs.settings]];

  let bar = $state<HTMLElement | null>(null);

  /**
   * Every list reserves room at its foot for this bar. Reserving a guessed number leaves the
   * last row of a short list sitting under the bar with no scrolling left to lift it clear,
   * which is how the needs list read as unscrollable with every area collapsed. So the bar
   * measures itself: the space reserved is always taller than the bar is, whatever the safe
   * area, the text size, or the device turns out to be.
   */
  $effect(() => {
    const frame = document.getElementById('app');
    const el = bar;
    if (!el || !frame) return;
    const set = (): void => {
      const covered = frame.getBoundingClientRect().bottom - el.getBoundingClientRect().top;
      frame.style.setProperty('--tab-pad', Math.round(covered + 24) + 'px');
    };
    set();
    // the border box, not the content box: the bar's padding carries the safe area, and a
    // change there is exactly the change that matters here
    const ro = new ResizeObserver(set);
    ro.observe(el, { box: 'border-box' });
    window.addEventListener('resize', set);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', set);
      frame.style.removeProperty('--tab-pad');
    };
  });
</script>

<nav class="tabbar" bind:this={bar} aria-label="Sections">
  {#each tabs as [id, label]}
    <button class="tab" class:on={router.tab === id} onclick={() => router.root(TAB_ROOTS[id])}><i></i><span class="ah-micro-caps">{label}</span></button>
  {/each}
  <button class="fab" onclick={() => app.open({ kind: 'new' })} aria-label={S.tabs.new}><span>+</span></button>
  {#each tabs2 as [id, label]}
    <button class="tab" class:on={router.tab === id} onclick={() => router.root(TAB_ROOTS[id])}><i></i><span class="ah-micro-caps">{label}</span></button>
  {/each}
</nav>
