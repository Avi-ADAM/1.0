# PLAN — לידים ברקמה: טבלה מסודרת, מטלה לכל ליד, וחיבור לחנות

> **מצב: תכנית בלבד — אין קוד.** נכתב 2026-11-03 אחרי קריאת הקוד והמסמכים
> (`demo-request`, `createTask`, `/api/v1/r/[rikma]/*`, `webhooks/`, מסך
> `sales/manage`), לא אחרי הנחות.
>
> **נולד מ:** אתר "ועד בית" (`Avi-ADAM/vaad`, רקמה 78) שרוצה להעביר בניינים
> מתעניינים לרקמה — [`vaad/docs/PLAN_LEADS_TO_1LEV1.md`](https://github.com/Avi-ADAM/vaad/blob/main/docs/PLAN_LEADS_TO_1LEV1.md).
> אבל אין כאן שום דבר ספציפי לוועד: כל רקמה עם אתר, דף נחיתה או חנות צריכה את זה.
>
> **משלים:**
> [PLAN_DEMO_SIGNUP](../done/PLAN_DEMO_SIGNUP.md) — **התקדים**: `demo-request` הוא כבר טבלת לידים
> (של הרקמה המרכזית בלבד) עם סטטוס ושתי מטלות לכל ליד.
> [PLAN_EXTERNAL_TASKS_API](../done/PLAN_EXTERNAL_TASKS_API.md) — המטלה שנפתחת לכל ליד.
> [PLAN_SHOP_CUSTOMER_EXPERIENCE](../inprogress/PLAN_SHOP_CUSTOMER_EXPERIENCE.md) — הזמנות,
> S3b (בקשת רכש ל-`quote`), לשונית "לקוחות" (§7.3).
> [PLAN_SALE_CUSTOMER_LINK](../done/PLAN_SALE_CUSTOMER_LINK.md) — לקוח↔מכירה דרך `Sheirut`.
> [PLAN_HEADLESS_PRODUCTS_API](./PLAN_HEADLESS_PRODUCTS_API.md) — הכתובת היא הרקמה, מפתחות, webhooks.
> [UX_COPY_SHOP_SALES](./UX_COPY_SHOP_SALES.md) — נוסח מסך המכירות.

---

## 0. תקציר

**הבעיה.** היום ליד שמגיע לרקמה מבחוץ הוא אחד משניים:
- **מטלה** (Tasks API) — מישהו לוקח אותה ומסמן "בוצע", ואז הליד נעלם. אין
  "חזרנו אליו?", "מה הוא אמר?", "מתי לחזור שוב?", "הפך ללקוח?". אין תמונה של
  כל הלקוחות הפוטנציאליים של הרקמה.
- **`demo-request`** — יש טבלה וסטטוס, אבל רק לרקמה המרכזית, הסטטוס זז רק
  באדמין של Strapi ("Open follow-ups" ב-PLAN_DEMO_SIGNUP), ואין יומן.

**למה זה חשוב לרקמה דווקא.** ברקמה אין מנהל מכירות; הלקוחות העתידיים הם
ההכנסה **המשותפת** של כולם. חבר שמחזיק לידים בוואטסאפ הפרטי שלו מחזיק מידע
שקובע את החלק של כולם. **טבלת לידים שקופה היא תשתית אמון**: כל חבר רואה מי
פנה, מי לקח, מה נעשה ומה קרה — בדיוק כמו שכל חבר רואה כל מכירה וכל חלוקה.

**הפתרון בשורה אחת:** ישות **`lead`** ברמת הרקמה + **יומן פעילות**
(`lead-activity`) + **מטלה (Act) לכל ליד** + **כניסה מה-API ומהחנות** + לשונית
**"לידים"** במסך המכירות המתקדם.

| שאלה | תשובה |
|---|---|
| מטלה או טבלה? | **שתיהן.** הטבלה היא הזיכרון (מי, מה, מתי, מה קרה). המטלה היא העבודה (מי לוקח, התראות, הסכמה, צ'אט פנימי). |
| מה עם החנות? | הליד הוא **שלב לפני ההזמנה**. ליד יכול להיות על מוצר; בקשת רכש ל-`quote` (S3b) היא ליד; ליד שנסגר מקושר להזמנה / למכירה / ל-`Sheirut`. הלשונית "לקוחות" (§7.3, "אחרי") נבנית מעל אותה טבלה. |
| מה עם `demo-request`? | נשאר כמו שהוא בשלב הראשון; ב-L6 עובר להיות `lead` ברקמה המרכזית (`source: demo`). |
| מה משתנה בוועד? | שורה אחת: הוא קורא ל-`POST /leads` במקום ל-`POST /tasks` (§5.4). |

---

## 1. עקרונות (לא לשבור במימוש)

1. **שקיפות מלאה בתוך הרקמה.** כל חבר רקמה רואה כל ליד ואת כל ההיסטוריה שלו.
   אין "ליד פרטי". אין מחיקה של רשומת יומן — רק הוספה (append-only).
2. **אף ליד לא "נדחה".** ברוח "אין לא מוחלט": אין סטטוס `lost`/`rejected`.
   ליד שלא מתקדם עובר ל-**`paused`** ("לא עכשיו") עם סיבה ותאריך חזרה
   אופציונלי. זה גם נכון עסקית — "לא עכשיו" הוא רוב ה"לא" במכירות.
3. **לקחת ליד = לקחת מטלה.** אחריות על ליד נוצרת רק כשחבר לוקח את המטלה
   (או מאשר שיוך — `myIshur`), לעולם לא בשיוך שקט. מי שלקח הוא ה-`owner`.
   שחרור המטלה משחרר את הליד.
4. **כל שינוי עובר דרך action** (עיקרון 8 ב-SHOP §4) — סטטוס, שיוך, רישום
   פעילות, קישור להזמנה. ככה יש יומן, webhooks והרשאות במקום אחד.
5. **פרטי קשר של אדם הם מידע רגיש.** גלויים לחברי הרקמה בלבד
   (`projectMember`). לא ב-API ציבורי, לא ב-webhook, לא ב-SSR של דף ציבורי,
   לא בלוגים. ליד נכנס רק עם הסכמה שנרשמה (`consentText`, `consentAt`).
6. **לא מאבדים ליד.** כמו `/api/demo`: שמירת השורה היא הצעד היחיד שכישלונו
   מכשיל את הבקשה. המטלה, ההתראה וה-webhook הם best-effort עם `warnings`.
7. **לידים של רקמה שייכים לרקמה.** לא עוברים לרקמה אחרת, לא נמכרים, לא
   משמשים להתאמות (match-suggestion) בלי הסכמה נוספת של הפונה.

---

## 2. המודל

### 2.1 מחזור החיים

```
                 ┌──────────── paused ("לא עכשיו", followUpAt?) ◀──┐
                 │                    │ (חוזר)                     │
 new ──▶ contacted ──▶ talking ──▶ offered ──▶ won                │
  │          │            │           │                            │
  └──────────┴────────────┴───────────┴────────────────────────────┘
 + spam (מוסתר מהרשימה, נשמר — לא נמחק)
```

| סטטוס | עברית | מתי | מי מזיז |
|---|---|---|---|
| `new` | חדש | נוצר; אף אחד לא חזר | המערכת |
| `contacted` | חזרנו אליו | רישום פעילות ראשונה מסוג קשר יוצא מזיז אוטומטית | אוטומטי / חבר |
| `talking` | בשיחה | יש עניין, מבררים צורך | חבר |
| `offered` | נשלחה הצעה | יש מחיר על השולחן (קישור ל-`order`/הצעה אופציונלי) | חבר / אוטומטי מהזמנה ב-`sent` |
| `won` | הפך ללקוח | יש `order`/`sale`/`sheirut` מקושר — או סימון ידני עם הערה | חבר / אוטומטי מהזמנה ששולמה |
| `paused` | לא עכשיו | סיבה (`pausedReason`) + `followUpAt` אופציונלי | חבר |
| `spam` | ספאם / כפול | מוסתר; נשמר לביקורת | חבר |

ההחלטות:
- **אין חזרה אחורה אסורה** — חבר יכול להזיז לכל סטטוס; היומן זוכר.
- `followUpAt` שהגיע ⇒ הליד חוזר ל"צריך טיפול" (§4.3), לא משנה סטטוס לבד.

### 2.2 `lead` — קולקציה חדשה (`1.0b`, `src/api/lead/`)

| שדה | טיפוס | הערה |
|---|---|---|
| `project` | relation → project | **חובה**. ה-tenant |
| `name` | string | חובה |
| `email` / `phone` | email / string | לפחות אחד. **רגיש** |
| `organization` | string | חברה / בניין / ארגון ("ועד בית הרצל 12") |
| `city` / `address` | string | אופציונלי |
| `message` | text | מה הפונה כתב. **לא** נכנס ל-manifest התרגום (`fields.js`) |
| `attributes` | json | שדות חופשיים של המקור (`{ apartments: 16, interest: "shared" }`). מוצגים כטבלת מפתח/ערך |
| `status` | enum (§2.1) | ברירת מחדל `new` |
| `pausedReason` | string | |
| `followUpAt` | datetime | "לחזור אליו ב-" |
| `nextAction` | string | "לשלוח הצעה", "להתקשר אחרי החגים" |
| `owner` | relation → user | נגזר מהמטלה (§3), לא נבחר ישירות |
| `act` | relation → act | מטלת המעקב |
| `products` | relation → matanot (many) | במה הוא מתעניין |
| `variant` | relation → product-variant | אופציונלי |
| `orders` | relation → order (many) | הזמנות שנולדו ממנו |
| `sheirut` | relation → sheirut | כשנסגר מול משתמש רשום |
| `customer_user` | relation → user | אם הפונה הוא / נהיה משתמש 1lev1 |
| `estimatedValue` | decimal + `currency` | אופציונלי. לא נכנס לשום חישוב חלוקה |
| `source` | enum `api · form · shop · quote · manual · bot · demo · import` | |
| `sourceKey` | relation → api-key | איזה מפתח / אתר הביא אותו |
| `sourceLabel` / `sourceUrl` | string | "טופס דף הבית של הוועד", הדף שממנו נשלח |
| `utm` | json | `source/medium/campaign` אם נשלחו |
| `externalId` | string | אידמפוטנטיות — ייחודי ב-(project, externalId) |
| `consentText` / `consentAt` | text / datetime | מה הפונה אישר ומתי. **חובה** בכניסה מה-API |
| `lang` | string | שפת הפונה (לתבניות מייל עתידיות) |
| `lastActivityAt` | datetime | נגזר — למיון "הכי מוזנח" |
| `dedupeKey` | string | `hash(normalizedPhone|normalizedEmail)` — לזיהוי פנייה חוזרת (§2.4) |
| `anonymizedAt` | datetime | אחרי "שכח אותי" (§6) |

### 2.3 `lead-activity` — יומן (append-only)

| שדה | טיפוס | הערה |
|---|---|---|
| `lead` | relation | חובה |
| `kind` | enum `note · call · whatsapp · email · meeting · statusChange · assign · release · inbound · linkOrder · system` | |
| `direction` | enum `out · in` | לקשר בלבד |
| `body` | text | מה נאמר / מה סוכם |
| `fromStatus` / `toStatus` | string | ל-`statusChange` |
| `actor` | relation → user | **תמיד** המשתמש המחובר / בעל המפתח. ריק = מערכת |
| `at` | datetime | ברירת מחדל `now`; מותר לרשום שיחה שהייתה קודם (עד 30 יום אחורה) |
| `meetingId` | string | פגישה ב-magik-meetings, אם נפתחה |

**אין update ואין delete** להרשאת Authenticated ולא ב-actions. תיקון = רשומה חדשה.

**למה לא ה-forum של המטלה בלבד?** ה-forum (ל-`Act` יש `forums`) הוא **צ'אט פנימי
בין החברים** על הליד — ונשאר זמין. היומן הוא **מה קרה מול הלקוח**, מובנה
(סוג, כיוון, מעבר סטטוס), כדי שאפשר לסנן ("לידים שלא דיברו איתם 7 ימים") ולספור.
עמוד הליד מציג את שניהם בציר זמן אחד.

### 2.4 פנייה חוזרת וכפילויות

`createLead` מחשב `dedupeKey`. אם יש ליד פתוח (לא `won`/`spam`) ברקמה עם אותו
מפתח ⇒ **לא נוצר ליד חדש**: נרשמת `lead-activity` מסוג `inbound` ("פנה שוב
מ-<sourceLabel>"), `lastActivityAt` מתעדכן, וה-owner (או כל הרקמה אם אין) מקבל
התראה. התשובה ל-API: `200 { duplicated: true, reason: "sameContact" }`.
ליד `won` שפונה שוב ⇒ ליד חדש (פנייה חדשה של לקוח קיים) עם קישור `previousLead`.
מיזוג ידני (`mergeLeads`) — L5.

---

## 3. הליד והמטלה

כל ליד חדש פותח **מטלה אחת** דרך `actionService.executeAction('createTask', …)` —
אותה פונקציה שמשמשת את `/api/demo` ואת Tasks API, כדי שההתראות יהיו זהות:

- `shem`: "ליד: <name> — <organization>" (בלי טלפון/מייל — המטלה מופיעה בכרטיסי לב והתראות)
- `des`: קישור לעמוד הליד במוח, וההודעה מקוצרת
- `link`: `/moach/<pid>/sales/manage/leads/<leadId>`
- `externalId`: `lead:<leadId>` · `source`: `api`
- **שיוך** לפי הגדרת הרקמה (§7.1): תפקיד (`leadRoleIds`), משימה בתהליך
  (`leadMissionId`) — או **לא משויך** ⇒ כל חברי הרקמה מקבלים התראה (כמו `demo-request`).
- `dateF`: עכשיו + `leadResponseHours` (ברירת מחדל 48) — "תחזרו אליו תוך יומיים".

**סנכרון בין המטלה לליד** (בצד השרת, אחרי `updateTask` — אותו hook שמזין את
`webhooks/dispatch.ts`, לפי `externalId` שמתחיל ב-`lead:`):

| במטלה | בליד |
|---|---|
| נלקחה / `myIshur:true` | `owner` = הלוקח; activity `assign` |
| שוחררה | `owner` ריק; activity `release`; התראה לרקמה |
| `naasa:true` (בוצע) | **לא** סוגר את הליד. אם הסטטוס עדיין `new` ⇒ `contacted`. ליד נסגר רק ב-`won`/`paused`/`spam` |

ליד ב-`paused` שה-`followUpAt` שלו הגיע ⇒ נפתחת **מטלת מעקב חדשה** לבעלים
(שיוך שדורש `myIshur`, כמו כל שיוך) או לרקמה אם אין בעלים.

---

## 4. החוויה ברקמה

### 4.1 לשונית "לידים" — `/moach/[projectId]/sales/manage/leads`

לשונית שביעית במסך המתקדם (§7.3 ב-SHOP), לפני "הזמנות" — כי ליד קודם להזמנה.

- **טבלה**: שם · ארגון · מקור · מוצר · סטטוס · אחראי · קשר אחרון ("לפני 3 ימים") · הצעד הבא / לחזור ב-.
- **סינון**: סטטוס, אחראי (כולל "בלי אחראי"), מקור, מוצר, "צריך טיפול" (§4.3), טווח תאריכים.
- **מיון ברירת מחדל**: "צריך טיפול" למעלה, אחר כך `lastActivityAt` הישן ביותר.
- **תצוגת לוח** (kanban לפי סטטוס) — מתג, לא ברירת מחדל.
- **פעולות מהירות בשורה**: "רשום שיחה", "קח" (= לקיחת המטלה), "לא עכשיו".
- **ייצוא CSV** (בלי פרטי קשר כברירת מחדל; עם פרטי קשר — רק בסימון מפורש, ונרשם ביומן `system`).
- "+ ליד ידני" (`source: manual`) — לפנייה שהגיעה בטלפון.

### 4.2 עמוד ליד — `/leads/[leadId]`

- כותרת: שם, ארגון, סטטוס (בורר), אחראי (או כפתור "קח"), "לחזור ב-", הצעד הבא.
- פרטי קשר עם קישורי `tel:` / `wa.me` / `mailto:` — לחיצה מציעה "לרשום את השיחה?".
- `attributes` כטבלה; המוצרים שהוא מתעניין בהם; הזמנות/מכירות מקושרות.
- **ציר זמן**: היומן + הודעות ה-forum של המטלה, ממוזגים לפי זמן, מסומנים שונה
  ("מול הלקוח" / "בין החברים").
- "צור הזמנה / הצעה" ⇒ טופס הזמנה ידנית עם פרטי הקונה ממולאים מראש (§5.5).
- "הפך ללקוח" ⇒ דורש קישור (הזמנה / מכירה / משתמש) או הערה.

### 4.3 "צריך טיפול" — הכלל אחד, משמש בכל מקום

ליד צריך טיפול אם: `new` ועברו `leadResponseHours`; **או** `followUpAt` עבר;
**או** פתוח (לא `won`/`paused`/`spam`) ואין פעילות `leadStaleDays` (ברירת מחדל 7).
פונקציה טהורה `needsAttention(lead, now, settings)` ב-`src/lib/leads/` — **המקור
היחיד** (הטבלה, הפס בשכבה הפשוטה, הסיכום היומי).

### 4.4 איפה עוד זה מופיע

- **השכבה הפשוטה** (`/moach/<pid>/sales`): פס "3 לידים מחכים לתשובה →", כמו הפס של הזמנות שממתינות.
- **לב**: המטלה עצמה היא הכרטיס (אין כרטיס לב חדש ב-MVP — כמו ההחלטה ב-UX_COPY_SHOP_SALES).
- **סיכום יומי** (PLAN_DAILY_DIGEST): "2 לידים חדשים, 1 שצריך לחזור אליו היום".
- **כלי MCP** (L5): `listRikmaLeadsTool`, `getLeadTool`, `logLeadActivityTool` — הסוכן
  מכין, החבר מאשר; הסוכן לא משנה סטטוס ל-`won` בעצמו.

---

## 5. כניסות

### 5.1 `POST /api/v1/r/{rikma}/leads` — מהשרת של אתר

אותה מכונה כמו `tasks`/`orders`: Bearer → `verifyApiKeyDetailed` → `assertTenant`
→ scope `leads:create` → rate-limit → ולידציה → אידמפוטנטיות → `executeAction('createLead')`.

```json
{
  "name": "דנה כהן",
  "phone": "050-0000000",
  "email": "dana@example.com",
  "organization": "בניין הרצל 12, חיפה",
  "city": "חיפה",
  "message": "16 דירות, אין ועד פעיל",
  "attributes": { "apartments": 16, "interest": "shared", "role": "resident" },
  "productId": "123",
  "externalId": "lead_6f1c…",
  "sourceLabel": "טופס דף הבית",
  "sourceUrl": "https://vaad.example/",
  "utm": { "source": "facebook", "campaign": "haifa-nov" },
  "consent": { "text": "אני מסכים/ה שהפרטים יועברו…", "at": "2026-11-03T10:00:00Z" },
  "lang": "he"
}
```

תשובה `201`:
```json
{ "success": true, "duplicated": false, "leadId": "77", "externalId": "lead_6f1c…",
  "status": "new", "taskId": "902", "warnings": [] }
```

ולידציות: `name` + (`email`|`phone`) + `consent` — חובה (`400 CONSENT_REQUIRED`).
`productId` חייב להיות מוצר של הרקמה (`404`). `attributes` עד 4KB, עד 30 מפתחות,
ערכים פרימיטיביים בלבד. `message` עד 4,000 תווים.

### 5.2 מפתח ציבורי — לאתר סטטי בלי שרת

scope **`leads:create:public`**: חייב `allowed_origins`, rate-limit לפי IP (10/שעה),
honeypot (`website` מלא ⇒ `201` מזויף), ואופציונלית Turnstile. **לא** נותן קריאה
כלשהי. ליד ממקור כזה מסומן `source: form` ומוצג עם תווית "מטופס פתוח".
(אותו היגיון כמו `checkout:create` ב-SHOP §3.5.)

### 5.3 `GET /api/v1/r/{rikma}/leads/{externalId}` — סטטוס בלבד

scope `leads:read`. מחזיר `{ leadId, externalId, status, hasOwner, lastActivityAt, wonAt }`
— **בלי** פרטי קשר, בלי יומן, בלי שם האחראי. מספיק לאתר כדי להראות "פנו אליכם".

### 5.4 Tasks API — לא משתנה

`POST /tasks` נשאר כמו שהוא למי שרוצה רק מטלה. **הוועד עובר ל-`/leads`**: שינוי
של ה-URL וה-payload ב-`vaad/src/lib/server/onelevone.ts`, וה-scope במפתח.

### 5.5 מהחנות

| מקור | מה קורה |
|---|---|
| **"שאלה על המוצר" / "בקשו הצעה"** בעמוד מוצר (בחנות של 1lev1 ובתבנית `1lev1-shop-starter`) | `createLead` עם `productId`, `source: shop` |
| **בקשת רכש ל-`quote` (S3b)** | נוצרים **ליד ב-`offered` + הזמנה ב-`sent`**, מקושרים. הצ'אט והמחיר נשארים ב-`Sheirutpend` כמתוכנן; הליד הוא מה שחברי הרקמה רואים ברשימה. **S3b רוכב על זה** — לא צריך "רשימת בקשות" נפרדת |
| **הזמנה ששולמה** (`createPaidOrder`) מקונה עם `dedupeKey` שתואם ליד פתוח | הליד ⇒ `won`, `orders += order`, activity `linkOrder`. אין התאמה ⇒ **לא** נוצר ליד (קונה ישיר הוא לקוח, לא ליד) |
| **הזמנה ידנית מעמוד ליד** | ההזמנה נוצרת עם `leadId` ⇒ `offered`; כשתשולם ⇒ `won` |
| **מכירה עם לקוח רשום** (`createSale` + customer) מעמוד ליד | `sheirut` + `customer_user` נקשרים, ⇒ `won` |

**"לקוחות"** (הלשונית שסומנה "אחרי" ב-SHOP §7.3) = לידים ב-`won` + קונים
מהזמנות, מקובצים לפי `dedupeKey`. אותה טבלה, תצוגה אחרת — לא ישות שלישית.

### 5.6 ידני ובוט

"+ ליד ידני" במסך; כלי בוט עתידי (`createLeadTool`) רק לחבר רקמה על הרקמה שלו.

---

## 6. פרטיות ושמירה

- **מי רואה**: `projectMember` בלבד. qids חדשים (`leadsList`, `leadGet`,
  `leadActivities`) מסומנים ב-`qidsAccess.js` כ-`conditional` עם guard חברות;
  פרטי קשר לא יוצאים ב-API ציבורי, ב-webhook או ב-`GET /leads/{externalId}`.
- **"שכח אותי"** — action `anonymizeLead`: מוחק `name/email/phone/address/message/attributes`,
  משאיר סטטוס, מקור, תאריכים וקישורים (שהמספרים של הרקמה יישארו נכונים),
  רושם `system` ביומן. כל חבר יכול להפעיל — זו בקשה של אדם, לא החלטה של הרקמה.
- **שמירה**: ליד ב-`paused`/`spam` בלי פעילות 18 חודשים ⇒ אנונימיזציה אוטומטית
  ב-cron (`leadRetentionMonths` — הגדרה ברקמה). `won` נשמר כל עוד יש מכירה מקושרת.
- **עזיבת רקמה**: חבר שעזב מאבד גישה מיד (חברות נבדקת בכל בקשה); הלידים שהיו
  שלו חוזרים ל"בלי אחראי" עם התראה לרקמה.
- **לוגים וטלגרם**: בלי פרטי קשר. ההתראה לטלגרם (אם מוגדרת) — שם + מקור בלבד.
- `message` ו-`attributes` הם טקסט של הפונה ⇒ escape בכל מקום שמוצג (HTML, מייל, טלגרם).

---

## 7. הגדרות, הרשאות ו-webhooks

### 7.1 הגדרות רקמה (`Project.leadSettings` — json, null = ברירות מחדל)

`leadRoleIds`, `leadMissionId`, `leadResponseHours` (48), `leadStaleDays` (7),
`leadRetentionMonths` (18), `notifyTelegram` (false). עורך פשוט בלשונית "לידים" ⇒
"הגדרות". שינוי ההגדרות הוא החלטה של חבר יחיד (תפעולי, לא כסף ולא אקוויטי);
אם יתברר שצריך — `editObject` כמו כל עריכה.

### 7.2 actions (`src/lib/server/actions/configs/`)

| action | access | authRules | מה |
|---|---|---|---|
| `createLead` | `user · apiKey · serviceAdmin` | `projectMember` (user) / tenant של המפתח | §5; כולל dedupe, פתיחת מטלה, webhook |
| `updateLeadStatus` | `user` | `projectMember` | + activity `statusChange` |
| `logLeadActivity` | `user` | `projectMember` | + `lastActivityAt`, `new ⇒ contacted` |
| `updateLeadDetails` | `user` | `projectMember` | שדות קשר/ארגון/`followUpAt`/`nextAction`; כל שינוי נרשם ביומן (מה השתנה, בלי הערך הרגיש) |
| `linkLeadTo` | `user` | `projectMember` | order / sale / sheirut / user / product |
| `anonymizeLead` | `user` | `projectMember` | §6 |
| `mergeLeads` | `user` | `projectMember` | L5 |
| `saveLeadSettings` | `user` | `projectMember` | §7.1 |

הסנכרון מטלה↔ליד (§3) — לא action חדש: hook אחרי `updateTask` עבור `externalId` שמתחיל ב-`lead:`.

### 7.3 scopes (`GRANTABLE_SCOPES` + צ'קבוקסים ב-`RikmaApiPanel.svelte`)

`leads:create` (שרת) · `leads:create:public` (דפדפן, מחייב `allowed_origins`) · `leads:read` (סטטוס בלבד).

### 7.4 webhooks (על `api-key.webhook_events` הקיים)

`lead.created` · `lead.statusChanged` (`data.status`) · `lead.won`. גוף: `leadId`,
`externalId`, `status`, `at` — **בלי** פרטי קשר ובלי שם האחראי. יורים רק מ-actions
(`WEBHOOK_ACTIONS`), חתימה `X-1lev1-Signature` כמו היום.

### 7.5 Strapi (`1.0b`) — מסמך משלים נדרש

`lead`, `lead-activity`, `Project.leadSettings`, ו-`leads` (relation הפוך) על
`order`. הרשאות Authenticated: `lead` find/findOne/create/update,
`lead-activity` find/findOne/create (**בלי update/delete**). אחרי פריסה: `npm run types:update`
ו-`npm run validate:qids`.

### 7.6 i18n

namespace חדש `leads` ב-`ROUTED` רק לנתיבי `sales/*` (כמו `shop`). נוסח הסטטוסים
לפי "מה נשאר לעשות" (כמו UX_COPY_SHOP_SALES): "מחכה שיחזרו אליו", "בשיחה",
"הצעה אצלו", "לקוח", "לא עכשיו — לחזור ב-<date>". חמש השפות. `npm run check:i18n`.

---

## 8. פאזות

| # | מה | תלוי ב- | אומדן |
|---|---|---|---|
| L0 | סכמה ב-1.0b (`lead`, `lead-activity`, `leadSettings`) + הרשאות + types | — | יום |
| L1 | `src/lib/leads/` טהור (`validateLeadPayload`, `dedupeKey`, `needsAttention`, מעברי סטטוס) + vitest; actions `createLead` / `logLeadActivity` / `updateLeadStatus` + סנכרון מטלה | L0 | 2–3 ימים |
| L2 | `POST /leads` + `GET /leads/{externalId}` + scopes + webhooks + OpenAPI (`rikma-v1.openapi.yaml`) | L1 | 1–2 ימים |
| L3 | לשונית "לידים" + עמוד ליד + פס בשכבה הפשוטה + i18n | L1 | 3–4 ימים |
| **→ הוועד עובר ל-`/leads`** | | L2 | שעה בצד `vaad` |
| L4 | חנות: "בקשו הצעה" בעמוד מוצר ובתבנית, קישור הזמנה↔ליד, `won` אוטומטי | L2, S3 | 2 ימים |
| L5 | `leads:create:public`, מיזוג, ייצוא CSV, MCP tools, סיכום יומי, תצוגת לוח | L3 | 3 ימים |
| L6 | `demo-request` ⇒ `lead` ברקמה המרכזית (`source: demo`), `/api/demo` כותב ל-`createLead`; לשונית "לקוחות" | L3 | 2 ימים |
| L7 | S3b (בקשת רכש ל-`quote`) נבנה מעל הליד | L4 | לפי SHOP |

**בדיקות**: vitest לפונקציות הטהורות ול-endpoint (תבנית `server.test.ts` של `orders`);
תרחישים: מפתח של רקמה A על רקמה B ⇒ 403; בלי הסכמה ⇒ 400; אותו `externalId` ⇒
`duplicated`; אותו טלפון ⇒ `inbound` ולא ליד חדש; webhook בלי פרטי קשר; חבר
שאינו ברקמה לא קורא ליד ב-qid ישיר; `lead-activity` לא ניתן לעדכון; לקיחה ושחרור
של המטלה מעדכנים `owner`.

---

## 9. סיכונים

1. **ספאם דרך `leads:create:public`** — כל ליד מזמזם לכל הרקמה. מיתון: rate-limit,
   honeypot, Turnstile, ו"ספאם" בלחיצה; ממקור ציבורי — התראה מקובצת (פעם בשעה) ולא אחת לכל ליד.
2. **רעש התראות** — ליד לא משויך מתריע לכל הרקמה (כמו `demo-request`). זה בכוונה
   בהתחלה; ברקמה גדולה — `leadRoleIds`.
3. **ליד "תפוס" ומוזנח** — מישהו לקח ולא חזר. `needsAttention` מציף אותו לכולם;
   הצעה עתידית: אחרי `leadStaleDays` × 2 — הצעת שחרור (כמו dormancy במשימות,
   PLAN_OBJECT_ARCHIVAL: הצעה, שתיקה משלימה, לבעלים יש restime להגיב).
4. **פרטים אישיים אצל צד שלישי** — הפונה הסכים לרקמה, לא ל-1lev1 כפלטפורמה.
   הנוסח שהאתר מציג חייב להזכיר את 1lev1; `consentText` נשמר כדי שאפשר יהיה להראות מה נאמר לו.
5. **`attributes` כ-JSON חופשי** — נוח לכל אתר, אבל אין סינון לפיו ב-MVP. אם רקמה
   צריכה לסנן ("בניינים עם 20+ דירות") — שדות מוגדרים לרקמה הם תכנית נפרדת.

## 10. מה במכוון **לא**

- **לא CRM מלא**: בלי ניקוד לידים אוטומטי, בלי שיווק במייל / רצפי מיילים, בלי
  pipelines מרובים, בלי תחזית הכנסות. `estimatedValue` לתצוגה בלבד.
- **לא "lost"** (עיקרון 2).
- **לא לידים חוצי-רקמות** ולא מכירת לידים.
- **לא הסכמת הרקמה על כל ליד** — טיפול בליד הוא עבודה תפעולית; ההסכמה נכנסת
  כשנוצרת התחייבות (הזמנה, מחיר במוצר, משימה בעלת אקוויטי) — במסלולים הקיימים.

## 11. שאלות פתוחות

1. `leadResponseHours` ברירת מחדל — 48 שעות סביר לכל הרקמות?
2. האם עבודה על לידים צריכה להיספר כאקוויטי כברירת מחדל (משימה בתהליך "לידים"
   שנוצרת עם ההגדרה), או להשאיר לרקמה להחליט?
3. האם `won` דורש **תמיד** קישור למכירה/הזמנה (אמון — אי אפשר "לנפח" הצלחות), או שמותר עם הערה בלבד?
4. ייצוא CSV עם פרטי קשר — לכל חבר, או רק אחרי אישור חבר נוסף?
