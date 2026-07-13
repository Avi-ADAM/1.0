# API דיווח מכירות ממערכות חיצוניות (External Sales Reporting API)

> מסמך משלים בצד Strapi: `1.0b/docs/PLAN_EXTERNAL_SALES_API_BACKEND.md`
> (שינויי הסכמה של `api-key` ו‑`sale`).

## Context — למה זה נבנה

לחברי ריקמה יש אתרי מכירה משלהם (חנות, דף נחיתה, מערכת סליקה). היום כל
מכירה כזו מחייבת דיווח ידני ב‑1lev1. המטרה: **שרת API "טיפש" (REST פשוט,
לא MCP)** שמערכת צד־שלישי קוראת לו אחרי סליקה ומדווחת את המכירה אוטומטית.

בעמוד המוצרים של הריקמה (מוח ← מכירות) המשתמש יקבל:

1. **מפתח API שמוגדר רק לריקמה הזו** (scoped key).
2. **פיסת קוד מוכנה להעתקה** — שתילה באתר שלו (למשל ב‑callback של הסליקה)
   שולחת אלינו את פרטי המכירה.
3. **הדרכה קצרה על המשתנים** שהוא צריך לחבר מהמערכת שלו.
4. **פרומפט מוכן להעתקה לסוכן ה‑AI** שבונה לו את האתר, כך שהסוכן יבצע את
   האינטגרציה לבדו.

### שדות הדיווח (מה שהמערכת החיצונית שולחת)

- סכום (`amount`) · כמות (`quantity`)
- מזהה המוצר **אצלנו** (`productId` = Matanot id)
- מזהה המשתמש **אצלנו** שאצלו הכסף (`holderUserId`)
- תאריכי התחלה/סיום אם רלוונטי (מנויים) — `startDate` / `finishDate`
- תאריך מכירה (`saleDate`) — אם לא נשלח ⇒ `now`
- `externalId` — מזהה ההזמנה במערכת החיצונית (אידמפוטנטיות)

---

## מיפוי הקיים — על מה רוכבים

הכלל כאן זהה ל‑PLAN_sale_holder_consent: **לא ממציאים מסלול מכירה חדש**.
כל התשתית כבר קיימת, רק חסרה לה כניסה חיצונית ו‑scoping לריקמה.

| רכיב קיים | קובץ | מה הוא נותן לנו |
|---|---|---|
| מפתחות API (user-scoped) | `src/lib/server/apiKeys.ts` | יצירה (`1lev1_{uid36}_{rand}`), HMAC‑hash, `verifyApiKey` עם cache |
| CRUD מפתחות | `src/routes/api/api-keys/+server.ts` | יצירה/רשימה/מחיקה מול Strapi, raw מוחזר פעם אחת בלבד |
| UI ניהול מפתחות (משתמש) | `src/lib/components/userPr/api-keys.svelte` | תבנית UI לניהול מפתחות — נשכפל לרמת ריקמה |
| דוגמת endpoint מבוסס‑מפתח | `src/routes/api/v1/actions/+server.ts` | התבנית המדויקת: Bearer→`verifyApiKey`→whitelist→`actionService.executeAction` עם `ADMINMONTHER` |
| פעולת דיווח מכירה | `src/lib/server/actions/configs/createSale.ts` | **נקודת החנק היחידה**: יצירת Sale, הפחתת מלאי, Monter למנויים, ו‑saleClaim consent כשהכסף אצל אחר |
| עמוד מוצרים בריקמה | `src/routes/(reg)/moach/[projectId]/sales/+page.svelte` + `src/lib/components/prPr/hamatanot.svelte` | הנקודה שבה נציג את פאנל האינטגרציה |
| סכמת api-key ב‑Strapi | `1.0b/src/api/api-key/.../schema.json` | `name`, `key_hash`, `key_prefix`, `users_permissions_user` — **חסר** קשר לפרויקט |

### עקרון‑על שחייבים לשמר — הסכמת מחזיק־הכסף

