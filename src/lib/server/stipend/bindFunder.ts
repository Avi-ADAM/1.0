/**
 * Binding the funder a rikma recruited through an open resource request
 * (docs/PLAN_STIPEND.md §12.2, §13).
 *
 * `publishStipendFundingRequest` posts "we need someone to fund our members"
 * as an ordinary `open-mashaabim` with `source: stipend`. Everything after
 * that — search, matching, the askm, the vote, joining the rikma — is the
 * ordinary resource path, and that is the point.
 *
 * What the ordinary path cannot know is that this particular resource **is**
 * a stipend. Left to itself it did what it does for any recurring resource:
 * built a second `mashabetahalich` beside the pledge's own, opened a monthly
 * Maap on it, and asked the funder to type this month's spend into a free
 * amount field — a number with no mission attached, no hours behind it, and
 * (once approved) a `Rikmash` crediting the funder a second time for money
 * the stipend ledger already credits. The funder had taken on a stipend and
 * been handed an electricity bill.
 *
 * So the acceptance passes through here first. Binding is: the program gets
 * its funder, every funderless pledge under it gets the same funder and starts
 * running, and each one gets the pledge engine the decision path would have
 * built. From there the funder's card is the ordinary `StipendPayCard` —
 * derived amount, approved hours, the mission they were worked on — and no
 * amount is ever typed.
 */

import { fields, gqlStr, run, strField, type Exec } from '$lib/server/archive/gql.js';
import { ensurePledgeEngine } from './apply.js';
import { fetchProgram, toPledge, type StipendPledgeRow } from './read.js';

export interface StipendRequestInfo {
  /** The open-mashaabim is a stipend funding request. */
  isStipendRequest: boolean;
  programId: string | null;
}

/**
 * Is this open resource a stipend funding request, and which program does it
 * fund? Read before the acceptance branches, so a plain resource costs one
 * cheap query and nothing else changes for it.
 */
export async function readStipendRequest(
  exec: Exec,
  openMashaabimId: string
): Promise<StipendRequestInfo> {
  const data = await run(
    exec,
    `{ openMashaabim(id: ${gqlStr(openMashaabimId)}) { data { attributes {
      source
      stipend_program { data { id } }
    } } } }`,
    'readStipendRequest'
  ).catch(() => null);
  const a = data?.openMashaabim?.data?.attributes;
  if (!a) return { isStipendRequest: false, programId: null };
  const programId = a.stipend_program?.data?.id ? String(a.stipend_program.data.id) : null;
  return { isStipendRequest: a.source === 'stipend' || !!programId, programId };
}

export interface BindStipendFunderResult {
  bound: boolean;
  programId: string | null;
  /** Pledges that now name this funder. */
  pledgeIds: string[];
  /** Of those, the ones that also have a recipient and are now running. */
  activatedPledgeIds: string[];
}

/**
 * Make the taker of a funding request the funder of its program and pledges.
 *
 * Idempotent and defensive: a program that already has a funder keeps it (two
 * people can take two funding requests of the same rikma), and a pledge that
 * already names someone else is left alone rather than reassigned. Nothing
 * here throws — a failure to bind must not undo an acceptance that already
 * added the person to the rikma; it leaves the stipend unfunded, which is a
 * state the system already knows how to show.
 */
