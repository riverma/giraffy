<script lang="ts">
  // Bottom sheet with a grab handle, a dismissible scrim, and a visible close. Never a trap:
  // Escape, the scrim and the Close button all leave. Focus moves into the sheet when it
  // opens, stays inside while it is open, and returns to what opened it.
  import { onMount } from 'svelte';
  import type { Snippet } from 'svelte';
  import { S } from '$lib/strings';
  let { title, onclose, children }: { title?: string; onclose: () => void; children: Snippet } = $props();
  let dialog: HTMLElement | undefined = $state();

  const FOCUSABLE = 'a[href], button:not([disabled]), input, textarea, select, [tabindex]:not([tabindex="-1"])';

  onMount(() => {
    const opener = document.activeElement as HTMLElement | null;
    dialog?.focus();
    return () => { if (opener && document.contains(opener)) opener.focus(); };
  });

  function key(e: KeyboardEvent): void {
    if (e.key === 'Escape') { onclose(); return; }
    if (e.key !== 'Tab' || !dialog) return;
    const items = [...dialog.querySelectorAll<HTMLElement>(FOCUSABLE)];
    if (!items.length) { e.preventDefault(); return; }
    const first = items[0], last = items[items.length - 1];
    const active = document.activeElement;
    if (e.shiftKey && (active === first || active === dialog)) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && active === last) { e.preventDefault(); first.focus(); }
  }
</script>

<div class="ah-scrim" onclick={onclose} role="presentation">
  <!-- clicks inside the sheet must not reach the scrim; the sheet itself is not a control -->
  <div class="ah-sheet" bind:this={dialog} role="dialog" tabindex="-1" aria-modal="true" aria-labelledby={title ? 'sheet-title' : undefined} onclick={(e) => e.stopPropagation()} onkeydown={key}>
    <div class="ah-sheet__grab"></div>
    {#if title}
      <div class="ah-sheet__head">
        <h2 class="ah-sheet__title" id="sheet-title">{title}</h2>
        <button class="ah-sheet__close" onclick={onclose} aria-label={S.common.close}>×</button>
      </div>
    {/if}
    {@render children()}
  </div>
</div>
