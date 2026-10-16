/**
 * `Project.exposeToApi` — the explicit opt-in §4.3 insists on
 * ("אסור שפתחנו API יהפוך רטרואקטיבית מוצרים שהוסתרו לפומביים").
 *
 * The flag is a **widening** switch and nothing else: without it the anonymous
 * surface of `/api/v1/r/{rikma}/products` is exactly what `/gift` already
 * lists — products that are approved and not hidden from discovery. With it,
 * a rikma may also list its `hidden` products publicly. An absent flag is read
 * as `false`, never as `true`, so an unreadable or field-less backend can only
 * ever expose *less*.
 *
 * The Strapi field itself arrives with `1.0b` (Phase 1 changes no schema, which
 * is exactly why it is the first phase). Until then the probe below fails
 * quietly once, latches "not supported", and stops asking — and the moment the
 * field exists, the same code starts honouring it with no change here. Same
 * discipline as `readIdentity`, which reads a missing `slug`/`look` as "no
 * address, the classic look".
 *
 * §9.11 (who may set it — a rikma consensus like the address, not one member's
 * toggle) is a decision for the UI/action layer, not for this reader.
 */

export type ApiRun = (
  qid: string,
  vars: Record<string, unknown>
) => Promise<any>;

const TTL_MS = 5 * 60 * 1000;
const cache = new Map<string, { exposed: boolean; at: number }>();

/**
 * `null` = still unknown; `false` = the deployment answered "unknown field" and
 * we stop asking. A per-process latch, reset on restart — so a `1.0b` deploy
 * is picked up by the next boot without any code change.
 */
let supported: boolean | null = null;

export async function readRikmaExposure(
  projectId: string,
  run: ApiRun
): Promise<boolean> {
  if (supported === false) return false;

  const hit = cache.get(String(projectId));
  if (hit && Date.now() - hit.at < TTL_MS) return hit.exposed;

  try {
    const res = await run('rikmaApiExposure', { pid: String(projectId) });
    supported = true;
    const exposed = res?.data?.project?.data?.attributes?.exposeToApi === true;
    cache.set(String(projectId), { exposed, at: Date.now() });
    return exposed;
  } catch (e) {
    // Latch only on a *schema* answer. A network blip must not disable the flag
    // for the life of the process; the field-missing error is what we expect
    // until 1.0b, and it is not retried.
    const messages: string[] = e?.getMessages
      ? e.getMessages()
      : [String(e?.message ?? e)];
    const missingField = messages.some((m) => /exposeToApi/i.test(m));
    if (missingField) {
      supported = false;
      console.info(
        '[apiPublic] Project.exposeToApi is not on this backend yet (1.0b) — api exposure stays closed'
      );
    } else {
      console.warn('[apiPublic] exposeToApi probe failed:', messages[0]);
    }
    if (missingField) return false;
    // Unknown failure: answer the safe way, but do not cache it.
    return false;
  }
}

/** Test seam. */
export function resetExposureCache(): void {
  cache.clear();
  supported = null;
}