export async function bindStipendFunder(
  exec: Exec,
  args: { openMashaabimId: string; funderId: string; programId?: string | null }
): Promise<BindStipendFunderResult> {
  const empty: BindStipendFunderResult = {
    bound: false,
    programId: null,
    pledgeIds: [],
    activatedPledgeIds: []
  };
  const funderId = String(args.funderId ?? '');
  if (!funderId) return empty;

  let programId = args.programId ?? null;
  if (!programId) {
    const info = await readStipendRequest(exec, args.openMashaabimId);
    if (!info.isStipendRequest) return empty;
    programId = info.programId;
  }
  if (!programId) return empty;

  const program = await fetchProgram(exec, programId).catch(() => null);
  if (!program) return empty;

  // The program's funder. `seekingFunder` comes down either way: the request
  // has been taken, whoever ends up paying.
  if (!program.funderId) {
    await run(
      exec,
      `mutation { updateStipendProgram(id: ${gqlStr(programId)}, data: { ${fields(
        strField('funder', funderId),
        'seekingFunder: false',
        program.status === 'proposed' ? 'status: active' : null
      )} }) { data { id } } }`,
      'bindFunder:program'
    ).catch((e) => console.warn('[stipend] binding the program funder failed:', e));
  } else if (program.seekingFunder) {
    await run(
      exec,
      `mutation { updateStipendProgram(id: ${gqlStr(programId)}, data: { seekingFunder: false }) { data { id } } }`,
      'bindFunder:program:flag'
    ).catch(() => {});
  }

  const pledges = await fetchProgramPledges(exec, programId);
  const pledgeIds: string[] = [];
  const activatedPledgeIds: string[] = [];

  for (const pledge of pledges) {
    if (pledge.funderId && pledge.funderId !== funderId) continue; // somebody else's
    // A pledge with a recipient can start running; one still waiting for a
    // taker of its open mission stays `proposed` until `carryStipendToMission`
    // fills the recipient in. An `active` pledge with nobody to pay would
    // enter the monthly settlement against nobody.
    const canRun = !!pledge.recipientId && pledge.status === 'proposed';
    const wrote = await run(
      exec,
      `mutation { updateStipendPledge(id: ${gqlStr(pledge.id)}, data: { ${fields(
        pledge.funderId ? null : strField('funder', funderId),
        canRun ? 'status: active' : null
      )} }) { data { id } } }`,
      'bindFunder:pledge'
    ).catch((e) => {
      console.warn('[stipend] binding a pledge funder failed:', e);
      return null;
    });
    if (!wrote) continue;
    pledgeIds.push(pledge.id);
    if (pledge.recipientId) {
      activatedPledgeIds.push(pledge.id);
      // The life-cycle carrier the decision path builds. Without it the pledge
      // still pays out — it just loses cycles, dormancy and "stop at the end
      // of the cycle" (see ensurePledgeEngine).
      await ensurePledgeEngine(exec, {
        pledgeId: pledge.id,
        projectId: pledge.projectId,
        funderId,
        name: program.name || 'מלגת קיום',
        why: null,
        terms: pledge.terms
      }).catch((e) => {
        console.warn('[stipend] building the pledge engine on binding failed:', e);
        return null;
      });
    }
  }

  return { bound: true, programId, pledgeIds, activatedPledgeIds };
}

/** Pledges filed under a program, whatever their funder. */
async function fetchProgramPledges(exec: Exec, programId: string): Promise<StipendPledgeRow[]> {
  const data = await run(
    exec,
    `{ stipendPledges(filters: { stipend_program: { id: { eq: ${gqlStr(programId)} } }, status: { in: ["proposed","active"] } }, pagination: { limit: 100 }) {
      data { id attributes {
        mode costShare equityMultiplier stipendRate monthlyCap totalCap paidTotal
        noticeCycles revenueTrigger recourse scope status descrip start end cycleSize
        lastSettledAt
        project { data { id attributes { projectName } } }
        stipend_program { data { id } }
        funder { data { id attributes { username } } }
        recipient { data { id attributes { username } } }
        mashabetahalich { data { id } }
        mesimabetahaliches { data { id attributes { name } } }
        open_missions { data { id attributes { name } } }
        matbea { data { id } }
        decision { data { id } }
      } } } }`,
    'bindFunder:pledges'
  ).catch(() => null);
  return ((data?.stipendPledges?.data ?? []).map(toPledge).filter(Boolean) as StipendPledgeRow[]) ?? [];
}
