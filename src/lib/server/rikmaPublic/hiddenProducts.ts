/**
 * The public rikma page and the products its sellers hid from the directory
 * (docs/inprogress/PLAN_RIKMA_VISIBILITY.md S2).
 *
 * `hideFromDiscovery` used to take a product out of `/gift` only; the rikma's
 * own page still listed it to everyone. Now a visitor who is not a member does
 * not see it there either — the product stays reachable by its own link, which
 * is what a seller who sells it only from their own site wants. A member still
 * sees it, marked, so the rikma's page never looks like the product vanished.
 */

type ProductNode = { id: string | number; attributes?: Record<string, unknown> };
type ProjectNode = {
  attributes?: {
    user_1s?: { data?: { id: string | number }[] };
    matanotofs?: { data?: ProductNode[] };
    [k: string]: unknown;
  };
  [k: string]: unknown;
};

export function isRikmaMember(projectData: ProjectNode | null | undefined, uid: unknown): boolean {
  if (uid == null || uid === '' || uid === false) return false;
  return (projectData?.attributes?.user_1s?.data ?? []).some((u) => String(u.id) === String(uid));
}

/** Ids out of a `rikmaHiddenProductIds` answer; null when the read failed. */
export function hiddenIdsOf(res: any): Set<string> | null {
  const rows = res?.data?.matanots?.data;
  if (!Array.isArray(rows)) return null;
  return new Set(rows.map((r: any) => String(r?.id)).filter((id: string) => id && id !== 'undefined'));
}

/**
 * The page's copy of the project: hidden products dropped for a non-member,
 * flagged `hiddenFromDiscovery` for a member. The input is not mutated.
 */
export function applyHiddenProducts<T extends ProjectNode>(
  projectData: T | null,
  hidden: Set<string> | null,
  isMember: boolean
): T | null {
  const list = projectData?.attributes?.matanotofs?.data;
  if (!projectData || !hidden || hidden.size === 0 || !Array.isArray(list)) return projectData;

  const data = isMember
    ? list.map((p) =>
        hidden.has(String(p.id)) ? { ...p, attributes: { ...(p.attributes ?? {}), hiddenFromDiscovery: true } } : p
      )
    : list.filter((p) => !hidden.has(String(p.id)));

  return {
    ...projectData,
    attributes: {
      ...projectData.attributes,
      matanotofs: { ...projectData.attributes!.matanotofs, data }
    }
  };
}
