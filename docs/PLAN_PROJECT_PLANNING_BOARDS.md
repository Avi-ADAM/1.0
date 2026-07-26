# PLAN — לוחות תכנון לריקמה (Project Planning Boards)

מרחב תכנון מתמשך לריקמה: לוח (או כמה לוחות) של **כיוונים** לקידום הפרויקט —
משהו אמורפי שלאט-לאט הופך למשימות ומשאבים אמיתיים, בקצב של החברים.

מסמכים קשורים: [`PLAN_AI_ERA.md`](PLAN_AI_ERA.md) (שלב 2 — דפוס הצעה+אישור),
[`PLAN_MISSION_AI.md`](PLAN_MISSION_AI.md) (מנוע יצירת המשימה),
[`PLAN_CONCIERGE.md`](PLAN_CONCIERGE.md) (אותו דפוס למשאלה אישית).

---

## 1. העיקרון — שתי מדרגות, ולעולם לא ריצה אוטומטית

הכשל של רוב פיצ'רי ה-AI מסוג הזה הוא ריצה יקרה שמציפה את המשתמש ב-20 משימות
שהוא לא ביקש. לכן **שתי מדרגות נפרדות, שתיהן מופעלות בלחיצה מפורשת:**

| | **מדרגה 1 — סריקה דקה** | **מדרגה 2 — הריצה הגדולה** |
|---|---|---|
| מה מחזירה | 3–5 **כיוונים** במשפט-שניים כל אחד | פירוק מלא לכיוון אחד: משימות + משאבים |
| עלות | קריאה אחת קצרה, מודל זול | קריאה מלאה + Pinecone + דה-דופ |
| טריגר | המשתמש לוחץ "מה כדאי לקדם?" | המשתמש לוחץ "פרט את הכיוון הזה" על כיוון ספציפי |
| תוצר ב-DB | N לוחות ב-`status: 'suggested'`, בלי items | הלוח עובר ל-`expanded` ומתמלא ב-items |
| רץ אוטומטית? | **לא.** לעולם. | **לא.** |

**קלט חופשי** הוא מסלול שלישי מקביל: המשתמש כותב טקסט → נוצר לוח אחד
`origin: 'freeText'` שכבר מגיע `expanded` עם items.

### 1.1 מדרגה 1 מסתעפת לפי מצב הפרויקט

הסריקה הדקה קוראת את `buildProjectContext()` (נבנה בשלב 1 של `PLAN_AI_ERA`)
ומסתעפת:

- **פרויקט חדש** (אין משימות פתוחות, אין/מעט חברים, אין מוצרים) → הכיוונים הם
  כיווני **התנעה**: "הגדירו מה המוצר הראשון", "גייסו שותף לתחום X",
  "נסחו את הערכים לפעולות". כלומר — איך להתחיל.
- **פרויקט קיים** (יש היסטוריה) → סריקה מהירה של המצב **האמיתי** ואז כיווני
  **קידום**: "יש 4 משימות פתוחות בלי מבצע — כדאי לפרסם אותן ללב",
  "אין מוצר מוגדר אף שיש 60 שעות עבודה — כדאי להמיר לתוצר",
  "טיימר פתוח שבועיים בלי דיווח".

ההסתעפות היא **בפרומפט ובקונטקסט**, לא שני מנועים. אותו endpoint.

---

## 2. סכמת Strapi (בוצע — repo `1.0b`, ענף `claude/plan-ai-era-evpk46`)

### `project-plan-board` — לוח/כיוון

| שדה | טיפוס | תפקיד |
|---|---|---|
| `title` | string | שם הכיוון |
| `descrip` | text | תיאור |
| `rationale` | text | **למה** ה-AI הציע את זה, מעוגן במצב האמיתי. זה מה שהמשתמש קורא לפני שהוא מאשר כיוון |
| `origin` | enum | `quickScan` / `freeText` / `manual` / `agent` |
| `status` | enum | `suggested` → `active` → `expanded` → `archived` |
| `sourceText` | text | הטקסט החופשי המקורי |
| `revisionNote` | text | בקשת רוויזיה אחרונה בטקסט חופשי |
| `ai_meta` | json | cache של החילוץ — פתיחה חוזרת לא מריצה מודל |
| `expandedAt` | datetime | מתי רצה הריצה הגדולה |
| `project` / `createdBy` / `items` | relations | |

### `project-plan-item` — שורה בלוח

