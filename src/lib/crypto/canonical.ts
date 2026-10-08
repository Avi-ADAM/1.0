// Deterministic JSON serialization — RFC 8785 (JCS) plus two rules of ours.
// The normative description is docs/SPEC_CONSENT_FORMAT.md §2, and the
// cross-language contract is spec/consent-v1/canonical.json: any
// implementation (this one, a future Rust/WASM core) must reproduce it byte
// for byte.
//
// - object keys sorted by UTF-16 code units (JS `<`, NOT UTF-8 byte order —
//   they differ for astral characters vs U+E000–U+FFFF)
// - strings emitted with JSON.stringify, after NFC normalization (ours —
//   JCS has no normalization step)
// - object keys NFC-normalized too, and sorted AFTER normalization; two keys
//   that collapse to the same NFC form are an error, not a silent overwrite
// - a lone surrogate anywhere (string or key) is an error (ours): no strict
//   UTF-8 implementation can even hold one, so a body carrying it could be
//   verified by JS and by nothing else
// - numbers: finite only, via JSON.stringify (= ECMAScript Number::toString,
//   which is what JCS specifies; -0 → "0")
// - no whitespace
// - undefined values are dropped (matches JSON.stringify behavior)
// - arrays preserve order

export type JsonValue =
  | null
  | boolean
  | number
  | string
  | JsonValue[]
  | { [k: string]: JsonValue | undefined };

// A high surrogate not followed by a low one, or a low one not preceded by a
// high one.
const LONE_SURROGATE = /[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/;

function portableString(s: string): string {
  if (LONE_SURROGATE.test(s)) throw new Error('canonicalize: lone surrogate');
  return s.normalize('NFC');
}

export function canonicalize(value: JsonValue): string {
  if (value === null) return 'null';
  const t = typeof value;
  if (t === 'boolean') return value ? 'true' : 'false';
  if (t === 'number') {
    if (!Number.isFinite(value as number)) {
      throw new Error('canonicalize: non-finite number');
    }
    return JSON.stringify(value);
  }
  if (t === 'string') return JSON.stringify(portableString(value as string));
  if (Array.isArray(value)) {
    return '[' + value.map((v) => canonicalize(v as JsonValue)).join(',') + ']';
  }
  if (t === 'object') {
    const obj = value as { [k: string]: JsonValue | undefined };
    const entries: [string, JsonValue][] = [];
    for (const k of Object.keys(obj)) {
      if (obj[k] === undefined) continue;
      entries.push([portableString(k), obj[k] as JsonValue]);
    }
    entries.sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
    const parts: string[] = [];
    for (let i = 0; i < entries.length; i++) {
      const [k, v] = entries[i];
      if (i > 0 && entries[i - 1][0] === k) {
        throw new Error('canonicalize: duplicate key after NFC normalization');
      }
      parts.push(JSON.stringify(k) + ':' + canonicalize(v));
    }
    return '{' + parts.join(',') + '}';
  }
  throw new Error('canonicalize: unsupported type ' + t);
}

export function canonicalBytes(value: JsonValue): Uint8Array<ArrayBuffer> {
  return new TextEncoder().encode(canonicalize(value)) as Uint8Array<ArrayBuffer>;
}
