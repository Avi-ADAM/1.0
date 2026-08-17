<!--
  MotionControl.svelte — the visitor's handle on the homepage's 3D scene.

  WCAG 2.2 SC 2.2.2 (Pause, Stop, Hide) is a level-A criterion: anything that
  moves by itself for more than five seconds, alongside other content, needs a
  mechanism to stop it. The scene had none, and `prefers-reduced-motion` does
  not stand in for one — it only reaches visitors who already set that
  preference in their operating system, not the visitor who simply grows tired
  of the movement while reading.

  Three states, cycled by one button:

    ▶  playing — full motion (which still eases down on its own once the
                 visitor has been still for a few seconds; see $lib/stores/motion.js)
    ⏸  paused  — the scene stays on screen and still answers to scroll, but
                 nothing moves on its own
    ⃠   hidden  — the canvas is unmounted entirely and its models never load

  The control itself stays put in every state: whatever hides the scene has to
  be able to bring it back.
-->
<script>
  import { t } from '$lib/translations';
  import {
    motionMode,
    motionChoice,
    MOTION_MODES,
    setMotionChoice,
    nextMotionMode
  } from '$lib/stores/motion.js';

  // The label names the state the visitor is in *and* the one the button moves
  // to, because a cycling control gives no other clue about what pressing it
  // does. Both halves are read out, so a screen-reader user never has to press
  // it to find out.
  let stateLabel = $derived(
    $motionMode === MOTION_MODES.full
      ? $t('home.motion.playing')
      : $motionMode === MOTION_MODES.calm
        ? $t('home.motion.paused')
        : $t('home.motion.hidden')
  );

  let next = $derived(nextMotionMode($motionMode));

  let actionLabel = $derived(
    next === MOTION_MODES.full
      ? $t('home.motion.toPlay')
      : next === MOTION_MODES.calm
        ? $t('home.motion.toPause')
        : $t('home.motion.toHide')
  );
</script>

<!-- `left-3`, not the logical `start-3`: the site-wide accessibility panel is
     pinned to the bottom-right corner, and a logical property would swing this
     control into that same corner on the Hebrew and Arabic renders. A physical
     side keeps the two apart in every language. -->
<div
  class="fixed bottom-20 sm:bottom-4 left-3 z-[700] print:hidden"
  role="group"
  aria-label={$t('home.motion.label')}
>
  <button
    type="button"
    onclick={() => setMotionChoice(next)}
    title="{stateLabel} · {actionLabel}"
    aria-label="{stateLabel}. {actionLabel}"
    class="group flex items-center gap-1.5 rounded-full border-2 border-gold bg-cyan-50/80 px-2.5 py-2 text-slate-800 shadow-md backdrop-blur-sm
           transition-colors hover:bg-gold/25 hover:text-rose-800
           focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-barbi"
  >
    <!-- aria-hidden: the button's own aria-label already carries the meaning,
         so the icon must not be announced a second time. -->
    <svg
      class="w-4 h-4 shrink-0"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      {#if $motionMode === MOTION_MODES.full}
        <!-- currently playing → the button pauses -->
        <path d="M14,19H18V5H14M6,19H10V5H6V19Z" />
      {:else if $motionMode === MOTION_MODES.calm}
        <!-- currently paused → the button hides -->
        <path
          d="M11.83,9L15,12.16C15,12.11 15,12.05 15,12A3,3 0 0,0 12,9C11.94,9 11.89,9 11.83,9M7.53,9.8L9.08,11.35C9.03,11.56 9,11.77 9,12A3,3 0 0,0 12,15C12.22,15 12.44,14.97 12.65,14.92L14.2,16.47C13.53,16.8 12.79,17 12,17A5,5 0 0,1 7,12C7,11.21 7.2,10.47 7.53,9.8M2,4.27L4.28,6.55L4.73,7C3.08,8.3 1.78,10 1,12C2.73,16.39 7,19.5 12,19.5C13.55,19.5 15.03,19.2 16.38,18.66L16.81,19.08L19.73,22L21,20.73L3.27,3M12,7A5,5 0 0,1 17,12C17,12.64 16.87,13.26 16.64,13.82L19.57,16.75C21.07,15.5 22.27,13.86 23,12C21.27,7.61 17,4.5 12,4.5C10.6,4.5 9.26,4.75 8,5.2L10.17,7.35C10.74,7.13 11.35,7 12,7Z"
        />
      {:else}
        <!-- currently hidden → the button restores full motion -->
        <path d="M8,5.14V19.14L19,12.14L8,5.14Z" />
      {/if}
    </svg>
    <span class="text-xs font-semibold whitespace-nowrap">{stateLabel}</span>
  </button>

  <!-- An explicit way back to "decide for me", offered only once the visitor has
       overridden the automatic choice. Without it, someone who pressed the
       button on a whim can never get the theme/OS default back. -->
  {#if $motionChoice !== 'auto'}
    <button
      type="button"
      onclick={() => setMotionChoice('auto')}
      class="mt-1 block w-full rounded-full px-2 py-0.5 text-[0.65rem] text-slate-600 underline decoration-dotted
             hover:text-rose-800
             focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-barbi"
    >
      {$t('home.motion.auto')}
    </button>
  {/if}
</div>
