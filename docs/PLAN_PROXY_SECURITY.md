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

### 2.2.1 פניות `/graphql` ישירות **ללא טוקן** — **הושלם ✅ (אומת מחדש 2026-07-14)**

קומפוננטות שפנו מהדפדפן ל-`VITE_URL/graphql` בלי bearer (queries ציבוריים /
אנונימיים). הרשימה למטה הייתה "חיים — חובה להגר"; ב-2026-07-14 הרצתי את
בדיקת ה-guardrail (`graphql` + `VITE_URL`/`baseUrl`) על כל `src` מחדש —
**כל הקבצים ברשימה כבר נקיים**. ככל הנראה הוגרו אגב עבודת ה-action-system
(`MIGRATION_TRACKING.md`) בלי שהמסמך הזה עודכן.

**קוד מת — לא להגר, למחוק (עדיין ממתין — ראה §3.5):**
- ~~`src/lib/components/registration/password.svelte`~~ — **קוד מת** (2026-06-28): אף import. ההרשמה עברה לכלל ל-onboarding. למחוק.
- ~~`src/lib/components/lev/reqtosherut.svelte`~~ — **קוד מת** (2026-06-28): אף import. הלוגיקה הוגרה ל-action `finalizeAskAcceptance`. chat reply הוא לא רק sidequest — הקובץ כולו יתום. למחוק.
- ~~`src/lib/components/main/amann.svelte`~~ — **קוד מת** (2026-06-28): אף import. למחוק.

**היו "חיים — חובה להגר", אומת נקי 2026-07-14:**
- **`src/lib/components/ui/`**: `ValueSelector` ✅, `SkillSelector` ✅, `RoleSelector` ✅
- **`src/lib/components/registration/`**: `roles` ✅, `vallues` ✅, `workways` ✅
- **`src/lib/components/addnew/`**: `addNewMission` ✅, `addNewSkill` ✅
- **`src/lib/components/prPr/`**: `negoM` ✅, `choosMission` ✅, `whowhat` ✅
- **`src/lib/components/main/`**: `amana` ✅, `tikunolam` ✅, `translatehe` ✅
  > `amanaen`, `amanar`, `tikunar`, `tikuneng`, `tranarb`, `translateeng` **נמחקו** —
  > אלה היו קבצי-כפילות לפי שפה; אוחדו לתוך `amana`/`tikunolam`/`translatehe` +
  > נתיבי פרוקסי חדשים `/api/chezin`, `/api/tikun`, `/api/translate` (מחיקה
  > **staged** ב-git, טרם committed נכון ל-2026-07-14 — לא לחפש את הקבצים שוב).
- **routes**: `hascama/+page.svelte` ✅ (קיים, נקי, מוגר). `convention/+page.svelte` ו-
  `aitifaqia/+page.svelte` **נמחקו** כחלק מאותו איחוד (staged ב-git, טרם committed).
- ~~`src/lib/legacy/moach/OLD_monolith.svelte`~~ (legacy — לא מגרים)

> grep guardrail (2026-07-14): רק 2 קבצים תואמים בכל `src` —
> `reqtosherut.svelte` (קוד מת, לעיל) ו-`OLD_monolith.svelte` (legacy). `pmas.svelte`
> מכיל את המילה "graphql" רק בתוך בלוק מוער-מת (`/*saved for when graphql enable...`) —
> לא offender אמיתי, אין צורך לטפל.
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
- [x] **מחיקת קוד מת** — בוצע 2026-07-14 (אומת 2026-06-28 — אף import):
  - [x] `src/lib/components/lev/reqtosherut.svelte` — נמחק; הוסר גם מ-BASELINE ב-`check-proxy-security.mjs`
  - [x] `src/lib/components/registration/password.svelte` — נמחק
  - [x] `src/lib/components/main/amann.svelte` — נמחק (נמצא כבר כ-`amann.svelte.dead`, כלומר כבר לא `.svelte` פעיל; הוסר סופית)
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
- [x] הגירת `main/*` (amana, tikunolam, translatehe — שאר השמות ברשימה המקורית לא קיימים בקוד) + route `hascama` (convention/aitifaqia לא קיימים) — אומת נקי 2026-07-14
- [x] הגירת `addnew/*` (addNewMission, addNewSkill) — אומת נקי 2026-07-14
- [x] הגירת `ui/*` (ValueSelector, SkillSelector, RoleSelector) — אומת נקי 2026-07-14
- [x] הגירת `registration/*` (roles, vallues, workways) — אומת נקי 2026-07-14; password.svelte קוד מת
- [x] הגירת `userPr/*` — אומת נקי 2026-07-14 (`editBasic` change-password כבר על auth proxy)
- [x] הגירת `prPr/*` (negoM, choosMission, whowhat) — אומת נקי 2026-07-14
- [x] הגירת `sales/SaleComponent`, `registration/newppp` — אומת 2026-07-14: `SaleComponent.svelte`
  עצמו נקי, כבר משתמש ב-`executeAction('createSale', …)` + `createSaleConsentSpec` (לא ב-graphql ישיר);
  `registration/newppp.svelte` כבר הומר ל-`.dead` (לא `.svelte` פעיל). **אבל ראה "ממצא חדש" למטה** —
  `salesService.js`/`productAggregationService.js` (קוד מת נפרד, לא מיובא מ-SaleComponent) עדיין
  מכילים קריאות graphql ישירות עם bearer שבור.
