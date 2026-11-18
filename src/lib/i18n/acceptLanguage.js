/**
 * Parse an `Accept-Language` header by its q-order (RFC 9110 §12.5.2).
 *
 * Kept dependency-free and alias-free so both `hooks.server.js` (the first
 * visit, before any cookie exists) and the MCP language resolver can share it,
 * and so it can be unit-tested under plain node.
 *
 * `en-US,en;q=0.9,he;q=0.8` is an English reader: the old
 * `header.includes('he')` check saw the "he" in there and served Hebrew.
 * A `ru`/`es`/`ar` browser got `en` even when its own language was first.
 */

/**
 * The first language in `supported` the header asks for, by descending q-weight
 * and then by header order. `q=0` means "not acceptable", so it is skipped;
 * a missing q means 1. Wildcards and unsupported tags fall through.
 *
 * @param {string | null | undefined} header
 * @param {readonly string[]} supported
 * @returns {string | null}
 */
export function localeFromAcceptLanguage(header, supported) {
    if (!header) return null;
    const ranked = header
        .split(',')
        .map((part, i) => {
            const [tag, ...params] = part.trim().split(';');
            const q = params
                .map((p) => /^q=([\d.]+)$/.exec(p.trim()))
                .find(Boolean);
            const weight = q ? Number(q[1]) : 1;
            return { tag: (tag ?? '').trim(), weight: Number.isFinite(weight) ? weight : 0, i };
        })
        .filter((r) => r.tag && r.tag !== '*' && r.weight > 0)
        .sort((a, b) => b.weight - a.weight || a.i - b.i);

    for (const { tag } of ranked) {
        const primary = tag.split(/[-_]/)[0].toLowerCase();
        if (supported.includes(primary)) return primary;
    }
    return null;
}
