<script lang="ts">
  // Every sheet in one place (spec §5.17). One at a time, always dismissible.
  import { app } from '$lib/store/app.svelte';
  import { router } from '$lib/store/router.svelte';
  import { cardPerson, isGuess, statusLabel } from '$lib/core/cards';
  import { SELF_NAME } from '$lib/core/types';
  import { filterGroups, SORTS } from '$lib/core/sorts';
  import { draftLabel } from '$lib/core/drafts';
  import { fmtDate, fmtTime } from '$lib/core/time';
  import { areaProblem, vocabProblem } from '$lib/data/vocab';
  import { S } from '$lib/strings';
  import { canShareFiles, copyText, download, saveFile, shareFile } from '$lib/share';
  import Sheet from '$lib/ui/Sheet.svelte';

  const sheet = $derived(app.sheet);
  const card = $derived(app.card(sheet?.cardId));
  const close = () => app.closeSheet();

  // share: the file and the clipboard both carry the card alone, so the app at the other
  // end can read either one. The note, if there is one, rides beside the file.
  const shareBody = $derived(card ? app.shareBody(card) : '');
  const shareName = $derived(card ? app.shareFilename(card) : '');
  const shareNote = $derived(app.shareNote());
  async function doShare(): Promise<void> {
    if (!card) return;
    const ok = await shareFile(shareName, shareBody, 'A Giraffy card', shareNote);
    if (ok) { close(); app.toast(S.share.shared); return; }
    // no share sheet here: the card goes to the clipboard instead, so nothing is lost
    const copied = await copyText(shareBody);
    if (copied) app.toast(S.share.shareFailed);
  }
  async function copyShare(): Promise<void> {
    if (await copyText(shareBody)) app.toast(S.share.copied);
  }
  async function saveShare(): Promise<void> {
    if (await saveFile(shareName, shareBody)) app.toast(S.share.saved);
  }
  async function copyNote(): Promise<void> {
    if (await copyText(shareNote)) app.toast(S.share.noteCopied);
  }

  // confirm
  const felt = $derived(Object.keys(app.data.catTiers).length);
  const person = $derived(app.data.people.find((p) => p.id === sheet?.personId));
  const confirmNeed = $derived(app.needOf(sheet?.needId));
  const confirmDef = $derived.by(() => {
    const k = sheet?.confirm;
    if (!k) return null;
    const c = S.confirm[k];
    let title = typeof c.title === 'string' ? c.title : '';
    let body = '';
    if (k === 'revert') {
      const i = sheet.historyIndex ?? 0;
      const h = app.history[i];
      body = h ? S.confirm.revert.body(h.label, i + 1, fmtTime(h.at), app.history.length - i) : '';
    } else if (k === 'delete') body = S.confirm.delete.body(!!card?.mine, card?.from ?? '');
    else if (k === 'withdraw') body = S.confirm.withdraw.body;
    else if (k === 'derived') body = S.confirm.derived.body(felt);
    else if (k === 'leaveSetup') body = S.confirm.leaveSetup.body(confirmNeed?.word ?? 'this need');
    else if (k === 'shareUnanswered') body = S.confirm.shareUnanswered.body(card?.kind ?? 'request', card?.from ?? '');
    else if (k === 'restore') body = S.confirm.restore.body;
    else if (k === 'discardDraft') body = S.confirm.discardDraft.body;
    else if (k === 'deletePerson') {
      const name = person?.name ?? 'them';
      title = S.confirm.deletePerson.title(name);
      body = S.confirm.deletePerson.body(app.data.cards.filter((c2) => cardPerson(c2, app.owner) === name && c2.status !== 'draft').length);
    } else if (k === 'deleteNeed') {
      title = S.confirm.deleteNeed.title(confirmNeed?.word ?? 'this need');
      body = S.confirm.deleteNeed.body;
    } else if (k === 'hideNeed') {
      title = S.confirm.hideNeed.title(confirmNeed?.word ?? 'this need');
      body = S.confirm.hideNeed.body;
    } else if (k === 'deleteArea') {
      const name = sheet.areaName ?? 'this area';
      title = S.confirm.deleteArea.title(name);
      body = S.confirm.deleteArea.body(app.data.customNeeds.filter((n) => n.area === name).length);
    }
    return { title, proceed: c.proceed, cancel: c.cancel, body };
  });

  function confirmProceed(): void {
    const k = sheet?.confirm;
    if (!k || !sheet) return;
    if (k === 'revert') app.revertTo(sheet.historyIndex ?? 0);
    else if (k === 'shareUnanswered') app.sheet = { kind: 'share', cardId: sheet.cardId };
    else if (k === 'leaveSetup') {
      const n = app.needOf(sheet.needId);
      app.sheet = null;
      if (n) app.composeForNeed(n, null, '/needs');
    } else if (k === 'derived') app.applyDerivedMethod(sheet.method ?? 'majority');
    else if (k === 'withdraw' && sheet.cardId) app.withdraw(sheet.cardId);
    else if (k === 'delete' && sheet.cardId) app.deleteCard(sheet.cardId);
    else if (k === 'deletePerson' && sheet.personId) app.removePerson(sheet.personId);
    else if (k === 'deleteNeed' && sheet.needId) app.removeCustomNeed(sheet.needId);
    else if (k === 'hideNeed' && sheet.needId) app.hideNeed(sheet.needId);
    else if (k === 'deleteArea' && sheet.areaName) app.removeCustomArea(sheet.areaName);
    else if (k === 'discardDraft' && sheet.cardId) app.discardDraft(sheet.cardId);
    else if (k === 'restore') {
      const ir = app.importResult;
      if (ir?.type === 'backup') app.restore(ir.backup);
    }
  }
  function confirmCancel(): void {
    if (sheet?.confirm === 'revert') app.open({ kind: 'history' });
    else close();
  }

  // the add sheets: say what is wrong before the button is pressed, never after
  const needProblem = $derived(app.nameVal.trim() ? vocabProblem(app.vocab, app.nameVal, app.areaVal) : null);
  const areaTrouble = $derived(app.nameVal.trim() ? areaProblem(app.vocab, app.nameVal) : null);
  function submitPerson(): void {
    if (sheet?.personId) app.renamePerson(sheet.personId, app.nameVal);
    else app.addPerson(app.nameVal);
  }
  function submitNeed(): void {
    if (!needProblem) app.addCustomNeed(app.nameVal, app.areaVal, app.meaningVal);
  }
  function submitArea(): void {
    if (!areaTrouble) app.addCustomArea(app.nameVal);
  }

  // reassign: everyone already known, with Myself first, and the one it is for marked
  // keyed by name, so a restored file that somehow holds the same name twice cannot break the sheet
  const reassignNames = $derived([...new Set(app.data.people.map((p) => p.name))]);
  const reassignCurrent = $derived(card ? (card.to === app.owner ? SELF_NAME : card.to) : '');

  // picker: my cards that could carry the entangled need
  const pickerRows = $derived(card ? app.mine.filter((c) => c.id !== card.id && !c.links.some((l) => l.id === card.id)) : []);

  // erase
  const eraseStep = $derived(sheet?.eraseStep ?? 1);
