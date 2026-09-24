/**
 * Which translation namespaces are route-gated, and to which routes.
 *
 * Kept in a Vite-free module so `scripts/check-i18n-routes.mjs` can import the
 * real gates under plain node instead of re-parsing `index.js`. A gate that
 * does not cover a route where the namespace is actually used makes every key
 * in it render as an **empty string** on that page — silently, in every
 * language. That is what happened to `me` (no loader at all) and to `deals`
 * (gated to `/deals`, but `lev/cards/dowegeot.svelte` uses it on `/lev`).
 */

export const LOCALES = ['he', 'en', 'ar', 'ru', 'es'];

/** Matches `/foo` and the locale-prefixed `/he/foo`, `/es/foo`, … */
const at = (...paths) =>
    paths.map((p) =>
        p instanceof RegExp ? p : new RegExp(`^(?:/${LOCALES.join('|/')})?${p}`)
    );

/**
 * Namespaces fetched only on the routes that use them. Anything not listed
 * here is loaded globally on every page.
 *
 * Run `npm run check:i18n` after moving a component between routes.
 *
 * @type {Record<string, RegExp[]>}
 */
export const ROUTED = {
    onboard: at('/onboard'),
    tasks: at('/myacts', /\/moach\/[^/]+\/acts/),
    deals: at('/deals', '/lev'),
    negotiation: at('/negotiation'),
    guide: at('/guid'),
    faq: at('/faq'),
    love: at('/love'),
    countries: at('/love'),
    me: at('/me'),
    demand: at('/demand', '/lev', '/maagad', /\/moach\/[^/]+\/demand/),
    discover: at('/demand', '/project', '/gift', '/availableMission', '/availiableResorce'),
    concierge: at('/concierge', '/wish'),
    // The concierge landing page for customers, plus the short registration
    // track it opens: the agreement's "one step only" ribbon and the signup
    // and check-email screens' three-step wording (see regIntent.js).
    madeForYou: at('/made-for-you', '/hascama', '/signup'),
    offerings: at('/me', '/onboard', '/gift', '/user', '/deals/sales-center', /\/moach\/[^/]+\/sales/),
    consensus: at('/consensus'),
    uses: at('/uses'),
    // The "instead of a boss" track page. Its own copy only - the teaser that
    // points at it from the homepage lives in `home`, which loads everywhere.
    noboss: at('/no-boss'),
    // The "I already have a partnership" track. The hook and the calculator
    // stay on the homepage in `home`; only the depth behind them is gated.
    partnership: at('/partnership'),
    // The "looking for a venture to join" track. The homepage's discovery
    // strip keeps its own copy in `home`; this is the page behind it.
    join: at('/join'),
    // The track for readers the ordinary job market keeps turning down. The
    // homepage door and banner keep their copy in `home`, which loads
    // everywhere; only the page's own copy is gated.
    flexible: at('/flexible-work'),
    // The page behind the product - why consent is re-checked at every step.
    // One route, one namespace; the homepage teaser for it lives in `home`.
    why: at('/why'),
    planning: at(/\/moach\/[^/]+\/create/),
    // The rikma-import review screen (PLAN_AI_SIGNUP_CONCIERGE §4.5): a new
    // rikma at /moach/import/…, an existing one at /moach/<id>/import/….
    rikmaImport: at(/\/moach\/(?:[^/]+\/)?import\//),
    // The rikma's API page — one route, one namespace, nowhere else.
    rikmaApi: at(/\/moach\/[^/]+\/api/),
    // The rikma's code tab, plus the GitHub account card on the settings page.
    rikmaCode: at(/\/moach\/[^/]+\/code/, '/me'),
    // The rikma's shared library — one route, one namespace, nowhere else.
    rikmaDocs: at(/\/moach\/[^/]+\/docs/),
    // The "connect your AI agent" guide, plus the banner that points at it from
    // the settings page — both live under /me, so one gate covers them.
    mcp: at('/me'),
    // Archive/edit proposals surface as lev cards and on the rikma's object pages.
    archive: at('/lev', /\/moach\/[^/]+/),
    // Shifts (docs/PLAN_SHIFTS.md): the rikma's shifts tab and plan form under
    // /moach, the member's own shifts under /me, the heart's shift cards, and
    // the shift commitment a candidate states on a public mission page. The
    // last two carry the mission form in spec/publish mode, where the plan
    // editor stays hidden — the gate still has to match the import graph.
    shifts: at('/lev', /\/moach\/[^/]+/, '/me', '/availableMission', '/concierge', '/onboard'),
    // The resource booking calendar: the holder's own page under /me, the
    // rikma's copy under /moach, the date-overlap line on lev's resource
    // suggestion cards — and the onboarding resources step, which reads the
    // same occupancy so a member does not offer a week that is already taken.
    resources: at('/me', /\/moach\/[^/]+/, '/lev', '/onboard'),
    // Subsistence stipends: the heart's proposal/pay/confirm cards, the rikma's
    // own stipend tab — and the public support page, where a supporter can say
    // "I'll fund this mission" and the donation dialog names the stipend.
    // The last three carry the mission-creation form, which imports the stipend
    // section — it stays hidden there (no rikma to fund from), but the gate has
    // to match the import graph or the checker cannot tell the difference.
    stipend: at(
        '/lev',
        /\/moach\/[^/]+/,
        /\/project\/[^/]+/,
        '/concierge',
        '/me',
        '/onboard',
        // The public offer page for a single open mission, where the stipend
        // block states the split and the partnership disclaimer.
        '/availableMission'
    )
};
