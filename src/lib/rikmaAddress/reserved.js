/**
 * Addresses no rikma may take (docs/inprogress/PLAN_RIKMA_SUBDOMAINS.md §4.3).
 *
 * Today a rikma's address is the path `/r/<slug>`; the same slug becomes the
 * sub-domain `<slug>.1lev1.com` in S2. So this list is written for the
 * sub-domain case already: anything that is, or could plausibly become, one of
 * our own hosts — or that a visitor would read as the platform speaking — is
 * out. Adding a name here never breaks an existing rikma: the check runs when
 * an address is proposed and again when it is applied, never on read.
 */

/** Our own hosts, sister apps, and words that read as "the platform". */
export const RESERVED_SLUGS = new Set([
  // infrastructure and sister apps on *.1lev1.com
  'www', 'api', 'app', 'apps', 'consensus', 'agreement', 'meetings', 'meet', 'dev',
  'staging', 'stage', 'preview', 'test', 'tests', 'beta', 'demo', 'sandbox', 'local',
  'admin', 'administrator', 'root', 'system', 'internal', 'ops', 'status', 'health',
  'mail', 'email', 'smtp', 'imap', 'pop', 'mx', 'ns', 'ns1', 'ns2', 'dns', 'ftp', 'vpn',
  'cdn', 'static', 'assets', 'media', 'img', 'images', 'files', 'uploads', 'storage',
  'auth', 'login', 'logout', 'signin', 'signup', 'register', 'account', 'accounts',
  'oauth', 'sso', 'mcp', 'webhook', 'webhooks', 'graphql', 'strapi', 'cms',
  'docs', 'doc', 'blog', 'news', 'help', 'support', 'contact', 'about', 'legal',
  'privacy', 'terms', 'security', 'abuse', 'billing', 'pay', 'payment', 'payments',
  // our own route names and words
  'r', 'rikma', 'rikmas', 'rikmot', 'rikmash', '1lev1', 'lev', 'lev1', 'onelevone',
  'moach', 'hub', 'me', 'user', 'users', 'project', 'projects', 'gift', 'lev-1',
  'concierge', 'wish', 'wishes', 'deals', 'onboard', 'hascama', 'convention',
  'official', 'team', 'staff', 'platform'
]);

/**
 * Two letters are kept back whole: they are the language codes (`he`, `en`,
 * `ar`, `ru`, `es`) and whatever locale we add next — `es.1lev1.com` must stay
 * free to mean Spanish.
 */
export const MIN_SLUG_LENGTH = 3;
export const MAX_SLUG_LENGTH = 40;

/**
 * Not refused, but not granted by a member vote either: a name that would
 * make a visitor think a bank, a payment page or a government office is
 * speaking needs a person at 1lev1 to look at it first. The member is told so
 * and pointed at us; nothing is decided on their behalf.
 */
export const REVIEW_WORDS = [
  'bank', 'pay', 'paypal', 'bit', 'wallet', 'crypto', 'coin', 'secure', 'verify',
  'verification', 'login', 'password', 'account', 'support', 'official', 'gov',
  'police', 'tax', 'leumi', 'hapoalim', 'discount', 'mizrahi', 'isracard', 'visa',
  'mastercard', 'google', 'facebook', 'meta', 'apple', 'microsoft', 'amazon',
  'whatsapp', 'telegram', 'instagram', 'tiktok', 'claude', 'anthropic', 'openai'
];
