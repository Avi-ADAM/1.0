/**
 * The settings screen's shared vocabulary — one place for the sections it has
 * and the handful of control styles every row uses, so a row added next year
 * looks like the ones already there instead of like the year it was written.
 */

/** Order of the sections on /me/settings; titles live at `pages.meSettings.sections.<id>`. */
export const SETTINGS_SECTIONS = [
  { id: 'profile', icon: '👤' },
  { id: 'preferences', icon: '🎛️' },
  { id: 'notifications', icon: '🔔' },
  { id: 'connections', icon: '🔗' },
  { id: 'security', icon: '🛡️' },
  { id: 'help', icon: '🧭' },
  { id: 'account', icon: '🚪' }
];

const btn =
  'inline-flex items-center justify-center gap-2 rounded-full px-4 py-2 text-sm font-bold transition ' +
  'disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-goldink';

// `goldink`, not `gold`, for anything drawn on the card: --gold renders at
// ~1.2:1 on a white surface (see tailwind.config).
export const btnPrimary = `${btn} bg-gradient-to-br from-barbi to-mpink text-gold hover:brightness-110`;
export const btnSecondary = `${btn} border border-goldink text-goldink hover:bg-goldink/10`;
export const btnDanger = `${btn} bg-red-600 text-white hover:bg-red-700`;

export const field =
  'w-full rounded-lg border border-surfaceLine bg-surface2 text-surfaceInk px-3 py-2 text-base ' +
  'focus:outline-none focus:ring-2 focus:ring-goldink';
export const fieldLabel = 'block text-sm font-medium text-surfaceMuted mb-1';
