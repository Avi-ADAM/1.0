# API יצירת מטלות ממערכות חיצוניות (External Tasks API)

> אח תאום ל‑`PLAN_EXTERNAL_SALES_API.md`. אותה תשתית מפתחות, אותה תבנית
> endpoint, אותה נקודת־חנק — רק שהפעם היעד הוא **מטלה (Act)** ולא מכירה.
> מסמך משלים בצד Strapi: שינויי סכמה של `act` ו‑`api-key` ב‑`1.0b`.

## Context — למה זה נבנה

לחברי ריקמה יש מערכות משלהם שמייצרות עבודה: מערכת טיקטים, לוח באגים, טופס
"צור קשר", CRM, בוט. היום כל פריט כזה מחייב פתיחה ידנית של מטלה ב‑1lev1.
המטרה: **endpoint REST "טיפש"** שמערכת צד־שלישי קוראת לו וכל פריט אצלה נולד
כמטלה בריקמה — משויכת למשימה בתהליך, מושמת לחבר או לתפקיד, וממתינה
**להסכמתו** של מי שאמור לבצע אותה.

מקרה־המבחן שממנו זה נולד: `106_ezrachi/src/lib/components/tikets/SupportWidget.svelte`
— ווידג'ט תמיכה שיוצר טיקט. הטיקט אמור להופיע גם כמטלה בריקמה של אותו אתר.
אבל ה‑API עצמו גנרי לחלוטין ולא יודע דבר על טיקטים.

### מה המערכת החיצונית שולחת

- `name` — שם המטלה (חובה)
- `description` · `link` — תיאור וקישור חזרה לפריט המקורי
- `missionId` — **המשימה בתהליך** שאליה המטלה מתחברת (`mesimabetahalich`)
- `assignedUserId` — לְמי המטלה מיועדת, או
- `roleIds` — לאיזה **תפקיד** בריקמה (מי שמחזיק בו יראה אותה)
- `urgency` · `dateS` · `dateF`
- `externalId` — מזהה הפריט במערכת החיצונית (אידמפוטנטיות + מפתח לסנכרון)

---

## מיפוי הקיים — על מה רוכבים

| רכיב קיים | קובץ | מה הוא נותן |
|---|---|---|
| מפתחות API scoped לריקמה | `src/lib/server/apiKeys.ts` | `verifyApiKeyDetailed` עם `project`/`scopes`/`revoked`/`allowed_origins`, cache, `assertScope`, `touchLastUsed` |
| CRUD מפתחות | `src/routes/api/api-keys/+server.ts` | יצירה/רשימה/מחיקה; raw מוחזר פעם אחת |
| תבנית endpoint חיצוני | `src/routes/api/v1/sales/+server.ts` | Bearer → scope → rate‑limit → origins → ולידציה → אידמפוטנטיות → `executeAction` |
| **פעולת יצירת מטלה** | `src/lib/server/actions/configs/createTask.ts` | נקודת החנק: יוצרת `Act`, תומכת בהשמה למשתמש (`my`) או לתפקידים (`tafkidims`), קושרת למשימה (`mesimabetahaliches`), ומתריעה לנמענים הנכונים. **כבר** נושאת `access: ['user','serviceAdmin','apiKey']` |
| פעולת עדכון מטלה | `src/lib/server/actions/configs/updateTask.ts` | נקודת החנק לשינויי מצב (`myIshur`, `naasa`, `status`) — משם ייצא ה‑webhook |
| שכבת authz סטטית | `src/lib/server/authz/` | `apiKey` נאכף תמיד; scopes של `projects`/`ops` מצמצמים עוד |
| עמוד מטלות במוח | `src/routes/(reg)/moach/[projectId]/acts/` | `getProjectMissions` כבר מחזיר את המשימות בתהליך + התפקידים שלהן — בדיוק הנתונים שעמוד התיעוד צריך |

### עקרון‑העל שנשמר — הסכמת המבצע

