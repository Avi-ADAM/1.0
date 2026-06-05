/**
 * Platform project / treasury resolution (server-side). See PLAN §2.
 *
 * The platform / "main rikma" is the Project flagged `isPlatform = true`
 * (schema field added in main). Because Haluka is user→user, the treasury
 * recipient of the site share is that project's first member (`user_1s[0]`).
 *
 * Two ways to resolve:
 *  - Static override via env (PLATFORM_PROJECT_ID / PLATFORM_TREASURY_USER_ID),
 *    useful for tests or to pin a specific treasury user.
 *  - Live query (`resolvePlatformProject`) against Strapi using `isPlatform`.
 */

import {
  SITE_SHARE_PLATFORM_PROJECT_ID,
  SITE_SHARE_TREASURY_USER_ID
} from '$lib/revenue/config.js';

function fromEnv(name: string): string {
  try {
    const v = typeof process !== 'undefined' ? process.env?.[name] : undefined;
    return (v ?? '').toString().trim();
  } catch {
    return '';
  }
}

/** Static platform project id from env/config, or '' when not pinned. */
export function getPlatformProjectIdStatic(): string {
  return fromEnv('PLATFORM_PROJECT_ID') || SITE_SHARE_PLATFORM_PROJECT_ID || '';
}

/** Static treasury user id from env/config, or '' when not pinned. */
export function getTreasuryUserIdStatic(): string {
  return fromEnv('PLATFORM_TREASURY_USER_ID') || SITE_SHARE_TREASURY_USER_ID || '';
}

export interface PlatformResolution {
  configured: boolean;
  projectId: string | null;
  treasuryUserId: string | null;
}

/**
 * Resolve the platform project and treasury recipient. Prefers static overrides;
 * otherwise queries the Project flagged `isPlatform = true` and uses its first
 * member. `strapi`/`jwt`/`fetch` mirror the action-handler context.
 */
export async function resolvePlatformProject(
  strapi: { execute: (qid: string, vars: any, jwt: string, fetch: any) => Promise<any> },
  jwt: string,
  fetchFn: any
): Promise<PlatformResolution> {
  const staticProject = getPlatformProjectIdStatic();
  const staticTreasury = getTreasuryUserIdStatic();
  if (staticTreasury) {
    return {
      configured: true,
      projectId: staticProject || null,
      treasuryUserId: staticTreasury
    };
  }

  const res = await strapi.execute('205getPlatformProject', {}, jwt, fetchFn);
  const node = res?.data?.projects?.data?.[0];
  const members = node?.attributes?.user_1s?.data ?? [];
  const treasuryUserId = members.length > 0 ? String(members[0].id) : null;

  return {
    configured: Boolean(treasuryUserId),
    projectId: node ? String(node.id) : staticProject || null,
    treasuryUserId
  };
}
