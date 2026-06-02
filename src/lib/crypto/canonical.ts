// Deterministic JSON serialization (RFC 8785 JCS, simplified for our needs).
// - object keys sorted lexicographically by UTF-16 code units
// - strings emitted with JSON.stringify (NFC normalization applied first)
// - numbers: finite only, via JSON.stringify (no trailing zeros from V8)
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
  if (t === 'string') return JSON.stringify((value as string).normalize('NFC'));
  if (Array.isArray(value)) {
    return '[' + value.map((v) => canonicalize(v as JsonValue)).join(',') + ']';
  }
  if (t === 'object') {
    const obj = value as { [k: string]: JsonValue | undefined };
    const keys = Object.keys(obj).filter((k) => obj[k] !== undefined).sort();
    const parts: string[] = [];
    for (const k of keys) {
      parts.push(JSON.stringify(k.normalize('NFC')) + ':' + canonicalize(obj[k] as JsonValue));
    }
    return '{' + parts.join(',') + '}';
  }
  throw new Error('canonicalize: unsupported type ' + t);
}

export function canonicalBytes(value: JsonValue): Uint8Array<ArrayBuffer> {
  return new TextEncoder().encode(canonicalize(value)) as Uint8Array<ArrayBuffer>;
}
