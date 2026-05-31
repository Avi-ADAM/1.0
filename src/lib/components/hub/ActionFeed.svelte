<script lang="ts">
  import { lang } from '$lib/stores/lang.js';
  import tr from '$lib/translations/tr.json';

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

  let labels = $derived({ empty: tr.hub.noActivity[$lang] });
</script>

<section dir="rtl" class="space-y-2">
  {#if items.length === 0}
    <p class="text-center text-white/40 text-sm py-6">{labels.empty}</p>
  {:else}
    {#each items.slice(0, 5) as item (item.id)}
      <a
        href={item.href}
        class="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-right no-underline
               bg-white/5 border border-white/10 hover:bg-white/10 transition-all
               {item.urgent ? 'border-red-400/30 bg-red-500/5' : ''}"
      >
        <span class="text-xl shrink-0">{item.icon}</span>
        <span class="flex-1 min-w-0">
          <span class="block text-sm font-medium text-white truncate">{item.title}</span>
          {#if item.subtitle}
            <span class="block text-xs text-white/50 truncate">{item.subtitle}</span>
          {/if}
        </span>
        <span class="text-white/30 text-xs shrink-0">←</span>
      </a>
    {/each}
  {/if}
</section>
