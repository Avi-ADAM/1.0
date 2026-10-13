/**
 * Action: Path D (mission) — a rikma member takes an open mission on customized
 * terms. Behaviorally identical to proposeOnOpenMission: the SHARED handler checks
 * membership server-side and routes (member → project round + clock now;
 * non-member → candidate round + deferred clock). Kept as a distinct key for
 * clients that semantically mean "customize", but the key never changes the
 * outcome — the server decides from actual membership.
 */

import { noticeSubject } from '$lib/notices/links';
import type { ActionConfig } from '../types.js';
import { openMissionProposalHandler } from './proposeOnOpenMission.js';
import { scope, decisionScope, scopeList } from '$lib/realtime/scopes.js';

export const customizeOpenMissionConfig: ActionConfig = {
  key: 'customizeOpenMission',
  description:
    'Take an open mission on customized terms (Path D). Shares proposeOnOpenMission\'s server-side membership routing - the key is semantic only.',
  graphqlOperation: openMissionProposalHandler,

  paramSchema: {
    openMissionId: { type: 'string', required: true },
    projectId: { type: 'string', required: false },
    newValues: {
      type: 'object',
      required: false,
      description: 'Customized terms: name, descrip, hearotMeyuchadot, noofhours, perhour, skillIds, roleIds, workwayIds, sqadualed, dates, location',
    },
  },

  authRules: [{ type: 'jwt' }],

  notification: {
    recipients: { type: 'specificUsers', config: { userIdsParam: 'recipientIds' } },
    templates: {
      title: { he: 'התאמה אישית למשימה', en: 'Customized mission terms' },
      body: { he: 'חבר רקמה לקח משימה בתנאים מותאמים', en: 'A member took a mission on customized terms' },
    },
    intent: 'consent',
    subject: (p, r) => noticeSubject('ask', r?.data?.askId, p.projectId),
    metadata: { type: 'missionApplication', url: 'lev' },
  },

  updateStrategy: { type: 'none' },

  realtime: {
    scopes: (p, r) =>
      scopeList([scope('project', p.projectId), scope('mission', p.openMissionId), decisionScope('ask', r?.data?.askId)]),
  },
};
