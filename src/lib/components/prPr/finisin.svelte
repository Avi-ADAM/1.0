<script>
  import { onMount } from 'svelte';
  import { lang } from '$lib/stores/lang';

  /**
   * @typedef {Object} Props
   * @property {any} [fmiData]
   * @property {number} [who]
   */

  /** @type {Props} */
  let { fmiData = $bindable([]), who = 0 } = $props();

  let isonly = $state(false);
  let visible = $state(false);

  onMount(async () => {
    if (who !== 0) {
      isonly = true;
      fmiData = fmiData.filter((event) => event.id == who);
    }
    // Use requestAnimationFrame or a very short timeout to ensure the DOM is ready
    // before triggering the entrance animation
    requestAnimationFrame(() => {
      visible = true;
    });
  });

  // ─── Translations ──────────────────────────────────────────────
  const i18n = {
    he: {
      title_single: 'פעולה שבוצעה ואושרה',
      title_multi: 'ארכיון פעולות שבוצעו ואושרו',
      badge: 'ארכיון',
      badge_single: 'בוצע ואושר',
      name: 'שם המשימה',
      description: 'תיאור',
      date: 'תאריך ביצוע',
      public_links: 'קישורים ציבוריים',
      private_notes: 'הערות אישיות לריקמה',
      private_links: 'קישורים פרטיים',
      hours: 'שעות עבודה',
      per_hour: 'שווי שעה',
      total: 'שווי כולל',
      closing_notes: 'הערות סיום',
      done_by: 'בוצע על ידי',
      task_no: 'משימה',
      currency: '₪',
      hours_unit: 'שעות'
    },
    en: {
      title_single: 'Completed & Approved Action',
      title_multi: 'Completed & Approved Actions Archive',
      badge: 'Archive',
      badge_single: 'Completed',
      name: 'Task Name',
      description: 'Description',
      date: 'Completion Date',
      public_links: 'Public Links',
      private_notes: 'Personal Notes',
      private_links: 'Private Links',
      hours: 'Hours Worked',
      per_hour: 'Value / Hour',
      total: 'Total Value',
      closing_notes: 'Closing Notes',
      done_by: 'Completed By',
      task_no: 'Task',
      currency: '₪',
      hours_unit: 'hrs'
    },
    ar: {
      title_single: 'إجراء مكتمل ومعتمد',
      title_multi: 'أرشيف الإجراءات المكتملة والمعتمدة',
      badge: 'الأرشيف',
      badge_single: 'مكتمل',
      name: 'اسم المهمة',
      description: 'الوصف',
      date: 'تاريخ الإنجاز',
      public_links: 'روابط عامة',
      private_notes: 'ملاحظات خاصة',
      private_links: 'روابط خاصة',
      hours: 'ساعات العمل',
      per_hour: 'قيمة الساعة',
      total: 'القيمة الإجمالية',
      closing_notes: 'ملاحظات الإغلاق',
      done_by: 'أُنجز بواسطة',
      task_no: 'مهمة',
      currency: '₪',
      hours_unit: 'ساعة'
    }
  };

  const labels = $derived(i18n[$lang] ?? i18n['he']);
  const dir = $derived($lang === 'ar' || $lang === 'he' ? 'rtl' : 'ltr');
</script>

