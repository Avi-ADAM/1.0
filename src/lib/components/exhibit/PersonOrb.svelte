<!--
  A person in the Connection step: a drawn portrait in a warm circle, their
  name and what they do. Invented people only — the portrait is a line
  drawing on purpose, so nobody reads it as a real member's photo. `me` is the
  visitor's own place in the circle: a gold outline waiting to be filled.
-->
<script>
  import Face from './Face.svelte';

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

</script>

<span class="orb" class:me class:invited class:dim class:active>
  <span class="disc" style="--h:{hue}">
    <Face {hue} {variant} {me} />
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
