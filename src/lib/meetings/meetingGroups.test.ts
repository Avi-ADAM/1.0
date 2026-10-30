import { describe, it, expect } from 'vitest';
import { buildMeetingGroups } from './meetingGroups.js';

const user = (id: number, username: string) => ({ id: String(id), attributes: { username } });
const role = (id: number, roleDescription: string) => ({ id: String(id), attributes: { roleDescription } });
const mission = (id: number, name: string, holder: any, roles: any[] = []) => ({
  id: String(id),
  attributes: {
    name,
    users_permissions_user: { data: holder },
    tafkidims: { data: roles }
  }
});

describe('buildMeetingGroups', () => {
  it('collects members, mission holders and role holders', () => {
    const groups = buildMeetingGroups({
      user_1s: { data: [user(1, 'dana'), user(2, 'omer'), user(3, 'lior')] },
      mesimabetahaliches: {
        data: [
          mission(10, 'Logo', user(1, 'dana'), [role(7, 'Designer')]),
          mission(11, 'Website', user(2, 'omer'), [role(7, 'Designer'), role(8, 'Developer')]),
          mission(12, 'Icons', user(1, 'dana'), [role(7, 'Designer')])
        ]
      }
    });

    expect(groups.all).toEqual(['1', '2', '3']);
    expect(groups.missions.map((m) => m.name)).toEqual(['Icons', 'Logo', 'Website']);
    expect(groups.missions.find((m) => m.id === '11')).toMatchObject({ holderId: '2', holderName: 'omer' });
    expect(groups.roles).toEqual([
      { id: '7', name: 'Designer', ids: ['1', '2'] },
      { id: '8', name: 'Developer', ids: ['2'] }
    ]);
  });

  it('skips a mission nobody holds and a role with no name', () => {
    const groups = buildMeetingGroups({
      user_1s: { data: [] },
      mesimabetahaliches: { data: [mission(1, 'Orphan', null, [role(1, 'X')]), mission(2, 'Held', user(5, 'a'), [role(2, '')])] }
    });
    expect(groups.missions.map((m) => m.id)).toEqual(['2']);
    expect(groups.roles).toEqual([]);
  });

  it('survives an empty answer', () => {
    expect(buildMeetingGroups(undefined)).toEqual({ all: [], roles: [], missions: [] });
  });
});