`createTask` מציב `myIshur` על `false` כשהמטלה מושמת למישהו שאינו היוצר.
כלומר מטלה שנוצרה מ‑API **אינה** רשומה על אף אחד עד שהמשוּיָך אישר אותה
בפלטפורמה. זו בדיוק הדרישה "נצטרך אישור משתמש דרך הפלטפורמה שהוא לוקח את
המטלה", והיא מתקיימת **בלי שורת קוד נוספת** — בזכות הרכיבה על הפעולה הקיימת.
זו הסיבה לא לכתוב מסלול "מהיר" ישירות ל‑Strapi.

השמה לתפקיד עוברת באותו היגיון: `isAssigned:false` + `tafkidims`, והמטלה
מוצעת למחזיקי התפקיד בריקמה (`resolveRoleHoldersInProject`) — אף אחד לא
"מחויב" אליה עד שלקח אותה.

---

## ארכיטקטורה

```
המערכת החיצונית (טיקט נפתח / באג דווח / טופס נשלח)
        │  POST https://1lev1.com/api/v1/tasks
        │  Authorization: Bearer 1lev1_xxx     (מפתח scoped לריקמה, scope tasks:create)
        ▼
src/routes/api/v1/tasks/+server.ts                     ← חדש
        │  1. verifyApiKeyDetailed → user + project + scope
        │  2. ולידציית payload (src/lib/server/tasksApi.ts, טהור ונבדק)
        │  3. אידמפוטנטיות: externalId כבר קיים בריקמה? ⇒ 200
        │  4. המשימה/החבר/התפקידים שייכים לריקמה? ⇒ 404/403
        │  5. actionService.executeAction('createTask', …)
        ▼
createTask.ts → Act (myIshur:false) → התראה למשוּיָך/מחזיקי התפקיד
        ▼
  המשוּיָך מאשר בפלטפורמה  →  updateTask
        ▼
src/lib/server/webhooks/  ← חדש: POST חתום חזרה אל callback_url של המפתח
```

---

## Phase 0 — שינויי סכמה ב‑Strapi (`1.0b`, branch `shabab`)

1. **`act`** מקבל:
   - `externalId` — string. מזהה הפריט במערכת החיצונית. אידמפוטנטיות
     ומפתח הסנכרון החוזר.
   - `source` — enumeration `["ui","api"]`, ברירת מחדל `ui`. מאפשר לסמן
     במוח "נוצר אוטומטית" ולסנן.
2. **`api-key`** מקבל:
   - `callback_url` — string. יעד ה‑webhook היוצא. ריק ⇒ אין webhook.
   - `webhook_events` — json. רשימת אירועים מבוקשים; ריק ⇒ הכול.

   **סוד ה‑HMAC לא נשמר.** הוא נגזר דטרמיניסטית מזהה המפתח,
   `HMAC(API_KEY_NONCE, 'webhook:' + keyId)` — השרת יכול תמיד לחשב אותו
   מחדש, ה‑UI מציג אותו פעם אחת ליד המפתח הגולמי, ואין סוד נוסף שיכול
   לדלוף בגיבוי מסד נתונים.
3. פריסה ⇒ `npm run types:update` ב‑`1.0`.

עד שהשדות חיים, קריאת `externalId` בשאילתה עלולה להיכשל — מטופל בדיוק כמו
`extractedKey` ב‑`applyToMission` (try/catch שמוריד לאי‑אידמפוטנטיות ולא
מפיל את היצירה).

## Phase 1 — צד שרת

### 1a. `src/lib/server/tasksApi.ts` (טהור, נבדק)

`TASKS_SCOPE = 'tasks:create'`, `TASK_SOURCE = 'api'`,
`validateTasksPayload(body)` ו‑`buildCreateTaskParams({payload, projectId})`
— אותו פיצול בדיוק כמו `salesApi.ts`, כדי שהוולידציה והמיפוי ייבדקו
ב‑Vitest בלי מכונת הבקשה.

