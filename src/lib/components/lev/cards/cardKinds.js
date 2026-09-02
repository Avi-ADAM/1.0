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
  'stipendaccrued',
  'sitesharedecide'
]);

/**
 * The same set as an array, so a test can walk every kind the heart can render
 * and assert the list view has something to say about each one. Both views
 * dispatch through `<LevCard>`, so this list *is* the contract between them.
 */
export const RENDERABLE_ANIS = [...RENDERABLE];

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
  stipendaccrued: { key: 'stipendaccrued', glow: 'purple' },
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
 * `nameRaw` comes first and stays first: it is the untouched original, so it is
 * right whatever `letters()` decides to do to `name`. (`letters()` used to
 * pre-reverse Hebrew/Arabic for SVG `<text>`, which reads backwards as HTML;
 * it no longer does, because SVG text runs bidi like everything else.)
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
    : // A relation object here is not prose — stringifying it would print
      // `[object Object]` into the row. Same rule as `T` below.
      typeof raw === 'object' && raw !== null
      ? ''
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

/* ==========================================================================
 * Per-kind row content
 * --------------------------------------------------------------------------
 * `rowTitle`/`rowSubtitle`/`rowFacts` above sniff a fixed list of field names.
 * That is the right *fallback*, but it is not enough on its own: the twenty-odd
 * kinds the heart renders were each built by a different processor and name
 * their payload differently. A stipend payable has `recipientName`/`amount`, a
 * wish offer has `volunteerName`/`missionName`, a transfer has
 * `sendname`/`resname`/`amount` — none of which the generic sniffer knows, so
 * those rows came out as a project name and a blank body while the full card
 * showed a whole story.
 *
 * `rowContent` closes that gap: one small builder per `ani`, falling back to
 * the sniffer for anything it does not override. The card view is the
 * better-maintained surface, so each builder mirrors what its card puts in its
 * header and its first block — never more, because a row is a third of a phone
 * screen.
 *
 * Text comes back as `{ text }` (already-human data) or `{ key, params }` (a
 * `$t()` lookup), because this module is pure and has no access to the store.
 * The row resolves whichever it gets.
 */

/** @typedef {{ text?: string, key?: string, params?: Record<string, any> }} RowText */
/** @typedef {{ key: string, value: number | string }} RowFact */
/** @typedef {{ kindKey: string, title: RowText | null, subtitle: RowText | null, facts: RowFact[] }} RowContent */

/**
 * Plain human text, or null when there is none — so `??` chains work.
 *
 * Objects and arrays are treated as "no text" rather than stringified: a good
 * half of these payload fields are Strapi relations or component arrays, and
 * `String(someRelation)` renders the literal `[object Object]` into the row.
 * Failing to null instead lets the `??` chain fall through to a field that
 * really is text.
 */
const T = (v) => {
  if (v == null || typeof v === 'object') return null;
  const s = typeof v === 'string' ? v.trim() : String(v);
  return s ? { text: s } : null;
};

/** A `$t()` lookup the row will resolve. */
const K = (key, params) => ({ key, params });

/** Positive finite numbers only; anything else is not worth a chip. */
const n = (v) => {
  const x = Number(v);
  return Number.isFinite(x) && x > 0 ? x : null;
};

const f = (key, value) => (value == null ? null : { key, value });

/** Drop the empties, keep at most three — a fourth chip wraps and eats a line. */
const chips = (...list) => list.filter(Boolean).slice(0, 3);

/**
 * Decision `kind`s that are a project-field change; each has its own label,
 * mirroring KIND_LABELS in the getDecisionDetails action. The full card fetches
 * the label from the server; a row cannot wait for a round-trip per row, so the
 * same list lives here as translation keys.
 */
const FIELD_DECISIONS = new Set([
  'name',
  'pubdes',
  'prides',
  'newFlink',
  'newWlink',
  'timtoM',
  'vallueadd',
  'vallueles',
  'pic'
]);

/**
 * One builder per `ani`. Each returns any subset of
 * `{ title, subtitle, facts }`; whatever it leaves out falls back to the
 * generic sniffer, so a builder only has to state what it knows better.
 */
