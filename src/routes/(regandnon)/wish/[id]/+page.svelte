<script>
  import { useFormatMoney } from '$lib/money/context.svelte';
  import EntityIcon from '$lib/celim/icons/EntityIcon.svelte';
  import '$lib/styles/concierge.css';
  import { page } from '$app/stores';
  import RichText from '$lib/celim/ui/richText.svelte';
  import { executeAction } from '$lib/client/actionClient';
  import { toast } from 'svelte-sonner';
  import { t, locale } from '$lib/translations';
  import ShareLink from '$lib/components/share/ShareLink.svelte';
  import SharePrompt from '$lib/components/share/SharePrompt.svelte';
  import { jsonLdBody } from '$lib/seo/jsonLd.js';
  import { askedLang, canonicalFor, ogImageFor, oneLine, wishJsonLd } from '$lib/seo/shareMeta.js';

  /** @type {{ data: { wish: any | null; proposalsCount: number; myProposals: any[]; uid: string | null; isLoggedIn: boolean; loadOk: boolean } }} */
  let { data } = $props();
  const fmtMoney = useFormatMoney();

  const isLoggedIn = $derived(!!data?.isLoggedIn);
  const myProposals = $derived(data?.myProposals ?? []);


  function fmtDate(iso) {
    if (!iso) return $t('concierge.pub.flexible');
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return $t('concierge.pub.flexible');
    return d.toLocaleDateString($locale, { day: 'numeric', month: 'short' });
  }
  function fmtBudget(n) {
    if (n == null || !Number.isFinite(+n)) return $t('concierge.by_proposal');
    return fmtMoney(+n);
  }
  function relativePublishedAt(iso) {
    if (!iso) return '';
    const d = new Date(iso).getTime();
    if (!d) return '';
    const diff = (Date.now() - d) / 1000;
    if (diff < 3600) return $t('concierge.pub.published_min', { count: Math.round(diff / 60) });
    if (diff < 86400) return $t('concierge.pub.published_hours', { count: Math.round(diff / 3600) });
    if (diff < 604800) return $t('concierge.pub.published_days', { count: Math.round(diff / 86400) });
    return $t('concierge.pub.published_weeks', { count: Math.round(diff / 604800) });
  }

  /* ===== Mock fallback — used when there is no wish at all =====
     The words live in concierge.demo.* so the demo reads in the visitor's language. */
  const D = (k, vars) => $t(`concierge.demo.${k}`, vars);
  const initialsOf = (name) =>
    String(name || '')
      .replace(/\./g, ' ')
      .trim()
      .split(/\s+/)
      .map((w) => w[0] || '')
      .join('')
      .slice(0, 2);
  const MOCK_WISH = $derived({
    code: 'R-7f3a91',
    title: D('mine.w1.title'),
    long: D('wish.long'),
    author: D('wish.author'),
    avatar: initialsOf(D('wish.author')),
    project: D('wish.project'),
    publishedAt: D('wish.publishedAt'),
    // a Thursday — the day is part of the story
    when: new Date(2025, 5, 19).toLocaleDateString($locale, { weekday: 'short', day: 'numeric', month: 'long' }),
    where: D('wish.where'),
    budget: `${fmtMoney(850)}–${fmtMoney(1200)}`,
    proposalsCount: 6,
    accessNote: $t('concierge.pub.access_note')
  });

  const MOCK_MISSIONS = $derived([
    { name: D('missions.babysitter'), hours: 6, imp: 'must' },
    { name: D('missions.ride'), hours: 2, imp: 'must' },
    { name: D('missions.spa'), hours: 2, imp: 'must' },
    { name: D('missions.restaurant'), hours: 0.5, imp: 'nice' }
  ]);
  const MOCK_RESOURCES = $derived([
    { name: D('resources.quietPlace'), qty: 1, imp: 'must' },
    { name: D('resources.mealForTwo'), qty: 2, imp: 'nice' },
    { name: D('resources.flowers'), qty: 1, imp: 'nice' }
  ]);
  const MOCK_VALUES = $derived([D('values.reciprocity'), D('values.generosity'), D('values.family')]);

  const wish = $derived(
    data?.wish
      ? {
          code: data.wish.code,
          title: data.wish.name,
          long: data.wish.longDes || '',
          author: data.wish.ownerName,
          avatar: data.wish.ownerAvatar,
          project: data.wish.locationHint || '',
          publishedAt: relativePublishedAt(data.wish.startDate) || '',
          when: fmtDate(data.wish.startDate),
          where: data.wish.locationHint || '',
          budget: fmtBudget(data.wish.totalBounti),
          proposalsCount: data.proposalsCount ?? 0,
          accessNote: $t('concierge.pub.access_note')
        }
      : MOCK_WISH
  );

  const MISSIONS = $derived(
    data?.wish
      ? (data.wish.extractedMissions ?? []).map((m) => ({
          id: m.id,
          name: m.name,
          hours: m.hoursEst ?? 0,
          imp: m.importance === 'must' ? 'must' : 'nice'
        }))
      : MOCK_MISSIONS
  );
  const RESOURCES = $derived(
    data?.wish
      ? (data.wish.extractedResources ?? []).map((r) => ({
          id: r.id,
          name: r.name,
          qty: r.quantityEst ?? 1,
          imp: r.importance === 'must' ? 'must' : 'nice'
        }))
      : MOCK_RESOURCES
  );
  const VALUES = $derived(
    data?.wish ? (data.wish.values ?? []) : MOCK_VALUES
  );

  const SUPPORTERS = $derived([
    ...[
      { n: 's1', color: 'green' },
      { n: 's2', color: 'green' },
      { n: 's3', color: 'blue' }
    ].map(({ n, color }) => {
      const name = D(`supporters.${n}.name`);
      return { avatar: initialsOf(name), name, role: D(`supporters.${n}.role`), color };
    }),
    { avatar: '+3', name: D('supporters.more.name', { count: 3 }), role: D('supporters.more.role'), color: 'gold' }
  ]);

  function discBorder(c) {
    return c === 'green'
      ? 'rgb(var(--cg-mint-rgb) / 0.6)'
      : c === 'blue'
        ? 'rgb(var(--cg-sky-rgb) / 0.6)'
        : 'rgb(var(--cg-gold-rgb) / 0.5)';
  }
  function discColor(c) {
    return c === 'green' ? 'var(--cg-mint)' : c === 'blue' ? 'var(--cg-sky)' : 'var(--cg-goldhi)';
  }
  function gemCls(imp) {
    return imp === 'must' ? 'gem' : 'gem gem-gold';
  }

  const wishId = $derived($page.params.id);

  // ── Share layer ─────────────────────────────────────────────────────────────
  // The canonical address and the card follow the language the *link* asked
  // for (bare path = Hebrew); the host is always the public one, so a copied
  // link never carries a preview host or the app's origin into a chat.
  const lang = $derived(askedLang($page.url));
  const canonical = $derived(canonicalFor(`/wish/${wishId}`, lang));
  const fulfilled = $derived(data?.wish?.status === 'fulfilled');
  const pageTitle = $derived($t('concierge.pub.page_title', { title: wish.title }));
  const pageDesc = $derived(
    oneLine(
      `${$t('concierge.pub.desc_count', { count: wish.proposalsCount })} · ${wish.when}${wish.where ? ` · ${wish.where}` : ''}. ${wish.long || $t('concierge.pub.desc_fallback')}`,
      200
    )
  );
  const ogImage = $derived(
    ogImageFor('wish', wishId, lang, `${wish.proposalsCount}-${fulfilled ? 1 : 0}`)
  );
  const ld = $derived(data?.wish ? wishJsonLd(data.wish, canonical) : null);

  // The share moment for a helper who just offered: the wish now has one more
  // piece covered, and she knows who else could cover the rest.
  const shareUrl = $derived(canonicalFor(`/wish/${wishId}`, $locale));
  const shareMessage = $derived(
    $t('concierge.pub.share_msg', { title: wish.title, author: wish.author, count: wish.proposalsCount, url: shareUrl })
  );
  let sharePromptHidden = $state(false);

  let copied = $state(false);
  function copyLink() {
    try {
      navigator.clipboard?.writeText(shareUrl);
      copied = true;
      setTimeout(() => (copied = false), 1800);
    } catch {}
  }

  // ── Provider offer panel ────────────────────────────────────────────────────
  let offerOpen = $state(false);
  let offerSelected = $state(/** @type {Set<string>} */ (new Set()));
  let offerResourceSelected = $state(/** @type {Set<string>} */ (new Set()));
  let offerSubmitting = $state(false);
  let offerDone = $state(false);

  function toggleMission(id) {
    const s = new Set(offerSelected);
    s.has(id) ? s.delete(id) : s.add(id);
    offerSelected = s;
  }
  function toggleResource(id) {
    const s = new Set(offerResourceSelected);
    s.has(id) ? s.delete(id) : s.add(id);
    offerResourceSelected = s;
  }

  async function submitOffer() {
    if (!offerSelected.size && !offerResourceSelected.size) return;
    offerSubmitting = true;
    try {
      const res = await executeAction('offerWishHelp', {
        ratsonId: String(wishId),
        missionIds: [...offerSelected],
        resourceIds: [...offerResourceSelected]
      });
      if (!res?.success) throw new Error(res?.error?.message || $t('concierge.pub.err_short'));
      offerDone = true;
      toast.success($t('concierge.pub.offer_sent_toast'));
      offerOpen = false;
    } catch (e) {
      toast.error(e instanceof Error ? e.message : $t('concierge.pub.err_send'));
    } finally {
      offerSubmitting = false;
    }
  }

  // A proposal is an "invitation" (from the wisher) if it has covered_missions
  // or covered_resources; a self-offer has neither.
  const myInvitations = $derived(
    myProposals.filter(
      (p) => p.coveredMissions?.length || p.coveredResources?.length
    )
  );
  const mySelfOffers = $derived(
    myProposals.filter(
      (p) => !p.coveredMissions?.length && !p.coveredResources?.length
    )
  );
