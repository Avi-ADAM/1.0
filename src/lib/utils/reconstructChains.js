/**
 * Chain Reconstruction Utilities
 *
 * Pure functions that reconstruct mission and resource lifecycle chains
 * from the flat arrays of Strapi entities already loaded by the moach page.
 *
 * No network calls are made — all logic is purely client-side.
 *
 * @module reconstructChains
 */

// ---------------------------------------------------------------------------
// Type documentation (JSDoc only — no runtime overhead)
// ---------------------------------------------------------------------------

/**
 * @typedef {Object} StrapiEntity
 * @property {string} id
 * @property {Object} attributes
 */

/**
 * @typedef {Object} MissionChain
 * @property {string} id                          - pendm id, or open_mission id if no pendm
 * @property {StrapiEntity|null} pendm
 * @property {StrapiEntity|null} openMission
 * @property {StrapiEntity|null} mesimabetahalich
 * @property {StrapiEntity[]} acts
 * @property {StrapiEntity[]} finiapruvals
 * @property {string|null} finnishedMissionId     - ID only; loaded lazily
 * @property {StrapiEntity|null} finnishedMission - populated after lazy load
 */

/**
 * @typedef {Object} ResourceChain
 * @property {string} id                          - open_mashaabim id
 * @property {StrapiEntity|null} pmash
 * @property {StrapiEntity|null} openMashaabim
 * @property {StrapiEntity[]} askms
 * @property {StrapiEntity|null} maap
 * @property {StrapiEntity[]} rikmashes
 */

// ---------------------------------------------------------------------------
// Mission Chain Reconstruction
// ---------------------------------------------------------------------------

/**
 * Reconstructs mission lifecycle chains from the flat entity arrays that the
 * moach page already has in memory.
 *
 * Algorithm (mirrors design document steps 1–8):
 *  1. Build pendmById and openMissionById lookup maps.
 *  2. Build chainByPendmId and chainByOpenMissionId maps (keyed by entity id).
 *  3. For each open_mission: link to its pendm via
 *     `open_mission.attributes.pendm.data.id` (primary) or acts lookup (fallback).
 *  4. For each mesimabetahalich:
 *     a. PRIMARY — link via `mesimabetahalich.attributes.open_missions.data[0].id`
 *     b. FALLBACK — find chain via acts that reference this mesimabetahalich
 *  5. For each act: link to chain via pendm id, open_mission id, or
 *     mesimabetahalich id; add act to chain.acts.
 *  6. For each already-loaded finnished_mission: link via
 *     `finnished_mission.attributes.mesimabetahalich.data.id`.
 *  7. Orphan pendms → partial chain (pendm only).
 *  8. Orphan open_missions → partial chain (open_mission only).
 *
 * All link-field accesses use optional chaining so null/undefined fields
 * never throw.
 *
 * @param {StrapiEntity[]} pmiData  - pendms
 * @param {StrapiEntity[]} omiData  - open_missions
 * @param {StrapiEntity[]} bmiData  - mesimabetahaliches
 * @param {StrapiEntity[]} fmiData  - finnished_missions (already loaded)
 * @param {StrapiEntity[]} acts     - acts (meData.acts.data)
 * @returns {MissionChain[]}
 */
