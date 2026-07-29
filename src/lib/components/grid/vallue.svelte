<script>
  import { t } from '$lib/translations';
    
    /**
     * @typedef {Object} Props
     * @property {number} [noofhours]
     * @property {number} [perhour]
     * @property {boolean} [iskvua]
     */

    /** @type {Props} */
    let { noofhours = 0, perhour = 0, iskvua = false } = $props();



</script>
<div class="text-barbi">
<span>
        {perhour.toLocaleString('en-US', {maximumFractionDigits:2})} 
    {$t('lev.cards.common.perHour')}
    </span><span> ✖ </span><span>
           {noofhours.toLocaleString('en-US', {maximumFractionDigits:2})}
           {$t('lev.cards.common.hours')} {iskvua ? $t('lev.cards.common.monthly') : $t('lev.cards.customerSale.total') }
           </span> <span> = </span> <span  
            >{(noofhours * perhour).toLocaleString('en-US', {maximumFractionDigits:2})}
            {iskvua ? $t('lev.cards.common.monthly') : $t('lev.cards.customerSale.total') } </span>
</div>