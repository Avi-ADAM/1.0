/**
 * cardKinds — the single place that answers "is this heart item currently
 * shown, and what does it look like in one line".
 *
 * The milon gate used to be spelled out inside each `{:else if}` of
 * `cards/cards.svelte` (`buble.ani === 'pends' && milon.pend == true`). With
 * two hosts for the same items — the full-card swiper and the compact list —
 * that predicate has to exist once, outside the markup, or the two views
 * silently disagree about what the user filtered out. It also has to be
 * answerable *before* rendering, so a filtered-out item never produces an empty
 * slide or an empty row.
 */

/**
 * `ani` → the milon key that gates it. Absent from the map means "no gate":
 * the money/consent cards added later (site-share, stipend, wishoffer) were
 * never wired into the filter panel and are always shown.
 *
 * `buy` deliberately reads `sales`, not `purchases` — that is what the card
 * markup did, and the filter panel's `purchases` count is display-only.
 */
export const MILON_KEY_BY_ANI = {
  haluk: 'desi',
  sheirutp: 'sheirutp',
  sale: 'sales',
  buy: 'sales',
  vidu: 'vidu',
  mtaha: 'betaha',
  pmashes: 'ppmash',
  pends: 'pend',
  wegets: 'pmaap',
  fiapp: 'fiap',
  walcomen: 'welc',
  askedcoin: 'asks',
  askedm: 'askmap',
  meData: 'sugg',
  huca: 'pmashs',
  archObject: 'hachla',
  stipend: 'hachla',
  hachla: 'hachla'
};

/** Every `ani` LevCard knows how to render. Anything else is dropped. */
const RENDERABLE = new Set([
  ...Object.keys(MILON_KEY_BY_ANI),
  'wishoffer',
  'sitesharepay',
  'stipendpay',
  'stipendconfirm',
  'sitesharedecide'
]);

/**
 * Would `<LevCard>` render anything for this item under the current filter?
 *
 * @param {any} item a DisplayItem off finalSwiperArray
 * @param {Record<string, boolean>} milon
 * @returns {boolean}
 */
export function isCardVisible(item, milon) {
  const ani = item?.ani;
  if (!ani || !RENDERABLE.has(ani)) return false;
  const key = MILON_KEY_BY_ANI[ani];
  if (!key) return true; // ungated kind
  return milon?.[key] !== false;
}

/**
 * Per-kind presentation for the compact row: which translation key names it,
 * and the glow colour the full card already uses, so a row and its expanded
 * card read as the same object.
 */
const KIND_META = {
  haluk: { key: 'haluk', glow: 'gold' },
  sheirutp: { key: 'sheirutp', glow: 'teal' },
  sale: { key: 'sale', glow: 'gold' },
  buy: { key: 'buy', glow: 'gold' },
  vidu: { key: 'vidu', glow: 'green' },
  mtaha: { key: 'mtaha', glow: 'barbi' },
  pmashes: { key: 'pmashes', glow: 'green' },
  pends: { key: 'pends', glow: 'blue' },
  wegets: { key: 'wegets', glow: 'orange' },
  fiapp: { key: 'fiapp', glow: 'green' },
  walcomen: { key: 'walcomen', glow: 'gold' },
  askedcoin: { key: 'askedcoin', glow: 'blue' },
  askedm: { key: 'askedm', glow: 'blue' },
  meData: { key: 'meData', glow: 'barbi' },
  huca: { key: 'huca', glow: 'orange' },
  archObject: { key: 'archObject', glow: 'red' },
  stipend: { key: 'stipend', glow: 'purple' },
  hachla: { key: 'hachla', glow: 'green' },
  wishoffer: { key: 'wishoffer', glow: 'barbi' },
  sitesharepay: { key: 'sitesharepay', glow: 'gold' },
  stipendpay: { key: 'stipendpay', glow: 'purple' },
  stipendconfirm: { key: 'stipendconfirm', glow: 'purple' },
  sitesharedecide: { key: 'sitesharedecide', glow: 'gold' }
};

