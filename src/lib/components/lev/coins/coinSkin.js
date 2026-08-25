/**
 * coinSkin — the coin's two faces.
 *
 * `plate` is the readable disc built in Stage 2: a light, opaque surface, the
 * kind's accent as a ring, the project logo as a 14% watermark, and every word
 * in ordinary HTML.
 *
 * `classic` is the heart as it was first drawn — a coloured, textured coin with
 * its title curved around the rim. It is a **skin, not the old coin**: the same
 * `LevCoin` element, the same `cardKinds` metadata, the same accessible name,
 * the same clock arc, the same coverage of all 23 kinds. What comes back from
 * the original is only its *face* — the artwork each kind's coin was actually
 * painted with, harvested from the `{#if cards == false}` branches of the
 * twelve components that used to be the coin view, and the gilt rim lettering
 * `missionInProgress` used for its curved text.
 *
 * The old coins are not coming back, and nothing here depends on them: when
 * Stage 7 deletes those branches these URLs are all that survives of them, and
 * they live here rather than in twelve 3,000-line files.
 *
 * @see docs/PLAN_LEV_COINS.md
 */

const ART = 'https://res.cloudinary.com/love1/image/upload';

/** The faces themselves, named as the originals named them. */
export const FACES = {
  /** halukaask + didiget — the split and the transfer */
  prismatic: `${ART}/v1650291863/Prismatic-Low-Poly-Sphere-4_smpaxv.svg`,
  /** decisionMaking + reqtom — the decision */
  coinnn: `${ART}/v1650979768/coinnn_oatfhw.svg`,
  /** decisionMaking + reqtom's second face */
  spare: `${ART}/v1647261055/spare_gv0gui.svg`,
  /** fiappru — the completion approval */
  newcoin: `${ART}/v1643838283/newcoin_mxgoxa.svg`,
  /** reqtojoin — the join request */
  coin: `${ART}/v1643838617/coin_ngsrxn.svg`,
  /** weget — the resource received */
  flower: `${ART}/v1647379261/FLOWER-032-1_1_1_zk45tv.svg`,
  /** mashsuggest — the resource offer */
  turkiz: `${ART}/v1646313201/turkiz_v5a7c8.jpg`,
  /** projectSuggestor — the suggestion */
  cleen: `${ART}/v1643838569/cleenCoin1_xpsitt.png`,
  /** pmas — the pending resource */
  nice: `${ART}/v1646078558/niceCoin_usali2.jpg`,
  /** missionInProgress — the mission under way */
  diamond: `${ART}/v1643838415/diamondlight1_db635m.jpg`,
  /** pandingMesima — the mission awaiting a vote */
  pink: `${ART}/v1643838503/pink_qfdffz.jpg`
};

/**
 * Which face belongs to which kind.
 *
 * The first eleven are the originals, kind for kind. The rest are the money and
 * consent flows added over the last year, which never had a coin at all — they
 * take the face of the family they belong to, so the field still reads as one
 * set rather than as eleven painted coins and nine blanks.
 */
const FACE_BY_ANI = {
  // ── the originals, exactly as they were painted ──────────────────────────
  haluk: FACES.prismatic, // halukaask
  vidu: FACES.prismatic, // didiget
  mtaha: FACES.diamond, // missionInProgress
  pmashes: FACES.nice, // pmas
  pends: FACES.pink, // pandingMesima
  wegets: FACES.flower, // weget
  fiapp: FACES.newcoin, // fiappru
  askedcoin: FACES.coin, // reqtojoin
  askedm: FACES.coinnn, // reqtom
  meData: FACES.cleen, // projectSuggestor
  huca: FACES.turkiz, // mashsuggest
  hachla: FACES.coinnn, // decisionMaking

  // ── the kinds that never had one, placed by family ───────────────────────
  walcomen: FACES.cleen, // a welcome is a fresh coin
  sheirutp: FACES.turkiz, // a service request is a resource offer's twin
  wishoffer: FACES.flower, // someone answering a wish, like a resource arriving
  archObject: FACES.spare, // decisionMaking's other face, for the other decision
  stipend: FACES.coinnn, // a stipend proposal is a decision
  sale: FACES.newcoin,
  buy: FACES.coin,
  sitesharepay: FACES.newcoin,
  sitesharedecide: FACES.coinnn,
  stipendpay: FACES.newcoin,
  stipendconfirm: FACES.coin
};

/** The face for a kind. Every kind has one — an unknown one gets the decision coin. */
export function coinFace(ani) {
  return FACE_BY_ANI[ani] ?? FACES.coinnn;
}

/**
 * The gilt the rim letters with, as ordered stops top-to-bottom of the glyph.
 * One shared `<linearGradient>` serves the whole field — the originals defined
 * one *per coin*, which is part of why 137 of them cost 31,540 DOM nodes.
 *
 * This is the original ramp **with its two bronze extremes lifted**. The
 * original was
 *
 *     ['#bd8328', '#fbec9b', '#f6e9a0', '#bd984a', '#faf994', '#bd8524']
 *
 * — a light/dark/light metal ramp drawn for lettering the size of a coin's
 * whole rim. On `LevCoin` the rim label renders at 10–13px, where the dark
 * stops stop reading as *shine* and start reading as *blur*: the top and bottom
 * fifth of every glyph fell to a mid bronze, so the letter looked thinner and
 * softer than it is, and on a dark face those edges disappeared outright.
 *
 * The ramp still alternates — that is what makes it read as metal rather than
 * as flat yellow — but the deepest stop is now `#e0b356`, whose relative
 * luminance is 0.49. Against the rim well below that is **7:1**, so every band
 * of every glyph clears AA at the size it is actually drawn.
 */
export const RIM_GILT = ['#fff6c9', '#fbec9b', '#f6d979', '#e8bf5c', '#fbe89a', '#e0b356'];

/** The dark the originals stroked their lettering with, so gilt reads on any face. */
export const RIM_STROKE = 'rgb(63, 56, 18)';

/**
 * The rim well — the ground the gilt is read against.
 *
 * The stroke alone could not do this job. A coin's face is a *photograph*
 * (`diamond` is near-white, `turkiz` is mid-cyan, `pink` is bright), so what
 * sits behind the rim label was whatever the artwork happened to be doing
 * there: on three faces the gilt was light-on-light, and a 1.6px stroke on a
 * 10px glyph is not enough separation to rescue that. The plate solved the same
 * problem for the coin's middle with a soft well (`.inner`), and this is that
 * well for the rim — one arc, stroked wide, fading out at both ends so the
 * artwork still owns the coin's shoulders.
 *
 * Composited at 85% over the *brightest* face the ground lands near luminance
 * 0.026, which is what makes the contrast figures above hold for all eleven.
 */
export const RIM_WELL = '#0a0803';
export const RIM_WELL_ALPHA = 0.85;

/**
 * The well's geometry, in em of the rim font — so it tracks the label at every
 * size step instead of being tuned for one.
 *
 * `LIFT` pushes the band's centre inward from the text path, because the label
 * hangs *below* that path (`dominant-baseline: hanging`); `WIDTH` covers a
 * Hebrew glyph's full run from hanging baseline to descender, plus the stroke,
 * plus a little outward for Latin ascender overshoot.
 */
export const RIM_WELL_LIFT = 0.42;
export const RIM_WELL_WIDTH = 1.45;
