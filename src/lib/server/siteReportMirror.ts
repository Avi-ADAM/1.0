// src/lib/server/siteReportMirror.ts
//
// The two halves of the site-report ↔ central-rikma bridge
// (PLAN_EXTERNAL_TASKS_API §4):
//
//   mirrorSiteReport()        a report arrives → a task appears in rikma 1
//   syncSiteReportFromTask()  somebody accepts/finishes it → the report follows
//
// This is 1lev1 talking to itself, so it does NOT go out through
// /api/v1/tasks and an API key — it calls the same `createTask` action that
// endpoint calls, one layer down. The consent rule is identical either way:
// `myIshur:false` means the task is an offer until a member accepts it.
//
// Every function here is safe to call and forget. A report must be saved and
// acknowledged whether or not the rikma side worked.

import { env } from '$env/dynamic/private';
// Static import is safe despite this module being reached from the task-change
// hook: ActionService imports that hook *dynamically*, so the chain
// dispatch → siteReportMirror → actions/index has no back-edge at module init.
import { actionService, strapiClient } from '$lib/server/actions/index.js';
import type { ActionContext } from '$lib/server/actions/types.js';
import {
  DEFAULT_CENTRAL_PROJECT_ID,
  buildSiteReportTaskParams,
  reportStatusForTaskStatus,
  reportMovesForward,
  reportIdFromExternalId,
  type SiteReportInput
} from './siteReport.js';

/** The rikma that owns the platform itself. */
export function centralProjectId(): string {
  return String(env.SITE_REPORT_PROJECT_ID || DEFAULT_CENTRAL_PROJECT_ID);
}

/**
 * Who the mirrored task is filed by (`Act.vali`).
 *
 * `createTask` is gated on `projectMember`, so this has to be a real member of
 * the central rikma. `SITE_REPORT_TASK_CREATOR_ID` names one explicitly;
 * without it we take the rikma's first member, because "the platform filed it"
 * has no better representative and a missing env var should not silently turn
 * the whole feature off. Returns null only when the rikma has no members at
 * all — at which point there is nobody to hand the report to anyway.
 */
let creatorCache: { id: string | null; expiresAt: number } | null = null;
const CREATOR_TTL_MS = 10 * 60 * 1000;

async function resolveCreatorId(
  projectId: string,
  fetchFn: typeof globalThis.fetch,
  adminToken: string
): Promise<string | null> {
  const configured = env.SITE_REPORT_TASK_CREATOR_ID;
  if (configured) return String(configured);

  if (creatorCache && creatorCache.expiresAt > Date.now()) return creatorCache.id;

  let id: string | null = null;
  try {
    const res = await strapiClient.execute(
      'centralRikmaMembers',
      { pid: projectId },
      adminToken,
      fetchFn
    );
    const members: any[] = res?.data?.project?.data?.attributes?.user_1s?.data ?? [];
    id = members[0]?.id != null ? String(members[0].id) : null;
    if (!id) {
      console.warn(`[SiteReport] rikma ${projectId} has no members — nothing to mirror onto`);
    }
  } catch (e) {
    console.warn('[SiteReport] could not resolve a creator for the mirrored task:', e);
  }

  creatorCache = { id, expiresAt: Date.now() + CREATOR_TTL_MS };
  return id;
}

/** Test seam / used when the configuration changes under us. */
export function clearCreatorCache(): void {
  creatorCache = null;
}

/**
 * Optional routing, same shape as the external integrations: send it to a
 * person, or to a role, or leave it open for whoever picks it up.
 */
function routing() {
  const assignedUserId = env.SITE_REPORT_ASSIGNEE_ID || null;
  const roleId = env.SITE_REPORT_ROLE_ID || null;
  return {
    missionId: env.SITE_REPORT_MISSION_ID || null,
    assignedUserId,
    // A person wins over a role — `createTask` ignores roles once someone is named.
    roleIds: !assignedUserId && roleId ? [String(roleId)] : []
  };
}

/**
 * Open a task in the central rikma for a report that was just saved.
 * Resolves to the created task id, or null when nothing was created.
 */
export async function mirrorSiteReport(args: {
  report: SiteReportInput;
  reportId: string | number;
  adminToken: string;
  fetch: typeof globalThis.fetch;
  origin?: string;
}): Promise<string | null> {
  const { report, reportId, adminToken, fetch: fetchFn, origin } = args;
  if (reportId == null || reportId === '') return null;

  const projectId = centralProjectId();
  const creatorId = await resolveCreatorId(projectId, fetchFn, adminToken);
  if (!creatorId) return null;

  const params = buildSiteReportTaskParams({
    report,
    reportId,
    projectId,
    link: report.page ? (origin ? `${origin}${report.page}` : report.page) : null,
    ...routing()
  });

  const context: ActionContext = {
    userId: creatorId,
    jwt: adminToken,
    lang: 'he',
    fetch: fetchFn
  };

  try {
    const result = await actionService.executeAction('createTask', params, context);
    if (!result.success) {
      console.warn('[SiteReport] mirror failed:', result.error);
      return null;
    }
    const taskId = result.data?.id != null ? String(result.data.id) : null;
    console.log(`[SiteReport] report ${reportId} → task ${taskId} in rikma ${projectId}`);
    return taskId;
  } catch (e) {
    console.error('[SiteReport] mirror threw:', e);
    return null;
  }
}

/**
 * The report follows its task: accepted ⇒ in_review, done ⇒ resolved.
 *
 * Forward-only, so a member who un-accepts a task cannot un-resolve a report a
 * human already closed. Called from the task-change hook, never directly.
 */
export async function syncSiteReportFromTask(args: {
  externalId: string;
  taskStatus: string;
  fetch: typeof globalThis.fetch;
  strapi: { execute: (qid: string, vars: any, jwt: any, fetchFn: any) => Promise<any> };
}): Promise<void> {
  const { externalId, taskStatus, fetch: fetchFn, strapi } = args;

  const reportId = reportIdFromExternalId(externalId);
  if (!reportId) return;

  const next = reportStatusForTaskStatus(taskStatus);
  if (!next) return;

  try {
    const res = await strapi.execute('siteReportStatus', { id: reportId }, undefined, fetchFn);
    const current = res?.data?.siteReport?.data;
    if (!current?.id) return;
    if (!reportMovesForward(next, current.attributes?.status)) return;

    await strapi.execute(
      'updateSiteReportStatus',
      { id: reportId, status: next },
      undefined,
      fetchFn
    );
    console.log(`[SiteReport] report ${reportId} is now ${next}`);
  } catch (e) {
    console.warn('[SiteReport] status sync failed for report', reportId, e);
  }
}
