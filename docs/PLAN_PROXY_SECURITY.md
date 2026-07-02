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

## 0. ⚠️ פרצות קריטיות בפרוקסי — לתקן לפני הכל (נמצאו 2026-06-10)

> שתי הפרצות האלה חשופות **כבר עכשיו** בפרודקשן, עוד לפני נעילת הרשת.
> נעילת Strapi ל-localhost **לא** סוגרת אותן — הפרוקסי עצמו ציבורי.

### 0.1 דגל `isSer` נשלט על-ידי הלקוח ומעניק טוקן אדמין

הלקוח שולח `isSer` ב-body, והשרת מצמיד טוקן service/אדמין בלי לאמת שהקריאה
באמת הגיעה מצד שרת:

| קובץ | שורה | הבעיה |
|------|------|--------|
| `src/routes/api/send/+server.js` | ~84, ~106 | `isSer = data.isSer ?? false` → `getServiceToken()`. בדיקת `x-consensus-secret` קיימת **רק** ל-qids של קונסנזוס; לכל qid אחר `isSer:true` מקבל את `ADMINMONTHER` בלי שום סוד. |
| `src/routes/api/action/+server.ts` | ~63-85 | `isSer === true` → `jwt = ADMIN_TOKEN` **וגם** `userId = params.userId` — כל דפדפן אנונימי יכול להריץ כל action בשם כל משתמש. |

**בוצע ✅ (2026-06-19):**
- [x] נוסף `src/lib/server/internalSecret.js` — סוד פנימי נגזר מ-`ADMINMONTHER`
  (sha256), אף פעם לא נחשף ללקוח. fail-closed אם `ADMINMONTHER` חסר.
- [x] `hooks.server.js` → `handleFetch` מזריק header `x-internal-secret` לכל
  קריאת `fetch` צד-שרת ל-`/api/*` (origin זהה). fetch מהדפדפן לא עובר ב-hook
  הזה, לכן לקוח לא יכול לזייף.
- [x] `api/send`: `isSer = (data.isSer === true) && isInternalRequest(request)`.
  אם הלקוח שולח `isSer:true` בלי הסוד → מטופל כמשתמש רגיל (JWT מ-cookie).
- [x] `api/action`: מסלול ה-bypass (`jwt = ADMIN_TOKEN` + `params.userId`)
  מותנה כעת ב-`isSer === true && isInternalRequest(request)`.
- [x] callers פנימיים (`+page.server.js`, `newTelegram`, mastra tools) עוברים
  ב-`event.fetch` → מקבלים את ה-header אוטומטית, אין צורך לשנות כל caller.
  `timeGrama.svelte` `archiveTimeGrama` מקבל `isSer` כפרמטר (ברירת מחדל false)
  ואף לקוח לא מעביר `true` — אומת ב-grep.

### 0.2 raw-query bypass ב-`api/send` (עוקף את ה-whitelist)

`api/send/+server.js:68` — אם הלקוח לא שולח `queId`, השרת מריץ
`data.data.query` שרירותי. ה-validation רץ רק ב-dev וגם אז רק מדפיס שגיאה.
בשילוב עם 0.1 → GraphQL שרירותי עם טוקן אדמין מכל דפדפן.

**בוצע ✅ (2026-06-19):**
- [x] בפרודקשן: אם אין `queId` → `throw error(403)`; raw query מותר ב-dev בלבד.
  `queId` לא מוכר → `throw error(400)` (קודם נפל בשקט ל-`if (!query)`).
- [x] אומת ב-grep: כל ה-callers (`sendToSer`/`sendToSerTyped`/קריאות ישירות
  ב-`baci.svelte`, `enrichWish.ts`) שולחים `queId`. הקובץ
  `metrics/examples/migration-metrics-example.ts` שולח פורמט `qid`/`variables`
  שלא תאם ממילא — דוגמה מתה, לא נתיב פעיל.

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

