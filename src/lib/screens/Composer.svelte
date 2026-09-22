<script lang="ts">
  // The composer (spec §5.9): kind and people, observation, feelings, needs, request, then the words assembled.
  import { onMount } from 'svelte';
  import { app, composerPeople, composerSeq, listNames } from '$lib/store/app.svelte';
  import { router } from '$lib/store/router.svelte';
  import { FEELINGS, FAUX_FEELINGS } from '$lib/data/feelings';
  import type { Need } from '$lib/data/needs';
  import { chipStyle } from '$lib/core/tiers';
  import { linkedNeedId } from '$lib/core/drafts';
  import { isTheirDraft } from '$lib/core/cards';
  import { coach, type Nudge, type RuleGroup } from '$lib/core/rules';
  import { synthesize } from '$lib/core/synthesize';
  import { S } from '$lib/strings';
  import { SELF_NAME } from '$lib/core/types';
  import Dots from '$lib/ui/Dots.svelte';
  import Nudges from '$lib/ui/Nudges.svelte';

  const OBS_EXAMPLES: Record<'request' | 'gratitude', [boolean, string][]> = {
    request: [
      [true, 'When I saw the dishes from last night on the counter this morning…'],
      [false, 'When you left the kitchen a mess like you always do… Here "always" generalizes and "a mess" evaluates.'],
      [true, 'When you said "I don\'t have time for this" and left the room… Quotes are observations.'],
      [false, 'When you dismissed me… Here "dismissed" diagnoses intent.']
    ],
    gratitude: [
      [true, 'When you drove out to the airport at midnight and waited by the curb with the heater on…'],
      [false, 'When you were so thoughtful and amazing… Here "thoughtful" and "amazing" are verdicts. Say what they did.'],
      [true, 'When you said "take the day, I\'ve got the kids" on Saturday morning… Quotes are observations.'],
      [false, 'When you were there for me like you always are… Here "always" generalizes. Name the one moment.']
    ]
  };

  /** The real feelings behind a word people use as one, or null. Own keys only. */
  const faux = (w: string): string[] | null => (Object.hasOwn(FAUX_FEELINGS, w) ? FAUX_FEELINGS[w] : null);

  const cm = $derived(app.composer);
  // whose words these are, when they are not your own: every prompt below turns around
  const voice = $derived(cm?.asPerson?.trim() || null);
  /**
   * A card in someone else's voice is either your guess at their words or their own draft,
   * shared with you. Both keep the author and stay drafts, so only the copy differs, and the
   * card itself is what tells them apart.
   */
  const editingTheirs = $derived.by(() => {
    const c = cm?.draftId ? app.card(cm.draftId) : undefined;
    return !!c && isTheirDraft(c, app.owner);
  });
  const them = $derived(voice ?? 'them');
  const seq = $derived(cm ? composerSeq(cm.kind) : [0]);
  const pos = $derived(cm ? seq.indexOf(cm.step) : 0);
  const people = $derived(cm ? composerPeople(cm) : []);
  const canNext = $derived.by(() => {
    if (!cm) return false;
    switch (cm.step) {
      case 0: return cm.asPerson !== null ? !!cm.asPerson.trim() : !!(cm.persons.length || cm.newPerson.trim());
      case 1: return cm.observation.trim().length > 0;
      case 2: return cm.feelings.length > 0;
      case 3: return cm.needs.length > 0;
      case 4: return cm.request.trim().length > 0;
      default: return false;
    }
  });
  // Assembled from whatever is written so far, so the last step reads correctly however it
  // was reached. synthesize() puts an ellipsis where a part is missing, which is why this is
  // safe to show early rather than only after the request.
  const assembled = $derived(cm ? synthesize({ kind: cm.kind, observation: cm.observation, feelings: cm.feelings, needs: cm.needs, request: cm.request }) : '');
  /** What the last step shows: their own wording once they have touched it, the assembly until then. */
  const summaryShown = $derived(cm?.summaryCustom ? cm.summary : assembled);
  /** The parts a card still needs before it is a card, named so the ellipses do not look like a fault. */
  const missing = $derived.by(() => {
    if (!cm) return [] as string[];
    const gaps: string[] = [];
    if (!cm.observation.trim()) gaps.push('an observation');
    if (!cm.feelings.length) gaps.push('a feeling');
    if (!cm.needs.length) gaps.push('a need');
    if (cm.kind === 'request' && !cm.request.trim()) gaps.push('a request');
    return gaps;
  });
  const canFinish = $derived(missing.length === 0);
  const chipNames = $derived(cm ? [...app.data.people.map((p) => p.name), ...cm.persons.filter((n) => !app.data.people.some((p) => p.name === n))] : []);
  const saveLabel = $derived(
    editingTheirs ? S.draft.sendBack(voice ?? 'them')
    : voice ? 'This is my guess at ' + voice
    : cm?.editId ? 'Keep these changes'
    : people.length > 1 ? 'Write these ' + people.length + ' cards'
    : 'This is what I want to say');
  const starters = $derived(voice || people[0] !== SELF_NAME
    ? ['Would you be willing to…', 'Would you consider…', 'How would you feel about…']
    : ['Would I be willing to…', 'This week I could…', 'One small thing I can give myself is…']);

  // coaching, unless it is switched off or the card is written quietly
  function nudges(group: RuleGroup, text: string): Nudge[] {
    if (!app.data.coaching || !cm || cm.quiet) return [];
    return coach(group, text, app.dismissed);
  }
  const obsNudges = $derived(cm ? nudges('observation', cm.observation) : []);
  const fauxWord = $derived(cm ? cm.customFeeling.trim().toLowerCase() : '');
  const fauxNudge = $derived.by((): Nudge[] => {
    if (!cm || !faux(fauxWord) || app.dismissed['faux:' + fauxWord] || !app.data.coaching || cm.quiet) return [];
    return [{ key: 'faux:' + fauxWord, word: fauxWord, msg: 'describes what you think someone did. Underneath it, what is the feeling?' }];
  });
  const feelNudges = $derived(cm ? [...fauxNudge, ...nudges('feelings', cm.customFeeling)] : []);
  const feelSuggests = $derived(fauxNudge.length ? { ['faux:' + fauxWord]: faux(fauxWord) as string[] } : {});
  const needNudges = $derived(cm ? nudges('needs', cm.customNeed) : []);
  const reqNudges = $derived(cm ? nudges('request', cm.request) : []);
  const synthNudges = $derived(cm ? [...nudges('observation', cm.summary), ...nudges('request', cm.summary)] : []);
  const feelQuery = $derived(cm ? cm.feelSearch.trim().toLowerCase() : '');
  const feelResults = $derived(feelQuery ? [...FEELINGS.unmet, ...FEELINGS.met].flatMap((f) => f.words).filter((w) => w.includes(feelQuery)).slice(0, 18) : []);

  onMount(() => {
    // landing here with no draft (a stale link, say) is nothing to worry about
    if (!app.composer) router.root('/cards');
    // and leaving the screen any other way, the browser's own back included, puts it down
    return () => app.leaveComposer();
  });

  // The last need chip tapped, so its meaning can be shown without crowding the grid.
  let touchedNeed = $state<{ word: string; meaning: string } | null>(null);
  // Words on this card that are not in the needs list, offered for filing under an area.
  const looseNeeds = $derived(cm ? cm.needs.filter((w) => !linkedNeedId(cm, w)) : []);

  function touch(): void { app.touchComposer(); }
  /** Coaching, for this card only. Some moments are too raw to be commented on. */
  function toggleCoaching(): void {
    if (!cm) return;
    cm.quiet = !cm.quiet;
    app.toast(cm.quiet ? S.composer.coachingOff : S.composer.coachingOn);
    touch();
  }
  function go(step: number): void { if (cm) { cm.step = step; touch(); } }
  function next(): void {
    if (!cm || !canNext) return;
    go(seq[pos + 1]);
  }
  /** Send the card as it stands, without finishing it: it stays a draft and stays yours. */
  function sendAsIs(): void {
    if (!cm?.draftId) return;
    app.touchComposer();
    const c = app.card(cm.draftId);
    if (c) app.openShare(c);
  }
  function setKind(k: 'request' | 'gratitude'): void { if (cm) { cm.kind = k; cm.half = k === 'gratitude' ? 'met' : 'unmet'; touch(); } }
  function pickPerson(n: string): void {
    if (!cm) return;
    cm.persons = cm.persons.includes(n) ? cm.persons.filter((x) => x !== n) : [...cm.persons, n];
    touch();
  }
  function toggleFeeling(w: string): void {
    if (!cm) return;
    cm.feelings = cm.feelings.includes(w) ? cm.feelings.filter((x) => x !== w) : [...cm.feelings, w];
    touch();
  }
  function addFeeling(w: string): void { if (cm && !cm.feelings.includes(w)) cm.feelings = [...cm.feelings, w]; if (cm) cm.customFeeling = ''; touch(); }
  function addCustomFeeling(): void {
    if (!cm) return;
    const w = cm.customFeeling.trim().toLowerCase();
    if (w && !faux(w)) addFeeling(w);
  }
  /** A word can sit under more than one area, so tapping the same word elsewhere re-points it. */
  function toggleNeed(n: Need): void {
    if (!cm) return;
    const w = n.word;
    if (linkedNeedId(cm, w) === n.id) { cm.needs = cm.needs.filter((x) => x !== w); delete cm.needIds[w]; }
    else {
      if (!cm.needs.includes(w)) cm.needs = [...cm.needs, w];
      cm.needIds[w] = n.id;
    }
    touch();
  }
  function removeNeed(w: string): void { if (cm) { cm.needs = cm.needs.filter((x) => x !== w); delete cm.needIds[w]; touch(); } }
  function addCustomNeed(): void {
    if (!cm) return;
    let w = cm.customNeed.trim();
    if (!w) return;
    w = w.replace(/^i (need|value)\s+/i, '');
    if (!cm.needs.includes(w)) cm.needs = [...cm.needs, w];
    // a word that is already in your needs links itself; anything else stays a word on the card
    const id = app.vocab.match(w);
    if (id) cm.needIds[w] = id;
    cm.customNeed = '';
    touch();
  }
