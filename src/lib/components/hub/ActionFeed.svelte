<script lang="ts">
  import { lang } from '$lib/stores/lang.js';
  import { t } from '$lib/translations';

  interface FeedItem {
    id: string;
    type: string;
    title: string;
    subtitle?: string;
    icon: string;
    href: string;
    urgent?: boolean;
  }

  interface Props {
    items: FeedItem[];
  }

  let { items }: Props = $props();

  let emptyLabel = $derived($t('hub.noActivity'));
</script>

<section class="space-y-2">
  {#if items.length === 0}
    <div
      class="flex flex-col items-center justify-center gap-1 py-8 rounded-2xl
             bg-white/[0.03] border border-dashed border-white/10"
    >
      <span class="text-2xl opacity-40">🌙</span>
      <p class="text-center text-white/40 text-sm">{emptyLabel}</p>
    </div>
  {:else}
    {#each items.slice(0, 5) as item (item.id)}
      <a
        href={item.href}
        class="feed-row w-full flex items-center gap-3 px-4 py-3 rounded-2xl no-underline
               bg-white/5 border border-white/10 transition-all active:bg-white/10 active:scale-[0.99]
               {item.urgent ? 'border-red-400/30 bg-red-500/5' : ''}"
      >
        <span class="text-xl shrink-0">{item.icon}</span>
        <span class="flex-1 min-w-0">
          <span class="block text-sm font-medium text-white truncate">{item.title}</span>
          {#if item.subtitle}
            <span class="block text-xs text-white/50 truncate">{item.subtitle}</span>
          {/if}
        </span>
        <span class="text-white/30 text-lg shrink-0 chev">‹</span>
      </a>
    {/each}
  {/if}
</section>

<style>
  .chev {
    transform: scaleX(1);
  }
  :global([dir='ltr']) .chev {
    transform: scaleX(-1);
  }
</style>
