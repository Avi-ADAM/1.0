<script>
  import Header from '$lib/components/header/header.svelte';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { lang } from '$lib/stores/lang.js';
  import { RingLoader } from 'svelte-loading-spinners';
  import RichText from '$lib/celim/ui/richText.svelte';

  let { data } = $props();

  let projectId = $derived(data.projectId);
  let isRegisteredUser = $derived(data.isRegisteredUser);
  let project = $derived(data.projectData);
  let attrs = $derived(project?.attributes);
  let coverage = $derived(data.coverage);

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

  const t = {
    heroTagline: {
      he: 'עושים — בשקיפות מלאה. כל שעה נרשמת בשוויה, וכל תרומה מחולקת ביושר.',
      en: 'Doing — in full transparency. Every hour is valued, every donation shared fairly.'
    },
    donateCta: { he: '💗 לתמוך בעשייה', en: '💗 Support the work' },
    volunteerCta: { he: '🤝 לבוא להתנדב', en: '🤝 Volunteer' },
    visitSite: { he: 'לאתר שלנו', en: 'Our website' },
    share: { he: 'שיתוף הדף', en: 'Share this page' },
    copied: { he: 'הקישור הועתק ✓', en: 'Link copied ✓' },
    coverageTitle: { he: 'שקוף עד הסוף', en: 'Fully transparent' },
    coverageSub: {
      he: 'כמה מהשווי של כל מה שנעשה כאן כבר כוסה בתרומות ובהכנסות',
      en: 'How much of the value created here is already covered by donations and income'
    },
    doneValue: { he: 'שווי העשייה עד כה', en: 'Value created so far' },
    incomeTotal: { he: 'תרומות והכנסות', en: 'Donations & income' },
    paidOut: { he: 'כבר חולק לעושים', en: 'Already paid out' },
    availableForFuture: { he: 'זמין למשימות הבאות', en: 'Available for what’s next' },
    incomeBreakdown: { he: 'מאיפה הגיע', en: 'Where it came from' },
    srcDonations: { he: 'תרומות', en: 'Donations' },
    srcProducts: { he: 'מכירת מוצרים', en: 'Product sales' },
    srcOther: { he: 'הכנסות אחרות', en: 'Other income' },
    covered: { he: 'כוסה', en: 'covered' },
    missionsTitle: { he: 'מה עוד מחכה שיעשו אותו', en: 'What still needs doing' },
    missionsSub: {
      he: 'כל משימה מוערכת בשעות ובשכר שעתי אידאלי. ממומנת? המבצע מקבל תשלום מיד בסיום. עוד לא? השווי נרשם — ויכוסה כשיגיעו תרומות.',
      en: 'Each mission is valued in hours × an ideal hourly rate. Funded? The doer is paid on completion. Not yet? The value is recorded — and covered as donations arrive.'
    },
    funded: { he: '✓ ממומן — תשלום מיד בסיום', en: '✓ Funded — paid on completion' },
    notFunded: { he: '⏳ ממתין למימון', en: '⏳ Awaiting funding' },
    inProgress: { he: 'כבר בביצוע', en: 'In progress' },
    hours: { he: 'שעות', en: 'hours' },
    iWillDoIt: { he: 'אני אבצע ←', en: 'I’ll do it →' },
    noMissions: {
      he: 'אין כרגע משימות פתוחות — אפשר לתמוך כדי לכסות את מה שכבר נעשה 💗',
      en: 'No open missions right now — you can still support what was already done 💗'
    },
    proposeYourOwn: {
      he: 'לא מצאתם משימה מתאימה? הציעו את עצמכם בתנאים שלכם ←',
      en: 'No mission fits? Nominate yourself on your own terms →'
    },
    donateTitle: { he: 'איך תומכים?', en: 'How to support' },
    donateMoney: { he: 'תרומה כספית', en: 'Donate' },
    donateMoneyDesc: {
      he: 'כל תרומה מתחלקת בין העושים לפי התרומה היחסית של כל אחד — אוטומטית ובשקיפות. תרומה מקוונת בדרך; בינתיים אפשר לתאם דרך הצוות או הקישורים למעלה.',
      en: 'Every donation is split between the doers by their relative contribution — automatically and transparently. Online giving is coming; meanwhile reach us via the team or the links above.'
    },
    donateBuy: { he: 'קנייה שתומכת', en: 'Buy & support' },
    donateBuyDesc: {
      he: 'ההכנסות ממוצרים שלנו נכנסות לאותו סל שקוף ומכסות את העשייה.',
      en: 'Income from our products flows into the same transparent pool and covers the work.'
    },
    donateTime: { he: 'תרומת זמן', en: 'Give time' },
    donateTimeDesc: {
      he: 'בוחרים משימה, מגדירים שכר שעתי אידאלי — ופשוט עושים. השווי נרשם לזכותכם מהרגע הראשון.',
      en: 'Pick a mission, set your ideal hourly rate — and just do it. Your value is recorded from day one.'
    },
    toProducts: { he: 'למוצרים ↓', en: 'To products ↓' },
    toMissions: { he: 'למשימות ↑', en: 'To missions ↑' },
    productsTitle: { he: 'המוצרים שלנו', en: 'Our products' },
    productsSub: {
      he: 'אפשר גם לתמוך בקנייה — כל רכישה מוצגת כאן כחלק מההכנסות, באותה שקיפות.',
      en: 'You can also support by buying — every purchase shows up in the same transparent income.'
    },
    productLink: { he: 'לפרטים ורכישה', en: 'Details & purchase' },
    supportersTitle: { he: 'קיר התומכים', en: 'Supporter wall' },
    anonymous: { he: 'תורם/ת אנונימי/ת', en: 'Anonymous supporter' },
    aboutTitle: { he: 'מי אנחנו', en: 'About us' },
    valuesTitle: { he: 'הערכים שלנו', en: 'Our values' },
    teamTitle: { he: 'הצוות', en: 'The team' },
    joinTitle: { he: 'רוצים יותר מלתמוך?', en: 'Want more than supporting?' },
    joinDesc: {
      he: 'הצטרפו כחברים מלאים — עם קול, עם חלק שווה בהחלטות, ועם שווי שנרשם על כל שעה.',
      en: 'Join as a full member — with a voice, an equal say, and value recorded for every hour.'
    },
    joinBtn: { he: 'הצטרפות / התחברות', en: 'Join / Log in' },
    toFullPage: { he: 'לעמוד הריקמה המלא', en: 'Full project page' },
    poweredBy: { he: 'נבנה באהבה על', en: 'Built with love on' }
  };

  let pageTitle = $derived(
    attrs?.projectName
      ? $lang === 'he'
        ? `${attrs.projectName} — תמיכה ושקיפות`
        : `${attrs.projectName} — Support & Transparency`
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

{#if project && coverage}
  <div class="support-page min-h-screen text-white font-sans overflow-x-hidden">
    <div {dir} class="max-w-5xl mx-auto px-4 pb-24">
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
          {t.heroTagline[$lang]}
        </p>

        <div class="flex flex-wrap justify-center gap-3 mb-7">
          <a href="#donate" class="btn-primary">{t.donateCta[$lang]}</a>
          <a href="#missions" class="btn-secondary">{t.volunteerCta[$lang]}</a>
          {#if attrs.linkToWebsite}
            <a
              href={attrs.linkToWebsite}
              target="_blank"
              rel="noopener"
              class="btn-ghost">🌐 {t.visitSite[$lang]}</a
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
            {copied ? t.copied[$lang] : `🔗 ${t.share[$lang]}`}
          </button>
        </div>
      </section>

      <!-- ═══════════ 2. COVERAGE BOARD ═══════════ -->
      <section class="glass rounded-3xl p-6 sm:p-10 mb-14 relative overflow-hidden">
        <div class="board-shimmer" aria-hidden="true"></div>
        <h2 class="text-2xl sm:text-3xl font-bold text-gold mb-1">
          {t.coverageTitle[$lang]}
        </h2>
        <p class="text-white/60 mb-8">{t.coverageSub[$lang]}</p>

        <!-- the big bar -->
        <div class="mb-3 flex justify-between items-end flex-wrap gap-2">
          <span class="text-white/70 text-sm">{t.doneValue[$lang]}: <b class="text-white">₪{fmt(coverage.doneValue)}</b></span>
          <span class="text-gold font-black text-3xl">{coveragePct}% <span class="text-base font-normal text-white/60">{t.covered[$lang]}</span></span>
        </div>
        <div class="coverage-track" role="img" aria-label="{coveragePct}%">
          <div class="coverage-fill" style="width: {coveragePct}%"></div>
        </div>

        <!-- stat tiles -->
        <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-8">
          <div class="stat">
            <span class="stat-num">₪{fmt(coverage.doneValue)}</span>
            <span class="stat-label">{t.doneValue[$lang]}</span>
          </div>
          <div class="stat">
            <span class="stat-num text-gold">₪{fmt(coverage.incomeTotal)}</span>
            <span class="stat-label">{t.incomeTotal[$lang]}</span>
          </div>
          <div class="stat">
            <span class="stat-num">₪{fmt(coverage.paidOut)}</span>
            <span class="stat-label">{t.paidOut[$lang]}</span>
          </div>
          <div class="stat">
            <span class="stat-num text-barbi">₪{fmt(coverage.availableForFuture)}</span>
            <span class="stat-label">{t.availableForFuture[$lang]}</span>
          </div>
        </div>

        <!-- income sources -->
        {#if coverage.incomeTotal > 0}
          <div class="mt-8">
            <h3 class="text-sm uppercase tracking-widest text-white/50 mb-3">
              {t.incomeBreakdown[$lang]}
            </h3>
            <div class="flex flex-wrap gap-2">
              <span class="chip chip-gold">💗 {t.srcDonations[$lang]} · ₪{fmt(coverage.donationIncome)}</span>
              <span class="chip chip-pink">🎁 {t.srcProducts[$lang]} · ₪{fmt(coverage.productIncome)}</span>
              {#if coverage.otherIncome > 0}
                <span class="chip">✨ {t.srcOther[$lang]} · ₪{fmt(coverage.otherIncome)}</span>
              {/if}
            </div>
          </div>
        {/if}
      </section>

      <!-- ═══════════ 3. MISSIONS ═══════════ -->
      <section id="missions" class="mb-14 scroll-mt-8">
        <h2 class="text-2xl sm:text-3xl font-bold mb-1 text-barbi">
          {t.missionsTitle[$lang]}
        </h2>
        <p class="text-white/60 mb-6 max-w-2xl">{t.missionsSub[$lang]}</p>

        {#if openMissions.length > 0}
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {#each openMissions as om (om.id)}
              {@const st = missionStatusById.get(String(om.id))}
              {@const assigned = st?.assigned}
              <div class="glass rounded-2xl p-5 flex flex-col gap-3 mission-card" class:mission-funded={st?.funded}>
                <div class="flex justify-between items-start gap-2">
                  <h3 class="font-bold text-lg leading-snug">{om.attributes.name}</h3>
                  {#if assigned}
                    <span class="badge badge-muted">{t.inProgress[$lang]}</span>
                  {:else if st?.funded}
                    <span class="badge badge-funded">{t.funded[$lang]}</span>
                  {:else}
                    <span class="badge badge-waiting">{t.notFunded[$lang]}</span>
                  {/if}
                </div>

                {#if om.attributes.descrip}
                  <p class="text-white/60 text-sm line-clamp-3">{om.attributes.descrip}</p>
                {/if}

                <div class="flex flex-wrap items-center gap-2 text-sm text-white/70">
                  {#if om.attributes.noofhours}
                    <span>⏱ {fmt(om.attributes.noofhours)} {t.hours[$lang]}</span>
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
                    {t.iWillDoIt[$lang]}
                  </button>
                {/if}
              </div>
            {/each}
          </div>
        {:else}
          <div class="glass rounded-2xl p-8 text-center text-white/60">
            {t.noMissions[$lang]}
          </div>
        {/if}

        <p class="mt-4 text-sm">
          <a href="/project/{projectId}/join" class="text-barbi underline hover:text-white">
            {t.proposeYourOwn[$lang]}
          </a>
        </p>
      </section>

      <!-- ═══════════ 4. HOW TO SUPPORT ═══════════ -->
      <section id="donate" class="mb-14 scroll-mt-8">
        <h2 class="text-2xl sm:text-3xl font-bold text-gold mb-6">
          {t.donateTitle[$lang]}
        </h2>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div class="glass rounded-2xl p-6 border-t-4 border-t-gold">
            <div class="text-3xl mb-3">💗</div>
            <h3 class="font-bold text-lg mb-2">{t.donateMoney[$lang]}</h3>
            <p class="text-white/60 text-sm leading-relaxed">{t.donateMoneyDesc[$lang]}</p>
          </div>
          <div class="glass rounded-2xl p-6 border-t-4 border-t-barbi">
            <div class="text-3xl mb-3">🎁</div>
            <h3 class="font-bold text-lg mb-2">{t.donateBuy[$lang]}</h3>
            <p class="text-white/60 text-sm leading-relaxed mb-3">{t.donateBuyDesc[$lang]}</p>
            {#if products.length > 0}
              <a href="#products" class="text-gold text-sm underline hover:text-white">{t.toProducts[$lang]}</a>
            {/if}
          </div>
          <div class="glass rounded-2xl p-6 border-t-4 border-t-white/40">
            <div class="text-3xl mb-3">🤝</div>
            <h3 class="font-bold text-lg mb-2">{t.donateTime[$lang]}</h3>
            <p class="text-white/60 text-sm leading-relaxed mb-3">{t.donateTimeDesc[$lang]}</p>
            <a href="#missions" class="text-gold text-sm underline hover:text-white">{t.toMissions[$lang]}</a>
          </div>
        </div>
      </section>

      <!-- ═══════════ 5. PRODUCTS ═══════════ -->
      {#if products.length > 0}
        <section id="products" class="mb-14 scroll-mt-8">
          <h2 class="text-2xl sm:text-3xl font-bold text-barbi mb-1">
            {t.productsTitle[$lang]}
          </h2>
          <p class="text-white/60 mb-6 max-w-2xl">{t.productsSub[$lang]}</p>
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
                    {t.productLink[$lang]}
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
            {t.supportersTitle[$lang]}
          </h2>
          <div class="flex flex-wrap gap-3">
            {#each coverage.supporters as s, i (i)}
              <div class="glass rounded-xl px-4 py-3 min-w-[10rem]">
                <p class="font-semibold">{s.name || t.anonymous[$lang]}</p>
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
          <h2 class="text-2xl font-bold text-white mb-4">{t.aboutTitle[$lang]}</h2>
          <div class="text-white/80 leading-relaxed">
            <RichText editable={false} outpot={attrs.publicDescription} />
          </div>
        </section>
      {/if}

      <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-14">
        {#if vallues.length > 0}
          <section class="glass rounded-2xl p-6">
            <h2 class="text-xl font-bold text-gold mb-4">✨ {t.valuesTitle[$lang]}</h2>
            <div class="flex flex-wrap gap-2">
              {#each vallues as v (v)}
                <span class="chip chip-gold">{v}</span>
              {/each}
            </div>
          </section>
        {/if}

        {#if team.length > 0}
          <section class="glass rounded-2xl p-6">
            <h2 class="text-xl font-bold text-barbi mb-4">{t.teamTitle[$lang]}</h2>
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
          {t.joinTitle[$lang]}
        </h2>
        <p class="text-white/70 max-w-lg mx-auto mb-6">{t.joinDesc[$lang]}</p>
        <div class="flex flex-wrap justify-center gap-3">
          {#if !isRegisteredUser}
            <a href="/" class="btn-primary">{t.joinBtn[$lang]}</a>
          {/if}
          <a href="/project/{projectId}" class="btn-ghost">{t.toFullPage[$lang]}</a>
        </div>
      </section>

      <footer class="text-center text-white/40 text-sm">
        {t.poweredBy[$lang]}
        <a href="/" class="text-gold hover:text-white font-semibold">1💗1</a>
      </footer>
    </div>
  </div>
{:else}
  <div class="support-page h-screen w-screen flex items-center justify-center">
    <RingLoader size="200" color="#ff00ae" unit="px" duration="2s"></RingLoader>
  </div>
{/if}

<style>
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
