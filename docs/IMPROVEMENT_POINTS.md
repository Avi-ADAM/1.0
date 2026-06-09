# נקודות לשיפור — ניתוח מערכת

> מסמך זה מרכז ממצאי ביקורת קוד ונקודות שיפור שזוהו במהלך ניתוח המערכת.  
> **מסודר לפי עדיפות ועלות יישום.**

---

## 🔴 קריטי — אבטחה ויציבות

### 1. Token חשוף ב-sendToSer ישן
**בעיה:** `sendToSer.js` שולח JWT token מה-client ישירות ל-Strapi  
**סיכון:** מישהו יכול ליירט token ולהתחזות למשתמש  
**פתרון:** מיגרציה מלאה ל-Action System (שמחזיק token בשרת בלבד)  
**עדיפות:** 🔴 קריטי  
**מאמץ:** גדול (זה כל ה-MIGRATION_TRACKING)

### 2. Email ZOHO credentials בקוד בלבד
**בעיה:** אם `ZOHO` env var לא מוגדר, שליחת mail נפולת ב-silent  
**פתרון:**
```typescript
// EmailService.ts - הוסף validation בטעינה
if (!process.env.ZOHO) {
  console.error('CRITICAL: ZOHO env var not set - emails will not be sent');
}
```
**עדיפות:** 🔴 קריטי  
**מאמץ:** קטן (שורות ספורות)

### 3. אין Rate Limiting על `/api/action`
**בעיה:** `/api/action` אין הגבלת קריאות — DoS פוטנציאלי  
**פתרון:** הוסף rate limiting ב-SvelteKit hooks:
```typescript
// src/hooks.server.ts
const requestCounts = new Map();
const RATE_LIMIT = 100; // per minute per IP

if (event.url.pathname.startsWith('/api/action')) {
  const ip = event.request.headers.get('x-forwarded-for') || 'unknown';
  // ... check and increment counter
}
```
**עדיפות:** 🔴 קריטי  
**מאמץ:** בינוני (1 יום)

### 4. Socket Server auth חלש
**בעיה:** Socket server מקבל userId ללא אימות חזק  
**פתרון:** ב-socket auth, אמת JWT במלואו (לא רק שה-userId קיים)  
**עדיפות:** 🔴 קריטי  
**מאמץ:** בינוני

---

## 🟠 גבוה — ביצועים ואמינות

### 5. sendToSer — אין caching
**בעיה:** כל קריאת `sendToSer` = GraphQL חדש, גם לנתונים שלא השתנו  
**פתרון:** הוסף caching layer ב-ActionService:
```typescript
// ActionService.ts
private cache = new Map<string, { data: any; expiresAt: number }>();

async executeAction(key, params, context) {
  const cacheKey = `${key}:${JSON.stringify(params)}`;
  const cached = this.cache.get(cacheKey);
  
  if (cached && cached.expiresAt > Date.now()) {
    return cached.data;
  }
  
  const result = await this._executeAction(key, params, context);
  
  // cache רק לread actions
  if (action.config.cacheTtl) {
    this.cache.set(cacheKey, { data: result, expiresAt: Date.now() + action.config.cacheTtl });
  }
  
  return result;
}
```
**עדיפות:** 🟠 גבוה  
**מאמץ:** בינוני (2-3 ימים)

### 6. Email batch sending חסר
**בעיה:** 100 recipients = 100 בקשות SMTP מיידיות → crash/throttle  
**פתרון:** ראה `SPEC_CUSTOM_EMAIL.md` סעיף 6.2  
**עדיפות:** 🟠 גבוה  
**מאמץ:** קטן (½ יום)

### 7. Notification fire-and-forget — אין error tracking
**בעיה:** Notifications נשלחות async ואין מנגנון לדעת אם נכשלו  
**פתרון:** שמור notification_log בDB:
```typescript
// NotificationOrchestrator — הוסף logging
await strapi.create('notification-logs', {
  action: actionKey,
  recipients: recipientIds,
  channels: ['email', 'socket'],
  status: 'sent',
  errors: failedChannels,
  sentAt: new Date()
});
```
**עדיפות:** 🟠 גבוה  
**מאמץ:** בינוני (2 ימים)

### 8. actionClient.ts — 815 שורות בקובץ אחד
**בעיה:** קובץ ענק, קשה לתחזוקה  
**פתרון:** פרוס ל-modules:
```
lib/client/
├── actionClient.ts          ← export כל
├── actions/
│   ├── taskActions.ts       ← updateTask, createTask
│   ├── timerActions.ts      ← timerStart, timerStop, timerSave
│   ├── voteActions.ts       ← addVote
│   ├── financialActions.ts  ← createHaluka, approveTosplit
│   └── userActions.ts       ← updateUserProfile, toggleGuideStatus
└── updateStrategies.ts      ← UpdateStrategy executors
```
**עדיפות:** 🟠 גבוה  
**מאמץ:** בינוני (1-2 ימים)

---

## 🟡 בינוני — נסיון משתמש ותחזוקה

### 9. Error Messages לא ידידותיות
**בעיה:** ActionService מחזיר שגיאות טכניות ישירות ל-client  
**פתרון:** mapper של שגיאות לטקסטים ידידותיים:
```typescript
const errorMessages = {
  'Authorization failed': { he: 'אין לך הרשאה לפעולה זו', en: 'Not authorized' },
  'Validation failed: projectId required': { he: 'נדרש מזהה פרויקט', en: 'Project ID required' },
  // ...
};
```
**עדיפות:** 🟡 בינוני  
**מאמץ:** קטן

### 10. weFinnish — TODO לא ממומש
**בעיה:** vote type `weFinnish` מוגדר אבל לא ממומש (TODO בקוד)  
**פתרון:** ראה `SPEC_VOTING_SYSTEM.md` סעיף 9  
**עדיפות:** 🟡 בינוני  
**מאמץ:** בינוני (3 ימים)

