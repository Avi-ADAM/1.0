import { describe, it, expect } from 'vitest';
import { goldenMeetingHref, inviteeIds, meetingsAppUrl, MAX_INVITEES } from './goldenMeeting.js';

describe('goldenMeetingHref', () => {
  it('opens a new meeting on the meetings app', () => {
    expect(goldenMeetingHref()).toBe('https://meetings.1lev1.com/meeting?new=1');
  });

  it('carries invitees and a title', () => {
    const url = new URL(goldenMeetingHref({ withIds: [12, '34'], title: 'Logo review' }));
    expect(url.searchParams.get('new')).toBe('1');
    expect(url.searchParams.get('with')).toBe('12,34');
    expect(url.searchParams.get('title')).toBe('Logo review');
  });

  it('encodes a Hebrew title so it survives the round trip', () => {
    const url = new URL(goldenMeetingHref({ title: 'פגישת זהב: עיצוב & לוגו' }));
    expect(url.searchParams.get('title')).toBe('פגישת זהב: עיצוב & לוגו');
  });

  it('drops a blank title', () => {
    expect(goldenMeetingHref({ title: '   ' })).not.toContain('title=');
  });
});

describe('inviteeIds', () => {
  it('keeps numeric ids only, once each', () => {
    expect(inviteeIds([1, '1', ' 2 ', null, undefined, 'x', '3;drop', 4])).toEqual(['1', '2', '4']);
  });

  it('caps the list', () => {
    const many = Array.from({ length: MAX_INVITEES + 10 }, (_, i) => i + 1);
    expect(inviteeIds(many)).toHaveLength(MAX_INVITEES);
  });
});

describe('meetingsAppUrl', () => {
  it('joins a path with or without a leading slash', () => {
    expect(meetingsAppUrl('meeting/7')).toBe('https://meetings.1lev1.com/meeting/7');
    expect(meetingsAppUrl('/meeting/7')).toBe('https://meetings.1lev1.com/meeting/7');
  });
});
