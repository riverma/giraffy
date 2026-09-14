<script lang="ts">
  // Credits (spec §5.15). The people this app stands on, named plainly.
  import { router } from '$lib/store/router.svelte';
  import Icon from '$lib/ui/Icon.svelte';
</script>

<div class="screen over">
  <div class="hdr">
    <button class="back" onclick={() => router.back('/settings')} aria-label="Back">←</button>
    <span class="ah-small-caps c-muted">about</span>
  </div>
  <div class="scroll" style="padding:12px var(--gutter) var(--tab-pad);gap:18px">
    <div class="ah-heading-l c-head">With gratitude.</div>
    <div class="ah-body-serif c-body">Giraffy exists because of Marshall B. Rosenberg (1934–2015), who spent his life developing and teaching Nonviolent Communication, the framework this app walks you through, and shared it in his book Nonviolent Communication: A Language of Life.</div>
    <p class="quote md bordered">The giraffe was his symbol for this way of speaking: the land animal with the largest heart.</p>
    <div class="ah-body-serif c-body">Marshall stood in a longer lineage of nonviolence, and so does this app: Mahatma Gandhi and the ancient principle of ahimsa, the commitment to non-harm in thought, word, and action; Rev. Dr. Martin Luther King Jr., who showed that nonviolence is not passivity but a force for justice and connection; and the Buddha's teachings on compassion, presence, and the roots of suffering, which echo through NVC's attention to what is alive in us.</div>
    <div class="ah-body-serif c-body">Giraffy is an independent, free project inspired by their work. It is not affiliated with or endorsed by the Center for Nonviolent Communication. To go deeper, and we hope you do, start with Marshall's book, or cnvc.org.</div>
    <div class="row" style="gap:10px;padding-top:8px"><span class="grow hairline"></span><span class="ah-small-caps c-muted">credits</span><span class="grow hairline"></span></div>
    <div class="ah-caption c-sec row wrap" style="justify-content:center;gap:5px">Created with <Icon name="heart" size={13} /> by Rishi Verma. © 2026.</div>
    <div class="ah-caption c-sec" style="text-align:center">Giraffy is free software, released under the <a class="lic" href="https://www.gnu.org/licenses/agpl-3.0.html" target="_blank" rel="noopener">GNU Affero General Public License v3.0</a>. You may use it, study it, share it, and improve it.</div>
  </div>
</div>

<style>
  .lic { color: var(--peacock-700); text-decoration: underline; text-underline-offset: 2px; }
</style>
