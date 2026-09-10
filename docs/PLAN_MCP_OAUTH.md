# PLAN — OAuth for the MCP server (cloud connectors)

Status: **deployed to production, waiting on one env var.** Every route below
answers on `www.1lev1.com` today; `/api/mcp` still returns 200 to an
unauthenticated caller because `MCP_OAUTH_ENABLED` is not yet `true` there, and
until it is, no browser client begins the handshake.

## Why

`api.1lev1.com/api/mcp` authenticates with a **static** `Authorization: Bearer
1lev1_…` header. That works wherever the user controls a config file — Claude
Code's `.mcp.json`, `claude_desktop_config.json`, Cursor. It does **not** work
for **claude.ai in the browser**, which adds a remote MCP server as a *custom
connector* and authenticates it with **OAuth**. There is no field there to paste
a header.

Probed against production on 2026-08-31:

```
/.well-known/oauth-protected-resource         -> 404
/.well-known/oauth-authorization-server       -> 404
POST /oauth/register                          -> 404
POST /api/mcp  (no key)                       -> 200 OK   ← should be 401
```

The last line is the one that silently kills the flow: a client that *would*
start an OAuth handshake never learns that it needs to. It reads 200, sees two
tools, and reports success.

## Principle — OAuth wraps the api-key system, it does not replace it

The access token we hand out **is an api-key**, the same string
`generateApiKey()` already mints. Consequences, all of them good:

- `verifyApiKey()` / `verifyApiKeyDetailed()` are untouched.
- Scopes, `revoked`, `project` scoping, the 5-minute `KEY_CACHE`, and the
  Settings → API keys revocation screen all keep working, for cloud connectors
  too.
- Revoking a connector is the thing the user already knows how to do.
- Zero new Strapi content types. No migration.

## Flow

```
claude.ai                      api.1lev1.com                    user's browser
    |                                |                                |
    |-- POST /api/mcp (no token) --->|                                |
    |<-- 401 + WWW-Authenticate -----|   (names the resource metadata)|
    |                                |                                |
    |-- GET /.well-known/… --------->|                                |
    |<-- authorization_servers ------|                                |
    |-- POST /oauth/register ------->|   (RFC 7591, public client)     |
    |<-- client_id ------------------|                                |
    |-- redirect to /oauth/authorize ------------------------------->|
    |                                |<-- login + consent (/mcp-connect)
    |                                |--- mints api-key, wraps in code
    |<-- redirect ?code=…&state=… ---------------------------------- |
    |-- POST /oauth/token ---------->|   (PKCE verifier)               |
    |<-- access_token = the api-key -|                                |
    |-- POST /api/mcp + Bearer ----->|   verifyApiKey(), 18 tools      |
```

## Stateless codes — why, and the one limitation

Dynamic Client Registration and authorization codes normally need storage. Both
are made **stateless with HMAC/AEAD over a server secret**, so this ships without
touching Strapi's schema:

- **`client_id`** is `base64url(payload) + '.' + HMAC(payload)`, where payload
  carries the registered `redirect_uris` and `client_name`. `/oauth/authorize`
  verifies the signature and reads the allowed redirect URIs straight out of the
  client_id. A forged client_id fails the HMAC.
- **`code`** is an **AES-256-GCM** envelope over `{ key, userId, clientId,
  redirectUri, codeChallenge, exp }`. The raw api-key rides *inside* the
  ciphertext, so `/oauth/token` can return it even though the database only ever
  stored its hash. TTL 60s.

> **Limitation, deliberate:** single-use enforcement is an in-process
> `Set` of spent code ids (`REPLAY_CACHE`). On a single container — which is what
> `sveltekit-api` is today — that is exact. If this is ever scaled to multiple
> replicas, a code could be redeemed once per replica inside its 60-second
> window. The redemption still requires the matching PKCE verifier, so this is
> not an open door; it is a corner to close (shared cache / a Strapi row) before
> horizontal scaling. Recorded here rather than left to be discovered.

## The one behavioural break: 401 instead of 200

