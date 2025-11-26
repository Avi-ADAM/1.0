# JWT Configuration Guide

## מצב נוכחי: אימות JWT מושבת

כרגע, שרת Socket.IO **לא מאמת** JWT tokens. הוא סומך על כך שהלקוח כבר התחבר דרך Strapi.

## למה?

ה-JWT_SECRET שצריך הוא **לא** ה-API key (VITE_ADMINMONTHER). זה הסוד שבו Strapi חותם JWT tokens של משתמשים.

### ההבדל:

- **VITE_ADMINMONTHER** = API key לשליחת בקשות כ-admin ל-Strapi
- **JWT_SECRET** = הסוד שבו Strapi חותם JWT tokens של משתמשים (נמצא ב-`.env` של Strapi עצמו)

## איך למצוא את JWT_SECRET של Strapi?

1. היכנס לשרת שבו רץ Strapi
2. מצא את קובץ ה-`.env` של Strapi (לא של SvelteKit!)
3. חפש את השורה: `JWT_SECRET=...`
4. העתק את הערך

## איך להפעיל אימות JWT?

אם יש לך גישה ל-JWT_SECRET של Strapi:

1. הוסף ל-`socket-server/.env`:
```bash
JWT_SECRET=<the-actual-strapi-jwt-secret>
```

2. התקן את jsonwebtoken:
```bash
cd socket-server
npm install jsonwebtoken
npm install --save-dev @types/jsonwebtoken
```

3. בטל את ההערה בקוד `src/index.ts` (יש TODO שם)

## אבטחה

⚠️ **למצב נוכחי**: מכיוון שאין אימות JWT, כל לקוח יכול להתחבר עם כל user ID. זה בסדר ל-development, אבל **לא** ל-production!

### לפני production:
- [ ] השג את JWT_SECRET של Strapi
- [ ] הפעל אימות JWT
- [ ] או: הוסף אימות מול Strapi API

## אלטרנטיבה: אימות מול Strapi API

במקום לאמת JWT מקומית, אפשר לשלוח בקשה ל-Strapi:

```typescript
// Verify JWT by calling Strapi
const response = await fetch(`${STRAPI_URL}/api/users/me`, {
  headers: { Authorization: `Bearer ${data.jwt}` }
});

if (!response.ok) {
  socket.emit('auth_error', { message: 'Invalid token' });
  socket.disconnect();
  return;
}

const user = await response.json();
// Now we know the JWT is valid and belongs to this user
```

זה יותר איטי אבל לא דורש את ה-JWT_SECRET.
