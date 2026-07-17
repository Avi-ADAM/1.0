import { env } from '$env/dynamic/private';

/**
 * Single source of truth for the Strapi base URL on the server.
 *
 * Resolution order:
 * 1. Runtime `STRAPI_URL` (`$env/dynamic/private`) — read from the container
 *    `.env` at startup, so the VPS API instance reaches Strapi over the
 *    internal docker network (`http://strapi-blue:1337`) without a rebuild.
 * 2. Build-time `VITE_URL` — dev / legacy fallback (public Strapi).
 *
 * See docs/PLAN_PROXY_SECURITY.md §5 (the VITE_URL trap) and
 * docs/DEPLOY_API_DOCKER.md.
 */
export const STRAPI_URL = (env.STRAPI_URL || import.meta.env.VITE_URL || 'http://127.0.0.1:1337').replace(/\/+$/, '');

/** Full GraphQL endpoint on the same Strapi instance. */
export const STRAPI_GRAPHQL = STRAPI_URL + '/graphql';
