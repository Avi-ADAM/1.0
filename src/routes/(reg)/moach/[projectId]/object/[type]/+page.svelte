<script>
  /**
   * Object index — every object of one lifecycle type in the project (e.g.
   * all missions in progress, all join requests, all finish approvals), each
   * linking to its standalone object page and to its full process page.
   * The chips row switches between the twelve object types.
   */
  import { page } from '$app/state';
  import { onMount } from 'svelte';
  import { lang } from '$lib/stores/lang.js';
  import { isRtl } from '$lib/translations';
  import { sendToSer } from '$lib/send/sendToSer.js';
  import { reconstructMissionChains, reconstructResourceChains } from '$lib/utils/reconstructChains.js';
  import { OBJECT_TYPES, listObjects } from '$lib/components/process/lifecycle/objectTypes.js';
  import Lowding from '$lib/celim/lowding.svelte';

  let projectId = $derived(page.params.projectId);
  let type = $derived(page.params.type);
  let config = $derived(OBJECT_TYPES[type] ?? null);

  let loading = $state(true);
  let loadError = $state(null);
  let attrsRoot = $state(null);

  onMount(async () => {
    try {
      const json = await sendToSer({ pid: projectId }, 'processLifecycleData', null, null, false, fetch);
      attrsRoot = json?.data?.project?.data?.attributes ?? null;
      if (!attrsRoot) loadError = 'no_data';
    } catch (e) {
      loadError = e?.message ?? 'fetch_error';
    } finally {
      loading = false;
    }
  });

  let missionChains = $derived(
    attrsRoot
      ? reconstructMissionChains(
          attrsRoot.pendms?.data ?? [],
          attrsRoot.open_missions?.data ?? [],
          attrsRoot.mesimabetahaliches?.data ?? [],
          attrsRoot.finnished_missions?.data ?? [],
          attrsRoot.acts?.data ?? []
        )
      : []
  );
  let resourceChains = $derived(
    attrsRoot ? reconstructResourceChains(attrsRoot.open_mashaabims?.data ?? [], []) : []
  );

  let items = $derived(config ? listObjects(type, missionChains, resourceChains) : []);
  let activeItems = $derived(items.filter((item) => !config.archived(item.entity.attributes ?? {})));
  let archivedItems = $derived(items.filter((item) => config.archived(item.entity.attributes ?? {})));

  const typeLabels = {
    he: {
      pendm: 'משימות ממתינות', openMission: 'משימות פתוחות', ask: 'בקשות הצטרפות',
      betahalich: 'משימות בביצוע', act: 'מטלות', finiapruval: 'אשרורי סיום',
      finnished: 'משימות שהושלמו', pmash: 'משאבים ממתינים', openMashaabim: 'משאבים פתוחים',
      askm: 'הצעות אספקה', maap: 'אספקות בתהליך', rikmash: 'משאבים שהתקבלו'
    },
    en: {
      pendm: 'Pending missions', openMission: 'Open missions', ask: 'Join requests',
      betahalich: 'Missions in progress', act: 'Tasks', finiapruval: 'Finish approvals',
      finnished: 'Completed missions', pmash: 'Pending resources', openMashaabim: 'Open resources',
      askm: 'Supply proposals', maap: 'Deliveries in progress', rikmash: 'Received resources'
    },
    ar: {
      pendm: 'مهام معلقة', openMission: 'مهام مفتوحة', ask: 'طلبات انضمام',
      betahalich: 'مهام قيد التنفيذ', act: 'مهام صغيرة', finiapruval: 'موافقات إنهاء',
      finnished: 'مهام مكتملة', pmash: 'موارد معلقة', openMashaabim: 'موارد مفتوحة',
      askm: 'عروض توريد', maap: 'توريدات قيد التنفيذ', rikmash: 'موارد مستلمة'
    }
  };

  const i18n = {
    he: {
      active: 'פעילים', archived: 'ארכיון', empty: 'אין אובייקטים מסוג זה בפרויקט',
      process: 'לעמוד התהליך', unknownType: 'סוג אובייקט לא מוכר', loading: 'טוען…',
      error: 'שגיאה בטעינת הנתונים', backProcesses: 'לכל התהליכים'
    },
    en: {
      active: 'Active', archived: 'Archive', empty: 'No objects of this type in the project',
      process: 'Process page', unknownType: 'Unknown object type', loading: 'Loading…',
      error: 'Failed to load data', backProcesses: 'All processes'
    },
    ar: {
      active: 'نشطة', archived: 'أرشيف', empty: 'لا توجد كائنات من هذا النوع في المشروع',
      process: 'صفحة العملية', unknownType: 'نوع كائن غير معروف', loading: 'جارٍ التحميل…',
      error: 'فشل تحميل البيانات', backProcesses: 'كل العمليات'
    }
  };
  let t = $derived(i18n[$lang] ?? i18n.en);
  let labels = $derived(typeLabels[$lang] ?? typeLabels.en);

  function formatDate(value) {
    if (!value) return '';
    try {
      return new Date(value).toLocaleDateString(
        $lang === 'he' ? 'he-IL' : $lang === 'ar' ? 'ar' : 'en-GB',
        { day: 'numeric', month: 'short', year: 'numeric' }
      );
    } catch {
      return '';
    }
  }
