// Reuses the /me profile loader — same meData shape, same
// depends('app:meProfile') so action-triggered invalidation keeps this page
// in sync too.
import { load as meLoad } from '../+page.server.js';
import { sendToSer } from '$lib/send/sendToSer.js';

/**
 * The member's own spelling of their name per script (PLAN_UGC_TRANSLATION
 * §18) rides beside the profile, never inside it: a read that fails — the
 * fields not yet deployed, a slow backend — returns `null`, which hides the
 * fields instead of showing a state the page could not confirm, and never
 * fails the page.
 */
async function loadNameScripts(uid, fetch) {
  if (!uid) return null;
  try {
    const res = await sendToSer({ uid: String(uid) }, 'nameScriptsFor', 0, 0, true, fetch);
    const attrs = res?.data?.usersPermissionsUser?.data?.attributes;
    if (!attrs || res?.errors?.length) return null;
    return {
      nameLatin: attrs.nameLatin ?? '',
      nameArabic: attrs.nameArabic ?? '',
      nameCyrillic: attrs.nameCyrillic ?? '',
      nameHebrew: attrs.nameHebrew ?? ''
    };
  } catch {
    return null;
  }
}

export async function load(event) {
  const [base, nameScripts] = await Promise.all([
    meLoad(event),
    loadNameScripts(event.locals.uid, event.fetch)
  ]);
  return { ...base, nameScripts };
}
