<script>
  import { lang } from '$lib/stores/lang.js';

  /**
   * @typedef {Object} Props
   * @property {any} [evt] - evt - A svelte event with event information under `evt.e`.
   * @property {any} [offset] - [offset=-35] - A y-offset from the hover point, in pixels.
   * @property {import('svelte').Snippet<[any]>} [children]
   */

  /** @type {Props} */
  let { evt = {}, offset = -35, children } = $props();

  const translations = {
    name: {
      en: 'Name',
      he: 'שם'
    },
    iso3: {
      en: 'ISO3',
      he: 'ISO3'
    },
    agrees: {
      en: 'Agreements',
      he: 'הסכמות'
    }
  };
</script>

<style>
  .tooltip {
    position: absolute;
    width: 150px;
    border: 1px solid #ccc;
    font-size: 13px;
    background: rgba(255, 255, 255, 0.85);
    transform: translate(-50%, -100%);
    padding: 5px;
    z-index: 15;
  }
</style>

{#if evt?}
  <div
    class="tooltip"
    style="
      top:{evt??.e?.layerY + offset}px;
      left:{evt??.e?.layerX}px;
    "
  >
    {@render children?.({ detail: evt?, translations })}
  </div>
{/if}
