import { describe, it, expect } from 'vitest';
import { prepareRow } from './cacheTranslations.js';

const base = {
    hash: 'a'.repeat(32),
    srcLang: 'he',
    tgtLang: 'en',
    source: 'בניית מערכת תורים למרפאה קהילתית',
    text: 'Building a queue system for a community clinic'
};

const reason = (r: ReturnType<typeof prepareRow>) => ('reason' in r ? r.reason : null);
const row = (r: ReturnType<typeof prepareRow>) => ('row' in r ? r.row : null);

describe('an ordinary machine row', () => {
    it('is keyed by the language pair and the hash', () => {
        expect(row(prepareRow(base))?.key).toBe(`he.en.${base.hash}`);
    });

    it('cannot claim `reviewed` — that is a human word', () => {
        expect(row(prepareRow({ ...base, quality: 'reviewed' }))?.quality).toBe('machine');
    });

    it('is refused when the output is not a translation', () => {
        expect(reason(prepareRow({ ...base, text: base.source }))).toContain('unchanged');
    });

    it('is refused for an unknown language', () => {
        expect(reason(prepareRow({ ...base, tgtLang: 'de' }))).toContain('unknown language pair');
    });
});

/**
 * Identity rows are the free half of the backfill (PLAN_UGC_TRANSLATION
 * §15.3.5) and there is no model in them: the text stored *is* the author's,
 * against the author's own language. Running the model-output validator over
 * them rejects perfectly good rows — a Hebrew source containing an inflected
 * glossary term (`רקמות`, `רקמת`) fails the glossary check against the
 * canonical `רקמה` — so exactly the corpus that is free to fill would be the
 * corpus that could not be stored.
 */
describe('identity rows', () => {
    const identity = {
        hash: 'b'.repeat(32),
        srcLang: 'he',
        tgtLang: 'he',
        source: 'צוות הרקמות מחפש מפתח',
        text: 'צוות הרקמות מחפש מפתח',
        engine: 'identity'
    };

    it('are stored, glossary inflections and all', () => {
        const out = prepareRow(identity);
        expect(reason(out)).toBeNull();
        expect(row(out)?.engine).toBe('identity');
    });

    it('would have been refused by the model-output validator', () => {
        // The same words as a claimed he→en translation: still refused, so the
        // exemption above is scoped to the identity claim and nothing else.
        expect(reason(prepareRow({ ...identity, tgtLang: 'en', engine: 'gemini' }))).toBeTruthy();
    });

    it('may not lie about their text', () => {
        expect(reason(prepareRow({ ...identity, text: 'משהו אחר לגמרי' }))).toContain(
            'identity row whose text is not its source'
        );
    });

    it('may not claim identity across two languages', () => {
        expect(reason(prepareRow({ ...identity, tgtLang: 'en' }))).toContain('across two languages');
    });

    it('refuse a same-language row that does not declare itself an identity row', () => {
        expect(reason(prepareRow({ ...identity, engine: 'gemini' }))).toContain('must declare engine:identity');
    });

    it('tolerate whitespace normalization between source and text', () => {
        const out = prepareRow({ ...identity, text: '  צוות הרקמות   מחפש מפתח  ' });
        expect(reason(out)).toBeNull();
    });
});
