<script lang="ts">
  import { lang } from '$lib/stores/lang.js';

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
  };

  let {
    forums = [],
    selectedId = null
  }: {
    forums?: ForumSummary[];
    selectedId?: string | null;
  } = $props();

  const labels: Record<string, Record<string, string>> = {
    he: {
      project: 'ריקמה',
      process: 'תהליך',
      mission: 'משימה',
      ask: 'בקשה',
      sheirut: 'מכירה',
      haluka: 'כספים',
      meeting: 'פגישה',
      emptyTitle: 'אין פורומים להצגה',
      emptyBody: 'כשיהיו שיחות שרלוונטיות אליך הן יופיעו כאן.',
      system: 'מערכת'
    },
    en: {
      project: 'Project',
      process: 'Process',
      mission: 'Mission',
      ask: 'Request',
      sheirut: 'Sale',
      haluka: 'Money',
      meeting: 'Meeting',
      emptyTitle: 'No forums yet',
      emptyBody: 'Relevant conversations will appear here.',
      system: 'System'
    },
    ar: {
      project: 'Project',
      process: 'Process',
      mission: 'Mission',
      ask: 'Request',
      sheirut: 'Sale',
      haluka: 'Money',
      meeting: 'Meeting',
      emptyTitle: 'No forums yet',
      emptyBody: 'Relevant conversations will appear here.',
      system: 'System'
    }
  };

  let t = $derived(labels[$lang] || labels.he);

  function formatTime(value: string | null | undefined) {
    if (!value) return '';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';

    const today = new Date();
    const isToday = date.toDateString() === today.toDateString();
    if (isToday) {
      return date.toLocaleTimeString($lang || 'he', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      });
    }
    return date.toLocaleDateString($lang || 'he', {
      month: '2-digit',
      day: '2-digit'
    });
  }

  function fallbackLetter(forum: ForumSummary) {
    return (forum.projectName || forum.title || '1')
      .trim()
      .charAt(0)
      .toUpperCase();
  }
</script>

{#if forums.length === 0}
  <div class="grid min-h-56 place-items-center px-6 text-center">
    <div>
      <div
        class="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-full border border-gold/50 bg-gold/10 text-2xl font-black text-gold"
      >
        1
      </div>
      <h2 class="text-lg font-bold text-gold">{t.emptyTitle}</h2>
      <p class="mt-2 text-sm text-pink-100/70">{t.emptyBody}</p>
    </div>
  </div>
{:else}
  <nav
    class="flex flex-col gap-2"
    aria-label="Forum conversations"
  >
    {#each forums as forum (forum.id)}
      {@const selected = String(forum.id) === String(selectedId)}
      <a
        href={forum.href}
        aria-current={selected ? 'page' : undefined}
        class="group grid grid-cols-[44px_1fr_auto] items-center gap-3 rounded-md border px-3 py-3 transition
          {selected
          ? 'border-gold/80 bg-gold/15 shadow-lg shadow-fuchsia-500/15'
          : 'border-white/10 bg-white/[0.045] hover:border-barbi/60 hover:bg-white/[0.075]'}"
      >
        <span
          class="relative h-11 w-11 overflow-hidden rounded-full border border-gold/40 bg-slate-900"
        >
          {#if forum.projectPic}
            <img
              src={forum.projectPic}
              alt=""
              class="h-full w-full object-cover"
              loading="lazy"
            />
          {:else}
            <span
              class="grid h-full w-full place-items-center bg-gradient-to-br from-barbi/70 to-gold/70 text-base font-black text-slate-950"
            >
              {fallbackLetter(forum)}
            </span>
          {/if}
        </span>

        <span class="min-w-0">
          <span class="flex min-w-0 items-center gap-2">
            <span class="truncate text-sm font-bold text-white"
              >{forum.title}</span
            >
            <span
              class="shrink-0 rounded-full border border-barbi/40 bg-barbi/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-normal text-pink-100"
            >
              {t[forum.kind] || forum.kind}
            </span>
          </span>
          <span class="mt-1 block truncate text-xs text-gold/80">
            {forum.subtitle || forum.projectName}
          </span>
          <span class="mt-1 block truncate text-xs text-pink-100/65">
            {#if forum.lastMessage}
              <strong class="text-pink-100/90"
                >{forum.lastMessage.username || t.system}:</strong
              >
              {forum.lastMessage.message}
            {:else}
              {t.system}
            {/if}
          </span>
        </span>

        <span class="flex flex-col items-end gap-2">
          <span class="text-[11px] text-pink-100/55">
            {formatTime(forum.lastMessage?.timestamp)}
          </span>
          {#if forum.unreadCount > 0}
            <span
              class="grid min-h-5 min-w-5 place-items-center rounded-full bg-gold px-1.5 text-[10px] font-black text-slate-950"
            >
              {forum.unreadCount}
            </span>
          {:else}
            <span
              class="h-2 w-2 rounded-full bg-barbi/70 opacity-0 transition group-hover:opacity-100"
            ></span>
          {/if}
        </span>
      </a>
    {/each}
  </nav>
{/if}
