<script>
  import { t } from '$lib/translations';
  import Header from '$lib/components/header/header.svelte';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { lang } from '$lib/stores/lang.js';
  import { RingLoader } from 'svelte-loading-spinners';
  import RichText from '$lib/celim/ui/richText.svelte';
  import { invalidate } from '$app/navigation';
  import DonateDialog from '$lib/components/revenue/DonateDialog.svelte';
  import { htmlExcerpt } from '$lib/text/htmlExcerpt';

  let { data } = $props();

  let projectId = $derived(data.projectId);
  let isRegisteredUser = $derived(data.isRegisteredUser);
  let project = $derived(data.projectData);
  let attrs = $derived(project?.attributes);
  let coverage = $derived(data.coverage);
  let available = $derived(data.available !== false);
  let gate = $derived(data.gate ?? 'off');
  let isMember = $derived(data.isMember === true);
  let members = $derived(data.members ?? []);
  let uid = $derived(data.uid ?? null);

  let donateOpen = $state(false);
  function openDonate() {
    donateOpen = true;
  }
  function onDonated() {
    invalidate(`project-support:${projectId}`);
  }

  /** @type {'rtl' | 'ltr'} */
  let dir = $derived($lang === 'he' ? 'rtl' : 'ltr');

  let logoSrc = $derived(
    attrs?.profilePic?.data
      ? attrs.profilePic.data.attributes.formats?.small?.url ||
          attrs.profilePic.data.attributes.url
      : null
  );
  let ogImage = $derived(
    attrs?.profilePic?.data ? attrs.profilePic.data.attributes.url : null
  );

  let team = $derived(attrs?.user_1s?.data || []);
  let products = $derived(attrs?.matanotofs?.data || []);
  let openMissions = $derived(attrs?.open_missions?.data || []);

  // Coverage.missions (funding status) joined back onto the raw open missions.
  let missionStatusById = $derived(
    new Map((coverage?.missions || []).map((m) => [String(m.id), m]))
  );

  // Values, translated for he like the main project page does.
  let vallues = $derived.by(() => {
    const base = attrs?.vallues?.data || [];
    return base.map((v) => {
      const loc = v?.attributes?.localizations?.data;
      const name =
        $lang === 'he' && loc?.length > 0
          ? loc[0].attributes.valueName
          : v?.attributes?.valueName;
      return name;
    }).filter(Boolean);
  });

  function skillName(skill) {
    const loc = skill?.attributes?.localizations?.data;
    return $lang === 'he' && loc?.length > 0
      ? loc[0].attributes.skillName
      : skill?.attributes?.skillName;
  }

  let coveragePct = $derived(
    coverage ? Math.round(coverage.coverageRatio * 100) : 0
  );

  function fmt(n) {
    if (typeof n !== 'number' || !Number.isFinite(n)) return '0';
    return n.toLocaleString($lang === 'he' ? 'he-IL' : 'en-US', {
      maximumFractionDigits: 0
    });
  }

  // Share (so an amuta can hand this URL out as its homepage).
  let copied = $state(false);
  async function shareLink() {
    const url = $page.url.href;
    try {
      if (navigator.share) {
        await navigator.share({ title: attrs?.projectName, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      copied = true;
      setTimeout(() => (copied = false), 2500);
    } catch {
      /* user dismissed the share sheet — nothing to do */
    }
  }

  let plainDescription = $derived(
    (attrs?.publicDescription || '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 160)
  );

  let pageTitle = $derived(
    attrs?.projectName
      ? $lang === 'he'
        ? `${attrs.projectName} - תמיכה ושקיפות`
        : `${attrs.projectName} - Support & Transparency`
      : '1💗1'
  );
</script>

<svelte:head>
  <title>{pageTitle}</title>
  <meta name="description" content={plainDescription || pageTitle} />
  <meta property="og:title" content={pageTitle} />
  <meta property="og:description" content={plainDescription || pageTitle} />
  {#if ogImage}
    <meta property="og:image" content={ogImage} />
  {/if}
  <meta property="og:type" content="website" />
</svelte:head>

{#if isRegisteredUser}
  <Header />
{/if}

{#if !available}
  <!-- Gated off (or members-only for a guest): friendly, self-standing screen. -->
  <div class="support-page min-h-screen text-white font-sans flex items-center justify-center px-4">
    <div class="glass rounded-3xl p-10 max-w-md text-center">
      {#if logoSrc}
        <div class="logo-ring mx-auto mb-6"><img src={logoSrc} alt={attrs?.projectName} /></div>
      {/if}
      {#if attrs?.projectName}
        <h1 class="text-2xl font-black text-gold mb-3">{attrs.projectName}</h1>
      {/if}
      <p class="text-white/70 mb-6">
        {gate === 'members' && !isRegisteredUser ? $t('pages.projectSupport.unavailableMembers') : $t('pages.projectSupport.unavailableBody')}
      </p>
      <div class="flex flex-wrap justify-center gap-3">
        {#if gate === 'members' && !isRegisteredUser}
          <a href="/" class="btn-primary">{$t('pages.projectSupport.joinBtn')}</a>
        {/if}
        <a href="/project/{projectId}" class="btn-ghost">{$t('pages.projectSupport.toFullPage')}</a>
      </div>
    </div>
  </div>
{:else if project && coverage}
  <div class="support-page min-h-screen text-white font-sans overflow-x-hidden">
    <div {dir} class="max-w-5xl mx-auto px-4 pb-24">
      {#if isMember && gate !== 'public'}
        <!-- Member-only preview banner: this page is not (fully) public yet. -->
        <div class="gate-banner">
          <span>{gate === 'off' ? $t('pages.projectSupport.gateBannerOff') : $t('pages.projectSupport.gateBannerMembers')}</span>
          <a href="/moach/{projectId}/sales">{$t('pages.projectSupport.gateManage')}</a>
        </div>
      {/if}
      <!-- ═══════════ 1. HERO ═══════════ -->
      <section class="pt-14 pb-10 text-center relative">
        <div class="hero-glow" aria-hidden="true"></div>

        {#if logoSrc}
          <div class="logo-ring mx-auto mb-6">
            <img src={logoSrc} alt={attrs.projectName} />
          </div>
        {/if}

        <h1
          class="text-4xl sm:text-6xl font-black mb-3 bg-clip-text text-transparent bg-gradient-to-l from-gold via-white to-gold leading-tight"
        >
          {attrs.projectName}
        </h1>

        {#if attrs.city}
          <p class="text-white/50 mb-2">📍 {attrs.city}</p>
        {/if}

        <p class="max-w-xl mx-auto text-lg text-white/80 mb-8">
          {$t('pages.projectSupport.heroTagline')}
        </p>

        <div class="flex flex-wrap justify-center gap-3 mb-7">
          <button type="button" class="btn-primary" onclick={openDonate}>{$t('pages.projectSupport.donateCta')}</button>
          <a href="#missions" class="btn-secondary">{$t('pages.projectSupport.volunteerCta')}</a>
          {#if attrs.linkToWebsite}
            <a
              href={attrs.linkToWebsite}
              target="_blank"
              rel="noopener"
              class="btn-ghost">🌐 {$t('pages.projectSupport.visitSite')}</a
            >
          {/if}
        </div>

        <!-- social + share -->
        <div class="flex justify-center items-center gap-3 text-sm">
          {#if attrs.fblink}<a class="social-dot" target="_blank" rel="noopener" href={attrs.fblink} title="Facebook">f</a>{/if}
          {#if attrs.twiterlink}<a class="social-dot" target="_blank" rel="noopener" href={attrs.twiterlink} title="X / Twitter">𝕏</a>{/if}
          {#if attrs.discordlink}<a class="social-dot" target="_blank" rel="noopener" href={attrs.discordlink} title="Discord">🎮</a>{/if}
          {#if attrs.githublink}<a class="social-dot" target="_blank" rel="noopener" href={attrs.githublink} title="GitHub">🐙</a>{/if}
          {#if attrs.watsapplink}<a class="social-dot" target="_blank" rel="noopener" href={attrs.watsapplink} title="WhatsApp">💬</a>{/if}
          <button class="btn-ghost !py-1.5 !px-4 text-sm" onclick={shareLink}>
            {copied ? $t('pages.projectSupport.copied') : `🔗 ${$t('pages.projectSupport.share')}`}
          </button>
        </div>
      </section>

      <!-- ═══════════ 2. COVERAGE BOARD ═══════════ -->
      <section class="glass rounded-3xl p-6 sm:p-10 mb-14 relative overflow-hidden">
        <div class="board-shimmer" aria-hidden="true"></div>
        <h2 class="text-2xl sm:text-3xl font-bold text-gold mb-1">
          {$t('pages.projectSupport.coverageTitle')}
        </h2>
        <p class="text-white/60 mb-8">{$t('pages.projectSupport.coverageSub')}</p>

        <!-- the big bar -->
        <div class="mb-3 flex justify-between items-end flex-wrap gap-2">
          <span class="text-white/70 text-sm">{$t('pages.projectSupport.doneValue')}: <b class="text-white">₪{fmt(coverage.doneValue)}</b></span>
          <span class="text-gold font-black text-3xl">{coveragePct}% <span class="text-base font-normal text-white/60">{$t('pages.projectSupport.covered')}</span></span>
        </div>
        <div class="coverage-track" role="img" aria-label="{coveragePct}%">
          <div class="coverage-fill" style="width: {coveragePct}%"></div>
        </div>

        <!-- stat tiles -->
        <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-8">
          <div class="stat">
            <span class="stat-num">₪{fmt(coverage.doneValue)}</span>
            <span class="stat-label">{$t('pages.projectSupport.doneValue')}</span>
          </div>
          <div class="stat">
            <span class="stat-num text-gold">₪{fmt(coverage.incomeTotal)}</span>
            <span class="stat-label">{$t('pages.projectSupport.incomeTotal')}</span>
          </div>
          <div class="stat">
            <span class="stat-num">₪{fmt(coverage.paidOut)}</span>
            <span class="stat-label">{$t('pages.projectSupport.paidOut')}</span>
          </div>
          <div class="stat">
            <span class="stat-num text-barbi">₪{fmt(coverage.availableForFuture)}</span>
            <span class="stat-label">{$t('pages.projectSupport.availableForFuture')}</span>
          </div>
        </div>

        <!-- income sources -->
        {#if coverage.incomeTotal > 0}
          <div class="mt-8">
            <h3 class="text-sm uppercase tracking-widest text-white/50 mb-3">
              {$t('pages.projectSupport.incomeBreakdown')}
            </h3>
            <div class="flex flex-wrap gap-2">
              <span class="chip chip-gold">💗 {$t('pages.projectSupport.srcDonations')} · ₪{fmt(coverage.donationIncome)}</span>
              <span class="chip chip-pink">🎁 {$t('pages.projectSupport.srcProducts')} · ₪{fmt(coverage.productIncome)}</span>
              {#if coverage.otherIncome > 0}
                <span class="chip">✨ {$t('pages.projectSupport.srcOther')} · ₪{fmt(coverage.otherIncome)}</span>
              {/if}
            </div>
          </div>
        {/if}
      </section>

      <!-- ═══════════ 3. MISSIONS ═══════════ -->
      <section id="missions" class="mb-14 scroll-mt-8">
        <h2 class="text-2xl sm:text-3xl font-bold mb-1 text-barbi">
          {$t('pages.projectSupport.missionsTitle')}
        </h2>
        <p class="text-white/60 mb-6 max-w-2xl">{$t('pages.projectSupport.missionsSub')}</p>

        {#if openMissions.length > 0}
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {#each openMissions as om (om.id)}
              {@const st = missionStatusById.get(String(om.id))}
              {@const assigned = st?.assigned}
              <div class="glass rounded-2xl p-5 flex flex-col gap-3 mission-card" class:mission-funded={st?.funded}>
                <div class="flex justify-between items-start gap-2">
                  <h3 class="font-bold text-lg leading-snug">{om.attributes.name}</h3>
                  {#if assigned}
                    <span class="badge badge-muted">{$t('pages.projectSupport.inProgress')}</span>
                  {:else if st?.funded}
                    <span class="badge badge-funded">{$t('pages.projectSupport.funded')}</span>
                  {:else}
                    <span class="badge badge-waiting">{$t('pages.projectSupport.notFunded')}</span>
                  {/if}
                </div>

                <!-- `descrip` is tiptap HTML — printing it raw showed visitors
                     the literal `<p style="text-align: right;">…</p>` markup. -->
                {#if htmlExcerpt(om.attributes.descrip)}
                  <p class="text-white/60 text-sm line-clamp-3">
                    {htmlExcerpt(om.attributes.descrip)}
                  </p>
                {/if}

                <div class="flex flex-wrap items-center gap-2 text-sm text-white/70">
                  {#if om.attributes.noofhours}
                    <span>⏱ {fmt(om.attributes.noofhours)} {$t('pages.projectSupport.hours')}</span>
                  {/if}
                  {#if st?.value}
                    <span class="text-gold font-semibold">≈ ₪{fmt(st.value)}</span>
                  {/if}
                </div>

                {#if om.attributes.skills?.data?.length}
                  <div class="flex flex-wrap gap-1.5">
                    {#each om.attributes.skills.data as skill (skill.id)}
                      <span class="chip !text-xs">{skillName(skill)}</span>
                    {/each}
                  </div>
                {/if}

                {#if !assigned}
                  <button
                    class="btn-primary !text-sm mt-auto self-start"
                    onclick={() => goto(`/availableMission/${om.id}`)}
                  >
                    {$t('pages.projectSupport.iWillDoIt')}
                  </button>
                {/if}
              </div>
            {/each}
          </div>
        {:else}
          <div class="glass rounded-2xl p-8 text-center text-white/60">
            {$t('pages.projectSupport.noMissions')}
          </div>
        {/if}

        <p class="mt-4 text-sm">
          <a href="/project/{projectId}/join" class="text-barbi underline hover:text-white">
            {$t('pages.projectSupport.proposeYourOwn')}
          </a>
        </p>
      </section>

      <!-- ═══════════ 4. HOW TO SUPPORT ═══════════ -->
      <section id="donate" class="mb-14 scroll-mt-8">
        <h2 class="text-2xl sm:text-3xl font-bold text-gold mb-6">
          {$t('pages.projectSupport.donateTitle')}
        </h2>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div class="glass rounded-2xl p-6 border-t-4 border-t-gold flex flex-col">
            <div class="text-3xl mb-3">💗</div>
            <h3 class="font-bold text-lg mb-2">{$t('pages.projectSupport.donateMoney')}</h3>
            <p class="text-white/60 text-sm leading-relaxed mb-4">{$t('pages.projectSupport.donateMoneyDesc')}</p>
            <button type="button" class="btn-primary !text-sm mt-auto self-start" onclick={openDonate}>
              {$t('pages.projectSupport.donateCta')}
            </button>
          </div>
          <div class="glass rounded-2xl p-6 border-t-4 border-t-barbi">
            <div class="text-3xl mb-3">🎁</div>
            <h3 class="font-bold text-lg mb-2">{$t('pages.projectSupport.donateBuy')}</h3>
            <p class="text-white/60 text-sm leading-relaxed mb-3">{$t('pages.projectSupport.donateBuyDesc')}</p>
            {#if products.length > 0}
              <a href="#products" class="text-gold text-sm underline hover:text-white">{$t('pages.projectSupport.toProducts')}</a>
            {/if}
          </div>
          <div class="glass rounded-2xl p-6 border-t-4 border-t-white/40">
            <div class="text-3xl mb-3">🤝</div>
            <h3 class="font-bold text-lg mb-2">{$t('pages.projectSupport.donateTime')}</h3>
            <p class="text-white/60 text-sm leading-relaxed mb-3">{$t('pages.projectSupport.donateTimeDesc')}</p>
            <a href="#missions" class="text-gold text-sm underline hover:text-white">{$t('pages.projectSupport.toMissions')}</a>
          </div>
        </div>
      </section>

      <!-- ═══════════ 5. PRODUCTS ═══════════ -->
      {#if products.length > 0}
        <section id="products" class="mb-14 scroll-mt-8">
          <h2 class="text-2xl sm:text-3xl font-bold text-barbi mb-1">
            {$t('pages.projectSupport.productsTitle')}
          </h2>
          <p class="text-white/60 mb-6 max-w-2xl">{$t('pages.projectSupport.productsSub')}</p>
          <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {#each products as matanot (matanot.id)}
              <a href="/gift/{matanot.id}" class="glass rounded-2xl overflow-hidden product-card group">
                {#if matanot.attributes.pic?.data}
                  <img
                    class="w-full aspect-square object-cover"
                    src={matanot.attributes.pic.data.attributes.formats?.small?.url ||
                      matanot.attributes.pic.data.attributes.url}
                    alt={matanot.attributes.name}
                    loading="lazy"
                  />
                {:else}
                  <div class="w-full aspect-square flex items-center justify-center text-5xl bg-white/5">🎁</div>
                {/if}
                <div class="p-4">
                  <p class="font-semibold leading-snug mb-1">{matanot.attributes.name}</p>
                  {#if matanot.attributes.price != null}
                    <p class="text-gold font-bold">₪{fmt(matanot.attributes.price)}</p>
                  {/if}
                  <p class="text-xs text-white/50 underline group-hover:text-gold mt-1">
                    {$t('pages.projectSupport.productLink')}
                  </p>
                </div>
              </a>
            {/each}
          </div>
        </section>
      {/if}

      <!-- ═══════════ 6. SUPPORTER WALL ═══════════ -->
      {#if coverage.supporters.length > 0}
        <section class="mb-14">
          <h2 class="text-2xl sm:text-3xl font-bold text-gold mb-6">
            {$t('pages.projectSupport.supportersTitle')}
          </h2>
          <div class="flex flex-wrap gap-3">
            {#each coverage.supporters as s, i (i)}
              <div class="glass rounded-xl px-4 py-3 min-w-[10rem]">
                <p class="font-semibold">{s.name || $t('pages.projectSupport.anonymous')}</p>
                <p class="text-gold text-sm font-bold">₪{fmt(s.amount)}</p>
                {#if s.msg}
                  <p class="text-white/60 text-xs italic mt-1">"{s.msg}"</p>
                {/if}
              </div>
            {/each}
          </div>
        </section>
      {/if}

      <!-- ═══════════ 7. ABOUT / VALUES / TEAM ═══════════ -->
      {#if attrs.publicDescription}
        <section class="glass rounded-3xl p-6 sm:p-10 mb-10">
          <h2 class="text-2xl font-bold text-white mb-4">{$t('pages.projectSupport.aboutTitle')}</h2>
          <div class="text-white/80 leading-relaxed">
            <RichText editable={false} outpot={attrs.publicDescription} />
          </div>
        </section>
      {/if}

      <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-14">
        {#if vallues.length > 0}
          <section class="glass rounded-2xl p-6">
            <h2 class="text-xl font-bold text-gold mb-4">✨ {$t('pages.projectSupport.valuesTitle')}</h2>
            <div class="flex flex-wrap gap-2">
              {#each vallues as v (v)}
                <span class="chip chip-gold">{v}</span>
              {/each}
            </div>
          </section>
        {/if}

        {#if team.length > 0}
          <section class="glass rounded-2xl p-6">
            <h2 class="text-xl font-bold text-barbi mb-4">{$t('pages.projectSupport.teamTitle')}</h2>
            <div class="flex flex-wrap gap-2">
              {#each team as user (user.id)}
                <button
                  onclick={() => goto(`/user/${user.id}`)}
                  class="team-avatar"
                  title={user.attributes.username}
                >
                  <img
                    src={user.attributes.profilePic?.data
                      ? user.attributes.profilePic.data.attributes.url
                      : 'https://res.cloudinary.com/love1/image/upload/v1653053361/image_s1syn2.png'}
                    alt={user.attributes.username}
                  />
                </button>
              {/each}
            </div>
          </section>
        {/if}
      </div>

      <!-- ═══════════ 8. JOIN + FOOTER ═══════════ -->
      <section class="text-center glass rounded-3xl p-8 sm:p-12 mb-10 join-card">
        <h2 class="text-2xl sm:text-3xl font-black mb-3 bg-clip-text text-transparent bg-gradient-to-l from-gold via-white to-barbi">
          {$t('pages.projectSupport.joinTitle')}
        </h2>
        <p class="text-white/70 max-w-lg mx-auto mb-6">{$t('pages.projectSupport.joinDesc')}</p>
        <div class="flex flex-wrap justify-center gap-3">
          {#if !isRegisteredUser}
            <a href="/" class="btn-primary">{$t('pages.projectSupport.joinBtn')}</a>
          {/if}
          <a href="/project/{projectId}" class="btn-ghost">{$t('pages.projectSupport.toFullPage')}</a>
        </div>
      </section>

      <footer class="text-center text-white/40 text-sm">
        {$t('pages.projectSupport.poweredBy')}
        <a href="/" class="text-gold hover:text-white font-semibold">1💗1</a>
      </footer>
    </div>
  </div>
{:else}
  <div class="support-page h-screen w-screen flex items-center justify-center">
    <RingLoader size="200" color="#ff00ae" unit="px" duration="2s"></RingLoader>
  </div>
{/if}

{#if available && project}
  <DonateDialog
    bind:isOpen={donateOpen}
    {projectId}
    projectName={attrs?.projectName ?? ''}
    {members}
    {isRegisteredUser}
    {isMember}
    {uid}
    onDone={onDonated}
  />
{/if}

<style>
  .gate-banner {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 0.75rem;
    margin-top: 1rem;
    padding: 0.75rem 1.1rem;
    border-radius: 0.9rem;
    background: rgba(255, 215, 0, 0.1);
    border: 1px solid rgba(255, 215, 0, 0.3);
    color: #ffe36e;
    font-size: 0.85rem;
  }
  .gate-banner a {
    color: #fff;
    font-weight: 700;
    text-decoration: underline;
    white-space: nowrap;
  }
  .support-page {
    background:
      radial-gradient(1200px 500px at 80% -10%, rgba(255, 215, 0, 0.08), transparent 60%),
      radial-gradient(1000px 600px at 10% 10%, rgba(255, 0, 174, 0.09), transparent 55%),
      linear-gradient(160deg, #1a0515 0%, #2c0b1e 45%, #120f26 100%);
    scroll-behavior: smooth;
  }

  .hero-glow {
    position: absolute;
    inset: -4rem 0 auto 0;
    height: 22rem;
    background: radial-gradient(600px 260px at 50% 0%, rgba(255, 215, 0, 0.12), transparent 70%);
    pointer-events: none;
  }

  .logo-ring {
    width: 9rem;
    height: 9rem;
    border-radius: 9999px;
    padding: 4px;
    background: conic-gradient(from 180deg, #ffd700, #ff00ae, #ffd700);
    box-shadow: 0 0 45px rgba(255, 215, 0, 0.25);
  }
  .logo-ring img {
    width: 100%;
    height: 100%;
    border-radius: 9999px;
    object-fit: cover;
    border: 3px solid #1a0515;
  }

  .glass {
    background: rgba(255, 255, 255, 0.04);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.08);
    box-shadow: 0 4px 30px rgba(0, 0, 0, 0.15);
  }

  .text-gold { color: #ffd700; }
  .text-barbi { color: #ff00ae; }
  .border-t-gold { border-top-color: #ffd700; }
  .border-t-barbi { border-top-color: #ff00ae; }

  .btn-primary {
    display: inline-block;
    padding: 0.8rem 2rem;
    border-radius: 9999px;
    font-weight: 700;
    color: #000;
    background: linear-gradient(120deg, #ffd700, #d4af37 55%, #b8860b);
    box-shadow: 0 4px 20px rgba(255, 215, 0, 0.35);
    transition: transform 0.2s, box-shadow 0.2s;
  }
  .btn-primary:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 26px rgba(255, 215, 0, 0.5);
  }

  .btn-secondary {
    display: inline-block;
    padding: 0.8rem 2rem;
    border-radius: 9999px;
    font-weight: 700;
    color: #fff;
    background: linear-gradient(120deg, #ff00ae, #be185d);
    box-shadow: 0 4px 20px rgba(255, 0, 174, 0.3);
    transition: transform 0.2s, box-shadow 0.2s;
  }
  .btn-secondary:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 26px rgba(255, 0, 174, 0.5);
  }

  .btn-ghost {
    display: inline-block;
    padding: 0.8rem 1.6rem;
    border-radius: 9999px;
    font-weight: 600;
    color: rgba(255, 255, 255, 0.85);
    border: 1px solid rgba(255, 255, 255, 0.2);
    background: rgba(255, 255, 255, 0.05);
    transition: border-color 0.2s, background 0.2s;
  }
  .btn-ghost:hover {
    border-color: #ffd700;
    background: rgba(255, 215, 0, 0.08);
  }

  .social-dot {
    width: 2.2rem;
    height: 2.2rem;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border-radius: 9999px;
    background: rgba(255, 255, 255, 0.06);
    border: 1px solid rgba(255, 255, 255, 0.12);
    font-weight: 700;
    transition: all 0.2s;
  }
  .social-dot:hover {
    background: rgba(255, 215, 0, 0.15);
    transform: scale(1.08);
  }

  .board-shimmer {
    position: absolute;
    inset: 0;
    background: radial-gradient(500px 200px at 90% 0%, rgba(255, 215, 0, 0.07), transparent 70%);
    pointer-events: none;
  }

  .coverage-track {
    height: 1.4rem;
    border-radius: 9999px;
    background: rgba(255, 255, 255, 0.08);
    border: 1px solid rgba(255, 255, 255, 0.1);
    overflow: hidden;
  }
  .coverage-fill {
    height: 100%;
    border-radius: 9999px;
    background: linear-gradient(90deg, #b8860b, #ffd700 60%, #fff3b0);
    box-shadow: 0 0 18px rgba(255, 215, 0, 0.5);
    transition: width 1s ease-out;
    min-width: 0.35rem;
  }

  .stat {
    display: flex;
    flex-direction: column;
    gap: 0.15rem;
    padding: 1rem;
    border-radius: 1rem;
    background: rgba(255, 255, 255, 0.04);
    border: 1px solid rgba(255, 255, 255, 0.07);
  }
  .stat-num {
    font-size: 1.35rem;
    font-weight: 800;
  }
  .stat-label {
    font-size: 0.78rem;
    color: rgba(255, 255, 255, 0.55);
  }

  .chip {
    display: inline-flex;
    align-items: center;
    gap: 0.3rem;
    padding: 0.35rem 0.8rem;
    border-radius: 9999px;
    font-size: 0.85rem;
    background: rgba(255, 255, 255, 0.07);
    border: 1px solid rgba(255, 255, 255, 0.12);
  }
  .chip-gold {
    background: rgba(255, 215, 0, 0.12);
    border-color: rgba(255, 215, 0, 0.35);
    color: #ffe36e;
  }
  .chip-pink {
    background: rgba(255, 0, 174, 0.12);
    border-color: rgba(255, 0, 174, 0.35);
    color: #ff8ad8;
  }

  .badge {
    padding: 0.25rem 0.7rem;
    border-radius: 9999px;
    font-size: 0.72rem;
    font-weight: 700;
    white-space: nowrap;
  }
  .badge-funded {
    background: rgba(34, 197, 94, 0.15);
    color: #6ee7a0;
    border: 1px solid rgba(34, 197, 94, 0.4);
  }
  .badge-waiting {
    background: rgba(255, 215, 0, 0.1);
    color: #ffe36e;
    border: 1px solid rgba(255, 215, 0, 0.3);
  }
  .badge-muted {
    background: rgba(255, 255, 255, 0.08);
    color: rgba(255, 255, 255, 0.6);
    border: 1px solid rgba(255, 255, 255, 0.15);
  }

  .mission-card {
    transition: transform 0.2s, border-color 0.2s;
  }
  .mission-card:hover {
    transform: translateY(-3px);
    border-color: rgba(255, 215, 0, 0.3);
  }
  .mission-funded {
    border-color: rgba(34, 197, 94, 0.35);
  }

  .product-card {
    transition: transform 0.2s, border-color 0.2s;
  }
  .product-card:hover {
    transform: translateY(-3px);
    border-color: rgba(255, 0, 174, 0.4);
  }

  .team-avatar {
    width: 3rem;
    height: 3rem;
    border-radius: 9999px;
    border: 2px solid #ffd700;
    padding: 2px;
    background: rgba(0, 0, 0, 0.5);
    overflow: hidden;
    transition: transform 0.2s;
  }
  .team-avatar:hover {
    transform: translateY(-3px);
  }
  .team-avatar img {
    width: 100%;
    height: 100%;
    border-radius: 9999px;
    object-fit: cover;
  }

  .join-card {
    border: 1px solid rgba(255, 215, 0, 0.25);
    background:
      radial-gradient(400px 160px at 15% 100%, rgba(255, 0, 174, 0.1), transparent 70%),
      radial-gradient(400px 160px at 85% 0%, rgba(255, 215, 0, 0.1), transparent 70%),
      rgba(255, 255, 255, 0.04);
  }

  .line-clamp-3 {
    display: -webkit-box;
    -webkit-line-clamp: 3;
    line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
</style>
