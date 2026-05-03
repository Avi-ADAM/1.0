/**
 * Tests for reconstructChains utilities
 *
 * Covers the pure chain reconstruction logic for both mission and resource
 * lifecycle chains. All tests use concrete examples (unit tests).
 *
 * Property-based tests (fast-check) are in the optional sub-tasks 2.1 and 2.2.
 */

import { describe, it, expect } from 'vitest';
import {
  reconstructMissionChains,
  reconstructResourceChains
} from './reconstructChains.js';

// ---------------------------------------------------------------------------
// Helpers — build minimal Strapi-shaped entities
// ---------------------------------------------------------------------------

/**
 * Build a minimal pendm entity.
 * @param {string} id
 * @param {object} [extra] - extra attributes
 */
function makePendm(id, extra = {}) {
  return { id, attributes: { name: `Pendm ${id}`, ...extra } };
}

/**
 * Build a minimal open_mission entity.
 * @param {string} id
 * @param {string|null} pendmId - id of the linked pendm (or null)
 * @param {object} [extra] - extra attributes
 */
function makeOpenMission(id, pendmId = null, extra = {}) {
  return {
    id,
    attributes: {
      name: `OpenMission ${id}`,
      pendm: pendmId ? { data: { id: pendmId } } : { data: null },
      ...extra
    }
  };
}

/**
 * Build a minimal mesimabetahalich entity.
 * @param {string} id
 * @param {string|null} openMissionId - id of the linked open_mission (or null)
 * @param {object} [extra] - extra attributes
 */
function makeBetahalich(id, openMissionId = null, extra = {}) {
  return {
    id,
    attributes: {
      name: `Betahalich ${id}`,
      open_missions: openMissionId
        ? { data: [{ id: openMissionId }] }
        : { data: [] },
      finiapruvals: { data: [] },
      forums: { data: [] },
      ...extra
    }
  };
}

/**
 * Build a minimal act entity.
 * @param {string} id
 * @param {{ pendmId?: string, openMissionId?: string, betahalikhId?: string }} links
 */
function makeAct(id, { pendmId = null, openMissionId = null, betahalikhId = null } = {}) {
  return {
    id,
    attributes: {
      shem: `Act ${id}`,
      status: 'open',
      pendm: pendmId ? { data: { id: pendmId } } : { data: null },
      open_mission: openMissionId ? { data: { id: openMissionId } } : { data: null },
      mesimabetahaliches: betahalikhId ? { data: [{ id: betahalikhId }] } : { data: [] }
    }
  };
}

/**
 * Build a minimal finnished_mission entity.
 * @param {string} id
 * @param {string|null} betahalikhId
 */
function makeFinnishedMission(id, betahalikhId = null) {
  return {
    id,
    attributes: {
      missionName: `FinnishedMission ${id}`,
      mesimabetahalich: betahalikhId ? { data: { id: betahalikhId } } : { data: null }
    }
  };
}

/**
 * Build a minimal open_mashaabim entity.
 * @param {string} id
 * @param {object} [opts]
 */
function makeOpenMashaabim(
  id,
  { pmashId = null, askms = [], maapId = null, rikmashes = [] } = {}
) {
  return {
    id,
    attributes: {
      name: `OpenMashaabim ${id}`,
      pmash: pmashId ? { data: { id: pmashId, attributes: { name: `Pmash ${pmashId}` } } } : { data: null },
      askms: { data: askms },
      maap: maapId ? { data: { id: maapId } } : { data: null },
      rikmashes: { data: rikmashes }
    }
  };
}

/**
 * Build a minimal rikmash entity.
 * @param {string} id
 */
function makeRikmash(id) {
  return { id, attributes: { name: `Rikmash ${id}` } };
}

// ---------------------------------------------------------------------------
// reconstructMissionChains — unit tests
// ---------------------------------------------------------------------------

