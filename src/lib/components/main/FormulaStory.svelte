<!--
  FormulaStory.svelte — the homepage's half-minute answer to "so who pays me?".

  Five scenes on one SVG stage: a salary (grey, 3s) → what three partners bring
  (a thing, a monthly cost, hours — all turning into the same cube) → one rate
  going back and forth until everyone signs → the pile becoming the rikma's
  value and each partner's share of it → a customer agreeing a price and the
  sale splitting by those shares.

  Why it survives translation: **there are no words inside the SVG.** It holds
  shapes, colours, digits and `× = %` only, and it is always laid out LTR the
  way arithmetic is. Every sentence is HTML below it, read through `$t()`, and
  the alternatives are stacked in one grid cell so the tallest translation sets
  the height once — a long Russian caption cannot move the stage.

  Everything drawn is a function of a single `time`, so "play", "jump to step 3"
  and "show a still frame" (calm/off motion, SSR, no-JS) are the same code. The
  data and the clock live in `formulaStory.ts`, tested on their own.
-->
<script lang="ts">
  import { onMount } from 'svelte';
  import { t, locale } from '$lib/translations';
  import { ambientAnimates } from '$lib/stores/motion.js';
  import { PALETTE, INK } from './splitSeed.js';
  import {
    EXAMPLES,
    CUBE_VALUE,
    CUBE_FALL_MS,
    PILE,
    PLAYBACK_RATE,
    ROW_MS,
    SCENE_MS,
    SCENE_START,
    SCENE_COUNT,
    TOTAL_MS,
    buildArcs,
    buildCubes,
    easeIn,
    easeInOut,
    easeOut,
    lerp,
    rowStart,
    rowValue,
    sceneAt,
    span,
    totals,
    type IconName
  } from './formulaStory';

  /* --- the stage's fixed geometry (viewBox 360 × 440) -------------------- */
  const AX = [70, 180, 290];
  const AY = 46;
  const RING = { cx: 180, cy: 256, r: 56, w: 22 };
  const CIRC = 2 * Math.PI * RING.r;
  const EMP = { x: 96, y: 262 };
  const BOSS = { x: 262, y: 262 };
  const CUST = { x: 62, y: 408 };
  const DESK = { x: 258, y: 388 };
  const CARD_Y = 100;
  const CARD_NEAR = [104, 180, 256];
  /** A still frame of scene i: late enough that it has happened, before its fade. */
  const POSE_BEFORE_END = 450;

  // SSR and no-JS get the last frame — the result, not an empty stage.
  let time = $state(TOTAL_MS);
  let playing = $state(false);
  let exId = $state(EXAMPLES[0].id);
  let root: HTMLElement | undefined = $state();

  const example = $derived(EXAMPLES.find((e) => e.id === exId) ?? EXAMPLES[0]);
  const cubes = $derived(buildCubes(example));
  const arcs = $derived(buildArcs(example));
  const sums = $derived(totals(example));
  const scene = $derived(sceneAt(time).index);
  const ended = $derived(time >= TOTAL_MS);

  // Latin digits in every locale: the stage is arithmetic, and the same frame
  // has to read the same in Arabic as in Hebrew.
  const nf = $derived.by(() => {
    try {
      return new Intl.NumberFormat(`${$locale || 'en'}-u-nu-latn`);
    } catch {
      return new Intl.NumberFormat('en');
    }
  });
  const fmt = (value: number) => nf.format(value);

  /* --- reading the clock ------------------------------------------------- */
  const at = (sceneIndex: number, ms: number) => SCENE_START[sceneIndex] + ms;
  const sp = (from: number, to: number) => span(time, from, to);
  /** Fades in at `from`, out by `to`. */
  const win = (from: number, to: number, fade = 300) =>
    span(time, from, from + fade) * (1 - span(time, to - fade, to));
  /** A point travelling from a to b between two moments, on a small arc. */
  function fly(
    a: { x: number; y: number },
    b: { x: number; y: number },
    from: number,
    to: number,
    lift = 14
  ) {
    const raw = sp(from, to);
    const p = easeInOut(raw);
    return { x: lerp(a.x, b.x, p), y: lerp(a.y, b.y, p) - Math.sin(raw * Math.PI) * lift };
  }

  /** The contribution currently spelled out on the equation line, if any. */
  const eq = $derived.by(() => {
    const rows = example.rows;
    const last = rows.length - 1;
    for (let i = 0; i < rows.length; i++) {
      const start = rowStart(example, i);
      const end = i < last ? start + ROW_MS : at(2, SCENE_MS[2]);
      if (time >= start && time < end) {
        const row = rows[i];
        const counted =
          Math.round((rowValue(row) * span(time, start + 500, start + 1600)) / CUBE_VALUE) *
          CUBE_VALUE;
        return {
          row,
          counted,
          opacity: span(time, start, start + 300) * (1 - span(time, end - 350, end))
        };
      }
    }
    return null;
  });

  /** Which line of the legend under the stage is lit. */
  const reading = $derived(eq ? eq.row.kind : 'pure');

  const negoRow = $derived(example.rows[example.rows.length - 1]);
  const pileOpacity = $derived(1 - sp(at(3, 900), at(3, 1700)));
  const drawn = $derived(easeInOut(sp(at(3, 1300), at(3, 3100))));
  const totalY = $derived(lerp(348, RING.cy + 7, easeInOut(sp(at(3, 900), at(3, 1700)))));

  /** The ✓ above partner i: once when the rate is agreed, once at the sale. */
  const partnerTick = (i: number) =>
    Math.max(
      win(at(2, 3600 + i * 150), at(2, SCENE_MS[2])),
      win(at(4, 3600 + i * 120), at(4, 4700))
    );

  /* --- playback ---------------------------------------------------------- */
  $effect(() => {
    if (!playing) return;
    let last = performance.now();
    let frame = 0;
    const tick = (now: number) => {
      // capped, so a backgrounded tab resumes where it was instead of skipping ahead
      time = Math.min(TOTAL_MS, time + Math.min(now - last, 100) * PLAYBACK_RATE);
      last = now;
      if (time >= TOTAL_MS) {
        playing = false;
        return;
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  });

  /** Jump to a step: play it when motion is welcome, otherwise show its still. */
  function goTo(index: number) {
    if ($ambientAnimates) {
      time = SCENE_START[index];
      playing = true;
    } else {
      playing = false;
      time = SCENE_START[index] + SCENE_MS[index] - POSE_BEFORE_END;
    }
  }

  // An explicit press on play always plays, whatever the ambient setting says:
  // the setting is about motion nobody asked for.
  function togglePlay() {
    if (playing) {
      playing = false;
    } else {
      if (ended) time = 0;
      playing = true;
    }
  }

  function pickExample(id: string) {
    if (id === exId) return;
    exId = id;
    // the example only shows while things are being brought, so go there
    goTo(1);
  }

  onMount(() => {
    if (!root || typeof IntersectionObserver === 'undefined') return;
    let started = false;
    let pausedByScroll = false;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          if (!started) {
            started = true;
            if ($ambientAnimates) {
              time = 0;
              playing = true;
            }
          } else if (pausedByScroll) {
            pausedByScroll = false;
            playing = true;
          }
        } else if (playing) {
          pausedByScroll = true;
          playing = false;
        }
      },
      { threshold: 0.35 }
    );
    observer.observe(root);
    return () => observer.disconnect();
  });

  const KINDS = ['once', 'monthly', 'hours', 'pure'] as const;
  const READING_KEY = {
    once: 'kindOnce',
    monthly: 'kindMonthly',
    hours: 'kindHours',
    pure: 'pure'
  } as const;
  const colorVars = [0, 1, 2]
    .map((i) => `--fs-fill-${i}:${PALETTE[i]};--fs-ink-${i}:${INK[i]}`)
    .join(';');
