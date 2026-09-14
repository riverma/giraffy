<script lang="ts">
  // Five pages on the dawn gradient (spec §5.1). Skipping is a legitimate answer.
  import { app } from '$lib/store/app.svelte';
  import { router } from '$lib/store/router.svelte';
  import Dots from '$lib/ui/Dots.svelte';
  import GiraffeMark from '$lib/ui/marks/GiraffeMark.svelte';
  import ConceptNeeds from '$lib/ui/marks/ConceptNeeds.svelte';
  import ConceptCard from '$lib/ui/marks/ConceptCard.svelte';
  import ConceptShare from '$lib/ui/marks/ConceptShare.svelte';
  import ConceptWorld from '$lib/ui/marks/ConceptWorld.svelte';

  // Revisiting from Settings: nothing is set up again, and Done returns you where you were.
  const revisit = $derived(app.prefs.onboarded);

  let step = $state(0);
  let name = $state(app.data.owner);
  const LAST = 4;
  const nextLabel = $derived(
    revisit ? (step === LAST ? 'Done' : 'Continue') : step === 0 ? 'Setup' : step === LAST ? 'Start the check-in' : 'Continue'
  );

  function finish(): void {
    app.finishOnboarding(name);
    app.askPersist();
  }
  function next(): void {
    if (step < LAST) { step += 1; return; }
    if (revisit) { leave(); return; }
    finish();
    app.checkinPage = 0;
    router.root('/checkin');
  }
  function skip(): void {
    if (revisit) { leave(); return; }
    finish();
    router.root('/needs');
  }
  function back(): void {
    if (step > 0) step -= 1;
    else leave();
  }
  function leave(): void {
    if (revisit) {
      if (name.trim() && name !== app.data.owner) app.setOwner(name.trim());
      router.back('/settings');
    }
  }
</script>

