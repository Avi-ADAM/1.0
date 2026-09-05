<!--
  How the split actually works - the depth behind the homepage hook.

  The homepage keeps the part that sells: "fifty-fifty is not fairness, it is
  giving up on the arithmetic", the four ways it breaks a partnership, and the
  calculator - the one asset that turns the claim into a number the reader
  produced themselves. What it no longer keeps is the explaining: why those
  four failures are the method's fault rather than the partners', the three
  steps the mechanism runs, and what transparency buys once it is in place.
  That is this component, and it is what /partnership is for.

  The copy is unchanged and still reads from the `home` namespace - it was
  already translated into five languages, and the split here is about where a
  reader meets it, not about rewriting it.

  `onConsensus` exists because the decisions card points somewhere: on the
  homepage that was a scroll to #consensus, and on a page of its own it has to
  be a link. The parent supplies whichever is right for it.
-->
<script>
  import { t } from '$lib/translations';
  import EntityIcon from '$lib/celim/icons/EntityIcon.svelte';

  let {
    /** Called when the reader follows the consensus card. */
    onConsensus
  } = $props();

  /* Moved here with the cards themselves - fpage was the only other holder,
     and it no longer renders them. Kept out of the `{#each}` so the @type
     annotation reaches the checker; a JSDoc cast inside a template expression
     does not. */
  /** @type {[import('$lib/celim/icons/entityIcons').EntityIconKind, string][]} */
  const SPLIT_CARDS = [
    ['search', 'b1'],
    ['votes', 'b2'],
    ['target', 'b3'],
    ['opportunity', 'b4']
  ];
</script>

  <p
    class="mt-4 bg-cyan-50/60 backdrop-blur-sm border-2 border-gold rounded-2xl px-4 py-3 text-slate-900 text-base sm:text-sm leading-relaxed text-center shadow"
  >
    {$t('home.split.blame')}
  </p>

  <!-- הפתרון: פשוט לחשב -->
  <div
    class="mt-6 rounded-2xl border-2 border-gold bg-gradient-to-br from-amber-100 via-amber-50 to-rose-50 px-4 py-5 shadow-lg"
  >
    <h3
      class="text-rose-700 font-bold text-2xl sm:text-xl mb-1 text-center"
    >
      {$t('home.split.solutionTitle')}
    </h3>
    <p
      class="text-slate-800 text-base sm:text-sm leading-relaxed text-center mb-4"
    >
      {$t('home.split.solutionLead')}
    </p>
    <div class="flex flex-col gap-2">
      {#each ['step1', 'step2', 'step3'] as s, i}
        <div
          class="flex items-start gap-3 bg-cyan-50/80 border border-gold/60 rounded-xl px-3 py-3"
        >
          <span
            class="shrink-0 w-7 h-7 rounded-full bg-barbi text-gold font-bold flex items-center justify-center text-sm"
            >{i + 1}</span
          >
          <div class="text-start">
            <h4 class="text-rose-700 font-bold text-lg sm:text-base">
              {$t(`home.split.${s}_t`)}
            </h4>
            <p class="text-slate-800 text-base sm:text-sm leading-relaxed">
              {$t(`home.split.${s}_d`)}
            </p>
          </div>
        </div>
        {#if i < 2}
          <div
            class="text-center text-gold text-xl leading-none"
            aria-hidden="true"
          >
            ↓
          </div>
        {/if}
      {/each}
    </div>
    <p
      class="mt-4 text-center text-rose-700 font-bold text-lg sm:text-base"
    >
      {$t('home.split.formula')}
    </p>
  </div>

  <!-- מה זה נותן בפועל -->
  <div class="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
    {#each SPLIT_CARDS as [icon, key] (key)}
      <div
        class="bg-cyan-50/70 backdrop-blur-sm border-2 border-gold rounded-lg p-4 shadow flex flex-col"
      >
        <div class="mb-1"><EntityIcon kind={icon} size={24} tone="brand" /></div>
        <h3 class="text-rose-700 font-bold text-lg sm:text-base mb-1">
          {$t(`home.split.${key}_t`)}
        </h3>
        <p class="text-slate-800 text-base sm:text-sm leading-relaxed">
          {$t(`home.split.${key}_d`)}
        </p>
      </div>
    {/each}

    <!-- החישוב מכריע כמה כל אחד לקח; ההצבעות מכריעות מה בכלל עושים.
         כרטיס רחב כי זו הפסקה היחידה כאן שמובילה הלאה — למנוע ההסכמה. -->
    <div
      class="sm:col-span-2 bg-cyan-50/70 backdrop-blur-sm border-2 border-barbi/60 rounded-lg p-4 shadow flex flex-col"
    >
      <div class="mb-1"><EntityIcon kind="maagad" size={24} tone="brand" /></div>
      <h3 class="text-rose-700 font-bold text-lg sm:text-base mb-1">
        {$t('home.split.b5_t')}
      </h3>
      <p class="text-slate-800 text-base sm:text-sm leading-relaxed">
        {$t('home.split.b5_d')}
      </p>
      <button
        type="button"
        class="mt-2 self-start text-barbi font-bold text-base sm:text-sm underline underline-offset-4 hover:text-rose-700 transition-colors"
        onclick={onConsensus}
      >
        {$t('home.split.b5_link')}
      </button>
    </div>
  </div>

  <p
    class="mt-4 text-center bg-cyan-50/60 backdrop-blur-sm border border-gold/70 rounded-2xl px-4 py-3 text-slate-800 text-base sm:text-sm leading-relaxed"
  >
    {$t('home.split.more')}
  </p>