const ROW_CONTENT = {
  // ── consent & votes ──────────────────────────────────────────────────────
  haluk: (b) => ({
    facts: chips(
      f('profit', n(b.hervach)),
      f('shares', n(b.halukot?.length)),
      f('members', n(b.noofusers))
    )
  }),

  hachla: (b) => ({
    title:
      b.kind === 'saleClaim'
        ? (T(b.saleClaim?.productName) ?? K('lev.list.decision.saleClaim'))
        : FIELD_DECISIONS.has(b.kind)
          ? K(`lev.list.decision.${b.kind}`)
          : b.kind === 'sheirutpends'
            ? K('lev.list.decision.sheirutpends')
            : (T(b.name) ?? T(b.projectName)),
    subtitle:
      b.kind === 'saleClaim'
        ? K('lev.list.decision.saleClaimSub')
        : (T(rowSubtitle(b)) ?? K('lev.list.decision.generic')),
    facts:
      b.kind === 'saleClaim'
        ? chips(
            f('price', n(b.saleClaim?.standing?.price ?? b.saleClaim?.current?.price)),
            f('qty', n(b.saleClaim?.standing?.hm ?? b.saleClaim?.current?.unit))
          )
        : []
  }),

  archObject: (b) => ({
    title: T(b.archive?.targetName) ?? T(b.name),
    subtitle: b.archive?.targetKind
      ? K(`archive.card.target.${b.archive.targetKind}`)
      : null,
    facts: chips(
      f('hours', n(b.archive?.accruedHours)),
      f('round', n(b.archive?.standingOrder))
    )
  }),

  stipend: (b) => ({
    title:
      T(b.stipend?.recipientName) ??
      T(b.stipend?.funderName) ??
      T(b.projectName),
    subtitle: b.stipend?.funderName
      ? K('lev.list.sub.stipendFrom', { name: b.stipend.funderName })
      : K('lev.list.sub.stipendSeeking'),
    facts: chips(
      f('rate', n(b.stipend?.standing?.stipendRate)),
      f('hours', n(b.stipend?.standing?.monthlyHours ?? b.stipend?.standing?.hours)),
      f('round', n(b.stipend?.standingOrder))
    )
  }),

  // ── missions & resources ─────────────────────────────────────────────────
  mtaha: (b) => ({
    facts: chips(
      f('hoursDone', n(b.howmanyhoursalready)),
      f('hours', n(b.hoursassinged)),
      f('rate', n(b.perhour))
    )
  }),

  pends: (b) => ({
    facts: chips(
      f('hours', n(b.noofhours)),
      f('rate', n(b.perhour)),
      f('amount', n(b.noofhours) && n(b.perhour) ? b.noofhours * b.perhour : null)
    )
  }),

  pmashes: (b) => ({
    facts: chips(f('qty', n(b.hm)), f('price', n(b.price)), f('amount', n(b.easy)))
  }),

  meData: (b) => ({
    subtitle: T(rowSubtitle(b)) ?? K('lev.list.sub.suggestedForMe'),
    facts: chips(
      f('hours', n(b.noofhours)),
      f('rate', n(b.perhour)),
      f('amount', n(b.noofhours) && n(b.perhour) ? b.noofhours * b.perhour : null)
    )
  }),

  huca: (b) => ({
    title: T(b.mashname) ?? T(b.nameRaw) ?? T(b.name),
    facts: chips(f('price', n(b.price)), f('qty', n(b.myp)), f('amount', n(b.easy)))
  }),

  // ── people asking / approving ────────────────────────────────────────────
  askedcoin: (b) => ({
    title: T(b.username) ?? T(b.useraplyname),
    subtitle: T(b.openName) ?? T(rowSubtitle(b)),
    facts: chips(f('hours', n(b.nhours)), f('rate', n(b.perhour)))
  }),

  askedm: (b) => ({
    title: T(b.username) ?? T(b.useraplyname),
    subtitle: T(b.openName) ?? T(rowSubtitle(b)),
    facts: chips(f('price', n(b.price)), f('qty', n(b.myp)), f('amount', n(b.easy)))
  }),

  fiapp: (b) => ({
    subtitle: b.username
      ? K('lev.list.sub.reportedBy', { name: b.username })
      : T(rowSubtitle(b)),
    facts: chips(
      f('hours', n(b.nhours)),
      f('rate', n(b.perhour)),
      f('amount', n(b.nhours) && n(b.perhour) ? b.nhours * b.perhour : null)
    )
  }),

  wegets: (b) => ({
    subtitle: b.username
      ? K('lev.list.sub.deliveredBy', { name: b.username })
      : T(rowSubtitle(b)),
    facts: chips(f('qty', n(b.hm)), f('price', n(b.price)), f('amount', n(b.easy)))
  }),

  walcomen: (b) => ({
    title: T(b.username) ?? T(b.projectName),
    subtitle: T(b.details) ?? T(b.message) ?? K('lev.list.sub.welcome')
  }),

  wishoffer: (b) => ({
    title: T(b.volunteerName),
    subtitle: b.missionName
      ? K('lev.list.sub.offeredOn', { name: b.missionName })
      : (T(b.ratsonDesc) ?? T(b.ratsonName)),
    facts: chips(f('hours', n(b.hours)), f('price', n(b.price)))
  }),

  // ── money ────────────────────────────────────────────────────────────────
  sheirutp: (b) => ({
    subtitle: b.username
      ? K('lev.list.sub.requestedBy', { name: b.username })
      : T(rowSubtitle(b)),
    facts: chips(f('price', n(b.price)), f('qty', n(b.quant)), f('amount', n(b.total)))
  }),

  sale: (b) =>
    b.isSiteShareIncome
      ? {
          subtitle: K('lev.list.sub.siteShareIncome'),
          facts: chips(
            f('amount', n(b.total) ?? n(b.price)),
            f('transfers', n(b.transferHalukas?.length))
          )
        }
      : {
          subtitle: b.customerName
            ? K('lev.list.sub.customer', { name: b.customerName })
            : T(rowSubtitle(b)),
          facts: chips(
            f('price', n(b.price)),
            f('qty', n(b.quant)),
            f('amount', n(b.total))
          )
        },

  buy: (b) => ({
    subtitle: b.projectName
      ? K('lev.list.sub.seller', { name: b.projectName })
      : T(rowSubtitle(b)),
    facts: chips(f('price', n(b.price)), f('qty', n(b.quant)), f('amount', n(b.total)))
  }),

  // `hervachti` and `shear` are *arrays* off the transfer's tosplit (the split
  // rows and the per-member entitlements), not a name and not a count — feeding
  // either to a text slot printed "[object Object]". The only thing a transfer
  // row can say beyond the two names is which side of it the user is on, which
  // is what `kind` already carries.
  vidu: (b) => ({
    title:
      b.sendname && b.resname
        ? K('lev.list.title.transfer', { from: b.sendname, to: b.resname })
        : (T(b.resname) ?? T(b.projectName)),
    subtitle:
      b.kind === 'send'
        ? K('lev.list.sub.transferSend')
        : b.kind === 'recive'
          ? K('lev.list.sub.transferRecive')
          : K('lev.list.sub.transfer'),
    facts: chips(f('amount', n(b.amount)), f('shares', n(b.shear?.length)))
  }),

  sitesharepay: (b) => ({
    title: K('lev.list.title.sitesharepay'),
    // Not `fromRikma`: the processor already sets `projectName` to the giving
    // rikma, so naming it here would print it twice on one row — once as the
    // description and again in the footer.
    subtitle: K('lev.list.sub.siteSharePay'),
    facts: chips(f('amount', n(b.amount)))
  }),

  sitesharedecide: (b) => ({
    title: K('lev.list.title.sitesharedecide'),
    subtitle: K('lev.list.sub.siteShareDecide'),
    facts: chips(f('amount', n(b.proposedAmount)), f('basis', n(b.basisAmount)))
  }),

  stipendpay: (b) => ({
    title: T(b.recipientName) ?? K('lev.list.title.stipendpay'),
    subtitle: K('lev.list.sub.stipendCycle'),
    facts: chips(
      f('hours', n(b.hours)),
      f('rate', n(b.stipendRate)),
      f('amount', n(b.amount))
    )
  }),

  stipendconfirm: (b) => ({
    title: T(b.funderName) ?? K('lev.list.title.stipendconfirm'),
    subtitle: K('lev.list.sub.stipendSent'),
    facts: chips(
      f('amount', n(b.amount)),
      f('hours', n(b.hours)),
      f('rate', n(b.stipendRate))
    )
  }),

  // Informational, not a to-do. The funder's name is the title because "who
  // owes me this" is the question the recipient is actually asking.
  stipendaccrued: (b) => ({
    title: T(b.funderName) ?? K('lev.list.title.stipendaccrued'),
    subtitle: K('lev.list.sub.stipendAccrued'),
    facts: chips(
      f('amount', n(b.amount)),
      f('hours', n(b.hours)),
      f('rate', n(b.stipendRate))
    )
  })
};

