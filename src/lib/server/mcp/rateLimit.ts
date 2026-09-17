/**
 * Per-key token buckets for MCP tool calls (PLAN_MCP_TOOLS_V2 §1.8).
 *
 * In-process on purpose: it bounds a runaway agent loop and LLM spend on one
 * instance with no new infrastructure. Behind N instances the effective limit
 * is N× — acceptable for a guard against loops, not a billing meter.
 */

export type McpBucket = 'read' | 'write' | 'ai';

interface BucketSpec {
  capacity: number;
  refillPerMs: number;
}

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;

export const BUCKETS: Record<McpBucket, BucketSpec> = {
  read: { capacity: 120, refillPerMs: 120 / MINUTE },
  write: { capacity: 20, refillPerMs: 20 / MINUTE },
  // Every call here is a Gemini run the platform pays for.
  ai: { capacity: 10, refillPerMs: 10 / HOUR }
};

const state = new Map<string, { tokens: number; at: number }>();
const MAX_ENTRIES = 10_000;

export function consume(
  identity: string,
  bucket: McpBucket,
  now: number = Date.now()
): { ok: boolean; retryAfterSeconds?: number } {
  const spec = BUCKETS[bucket];
  const key = `${identity}:${bucket}`;
  const prev = state.get(key);
  const tokens = prev
    ? Math.min(spec.capacity, prev.tokens + (now - prev.at) * spec.refillPerMs)
    : spec.capacity;

  if (tokens < 1) {
    state.set(key, { tokens, at: now });
    return { ok: false, retryAfterSeconds: Math.max(1, Math.ceil((1 - tokens) / spec.refillPerMs / 1000)) };
  }

  if (!prev && state.size >= MAX_ENTRIES) {
    // Idle keys refill to full anyway; dropping the oldest loses nothing real.
    const oldest = state.keys().next().value;
    if (oldest) state.delete(oldest);
  }
  state.set(key, { tokens: tokens - 1, at: now });
  return { ok: true };
}

/** Test helper. */
export function resetRateLimits(): void {
  state.clear();
}
