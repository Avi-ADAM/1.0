<script>
    import {lang} from '$lib/stores/lang.js'
export let noofhours = 0
export let  perhour = 0
    export let iskvua = false
    const perho = {"he":"לשעה","en":"per hour"}
        const hourss = {"he":"שעות","en":"hours"}
        const monhly = {"he":"בחודש", "en": "per month"}
        const total = {"he":"סך הכל","en": "total"}
</script>
<div class="text-barbi">
<span>
        {perhour.toLocaleString('en-US', {maximumFractionDigits:2})} 
    {perho[$lang]}
    </span><span> ✖ </span><span>
           {noofhours.toLocaleString('en-US', {maximumFractionDigits:2})}
           {hourss[$lang]} {iskvua ? monhly[$lang] : total[$lang] }
           </span> <span> = </span> <span  
            >{(noofhours * perhour).toLocaleString('en-US', {maximumFractionDigits:2})}
            {iskvua ? monhly[$lang] : total[$lang] } </span>
</div>