- [ ] הגירת routes שמשתמשים בטוקן (`newlev` הושלם ✅ 2026-05-29, `me`, `oldlev`, ...)
- [x] יצירת `/api/auth` proxy (2026-05-24) + change-password/forgot/reset/send-email-confirmation
- [x] היפוך 4 נקודות החשיפה ל-flag בוליאני (3.3) — אומת 2026-07-14: כל 4 המקומות כבר
  `tok: !!tok` / `loggedIn: !!tok` / `tok: tok==false?false:true`
- [x] הוספת guardrail (3.4) — קיים ועובד; ⏳ עדיין לא מחובר ל-CI (אין `.github/workflows`)
- [ ] בדיקת רגרסיה ידנית בדפדפן: login, lev, העלאת קובץ, שינוי סיסמה

### ⚠️ ממצא חדש (2026-07-14) — אשכול קוד מת עם bearer שבור, לא נתפס ע"י ה-guardrail

תוך כדי בדיקת `sales/SaleComponent` נמצא ש-3 קבצי `.js` לקוח (**לא** `.svelte`, ולכן
ה-guardrail הנוכחי — שסורק רק `.svelte` — לא רואה אותם) מכילים fetch ישיר מהדפדפן
ל-`VITE_URL/graphql` עם `Authorization: bearer ${token}`:

- `src/lib/services/salesService.js` — `createSale`, `getUserSellableProducts`,
  `getUserProjects`, `getProjectProducts` (שורות ~276, 436, 614, 756)
- `src/lib/services/productAggregationService.js`, `src/lib/services/projectMembershipService.js`
  (משתמשים ב-`authUtils.getAuthData()` לאותו bearer)

ה-`token`/`bearer` האלה מגיעים מ-`page.data.tok`, שכבר בוליאני (3.3) — כלומר גם אם
מישהו כן היה קורא לקוד הזה, הוא היה שולח `Authorization: "bearer true"` ונכשל.
**אבל זה לא רלוונטי בפועל:** אומת ב-grep שאף `.svelte`/route בקוד החי לא מייבא את
`$lib/services` (הבארל) או את `salesService.js`/`productAggregationService.js`/
`projectMembershipService.js` ישירות — כל השרשרת הזו (כ-2000 שורות) יתומה לגמרי.
`SaleComponent.svelte` החי משתמש בנתיב נפרד ובטוח (`executeAction`).

**מסקנה:** לא סיכון אבטחה פעיל (קוד לא מגיע לריצה), אבל שני דברים לתעדף:
1. מחיקת האשכול המת (`salesService.js`, `productAggregationService.js`,
   `projectMembershipService.js` + מה שתלוי בהם unique ב-`authUtils.js`) — ניקוי בלבד.
2. שקול להרחיב את ה-guardrail (3.4) גם ל-`.js`/`.ts` תחת `src/lib` (לא `src/routes/api`
   או `src/lib/server` — שם קריאה ישירה ל-Strapi תקינה) כדי לתפוס דפוס כזה בעתיד.

### 3.6 Sidequest — מיגרציית chat לאובייקט Forum — **הצד הרלוונטי לפרוקסי הושלם ✅ (אומת 2026-07-14)**

שלוש פונקציות chat ב-`lev/` שמרו פעם את ההודעות **כמערך component בתוך ה-entity
עצמו** עם `PUT /api/askms/${askId}` ישיר מהלקוח (חשיפת `page.data.tok`). אומת
מחדש 2026-07-14:

| קובץ | מצב נוכחי |
|------|-----------|
| `reqtom.svelte` (`afreact`, ~434-449) | ✅ עבר ל-`executeAction('addAskmChatEntry', { askId, why })` — לא PUT ישיר, לא bearer בלקוח |
| `mashsuggest.svelte` | ✅ אין יותר `replyToMash`/chat כלל בקובץ — הפונקציונליות הוסרה |
| ~~`reqtosherut.svelte`~~ | **נמחק** (§3.5) |

**מה שנשאר, לא קריטי לתכנית הפרוקסי:** האם `addAskmChatEntry` (השרת) עדיין כותב
לשדה ה-component `chat[]` הישן במקום ל-`forum`/`messages` אמיתי — זו שאלת סכמה/
ארכיטקטורת דאטה, לא חשיפת אבטחה (הקריאה כבר עוברת דרך `/api/action` המאומת).
לא נבדק כאן; אם רוצים לסגור את זה יש לבדוק את `src/lib/server/actions/configs/addAskmChatEntry.ts`.

---

## 4. שלב 2 — הקשחת הפרוקסי עצמו

- **לסגור את ה-raw-query bypass** — הועבר לסעיף 0.2 (קריטי, לתקן מיד).
- **לסגור את פרצת ה-`isSer`** — סעיף 0.1 (קריטי, לתקן מיד).
- Rate limiting + הגבלת גודל body על נתיבי הפרוקסי.
- CORS מצומצם.
- לוודא ש-`/api/action` עם authorization לכל action הוא הסטנדרט לכתיבה.

## 5. שלב 3 — נעילת רשת ל-Strapi (העברת SvelteKit ל-VPS)

ההחלטה: שרת ה-SvelteKit (node adapter) ירוץ **על אותו VPS** של Strapi.
Strapi נחסם מבחוץ ומדבר רק עם SvelteKit דרך רשת הדוקר הפנימית.

