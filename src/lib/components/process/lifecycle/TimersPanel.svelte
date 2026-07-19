<script>
  /**
   * TimersPanel — the execution-time detail of a mesimabetahalich:
   *  · monthly hours plan/actual from the `monter` component (per month:
   *    assigned hours, done hours, closed or still open), and
   *  · the actual timer entities grouped by month, each with its user, date,
   *    hours, save/approve state and what was worked on.
   */
  import { groupTimersByMonth, mediaUrl, normalizeMonter } from '$lib/utils/processLifecycle';

  let { monter = [], timers = [], lang = 'en' } = $props();

  const i18n = {
    he: {
      monthly: 'שעות לפי חודש',
      month: 'חודש',
      assigned: 'שעות שהוקצו',
      done: 'שעות שבוצעו',
      closed: 'נסגר',
      open: 'פתוח',
      timers: 'טיימרים',
      hours: 'שעות',
      active: 'פעיל כעת',
      saved: 'נשמר',
      approved: 'אושר',
      awaiting: 'ממתין לאישור',
      noTimers: 'אין טיימרים עדיין',
      noMonths: 'אין חלוקה חודשית',
      total: 'סה״כ'
    },
    en: {
      monthly: 'Hours by month',
      month: 'Month',
      assigned: 'Assigned',
      done: 'Done',
      closed: 'Closed',
      open: 'Open',
      timers: 'Timers',
      hours: 'hours',
      active: 'Running now',
      saved: 'Saved',
      approved: 'Approved',
      awaiting: 'Awaiting approval',
      noTimers: 'No timers yet',
      noMonths: 'No monthly breakdown',
      total: 'Total'
    },
    ar: {
      monthly: 'الساعات حسب الشهر',
      month: 'شهر',
      assigned: 'ساعات مخصصة',
      done: 'ساعات منجزة',
      closed: 'مغلق',
      open: 'مفتوح',
      timers: 'المؤقتات',
      hours: 'ساعات',
      active: 'نشط الآن',
      saved: 'محفوظ',
      approved: 'معتمد',
      awaiting: 'بانتظار الموافقة',
      noTimers: 'لا توجد مؤقتات بعد',
      noMonths: 'لا يوجد توزيع شهري',
      total: 'المجموع'
    }
  };
  let t = $derived(i18n[lang] ?? i18n.en);

  let months = $derived(normalizeMonter(monter));
  let timerGroups = $derived(groupTimersByMonth(timers));

  let locale = $derived(lang === 'he' ? 'he-IL' : lang === 'ar' ? 'ar' : 'en-GB');

  function monthLabel(value) {
    if (!value) return '—';
    try {
      // value is either `YYYY-MM` (timer group) or a full date (monthStart)
      const date = new Date(value.length === 7 ? `${value}-01` : value);
      return date.toLocaleDateString(locale, { month: 'long', year: 'numeric' });
    } catch {
      return value;
    }
  }

  function dayLabel(value) {
    if (!value) return '';
    try {
      return new Date(value).toLocaleDateString(locale, { day: 'numeric', month: 'short' });
    } catch {
      return '';
    }
  }

  function roundHours(value) {
    return Math.round((Number(value) || 0) * 100) / 100;
  }
</script>

