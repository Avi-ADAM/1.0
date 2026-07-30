import { describe, expect, it } from 'vitest';
import {
  EMPTY_EXTRAS,
  summarizePlanningExtras,
  summarizeSite,
  type PlanningExtras
} from './planningContext';

const extras: PlanningExtras = {
  ...EMPTY_EXTRAS,
  linkToWebsite: 'https://example.com',
  openResources: [{ id: '1', name: 'מצלמה', kindOf: 'equipment', price: 900 }],
  resourcesInProgress: [{ id: '2', name: 'סטודיו', kindOf: 'space', price: null }],
  missionsInProgress: [{ id: '3', name: 'תוכן לרשתות', holder: 'דנה', roles: ['מעצבת'] }],
  roles: [{ id: '4', name: 'מעצבת' }],
  workways: ['מרחוק']
};

describe('summarizePlanningExtras', () => {
  it('wraps every user-authored name in the untrusted delimiters', () => {
    const out = summarizePlanningExtras(extras, 'he');
    expect(out).toContain('<<<מצלמה · equipment · 900>>>');
    expect(out).toContain('<<<סטודיו · space>>>');
    expect(out).toContain('<<<תוכן לרשתות — דנה>>>');
    expect(out).toContain('<<<מעצבת>>>');
  });

  it('states the counts, including zero, so the model can reason about absence', () => {
    const out = summarizePlanningExtras(EMPTY_EXTRAS, 'en');
    expect(out).toMatch(/Open resources \(requested, not yet obtained\) \(0\): none/);
    expect(out).toMatch(/Missions in progress across the rikma \(0\): none/);
  });

  it('omits sections it has nothing for', () => {
    const out = summarizePlanningExtras(EMPTY_EXTRAS, 'en');
    expect(out).not.toContain('Roles defined');
    expect(out).not.toContain('Work ways');
  });
});

describe('summarizeSite', () => {
  it('marks the fetched page as external untrusted text', () => {
    const out = summarizeSite(
      { url: 'https://example.com/', ok: true, title: 'T', text: 'We build rooftop gardens.' },
      'en'
    );
    expect(out).toContain('https://example.com/');
    expect(out).toContain('untrusted');
    expect(out).toContain('<<<We build rooftop gardens.>>>');
  });

  it('renders nothing when the site was not read', () => {
    expect(summarizeSite(null, 'en')).toBe('');
    expect(summarizeSite({ url: 'u', ok: false, title: '', text: '', error: 'timeout' }, 'en')).toBe('');
    expect(summarizeSite({ url: 'u', ok: true, title: '', text: '' }, 'en')).toBe('');
  });
});
