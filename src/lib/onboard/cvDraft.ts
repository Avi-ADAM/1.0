// The onboarding AI analysis draft (the review screen's input).
//
// It used to live in sessionStorage only. That survives a reload of the same
// tab, but not a new tab, a restored session or a browser restart — and when it
// was gone the review screen redirected back to step 4 without a word, silently
// throwing away the ~30s AI run and the couple of minutes of writing that fed
// it. The mirror below lets those cases recover; `load()` returning null is now
// meant to be *shown*, not redirected away from.

const KEY = 'onboard.cvResult';
const MIRROR_KEY = 'onboard.cvResult.mirror';

/** How long a mirrored draft stays usable. Long enough to survive a restart,
 *  short enough that a stale analysis never resurfaces as a surprise. */
const MAX_AGE_MS = 24 * 60 * 60 * 1000;

/** Persist the analysis for the review screen. Storage may be disabled — the
 *  caller navigates either way, so failures here must never throw. */
export function save(result: unknown, source: 'cv' | 'describe'): void {
  const payload = JSON.stringify(result);
  try {
    sessionStorage.setItem(KEY, payload);
    sessionStorage.setItem('onboard.source', source);
  } catch {
    // session storage unavailable — the mirror below may still work
  }
  try {
    localStorage.setItem(
      MIRROR_KEY,
      JSON.stringify({ at: Date.now(), source, result })
    );
  } catch {
    // private mode / quota — nothing more we can do
  }
}

/** The draft, from the session first and the mirror as a fallback. */
export function load(): any | null {
  try {
    const raw = sessionStorage.getItem(KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    // fall through to the mirror
  }
  try {
    const raw = localStorage.getItem(MIRROR_KEY);
    if (!raw) return null;
    const { at, result } = JSON.parse(raw);
    if (!at || Date.now() - at > MAX_AGE_MS) {
      clear();
      return null;
    }
    // Re-seat it in the session so the rest of the flow behaves normally.
    try {
      sessionStorage.setItem(KEY, JSON.stringify(result));
    } catch {
      // non-fatal
    }
    return result;
  } catch {
    return null;
  }
}

export function clear(): void {
  try {
    sessionStorage.removeItem(KEY);
  } catch {
    // ignore
  }
  try {
    localStorage.removeItem(MIRROR_KEY);
  } catch {
    // ignore
  }
}