<div class="tp">
  <!-- ── Monthly plan/actual (monter component) ─────────────────────────── -->
  <div class="tp-block">
    <h4 class="tp-heading">{t.monthly}</h4>
    {#if months.length === 0}
      <p class="tp-empty">{t.noMonths}</p>
    {:else}
      <div class="tp-table-wrap">
        <table class="tp-table">
          <thead>
            <tr>
              <th>{t.month}</th>
              <th>{t.assigned}</th>
              <th>{t.done}</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {#each months as entry (entry.id || entry.monthStart)}
              <tr>
                <td>{monthLabel(entry.monthStart)}</td>
                <td>{roundHours(entry.hours)}</td>
                <td>{roundHours(entry.hoursDone)}</td>
                <td>
                  <span class="tp-badge {entry.isDone ? 'tp-badge--done' : 'tp-badge--open'}">
                    {entry.isDone ? t.closed : t.open}
                  </span>
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    {/if}
  </div>

  <!-- ── Timer entities grouped by month ────────────────────────────────── -->
  <div class="tp-block">
    <h4 class="tp-heading">{t.timers}</h4>
    {#if timerGroups.length === 0}
      <p class="tp-empty">{t.noTimers}</p>
    {:else}
      {#each timerGroups as group (group.month)}
        <div class="tp-month">
          <div class="tp-month-head">
            <span class="tp-month-name">{monthLabel(group.month)}</span>
            <span class="tp-month-total">{t.total}: {roundHours(group.totalHours)} {t.hours}</span>
          </div>
          <ul class="tp-list">
            {#each group.timers as timer (timer.id)}
              {@const attrs = timer.attributes ?? {}}
              {@const timerUser = attrs.users_permissions_user?.data}
              <li class="tp-timer">
                {#if timerUser?.attributes?.profilePic?.data?.attributes?.url}
                  <img
                    class="tp-avatar"
                    src={mediaUrl(timerUser.attributes.profilePic.data.attributes.url)}
                    alt={timerUser.attributes.username}
                    loading="lazy"
                  />
                {:else}
                  <span class="tp-initials" aria-hidden="true">
                    {timerUser?.attributes?.username?.[0]?.toUpperCase() ?? '?'}
                  </span>
                {/if}
                <span class="tp-timer-user">{timerUser?.attributes?.username ?? ''}</span>
                <span class="tp-timer-date">{dayLabel(attrs.start)}</span>
                <span class="tp-timer-hours">{roundHours(attrs.totalHours)} {t.hours}</span>
                {#if attrs.isActive}
                  <span class="tp-badge tp-badge--active">{t.active}</span>
                {:else if attrs.appruved}
                  <span class="tp-badge tp-badge--done">{t.approved}</span>
                {:else if attrs.saved}
                  <span class="tp-badge tp-badge--saved">{t.saved}</span>
                {:else}
                  <span class="tp-badge tp-badge--open">{t.awaiting}</span>
                {/if}
                {#if attrs.saveText}
                  <p class="tp-timer-note">{attrs.saveText}</p>
                {/if}
                {#if (attrs.acts?.data ?? []).length > 0}
                  <p class="tp-timer-acts">
                    {(attrs.acts.data ?? []).map((act) => act.attributes?.shem).filter(Boolean).join(' · ')}
                  </p>
                {/if}
              </li>
            {/each}
          </ul>
        </div>
      {/each}
    {/if}
  </div>
</div>

<style>
  .tp { display: flex; flex-direction: column; gap: 12px; }

  .tp-block { display: flex; flex-direction: column; gap: 6px; }

  .tp-heading {
    margin: 0;
    font-size: 10px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--badge-sky-text, #0369a1);
  }

  .tp-empty {
    margin: 0;
    font-size: 12px;
    color: var(--pcv-text-3, #a8a29e);
    font-style: italic;
  }

  .tp-table-wrap { overflow-x: auto; }

  .tp-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 12px;
    color: var(--pcv-text, #1c1917);
  }

  .tp-table th {
    text-align: start;
    font-size: 10px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--pcv-text-3, #a8a29e);
    padding: 3px 8px;
    border-bottom: 1px solid var(--pcv-border, #f3e8c8);
  }

  .tp-table td {
    padding: 5px 8px;
    border-bottom: 1px solid var(--pcv-border, #f3e8c8);
  }

  .tp-badge {
    display: inline-flex;
    align-items: center;
    padding: 1px 7px;
    border-radius: 9999px;
    font-size: 10px;
    font-weight: 600;
    white-space: nowrap;
  }
  .tp-badge--done {
    background: var(--badge-green-bg, rgba(5,150,105,.10));
    color: var(--badge-green-text, #065f46);
  }
  .tp-badge--open {
    background: var(--badge-gold-bg, rgba(217,119,6,.10));
    color: var(--badge-gold-text, #b45309);
  }
  .tp-badge--saved {
    background: var(--badge-sky-bg, rgba(2,132,199,.10));
    color: var(--badge-sky-text, #0369a1);
  }
  .tp-badge--active {
    background: var(--badge-rose-bg, rgba(225,29,72,.10));
    color: var(--badge-rose-text, #be123c);
    animation: tp-pulse 2s ease-in-out infinite;
  }
  @keyframes tp-pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.55; }
  }

  .tp-month { display: flex; flex-direction: column; gap: 4px; margin-bottom: 6px; }

  .tp-month-head {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 8px;
  }

  .tp-month-name {
    font-size: 12px;
    font-weight: 700;
    color: var(--pcv-text, #1c1917);
  }

  .tp-month-total {
    font-size: 11px;
    color: var(--pcv-text-2, #78716c);
  }

  .tp-list {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .tp-timer {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 6px;
    padding: 5px 8px;
    border-radius: 8px;
    background: var(--pcv-node-bg, #ffffff);
    border: 1px solid var(--pcv-node-border, #e7e5e4);
  }

  .tp-avatar {
    width: 18px;
    height: 18px;
    border-radius: 50%;
    object-fit: cover;
    flex-shrink: 0;
  }

  .tp-initials {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 18px;
    height: 18px;
    border-radius: 50%;
    font-size: 10px;
    font-weight: 700;
    background: var(--badge-grey-bg, rgba(107,114,128,.10));
    color: var(--badge-grey-text, #6b7280);
    flex-shrink: 0;
  }

  .tp-timer-user {
    font-size: 12px;
    font-weight: 600;
    color: var(--pcv-text, #1c1917);
  }

  .tp-timer-date {
    font-size: 11px;
    color: var(--pcv-text-3, #a8a29e);
  }

  .tp-timer-hours {
    font-size: 11px;
    font-weight: 600;
    color: var(--pcv-text-2, #78716c);
    margin-inline-start: auto;
  }

  .tp-timer-note,
  .tp-timer-acts {
    flex-basis: 100%;
    margin: 0;
    font-size: 11px;
    line-height: 1.4;
    color: var(--pcv-text-2, #78716c);
  }

  .tp-timer-acts { color: var(--pcv-text-3, #a8a29e); }
</style>
