<script lang="ts">
  // Bringing something in (spec §5.10, §5.15). One screen, two reasons to be here: restoring
  // a whole backup, which is what Settings sends you for, or importing a single card someone
  // sent you. Either way: read the file, show exactly what it would do, then let them decide.
  import { app } from '$lib/store/app.svelte';
  import { router } from '$lib/store/router.svelte';
  import { statusDot, statusLabel, otherName } from '$lib/core/cards';
  import { DERIVED_METHODS } from '$lib/core/tiers';
  import { fmtDate, now } from '$lib/core/time';
  import { sampleEntangledYaml, sampleMergeYaml, sampleNewYaml } from '$lib/data/samples';
  import { readFileText } from '$lib/share';

  let { mode = 'card' }: { mode?: 'card' | 'restore' } = $props();
  const restoring = $derived(mode === 'restore');

  let formatHelp = $state(false);
  let confirmClear = $state(false);
  let fileInput: HTMLInputElement | undefined = $state();

  const ir = $derived(app.importResult);
  const preview = $derived.by(() => {
    if (!ir) return null;
    if (ir.type === 'new') {
      const c = ir.card;
      return { name: c.from, kindLabel: c.kind + ' · from ' + c.from, dateStr: fmtDate(now()), summary: c.summary,
        dot: statusDot('received'), statusLabel: statusLabel({ mine: false, from: c.from, to: app.data.owner, status: 'received' }),
        note: '', noteBy: '' };
    }
    if (ir.type === 'merge') {
      const local = ir.target, added = ir.added[ir.added.length - 1];
      return { name: otherName(local), kindLabel: local.kind + ' · for ' + local.to, dateStr: fmtDate(now()), summary: local.summary,
        dot: statusDot(ir.merged.status), statusLabel: statusLabel(ir.merged),
        note: added?.note ?? '', noteBy: (local.to || 'they') + ' replied' };
    }
    return null;
  });
  const mergeCaption = $derived(ir?.type === 'merge'
    ? 'Same id as your card about ' + (ir.target.about || 'this') + '. The new reply merges into its history. Nothing you wrote is overwritten.'
    : '');
  const entangleNote = $derived.by(() => {
    if (ir?.type !== 'new' || !ir.entangled.length) return '';
    const abouts = ir.entangled.map((id) => app.card(id)?.about).filter(Boolean);
    return 'Entangled with ' + ir.entangled.length + ' of your cards' + (abouts.length ? ': ' + abouts.join(', ') : '') + '. Importing weaves them into one thread.';
  });
  const backupRows = $derived.by(() => {
    if (ir?.type !== 'backup') return [];
    const b = ir.backup;
    const method = DERIVED_METHODS.find((m) => m.id === b.derivedMethod)?.label ?? b.derivedMethod;
    const drafts = b.cards.filter((c) => c.status === 'draft').length;
    const finished = b.cards.length - drafts;
    const rows: [string, string][] = [
      ['cards', plural(finished, 'card') + ', ' + b.cards.filter((c) => c.mine && c.status !== 'draft').length + ' yours' + (drafts ? ', and ' + plural(drafts, 'draft') : '')],
      ['people', String(b.people.length)],
      ['needs', Object.keys(b.needTiers).length + ' examined, ' + Object.keys(b.catTiers).length + ' set by hand, ' + plural(Object.keys(b.needNotes).length, 'note')]
    ];
    if (b.customNeeds.length || b.customAreas.length || b.hiddenNeeds.length) {
      const own: string[] = [];
      if (b.customNeeds.length) own.push(b.customNeeds.length + (b.customNeeds.length === 1 ? ' need' : ' needs') + ' of their own');
      if (b.customAreas.length) own.push(b.customAreas.length + (b.customAreas.length === 1 ? ' area' : ' areas'));
      if (b.hiddenNeeds.length) own.push(b.hiddenNeeds.length + ' hidden');
      rows.push(['your list', own.join(', ')]);
    }
    rows.push(['name', b.owner]);
    rows.push(['settings', 'coaching ' + (b.coaching ? 'on' : 'off') + ', preamble ' + (b.preamble ? 'on' : 'off') + ', areas by ' + method.toLowerCase()]);
    return rows;
  });

  /** What restoring would replace, so the trade is visible before it is made. */
  const hereNow = $derived.by(() => {
    const cards = app.data.cards.filter((c) => c.status !== 'draft').length;
    const drafts = app.data.cards.length - cards;
    const marked = Object.keys(app.data.needTiers).length;
    const bits = [plural(cards, 'card')];
    if (drafts) bits.push(plural(drafts, 'draft'));
    bits.push(plural(app.data.people.length, 'person').replace('persons', 'people'));
    bits.push(plural(marked, 'need') + ' marked');
    return bits.join(', ');
  });

  const plural = (n: number, word: string) => n + ' ' + word + (n === 1 ? '' : 's');

  function setText(v: string): void { app.importVal = v; app.importResult = null; confirmClear = false; }
  async function openFile(e: Event): Promise<void> {
    const f = (e.currentTarget as HTMLInputElement).files?.[0];
    if (!f) return;
    setText(await readFileText(f));
    app.previewImport();
    if (fileInput) fileInput.value = '';
  }