</script>

<svelte:head>
  <title>{pageTitle}</title>
  <meta name="description" content={pageDesc} />
  <link rel="canonical" href={canonical} />
  <meta property="og:title" content={pageTitle} />
  <meta property="og:description" content={pageDesc} />
  <meta property="og:image" content={ogImage} />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta property="og:image:alt" content={$t('concierge.pub.og_alt', { title: wish.title, count: wish.proposalsCount })} />
  <meta name="twitter:title" content={pageTitle} />
  <meta name="twitter:description" content={pageDesc} />
  <meta name="twitter:image" content={ogImage} />
  {#if ld}
    {@html `<script type="application/ld+json">${jsonLdBody(ld)}<\/script>`}
  {/if}
</svelte:head>

<!-- ===================================================================
     PUBLIC WISH VIEW — /wish/[id]  (M2 · read-only · share-friendly)
     =================================================================== -->
<div class="cp">
  <!-- ── HEADER ─────────────────────────────────────────────────────── -->
  <header class="hdr">
    <div class="hdr-logo">
      <img src="/coin-logo.png" class="hdr-coin" alt="1lev1" />
      <div class="hdr-brand">
        <span class="hdr-dot"></span>
        <span class="hdr-name">Concierge</span>
        <span class="hdr-sub hide-xs">{$t('concierge.pub.hdr_sub')}</span>
      </div>
    </div>

    <nav class="hdr-nav hide-sm">
      <a href="/concierge" class="nav-lnk">{$t('concierge.new.nav.wishes')}</a>
      <a href="/about" class="nav-lnk">{$t('concierge.pub.what_is')}</a>
    </nav>

    <div class="hdr-right">
      {#if isLoggedIn}
        <a href="/lev" class="btn-ghost btn-xs">{$t('concierge.pub.my_heart')}</a>
        <a href="/deals" class="btn-ghost btn-xs hide-xs">{$t('concierge.pub.deals')}</a>
      {:else}
        <a href="/login" class="btn-ghost btn-xs">{$t('concierge.pub.login')}</a>
        <a href="/signup" class="btn-ghost btn-xs hide-xs">{$t('concierge.pub.join')}</a>
      {/if}
    </div>
  </header>

  <!-- ── SHELL ──────────────────────────────────────────────────────── -->
  <div class="shell">
    <div class="wrap">
      <!-- TOP BAR -->
      <div class="topbar anim anim-d1">
        <a href="/concierge" class="btn-ghost btn-xs">{$t('concierge.pub.back')}</a>
        <div class="topbar-right">
          <span class="code-lbl hide-xs">{$t('concierge.wp.code_label')}</span>
          <code class="wish-code">{wish.code}</code>
          <button class="btn-ghost btn-xs" onclick={copyLink}>
            {#if copied}{$t('concierge.pub.copied')}{:else}<EntityIcon kind="share" size={13} /> {$t('concierge.pub.share')}{/if}
          </button>
        </div>
      </div>

      <!-- WISH HERO -->
      <div class="facet wish-glow anim anim-d1">
        <div class="hero-inner">
          <div class="hero-av">{wish.avatar}</div>
          <div class="hero-body">
            <div class="hero-meta">
              <span class="badge-open">{$t('concierge.pub.badge_open')}</span>
              <span class="dim">·</span>
              <span class="muted">{wish.publishedAt}</span>
              <span class="dim hide-xs">·</span>
              <span class="muted hide-xs"
                >{$t('concierge.pub.by', { author: wish.author, project: wish.project })}</span
              >
            </div>
            <div class="hero-titlerow">
              <h1 class="hero-title">{wish.title}</h1>
              <ShareLink
                path={`/wish/${wishId}`}
                title={wish.title}
                desc={$t('ui.share.wish')}
                hashtags={['1lev1', 'wish']}
                size={24}
              />
            </div>
            <div class="hero-long rich-wrap">
              <RichText
                outpot={wish.long}
                editable={false}
                trans={true}
                sml={true}
              />
            </div>
          </div>
        </div>
        <div class="hero-footer">
          <div class="hero-metas">
            {#each [['date', $t('concierge.pub.meta_when'), wish.when], ['place', $t('concierge.pub.meta_where'), wish.where], ['money', $t('concierge.pub.meta_budget'), wish.budget]] as [icon, lbl, val] (icon)}
              <div class="metai">
                <span class="mi-icon"><EntityIcon kind={icon} size={16} /></span>
                <div>
                  <div class="mi-lbl">{lbl}</div>
                  <div class="mi-val">{val}</div>
                </div>
              </div>
            {/each}
          </div>
          <div class="hero-cta-wrap">
            {#if isLoggedIn}
              {#if offerDone}
                <span class="badge-open" style="font-size:13px">{$t('concierge.pub.your_offer_sent_owner')}</span>
              {:else if myProposals.length}
                <button class="btn-jewel" onclick={() => (offerOpen = true)}><EntityIcon kind="offers" size={14} /> {$t('concierge.pub.my_offers')}</button>
              {:else}
                <button class="btn-jewel" onclick={() => (offerOpen = true)}><EntityIcon kind="support" size={14} /> {$t('concierge.pub.i_can_help')}</button>
              {/if}
            {:else}
              <a href={`/login?next=/wish/${wishId}`} class="btn-jewel"><EntityIcon kind="support" size={14} /> {$t('concierge.pub.i_can_help')}</a>
            {/if}
          </div>
        </div>
      </div>

      <!-- EXTRACTION STRIP (read-only) -->
      <div class="extstrip anim anim-d2">
        <div class="extstrip-hdr">
          <img src="/botlogo.png" class="bot-av" alt="Lev" />
          <div class="ext-labels">
            <div class="lev-title">{$t('concierge.pub.lev_title')}</div>
            <div class="lev-sub">
              {$t('concierge.pub.lev_sub', { author: wish.author })}
            </div>
          </div>
          <span class="sbadge ready">{$t('concierge.pub.active_offers', { count: wish.proposalsCount })}</span>
        </div>
        <div class="extgrid">
          <div>
            <div class="extcol-lbl">{$t('concierge.wp.missions')}</div>
            <div class="chips">
              {#each MISSIONS as m (m.name)}
                <span class="chip {m.imp}">
                  <span class={gemCls(m.imp)} style="width:6px;height:6px"
                  ></span>
                  {m.name} · <span style="opacity:.7">{$t('concierge.wp.hours_short', { count: m.hours })}</span>
                </span>
              {/each}
            </div>
          </div>
          <div>
            <div class="extcol-lbl">{$t('concierge.wp.resources')}</div>
            <div class="chips">
              {#each RESOURCES as r (r.name)}
                <span class="chip {r.imp}">
                  <span class={gemCls(r.imp)} style="width:6px;height:6px"
                  ></span>
                  {r.name}
                  {r.qty ? `· ×${r.qty}` : ''}
                </span>
              {/each}
            </div>
          </div>
        </div>
      </div>

      <!-- VALUES + SUPPORTERS -->
      <div class="dual-grid anim anim-d3">
        <!-- Values -->
        <div class="panel">
          <h4>{$t('concierge.pub.values_title')}</h4>
          <div class="values-row">
            {#each VALUES as v (v)}
              <span class="val-pill">{v}</span>
            {/each}
          </div>
          <p class="panel-note">
            {$t('concierge.pub.values_note', { author: wish.author })}
          </p>
        </div>

        <!-- Supporters preview: invented people, so only on the design mock -->
        {#if !data?.wish}
        <div class="panel">
          <h4>{$t('concierge.pub.supporters_title')}</h4>
          <div class="supp-strip">
            {#each SUPPORTERS as s (s.name)}
              <div class="supp-item">
                <div
                  class="disc-sm"
                  style="border-color:{discBorder(s.color)};color:{discColor(
                    s.color
                  )}"
                >
                  {s.avatar}
                </div>
                <div class="supp-meta">
                  <div class="supp-name">{s.name}</div>
                  <div class="supp-role">{s.role}</div>
                </div>
              </div>
            {/each}
          </div>
          <p class="panel-note">
            {$t('concierge.pub.supporters_note')}
          </p>
        </div>
        {/if}
      </div>

      <!-- INVITE STRIP -->
      <div class="invite anim anim-d3">
        <div class="invite-decor"></div>
        <div class="invite-body">
          <div class="invite-eyebrow">{$t('concierge.pub.how_to_help')}</div>
          <h2 class="invite-h2">{$t('concierge.pub.invite_h2')}</h2>
          <p class="invite-p">
            {$t('concierge.pub.invite_p', { author: wish.author })}
          </p>
          <div class="invite-cta">
            {#if isLoggedIn}
              {#if offerDone}
                <span class="badge-open" style="font-size:13px">{$t('concierge.pub.your_offer_sent')}</span>
              {:else}
                <button class="btn-jewel" onclick={() => (offerOpen = true)}><EntityIcon kind="support" size={14} /> {$t('concierge.pub.i_can_help')}</button>
              {/if}
            {:else}
              <a href={`/login?next=/wish/${wishId}`} class="btn-jewel"><EntityIcon kind="support" size={14} /> {$t('concierge.pub.i_can_help')}</a>
            {/if}
            <a href="/concierge" class="btn-ghost">{$t('concierge.pub.other_wishes')}</a>
          </div>
          {#if offerDone && !sharePromptHidden}
            <div class="invite-share">
              <SharePrompt
                url={shareUrl}
                message={shareMessage}
                title={$t('concierge.pub.share_title')}
                body={$t('concierge.pub.share_body')}
                variant="celebrate"
                onDismiss={() => (sharePromptHidden = true)}
              />
            </div>
          {/if}
        </div>
      </div>

      <!-- YOUR OWN WISH — the reader who came for someone else's wish (plan §4, loop 1) -->
      <div class="own-wish anim anim-d3">
        <div class="own-wish-text">
          <h3 class="own-wish-h3">{$t('concierge.pub.own_h3')}</h3>
          <p class="own-wish-p">
            {$t('concierge.pub.own_p')}
          </p>
        </div>
        <a href="/wish/new" class="btn-jewel own-wish-cta"><EntityIcon kind="wish" size={14} /> {$t('concierge.pub.open_wish')}</a>
      </div>

      <!-- ── MY PROPOSALS (logged-in provider) ──────────────────────────── -->
      {#if isLoggedIn && myProposals.length}
        <div class="my-proposals anim anim-d3">
          <div class="mp-hdr">
            <span class="mp-icon"><EntityIcon kind="offers" size={16} /></span>
            <h4 class="mp-title">{$t('concierge.pub.my_offers_title')}</h4>
          </div>
          {#each myProposals as p (p.id)}
            <div class="mp-card">
              <div class="mp-row">
                <span class="mp-kind">{p.kind === 'custom_offer' ? $t('concierge.pub.kind_custom') : $t('concierge.pub.kind_invite')}</span>
                <span class="mp-status mp-status--{p.status}"
                  >{['suggested', 'viewed', 'accepted', 'rejected', 'expired'].includes(p.status)
                    ? $t(`concierge.pub.status.${p.status}`)
                    : p.status}</span
                >
              </div>
              {#if p.coveredMissions?.length}
                <div class="mp-items">
                  {#each p.coveredMissions as cm (cm.id)}
                    {@const mission = MISSIONS.find(
                      (m) => String(m.id ?? '') === String(cm.extractedMissionIdx)
                    ) ?? { name: cm.extractedMissionIdx }}
                    <span class="mp-chip">✦ {mission.name}{cm.hours ? ` · ${$t('concierge.wp.hours_short', { count: cm.hours })}` : ''}</span>
                  {/each}
                </div>
              {/if}
              {#if p.coveredResources?.length}
                <div class="mp-items">
                  {#each p.coveredResources as cr (cr.id)}
                    {@const resource = RESOURCES.find(
                      (r) => String(r.id ?? '') === String(cr.extractedResourceIdx)
                    ) ?? { name: cr.extractedResourceIdx }}
                    <span class="mp-chip">◐ {resource.name}{cr.quantity ? ` · ×${cr.quantity}` : ''}</span>
                  {/each}
                </div>
              {/if}
              {#if p.status === 'suggested' || p.status === 'viewed'}
                <div class="mp-actions">
                  <a href="/deals" class="btn-ghost btn-xs">{$t('concierge.pub.view_in_deals')}</a>
                </div>
              {/if}
            </div>
          {/each}
        </div>
      {/if}

      <!-- Privacy footer -->
      <div class="privacy-strip anim anim-d3">
        <EntityIcon kind="private" size={15} />
        <div>
          <div class="privacy-title">{wish.accessNote}</div>
          <div class="privacy-sub">
            {$t('concierge.pub.privacy_sub', { author: wish.author })}
          </div>
        </div>
      </div>
    </div>
    <!-- /wrap -->
  </div>
  <!-- /shell -->
</div>

<!-- ── OFFER HELP MODAL ──────────────────────────────────────────────────── -->
{#if offerOpen}
  <div class="ofr-overlay" role="dialog" aria-modal="true">
    <div class="ofr-card">
      <button class="ofr-x" onclick={() => (offerOpen = false)} aria-label={$t('concierge.pub.close')}>✕</button>
      <div class="ofr-head">
        <span class="ofr-gem"></span>
        <h2 class="ofr-title">{$t('concierge.pub.ofr_title')}</h2>
      </div>
      <p class="ofr-intro">{$t('concierge.pub.ofr_intro')}</p>

      {#if MISSIONS.length}
        <div class="ofr-section-lbl">{$t('concierge.wp.missions')}</div>
        <div class="ofr-chips">
          {#each MISSIONS as m (m.name)}
            <button
              class="ofr-chip {offerSelected.has(String(m.id ?? m.name)) ? 'ofr-chip--sel' : ''}"
              onclick={() => toggleMission(String(m.id ?? m.name))}
              type="button"
            >
              {m.name}{m.hours ? ` · ${$t('concierge.wp.hours_short', { count: m.hours })}` : ''}
            </button>
          {/each}
        </div>
      {/if}

      {#if RESOURCES.length}
        <div class="ofr-section-lbl" style="margin-top:12px">{$t('concierge.wp.resources')}</div>
        <div class="ofr-chips">
          {#each RESOURCES as r (r.name)}
            <button
              class="ofr-chip {offerResourceSelected.has(String(r.id ?? r.name)) ? 'ofr-chip--sel' : ''}"
              onclick={() => toggleResource(String(r.id ?? r.name))}
              type="button"
            >
              {r.name}{r.qty ? ` · ×${r.qty}` : ''}
            </button>
          {/each}
        </div>
      {/if}

      <div class="ofr-actions" style="margin-top:20px">
        <button class="ofr-btn ofr-btn--ghost" onclick={() => (offerOpen = false)}>{$t('concierge.wp.cancel')}</button>
        <button
          class="ofr-btn ofr-btn--primary"
          onclick={submitOffer}
          disabled={offerSubmitting || (!offerSelected.size && !offerResourceSelected.size)}
        >
          {#if offerSubmitting}{$t('concierge.pub.sending')}{:else}<EntityIcon kind="send" size={14} /> {$t('concierge.pub.send_offer')}{/if}
        </button>
      </div>
    </div>
  </div>
{/if}

<!-- /cp -->

<style>
  @import url('https://fonts.googleapis.com/css2?family=Bellefair&family=Cinzel:wght@400;600;700&family=Heebo:wght@300;400;500;600;700;800&display=swap');

  /* ── Page shell ── */
  .cp {
    background: var(--cg-bg);
    color: var(--cg-ink);
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
        rgb(var(--cg-amber-rgb) / 0.1) 0%,
        transparent 55%
      ),
      radial-gradient(
        ellipse 60% 65% at 90% 110%,
        rgb(var(--cg-pinkd-rgb) / 0.09) 0%,
        transparent 55%
      ),
      radial-gradient(
        ellipse 50% 40% at 50% 50%,
        rgb(var(--cg-mint-rgb) / 0.035) 0%,
        transparent 60%
      );
  }
  .shell {
    position: relative;
    z-index: 1;
    min-height: 100vh;
    padding-bottom: 80px;
  }
  .wrap {
    max-width: 980px;
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
  @keyframes wishGlow {
    0%,
    100% {
      box-shadow:
        0 0 0 1px rgb(var(--cg-gold-rgb) / 0.35) inset,
        0 0 30px rgb(var(--cg-gold-rgb) / 0.18),
        0 0 80px rgb(var(--cg-pinkd-rgb) / 0.18);
    }
    50% {
      box-shadow:
        0 0 0 1px rgb(var(--cg-gold-rgb) / 0.5) inset,
        0 0 44px rgb(var(--cg-gold-rgb) / 0.28),
        0 0 120px rgb(var(--cg-pinkd-rgb) / 0.28);
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
  .wish-glow {
    animation:
      fadeUp 0.45s cubic-bezier(0.16, 1, 0.3, 1) both,
      wishGlow 4.5s ease-in-out 0.6s infinite;
  }

  /* ── Header ── */
  .hdr {
    position: sticky;
    top: 0;
    z-index: 100;
    background: rgb(var(--cg-bg-rgb) / 0.84);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border-bottom: 1px solid rgb(var(--cg-amber-rgb) / 0.2);
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
    box-shadow: 0 0 14px rgb(var(--cg-gold-rgb) / 0.4);
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
    background: var(--cg-mint);
    box-shadow: 0 0 10px var(--cg-mint);
  }
  .hdr-name {
    font-family: 'Cinzel', serif;
    font-size: clamp(13px, 3vw, 18px);
    color: var(--cg-gold2);
    letter-spacing: 0.22em;
    text-transform: uppercase;
  }
  .hdr-sub {
    font-family: 'Bellefair', serif;
    font-size: 13px;
    color: var(--cg-muted);
  }
  .hdr-nav {
    display: flex;
    gap: 20px;
    align-items: center;
  }
  .nav-lnk {
    font-size: 13px;
    color: var(--cg-muted);
    text-decoration: none;
    letter-spacing: 0.02em;
    transition: color 0.2s;
  }
  .nav-lnk:hover {
    color: var(--cg-goldhi);
  }
  .hdr-right {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-shrink: 0;
  }

  /* ── Top bar ── */
  .topbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 12px;
    padding: 18px 0 14px;
  }
  .topbar-right {
    display: flex;
    gap: 8px;
    align-items: center;
    flex-wrap: wrap;
  }
  .code-lbl {
    font-family: 'Bellefair', serif;
    font-size: 12px;
    color: var(--cg-muted);
  }
  .wish-code {
    font-family: 'Fira Mono', monospace;
    font-size: 11px;
    color: var(--cg-goldhi);
    background: rgb(var(--cg-gold-rgb) / 0.08);
    padding: 4px 10px;
    border-radius: 6px;
    letter-spacing: 0.06em;
    border: 1px solid rgb(var(--cg-gold-rgb) / 0.2);
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
    color: var(--cg-on-cta);
    white-space: nowrap;
    text-decoration: none;
    background: linear-gradient(135deg, var(--cg-g-pinkd), var(--cg-g-pink));
    box-shadow:
      inset 1px 1px 0 rgb(var(--cg-fg-rgb) / calc(0.25 * var(--cg-fg-k))),
      inset -1px -1px 0 rgb(var(--cg-shade-rgb) / calc(0.4 * var(--cg-shade-k))),
      0 6px 20px rgb(var(--cg-pinkd-rgb) / 0.4);
    transition: transform 0.2s;
  }
  .btn-jewel:hover {
    transform: translateY(-1px);
  }
  .btn-ghost {
    background: transparent;
    border: 1px solid rgb(var(--cg-fg-rgb) / calc(0.1 * var(--cg-fg-k)));
    color: var(--cg-muted);
    padding: 9px 16px;
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
    color: var(--cg-ink);
    border-color: rgb(var(--cg-gold-rgb) / 0.3);
    background: rgb(var(--cg-gold-rgb) / 0.04);
  }
  .btn-xs {
    padding: 7px 12px;
    font-size: 12px;
  }

  /* ── Gems ── */
  .gem {
    width: 8px;
    height: 8px;
    display: inline-block;
    background: linear-gradient(135deg, var(--cg-g-pink), var(--cg-g-pinkd));
    transform: rotate(45deg);
    box-shadow: 0 0 12px rgb(var(--cg-pink-rgb) / 0.7);
    flex-shrink: 0;
  }
  .gem-gold {
    background: linear-gradient(135deg, var(--cg-g-goldhi), var(--cg-g-metal-d));
    box-shadow: 0 0 12px rgb(var(--cg-gold-rgb) / 0.7);
  }

  /* ── Status badges ── */
  .sbadge {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 5px 12px;
    border-radius: 999px;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.16em;
    text-transform: uppercase;
  }
  .sbadge::before {
    content: '';
    width: 6px;
    height: 6px;
    border-radius: 50%;
  }
  .sbadge.ready {
    background: rgb(var(--cg-mint-rgb) / 0.08);
    color: var(--cg-mint);
    border: 1px solid rgb(var(--cg-mint-rgb) / 0.3);
  }
  .sbadge.ready::before {
    background: var(--cg-mint);
    box-shadow: 0 0 8px var(--cg-mint);
  }

  /* ── Chips ── */
  .chip {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 5px 11px;
    border-radius: 999px;
    font-family: 'Bellefair', serif;
    font-size: 12.5px;
    background: rgb(var(--cg-fg-rgb) / calc(0.04 * var(--cg-fg-k)));
    border: 1px solid rgb(var(--cg-fg-rgb) / calc(0.08 * var(--cg-fg-k)));
    color: var(--cg-ink);
  }
  .chip.must {
    background: rgb(var(--cg-pink-rgb) / 0.1);
    border-color: rgb(var(--cg-pink-rgb) / 0.35);
    color: var(--cg-pink);
  }
  .chip.nice {
    background: rgb(var(--cg-gold-rgb) / 0.07);
    border-color: rgb(var(--cg-gold-rgb) / 0.25);
    color: var(--cg-goldhi);
  }

  /* ── Wish hero ── */
  .facet {
    position: relative;
    background:
      linear-gradient(180deg, rgb(var(--cg-gold-rgb) / 0.04), rgb(var(--cg-bg-rgb) / 0)),
      linear-gradient(135deg, rgb(var(--cg-pink-rgb) / 0.05), rgb(var(--cg-bg-rgb) / 0));
    border: 1px solid rgb(var(--cg-gold-rgb) / 0.22);
    border-radius: 20px;
    padding: 22px 18px;
    overflow: hidden;
  }
  @media (min-width: 640px) {
    .facet {
      border-radius: 26px;
      padding: 34px 38px;
    }
  }
  .facet::before {
    content: '';
    position: absolute;
    top: -1px;
    inset-inline-start: 28px;
    width: 14px;
    height: 14px;
    background: linear-gradient(135deg, var(--cg-g-goldhi), var(--cg-g-metal-d));
    transform: rotate(45deg);
    box-shadow: 0 0 14px rgb(var(--cg-gold-rgb) / 0.7);
    border-radius: 2px;
  }
  .facet::after {
    content: '';
    position: absolute;
    top: -1px;
    inset-inline-end: 28px;
    width: 14px;
    height: 14px;
    background: linear-gradient(135deg, var(--cg-g-pink), var(--cg-g-pinkd));
    transform: rotate(45deg);
    box-shadow: 0 0 14px rgb(var(--cg-pink-rgb) / 0.7);
    border-radius: 2px;
  }

  .hero-inner {
    display: flex;
    align-items: flex-start;
    gap: 14px;
  }
  @media (min-width: 640px) {
    .hero-inner {
      gap: 22px;
    }
  }
  .hero-av {
    width: 48px;
    height: 48px;
    border-radius: 50%;
    background: linear-gradient(135deg, var(--cg-g-pinkd), var(--cg-g-pink));
    border: 2px solid var(--cg-gold);
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: 'Cinzel', serif;
    font-weight: 700;
    font-size: 14px;
    color: var(--cg-on-cta);
    box-shadow: 0 0 22px rgb(var(--cg-pink-rgb) / 0.4);
  }
  @media (min-width: 640px) {
    .hero-av {
      width: 64px;
      height: 64px;
      font-size: 18px;
    }
  }
  .hero-body {
    flex: 1;
    min-width: 0;
  }
  .hero-meta {
    display: flex;
    align-items: center;
    gap: 7px;
    margin-bottom: 10px;
    flex-wrap: wrap;
  }
  .badge-open {
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.22em;
    text-transform: uppercase;
    color: var(--cg-goldhi);
  }
  .muted {
    font-family: 'Bellefair', serif;
    font-size: 12px;
    color: var(--cg-muted);
  }
  .dim {
    color: var(--cg-dim);
    font-size: 11px;
  }
  .hero-titlerow {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 0.75rem;
  }
  .hero-title {
    margin: 0;
    font-family: 'Sababa', 'Heebo', sans-serif;
    font-size: clamp(22px, 5vw, 38px);
    font-weight: 700;
    line-height: 1.15;
    color: var(--cg-ink);
  }
  .hero-long {
    margin: 12px 0 0;
    font-family: 'Bellefair', serif;
    font-size: clamp(14px, 2vw, 16px);
    line-height: 1.65;
    color: var(--cg-ink2);
  }
  .rich-wrap :global(.editor-wrapper) {
    border: none !important;
    box-shadow: none !important;
  }
  .rich-wrap :global(.tiptap-content) {
    min-height: 0 !important;
    padding: 0 !important;
  }
  .rich-wrap :global(.custom-prose) {
    color: var(--cg-ink2) !important;
    font-family: 'Bellefair', serif !important;
    font-size: clamp(14px, 2vw, 16px) !important;
    line-height: 1.65 !important;
  }

  .hero-footer {
    margin-top: 20px;
    padding-top: 16px;
    border-top: 1px solid rgb(var(--cg-gold-rgb) / 0.14);
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 12px;
    flex-wrap: wrap;
  }
  .hero-metas {
    display: flex;
    gap: 14px;
    flex-wrap: wrap;
  }
  .metai {
    display: flex;
    align-items: center;
    gap: 9px;
  }
  .mi-icon {
    display: inline-flex;
    opacity: 0.85;
  }
  .mi-lbl {
    font-size: 9px;
    letter-spacing: 0.2em;
    text-transform: uppercase;
    color: var(--cg-dim);
  }
  .mi-val {
    font-family: 'Bellefair', serif;
    font-size: 13px;
    color: var(--cg-ink);
  }
  .hero-cta-wrap {
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
  }

  /* ── Extraction strip ── */
  .extstrip {
    margin-top: 16px;
    padding: 18px 16px;
    border: 1px solid rgb(var(--cg-sky-rgb) / 0.18);
    border-radius: 18px;
    background: linear-gradient(
      180deg,
      rgb(var(--cg-sky-rgb) / 0.04),
      rgb(var(--cg-sky-rgb) / 0.01)
    );
  }
  @media (min-width: 640px) {
    .extstrip {
      padding: 22px 26px;
      border-radius: 20px;
    }
  }
  .extstrip-hdr {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 14px;
    flex-wrap: wrap;
  }
  .bot-av {
    width: 28px;
    height: 28px;
    border-radius: 50%;
    flex-shrink: 0;
  }
  .ext-labels {
    flex: 1;
    min-width: 0;
  }
  .lev-title {
    font-family: 'Cinzel', serif;
    font-size: 11px;
    letter-spacing: 0.2em;
    color: var(--cg-sky);
    text-transform: uppercase;
  }
  .lev-sub {
    font-family: 'Bellefair', serif;
    font-size: 13px;
    color: var(--cg-muted);
    margin-top: 2px;
  }
  .extgrid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 14px;
  }
  @media (min-width: 600px) {
    .extgrid {
      grid-template-columns: 1fr 1fr;
      gap: 22px;
    }
  }
  .extcol-lbl {
    font-size: 9px;
    font-weight: 700;
    letter-spacing: 0.22em;
    text-transform: uppercase;
    color: var(--cg-muted);
    margin-bottom: 9px;
  }
  .chips {
    display: flex;
    gap: 6px;
    flex-wrap: wrap;
  }

  /* ── Dual grid ── */
  .dual-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 14px;
    margin-top: 18px;
  }
  @media (min-width: 760px) {
    .dual-grid {
      grid-template-columns: 1fr 1fr;
      gap: 16px;
    }
  }

  /* ── Panel ── */
  .panel {
    background: var(--cg-s2);
    border: 1px solid rgb(var(--cg-fg-rgb) / calc(0.05 * var(--cg-fg-k)));
    border-radius: 18px;
    padding: 18px;
  }
  .panel h4 {
    margin: 0 0 12px;
    font-family: 'Cinzel', serif;
    font-size: 12px;
    letter-spacing: 0.18em;
    color: var(--cg-goldhi);
    text-transform: uppercase;
  }
  .panel-note {
    margin: 14px 0 0;
    font-family: 'Bellefair', serif;
    font-size: 12.5px;
    color: var(--cg-muted);
    line-height: 1.55;
  }

  /* ── Values row ── */
  .values-row {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }
  .val-pill {
    padding: 6px 13px;
    border-radius: 999px;
    border: 1px solid rgb(var(--cg-pink-rgb) / 0.4);
    background: rgb(var(--cg-pink-rgb) / 0.08);
    color: var(--cg-pink);
    font-family: 'Bellefair', serif;
    font-size: 13px;
  }

  /* ── Supporters strip ── */
  .supp-strip {
    display: flex;
    flex-direction: column;
    gap: 9px;
  }
  .supp-item {
    display: flex;
    align-items: center;
    gap: 11px;
    padding: 8px 10px;
    border-radius: 12px;
    background: rgb(var(--cg-fg-rgb) / calc(0.02 * var(--cg-fg-k)));
    border: 1px solid rgb(var(--cg-fg-rgb) / calc(0.05 * var(--cg-fg-k)));
  }
  .disc-sm {
    width: 34px;
    height: 34px;
    border-radius: 50%;
    background: linear-gradient(135deg, var(--cg-g-s3), var(--cg-g-s4));
    border: 2px solid rgb(var(--cg-gold-rgb) / 0.4);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font-family: 'Cinzel', serif;
    font-weight: 700;
    font-size: 10px;
    flex-shrink: 0;
  }
  .supp-meta {
    min-width: 0;
  }
  .supp-name {
    font-family: 'Bellefair', serif;
    font-size: 13.5px;
    color: var(--cg-ink);
    line-height: 1.1;
  }
  .supp-role {
    font-family: 'Bellefair', serif;
    font-size: 11px;
    color: var(--cg-dim);
    margin-top: 2px;
  }

  /* ── Invite strip ── */
  .invite {
    position: relative;
    margin-top: 22px;
    padding: 30px 22px;
    border: 1px solid rgb(var(--cg-gold-rgb) / 0.28);
    border-radius: 22px;
    background:
      radial-gradient(
        120% 80% at 0% 0%,
        rgb(var(--cg-gold-rgb) / 0.07),
        transparent 60%
      ),
      radial-gradient(
        120% 80% at 100% 100%,
        rgb(var(--cg-pinkd-rgb) / 0.07),
        transparent 60%
      ),
      var(--cg-s1);
    overflow: hidden;
    text-align: center;
  }
  @media (min-width: 640px) {
    .invite {
      padding: 40px 30px;
      border-radius: 24px;
    }
  }
  .invite-decor {
    position: absolute;
    inset: 0;
    pointer-events: none;
    opacity: 0.5;
    background: repeating-linear-gradient(
      135deg,
      rgb(var(--cg-gold-rgb) / 0.04) 0 1px,
      transparent 1px 16px
    );
  }
  .invite-body {
    position: relative;
  }
  .invite-eyebrow {
    font-family: 'Cinzel', serif;
    font-size: 11px;
    letter-spacing: 0.32em;
    text-transform: uppercase;
    color: var(--cg-muted);
    margin-bottom: 12px;
  }
  .invite-h2 {
    margin: 0;
    font-family: 'Sababa', 'Heebo', sans-serif;
    font-size: clamp(22px, 5vw, 32px);
    font-weight: 700;
    line-height: 1.2;
    color: var(--cg-ink);
  }
  .invite-p {
    margin: 14px auto 22px;
    max-width: 560px;
    font-family: 'Bellefair', serif;
    font-size: clamp(13px, 2vw, 15px);
    color: var(--cg-muted);
    line-height: 1.7;
  }
  .invite-share {
    margin-top: 16px;
  }
  .own-wish {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 18px;
    flex-wrap: wrap;
    margin-top: 18px;
    padding: 18px 22px;
    border-radius: 18px;
    border: 1px solid rgba(191, 149, 63, 0.35);
    background: linear-gradient(135deg, rgba(191, 149, 63, 0.08), rgba(255, 77, 158, 0.06));
  }
  .own-wish-h3 {
    margin: 0 0 4px;
    font-size: 18px;
    font-weight: 800;
  }
  .own-wish-p {
    margin: 0;
    font-size: 14px;
    opacity: 0.85;
    max-width: 56ch;
  }
  .own-wish-cta {
    white-space: nowrap;
  }
  .invite-cta {
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
    justify-content: center;
  }

  /* ── Privacy strip ── */
  .privacy-strip {
    display: flex;
    gap: 10px;
    align-items: flex-start;
    padding: 14px 16px;
    background: rgb(var(--cg-mint-rgb) / 0.03);
    border: 1px dashed rgb(var(--cg-mint-rgb) / 0.2);
    border-radius: 14px;
    margin-top: 18px;
  }
  .privacy-title {
    font-family: 'Cinzel', serif;
    font-size: 11px;
    letter-spacing: 0.18em;
    color: var(--cg-mint);
    text-transform: uppercase;
    margin-bottom: 4px;
  }
  .privacy-sub {
    font-family: 'Bellefair', serif;
    font-size: 12.5px;
    color: var(--cg-muted);
    line-height: 1.55;
  }

  /* ── My proposals panel ── */
  .my-proposals {
    margin-top: 18px;
    padding: 18px;
    border: 1px solid rgb(var(--cg-mint-rgb) / 0.2);
    border-radius: 18px;
    background: rgb(var(--cg-mint-rgb) / 0.03);
  }
  .mp-hdr {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 14px;
  }
  .mp-icon { display: inline-flex; }
  .mp-title {
    font-family: 'Cinzel', serif;
    font-size: 11px;
    letter-spacing: 0.18em;
    color: var(--cg-mint);
    text-transform: uppercase;
    margin: 0;
  }
  .mp-card {
    padding: 12px 14px;
    border-radius: 12px;
    background: rgb(var(--cg-fg-rgb) / calc(0.02 * var(--cg-fg-k)));
    border: 1px solid rgb(var(--cg-fg-rgb) / calc(0.06 * var(--cg-fg-k)));
    margin-bottom: 8px;
  }
  .mp-card:last-child { margin-bottom: 0; }
  .mp-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;
  }
  .mp-kind {
    font-family: 'Bellefair', serif;
    font-size: 12px;
    color: var(--cg-muted);
  }
  .mp-status {
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.16em;
    text-transform: uppercase;
    padding: 3px 8px;
    border-radius: 999px;
  }
  .mp-status--suggested, .mp-status--viewed {
    background: rgb(var(--cg-gold-rgb) / 0.08);
    color: var(--cg-goldhi);
    border: 1px solid rgb(var(--cg-gold-rgb) / 0.2);
  }
  .mp-status--accepted {
    background: rgb(var(--cg-mint-rgb) / 0.08);
    color: var(--cg-mint);
    border: 1px solid rgb(var(--cg-mint-rgb) / 0.25);
  }
  .mp-status--rejected, .mp-status--expired {
    background: rgb(var(--cg-pink-rgb) / 0.07);
    color: var(--cg-pink);
    border: 1px solid rgb(var(--cg-pink-rgb) / 0.2);
  }
  .mp-items {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin-bottom: 8px;
  }
  .mp-chip {
    padding: 4px 10px;
    border-radius: 999px;
    font-family: 'Bellefair', serif;
    font-size: 12px;
    background: rgb(var(--cg-sky-rgb) / 0.08);
    border: 1px solid rgb(var(--cg-sky-rgb) / 0.2);
    color: var(--cg-sky);
  }
  .mp-actions { margin-top: 6px; }

  /* ── Offer modal ── */
  .ofr-overlay {
    position: fixed;
    inset: 0;
    z-index: 1200;
    background: rgb(var(--cg-shade-rgb) / calc(0.65 * var(--cg-shade-k)));
    backdrop-filter: blur(6px);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 16px;
  }
  .ofr-card {
    position: relative;
    width: min(520px, 96vw);
    max-height: 88vh;
    overflow: auto;
    background: var(--cg-s2);
    border: 1px solid rgb(var(--cg-gold-rgb) / 0.2);
    border-radius: 18px;
    padding: 26px 22px;
  }
  .ofr-x {
    position: absolute;
    inset-inline-end: 14px;
    top: 12px;
    background: transparent;
    border: none;
    color: var(--cg-muted);
    font-size: 18px;
    cursor: pointer;
  }
  .ofr-head { display: flex; align-items: center; gap: 9px; margin-bottom: 10px; }
  .ofr-gem {
    width: 9px; height: 9px; flex-shrink: 0;
    background: linear-gradient(135deg, var(--cg-g-pink), var(--cg-g-pinkd));
    transform: rotate(45deg);
    box-shadow: 0 0 10px rgb(var(--cg-pink-rgb) / 0.6);
  }
  .ofr-title { font-size: 19px; font-weight: 800; color: var(--cg-ink-hi); margin: 0; }
  .ofr-intro { font-size: 13px; color: var(--cg-muted); line-height: 1.55; margin-bottom: 16px; }
  .ofr-section-lbl {
    font-size: 9px; font-weight: 700; letter-spacing: 0.22em;
    text-transform: uppercase; color: var(--cg-muted); margin-bottom: 8px;
  }
  .ofr-chips { display: flex; flex-wrap: wrap; gap: 7px; }
  .ofr-chip {
    padding: 6px 13px;
    border-radius: 999px;
    font-family: 'Bellefair', serif;
    font-size: 13px;
    cursor: pointer;
    background: rgb(var(--cg-fg-rgb) / calc(0.04 * var(--cg-fg-k)));
    border: 1px solid rgb(var(--cg-fg-rgb) / calc(0.1 * var(--cg-fg-k)));
    color: var(--cg-ink);
    transition: all 0.15s;
  }
  .ofr-chip:hover { border-color: rgb(var(--cg-pink-rgb) / 0.4); color: var(--cg-pink); }
  .ofr-chip--sel {
    background: rgb(var(--cg-pink-rgb) / 0.12);
    border-color: rgb(var(--cg-pink-rgb) / 0.5);
    color: var(--cg-pink);
  }
  .ofr-actions { display: flex; gap: 10px; }
  .ofr-btn {
    flex: 1; padding: 12px; border-radius: 11px;
    font-size: 14px; font-weight: 700; cursor: pointer;
    text-align: center; border: 1px solid transparent;
    font-family: 'Heebo', sans-serif;
  }
  .ofr-btn:disabled { opacity: 0.45; cursor: not-allowed; }
  .ofr-btn--ghost {
    background: rgb(var(--cg-fg-rgb) / calc(0.03 * var(--cg-fg-k)));
    border-color: rgb(var(--cg-fg-rgb) / calc(0.08 * var(--cg-fg-k)));
    color: var(--cg-muted);
  }
  .ofr-btn--primary {
    background: rgb(var(--cg-pink-rgb) / 0.14);
    border-color: rgb(var(--cg-pink-rgb) / 0.4);
    color: var(--cg-pink-l);
  }
  .ofr-btn--primary:hover:not(:disabled) { background: rgb(var(--cg-pink-rgb) / 0.22); }
</style>
