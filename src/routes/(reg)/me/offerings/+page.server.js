import { sendToSer } from '$lib/send/sendToSer.js';

/**
 * /me/offerings — the expanded missions view behind the compact profile badge
 * (profile feedback 2026-07-13): priced offers (loaded client-side by the
 * editor) + missions in progress + completed missions with a rising ✓ count.
 */
export const load = async ({ locals, fetch }) => {
  const uid = locals.uid;

  let doing = [];
  let doneCounts = [];
  try {
    const res = await sendToSer({ uid: String(uid) }, '273myMissionsFull', 0, 0, false, fetch);
    doing = (res?.data?.doing?.data ?? []).map((n) => ({
      id: String(n.id),
      name: n.attributes?.name ?? '',
      hours: n.attributes?.hoursassinged ?? null,
      hoursDone: n.attributes?.howmanyhoursalready ?? null,
      projectId: n.attributes?.project?.data?.id ? String(n.attributes.project.data.id) : null,
      projectName: n.attributes?.project?.data?.attributes?.projectName ?? null
    }));

    // Completed missions aggregate to a verified ✓×N per mission name.
    const byName = new Map();
    for (const n of res?.data?.done?.data ?? []) {
      const name = n.attributes?.missionName ?? '';
      if (!name) continue;
      byName.set(name, (byName.get(name) ?? 0) + 1);
    }
    doneCounts = [...byName.entries()]
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  } catch (e) {
    console.warn('[me/offerings] missions load failed (non-fatal):', e);
  }

  return { uid, doing, doneCounts };
};
