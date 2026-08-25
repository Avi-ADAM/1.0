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
 * The gilt the original coins lettered with (`missionInProgress`'s rim
 * gradient), as ordered stops. One shared `<linearGradient>` serves the whole
 * field — the originals defined one *per coin*, which is part of why 137 of
 * them cost 31,540 DOM nodes.
 */
export const RIM_GILT = ['#bd8328', '#fbec9b', '#f6e9a0', '#bd984a', '#faf994', '#bd8524'];

/** The dark the originals stroked their lettering with, so gilt reads on any face. */
export const RIM_STROKE = 'rgb(63, 56, 18)';
