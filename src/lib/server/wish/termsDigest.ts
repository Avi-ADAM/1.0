/**
 * The digest of a wish's terms — docs/inprogress/PLAN_DIRECT_OFFER.md §4.3.
 * What goes into it is `$lib/wish/termsDigest` (pure); this is only the hash.
 *
 * Not a secret and not a signature: it says whether two sets of terms are the same,
 * so a plain sha256 is enough, and a short prefix keeps the stored string small.
 */

import crypto from 'crypto';
import { termsCanonical, type WishTerms } from '$lib/wish/termsDigest';

export function termsDigest(w: WishTerms): string {
  return 't1:' + crypto.createHash('sha256').update(termsCanonical(w)).digest('base64url').slice(0, 22);
}