`createSale` כבר מממש את PLAN_sale_holder_consent: אם המדווח ≠ מחזיק־הכסף
נפתחת החלטת `saleClaim` בילטרלית והמכירה לא נספרת עד הבשלה. דיווח מ‑API
**עובר באותה נקודת חנק בדיוק**:

- המדווח (reporter) = המשתמש שיצר את המפתח.
- `holderUserId` == יוצר המפתח ⇒ `holderStatus:'self'`, סופי מיידית.
- `holderUserId` ≠ יוצר המפתח ⇒ `saleClaim` Decision + timegrama, אוטומטית,
  בלי שורת קוד נוספת.

זו הסיבה המרכזית לרכוב על `createSale` ולא לכתוב מסלול "מהיר" ל‑API.

---

## ארכיטקטורה

```
אתר הלקוח (אחרי סליקה, browser או server)
        │  POST https://1lev1.com/api/v1/sales
        │  Authorization: Bearer 1lev1_xxx   (מפתח scoped לריקמה)
        ▼
SvelteKit: src/routes/api/v1/sales/+server.ts   ← חדש
        │  1. verifyApiKey → משתמש + פרויקט + scope
        │  2. ולידציה: מוצר שייך לריקמה, holder חבר ריקמה
        │  3. אידמפוטנטיות: externalId כבר דווח? ⇒ 200 (לא כפול)
        │  4. actionService.executeAction('createSale', …)
        ▼
createSale.ts (ללא שינוי מהותי) → Strapi
```

---

## Phase 0 — שינויי סכמה ב‑Strapi (`1.0b`, branch מ‑`shabab`)

פירוט מלא במסמך המשלים. תמצית:

1. **`api-key`** מקבל:
   - `project` — relation manyToOne → `api::project.project`
     (+ צד הפוך `api_keys` ב‑project). מפתח עם `project` ⇒ scoped לריקמה.
   - `scopes` — json (למשל `["sales:report"]`). מפתח ריקמה נוצר עם scope
     הזה בלבד ולא מקבל שום יכולת אחרת (MCP/actions).
   - `allowed_origins` — json, רשימת דומיינים מותרים (אופציונלי, ל‑hardening).
   - `revoked` — boolean, ביטול רך בלי למחוק היסטוריה.
   - `lastUsedAt` — datetime, לתצוגת "נראה לאחרונה" ב‑UI.
2. **`sale`** מקבל:
   - `externalId` — string, מזהה ההזמנה במערכת החיצונית (אידמפוטנטיות).
   - `source` — enumeration `["ui","api"]` (ברירת מחדל `ui`) — כדי שאפשר
     יהיה להציג "דווח אוטומטית" במוח ולסנן.
3. פריסה ⇒ `npm run types:update` ב‑`1.0`.

## Phase 1 — צד שרת ב‑`1.0`

### 1a. הרחבת `src/lib/server/apiKeys.ts`

- `verifyApiKey` יחזיר גם `project { id }`, `scopes`, `revoked`,
  `allowed_origins` (הרחבת שאילתת ה‑GraphQL הקיימת; ה‑cache נשאר).
- מפתח `revoked` ⇒ `null`.
- פונקציית עזר `assertScope(key, 'sales:report')`.
- פורמט המפתח הגולמי לא משתנה (`1lev1_{uid36}_{rand}`) — ה‑scoping נקבע
  לפי הרשומה ב‑Strapi, לא לפי הפורמט.

### 1b. הרחבת `POST /api/api-keys`

- מקבל אופציונלית `projectId`. כשנשלח:
  - ולידציה שהמשתמש חבר בריקמה (qid `saleClaimProjectInfo` הקיים מספיק —
    בודקים ש‑`userId ∈ user_1s`).
  - יצירה עם `project: projectId`, `scopes: ["sales:report"]`,
    `name: "sales-api"` (מפתח אחד פעיל לריקמה+משתמש; יצירה חוזרת מחליפה,
    כמו התנהגות ה‑MCP הקיימת).
