/**
 * Structured data helpers.
 *
 * `app.html` carries the two site-wide entities - Organization and
 * SoftwareApplication - because they are true of every page. Anything that
 * describes one particular page has to be built from that page's own content,
 * which is what this file is for.
 *
 * The one rule that matters for all of it: structured data must describe what
 * the page actually shows. A FAQPage listing questions a visitor cannot find
 * on the page is a manual-action risk, not a shortcut to rich results - so
 * these builders take the same translation keys the markup renders, rather
 * than a second copy of the text maintained alongside it.
 */

/**
 * Serialize an object for a `<script type="application/ld+json">` body.
 *
 * `JSON.stringify` alone is not safe here. The HTML parser ends a script
 * element at the first `</script` in the raw text, wherever it appears - a
 * string value containing one would terminate the block early and spill the
 * rest of the JSON into the document as markup. U+2028 and U+2029 are the
 * other classic pair: legal inside a JSON string, but line terminators to a
 * JavaScript parser. Escaping all three keeps the payload inert.
 *
 * @param {unknown} data
 * @returns {string}
 */
export function jsonLdBody(data) {
  return JSON.stringify(data)
    .replace(/<\/(script)/gi, '<\\/$1')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029');
}

/**
 * A FAQPage built from question/answer pairs.
 *
 * Pairs whose question or answer is empty are dropped rather than emitted
 * blank: a missing translation renders as an empty string here exactly as it
 * does in the markup (see the four silent-`$t()` failure modes in CLAUDE.md),
 * and an empty Question is invalid structured data.
 *
 * @param {{ question: string, answer: string }[]} pairs
 * @returns {object | null} null when nothing usable is left, so the caller can
 *   skip emitting the script entirely instead of shipping an empty FAQPage.
 */
export function faqPage(pairs) {
  const entities = pairs
    .filter((p) => p.question?.trim() && p.answer?.trim())
    .map((p) => ({
      '@type': 'Question',
      name: p.question.trim(),
      acceptedAnswer: { '@type': 'Answer', text: p.answer.trim() }
    }));

  if (entities.length === 0) return null;
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: entities
  };
}

/**
 * A BreadcrumbList for one page.
 *
 * Positions are 1-based and assigned here, so a caller cannot get them out of
 * step with the order of the trail it passed.
 *
 * @param {{ name: string, url: string }[]} trail Home first, this page last.
 * @returns {object}
 */
export function breadcrumbs(trail) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: trail.map((step, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: step.name,
      item: step.url
    }))
  };
}
