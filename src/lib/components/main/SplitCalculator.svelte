<script>
  /**
   * מחשבון חלוקה חי לעמוד הבית — ציבורי, בלי הרשמה.
   *
   * מריץ את אותה נוסחה שהמערכת מריצה ב‑`prPr/hachcal.svelte`: הערך שכל שותף
   * הכניס (שעות × תעריף, ועוד כסף/ציוד) חלקי סך הערך של כולם. ההשוואה
   * ל"חצי‑חצי" היא כל הפואנטה של הבלוק — היא מראה במספרים כמה החלוקה השווה
   * עולה למי שנתן יותר.
   */
  import { t, locale } from '$lib/translations';

  const PALETTE = ['#ff0092', '#e0a800', '#3aa7a0', '#8b5cf6'];
  const MAX_PARTNERS = 4;

  /** ברירות מחדל שמספרות את הסיפור: אחד נתן הרבה יותר, ומקבל אותו דבר. */
  const SEED = [
    { hours: 60, rate: 100, res: 2000 },
    { hours: 25, rate: 100, res: 0 },
    { hours: 20, rate: 100, res: 500 },
    { hours: 10, rate: 100, res: 1500 }
  ];

  /**
   * `id` is minted, never derived from the position: removing a middle partner
   * and then adding one would otherwise reuse a live id and break the keyed
   * `{#each}`. `slot` only picks which seed numbers to start from.
   */
  let nextId = 0;
  const seedRow = (slot) => ({ id: nextId++, name: '', ...SEED[slot] });

  let partners = $state([seedRow(0), seedRow(1)]);
  let revenue = $state(20000);

  const num = (v) => (Number.isFinite(+v) && +v > 0 ? +v : 0);
  const valueOf = (p) => num(p.hours) * num(p.rate) + num(p.res);

  let net = $derived(partners.reduce((sum, p) => sum + valueOf(p), 0));
  let rows = $derived(
    partners.map((p, i) => {
      const value = valueOf(p);
      const share = net > 0 ? (value / net) * 100 : 0;
      const byWork = (num(revenue) * share) / 100;
      const equal = num(revenue) / partners.length;
      return {
        p,
        i,
        value,
        share,
        byWork,
        equal,
        delta: byWork - equal,
        color: PALETTE[i % PALETTE.length],
        label: p.name.trim() || $t(`home.split.calc.p${i + 1}`)
      };
    })
  );

  /**
   * `style: 'currency'` and not "number + symbol": it is the only way the
   * symbol lands on the right side of the number in every locale ($15,238 in
   * en, ‏15,238 ₪ in he, 15.238 € in es).
   */
  let money = $derived(
    new Intl.NumberFormat($locale, {
      style: 'currency',
      currency: $t('home.split.calc.currencyCode'),
      maximumFractionDigits: 0
    })
  );
  /** `signDisplay` and not a hand-written `+`/`−`: same reason as above. */
  let moneySigned = $derived(
    new Intl.NumberFormat($locale, {
      style: 'currency',
      currency: $t('home.split.calc.currencyCode'),
      maximumFractionDigits: 0,
      signDisplay: 'exceptZero'
    })
  );
  let pct = $derived(
    new Intl.NumberFormat($locale, { maximumFractionDigits: 1 })
  );

  function addPartner() {
    if (partners.length >= MAX_PARTNERS) return;
    partners.push(seedRow(partners.length));
  }

  function removePartner(i) {
    if (partners.length <= 2) return;
    partners.splice(i, 1);
  }

  function reset() {
    partners = [seedRow(0), seedRow(1)];
    revenue = 20000;
  }
</script>

<div
  id="calc"
  class="scroll-mt-16 rounded-2xl border-2 border-barbi/60 bg-cyan-50/80 backdrop-blur-sm px-4 py-5 shadow-lg"