### 2.1 נקודות החשיפה (צד שרת → לקוח) — סך הכל 4 — **כולן נסגרו ✅ (אומת 2026-06-10)**

| קובץ | שורה | מחזיר ללקוח | סטטוס |
|------|------|--------------|------------|
| `src/routes/+layout.server.js` | 21 | `jwt: tok` (טוקן אמיתי, גלובלי) | ✅ הוחלף ב-`loggedIn: !!tok` |
| `src/routes/(reg)/+layout.server.js` | — | `tok: locals.tok` (טוקן אמיתי) | ✅ הוחלף ב-`tok: !!tok` |
| `src/routes/(regandnon)/+layout.server.js` | — | `tok: locals.tok` (טוקן אמיתי) | ✅ הוחלף ב-`tok: !!tok` |
| `src/routes/(reg)/sales-center/+page.server.js` | 4 | `tok: locals.tok` (טוקן אמיתי) | ✅ מחזיר flag בוליאני |

**צרכני `page.data.tok`/`.jwt` שנותרו (grep 2026-06-10):**
- `src/routes/(regandnon)/availiableResorce/[id]/+page.svelte` — משתמש רק
  כ-flag בוליאני (`!= false`) — **תקין, לא לגעת**.
- `src/routes/test-lev-socket/+page.svelte:30` — `jwt = page.data.tok` — דף
  בדיקה; מקבל היום בוליאני ולא טוקן. ⏳ לעדכן/למחוק את הדף לפני פרודקשן.
- `src/lib/legacy/moach/OLD_monolith.svelte` — legacy, לא בשימוש.

> **בטוחים — לא לגעת:** מקומות שמחזירים `tok: tok == false ? false : true`
> (כבר בוליאני). שימושי `jwt: String(locals.tok)` בתוך `actionService.executeAction`
> (למשל `(reg)/forum/+layout.server.ts`) ובתוך helper של `gql()`
> (`deals/request/[id]/+page.server.ts`) — אלה רצים **בצד שרת בלבד** ולא נחשפים ללקוח.

### 2.2 צרכני הטוקן (לקוח) שיש להגר — ~39 קומפוננטות — **הושלם ברובו ✅**

הרשימה ההיסטורית (לתיעוד): `lev/*`, `addnew/*`, `userPr/*`, `prPr/*`,
`sales/SaleComponent`, `registration/newppp`, routes שונים. נכון ל-2026-06-10
ה-grep `page\.data\.tok|page\.data\.jwt` נקי פרט לחריגים שב-2.1.

### 2.2.1 פניות `/graphql` ישירות **ללא טוקן** שנותרו — יישברו בנעילה! (אומת 2026-06-28)

קומפוננטות שפונות מהדפדפן ל-`VITE_URL/graphql` בלי bearer (queries ציבוריים /
אנונימיים). אין כאן דליפת טוקן, אבל ברגע ש-Strapi יינעל ל-localhost — **כולן
יישברו**. חובה להגר ל-`sendToSer`/qids לפני שלב 3:

**קוד מת — לא להגר, למחוק:**
- ~~`src/lib/components/registration/password.svelte`~~ — **קוד מת** (2026-06-28): אף import. ההרשמה עברה לכלל ל-onboarding. למחוק.
- ~~`src/lib/components/lev/reqtosherut.svelte`~~ — **קוד מת** (2026-06-28): אף import. הלוגיקה הוגרה ל-action `finalizeAskAcceptance`. chat reply הוא לא רק sidequest — הקובץ כולו יתום. למחוק.
- ~~`src/lib/components/main/amann.svelte`~~ — **קוד מת** (2026-06-28): אף import. למחוק.

