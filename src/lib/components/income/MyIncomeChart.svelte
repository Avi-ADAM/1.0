<script>
  /**
   * MyIncomeChart — one currency of a member's own earnings, month by month.
   *
   * Deliberately the same reading as the homepage graph: the y-axis is what
   * arrived *that month*, not a running total, because the claim being checked
   * is about the shape of an income over time and a cumulative line rises for
   * everyone. The running total is a headline number instead.
   *
   * Bars are stacked by rikma, which is the second half of the same claim — the
   * partner track grows by holding several partnerships at once, and a stack is
   * what that looks like when it is true. Months with no payout are drawn as
   * empty slots rather than skipped: a gap is information.
   *
   * Everything here arrives already computed from
   * `$lib/income/buildIncomeSeries`; this file only measures and draws.
   */
  import { t, locale } from '$lib/translations';

  /**
   * @typedef {import('$lib/income/buildIncomeSeries.js').IncomeSeries} IncomeSeries
   * @typedef {{ series: IncomeSeries }} Props
   */

  /** @type {Props} */
  let { series } = $props();

  /** Same family as the homepage split calculator, so one rikma reads as one colour. */
  const PALETTE = [
    '#ff0092',
    '#e0a800',
    '#3aa7a0',
    '#8b5cf6',
    '#f97316',
    '#0ea5e9',
    '#16a34a',
    '#e11d48'
  ];

  const W = 640;
  const H = 240;
  const PAD = { top: 12, right: 8, bottom: 30, left: 8 };
  const plotW = W - PAD.left - PAD.right;
  const plotH = H - PAD.top - PAD.bottom;

  /** @type {(n: number) => string} */
  let fmt = $derived((n) =>
    new Intl.NumberFormat($locale || 'he', { maximumFractionDigits: 0 }).format(n)
  );

  let money = $derived(
    (/** @type {number} */ n) => `${fmt(n)} ${series.currency}`.trim()
  );

  let colorOf = $derived.by(() => {
    /** @type {Record<string, string>} */
    const map = {};
    series.rikmas.forEach((r, i) => {
      map[r.id] = PALETTE[i % PALETTE.length];
    });
    return map;
  });

  let months = $derived(series.months);
  /** The tallest month sets the scale; a flat-zero series still needs a divisor. */
  let peak = $derived(Math.max(1, ...months.map((m) => m.total)));

  let band = $derived(months.length > 0 ? plotW / months.length : plotW);
  /** Bars keep a hairline gap between them, and never vanish on a long span. */
  let barW = $derived(Math.max(1.5, band * 0.72));

  /**
   * One rectangle per rikma per month, stacked bottom-up in the legend's own
   * order so the same rikma sits at the same height in every bar.
   */
  let bars = $derived.by(() => {
    const order = series.rikmas.map((r) => r.id);
    /** @type {{key:string,x:number,y:number,w:number,h:number,fill:string,label:string}[]} */
    const out = [];
    months.forEach((m, i) => {
      let stacked = 0;
      for (const id of order) {
        const amount = m.byRikma[id];
        if (!amount) continue;
        const h = (amount / peak) * plotH;
        stacked += h;
        const name = series.rikmas.find((r) => r.id === id)?.name ?? '';
        out.push({
          key: `${m.month}:${id}`,
          x: PAD.left + i * band + (band - barW) / 2,
          y: PAD.top + plotH - stacked,
          w: barW,
          h,
          fill: colorOf[id] ?? PALETTE[0],
          label: `${m.month} · ${name} · ${money(amount)}`
        });
      }
    });
    return out;
  });

  /** Label the first month and every January, so a long span reads as years. */
  let xLabels = $derived(
    months
      .map((m, i) => ({ m, i }))
      .filter(({ m, i }) => i === 0 || m.month.endsWith('-01'))
      .map(({ m, i }) => ({
        key: m.month,
        x: PAD.left + i * band + band / 2,
        text: m.month.slice(0, 4)
      }))
  );
</script>

<div>
  <div dir="ltr">
    <svg
      viewBox="0 0 {W} {H}"
      class="w-full h-auto"
      role="img"
      aria-label="{$t('me.income.chartAria')} {money(series.total)}"
    >
      <!-- The tallest month, as the one number that gives the bars a size. -->
      <line
        x1={PAD.left}
        x2={W - PAD.right}
        y1={PAD.top}
        y2={PAD.top}
        stroke="#e2e8f0"
        stroke-width="1"
        stroke-dasharray="3 4"
      />
      <text x={PAD.left} y={PAD.top - 2} class="fill-slate-400" style="font-size:10px">
        {money(peak)}
      </text>

      {#each bars as bar (bar.key)}
        <rect x={bar.x} y={bar.y} width={bar.w} height={bar.h} fill={bar.fill} rx="1">
          <title>{bar.label}</title>
        </rect>
      {/each}

      <line
        x1={PAD.left}
        x2={W - PAD.right}
        y1={PAD.top + plotH}
        y2={PAD.top + plotH}
        stroke="#94a3b8"
        stroke-width="1"
      />
      {#each xLabels as label (label.key)}
        <text
          x={label.x}
          y={PAD.top + plotH + 14}
          text-anchor="middle"
          class="fill-slate-400"
          style="font-size:10px">{label.text}</text
        >
      {/each}
    </svg>
  </div>

  <ul class="flex flex-wrap justify-center gap-x-4 gap-y-1 mt-2">
    {#each series.rikmas as rikma (rikma.id)}
      <li class="flex items-center gap-1.5 text-xs text-slate-700">
        <span
          class="inline-block w-3 h-3 rounded-sm shrink-0"
          style="background:{colorOf[rikma.id]}"
        ></span>
        <span class="font-medium">{rikma.name}</span>
        <span class="text-slate-500">
          {money(rikma.total)} · {Math.round(rikma.share * 100)}%
        </span>
      </li>
    {/each}
  </ul>
</div>
