// Money primitives — bigint of agorot (1/100 of a shekel-equivalent).
//
// Decision D-12: every monetary value in the chain is a bigint of "minor units"
// (cents, agorot, etc. — 1/100 of the major unit). NEVER Decimal/float. Floats
// in JSON canonicalization break Merkle proofs irreparably. This must be set
// once, before any signed events carry money. After that, changing the unit
// breaks every prior proof. So: set, lock, build on top.
//
// All multi-currency support lives at the *display* layer; the chain stores
// (amount: bigint, code: string).

export type Currency = string;   // ISO-4217 (ILS, USD) or local code from matbea

export type Money = {
  amount: bigint;                // minor units (agorot)
  code: Currency;
};

export const MINOR_PER_MAJOR = 100n;

export function money(major: number | string, code: Currency): Money {
  return { amount: majorToMinor(major), code };
}

export function moneyFromMinor(amount: bigint | number | string, code: Currency): Money {
  return {
    amount: typeof amount === 'bigint' ? amount : BigInt(amount),
    code
  };
}

export function majorToMinor(major: number | string): bigint {
  // Parse a decimal string with up to 2 fractional digits to a bigint of minor.
  const s = typeof major === 'number' ? major.toString() : major.trim();
  if (s === '' || s === '-' || s === '.') throw new Error('majorToMinor: empty');
  const negative = s.startsWith('-');
  const body = negative ? s.slice(1) : s;
  const [whole, frac = ''] = body.split('.');
  if (!/^\d+$/.test(whole) || (frac && !/^\d+$/.test(frac))) {
    throw new Error(`majorToMinor: invalid number ${major}`);
  }
  // Round to 2 fractional digits (half-up). Reject silently-truncated values
  // by requiring the caller to pass at most 2 digits.
  if (frac.length > 2) {
    throw new Error(`majorToMinor: too many fractional digits in ${major}; pass at most 2`);
  }
  const padded = (frac + '00').slice(0, 2);
  const value = BigInt(whole) * MINOR_PER_MAJOR + BigInt(padded);
  return negative ? -value : value;
}

export function minorToMajorString(minor: bigint): string {
  const negative = minor < 0n;
  const abs = negative ? -minor : minor;
  const whole = abs / MINOR_PER_MAJOR;
  const frac = abs % MINOR_PER_MAJOR;
  const fracStr = frac.toString().padStart(2, '0');
  return (negative ? '-' : '') + whole.toString() + '.' + fracStr;
}

export function addMoney(a: Money, b: Money): Money {
  if (a.code !== b.code) throw new Error(`addMoney: currency mismatch ${a.code} != ${b.code}`);
  return { amount: a.amount + b.amount, code: a.code };
}

export function subMoney(a: Money, b: Money): Money {
  if (a.code !== b.code) throw new Error(`subMoney: currency mismatch ${a.code} != ${b.code}`);
  return { amount: a.amount - b.amount, code: a.code };
}

// Multiply by an integer ratio (numerator/denominator) — never by a float.
// Floor-divides; the caller may need to handle the remainder explicitly (e.g.,
// when distributing N units across K members, the last receives the residual).
export function mulRatio(m: Money, numerator: bigint, denominator: bigint): Money {
  if (denominator === 0n) throw new Error('mulRatio: zero denominator');
  return { amount: (m.amount * numerator) / denominator, code: m.code };
}

export function eqMoney(a: Money, b: Money): boolean {
  return a.code === b.code && a.amount === b.amount;
}

export function isZero(m: Money): boolean {
  return m.amount === 0n;
}

// Distribute `total` into `weights.length` shares, proportional to weights.
// Returns shares whose sum is exactly `total`. The last share absorbs the
// rounding residual. This is the canonical way to split hervachti.
export function distribute(total: Money, weights: bigint[]): Money[] {
  if (weights.length === 0) throw new Error('distribute: empty weights');
  const sum = weights.reduce((s, w) => s + w, 0n);
  if (sum <= 0n) throw new Error('distribute: non-positive sum of weights');
  const shares: Money[] = [];
  let allocated = 0n;
  for (let i = 0; i < weights.length - 1; i++) {
    const share = (total.amount * weights[i]) / sum;
    shares.push({ amount: share, code: total.code });
    allocated += share;
  }
  shares.push({ amount: total.amount - allocated, code: total.code });
  return shares;
}

// Canonical serialization: a tuple-shaped object so JCS keeps the order
// deterministic. `amount` as a base-10 string to keep it human-readable AND
// JCS-safe (bigint isn't JSON-native).
export type MoneySerialized = { amount: string; code: Currency };

export function serializeMoney(m: Money): MoneySerialized {
  return { amount: m.amount.toString(), code: m.code };
}

export function parseMoney(s: MoneySerialized): Money {
  if (typeof s?.amount !== 'string' || typeof s?.code !== 'string') {
    throw new Error('parseMoney: bad shape');
  }
  return { amount: BigInt(s.amount), code: s.code };
}
