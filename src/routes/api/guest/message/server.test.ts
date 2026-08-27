/**
 * The guest write path is the only way someone without an account can put a
 * row in the database, so its two gates are worth pinning down: the caller must
 * be the meetings server, and the forum must belong to the meeting the guest's
 * signed invitation names.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

const executeMock = vi.fn();
const notifyMock = vi.fn();
const isMeetingsRequestMock = vi.fn();
const verifyInviteTokenMock = vi.fn();

vi.mock('$env/static/private', () => ({ ADMINMONTHER: 'test-admin-token' }));
vi.mock('$lib/server/strapiUrl.js', () => ({
  STRAPI_URL: 'http://strapi.test',
  STRAPI_GRAPHQL: 'http://strapi.test/graphql'
}));
vi.mock('$lib/server/actions/StrapiClient.js', () => ({
  StrapiClient: class {
    execute = executeMock;
  }
}));
vi.mock('$lib/server/notifications/NotificationOrchestrator.js', () => ({
  NotificationOrchestrator: class {
    notify = notifyMock;
  }
}));
vi.mock('$lib/server/meetingsProxy.js', () => ({
  isMeetingsRequest: (r: Request) => isMeetingsRequestMock(r)
}));
vi.mock('$lib/server/guestInvite.js', () => ({
  verifyInviteToken: (t: unknown) => verifyInviteTokenMock(t)
}));

const { POST } = await import('./+server.js');

/** A meeting whose forum is id 7. */
function meetingWithForum(forumId: string | null, participants: string[] = ['11', '12']) {
  return {
    data: {
      pgisha: {
        data: {
          id: '42',
          attributes: {
            name: 'Standup',
            forum: forumId == null ? { data: null } : { data: { id: forumId } },
            pgishausers: {
              data: participants.map((id) => ({
                attributes: { users_permissions_user: { data: { id } } }
              }))
            }
          }
        }
      }
    }
  };
}

function call(body: Record<string, unknown>) {
  const request = new Request('http://localhost/api/guest/message', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  return POST({ request, fetch: globalThis.fetch } as any);
}

const goodBody = {
  inviteToken: 'signed.token',
  displayName: 'Dana',
  forumId: '7',
  content: 'hello everyone'
};

/** @returns the thrown SvelteKit error's status, or 0 if it resolved. */
async function statusOf(promise: Promise<unknown>) {
  try {
    await promise;
    return 0;
  } catch (e: any) {
    return e?.status ?? -1;
  }
}

describe('POST /api/guest/message', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    isMeetingsRequestMock.mockReturnValue(true);
    verifyInviteTokenMock.mockReturnValue({
      valid: true,
      payload: { meetingId: '42', email: 'g@x.com', meetingName: 'Standup', expiresAt: '' }
    });
    executeMock.mockImplementation(async (qid: string) => {
      if (qid === '59GetMeetingDetails') return meetingWithForum('7');
      if (qid === '1chatsendGuest') return { data: { createMessage: { data: { id: '99' } } } };
      throw new Error('unexpected qid ' + qid);
    });
    notifyMock.mockResolvedValue(undefined);
  });

  it('refuses a caller that is not the meetings server', async () => {
    isMeetingsRequestMock.mockReturnValue(false);
    expect(await statusOf(call(goodBody))).toBe(401);
    expect(executeMock).not.toHaveBeenCalled();
  });

  it('refuses an invalid or expired invitation', async () => {
    verifyInviteTokenMock.mockReturnValue({ valid: false, error: 'expired' });
    expect(await statusOf(call(goodBody))).toBe(403);
    expect(executeMock).not.toHaveBeenCalled();
  });

  it('refuses a forum that belongs to a different meeting', async () => {
    // The invitation pins meeting 42, whose forum is 7. Asking to post into
    // forum 8 must not work just because the caller said so.
    executeMock.mockImplementation(async (qid: string) => {
      if (qid === '59GetMeetingDetails') return meetingWithForum('7');
      throw new Error('should not reach ' + qid);
    });
    expect(await statusOf(call({ ...goodBody, forumId: '8' }))).toBe(403);
    expect(executeMock).toHaveBeenCalledTimes(1);
  });

  it('takes the meeting from the signed token, not from the request body', async () => {
    await call({ ...goodBody, meetingId: '999' });
    const [qid, vars] = executeMock.mock.calls[0];
    expect(qid).toBe('59GetMeetingDetails');
    expect(vars).toEqual({ id: '42' });
  });

  it('writes the message with the guest name and no user relation', async () => {
    const response = await call(goodBody);
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ success: true, messageId: '99' });

    const [qid, vars] = executeMock.mock.calls[1];
    expect(qid).toBe('1chatsendGuest');
    expect(vars).toMatchObject({ fid: '7', fidn: 7, mes: 'hello everyone', guestName: 'Dana' });
    expect(vars).not.toHaveProperty('idL');
  });

  it('notifies the meeting participants and carries the meeting id for guests', async () => {
    await call(goodBody);
    const [config, params] = notifyMock.mock.calls[0];
    expect(params.participants).toEqual(['11', '12']);
    // metadata.meetingId is what routes this into the guest room downstream.
    expect(config.metadata.meetingId).toBe('42');
    expect(config.metadata.type).toBe('meetingMessage');
  });

  it('still reports success when the notification fails', async () => {
    // The row is already written; failing here would make the guest resend.
    notifyMock.mockRejectedValue(new Error('socket server down'));
    const response = await call(goodBody);
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ success: true });
  });

  it('rejects empty content before touching Strapi', async () => {
    expect(await statusOf(call({ ...goodBody, content: '   ' }))).toBe(400);
    expect(executeMock).not.toHaveBeenCalled();
  });
});
