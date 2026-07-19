<script>
  /**
   * ProcessLifecycle — the detailed, vertical life-story of one mission or
   * resource chain: initial decision (votes + negotiation + chat), the open
   * offer and its join requests, execution (acts, timers per month), finish
   * approvals and the official archive. Every station links to the
   * standalone object page (/moach/[projectId]/object/[type]/[id]).
   */
  import LifecycleStation from './LifecycleStation.svelte';
  import VoteRounds from './VoteRounds.svelte';
  import TimersPanel from './TimersPanel.svelte';
  import { mediaUrl } from '$lib/utils/processLifecycle';

  let {
    kind = 'mission', // 'mission' | 'resource'
    chain,
    projectId,
    lang = 'en'
  } = $props();

  const i18n = {
    he: {
      pendm: 'החלטה ראשונית — משימה',
      pmash: 'החלטה ראשונית — משאב',
      openMission: 'הצעה פתוחה',
      openMashaabim: 'משאב פתוח',
      asks: 'בקשות הצטרפות',
      askms: 'הצעות אספקה',
      execution: 'ביצוע',
      acts: 'מטלות',
      approvals: 'אשרורי סיום',
      maap: 'אספקה בתהליך',
      archive: 'ארכיון רשמי',
      rikmash: 'התקבל — ארכיון',
      votes: 'הצבעות ומו״מ',
      chat: 'צ׳אט',
      objectPage: 'לעמוד האובייקט',
      votePage: 'לעמוד ההצבעה',
      active: 'פעיל',
      open: 'פתוח',
      pending: 'ממתין',
      archived: 'ארכיון',
      resolved: 'הוכרע',
      completed: 'הושלם',
      inProgress: 'בתהליך',
      hours: 'שעות',
      perhour: 'לשעה',
      of: 'מתוך',
      deadline: 'מועד מענה (שתיקה = הסכמה)',
      price: 'מחיר',
      amount: 'כמות',
      total: 'סה״כ',
      why: 'סיכום',
      done: 'בוצע',
      notDone: 'טרם בוצע',
      approvedBy: 'אושר ע״י שני הצדדים',
      awaiting: 'ממתין לאישור',
      by: 'ע״י',
      start: 'התחלה',
      finish: 'סיום',
      noEntity: '—'
    },
    en: {
      pendm: 'Initial decision — mission',
      pmash: 'Initial decision — resource',
      openMission: 'Open offer',
      openMashaabim: 'Open resource',
      asks: 'Join requests',
      askms: 'Supply proposals',
      execution: 'Execution',
      acts: 'Tasks',
      approvals: 'Finish approvals',
      maap: 'Delivery in progress',
      archive: 'Official archive',
      rikmash: 'Received — archive',
      votes: 'Votes & negotiation',
      chat: 'Chat',
      objectPage: 'Object page',
      votePage: 'Vote page',
      active: 'Active',
      open: 'Open',
      pending: 'Pending',
      archived: 'Archived',
      resolved: 'Resolved',
      completed: 'Completed',
      inProgress: 'In progress',
      hours: 'hours',
      perhour: 'per hour',
      of: 'of',
      deadline: 'Response deadline (silence = consent)',
      price: 'Price',
      amount: 'Amount',
      total: 'Total',
      why: 'Summary',
      done: 'Done',
      notDone: 'Not done yet',
      approvedBy: 'Approved by both sides',
      awaiting: 'Awaiting approval',
      by: 'by',
      start: 'Start',
      finish: 'Finish',
      noEntity: '—'
    },
    ar: {
      pendm: 'قرار أولي — مهمة',
      pmash: 'قرار أولي — مورد',
      openMission: 'عرض مفتوح',
      openMashaabim: 'مورد مفتوح',
      asks: 'طلبات انضمام',
      askms: 'عروض توريد',
      execution: 'تنفيذ',
      acts: 'مهام',
      approvals: 'موافقات الإنهاء',
      maap: 'توريد قيد التنفيذ',
      archive: 'الأرشيف الرسمي',
      rikmash: 'تم الاستلام — أرشيف',
      votes: 'التصويت والتفاوض',
      chat: 'دردشة',
      objectPage: 'صفحة الكائن',
      votePage: 'صفحة التصويت',
      active: 'نشط',
      open: 'مفتوح',
      pending: 'معلق',
      archived: 'أرشيف',
      resolved: 'محسوم',
      completed: 'مكتمل',
      inProgress: 'قيد التنفيذ',
      hours: 'ساعات',
      perhour: 'للساعة',
      of: 'من',
      deadline: 'موعد الرد (الصمت = موافقة)',
      price: 'السعر',
      amount: 'الكمية',
      total: 'المجموع',
      why: 'ملخص',
      done: 'تم',
      notDone: 'لم يتم بعد',
      approvedBy: 'وافق الطرفان',
      awaiting: 'بانتظار الموافقة',
      by: 'بواسطة',
      start: 'بداية',
      finish: 'نهاية',
      noEntity: '—'
    }
  };
  let t = $derived(i18n[lang] ?? i18n.en);

  let base = $derived(`/moach/${projectId}`);

  // ── Chain slices ─────────────────────────────────────────────────────────
  let pendm = $derived(kind === 'mission' ? (chain?.pendm ?? null) : null);
  let openMission = $derived(kind === 'mission' ? (chain?.openMission ?? null) : null);
  let betahalich = $derived(kind === 'mission' ? (chain?.mesimabetahalich ?? null) : null);
  let finiapruvals = $derived(kind === 'mission' ? (chain?.finiapruvals ?? []) : []);
  let finnished = $derived(kind === 'mission' ? (chain?.finnishedMission ?? null) : null);
  let acts = $derived(kind === 'mission' ? (chain?.acts ?? []) : []);
  let asks = $derived(openMission?.attributes?.asks?.data ?? []);

  let pmash = $derived(kind === 'resource' ? (chain?.pmash ?? null) : null);
  let openMashaabim = $derived(kind === 'resource' ? (chain?.openMashaabim ?? null) : null);
  let askms = $derived(kind === 'resource' ? (chain?.askms ?? []) : []);
  let maap = $derived(kind === 'resource' ? (chain?.maap ?? null) : null);
  let rikmashes = $derived(kind === 'resource' ? (chain?.rikmashes ?? []) : []);

  // Ordered list of visible station keys, to know which one is last
  let stations = $derived(
    kind === 'mission'
      ? [
          pendm && 'pendm',
          openMission && 'openMission',
          betahalich && 'betahalich',
          finiapruvals.length > 0 && 'approvals',
          (finnished || chain?.finnishedMissionId) && 'archive'
        ].filter(Boolean)
      : [
          pmash && 'pmash',
          openMashaabim && 'openMashaabim',
          askms.length > 0 && 'askms',
          maap && 'maap',
          rikmashes.length > 0 && 'rikmash'
        ].filter(Boolean)
  );

  function isLast(key) {
    return stations[stations.length - 1] === key;
  }

  function plainText(value) {
    if (!value) return '';
    return String(value).replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  }

  function formatDate(value) {
    if (!value) return '';
    try {
      return new Date(value).toLocaleDateString(
        lang === 'he' ? 'he-IL' : lang === 'ar' ? 'ar' : 'en-GB',
        { day: 'numeric', month: 'short', year: 'numeric' }
      );
    } catch {
      return '';
    }
  }

  function archStatus(archived, activeText, activeTone) {
    return archived
      ? { text: t.archived, tone: 'grey' }
      : { text: activeText, tone: activeTone };
  }