| שדה | טיפוס | תפקיד |
|---|---|---|
| `kind` | enum | `mission` / **`act`** / `resource` / `product` / `note` |
| `name`, `descrip` | string/text | |
| `imp` | enum | `must` / `nice` |
| `status` | enum | `proposed` → `accepted` → `created` / `dismissed` |
| `spec` | json | ה-prefill לטופס האמיתי: כישורים/תפקידים (שמות + IDs), שעות, תעריף, kindOf, מחיר |
| `existingRef` | json | `{type,id,name,similarity}` — התאמה למשהו **שכבר קיים**, כדי לא להציע כפילות |
| `createdRef` | json | `{type,id}` — מה נוצר בפועל מהשורה |
| `order`, `board` | | |

**למה `createdRef` הוא json ולא relation:** ל-`createMission` יש ארבעה ענפי יעד
(Pendm / OpenMission+Ask / OpenMission / Mesimabetahalich). ארבעה relations
nullable היו מלכלכים את הסכמה; `{type,id}` כן ומספיק.

**למה `spec` הוא json ולא relations לכישורים:** שורה היא **הצעה**, לא צורך
מפורסם. אם היא תהפוך ל-relation אמיתי היא תתחיל לצוף במנוע ההתאמה של הלב לפני
שאדם אישר אותה. ה-IDs נשמרים בתוך ה-json ומועברים לטופס בזמן היצירה.

### 2.1 `kind: 'act'` — מטלה לחבר קיים (ולא משימה חדשה)

בריקמה קיימת עם חברים ומשימות שכבר רצות, המהלך הזול והמועיל ביותר הוא בדרך כלל
**לא** לפתוח משימה חדשה אלא להטיל **מטלה (Act)**:

- **לאדם ספציפי על משימה ספציפית** — `assignedUserId` + `missionId`.
- **לפי תפקיד** — `tafkidims[]`, ואז מי שמחזיק בתפקיד **מקבל התראה** ויכול לגשת
  ולבצע.

**כל זה כבר עובד** ב-action `createTask` הקיים, כולל
`resolveRoleHoldersInProject` שמצמצם את ההתראה למחזיקי התפקיד **שהם חברי
הריקמה הזו** בלבד. לכן התוספת ללוחות היא רק ה-`kind` — פרטי הנמען רוכבים על
ה-`spec` הקיים:

```jsonc
{
  "assigneeKind": "person" | "role",
  "assigneeUserId": "12", "assigneeName": "דנה",   // person
  "missionId": "88", "missionName": "עיצוב האתר",  // המשימה-בתהליך לקשר אליה
  "roleIds": ["3"], "roleNames": ["מעצב"],          // role
  "hashivut": "green", "link": "", "dateS": null, "dateF": null
}
```

**צד ה-UI ✅ בוצע:** `isPersonal` נחשף כ-`$bindable` prop ב-`crtask.svelte`, כך
ששורת `act` עם `spec.assigneeKind === 'role'` נפתחת ישירות במצב תפקיד.

**מה שעדיין ידני:** `selected` (בחירת האדם/התפקיד) הוא מערך **תוויות**
(`"username - missionName - missionId"`), ולכן ה-prefill כרגע ממלא שם, תיאור
ומצב — אך **לא** בוחר אוטומטית את הנמען. המשתמש בוחר אותו בטופס. השלמה
אפשרית: לבנות את התווית מה-spec מול `bmiData`/`proles`.

---

## 3. שרת (`1.0`) — מה צריך להיבנות

### 3.1 מנוע ✅ בוצע — `src/lib/server/planning/`

- **`signals.ts`** (טהור, 11 טסטים) — `classifyProjectStage()` + `buildScanSignals()`.
  פרויקט הוא `new` כשלא נוצר בו כלום (0 משימות פתוחות + 0 מוצרים + 0 עבודה
  בתהליך). **גודל הצוות לבדו לא הופך פרויקט ל"קיים"** — חמישה חברים שלא יצרו
  כלום עדיין צריכים עצות התנעה. ה-`facts` הם תצפיות מחושבות בלבד ולא מכילים
  טקסט חופשי של משתמשים (יש טסט שמוודא שניסיון prompt-injection בשם הפרויקט
  לא מחלחל אליהם).
- **`quickScan.ts`** (10 טסטים) — `scanProjectDirections()`: קריאה קצרה אחת
  ל-flash-lite מעל ה-snapshot שכבר נבנה לצ'אט. בלי שאילתות נוספות, בלי
  Pinecone. `parseDirections()` סופג התנהגות מודל: code fences, פטפוט מסביב,
  מערך עירום במקום אובייקט, כפילויות, שדות ארוכים מדי, וג'אנק מוחלט → מחזיר
  מערך ריק במקום לזרוק. כשל בסריקה **לא שובר את הדף**.
