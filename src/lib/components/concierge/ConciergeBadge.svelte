<script>
  import { t, isRtl } from '$lib/translations';
  import EntityIcon from '$lib/celim/icons/EntityIcon.svelte';

  /**
   * The customer's concierge on the profile: drafts, what is on order, and
   * what changed and waits for them — each a link to the exact place.
   *
   * Built to sit in the same row as <OfferingsBadges> and to read as one of
   * them (a pill, counts in white bubbles), in the concierge's gold instead
   * of the offerings' pink. A customer who came only to order something has
   * an otherwise empty profile — roles, skills, rikmas — so for them
   * (`prominent`) it leads the row and says where everything is.
   *
   * Renders nothing when there is nothing to show; the numbers come from
   * $lib/concierge/summary.js, the same ones the /concierge hub counts.
   *
   * @type {{
   *   summary: import('$lib/concierge/summary.js').ConciergeSummary | null,
   *   prominent?: boolean
   * }}
   */
  let { summary, prominent = false } = $props();

  const draftsHref = $derived(
    summary?.onlyDraftId
      ? `/concierge/new?draft=${summary.onlyDraftId}`
      : '/concierge?tab=drafts'
  );
  const updatesHref = $derived(
    summary?.updatesWishId ? `/concierge/${summary.updatesWishId}` : '/concierge'
  );
</script>

{#if summary && summary.total > 0}
  <div
    dir={$isRtl ? 'rtl' : 'ltr'}
    class="flex flex-col items-center gap-1 my-2 px-2"
  >
    <div
      class="cb-pill flex flex-wrap items-center justify-center gap-x-3 gap-y-1.5 rounded-full px-4 py-1.5 shadow-md"
      class:cb-prominent={prominent}
    >
      <a
        href="/concierge"
        class="inline-flex items-center gap-1.5 font-bold hover:scale-105 transition-transform"
        title={$t('me.concierge.open')}
      >
        <EntityIcon kind="concierge" size={16} />
        <span>{$t('me.concierge.title')}</span>
      </a>

      {#if summary.drafts > 0}
        <a
          href={draftsHref}
          class="cb-chip"
          title={$t('me.concierge.draftsTip', { count: summary.drafts })}
        >
          <span class="cb-num">{summary.drafts}</span>
          {$t('me.concierge.drafts')}
        </a>
      {/if}

      {#if summary.ordered > 0}
        <a
          href="/concierge"
          class="cb-chip"
          title={$t('me.concierge.orderedTip', { count: summary.ordered })}
        >
          <span class="cb-num">{summary.ordered}</span>
          {$t('me.concierge.ordered')}
        </a>
      {/if}

      {#if summary.updates > 0}
        <a
          href={updatesHref}
          class="cb-chip"
          title={$t('me.concierge.updatesTip', { count: summary.updates })}
        >
          <span class="cb-num cb-num-news">{summary.updates}</span>
          {$t('me.concierge.updates')}
        </a>
      {/if}

      <a
        href="/concierge/new"
        class="cb-plus"
        title={$t('me.concierge.newWish')}
        aria-label={$t('me.concierge.newWish')}>+</a
      >
    </div>

    {#if prominent}
      <p class="cb-hint">{$t('me.concierge.customerHint')}</p>
    {/if}
  </div>
{/if}

<style>
  .cb-pill {
    background: linear-gradient(135deg, #bf953f, #fcf6ba 38%, #b38728 72%, #aa771c);
    color: #3d2c07;
  }
  .cb-prominent {
    padding-block: 0.55rem;
    box-shadow:
      0 0 0 2px rgba(255, 255, 255, 0.7),
      0 8px 24px rgba(170, 119, 28, 0.35);
  }
  .cb-chip {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    font-size: 0.85rem;
    font-weight: 600;
    transition: transform 0.15s;
  }
  .cb-chip:hover {
    transform: scale(1.06);
  }
  .cb-num {
    min-width: 1.25rem;
    padding: 0 0.35rem;
    border-radius: 999px;
    background: #fff;
    color: #7a5410;
    font-size: 0.75rem;
    line-height: 1.25rem;
    text-align: center;
    font-weight: 800;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.12);
  }
  .cb-num-news {
    background: #c8155f;
    color: #fff;
    box-shadow: 0 0 8px rgba(200, 21, 95, 0.55);
  }
  .cb-plus {
    width: 1.5rem;
    height: 1.5rem;
    border-radius: 50%;
    background: #fff;
    color: #7a5410;
    font-weight: 800;
    line-height: 1.5rem;
    text-align: center;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.12);
    transition: transform 0.15s;
  }
  .cb-plus:hover {
    transform: scale(1.2);
  }
  .cb-hint {
    margin: 0;
    font-size: 0.8rem;
    color: var(--gold-l, #fde68a);
    text-align: center;
  }
  @media (prefers-reduced-motion: reduce) {
    .cb-chip,
    .cb-plus {
      transition: none;
    }
  }
</style>
