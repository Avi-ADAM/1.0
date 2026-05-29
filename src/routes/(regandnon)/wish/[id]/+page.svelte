<script>
  import { onMount, onDestroy } from 'svelte';
  import { showFoot } from '$lib/stores/showFoot.js';
  import { page } from '$app/stores';

  /** @type {{ data: { wish: any | null; proposalsCount: number; loadOk: boolean } }} */
  let { data } = $props();

  onMount(() => showFoot.set(false));
  onDestroy(() => showFoot.set(true));

  const HE_MONTHS = ['ינו','פבר','מרץ','אפר','מאי','יוני','יולי','אוג','ספט','אוק','נוב','דצמ'];
  function fmtDate(iso) {
    if (!iso) return 'גמיש';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return 'גמיש';
    return `${d.getDate()} ב${HE_MONTHS[d.getMonth()]}`;
  }
  function fmtBudget(n) {
    if (n == null || !Number.isFinite(+n)) return 'לפי הצעה';
    return `₪ ${(+n).toLocaleString('he-IL')}`;
  }
  function relativePublishedAt(iso) {
    if (!iso) return '';
    const d = new Date(iso).getTime();
    if (!d) return '';
    const diff = (Date.now() - d) / 1000;
    if (diff < 3600)   return `פורסמה לפני ${Math.round(diff/60)} דקות`;
    if (diff < 86400)  return `פורסמה לפני ${Math.round(diff/3600)} שעות`;
    if (diff < 604800) return `פורסמה לפני ${Math.round(diff/86400)} ימים`;
    return `פורסמה לפני ${Math.round(diff/604800)} שבועות`;
  }

  /* ===== Mock fallback — used when no real data ===== */
  const MOCK_WISH = {
    code: 'R-7f3a91',
    title: 'יום חופש לאמא ליום הולדתה',
    long:  'אמא שלי מטפלת בילדים כל יום ובקרוב יום הולדתה. אני רוצה לתת לה יום שלם משוחרר — טיפול ספא, ארוחה טובה, מישהי שתשגיח על הילדים, ובן אדם שיבטיח שתגיע ותחזור בשלום. מבקשת לארגן את הכל מראש בלי שתעשה אפילו פנייה אחת.',
    author: 'נעה ב.',
    avatar: 'נב',
    project: 'אזרחית פרטית · חיפה',
    publishedAt: 'פורסמה אתמול 21:14',
    when:   'ה׳, 19 ביוני · יום שישי',
    where:  'חיפה והקריות',
    budget: '₪ 850–1,200',
    proposalsCount: 6,
    accessNote: 'משאלה ציבורית · נראית לכל מבקרת/ת',
  };

  const MOCK_MISSIONS = [
    { name: 'בייביסיטר',    hours: 6,   imp: 'must' },
    { name: 'הסעה',          hours: 2,   imp: 'must' },
    { name: 'טיפול ספא',     hours: 2,   imp: 'must' },
    { name: 'הזמנת מסעדה',   hours: 0.5, imp: 'nice' },
  ];
  const MOCK_RESOURCES = [
    { name: 'מקום שקט וצמחי', qty: 1, imp: 'must' },
    { name: 'ארוחה לשניים',   qty: 2, imp: 'nice' },
    { name: 'זר פרחים',       qty: 1, imp: 'nice' },
  ];
  const MOCK_VALUES = ['הדדיות', 'נדיבות', 'משפחתיות'];

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
          accessNote: 'משאלה ציבורית · נראית לכל מבקרת/ת',
        }
      : MOCK_WISH
  );

  const MISSIONS = $derived(
    data?.wish?.extractedMissions?.length
      ? data.wish.extractedMissions.map((m) => ({
          name: m.name,
          hours: m.hoursEst ?? 0,
          imp: m.importance === 'must' ? 'must' : 'nice',
        }))
      : MOCK_MISSIONS
  );
  const RESOURCES = $derived(
    data?.wish?.extractedResources?.length
      ? data.wish.extractedResources.map((r) => ({
          name: r.name,
          qty: r.quantityEst ?? 1,
          imp: r.importance === 'must' ? 'must' : 'nice',
        }))
      : MOCK_RESOURCES
  );
  const VALUES = $derived(
    data?.wish?.values?.length ? data.wish.values : MOCK_VALUES
  );

  const SUPPORTERS = [
    { avatar: 'נג', name: 'נועה גולן',  role: 'ספא טבע',           color: 'green' },
    { avatar: 'תל', name: 'תמר ל.',     role: 'אמהות עוזרות',      color: 'green' },
    { avatar: 'יכ', name: 'יואב כ.',    role: 'Lift · הסעות',       color: 'blue'  },
    { avatar: '+3', name: 'ועוד 3',    role: 'בוחנות בימים אלה',  color: 'gold'  },
  ];

  function discBorder(c) { return c === 'green' ? 'rgba(2,255,187,0.6)' : c === 'blue' ? 'rgba(116,191,255,0.6)' : 'rgba(238,232,170,0.5)'; }
  function discColor(c)  { return c === 'green' ? '#02ffbb' : c === 'blue' ? '#74bfff' : '#fde68a'; }
  function gemCls(imp)   { return imp === 'must' ? 'gem' : 'gem gem-gold'; }

  let copied = $state(false);
  function copyLink() {
    try {
      navigator.clipboard?.writeText(window.location.href);
      copied = true;
      setTimeout(() => copied = false, 1800);
    } catch {}
  }

  const wishId = $derived($page.params.id);
