# PLAN — לידים ברקמה: טבלה מסודרת, מטלה לכל ליד, וחיבור לחנות

> **מצב (2026-11-04): L0 בנוי ב-`1.0b` (ענף `shabab`), ממתין ל-deploy + הרשאות (§7.5).
> L1 ו-L2 בנויים ב-1.0main (§8.1, §8.2) — לא ירוצו מול Strapi עד ש-L0 נפרס** (`/leads` עונה
> `503 LEADS_NOT_READY` עד אז). L3a ואילך — עוד לא בקוד.
>
> נכתב 2026-11-03 אחרי קריאת הקוד והמסמכים
> (`demo-request`, `createTask`, `/api/v1/r/[rikma]/*`, `webhooks/`, מסך
> `sales/manage`), לא אחרי הנחות.
>
> **נבדק מול ה-repo ב-2026-11-03 (אחרי `3f2e6daf`).** מה שהתאים: `Act` כבר נושא
> `externalId`/`link`/`forums`; `Order` קיים עם `buyerEmail`/`buyerPhone`/`acts` ו-status
> `sent`; `createTask` מקבל `externalId`+`source`; `ActionService` מריץ את
> `webhooks/dispatch.ts` אחרי כל action (שם נכנס הסנכרון מטלה↔ליד); `GRANTABLE_SCOPES`
> ב-`api/api-keys/+server.ts`; `/api/v1/r/[rikma]/` עם `tasks`/`orders`/`server.test.ts`;
> namespace `shop` כבר מוגבל לנתיבי `sales/*`. אין `lead` בסכמה — L0 עדיין נדרש.
> מה שתוקן: למסך המתקדם יש **שמונה** לשוניות, לא שש; webhooks של הזמנות לא
> עוברים דרך `WEBHOOK_ACTIONS` אלא דרך מיפוי משלהם (`orderEvents.ts`) — לידים
> ילכו באותה דרך (§7.4); והמסך כולו (KPI, לשונית ברירת מחדל, טעינת הזמנות)
> מניח שהמכירה מתחילה בתשלום. מכאן **§4.0**: ליד הוא השלב הראשון של אותה מכירה.
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
> [PLAN_HEADLESS_PRODUCTS_API](../tbd/PLAN_HEADLESS_PRODUCTS_API.md) — הכתובת היא הרקמה, מפתחות, webhooks.
> [UX_COPY_SHOP_SALES](../tbd/UX_COPY_SHOP_SALES.md) — נוסח מסך המכירות.

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
| ליד או מכירה? | **אותו דבר בשלבים שונים.** ליד ⇒ הצעה (הזמנה) ⇒ תשלום (מכירה) ⇒ ביצוע. מרכז המכירות מסודר לפי המסלול, ולשונית "בתהליך" מרכזת כל מה שלפני תשלום (§4.0). אין "רקמת לידים" נפרדת. |
| ומשאלות הקונסיירז'? | "משאלות נכנסות" (`RatsonProposal`) הן לידים פנימיים שכבר קיימים — מוצגות ב"בתהליך" כשורות משלהן, בלי להעתיק אותן ל-`lead`. "פתוח לשותפים" הוא הכיוון ההפוך (מה שהרקמה מחפשת) ולא נכנס (§4.0). |

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
| `offered` | הצעה אצלו | יש הזמנה מקושרת ב-`sent…pendingPayment` | **רק אוטומטי** (§4.0) |
| `won` | לקוח | יש הזמנה ששולמה או `sale` מקושרת | **רק אוטומטי** (§4.0) |
| `paused` | לא עכשיו | סיבה (`pausedReason`) + `followUpAt` אופציונלי | חבר |
| `spam` | ספאם / כפול | מוסתר; נשמר לביקורת | חבר |

ההחלטות:
- **אין חזרה אחורה אסורה** בין הסטטוסים שנקבעים ביד (`new/contacted/talking/paused/spam`); היומן זוכר. `offered`/`won` נגזרים מההזמנה/המכירה ולא נבחרים מטופס.
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
| `details` | json | שדות חופשיים של המקור (`{ apartments: 16, interest: "shared" }`). מוצגים כטבלת מפתח/ערך. **לא** `attributes` — ב-GraphQL של Strapi 4 זה כבר שם העטיפה של כל ישות (`data { attributes { … } }`) |
| `status` | enum (§2.1) | ברירת מחדל `new` |
| `pausedReason` | enum `timing · budget · noAnswer · choseOther · notFit · other` | + `pausedNote` (text). כמו "Lost reason" בכלים המקצועיים — כדי לספור למה פניות נעצרות (§4.0) |
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
- `dateF`: עכשיו + `leadResponseHours` (ברירת מחדל 24, §4.0) — "תחזרו אליו עד מחר".

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

