import { describe, it, expect } from 'vitest';
import { jsonLdBody, faqPage, breadcrumbs } from './jsonLd.js';

describe('jsonLdBody', () => {
  it('neutralises a closing script tag inside a string value', () => {
    // The HTML parser ends a <script> at the first `</script` in the raw text,
    // whatever it is nested inside - so an unescaped one would spill the rest
    // of the JSON into the document as markup.
    const body = jsonLdBody({ answer: 'see </script><img src=x onerror=alert(1)>' });
    expect(body).not.toContain('</script');
    expect(body).toContain('<\\/script');
    // Still valid JSON, and still the original text once parsed.
    expect(JSON.parse(body).answer).toBe('see </script><img src=x onerror=alert(1)>');
  });

  it('catches the tag whatever its case', () => {
    expect(jsonLdBody({ a: '</SCRIPT>' })).not.toMatch(/<\/script/i);
  });

  it('escapes U+2028 and U+2029', () => {
    // Legal inside a JSON string, but line terminators to a JavaScript parser.
    const body = jsonLdBody({ a: 'one two three' });
    expect(body).not.toContain(' ');
    expect(body).not.toContain(' ');
    expect(JSON.parse(body).a).toBe('one two three');
  });
});

describe('faqPage', () => {
  it('builds one Question entity per pair', () => {
    const doc = faqPage([
      { question: 'What is a rikma?', answer: 'A partnership.' },
      { question: 'How is profit split?', answer: 'By contribution.' }
    ]);
    expect(doc?.['@type']).toBe('FAQPage');
    expect(doc?.mainEntity).toHaveLength(2);
    expect(doc?.mainEntity[0]).toMatchObject({
      '@type': 'Question',
      name: 'What is a rikma?',
      acceptedAnswer: { '@type': 'Answer', text: 'A partnership.' }
    });
  });

  it('drops pairs whose translation resolved to nothing', () => {
    // A missing key renders as an empty string rather than throwing, so an
    // untranslated question would otherwise become an invalid empty entity.
    const doc = faqPage([
      { question: 'Real question', answer: 'Real answer' },
      { question: '', answer: 'orphan answer' },
      { question: 'orphan question', answer: '   ' }
    ]);
    expect(doc?.mainEntity).toHaveLength(1);
    expect(doc?.mainEntity[0].name).toBe('Real question');
  });

  it('returns null when nothing usable is left, so no empty FAQPage ships', () => {
    expect(faqPage([])).toBeNull();
    expect(faqPage([{ question: '', answer: '' }])).toBeNull();
  });
});

describe('breadcrumbs', () => {
  it('numbers the trail from one, in the order given', () => {
    const doc = breadcrumbs([
      { name: 'Home', url: 'https://1lev1.com/' },
      { name: 'Partnership', url: 'https://1lev1.com/partnership' }
    ]);
    expect(doc.itemListElement.map((s) => s.position)).toEqual([1, 2]);
    expect(doc.itemListElement[1]).toMatchObject({
      name: 'Partnership',
      item: 'https://1lev1.com/partnership'
    });
  });
});
