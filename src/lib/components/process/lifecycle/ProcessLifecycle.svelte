<script>
  import { nameOf } from '$lib/translation/memberName';
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
  import EquityPreview from '$lib/components/equity/EquityPreview.svelte';
  import { mediaUrl } from '$lib/utils/processLifecycle';
  import { isRtl, t } from '$lib/translations';
  import { lang as uiLang } from '$lib/stores/lang.js';
  import Money from '$lib/components/money/Money.svelte';
  import { resolveRate } from '$lib/timers/rate.js';

  let {
    kind = 'mission', // 'mission' | 'resource'
    chain,
    projectId,
    lang = 'en'
  } = $props();


  let base = $derived(`/moach/${projectId}`);

  // ── Chain slices ─────────────────────────────────────────────────────────
  let pendm = $derived(kind === 'mission' ? (chain?.pendm ?? null) : null);
  let openMission = $derived(kind === 'mission' ? (chain?.openMission ?? null) : null);
  let betahalich = $derived(kind === 'mission' ? (chain?.mesimabetahalich ?? null) : null);
  let finiapruvals = $derived(kind === 'mission' ? (chain?.finiapruvals ?? []) : []);
  let finnished = $derived(kind === 'mission' ? (chain?.finnishedMission ?? null) : null);
  // One row per rate era: a mission whose hourly value the rikma changed
  // mid-way keeps its hours before the change at the old value on their own row.
  let finnishedRows = $derived(
    kind === 'mission'
      ? (chain?.finnishedMissions?.length ? chain.finnishedMissions : finnished ? [finnished] : [])
      : []
  );
  let rateRows = $derived(
    finnishedRows.map((fm) => {
      const a = fm?.attributes ?? {};
      const hours = Number(a.noofhours) || 0;
      const rate = a.perhour == null ? null : Number(a.perhour);
      const total = a.total != null ? Number(a.total) : rate != null ? hours * rate : null;
      return { id: fm.id, hours, rate, total };
    })
  );
  let rateRowsHours = $derived(rateRows.reduce((sum, r) => sum + r.hours, 0));
  let rateRowsValue = $derived(rateRows.reduce((sum, r) => sum + (r.total ?? 0), 0));

  /** The hourly value an approval asks the rikma to sign, as it will be filed. */
  function approvalRate(fAttrs) {
    const rate = resolveRate(
      fAttrs?.perhour,
      fAttrs?.timer?.data?.attributes?.rate,
      betahalich?.attributes?.perhour
    );
    return rate > 0 ? rate : null;
  }
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
        $uiLang,
        { day: 'numeric', month: 'short', year: 'numeric' }
      );
    } catch {
      return '';
    }
  }

  function formatNum(value) {
    const n = Number(value);
    if (!Number.isFinite(n)) return '';
    return n.toLocaleString($uiLang, { maximumFractionDigits: 2 });
  }

  function archStatus(archived, activeText, activeTone) {
    return archived
      ? { text: $t('moach.lifecycle.archived'), tone: 'grey' }
      : { text: activeText, tone: activeTone };
  }
</script>

