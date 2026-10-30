<script>
  /**
   * The rikma's value as a pie of its partners' faces, with the legend that
   * says it in words: every slice has a coloured rim and a hairline gap, and
   * the same colour ties it to a row with the name, the percent and the value.
   * A partner on the default picture gets a colour slice with their initial
   * instead — five identical silhouettes told nobody anything.
   *
   * Hovering either side highlights the partner on both; clicking a row
   * selects them (the page filters the breakdown by it).
   */
  import { t } from '$lib/translations';
  import { useFormatMoney } from '$lib/money/context.svelte';

  /**
   * @typedef {{ uid: string|number, username: string, total: number, p: number, color: string, photo: string|null, initial: string }} Member
   * @typedef {Object} Props
   * @property {Member[]} members  sorted, largest share first
   * @property {number} net        the rikma's whole value
   * @property {number} [others]   value of people who are no longer members
   * @property {string|number|null} [active]
   * @property {string|number|null} [selected]
   */

  /** @type {Props} */
  let { members, net, others = 0, active = $bindable(null), selected = $bindable(null) } = $props();

  const fmt = useFormatMoney();
  const OTHERS = '__others';
  const C = 100;
  const R = 74; // the photo pie
  const RIM_IN = 78;
  const RIM_OUT = 92;

  const pct = (p) => (p >= 10 ? p.toFixed(1) : p.toFixed(2)).replace(/\.?0+$/, '');

  /** @param {number} a @param {number} r */
  const pt = (a, r) => [C + r * Math.cos(a), C + r * Math.sin(a)];

  function wedge(a0, a1, r) {
    const [x0, y0] = pt(a0, r);
    const [x1, y1] = pt(a1, r);
    const large = a1 - a0 > Math.PI ? 1 : 0;
    return `M${C},${C} L${x0},${y0} A${r},${r} 0 ${large} 1 ${x1},${y1} Z`;
  }

  function band(a0, a1, r1, r2) {
    const [ox0, oy0] = pt(a0, r2);
    const [ox1, oy1] = pt(a1, r2);
    const [ix1, iy1] = pt(a1, r1);
    const [ix0, iy0] = pt(a0, r1);
    const large = a1 - a0 > Math.PI ? 1 : 0;
    return `M${ox0},${oy0} A${r2},${r2} 0 ${large} 1 ${ox1},${oy1} L${ix1},${iy1} A${r1},${r1} 0 ${large} 0 ${ix0},${iy0} Z`;
  }

  let slices = $derived.by(() => {
    const parts = members
      .filter((m) => m.total > 0)
      .map((m) => ({ key: m.uid, value: m.total, color: m.color, photo: m.photo, initial: m.initial }));
    if (others > 0) parts.push({ key: OTHERS, value: others, color: '#94a3b8', photo: null, initial: '' });
    const sum = parts.reduce((t, s) => t + s.value, 0);
    if (sum <= 0) return [];
    let a = -Math.PI / 2;
    return parts.map((s, i) => {
      const frac = s.value / sum;
      const a0 = a;
      const a1 = a + frac * 2 * Math.PI;
      a = a1;
      const mid = (a0 + a1) / 2;
      const whole = frac > 0.9999;
      // A face sits where the slice is widest; a big slice gets the whole frame.
      const size = frac >= 0.5 ? 2 * R : R * 1.15;
      const [cx, cy] = frac >= 0.5 ? [C, C] : pt(mid, R * 0.55);
      const [tx, ty] = whole ? [C, C] : pt(mid, R * 0.6);
      return {
        ...s,
        id: `sp-${i}`,
        frac,
        whole,
        path: whole ? '' : wedge(a0, a1, R),
        rim: whole ? '' : band(a0, a1, RIM_IN, RIM_OUT),
        img: { x: cx - size / 2, y: cy - size / 2, size },
        text: { x: tx, y: ty, size: whole ? 44 : Math.max(11, Math.min(30, frac * 90)) }
      };
    });
  });

  let activeMember = $derived(
    active === OTHERS ? null : members.find((m) => m.uid === active) ?? null
  );

  /** @param {string|number} key */
  const dim = (key) => active != null && active !== key;

  function toggle(uid) {
    selected = selected === uid ? null : uid;
  }
</script>

