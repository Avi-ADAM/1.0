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
  class="relative flex flex-1 flex-col items-center gap-2 px-3 py-4 rounded-2xl no-underline
         bg-white/5 border border-white/10 transition-all active:scale-95 active:bg-white/10"
>
  {#if badge > 0}
    <span
      class="absolute top-2 left-2 flex items-center justify-center min-w-[20px] h-5 px-1.5
             rounded-full bg-red-500 text-white text-[10px] font-bold"
    >{badge}</span>
  {/if}
  <span class="text-2xl leading-none">{icon}</span>
  <span class="text-xs font-medium text-white/75 text-center leading-tight">{label}</span>
</a>
