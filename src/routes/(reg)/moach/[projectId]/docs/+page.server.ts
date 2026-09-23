import { sendToSer } from '$lib/send/sendToSer.js';
import { mediaUrl } from '$lib/utils/processLifecycle.js';
import { normalizeSpaceDocs } from '$lib/spaceDocs/spaceDocs.js';
import { maxUploadBytes, storageKind } from '$lib/server/storage/index.js';
import { PROXY_MAX_BYTES } from '$lib/uploads/policy.js';
import type { PageServerLoad } from './$types';

/**
 * The rikma's shared library (docs/PLAN_RIKMA_SHARED_INFO.md §5, stage 1).
 *
 * One place for the material a partnership actually shares: contracts and
 * scans, photos of the work, and links to whatever already lives in a Drive
 * somewhere. Secrets are **not** here — the plan is explicit that a password in
 * a Strapi column is a debt that cannot be repaid, so the vault waits for the
 * sealed-event path (§3.2, §7) rather than shipping a plaintext stand-in.
 *
 * Membership is enforced twice on purpose: the `[projectId]` layout refuses a
 * non-member for the page, and qid 325 carries its own member guard, so a
 * direct call to `/api/send` cannot read the library either.
 *
 * The existing `Project.drivelink` rides along (§5): it is the rikma's Drive
 * link today, and the links list is exactly where a member looks for it.
 */
export const load: PageServerLoad = async ({ params, fetch }) => {
  const { projectId } = params;

  // Which upload path this instance offers (stage 2). `direct` = private
  // storage (a folder on our own host, or an S3 bucket — the page cannot tell
  // and does not need to); `proxy` = the stage-1 Strapi upload, used wherever
  // neither is configured. Only the mode and the cap reach the page.
  const upload = storageKind()
    ? { mode: 'direct' as const, maxBytes: maxUploadBytes() }
    : { mode: 'proxy' as const, maxBytes: PROXY_MAX_BYTES };

  try {
    const res = (await sendToSer({ pid: projectId }, '325projectSpaceDocs', 0, 0, false, fetch)) as any;

    // A GraphQL failure comes back as `{ errors }` with HTTP 200 — the fetch
    // resolves and the catch below never runs. Unhandled, the member sees an
    // empty shelf and no reason for it, which is exactly how a field that does
    // not exist on the deployed schema hides itself (the `Sp.hm` incident).
    if (res?.errors?.length) {
      console.error('[moach/docs] shared library query rejected', res.errors);
      return { projectId, upload, drivelink: '', docs: [], loadFailed: true };
    }

    const attributes = res?.data?.project?.data?.attributes ?? {};

    return {
      projectId,
      upload,
      drivelink: String(attributes.drivelink ?? '').trim(),
      docs: normalizeSpaceDocs(attributes.space_docs?.data, mediaUrl),
      loadFailed: false
    };
  } catch (e) {
    // An empty shelf the member can still upload to beats a 500 on the tab.
    console.error('[moach/docs] shared library load failed', e);
    return { projectId, upload, drivelink: '', docs: [], loadFailed: true };
  }
};
