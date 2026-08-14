import { describe, it, expect } from 'vitest';
import {
  htmlToPlainText,
  actRoleNames,
  buildPublishAsMissionUrl,
  isLinkableMissionType,
  ACT_MISSION_RELATION
} from './publishAsMission.js';

describe('htmlToPlainText', () => {
  it('strips TipTap markup down to readable text', () => {
    expect(htmlToPlainText('<p>לתקן את <strong>הכפתור</strong></p>')).toBe('לתקן את הכפתור');
  });

  it('keeps block boundaries as newlines', () => {
    expect(htmlToPlainText('<p>שורה א</p><p>שורה ב</p>')).toBe('שורה א\nשורה ב');
    expect(htmlToPlainText('<li>א</li><li>ב</li>')).toBe('א\nב');
    expect(htmlToPlainText('א<br>ב')).toBe('א\nב');
  });

  it('decodes entities without letting escaped markup become tags', () => {
    // `&amp;lt;b&amp;gt;` is a literal "&lt;b&gt;" in the source. Decoding
    // `&amp;` first would turn it into `&lt;b&gt;` → `<b>` → a stripped tag.
    expect(htmlToPlainText('<p>&amp;lt;b&amp;gt;</p>')).toBe('&lt;b&gt;');
    expect(htmlToPlainText('<p>a &amp; b</p>')).toBe('a & b');
    expect(htmlToPlainText('<p>&quot;x&quot;</p>')).toBe('"x"');
  });

  it('collapses the whitespace TipTap leaves behind', () => {
    expect(htmlToPlainText('<p>a</p><p></p><p></p><p>b</p>')).toBe('a\n\nb');
    expect(htmlToPlainText('<p>a&nbsp;&nbsp;&nbsp;b</p>')).toBe('a b');
  });

  it('returns an empty string for empty input', () => {
    expect(htmlToPlainText(null)).toBe('');
    expect(htmlToPlainText(undefined)).toBe('');
    expect(htmlToPlainText('')).toBe('');
  });
});

describe('actRoleNames', () => {
  const row = {
    tafkidims: {
      data: [
        {
          id: '1',
          attributes: {
            roleDescription: 'Designer',
            localizations: { data: [{ attributes: { roleDescription: 'מעצב' } }] }
          }
        },
        { id: '2', attributes: { roleDescription: 'Developer' } }
      ]
    }
  };

  it('prefers the Hebrew localization for he', () => {
    expect(actRoleNames(row, 'he')).toEqual(['מעצב', 'Developer']);
  });

  it('uses the default-locale name for other languages', () => {
    expect(actRoleNames(row, 'en')).toEqual(['Designer', 'Developer']);
  });

  it('de-duplicates and skips nameless roles', () => {
    const dup = {
      tafkidims: {
        data: [
          { id: '1', attributes: { roleDescription: 'QA' } },
          { id: '2', attributes: { roleDescription: 'QA' } },
          { id: '3', attributes: {} }
        ]
      }
    };
    expect(actRoleNames(dup, 'en')).toEqual(['QA']);
  });

  it('handles an act with no roles', () => {
    expect(actRoleNames({}, 'he')).toEqual([]);
    expect(actRoleNames(null, 'he')).toEqual([]);
  });
});

describe('buildPublishAsMissionUrl', () => {
  const act = {
    id: '51',
    shem: 'לסדר את המחסן',
    des: '<p>צריך <em>למיין</em> את הקרטונים</p>',
    tafkidims: { data: [{ id: '7', attributes: { roleDescription: 'Logistics' } }] }
  };

  it('targets the create page in createmission mode', () => {
    const url = new URL(buildPublishAsMissionUrl('1', act, 'en'), 'https://x.test');
    expect(url.pathname).toBe('/moach/1/create');
    expect(url.searchParams.get('action')).toBe('createmission');
  });

  it('carries name, plain-text description and roles', () => {
    const url = new URL(buildPublishAsMissionUrl('1', act, 'en'), 'https://x.test');
    expect(url.searchParams.get('name')).toBe('לסדר את המחסן');
    expect(url.searchParams.get('descrip')).toBe('צריך למיין את הקרטונים');
    expect(url.searchParams.get('roles')).toBe('Logistics');
  });

  it('carries the act id so the mission can be linked back', () => {
    const url = new URL(buildPublishAsMissionUrl('1', act, 'en'), 'https://x.test');
    expect(url.searchParams.get('fromAct')).toBe('51');
  });

  it('omits empty fields instead of sending blanks', () => {
    const url = new URL(
      buildPublishAsMissionUrl('4', { id: '9', shem: '  ', des: '<p></p>' }, 'he'),
      'https://x.test'
    );
    expect(url.searchParams.has('name')).toBe(false);
    expect(url.searchParams.has('descrip')).toBe(false);
    expect(url.searchParams.has('roles')).toBe(false);
    expect(url.searchParams.get('fromAct')).toBe('9');
  });

  it('escapes values that would otherwise break the query string', () => {
    const url = new URL(
      buildPublishAsMissionUrl('1', { id: '2', shem: 'a&b=c', des: '' }, 'he'),
      'https://x.test'
    );
    expect(url.searchParams.get('name')).toBe('a&b=c');
  });
});

describe('isLinkableMissionType', () => {
  it('accepts exactly what createMission reports', () => {
    // Keep in sync with configs/createMission.ts.
    expect(isLinkableMissionType('pendm')).toBe(true);
    expect(isLinkableMissionType('openMission')).toBe(true);
    expect(isLinkableMissionType('mesimabetahalich')).toBe(true);
  });

  it('rejects anything else', () => {
    expect(isLinkableMissionType('mission')).toBe(false);
    expect(isLinkableMissionType(null)).toBe(false);
    expect(isLinkableMissionType(undefined)).toBe(false);
  });

  it('maps each type to the Act relation that holds it', () => {
    expect(ACT_MISSION_RELATION.pendm).toBe('pendm');
    expect(ACT_MISSION_RELATION.openMission).toBe('open_mission');
    expect(ACT_MISSION_RELATION.mesimabetahalich).toBe('mesimabetahaliches');
  });
});
