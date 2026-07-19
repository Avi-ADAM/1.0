<script>
  /**
   * Per-object page — a standalone page for every lifecycle entity linked to
   * the rikma (pendm / openMission / ask / betahalich / act / finiapruval /
   * finnished / pmash / openMashaabim / askm / maap / rikmash).
   *
   * Active objects expose their relevant actions (vote page, chat, boards);
   * archived objects render read-only with an archive banner. The page links
   * to the full process page of the chain it belongs to, and is reachable on
   * its own (e.g. from the object index at ../[type]).
   */
  import { page } from '$app/state';
  import { onMount } from 'svelte';
  import { lang } from '$lib/stores/lang.js';
  import { isRtl } from '$lib/translations';
  import { sendToSer } from '$lib/send/sendToSer.js';
  import { reconstructMissionChains, reconstructResourceChains } from '$lib/utils/reconstructChains.js';
  import { findChainByRef, mediaUrl, reconstructSaleChains, saleEffective } from '$lib/utils/processLifecycle';
  import { parseSiteShareNote } from '$lib/revenue/parseSiteShareNote';
  import { OBJECT_TYPES, objectRef } from '$lib/components/process/lifecycle/objectTypes.js';
  import VoteRounds from '$lib/components/process/lifecycle/VoteRounds.svelte';
  import TimersPanel from '$lib/components/process/lifecycle/TimersPanel.svelte';
  import Lowding from '$lib/celim/lowding.svelte';
  import RichText from '$lib/celim/ui/richText.svelte';

  let projectId = $derived(page.params.projectId);
  let type = $derived(page.params.type);
  let objectId = $derived(page.params.id);
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

  let found = $derived(
    config
      ? findChainByRef(missionChains, resourceChains, objectRef(type, objectId), saleChains)
      : null
  );
  let entity = $derived(found && config ? config.fromChain(found.chain, objectId) : null);
  let attrs = $derived(entity?.attributes ?? null);
  let isArchived = $derived(attrs && config ? config.archived(attrs) : false);
  let entityVotes = $derived(attrs && config ? config.votes(attrs) : null);
  let forumId = $derived(attrs && config ? config.forumId(attrs) : null);
  let entityName = $derived(
    (attrs && config ? config.name(attrs) : null) ?? `#${objectId}`
  );
  let processHref = $derived(
    found ? `/moach/${projectId}/processes/${found.chain.id}` : null
  );

  const typeLabels = {
    he: {
      pendm: 'משימה ממתינה', openMission: 'משימה פתוחה', ask: 'בקשת הצטרפות',
      betahalich: 'משימה בביצוע', act: 'מטלה', finiapruval: 'אשרור סיום',
      finnished: 'משימה שהושלמה (ארכיון)', pmash: 'משאב ממתין', openMashaabim: 'משאב פתוח',
      askm: 'הצעת אספקה', maap: 'אספקה בתהליך', rikmash: 'משאב שהתקבל (ארכיון)',
      matanot: 'מוצר', sale: 'מכירה'
    },
    en: {
      pendm: 'Pending mission', openMission: 'Open mission', ask: 'Join request',
      betahalich: 'Mission in progress', act: 'Task', finiapruval: 'Finish approval',
      finnished: 'Completed mission (archive)', pmash: 'Pending resource', openMashaabim: 'Open resource',
      askm: 'Supply proposal', maap: 'Delivery in progress', rikmash: 'Received resource (archive)',
      matanot: 'Product', sale: 'Sale'
    },
    ar: {
      pendm: 'مهمة معلقة', openMission: 'مهمة مفتوحة', ask: 'طلب انضمام',
      betahalich: 'مهمة قيد التنفيذ', act: 'مهمة صغيرة', finiapruval: 'موافقة إنهاء',
      finnished: 'مهمة مكتملة (أرشيف)', pmash: 'مورد معلق', openMashaabim: 'مورد مفتوح',
      askm: 'عرض توريد', maap: 'توريد قيد التنفيذ', rikmash: 'مورد مستلم (أرشيف)',
      matanot: 'منتج', sale: 'بيع'
    }
  };

  const i18n = {
    he: {
      backProcess: 'לעמוד התהליך המלא',
      backList: 'לכל האובייקטים מסוג זה',
      active: 'פעיל',
      archived: 'ארכיון — לקריאה בלבד',
      readOnly: 'האובייקט אורכב: העמוד מוצג לקריאה בלבד, ללא פעולות.',
      actions: 'פעולות',
      votePage: 'לעמוד ההצבעה והמו״מ',
      chat: 'לצ׳אט',
      votes: 'הצבעות ומו״מ',
      description: 'תיאור',
      details: 'פרטים',
      timers: 'טיימרים ושעות',
      notFound: 'האובייקט לא נמצא',
      notFoundSub: 'לא נמצא אובייקט מסוג זה עם המזהה המבוקש בפרויקט.',
      unknownType: 'סוג אובייקט לא מוכר',
      loading: 'טוען…',
      error: 'שגיאה בטעינת הנתונים',
      hours: 'שעות', perhour: 'לשעה', price: 'מחיר', amount: 'כמות', easy: 'גמישות',
      total: 'סה״כ', month: 'חודש', deadline: 'מועד מענה (שתיקה = הסכמה)',
      created: 'נוצר', start: 'התחלה', finish: 'סיום', due: 'יעד', kind: 'סוג',
      progress: 'התקדמות', of: 'מתוך', by: 'אחראי/ת', validator: 'מאשר/ת',
      done: 'בוצע', notDone: 'טרם בוצע', delivered: 'סופק', why: 'סיכום',
      actsBoard: 'ללוח המטלות', progressBoard: 'למשימות בתהליך', timersBoard: 'לטיימרים',
      salesBoard: 'ללוח המכירות', salePage: 'לעמוד המכירה',
      holderStatus: 'מצב הסכמת מחזיק/ת הכסף',
      holderSelf: 'דיווח עצמי', holderConfirmed: 'אושר ע״י המחזיק/ה',
      holderOpen: 'ממתין להסכמה', holderLegacy: 'נספר במאזן',
      splitState: 'חלוקה', splited: 'חולק', notSplited: 'טרם חולק',
      donation: 'תרומה', siteShare: 'חלק האתר', paid: 'שולם', fromRikma: 'מריקמה',
      fixPrice: 'מחיר קבוע', dynamicPrice: 'מחיר מתגבש בתהליך'
    },
    en: {
      backProcess: 'Full process page',
      backList: 'All objects of this type',
      active: 'Active',
      archived: 'Archived — read only',
      readOnly: 'This object is archived: the page is read-only, no actions.',
      actions: 'Actions',
      votePage: 'Vote & negotiation page',
      chat: 'Chat',
      votes: 'Votes & negotiation',
      description: 'Description',
      details: 'Details',
      timers: 'Timers & hours',
      notFound: 'Object not found',
      notFoundSub: 'No object of this type with the requested id in this project.',
      unknownType: 'Unknown object type',
      loading: 'Loading…',
      error: 'Failed to load data',
      hours: 'hours', perhour: 'per hour', price: 'Price', amount: 'Amount', easy: 'Flexibility',
      total: 'Total', month: 'Month', deadline: 'Response deadline (silence = consent)',
      created: 'Created', start: 'Start', finish: 'Finish', due: 'Due', kind: 'Kind',
      progress: 'Progress', of: 'of', by: 'Owner', validator: 'Validator',
      done: 'Done', notDone: 'Not done yet', delivered: 'Delivered', why: 'Summary',
      actsBoard: 'Tasks board', progressBoard: 'Missions in progress', timersBoard: 'Timers',
      salesBoard: 'Sales board', salePage: 'Sale page',
      holderStatus: 'Holder consent',
      holderSelf: 'Self report', holderConfirmed: 'Confirmed by holder',
      holderOpen: 'Awaiting consent', holderLegacy: 'Counted in balance',
      splitState: 'Split', splited: 'Split done', notSplited: 'Not split yet',
      donation: 'Donation', siteShare: 'Site share', paid: 'Paid', fromRikma: 'From rikma',
      fixPrice: 'Fixed price', dynamicPrice: 'Price shaped in process'
    },
    ar: {
      backProcess: 'صفحة العملية الكاملة',
      backList: 'كل الكائنات من هذا النوع',
      active: 'نشط',
      archived: 'أرشيف — للقراءة فقط',
      readOnly: 'هذا الكائن مؤرشف: الصفحة للقراءة فقط، بلا إجراءات.',
      actions: 'إجراءات',
      votePage: 'صفحة التصويت والتفاوض',
      chat: 'دردشة',
      votes: 'التصويت والتفاوض',
      description: 'وصف',
      details: 'تفاصيل',
      timers: 'المؤقتات والساعات',
      notFound: 'الكائن غير موجود',
      notFoundSub: 'لا يوجد كائن من هذا النوع بالمعرف المطلوب في هذا المشروع.',
      unknownType: 'نوع كائن غير معروف',
      loading: 'جارٍ التحميل…',
      error: 'فشل تحميل البيانات',
      hours: 'ساعات', perhour: 'للساعة', price: 'السعر', amount: 'الكمية', easy: 'مرونة',
      total: 'المجموع', month: 'شهر', deadline: 'موعد الرد (الصمت = موافقة)',
      created: 'أنشئ', start: 'بداية', finish: 'نهاية', due: 'موعد', kind: 'نوع',
      progress: 'تقدم', of: 'من', by: 'مسؤول', validator: 'معتمد',
      done: 'تم', notDone: 'لم يتم بعد', delivered: 'تم التوريد', why: 'ملخص',
      actsBoard: 'لوحة المهام', progressBoard: 'المهام قيد التنفيذ', timersBoard: 'المؤقتات',
      salesBoard: 'لوحة المبيعات', salePage: 'صفحة البيع',
      holderStatus: 'موافقة حائز المال',
      holderSelf: 'تقرير ذاتي', holderConfirmed: 'أكده الحائز',
      holderOpen: 'بانتظار الموافقة', holderLegacy: 'محسوب في الرصيد',
      splitState: 'التوزيع', splited: 'تم التوزيع', notSplited: 'لم يوزع بعد',
      donation: 'تبرع', siteShare: 'حصة الموقع', paid: 'مدفوع', fromRikma: 'من مجموعة',
      fixPrice: 'سعر ثابت', dynamicPrice: 'سعر يتشكل في العملية'
    }
  };
  let t = $derived(i18n[$lang] ?? i18n.en);
  let typeLabel = $derived((typeLabels[$lang] ?? typeLabels.en)[type] ?? type);

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

  // Per-type fact rows — only rows with a value render.
  let facts = $derived.by(() => {
    if (!attrs) return [];
    const rows = [];
    const add = (label, value) => {
      if (value !== null && value !== undefined && value !== '') rows.push({ label, value });
    };
    add(t.created, formatDate(attrs.createdAt));
    if (attrs.noofhours != null) add(t.hours, `${attrs.noofhours}${attrs.perhour ? ` · ${attrs.perhour} ${t.perhour}` : ''}`);
    if (type === 'betahalich') {
      add(t.progress, `${Math.round((attrs.howmanyhoursalready ?? 0) * 100) / 100} ${t.of} ${attrs.hoursassinged ?? '—'} ${t.hours}`);
      add(t.start, formatDate(attrs.start));
    }
    add(t.kind, attrs.kindOf);
    if (attrs.price != null) add(t.price, attrs.price);
    if (attrs.hm != null) add(t.amount, attrs.hm);
    if (attrs.easy != null) add(t.easy, attrs.easy);
    if (attrs.quantityDelivered != null) add(t.delivered, `${attrs.quantityDelivered}${attrs.unit ? ` ${attrs.unit}` : ''}`);
    if (attrs.total != null) add(t.total, `${attrs.total}`);
    add(t.month, attrs.month ? formatDate(attrs.month) : null);
    add(t.due, formatDate(attrs.sqadualed ?? attrs.dates ?? attrs.dateF));
    if (type === 'finnished') {
      add(t.start, formatDate(attrs.start));
      add(t.finish, formatDate(attrs.finish));
    }
    if (type === 'act') {
      add(t.by, attrs.my?.data?.attributes?.username);
      add(t.validator, attrs.vali?.data?.attributes?.username);
    }
    add(t.deadline, attrs.timegrama?.data?.attributes?.date ? formatDate(attrs.timegrama.data.attributes.date) : null);
    if (type === 'sale') {
      if (attrs.in != null) add(t.amount, attrs.in);
      const holderLabel =
        attrs.holderStatus === 'self'
          ? t.holderSelf
          : attrs.holderStatus === 'confirmed'
            ? t.holderConfirmed
            : attrs.holderStatus === 'open'
              ? t.holderOpen
              : t.holderLegacy;
      add(t.holderStatus, holderLabel);
      add(t.splitState, attrs.splited ? t.splited : t.notSplited);
      if (attrs.isDonation) add(t.kind, t.donation);
      if (attrs.isSiteShareIncome) {
        const parsed = parseSiteShareNote(attrs.note);
        add(t.kind, t.siteShare);
        if (parsed?.paid != null) add(t.paid, parsed.paid);
        if (parsed?.fromProjectId) add(t.fromRikma, `#${parsed.fromProjectId}`);
      }
      add(t.start, formatDate(attrs.date));
    }
    if (type === 'matanot') {
      add(t.kind, attrs.fixPrice ? t.fixPrice : t.dynamicPrice);
      if (attrs.quant != null) add(t.amount, attrs.quant);
      if (attrs.estimatedPrice != null && attrs.price == null) add(t.price, attrs.estimatedPrice);
    }
    return rows;
  });

  let owner = $derived(attrs?.users_permissions_user?.data ?? attrs?.rishon?.data ?? null);
  let description = $derived(
    type === 'sale'
      ? // a site-share note is a structured string — rendered as parsed facts
        // above, never as raw text
        (attrs?.isSiteShareIncome ? '' : attrs?.note || '')
      : attrs?.descrip || attrs?.des || attrs?.hearotMeyuchadot || attrs?.spnot || attrs?.why || ''
  );

  // Relevant board links per type (in addition to vote/chat/process links)
  let boardLink = $derived.by(() => {
    if (type === 'act') return { href: `/moach/${projectId}/acts`, label: t.actsBoard };
    if (type === 'betahalich') return { href: `/moach/${projectId}/progress/${objectId}`, label: t.progressBoard };
    if (type === 'matanot') return { href: `/moach/${projectId}/sales`, label: t.salesBoard };
    if (type === 'sale') return { href: `/moach/${projectId}/sales/${objectId}`, label: t.salePage };
    return null;
  });
