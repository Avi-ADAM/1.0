/**
 * Checklist (acts) handling for negotiation rounds on an Ask.
 *
 * A counter-proposal may add, keep or drop checklist items. Those items must
 * survive the negotiation, but they must NOT be written onto the shared
 * OpenMission: several candidates negotiate the same open offer in parallel, so
 * one candidate's checklist would leak into everybody else's baseline (and into
 * the rikma's, if the offer is never taken). The negotiated list therefore
 * lives on the round itself (`Negopendmission.acts`), and acceptance copies the
 * winning round's list onto the materialized Mesimabetahalich.
 *
 * Rounds always carry the full proposed list (kept + newly created), never a
 * diff — so the reader can take `latest.acts` as the negotiated checklist and
 * fall back to the OpenMission baseline only when a round carries none.
 */

type StrapiExecutor = {
  execute: (
    queryId: string,
    variables: Record<string, unknown>,
    userJwt?: string,
    fetchFn?: typeof globalThis.fetch
  ) => Promise<any>;
};

type Ctx = { jwt?: string; fetch?: typeof globalThis.fetch; userId: string | number };

export interface NewAct {
  shem: string;
  des?: string | null;
  link?: string | null;
  dateS?: string | null;
  dateF?: string | null;
}

export interface RoundActsInput {
  projectId: string | number;
  /** Items the negotiator typed in this round (no id yet). */
  newActs?: NewAct[];
  /** Ids of the baseline/previous items the negotiator kept. */
  existingActsIds?: Array<string | number>;
}

function isoOrNull(v: unknown): string | null {
  if (!v) return null;
  try {
    return new Date(String(v)).toISOString();
  } catch {
    return null;
  }
}

/**
 * Create the round's brand-new checklist items and return the full list of act
 * ids the round proposes (kept + created). Returns `[]` when the negotiator
 * proposes an empty checklist. Act creation is best-effort per item: one bad
 * row must not sink the counter-proposal.
 */
export async function buildRoundActs(
  strapi: StrapiExecutor,
  context: Ctx,
  { projectId, newActs = [], existingActsIds = [] }: RoundActsInput
): Promise<string[]> {
  const nowISO = new Date().toISOString();
  const createdIds: string[] = [];

  for (const act of newActs) {
    if (!act?.shem) continue;
    const res = await strapi
      .execute(
        '4crtask',
        {
          pid: String(projectId),
          // Deliberately unlinked from pendm / open_mission / mesimabetahalich:
          // the item belongs to this round until (and unless) it is accepted.
          pendm: null,
          open_mission: null,
          mbId: null,
          assignedId: null,
          myIshur: null,
          shem: act.shem,
          des: act.des ?? null,
          link: act.link ?? null,
          dateS: isoOrNull(act.dateS),
          dateF: isoOrNull(act.dateF),
          askId: String(context.userId),
          publishedAt: nowISO,
        },
        context.jwt,
        context.fetch
      )
      .catch((e: unknown) => {
        console.warn('[roundActs] act creation failed:', e);
        return null;
      });
    const id = res?.data?.createAct?.data?.id;
    if (id) createdIds.push(String(id));
  }

  return [...existingActsIds.map(String), ...createdIds];
}

/**
 * The checklist a finalizer should hand to the Mesimabetahalich: the most
 * recent round that carries one, otherwise the OpenMission baseline.
 *
 * Not every round records a checklist — the candidate's first proposal has no
 * checklist UI, so those rounds arrive empty. Walking back to the last round
 * that *did* record one keeps a task added mid-negotiation from being dropped
 * by a later round that simply had nothing to say about the checklist.
 *
 * @param rounds the Ask's rounds, latest first (`ordern:desc`)
 * @param openMissionActs the offer's baseline checklist (Strapi relation payload)
 */
export function resolveAcceptedActs(rounds: any, openMissionActs: any): string[] {
  const list = Array.isArray(rounds) ? rounds : rounds?.data ?? [];
  for (const round of list) {
    const acts = (round?.attributes?.acts ?? round?.acts)?.data ?? [];
    if (acts.length > 0) return acts.map((a: any) => String(a.id));
  }
  return (openMissionActs?.data ?? []).map((a: any) => String(a.id));
}
