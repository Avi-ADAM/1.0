/**
 * The price of a product as a function of how many people share it —
 * PLAN_POOL_PRODUCT §3. The single source of truth: never recompute a
 * group price at a call site (the same rule as `computeStipendEquity`).
 *
 * Every BOM line has a cost shape:
 *   perUnit  (null = legacy)  — c × n        (a flight, a meal, one order's picking)
 *   shared                    — c            (the guide, route planning)
 *   stepped  + stepCapacity k — ⌈n/k⌉ × c    (a bus for 20, a room for two)
 *
 * The price per participant is always derived — `cost(n)/n × (1 + margin)` —
 * so a growing group's saving reaches its participants and the rikma keeps
 * its margin and nothing more (§1א).
 */

export type CostShape = 'perUnit' | 'shared' | 'stepped';
export type PriceMode = 'fixed' | 'atCost';

export type BomLine = {
	/** Cost of the line for one unit of the product (see missionLineCost / resourceLineCost). */
	cost: number;
	costShape?: CostShape | string | null;
	stepCapacity?: number | null;
	/** `atCost` lines are personal (§6.2) and never enter the group curve. */
	priceMode?: PriceMode | string | null;
};

export type CurvePoint = { n: number; price: number };

/** With no `max`, the envelope searches up to min × 10, never beyond this. */
export const HORIZON_CAP = 500;

const num = (v: unknown): number => {
	const x = Number(v);
	return Number.isFinite(x) ? x : 0;
};

/** A mission line: hours × units × rate. */
export function missionLineCost(m: {
	hoursPerUnit?: unknown;
	unitsPerProduct?: unknown;
	ratePerHour?: unknown;
}): number {
	const units = m.unitsPerProduct == null || m.unitsPerProduct === '' ? 1 : num(m.unitsPerProduct);
	return num(m.hoursPerUnit) * (units || 1) * num(m.ratePerHour);
}

/** A resource line: quantity × price. */
export function resourceLineCost(r: { quantityPerUnit?: unknown; pricePerUnit?: unknown }): number {
	return num(r.quantityPerUnit) * num(r.pricePerUnit);
}

/**
 * The shape a line actually behaves with. null / unknown ⇒ perUnit (legacy), and
 * a `stepped` line without a usable capacity is perUnit too — k=1 is the same thing.
 */
export function effectiveShape(line: Pick<BomLine, 'costShape' | 'stepCapacity'>): {
	shape: CostShape;
	k: number;
} {
	if (line.costShape === 'shared') return { shape: 'shared', k: 1 };
	if (line.costShape === 'stepped') {
		const k = Math.floor(num(line.stepCapacity));
		if (k > 1) return { shape: 'stepped', k };
	}
	return { shape: 'perUnit', k: 1 };
}

/**
 * What to store for a line's shape, or null when there is nothing to store —
 * perUnit stays null (legacy), so an untouched line writes exactly as before.
 */
export function storedCostShape(
	line: Pick<BomLine, 'costShape' | 'stepCapacity'>
): { costShape: Exclude<CostShape, 'perUnit'>; stepCapacity: number | null } | null {
	const { shape, k } = effectiveShape(line);
	if (shape === 'shared') return { costShape: 'shared', stepCapacity: null };
	if (shape === 'stepped') return { costShape: 'stepped', stepCapacity: k };
	return null;
}

function inCurve(line: BomLine): boolean {
	return line.priceMode !== 'atCost';
}

function groupSize(n: number): number {
	const x = Math.floor(num(n));
	return x >= 1 ? x : 1;
}

/** How many instances of the line a group of n consumes. */
export function lineUnitsAt(line: BomLine, n: number): number {
	const size = groupSize(n);
	const { shape, k } = effectiveShape(line);
	if (shape === 'shared') return 1;
	if (shape === 'stepped') return Math.ceil(size / k);
	return size;
}

export function lineCostAt(line: BomLine, n: number): number {
	return num(line.cost) * lineUnitsAt(line, n);
}

export function costAt(bom: BomLine[], n: number): number {
	let total = 0;
	for (const line of bom) if (inCurve(line)) total += lineCostAt(line, n);
	return total;
}

/** Round up to the cent; the epsilon absorbs float noise (95450.0000001 is 95450). */
function ceilCents(x: number): number {
	// `|| 0`: an empty BOM would otherwise round to -0 and render as "-0".
	return Math.ceil(x * 100 - 1e-6) / 100 || 0;
}