</script>

<svelte:head>
  <title>{labels[type] ?? type} · 1lev1</title>
</svelte:head>

<div class="oi" dir={$isRtl ? 'rtl' : 'ltr'}>
  <div class="oi-nav">
    <a class="oi-back" href={`/moach/${projectId}/processes`}>{t.backProcesses}</a>
  </div>

  <div class="oi-chips">
    {#each Object.keys(OBJECT_TYPES) as key (key)}
      <a
        class="oi-chip"
        class:oi-chip--active={key === type}
        href={`/moach/${projectId}/object/${key}`}
      >
        {labels[key]}
      </a>
    {/each}
  </div>

  {#if loading}
    <div class="oi-state"><Lowding /><p class="oi-state-sub">{t.loading}</p></div>
  {:else if !config}
    <div class="oi-state"><p class="oi-state-title">{t.unknownType}</p><code class="oi-id">{type}</code></div>
  {:else if loadError}
    <div class="oi-state"><p class="oi-state-title">{t.error}</p><code class="oi-id">{loadError}</code></div>
  {:else}
    <h1 class="oi-title">{labels[type]}</h1>

    {#if items.length === 0}
      <div class="oi-state"><p class="oi-state-sub">{t.empty}</p></div>
    {:else}
      {#each [{ key: 'active', list: activeItems }, { key: 'archived', list: archivedItems }] as section (section.key)}
        {#if section.list.length > 0}
          <h2 class="oi-section">{section.key === 'active' ? t.active : t.archived} ({section.list.length})</h2>
          <ul class="oi-list" class:oi-list--archived={section.key === 'archived'}>
            {#each section.list as item ((item.chain.id ?? '') + '-' + item.entity.id)}
              {@const attrs = item.entity.attributes ?? {}}
              <li class="oi-item">
                <a class="oi-item-name" href={`/moach/${projectId}/object/${type}/${item.entity.id}`}>
                  {config.name(attrs) ?? `#${item.entity.id}`}
                </a>
                {#if attrs.createdAt}
                  <span class="oi-item-date">{formatDate(attrs.createdAt)}</span>
                {/if}
                <a class="oi-item-process" href={`/moach/${projectId}/processes/${item.chain.id}`}>
                  {t.process}
                </a>
              </li>
            {/each}
          </ul>
        {/if}
      {/each}
    {/if}
  {/if}
</div>

<style>
  .oi {
    --pcv-card:         #ffffff;
    --pcv-border:       #f3e8c8;
    --pcv-text:         #1c1917;
    --pcv-text-2:       #78716c;
    --pcv-text-3:       #a8a29e;
    --gold:             #d97706;
    --badge-gold-bg:    rgba(217,119,6,.10);
    --badge-gold-text:  #b45309;
    --badge-grey-bg:    rgba(107,114,128,.10);
    --badge-grey-text:  #6b7280;

    min-height: 60vh;
    background: #fffbf0;
    border-radius: 16px;
    padding: 1rem 1rem 2rem;
    text-align: start;
  }

  @media (prefers-color-scheme: dark) {
    .oi {
      --pcv-card:         #18181b;
      --pcv-border:       #27272a;
      --pcv-text:         #fafaf9;
      --pcv-text-2:       #a8a29e;
      --pcv-text-3:       #52525b;
      --gold:             #fbbf24;
      --badge-gold-bg:    rgba(251,191,36,.14);
      --badge-gold-text:  #fbbf24;
      --badge-grey-bg:    rgba(113,113,122,.12);
      --badge-grey-text:  #71717a;
      background: #09090b;
    }
  }

  .oi-nav { margin-bottom: 10px; }

  .oi-back {
    display: inline-flex;
    align-items: center;
    padding: 5px 12px;
    border-radius: 9999px;
    border: 1px solid var(--pcv-border);
    background: var(--pcv-card);
    font-size: 12px;
    font-weight: 600;
    color: var(--pcv-text-2);
    text-decoration: none;
  }
  .oi-back:hover { border-color: var(--gold); color: var(--badge-gold-text); }

  .oi-chips {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin-bottom: 16px;
  }

  .oi-chip {
    padding: 3px 10px;
    border-radius: 9999px;
    border: 1px solid var(--pcv-border);
    background: var(--pcv-card);
    font-size: 11px;
    font-weight: 600;
    color: var(--pcv-text-2);
    text-decoration: none;
    white-space: nowrap;
    transition: border-color 0.12s, color 0.12s, background 0.12s;
  }
  .oi-chip:hover { border-color: var(--gold); color: var(--badge-gold-text); }
  .oi-chip--active {
    border-color: var(--gold);
    background: var(--badge-gold-bg);
    color: var(--badge-gold-text);
  }

  .oi-title {
    margin: 0 0 10px;
    font-size: clamp(1.05rem, 3vw, 1.4rem);
    font-weight: 700;
    color: var(--pcv-text);
  }

  .oi-section {
    margin: 14px 0 6px;
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--pcv-text-3);
  }

  .oi-list {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 5px;
  }

  .oi-list--archived { opacity: 0.8; }

  .oi-item {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 8px;
    padding: 8px 12px;
    border-radius: 10px;
    border: 1px solid var(--pcv-border);
    background: var(--pcv-card);
  }

  .oi-item-name {
    font-size: 13px;
    font-weight: 600;
    color: var(--pcv-text);
    text-decoration: none;
    word-break: break-word;
  }
  .oi-item-name:hover { color: var(--badge-gold-text); }

  .oi-item-date {
    font-size: 11px;
    color: var(--pcv-text-3);
  }

  .oi-item-process {
    margin-inline-start: auto;
    font-size: 11px;
    font-weight: 600;
    color: var(--badge-gold-text);
    background: var(--badge-gold-bg);
    padding: 2px 8px;
    border-radius: 9999px;
    text-decoration: none;
    white-space: nowrap;
  }

  .oi-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 3rem 1rem;
    text-align: center;
    gap: 10px;
  }
  .oi-state-title { margin: 0; font-size: 1rem; font-weight: 600; color: var(--pcv-text); }
  .oi-state-sub { margin: 0; font-size: 0.8125rem; color: var(--pcv-text-2); }
  .oi-id {
    font-size: 11px;
    font-family: ui-monospace, monospace;
    color: var(--pcv-text-3);
    background: var(--badge-grey-bg);
    padding: 2px 8px;
    border-radius: 6px;
  }
</style>
