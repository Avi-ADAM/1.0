/**
 * Never let a Strapi error reach an agent as an empty result.
 *
 * GraphQL answers a partially-forbidden query with BOTH `data` (the readable
 * half, the rest nulled) and `errors`. `sendToSer` hands that straight back, and
 * every tool that mapped `data` and ignored `errors` reported "0 results" for
 * what was really "you are not allowed to read this". It showed up against the
 * live backend: the api-key lacks `find` on message / pgisha / pgishauser /
 * ratson-proposal / partof, so wish proposals came back as an empty list rather
 * than as a problem. An agent cannot tell those apart, and neither could we.
 *
 * So: a tool either got its data, or says it did not.
 */

export interface StrapiErrorSummary {
  /** Distinct error messages, deduplicated — a partial denial repeats one message per field. */
  messages: string[];
  /** True when every message is a permission refusal, which is an operator problem, not a caller one. */
  forbidden: boolean;
}

/** Reads the `errors` array of a GraphQL response, if it has one. */
export function strapiErrors(res: any): StrapiErrorSummary | null {
  const errors = res?.errors ?? res?.data?.errors;
  if (!Array.isArray(errors) || errors.length === 0) return null;

  const messages = [...new Set(errors.map((e: any) => String(e?.message ?? 'Unknown error')))];
  return {
    messages,
    forbidden: messages.every((m) => /forbidden/i.test(m))
  };
}

/**
 * Logs the real reason and returns the sentence the agent should see, or null
 * when the response is clean.
 */
export function describeStrapiFailure(res: any, tag: string): string | null {
  const summary = strapiErrors(res);
  if (!summary) return null;

  console.error(`[${tag}] Strapi returned errors:`, summary.messages.join(' | '));
  return summary.forbidden
    ? 'Part of this data is not readable with the platform’s service credentials, so the answer would be incomplete. Reported to the maintainers — do not treat it as "nothing found".'
    : 'The backend returned an error, so the answer would be incomplete. Try again shortly.';
}
