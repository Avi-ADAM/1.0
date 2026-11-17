import { describe, expect, it, vi } from 'vitest';

import heLev from '$lib/translations/he/lev.json';
import enLev from '$lib/translations/en/lev.json';
import arLev from '$lib/translations/ar/lev.json';
import ruLev from '$lib/translations/ru/lev.json';
import esLev from '$lib/translations/es/lev.json';

import heMash from '$lib/translations/he/mash.json';
import enMash from '$lib/translations/en/mash.json';
import arMash from '$lib/translations/ar/mash.json';
import ruMash from '$lib/translations/ru/mash.json';
import esMash from '$lib/translations/es/mash.json';

import type { TranslateFn } from './levProcessors';

vi.mock('$lib/utils/projectHelpers.js', () => ({
  createProjectInfo: (pid: string) =>
    pid === '5'
      ? { noof: 3, projectName: 'AlphaRikma', src2: '/p.png' }
      : { noof: 0, projectName: '', src2: '' },
  createUserInfo: (_pid: string, uid: string) =>
    uid === '99'
      ? { username: '', src: '', uid: '99' }
      : { username: `User_${uid}`, src: '/u.png', uid },
  getProjectMembers: () => [],
  getProjectUsers: () => [],
  getProjectRestime: () => 'feh'
}));

const P = await import('./levProcessors');

const BUNDLES = {
  he: { lev: heLev, mash: heMash },
  en: { lev: enLev, mash: enMash },
  ar: { lev: arLev, mash: arMash },
  ru: { lev: ruLev, mash: ruMash },
  es: { lev: esLev, mash: esMash }
} as const;

type Locale = keyof typeof BUNDLES;

function makeT(locale: Locale): TranslateFn {
  const bundle = BUNDLES[locale];
  return (key, payload) => {
    const raw = key
      .split('.')
      .reduce<unknown>((cur, seg) => (cur && typeof cur === 'object' ? (cur as any)[seg] : undefined), bundle);
    if (typeof raw !== 'string') {
      throw new Error(`Missing key [${locale}] ${key}`);
    }
    if (!payload) return raw;
    return raw.replace(/\{\{(\w+)\}\}/g, (_m, k) => String(payload[k] ?? ''));
  };
}

const HEBREW_RE = /[\u0590-\u05FF]/;
const NON_HE_LOCALES: Locale[] = ['en', 'ar', 'ru', 'es'];

