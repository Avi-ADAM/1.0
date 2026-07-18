# תכנית — בדיקת הרשאות פר-פעולה/קוורי ב-`/api/action` ו-`/api/send`

> **מטרת-על:** לכל בקשה שמגיעה לפרוקסי, לדעת **לפני ההרצה** האם לטוקן שנשא
> אותה יש הרשאה ל-qid או ל-actionKey הספציפי — ולחשוף את אותה תשובה גם
> כ-API introspection ("האם מותר לי X?") עבור UI וכלים חיצוניים.
>
> משלים את `docs/PLAN_PROXY_SECURITY.md` (שם: סגירת פרצות isSer/raw-query
> ונעילת Strapi; כאן: מודל הרשאות דקלרטיבי פר-operation מעל אותם נתיבים).

**עדכן מסמך זה אחרי כל צעד:** שנה `[ ]` ל-`[x]` ורשום תאריך.

---

## 1. תמונת מצב — מה קיים היום

### 1.1 סוגי "טוקן" (principals) שנכנסים לשני הנתיבים

| # | טוקן | איך מזוהה | היכן משמש | מה מותר לו בפועל היום |
|---|------|-----------|-----------|------------------------|
| 1 | **JWT משתמש** (cookie httpOnly `jwt` + `id`) | `cookies.get('jwt')` | `api/send`, `api/action`, `api/upload` | **כל** 365 ה-qids ב-`qids.js`; כל 130+ ה-actions (בכפוף ל-`authRules`). ההגנה פר-qid היא רק הרשאות ה-Role ב-Strapi. |
| 2 | **טוקן אדמין** `ADMINMONTHER` | `isSer:true` + `x-internal-secret` (`src/lib/server/internalSecret.js`) | `api/send` (נתיב service), `api/action` (bypass), `StrapiClient` | הכל, למעט if-ים ידניים (ראו 1.3). |
| 3 | **טוקן קונסנזוס** `CONSENSUS_PUBLIC_TOKEN` | `isSer` + qid ∈ `CONSENSUS_QIDS` + `x-consensus-secret` | `api/send` בלבד | רק qids של קונסנזוס (רשימה קשיחה ב-`+server.js:37`). |
| 4 | **API key** (`1lev1_…`) | `Authorization: Bearer`, `verifyApiKey` (`src/lib/server/apiKeys.ts`) | `api/v1/actions`, `api/mcp` | whitelist קשיח `ALLOWED_ACTIONS = ['createTask']` (`api/v1/actions/+server.ts:9`); מריץ בפועל עם טוקן אדמין. |
| 5 | **סוד פנימי** (`x-internal-secret`) | מוזרק ע"י `handleFetch` לכל fetch צד-שרת | מאמת את דגל `isSer` | לא principal בפני עצמו — מאפשר להיות #2/#3. |

### 1.2 מה כבר טוב

- `api/send` מקבל **רק qids מה-whitelist** (raw GraphQL = dev בלבד).
- `api/action` עובר דרך `AuthorizationEngine` עם `authRules` דקלרטיביים
  פר-action (`jwt`, `projectMember`, `forumParticipant`, `or`, `custom`…) —
  זה בדיוק המודל שרוצים, רק שהוא קיים **רק לצד ה-actions**.
- זהות `isSer` כבר לא ניתנת לזיוף (internal secret, ראו PLAN_PROXY_SECURITY §0.1).

### 1.3 הפערים

1. **`api/send` — אין מיפוי הרשאות פר-qid.** כל JWT מחובר יכול להריץ כל qid,
   כולל qids שנועדו ל-cron/בוט בלבד (למשל `7getTelegramIds`). בנתיב service,
   `ADMINMONTHER` פותח הכל.
2. **חריגים כ-if-ים ידניים בגוף ה-handler** (`+server.js:217-250, 277-282`:
   `42UpdatePosition`, `UpdateClause`, `39GetNegotiation`) — לא סקיילבילי,
   קשה לבדיקה, ובלתי אפשרי לענות מהם על "מה מותר לטוקן הזה".
