/**
 * The shop starter (PLAN_SHOP_CUSTOMER_EXPERIENCE §7.4) — a separate repo a
 * rikma deploys as its storefront. One place for its addresses, so the
 * Connections tab and the API guide never point at two different repos.
 */
import { PUBLIC_API_ORIGIN } from '$lib/platform/index.js';

export const STARTER_REPO_URL = 'https://github.com/Avi-ADAM/1lev1-shop-starter';

/**
 * Where a deployed shop's server reaches the rikma: the API instance next to
 * Strapi, never the page the member happens to be on (a Vercel front, or
 * localhost while developing, which no deployed shop can reach).
 */
/** The rikma's API address — the value of the starter's LEV_RIKMA_URL. */
export function rikmaApiUrl(rikma: string | number): string {
  return `${PUBLIC_API_ORIGIN}/api/v1/r/${rikma}`;
}

/**
 * The ways to pay the starter ships with; it offers each one that is configured.
 * `arranged` is no provider: the buyer leaves a phone number, the order waits in
 * pendingPayment, and a member settles the money with them by phone or WhatsApp
 * (PLAN_SHOP_OPERATIONS T1/T2). A shop with only `arranged` needs no payment keys.
 */
export type StarterProvider = 'stripe' | 'paypal' | 'arranged';

export type StarterDeployOptions = {
  rikmaUrl?: string;
  ordersKey?: string;
  projectName?: string;
  providers?: StarterProvider[];
};

/**
 * What the host's form asks for. Every key listed is REQUIRED there, so a
 * provider's keys are listed only when the member chose that provider —
 * listing both would force a PayPal-only shop to invent Stripe keys.
 * PAYPAL_WEBHOOK_ID stays out: the starter works without it, and the webhook
 * can only be added once the site has an address. ARRANGED_EXPIRES_HOURS stays
 * out as well — the starter's default (72h) is what most shops want.
 */
const PROVIDER_ENV: Record<StarterProvider, string[]> = {
  stripe: ['STRIPE_SECRET_KEY', 'STRIPE_WEBHOOK_SECRET'],
  paypal: ['PAYPAL_CLIENT_ID', 'PAYPAL_CLIENT_SECRET', 'PAYPAL_ENV'],
  arranged: ['ARRANGED_PAYMENT', 'SHOP_WHATSAPP']
};

/**
 * The form both hosts get: which keys to ask for, and the values we already
 * know. The rikma address always; the orders key only while the member still
 * holds the raw value, right after creating it — it is never stored, so a
 * later visit has nothing to put there. The payment keys are the member's own
 * and are always typed by them; only PAYPAL_ENV and ARRANGED_PAYMENT get the
 * starter's defaults (SHOP_WHATSAPP is the member's own number).
 */
function starterEnv(opts: StarterDeployOptions) {
  const providers: StarterProvider[] = opts.providers?.length ? opts.providers : ['stripe'];
  const keys = ['LEV_RIKMA_URL', 'LEV_ORDERS_KEY', ...providers.flatMap((p) => PROVIDER_ENV[p])];
  const values: Record<string, string> = {};
  if (opts.rikmaUrl) values.LEV_RIKMA_URL = opts.rikmaUrl;
  if (opts.ordersKey) values.LEV_ORDERS_KEY = opts.ordersKey;
  if (providers.includes('paypal')) values.PAYPAL_ENV = 'sandbox';
  if (providers.includes('arranged')) values.ARRANGED_PAYMENT = 'phone,whatsapp';
  return { keys, values };
}

/** Vercel's clone link (`env` = required keys, `envDefaults` = prefilled values). */
export function starterDeployUrl(opts: StarterDeployOptions = {}): string {
  const { keys, values } = starterEnv(opts);
  const params = new URLSearchParams({
    'repository-url': STARTER_REPO_URL,
    env: keys.join(','),
    envLink: `${STARTER_REPO_URL}#setup`
  });
  params.set('envDefaults', JSON.stringify(values));
  if (opts.projectName) params.set('project-name', opts.projectName);
  return `https://vercel.com/new/clone?${params.toString()}`;
}

/**
 * Netlify's deploy link. Its form takes the keys from the URL *hash* — `KEY=`
 * asks for a value, `KEY=value` prefills it — and the hash never leaves the
 * browser, so the orders key does not reach Netlify's logs on the way.
 * Netlify has no parameter for the site name; it picks one.
 */
export function starterNetlifyUrl(opts: StarterDeployOptions = {}): string {
  const { keys, values } = starterEnv(opts);
  const hash = keys.map((k) => `${k}=${encodeURIComponent(values[k] ?? '')}`).join('&');
  return `https://app.netlify.com/start/deploy?repository=${STARTER_REPO_URL}#${hash}`;
}