**חיים — חובה להגר (אומת 2026-06-28):**
- **`src/lib/components/ui/`**: `ValueSelector`, `SkillSelector`, `RoleSelector`
- **`src/lib/components/registration/`**: `roles`, `vallues`, `workways`
- **`src/lib/components/addnew/`**: `addNewMission`, `addNewSkill`
- **`src/lib/components/prPr/`**: `negoM`, `choosMission`, `whowhat`
- **`src/lib/components/main/`**: `amana`, `amanaen`, `amanar` + תלויות שלהם (`tikunolam`, `tikunar`, `tikuneng`, `tranarb`, `translatehe`, `translateeng`)
- **routes**: `hascama/+page.svelte`, `convention/+page.svelte`, `aitifaqia/+page.svelte`
  > שלוש הרוטים הללו **חיים** — מקושרים מ-`fpage.svelte`, `newfront.svelte`, `ProductPeek.svelte`; `signup` מפנה ל-`/hascama`.
- ~~`src/lib/legacy/moach/OLD_monolith.svelte`~~ (legacy — לא מגרים)

> grep מאמת (צריך להגיע ל-0, למעט legacy):
> `grep -rln "graphql" src --include=*.svelte | xargs grep -ln "VITE_URL\|baseUrl"`

### 2.3 פניות REST ישירות (לא GraphQL) שגם תלויות בטוקן

- `userPr/editBasic.svelte:362` → `VITE_URL/api/auth/change-password`
- login / `auth/local` / password-reset (`login/passwordReset`, `login/passChange`, `signup/check-email`)
- ~~`registration/password.svelte`~~ → **קוד מת**, לא רלוונטי

### 2.4 ארכיטקטורת פריסה ומדיה (אומת 2026-06-28)

**ארכיטקטורה:** Frontend (Vercel) → SvelteKit API (Linux VPS) → Strapi (127.0.0.1 על אותו VPS).

**מדיה / uploads:** הפרויקט משתמש ב-**Cloudinary** ולא ב-Strapi local uploads.
- קבצים עולים דרך Cloudinary CDN — כתובות ה-URL הן `res.cloudinary.com/...`, לא `VITE_URL/uploads/...`.
- **אין** צורך ב-Nginx location ציבורי ל-`/uploads` של Strapi.
- `/api/upload` בשרת SvelteKit — לבדוק האם הוא מתווך ל-Cloudinary דרך Strapi, ואם כן האם הסשן נשמר תקין. הפרוקסי הזה כבר קיים ותקין.
- **לא נדרשת** עבודה נוספת בנושא מדיה לצורך נעילת Strapi.

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
- **auth** (login / register / change-password / reset): route דק
  `src/routes/api/auth/[...path]/+server.ts` שמעביר ל-Strapi בצד שרת ומגדיר את
  ה-cookie ה-httpOnly. הלקוח לא רואה את הטוקן בכלל. **בוצע ✅** (2026-05-24).

#### מצב ה-auth proxy (`src/routes/api/auth/[...path]/+server.ts`)

Whitelist של פעולות מותרות; כל השאר → 404. פעולות שמחזירות `jwt` →
ה-jwt נשמר כ-cookie httpOnly בצד שרת ומנוקה מה-response (הלקוח לא רואה טוקן).
`change-password` לוקח את הטוקן מה-cookie, לא מהלקוח.

| פעולה | requiresAuth | setsSession | callers שהוגרו |
|-------|:---:|:---:|----|
| `local` (login) | ✗ | ✓ | — (login נשאר ב-`login/+page.server.js`, צד שרת, לא דליפה) |
| `local/register` | ✗ | ✓ | ⏳ `registration/password.svelte` (נדחה — מסובך עם onboarding) |
| `change-password` | ✓ | ✓ | `userPr/editBasic.svelte` ✅ |
| `forgot-password` | ✗ | ✗ | `login/passwordReset/+page.svelte` ✅ |
| `reset-password` | ✗ | ✓ | `login/passChange/+page.svelte` ✅ |
| `send-email-confirmation` | ✗ | ✗ | `signup/check-email/+page.svelte` ✅ (כבר קרא לנתיב היחסי) |