3. **אין מושג principal אחיד.** `api/v1/actions` ממציא whitelist משלו;
   `ActionConfig` לא יודע להגיד "פעולה זו פתוחה גם ל-API keys".
4. **אין introspection.** אי אפשר לשאול "האם לטוקן X יש הרשאה ל-qid Y" בלי
   להריץ את הפעולה בפועל. ה-UI מנחש, וכלי MCP מגלים 403 רק בזמן ריצה.
5. **הרשאות ה-Role של Strapi הן קופסה שחורה** — לא מתועדות בקוד, לא נבדקות
   ב-CI, ולא ניתנות לשאילתה מהפרוקסי.

---

## 2. עקרונות התכנון

- **מילון אחיד:** `Principal` (מי) × `Operation` (מה: `send:<qid>` או
  `action:<actionKey>`) → `allowed | denied | conditional`.
- **דקלרטיבי, ליד ההגדרה:** ההרשאה של qid יושבת במניפסט לצד `qids.js`;
  ההרשאה של action יושבת ב-`ActionConfig` — לא if-ים בהנדלר.
- **Deny-by-default, אבל rollout ב-shadow:** קודם לוג-בלבד על מה שהיה נחסם,
  רק אחר כך אכיפה — כדי לא לשבור פרודקשן על qid שלא סווג נכון.
- **הפרוקסי משלים את Strapi, לא מחליף:** בקריאות user-JWT ההרצה ממשיכה עם
  הטוקן של המשתמש, כך ש-Strapi ממשיך לאכוף row-level. השכבה החדשה חוסמת
  **סוג** פעולה לא-מורשה, לא שורה ספציפית (לזה יש `authRules`/guards).
- **תשובה אחת לשני צרכנים:** אותה פונקציית `authorize()` משמשת גם את
  ההנדלרים (אכיפה) וגם את endpoint ה-introspection (שאילתה).

---

## 3. שלבי ביצוע

### שלב 1 — `resolvePrincipal`: זיהוי אחיד של הטוקן

**בוצע ✅ (2026-07-17):** `src/lib/server/authz/principal.ts` —
`resolveCookiePrincipal` / `resolveServicePrincipal` / `resolvePrincipal` /
`resolveApiKeyPrincipal` + בדיקות יחידה (`principal.test.ts`). ה־resolution
לעולם לא זורק על credential רע — מדרדר ל־cookie/anonymous בדיוק כהתנהגות
הקיימת. הערה: ב־`api/send` בדיקת ה־consensus-secret הקיימת (401 על סוד שגוי)
נשארה לפני השכבה החדשה, כך שההתנהגות זהה.

- [x] מודול חדש `src/lib/server/authz/principal.ts`:

```ts
export type PrincipalKind =
  | 'user'              // JWT מ-cookie
  | 'serviceAdmin'      // isSer + internal secret → ADMINMONTHER
  | 'serviceConsensus'  // isSer + consensus qid + x-consensus-secret
  | 'apiKey'            // Bearer 1lev1_…
  | 'anonymous';

export interface Principal {
  kind: PrincipalKind;
  userId?: string;        // ל-user ול-apiKey
  username?: string;      // cookie `un` (voter-id)
  keyId?: string;         // ל-apiKey
  scopes?: string[];      // שלב 6 (אופציונלי)
}
```

- [x] `resolvePrincipal({ request, cookies, isSerFlag })` מרכז את הלוגיקה שהיום
  מפוזרת: `isInternalRequest`, `x-consensus-secret`, `verifyApiKey`, cookies.
  **אין שינוי התנהגות** — רק חילוץ.
- [x] `api/send`, `api/action`, `api/v1/actions` עוברים להשתמש בו.
  (`api/mcp` ממשיך עם `verifyApiKey` ישירות — הכלים שלו לא עוברים דרך
  qids/actions; חיבור עתידי כשה־tools ימופו ל־ops.)
