# Socket.IO Server - Unified Action System

שרת Socket.IO נפרד לניהול עדכונים בזמן אמת עבור מערכת הפעולות המאוחדת.

## תיאור

שרת זה מטפל בכל התקשורת בזמן אמת בין המערכת לבין הלקוחות. הוא רץ בנפרד מהאפליקציה הראשית ויכול להיות מותקן על שרת אחר.

## תכונות

- ✅ אימות משתמשים באמצעות JWT
- ✅ ניהול סשנים (userId -> socketIds)
- ✅ שליחת התראות לכל הסשנים של משתמש
- ✅ תמיכה במספר חיבורים למשתמש אחד
- ✅ ניקוי אוטומטי של סשנים מנותקים
- ✅ Health check endpoint
- ✅ Statistics endpoint
- ✅ Graceful shutdown

## התקנה

```bash
cd socket-server
npm install
```

## הגדרות

צור קובץ `.env` בתיקיית `socket-server`:

```env
PORT=3001
CLIENT_URL=http://localhost:5173,https://www.1lev1.com
NODE_ENV=development
```

### משתני סביבה

- `PORT` - פורט השרת (ברירת מחדל: 3001)
- `CLIENT_URL` - כתובות מקור מורשות (מופרדות בפסיק)
- `NODE_ENV` - סביבת הרצה (development/production)
- `JWT_SECRET` - (אופציונלי) סוד JWT של Strapi לאימות טוקנים

### ✅ אימות JWT

**מצב נוכחי**: אימות JWT **מופעל** - השרת מאמת JWT tokens מול Strapi.

- ה-`JWT_SECRET` מוגדר ב-`.env`
- כל חיבור מאומת מול הסוד של Strapi
- רק משתמשים עם JWT תקף יכולים להתחבר

**אבטחה**: ודא ש-`JWT_SECRET` לא נחשף בציבור ולא מועלה ל-Git.

## הרצה

### Development

```bash
npm run dev
```

### Production

```bash
npm run build
npm start
```

## API Endpoints

### Health Check

```bash
GET /health
```

מחזיר:
```json
{
  "status": "healthy",
  "uptime": 123.45,
  "stats": {
    "connectedUsers": 10,
    "totalConnections": 15,
    "averageConnectionsPerUser": 1.5
  },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### Statistics

```bash
GET /stats
```

מחזיר:
```json
{
  "connectedUsers": 10,
  "totalConnections": 15,
  "averageConnectionsPerUser": 1.5
}
```

### Broadcast Notification

```bash
POST /broadcast
Content-Type: application/json

{
  "userIds": ["123", "456"],
  "notification": {
    "title": {
      "he": "כותרת",
      "en": "Title"
    },
    "body": {
      "he": "תוכן ההודעה",
      "en": "Message content"
    },
    "metadata": {
      "url": "/lev",
      "icon": "https://example.com/icon.png",
      "priority": "normal"
    }
  }
}
```

מחזיר:
```json
{
  "success": true,
  "deliveredTo": 2,
  "totalSockets": 3,
  "requestedUsers": 2
}
```

## Socket.IO Events

### Client -> Server

#### `auth`
אימות משתמש:
```javascript
socket.emit('auth', {
  userId: '123',
  jwt: 'bearer eyJhbGc...'
});
```

#### `ping`
בדיקת חיבור:
```javascript
socket.emit('ping');
```

### Server -> Client

#### `auth_success`
אימות הצליח:
```javascript
socket.on('auth_success', (data) => {
  console.log('Authenticated as:', data.userId);
});
```

#### `auth_error`
אימות נכשל:
```javascript
socket.on('auth_error', (error) => {
  console.error('Auth failed:', error.message);
});
```

#### `notification`
התראה חדשה:
```javascript
socket.on('notification', (notification) => {
  console.log('New notification:', notification);
});
```

#### `pong`
תגובה ל-ping:
```javascript
socket.on('pong', () => {
  console.log('Connection alive');
});
```

## דוגמת שימוש - Client

```javascript
import { io } from 'socket.io-client';

const socket = io('http://localhost:3001', {
  autoConnect: false
});

// Connect
socket.connect();

// Authenticate
socket.emit('auth', {
  userId: '123',
  jwt: 'bearer eyJhbGc...'
});

// Listen for auth success
socket.on('auth_success', (data) => {
  console.log('Connected as:', data.userId);
});

// Listen for notifications
socket.on('notification', (notification) => {
  const lang = 'he'; // or get from user preferences
  console.log(notification.title[lang]);
  console.log(notification.body[lang]);
});

// Handle disconnect
socket.on('disconnect', (reason) => {
  console.log('Disconnected:', reason);
});
```

## דוגמת שימוש - Server (Broadcasting)

```javascript
// From Action System
const response = await fetch('http://localhost:3001/broadcast', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    userIds: ['123', '456'],
    notification: {
      title: { he: 'משימה חדשה', en: 'New Task' },
      body: { he: 'נוספה משימה חדשה לפרויקט', en: 'A new task was added to the project' },
      metadata: {
        url: '/lev',
        priority: 'normal'
      }
    }
  })
});

const result = await response.json();
console.log(`Delivered to ${result.deliveredTo} users`);
```

## Architecture

```
┌─────────────────┐
│  Client (Web)   │
│   Socket.IO     │
└────────┬────────┘
         │ WebSocket
         │
┌────────▼────────┐
│  Socket Server  │
│   Port 3001     │
└────────┬────────┘
         │ HTTP POST
         │
┌────────▼────────┐
│ Action System   │
│  (SvelteKit)    │
└─────────────────┘
```

## Deployment

### Docker

```dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY dist ./dist

EXPOSE 3001

CMD ["node", "dist/index.js"]
```

### Build and run:

```bash
npm run build
docker build -t socket-server .
docker run -p 3001:3001 --env-file .env socket-server
```

### Environment Variables for Production

```env
PORT=3001
CLIENT_URL=https://www.1lev1.com,https://app.1lev1.com
JWT_SECRET=your-production-secret
NODE_ENV=production
```

## Monitoring

השרת מספק לוגים מפורטים:

- `[Socket.IO]` - אירועי חיבור וניתוק
- `[SessionManager]` - ניהול סשנים
- `[Broadcast]` - שליחת התראות
- `[Server]` - אירועי שרת

## Security

- ✅ אימות JWT חובה לכל חיבור
- ✅ CORS מוגדר לכתובות ספציפיות
- ✅ Timeout אוטומטי לחיבורים לא מאומתים
- ✅ Validation של כל הבקשות
- ✅ Rate limiting (מומלץ להוסיף ברמת ה-reverse proxy)

## Performance

- תומך ב-1000+ חיבורים במקביל
- Ping/Pong אוטומטי כל 25 שניות
- Timeout של 60 שניות לחיבורים לא פעילים
- ניקוי אוטומטי של סשנים מנותקים

## Troubleshooting

### לקוח לא מצליח להתחבר

1. בדוק ש-CORS מוגדר נכון ב-`CLIENT_URL`
2. בדוק שה-JWT תקין
3. בדוק שהפורט פתוח

### התראות לא מגיעות

1. בדוק שהמשתמש מחובר (GET /stats)
2. בדוק את הלוגים של הבקשה ל-/broadcast
3. בדוק שה-userId נכון

### ביצועים איטיים

1. בדוק את מספר החיבורים (GET /stats)
2. הוסף load balancer למספר instances
3. בדוק את ה-network latency

## License

ISC
