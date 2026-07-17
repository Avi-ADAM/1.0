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

- [ ] מודול חדש `src/lib/server/authz/principal.ts`:

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

- [ ] `resolvePrincipal({ request, cookies, body })` מרכז את הלוגיקה שהיום
  מפוזרת: `isInternalRequest`, `CONSENSUS_QIDS`+`x-consensus-secret`,
  `verifyApiKey`, cookies. **אין שינוי התנהגות** — רק חילוץ.
- [ ] `api/send`, `api/action`, `api/v1/actions`, `api/mcp` עוברים להשתמש בו.
- [ ] בדיקות יחידה: כל שילוב (isSer בלי secret ⇒ user, apiKey לא תקין ⇒
  anonymous, וכו').

### שלב 2 — מניפסט הרשאות פר-operation

**ל-qids — קובץ אחות `src/routes/api/send/qidsAccess.js`:**

- [ ] לכל qid רשומה אחת:

```js
export const qidsAccess = {
  '12mission':        { allow: ['user', 'serviceAdmin'] },
  '7getTelegramIds':  { allow: ['serviceAdmin'] },          // cron/בוט בלבד
  '39GetNegotiation': { allow: ['user', 'serviceConsensus'],
                        guard: 'negotiationVisibility' },   // ראו שלב 3
  // ...
};
```

- [ ] **סקריפט חד-פעמי לבנייה** (`scripts/build-qids-access.mjs`): grep על כל
  קריאות `sendToSer(...)` / `sendToSerTyped(...)` בקוד — qid שנקרא רק עם
  `isSer:true` מסווג `serviceAdmin`; qid שנקרא מקומפוננטות ⇒ `user`;
  qid ב-`CONSENSUS_QIDS` ⇒ `serviceConsensus`. הפלט הוא **טיוטה לביקורת
  ידנית**, לא אמת אוטומטית.
- [ ] **בדיקת כיסוי ב-CI** (vitest): נכשלת אם קיים qid ב-`qids.js` בלי רשומה
  ב-`qidsAccess.js` (ולהפך). כך qid חדש מחייב סיווג מודע.

**ל-actions — שדה חדש ב-`ActionConfig` (`src/lib/server/actions/types.ts`):**

- [ ] `access?: PrincipalKind[]` — ברירת מחדל `['user', 'serviceAdmin']`
  (המצב הקיים). פעולה שרוצים לחשוף ל-API keys מוסיפה `'apiKey'`.
- [ ] `createTask` מקבל `access: ['user', 'serviceAdmin', 'apiKey']` —
  ומחליף את `ALLOWED_ACTIONS` הקשיח ב-`api/v1/actions/+server.ts:9`.

### שלב 3 — `authorize()` מרכזי + העברת ה-if-ים הידניים ל-guards

- [ ] `src/lib/server/authz/authorize.ts`:

```ts
export type AuthzDecision =
  | { result: 'allowed' }
  | { result: 'denied'; reason: string }
  | { result: 'conditional'; guard: string }; // תלוי-params, נבדק בזמן הרצה

export function authorizeOperation(p: Principal, op: string): AuthzDecision;
// op = 'send:39GetNegotiation' | 'action:createTask'
```

  החלק הסטטי (allow-list פר-kind) הוא סינכרוני וזול — מתאים גם ל-introspection.
- [ ] **`api/send`:** מיד אחרי resolve של `queId` + principal —
  `authorizeOperation`; `denied` ⇒ `403` עם ה-reason. זה קורה **לפני** בחירת
  הטוקן ולפני ה-fetch ל-Strapi.
- [ ] ה-if-ים הידניים הופכים ל-guards רשומים במניפסט (`guards.ts`), עם אותה
  חתימה `(principal, variables, ctx) => AuthorizationResult`:
  - `42UpdatePosition` בלי `support:true` ⇒ service אסור (`+server.js:217`).
  - `UpdateClause` — כללי body/issueId + בעלות `authorExternalId` (`:224-250`).
  - `39GetNegotiation` — הסתרת private מנתיב service (`:277-282`).
  ה-handler נשאר רזה: resolve → authorize → guard (אם יש) → execute.
- [ ] **`api/action`:** `authorizeOperation(principal, 'action:'+actionKey)`
  לפני `service.executeAction` (שממשיך להריץ את `authRules` — שכבה שנייה,
  תלוית-params). `AuthorizationEngine` לא משתנה.
- [ ] **`api/v1/actions` + `api/mcp`:** מוחקים whitelists מקומיים; משתמשים
  באותו `authorizeOperation` עם principal מסוג `apiKey`.

### שלב 4 — endpoint introspection: "האם לטוקן הזה מותר X?"

- [ ] `POST /api/permissions/check` — רץ עם הטוקן של הפונה (cookie או Bearer):

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

  - בלי `params` — תשובה סטטית מהמניפסט (`conditional` כשיש `authRules`
    תלויי-ישות). עם `params` — מריצים גם את ה-`authRules`/guard בפועל
    ומחזירים `allowed`/`denied` סופי.
  - `GET /api/permissions` (לאותו טוקן) מחזיר את כל רשימת ה-ops המותרים —
    שימושי ל-MCP tools discovery ול-UI.
- [ ] עוטף לקוח `src/lib/send/canI.js`: `canI(['action:createTask'])` עם
  cache קצר — להפעלה/הסתרה של כפתורים ב-UI במקום ניחוש.
- [ ] Rate-limit בסיסי + אין הבחנה בהודעת השגיאה בין "qid לא קיים" ל"אין
  הרשאה" עבור anonymous (למנוע enumeration).

### שלב 5 — Rollout: shadow → אכיפה

- [ ] דגל סביבה `AUTHZ_MODE = off | log | enforce` (ברירת מחדל בפריסה
  ראשונה: `log`).
  - `log`: מחשבים החלטה; אם `denied` — כותבים ללוג
    (`[authz-shadow] denied send:7getTelegramIds principal=user uid=…`)
    **וממשיכים** בהתנהגות הישנה.
  - `enforce`: מחזירים 403.
- [ ] שבוע-שבועיים ב-`log` בפרודקשן; סקירת הלוגים ⇒ תיקון סיווגים שגויים
  במניפסט; רק אז `enforce`.
- [ ] בדיקות אינטגרציה (לצד `endpoint.integration.test.ts` הקיים):
  מטריצת principal × דגימת ops מכל קטגוריה — user מקבל 403 על qid של cron,
  apiKey מקבל 403 על action לא-חשוף, serviceConsensus חסום מחוץ ל-consensus.

### שלב 6 (אופציונלי, אחרי 1–5) — scopes פר-API-key

- [ ] שדה `scopes` (JSON) ב-content-type `api-key` בסטרפי — רשימת ops
  (`["action:createTask", "send:12mission"]`) או `["*"]`.
- [ ] `verifyApiKey` מחזיר גם `scopes`; `authorizeOperation` חותך:
  `kind ∈ allow` **וגם** `op ∈ scopes`.
- [ ] UI ניהול המפתחות (הקיים מעל `api/api-keys`) מציג ומאפשר לבחור scopes.
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
