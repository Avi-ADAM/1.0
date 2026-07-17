<script>
  /**
   * SupportPageToggle — lets a rikma member open or close its public support /
   * donation page (PLAN_VOLUNTEER_RIKMA §7). Three states:
   *   off      — unpublished (default / null-legacy).
   *   members  — visible to signed-in site members only.
   *   public   — visible to everyone (an amuta's homepage).
   */
  import { lang } from '$lib/stores/lang.js';
  import { toast } from 'svelte-sonner';
  import { executeAction } from '$lib/client/actionClient';

  let {
    /** @type {string} */
    projectId,
    /** @type {'off' | 'members' | 'public'} */
    value = 'off'
  } = $props();

  let current = $state(value === 'members' || value === 'public' ? value : 'off');
  let busy = $state(false);

  const options = [
    { key: 'off', icon: '⛔', label: { he: 'כבוי', en: 'Off' } },
    { key: 'members', icon: '🔒', label: { he: 'חברי אתר', en: 'Members' } },
    { key: 'public', icon: '🌍', label: { he: 'ציבורי', en: 'Public' } }
  ];

  const t = {
    title: { he: 'דף תמיכה ותרומות', en: 'Support & donations page' },
    desc: {
      he: 'קובע מי רואה את דף התמיכה הציבורי — שבו אפשר לתרום, להתנדב ולראות את מדד הכיסוי בשקיפות.',
      en: 'Controls who can see the public support page — where people donate, volunteer and view the transparent coverage board.'
    },
    view: { he: 'צפייה בדף ←', en: 'View page →' },
    saved: { he: 'נשמר ✓', en: 'Saved ✓' }
  };

  async function choose(key) {
    if (key === current || busy) return;
    const prev = current;
    current = key; // optimistic
    busy = true;
    try {
      const res = await executeAction('setSupportPage', {
        projectId: String(projectId),
        supportPage: key
      });
      if (!res.success) throw new Error(res.error?.message ?? 'failed');
      toast.success(t.saved[$lang]);
    } catch (e) {
      current = prev; // revert
      toast.error(e instanceof Error ? e.message : String(e));
    } finally {
      busy = false;
    }
  }
</script>

<div class="spt">
  <div class="spt-head">
    <h3>💗 {t.title[$lang]}</h3>
    {#if current !== 'off'}
      <a class="spt-view" href="/project/{projectId}/support" target="_blank" rel="noopener">
        {t.view[$lang]}
      </a>
    {/if}
  </div>
  <p class="spt-desc">{t.desc[$lang]}</p>
  <div class="spt-seg" role="radiogroup" aria-label={t.title[$lang]}>
    {#each options as o (o.key)}
      <button
        type="button"
        role="radio"
        aria-checked={current === o.key}
        class="spt-opt"
        class:active={current === o.key}
        disabled={busy}
        onclick={() => choose(o.key)}
      >
        <span aria-hidden="true">{o.icon}</span>
        {o.label[$lang]}
      </button>
    {/each}
  </div>
</div>

<style>
  .spt {
    border: 2px solid var(--gold, #d4af37);
    border-radius: 1rem;
    padding: 1rem 1.25rem;
    background: rgba(255, 215, 0, 0.06);
    max-width: 32rem;
    margin: 0 auto;
  }
  .spt-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem;
  }
  .spt-head h3 {
    font-weight: 800;
    color: var(--barbi-pink, #ff00ae);
  }
  .spt-view {
    font-size: 0.85rem;
    font-weight: 700;
    color: var(--gold, #b8860b);
    text-decoration: underline;
    white-space: nowrap;
  }
  .spt-desc {
    font-size: 0.85rem;
    color: rgba(0, 0, 0, 0.6);
    margin: 0.5rem 0 0.9rem;
  }
  .spt-seg {
    display: flex;
    gap: 0.4rem;
  }
  .spt-opt {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.35rem;
    padding: 0.55rem 0.5rem;
    border-radius: 9999px;
    font-weight: 700;
    font-size: 0.85rem;
    border: 1px solid var(--barbi-pink, #ff00ae);
    color: var(--barbi-pink, #ff00ae);
    background: transparent;
    transition: all 0.2s;
  }
  .spt-opt:hover:not(:disabled) {
    background: rgba(255, 0, 174, 0.08);
  }
  .spt-opt.active {
    background: var(--barbi-pink, #ff00ae);
    color: #fff;
  }
  .spt-opt:disabled {
    opacity: 0.6;
    cursor: default;
  }
</style>