> **הערה:** `login/+page.server.js` ו-`signup/+page.server.js` כבר רצים בצד שרת
> ומגדירים cookie httpOnly נכון — **אינם דליפה** ולא חייבים את הפרוקסי (פנייה
> צד-שרת ל-Strapi עובדת גם כש-Strapi נעול ל-localhost). אפשר לאחד אותם על
> הפרוקסי בעתיד לשם עקביות, אך אין דחיפות.
>
> **נותר ב-auth:** הגירת ה-register ב-`registration/password.svelte` (פנייה
> ישירה מהלקוח) — דורש זהירות עם לוגיקת ה-cookies של ה-onboarding.

### 3.3 היפוך ה-server loads (רק אחרי שכל הצרכנים הוגרו)

- `+layout.server.js`: להסיר את `jwt: tok`.
- `(reg)/+layout.server.js`, `(regandnon)/+layout.server.js`,
  `sales-center/+page.server.js`: `tok: locals.tok` → `loggedIn: locals.tok != false`
  (או `tok: locals.tok != false`), כלומר flag בלבד.
- לעדכן כל `if (page.data.tok)` שמשמש כבדיקת התחברות שיעבוד מול ה-flag הבוליאני.

### 3.4 שמירה (guardrail) שלא תחזור הדליפה — **בוצע ✅ (2026-06-19)**

- `scripts/check-proxy-security.mjs` + `npm run check:proxy`: נכשל אם קומפוננטת
  לקוח חדשה (`.svelte`) קוראת ל-`/graphql` ישירות (דרך `VITE_URL`/`baseUrl`).
  עובד בשיטת ratchet — יש BASELINE של 33 העבריינים הידועים; להסיר קובץ מה-BASELINE
  עם כל מיגרציה, והסקריפט גם נכשל אם קובץ ב-BASELINE כבר נוקה (כדי לשמור על הרשימה
  כנה ומתכווצת).
- ⏳ לחבר ל-CI workflow (כרגע אין `.github/workflows`) — להריץ `check:proxy` +
  `validate:qids` ב-PR.

### 3.5 צ'קליסט שלב 1

- [x] מיפוי סופי של כל צרכני `page.data.tok`/`.jwt` (אומת 2026-06-28)
- [ ] **מחיקת קוד מת** (אומת 2026-06-28 — אף import):
  - [ ] `src/lib/components/lev/reqtosherut.svelte` — כולו קוד מת, למחוק
  - [ ] `src/lib/components/registration/password.svelte` — כולו קוד מת, למחוק
  - [ ] `src/lib/components/main/amann.svelte` — כולו קוד מת, למחוק
- [ ] הגירת `lev/*` לפרוקסי — לתאם עם `MIGRATION_TRACKING.md`
  - [x] `welcomTo.svelte` → `updateWelcomeCard` action (2026-05-25)
  - [x] `hevel.svelte` → `sendToSer('52GetUserById')` (2026-05-25)
  - [x] `mesima.svelte` → `sendToSer('51GetOpenMissionById')` (2026-05-25)
  - [x] `rikma.svelte` → `sendToSer('49GetProjectById')` (2026-05-25)
  - [x] `mashsuggest.svelte` `decline(oid)` → `declineSpForMashaabim` action (2026-05-25)
  - [x] `halukaask.svelte` → `approveHaluka` + `addVote` (2026-05-25)
  - [~] `reqtosherut.svelte` — **קוד מת, למחוק** (ראה למעלה)
  - [~] `projectSuggestornew.svelte` — לא בשימוש; מדלגים
  - [ ] `mashsuggest`/`reqtom` chat replies — **sidequest** (ראה 3.6)