<div class="sp">
  <figure class="sp-chart">
    <svg viewBox="0 0 200 200" role="img" aria-label={$t('moach.split.chartLabel')}>
      <defs>
        {#each slices as s (s.id)}
          {#if !s.whole}
            <clipPath id="{s.id}-clip"><path d={s.path} /></clipPath>
          {/if}
        {/each}
        <clipPath id="sp-whole-clip"><circle cx={C} cy={C} r={R} /></clipPath>
      </defs>

      {#each slices as s (s.id)}
        <!-- svelte-ignore a11y_no_static_element_interactions -->
        <g
          class="sp-slice"
          class:dim={dim(s.key)}
          onmouseenter={() => (active = s.key)}
          onmouseleave={() => (active = null)}
          onclick={() => s.key !== OTHERS && toggle(s.key)}
        >
          <g clip-path="url(#{s.whole ? 'sp-whole' : s.id}-clip)">
            {#if s.photo}
              <rect x="0" y="0" width="200" height="200" fill={s.color} />
              <image
                href={s.photo}
                x={s.img.x}
                y={s.img.y}
                width={s.img.size}
                height={s.img.size}
                preserveAspectRatio="xMidYMid slice"
              />
            {:else}
              <rect x="0" y="0" width="200" height="200" fill={s.color} class="sp-fill" />
              {#if s.initial && s.frac >= 0.04}
                <text
                  x={s.text.x}
                  y={s.text.y}
                  font-size={s.text.size}
                  class="sp-initial"
                  text-anchor="middle"
                  dominant-baseline="central">{s.initial}</text
                >
              {/if}
            {/if}
          </g>
          {#if s.whole}
            <circle cx={C} cy={C} r={R} class="sp-gap" />
            <circle cx={C} cy={C} r={(RIM_IN + RIM_OUT) / 2} fill="none" stroke={s.color} stroke-width={RIM_OUT - RIM_IN} />
          {:else}
            <path d={s.path} class="sp-gap" />
            <path d={s.rim} fill={s.color} class="sp-rim" />
          {/if}
        </g>
      {/each}
    </svg>
    <figcaption class="sp-caption" aria-live="polite">
      {#if activeMember}
        <b>{activeMember.username}</b>
        <span class="sp-cap-p" style="color: {activeMember.color}">{pct(activeMember.p)}%</span>
        <span class="sp-cap-v">{fmt(activeMember.total)}</span>
      {:else if active === OTHERS}
        <b>{$t('moach.split.formerPartners')}</b>
        <span class="sp-cap-p">{pct((100 * others) / net)}%</span>
        <span class="sp-cap-v">{fmt(others)}</span>
      {:else}
        <span class="sp-cap-l">{$t('moach.split.totalValue')}</span>
        <b class="sp-cap-total">{fmt(net)}</b>
      {/if}
    </figcaption>
  </figure>

  <ul class="sp-legend">
    {#each members as m (m.uid)}
      {@const none = m.total <= 0}
      <li>
        <button
          type="button"
          class="sp-row"
          class:none
          class:dim={dim(m.uid)}
          class:sel={selected === m.uid}
          aria-pressed={selected === m.uid}
          style="--c: {m.color}"
          onmouseenter={() => (active = m.uid)}
          onmouseleave={() => (active = null)}
          onfocus={() => (active = m.uid)}
          onblur={() => (active = null)}
          onclick={() => toggle(m.uid)}
        >
          <span class="sp-ava" class:initial={!m.photo}>
            {#if m.photo}<img src={m.photo} alt="" loading="lazy" />{:else}{m.initial}{/if}
          </span>
          <span class="sp-body">
            <span class="sp-line">
              <span class="sp-name">{m.username}</span>
              {#if none}
                <span class="sp-zero">{$t('moach.split.noShareYet')}</span>
              {:else}
                <span class="sp-p">{pct(m.p)}%</span>
              {/if}
            </span>
            {#if !none}
              <span class="sp-bar"><span style="width: {Math.min(100, m.p)}%"></span></span>
              <span class="sp-v">{fmt(m.total)}</span>
            {/if}
          </span>
        </button>
      </li>
    {/each}
    {#if others > 0}
      <li>
        <div
          class="sp-row static"
          class:dim={dim(OTHERS)}
          style="--c: #94a3b8"
          role="presentation"
          onmouseenter={() => (active = OTHERS)}
          onmouseleave={() => (active = null)}
        >
          <span class="sp-ava initial">·</span>
          <span class="sp-body">
            <span class="sp-line">
              <span class="sp-name">{$t('moach.split.formerPartners')}</span>
              <span class="sp-p">{pct((100 * others) / net)}%</span>
            </span>
            <span class="sp-bar"><span style="width: {(100 * others) / net}%"></span></span>
            <span class="sp-v">{fmt(others)}</span>
          </span>
        </div>
      </li>
    {/if}
  </ul>
</div>

<style>
  .sp {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    gap: 1.25rem;
    align-items: center;
  }
  @media (min-width: 720px) {
    .sp {
      grid-template-columns: 260px minmax(0, 1fr);
      gap: 2rem;
    }
  }
  .sp-chart {
    margin: 0 auto;
    width: 100%;
    max-width: 260px;
  }
  .sp-chart svg {
    width: 100%;
    height: auto;
    display: block;
    overflow: visible;
  }
  .sp-slice {
    cursor: pointer;
    transition: opacity 0.15s ease;
  }
  .sp-slice.dim {
    opacity: 0.3;
  }
  .sp-fill {
    opacity: 0.85;
  }
  .sp-initial {
    fill: #fff;
    font-weight: 800;
    pointer-events: none;
  }
  /* The hairline that separates slices is the card itself showing through. */
  .sp-gap {
    fill: none;
    stroke: var(--surface);
    stroke-width: 2;
    stroke-linejoin: round;
  }
  .sp-rim {
    stroke: var(--surface);
    stroke-width: 1.5;
  }
  .sp-caption {
    margin-top: 0.5rem;
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    align-items: baseline;
    gap: 0.25rem 0.5rem;
    min-height: 2rem;
    text-align: center;
    color: var(--surface-ink);
  }
  .sp-cap-l,
  .sp-cap-v {
    color: var(--surface-muted);
    font-size: 0.85rem;
  }
  .sp-cap-total {
    font-size: 1.15rem;
    font-weight: 800;
  }
  .sp-cap-p {
    font-weight: 800;
    font-variant-numeric: tabular-nums;
  }

  .sp-legend {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
  }
  .sp-row {
    width: 100%;
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.55rem 0.75rem;
    border-radius: 0.85rem;
    background: var(--surface-2);
    border: 1px solid transparent;
    border-inline-start: 4px solid var(--c);
    color: var(--surface-ink);
    text-align: start;
    cursor: pointer;
    transition:
      opacity 0.15s ease,
      border-color 0.15s ease;
  }
  .sp-row.static {
    cursor: default;
  }
  .sp-row.dim {
    opacity: 0.45;
  }
  .sp-row.sel {
    border-color: var(--c);
    border-inline-start-width: 4px;
  }
  .sp-row:focus-visible {
    outline: 2px solid var(--c);
    outline-offset: 2px;
  }
  .sp-row.none {
    border-inline-start-color: var(--surface-line);
  }
  .sp-ava {
    flex-shrink: 0;
    width: 2.25rem;
    height: 2.25rem;
    border-radius: 999px;
    overflow: hidden;
    box-shadow: 0 0 0 2.5px var(--c);
    display: grid;
    place-items: center;
  }
  .sp-ava img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  .sp-ava.initial {
    background: var(--c);
    color: #fff;
    font-weight: 800;
  }
  .sp-row.none .sp-ava {
    box-shadow: 0 0 0 2px var(--surface-line);
    filter: grayscale(1);
  }
  .sp-body {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 0.2rem;
  }
  .sp-line {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 0.5rem;
  }
  .sp-name {
    font-weight: 700;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .sp-p {
    font-weight: 800;
    font-size: 1.05rem;
    font-variant-numeric: tabular-nums;
  }
  .sp-zero,
  .sp-v {
    font-size: 0.8rem;
    color: var(--surface-muted);
  }
  .sp-bar {
    height: 6px;
    border-radius: 999px;
    background: var(--surface-line);
    overflow: hidden;
  }
  .sp-bar > span {
    display: block;
    height: 100%;
    border-radius: inherit;
    background: var(--c);
  }
</style>
