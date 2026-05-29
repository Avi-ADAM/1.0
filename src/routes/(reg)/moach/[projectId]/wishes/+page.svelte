<script>
  import { lang } from '$lib/stores/lang.js';
  import { goto } from '$app/navigation';
  import { page } from '$app/state';

  /** @type {{ data: import('./$types').PageData }} */
  let { data } = $props();

  const projectId = $derived(page.params.projectId);

  /* ===== Status meta — visible from the provider's perspective ===== */
  const STATUS_META = {
    suggested:   { he: 'Lev התאימה',         en: 'Matched by Lev',  color: '#9a8f80', dot: '#9a8f80', desc: { he: 'מועמדות אוטומטית — הלקוחה עוד לא צפתה.', en: 'Auto matched — wisher has not viewed yet.' } },
    viewed:      { he: 'הלקוחה צפתה',         en: 'Wisher viewed',   color: '#74bfff', dot: '#74bfff', desc: { he: 'הלקוחה פתחה את ההצעה.', en: 'The wisher opened your proposal.' } },
    accepted:    { he: 'הלקוחה בחרה',         en: 'Wisher chose you', color: '#02ffbb', dot: '#02ffbb', desc: { he: 'נפתחה בקשת שירות — עברו ל־דילים לאישור.', en: 'A service request was opened — head to deals to approve.' } },
    rejected:    { he: 'נדחתה',                en: 'Dismissed',       color: '#52493e', dot: '#52493e', desc: { he: 'הלקוחה דחתה — אין צורך בפעולה.', en: 'Wisher dismissed — no action needed.' } },
    expired:     { he: 'פג תוקף',              en: 'Expired',         color: '#52493e', dot: '#52493e', desc: { he: 'חלון הזמן עבר.', en: 'Window expired.' } }
  };

  const FILTERS = [
    { id: 'all',       he: 'הכל' },
    { id: 'active',    he: 'פעילות' },
    { id: 'won',       he: 'הצלחות' },
    { id: 'dismissed', he: 'דחויות' }
  ];

  let activeFilter = $state('active');

  const proposals = $derived(data.proposals ?? []);

  const filtered = $derived.by(() => {
    switch (activeFilter) {
      case 'active':    return proposals.filter((p) => p.status === 'suggested' || p.status === 'viewed');
      case 'won':       return proposals.filter((p) => p.status === 'accepted');
      case 'dismissed': return proposals.filter((p) => p.status === 'rejected' || p.status === 'expired');
      default:          return proposals;
    }
  });

  const counts = $derived({
    all: proposals.length,
    active: proposals.filter((p) => p.status === 'suggested' || p.status === 'viewed').length,
    won: proposals.filter((p) => p.status === 'accepted').length,
    dismissed: proposals.filter((p) => p.status === 'rejected' || p.status === 'expired').length
  });

  function fmtBudget(n) {
    if (n == null || !Number.isFinite(+n)) return 'לפי הצעה';
    return `₪ ${(+n).toLocaleString('he-IL')}`;
  }
  const HE_MONTHS = ['ינו','פבר','מרץ','אפר','מאי','יוני','יולי','אוג','ספט','אוק','נוב','דצמ'];
  function fmtDate(iso) {
    if (!iso) return 'גמיש';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return 'גמיש';
    return `${d.getDate()} ב${HE_MONTHS[d.getMonth()]}`;
  }
  function relativeTime(iso) {
    if (!iso) return '';
    const d = new Date(iso).getTime();
    if (!d) return '';
    const diff = (Date.now() - d) / 1000;
    if (diff < 60)     return 'הרגע';
    if (diff < 3600)   return `לפני ${Math.round(diff/60)}ד׳`;
    if (diff < 86400)  return `לפני ${Math.round(diff/3600)} שעות`;
    if (diff < 604800) return `לפני ${Math.round(diff/86400)} ימים`;
    return `לפני ${Math.round(diff/604800)} שבועות`;
  }
  function scorePct(s) {
    if (typeof s !== 'number') return 0;
    return Math.round(s * 100);
  }
</script>

<svelte:head>
  <title>{$lang === 'he' ? 'משאלות נכנסות' : $lang === 'ar' ? 'الرغبات الواردة' : 'Incoming wishes'} · 1lev1</title>
</svelte:head>

