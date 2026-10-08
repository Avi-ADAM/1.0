<script>
  import { t } from '$lib/translations';
  import Header from '$lib/components/header/header.svelte';
  import { goto, invalidate } from '$app/navigation';
  import { onMount, onDestroy } from 'svelte';
  import { lang } from '$lib/stores/lang.js';
  import Spinner from '$lib/celim/Spinner.svelte';
  import Close from '$lib/celim/close.svelte';
  import RichText from '$lib/celim/ui/richText.svelte';
  import Tile from '$lib/celim/tile.svelte';
  import { socketClient } from '$lib/stores/socketClient';

  import AuthorityBadge from '$lib/components/ui/AuthorityBadge.svelte';
  import DiscoveryNav from '$lib/components/discovery/DiscoveryNav.svelte';
  import ShareLink from '$lib/components/share/ShareLink.svelte';
  import RikmaRepoLink from '$lib/components/ui/RikmaRepoLink.svelte';
  import RikmaLicenseBadge from '$lib/components/ui/RikmaLicenseBadge.svelte';
  import Translated from '$lib/components/ui/Translated.svelte';
  import TranslatedNote from '$lib/components/ui/TranslatedNote.svelte';
  import { pageTranslations } from '$lib/translation/pageTranslations.svelte';
  import { plainForTranslation } from '$lib/translation/richText.js';
  import RikmaSkin from './RikmaSkin.svelte';
  import { CLASSIC_BLOCKS, CLASSIC_DOORS, ctaHref, isExternalHref } from '$lib/rikmaLook/look';
  import { lookFrame, shownLook } from '$lib/rikmaLook/frame.svelte';

  /**
   * A rikma's public page, at /project/<id> or /r/<slug>.
   *
   * One page for every rikma. A rikma's look (Project.look,
   * docs/inprogress/PLAN_RIKMA_SUBDOMAINS.md S1) is a layer over it, never a
   * different layout: the seal, the two doors and the panels stay; the look
   * recolours them (through `RikmaSkin`), says a line under the seal, picks
   * what the two doors ask for, adds the panels only it has content for
   * (numbers, partners, contact) and orders the panels. With no look the page
   * is exactly what it has always been.
   */
  let { data } = $props();
  // Derived so navigating between /project/A and /project/B (same component
  // instance, reused by SvelteKit) keeps these — and the socket listener — current.
  let projectId = $derived(data.projectId);
  let isRegisteredUser = $derived(data.isRegisteredUser);
  // Inside the look editor's preview the page shows what a guest sees.
  let asGuest = $derived(!isRegisteredUser || lookFrame.active);

  /** @type {import('$lib/rikmaLook/look').RikmaLook | null} */
  let look = $derived(shownLook(data.look ?? null));

  // Derived from load data so a realtime invalidate(`project:${id}`) re-renders
  // the team, missions, logo, links and values (e.g. after a decision passes).
  let project = $derived(data.projectData);
  let projectUsers = $derived(project?.attributes?.user_1s?.data || []);
  let projecto = $derived(project?.attributes?.open_missions?.data || []);

  // תמונה - בדיקת תקינות
  let srcP = $derived(
    project?.attributes?.profilePic?.data
      ? project.attributes.profilePic.data.attributes.formats?.thumbnail?.url ||
          project.attributes.profilePic.data.attributes.url
      : null
  );

  let linkP = $derived(project?.attributes?.linkToWebsite);
  // Strapi field names are all lowercase (49GetProjectById); the camelCase
  // spellings these once read were always undefined, so the icons never showed.
  let githublink = $derived(project?.attributes?.githublink);
  let fblink = $derived(project?.attributes?.fblink);
  let discordlink = $derived(project?.attributes?.discordlink);
  let twiterlink = $derived(project?.attributes?.twiterlink);

  let show = $state(false);

  // Values, re-synced from the (possibly re-fetched) project and translated for he.
  let vallues = $state([]);
  $effect(() => {
    const base = data.projectData?.attributes?.vallues?.data || [];
    if ($lang == 'he') {
      for (let i = 0; i < base.length; i++) {
        const loc = base[i]?.attributes?.localizations?.data;
        if (loc && loc.length > 0) {
          base[i].attributes.valueName = loc[0].attributes.valueName;
        }
      }
    }
    vallues = base;
  });

  // Realtime: re-run the page load when a vote/decision lands for this project.
  // Only registered users hold an authenticated socket connection.
  const PROJECT_REFRESH_TYPES = [
    'pendmVote',
    'pmashVote',
    'maapVote',
    'decisionVote',
    'voteUpdate'
  ];
  let socketUnsub;
  onMount(() => {
    if (!isRegisteredUser) return;
    socketUnsub = socketClient.onNotification((/** @type {any} */ n) => {
      const type = n?.metadata?.type || n?.data?.type;
      const notifProjectId = n?.actionParams?.projectId || n?.data?.projectId;
      if (
        notifProjectId &&
        String(notifProjectId) === String(projectId) &&
        type &&
        PROJECT_REFRESH_TYPES.includes(type)
      ) {
        invalidate(`project:${projectId}`);
      }
    });
  });
  onDestroy(() => socketUnsub?.());

  function us(x) {
    goto(`/user/${x}`);
  }

  function mesima(x) {
    goto(`/availableMission/${x}`);
  }

  // משתנה לרוחב המסך
  let w = $state(0);
  let isMobile = $derived(w < 640);

  // ── UGC translation (PLAN_UGC_TRANSLATION §4, §7.1, §12) ──────────────
  // The description is tiptap HTML, so it is looked up by its flattened text —
  // through the same helper the loader used, or the page would render source
  // for a translation sitting in its own payload. Its translated view is flat;
  // "show original" brings the formatted HTML back untouched.
  //
  // Mission names go to `Tile`, which only takes a string, so they are handed
  // over already resolved (`textFor`) and the panel carries one provenance
  // line for all of them. The rikma's own name is not translated: it is drawn
  // on the seal, an identity mark, and the loader does not look it up.
  const tr = pageTranslations(() => data, () => $lang);
  let descripPlain = $derived(plainForTranslation(project?.attributes?.publicDescription));
  let products = $derived(project?.attributes?.matanotofs?.data ?? []);
  let missionsHit = $derived(tr.firstReal(...projecto.map((om) => om.attributes?.name)));
  let productsHit = $derived(tr.firstReal(...products.map((m) => m.attributes?.name)));

  // ── The look's layer ─────────────────────────────────────────────────
  let doors = $derived(look ? look.cta : CLASSIC_DOORS);
  let cover = $derived(look?.media.cover?.url ?? null);
  let hasContact = $derived(
    !!look &&
      !!(
        look.contact.email ||
        look.contact.phone ||
        look.contact.address ||
        look.contact.hours ||
        look.links.booking
      )
  );
  let asksForDonation = $derived(
    !!look && (look.cta.primary.kind === 'donate' || look.cta.secondary?.kind === 'donate')
  );

  /** Which panels have something to show — an empty panel is skipped, not drawn empty. */
  let has = $derived({
    about: !!project?.attributes?.publicDescription,
    team: projectUsers.length > 0,
    values: vallues.length > 0,
    missions: true,
    products: products.length > 0,
    impact: (look?.stats.length ?? 0) > 0,
    partners: (look?.partners.length ?? 0) > 0,
    contact: hasContact
  });

  /**
   * The panels in order, values and missions side by side when they meet —
   * the way the page has always laid them out.
   */
  let rows = $derived.by(() => {
    const keys = (look ? look.blocks.filter((b) => b.visible).map((b) => b.key) : CLASSIC_BLOCKS).filter(
      (k) => has[k]
    );
    /** @type {string[][]} */
    const out = [];
    for (let i = 0; i < keys.length; i++) {
      const pair = [keys[i], keys[i + 1]].sort().join();
      if (pair === 'missions,values') {
        out.push([keys[i], keys[i + 1]]);
        i++;
      } else {
        out.push([keys[i]]);
      }
    }
    return out;
  });

  function doorTitle(/** @type {any} */ c) {
    if (!look) return c.kind === 'support' ? $t('pages.projectPublic.supportTitle') : $t('pages.projectPublic.joinTitle');
    return $t(`rikmaLook.cta.${c.label}`);
  }
  function doorDesc(/** @type {any} */ c) {
    if (c.kind === 'support') return $t('pages.projectPublic.supportDesc');
    if (c.kind === 'join') return $t('pages.projectPublic.joinDesc');
    return $t(`rikmaLook.door.${c.kind}`);
  }

  let missionsHeading = $derived(
    look ? $t(`rikmaLook.page.heading.missions.${look.focus}`) : $t('pages.projectPublic.missions')
  );

  // טקסטים
  let pageTitle = $derived(
    $t('pages.projectPublic.pageTitle', {
      projectName: project?.attributes?.projectName || $t('pages.projectPublic.fallbackName')
    })
  );
