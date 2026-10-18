import { describe, expect, it, vi } from 'vitest';
import type { AssistantItem, AssistantState } from '$lib/assistant/types.js';
import { runMaterialization } from './materialize.js';

const item = (over: Partial<AssistantItem> & Pick<AssistantItem, 'key' | 'group' | 'label'>): AssistantItem => ({
  status: 'proposed',
  origin: 'agent',
  ...over
});

const newRikmaWithPartner: AssistantState = {
  fields: { track: 'partnership', name: 'Studio Gefen' },
  items: [
    item({
      key: 'mission',
      group: 'rikmaMissions',
      label: 'Design the identity',
      spec: { holder: 'partner', partnerKey: 'partner', hours: 8 }
    }),
    item({
      key: 'resource',
      group: 'rikmaResources',
      label: 'Camera',
      spec: { holder: 'partner', partnerKey: 'partner', quantity: 1 }
    }),
    item({ key: 'partner', group: 'partners', label: 'Dana', spec: { email: 'dana@example.com' } })
  ]
};

describe('runMaterialization partner invitations', () => {
  it('invites the named partner to the newly-created open mission and resource', async () => {
    const invitePartner = vi.fn(async (_email, _targets, _projectName, _projectId) => ({
      result: 'notRegistered',
      created: 0,
      emailStatus: 'sent' as const,
      joinUrl: 'https://www.1lev1.com/project/77/join'
    }));
    const runAction = vi.fn(async (key: string) => {
      if (key === 'createWeave') return { success: true, data: { projectId: '77' } };
      if (key === 'createMission') {
        return { success: true, data: { createdEntityId: '51', createdEntityType: 'openMission' } };
      }
      if (key === 'createResource') return { success: true, data: { id: '61' } };
      return { success: false, error: { message: `unexpected action ${key}` } };
    });

    const outcome = await runMaterialization(newRikmaWithPartner, ['mission', 'resource', 'partner'], { projectId: null, userId: '1' }, {
      runAction,
      resolveVallues: async () => ({ ids: [], newNames: [] }),
      resolveMissionVocab: async () => undefined,
      memberCount: async () => 1,
      projectName: async () => 'Studio Gefen',
      invitePartner,
      saveProgress: async () => {},
      leftoverTitle: 'More ideas',
      lang: 'en'
    });

    expect(invitePartner).toHaveBeenCalledOnce();
    expect(invitePartner).toHaveBeenCalledWith(
      'dana@example.com',
      {
        openMissions: [{ id: '51', name: 'Design the identity' }],
        openMashaabims: [{ id: '61', name: 'Camera' }]
      },
      'Studio Gefen',
      '77'
    );
    expect(outcome.invites).toEqual([
      {
        key: 'partner',
        result: 'notRegistered',
        joinUrl: 'https://www.1lev1.com/project/77/join',
        emailStatus: 'sent',
        created: 0
      }
    ]);
    const invitedPartner = outcome.state.items.find((row) => row.key === 'partner');
    expect(invitedPartner).toMatchObject({ status: 'applied', createdRef: { type: 'invite', id: 'dana@example.com' } });
  });

  it('still sends a general rikma invitation when a partner has no linked work rows', async () => {
    const state: AssistantState = {
      fields: { track: 'partnership', name: 'Studio Gefen' },
      items: [item({ key: 'partner', group: 'partners', label: 'Dana', spec: { email: 'dana@example.com' } })]
    };
    const invitePartner = vi.fn(async (_email, _targets, _projectName, _projectId) => ({
      result: 'invited',
      created: 0,
      emailStatus: 'sent' as const,
      joinUrl: 'https://www.1lev1.com/project/88/join'
    }));

    const outcome = await runMaterialization(state, ['partner'], { projectId: null, userId: '1' }, {
      runAction: async (key) =>
        key === 'createWeave'
          ? { success: true, data: { projectId: '88' } }
          : { success: false, error: { message: `unexpected action ${key}` } },
      resolveVallues: async () => ({ ids: [], newNames: [] }),
      resolveMissionVocab: async () => undefined,
      memberCount: async () => 1,
      projectName: async () => 'Studio Gefen',
      invitePartner,
      saveProgress: async () => {},
      leftoverTitle: 'More ideas',
      lang: 'en'
    });

    expect(invitePartner).toHaveBeenCalledWith(
      'dana@example.com',
      { openMissions: [], openMashaabims: [] },
      'Studio Gefen',
      '88'
    );
    expect(outcome.invites[0]).toMatchObject({ result: 'invited', joinUrl: 'https://www.1lev1.com/project/88/join' });
  });

  it('leaves the partner retryable when a contribution card failed but the rikma email was sent', async () => {
    const invitePartner = vi.fn(async () => ({
      result: 'invited',
      created: 0,
      suggestionFailures: 1,
      emailStatus: 'sent' as const,
      joinUrl: 'https://www.1lev1.com/project/77/join'
    }));
    const runAction = vi.fn(async (key: string) => {
      if (key === 'createWeave') return { success: true, data: { projectId: '77' } };
      if (key === 'createMission') return { success: true, data: { createdEntityId: '51', createdEntityType: 'openMission' } };
      if (key === 'createResource') return { success: true, data: { id: '61' } };
      return { success: false, error: { message: 'unexpected action' } };
    });

    const outcome = await runMaterialization(newRikmaWithPartner, ['mission', 'resource', 'partner'], { projectId: null, userId: '1' }, {
      runAction,
      resolveVallues: async () => ({ ids: [], newNames: [] }),
      resolveMissionVocab: async () => undefined,
      memberCount: async () => 1,
      projectName: async () => 'Studio Gefen',
      invitePartner,
      saveProgress: async () => {},
      leftoverTitle: 'More ideas',
      lang: 'en'
    });

    expect(outcome.invites[0]).toMatchObject({ result: 'invited', suggestionFailures: 1, emailStatus: 'sent' });
    expect(outcome.state.items.find((row) => row.key === 'partner')?.status).toBe('proposed');
  });

  it('keeps the join link visible when an invitation email could not be delivered', async () => {
    const invitePartner = vi.fn(async () => ({
      result: 'emailFailed',
      created: 0,
      emailStatus: 'failed' as const,
      joinUrl: 'https://www.1lev1.com/project/77/join'
    }));
    const runAction = vi.fn(async (key: string) =>
      key === 'createWeave'
        ? { success: true, data: { projectId: '77' } }
        : { success: false, error: { message: 'unexpected action' } }
    );
    const state: AssistantState = {
      fields: { name: 'Studio Gefen' },
      items: [item({ key: 'partner', group: 'partners', label: 'Dana', spec: { email: 'dana@example.com' } })]
    };

    const outcome = await runMaterialization(state, ['partner'], { projectId: null, userId: '1' }, {
      runAction,
      resolveVallues: async () => ({ ids: [], newNames: [] }),
      resolveMissionVocab: async () => undefined,
      memberCount: async () => 1,
      projectName: async () => 'Studio Gefen',
      invitePartner,
      saveProgress: async () => {},
      leftoverTitle: 'More ideas',
      lang: 'en'
    });

    expect(outcome.invites[0]).toMatchObject({
      result: 'emailFailed',
      emailStatus: 'failed',
      joinUrl: 'https://www.1lev1.com/project/77/join'
    });
    expect(outcome.state.items.find((row) => row.key === 'partner')?.status).toBe('proposed');
  });
});
