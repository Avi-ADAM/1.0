<script>
  /**
   * LevCard — renders exactly one heart item, whatever its `ani` is.
   *
   * This dispatch used to live inline inside the `{#each}` of
   * `cards/cards.svelte`, wrapped in a `<SwiperSlide>` per branch. Pulling it
   * out means the same card can be rendered by anything: the swiper (one per
   * slide), the compact list's expanded overlay (exactly one, on demand), and
   * whatever replaces the swiper later. The container owns layout; this owns
   * only "which card is this, and what props does it take".
   *
   * Nothing here decides *whether* a card is shown — that is the milon gate in
   * `cardKinds.js`, applied by the caller so a filtered-out item never
   * produces an empty slide/row.
   */
  import MissionInProgress from '../missionInProgress.svelte';
  import ProjectSuggestor from '../projectSuggestor.svelte';
  import Reqtojoin from '../reqtojoin.svelte';
  import PendingM from '../pandingMesima.svelte';
  import PendingMa from '../pmas.svelte';
  import Fiappru from '../fiappru.svelte';
  import Mashsug from '../mashsuggest.svelte';
  import Reqtom from '../reqtom.svelte';
  import Weget from '../weget.svelte';
  import Hal from '../halukaask.svelte';
  import Vid from '../didiget.svelte';
  import DecisionMaking from '../decisionMaking.svelte';
  import Welcomt from './welcomeToCard.svelte';
  import ProductRequestCard from './ProductRequestCard.svelte';
  import SaleCard from './SaleCard.svelte';
  import CustomerSaleCard from './CustomerSaleCard.svelte';
  import SiteSharePayCard from './SiteSharePayCard.svelte';
  import StipendDecisionCard from './StipendDecisionCard.svelte';
  import StipendPayCard from './StipendPayCard.svelte';
  import StipendConfirmCard from './StipendConfirmCard.svelte';
  import StipendAccruedCard from './StipendAccruedCard.svelte';
  import SiteShareIncomeCard from './SiteShareIncomeCard.svelte';
  import SiteShareAutoApprovedCard from './SiteShareAutoApprovedCard.svelte';
  import WishOfferCard from './WishOfferCard.svelte';
  import ArchiveObjectCard from './ArchiveObjectCard.svelte';

  /**
   * @typedef {Object} Props
   * @property {any} buble - the DisplayItem to render
   * @property {any} milon - card-type visibility map (see cardKinds.js)
   * @property {boolean} [isVisible] - this card is the one the user is looking at
   * @property {number} [i] - index within the host list, for cards that want it
   * @property {boolean} [low] - compact/loading chrome
   * @property {any[]} [askedarr]
   * @property {any[]} [declineddarr]
   * @property {(payload: any) => void} [onHover]
   * @property {(payload: any) => void} [onProj]
   * @property {(payload: any) => void} [onUser]
   * @property {(payload: any) => void} [onCoinLapach]
   * @property {(payload: any) => void} [onChat]
   */

  /** @type {Props} */
  let {
    buble,
    milon,
    isVisible = false,
    i = 0,
    low = false,
    askedarr = [],
    declineddarr = [],
    onHover,
    onProj,
    onUser,
    onCoinLapach,
    onChat
  } = $props();

  // The branch markup below was written against these short names; keep them
  // rather than rewriting 600 lines of prop wiring.
  const hover = (e) => onHover?.(e);
  const proj = (e) => onProj?.(e);
  const user = (e) => onUser?.(e);
  const delo = (e) => onCoinLapach?.(e);
  const chat = (e) => onChat?.(e);
</script>