>
  <h3 class="text-rose-700 font-bold text-2xl sm:text-xl mb-1 text-center">
    {$t('home.split.calc.title')}
  </h3>
  <p class="text-slate-700 text-base sm:text-sm leading-relaxed text-center mb-4">
    {$t('home.split.calc.sub')}
  </p>

  <!-- קלט: מה כל שותף/ה הכניס/ה -->
  <div class="flex flex-col gap-3">
    {#each rows as row (row.p.id)}
      <div
        class="rounded-xl border-2 bg-white/70 px-3 py-3 shadow-sm"
        style="border-color: {row.color}66;"
      >
        <div class="flex items-center gap-2 mb-2">
          <span
            class="shrink-0 w-3 h-3 rounded-full"
            style="background-color: {row.color};"
          ></span>
          <input
            type="text"
            bind:value={row.p.name}
            placeholder={$t(`home.split.calc.p${row.i + 1}`)}
            aria-label={$t('home.split.calc.nameLabel')}
            class="flex-1 min-w-0 bg-transparent text-rose-800 font-bold text-lg sm:text-base border-b border-transparent focus:border-barbi focus:outline-none"
          />
          <span class="shrink-0 text-slate-500 text-sm tabular-nums">
            {money.format(row.value)}
          </span>
          {#if partners.length > 2}
            <button
              type="button"
              onclick={() => removePartner(row.i)}
              aria-label={$t('home.split.calc.removePartner')}
              title={$t('home.split.calc.removePartner')}
              class="shrink-0 w-6 h-6 rounded-full bg-slate-100 hover:bg-rose-100 text-slate-500 hover:text-rose-600 flex items-center justify-center text-sm font-bold transition-colors"
            >
              ✕
            </button>
          {/if}
        </div>
        <div class="grid grid-cols-3 gap-2">
          {#each ['hours', 'rate', 'res'] as field (field)}
            <label class="flex flex-col gap-1 text-start">
              <span class="text-slate-600 text-xs sm:text-[11px]">
                {$t(`home.split.calc.${field}`)}
              </span>
              <input
                type="number"
                min="0"
                step={field === 'hours' ? 1 : field === 'rate' ? 5 : 100}
                bind:value={row.p[field]}
                class="w-full min-w-0 rounded-lg border border-gold/70 bg-white px-2 py-1.5 text-slate-900 text-base sm:text-sm tabular-nums focus:border-barbi focus:outline-none"
              />
            </label>
          {/each}
        </div>
      </div>
    {/each}
  </div>

  <div class="mt-3 flex flex-wrap items-center justify-center gap-2">
    {#if partners.length < MAX_PARTNERS}
      <button
        type="button"
        onclick={addPartner}
        class="bg-gold hover:bg-barbi hover:text-gold text-barbi font-bold text-base sm:text-sm px-4 py-2 rounded-xl shadow transition-colors"
      >
        {$t('home.split.calc.addPartner')}
      </button>
    {/if}
    <button
      type="button"
      onclick={reset}
      class="text-slate-600 hover:text-barbi font-semibold text-base sm:text-sm px-3 py-2 underline decoration-dotted transition-colors"
    >
      {$t('home.split.calc.reset')}
    </button>
  </div>

  <!-- ההכנסה שנכנסה לריקמה -->
  <label
    class="mt-4 flex flex-wrap items-center justify-center gap-2 text-slate-800 text-base sm:text-sm"
  >
    <span class="font-semibold">{$t('home.split.calc.revenue')}</span>
    <input
      type="number"
      min="0"
      step="1000"
      bind:value={revenue}
      class="w-32 rounded-lg border-2 border-gold bg-white px-2 py-1.5 text-slate-900 text-base sm:text-sm tabular-nums focus:border-barbi focus:outline-none"
    />
    <span>{$t('home.split.calc.currency')}</span>
  </label>

  <!-- הפלט: החלק של כל אחד, ומה זה אומר מול חצי‑חצי -->
  {#if net > 0}
    <div
      class="mt-4 flex h-4 w-full overflow-hidden rounded-full border border-white/70 shadow-inner"
      role="img"
      aria-label={$t('home.split.calc.barLabel')}
    >
      {#each rows as row (row.p.id)}
        <div
          class="h-full transition-all duration-300"
          style="width: {row.share}%; background-color: {row.color};"
        ></div>
      {/each}
    </div>

    <div class="mt-3 flex flex-col gap-2">
      {#each rows as row (row.p.id)}
        <div
          class="rounded-xl border border-gold/60 bg-white/80 px-3 py-2.5 shadow-sm"
        >
          <div class="flex items-baseline justify-between gap-2">
            <span
              class="font-bold text-base sm:text-sm truncate"
              style="color: {row.color};">{row.label}</span
            >
            <span class="text-rose-700 font-bold text-xl sm:text-lg tabular-nums">
              {pct.format(row.share)}%
            </span>
          </div>
          <div
            class="mt-1 flex flex-wrap items-baseline gap-x-3 gap-y-1 text-sm sm:text-xs"
          >
            <span class="text-slate-800">
              {$t('home.split.calc.calcLabel')}
              <strong class="tabular-nums">{money.format(row.byWork)}</strong>
            </span>
            <span class="text-slate-500">
              {$t('home.split.calc.equalLabel')}
              <span class="tabular-nums">{money.format(row.equal)}</span>
            </span>
            {#if Math.abs(row.delta) >= 1}
              <span
                class="font-bold tabular-nums {row.delta > 0
                  ? 'text-emerald-600'
                  : 'text-rose-600'}"
              >
                {moneySigned.format(row.delta)}
              </span>
            {/if}
          </div>
        </div>
      {/each}
    </div>

    <p
      class="mt-3 text-center text-rose-700 font-semibold text-base sm:text-sm leading-relaxed"
    >
      {$t('home.split.calc.punch')}
    </p>
  {:else}
    <p class="mt-4 text-center text-slate-600 text-base sm:text-sm">
      {$t('home.split.calc.empty')}
    </p>
  {/if}

  <p
    class="mt-4 text-center text-slate-600 text-sm sm:text-xs leading-relaxed border-t border-gold/50 pt-3"
  >
    {$t('home.split.calc.note')}
  </p>
</div>
