/**
 * What the GitHub routes share: the service-token action context and the
 * membership check. Both routes act for a member only after GitHub or the
 * signed JWT has vouched for them, so the writes run with the service token.
 */

import { env } from '$env/dynamic/private';
import { strapiClient } from '$lib/server/actions/index.js';
import type { ActionContext } from '$lib/server/actions/types.js';

export function adminToken(): string {
  return (env.ADMINMONTHER ?? '').replace(/\s+/g, '').replace(/^ADMINMONTHER=/, '');
}

export function serviceContext(userId: string, fetchFn: typeof fetch): ActionContext {
  return { userId: String(userId), jwt: adminToken(), lang: 'he', fetch: fetchFn };
}

export async function isProjectMember(projectId: string, uid: string, fetchFn: typeof fetch): Promise<boolean> {
  const res = await strapiClient.execute('githubProjectMembers', { pid: projectId }, adminToken(), fetchFn);
  const members: any[] = res?.data?.project?.data?.attributes?.user_1s?.data ?? [];
  return members.some((m) => String(m.id) === String(uid));
}
