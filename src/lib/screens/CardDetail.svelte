<script lang="ts">
  // Card detail (spec §5.8): the card, the ways to respond, its four parts, its history, its threads.
  import { app } from '$lib/store/app.svelte';
  import { router } from '$lib/store/router.svelte';
  import { canCelebrate, canEdit, canGive, canReassign, canRespond, canWithdraw, cardNeedIds, entryLabel, isGuess, otherName, statusDot, statusLabel } from '$lib/core/cards';
  import { S } from '$lib/strings';
  import { threadFor } from '$lib/core/threads';
  import { tierDot } from '$lib/core/tiers';
  import { draftLabel } from '$lib/core/drafts';
  import { fmtDate } from '$lib/core/time';
  import UndoBar from '$lib/ui/UndoBar.svelte';

  let { id }: { id: string } = $props();
  const d = $derived(app.card(id));
  const guessing = $derived(!!d && isGuess(d, app.owner));
  const needIds = $derived(d ? cardNeedIds(d) : []);
  const showShift = $derived(!!d && d.mine && ['given', 'celebrated'].includes(d.status) && needIds.some(Boolean) && !app.shiftDismissed[d.id]);
  const showSuggest = $derived(!!d && ((d.mine && d.kind === 'gratitude' && d.status === 'celebrated') || d.status === 'given') && !app.suggestDismissed[d.id]);

  $effect(() => { if (app.ready && !d) router.back('/cards'); });

  function openNeed(i: number): void {
    const nid = needIds[i];
    if (nid) router.go('/need/' + nid);
    else app.toast('Not linked to your needs yet. Open the need to link it.');
  }
  function shiftOpen(): void {
    if (!d) return;
    const nid = needIds.find(Boolean);
    app.shiftDismissed = { ...app.shiftDismissed, [d.id]: true };
    if (nid) router.go('/need/' + nid);
  }
  function openThread(): void {
    if (!d) return;
    const th = threadFor(app.data.cards, d.id);
    if (th) router.go('/thread/' + th[0]);
  }
</script>