<div class="incoming-wishes p-4 sm:p-8 bg-white rounded-xl shadow-sm" dir="rtl">

  <!-- Header -->
  <div class="flex items-start justify-between gap-4 mb-6 flex-wrap">
    <div>
      <div class="text-xs tracking-[.22em] uppercase text-rose-500 font-semibold mb-1">CONCIERGE · קונסיירז׳</div>
      <h1 class="text-2xl sm:text-3xl font-bold text-slate-800">משאלות שהפרויקט מועמד לספק</h1>
      <p class="text-sm text-slate-500 mt-2 max-w-xl">
        Lev התאימה את המוצרים שלכם למשאלות לקוחות פתוחות. אין צורך בפעולה — אם לקוחה תבחר, תקבלו התראה במסך הדילים.
      </p>
    </div>
    <div class="flex items-center gap-3 text-sm text-slate-500">
      <span class="inline-flex items-center gap-2 px-3 py-1.5 bg-rose-50 text-rose-600 rounded-full border border-rose-200 font-medium">
        <span class="w-2 h-2 rounded-full bg-rose-500 shadow-[0_0_6px_rgba(244,63,94,0.5)]"></span>
        {counts.active} פעילות
      </span>
      {#if counts.won > 0}
        <span class="inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-full border border-emerald-200 font-medium">
          <span class="w-2 h-2 rounded-full bg-emerald-500"></span>
          {counts.won} נסגרו
        </span>
      {/if}
    </div>
  </div>

  <!-- Filter tabs -->
  <div class="flex gap-2 mb-6 flex-wrap">
    {#each FILTERS as f (f.id)}
      <button
        class="px-3 py-1.5 text-sm rounded-full border transition-colors
               {activeFilter === f.id
                  ? 'bg-rose-500 text-white border-rose-500'
                  : 'bg-white text-slate-600 border-slate-200 hover:border-rose-300 hover:text-rose-500'}"
        onclick={() => activeFilter = f.id}
      >
        {f.he}
        <span class="ms-1 opacity-70 text-xs">{counts[f.id] ?? 0}</span>
      </button>
    {/each}
  </div>

  <!-- List -->
  {#if !data.loadOk}
    <div class="p-6 border border-amber-200 bg-amber-50 rounded-xl text-amber-800 text-sm">
      לא הצלחנו לטעון משאלות. ייתכן שאתם עוד לא רשומים כספק לאף משאלה, או שיש בעיית רשת.
    </div>
  {:else if filtered.length === 0}
    <div class="p-10 border border-dashed border-slate-300 rounded-xl text-center text-slate-500 bg-slate-50">
      <div class="text-3xl text-rose-400 mb-2">✶</div>
      <div class="font-medium text-slate-700 mb-1">אין משאלות במסך הזה</div>
      <div class="text-sm">
        {#if activeFilter === 'active'}
          ברגע ש־Lev תתאים את אחד המוצרים שלכם למשאלה — היא תופיע כאן.
        {:else if activeFilter === 'won'}
          טרם נסגר דיל ממשאלה. הצלחות יופיעו כאן.
        {:else}
          אין משאלות בקבוצה הזו.
        {/if}
      </div>
    </div>
  {:else}
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {#each filtered as p (p.proposalId)}
        {@const meta = STATUS_META[p.status] || STATUS_META.suggested}
        <div class="incoming-card group relative bg-white border border-slate-200 hover:border-rose-300 rounded-xl p-5 transition-all hover:shadow-md">
          <!-- Status & code row -->
          <div class="flex items-center justify-between mb-3 gap-2">
            <span class="inline-flex items-center gap-2 text-xs font-bold tracking-[.16em] uppercase" style="color:{meta.color}">
              <span class="w-2 h-2 rounded-full" style="background:{meta.dot};box-shadow:0 0 8px {meta.dot}"></span>
              {meta.he}
            </span>
            <code class="text-[10.5px] font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">{p.ratsonCode}</code>
          </div>

          <!-- Wisher row -->
          <div class="flex items-center gap-3 mb-3">
            <div class="w-9 h-9 rounded-full bg-gradient-to-br from-rose-500 to-pink-600 border-2 border-amber-200 flex items-center justify-center text-white text-xs font-bold shadow">{p.ratsonOwnerAvatar}</div>
            <div class="min-w-0">
              <div class="text-sm text-slate-700">{p.ratsonOwnerName}</div>
              <div class="text-xs text-slate-400">{relativeTime(p.createdAt)}</div>
            </div>
            {#if p.matchScore != null}
              <div class="ms-auto flex items-baseline gap-1 px-2 py-1 rounded-lg bg-amber-50 border border-amber-200">
                <span class="text-lg font-bold text-amber-700">{scorePct(p.matchScore)}</span>
                <span class="text-[10px] text-amber-600">%</span>
              </div>
            {/if}
          </div>

          <!-- Wish title -->
          <h3 class="text-lg font-bold text-slate-800 mb-2 leading-tight">{p.ratsonName}</h3>
          <p class="text-sm text-slate-600 mb-3 line-clamp-2 leading-relaxed">{p.ratsonLongDes}</p>

          <!-- Meta -->
          <div class="flex flex-wrap gap-3 text-xs text-slate-500 mb-3">
            <span class="inline-flex items-center gap-1"><span>📅</span><span>{fmtDate(p.ratsonStart)}</span></span>
            <span class="inline-flex items-center gap-1"><span>💰</span><span>{fmtBudget(p.ratsonTotalBounti)}</span></span>
          </div>

          <!-- Tags / values -->
          {#if p.values?.length}
            <div class="flex flex-wrap gap-1.5 mb-3">
              {#each p.values.slice(0, 4) as v (v)}
                <span class="text-[11px] px-2 py-0.5 rounded-full bg-rose-50 text-rose-600 border border-rose-200">{v}</span>
              {/each}
              {#if p.values.length > 4}
                <span class="text-[11px] px-2 py-0.5 rounded-full bg-slate-50 text-slate-500 border border-slate-200">+{p.values.length - 4}</span>
              {/if}
            </div>
          {/if}

          <!-- Status note -->
          <div class="text-xs text-slate-500 italic border-t border-slate-100 pt-3 mb-3">
            {meta.desc.he}
          </div>

          <!-- Actions -->
          <div class="flex items-center justify-between gap-2">
            <button
              class="text-sm text-rose-600 hover:text-rose-700 font-medium hover:underline"
              onclick={() => goto(`/concierge/${p.ratsonId}`)}
            >פתחי את המשאלה ›</button>
            {#if p.status === 'accepted'}
              <a href="/deals" class="text-xs font-semibold tracking-wider uppercase text-emerald-600 hover:text-emerald-700">
                לדילים ⤴
              </a>
            {/if}
          </div>
        </div>
      {/each}
    </div>
  {/if}
</div>

<style>
  .line-clamp-2 {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
</style>
