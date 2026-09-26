<script lang="ts">
  // One person (spec §5.12): the needs you have named together and the cards between you.
  import { app } from '$lib/store/app.svelte';
  import { router } from '$lib/store/router.svelte';
  import { S } from '$lib/strings';
  import { cardsWithPerson, draftsWithPerson, linksWith, needsWithPerson, personSummary } from '$lib/core/people';
  import { SELF_ID } from '$lib/core/types';
  import { tierDot } from '$lib/core/tiers';
  import Icon from '$lib/ui/Icon.svelte';
  import CardRow from '$lib/ui/CardRow.svelte';

  let { id }: { id: string } = $props();
  const p = $derived(app.data.people.find((x) => x.id === id));
  const cards = $derived(p ? cardsWithPerson(p.name, app.data.cards, app.owner) : []);
  const drafts = $derived(p ? draftsWithPerson(p.name, app.data.cards, app.owner) : []);
  const needs = $derived(p ? needsWithPerson(p, [...app.vocab.byId.values()], app.data.cards, app.data.needPeople, app.data.people, app.data.owner) : []);
  const links = $derived(p ? linksWith(p.name, app.data.cards, app.owner) : 0);
  $effect(() => { if (app.ready && !p) router.back('/people'); });
</script>

{#if p}
  <div class="screen over">
    <div class="hdr">
      <button class="back" onclick={() => router.back('/people')} aria-label="Back">←</button>
      <span class="ah-small-caps c-muted grow">person</span>
      {#if p.id !== SELF_ID}
        <div class="row" style="gap:8px">
          <button class="pill outline" onclick={() => app.openAddPerson(p.id)}>Rename</button>
          <button class="pill outline" onclick={() => app.confirm('deletePerson', { personId: p.id })}>Remove</button>
        </div>
      {/if}
    </div>
    <div class="scroll" style="padding-top:8px;gap:16px">
      <div class="col" style="align-items:center;gap:10px;padding:8px 0 4px">
        <span class="mono" style="width:64px;height:64px;font-size:40px">{p.name.charAt(0)}</span>
        <span class="ah-heading-m c-head">{p.name}</span>
        <span class="ah-caption c-sec">{personSummary(p.name, app.data.cards, app.owner)}</span>
        <div><button class="pill outline" onclick={() => app.startGuess(p.name, 'request', '/person/' + p.id)}>{S.guess.title}</button></div>
        {#if links}
          <span class="row" title="entangled needs" style="color:var(--peacock-700);gap:5px;padding:4px 10px;border-radius:999px;background:var(--surface-sunk)"><Icon name="link" size={13} /><span class="ah-micro-caps">{links} {links === 1 ? 'entangled need' : 'entangled needs'}</span></span>
        {/if}
      </div>
      {#if needs.length}
        <span class="caps rule">Needs you've named together</span>
        <div class="row wrap" style="gap:7px">
          {#each needs as n (n.id)}
            <button class="pill" onclick={() => router.go('/need/' + n.id)}><span class="dot" style="background:{tierDot(app.tierOf(n.id))}"></span>{n.word}</button>
          {/each}
        </div>
      {/if}
      {#if drafts.length}
        <span class="caps rule">Drafts · {drafts.length}</span>
        <span class="ah-caption c-faint">Not sent yet. Tap one to carry on.</span>
        {#each drafts as c (c.id)}
          <div class="card list p0"><CardRow card={c} compact /></div>
        {/each}
      {/if}
      <span class="caps rule">Cards together</span>
      {#if cards.length}
        {#each cards as c (c.id)}
          <div class="card list p0"><CardRow card={c} compact /></div>
        {/each}
      {:else}
        <span class="ah-caption c-faint">Nothing finished with them yet.</span>
      {/if}
    </div>
  </div>
{/if}
