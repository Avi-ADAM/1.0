<script lang="ts">
  import { goto, invalidate } from '$app/navigation';
  import { onMount } from 'svelte';
  import { ArrowLeft, Copy } from '@lucide/svelte';
  import { toast } from 'svelte-sonner';
  import Diun from '$lib/components/lev/diun.svelte';
  import { forumStore } from '$lib/stores/forumStore';
  import { lang } from '$lib/stores/lang.js';

  type ForumThread = {
    id: string;
    title: string;
    subtitle: string;
    projectName: string;
    projectPic: string | null;
    messages: any[];
    md: Record<string, any>;
  };

  let {
    data
  }: {
    data: {
      forum: ForumThread;
      uid: string;
      un: string;
    };
  } = $props();

  let clicked = $state(false);
  let liveForum = $derived($forumStore[data.forum.id]);
  let messages = $derived(liveForum?.messages || data.forum.messages || []);

  const copy = {
    he: {
      back: 'חזרה לרשימה',
      copy: 'העתקת קישור',
      copied: 'הקישור הועתק',
      error: 'לא הצלחנו לשלוח את ההודעה'
    },
    en: {
      back: 'Back to list',
      copy: 'Copy link',
      copied: 'Link copied',
      error: 'Could not send the message'
    },
    ar: {
      back: 'Back to list',
      copy: 'Copy link',
      copied: 'Link copied',
      error: 'Could not send the message'
    }
  };

  let t = $derived(copy[$lang] || copy.he);

  onMount(() => {
    forumStore.update((current) => ({
      ...current,
      [data.forum.id]: {
        id: data.forum.id,
        subject: data.forum.title,
        messages: data.forum.messages,
        loading: false,
        md: data.forum.md
      }
    }));
  });

  async function sendMessage(event: { why: string }) {
    const message = event.why?.trim();
    if (!message) return;

    const response = await fetch('/api/action', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        actionKey: 'createChatMessage',
        params: {
          forumId: data.forum.id,
          message
        }
      })
    });
    const result = await response.json();

    if (!response.ok || !result.success) {
      toast.warning(result.error?.message || t.error);
      clicked = false;
      return;
    }

    await invalidate(`app:forum:${data.forum.id}`);
    await invalidate('app:forums');
  }

  async function copyLink() {
    const url = new URL(
      `/forum/${data.forum.id}`,
      window.location.origin
    ).toString();
    await navigator.clipboard.writeText(url);
    toast.success(t.copied);
  }
</script>

<svelte:head>
  <title>{data.forum.title} | Forums | 1lev1</title>
</svelte:head>

<div class="flex h-full min-h-[calc(100vh-3.5rem)] flex-col">
  <header
    class="flex items-center justify-between gap-3 border-b border-white/10 bg-slate-950/45 px-3 py-3 sm:px-4"
  >
    <div class="flex min-w-0 items-center gap-3">
      <button
        type="button"
        class="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-gold/40 bg-gold/10 text-gold transition hover:border-barbi hover:text-pink-100 lg:hidden"
        title={t.back}
        aria-label={t.back}
        onclick={() => goto('/forum')}
      >
        <ArrowLeft size={20} />
      </button>

      <div class="min-w-0">
        <h1 class="truncate text-lg font-black text-gold sm:text-xl">
          {data.forum.title}
        </h1>
        <p class="truncate text-xs text-pink-100/65 sm:text-sm">
          {data.forum.subtitle || data.forum.projectName}
        </p>
      </div>
    </div>

    <button
      type="button"
      class="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-white/10 bg-white/[0.055] text-pink-100 transition hover:border-gold hover:text-gold"
      title={t.copy}
      aria-label={t.copy}
      onclick={copyLink}
    >
      <Copy size={18} />
    </button>
  </header>

  <div class="min-h-0 flex-1 p-2 sm:p-4">
    <Diun
      dont={true}
      ani="new-forum"
      rikmaName={data.forum.projectName || ''}
      smalldes={data.forum.subtitle || ''}
      nameChatPartner={data.forum.title}
      mypos={true}
      bind:clicked
      pendId={data.forum.id}
      rect={true}
      profilePicChatPartner={data.forum.projectPic || '/favicon.ico'}
      nameMe={data.un || 'Me'}
      {messages}
      onRect={sendMessage}
    />
  </div>
</div>
