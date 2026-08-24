<script module>
  // How many bars are alive. A route change can swap one mount point for the
  // other — `(reg)`/`(regandnon)` mount the bar through `foot.svelte`, every
  // other route through the root layout — and Svelte may set the new instance
  // up before tearing the old one down. Counting means whichever order it
  // picks, the last word on --foot-pad belongs to the bar that is on screen.
  let live = 0;
</script>

<script>
  import { t } from '$lib/translations';
  import { onMount } from 'svelte';
  import { lang } from '$lib/stores/lang.js';
  import { isChatOpen } from '$lib/stores/pendMisMes.js';
  import { navigating } from '$app/state';
  import { page } from '$app/state';
  import { goto } from '$app/navigation';
  import Chaticon from '$lib/celim/chaticon.svelte';
  import MoachIcon from '$lib/celim/icons/moachIcon.svelte';
  import Lev from '$lib/celim/lev.svelte';
  import ProfileMenu from '$lib/components/footer/ProfileMenu.svelte';
  import GuestMenu from '$lib/components/footer/GuestMenu.svelte';
  import DiscoverMenu from '$lib/components/footer/DiscoverMenu.svelte';
  import AppearanceMenu from '$lib/components/footer/AppearanceMenu.svelte';
  import { idPr } from '$lib/stores/idPr';
  /**
   * The bottom bar, on every page of the site. Its chrome (bar / column / mini
   * pill, the appearance handle, the minimize handle) is the same for everyone;
   * only the tabs differ.
   *
   * A **guest** never sees a tab that needs an account. Every registered-only
   * destination — /hub, /moach, /lev, /me, the chat panel, /deals and the whole
   * "more" menu — lives behind the `(reg)` (or /deals) server guard, which
   * redirects to /login. Offering them would be a footer full of dead ends, so
   * the guest bar carries the public pages instead, with login and signup in
   * their place.
   *
   * @typedef {Object} Props
   * @property {string} [initialRout]
   * @property {boolean} [isAuthed] - Signed in: the full tab set. Guest: the public one.
   * @property {() => void} [onChat] - Callback for chat event
   * @property {() => void} [onNew] - Callback for new item creation event
   */
  let { initialRout = '', onChat, onNew, isAuthed = false } = $props();
  function addi(kind) {
    if (kind == 'chat') {
      // The floating chat panel belongs to `foot.svelte`, which only the
      // `(reg)` / `(regandnon)` layouts mount. On every other route the bar
      // comes from the root layout with no panel behind it, so the tab opens
      // the full page instead of doing nothing at all.
      if (onChat) onChat();
      else goto('/forum');
    } else {
      onNew?.();
    }
  }
  let activeRoute = $derived(page.url.pathname);

  // Footer display mode: full horizontal bar, minimized pill, or a vertical
  // column (for screen widths where the 7-slot bar gets cramped — opening
  // upward always has room). Persisted so the choice survives navigation.
  let footMode = $state('bar'); // 'bar' | 'mini' | 'vertical'
  onMount(() => {
    try {
      const saved = localStorage.getItem('footMode');
      if (saved === 'mini' || saved === 'vertical') footMode = saved;
    } catch {}
  });
  function setMode(m) {
    footMode = m;
    try {
      localStorage.setItem('footMode', m);
    } catch {}
  }

  // How much room the bar needs at the bottom of the document, per mode. Read
  // by `body { padding-bottom: var(--foot-pad) }` in app.postcss — the bar is
  // `position: fixed`, so without this it sits on top of whatever the page
  // ends with, which is why pages have been hand-rolling `pb-24` for years.
  // The vertical column is a side dock and leaves the bottom of the text column
  // free, so it reserves nothing.
  const FOOT_PAD = { bar: '4.5rem', mini: '3rem', vertical: '0px' };
  $effect(() => {
    const want = FOOT_PAD[footMode] ?? '0px';
    const root = document.documentElement;
    const body = document.body;
    // `--foot-pad` below is conditional — a page that fits the viewport gets
    // none. But such a page still has to keep its own bottom row out from under
    // the bar, and it cannot do that with a reserve that reads 0. So publish the
    // bar's height unconditionally as `--foot-h`, for anything laid out against
    // the viewport rather than against the document flow (the lev deck).
    root.style.setProperty('--foot-h', want);
    // Only pages that actually scroll get the reserve. One laid out to fill the
    // viewport exactly — the lev deck, a full-screen hero — was drawn around the
    // bar already, and a tail there would turn a fixed screen into a scrolling
    // one for nothing. Adding it to a page that already scrolls moves nothing on
    // screen; it only extends the run-out past the last row.
    const sync = () => {
      // scrollHeight counts whatever we set last time, so take it back out —
      // otherwise the reserve would go on justifying its own existence.
      const applied = parseFloat(getComputedStyle(body).paddingBottom) || 0;
      const contentH = root.scrollHeight - applied;
      root.style.setProperty(
        '--foot-pad',
        contentH > window.innerHeight ? want : '0px'
      );
    };
    live++;
    sync();
    const ro = new ResizeObserver(sync);
    ro.observe(body);
    window.addEventListener('resize', sync);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', sync);
      // The pages that hide the bar (the wish composer, onboarding) must not
      // keep a reserve for a bar that is gone — but a handover between the two
      // mount points must not clear the one that just took over either.
      if (--live === 0) {
        root.style.removeProperty('--foot-pad');
        root.style.removeProperty('--foot-h');
      }
    };
  });

  // Visible tab labels — every footer item carries a word, not just an icon.
  const KEYS = {
    hub: 'common.nav.hub',
    moach: 'common.nav.moach',
    chat: 'lev.cards.saleCard.chat',
    // `common.*` — the footer renders on every route, so its labels must come
    // from globally-loaded namespaces. `deals.*` is route-gated to /deals and
    // /lev, so this key rendered raw everywhere else.
    concierge: 'common.footer.concierge',
    deals: 'common.footer.deals',
    lev: 'common.nav.lev',
    minimize: 'common.footer.minimize',
    openUp: 'common.footer.openUp',
    openBar: 'common.footer.openBar',
    brain: 'common.footer.brain',
    newWish: 'common.footer.newWish',
    createNew: 'common.footer.createNew',
    home: 'common.footer.home',
    guide: 'common.footer.guide',
    login: 'common.footer.login',
    signup: 'common.footer.signup'
  };
  const L = (key) => $t(KEYS[key]);

  // The landing page is a per-language route, not a locale prefix: `/en` and
  // `/ar` are their own pages (see `src/routes/en`, `src/routes/ar`).
  let homeHref = $derived($lang === 'en' ? '/en' : $lang === 'ar' ? '/ar' : '/');
  // Come back where the visitor was after signing in — but never point `from`
  // at an auth page itself, which would bounce them in a circle.
  let loginHref = $derived(
    activeRoute && activeRoute !== '/' && !/^\/(?:login|signup)(?:\/|$)/.test(activeRoute)
      ? `/login?from=${encodeURIComponent(activeRoute)}`
      : '/login'
  );

  let vertical = $derived(footMode === 'vertical');

  // The bar keeps concierge dead centre by always holding an *odd* number of
  // tabs, shedding one from each side as it narrows:
  //   ≥520px  4|1|4  hub moach chat deals · concierge · discover lev profile more
  //   ≥400px  3|1|3  hub moach chat · concierge · discover lev more
  //   <400px  2|1|2  hub moach · concierge · lev more
  // Whatever the bar sheds reappears inside the "more" menu, so nothing
  // becomes unreachable. The vertical column has room for every tab and so
  // never hides one.
  // The guest bar holds fewer tabs, so it stops at 7 — and keeps the same odd
  // count so its centre button stays centred too:
  //   ≥400px  3|1|3  home guide discover · wish · signup login more
  //   <400px  2|1|2  home discover · wish · signup more
  // (guide and login reappear inside the guest "more" menu.)
  let fromMid = $derived(vertical ? '' : 'max-[399px]:hidden');
  let fromWide = $derived(vertical ? '' : 'max-[519px]:hidden');
  let gridCols = $derived(
    isAuthed
      ? 'grid-cols-5 min-[400px]:grid-cols-7 min-[520px]:grid-cols-9'
      : 'grid-cols-5 min-[400px]:grid-cols-7'
  );
  // Shared per-item classes for both orientations
  let itemClass = $derived(
    vertical
      ? 'inline-flex flex-col items-center justify-center gap-0.5 py-1.5 px-2 hover:bg-gray-50 dark:hover:bg-gray-800 group'
      : 'inline-flex flex-col items-center justify-center gap-0.5 px-2 hover:bg-gray-50 dark:hover:bg-gray-800 group'
  );