{#if buble.ani === 'haluk' && milon.desi == true}
  <Hal
      isVisible={isVisible}
      user_1s={buble.user_1s}
      halukot={buble.halukot}
      forumId={buble.forumId}
      onHover={hover}
      onProj={proj}
      onCoinLapach={delo}
      hervach={buble.hervach}
      siteShare={buble.siteShare}
      onUser={user}
      {low}
      cards="true"
      coinlapach={buble.coinlapach}
      myid={buble.myid}
      pendId={buble.pendId}
      mypos={buble.mypos}
      projectName={buble.projectName}
      name={buble.name}
      src={buble.src}
      projectId={buble.projectId}
      bind:noofusersOk={buble.noofusersOk}
      bind:noofusersNo={buble.noofusersNo}
      bind:noofusersWaiting={buble.noofusersWaiting}
      noofusers={buble.noofusers}
      bind:already={buble.already}
      created_at={buble.created_at}
      bind:users={buble.users}
      diun={buble.diun}
      order={buble.order}
    />
{:else if buble.ani === 'sheirutp' && milon.sheirutp == true}
  <ProductRequestCard
      {buble}
      isFirst={isVisible}
      onProj={proj}
    />
{:else if buble.ani === 'sale' && buble.isSiteShareIncome && milon.sales == true}
  <SiteShareIncomeCard
      {buble}
      isFirst={isVisible}
      onProj={proj}
    />
{:else if buble.ani === 'sale' && milon.sales == true}
  <SaleCard
      {buble}
      isFirst={isVisible}
      onProj={proj}
      {onChat}
    />
{:else if buble.ani === 'buy' && milon.sales == true}
  <CustomerSaleCard
      {buble}
      isFirst={isVisible}
      onProj={proj}
      {onChat}
    />
{:else if buble.ani === 'wishoffer'}
  <WishOfferCard
      {buble}
      isFirst={isVisible}
      onUser={user}
      {onChat}
    />
{:else if buble.ani === 'sitesharepay'}
  <SiteSharePayCard
      {buble}
      isFirst={isVisible}
      onProj={proj}
    />
{:else if buble.ani === 'stipendpay'}
  <StipendPayCard
      {buble}
      isFirst={isVisible}
      onProj={proj}
      onDone={delo}
    />
{:else if buble.ani === 'stipendconfirm'}
  <StipendConfirmCard
      {buble}
      isFirst={isVisible}
      onProj={proj}
      onUser={user}
      onDone={delo}
    />
{:else if buble.ani === 'stipendaccrued'}
  <StipendAccruedCard
      {buble}
      isFirst={isVisible}
      onProj={proj}
      onUser={user}
    />
{:else if buble.ani === 'sitesharedecide'}
  <SiteShareAutoApprovedCard
      {buble}
      isFirst={isVisible}
      onProj={proj}
    />
{:else if buble.ani === 'vidu' && milon.vidu == true}
  <Vid
      isVisible={isVisible}
      onHover={hover}
      onProj={proj}
      onCoinLapach={delo}
      onUser={user}
      {low}
      cards="true"
      send={buble.send}
      recive={buble.recive}
      coinlapach={buble.coinlapach}
      myid={buble.myid}
      pendId={buble.pendId}
      projectName={buble.projectName}
      src={buble.src}
      projectId={buble.projectId}
      sendpropic={buble.sendpropic}
      sendname={buble.sendname}
      respropic={buble.respropic}
      resname={buble.resname}
      kind={buble.kind}
      amount={buble.amount}
      sendcon={buble.senderconf}
      confirmed={buble.confirmed}
      already={buble.already}
      shear={buble.shear}
      hervachti={buble.hervachti}
      created_at={buble.created_at}
      messege={buble.messege}
      order={buble.order}
      forumId={buble.forumId}
    />
{:else if buble.ani === 'mtaha' && milon.betaha == true}
  <MissionInProgress
      onProj={proj}
      cards="true"
      onUser={user}
      onHover={hover}
      {low}
      forumId={buble.forumId}
      restime={buble.restime}
      isVisible={isVisible}
      pu={buble.pu}
      hearotMeyuchadot={buble.hearotMeyuchadot}
      tasks={buble.acts.data}
      status={buble.status}
      tx={buble.tx}
      iskvua={buble.iskvua}
      coinlapach={buble.coinlapach}
      usernames={buble.usernames}
      noofpu={buble.noof}
      oldzman={buble.timer}
      stname={buble.stname}
      mId={buble.id}
      missId={buble.missionId}
      missionName={buble.name}
      projectId={buble.projectId}
      projectName={buble.projectName}
      missionDetails={buble.descrip}
      src={buble.src}
      link={buble.privatlinks}
      dueDateOrCountToDedline={buble.admaticedai}
      startDate={buble.dates}
      hoursdon={buble.howmanyhoursalready}
      hourstotal={buble.hoursassinged}
      perhour={buble.perhour}
      onDone={delo}
    />
{:else if buble.ani === 'pmashes' && milon.ppmash == true}
  <PendingMa
      onHover={hover}
      onProj={proj}
      onUser={user}
      cards="true"
      isVisible={isVisible}
      {low}
      coinlapach={buble.coinlapach}
      onCoinLapach={delo}
      restime={buble.restime}
      ordern={buble.orderon}
      timegramaId={buble.timegramaId}
      messege={buble.messege}
      mysrc={buble.mysrc}
      mypos={buble.mypos}
      diun={buble.diun}
      descrip={buble.descrip}
      projectName={buble.projectName}
      name={buble.name}
      hearotMeyuchadot={buble.hearotMeyuchadot}
      kindOf={buble.kindOf}
      src={buble.src}
      noofusersWaiting={buble.noofusersWaiting}
      projectId={buble.projectId}
      noofusersOk={buble.noofusersOk}
      created_at={buble.created_at}
      noofusersNo={buble.noofusersNo}
      already={buble.already}
      noofusers={buble.noofusers}
      mshaabId={buble.mshaabId}
      hm={buble.hm}
      price={buble.price}
      easy={buble.easy}
      sqadualed={buble.sqadualed}
      sqadualedf={buble.sqadualedf}
      recurring={buble.recurring}
      recurringNoEnd={buble.recurringNoEnd}
      pricePerUnit={buble.pricePerUnit}
      cycleSize={buble.cycleSize}
      linkto={buble.linkto}
      location={buble.location}
      pendId={buble.pendId}
      users={buble.users}
      nego_mashes={buble.nego_mashes || []}
      timeGramaDate={buble.timeGramaDate}
    />
{:else if buble.ani === 'pends' && milon.pend == true}
  <PendingM
      onHover={hover}
      onProj={proj}
      onUser={user}
      onCoinLapach={delo}
      timegramaId={buble.timegramaId}
      {low}
      negopendmissions={buble.negopendmissions}
      isVisible={isVisible}
      createdAt={buble.createdAt}
      restime={buble.restime}
      timegramaDate={buble.timegramaDate}
      publicklinks={buble.publicklinks}
      privatlinks={buble.privatlinks}
      dates={buble.dates}
      ordern={buble.orderon}
      coinlapach={buble.coinlapach}
      messege={buble.messege}
      mysrc={buble.mysrc}
      mypos={buble.mypos}
      descrip={buble.descrip}
      projectName={buble.projectName}
      name={buble.name}
      hearotMeyuchadot={buble.hearotMeyuchadot}
      noofhours={buble.noofhours}
      src={buble.src}
      noofusersWaiting={buble.noofusersWaiting}
      projectId={buble.projectId}
      uids={buble.uids}
      what={buble.what}
      noofusersOk={buble.noofusersOk}
      total={buble.noofhours * buble.perhour}
      perhour={buble.perhour}
      noofusersNo={buble.noofusersNo}
      already={buble.already}
      noofusers={buble.noofusers}
      missionId={buble.missionId}
      skills={buble.skills}
      tafkidims={buble.tafkidims}
      workways={buble.workways}
      mdate={buble.mdate}
      mdates={buble.dates}
      vallues={buble.vallues}
      location={buble.location}
      pendId={buble.pendId}
      isKavua={buble.isKavua}
      diun={buble.diun}
      acts={buble.acts}
      users={buble.users}
      sqadualed={buble.sqadualed}
      cards="true"
    />
{:else if buble.ani === 'wegets' && milon.pmaap == true}
  <Weget
      onAcsept={delo}
      cards="true"
      onDecline={delo}
      onHover={hover}
      onProj={proj}
      onUser={user}
      {low}
      isVisible={isVisible}
      coinlapach={buble.coinlapach}
      mId={buble.mId}
      noofusersWaiting={buble.noofusersWaiting}
      uids={buble.uids}
      kindOf={buble.kindOf}
      noofusersOk={buble.noofusersOk}
      noofusersNo={buble.noofusersNo}
      already={buble.already}
      users={buble.users}
      askId={buble.askId}
      myp={buble.myp}
      projectName={buble.projectName}
      useraplyname={buble.username}
      userId={buble.uid}
      myid={buble.myid}
      isRecurringCycle={buble.isRecurringCycle}
      mashabetahalichId={buble.mashabetahalichId}
      cycleIndex={buble.cycleIndex}
      cycleReported={buble.cycleReported}
      quantityDelivered={buble.quantityDelivered}
      pricePerUnit={buble.pricePerUnit}
      responsibleUserId={buble.responsibleUserId}
      orderon={buble.orderon}
      timegramaId={buble.timegramaId}
      timegramaDate={buble.timegramaDate}
      timegramaDone={buble.timegramaDone}
      spid={buble.spid}
      src={buble.src}
      price={buble.price}
      hm={buble.hm}
      src2={buble.src2}
      why={buble.why}
      whatt={buble.whatt}
      missionBName={buble.openName}
      name={buble.name}
      projectId={buble.projectId}
      noofpu={buble.noof}
      sqadualedf={buble.sqadualedf}
      sqadualed={buble.sqadualed}
      spnot={buble.spnot}
      easy={buble.easy}
      nhours={buble.nhours}
      deadline={buble.deadline}
      missId={buble.missId}
      id={buble.id}
      openMid={buble.omid}
      stylef={buble.stylef}
      st={buble.st}
      declined={buble.decid}
    />
{:else if buble.ani === 'fiapp' && milon.fiap == true}
  <Fiappru
      onAcsept={delo}
      onDecline={delo}
      onHover={hover}
      onProj={proj}
      onUser={user}
      cards="true"
      {low}
      timegramaId={buble.timegramaId}
      timegramaDate={buble.timegramaDate}
      isVisible={isVisible}
      coinlapach={buble.coinlapach}
      mId={buble.mId}
      noofusersWaiting={buble.noofusersWaiting}
      uids={buble.uids}
      what={buble.what}
      noofusersOk={buble.noofusersOk}
      noofusersNo={buble.noofusersNo}
      already={buble.already}
      users={buble.users}
      askId={buble.askId}
      projectName={buble.projectName}
      useraplyname={buble.username}
      userId={buble.uid}
      missionDetails={buble.descrip}
      src={buble.src}
      src2={buble.src2}
      why={buble.why}
      whatt={buble.whatt}
      whattid={buble.whattid}
      missionBName={buble.openName}
      name={buble.name}
      projectId={buble.projectId}
      noofpu={buble.noof}
      publicklinks={buble.publicklinks}
      privatlinks={buble.privatlinks}
      hearotMeyuchadot={buble.hearotMeyuchadot}
      valph={buble.perhour}
      nhours={buble.nhours}
      deadline={buble.deadline}
      missId={buble.missId}
      id={buble.id}
      openMid={buble.omid}
      stylef={buble.stylef}
      st={buble.st}
      declined={buble.decid}
    />
{:else if buble.ani === 'walcomen' && milon.welc == true}
  <Welcomt
      welcomId={buble.welcomeId}
      id={buble.id}
      src={buble.src}
      onHover={hover}
      coinlapach={buble.coinlapach}
      onCoinLapach={delo}
      username={buble.username}
      projectName={buble.projectName}
      projectId={buble.projectId}
      partnershipDetails={buble.details}
      pd={buble.pd}
    />
{:else if buble.ani === 'askedcoin' && milon.asks == true}
  <Reqtojoin
      onAcsept={delo}
      onHover={hover}
      onProj={proj}
      onUser={user}
      onDecline={delo}
      cards="true"
      isVisible={isVisible}
      iskvua={buble.iskvua}
      email={buble.email}
      role={buble.role}
      workways={buble.workways}
      userSkills={buble.userSkills}
      userRole={buble.userRole}
      userWorkway={buble.userWorkway}
      skills={buble.skills}
      coinlapach={buble.coinlapach}
      {low}
      pid={buble.pid}
      chat={buble.chat}
      noofusersWaiting={buble.noofusersWaiting}
      uids={buble.uids}
      what={buble.what}
      noofusersOk={buble.noofusersOk}
      noofusersNo={buble.noofusersNo}
      already={buble.already}
      users={buble.users}
      askId={buble.askId}
      projectName={buble.projectName}
      useraplyname={buble.username}
      userId={buble.uid}
      missionDetails={buble.missionDetails}
      src={buble.src}
      src2={buble.src2}
      openmissionName={buble.openName}
      name={buble.name}
      projectId={buble.projectId}
      noofpu={buble.noof}
      publicklinks={buble.publicklinks}
      privatlinks={buble.privatlinks}
      hearotMeyuchadot={buble.hearotMeyuchadot}
      valph={buble.perhour}
      nhours={buble.nhours}
      deadline={buble.deadline}
      sqedualed={buble.sqedualed}
      missId={buble.missId}
      id={buble.id}
      acts={buble.acts}
      openMid={buble.omid}
      stylef={buble.stylef}
      st={buble.st}
      isRishon={buble?.openMissionData?.isRishon || buble.isRishon}
      myid={buble.myid}
      declined={buble.decid}
      timegramaId={buble.timegramaId}
      timegramaDate={buble.timegramaDate}
      timegramaDone={buble.timegramaDone}
      negopendmissions={buble.negopendmissions || []}
      orderon={buble.orderon || 0}
      forumId={buble.forumId}
      selfNomination={buble.openMissionData?.source === 'selfNomination'}
    />
{:else if buble.ani === 'askedm' && milon.askmap == true}
  <Reqtom
      onAcsept={delo}
      onDecline={delo}
      onHover={hover}
      onProj={proj}
      cards="true"
      onUser={user}
      onChat={chat}
      isVisible={isVisible}
      {low}
      pid={buble.pid}
      coinlapach={buble.coinlapach}
      noofusersWaiting={buble.noofusersWaiting}
      uids={buble.uids}
      what={buble.what}
      noofusersOk={buble.noofusersOk}
      noofusersNo={buble.noofusersNo}
      already={buble.already}
      users={buble.users}
      askId={buble.askId}
      projectName={buble.projectName}
      useraplyname={buble.username}
      userId={buble.uid}
      missionDetails={buble.descrip}
      src={buble.src}
      src2={buble.src2}
      openmissionName={buble.openName}
      name={buble.name}
      projectId={buble.projectId}
      noofpu={buble.noof}
      myp={buble.myp}
      easy={buble.easy}
      spnot={buble.spnot}
      hearotMeyuchadot={buble.spnot}
      price={buble.price}
      deadline={buble.deadline}
      sqadualedf={buble.sqadualedf}
      kindOf={buble.kindOf}
      recurring={buble.recurring}
      cycleSize={buble.cycleSize}
      missId={buble.missId}
      id={buble.id}
      openMid={buble.omid}
      stylef={buble.stylef}
      st={buble.st}
      declined={buble.decid}
      spid={buble.spid}
      timegramaId={buble.timegramaId}
      timegramaDate={buble.timegramaDate}
      timegramaDone={buble.timegramaDone}
      pmashId={buble.pmashId}
      isRishon={buble.isSelfProposal === true}
      pendingMainVote={buble.pendingMainVote === true}
      negopendmissions={buble.negopendmissions || []}
      orderon={buble.orderon || 0}
      selfNomination={buble.openMashaabimData?.source === 'selfNomination'}
    />
{:else if buble.ani === 'meData' && milon.sugg == true}
  <ProjectSuggestor
      onLess={delo}
      onHover={hover}
      onProj={proj}
      onUser={user}
      isVisible={isVisible}
      coinlapach={buble.coinlapach}
      {low}
      pid={buble.pid}
      noOfusers={buble.noOfusers}
      acts={buble.acts}
      restime={buble.restime}
      chat={buble.chat ?? null}
      askId={buble.askId ?? null}
      myRoundProposedBy={buble.myRoundProposedBy ?? null}
      myOrdern={buble.myOrdern ?? 0}
      myAskUsers={buble.myAskUsers ?? []}
      myRound={buble.myRound ?? null}
      alreadyi={buble.alreadyi}
      {askedarr}
      {declineddarr}
      deadLine={buble.sqadualed}
      forumId={buble.forumId}
      oid={buble.id}
      projectName={buble.projectName}
      sourceHref={buble.sourceHref ?? null}
      offerHref={buble.offerHref ?? null}
      role={buble.tafkidims}
      skills={buble.skills}
      missionDetails={buble.descrip}
      hearotMeyuchadot={buble.hearotMeyuchadot}
      src={buble.src}
      missionName={buble.name}
      projectId={buble.projectId}
      workways={buble.work_ways}
      noOfHours={buble.noofhours}
      perhour={buble.perhour}
      total={buble.noofhours * buble.perhour}
      stipendRate={buble.stipendRate ?? 0}
      stipendCostShare={buble.stipendCostShare ?? 1}
      stipendMode={buble.stipendMode ?? 'equity'}
      stipendFunderName={buble.stipendFunderName ?? ''}
      selfNomination={buble.source === 'selfNomination'}
      cards="true"
    />
{:else if buble.ani === 'huca' && milon.pmashs == true}
  <Mashsug
      onLess={delo}
      cards="true"
      onHover={hover}
      onProj={proj}
      onUser={user}
      messege={buble.messege}
      {i}
      isVisible={isVisible}
      coinlapach={buble.coinlapach}
      {low}
      {askedarr}
      declineddarra={buble.declineddarra}
      deadLine={buble.sqadualed}
      sqadualedf={buble.sqadualedf}
      kindOf={buble.kindOf}
      recurring={buble.recurring}
      cycleSize={buble.cycleSize}
      oid={buble.oid}
      id={buble.id}
      askId={buble.myAskId ?? buble.askId ?? 1}
      myRoundProposedBy={buble.myRoundProposedBy ?? null}
      myOrdern={buble.myOrdern ?? 0}
      myAskUsers={buble.myAskUsers ?? []}
      myRound={buble.myRound ?? null}
      price={buble.price}
      myp={buble.myp}
      already={buble.already}
      restime={buble.restime}
      projectName={buble.projectName}
      sourceHref={buble.sourceHref ?? null}
      offerHref={buble.offerHref ?? null}
      missionDetails={buble.descrip}
      notes={buble.hearotMeyuchadot}
      src={buble.srcb}
      mashName={buble.mashname}
      projectId={buble.projectId}
      descrip={buble.descrip}
      spnot={buble.spnot}
      easy={buble.easy}
      selfNomination={buble.source === 'selfNomination'}
    />
{:else if buble.ani === 'archObject' && milon.hachla == true}
  <ArchiveObjectCard
      archive={buble.archive}
      projectId={buble.projectId}
      projectName={buble.projectName}
      logoSrc={buble.src}
      memberCount={buble.noof}
      timegramaDate={buble.timegramaDate}
      isFirst={isVisible}
      onProj={proj}
      onUser={user}
      onChat={chat}
      onDone={delo}
    />
{:else if buble.ani === 'stipend' && milon.hachla == true}
  <StipendDecisionCard
      stipend={buble.stipend}
      myId={buble.myid}
      projectId={buble.projectId}
      projectName={buble.projectName}
      logoSrc={buble.src}
      timegramaDate={buble.timegramaDate}
      isFirst={isVisible}
      onProj={proj}
      onUser={user}
      onChat={chat}
      onDone={delo}
    />
{:else if buble.ani === 'hachla' && milon.hachla == true}
  <DecisionMaking
      onAcsept={delo}
      onDecline={delo}
      onHover={hover}
      onProj={proj}
      cards="true"
      onChat={chat}
      timegramaDate={buble.timegramaDate}
      timegramaId={buble.timegramaId}
      restime={buble.restime}
      noofpu={buble.noofpu ?? buble.noof}
      newpicid={buble?.newpicid}
      coinlapach={buble.coinlapach}
      created_at={buble.created_at}
      spdata={buble.spdata}
      isVisible={isVisible}
      kind={buble.kind}
      messege={buble.messege}
      myid={buble.myid}
      noofusersWaiting={buble.noofusersWaiting}
      uids={buble.uids}
      what={buble.mypos}
      noofusersOk={buble.noofusersOk}
      noofusersNo={buble.noofusersNo}
      already={buble.already}
      users={buble.users}
      askId={buble.pendId}
      projectName={buble.projectName}
      projectId={buble.projectId}
      userId={buble.uid}
      src={buble.src}
      src2={buble?.newpic}
      stylef={buble.stylef}
      st={buble.st}
      spid={buble.spid}
      saleClaim={buble.saleClaim}
      {low}
    />
{/if}
