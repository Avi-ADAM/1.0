// Reuses the /me profile loader — same meData shape, same
// depends('app:meProfile') so action-triggered invalidation keeps this page
// in sync too.
export { load } from '../+page.server.js';