- **⚠️ הכתובת הפנימית היא `http://strapi:1337`, לא `127.0.0.1:1337`.** שני
  הצדדים רצים בקונטיינרים, ו-`127.0.0.1` בתוך `sveltekit-api` הוא הקונטיינר
  עצמו — לא ה-host ולא Strapi. `strapi` הוא alias יציב על הרשת
  `app_app-network`, ש-`deploy.ps1` בריפו של Strapi מצמיד לצבע ה-blue/green
  הפעיל בכל פריסה (בלעדיו הכתובת הייתה `strapi-blue`/`strapi-green` ומשתנה
  מתחת לרגליים). ראה את ההערה בראש `docker-compose.api.yml` ואת
  `src/lib/server/strapiUrl.js`.
- הערך יושב ב-`.env` של הקונטיינר על השרת בלבד
  (`/home/ubuntu/api/.env` — `deploy-api.ps1` לעולם לא מעלה או דורס אותו),
  ונקרא ב-**runtime** דרך `$env/dynamic/private` — כלומר שינוי דורש רק
  `docker compose restart sveltekit-api`, **לא** rebuild.
  ה-`.env` המקומי בריפו הוא עניין אחר: שם `STRAPI_URL=https://tovmeod.1lev1.com`
  נכון, כי ה-dev רץ מחוץ ל-VPS.
- Strapi לא מפרסם פורט ל-host (רק לרשת הדוקר) **וגם** firewall (ufw/iptables)
  שחוסם 1337 מבחוץ — הגנה כפולה. לאמת: `sudo ss -tlnp | grep 1337` צריך
  להראות רק את מה שדוקר מנהל פנימית, לא `0.0.0.0:1337`.
- Nginx מקדימה את SvelteKit (TLS, gzip) ומאזינה ל-`127.0.0.1:3000`.
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
4. - [x] **`VITE_URL` → `STRAPI_URL`** (פרטי, `$env/static/private`) ב-`api/send`, `api/action`, `api/upload`, `$lib/server/sendToAdmin.js` — בוצע 2026-07-14. `STRAPI_URL` כבר היה קיים ב-`.env` ובשימוש ב-5 קבצי שרת אחרים (`api-keys`, `apiKeys.ts`, `report`, `translations`, `sync-vocabulary` — האחרון עדיין על `VITE_URL`, לא טופל כאן, מחוץ לסקופ 3 הראוטים). אומת: `check:proxy` ✅, `validate:qids` ✅ (0 שגיאות, 1 warning קדום לא קשור)
   - [x] **הושלם לכל צד השרת + מעבר ל-runtime (2026-07-16):** נוצר
     `src/lib/server/strapiUrl.js` — מקור אמת יחיד: `STRAPI_URL`/`STRAPI_GRAPHQL`
     מ-**`$env/dynamic/private`** (נקרא בזמן ריצה מה-`.env` של הקונטיינר, בלי rebuild)
     עם fallback ל-`VITE_URL` ל-dev. הוגרו אליו **כל** קבצי השרת: `api/send`,
     `api/action`, `api/upload`, `api/report`, `api/auth`, `api/translations`,
     `api/vocab/*`, `api/consent/genesis`, `api/onboard/save`, `api/stat`, `api/cron`,
     `api/api-keys`, `sendToAdmin`, `apiKeys.ts`, `StrapiClient.ts` (גם תוקן fallback
     שבור בלי `/graphql`), `actions/index.ts`, כל 18 `actions/configs/*`,
     `importInvitedMeeting`, `sealedMirror`, `strapiMirror`, `dealsQueries`,
     `profileVocab`, `vocab/moderation`, וכל ה-`+page.server` (login, signup, me,
     sales-center, deals/request, gift, moach/chains). `sync-vocabulary.ts` נשאר על
     `process.env` (רץ גם standalone) אבל מעדיף `STRAPI_URL`. **לא** הוגרו (במכוון):
     `api/pusher` (VAPID subject — מזהה, לא קריאת Strapi), קבצים אוניברסליים/לקוח
     (`love/+page.js`, `levDataLoader`, `platform/index.js`) וקוד מת. אומת:
     `check:proxy` ✅, `validate:qids` ✅, טסטים של `api/action` (22) ✅, build ✅.
   - [x] **`VITE_REND` (אינסטנס Render שנרדם) הוחלף (2026-07-16):** `api/pingrama`
     פונה כעת ל-`https://api.1lev1.com/` (ניתן לעקוף ב-runtime עם `REND_URL`);
     `Bot.svelte` + `routes/chat` פונים ל-`https://api.1lev1.com/api/chat` במקום
     `rend.1lev1.com` (ל-`/api/chat` יש כבר CORS ל-`www.1lev1.com`). אפשר לסגור את
     אינסטנס ה-Render אחרי פריסת ה-image המעודכן ל-VPS ואימות.
5. - [x] **סעיף 2.2.1** — הגירת הקומפוננטות החיות האנונימיות (amana/tikun/hascama, ui selectors, registration, addnew, prPr) — אומת נקי מחדש 2026-07-14, כבר היה מוגר; `convention`/`aitifaqia`/`amanaen`/`amanar`/`tikunar`/`tikuneng`/`tranarb`/`translateeng` לא קיימים בקוד (שמות פנטום)
6. - [x] sidequest ה-chat (3.6) הושלם ✅ 2026-07-14 (הצד הרלוונטי לפרוקסי)
   - [ ] `test-lev-socket` — עדיין קיים; `page.data.tok` שם כבר בוליאני אז לא דולף
     טוקן אמיתי (לא מסוכן), אבל זה דף בדיקה שלא שייך לפרודקשן — למחוק או להסיר מהראוטינג
