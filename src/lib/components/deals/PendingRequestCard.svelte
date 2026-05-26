<script lang="ts">
  import { goto } from '$app/navigation';
  import { lang } from '$lib/stores/lang.js';
  import type { PendingRequestData } from '$lib/server/deals/dealsQueries';

  const KIND_ICON: Record<string, string> = {
    monthly: '📅',
    yearly: '📆',
    total: '⭐',
    unlimited: '∞',
    daily: '🌅'
  };
  const KIND_BG: Record<string, string> = {
    monthly: 'linear-gradient(135deg,#0a0a1a,#12122a)',
    yearly: 'linear-gradient(135deg,#1a1200,#2e2000)',
    total: 'linear-gradient(135deg,#0a100a,#0f1e0f)',
    unlimited: 'linear-gradient(135deg,#0f0a0a,#200a0a)',
    daily: 'linear-gradient(135deg,#0a1010,#0f1e1e)'
  };
  const KIND_LABEL: Record<string, string> = {
    monthly: 'מינוי חודשי',
    yearly: 'מינוי שנתי',
    total: 'תשלום חד פעמי',
    unlimited: 'ליחידה - ללא הגבלה',
    daily: 'יומי'
  };

  let {
    req,
    kind
  }: { req: PendingRequestData; kind: 'buy' | 'sell' } = $props();

  const icon = $derived(KIND_ICON[req.productKindOf ?? ''] ?? '🎁');
  const bg = $derived(KIND_BG[req.productKindOf ?? ''] ?? 'linear-gradient(135deg,#1a1200,#2e2000)');
  const category = $derived(KIND_LABEL[req.productKindOf ?? ''] ?? 'מכירה');

  function formatDate(iso?: string) {
    if (!iso) return '—';
    const d = new Date(iso);
    if (isNaN(d.getTime())) return '—';
    return `${d.getDate()}.${d.getMonth() + 1}.${String(d.getFullYear()).slice(2)}`;
  }

  function navigate() {
    goto(`/deals/request/${req.id}`);
  }
</script>

<div
  class="card"
  dir={$lang === 'en' ? 'ltr' : 'rtl'}
  role="button"
  tabindex="0"
  onclick={navigate}
  onkeydown={(e) => e.key === 'Enter' && navigate()}
>
  <div class="toper">
    <div class="icon" style="background:{bg}">{icon}</div>
    <span class="badge">⏳ {kind === 'buy' ? 'ממתינה לאישור' : 'בקשה נכנסת'}</span>
  </div>

  {#if req.sourceRatsonId}
    <a
      href={`/concierge/${req.sourceRatsonId}`}
      class="wish-source"
      onclick={(e) => e.stopPropagation()}
      title="הגיע ממשאלה — לחצי לפתיחה"
    >
      <span class="ws-gem"></span>
      <span class="ws-label">הגיע ממשאלה</span>
      <span class="ws-name">{req.sourceRatsonName || ''}</span>
      <span class="ws-arrow">›</span>
    </a>
  {/if}

  <div class="chips">
    <span class="chip">{category}</span>
    {#if kind === 'sell' && req.requesterName}
      <span class="chip buyer">👤 {req.requesterName}</span>
    {/if}
  </div>

  <div class="product">{req.productName || '—'}</div>
  <div class="project">{req.projectName || '—'}</div>

  <div class="meta">
    <div class="meta-item">
      <div class="ml">סה"כ</div>
      <div class="mv gold">₪ {Number(req.total || 0).toLocaleString()}</div>
    </div>
    <div class="meta-item">
      <div class="ml">כמות</div>
      <div class="mv">{req.quant}</div>
    </div>
    <div class="meta-item">
      <div class="ml">תאריך בקשה</div>
      <div class="mv">{formatDate(req.createdAt)}</div>
    </div>
  </div>
</div>

<style>
  .card {
    background: var(--s1);
    border: 1px solid var(--border);
    border-radius: var(--rl);
    padding: 24px;
    cursor: pointer;
    transition: all 0.28s cubic-bezier(0.4, 0, 0.2, 1);
    position: relative;
    overflow: hidden;
    outline: none;
  }
  .card::after {
    content: '';
    position: absolute;
    inset: -1px;
    border-radius: inherit;
    background: linear-gradient(135deg, var(--gold), transparent 50%, var(--pink) 100%);
    opacity: 0;
    transition: opacity 0.28s;
    z-index: -1;
    -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
    -webkit-mask-composite: xor;
    mask-composite: exclude;
    padding: 1px;
  }
  .card:hover,
  .card:focus-visible {
    transform: translateY(-4px);
    border-color: transparent;
    box-shadow: 0 12px 40px rgba(0, 0, 0, 0.5);
  }
  .card:hover::after,
  .card:focus-visible::after {
    opacity: 1;
  }

  .toper {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 14px;
  }
  .icon {
    width: 46px;
    height: 46px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 20px;
  }
  .badge {
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 1px;
    padding: 4px 12px;
    border-radius: 20px;
    background: var(--gold-d);
    color: var(--gold-l);
    border: 1px solid var(--border-g);
  }

  .chips {
    display: flex;
    gap: 6px;
    flex-wrap: wrap;
    margin-bottom: 10px;
  }
  .chip {
    font-size: 10px;
    font-weight: 600;
    padding: 3px 10px;
    border-radius: 6px;
    background: var(--s3);
    color: var(--tm);
    border: 1px solid var(--border);
  }
  .chip.buyer {
    background: var(--pink-d);
    color: var(--pink-l);
    border-color: rgba(200, 21, 95, 0.2);
  }

  .product {
    font-size: 16px;
    font-weight: 700;
    color: var(--text);
    margin-bottom: 4px;
  }
  .project {
    font-size: 12px;
    color: var(--tm);
    margin-bottom: 16px;
  }

  .meta {
    display: flex;
    gap: 16px;
    border-top: 1px solid var(--border);
    padding-top: 14px;
  }
  .meta-item { flex: 1; }
  .ml {
    font-size: 10px;
    color: var(--td);
    margin-bottom: 2px;
    font-weight: 600;
  }
  .mv {
    font-size: 13px;
    font-weight: 700;
    color: var(--text);
  }
  .mv.gold { color: var(--gold-l); }

  /* Wish-source pill — shown only when Sheirutpend came from a Ratson */
  .wish-source {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    margin-bottom: 10px;
    padding: 5px 11px;
    border-radius: 999px;
    background: linear-gradient(135deg, rgba(255,77,158,0.12), rgba(238,232,170,0.08));
    border: 1px solid rgba(255,77,158,0.35);
    color: var(--pink-l);
    font-size: 11px;
    font-weight: 600;
    text-decoration: none;
    max-width: 100%;
    transition: all 0.2s;
  }
  .wish-source:hover {
    border-color: rgba(255,77,158,0.6);
    background: linear-gradient(135deg, rgba(255,77,158,0.18), rgba(238,232,170,0.12));
    transform: translateY(-1px);
  }
  .ws-gem {
    width: 7px; height: 7px;
    background: linear-gradient(135deg, #ff4d9e, #c8155f);
    transform: rotate(45deg);
    box-shadow: 0 0 8px rgba(255,77,158,0.6);
    flex-shrink: 0;
  }
  .ws-label { letter-spacing: 0.5px; opacity: 0.9; }
  .ws-name {
    color: var(--gold-l);
    font-weight: 700;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    max-width: 180px;
  }
  .ws-arrow { opacity: 0.7; }
</style>