{#if d}
  <div class="screen over">
    <div class="hdr">
      <button class="back" onclick={() => router.back('/cards')} aria-label="Back">←</button>
      <span class="ah-small-caps c-muted grow">{d.kind}{d.mine ? ' · to ' + d.to : ' · from ' + d.from}</span>
      <UndoBar size={18} />
    </div>
    <div class="scroll" style="padding-top:4px;gap:18px">
      <div class="card" style="padding:22px">
        <div class="col" style="gap:14px">
          {#if d.about}<span class="ah-small-caps c-muted">{d.about}</span>{/if}
          <div class="ah-pull-quote c-head">{d.summary || (d.status === 'draft' ? draftLabel(d) : '')}</div>
          <div class="row hairline" style="gap:8px;padding-top:12px">
            <span style="width:8px;height:8px;border-radius:99px;background:{statusDot(d.status)}"></span>
            <span class="ah-micro-caps c-sec">{statusLabel(d)}</span>
          </div>
          {#if guessing}
            <span class="ah-caption c-muted">{S.guess.still(d.from)}</span>
          {/if}
        </div>
      </div>

      {#if canRespond(d)}
        <div class="col" style="gap:9px">
          <div class="rule-row"><span class="ah-small-caps c-muted">Respond from the heart</span></div>
          <button class="card tap resp" onclick={() => app.respondHeard(d)}><span class="ah-title-l c-head">Heard</span><span class="ah-caption c-sec">Sitting with it.</span></button>
          <div class="ah-caption c-faint" style="text-align:center;padding:2px 0">when you are ready</div>
          <button class="card tap resp" onclick={() => app.respondYes(d.id)}><span class="ah-title-l c-head">I'd love to</span><span class="ah-caption c-sec">I want to and I'm able to.</span></button>
          <button class="card tap resp" onclick={() => app.respondExplore(d)}><span class="ah-title-l c-head">Let's explore</span><span class="ah-caption c-sec">Our needs are entangled, so let's explore.</span></button>
          <button class="card tap resp" onclick={() => app.respondNo(d)}><span class="ah-title-l c-head">I cannot</span><span class="ah-caption c-sec">Because this prevents fulfilling my needs.</span></button>
        </div>
      {/if}
      {#if canGive(d)}
        <button class="card tap resp" onclick={() => app.respondGiven(d.id)}><span class="ah-title-l c-head">Given to</span><span class="ah-caption c-sec">I've given towards the request from my heart.</span></button>
      {/if}
      {#if canCelebrate(d)}
        <button class="card tap resp" style="background:var(--gradient-turmeric)" onclick={() => app.respondCelebrated(d.id)}><span class="ah-title-l c-head">Celebrated</span><span class="ah-caption c-head" style="opacity:0.7">Received with joy.</span></button>
      {/if}
      {#if showShift}
        <div class="card sunk" style="padding:16px">
          <div class="col" style="gap:10px">
            <div class="ah-body-serif c-body" style="font-style:italic">Has your need for {d.needs.filter((_, i) => needIds[i]).join(' or ')} shifted?</div>
            <div class="row" style="gap:8px">
              <button class="btn sm" onclick={shiftOpen}>Take a look</button>
              <button class="btn ghost sm" onclick={() => (app.shiftDismissed = { ...app.shiftDismissed, [d.id]: true })}>Not now</button>
            </div>
          </div>
        </div>
      {/if}
      {#if showSuggest}
        <div class="card" style="padding:18px;background:var(--gradient-cream)">
          <div class="col" style="gap:12px">
            <div class="ah-caption c-head">{d.status === 'given' ? 'Would you like to send ' + otherName(d) + ' a gratitude card?' : otherName(d) + ' celebrated this. Another moment worth naming?'}</div>
            <div class="row" style="gap:8px">
              <button class="btn glass sm" onclick={() => app.startCompose('gratitude', otherName(d), null, router.route.path)}>I'd love to</button>
              <button class="btn ghost sm" onclick={() => (app.suggestDismissed = { ...app.suggestDismissed, [d.id]: true })}>Not now</button>
            </div>
          </div>
        </div>
      {/if}

      <div class="rule-row"><span class="ah-small-caps c-muted">In four parts</span></div>
      <div class="card sunk" style="padding:18px;margin-top:-8px">
        <div class="col" style="gap:14px">
          <div class="col" style="gap:8px"><span class="ah-micro-caps c-muted">Observation</span><div class="ah-body-serif c-body">{d.observation}</div></div>
          <div style="border-top:1px solid var(--border-medium)"></div>
          <div class="col" style="gap:9px">
            <span class="ah-micro-caps c-muted">Feelings</span>
            <div class="row wrap" style="gap:7px">{#each d.feelings as w}<span class="pill static">{w}</span>{/each}</div>
          </div>
          <div style="border-top:1px solid var(--border-medium)"></div>
          <div class="col" style="gap:9px">
            <span class="ah-micro-caps c-muted">Needs</span>
            <div class="row wrap" style="gap:7px">
              {#each d.needs as w, i}
                <button class="pill" onclick={() => openNeed(i)}><span class="dot" style="background:{needIds[i] ? tierDot(app.tierOf(needIds[i])) : 'var(--saffron-500)'}"></span>{w}</button>
              {/each}
            </div>
          </div>
          {#if d.requests.length}
            <div style="border-top:1px solid var(--border-medium)"></div>
            <div class="col" style="gap:8px">
              <span class="ah-micro-caps c-muted">Requests</span>
              {#each d.requests as r}<div class="ah-body-serif c-body" style="font-style:italic">{r}</div>{/each}
            </div>
          {/if}
        </div>
      </div>

      <div class="col" style="gap:12px">
        <div class="rule-row"><span class="ah-small-caps c-muted">The history so far</span></div>
        <div class="col">
          {#each d.history as h, i}
            <div class="row" style="align-items:stretch;gap:12px">
              <div class="col" style="align-items:center;width:10px;flex-shrink:0">
                <span style="width:9px;height:9px;border-radius:99px;background:{statusDot(h.state)};margin-top:5px;flex-shrink:0"></span>
                {#if i < d.history.length - 1}<span style="width:1px;flex:1;background:var(--border-medium);min-height:14px"></span>{/if}
              </div>
              <div class="col grow" style="padding-bottom:14px;gap:3px">
                <div class="row" style="justify-content:space-between;align-items:baseline;gap:8px">
                  <span class="ah-label c-head">{entryLabel(h)}</span>
                  <span class="ah-caption c-faint">{fmtDate(h.at)}</span>
                </div>
                {#if h.note}<div class="ah-caption c-sec">{h.note}</div>{/if}
              </div>
            </div>
          {/each}
        </div>
      </div>

      {#if d.links.length}
        <div class="col" style="gap:10px">
          <div class="rule-row"><span class="ah-small-caps c-muted">Entangled with</span></div>
          {#each d.links as lk}
            {@const t = app.card(lk.id)}
            {#if t}
              <button class="card sunk tap plain-card" onclick={() => router.go('/card/' + t.id)}>
                <span class="ah-small-caps c-muted">{t.mine ? 'your card' : t.from + "'s card"} · {t.kind}</span>
                <span class="ah-caption c-body clamp2">{t.summary}</span>
              </button>
            {:else}
              <div class="card sunk plain-card">
                <span class="ah-small-caps c-muted">a card you have not received yet</span>
                <span class="ah-caption c-body">Its lineage will apply when it arrives.</span>
              </div>
            {/if}
          {/each}
          <div><button class="pill outline" onclick={openThread}>View the thread ›</button></div>
        </div>
      {/if}

      <div class="row wrap" style="gap:8px;padding-top:4px">
        {#if d.status === 'draft'}
          {#if guessing}
            <button class="btn" onclick={() => app.openShare(d)}>{S.guess.send(d.from)}</button>
            <button class="btn ghost" onclick={() => app.resumeDraft(d.id)}>Continue writing</button>
          {:else}
            <button class="btn" onclick={() => app.resumeDraft(d.id)}>Continue writing</button>
          {/if}
          <button class="btn ghost" onclick={() => app.confirm('discardDraft', { cardId: d.id })}>Discard</button>
        {:else}
          <button class="btn" onclick={() => app.openShare(d)}>Share</button>
          {#if canEdit(d)}<button class="btn ghost" onclick={() => app.editCard(d)}>Edit</button>{/if}
          {#if canReassign(d)}<button class="btn ghost" onclick={() => app.openReassign(d)}>Change who it is for</button>{/if}
          {#if canWithdraw(d)}<button class="btn ghost" onclick={() => app.confirm('withdraw', { cardId: d.id })}>Withdraw</button>{/if}
          <button class="btn ghost" onclick={() => app.confirm('delete', { cardId: d.id })}>Delete</button>
        {/if}
      </div>
    </div>
  </div>
{/if}

<style>
  .resp { padding: 15px 18px; display: flex; flex-direction: column; gap: 3px; text-align: left; border: none; font: inherit; width: 100%; }
  .plain-card { padding: 13px 15px; display: flex; flex-direction: column; gap: 4px; text-align: left; border: none; font: inherit; width: 100%; }
</style>