7. - [ ] guardrails (3.4) + grep = 0
8. - [ ] שלב 2 — rate limiting, body size, CORS
9. - [ ] שלב 3 — פריסת SvelteKit על ה-VPS, נעילת Strapi ל-`127.0.0.1` + firewall (ufw), Nginx ל-`/admin` + TLS; **ללא** צורך ב-location מיוחד ל-`/uploads` (Cloudinary)
   - [x] קבצי docker + סקריפט פריסה לאינסטנס ה-API נוצרו (2026-07-02): `Dockerfile`, `.dockerignore`, `docker-compose.api.yml`, `deploy-api.ps1`, `/api/health` — ראה `docs/DEPLOY_API_DOCKER.md`
   - [x] **מנגנון ניתוב תנועת הדפדפן ל-api.1lev1.com נבנה (2026-07-16), ממתין לבדיקת dev + הפעלה:**
     - `VITE_API_BASE` (build-time, ריק=כבוי): `installApiBasePatch()` ב-`$lib/platform`
       (מותקן מ-`+layout.js`) מנתב כל `fetch`/XHR של הדפדפן ל-`/api/*` אל הבסיס,
       עם `credentials:'include'` (ה-cookie same-site — `.1lev1.com`). axios (auth
       flows) מכוסה דרך פאץ' ה-XHR. דפי `__data.json`/form actions נשארים ב-origin.
     - CORS מרוכז ב-`hooks.server.js` לכל `/api/*` — allowlist (www/app/1lev1.com +
       dev.1lev1.com:5173/localhost), עונה ל-preflight OPTIONS, override עם
       `CORS_ALLOWED_ORIGINS` ב-`.env` של הקונטיינר. `headers.set` כדי לא להכפיל
       מול ראוטים עם CORS משלהם (`/api/chat`).
     - `svelte.config.js` (ענף node): `csrf.trustedOrigins` — בלעדיו SvelteKit חוסם
       POST cross-origin של multipart (`/api/upload`).
     - vite `server.allowedHosts: ['dev.1lev1.com']` לבדיקת dev עם cookies.
10. - [ ] שלב 4 — אימות סופי, ניקוי, תיעוד

---

## 9. הפעלת ניתוב הדפדפן ל-api.1lev1.com — סדר בדיקה (dev → prod)

1. **לפרוס את ה-image החדש ל-VPS** (`.\deploy-api.ps1`) — בלי זה אין CORS בצד
   api.1lev1.com וכל בדיקה תיחסם בדפדפן.
2. **בדיקת dev אנונימית:** בלוקאל `VITE_API_BASE=https://api.1lev1.com` ב-`.env`,
   להריץ dev, לבדוק ב-Network שדפים אנונימיים (hascama, love) שולחים `/api/send`
   ל-api.1lev1.com ומקבלים 200 (עם preflight OPTIONS 204 לפניהם).
3. **בדיקת dev מחובר (cookies):** מ-localhost הדפדפן לא ישלח את ה-jwt
   (cross-site + SameSite=Lax). הפתרון: שורה `127.0.0.1 dev.1lev1.com` ב-
   `C:\Windows\System32\drivers\etc\hosts`, לגלוש ל-`http://dev.1lev1.com:5173`,
   להתחבר שם (ה-cookie נקבע על `.1lev1.com` בלי Secure ב-dev) — ואז lev/פעולות
   עוברים דרך api.1lev1.com עם ה-cookie (same-site).
4. **הפעלה בפרודקשן:** `VITE_API_BASE=https://api.1lev1.com` ב-env של Vercel +
   redeploy. חזרה לאחור = להסיר את המשתנה ו-redeploy (הכל חוזר יחסי).
5. **מה זה עדיין לא סוגר:** SSR של Vercel (`+page.server`) ממשיך לפנות ל-Strapi
   (tovmeod) ישירות — נעילת tovmeod תבוא רק אחרי זה: שער header-סוד ב-nginx
   שמתיר רק את Vercel, הגנת `/admin` (basic-auth / allowlist IP), ו-firewall.

## 10. strapi-gate — נעילת tovmeod עם סוויץ' (נבנה 2026-07-17)

**המנגנון** (שני צדדים + מתג):

- **צד השרתים (SvelteKit):** `src/hooks.server.js` עוטף את ה-fetch הגלובלי בצד
  שרת — כל בקשה ל-origin של Strapi (`STRAPI_URL` / `VITE_URL`) מקבלת header
  `x-strapi-gate` עם הסוד `STRAPI_GATE_KEY` (מ-`$env/dynamic/private`; בלי
  המשתנה — no-op). מכסה את כל ~45 אתרי הקריאה (login/me/deals/actions/send)
  בלי לגעת בהם.
- **צד tovmeod (nginx על ה-VPS):**
  - `/etc/nginx/conf.d/strapi-gate.conf` — map של הסוד (chmod 600).
  - `/etc/nginx/conf.d/strapi-gate-state.conf` — מצב פתוח/סגור (map סטטי).
  - בבלוק של tovmeod: אם אין header נכון וגם המצב סגור → 403, **חוץ מ**
    `/uploads/*` (תמונות לדפדפן) ו-acme-challenge (חידוש תעודות).

> **הערה על היחס בין §10 ל-§5:** ברגע ש-`STRAPI_URL=http://strapi:1337`
> (הכתובת הפנימית), הקריאות של `sveltekit-api` **לא עוברות ב-nginx בכלל** —
> אז השער לא רלוונטי להן, וגם ה-`x-strapi-gate` שנחתם עליהן פשוט מתעלמים ממנו.
> השער נשאר המנעול למי שכן מגיע מבחוץ דרך `tovmeod.1lev1.com` (dev מקומי,
> כלים, שאריות). זה בדיוק מה שמאפשר להמשיך לפתח מהמחשב אחרי הסגירה — ראה §12ג.
- **המתג (מה שביקשת):** בשרת — `sudo strapi-gate open` (חושף הכל, לעבודת אדמין),
  `sudo strapi-gate close` (נועל), `strapi-gate status`. עושה nginx reload לבד.

