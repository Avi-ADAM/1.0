<script>
  import { onMount, onDestroy } from 'svelte';
  import { showFoot } from '$lib/stores/showFoot.js';
  import { goto } from '$app/navigation';
  import { uPic } from '$lib/stores/uPic.js';
  import { t } from '$lib/translations';

  /** @type {{ data: { mine: any[]; publicFeed: any[]; queryOk: { mine: boolean; public: boolean }; uid?: string; un?: string } }} */
  let { data } = $props();

  onMount(() => showFoot.set(false));
  onDestroy(() => showFoot.set(true));

  function getUserInitials(name) {
    if (!name) return 'מש';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) {
      return parts[0].slice(0, 2);
    }
    return (parts[0]?.[0] || '') + (parts[1]?.[0] || '');
  }

  /* ===== Format helpers ===== */
  const HE_MONTHS = [
    'ינו',
    'פבר',
    'מרץ',
    'אפר',
    'מאי',
    'יוני',
    'יולי',
    'אוג',
    'ספט',
    'אוק',
    'נוב',
    'דצמ'
  ];
  function fmtDate(iso) {
    if (!iso) return 'בלי תאריך';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return 'בלי תאריך';
    return `${d.getDate()} ב${HE_MONTHS[d.getMonth()]}`;
  }
  function fmtBudget(n) {
    if (n == null || !Number.isFinite(+n)) return 'לפי הצעה';
    return `₪ ${(+n).toLocaleString('he-IL')}`;
  }
  function relativeTime(iso) {
    if (!iso) return '';
    const d = new Date(iso).getTime();
    if (!d) return '';
    const diff = (Date.now() - d) / 1000;
    if (diff < 60) return 'הרגע';
    if (diff < 3600) return `לפני ${Math.round(diff / 60)}ד׳`;
    if (diff < 86400) return `לפני ${Math.round(diff / 3600)} שעות`;
    if (diff < 604800) return `לפני ${Math.round(diff / 86400)} ימים`;
    return `לפני ${Math.round(diff / 604800)} שבועות`;
  }
  function coveredFromScore(score) {
    if (typeof score !== 'number') return 0;
    return Math.max(0, Math.min(100, Math.round(score * 100)));
  }
  function eventFromStatus(status, hasProposals) {
    if (status === 'fulfilled') return 'המשאלה הוגשמה';
    if (status === 'negotiating')
      return hasProposals ? 'יש הצעות בתהליך הסכמה' : 'בהסכמה';
    if (status === 'matching') return 'Lev מחפשת התאמות';
    if (status === 'open')
      return hasProposals ? 'יש הצעות חדשות' : 'פורסמה לקהילה';
    if (status === 'draft') return 'טיוטה — לא פורסמה';
    if (status === 'expired') return 'פג תוקף המשאלה';
    if (status === 'cancelled') return 'המשאלה בוטלה';
    return 'פעילה';
  }

  /* ===== Bridge server cards → display cards ===== */
  function toMineCard(c) {
    return {
      id: c.id,
      code: c.code,
      title: c.name,
      excerpt: c.excerpt,
      status: c.status,
      coveredPct: coveredFromScore(c.fulfillmentScore),
      proposalsCount: c.proposalsCount || 0,
      missionsCount: c.missionsCount || 0,
      resourcesCount: c.resourcesCount || 0,
      lastEvent: eventFromStatus(c.status, (c.proposalsCount || 0) > 0),
      lastEventTime: relativeTime(c.createdAt),
      budget: fmtBudget(c.totalBounti),
      whenStr: fmtDate(c.startDate),
      values: c.values || [],
      pinkAccent: c.status === 'negotiating'
    };
  }
  function toPublicCard(c) {
    return {
      id: c.id,
      code: c.code,
      author: c.authorName,
      avatar: c.authorAvatar,
      title: c.name,
      excerpt: c.excerpt,
      whenStr: fmtDate(c.startDate),
      budget: fmtBudget(c.totalBounti),
      values: c.values || [],
      proposalsCount: c.proposalsCount || 0,
      tags: c.categories || [],
      distanceKm: null
    };
  }

  /* ===== Mock fallback (used when server query empty / fails) ===== */
  const MOCK_MINE = [
    {
      id: 'demo-wish-id',
      code: 'R-7f3a91',
      title: 'יום חופש לאמא ליום הולדתה',
      excerpt:
        'אמא שלי מטפלת בילדים כל יום ובקרוב יום הולדתה. אני רוצה לתת לה יום שלם משוחרר…',
      status: 'negotiating',
      coveredPct: 75,
      proposalsCount: 6,
      missionsCount: 4,
      resourcesCount: 3,
      lastEvent: 'תמר ל. אישרה את הצעת ההשגחה',
      lastEventTime: 'לפני 15ד׳',
      budget: '₪ 850–1,200',
      whenStr: 'ה׳, 19 ביוני',
      values: ['הדדיות', 'נדיבות'],
      pinkAccent: true
    },
    {
      id: 'wish-2',
      code: 'R-2c9d44',
      title: 'מישהו שיעזור לי להוביל ארון מהדרך',
      excerpt:
        'יש לי ארון בגדים גדול וכבד שצריך לעלות לקומה שלישית בלי מעלית. צריך 2 ידיים חזקות לשעה.',
      status: 'matching',
      coveredPct: 33,
      proposalsCount: 2,
      missionsCount: 1,
      resourcesCount: 2,
      lastEvent: 'Lev מצאה 2 התאמות מ־1 ריקמה',
      lastEventTime: 'לפני 4 שעות',
      budget: '₪ 80–150',
      whenStr: 'שבוע הקרוב',
      values: ['קהילתיות']
    },
    {
      id: 'wish-3',
      code: 'R-91ef02',
      title: 'סדנת יצירה לכיתה של בני',
      excerpt:
        'מורה לאמנות שתעביר סדנה של שעתיים לכיתה ב׳, נושא חופשי, כל הציוד בידינו.',
      status: 'open',
      coveredPct: 0,
      proposalsCount: 0,
      missionsCount: 1,
      resourcesCount: 0,
      lastEvent: 'פורסמה לקהילה',
      lastEventTime: 'לפני 2 ימים',
      budget: '₪ 400',
      whenStr: 'תוך חודש',
      values: ['יצירתיות', 'קהילתיות']
    }
  ];

  const MOCK_PUBLIC = [
    {
      id: 'pub-1',
      code: 'R-44a1b0',
      author: 'מ.כ.',
      avatar: 'מכ',
      title: 'תיקון אופניים חשמליים',
      excerpt:
        'הסוללה מתפרקת אחרי 8 ק״מ. שמעתי שאפשר לשפץ אותה במקום לקנות חדשה — מחפש מישהו שיודע.',
      whenStr: 'גמיש',
      budget: '₪ 250–600',
      values: ['קיימות', 'אקולוגיה'],
      proposalsCount: 1,
      tags: ['תיקון', 'אופניים'],
      distanceKm: 4.2
    },
    {
      id: 'pub-2',
      code: 'R-c812d1',
      author: 'ת.ש.',
      avatar: 'תש',
      title: 'ליווי לבית הקברות ביום השנה',
      excerpt:
        'אני זקנה וקשה לי לבד. אשמח שמישהי תיסע איתי לחיפה לבית הקברות, נדבר על אמא בדרך.',
      whenStr: 'ראשון, 22 ביוני',
      budget: 'תרומה לפי לב',
      values: ['הדדיות', 'נדיבות'],
      proposalsCount: 3,
      tags: ['ליווי', 'נוכחות'],
      distanceKm: 1.1
    },
    {
      id: 'pub-3',
      code: 'R-7e3014',
      author: 'נ.פ.',
      avatar: 'נפ',
      title: 'בישול שבת לעובדי קו ראשון',
      excerpt:
        'מארגנים בכל שבוע 40 מנות חמות לצוות בית חולים. מחפשים מטבחים שיתפסו בכל פעם שורה אחת מהתפריט.',
      whenStr: 'שבועי',
      budget: 'מומן על־ידי קרן',
      values: ['קהילתיות', 'נדיבות'],
      proposalsCount: 7,
      tags: ['בישול', 'התנדבות'],
      distanceKm: 12.4
    },
    {
      id: 'pub-4',
      code: 'R-5a8b09',
      author: 'י.מ.',
      avatar: 'ימ',
      title: 'מסיבת יום הולדת לבן 8',
      excerpt:
        'רוצה משהו שאני לא יודעת לעשות לבד — קוסם, סדנת יצירה, מישהו שיהיה כיף עם 12 ילדים בחצר.',
      whenStr: 'שישי, 14 ביוני',
      budget: '₪ 600–900',
      values: ['יצירתיות', 'משפחתיות'],
      proposalsCount: 2,
      tags: ['ילדים', 'אירוע'],
      distanceKm: 7.8
    }
  ];

  /* ===== Resolved lists: real data when present, mock otherwise ===== */
  const MY_WISHES = $derived(
    data?.mine?.length ? data.mine.map(toMineCard) : MOCK_MINE
  );
  const PUBLIC_FEED = $derived(
    data?.publicFeed?.length ? data.publicFeed.map(toPublicCard) : MOCK_PUBLIC
  );

  const STATUS_META = {
    draft: { label: 'טיוטה', color: '#9a8f80', dot: 'rgba(154,143,128,0.6)' },
    open: { label: 'פתוחה', color: '#fde68a', dot: '#fde68a' },
    matching: { label: 'מחפשת התאמות', color: '#74bfff', dot: '#74bfff' },
    negotiating: { label: 'בהסכמה', color: '#ff4d9e', dot: '#ff4d9e' },
    fulfilled: { label: 'הוגשמה', color: '#02ffbb', dot: '#02ffbb' },
    expired: { label: 'פגה', color: '#52493e', dot: 'rgba(82,73,62,0.6)' },
    cancelled: { label: 'בוטלה', color: '#52493e', dot: 'rgba(82,73,62,0.6)' }
  };

  const TABS = $derived([
    {
      id: 'mine',
      label: $t('concierge.my_wishes_tab'),
      count: MY_WISHES.length
    },
    {
      id: 'browse',
      label: $t('concierge.community_tab'),
      count: PUBLIC_FEED.length
    },
    { id: 'drafts', label: $t('concierge.drafts_tab'), count: 0 }
  ]);

  let activeTab = $state('mine');
  let searchQ = $state('');

  const filteredMine = $derived(
    searchQ.trim()
      ? MY_WISHES.filter((w) =>
          (w.title + w.excerpt).toLowerCase().includes(searchQ.toLowerCase())
        )
      : MY_WISHES
  );
  const filteredPublic = $derived(
    searchQ.trim()
      ? PUBLIC_FEED.filter((w) =>
          (w.title + w.excerpt).toLowerCase().includes(searchQ.toLowerCase())
        )
      : PUBLIC_FEED
  );

  /* ===== Aggregate stats for the rail ===== */
  const stats = $derived({
    open: MY_WISHES.filter(
      (w) =>
        w.status !== 'fulfilled' &&
        w.status !== 'cancelled' &&
        w.status !== 'expired'
    ).length,
    fulfilled: MY_WISHES.filter((w) => w.status === 'fulfilled').length,
    proposalsTotal: MY_WISHES.reduce((s, w) => s + w.proposalsCount, 0),
    avgCovered: MY_WISHES.length
      ? Math.round(
          MY_WISHES.reduce((s, w) => s + w.coveredPct, 0) / MY_WISHES.length
        )
      : 0
  });

  const LEV_TIPS = [
    {
      icon: '✶',
      kind: 'suggestion',
      text: 'משאלה אחת ממתינה להחלטה — יום חופש לאמא. נותרה שורה אחת פתוחה.'
    },
    {
      icon: '?',
      kind: 'question',
      text: 'האם לחפש שותפויות נוספות לבישול שבת? יש 3 ריקמות חדשות בקרבת מקום.'
    },
    {
      icon: '✦',
      kind: 'suggestion',
      text: 'ניתן לפרסם כעת את "סדנת יצירה" לקהילה — מורות אמנות פעילות באזור.'
    }
  ];

  const SAMPLE_SEEDS = $derived([
    { icon: '🎁', label: $t('concierge.seed_gift') },
    { icon: '🛠', label: $t('concierge.seed_task_hard') },
    {
      icon: '🌿',
      label:
        $t('concierge.seed_seed_community_event') ||
        $t('concierge.seed_community_event')
    },
    { icon: '✍', label: $t('concierge.seed_free_wish') }
  ]);

  function statusColor(s) {
    return STATUS_META[s]?.color || '#9a8f80';
  }
  function statusDot(s) {
    return STATUS_META[s]?.dot || 'rgba(154,143,128,0.6)';
  }
  function statusLabel(s) {
    return STATUS_META[s]?.label || s;
  }

  function openWish(id) {
    goto(`/concierge/${id}`);
  }
  function newWish() {
    goto('/concierge/new');
  }