/** Translation key for a kind's label, e.g. `lev.list.kind.pends`. */
export function kindLabelKey(ani) {
  return `lev.list.kind.${KIND_META[ani]?.key ?? 'other'}`;
}

/** Glow colour token for a kind, matching the full card's own. */
export function kindGlow(ani) {
  return KIND_META[ani]?.glow ?? 'gold';
}

/**
 * The same glow tokens as concrete colours, so a compact row can carry its
 * kind's accent without pulling in CardHeader. Mirrors CardHeader's own
 * mapping — `gold` resolves to `--goldink`, not `--gold`, because the row's
 * accent is ink on a light surface and `--gold` is the page wash.
 */
const GLOW_CSS = {
  gold: 'var(--goldink)',
  barbi: 'var(--barbi-pink)',
  blue: 'var(--blueg)',
  green: 'var(--wow)',
  orange: 'var(--oranges)',
  purple: '#a855f7',
  red: '#ef4444',
  teal: '#14b8a6'
};

/** CSS colour for a kind's accent rail/badge. */
export function kindAccent(ani) {
  return GLOW_CSS[kindGlow(ani)] ?? GLOW_CSS.gold;
}

/**
 * The one-line title for a row. Items carry their human name under a handful of
 * different field names depending on which processor built them, so try them in
 * the order the cards themselves do before falling back to the project.
 *
 * `nameRaw` comes first and matters: four processors build `name` through
 * `letters()`, which reverses every Hebrew/Arabic word and then the word order
 * so the string can be dropped into an SVG `<text>` (the coin view), where no
 * bidi engine runs. Rendered as ordinary HTML — which is what a row is — that
 * pre-reversed string reads backwards. `nameRaw` is the untouched original.
 */
export function rowTitle(item) {
  return (
    item?.nameRaw ||
    item?.name ||
    item?.openmissionName ||
    item?.missionName ||
    item?.username ||
    item?.useraplyname ||
    item?.projectName ||
    ''
  );
}

/**
 * A short description for the row, so a condensed card carries some of what the
 * full one says instead of a name and a lot of white space. Kinds name this
 * field differently; take the first that has text.
 *
 * Some of these are rich text, which arrives either as an HTML string or as a
 * block array, so flatten to plain text — a row is one clamped line, and raw
 * markup in it would render as literal angle brackets.
 */
export function rowSubtitle(item) {
  const raw =
    item?.descrip ??
    item?.missionDetails ??
    item?.hearotMeyuchadot ??
    item?.spnot ??
    item?.note ??
    '';
  const text = Array.isArray(raw)
    ? raw
        .map((b) => (b?.children ?? []).map((c) => c?.text ?? '').join(''))
        .join(' ')
    : String(raw ?? '');
  return text
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Up to three figures worth showing on a row, as `{ key, value }` where `key`
 * names a `lev.list.fact.*` translation. Numbers only — anything that needs a
 * sentence belongs on the full card.
 */
export function rowFacts(item) {
  const num = (v) => {
    const n = Number(v);
    return Number.isFinite(n) && n > 0 ? n : null;
  };
  const hours = num(item?.noofhours);
  const rate = num(item?.perhour);
  const qty = num(item?.hm);
  const amount = num(item?.easy) ?? num(item?.price) ?? (hours && rate ? hours * rate : null);

  const facts = [];
  if (hours) facts.push({ key: 'hours', value: hours });
  if (rate) facts.push({ key: 'rate', value: rate });
  if (amount) facts.push({ key: 'amount', value: amount });
  if (qty) facts.push({ key: 'qty', value: qty });
  return facts.slice(0, 3);
}

/**
 * The deadline a row should count down to, or null when the item has none.
 * Mirrors what the full cards read.
 */
export function rowTimegrama(item) {
  return item?.timegramaDate ?? item?.timeGramaDate ?? null;
}

/**
 * Does this item still want something from the user? Cards the user has
 * already voted on set `already`, and the feed sorts them into the VOTE_DONE
 * band (`pl >= 700`). Either signal is enough to grey the row down.
 */
export function rowIsActionable(item) {
  if (item?.already === true) return false;
  return (item?.pl ?? 999) < 700;
}