export function reconstructMissionChains(pmiData, omiData, bmiData, fmiData, acts) {
  // Normalise inputs — treat anything falsy as an empty array
  const pendms = Array.isArray(pmiData) ? pmiData : [];
  const openMissions = Array.isArray(omiData) ? omiData : [];
  const betahaliches = Array.isArray(bmiData) ? bmiData : [];
  const finnishedMissions = Array.isArray(fmiData) ? fmiData : [];
  const actsList = Array.isArray(acts) ? acts : [];

  // ── Step 1: Build entity lookup maps ──────────────────────────────────────
  /** @type {Map<string, StrapiEntity>} */
  const pendmById = new Map();
  for (const p of pendms) {
    if (p?.id) pendmById.set(String(p.id), p);
  }

  /** @type {Map<string, StrapiEntity>} */
  const openMissionById = new Map();
  for (const om of openMissions) {
    if (om?.id) openMissionById.set(String(om.id), om);
  }

  /** @type {Map<string, StrapiEntity>} */
  const betahalikhById = new Map();
  for (const b of betahaliches) {
    if (b?.id) betahalikhById.set(String(b.id), b);
  }

  // ── Step 2: Chain index maps ───────────────────────────────────────────────
  // All chains live in this array; the index maps point into it.
  /** @type {MissionChain[]} */
  const chains = [];

  /** @type {Map<string, MissionChain>} keyed by pendm id */
  const chainByPendmId = new Map();

  /** @type {Map<string, MissionChain>} keyed by open_mission id */
  const chainByOpenMissionId = new Map();

  /** @type {Map<string, MissionChain>} keyed by mesimabetahalich id */
  const chainByBetahalikhId = new Map();

  // Helper: create a new empty chain and register it
  // Prefix the id with the entity type to avoid collisions across collections
  // (Strapi IDs are per-collection, so pendm#106 and openMission#106 are different)
  function newChain(id) {
    /** @type {MissionChain} */
    const chain = {
      id,
      pendm: null,
      openMission: null,
      mesimabetahalich: null,
      acts: [],
      finiapruvals: [],
      finnishedMissionId: null,
      finnishedMission: null
    };
    chains.push(chain);
    return chain;
  }

  // Helper: find or create chain by pendm id
  function getOrCreateChainByPendm(pendmId) {
    if (chainByPendmId.has(pendmId)) return chainByPendmId.get(pendmId);
    const chain = newChain(`pendm-${pendmId}`);
    chainByPendmId.set(pendmId, chain);
    return chain;
  }

  // Helper: find or create chain by open_mission id
  function getOrCreateChainByOpenMission(omId) {
    if (chainByOpenMissionId.has(omId)) return chainByOpenMissionId.get(omId);
    const chain = newChain(`om-${omId}`);
    chainByOpenMissionId.set(omId, chain);
    return chain;
  }

  // ── Step 3: Process open_missions — link to pendm ────────────────────────────
  // PRIMARY: open_mission.attributes.pendm.data.id (direct FK, available when the
  // open_mission was promoted from a pendm).
  // FALLBACK: cross-reference via acts (acts carry both pendm + open_mission ids).
  const pendmIdByOpenMissionId = new Map();
  for (const act of actsList) {
    const aOmId    = String(act?.attributes?.open_mission?.data?.id ?? '');
    const aPendmId = String(act?.attributes?.pendm?.data?.id ?? '');
    if (aOmId && aPendmId && !pendmIdByOpenMissionId.has(aOmId)) {
      pendmIdByOpenMissionId.set(aOmId, aPendmId);
    }
  }

  for (const om of openMissions) {
    if (!om?.id) continue;
    const omId          = String(om.id);
    const directPendmId = String(om?.attributes?.pendm?.data?.id ?? '');
    const pendmId       = directPendmId || (pendmIdByOpenMissionId.get(omId) ?? '');

    if (pendmId && pendmById.has(pendmId)) {
      // Link open_mission to its source pendm chain
      const chain = getOrCreateChainByPendm(pendmId);
      chain.pendm      = chain.pendm ?? pendmById.get(pendmId);
      chain.openMission = om;
      chainByOpenMissionId.set(omId, chain);
    } else {
      // No pendm link found — open_mission starts its own chain
      const chain = getOrCreateChainByOpenMission(omId);
      chain.openMission = om;
    }
  }

  // ── Step 4: Process mesimabetahaliches ────────────────────────────────────
  for (const b of betahaliches) {
    if (!b?.id) continue;
    const bId = String(b.id);

    // 4a. PRIMARY: link via open_missions manyToMany (first entry)
    const primaryOmId = String(b?.attributes?.open_missions?.data?.[0]?.id ?? '');
    let chain = null;

    if (primaryOmId && chainByOpenMissionId.has(primaryOmId)) {
      chain = chainByOpenMissionId.get(primaryOmId);
    }

    // 4b. FALLBACK: find chain via acts that reference this mesimabetahalich
    if (!chain) {
      for (const act of actsList) {
        const actBetahalikhId = String(act?.attributes?.mesimabetahaliches?.data?.[0]?.id ?? '');
        if (actBetahalikhId === bId) {
          // Find the chain this act belongs to
          const actPendmId = String(act?.attributes?.pendm?.data?.id ?? '');
          const actOmId = String(act?.attributes?.open_mission?.data?.id ?? '');
          if (actPendmId && chainByPendmId.has(actPendmId)) {
            chain = chainByPendmId.get(actPendmId);
            break;
          }
          if (actOmId && chainByOpenMissionId.has(actOmId)) {
            chain = chainByOpenMissionId.get(actOmId);
            break;
          }
        }
      }
    }

    // If still no chain, create a standalone chain for this mesimabetahalich
    if (!chain) {
      chain = newChain(`bm-${bId}`);
    }

    chain.mesimabetahalich = b;
    chainByBetahalikhId.set(bId, chain);

    // Attach finiapruvals from the mesimabetahalich's nested data
    const finiapruvals = b?.attributes?.finiapruvals?.data;
    if (Array.isArray(finiapruvals) && finiapruvals.length > 0) {
      chain.finiapruvals = finiapruvals;
    }

    // Extract finnished_mission from the betahalich relation (if populated by the API)
    const nestedFm = b?.attributes?.finnished_mission?.data;
    if (nestedFm?.id && !chain.finnishedMissionId) {
      chain.finnishedMissionId = String(nestedFm.id);
      if (nestedFm.attributes?.missionName != null) {
        chain.finnishedMission = nestedFm;
      }
    }
  }

  // ── Step 5: Process acts — link to chains ─────────────────────────────────
  for (const act of actsList) {
    if (!act?.id) continue;

    const actPendmId = String(act?.attributes?.pendm?.data?.id ?? '');
    const actOmId = String(act?.attributes?.open_mission?.data?.id ?? '');
    const actBetahalikhId = String(act?.attributes?.mesimabetahaliches?.data?.[0]?.id ?? '');

    let chain = null;

    // 5a. Link via pendm id
    if (actPendmId && chainByPendmId.has(actPendmId)) {
      chain = chainByPendmId.get(actPendmId);
    }
    // 5b. Link via open_mission id
    else if (actOmId && chainByOpenMissionId.has(actOmId)) {
      chain = chainByOpenMissionId.get(actOmId);
    }
    // 5c. Link via mesimabetahalich id
    else if (actBetahalikhId && chainByBetahalikhId.has(actBetahalikhId)) {
      chain = chainByBetahalikhId.get(actBetahalikhId);
    }

    if (chain) {
      // Avoid duplicates (act may have been referenced in step 4b already)
      if (!chain.acts.some((a) => String(a.id) === String(act.id))) {
        chain.acts.push(act);
      }
    }
    // Acts with no matching chain are intentionally dropped — they have no
    // link fields that connect them to any known mission object.
  }

  // ── Step 6: Append already-loaded finnished_missions ──────────────────────
  for (const fm of finnishedMissions) {
    if (!fm?.id) continue;
    const betahalikhId = String(fm?.attributes?.mesimabetahalich?.data?.id ?? '');

    if (betahalikhId && chainByBetahalikhId.has(betahalikhId)) {
      const chain = chainByBetahalikhId.get(betahalikhId);
      chain.finnishedMission = fm;
      chain.finnishedMissionId = String(fm.id);
    }
    // Orphan finnished_missions (no matching chain) are ignored — they cannot
    // be placed without a mesimabetahalich anchor.
  }

  // ── Step 7: Orphan pendms → partial chains ────────────────────────────────
  for (const p of pendms) {
    if (!p?.id) continue;
    const pendmId = String(p.id);
    if (!chainByPendmId.has(pendmId)) {
      const chain = getOrCreateChainByPendm(pendmId);
      chain.pendm = p;
    } else {
      // Ensure the pendm entity is set (may have been created without it)
      const chain = chainByPendmId.get(pendmId);
      if (!chain.pendm) chain.pendm = p;
    }
  }

  // ── Step 8: Orphan open_missions → partial chains ─────────────────────────
  for (const om of openMissions) {
    if (!om?.id) continue;
    const omId = String(om.id);
    if (!chainByOpenMissionId.has(omId)) {
      const chain = getOrCreateChainByOpenMission(omId);
      chain.openMission = om;
    } else {
      const chain = chainByOpenMissionId.get(omId);
      if (!chain.openMission) chain.openMission = om;
    }
  }

  return chains;
}