**תיקוני client שנדרשו** (קריאות דפדפן ישירות ל-tovmeod שנחסמו בעתיד):
forum `[forumId]` שלח `/api/action` ל-VITE_URL (באג — תוקן ליחסי);
`ComposeProduct.svelte` העלה ישירות ל-Strapi (תוקן ל-`/api/upload` יחסי);
`love/+page.js` הפך ל-`+page.server.js` (השאילתה רצה בשרת). legacy שנשאר
(salesService/authUtils עם bearer מהclient) ממילא מת מאז שה-jwt הפך httpOnly.

**סדר הפעלה:**
1. חד-פעמי בשרת: `bash /tmp/setup-gate.sh` (הקבצים כבר ב-/tmp; ברירת מחדל פתוח).
2. להוסיף `STRAPI_GATE_KEY` (מה-`.env` המקומי) ל-env של **Vercel** + redeploy,
   ולפרוס image חדש ל-api (`.\deploy-api.ps1` — גם בשבילו ה-key ב-.env בשרת).
3. בדיקה בלי סיכון: `curl -s -o /dev/null -w '%{http_code}' -H "x-strapi-gate: <KEY>"
   https://tovmeod.1lev1.com/api/cuntries` → 200 גם כשסגור.
4. `sudo strapi-gate close` → לוודא: אתר עובד (login/lev/me/deals), תמונות
   נטענות, וגישה ישירה ל-tovmeod (בלי header) מחזירה 403.
5. תקלה? `sudo strapi-gate open` מחזיר הכל מיד.

**נשאר פתוח גם אחרי הסגירה:** מי שיש לו את הסוד עובר; `/uploads` ציבורי;
כשצריך אדמין — open, לעבוד, close. עדיין כדאי בהמשך firewall אמיתי (למנוע
עקיפת nginx על פורט 1337 אם הוא חשוף) — לבדוק `sudo ss -tlnp | grep 1337`.

## 11. SSR עובר לפרוקסי — הצעד שמאפשר לנעול את Strapi (2026-08-27)

**הבעיה שנשארה אחרי §9-§10:** גם כשהדפדפן מנותב ל-api.1lev1.com
(`VITE_API_BASE`), ה-**SSR** עדיין רץ על Vercel — ו-`+page.server` פנה משם
ל-Strapi ישירות. כל עוד זה המצב, Strapi חייב להיות נגיש מהאינטרנט הציבורי ולא
יכול להיסגר ל-loopback; `x-strapi-gate` הוא תחליף (סוד ב-header), לא נעילת רשת.

**המנגנון:** `SSR_API_BASE` (runtime, `$env/dynamic/private`).
`src/lib/server/ssrApiBase.js` מחליט, ו-`handleFetch` ב-`hooks.server.js` מבצע:
כל `fetch('/api/…')` **יחסי** מתוך לואד/form-action מנותב ל-
`SSR_API_BASE + path`, עם `x-internal-secret` (נגזר מ-`ADMINMONTHER`, זהה בשני
הצדדים) ועם ה-`Cookie` של הגולש מועבר הלאה — כי ברגע שהקריאה חוצה origin
SvelteKit מפסיק לצרף אותו לבד. על ה-VPS המשתנה ריק, ולכן `/api/*` שלו ממשיך
לרוץ in-process — אין לולאה ואין קפיצה מיותרת.

- ריק = כיבוי מלא (התנהגות ישנה). **rollback = להסיר את המשתנה מ-Vercel.**
- `rewriteToApiBase` מסרב לנתב URL מוחלט, נתיב שאינו `/api/`, וכשה-base הוא
  ה-origin של עצמנו — נבדק ב-`src/lib/server/ssrApiBase.test.ts`.

**שני clients חדשים לצד השרת** (`src/lib/server/`):
`sendViaProxy.js` → `/api/send` עם qid, `actionViaProxy.js` → `/api/action`
(מחזיר את אותו `{ success, data, error }` ש-`executeAction` מחזיר, כדי שאתר
קריאה רק יחליף import). שניהם ב-`sendViaProxy.test.ts`.

**מה הוגר (2026-08-27):**

| קובץ | היה | עכשיו |
|---|---|---|
| `(reg)/me` | POST ל-`STRAPI_GRAPHQL` עם `qids['meProfile']` | `sendViaProxy('meProfile')` |
| `(reg)/moach/[projectId]/chains` | query inline | qid חדש `306moachChainsExtra` |
| `(regandnon)/gift/[id]` | `fetchPendingForMatanot` ישיר | `sendViaProxy('125userPendingForMatanot')` |
| `love` | query inline אנונימי | qid חדש `305loveCountryAgreement`, `isSer:true` |
| `deals`, `deals/[id]`, `deals/request/[id]`, `deals/sales-center` | `gql()` ישיר + `Bearer tok` | `sendViaProxy`; `dealsQueries.ts` לא מקבל יותר `jwt` בכלל |
| `(reg)/forum/+layout`, `(reg)/forum/[forumId]`, `(reg)/concierge/[id]` | `actionService.executeAction` in-process | `actionViaProxy` |
| `login`, `signup` | `${STRAPI_URL}/api/auth/local[/register]` | `/api/auth/local[/register]` |
| `confirm-email` | `${STRAPI_URL}/api/auth/email-confirmation` | `/api/auth/email-confirmation` (GET חדש בפרוקסי) |
| `$lib/server/importInvitedMeeting.ts` | mutation עם admin token ישירות | `sendViaProxy('19CreatePendMeeting', …, { isSer:true })` |

