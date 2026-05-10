<header class="header">
  <div class="logo">
    <div class="logo-dot"></div>
    MATAN
  </div>
  <div class="right">
    <div class="badge">לקוח פרימיום</div>
    <button class="notif" aria-label="התראות">
      <span>🔔</span>
      <div class="notif-dot"></div>
    </button>
    <button class="avatar" aria-label="פרופיל">ד״ר</button>
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
    font-family: 'Cinzel', serif;
    font-size: 18px;
    color: var(--gold-l);
    letter-spacing: 3px;
    text-transform: uppercase;
    display: flex;
    align-items: center;
    gap: 10px;
    user-select: none;
  }
  .logo-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: var(--pink-l);
    box-shadow: 0 0 10px var(--pink-l);
  }

  .right {
    display: flex;
    align-items: center;
    gap: 12px;
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
  .notif:hover { border-color: var(--border-g); }
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
    transition: border-color 0.2s;
  }
  .avatar:hover { border-color: var(--gold-l); }

  @media (max-width: 600px) {
    .header { padding: 0 16px; }
    .badge  { display: none; }
  }
</style>
