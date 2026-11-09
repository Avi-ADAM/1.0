import { describe, it, expect, vi } from 'vitest';

vi.mock('./config.js', () => ({
    readsCache: () => true,
    stateDir: () => null,
    SURFACE_KEYS: ['eventPage']
}));

const { sourceByKey } = await import('./backfillSources.js');
const { eventPageGroups } = await import('./surfaces.js');
const { collect } = await import('$lib/translation/collect.js');
const { toEventView } = await import('$lib/events/model');

const node = {
    id: 7,
    attributes: {
        slug: 'biz',
        kind: 'webinar',
        title: 'מה 1lev1 נותן לבעלי עסקים',
        tagline: 'וובינר חי של שעה',
        description: 'פסקה ראשונה של התיאור.\n\nפסקה שנייה של התיאור.',
        outcomes: '- להבין איך עבודה הופכת לחלק\n- לפתוח רקמה ראשונה',
        audience: 'עסקים קטנים',
        status: 'published',
        agenda: [{ minutes: 20, title: 'איך זה עובד', desc: 'הדגמה חיה' }],
        faq: [{ q: 'זה עולה כסף?', a: 'לא, הוובינר חינמי.' }],
        project: { data: { id: 5, attributes: { projectName: 'הרקמה המרכזית' } } }
    }
};

const sorted = (xs: Array<{ hash: string }>) => xs.map((x) => x.hash).sort();

describe('the event page surface (W4)', () => {
    it('the walker hashes exactly what the page loader hashes', () => {
        const source = sourceByKey('rikmaEvent')!;
        const walked = source.strings(node).flatMap((g) => g.strings);
        const loader = collect(eventPageGroups(toEventView(node), 'הרקמה המרכזית') as never);
        expect(sorted(walked)).toEqual(sorted(loader));
    });

    it('splits the description into paragraphs and the lists into lines', () => {
        const strings = collect(eventPageGroups(toEventView(node), null) as never).map((s) => s.source);
        expect(strings).toContain('פסקה ראשונה של התיאור.');
        expect(strings).toContain('פסקה שנייה של התיאור.');
        expect(strings).toContain('לפתוח רקמה ראשונה');
        expect(strings).toContain('הדגמה חיה');
        expect(strings).toContain('לא, הוובינר חינמי.');
    });

    it('walks only published, live events', () => {
        const source = sourceByKey('rikmaEvent')!;
        expect(source.strings({ ...node, attributes: { ...node.attributes, status: 'draft' } })).toEqual([]);
        expect(source.strings({ ...node, attributes: { ...node.attributes, lifecycle: 'archived' } })).toEqual([]);
    });
});
