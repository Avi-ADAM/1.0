// src/lib/server/webhooks/dispatch.ts
//
// Outgoing task webhooks (PLAN_EXTERNAL_TASKS_API §1d).
//
// A task that entered the rikma from an external system carries an
// `externalId`; when a human then accepts, advances or finishes it, the system
// that opened it deserves to hear about it. This module is the whole of that
// path: decide the event, load the task's state once, sign, deliver, retry.
//
// It is fire-and-forget by construction. Nothing here may fail — or even slow
// down — the action that triggered it: a broken receiver on the other side of
// the internet is not a reason for a member's "done" click to error.

import type { ActionContext } from '$lib/server/actions/types.js';
import type { WebhookEvent } from '$lib/server/tasksApi.js';
import { toTaskStatusView } from '$lib/server/tasksApi.js';
import { webhookSecretForKey, signWebhookBody } from './secret.js';
import { getWebhookTargets, wants, type WebhookTarget } from './targets.js';

/** Action keys whose success can produce a task webhook. */
const WEBHOOK_ACTIONS = new Set(['createTask', 'updateTask']);

const MAX_ATTEMPTS = 3;
const BASE_BACKOFF_MS = 500;
const REQUEST_TIMEOUT_MS = 8000;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Which single event does this invocation represent?
 *
 * An update can flip several fields at once, so they are ranked by how much
 * the receiving system cares: finishing beats accepting beats being handed to
 * someone beats moving the progress bar. Returning null means "nothing worth
 * telling anyone about".
 */
export function eventForAction(
  actionKey: string,
  params: Record<string, any>
): WebhookEvent | null {
  if (actionKey === 'createTask') return 'task.created';
  if (actionKey !== 'updateTask') return null;

  if (params.naasa === true) return 'task.done';
  if (params.myIshur === true) return 'task.accepted';
  if (Array.isArray(params.uid) && params.uid.length > 0) return 'task.assigned';
  if (params.status != null) return 'task.progress';
  return null;
}

/**
 * The Act id this invocation touched. `createTask` returns the created row;
 * `updateTask` names it in the params.
 */
function actIdFor(actionKey: string, params: Record<string, any>, result: any): string | null {
  if (actionKey === 'createTask') {
    const id = result?.id ?? result?.data?.createAct?.data?.id;
    return id != null ? String(id) : null;
  }
  const id = params?.id;
  return id != null && String(id) !== '' ? String(id) : null;
}

async function postOnce(
  target: WebhookTarget,
  body: string,
  event: WebhookEvent,
  deliveryId: string,
  fetchFn: typeof globalThis.fetch
): Promise<number> {
  const signature = signWebhookBody(body, webhookSecretForKey(target.keyId));
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const res = await fetchFn(target.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': '1lev1-webhooks/1',
        'X-1lev1-Event': event,
        'X-1lev1-Delivery': deliveryId,
        'X-1lev1-Signature': signature
      },
      body,
      signal: controller.signal
    });
    return res.status;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Deliver to one target with bounded retries.
 * 4xx (other than 408/429) is the receiver telling us the request itself is
 * wrong — retrying that is pure noise, so only 5xx/timeouts are retried.
 */
async function deliver(
  target: WebhookTarget,
  body: string,
  event: WebhookEvent,
  deliveryId: string,
  fetchFn: typeof globalThis.fetch
): Promise<void> {
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      const status = await postOnce(target, body, event, deliveryId, fetchFn);
      if (status >= 200 && status < 300) return;
      const retryable = status >= 500 || status === 408 || status === 429;
      if (!retryable) {
        console.warn(`[webhooks] ${event} → ${target.url} refused with ${status}, not retrying`);
        return;
      }
      console.warn(`[webhooks] ${event} → ${target.url} got ${status} (attempt ${attempt}/${MAX_ATTEMPTS})`);
    } catch (e) {
      console.warn(`[webhooks] ${event} → ${target.url} failed (attempt ${attempt}/${MAX_ATTEMPTS}):`, e);
    }
    if (attempt < MAX_ATTEMPTS) await sleep(BASE_BACKOFF_MS * 2 ** (attempt - 1));
  }
  console.warn(`[webhooks] ${event} → ${target.url} gave up after ${MAX_ATTEMPTS} attempts`);
}

/**
 * Entry point called by ActionService after a successful action.
 *
 * Ordered cheapest-check-first so the common case (a rikma with no
 * integration) costs one Set lookup and one cached Map read:
 *   1. is this an action that can produce an event at all?
 *   2. does the rikma have any webhook target? (cached)
 *   3. only then load the task and see whether it came from an API.
 */
export async function dispatchTaskWebhook(opts: {
  actionKey: string;
  params: Record<string, any>;
  result: any;
  context: ActionContext;
  strapi: { execute: (qid: string, vars: any, jwt: any, fetchFn: any) => Promise<any> };
}): Promise<void> {
  const { actionKey, params, result, context, strapi } = opts;
  if (!WEBHOOK_ACTIONS.has(actionKey)) return;

  const event = eventForAction(actionKey, params);
  if (!event) return;

  const projectId = params?.projectId != null ? String(params.projectId) : '';
  if (!projectId) return;

  const fetchFn = context.fetch ?? globalThis.fetch;
  const targets = await getWebhookTargets(projectId, strapi, fetchFn);
  const interested = targets.filter((t) => wants(t, event));
  if (interested.length === 0) return;

  const actId = actIdFor(actionKey, params, result);
  if (!actId) return;

  let view;
  try {
    const res = await strapi.execute('tasksApiActStatus', { id: actId }, undefined, fetchFn);
    view = toTaskStatusView(res?.data?.act?.data);
  } catch (e) {
    console.warn('[webhooks] could not read act', actId, e);
    return;
  }
  // No externalId ⇒ this task was born in the app, not in someone's system.
  // There is nobody on the other side waiting to hear about it.
  if (!view?.externalId) return;

  const body = JSON.stringify({
    event,
    at: new Date().toISOString(),
    projectId,
    taskId: view.taskId,
    externalId: view.externalId,
    status: view.status,
    naasa: view.naasa,
    progress: view.progress,
    assignee: view.assignee
  });

  const deliveryId = `${actId}-${event}-${Date.now()}`;
  await Promise.all(interested.map((t) => deliver(t, body, event, deliveryId, fetchFn)));
}
