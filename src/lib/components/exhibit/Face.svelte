<!--
  A drawn face for /exhibit's invented people: a line portrait in a warm disc,
  never a photo, so nobody reads it as a real member. `me` is the visitor's
  own place — a dashed outline waiting to be filled.
-->
<script>
  /** @type {{ hue: number, variant?: number, me?: boolean }} */
  let { hue, variant = 0, me = false } = $props();

  const SKIN = ['#f3cfae', '#dcaa7e', '#b07a55', '#e8bb92'];
  const HAIR = ['#3a2418', '#6b3e1f', '#1f1a17', '#a0622d'];
  let skin = $derived(SKIN[variant % SKIN.length]);
  let hair = $derived(HAIR[(variant * 3 + 1) % HAIR.length]);
  let style = $derived(variant % 3);
</script>

<svg viewBox="0 0 100 100" aria-hidden="true" class="face" style="--h:{hue}">
  {#if me}
    <circle cx="50" cy="38" r="15" class="ghost" />
    <path d="M22 92c2-20 14-30 28-30s26 10 28 30" class="ghost" />
    <path d="M50 30v16M42 38h16" class="plus" />
  {:else}
    <path d="M20 100c2-24 14-34 30-34s28 10 30 34z" fill="hsl({hue} 45% 68%)" class="stroke" />
    {#if style === 1}
      <path d="M30 44c-2-20 8-30 20-30s22 10 20 30c-2 12-4 22-4 22H34s-2-10-4-22z" fill={hair} />
    {/if}
    <circle cx="50" cy="40" r="17" fill={skin} class="stroke" />
    {#if style === 0}
      <path d="M33 38c0-12 8-19 17-19s17 7 17 19c-5-6-12-8-17-8s-12 2-17 8z" fill={hair} />
    {:else if style === 1}
      <path d="M33 37c1-11 8-17 17-17s16 6 17 17c-6-5-11-7-17-7s-11 2-17 7z" fill={hair} />
    {:else}
      <path d="M34 34c2-9 9-13 16-13s14 4 16 13c-4-2-10-3-16-3s-12 1-16 3z" fill={hair} />
    {/if}
  {/if}
</svg>

<style>
  .face {
    width: 100%;
    height: 100%;
    border-radius: 50%;
    overflow: hidden;
    background: hsl(var(--h) 60% 93%);
  }
  .stroke {
    stroke: var(--ex-ink, #3a2418);
    stroke-width: 2;
  }
  .ghost {
    fill: none;
    stroke: var(--ex-gold, #d4a12a);
    stroke-width: 3;
    stroke-dasharray: 6 6;
  }
  .plus {
    stroke: var(--ex-pink, #e2127a);
    stroke-width: 4;
    stroke-linecap: round;
  }
</style>
