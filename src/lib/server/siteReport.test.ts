import { describe, it, expect } from 'vitest';
import {
  SITE_REPORT_PREFIX,
  externalIdFor,
  reportIdFromExternalId,
  urgencyForReportType,
  buildTaskName,
  buildTaskDescription,
  buildSiteReportTaskParams,
  reportStatusForTaskStatus,
  reportMovesForward
} from './siteReport.js';

describe('externalId round-trip', () => {
  it('builds and parses', () => {
    expect(externalIdFor(42)).toBe(`${SITE_REPORT_PREFIX}42`);
    expect(reportIdFromExternalId(externalIdFor(42))).toBe('42');
    expect(reportIdFromExternalId(externalIdFor('abc'))).toBe('abc');
  });

  it('rejects anything that is not one of ours', () => {
    expect(reportIdFromExternalId('ticket_42')).toBeNull();
    expect(reportIdFromExternalId(null)).toBeNull();
    expect(reportIdFromExternalId('')).toBeNull();
    // The prefix alone carries no id.
    expect(reportIdFromExternalId(SITE_REPORT_PREFIX)).toBeNull();
  });
});

describe('urgencyForReportType', () => {
  it('puts a breakage above a waiting human above an idea', () => {
    expect(urgencyForReportType('bug')).toBe('red');
    expect(urgencyForReportType('contact')).toBe('yellow');
    expect(urgencyForReportType('partnership')).toBe('yellow');
    expect(urgencyForReportType('feature')).toBe('green');
  });

  it('falls back to white for an unknown type', () => {
    expect(urgencyForReportType('something-else')).toBe('white');
    expect(urgencyForReportType(undefined)).toBe('white');
  });
});

describe('buildTaskName', () => {
  it('labels by type and takes the first line', () => {
    expect(buildTaskName({ type: 'bug', description: 'הכפתור לא נשמר\nובנוסף…' })).toBe(
      'תקלה באתר: הכפתור לא נשמר'
    );
  });

  it('survives an empty description', () => {
    expect(buildTaskName({ type: 'feature', description: '   ' })).toBe('הצעת שיפור');
    expect(buildTaskName({})).toBe('פנייה לצוות');
  });

  it('truncates a very long first line', () => {
    const name = buildTaskName({ type: 'bug', description: 'x'.repeat(500) });
    expect(name.length).toBeLessThanOrEqual('תקלה באתר: '.length + 100);
  });
});

describe('buildTaskDescription', () => {
  it('carries the context a handler needs', () => {
    const d = buildTaskDescription({
      description: 'לא נשמר',
      page: '/lev',
      lang: 'he',
      userId: '45',
      userName: 'dana',
      userEmail: 'dana@example.com'
    });
    expect(d).toContain('לא נשמר');
    expect(d).toContain('/lev');
    expect(d).toContain('משתמש רשום #45');
    expect(d).toContain('dana@example.com');
  });

  it('says "guest" when there is no user id', () => {
    const d = buildTaskDescription({ description: 'x' });
    expect(d).toContain('אורח');
    expect(d).not.toContain('משתמש רשום');
  });

  it('is bounded', () => {
    expect(buildTaskDescription({ description: 'x'.repeat(9000) }).length).toBeLessThanOrEqual(4000);
  });
});

describe('buildSiteReportTaskParams', () => {
  const base = { report: { type: 'bug', description: 'broken' }, reportId: '7', projectId: '1' };

  it('never pre-approves on anyone’s behalf', () => {
    expect(buildSiteReportTaskParams(base).myIshur).toBe(false);
  });

  it('marks the source and the external id', () => {
    const p = buildSiteReportTaskParams(base);
    expect(p.source).toBe('api');
    expect(p.externalId).toBe('sitereport_7');
    expect(p.projectId).toBe('1');
    expect(p.hashivut).toBe('red');
  });

  it('assigns to a person when one is given, and carries the mission', () => {
    const p = buildSiteReportTaskParams({ ...base, assignedUserId: '45', missionId: '456' });
    expect(p.isAssigned).toBe(true);
    expect(p.assignedUserId).toBe('45');
    expect(p.missionId).toBe('456');
    expect(p.tafkidims).toBeUndefined();
  });

  it('falls back to roles, and then drops the mission that has nobody to hold it', () => {
    const p = buildSiteReportTaskParams({ ...base, roleIds: ['3'], missionId: '456' });
    expect(p.isAssigned).toBe(false);
    expect(p.tafkidims).toEqual(['3']);
    expect(p.missionId).toBeUndefined();
  });

  it('leaves it open to the whole rikma when nothing is configured', () => {
    const p = buildSiteReportTaskParams(base);
    expect(p.isAssigned).toBe(false);
    expect(p.tafkidims).toBeUndefined();
    expect(p.assignedUserId).toBeUndefined();
  });

  it('prefers an explicit link over the reported page', () => {
    expect(buildSiteReportTaskParams({ ...base, link: '/admin/7' }).link).toBe('/admin/7');
    expect(
      buildSiteReportTaskParams({ ...base, report: { ...base.report, page: '/lev' } }).link
    ).toBe('/lev');
  });
});

describe('report status sync', () => {
  it('maps only the states that mean something here', () => {
    expect(reportStatusForTaskStatus('accepted')).toBe('in_review');
    expect(reportStatusForTaskStatus('done')).toBe('resolved');
    expect(reportStatusForTaskStatus('awaitingConsent')).toBeNull();
    expect(reportStatusForTaskStatus('open')).toBeNull();
    expect(reportStatusForTaskStatus(undefined)).toBeNull();
  });

  it('only ever moves forward', () => {
    expect(reportMovesForward('in_review', 'new')).toBe(true);
    expect(reportMovesForward('resolved', 'in_review')).toBe(true);
    expect(reportMovesForward('in_review', 'resolved')).toBe(false);
    expect(reportMovesForward('in_review', 'in_review')).toBe(false);
  });

  it('treats a missing current status as new', () => {
    expect(reportMovesForward('in_review', null)).toBe(true);
    expect(reportMovesForward('in_review', undefined)).toBe(true);
  });
});
