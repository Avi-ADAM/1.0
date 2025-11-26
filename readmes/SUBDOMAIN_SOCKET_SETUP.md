# Socket.IO על Subdomain - so.1lev1.com

## סקירה כללית

הפתרון המומלץ: להריץ את שרת הסוקט על subdomain ייעודי.

```
www.1lev1.com     → SvelteKit (port 5173/443)
so.1lev1.com      → Socket.IO (port 3001)
```

## למה זה עובד?

כשהסוקט על subdomain של אותו domain, הדפדפן מתייחס אליו כ-**same-site** ושולח cookies אוטומטית!

## שלבי ההגדרה

### 1. DNS Configuration

הוסף A record או CNAME:
```
Type: A
Name: so
Value: <IP של השרת>
TTL: 3600
```

או:
```
Type: CNAME
Name: so
Value: www.1lev1.com
TTL: 3600
```

### 2. SSL Certificate

צריך SSL certificate ל-`so.1lev1.com`. אפשרויות:

**Option A: Wildcard Certificate**
```bash
certbot certonly --dns-cloudflare \
  -d *.1lev1.com \
  -d 1lev1.com
```

**Option B: Specific Certificate**
```bash
certbot certonly --standalone \
  -d so.1lev1.com
```

### 3. Socket Server Configuration

עדכן את `socket-server/.env`:
```env
PORT=3001
CLIENT_URL=https://www.1lev1.com,https://1lev1.com
NODE_ENV=production
JWT_SECRET=<your-secret>

# SSL Configuration (if running standalone)
SSL_CERT=/etc/letsencrypt/live/so.1lev1.com/fullchain.pem
SSL_KEY=/etc/letsencrypt/live/so.1lev1.com/privkey.pem
```

### 4. Update Socket Server for HTTPS

עדכן את `socket-server/src/index.ts`:

```typescript
import { createServer } from 'https'; // Change from 'http'
import { readFileSync } from 'fs';

// SSL Configuration
const sslOptions = process.env.NODE_ENV === 'production' ? {
  cert: readFileSync(process.env.SSL_CERT || ''),
  key: readFileSync(process.env.SSL_KEY || '')
} : undefined;

// Create HTTPS server in production, HTTP in development
const httpServer = sslOptions 
  ? createServer(sslOptions)
  : createServer();
```

### 5. Update Cookie Configuration

עדכן את `src/routes/login/+page.server.js`:

```javascript
cookies.set('jwt', jwt, {
  path: '/',
  domain: '.1lev1.com', // Important: allows subdomain access
  expires: new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
  httpOnly: true,        // ✅ Now we can use httpOnly!
  secure: true,          // ✅ HTTPS only
  sameSite: 'lax'        // ✅ Allows subdomain
});

cookies.set('id', user.id, {
  path: '/',
  domain: '.1lev1.com',
  expires: new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
  httpOnly: false,       // Keep accessible for client
  secure: true,
  sameSite: 'lax'
});
```

### 6. Update Client Configuration

עדכן את `.env`:
```env
VITE_SOCKET_URL=https://so.1lev1.com
```

### 7. Nginx/Reverse Proxy (Optional)

אם אתה משתמש ב-Nginx, אפשר להפנות:

```nginx
# Main site
server {
    listen 443 ssl http2;
    server_name www.1lev1.com 1lev1.com;
    
    ssl_certificate /etc/letsencrypt/live/www.1lev1.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/www.1lev1.com/privkey.pem;
    
    location / {
        proxy_pass http://localhost:5173;
        # ... other config
    }
}

# Socket.IO subdomain
server {
    listen 443 ssl http2;
    server_name so.1lev1.com;
    
    ssl_certificate /etc/letsencrypt/live/so.1lev1.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/so.1lev1.com/privkey.pem;
    
    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # WebSocket timeouts
        proxy_read_timeout 86400;
        proxy_send_timeout 86400;
    }
}
```

## שינויים בקוד

### Socket Server - Remove Explicit Auth

עכשיו הסוקט יכול לקרוא JWT מ-cookie ישירות:

```typescript
io.on('connection', (socket) => {
  // Extract cookies from handshake
  const cookieHeader = socket.handshake.headers.cookie;
  const cookies = parseCookies(cookieHeader);
  
  const jwt = cookies.jwt;  // ✅ Now available!
  const userId = cookies.id;
  
  // Validate and authenticate...
});
```

### Client - Simplify Connection

```typescript
// No need to pass JWT at all!
socketClient.connect(userId);
```

הסוקט יקבל את ה-JWT אוטומטית מה-cookie.

## בדיקה

1. **Deploy socket server** על `so.1lev1.com`
2. **Update environment variables**
3. **Test connection**:
   ```javascript
   // In browser console on www.1lev1.com
   document.cookie // Should show jwt cookie
   
   // Socket should connect automatically
   ```

## Security Benefits

✅ **httpOnly: true** - JavaScript לא יכול לגשת ל-JWT
✅ **secure: true** - Cookie רק על HTTPS
✅ **sameSite: lax** - הגנה מפני CSRF
✅ **domain: .1lev1.com** - זמין לכל subdomains
✅ **No JWT in URL** - JWT לא נחשף בכלל

## Monitoring

```bash
# Check socket server
curl https://so.1lev1.com/health

# Check SSL
openssl s_client -connect so.1lev1.com:443 -servername so.1lev1.com

# Check DNS
nslookup so.1lev1.com
```

## Rollback Plan

אם משהו לא עובד:
1. החזר את `VITE_SOCKET_URL` ל-`http://localhost:3001`
2. החזר cookies ל-`httpOnly: false`
3. הקוד הנוכחי ימשיך לעבוד

## Cost

- **DNS**: חינם (רק A record)
- **SSL**: חינם (Let's Encrypt)
- **Server**: אותו שרת, רק subdomain אחר

זה הפתרון המושלם! 🎉