// ---------------------------------------------------------------------------
// Resource Chain Reconstruction
// ---------------------------------------------------------------------------

/**
 * Reconstructs resource lifecycle chains from open_mashaabim and rikmashes.
 *
 * Algorithm (mirrors design document steps 1–3):
 *  1. Build openMashaabimById lookup map.
 *  2. For each open_mashaabim: extract nested pmash, askms, maap, rikmashes
 *     from its attributes and build a ResourceChain.
 *  3. Any pmash not yet linked to an open_mashaabim → partial chain.
 *
 * Note: rikmashes are linked via open_mashaabim.rikmashes (oneToMany), so
 * the top-level `rikmashes` array passed in is used only to ensure orphan
 * rikmashes are not silently dropped (they are attached to their
 * open_mashaabim chain via the nested attribute).
 *
 * @param {StrapiEntity[]} opmash     - open_mashaabim entities
 * @param {StrapiEntity[]} rikmashes  - rikmash entities (used for orphan detection)
 * @returns {ResourceChain[]}
 */
export function reconstructResourceChains(opmash, rikmashes) {
  const openMashaabimList = Array.isArray(opmash) ? opmash : [];
  // rikmashes param kept for API symmetry and future orphan handling
  // (currently all rikmashes are accessed via open_mashaabim.rikmashes)

  /** @type {ResourceChain[]} */
  const chains = [];

  /** @type {Map<string, ResourceChain>} keyed by open_mashaabim id */
  const chainByOpenMashaabimId = new Map();

  // ── Step 2: Process open_mashaabim ────────────────────────────────────────
  for (const om of openMashaabimList) {
    if (!om?.id) continue;
    const omId = String(om.id);

    // Extract nested relations from attributes (all use optional chaining)
    const pmashData = om?.attributes?.pmash?.data ?? null;
    const askmsData = om?.attributes?.askms?.data ?? [];
    const maapData = om?.attributes?.maap?.data ?? null;
    const rikmashesData = om?.attributes?.rikmashes?.data ?? [];

    /** @type {ResourceChain} */
    const chain = {
      id: omId,
      pmash: pmashData,
      openMashaabim: om,
      askms: Array.isArray(askmsData) ? askmsData : [],
      maap: maapData,
      rikmashes: Array.isArray(rikmashesData) ? rikmashesData : []
    };

    chains.push(chain);
    chainByOpenMashaabimId.set(omId, chain);
  }

  // ── Step 3: Orphan pmashes → partial chains ───────────────────────────────
  // A pmash is "orphan" if no open_mashaabim in the list references it.
  // We detect this by collecting all pmash IDs already claimed by a chain.
  const claimedPmashIds = new Set();
  for (const chain of chains) {
    if (chain.pmash?.id) claimedPmashIds.add(String(chain.pmash.id));
  }

  // The moach page may pass pmash entities separately in the future.
  // For now, pmashes are only accessible via open_mashaabim.pmash.data,
  // so there are no standalone pmash arrays to iterate. This step is a
  // no-op unless the caller passes pmash data embedded in opmash entries
  // that have no corresponding open_mashaabim (which cannot happen by
  // definition). The loop is kept as a documented extension point.

  return chains;
}
