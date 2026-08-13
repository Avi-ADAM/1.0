<script>
  /**
   * מחשבון חלוקה חי לעמוד הבית — ציבורי, בלי הרשמה.
   *
   * מריץ את אותה נוסחה שהמערכת מריצה ב‑`prPr/hachcal.svelte`: הערך שכל שותף
   * הכניס (משימות לפי זמן × תעריף, ועוד כסף/ציוד) חלקי סך הערך של כולם.
   * ההשוואה ל"חצי‑חצי" היא כל הפואנטה של הבלוק — היא מראה במספרים כמה החלוקה
   * השווה עולה למי שנתן יותר.
   *
   * ההשקעה של כל שותף/ה מפורטת לשורות ולא מסוכמת למספר אחד, כי המספר האחד הוא
   * בדיוק מה שאי אפשר להתווכח עליו — ומה שאפשר להתווכח עליו נראה רק כשרואים
   * ממה הוא מורכב. הזמן נכתב `שעות:דקות` כי כך המערכת מודדת אותו (טיימר, לא
   * הערכה בדיעבד), וההכנסה מפורטת למכירות מאותה סיבה.
   */
  import { t, locale } from '$lib/translations';

  const PALETTE = ['#ff0092', '#e0a800', '#3aa7a0', '#8b5cf6'];
  const MAX_PARTNERS = 4;
  const MAX_TASKS = 6;
  const MAX_COSTS = 4;
  const MAX_SALES = 5;

  /**
   * נתוני הפתיחה הם ריקמה אחת שלמה ועקבית — ייבוא ומכירה אונליין: מי בנה את
   * אתר המכירות, מי סגר את הספק והמכס, מה נקנה בכסף, ומה נמכר בסוף. `k` הוא
   * מפתח תרגום ולא טקסט, כדי שהשורות יישארו קריאות בכל שפה.
   */
  const SEED_PARTNERS = [
    {
      k: 'p1',
      tasks: [
        { k: 'p1t1', h: 50, m: 0, rate: 100 },
        { k: 'p1t2', h: 22, m: 30, rate: 100 },
        { k: 'p1t3', h: 14, m: 20, rate: 100 }
      ],
      costs: [{ k: 'p1c1', amount: 1200 }]
    },
    {
      k: 'p2',
      tasks: [
        { k: 'p2t1', h: 20, m: 0, rate: 100 },
        { k: 'p2t2', h: 15, m: 25, rate: 100 }
      ],
      costs: [{ k: 'p2c1', amount: 1800 }]
    },
    {
      k: 'p3',
      tasks: [
        { k: 'p3t1', h: 18, m: 40, rate: 90 },
        { k: 'p3t2', h: 9, m: 15, rate: 90 }
      ],
      costs: [{ k: 'p3c1', amount: 450 }]
    },
    {
      k: 'p4',
      tasks: [{ k: 'p4t1', h: 6, m: 30, rate: 120 }],
      costs: [{ k: 'p4c1', amount: 900 }]
    }
  ];

  const SEED_SALES = [
    { k: 's1', price: 89, qty: 120 },
    { k: 's2', price: 149, qty: 45 },
    { k: 's3', price: 25, qty: 60 }
  ];

  /**
   * `id` is minted, never derived from the position: removing a middle row and
   * then adding one would otherwise reuse a live id and break the keyed
   * `{#each}`. `slot` only picks which seed numbers to start from.
   */
  let nextId = 0;
  const uid = () => nextId++;

  const seedPartner = (slot) => {
    const s = SEED_PARTNERS[slot];
    return {
      id: uid(),
      key: s.k,
      name: '',
      tasks: s.tasks.map((x) => ({ id: uid(), name: '', ...x })),
      costs: s.costs.map((x) => ({ id: uid(), name: '', ...x }))
    };
  };
  const seedSales = () => SEED_SALES.map((x) => ({ id: uid(), name: '', ...x }));

  let partners = $state([seedPartner(0), seedPartner(1)]);
  let sales = $state(seedSales());

  const num = (v) => (Number.isFinite(+v) && +v > 0 ? +v : 0);
  /** דקות ולא עשרוני: 15:25 זה 15.4167 שעות, וזה מה שהטיימר באמת מדד. */
  const taskValue = (task) => (num(task.h) + num(task.m) / 60) * num(task.rate);
  const saleValue = (sale) => num(sale.price) * num(sale.qty);
  const valueOf = (p) =>
    p.tasks.reduce((sum, task) => sum + taskValue(task), 0) +
    p.costs.reduce((sum, cost) => sum + num(cost.amount), 0);

  /** שם שהוקלד גובר על שם הדוגמה; אחרת נופלים על מפתח התרגום. */
  const nameOf = (row, fallbackKey) =>
    row.name.trim() || $t(`home.split.calc.seed.${row.k || fallbackKey}`);

  let revenue = $derived(sales.reduce((sum, s) => sum + saleValue(s), 0));
  let net = $derived(partners.reduce((sum, p) => sum + valueOf(p), 0));
  let rows = $derived(
    partners.map((p, i) => {
      const value = valueOf(p);
      const share = net > 0 ? (value / net) * 100 : 0;
      const byWork = (revenue * share) / 100;
      const equal = revenue / partners.length;
      return {
        p,
        i,
        value,
        share,
        byWork,
        equal,
        delta: byWork - equal,
        color: PALETTE[i % PALETTE.length],
        label: p.name.trim() || $t(`home.split.calc.${p.key}`)
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

  /**
   * סימן המטבע ליד שדה קלט מגיע מ‑`formatToParts` ולא ממחרוזת בתרגום, כי גם
   * הצד שלו משתנה בין שפות: ‎$1,200‎ באנגלית מול ‎1,200 ₪‎ בעברית.
   */
  let symbolParts = $derived(money.formatToParts(1));
  let symbol = $derived(
    symbolParts.find((p) => p.type === 'currency')?.value ?? ''
  );
  let symbolFirst = $derived(symbolParts[0]?.type === 'currency');

  function addPartner() {
    if (partners.length >= MAX_PARTNERS) return;
    /* השורה הפנויה ולא הבאה בתור: אחרי הסרת שותף אמצעי, "הבאה בתור" הייתה
       משכפלת דוגמה שכבר על המסך — שני שותפים באותו שם. */
    const used = new Set(partners.map((p) => p.key));
    const slot = SEED_PARTNERS.findIndex((s) => !used.has(s.k));
    partners.push(seedPartner(slot === -1 ? partners.length : slot));
  }
  function removePartner(i) {
    if (partners.length <= 2) return;
    partners.splice(i, 1);
  }
  function addTask(p) {
    if (p.tasks.length >= MAX_TASKS) return;
    p.tasks.push({ id: uid(), k: '', name: '', h: 1, m: 0, rate: 100 });
  }
  function addCost(p) {
    if (p.costs.length >= MAX_COSTS) return;
    p.costs.push({ id: uid(), k: '', name: '', amount: 500 });
  }
  function addSale() {
    if (sales.length >= MAX_SALES) return;
    sales.push({ id: uid(), k: '', name: '', price: 100, qty: 10 });
  }
  function drop(list, i) {
    list.splice(i, 1);
  }
  function reset() {
    partners = [seedPartner(0), seedPartner(1)];
    sales = seedSales();
  }
</script>

{#snippet lineName(row, fallbackKey, aria)}
  <input
    type="text"
    bind:value={row.name}
    placeholder={nameOf(row, fallbackKey)}
    aria-label={$t(`home.split.calc.${aria}`)}
    class="w-full min-w-0 bg-transparent text-slate-800 text-sm sm:text-xs font-semibold border-b border-transparent placeholder:text-slate-500 placeholder:font-normal focus:border-barbi focus:outline-none"
  />
{/snippet}

{#snippet moneyField(row, field, aria, step)}
  <span class="flex items-center gap-1">
    {#if symbolFirst}
      <span class="text-slate-500 text-xs">{symbol}</span>
    {/if}
    <input
      type="number"
      min="0"
      {step}
      bind:value={row[field]}
      aria-label={$t(`home.split.calc.${aria}`)}
      class="w-20 rounded border border-gold/70 bg-white px-1 py-0.5 text-center text-slate-900 text-sm tabular-nums focus:border-barbi focus:outline-none"
    />
    {#if !symbolFirst}
      <span class="text-slate-500 text-xs">{symbol}</span>
    {/if}
  </span>
{/snippet}

{#snippet dropBtn(list, i, aria)}
  <button
    type="button"
    onclick={() => drop(list, i)}
    aria-label={$t(`home.split.calc.${aria}`)}
    title={$t(`home.split.calc.${aria}`)}
    class="shrink-0 w-6 h-6 rounded-full bg-slate-100 hover:bg-rose-100 text-slate-500 hover:text-rose-600 flex items-center justify-center text-xs font-bold transition-colors"
  >
    ✕
  </button>
{/snippet}

<div
  id="calc"
  class="scroll-mt-16 rounded-2xl border-2 border-barbi/60 bg-cyan-50/80 backdrop-blur-sm px-3 sm:px-4 py-5 shadow-lg"
>
  <h3 class="text-rose-700 font-bold text-2xl sm:text-xl mb-1 text-center">
    {$t('home.split.calc.title')}
  </h3>
  <p class="text-slate-700 text-base sm:text-sm leading-relaxed text-center mb-4">
    {$t('home.split.calc.sub')}
  </p>

  <!-- קלט: מה כל שותף/ה הכניס/ה, שורה שורה -->
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
            placeholder={$t(`home.split.calc.${row.p.key}`)}
            aria-label={$t('home.split.calc.nameLabel')}
            class="flex-1 min-w-0 bg-transparent text-rose-800 font-bold text-lg sm:text-base border-b border-transparent placeholder:text-rose-800 focus:border-barbi focus:outline-none"
          />
          <span class="shrink-0 text-slate-600 text-sm font-semibold tabular-nums">
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

        <!-- משימות: זמן × תעריף -->
        <p class="text-slate-600 text-xs font-semibold mb-1">
          {$t('home.split.calc.tasksTitle')}
        </p>
        <div class="flex flex-col gap-1.5">
          {#each row.p.tasks as task, ti (task.id)}
            <div class="rounded-lg border border-gold/50 bg-white px-2 py-1.5">
              {@render lineName(task, 'task', 'taskLabel')}
              <div class="mt-1 flex flex-wrap items-center gap-x-1.5 gap-y-1">
                <span
                  dir="ltr"
                  class="flex items-center gap-0.5 text-slate-500 text-xs"
                >
                  <input
                    type="number"
                    min="0"
                    step="1"
                    bind:value={task.h}
                    aria-label={$t('home.split.calc.hoursLabel')}
                    class="w-11 rounded border border-gold/70 bg-white px-1 py-0.5 text-center text-slate-900 text-sm tabular-nums focus:border-barbi focus:outline-none"
                  />
                  <span class="font-bold">:</span>
                  <input
                    type="number"
                    min="0"
                    max="59"
                    step="5"
                    bind:value={task.m}
                    aria-label={$t('home.split.calc.minutesLabel')}
                    class="w-11 rounded border border-gold/70 bg-white px-1 py-0.5 text-center text-slate-900 text-sm tabular-nums focus:border-barbi focus:outline-none"
                  />
                </span>
                <span class="text-slate-500 text-xs">×</span>
                <input
                  type="number"
                  min="0"
                  step="5"
                  bind:value={task.rate}
                  aria-label={$t('home.split.calc.rateLabel')}
                  class="w-14 rounded border border-gold/70 bg-white px-1 py-0.5 text-center text-slate-900 text-sm tabular-nums focus:border-barbi focus:outline-none"
                />
                <span class="text-slate-500 text-xs"
                  >{$t('home.split.calc.perHour')}</span
                >
                <span
                  class="ms-auto text-slate-700 text-sm font-semibold tabular-nums"
                >
                  {money.format(taskValue(task))}
                </span>
                {@render dropBtn(row.p.tasks, ti, 'removeLine')}
              </div>
            </div>
          {/each}
        </div>
        {#if row.p.tasks.length < MAX_TASKS}
          <button
            type="button"
            onclick={() => addTask(row.p)}
            class="mt-1.5 text-barbi hover:text-rose-700 text-xs font-bold underline decoration-dotted transition-colors"
          >
            {$t('home.split.calc.addTask')}
          </button>
        {/if}

        <!-- כסף וציוד -->
        <p class="text-slate-600 text-xs font-semibold mt-3 mb-1">
          {$t('home.split.calc.costsTitle')}
        </p>
        <div class="flex flex-col gap-1.5">
          {#each row.p.costs as cost, ci (cost.id)}
            <div
              class="rounded-lg border border-gold/50 bg-white px-2 py-1.5 flex flex-wrap items-center gap-x-1.5 gap-y-1"
            >
              <span class="flex-1 min-w-[8rem]">
                {@render lineName(cost, 'cost', 'costLabel')}
              </span>
              {@render moneyField(cost, 'amount', 'amountLabel', 100)}
              {@render dropBtn(row.p.costs, ci, 'removeLine')}
            </div>
          {/each}
        </div>
        {#if row.p.costs.length < MAX_COSTS}
          <button
            type="button"
            onclick={() => addCost(row.p)}
            class="mt-1.5 text-barbi hover:text-rose-700 text-xs font-bold underline decoration-dotted transition-colors"
          >
            {$t('home.split.calc.addCost')}
          </button>
        {/if}
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

  <p class="mt-2 text-center text-slate-600 text-xs leading-relaxed">
    {$t('home.split.calc.timerNote')}
  </p>

  <!-- ההכנסה: לא מספר שנופל מהשמיים, אלא המכירות שהיו -->
  <div class="mt-4 rounded-xl border-2 border-gold bg-white/70 px-3 py-3">
    <p class="text-slate-800 text-base sm:text-sm font-bold mb-2">
      {$t('home.split.calc.salesTitle')}
    </p>
    <div class="flex flex-col gap-1.5">
      {#each sales as sale, si (sale.id)}
        <div class="rounded-lg border border-gold/50 bg-white px-2 py-1.5">
          {@render lineName(sale, 'sale', 'productLabel')}
          <div class="mt-1 flex flex-wrap items-center gap-x-1.5 gap-y-1">
            {@render moneyField(sale, 'price', 'priceLabel', 1)}
            <span class="text-slate-500 text-xs">×</span>
            <input
              type="number"
              min="0"
              step="5"
              bind:value={sale.qty}
              aria-label={$t('home.split.calc.qtyLabel')}
              class="w-16 rounded border border-gold/70 bg-white px-1 py-0.5 text-center text-slate-900 text-sm tabular-nums focus:border-barbi focus:outline-none"
            />
            <span class="text-slate-500 text-xs"
              >{$t('home.split.calc.qtyUnit')}</span
            >
            <span
              class="ms-auto text-slate-700 text-sm font-semibold tabular-nums"
            >
              {money.format(saleValue(sale))}
            </span>
            {@render dropBtn(sales, si, 'removeLine')}
          </div>
        </div>
      {/each}
    </div>
    <div class="mt-2 flex flex-wrap items-baseline justify-between gap-2">
      {#if sales.length < MAX_SALES}
        <button
          type="button"
          onclick={addSale}
          class="text-barbi hover:text-rose-700 text-xs font-bold underline decoration-dotted transition-colors"
        >
          {$t('home.split.calc.addProduct')}
        </button>
      {:else}
        <span></span>
      {/if}
      <span class="text-slate-800 text-base sm:text-sm font-bold">
        {$t('home.split.calc.revenue')}
        <span class="tabular-nums text-rose-700">{money.format(revenue)}</span>
      </span>
    </div>
  </div>

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