</script>

<div class="pl" dir={lang === 'he' || lang === 'ar' ? 'rtl' : 'ltr'}>
  {#if kind === 'mission'}
    <!-- ── 1 · Initial decision (pendm) ──────────────────────────────────── -->
    {#if pendm}
      {@const attrs = pendm.attributes ?? {}}
      <LifecycleStation
        label={t.pendm}
        name={attrs.name ?? `#${pendm.id}`}
        status={archStatus(attrs.archived, t.pending, 'gold')}
        createdAt={attrs.createdAt}
        href={`${base}/object/pendm/${pendm.id}`}
        hrefLabel={t.objectPage}
        forumId={attrs.forums?.data?.[0]?.id ?? null}
        chatLabel={t.chat}
        tone="gold"
        isLast={isLast('pendm')}
        {lang}
      >
        {#if plainText(attrs.descrip || attrs.hearotMeyuchadot)}
          <p class="pl-desc">{plainText(attrs.descrip || attrs.hearotMeyuchadot)}</p>
        {/if}
        <div class="pl-facts">
          {#if attrs.noofhours}
            <span class="pl-fact">{attrs.noofhours} {t.hours}{attrs.perhour ? ` · ${attrs.perhour} ${t.perhour}` : ''}</span>
          {/if}
          {#if attrs.timegrama?.data?.attributes?.date}
            <span class="pl-fact">{t.deadline}: {formatDate(attrs.timegrama.data.attributes.date)}</span>
          {/if}
        </div>
        <div class="pl-votes">
          <h4 class="pl-subheading">{t.votes}</h4>
          <VoteRounds vots={attrs.users} {lang} />
          {#if !attrs.archived}
            <a class="pl-action" href={`${base}/votes/pendm/${pendm.id}`}>{t.votePage} ←</a>
          {/if}
        </div>
      </LifecycleStation>
    {/if}

    <!-- ── 2 · Open offer + join requests ────────────────────────────────── -->
    {#if openMission}
      {@const attrs = openMission.attributes ?? {}}
      <LifecycleStation
        label={t.openMission}
        name={attrs.name ?? `#${openMission.id}`}
        status={archStatus(attrs.archived, t.open, 'sky')}
        createdAt={attrs.createdAt}
        href={`${base}/object/openMission/${openMission.id}`}
        hrefLabel={t.objectPage}
        tone="sky"
        isLast={isLast('openMission')}
        {lang}
      >
        {#if plainText(attrs.descrip || attrs.hearotMeyuchadot)}
          <p class="pl-desc">{plainText(attrs.descrip || attrs.hearotMeyuchadot)}</p>
        {/if}
        {#if asks.length > 0}
          <div class="pl-votes">
            <h4 class="pl-subheading">{t.asks} ({asks.length})</h4>
            <div class="pl-cards">
              {#each asks as ask (ask.id)}
                {@const askUser = ask.attributes?.users_permissions_user?.data}
                <div class="pl-card">
                  <div class="pl-card-head">
                    {#if askUser?.attributes?.profilePic?.data?.attributes?.url}
                      <img
                        class="pl-avatar"
                        src={mediaUrl(askUser.attributes.profilePic.data.attributes.url)}
                        alt={askUser.attributes.username}
                        loading="lazy"
                      />
                    {/if}
                    <span class="pl-card-name">{askUser?.attributes?.username ?? `#${ask.id}`}</span>
                    <span class="pl-badge {ask.attributes?.archived ? 'pl-badge--grey' : 'pl-badge--blue'}">
                      {ask.attributes?.archived ? t.resolved : t.open}
                    </span>
                    <span class="pl-card-links">
                      {#if ask.attributes?.forums?.data?.[0]?.id}
                        <a class="pl-action" href={`/forum/${ask.attributes.forums.data[0].id}`}>{t.chat}</a>
                      {/if}
                      {#if !ask.attributes?.archived}
                        <a class="pl-action" href={`${base}/votes/ask/${ask.id}`}>{t.votePage}</a>
                      {/if}
                      <a class="pl-action" href={`${base}/object/ask/${ask.id}`}>{t.objectPage}</a>
                    </span>
                  </div>
                  <VoteRounds vots={ask.attributes?.vots} {lang} />
                </div>
              {/each}
            </div>
          </div>
        {/if}
      </LifecycleStation>
    {/if}

    <!-- ── 3 · Execution ─────────────────────────────────────────────────── -->
    {#if betahalich}
      {@const attrs = betahalich.attributes ?? {}}
      {@const bUser = attrs.users_permissions_user?.data}
      <LifecycleStation
        label={t.execution}
        name={attrs.name ?? `#${betahalich.id}`}
        status={attrs.finnished
          ? { text: t.completed, tone: 'grey' }
          : { text: t.active, tone: 'rose' }}
        createdAt={attrs.createdAt}
        href={`${base}/object/betahalich/${betahalich.id}`}
        hrefLabel={t.objectPage}
        forumId={attrs.forums?.data?.[0]?.id ?? null}
        chatLabel={t.chat}
        tone="rose"
        isLast={isLast('betahalich')}
        {lang}
      >
        <div class="pl-facts">
          {#if bUser}
            <span class="pl-fact pl-fact--user">
              {#if bUser.attributes?.profilePic?.data?.attributes?.url}
                <img class="pl-avatar" src={mediaUrl(bUser.attributes.profilePic.data.attributes.url)} alt={bUser.attributes.username} loading="lazy" />
              {/if}
              {bUser.attributes?.username}
            </span>
          {/if}
          <span class="pl-fact">
            {Math.round((attrs.howmanyhoursalready ?? 0) * 100) / 100}
            {#if attrs.hoursassinged}&nbsp;{t.of} {attrs.hoursassinged}{/if}
            {t.hours}
          </span>
        </div>

        {#if acts.length > 0}
          <div class="pl-votes">
            <h4 class="pl-subheading">{t.acts} ({acts.length})</h4>
            <ul class="pl-acts">
              {#each acts as act (act.id)}
                {@const actAttrs = act.attributes ?? {}}
                <li class="pl-act">
                  <a class="pl-act-name" href={`${base}/object/act/${act.id}`}>{actAttrs.shem ?? `#${act.id}`}</a>
                  {#if actAttrs.my?.data?.attributes?.username}
                    <span class="pl-act-user">{t.by} {actAttrs.my.data.attributes.username}</span>
                  {/if}
                  {#if actAttrs.dateF}
                    <span class="pl-act-date">{formatDate(actAttrs.dateF)}</span>
                  {/if}
                  {#if actAttrs.naasa && actAttrs.myIshur && actAttrs.valiIshur}
                    <span class="pl-badge pl-badge--green">{t.approvedBy}</span>
                  {:else if actAttrs.naasa}
                    <span class="pl-badge pl-badge--gold">{t.done} · {t.awaiting}</span>
                  {:else}
                    <span class="pl-badge pl-badge--grey">{t.notDone}</span>
                  {/if}
                </li>
              {/each}
            </ul>
          </div>
        {/if}

        <TimersPanel monter={attrs.monter} timers={attrs.timers?.data ?? []} {lang} />
      </LifecycleStation>
    {/if}

    <!-- ── 4 · Finish approvals ──────────────────────────────────────────── -->
    {#if finiapruvals.length > 0}
      <LifecycleStation
        label={t.approvals}
        name=""
        tone="violet"
        isLast={isLast('approvals')}
        {lang}
      >
        <div class="pl-cards">
          {#each finiapruvals as fini (fini.id)}
            {@const fAttrs = fini.attributes ?? {}}
            <div class="pl-card">
              <div class="pl-card-head">
                <span class="pl-card-name">{fAttrs.missname ?? `#${fini.id}`}</span>
                {#if fAttrs.month}
                  <span class="pl-fact">{formatDate(fAttrs.month)}</span>
                {/if}
                {#if fAttrs.noofhours}
                  <span class="pl-fact">{fAttrs.noofhours} {t.hours}</span>
                {/if}
                <span class="pl-badge {fAttrs.archived ? 'pl-badge--green' : 'pl-badge--gold'}">
                  {fAttrs.archived ? t.resolved : t.pending}
                </span>
                <span class="pl-card-links">
                  <a class="pl-action" href={`${base}/object/finiapruval/${fini.id}`}>{t.objectPage}</a>
                </span>
              </div>
              <VoteRounds vots={fAttrs.vots} {lang} />
            </div>
          {/each}
        </div>
      </LifecycleStation>
    {/if}

    <!-- ── 5 · Official archive ──────────────────────────────────────────── -->
    {#if finnished || chain?.finnishedMissionId}
      {@const fAttrs = finnished?.attributes ?? null}
      <LifecycleStation
        label={t.archive}
        name={fAttrs?.missionName ?? (chain?.finnishedMissionId ? `#${chain.finnishedMissionId}` : t.noEntity)}
        status={{ text: t.completed, tone: 'green' }}
        createdAt={fAttrs?.createdAt}
        href={`${base}/object/finnished/${finnished?.id ?? chain?.finnishedMissionId}`}
        hrefLabel={t.objectPage}
        tone="green"
        isLast={isLast('archive')}
        {lang}
      >
        {#if fAttrs}
          <div class="pl-facts">
            {#if fAttrs.start}<span class="pl-fact">{t.start}: {formatDate(fAttrs.start)}</span>{/if}
            {#if fAttrs.finish}<span class="pl-fact">{t.finish}: {formatDate(fAttrs.finish)}</span>{/if}
            {#if fAttrs.total != null}<span class="pl-fact">{t.total}: {fAttrs.total} {t.hours}</span>{/if}
          </div>
          {#if plainText(fAttrs.why || fAttrs.descrip)}
            <p class="pl-desc">{t.why}: {plainText(fAttrs.why || fAttrs.descrip)}</p>
          {/if}
        {/if}
      </LifecycleStation>
    {/if}

  {:else}
    <!-- ══ RESOURCE CHAIN ═══════════════════════════════════════════════════ -->

    <!-- ── 1 · Initial decision (pmash) ──────────────────────────────────── -->
    {#if pmash}
      {@const attrs = pmash.attributes ?? {}}
      <LifecycleStation
        label={t.pmash}
        name={attrs.name ?? `#${pmash.id}`}
        status={archStatus(attrs.archived, t.pending, 'gold')}
        createdAt={attrs.createdAt}
        href={`${base}/object/pmash/${pmash.id}`}
        hrefLabel={t.objectPage}
        forumId={attrs.forums?.data?.[0]?.id ?? null}
        chatLabel={t.chat}
        tone="gold"
        isLast={isLast('pmash')}
        {lang}
      >
        {#if plainText(attrs.descrip || attrs.spnot)}
          <p class="pl-desc">{plainText(attrs.descrip || attrs.spnot)}</p>
        {/if}
        <div class="pl-facts">
          {#if attrs.price}<span class="pl-fact">{t.price}: {attrs.price}</span>{/if}
          {#if attrs.hm}<span class="pl-fact">{t.amount}: {attrs.hm}</span>{/if}
          {#if attrs.timegrama?.data?.attributes?.date}
            <span class="pl-fact">{t.deadline}: {formatDate(attrs.timegrama.data.attributes.date)}</span>
          {/if}
        </div>
        <div class="pl-votes">
          <h4 class="pl-subheading">{t.votes}</h4>
          <VoteRounds vots={attrs.users} {lang} />
          {#if !attrs.archived}
            <a class="pl-action" href={`${base}/votes/pmash/${pmash.id}`}>{t.votePage} ←</a>
          {/if}
        </div>
      </LifecycleStation>
    {/if}

    <!-- ── 2 · Open resource ─────────────────────────────────────────────── -->
    {#if openMashaabim}
      {@const attrs = openMashaabim.attributes ?? {}}
      <LifecycleStation
        label={t.openMashaabim}
        name={attrs.name ?? `#${openMashaabim.id}`}
        status={archStatus(attrs.archived, t.open, 'sky')}
        createdAt={attrs.createdAt}
        href={`${base}/object/openMashaabim/${openMashaabim.id}`}
        hrefLabel={t.objectPage}
        tone="sky"
        isLast={isLast('openMashaabim')}
        {lang}
      >
        {#if plainText(attrs.descrip || attrs.spnot)}
          <p class="pl-desc">{plainText(attrs.descrip || attrs.spnot)}</p>
        {/if}
        <div class="pl-facts">
          {#if attrs.kindOf}<span class="pl-fact">{attrs.kindOf}</span>{/if}
          {#if attrs.price}<span class="pl-fact">{t.price}: {attrs.price}</span>{/if}
          {#if attrs.hm}<span class="pl-fact">{t.amount}: {attrs.hm}</span>{/if}
        </div>
      </LifecycleStation>
    {/if}

    <!-- ── 3 · Supply proposals (askms) ──────────────────────────────────── -->
    {#if askms.length > 0}
      <LifecycleStation
        label={t.askms}
        name=""
        tone="blue"
        isLast={isLast('askms')}
        {lang}
      >
        <div class="pl-cards">
          {#each askms as askm (askm.id)}
            {@const aAttrs = askm.attributes ?? {}}
            {@const aUser =
              aAttrs.users_permissions_user?.data ??
              aAttrs.sp?.data?.attributes?.users_permissions_user?.data}
            <div class="pl-card">
              <div class="pl-card-head">
                {#if aUser?.attributes?.profilePic?.data?.attributes?.url}
                  <img class="pl-avatar" src={mediaUrl(aUser.attributes.profilePic.data.attributes.url)} alt={aUser.attributes.username} loading="lazy" />
                {/if}
                <span class="pl-card-name">{aUser?.attributes?.username ?? `#${askm.id}`}</span>
                <span class="pl-badge {aAttrs.archived ? 'pl-badge--grey' : 'pl-badge--blue'}">
                  {aAttrs.archived ? t.resolved : t.open}
                </span>
                <span class="pl-card-links">
                  {#if aAttrs.forum?.data?.id}
                    <a class="pl-action" href={`/forum/${aAttrs.forum.data.id}`}>{t.chat}</a>
                  {/if}
                  {#if !aAttrs.archived}
                    <a class="pl-action" href={`${base}/votes/askm/${askm.id}`}>{t.votePage}</a>
                  {/if}
                  <a class="pl-action" href={`${base}/object/askm/${askm.id}`}>{t.objectPage}</a>
                </span>
              </div>
              <VoteRounds vots={aAttrs.vots} {lang} />
            </div>
          {/each}
        </div>
      </LifecycleStation>
    {/if}

    <!-- ── 4 · Delivery in progress (maap) ───────────────────────────────── -->
    {#if maap}
      {@const attrs = maap.attributes ?? {}}
      <LifecycleStation
        label={t.maap}
        name={attrs.name ?? `#${maap.id}`}
        status={archStatus(attrs.archived, t.inProgress, 'rose')}
        createdAt={attrs.createdAt}
        href={`${base}/object/maap/${maap.id}`}
        hrefLabel={t.objectPage}
        forumId={attrs.forum?.data?.id ?? null}
        chatLabel={t.chat}
        tone="rose"
        isLast={isLast('maap')}
        {lang}
      >
        <div class="pl-facts">
          {#if attrs.quantityDelivered != null}
            <span class="pl-fact">{t.amount}: {attrs.quantityDelivered}{attrs.unit ? ` ${attrs.unit}` : ''}</span>
          {/if}
        </div>
        <div class="pl-votes">
          <h4 class="pl-subheading">{t.votes}</h4>
          <VoteRounds vots={attrs.vots} {lang} />
        </div>
      </LifecycleStation>
    {/if}

    <!-- ── 5 · Received (rikmashes) ──────────────────────────────────────── -->
    {#if rikmashes.length > 0}
      <LifecycleStation
        label={t.rikmash}
        name=""
        tone="green"
        isLast={isLast('rikmash')}
        {lang}
      >
        <div class="pl-cards">
          {#each rikmashes as rikmash (rikmash.id)}
            {@const rAttrs = rikmash.attributes ?? {}}
            <div class="pl-card">
              <div class="pl-card-head">
                <span class="pl-card-name">{rAttrs.name ?? `#${rikmash.id}`}</span>
                {#if rAttrs.total != null}<span class="pl-fact">{t.total}: {rAttrs.total}</span>{/if}
                {#if rAttrs.price != null}<span class="pl-fact">{t.price}: {rAttrs.price}</span>{/if}
                {#if rAttrs.createdAt}<span class="pl-fact">{formatDate(rAttrs.createdAt)}</span>{/if}
                <span class="pl-card-links">
                  <a class="pl-action" href={`${base}/object/rikmash/${rikmash.id}`}>{t.objectPage}</a>
                </span>
              </div>
            </div>
          {/each}
        </div>
      </LifecycleStation>
    {/if}
  {/if}
</div>

<style>
  .pl {
    display: flex;
    flex-direction: column;
    padding: 14px 16px;
  }

  .pl-desc {
    margin: 0;
    font-size: 12px;
    line-height: 1.5;
    color: var(--pcv-text-2, #78716c);
    max-width: 46rem;
  }

  .pl-facts {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 6px;
  }

  .pl-fact {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    font-size: 11px;
    color: var(--pcv-text-2, #78716c);
    background: var(--badge-grey-bg, rgba(107,114,128,.08));
    padding: 2px 8px;
    border-radius: 6px;
  }

  .pl-fact--user { font-weight: 600; color: var(--pcv-text, #1c1917); }

  .pl-avatar {
    width: 18px;
    height: 18px;
    border-radius: 50%;
    object-fit: cover;
    flex-shrink: 0;
  }

  .pl-subheading {
    margin: 0;
    font-size: 10px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--pcv-text-3, #a8a29e);
  }

  .pl-votes {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .pl-action {
    align-self: flex-start;
    font-size: 11px;
    font-weight: 600;
    color: var(--badge-gold-text, #b45309);
    text-decoration: none;
    padding: 2px 8px;
    border-radius: 9999px;
    background: var(--badge-gold-bg, rgba(245,158,11,.08));
    transition: background 0.12s;
    white-space: nowrap;
  }
  .pl-action:hover { background: var(--badge-gold-bg, rgba(245,158,11,.16)); filter: brightness(1.05); }

  .pl-cards {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .pl-card {
    display: flex;
    flex-direction: column;
    gap: 6px;
    padding: 8px 10px;
    border-radius: 10px;
    border: 1px solid var(--pcv-node-border, #e7e5e4);
    background: var(--pcv-card, #ffffff);
  }

  .pl-card-head {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 6px;
  }

  .pl-card-name {
    font-size: 12px;
    font-weight: 700;
    color: var(--pcv-text, #1c1917);
  }

  .pl-card-links {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    margin-inline-start: auto;
  }

  .pl-badge {
    display: inline-flex;
    align-items: center;
    padding: 1px 7px;
    border-radius: 9999px;
    font-size: 10px;
    font-weight: 600;
    white-space: nowrap;
  }
  .pl-badge--blue  { background: var(--badge-sky-bg, rgba(2,132,199,.10));    color: var(--badge-sky-text, #0369a1); }
  .pl-badge--gold  { background: var(--badge-gold-bg, rgba(217,119,6,.10));   color: var(--badge-gold-text, #b45309); }
  .pl-badge--green { background: var(--badge-green-bg, rgba(5,150,105,.10));  color: var(--badge-green-text, #065f46); }
  .pl-badge--grey  { background: var(--badge-grey-bg, rgba(107,114,128,.10)); color: var(--badge-grey-text, #6b7280); }

  .pl-acts {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .pl-act {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 6px;
    padding: 5px 8px;
    border-radius: 8px;
    background: var(--pcv-node-bg, #ffffff);
    border: 1px solid var(--pcv-node-border, #e7e5e4);
  }

  .pl-act-name {
    font-size: 12px;
    font-weight: 600;
    color: var(--pcv-text, #1c1917);
    text-decoration: none;
  }
  .pl-act-name:hover { color: var(--badge-gold-text, #b45309); }

  .pl-act-user,
  .pl-act-date {
    font-size: 11px;
    color: var(--pcv-text-3, #a8a29e);
  }
</style>
