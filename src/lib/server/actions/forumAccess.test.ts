import { describe, expect, it } from 'vitest';
import { normalizeForum, userCanAccessForum } from './forumAccess';

function user(id: string, username = `user-${id}`) {
  return { id, attributes: { username } };
}

function project(id: string, memberIds: string[]) {
  return {
    id,
    attributes: {
      projectName: `project-${id}`,
      profilePic: { data: null },
      user_1s: { data: memberIds.map((memberId) => user(memberId)) }
    }
  };
}

function forum(id: string, attributes: Record<string, any>) {
  return {
    id,
    attributes: {
      subject: 'Forum',
      updatedAt: '2026-05-13T10:00:00.000Z',
      messages: { data: [] },
      ...attributes
    }
  };
}

describe('forumAccess', () => {
  it('allows project members to access project forums', () => {
    const entity = forum('10', {
      project: { data: project('1', ['1', '2']) }
    });

    expect(userCanAccessForum(entity, '1')).toBe(true);
    expect(userCanAccessForum(entity, '3')).toBe(false);
  });

  it('allows only sender and receiver to access haluka forums', () => {
    const entity = forum('11', {
      project: { data: project('1', ['9']) },
      haluka: {
        data: {
          id: '5',
          attributes: {
            amount: 100,
            usersend: { data: user('1') },
            userrecive: { data: user('2') },
            project: { data: project('1', ['9']) }
          }
        }
      }
    });

    expect(userCanAccessForum(entity, '1')).toBe(true);
    expect(userCanAccessForum(entity, '2')).toBe(true);
    expect(userCanAccessForum(entity, '9')).toBe(false);
  });

  it('allows meeting participants to access meeting forums', () => {
    const entity = forum('12', {
      pgisha: {
        data: {
          id: '7',
          attributes: {
            name: 'Sync',
            pgishausers: {
              data: [
                { id: 'p1', attributes: { users_permissions_user: { data: user('1') } } },
                { id: 'p2', attributes: { users_permissions_user: { data: user('2') } } }
              ]
            }
          }
        }
      }
    });

    expect(userCanAccessForum(entity, '2')).toBe(true);
    expect(userCanAccessForum(entity, '3')).toBe(false);
  });

  it('allows ask owner and project members to access ask forums', () => {
    const entity = forum('13', {
      asks: {
        data: [
          {
            id: '3',
            attributes: {
              users_permissions_user: { data: user('8') },
              project: { data: project('1', ['1']) }
            }
          }
        ]
      }
    });

    expect(userCanAccessForum(entity, '8')).toBe(true);
    expect(userCanAccessForum(entity, '1')).toBe(true);
    expect(userCanAccessForum(entity, '2')).toBe(false);
  });

  it('normalizes forum links and message ownership', () => {
    const entity = forum('14', {
      project: { data: project('1', ['1']) },
      messages: {
        data: [
          {
            id: 'm1',
            attributes: {
              content: 'hello',
              when: '2026-05-13T10:00:00.000Z',
              users_permissions_user: { data: user('1', 'Bar') }
            }
          }
        ]
      }
    });

    const normalized = normalizeForum(entity, '1');

    expect(normalized?.href).toBe('/forum/14');
    expect(normalized?.lastMessage?.message).toBe('hello');
    expect(normalized?.lastMessage?.sentByMe).toBe(true);
  });
});
