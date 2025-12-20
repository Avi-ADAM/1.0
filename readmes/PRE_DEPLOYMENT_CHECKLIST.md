# 📋 Pre-Deployment Checklist

## ✅ מה שכבר מוכן

- [x] קוד מעודכן לתמיכה ב-subdomain
- [x] Cookie configuration עם `domain: '.1lev1.com'`
- [x] Socket server עם תמיכה ב-HTTPS
- [x] `.env` מעודכן עם `VITE_SOCKET_URL=https://socket.1lev1.com`
- [x] TypeScript build עובר בהצלחה
- [x] אין שגיאות diagnostics

## 🔧 מה צריך לעשות בשרת

### 1. DNS ✅ (כבר עשית)
- [x] `socket.1lev1.com` מצביע לשרת

### 2. SSL Certificate
```bash
sudo certbot certonly --standalone -d socket.1lev1.com
```
- [ ] Certificate created
- [ ] Paths noted:
  - Cert: `/etc/letsencrypt/live/socket.1lev1.com/fullchain.pem`
  - Key: `/etc/letsencrypt/live/socket.1lev1.com/privkey.pem`

### 3. Upload Files
```bash
# From your local machine
scp -r socket-server user@server:/path/to/app/
```
- [ ] Files uploaded

### 4. Install Dependencies
```bash
ssh user@server
cd /path/to/app/socket-server
npm install --production
```
- [ ] Dependencies installed

### 5. Configure Environment
```bash
nano socket-server/.env
```
Ensure it has:
```env
NODE_ENV=production
PORT=3001
CLIENT_URL=https://www.1lev1.com,https://1lev1.com
JWT_SECRET=LhG+hikwy9LDGlR6ifcXAg==
SSL_CERT=/etc/letsencrypt/live/socket.1lev1.com/fullchain.pem
SSL_KEY=/etc/letsencrypt/live/socket.1lev1.com/privkey.pem
```
- [ ] .env configured

### 6. Start Socket Server
```bash
npm install -g pm2
pm2 start dist/index.js --name socket-server
pm2 save
pm2 startup
```
- [ ] Server started
- [ ] PM2 configured

### 7. Test Socket Server
```bash
curl https://socket.1lev1.com/health
```
Expected: `{"status":"healthy",...}`
- [ ] Health check passes

### 8. Check Firewall
```bash
# If using direct connection
sudo ufw allow 3001/tcp

# Or if using Nginx reverse proxy
sudo ufw allow from 127.0.0.1 to any port 3001
```
- [ ] Firewall configured

### 9. Deploy SvelteKit App
```bash
# On your local machine
npm run build

# Deploy to hosting
# (method depends on your hosting provider)
```
- [ ] App deployed with new VITE_SOCKET_URL

### 10. Test End-to-End
1. Open `https://www.1lev1.com`
2. Login
3. Open DevTools → Console
4. Look for:
   - `[SocketClient] Connecting to https://socket.1lev1.com`
   - `[SocketClient] Connected`
   - `[Layout] User X authenticated successfully`

- [ ] Connection works
- [ ] Authentication succeeds
- [ ] Notifications received

## 🔍 Verification Commands

```bash
# DNS
nslookup socket.1lev1.com

# SSL
openssl s_client -connect socket.1lev1.com:443 -servername socket.1lev1.com

# Server status
pm2 status

# Logs
pm2 logs socket-server --lines 50

# Health
curl https://socket.1lev1.com/health

# Stats
curl https://socket.1lev1.com/stats
```

## 🐛 Common Issues

### Issue: "ENOENT: no such file or directory, open '/etc/letsencrypt/...'"
**Solution:** SSL certificate not found. Run certbot again.

### Issue: "Error: listen EADDRINUSE: address already in use :::3001"
**Solution:** Port already in use. Stop existing process:
```bash
pm2 stop socket-server
pm2 delete socket-server
pm2 start dist/index.js --name socket-server
```

### Issue: "Connection refused"
**Solution:** Check if server is running:
```bash
pm2 status
pm2 logs socket-server
```

### Issue: "Authentication failed"
**Solution:** JWT_SECRET mismatch. Verify it matches Strapi's JWT_SECRET.

### Issue: "Cookies not sent"
**Solution:** 
- Check `domain: '.1lev1.com'` in login cookies
- Verify `withCredentials: true` in socket client
- Ensure `sameSite: 'lax'` allows subdomain

## 📊 Monitoring

After deployment, monitor:

```bash
# Watch logs
pm2 logs socket-server -f

# Monitor stats
watch -n 5 'curl -s https://socket.1lev1.com/stats | jq'

# Check connections
pm2 monit
```

## 🎉 Success Criteria

- [ ] Socket server running on `https://socket.1lev1.com`
- [ ] Health endpoint returns `{"status":"healthy"}`
- [ ] Browser connects successfully
- [ ] Authentication succeeds
- [ ] Notifications work in real-time
- [ ] JWT cookie is `httpOnly: true`
- [ ] No errors in console
- [ ] No errors in server logs

## 📞 Support

If you encounter issues:
1. Check logs: `pm2 logs socket-server`
2. Verify SSL: `sudo certbot certificates`
3. Test health: `curl https://socket.1lev1.com/health`
4. Check browser console for errors
5. Verify cookies in DevTools → Application → Cookies

---

**Ready to deploy?** Follow the steps above and check them off as you go! 🚀