### 11. addVote.ts — 413 שורות, קשה לקרוא
**בעיה:** קוד שפגטי עם switch ענק  
**פתרון:** ראה `SPEC_VOTING_SYSTEM.md` שלב 2 מיגרציה  
**עדיפות:** 🟡 בינוני  
**מאמץ:** בינוני

### 12. חוסר TypeScript ב-JS files ישנים
**בעיה:** `sendToSer.js`, `/api/nuti/+server.js` וכו' — ללא types  
**פתרון:** המרה ל-`.ts` כחלק מהמיגרציה  
**עדיפות:** 🟡 בינוני  
**מאמץ:** קטן (לכל קובץ)

### 13. אין logging מרכזי
**בעיה:** כל קובץ עושה `console.log` שלו, אין structured logging  
**פתרון:** הוסף logger אחיד:
```typescript
// lib/server/logger.ts
import pino from 'pino';
export const logger = pino({ 
  level: process.env.LOG_LEVEL || 'info',
  transport: { target: 'pino-pretty' }
});

// שימוש:
logger.info({ action: 'updateTask', userId, projectId }, 'Task updated');
```
**עדיפות:** 🟡 בינוני  
**מאמץ:** בינוני (יום + עדכון כל הקבצים)

### 14. AuthorizationEngine — אין caching לmembership checks
**בעיה:** כל בדיקת `projectMember` = GraphQL query חדש  
**פתרון:** cache membership לזמן קצר (60 שניות):
```typescript
private membershipCache = new Map<string, { isMember: boolean; expiresAt: number }>();
```
**עדיפות:** 🟡 בינוני  
**מאמץ:** קטן

---

## 🟢 נמוך — שיפורים עתידיים

### 15. `VITE_ADMINMONTHER` — admin bypass token ✅ הושלם
**בעיה:** token admin נמצא ב-VITE_ = חשוף ב-client build  
**פתרון שבוצע:** עבר ל-`ADMINMONTHER` (ללא prefix), נקרא ב-server דרך `$env/static/private`; ב-Node libs דרך `process.env.ADMINMONTHER`. אומת ב-build שהטוקן לא נמצא ב-client bundle (רק ב-`server/chunks/private.js`). אותו טיפול בוצע ל-`CONSENSUS_PUBLIC_TOKEN` ו-`CONSENSUS_PROXY_SECRET`.  
**עדיפות:** 🟢 נמוך  
**מאמץ:** קטן

### 16. Socket server — אין health monitoring
**בעיה:** אם socket server נופל — אין alerting  
**פתרון:** הוסף `/api/cron` check שבודק `socket-server/health` כל 5 דקות  
**עדיפות:** 🟢 נמוך  
**מאמץ:** קטן

### 17. Registry — אין auto-discovery
**בעיה:** לזכור לרשום action ב-registry.ts — מועד לשכחה  
**פתרון:** auto-import כל קבצים ב-configs/:
```typescript
// registry.ts
const configs = import.meta.glob('./configs/*.ts', { eager: true });
export const ACTION_REGISTRY = Object.fromEntries(
  Object.values(configs)
    .map(module => [module.default.key, module.default])
);
```
**עדיפות:** 🟢 נמוך  
**מאמץ:** קטן

### 18. אין מנגנון optimistic rollback
**בעיה:** optimistic updates לא מתבטלים אם הפעולה נכשלה בשרת  
**פתרון:** actionClient צריך לשמור state לפני, ולשחזר אם error  
**עדיפות:** 🟢 נמוך  
**מאמץ:** גדול

### 19. MCP Bot — whitelist רק createTask
**בעיה:** `/api/v1/actions` (MCP endpoint) רק מרשה `createTask`  
**פתרון:** הרחב whitelist כשיש מחשבה על אבטחה:
```typescript
const MCP_ALLOWED_ACTIONS = [
  'createTask',
  'updateTask',
  'addVote',
  'createProcess',
  // ... רק read-safe actions
];
```
**עדיפות:** 🟢 נמוך (תלוי בצורך)  
**מאמץ:** קטן

### 20. updateProjectDetails — חסר validation
**בעיה:** `updateProjectDetails` action מקבל כל שדה ללא validation  
**פתרון:** הוסף whitelist של שדות מותרים לעדכון  
**עדיפות:** 🟢 נמוך  
**מאמץ:** קטן

---

## סיכום עדיפויות

| # | שיפור | עדיפות | מאמץ |
|---|-------|---------|------|
| 1 | Token security (מיגרציה) | 🔴 קריטי | גדול |
| 2 | Email credentials validation | 🔴 קריטי | קטן |
| 3 | Rate limiting על /api/action | 🔴 קריטי | בינוני |
| 4 | Socket auth חיזוק | 🔴 קריטי | בינוני |
| 5 | Action caching | 🟠 גבוה | בינוני |
| 6 | Email batch sending | 🟠 גבוה | קטן |
| 7 | Notification error logging | 🟠 גבוה | בינוני |
| 8 | פיצול actionClient.ts | 🟠 גבוה | בינוני |
| 9 | Error messages UX | 🟡 בינוני | קטן |
| 10 | weFinnish ממוש | 🟡 בינוני | בינוני |
| 11 | Refactor addVote.ts | 🟡 בינוני | בינוני |
| 12 | המרה ל-TypeScript | 🟡 בינוני | קטן |
| 13 | Structured logging | 🟡 בינוני | בינוני |
| 14 | Membership cache | 🟡 בינוני | קטן |
| 17 | Auto-discovery registry | 🟢 נמוך | קטן |
| 19 | MCP whitelist הרחבה | 🟢 נמוך | קטן |
