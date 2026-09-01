<script>
  /**
   * IncomeCurves — the homepage graph: what a living looks like over ten years
   * as an employee, as a freelancer, and as a partner in a rikma.
   *
   * The whole argument is in the shape, not in the numbers, so the y-axis is
   * deliberately an index (a first-year salary = 100) rather than a currency.
   * The model itself lives in `$lib/income/incomeCurves.js` — pure and unit
   * tested — because the claim this section makes is exactly the kind that
   * should be checkable rather than hand-drawn.
   *
   * The one control is the year the visitor stops working, and it is the point
   * of the block: before it the three lines are just three careers, and after
   * it two of them end. Making the visitor move that year themselves is what
   * turns "a partnership keeps paying" from a slogan into something they watched
   * happen.
   *
   * Time runs left→right in every language (`dir="ltr"` on the plot). A mirrored
   * time axis is not a convention anywhere, and the tick labels are digits.
   */
  import { t } from '$lib/translations';
  import { motionMode, MOTION_MODES } from '$lib/stores/motion.js';
  import {
    CLIFF_EPSILON,
    EMPLOYEE_BASE,
    PARTNERSHIPS,
    buildAllCurves,
    curvesMax,
    employeeAt,
    freelancerAt,
    lifetimeTotal,
    partnerAt
  } from '$lib/income/incomeCurves.js';

  const YEARS = 10;
  const DEFAULT_STOP = 7;
  /** How long after the stop the "and then?" column looks. */
  const LOOK_AHEAD = 3;

  const TRACKS = /** @type {const} */ ([
    { key: 'employee', color: '#64748b', fn: employeeAt },
    { key: 'freelancer', color: '#3aa7a0', fn: freelancerAt },
    { key: 'partner', color: '#ff0092', fn: partnerAt }
  ]);

  let stopYear = $state(DEFAULT_STOP);
  /** The track the visitor asked to look at on its own, or null for all three. */
  let focused = $state(/** @type {string | null} */ (null));

  const toggleFocus = (/** @type {string} */ key) => {
    focused = focused === key ? null : key;
  };

  /**
   * The y-ceiling is computed once, from a career nobody stops — otherwise the
   * axis would rescale under the slider and every line would appear to move
   * when only one of them did.
   */
  const yMax = curvesMax(buildAllCurves({ stopYear: YEARS + 1, years: YEARS })) * 1.08;

  // Plot geometry, in viewBox units.
  const W = 620;
  const H = 300;
  const PAD = { top: 18, right: 16, bottom: 34, left: 16 };
  const plotW = W - PAD.left - PAD.right;
  const plotH = H - PAD.top - PAD.bottom;

  const x = (/** @type {number} */ year) => PAD.left + (year / YEARS) * plotW;
  const y = (/** @type {number} */ value) => PAD.top + plotH - (value / yMax) * plotH;

  let curves = $derived(buildAllCurves({ stopYear, years: YEARS }));

  /** A polyline through the sampled points — never smoothed: the cliffs are the point. */
  const linePath = (/** @type {{year:number,value:number}[]} */ points) =>
    points.map((p, i) => `${i === 0 ? 'M' : 'L'}${x(p.year).toFixed(2)},${y(p.value).toFixed(2)}`).join(' ');

  /** The same line closed down to the baseline, for the partner curve's fill. */
  const areaPath = (/** @type {{year:number,value:number}[]} */ points) =>
    points.length === 0
      ? ''
      : `${linePath(points)} L${x(points[points.length - 1].year).toFixed(2)},${y(0).toFixed(2)} L${x(points[0].year).toFixed(2)},${y(0).toFixed(2)} Z`;

  let rows = $derived(
    TRACKS.map(({ key, color, fn }) => ({
      key,
      color,
      path: linePath(curves[key]),
      /** What they were earning the day before they stopped. */
      before: Math.round(fn(stopYear - CLIFF_EPSILON, stopYear)),
      /**
       * And three years later. Deliberately not clamped to the plotted decade:
       * the model is defined past the axis, and clamping made "three years
       * later" mean "the day you stopped" once the slider reached year 10.
       */
      after: Math.round(fn(stopYear + LOOK_AHEAD, stopYear)),
      /** Everything earned across the whole decade — the area under the line. */
      decade: lifetimeTotal(curves[key])
    }))
  );

  /**
   * The decade totals, as multiples of what the employee took home over the
   * same ten years. A ratio survives the "but those are made-up numbers"
   * objection better than the numbers themselves do — it is the same objection
   * applied to both sides of the fraction.
   */
  let decadeRatio = $derived.by(() => {
    const base = rows.find((r) => r.key === 'employee')?.decade ?? 0;
    const of = (/** @type {string} */ key) => {
      const total = rows.find((r) => r.key === key)?.decade ?? 0;
      return base > 0 ? (total / base).toFixed(1) : '—';
    };
    return { freelancer: of('freelancer'), partner: of('partner') };
  });

  /** Where each rikma joined the partner line — the compounding, made visible. */
  let partnershipDots = $derived(
    PARTNERSHIPS.filter((p) => p.startYear < stopYear).map(({ startYear }) => ({
      startYear,
      cx: x(startYear),
      cy: y(partnerAt(startYear, stopYear))
    }))
  );

  /** The dots belong to the partner line, so they hide when it is dimmed out. */
  let visibleDots = $derived(
    focused === null || focused === 'partner' ? partnershipDots : []
  );

  let animate = $derived($motionMode === MOTION_MODES.full);

  const xTicks = [0, 2, 4, 6, 8, 10];

  let summary = $derived(
    rows
      .map((r) => `${$t(`home.curves.${r.key}.name`)}: ${r.before} → ${r.after}`)
      .join('; ')
  );
