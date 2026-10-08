<script lang="ts">
  import { page } from '$app/stores';
  import EntityIcon from '$lib/celim/icons/EntityIcon.svelte';
  import ConciergeBell from '$lib/components/concierge/ConciergeBell.svelte';
  // Tokens only (:root + html.* blocks) — the bell paints from them.
  import '$lib/styles/concierge.css';
  import { t } from '$lib/translations';
  import type { Notice } from '$lib/notices';

  // The deals bell (docs/inprogress/PLAN_SMART_NOTICES.md §6.2). The layout streams
  // `dealNotices` as a promise. It is resolved into state here rather than read
  // with {#await}: an approval reloads the layout, which hands a *new* promise
  // to the same block, and an {#await} whose input changes late renders into a
  // dead subtree. `undefined` = not here yet, so no bell flashes "nothing".
  let dealNotices: Notice[] | null | undefined = $state(undefined);
  $effect(() => {
    const pending = $page.data?.dealNotices as Promise<Notice[] | null> | undefined;
    if (!pending || typeof (pending as any).then !== 'function') return;
    let live = true;
    pending.then(
      (list) => live && (dealNotices = list),
      () => live && (dealNotices = null)
    );
    return () => {
      live = false;
    };
  });

  const user = $derived($page.data.user || $page.data);
  const userName = $derived(user?.username || user?.un || $t('header.guest'));
  const profilePic = $derived(user?.profilePic);
  
  const initials = $derived(
    userName
      .split(' ')
      .filter(Boolean)
      .map((n: string) => n[0])
      .join('')
      .slice(0, 2)
      .toUpperCase() || '??'
  );

  // Way back home: the deals screens sit outside the (reg) layout, so the
  // header carries its own links to the app's main screens.
  const nl = (key: string) => $t(`common.nav.${key}`);
</script>

<header class="header">
  <a href="/deals" class="logo">
    <img src="/deals logo.png" alt="Deals" class="logo-img" />
  </a>
  <nav class="main-nav">
    <a href="/hub" class="nav-link"><span class="nav-icon"><EntityIcon kind="home" size={18} /></span><span class="nav-word">{nl('hub')}</span></a>
    <a href="/lev" class="nav-link"><span class="nav-icon"><EntityIcon kind="lev" size={18} /></span><span class="nav-word">{nl('lev')}</span></a>
    <a href="/moach" class="nav-link"><span class="nav-icon"><EntityIcon kind="moach" size={18} /></span><span class="nav-word">{nl('moach')}</span></a>
  </nav>
  <div class="right">
    <!-- TODO: re-enable once the premium tier has real meaning -->
    <!-- <div class="badge">{$t('header.premiumBadge')}</div> -->
    {#if dealNotices !== undefined}
      <ConciergeBell items={[]} notices={dealNotices}>
        <EntityIcon kind="notifications" size={18} />
      </ConciergeBell>
    {/if}
    <button class="avatar" title={userName} aria-label={$t('header.profile')}>
      {#if profilePic}
        <img src={profilePic} alt={userName} class="avatar-img" />
      {:else}
        {initials}
      {/if}
    </button>
  </div>
</header>

<style>
  .header {
    position: sticky;
    top: 0;
    z-index: 100;
    background: rgba(7, 6, 6, 0.85);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border-bottom: 1px solid var(--border-g);
    padding: 0 32px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    height: 64px;
  }

  .logo {
    display: flex;
    align-items: center;
    gap: 10px;
    user-select: none;
    text-decoration: none;
    transition: transform 0.2s;
  }
  .logo:hover {
    transform: scale(1.02);
  }
  .logo-img {
    height: 32px;
    width: auto;
    display: block;
    filter: drop-shadow(0 0 8px rgba(212, 175, 55, 0.2));
  }

  .right {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .main-nav {
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .nav-link {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 4px 10px;
    border-radius: 20px;
    border: 1px solid var(--border);
    background: var(--s2);
    color: var(--gold-l);
    font-size: 12px;
    font-weight: 600;
    text-decoration: none;
    transition: border-color 0.2s, transform 0.2s;
  }
  .nav-link:hover {
    border-color: var(--border-g);
    transform: translateY(-1px);
  }
  .nav-icon {
    font-size: 13px;
    line-height: 1;
  }

  .badge {
    background: var(--pink-d);
    border: 1px solid rgba(200, 21, 95, 0.3);
    color: var(--pink-l);
    border-radius: 20px;
    padding: 4px 14px;
    font-size: 12px;
    font-weight: 600;
  }

  .avatar {
    width: 38px;
    height: 38px;
    border-radius: 50%;
    border: 2px solid var(--gold);
    background: linear-gradient(135deg, var(--s3), var(--s4));
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 13px;
    font-weight: 700;
    color: var(--gold-l);
    cursor: pointer;
    font-family: 'Heebo', sans-serif;
    transition: all 0.2s;
    text-transform: uppercase;
    padding: 0;
    overflow: hidden;
  }
  .avatar:hover {
    border-color: var(--gold-l);
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(212, 175, 55, 0.2);
  }
  .avatar-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  @media (max-width: 600px) {
    .header {
      padding: 0 16px;
    }
    .badge {
      display: none;
    }
    /* Narrow screens: keep the way-back links, drop the words */
    .nav-word {
      display: none;
    }
    .nav-link {
      padding: 4px 8px;
    }
  }
</style>


