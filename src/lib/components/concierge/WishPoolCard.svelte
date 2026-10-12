<!--
  WishPoolCard — the demand pool on a wish's review page
  (docs/inprogress/PLAN_SHARED_PURCHASE.md §5, §9).

  Lev judged the wish happens only when several customers want it at once (a
  weekly basket, a minibus route), or the clustering job already invited it into
  a pool. The card says why, lists open pools nearby that want the same thing,
  and offers to open one. Every pool move is the owner's tap — nothing joins
  for her — and the pool never touches the wish itself (§2.1).
-->
<script>
  import { invalidateAll } from '$app/navigation';
  import { toast } from 'svelte-sonner';
  import { executeAction } from '$lib/client/actionClient';
  import { t } from '$lib/translations';

  /**
   * @type {{
   *   pool: import('$lib/server/maagad/wishPool').WishPoolPanel;
   *   wish: {
   *     id: string | number; name: string; isOnline: boolean;
   *     lat: number | null; lng: number | null; radius: number | null;
   *     categories?: { id: string | number }[];
   *   };
   * }}
   */
  let { pool, wish } = $props();

  let busy = $state(/** @type {string | null} */ (null));

  /**
   * @param {string} actionKey
   * @param {Record<string, any>} params
   * @param {string} okKey
   */
  async function run(actionKey, params, okKey) {
    busy = actionKey + (params.maagadId ?? '');
    try {
      const out = await executeAction(/** @type {any} */ (actionKey), params);
      if (!out?.success) throw new Error(out?.error?.message || $t('concierge.pool_error'));
      toast.success($t(okKey));
      await invalidateAll();
    } catch (err) {
      console.error(`[WishPoolCard] ${actionKey} failed:`, err);
      toast.error(err instanceof Error ? err.message : $t('concierge.pool_error'));
    } finally {
      busy = null;
    }
  }

  /** @param {string} maagadId */
  function join(maagadId) {
    return run('joinMaagad', { maagadId, ratsonId: String(wish.id) }, 'concierge.pool_joined');
  }

  function open() {
    return run(
      'openMaagad',
      {
        name: wish.name,
        scope: wish.isOnline ? 'global' : 'local',
        lat: wish.isOnline ? null : wish.lat,
        lng: wish.isOnline ? null : wish.lng,
        radius: wish.isOnline ? null : wish.radius,
        ratsonId: String(wish.id),
        categoryIds: (wish.categories ?? []).map((c) => String(c.id))
      },
      'concierge.pool_opened'
    );
  }
</script>

<section class="wp" aria-labelledby="wp-title">
  {#if pool.mine && pool.mine.memberStatus !== 'suggested'}
    <h3 id="wp-title" class="wp-title">{$t('concierge.pool_in', { name: pool.mine.name })}</h3>
    <p class="wp-meta">{$t('concierge.pool_members', { count: pool.mine.members })}</p>
    <a class="wp-btn" href="/maagad/{pool.mine.id}">{$t('concierge.pool_view')}</a>
  {:else if pool.mine}
    {@const invited = pool.mine}
    <h3 id="wp-title" class="wp-title">{$t('concierge.pool_invited', { name: invited.name })}</h3>
    <p class="wp-meta">{$t('concierge.pool_members', { count: invited.members })}</p>
    <div class="wp-acts">
      <button class="wp-btn" disabled={!!busy} onclick={() => join(invited.id)}
        >{$t('concierge.pool_join')}</button
      >
      <a class="wp-link" href="/maagad/{invited.id}">{$t('concierge.pool_view')}</a>
    </div>
  {:else}
    <h3 id="wp-title" class="wp-title">{$t('concierge.pool_title')}</h3>
    <p class="wp-why">{pool.volume?.why || $t('concierge.pool_why_default')}</p>
    {#if pool.volume?.minPeople}
      <p class="wp-meta">{$t('concierge.pool_min', { count: pool.volume.minPeople })}</p>
    {/if}

    {#if pool.similar.length}
      <p class="wp-sub">{$t('concierge.pool_similar')}</p>
      <ul class="wp-list">
        {#each pool.similar as p (p.id)}
          <li>
            <a class="wp-name" href="/maagad/{p.id}">{p.name}</a>
            <span class="wp-meta">
              {$t('concierge.pool_members', { count: p.members })}
              {#if p.distanceKm != null}· {$t('concierge.km_away', { distance: p.distanceKm })}{/if}
            </span>
            <button class="wp-btn" disabled={!!busy} onclick={() => join(p.id)}
              >{$t('concierge.pool_join')}</button
            >
          </li>
        {/each}
      </ul>
    {/if}

    {#if pool.canOpen}
      <button class="wp-btn wp-open" disabled={!!busy} onclick={open}>{$t('concierge.pool_open')}</button>
      <p class="wp-hint">{$t('concierge.pool_open_hint')}</p>
    {:else}
      <p class="wp-hint">{$t('concierge.pool_need_place')}</p>
    {/if}
  {/if}
</section>

<style>
  .wp {
    margin: 0 0 14px;
    padding: 14px 16px;
    border: 1px solid rgb(var(--cg-mint-rgb) / 0.35);
    border-radius: 14px;
    background: rgb(var(--cg-mint-rgb) / 0.06);
    color: var(--cg-ink);
    font-family: 'Bellefair', serif;
  }
  .wp-title {
    margin: 0 0 6px;
    font-size: 15px;
    color: var(--cg-ink-hi);
  }
  .wp-why,
  .wp-hint,
  .wp-sub {
    margin: 0 0 8px;
    font-size: 13px;
    line-height: 1.55;
    color: var(--cg-ink2);
  }
  .wp-hint {
    margin: 8px 0 0;
    font-size: 12px;
    color: var(--cg-muted);
  }
  .wp-meta {
    margin: 0 0 8px;
    font-size: 12px;
    color: var(--cg-muted);
  }
  .wp-list {
    list-style: none;
    margin: 0 0 10px;
    padding: 0;
    display: grid;
    gap: 8px;
  }
  .wp-list li {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 6px 10px;
    padding: 8px 10px;
    border-radius: 10px;
    background: var(--cg-s1);
  }
  .wp-list .wp-meta {
    margin: 0;
    flex: 1 1 auto;
  }
  .wp-name {
    color: var(--cg-ink-hi);
    font-size: 14px;
    text-decoration: none;
  }
  .wp-name:hover {
    text-decoration: underline;
  }
  .wp-acts {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 10px;
  }
  .wp-btn {
    display: inline-flex;
    align-items: center;
    padding: 7px 14px;
    border: 0;
    border-radius: 10px;
    background: var(--cg-mint);
    color: var(--cg-on-mint);
    font: inherit;
    font-size: 13px;
    text-decoration: none;
    cursor: pointer;
  }
  .wp-btn:disabled {
    opacity: 0.55;
    cursor: default;
  }
  .wp-btn:focus-visible,
  .wp-name:focus-visible,
  .wp-link:focus-visible {
    outline: 2px solid var(--cg-goldhi);
    outline-offset: 2px;
  }
  .wp-link {
    color: var(--cg-ink2);
    font-size: 13px;
  }
</style>
