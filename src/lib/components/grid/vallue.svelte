<script>
  import { lang } from '$lib/stores/lang.js';
  /** @type {{noofhours?: number, perhour?: number, iskvua?: boolean}} */
  let { noofhours = 0, perhour = 0, iskvua = false } = $props();
  const perho = { he: 'לשעה', en: 'per hour' };
  const hourss = { he: 'שעות', en: 'hours' };
  const monhly = { he: 'בחודש', en: 'per month' };
  const total = { he: 'סך הכל', en: 'total' };
</script>

<div class="text-barbi">
  <span>
    {perhour.toLocaleString('en-US', { maximumFractionDigits: 2 })}
    {perho[$lang]}
  </span><span> ✖ </span><span>
    {noofhours.toLocaleString('en-US', { maximumFractionDigits: 2 })}
    {hourss[$lang]}
    {iskvua ? monhly[$lang] : total[$lang]}
  </span> <span> = </span>
  <span
    >{(noofhours * perhour).toLocaleString('en-US', {
      maximumFractionDigits: 2
    })}
    {iskvua ? monhly[$lang] : total[$lang]}
  </span>
</div>
