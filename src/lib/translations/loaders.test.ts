import { describe, it, expect } from 'vitest';
import { get } from 'svelte/store';
import { t, loadTranslations } from './index.js';

describe('i18n loader table', () => {
  it('resolves me.guide.* on /me in every locale', async () => {
    for (const l of ['he', 'en', 'ar', 'ru', 'es']) {
      await loadTranslations(l, '/me');
      const tr = get(t);
      expect(tr('me.guide.header'), `${l} me.guide.header`).toBeTruthy();
      expect(tr('me.guide.yes'), `${l} me.guide.yes`).toBeTruthy();
    }
  });
  it('resolves route-gated namespaces where they are used', async () => {
    await loadTranslations('es', '/lev');
    expect(get(t)('deals.metaQuantity')).toBeTruthy();
    await loadTranslations('es', '/moach/1/sales/new');
    expect(get(t)('offerings.compose.title')).toBeTruthy();
  });
  it('still loads global namespaces on an arbitrary route', async () => {
    await loadTranslations('ru', '/hub');
    expect(get(t)('common.save')).toBeTruthy();
    expect(get(t)('moach.guide.header')).toBeTruthy();
  });

  // The wish composer builds most of its keys at runtime —
  // `concierge.new.joinKind.${opt.value}.label` — so a missing branch is
  // invisible to a grep for literal keys. Walk every option list instead.
  it('resolves every runtime-built concierge.new key in every locale', async () => {
    const GROUPS: Record<string, string[]> = {
      seeds: ['gift', 'task', 'community', 'trip', 'family', 'free'],
      whoCanOffer: ['open', 'mine'],
      whoCanSee: ['personal', 'free_threshold', 'pay_to_access'],
      invitePartners: ['lev', 'manual', 'none'],
      joinKind: [
        'solo',
        'group_purchase',
        'group_trip',
        'community_event',
        'public_renovation',
        'recurring_subscription',
        'other'
      ]
    };
    const JEWELS = [
      'when',
      'where',
      'budget',
      'whoCanOffer',
      'whoCanSee',
      'invite',
      'joinKind'
    ];
    const VALUES = [
      'consent',
      'equality',
      'community',
      'transparency',
      'accessibility',
      'ecology',
      'reciprocity',
      'creativity',
      'generosity',
      'trust'
    ];

    for (const l of ['he', 'en', 'ar', 'ru', 'es']) {
      await loadTranslations(l, '/concierge/new');
      const tr = get(t);

      for (const [group, keys] of Object.entries(GROUPS)) {
        for (const k of keys) {
          for (const field of ['label', 'hint']) {
            const key = `concierge.new.${group}.${k}.${field}`;
            expect(tr(key), `${l} ${key}`).toBeTruthy();
          }
        }
      }
      for (const j of JEWELS) {
        for (const field of ['label', 'placeholder']) {
          const key = `concierge.new.jewels.${j}.${field}`;
          expect(tr(key), `${l} ${key}`).toBeTruthy();
        }
      }
      for (const v of VALUES) {
        expect(tr(`concierge.new.values.${v}`), `${l} value ${v}`).toBeTruthy();
      }
      for (const s of ['wish', 'understand', 'proposals', 'consent']) {
        expect(tr(`concierge.new.steps.${s}`), `${l} step ${s}`).toBeTruthy();
      }
    }
  });

  it('interpolates concierge.new counters instead of printing the placeholder', async () => {
    await loadTranslations('es', '/concierge/new');
    const tr = get(t);
    expect(tr('concierge.new.wordCount', { count: 7 })).toContain('7');
    expect(tr('concierge.new.wordCount', { count: 7 })).not.toContain('{');
    expect(tr('concierge.new.navNotice', { label: 'X' })).toContain('X');
  });
});
