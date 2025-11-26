# Socket.IO Server - Deployment Guide

מדריך להתקנה והפעלה של שרת ה-Socket.IO על שרת ייעודי.

## דרישות מערכת

- Node.js 20 או גרסה חדשה יותר
- 512MB RAM מינימום (מומלץ 1GB+)
- פורט פתוח (ברירת מחדל: 3001)

## אפשרויות Deployment

### 1. Deployment ישיר עם Node.js

#### התקנה

```bash
# Clone או העתק את תיקיית socket-server לשרת
cd socket-server

# התקן dependencies
npm ci --only=production

# Build
npm run build
```

#### הגדרת Environment Variables

צור קובץ `.env`:

```env
PORT=3001
CLIENT_URL=https://www.1lev1.com,https://app.1lev1.com
JWT_SECRET=your-production-secret-here
NODE_ENV=production
```

#### הרצה

```bash
# הרצה רגילה
npm start

# או עם PM2 (מומלץ)
npm install -g pm2
pm2 start dist/index.js --name socket-server
pm2 save
pm2 startup
```

### 2. Deployment עם Docker

#### Build Image

```bash
cd socket-server
docker build -t socket-server:latest .
```

#### הרצה עם Docker

```bash
docker run -d \
  --name socket-server \
  --restart unless-stopped \
  -p 3001:3001 \
  -e PORT=3001 \
  -e CLIENT_URL=https://www.1lev1.com \
  -e JWT_SECRET=your-secret \
  -e NODE_ENV=production \
  socket-server:latest
```

#### הרצה עם Docker Compose

```bash
# צור קובץ .env
cat > .env << EOF
CLIENT_URL=https://www.1lev1.com
JWT_SECRET=your-production-secret
NODE_ENV=production
EOF

# הרץ
docker-compose up -d

# בדוק logs
docker-compose logs -f

# עצור
docker-compose down
```

### 3. Deployment על VPS (Ubuntu/Debian)

#### התקנה מלאה

```bash
# עדכן מערכת
sudo apt update && sudo apt upgrade -y

# התקן Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# התקן PM2
sudo npm install -g pm2

# צור משתמש ייעודי
sudo useradd -m -s /bin/bash socketserver
sudo su - socketserver

# Clone/העתק את הקוד
cd ~
# העתק את תיקיית socket-server לכאן

cd socket-server
npm ci --only=production
npm run build

# הגדר environment variables
cat > .env << EOF
PORT=3001
CLIENT_URL=https://www.1lev1.com
JWT_SECRET=your-production-secret
NODE_ENV=production
EOF

# הרץ עם PM2
pm2 start dist/index.js --name socket-server
pm2 save
pm2 startup

# חזור למשתמש root
exit

# הגדר PM2 להתחיל עם המערכת
sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u socketserver --hp /home/socketserver
```

#### הגדרת Nginx Reverse Proxy

```nginx
# /etc/nginx/sites-available/socket-server

upstream socket_server {
    server localhost:3001;
}

server {
    listen 80;
    server_name socket.1lev1.com;

    location / {
        proxy_pass http://socket_server;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
}
```

```bash
# הפעל את ההגדרה
sudo ln -s /etc/nginx/sites-available/socket-server /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx

# התקן SSL עם Let's Encrypt
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d socket.1lev1.com
```

### 4. Deployment על שירותי Cloud

#### AWS EC2

1. צור EC2 instance (t3.micro מספיק להתחלה)
2. פתח פורט 3001 ב-Security Group
3. התחבר ל-instance
4. עקוב אחרי ההוראות של VPS למעלה

#### DigitalOcean Droplet

1. צור Droplet עם Ubuntu 22.04
2. פתח פורט 3001 ב-Firewall
3. התחבר ל-Droplet
4. עקוב אחרי ההוראות של VPS למעלה

#### Google Cloud Run

```bash
# Build ו-push ל-Container Registry
gcloud builds submit --tag gcr.io/PROJECT_ID/socket-server

# Deploy
gcloud run deploy socket-server \
  --image gcr.io/PROJECT_ID/socket-server \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars PORT=8080,CLIENT_URL=https://www.1lev1.com,JWT_SECRET=your-secret,NODE_ENV=production
```

## בדיקת התקנה

### בדיקת Health

```bash
curl http://your-server:3001/health
```

תגובה מצופה:
```json
{
  "status": "healthy",
  "uptime": 123.45,
  "stats": {...},
  "timestamp": "..."
}
```

### בדיקת חיבור Socket.IO

```javascript
// מהדפדפן
const socket = io('http://your-server:3001');
socket.on('connect', () => console.log('Connected!'));
```

## Monitoring

### PM2 Monitoring

```bash
# סטטוס
pm2 status

# Logs
pm2 logs socket-server

# Monitoring dashboard
pm2 monit

# Restart
pm2 restart socket-server

# Stop
pm2 stop socket-server
```

### Docker Monitoring

```bash
# Logs
docker logs -f socket-server

# Stats
docker stats socket-server

# Restart
docker restart socket-server
```

### Logs

הלוגים כוללים:
- חיבורים וניתוקים
- אימותים
- שליחת התראות
- שגיאות

## Scaling

### Horizontal Scaling

אם יש יותר מ-1000 משתמשים מחוברים במקביל:

1. הרץ מספר instances של השרת
2. השתמש ב-Redis adapter ל-Socket.IO:

```javascript
// בקובץ index.ts
import { createAdapter } from '@socket.io/redis-adapter';
import { createClient } from 'redis';

const pubClient = createClient({ url: 'redis://localhost:6379' });
const subClient = pubClient.duplicate();

await Promise.all([pubClient.connect(), subClient.connect()]);

io.adapter(createAdapter(pubClient, subClient));
```

3. השתמש ב-Load Balancer (Nginx/HAProxy) עם sticky sessions

### Vertical Scaling

- הגדל את ה-RAM (מומלץ 2GB+ ל-1000+ משתמשים)
- הגדל את מספר ה-CPU cores

## Security Best Practices

1. **JWT Secret**: השתמש ב-secret חזק ושמור אותו בסוד
2. **CORS**: הגדר רק את הדומיינים המורשים
3. **Firewall**: פתח רק את הפורט הנדרש
4. **HTTPS**: השתמש ב-SSL/TLS (דרך Nginx)
5. **Rate Limiting**: הוסף rate limiting ברמת ה-reverse proxy
6. **Updates**: עדכן dependencies באופן קבוע

## Troubleshooting

### השרת לא עולה

```bash
# בדוק logs
pm2 logs socket-server
# או
docker logs socket-server

# בדוק שהפורט פנוי
sudo netstat -tulpn | grep 3001
```

### לקוחות לא מצליחים להתחבר

1. בדוק CORS settings
2. בדוק שהפורט פתוח בפיירוול
3. בדוק שה-JWT secret זהה לשרת הראשי

### ביצועים נמוכים

1. בדוק CPU/RAM usage
2. בדוק מספר חיבורים פעילים
3. שקול scaling

## Backup & Recovery

### Backup

אין צורך ב-backup של data (השרת stateless)
שמור backup של:
- קובץ `.env`
- הגדרות Nginx
- PM2 ecosystem file

### Recovery

```bash
# Restore מ-backup
cd socket-server
npm ci --only=production
npm run build

# העתק .env
cp /backup/.env .

# הרץ
pm2 start dist/index.js --name socket-server
```

## Support

לבעיות או שאלות:
1. בדוק את הלוגים
2. בדוק את ה-health endpoint
3. בדוק את ה-stats endpoint
4. פתח issue ב-GitHub
