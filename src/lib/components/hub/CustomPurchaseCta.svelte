<script lang="ts">
  import { lang } from '$lib/stores/lang.js';
  import tr from '$lib/translations/tr.json';

  let labels = $derived({
    text: tr.hub.customPurchaseText[$lang],
    sub: tr.hub.customPurchaseSub[$lang],
    btn: tr.hub.startBtn[$lang]
  });
</script>

<a
  href="/deals/new"
  dir="rtl"
  class="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-right no-underline
         bg-goldTobr border border-accent/40 shadow-sm
         hover:opacity-90 hover:scale-[1.01] transition-all active:scale-[0.99]"
>
  <span class="text-2xl">✨</span>
  <span class="flex-1">
    <span class="block text-sm font-semibold text-amber-900">{labels.text}</span>
    <span class="block text-xs text-amber-800/70 mt-0.5">{labels.sub}</span>
  </span>
  <span class="text-amber-800 font-bold text-sm">{labels.btn} ←</span>
</a>