<div class="pl" dir={$isRtl ? 'rtl' : 'ltr'}>
  {#if kind === 'mission'}
    <!-- ── 1 · Initial decision (pendm) ──────────────────────────────────── -->
    {#if pendm}
      {@const attrs = pendm.attributes ?? {}}
      <LifecycleStation
        label={$t('moach.lifecycle.pendm')}
        name={attrs.name ?? `#${pendm.id}`}
        status={archStatus(attrs.archived, $t('moach.lifecycle.pending'), 'gold')}
        createdAt={attrs.createdAt}
        href={`${base}/object/pendm/${pendm.id}`}
        hrefLabel={$t('moach.lifecycle.objectPage')}
        forumId={attrs.forums?.data?.[0]?.id ?? null}
        chatLabel={$t('moach.lifecycle.chat')}
        tone="gold"
        isLast={isLast('pendm')}
        {lang}
      >
        {#if plainText(attrs.descrip || attrs.hearotMeyuchadot)}
          <p class="pl-desc">{plainText(attrs.descrip || attrs.hearotMeyuchadot)}</p>
        {/if}
        <div class="pl-facts">
          {#if attrs.noofhours}
            <span class="pl-fact">{attrs.noofhours} {$t('moach.lifecycle.hours')}{#if attrs.perhour} · <Money amount={attrs.perhour} /> {$t('moach.lifecycle.perhour')}{/if}</span>
          {/if}
          {#if attrs.timegrama?.data?.attributes?.date}
            <span class="pl-fact">{$t('moach.lifecycle.deadline')}: {formatDate(attrs.timegrama.data.attributes.date)}</span>
          {/if}
        </div>
        <div class="pl-votes">
          <h4 class="pl-subheading">{$t('moach.lifecycle.votes')}</h4>
          <VoteRounds vots={attrs.users} {lang} />
          {#if !attrs.archived}
            <a class="pl-action" href={`${base}/votes/pendm/${pendm.id}`}>{$t('moach.lifecycle.votePage')} ←</a>
          {/if}
        </div>
      </LifecycleStation>
    {/if}

    <!-- ── 2 · Open offer + join requests ────────────────────────────────── -->
    {#if openMission}
      {@const attrs = openMission.attributes ?? {}}
      <LifecycleStation
        label={$t('moach.lifecycle.openMission')}
        name={attrs.name ?? `#${openMission.id}`}
        status={archStatus(attrs.archived, $t('moach.lifecycle.open'), 'sky')}
        createdAt={attrs.createdAt}
        href={`${base}/object/openMission/${openMission.id}`}
        hrefLabel={$t('moach.lifecycle.objectPage')}
        tone="sky"
        isLast={isLast('openMission')}
        {lang}
      >
        {#if plainText(attrs.descrip || attrs.hearotMeyuchadot)}
          <p class="pl-desc">{plainText(attrs.descrip || attrs.hearotMeyuchadot)}</p>
        {/if}

        <!-- Still an offer nobody executes: the share is what whoever takes it
             would earn. It lives in the open pipeline, so price it from there.
             Once execution starts the equity block moves to that station. -->
        {#if projectId && !betahalich && Number(attrs.noofhours) > 0 && Number(attrs.perhour) > 0}
          <div class="pl-equity">
            <EquityPreview
              {projectId}
              missionValue={Number(attrs.noofhours) * Number(attrs.perhour)}
              alreadyCountedIn="pipeline"
            />
          </div>
        {/if}

        {#if asks.length > 0}
          <div class="pl-votes">
            <h4 class="pl-subheading">{$t('moach.lifecycle.asks')} ({asks.length})</h4>
            <div class="pl-cards">
              {#each asks as ask (ask.id)}
                {@const askUser = ask.attributes?.users_permissions_user?.data}
                <div class="pl-card">
                  <div class="pl-card-head">
                    {#if askUser?.attributes?.profilePic?.data?.attributes?.url}
                      <img
                        class="pl-avatar"
                        src={mediaUrl(askUser.attributes.profilePic.data.attributes.url)}
                        alt={$nameOf(askUser.attributes)}
                        loading="lazy"
                      />
                    {/if}
                    <span class="pl-card-name">{$nameOf(askUser?.attributes) || `#${ask.id}`}</span>
                    <span class="pl-badge {ask.attributes?.archived ? 'pl-badge--grey' : 'pl-badge--blue'}">
                      {ask.attributes?.archived ? $t('moach.lifecycle.resolved') : $t('moach.lifecycle.open')}
                    </span>
                    <span class="pl-card-links">
                      {#if ask.attributes?.forums?.data?.[0]?.id}
                        <a class="pl-action" href={`/forum/${ask.attributes.forums.data[0].id}`}>{$t('moach.lifecycle.chat')}</a>
                      {/if}
                      {#if !ask.attributes?.archived}
                        <a class="pl-action" href={`${base}/votes/ask/${ask.id}`}>{$t('moach.lifecycle.votePage')}</a>
                      {/if}
                      <a class="pl-action" href={`${base}/object/ask/${ask.id}`}>{$t('moach.lifecycle.objectPage')}</a>
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
        label={$t('moach.lifecycle.execution')}
        name={attrs.name ?? `#${betahalich.id}`}
        status={attrs.finnished
          ? { text: $t('moach.lifecycle.completed'), tone: 'grey' }
          : { text: $t('moach.lifecycle.active'), tone: 'rose' }}
        createdAt={attrs.createdAt}
        href={`${base}/object/betahalich/${betahalich.id}`}
        hrefLabel={$t('moach.lifecycle.objectPage')}
        forumId={attrs.forums?.data?.[0]?.id ?? null}
        chatLabel={$t('moach.lifecycle.chat')}
        tone="rose"
        isLast={isLast('betahalich')}
        {lang}
      >
        <div class="pl-facts">
          {#if bUser}
            <span class="pl-fact pl-fact--user">
              {#if bUser.attributes?.profilePic?.data?.attributes?.url}
                <img class="pl-avatar" src={mediaUrl(bUser.attributes.profilePic.data.attributes.url)} alt={$nameOf(bUser.attributes)} loading="lazy" />
              {/if}
              {$nameOf(bUser.attributes)}
            </span>
          {/if}
          <span class="pl-fact">
            {Math.round((attrs.howmanyhoursalready ?? 0) * 100) / 100}
            {#if attrs.hoursassinged}&nbsp;{$t('moach.lifecycle.of')} {attrs.hoursassinged}{/if}
            {$t('moach.lifecycle.hours')}
          </span>
        </div>

        {#if acts.length > 0}
          <div class="pl-votes">
            <h4 class="pl-subheading">{$t('moach.lifecycle.acts')} ({acts.length})</h4>
            <ul class="pl-acts">
              {#each acts as act (act.id)}
                {@const actAttrs = act.attributes ?? {}}
                <li class="pl-act">
                  <a class="pl-act-name" href={`${base}/object/act/${act.id}`}>{actAttrs.shem ?? `#${act.id}`}</a>
                  {#if $nameOf(actAttrs.my?.data?.attributes)}
                    <span class="pl-act-user">{$t('moach.lifecycle.by')} {$nameOf(actAttrs.my.data.attributes)}</span>
                  {/if}
                  {#if actAttrs.dateF}
                    <span class="pl-act-date">{formatDate(actAttrs.dateF)}</span>
                  {/if}
                  {#if actAttrs.naasa && actAttrs.myIshur && actAttrs.valiIshur}
                    <span class="pl-badge pl-badge--green">{$t('moach.lifecycle.approvedBy')}</span>
                  {:else if actAttrs.naasa}
                    <span class="pl-badge pl-badge--gold">{$t('moach.lifecycle.done')} · {$t('moach.lifecycle.awaiting')}</span>
                  {:else}
                    <span class="pl-badge pl-badge--grey">{$t('moach.lifecycle.notDone')}</span>
                  {/if}
                </li>
              {/each}
            </ul>
          </div>
        {/if}

        <TimersPanel
          monter={attrs.monter}
          timers={attrs.timers?.data ?? []}
          hoursassinged={attrs.hoursassinged}
          counter={attrs.howmanyhoursalready}
          perhour={attrs.perhour}
        />

        <!-- What this mission is worth as a share of the rikma. A mission in
             progress is already inside the approved baseline, so it must not be
             added on top of it a second time (alreadyCountedIn="approved");
             a `kvua` one earns its value every month, which unlocks the
             1/2/5-year horizons. -->
        {#if projectId && Number(attrs.hoursassinged) > 0 && Number(attrs.perhour) > 0}
          {@const cycleValue = Number(attrs.hoursassinged) * Number(attrs.perhour)}
          <div class="pl-equity">
            <EquityPreview
              {projectId}
              missionValue={cycleValue}
              monthlyValue={attrs.iskvua ? cycleValue : null}
              alreadyCountedIn="approved"
            />
          </div>
        {/if}
      </LifecycleStation>
    {/if}

    <!-- ── 4 · Finish approvals ──────────────────────────────────────────── -->
    {#if finiapruvals.length > 0}
      <LifecycleStation
        label={$t('moach.lifecycle.approvals')}
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
                  {@const aRate = approvalRate(fAttrs)}
                  <!-- Each approval is filed at the value its hours were worked
                       at, so after a mid-mission change two approvals of the same
                       mission can carry different values — say which. -->
                  <span class="pl-fact">{fAttrs.noofhours} {$t('moach.lifecycle.hours')}{#if aRate != null} × <Money amount={aRate} /> {$t('moach.lifecycle.perhour')}{/if}</span>
                {/if}
                <span class="pl-badge {fAttrs.archived ? 'pl-badge--green' : 'pl-badge--gold'}">
                  {fAttrs.archived ? $t('moach.lifecycle.resolved') : $t('moach.lifecycle.pending')}
                </span>
                <span class="pl-card-links">
                  <a class="pl-action" href={`${base}/object/finiapruval/${fini.id}`}>{$t('moach.lifecycle.objectPage')}</a>
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
        label={$t('moach.lifecycle.archive')}
        name={fAttrs?.missionName ?? (chain?.finnishedMissionId ? `#${chain.finnishedMissionId}` : $t('moach.lifecycle.noEntity'))}
        status={{ text: $t('moach.lifecycle.completed'), tone: 'green' }}
        createdAt={fAttrs?.createdAt}
        href={`${base}/object/finnished/${finnished?.id ?? chain?.finnishedMissionId}`}
        hrefLabel={$t('moach.lifecycle.objectPage')}
        tone="green"
        isLast={isLast('archive')}
        {lang}
      >
        {#if fAttrs}
          {@const fHours = fAttrs.noofhours ?? null}
          {@const fRate = fAttrs.perhour ?? null}
          {@const fTotal =
            fAttrs.total ?? (fHours != null && fRate != null ? fHours * fRate : null)}
          <div class="pl-facts">
            {#if fAttrs.start}<span class="pl-fact">{$t('moach.lifecycle.start')}: {formatDate(fAttrs.start)}</span>{/if}
            {#if fAttrs.finish}<span class="pl-fact">{$t('moach.lifecycle.finish')}: {formatDate(fAttrs.finish)}</span>{/if}
            <!-- hours × rate = money. `total` is the money value, never hours. -->
            {#if rateRows.length > 1}
              <!-- More than one rate era: one line per hourly value, then the
                   sum — never Σ hours × the latest value. -->
              <div class="pl-eras">
                <span class="pl-eras-note">{$t('moach.lifecycle.rateEras')}</span>
                <ul class="pl-eras-list">
                  {#each rateRows as row (row.id)}
                    <li class="pl-fact">
                      {formatNum(row.hours)} {$t('moach.lifecycle.hours')}{#if row.rate != null} × <Money amount={row.rate} /> {$t('moach.lifecycle.perhour')}{/if}{#if row.total != null} = <Money amount={row.total} />{/if}
                    </li>
                  {/each}
                </ul>
                <span class="pl-fact">
                  {$t('moach.lifecycle.rateEraTotal')}: {formatNum(rateRowsHours)} {$t('moach.lifecycle.hours')} · <Money amount={rateRowsValue} />
                </span>
              </div>
            {:else if fHours != null}
              <span class="pl-fact">
                {formatNum(fHours)} {$t('moach.lifecycle.hours')}{#if fRate != null} × <Money amount={fRate} /> {$t('moach.lifecycle.perhour')}{/if}
              </span>
            {/if}
            {#if fTotal != null && rateRows.length <= 1}<span class="pl-fact">{$t('moach.lifecycle.total')}: <Money amount={fTotal} /></span>{/if}
          </div>
          {#if plainText(fAttrs.why || fAttrs.descrip)}
            <p class="pl-desc">{$t('moach.lifecycle.why')}: {plainText(fAttrs.why || fAttrs.descrip)}</p>
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
        label={$t('moach.lifecycle.pmash')}
        name={attrs.name ?? `#${pmash.id}`}
        status={archStatus(attrs.archived, $t('moach.lifecycle.pending'), 'gold')}
        createdAt={attrs.createdAt}
        href={`${base}/object/pmash/${pmash.id}`}
        hrefLabel={$t('moach.lifecycle.objectPage')}
        forumId={attrs.forums?.data?.[0]?.id ?? null}
        chatLabel={$t('moach.lifecycle.chat')}
        tone="gold"
        isLast={isLast('pmash')}
        {lang}
      >
        {#if plainText(attrs.descrip || attrs.spnot)}
          <p class="pl-desc">{plainText(attrs.descrip || attrs.spnot)}</p>
        {/if}
        <div class="pl-facts">
          {#if attrs.price}<span class="pl-fact">{$t('moach.lifecycle.price')}: <Money amount={attrs.price} /></span>{/if}
          {#if attrs.hm}<span class="pl-fact">{$t('moach.lifecycle.amount')}: {attrs.hm}</span>{/if}
          {#if attrs.timegrama?.data?.attributes?.date}
            <span class="pl-fact">{$t('moach.lifecycle.deadline')}: {formatDate(attrs.timegrama.data.attributes.date)}</span>
          {/if}
        </div>
        <div class="pl-votes">
          <h4 class="pl-subheading">{$t('moach.lifecycle.votes')}</h4>
          <VoteRounds vots={attrs.users} {lang} />
          {#if !attrs.archived}
            <a class="pl-action" href={`${base}/votes/pmash/${pmash.id}`}>{$t('moach.lifecycle.votePage')} ←</a>
          {/if}
        </div>
      </LifecycleStation>
    {/if}

    <!-- ── 2 · Open resource ─────────────────────────────────────────────── -->
    {#if openMashaabim}
      {@const attrs = openMashaabim.attributes ?? {}}
      <LifecycleStation
        label={$t('moach.lifecycle.openMashaabim')}
        name={attrs.name ?? `#${openMashaabim.id}`}
        status={archStatus(attrs.archived, $t('moach.lifecycle.open'), 'sky')}
        createdAt={attrs.createdAt}
        href={`${base}/object/openMashaabim/${openMashaabim.id}`}
        hrefLabel={$t('moach.lifecycle.objectPage')}
        tone="sky"
        isLast={isLast('openMashaabim')}
        {lang}
      >
        {#if plainText(attrs.descrip || attrs.spnot)}
          <p class="pl-desc">{plainText(attrs.descrip || attrs.spnot)}</p>
        {/if}
        <div class="pl-facts">
          {#if attrs.kindOf}<span class="pl-fact">{attrs.kindOf}</span>{/if}
          {#if attrs.price}<span class="pl-fact">{$t('moach.lifecycle.price')}: <Money amount={attrs.price} /></span>{/if}
          {#if attrs.hm}<span class="pl-fact">{$t('moach.lifecycle.amount')}: {attrs.hm}</span>{/if}
        </div>
      </LifecycleStation>
    {/if}

    <!-- ── 3 · Supply proposals (askms) ──────────────────────────────────── -->
    {#if askms.length > 0}
      <LifecycleStation
        label={$t('moach.lifecycle.askms')}
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
                  <img class="pl-avatar" src={mediaUrl(aUser.attributes.profilePic.data.attributes.url)} alt={$nameOf(aUser.attributes)} loading="lazy" />
                {/if}
                <span class="pl-card-name">{$nameOf(aUser?.attributes) || `#${askm.id}`}</span>
                <span class="pl-badge {aAttrs.archived ? 'pl-badge--grey' : 'pl-badge--blue'}">
                  {aAttrs.archived ? $t('moach.lifecycle.resolved') : $t('moach.lifecycle.open')}
                </span>
                <span class="pl-card-links">
                  {#if aAttrs.forum?.data?.id}
                    <a class="pl-action" href={`/forum/${aAttrs.forum.data.id}`}>{$t('moach.lifecycle.chat')}</a>
                  {/if}
                  {#if !aAttrs.archived}
                    <a class="pl-action" href={`${base}/votes/askm/${askm.id}`}>{$t('moach.lifecycle.votePage')}</a>
                  {/if}
                  <a class="pl-action" href={`${base}/object/askm/${askm.id}`}>{$t('moach.lifecycle.objectPage')}</a>
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
        label={$t('moach.lifecycle.maap')}
        name={attrs.name ?? `#${maap.id}`}
        status={archStatus(attrs.archived, $t('moach.lifecycle.inProgress'), 'rose')}
        createdAt={attrs.createdAt}
        href={`${base}/object/maap/${maap.id}`}
        hrefLabel={$t('moach.lifecycle.objectPage')}
        forumId={attrs.forum?.data?.id ?? null}
        chatLabel={$t('moach.lifecycle.chat')}
        tone="rose"
        isLast={isLast('maap')}
        {lang}
      >
        <div class="pl-facts">
          {#if attrs.quantityDelivered != null}
            <span class="pl-fact">{$t('moach.lifecycle.amount')}: {attrs.quantityDelivered}{attrs.unit ? ` ${attrs.unit}` : ''}</span>
          {/if}
        </div>
        <div class="pl-votes">
          <h4 class="pl-subheading">{$t('moach.lifecycle.votes')}</h4>
          <VoteRounds vots={attrs.vots} {lang} />
        </div>
      </LifecycleStation>
    {/if}

    <!-- ── 5 · Received (rikmashes) ──────────────────────────────────────── -->
    {#if rikmashes.length > 0}
      <LifecycleStation
        label={$t('moach.lifecycle.rikmash')}
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
                {#if rAttrs.total != null}<span class="pl-fact">{$t('moach.lifecycle.total')}: <Money amount={rAttrs.total} /></span>{/if}
                {#if rAttrs.price != null}<span class="pl-fact">{$t('moach.lifecycle.price')}: <Money amount={rAttrs.price} /></span>{/if}
                {#if rAttrs.createdAt}<span class="pl-fact">{formatDate(rAttrs.createdAt)}</span>{/if}
                <span class="pl-card-links">
                  <a class="pl-action" href={`${base}/object/rikmash/${rikmash.id}`}>{$t('moach.lifecycle.objectPage')}</a>
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

  .pl-eras {
    display: flex;
    flex-direction: column;
    gap: 4px;
    flex-basis: 100%;
  }
  .pl-eras-note {
    font-size: 12px;
    color: var(--pcv-text-2, #57534e);
  }
  .pl-eras-list {
    margin: 0;
    padding: 0;
    list-style: none;
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
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

  /* The equity widget brings its own (tailwind) skin — cap its width so it
     reads as a card inside the station instead of a full-width banner. */
  .pl-equity {
    max-width: 30rem;
  }

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
