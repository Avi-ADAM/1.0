import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { actionService } from '$lib/server/actions/index.js';
import { githubWebhookSecret } from '$lib/server/github/config.js';
import { SIGNATURE_HEADER, verifyGithubSignature } from '$lib/server/github/signature.js';
import { classifyWebhook } from '$lib/server/github/events.js';
import { serviceContext } from '$lib/server/github/service.js';
import { notifyIssueClosed, syncIssueTask } from '$lib/server/github/issueSync.js';
import { notifyClaimableWork } from '$lib/server/github/pullSync.js';

/**
 * POST /api/v1/github/webhook — deliveries from the 1lev1 GitHub App
 * (PLAN_CODE_RIKMA §3.1). Set the App's webhook content type to
 * `application/json`.
 *
 * The signature is checked against the raw body before anything is parsed; an
 * unconfigured server answers 503 to every delivery. Every write goes through
 * an action. Events for later stages are acknowledged with 202 so GitHub does
 * not mark the App's deliveries as failing.
 */
export const POST: RequestHandler = async ({ request, fetch }) => {
  const secret = githubWebhookSecret();
  if (!secret) return json({ error: 'GitHub webhook is not configured' }, { status: 503 });

  const raw = await request.text();
  if (!verifyGithubSignature(raw, request.headers.get(SIGNATURE_HEADER), secret)) {
    return json({ error: 'Invalid signature' }, { status: 401 });
  }

  let payload: any;
  try {
    payload = JSON.parse(raw);
  } catch {
    return json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const event = request.headers.get('x-github-event');
  const delivery = request.headers.get('x-github-delivery') ?? '-';
  const intent = classifyWebhook(event, payload);
  const ctx = serviceContext('0', fetch);

  const fail = (what: string, err: unknown) => {
    console.error(`[github/webhook] ${what} failed (delivery ${delivery}):`, err);
    return json({ ok: false }, { status: 500 });
  };

  switch (intent.type) {
    case 'ping':
      return json({ ok: true });

    case 'ignored':
      return json({ ok: true, ignored: intent.reason }, { status: 202 });

    case 'installationStatus': {
      const res = await actionService.executeAction(
        'setGithubInstallationStatus',
        { installationId: intent.installationId, status: intent.status },
        ctx
      );
      return res.success ? json({ ok: true, ...res.data }) : fail('installation status', res.error);
    }

    case 'reposRemoved': {
      const res = await actionService.executeAction(
        'setGithubInstallationStatus',
        { installationId: intent.installationId, status: 'removed', repoIds: intent.repoIds },
        ctx
      );
      return res.success ? json({ ok: true, ...res.data }) : fail('repos removed', res.error);
    }

    case 'reposAdded':
      // Not attached. A repository joins a rikma only when a member picks it in
      // the code tab (/api/v1/github/pick). Granting the App more repositories
      // on GitHub — or "All repositories" — says nothing about which rikma, if
      // any, each of them belongs to.
      return json({ ok: true, ignored: 'repositories join a rikma only when a member picks them' }, { status: 202 });

    case 'issueTask':
      try {
        return json({ ok: true, ...(await syncIssueTask(intent.issue, fetch)) });
      } catch (err) {
        return fail('issue task', err);
      }

    case 'issueClosed':
      try {
        return json({ ok: true, ...(await notifyIssueClosed(intent.issue, fetch)) });
      } catch (err) {
        return fail('issue closed', err);
      }

    case 'claimableWork':
      try {
        return json({ ok: true, ...(await notifyClaimableWork(intent.work, fetch)) });
      } catch (err) {
        return fail('claimable work', err);
      }
  }
};
