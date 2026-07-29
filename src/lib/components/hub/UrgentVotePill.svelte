<script lang="ts">
  import { lang } from '$lib/stores/lang.js';
  import { t } from '$lib/translations';

  interface Props {
    count: number;
    href?: string;
  }

  let { count, href = '/kind/vote' }: Props = $props();

  const L = (key: string): string => $t(`hub.${key}`);

  let labels = $derived({ msg: L('urgentVoteMsg'), btn: L('handleBtn') });
</script>

{#if count > 0}
  <a
    {href}
    class="urgent relative flex items-center gap-3 px-4 py-3.5 rounded-2xl no-underline overflow-hidden
           bg-gradient-to-r from-red-500/20 to-red-500/5 border border-red-400/40"
  >
    <span class="text-2xl shrink-0 animate-pulse">🚨</span>
    <span class="flex-1 min-w-0">
      <span class="block text-sm font-semibold text-red-200 leading-tight">
        {count} {labels.msg}
      </span>
    </span>
    <span
      class="shrink-0 text-xs font-bold text-red-100 bg-red-500/40 border border-red-300/30
             rounded-full px-3 py-1.5 whitespace-nowrap"
    >{labels.btn}</span>
  </a>
{/if}

<style>
  /* Slow breathing glow to draw the eye without being obnoxious */
  .urgent::before {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: inherit;
    box-shadow: 0 0 0 0 rgba(248, 113, 113, 0.35);
    animation: breathe 2.4s ease-in-out infinite;
    pointer-events: none;
  }
  @keyframes breathe {
    0%,
    100% {
      box-shadow: 0 0 0 0 rgba(248, 113, 113, 0);
    }
    50% {
      box-shadow: 0 0 18px 1px rgba(248, 113, 113, 0.25);
    }
  }
</style>
