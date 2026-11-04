/**
 * Action: releaseAssignedResource
 *
 * The other answers of a member a resource was offered to
 * (docs/inprogress/PLAN_RESOURCE_ASSIGNMENT.md), beside bringing it
 * (provideAssignedResource) and countering its terms (candidateCounterOnAskm):
 *
 *   - `withdraw` — "not me". Nobody vetoes anything here: it lifts an obligation
 *     off the person it was going to land on. The resource stays — it opens to
 *     everyone (archived:false, matched to whoever offers it), and whoever
 *     offers it goes through the rikma's vote as usual.
 *   - `reassign` — "rather them": the offer moves to another member, who
 *     answers it the same way (an Askm with no Sp, their silence not consent).
 *     The members voted on who brings it, so the vote starts over; the only yes
 *     carried is the passer's own, as a member.
 *
 * Only while unanswered (no Sp): once they chose what they bring they agreed,
 * and stepping back from a commitment is the archival flow (proposeObjectArchive).
 */

import { noticeSubject } from '$lib/notices/links';
import type { ActionConfig, ActionExecutionHandler } from '../types.js';
import { ActionError } from '../errors.js';
import { STRAPI_GRAPHQL } from '$lib/server/strapiUrl.js';
import { askmSpId } from '../../nego/askmAssigned.js';
import { cancelCandidacyTimegrama, ensureCandidacyTimegrama } from '../../nego/timegrama.js';
import { matchOpenMashaabimToUsers } from '$lib/server/matching/engine';
import { voteUrl } from './actionUtils.js';
import { scope, decisionScope, scopeList } from '$lib/realtime/scopes.js';

