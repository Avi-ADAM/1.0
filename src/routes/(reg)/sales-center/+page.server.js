import { redirect } from '@sveltejs/kit';

// The sales center moved to be a child of /deals so it shares its header
// and layout. Old bookmarks/push/email links to /sales-center still work.
export function load() {
  throw redirect(308, '/deals/sales-center');
}
