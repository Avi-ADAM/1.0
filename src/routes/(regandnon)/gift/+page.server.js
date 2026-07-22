import { sendToSer } from '$lib/send/sendToSer.js';
import { normalizeProductCard } from '$lib/server/discovery/normalizeCards.js';
import { isHiddenProject } from '$lib/server/discovery/hiddenProjects.js';

// Public products directory — same anonymous/service-token split as the other
// (regandnon) discovery pages (see the note in demand/+page.server.ts).
export const load = async ({ locals, fetch }) => {
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

  return {
    isLoggedIn: isReg,
    products
  };
};
