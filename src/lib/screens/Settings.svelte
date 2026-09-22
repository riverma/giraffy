<script lang="ts">
  // Settings (spec §5.15): your name, coaching, how areas take colour, sharing, backup, and starting over.
  import { app } from '$lib/store/app.svelte';
  import { router } from '$lib/store/router.svelte';
  import { DERIVED_METHODS } from '$lib/core/tiers';
  import { fmtDate } from '$lib/core/time';
  import type { DerivedMethod } from '$lib/core/types';
  import { SPEC_PAGE } from '$lib/core/gnvc';

  const hint = $derived(DERIVED_METHODS.find((m) => m.id === app.data.derivedMethod)?.hint ?? '');

  /**
   * Checking for an update by hand. Giraffy asks on its own whenever it comes back to the
   * front, but an installed app can sit untouched for days, and there is no way to tell
   * "nothing has changed" from "nobody looked" without asking.
   */
  type CheckState = 'idle' | 'checking' | 'current' | 'ready' | 'unavailable';
  let checkState = $state<CheckState>('idle');
  async function checkForUpdate(): Promise<void> {
    if (checkState === 'checking') return;
    checkState = 'checking';
    const reg = await navigator.serviceWorker?.getRegistration().catch(() => undefined);
    if (!reg) { checkState = 'unavailable'; return; }
    try {
      await reg.update();
    } catch {
      checkState = 'unavailable';
      return;
    }
    // update() resolves once the check is done; whether one is waiting is the answer
    checkState = app.updateReady || !!reg.waiting ? 'ready' : 'current';
    if (reg.waiting) app.updateReady = true;
  }
  function pickMethod(id: DerivedMethod): void {
    if (app.data.derivedMethod !== id) app.confirm('derived', { method: id });
  }
</script>

