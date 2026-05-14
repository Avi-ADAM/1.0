<script>
  import { lang } from '$lib/stores/lang.js';
  import Grow from '$lib/celim/icons/grow.svelte';
  /**
   * @typedef {Object} Props
   * @property {boolean} [animate]
   * @property {boolean} [gr]
   * @property {boolean} [pic]
   * @property {string} [src]
   * @property {string} [alt]
   * @property {boolean} [single]
   * @property {boolean} [reverse]
   * @property {boolean} [big]
   * @property {boolean} [sm]
   * @property {boolean} [openi]
   * @property {boolean} [closei]
   * @property {boolean} [blue]
   * @property {boolean} [gray]
   * @property {boolean} [red]
   * @property {boolean} [green]
   * @property {boolean} [yellow]
   * @property {boolean} [indigo]
   * @property {boolean} [purple]
   * @property {boolean} [pink]
   * @property {boolean} [wow]
   * @property {boolean} [gold]
   * @property {boolean} [neww]
   * @property {boolean} [roseGold]
   * @property {string} [word]
   * @property {string} [bg]
   * @property {boolean} [closeiline]
   * @property {import('svelte').Snippet} [children]
   */

  /** @type {Props} */
  let {
    animate = false,
    gr = false,
    pic = false,
    src = '',
    alt = '',
    single = false,
    reverse = false,
    big = false,
    sm = false,
    openi = false,
    closei = false,
    blue = false,
    gray = false,
    red = false,
    green = false,
    yellow = false,
    indigo = false,
    purple = false,
    pink = false,
    wow = false,
    gold = false,
    neww = false,
    roseGold = false,
    word = 'word',
    bg = 'blue',
    closeiline = true,
    children
  } = $props();

  $effect(() => {
    blue = false;
    gray = false;
    red = false;
    green = false;
    yellow = false;
    indigo = false;
    purple = false;
    pink = false;
    wow = false;
    gold = false;
    neww = false;
    roseGold = false;

    if (bg == 'blue') blue = true;
    else if (bg == 'pink') pink = true;
    else if (bg == 'yellow') yellow = true;
    else if (bg == 'green') green = true;
    else if (bg == 'indigo') indigo = true;
    else if (bg == 'gray') gray = true;
    else if (bg == 'red') red = true;
    else if (bg == 'purple') purple = true;
    else if (bg == 'wow') wow = true;
    else if (bg == 'gold') gold = true;
    else if (bg == 'neww') neww = true;
    else if (bg == 'roseGold') roseGold = true;
  });

  const colorMap = {
    blue:   'bg-blue-400/20   text-blue-700   border-blue-300/60   hover:bg-blue-400/35   hover:border-blue-400/80   dark:bg-blue-600/75   dark:text-blue-50    dark:border-blue-500/60   dark:hover:bg-blue-600/90',
    gray:   'bg-white/20      text-gray-600   border-gray-300/50   hover:bg-white/35     hover:border-gray-400/70   dark:bg-gray-600/75   dark:text-gray-50    dark:border-gray-500/50   dark:hover:bg-gray-600/90',
    red:    'bg-red-400/20    text-red-700    border-red-300/60    hover:bg-red-400/35   hover:border-red-400/80    dark:bg-red-700/75    dark:text-red-50     dark:border-red-500/60    dark:hover:bg-red-700/90',
    green:  'bg-green-500/25  text-green-900  border-green-400/60  hover:bg-green-500/40 hover:border-green-500/80  dark:bg-green-700/75  dark:text-green-50   dark:border-green-500/50  dark:hover:bg-green-700/90',
    yellow: 'bg-yellow-300/25 text-yellow-700 border-yellow-300/60 hover:bg-yellow-300/40 hover:border-yellow-400/80 dark:bg-yellow-700/75 dark:text-yellow-50  dark:border-yellow-600/50 dark:hover:bg-yellow-700/90',
    indigo: 'bg-indigo-400/20 text-indigo-700 border-indigo-300/60 hover:bg-indigo-400/35 hover:border-indigo-400/80 dark:bg-indigo-600/75 dark:text-indigo-50  dark:border-indigo-500/50 dark:hover:bg-indigo-600/90',
    purple: 'bg-purple-400/20 text-purple-700 border-purple-300/60 hover:bg-purple-400/35 hover:border-purple-400/80 dark:bg-purple-600/75 dark:text-purple-50  dark:border-purple-500/50 dark:hover:bg-purple-600/90',
    pink:   'bg-pink-400/20   text-pink-700   border-pink-300/60   hover:bg-pink-400/35  hover:border-pink-400/80   dark:bg-pink-600/75   dark:text-pink-50    dark:border-pink-500/60   dark:hover:bg-pink-600/90'
  };

  let colorClasses = $derived(
    neww
      ? 'animate-shine border bg-[linear-gradient(110deg,#EEE8AA,45%,#d4c48b,55%,#EEE8AA)] bg-[length:200%_100%] px-3 py-1 font-medium text-neutral-900 transition-colors'
      : roseGold
        ? 'animate-shine border border-white/40 bg-[linear-gradient(110deg,rgba(238,232,170,0.3),45%,rgba(244,114,182,0.3),55%,rgba(238,232,170,0.3))] bg-[length:200%_100%] backdrop-blur-sm px-3 py-1 font-medium text-barbi transition-colors shadow-sm'
        : wow
          ? 'bg-neww text-wowt border-white/30 hover:bg-wow'
          : gold
            ? [
                'text-amber-950  font-bold border-yellow-400/60 bg-[length:200%_auto]',
                animate
                  ? 'animate-gradientxslow bg-[linear-gradient(to_left,theme(colors.gra),theme(colors.grb),theme(colors.grc),theme(colors.grd),theme(colors.gre),theme(colors.grd),theme(colors.grc),theme(colors.grb),theme(colors.gra))]'
                  : 'bg-[linear-gradient(to_bottom_right,theme(colors.gra),theme(colors.gold),theme(colors.grc),theme(colors.gra))]',
                'hover:bg-[linear-gradient(to_right,theme(colors.gold),theme(colors.grb),theme(colors.grb),theme(colors.gold))]'
              ].join(' ')
            : (colorMap[bg] ?? colorMap['blue'])
  );