/**
 * The kind label a row (and the expanded sheet's header) should show. Mostly
 * `ani`, but a few kinds carry a sub-kind the card names differently — a
 * site-share income sale is not "a sale", and an `archObject` whose decision is
 * an `editObject` is not "an archive".
 */
export function rowKindKey(item) {
  const ani = item?.ani;
  if (ani === 'sale' && item?.isSiteShareIncome) return 'lev.list.kind.saleIncome';
  if (ani === 'archObject') {
    if (item?.archive?.kind === 'editObject') return 'lev.list.kind.editObject';
    if (item?.archive?.scope === 'release') return 'lev.list.kind.releaseObject';
  }
  if (ani === 'stipend' && item?.stipend?.kind === 'stipendProgram')
    return 'lev.list.kind.stipendProgram';
  if (ani === 'hachla') {
    if (item?.kind === 'saleClaim') return 'lev.list.kind.saleClaim';
    if (item?.kind === 'sheirutpends') return 'lev.list.kind.newService';
    if (item?.kind === 'pic') return 'lev.list.kind.picVote';
  }
  return kindLabelKey(ani);
}

/**
 * Everything a row needs to render, per kind. Always returns a title (falling
 * back through the generic name fields to the project) so no row is ever blank.
 *
 * @param {any} item a DisplayItem off finalSwiperArray
 * @returns {RowContent}
 */