- `GET` יקבל `?projectId=` לרשימת מפתחות הריקמה (לתצוגה בפאנל).

### 1c. Endpoint חדש: `POST /api/v1/sales`

`src/routes/api/v1/sales/+server.ts`, לפי תבנית `v1/actions`:

**בקשה**

```json
{
  "productId": "123",
  "holderUserId": "45",
  "amount": 250,
  "quantity": 1,
  "saleDate": "2026-07-13T09:30:00Z",
  "startDate": null,
  "finishDate": null,
  "externalId": "order_8811",
  "note": "shop.example.com"
}
```

| שדה | חובה | ברירת מחדל | ממופה אל |
|---|---|---|---|
| `productId` | ✔ | — | `Sale.matanot` |
| `holderUserId` | ✔ | — | `Sale.users_permissions_user` |
| `amount` | ✔ (>0) | — | `Sale.in` |
| `quantity` | ✖ | `1` | `Sale.unit` |
| `saleDate` | ✖ | `now` | `Sale.date` |
| `startDate` / `finishDate` | ✖ | — | מנויים; `Sale.startDate/finishDate` |
| `externalId` | מומלץ מאוד | — | `Sale.externalId` (אידמפוטנטיות) |
| `note` | ✖ | — | `Sale.note` |

`projectId` **לא** מתקבל מהלקוח — הוא נגזר מהמפתח. זה מה שהופך את המפתח
ל"מוגדר רק לריקמה הזו".

**זרימה**

1. `Bearer` → `verifyApiKey` → בדיקת `revoked`, `scope='sales:report'`,
   קיום `project` על המפתח. כישלון ⇒ `401/403`.
2. אם למפתח יש `allowed_origins` ומגיע header `Origin` — לאמת התאמה ⇒ `403`.
3. ולידציית גוף (טיפוסים, `amount>0`, `quantity>0`, תאריכים ISO). ⇒ `400`.
4. שליפת המוצר (qid חדש `salesApiProductInfo`): וידוא
   `productId ∈ project.matanotofs`, קריאת `quant`, `kindOf` — נחוצים ל‑
   `availableQuantity`/`kindOf` של `createSale`. מוצר זר ⇒ `404`.
5. אידמפוטנטיות: qid חדש `saleByExternalId` (filters: project + externalId).
   קיים ⇒ `200 {duplicated:true, saleId}` — לא נוצרת מכירה שנייה.
   (סליקות שולחות retry — זה קריטי, לא nice-to-have.)
6. `actionService.executeAction('createSale', params, context)` עם
   `context.userId = בעל המפתח`, `jwt = ADMINMONTHER` (כמו `v1/actions`).
   `authRules` של `createSale` (projectMember) ממשיכים לרוץ ומגנים עלינו.
7. תשובה `201`:

```json
{ "success": true, "saleId": "987", "holderStatus": "self", "duplicated": false }
```

`holderStatus:'open'` בתשובה מסמן למערכת החיצונית שהדיווח ממתין להסכמת
מחזיק־הכסף (שקיפות, לא שגיאה).

**CORS** — `OPTIONS` כמו ב‑`v1/actions` (`Access-Control-Allow-Origin: *`;
ההגנה האמיתית היא המפתח + allowed_origins, לא CORS).

**שינויים נלווים**

- `createSale.ts`: להעביר פנימה `externalId`/`source` אל `createSaleRecord`
  (שדות אופציונליים חדשים ב‑qid). זה כל השינוי בפעולה הקיימת.
- רישום `lastUsedAt` (עדכון אסינכרוני, לא חוסם את התשובה).
- Rate-limit בסיסי בזיכרון per-key (למשל 60 בקשות/דקה) ⇒ `429`.

## Phase 2 — UI בעמוד המוצרים של הריקמה (`1.0`)

