/**
 * Ivory Tower (מגדל השן) — the sister argument-map site, its own repo and DB
 * (docs/tbd/PLAN_ARGUMENT_MAP.md). A rikma may hold a space there; the moach
 * library tab shows the rikma's spaces, or a way to open the first one.
 *
 * Asked with the member's own `jwt`, so a members-only space comes back only to
 * a member, by the Tower's own rule. Any failure is `null` ("could not ask"),
 * never `[]` — an outage must not tell members their rikma has no space.
 */

export const IVORY_TOWER_DEFAULT_URL = 'https://ivory-tower.1lev1.com';

export interface TowerSpace {
	slug: string;
	title: string;
	visibility: 'public' | 'members';
	nodeCount: number;
}

export function towerBase(raw: string | undefined): string {
	return (raw?.trim() || IVORY_TOWER_DEFAULT_URL).replace(/\/+$/, '');
}

/** Only well-formed rows; the Tower is another service and its answer is data. */
export function parseTowerSpaces(body: unknown): TowerSpace[] | null {
	const list = (body as { spaces?: unknown } | null)?.spaces;
	if (!Array.isArray(list)) return null;
	return list
		.filter((s) => s && typeof s.slug === 'string' && /^[a-z0-9][a-z0-9-]{1,62}$/.test(s.slug))
		.map((s) => ({
			slug: s.slug,
			title: typeof s.title === 'string' && s.title.trim() ? s.title.slice(0, 200) : s.slug,
			visibility: s.visibility === 'members' ? 'members' : 'public',
			nodeCount: Number.isFinite(s.nodeCount) ? Number(s.nodeCount) : 0
		}));
}

export async function rikmaTowerSpaces(
	base: string,
	projectId: string,
	jwt: string | undefined,
	fetchFn: typeof fetch = fetch,
	timeoutMs = 2500
): Promise<TowerSpace[] | null> {
	try {
		const res = await fetchFn(`${base}/api/rikma/${encodeURIComponent(projectId)}/spaces`, {
			headers: jwt ? { cookie: `jwt=${jwt}` } : {},
			signal: AbortSignal.timeout(timeoutMs)
		});
		if (!res.ok) return null;
		return parseTowerSpaces(await res.json());
	} catch {
		return null;
	}
}
