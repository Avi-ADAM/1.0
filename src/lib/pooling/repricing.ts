/**
 * How a departure's price moves reach its participants — PLAN_POOL_PRODUCT §4.2.
 * Pure: the server wires it to Strapi and to the notifier.
 *
 * Every move is measured from the last price the participants were *told*
 * (`price_announced`), not from the last price stored, so moves that happen
 * inside an open notice window merge into one notice at its end (§4.2, the
 * cascade of exits). Until the lock nothing is closed: a participant may leave
 * at any moment with a full refund (§1ב) — the window decides only what her
 * silence means.
 */

export type Move = 'none' | 'down' | 'upWithin' | 'aboveEnvelope';

/**
 * One participant's view of a move. Above her own ceiling — the price, or the
 * departure's ceiling itself after a BOM update (B7) — needs her explicit yes;
 * silence there is not consent (§1ב, as C-19).
 */
export function classifyMove(
	oldPrice: number,
	newPrice: number,
	envelopeAtSign: number | null | undefined,
	envelopeNow?: number | null
): Move {
	const own = envelopeAtSign == null ? null : Number(envelopeAtSign);
	if (own != null && Number.isFinite(own)) {
		if (newPrice > own + 1e-9) return 'aboveEnvelope';
		if (envelopeNow != null && Number(envelopeNow) > own + 1e-9) return 'aboveEnvelope';
	}
	if (Math.abs(newPrice - oldPrice) < 1e-9) return 'none';
	return newPrice < oldPrice ? 'down' : 'upWithin';
}

export type Participant = {
	memberId: string;
	userId: string | null;
	envelopeAtSign: number | null;
	/**
	 * Set only when she was asked for an explicit yes (above her ceiling), so
	 * that silence at its end can mean "out". A plain notice of a rise opens no
	 * personal window: her silence there means "stays", and leaving is free
	 * anyway until the lock.
	 */
	windowUntilMs?: number | null;
};

export type Notice = { memberId: string; userId: string | null; move: Exclude<Move, 'none'> };

export type Announcement =
	| { action: 'none' }
	/** A window is still open: the move waits for its end and merges (§4.2). */
	| { action: 'defer'; untilMs: number }
	/** First sight of this departure: remember the price, tell nobody. */
	| { action: 'baseline'; price: number }
	| {
			action: 'announce';
			price: number;
			from: number;
			notices: Notice[];
			/**
			 * End of the new notice window — moves until then merge into the next
			 * notice. Also the personal window of everyone asked for a yes.
			 */
			windowUntilMs: number;
	  };

export function planAnnouncement(input: {
	priceNow: number;
	envelopeNow: number | null;
	announced: number | null;
	noticeUntilMs: number | null;
	nowMs: number;
	windowMs: number;
	participants: Participant[];
}): Announcement {
	const { priceNow, envelopeNow, announced, noticeUntilMs, nowMs, windowMs, participants } = input;
	if (announced == null || !Number.isFinite(Number(announced))) {
		return { action: 'baseline', price: priceNow };
	}
	const moves = participants.map((p) => ({
		p,
		move: classifyMove(Number(announced), priceNow, p.envelopeAtSign, envelopeNow)
	}));
	// Someone already asked for her yes is not asked again: her answer, or her
	// window's end (lapsedConsents), decides.
	const fresh = moves.filter(
		({ p, move }) => move !== 'none' && !(move === 'aboveEnvelope' && p.windowUntilMs != null)
	);
	if (fresh.length === 0) return { action: 'none' };
	if (noticeUntilMs != null && noticeUntilMs > nowMs) return { action: 'defer', untilMs: noticeUntilMs };

	const notices = fresh.map(({ p, move }) => ({
		memberId: p.memberId,
		userId: p.userId,
		move: move as Exclude<Move, 'none'>
	}));
	// Every notice opens the window, a drop too: twelve joins in a day are one
	// notice at its end, not twelve.
	return { action: 'announce', price: priceNow, from: Number(announced), notices, windowUntilMs: nowMs + windowMs };
}

/**
 * Whose window ran out without the yes a price above her ceiling needs. She
 * returns to `interested`, is not charged, and gets back what she paid (§4.2).
 */
export function lapsedConsents(
	participants: Participant[],
	priceNow: number,
	envelopeNow: number | null,
	nowMs: number
): Participant[] {
	return participants.filter((p) => {
		if (p.windowUntilMs == null || p.windowUntilMs > nowMs) return false;
		return classifyMove(priceNow, priceNow, p.envelopeAtSign, envelopeNow) === 'aboveEnvelope';
	});
}
