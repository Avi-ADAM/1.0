<script lang="ts">
  /**
   * Shipping — how the rikma's products reach buyers
   * (docs/inprogress/PLAN_SHOP_SHIPPING.md §6).
   *
   * One draft of the whole config, edited in place and saved at once: zones
   * (first match wins, so they can be moved), each with priced methods;
   * pickup points; per-product rules; and a preview that prices an address
   * with the very function the storefront's quote uses. Who takes the parcels
   * out is a fulfilment rule — linked, not repeated here.
   */
  import { page } from '$app/state';
  import { untrack } from 'svelte';
  import { invalidate } from '$app/navigation';
  import { toast } from 'svelte-sonner';
  import { t, locale } from '$lib/translations';
  import { executeAction, actionErrorText } from '$lib/client/actionClient';
  import { shopShippingKey } from '$lib/shop/keys';
  import { formatWhen } from '$lib/time/formatWhen';
  import { clock } from '$lib/stores/clock.svelte';
  import ShopNotice from '$lib/components/shop/ShopNotice.svelte';
  import CityPicker, { type PickedCity } from '$lib/components/shop/CityPicker.svelte';
  import ShippingMethodEditor from '$lib/components/shop/ShippingMethodEditor.svelte';
  import {
    configProblems,
    normalizeShippingConfig,
    quoteShipping,
    type ConfigProblem,
    type ProductDeliveryKind,
    type ShippingConfig,
    type ShippingMethod,
    type ShippingOption,
    type ShippingZone
  } from '$lib/shop/shipping';
  import type { ShippingSetup } from '$lib/server/shop/shippingSetup';

  let { data } = $props();
  let projectId = $derived(page.params.projectId ?? '');
  let setup = $derived<ShippingSetup>(data.shipping);

  const clone = (c: ShippingConfig): ShippingConfig => JSON.parse(JSON.stringify(c));
  let draft = $state<ShippingConfig>(untrack(() => clone(data.shipping.config)));
  let saved = $state(untrack(() => JSON.stringify(normalizeShippingConfig(data.shipping.config))));
  // A fresh load (after a save, or another member's) replaces the draft.
  $effect(() => {
    const c = data.shipping.config;
    draft = clone(c);
    saved = JSON.stringify(normalizeShippingConfig(c));
  });
  let dirty = $derived(JSON.stringify(normalizeShippingConfig($state.snapshot(draft))) !== saved);
  let busy = $state(false);
  let openZone = $state<string | null>(null);
  let shownProblems = $state<ConfigProblem[]>([]);

  // The rikma's own currency, never converted: these are the prices being set.
  let moneyFmt = $derived.by(() => {
    try {
      return new Intl.NumberFormat($locale || 'he', { style: 'currency', currency: setup.currency, maximumFractionDigits: 2 });
    } catch {
      return new Intl.NumberFormat($locale || 'he', { maximumFractionDigits: 2 });
    }
  });
  const money = (n: number | null) => (n === null ? '' : moneyFmt.format(n));
  const regionNames = $derived.by(() => {
    try {
      return new Intl.DisplayNames([$locale || 'he'], { type: 'region' });
    } catch {
      return null;
    }
  });
  const countryName = (c: string) => regionNames?.of(c) ?? c;

  function newId(prefix: string, taken: string[]): string {
    for (let i = taken.length + 1; ; i++) if (!taken.includes(`${prefix}${i}`)) return `${prefix}${i}`;
  }
  function newMethod(taken: string[]): ShippingMethod {
    return {
      id: newId('m', taken),
      name: '',
      fee: 0,
      perItem: 0,
      perKg: 0,
      tiersBy: 'none',
      tiers: [],
      freeOver: null,
      minSubtotal: null,
      maxWeightKg: null,
      etaMinDays: null,
      etaMaxDays: null,
      days: [],
      note: null
    };
  }
  function addZone() {
    const id = newId('z', draft.zones.map((z) => z.id));
    draft.zones.push({
      id,
      name: '',
      everywhere: false,
      countries: draft.zones.length ? [] : ['IL'],
      districts: [],
      cities: [],
      postalPrefixes: [],
      methods: [newMethod([])]
    });
    openZone = id;
  }
  function moveZone(i: number, by: number) {
    const j = i + by;
    if (j < 0 || j >= draft.zones.length) return;
    const zones = [...draft.zones];
    [zones[i], zones[j]] = [zones[j], zones[i]];
    draft.zones = zones;
  }
  function addCity(z: ShippingZone, c: PickedCity) {
    if (!z.cities.includes(c.name)) z.cities = [...z.cities, c.name];
  }
  function toggleDistrict(z: ShippingZone, d: string) {
    z.districts = z.districts.includes(d) ? z.districts.filter((x) => x !== d) : [...z.districts, d];
  }
  let countryInput = $state<Record<string, string>>({});
  let postalInput = $state<Record<string, string>>({});
  function addCountries(z: ShippingZone) {
    const codes = (countryInput[z.id] ?? '')
      .split(/[\s,]+/)
      .map((c) => c.trim().toUpperCase())
      .filter((c) => /^[A-Z]{2}$/.test(c));
    z.countries = [...new Set([...z.countries, ...codes])];
    countryInput[z.id] = '';
  }
  function addPostal(z: ShippingZone) {
    const codes = (postalInput[z.id] ?? '')
      .split(/[\s,]+/)
      .map((c) => c.trim())
      .filter((c) => /^[0-9A-Z-]{1,10}$/i.test(c));
    z.postalPrefixes = [...new Set([...z.postalPrefixes, ...codes])];
    postalInput[z.id] = '';
  }

  function coverText(z: ShippingZone): string {
    if (z.everywhere) return $t('shop.ship.coversEverywhere');
    const parts: string[] = [];
    if (z.countries.length) parts.push(z.countries.map(countryName).join(', '));
    if (z.districts.length) parts.push($t('shop.ship.coversDistricts', { list: z.districts.join(', ') }));
    if (z.cities.length)
      parts.push(z.cities.length <= 3 ? z.cities.join(', ') : $t('shop.ship.coversCities', { count: z.cities.length }));
    if (z.postalPrefixes.length) parts.push($t('shop.ship.coversPostal', { list: z.postalPrefixes.join(', ') }));
    return parts.join(' · ') || $t('shop.ship.coversNothing');
  }
  function etaText(min: number | null, max: number | null): string {
    if (min === null && max === null) return '';
    if (min !== null && max !== null && min !== max) return $t('shop.ship.etaRange', { min, max });
    return $t('shop.ship.etaDays', { count: max ?? min });
  }
  function methodText(m: ShippingMethod): string {
    const parts = [m.fee > 0 || m.tiersBy !== 'none' ? money(m.fee) : $t('shop.ship.free')];
    if (m.freeOver !== null) parts.push($t('shop.ship.freeOverShort', { amount: money(m.freeOver) }));
    const eta = etaText(m.etaMinDays, m.etaMaxDays);
    if (eta) parts.push(eta);
    return parts.join(' · ');
  }
  function rulesFor(zoneId: string) {
    // A rule on one of the zone's methods delivers there too (A2).
    return setup.rules.filter((r) => r.zones.includes(zoneId) || (r.methods ?? []).some((m) => m.startsWith(`m:${zoneId}:`)));
  }
  function rulesForMethod(zoneId: string, methodId: string) {
    return setup.rules.filter((r) => (r.methods ?? []).includes(`m:${zoneId}:${methodId}`));
  }
  function rulesForPoint(pointId: string) {
    return setup.rules.filter((r) => (r.points ?? []).includes(pointId));
  }
  const ruleNames = (rules: typeof setup.rules) => rules.map((r) => (r.who ? `${r.name} (${r.who})` : r.name)).join(', ');

  // ── pickup points ──
  function addPoint() {
    draft.pickupPoints.push({
      id: newId('p', draft.pickupPoints.map((p) => p.id)),
      name: '',
      city: null,
      address: null,
      hours: null,
      note: null,
      fee: 0
    });
  }

  // ── product rules ──
  type KindChoice = 'all' | 'pickup' | 'delivery' | 'digital';
  const KIND_CHOICES: KindChoice[] = ['all', 'pickup', 'delivery', 'digital'];
  const kindsFor = (c: KindChoice): ProductDeliveryKind[] | null => (c === 'all' ? null : [c]);
  const choiceOf = (k: ProductDeliveryKind[] | null): KindChoice => (k && k.length === 1 ? k[0] : 'all');
  let productName = $derived(new Map(setup.products.map((p) => [p.id, p.name])));
  let freeProducts = $derived(setup.products.filter((p) => !draft.products.some((r) => r.productId === p.id)));
  let newRuleProduct = $state('');
  function addRule() {
    const id = newRuleProduct || freeProducts[0]?.id;
    if (!id) return;
    draft.products.push({ productId: id, kinds: ['pickup'], surcharge: 0, weightGrams: null });
    newRuleProduct = '';
  }

  // ── preview ──
  let pv = $state({ city: '', district: null as string | null, country: 'IL', value: 200, units: 1, weightKg: 1 });
  let preview = $derived.by(() => {
    const c = normalizeShippingConfig($state.snapshot(draft));
    const units = Math.max(1, Math.round(Number(pv.units) || 1));
    const each = (Number(pv.value) || 0) / units;
    const grams = Math.max(0, Number(pv.weightKg) || 0) * 1000;
    return quoteShipping(
      { ...c, products: [] },
      [{ productId: '0', variantId: null, quantity: units, unitPrice: each, weightGrams: grams / units, productKinds: [] }],
      pv.city || pv.country !== 'IL' ? { country: pv.country || 'IL', city: pv.city || null, district: pv.district } : null
    );
  });
  function optionName(o: ShippingOption): string {
    if (o.kind === 'pickup') return $t('shop.ship.optPickup', { name: o.name });
    if (o.kind === 'digital') return $t('shop.ship.optDigital');
    if (o.kind === 'contact') return $t('shop.ship.optContact');
    return o.name;
  }
  const dateText = (iso: string) =>
    new Intl.DateTimeFormat($locale || 'he', { weekday: 'long', day: 'numeric', month: 'numeric', timeZone: 'UTC' }).format(new Date(iso));

  // ── save ──
  function problemText(p: ConfigProblem): string {
    const zone = 'zoneId' in p ? draft.zones.find((z) => z.id === p.zoneId) : null;
    return $t(`shop.ship.p_${p.kind}`, { name: zone?.name || '—' });
  }
  async function save() {
    if (busy) return;
    const config = normalizeShippingConfig($state.snapshot(draft));
    const problems = configProblems(config);
    shownProblems = problems;
    if (problems.length) {
      const first = problems.find((p) => 'zoneId' in p) as { zoneId: string } | undefined;
      if (first) openZone = first.zoneId;
      return;
    }
    busy = true;
    try {
      const res = await executeAction('saveShippingConfig', { projectId, config });
      if (res?.success === false) throw new Error(actionErrorText(res, $t('shop.ship.error')));
      toast.success($t('shop.ship.saved'));
      await invalidate(shopShippingKey(projectId));
    } catch (e) {
      toast.error(e instanceof Error && e.message ? e.message : $t('shop.ship.error'));
    } finally {
      busy = false;
    }
  }
  function discard() {
    draft = JSON.parse(saved);
    shownProblems = [];
  }

  let updatedWhen = $derived(
    draft.updatedAt ? (formatWhen(draft.updatedAt, clock.minutes, $locale || 'he')?.short ?? '') : ''
  );