`/api/mcp` currently answers an unauthenticated POST with **200** and two public
tools (`getPlatformInfo`, `howToConnect`). The MCP spec wants **401 +
`WWW-Authenticate`**, and without it no browser client can begin the handshake.

Controlled by `MCP_PUBLIC_MODE`:

| value | unauthenticated POST | who it suits |
|---|---|---|
| `challenge` (**default once OAuth is on**) | 401 + `WWW-Authenticate` | claude.ai, any spec client |
| `public` (today's behaviour) | 200 + the 2 public tools | nothing that needs OAuth |

`getPlatformInfo` stays reachable — the 401 body is JSON-RPC and names the
discovery URL, and the two public tools remain available to a client that asks
with `?public=1`. Nobody loses the "what is 1lev1" answer; it just stops being
the response that hides an auth failure.

## Redirect-URI allowlist

`isValidCallback()` already gates the CLI's localhost callback via
`MCP_ALLOWED_HOSTS`. Registration reuses it, plus an explicit cloud entry:

```
MCP_OAUTH_REDIRECT_HOSTS=claude.ai,*.claude.ai,claude.com,*.claude.com
```

> Leaving `MCP_OAUTH_REDIRECT_HOSTS` **unset** is now the better default: the
> built-in list covers the Claude and ChatGPT callbacks together. Set it only to
> add a host the defaults do not carry (a Gemini Enterprise tenant), and
> remember that setting it *replaces* the defaults — include the Claude and
> ChatGPT entries yourself.

`https://claude.ai/api/mcp/auth_callback` is the one that matters. Wildcards
match a single leading label only. `http://` is refused except on localhost.

## Files

| Path | Role |
|---|---|
| `src/lib/server/oauth/secret.ts` | key derivation from `OAUTH_SECRET` (falls back to `API_KEY_NONCE`) |
| `src/lib/server/oauth/clients.ts` | stateless client_id mint/verify |
| `src/lib/server/oauth/codes.ts` | AES-GCM authorization codes + replay set |
| `src/lib/server/oauth/pkce.ts` | S256 verification |
| `src/lib/server/oauth/redirects.ts` | redirect-URI allowlist |
| `src/routes/[x+2e]well-known/oauth-authorization-server/+server.ts` | RFC 8414 metadata |
| `src/routes/[x+2e]well-known/oauth-protected-resource/+server.ts` | RFC 9728 metadata |
| `src/routes/oauth/register/+server.ts` | RFC 7591 |
| `src/routes/oauth/authorize/+server.ts` | validates, hands off to `/mcp-connect` |
| `src/routes/oauth/token/+server.ts` | code + PKCE → access_token |
| `src/routes/mcp-connect/+page.server.ts` | consent page, extended to emit a code |

> **SvelteKit gotcha:** a route directory may not begin with `.` — SvelteKit
> ignores dotfiles. `.well-known` is spelled `[x+2e]well-known` using
> SvelteKit's hex route encoding. nginx only intercepts
> `/.well-known/acme-challenge/`, so the rest already reaches the app.

## Environment

```
MCP_OAUTH_ENABLED=true            # off by default; nothing changes until set
MCP_PUBLIC_MODE=challenge         # or `public` to keep the old 200
OAUTH_SECRET=<64+ random chars>   # optional; falls back to API_KEY_NONCE
MCP_OAUTH_REDIRECT_HOSTS=claude.ai,*.claude.ai,claude.com,*.claude.com
```

> **Secret source gotcha, found the hard way.** `oauth/secret.ts` reads
> `process.env` **before** `$env/dynamic/private`, matching `apiKeys.ts` and
> `webhooks/secret.ts`. Under `vite dev` the two disagree: Vite layers
> `.env.local` over `.env`, so `$env/dynamic/private.API_KEY_NONCE` came back as
> a **15-character** value while `process.env.API_KEY_NONCE` held the real
> 60-character one. Deriving OAuth keys from the `$env` value would have signed
> against a different root than the api-key hashes use. Any new module reading
> this nonce must read it the same way the existing two do.

## Verification (2026-08-31, dev server)

Proven end to end over HTTP:

| Check | Result |
|---|---|
| `/.well-known/oauth-authorization-server` | 200, correct metadata — the `[x+2e]` route encoding works |
| `/.well-known/oauth-protected-resource` | 200 |
| `POST /oauth/register`, claude.ai callback | 201 + signed client_id |
| `POST /oauth/register`, `claude.ai.evil.com` | 400 `invalid_redirect_uri` |
| `/oauth/authorize`, forged client_id | **400, no redirect** |
| `/oauth/authorize`, unregistered redirect_uri | **400, no redirect** (not an open redirector) |
| `/oauth/authorize`, `code_challenge_method=plain` | 302 to the *registered* client, `error=invalid_request`, `state` preserved |
| `/oauth/authorize`, valid + anonymous | 302 to `/login`, signed request preserved |
| `POST /oauth/token`, bad grant/code/verifier | 400 with the right OAuth error each time |

25 unit tests cover the mint→redeem→PKCE round trip, replay, expiry, ciphertext
tampering, client_id forgery, the wildcard boundary (`a.b.claude.ai` refused),
and the 401's headers.

**Not yet exercised:** the consent step itself (`/mcp-connect` → code →
`/oauth/token` → access token), because it needs a logged-in browser session.
The pieces on either side of it are tested; the join is not.

## Verification (8.9.2026)

Against **production**, before any change here — the OAuth surface is live and
only the challenge is switched off:

| Check | Result |
|---|---|
| `www.1lev1.com/.well-known/oauth-authorization-server` | 200, correct metadata |
| `www.1lev1.com/.well-known/oauth-protected-resource` | 200 |
| `POST /oauth/register`, claude.ai callback | 201 + signed client_id |
| `POST /api/mcp`, no token | **200** — `MCP_OAUTH_ENABLED` is not set |
| `api.1lev1.com/.well-known/…` | 301 → `www` (see the issuer trap above) |

Against a **dev server with `MCP_OAUTH_ENABLED=true`**, after this change:

| Check | Result |
|---|---|
| `POST /api/mcp`, no token | 401 + `WWW-Authenticate: Bearer resource_metadata="…"` |
| `POST /api/mcp?public=1` | 200 — the escape hatch still answers |
| `POST /oauth/register`, ChatGPT callback + `auth_method: none` | 201 **with** `client_secret` |
| `POST /oauth/register`, `client_secret_post` | 201 |
| `POST /oauth/register`, `private_key_jwt` | 400, and the error names the three supported methods |
| `POST /oauth/register`, `chatgpt.com.evil.com` | 400 `invalid_redirect_uri` |
| `POST /oauth/token` with an HTTP Basic header | parses the header, then 400 `invalid_grant` on the bad code |

44 unit tests across `oauth.test.ts`, `defaultHosts.test.ts`, `challenge.test.ts`
and `keyDiagnosis.test.ts`.

## The issuer/origin trap (`api.` vs `www.`)

The metadata is derived from the origin the request arrived on
(`issuerFor(url)`), which is what lets one deployment answer on both hosts. It
also means the **URL a user pastes into the connector form decides the whole
handshake**, and the two hosts do not behave the same. Probed 8.9.2026:

```
GET https://api.1lev1.com/.well-known/oauth-protected-resource
  -> 301 https://www.1lev1.com/.well-known/oauth-protected-resource
  -> 200 {"resource":"https://www.1lev1.com/api/mcp", ...}
```

So a user who registers the connector as `https://api.1lev1.com/api/mcp` gets
back metadata claiming the resource is `https://www.1lev1.com/api/mcp`. RFC 9728
§3.3 says the client must check that the `resource` matches the server it is
talking to; a client that enforces it refuses the connector, and one that does
not carries on. We should not be relying on which of the two a given vendor
implemented.

Two ways out, and they are not exclusive:

1. **Publish `https://www.1lev1.com/api/mcp`** as the connector URL (the guide
   page and `1lev1-mcp/server.json` currently say `api.`). Costs nothing.
2. **Stop nginx redirecting `/.well-known/` on `api.1lev1.com`** so the api host
   serves its own metadata and the resource matches. nginx already special-cases
   `/.well-known/acme-challenge/`; this is the same shape of rule.

Until one of them is done, test the connector against **both** hosts rather than
assuming the `api.` URL works because the endpoint does.

---

## Part B — agents other than Claude

The server speaks plain MCP over Streamable HTTP, so "which agents can use it"
is a question about each vendor's client, not about us. State of play, 8.9.2026:

| Surface | How it connects | What we had to do |
|---|---|---|
| claude.ai (web + mobile app), Claude Code cloud sessions | custom connector, OAuth | nothing beyond this plan — connectors are passed into cloud sessions by the host |
| Claude Code / Desktop / Cursor / Windsurf / Cline / Roo / Continue / Antigravity / VS Code | `npx 1lev1-mcp` writes a Bearer header | already worked |
| **ChatGPT** (Plus and up) | Developer mode → custom connector, OAuth + DCR | redirect allowlist + `client_secret`, below |
| **Gemini CLI** | `~/.gemini/settings.json`, `httpUrl` + headers | manual for now; a CLI writer is a follow-up |
| **Gemini Enterprise** (Business edition) | admin adds a Streamable-HTTP MCP server under Connected apps | needs a **manually issued** client id + secret; no DCR |
| **Codex CLI** | `~/.codex/config.toml`, `url` + `bearer_token_env_var` | manual — TOML, and the CLI's writers are JSON-only |
| consumer Gemini app | not possible | connectors there are partnership-only |
| n8n / Zapier / anything home-grown | Bearer header against `/api/mcp` | already worked |

### Why a PKCE-only server now hands out a `client_secret`

Two clients refuse to work without one, for unrelated reasons:

- **ChatGPT** registers with `token_endpoint_auth_method: "none"` and then fails
  the connection if the 201 carries no `client_secret`. Reported repeatedly
  against other MCP servers; Claude registers fine against the same endpoint.
- **Gemini Enterprise** has no DCR at all. Its form has required Client ID and
  Client Secret fields that an admin types in.

`clientSecretFor()` derives the secret from the client_id with a **separate**
HKDF key (`1lev1-oauth-client-secret-v1`), so publishing a secret can never
forge a client_id. The token endpoint accepts the secret in the body
(`client_secret_post`) or as HTTP Basic (`client_secret_basic`), and:

- **absent** → public client, PKCE alone decides, unchanged from before;
- **correct** → accepted;
- **wrong** → `invalid_client`, 401.

The secret is deliberately **not load-bearing**. PKCE is still what protects the
exchange. This is a compatibility shim, and the comments in `clients.ts` say so
in as many words, so nobody later mistakes it for a second factor.

### Redirect allowlist

`DEFAULT_HOSTS` now also carries `chatgpt.com,*.chatgpt.com,openai.com,
*.openai.com` — ChatGPT's callback is
`https://chatgpt.com/connector_platform_oauth_redirect`. Gemini Enterprise
callbacks are per-tenant and are **not** in the default list on purpose: an
organisation that needs one is added through `MCP_OAUTH_REDIRECT_HOSTS`, which
replaces the list rather than extending it. `defaultHosts.test.ts` pins both
halves of that decision.

### Still manual, worth doing next

- A **`/oauth/manual-client`** screen (or a support flow) that mints a
  client_id + client_secret for a pasted redirect_uri, so a Gemini Enterprise
  admin is self-serve instead of emailing us. `mintClientId` already makes this
  a small job; the redirect allowlist is the part that needs a decision.
- **Gemini CLI and Codex CLI writers** in `1lev1-mcp`. Gemini CLI is JSON
  (`~/.gemini/settings.json`, key `httpUrl`) and drops straight into the
  existing writer table. Codex CLI is TOML and needs a new writer.

---

## Not in scope

- **Refresh tokens.** Api-keys do not expire, so the access token does not
  either. Adding rotation later means issuing a refresh token that mints a new
  api-key and revokes the old — not needed to make the connector work.
- **Per-connector scope selection in the consent screen.** The key is minted
  with today's default MCP scope set. Narrowing it is a follow-up on the
  existing scopes machinery, not on OAuth.