</script>

<span
  class:line-through={closei == true && closeiline == true}
  class:py-0.5={sm == false && big == false}
  class:px-2.5={sm == false && big == false}
  class:text-xs={sm == false && big == false}
  class:text-xl={big == true}
  class:px-5={big == true}
  class:py-1={big == true}
  class:font-sans={$lang == 'en'}
  class:flex-row-reverse={reverse == true}
  class:mr-2={single != true}
  class:mb-2={single != true}
  class:flex-wrap={pic == true}
  class="backdrop-blur-md border rounded-full font-semibold inline-flex items-center transition-all duration-300 shadow-md select-none {colorClasses}"
>
  {#if pic}
    <span class="mx-1">
      <img
        {src}
        {alt}
        class:min-w-12={big == true}
        class:h-12={big == true}
        class:min-w-7={big == false}
        class:h-7={big == false}
        class="border-2 border-white/70 max-w-max rounded-full shadow-sm"
      />
    </span>
  {/if}

  {@html word}

  {#if children}
    {@render children()}
  {/if}

  {#if closei}
    <svg
      aria-hidden="true"
      class="w-3 h-3 sm:w-5 sm:h-5 bg-white/40 backdrop-blur-sm rounded-full mx-1 opacity-70 hover:opacity-100 transition-opacity"
      fill="currentColor"
      viewBox="0 0 20 20"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        fill-rule="evenodd"
        d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
        clip-rule="evenodd"
      />
    </svg>
  {/if}

  {#if openi}
    <svg
      aria-hidden="true"
      class="w-3 h-3 sm:w-6 sm:h-6 bg-white/40 backdrop-blur-sm rounded-full mx-1 opacity-70 hover:opacity-100 transition-opacity"
      fill="currentColor"
      viewBox="0 0 20 20"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        fill-rule="evenodd"
        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
        clip-rule="evenodd"
      />
    </svg>
  {/if}

  {#if gr}
    <span class="mx-0.5">
      <Grow width={big ? 26 : 13} height={big ? 26 : 13} />
    </span>
  {/if}
</span>
