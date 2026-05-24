# תכנית מיגרציה — שרת פרוקסי ונעילת Strapi

> **מטרת-על:** Strapi ייגש רק דרך שרת ה-SvelteKit (פרוקסי). מבחוץ Strapi נעול
> לחלוטין (bind ל-`127.0.0.1` / firewall). הפרונט פונה אך ורק ל-
> `/api/send` (GraphQL לפי `qid`), `/api/action` (פעולות), `/api/upload`
> (קבצים) ו-proxy ל-auth. **שום טוקן לא נחשף ללקוח.**
>
> מסמך זה משלים את `docs/MIGRATION_TRACKING.md` (מיגרציית ה-actions). שם
> המיקוד הוא notifications/real-time; כאן המיקוד הוא **אבטחה: הסרת חשיפת ה-JWT
> ונעילת הגישה ל-Strapi**. שתי המיגרציות חופפות בקבצים — לבצע יחד היכן שאפשר.

**עדכן מסמך זה אחרי כל צעד:** שנה `[ ]` ל-`[x]` ורשום תאריך.

---

## 1. תמונת מצב — מה כבר קיים

| נתיב | תפקיד | אימות | סטטוס |
|------|-------|-------|--------|
| `src/routes/api/send/+server.js` | פרוקסי GraphQL, query לפי `queId` מתוך `qids.js` (whitelist) | JWT מ-cookie httpOnly | קיים ✅ |
| `src/routes/api/action/+server.ts` | פרוקסי actions עם `AuthorizationEngine` + admin token | cookie + authorization לכל action | קיים ✅ |
| `src/routes/api/upload/+server.ts` | פרוקסי העלאות ל-Strapi | JWT מ-cookie | קיים ✅ |
| `src/lib/send/sendToSer.js` | עוטף לקוח ל-`/api/send` | — | קיים ✅ |

**מסקנה:** אין צורך בשרת חדש. הפרוקסי כבר בנוי — צריך לאחד עליו ולסגור פרצות.

---

## 2. הבעיה המרכזית — חשיפת JWT ללקוח

ה-JWT האמיתי של המשתמש מוחזר ל-`page.data` ולכן זמין לכל קוד לקוח, ו-~39
קומפוננטות קוראות אותו ופונות **ישירות מהדפדפן** ל-`VITE_URL/graphql`. ברגע
שננעל את Strapi מבחוץ — כל אלה ייפלו, ובינתיים הטוקן דולף.

### 2.1 נקודות החשיפה (צד שרת → לקוח) — סך הכל 4

| קובץ | שורה | מחזיר ללקוח | תיקון נדרש |
|------|------|--------------|------------|
| `src/routes/+layout.server.js` | 21 | `jwt: tok` (טוקן אמיתי, גלובלי) | להסיר לגמרי |
| `src/routes/(reg)/+layout.server.js` | — | `tok: locals.tok` (טוקן אמיתי) | להחליף ב-flag בוליאני |
| `src/routes/(regandnon)/+layout.server.js` | — | `tok: locals.tok` (טוקן אמיתי) | להחליף ב-flag בוליאני |
| `src/routes/(reg)/sales-center/+page.server.js` | 4 | `tok: locals.tok` (טוקן אמיתי) | להחליף ב-flag בוליאני |

> **בטוחים — לא לגעת:** מקומות שמחזירים `tok: tok == false ? false : true`
> (כבר בוליאני). שימושי `jwt: String(locals.tok)` בתוך `actionService.executeAction`
> (למשל `(reg)/forum/+layout.server.ts`) ובתוך helper של `gql()`
> (`deals/request/[id]/+page.server.ts`) — אלה רצים **בצד שרת בלבד** ולא נחשפים ללקוח.

### 2.2 צרכני הטוקן (לקוח) שיש להגר — ~39 קומפוננטות

קוראות `page.data.tok` / `page.data.jwt` כ-bearer ופונות ישירות ל-Strapi:

- **`src/lib/components/lev/`**: `rikma`, `hevel`, `mesima`, `weget`, `reqtosherut`,
  `mashsuggest`, `projectSuggestornew`, `halukaask`, `pmas`, `reqtom`,
  `missionInProgress`, `didiget`, `decisionMaking`
- **`src/lib/components/addnew/`**: `newIwant`, `addNewNeed`, `addNewMission`, `baci`
- **`src/lib/components/userPr/`**: `newsp`, `edit`, `editsp`, `editBasic`
- **`src/lib/components/prPr/`**: `totalNeeds`, `negoPend`, `newmatana`
- **`src/lib/components/sales/`**: `SaleComponent`
- **`src/lib/components/registration/`**: `newppp`
- **routes**: `(reg)/newlev/+page.svelte` (מעביר `page.data.tok` ל-`initializeLevData`),
  `(reg)/me`, `(reg)/oldlev`, `(reg)/sales-center`, `(regandnon)/...` ועוד

> רשימה מלאה מדויקת:
> `grep -rln "page\.data\.tok\|page\.data\.jwt" src --include=*.svelte`

### 2.3 פניות REST ישירות (לא GraphQL) שגם תלויות בטוקן

- `userPr/editBasic.svelte:362` → `VITE_URL/api/auth/change-password`
- login / `auth/local` / password-reset (`registration/password.svelte`,
  `login/passwordReset`, `login/passChange`, `signup/check-email`)
- העלאות שעדיין פונות ישירות במקום דרך `/api/upload`

---

## 3. שלב 1 (עדיפות ראשונה) — מניעת חשיפת JWT ללקוח