export function rowContent(item) {
  const built = ROW_CONTENT[item?.ani]?.(item ?? {}) ?? {};
  const generic = rowSubtitle(item);
  return {
    kindKey: rowKindKey(item),
    title: built.title ?? T(rowTitle(item)),
    subtitle: built.subtitle ?? T(generic),
    facts: built.facts?.length ? built.facts : rowFacts(item)
  };
}

/**
 * What the row's primary button should say. It always does the same thing —
 * open the full card — but a button that names the pending act ("to vote", "to
 * pay") is what makes a scrolled list scannable, and the grouping is coarse on
 * purpose: four verbs, not twenty.
 */
const CTA_BY_ANI = {
  haluk: 'vote',
  sheirutp: 'vote',
  pends: 'vote',
  pmashes: 'vote',
  hachla: 'vote',
  archObject: 'vote',
  stipend: 'vote',
  huca: 'answer',
  meData: 'answer',
  askedcoin: 'answer',
  askedm: 'answer',
  wegets: 'answer',
  fiapp: 'answer',
  wishoffer: 'answer',
  sitesharepay: 'pay',
  stipendpay: 'pay',
  sale: 'confirm',
  buy: 'confirm',
  vidu: 'confirm',
  stipendconfirm: 'confirm',
  stipendaccrued: 'view',
  sitesharedecide: 'confirm',
  mtaha: 'view',
  walcomen: 'view'
};

/** Translation key for the row's primary button. */
export function rowCtaKey(item) {
  if (!rowIsActionable(item)) return 'lev.list.cta.view';
  return `lev.list.cta.${CTA_BY_ANI[item?.ani] ?? 'view'}`;
}