<div class="screen onb">
  {#if step === 0}
    <div class="page">
      <div class="row" style="gap:16px"><div class="ah-display-l c-head">Giraffy</div><GiraffeMark /></div>
      <div class="ah-pull-quote c-head" style="opacity:0.85;max-width:300px">A pocket guide that helps you say hard things kindly, and hear them kindly too.</div>
      <div class="ah-body-serif c-head" style="opacity:0.75;max-width:315px">Nonviolent Communication untangles a hard moment into four parts: what happened, what you feel, what you need, and what you would like to ask. Giraffy walks you through them, one at a time. Privacy first, offline, and here to help you process your feelings and needs.</div>
    </div>
  {:else if step === 1}
    <div class="page" style="gap:14px">
      <div class="ah-small-caps c-head" style="opacity:0.55">how Giraffy works</div>
      <div class="ah-heading-l c-head">A few concepts.</div>
      <div class="glass col" style="gap:12px">
        <div class="row" style="gap:12px">
          <ConceptNeeds />
          <div class="col" style="gap:2px;min-width:0"><span class="ah-micro-caps c-head" style="opacity:0.7">1 · name your needs</span><span class="ah-caption c-head" style="opacity:0.85">Every feeling points to a <strong>need</strong>: rest, fairness, closeness. A <strong>check-in</strong> walks you through them, and you mark each one met, partly met, or unmet.</span></div>
        </div>
        <div class="row" style="gap:12px">
          <ConceptCard />
          <div class="col" style="gap:2px;min-width:0"><span class="ah-micro-caps c-head" style="opacity:0.7">2 · write a card</span><span class="ah-caption c-head" style="opacity:0.85">A <strong>card</strong> is one moment put into words: what happened, what you felt, the need underneath, and a request. It goes to someone, or to yourself.</span></div>
        </div>
        <div class="row" style="gap:12px">
          <ConceptShare />
          <div class="col" style="gap:2px;min-width:0"><span class="ah-micro-caps c-head" style="opacity:0.7">3 · they do the same</span><span class="ah-caption c-head" style="opacity:0.85">Cards come back as heard, I'd love to, let's explore, or I cannot. When a need of yours and a need of theirs depend on each other, they are <strong>entangled</strong>, and Giraffy shows the thread.</span></div>
        </div>
        <div class="row" style="gap:12px">
          <ConceptWorld />
          <div class="col" style="gap:2px;min-width:0"><span class="ah-micro-caps c-head" style="opacity:0.7">4 · over time</span><span class="ah-caption c-head" style="opacity:0.85">Card by card, need by need, toward a world where everyone's needs are met.</span></div>
        </div>
      </div>
      <div class="ah-caption c-head" style="opacity:0.6">Nothing to memorise. Each of these is explained again where you meet it.</div>
    </div>
  {:else if step === 2}
    <div class="page">
      <div class="ah-small-caps c-head" style="opacity:0.55">first, a name</div>
      <div class="ah-heading-l c-head">What shall we call you?</div>
      <div class="glass" style="padding:8px 20px 18px">
        <label class="field essence"><span class="lbl">your name</span><input bind:value={name} placeholder="A name" autocomplete="off" /></label>
      </div>
      <div class="ah-caption c-head" style="opacity:0.6">It signs the cards you share, nothing more. No account, no server, no sign-in.</div>
    </div>
  {:else if step === 3}
    <div class="page">
      <div class="ah-small-caps c-head" style="opacity:0.55">your first check-in</div>
      <div class="ah-heading-l c-head">Every feeling points to a need.</div>
      <div class="ah-body-serif c-head" style="opacity:0.8;max-width:315px">Giraffy starts there. A <strong>check-in</strong> walks you through every need, one area at a time, and you mark each as it feels today. Cards and requests grow from it.</div>
      <div class="glass col" style="padding:16px 20px;gap:10px">
        {#each [['var(--bodhi-500)', 'met: nourished right now'], ['var(--turmeric-500)', 'partly: some of it, some of the time'], ['var(--clay-500)', 'unmet: this one is aching'], ['var(--neutral-400)', 'unexamined: not looked at yet']] as [dot, text]}
          <div class="row" style="gap:10px"><span style="width:9px;height:9px;border-radius:99px;background:{dot};flex-shrink:0"></span><span class="ah-caption c-head" style="opacity:0.85">{text}</span></div>
        {/each}
      </div>
      <div class="ah-caption c-head" style="opacity:0.6">A full check-in takes about 20 minutes. You can do it a page at a time, or come back to it whenever you like. It is always there under Needs.</div>
      <div class="ah-caption c-head" style="opacity:0.6">No score, no streak. Skip any you like, your needs wait.</div>
    </div>
  {:else}
    <div class="page">
      <div class="ah-small-caps c-head" style="opacity:0.55">before you begin</div>
      <div class="ah-heading-l c-head">Keep a copy somewhere.</div>
      <div class="ah-body-serif c-head" style="opacity:0.8;max-width:330px">
        Giraffy has no server, so this device holds the only copy of your cards and needs. A browser can let go of it: clearing history or site data takes it too. A backup is the whole app in one file, and restoring it brings everything back exactly as it was.
      </div>
      {#if app.canFolderBackup}
        <div class="glass col" style="padding:16px 20px;gap:10px">
          {#if app.prefs.backupFolder}
            <span class="ah-caption c-head" style="opacity:0.85">Backups go to <strong>{app.prefs.backupFolder}</strong>, and keep themselves up to date. Settings can change the folder, or stop this, whenever you like.</span>
          {:else}
            <span class="ah-caption c-head" style="opacity:0.85">Choose a folder once, and Giraffy keeps one file in it up to date on its own: a minute or so after your changes settle, and when you close the app. Nothing leaves this device.</span>
            <div><button class="btn glass sm" onclick={() => app.chooseBackupFolder()}>Choose a folder</button></div>
          {/if}
        </div>
        <div class="ah-caption c-head" style="opacity:0.6">You can do this later instead, from Settings.</div>
      {:else}
        <div class="glass col" style="padding:16px 20px;gap:10px">
          <span class="ah-caption c-head" style="opacity:0.85">This browser cannot write to a folder on its own, so a backup here is one tap: <strong>Back up now</strong> in Settings saves the file wherever you keep things. Chrome or Edge on a desktop can keep a folder up to date without being asked.</span>
          <div><button class="btn glass sm" onclick={() => app.backupNow()}>Save one now</button></div>
        </div>
        <div class="ah-caption c-head" style="opacity:0.6">Giraffy reminds you from the Cards tab when it has been a while.</div>
      {/if}
    </div>
  {/if}
  <div class="col" style="align-items:center;gap:18px">
    <Dots count={5} active={step} tone="var(--text-heading)" onselect={(i) => (step = i)} />
    <div class="row" style="gap:10px;width:100%">
      {#if step > 0 || revisit}
        <button class="btn ghost" onclick={back}>Back</button>
      {/if}
      <div class="grow"><button class="btn glass wide" onclick={next}>{nextLabel}</button></div>
      <button class="btn ghost" onclick={skip}>{revisit ? 'Done' : 'Skip for now'}</button>
    </div>
  </div>
</div>

<style>
  .onb { background: var(--gradient-dawn); padding: calc(var(--safe-top) + 64px) max(28px, var(--gutter)) calc(var(--safe-bottom) + 36px); z-index: 30; overflow-y: auto; }
  .page { flex: 1; display: flex; flex-direction: column; justify-content: center; gap: 22px; }
  .glass { background: var(--glass-overlay); backdrop-filter: blur(14px); -webkit-backdrop-filter: blur(14px); border-radius: 20px; padding: 14px 16px; }
</style>