קומפוננטה חדשה `src/lib/components/prPr/SalesApiIntegration.svelte`,
נפתחת מכפתור/אקורדיון בעמוד `moach/[projectId]/sales` (ליד `Hamatanot`,
שכבר מקבל `bmiData` = המוצרים ו‑`projectUsers` = החברים — בדיוק הנתונים
שהפאנל צריך). לכתוב לפי `svelte-code-writer` + runes (Svelte 5).

הפאנל, מלמעלה למטה:

1. **מפתח API לריקמה** — מצב קיים (prefix + lastUsedAt + כפתור ביטול) או
   כפתור "צור מפתח". אחרי יצירה ה‑raw מוצג **פעם אחת** עם אזהרה והעתקה
   (אותה התנהגות כמו `userPr/api-keys.svelte`).
2. **בחירת מוצר ומחזיק־כסף** — select מוצרים (`bmiData`) + select חבר
   (`projectUsers`, ברירת מחדל: המשתמש הנוכחי). הבחירה משתילה IDs אמיתיים
   בקוד ובפרומפט.
3. **פיסת הקוד** (טאבים):
   - *Browser* — להדבקה בדף "תודה על הרכישה":

     ```html
     <script>
       // 1lev1 — דיווח מכירה אוטומטי. הריצו אחרי אישור סליקה מוצלח.
       fetch('https://1lev1.com/api/v1/sales', {
         method: 'POST',
         headers: {
           'Content-Type': 'application/json',
           'Authorization': 'Bearer {{API_KEY}}'
         },
         body: JSON.stringify({
           productId: '{{PRODUCT_ID}}',     // המוצר ב-1lev1
           holderUserId: '{{HOLDER_ID}}',   // אצל מי הכסף
           amount: ORDER_TOTAL,             // ← חברו: הסכום ששולם
           quantity: ORDER_QUANTITY,        // ← חברו: כמות (ברירת מחדל 1)
           externalId: ORDER_ID             // ← חברו: מזהה ההזמנה שלכם
         })
       });
     </script>
     ```

   - *Server / Webhook* — אותו payload כ‑curl, עם ההמלצה המפורשת: "עדיף
     לקרוא מהשרת שלכם (webhook של הסליקה) — כך המפתח לא חשוף בדפדפן".
4. **טבלת משתנים** — בדיוק טבלת השדות מ‑Phase 1c, בעברית, עם סימון "חברו
   מהמערכת שלכם" מול "כבר מולא עבורכם".
5. **פרומפט לסוכן AI** — textarea readonly + כפתור העתקה. תבנית (ה‑UI
   משתיל את הערכים האמיתיים):

   > You are integrating my website with 1lev1's sales-reporting API.
   > After every successful checkout/payment, send an HTTPS POST to
   > `https://1lev1.com/api/v1/sales` with header
   > `Authorization: Bearer {{API_KEY}}` and JSON body:
   > `productId` (fixed: `{{PRODUCT_ID}}`), `holderUserId` (fixed:
   > `{{HOLDER_ID}}`), `amount` (the total paid, number), `quantity`
   > (units sold, default 1), `externalId` (my order id — required for
   > retry-safety), and optionally `saleDate` (ISO, defaults to now) and
   > `startDate`/`finishDate` for subscriptions. Fire it server-side if
   > possible (payment webhook); browser-side from the thank-you page is
   > acceptable. A `201` with `{success:true}` means reported; treat a
   > repeated `externalId` returning `duplicated:true` as success. Do not
   > block or fail the customer's checkout if this call fails — log and
   > retry up to 3 times with backoff.

6. i18n — מפתחות חדשים תחת `project.hamatanot.api.*` (he/en/ar, כמו יתר
   העמוד).

## Phase 3 — Hardening ותפעול

- אכיפת `allowed_origins` + UI לעריכתם.
- Rate-limit מתקדם (Redis/upstash) אם הבסיסי לא מספיק.
- תצוגת `source:'api'` במוח (תג "דווח אוטומטית" בשורת מכירה ב‑hamatanot).
- דף תיעוד ציבורי קצר (`/docs/sales-api` או README) לשילוב ידני.
- מוניטורינג: לוג ייעודי `[SalesAPI]` + התראה על שטף דיווחים חריג.

