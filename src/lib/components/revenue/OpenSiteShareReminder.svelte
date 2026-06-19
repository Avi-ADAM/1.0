<script>
  import { t, isRtl } from '$lib/translations';
  /**
   * OpenSiteShareReminder — gate 3 (PLAN_SITE_SHARE_PER_MEMBER §3).
   *
   * The persistent "open decisions" card: a member who slipped past gates 1–2
   * (e.g. caught by the split's time-based auto-approval) still has a `pending`
   * site-share decision. This self-contained banner loads ALL of the member's
   * pending decisions and lets them close each one inline via the SAME shared
   * SiteShareDecision component — one source of truth across every gate.
   *
   * Self-loading (not wired into the /lev arr1 pipeline) so it can sit as a fixed
   * banner above the board and refresh independently. Renders nothing when there
   * are no open decisions.
   */
  import { onMount } from 'svelte';
  import { executeAction } from '$lib/client/actionClient';
  import SiteShareDecision from './SiteShareDecision.svelte';

  let decisions = $state([]); // open (pending) decisions for this member
  let loaded = $state(false);
  let collapsed = $state(false);
  let busyId = $state(null); // contributionId currently being saved


  async function load() {
    try {
      const res = await executeAction('getOpenSiteShareDecisions', {});
      if (res?.success) decisions = res.data?.decisions ?? [];
    } catch (e) {
      console.error('[SiteShare] load open decisions failed:', e);
    } finally {
      loaded = true;
    }
  }

  onMount(load);

  async function onDecide(item, payload) {
    if (busyId) return;
    busyId = item.contributionId;
    try {
      const res = await executeAction('decideSiteShare', {
        tosplitId: String(item.tosplitId),
        projectId: String(item.projectId),
        recive_project: item.reciveProjectId ? String(item.reciveProjectId) : undefined,
        decision: payload.decision,
        amount: payload.amount,
        direction: payload.direction,
        reason: payload.reason,
        proposedAmount: item.proposedAmount,
        basisAmount: item.basisAmount
      });
      if (res?.success) {
        // Closed — drop it from the open list.
        decisions = decisions.filter((d) => d.contributionId !== item.contributionId);
      } else {
        console.error('[SiteShare] decide (reminder) failed:', res?.error);
      }
    } catch (e) {
      console.error('[SiteShare] decide (reminder) error:', e);
    } finally {
      busyId = null;
    }
  }
</script>

{#if loaded && decisions.length > 0}
  <div class="ossr" dir={$isRtl ? 'rtl' : 'ltr'}>
    <button class="ossr-head" type="button" onclick={() => (collapsed = !collapsed)}>
      <span class="ossr-title">
        💗 {$t('lev.revenue.openSiteShareReminder.title')}
        <span class="ossr-count">{decisions.length}</span>
      </span>
      <span class="ossr-chev" class:open={!collapsed} aria-hidden="true">▾</span>
    </button>

    {#if !collapsed}
      <p class="ossr-sub">{$t('lev.revenue.openSiteShareReminder.sub')}</p>
      <div class="ossr-list">
        {#each decisions as item (item.contributionId)}
          <div class="ossr-item">
            <div class="ossr-item-head">
              {#if item.projectLogo}
                <img src={item.projectLogo} alt={item.projectName} class="ossr-logo" />
              {/if}
              <span class="ossr-rikma">{item.projectName || $t('lev.revenue.openSiteShareReminder.rikma')}</span>
            </div>
            <SiteShareDecision
              proposed={item.proposedAmount}
              basis={item.basisAmount}
              initial={null}
              busy={busyId === item.contributionId}
              onDecide={(payload) => onDecide(item, payload)}
            />
          </div>
        {/each}
      </div>
    {/if}
  </div>
{/if}

<style>
  .ossr {
    border: 1px solid var(--gold, #c9a227);
    border-radius: 14px;
    background: var(--bg2, rgba(255, 255, 255, 0.04));
    margin: 8px auto;
    max-width: 680px;
    width: 94%;
    overflow: hidden;
  }
  .ossr-head {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 12px 16px;
    background: transparent;
    border: none;
    cursor: pointer;
    color: inherit;
  }
  .ossr-title {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    font-weight: 800;
    color: var(--gold-l, var(--gold, inherit));
  }
  .ossr-count {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 20px;
    height: 20px;
    padding: 0 6px;
    border-radius: 999px;
    background: var(--gold, #c9a227);
    color: #1a1a1a;
    font-size: 0.75rem;
    font-weight: 800;
  }
  .ossr-chev {
    transition: transform 0.2s ease;
  }
  .ossr-chev.open {
    transform: rotate(180deg);
  }
  .ossr-sub {
    margin: 0;
    padding: 0 16px 8px;
    font-size: 0.85rem;
    opacity: 0.85;
    line-height: 1.4;
  }
  .ossr-list {
    display: flex;
    flex-direction: column;
    gap: 10px;
    padding: 0 12px 12px;
  }
  .ossr-item {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .ossr-item-head {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .ossr-logo {
    width: 24px;
    height: 24px;
    border-radius: 50%;
    object-fit: cover;
    border: 1px solid var(--gold, #c9a227);
  }
  .ossr-rikma {
    font-weight: 700;
  }
</style>
