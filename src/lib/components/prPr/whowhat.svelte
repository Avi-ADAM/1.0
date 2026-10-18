<script>
  import { t } from '$lib/translations';
  import { get } from 'svelte/store';
  import pic from './../../celim/pic.js';
  import { idPr } from '../../stores/idPr.js';
  import { onMount } from 'svelte';
  import { executeAction } from '$lib/client/actionClient.js';
  import { computeSiteShare } from '$lib/revenue/computeSiteShare.js';
  import { SITE_SHARE_FLAGS, DEFAULT_SITE_SHARE_CONFIG } from '$lib/revenue/config.js';
  import { useFormatMoney } from '$lib/money/context.svelte';
  import { isSiteShareNote } from '$lib/revenue/parseSiteShareNote';
  import { toast } from 'svelte-sonner';
  import Spinner from '$lib/celim/Spinner.svelte';
  import SiteShareDecision from '$lib/components/revenue/SiteShareDecision.svelte';
  /**
   * @typedef {Object} Props
   * @property {any} [fmiData]
   * @property {any} [rikmashes]
   * @property {any} [stipendPayments]
   * @property {boolean} [hagdel]
   * @property {any} [salee]
   * @property {number} [allin]
   * @property {any} restime
   * @property {any} trili
   * @property {any} users
   * @property {boolean} [already]
   */

  /** @type {Props} */
  let {
    fmiData = [],
    rikmashes = [],
    stipendPayments = [],
    hagdel = false,
    salee = [],
    allin = 0,
    restime,
    trili,
    users,
    already = $bindable(false)
  } = $props();
  let revach = allin;
  let x = [];
  let meca = [];
  let miDatan = [];
  let noten = [];
  // what about hours alrerady done to mission in progres
  // matbea: Matbea,
  function remove(id) {
    console.log(id);
  }
  function edit(id) {
    console.log(id);
  }
  function confirm(id) {
    console.log(id);
  }
  // A rikma with no accrued value yet has a zero denominator; 0/0 renders as
  // "NaN%" on screen, which is the first thing a brand-new rikma shows.
  function percentage(partialValue, totalValue) {
    if (!totalValue) return 0;
    return (100 * partialValue) / totalValue;
  }
  /**
   * One-member rikma: there is no second voter, so a split proposal is
   * unanimous the moment it is created (see the solo branch in `ask()`).
   */
  let isSoloRikma = $derived((users?.length ?? 0) === 1);
  let ulist = $state([]);
  // Display preference: card grid (default) or the legacy spreadsheet table.
  // Both render the same ulist + platform site-share, just different layouts.
  let viewMode = $state('cards'); // 'cards' | 'table'
  let dictid = {};
  let dictidi = {};
  let hal = false;
  let error1 = null;

  function checkSplitChanges() {
    if (
      !currentTosplit ||
      !currentTosplit.attributes.halukas ||
      !currentTosplit.attributes.hervachti
    ) {
      return;
    }

    const existingHalukas = currentTosplit.attributes.halukas.data;
    const existingHervachti = currentTosplit.attributes.hervachti;

    // Check if amounts have changed
    let hasChanges = false;

    // Compare hervachti (split amounts)
    for (let i = 0; i < ulist.length; i++) {
      const currentUser = ulist[i];
      const existingHervachti = currentTosplit.attributes.hervachti.find(
        (h) => h.users_permissions_user.data.id == currentUser.uid
      );

      if (existingHervachti) {
        // Check if the amount has changed
        if (Math.abs(existingHervachti.amount - currentUser.x) > 0.01) {
          hasChanges = true;
          break;
        }
      } else if (currentUser.x > 0) {
        // New user with amount
        hasChanges = true;
        break;
      }
    }

    // Compare halukas (transfers) - only consider unconfirmed ones as changeable
    if (!hasChanges) {
      const currentTransfers = [];
      for (let i = 0; i < ulist.length; i++) {
        if (ulist[i].le && ulist[i].noten > 0) {
          for (let j = 0; j < ulist[i].le.length; j++) {
            // Platform (site-share) transfers are tracked separately and are NOT
            // part of the tosplit's halukas, so they must be excluded here —
            // otherwise the count never matches and "split changed" fires falsely.
            if (ulist[i].le[j].platform === true) continue;
            currentTransfers.push({
              from: ulist[i].uid,
              to: ulist[i].le[j].leid,
              amount: ulist[i].le[j].cama
            });
          }
        }
      }

      // Only consider unconfirmed halukas for comparison
      const unconfirmedHalukas = existingHalukas.filter(
        (h) => !h.attributes.confirmed
      );

      if (currentTransfers.length !== unconfirmedHalukas.length) {
        hasChanges = true;
      } else {
        // Check each transfer against unconfirmed halukas
        for (let transfer of currentTransfers) {
          const existingTransfer = unconfirmedHalukas.find(
            (h) =>
              h.attributes.usersend.data.id == transfer.from &&
              h.attributes.userrecive.data.id == transfer.to
          );

          if (
            !existingTransfer ||
            Math.abs(existingTransfer.attributes.amount - transfer.amount) >
              0.01
          ) {
            hasChanges = true;
            break;
          }
        }
      }
    }

    // Build change details
    let changes = [];
    let changesForDisplay = [];

    // Check for new users
    const existingUserIds = existingHervachti.map(
      (h) => h.users_permissions_user.data.id
    );
    for (let user of ulist) {
      if (user.x > 0 && !existingUserIds.includes(user.uid)) {
        const addedText = get(t)('mission.whowhat.addedToSplit');
        changes.push(`${user.username} ${addedText}`);
        changesForDisplay.push({
          label: `${user.username}:`,
          oldValue: '0',
          newValue: user.x.toFixed(2)
        });
      }
    }

    // Check for amount changes
    for (let i = 0; i < ulist.length; i++) {
      const currentUser = ulist[i];
      const existingUser = existingHervachti.find(
        (h) => h.users_permissions_user.data.id == currentUser.uid
      );

      if (
        existingUser &&
        Math.abs(existingUser.amount - currentUser.x) > 0.01
      ) {
        changes.push(
          `${currentUser.username}: ${existingUser.amount.toFixed(2)} → ${currentUser.x.toFixed(2)}`
        );
        changesForDisplay.push({
          label: `${currentUser.username}:`,
          oldValue: existingUser.amount.toFixed(2),
          newValue: currentUser.x.toFixed(2)
        });
      }
    }

    // Check for new sales. A sale that is already in voting (`pending`) or already
    // linked to THIS tosplit is part of the active proposal — NOT a new addition.
    // Only a sale that is neither splited, nor pending, nor linked to any tosplit
    // counts as genuinely new. (Without the `pending` guard a sale that lost its
    // tosplit link during an update reappears here as a phantom "new sale".)
    const existingSalesIds = currentTosplit.attributes.sales?.data?.map(s => s.id) || [];
    const newSales = salee
      .filter(s =>
        // Only *effective* sales enter a tosplit. A sale whose holder hasn't
        // consented yet (holderStatus:'open') is not counted in any balance
        // until it matures (PLAN_sale_holder_consent). null/self/confirmed pass.
        s.attributes.holderStatus !== 'open' &&
        !s.attributes.splited &&
        !s.attributes.pending &&
        !existingSalesIds.includes(s.id) &&
        (!s.attributes.tosplits?.data || s.attributes.tosplits.data.length === 0)
      )
      .map(s => s.id);

    if (newSales.length > 0) {
      hasChanges = true;
      const newSalesText = get(t)('mission.whowhat.newSalesAdded');
      changes.push(`${newSales.length} ${newSalesText}`);
      changesForDisplay.push({
        label: get(t)('mission.whowhat.newSalesLabel'),
        oldValue: existingSalesIds.length.toString(),
        newValue: (existingSalesIds.length + newSales.length).toString()
      });
    }

    splitChanged = hasChanges;
    showUpdateSuggestion = hasChanges;
    changeDetails = changes.join(', ');
    changesList = changesForDisplay;
  }

  async function updateTosplit() {
    // A discount ("pay less") must carry a reason (PLAN §4) — same rule as ask().
    if (
      SITE_SHARE_FLAGS.manualSplit &&
      platformInfo?.configured &&
      siteShareDirection === 'less' &&
      !siteShareReason.trim()
    ) {
      toast.error(get(t)('mission.whowhat.reasonForDiscount'));
      return;
    }

    let d = new Date();

    try {
      // The recomputed split, as transfers. Platform (site-share) legs are kept
      // apart: they must NOT enter the tosplit's gating `halukas` set, or the
      // platform member's confirmation would gate the partners (mirrors ask()).
      const transfers = [];
      const platformTransfers = [];
      for (let i = 0; i < ulist.length; i++) {
        if (ulist[i].noten > 0 && ulist[i].le) {
          for (let x = 0; x < ulist[i].le.length; x++) {
            const leg = {
              from: String(ulist[i].uid),
              to: String(ulist[i].le[x].leid),
              amount: parseFloat(ulist[i].le[x].cama.toFixed(2))
            };
            (ulist[i].le[x].platform === true ? platformTransfers : transfers).push(leg);
          }
        }
      }

      // Who earned what.
      let hervachtiArray = [];
      for (let c = 0; c < ulist.length; c++) {
        const amount = ulist[c].x;
        const user = ulist[c].uid;
        if (amount > 0) {
          hervachtiArray.push({
            users_permissions_user: parseInt(user),
            amount: amount,
            mekabel: ulist[c].meca > 0,
            noten: ulist[c].noten > 0
          });
        }
      }

      const siteShareActive =
        SITE_SHARE_FLAGS.crossRikmaFields && platformInfo?.configured;

      // The reconciliation — update, add, unlink transfers; re-link the sales and
      // mark them pending — runs on the server, membership and the split's state
      // checked there (updateTosplitProposal, PLAN_REALTIME_MIGRATION B9).
      const res = await executeAction('updateTosplitProposal', {
        tosplitId: String(currentTosplit.id),
        projectId: String($idPr),
        transfers,
        hervachti: hervachtiArray,
        newSaleIds: unsplitedSales.map((sale) => String(sale.id)),
        siteShare: siteShareActive
          ? {
              active: true,
              transfers: platformTransfers,
              reciveProject: String(platformInfo.projectId),
              proposedAmount: siteShareProposed,
              adjustDirection: siteShareDirection,
              adjustReason: siteShareReason || null
            }
          : { active: false }
      });
      if (!res?.success) {
        console.error('Error updating tosplit:', res?.error);
        return;
      }
      const platformHalukaIds = res.data?.platformHalukaIds ?? [];
      const hadPlatformBefore = res.data?.hadPlatformBefore === true;

      // Income Sale in the MAIN rikma (the platform earned this by providing its
      // service) — mirrors ask() step 2.5. We create it ONLY when site-share is
      // newly introduced in THIS edit (the proposal had none before): the original
      // ask() already recorded one, and we don't track its id, so re-creating on
      // every edit would duplicate the income. If a pre-existing site-share amount
      // changed, the income Sale stays at its original figure (documented gap —
      // closing it needs a stored Sale↔tosplit link; see SITE_SHARE_TRANSFER_SPEC).
      if (
        SITE_SHARE_FLAGS.manualSplit &&
        platformInfo?.configured &&
        siteShareFinal > 0 &&
        !hadPlatformBefore &&
        platformHalukaIds.length > 0
      ) {
        const saleRes = await executeAction('createPlatformSale', {
          projectId: platformInfo.projectId,
          memberId: platformInfo.memberId,
          amount: siteShareFinal,
          publishedAt: d.toISOString(),
          adjustDirection: siteShareDirection,
          adjustReason: siteShareReason || null,
          proposedAmount: siteShareProposed,
          sourceProjectId: String($idPr),
          transferHalukaIds: platformHalukaIds
        });
        if (!saleRes?.success) {
          console.error('[SiteShare] update: failed to create platform sale:', saleRes?.error);
        }
      } else if (
        SITE_SHARE_FLAGS.manualSplit &&
        platformInfo?.configured &&
        hadPlatformBefore
      ) {
        console.warn(
          '[SiteShare] update: existing site-share income Sale not adjusted',
          '(no stored Sale↔tosplit link). Transfer halukas were reconciled.'
        );
      }

      showUpdateSuggestion = false;
      splitChanged = false;
    } catch (e) {
      console.error('Error updating tosplit:', e);
    }
  }

  async function ask() {
    // A discount ("pay less") must carry a reason (PLAN §4).
    if (
      SITE_SHARE_FLAGS.manualSplit &&
      platformInfo?.configured &&
      siteShareDirection === 'less' &&
      !siteShareReason.trim()
    ) {
      toast.error(get(t)('mission.whowhat.reasonForDiscount'));
      return;
    }

    isLoading = true;
    isSuccess = false;
    isError = false;
    already = true;

    let d = new Date();
    const cookieValueId = document.cookie
      .split('; ')
      .find((row) => row.startsWith('id='))
      ?.split('=')[1];
    
    if (!cookieValueId) {
      console.error('User ID not found in cookies');
      toast.error(get(t)('mission.whowhat.userIdNotFound'));
      isLoading = false;
      isError = true;
      return;
    }

    try {
      // Step 1: Create all halukot using the new action system.
      // Platform (1💗1) transfers are split out: they are the cross-rikma money
      // movement and are tracked separately (both sides confirm + chat), so they
      // must NOT be added to the tosplit's halukas — otherwise the platform
      // member's confirmation would gate the partners' split completion.
      let halukaIds = [];
      let platformHalukaIds = [];
      for (let i = 0; i < ulist.length; i++) {
        if (ulist[i].noten > 0) {
          for (let x = 0; x < ulist[i].le.length; x++) {
            const isPlatform = ulist[i].le[x].platform === true;
            const halukaData = {
              project: $idPr,
              usersend: String(ulist[i].uid),
              userrecive: String(ulist[i].le[x].leid),
              amount: parseFloat(ulist[i].le[x].cama.toFixed(2)),
              matbea: '2',
              confirmed: false,
              publishedAt: d.toISOString()
            };

            // Cross-rikma tagging for the platform transfer — only when the
            // Strapi fields are live (SITE_SHARE_TRANSFER_SPEC.md §1/§7). Gated so
            // a build whose HalukaInput lacks these fields is unaffected. The
            // tosplit link (source_tosplit) is set from the tosplit side below via
            // `siteShareHalukas`, so it isn't needed here. publishedAt’s qid passes
            // `data` straight through HalukaInput, so new keys flow automatically.
            if (isPlatform && SITE_SHARE_FLAGS.crossRikmaFields && platformInfo?.configured) {
              Object.assign(halukaData, {
                isSiteShare: true,
                recive_project: String(platformInfo.projectId),
                proposedAmount: siteShareProposed,
                adjustDirection: siteShareDirection,
                adjustReason: siteShareReason || null,
                autoApproved: true
              });
            }

            const result = await executeAction('createHaluka', { data: halukaData });
            const newHalukaId = result?.data?.createHaluka?.data?.id;

            if (result.success && newHalukaId) {
              if (isPlatform) {
                platformHalukaIds.push(newHalukaId);
              } else {
                halukaIds.push(newHalukaId);
              }
            } else {
              console.error('Failed to create haluka:', result.error);
            }
          }
        }
      }

      // Step 2: Build hervachti array
      let hervachtiArray = [];
      for (let c = 0; c < ulist.length; c++) {
        const amount = ulist[c].x;
        const user = ulist[c].uid;
        if (amount > 0) {
          hervachtiArray.push({
            users_permissions_user: parseInt(user),
            amount: amount,
            mekabel: ulist[c].meca > 0,
            noten: ulist[c].noten > 0,
            nirsham: false // Add missing required field
          });
        }
      }

      // Step 2.5: Site share — TWO records, one per side (dual-project documentation):
      //  (a) income Sale in the MAIN rikma (accounting: the platform earned this by
      //      providing its service), and
      //  (b) the cross-rikma transfer Haluka(s) created above in THIS project
      //      (physical money movement, tracked with both-sides confirm + chat).
      // The Sale references the transfer halukas so an archive can link the two
      // sides. The adjustment (less/more) is auto-approved (PLAN §5); reason kept.
      // See docs/done/PLAN_SITE_SHARE.md §6.1 and src/generated/SITE_SHARE_TRANSFER_SPEC.md.
      console.log('[SiteShare] submit - platformInfo:', JSON.stringify(platformInfo),
                  '| direction:', siteShareDirection, '| final:', siteShareFinal,
                  '| transferHalukas:', JSON.stringify(platformHalukaIds));
      if (SITE_SHARE_FLAGS.manualSplit && platformInfo?.configured && siteShareFinal > 0) {
        const saleRes = await executeAction('createPlatformSale', {
          projectId: platformInfo.projectId,
          memberId: platformInfo.memberId,
          amount: siteShareFinal,
          publishedAt: d.toISOString(),
          // Adjustment is auto-approved (PLAN §5); reason kept for the record.
          adjustDirection: siteShareDirection,
          adjustReason: siteShareReason || null,
          proposedAmount: siteShareProposed,
          sourceProjectId: String($idPr),
          transferHalukaIds: platformHalukaIds
        });
        console.log('[SiteShare] createPlatformSale →', JSON.stringify(saleRes?.data));
        if (!saleRes?.success) {
          console.error('[SiteShare] Failed to create platform sale:', saleRes?.error);
        }
      }

      // Step 3: Get all unsplited sales IDs
      const salesIds = unsplitedSales.map(sale => parseInt(sale.id));

      // Step 4: Create tosplit using the new action system
      // This will automatically send notifications to all project members!
      const tosplitData = {
        publishedAt: d.toISOString(),
        project: $idPr,
        vots: [
          {
            what: true,
            users_permissions_user: cookieValueId
          }
        ],
        halukas: halukaIds,
        hervachti: hervachtiArray,
        ...(salesIds.length > 0 && { sales: salesIds }),
        // Link the platform transfer(s) to this proposal WITHOUT joining the
        // gating `halukas` set (SITE_SHARE_TRANSFER_SPEC.md §7.1). Sets each
        // transfer's `source_tosplit` via the inverse. Gated like the tagging
        // above; `data` passes straight through TosplitInput.
        ...(SITE_SHARE_FLAGS.crossRikmaFields && platformHalukaIds.length > 0
          ? { siteShareHalukas: platformHalukaIds }
          : {})
      };

      // The component words its own failure below; without this the user got the
      // toast twice, once of them the raw internal string ("Parameter
      // validation failed"), which tells them nothing about what to do.
      const tosplitResult = await executeAction(
        'createTosplit',
        { data: tosplitData },
        { showErrorToast: false }
      );

      if (!tosplitResult.success || !tosplitResult.data?.createTosplit?.data?.id) {
        console.error('[split] createTosplit failed:', tosplitResult.error);
        toast.error(get(t)('mission.whowhat.errorCreatingSplit'));
        isLoading = false;
        isError = true;
        return;
      }

      const tosplitId = tosplitResult.data.createTosplit.data.id;
      console.log('Tosplit created successfully:', tosplitId);

      // Gate 3 seeding (PLAN_SITE_SHARE_PER_MEMBER §1/§3): create a `pending`
      // decision for EVERY member with a share, so the "open decisions" reminder
      // has a queryable source of truth. Idempotent server-side; the creator's
      // gate-1 choice below upserts their seeded row to decided/skipped.
      if (platformProjectId) {
        const ssMembers = ulist
          .filter((u) => Number(u.x) > 0 && u.uid)
          .map((u) => ({
            userId: String(u.uid),
            basisAmount: Number(u.x),
            proposedAmount: computeSiteShare({
              payerRole: 'provider',
              baseAmount: Number(u.x),
              matbea: '2',
              config: DEFAULT_SITE_SHARE_CONFIG
            }).siteAmount
          }));
        if (ssMembers.length > 0) {
          const seedRes = await executeAction('seedSiteShareDecisions', {
            tosplitId: String(tosplitId),
            projectId: String($idPr),
            recive_project: String(platformProjectId),
            members: ssMembers
          });
          if (!seedRes?.success) {
            console.error('[SiteShare] seeding failed:', seedRes?.error);
          }
        }
      }

      // Gate 1 (PLAN_SITE_SHARE_PER_MEMBER §2): persist the creator's PERSONAL
      // site-share decision now that the tosplit exists. Identity is taken from
      // the session server-side; we pass only the choice + the basis it was
      // computed from. No transfer Haluka yet — that's the receiving side (M4).
      if (platformProjectId && creatorSSDecision) {
        const basis =
          ulist.find((u) => String(u.uid) === String(cookieValueId))?.x ?? 0;
        const ssRes = await executeAction('decideSiteShare', {
          tosplitId: String(tosplitId),
          projectId: String($idPr),
          recive_project: String(platformProjectId),
          decision: creatorSSDecision.decision,
          amount: creatorSSDecision.amount,
          direction: creatorSSDecision.direction,
          reason: creatorSSDecision.reason,
          proposedAmount: creatorProposed,
          basisAmount: basis
        });
        if (!ssRes?.success) {
          console.error('[SiteShare] creator decision failed:', ssRes?.error);
        }
      }

      // Step 5 (marking the sales pending) and step 6 (the rikma's silence clock)
      // now happen inside createTosplit, on the server (PLAN_REALTIME_MIGRATION B9).

      // Step 5.5 — SOLO RIKMA: the proposal is already unanimous.
      // The creator's `what:true` sits inside the tosplit we just created, and
      // there is nobody else to wait for. Opening a restime timegrama here would
      // park the money for 48h waiting on a vote that can never arrive, so we
      // finalize immediately — the same call halukaask makes when the last
      // member approves. See docs/inprogress/QA_SOLO_RIKMA_2026-08.md B1.
      if (isSoloRikma) {
        const soloRes = await executeAction('approveHaluka', {
          tosplitId: String(tosplitId),
          userId: cookieValueId,
          // The creator's vote is written by approveHaluka itself; passing it
          // again here would record it twice.
          users: [],
          halukot: halukaIds,
          sales: salesIds,
          hervachUpdates: hervachtiArray
            .filter((h) => h.noten !== true && h.mekabel !== true)
            .map((h) => ({
              userId: String(h.users_permissions_user),
              amountDelta: Number(h.amount ?? 0)
            }))
            .filter((u) => u.userId && Number.isFinite(u.amountDelta) && u.amountDelta !== 0),
          projectId: String($idPr)
        });
        if (!soloRes?.success) {
          // The proposal exists and is valid — only the auto-approval failed, so
          // say so instead of pretending the whole thing worked.
          console.error('[solo split] auto-approve failed:', soloRes?.error);
          toast.error(get(t)('mission.whowhat.errorCreatingSplit'));
          isLoading = false;
          isError = true;
          return;
        }
        console.log('✅ Solo tosplit created and approved in one step');
        toast.success(get(t)('mission.whowhat.splitApproved'));
        isLoading = false;
        isSuccess = true;
        hatzaa = true;
        already = true;
        noofok = 1;
        noofno = 0;
        noofw = 0;
        return;
      }

      console.log('✅ Tosplit created successfully with automatic notifications!');
      toast.success(get(t)('mission.whowhat.splitCreated'));
      isLoading = false;
      isSuccess = true;

      // Immediately reflect the new state: switch to the "proposal pending" view so
      // the create button + site-share box disappear and the creator's vote shows.
      // Without this the form stays put and a second click would duplicate the split.
      hatzaa = true;
      already = true;
      noofok = 1; // the creator's own "what:true" vote
      noofno = 0;
      noofw = Math.max(0, ulist.length - 1);

    } catch (e) {
      error1 = e;
      console.error('Error creating tosplit:', error1);
      toast.error(get(t)('mission.whowhat.errorCreatingSplit'));
      isLoading = false;
      isError = true;
    }
  }

  let hatzaa = $state(false);
  let noofok = $state(),
    noofw = $state(),
    noofno = $state(0);
  let splitChanged = $state(false);
  let currentTosplit = $state(null);
  let showUpdateSuggestion = $state(false);
  let changeDetails = $state('');
  let changesList = $state([]);
  let unsplitedSales = $state([]);
  
  // Button states
  let isLoading = $state(false);
  let isSuccess = $state(false);
  let isError = $state(false);
  let availableForNewSplit = $state(0); // Count of truly available sales (not pending)

  // Site share — display-time preview of the platform's service line.
  // siteShareProposed is what the system suggests; the payer may keep it, pay
  // less (reason required) or more (reason optional). Both directions are
  // auto-approved (PLAN §4/§5). platformInfo is reused by ask() so we don't
  // resolve the platform project twice.
  let siteShareProposed = $state(0);
  let platformInfo = $state(null); // { projectId, memberId, configured }
  let siteShareDirection = $state('as_is'); // 'as_is' | 'less' | 'more'
  let siteShareCustom = $state(0); // the payer's chosen amount when adjusting
  let siteShareReason = $state('');
  // The giver→platform transfers the matching produced (for display under the table).
  let platformTransfers = $state([]);

  // The final amount that will actually be recorded.
  let siteShareFinal = $derived(
    siteShareDirection === 'as_is'
      ? siteShareProposed
      : Number(siteShareCustom) > 0
        ? Number(siteShareCustom)
        : siteShareProposed
  );

  // ── M1 decouple (per-member migration) ───────────────────────────────────────
  // The COLLECTIVE site-share — the platform as a synthetic receiver INSIDE
  // distribute(), funded mechanically by deducting `netBase = revach − siteShare`
  // and matching givers to it — is decoupled. With this OFF, distribute() is a
  // pure 100% peer split on the FULL revach, and every collective branch below
  // (platformActive, the ask()/update reconcile, createPlatformSale, the UI box)
  // goes inert because `platformInfo` is never configured (see resolveSiteShare).
  // The per-member personal layer (M2, PLAN_SITE_SHARE_PER_MEMBER §0/§2) replaces
  // it and lives OUTSIDE distribute(). Flip to true to restore the old model.
  const COLLECTIVE_SITE_SHARE = false;

  // True when the platform takes a real share of THIS split. Kept as a function
  // (not $derived) so distribute() can call it imperatively while recomputing.
  // NOTE: this is NOT gated on view-mode (trili). When viewing an existing
  // proposal we reconstruct the stored site-share (see onMount) so the recompute
  // reproduces it — otherwise the partners' amounts and the missing platform card
  // would register as a false "split changed".
  function platformActive() {
    return (
      COLLECTIVE_SITE_SHARE &&
      SITE_SHARE_FLAGS.manualSplit &&
      Boolean(platformInfo?.configured) &&
      siteShareFinal > 0
    );
  }

  // Reactive twin of platformActive() for the template (card visibility). Shown in
  // both create AND view modes so the proposal always displays the site share.
  let showPlatformCol = $derived(
    COLLECTIVE_SITE_SHARE &&
      SITE_SHARE_FLAGS.manualSplit &&
      Boolean(platformInfo?.configured) &&
      siteShareFinal > 0
  );

  // ── M2: per-member personal site-share (gate 1 — creator decides their OWN) ──
  // Independent of COLLECTIVE_SITE_SHARE: the personal layer always resolves the
  // platform project (for recive_project) and offers THIS creator a contribution
  // out of their own share. The choice is captured here and persisted right after
  // the tosplit is created in ask() (decideSiteShare needs the new tosplit id).
  let myId = $state(null); // current user (creator), from the id cookie
  let platformProjectId = $state(null); // the platform rikma (recive_project)
  let creatorSSDecision = $state(null); // { decision, amount, direction, reason }

  // The creator's own fair share — the basis computeSiteShare runs on.
  let creatorShare = $derived(
    myId != null ? (ulist.find((u) => String(u.uid) === String(myId))?.x ?? 0) : 0
  );
  let creatorProposed = $derived(
    creatorShare > 0
      ? computeSiteShare({
          payerRole: 'provider',
          baseAmount: creatorShare,
          matbea: '2',
          config: DEFAULT_SITE_SHARE_CONFIG
        }).siteAmount
      : 0
  );
  // Prompt the creator only while creating a NEW split, when a platform exists and
  // they actually earned a share to give from.
  let showCreatorSiteShare = $derived(
    !hatzaa && !already && platformProjectId != null && creatorShare > 0
  );

  function readIdCookie() {
    if (typeof document === 'undefined') return null;
    return (
      document.cookie
        .split('; ')
        .find((row) => row.startsWith('id='))
        ?.split('=')[1] ?? null
    );
  }

  // Resolve the platform project for the PERSONAL layer (recive_project only — the
  // receiver/volunteer is chosen later, M4). NOT gated on COLLECTIVE_SITE_SHARE.
  async function resolvePersonalSiteShare() {
    const pp = await executeAction('getPlatformProject', {});
    if (!pp.success || !pp.data?.configured) return;
    const pid = pp.data.projectId;
    if (!pid || String($idPr) === String(pid)) return; // the platform's own split
    platformProjectId = String(pid);
  }

  function onCreatorDecide(payload) {
    creatorSSDecision = payload; // captured; persisted after tosplit creation (ask)
  }

  function pickDirection(dir) {
    siteShareDirection = dir;
    if (dir !== 'as_is' && !(Number(siteShareCustom) > 0)) {
      siteShareCustom = siteShareProposed; // seed the input from the suggestion
    }
    if (dir === 'as_is') siteShareReason = '';
    distribute(); // the platform's share changed → re-split the remainder
  }

  // Re-split when the payer edits the custom amount (less/more).
  function onSiteShareAmount() {
    distribute();
  }

  async function resolveSiteShare() {
    // M1: collective site-share decoupled — leave platformInfo unconfigured so
    // distribute() runs as a pure 100% peer split (PLAN_SITE_SHARE_PER_MEMBER §0).
    if (!COLLECTIVE_SITE_SHARE) return;
    if (!SITE_SHARE_FLAGS.manualSplit) return;
    const pp = await executeAction('getPlatformProject', {});
    console.log('[SiteShare] getPlatformProject →', JSON.stringify(pp?.data));
    if (!pp.success || !pp.data?.configured) return;

    const projectId = pp.data.projectId;
    const memberId = pp.data.treasuryUserId; // first platform member
    const isPlatformOwnSplit = projectId && String($idPr) === String(projectId);
    if (isPlatformOwnSplit || !memberId) return;

    platformInfo = { projectId, memberId, configured: true };

    const { siteAmount } = computeSiteShare({
      payerRole: 'provider',
      baseAmount: revach,
      matbea: '2',
      config: DEFAULT_SITE_SHARE_CONFIG
    });
    siteShareProposed = siteAmount;
    console.log('[SiteShare] preview siteAmount:', siteAmount);
  }

  onMount(async () => {
    // Filter sales: include pending sales OR unsplited sales (exclude only fully splited)
    // This ensures pending sales appear in the table
    // Exclude sales still awaiting holder consent (holderStatus:'open') — they
    // are not counted in any balance until they mature (PLAN_sale_holder_consent).
    unsplitedSales = salee.filter(sale =>
      sale.attributes.holderStatus !== 'open' &&
      !sale.attributes.splited &&
      (!sale.attributes.tosplits?.data || sale.attributes.tosplits.data.length === 0)
    );

    // Count truly available sales (not open/pending, not splited)
    availableForNewSplit = salee.filter(sale =>
      sale.attributes.holderStatus !== 'open' &&
      !sale.attributes.splited &&
      !sale.attributes.pending
    ).length;

    cal();

    // Build the per-user base (totals, percentages) once.
    buildBase();

    // Resolve the platform's service line BEFORE distributing, so partners split
    // the NET base (revach − site share) and the deducted amount is routed to the
    // platform as a real transfer. Shows in the proposal table, not only on submit.
    await resolveSiteShare();

    // M2 per-member layer: identify the creator + resolve the platform project so
    // the personal contribution prompt (gate 1) can render. Independent of the
    // collective switch above.
    myId = readIdCookie();
    await resolvePersonalSiteShare();

    // View mode: an existing proposal already has the site-share baked into its
    // stored hervachti (the partners split the NET base). Reconstruct that exact
    // amount so distribute() reproduces the same split + platform transfers —
    // otherwise the recompute (which would re-derive a fresh suggestion) drifts
    // from what was stored and the UI falsely flags "split changed".
    if (trili.length > 0) {
      already = true;
      hatzaa = true;
      currentTosplit = trili[0];
      if (platformInfo?.configured) {
        const stored = currentTosplit.attributes.hervachti || [];
        const sumStored = stored.reduce((s, h) => s + (h.amount || 0), 0);
        const inferred = revach - sumStored; // = the site-share that was deducted
        // Pin the proposal to the stored amount: covers as-is AND adjusted
        // (less/more) splits, and 0 for old splits that predate site-share.
        siteShareProposed = inferred > 0.01 ? inferred : 0;
        siteShareDirection = 'as_is';
      }
    }

    // Now split the remainder among partners + route the site share to the platform.
    distribute();

    if (trili.length > 0) {
      const vots = currentTosplit.attributes.vots;
      for (let i = 0; i < vots.length; i++) {
        if (vots[i].what == true) {
          noofok += 1;
        } else {
          noofno += 1;
        }
      }
      noofw = ulist.length - vots.length;

      // Check if split has changed
      checkSplitChanges();
    }
  });
  function cal() {
    // Calculate with all non-splited sales (including pending ones)
    // This ensures pending sales appear in the table
    const unsplitedOnly = salee.filter(s => !s.attributes.splited);
    
    for (let i = 0; i < users.length; i++) {
      for (let j = 0; j < unsplitedOnly.length; j++) {
        if (
          unsplitedOnly[j].attributes.users_permissions_user.data.id === users[i].id
        ) {
          if (unsplitedOnly[j].attributes.users_permissions_user.data.id in dictidi) {
            dictidi[unsplitedOnly[j].attributes.users_permissions_user.data.id] +=
              unsplitedOnly[j].attributes.in;
          } else {
            dictidi[unsplitedOnly[j].attributes.users_permissions_user.data.id] =
              unsplitedOnly[j].attributes.in;
          }
        }
      }
      if (users[i].id in dictidi) {
      } else {
        dictidi[users[i].id] = 0;
      }
    }
  }
  // buildBase: compute each user's totals + percentage-of-rikma once. The actual
  // per-user split amounts and transfers are computed in distribute(), which can
  // re-run whenever the platform's share changes (so partners split the remainder).
  function buildBase() {
    // Calculate totals for each user
    for (let i = 0; i < users.length; i++) {
      for (let j = 0; j < fmiData.length; j++) {
        if (
          fmiData[j].attributes.users_permissions_user.data.id === users[i].id
        ) {
          if (fmiData[j].attributes.users_permissions_user.data.id in dictid) {
            dictid[fmiData[j].attributes.users_permissions_user.data.id] +=
              fmiData[j].attributes.total;
          } else {
            dictid[fmiData[j].attributes.users_permissions_user.data.id] =
              fmiData[j].attributes.total;
          }
        }
      }
      for (let j = 0; j < rikmashes.length; j++) {
        if (
          rikmashes[j].attributes.users_permissions_user.data.id === users[i].id
        ) {
          if (
            rikmashes[j].attributes.users_permissions_user.data.id in dictid
          ) {
            dictid[rikmashes[j].attributes.users_permissions_user.data.id] +=
              rikmashes[j].attributes.total;
          } else {
            dictid[rikmashes[j].attributes.users_permissions_user.data.id] =
              rikmashes[j].attributes.total;
          }
        }
      }
    }
    
    // Subsistence stipends (PLAN_STIPEND §5). The funder's contribution grows
    // by k·P, the recipient's shrinks by α·P — a single ledger row with two
    // signs, so the two books can never come apart. Only CONFIRMED payments
    // reach here (the query filters on status), because an unconfirmed one has
    // not moved anybody's share yet.
    for (const p of stipendPayments) {
      const a = p?.attributes ?? {};
      const funderId = a.funder?.data?.id;
      const recipientId = a.recipient?.data?.id;
      const credit = Number(a.equityCredit) || 0;
      const debit = Number(a.equityDebit) || 0;
      if (funderId != null && credit !== 0) {
        dictid[funderId] = (dictid[funderId] || 0) + credit;
      }
      if (recipientId != null && debit !== 0) {
        dictid[recipientId] = (dictid[recipientId] || 0) - debit;
      }
    }

    // Calculate net total
    for (let j = 0; j < fmiData.length; j++) {
      if ('net' in dictid) {
        dictid['net'] += fmiData[j].attributes.total;
      } else {
        dictid['net'] = fmiData[j].attributes.total;
      }
    }
    for (let j = 0; j < rikmashes.length; j++) {
      if ('net' in dictid) {
        dictid['net'] += rikmashes[j].attributes.total;
      } else {
        dictid['net'] = rikmashes[j].attributes.total;
      }
    }
    // The rikma total moves by exactly (k − α)·P — zero for a plain bilateral
    // stipend, which is precisely why that case needs nobody else's consent.
    for (const p of stipendPayments) {
      const a = p?.attributes ?? {};
      const net = (Number(a.equityCredit) || 0) - (Number(a.equityDebit) || 0);
      if (net !== 0) dictid['net'] = (dictid['net'] || 0) + net;
    }

    // Build ulist for ALL users
    let counter = 0;
    let pmcounter = 0;
    
    for (let i = 0; i < users.length; i++) {
      counter += 1;
      
      const userId = users[i].id;
      const userTotal = dictid[userId] || 0; // Default to 0 if no data
      const userIhave = dictidi[userId] || 0; // Default to 0 if no data
      const userPercentage = dictid['net'] > 0 ? percentage(userTotal, dictid['net']) : 0;
      
      let src22 = ``;
      if (users[i].attributes.profilePic.data !== null) {
        src22 = users[i].attributes.profilePic.data.attributes.url;
      } else {
        src22 = pic;
      }
      
      ulist.push({
        ihave: userIhave,
        total: userTotal,
        uid: userId,
        username: users[i].attributes.username,
        src: src22,
        p: userPercentage,
        un: users[i].username,
        s: userPercentage,
        s2: 100,
        d: pmcounter,
        o: 'visible',
        c: `url(#img${counter})`,
        imid: `img${counter}`,
        // Safe defaults so the template can render before distribute() runs
        // (resolveSiteShare awaits in between → a render happens with x undefined).
        x: 0,
        meca: 0,
        noten: 0,
        cama: 0,
        le: [],
        kibal: false,
        latet: 0
      });
      
      pmcounter -= userPercentage;
    }
  }

  // distribute: split the (possibly net) base among partners and match givers to
  // receivers. The platform (1💗1) is added as an extra RECEIVER — kept out of
  // `ulist` so the voting/hervachti machinery for project members is untouched —
  // so the site share is routed to it as an ordinary giver→platform Haluka.
  // Re-runnable: called on mount and whenever the payer adjusts the site share.
  function distribute() {
    const active = platformActive();
    // Partners split what's left AFTER the platform takes its share.
    const netBase = Math.max(0, revach - (active ? siteShareFinal : 0));

    // Per-user fair share on the net base → surplus (noten) / deficit (meca).
    for (let i = 0; i < ulist.length; i++) {
      ulist[i].x = revach > 0 ? (ulist[i].p / 100) * netBase : 0;
      const surplus = ulist[i].ihave - ulist[i].x;
      if (surplus < -0.000001) {
        ulist[i].meca = -surplus;
        ulist[i].noten = 0;
      } else if (surplus > 0.000001) {
        ulist[i].noten = surplus;
        ulist[i].meca = 0;
      } else {
        ulist[i].meca = 0;
        ulist[i].noten = 0;
      }
      ulist[i].cama = 0;
      ulist[i].le = [];
      ulist[i].kibal = false;
      ulist[i].latet = ulist[i].noten;
    }

    // Receivers: each partner's deficit + the platform's site share (idx = -1).
    // We match on copies of the "need" so ulist[i].meca stays the full deficit
    // for display, and ulist column order never changes between recomputes.
    const recv = ulist
      .map((u, idx) => ({ idx, need: u.meca, platform: false }))
      .concat(active ? [{ idx: -1, need: siteShareFinal, platform: true }] : [])
      .filter((r) => r.need > 0.01)
      .sort((a, b) => b.need - a.need);

    const givers = ulist
      .map((u, idx) => ({ idx, give: u.noten }))
      .filter((g) => g.give > 0.01)
      .sort((a, b) => b.give - a.give);

    platformTransfers = [];
    for (const g of givers) {
      let remaining = g.give;
      for (const r of recv) {
        if (remaining <= 0.01 || r.need <= 0.01) continue;
        if (!r.platform && g.idx === r.idx) continue; // can't transfer to self
        const amount = Math.min(remaining, r.need);
        if (amount <= 0.01) continue;

        if (r.platform) {
          // Cross-rikma transfer: this partner funds part of the site share.
          ulist[g.idx].le.push({
            le: '1💗1',
            leid: platformInfo?.memberId,
            cama: amount,
            platform: true
          });
          platformTransfers.push({
            fromId: ulist[g.idx].uid,
            fromName: ulist[g.idx].username,
            amount
          });
        } else {
          ulist[g.idx].le.push({
            le: ulist[r.idx].username,
            leid: ulist[r.idx].uid,
            cama: amount
          });
        }

        remaining -= amount;
        r.need -= amount;
      }
    }

    // Debug log to see the results
    console.log(
      'Transfer calculation results:',
      ulist.map((u) => ({
        name: u.username,
        shouldGet: u.x.toFixed(2),
        has: u.ihave.toFixed(2),
        needsToGive: u.noten.toFixed(2),
        needsToReceive: u.meca.toFixed(2),
        transfers: u.le
      })),
      '| platform share:',
      active ? siteShareFinal.toFixed(2) : 0
    );

    ulist = ulist;

    // Check for split changes after calculation is complete
    if (currentTosplit) {
      checkSplitChanges();
    }
  }
  // ── Display only (canvas "MobileSplit" / "DesktopSplit"). Nothing below is
  // read by ask() / updateTosplit(); it only draws the ulist they act on. ──
  const fmtMoney = useFormatMoney();
  const initialOf = (name) => (String(name || '?').trim().charAt(0) || '?').toUpperCase();
  let myRow = $derived(myId != null ? (ulist.find((u) => String(u.uid) === String(myId)) ?? null) : null);
  let barMax = $derived(ulist.reduce((m, u) => Math.max(m, u.x || 0, u.ihave || 0), 0));
  const barPct = (v) => (barMax > 0 ? Math.max(0, Math.min(100, ((v || 0) / barMax) * 100)) : 0);
  let votes = $derived.by(() => {
    const vots = currentTosplit?.attributes?.vots;
    if (!vots) return { yes: Number(noofok) || 0, no: Number(noofno) || 0, waiting: Number(noofw) || 0 };
    const yes = vots.filter((v) => v.what == true).length;
    return { yes, no: vots.length - yes, waiting: Math.max(0, ulist.length - vots.length) };
  });
  /** @returns {'yes' | 'no' | 'waiting'} */
  function voteOf(uid) {
    const vots = currentTosplit?.attributes?.vots;
    if (!vots) return String(uid) === String(myId) ? 'yes' : 'waiting';
    const v = vots.find((x) => String(x?.users_permissions_user?.data?.id) === String(uid));
    return !v ? 'waiting' : v.what == true ? 'yes' : 'no';
  }
  let votesLine = $derived(
    [
      $t('shop.sp.ww.votesYes', { count: votes.yes }),
      votes.no > 0 ? $t('shop.sp.ww.votesNo', { count: votes.no }) : '',
      votes.waiting > 0 ? $t('shop.sp.ww.votesWaiting', { count: votes.waiting }) : ''
    ]
      .filter(Boolean)
      .join(' · ')
  );
  // The sales a proposal covers: the open one's own, or — before one exists —
  // the ones ask() would link.
  let proposalSaleIds = $derived(new Set((currentTosplit?.attributes?.sales?.data ?? []).map((s) => String(s.id))));
  let includedSales = $derived(
    currentTosplit ? salee.filter((s) => proposalSaleIds.has(String(s.id))) : unsplitedSales
  );
  let openClaims = $derived(
    salee.filter((s) => s.attributes.holderStatus === 'open' && !s.attributes.splited).length
  );
  function saleName(s) {
    const linked = s?.attributes?.matanot?.data?.attributes?.name;
    if (linked) return linked;
    if (isSiteShareNote(s?.attributes?.note)) return $t('project.hamatanot.siteShare.label');
    return $t('project.hamatanot.unknownProduct');
  }
