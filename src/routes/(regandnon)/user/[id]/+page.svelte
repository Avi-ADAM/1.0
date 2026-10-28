<script>
  /**
   * A member's public profile — the outside view of what `/me` shows its owner.
   *
   * The member's photo is one large circle in the middle and every list they
   * have is a circle pressed against it all the way round, placed by
   * `$lib/user/ringLayout.ts` (or a scrolling grid under the photo when the
   * screen is too small for the ring to stay readable). The circles themselves
   * are `/me`'s MeOrb. The page used to be a fixed 1920×1180 SVG of
   * foreignObjects, plus the storefront as a separate white card under it that
   * nobody connected to the person above.
   *
   * The storefront (PLAN_USER_OFFERINGS §4.5) is now one circle of the orbit,
   * "what you can order", first in reading order: products and resources for
   * sale open their /gift page, a priced mission offer opens the concierge
   * with this member as the provider. Empty categories are not drawn — on a
   * public page an empty circle says nothing about the person.
   */
  import { onMount } from 'svelte';
  import { t, isRtl } from '$lib/translations';
  import { lang } from '$lib/stores/lang.js';
  import Header from '$lib/components/header/header.svelte';
  import ShareLink from '$lib/components/share/ShareLink.svelte';
  import MeOrb from '$lib/components/me/MeOrb.svelte';
  import { layoutRing } from '$lib/user/ringLayout';

  let { data } = $props();

  const DEFAULT_AVATAR =
    'https://res.cloudinary.com/love1/image/upload/v1653053361/image_s1syn2.png';

  let user = $derived(data.userData?.attributes ?? null);
  let avatar = $derived(user?.profilePic?.data?.attributes?.url ?? DEFAULT_AVATAR);

  /** A vocabulary item's name, in Hebrew from its localization when there is one. */
  function localName(item, field) {
    const loc = item.attributes.localizations?.data?.[0]?.attributes?.[field];
    return $lang == 'he' && loc ? loc : item.attributes[field];
  }
  const names = (list, field) => (list ?? []).map((it) => localName(it, field));

  /** Finished missions, one chip per mission name with how many times. */
  let doneMissions = $derived.by(() => {
    /** @type {Map<string, number>} */
    const tally = new Map();
    for (const fm of user?.finnished_missions?.data ?? []) {
      const n = fm.attributes.missionName;
      tally.set(n, (tally.get(n) ?? 0) + 1);
    }
    return [...tally].map(([name, count]) =>
      count > 1 ? $t('lev.hevel.missionCount', { name, count }) : name
    );
  });

  /** The storefront, flattened into one list of things to order. */
  let orderables = $derived.by(() => {
    const sf = data.storefront ?? {};
    return [
      ...(sf.products ?? []).map((p) => ({
        key: `p${p.id}`,
        icon: '🎁',
        kind: $t('lev.hevel.kindProduct'),
        name: p.attributes.name,
        price: p.attributes.price,
        href: `/gift/${p.id}`
      })),
      ...(sf.resources ?? []).map((r) => ({
        key: `r${r.id}`,
        icon: '🧰',
        kind: $t('lev.hevel.kindResource'),
        name: r.attributes.name,
        price: r.attributes.price,
        href: `/gift/${r.attributes.matanot.data.id}`
      })),
      ...(sf.missionOffers ?? []).map((o) => {
        const a = o.attributes;
        return {
          key: `m${o.id}`,
          icon: '🛠️',
          kind: $t('lev.hevel.kindService'),
          name: a.name || a.mission?.data?.attributes?.missionName || '',
          price:
            a.perhour > 0
              ? `${a.perhour} ${$t('offerings.storefront.per_hour')}`
              : a.price > 0
                ? a.price
                : null,
          href: `/concierge/new?provider=${data.userId}`
        };
      })
    ];
  });

  /** What their rikmas sell, each with the rikma it comes from. */
  let rikmaProducts = $derived(
    (data.storefront?.rikmaProducts ?? []).map((p) => ({
      key: `rp${p.id}`,
      icon: '🎁',
      kind: $t('lev.hevel.kindProduct'),
      name: p.attributes.name,
      price: p.attributes.price,
      from: p.attributes.projectcreates?.data?.[0]?.attributes?.projectName,
      href: `/gift/${p.id}`
    }))
  );

  /**
   * The circles, in reading order: what can be ordered from them, what they
   * are part of and have done, then who they are. Only the non-empty ones.
   */
  let orbs = $derived.by(() => {
    if (!user) return [];
    const chips = (key, title, accent, icon, items) => ({ key, title, accent, icon, items, body: chipsOrb });
    return [
      // One circle for everything orderable — their own first, then their
      // rikmas'. Two circles split the ring into smaller circles for nothing.
      { key: 'order', title: $t('lev.hevel.orderTitle'), accent: '#ea580c', icon: '🛒', items: [...orderables, ...rikmaProducts], body: orderOrb },
      {
        key: 'rikmas',
        title: $t('lev.hevel.freemates'),
        accent: '#e6007e',
        icon: '🧶',
        items: (user.projects_1s?.data ?? []).map((p) => ({
          name: p.attributes.projectName,
          href: `/project/${p.id}`
        })),
        body: chipsOrb
      },
      chips('missions', $t('lev.hevel.doneMissions'), '#7c3aed', '🛠️', doneMissions.map((name) => ({ name }))),
      chips('skills', $t('lev.hevel.skills'), '#16a34a', '🧠', names(user.skills?.data, 'skillName').map((name) => ({ name }))),
      chips('roles', $t('lev.hevel.roles'), '#db2777', '🎭', names(user.tafkidims?.data, 'roleDescription').map((name) => ({ name }))),
      chips('resources', $t('lev.hevel.resources'), '#4f46e5', '🧰', (user.sps?.data ?? []).map((s) => ({ name: s.attributes.name }))),
      chips('values', $t('lev.hevel.values'), '#ca8a04', '💛', names(user.vallues?.data, 'valueName').map((name) => ({ name }))),
      chips('workways', $t('lev.hevel.waysOfCreation'), '#0d9488', '🌿', names(user.work_ways?.data, 'workWayName').map((name) => ({ name })))
    ].filter((o) => o.items.length > 0);
  });

  let socials = $derived(
    [
      { href: user?.discordlink, title: $t('lev.hevel.toDiscord'), alt: 'Discord', src: 'https://res.cloudinary.com/love1/image/upload/v1662563246/discord-icon-svgrepo-com_d4vk6m.svg' },
      { href: user?.twiterlink, title: $t('lev.hevel.toTwitter'), alt: 'Twitter', src: 'https://visualpharm.com/assets/700/Twitter-595b40b65ba036ed117d4613.svg' },
      { href: user?.githublink, title: $t('lev.hevel.toGithub'), alt: 'GitHub', src: 'https://visualpharm.com/assets/720/Github-595b40b65ba036ed117d442f.svg' },
      { href: user?.fblink, title: $t('lev.hevel.toFacebook'), alt: 'Facebook', src: 'https://res.cloudinary.com/love1/image/upload/v1639258134/NicePng_oro-png_2336309_rkhbf8.png' }
    ].filter((s) => s.href)
  );

  // --- The ring --------------------------------------------------------------
  let vw = $state(0);
  let vh = $state(0);
  /** The footer bar's height in px, which the bar publishes as `--foot-h`. */
  let footPx = $state(0);
  function readFootH() {
    const raw = getComputedStyle(document.documentElement).getPropertyValue('--foot-h').trim();
    const n = parseFloat(raw) || 0;
    return raw.endsWith('rem')
      ? n * (parseFloat(getComputedStyle(document.documentElement).fontSize) || 16)
      : n;
  }
  onMount(() => {
    footPx = readFootH();
    const mo = new MutationObserver(() => (footPx = readFootH()));
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ['style'] });
    return () => mo.disconnect();
  });

  let layout = $derived(
    layoutRing({
      width: vw,
      height: vh,
      // The header (registered) or the join pill (guest) sits at the top.
      reserveTop: 64,
      reserveBottom: footPx,
      count: orbs.length,
      rtl: $isRtl
    })
  );
  let ring = $derived(layout.mode === 'ring' ? layout : null);