### 1b. `POST /api/v1/tasks`

**בקשה**

```json
{
  "name": "תיקון: הכפתור לא נשמר במובייל",
  "description": "דווח מווידג'ט התמיכה. …",
  "link": "https://ezrachi.example/tickets/8811",
  "externalId": "ticket_8811",
  "missionId": "456",
  "assignedUserId": "45",
  "roleIds": ["3"],
  "urgency": "red",
  "dateF": "2026-09-01T00:00:00Z"
}
```

| שדה | חובה | ברירת מחדל | ממופה אל |
|---|---|---|---|
| `name` | ✔ | — | `Act.shem` |
| `description` | ✖ | `''` | `Act.des` |
| `link` | ✖ | `''` | `Act.link` |
| `externalId` | מומלץ מאוד | — | `Act.externalId` |
| `missionId` | ✖ | — | `Act.mesimabetahaliches` |
| `assignedUserId` | ✖ | — | `Act.my` (+ `isAssigned:true`) |
| `roleIds` | ✖ | — | `Act.tafkidims` (+ `isAssigned:false`) |
| `urgency` | ✖ | `white` | `Act.hashivut` (`white｜green｜yellow｜red`) |
| `dateS` / `dateF` | ✖ | — | `Act.dateS` / `Act.dateF` |

`projectId` **לא** מתקבל מהלקוח — נגזר מהמפתח. `vali` (מי יצר) נקבע
מבעל המפתח, וזה כל התפקיד של זהות המשתמש בקריאה הזו.

`assignedUserId` ו‑`roleIds` הם אלטרנטיביים: נשלחו שניהם ⇒ ההשמה האישית
גוברת והתפקידים יורדים (`createTask` מתעלם מהם ממילא כש‑`isAssigned:true`),
וזה נאמר ב‑400 בזמן ולידציה כדי שלא יהיה הבדל שקט בין מה שנשלח למה שנוצר.

**ולידציות בעלות משמעות** (בשרת, לא ב‑snippet):

- `missionId` חייב להיות `mesimabetahalich` **פעיל בריקמה של המפתח** ⇒ אחרת 404.
- `assignedUserId` חייב להיות חבר בריקמה ⇒ אחרת 403.
- `roleIds` חייבים להיות תפקידים המוכרים לריקמה ⇒ אחרת 404.

**תשובה** `201`

```json
{ "success": true, "duplicated": false, "taskId": "902",
  "externalId": "ticket_8811", "status": "awaitingConsent",
  "assignee": { "id": "45", "username": "dana" } }
```

`status` הוא המצב מנקודת מבט הסנכרון:
`awaitingConsent` (מושמת, טרם אושרה) · `open` (פתוחה לתפקיד/לריקמה) ·
`accepted` · `done`.

### 1c. `GET /api/v1/tasks/{externalId}` — משיכת סטטוס

אותו מפתח, scope `tasks:read`. מחזיר את אותו אובייקט סטטוס. זה המסלול
לסנכרון "עצל" למי שלא רוצה להקים מקבל‑webhook.

### 1d. Webhook יוצא

`src/lib/server/webhooks/` — שלושה קבצים קטנים:

- `targets.ts` — "לאילו מפתחות בריקמה יש `callback_url`", עם cache בזיכרון
  (TTL 5 דק'). ריקמה בלי יעדים חוזרת מיד ולא נוגעת ב‑Strapi. זה מה שמונע
  שאילתה על כל `updateTask` באתר כולו.
- `sign.ts` — `X-1lev1-Signature: sha256=<hex>` — HMAC‑SHA256 של גוף הבקשה
  **הגולמי** עם הסוד הנגזר של המפתח (ראו Phase 0). פונקציית אימות
  מיוצאת כדי שהתיעוד יוכל להראות בדיוק את הקוד שהצד השני צריך.
- `dispatch.ts` — שליחה עם 3 ניסיונות ו‑backoff, fire‑and‑forget, לעולם לא
  מפילה את הפעולה שהולידה אותה.

מחוברים ב‑`ActionService` אחרי ביצוע מוצלח של `createTask`/`updateTask`
בלבד (Step 5b, לצד ההתראות). אירועים:

| אירוע | מתי |
|---|---|
| `task.created` | נוצרה מטלה עם `externalId` |
| `task.accepted` | המשוּיָך אישר (`myIshur:true`) |
| `task.assigned` | מטלה פתוחה נלקחה (`my` השתנה) |
| `task.progress` | `status` (0–100) השתנה |
| `task.done` | `naasa:true` |

גוף האירוע:

```json
{ "event": "task.accepted", "at": "2026-08-16T10:00:00Z",
  "projectId": "12", "taskId": "902", "externalId": "ticket_8811",
  "status": "accepted", "naasa": false, "progress": 40,
  "assignee": { "id": "45", "username": "dana" } }
```

### 1e. הרחבות קטנות בקיים

- `createTask.ts` — `externalId` + `source` בסכמת הפרמטרים ובגוף ה‑`Act`.
- `updateTask.ts` — ללא שינוי; ה‑webhook נתלה עליו מבחוץ.
- `/api/api-keys` — מקבל `scopes[]`, `name` ו‑`callbackUrl`; מייצר
  `webhook_secret` כשיש callback; **מתנהג בדיוק כמו היום** כשנשלח רק
  `projectId` (מפתח מכירות), כדי לא לשבור את פאנל המכירות הקיים.
- qids חדשים: `tasksApiActByExternalId`, `tasksApiProjectRefs`
  (משימות בתהליך + חברים + תפקידים לוולידציה), `tasksApiActStatus`,
  `webhookTargetsForProject`, ועדכון `140createAct`.

## Phase 2 — עמוד התיעוד במוח

מסלול חדש `/(reg)/moach/[projectId]/api` + כניסה בניווט של `+layout.svelte`.
זהו **עמוד ה‑API של הריקמה**, לא רק של המטלות.

מלמעלה למטה:

1. **מפתח API** — יצירה עם בחירת יכולות (`tasks:create`, `tasks:read`,
   `sales:report`), שם חופשי, הצגת ה‑raw ו‑`webhook_secret` פעם אחת עם
   אזהרה, מצב קיים (prefix + `lastUsedAt`) וביטול.
2. **Webhook** — שדה `callback_url` + הסבר על החתימה + כפתור "שלח בדיקה".
3. **טבלאות המזהים** — הלב של הבקשה. שלוש טבלאות עם כפתור העתקה על כל
   מזהה:
   - **משימות בתהליך** (`mesimabetahalich`): id + שם + מי מבצע. זה מה
     שמאפשר למשתמש לדעת לאיזה `missionId` לחבר.
   - **תפקידים** (`tafkidim`): id + תיאור.
   - **חברי הריקמה**: id + שם.
4. **מחולל ה‑snippet** — בוחרים משימה + חבר/תפקיד + דחיפות, ומקבלים
   קוד מוכן בשלוש גרסאות: `curl`, Node/שרת, ודפדפן (עם האזהרה שמפתח
   בדפדפן הוא מפתח פומבי).
5. **טבלת שדות** — מה חובה, מה כבר מולא עבורך, מה לחבר מהמערכת שלך.
6. **פרומפט לסוכן AI** — טקסט מוכן להעתקה שמתאר את כל החוזה, כולל
   המזהים האמיתיים שנבחרו למעלה, כדי שסוכן שבונה את האתר השני יבצע את
   האינטגרציה לבדו.

i18n: namespace חדש `rikmaApi` בכל חמש השפות, עם שער מסלול ב‑`routes.js`.

## Phase 3 — ההדגמה ב‑106_ezrachi

שני מקורות עבודה ב‑106 ממופים לריקמה, דרך מודול משותף אחד.

**התשתית המשותפת**

- `src/lib/server/onelevone.js` — כל מה שנוגע ל‑1lev1: קריאת המפתח
  (`$env/dynamic/private` — **המפתח לא מגיע לדפדפן**), `reportTaskTo1lev1`,
  אימות חתימת ה‑webhook, ומיפוי סטטוס. בלי `ONELEVONE_API_KEY` הכול
  no‑op שקט ושני הזרימות מתנהגות בדיוק כמו קודם.
- ניתוב פר‑מקור: `ONELEVONE_<SOURCE>_MISSION_ID/_ASSIGNEE_ID/_ROLE_ID`
  עם נפילה חזרה ל‑`ONELEVONE_*`, כדי שדיווחי באגים ורעיונות קהילתיים
  יגיעו לאנשים שונים.
- `src/routes/api/onelevone/webhook/+server.js` — **מקבל אחד לכל
  הסוגים**: מאמת את החתימה מול הגוף **הגולמי** פעם אחת, ואז מנתב לפי
  הקידומת של ה‑`externalId` שאנחנו עצמנו בחרנו. מקור שלישי בעתיד =
  שורה אחת ב‑`ROUTES`, לא URL וסוד נוספים.
- שני הצדדים זזים **רק קדימה** (`open → in_progress → closed`), כדי
  שביטול אישור בצד השני לא יפתח מחדש פריט שמנהל כבר סגר כאן.

**1. טיקטי תמיכה** (`SupportWidget.svelte`)

- מופה **ביצירה** — כל דיווח משתמש הוא עבודה אמיתית.
- `externalId = ticket_<documentId>`, `urgency` מ‑`type`
  (`support` ⇒ `red`, `feature` ⇒ `green`), `ticket_status` מתעדכן חזרה.
- הקריאה מ‑`submit()` לא‑חוסמת ולא‑מוצגת: אם 1lev1 לא זמין, זה לא
  עניינו של מי שדיווח על באג.

**2. הצעות צוות** (`suggestion-for-team`)

- מופה **באישור המודרטור ולא בהגשה**. הצעה ב‑`pending_moderation` היא
  עדיין לא העבודה של הצוות; מיפוי שלה היה דוחף תוכן לא‑מבוקר ישר לצלחת
  של שותף. האישור הוא הרגע שבו זה הופך למשהו שמישהו באמת צריך לעשות.
- הלקוח שולח **רק `documentId`**; ה‑BFF קורא את ההצעה עצמה עם
  ה‑system token, כך שאי אפשר להכתיב מבחוץ מה יופיע בריקמה. השער האמיתי
  הוא הסירוב לכל מה שאינו `approved` ופעיל, ואידמפוטנטיות ה‑`externalId`
  הופכת קריאה חוזרת ל‑no‑op.
- `externalId = teamsug_<documentId>`; `urgency` נגזרת מ‑**מיקומה בתור
  העיר** (`devOrder` 1 ⇒ `red`, ‏2–5 ⇒ `yellow`, השאר ⇒ `green`, בלי
  מספר ⇒ `white`) — דירוג אנושי אמיתי שחבל לשטח.
- הסנכרון החוזר כותב `execStatus`, ו‑`closed` גם משחרר את המספר ומרנמר
  את תור העיר. לכן לוגיקת התור חולצה ל‑`src/lib/server/teamSuggestionQueue.ts`
  ומשמשת גם את `/api/team-suggestion-moderation`: שני עותקים של החשבון
  הזה היו נפרדים, והתסמין היה תור עם חורים שאיש לא יודע להסביר.

ההגדרות מתועדות ב‑`.env.example` של 106.

## Phase 4 — SITE REPORT → הריקמה המרכזית (פנימי)

כשמשתמש מוצא באג באתר שלנו, או משהו שפשוט לא הגיוני, הוא עושה לפלטפורמה
טובה אמיתית. היום הטובה הזו נוחתת בהודעת טלגרם ובשורת `site-report`
שאיש לא אחראי עליה. Phase 4 נותנת לה את אותו טיפול בדיוק שקיבלו טיקט
ותוצאת מודרציה — רק שהפעם המקור הוא **אנחנו**.

### זה לא עובר ב‑API החיצוני

1lev1 מדבר עם עצמו, ולכן `src/lib/server/siteReportMirror.ts` קורא
ישירות ל‑`actionService.executeAction('createTask', …)` — שכבה אחת מתחת
ל‑`/api/v1/tasks`, בלי סיבוב HTTP דרך ה‑endpoint הציבורי של עצמנו ובלי
מפתח API. כלל ההסכמה זהה לחלוטין: `myIshur:false` ⇒ המטלה היא הצעה עד
שחבר בריקמה לוקח אותה.

היעד הוא **הריקמה המרכזית, `projectId = 1`** (`SITE_REPORT_PROJECT_ID`
דורס אם צריך).

### הזרימה

```
משתמש/ה מדווח/ת  →  POST /api/report
                     │  1. שמירת site-report ב‑Strapi   (כמו היום)
                     │  2. התראת טלגרם                   (כמו היום)
                     │  3. mirrorSiteReport → createTask בריקמה 1   ← חדש
                     │  4. מייל אישור למדווח/ת, אם השאיר/ה כתובת    ← חדש
                     ▼
        חבר/ה בריקמה מאשר/ת את המטלה → updateTask
                     ▼
        onTaskChanged → syncSiteReportFromTask
                     ▼
        site-report.status:  new → in_review → resolved
```

- `externalId = sitereport_<id>` — אידמפוטנטיות והידית שהסנכרון החוזר תופס.
- **דחיפות לפי סוג**: `bug ⇒ red`; `partnership`/`contact ⇒ yellow` (יש
  אדם שממתין לתשובה — פחות דחוף משבירה, יותר דחוף מרעיון); `feature ⇒ green`.
- הסטטוס זז **רק קדימה**, כך שמטלה שנפתחה מחדש לא תבטל `resolved` שאדם קבע.
- מי מגיש את המטלה (`Act.vali`): `SITE_REPORT_TASK_CREATOR_ID`, ואם לא
  הוגדר — החבר הראשון בריקמה המרכזית (בקאש ל‑10 דק'). `createTask` חסום
  ב‑`projectMember`, ולכן זה חייב להיות חבר אמיתי; משתנה סביבה חסר לא
  אמור לכבות את הפיצ'ר בשקט.
- ניתוב אופציונלי: `SITE_REPORT_MISSION_ID` / `SITE_REPORT_ASSIGNEE_ID` /
  `SITE_REPORT_ROLE_ID`. בלעדיהם המטלה נשארת פתוחה לכל הריקמה.

### המסלול הזול נשמר

`onTaskChanged` (שהיה `dispatchTaskWebhook`) עכשיו משרת שני סוגי מנויים —
מערכת חיצונית דרך webhook חתום, ודיווח אתר דרך קריאת פונקציה — על אותה
קריאה בודדת של מצב המטלה. סדר הבדיקות נשמר מהזול ליקר: ריקמה בלי
אינטגרציה **ואינה** הריקמה המרכזית עדיין עולה חיפוש אחד ב‑Set וקריאה
אחת מ‑Map מקושש, ולא נוגעת ב‑Strapi. רק ריקמה 1 משלמת על טעינת ה‑Act.

### מייל אישור למדווח/ת

`src/lib/components/mail/siteReportReceived.svelte`, בחמש שפות לפי שפת
**הנמען** (הסוג המותר של אובייקט רב‑לשוני בצד שרת). נשלח רק אם הושארה
כתובת, ואומר את הדבר האמיתי: לא "קיבלנו" אלא "זה נפתח כמטלה בריקמה
שמפתחת את האתר, ומישהו לוקח אותה על עצמו". לאורח שאין לו חשבון הכפתור
מוביל ל‑`/signup` עם הזמנה לקחת חלק; למשתמש רשום — ל‑`/lev`.

שליחת המייל והמיפוי שניהם fire‑and‑forget: הדיווח כבר נשמר, ולא ריקמה
עמוסה ולא שרת דואר שמסרב הם סיבה לומר למדווח/ת שהדיווח נכשל.

> **פתוח**: היום SITE REPORT נגיש רק דרך בוט ה‑AI (`reportIssueTool`).
> אין טופס UI ואין עמוד מעקב, ולכן "קישור לפתיחת הפידבק" מומש כקישור
> חזרה לאתר ולא כעמוד מעקב אחרי דיווח. אם רוצים מעקב אמיתי — זה עמוד
> נוסף והחלטה נפרדת.

---

## אבטחה

1. **`projectId` לעולם לא מהלקוח** — נגזר מהמפתח. הנזק המרבי ממפתח שדלף
   הוא הצפת ריקמה אחת במטלות; אין קריאה, אין מחיקה, אין עדכון.
2. **המפתח לא מייצר התחייבות של אף אחד.** מטלה מ‑API נכנסת עם
   `myIshur:false` — היא הצעה. אדם אמיתי חייב לאשר אותה בפלטפורמה.
3. **מפתח בדפדפן הוא מפתח פומבי** — ההמלצה הראשית ב‑UI היא צד־שרת,
   וההדגמה ב‑106 בנויה כך.
4. `allowed_origins` + `revoked` + rate‑limit per‑key (60/דקה) — כמו
   ב‑API המכירות.
5. **ה‑webhook חתום** ב‑HMAC עם סוד ייעודי (לא עם המפתח עצמו), כדי
   שהצד המקבל יוכל לוודא שההודעה מאיתנו.
6. ולידציית שייכות (משימה/חבר/תפקיד לריקמה) בשרת בלבד.

## סדר עבודה

| שלב | ריפו | תלוי ב־ |
|---|---|---|
| 0. סכמות | 1.0b | — |
| 1. שרת + webhook | 1.0 | 0 פרוס + `types:update` |
| 2. עמוד המוח | 1.0 | 1 |
| 3. הדגמה | 106_ezrachi | 1 + 2 (מפתח אמיתי) |

## בדיקות

- **Vitest**: `validateTasksPayload` (טיפוסים, גבולות, `urgency` לא חוקית,
  התנגשות `assignedUserId`/`roleIds`, תאריכים), `buildCreateTaskParams`
  (מיפוי מדויק לפרמטרים של `createTask`), חתימת ה‑webhook ואימותה.
- **ידני/curl**: מפתח תקין ⇒ 201 + התראה למשוּיָך; `externalId` כפול ⇒
  `duplicated:true`; משימה של ריקמה אחרת ⇒ 404; מפתח בלי `tasks:create`
  ⇒ 403; מפתח `revoked` ⇒ 401; אישור המטלה ⇒ webhook `task.accepted`.

## שאלות פתוחות

1. **הרחבה למשימה מלאה (Mission).** הוחלט: כרגע Act בלבד. כשנרחיב,
   `kind:'mission'` ינותב ל‑`createMission` וייהנה מכל 4 הענפים
   וזרימת ההסכמה שלהם — ה‑endpoint כבר בנוי לקבל את זה בלי שינוי חוזה.
2. **מחיקה/סגירה מבחוץ.** טיקט שנסגר במערכת החיצונית — האם לסגור את
   המטלה? כרגע לא: סגירת מטלה היא מעשה של הריקמה. מועמד ל‑`PATCH`
   עתידי שפותח הצעת ארכוב (`PLAN_OBJECT_ARCHIVAL`) במקום למחוק.
3. **כמה מפתחות לריקמה** — הפעם ריבוי מפתחות בעלי שם (פר מערכת מחברת),
   בשונה מהמפתח היחיד של המכירות.
