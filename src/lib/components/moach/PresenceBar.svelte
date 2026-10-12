<script lang="ts">
  /**
   * The words under the rikma's member row ($lib/realtime/presence.svelte.ts).
   * The faces themselves stay in that one row, with two different marks:
   * a green ring = a timer running on this rikma's work (from the data,
   * always visible — it is what the rikma counts), a small sky dot = viewing
   * the rikma right now (presence). "Hide me" covers only the second, and is
   * symmetric — whoever hides is not seen viewing and does not see who is.
   */
  import { t } from '$lib/translations';
  import type { RikmaPresence } from '$lib/realtime/presence.svelte';

  interface Props {
    presence: RikmaPresence;
    /** How many members the rikma has — alone, there is nobody to see. */
    memberCount: number;
  }

  let { presence, memberCount }: Props = $props();

  let confirming = $state(false);
  let failed = $state(false);

  const viewers = $derived(presence.others.length);
  const shown = $derived(memberCount > 1 && presence.status !== 'off' && presence.status !== 'unavailable');

  async function toggle(hidden: boolean) {
    failed = false;
    const ok = await presence.setHidden(hidden);
    failed = !ok;
    if (ok) confirming = false;
  }
</script>

{#if shown}
  <div class="pr-bar" role="region" aria-label={$t('moach.presence.region')}>
    {#if presence.status === 'hidden'}
      <span class="pr-muted">{$t('moach.presence.hiddenNote')}</span>
      <button type="button" class="pr-link" disabled={presence.busy} onclick={() => toggle(false)}>
        {$t('moach.presence.show')}
      </button>
    {:else}
      <span class="pr-muted" aria-live="polite">
        {#if viewers > 0}
          <span class="pr-dot" aria-hidden="true"></span>
          {viewers === 1 ? $t('moach.presence.viewersOne') : $t('moach.presence.viewersMany', { count: viewers })}
        {:else}
          {$t('moach.presence.alone')}
        {/if}
      </span>

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
  .pr-muted {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    color: var(--gold-l, #f5e6b8);
    opacity: 0.85;
  }
  /* Same mark as on the faces — the legend for it. */
  .pr-dot {
    display: inline-block;
    width: 0.55rem;
    height: 0.55rem;
    border-radius: 9999px;
    background: #38bdf8;
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