- [x] בדיקות יחידה: כל שילוב (isSer בלי secret ⇒ user, apiKey לא תקין ⇒
  null/401, וכו').

### שלב 2 — מניפסט הרשאות פר-operation

**ל-qids — קובץ אחות `src/routes/api/send/qidsAccess.js`:**

**בוצע ✅ (2026-07-17):** נוצר ע"י `scripts/build-qids-access.mjs` (423 qids:
358 user+serviceAdmin, 11 serviceAdmin בלבד, 15 consensus, 39 מסומנים
unreferenced). בדיקת הכיסוי `qidsAccess.test.ts` נכשלת על drift דו-כיווני.

**ביקורת ידנית — בוצע ✅ (2026-07-18):**
- מוינו 13 qids שנוספו ל-`qids.js` אחרי ריצת הסקריפט האחרונה (טרם היו
  ב-`qidsAccess.js`, מפילים את בדיקת הכיסוי): קאונטרים ציבוריים/רשומים
  (`279demandCounts`, `280maagadDemandCounts`, `213publicSupportPage`,
  `getOpenMissionMaagad`, `getOpenMashaabimMaagad` — כולם `isSer = tok===false`
  ⇒ `['user','serviceAdmin']`), qids פנימיים ל-self-nomination שרצים עם
  `context.jwt` (`214`–`218` ⇒ `['user','serviceAdmin']`, כמו תקדים ה-actions
  האחרים), ו-qids שרצים אך ורק עם `ADMIN_TOKEN`/ה-matching engine בלי JWT
  משתמש בכלל (`213recentSuggestionEmailCounts`, `salesApiProductInfo`,
  `saleByExternalId` ⇒ `['serviceAdmin']` בלבד).
- 39 הרשומות המסומנות `unreferenced` נבדקו (grep מקיף על כל `src/` — אפס
  קריאות בקוד לכל אחת) והודקו מ-`['user','serviceAdmin']` ל-`['serviceAdmin']`
  בלבד, עם הערה מתועדת. מצב `AUTHZ_MODE=log` (ברירת מחדל) אומר שההידוק הזה
  ילוג בלבד עד לאכיפה מודעת בשלב 5 — לא חוסם כלום כרגע.

- [x] לכל qid רשומה אחת:

```js
export const qidsAccess = {
  '12mission':        { allow: ['user', 'serviceAdmin'] },
  '7getTelegramIds':  { allow: ['serviceAdmin'] },          // cron/בוט בלבד
  '39GetNegotiation': { allow: ['user', 'serviceConsensus'],
                        guard: 'negotiationVisibility' },   // ראו שלב 3
  // ...
};
```

- [x] **סקריפט לבנייה** (`scripts/build-qids-access.mjs`): סורק את כל
  קריאות `sendToSer(...)` / `sendToSerTyped(...)` / `queId:` בקוד — qid שנקרא רק עם
  `isSer:true` מסווג `serviceAdmin`; qid שנקרא מקומפוננטות ⇒ `user`;
  qid ב-`CONSENSUS_QIDS` ⇒ `serviceConsensus`. הפלט הוא **טיוטה לביקורת
  ידנית**, לא אמת אוטומטית (הרצה חוזרת דורסת הידוק ידני — למזג ביד).
- [x] **בדיקת כיסוי ב-CI** (vitest): נכשלת אם קיים qid ב-`qids.js` בלי רשומה
  ב-`qidsAccess.js` (ולהפך). כך qid חדש מחייב סיווג מודע.

**ל-actions — שדה חדש ב-`ActionConfig` (`src/lib/server/actions/types.ts`):**

- [x] `access?: PrincipalKind[]` — ברירת מחדל `['user', 'serviceAdmin']`
  (המצב הקיים). פעולה שרוצים לחשוף ל-API keys מוסיפה `'apiKey'`.
- [x] `createTask` מקבל `access: ['user', 'serviceAdmin', 'apiKey']` —
  ומחליף את `ALLOWED_ACTIONS` הקשיח ב-`api/v1/actions/+server.ts`.

### שלב 3 — `authorize()` מרכזי + העברת ה-if-ים הידניים ל-guards

**בוצע חלקית ✅ (2026-07-17):** `authorize.ts` (`authorizeOperation`,
`checkApiKeyProjectScope`, `applyAuthz`, `getAuthzMode`) + חיווט לשלושת
הנתיבים + בדיקות יחידה. **בכוונה לא הועברו** ה-if-ים הידניים ל-guards —
הם נשארו inline ב-`api/send` כשכבה שנייה (הקטנת סיכון; אפשר לרפקטר
בנפרד כשהשכבה החדשה מוכחת בפרודקשן).