<div class="screen">
  <div class="hdr" style="padding-bottom:14px"><span class="ah-heading-l c-head">Settings</span></div>
  <div class="scroll" style="padding-top:0;gap:22px">
    <div class="col" style="gap:10px">
      <div class="rule-row"><span class="ah-small-caps c-muted">You</span></div>
      <label class="field"><span class="lbl">your name</span><input value={app.data.owner} onchange={(e) => app.setOwner((e.currentTarget as HTMLInputElement).value)} autocomplete="off" /></label>
      <span class="ah-caption c-muted">It signs the cards you share as "from".</span>
    </div>

    <div class="col" style="gap:10px">
      <div class="rule-row"><span class="ah-small-caps c-muted">Coaching</span></div>
      <div class="row" style="gap:8px">
        <button class="chip" class:selected={app.data.coaching} onclick={() => app.setCoaching(!app.data.coaching)}>{app.data.coaching ? 'On' : 'Off'}</button>
      </div>
      <span class="ah-caption c-muted">Gentle nudges while you write. Never blocking. You are the authority on your own words.</span>
    </div>

    <div class="col" style="gap:10px">
      <div class="rule-row"><span class="ah-small-caps c-muted">Needs</span></div>
      <span class="ah-body c-body">How an area's colour is worked out</span>
      <div class="row wrap" style="gap:7px">
        {#each DERIVED_METHODS as m (m.id)}
          <button class="pill outline" class:active={app.data.derivedMethod === m.id} onclick={() => pickMethod(m.id)}>{m.label}</button>
        {/each}
      </div>
      <span class="ah-caption c-muted">{hint}. An area you colour by hand keeps your colour until you change it; switching the method here recalculates every area and asks first.</span>

      <span class="ah-body c-body" style="padding-top:6px">Your own needs</span>
      <span class="ah-caption c-muted">
        {#if app.data.customNeeds.length}
          {app.data.customNeeds.length} {app.data.customNeeds.length === 1 ? 'need' : 'needs'} of your own{app.data.customAreas.length ? ', in ' + app.data.customAreas.length + ' ' + (app.data.customAreas.length === 1 ? 'area' : 'areas') + ' you added' : ''}. Add or remove them from the Needs tab with Edit.
        {:else}
          None yet. Add one from the Needs tab with Edit, or from the + button.
        {/if}
      </span>

      <span class="ah-body c-body" style="padding-top:6px">Hidden needs</span>
      {#if app.vocab.hidden.length}
        <div class="row wrap" style="gap:7px">
          {#each app.vocab.hidden as n (n.id)}
            <button class="pill outline" onclick={() => app.unhideNeed(n.id)} title={'show ' + n.word + ' again'}>{n.word} · show again</button>
          {/each}
        </div>
        <span class="ah-caption c-muted">A hidden need keeps how it felt, its note, and anyone you named on it. Showing it again brings all of that back into the list.</span>
      {:else}
        <span class="ah-caption c-muted">Nothing hidden. Hide a need you do not use from the Needs tab with Edit.</span>
      {/if}
    </div>

    <div class="col" style="gap:10px">
      <div class="rule-row"><span class="ah-small-caps c-muted">Sharing</span></div>
      <div class="row" style="justify-content:space-between;gap:10px">
        <span class="ah-body c-body">Include a one-line preamble</span>
        <button class="pill outline" class:active={app.data.preamble} onclick={() => app.setPreamble(!app.data.preamble)}>{app.data.preamble ? 'On' : 'Off'}</button>
      </div>
      <span class="ah-caption c-muted">A line offered beside a card you share, for whoever has never seen Giraffy: "I took some time to put this into words with care, using Giraffy. You can simply read the card as it is, or open it at giraffy.riverma.com to reply from the heart." It travels next to the card, never inside it, so the card stays readable by another Giraffy.</span>
    </div>

    <div class="col" style="gap:10px">
      <div class="rule-row"><span class="ah-small-caps c-muted">Backup</span></div>
      <div class="row" style="gap:8px">
        <button class="btn sm" onclick={() => app.backupNow()}>Back up now</button>
        <button class="btn ghost sm" onclick={() => router.go('/restore')}>Restore from a backup</button>
      </div>
      <span class="ah-caption c-muted">{app.prefs.lastBackup ? 'Last backup: ' + fmtDate(app.prefs.lastBackup) : 'Last backup: not yet'}</span>
      <span class="ah-caption c-muted">Giraffy has no server. This device holds the only copy of everything: your name, settings, people, needs, any needs and areas of your own, drafts, and every card. A backup file keeps all of it yours even if the browser lets go, and restoring one brings it back exactly as it was.</span>

      <span class="ah-body c-body" style="padding-top:6px">Backups that keep themselves</span>
      {#if !app.canFolderBackup}
        <span class="ah-caption c-muted">This browser cannot write to a folder on its own, so backups here are the button above: one tap, whenever you think of it. Chrome or Edge on a desktop can keep a folder up to date without being asked.</span>
      {:else if app.prefs.backupFolder}
        <div class="row wrap" style="gap:8px;align-items:baseline">
          <span class="ah-caption c-sec">Folder: <strong>{app.prefs.backupFolder}</strong></span>
          {#if app.autoBackupPaused}<span class="ah-caption" style="color:var(--clay-600)">paused</span>{/if}
        </div>
        <div class="row wrap" style="gap:8px">
          {#if app.autoBackupPaused}
            <button class="btn sm" onclick={() => app.resumeBackups()}>Allow again</button>
          {:else}
            <button class="pill outline" class:active={app.prefs.autoBackup} onclick={() => app.setAutoBackup(!app.prefs.autoBackup)}>{app.prefs.autoBackup ? 'On' : 'Off'}</button>
          {/if}
          <button class="btn ghost sm" onclick={() => app.chooseBackupFolder()}>Change folder</button>
          <button class="btn ghost sm" onclick={() => app.stopFolderBackup()}>Stop</button>
        </div>
        <span class="ah-caption c-muted">
          {#if app.autoBackupPaused}
            The browser has forgotten its permission to write there, which happens when it restarts. One tap gives it back.
          {:else if app.prefs.autoBackup}
            Giraffy rewrites <strong>giraffy-backup.gnvc.yaml</strong> in that folder a minute or so after you stop making changes, and again when you close the app. Backups you take by hand carry the date instead, so they sit beside it rather than replacing it.{app.prefs.lastAutoBackup ? ' Last written ' + fmtDate(app.prefs.lastAutoBackup) + '.' : ''}
          {:else}
            The folder is remembered, so Back up now goes straight there. Nothing is written on its own until this is on.
          {/if}
        </span>
      {:else}
        <div><button class="btn sm" onclick={() => app.chooseBackupFolder()}>Choose a folder</button></div>
        <span class="ah-caption c-muted">Pick a folder once, and Giraffy keeps one file in it up to date on its own: after your changes settle, and when you close the app. It never leaves your device, and you can stop or move it whenever you like.</span>
      {/if}
    </div>

    <div class="col" style="gap:10px">
      <div class="rule-row"><span class="ah-small-caps c-muted">About</span></div>
      <button class="card list tap srow" onclick={() => router.go('/onboarding')}><span class="ah-title-m c-head">How Giraffy works</span><span class="ah-caption c-faint">›</span></button>
      <button class="card list tap srow" onclick={() => router.go('/about')}><span class="ah-title-m c-head">Credits</span><span class="ah-caption c-faint">›</span></button>
      <a class="card list tap srow" href={SPEC_PAGE} target="_blank" rel="noopener"><span class="ah-title-m c-head">The gNVC card format</span><span class="ah-caption c-faint">›</span></a>
      <span class="ah-caption c-muted">The introduction again, whenever you want it: the four concepts, and what each one is for.</span>
    </div>

    <div class="col" style="gap:10px">
      <div class="rule-row"><span class="ah-small-caps c-muted">Updates</span></div>
      <div class="row wrap" style="gap:8px">
        <button class="btn sm" disabled={checkState === 'checking'} onclick={checkForUpdate}>
          {checkState === 'checking' ? 'Looking…' : 'Check for an update'}
        </button>
        {#if checkState === 'ready'}
          <button class="btn sm" onclick={() => app.applyUpdate()}>Update now</button>
        {/if}
      </div>
      <span class="ah-caption c-muted">
        {#if checkState === 'ready'}
          A new version is ready. Updating reloads Giraffy. Your cards and needs are untouched.
        {:else if checkState === 'current'}
          You are on the newest version.
        {:else if checkState === 'unavailable'}
          This copy of Giraffy is not installed with a worker, so there is nothing to check. That is normal when running it from a development server.
        {:else}
          Giraffy updates itself quietly when it can. This asks now, which is useful if it has been open for a long time.
        {/if}
      </span>
    </div>

    <div class="col" style="gap:10px">
      <div class="rule-row"><span class="ah-small-caps c-muted">Start over</span></div>
      <div><button class="btn danger sm" onclick={() => app.open({ kind: 'erase', eraseStep: 1 })}>Erase all data</button></div>
      <span class="ah-caption c-muted">Removes every card, need, person, and setting from this device and returns Giraffy to its very first screen. Giraffy asks twice before it does, and offers a backup on the way.</span>
    </div>

    <!-- Last thing on the screen, where a version number is looked for, and worth naming
         when something needs reporting. -->
    <div class="col ver" style="gap:3px">
      <span class="ah-caption c-sec">Giraffy {__APP_VERSION__}</span>
      <span class="ah-caption c-faint">AGPL-3.0 · offline · no accounts · no analytics</span>
    </div>
  </div>
</div>

<style>
  .ver { align-items: center; text-align: center; padding: 6px 0 2px; }
  .srow { padding: 14px 16px; display: flex; justify-content: space-between; align-items: center; width: 100%; border: none; font: inherit; text-align: left; text-decoration: none; }
</style>