</script>

{#if cm}
  <div class="screen comp">
    <div class="hdr" style="justify-content:space-between;padding-bottom:10px">
      <button class="plain" style="font-size:19px;color:var(--text-secondary);padding:4px 10px 4px 0" onclick={() => app.closeComposer()} aria-label="Close">×</button>
      <Dots count={seq.length} active={pos} onselect={(i) => go(seq[Math.max(0, Math.min(seq.length - 1, i))])} />
      {#if app.data.coaching}
        <button class="pill outline" class:active={cm.quiet} onclick={toggleCoaching}>
          {cm.quiet ? 'coaching off' : 'coaching on'}
        </button>
      {/if}
    </div>
    {#if voice}
      <div style="padding:0 var(--gutter) 10px">
        <span class="ah-caption c-sec" style="font-style:italic">{editingTheirs ? S.draft.theirs(voice) : S.guess.voice(voice)}</span>
      </div>
    {/if}
    <div class="scroll" style="padding:8px var(--gutter) 24px;gap:16px;--scroll-tail:0">
      {#if cm.step === 0}
        <div class="col" style="gap:20px;padding-top:8px">
          <div class="ah-heading-m c-head">{editingTheirs ? voice + "'s draft" : voice ? S.guess.title : cm.editId ? 'Editing a card' : 'A new card'}</div>
          <div class="col" style="gap:10px">
            <span class="caps">What kind</span>
            <div class="row" style="gap:8px">
              <button class="chip" class:selected={cm.kind === 'request'} onclick={() => setKind('request')}>a request</button>
              <button class="chip" class:selected={cm.kind === 'gratitude'} onclick={() => setKind('gratitude')}>a gratitude</button>
            </div>
          </div>
        {#if cm.asPerson !== null}
          <div class="col" style="gap:10px">
            <span class="caps">{S.guess.whose}</span>
            <span class="ah-caption c-muted" style="margin-top:-4px">{S.guess.whoseHint}</span>
            <div class="row wrap" style="gap:8px">
              {#each chipNames.filter((n) => n !== SELF_NAME) as n (n)}
                <button class="chip" class:selected={cm.asPerson === n} onclick={() => { if (cm) { cm.asPerson = n; touch(); } }}>{n}</button>
              {/each}
            </div>
            <label class="field"><input value={chipNames.includes(cm.asPerson ?? '') ? '' : cm.asPerson ?? ''} oninput={(e) => { if (cm) { cm.asPerson = e.currentTarget.value; touch(); } }} placeholder="Or a new name…" autocomplete="off" /></label>
          </div>
        {:else}
          <div class="col" style="gap:10px">
            <span class="caps">Who is it about?</span>
            <span class="ah-caption c-muted" style="margin-top:-4px">Pick more than one and the same card is written for each of them.</span>
            <div class="row wrap" style="gap:8px">
              {#each chipNames as n (n)}
                <button class="chip" class:selected={cm.persons.includes(n)} onclick={() => pickPerson(n)}>{n}</button>
              {/each}
            </div>
            <label class="field"><input bind:value={cm.newPerson} oninput={touch} placeholder="Or a new name…" autocomplete="off" /></label>
            {#if people.length > 1}
              <span class="ah-caption c-sec">{people.length} cards will be written, one each for {listNames(people)}.</span>
            {/if}
          </div>
        {/if}
          <label class="field"><span class="lbl">context</span><input bind:value={cm.context} oninput={touch} placeholder="About last night's dinner" autocomplete="off" /></label>
        </div>
      {:else if cm.step === 1}
        <div class="col" style="gap:14px;padding-top:8px">
          <span class="caps rule">Observation</span>
          <div class="ah-pull-quote c-head">{voice
            ? (cm.kind === 'gratitude'
              ? 'What might ' + them + ' say you did? Write the moment as they might put it, in their words.'
              : 'What might ' + them + ' say they saw or heard? Write the moment as they might put it, in their words.')
            : cm.kind === 'gratitude'
            ? 'What did they do? Share just what you saw or heard: the moment you want to thank them for, the way a caring friend who watched it might retell it.'
            : "What happened? Share just what you saw or heard, the way a caring friend who watched the moment, but wasn't part of it, might retell it."}</div>
          <textarea class="ta" rows="5" bind:value={cm.observation} oninput={touch} placeholder="When I saw…"></textarea>
          <Nudges nudges={obsNudges} />
          <div><button class="pill outline" class:active={cm.showExamples} onclick={() => { cm.showExamples = !cm.showExamples; touch(); }}>Show me examples</button></div>
          {#if cm.showExamples}
            <div class="card sunk" style="padding:16px">
              <div class="col" style="gap:11px">
                {#each OBS_EXAMPLES[cm.kind] as [ok, text]}
                  <div class="col" style="gap:2px">
                    <span class="ah-micro-caps" style="color:{ok ? 'var(--bodhi-600)' : 'var(--clay-600)'}">{ok ? 'an observation' : cm.kind === 'gratitude' ? 'carries evaluation' : 'carries judgment'}</span>
                    <span class="ah-caption" class:c-body={ok} class:c-sec={!ok}>{text}</span>
                  </div>
                {/each}
              </div>
            </div>
          {/if}
        </div>
      {:else if cm.step === 2}
        <div class="col" style="gap:14px;padding-top:8px">
          <span class="caps rule">Feelings</span>
          <div class="ah-pull-quote c-head">{voice ? 'When that happened, what might ' + them + ' have felt?' : 'When that happened, what did you feel, in you?'}</div>
          {#if cm.feelings.length}
            <div class="row wrap" style="gap:7px">
              {#each cm.feelings as w (w)}<button class="pill active" onclick={() => toggleFeeling(w)}>{w}</button>{/each}
            </div>
          {/if}
          <div class="row" style="gap:8px">
            <label class="field grow"><input bind:value={cm.feelSearch} oninput={touch} placeholder="Search feelings" autocomplete="off" /></label>
            <button class="pill outline" class:active={cm.half === 'unmet'} onclick={() => { cm.half = 'unmet'; touch(); }}>unmet</button>
            <button class="pill outline" class:active={cm.half === 'met'} onclick={() => { cm.half = 'met'; touch(); }}>met</button>
          </div>
          {#if feelQuery}
            <div class="row wrap" style="gap:7px">
              {#each feelResults as w (w)}<button class="chip" class:selected={cm.feelings.includes(w)} onclick={() => toggleFeeling(w)}>{w}</button>{/each}
            </div>
          {:else}
            <div class="col" style="gap:8px">
              {#each FEELINGS[cm.half] as fam (fam.name)}
                <button class="card list tap fam" onclick={() => { cm.expandedFamily = cm.expandedFamily === fam.name ? null : fam.name; touch(); }}>
                  <span style="width:9px;height:9px;border-radius:99px;background:{fam.color};flex-shrink:0"></span>
                  <span class="ah-title-m c-head grow">{fam.name}</span>
                  <span class="ah-caption c-faint">{cm.expandedFamily === fam.name ? '−' : '+'}</span>
                </button>
                {#if cm.expandedFamily === fam.name}
                  <div class="row wrap" style="gap:7px;padding:2px 4px 8px">
                    {#each fam.words as w (w)}<button class="chip" class:selected={cm.feelings.includes(w)} onclick={() => toggleFeeling(w)}>{w}</button>{/each}
                  </div>
                {/if}
              {/each}
            </div>
          {/if}
          <div class="row" style="gap:8px;align-items:flex-end">
            <label class="field grow"><span class="lbl">a word of your own</span><input bind:value={cm.customFeeling} oninput={touch} placeholder="…" autocomplete="off" onkeydown={(e) => e.key === 'Enter' && addCustomFeeling()} /></label>
            <button class="btn ghost sm" onclick={addCustomFeeling}>Add</button>
          </div>
          <Nudges nudges={feelNudges} suggests={feelSuggests} onsuggest={addFeeling} />
        </div>
      {:else if cm.step === 3}
        <div class="col" style="gap:14px;padding-top:8px">
          <span class="caps rule">Needs</span>
          <div class="ah-pull-quote c-head">{voice
            ? (cm.kind === 'gratitude' ? 'Which of ' + them + "'s needs might have been met?" : 'Which of ' + them + "'s needs might not be met?")
            : cm.kind === 'gratitude' ? 'Which of your needs were met? Try completing: I need… or I value…' : 'Which of your needs are not being met? Try completing: I need… or I value…'}</div>
          {#if cm.asPerson === null && Object.keys(app.data.needTiers).length}
            <div class="ah-caption c-faint" style="font-style:italic;margin-top:-6px">Dots carry how each need felt at your last check-in.</div>
          {/if}
          {#if cm.needs.length}
            <div class="row wrap" style="gap:7px">
              {#each cm.needs as w (w)}<button class="pill active" onclick={() => removeNeed(w)}><span class="dot" style="background:var(--saffron-500)"></span>{w}</button>{/each}
            </div>
          {/if}
          <div class="col" style="gap:8px">
            {#each app.vocab.areas as cat (cat.name)}
              <button class="card list tap fam" onclick={() => { cm.expandedCat = cm.expandedCat === cat.name ? null : cat.name; touch(); }}>
                <span class="ah-title-m c-head grow">{cat.name}</span>
                <span class="ah-caption c-faint">{cm.expandedCat === cat.name ? '−' : '+'}</span>
              </button>
              {#if cm.expandedCat === cat.name}
                <div class="row wrap" style="gap:7px;padding:2px 4px 8px">
                  {#each cat.needs as n (n.id)}
                    {@const cs = chipStyle(linkedNeedId(cm, n.word) === n.id, cm.asPerson !== null ? null : app.tierOf(n.id))}
                    <button class="chip" title={app.meaningOf(n.id)} style="background:{cs.bg};color:{cs.color};box-shadow:{cs.shadow}"
                      onclick={() => { touchedNeed = { word: n.word, meaning: app.meaningOf(n.id) }; toggleNeed(n); }}><span class="dot" style="background:{cs.dot}"></span>{n.word}</button>
                  {/each}
                  {#if !cat.needs.length}
                    <span class="ah-caption c-faint">Nothing under {cat.name} yet.</span>
                  {/if}
                </div>
              {/if}
            {/each}
          </div>
          {#if touchedNeed}
            <span class="ah-caption c-sec"><strong>{touchedNeed.word}</strong>: {touchedNeed.meaning}</span>
          {/if}
          <div class="row" style="gap:6px">
            <button class="pill outline" onclick={() => { cm.customNeed = 'I need '; touch(); }}>I need…</button>
            <button class="pill outline" onclick={() => { cm.customNeed = 'I value '; touch(); }}>I value…</button>
          </div>
          <div class="row" style="gap:8px;align-items:flex-end">
            <label class="field grow"><span class="lbl">in your own words</span><input bind:value={cm.customNeed} oninput={touch} placeholder="…" autocomplete="off" onkeydown={(e) => e.key === 'Enter' && addCustomNeed()} /></label>
            <button class="btn ghost sm" onclick={addCustomNeed}>Add</button>
          </div>
          {#each looseNeeds as w (w)}
            <div class="row wrap" style="gap:8px;align-items:baseline">
              <span class="ah-caption c-sec"><strong>{w}</strong> is not in your needs yet.</span>
              <button class="plain ah-caption c-sec" style="text-decoration:underline" onclick={() => app.openAddNeed(undefined, w)}>Add it under an area</button>
            </div>
          {/each}
          <Nudges nudges={needNudges} />
        </div>
      {:else if cm.step === 4}
        <div class="col" style="gap:14px;padding-top:8px">
          <span class="caps rule">Request</span>
          <div class="ah-pull-quote c-head">{voice
            ? 'What might ' + them + ' ask of you? A request is a gift of clarity, not an obligation. You would still be free to say no.'
            : 'What would you like to ask? A request is a gift of clarity, not an obligation. The other person is free to say no.'}</div>
          <div class="row wrap" style="gap:6px">
            {#each starters as s}<button class="pill outline" onclick={() => { cm.request = s.replace('…', ' '); touch(); }}>{s}</button>{/each}
          </div>
          <textarea class="ta" rows="4" bind:value={cm.request} oninput={touch} placeholder="Would you be willing to…"></textarea>
          <Nudges nudges={reqNudges} />
          <p class="quote md bordered c-sec">If a yes would be rewarded with warmth you'd otherwise withhold, or a no met with ill feeling, it isn't a request yet. It's a demand.</p>
        </div>
      {:else}
        <div class="col" style="gap:14px;padding-top:8px">
          <span class="caps rule">Your words, assembled</span>
          <textarea class="ta synth" rows="8" value={summaryShown}
            oninput={(e) => { if (cm) { cm.summary = e.currentTarget.value; cm.summaryCustom = true; touch(); } }}></textarea>
          <Nudges nudges={synthNudges} />
          {#if missing.length}
            <span class="ah-caption c-sec">Still to write: {listNames(missing)}. You can send it as it is and finish later.</span>
          {/if}
          <div class="row wrap" style="gap:8px">
            <span class="ah-caption c-muted">Something's off?</span>
            <button class="pill outline" onclick={() => go(1)}>observation</button>
            <button class="pill outline" onclick={() => go(2)}>feelings</button>
            <button class="pill outline" onclick={() => go(3)}>needs</button>
            {#if cm.kind === 'request'}<button class="pill outline" onclick={() => go(4)}>request</button>{/if}
          </div>
          <div class="col" style="gap:8px">
            <button class="btn wide" disabled={cm.asPerson === null && !canFinish} onclick={() => app.saveComposer()}>{saveLabel}</button>
            {#if cm.asPerson === null}
              <button class="btn ghost wide" onclick={sendAsIs}>{S.composer.sendAsIs}</button>
            {/if}
          </div>
        </div>
      {/if}
    </div>
    <div class="foot">
      {#if pos > 0}<button class="btn ghost" onclick={() => go(seq[pos - 1])}>Back</button>{/if}
      <div class="grow"></div>
      {#if cm.step !== 5}
        <button class="pill outline" onclick={() => go(5)}>See it so far</button>
        <button class="btn" disabled={!canNext} onclick={next}>Continue</button>
      {/if}
    </div>
  </div>
{/if}

<style>
  .comp { z-index: 20; }
  .ta { font-family: var(--font-display); font-style: italic; font-size: 16px; line-height: 1.5; color: var(--text-body); background: var(--surface-elevated); border: none; border-radius: 16px; padding: 16px; width: 100%; box-shadow: var(--shadow-sm); resize: none; outline: none; }
  .ta::placeholder { color: var(--text-faint); }
  .ta.synth { font-size: 18px; line-height: 1.45; color: var(--text-heading); border-radius: 18px; padding: 20px; box-shadow: var(--shadow-md); }
  .fam { padding: 13px 16px; display: flex; align-items: center; gap: 10px; width: 100%; border: none; font: inherit; text-align: left; }
  .field input { font-family: var(--font-body); font-size: 13px; }
  .foot { padding: 12px var(--gutter) calc(20px + var(--safe-bottom)); display: flex; justify-content: space-between; align-items: center; gap: 10px; border-top: 1px solid var(--border-subtle); background: var(--glass-overlay-strong); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px); }
</style>
