<script>
  /**
   * The rikma's code license, next to its repo pill (PLAN_CODE_RIKMA §2).
   * Renders nothing while the rikma has not chosen one — legacy null = `none`.
   *
   * A rikma license is never called "open source" here; the hint says what it
   * actually permits (§2.1).
   *
   * A shared license (`rikmaShared*`, §2.1.1) never reads as a prohibition:
   * it is an invitation, and with `joinHref` it links to the join page's two
   * tracks (open missions / needed resources, or propose your own).
   *
   * @typedef {Object} Props
   * @property {string | null | undefined} license
   * @property {number | null | undefined} [openYears]
   * @property {string | null | undefined} [since]
   * @property {string | null | undefined} [joinHref] where "create with us" leads; omit for members
   */
  import { t, locale } from '$lib/translations';
  import {
    effectiveLicense,
    isDelayedLicense,
    isRikmaLicense,
    isSharedLicense
  } from '$lib/codeLicense/codeLicense.js';

  /** @type {Props} */
  let { license, openYears = null, since = null, joinHref = null } = $props();

  let l = $derived(effectiveLicense(license));
  let restrictive = $derived(isRikmaLicense(l));
  let shared = $derived(isSharedLicense(l));

  let label = $derived(
    isDelayedLicense(l)
      ? $t(`ui.license.${l}`, { years: openYears ?? '' })
      : $t(`ui.license.${l}`)
  );

  let hint = $derived(
    shared
      ? $t('ui.license.sharedHint')
      : restrictive
        ? $t('ui.license.rikmaHint')
        : $t('ui.license.openHint')
  );

  let sinceText = $derived.by(() => {
    if (!since) return '';
    const d = new Date(since);
    if (Number.isNaN(d.getTime())) return '';
    return $t('ui.license.since', { date: d.toLocaleDateString($locale || undefined) });
  });
</script>

{#if l !== 'none'}
  <div class="license" class:restrictive class:shared>
    <span class="license-name">
      <svg viewBox="0 0 24 24" width="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        {#if shared}
          <circle cx="8" cy="9" r="3" />
          <circle cx="16" cy="9" r="3" />
          <path d="M3 20c0-3 2.2-5 5-5s5 2 5 5M11 20c0-3 2.2-5 5-5s5 2 5 5" />
        {:else if restrictive}
          <path d="M12 3 4 6v6c0 5 3.4 8.3 8 9 4.6-.7 8-4 8-9V6z" />
        {:else}
          <circle cx="12" cy="12" r="9" />
          <path d="M8 12h8M12 8v8" />
        {/if}
      </svg>
      {label}
      {#if sinceText}<span class="license-since">· {sinceText}</span>{/if}
    </span>
    <span class="license-hint">{hint}</span>
    {#if shared && joinHref}
      <a class="license-join" href={joinHref}>{$t('ui.license.sharedJoin')}</a>
    {/if}
  </div>
{/if}

<style>
  /* Same self-contained dark ground as RikmaRepoLink, so it reads on both the
     public page and the moach header whatever the theme. */
  .license {
    display: inline-flex;
    flex-direction: column;
    align-items: center;
    gap: 0.15rem;
    max-width: min(100%, 28rem);
    padding: 0.35rem 0.9rem;
    border-radius: 0.9rem;
    background: rgba(13, 17, 23, 0.85);
    border: 1px solid rgba(230, 230, 230, 0.25);
    text-align: center;
    line-height: 1.3;
  }
  .license.restrictive {
    border-color: rgba(240, 192, 64, 0.55);
  }
  .license.shared {
    border-color: rgba(238, 130, 238, 0.55);
  }
  .license-name {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    font-size: 0.82rem;
    font-weight: 700;
    color: #e6e6e6;
  }
  .restrictive .license-name {
    color: #f0c040;
  }
  .license-since {
    font-weight: 500;
    color: #b8c0cc;
  }
  .shared .license-name {
    color: #f5b8f5;
  }
  .license-join {
    margin-top: 0.15rem;
    font-size: 0.78rem;
    font-weight: 700;
    color: #f0c040;
    text-decoration: underline;
    text-underline-offset: 2px;
  }
  .license-join:hover {
    color: #ffd700;
  }
  .license-hint {
    font-size: 0.75rem;
    color: #c9d1db;
  }
</style>
