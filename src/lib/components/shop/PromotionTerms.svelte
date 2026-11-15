<script lang="ts">
  /**
   * One promotion in one line — "15% off · on 3 products · 1.11 – 7.11" — in
   * the words of its vote card (`lev.promo.*`), so the tab and the card read
   * the same.
   */
  import { t, locale } from '$lib/translations';
  import type { PromotionKind, PromotionScope } from '$lib/shop/promotions';

  let {
    kind,
    rule,
    scope,
    startsAt = null,
    endsAt = null,
    capUnits = null,
    name = null
  }: {
    kind: PromotionKind;
    rule: Record<string, number | boolean>;
    scope: PromotionScope;
    startsAt?: string | null;
    /** null = it does not end on a date — it ends when `capUnits` runs out. */
    endsAt?: string | null;
    capUnits?: number | null;
    name?: string | null;
  } = $props();

  const fmtDate = (iso: string | null) => {
    if (!iso) return $t('lev.promo.fromApproval');
    try {
      return new Intl.DateTimeFormat($locale || 'he', { day: 'numeric', month: 'numeric', timeZone: 'Asia/Jerusalem' }).format(new Date(iso));
    } catch {
      return String(iso).slice(0, 10);
    }
  };

  const what = $derived.by(() => {
    const r = rule as Record<string, number>;
    switch (kind) {
      case 'item':
        if (r.pct != null) return $t('lev.promo.what.pct', { value: r.pct });
        if (r.price != null) return $t('lev.promo.what.price', { value: r.price });
        return $t('lev.promo.what.off', { value: r.off });
      case 'store':
        return $t('lev.promo.what.pct', { value: r.pct });
      case 'bundle':
        return $t('lev.promo.what.bundle', { qty: r.qty, price: r.price });
      case 'bxgy':
        return $t('lev.promo.what.bxgy', { buy: r.buy, get: r.get, getPct: r.getPct });
      default:
        return r.pct != null
          ? $t('lev.promo.what.thresholdPct', { pct: r.pct, min: r.minSubtotal })
          : $t('lev.promo.what.thresholdOff', { off: r.off, min: r.minSubtotal });
    }
  });

  const scopeText = $derived.by(() => {
    if (scope?.all) return $t('lev.promo.scope.all');
    if (scope?.categories?.length && !scope?.products?.length) return $t('lev.promo.scope.categories', { count: scope.categories.length });
    return $t('lev.promo.scope.products', { count: (scope?.products?.length ?? 0) + (scope?.variants?.length ?? 0) });
  });
</script>

<span class="pt">
  {#if name}<strong class="pt-name"><bdi>{name}</bdi></strong>{/if}
  <span>
    <bdi>{what}</bdi> · {scopeText} ·
    {#if endsAt}
      {$t('lev.promo.dates', { from: fmtDate(startsAt), to: fmtDate(endsAt) })}
    {:else}
      {$t('lev.promo.datesUntilStock', { from: fmtDate(startsAt), count: capUnits })}
    {/if}
  </span>
</span>

<style>
  .pt {
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
  }
  .pt-name {
    color: var(--sh-ink);
  }
</style>
