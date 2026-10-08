/**
 * The concierge bell's notices (docs/inprogress/PLAN_SMART_NOTICES.md, stage 2): one
 * sentence per proposal on a wish that waits for the signed-in user — as the
 * wish's owner or as a proposer.
 *
 * Whose move it is and on what terms comes from `negotiationView`, the function
 * the wish page itself renders from, so the bell and the page never disagree.
 *
 * Like `loadBell`, it never rejects. A failed read resolves to `null`, not `[]`:
 * "nothing waits for you" and "we could not tell" are different, and on the
 * second the bell falls back to the per-wish counts instead of claiming silence.
 */

import { objectRead, userRead, type NoticeDoor } from '$lib/server/notices/door';
import { negotiationView } from '$lib/server/wish/negotiationView';
import { coveredVersion } from '$lib/server/wish/proposal';
import { normalizeRestime } from '$lib/wish/restime';
import { applyDismissals, compareNotices, wishNotices, type Notice, type WishNoticeInput } from '$lib/notices';
import { loadNoticePrefs, type NoticePrefs } from '$lib/server/notices/prefs';

/** A wish in these states has nothing to answer on (as `notificationItems`). */
const QUIET_WISH = new Set(['draft', 'cancelled', 'expired']);

const nameOf = (u: any): string => u?.attributes?.username ?? '';

/**
 * The name of the need a proposal covers. The slot's index is an extracted
 * need's id or its position (the heart's `wishoffer` extractor reads it the
 * same way); a volunteer's proposal names it through its open mission.
 */
function itemNameOf(attrs: any): { name: string | null; kind: 'mission' | 'resource' | null } {
  const { slot } = coveredVersion(attrs);
  const wish = attrs?.ratson?.data?.attributes ?? {};
  if (slot) {
    const list: any[] = (slot.kind === 'mission' ? wish.extracted_missions : wish.extracted_resources) ?? [];
    const idx = slot.idx;
    const byId = idx != null ? list.find((e) => String(e?.id) === String(idx)) : null;
    const pos = idx != null && /^\d+$/.test(String(idx)) ? list[Number(idx)] : null;
    const name = byId?.name ?? pos?.name ?? attrs?.open_mission?.data?.attributes?.name ?? null;
    return { name, kind: slot.kind };
  }
  return { name: attrs?.open_mission?.data?.attributes?.name ?? null, kind: null };
}

/** Pure: the raw qid-421 nodes of one side into notice inputs. Exported for tests. */
export function toWishNoticeInputs(
  nodes: any[],
  viewer: 'wisher' | 'provider',
  restimes: Map<string, unknown>,
  hidden: Set<string>
): WishNoticeInput[] {
  const out: WishNoticeInput[] = [];
  for (const node of nodes ?? []) {
    const attrs = node?.attributes ?? {};
    const wishNode = attrs.ratson?.data;
    if (!wishNode) continue;
    const wish = wishNode.attributes ?? {};
    if (QUIET_WISH.has(wish.status_ratson ?? '')) continue;
    // What the owner hid (C-10) is hidden from her bell too — not from the provider's.
    if (viewer === 'wisher' && hidden.has(String(node.id))) continue;

    const owners: any[] = wish.users_permissions_users?.data ?? [];
    // Nobody took it yet: a direct offer still in its provider's hands (PLAN_DIRECT_OFFER) —
    // nothing waits on anyone.
    if (owners.length === 0) continue;
    const proposers: any[] = attrs.proposer_users?.data ?? [];
    const negotiation = negotiationView(
      attrs,
      { wisherIds: owners.map((o) => String(o.id)), proposerIds: proposers.map((u) => String(u.id)) },
      viewer,
      normalizeRestime(restimes.get(String(wishNode.id))),
      wish.terms_digest ?? null
    );
    const item = itemNameOf(attrs);
    const projectName = attrs.project?.data?.attributes?.projectName ?? null;

    out.push({
      viewer,
      wish: { id: String(wishNode.id), name: wish.name ?? '' },
      proposal: {
        id: String(node.id),
        status: attrs.status_proposal ?? null,
        proposerName: nameOf(proposers[0]) || projectName || '',
        wisherName: nameOf(owners[0]) || null,
        itemName: item.name,
        itemKind: item.kind,
        productName: attrs.matanot?.data?.attributes?.name ?? projectName,
        totalPrice: typeof attrs.total_price === 'number' ? attrs.total_price : null,
        negotiation,
        createdAt: attrs.createdAt ?? null
      }
    });
  }
  return out;
}

export async function loadWishNotices(
  uid: unknown,
  fetch: typeof globalThis.fetch,
  /** Already started by a page that reads them for several lists (the hub) — read once. */
  prefsPending?: Promise<NoticePrefs>,
  /** `service` for an external MCP key (no session); see ../notices/door.ts. */
  door: NoticeDoor = 'session'
): Promise<Notice[] | null> {
  if (!uid) return [];
  try {
    const [res, hiddenRes, prefs] = await Promise.all([
      userRead(door, uid, '421myWishNotices', fetch),
      // A backend without `hidden_by_wisher` answers with an error: nothing is hidden.
      userRead(door, uid, '394hiddenWishProposals', fetch).catch(() => null),
      // What she hid from her notices (PLAN §4) — never rejects; nothing hidden on error.
      prefsPending ?? loadNoticePrefs(uid, fetch, door)
    ]);
    const asWisher: any[] = (res as any)?.data?.asWisher?.data ?? [];
    const asProvider: any[] = (res as any)?.data?.asProvider?.data ?? [];
    const hidden = new Set<string>(
      ((hiddenRes as any)?.data?.ratsonProposals?.data ?? []).map((h: any) => String(h.id))
    );

    const wishIds = [
      ...new Set([...asWisher, ...asProvider].map((n) => n?.attributes?.ratson?.data?.id).filter(Boolean).map(String))
    ];
    const restimes = new Map<string, unknown>();
    if (wishIds.length) {
      try {
        const rr: any = await objectRead(door, fetch)('422wishRestimes', { ids: wishIds });
        for (const r of rr?.data?.ratsons?.data ?? []) restimes.set(String(r.id), r.attributes?.restime);
      } catch {
        /* the 48 h default for every wish */
      }
    }

    const notices = [
      ...wishNotices(toWishNoticeInputs(asWisher, 'wisher', restimes, hidden)),
      ...wishNotices(toWishNoticeInputs(asProvider, 'provider', restimes, hidden))
    ];
    // A user who proposed on her own wish appears on both sides; one row.
    const seen = new Set<string>();
    return applyDismissals(notices, prefs.dismissals)
      .filter((n) => (seen.has(n.subject) ? false : (seen.add(n.subject), true)))
      .sort(compareNotices);
  } catch (e) {
    console.warn('[concierge] bell notices failed (non-fatal):', e);
    return null;
  }
}