async function gql(f: typeof fetch, jwt: string, query: string, variables: Record<string, unknown>) {
  const res = await f(STRAPI_GRAPHQL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${jwt}` },
    body: JSON.stringify({ query, variables })
  });
  const json = await res.json();
  if (json.errors) throw new Error(json.errors[0].message);
  return json.data;
}

const READ = `query ReleaseAssignedRead($id: ID!) {
  askm(id: $id) { data { id attributes {
    archived
    users_permissions_user { data { id } }
    sp { data { id } }
    vots { what order users_permissions_user { data { id } } }
    project { data { id attributes { restime projectName user_1s { data { id attributes { username } } } } } }
    open_mashaabim { data { id attributes { name } } }
  } } }
}`;

const ARCHIVE_ASKM = `mutation ReleaseAssignedArchiveAskm($id: ID!) {
  updateAskm(id: $id, data: { archived: true }) { data { id } }
}`;

const REOPEN_OM = `mutation ReleaseAssignedReopen($id: ID!) {
  updateOpenMashaabim(id: $id, data: { archived: false }) { data { id } }
}`;

const CREATE_ASKM = `mutation ReleaseAssignedCreateAskm($data: AskmInput!) {
  createAskm(data: $data) { data { id } }
}`;

export type ReleaseMode = 'withdraw' | 'reassign';

const handler: ActionExecutionHandler = async (params, context, { strapi, notifier }) => {
  const { askmId, projectId, mode, toUserId } = params as {
    askmId: string;
    projectId: string;
    mode: ReleaseMode;
    toUserId?: string;
  };
  const why = typeof params.why === 'string' ? params.why.trim().slice(0, 500) : '';
  const f = context.fetch as typeof fetch;
  const jwt = context.jwt as string;
  const userId = String(context.userId);
  const now = new Date().toISOString();

  if (mode !== 'withdraw' && mode !== 'reassign') {
    throw new ActionError('VALIDATION_FAILED', 'mode is withdraw or reassign');
  }

  const read = await gql(f, jwt, READ, { id: String(askmId) });
  const attrs = read?.askm?.data?.attributes;
  if (!attrs) throw new ActionError('NOT_FOUND', `Askm ${askmId} not found`);
  if (attrs.archived === true) throw new ActionError('ALREADY_RESOLVED', `Askm ${askmId} was already resolved`);
  const project = attrs.project?.data;
  if (String(project?.id ?? '') !== String(projectId)) {
    throw new ActionError('FORBIDDEN', `Askm ${askmId} does not belong to project ${projectId}`);
  }
  if (String(attrs.users_permissions_user?.data?.id ?? '') !== userId) {
    throw new ActionError('FORBIDDEN', 'Only the member this resource was offered to can pass it on');
  }
  if (askmSpId(attrs)) {
    throw new ActionError(
      'ALREADY_RESOLVED',
      'You already chose what you bring — stepping back from it is a removal proposal (proposeObjectArchive)'
    );
  }

  const members: any[] = project?.attributes?.user_1s?.data ?? [];
  const nameOf = (id: string) => members.find((m) => String(m.id) === id)?.attributes?.username ?? '';
  const omId = attrs.open_mashaabim?.data?.id ? String(attrs.open_mashaabim.data.id) : null;
  const resourceName: string = attrs.open_mashaabim?.data?.attributes?.name ?? '';
  const projectName: string = project?.attributes?.projectName ?? '';
  const me = nameOf(userId);

  let target: string | null = null;
  if (mode === 'reassign') {
    target = toUserId != null ? String(toUserId) : '';
    if (!target || target === userId) {
      throw new ActionError('VALIDATION_FAILED', 'Choose another member to pass it to');
    }
    if (!members.some((m) => String(m.id) === target)) {
      throw new ActionError('NOT_MEMBER', 'It can be passed only to a member of this rikma');
    }
  }

  // The old offer ends either way: its clock and its card.
  await cancelCandidacyTimegrama(strapi, context, 'askm', String(askmId));
  await gql(f, jwt, ARCHIVE_ASKM, { id: String(askmId) });

  const others = members.map((m) => String(m.id)).filter((id) => id !== userId && id !== target);
  const whyHe = why ? ` הסיבה: "${why}".` : '';
  const whyEn = why ? ` Reason: "${why}".` : '';

  if (mode === 'withdraw') {
    if (omId) {
      await gql(f, jwt, REOPEN_OM, { id: omId });
      await matchOpenMashaabimToUsers(omId, 'resourceCreated', {
        strapi,
        fetch: context.fetch,
        lang: context.lang
      }).catch((e: unknown) => console.warn('[releaseAssignedResource] matching failed:', e));
    }
    if (notifier && others.length > 0) {
      notifier
        .notify(
          {
            recipients: { type: 'specificUsers', config: { userIdsParam: 'recipients' } },
            templates: {
              title: {
                he: `${me} לא יביא/תביא את המשאב "${resourceName}"`,
                en: `${me} will not bring the resource "${resourceName}"`
              },
              body: {
                he: `ברקמה "${projectName}" ${me} ויתר/ה על המשאב "${resourceName}" שהוצע לו/ה.${whyHe} המשאב פתוח עכשיו לכל מי שיכול להביא אותו, וכל הצעה תגיע אליכם להצבעה.`,
                en: `In "${projectName}", ${me} stepped back from the resource "${resourceName}" offered to them.${whyEn} It is now open to anyone who can bring it, and every offer comes to you for a vote.`
              }
            },
            intent: 'outcome',
            metadata: { type: 'base', url: `/moach/${projectId}` }
          },
          { recipients: others, projectId },
          { projectId, askmId },
          context
        )
        .catch((e: unknown) => console.warn('[releaseAssignedResource] withdraw notice failed:', e));
    }
    return {
      data: { askmId: String(askmId), mode, openMashaabimId: omId },
      updateStrategy: { type: 'refetchScope', config: { dataKeys: ['askedResources'], projectId: String(projectId) } }
    };
  }

  // reassign
  const created = await gql(f, jwt, CREATE_ASKM, {
    data: {
      publishedAt: now,
      project: String(projectId),
      ...(omId ? { open_mashaabim: omId } : {}),
      users_permissions_user: target,
      vots: [{ what: true, users_permissions_user: userId, order: 0 }]
    }
  });
  const newAskmId = created?.createAskm?.data?.id ? String(created.createAskm.data.id) : null;
  if (!newAskmId) throw new Error('Failed to pass the resource on');
  await ensureCandidacyTimegrama(strapi, context, {
    side: 'askm',
    id: newAskmId,
    projectId: String(projectId),
    restime: project?.attributes?.restime ?? undefined
  });

  if (notifier) {
    const targetName = nameOf(target as string);
    const url = voteUrl(String(projectId), 'askm', newAskmId);
    notifier
      .notify(
        {
          recipients: { type: 'specificUsers', config: { userIdsParam: 'recipients' } },
          templates: {
            title: {
              he: `${me} מציע/ה שדווקא את/ה תביא/י את "${resourceName}"`,
              en: `${me} suggests you bring "${resourceName}" instead`
            },
            body: {
              he: `ברקמה "${projectName}" המשאב "${resourceName}" הוצע ל${me}, ו${me} העביר/ה אותו אלייך.${whyHe} שום דבר לא נרשם על שמך בלי הסכמתך: בכרטיס בלב בוחרים אחד מהמשאבים שלך או יוצרים חדש ומאשרים, מדייקים את התנאים, מעבירים הלאה או מוותרים.`,
              en: `In "${projectName}" the resource "${resourceName}" was offered to ${me}, who passed it on to you.${whyEn} Nothing is registered under your name without your consent: on the card in your heart page you choose one of your resources or create one and approve, refine the terms, pass it on or step back.`
            }
          },
          intent: 'consent',
          subject: () => noticeSubject('askm', newAskmId, projectId),
          metadata: { type: 'voteUpdate', url, priority: 'high' }
        },
        { recipients: [target], projectId },
        { projectId, askmId: newAskmId },
        context
      )
      .catch((e: unknown) => console.warn('[releaseAssignedResource] reassign notice failed:', e));

    if (others.length > 0) {
      notifier
        .notify(
          {
            recipients: { type: 'specificUsers', config: { userIdsParam: 'recipients' } },
            templates: {
              title: {
                he: `המשאב "${resourceName}" עבר מ${me} אל ${targetName}`,
                en: `"${resourceName}" passed from ${me} to ${targetName}`
              },
              body: {
                he: `ברקמה "${projectName}" ${me} העביר/ה את המשאב "${resourceName}" אל ${targetName}.${whyHe} ההצבעה מתחילה מחדש - על המשאב ועל מי שמביא אותו - והיא ממתינה גם להסכמה המפורשת של ${targetName}. לחצו להצבעה.`,
                en: `In "${projectName}", ${me} passed the resource "${resourceName}" on to ${targetName}.${whyEn} The vote starts over - on the resource and on who brings it - and it awaits ${targetName}'s explicit consent too. Tap to vote.`
              }
            },
            intent: 'consent',
            subject: () => noticeSubject('askm', newAskmId, projectId),
            metadata: { type: 'voteUpdate', url }
          },
          { recipients: others, projectId },
          { projectId, askmId: newAskmId },
          context
        )
        .catch((e: unknown) => console.warn('[releaseAssignedResource] reassign member notice failed:', e));
    }
  }

  return {
    data: { askmId: String(askmId), mode, newAskmId, toUserId: target },
    updateStrategy: { type: 'refetchScope', config: { dataKeys: ['askedResources'], projectId: String(projectId) } }
  };
};