</script>

{#if sheet?.kind === 'share' && card}
  <Sheet title="Share this card" onclose={close}>
    <div class="col" style="gap:12px;padding-bottom:8px">
      <div class="ah-caption c-sec">One card, one file. Delivery happens in whichever app you choose. Giraffy's part is already done, network or no network.</div>
      <div class="yaml"><pre>{shareBody}</pre></div>
      <span class="ah-micro-caps c-muted">{shareName}</span>
      <div class="row wrap" style="gap:8px">
        {#if canShareFiles()}
          <button class="btn sm" onclick={doShare}>Send the file</button>
        {/if}
        <button class="btn sm" class:ghost={canShareFiles()} onclick={saveShare}>Save the file</button>
        <button class="btn ghost sm" onclick={copyShare}>Copy as text</button>
      </div>
      <span class="ah-caption c-muted">{S.share.exactly}</span>
      {#if shareNote}
        <div class="col hairline" style="gap:8px;padding-top:12px">
          <span class="ah-micro-caps c-muted">A note to send with it</span>
          <span class="ah-caption c-muted" style="font-style:italic">{shareNote}</span>
          <div><button class="btn ghost sm" onclick={copyNote}>Copy the note</button></div>
        </div>
      {/if}
    </div>
  </Sheet>

{:else if sheet?.kind === 'heard' && card}
  <Sheet title="Heard, sitting with it" onclose={close}>
    <div class="col" style="gap:12px;padding-bottom:8px">
      <div class="ah-caption c-sec">Before any answer, reflect back what you heard. This commits you to nothing. The card simply knows it has been held.</div>
      <textarea class="ta" rows="4" bind:value={app.heardVal}></textarea>
      <div class="row" style="gap:8px">
        <button class="btn sm" onclick={() => app.sendHeard(card.id, app.heardVal)}>Send the reflection</button>
        <button class="btn ghost sm" onclick={() => app.sendHeard(card.id)}>Without words</button>
      </div>
    </div>
  </Sheet>

{:else if sheet?.kind === 'no' && card}
  <Sheet title="I cannot" onclose={close}>
    <div class="col" style="gap:12px;padding-bottom:8px">
      <p class="quote md bordered">In NVC, every no is a yes to something else.</p>
      <div class="ah-caption c-sec">If you'd like, share the need that keeps you from a yes. An honest no, with its need visible, is a complete and respected answer.</div>
      <textarea class="ta" rows="3" bind:value={app.noVal} placeholder="Saying yes would set aside my need for…"></textarea>
      <div class="row" style="gap:8px">
        <button class="btn sm" onclick={() => app.sendNo(card.id, app.noVal)}>Send</button>
        <button class="btn ghost sm" onclick={() => app.sendNo(card.id)}>Without words</button>
      </div>
    </div>
  </Sheet>

{:else if sheet?.kind === 'explore' && card}
  <Sheet title="Let's explore" onclose={close}>
    <div class="col" style="gap:12px;padding-bottom:8px">
      <div class="ah-caption c-sec">A need of yours is tangled up in this request. Surface it, so the two of you can find a strategy that meets everyone's needs.</div>
      <button class="card sunk tap opt" onclick={() => app.startCompose('request', card.from, card.id, router.route.path)}>
        <span class="ah-title-m c-head">Compose a new card</span>
        <span class="ah-caption c-sec">The composer opens pre-linked to this one.</span>
      </button>
      <button class="card sunk tap opt" onclick={() => app.open({ kind: 'picker', cardId: card.id })}>
        <span class="ah-title-m c-head">Link one of my cards</span>
        <span class="ah-caption c-sec">Perhaps you processed this very need already.</span>
      </button>
    </div>
  </Sheet>

{:else if sheet?.kind === 'picker' && card}
  <Sheet title="Link one of my cards" onclose={close}>
    <div class="col scrolly" style="gap:9px;padding-bottom:8px;max-height:340px">
      {#each pickerRows as c (c.id)}
        <button class="card sunk tap opt" onclick={() => app.linkExisting(c.id, card.id)}>
          <span class="ah-small-caps c-muted">your card · {statusLabel(c)}</span>
          <span class="ah-caption c-body clamp2">{c.summary}</span>
        </button>
      {:else}
        <div class="ah-caption c-muted">No other card of yours to link yet.</div>
      {/each}
    </div>
  </Sheet>

{:else if sheet?.kind === 'reassign' && card}
  <Sheet title={S.cardTo.title} onclose={close}>
    <div class="col" style="gap:12px;padding-bottom:8px">
      <span class="ah-caption c-muted">{S.cardTo.lead}</span>
      {#if card.status === 'shared'}
        <span class="ah-caption c-sec">{S.cardTo.shared(card.to)}</span>
      {/if}
      <div class="row wrap" style="gap:7px">
        {#each reassignNames as name (name)}
          <button class="pill outline" class:active={name === reassignCurrent} onclick={() => app.reassignCard(card.id, name)}>{name}</button>
        {/each}
      </div>
      <label class="field"><span class="lbl">{S.cardTo.someoneElse}</span>
        <input bind:value={app.nameVal} autocomplete="off" placeholder="A name" onkeydown={(e) => e.key === 'Enter' && app.reassignCard(card.id, app.nameVal)} />
      </label>
      <div class="row" style="gap:8px">
        <button class="btn sm" disabled={!app.nameVal.trim()} onclick={() => app.reassignCard(card.id, app.nameVal)}>Change it</button>
        <button class="btn ghost sm" onclick={close}>Not now</button>
      </div>
    </div>
  </Sheet>

{:else if sheet?.kind === 'new'}
  <Sheet title="What would you like to do?" onclose={close}>
    <div class="col scrolly" style="gap:10px;padding-bottom:8px;max-height:460px">
      {#if app.drafts.length}
        <div class="col" style="gap:6px">
          <span class="ah-micro-caps c-muted">Drafts · {app.drafts.length}</span>
          {#each app.drafts.slice(0, 3) as d (d.id)}
            <button class="plain draftrow" onclick={() => app.resumeDraft(d.id)}>
              <span class="ah-body c-head ellipsis grow">{draftLabel(d)}</span>
              {#if isGuess(d, app.owner)}<span class="ah-micro-caps c-faint" style="flex-shrink:0">{S.guess.asName(d.from)}</span>{/if}
              <span class="ah-caption c-faint" style="flex-shrink:0">{fmtDate(d.updated)}</span>
            </button>
          {/each}
          {#if app.drafts.length > 3}
            <button class="plain ah-caption c-sec" style="text-align:left;padding:2px" onclick={() => { close(); router.root('/cards'); app.pickFilter('s:draft'); }}>See all {app.drafts.length} drafts ›</button>
          {/if}
        </div>
      {/if}
      <button class="card tap opt" onclick={() => app.startCompose('request')}>
        <span class="ah-title-m c-head">Write a new card</span>
        <span class="ah-caption c-sec">Put one moment into words, for someone or for yourself.</span>
      </button>
      <button class="card sunk tap opt" onclick={() => app.startGuess()}>
        <span class="ah-title-m c-head">{S.guess.title}</span>
        <span class="ah-caption c-sec">{S.guess.lead}</span>
      </button>
      <button class="card sunk tap opt" onclick={() => app.openAddPerson()}>
        <span class="ah-title-m c-head">Add a person</span>
        <span class="ah-caption c-sec">Someone your cards are with, before there is a card.</span>
      </button>
      <button class="card sunk tap opt" onclick={() => app.openAddNeed()}>
        <span class="ah-title-m c-head">Add a need</span>
        <span class="ah-caption c-sec">A word of your own, filed under an area of your choosing.</span>
      </button>
      <button class="card sunk tap opt" onclick={() => { close(); router.go('/import'); }}>
        <span class="ah-title-m c-head">Import a card</span>
        <span class="ah-caption c-sec">Paste a card someone sent you, or open a .gnvc.yaml file.</span>
      </button>
    </div>
  </Sheet>

{:else if sheet?.kind === 'addPerson'}
  <Sheet title={sheet.personId ? 'Rename' : 'Add a person'} onclose={close}>
    <div class="col" style="gap:12px;padding-bottom:8px">
      <label class="field"><span class="lbl">their name</span>
        <!-- svelte-ignore a11y_autofocus -->
        <input bind:value={app.nameVal} autocomplete="off" autofocus placeholder="A name" onkeydown={(e) => e.key === 'Enter' && submitPerson()} />
      </label>
      <span class="ah-caption c-muted">A display name is all Giraffy keeps. No contact details, ever. Renaming later renames them on their cards too.</span>
      <div class="row" style="gap:8px">
        <button class="btn sm" onclick={submitPerson}>{sheet.personId ? 'Rename them' : 'Add them'}</button>
        <button class="btn ghost sm" onclick={close}>Not now</button>
      </div>
    </div>
  </Sheet>

{:else if sheet?.kind === 'addNeed'}
  <Sheet title="Add a need" onclose={close}>
    <div class="col" style="gap:12px;padding-bottom:8px">
      <label class="field"><span class="lbl">the need, in a word or two</span>
        <!-- svelte-ignore a11y_autofocus -->
        <input bind:value={app.nameVal} autocomplete="off" autofocus placeholder="being consulted" onkeydown={(e) => e.key === 'Enter' && submitNeed()} />
      </label>
      <div class="col" style="gap:7px">
        <span class="ah-micro-caps c-muted">under which area</span>
        <div class="row wrap" style="gap:7px">
          {#each app.vocab.areas as a (a.name)}
            <button class="pill outline" class:active={app.areaVal === a.name} onclick={() => (app.areaVal = a.name)}>{a.name}</button>
          {/each}
        </div>
      </div>
      <label class="field"><span class="lbl">what it means to you, if you like</span>
        <input bind:value={app.meaningVal} autocomplete="off" placeholder="asked before it is settled" onkeydown={(e) => e.key === 'Enter' && submitNeed()} />
      </label>
      {#if needProblem}
        <span class="ah-caption" style="color:var(--clay-600)">{needProblem}</span>
      {:else}
        <span class="ah-caption c-muted">It sits with the shipped needs under that area, and can be marked, noted and written about like any other. The same word may sit under more than one area.</span>
      {/if}
      <div class="row" style="gap:8px">
        <button class="btn sm" disabled={!!needProblem} onclick={submitNeed}>Add it</button>
        <button class="btn ghost sm" onclick={close}>Not now</button>
      </div>
    </div>
  </Sheet>

{:else if sheet?.kind === 'addArea'}
  <Sheet title="Add an area" onclose={close}>
    <div class="col" style="gap:12px;padding-bottom:8px">
      <label class="field"><span class="lbl">the area's name</span>
        <!-- svelte-ignore a11y_autofocus -->
        <input bind:value={app.nameVal} autocomplete="off" autofocus placeholder="Work" onkeydown={(e) => e.key === 'Enter' && submitArea()} />
      </label>
      {#if areaTrouble}
        <span class="ah-caption" style="color:var(--clay-600)">{areaTrouble}</span>
      {:else}
        <span class="ah-caption c-muted">Your own areas sit after the seven, and take a colour from the needs inside them like the others do.</span>
      {/if}
      <div class="row" style="gap:8px">
        <button class="btn sm" disabled={!!areaTrouble} onclick={submitArea}>Add it</button>
        <button class="btn ghost sm" onclick={close}>Not now</button>
      </div>
    </div>
  </Sheet>

{:else if sheet?.kind === 'filters'}
  <Sheet title="Filter cards" onclose={close}>
    <div class="col scrolly" style="gap:16px;padding-bottom:8px;max-height:440px">
      <div class="ah-caption c-sec">One filter at a time. Tap it again, or All, to see every card.</div>
      {#each filterGroups(app.data.cards, app.data.people, app.owner) as g (g.name)}
        <div class="col" style="gap:8px">
          <span class="ah-micro-caps c-muted">{g.name}</span>
          <div class="row wrap" style="gap:7px">
            {#each g.items as f (f.id)}
              <button class="pill outline" class:active={app.data.filter === f.id} onclick={() => { app.pickFilter(f.id); close(); }}>
                {#if f.dot}<span class="dot" style="background:{f.dot}"></span>{/if}{f.label} · {f.count}
              </button>
            {/each}
          </div>
        </div>
      {/each}
      {#if app.data.filter !== 'all'}
        <div><button class="btn ghost sm" onclick={() => { app.pickFilter(app.data.filter); close(); }}>Show every card</button></div>
      {/if}
    </div>
  </Sheet>

{:else if sheet?.kind === 'sort'}
  <Sheet title="Sort cards" onclose={close}>
    <div class="col" style="padding-bottom:8px">
      {#each SORTS as o (o.id)}
        <button class="plain srow" onclick={() => { app.setSort(o.id); close(); }}>
          <span class="ring" style="border-color:{app.data.sort === o.id ? 'var(--peacock-700)' : 'var(--border-medium)'};background:{app.data.sort === o.id ? 'var(--peacock-700)' : 'transparent'}"></span>
          <span class="col grow" style="gap:2px;min-width:0">
            <span class="ah-body c-head">{o.label}</span>
            <span class="ah-caption c-muted">{o.hint}</span>
          </span>
        </button>
      {/each}
    </div>
  </Sheet>

{:else if sheet?.kind === 'erase'}
  <Sheet title={eraseStep === 1 ? S.erase.title1 : S.erase.title2} onclose={close}>
    <div class="col" style="gap:14px;padding-bottom:8px">
      <div class="ah-body-serif c-body">{eraseStep === 1 ? S.erase.body1 : S.erase.body2}</div>
      {#if eraseStep === 1}
        <div class="row" style="gap:8px">
          <button class="btn danger" onclick={() => app.open({ kind: 'erase', eraseStep: 2 })}>Continue</button>
          <button class="btn ghost" onclick={close}>Keep my data</button>
        </div>
      {:else}
        <div class="col" style="gap:8px">
          <button class="btn wide" onclick={() => { download(app.backupFilename(), app.backupText()); app.markBackedUp(); app.toast(S.erase.backupSaved); }}>Back up first</button>
          <button class="btn danger wide" onclick={() => app.eraseAll()}>Erase everything</button>
          <button class="btn ghost wide" onclick={close}>Keep my data</button>
        </div>
      {/if}
    </div>
  </Sheet>

{:else if sheet?.kind === 'confirm' && confirmDef}
  <Sheet title={confirmDef.title} onclose={confirmCancel}>
    <div class="col" style="gap:14px;padding-bottom:8px">
      <div class="ah-body-serif c-body">{confirmDef.body}</div>
      <div class="row" style="gap:8px">
        <button class="btn" onclick={confirmProceed}>{confirmDef.proceed}</button>
        <button class="btn ghost" onclick={confirmCancel}>{confirmDef.cancel}</button>
      </div>
    </div>
  </Sheet>

{:else if sheet?.kind === 'history'}
  <Sheet title={S.history.title} onclose={close}>
    <div class="col scrolly" style="gap:8px;padding-bottom:8px;max-height:360px">
      <div class="ah-caption c-sec">{S.history.body}</div>
      {#each app.historyRows() as h (h.index)}
        <button class="card sunk tap hrowbtn" onclick={() => app.confirm('revert', { historyIndex: h.index })}>
          <span class="row" style="gap:8px;min-width:0"><span class="ah-micro-caps c-faint" style="flex-shrink:0">{h.stepNo}</span><span class="ah-title-m c-head ellipsis">{h.label}</span></span>
          <span class="ah-caption c-faint" style="flex-shrink:0">{h.when}</span>
        </button>
      {:else}
        <div class="ah-caption c-muted">{S.history.empty}</div>
      {/each}
    </div>
  </Sheet>
{/if}

<style>
  .yaml { background: var(--surface-inverse); border-radius: 14px; padding: 14px; max-height: 190px; overflow: auto; scrollbar-width: none; }
  .yaml pre { margin: 0; font-family: ui-monospace, monospace; font-size: 10.5px; line-height: 1.55; color: var(--text-inverse); white-space: pre-wrap; word-break: break-word; }
  .ta { font-family: var(--font-display); font-style: italic; font-size: 15px; line-height: 1.5; color: var(--text-body); background: var(--surface-sunk); border: none; border-radius: 14px; padding: 14px; width: 100%; resize: none; outline: none; }
  .ta::placeholder { color: var(--text-faint); }
  .opt { padding: 15px 17px; display: flex; flex-direction: column; gap: 3px; width: 100%; border: none; font: inherit; text-align: left; }
  .scrolly { overflow: auto; scrollbar-width: none; }
  .srow { display: flex; align-items: center; gap: 12px; padding: 11px 2px; border-bottom: 1px solid var(--border-subtle); width: 100%; }
  .ring { width: 16px; height: 16px; border-radius: 99px; border: 1.5px solid; flex-shrink: 0; }
  .draftrow { display: flex; align-items: baseline; justify-content: space-between; gap: 10px; width: 100%; text-align: left; padding: 10px 14px; border-radius: 14px; background: var(--surface-sunk); }
  .hrowbtn { padding: 13px 15px; display: flex; align-items: baseline; justify-content: space-between; gap: 8px; width: 100%; border: none; font: inherit; text-align: left; }
</style>
