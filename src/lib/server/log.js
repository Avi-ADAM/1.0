// Structured server logging — one JSON object per line on stdout/stderr.
//
// Why not a library: the only thing the shipper needs is a parseable line, and
// the runtime already gives us `console`. `vector.toml` on the VPS reads every
// container's stdout through the Docker API, parses the JSON and lifts these
// fields into Axiom (`level`, `msg`, `reqId`, …). On Vercel the same lines go
// out through the platform's log drain into the same Axiom account. Free-text
// `console.log('foo', obj)` lands there as one opaque blob and cannot be
// filtered or aggregated — that is the whole difference this module makes.
//
// Usage:
//   import { log } from '$lib/server/log.js';
//   log.info('sale created', { saleId, projectId });
//   const rlog = log.child({ reqId });   // every line carries reqId
//
// Level comes from LOG_LEVEL (trace|debug|info|warn|error|fatal, default info).
// Outside production the output is human-readable text instead of JSON, so the
// dev terminal stays readable; set LOG_FORMAT=json to force machine output.
//
// NEVER pass raw tokens/cookies/passwords: the field names below are redacted
// as a safety net, but the net only catches what it recognises.

const LEVELS = { trace: 10, debug: 20, info: 30, warn: 40, error: 50, fatal: 60 };

const isProd = process.env.NODE_ENV === 'production';

function currentThreshold() {
  const raw = String(process.env.LOG_LEVEL || '').toLowerCase();
  if (raw in LEVELS) return LEVELS[/** @type {keyof typeof LEVELS} */ (raw)];
  return isProd ? LEVELS.info : LEVELS.debug;
}

function asJson() {
  const fmt = String(process.env.LOG_FORMAT || '').toLowerCase();
  if (fmt === 'json') return true;
  if (fmt === 'pretty' || fmt === 'text') return false;
  return isProd;
}

/** Keys whose value is never safe to ship to a log aggregator. */
const SECRET_KEY = /token|jwt|secret|password|passwd|authorization|cookie|api[-_]?key|credential|signature/i;

const MAX_DEPTH = 4;
const MAX_ARRAY = 20;
const MAX_STRING = 2000;

/**
 * Make an arbitrary value safe to `JSON.stringify`: no cycles, no unbounded
 * depth or size, no obvious secrets, Errors turned into readable objects.
 * @param {unknown} value
 * @param {number} depth
 * @param {WeakSet<object>} seen
 * @returns {unknown}
 */
function sanitize(value, depth, seen) {
  if (value === null || value === undefined) return value;

  const t = typeof value;
  if (t === 'string') return value.length > MAX_STRING ? value.slice(0, MAX_STRING) + '…' : value;
  if (t === 'number') return Number.isFinite(value) ? value : String(value);
  if (t === 'boolean') return value;
  if (t === 'bigint') return String(value);
  if (t === 'function' || t === 'symbol') return undefined;

  if (value instanceof Error) {
    return {
      name: value.name,
      message: value.message,
      stack: typeof value.stack === 'string' ? value.stack.slice(0, 4000) : undefined,
      // `cause` is where fetch/undici hides the real reason (ECONNREFUSED …).
      cause: value.cause ? sanitize(value.cause, depth + 1, seen) : undefined
    };
  }
  if (value instanceof Date) return value.toISOString();

  const obj = /** @type {object} */ (value);
  if (seen.has(obj)) return '[circular]';
  if (depth >= MAX_DEPTH) return Array.isArray(value) ? '[array]' : '[object]';
  seen.add(obj);

  if (Array.isArray(value)) {
    const out = value.slice(0, MAX_ARRAY).map((v) => sanitize(v, depth + 1, seen));
    if (value.length > MAX_ARRAY) out.push(`…${value.length - MAX_ARRAY} more`);
    return out;
  }

  /** @type {Record<string, unknown>} */
  const out = {};
  for (const [k, v] of Object.entries(obj)) {
    if (SECRET_KEY.test(k)) {
      out[k] = '[redacted]';
      continue;
    }
    const clean = sanitize(v, depth + 1, seen);
    if (clean !== undefined) out[k] = clean;
  }
  return out;
}

/**
 * @param {string} level
 * @param {Record<string, unknown>} record
 */
function write(level, record) {
  // error/fatal on stderr: Docker tags the stream, so a "show me only stderr"
  // query in Axiom keeps working even for lines we failed to parse.
  const sink = LEVELS[/** @type {keyof typeof LEVELS} */ (level)] >= LEVELS.error ? console.error : console.log;

  if (asJson()) {
    let line;
    try {
      line = JSON.stringify(record);
    } catch {
      // sanitize() should have made this impossible; never let logging throw.
      line = JSON.stringify({ level, time: record.time, msg: String(record.msg) });
    }
    sink(line);
    return;
  }

  const { level: _l, time: _t, msg, ...rest } = record;
  const extra = Object.keys(rest).length ? ' ' + JSON.stringify(rest) : '';
  sink(`[${level}] ${msg}${extra}`);
}

/**
 * @typedef {Object} Logger
 * @property {(msg: string, fields?: any) => void} trace
 * @property {(msg: string, fields?: any) => void} debug
 * @property {(msg: string, fields?: any) => void} info
 * @property {(msg: string, fields?: any) => void} warn
 * @property {(msg: string, fields?: any) => void} error
 * @property {(msg: string, fields?: any) => void} fatal
 * @property {(bindings: Record<string, unknown>) => Logger} child
 */

/**
 * @param {Record<string, unknown>} bindings
 * @returns {Logger}
 */
export function createLogger(bindings = {}) {
  /**
   * @param {keyof typeof LEVELS} level
   */
  const at = (level) =>
    /** @param {string} msg @param {any} [fields] */
    (msg, fields) => {
      if (LEVELS[level] < currentThreshold()) return;
      const seen = new WeakSet();
      /** @type {Record<string, unknown>} */
      const record = { level, time: new Date().toISOString(), msg: String(msg) };
      for (const [k, v] of Object.entries(bindings)) record[k] = sanitize(v, 1, seen);
      if (fields !== undefined && fields !== null) {
        // A bare Error/string second argument is common at call sites; keep it
        // rather than dropping it on the floor.
        if (fields instanceof Error) record.err = sanitize(fields, 1, seen);
        else if (typeof fields !== 'object') record.data = sanitize(fields, 1, seen);
        else {
          const clean = /** @type {Record<string, unknown>} */ (sanitize(fields, 1, seen));
          for (const [k, v] of Object.entries(clean)) {
            if (k !== 'level' && k !== 'time' && k !== 'msg') record[k] = v;
          }
        }
      }
      write(level, record);
    };

  /** @type {Logger} */
  const logger = {
    trace: at('trace'),
    debug: at('debug'),
    info: at('info'),
    warn: at('warn'),
    error: at('error'),
    fatal: at('fatal'),
    child: (extra) => createLogger({ ...bindings, ...extra })
  };
  return logger;
}

/** Process-wide logger. Prefer `log.child({ reqId })` inside a request. */
export const log = createLogger();

/**
 * Correlation id for one request. Reuses an incoming `x-request-id` (so a call
 * chain that starts on Vercel and ends on the VPS shares one id in Axiom) and
 * falls back to a fresh uuid.
 * @param {Request} [request]
 */
export function requestId(request) {
  const incoming = request?.headers?.get?.('x-request-id');
  if (incoming && /^[\w.:-]{8,120}$/.test(incoming)) return incoming;
  try {
    return crypto.randomUUID();
  } catch {
    return Math.random().toString(36).slice(2) + Date.now().toString(36);
  }
}
