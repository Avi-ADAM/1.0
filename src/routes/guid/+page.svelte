<script>
  import { t, isRtl } from '$lib/translations';
  import { idPr } from '$lib/stores/idPr';
  // Reused, not copied: this atom already handles all five locales, writes the
  // `lang` cookie with `path=/` (a cookie written without it would scope to
  // /guid and never apply site-wide) and flips `documentElement` dir/lang.
  // `locale.set` inside it re-triggers the loader for this route, so the
  // route-gated `guide` namespace arrives in the new language.
  import LangSwitch from '$lib/components/onboard/LangSwitch.svelte';

  /**
   * The user-facing guide.
   *
   * Two rules this page follows on purpose:
   *  1. **No screenshot placeholders.** The old version reserved an empty
   *     "[screenshot: …]" box under every step. A precise sentence plus a link
   *     that lands on the actual screen is more useful than a picture we do not
   *     have — and it never goes stale.
   *  2. **Every card links somewhere real.** Project-scoped links resolve
   *     against the currently selected rikma (`idPr`) and fall back to the
   *     rikma picker when none is selected, so no link is ever dead.
   *
   * The agent guide lives at /guid/ai and is deliberately not advertised in the
   * visible layout — see the skip-style link at the end of the page.
   */

  /** @type {'rtl' | 'ltr'} */
  let dir = $derived($isRtl ? 'rtl' : 'ltr');

  /** Currently selected rikma, if any — makes the moach links land in context. */
  let pid = $derived($idPr && $idPr !== 0 ? $idPr : null);
  let moachTab = $derived(
    /** @param {string} tab */ (tab) => (pid ? `/moach/${pid}/${tab}` : '/moach')
  );

  /**
   * One registry for every destination the guide points at. Labels and
   * descriptions come from `guide.map.links.*`, so an entry can be reused in
   * the site map, inside an object card, and as a flow CTA without duplicating
   * any text.
   */
  let LINKS = $derived({
    hub: { href: '/hub', icon: '🧭' },
    lev: { href: '/lev', icon: '💗' },
    myacts: { href: '/myacts', icon: '📋' },
    timers: { href: '/timers', icon: '⏱️' },
    calendar: { href: '/myCalander', icon: '📅' },
    meeting: { href: '/meeting', icon: '🎥' },
    moach: { href: pid ? `/moach/${pid}/main` : '/moach', icon: '🧠' },
    moachCreate: { href: moachTab('create'), icon: '➕' },
    moachWork: { href: moachTab('progress'), icon: '🛠️' },
    moachFlows: { href: moachTab('processes'), icon: '🔗' },
    moachMoney: { href: moachTab('sales'), icon: '💰' },
    moachOpps: { href: moachTab('wishes'), icon: '🌱' },
    moachVotes: { href: moachTab('votes'), icon: '⚖️' },
    projectPublic: { href: pid ? `/project/${pid}` : '/project', icon: '🪪' },
    demand: { href: '/demand', icon: '🗺️' },
    projects: { href: '/project', icon: '🧶' },
    products: { href: '/gift', icon: '🎁' },
    missions: { href: '/availableMission', icon: '🛠️' },
    resources: { href: '/availiableResorce', icon: '📦' },
    concierge: { href: '/concierge', icon: '🛎️' },
    newWish: { href: '/wish/new', icon: '✨' },
    deals: { href: '/deals', icon: '💼' },
    salesCenter: { href: '/deals/sales-center', icon: '🧾' },
    dealsRequest: { href: '/deals/request', icon: '📨' },
    profile: { href: '/me', icon: '👤' },
    settings: { href: '/me/settings', icon: '⚙️' },
    offerings: { href: '/me/offerings', icon: '🫱' },
    identity: { href: '/me/identity', icon: '🆔' },
    devices: { href: '/me/devices', icon: '📱' },
    onboard: { href: '/onboard', icon: '🚀' },
    faq: { href: '/faq', icon: '❓' },
    consensus: { href: '/consensus', icon: '🤝' },
    agreement: { href: 'https://agreement.1lev1.com', icon: '📜', external: true },
    love: { href: '/love', icon: '🌍' }
  });

  const QUICK_STEPS = [
    { key: 'signup', icon: '🚪', href: '/signup' },
    { key: 'profile', icon: '🧬', href: '/me' },
    { key: 'offerings', icon: '🫱', href: '/me/offerings' },
    { key: 'rikma', icon: '🧶', href: '/me?action=createproject' },
    { key: 'lev', icon: '💗', href: '/lev' },
    { key: 'hub', icon: '🧭', href: '/hub' }
  ];

  const MAP_GROUPS = [
    { key: 'daily', links: ['hub', 'lev', 'myacts', 'timers', 'calendar', 'meeting'] },
    {
      key: 'rikma',
      links: [
        'moach',
        'moachCreate',
        'moachWork',
        'moachFlows',
        'moachMoney',
        'moachOpps',
        'moachVotes',
        'projectPublic'
      ]
    },
    { key: 'discover', links: ['demand', 'projects', 'products', 'missions', 'resources'] },
    { key: 'wish', links: ['concierge', 'newWish'] },
    { key: 'money', links: ['deals', 'salesCenter', 'dealsRequest'] },
    { key: 'me', links: ['profile', 'settings', 'offerings', 'identity', 'devices', 'onboard'] },
    { key: 'learn', links: ['faq', 'consensus', 'agreement', 'love'] }
  ];

  /** The object catalogue. `links` are keys into LINKS — reused labels, no new keys. */
  const OBJECTS = [
    { key: 'rikma', icon: '🧶', links: ['moach', 'projectPublic', 'projects'] },
    { key: 'user', icon: '🧬', links: ['profile', 'offerings'] },
    { key: 'mission', icon: '🛠️', links: ['moachCreate', 'moachWork', 'missions'] },
    { key: 'resource', icon: '📦', links: ['moachCreate', 'resources', 'demand'] },
    { key: 'product', icon: '🎁', links: ['moachMoney', 'products'] },
    { key: 'sale', icon: '💰', links: ['salesCenter', 'moachMoney', 'lev'] },
    { key: 'split', icon: '💸', links: ['moachMoney', 'lev'] },
    { key: 'decision', icon: '⚖️', links: ['moachVotes', 'lev', 'consensus'] },
    { key: 'nego', icon: '🤝', links: ['lev', 'consensus'] },
    { key: 'wish', icon: '✨', links: ['newWish', 'concierge', 'demand'] },
    { key: 'maagad', icon: '🧺', links: ['demand', 'moachOpps'] },
    { key: 'service', icon: '🛍️', links: ['deals', 'dealsRequest', 'products'] },
    { key: 'timer', icon: '⏱️', links: ['timers', 'myacts'] },
    { key: 'process', icon: '🔗', links: ['moachFlows', 'moachWork'] }
  ];

  let FLOWS = $derived([
    { key: 'open_rikma', icon: '🧶', href: '/me?action=createproject' },
    { key: 'create_task', icon: '➕', href: moachTab('create') },
    { key: 'negotiation', icon: '🤝', href: moachTab('votes') },
    { key: 'auto_approve', icon: '⏳', href: '/lev' },
    { key: 'execution', icon: '⏱️', href: '/timers' },
    { key: 'finish', icon: '✅', href: '/lev' },
    { key: 'money', icon: '💰', href: '/deals/sales-center' }
  ]);

  const PRINCIPLES = ['noHardNo', 'silence', 'oneEngine', 'saleHolder', 'sovereignty'];

  const SECTIONS = ['quickstart', 'map', 'objects', 'flows', 'principles'];

  /** "a → b → c" from the JSON, rendered as a chain of chips. */
  const asStages = (/** @type {string} */ s) =>
    s
      .split('→')
      .map((p) => p.trim())
      .filter(Boolean);
