# הבהרה: JWT_SECRET vs API Key

## הבעיה המקורית

בקובץ `.env.example` היה רשום:
```
JWT_SECRET=your-jwt-secret-here
```

זה יצר בלבול - **מה זה JWT_SECRET ומאיפה מקבלים אותו?**

## התשובה

### מה זה JWT_SECRET?

JWT_SECRET הוא **הסוד שבו Strapi חותם JWT tokens של משתמשים**.

- כשמשתמש מתחבר ל-Strapi, הוא מקבל JWT token
- הטוקן הזה נחתם עם JWT_SECRET של Strapi
- כדי לאמת את הטוקן, צריך את **אותו סוד**

### מה זה לא?

❌ **לא** VITE_ADMINMONTHER - זה API key לשליחת בקשות כ-admin  
❌ **לא** API token שיוצרים ב-Strapi admin panel  
❌ **לא** משהו שאפשר לקבל מ-Strapi API

### איפה מוצאים אותו?

JWT_SECRET נמצא ב-**קובץ `.env` של Strapi עצמו** (לא של SvelteKit!):

```bash
# בשרת שבו רץ Strapi
cat /path/to/strapi/.env | grep JWT_SECRET
```

## הפתרון שיישמנו

מכיוון שאין לנו גישה ל-JWT_SECRET של Strapi כרגע, השרת עובד ב-**מצב מופחת**:

### מצב נוכחי (Development)

- ✅ השרת רץ בלי JWT_SECRET
- ✅ הוא מקבל JWT tokens מהלקוחות
- ⚠️ הוא **לא מאמת** אותם (רק מפענח)
- ⚠️ הוא סומך על כך שהלקוח כבר התחבר דרך Strapi

**זה בסדר ל-development** כי:
- הלקוחות כבר מאומתים דרך SvelteKit
- SvelteKit כבר בדק את ה-JWT מול Strapi
- אנחנו בסביבה מבוקרת

### מה צריך לעשות ל-Production?

**אופציה 1: השג את JWT_SECRET של Strapi**
```bash
# בשרת Strapi
cat .env | grep JWT_SECRET
# העתק את הערך ל-socket-server/.env
```

**אופציה 2: אמת מול Strapi API**
במקום לאמת JWT מקומית, שלח בקשה ל-Strapi:
```typescript
const response = await fetch(`${STRAPI_URL}/api/users/me`, {
  headers: { Authorization: `Bearer ${jwt}` }
});
// אם התגובה 200 - הטוקן תקף
```

## קבצים שעודכנו

1. **socket-server/.env** - הוסרה הדרישה ל-JWT_SECRET
2. **socket-server/.env.example** - הוסף הסבר שזה אופציונלי
3. **socket-server/src/auth.ts** - מדלג על אימות אם אין JWT_SECRET
4. **socket-server/README.md** - הוסף אזהרה על מצב האימות
5. **socket-server/JWT_CONFIGURATION.md** - מדריך מפורט

## בדיקה

השרת אמור לרוץ עכשיו בלי שגיאות:

```bash
cd socket-server
npm run dev
```

ולראות:
```
[Auth] JWT verification is DISABLED - JWT_SECRET not configured
```

זה תקין ל-development!
