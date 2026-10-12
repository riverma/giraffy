<script lang="ts">
  // The acknowledgement of something the person just did, and nothing else. It does not take
  // focus and it leaves on its own; a polite live region lets a screen reader hear it
  // without being interrupted mid-sentence.
  import { app } from '$lib/store/app.svelte';
</script>

{#if app.toastMsg}
  <div class="ah-toast" role="status" aria-live="polite"><div class="ah-caption c-head">{app.toastMsg}</div></div>
{/if}