- [ ] הגירת `main/*` (amana/amanaen/amanar + tikunolam/tikunar/tikuneng/tranarb/translatehe/translateeng) + routes (hascama/convention/aitifaqia) לפרוקסי
- [ ] הגירת `addnew/*` (addNewMission, addNewSkill)
- [ ] הגירת `ui/*` (ValueSelector, SkillSelector, RoleSelector)
- [ ] הגירת `registration/*` (roles, vallues, workways) — password.svelte קוד מת
- [ ] הגירת `userPr/*` — כולל `editBasic` change-password ל-auth proxy
- [ ] הגירת `prPr/*` (negoM, choosMission, whowhat)
- [ ] הגירת `sales/SaleComponent`, `registration/newppp`
- [ ] הגירת routes שמשתמשים בטוקן (`newlev` הושלם ✅ 2026-05-29, `me`, `oldlev`, ...)
- [x] יצירת `/api/auth` proxy (2026-05-24) + change-password/forgot/reset/send-email-confirmation
- [ ] היפוך 4 נקודות החשיפה ל-flag בוליאני (3.3)
- [ ] הוספת guardrail (3.4) ו-grep מאמת = 0
- [ ] בדיקת רגרסיה ידנית בדפדפן: login, lev, העלאת קובץ, שינוי סיסמה

### 3.6 Sidequest — מיגרציית chat לאובייקט Forum (חוסם 3 קבצים)

שלוש פונקציות chat ב-`lev/` עדיין שומרות את ההודעות **כמערך component בתוך ה-entity
עצמו** (ולא כ-relation ל-`forum` עם `messages`). זוהי הדרך הארכאית; המערכת כבר עברה
ברוב המקומות לעבוד עם `forum` ייעודי + `createMessage` (qid `1chatsend`). לכן
הקבצים הבאים **לא יוגרו ל-action בלקוח בלבד** — הם דורשים מיגרציה שכוללת:

1. **שינוי סכמה ב-Strapi:** הוספת relation `forum` ל-`askm` / `ask` (אם לא קיים)
   והפסקת השימוש בשדה ה-component `chat`.
2. **One-off migration job:** העברת ההודעות הקיימות מ-component `chat` לתוך
   forum + messages, ויצירת forum רטרואקטיבי לכל askm/ask קיים.
3. **בלקוח:** החלפת ה-PUT לתוספת לתוך מערך → קריאה ל-actions הקיימים
   (`createForum*`, `1chatsend` דרך action / sendToSer).

| קובץ | פונקציה | מצב נוכחי | מה דרוש |
|------|---------|-----------|---------|
| `mashsuggest.svelte` | `replyToMash` (~255-303) | `PUT /api/askms/${askId}` עם append ל-`chat[]` | forum על askm + `createMessage` |
| `reqtom.svelte` | chat reply (~420-475) | `PUT /api/askms/${askId}` עם append ל-`chat[]` | forum על askm + `createMessage` |
| ~~`reqtosherut.svelte`~~ | ~~chat reply~~ | **קוד מת — הקובץ כולו יימחק** (אין importers) | לא רלוונטי |

**יתרון:** ה-actions ליצירת פורום (`2forumCr`, `2forumCrBasic`) ולהוספת הודעה
(`1chatsend`) כבר קיימים ומאומתים — רק צריך לחבר.

**עד שהמיגרציה תתבצע:** שלוש הפונקציות האלה ימשיכו לחשוף `page.data.tok` בלקוח.
ב-checklist 3.5 הן ייחשבו "חסומות sidequest", לא "לא הוגרו".

---

## 4. שלב 2 — הקשחת הפרוקסי עצמו

- **לסגור את ה-raw-query bypass** — הועבר לסעיף 0.2 (קריטי, לתקן מיד).
- **לסגור את פרצת ה-`isSer`** — סעיף 0.1 (קריטי, לתקן מיד).
- Rate limiting + הגבלת גודל body על נתיבי הפרוקסי.
- CORS מצומצם.
- לוודא ש-`/api/action` עם authorization לכל action הוא הסטנדרט לכתיבה.

## 5. שלב 3 — נעילת רשת ל-Strapi (העברת SvelteKit ל-VPS)

ההחלטה: שרת ה-SvelteKit (node adapter) ירוץ **על אותו VPS** של Strapi.
Strapi נחסם מבחוץ ומדבר רק עם SvelteKit דרך loopback.

