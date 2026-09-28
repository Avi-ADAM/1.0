/**
 * The global `Mission` collection is a catalogue of templates, and
 * `missionName` is unique in Strapi. A rikma's own mission (OpenMission,
 * Pendm, Mesimabetahalich) carries its own name and description and only
 * points at a template — so publishing a mission whose name is already in the
 * catalogue must reuse that template, not try to mint a second one.
 *
 * Minting blindly failed with "This attribute must be unique" whenever the
 * name existed: a form prepared by prepareMissionTool, a second attempt after
 * a half-finished first one, or two rikmas that both need "code review".
 */

interface StrapiLike {
  execute(
    queryId: string,
    variables: Record<string, any>,
    jwt?: string,
    fetchFn?: typeof globalThis.fetch
  ): Promise<any>;
}

export interface MissionTemplateInput {
  missionName: string;
  descrip?: string | null;
  skills?: string[];
  tafkidims?: string[];
  publishedAt?: string;
}

export interface MissionTemplateResult {
  id: string;
  /** false = an existing catalogue entry was reused. */
  created: boolean;
}

export async function findMissionTemplateId(
  strapi: StrapiLike,
  name: string,
  jwt?: string,
  fetchFn?: typeof globalThis.fetch
): Promise<string | null> {
  const res = await strapi.execute('261findMissionByName', { name }, jwt, fetchFn);
  const id = res?.data?.missions?.data?.[0]?.id;
  return id ? String(id) : null;
}

function isUniqueViolation(e: unknown): boolean {
  const errors: any[] = (e as any)?.errors ?? [];
  const texts = [String((e as any)?.message ?? ''), ...errors.map((x) => String(x?.message ?? ''))];
  return texts.some((m) => /must be unique/i.test(m));
}

export async function findOrCreateMissionTemplate(
  strapi: StrapiLike,
  input: MissionTemplateInput,
  jwt?: string,
  fetchFn?: typeof globalThis.fetch
): Promise<MissionTemplateResult> {
  const name = String(input.missionName ?? '').trim();
  if (!name) throw new Error('missionName is required');

  const existing = await findMissionTemplateId(strapi, name, jwt, fetchFn);
  if (existing) return { id: existing, created: false };

  try {
    const res = await strapi.execute(
      '21createMission',
      {
        missionName: name,
        descrip: input.descrip ?? null,
        skills: input.skills ?? [],
        tafkidims: input.tafkidims ?? [],
        publishedAt: input.publishedAt ?? new Date().toISOString()
      },
      jwt,
      fetchFn
    );
    const id = res?.data?.createMission?.data?.id;
    if (!id) throw new Error('Failed to create Mission entity');
    return { id: String(id), created: true };
  } catch (e) {
    // Someone minted the same name between the lookup and the create.
    if (!isUniqueViolation(e)) throw e;
    const raced = await findMissionTemplateId(strapi, name, jwt, fetchFn);
    if (raced) return { id: raced, created: false };
    throw e;
  }
}