### 4.0 ליד הוא תחילתה של מכירה — מסלול אחד, לא מצב נפרד

**העיקרון.** אין "רקמת לידים" ו"רקמת מכירות". יש **עסקה אחת** שעוברת שלבים:
מישהו השאיר פרטים (ליד) ⇒ דיברו איתו ⇒ קיבל הצעה (הזמנה) ⇒ שילם (מכירה) ⇒
קיבל (ביצוע) ⇒ הכסף נחלק. רקמה שמוכרת שירותים פשוט עוברת מ"בשיחה" ישר ל"דיווח
מכירה"; חנות שמקבלת רק קניות ישירות מתחילה מ"שולם". **אותו מסלול, נקודות כניסה
שונות** — בלי הגדרת מצב, בלי מתגים.

**בדיקה מול הכלים המקצועיים** (2026-11):

| | איך זה עובד שם | מה זה אומר כאן |
|---|---|---|
| **Salesforce** | `Lead` הוא רשומה לפני-עסקה; "Convert" יוצר Account + Contact + **Opportunity** (ברירת מחדל), והסטטוס חייב להיות סטטוס שסומן "converted". אחרי Closed Won נוצר `Order` לביצוע | שלושת השלבים כבר קיימים אצלנו: `lead` ⇒ `order` ב-`sent…accepted` (= Opportunity/Quote) ⇒ `order` ב-`paid…fulfilled` + `sale` (= Order + Closed Won) |
| **HubSpot** | אדם אחד עם **Lifecycle stage** (Lead ⇒ SQL ⇒ Opportunity ⇒ Customer). משויך ל-Deal ⇒ עולה ל-Opportunity **אוטומטית**; Deal ב-Won ⇒ Customer **אוטומטית**; רק קדימה | `offered`/`won` **נגזרים** מההזמנה/המכירה המקושרת — לא נבחרים ביד |
| **Pipedrive** | Leads Inbox ⇒ "Convert to deal" — אנשים, הערות וקבצים עוברים איתו. **Rotting**: עסקה שלא נגעו בה X ימים (לפי שלב) נצבעת אדום; כל פעילות מאפסת | `needsAttention` (§4.3) הוא בדיוק rotting; ציר הזמן ממשיך מהליד להזמנה בלי העתקה |
| **מחקר** (HBR 2011, "The Short Life of Online Sales Leads") | מי שחזר תוך שעה — פי ~7 סיכוי לשיחה משמעותית; כמעט חצי מהחברות לקחו יותר מיממה או לא חזרו | ברירת המחדל `leadResponseHours` יורדת מ-48 ל-**24**, והטבלה מציגה "מחכה כבר 3 שעות" בולט |