<div class="archive-wrap" class:visible {dir}>
  <!-- Header -->
  <div class="archive-header">
    <span class="badge" class:badge-single={isonly}>
      {isonly ? labels.badge_single : labels.badge}
    </span>
    <h1 class="archive-title">
      {isonly ? labels.title_single : labels.title_multi}
    </h1>
    {#if !isonly}
      <span class="count-pill">{fmiData.length}</span>
    {/if}
  </div>

  <!-- Cards -->
  <div class="cards-scroll" class:single-mode={isonly}>
    {#each fmiData as data, i}
      {@const a = data.attributes}
      <article class="task-card" style="--delay:{i * 80}ms">
        <!-- Card Header -->
        <header class="card-head">
          <div class="card-index">
            {#if !isonly}<span class="index-num">{i + 1}</span>{/if}
            <span class="task-label">{labels.task_no}</span>
          </div>
          <div class="card-title-block">
            <h2 class="card-title">{a.missionName}</h2>
            {#if a.users_permissions_user?.data}
              <span class="done-by-pill">
                ✓ {a.users_permissions_user.data.attributes.username}
              </span>
            {/if}
          </div>
        </header>

        <!-- Fields Grid -->
        <div class="fields-grid">
          {#if a.descrip}
            <div class="field full-width">
              <span class="field-label">{labels.description}</span>
              <span class="field-value">{a.descrip}</span>
            </div>
          {/if}

          {#if a.Sqadualed}
            <div class="field">
              <span class="field-label">{labels.date}</span>
              <span class="field-value date-val">{a.Sqadualed}</span>
            </div>
          {/if}

          {#if a.noofhours > 0}
            <div class="field">
              <span class="field-label">{labels.hours}</span>
              <span class="field-value numeric">
                {a.noofhours.toLocaleString('en-US', {
                  maximumFractionDigits: 2
                })}
                <small>{labels.hours_unit}</small>
              </span>
            </div>
          {/if}

          {#if a.perhour > 0}
            <div class="field">
              <span class="field-label">{labels.per_hour}</span>
              <span class="field-value numeric">
                {labels.currency}{a.perhour.toLocaleString('en-US', {
                  maximumFractionDigits: 2
                })}
              </span>
            </div>
          {/if}

          {#if a.total}
            <div class="field highlight-field">
              <span class="field-label">{labels.total}</span>
              <span class="field-value total-val">
                {labels.currency}{a.total}
              </span>
            </div>
          {/if}

          {#if a.why}
            <div class="field full-width">
              <span class="field-label">{labels.closing_notes}</span>
              <span class="field-value">{a.why}</span>
            </div>
          {/if}
        </div>

        <!-- Private Section -->
        {#if a.hearotMeyuchadot || a.privatlinks || a.publicklinks}
          <div class="private-section">
            {#if a.publicklinks}
              <div class="field">
                <span class="field-label link-label">{labels.public_links}</span
                >
                <span class="field-value link-val">{a.publicklinks}</span>
              </div>
            {/if}
            {#if a.hearotMeyuchadot}
              <div class="field full-width">
                <span class="field-label private-label"
                  >{labels.private_notes}</span
                >
                <span class="field-value">{a.hearotMeyuchadot}</span>
              </div>
            {/if}
            {#if a.privatlinks}
              <div class="field">
                <span class="field-label private-label"
                  >{labels.private_links}</span
                >
                <span class="field-value link-val">{a.privatlinks}</span>
              </div>
            {/if}
          </div>
        {/if}
      </article>
    {/each}
  </div>
</div>

<style>
  @import url('https://fonts.googleapis.com/css2?family=Heebo:wght@300;400;500;600;700&family=Fraunces:ital,opsz,wght@0,9..144,300;0,9..144,600;1,9..144,300&display=swap');

  /* ── Root Variables ── */
  :root {
    --wine-deep: #150810;
    --wine-mid: #220d18;
    --wine-card: #2c1020;
    --wine-border: #4a1f35;
    --wine-hover: #3a1528;
    --gold: #c9a84c;
    --gold-light: #e8c97a;
    --teal: #7ef0da;
    --teal-dim: #4abba8;
    --text-primary: #f0e6ec;
    --text-secondary: #9c7d8c;
    --text-muted: #5c4050;
    --private-bg: #1f0c16;
    --private-border: #3d1828;
  }

  /* ── Wrapper ── */
  .archive-wrap {
    font-family: 'Heebo', 'Arial', sans-serif;
    background: var(--wine-deep);
    min-height: 100%;
    display: flex;
    flex-direction: column;
    align-items: stretch;
    padding: 2rem 1.5rem 3rem;
    /* Reset all animations/opacities for reliable display */
    opacity: 1 !important;
    transform: none !important;
    visibility: visible !important;
  }

  .archive-header,
  .cards-scroll,
  .task-card {
    opacity: 1 !important;
    transform: none !important;
    animation: none !important;
  }

  /* ── Header ── */
  .archive-header {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    margin-bottom: 2rem;
    flex-wrap: wrap;
  }
  .archive-title {
    font-family: 'Fraunces', serif;
    font-size: 1.6rem;
    font-weight: 600;
    color: var(--text-primary);
    margin: 0;
    letter-spacing: -0.01em;
    line-height: 1.2;
  }
  .badge {
    display: inline-flex;
    align-items: center;
    background: linear-gradient(135deg, #6b0f1a, #b91372);
    color: var(--teal);
    font-size: 0.7rem;
    font-weight: 700;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    padding: 0.25rem 0.65rem;
    border-radius: 4px;
    white-space: nowrap;
  }
  .badge.badge-single {
    background: linear-gradient(135deg, #0d5c4a, #1a8c6e);
    color: #a8fae8;
  }
  .count-pill {
    margin-inline-start: auto;
    background: var(--wine-card);
    border: 1px solid var(--wine-border);
    color: var(--gold);
    font-size: 0.8rem;
    font-weight: 700;
    padding: 0.2rem 0.6rem;
    border-radius: 99px;
    min-width: 2rem;
    text-align: center;
  }

  /* ── Cards Scroll Container ── */
  .cards-scroll {
    display: flex;
    flex-direction: row;
    gap: 1.25rem;
    overflow-x: auto;
    overflow-y: visible;
    padding-bottom: 1rem;
    scroll-snap-type: x mandatory;
    -webkit-overflow-scrolling: touch;
  }
  .cards-scroll.single-mode {
    flex-direction: column;
    overflow-x: visible;
  }
  .cards-scroll::-webkit-scrollbar {
    height: 5px;
  }
  .cards-scroll::-webkit-scrollbar-track {
    background: var(--wine-mid);
    border-radius: 99px;
  }
  .cards-scroll::-webkit-scrollbar-thumb {
    background: var(--wine-border);
    border-radius: 99px;
  }

  /* ── Task Card ── */
  .task-card {
    background: var(--wine-card);
    border: 1px solid var(--wine-border);
    border-radius: 12px;
    padding: 1.5rem;
    min-width: 300px;
    max-width: 380px;
    flex-shrink: 0;
    scroll-snap-align: start;
    display: flex;
    flex-direction: column;
    gap: 1.1rem;
    opacity: 0;
    transform: translateY(16px);
    animation: cardIn 0.4s ease forwards;
    animation-delay: var(--delay, 0ms);
    transition:
      border-color 0.2s,
      box-shadow 0.2s;
  }
  .single-mode .task-card {
    min-width: unset;
    max-width: unset;
  }
  .task-card:hover {
    border-color: var(--wine-hover);
    box-shadow:
      0 8px 32px rgba(0, 0, 0, 0.4),
      0 0 0 1px #4a1f3530;
  }
  @keyframes cardIn {
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  /* ── Card Header ── */
  .card-head {
    display: flex;
    align-items: flex-start;
    gap: 0.75rem;
    border-bottom: 1px solid var(--wine-border);
    padding-bottom: 1rem;
  }
  .card-index {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.1rem;
    min-width: 2.5rem;
  }
  .index-num {
    font-family: 'Fraunces', serif;
    font-size: 1.8rem;
    font-weight: 300;
    color: var(--gold);
    line-height: 1;
  }
  .task-label {
    font-size: 0.6rem;
    font-weight: 600;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--text-muted);
  }
  .card-title-block {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
  }
  .card-title {
    font-size: 1.05rem;
    font-weight: 600;
    color: var(--text-primary);
    margin: 0;
    line-height: 1.3;
  }
  .done-by-pill {
    display: inline-flex;
    align-items: center;
    gap: 0.3rem;
    font-size: 0.72rem;
    color: var(--teal-dim);
    background: #0d3330;
    border: 1px solid #1a4e4a;
    padding: 0.15rem 0.5rem;
    border-radius: 99px;
    width: fit-content;
  }

  /* ── Fields Grid ── */
  .fields-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.75rem;
  }
  .field {
    display: flex;
    flex-direction: column;
    gap: 0.2rem;
  }
  .field.full-width {
    grid-column: 1 / -1;
  }
  .field.highlight-field {
    background: #1a0a13;
    border: 1px solid #4a1f35;
    border-radius: 8px;
    padding: 0.6rem 0.75rem;
    grid-column: 1 / -1;
  }
  .field-label {
    font-size: 0.67rem;
    font-weight: 700;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: var(--text-muted);
  }
  .field-value {
    font-size: 0.9rem;
    color: var(--text-primary);
    line-height: 1.4;
    word-break: break-word;
  }
  .field-value.numeric {
    font-size: 1.1rem;
    font-weight: 600;
    color: var(--teal);
    font-variant-numeric: tabular-nums;
    display: flex;
    align-items: baseline;
    gap: 0.25rem;
  }
  .field-value.numeric small {
    font-size: 0.7rem;
    color: var(--teal-dim);
    font-weight: 400;
  }
  .field-value.date-val {
    color: var(--gold-light);
    font-weight: 500;
  }
  .field-value.total-val {
    font-family: 'Fraunces', serif;
    font-size: 1.4rem;
    font-weight: 600;
    color: var(--gold);
    letter-spacing: -0.02em;
  }
  .field-value.link-val {
    color: #7ac7f5;
    text-decoration: underline;
    text-decoration-color: #3a6a8a;
    font-size: 0.82rem;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  /* ── Private Section ── */
  .private-section {
    background: var(--private-bg);
    border: 1px solid var(--private-border);
    border-radius: 8px;
    padding: 0.85rem 1rem;
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.65rem;
  }
  .private-label {
    color: #7a5060;
  }
  .link-label {
    color: #5070a0;
  }
  .private-section .full-width {
    grid-column: 1 / -1;
  }

  /* ── Responsive ── */
  @media (max-width: 600px) {
    .archive-wrap {
      padding: 1.25rem 1rem 2rem;
    }
    .archive-title {
      font-size: 1.25rem;
    }
    .task-card {
      min-width: 280px;
      padding: 1.1rem;
    }
    .fields-grid {
      grid-template-columns: 1fr;
    }
    .field.highlight-field,
    .field.full-width {
      grid-column: 1;
    }
    .private-section {
      grid-template-columns: 1fr;
    }
    .private-section .full-width {
      grid-column: 1;
    }
  }
</style>
