// Who a golden meeting can be called with from inside a rikma, read from qid
// 466rikmaMeetingGroups: every member, the holders of each role, and the holder
// of each running mission.
//
// The viewer is never one of the people they meet: a meeting with yourself is
// not a meeting. Their own missions are dropped (and counted, so the menu can
// say why the list is empty), and a role only they hold is no group at all.

/**
 * @typedef {{ id: string, name: string, ids: string[] }} RoleGroup
 * @typedef {{ id: string, name: string, holderId: string, holderName: string }} MissionGroup
 * @typedef {{ all: string[], roles: RoleGroup[], missions: MissionGroup[], ownMissions: number }} MeetingGroups
 */

/**
 * @param {any} attrs - `project.data.attributes` of qid 466
 * @param {string|number|null} [selfId] - the viewer, left out of every group
 * @returns {MeetingGroups}
 */
export function buildMeetingGroups(attrs, selfId = null) {
  const self = selfId == null ? '' : String(selfId);
  const all = (attrs?.user_1s?.data ?? [])
    .map((/** @type {any} */ u) => String(u?.id ?? ''))
    .filter((/** @type {string} */ id) => id && id !== self);

  /** @type {Map<string, RoleGroup>} */
  const roles = new Map();
  /** @type {MissionGroup[]} */
  const missions = [];
  let ownMissions = 0;

  for (const m of attrs?.mesimabetahaliches?.data ?? []) {
    const holder = m?.attributes?.users_permissions_user?.data;
    if (!holder?.id) continue;
    const holderId = String(holder.id);
    if (holderId === self) {
      ownMissions++;
      continue;
    }

    missions.push({
      id: String(m.id),
      name: m.attributes?.name ?? '',
      holderId,
      holderName: holder.attributes?.username ?? ''
    });

    for (const r of m.attributes?.tafkidims?.data ?? []) {
      if (!r?.id) continue;
      const key = String(r.id);
      const group = roles.get(key) ?? { id: key, name: r.attributes?.roleDescription ?? '', ids: [] };
      if (!group.ids.includes(holderId)) group.ids.push(holderId);
      roles.set(key, group);
    }
  }

  const byName = (/** @type {{ name: string }} */ a, /** @type {{ name: string }} */ b) =>
    a.name.localeCompare(b.name);
  return {
    all,
    roles: [...roles.values()].filter((r) => r.name).sort(byName),
    missions: missions.sort(byName),
    ownMissions
  };
}