- [x] `src/lib/server/authz/authorize.ts`:

```ts
export type AuthzDecision =
  | { result: 'allowed' }
  | { result: 'denied'; reason: string }
  | { result: 'conditional'; guard: string }; // תלוי-params, נבדק בזמן הרצה

export function authorizeOperation(p: Principal, op: string): AuthzDecision;
// op = 'send:39GetNegotiation' | 'action:createTask'
```

  החלק הסטטי (allow-list פר-kind) הוא סינכרוני וזול — מתאים גם ל-introspection.
- [x] **`api/send`:** מיד אחרי resolve של `queId` + principal —
  `applyAuthz`; `denied` ⇒ `403` עם ה-reason (במצב enforce). זה קורה
  **לפני** בחירת הטוקן ולפני ה-fetch ל-Strapi.
- [ ] ה-if-ים הידניים הופכים ל-guards רשומים במניפסט (`guards.ts`) —
  **נדחה בכוונה**, ראו הערה למעלה:
  - `42UpdatePosition` בלי `support:true` ⇒ service אסור.
  - `UpdateClause` — כללי body/issueId + בעלות `authorExternalId`.
  - `39GetNegotiation` — הסתרת private מנתיב service.
- [x] **`api/action`:** `applyAuthz(principal, 'action:'+actionKey)`
  לפני `service.executeAction` (שממשיך להריץ את `authRules` — שכבה שנייה,
  תלוית-params). `AuthorizationEngine` לא השתנה. action לא מוכר ממשיך
  ל-ActionService כדי לשמר את סמנטיקת ה-404.
- [x] **`api/v1/actions`:** נמחק ה-whitelist המקומי (`ALLOWED_ACTIONS`);
  משתמש ב-`applyAuthz` עם principal מסוג `apiKey` — **נאכף תמיד**, בלי
  קשר ל-`AUTHZ_MODE`, כי הנתיב היה deny-by-default עוד קודם.
  (`api/mcp` — חיבור עתידי, הכלים שלו אינם qids/actions.)

### שלב 4 — endpoint introspection: "האם לטוקן הזה מותר X?"

**בוצע ✅ (2026-07-17):** `src/routes/api/permissions/+server.ts` —
`POST /api/permissions` (בדיקת רשימת ops) + `GET /api/permissions` (כל
ה-ops המותרים לטוקן הפונה). anonymous מקבל 401 (מניעת enumeration).
עוטף לקוח: `src/lib/send/canI.js` עם cache של 60 שניות.

- [x] `POST /api/permissions` — רץ עם הטוקן של הפונה (cookie או Bearer):

```jsonc
// request
{ "ops": ["send:12mission", "action:createTask", "action:approveHaluka"],
  "params": { "action:approveHaluka": { "projectId": "17" } } }   // אופציונלי
// response
{ "principal": "user",
  "results": {
    "send:12mission":         { "result": "allowed" },
    "action:createTask":      { "result": "allowed" },
    "action:approveHaluka":   { "result": "conditional", "guard": "projectMember" }
  } }
```

  - [x] בלי `params` — תשובה סטטית מהמניפסט (`conditional` כשיש `authRules`
    תלויי-ישות).
  - [ ] עם `params` — להריץ גם את ה-`authRules`/guard בפועל ולהחזיר
    `allowed`/`denied` סופי (שלב המשך).
  - [x] `GET /api/permissions` (לאותו טוקן) מחזיר את כל רשימת ה-ops המותרים —
    שימושי ל-MCP tools discovery ול-UI.
- [x] עוטף לקוח `src/lib/send/canI.js`: `canI(['action:createTask'])` עם
  cache קצר — להפעלה/הסתרה של כפתורים ב-UI במקום ניחוש.
- [ ] Rate-limit בסיסי (anonymous כבר מקבל 401 בלי פירוט — מניעת enumeration).

### שלב 5 — Rollout: shadow → אכיפה

