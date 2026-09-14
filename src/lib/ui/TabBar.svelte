<script lang="ts">
  import { router, TAB_ROOTS } from '$lib/store/router.svelte';
  import { app } from '$lib/store/app.svelte';
  import { S } from '$lib/strings';
  const tabs: [string, string][] = [['needs', S.tabs.needs], ['cards', S.tabs.cards]];
  const tabs2: [string, string][] = [['people', S.tabs.people], ['settings', S.tabs.settings]];
</script>

<nav class="tabbar" aria-label="Sections">
  {#each tabs as [id, label]}
    <button class="tab" class:on={router.tab === id} onclick={() => router.root(TAB_ROOTS[id])}><i></i><span class="ah-micro-caps">{label}</span></button>
  {/each}
  <button class="fab" onclick={() => app.open({ kind: 'new' })} aria-label={S.tabs.new}><span>+</span></button>
  {#each tabs2 as [id, label]}
    <button class="tab" class:on={router.tab === id} onclick={() => router.root(TAB_ROOTS[id])}><i></i><span class="ah-micro-caps">{label}</span></button>
  {/each}
</nav>
