/**
 * The live assistant draft for a visitor's own idea — the same
 * `/api/vision-preview` the /vision page calls, in its `exhibit` mode (a kiosk
 * pass cookie, its own quota, short texts allowed).
 *
 * Never awaited without a deadline: the kiosk shows its "the assistant is
 * thinking" weave for at most `timeoutMs`, and anything other than a usable
 * draft — no pass, a refusal, a slow model, no network — resolves to null,
 * which the caller answers with the nearest ready template.
 */
import { isEmptyPreview, type VisionPreview } from '$lib/vision/preview';

export const DRAFT_TIMEOUT_MS = 12_000;

export async function draftIdea(
  text: string,
  lang: string,
  { timeoutMs = DRAFT_TIMEOUT_MS, fetchImpl = fetch }: { timeoutMs?: number; fetchImpl?: typeof fetch } = {}
): Promise<VisionPreview | null> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetchImpl('/api/vision-preview', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ text, lang, mode: 'exhibit' }),
      signal: ctrl.signal
    });
    if (!res.ok) return null;
    const data = await res.json();
    const preview = data?.ok ? (data.preview as VisionPreview) : null;
    return preview && !isEmptyPreview(preview) ? preview : null;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}