- **`expandDirection.ts`** (13 טסטים) — `extractWish()` (קיים) →
  `resolveMissionSpec()` (קיים, Pinecone) → **דה-דופליקציה מול הפרויקט**.

**החלטה בדה-דופליקציה:** שורה כפולה **מסומנת ולא נמחקת** (`existingRef`), כי
"כבר קיים" הוא מידע שימושי למשתמש — הוא רוצה לדעת שהכיוון נכון אבל כבר טופל.
בנוסף השורות ממוינות כך שמה שחדש-וחובה עולה למעלה והכפילויות יורדות למטה.
סף הדמיון `0.7` מעל `fuzzyMissionMatch`.

### 3.2 Actions (`src/lib/server/actions/configs/planningBoards.ts`) ✅ בוצע
| Action | תפקיד |
|---|---|
| `createPlanBoard` | יצירת לוח/כיוון (`manual` → `active`, `quickScan` → `suggested`) |
| `updatePlanBoard` | אישור כיוון, שינוי שם, ארכוב, רישום בקשת רוויזיה |
| `createPlanItem` | הוספת שורה (mission / act / resource / product / note) |
| `updatePlanItem` | must↔nice, accept, dismiss, עריכת שם/תיאור/spec |
| `markPlanItemCreated` | נקרא אחרי יצירה מוצלחת בטופס → `status:'created'` + `createdRef` |
| **`scanProjectDirections`** | **מדרגה 1** — סורק ויוצר N לוחות `suggested` בלי items |
| **`expandPlanBoard`** | **מדרגה 2** — מפרק כיוון אחד ל-items (תומך `revisionNote` לריצה הזו) |
| **`createPlanBoardFromText`** | מסלול הטקסט החופשי — לוח + פירוק בצעד אחד |

**הרשאות:** כל הפעולות `jwt` + `projectMember`. מכיוון שמזהה לוח לא נושא בתוכו
פרויקט, כל פעולה מקבלת `projectId` **מפורש** ומאמתת שהלוח באמת שייך לו — אחרת
חבר בפרויקט א' היה יכול לערוך לוח של פרויקט ב' בניחוש מזהה. אף פעולה אינה
חשופה ל-`apiKey`.

**שתי מוסכמות שנאכפות בקוד:** `created` הוא מצב סופי (אי אפשר לערוך שורה
שכבר הפכה לישות אמיתית — הלוח לא יסטה מהמציאות), ורק `markPlanItemCreated`
רשאי לקבוע אותו, כי הוא חייב לרשום *מה* נוצר. הפעולה אידמפוטנטית — retry לא
דורס את ה-`createdRef` המקורי.

### 3.3 QIDs ✅ בוצע
`285getProjectPlanBoards` (לוחות + items), `286getPlanBoard`,
`287createPlanBoard`, `288updatePlanBoard`, `289createPlanItem`,
`290updatePlanItem`. הקריאות פתוחות ל-`user`; **המוטציות `serviceAdmin` בלבד**
כדי שכתיבה תעבור אך ורק דרך הפעולות המאובטחות.

> ⚠️ `npm run validate:qids` יכשל על שישה אלה עד שהסכמה תיפרס — הטיפוסים
> `ProjectPlanBoardInput` / `ENUM_PROJECTPLANITEM_KIND` נוצרים רק אחרי דיפלוי
> ב-Strapi. אחרי הפריסה: `npm run types:update`.

---

## 4. UI

**מיקום:** `/moach/[projectId]/create` — כבר מארח את שלושת היוצרים
(Mission / Resource / Process) וכבר צורך `?action=createmission`.

- **`PlanBoards.svelte`** — רשימת הלוחות. לוח `suggested` מוצג ככרטיס דק עם
  `rationale` ושני כפתורים: "פרט את הכיוון" (מדרגה 2) / "לא רלוונטי".
- **`PlanBoard.svelte`** — לוח פתוח: שורות עם תג must/nice, תג
  "כבר קיים"/"תבנית קיימת"/"חדש", צ'יפים של כישורים, וכפתור **"פתח בטופס"**.
- **פתיחה בטופס** → `mission.svelte` / `ResourceCreator.svelte` ב-`specMode`
  עם `initialSpec` מה-`spec` של השורה. המשתמש בודק, מתקן, מאשר — **שם**
  נוצרת הישות האמיתית, ואז `markPlanItemCreated`.
- **תיבת רוויזיה** בטקסט חופשי על לוח קיים (`revisionNote`).