</script>

<div class="screen over">
  <div class="hdr">
    <button class="back" onclick={() => router.back(restoring ? '/settings' : '/cards')} aria-label="Back">←</button>
    <span class="ah-small-caps c-muted">{restoring ? 'restore from a backup' : 'import a card or a backup'}</span>
  </div>
  <div class="scroll" style="padding-top:8px;gap:14px">
    {#if restoring}
      <div class="ah-body-serif c-body">A Giraffy backup is the whole app in one file: every card and draft, your people, your needs and any you added, your notes and your settings. Open the file you saved, and Giraffy shows you what is in it before anything changes.</div>
      <div class="ah-caption c-sec">Nothing leaves this device, and nothing is replaced until you say so.</div>
    {:else}
      <div class="ah-caption c-sec">Paste the text from your chat, or open a .gnvc.yaml file from the share sheet. A Giraffy backup file works here too. Nothing leaves this device.</div>
    {/if}
    <div style="align-self:flex-start">
      <button class="pill outline" class:active={formatHelp} onclick={() => (formatHelp = !formatHelp)}>
        {restoring ? 'What is in a backup?' : 'What’s a gNVC card?'} {formatHelp ? '▾' : '▸'}
      </button>
    </div>
    {#if formatHelp}
      <div class="card sunk" style="padding:16px">
        <div class="col" style="gap:12px">
          {#if restoring}
            <div class="ah-body-serif c-body">A backup is plain text you can read with your own eyes: one header, then one document per card. It is the same gNVC format a single card uses, so nothing about it is locked to this app.</div>
            <div class="col" style="gap:8px">
              {#each [['header', 'your name, your settings, and your people'], ['x-private', 'how each need feels, its notes, and who you named on it'], ['custom-needs', 'the needs and areas you added, and which you hid'], ['one per card', 'every card, drafts included, exactly as it stands']] as [k, v]}
                <div class="row" style="gap:10px;align-items:baseline"><span class="ah-micro-caps c-muted" style="width:96px;flex-shrink:0">{k}</span><span class="ah-caption c-sec">{v}</span></div>
              {/each}
            </div>
          {:else}
            <div class="ah-body-serif c-body">A gNVC card is a small, human-readable text file. You can read every line with your own eyes. Nothing is hidden, and it opens in any app.</div>
            <div class="col" style="gap:8px">
              {#each [['from · to', 'who it is between'], ['summary', 'the whole card in a sentence or two'], ['the parts', 'observation, feelings, needs, request'], ['history', 'every step the conversation has taken']] as [k, v]}
                <div class="row" style="gap:10px;align-items:baseline"><span class="ah-micro-caps c-muted" style="width:96px;flex-shrink:0">{k}</span><span class="ah-caption c-sec">{v}</span></div>
              {/each}
            </div>
          {/if}
          <div style="align-self:flex-start"><a class="pill outline" href="https://w3id.org/gnvc/1.0" target="_blank" rel="noopener">Read the full format ›</a></div>
        </div>
      </div>
    {/if}
    {#if restoring}
      <div class="col" style="align-items:flex-start;gap:8px">
        <button class="btn sm" onclick={() => fileInput?.click()}>Open a backup file</button>
        <input bind:this={fileInput} type="file" accept=".yaml,.yml,.gnvc,.txt,text/yaml,text/plain" onchange={openFile} hidden />
        <span class="ah-caption c-muted">The file is called giraffy-backup.gnvc.yaml, or giraffy-backup with a date on it.</span>
      </div>
      <div class="rule-row"><span class="ah-small-caps c-muted">or paste it</span></div>
    {/if}
    <textarea class="paste" rows="7" value={app.importVal} oninput={(e) => setText((e.currentTarget as HTMLTextAreaElement).value)} placeholder={restoring ? '# A Giraffy backup…' : '# A Giraffy card, written with care…'} spellcheck="false"></textarea>
    <div class="col" style="align-items:flex-start;gap:8px">
      <button class="btn sm" onclick={() => app.previewImport()}>Preview</button>
      {#if !restoring}
        <button class="btn ghost sm" onclick={() => fileInput?.click()}>Open a file</button>
        <input bind:this={fileInput} type="file" accept=".yaml,.yml,.gnvc,.txt,text/yaml,text/plain" onchange={openFile} hidden />
        <button class="btn ghost sm" onclick={() => app.loadSample(sampleNewYaml(app.data.owner))}>Try a sample request card</button>
        <button class="btn ghost sm" onclick={() => app.loadSample(sampleMergeYaml(app.data.owner))}>Try a request card with history</button>
        <button class="btn ghost sm" onclick={() => app.loadSample(sampleEntangledYaml(app.data.owner))}>Try a request card with entangled needs</button>
      {/if}
      <button class="btn ghost sm" onclick={() => app.loadSample(app.backupText())}>Try a backup of this device</button>
      <button class="btn ghost sm" onclick={() => (confirmClear = true)}>Clear</button>
    </div>
    {#if confirmClear}
      <div class="card sunk" style="padding:14px;border-radius:14px">
        <div class="col" style="gap:10px">
          <span class="ah-caption c-body">Clear everything in the paste area? This can't be undone.</span>
          <div class="row" style="gap:8px">
            <button class="btn sm" onclick={() => { app.clearImport(); confirmClear = false; }}>Clear it</button>
            <button class="btn ghost sm" onclick={() => (confirmClear = false)}>Keep it</button>
          </div>
        </div>
      </div>
    {/if}

    {#if ir?.type === 'backup'}
      <span class="caps rule">A Giraffy backup</span>
      <div class="card list p0">
        <div style="background:color-mix(in srgb, var(--saffron-500) 14%, var(--surface-elevated));padding:12px 16px 9px;display:flex;flex-direction:column;gap:4px">
          <div class="row" style="justify-content:space-between;align-items:baseline;gap:8px">
            <span class="ah-title-m c-head">{ir.backup.owner}</span>
            <span class="ah-caption c-sec" style="flex-shrink:0">{ir.backup.saved ? 'saved ' + fmtDate(ir.backup.saved) : 'saved'}</span>
          </div>
          <span class="ah-micro-caps c-sec">everything the app holds</span>
        </div>
        <div class="col" style="padding:12px 16px 14px;gap:8px">
          {#each backupRows as [k, v]}
            <div class="row" style="gap:10px;align-items:baseline"><span class="ah-micro-caps c-muted" style="width:72px;flex-shrink:0">{k}</span><span class="ah-caption c-body">{v}</span></div>
          {/each}
        </div>
      </div>
      <div class="row" style="gap:8px"><span style="color:var(--bodhi-600);font-family:var(--font-body);font-size:13px;line-height:1">✓</span><span class="ah-micro-caps c-muted">validation passed · giraffy backup 1</span></div>
      <div class="ah-caption c-sec">Restoring replaces everything on this device with what is in this file, exactly as it was saved. What is here now ({hereNow}) goes. You can undo this for the rest of this session.</div>
      <div class="row" style="gap:8px">
        <button class="btn" onclick={() => app.applyImport()}>Restore everything</button>
        <button class="btn ghost" onclick={() => (app.importResult = null)}>Not now</button>
      </div>
    {:else if ir?.type === 'error'}
      <div class="nudge">
        <span class="ah-label" style="color:var(--clay-700)">{restoring ? "This doesn't read as a Giraffy backup yet" : "This doesn't read as a gNVC card yet"}</span>
        <span class="ah-caption" style="color:var(--clay-700)">{ir.error}</span>
      </div>
    {/if}

    {#if restoring && (ir?.type === 'new' || ir?.type === 'merge')}
      <div class="ah-caption c-sec">This is a single card, not a backup of everything. You can still bring it in from here.</div>
    {/if}
    {#if ir?.type === 'new'}
      <div class="row" style="gap:10px"><span class="ah-small-caps c-muted">Preview</span><span style="width:24px;border-top:1px solid var(--border-medium)"></span></div>
    {:else if ir?.type === 'merge'}
      <span class="caps rule">This is your card, returning</span>
    {/if}

    {#if preview}
      <div class="card list p0">
        <div style="background:color-mix(in srgb, {preview.dot} 14%, var(--surface-elevated));padding:12px 16px 9px;display:flex;flex-direction:column;gap:4px">
          <div class="row" style="justify-content:space-between;align-items:baseline;gap:8px">
            <span class="ah-title-m c-head ellipsis">{preview.name}</span>
            <span class="ah-caption c-sec" style="flex-shrink:0">{preview.dateStr}</span>
          </div>
          <span class="ah-micro-caps c-sec">{preview.kindLabel}</span>
        </div>
        <div class="col" style="padding:10px 16px 14px;gap:8px;min-width:0">
          <div class="ah-body-serif c-body">{preview.summary}</div>
          <div class="row" style="gap:7px">
            <span class="sdot" style="background:{preview.dot}"></span>
            <span class="ah-micro-caps c-muted">{preview.statusLabel}</span>
          </div>
          {#if preview.note}
            <div class="col hairline" style="padding-top:8px;gap:3px">
              <span class="ah-micro-caps c-muted">{preview.noteBy}</span>
              <span class="ah-body-serif c-body" style="font-style:italic">{preview.note}</span>
            </div>
          {/if}
        </div>
      </div>
      <div class="row" style="gap:8px"><span style="color:var(--bodhi-600);font-family:var(--font-body);font-size:13px;line-height:1">✓</span><span class="ah-micro-caps c-muted">validation passed · valid gNVC 1.0</span></div>
    {/if}

    {#if ir?.type === 'new'}
      {#if ir.unknownPerson}
        <div class="ah-caption c-sec">"{ir.card.from}" is new here. Importing adds them to your people.</div>
      {/if}
      {#if entangleNote}
        <div class="row" style="gap:9px;align-items:baseline"><span style="color:var(--peacock-600);font-family:var(--font-body);font-size:14px;flex-shrink:0">⚭</span><span class="ah-caption c-sec">{entangleNote}</span></div>
      {/if}
      <div class="row" style="gap:8px">
        <button class="btn" onclick={() => app.applyImport()}>Add to Received</button>
        <button class="btn ghost" onclick={() => (app.importResult = null)}>Not now</button>
      </div>
    {:else if ir?.type === 'merge'}
      <div class="ah-caption c-sec">{mergeCaption}</div>
      <div class="row" style="gap:8px">
        <button class="btn" onclick={() => app.applyImport()}>Merge it in</button>
        <button class="btn ghost" onclick={() => (app.importResult = null)}>Not now</button>
      </div>
    {/if}
  </div>
</div>

<style>
  /* a flex item in a scrolling column: without this it is squeezed flat once a preview appears */
  .paste { font-family: ui-monospace, monospace; font-size: 11px; line-height: 1.5; color: var(--text-body); background: var(--surface-elevated); border: none; border-radius: 14px; padding: 14px; width: 100%; box-shadow: var(--shadow-sm); resize: none; outline: none; flex-shrink: 0; }
  .paste::placeholder { color: var(--text-faint); }
</style>