</script>

<div class="fs" bind:this={root} style={colorVars}>
  <header class="fs-head">
    <span class="fs-eyebrow">{$t('home.formula.eyebrow')}</span>
    <h2 class="fs-title">{$t('home.formula.title')}</h2>
    <p class="fs-sub">{$t('home.formula.sub')}</p>
  </header>

  <div class="fs-stage">
    <svg
      viewBox="0 0 360 440"
      role="img"
      aria-label={$t('home.formula.alt')}
      direction="ltr"
      class="fs-svg"
    >
      {#snippet icon(name: IconName | 'bag' | 'check', x: number, y: number, size: number, color: string)}
        <g
          transform="translate({x} {y}) scale({size / 24})"
          fill="none"
          stroke={color}
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          {#if name === 'oven'}
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <path d="M3 8h18M7 5.5h.01M11 5.5h.01" />
            <rect x="7" y="11" width="10" height="6" rx="1" />
          {:else if name === 'home'}
            <path d="M3 11l9-8 9 8M5 10v10h14V10M10 20v-6h4v6" />
          {:else if name === 'bolt'}
            <path d="M13 2L4 14h7l-1 8 9-12h-7z" />
          {:else if name === 'clock'}
            <circle cx="12" cy="12" r="9" />
            <path d="M12 7v5l3 2" />
          {:else if name === 'box'}
            <path d="M3 8l9-5 9 5v8l-9 5-9-5zM3 8l9 5 9-5M12 13v8" />
          {:else if name === 'calendar'}
            <rect x="3" y="5" width="18" height="16" rx="2" />
            <path d="M3 10h18M8 3v4M16 3v4" />
          {:else if name === 'laptop'}
            <path d="M5 5h14v10H5zM2 19h20" />
          {:else if name === 'cloud'}
            <path d="M7 18a4 4 0 0 1-.5-7.97A6 6 0 0 1 18 9.5a4.25 4.25 0 0 1 .5 8.5z" />
          {:else if name === 'table'}
            <path d="M3 10h18v3H3zM6 13v6M18 13v6M3 10V7" />
          {:else if name === 'bag'}
            <path d="M5 8h14l-1 12H6zM9 8V6a3 3 0 0 1 6 0v2" />
          {:else}
            <path d="M5 12l4 4 10-10" />
          {/if}
        </g>
      {/snippet}

      {#snippet person(x: number, y: number, fill: string, scale = 1, opacity = 1)}
        <g transform="translate({x} {y}) scale({scale})" {opacity} {fill}>
          <circle cy="-12" r="10" />
          <path d="M-17 20a17 17 0 0 1 34 0z" />
        </g>
      {/snippet}

      {#snippet card(pos: { x: number; y: number }, label: string, stroke: string, glyph: IconName | 'bag', opacity: number)}
        {#if opacity > 0}
          <g transform="translate({pos.x} {pos.y})" {opacity}>
            <rect x="-34" y="-15" width="68" height="30" rx="9" class="fs-card" {stroke} />
            {@render icon(glyph, -28, -8, 16, stroke)}
            <text x="10" y="5.5" text-anchor="middle" class="fs-num fs-card-num">{label}</text>
          </g>
        {/if}
      {/snippet}

      {#snippet tick(x: number, y: number, opacity: number)}
        {#if opacity > 0}
          <g transform="translate({x} {y}) scale({0.6 + 0.4 * easeOut(opacity)})" {opacity}>
            <circle r="9" class="fs-tick" />
            {@render icon('check', -6, -6, 12, 'var(--hm-surface)')}
          </g>
        {/if}
      {/snippet}

      <!-- ===== scene 0: a salary. Hours go one way, a coin comes back, and
           the whole ring stays with someone else. ===== -->
      {#if scene === 0}
        <g opacity={win(at(0, 0), at(0, SCENE_MS[0]), 400)} class="fs-grey">
          <circle
            cx={BOSS.x}
            cy={BOSS.y - 78}
            r="30"
            fill="none"
            stroke="currentColor"
            stroke-width="15"
          />
          {@render person(EMP.x, EMP.y, 'currentColor')}
          {@render person(BOSS.x, BOSS.y, 'currentColor', 1.25)}
          {#each [0, 1, 2] as k (k)}
            {@const raw = sp(at(0, 500 + k * 350), at(0, 1400 + k * 350))}
            {@const pos = fly(
              { x: EMP.x + 24, y: EMP.y - 6 },
              { x: BOSS.x - 30, y: BOSS.y - 6 },
              at(0, 500 + k * 350),
              at(0, 1400 + k * 350),
              20
            )}
            <g opacity={Math.min(1, Math.sin(raw * Math.PI) * 3)}>
              {@render icon('clock', pos.x - 8, pos.y - 8, 16, 'currentColor')}
            </g>
          {/each}
          {#if sp(at(0, 2000), at(0, 2800)) > 0}
            {@const pos = fly(
              { x: BOSS.x - 30, y: BOSS.y + 14 },
              { x: EMP.x + 24, y: EMP.y + 14 },
              at(0, 2000),
              at(0, 2800),
              -14
            )}
            <circle cx={pos.x} cy={pos.y} r="7" class="fs-coin" />
          {/if}
        </g>
      {/if}

      <!-- ===== the three partners, from scene 1 to the end ===== -->
      {#if scene > 0}
        {@const shown = sp(at(1, 0), at(1, 500))}
        {#each AX as x, i (i)}
          {@render person(
            x,
            AY,
            `var(--fs-fill-${i})`,
            eq?.row.partner === i ? 1.12 : 1,
            shown
          )}
          {@render tick(x + 15, AY - 22, partnerTick(i))}
        {/each}
      {/if}

      <!-- ===== the equation line: quantity × agreed value = value ===== -->
      {#if eq && eq.opacity > 0}
        <g opacity={eq.opacity}>
          {@render icon(eq.row.icon, 62, 112, 28, `var(--fs-text-${eq.row.partner})`)}
          <text x="104" y="134" class="fs-num fs-eq" fill="var(--fs-text-{eq.row.partner})">
            {fmt(eq.row.qty)} × {fmt(eq.row.rate)} = {fmt(eq.counted)}
          </text>
        </g>
      {/if}

      <!-- ===== scene 2: one rate, back and forth, until everyone signs ===== -->
      {#if scene === 2}
        {@const far = { x: CARD_NEAR[0], y: CARD_Y }}
        {@const near = { x: CARD_NEAR[2], y: CARD_Y }}
        {@const mid = { x: CARD_NEAR[1], y: CARD_Y }}
        {@render card(
          fly(near, far, at(2, 300), at(2, 1300)),
          fmt(example.nego[0]),
          'var(--fs-fill-2)',
          'clock',
          win(at(2, 0), at(2, 1600))
        )}
        {@render card(
          fly(far, near, at(2, 1800), at(2, 2800)),
          fmt(example.nego[1]),
          'var(--fs-fill-0)',
          'clock',
          win(at(2, 1500), at(2, 3100))
        )}
        {@render card(
          fly(near, mid, at(2, 3200), at(2, 3800), 0),
          fmt(negoRow.rate),
          'var(--hm-ink)',
          'clock',
          win(at(2, 3000), at(2, 4300))
        )}
      {/if}

      <!-- ===== the pile: every contribution is the same cube ===== -->
      {#if scene > 0 && pileOpacity > 0}
        <g opacity={pileOpacity}>
          {#each cubes as cube, i (i)}
            {@const p = span(time, cube.t0, cube.t0 + CUBE_FALL_MS)}
            {#if p > 0}
              <rect
                x={lerp(AX[cube.partner] - PILE.size / 2, cube.x, easeOut(p))}
                y={lerp(AY + 22, cube.y, easeIn(p))}
                width={PILE.size}
                height={PILE.size}
                rx="4"
                fill="var(--fs-fill-{cube.partner})"
                opacity={Math.min(1, p * 3)}
              />
            {/if}
          {/each}
        </g>
      {/if}

      <!-- ===== scene 3: the pile is the rikma's value; your part of it is
           your share ===== -->
      {#if scene >= 3}
        <circle
          cx={RING.cx}
          cy={RING.cy}
          r={RING.r}
          fill="none"
          class="fs-track"
          stroke-width={RING.w}
          opacity={sp(at(3, 1100), at(3, 1500))}
        />
        {#each arcs as arc (arc.partner)}
          {@const len = Math.min(arc.length, Math.max(0, drawn - arc.from))}
          {#if len > 0}
            <circle
              cx={RING.cx}
              cy={RING.cy}
              r={RING.r}
              fill="none"
              stroke="var(--fs-fill-{arc.partner})"
              stroke-width={RING.w}
              stroke-dasharray="{len * CIRC} {CIRC}"
              stroke-dashoffset={-arc.from * CIRC}
              transform="rotate(-90 {RING.cx} {RING.cy})"
            />
          {/if}
          <text
            x={RING.cx + Math.cos(arc.mid) * (RING.r + 36)}
            y={RING.cy + Math.sin(arc.mid) * (RING.r + 36) + 6}
            text-anchor="middle"
            class="fs-num fs-pct"
            fill="var(--fs-text-{arc.partner})"
            opacity={sp(at(3, 3100 + arc.partner * 250), at(3, 3500 + arc.partner * 250))}
          >
            {Math.round(arc.share * 100)}%
          </text>
        {/each}
        <text
          x={RING.cx}
          y={totalY}
          text-anchor="middle"
          class="fs-num fs-total"
          opacity={sp(at(3, 200), at(3, 700))}
        >
          {fmt(sums.total)}
        </text>
      {/if}

      <!-- ===== scene 4: the customer agrees a price too, and the sale splits
           by the shares ===== -->
      {#if scene === 4}
        {@const custOpacity = sp(at(4, 0), at(4, 500))}
        {@const custSide = { x: CUST.x + 56, y: CUST.y - 12 }}
        {@render person(CUST.x, CUST.y, 'var(--hm-muted)', 1, custOpacity)}
        {@render tick(CUST.x + 15, CUST.y - 22, win(at(4, 3500), at(4, 4700)))}
        <g opacity={custOpacity * (1 - sp(at(4, 4300), at(4, 4700)))}>
          {#each [0, 1, 2] as i (i)}
            <circle cx={DESK.x + 48 + i * 11} cy={DESK.y} r="4.5" fill="var(--fs-fill-{i})" />
          {/each}
        </g>
        {@render card(
          fly(DESK, custSide, at(4, 500), at(4, 1300)),
          fmt(example.priceNego[0]),
          'var(--hm-accent)',
          'bag',
          win(at(4, 300), at(4, 1600))
        )}
        {@render card(
          fly(custSide, DESK, at(4, 1800), at(4, 2600)),
          fmt(example.priceNego[1]),
          'var(--hm-muted)',
          'bag',
          win(at(4, 1500), at(4, 2900))
        )}
        {@render card(
          fly(DESK, { x: 190, y: DESK.y }, at(4, 3000), at(4, 3500), 0),
          fmt(example.sale),
          'var(--hm-ink)',
          'bag',
          win(at(4, 2800), at(4, 4400))
        )}

        {#if sp(at(4, 4300), at(4, 5100)) > 0}
          {@const pos = fly(
            { x: CUST.x, y: CUST.y - 12 },
            { x: RING.cx, y: RING.cy },
            at(4, 4300),
            at(4, 5100),
            0
          )}
          <circle
            cx={pos.x}
            cy={pos.y}
            r="13"
            class="fs-coin"
            opacity={1 - sp(at(4, 5200), at(4, 5450))}
          />
        {/if}
        {#each arcs as arc (arc.partner)}
          {@const from = at(4, 5300 + arc.partner * 150)}
          {@const raw = sp(from, from + 1000)}
          {#if raw > 0}
            <circle
              cx={lerp(RING.cx, AX[arc.partner], easeInOut(raw))}
              cy={lerp(RING.cy, AY + 40, easeInOut(raw))}
              r={5 + 9 * Math.sqrt(arc.share)}
              class="fs-coin"
              opacity={1 - sp(from + 900, from + 1200)}
            />
          {/if}
          <text
            x={AX[arc.partner]}
            y={AY + 46}
            text-anchor="middle"
            class="fs-num fs-pay"
            fill="var(--fs-text-{arc.partner})"
            opacity={sp(from + 1000, from + 1400)}
          >
            +{fmt(sums.payouts[arc.partner])}
          </text>
        {/each}
      {/if}
    </svg>

    <!-- The legend for the digits above: which quantity, times which value. -->
    <div class="fs-stack fs-reading">
      {#each KINDS as kind (kind)}
        <p class:on={reading === kind} class:fs-pure={kind === 'pure'}>
          {$t(`home.formula.${READING_KEY[kind]}`)}
        </p>
      {/each}
    </div>
  </div>

  <div class="fs-body">
    <div class="fs-chips" role="group" aria-label={$t('home.formula.exLabel')}>
      {#each EXAMPLES as ex (ex.id)}
        <button
          type="button"
          class="fs-chip"
          class:on={exId === ex.id}
          aria-pressed={exId === ex.id}
          onclick={() => pickExample(ex.id)}
        >
          {$t(`home.formula.ex.${ex.id}`)}
        </button>
      {/each}
    </div>

    <ol class="fs-stack fs-captions">
      {#each SCENE_MS as _, i (i)}
        <li class:on={scene === i}>{$t(`home.formula.s${i}`)}</li>
      {/each}
    </ol>

    <div class="fs-controls">
      <button type="button" class="fs-play" onclick={togglePlay}>
        {playing
          ? $t('home.formula.pause')
          : ended
            ? $t('home.formula.replay')
            : $t('home.formula.play')}
      </button>
      <div class="fs-dots">
        {#each SCENE_MS as _, i (i)}
          <button
            type="button"
            class="fs-dot"
            class:on={scene === i}
            class:done={scene > i}
            aria-current={scene === i ? 'step' : undefined}
            aria-label={$t('home.formula.step', { step: i + 1, total: SCENE_COUNT })}
            onclick={() => goTo(i)}
          >
            <span dir="ltr">{i + 1}</span>
          </button>
        {/each}
      </div>
    </div>

    <a href="#split" class="fs-cta">{$t('home.formula.cta')} <span aria-hidden="true">↓</span></a>
  </div>
</div>

<style>
  .fs {
    --fs-text-0: var(--fs-ink-0);
    --fs-text-1: var(--fs-ink-1);
    --fs-text-2: var(--fs-ink-2);
    display: grid;
    gap: clamp(20px, 3vw, 36px) clamp(24px, 5vw, 72px);
    grid-template-columns: minmax(0, 1fr);
    grid-template-areas: 'head' 'stage' 'body';
    max-width: 1120px;
    margin-inline: auto;
  }
  /* On the dark page the deep inks vanish; the bright fills are the readable ones. */
  :global(html.dark) .fs {
    --fs-text-0: var(--fs-fill-0);
    --fs-text-1: var(--fs-fill-1);
    --fs-text-2: var(--fs-fill-2);
  }
  /* One column: the sentence has to stay on screen with the drawing, above the
     pinned CTA row, so the stage gives up height and the caption goes first. */
  @media (max-width: 899px) {
    .fs-svg {
      max-height: min(50vh, 520px);
    }
    .fs-captions {
      order: -1;
    }
  }
  @media (min-width: 900px) {
    .fs {
      grid-template-columns: minmax(0, 1fr) minmax(0, 430px);
      grid-template-rows: auto 1fr;
      grid-template-areas: 'head stage' 'body stage';
      align-items: start;
    }
  }
  .fs-head {
    grid-area: head;
  }
  .fs-stage {
    grid-area: stage;
    width: 100%;
    max-width: 430px;
    margin-inline: auto;
    padding: 10px 14px 16px;
    background: var(--hm-surface);
    border: 1px solid var(--hm-line);
    border-radius: var(--hm-radius-lg);
    box-shadow: var(--hm-shadow);
  }
  .fs-body {
    grid-area: body;
    display: flex;
    flex-direction: column;
    gap: 18px;
  }

  .fs-eyebrow {
    font-size: 14px;
    font-weight: 700;
    letter-spacing: 1.5px;
    color: var(--hm-accent);
  }
  .fs-title {
    margin: 8px 0 0;
    font-family: var(--hm-display);
    font-weight: var(--hm-display-weight);
    font-size: clamp(32px, 4.4vw, 56px);
    line-height: 1.08;
    color: var(--hm-ink);
  }
  .fs-sub {
    margin: 12px 0 0;
    font-size: 18px;
    line-height: 1.55;
    color: var(--hm-muted);
    max-width: 46ch;
  }

  /* --- the drawing ------------------------------------------------------ */
  .fs-svg {
    display: block;
    width: 100%;
    height: auto;
    /* the whole story has to fit one screen: a stage you must scroll to see
       the bottom of loses the customer, who enters from below */
    max-height: min(66vh, 520px);
    margin-inline: auto;
    direction: ltr;
    font-family: inherit;
  }
  .fs-num {
    font-weight: 800;
    font-variant-numeric: tabular-nums;
    unicode-bidi: isolate;
  }
  .fs-eq {
    font-size: 20px;
  }
  .fs-pct {
    font-size: 18px;
  }
  .fs-pay {
    font-size: 16px;
  }
  .fs-total {
    font-size: 21px;
    fill: var(--hm-ink);
  }
  .fs-card {
    fill: var(--hm-surface);
    stroke-width: 2;
  }
  .fs-card-num {
    font-size: 14px;
    fill: var(--hm-ink);
  }
  .fs-tick {
    fill: #15803d;
  }
  :global(html.dark) .fs-tick {
    fill: #22c55e;
  }
  .fs-coin {
    fill: #f0c040;
    stroke: #8a6a15;
    stroke-width: 1.5;
  }
  .fs-track {
    stroke: var(--hm-track);
  }
  .fs-grey {
    color: var(--hm-muted);
  }

  /* --- alternatives stacked in one cell: the tallest sets the height ---- */
  .fs-stack {
    display: grid;
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .fs-stack > * {
    grid-area: 1 / 1;
    margin: 0;
    opacity: 0;
    transition: opacity 0.35s ease;
  }
  .fs-stack > .on {
    opacity: 1;
  }
  .fs-reading {
    margin-top: 4px;
    padding-top: 12px;
    border-top: 1px solid var(--hm-line);
    text-align: center;
    font-size: 15px;
    font-weight: 700;
    line-height: 1.45;
    color: var(--hm-ink);
  }
  .fs-reading .fs-pure {
    font-weight: 600;
    color: var(--hm-muted);
  }
  .fs-captions {
    font-size: clamp(18px, 1.7vw, 21px);
    line-height: 1.5;
    color: var(--hm-ink);
    max-width: 44ch;
  }

  /* --- controls --------------------------------------------------------- */
  .fs-chips,
  .fs-controls,
  .fs-dots {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px;
  }
  .fs-controls {
    gap: 14px;
  }
  .fs-chip,
  .fs-play,
  .fs-dot {
    font: inherit;
    cursor: pointer;
    border: 1px solid var(--hm-line);
    background: var(--hm-chip);
    color: var(--hm-ink);
    border-radius: var(--hm-pill);
  }
  .fs-chip {
    padding: 7px 16px;
    font-size: 15px;
    font-weight: 600;
  }
  .fs-chip.on {
    background: var(--hm-ink);
    color: var(--hm-bg);
    border-color: var(--hm-ink);
  }
  .fs-play {
    min-width: 7.5em;
    padding: 9px 18px;
    font-size: 15px;
    font-weight: 700;
    background: var(--hm-cta-bg);
    color: var(--hm-cta-ink);
    border-color: transparent;
  }
  .fs-dot {
    width: 36px;
    height: 36px;
    font-size: 14px;
    font-weight: 700;
    color: var(--hm-muted);
  }
  .fs-dot.done {
    color: var(--hm-ink);
    border-color: var(--hm-ink);
  }
  .fs-dot.on {
    background: var(--hm-accent);
    border-color: var(--hm-accent);
    color: var(--hm-surface);
  }
  .fs-chip:focus-visible,
  .fs-play:focus-visible,
  .fs-dot:focus-visible,
  .fs-cta:focus-visible {
    outline: 3px solid var(--hm-accent);
    outline-offset: 2px;
  }
  .fs-cta {
    align-self: flex-start;
    font-size: 16px;
    font-weight: 700;
    color: var(--hm-accent);
    text-decoration: underline;
    text-underline-offset: 4px;
  }
</style>