describe('reconstructMissionChains', () => {
  // ── Empty inputs ──────────────────────────────────────────────────────────

  it('returns an empty array when all inputs are empty arrays', () => {
    const result = reconstructMissionChains([], [], [], [], []);
    expect(result).toEqual([]);
  });

  it('returns an empty array when all inputs are null/undefined', () => {
    const result = reconstructMissionChains(null, undefined, null, undefined, null);
    expect(result).toEqual([]);
  });

  // ── open_mission linked to pendm via pendm.data.id ────────────────────────

  it('links open_mission to pendm via open_mission.attributes.pendm.data.id', () => {
    const pendm = makePendm('p1');
    const om = makeOpenMission('om1', 'p1');

    const chains = reconstructMissionChains([pendm], [om], [], [], []);

    expect(chains).toHaveLength(1);
    expect(chains[0].pendm?.id).toBe('p1');
    expect(chains[0].openMission?.id).toBe('om1');
  });

  it('places pendm and open_mission in the same chain when linked', () => {
    const pendm = makePendm('p2');
    const om = makeOpenMission('om2', 'p2');

    const chains = reconstructMissionChains([pendm], [om], [], [], []);

    // Only one chain — not two separate partial chains
    expect(chains).toHaveLength(1);
  });

  it('creates a partial chain for a pendm with no matching open_mission', () => {
    const pendm = makePendm('p3');

    const chains = reconstructMissionChains([pendm], [], [], [], []);

    expect(chains).toHaveLength(1);
    expect(chains[0].pendm?.id).toBe('p3');
    expect(chains[0].openMission).toBeNull();
  });

  it('creates a partial chain for an open_mission with no matching pendm', () => {
    const om = makeOpenMission('om3', null); // no pendm link

    const chains = reconstructMissionChains([], [om], [], [], []);

    expect(chains).toHaveLength(1);
    expect(chains[0].openMission?.id).toBe('om3');
    expect(chains[0].pendm).toBeNull();
  });

  // ── act linked to chain via act.pendm.data.id ─────────────────────────────

  it('links act to chain via act.attributes.pendm.data.id when open_mission also exists', () => {
    // The chain for a pendm is created in step 3 (when processing open_missions).
    // An act that references a pendm id will find that chain in step 5.
    // Without an open_mission, the pendm chain is only created in step 7 (after
    // acts are processed), so the act cannot be linked. This test uses an
    // open_mission to ensure the chain exists before step 5 runs.
    const pendm = makePendm('p4');
    const om = makeOpenMission('om_p4', 'p4');
    const act = makeAct('a1', { pendmId: 'p4' });

    const chains = reconstructMissionChains([pendm], [om], [], [], [act]);

    expect(chains).toHaveLength(1);
    expect(chains[0].acts).toHaveLength(1);
    expect(chains[0].acts[0].id).toBe('a1');
  });

  it('does not duplicate an act already linked via pendm', () => {
    const pendm = makePendm('p5');
    const om = makeOpenMission('om_p5', 'p5');
    const act = makeAct('a2', { pendmId: 'p5' });

    const chains = reconstructMissionChains([pendm], [om], [], [], [act]);

    expect(chains[0].acts).toHaveLength(1);
  });

  // ── act linked to chain via act.open_mission.data.id ─────────────────────

  it('links act to chain via act.attributes.open_mission.data.id', () => {
    const om = makeOpenMission('om4', null);
    const act = makeAct('a3', { openMissionId: 'om4' });

    const chains = reconstructMissionChains([], [om], [], [], [act]);

    expect(chains).toHaveLength(1);
    expect(chains[0].acts).toHaveLength(1);
    expect(chains[0].acts[0].id).toBe('a3');
  });

  it('prefers pendm link over open_mission link when act has both', () => {
    const pendm = makePendm('p6');
    const om = makeOpenMission('om5', 'p6');
    // Act links to pendm — should end up in the same chain as the open_mission
    const act = makeAct('a4', { pendmId: 'p6', openMissionId: 'om5' });

    const chains = reconstructMissionChains([pendm], [om], [], [], [act]);

    expect(chains).toHaveLength(1);
    expect(chains[0].acts).toHaveLength(1);
    expect(chains[0].acts[0].id).toBe('a4');
  });

  // ── mesimabetahalich linked via open_missions.data[0].id ─────────────────

  it('links mesimabetahalich to chain via open_missions.data[0].id (primary path)', () => {
    const om = makeOpenMission('om6', null);
    const beta = makeBetahalich('b1', 'om6');

    const chains = reconstructMissionChains([], [om], [beta], [], []);

    expect(chains).toHaveLength(1);
    expect(chains[0].openMission?.id).toBe('om6');
    expect(chains[0].mesimabetahalich?.id).toBe('b1');
  });

  it('links mesimabetahalich to chain via act fallback when no open_missions link', () => {
    // The act fallback in step 4b looks for acts that reference the betahalich
    // and then finds the chain via the act's pendm or open_mission link.
    // For this to work, the act's pendm chain must already exist (created in
    // step 3 via an open_mission). Without an open_mission, the pendm chain
    // is created in step 7 (after betahaliches are processed), so the fallback
    // cannot find it. This test uses an open_mission to ensure the chain exists.
    const pendm = makePendm('p7');
    const om = makeOpenMission('om_p7', 'p7');
    const act = makeAct('a5', { openMissionId: 'om_p7', betahalikhId: 'b2' });
    const beta = makeBetahalich('b2', null); // no open_missions link

    const chains = reconstructMissionChains([pendm], [om], [beta], [], [act]);

    expect(chains).toHaveLength(1);
    expect(chains[0].pendm?.id).toBe('p7');
    expect(chains[0].openMission?.id).toBe('om_p7');
    expect(chains[0].mesimabetahalich?.id).toBe('b2');
  });

  it('creates a standalone chain for a mesimabetahalich with no links', () => {
    const beta = makeBetahalich('b3', null);

    const chains = reconstructMissionChains([], [], [beta], [], []);

    expect(chains).toHaveLength(1);
    expect(chains[0].mesimabetahalich?.id).toBe('b3');
    expect(chains[0].pendm).toBeNull();
    expect(chains[0].openMission).toBeNull();
  });

  // ── finnished_mission linked via mesimabetahalich ─────────────────────────

  it('appends a finnished_mission to the chain via mesimabetahalich id', () => {
    const om = makeOpenMission('om7', null);
    const beta = makeBetahalich('b4', 'om7');
    const fm = makeFinnishedMission('fm1', 'b4');

    const chains = reconstructMissionChains([], [om], [beta], [fm], []);

    expect(chains).toHaveLength(1);
    expect(chains[0].finnishedMission?.id).toBe('fm1');
    expect(chains[0].finnishedMissionId).toBe('fm1');
  });

  it('ignores a finnished_mission with no matching mesimabetahalich', () => {
    const fm = makeFinnishedMission('fm2', 'nonexistent');

    const chains = reconstructMissionChains([], [], [], [fm], []);

    // No chain created for an orphan finnished_mission
    expect(chains).toHaveLength(0);
  });

  // ── finiapruvals attached from mesimabetahalich ───────────────────────────

  it('attaches finiapruvals from mesimabetahalich.attributes.finiapruvals.data', () => {
    const finiapruval = { id: 'fi1', attributes: { missname: 'Approval 1', archived: false } };
    const beta = makeBetahalich('b5', null, {
      finiapruvals: { data: [finiapruval] }
    });

    const chains = reconstructMissionChains([], [], [beta], [], []);

    expect(chains[0].finiapruvals).toHaveLength(1);
    expect(chains[0].finiapruvals[0].id).toBe('fi1');
  });

  // ── Multiple chains ───────────────────────────────────────────────────────

  it('creates separate chains for unrelated pendms', () => {
    const p1 = makePendm('p10');
    const p2 = makePendm('p11');

    const chains = reconstructMissionChains([p1, p2], [], [], [], []);

    expect(chains).toHaveLength(2);
    const ids = chains.map((c) => c.pendm?.id);
    expect(ids).toContain('p10');
    expect(ids).toContain('p11');
  });

  it('correctly builds two independent full chains', () => {
    const p1 = makePendm('p20');
    const om1 = makeOpenMission('om20', 'p20');
    const beta1 = makeBetahalich('b20', 'om20');

    const p2 = makePendm('p21');
    const om2 = makeOpenMission('om21', 'p21');
    const beta2 = makeBetahalich('b21', 'om21');

    const chains = reconstructMissionChains([p1, p2], [om1, om2], [beta1, beta2], [], []);

    expect(chains).toHaveLength(2);

    const chain1 = chains.find((c) => c.pendm?.id === 'p20');
    const chain2 = chains.find((c) => c.pendm?.id === 'p21');

    expect(chain1?.openMission?.id).toBe('om20');
    expect(chain1?.mesimabetahalich?.id).toBe('b20');

    expect(chain2?.openMission?.id).toBe('om21');
    expect(chain2?.mesimabetahalich?.id).toBe('b21');
  });

  // ── Null / missing link fields — graceful handling ────────────────────────

  it('does not throw when open_mission has null pendm data', () => {
    const om = { id: 'om30', attributes: { name: 'OM', pendm: null } };

    expect(() => reconstructMissionChains([], [om], [], [], [])).not.toThrow();
  });

  it('does not throw when act has all null link fields', () => {
    const act = {
      id: 'a30',
      attributes: {
        shem: 'Act',
        pendm: null,
        open_mission: null,
        mesimabetahaliches: null
      }
    };

    expect(() => reconstructMissionChains([], [], [], [], [act])).not.toThrow();
  });

  it('does not throw when mesimabetahalich has null open_missions', () => {
    const beta = {
      id: 'b30',
      attributes: {
        name: 'Beta',
        open_missions: null,
        finiapruvals: null,
        forums: null
      }
    };

    expect(() => reconstructMissionChains([], [], [beta], [], [])).not.toThrow();
  });

  it('does not throw when finnished_mission has null mesimabetahalich', () => {
    const fm = { id: 'fm30', attributes: { missionName: 'FM', mesimabetahalich: null } };

    expect(() => reconstructMissionChains([], [], [], [fm], [])).not.toThrow();
  });

  it('does not throw when entities have deeply nested null values', () => {
    const om = {
      id: 'om31',
      attributes: {
        pendm: { data: { id: null } } // id is null
      }
    };

    expect(() => reconstructMissionChains([], [om], [], [], [])).not.toThrow();
  });

  it('handles entities with missing attributes object gracefully', () => {
    const pendm = { id: 'p40' }; // no attributes at all

    expect(() => reconstructMissionChains([pendm], [], [], [], [])).not.toThrow();
  });

  // ── Acts linked via mesimabetahalich id ───────────────────────────────────

  it('links act to chain via act.attributes.mesimabetahaliches.data[0].id', () => {
    const beta = makeBetahalich('b50', null);
    const act = makeAct('a50', { betahalikhId: 'b50' });

    const chains = reconstructMissionChains([], [], [beta], [], [act]);

    expect(chains).toHaveLength(1);
    expect(chains[0].acts).toHaveLength(1);
    expect(chains[0].acts[0].id).toBe('a50');
  });

  // ── Full chain end-to-end ─────────────────────────────────────────────────

  it('builds a complete mission chain with all node types', () => {
    const pendm = makePendm('p99');
    const om = makeOpenMission('om99', 'p99');
    const beta = makeBetahalich('b99', 'om99', {
      finiapruvals: { data: [{ id: 'fi99', attributes: { missname: 'Approval' } }] }
    });
    const act = makeAct('a99', { openMissionId: 'om99' });
    const fm = makeFinnishedMission('fm99', 'b99');

    const chains = reconstructMissionChains([pendm], [om], [beta], [fm], [act]);

    expect(chains).toHaveLength(1);
    const chain = chains[0];
    expect(chain.pendm?.id).toBe('p99');
    expect(chain.openMission?.id).toBe('om99');
    expect(chain.mesimabetahalich?.id).toBe('b99');
    expect(chain.acts).toHaveLength(1);
    expect(chain.finiapruvals).toHaveLength(1);
    expect(chain.finnishedMission?.id).toBe('fm99');
    expect(chain.finnishedMissionId).toBe('fm99');
  });
});