---

## 5. באג חוסם שצריך לתקן קודם

`prepareMissionTool` כבר שולח `skills`, `roles`, `workways`, `nhours`, `valph`
ב-URL — אבל:
1. הצרכן ב-`moach/[projectId]/create/+page.svelte` קורא **רק `name` ו-`descrip`**.
2. `choosMission.svelte` מעביר רק `{name, descrip}` כ-`initialSpec`.
3. `initialSpec` ב-`mission.svelte` מכבד רק `name/descrip/hours/ratePerHour`,
   ורק ב-`specMode || publishMode`.

**כלומר כל הצעות הכישורים של ה-AI נזרקות בדלת היום.** בלי להרחיב את
`initialSpec` ל-`skills[]`/`roles[]` (כצ'יפים מסומנים-מראש שניתן להסיר) הלוח
ירגיש טיפש. זה תנאי מקדים.

---

## 6. עקרונות שנשמרים

- **אין יצירה אוטומטית.** שורה בלוח היא הצעה; ישות נוצרת רק אחרי שאדם פתח
  אותה בטופס האמיתי ואישר. זהו בדיוק דפוס "הצעה + ניווט לאישור" משלב 2 של
  `PLAN_AI_ERA`, מוחל על *קבוצת* ישויות.
- **הסכמה לא נעקפת.** היצירה עוברת ב-`createMission` הקיים על ארבעת ענפיו, כך
  שאם הריקמה דורשת הצבעה — היא עדיין נדרשת. הלוח מזין את המסלול, לא עוקף אותו.
- **Prompt injection.** תוכן הפרויקט שנכנס לפרומפט הוא קלט לא-מהימן ומתוחם
  בבירור (כמו ב-`summarizeProjectContext`).
- **עלות.** מדרגה 1 זולה ונדירה; מדרגה 2 רק לפי בקשה מפורשת; `ai_meta` מונע
  ריצות חוזרות.

---

## 7. סדר ביצוע

| # | שלב | סטטוס |
|---|---|---|
| 1 | סכמת Strapi (`project-plan-board` + `project-plan-item`, כולל `act`) | ✅ בוצע |
| 2 | תיקון דליפת ה-prefill (§5) | ✅ בוצע |
| 3 | QIDs + actions CRUD ללוחות (+14 טסטים) | ✅ בוצע |
| 4 | `quickScan.ts` + `scanProjectDirections` (מדרגה 1) | ✅ בוצע |
| 5 | `expandDirection.ts` + `expandPlanBoard` (מדרגה 2) | ✅ בוצע |
| 6 | חשיפת `isPersonal` כ-prop ב-`crtask.svelte` (§2.1) | ✅ בוצע |
| 7 | `PlanBoards.svelte` + `PlanBoard.svelte` | ✅ בוצע |
| 8 | חיבור "פתח בטופס" + `markPlanItemCreated` | ✅ בוצע |
| 9 | `planProjectWorkTool` לבוט/MCP (מחזיר `boardId` + `reviewUrl`) | ⏳ |

## 8. הערות מימוש UI

- **טעינה עצלה של הלוחות.** `PlanBoards` טוען את הלוחות בצד-לקוח ב-`onMount`
  ולא ב-`+page.server.ts`. זה מכוון: כל עוד הסכמה לא נפרסה, הרכיב פשוט
  **מסתיר את עצמו** במקום לשבור את כל דף היצירה.
- **טעינה עצלה של המנועים.** `planningRuns.ts` מייבא את `quickScan`/
  `expandDirection` דרך `await import()` בתוך ה-handlers. ייבוא ברמת המודול
  גורר את כל מחסנית ה-embeddings והמודלים (שקוראת `$env/static/private`) לתוך
  רג'יסטרי הפעולות — מה ששבר בפועל שני קבצי בדיקה של `/api/action`.
- **מיפוי שורה→טופס** ב-`create/+page.svelte`: `act` → `crtask.svelte`
  (במצב תפקיד אם `spec.assigneeKind === 'role'`), `resource`/`product` →
  `ResourceCreator`, ברירת מחדל → `mission.svelte` דרך אותו נתיב prefill של
  `?action=createmission`.
- **סימון `created`** מתבצע מהחזרת הטופס עצמו: `mission.svelte` מחזיר
  `{ md: { createdEntityType, createdEntityId } }`, `ResourceCreator` מחזיר את
  הרשומה, ו-`crtask` מחזיר `{ id }`. אם לא הוחזר מזהה — השורה **לא** מסומנת,
  כדי שלא יירשם `createdRef` שקרי.