</script>

<div
  class="rounded-3xl border-2 border-barbi/40 bg-white/70 backdrop-blur-sm px-4 py-5 sm:px-3 shadow-lg"
>
  <h3 class="text-rose-800 font-bold text-2xl sm:text-xl text-center mb-1">
    {$t('home.curves.title')}
  </h3>
  <p class="text-center text-slate-700 text-base sm:text-sm mb-4">
    {$t('home.curves.lead')}
  </p>

  <!-- Legend doubles as the key for the numbers below it, so it stays above
       the plot where it is read before the lines rather than after them. It is
       also the way to read one line on its own: three lines on one axis is
       exactly one line too many when you are trying to follow a single story. -->
  <ul class="flex flex-wrap justify-center gap-x-2 gap-y-1 mb-2">
    {#each rows as row (row.key)}
      <li>
        <button
          type="button"
          onclick={() => toggleFocus(row.key)}
          aria-pressed={focused === row.key}
          class="flex items-center gap-1.5 text-sm rounded-full px-2 py-1 transition-colors {focused ===
          row.key
            ? 'bg-slate-800 text-white'
            : 'text-slate-700 hover:bg-slate-100'}"
        >
          <span
            class="inline-block w-4 h-1.5 rounded-full"
            style="background:{row.color}"
          ></span>
          {$t(`home.curves.${row.key}.name`)}
        </button>
      </li>
    {/each}
  </ul>

  <div dir="ltr">
    <svg
      viewBox="0 0 {W} {H}"
      class="w-full h-auto"
      role="img"
      aria-label="{$t('home.curves.title')}. {summary}"
    >
      <!-- The starting salary, as the one horizontal reference the eye needs. -->
      <line
        x1={x(0)}
        x2={x(YEARS)}
        y1={y(EMPLOYEE_BASE)}
        y2={y(EMPLOYEE_BASE)}
        stroke="#cbd5e1"
        stroke-width="1"
        stroke-dasharray="3 4"
      />
      <text
        x={x(0) + 2}
        y={y(EMPLOYEE_BASE) - 5}
        class="fill-slate-400"
        style="font-size:11px"
      >
        {$t('home.curves.baseline')}
      </text>

      <!-- Baseline / x-axis -->
      <line
        x1={x(0)}
        x2={x(YEARS)}
        y1={y(0)}
        y2={y(0)}
        stroke="#94a3b8"
        stroke-width="1"
      />
      {#each xTicks as tick (tick)}
        <text
          x={x(tick)}
          y={y(0) + 15}
          text-anchor="middle"
          class="fill-slate-400"
          style="font-size:11px">{tick}</text
        >
      {/each}
      <text
        x={x(YEARS)}
        y={y(0) + 29}
        text-anchor="end"
        class="fill-slate-400"
        style="font-size:11px">{$t('home.curves.axisYears')}</text
      >

      <!-- The stop, drawn before the lines so it sits behind them. -->
      <line
        x1={x(stopYear)}
        x2={x(stopYear)}
        y1={PAD.top}
        y2={y(0)}
        stroke="#f43f5e"
        stroke-width="1.5"
        stroke-dasharray="5 4"
      />
      <text
        x={x(stopYear)}
        y={PAD.top - 5}
        text-anchor="middle"
        class="fill-rose-600 font-bold"
        style="font-size:12px">{$t('home.curves.stopMark')}</text
      >

      <path d={areaPath(curves.partner)} fill="#ff0092" opacity="0.08" />

      {#each rows as row (row.key)}
        <path
          d={row.path}
          fill="none"
          stroke={row.color}
          stroke-width={row.key === 'partner' ? 3.5 : 2}
          stroke-linejoin="round"
          stroke-linecap="round"
          opacity={focused === null || focused === row.key ? 1 : 0.18}
          class:draw={animate}
        />
      {/each}

      {#each visibleDots as dot (dot.startYear)}
        <circle cx={dot.cx} cy={dot.cy} r="4" fill="#ff0092" stroke="#fff" stroke-width="1.5">
          <title>{$t('home.curves.partnershipDot')}</title>
        </circle>
      {/each}
    </svg>
  </div>

  <!-- The control, and the reason the block exists. -->
  <div class="mt-3 px-1">
    <label
      for="income-stop-year"
      class="block text-center text-slate-800 font-semibold text-base sm:text-sm mb-1"
    >
      {$t('home.curves.stopLabel', { year: stopYear })}
    </label>
    <input
      id="income-stop-year"
      type="range"
      min="2"
      max={YEARS}
      step="1"
      bind:value={stopYear}
      class="w-full accent-barbi"
    />
  </div>

  <div class="grid grid-cols-3 gap-2 mt-4">
    {#each rows as row (row.key)}
      <div
        class="rounded-2xl px-2 py-3 text-center border {row.key === 'partner'
          ? 'border-barbi bg-barbi/5'
          : 'border-slate-200 bg-slate-50'}"
      >
        <p class="text-xs font-bold mb-2" style="color:{row.color}">
          {$t(`home.curves.${row.key}.name`)}
        </p>
        <!-- Before and after carry the same weight on purpose. Only the
             partner's "after" moves with the slider — the other two are zero
             from three months past the stop onwards — so making the "after"
             the headline would print a static 0 next to a big number and read
             as a rigged comparison. The pair is the honest unit: the drop is
             visible on every card, and every number moves as the slider does. -->
        <dl class="text-[11px] leading-tight space-y-1">
          <div>
            <dt class="text-slate-400">
              {$t('home.curves.beforeLabel')}
            </dt>
            <dd class="text-lg font-bold text-slate-500 leading-none">
              {row.before}<span class="text-xs font-normal">%</span>
            </dd>
          </div>
          <div>
            <dt class="text-slate-500">
              {$t('home.curves.afterLabel', { years: LOOK_AHEAD })}
            </dt>
            <dd class="text-lg font-bold leading-none" style="color:{row.color}">
              {row.after}<span class="text-xs font-normal">%</span>
            </dd>
          </div>
        </dl>
      </div>
    {/each}
  </div>

  <p class="text-center text-slate-700 text-sm mt-3 leading-relaxed">
    {$t('home.curves.decade', {
      freelancer: decadeRatio.freelancer,
      partner: decadeRatio.partner
    })}
  </p>

  {#if focused}
    <p class="text-center text-slate-700 text-sm mt-3 leading-relaxed">
      {$t(`home.curves.${focused}.d`)}
    </p>
  {/if}

  <p class="text-center text-slate-600 text-xs mt-3 leading-relaxed">
    {$t('home.curves.note')}
  </p>
</div>

<style>
  /* The draw-in is decoration: it runs once, only at full motion, and the
     final state is what the CSS leaves behind if it never runs at all. */
  .draw {
    stroke-dasharray: 2000;
    stroke-dashoffset: 2000;
    animation: draw-line 2.2s ease-out forwards;
  }

  @keyframes draw-line {
    to {
      stroke-dashoffset: 0;
    }
  }
</style>
