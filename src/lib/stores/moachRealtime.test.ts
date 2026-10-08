import { describe, it, expect } from 'vitest';
import { sectionsForNotification, notificationProjectId, moachBaseKey } from './moachRealtime.js';

describe('sectionsForNotification', () => {
  it('refreshes every section for a vote — a consensus can change any of them', () => {
    expect(sectionsForNotification('pmashVote')).toEqual(['base', 'missions', 'financials']);
    expect(sectionsForNotification('voteUpdate')).toEqual(['base', 'missions', 'financials']);
  });

  it('passes a type that is itself a section straight through', () => {
    expect(sectionsForNotification('financials')).toEqual(['financials']);
    expect(sectionsForNotification('base')).toEqual(['base']);
  });

  it('falls back to base + missions for types that are not sections', () => {
    // These used to reach moachStore.invalidate as-is and change nothing.
    expect(sectionsForNotification('sheirutUpdate')).toEqual(['base', 'missions']);
    expect(sectionsForNotification('ratsonProposal')).toEqual(['base', 'missions']);
    expect(sectionsForNotification(undefined)).toEqual(['base', 'missions']);
  });
});

describe('notificationProjectId', () => {
  it('reads the rikma from the params first, then from the data', () => {
    expect(notificationProjectId({ actionParams: { projectId: 12 } })).toBe('12');
    expect(notificationProjectId({ data: { projectId: '7' } })).toBe('7');
  });

  it('is null when the notification names no rikma', () => {
    expect(notificationProjectId({ actionParams: {} })).toBeNull();
    expect(notificationProjectId({ actionParams: { projectId: '' } })).toBeNull();
    expect(notificationProjectId(null)).toBeNull();
  });
});

it('moachBaseKey is a scheme-prefixed kit dependency', () => {
  expect(moachBaseKey(5)).toBe('app:moach:5');
});
