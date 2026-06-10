import { redirect } from '@sveltejs/kit';
import { qids } from '../../api/send/qids.js';

const DEFAULT_PIC =
  'https://res.cloudinary.com/love1/image/upload/v1653053361/image_s1syn2.png';

/**
 * Flatten Strapi localizations for he: when an item has a he localization,
 * surface its localized field value onto the base attribute (matches the old
 * client-side behaviour that the page used to do inline).
 */
function localizeList(list, field) {
  const items = list?.data ?? [];
  for (const item of items) {
    const loc = item?.attributes?.localizations?.data;
    if (loc && loc.length > 0 && loc[0]?.attributes?.[field] != null) {
      item.attributes[field] = loc[0].attributes[field];
    }
  }
}

/**
 * Build the (transformed) avatar url + the plain small url used for the uPic
 * store, mirroring the original client logic.
 */
function buildPics(profilePic) {
  const pic = profilePic?.data?.attributes;
  if (!pic) return { picLink: DEFAULT_PIC, avatarSmall: '' };

  const small = pic.formats?.small?.url || pic.url;
  // Cloudinary face-thumb transform, inserted after the upload segment
  const transform = '/ar_1.0,c_thumb,g_face,w_0.6,z_0.7/r_max';
  const picLink = [small.slice(0, 48), transform, small.slice(48)].join('');
  return { picLink, avatarSmall: small };
}

export async function load({ locals, fetch, depends }) {
  // Lets socket notifications / actions refresh just this page via
  // invalidate('app:meProfile') instead of a full reload.
  depends('app:meProfile');

  const tok = locals.tok;
  const uid = locals.uid;
  const lang = locals.lang || 'he';

  // No valid session → straight to login (server-side, JWT never leaves cookie)
  if (!tok || tok === false || !uid || uid === false) {
    throw redirect(303, '/login');
  }

  try {
    const res = await fetch(import.meta.env.VITE_URL + '/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tok}`
      },
      body: JSON.stringify({
        query: qids['meProfile'],
        variables: { uid: String(uid) }
      })
    });
    const json = await res.json();

    const userData = json?.data?.usersPermissionsUser?.data;
    if (!userData || !userData.attributes) {
      // Token rejected / user gone → login
      throw redirect(303, '/login');
    }

    const meData = userData.attributes;

    // Localize he variants (always fetched; flattened only for he)
    if (lang === 'he') {
      localizeList(meData.skills, 'skillName');
      localizeList(meData.tafkidims, 'roleDescription');
      localizeList(meData.vallues, 'valueName');
      localizeList(meData.work_ways, 'workWayName');
    }

    // selected2 scratch arrays the Edit component expects
    for (const key of ['skills', 'tafkidims', 'sps', 'vallues', 'work_ways']) {
      if (meData[key]?.data && meData[key].data.selected2 === undefined) {
        meData[key].data.selected2 = [];
      }
    }

    const { picLink, avatarSmall } = buildPics(meData.profilePic);

    return {
      tok: true,
      uid,
      lang,
      meData,
      picLink,
      avatarSmall,
      total: meData.hervachti ?? 0,
      showGuide: meData.profilManualAlready !== true,
      loadError: false
    };
  } catch (e) {
    // Re-throw SvelteKit redirects untouched
    if (e && typeof e === 'object' && 'status' in e && 'location' in e) throw e;

    // Network / parse failure: keep the user on the page so the client can
    // show the last-good (cached) data with an offline banner.
    console.error('me load error', e);
    return {
      tok: true,
      uid,
      lang,
      meData: null,
      picLink: DEFAULT_PIC,
      avatarSmall: '',
      total: 0,
      showGuide: false,
      loadError: true
    };
  }
}