- Strapi מאזין על `127.0.0.1` בלבד (`HOST=127.0.0.1` ב-config) **וגם**
  firewall (ufw/iptables) שחוסם 1337 מבחוץ — הגנה כפולה.
- Nginx מקדימה את SvelteKit (TLS, gzip); SvelteKit → Strapi דרך
  `http://127.0.0.1:1337`.
- **⚠️ מלכודת `VITE_URL`:** זהו משתנה **build-time שנכנס גם ל-bundle של
  הלקוח** (prefix `VITE_`). אם נציב בו `127.0.0.1` לפני שכל הקומפוננטות
  ב-2.2.1 הוגרו — הן יקבלו כתובת localhost ויישברו אצל המשתמש. הסדר המחייב:
  קודם 2.2.1 = 0, ואז לעבור בצד שרת למשתנה **פרטי** חדש (למשל `STRAPI_URL`
  ב-`$env/static/private`) שמצביע ל-localhost, ולהפסיק את השימוש ב-`VITE_URL`
  בקבצי השרת (`api/send`, `api/action`, `api/upload`, server loads).
- **מדיה (uploads):** הפרויקט משתמש ב-Cloudinary — אין קבצי מדיה מקומיים ב-Strapi. כתובות התמונות הן `res.cloudinary.com/...` ולא פנימיות. **אין צורך ב-location ציבורי ל-`/uploads`.**
- **פאנל האדמין של Strapi (`/admin`):** ייחסם גם הוא. גישה דרך SSH tunnel
  (`ssh -L 1337:127.0.0.1:1337`) או location ב-Nginx עם allowlist של IP /
  basic-auth.
- **שירותים חיצוניים:** לוודא שאין מי שפונה ל-Strapi ישירות מבחוץ —
  Telegram bot, cron jobs, webhooks, שרת sockets. כל אחד כזה צריך לעבור
  ללקריאה דרך localhost (אם הוא על אותו VPS) או דרך הפרוקסי המאומת.

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

---

## 8. סדר עבודה מעודכן (2026-06-28)

**ארכיטקטורה:** Frontend על Vercel → SvelteKit API על Linux VPS → Strapi על 127.0.0.1. Cloudinary לקבצים — אין Strapi local uploads.

1. - [x] **סעיף 0.1** — סגירת פרצת ה-`isSer` ✅ (2026-06-19)
2. - [x] **סעיף 0.2** — חסימת raw-query בפרודקשן ✅ (2026-06-19)
3. - [ ] **מחיקת קוד מת** — `reqtosherut.svelte`, `password.svelte`, `amann.svelte`
4. - [ ] **`VITE_URL` → `STRAPI_URL`** (פרטי, `$env/static/private`) ב-`api/send`, `api/action`, `api/upload` — **חובה לפני שינוי הכתובת ב-VPS**
5. - [ ] **סעיף 2.2.1** — הגירת הקומפוננטות החיות האנונימיות (amana/tikun/convention/hascama, ui selectors, registration, addnew, prPr)
6. - [ ] השלמת שאריות שלב 1: `test-lev-socket`, sidequest ה-chat (3.6)
7. - [ ] guardrails (3.4) + grep = 0
8. - [ ] שלב 2 — rate limiting, body size, CORS
9. - [ ] שלב 3 — פריסת SvelteKit על ה-VPS, נעילת Strapi ל-`127.0.0.1` + firewall (ufw), Nginx ל-`/admin` + TLS; **ללא** צורך ב-location מיוחד ל-`/uploads` (Cloudinary)
   - [x] קבצי docker + סקריפט פריסה לאינסטנס ה-API נוצרו (2026-07-02): `Dockerfile`, `.dockerignore`, `docker-compose.api.yml`, `deploy-api.ps1`, `/api/health` — ראה `docs/DEPLOY_API_DOCKER.md`
10. - [ ] שלב 4 — אימות סופי, ניקוי, תיעוד
