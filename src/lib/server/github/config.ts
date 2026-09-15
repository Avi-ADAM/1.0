/**
 * GitHub App configuration (PLAN_CODE_RIKMA §3.1), read at request time from
 * `$env/dynamic/private` — `process.env` is empty under `vite dev`.
 *
 * Everything is optional at boot: until the App is registered and its values
 * are in the env, the connect buttons explain that the integration is not set
 * up and the webhook refuses every delivery (503). Nothing throws on import.
 *
 *   GITHUB_APP_ID             numeric App id
 *   GITHUB_APP_SLUG           the App's URL name (github.com/apps/<slug>)
 *   GITHUB_APP_CLIENT_ID      OAuth client id of the App
 *   GITHUB_APP_CLIENT_SECRET  OAuth client secret of the App
 *   GITHUB_APP_PRIVATE_KEY    PEM; may be one line with literal \n
 *   GITHUB_WEBHOOK_SECRET     the App's webhook secret
 */

import { env } from '$env/dynamic/private';

export interface GithubAppConfig {
  appId: string;
  slug: string;
  clientId: string;
  clientSecret: string;
  privateKey: string;
}

export function githubAppConfig(): GithubAppConfig | null {
  const appId = env.GITHUB_APP_ID?.trim();
  const slug = env.GITHUB_APP_SLUG?.trim();
  const clientId = env.GITHUB_APP_CLIENT_ID?.trim();
  const clientSecret = env.GITHUB_APP_CLIENT_SECRET?.trim();
  const privateKey = env.GITHUB_APP_PRIVATE_KEY;
  if (!appId || !slug || !clientId || !clientSecret || !privateKey) return null;
  return { appId, slug, clientId, clientSecret, privateKey };
}

export function githubWebhookSecret(): string | null {
  return env.GITHUB_WEBHOOK_SECRET?.trim() || null;
}
