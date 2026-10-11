<script lang="ts">
  /**
   * "Who is here" in the rikma's header ($lib/realtime/presence.svelte.ts).
   * Visible to members by default; "hide me" is symmetric — whoever hides is
   * not seen and does not see — so the hidden state shows no roster at all.
   */
  import { onMount } from 'svelte';
  import { t } from '$lib/translations';
  import { RikmaPresence } from '$lib/realtime/presence.svelte';

  type Member = {
    id: string;
    attributes?: {
      username?: string;
      profilePic?: { data?: { attributes?: { url?: string; formats?: { thumbnail?: { url?: string } } } } };
    };
  };

  interface Props {
    projectId: string;
    uid: string;
    members: Member[];
  }

  let { projectId, uid, members }: Props = $props();

  // One presence per rikma page: the layout re-keys this component on projectId.
  // svelte-ignore state_referenced_locally
  const presence = new RikmaPresence(projectId, uid);
  onMount(() => presence.start());

  const MAX_FACES = 5;
  let confirming = $state(false);
  let failed = $state(false);

  const byId = $derived(new Map(members.map((m) => [String(m.id), m])));
  const here = $derived(presence.others.map((id) => byId.get(id)).filter((m): m is Member => !!m));
  const faces = $derived(here.slice(0, MAX_FACES));
  const names = $derived(here.map((m) => m.attributes?.username ?? '').filter(Boolean).join(', '));

  const pic = (m: Member) => {
    const a = m.attributes?.profilePic?.data?.attributes;
    return a?.formats?.thumbnail?.url ?? a?.url ?? null;
  };
  const initial = (m: Member) => (m.attributes?.username ?? '?').trim().charAt(0).toUpperCase();

  async function toggle(hidden: boolean) {
    failed = false;
    const ok = await presence.setHidden(hidden);
    failed = !ok;
    if (ok) confirming = false;
  }

  // Alone in a rikma there is nobody to see or be seen by.
  const shown = $derived(members.length > 1 && presence.status !== 'off' && presence.status !== 'unavailable');
</script>

{#if shown}
  <div class="pr-bar" role="region" aria-label={$t('moach.presence.region')}>
    {#if presence.status === 'hidden'}
      <span class="pr-muted">{$t('moach.presence.hiddenNote')}</span>
      <button type="button" class="pr-link" disabled={presence.busy} onclick={() => toggle(false)}>
        {$t('moach.presence.show')}
      </button>
    {:else}
      {#if here.length > 0}
        <span class="pr-faces" aria-hidden="true">
          {#each faces as m (m.id)}
            {@const src = pic(m)}
            <span class="pr-face" title={m.attributes?.username ?? ''}>
              {#if src}<img {src} alt="" loading="lazy" />{:else}{initial(m)}{/if}
              <span class="pr-dot"></span>
            </span>
          {/each}
          {#if here.length > MAX_FACES}
            <span class="pr-face pr-more">{$t('moach.presence.more', { count: here.length - MAX_FACES })}</span>
          {/if}
        </span>
        <span class="pr-label" aria-live="polite">
          <span class="pr-sr">{names}</span>
          {$t('moach.presence.here')}
        </span>
      {:else}
        <span class="pr-muted" aria-live="polite">{$t('moach.presence.alone')}</span>
      {/if}

      {#if confirming}
        <span class="pr-confirm">
          <span class="pr-muted">{$t('moach.presence.hideExplain')}</span>
          <button type="button" class="pr-link" disabled={presence.busy} onclick={() => toggle(true)}>
            {$t('moach.presence.confirmHide')}
          </button>
          <button type="button" class="pr-link" onclick={() => (confirming = false)}>
            {$t('moach.presence.cancel')}
          </button>
        </span>
      {:else}
        <button
          type="button"
          class="pr-link"
          title={$t('moach.presence.hideExplain')}
          onclick={() => ((confirming = true), (failed = false))}
        >
          {$t('moach.presence.hide')}
        </button>
      {/if}
    {/if}
    {#if failed}<span class="pr-error" role="alert">{$t('moach.presence.failed')}</span>{/if}
  </div>
{/if}

<style>
  .pr-bar {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    font-size: 0.8rem;
    color: var(--gold-l, #f5e6b8);
  }
  .pr-faces {
    display: inline-flex;
    flex-direction: row;
  }
  .pr-face {
    position: relative;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 1.75rem;
    height: 1.75rem;
    margin-inline-start: -0.4rem;
    border-radius: 9999px;
    border: 2px solid var(--gold, #d4af37);
    background: #2a1030;
    color: var(--gold-l, #f5e6b8);
    font-weight: 700;
    font-size: 0.75rem;
  }
  .pr-face:first-child {
    margin-inline-start: 0;
  }
  .pr-face img {
    width: 100%;
    height: 100%;
    border-radius: 9999px;
    object-fit: cover;
  }
  .pr-dot {
    position: absolute;
    bottom: -1px;
    inset-inline-end: -1px;
    width: 0.55rem;
    height: 0.55rem;
    border-radius: 9999px;
    background: #22c55e;
    border: 1.5px solid #19031d;
  }
  .pr-more {
    font-size: 0.65rem;
  }
  .pr-label {
    font-weight: 600;
  }
  .pr-sr {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip: rect(0 0 0 0);
    white-space: nowrap;
  }
  .pr-muted {
    color: var(--gold-l, #f5e6b8);
    opacity: 0.85;
  }
  .pr-confirm {
    display: inline-flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
  }
  .pr-link {
    color: var(--gold, #d4af37);
    text-decoration: underline;
    text-underline-offset: 2px;
    background: none;
    border: 0;
    padding: 0.25rem;
    cursor: pointer;
  }
  .pr-link:disabled {
    opacity: 0.5;
    cursor: default;
  }
  .pr-error {
    color: #fca5a5;
  }
</style>