</script>

<!-- ===================================================================
     CONCIERGE HUB — wishes home + browse (M2)
     =================================================================== -->
<svelte:head>
  <title>{$t('concierge.title')}</title>
</svelte:head>

<!-- ── HEADER ─────────────────────────────────────────────────────── -->
<div class="cp">
  <header class="hdr">
    <div class="hdr-logo">
      <img src="/logo-concierge.png" class="hdr-coin" alt="Concierge" />
      <div class="hdr-brand">
        <span class="hdr-dot"></span>
        <span class="hdr-name">Concierge</span>
        <span class="hdr-sub hide-xs"
          >· {$t('concierge.personal_concierge')}</span
        >
      </div>
    </div>
    <nav class="hdr-nav hide-sm">
      <a href="/lev" class="nav-lnk">{$t('concierge.my_overview')}</a>
      <a href="/concierge" class="nav-lnk nav-act">{$t('concierge.wishes')}</a>
      <a href="/deals" class="nav-lnk">{$t('concierge.deals')}</a>
      <a href="/moach" class="nav-lnk">{$t('concierge.moach')}</a>
    </nav>
    <div class="hdr-right">
      <button class="notif-btn" aria-label={$t('concierge.notifications')}
        >🔔<span class="notif-pip"></span></button
      >
      <button class="av-btn" onclick={() => goto('/me')}>
        {#if $uPic}
          <img src={$uPic} alt="פרופיל" class="av-img" />
        {:else}
          {getUserInitials(data?.un)}
        {/if}
      </button>
    </div>
  </header>

  <!-- ── SHELL ──────────────────────────────────────────────────────── -->
  <div class="shell">
    <div class="wrap">
      <!-- HERO BANNER -->
      <div class="hero anim anim-d1">
        <span class="corner corner-tl"></span>
        <span class="corner corner-tr"></span>
        <span class="corner corner-bl"></span>
        <span class="corner corner-br"></span>

        <div class="hero-grid">
          <div class="hero-left">
            <div class="hero-eyebrow">{$t('concierge.personal_concierge')}</div>
            <h1 class="hero-title">{$t('concierge.hero_title')}</h1>
            <p class="hero-sub">
              {$t('concierge.hero_sub')}<br />
              <span class="hero-warm">{$t('concierge.privacy_warm')}</span>
            </p>

            <div class="hero-ctas">
              <button class="btn-jewel" onclick={newWish}
                >{$t('concierge.new_wish_btn')}</button
              >
              <a
                href="#browse"
                class="btn-ghost"
                onclick={() => (activeTab = 'browse')}
                >{$t('concierge.browse_btn')}</a
              >
            </div>

            <div class="seed-row">
              {#each SAMPLE_SEEDS as seed (seed.label)}
                <button class="seed-mini" onclick={newWish}>
                  <span class="seed-mini-icon">{seed.icon}</span>
                  <span>{seed.label}</span>
                </button>
              {/each}
            </div>
          </div>

          <!-- Mini stats column -->
          <div class="hero-right">
            <div class="stat-tile">
              <div class="stat-num">{stats.open}</div>
              <div class="stat-lbl">{$t('concierge.active_wishes')}</div>
            </div>
            <div class="stat-tile">
              <div class="stat-num" style="color:#74bfff">
                {stats.proposalsTotal}
              </div>
              <div class="stat-lbl">{$t('concierge.proposals_received')}</div>
            </div>
            <div class="stat-tile">
              <div class="stat-num" style="color:#02ffbb">
                {stats.avgCovered}<span class="stat-pct">%</span>
              </div>
              <div class="stat-lbl">{$t('concierge.average_coverage')}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- TOP TOOLBAR: tabs + search -->
      <div class="toolbar anim anim-d2">
        <div class="tabs">
          {#each TABS as t (t.id)}
            <button
              class="tab {activeTab === t.id ? 'active' : ''}"
              onclick={() => (activeTab = t.id)}
            >
              {t.label}
              {#if t.count > 0}<span class="tab-pip">{t.count}</span>{/if}
            </button>
          {/each}
        </div>
        <div class="search-wrap">
          <span class="search-icon">⌕</span>
          <input
            type="text"
            bind:value={searchQ}
            placeholder={activeTab === 'mine'
              ? $t('concierge.search_mine_placeholder')
              : $t('concierge.search_community_placeholder')}
            class="search-inp"
          />
        </div>
      </div>

      <!-- MAIN LAYOUT -->
      <div class="layout">
        <!-- ── MAIN COLUMN ── -->
        <main>
          {#if activeTab === 'mine'}
            <div class="section-label">
              <span class="lead"
                ><span class="gem"></span>{$t('concierge.my_wishes_label')} · {filteredMine.length}</span
              >
            </div>

            {#if filteredMine.length === 0}
              <div class="empty">
                <div class="empty-icon">✶</div>
                <div class="empty-title">
                  {$t('concierge.no_search_results')}
                </div>
                <div class="empty-sub">{$t('concierge.try_another_word')}</div>
                <button
                  class="btn-jewel"
                  style="margin-top:14px"
                  onclick={newWish}>{$t('concierge.new_wish_btn')}</button
                >
              </div>
            {:else}
              <div class="wish-grid">
                {#each filteredMine as w, i (w.id)}
                  <button
                    class="wish-card {w.pinkAccent ? 'wish-card-glow' : ''}"
                    onclick={() => openWish(w.id)}
                    style="animation-delay:{(i + 3) * 0.06}s"
                  >
                    <div class="wc-top">
                      <span
                        class="wc-status"
                        style="color:{statusColor(w.status)}"
                      >
                        <span
                          class="wc-status-dot"
                          style="background:{statusDot(
                            w.status
                          )};box-shadow:0 0 8px {statusDot(w.status)}"
                        ></span>
                        {statusLabel(w.status)}
                      </span>
                      <code class="wc-code">{w.code}</code>
                    </div>

                    <div class="wc-title">{w.title}</div>
                    <div class="wc-excerpt">{w.excerpt}</div>

                    <div class="wc-meta">
                      <span class="metai-sm">📅 <span>{w.whenStr}</span></span>
                      <span class="metai-sm">💰 <span>{w.budget}</span></span>
                    </div>

                    {#if w.values?.length}
                      <div class="wc-values">
                        {#each w.values as v (v)}
                          <span class="val-pill-mini">{v}</span>
                        {/each}
                      </div>
                    {/if}

                    <div class="wc-cov">
                      <div class="cov-track-sm">
                        <div
                          class="cov-fill-sm"
                          style="width:{w.coveredPct}%"
                        ></div>
                      </div>
                      <div class="cov-row">
                        <span
                          class="cov-pct"
                          style="color:{w.coveredPct === 100
                            ? '#02ffbb'
                            : w.coveredPct > 0
                              ? '#fde68a'
                              : '#52493e'}"
                          >{w.coveredPct}% {$t('concierge.composed')}</span
                        >
                        <span class="cov-counts">
                          <span class="ct-num">{w.proposalsCount}</span>
                          <span class="ct-lbl">{$t('concierge.offers')}</span>
                          <span class="ct-sep">·</span>
                          <span class="ct-num">{w.missionsCount}</span>
                          <span class="ct-lbl">{$t('concierge.missions')}</span>
                          {#if w.resourcesCount > 0}
                            <span class="ct-sep">·</span>
                            <span class="ct-num">{w.resourcesCount}</span>
                            <span class="ct-lbl"
                              >{$t('concierge.resources')}</span
                            >
                          {/if}
                        </span>
                      </div>
                    </div>

                    <div class="wc-bottom">
                      <div class="wc-event">
                        <span class="gem gem-gold" style="width:5px;height:5px"
                        ></span>
                        <span class="wc-event-text">{w.lastEvent}</span>
                      </div>
                      <span class="wc-event-time">{w.lastEventTime}</span>
                    </div>
                  </button>
                {/each}

                <!-- "Create new" placeholder card -->
                <button class="wish-card wish-card-new" onclick={newWish}>
                  <div class="new-icon">✦</div>
                  <div class="new-title">
                    {$t('concierge.new_wish_card_title')}
                  </div>
                  <div class="new-sub">{$t('concierge.new_wish_card_sub')}</div>
                </button>
              </div>
            {/if}
          {/if}

          {#if activeTab === 'browse'}
            <div class="section-label" id="browse">
              <span class="lead"
                ><span class="gem gem-gold"></span>{$t(
                  'concierge.community_wishes_label'
                )} · {filteredPublic.length}</span
              >
            </div>

            <div class="filter-strip">
              {#each [{ key: 'all', label: $t('concierge.filters_all') }, { key: 'near', label: $t('concierge.filters_near_me') }, { key: 'skills', label: $t('concierge.filters_my_skills') }, { key: 'urgent', label: $t('concierge.filters_urgent') }] as f, i (f.key)}
                <button class="filter-pill {i === 0 ? 'on' : ''}"
                  >{f.label}</button
                >
              {/each}
            </div>

            {#if filteredPublic.length === 0}
              <div class="empty">
                <div class="empty-icon">✶</div>
                <div class="empty-title">
                  {$t('concierge.no_wishes_found_title')}
                </div>
                <div class="empty-sub">{$t('concierge.clear_filter_sub')}</div>
              </div>
            {:else}
              <div class="wish-grid">
                {#each filteredPublic as w, i (w.id)}
                  <button
                    class="wish-card wish-card-public"
                    onclick={() => goto(`/wish/${w.id}`)}
                    style="animation-delay:{(i + 3) * 0.06}s"
                  >
                    <div class="wc-top">
                      <div class="wc-author">
                        <div class="disc-tiny">{w.avatar}</div>
                        <div class="wc-author-meta">
                          <div class="wc-author-name">{w.author}</div>
                          <div class="wc-author-dist">
                            {w.distanceKm != null
                              ? $t('concierge.km_away', {
                                  distance: w.distanceKm
                                })
                              : $t('concierge.location_not_specified')}
                          </div>
                        </div>
                      </div>
                      <code class="wc-code">{w.code}</code>
                    </div>

                    <div class="wc-title">{w.title}</div>
                    <div class="wc-excerpt">{w.excerpt}</div>

                    <div class="wc-meta">
                      <span class="metai-sm">📅 <span>{w.whenStr}</span></span>
                      <span class="metai-sm">💰 <span>{w.budget}</span></span>
                    </div>

                    {#if w.tags?.length}
                      <div class="wc-values">
                        {#each w.tags as t (t)}
                          <span class="val-pill-mini tag">#{t}</span>
                        {/each}
                      </div>
                    {/if}

                    <div
                      class="wc-bottom"
                      style="border-top:1px solid rgba(238,232,170,.1);padding-top:12px;margin-top:14px"
                    >
                      <div class="wc-event">
                        <span class="gem gem-blue" style="width:5px;height:5px"
                        ></span>
                        <span class="wc-event-text"
                          >{$t('concierge.proposals_so_far', {
                            count: w.proposalsCount
                          })}</span
                        >
                      </div>
                      <span class="offer-link"
                        >{$t('concierge.i_can_help')}</span
                      >
                    </div>
                  </button>
                {/each}
              </div>
            {/if}
          {/if}

          {#if activeTab === 'drafts'}
            <div class="section-label">
              <span class="lead"
                ><span class="gem"></span>{$t('concierge.drafts_label')} · 0</span
              >
            </div>
            <div class="empty">
              <div class="empty-icon">✎</div>
              <div class="empty-title">{$t('concierge.no_drafts_title')}</div>
              <div class="empty-sub">{$t('concierge.no_drafts_sub')}</div>
              <button
                class="btn-jewel"
                style="margin-top:14px"
                onclick={newWish}>{$t('concierge.start_wish_btn')}</button
              >
            </div>
          {/if}
        </main>

        <!-- ── RIGHT RAIL ── -->
        <aside class="rail">
          <!-- Lev assistant card -->
          <div class="panel lev-panel">
            <div class="lev-hdr">
              <div class="lev-av-wrap">
                <img src="/botlogo.jpeg" alt="Lev" class="lev-av" />
                <span class="lev-online"></span>
              </div>
              <div>
                <div class="lev-title-tiny">
                  {$t('concierge.lev_agent_title')}
                </div>
                <div class="lev-sub-tiny">{$t('concierge.lev_agent_sub')}</div>
              </div>
            </div>

            <div class="lev-tips">
              {#each LEV_TIPS as tip (tip.text)}
                <div class="lev-tip {tip.kind}">
                  <span class="lev-tip-icon">{tip.icon}</span>
                  <div class="lev-tip-text">{tip.text}</div>
                </div>
              {/each}
            </div>
          </div>

          <!-- Stats panel -->
          <div class="panel">
            <h4>{$t('concierge.quick_look_title')}</h4>
            <div class="kpis">
              <div class="kpi-row">
                <span class="kpi-lbl">{$t('concierge.active_wishes')}</span>
                <span class="kpi-val" style="color:#fde68a">{stats.open}</span>
              </div>
              <div class="kpi-row">
                <span class="kpi-lbl">{$t('concierge.stat_fulfilled')}</span>
                <span class="kpi-val" style="color:#02ffbb"
                  >{stats.fulfilled}</span
                >
              </div>
              <div class="kpi-row">
                <span class="kpi-lbl">{$t('concierge.stat_proposals')}</span>
                <span class="kpi-val" style="color:#74bfff"
                  >{stats.proposalsTotal}</span
                >
              </div>
              <div class="kpi-row" style="border-bottom:none">
                <span class="kpi-lbl">{$t('concierge.average_coverage')}</span>
                <span class="kpi-val" style="color:#ff4d9e"
                  >{stats.avgCovered}%</span
                >
              </div>
            </div>
          </div>

          <!-- Privacy strip -->
          <div class="privacy">
            <span style="font-size:14px">🔒</span>
            <div>
              <div class="privacy-title">
                {$t('concierge.privacy_default_title')}
              </div>
              <div class="privacy-sub">
                {$t('concierge.privacy_default_sub')}
              </div>
            </div>
          </div>

          <!-- Quick links -->
          <div class="panel">
            <h4>{$t('concierge.quick_links_title')}</h4>
            <div class="quick">
              <a href="/lev" class="quick-link"
                ><span>💗</span><span>{$t('concierge.my_overview_link')}</span
                ></a
              >
              <a href="/deals" class="quick-link"
                ><span>🤝</span><span>{$t('concierge.active_deals_link')}</span
                ></a
              >
              <a href="/moach" class="quick-link"
                ><span>🧠</span><span>{$t('concierge.my_moach_link')}</span></a
              >
            </div>
          </div>
        </aside>
      </div>
      <!-- /layout -->
    </div>
    <!-- /wrap -->
  </div>
  <!-- /shell -->
</div>

<!-- /cp -->

<style>
  @import url('https://fonts.googleapis.com/css2?family=Bellefair&family=Cinzel:wght@400;600;700&family=Heebo:wght@300;400;500;600;700;800&display=swap');

  /* ── Page shell ── */
  .cp {
    background: #070606;
    color: #ede5d8;
    font-family: 'Heebo', 'Rubik', system-ui, sans-serif;
    min-height: 100vh;
    position: relative;
  }
  .cp::before {
    content: '';
    position: fixed;
    inset: 0;
    z-index: 0;
    pointer-events: none;
    background:
      radial-gradient(
        ellipse 70% 50% at 10% -10%,
        rgba(200, 150, 12, 0.1) 0%,
        transparent 55%
      ),
      radial-gradient(
        ellipse 60% 65% at 90% 110%,
        rgba(200, 21, 95, 0.09) 0%,
        transparent 55%
      ),
      radial-gradient(
        ellipse 50% 40% at 50% 50%,
        rgba(2, 255, 187, 0.035) 0%,
        transparent 60%
      );
  }
  .shell {
    position: relative;
    z-index: 1;
    min-height: 100vh;
    padding: 18px 0 80px;
  }
  .wrap {
    max-width: 1280px;
    margin: 0 auto;
    padding: 0 14px;
  }
  @media (min-width: 640px) {
    .wrap {
      padding: 0 22px;
    }
  }
  @media (min-width: 1024px) {
    .wrap {
      padding: 0 28px;
    }
  }

  /* ── Responsive helpers ── */
  @media (max-width: 479px) {
    .hide-xs {
      display: none !important;
    }
  }
  @media (max-width: 767px) {
    .hide-sm {
      display: none !important;
    }
  }

  /* ── Animations ── */
  @keyframes fadeUp {
    from {
      opacity: 0;
      transform: translateY(16px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  @keyframes heroGlow {
    0%,
    100% {
      box-shadow:
        0 0 0 1px rgba(238, 232, 170, 0.25) inset,
        0 0 30px rgba(238, 232, 170, 0.1),
        0 0 80px rgba(200, 21, 95, 0.12);
    }
    50% {
      box-shadow:
        0 0 0 1px rgba(238, 232, 170, 0.42) inset,
        0 0 44px rgba(238, 232, 170, 0.2),
        0 0 120px rgba(200, 21, 95, 0.2);
    }
  }
  .anim {
    animation: fadeUp 0.45s cubic-bezier(0.16, 1, 0.3, 1) both;
  }
  .anim-d1 {
    animation-delay: 0.05s;
  }
  .anim-d2 {
    animation-delay: 0.12s;
  }
  .anim-d3 {
    animation-delay: 0.2s;
  }

  /* ── Header ── */
  .hdr {
    position: sticky;
    top: 0;
    z-index: 100;
    background: rgba(7, 6, 6, 0.84);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border-bottom: 1px solid rgba(200, 150, 12, 0.2);
    padding: 0 14px;
    height: 60px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
  }
  @media (min-width: 640px) {
    .hdr {
      padding: 0 24px;
      height: 64px;
    }
  }
  .hdr-logo {
    display: flex;
    align-items: center;
    gap: 10px;
    flex-shrink: 0;
  }
  .hdr-coin {
    width: 28px;
    height: 28px;
    border-radius: 50%;
    box-shadow: 0 0 14px rgba(238, 232, 170, 0.4);
  }
  .hdr-brand {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .hdr-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: #02ffbb;
    box-shadow: 0 0 10px #02ffbb;
  }
  .hdr-name {
    font-family: 'Cinzel', serif;
    font-size: clamp(13px, 3vw, 18px);
    color: #f0c040;
    letter-spacing: 0.22em;
    text-transform: uppercase;
  }
  .hdr-sub {
    font-family: 'Bellefair', serif;
    font-size: 13px;
    color: #9a8f80;
  }
  .hdr-nav {
    display: flex;
    gap: 20px;
    align-items: center;
  }
  .nav-lnk {
    font-size: 13px;
    color: #9a8f80;
    text-decoration: none;
    letter-spacing: 0.02em;
    transition: color 0.2s;
  }
  .nav-lnk:hover {
    color: #ede5d8;
  }
  .nav-act {
    color: #fde68a;
    text-shadow: 0 0 12px rgba(238, 232, 170, 0.4);
  }
  .hdr-right {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-shrink: 0;
  }
  .notif-btn {
    position: relative;
    width: 34px;
    height: 34px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 10px;
    background: #171512;
    border: 1px solid rgba(255, 255, 255, 0.06);
    cursor: pointer;
    font-size: 14px;
    color: #fde68a;
  }
  .notif-pip {
    position: absolute;
    top: 6px;
    left: 6px;
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: #ff4d9e;
    box-shadow: 0 0 8px #ff4d9e;
  }
  .av-btn {
    width: 34px;
    height: 34px;
    border-radius: 50%;
    border: 2px solid #eee8aa;
    background: linear-gradient(135deg, #201d19, #2a2520);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 11px;
    font-weight: 700;
    color: #f0c040;
    cursor: pointer;
    overflow: hidden;
    padding: 0;
  }
  .av-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    border-radius: 50%;
  }

  /* ── Buttons ── */
  .btn-jewel {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 12px 22px;
    border: none;
    cursor: pointer;
    border-radius: 14px;
    font-family: 'Sababa', 'Heebo', sans-serif;
    font-weight: 700;
    font-size: 15px;
    color: #574010;
    white-space: nowrap;
    background: linear-gradient(
      135deg,
      #bf953f,
      #fcf6ba 30%,
      #b38728 60%,
      #aa771c
    );
    text-shadow: 1px 1px 0 rgba(255, 255, 255, 0.5);
    box-shadow:
      inset 1px 1px 0 rgba(255, 255, 255, 0.25),
      inset -1px -1px 0 rgba(0, 0, 0, 0.4),
      0 6px 20px rgba(200, 150, 12, 0.4);
    transition: transform 0.2s;
  }
  .btn-jewel:hover {
    transform: translateY(-1px);
  }
  .btn-ghost {
    background: transparent;
    border: 1px solid rgba(255, 255, 255, 0.1);
    color: #9a8f80;
    padding: 11px 18px;
    border-radius: 12px;
    font-size: 13px;
    cursor: pointer;
    transition: all 0.2s;
    text-decoration: none;
    display: inline-flex;
    align-items: center;
    white-space: nowrap;
  }
  .btn-ghost:hover {
    color: #ede5d8;
    border-color: rgba(238, 232, 170, 0.3);
    background: rgba(238, 232, 170, 0.04);
  }

  /* ── Gems ── */
  .gem {
    width: 8px;
    height: 8px;
    display: inline-block;
    background: linear-gradient(135deg, #ff4d9e, #c8155f);
    transform: rotate(45deg);
    box-shadow: 0 0 12px rgba(255, 77, 158, 0.7);
    flex-shrink: 0;
  }
  .gem-gold {
    background: linear-gradient(135deg, #fde68a, #aa771c);
    box-shadow: 0 0 12px rgba(238, 232, 170, 0.7);
  }
  .gem-blue {
    background: linear-gradient(135deg, #74bfff, #04619f);
    box-shadow: 0 0 12px rgba(116, 191, 255, 0.6);
  }

  /* ── Section label ── */
  .section-label {
    font-size: 11px;
    font-weight: 700;
    color: #9a8f80;
    letter-spacing: 0.24em;
    text-transform: uppercase;
    display: flex;
    align-items: center;
    gap: 14px;
    margin: 24px 0 14px;
  }
  .section-label::before,
  .section-label::after {
    content: '';
    flex: 1;
    height: 1px;
    background: linear-gradient(
      to right,
      transparent,
      rgba(255, 255, 255, 0.08),
      transparent
    );
  }
  .section-label .lead {
    flex: 0 0 auto;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  /* ── HERO ── */
  .hero {
    position: relative;
    margin-top: 14px;
    padding: 26px 20px;
    border: 1px solid rgba(238, 232, 170, 0.22);
    border-radius: 22px;
    background:
      linear-gradient(180deg, rgba(238, 232, 170, 0.04), rgba(7, 6, 6, 0) 30%),
      linear-gradient(135deg, rgba(255, 77, 158, 0.045), rgba(7, 6, 6, 0) 60%),
      #0e0d0c;
    animation:
      fadeUp 0.45s cubic-bezier(0.16, 1, 0.3, 1) both,
      heroGlow 5.5s ease-in-out 1s infinite;
  }
  @media (min-width: 640px) {
    .hero {
      padding: 36px 38px;
      border-radius: 26px;
    }
  }
  .corner {
    position: absolute;
    width: 14px;
    height: 14px;
    background: linear-gradient(135deg, #fde68a, #aa771c);
    transform: rotate(45deg);
    box-shadow: 0 0 14px rgba(238, 232, 170, 0.7);
    border-radius: 2px;
  }
  .corner-tl {
    top: -7px;
    inset-inline-start: 28px;
  }
  .corner-tr {
    top: -7px;
    inset-inline-end: 28px;
    background: linear-gradient(135deg, #ff4d9e, #c8155f);
    box-shadow: 0 0 14px rgba(255, 77, 158, 0.7);
  }
  .corner-bl {
    bottom: -7px;
    inset-inline-start: 28px;
    background: linear-gradient(135deg, #ff4d9e, #c8155f);
    box-shadow: 0 0 14px rgba(255, 77, 158, 0.7);
  }
  .corner-br {
    bottom: -7px;
    inset-inline-end: 28px;
  }

  .hero-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 24px;
    align-items: center;
  }
  @media (min-width: 900px) {
    .hero-grid {
      grid-template-columns: 1fr 240px;
      gap: 34px;
    }
  }

  .hero-eyebrow {
    font-family: 'Cinzel', serif;
    font-size: 11px;
    letter-spacing: 0.32em;
    text-transform: uppercase;
    color: #9a8f80;
    margin-bottom: 12px;
  }
  .hero-title {
    margin: 0;
    font-family: 'Sababa', 'Heebo', sans-serif;
    font-size: clamp(28px, 6vw, 44px);
    font-weight: 700;
    line-height: 1.1;
    color: #ede5d8;
  }
  .hero-sub {
    margin: 14px 0 0;
    font-family: 'Bellefair', serif;
    font-size: clamp(13px, 2vw, 16px);
    color: #9a8f80;
    line-height: 1.65;
    max-width: 540px;
  }
  .hero-warm {
    color: #fde68a;
  }

  .hero-ctas {
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
    margin-top: 22px;
  }

  .seed-row {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-top: 22px;
  }
  .seed-mini {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    padding: 6px 12px;
    background: rgba(255, 255, 255, 0.02);
    border: 1px solid rgba(255, 255, 255, 0.06);
    border-radius: 999px;
    font-family: 'Bellefair', serif;
    font-size: 12.5px;
    color: #c8bba8;
    cursor: pointer;
    transition: all 0.2s;
  }
  .seed-mini:hover {
    border-color: rgba(238, 232, 170, 0.3);
    background: rgba(238, 232, 170, 0.05);
    color: #fde68a;
    transform: translateY(-1px);
  }
  .seed-mini-icon {
    font-size: 13px;
  }

  .hero-right {
    display: flex;
    flex-direction: row;
    gap: 8px;
  }
  @media (min-width: 900px) {
    .hero-right {
      flex-direction: column;
    }
  }
  .stat-tile {
    flex: 1;
    padding: 14px 12px;
    border-radius: 14px;
    background: rgba(255, 255, 255, 0.02);
    border: 1px solid rgba(255, 255, 255, 0.06);
    text-align: center;
  }
  .stat-num {
    font-family: 'Cinzel', serif;
    font-size: clamp(22px, 5vw, 28px);
    font-weight: 700;
    color: #fde68a;
    line-height: 1;
  }
  .stat-pct {
    font-size: 14px;
    color: #9a8f80;
    margin-inline-start: 2px;
  }
  .stat-lbl {
    font-family: 'Bellefair', serif;
    font-size: 11px;
    color: #9a8f80;
    margin-top: 6px;
    line-height: 1.3;
  }

  /* ── Toolbar (tabs + search) ── */
  .toolbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 14px;
    margin-top: 22px;
    flex-wrap: wrap;
  }
  .tabs {
    display: flex;
    gap: 5px;
    background: rgba(255, 255, 255, 0.03);
    border: 1px solid rgba(255, 255, 255, 0.06);
    border-radius: 14px;
    padding: 4px;
    flex-wrap: wrap;
  }
  .tab {
    padding: 8px 14px;
    border-radius: 10px;
    font-size: 13px;
    font-weight: 600;
    color: #9a8f80;
    background: transparent;
    border: none;
    cursor: pointer;
    white-space: nowrap;
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }
  .tab.active {
    background: rgba(238, 232, 170, 0.1);
    color: #fde68a;
    box-shadow: inset 0 0 0 1px rgba(238, 232, 170, 0.25);
  }
  .tab-pip {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 18px;
    height: 18px;
    padding: 0 5px;
    font-size: 10px;
    border-radius: 999px;
    background: rgba(238, 232, 170, 0.12);
    color: #fde68a;
    font-weight: 700;
  }
  .tab.active .tab-pip {
    background: rgba(255, 77, 158, 0.18);
    color: #ff4d9e;
  }

  .search-wrap {
    position: relative;
    display: flex;
    align-items: center;
    flex: 1;
    max-width: 340px;
    min-width: 200px;
  }
  .search-icon {
    position: absolute;
    inset-inline-start: 12px;
    color: #52493e;
    font-size: 16px;
    pointer-events: none;
  }
  .search-inp {
    width: 100%;
    padding: 10px 14px 10px 36px;
    background: rgba(255, 255, 255, 0.02);
    border: 1px solid rgba(255, 255, 255, 0.08);
    color: #ede5d8;
    border-radius: 12px;
    font-family: 'Bellefair', serif;
    font-size: 13px;
    outline: none;
    transition: border-color 0.2s;
  }
  .search-inp:focus {
    border-color: rgba(238, 232, 170, 0.3);
  }
  .search-inp::placeholder {
    color: #52493e;
  }
  [dir='rtl'] .search-inp {
    padding: 10px 36px 10px 14px;
  }
  [dir='rtl'] .search-icon {
    inset-inline-start: auto;
    inset-inline-end: 12px;
  }

  /* ── Layout ── */
  .layout {
    display: grid;
    grid-template-columns: 1fr;
    gap: 24px;
    align-items: start;
    margin-top: 8px;
  }
  @media (min-width: 1080px) {
    .layout {
      grid-template-columns: 1fr 320px;
    }
  }

  /* ── Filter strip ── */
  .filter-strip {
    display: flex;
    gap: 6px;
    flex-wrap: wrap;
    margin-bottom: 14px;
  }
  .filter-pill {
    padding: 6px 13px;
    border-radius: 999px;
    border: 1px solid rgba(255, 255, 255, 0.08);
    background: transparent;
    color: #9a8f80;
    font-family: 'Bellefair', serif;
    font-size: 12.5px;
    cursor: pointer;
    transition: all 0.2s;
  }
  .filter-pill:hover {
    border-color: rgba(238, 232, 170, 0.3);
    color: #fde68a;
  }
  .filter-pill.on {
    border-color: rgba(255, 77, 158, 0.5);
    background: rgba(255, 77, 158, 0.12);
    color: #ff4d9e;
  }

  /* ── Wish grid + cards ── */
  .wish-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 12px;
  }
  @media (min-width: 600px) {
    .wish-grid {
      grid-template-columns: repeat(2, 1fr);
      gap: 14px;
    }
  }
  @media (min-width: 1080px) {
    .wish-grid {
      grid-template-columns: 1fr;
      gap: 14px;
    }
  }
  @media (min-width: 1280px) {
    .wish-grid {
      grid-template-columns: repeat(2, 1fr);
      gap: 14px;
    }
  }

  .wish-card {
    text-align: start;
    cursor: pointer;
    position: relative;
    padding: 18px;
    background:
      linear-gradient(
        180deg,
        rgba(255, 255, 255, 0.015),
        rgba(255, 255, 255, 0)
      ),
      #0e0d0c;
    border: 1px solid rgba(255, 255, 255, 0.07);
    border-radius: 18px;
    display: flex;
    flex-direction: column;
    gap: 10px;
    transition:
      transform 0.25s,
      border-color 0.25s,
      box-shadow 0.25s;
    animation: fadeUp 0.45s cubic-bezier(0.16, 1, 0.3, 1) both;
  }
  .wish-card:hover {
    transform: translateY(-2px);
    border-color: rgba(238, 232, 170, 0.3);
    box-shadow:
      0 0 0 1px rgba(238, 232, 170, 0.1),
      0 14px 40px rgba(0, 0, 0, 0.5);
  }
  .wish-card-glow {
    border-color: rgba(255, 77, 158, 0.32);
    box-shadow:
      0 0 0 1px rgba(255, 77, 158, 0.14),
      0 0 24px rgba(255, 77, 158, 0.1);
  }
  .wish-card-public {
    border-color: rgba(116, 191, 255, 0.18);
  }
  .wish-card-public:hover {
    border-color: rgba(116, 191, 255, 0.4);
  }

  .wc-top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
  }
  .wc-status {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    font-family: 'Cinzel', serif;
    font-size: 10px;
    letter-spacing: 0.22em;
    text-transform: uppercase;
    font-weight: 700;
  }
  .wc-status-dot {
    width: 7px;
    height: 7px;
    border-radius: 50%;
  }
  .wc-code {
    font-family: 'Fira Mono', monospace;
    font-size: 10.5px;
    color: #9a8f80;
    background: rgba(255, 255, 255, 0.04);
    padding: 3px 8px;
    border-radius: 6px;
    letter-spacing: 0.06em;
    border: 1px solid rgba(255, 255, 255, 0.08);
  }

  .wc-author {
    display: flex;
    align-items: center;
    gap: 9px;
    min-width: 0;
  }
  .disc-tiny {
    width: 30px;
    height: 30px;
    border-radius: 50%;
    background: linear-gradient(135deg, #201d19, #2a2520);
    border: 2px solid rgba(116, 191, 255, 0.4);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font-family: 'Cinzel', serif;
    color: #74bfff;
    font-weight: 700;
    font-size: 10px;
    flex-shrink: 0;
  }
  .wc-author-meta {
    min-width: 0;
  }
  .wc-author-name {
    font-family: 'Bellefair', serif;
    font-size: 13px;
    color: #ede5d8;
    line-height: 1.1;
  }
  .wc-author-dist {
    font-family: 'Bellefair', serif;
    font-size: 10.5px;
    color: #52493e;
    margin-top: 2px;
  }

  .wc-title {
    font-family: 'Sababa', 'Heebo', sans-serif;
    font-size: clamp(17px, 3.8vw, 20px);
    font-weight: 700;
    color: #ede5d8;
    line-height: 1.2;
  }
  .wc-excerpt {
    font-family: 'Bellefair', serif;
    font-size: 13.5px;
    color: #9a8f80;
    line-height: 1.55;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .wc-meta {
    display: flex;
    gap: 14px;
    flex-wrap: wrap;
    margin-top: 2px;
  }
  .metai-sm {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-family: 'Bellefair', serif;
    font-size: 12px;
    color: #c8bba8;
  }

  .wc-values {
    display: flex;
    flex-wrap: wrap;
    gap: 5px;
  }
  .val-pill-mini {
    padding: 3px 9px;
    border-radius: 999px;
    background: rgba(238, 232, 170, 0.06);
    border: 1px solid rgba(238, 232, 170, 0.18);
    color: #fde68a;
    font-family: 'Bellefair', serif;
    font-size: 11px;
  }
  .val-pill-mini.tag {
    background: rgba(116, 191, 255, 0.06);
    border-color: rgba(116, 191, 255, 0.18);
    color: #74bfff;
  }

  .wc-cov {
    margin-top: 6px;
  }
  .cov-track-sm {
    height: 4px;
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.05);
    overflow: hidden;
    margin-bottom: 8px;
  }
  .cov-fill-sm {
    height: 100%;
    background: linear-gradient(90deg, #02ffbb 0%, #fde68a 60%, #ff4d9e 100%);
    border-radius: 999px;
    transition: width 0.6s ease;
  }
  .cov-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    flex-wrap: wrap;
  }
  .cov-pct {
    font-family: 'Cinzel', serif;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.12em;
    text-transform: uppercase;
  }
  .cov-counts {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    font-family: 'Bellefair', serif;
    font-size: 11.5px;
    color: #9a8f80;
  }
  .ct-num {
    color: #fde68a;
    font-weight: 700;
  }
  .ct-lbl {
    color: #52493e;
  }
  .ct-sep {
    color: #52493e;
  }

  .wc-bottom {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    padding-top: 12px;
    margin-top: 4px;
    border-top: 1px solid rgba(255, 255, 255, 0.05);
  }
  .wc-event {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    min-width: 0;
  }
  .wc-event-text {
    font-family: 'Bellefair', serif;
    font-size: 12px;
    color: #c8bba8;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .wc-event-time {
    font-family: 'Bellefair', serif;
    font-size: 11px;
    color: #52493e;
    flex-shrink: 0;
  }

  .offer-link {
    font-family: 'Cinzel', serif;
    font-size: 11px;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    color: #74bfff;
  }

  /* ── Create new card ── */
  .wish-card-new {
    align-items: center;
    justify-content: center;
    text-align: center;
    gap: 6px;
    border: 1px dashed rgba(238, 232, 170, 0.28);
    background: repeating-linear-gradient(
      -45deg,
      rgba(255, 255, 255, 0.012) 0 10px,
      transparent 10px 20px
    );
    min-height: 200px;
  }
  .wish-card-new:hover {
    border-color: rgba(238, 232, 170, 0.6);
    background: rgba(238, 232, 170, 0.04);
  }
  .new-icon {
    font-size: 28px;
    color: #fde68a;
    text-shadow: 0 0 16px rgba(238, 232, 170, 0.6);
  }
  .new-title {
    font-family: 'Sababa', 'Heebo', sans-serif;
    font-size: 18px;
    font-weight: 700;
    color: #fde68a;
  }
  .new-sub {
    font-family: 'Bellefair', serif;
    font-size: 12.5px;
    color: #9a8f80;
    max-width: 260px;
    line-height: 1.5;
  }

  /* ── Empty ── */
  .empty {
    padding: 42px 18px;
    border: 1px dashed rgba(255, 255, 255, 0.12);
    border-radius: 18px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    gap: 8px;
    background: repeating-linear-gradient(
      -45deg,
      rgba(255, 255, 255, 0.012) 0 8px,
      transparent 8px 16px
    );
  }
  .empty-icon {
    font-size: 28px;
    color: #fde68a;
    opacity: 0.6;
  }
  .empty-title {
    font-family: 'Sababa', 'Heebo', sans-serif;
    font-size: 16px;
    color: #ede5d8;
  }
  .empty-sub {
    font-family: 'Bellefair', serif;
    font-size: 13px;
    color: #9a8f80;
    max-width: 380px;
    line-height: 1.5;
  }

  /* ── Right rail ── */
  .rail {
    display: flex;
    flex-direction: column;
  }
  @media (min-width: 1080px) {
    .rail {
      position: sticky;
      top: 80px;
    }
  }

  /* ── Panel ── */
  .panel {
    background: #171512;
    border: 1px solid rgba(255, 255, 255, 0.05);
    border-radius: 18px;
    padding: 18px;
    margin-bottom: 14px;
  }
  .panel h4 {
    margin: 0 0 12px;
    font-family: 'Cinzel', serif;
    font-size: 12px;
    letter-spacing: 0.2em;
    color: #fde68a;
    text-transform: uppercase;
  }

  /* ── Lev panel ── */
  .lev-panel {
    background:
      linear-gradient(
        180deg,
        rgba(116, 191, 255, 0.05),
        rgba(116, 191, 255, 0.01)
      ),
      #171512;
    border-color: rgba(116, 191, 255, 0.18);
  }
  .lev-hdr {
    display: flex;
    align-items: center;
    gap: 11px;
    margin-bottom: 14px;
  }
  .lev-av-wrap {
    position: relative;
    flex-shrink: 0;
  }
  .lev-av {
    width: 38px;
    height: 38px;
    border-radius: 50%;
    border: 2px solid rgba(116, 191, 255, 0.4);
  }
  .lev-online {
    position: absolute;
    bottom: -2px;
    inset-inline-end: -2px;
    width: 11px;
    height: 11px;
    border-radius: 50%;
    background: #02ffbb;
    border: 2px solid #171512;
    box-shadow: 0 0 10px #02ffbb;
  }
  .lev-title-tiny {
    font-family: 'Cinzel', serif;
    font-size: 12px;
    letter-spacing: 0.2em;
    color: #74bfff;
    text-transform: uppercase;
  }
  .lev-sub-tiny {
    font-family: 'Bellefair', serif;
    font-size: 11.5px;
    color: #52493e;
    margin-top: 2px;
  }

  .lev-tips {
    display: flex;
    flex-direction: column;
    gap: 9px;
  }
  .lev-tip {
    display: flex;
    gap: 9px;
    padding: 10px 12px;
    border-radius: 11px;
    border: 1px solid rgba(255, 255, 255, 0.05);
    background: rgba(255, 255, 255, 0.02);
  }
  .lev-tip.question {
    background: rgba(238, 232, 170, 0.04);
    border-color: rgba(238, 232, 170, 0.15);
  }
  .lev-tip.suggestion {
    background: rgba(116, 191, 255, 0.04);
    border-color: rgba(116, 191, 255, 0.15);
  }
  .lev-tip-icon {
    font-size: 11px;
    margin-top: 2px;
    flex-shrink: 0;
  }
  .lev-tip.question .lev-tip-icon {
    color: #fde68a;
  }
  .lev-tip.suggestion .lev-tip-icon {
    color: #74bfff;
  }
  .lev-tip-text {
    font-family: 'Bellefair', serif;
    font-size: 12.5px;
    color: #ede5d8;
    line-height: 1.55;
  }

  /* ── KPIs ── */
  .kpis {
    display: flex;
    flex-direction: column;
  }
  .kpi-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 10px 0;
    border-bottom: 1px dashed rgba(238, 232, 170, 0.1);
  }
  .kpi-lbl {
    font-family: 'Bellefair', serif;
    font-size: 13px;
    color: #9a8f80;
  }
  .kpi-val {
    font-family: 'Cinzel', serif;
    font-size: 18px;
    font-weight: 700;
  }

  /* ── Privacy ── */
  .privacy {
    display: flex;
    gap: 10px;
    align-items: flex-start;
    padding: 12px 14px;
    background: rgba(2, 255, 187, 0.03);
    border: 1px dashed rgba(2, 255, 187, 0.2);
    border-radius: 14px;
    margin-bottom: 14px;
  }
  .privacy-title {
    font-family: 'Cinzel', serif;
    font-size: 11px;
    letter-spacing: 0.18em;
    color: #02ffbb;
    text-transform: uppercase;
    margin-bottom: 4px;
  }
  .privacy-sub {
    font-family: 'Bellefair', serif;
    font-size: 12px;
    color: #9a8f80;
    line-height: 1.5;
  }

  /* ── Quick links ── */
  .quick {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  .quick-link {
    display: flex;
    align-items: center;
    gap: 11px;
    padding: 9px 12px;
    border-radius: 11px;
    background: rgba(255, 255, 255, 0.02);
    border: 1px solid rgba(255, 255, 255, 0.05);
    color: #c8bba8;
    font-family: 'Bellefair', serif;
    font-size: 13px;
    text-decoration: none;
    transition: all 0.2s;
  }
  .quick-link:hover {
    border-color: rgba(238, 232, 170, 0.25);
    background: rgba(238, 232, 170, 0.04);
    color: #fde68a;
    transform: translateX(-2px);
  }
</style>