</script>

{#if footMode === 'mini'}
  <!-- Minimized: a small pill offering the two expand directions, centered so it
       doesn't collide with the chat bot bubble docked at the end corner -->
  <div
    class="fixed z-50 bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-1 p-1 bg-white border border-gray-200 rounded-full shadow-lg dark:bg-gray-700 dark:border-gray-600"
  >
    <button
      type="button"
      onclick={() => setMode('vertical')}
      title={L('openUp')}
      class="w-8 h-8 flex items-center justify-center rounded-full text-barbi hover:bg-gray-100 dark:hover:bg-gray-800"
    >
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-5 h-5">
        <path stroke-linecap="round" stroke-linejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" />
      </svg>
      <span class="sr-only">{L('openUp')}</span>
    </button>
    <button
      type="button"
      onclick={() => setMode('bar')}
      title={L('openBar')}
      class="w-8 h-8 flex items-center justify-center rounded-full text-barbi hover:bg-gray-100 dark:hover:bg-gray-800"
    >
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-5 h-5">
        <path stroke-linecap="round" stroke-linejoin="round" d="M3.75 9h16.5m-16.5 6h16.5" />
      </svg>
      <span class="sr-only">{L('openBar')}</span>
    </button>
    <span class="w-px h-5 bg-gray-200 dark:bg-gray-600"></span>
    <AppearanceMenu compact />
  </div>
{:else}
  <div
    class={vertical
      ? 'fixed z-50 bottom-2 start-2 w-20 bg-white border border-gray-200 rounded-3xl shadow-lg dark:bg-gray-700 dark:border-gray-600'
      : ' fixed z-50 w-full h-14 max-w-lg -translate-x-1/2 bg-white border border-gray-200 rounded-full bottom-0 left-1/2 dark:bg-gray-700 dark:border-gray-600'}
  >
    {#if navigating && navigating.to}
      <div
        class="absolute inset-0 rounded-[inherit] border-2 border-gold animate-pulse pointer-events-none"
      ></div>
    {/if}

    {#if vertical}
      <!-- Column header: back to bar / minimize -->
      <div class="flex items-center justify-between px-2 pt-1.5">
        <button
          type="button"
          onclick={() => setMode('bar')}
          title={L('openBar')}
          class="w-6 h-6 flex items-center justify-center rounded-full text-gray-400 hover:text-barbi hover:bg-gray-100 dark:hover:bg-gray-800"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-4 h-4">
            <path stroke-linecap="round" stroke-linejoin="round" d="M3.75 9h16.5m-16.5 6h16.5" />
          </svg>
          <span class="sr-only">{L('openBar')}</span>
        </button>
        <!-- Utility handles live with the footer, not free-floating over the
             page. Accessibility joins appearance here when it lands.
             Opens downward: the column already reaches high up the screen, so
             upward is where the room isn't. -->
        <AppearanceMenu compact drop="down" />
        <button
          type="button"
          onclick={() => setMode('mini')}
          title={L('minimize')}
          class="w-6 h-6 flex items-center justify-center rounded-full text-gray-400 hover:text-barbi hover:bg-gray-100 dark:hover:bg-gray-800"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-4 h-4">
            <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
          <span class="sr-only">{L('minimize')}</span>
        </button>
      </div>
    {:else}
      <!-- Utility handles ride the bar's start corner, mirroring the minimize
           handle at the other end, so nothing floats loose over the page where
           it can land on the bot bubble or the lev demand map. The
           accessibility button joins this cluster when it lands. -->
      <div class="absolute -top-3 start-3 flex items-center gap-1">
        <AppearanceMenu compact />
      </div>
      <!-- Minimize handle floating on the bar's corner -->
      <button
        type="button"
        onclick={() => setMode('mini')}
        title={L('minimize')}
        class="absolute -top-2.5 end-3 z-10 w-6 h-6 flex items-center justify-center rounded-full bg-white border border-gray-300 text-gray-400 shadow-sm hover:text-barbi dark:bg-gray-700 dark:border-gray-500"
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-3 h-3">
          <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
        <span class="sr-only">{L('minimize')}</span>
      </button>
    {/if}

    <div
      class={vertical
        ? 'flex flex-col items-stretch pb-1'
        : `grid h-full max-w-lg ${gridCols} mx-auto`}
    >
      {#if isAuthed}
        <button
          onclick={() => {
            activeRoute = '/hub';
            goto('/hub');
          }}
          type="button"
          class="{activeRoute == '/hub' ? 'border-b-2 border-gold' : ''} {vertical
            ? ''
            : 'rounded-s-full'} {itemClass}"
        >
          <div class="relative">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke-width="1.8"
              stroke="currentColor"
              class="w-6 h-6 text-barbi"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M2.25 12l8.954-8.955a1.126 1.126 0 011.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75"
              />
            </svg>
            {#if navigating && navigating.to?.url.pathname === '/hub'}
              <div
                class="absolute -inset-1 rounded-full border-2 border-transparent border-t-gold animate-spin"
              ></div>
            {/if}
          </div>
          <span class="text-[9px] leading-none text-gray-500 dark:text-gray-300">{L('hub')}</span>
        </button>

        <button
          onclick={() => {
            activeRoute = '/moach';
            if ($idPr != null) {
              idPr.set(null);
            }
            goto('/moach');
          }}
          type="button"
          class="{activeRoute == '/moach' ? 'border-b-2 border-gold' : ''} {itemClass}"
        >
          <div class="relative">
            <MoachIcon active={navigating?.to?.url.pathname == '/moach'} />
            {#if navigating && navigating.to?.url.pathname === '/moach'}
              <div
                class="absolute -inset-1 rounded-full border-2 border-transparent border-t-gold animate-spin"
              ></div>
            {/if}
          </div>
          <span class="text-[9px] leading-none text-gray-500 dark:text-gray-300">{L('moach')}</span>
        </button>

        <div
          id="tooltip-home"
          role="tooltip"
          class="absolute z-10 invisible inline-block px-3 py-2 text-sm font-medium text-white transition-opacity duration-300 bg-gray-900 rounded-lg shadow-sm opacity-0 tooltip dark:bg-gray-700"
        >
          {L('brain')}
          <div class="tooltip-arrow"></div>
        </div>

        <button
          onclick={() => addi('chat')}
          type="button"
          class="{$isChatOpen ? 'border-b-2 border-gold' : ''} {fromMid} {itemClass}"
        >
          <Chaticon />
          <span class="text-[9px] leading-none text-gray-500 dark:text-gray-300">{L('chat')}</span>
        </button>

        <button
          onclick={() => {
            activeRoute = '/deals';
            goto('/deals');
          }}
          type="button"
          class="{activeRoute == '/deals'
            ? 'border-b-2 border-gold'
            : ''} {fromWide} {itemClass}"
        >
          <div class="relative">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke-width="1.8"
              stroke="currentColor"
              class="w-6 h-6 text-barbi"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 00.75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 00-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0112 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 01-.673-.38m0 0A2.18 2.18 0 013 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 013.413-.387m7.5 0V5.25A2.25 2.25 0 0013.5 3h-3a2.25 2.25 0 00-2.25 2.25v.894m7.5 0a48.667 48.667 0 00-7.5 0"
              />
            </svg>
            {#if navigating && navigating.to?.url.pathname === '/deals'}
              <div
                class="absolute -inset-1 rounded-full border-2 border-transparent border-t-gold animate-spin"
              ></div>
            {/if}
          </div>
          <span class="text-[9px] leading-none text-gray-500 dark:text-gray-300">{L('deals')}</span>
        </button>

        <div
          id="tooltip-wallet"
          role="tooltip"
          class="absolute z-10 invisible inline-block px-3 py-2 text-sm font-medium text-white transition-opacity duration-300 bg-gray-900 rounded-lg shadow-sm opacity-0 tooltip dark:bg-gray-700"
        >
          {L('newWish')}
          <div class="tooltip-arrow" data-popper-arrow></div>
        </div>
        <div class="flex flex-col items-center justify-center gap-0.5 {vertical ? 'py-1.5' : ''}">
          <button
            onclick={() => {
              activeRoute = '/concierge';
              goto('/concierge');
            }}
            type="button"
            class="inline-flex items-center justify-center w-9 h-9 overflow-hidden rounded-full ring-2 ring-gold shadow-lg bg-goldGrad bg-[length:200%_auto] animate-gradientx hover:animate-shine group focus:ring-4 focus:ring-blue-300 focus:outline-none dark:focus:ring-blue-800"
          >
            <img
              src="/logo-concierge.png"
              alt=""
              aria-hidden="true"
              class="w-full h-full object-cover"
            />
            <span class="sr-only">{L('concierge')}</span>
          </button>
          <span class="text-[9px] leading-none text-gray-500 dark:text-gray-300">{L('concierge')}</span>
        </div>
        <div
          id="tooltip-new"
          role="tooltip"
          class="absolute z-10 invisible inline-block px-3 py-2 text-sm font-medium text-white transition-opacity duration-300 bg-gray-900 rounded-lg shadow-sm opacity-0 tooltip dark:bg-gray-700"
        >
          {L('createNew')}
          <div class="tooltip-arrow" data-popper-arrow></div>
        </div>
        <!-- The five public discovery pages (demand map, rikmas, products, open
             missions, wanted resources) share one tab — the bar has no room for
             five more, and they belong together anyway. -->
        <DiscoverMenu {vertical} {itemClass} extraClass={fromMid} />

        <button
          onclick={() => {
            activeRoute = '/lev';
            goto('/lev');
          }}
          type="button"
          class="{activeRoute == '/lev' ? 'border-b-2 border-gold' : ''} text-barbi {itemClass}"
        >
          <div class="relative">
            <Lev />
            {#key navigating}
              {#if navigating && navigating.to?.url.pathname === '/lev'}
                <div
                  class="absolute -inset-1 rounded-full border-2 border-transparent border-t-gold animate-spin"
                ></div>
              {/if}
            {/key}
          </div>
          <span class="text-[9px] leading-none text-gray-500 dark:text-gray-300">{L('lev')}</span>
        </button>
        <div
          id="tooltip-settings"
          role="tooltip"
          class="absolute z-10 invisible inline-block px-3 py-2 text-sm font-medium text-white transition-opacity duration-300 bg-gray-900 rounded-lg shadow-sm opacity-0 tooltip dark:bg-gray-700"
        >
          {L('lev')}
          <div class="tooltip-arrow" data-popper-arrow></div>
        </div>

        <!-- From 520px the bar is wide enough for profile to leave the "more"
             menu and take the ninth slot, which is what keeps the count odd. -->
        <button
          onclick={() => {
            activeRoute = '/me';
            goto('/me');
          }}
          type="button"
          class="{activeRoute == '/me'
            ? 'border-b-2 border-gold'
            : ''} {fromWide} {itemClass}"
        >
          <div class="relative">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke-width="1.8"
              stroke="currentColor"
              class="w-6 h-6 text-barbi"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"
              />
            </svg>
            {#if navigating && navigating.to?.url.pathname === '/me'}
              <div
                class="absolute -inset-1 rounded-full border-2 border-transparent border-t-gold animate-spin"
              ></div>
            {/if}
          </div>
          <span class="text-[9px] leading-none text-gray-500 dark:text-gray-300"
            >{$t('common.footer.profile')}</span
          >
        </button>

        <ProfileMenu {onChat} />
      {:else}
        <!-- Guest tabs. Public destinations only — see the component header. -->
        <button
          onclick={() => {
            activeRoute = homeHref;
            goto(homeHref);
          }}
          type="button"
          class="{activeRoute === homeHref ? 'border-b-2 border-gold' : ''} {vertical
            ? ''
            : 'rounded-s-full'} {itemClass}"
        >
          <div class="relative">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke-width="1.8"
              stroke="currentColor"
              class="w-6 h-6 text-barbi"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M2.25 12l8.954-8.955a1.126 1.126 0 011.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75"
              />
            </svg>
            {#if navigating && navigating.to?.url.pathname === homeHref}
              <div
                class="absolute -inset-1 rounded-full border-2 border-transparent border-t-gold animate-spin"
              ></div>
            {/if}
          </div>
          <span class="text-[9px] leading-none text-gray-500 dark:text-gray-300">{L('home')}</span>
        </button>

        <button
          onclick={() => {
            activeRoute = '/guid';
            goto('/guid');
          }}
          type="button"
          class="{activeRoute == '/guid'
            ? 'border-b-2 border-gold'
            : ''} {fromMid} {itemClass}"
        >
          <div class="relative">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke-width="1.8"
              stroke="currentColor"
              class="w-6 h-6 text-barbi"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25"
              />
            </svg>
            {#if navigating && navigating.to?.url.pathname === '/guid'}
              <div
                class="absolute -inset-1 rounded-full border-2 border-transparent border-t-gold animate-spin"
              ></div>
            {/if}
          </div>
          <span class="text-[9px] leading-none text-gray-500 dark:text-gray-300">{L('guide')}</span>
        </button>

        <!-- The five discovery pages are public, so a guest gets the same tab -->
        <DiscoverMenu {vertical} {itemClass} />

        <!-- Same logo, same centre slot as the signed-in concierge button — but
             pointing at /wish/new, the guest-allowed composer: a visitor can write
             the whole wish and see masked matches before an account exists. -->
        <div class="flex flex-col items-center justify-center gap-0.5 {vertical ? 'py-1.5' : ''}">
          <button
            onclick={() => {
              activeRoute = '/wish/new';
              goto('/wish/new');
            }}
            type="button"
            class="inline-flex items-center justify-center w-9 h-9 overflow-hidden rounded-full ring-2 ring-gold shadow-lg bg-goldGrad bg-[length:200%_auto] animate-gradientx hover:animate-shine group focus:ring-4 focus:ring-blue-300 focus:outline-none dark:focus:ring-blue-800"
          >
            <img
              src="/logo-concierge.png"
              alt=""
              aria-hidden="true"
              class="w-full h-full object-cover"
            />
            <span class="sr-only">{L('newWish')}</span>
          </button>
          <span class="text-[9px] leading-none text-gray-500 dark:text-gray-300">{L('newWish')}</span>
        </div>

        <button
          onclick={() => {
            activeRoute = '/signup';
            goto('/signup');
          }}
          type="button"
          class="{activeRoute == '/signup' ? 'border-b-2 border-gold' : ''} {itemClass}"
        >
          <div class="relative">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke-width="1.8"
              stroke="currentColor"
              class="w-6 h-6 text-barbi"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M19 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM4 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 0110.374 21c-2.331 0-4.512-.645-6.374-1.766z"
              />
            </svg>
            {#if navigating && navigating.to?.url.pathname === '/signup'}
              <div
                class="absolute -inset-1 rounded-full border-2 border-transparent border-t-gold animate-spin"
              ></div>
            {/if}
          </div>
          <span class="text-[9px] leading-none text-gray-500 dark:text-gray-300">{L('signup')}</span>
        </button>

        <button
          onclick={() => {
            activeRoute = '/login';
            goto(loginHref);
          }}
          type="button"
          class="{activeRoute == '/login'
            ? 'border-b-2 border-gold'
            : ''} {fromMid} {itemClass}"
        >
          <div class="relative">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke-width="1.8"
              stroke="currentColor"
              class="w-6 h-6 text-barbi"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9"
              />
            </svg>
            {#if navigating && navigating.to?.url.pathname === '/login'}
              <div
                class="absolute -inset-1 rounded-full border-2 border-transparent border-t-gold animate-spin"
              ></div>
            {/if}
          </div>
          <span class="text-[9px] leading-none text-gray-500 dark:text-gray-300">{L('login')}</span>
        </button>

        <GuestMenu {loginHref} />
      {/if}
    </div>
  </div>
{/if}