</script>

<svelte:head>
  <title>{$t('common.misc.userProfileTitle', { name: user ? user.username : $t('common.misc.profile') })}</title>
</svelte:head>
<svelte:window bind:innerWidth={vw} bind:innerHeight={vh} />

<!-- ── what each circle holds ─────────────────────────────────────────────── -->
{#snippet chipsOrb(orb)}
  {#each orb.items as it}
    {#if it.href}
      <a class="orb-chip link" href={it.href} dir="auto" data-sveltekit-preload-data>{it.name}</a>
    {:else}
      <span class="orb-chip" dir="auto">{it.name}</span>
    {/if}
  {/each}
{/snippet}

{#snippet orderOrb(orb)}
  {#each orb.items as it (it.key)}
    <a
      class="orb-chip link u-buy"
      href={it.href}
      dir="auto"
      title="{it.kind}{it.from ? ` · ${it.from}` : ''} · {$t('offerings.storefront.order')}"
    >
      <span aria-hidden="true">{it.icon}</span>
      <span class="sr-only">{it.kind}:</span>
      <span>
        {it.name}{#if it.price}<span class="u-price"> · {it.price}</span>{/if}
        {#if it.from}<span class="u-from">{it.from}</span>{/if}
      </span>
    </a>
  {/each}
  {#if orb.key === 'order'}<p class="orb-empty u-hint">{$t('lev.hevel.orderHint')}</p>{/if}
{/snippet}

{#if data.isRegisteredUser}
  <Header />
{/if}

<div class="u-page" class:stack={!ring} dir={$isRtl ? 'rtl' : 'ltr'}>
  <div class="bg-orb bg-orb-tr"></div>
  <div class="bg-orb bg-orb-bl"></div>

  {#if user}
    <!-- Outside the badge: its foreignObjects would clip the share dropdown. -->
    <div class="share-fab">
      <ShareLink path={`/user/${data.userId}`} title={user.username} desc={$t('ui.share.user')} align="start" size={22} />
    </div>
  {/if}

  {#if !data.isRegisteredUser}
    <div class="join-pill">
      <span>{$t('lev.hevel.joinCta')}</span>
      <a href="/">{$t('lev.hevel.joinBtn')}</a>
    </div>
  {/if}

  {#if !user}
    <div class="u-missing">
      <img src={DEFAULT_AVATAR} alt="" />
      <p>{$t('lev.hevel.notFound')}</p>
    </div>
  {:else}
    <div class="u-field" class:ready={vw > 0} style:height={ring ? `${ring.fieldHeight}px` : null}>
      <!-- The photo: name and bio on a fade across its lower part, links on its rim. -->
      <div
        class="u-center"
        style={ring
          ? `left:${ring.center.x - ring.center.size / 2}px;top:${ring.center.y - ring.center.size / 2}px;width:${ring.center.size}px`
          : null}
      >
        <img class="u-photo" src={avatar} alt={user.username} />
        <div class="u-caption">
          <h1 class="u-name" dir="auto">{user.username}</h1>
          {#if user.bio}
            <p class="u-bio" dir="auto">{user.bio}</p>
          {:else if orbs.length === 0}
            <p class="u-bio">{$t('lev.hevel.emptyProfile')}</p>
          {/if}
        </div>
        {#if socials.length}
          <div class="u-socials">
            {#each socials as s}
              <a class="u-social" href={s.href} target="_blank" rel="noreferrer" title={s.title}>
                <img src={s.src} alt={s.alt} />
              </a>
            {/each}
          </div>
        {/if}
      </div>

      <div class="u-orbs">
        {#each orbs as orb, i (orb.key)}
          {@const p = ring?.orbs[i]}
          <div
            class="u-orb-slot"
            style:--i={i}
            style:--from-x={p ? `${ring.center.x - p.x}px` : '0px'}
            style:--from-y={p ? `${ring.center.y - p.y}px` : '0px'}
            style={p ? `left:${p.x - ring.size / 2}px;top:${p.y - ring.size / 2}px;width:${ring.size}px` : null}
          >
            <MeOrb title={orb.title} accent={orb.accent} icon={orb.icon} count={orb.items.length}>
              {@render orb.body(orb)}
            </MeOrb>
          </div>
        {/each}
      </div>
    </div>
  {/if}
</div>

<style>
  /* ── the page: /me's light gold field, dark navy in dark mode ──────────── */
  .u-page {
    position: relative;
    width: 100%;
    /* A ring taller than a short screen, or the stack, scrolls like any page;
       `clip` cuts the blurred corner colour without making this a scroll box. */
    min-height: 100dvh;
    overflow: hidden;
    overflow: clip;
    display: flow-root;
    background: radial-gradient(circle at bottom center, var(--gold) 0%, #fdfbfb 70%);
    padding-bottom: var(--foot-pad, 0px);
    margin-bottom: calc(-1 * var(--foot-pad, 0px));
  }
  :global(.dark) .u-page {
    background: radial-gradient(circle at bottom center, rgba(212, 175, 55, 0.15) 0%, #0f172a 70%);
  }

  /* Slow drifting colour in the corners — the page's living background. */
  .u-page::before,
  .bg-orb {
    content: '';
    position: absolute;
    border-radius: 50%;
    filter: blur(40px);
    z-index: 1;
    pointer-events: none;
  }
  .u-page::before {
    width: 60vw;
    height: 60vw;
    top: -20%;
    left: -15%;
    opacity: 0.6;
    background: radial-gradient(circle, var(--barbi-pink, #ff0092) 0%, transparent 20%);
    animation: drift 25s infinite alternate ease-in-out;
  }
  .bg-orb {
    width: 50vw;
    height: 50vw;
    opacity: 0.5;
  }
  .bg-orb-tr {
    top: -15%;
    right: -10%;
    background: radial-gradient(circle, hsla(210, 100%, 65%, 0.8) 0%, transparent 60%);
    animation: drift 28s -6s infinite alternate ease-in-out;
  }
  .bg-orb-bl {
    bottom: -15%;
    left: -10%;
    background: radial-gradient(circle, hsla(280, 100%, 65%, 0.7) 0%, transparent 60%);
    animation: drift 30s -18s infinite alternate-reverse ease-in-out;
  }
  @keyframes drift {
    33% {
      transform: translate(15%, 15%) scale(1.15) rotate(10deg);
    }
    66% {
      transform: translate(-10%, 15%) scale(0.85) rotate(-10deg);
    }
    100% {
      transform: translate(10%, -10%) scale(1.05) rotate(5deg);
    }
  }

  /* ── the ring (positions from ringLayout as inline left/top/width) ─────── */
  .u-field {
    position: relative;
    z-index: 2;
    width: 100%;
  }
  .u-center,
  .u-orb-slot {
    position: absolute;
  }
  .u-orbs {
    opacity: 0;
    transition: opacity 0.35s ease;
  }
  .u-field.ready .u-orbs {
    opacity: 1;
  }
  /* The photo settles in, then the circles slide out from behind it one by
     one to their place on the ring. */
  .u-field.ready .u-center {
    animation: photo-in 0.6s both cubic-bezier(0.2, 0.8, 0.3, 1.15);
  }
  .u-field.ready .u-orb-slot {
    animation: orb-out 0.7s calc(0.15s + var(--i) * 70ms) both cubic-bezier(0.2, 0.8, 0.3, 1.15);
  }
  @keyframes photo-in {
    from {
      transform: scale(0.8);
      opacity: 0;
    }
  }
  @keyframes orb-out {
    from {
      transform: translate(var(--from-x), var(--from-y)) scale(0.3);
      opacity: 0;
    }
  }

  /* ── the photo circle ─────────────────────────────────────────────────── */
  .u-center {
    z-index: 3;
    aspect-ratio: 1;
    border-radius: 50%;
    overflow: hidden;
    isolation: isolate;
    border: 4px solid var(--gold);
    box-shadow:
      0 10px 30px rgba(0, 0, 0, 0.25),
      0 0 0 8px color-mix(in srgb, var(--gold) 22%, transparent),
      0 0 50px -6px color-mix(in srgb, var(--barbi-pink, #ff0092) 55%, transparent);
    background: #141c2e;
    container-type: inline-size;
  }
  .u-photo {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  .u-caption {
    position: absolute;
    inset-inline: 0;
    bottom: 0;
    padding: 30% 16% 13%;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.25em;
    text-align: center;
    color: #fff;
    background: linear-gradient(transparent, rgba(10, 12, 24, 0.55) 35%, rgba(10, 12, 24, 0.85));
    font-size: clamp(12px, 4.4cqi, 18px);
  }
  .u-name {
    margin: 0;
    font-size: 1.75em;
    font-weight: 800;
    line-height: 1.1;
    color: #fff;
    text-shadow: 0 2px 8px rgba(0, 0, 0, 0.5);
    overflow-wrap: anywhere;
  }
  .u-bio {
    margin: 0;
    max-width: 100%;
    color: rgba(255, 255, 255, 0.88);
    font-size: 0.95em;
    line-height: 1.35;
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 3;
    line-clamp: 3;
    overflow: hidden;
  }
  .u-socials {
    position: absolute;
    top: 7%;
    inset-inline: 0;
    display: flex;
    justify-content: center;
    gap: 0.5rem;
  }
  .u-social {
    display: grid;
    place-items: center;
    width: clamp(32px, 11cqi, 44px);
    height: clamp(32px, 11cqi, 44px);
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.92);
    box-shadow: 0 3px 10px rgba(0, 0, 0, 0.25);
    transition: transform 0.15s;
  }
  .u-social:hover {
    transform: translateY(-2px) scale(1.08);
  }
  .u-social img {
    width: 60%;
    height: 60%;
    object-fit: contain;
  }

  /* ── the stack (the ring would be unreadable on this screen) ──────────── */
  .stack .u-field {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 4.5rem 12px 2rem;
  }
  .stack .u-center {
    position: relative;
    width: min(78vw, 340px);
  }
  .stack .u-orbs {
    width: 100%;
    max-width: 1180px;
    margin-top: -1.5rem;
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 14px;
    justify-items: center;
  }
  .stack .u-orb-slot {
    position: relative;
    width: 100%;
    max-width: 250px;
  }
  /* A phone: two columns, the second dropped half a circle so the circles
     nest against each other — and the first pair tucks under the photo. */
  @media (max-width: 559px) {
    .stack .u-orbs {
      grid-template-columns: 1fr 1fr;
      gap: 10px;
      padding-bottom: 25%;
    }
    .stack .u-orb-slot {
      max-width: none;
    }
    .stack .u-orb-slot:nth-child(even) {
      translate: 0 50%;
    }
  }

  /* ── the "what you can order" circle ──────────────────────────────────── */
  .u-price {
    font-weight: 500;
    opacity: 0.75;
  }
  /* The rikma a product comes from, as a second line inside its chip. */
  .u-from {
    display: block;
    font-size: 0.8em;
    font-weight: 500;
    opacity: 0.7;
  }
  .u-hint {
    width: 100%;
    margin-top: 0.2em !important;
  }

  /* ── the gilded skin (the personal theme) ─────────────────────────────────
     The page's original look, kept: a night-sky field, every circle a disc of
     the metallic gold ramp (--gra…--gre) with a gold rim, the title in pink
     and each item a pink pill with gold lettering. The business theme keeps
     MeOrb's plain cream circles. */
  :global(html.personal) .u-page {
    background: linear-gradient(135deg, #000 0%, #0f172a 35%, #1e293b 60%, #475569 85%, #94a3b8 100%);
  }
  :global(html.personal) .u-page::before,
  :global(html.personal) .bg-orb {
    opacity: 0.35;
  }
  :global(html.personal) .u-center {
    border-color: var(--gra);
    box-shadow:
      0 10px 30px rgba(0, 0, 0, 0.5),
      0 0 0 6px var(--gre),
      0 0 0 9px var(--grb),
      0 0 60px -4px color-mix(in srgb, var(--gra) 70%, transparent);
  }
  :global(html.personal) .u-orbs :global(.orb) {
    --orb-bg: var(--grb);
    --orb-text: #3b2a05;
    --orb-muted: #5c4410;
    --ink: var(--barbi-pink, #ff0092);
    background: linear-gradient(135deg, var(--gra), var(--grb) 30%, #b38728 55%, #fbf5b7 78%, var(--gre));
    border: max(3px, 1.6cqi) solid var(--gold);
    box-shadow:
      0 8px 22px rgba(0, 0, 0, 0.45),
      inset 0 0 18px rgba(255, 255, 255, 0.35),
      0 0 26px -6px color-mix(in srgb, var(--gra) 80%, transparent);
  }
  :global(html.personal) .u-orbs :global(.orb-title) {
    color: var(--barbi-pink, #ff0092);
    text-shadow: 0 1px 0 rgba(255, 255, 255, 0.55);
  }
  :global(html.personal) .u-orbs :global(.orb-count) {
    background: var(--barbi-pink, #ff0092);
    color: var(--grb);
  }
  :global(html.personal) .u-orbs :global(.orb-chip),
  :global(html.personal) .u-orbs :global(a.orb-chip.link) {
    background: var(--barbi-pink, #ff0092);
    border-color: var(--gre);
    color: var(--grb);
    font-weight: 700;
  }
  :global(html.personal) .u-orbs :global(a.orb-chip.link:hover) {
    background: color-mix(in srgb, var(--barbi-pink, #ff0092) 80%, #000);
  }
  :global(html.personal) .u-orbs :global(.orb-empty) {
    color: #5c4410;
  }

  /* ── chrome ───────────────────────────────────────────────────────────── */
  .share-fab {
    position: fixed;
    top: 120px;
    inset-inline-start: 0.75rem;
    z-index: 20;
    background: rgba(255, 255, 255, 0.92);
    border-radius: 9999px;
    padding: 0.35rem;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
  }
  .join-pill {
    position: absolute;
    top: 0.75rem;
    left: 50%;
    translate: -50% 0;
    z-index: 10;
    display: flex;
    align-items: center;
    gap: 0.75rem;
    max-width: calc(100% - 24px);
    padding: 0.4rem 0.4rem 0.4rem 1rem;
    padding-inline: 1rem 0.4rem;
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.92);
    color: #2b2620;
    font-size: 0.9rem;
    font-weight: 600;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
    backdrop-filter: blur(6px);
  }
  .join-pill a {
    flex: none;
    padding: 0.35rem 1rem;
    border-radius: 999px;
    background: var(--barbi-pink, #ff0092);
    color: #fff;
    font-weight: 800;
  }
  .u-missing {
    position: relative;
    z-index: 2;
    min-height: 100dvh;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 1rem;
    color: #2b2620;
    font-size: 1.25rem;
    font-weight: 700;
  }
  :global(.dark) .u-missing {
    color: #f1ede4;
  }
  .u-missing img {
    width: 120px;
    height: 120px;
    border-radius: 50%;
    opacity: 0.6;
  }

  @media (prefers-reduced-motion: reduce) {
    .u-page::before,
    .bg-orb,
    .u-field.ready .u-center,
    .u-field.ready .u-orb-slot {
      animation: none;
    }
    .u-orbs,
    .u-social {
      transition: none;
    }
  }
</style>