</script>

<svelte:head>
  <title>{wish.title} · משאלה 1💗1</title>
  <meta name="description" content={wish.long.slice(0, 160)} />
</svelte:head>

<!-- ===================================================================
     PUBLIC WISH VIEW — /wish/[id]  (M2 · read-only · share-friendly)
     =================================================================== -->
<div class="cp" dir="rtl">

  <!-- ── HEADER ─────────────────────────────────────────────────────── -->
  <header class="hdr">
    <div class="hdr-logo">
      <img src="/coin-logo.png" class="hdr-coin" alt="1lev1" />
      <div class="hdr-brand">
        <span class="hdr-dot"></span>
        <span class="hdr-name">Concierge</span>
        <span class="hdr-sub hide-xs">· משאלה ציבורית</span>
      </div>
    </div>

    <nav class="hdr-nav hide-sm">
      <a href="/concierge" class="nav-lnk">משאלות</a>
      <a href="/about" class="nav-lnk">מה זה 1💗1</a>
    </nav>

    <div class="hdr-right">
      <a href="/login" class="btn-ghost btn-xs">התחברי</a>
      <a href="/register" class="btn-ghost btn-xs hide-xs">הצטרפי</a>
    </div>
  </header>

  <!-- ── SHELL ──────────────────────────────────────────────────────── -->
  <div class="shell">
    <div class="wrap">

      <!-- TOP BAR -->
      <div class="topbar anim anim-d1">
        <a href="/concierge" class="btn-ghost btn-xs">⟵ חזרה למשאלות</a>
        <div class="topbar-right">
          <span class="code-lbl hide-xs">קוד משאלה</span>
          <code class="wish-code">{wish.code}</code>
          <button class="btn-ghost btn-xs" onclick={copyLink}>
            {copied ? '✓ הועתק' : '📤 שתפי'}
          </button>
        </div>
      </div>

      <!-- WISH HERO -->
      <div class="facet wish-glow anim anim-d1">
        <div class="hero-inner">
          <div class="hero-av">{wish.avatar}</div>
          <div class="hero-body">
            <div class="hero-meta">
              <span class="badge-open">משאלה פתוחה לעזרה</span>
              <span class="dim">·</span>
              <span class="muted">{wish.publishedAt}</span>
              <span class="dim hide-xs">·</span>
              <span class="muted hide-xs">מאת {wish.author} · {wish.project}</span>
            </div>
            <h1 class="hero-title">{wish.title}</h1>
            <p class="hero-long">{wish.long}</p>
          </div>
        </div>
        <div class="hero-footer">
          <div class="hero-metas">
            {#each [['📅','ליום', wish.when],['📍','באזור', wish.where],['💰','תקציב', wish.budget]] as [icon, lbl, val] (lbl)}
              <div class="metai">
                <span class="mi-icon">{icon}</span>
                <div><div class="mi-lbl">{lbl}</div><div class="mi-val">{val}</div></div>
              </div>
            {/each}
          </div>
          <div class="hero-cta-wrap">
            <a href={`/login?next=/concierge/${wishId}`} class="btn-jewel">💗 אני יכולה לעזור</a>
          </div>
        </div>
      </div>

      <!-- EXTRACTION STRIP (read-only) -->
      <div class="extstrip anim anim-d2">
        <div class="extstrip-hdr">
          <img src="/botlogo.jpeg" class="bot-av" alt="Lev" />
          <div class="ext-labels">
            <div class="lev-title">Lev פירקה למענה</div>
            <div class="lev-sub">
              ככה חילקנו את המשאלה עם {wish.author}. כל חלק יכול להיות מאוייש בנפרד.
            </div>
          </div>
          <span class="sbadge ready">{wish.proposalsCount} הצעות פעילות</span>
        </div>
        <div class="extgrid">
          <div>
            <div class="extcol-lbl">✦  משימות</div>
            <div class="chips">
              {#each MISSIONS as m (m.name)}
                <span class="chip {m.imp}">
                  <span class="{gemCls(m.imp)}" style="width:6px;height:6px"></span>
                  {m.name} · <span style="opacity:.7">{m.hours} שע׳</span>
                </span>
              {/each}
            </div>
          </div>
          <div>
            <div class="extcol-lbl">◐  משאבים</div>
            <div class="chips">
              {#each RESOURCES as r (r.name)}
                <span class="chip {r.imp}">
                  <span class="{gemCls(r.imp)}" style="width:6px;height:6px"></span>
                  {r.name} {r.qty ? `· ×${r.qty}` : ''}
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
          <h4>הערכים שמובילים את המשאלה</h4>
          <div class="values-row">
            {#each VALUES as v (v)}
              <span class="val-pill">{v}</span>
            {/each}
          </div>
          <p class="panel-note">
            כשתציעי עזרה — חשוב להגיד אם הערכים האלה משקפים גם אותך. זה מה שיעזור ל־{wish.author} לבחור.
          </p>
        </div>

        <!-- Supporters preview -->
        <div class="panel">
          <h4>כבר עמך</h4>
          <div class="supp-strip">
            {#each SUPPORTERS as s (s.name)}
              <div class="supp-item">
                <div class="disc-sm" style="border-color:{discBorder(s.color)};color:{discColor(s.color)}">{s.avatar}</div>
                <div class="supp-meta">
                  <div class="supp-name">{s.name}</div>
                  <div class="supp-role">{s.role}</div>
                </div>
              </div>
            {/each}
          </div>
          <p class="panel-note">
            יש מקום לעוד שותפה — במיוחד לחלקים שעדיין לא אוישו.
          </p>
        </div>

      </div>

      <!-- INVITE STRIP -->
      <div class="invite anim anim-d3">
        <div class="invite-decor"></div>
        <div class="invite-body">
          <div class="invite-eyebrow">◈ ───── איך לעזור ───── ◈</div>
          <h2 class="invite-h2">יש לך פיסה לתת? בואי נחבר.</h2>
          <p class="invite-p">
            פתחנו את המשאלה לקהילה כדי שהשותפות יגיעו ממקומות בלתי־צפויים. אם יש לך זמן,
            מיומנות, מרחב או חיבור שיכול לעזור לחלק כלשהו — Lev תעזור לך להציע בלי
            לחץ ובלי התחייבות. הסכמה תיווצר רק כש{wish.author} תאשר.
          </p>
          <div class="invite-cta">
            <a href={`/login?next=/concierge/${wishId}`} class="btn-jewel">💗 אני יכולה לעזור</a>
            <a href="/concierge" class="btn-ghost">משאלות אחרות בקהילה</a>
          </div>
        </div>
      </div>

      <!-- Privacy footer -->
      <div class="privacy-strip anim anim-d3">
        <span style="font-size:14px">🔒</span>
        <div>
          <div class="privacy-title">{wish.accessNote}</div>
          <div class="privacy-sub">
            רק בעלת המשאלה רואה את ההצעות שלך — בלי חשיפה לקהל. אם תרצי לכתוב,
            נצטרך התחברות קלה כדי שיהיה ל־{wish.author} עם מי לדבר.
          </div>
        </div>
      </div>

    </div><!-- /wrap -->
  </div><!-- /shell -->
</div><!-- /cp -->

<style>
  @import url('https://fonts.googleapis.com/css2?family=Bellefair&family=Cinzel:wght@400;600;700&family=Heebo:wght@300;400;500;600;700;800&display=swap');

  /* ── Page shell ── */
  .cp { background:#070606; color:#ede5d8; font-family:'Heebo','Rubik',system-ui,sans-serif; min-height:100vh; position:relative; }
  .cp::before {
    content:''; position:fixed; inset:0; z-index:0; pointer-events:none;
    background:
      radial-gradient(ellipse 70% 50% at 10% -10%,  rgba(200,150,12,.10) 0%,transparent 55%),
      radial-gradient(ellipse 60% 65% at 90% 110%,  rgba(200,21,95,.09)  0%,transparent 55%),
      radial-gradient(ellipse 50% 40% at 50%  50%,  rgba(2,255,187,.035) 0%,transparent 60%);
  }
  .shell { position:relative; z-index:1; min-height:100vh; padding-bottom:80px; }
  .wrap  { max-width:980px; margin:0 auto; padding:0 14px; }
  @media(min-width:640px)  { .wrap { padding:0 22px; } }
  @media(min-width:1024px) { .wrap { padding:0 28px; } }

  /* ── Responsive helpers ── */
  @media(max-width:479px) { .hide-xs { display:none !important; } }
  @media(max-width:767px) { .hide-sm { display:none !important; } }

  /* ── Animations ── */
  @keyframes fadeUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
  @keyframes wishGlow {
    0%,100% { box-shadow:0 0 0 1px rgba(238,232,170,.35) inset,0 0 30px rgba(238,232,170,.18),0 0 80px rgba(200,21,95,.18); }
    50%     { box-shadow:0 0 0 1px rgba(238,232,170,.5)  inset,0 0 44px rgba(238,232,170,.28),0 0 120px rgba(200,21,95,.28); }
  }
  .anim    { animation:fadeUp .45s cubic-bezier(.16,1,.3,1) both; }
  .anim-d1 { animation-delay:.05s; }
  .anim-d2 { animation-delay:.12s; }
  .anim-d3 { animation-delay:.20s; }
  .wish-glow { animation:fadeUp .45s cubic-bezier(.16,1,.3,1) both, wishGlow 4.5s ease-in-out .6s infinite; }

  /* ── Header ── */
  .hdr {
    position:sticky; top:0; z-index:100;
    background:rgba(7,6,6,.84); backdrop-filter:blur(20px); -webkit-backdrop-filter:blur(20px);
    border-bottom:1px solid rgba(200,150,12,.2);
    padding:0 14px; height:60px;
    display:flex; align-items:center; justify-content:space-between; gap:10px;
  }
  @media(min-width:640px) { .hdr { padding:0 24px; height:64px; } }
  .hdr-logo  { display:flex; align-items:center; gap:10px; flex-shrink:0; }
  .hdr-coin  { width:28px; height:28px; border-radius:50%; box-shadow:0 0 14px rgba(238,232,170,.4); }
  .hdr-brand { display:flex; align-items:center; gap:8px; }
  .hdr-dot   { width:6px; height:6px; border-radius:50%; background:#02ffbb; box-shadow:0 0 10px #02ffbb; }
  .hdr-name  { font-family:'Cinzel',serif; font-size:clamp(13px,3vw,18px); color:#f0c040; letter-spacing:.22em; text-transform:uppercase; }
  .hdr-sub   { font-family:'Bellefair',serif; font-size:13px; color:#9a8f80; }
  .hdr-nav   { display:flex; gap:20px; align-items:center; }
  .nav-lnk   { font-size:13px; color:#9a8f80; text-decoration:none; letter-spacing:.02em; transition:color .2s; }
  .nav-lnk:hover { color:#fde68a; }
  .hdr-right { display:flex; align-items:center; gap:8px; flex-shrink:0; }

  /* ── Top bar ── */
  .topbar { display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:12px; padding:18px 0 14px; }
  .topbar-right { display:flex; gap:8px; align-items:center; flex-wrap:wrap; }
  .code-lbl   { font-family:'Bellefair',serif; font-size:12px; color:#9a8f80; }
  .wish-code  { font-family:'Fira Mono',monospace; font-size:11px; color:#fde68a; background:rgba(238,232,170,.08); padding:4px 10px; border-radius:6px; letter-spacing:.06em; border:1px solid rgba(238,232,170,.2); }

  /* ── Buttons ── */
  .btn-jewel {
    display:inline-flex; align-items:center; gap:8px; padding:12px 22px; border:none; cursor:pointer;
    border-radius:14px; font-family:'Sababa','Heebo',sans-serif; font-weight:700; font-size:15px;
    color:#fde68a; white-space:nowrap; text-decoration:none;
    background:linear-gradient(135deg,#c8155f,#ff4d9e);
    box-shadow:inset 1px 1px 0 rgba(255,255,255,.25),inset -1px -1px 0 rgba(0,0,0,.4),0 6px 20px rgba(200,21,95,.4);
    transition:transform .2s;
  }
  .btn-jewel:hover { transform:translateY(-1px); }
  .btn-ghost { background:transparent; border:1px solid rgba(255,255,255,.1); color:#9a8f80; padding:9px 16px; border-radius:12px; font-size:13px; cursor:pointer; transition:all .2s; text-decoration:none; display:inline-flex; align-items:center; white-space:nowrap; }
  .btn-ghost:hover { color:#ede5d8; border-color:rgba(238,232,170,.3); background:rgba(238,232,170,.04); }
  .btn-xs { padding:7px 12px; font-size:12px; }

  /* ── Gems ── */
  .gem { width:8px; height:8px; display:inline-block; background:linear-gradient(135deg,#ff4d9e,#c8155f); transform:rotate(45deg); box-shadow:0 0 12px rgba(255,77,158,.7); flex-shrink:0; }
  .gem-gold { background:linear-gradient(135deg,#fde68a,#aa771c); box-shadow:0 0 12px rgba(238,232,170,.7); }

  /* ── Status badges ── */
  .sbadge { display:inline-flex; align-items:center; gap:6px; padding:5px 12px; border-radius:999px; font-size:11px; font-weight:700; letter-spacing:.16em; text-transform:uppercase; }
  .sbadge::before { content:''; width:6px; height:6px; border-radius:50%; }
  .sbadge.ready   { background:rgba(2,255,187,.08); color:#02ffbb; border:1px solid rgba(2,255,187,.3); }
  .sbadge.ready::before { background:#02ffbb; box-shadow:0 0 8px #02ffbb; }

  /* ── Chips ── */
  .chip { display:inline-flex; align-items:center; gap:6px; padding:5px 11px; border-radius:999px; font-family:'Bellefair',serif; font-size:12.5px; background:rgba(255,255,255,.04); border:1px solid rgba(255,255,255,.08); color:#ede5d8; }
  .chip.must { background:rgba(255,0,146,.10); border-color:rgba(255,0,146,.35); color:#ff4d9e; }
  .chip.nice { background:rgba(238,232,170,.07); border-color:rgba(238,232,170,.25); color:#fde68a; }

  /* ── Wish hero ── */
  .facet {
    position:relative;
    background:linear-gradient(180deg,rgba(238,232,170,.04),rgba(7,6,6,0)),linear-gradient(135deg,rgba(255,77,158,.05),rgba(7,6,6,0));
    border:1px solid rgba(238,232,170,.22); border-radius:20px; padding:22px 18px; overflow:hidden;
  }
  @media(min-width:640px) { .facet { border-radius:26px; padding:34px 38px; } }
  .facet::before { content:''; position:absolute; top:-1px; inset-inline-start:28px; width:14px; height:14px; background:linear-gradient(135deg,#fde68a,#aa771c); transform:rotate(45deg); box-shadow:0 0 14px rgba(238,232,170,.7); border-radius:2px; }
  .facet::after  { content:''; position:absolute; top:-1px; inset-inline-end:28px;  width:14px; height:14px; background:linear-gradient(135deg,#ff4d9e,#c8155f); transform:rotate(45deg); box-shadow:0 0 14px rgba(255,77,158,.7);  border-radius:2px; }

  .hero-inner { display:flex; align-items:flex-start; gap:14px; }
  @media(min-width:640px) { .hero-inner { gap:22px; } }
  .hero-av {
    width:48px; height:48px; border-radius:50%; background:linear-gradient(135deg,#c8155f,#ff4d9e); border:2px solid #eee8aa; flex-shrink:0;
    display:flex; align-items:center; justify-content:center; font-family:'Cinzel',serif; font-weight:700; font-size:14px; color:#fde68a;
    box-shadow:0 0 22px rgba(255,77,158,.4);
  }
  @media(min-width:640px) { .hero-av { width:64px; height:64px; font-size:18px; } }
  .hero-body { flex:1; min-width:0; }
  .hero-meta { display:flex; align-items:center; gap:7px; margin-bottom:10px; flex-wrap:wrap; }
  .badge-open { font-size:10px; font-weight:700; letter-spacing:.22em; text-transform:uppercase; color:#fde68a; }
  .muted { font-family:'Bellefair',serif; font-size:12px; color:#9a8f80; }
  .dim   { color:#52493e; font-size:11px; }
  .hero-title { margin:0; font-family:'Sababa','Heebo',sans-serif; font-size:clamp(22px,5vw,38px); font-weight:700; line-height:1.15; color:#ede5d8; }
  .hero-long  { margin:12px 0 0; font-family:'Bellefair',serif; font-size:clamp(14px,2vw,16px); line-height:1.65; color:#c8bba8; }

  .hero-footer { margin-top:20px; padding-top:16px; border-top:1px solid rgba(238,232,170,.14); display:flex; justify-content:space-between; align-items:center; gap:12px; flex-wrap:wrap; }
  .hero-metas  { display:flex; gap:14px; flex-wrap:wrap; }
  .metai  { display:flex; align-items:center; gap:9px; }
  .mi-icon { font-size:14px; opacity:.85; }
  .mi-lbl  { font-size:9px; letter-spacing:.2em; text-transform:uppercase; color:#52493e; }
  .mi-val  { font-family:'Bellefair',serif; font-size:13px; color:#ede5d8; }
  .hero-cta-wrap { display:flex; gap:10px; flex-wrap:wrap; }

  /* ── Extraction strip ── */
  .extstrip { margin-top:16px; padding:18px 16px; border:1px solid rgba(116,191,255,.18); border-radius:18px; background:linear-gradient(180deg,rgba(116,191,255,.04),rgba(116,191,255,.01)); }
  @media(min-width:640px) { .extstrip { padding:22px 26px; border-radius:20px; } }
  .extstrip-hdr { display:flex; align-items:center; gap:12px; margin-bottom:14px; flex-wrap:wrap; }
  .bot-av { width:28px; height:28px; border-radius:50%; flex-shrink:0; }
  .ext-labels { flex:1; min-width:0; }
  .lev-title { font-family:'Cinzel',serif; font-size:11px; letter-spacing:.2em; color:#74bfff; text-transform:uppercase; }
  .lev-sub   { font-family:'Bellefair',serif; font-size:13px; color:#9a8f80; margin-top:2px; }
  .extgrid   { display:grid; grid-template-columns:1fr; gap:14px; }
  @media(min-width:600px) { .extgrid { grid-template-columns:1fr 1fr; gap:22px; } }
  .extcol-lbl { font-size:9px; font-weight:700; letter-spacing:.22em; text-transform:uppercase; color:#9a8f80; margin-bottom:9px; }
  .chips { display:flex; gap:6px; flex-wrap:wrap; }

  /* ── Dual grid ── */
  .dual-grid { display:grid; grid-template-columns:1fr; gap:14px; margin-top:18px; }
  @media(min-width:760px) { .dual-grid { grid-template-columns:1fr 1fr; gap:16px; } }

  /* ── Panel ── */
  .panel { background:#171512; border:1px solid rgba(255,255,255,.05); border-radius:18px; padding:18px; }
  .panel h4 { margin:0 0 12px; font-family:'Cinzel',serif; font-size:12px; letter-spacing:.18em; color:#fde68a; text-transform:uppercase; }
  .panel-note { margin:14px 0 0; font-family:'Bellefair',serif; font-size:12.5px; color:#9a8f80; line-height:1.55; }

  /* ── Values row ── */
  .values-row { display:flex; flex-wrap:wrap; gap:6px; }
  .val-pill   { padding:6px 13px; border-radius:999px; border:1px solid rgba(255,77,158,.4); background:rgba(255,77,158,.08); color:#ff4d9e; font-family:'Bellefair',serif; font-size:13px; }

  /* ── Supporters strip ── */
  .supp-strip { display:flex; flex-direction:column; gap:9px; }
  .supp-item  { display:flex; align-items:center; gap:11px; padding:8px 10px; border-radius:12px; background:rgba(255,255,255,.02); border:1px solid rgba(255,255,255,.05); }
  .disc-sm    { width:34px; height:34px; border-radius:50%; background:linear-gradient(135deg,#201d19,#2a2520); border:2px solid rgba(238,232,170,.4); display:inline-flex; align-items:center; justify-content:center; font-family:'Cinzel',serif; font-weight:700; font-size:10px; flex-shrink:0; }
  .supp-meta  { min-width:0; }
  .supp-name  { font-family:'Bellefair',serif; font-size:13.5px; color:#ede5d8; line-height:1.1; }
  .supp-role  { font-family:'Bellefair',serif; font-size:11px; color:#52493e; margin-top:2px; }

  /* ── Invite strip ── */
  .invite {
    position:relative; margin-top:22px; padding:30px 22px;
    border:1px solid rgba(238,232,170,.28); border-radius:22px;
    background:radial-gradient(120% 80% at 0% 0%,rgba(238,232,170,.07),transparent 60%),radial-gradient(120% 80% at 100% 100%,rgba(200,21,95,.07),transparent 60%),#0e0d0c;
    overflow:hidden; text-align:center;
  }
  @media(min-width:640px) { .invite { padding:40px 30px; border-radius:24px; } }
  .invite-decor {
    position:absolute; inset:0; pointer-events:none; opacity:.5;
    background:repeating-linear-gradient(135deg, rgba(238,232,170,.04) 0 1px, transparent 1px 16px);
  }
  .invite-body    { position:relative; }
  .invite-eyebrow { font-family:'Cinzel',serif; font-size:11px; letter-spacing:.32em; text-transform:uppercase; color:#9a8f80; margin-bottom:12px; }
  .invite-h2      { margin:0; font-family:'Sababa','Heebo',sans-serif; font-size:clamp(22px,5vw,32px); font-weight:700; line-height:1.2; color:#ede5d8; }
  .invite-p       { margin:14px auto 22px; max-width:560px; font-family:'Bellefair',serif; font-size:clamp(13px,2vw,15px); color:#9a8f80; line-height:1.7; }
  .invite-cta     { display:flex; gap:10px; flex-wrap:wrap; justify-content:center; }

  /* ── Privacy strip ── */
  .privacy-strip { display:flex; gap:10px; align-items:flex-start; padding:14px 16px; background:rgba(2,255,187,.03); border:1px dashed rgba(2,255,187,.2); border-radius:14px; margin-top:18px; }
  .privacy-title { font-family:'Cinzel',serif; font-size:11px; letter-spacing:.18em; color:#02ffbb; text-transform:uppercase; margin-bottom:4px; }
  .privacy-sub   { font-family:'Bellefair',serif; font-size:12.5px; color:#9a8f80; line-height:1.55; }
</style>