---

## אבטחה — הנקודות שחייבות להיאמר

1. **מפתח בדפדפן הוא מפתח פומבי.** ההטמעה הקלה (snippet בדף תודה) חושפת
   את המפתח לכל מי שצופה במקור. לכן: (א) ההמלצה הראשית ב‑UI היא צד־שרת;
   (ב) ה‑scope של המפתח הוא *דיווח מכירה לריקמה אחת בלבד* — התוקף הגרוע
   ביותר יכול רק לייצר דיווחי־שווא; (ג) דיווח שבו holder ≠ בעל המפתח נעצר
   ממילא מאחורי הסכמת המחזיק (saleClaim); (ד) דיווח holder == בעל המפתח
   מגדיל את "הכסף שאצל" בעל המפתח — כלומר מזיק בעיקר למי שהמפתח שלו דלף,
   תמריץ עצמי לשמור עליו; (ה) `revoked` + יצירת מפתח חדש בלחיצה.
2. **לעולם לא סומכים על `projectId` מהלקוח** — נגזר מהמפתח בלבד.
3. ולידציה שהמוצר שייך לריקמה ושhoder חבר בה — בצד השרת, לא ב‑snippet.
4. `externalId` ייחודי פר ריקמה מונע כפילויות retry של סליקה.
5. ה‑endpoint "טיפש" בכוונה: אין קריאת נתונים, אין מחיקה, אין עדכון —
   POST יחיד, whitelist של פעולה אחת.

## סדר עבודה ותלויות

| שלב | ריפו | תלוי ב־ | הערכה |
|---|---|---|---|
| 0. סכמות | 1.0b | — | קטן (שני schema.json + relations) |
| 1. שרת | 1.0 | 0 פרוס + types:update | בינוני (endpoint חדש ~200 שורות + הרחבות קטנות) |
| 2. UI | 1.0 | 1 | בינוני (קומפוננטה אחת + i18n) |
| 3. Hardening | 1.0 | 1–2 | מצטבר, לא חוסם השקה |

## בדיקות

- **Vitest**: ולידציית payload (טיפוסים/גבולות/תאריכים), מיפוי שדות אל
  פרמטרי `createSale`, לוגיקת אידמפוטנטיות (mock ל‑strapi executor) —
  באותו סגנון של `saleClaimShared.test.ts`.
- **ידני/curl**: מפתח תקין ⇒ 201; מפתח של ריקמה אחרת ⇒ 403/404 על המוצר;
  `externalId` כפול ⇒ duplicated; holder אחר ⇒ נפתחת saleClaim ונשלחת
  התראה למחזיק; מפתח revoked ⇒ 401.

## שאלות פתוחות

1. **מטבע** — `Sale.in` הוא מספר בלי מטבע; מניחים את מטבע המוצר
   (`matanot.currency`). האם לקבל `currency` ולדחות אי־התאמה, או להתעלם?
2. **מכירה בכמות ממוצר מוגבל שנגמר** — `createSale` מפחית מלאי גם למינוס?
   כנראה לדחות ב‑API כש‑`quant < quantity` (המערכת החיצונית היא מקור האמת
   על מה נמכר בפועל — אולי רק אזהרה?). להחליט לפני Phase 1.
3. **כמה מפתחות לריקמה** — אחד פר (ריקמה,משתמש) כמו MCP, או ריבוי מפתחות
   בעלי שם (פר אתר)? המסמך מניח אחד פר משתמש+ריקמה; קל להרחיב.
4. **התראות** — האם לשלוח push לבעל המפתח על כל דיווח API שנקלט (שקיפות),
   או רק סיכום יומי? ברירת מחדל מוצעת: push רגיל כמו דיווח ידני.