/** The price per participant in a group of n, rounded up to the cent. */
export function priceAt(bom: BomLine[], n: number, marginPct = 0): number {
	const size = groupSize(n);
	return ceilCents((costAt(bom, size) / size) * (1 + num(marginPct) / 100));
}

/** The n range a departure can actually be at — [min, max ?? min×10 capped]. */
export function curveRange(min: number, max?: number | null): { from: number; to: number } {
	const from = groupSize(min);
	const cap = Math.max(from, Math.min(from * 10, HORIZON_CAP));
	const to = max != null && num(max) >= from ? Math.floor(num(max)) : cap;
	return { from, to };
}

export function curve(
	bom: BomLine[],
	min: number,
	max: number | null | undefined,
	marginPct = 0
): CurvePoint[] {
	const { from, to } = curveRange(min, max);
	const out: CurvePoint[] = [];
	for (let n = from; n <= to; n++) out.push({ n, price: priceAt(bom, n, marginPct) });
	return out;
}

/**
 * The highest price the curve can reach inside the departure's range — the
 * ceiling a participant agrees to when she joins (§1ב). Not the price at
 * `min`: a stepped line can make a larger group dearer (§3.3).
 */
export function envelope(
	bom: BomLine[],
	min: number,
	max: number | null | undefined,
	marginPct = 0
): CurvePoint {
	let best: CurvePoint = { n: groupSize(min), price: -Infinity };
	for (const p of curve(bom, min, max, marginPct)) if (p.price > best.price) best = p;
	return best;
}

/**
 * The group sizes at which one more participant makes it dearer for everyone
 * already in — where the form warns, and where a joiner waits (§4.3).
 */
export function risingPoints(
	bom: BomLine[],
	min: number,
	max: number | null | undefined,
	marginPct = 0
): CurvePoint[] {
	const pts = curve(bom, min, max, marginPct);
	const out: CurvePoint[] = [];
	for (let i = 1; i < pts.length; i++) if (pts[i].price > pts[i - 1].price) out.push(pts[i]);
	return out;
}

/** The first larger group (within max) at which the price is lower than at n. */
export function nextDrop(
	bom: BomLine[],
	n: number,
	max: number | null | undefined,
	marginPct = 0
): CurvePoint | null {
	const size = groupSize(n);
	const here = priceAt(bom, size, marginPct);
	const { to } = curveRange(size, max);
	for (let m = size + 1; m <= to; m++) {
		const price = priceAt(bom, m, marginPct);
		if (price < here) return { n: m, price };
	}
	return null;
}

/**
 * How much work a group of n actually needs, per line (§3.1, §5):
 *   shared  — one instance, the line's fixed hours / quantity;
 *   perUnit — one instance scaled × n (a personal photo shoot for each traveller);
 *   stepped — ⌈n/k⌉ separate instances (a guide for every 15).
 * `scale` multiplies the line's per-unit hours or quantity inside one instance.
 * The equity of whoever holds a shared mission does not depend on n — only the
 * customer's price is divided.
 */
export function workAt<L extends BomLine>(
	bom: L[],
	n: number
): Array<{ line: L; instances: number; scale: number }> {
	const size = groupSize(n);
	return bom.map((line) => {
		const { shape, k } = effectiveShape(line);
		if (shape === 'shared') return { line, instances: 1, scale: 1 };
		if (shape === 'stepped') return { line, instances: Math.ceil(size / k), scale: 1 };
		return { line, instances: 1, scale: size };
	});
}

/** Recipe rows (mission + resource) as curve lines. */
export function toBomLines(
	missions: Array<Parameters<typeof missionLineCost>[0] & Partial<BomLine>>,
	resources: Array<Parameters<typeof resourceLineCost>[0] & Partial<BomLine>>
): BomLine[] {
	return [
		...missions.map((m) => ({
			cost: missionLineCost(m),
			costShape: m.costShape ?? null,
			stepCapacity: m.stepCapacity ?? null
		})),
		...resources.map((r) => ({
			cost: resourceLineCost(r),
			costShape: r.costShape ?? null,
			stepCapacity: r.stepCapacity ?? null,
			priceMode: r.priceMode ?? null
		}))
	];
}

/** True when any line's cost depends on the group (the product has a curve). */
export function hasGroupCurve(bom: BomLine[]): boolean {
	return bom.some((l) => inCurve(l) && effectiveShape(l).shape !== 'perUnit' && num(l.cost) > 0);
}
