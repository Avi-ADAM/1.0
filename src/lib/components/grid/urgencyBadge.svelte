<script>
  import { t } from '$lib/translations';
    ;
    let { value } = $props();
    
    const priorityConfig = {
        white: { bg: 'bg-slate-100', text: 'text-slate-700', border: 'border-slate-300', labelKey: 'common.misc.urgencyNormal' },
        green: { bg: 'bg-emerald-100', text: 'text-emerald-700', border: 'border-emerald-300', labelKey: 'common.misc.urgencyLow' },
        yellow: { bg: 'bg-amber-100', text: 'text-amber-700', border: 'border-amber-300', labelKey: 'common.misc.urgencyMedium' },
        red: { bg: 'bg-rose-100', text: 'text-rose-700', border: 'border-rose-300', labelKey: 'common.misc.urgencyUrgent' }
    };
    
    const cfg = $derived(priorityConfig[value] || priorityConfig.white);
</script>

<span class="px-2 py-0.5 rounded-full text-[10px] font-bold border {cfg.bg} {cfg.text} {cfg.border}">
    {$t(cfg.labelKey)}
</span>