</script>

{#if !setup.ready}
  <ShopNotice title={$t('shop.ship.notReady')} body={$t('shop.ship.notReadyBody')} />
{:else}
  <section class="sp-intro sh-card-2">
    <p>{$t('shop.ship.intro')}</p>
    {#if updatedWhen}
      <p class="sp-muted">{$t('shop.ship.updated', { when: updatedWhen, name: setup.updatedByName ?? '—' })}</p>
    {/if}
  </section>

  <section class="sh-card sp-sec">
    <label class="sp-switch">
      <input type="checkbox" bind:checked={draft.enabled} />
      <span>
        <strong>{$t('shop.ship.enabled')}</strong>
        <span class="sp-muted">{draft.enabled ? $t('shop.ship.enabledOn') : $t('shop.ship.enabledOff')}</span>
      </span>
    </label>
    <div class="sp-grid2">
      <label class="sh-field">
        {$t('shop.ship.handling')}
        <input class="sh-input sh-num" type="number" min="0" max="60" step="1" inputmode="numeric" bind:value={draft.handlingDays} />
        <span class="sp-muted">{$t('shop.ship.handlingHint')}</span>
      </label>
      <label class="sp-switch">
        <input type="checkbox" bind:checked={draft.contactFallback} />
        <span>{$t('shop.ship.fallback')}</span>
      </label>
    </div>
  </section>

  <!-- zones -->
  <section class="sp-sec">
    <div class="sp-head">
      <h2 class="sh-section-label">{$t('shop.ship.zones')}</h2>
      <span class="sp-muted">{$t('shop.ship.zonesHint')}</span>
    </div>
    {#if draft.zones.length === 0}
      <ShopNotice title={$t('shop.ship.zonesEmpty')} body={$t('shop.ship.zonesEmptyBody')} action={{ label: $t('shop.ship.addZone'), onclick: addZone }} />
    {:else}
      <ol class="sp-list">
        {#each draft.zones as zone, i (zone.id)}
          {@const rules = rulesFor(zone.id)}
          <li class="sh-card sp-zone" class:sp-open={openZone === zone.id}>
            <div class="sp-zone-head">
              <span class="sp-order" aria-hidden="true">{i + 1}</span>
              <button type="button" class="sp-zone-title" aria-expanded={openZone === zone.id} onclick={() => (openZone = openZone === zone.id ? null : zone.id)}>
                <strong><bdi>{zone.name || $t('shop.ship.zoneUnnamed')}</bdi></strong>
                <span class="sp-muted">{coverText(zone)}</span>
              </button>
              <div class="sp-move">
                <button type="button" class="sh-btn sh-btn-quiet sh-btn-icon" disabled={i === 0} onclick={() => moveZone(i, -1)} aria-label={$t('shop.ship.moveUp')}>↑</button>
                <button type="button" class="sh-btn sh-btn-quiet sh-btn-icon" disabled={i === draft.zones.length - 1} onclick={() => moveZone(i, 1)} aria-label={$t('shop.ship.moveDown')}>↓</button>
              </div>
            </div>

            {#if openZone !== zone.id}
              <ul class="sp-methods">
                {#each zone.methods as m (m.id)}
                  {@const mr = rulesForMethod(zone.id, m.id)}
                  <li>
                    <bdi>{m.name || '—'}</bdi> <span class="sp-muted">{methodText(m)}</span>
                    {#if mr.length}<span class="sp-muted"> · {$t('shop.ship.methodRules', { names: ruleNames(mr) })}</span>{/if}
                  </li>
                {/each}
              </ul>
              {#if rules.length}
                <p class="sp-muted">{$t('shop.ship.zoneRules', { names: rules.map((r) => (r.who ? `${r.name} (${r.who})` : r.name)).join(', ') })}</p>
              {/if}
            {:else}
              <div class="sp-edit">
                <label class="sh-field">
                  {$t('shop.ship.zoneName')}
                  <input class="sh-input" bind:value={zone.name} maxlength="80" placeholder={$t('shop.ship.zoneNamePh')} />
                </label>

                <fieldset class="sh-field sp-fs">
                  <legend>{$t('shop.ship.covers')}</legend>
                  <label class="sp-switch">
                    <input type="checkbox" bind:checked={zone.everywhere} />
                    <span>{$t('shop.ship.everywhere')}</span>
                  </label>
                  {#if !zone.everywhere}
                    <div class="sp-cover">
                      <span class="sp-sub">{$t('shop.ship.countries')}</span>
                      <div class="sp-chips">
                        {#each zone.countries as c (c)}
                          <button type="button" class="sh-chip sh-chip-plain" onclick={() => (zone.countries = zone.countries.filter((x) => x !== c))} aria-label={$t('shop.ship.removeItem', { name: countryName(c) })}>{countryName(c)} ✕</button>
                        {/each}
                      </div>
                      <div class="sp-inline">
                        <input class="sh-input" bind:value={countryInput[zone.id]} placeholder={$t('shop.ship.countriesPh')} onkeydown={(e) => e.key === 'Enter' && (e.preventDefault(), addCountries(zone))} />
                        <button type="button" class="sh-btn sh-btn-outline" onclick={() => addCountries(zone)}>{$t('shop.ship.add')}</button>
                      </div>
                    </div>

                    {#if setup.districts.length}
                      <div class="sp-cover">
                        <span class="sp-sub">{$t('shop.ship.districts')}</span>
                        <div class="sp-chips">
                          {#each setup.districts as d (d)}
                            <button type="button" class="sh-chip" class:sh-chip-accent={zone.districts.includes(d)} aria-pressed={zone.districts.includes(d)} onclick={() => toggleDistrict(zone, d)}>{d}</button>
                          {/each}
                        </div>
                      </div>
                    {/if}

                    <div class="sp-cover">
                      <span class="sp-sub">{$t('shop.ship.cities')}</span>
                      <div class="sp-chips">
                        {#each zone.cities as c (c)}
                          <button type="button" class="sh-chip sh-chip-plain" onclick={() => (zone.cities = zone.cities.filter((x) => x !== c))} aria-label={$t('shop.ship.removeItem', { name: c })}><bdi>{c}</bdi> ✕</button>
                        {/each}
                      </div>
                      <CityPicker placeholder={$t('shop.ship.citiesPh')} onpick={(c) => addCity(zone, c)} />
                    </div>

                    <div class="sp-cover">
                      <span class="sp-sub">{$t('shop.ship.postal')}</span>
                      <div class="sp-chips">
                        {#each zone.postalPrefixes as p (p)}
                          <button type="button" class="sh-chip sh-chip-plain" onclick={() => (zone.postalPrefixes = zone.postalPrefixes.filter((x) => x !== p))} aria-label={$t('shop.ship.removeItem', { name: p })}>{p} ✕</button>
                        {/each}
                      </div>
                      <div class="sp-inline">
                        <input class="sh-input" bind:value={postalInput[zone.id]} placeholder={$t('shop.ship.postalPh')} inputmode="numeric" onkeydown={(e) => e.key === 'Enter' && (e.preventDefault(), addPostal(zone))} />
                        <button type="button" class="sh-btn sh-btn-outline" onclick={() => addPostal(zone)}>{$t('shop.ship.add')}</button>
                      </div>
                    </div>
                  {/if}
                </fieldset>

                <fieldset class="sh-field sp-fs">
                  <legend>{$t('shop.ship.methods')}</legend>
                  {#each zone.methods as m, mi (m.id)}
                    <ShippingMethodEditor bind:method={zone.methods[mi]} onremove={() => (zone.methods = zone.methods.filter((x) => x.id !== m.id))} />
                  {/each}
                  <button type="button" class="sh-btn sh-btn-outline sp-self" onclick={() => zone.methods.push(newMethod(zone.methods.map((x) => x.id)))}>{$t('shop.ship.addMethod')}</button>
                </fieldset>

                <p class="sp-muted">
                  {#if rules.length}
                    {$t('shop.ship.zoneRules', { names: rules.map((r) => (r.who ? `${r.name} (${r.who})` : r.name)).join(', ') })}
                  {:else}
                    {$t('shop.ship.whoDelivers')}
                  {/if}
                  <a href="/moach/{projectId}/sales/manage/fulfillment">{$t('shop.ship.whoDeliversLink')}</a>
                </p>

                <div class="sp-row">
                  <button type="button" class="sh-btn sh-btn-quiet" onclick={() => (openZone = null)}>{$t('shop.ship.done')}</button>
                  <button type="button" class="sh-btn sh-btn-quiet sh-btn-warn" onclick={() => (draft.zones = draft.zones.filter((z) => z.id !== zone.id))}>{$t('shop.ship.removeZone')}</button>
                </div>
              </div>
            {/if}
          </li>
        {/each}
      </ol>
      <button type="button" class="sh-btn sh-btn-outline sp-self" onclick={addZone}>{$t('shop.ship.addZone')}</button>
    {/if}
  </section>

  <!-- pickup points -->
  <section class="sp-sec">
    <div class="sp-head">
      <h2 class="sh-section-label">{$t('shop.ship.pickup')}</h2>
      <span class="sp-muted">{$t('shop.ship.pickupHint')}</span>
    </div>
    {#each draft.pickupPoints as p, pi (p.id)}
      {@const pr = rulesForPoint(p.id)}
      <div class="sh-card sp-point">
        <div class="sp-grid2">
          <label class="sh-field">
            {$t('shop.ship.pickupName')}
            <input class="sh-input" bind:value={draft.pickupPoints[pi].name} maxlength="80" placeholder={$t('shop.ship.pickupNamePh')} />
          </label>
          <label class="sh-field">
            {$t('shop.ship.pickupCity')}
            <CityPicker bind:value={() => draft.pickupPoints[pi].city ?? '', (v) => (draft.pickupPoints[pi].city = v || null)} onpick={(c) => (draft.pickupPoints[pi].city = c.name)} />
          </label>
          <label class="sh-field">
            {$t('shop.ship.pickupAddress')}
            <input class="sh-input" bind:value={draft.pickupPoints[pi].address} maxlength="160" />
          </label>
          <label class="sh-field">
            {$t('shop.ship.pickupHours')}
            <input class="sh-input" bind:value={draft.pickupPoints[pi].hours} maxlength="160" placeholder={$t('shop.ship.pickupHoursPh')} />
          </label>
          <label class="sh-field">
            {$t('shop.ship.pickupFee')}
            <input class="sh-input sh-num" type="number" min="0" step="0.01" inputmode="decimal" bind:value={draft.pickupPoints[pi].fee} />
          </label>
          <label class="sh-field">
            {$t('shop.ship.note')}
            <input class="sh-input" bind:value={draft.pickupPoints[pi].note} maxlength="200" />
          </label>
        </div>
        {#if pr.length}<p class="sp-muted">{$t('shop.ship.pointRules', { names: ruleNames(pr) })}</p>{/if}
        <button type="button" class="sh-btn sh-btn-quiet sh-btn-warn sp-self" onclick={() => (draft.pickupPoints = draft.pickupPoints.filter((x) => x.id !== p.id))}>{$t('shop.ship.remove')}</button>
      </div>
    {/each}
    <button type="button" class="sh-btn sh-btn-outline sp-self" onclick={addPoint}>{$t('shop.ship.addPickup')}</button>
  </section>

  <!-- product rules -->
  <section class="sp-sec">
    <div class="sp-head">
      <h2 class="sh-section-label">{$t('shop.ship.products')}</h2>
      <span class="sp-muted">{$t('shop.ship.productsHint')}</span>
    </div>
    {#each draft.products as r, ri (r.productId)}
      <div class="sh-card sp-rule">
        <strong class="sp-rule-name"><bdi>{productName.get(r.productId) ?? `#${r.productId}`}</bdi></strong>
        <div class="sh-seg" role="group" aria-label={$t('shop.ship.kinds')}>
          {#each KIND_CHOICES as k (k)}
            <button type="button" aria-pressed={choiceOf(r.kinds) === k} onclick={() => (draft.products[ri].kinds = kindsFor(k))}>{$t(`shop.ship.kinds_${k}`)}</button>
          {/each}
        </div>
        <div class="sp-grid2">
          <label class="sh-field">
            {$t('shop.ship.surcharge')}
            <input class="sh-input sh-num" type="number" min="0" step="0.01" inputmode="decimal" bind:value={draft.products[ri].surcharge} />
          </label>
          <label class="sh-field">
            {$t('shop.ship.weight')}
            <input class="sh-input sh-num" type="number" min="0" step="1" inputmode="numeric" bind:value={draft.products[ri].weightGrams} />
          </label>
        </div>
        <button type="button" class="sh-btn sh-btn-quiet sh-btn-warn sp-self" onclick={() => (draft.products = draft.products.filter((x) => x.productId !== r.productId))}>{$t('shop.ship.remove')}</button>
      </div>
    {/each}
    {#if freeProducts.length}
      <div class="sp-inline">
        <select class="sh-input" bind:value={newRuleProduct} aria-label={$t('shop.ship.product')}>
          {#each freeProducts as p (p.id)}
            <option value={p.id}>{p.name}</option>
          {/each}
        </select>
        <button type="button" class="sh-btn sh-btn-outline" onclick={addRule}>{$t('shop.ship.addProduct')}</button>
      </div>
    {/if}
  </section>

  <!-- preview -->
  <section class="sh-card sp-sec sp-preview">
    <h2 class="sh-section-label">{$t('shop.ship.preview')}</h2>
    <div class="sp-grid-pv">
      <label class="sh-field">
        {$t('shop.ship.previewCity')}
        <CityPicker bind:value={pv.city} onpick={(c) => ((pv.city = c.name), (pv.district = c.district))} />
      </label>
      <label class="sh-field">
        {$t('shop.ship.previewCountry')}
        <input class="sh-input" bind:value={pv.country} maxlength="2" />
      </label>
      <label class="sh-field">
        {$t('shop.ship.previewValue')}
        <input class="sh-input sh-num" type="number" min="0" bind:value={pv.value} />
      </label>
      <label class="sh-field">
        {$t('shop.ship.previewUnits')}
        <input class="sh-input sh-num" type="number" min="1" bind:value={pv.units} />
      </label>
      <label class="sh-field">
        {$t('shop.ship.previewWeight')}
        <input class="sh-input sh-num" type="number" min="0" step="0.1" bind:value={pv.weightKg} />
      </label>
    </div>
    {#if !draft.enabled}
      <p class="sp-muted">{$t('shop.ship.previewOff')}</p>
    {/if}
    {#if preview.zone}<p class="sp-muted">{$t('shop.ship.previewZone', { name: preview.zone.name })}</p>{/if}
    {#if preview.needsAddress}<p class="sp-muted">{$t('shop.ship.previewNeedsAddress')}</p>{/if}
    {#if preview.outsideZones}<p class="sp-muted">{$t('shop.ship.previewOutside')}</p>{/if}
    <ul class="sp-options" aria-live="polite">
      {#each preview.options as o (o.id)}
        <li>
          <span><bdi>{optionName(o)}</bdi></span>
          <strong>{o.fee === 0 ? $t('shop.ship.free') : money(o.fee)}</strong>
          <span class="sp-muted sp-opt-sub">
            {etaText(o.etaMinDays, o.etaMaxDays)}
            {#if o.nextDispatch} · {$t('shop.ship.previewNext', { date: dateText(o.nextDispatch) })}{/if}
            {#if o.freeOverRemaining !== null} · {$t('shop.ship.previewFreeIn', { amount: money(o.freeOverRemaining) })}{/if}
          </span>
        </li>
      {/each}
    </ul>
  </section>

  {#if shownProblems.length}
    <section class="sh-card sp-problems" role="alert">
      <strong>{$t('shop.ship.problems')}</strong>
      <ul>
        {#each shownProblems as p, i (i)}<li>{problemText(p)}</li>{/each}
      </ul>
    </section>
  {/if}

  <div class="sp-bar" class:sp-bar-dirty={dirty}>
    <span class="sp-muted">{dirty ? $t('shop.ship.dirty') : $t('shop.ship.clean')}</span>
    <div class="sp-row">
      {#if dirty}<button type="button" class="sh-btn sh-btn-quiet" disabled={busy} onclick={discard}>{$t('shop.ship.discard')}</button>{/if}
      <button type="button" class="sh-btn sh-btn-primary" disabled={busy || !dirty} onclick={save}>{$t('shop.ship.save')}</button>
    </div>
  </div>
{/if}

<style>
  .sp-intro {
    padding: 14px 16px;
    border-radius: var(--sh-radius-sm);
    display: flex;
    flex-direction: column;
    gap: 6px;
    color: var(--sh-ink);
    font-size: 14px;
  }
  .sp-muted {
    color: var(--sh-muted);
    font-size: 13px;
  }
  .sp-sec {
    display: flex;
    flex-direction: column;
    gap: 10px;
    margin-top: 16px;
    color: var(--sh-ink);
  }
  .sh-card.sp-sec {
    padding: 14px 16px;
  }
  .sp-head {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }
  .sp-switch {
    display: flex;
    gap: 10px;
    align-items: flex-start;
    font-size: 14px;
    cursor: pointer;
  }
  .sp-switch input {
    margin-top: 3px;
    width: 18px;
    height: 18px;
    flex: none;
  }
  .sp-switch > span {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }
  .sp-grid2 {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    gap: 10px;
  }
  @media (min-width: 700px) {
    .sp-grid2 {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }
  .sp-list {
    list-style: none;
    padding: 0;
    margin: 0;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  .sp-zone {
    padding: 12px 14px;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .sp-open {
    border-color: var(--sh-gold-line);
  }
  .sp-zone-head {
    display: flex;
    align-items: center;
    gap: 10px;
  }
  .sp-order {
    flex: none;
    width: 26px;
    height: 26px;
    border-radius: 9999px;
    background: var(--sh-accent);
    color: var(--sh-on-accent);
    font-size: 13px;
    font-weight: 700;
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }
  .sp-zone-title {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 2px;
    background: none;
    border: 0;
    padding: 4px 0;
    text-align: start;
    color: var(--sh-ink);
    font: inherit;
    cursor: pointer;
  }
  .sp-zone-title .sp-muted {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .sp-move {
    display: flex;
    gap: 2px;
    flex: none;
  }
  .sp-methods {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 2px;
    font-size: 14px;
  }
  .sp-edit {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  .sp-fs {
    border: 0;
    padding: 0;
    margin: 0;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  .sp-cover {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  .sp-sub {
    font-size: 13px;
    font-weight: 700;
  }
  .sp-chips {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }
  .sp-chips button {
    cursor: pointer;
    border: 1px solid var(--sh-line);
  }
  .sp-inline {
    display: flex;
    gap: 8px;
  }
  .sp-inline > :first-child {
    flex: 1;
    min-width: 0;
  }
  .sp-row {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }
  .sp-self {
    align-self: flex-start;
  }
  .sp-point,
  .sp-rule {
    padding: 12px 14px;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  .sp-rule-name {
    font-size: 15px;
  }
  .sp-grid-pv {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 10px;
  }
  .sp-grid-pv > :first-child {
    grid-column: 1 / -1;
  }
  @media (min-width: 900px) {
    .sp-grid-pv {
      grid-template-columns: 2fr 1fr 1fr 1fr 1fr;
    }
    .sp-grid-pv > :first-child {
      grid-column: auto;
    }
  }
  .sp-options {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .sp-options li {
    display: grid;
    grid-template-columns: 1fr auto;
    gap: 2px 12px;
    padding: 10px 12px;
    border: 1px solid var(--sh-line);
    border-radius: var(--sh-radius-sm);
    font-size: 14px;
  }
  .sp-opt-sub {
    grid-column: 1 / -1;
  }
  .sp-opt-sub:empty {
    display: none;
  }
  .sp-problems {
    margin-top: 16px;
    padding: 12px 14px;
    border-color: var(--sh-warn-line);
    background: var(--sh-warn-tint);
    color: var(--sh-ink);
    font-size: 14px;
  }
  .sp-problems ul {
    margin: 6px 0 0;
    padding-inline-start: 18px;
  }
  .sp-bar {
    position: sticky;
    bottom: 0;
    margin: 16px -16px 0;
    padding: 12px 16px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    flex-wrap: wrap;
    background: color-mix(in srgb, var(--sh-card) 94%, transparent);
    backdrop-filter: blur(12px);
    border-top: 1px solid var(--sh-line);
    z-index: 6;
  }
  .sp-bar-dirty {
    border-top-color: var(--sh-gold-line);
  }
  @media (min-width: 900px) {
    .sp-bar {
      margin: 16px 0 0;
      border-radius: var(--sh-radius-sm);
      border: 1px solid var(--sh-line);
    }
  }
</style>
