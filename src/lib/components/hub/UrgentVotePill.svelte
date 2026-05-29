<script lang="ts">
  import { lang } from '$lib/stores/lang.js';

  interface Props {
    count: number;
    href?: string;
  }

  let { count, href = '/kind/vote' }: Props = $props();

  const t = {
    he: { msg: 'הצבעה דחופה מסתיימת בקרוב!', btn: 'לטיפול' },
    en: { msg: 'urgent vote expiring soon!', btn: 'Handle' }
  };

  let labels = $derived(t[$lang as keyof typeof t] ?? t.he);
</script>

{#if count > 0}
  <a
    {href}
    dir="rtl"
    class="w-full flex items-center gap-2 px-4 py-3 rounded-xl no-underline
           bg-red-500/15 border border-red-400/40 text-right
           hover:bg-red-500/25 transition-colors"
  >
    <span class="text-2xl animate-pulse">🚨</span>
    <span class="flex-1 text-red-300 font-medium text-sm">
      {count} {labels.msg}
    </span>
    <span class="text-xs text-red-400 underline">{labels.btn} →</span>
  </a>
{/if}
