<!--
  A person in the Connection step: a drawn portrait in a warm circle, their
  name and what they do. Invented people only — the portrait is a line
  drawing on purpose, so nobody reads it as a real member's photo. `me` is the
  visitor's own place in the circle: a gold outline waiting to be filled.
-->
<script>
  /**
   * @type {{
   *   hue: number,
   *   variant?: number,
   *   name: string,
   *   tag: string,
   *   num?: string,
   *   me?: boolean,
   *   invited?: boolean,
   *   dim?: boolean,
   *   active?: boolean
   * }}
   */
  let { hue, variant = 0, name, tag, num = '', me = false, invited = false, dim = false, active = false } = $props();

  const SKIN = ['#f3cfae', '#dcaa7e', '#b07a55', '#e8bb92'];
  const HAIR = ['#3a2418', '#6b3e1f', '#1f1a17', '#a0622d'];
  let skin = $derived(SKIN[variant % SKIN.length]);
  let hair = $derived(HAIR[(variant * 3 + 1) % HAIR.length]);
  let style = $derived(variant % 3);
</script>

<span class="orb" class:me class:invited class:dim class:active>
  <span class="disc" style="--h:{hue}">
    <svg viewBox="0 0 100 100" aria-hidden="true">
      {#if me}
        <circle cx="50" cy="38" r="15" class="ghost" />
        <path d="M22 92c2-20 14-30 28-30s26 10 28 30" class="ghost" />
        <path d="M50 30v16M42 38h16" class="plus" />
      {:else}
        <path d="M20 100c2-24 14-34 30-34s28 10 30 34z" fill="hsl({hue} 45% 68%)" class="line" />
        {#if style === 1}
          <path d="M30 44c-2-20 8-30 20-30s22 10 20 30c-2 12-4 22-4 22H34s-2-10-4-22z" fill={hair} />
        {/if}
        <circle cx="50" cy="40" r="17" fill={skin} class="line" />
        {#if style === 0}
          <path d="M33 38c0-12 8-19 17-19s17 7 17 19c-5-6-12-8-17-8s-12 2-17 8z" fill={hair} />
        {:else if style === 1}
          <path d="M33 37c1-11 8-17 17-17s16 6 17 17c-6-5-11-7-17-7s-11 2-17 7z" fill={hair} />
        {:else}
          <path d="M34 34c2-9 9-13 16-13s14 4 16 13c-4-2-10-3-16-3s-12 1-16 3z" fill={hair} />
        {/if}
      {/if}
    </svg>
    {#if num}<span class="num" aria-hidden="true">{num}</span>{/if}
    {#if invited}<span class="check" aria-hidden="true">✓</span>{/if}
  </span>
  <span class="name" dir="auto">{name}</span>
  <span class="tag" dir="auto">{tag}</span>
</span>

<style>
  .orb {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.15rem;
    width: clamp(130px, 8.5vw, 170px);
    text-align: center;
    transition:
      opacity 250ms ease,
      transform 250ms ease;
  }
  .orb.dim {
    opacity: 0.32;
  }
  .orb.active {
    transform: scale(1.08);
  }
  .disc {
    position: relative;
    width: clamp(70px, 4.6vw, 92px);
    aspect-ratio: 1;
    border-radius: 50%;
    background: hsl(var(--h) 60% 93%);
    border: 4px solid #fff;
    box-shadow:
      0 0 0 2px var(--ex-gold-soft),
      0 12px 28px rgba(58, 36, 24, 0.14);
    overflow: visible;
    transition: box-shadow 250ms ease;
  }
  .disc svg {
    width: 100%;
    height: 100%;
    border-radius: 50%;
    overflow: hidden;
  }
  .line {
    stroke: var(--ex-ink);
    stroke-width: 2;
  }
  .ghost {
    fill: none;
    stroke: var(--ex-gold);
    stroke-width: 3;
    stroke-dasharray: 6 6;
  }
  .plus {
    stroke: var(--ex-pink);
    stroke-width: 4;
    stroke-linecap: round;
  }
  .me .disc {
    background: #fff;
    box-shadow:
      0 0 0 3px var(--ex-gold),
      0 12px 28px rgba(58, 36, 24, 0.14);
  }
  .invited .disc,
  .active .disc {
    box-shadow:
      0 0 0 4px var(--ex-pink),
      0 0 0 12px rgba(226, 18, 122, 0.14),
      0 14px 30px rgba(184, 0, 105, 0.22);
  }
  .num {
    position: absolute;
    top: -6px;
    inset-inline-start: -6px;
    width: 1.9rem;
    height: 1.9rem;
    display: grid;
    place-items: center;
    border-radius: 50%;
    background: var(--ex-gold-soft);
    color: var(--ex-ink);
    font-weight: 800;
    font-size: 1rem;
  }
  .check {
    position: absolute;
    bottom: -4px;
    inset-inline-end: -4px;
    width: 2.1rem;
    height: 2.1rem;
    display: grid;
    place-items: center;
    border-radius: 50%;
    background: var(--ex-pink);
    color: #fff;
    font-weight: 800;
    font-size: 1.15rem;
    border: 3px solid #fff;
  }
  .name {
    margin-top: 0.35rem;
    font-size: clamp(1.1rem, 1.2vw, 1.5rem);
    font-weight: 800;
    color: var(--ex-ink);
  }
  .tag {
    font-size: clamp(0.85rem, 0.95vw, 1.15rem);
    color: var(--ex-ink-soft);
    line-height: 1.2;
  }
</style>
