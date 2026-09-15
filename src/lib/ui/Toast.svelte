<script lang="ts">
  import { app } from '$lib/store/app.svelte';
</script>

{#if app.toastMsg}
  <div class="toast" role="status" aria-live="polite"><div><span class="ah-caption c-head">{app.toastMsg}</span></div></div>
{/if}