**שינויים ב-`/api/auth/[...path]`:**
1. **קורא פנימי מקבל את ה-`jwt` בגוף.** בדרך כלל הפרוקסי שומר את הטוקן כ-cookie
   ומנקה אותו מהתשובה — אבל כשהקורא הוא SSR, ה-cookie היה נוחת על הקפיצה
   *בין שני השרתים* ונעלם. לכן `isInternalRequest` ⇒ התשובה עוברת כמו שהיא,
   ו-`login`/`signup` ממשיכים להגדיר את ה-cookie בעצמם — כולל לוגיקת מחיקת
   ה-zombie cookies שלא נגענו בה (יש לה היסטוריית באג בפרודקשן; ראה ההערה שם).
2. **`GET email-confirmation`** — הקישור מהמייל הוא GET, והפרוקסי לא עוקב אחרי
   ה-302 של Strapi אלא מחזיר `{ status }`.

**מה נשאר לעשות ביד (לא בקוד):**

1. - [ ] `SSR_API_BASE=https://api.1lev1.com` ב-env של **Vercel** (יחד עם
       `VITE_API_BASE` — שניהם צריכים להיות דלוקים) ואז redeploy.
       ⚠️ **לא** להגדיר אותו ב-`.env` של הקונטיינר על ה-VPS.
2. - [ ] לוודא ש-`ADMINMONTHER` **זהה** ב-Vercel וב-VPS — ממנו נגזר
       `x-internal-secret`, ובלי התאמה כל קריאת SSR תיפול ל-401.
3. - [ ] **Strapi → Settings → Users & Permissions → Email templates:** לוודא
       ש-`<%= URL %>` באישור המייל מצביע ל-`https://www.1lev1.com/confirm-email`
       ולא ל-Strapi עצמו. הקישור מהמייל חייב להגיע לאפליקציה — אחרת כשננעל
       tovmeod הוא ישבר. (זו ההגדרה שנוגעת גם ל-reset-password.)
4. - [ ] אחרי אימות: `sudo strapi-gate close`, ואז אפשר להתקדם ל-loopback אמיתי.

**מה זה עדיין לא סוגר:** `/api/*` שרץ על Vercel כשה-דפדפן פונה יחסית — זה מה
ש-`VITE_API_BASE` פותר (§9), וצריך להיות דלוק יחד עם זה. אחרי שניהם, אף קוד
שרץ על Vercel לא נוגע ב-Strapi: `grep -rln "server/strapiUrl" src` מחזיר רק
`src/routes/api/`, `src/lib/server/` ו-`hooks.server.js` (ושם רק לחישוב
ה-origin של שער ה-gate, לא לקריאה).

### 11.1 אימות בפועל (2026-08-27)

**מבחן א' — מול ה-VPS האמיתי** (`SSR_API_BASE=https://api.1lev1.com`, dev מקומי):
`GET /love` החזיר 200, וב-לוג: `/api/send 305loveCountryAgreement failed: 400
Unknown queId`. זו תשובה שרק הצד המרוחק יכול לתת (ה-qid קיים מקומית) — כלומר
הניתוב, ה-`x-internal-secret` והעברת השגיאה עובדים מקצה לקצה. בנוסף, probe ישיר
ל-`api.1lev1.com/api/send` עם הסוד הנגזר הריץ `meProfile` עד Strapi (נפל רק על
משתנה חסר, לא על 401) — כלומר **`ADMINMONTHER` תואם בין המקומי ל-VPS**.

⚠️ **המסקנה המבצעית:** ה-image הפרוס לא מכיר את `305`/`306`, את ה-GET החדש
ב-`/api/auth`, ולא את החזרת ה-jwt לקורא פנימי. **חובה לפרוס `.\deploy-api.ps1`
לפני שמדליקים `SSR_API_BASE` ב-Vercel** — אחרת love/chains/login יישברו.

**מבחן ב' — הקוד החדש בשני הצדדים** (גלישה ל-`dev.1lev1.com:5173`,
`SSR_API_BASE=http://localhost:5173` — שני origin שונים, אז ה-rewrite נורה):

| דף | הקפיצה הפנימית (`ua=node`) | זהות |
|---|---|---|
| `POST /login` | `POST /api/auth/local` → jwt בגוף, ה-action קבע jwt/id/un/email | — |
| `GET /me` | `POST /api/send` | **`uid=256`** |
| `GET /deals` | 4× `POST /api/send` | **`uid=256`** |
| `GET /love` | `POST /api/send` | `uid=None` (isSer) |

כולם 200. ה-`uid` על הקריאות הפנימיות מוכיח שהפרוקסי זיהה את המשתמש **מה-cookie
שהועבר בקפיצה**, וכניסת ה-login מוכיחה את מסלול ה-jwt לקורא פנימי.

### 11.2 מלכודת: Strapi בודק את ה-`Origin` (קיים מלפני השינוי)

Strapi מחזיר **500 `"<origin> is not a valid origin"`** לכל בקשה שנושאת `Origin`
שאינו ב-allowlist שלו — ו-`event.fetch` של SvelteKit מטביע `Origin` בקפיצה
חוצת-origin. נבדק מול `tovmeod` (2026-08-27):