export const releaseAssignedResourceConfig: ActionConfig = {
  key: 'releaseAssignedResource',
  description:
    'A resource offered to you that you have not answered yet: step back from it (mode withdraw — it opens to everyone) or pass it to another member (mode reassign, toUserId — the vote starts over and they answer it).',
  graphqlOperation: handler,
  paramSchema: {
    askmId: { type: 'string', required: true, description: 'The Askm offered to you' },
    projectId: { type: 'string', required: true, description: 'The rikma' },
    mode: { type: 'string', required: true, description: 'withdraw | reassign' },
    toUserId: { type: 'string', required: false, description: 'reassign: the member to pass it to' },
    why: { type: 'string', required: false, description: 'A word to the rikma (optional)' }
  },
  authRules: [
    { type: 'jwt', errorMessage: 'You must be logged in' },
    {
      type: 'projectMember',
      config: { projectIdParam: 'projectId' },
      errorMessage: 'Only a member of this rikma can answer a resource offered in it'
    }
  ],
  updateStrategy: { type: 'none' },
  realtime: {
    scopes: (p, r) =>
      scopeList([
        scope('project', p.projectId),
        decisionScope('askm', p.askmId),
        r?.data?.newAskmId ? decisionScope('askm', r.data.newAskmId) : null,
        scope('resource', r?.data?.openMashaabimId)
      ]),
    partiesFrom: (p) => [p.toUserId]
  }
};
