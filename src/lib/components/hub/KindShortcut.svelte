<script lang="ts">
  interface Props {
    icon: string;
    label: string;
    href: string;
    badge?: number;
  }

  let { icon, label, href, badge = 0 }: Props = $props();
</script>

<a
  {href}
  class="relative flex flex-col items-center gap-1.5 px-4 py-3 rounded-2xl no-underline
         bg-white/5 border border-white/10 hover:bg-white/10 transition-all
         hover:scale-105 active:scale-95 min-w-[80px]"
>
  {#if badge > 0}
    <span
      class="absolute -top-1.5 -right-1.5 flex items-center justify-center
             w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-bold"
    >{badge}</span>
  {/if}
  <span class="text-2xl">{icon}</span>
  <span class="text-xs text-white/70 text-center leading-tight">{label}</span>
</a>