describe('levProcessors i18n (Phase 2.1)', () => {
  const pendSample = {
    id: '10',
    projectId: '5',
    myid: '1',
    name: 'Build landing page',
    descrip: 'Updated description',
    hearotMeyuchadot: 'Updated note',
    noofhours: 12,
    perhour: 100,
    iskvua: true,
    orderon: 2,
    users: [
      { users_permissions_user: { data: { id: '2' } }, what: true, order: 2 },
      { users_permissions_user: { data: { id: '3' } }, what: false, order: 2 },
      { users_permissions_user: { data: { id: '4' } }, what: true, order: 1 },
      { users_permissions_user: { data: { id: '99' } }, what: true, order: 2 }
    ],
    negopendmissions: {
      data: [
        {
          attributes: {
            users_permissions_user: { data: { id: '3' } },
            noofhours: 8,
            perhour: 80,
            name: 'Draft page',
            descrip: 'Initial description',
            hearotMeyuchadot: 'Initial note',
            isMonth: false,
            createdAt: '2026-10-01T10:00:00Z'
          }
        }
      ]
    },
    diun: [],
    chat: []
  };

  const pmashSample = {
    id: '20',
    projectId: '5',
    myid: '1',
    name: 'Studio camera',
    descrip: 'Mirrorless 4K',
    spnot: 'With tripod',
    hm: 2,
    price: 500,
    easy: 400,
    resourceType: 'monthly',
    orderon: 1,
    users: [
      { users_permissions_user: { data: { id: '2' } }, what: true, order: 1 },
      { users_permissions_user: { data: { id: '3' } }, what: false, order: 1 },
      { users_permissions_user: { data: { id: '4' } }, what: true, order: 0 }
    ],
    nego_mashes: {
      data: [
        {
          attributes: {
            users_permissions_user: { data: { id: '3' } },
            hm: 1,
            price: 600,
            easy: 450,
            name: 'Basic camera',
            descrip: 'HD camera',
            spnot: 'Body only',
            kindOf: 'perUnit',
            createdAt: '2026-10-02T10:00:00Z'
          }
        }
      ]
    },
    diun: []
  };

  const askSample = {
    id: '30',
    projectId: '5',
    myid: '1',
    orderon: 1,
    open_mission: { data: { id: '7', attributes: { name: 'Sound check' } } },
    users_permissions_user: { data: { id: '8', attributes: { username: 'Maya' } } },
    vots: [
      { users_permissions_user: { data: { id: '2' } }, what: true, order: 1 },
      { users_permissions_user: { data: { id: '3' } }, what: false, order: 0 }
    ],
    nego_mashes: [],
    chat: []
  };

  const decisionSample = {
    id: '40',
    projectId: '5',
    myid: '1',
    kind: 'pic',
    users: [
      { users_permissions_user: { data: { id: '2' } }, what: true },
      { users_permissions_user: { data: { id: '3' } }, what: false, why: 'Prefer higher contrast' }
    ]
  };

  const productRequestSample = {
    id: '50',
    projectId: '5',
    myid: '1',
    orderon: 2,
    vots: [
      { users_permissions_user: { data: { id: '2' } }, what: true, order: 2 },
      { users_permissions_user: { data: { id: '3' } }, what: false, order: 1 }
    ]
  };

  const conciergeSuggestionSample = {
    id: '60',
    projectId: '',
    projectDetails: null,
    ratson: { id: '9', name: 'Community dinner' },
    source: 'concierge',
    name: 'Cook soup',
    skills: [],
    tafkidims: [],
    work_ways: []
  };

  const maagadResourceSample = {
    id: '70',
    projectId: '',
    projectName: '',
    maagad: { id: '4', name: 'Solar coop' },
    source: 'maagad',
    name: 'Inverter',
    price: 100,
    easy: 80
  };

  it.each(NON_HE_LOCALES)('emits zero Hebrew in %s across all localized processors', (locale) => {
    const tr = makeT(locale);

    const [pend] = P.processPends([pendSample] as any, [], tr);
    const [pmash] = P.processPmashes([pmashSample] as any, [], tr);
    const [ask] = P.processAsked([askSample] as any, [], tr);
    const [dec] = P.processDecisions([decisionSample] as any, [], tr);
    const [prod] = P.processProductRequests([productRequestSample] as any, [], tr);
    const [sug] = P.processSuggestions([conciergeSuggestionSample] as any, [{} as any], tr);
    const [rsug] = P.processResourceSuggestions([maagadResourceSample] as any, [], tr);

    const texts = [
      ...pend.messege.map((m: any) => m.message),
      ...pmash.messege.map((m: any) => m.message),
      ...ask.messeges.map((m: any) => m.message),
      ...dec.messege.map((m: any) => m.message),
      ...prod.messege.map((m: any) => m.message),
      sug?.projectName ?? '',
      rsug?.projectName ?? ''
    ];

    expect(texts.length).toBeGreaterThan(10);
    for (const txt of texts) {
      expect(txt, `Unexpected Hebrew in [${locale}]: ${txt}`).not.toMatch(HEBREW_RE);
    }
  });

  it('produces localized English negotiation diffs, votes, and resource types', () => {
    const en = makeT('en');
    const [pend] = P.processPends([pendSample] as any, [], en);
    const allPend = pend.messege.map((m: any) => m.message).join('\n');

    expect(allPend).toContain(enLev.feed.voteFavor.replace('{{name}}', 'User_2'));
    expect(allPend).toContain(enLev.feed.voteAgainst.replace('{{name}}', 'User_3'));
    expect(allPend).toContain(enLev.feed.oldVersion);
    expect(allPend).toContain(enLev.feed.didNego.replace('{{name}}', 'User_3'));
    expect(allPend).toContain('12 hours instead of 8 hours');
    expect(allPend).toContain('Hourly rate: 100 instead of 80');
    expect(allPend).toContain('Total: 1200 instead of 640');
    expect(allPend).toContain(enLev.feed.monthly);
    expect(allPend).toContain(enLev.feed.oneTime);

    const [pmash] = P.processPmashes([pmashSample] as any, [], en);
    const allPmash = pmash.messege.map((m: any) => m.message).join('\n');
    // Verifies vote.what === false is properly rendered as objected (not in favor)
    expect(allPmash).toContain(enLev.feed.voteFavor.replace('{{name}}', 'User_2'));
    expect(allPmash).toContain(enLev.feed.voteAgainst.replace('{{name}}', 'User_3'));
    expect(allPmash).toContain(enMash.monthly);
    expect(allPmash).toContain(enMash.perUnit);
  });

  it('produces localized Hebrew output via he translation keys', () => {
    const he = makeT('he');
    const [pend] = P.processPends([pendSample] as any, [], he);
    const allPend = pend.messege.map((m: any) => m.message).join('\n');
    expect(allPend).toContain('User_2 בעד');
    expect(allPend).toContain('User_3 נגד');
    expect(allPend).toContain('12 שעות במקום 8 שעות');
  });

  it('HTML-escapes untrusted strings interpolated into feed HTML', () => {
    const en = makeT('en');
    const [dec] = P.processDecisions(
      [
        {
          id: '41',
          projectId: '5',
          myid: '1',
          kind: 'pic',
          users: [
            {
              users_permissions_user: { data: { id: '3' } },
              what: false,
              why: '<img src=x onerror=alert(1)>'
            }
          ]
        }
      ] as any,
      [],
      en
    );
    expect(dec.messege[0].message).toContain('&lt;img src=x onerror=alert(1)&gt;');
    expect(dec.messege[0].message).not.toContain('<img');
  });
});