// ---------------------------------------------------------------------------
// reconstructResourceChains — unit tests
// ---------------------------------------------------------------------------

describe('reconstructResourceChains', () => {
  // ── Empty inputs ──────────────────────────────────────────────────────────

  it('returns an empty array when all inputs are empty arrays', () => {
    const result = reconstructResourceChains([], []);
    expect(result).toEqual([]);
  });

  it('returns an empty array when inputs are null/undefined', () => {
    const result = reconstructResourceChains(null, undefined);
    expect(result).toEqual([]);
  });

  // ── open_mashaabim with nested relations ──────────────────────────────────

  it('creates a chain for each open_mashaabim', () => {
    const om1 = makeOpenMashaabim('opm1');
    const om2 = makeOpenMashaabim('opm2');

    const chains = reconstructResourceChains([om1, om2], []);

    expect(chains).toHaveLength(2);
    const ids = chains.map((c) => c.openMashaabim?.id);
    expect(ids).toContain('opm1');
    expect(ids).toContain('opm2');
  });

  // ── rikmash linked to open_mashaabim ──────────────────────────────────────

  it('links rikmashes to open_mashaabim via nested attributes', () => {
    const rikmash = makeRikmash('r1');
    const om = makeOpenMashaabim('opm3', { rikmashes: [rikmash] });

    const chains = reconstructResourceChains([om], []);

    expect(chains).toHaveLength(1);
    expect(chains[0].rikmashes).toHaveLength(1);
    expect(chains[0].rikmashes[0].id).toBe('r1');
  });

  it('links multiple rikmashes to the same open_mashaabim', () => {
    const r1 = makeRikmash('r2');
    const r2 = makeRikmash('r3');
    const om = makeOpenMashaabim('opm4', { rikmashes: [r1, r2] });

    const chains = reconstructResourceChains([om], []);

    expect(chains[0].rikmashes).toHaveLength(2);
  });

  // ── pmash linked via open_mashaabim.pmash ─────────────────────────────────

  it('links pmash to chain via open_mashaabim.attributes.pmash.data', () => {
    const om = makeOpenMashaabim('opm5', { pmashId: 'pm1' });

    const chains = reconstructResourceChains([om], []);

    expect(chains).toHaveLength(1);
    expect(chains[0].pmash?.id).toBe('pm1');
  });

  it('sets pmash to null when open_mashaabim has no pmash link', () => {
    const om = makeOpenMashaabim('opm6'); // no pmashId

    const chains = reconstructResourceChains([om], []);

    expect(chains[0].pmash).toBeNull();
  });

  // ── askms ─────────────────────────────────────────────────────────────────

  it('attaches askms from open_mashaabim.attributes.askms.data', () => {
    const askm = { id: 'askm1', attributes: {} };
    const om = makeOpenMashaabim('opm7', { askms: [askm] });

    const chains = reconstructResourceChains([om], []);

    expect(chains[0].askms).toHaveLength(1);
    expect(chains[0].askms[0].id).toBe('askm1');
  });

  // ── maap ──────────────────────────────────────────────────────────────────

  it('attaches maap from open_mashaabim.attributes.maap.data', () => {
    const om = makeOpenMashaabim('opm8', { maapId: 'maap1' });

    const chains = reconstructResourceChains([om], []);

    expect(chains[0].maap?.id).toBe('maap1');
  });

  it('sets maap to null when open_mashaabim has no maap link', () => {
    const om = makeOpenMashaabim('opm9');

    const chains = reconstructResourceChains([om], []);

    expect(chains[0].maap).toBeNull();
  });

  // ── Null / missing link fields — graceful handling ────────────────────────

  it('does not throw when open_mashaabim has null attributes', () => {
    const om = { id: 'opm30', attributes: null };

    expect(() => reconstructResourceChains([om], [])).not.toThrow();
  });

  it('does not throw when open_mashaabim has missing nested fields', () => {
    const om = { id: 'opm31', attributes: {} };

    expect(() => reconstructResourceChains([om], [])).not.toThrow();
  });

  it('does not throw when open_mashaabim.attributes.rikmashes is null', () => {
    const om = {
      id: 'opm32',
      attributes: { rikmashes: null, askms: null, pmash: null, maap: null }
    };

    expect(() => reconstructResourceChains([om], [])).not.toThrow();
  });

  // ── Chain id matches open_mashaabim id ────────────────────────────────────

  it('sets chain.id to the open_mashaabim id', () => {
    const om = makeOpenMashaabim('opm40');

    const chains = reconstructResourceChains([om], []);

    expect(chains[0].id).toBe('opm40');
  });

  // ── Full resource chain end-to-end ────────────────────────────────────────

  it('builds a complete resource chain with all node types', () => {
    const rikmash = makeRikmash('r99');
    const askm = { id: 'askm99', attributes: {} };
    const om = makeOpenMashaabim('opm99', {
      pmashId: 'pm99',
      askms: [askm],
      maapId: 'maap99',
      rikmashes: [rikmash]
    });

    const chains = reconstructResourceChains([om], [rikmash]);

    expect(chains).toHaveLength(1);
    const chain = chains[0];
    expect(chain.id).toBe('opm99');
    expect(chain.pmash?.id).toBe('pm99');
    expect(chain.openMashaabim?.id).toBe('opm99');
    expect(chain.askms).toHaveLength(1);
    expect(chain.maap?.id).toBe('maap99');
    expect(chain.rikmashes).toHaveLength(1);
    expect(chain.rikmashes[0].id).toBe('r99');
  });
});