</script>

<svelte:head>
  <title>{pageTitle}</title>
  {#if look?.profile.tagline}
    <meta name="description" content={look.profile.tagline} />
    <meta property="og:description" content={look.profile.tagline} />
  {/if}
  {#if cover}
    <meta property="og:image" content={cover} />
  {/if}
</svelte:head>

{#if isRegisteredUser && !asGuest}
  <Header />
{/if}

{#snippet door(/** @type {any} */ c, /** @type {'gold' | 'barbi'} */ tone)}
  {@const href = ctaHref(c, look, projectId)}
  {@const ext = isExternalHref(href)}
  <a
    {href}
    class="door-card"
    class:door-gold={tone === 'gold'}
    class:door-barbi={tone === 'barbi'}
    target={ext ? '_blank' : undefined}
    rel={ext ? 'noopener noreferrer' : undefined}
    onclick={c.kind === 'products' ? () => (show = true) : undefined}
  >
    <span class="text-xl font-black mb-1" class:text-gold={tone === 'gold'} class:text-barbi={tone === 'barbi'}>{doorTitle(c)}</span>
    <span class="text-sm text-gray-300 leading-snug">{doorDesc(c)}</span>
  </a>
{/snippet}

{#snippet panel(/** @type {string} */ key, /** @type {boolean} */ inGrid)}
  {#if key === 'about'}
    <!-- 3. Description -->
    <div class="glass-panel mb-8 text-center">
      <h2 class="section-title mb-3">{$t('pages.projectPublic.about')}</h2>
      {#if tr.showsTranslation(descripPlain)}
        <p dir="auto" class="whitespace-pre-line">{tr.textFor(descripPlain)}</p>
      {:else}
        <RichText editable={false} outpot={project.attributes.publicDescription} />
      {/if}
      <TranslatedNote hit={tr.hitFor(descripPlain)} />
    </div>
  {:else if key === 'team'}
    <!-- 4. Team Members (Circular Avatars with Gold Rings) -->
    <div class="mb-10 text-center">
      <h3 class="section-title mb-4">{$t('pages.projectPublic.team')}</h3>
      <div dir="ltr" class="flex flex-wrap justify-center gap-2">
        {#each projectUsers as user (user.id)}
          <button
            onclick={() => us(user.id)}
            class="relative transition-transform hover:-translate-y-1 group"
            title={user.attributes.username}
          >
            <div
              class="w-12 h-12 rounded-full border-2 border-gold p-0.5 bg-black/50 overflow-hidden shadow-md group-hover:shadow-gold/50"
            >
              <img
                class="w-full h-full rounded-full object-cover"
                src={user.attributes.profilePic.data
                  ? user.attributes.profilePic.data.attributes.url
                  : 'https://res.cloudinary.com/love1/image/upload/v1653053361/image_s1syn2.png'}
                alt={user.attributes.username}
              />
            </div>
          </button>
        {/each}
      </div>
    </div>
  {:else if key === 'values'}
    <div class="glass-panel flex flex-col items-center border-t-4 border-t-gold" class:mb-10={!inGrid}>
      <h2 class="text-xl font-bold text-gold mb-4 drop-shadow-md">
        {$t('pages.projectPublic.values')}
      </h2>
      <div class="flex flex-wrap justify-center gap-2">
        {#each vallues as vallue}
          <div class="transform hover:scale-105 transition-transform">
            <Tile bg="gold" sm={true} big={true} word={vallue.attributes.valueName} />
          </div>
        {/each}
      </div>
    </div>
  {:else if key === 'missions'}
    <div class="glass-panel flex flex-col items-center border-t-4 border-t-barbi" class:mb-10={!inGrid}>
      <h3 class="text-xl font-bold text-barbi mb-4 drop-shadow-md">{missionsHeading}</h3>
      <div class="flex flex-wrap justify-center gap-2 w-full">
        {#if projecto.length > 0}
          {#each projecto as om (om.id)}
            <button onclick={() => mesima(om.id)} class="transform hover:scale-105 transition-transform">
              <Tile bg="wow" sm={true} big={true} word={tr.textFor(om.attributes.name)} />
            </button>
          {/each}
        {:else}
          <p class="text-gray-400 text-sm">{$t('rikmaLook.page.missionsEmpty')}</p>
        {/if}
      </div>
      <TranslatedNote hit={missionsHit} class="mt-2" />
      <!-- Self-nomination entry (PLAN_SELF_NOMINATION §4.1): even with no
           open missions, anyone who connects to the direction can offer
           themselves on their own terms. -->
      <a
        href="/project/{projectId}/join"
        class="mt-4 text-sm text-barbi underline hover:text-white transition-colors"
      >
        {$t('pages.projectPublic.selfNomCta')}
      </a>
    </div>
  {:else if key === 'products'}
    <!-- 6. Products / Gifts -->
    <div id="rikma-products" class="text-center mb-10">
      {#if !show}
        <button class="cta-button-pink" onclick={() => (show = true)}>
          {$t('pages.projectPublic.showProducts')}
        </button>
      {:else}
        <div class="glass-panel mt-4 animate-fade-in relative">
          <button class="absolute top-2 right-2 text-white/50 hover:text-white" onclick={() => (show = false)}>
            <Close />
          </button>

          <h3 class="text-2xl text-gold mb-6 font-bold">{$t('pages.projectPublic.showProducts')}</h3>

          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {#each products as matanot (matanot.id)}
              <div class="bg-black/40 rounded-xl p-4 border border-white/10 hover:border-gold/50 transition-colors">
                <Translated
                  as="p"
                  class="text-lg font-semibold text-white mb-2"
                  text={matanot.attributes.name}
                  hit={tr.hitFor(matanot.attributes.name)}
                  showNote={false}
                />
                <p class="text-barbi font-bold text-xl mb-2">
                  {matanot.attributes.price}
                </p>
                <a href="/gift/{matanot.id}" class="text-sm underline text-gold hover:text-white"
                  >{$t('rikmaLook.page.productDetails')}</a
                >
              </div>
            {/each}
          </div>
          <TranslatedNote hit={productsHit} class="mt-3" />
        </div>
      {/if}
    </div>
  {:else if key === 'impact' && look}
    <section class="glass-panel mb-8 text-center" aria-labelledby="pp-h-impact">
      <h2 id="pp-h-impact" class="section-title mb-5">{$t('rikmaLook.page.heading.impact')}</h2>
      <dl class="grid grid-cols-2 md:grid-cols-4 gap-4">
        {#each look.stats as s, i (i)}
          <div class="flex flex-col-reverse items-center gap-1">
            <dt class="text-sm text-gray-300" dir="auto">{s.label}</dt>
            <dd class="text-3xl font-black text-gold" dir="auto">{s.value}</dd>
          </div>
        {/each}
      </dl>
    </section>
  {:else if key === 'partners' && look}
    <section class="glass-panel mb-8 text-center" aria-labelledby="pp-h-partners">
      <h2 id="pp-h-partners" class="section-title mb-4">
        {$t(`rikmaLook.page.heading.partners.${look.focus}`)}
      </h2>
      <ul class="flex flex-wrap justify-center gap-2">
        {#each look.partners as p, i (i)}
          <li>
            {#if p.url}
              <a class="partner-chip" href={p.url} target="_blank" rel="noopener noreferrer" dir="auto">{p.name}</a>
            {:else}
              <span class="partner-chip" dir="auto">{p.name}</span>
            {/if}
          </li>
        {/each}
      </ul>
    </section>
  {:else if key === 'contact' && look}
    <section id="rikma-contact" class="glass-panel mb-8 text-center" aria-labelledby="pp-h-contact">
      <h2 id="pp-h-contact" class="section-title mb-4">{$t('rikmaLook.page.heading.contact')}</h2>
      <dl class="contact-list">
        {#if look.contact.email}
          <div>
            <dt>{$t('rikmaLook.page.contact.email')}</dt>
            <dd><a href="mailto:{look.contact.email}" dir="ltr">{look.contact.email}</a></dd>
          </div>
        {/if}
        {#if look.contact.phone}
          <div>
            <dt>{$t('rikmaLook.page.contact.phone')}</dt>
            <dd><a href="tel:{look.contact.phone.replace(/[^\d+]/g, '')}" dir="ltr">{look.contact.phone}</a></dd>
          </div>
        {/if}
        {#if look.contact.address}
          <div>
            <dt>{$t('rikmaLook.page.contact.address')}</dt>
            <dd dir="auto">{look.contact.address}</dd>
          </div>
        {/if}
        {#if look.contact.hours}
          <div>
            <dt>{$t('rikmaLook.page.contact.hours')}</dt>
            <dd dir="auto">{look.contact.hours}</dd>
          </div>
        {/if}
      </dl>
      {#if look.links.booking}
        <a class="cta-button-pink inline-block mt-5" href={look.links.booking} target="_blank" rel="noopener noreferrer">
          {$t('rikmaLook.cta.book')}
        </a>
      {/if}
    </section>
  {/if}
{/snippet}

<RikmaSkin {look}>
  {#if project}
    <!-- Main Container: Deep Gold/Pink Gradient Background -->
    <div
      bind:clientWidth={w}
      class="pp-backdrop relative min-h-screen text-white overflow-y-auto overflow-x-hidden font-sans"
    >
      {#if cover}
        <div class="pp-cover" aria-hidden="true">
          <img src={cover} alt="" style:object-position="{look?.media.focusX ?? 50}% {look?.media.focusY ?? 50}%" />
        </div>
      {/if}
      <div dir="rtl" class="max-w-4xl mx-auto px-4 py-8 pb-32 relative">
        {#if data.lookPreview && !lookFrame.active}
          <!-- A member looking at a proposed look before voting on it (loadRikmaPage). -->
          <div class="pp-preview-banner" role="status">
            {$t('rikmaLook.page.previewBanner')}
            <a href={data.canonicalPath}>{$t('rikmaLook.page.previewBack')}</a>
          </div>
        {/if}
        <!-- Discovery cross-links: back to the big picture (directories + map) -->
        <div class="mb-5 flex justify-center">
          <DiscoveryNav current="projects" isLoggedIn={isRegisteredUser && !asGuest} />
        </div>
        <!-- 1. Hero Section with Authority Badge -->
        <div class="flex flex-col items-center justify-center mb-8 animate-fade-in-up">
          <!-- The seal is the platform's mark: a look never replaces it, so a
               rikma's page can never pass for somebody else's site. -->
          <!-- ההילה הזהובה שייכת למראה האישי; בעסקי החותם עומד בלי זוהר. -->
          <div class="mb-6 drop-shadow-[0_0_25px_rgba(255,215,0,0.3)] business:drop-shadow-none">
            <AuthorityBadge
              logoSrc={srcP}
              projectName={project.attributes.projectName}
              memberCount={projectUsers.length}
              size={isMobile ? 220 : 230}
              goldColor="#FFD700"
              darkGoldColor="#9F6808"
              pinkGlow={true}
            />
          </div>

          {#if look?.profile.tagline}
            <p class="pp-tagline" dir="auto">{look.profile.tagline}</p>
          {/if}
          {#if look && ((look.profile.regKind !== 'none' && look.profile.legalId) || look.profile.founded)}
            <p class="pp-trust">
              {#if look.profile.regKind !== 'none' && look.profile.legalId}
                <span dir="auto">{$t(`rikmaLook.reg.${look.profile.regKind}`)} {look.profile.legalId}</span>
              {/if}
              {#if look.profile.founded}
                <span>{$t('rikmaLook.page.founded', { year: look.profile.founded })}</span>
              {/if}
            </p>
          {/if}

          <!-- The rikma's code, right under its seal -->
          {#if githublink || project.attributes.codeLicense}
            <div class="relative z-30 mb-4 flex flex-col items-center gap-2">
              {#if githublink}<RikmaRepoLink href={githublink} />{/if}
              <RikmaLicenseBadge
                license={project.attributes.codeLicense}
                openYears={project.attributes.codeLicenseOpenYears}
                since={project.attributes.codeLicenseSince}
                joinHref="/project/{projectId}/join"
              />
            </div>
          {/if}

          <!-- Social Links (Glassy container) -->
          <!-- `relative z-30`: the door-cards below are `backdrop-filter` layers,
               so without a stacking context of its own this row (and the open
               share dropdown inside it) would be painted behind them. -->
          <div
            class="relative z-30 flex gap-4 p-3 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm shadow-lg mb-6"
          >
            {#if discordlink}
              <a target="_blank" href={discordlink} class="social-btn group" title="Discord">
                <img
                  src="https://res.cloudinary.com/love1/image/upload/v1662563246/discord-icon-svgrepo-com_d4vk6m.svg"
                  alt="Discord"
                />
              </a>
            {/if}
            {#if linkP}
              <a target="_blank" href={linkP} class="social-btn group text-gold" title={$t('pages.projectPublic.visit')}>
                <!-- Website Icon -->
                <svg
                  version="1.1"
                  xmlns="http://www.w3.org/2000/svg"
                  xmlns:xlink="http://www.w3.org/1999/xlink"
                  viewBox="0 0 512 512"
                  xml:space="preserve"
                >
                  <path
                    style="fill:#D6E5F6;"
                    d="M488.727,31.03H23.273C10.42,31.03,0,41.45,0,54.303v403.394c0,12.854,10.42,23.273,23.273,23.273
	h465.455c12.853,0,23.273-10.418,23.273-23.273V54.303C512,41.45,501.58,31.03,488.727,31.03z"
                  />
                  <path
                    style="fill:#A4C6EC;"
                    d="M488.727,31.03H256V480.97h232.727c12.853,0,23.273-10.418,23.273-23.273V54.303
	C512,41.45,501.58,31.03,488.727,31.03z"
                  />
                  <path
                    style="fill:#385C8E;"
                    d="M488.727,31.03H23.273C10.42,31.03,0,41.45,0,54.303v93.091c0,12.854,10.42,23.273,23.273,23.273
	h465.455c12.853,0,23.273-10.418,23.273-23.273V54.303C512,41.45,501.58,31.03,488.727,31.03z"
                  />
                  <path
                    style="fill:#1D3366;"
                    d="M488.727,31.03H256v139.636h232.727c12.853,0,23.273-10.418,23.273-23.273V54.303
	C512,41.45,501.58,31.03,488.727,31.03z"
                  />
                  <rect x="395.636" y="54.303" style="fill:#FFFFFF;" width="93.091" height="93.122" />
                  <path
                    style="fill:#1D3366;"
                    d="M488.727,170.695h-93.091c-12.853,0-23.273-10.42-23.273-23.273V54.303
	c0-12.851,10.42-23.273,23.273-23.273h93.091C501.58,31.03,512,41.452,512,54.303v93.119
	C512,160.275,501.58,170.695,488.727,170.695z M418.909,124.149h46.545V77.576h-46.545V124.149z"
                  />
                </svg>
              </a>
            {/if}
            {#if twiterlink}
              <a target="_blank" href={twiterlink} class="social-btn group">
                <img src="https://visualpharm.com/assets/700/Twitter-595b40b65ba036ed117d4613.svg" alt="Twitter" />
              </a>
            {/if}
            {#if fblink}
              <a target="_blank" href={fblink} class="social-btn group">
                <img
                  src="https://res.cloudinary.com/love1/image/upload/v1639258134/NicePng_oro-png_2336309_rkhbf8.png"
                  alt="Facebook"
                />
              </a>
            {/if}
            <!-- Sharing the rikma belongs with the rikma's own links, and it is
                 the one that is always there — a rikma with no website still
                 wants to be passed on. -->
            <div class="social-btn">
              <ShareLink
                path={data.canonicalPath ?? `/project/${projectId}`}
                title={project.attributes.projectName}
                desc={look?.profile.tagline || $t('ui.share.project')}
                hashtags={['1lev1', 'rikma']}
                size={24}
              />
            </div>
          </div>

          <!-- The two doors. Without a look: support (PLAN_VOLUNTEER_RIKMA §3)
               and self-nomination (PLAN_SELF_NOMINATION §4); a look picks what
               they ask for. -->
          <div class="grid grid-cols-1 gap-4 w-full max-w-2xl {doors.secondary ? 'sm:grid-cols-2' : ''}">
            {@render door(doors.primary, 'gold')}
            {#if doors.secondary}
              {@render door(doors.secondary, 'barbi')}
            {/if}
          </div>
          {#if asksForDonation && look?.profile.donationNote}
            <p class="pp-note" dir="auto">{look.profile.donationNote}</p>
          {/if}
        </div>

        <!-- 2. Unregistered User Invitation (Gold & Pink Card) -->
        {#if asGuest}
          <div
            class="mb-10 mx-2 p-6 rounded-2xl bg-gradient-to-r from-pink-900/80 to-purple-900/80 border border-gold/40 shadow-[0_0_15px_rgba(255,0,174,0.3)] text-center relative overflow-hidden"
          >
            <div class="absolute top-0 right-0 w-20 h-20 bg-gold/20 rounded-full blur-2xl"></div>
            <div class="absolute bottom-0 left-0 w-20 h-20 bg-barbi/20 rounded-full blur-2xl"></div>

            <h2
              class="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-l from-gold via-white to-gold mb-2"
            >
              {$t('pages.projectPublic.joinTitle')}
            </h2>
            <p class="text-gray-200 mb-6 max-w-lg mx-auto leading-relaxed">
              {$t('pages.projectPublic.joinDesc')}
            </p>
            <a
              href="/"
              class="inline-block px-8 py-3 rounded-full bg-gradient-to-r from-gold via-[#d4af37] to-[#b8860b] text-black font-bold shadow-lg hover:scale-105 transition-transform hover:shadow-gold/50"
            >
              {$t('pages.projectPublic.login')}
            </a>
          </div>
        {/if}

        <!-- 3+. The panels, in the rikma's order -->
        {#each rows as row (row.join())}
          {#if row.length === 2}
            <!-- 5. Values & Missions Grid -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
              {@render panel(row[0], true)}
              {@render panel(row[1], true)}
            </div>
          {:else}
            {@render panel(row[0], false)}
          {/if}
        {/each}

        {#if look?.links.reports || look?.links.accessibility}
          <p class="pp-footer-links">
            {#if look.links.reports}
              <a href={look.links.reports} target="_blank" rel="noopener noreferrer">{$t('rikmaLook.page.reports')}</a>
            {/if}
            {#if look.links.accessibility}
              <a href={look.links.accessibility} target="_blank" rel="noopener noreferrer"
                >{$t('rikmaLook.page.accessibility')}</a
              >
            {/if}
          </p>
        {/if}
      </div>
    </div>
  {:else}
    <!-- Loading State -->
    <div class="pp-backdrop h-screen w-screen flex items-center justify-center">
      <Spinner size="lg" />
    </div>
  {/if}
</RikmaSkin>

<style>
  /* Custom utility classes within scope */
  :global(body) {
    background-color: #0f0f0f;
  }

  /* Every colour below comes from RikmaSkin's --pp-* palette, whose defaults
     are the page's own gold, pink and plum. */
  .pp-backdrop {
    background: linear-gradient(to bottom right, var(--pp-bg1), var(--pp-bg2), var(--pp-bg3));
  }

  .pp-cover {
    position: absolute;
    inset: 0 0 auto 0;
    height: 30rem;
    pointer-events: none;
    -webkit-mask-image: linear-gradient(to bottom, #000 35%, transparent);
    mask-image: linear-gradient(to bottom, #000 35%, transparent);
  }
  .pp-cover img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    opacity: 0.45;
  }

  .pp-preview-banner {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 0.25rem 0.75rem;
    margin-bottom: 1.25rem;
    padding: 0.75rem 1rem;
    border-radius: 0.9rem;
    border: 1px solid rgb(var(--pp-gold) / 0.35);
    background: rgb(var(--pp-gold) / 0.1);
    color: rgb(var(--pp-gold-soft));
    font-size: 0.9rem;
    text-align: center;
  }
  .pp-preview-banner a {
    color: #fff;
    font-weight: 700;
    text-decoration: underline;
  }

  .pp-tagline {
    max-width: 36rem;
    margin: -0.5rem auto 0.5rem;
    text-align: center;
    font-size: 1.15rem;
    line-height: 1.5;
    color: rgb(255 255 255 / 0.88);
  }
  .pp-trust {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 0.25rem 1rem;
    margin-bottom: 1rem;
    font-size: 0.85rem;
    color: rgb(255 255 255 / 0.62);
  }
  .pp-note {
    max-width: 36rem;
    margin-top: 0.75rem;
    text-align: center;
    font-size: 0.85rem;
    color: rgb(255 255 255 / 0.68);
  }
  .pp-footer-links {
    display: flex;
    justify-content: center;
    gap: 1.25rem;
    font-size: 0.85rem;
  }
  .pp-footer-links a {
    color: rgb(255 255 255 / 0.7);
    text-decoration: underline;
  }
  .pp-footer-links a:hover {
    color: rgb(var(--pp-gold));
  }

  .glass-panel {
    background: rgba(255, 255, 255, 0.03);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: var(--pp-radius, 1rem);
    padding: 1.5rem;
    box-shadow: 0 4px 30px rgba(0, 0, 0, 0.1);
  }

  .text-gold {
    color: rgb(var(--pp-gold));
  }
  .text-barbi {
    color: rgb(var(--pp-barbi));
  }
  .border-t-gold {
    border-top-color: rgb(var(--pp-gold));
  }
  .border-t-barbi {
    border-top-color: rgb(var(--pp-barbi));
  }

  .door-card {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    padding: 1.25rem 1.5rem;
    border-radius: var(--pp-radius, 1.25rem);
    background: rgba(255, 255, 255, 0.04);
    backdrop-filter: blur(10px);
    border-width: 1px;
    border-style: solid;
    transition: transform 0.2s, border-color 0.2s, box-shadow 0.2s;
  }
  .door-card:hover {
    transform: translateY(-3px);
    box-shadow: 0 8px 30px rgba(0, 0, 0, 0.35);
  }
  .door-gold { border-color: rgb(var(--pp-gold) / 0.4); }
  .door-gold:hover { border-color: rgb(var(--pp-gold)); }
  .door-barbi { border-color: rgb(var(--pp-barbi) / 0.4); }
  .door-barbi:hover { border-color: rgb(var(--pp-barbi)); }

  .partner-chip {
    display: inline-block;
    padding: 0.4rem 0.9rem;
    border-radius: var(--pp-radius, 9999px);
    border: 1px solid rgb(var(--pp-gold) / 0.35);
    background: rgb(var(--pp-gold) / 0.08);
    color: rgb(var(--pp-gold-soft));
    font-size: 0.9rem;
  }
  a.partner-chip:hover {
    border-color: rgb(var(--pp-gold));
  }

  .contact-list {
    display: grid;
    gap: 0.75rem;
    grid-template-columns: repeat(auto-fit, minmax(12rem, 1fr));
  }
  .contact-list dt {
    font-size: 0.8rem;
    color: rgb(255 255 255 / 0.6);
  }
  .contact-list dd {
    margin: 0;
    color: #fff;
  }
  .contact-list a {
    color: rgb(var(--pp-gold));
    text-decoration: underline;
  }

  .social-btn {
    width: 2.5rem;
    height: 2.5rem;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 9999px;
    background-color: rgba(255, 255, 255, 0.05);
    transition: all 0.3s ease;
  }
  .social-btn:hover {
    background-color: rgb(var(--pp-gold) / 0.2);
    transform: scale(1.1);
  }
  .social-btn img,
  .social-btn svg {
    width: 1.5rem;
    height: 1.5rem;
    filter: drop-shadow(0 0 2px rgba(0, 0, 0, 0.5));
  }

  .section-title {
    font-size: 1.1rem;
    color: rgba(255, 255, 255, 0.6);
    text-transform: uppercase;
    letter-spacing: 0.1em;
    position: relative;
    display: inline-block;
  }

  .cta-button-pink {
    background: linear-gradient(135deg, rgb(var(--pp-barbi)) 0%, rgb(var(--pp-barbi-2)) 100%);
    color: rgb(var(--pp-on-barbi));
    font-weight: bold;
    padding: 0.75rem 2rem;
    border-radius: var(--pp-radius, 9999px);
    border: 1px solid rgba(255, 255, 255, 0.2);
    box-shadow: 0 4px 15px rgb(var(--pp-barbi) / 0.3);
    transition: all 0.3s;
  }
  .cta-button-pink:hover {
    box-shadow: 0 0 20px rgb(var(--pp-barbi) / 0.6);
    transform: translateY(-2px);
  }

  /* Animation Utils */
  .animate-fade-in-up {
    animation: fadeInUp 0.8s ease-out;
  }

  @keyframes fadeInUp {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
</style>
