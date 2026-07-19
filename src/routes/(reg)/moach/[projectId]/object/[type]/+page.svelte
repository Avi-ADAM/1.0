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
  import { reconstructSaleChains } from '$lib/utils/processLifecycle';
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
  let saleChains = $derived(
    attrsRoot ? reconstructSaleChains(attrsRoot.matanotofs?.data ?? [], attrsRoot.sales?.data ?? []) : []
  );

  let items = $derived(
    config ? listObjects(type, missionChains, resourceChains, saleChains) : []
  );
  let activeItems = $derived(items.filter((item) => !config.archived(item.entity.attributes ?? {})));
  let archivedItems = $derived(items.filter((item) => config.archived(item.entity.attributes ?? {})));

  const typeLabels = {
    he: {
      pendm: 'משימות ממתינות', openMission: 'משימות פתוחות', ask: 'בקשות הצטרפות',
      betahalich: 'משימות בביצוע', act: 'מטלות', finiapruval: 'אשרורי סיום',
      finnished: 'משימות שהושלמו', pmash: 'משאבים ממתינים', openMashaabim: 'משאבים פתוחים',
      askm: 'הצעות אספקה', maap: 'אספקות בתהליך', rikmash: 'משאבים שהתקבלו',
      matanot: 'מוצרים', sale: 'מכירות'
    },
    en: {
      pendm: 'Pending missions', openMission: 'Open missions', ask: 'Join requests',
      betahalich: 'Missions in progress', act: 'Tasks', finiapruval: 'Finish approvals',
      finnished: 'Completed missions', pmash: 'Pending resources', openMashaabim: 'Open resources',
      askm: 'Supply proposals', maap: 'Deliveries in progress', rikmash: 'Received resources',
      matanot: 'Products', sale: 'Sales'
    },
    ar: {
      pendm: 'مهام معلقة', openMission: 'مهام مفتوحة', ask: 'طلبات انضمام',
      betahalich: 'مهام قيد التنفيذ', act: 'مهام صغيرة', finiapruval: 'موافقات إنهاء',
      finnished: 'مهام مكتملة', pmash: 'موارد معلقة', openMashaabim: 'موارد مفتوحة',
      askm: 'عروض توريد', maap: 'توريدات قيد التنفيذ', rikmash: 'موارد مستلمة',
      matanot: 'منتجات', sale: 'مبيعات'
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
  /* Moach look — translucent slate cards over the layout's dark gradient,
     site gold (#eee8aa) accents. Always dark. */
  .oi {
    --pcv-card:         rgba(15, 23, 42, 0.72);
    --pcv-border:       rgba(148, 163, 184, 0.32);
    --pcv-text:         #f1f5f9;
    --pcv-text-2:       #cbd5e1;
    --pcv-text-3:       #94a3b8;
    --gold:             #eee8aa;
    --badge-gold-bg:    rgba(238, 232, 170, 0.14);
    --badge-gold-text:  #eee8aa;
    --badge-grey-bg:    rgba(148, 163, 184, 0.14);
    --badge-grey-text:  #94a3b8;

    min-height: 60vh;
    background: transparent;
    padding: 0.25rem 0.25rem 2rem;
    text-align: start;
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
    color: var(--gold);
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
