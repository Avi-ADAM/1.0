# Connecting to 1lev1

## The flow

```bash
npx 1lev1-mcp
```

The CLI opens `https://1lev1.com/mcp-connect?callback=http://localhost:<port>`.
The user logs in (or registers), sees exactly what they are approving, and hits
approve. 1lev1 mints an API key and redirects it back to the CLI, which writes
the MCP server entry into the client config. **The client must be restarted**
before the authenticated tools appear.

Manual alternative: log in, go to Settings -> API keys, create a key named `MCP`,
then add to `.mcp.json`:

```json
{
  "mcpServers": {
    "1lev1": {
      "type": "http",
      "url": "https://api.1lev1.com/api/mcp",
      "headers": { "Authorization": "Bearer 1lev1_..." }
    }
  }
}
```

## Key facts

- Keys look like `1lev1_<base36 user id>_<48 hex chars>`. The user id is encoded
  in the key; the server stores only an HMAC of it, never the key itself.
- One key per approval. Re-approving from `/mcp-connect` **replaces** the
  previous MCP key and revokes the old one - warn the user before they re-run
  the CLI on a machine where a working key already exists.
- Keys can carry scopes (a set of rikmas, a set of allowed operations). A scoped
  key silently sees less; if a rikma the user expects is missing, check the key's
  scopes before assuming a bug.
- Revoke from Settings -> API keys. Revocation is honoured on the server within
  the key cache TTL (5 minutes).
- A key is a bearer credential for a real person's account. Never echo it into
  chat, a commit, a log line, or a file the user did not ask for.

## Troubleshooting

**Only `getPlatformInfo`, `howToConnect` and `createNewApiKey` are listed.**
No `Authorization` header reached the server — the client is genuinely
unconfigured. `npx 1lev1-mcp` is the right answer here.

**`fixRejectedApiKey` is listed.**
A key *was* sent and the server refused it. This is **not** the unconfigured
case, so do not tell the user to sign up. Call the tool; it names the reason
(`malformed` / `unknown` / `revoked`) and gives the repair steps.

Do **not** open with "re-run `npx 1lev1-mcp`". That is the advice that turns this
into a loop, for two compounding reasons:

1. The CLI writes the **user-level** config (`~/.claude.json` → `mcpServers`).
   It does not touch the other places the same server is configured, and in
   Claude Code a project's `.mcp.json` **outranks** the user-level entry. A
   stale block there keeps winning over every key minted afterwards.
2. Re-approving at `/mcp-connect` **revokes the previous key** (see Key facts).
   So each re-run kills the key the stale entry is still sending. The user sees
   an identical failure after every restart, and the setup is getting worse, not
   standing still.

Work in this order instead:

1. **Find every `1lev1` / `1lev1-mcp` entry and delete the stale ones**, leaving
   exactly one. Look in, highest precedence first:
   - `<project>/.mcp.json` — often committed to the repo
   - `~/.claude.json` → `projects["<abs path>"].mcpServers`
   - `~/.claude.json` → `mcpServers` — the only one the CLI writes
   - `~/.claude/settings.json`, `<project>/.claude/settings.local.json`
   - other clients: `~/.cursor/mcp.json`, Windsurf, VS Code `settings.json`
2. Only then run `npx 1lev1-mcp`, and restart the client.
3. If the key lived in a tracked file, revoke it at Settings → API keys and keep
   the replacement in the user-level config only.

Which key is actually live is answerable in one request — a working key lists the
full mission/timer set, a rejected one lists only the connection tools:

```bash
curl -s -X POST https://api.1lev1.com/api/mcp \
  -H "Authorization: Bearer $KEY" -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}'
```

Run it once per candidate key to find which config file is the one being used.

**401 on every call.**
The key is revoked, or it was minted against a different deployment. Keys are
HMAC'd with a per-environment secret, so a key created against one environment
will not verify against another. Mint a fresh key from the environment you are
actually pointing at — after step 1 above.

**Tools appear but return empty lists.**
The account is real but has no rikmas yet, or the key is scoped to rikmas the
user is not in. Confirm with `findUserProjectsTool` before reporting a failure.

**Do not** work around auth problems by falling back to scraping 1lev1.com or by
inventing data. Say the connection is broken and stop.
