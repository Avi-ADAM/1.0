<script lang="ts">
  import { page } from '$app/stores';
  import { lang } from '$lib/stores/lang.js';
  import tr from '$lib/translations/tr.json';

  const user = $derived($page.data.user || $page.data);
  const userName = $derived(user?.username || user?.un || tr.header.guest[$lang]);
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
  const navLabels: Record<string, Record<string, string>> = {
    hub: { he: 'מרכז', en: 'Hub', ar: 'المركز' },
    lev: { he: 'הלב', en: 'Heart', ar: 'القلب' },
    moach: { he: 'רקמות', en: 'Rikmot', ar: 'ركموت' }
  };
  const nl = (key: string) => navLabels[key][$lang] ?? navLabels[key].he;
</script>

<header class="header">
  <a href="/deals" class="logo">
    <img src="/deals logo.png" alt="Deals" class="logo-img" />
  </a>
  <nav class="main-nav">
    <a href="/hub" class="nav-link"><span class="nav-icon">🏠</span><span class="nav-word">{nl('hub')}</span></a>
    <a href="/lev" class="nav-link"><span class="nav-icon">💗</span><span class="nav-word">{nl('lev')}</span></a>
    <a href="/moach" class="nav-link"><span class="nav-icon">🧠</span><span class="nav-word">{nl('moach')}</span></a>
  </nav>
  <div class="right">
    <!-- TODO: re-enable once the premium tier has real meaning -->
    <!-- <div class="badge">{tr.header.premiumBadge[$lang]}</div> -->
    <!-- TODO: re-enable once the notifications button actually does something -->
    <!-- <button class="notif" aria-label={tr.header.notifications[$lang]}>
      <span>🔔</span>
      <div class="notif-dot"></div>
    </button> -->
    <button class="avatar" title={userName} aria-label={tr.header.profile[$lang]}>
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

  .notif {
    position: relative;
    width: 36px;
    height: 36px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 10px;
    background: var(--s2);
    border: 1px solid var(--border);
    cursor: pointer;
    transition: border-color 0.2s;
    font-size: 15px;
  }
  .notif:hover {
    border-color: var(--border-g);
  }
  .notif-dot {
    position: absolute;
    top: 7px;
    right: 7px;
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: var(--pink-l);
    box-shadow: 0 0 8px var(--pink-l);
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