מקורות: [Salesforce LeadConvert](https://developer.salesforce.com/docs/atlas.en-us.apexref.meta/apexref/apex_dml_convertLead.htm) · [Pipedrive Leads Inbox](https://support.pipedrive.com/article/leads-inbox) · [Pipedrive Rotting](https://support.pipedrive.com/article/the-rotting-feature) · [HubSpot lifecycle/deal sync (AMA בקהילת HubSpot)](https://community.hubspot.com/t/ama-demystifying-hubspots-lifecyle-stages-deal-stages-and-lead-status/45781) · [HBR 2011](https://hbr.org/2011/03/the-short-life-of-online-sales-leads) (נתוני HBR מצוטטים ממקורות משניים).

מה **לא** לוקחים מהם: ניקוד לידים, MQL/SQL, pipelines מרובים, תחזיות (§10).
מה **כן** משותף לכולם ונוסף כאן: **סיבת עצירה מרשימה קצרה** (ב-Salesforce/Pipedrive
זו "Lost reason") — אצלנו `pausedReason` הוא enum (`timing · budget · noAnswer ·
choseOther · notFit · other`) + טקסט חופשי, כדי שהרקמה תוכל לראות *למה* פניות נעצרות.
עדיין "לא עכשיו", לא "אבוד" (עיקרון 2).

#### השלבים — סטטוס אחד לאורך כל המסלול

`stageOf(lead, orders, sales)` — פונקציה טהורה ב-`src/lib/leads/stage.ts`, **המקור
היחיד** לשלב של עסקה (טבלה, לוח, KPI, API):

| שלב | מאיפה הוא בא | מה רואים |
|---|---|---|
| `new` · `contacted` · `talking` | `lead.status`, נקבע ביד / ברישום פעילות | "מחכה שיחזרו אליו" / "חזרנו" / "בשיחה" |
| `offered` | **נגזר**: הזמנה מקושרת ב-`sent · seen · priced · accepted · pendingPayment` | "הצעה אצלו" (+ מספר ההזמנה) |
| `won` | **נגזר**: הזמנה מקושרת ב-`paid · shipped · fulfilled`, **או** `sale` מקושרת | "לקוח" — ומכאן הוא בהזמנות/במכירות |
| `paused` · `spam` | `lead.status`, ביד | "לא עכשיו — לחזור ב-…" |

- `offered`/`won` **נכתבים ל-`lead.status` רק על ידי הסנכרון** (אחרי `createPaidOrder`,
  `orderLifecycle`, `createSale` עם `leadId`) — כדי שאפשר לסנן ב-Strapi — ולעולם לא מטופס.
  ככה אי אפשר "לנפח" הצלחות (שאלה פתוחה 3 נסגרת: `won` = יש כסף מקושר).
- הזמנה שבוטלה (`cancelled`) ⇒ הליד חוזר ל-`talking` עם רשומת `system` ביומן.
- כל המעברים נרשמים ביומן כ-`statusChange` עם `actor` ריק (מערכת) כשהם נגזרים.

#### "הפך ללקוח" = הצעד הבא במסלול, לא כפתור סטטוס

מעמוד הליד יש **פעולה אחת קדימה**, לפי מה שיש לרקמה:
- **"שלח הצעה"** ⇒ הזמנה ב-`sent` עם פרטי הקונה ממולאים מהליד (כמו "Convert to deal")
  ⇒ `offered`. זה גם מה ש-S3b (`quote`) נבנה עליו.
- **"דווח מכירה"** ⇒ טופס דיווח המכירה הרגיל (`hamatanot` / `createSale`) עם `leadId` ⇒ `won`.
  זה המסלול של רקמה שמוכרת שירות ולא מנהלת הזמנות.
- הליד **נשאר ראש השרשרת**: ציר הזמן שלו ממשיך (הזמנה נוצרה · שולם · נשלח), ועמוד
  ההזמנה מראה "נולד מפנייה של <name> →". שום דבר לא מועתק ושום דבר לא נמחק.

#### מרכז המכירות קורא את המסלול משמאל לימין

היום ל-`/sales/manage` יש 8 לשוניות והוא נפתח על "הזמנות". הלשוניות מסתדרות לפי
המסלול — **לפני מכירה · ביצוע · כסף · מוצרים · חיבורים**:

| לשונית | מה בה | שינוי |
|---|---|---|
| **בתהליך** (`/sales/manage/pipeline`) — **חדשה, ראשונה** | כל עסקה פתוחה **לפני תשלום**: לידים ב-`new/contacted/talking` + הזמנות ב-`sent…pendingPayment`, בטבלה אחת או בלוח לפי שלב | §4.1 |
| **הזמנות** | מה ששולם ומחכה לביצוע (`paid/shipped`) — בדיוק כמו היום | `pendingPayment` עובר לראות גם ב"בתהליך" (נשאר גם כאן, הוא כסף שמחכה) |
| מלאי · משלוחים · ביצוע · מבצעים · מוצרים | כמו היום | מוצגות כשהן רלוונטיות — ראו למטה |
| **מכירות** | כמו היום | שורה של מכירה שנולדה מליד מראה את המקור |
| **חיבורים** | + scopes של לידים במפתחות | |

- **`/sales/manage` נשאר כתובת הכניסה** ונפתח על הלשונית הראשונה שיש בה משהו
  שמחכה: הזמנה ששולמה ומחכה למשלוח ⇒ "הזמנות"; אחרת ⇒ "בתהליך". קישורים ישירים
  (פס ההזמנות, מיילים, KPI) עוברים ל-`/sales/manage/orders` המפורש.
- **לשוניות לפי מה שיש, לא לפי מצב**: "מלאי" כשיש מוצר שסופר מלאי, "משלוחים"
  כשיש מוצר שנשלח (`deliveryOptions`) או הגדרת משלוח, "ביצוע" כשיש שלבי ביצוע,
  "מבצעים" כשיש מוצר. רקמת שירות רואה: **בתהליך · מכירות · מוצרים · חיבורים**. ברגע
  שהיא מוסיפה מוצר שנשלח — הלשוניות מופיעות. אין הגדרה לשכוח לשנות.
- **פס ה-KPI** קורא את אותו מסלול: *צריכים טיפול* (עסקאות פתוחות לפי §4.3) ·
  *מחכות למשלוח* (היום) · *החודש* (היום) · *ממתין לחלוקה* (היום). "חסר במלאי" נשאר
  כ-badge על "מלאי" וכפס בשכבה הפשוטה (כמו היום) — לא נעלם, רק לא תופס כרטיס ברקמה בלי מלאי.
- **השכבה הפשוטה** (`/sales`): `SalesShortcuts` מראה פס אחד לכל דבר שמחכה — הזמנות
  לשלוח (היום) ואז "3 פניות מחכות לתשובה →" — והכרטיס "ניהול מכירות" נשאר כמו שהוא.
  שם המסך והניווט נשארים "מכירות": ליד הוא חלק ממכירות.

#### טאב "הזדמנויות" במוח — מה מצטרף למסלול ומה לא

בקבוצה `opps` (`moach/[pid]/+layout.svelte`) יש ארבע לשוניות. נבדקו מול הקוד:

| לשונית | מה היא באמת | ביחס ללידים |
|---|---|---|
| **משאלות נכנסות** (`/wishes`, qid `107listRatsonsForProject`) | `RatsonProposal` שבהן הרקמה **מועמדת לספק** משאלה מהקונסיירז' (`suggested · viewed · accepted · rejected · expired`), עם משא ומתן (`ratson_willingness_entry`, `negos`), שעון שתיקה (`timegrama`), צ'אט (`forum`) ודיל שמשולם לרקמה. הסיור של המוח כבר קורא להן "**לידים חמים** מלקוחות הקונסיירז'" | **כן — זה ליד.** מקור לידים פנימי שכבר קיים, עם מנגנון הסכמה משלו |
| **פתוח לשותפים** (`/open`, `OpenBoard`) | המשימות והמשאבים **שהרקמה עצמה מחפשת** (`open_missions`, `open_mashaabims`, `pendms`, `pmashes`) — הכיוון ההפוך: הרקמה כקונה/מגייסת, לא כמוכרת | **לא.** לא נכנס למסלול המכירה. קישור אחד בלבד: עסקה שנסגרה ופתחה משימות (חלקי דיל, C-19) מראה אותן בעמוד שלה |
| **מפת ביקוש** (`/demand`) | משאלות ציבוריות ומאגדים קרובים שהרקמה יכולה להציע עליהם | **מקור, לא שלב.** מה שהרקמה מציעה עליו הופך ל-`RatsonProposal` ⇒ נכנס למסלול דרך השורה הקודמת. אין ליד בלי שהרקמה פנתה |
| **לוח משאבים** (`/resources`) | מה שכבר בידי הרקמה | לא קשור |

**משאלות נכנסות במסלול — הקרנה, לא העתקה.** בדיוק כמו הזמנה בלי ליד, הצעה
לקונסיירז' היא **שורה בפני עצמה** בלשונית "בתהליך" (מקור: "קונסיירז'"). **לא נוצרת
רשומת `lead`** — אחרת היו שני סטטוסים לאותה עסקה, ושעון השתיקה של המשאלה (שמאשר
לבד) היה מתנגש עם סטטוס שחבר הזיז ביד. `stageOf` מקבל מתאם שלישי:

| `RatsonProposal` | שלב במסלול | למה |
|---|---|---|
| `suggested` / `viewed`, בלי סבב משלנו | `new` | מחכה לתשובה מהרקמה — וזה בדיוק ה-speed-to-lead |
| יש סבב / `ratson_willingness_entry` / הודעה ב-`forum` | `talking` | יש שיחה |
| יש מחיר על השולחן (`total_price` / `covered_*` מהרקמה) | `offered` | "הצעה אצלו" |
| `accepted` (הדיל נחתם, עוד לא שולם) | `offered` (מחכה לתשלום) | כמו הזמנה ב-`accepted`/`pendingPayment` |
| יש `Sale` לרקמה מהדיל (169.8) | `won` | אותו כלל: `won` = כסף |
| `expired` / `rejected` / `hidden_by_wisher` | `paused` (`choseOther` / `timing`) | ברוח "אין לא מוחלט" — נעצר, לא אבוד |

- **הפעולה נשארת במקומה.** שורת הצעה ב"בתהליך" מקשרת ל-`/concierge/<ratsonId>` /
  ללשונית המשאלות; שום טופס בלשונית "בתהליך" לא משנה הצעה — ההסכמה, הסבבים והשתיקה
  שייכים ל-flow של הקונסיירז' (עיקרון 4: כל שינוי דרך ה-action שלו).
- **`needsAttention`** (§4.3) חל גם עליהן: הצעה ב-`suggested` שעברו עליה
  `leadResponseHours` מוצפת כמו ליד חדש. ה-badge של קבוצת `opps` נשאר (משאלות שמחכות),
  ו"בתהליך" סופר אותן גם — זה אותו מידע בשני מקומות, לא כפילות בנתונים.
- **"לקוחות"** (§5.5) מקבצים גם את מגישי המשאלות (`users_permissions_users` של ה-`Ratson`)
  לפי משתמש — לקוח שהזמין דרך הקונסיירז' ואחר כך דרך החנות הוא לקוח אחד.
- **בלי פרטי קשר חדשים**: מגיש משאלה הוא משתמש רשום; לא מעתיקים טלפון/מייל ל-`lead`.
- **הסדר בקבוצות לא משתנה ב-MVP**: "משאלות נכנסות" נשארת ב"הזדמנויות" (שם מגלים
  וענים); "בתהליך" ב"כסף ⇒ מכירות" (שם רואים את כל מה שבדרך לכסף). אם אחרי שימוש
  יתברר שזה מבלבל — לאחד את שתיהן (שאלה פתוחה 6).

### 4.1 לשונית "בתהליך" — `/moach/[projectId]/sales/manage/pipeline`

הלשונית הראשונה במסך המתקדם (§4.0): כל עסקה פתוחה לפני תשלום. שורה היא ליד, או
הזמנה בלי ליד (קונה שביקש הצעה ישירות) — אותן עמודות, אותו מיון.

- **שלושה סוגי שורות, טבלה אחת**: ליד (`lead`), הזמנה לפני תשלום בלי ליד (`order`), והצעה לקונסיירז' (`RatsonProposal`, §4.0). כל שורה נפתחת בעמוד של עצמה.
- **טבלה**: שם · ארגון · מקור · מוצר · **שלב** (`stageOf`) · אחראי · קשר אחרון ("לפני 3 ימים") · הצעד הבא / לחזור ב-.
- **סינון**: סטטוס, אחראי (כולל "בלי אחראי"), מקור, מוצר, "צריך טיפול" (§4.3), טווח תאריכים.
- **מיון ברירת מחדל**: "צריך טיפול" למעלה, אחר כך `lastActivityAt` הישן ביותר.
- **תצוגת לוח** (kanban לפי סטטוס) — מתג, לא ברירת מחדל.
- **פעולות מהירות בשורה**: "רשום שיחה", "קח" (= לקיחת המטלה), "לא עכשיו".
- **ייצוא CSV** (בלי פרטי קשר כברירת מחדל; עם פרטי קשר — רק בסימון מפורש, ונרשם ביומן `system`).
- "+ ליד ידני" (`source: manual`) — לפנייה שהגיעה בטלפון.

### 4.2 עמוד ליד — `/leads/[leadId]`

- כותרת: שם, ארגון, סטטוס (בורר), אחראי (או כפתור "קח"), "לחזור ב-", הצעד הבא.
- פרטי קשר עם קישורי `tel:` / `wa.me` / `mailto:` — לחיצה מציעה "לרשום את השיחה?".
- `details` כטבלה; המוצרים שהוא מתעניין בהם; הזמנות/מכירות מקושרות.
- **ציר זמן**: היומן + הודעות ה-forum של המטלה, ממוזגים לפי זמן, מסומנים שונה
  ("מול הלקוח" / "בין החברים").
- **הצעד הבא** (§4.0): "שלח הצעה" ⇒ הזמנה ב-`sent` עם פרטי הקונה ממולאים מראש (§5.5);
  "דווח מכירה" ⇒ טופס דיווח המכירה עם `leadId`. אין כפתור "הפך ללקוח" — הוא נגזר מהכסף.

### 4.3 "צריך טיפול" — הכלל אחד, משמש בכל מקום

ליד צריך טיפול אם: `new` ועברו `leadResponseHours`; **או** `followUpAt` עבר;
**או** פתוח (לא `won`/`paused`/`spam`) ואין פעילות `leadStaleDays` (ברירת מחדל 7).
פונקציה טהורה `needsAttention(lead, now, settings)` ב-`src/lib/leads/` — **המקור
היחיד** (הטבלה, הפס בשכבה הפשוטה, הסיכום היומי).

### 4.4 איפה עוד זה מופיע

- **השכבה הפשוטה** (`/moach/<pid>/sales`): פס "3 לידים מחכים לתשובה →" ב-`SalesShortcuts`, כמו הפס של הזמנות שממתינות (§4.0 — מתחת לפס ההזמנות כששניהם מחכים). מספרים בלבד, ב-stream, כמו `shopBanner`.
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
  "details": { "apartments": 16, "interest": "shared", "role": "resident" },
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
`productId` חייב להיות מוצר של הרקמה (`404`). `details` עד 4KB, עד 30 מפתחות,
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
- **"שכח אותי"** — action `anonymizeLead`: מוחק `name/email/phone/address/message/details`,
  משאיר סטטוס, מקור, תאריכים וקישורים (שהמספרים של הרקמה יישארו נכונים),
  רושם `system` ביומן. כל חבר יכול להפעיל — זו בקשה של אדם, לא החלטה של הרקמה.
- **שמירה**: ליד ב-`paused`/`spam` בלי פעילות 18 חודשים ⇒ אנונימיזציה אוטומטית
  ב-cron (`leadRetentionMonths` — הגדרה ברקמה). `won` נשמר כל עוד יש מכירה מקושרת.
- **עזיבת רקמה**: חבר שעזב מאבד גישה מיד (חברות נבדקת בכל בקשה); הלידים שהיו
  שלו חוזרים ל"בלי אחראי" עם התראה לרקמה.
- **לוגים וטלגרם**: בלי פרטי קשר. ההתראה לטלגרם (אם מוגדרת) — שם + מקור בלבד.
- `message` ו-`details` הם טקסט של הפונה ⇒ escape בכל מקום שמוצג (HTML, מייל, טלגרם).

---

## 7. הגדרות, הרשאות ו-webhooks

### 7.1 הגדרות רקמה (`Project.leadSettings` — json, null = ברירות מחדל)

`leadRoleIds`, `leadMissionId`, `leadResponseHours` (24), `leadStaleDays` (7),
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
`externalId`, `status`, `at` — **בלי** פרטי קשר ובלי שם האחראי. יורים רק מ-actions,
חתימה `X-1lev1-Signature` כמו היום. המיפוי action ⇒ אירועים בקובץ משלו,
`webhooks/leadEvents.ts`, באותה תבנית של `orderEvents.ts` (לא הרחבה של
`WEBHOOK_ACTIONS`, שהוא סט של task בלבד).

### 7.5 Strapi (`1.0b`) — L0, בנוי

בקוד (`1.0b`): `src/api/lead/`, `src/api/lead-activity/`, `Project.leadSettings` (json, לא
מתורגם) + `Project.leads`, ו-`Order.leads` (manyToMany, הצד ההפוך של `Lead.orders`).
`npx strapi ts:generate-types` טוען את הסכמה בלי שגיאות. הבדלים מ-§2.2:
- השדה החופשי נקרא **`details`**, לא `attributes` (ראו §2.2).
- המטבע הוא `currencyCode` (כמו `Order`), ונוסף `previousLead` (§2.4).
- ייחודיות (`project`, `externalId`) ו-(`project`, `dedupeKey`) נאכפת ב-`createLead`, לא בסכמה —
  ל-Strapi 4 אין אינדקס ייחודי מורכב.

**אחרי הפריסה — ביד, באדמין** (קולקציה חדשה צריכה שתי הענקות, ו-`validate:qids` בודק רק mutations):
1. **Authenticated**: `lead` find/findOne/create/update; `lead-activity` find/findOne/create
   (**בלי update/delete**).
2. **ה-API token של השרת**: אותן הרשאות.
3. ב-1.0main: `npm run types:update`, ואז `npm run validate:qids`.

### 7.6 i18n

namespace חדש `leads` ב-`ROUTED` רק לנתיבי `sales/*` (כמו `shop`). נוסח הסטטוסים
לפי "מה נשאר לעשות" (כמו UX_COPY_SHOP_SALES): "מחכה שיחזרו אליו", "בשיחה",
"הצעה אצלו", "לקוח", "לא עכשיו — לחזור ב-<date>". חמש השפות. `npm run check:i18n`.

---

## 8. פאזות

| # | מה | תלוי ב- | אומדן |
|---|---|---|---|
| L0 ✅ | סכמה ב-1.0b (`lead`, `lead-activity`, `leadSettings`) + הרשאות + types — **הקוד בנוי; ממתין ל-deploy, הרשאות ו-`types:update` (§7.5)** | — | יום |
| L1 ✅ | `src/lib/leads/` טהור (`validateLeadPayload`, `dedupeKey`, `needsAttention`, מעברי סטטוס) + vitest; actions `createLead` / `logLeadActivity` / `updateLeadStatus` + סנכרון מטלה | L0 | 2–3 ימים |
| L2 ✅ | `POST /leads` + `GET /leads/{externalId}` + scopes + webhooks + OpenAPI (`rikma-v1.openapi.yaml`) | L1 | 1–2 ימים |
| L3a | המסלול (§4.0): `stageOf` (ליד · הזמנה · הצעת קונסיירז') + vitest; סנכרון `offered`/`won`/`cancelled` מ-`createPaidOrder`, `orderLifecycle`, `createSale`; סידור הלשוניות לפי המסלול, לשוניות לפי מה שיש, `/sales/manage` ⇒ הלשונית שמחכה, קישורים קיימים ⇒ `/manage/orders` | L1 | 2 ימים |
| L3 | לשונית "בתהליך" + עמוד ליד (עם "שלח הצעה" / "דווח מכירה") + פס בשכבה הפשוטה + i18n | L3a | 3–4 ימים |
| **→ הוועד עובר ל-`/leads`** | | L2 | שעה בצד `vaad` |
| L4 | חנות: "בקשו הצעה" בעמוד מוצר ובתבנית, קישור הזמנה↔ליד, `won` אוטומטי | L2, S3 | 2 ימים |
| L5 | `leads:create:public`, מיזוג, ייצוא CSV, MCP tools, סיכום יומי, תצוגת לוח | L3 | 3 ימים |
| L6 | `demo-request` ⇒ `lead` ברקמה המרכזית (`source: demo`), `/api/demo` כותב ל-`createLead`; לשונית "לקוחות" | L3 | 2 ימים |
| L7 | S3b (בקשת רכש ל-`quote`) נבנה מעל הליד | L4 | לפי SHOP |

### 8.1 L1 — מה נבנה (2026-11-04)

- **טהור** (`src/lib/leads/`): `status.ts` (סטטוסים, `checkManualTransition`, `statusAfterActivity`),
  `dedupe.ts`, `settings.ts` (`resolveLeadSettings`), `attention.ts` (`needsAttention` — המקור היחיד,
  §4.3), `validate.ts` (`validateLeadPayload`), `taskSync.ts` (`leadEffectOfTask`). בדיקות: `leads.test.ts`.
- **שרת**: `src/lib/server/leads/store.ts` (כל קריאה בטוקן האדמין — ה-qids `lead*` הם
  `serviceAdmin` בלבד, כי בליד יש טלפון ומייל), `taskSync.ts` (רץ אחרי כל `updateTask`, שלב 5b′
  ב-`ActionService`, fire-and-forget).
- **actions**: `createLead` (`user · serviceAdmin · apiKey`), `logLeadActivity`, `updateLeadStatus`.
  בדיקות מול Strapi בזיכרון: `configs/leads.test.ts`.

מה הוחלט בדרך:
- **`dedupeKey` = חלק לכל ערוץ** — `p:<hash>|e:<hash>` (sha-256, 16 תווים). פנייה חוזרת מזוהה
  לפי טלפון **או** מייל, כך שאותו טלפון עם מייל חדש הוא אותו אדם. המספר עצמו לא נשמר במפתח.
- **ליד `paused` שפונה שוב** מקבל `followUpAt = now` — כך הוא עולה ב"צריך טיפול" בלי לשנות סטטוס ביד.
- **ההתראה**: רשימת נמענים ריקה היא "אף אחד" (N4), כך שמטלה לא משויכת **לא** מתריעה לרקמה —
  בניגוד למה ש-§3 הניח ולמה שההערה ב-`createTask` עדיין אומרת. לכן `createLead` מתריע בעצמו:
  לחברים כשאין תפקידי לידים (או כשהמטלה לא נפתחה), ולבעלים (או לחברים) בפנייה חוזרת.
  כש-`leadRoleIds` מוגדר — מחזיקי התפקיד שומעים דרך המטלה, ו-`createLead` שותק.
- תפקידים ומשימה ב-`leadSettings` לא מתחברים יחד (`createTask` מקבל אחד מהם): תפקידים קודמים.
- **נשאר פתוח מ-§3**: התראה לרקמה כשבעלים משחרר ליד (הסנכרון אינו action, ולכן אין לו
  notification); ופתיחת מטלת מעקב כש-`followUpAt` מגיע — שניהם ב-L3 עם ה-cron/הסיכום היומי.
- ה-qids `leadCreate` / `leadUpdate` / `leadActivityCreate` מתריעים ב-`validate:qids` (`LeadInput` לא
  קיים) עד ש-L0 נפרס ו-`types:update` רץ.

### 8.2 L2 — מה נבנה (2026-11-04)

- `POST /api/v1/r/{rikma}/leads` ו-`GET /leads/{externalId}` — `handleLeadPost` / `handleLeadGet`
  ב-`apiPublic/writeApi.ts`, באותה מעטפת של הזמנות (`{ error: { code, message, details } }`, בלי CORS).
  בדיקות: `routes/api/v1/r/[rikma]/leads/server.test.ts`.
- **scopes** `leads:create` · `leads:read` — `GRANTABLE_SCOPES`, צ'קבוקסים ב-`RikmaApiPanel` עם אזהרה
  משלהם ("מפתח לידים יושב רק בשרת"), חמש השפות.
- **webhooks** `lead.created` · `lead.statusChanged` — `webhooks/leadEvents.ts`, שלב 5b″ ב-`ActionService`.
  רק למפתח עם scope של לידים (`mayReceiveLead`); הגוף `{ leadId, externalId, status }` בלבד.
  `lead.won` מוגדר ויירה מ-L3a, המקום היחיד שבו ליד נהיה `won`.
- **OpenAPI** — שני הנתיבים, `LeadDraft` / `LeadCreated` / `LeadStatus` / `LeadStage`, ושני קודי שגיאה.

מה הוחלט בדרך:
- **קריאה מדפדפן (`Origin`) ⇒ `403 ORIGIN_NOT_ALLOWED`**, כמו בהזמנות: מי שקורא את הדף יכול לשלוח
  טלפון של אדם זר "עם הסכמה" בשם הרקמה. טופס סטטי מחכה ל-`leads:create:public` (§5.2, L5).
- **אתר לא יכול להצהיר `source: manual` או `demo`** (`400`, `details.field: "source"`) — `manual` הוא
  המקור היחיד שפטור מהסכמה.
- **`503 LEADS_NOT_READY`** עד שהסכמה נפרסה (בדיקה `rikmaApiLeadsSchema`, כמו `SHOP_NOT_READY`).
- `GET` מחזיר `{ leadId, externalId, status, hasOwner, lastActivityAt }`. `wonAt` מ-§5.3 לא נכנס —
  אין לו שדה בסכמה; יתווסף עם הסנכרון של L3a.
- מעבר סטטוס שנעשה דרך המטלה (`naasa` ⇒ `contacted`) **לא** יורה webhook — הסנכרון אינו action.
  אם אתר יצטרך את זה, הסנכרון יקרא ל-`onLeadChanged` ישירות.
- הוועד יכול לעבור ל-`/leads` כשיש L0 בפרודקשן ומפתח עם `leads:create`.

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
5. **`details` כ-JSON חופשי** — נוח לכל אתר, אבל אין סינון לפיו ב-MVP. אם רקמה
   צריכה לסנן ("בניינים עם 20+ דירות") — שדות מוגדרים לרקמה הם תכנית נפרדת.

## 10. מה במכוון **לא**

- **לא CRM מלא**: בלי ניקוד לידים אוטומטי, בלי שיווק במייל / רצפי מיילים, בלי
  pipelines מרובים, בלי תחזית הכנסות. `estimatedValue` לתצוגה בלבד.
- **לא "lost"** (עיקרון 2).
- **לא לידים חוצי-רקמות** ולא מכירת לידים.
- **לא הסכמת הרקמה על כל ליד** — טיפול בליד הוא עבודה תפעולית; ההסכמה נכנסת
  כשנוצרת התחייבות (הזמנה, מחיר במוצר, משימה בעלת אקוויטי) — במסלולים הקיימים.

## 11. שאלות פתוחות

1. `leadResponseHours` — ירד ל-24 לפי הנתונים (§4.0). לרקמות מתנדבים זה עלול להציף "צריך טיפול"; להשאיר 24 או לתת לרקמה לבחור כבר ביצירה?
2. האם עבודה על לידים צריכה להיספר כאקוויטי כברירת מחדל (משימה בתהליך "לידים"
   שנוצרת עם ההגדרה), או להשאיר לרקמה להחליט?
3. ~~האם `won` דורש תמיד קישור?~~ **נסגר:** כן — `won` נגזר מכסף מקושר (§4.0).
4. ייצוא CSV עם פרטי קשר — לכל חבר, או רק אחרי אישור חבר נוסף?
5. "שלח הצעה" ברקמה בלי אף מוצר — לפתוח הזמנה עם שורה חופשית (תיאור + מחיר), או
   לבקש קודם ליצור מוצר/שירות? (ב-Salesforce Opportunity לא חייבת Products.)
6. "משאלות נכנסות" ו"בתהליך" בשתי קבוצות ניווט (הזדמנויות / כסף) — להשאיר, או
   שאחרי שימוש "בתהליך" יחליף את "משאלות נכנסות" כמקום אחד לכל מה שמחכה לתשובה?