</script>

<svelte:head>
  <title>{$t('guide.title')}</title>
  <meta name="description" content={$t('guide.tagline')} />
  <!-- Machine-discoverable pointer to the agent guide; see the note above. -->
  <link rel="help" href="/guid/ai" />
</svelte:head>

<div class="guide min-h-screen bg-slate-50 text-slate-800" {dir}>
  <div class="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
    <!-- ── Header ─────────────────────────────────────────────── -->
    <header id="top" class="mb-10 text-center">
      <h1 class="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">
        {$t('guide.title')}
      </h1>
      <p class="mt-3 text-lg text-rose-700 sm:text-xl">{$t('guide.tagline')}</p>
      <div class="mx-auto mt-6 max-w-3xl space-y-3 text-start text-base leading-relaxed text-slate-700">
        <p>{$t('guide.intro')}</p>
        <p class="text-slate-500">{$t('guide.intro2')}</p>
      </div>
    </header>

    <!-- ── Table of contents ──────────────────────────────────── -->
    <nav
      aria-label={$t('guide.toc.title')}
      class="sticky top-0 z-20 -mx-4 mb-12 border-y border-slate-200 bg-slate-50/95 px-4 py-3 backdrop-blur sm:mx-0 sm:rounded-2xl sm:border"
    >
      <div class="flex flex-wrap items-center justify-center gap-2">
        <ul class="flex flex-wrap items-center justify-center gap-2">
          {#each SECTIONS as section (section)}
            <li>
              <a
                href="#{section}"
                class="inline-block rounded-full border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 transition hover:border-rose-400 hover:text-rose-700"
              >
                {$t(`guide.toc.${section}`)}
              </a>
            </li>
          {/each}
        </ul>
        <!-- The guide is a standalone document with no app header, so without
             this there is no way to read it in another language. -->
        <div class="ms-auto" dir="ltr"><LangSwitch /></div>
      </div>
    </nav>

    <!-- ── 1. Quick start ─────────────────────────────────────── -->
    <section id="quickstart" class="mb-16 scroll-mt-20">
      <h2 class="text-2xl font-bold text-slate-900 sm:text-3xl">
        {$t('guide.quickstart.title')}
      </h2>
      <p class="mt-2 text-slate-600">{$t('guide.quickstart.desc')}</p>

      <ol class="mt-6 grid gap-4 sm:grid-cols-2">
        {#each QUICK_STEPS as step, i (step.key)}
          <li class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div class="flex items-baseline gap-2">
              <span
                class="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-rose-100 text-sm font-bold text-rose-700"
                aria-hidden="true">{i + 1}</span
              >
              <h3 class="text-lg font-bold text-slate-900">
                <span class="me-1" aria-hidden="true">{step.icon}</span>
                {$t(`guide.quickstart.steps.${step.key}.title`)}
              </h3>
            </div>
            <p class="mt-2 text-sm leading-relaxed text-slate-600">
              {$t(`guide.quickstart.steps.${step.key}.text`)}
            </p>
            <a
              href={step.href}
              class="mt-3 inline-flex items-center gap-1 rounded-lg bg-rose-600 px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-rose-700"
            >
              {$t(`guide.quickstart.steps.${step.key}.cta`)}
              <span aria-hidden="true">{$isRtl ? '←' : '→'}</span>
            </a>
          </li>
        {/each}
      </ol>
    </section>

    <!-- ── 2. Site map ────────────────────────────────────────── -->
    <section id="map" class="mb-16 scroll-mt-20">
      <h2 class="text-2xl font-bold text-slate-900 sm:text-3xl">{$t('guide.map.title')}</h2>
      <p class="mt-2 text-slate-600">{$t('guide.map.desc')}</p>

      <div class="mt-6 space-y-6">
        {#each MAP_GROUPS as group (group.key)}
          <div class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 class="text-lg font-bold text-slate-900">
              {$t(`guide.map.groups.${group.key}.title`)}
            </h3>
            <p class="mt-1 text-sm text-slate-500">
              {$t(`guide.map.groups.${group.key}.desc`)}
            </p>
            <ul class="mt-4 grid gap-2 sm:grid-cols-2">
              {#each group.links as key (key)}
                {@const link = LINKS[key]}
                <li>
                  <a
                    href={link.href}
                    target={link.external ? '_blank' : undefined}
                    rel={link.external ? 'noreferrer' : undefined}
                    class="flex h-full items-start gap-3 rounded-xl border border-slate-200 p-3 transition hover:border-rose-300 hover:bg-rose-50/60"
                  >
                    <span class="text-xl leading-none" aria-hidden="true">{link.icon}</span>
                    <span class="min-w-0">
                      <span class="block font-semibold text-slate-800">
                        {$t(`guide.map.links.${key}.label`)}
                      </span>
                      <span class="block text-sm leading-snug text-slate-500">
                        {$t(`guide.map.links.${key}.desc`)}
                      </span>
                    </span>
                  </a>
                </li>
              {/each}
            </ul>
          </div>
        {/each}
      </div>
    </section>

    <!-- ── 3. Object catalogue ────────────────────────────────── -->
    <section id="objects" class="mb-16 scroll-mt-20">
      <h2 class="text-2xl font-bold text-slate-900 sm:text-3xl">{$t('guide.objects.title')}</h2>
      <p class="mt-2 max-w-3xl text-slate-600">{$t('guide.objects.desc')}</p>

      <div class="mt-6 space-y-5">
        {#each OBJECTS as obj (obj.key)}
          <article
            id="object-{obj.key}"
            class="scroll-mt-20 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
          >
            <header class="flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <h3 class="text-xl font-bold text-slate-900">
                <span class="me-1" aria-hidden="true">{obj.icon}</span>
                {$t(`guide.objects.items.${obj.key}.name`)}
              </h3>
              <code class="rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-500" dir="ltr">
                {$t(`guide.objects.items.${obj.key}.code`)}
              </code>
            </header>

            <p class="mt-3 leading-relaxed text-slate-700">
              {$t(`guide.objects.items.${obj.key}.what`)}
            </p>

            <!-- Life cycle: the JSON stores one "a → b → c" string; splitting it
                 here keeps the translations readable and the chips consistent. -->
            <div class="mt-4">
              <p class="text-xs font-semibold uppercase tracking-wide text-slate-400">
                {$t('guide.labels.lifecycle')}
              </p>
              <ol class="mt-2 flex flex-wrap items-center gap-1.5">
                {#each asStages($t(`guide.objects.items.${obj.key}.stages`)) as stage, i (i)}
                  {#if i > 0}
                    <li class="text-slate-300" aria-hidden="true">{$isRtl ? '←' : '→'}</li>
                  {/if}
                  <li
                    class="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-900"
                  >
                    {stage}
                  </li>
                {/each}
              </ol>
            </div>

            <dl class="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <dt class="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  {$t('guide.labels.where')}
                </dt>
                <dd class="mt-1 text-sm leading-relaxed text-slate-600">
                  {$t(`guide.objects.items.${obj.key}.where`)}
                </dd>
              </div>
              <div>
                <dt class="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  {$t('guide.labels.actions')}
                </dt>
                <dd class="mt-1 text-sm leading-relaxed text-slate-600">
                  {$t(`guide.objects.items.${obj.key}.do`)}
                </dd>
              </div>
            </dl>

            <ul class="mt-4 flex flex-wrap gap-2">
              {#each obj.links as key (key)}
                {@const link = LINKS[key]}
                <li>
                  <a
                    href={link.href}
                    target={link.external ? '_blank' : undefined}
                    rel={link.external ? 'noreferrer' : undefined}
                    class="inline-flex items-center gap-1.5 rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-sm font-semibold text-rose-800 transition hover:border-rose-400 hover:bg-rose-100"
                  >
                    <span aria-hidden="true">{link.icon}</span>
                    {$t(`guide.map.links.${key}.label`)}
                  </a>
                </li>
              {/each}
            </ul>
          </article>
        {/each}
      </div>
    </section>

    <!-- ── 4. Core flows ──────────────────────────────────────── -->
    <section id="flows" class="mb-16 scroll-mt-20">
      <h2 class="text-2xl font-bold text-slate-900 sm:text-3xl">{$t('guide.flows.title')}</h2>
      <p class="mt-2 text-slate-600">{$t('guide.flows.desc')}</p>

      <ol class="mt-6 space-y-4">
        {#each FLOWS as flow, i (flow.key)}
          <li
            class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm border-s-4 border-s-rose-500"
          >
            <h3 class="text-lg font-bold text-slate-900">
              <span class="me-1 text-slate-400">{i + 1}.</span>
              <span class="me-1" aria-hidden="true">{flow.icon}</span>
              {$t(`guide.flows.steps.${flow.key}.title`)}
            </h3>
            <p class="mt-2 leading-relaxed text-slate-700">
              {$t(`guide.flows.steps.${flow.key}.text`)}
            </p>
            <p class="mt-3 rounded-xl bg-slate-50 px-3 py-2 text-sm text-slate-600">
              <span class="font-semibold text-slate-500">{$t('guide.labels.howto')}:</span>
              {$t(`guide.flows.steps.${flow.key}.where`)}
            </p>
            <a
              href={flow.href}
              class="mt-3 inline-flex items-center gap-1 rounded-lg border border-rose-300 px-3 py-1.5 text-sm font-semibold text-rose-700 transition hover:bg-rose-600 hover:text-white"
            >
              {$t(`guide.flows.steps.${flow.key}.cta`)}
              <span aria-hidden="true">{$isRtl ? '←' : '→'}</span>
            </a>
          </li>
        {/each}
      </ol>
    </section>

    <!-- ── 5. Governing principles ────────────────────────────── -->
    <section id="principles" class="mb-16 scroll-mt-20">
      <h2 class="text-2xl font-bold text-slate-900 sm:text-3xl">{$t('guide.principles.title')}</h2>
      <p class="mt-2 max-w-3xl text-slate-600">{$t('guide.principles.desc')}</p>

      <div class="mt-6 grid gap-4 sm:grid-cols-2">
        {#each PRINCIPLES as key (key)}
          <div class="rounded-2xl border border-amber-200 bg-amber-50/60 p-5">
            <h3 class="text-lg font-bold text-amber-900">
              {$t(`guide.principles.items.${key}.title`)}
            </h3>
            <p class="mt-2 text-sm leading-relaxed text-amber-950/80">
              {$t(`guide.principles.items.${key}.text`)}
            </p>
          </div>
        {/each}
      </div>
    </section>

    <!-- ── Help ───────────────────────────────────────────────── -->
    <section class="mb-12 rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm">
      <h2 class="text-xl font-bold text-slate-900">{$t('guide.help.title')}</h2>
      <p class="mx-auto mt-2 max-w-2xl text-slate-600">{$t('guide.help.text')}</p>
      <div class="mt-4 flex flex-wrap justify-center gap-3">
        <a
          href="/faq"
          class="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-rose-400 hover:text-rose-700"
        >
          {$t('guide.help.faq')}
        </a>
        <a
          href="/concierge"
          class="rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-700"
        >
          {$t('guide.help.concierge')}
        </a>
      </div>
    </section>

    <footer class="pb-24 text-center text-sm text-slate-400">
      <a href="#top" class="underline-offset-4 hover:underline">{$t('guide.backToTop')}</a>
      <p class="mt-2">{$t('guide.footer')}</p>
      <!-- The agent guide is reachable and crawlable but intentionally not
           surfaced in the visible layout yet; Tab reveals it. -->
      <a
        href="/guid/ai"
        class="sr-only mt-3 focus:not-sr-only focus:inline-block focus:rounded-lg focus:border focus:border-slate-300 focus:px-3 focus:py-1.5 focus:text-slate-600"
      >
        {$t('guide.ai.cta')}
      </a>
    </footer>
  </div>
</div>

<style>
  /* The guide is a document, not an app screen — a plain light canvas keeps the
     long-form text readable even where the app shell is dark. */
  .guide :global(code) {
    font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  }
</style>
