<script lang="ts">
  import { lang } from '$lib/stores/lang.js';
  import tr from '$lib/translations/tr.json';

  const L = (key: keyof typeof tr.hub) =>
    (tr.hub[key] as Record<string, string>)[$lang] ?? (tr.hub[key] as Record<string, string>).en;

  let labels = $derived({
    text: L('customPurchaseText'),
    sub: L('customPurchaseSub'),
    btn: L('startBtn')
  });
</script>

<a
  href="/concierge/new"
  class="group relative flex items-center gap-3 px-4 py-4 rounded-2xl no-underline overflow-hidden
         bg-goldTobr shadow-[0_8px_24px_-8px_rgba(179,135,40,0.6)]
         transition-transform active:scale-[0.98]"
>
  <!-- moving sheen on the gold -->
  <span
    class="pointer-events-none absolute inset-0 -translate-x-full group-active:translate-x-full
           bg-gradient-to-r from-transparent via-white/40 to-transparent transition-transform duration-700"
  ></span>

  <span class="relative text-2xl shrink-0">✨</span>
  <span class="relative flex-1 min-w-0">
    <span class="block text-sm font-bold text-amber-950 leading-tight">{labels.text}</span>
    <span class="block text-xs text-amber-900/70 mt-0.5 truncate">{labels.sub}</span>
  </span>
  <span
    class="relative shrink-0 text-xs font-bold text-amber-950 bg-white/40 rounded-full px-3 py-1.5 whitespace-nowrap"
  >{labels.btn}</span>
</a>
