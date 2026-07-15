<script>
  import { lang } from '$lib/stores/lang.js';
  import { t } from '$lib/translations';
  import pic from './../../celim/pic.js';
  import { idPr } from '../../stores/idPr.js';
  import { onMount } from 'svelte';
  import { calcX } from '$lib/func/calcX.svelte';
  import { sendToSer } from '$lib/send/sendToSer.js';
  import { executeAction } from '$lib/client/actionClient.js';
  import { computeSiteShare } from '$lib/revenue/computeSiteShare.js';
  import { SITE_SHARE_FLAGS, DEFAULT_SITE_SHARE_CONFIG } from '$lib/revenue/config.js';
  import ComparisonDisplay from '$lib/components/ui/ComparisonDisplay.svelte';
  import { toast } from 'svelte-sonner';
  import Button from '$lib/celim/ui/button.svelte';
  import SiteShareDecision from '$lib/components/revenue/SiteShareDecision.svelte';
  /**
   * @typedef {Object} Props
   * @property {any} [fmiData]
   * @property {any} [rikmashes]
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
  function percentage(partialValue, totalValue) {
    return (100 * partialValue) / totalValue;
  }
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
        const addedText = $lang === 'he' ? 'נוסף לחלוקה' : 'added to split';
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
      const newSalesText = $lang === 'he' ? 'מכירות חדשות נוספו' : 'new sales added';
      changes.push(`${newSales.length} ${newSalesText}`);
      changesForDisplay.push({
        label: $lang === 'he' ? 'מכירות חדשות:' : 'New sales:',
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
      toast.error(
        $lang === 'he'
          ? 'נא לציין סיבה להנחה בחלק האתר'
          : 'Please give a reason for the site-share discount'
      );
      return;
    }

    const cookieValueId = document.cookie
      .split('; ')
      .find((row) => row.startsWith('id='))
      .split('=')[1];

    let idL = cookieValueId;
    let d = new Date();

    try {
      const existingHalukas = currentTosplit.attributes.halukas.data;

      // Build current transfers list. Platform (site-share) transfers are tracked
      // separately and must NOT enter the tosplit's gating `halukas` set (otherwise
      // the platform member's confirmation would gate the partners, and the count
      // mismatch with checkSplitChanges() — which also excludes them — falsely
      // fires "split changed"). Mirrors ask(): platform legs stay out here.
      const currentTransfers = [];
      for (let i = 0; i < ulist.length; i++) {
        if (ulist[i].noten > 0 && ulist[i].le) {
          for (let x = 0; x < ulist[i].le.length; x++) {
            if (ulist[i].le[x].platform === true) continue;
            currentTransfers.push({
              from: ulist[i].uid,
              to: ulist[i].le[x].leid,
              amount: parseFloat(ulist[i].le[x].cama.toFixed(2))
            });
          }
        }
      }

      let updatedHalukaIds = [];

      // Process existing halukas
      for (let existingHaluka of existingHalukas) {
        const matchingTransfer = currentTransfers.find(
          (transfer) =>
            transfer.from == existingHaluka.attributes.usersend.data.id &&
            transfer.to == existingHaluka.attributes.userrecive.data.id
        );

        if (matchingTransfer) {
          // Update existing haluka if amount changed and not confirmed
          if (
            !existingHaluka.attributes.confirmed &&
            Math.abs(
              existingHaluka.attributes.amount - matchingTransfer.amount
            ) > 0.01
          ) {
            await sendToSer(
              {
                id: existingHaluka.id,
                amount: matchingTransfer.amount
              },
              '70updateHaluka',
              null,
              null,
              false,
              fetch
            );
          }
          updatedHalukaIds.push(existingHaluka.id);

          // Remove this transfer from currentTransfers as it's been handled
          const index = currentTransfers.indexOf(matchingTransfer);
          currentTransfers.splice(index, 1);
        } else if (existingHaluka.attributes.confirmed) {
          // Keep confirmed halukas even if they don't match current calculation
          updatedHalukaIds.push(existingHaluka.id);
        }
        // If no matching transfer found and not confirmed, the haluka will be removed from tosplit relation
        // (not deleted, just not included in the updated halukas array)
      }

      // Create new halukas for remaining transfers
      for (let transfer of currentTransfers) {
        const halukaData = {
          project: $idPr,
          usersend: transfer.from,
          userrecive: transfer.to,
          amount: transfer.amount,
          matbea: '2',
          confirmed: false,
          publishedAt: d.toISOString()
        };

        const result = await sendToSer(
          { data: halukaData },
          '69createHaluka',
          null,
          null,
          false,
          fetch
        );
        if (result?.data?.createHaluka?.data?.id) {
          updatedHalukaIds.push(result.data.createHaluka.data.id);
        }
      }

      // Create new hervachti array
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

      // ── Site share (1💗1) on the UPDATE path ──────────────────────────────────
      // Mirror ask(): the platform's service line is a real giver→platform Haluka,
      // but it is NOT part of the gating `halukas` set — it's linked through the
      // tosplit's `siteShareHalukas` (SET semantics, like `sales`). We reconcile the
      // existing platform transfers against the freshly-computed ones so editing a
      // proposal keeps the cross-rikma transfer accurate (update amount, add new,
      // drop stale-unconfirmed) without proliferating duplicates.
      let platformHalukaIds = [];
      const existingPlatform = currentTosplit.attributes.siteShareHalukas?.data || [];
      const siteShareActive =
        SITE_SHARE_FLAGS.crossRikmaFields && platformInfo?.configured;
      if (siteShareActive) {
        // Current platform transfers from the recomputed split.
        const platformNow = [];
        for (let i = 0; i < ulist.length; i++) {
          if (ulist[i].noten > 0 && ulist[i].le) {
            for (let x = 0; x < ulist[i].le.length; x++) {
              if (ulist[i].le[x].platform === true) {
                platformNow.push({
                  from: String(ulist[i].uid),
                  to: String(ulist[i].le[x].leid),
                  amount: parseFloat(ulist[i].le[x].cama.toFixed(2))
                });
              }
            }
          }
        }

        const remaining = [...platformNow];
        for (const ex of existingPlatform) {
          const exFrom = String(ex.attributes.usersend?.data?.id ?? '');
          const exTo = String(ex.attributes.userrecive?.data?.id ?? '');
          const idx = remaining.findIndex((t) => t.from === exFrom && t.to === exTo);
          if (idx !== -1) {
            const m = remaining[idx];
            if (
              !ex.attributes.confirmed &&
              Math.abs((ex.attributes.amount || 0) - m.amount) > 0.01
            ) {
              await sendToSer(
                { id: ex.id, amount: m.amount },
                '70updateHaluka',
                null,
                null,
                false,
                fetch
              );
            }
            platformHalukaIds.push(ex.id);
            remaining.splice(idx, 1);
          } else if (ex.attributes.confirmed) {
            // Keep confirmed transfers even if the recompute no longer produces them.
            platformHalukaIds.push(ex.id);
          }
          // Unmatched & unconfirmed → omitted from platformHalukaIds → unlinked by
          // the siteShareHalukas SET below (its source_tosplit is cleared).
        }

        // Brand-new platform transfers — tagged like ask(). The tosplit-side SET
        // links them (source_tosplit), so it isn't passed here.
        for (const t of remaining) {
          const halukaData = {
            project: $idPr,
            usersend: t.from,
            userrecive: t.to,
            amount: t.amount,
            matbea: '2',
            confirmed: false,
            publishedAt: d.toISOString(),
            isSiteShare: true,
            recive_project: String(platformInfo.projectId),
            proposedAmount: siteShareProposed,
            adjustDirection: siteShareDirection,
            adjustReason: siteShareReason || null,
            autoApproved: true
          };
          const res = await sendToSer(
            { data: halukaData },
            '69createHaluka',
            null,
            null,
            false,
            fetch
          );
          const id = res?.data?.createHaluka?.data?.id;
          if (id) platformHalukaIds.push(id);
        }
      }

      // `68updateTosplit` writes `sales` as a SET (replace), and tosplit↔sale is
      // manyToMany — so we must re-send the sales ALREADY linked to this tosplit
      // together with the newly-unsplited ones, or the update would silently drop
      // the originals and they'd resurface as phantom "new sales" on refresh.
      const existingSaleIds = currentTosplit.attributes.sales?.data?.map(s => s.id) || [];
      const salesIds = [...new Set([...existingSaleIds, ...unsplitedSales.map(sale => sale.id)])];

      // Update the tosplit with new halukas, hervachti, sales and the site-share
      // transfer links. Passthrough `data: TosplitInput!` (same proven shape as
      // createTosplit) so siteShareHalukas flows even though the local generated
      // schema is stale. siteShareHalukas is always sent (the sole caller) so its
      // SET semantics link/unlink platform transfers cleanly without wiping.
      await sendToSer(
        {
          id: currentTosplit.id,
          data: {
            halukas: updatedHalukaIds,
            hervachti: hervachtiArray,
            sales: salesIds,
            ...(siteShareActive ? { siteShareHalukas: platformHalukaIds } : {})
          }
        },
        '68updateTosplit',
        null,
        null,
        false,
        fetch
      );

      // Update each sale to mark as pending (not splited yet, waiting for votes)
      for (let saleId of salesIds) {
        await sendToSer(
          {
            id: saleId,
            pending: true,
            tosplits: [currentTosplit.id]
          },
          '71updateSaleSplited',
          null,
          null,
          false,
          fetch
        );
      }

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
        existingPlatform.length === 0 &&
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
        existingPlatform.length > 0
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
      toast.error(
        $lang === 'he'
          ? 'נא לציין סיבה להנחה בחלק האתר'
          : 'Please give a reason for the site-share discount'
      );
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
      toast.error($lang === 'he' ? 'לא נמצא מזהה משתמש' : 'User ID not found');
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
      // See docs/PLAN_SITE_SHARE.md §6.1 and src/generated/SITE_SHARE_TRANSFER_SPEC.md.
      console.log('[SiteShare] submit — platformInfo:', JSON.stringify(platformInfo),
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

      const tosplitResult = await executeAction('createTosplit', { data: tosplitData });

      if (!tosplitResult.success || !tosplitResult.data?.createTosplit?.data?.id) {
        const errorMsg = typeof tosplitResult.error === 'string' 
          ? tosplitResult.error 
          : tosplitResult.error?.message || 'Failed to create tosplit';
        toast.error(errorMsg);
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

      // Step 5: Update each sale to mark as pending (waiting for votes)
      for (let saleId of salesIds) {
        await sendToSer(
          {
            id: saleId,
            pending: true,
            tosplits: [tosplitId]
          },
          '71updateSaleSplited',
          null,
          null,
          false,
          fetch
        );
      }

      // Step 6: Create timegrama for the tosplit
      let x = calcX(restime);
      let fd = new Date(Date.now() + x);
      await sendToSer(
        { whatami: 'tosplit', tosplit: tosplitId, date: fd },
        '32createTimeGrama',
        null,
        null,
        false,
        fetch
      );

      console.log('✅ Tosplit created successfully with automatic notifications!');
      toast.success($lang === 'he' ? 'החלוקה נוצרה בהצלחה!' : 'Split created successfully!');
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
      toast.error($lang === 'he' ? 'שגיאה ביצירת החלוקה' : 'Error creating split');
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
</script>

<div class="dd md:items-center">
  <div class="body items-center">
    <h1 class="calc-title">{$t('mission.whowhat.calculationTable')}</h1>

    <div class="view-toggle" dir="rtl" role="tablist">
      <button
        type="button"
        class="vt-btn"
        class:active={viewMode === 'cards'}
        aria-pressed={viewMode === 'cards'}
        onclick={() => (viewMode = 'cards')}
      >
        {$lang === 'he' ? 'כרטיסים' : 'Cards'}
      </button>
      <button
        type="button"
        class="vt-btn"
        class:active={viewMode === 'table'}
        aria-pressed={viewMode === 'table'}
        onclick={() => (viewMode = 'table')}
      >
        {$lang === 'he' ? 'טבלה' : 'Table'}
      </button>
    </div>

    {#if viewMode === 'cards'}
    <div class="calc-grid" dir="rtl">
      {#each ulist as data}
        <div class="pcard">
          <div class="pcard-head">
            {#if data.src}
              <img class="pcard-av" src={data.src} alt={data.username} />
            {:else}
              <div class="pcard-av pcard-av-ph">{(data.username || '?').charAt(0)}</div>
            {/if}
            <div class="pcard-id">
              <span class="pcard-name">{data.username}</span>
              <span class="pcard-pct">{data.p.toFixed(1)}% {$t('mission.whowhat.percentageInRikma')}</span>
            </div>
          </div>

          <div class="pcard-rows">
            <div class="prow">
              <span>{$t('mission.whowhat.profitShare')}</span>
              <b>{revach > 0 ? data.x.toFixed(2) : '0'}</b>
            </div>
            <div class="prow">
              <span>{$t('mission.whowhat.myAmount')}</span>
              <b>{(data.ihave || 0).toFixed(2)}</b>
            </div>
            {#if revach > 0 && data.noten > 0.01}
              <div class="prow give">
                <span>{$t('mission.whowhat.amountToGive')}</span>
                <b>{data.noten.toFixed(2)}</b>
              </div>
            {:else if revach > 0 && data.meca > 0.01}
              <div class="prow get">
                <span>{$t('mission.whowhat.amountToReceive')}</span>
                <b>{data.meca.toFixed(2)}</b>
              </div>
            {:else}
              <div class="prow even">
                <span>{$lang === 'he' ? 'מאוזן' : 'Balanced'}</span>
                <b>✓</b>
              </div>
            {/if}
          </div>

          {#if data.le && data.le.length > 0}
            <div class="pcard-transfers">
              <span class="pt-head">{$t('mission.whowhat.giveTo')}</span>
              {#each data.le as ee}
                <span class="pt-chip" class:platform={ee.platform}>{ee.le} · {ee.cama.toFixed(2)}</span>
              {/each}
            </div>
          {/if}
        </div>
      {/each}

      {#if showPlatformCol}
        <div class="pcard platform-card">
          <div class="pcard-head">
            <div class="pcard-av pcard-av-plat">💗</div>
            <div class="pcard-id">
              <span class="pcard-name">1💗1</span>
              <span class="pcard-pct">
                {revach > 0 ? ((siteShareFinal / revach) * 100).toFixed(1) : '0'}% · {$lang === 'he' ? 'שירות ניהול ושותפות' : 'management & partnership'}
              </span>
            </div>
          </div>

          <div class="pcard-rows">
            <div class="prow get">
              <span>{$lang === 'he' ? 'חלק האתר' : 'Site share'}</span>
              <b>{siteShareFinal.toFixed(2)}</b>
            </div>
          </div>

          {#if platformTransfers.length > 0}
            <div class="pcard-transfers">
              <span class="pt-head">{$lang === 'he' ? 'ממומן ע"י' : 'Funded by'}</span>
              {#each platformTransfers as tr}
                <span class="pt-chip platform">{tr.fromName} · {tr.amount.toFixed(2)}</span>
              {/each}
            </div>
          {/if}
        </div>
      {/if}
    </div>
    {/if}

    {#if viewMode === 'table'}
    <div class="table-wrap">
      <table dir="rtl">
        <tbody>
          <tr class="gg">
            <th class="gg"></th>
            {#each ulist as data, i}
              <td class="gg" style="font-size: 3rem">{i + 1}</td>
            {/each}
            {#if showPlatformCol}<td class="gg" style="font-size: 2rem">💗</td>{/if}
          </tr>
          <tr class="ggr">
            <th class="ggr">{$t('mission.whowhat.name')}</th>
            {#each ulist as data}
              <td class="ggr">{data.username}</td>
            {/each}
            {#if showPlatformCol}<td class="ggr">1💗1</td>{/if}
          </tr>
          <tr>
            <th>{$t('mission.whowhat.profitShare')}</th>
            {#each ulist as data}
              <td>{revach > 0 ? data.x.toFixed(2) : '0'}</td>
            {/each}
            {#if showPlatformCol}<td class="plat-cell">{siteShareFinal.toFixed(2)}</td>{/if}
          </tr>
          <tr>
            <th>{$t('mission.whowhat.myAmount')}</th>
            {#each ulist as data}
              <td>{(data.ihave || 0).toFixed(2)}</td>
            {/each}
            {#if showPlatformCol}<td class="plat-cell">—</td>{/if}
          </tr>
          <tr>
            <th>{$t('mission.whowhat.amountToGive')}</th>
            {#each ulist as data}
              <td>{revach > 0 && data.noten > 0.01 ? data.noten.toFixed(2) : '0'}</td>
            {/each}
            {#if showPlatformCol}<td class="plat-cell">—</td>{/if}
          </tr>
          <tr>
            <th>{$t('mission.whowhat.giveTo')}</th>
            {#each ulist as data}
              <td>
                {#if data.le}
                  {#each data.le as ee}
                    {` ${ee.le} :  ${ee.cama.toFixed(2)} `}<br />
                  {/each}
                {/if}
              </td>
            {/each}
            {#if showPlatformCol}<td class="plat-cell">—</td>{/if}
          </tr>
          <tr>
            <th>{$t('mission.whowhat.amountToReceive')}</th>
            {#each ulist as data}
              <td>{revach > 0 && data.meca > 0.01 ? data.meca.toFixed(2) : '0'}</td>
            {/each}
            {#if showPlatformCol}<td class="plat-cell">{siteShareFinal.toFixed(2)}</td>{/if}
          </tr>
          <tr>
            <th>{$t('mission.whowhat.percentageInRikma')}</th>
            {#each ulist as data}
              <td>{data.p.toFixed(2)}</td>
            {/each}
            {#if showPlatformCol}<td class="plat-cell">{revach > 0 ? ((siteShareFinal / revach) * 100).toFixed(2) : '0'}</td>{/if}
          </tr>
        </tbody>
      </table>
    </div>
    {/if}
<br>
    {#if siteShareProposed > 0 && !hatzaa}
      <div class="site-share" dir="rtl">
        <div class="ss-head">
          <span class="ss-title">
            {$lang === 'he'
              ? 'שירות הניהול והשותפות של 1💗1'
              : '1💗1 management & partnership service'}
          </span>
          <span class="ss-amount">{siteShareFinal.toFixed(2)}</span>
        </div>
        <p class="ss-sub">
          {$lang === 'he'
            ? `1💗1 נכנסת לחלוקה כשותפה נותנת־שירות. הסכום הזה יורד מהרווח שמתחלק בין השותפים (נשאר לחלוקה: ${(revach - siteShareFinal).toFixed(2)} מתוך ${revach.toFixed(2)}). מוצע: ${siteShareProposed.toFixed(2)} — אפשר לתת יותר או לבקש הנחה, וזה מאושר מיד.`
            : `1💗1 joins the split as a service-providing partner. This amount is deducted from the profit shared between partners (left to split: ${(revach - siteShareFinal).toFixed(2)} of ${revach.toFixed(2)}). Suggested: ${siteShareProposed.toFixed(2)} — you may give more or ask for less; approved instantly.`}
        </p>

        <div class="ss-options">
          <label class="ss-opt">
            <input
              type="radio"
              name="siteShareDir"
              checked={siteShareDirection === 'as_is'}
              onchange={() => pickDirection('as_is')}
            />
            <span>{$lang === 'he' ? `משלם כפי שמוצע (${siteShareProposed.toFixed(2)})` : `Pay as suggested (${siteShareProposed.toFixed(2)})`}</span>
          </label>

          <label class="ss-opt">
            <input
              type="radio"
              name="siteShareDir"
              checked={siteShareDirection === 'more'}
              onchange={() => pickDirection('more')}
            />
            <span>{$lang === 'he' ? 'ארצה לתת יותר' : "I'd like to give more"}</span>
          </label>

          <label class="ss-opt">
            <input
              type="radio"
              name="siteShareDir"
              checked={siteShareDirection === 'less'}
              onchange={() => pickDirection('less')}
            />
            <span>{$lang === 'he' ? 'אשמח להנחה — אשלם פחות' : "I'd like a discount — pay less"}</span>
          </label>
        </div>

        {#if siteShareDirection !== 'as_is'}
          <div class="ss-adjust">
            <label class="ss-field">
              <span>{$lang === 'he' ? 'סכום' : 'Amount'}</span>
              <input
                type="number"
                min="0"
                step="0.01"
                bind:value={siteShareCustom}
                oninput={onSiteShareAmount}
              />
            </label>
            <label class="ss-field ss-reason">
              <span>
                {siteShareDirection === 'less'
                  ? ($lang === 'he' ? 'סיבה (חובה)' : 'Reason (required)')
                  : ($lang === 'he' ? 'סיבה (אופציונלי)' : 'Reason (optional)')}
              </span>
              <input
                type="text"
                bind:value={siteShareReason}
                placeholder={$lang === 'he' ? 'מה הסיבה?' : 'Why?'}
              />
            </label>
          </div>
        {/if}
      </div>
    {/if}
    {#if showCreatorSiteShare}
      <div class="creator-ss" dir="rtl">
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
          <p class="creator-ss-note">
            {#if $lang === 'he'}
              {creatorSSDecision.decision === 'skipped'
                ? 'בחרת לא לתת הפעם — יירשם עם יצירת החלוקה.'
                : `הנתינה שלך (${Number(creatorSSDecision.amount).toFixed(2)}) תירשם עם יצירת החלוקה.`}
            {:else}
              {creatorSSDecision.decision === 'skipped'
                ? 'You chose not to give — saved when the split is created.'
                : `Your contribution (${Number(creatorSSDecision.amount).toFixed(2)}) will be saved when the split is created.`}
            {/if}
          </p>
        {/if}
      </div>
    {/if}
    {#if availableForNewSplit > 0 && revach > 0 && !hatzaa}
      <Button
        text={{ he: $t('mission.whowhat.confirmSplit'), en: $t('mission.whowhat.confirmSplit'), ar: $t('mission.whowhat.confirmSplit') }}
        loading={isLoading}
        success={isSuccess}
        error={isError}
        onClick={ask}
        disabled={isLoading || isSuccess || already}
      />
    {/if}
<br>
    {#if showUpdateSuggestion}
      <div class="border border-yellow-500 bg-yellow-50 m-2 p-4 rounded">
        <h2 class="font-bold text-yellow-800 mb-2">
          {$t('mission.whowhat.splitChanged')}
        </h2>
        <p class="text-yellow-700 mb-3">
          {$t('mission.whowhat.splitChangedMsg')}
        </p>
        {#if changesList.length > 0}
          <div class="bg-yellow-100 p-3 rounded mb-3 border border-yellow-300">
            <strong class="block mb-2 text-yellow-800">{$t('mission.whowhat.changesDetected')}</strong>
            <div class="space-y-2 bg-white p-2 rounded border">
              {#each changesList as change}
                <ComparisonDisplay 
                  label={change.label}
                  oldValue={change.oldValue}
                  newValue={change.newValue}
                />
              {/each}
            </div>
          </div>
        {/if}
        <div class="flex gap-2">
          <button
            class="bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-2 px-4 rounded"
            onclick={updateTosplit}
          >
            {$t('mission.whowhat.updateSplit')}
          </button>
          <button
            class="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded"
            onclick={() => (showUpdateSuggestion = false)}
          >
            {$t('mission.whowhat.cancel')}
          </button>
        </div>
      </div>
    {/if}

    {#if hatzaa == true}
      <div class="border border-barbi m-2 p-2  bg-gold">
        <h1 class="font-bold">
          {$t('mission.whowhat.proposalPending')}<br />
          {` ${$t('mission.whowhat.soFar')} ${noofok > 1 ? `${$t('mission.whowhat.thereAre')} ${noofok} ${$t('mission.whowhat.votes')}` : $t('mission.whowhat.oneVote')} ${$t('mission.whowhat.inFavor')} ${noofno > 0 ? `, ${noofno} ${$t('mission.whowhat.against')} ` : ''} ${noofw > 0 ? `${$t('mission.whowhat.and')}-${noofw} ${$t('mission.whowhat.notVotedYet')}` : ''}`}
        </h1>
      </div>{/if}
  </div>
</div>

<style>
  .dd {
    display: flex;
    align-items: center;
    justify-content: center;
    flex-direction: column;
  }
  .body {
    width: 100%;
    max-width: 100vw;
    padding-left: 0.5em;
    padding-right: 0.5em;
  }

  /* ── Calculation: responsive participant cards (replaces the legacy table) ── */
  .calc-title {
    text-align: center;
    font-weight: 800;
    font-size: 1.5rem;
    margin: 0.5rem 0 1.1rem;
    color: var(--barbi-pink);
  }
  /* ── View switcher (cards / table) ── */
  .view-toggle {
    display: flex;
    width: fit-content;
    gap: 0;
    margin: 0 auto 1rem;
    padding: 0.2rem;
    border: 2px solid rgb(103, 232, 249);
    border-radius: 999px;
    background: #eafcff;
  }
  .vt-btn {
    border: none;
    background: transparent;
    color: #6b0f1a;
    font-weight: 700;
    font-size: 0.85rem;
    padding: 0.35rem 1.1rem;
    border-radius: 999px;
    cursor: pointer;
    transition: background 0.15s, color 0.15s;
  }
  .vt-btn.active {
    background-image: linear-gradient(315deg, #6b0f1a 0%, #b91372 74%);
    color: rgb(132, 241, 223);
  }

  /* ── Legacy spreadsheet table view ── */
  .table-wrap {
    width: 100%;
    overflow-x: auto;
  }
  .table-wrap table,
  .table-wrap th,
  .table-wrap td {
    border-collapse: collapse;
    border-width: 4px;
    border-color: rgb(103, 232, 249);
    border-radius: 4%;
  }
  .table-wrap table {
    text-align: center;
    color: var(--barbi-pink);
    margin: 0 auto;
  }
  .table-wrap th {
    background-color: #6b0f1a;
    background-image: linear-gradient(315deg, #6b0f1a 0%, #b91372 74%);
    color: rgb(132, 241, 223);
    padding: 0.3rem 0.6rem;
  }
  .table-wrap td {
    background-color: #5efaf2;
    background-image: linear-gradient(8deg, #5efaf2 0%, #eee 74%);
    padding: 0.3rem 0.6rem;
  }
  .table-wrap th:hover {
    background: var(--barbi-pink);
  }
  .table-wrap td:hover {
    background: rgb(132, 241, 223);
  }
  .table-wrap .gg,
  .table-wrap .ggr {
    background-color: #6b0f1a;
    background-image: linear-gradient(315deg, #6b0f1a 0%, #b91372 74%);
    color: rgb(132, 241, 223);
  }
  .table-wrap td.plat-cell {
    background-image: linear-gradient(8deg, #ffe9a8 0%, #fff7e0 74%);
    color: #6b0f1a;
    font-weight: 800;
  }

  .calc-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(230px, 1fr));
    gap: 0.85rem;
    width: 100%;
    max-width: 60rem;
    margin: 0 auto;
  }
  .pcard {
    display: flex;
    flex-direction: column;
    gap: 0.6rem;
    padding: 0.9rem;
    border-radius: 1rem;
    border: 2px solid rgb(103, 232, 249);
    background-image: linear-gradient(160deg, #ffffff 0%, #eafcff 100%);
    box-shadow: 0 4px 14px rgba(0, 0, 0, 0.06);
  }
  .pcard-head {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    min-width: 0;
  }
  .pcard-av {
    width: 44px;
    height: 44px;
    border-radius: 50%;
    object-fit: cover;
    border: 2px solid rgb(103, 232, 249);
    flex-shrink: 0;
  }
  .pcard-av-ph,
  .pcard-av-plat {
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 800;
    color: #6b0f1a;
    background: #b3f5ec;
  }
  .pcard-av-plat {
    font-size: 1.4rem;
    background: #ffe9a8;
    border-color: var(--barbi-pink);
  }
  .pcard-id {
    display: flex;
    flex-direction: column;
    min-width: 0;
  }
  .pcard-name {
    font-weight: 800;
    color: #6b0f1a;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .pcard-pct {
    font-size: 0.72rem;
    font-weight: 700;
    color: var(--barbi-pink);
  }
  .pcard-rows {
    display: flex;
    flex-direction: column;
    gap: 0.3rem;
  }
  .prow {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.85rem;
    padding: 0.32rem 0.55rem;
    border-radius: 0.5rem;
    background: rgba(0, 0, 0, 0.035);
    color: #444;
  }
  .prow b {
    font-weight: 800;
    color: #6b0f1a;
  }
  .prow.give {
    background: rgba(255, 0, 146, 0.1);
  }
  .prow.give,
  .prow.give b {
    color: #b3006b;
  }
  .prow.get {
    background: rgba(2, 200, 150, 0.16);
  }
  .prow.get,
  .prow.get b {
    color: #067a5b;
  }
  .prow.even {
    opacity: 0.6;
  }
  .pcard-transfers {
    display: flex;
    flex-wrap: wrap;
    gap: 0.3rem;
    align-items: center;
    padding-top: 0.5rem;
    border-top: 1px dashed rgba(0, 0, 0, 0.12);
  }
  .pt-head {
    width: 100%;
    font-size: 0.7rem;
    font-weight: 700;
    opacity: 0.65;
  }
  .pt-chip {
    font-size: 0.75rem;
    background: #fff;
    border: 1px solid rgb(103, 232, 249);
    border-radius: 999px;
    padding: 0.12rem 0.55rem;
    white-space: nowrap;
  }
  .pt-chip.platform {
    border-color: var(--barbi-pink);
    background: #fff7e0;
    color: #6b0f1a;
    font-weight: 700;
  }
  .platform-card {
    background-image: linear-gradient(160deg, #fff7e0 0%, #ffe9a8 100%);
    border-color: var(--barbi-pink);
    box-shadow: 0 6px 18px rgba(255, 0, 146, 0.18);
  }

  /* Site-share service line + payer adjustment */
  .creator-ss {
    max-width: 32rem;
    margin: 1rem auto;
  }
  .creator-ss-note {
    margin: 0.5rem 0 0;
    font-size: 0.85rem;
    font-weight: 600;
    text-align: right;
    color: var(--gold, #c9a227);
  }

  .site-share {
    max-width: 32rem;
    margin: 1rem auto;
    padding: 1rem 1.25rem;
    border: 2px solid var(--barbi-pink);
    border-radius: 0.75rem;
    background-image: linear-gradient(315deg, #fff7e0 0%, #ffe9a8 100%);
    color: #6b0f1a;
    text-align: right;
  }
  .ss-head {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 0.75rem;
  }
  .ss-title {
    font-weight: 700;
    font-size: 1.05rem;
  }
  .ss-amount {
    font-weight: 800;
    font-size: 1.5rem;
    color: var(--barbi-pink);
    white-space: nowrap;
  }
  .ss-sub {
    margin: 0.4rem 0 0.8rem;
    font-size: 0.85rem;
    opacity: 0.85;
    line-height: 1.4;
  }
  .ss-options {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
  }
  .ss-opt {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    cursor: pointer;
  }
  .ss-opt input {
    accent-color: var(--barbi-pink);
  }
  .ss-adjust {
    display: flex;
    flex-wrap: wrap;
    gap: 0.75rem;
    margin-top: 0.75rem;
  }
  .ss-field {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    font-size: 0.8rem;
    font-weight: 600;
  }
  .ss-field.ss-reason {
    flex: 1 1 12rem;
  }
  .ss-field input {
    padding: 0.4rem 0.5rem;
    border: 1px solid var(--barbi-pink);
    border-radius: 0.4rem;
    background: #fff;
    color: #6b0f1a;
  }
</style>