| Origin | תוצאה |
|---|---|
| `https://www.1lev1.com`, `https://1lev1.com`, `https://api.1lev1.com`, `http://localhost:5173` | ✅ עובר |
| `http://127.0.0.1:5173`, `http://dev.1lev1.com:5173` | ❌ 500 |

**בפרודקשן זה תקין** — האינסטנס על ה-VPS שולח `Origin: https://api.1lev1.com`,
שנמצא ברשימה. אבל אם מוסיפים origin חדש (סביבת staging, preview של Vercel שפונה
ישירות) — צריך להוסיף אותו ל-CORS של Strapi, אחרת הכל נופל ב-500 מבלבל.

המעבר ל-`http://strapi:1337` (§5) **לא** משנה את זה: ה-`Origin` שנשלח הוא של
הקורא (`https://api.1lev1.com`), לא של היעד. אין מה לגעת.

---

## 12. שלוש בדיקות לפני ההדלקה ב-Vercel (2026-09-02)

### 12א. טלגרם — ממשיך לעבוד, אין מה לשנות

הבוט **אינו תהליך נפרד**: הוא route של webhook בתוך האפליקציה עצמה —
`src/routes/api/newTelegram/+server.js` (טלגרף ב-`bot.js` לצידו). ה-POST handler
מזריק את `event.fetch` לתוך ה-update (`data.fetch = svelteFetch`), וכל גישה
לדאטה עוברת `sendToSer(..., isSer=true, fetch)` → `/api/send` **יחסי**, או
`actionService`. אין בו ולו קריאה אחת ישירה ל-Strapi — אומת ב-grep 2026-09-02
(`timers.js` קורא ל-`/api/action`, לא ל-graphql).

לכן שני התרחישים עובדים בלי שינוי:
- webhook ל-**www.1lev1.com** (Vercel) → `handleFetch` מנתב את `/api/send`
  ל-`SSR_API_BASE` עם `x-internal-secret`. קפיצה אחת נוספת, ותו לא.
- webhook ל-**api.1lev1.com** → הכל נשאר in-process על ה-VPS.

מה כן לבדוק לפני:
1. לאן ה-webhook מוגדר בכלל — `curl "https://api.telegram.org/bot<TOKEN>/getWebhookInfo"`.
   אם הוא מצביע לאיזה host ישן (Render/רנד) — זה הזמן להזיז אותו.
2. ש-`ADMINMONTHER` תואם בין Vercel ל-VPS. כשל כאן **שקט במיוחד** בבוט:
   `isSer:true` בלי הסוד הפנימי מתדרדר לעיקרון אנונימי, אז הבוט יראה רשימות
   ריקות במקום ליפול עם שגיאה.

הודעות **יוצאות** (`TelegramService`, `HalukaNotificationService`) הולכות
ל-api.telegram.org ולא נוגעות ב-Strapi — לא מושפעות מהנעילה.

### 12ב. acme-challenge — איך סוגרים את Strapi ומשאירים את חידוש התעודה

החידוש הוא HTTP-01: certbot כותב קובץ ל-webroot, ו-Let's Encrypt מבקש
`http://tovmeod.1lev1.com/.well-known/acme-challenge/<token>` **בלי שום header**.
אם השער מחזיר לו 403 — החידוש נכשל בשקט והתעודה פגה בעוד 90 יום.

הכלל בבלוק של tovmeod: location עם `^~` (prefix בעל עדיפות, גובר על regex),
**לפני** בדיקת השער, ש-nginx מגיש מהדיסק ולא מפרוקסס ל-Strapi:

```nginx
location ^~ /.well-known/acme-challenge/ {
    root /var/www/html;          # ה-webroot ש-certbot כותב אליו
    allow all;                   # לפני כל בדיקת x-strapi-gate
    try_files $uri =404;
}
```

לאמת אחרי הסגירה — שתי בדיקות, שתיהן לא הרסניות:

```bash
sudo strapi-gate close
echo ok | sudo tee /var/www/html/.well-known/acme-challenge/probe >/dev/null
curl -s -o /dev/null -w '%{http_code}\n' http://tovmeod.1lev1.com/.well-known/acme-challenge/probe   # 200
sudo certbot renew --dry-run
```

אלטרנטיבה שמנתקת את התלות לגמרי: לעבור ל-**DNS-01**, ואז אפשר לסגור גם את
80/443 של tovmeod ולא רק את ה-API.

### 12ג. ה-dev המקומי אחרי הסגירה

**ימשיך לעבוד כמו שהוא.** `hooks.server.js` חותם `x-strapi-gate` על כל fetch
צד-שרת ל-origin של `STRAPI_URL`, וה-key יושב ב-`.env` המקומי — זו בדיוק הסיבה
שהשער הוא סוד ב-header ולא רק firewall. מה שכן: אם בהמשך Strapi ייסגר לחלוטין
(בלי nginx ציבורי), dev לא יגיע אליו — ואז או SSH tunnel, או, עדיף, לפתח מול
הפרוקסי בדיוק כמו Vercel (למטה).

**כן — כדאי טסט מקומי לפני Vercel, וזה הטסט:** לדמות את Vercel במדויק, כולל
שלילת הגישה הישירה. ב-`.env` המקומי:

```
VITE_API_BASE=https://api.1lev1.com
SSR_API_BASE=https://api.1lev1.com
STRAPI_URL=http://127.0.0.1:9        # כתובת מתה — כל נגיעה ישירה ב-Strapi תיפול מיד
```

