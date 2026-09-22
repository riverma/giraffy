<script lang="ts">
  // A thread (spec §5.11): the cards that answer each other, as a timeline or a web of needs.
  import { app } from '$lib/store/app.svelte';
  import { router } from '$lib/store/router.svelte';
  import { entryLabel, otherName, statusDot } from '$lib/core/cards';
  import { radialLayout, threadFor } from '$lib/core/threads';
  import { tierDot } from '$lib/core/tiers';
  import { fmtDate } from '$lib/core/time';
  import type { Card, HistoryEntry } from '$lib/core/types';

  let { id }: { id: string } = $props();
  const me = $derived(app.data.owner);
  const chain = $derived(threadFor(app.data.cards, id) ?? (app.card(id) ? [id] : undefined));
  const cards = $derived((chain ?? []).map((cid) => app.card(cid)).filter((c): c is Card => !!c).sort((a, b) => a.created.localeCompare(b.created)));
  const others = $derived([...new Set(cards.map((c) => otherName(c)))].filter((n) => n !== me));
  const theirName = $derived(others[0] ?? 'them');
  const items = $derived.by(() => {
    const out: ({ card: Card } | { event: HistoryEntry })[] = [];
    for (const c of cards) {
      out.push({ card: c });
      for (const h of c.history) if (!['ready', 'shared', 'received'].includes(h.state)) out.push({ event: h });
    }
    return out;
  });
  const myNeeds = $derived([...new Set(cards.filter((c) => c.mine).flatMap((c) => c.needs))]);
  const theirNeeds = $derived([...new Set(cards.filter((c) => !c.mine).flatMap((c) => c.needs))]);
  const radial = $derived(radialLayout(myNeeds, theirNeeds, (nid) => { const t = nid ? app.tierOf(nid) : null; return t ? tierDot(t) : 'var(--saffron-500)'; }, 'var(--peacock-500)', app.vocab.match));
  const requests = $derived(cards.filter((c) => !['given', 'withdrawn', 'no'].includes(c.status)).flatMap((c) => c.requests.map((t) => ({ by: (c.from === me ? 'You' : c.from) + ' asked', t, id: c.id }))));

  $effect(() => { if (app.ready && !cards.length) router.back('/cards'); });
</script>

<div class="screen over">
  <div class="hdr">
    <button class="back" onclick={() => router.back('/cards')} aria-label="Back">←</button>
    <span class="ah-small-caps c-muted grow">you ↔ {others.join(' ↔ ')}</span>
  </div>
  <div style="padding:0 var(--gutter) 12px"><span class="ah-heading-m c-head">{cards.map((c) => c.about).filter(Boolean).join('  ·  ')}</span></div>
  <div class="row" style="padding:0 var(--gutter) 12px;gap:8px">
    <button class="pill" class:active={app.threadMode === 'timeline'} onclick={() => (app.threadMode = 'timeline')}>Timeline</button>
    <button class="pill" class:active={app.threadMode === 'web'} onclick={() => (app.threadMode = 'web')}>Visualize</button>
  </div>
  <div class="scroll" style="padding-top:4px;gap:12px">
    {#if app.threadMode === 'timeline'}
      {#each items as it}
        {#if 'card' in it}
          <button class="card tap tcard" onclick={() => router.go('/card/' + it.card.id)}>
            <div class="row" style="justify-content:space-between;align-items:baseline"><span class="ah-small-caps c-muted">{it.card.from === me ? 'you' : it.card.from} · {it.card.kind}</span><span class="ah-caption c-faint">{fmtDate(it.card.created)}</span></div>
            <span class="ah-body-serif c-body" style="font-style:italic">{it.card.summary}</span>
            <div class="row hairline" style="justify-content:flex-end;padding-top:9px;margin-top:2px"><span class="ah-micro-caps" style="color:var(--saffron-700)">Open the card ›</span></div>
          </button>
        {:else}
          <div class="row" style="gap:10px;align-items:baseline;padding:0 6px">
            <span style="width:8px;height:8px;border-radius:99px;background:{statusDot(it.event.state)};flex-shrink:0"></span>
            <div class="col" style="gap:2px">
              <span class="ah-label c-head">{entryLabel(it.event)}</span>
              {#if it.event.note}<span class="ah-caption c-sec">{it.event.note}</span>{/if}
            </div>
          </div>
        {/if}
      {/each}
    {:else}
      <div class="card" style="padding:10px">
        <div style="position:relative;height:330px">
          {#each radial.lines as l}
            <div style="position:absolute;height:0;border-top:1px dashed var(--border-strong);left:{l.x}px;top:{l.y}px;width:{l.w}px;transform:rotate({l.a}deg);transform-origin:0 50%"></div>
          {/each}
          <div class="centre"><span class="ah-caption c-head">{cards[0]?.about ? cards[0].about.toLowerCase() : 'this thread'}</span></div>
          {#each radial.nodes as n}
            <div style="position:absolute;left:{n.x}px;top:{n.y}px;transform:translate(-50%,-50%);max-width:130px">
              {#if n.needId}
                <button class="pill" onclick={() => router.go('/need/' + n.needId)}><span class="dot" style="background:{n.dot}"></span>{n.label}</button>
              {:else}
                <span class="pill static"><span class="dot" style="background:{n.dot}"></span>{n.label}</span>
              {/if}
            </div>
          {/each}
        </div>
      </div>
      <div class="ah-caption c-faint" style="text-align:center;padding:0 12px">Your needs gather left, {theirName}'s right. Every line meets in the middle, because the strategies do too.</div>
      <div class="col" style="gap:10px">
        <span class="caps rule">Requests on the table</span>
        {#each requests as r}
          <button class="card sunk tap row" style="padding:13px 15px;gap:10px;width:100%;border:none;font:inherit;text-align:left" onclick={() => router.go('/card/' + r.id)}>
            <div class="col grow" style="gap:4px;min-width:0">
              <span class="ah-micro-caps c-muted">{r.by}</span>
              <span class="ah-caption c-body">{r.t}</span>
            </div>
            <span class="ah-micro-caps" style="color:var(--saffron-700);flex-shrink:0">Open ›</span>
          </button>
        {/each}
      </div>
    {/if}
  </div>
</div>

<style>
  .tcard { padding: 16px; display: flex; flex-direction: column; gap: 7px; width: 100%; border: none; font: inherit; text-align: left; }
  .centre { position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%); width: 96px; height: 96px; border-radius: 999px; background: var(--gradient-cream); box-shadow: var(--shadow-md); display: flex; align-items: center; justify-content: center; text-align: center; padding: 10px; }
</style>