</script>

<svelte:head>
  <title>{entityName} · {typeLabel} · 1lev1</title>
</svelte:head>

<div class="op" dir={$isRtl ? 'rtl' : 'ltr'}>
  <div class="op-nav">
    <a class="op-back" href={`/moach/${projectId}/object/${type}`}>{t.backList}</a>
    {#if processHref}
      <a class="op-back op-back--gold" href={processHref}>{t.backProcess}</a>
    {/if}
  </div>

  {#if loading}
    <div class="op-state"><Lowding /><p class="op-state-sub">{t.loading}</p></div>
  {:else if !config}
    <div class="op-state">
      <p class="op-state-title">{t.unknownType}</p>
      <code class="op-id">{type}</code>
    </div>
  {:else if loadError}
    <div class="op-state">
      <p class="op-state-title">{t.error}</p>
      <code class="op-id">{loadError}</code>
    </div>
  {:else if !entity}
    <div class="op-state">
      <span class="op-state-icon" aria-hidden="true">◈</span>
      <p class="op-state-title">{t.notFound}</p>
      <p class="op-state-sub">{t.notFoundSub}</p>
      <code class="op-id">{type} / {objectId}</code>
    </div>
  {:else}
    <header class="op-header">
      <span class="op-type">{typeLabel}</span>
      <h1 class="op-title">{entityName}</h1>
      <span class="op-badge {isArchived ? 'op-badge--grey' : 'op-badge--green'}">
        {isArchived ? t.archived : t.active}
      </span>
      {#if owner}
        <span class="op-owner">
          {#if owner.attributes?.profilePic?.data?.attributes?.url}
            <img class="op-avatar" src={mediaUrl(owner.attributes.profilePic.data.attributes.url)} alt={owner.attributes.username} loading="lazy" />
          {/if}
          {owner.attributes?.username}
        </span>
      {/if}
    </header>

    {#if isArchived}
      <div class="op-readonly" role="note">{t.readOnly}</div>
    {/if}

    <div class="op-grid">
      <div class="op-main">
        {#if description}
          <section class="op-card">
            <h2 class="op-card-title">{t.description}</h2>
            <RichText editable={false} outpot={description} />
          </section>
        {/if}

        {#if entityVotes}
          <section class="op-card">
            <h2 class="op-card-title">{t.votes}</h2>
            <VoteRounds vots={entityVotes} lang={$lang} />
          </section>
        {/if}

        {#if type === 'betahalich'}
          <section class="op-card">
            <h2 class="op-card-title">{t.timers}</h2>
            <TimersPanel monter={attrs.monter} timers={attrs.timers?.data ?? []} lang={$lang} />
          </section>
        {/if}
      </div>

      <aside class="op-side">
        {#if facts.length > 0}
          <section class="op-card">
            <h2 class="op-card-title">{t.details}</h2>
            <dl class="op-facts">
              {#each facts as fact (fact.label)}
                <div class="op-fact">
                  <dt>{fact.label}</dt>
                  <dd>{fact.value}</dd>
                </div>
              {/each}
            </dl>
          </section>
        {/if}

        <section class="op-card">
          <h2 class="op-card-title">{t.actions}</h2>
          <div class="op-actions">
            {#if !isArchived && config.voteKind}
              <a class="op-action op-action--primary" href={`/moach/${projectId}/votes/${config.voteKind}/${objectId}`}>
                {t.votePage}
              </a>
            {/if}
            {#if forumId}
              <a class="op-action" href={`/forum/${forumId}`}>{t.chat}</a>
            {/if}
            {#if !isArchived && boardLink}
              <a class="op-action" href={boardLink.href}>{boardLink.label}</a>
            {/if}
            {#if processHref}
              <a class="op-action" href={processHref}>{t.backProcess}</a>
            {/if}
          </div>
        </section>
      </aside>
    </div>
  {/if}
</div>

<style>
  /* Moach look — translucent slate cards over the layout's dark gradient,
     site gold (#eee8aa) accents, barbi-pink for "active". Always dark. */
  .op {
    --pcv-card:         rgba(15, 23, 42, 0.72);
    --pcv-node-bg:      rgba(30, 41, 59, 0.55);
    --pcv-node-border:  rgba(148, 163, 184, 0.28);
    --pcv-border:       rgba(148, 163, 184, 0.32);
    --pcv-text:         #f1f5f9;
    --pcv-text-2:       #cbd5e1;
    --pcv-text-3:       #94a3b8;
    --gold:             #eee8aa;
    --rose:             var(--barbi-pink, #ff0092);
    --badge-gold-bg:    rgba(238, 232, 170, 0.14);
    --badge-gold-text:  #eee8aa;
    --badge-rose-bg:    rgba(255,   0, 146, 0.16);
    --badge-rose-text:  #ff9ad5;
    --badge-green-bg:   rgba( 46, 255, 168, 0.12);
    --badge-green-text: #2effa8;
    --badge-sky-bg:     rgba( 34, 211, 238, 0.12);
    --badge-sky-text:   #67e8f9;
    --badge-grey-bg:    rgba(148, 163, 184, 0.14);
    --badge-grey-text:  #94a3b8;

    min-height: 60vh;
    background: transparent;
    padding: 0.25rem 0.25rem 2rem;
    text-align: start;
  }

  .op-nav {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 8px;
    margin-bottom: 14px;
  }

  .op-back {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 5px 12px;
    border-radius: 9999px;
    border: 1px solid var(--pcv-border);
    background: var(--pcv-card);
    font-size: 12px;
    font-weight: 600;
    color: var(--pcv-text-2);
    text-decoration: none;
    transition: border-color 0.12s, color 0.12s, background 0.12s;
  }
  .op-back:hover,
  .op-back--gold {
    border-color: var(--gold);
    color: var(--badge-gold-text);
    background: var(--badge-gold-bg);
  }

  .op-header {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 8px;
    margin-bottom: 12px;
  }

  .op-type {
    font-size: 10px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--badge-gold-text);
    background: var(--badge-gold-bg);
    padding: 2px 10px;
    border-radius: 9999px;
  }

  .op-title {
    margin: 0;
    font-size: clamp(1.05rem, 3vw, 1.4rem);
    font-weight: 700;
    color: var(--gold);
    word-break: break-word;
  }

  .op-badge {
    display: inline-flex;
    align-items: center;
    padding: 2px 10px;
    border-radius: 9999px;
    font-size: 11px;
    font-weight: 600;
    white-space: nowrap;
  }
  .op-badge--green { background: var(--badge-green-bg); color: var(--badge-green-text); }
  .op-badge--grey  { background: var(--badge-grey-bg);  color: var(--badge-grey-text); }

  .op-owner {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    font-size: 12px;
    font-weight: 600;
    color: var(--pcv-text-2);
    margin-inline-start: auto;
  }

  .op-avatar {
    width: 22px;
    height: 22px;
    border-radius: 50%;
    object-fit: cover;
  }

  .op-readonly {
    margin-bottom: 12px;
    padding: 8px 12px;
    border-radius: 10px;
    border: 1px dashed var(--badge-grey-text);
    background: var(--badge-grey-bg);
    color: var(--badge-grey-text);
    font-size: 12px;
    font-weight: 600;
  }

  .op-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 12px;
  }
  @media (min-width: 900px) {
    .op-grid { grid-template-columns: 2fr 1fr; align-items: start; }
  }

  .op-main, .op-side { display: flex; flex-direction: column; gap: 12px; min-width: 0; }

  .op-card {
    border-radius: 12px;
    border: 1px solid var(--pcv-border);
    background: var(--pcv-card);
    padding: 12px 14px;
    color: var(--pcv-text);
    backdrop-filter: blur(6px);
    box-shadow: 0 0 0 1px rgba(238,232,170,.08), 0 4px 24px rgba(0,0,0,.30);
  }

  .op-card-title {
    margin: 0 0 8px;
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--pcv-text-3);
    border-bottom: 1px solid var(--pcv-border);
    padding-bottom: 6px;
  }

  .op-facts { margin: 0; display: flex; flex-direction: column; gap: 6px; }

  .op-fact {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 8px;
    font-size: 12px;
  }
  .op-fact dt { color: var(--pcv-text-3); }
  .op-fact dd { margin: 0; font-weight: 600; color: var(--pcv-text); text-align: end; }

  .op-actions { display: flex; flex-direction: column; gap: 6px; }

  .op-action {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 7px 12px;
    border-radius: 9999px;
    border: 1px solid var(--pcv-border);
    font-size: 12px;
    font-weight: 600;
    color: var(--pcv-text-2);
    text-decoration: none;
    transition: border-color 0.12s, color 0.12s, background 0.12s;
  }
  .op-action:hover {
    border-color: var(--gold);
    color: var(--badge-gold-text);
    background: var(--badge-gold-bg);
  }
  .op-action--primary {
    background: var(--badge-gold-bg);
    border-color: var(--gold);
    color: var(--badge-gold-text);
  }

  .op-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 4rem 1rem;
    text-align: center;
    gap: 10px;
  }
  .op-state-icon { font-size: 2rem; color: var(--badge-gold-text); opacity: 0.4; }
  .op-state-title { margin: 0; font-size: 1rem; font-weight: 600; color: var(--pcv-text); }
  .op-state-sub { margin: 0; font-size: 0.8125rem; color: var(--pcv-text-2); }
  .op-id {
    font-size: 11px;
    font-family: ui-monospace, monospace;
    color: var(--pcv-text-3);
    background: var(--badge-grey-bg);
    padding: 2px 8px;
    border-radius: 6px;
  }
</style>
