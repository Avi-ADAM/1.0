<script lang="ts">
  import { isRtl } from '$lib/translations';
  import { page } from '$app/state';
  import { afterNavigate, invalidate } from '$app/navigation';
  import { onDestroy, onMount } from 'svelte';
  import { toast } from 'svelte-sonner';
  import ForumInboxList from '$lib/components/forum/ForumInboxList.svelte';
  import { lang } from '$lib/stores/lang.js';
  import { socketClient } from '$lib/stores/socketClient';
  import { forumStore } from '$lib/stores/forumStore';
  import { registerUpdateStrategies } from '$lib/client/updateStrategies';

  type ForumSummary = {
    id: string;
    kind: string;
    title: string;
    subtitle: string;
    projectName: string;
    projectPic: string | null;
    lastMessage: {
      message: string;
      username: string;
      timestamp: string | null;
    } | null;
    unreadCount: number;
    href: string;
    messages?: any[];
    md?: Record<string, any>;
  };

  let {
    data,
    children
  }: {
    data: {
      forums: ForumSummary[];
      uid: string;
      un: string;
      loadError: string | null;
    };
    children: import('svelte').Snippet;
  } = $props();

  let query = $state('');
  let socketUnsubscribe: (() => void) | null = null;
  let lastBlockedUrl = '';

  const copy = {
    he: {
      title: 'פורומים',
      subtitle: 'כל השיחות הרלוונטיות אליך במקום אחד',
      search: 'חיפוש לפי שם, ריקמה או הודעה',
      blocked: 'אין לך הרשאה לצפות בפורום הזה.',
      loadError: 'לא הצלחנו לטעון את הפורומים כרגע.'
    },
    en: {
      title: 'Forums',
      subtitle: 'All conversations relevant to you in one place',
      search: 'Search by title, project or message',
      blocked: 'You do not have permission to view that forum.',
      loadError: 'We could not load your forums right now.'
    },
    ar: {
      title: 'Forums',
      subtitle: 'All conversations relevant to you in one place',
      search: 'Search by title, project or message',
      blocked: 'You do not have permission to view that forum.',
      loadError: 'We could not load your forums right now.'
    }
  };

  let t = $derived(copy[$lang] || copy.he);
  let selectedId = $derived(page.params.forumId ? String(page.params.forumId) : null);
  let isThreadRoute = $derived(Boolean(selectedId));
  let filteredForums = $derived(
    data.forums.filter((forum) => {
      const needle = query.trim().toLowerCase();
      if (!needle) return true;
      return [
        forum.title,
        forum.subtitle,
        forum.projectName,
        forum.kind,
        forum.lastMessage?.message,
        forum.lastMessage?.username
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(needle);
    })
  );

  function seedMessages(forum: ForumSummary) {
    if (forum.messages?.length) return forum.messages;
    if (!forum.lastMessage) return [];
    return [
      {
        id: `last-${forum.id}`,
        message: forum.lastMessage.message,
        username: forum.lastMessage.username,
        pic: forum.projectPic || '/favicon.ico',
        timestamp: forum.lastMessage.timestamp,
        sentByMe: false,
        pending: false,
        what: true
      }
    ];
  }

  function seedForums() {
    forumStore.update((current) => {
      const updates: Record<string, any> = {};
      for (const forum of data.forums) {
        const id = String(forum.id);
        const seeded = seedMessages(forum);
        const existing = current[id]?.messages || [];
        updates[id] = {
          id,
          subject: forum.title,
          messages: existing.length > seeded.length ? existing : seeded,
          loading: false,
          md: forum.md || {}
        };
      }
      return { ...current, ...updates };
    });
  }

  function showBlockedNotice() {
    const currentUrl = page.url.toString();
    if (page.url.searchParams.get('forum') === 'blocked' && lastBlockedUrl !== currentUrl) {
      lastBlockedUrl = currentUrl;
      toast.warning(t.blocked);
    }
  }

  afterNavigate(() => {
    seedForums();
    showBlockedNotice();
  });

  onMount(() => {
    registerUpdateStrategies();
    seedForums();
    showBlockedNotice();
    socketClient.connect(data.uid);
    socketUnsubscribe = socketClient.onNotification((notification) => {
      const forumId =
        notification.metadata?.forumId ||
        (notification.updateStrategy && notification.updateStrategy.config?.forumId);
      const isChatMessage =
        notification.actionKey === 'createChatMessage' ||
        notification.metadata?.type === 'chatMessage';

      if (isChatMessage) {
        invalidate('app:forums');
        if (forumId) invalidate(`app:forum:${forumId}`);
      }
    });
  });

  onDestroy(() => {
    socketUnsubscribe?.();
  });
</script>

<svelte:head>
  <title>{t.title} | 1lev1</title>
</svelte:head>

<div
  dir={$isRtl ? 'rtl' : 'ltr'}
  class="relative h-screen overflow-hidden bg-[radial-gradient(circle_at_top,theme(colors.slate.700),theme(colors.slate.900)_44%,#140116)] text-white"
>
  <div class="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.08),transparent_32%,rgba(236,72,153,0.12))]"></div>

  <main class="relative mx-auto grid h-full w-full max-w-7xl grid-cols-1 gap-4 p-3 sm:p-5 lg:grid-cols-[390px_minmax(0,1fr)]">
    <aside
      class="{isThreadRoute ? 'hidden lg:flex' : 'flex'} min-h-0 flex-col rounded-md border border-gold/25 bg-slate-950/62 p-3 shadow-2xl shadow-fuchsia-950/30 backdrop-blur-xl sm:p-4"
    >
      <header class="mb-4">
        <div class="flex items-end justify-between gap-3">
          <div>
            <h1 class="text-2xl font-black text-gold sm:text-3xl">{t.title}</h1>
            <p class="mt-1 text-sm text-pink-100/70">{t.subtitle}</p>
          </div>
          <span class="rounded-full border border-barbi/50 bg-barbi/15 px-3 py-1 text-xs font-bold text-pink-50">
            {data.forums.length}
          </span>
        </div>
        <label class="mt-4 block">
          <span class="sr-only">{t.search}</span>
          <input
            bind:value={query}
            placeholder={t.search}
            class="w-full rounded-md border border-white/10 bg-white/[0.065] px-4 py-3 text-sm text-white placeholder:text-pink-100/45 outline-none transition focus:border-gold/70 focus:ring-2 focus:ring-gold/25"
          />
        </label>
        {#if data.loadError}
          <p class="mt-3 rounded-md border border-red-300/30 bg-red-500/10 px-3 py-2 text-sm text-red-100">
            {t.loadError}
          </p>
        {/if}
      </header>

      <div class="min-h-0 flex-1 overflow-y-auto pr-1 d">
        <ForumInboxList forums={filteredForums} {selectedId} />
      </div>
    </aside>

    <section
      class="{isThreadRoute ? 'flex' : 'hidden lg:flex'} min-h-0 flex-col overflow-hidden rounded-md border border-white/10 bg-slate-950/50 shadow-2xl shadow-black/30 backdrop-blur-xl"
    >
      {@render children()}
    </section>
  </main>
</div>
