<script>
  import { formatTime } from '../utils';
  import { t } from '$lib/translations';
  import { msLeft } from '$lib/stores/clock.svelte';
  let { timegramaDate, onHover = () => {} } = $props();
  function hover(text) {
    onHover?.(text);
  }
  // Was an own setInterval(1000) per instance; now one shared clock for the
  // whole page. The display is hh:mm:ss, so the per-second tick is enough.
  let zman = $derived(msLeft(timegramaDate));
</script>

<div class="flex items-center justify-center m-1 "><span role="contentinfo" aria-label="{$t('lev.cards.common.timero')}" class="bg-gradient-to-br from-gra via-grb via-gr-c via-grd to-gre text-center text-barbi p-2 sm:text-2xl text-lg" style:font-family="Digital" onmouseenter={()=>hover($t('lev.cards.common.timero'))} onmouseleave={()=>hover("0")}  style="font-weight: 300; letter-spacing: 1px; text-shadow: 1px 1px black;">
    {formatTime(zman)}
</span></div>
