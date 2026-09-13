import { sendToSer } from '$lib/send/sendToSer.js';
import { normalizeProductCard } from '$lib/server/discovery/normalizeCards.js';
import { isHiddenProject } from '$lib/server/discovery/hiddenProjects.js';
import { translateSurface, productCardGroups } from '$lib/server/translation/surfaces.js';

// Public products directory — same anonymous/service-token split as the other
// (regandnon) discovery pages (see the note in demand/+page.server.ts).
export const load = async ({ locals, fetch, cookies }) => {
  const isReg = !!/** @type {any} */ (locals)?.uid;

  let products = [];
  try {
    const res = await sendToSer({}, '282discoverProducts', 0, 0, !isReg, fetch);
    products = (res?.data?.matanots?.data ?? [])
      .filter((n) => !isHiddenProject(n?.attributes?.projectcreates?.data?.[0]?.id))
      .map(normalizeProductCard)
      .filter((p) => p !== null);
  } catch (error) {
    console.error('Error loading products directory:', error);
  }

  // UGC translation (PLAN_UGC_TRANSLATION §7.1): product names, and the rikma's
  // name on a rikma product. A personal seller is a person — transliterated,
  // not translated (§4.3) — and waits for the profile surfaces.
  const { translations, pending } = await translateSurface(
    'productDirectory',
    productCardGroups(products),
    /** @type {any} */ (locals)?.lang,
    fetch,
    cookies.get('autoTranslate')
  );

  return {
    isLoggedIn: isReg,
    products,
    translations,
    pending
  };
};
