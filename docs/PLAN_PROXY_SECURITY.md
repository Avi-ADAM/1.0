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
4. - [x] **`VITE_URL` → `STRAPI_URL`** (פרטי, `$env/static/private`) ב-`api/send`, `api/action`, `api/upload`, `$lib/server/sendToAdmin.js` — בוצע 2026-07-14. `STRAPI_URL` כבר היה קיים ב-`.env` ובשימוש ב-5 קבצי שרת אחרים (`api-keys`, `apiKeys.ts`, `report`, `translations`, `sync-vocabulary` — האחרון עדיין על `VITE_URL`, לא טופל כאן, מחוץ לסקופ 3 הראוטים). אומת: `check:proxy` ✅, `validate:qids` ✅ (0 שגיאות, 1 warning קדום לא קשור)
5. - [x] **סעיף 2.2.1** — הגירת הקומפוננטות החיות האנונימיות (amana/tikun/hascama, ui selectors, registration, addnew, prPr) — אומת נקי מחדש 2026-07-14, כבר היה מוגר; `convention`/`aitifaqia`/`amanaen`/`amanar`/`tikunar`/`tikuneng`/`tranarb`/`translateeng` לא קיימים בקוד (שמות פנטום)
6. - [x] sidequest ה-chat (3.6) הושלם ✅ 2026-07-14 (הצד הרלוונטי לפרוקסי)
   - [ ] `test-lev-socket` — עדיין קיים; `page.data.tok` שם כבר בוליאני אז לא דולף
     טוקן אמיתי (לא מסוכן), אבל זה דף בדיקה שלא שייך לפרודקשן — למחוק או להסיר מהראוטינג
7. - [ ] guardrails (3.4) + grep = 0
8. - [ ] שלב 2 — rate limiting, body size, CORS
9. - [ ] שלב 3 — פריסת SvelteKit על ה-VPS, נעילת Strapi ל-`127.0.0.1` + firewall (ufw), Nginx ל-`/admin` + TLS; **ללא** צורך ב-location מיוחד ל-`/uploads` (Cloudinary)
   - [x] קבצי docker + סקריפט פריסה לאינסטנס ה-API נוצרו (2026-07-02): `Dockerfile`, `.dockerignore`, `docker-compose.api.yml`, `deploy-api.ps1`, `/api/health` — ראה `docs/DEPLOY_API_DOCKER.md`
10. - [ ] שלב 4 — אימות סופי, ניקוי, תיעוד
