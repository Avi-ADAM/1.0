<!--
  ExternalOfferCard — one offer found on the web for a plan row nothing inside
  the platform answers (docs/inprogress/PLAN_CONCIERGE_EXTERNAL_SOURCES.md §3, §5.1).

  A pointer, never a copy: title, domain, one search-engine sentence, a price
  and a town only when they were published, and the link to the source. Always
  says it is an outside source. No favicon or image — nothing is loaded from
  the site, and the disc is the domain's first letter.
-->
<script>
  import Money from '$lib/components/money/Money.svelte';
  import { t, locale } from '$lib/translations';

  /**
   * @type {{
   *   offer: {
   *     id: string; title: string; snippet: string | null; url: string; domain: string;
   *     price: number | null; currency: string | null; locationLabel: string | null; fetchedAt: string;
   *   };
   *   canAct?: boolean;
   *   noteSaved?: boolean;
   *   busy?: 'note' | 'dismiss' | null;
   *   onSaveNote?: (offer: any) => void;
   *   onDismiss?: (offer: any) => void;
   * }}
   */
  let { offer, canAct = false, noteSaved = false, busy = null, onSaveNote, onDismiss } = $props();

  const letter = $derived((offer.domain || '·').replace(/^www\./, '').slice(0, 1).toUpperCase());
  const collected = $derived.by(() => {
    const d = new Date(offer.fetchedAt);
    if (isNaN(+d)) return '';
    try {
      return d.toLocaleDateString($locale || 'he', { day: 'numeric', month: 'short' });
    } catch {
      return d.toISOString().slice(0, 10);
    }
  });
</script>

<div class="xo-card">
  <div class="xo-disc" aria-hidden="true">{letter}</div>
  <div class="xo-body">
    <div class="xo-title">{offer.title}</div>
    <div class="xo-meta">
      <span class="xo-domain" dir="ltr">{offer.domain}</span>
      {#if offer.locationLabel}<span>· {offer.locationLabel}</span>{/if}
      {#if offer.price != null}<span class="xo-price"
          >· <Money amount={offer.price} currency={offer.currency ?? undefined} /></span
        >{/if}
    </div>
    {#if offer.snippet}<div class="xo-snippet">{offer.snippet}</div>{/if}
    <div class="xo-badges">
      <span class="xo-badge">{$t('concierge.ext_badge')}</span>
      {#if collected}<span class="xo-when">{$t('concierge.ext_fetched_at', { date: collected })}</span>{/if}
    </div>
    <div class="xo-actions">
      <a class="xo-open" href={offer.url} target="_blank" rel="noopener nofollow noreferrer"
        >{$t('concierge.ext_open')}</a
      >
      {#if canAct}
        {#if noteSaved}
          <span class="xo-done">✓ {$t('concierge.ext_saved_note')}</span>
        {:else}
          <button class="xo-ghost" disabled={!!busy} onclick={() => onSaveNote?.(offer)}
            >{busy === 'note' ? '⏳' : $t('concierge.ext_save_note')}</button
          >
        {/if}
        <button class="xo-ghost" disabled={!!busy} onclick={() => onDismiss?.(offer)}
          >{busy === 'dismiss' ? '⏳' : $t('concierge.ext_dismiss')}</button
        >
      {/if}
    </div>
  </div>
</div>

<style>
  .xo-card {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    padding: 10px 12px;
    border: 1px dashed rgb(var(--cg-fg-rgb) / calc(0.12 * var(--cg-fg-k)));
    border-radius: 12px;
    background: rgb(var(--cg-fg-rgb) / calc(0.015 * var(--cg-fg-k)));
    min-width: 0;
  }
  .xo-disc {
    width: 32px;
    height: 32px;
    flex-shrink: 0;
    border-radius: 50%;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border: 1px solid rgb(var(--cg-fg-rgb) / calc(0.14 * var(--cg-fg-k)));
    color: var(--cg-muted);
    font-family: 'Cinzel', serif;
    font-weight: 700;
    font-size: 12px;
  }
  .xo-body {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  .xo-title {
    font-family: 'Sababa', 'Heebo', sans-serif;
    font-size: 14px;
    font-weight: 700;
    color: var(--cg-ink);
    line-height: 1.25;
    overflow-wrap: anywhere;
  }
  .xo-meta {
    display: flex;
    flex-wrap: wrap;
    gap: 5px;
    font-size: 12px;
    color: var(--cg-muted);
  }
  .xo-domain {
    overflow-wrap: anywhere;
  }
  .xo-price {
    color: var(--cg-goldhi);
  }
  .xo-snippet {
    font-family: 'Bellefair', serif;
    font-size: 13px;
    color: var(--cg-ink2);
    line-height: 1.45;
    display: -webkit-box;
    -webkit-line-clamp: 3;
    line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
  .xo-badges {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    align-items: center;
  }
  .xo-badge {
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.04em;
    color: var(--cg-muted);
    padding: 2px 8px;
    border-radius: 999px;
    border: 1px solid rgb(var(--cg-fg-rgb) / calc(0.1 * var(--cg-fg-k)));
  }
  .xo-when {
    font-size: 10px;
    color: var(--cg-muted2);
  }
  .xo-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin-top: 2px;
    align-items: center;
  }
  .xo-open,
  .xo-ghost {
    display: inline-flex;
    align-items: center;
    padding: 5px 11px;
    border-radius: 10px;
    font-size: 12px;
    white-space: nowrap;
    text-decoration: none;
    cursor: pointer;
    transition:
      color 0.2s,
      border-color 0.2s;
  }
  .xo-open {
    color: var(--cg-ink);
    border: 1px solid rgb(var(--cg-gold-rgb) / 0.35);
    background: rgb(var(--cg-gold-rgb) / 0.05);
  }
  .xo-ghost {
    color: var(--cg-muted);
    background: transparent;
    border: 1px solid rgb(var(--cg-fg-rgb) / calc(0.1 * var(--cg-fg-k)));
  }
  .xo-open:hover,
  .xo-ghost:hover:not(:disabled) {
    color: var(--cg-ink);
    border-color: rgb(var(--cg-gold-rgb) / 0.45);
  }
  .xo-ghost:disabled {
    opacity: 0.6;
    cursor: default;
  }
  .xo-done {
    font-size: 11px;
    color: var(--cg-mint);
  }
</style>
