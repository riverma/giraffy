<script lang="ts">
  // People (spec §5.12): everyone a card has been with, and Myself.
  import { app } from '$lib/store/app.svelte';
  import { router } from '$lib/store/router.svelte';
  import { linksWith, personSummary } from '$lib/core/people';
  import { SELF_ID } from '$lib/core/types';
  import UndoBar from '$lib/ui/UndoBar.svelte';
  const rows = $derived.by(() => {
    const q = app.peopleQuery.trim().toLowerCase();
    return app.data.people.filter((p) => !q || p.name.toLowerCase().includes(q));
  });
</script>

<div class="ah-screen">
  <div class="ah-hdr" style="justify-content:space-between;padding-bottom:10px">
    <span class="ah-heading-l c-head">People</span>
    <div class="row" style="gap:8px">
      <button class="ah-pill ah-pill--outline ah-hit" onclick={() => app.openAddPerson()}>Add</button>
      <button class="ah-pill ah-pill--outline ah-hit" class:is-active={app.editing} aria-pressed={app.editing} onclick={() => (app.editing = !app.editing)}>Edit</button>
      <UndoBar />
    </div>
  </div>
  <div style="padding:0 var(--gutter) 10px"><label class="ah-field"><input bind:value={app.peopleQuery} placeholder="Search people" autocomplete="off" /></label></div>
  <div class="ah-scroll" style="padding-top:0">
    {#if !rows.length}
      <div style="padding:44px 16px"><p class="ah-quote ah-quote--md c-sec">No one by that name yet. Add them, and their cards can come later.</p></div>
    {/if}
    <div class="ah-list">
    {#each rows as p (p.id)}
      {@const links = linksWith(p.name, app.data.cards, app.owner)}
      <div class="ah-card ah-card--list is-tappable prow">
        <button class="plain stretch row grow" style="gap:13px;min-width:0" onclick={() => router.go('/person/' + p.id)}>
          <span class="ah-mono" style="width:40px;height:40px;font-size:var(--size-2xl)">{p.name.charAt(0)}</span>
          <span class="col grow" style="gap:3px">
            <span class="ah-title-l c-head">{p.name}</span>
            <span class="ah-caption c-sec">{personSummary(p.name, app.data.cards, app.owner)}</span>
          </span>
        </button>
        {#if links}
          <span class="ah-micro-caps c-sec">{links} {links === 1 ? 'entangled need' : 'entangled needs'}</span>
        {/if}
        {#if app.editing && p.id !== SELF_ID}
          <button class="ah-pill ah-pill--outline ah-hit above" onclick={() => app.openAddPerson(p.id)}>Rename</button>
          <button class="ah-pill ah-pill--outline ah-hit above" onclick={() => app.confirm('deletePerson', { personId: p.id })}>Remove</button>
        {:else}
          <span class="ah-caption c-sec" aria-hidden="true">›</span>
        {/if}
      </div>
    {/each}
    </div>
  </div>
</div>

<style>
  .prow { padding: 14px 16px; display: flex; align-items: center; gap: 13px; width: 100%; }
</style>
