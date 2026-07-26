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
| `kind` | enum | `mission` / `resource` / `product` / `note` |
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

---

## 3. שרת (`1.0`) — מה צריך להיבנות

### 3.1 מנוע
`src/lib/server/planning/`
- **`quickScan.ts`** — `scanProject(projectId, userId, fetch)`:
  `buildProjectContext()` → מסווג חדש/קיים → פרומפט קצר → 3–5 `{title, descrip, rationale}`.
  זול; בלי Pinecone.
- **`expandDirection.ts`** — `expandBoard(boardId, ...)`:
  `extractWish()` (קיים) על `descrip`+`sourceText` → **דה-דופליקציה מול
  `buildProjectContext()`** (לא להציע "עיצוב לוגו" אם יש כזו פתוחה — מסמן
  `existingRef`) → `resolveMissionSpec()` (קיים, Pinecone) לכל שורת משימה →
  items.

### 3.2 Actions (`src/lib/server/actions/configs/`)
| Action | תפקיד |
|---|---|
| `scanProjectDirections` | מדרגה 1 — יוצר N לוחות `suggested` |
| `expandPlanBoard` | מדרגה 2 — ממלא לוח ב-items |
| `createPlanBoardFromText` | מסלול הטקסט החופשי |
| `updatePlanItem` | must↔nice, accept, dismiss, עריכת שם/תיאור |
| `markPlanItemCreated` | נקרא אחרי יצירה מוצלחת בטופס → `status:'created'` + `createdRef` |
| `archivePlanBoard` | |

הרשאות: `projectMember` — רק חברי הריקמה רואים ומשנים לוחות.

### 3.3 QIDs
`getProjectPlanBoards(pid)` (לוחות + items), `getPlanBoard(id)`,
ומוטציות ה-CRUD המקבילות.

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
| 1 | סכמת Strapi (`project-plan-board` + `project-plan-item`) | ✅ בוצע |
| 2 | תיקון דליפת ה-prefill (§5) | ⏳ |
| 3 | QIDs + actions CRUD ללוחות | ⏳ |
| 4 | `quickScan.ts` + `scanProjectDirections` (מדרגה 1) | ⏳ |
| 5 | `expandDirection.ts` + `expandPlanBoard` (מדרגה 2) | ⏳ |
| 6 | `PlanBoards.svelte` + `PlanBoard.svelte` | ⏳ |
| 7 | חיבור "פתח בטופס" + `markPlanItemCreated` | ⏳ |
| 8 | `planProjectWorkTool` לבוט/MCP (מחזיר `boardId` + `reviewUrl`) | ⏳ |
