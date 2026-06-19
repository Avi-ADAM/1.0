<script lang="ts">
  import { lang } from '$lib/stores/lang.js';

  interface Props {
    username?: string;
    profilePic?: string;
  }

  let { username = '', profilePic = '' }: Props = $props();

  const greetings = {
    he: { morning: 'בוקר טוב', noon: 'צהריים טובים', evening: 'ערב טוב', night: 'לילה טוב' },
    en: { morning: 'Good morning', noon: 'Good afternoon', evening: 'Good evening', night: 'Good night' },
    ar: { morning: 'صباح الخير', noon: 'مساء الخير', evening: 'مساء الخير', night: 'مساء الخير' },
    ru: { morning: 'Доброе утро', noon: 'Добрый день', evening: 'Добрый вечер', night: 'Доброй ночи' }
  };

  const locales: Record<string, string> = { he: 'he-IL', en: 'en-US', ar: 'ar', ru: 'ru-RU' };

  const now = new Date();

  function partOfDay(h: number): 'morning' | 'noon' | 'evening' | 'night' {
    if (h < 5) return 'night';
    if (h < 12) return 'morning';
    if (h < 17) return 'noon';
    if (h < 22) return 'evening';
    return 'night';
  }

  let g = $derived(greetings[$lang as keyof typeof greetings] ?? greetings.en);
  let greeting = $derived(g[partOfDay(now.getHours())]);
  let dateStr = $derived(
    now.toLocaleDateString(locales[$lang] ?? 'en-US', {
      weekday: 'long',
      day: 'numeric',
      month: 'long'
    })
  );
  let initial = $derived((username || '?').trim().charAt(0).toUpperCase());
</script>

<header class="flex items-center gap-3.5 anim-rise">
  <!-- Avatar with gold ring -->
  <a
    href="/me"
    class="relative shrink-0 no-underline group"
    aria-label={username}
  >
    <span
      class="absolute -inset-0.5 rounded-full bg-goldTobr opacity-70 blur-[2px] group-active:opacity-100 transition-opacity"
    ></span>
    {#if profilePic}
      <img
        src={profilePic}
        alt={username}
        class="relative w-14 h-14 rounded-full object-cover ring-2 ring-bluesun"
      />
    {:else}
      <span
        class="relative flex items-center justify-center w-14 h-14 rounded-full
               bg-bluesun ring-2 ring-bluesun text-gold font-litt text-2xl"
      >{initial}</span>
    {/if}
  </a>

  <!-- Greeting -->
  <div class="min-w-0 flex-1">
    <p class="text-xs font-medium uppercase tracking-[0.18em] text-gold/70 truncate">
      {dateStr}
    </p>
    <h1 class="font-litt text-2xl leading-tight text-white truncate">
      {greeting}{username ? `, ${username}` : ''}
    </h1>
  </div>
</header>

<style>
  .anim-rise {
    animation: rise 0.5s cubic-bezier(0.16, 1, 0.3, 1) both;
  }
  @keyframes rise {
    from {
      opacity: 0;
      transform: translateY(8px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
</style>
