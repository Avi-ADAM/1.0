# 🚀 Quick Deployment Steps - socket.1lev1.com

## מה שכבר עשינו ✅

1. ✅ עדכנו `.env`: `VITE_SOCKET_URL=https://socket.1lev1.com`
2. ✅ עדכנו cookies ל-`domain: '.1lev1.com'`
3. ✅ הוספנו תמיכה ב-HTTPS לשרת הסוקט
4. ✅ בנינו את שרת הסוקט (`npm run build`)

## מה צריך לעשות בשרת 🔧

### 1. העלה את הקבצים לשרת

```bash
# Upload socket-server folder to server
scp -r socket-server user@server:/path/to/app/
```

### 2. התקן dependencies בשרת

```bash
ssh user@server
cd /path/to/app/socket-server
npm install --production
```

### 3. הוצא SSL Certificate (אם עדיין לא)

```bash
sudo certbot certonly --standalone -d socket.1lev1.com
```

### 4. עדכן `.env` בשרת

ודא ש-`socket-server/.env` מכיל:
```env
NODE_ENV=production
PORT=3001
CLIENT_URL=https://www.1lev1.com,https://1lev1.com
JWT_SECRET=LhG+hikwy9LDGlR6ifcXAg==
SSL_CERT=/etc/letsencrypt/live/socket.1lev1.com/fullchain.pem
SSL_KEY=/etc/letsencrypt/live/socket.1lev1.com/privkey.pem
```

### 5. הרץ את שרת הסוקט

**עם PM2 (מומלץ):**
```bash
npm install -g pm2
pm2 start dist/index.js --name socket-server
pm2 save
pm2 startup
```

**או ישירות (לבדיקה):**
```bash
npm start
```

### 6. בדוק שזה עובד

```bash
# Test health endpoint
curl https://socket.1lev1.com/health

# Should return:
# {"status":"healthy","uptime":...}
```

### 7. Deploy את SvelteKit App

```bash
# Build with new socket URL
npm run build

# Deploy to your hosting
```

## בדיקה מהדפדפן 🌐

1. פתח את `https://www.1lev1.com`
2. התחבר (login)
3. פתח DevTools → Console
4. חפש: `[SocketClient] Connected`
5. חפש: `[SocketClient] Authentication successful`

## אם משהו לא עובד 🔍

### בעיה: Connection refused
```bash
# Check if server is running
pm2 status
pm2 logs socket-server
```

### בעיה: SSL error
```bash
# Verify certificate exists
ls -la /etc/letsencrypt/live/socket.1lev1.com/
```

### בעיה: Authentication fails
```bash
# Check JWT_SECRET matches
# Compare socket-server/.env with Strapi JWT_SECRET
```

### בעיה: Cookies not sent
- ודא ש-`domain: '.1lev1.com'` מוגדר בlogin
- בדוק ב-DevTools → Application → Cookies
- ודא שיש cookie בשם `jwt` עם domain `.1lev1.com`

## סיכום מהיר 📝

```
1. Upload socket-server to server
2. npm install --production
3. Get SSL cert: certbot certonly -d socket.1lev1.com
4. Update .env with SSL paths
5. pm2 start dist/index.js --name socket-server
6. Test: curl https://socket.1lev1.com/health
7. Deploy SvelteKit app
8. Test in browser
```

זהו! המערכת אמורה לעבוד עכשיו עם subdomain מאובטח! 🎉
