/**
 * A resource offered TO a member (createResource `assignedUserId`) — the
 * resource-side twin of an assigned mission (`open_mission.isRishon`).
 *
 * The Askm is created by someone else on the taker's behalf, and it carries no
 * `sp` yet: what the taker will bring is theirs to say, so they pick one of
 * their resources or create one as part of agreeing (provideAssignedResource).
 * Every other Askm is created by its candidate with their Sp on it
 * (createMashaabimRequest, proposeOnOpenMashaabim, nominateSelfResource, the
 * self-proposal in createResource), so "no sp" marks exactly these offers —
 * no extra field, nothing to migrate.
 *
 * Two consequences, both from "nothing is registered under a person's name
 * without their consent":
 *   - the taker never applied, so the bare baseline is not their yes
 *     (`takerApplied: false` for computeNegoGate / evaluateCandidacyVote) —
 *     silence is not consent;
 *   - there is nothing to bring until they choose, so it never materializes
 *     without an Sp, whoever votes.
 */

/** The Sp id on an Askm, however the read shaped the relation. */
export function askmSpId(attrs: any): string | null {
  const sp = attrs?.sp;
  const id = sp?.data?.id ?? sp?.id ?? (typeof sp === 'string' || typeof sp === 'number' ? sp : null);
  return id != null && String(id) !== '' ? String(id) : null;
}

/**
 * Did the taker put this Askm on the table themselves? False for a resource
 * assigned to them that they have not answered yet.
 */
export function askmTakerApplied(attrs: any): boolean {
  return askmSpId(attrs) != null;
}
