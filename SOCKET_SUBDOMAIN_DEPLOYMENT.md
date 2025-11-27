# Socket.IO Subdomain Deployment - socket.1lev1.com

## ✅ מה שכבר עשית

1. ✅ הגדרת DNS: `socket.1lev1.com`
2. ✅ עדכנת `.env`: `VITE_SOCKET_URL=https://socket.1lev1.com`

## 📋 Checklist - מה צריך לעשות עכשיו

### 1. SSL Certificate

אם עדיין לא הוצאת SSL certificate ל-`socket.1lev1.com`:

```bash
# Option A: Using Certbot (Let's Encrypt)
sudo certbot certonly --standalone -d socket.1lev1.com

# Option B: Using existing wildcard certificate
# If you have *.1lev1.com certificate, you can use it
```

הסרטיפיקט יהיה ב:
- Certificate: `/etc/letsencrypt/live/socket.1lev1.com/fullchain.pem`
- Private Key: `/etc/letsencrypt/live/socket.1lev1.com/privkey.pem`

### 2. Update Socket Server .env

הקובץ `socket-server/.env` כבר מעודכן עם:
```env
NODE_ENV=production
SSL_CERT=/etc/letsencrypt/live/socket.1lev1.com/fullchain.pem
SSL_KEY=/etc/letsencrypt/live/socket.1lev1.com/privkey.pem
```

אם הנתיבים שונים, עדכן אותם.

### 3. Build and Deploy Socket Server

```bash
cd socket-server

# Install dependencies
npm install

# Build TypeScript
npm run build

# Test locally first
npm start

# Check health
curl http://localhost:3001/health
```

### 4. Production Deployment

**Option A: PM2 (Recommended)**
```bash
# Install PM2 globally
npm install -g pm2

# Start socket server
pm2 start dist/index.js --name socket-server

# Save PM2 configuration
pm2 save

# Setup auto-restart on reboot
pm2 startup
```

**Option B: Systemd Service**
```bash
# Create service file
sudo nano /etc/systemd/system/socket-server.service
```

```ini
[Unit]
Description=Socket.IO Server for 1lev1
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/path/to/socket-server
ExecStart=/usr/bin/node dist/index.js
Restart=always
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
```

```bash
# Enable and start
sudo systemctl enable socket-server
sudo systemctl start socket-server
sudo systemctl status socket-server
```

### 5. Firewall Configuration

```bash
# Allow port 3001 (if using direct connection)
sudo ufw allow 3001/tcp

# Or if using Nginx reverse proxy, only allow from localhost
sudo ufw allow from 127.0.0.1 to any port 3001
```

### 6. Nginx Reverse Proxy (Optional but Recommended)

```nginx
# /etc/nginx/sites-available/socket.1lev1.com
server {
    listen 443 ssl http2;
    server_name socket.1lev1.com;

    ssl_certificate /etc/letsencrypt/live/socket.1lev1.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/socket.1lev1.com/privkey.pem;

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
        
        # CORS headers (if needed)
        add_header Access-Control-Allow-Origin "https://www.1lev1.com" always;
        add_header Access-Control-Allow-Credentials "true" always;
    }
}

# Redirect HTTP to HTTPS
server {
    listen 80;
    server_name socket.1lev1.com;
    return 301 https://$server_name$request_uri;
}
```

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/socket.1lev1.com /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 7. Test Connection

```bash
# Test health endpoint
curl https://socket.1lev1.com/health

# Expected response:
# {"status":"healthy","uptime":123,"stats":{...}}

# Test WebSocket connection (from browser console on www.1lev1.com)
# Open DevTools → Console
```

```javascript
const socket = io('https://socket.1lev1.com', {
  withCredentials: true
});

socket.on('connect', () => {
  console.log('Connected!', socket.id);
});

socket.on('auth_success', (data) => {
  console.log('Authenticated!', data);
});
```

### 8. Deploy SvelteKit App

```bash
# Build with updated VITE_SOCKET_URL
npm run build

# Deploy to your hosting
# The app will now connect to https://socket.1lev1.com
```

## 🔍 Verification Checklist

- [ ] DNS resolves: `nslookup socket.1lev1.com`
- [ ] SSL works: `curl https://socket.1lev1.com/health`
- [ ] Socket server running: `pm2 status` or `systemctl status socket-server`
- [ ] Health endpoint responds: `{"status":"healthy"}`
- [ ] WebSocket connects from browser
- [ ] Cookies sent with connection (check Network tab)
- [ ] Authentication succeeds (`auth_success` event)
- [ ] Notifications received

## 🐛 Troubleshooting

### Connection Refused
```bash
# Check if server is running
pm2 status
# or
sudo systemctl status socket-server

# Check logs
pm2 logs socket-server
# or
sudo journalctl -u socket-server -f
```

### SSL Certificate Error
```bash
# Verify certificate
openssl s_client -connect socket.1lev1.com:443 -servername socket.1lev1.com

# Check certificate expiry
sudo certbot certificates
```

### Cookies Not Sent
- Verify `domain: '.1lev1.com'` in login cookies
- Check browser DevTools → Application → Cookies
- Ensure `withCredentials: true` in socket client
- Verify `sameSite: 'lax'` allows subdomain

### Authentication Fails
```bash
# Check JWT_SECRET matches between SvelteKit and Socket server
# Check socket server logs
pm2 logs socket-server --lines 100
```

### CORS Errors
- Verify `CLIENT_URL` includes all origins
- Check Nginx CORS headers
- Ensure `credentials: true` in Socket.IO config

## 📊 Monitoring

```bash
# Watch logs
pm2 logs socket-server --lines 50 -f

# Monitor stats
watch -n 1 'curl -s https://socket.1lev1.com/stats | jq'

# Check connections
pm2 monit
```

## 🔄 Updates

When updating socket server:
```bash
cd socket-server
git pull
npm install
npm run build
pm2 restart socket-server
```

## 🎉 Success!

אם הכל עובד, תראה:
1. ✅ Socket connects to `wss://socket.1lev1.com`
2. ✅ `auth_success` event received
3. ✅ Notifications appear in real-time
4. ✅ JWT cookie is `httpOnly: true` (more secure!)

המערכת עכשיו מאובטחת יותר ומוכנה לפרודקשן! 🚀