ואז `npm run dev` וגלישה ל-`http://dev.1lev1.com:5173` (שורת hosts, §9 סעיף 3 —
בלעדיה ה-cookie לא נשלח cross-site). כל מסלול שעדיין נוגע ב-Strapi ישירות נופל
רועש ומיידי, ולא בפרודקשן. זה מבחן חזק יותר מ-`strapi-gate close`, כי הוא לא
מסתמך על סוד שדווקא ה-dev כן מחזיק.

לעבור: login, `/me`, `/lev`, `/deals`, `/love`, העלאת קובץ, שינוי סיסמה.

**ומה עושים עם `STRAPI_URL` המקומי בסוף?** תלוי במצב-הקצה, ולא אותה תשובה:

- **שער סגור + nginx של tovmeod קיים (§10):** להחזיר
  `STRAPI_URL=https://tovmeod.1lev1.com`. ל-dev יש את `STRAPI_GATE_KEY`,
  `hooks.server.js` חותם אותו, והפיתוח ממשיך כרגיל מול הדאטה האמיתי.
- **נעילה מלאה בלי דלת מבחוץ:** אין מה להחזיר — הקונפיג הזמני הופך לקבוע,
  ו-`STRAPI_URL` נשאר מת **בכוונה**, כשומר שמפיל כל קריאה ישירה חדשה.

⚠️ **המחיר של האפשרות השנייה:** dev שעובד דרך api.1lev1.com מריץ UI מקומי מול
**קוד שרת פרוס**. qid חדש, action חדש או שינוי ב-`hooks`/`/api/*` לא קיימים שם
עד הפריסה הבאה — בדיוק ה-`400 Unknown queId` של §11.1. מצוין לפרונט, יקר
לבקאנד. לכן כדאי להשאיר דלת אחת: **השער** (הציבור מקבל 403, מי שמחזיק את
המפתח עובר — זו בדיוק מטרתו), או loopback + `ssh -L 1337:127.0.0.1:1337`
(עובד רק אם הקונטיינר מפרסם ל-loopback של ה-host — `sudo ss -tlnp | grep 1337`).

בכל מקרה `VITE_URL` נשאר רלוונטי בלקוח כבסיס לנתיבי מדיה יחסיים — ולכן
`/uploads` נשאר ציבורי ב-nginx (§12ב).

#### שתי מלכודות ב-`dev.1lev1.com` שנתקלנו בהן בפועל (2026-09-02)

**1. `upgrade-insecure-requests` הרג את הדף — תוקן.** `app.html` נשא
`<meta http-equiv="Content-Security-Policy" content="upgrade-insecure-requests">`
כתגית קבועה. על origin **http שאינו localhost** (בדיוק `dev.1lev1.com:5173`)
הוא שדרג כל מודול ונכס ל-`https://dev.1lev1.com:5173` — פורט שמדבר http — אז
ה-SSR נשלח, שום דבר לא היה יכול להיטען, והדף נתקע על "רק רגע בבקשה" עם
`ERR_BLOCKED_BY_CLIENT` על `entry.js`. localhost פטור מהשדרוג לפי הספק, ולכן
`npm run dev` הרגיל מעולם לא נתקל בזה — רק ה-alias שנועד לבדיקת ה-cookies.
התגית הפכה ל-`%upgradeInsecure%` שמוזרק ב-`transformPageChunk` רק כש-`isSecure`
(אין נתיב prerender, אז בפרודקשן ההתנהגות זהה).

**2. התחברות ב-dev לא נשמרת בדפדפן שמחובר לפרודקשן — התנהגות Chrome, לא באג.**
ה-action מחזיר `{success:true}` ומדפיס Set-Cookie תקין (אומת ב-curl: כל חמשת
ה-cookies נשמרים, ו-`/me`, `/love`, `/api/permissions` מחזירים 200), אבל
הדפדפן זורק אותם והדף חוזר ל-`/login?from=…`. הסיבה: ב-`www.1lev1.com` אותם
שמות (`jwt`,`id`,`un`,`when`,`email`) כבר קיימים על `Domain=.1lev1.com` עם
`Secure`, ו-**origin לא-מאובטח אינו רשאי לדרוס cookie עם `Secure`** (Strict
Secure Cookies). ב-jar נקי אין התנגשות והכל עובד.

לכן, כדי לבדוק את החצי הקליינטי ב-dev, אחת מהשלוש:
- לפתוח פרופיל דפדפן/חלון פרטי **שלא מחובר** ל-`www.1lev1.com` (הכי פשוט);
- למחוק את ה-cookies של `1lev1.com` באותו פרופיל (יחזרו בכניסה הבאה לפרודקשן);
- להגיש את ה-dev ב-https על `dev.1lev1.com` (cert עם SAN לשם הזה + CA מהימן) —
  `vite.config.js` כבר מכיל בלוק https מוער, אבל ה-cert שבריפו מכסה רק
  `localhost`.

מה שלא נפגע: **כל צד ה-SSR** נבדק במלואו ב-`localhost:5173` (login → `/onboard`,
`/me` עם הפרופיל האמיתי, `/deals`, `/love` עם 213 הסכמות) בזמן ש-`STRAPI_URL`
הצביע לכתובת מתה — כלומר הדאטה יכול היה להגיע רק דרך `/api/send` ב-api.1lev1.com.
ב-localhost רק **הקריאות מהדפדפן** ל-api.1lev1.com נכשלות ב-403, וזה צפוי: ה-cookie
שם host-only ולא נשלח ל-subdomain אחר. בפרודקשן (www.1lev1.com) שני הצדדים
תחת `.1lev1.com`, ולכן הבעיה הזו לא קיימת שם.