**עיקרון:** אי אפשר פשוט להסיר את הטוקן מ-`page.data` — זה ישבור את 39
הקומפוננטות. לכן הסדר הוא: **קודם להגר כל צרכן לפרוקסי, ורק כשאף אחד לא קורא
את הטוקן — להפוך את ה-server loads ל-flag בוליאני.**

### 3.1 דפוס ההגירה לכל קומפוננטה

**לפני (דליפת טוקן + פנייה ישירה):**
```js
const token = page.data.tok;
await fetch(import.meta.env.VITE_URL + "/graphql", {
  method: 'POST',
  headers: { Authorization: 'bearer ' + token, 'Content-Type': 'application/json' },
  body: JSON.stringify({ query: `{ ... }`, variables })
});
```

**אחרי (דרך הפרוקסי, ללא טוקן בלקוח):**
```js
import { sendToSer } from '$lib/send/sendToSer.js';
const res = await sendToSer({ /* variables */ }, "NNqueryId", 0, 0, false, fetch);
```
- כתיבה עם notifications/real-time → להעדיף `/api/action` (ראה `MIGRATION_TRACKING.md`).
- קריאה פשוטה → `sendToSer` עם `queId`.
- אם ה-query חסר ב-`qids.js` → להוסיף אותו שם (לפי הקונבנציה `<num><name>`).

### 3.2 העברת ה-REST לפרוקסי

- **upload**: כל פנייה ישירה → `/api/upload` (קיים).
- **auth** (login / register / change-password / reset): ליצור route דק
  `src/routes/api/auth/[...]/+server.ts` שמעביר ל-Strapi בצד שרת ומגדיר את ה-cookie
  ה-httpOnly. הלקוח לא רואה את הטוקן בכלל.

### 3.3 היפוך ה-server loads (רק אחרי שכל הצרכנים הוגרו)

- `+layout.server.js`: להסיר את `jwt: tok`.
- `(reg)/+layout.server.js`, `(regandnon)/+layout.server.js`,
  `sales-center/+page.server.js`: `tok: locals.tok` → `loggedIn: locals.tok != false`
  (או `tok: locals.tok != false`), כלומר flag בלבד.
- לעדכן כל `if (page.data.tok)` שמשמש כבדיקת התחברות שיעבוד מול ה-flag הבוליאני.

### 3.4 שמירה (guardrail) שלא תחזור הדליפה

- בדיקת CI / grep שנכשלת אם מופיע `page.data.jwt`/`page.data.tok` בהקשר של
  `fetch(... /graphql ...)`, או אם server-load מחזיר `locals.tok` כטוקן.
- לוודא ש-`grep -rn "VITE_URL.*graphql" src --include=*.svelte` מחזיר 0 בקוד לקוח.

### 3.5 צ'קליסט שלב 1

- [ ] מיפוי סופי של כל צרכני `page.data.tok`/`.jwt` (פקודת ה-grep למעלה)
- [ ] הגירת `lev/*` (13 קבצים) לפרוקסי — לתאם עם `MIGRATION_TRACKING.md`
- [ ] הגירת `addnew/*` (4)
- [ ] הגירת `userPr/*` (4) — כולל `editBasic` change-password ל-auth proxy
- [ ] הגירת `prPr/*` (3)
- [ ] הגירת `sales/SaleComponent`, `registration/newppp`
- [ ] הגירת routes שמשתמשים בטוקן (`newlev`/`initializeLevData`, `me`, `oldlev`, ...)
- [ ] יצירת `/api/auth` proxy + העברת login/register/reset/change-password
- [ ] העברת כל ה-uploads ל-`/api/upload`
- [ ] היפוך 4 נקודות החשיפה ל-flag בוליאני (3.3)
- [ ] הוספת guardrail (3.4) ו-grep מאמת = 0
- [ ] בדיקת רגרסיה ידנית בדפדפן: login, lev, העלאת קובץ, שינוי סיסמה

---

## 4. שלב 2 — הקשחת הפרוקסי עצמו

- **לסגור את ה-raw-query bypass** ב-`api/send/+server.js:27`: כיום אם הלקוח לא
  שולח `queId`, השרת מריץ `data.query` שרירותי — זה מאיין את ה-whitelist.
  בפרודקשן לדחות query גולמי ולהתיר רק `qids`.
- Rate limiting + הגבלת גודל body על נתיבי הפרוקסי.
- CORS מצומצם.
- לוודא ש-`/api/action` עם authorization לכל action הוא הסטנדרט לכתיבה.

## 5. שלב 3 — נעילת רשת ל-Strapi

- Strapi מאזין על `127.0.0.1` בלבד (או firewall שחוסם 1337 מבחוץ).
- Nginx מקדימה; SvelteKit מדבר עם Strapi דרך localhost.
- לוודא ש-`VITE_URL` בצד שרת מצביע ל-localhost ולא נדרש ללקוח לאחר שלב 1.

## 6. שלב 4 — אימות סופי וניקוי

- הסרת `sendToSer.js` של ה-`NODE_URL` המיותר אם לא בשימוש.
- הסרת ה-DEPRECATED comment ושאריות `jwt`/`tok` שכבר לא נחוצות.
- תיעוד בארכיטקטורה: "הדרך היחידה ל-Strapi = פרוקסי SvelteKit".

---

## 7. סיכונים והחזרה לאחור (rollback)

- **סיכון עיקרי:** היפוך ה-server loads (3.3) לפני שכל צרכן הוגר → דפים נשברים.
  מיטיגציה: לבצע 3.3 **אחרון**, אחרי ש-grep הצרכנים = 0.
- כל שלב הוא commit נפרד וניתן ל-revert; אין שינוי סכמה ב-Strapi.
- מומלץ flag/בדיקה בסביבת staging לפני נעילת הרשת (שלב 3).
