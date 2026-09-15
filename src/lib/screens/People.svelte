<script lang="ts">
  // People (spec §5.12): everyone a card has been with, and Myself.
  import { app } from '$lib/store/app.svelte';
  import { router } from '$lib/store/router.svelte';
  import { linksWith, personSummary } from '$lib/core/people';
  import { SELF_ID } from '$lib/core/types';
  import Icon from '$lib/ui/Icon.svelte';
  import UndoBar from '$lib/ui/UndoBar.svelte';
  import { rowTap } from '$lib/ui/tap.js';
  const rows = $derived.by(() => {
    const q = app.peopleQuery.trim().toLowerCase();
    return app.data.people.filter((p) => !q || p.name.toLowerCase().includes(q));
  });
</script>

<div class="screen">
  <div class="hdr" style="justify-content:space-between;padding-bottom:10px">
    <span class="ah-heading-l c-head">People</span>
    <div class="row" style="gap:8px">
      <button class="pill outline" onclick={() => app.openAddPerson()}>Add</button>
      <button class="pill outline" class:active={app.editing} onclick={() => (app.editing = !app.editing)}>Edit</button>
      <UndoBar />
    </div>
  </div>
  <div style="padding:0 var(--gutter) 10px"><label class="field"><input bind:value={app.peopleQuery} placeholder="Search people" autocomplete="off" /></label></div>
  <div class="scroll" style="padding-top:0">
    {#if !rows.length}
      <div style="padding:44px 16px"><p class="quote md c-muted">No one by that name yet. Add them, and their cards can come later.</p></div>
    {/if}
    <div class="list-grid">
    {#each rows as p (p.id)}
      {@const links = linksWith(p.name, app.data.cards)}
      <div class="card list tap prow" role="button" tabindex="0" onclick={rowTap(() => router.go('/person/' + p.id))} onkeydown={(e) => e.key === 'Enter' && router.go('/person/' + p.id)}>
        <span class="mono" style="width:40px;height:40px;font-size:25px">{p.name.charAt(0)}</span>
        <div class="col grow" style="gap:3px">
          <span class="ah-title-l c-head">{p.name}</span>
          <span class="ah-caption c-sec">{personSummary(p.name, app.data.cards)}</span>
        </div>
        {#if links}
          <span class="row" title="entangled needs" style="color:var(--peacock-700);gap:3px"><Icon name="link" size={13} /><span class="ah-micro-caps">{links}</span></span>
        {/if}
        {#if app.editing && p.id !== SELF_ID}
          <button class="pill outline" onclick={(e) => { e.stopPropagation(); app.openAddPerson(p.id); }}>Rename</button>
          <button class="pill outline" onclick={(e) => { e.stopPropagation(); app.confirm('deletePerson', { personId: p.id }); }}>Remove</button>
        {:else}
          <span class="ah-caption c-faint">›</span>
        {/if}
      </div>
    {/each}
    </div>
  </div>
</div>

<style>
  .prow { padding: 14px 16px; display: flex; align-items: center; gap: 13px; width: 100%; border: none; font: inherit; text-align: left; }
</style>
