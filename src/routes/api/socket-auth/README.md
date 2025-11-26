# Cookie-Based Socket.IO Authentication

## Overview

Socket.IO authentication uses cookies for automatic authentication. Currently, the JWT cookie is accessible to JavaScript (`httpOnly: false`) for backward compatibility with legacy code.

## ⚠️ Current Security Status

**Current State**: JWT cookie is `httpOnly: false`
- JWT is accessible to client-side JavaScript
- Required because Socket.IO server runs on different port (3001)
- Cookies with `httpOnly: true` are not sent cross-origin

**Future Improvement**: See "Production Security Recommendations" below

## How It Works

1. **User logs in** → SvelteKit sets HTTP-only `jwt` and `id` cookies
2. **Client connects to Socket.IO** → Browser automatically sends cookies
3. **Socket server reads cookies** → Validates JWT from cookie header
4. **Connection authenticated** → User receives real-time notifications

## Security Benefits

- **JWT never exposed to JavaScript** - Cannot be stolen via XSS
- **Automatic cookie handling** - Browser manages secure transmission
- **Same-origin policy** - Cookies only sent to same domain
- **HTTP-only flag** - JavaScript cannot access the cookie
- **Secure flag** - Cookie only sent over HTTPS (production)

## Architecture

```
┌─────────────┐                    ┌──────────────┐
│   Browser   │                    │ Socket.IO    │
│             │                    │   Server     │
│  SvelteKit  │                    │              │
└──────┬──────┘                    └──────┬───────┘
       │                                  │
       │  1. Connect with credentials     │
       │  withCredentials: true           │
       ├─────────────────────────────────>│
       │  (Cookies sent automatically)    │
       │                                  │
       │  2. Server reads JWT from cookie │
       │     Validates & authenticates    │
       │                                  │
       │  3. auth_success event           │
       │<─────────────────────────────────┤
       │                                  │
       │  4. Real-time notifications      │
       │<─────────────────────────────────┤
       │                                  │
```

## Client Usage

**Current Approach**
```svelte
<script>
  import { socketClient } from '$lib/stores/socketClient';
  import { browser } from '$app/environment';
  
  // Connect - JWT is read from cookie automatically
  if (browser && data?.id) {
    socketClient.connect(data.id);
  }
</script>
```

The client will:
1. Read JWT from `document.cookie` (accessible because `httpOnly: false`)
2. Send JWT to Socket.IO server via `auth` event
3. Server validates JWT and establishes authenticated connection

**Alternative (Explicit JWT)**
```svelte
<script>
  // Can also pass JWT explicitly if needed
  if (browser && data?.id && data?.jwt) {
    socketClient.connect(data.id, data.jwt);
  }
</script>
```

## Server Configuration

The Socket.IO server is configured to:
- Accept credentials: `credentials: true`
- Parse cookies from handshake headers
- Validate JWT from `jwt` cookie
- Verify user ID from `id` cookie

See `socket-server/src/index.ts` for implementation.

## Cookie Configuration

Cookies are set in `src/hooks.server.js`:

```javascript
event.locals.tok = event.cookies.get('jwt') || false;
event.locals.uid = event.cookies.get('id') || false;
```

For production, ensure cookies have:
- `httpOnly: true` - Prevent JavaScript access
- `secure: true` - HTTPS only
- `sameSite: 'strict'` - CSRF protection
- `path: '/'` - Available to all routes

## Migration from Legacy

If you have code using the old approach:

1. **Remove JWT parameter** from `socketClient.connect()`
2. **Remove `/api/socket-auth` calls** - no longer needed
3. **Ensure `withCredentials: true`** in socket config (already set)
4. **Test** - connection should work automatically

## Troubleshooting

**Connection fails with "Not authenticated"**
- Check that `jwt` and `id` cookies are set
- Verify cookies are sent with request (check Network tab)
- Ensure `withCredentials: true` in socket config
- Check CORS allows credentials

**JWT validation fails**
- Verify JWT_SECRET matches between SvelteKit and Socket server
- Check JWT hasn't expired
- Ensure JWT format is correct (bearer token)

## Production Security Recommendations

For production deployment, consider one of these approaches:

### Option 1: Reverse Proxy (Recommended)
Run Socket.IO behind a reverse proxy on the same domain:
```
https://www.1lev1.com/api/...     → SvelteKit
https://www.1lev1.com/socket.io/  → Socket.IO Server
```

Benefits:
- Same origin = cookies sent automatically
- Can use `httpOnly: true` for JWT
- No CORS issues
- Better security

### Option 2: Session Token
Create a separate session token for Socket.IO:
1. Client requests session token from `/api/socket-session`
2. Server creates short-lived token (5 min) stored in Redis
3. Client connects with session token in query param
4. Socket server validates session token

Benefits:
- JWT never exposed to client
- Short-lived tokens
- Can revoke sessions

### Option 3: Current Approach (Temporary)
Keep JWT in non-httpOnly cookie:
- Simple to implement
- Works with current architecture
- Less secure but acceptable for MVP
- Should be upgraded before production

## Related Files

- `src/routes/+layout.svelte` - Connects to socket on app load
- `src/lib/stores/socketClient.ts` - Socket.IO client wrapper
- `socket-server/src/index.ts` - Socket server with cookie auth
- `src/hooks.server.js` - Sets JWT cookies
- `src/routes/login/+page.server.js` - Sets JWT cookie on login
