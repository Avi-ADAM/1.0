import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { actionService, strapiClient } from '$lib/server/actions/index.js';
import { githubWebhookSecret } from '$lib/server/github/config.js';
import { SIGNATURE_HEADER, verifyGithubSignature } from '$lib/server/github/signature.js';
import { classifyWebhook } from '$lib/server/github/events.js';
import { adminToken, serviceContext } from '$lib/server/github/service.js';

/**
 * POST /api/v1/github/webhook — deliveries from the 1lev1 GitHub App
 * (PLAN_CODE_RIKMA §3.1). Set the App's webhook content type to
 * `application/json`.
 *
 * The signature is checked against the raw body before anything is parsed; an
 * unconfigured server answers 503 to every delivery. Every write goes through
 * a service-only action. Events for later stages are acknowledged with 202 so
 * GitHub does not mark the App's deliveries as failing.
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

    case 'reposAdded': {
      // The rikma is whichever one this installation was connected to through
      // the install callback. An installation nobody connected is left alone.
      let projectId: string | null = null;
      try {
        const rows = await strapiClient.execute(
          'githubReposByInstallation',
          { installationId: intent.installationId },
          adminToken(),
          fetch
        );
        const live = (rows?.data?.projectRepos?.data ?? []).find(
          (r: any) => r.attributes?.status !== 'removed' && r.attributes?.project?.data?.id
        );
        projectId = live ? String(live.attributes.project.data.id) : null;
      } catch (e) {
        return fail('installation lookup', e);
      }
      if (!projectId) {
        return json({ ok: true, ignored: 'installation is not connected to a rikma' }, { status: 202 });
      }
      const res = await actionService.executeAction(
        'syncProjectRepos',
        { projectId, installationId: intent.installationId, repos: intent.repos },
        ctx
      );
      return res.success ? json({ ok: true, ...res.data }) : fail('repos added', res.error);
    }
  }
};