- [x] דגל סביבה `AUTHZ_MODE = off | log | enforce` (ברירת מחדל: `log`;
  נקרא דרך `$env/dynamic/private` — ניתן לשינוי בלי build) (2026-07-17).
  - `log`: מחשבים החלטה; אם `denied` — כותבים ללוג
    (`[authz-shadow] denied send:7getTelegramIds principal=user uid=…`)
    **וממשיכים** בהתנהגות הישנה.
  - `enforce`: מחזירים 403.
  - חריג: תעבורת apiKey **תמיד** נאכפת, בכל mode.
- [ ] שבוע-שבועיים ב-`log` בפרודקשן; סקירת הלוגים ⇒ תיקון סיווגים שגויים
  במניפסט; רק אז `AUTHZ_MODE=enforce`.
- [x] בדיקות יחידה למטריצה (authorize.test.ts): user נחסם על qid של cron,
  apiKey נחסם על action לא-חשוף, serviceAdmin חסום על consensus,
  serviceConsensus מותר על consensus. (בדיקות אינטגרציה מלאות ברמת
  ה-endpoint — שלב המשך.)

### שלב 6 — scopes פר-API-key (פר-פרויקט + פר-op)

> **הקשר:** סטרפי לא מכיר את מנגנון ה-API keys כאימות — רק אנחנו אוכפים,
> ומאחורי הקלעים הפעולה מתבצעת עם טוקן האדמין. לכן ה-scopes כאן הם גבול
> ההרשאה האמיתי היחיד של מפתח.

- [ ] שדה `scopes` (JSON) ב-content-type `api-key` בסטרפי, בפורמט
  `{ "projects": ["17"], "ops": ["action:createTask"] }` (או מערך פשוט של
  project ids — נתמך כ-legacy). אחרי ההוספה: `npm run types:update`.
- [x] `verifyApiKey` שולף גם `scopes` (עם fallback חינני כשהשדה עוד לא קיים
  בסכמה) ומנרמל דרך `normalizeApiKeyScopes` (2026-07-17).
- [x] `authorizeOperation` חותך `kind ∈ allow` **וגם** `op ∈ scopes.ops`;
  `checkApiKeyProjectScope` אוכף `params.projectId ∈ scopes.projects`
  (מפתח מוגבל-פרויקטים חייב param של פרויקט) (2026-07-17).
- [ ] UI ניהול המפתחות (הקיים מעל `api/api-keys`) מציג ומאפשר לבחור scopes,
  ו-`POST /api/api-keys` שומר אותם.
- כך "טוקן" ספציפי (ולא רק סוג-טוקן) מקבל תשובה מדויקת פר-פעולה — הסגירה
  המלאה של מטרת-העל.

---

## 4. סדר עבודה מומלץ ותלויות

| צעד | תלוי ב- | סיכון | הערות |
|-----|---------|-------|-------|
| 1 resolvePrincipal | — | נמוך (refactor בלבד) | לבצע ראשון; מקטין את שני ההנדלרים |
| 2 מניפסט + בדיקת כיסוי | 1 | בינוני (סיווג 365 qids) | הסקריפט מכין טיוטה; הביקורת ידנית |
| 3 authorize + guards | 2 | בינוני | ב-`log` mode בלבד בהתחלה |
| 4 introspection | 3 | נמוך | ערך מיידי ל-UI/MCP |
| 5 אכיפה | 3 (+שבוע לוגים) | גבוה אם מדלגים על shadow | ההפעלה היא הפיכת דגל |
| 6 scopes | 3, 5 | נמוך | דורש שינוי סכימה בסטרפי |

## 5. מה במפורש לא בתכנית

- **לא** מחליפים את הרשאות ה-Role של Strapi — הן נשארות כשכבת עומק שנייה.
- **לא** נוגעים ב-`AuthorizationEngine`/`authRules` — הם השכבה תלוית-הישות
  (בעלות, חברות בפרויקט); התכנית מוסיפה שכבה סטטית **לפניהם**.
- **לא** ממציאים מנגנון voting/consent חדש (super-principles) — אין כאן
  Decision; זו אבטחת תשתית בלבד.