</script>

<div class="ww">
  <div class="ww-main">
    {#if showUpdateSuggestion}
      <section class="ww-change" aria-labelledby="ww-change-title">
        <strong id="ww-change-title">{$t('mission.whowhat.splitChanged')}</strong>
        <p>{$t('mission.whowhat.splitChangedMsg')}</p>
        {#if changesList.length > 0}
          <ul class="ww-changes" aria-label={$t('mission.whowhat.changesDetected')}>
            {#each changesList as change}
              <li>
                <span>{change.label}</span>
                <bdi>{change.oldValue}</bdi>
                <svg class="ww-arrow" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
                <bdi class="ww-new">{change.newValue}</bdi>
              </li>
            {/each}
          </ul>
        {/if}
        <div class="ww-row">
          <button type="button" class="sh-btn sh-btn-warn" onclick={updateTosplit}>{$t('mission.whowhat.updateSplit')}</button>
          <button type="button" class="sh-btn sh-btn-quiet" onclick={() => (showUpdateSuggestion = false)}>{$t('shop.sp.ww.keepAsIs')}</button>
        </div>
      </section>
    {/if}

    <section class="ww-calc" aria-labelledby="ww-calc-title">
      <div class="ww-calc-head">
        <h2 id="ww-calc-title" class="sh-section-label">{$t('mission.whowhat.calculationTable')}</h2>
        <div class="sh-seg ww-seg" role="group" aria-label={$t('mission.whowhat.calculationTable')}>
          <button type="button" aria-pressed={viewMode === 'cards'} onclick={() => (viewMode = 'cards')}>{$t('mission.whowhat.cards')}</button>
          <button type="button" aria-pressed={viewMode === 'table'} onclick={() => (viewMode = 'table')}>{$t('mission.whowhat.table')}</button>
        </div>
      </div>

      {#if viewMode === 'cards'}
        <div class="ww-cards">
          {#each ulist as data (data.uid)}
            <article class="sh-card-2 ww-card" class:ww-card-give={revach > 0 && data.noten > 0.01}>
              <div class="ww-card-head">
                <span class="ww-av" aria-hidden="true">{initialOf(data.username)}</span>
                <div class="ww-id">
                  <strong>{data.username}</strong>
                  <span class="ww-muted">{data.p.toFixed(1)}% {$t('mission.whowhat.percentageInRikma')}</span>
                </div>
                {#if revach > 0 && data.noten > 0.01}
                  <span class="sh-chip sh-chip-accent">{$t('shop.sp.give', { amount: fmtMoney(data.noten) })}</span>
                {:else if revach > 0 && data.meca > 0.01}
                  <span class="sh-chip sh-chip-ok">{$t('shop.sp.receive', { amount: fmtMoney(data.meca) })}</span>
                {:else}
                  <span class="sh-chip sh-chip-muted">{$t('mission.whowhat.balanced')}</span>
                {/if}
              </div>
              <div class="ww-bars" aria-hidden="true">
                <span class="ww-bar"><span class="ww-bar-share" style:width="{barPct(revach > 0 ? data.x : 0)}%"></span></span>
                <span class="ww-bar"><span class="ww-bar-hold" style:width="{barPct(data.ihave)}%"></span></span>
              </div>
              <dl class="ww-rows">
                <dt>{$t('mission.whowhat.profitShare')}</dt>
                <dd class="ww-share"><bdi>{fmtMoney(revach > 0 ? data.x : 0)}</bdi></dd>
                <dt>{$t('shop.sp.ww.held', { name: data.username })}</dt>
                <dd class="ww-hold"><bdi>{fmtMoney(data.ihave || 0)}</bdi></dd>
              </dl>
              {#if data.le && data.le.length > 0}
                <div class="ww-transfers">
                  <span class="ww-muted">{$t('mission.whowhat.giveTo')}</span>
                  {#each data.le as ee}
                    <div class="ww-transfer" class:ww-plat={ee.platform}>
                      <svg class="ww-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
                      <span class="ww-grow">{ee.le}</span>
                      <bdi class="ww-strong">{fmtMoney(ee.cama)}</bdi>
                    </div>
                  {/each}
                </div>
              {/if}
            </article>
          {/each}

          {#if showPlatformCol}
            <article class="sh-card-2 ww-card ww-platform">
              <div class="ww-card-head">
                <span class="ww-av ww-av-plat" aria-hidden="true">1·1</span>
                <div class="ww-id">
                  <strong>1💗1</strong>
                  <span class="ww-muted">
                    {revach > 0 ? ((siteShareFinal / revach) * 100).toFixed(1) : '0'}% · {$t('mission.whowhat.mgmtPartnership')}
                  </span>
                </div>
                <bdi class="ww-strong ww-gold">{fmtMoney(siteShareFinal)}</bdi>
              </div>
              {#if platformTransfers.length > 0}
                <span class="ww-muted">
                  {$t('mission.whowhat.fundedBy')}
                  {platformTransfers.map((tr) => `${tr.fromName} · ${fmtMoney(tr.amount)}`).join(', ')}
                </span>
              {/if}
            </article>
          {/if}
        </div>
      {:else}
        <div class="sh-table-wrap">
          <table class="sh-table ww-table">
            <thead>
              <tr>
                <th scope="col"><span class="ww-sr">{$t('mission.whowhat.name')}</span></th>
                {#each ulist as data (data.uid)}
                  <th scope="col">
                    <span class="ww-th"><span class="ww-av ww-av-sm" aria-hidden="true">{initialOf(data.username)}</span>{data.username}</span>
                  </th>
                {/each}
                {#if showPlatformCol}<th scope="col" class="ww-gold">1💗1</th>{/if}
              </tr>
            </thead>
            <tbody>
              <tr>
                <th scope="row">{$t('mission.whowhat.profitShare')}</th>
                {#each ulist as data (data.uid)}<td class="sh-num ww-share"><bdi>{fmtMoney(revach > 0 ? data.x : 0)}</bdi></td>{/each}
                {#if showPlatformCol}<td class="sh-num ww-plat-cell"><bdi>{fmtMoney(siteShareFinal)}</bdi></td>{/if}
              </tr>
              <tr>
                <th scope="row">{$t('mission.whowhat.myAmount')}</th>
                {#each ulist as data (data.uid)}<td class="sh-num"><bdi>{fmtMoney(data.ihave || 0)}</bdi></td>{/each}
                {#if showPlatformCol}<td class="ww-plat-cell">—</td>{/if}
              </tr>
              <tr>
                <th scope="row">{$t('mission.whowhat.amountToGive')}</th>
                {#each ulist as data (data.uid)}
                  <td class="sh-num" class:ww-give={revach > 0 && data.noten > 0.01}>
                    {#if revach > 0 && data.noten > 0.01}<bdi>{fmtMoney(data.noten)}</bdi>{:else}—{/if}
                  </td>
                {/each}
                {#if showPlatformCol}<td class="ww-plat-cell">—</td>{/if}
              </tr>
              <tr>
                <th scope="row">{$t('mission.whowhat.giveTo')}</th>
                {#each ulist as data (data.uid)}
                  <td class="ww-to">
                    {#if data.le && data.le.length > 0}
                      {#each data.le as ee}<span class="ww-to-line">{ee.le} <bdi>{fmtMoney(ee.cama)}</bdi></span>{/each}
                    {:else}—{/if}
                  </td>
                {/each}
                {#if showPlatformCol}<td class="ww-plat-cell">—</td>{/if}
              </tr>
              <tr>
                <th scope="row">{$t('mission.whowhat.amountToReceive')}</th>
                {#each ulist as data (data.uid)}
                  <td class="sh-num" class:ww-get={revach > 0 && data.meca > 0.01}>
                    {#if revach > 0 && data.meca > 0.01}<bdi>{fmtMoney(data.meca)}</bdi>{:else}—{/if}
                  </td>
                {/each}
                {#if showPlatformCol}<td class="sh-num ww-plat-cell"><bdi>{fmtMoney(siteShareFinal)}</bdi></td>{/if}
              </tr>
              <tr>
                <th scope="row">{$t('mission.whowhat.percentageInRikma')}</th>
                {#each ulist as data (data.uid)}<td class="sh-num">{data.p.toFixed(2)}</td>{/each}
                {#if showPlatformCol}<td class="sh-num ww-plat-cell">{revach > 0 ? ((siteShareFinal / revach) * 100).toFixed(2) : '0'}</td>{/if}
              </tr>
            </tbody>
          </table>
        </div>
      {/if}
    </section>

    {#if includedSales.length > 0 || openClaims > 0}
      <section class="sh-card ww-included" aria-labelledby="ww-included-title">
        <h2 id="ww-included-title" class="ww-h2">
          {$t('shop.sp.ww.included')} <span class="ww-muted">· {includedSales.length}</span>
        </h2>
        {#if includedSales.length > 0}
          <ul class="ww-chips">
            {#each includedSales as s (s.id)}
              <li class="sh-chip sh-chip-plain">
                {saleName(s)} <bdi>{fmtMoney(s.attributes.in)}</bdi>
                <span class="ww-muted">· {s.attributes.users_permissions_user?.data?.attributes?.username ?? ''}</span>
              </li>
            {/each}
          </ul>
        {/if}
        {#if openClaims > 0}
          <p class="ww-note">{$t('shop.sp.ww.openNote')}</p>
        {/if}
      </section>
    {/if}
  </div>

  <aside class="ww-side">
    <section class="ww-totals" aria-label={$t('shop.sp.ww.toSplit')}>
      <div class="sh-card-2 ww-tot ww-tot-gold">
        <span class="ww-muted">{$t('shop.sp.ww.toSplit')}</span>
        <strong class="ww-gold"><bdi>{fmtMoney(revach)}</bdi></strong>
      </div>
      <div class="sh-card-2 ww-tot">
        <span class="ww-muted">{$t('shop.sp.ww.heldByYou')}</span>
        <strong><bdi>{fmtMoney(myRow?.ihave ?? 0)}</bdi></strong>
      </div>
    </section>

    {#if hatzaa == true}
      <section class="ww-pending" aria-labelledby="ww-pending-title">
        <strong id="ww-pending-title">{$t('shop.sp.ww.pendingTitle')}</strong>
        <span>{votesLine}</span>
        <ul class="ww-voters">
          {#each ulist as u (u.uid)}
            {@const v = voteOf(u.uid)}
            <li>
              <span class="ww-av ww-av-sm" aria-hidden="true">{initialOf(u.username)}</span>
              <span class="ww-grow">{u.username}</span>
              <span class="sh-chip {v === 'yes' ? 'sh-chip-ok' : v === 'no' ? 'sh-chip-accent' : 'sh-chip-muted'}">
                {v === 'yes'
                  ? $t('mission.whowhat.inFavor')
                  : v === 'no'
                    ? $t('mission.whowhat.against')
                    : $t('shop.sp.ww.notYet')}
              </span>
            </li>
          {/each}
        </ul>
        <span class="ww-muted">{$t('shop.sp.ww.silence')}</span>
      </section>
    {/if}

    {#if siteShareProposed > 0 && !hatzaa}
      <section class="sh-card-2 ww-ss" aria-labelledby="ww-ss-title">
        <div class="ww-row ww-between">
          <strong id="ww-ss-title">{$t('mission.whowhat.mgmtService')}</strong>
          <bdi class="ww-strong ww-gold">{fmtMoney(siteShareFinal)}</bdi>
        </div>
        <p class="ww-note">
          {$t('shop.sp.ww.ssSub', {
            left: fmtMoney(revach - siteShareFinal),
            total: fmtMoney(revach),
            proposed: fmtMoney(siteShareProposed)
          })}
        </p>
        <div class="ww-opts" role="radiogroup" aria-labelledby="ww-ss-title">
          <label class="ww-opt">
            <input type="radio" name="siteShareDir" checked={siteShareDirection === 'as_is'} onchange={() => pickDirection('as_is')} />
            <span>{$t('shop.sp.ww.ssAsIs', { amount: fmtMoney(siteShareProposed) })}</span>
          </label>
          <label class="ww-opt">
            <input type="radio" name="siteShareDir" checked={siteShareDirection === 'more'} onchange={() => pickDirection('more')} />
            <span>{$t('mission.whowhat.giveMore')}</span>
          </label>
          <label class="ww-opt">
            <input type="radio" name="siteShareDir" checked={siteShareDirection === 'less'} onchange={() => pickDirection('less')} />
            <span>{$t('mission.whowhat.discountLess')}</span>
          </label>
        </div>
        {#if siteShareDirection !== 'as_is'}
          <div class="ww-adjust">
            <label class="sh-field">
              {$t('mission.whowhat.amount')}
              <input class="sh-input" type="number" min="0" step="0.01" bind:value={siteShareCustom} oninput={onSiteShareAmount} />
            </label>
            <label class="sh-field">
              {siteShareDirection === 'less' ? $t('mission.whowhat.reasonRequired') : $t('mission.whowhat.reasonOptional')}
              <input class="sh-input" type="text" bind:value={siteShareReason} placeholder={$t('mission.whowhat.whyPh')} />
            </label>
          </div>
        {/if}
      </section>
    {/if}

    {#if showCreatorSiteShare}
      <section class="ww-creator">
        {#key myId}
          <SiteShareDecision
            proposed={creatorProposed}
            basis={creatorShare}
            initial={null}
            busy={isLoading}
            onDecide={onCreatorDecide}
          />
        {/key}
        {#if creatorSSDecision}
          <p class="ww-note">
            {creatorSSDecision.decision === 'skipped'
              ? $t('shop.sp.ww.creatorSkipped')
              : $t('shop.sp.ww.creatorGives', { amount: fmtMoney(Number(creatorSSDecision.amount)) })}
          </p>
        {/if}
      </section>
    {/if}

    {#if availableForNewSplit > 0 && revach > 0 && !hatzaa}
      <div class="ww-confirm">
        <button
          type="button"
          class="sh-btn sh-btn-primary sh-btn-lg ww-confirm-btn"
          onclick={ask}
          disabled={isLoading || isSuccess || already}
          aria-busy={isLoading}
        >
          {#if isLoading}<Spinner size="sm" />{/if}
          {isSuccess ? $t('shop.sp.ww.sent') : $t('mission.whowhat.confirmSplit')}
        </button>
        {#if isError}<p class="ww-err" role="alert">{$t('mission.whowhat.errorCreatingSplit')}</p>{/if}
      </div>
    {/if}
  </aside>
</div>

<style>
  .ww {
    display: flex;
    flex-direction: column;
    gap: 12px;
    min-width: 0;
  }
  /* Phone: one column, in the canvas order (totals, the vote, the change, the
     table, the sales, the site share, the button). Wider: table | side panel. */
  .ww-main,
  .ww-side {
    display: contents;
  }
  .ww-totals {
    order: 1;
  }
  .ww-pending {
    order: 2;
  }
  .ww-change {
    order: 3;
  }
  .ww-calc {
    order: 4;
  }
  .ww-included {
    order: 5;
  }
  .ww-ss {
    order: 6;
  }
  .ww-creator {
    order: 7;
  }
  .ww-confirm {
    order: 8;
  }
  .ww-muted {
    color: var(--sh-muted);
  }
  .ww-gold {
    color: var(--sh-gold);
  }
  .ww-strong {
    font-weight: 700;
  }
  .ww-grow {
    flex: 1 1 auto;
    min-width: 0;
  }
  .ww-sr {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip: rect(0 0 0 0);
    white-space: nowrap;
  }
  .ww-row {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px;
  }
  .ww-between {
    justify-content: space-between;
  }
  .ww-h2 {
    font-size: 15px;
    font-weight: 700;
  }
  .ww-note {
    font-size: 12px;
    line-height: 1.5;
  }
  :global([dir='rtl']) .ww-arrow {
    transform: scaleX(-1);
  }

  .ww-totals {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 8px;
  }
  .ww-tot {
    padding: 12px;
    display: flex;
    flex-direction: column;
    gap: 2px;
    font-size: 12px;
    min-width: 0;
  }
  .ww-tot-gold {
    border-color: var(--sh-gold-line);
  }
  .ww-tot strong {
    font-family: var(--sh-display);
    font-size: 26px;
    line-height: 1.15;
    overflow-wrap: anywhere;
  }

  .ww-pending {
    border-radius: var(--sh-radius);
    border: 1px solid color-mix(in srgb, var(--sh-info-ink) 45%, transparent);
    background: var(--sh-info-tint);
    padding: 14px;
    display: flex;
    flex-direction: column;
    gap: 8px;
    font-size: 13px;
  }
  .ww-pending > strong {
    font-size: 14px;
    color: var(--sh-info-ink);
  }
  .ww-voters {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  .ww-voters li {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .ww-change {
    border-radius: var(--sh-radius);
    border: 1px solid var(--sh-warn-line);
    background: var(--sh-warn-tint);
    padding: 12px 14px;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .ww-change p {
    color: var(--sh-ink);
    font-size: 13px;
  }
  .ww-changes {
    list-style: none;
    margin: 0;
    padding: 8px 10px;
    border-radius: var(--sh-radius-xs);
    background: var(--sh-card);
    display: flex;
    flex-direction: column;
    gap: 4px;
    font-size: 13px;
  }
  .ww-changes li {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 6px;
  }
  .ww-new {
    font-weight: 700;
  }

  .ww-calc {
    display: flex;
    flex-direction: column;
    gap: 10px;
    min-width: 0;
  }
  .ww-calc-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
  }
  .ww-seg button {
    min-height: 36px;
    padding: 0 14px;
    font-size: 13px;
  }
  .ww-cards {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    gap: 10px;
  }
  .ww-card {
    padding: 14px;
    display: flex;
    flex-direction: column;
    gap: 10px;
    min-width: 0;
  }
  .ww-card-give {
    border-color: var(--sh-gold-line);
  }
  .ww-platform {
    border-style: dashed;
    border-color: var(--sh-gold-line);
  }
  .ww-card-head {
    display: flex;
    align-items: center;
    gap: 10px;
  }
  .ww-id {
    display: flex;
    flex-direction: column;
    flex: 1 1 auto;
    min-width: 0;
    font-size: 12px;
  }
  .ww-id strong {
    font-size: 16px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .ww-av {
    width: 40px;
    height: 40px;
    flex-shrink: 0;
    border-radius: 50%;
    border: 2px solid var(--sh-gold);
    color: var(--sh-gold);
    background: var(--sh-card);
    font-size: 16px;
    font-weight: 700;
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }
  .ww-av-sm {
    width: 26px;
    height: 26px;
    font-size: 12px;
    border-width: 1px;
  }
  .ww-av-plat {
    background: var(--sh-gold);
    color: var(--sh-card);
    font-size: 13px;
  }
  .ww-bars {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  .ww-bar {
    display: block;
    height: 6px;
    border-radius: 3px;
    background: var(--sh-line);
    overflow: hidden;
  }
  .ww-bar > span {
    display: block;
    height: 100%;
    border-radius: 3px;
  }
  .ww-bar-share {
    background: var(--sh-gold);
  }
  .ww-bar-hold {
    background: var(--sh-accent-ink);
  }
  .ww-rows {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    gap: 6px 10px;
    margin: 0;
    font-size: 13px;
  }
  .ww-rows dt {
    color: var(--sh-muted);
  }
  .ww-rows dd {
    margin: 0;
    font-weight: 600;
    text-align: end;
  }
  .ww-share {
    color: var(--sh-gold);
  }
  .ww-hold {
    color: var(--sh-accent-ink);
  }
  .ww-transfers {
    display: flex;
    flex-direction: column;
    gap: 6px;
    padding-top: 8px;
    border-top: 1px solid var(--sh-line);
    font-size: 12px;
  }
  .ww-transfer {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 14px;
  }
  .ww-transfer .ww-arrow {
    color: var(--sh-gold);
    flex-shrink: 0;
  }
  .ww-plat {
    color: var(--sh-gold);
  }

  .ww-table th[scope='row'] {
    background: var(--sh-card-2);
    white-space: nowrap;
  }
  .ww-table td {
    text-align: center;
  }
  .ww-th {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    color: var(--sh-ink);
  }
  .ww-give {
    color: var(--sh-accent-ink);
    font-weight: 600;
  }
  .ww-get {
    color: var(--sh-ok-ink);
    font-weight: 600;
  }
  .ww-to {
    font-size: 12px;
  }
  .ww-to-line {
    display: block;
    white-space: nowrap;
  }
  .ww-plat-cell {
    background: color-mix(in srgb, var(--sh-gold) 8%, transparent);
    color: var(--sh-gold);
  }

  .ww-included {
    padding: 14px 16px;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  .ww-chips {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }
  .ww-chips .sh-chip {
    white-space: normal;
    font-weight: 600;
  }

  .ww-ss {
    padding: 14px;
    display: flex;
    flex-direction: column;
    gap: 10px;
    font-size: 14px;
  }
  .ww-opts {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  .ww-opt {
    display: flex;
    align-items: center;
    gap: 10px;
    min-height: 44px;
    padding: 0 12px;
    border-radius: var(--sh-radius-sm);
    border: 1px solid var(--sh-line);
    background: var(--sh-card);
    cursor: pointer;
  }
  .ww-opt:has(input:checked) {
    border-color: var(--sh-gold);
    background: color-mix(in srgb, var(--sh-gold) 10%, var(--sh-card));
  }
  .ww-opt input {
    accent-color: var(--sh-gold);
    width: 16px;
    height: 16px;
  }
  .ww-adjust {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  /* The per-member contribution prompt is shared with the heart; on this page
     it sits on the shop surfaces. */
  .ww-creator :global(.ssd) {
    background: var(--sh-card-2);
    border-color: var(--sh-line);
    color: var(--sh-ink);
  }
  .ww-creator :global(.ssd-title),
  .ww-creator :global(.ssd-amount) {
    color: var(--sh-gold);
  }
  .ww-creator :global(.ssd-sub),
  .ww-creator :global(.ssd-settled) {
    color: var(--sh-muted);
  }
  .ww-creator :global(.ssd-confirm) {
    background: var(--sh-accent);
    color: var(--sh-on-accent);
    border-color: transparent;
  }

  .ww-confirm {
    position: sticky;
    bottom: var(--foot-h, 0px);
    z-index: 4;
    margin: 0 -16px;
    padding: 12px 16px calc(12px + env(safe-area-inset-bottom));
    background: color-mix(in srgb, var(--sh-card) 92%, transparent);
    backdrop-filter: blur(16px);
    border-top: 1px solid var(--sh-line);
  }
  .ww-confirm-btn {
    width: 100%;
  }
  .ww-err {
    margin-top: 6px;
    font-size: 12px;
    color: var(--sh-accent-ink);
    font-weight: 700;
  }

  @media (min-width: 640px) {
    .ww-cards {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }
  @media (min-width: 900px) {
    .ww {
      display: grid;
      grid-template-columns: minmax(0, 1fr) 360px;
      align-items: start;
      gap: 20px;
    }
    .ww-main,
    .ww-side {
      display: flex;
      flex-direction: column;
      gap: 14px;
      min-width: 0;
    }
    .ww-side {
      position: sticky;
      top: 16px;
    }
    .ww-confirm {
      position: static;
      margin: 0;
      padding: 0;
      background: none;
      backdrop-filter: none;
      border: 0;
    }
  }
</style>
