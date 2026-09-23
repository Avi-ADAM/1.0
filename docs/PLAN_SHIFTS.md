# תכנית: משמרות ואיוש משותף ברקמה (Shifts & Staffing)

> סטטוס: **P1 (משימה לכמה אנשים) ב‑commit `e39d5e32`, טרם deploy. P2 (הסכימה)
> נכתבה ונבדקה ב‑1.0b, טרם commit/deploy — ראה §13.2. P3 ואילך: תכנון.**
> ההכרעות ב‑§14 סגורות (2026‑09‑22), כולל שלושה שינויים שלך מול ההמלצה
> המקורית: התחייבות משמרות כתנאי השמה (§3.8), כרטיס חור עם שתי אפשרויות
> (§7.1), ועומק גיבוי נגזר (§6.3). המסמך נכתב מקריאת הקוד הקיים (לא מהזיכרון),
> ומשמש גם כתיעוד המערכת להרחבות עתידיות. §13 הוא יומן הביצוע.
>
> מסמכים קשורים:
> [`PLAN_OBJECT_ARCHIVAL.md`](./PLAN_OBJECT_ARCHIVAL.md),
> [`PLAN_NEGOTIATION_CANDIDATES.md`](./PLAN_NEGOTIATION_CANDIDATES.md),
> [`PLAN_RESOURCE_CALENDAR.md`](./PLAN_RESOURCE_CALENDAR.md) (התקדים הקרוב
> ביותר: תפוסה כנגזרת, לא כדגל),
> [`PLAN_TIMEGRAMA.md`](./PLAN_TIMEGRAMA.md),
> [`PLAN_STIPEND.md`](./PLAN_STIPEND.md),
> [`PLAN_MISSION_EQUITY_PREVIEW.md`](./PLAN_MISSION_EQUITY_PREVIEW.md).

---

## 0. מה יש היום — מהקוד

### 0.1 עמוד המשמרות: הדגמה בלבד

[`/moach/[projectId]/shifts/+page.svelte`](../src/routes/(reg)/moach/[projectId]/shifts/+page.svelte)
עוטף רכיב יחיד, [`sidur.svelte`](../src/lib/components/prPr/sidur/sidur.svelte)
(72 שורות). מה שיש שם בפועל:

- מערך `eve` **קשיח בקוד** עם 13 אירועים מאוגוסט 2022 ושמות אנשים ("baruch",
  "bar", "yoav", "dor", "alon").
- `dateClick` שמוסיף אירוע מקומי בשם קבוע `"tohar"`, עד 4 פעמים (`count <= 4`).
- `eventClick` שמציג טוסט "המשמרת כבר נבחרה על ידי X".
- אפס קריאות רשת, אפס שמירה, אפס קשר למשימה או לחבר רקמה.
- `slotMinTime:"11:00"` / `slotMaxTime:"18:00"` — קשיח.

כלומר: **אין מנגנון משמרות. יש מוקאפ.** הוא מקושר מהניווט
([`+layout.svelte:175`](../src/routes/(reg)/moach/[projectId]/+layout.svelte#L175),
טאב `shifts` בקבוצת `work`), כך שחבר רקמה שנכנס אליו רואה נתוני דמה.

### 0.2 טופס המשמרות במשימה: UI מלא, מנותק לחלוטין

בתוך [`mission.svelte`](../src/lib/components/prPr/mission.svelte) (2304 שורות)
יש בלוק משמרות שלם:

| מה | איפה |
|---|---|
| `days` — 7 ימים, לכל אחד `st`/`cl`/`shiftp`/`shifts[]` | שורות ~881‑976 |
| `shift` / `shifts` / `shifterr()` — ניהול מספר המשמרות ליום | שורות ~977‑1006 |
| הטבלה עצמה (7 עמודות, `SveltyPicker` לכל תא) | שורות ~1096‑1218 |
| `shiftE` — דגל עריכה | שורה 1037 |
| `shifter(a)` — פותח את הדיאלוג | שורות 812‑817 |

**`days` לא נשלח לשרת. אף פעם.** חיפוש על `createMission` מראה שהפרמטרים
היחידים שעוברים הם אלה שב‑[`createMission.ts`](../src/lib/server/actions/configs/createMission.ts)
(§1, שורות 65‑95) — ובהם אין `days`, אין `shifts`, ואפילו לא `isshift`.
הטבלה היא קלט שנזרק.

בעיות נוספות בטבלה הקיימת:
1. **7 עמודות** — נשבר במובייל, ועם 3 משמרות ביום זה 7×(3×3+3)=84 תאים.
2. `shifterr(i)` דוחף משמרת חדשה **בכל `onchange`** של שדה המספר — הקלדת "12"
   מוסיפה שתי משמרות. אין ולידציה (יש `//todo ... v a l i d a t i o n` בקוד).
3. `days[i].shiftp` לא מסונכרן עם `days[i].shifts.length` — שני מקורות אמת.
4. הטקסטים מגיעים מ‑`mf` שהוא
   [`missionByLang`](../src/lib/components/prPr/mission.svelte#L371) — מילון
   inline של `{he, en, ar}` שמייבא את קבצי ה‑JSON ישירות. **חסרים `ru` ו‑`es`**,
   וזו בדיוק הרגרסיה ש‑CLAUDE.md אוסר. העיצוב מחדש חייב לעבור ל‑`$t()`.

### 0.3 מה כן קיים בסכימה ואפשר להישען עליו

ב‑`OpenMission` (ובתאום ב‑`Pendm`) כבר יש:

| שדה | טיפוס | מה קורה איתו היום |
|---|---|---|
| `isshift` | `boolean` (default false) | נכתב רק ב‑[`pend.svelte:76`](../src/routes/api/timegrama/pend.svelte#L76) כשהוא מועתק מ‑Pendm ל‑OpenMission. **אף אחד לא קורא אותו.** |
| `howMeny` | `biginteger` | מועתק באותו מקום (`?? 1`). נקרא רק ב‑[`normalizeCards.ts:188`](../src/lib/server/discovery/normalizeCards.ts#L188) לתצוגה. **לא משפיע על שום לוגיקה.** |
| `iskvua` | `boolean` | כן פעיל — מייצר `Monter` למשימה מחזורית. |
| `tafkidims` / `work_ways` | relations | תפקיד ואופן עבודה — רלוונטי לשיבוץ לפי תפקיד. |

כלומר **שני השדות שדרושים לחלק א' של התכנית כבר קיימים בסכימה** — הם פשוט לא
מחוברים לכלום.

### 0.4 איך השמה סוגרת משימה היום — והבאג שזה יוצר

שני הפינלייזרים עושים בדיוק אותו דבר:

- [`finalizeJoinAcceptance.ts:206`](../src/lib/server/actions/configs/finalizeJoinAcceptance.ts#L206)
  `updateOpenMission(id: openMid, data: { archived: true })`
- [`finalizeAskAcceptance.ts:165`](../src/lib/server/actions/configs/finalizeAskAcceptance.ts#L165)
  אותה שורה בדיוק.

ואז שניהם מארכבים את **כל** בקשות ההצטרפות האחרות:
[`finalizeJoinAcceptance.ts:290‑312`](../src/lib/server/actions/configs/finalizeJoinAcceptance.ts#L290)
(`siblingAsks` → `updateAsk(archived: true)`).

התוצאה: משימה שנוצרה עם `howMeny: 5` **נסגרת אחרי המצטרף הראשון**, וארבעת
המועמדים הנוספים מקבלים ארכוב שקט של הבקשה שלהם. `howMeny` נכתב, מוצג בכרטיס
ונזרק. זה החלק שחייב להיבנות בכל מקרה, בלי קשר למשמרות.

### 0.5 מה שכן קיים ויכול לשרת אותנו

| מנגנון | איפה | איך ישרת |
|---|---|---|
| `Timegrama` — שעון "שתיקה כהסכמה" | [`api/timegrama/+server.js`](../src/routes/api/timegrama/+server.js), `whatami` הוא **String חופשי** | שעון סגירת מחזור שיבוץ = `whatami: 'rosterPeriod'` |
| `Decision` + `vots` + `forums` | `Enum_Decision_Kind` (22 ערכים היום) | `kind: 'shiftSwap'` דו‑צדדי, `kind: 'shiftPolicy'` רקמתי |
| `lifecycle` (active/archiveProposed/archived/released) | [`PLAN_OBJECT_ARCHIVAL.md`](./PLAN_OBJECT_ARCHIVAL.md) | ארכוב תכנית משמרות = בדיוק אותו מסלול |
| מודול טהור + pbt | [`src/lib/resources/availability.ts`](../src/lib/resources/availability.ts) | התקדים המדויק: חישוב דטרמיניסטי שכולם מסכימים עליו |
| `@internationalized/date` | כבר תלות בפרויקט | חישוב אזורי־זמן ו‑DST נכון |
| `Monter` | מחזוריות למשימה קבועה | לא נחליף — נתאם |

---

## 1. העקרונות — מה מותר ומה אסור למערכת הזאת לעשות

לפני כל שורת קוד. אלה לא סיסמאות; כל אחד מהם מכריע החלטה תכנונית בהמשך.

### 1.1 אף אחד לא משובץ למשמרת שלא הצהיר שהוא יכול אליה

זה הכלל שמחליף את כל "אילוץ השיבוץ" של מערכות משמרות רגילות.
**ההצהרה היא ההסכמה.** אדם שסימן `can` על יום שלישי 14:00‑18:00 נתן בכך
הסכמה להישבץ שם — לא הבטחה שישובץ, ולא חובה להיות פנוי לכל השאר.

נובע מכך: **חור במשמרת לעולם לא נפתר בשיבוץ כפוי.** הוא נפתר בגיוס (§7).
מערכת שמסוגלת לשבץ מישהו שלא הסכים היא לא רקמה.

### 1.2 אין "לא" מוחלט — גם בסידור

קונטרה לשיבוץ היא **החלפה** (swap) עם חבר אחר, או **שחרור** (release) שמחזיר
את המשמרת למאגר ומודיע למספר 2. אין כפתור "אני מסרב לסידור הזה" שמפיל את כל
הסידור לכולם. "לא מתאים לי המשמרת הזאת" מתבטא כשחרור, לא כווטו.

### 1.3 שתיקה היא הסכמה — אבל בקצב של המחזור, לא של `restime`

`restime` המקסימלי ברקמה הוא שבוע ([`Enum_Project_Restime`](../src/generated/graphql.ts):
`feh`=48ש', `sth`=72ש', `nsh`=96ש', `sevend`=שבוע). מחזור שיבוץ שבועי לא יכול
להמתין שבוע. לכן:

- **לסידור עצמו יש שעון משלו** — `rosterPeriod.closesAt`. הטיוטה מתפרסמת,
  חלון ההתנגדות נפתח, ובסגירה מה שעומד על השולחן מאושר.
- **ל‑Decision שנפתח בתוך המחזור** (החלפה, שינוי תנאים) הדדליין הוא
  `min(restime, closesAt)` — אף פעם לא מעבר לסגירה.

### 1.4 התפוסה נגזרת, לא נשמרת

בדיוק כמו ב‑[`availability.ts`](../src/lib/resources/availability.ts): מה שנשמר
הוא **ההצהרות והשיבוצים**. "המשמרת מאוישת" / "לפלוני מגיעות 4 משמרות" / "יש חור"
— כולם מחושבים. כל cache (למשל מאזן ההוגנות) מסומן במפורש כ‑cache, והמודול
הטהור נשאר המקור.

### 1.5 השיבוץ חייב להיות **מוסבר**

בלי הכרעת רוב ובלי מנהל, הדבר היחיד שמחזיק שיבוץ הוא שכולם מבינים למה הוא יצא
כך. לכן כל שיבוץ נושא `reason` — קוד סיבה שה‑UI מתרגם למשפט
("קיבלת את זה כי היית 2 משמרות מתחת למכסה שלך, וסימנת 'רוצה'"). אלגוריתם
שאי אפשר להסביר אותו בשורה אחת לחבר רקמה — פסול, גם אם הוא אופטימלי.

### 1.6 הכל דטרמיניסטי וניתן לשחזור

אותו קלט ⇒ אותו סידור, תמיד. שוברי־שוויון אקראיים מקבלים `seed` **שנשמר**
על `rosterPeriod`. אפשר להריץ מחדש ולהראית בדיוק את אותה תוצאה — אחרת
"המערכת החליטה" הופך ל"המערכת שרירותית".

### 1.7 גיוס מוצע ומתבגר בשתיקה — צמצום ביקוש הוא החלטה

פתיחת המשימה מחדש לגיוס אדם נוסף לא כופה דבר על אף אחד — אבל היא כן משנה את
הצוות, ולכן היא **לא שקטה**: חור מייצר כרטיס עם שתי דרכים לסגור אותו —
"אני אקח את החלון" או "לפתוח את המשימה למועמד נוסף" (§7.1). מי שלוקח סוגר את
הכרטיס לכולם; **שתיקה עד הסגירה = פתיחה מחדש**, כך שהערובה "תמיד נוכל לאייש"
נשמרת גם אם איש לא ענה.

לעומת זאת "בואו נסגור בשישי" משנה את תנאי המשימה שהרקמה אישרה, ולכן היא
`editObject` על ה‑OpenMission — קונצנזוס מלא.

---

## 2. חלק א' — משימה שצריכה כמה אנשים (`howMeny`)

עצמאי לגמרי מהמשמרות, בעל ערך בפני עצמו, ותנאי מקדים להן.

### 2.1 המודל

`OpenMission.howMeny` = כמה אנשים דרושים. `filled` = מספר ה‑`Mesimabetahalich`
הפעילים שקשורים ל‑OpenMission הזה. שניהם קיימים כבר — הקשר הוא
`Mesimabetahalich.open_missions` (רבים־לרבים), ומהצד השני
`OpenMission.mesimabetahaliches`.

מודול טהור חדש, [`src/lib/missions/headcount.ts`](../src/lib/missions/headcount.ts):

```ts
export interface HeadcountView {
  need: number;        // howMeny ?? 1
  filled: number;      // mesimabetahaliches פעילים (lifecycle != archived, !finnished)
  remaining: number;   // max(0, need - filled)
  isFull: boolean;     // remaining === 0
  candidates: number;  // asks לא מארכבים
  shortfall: number;   // max(0, remaining - candidates) — כמה עוד צריך לגייס
}
export function computeHeadcount(openMission: OpenMissionLike): HeadcountView;
```

חשוב: הסינון על `lifecycle` חייב להיות
`or: [{lifecycle:{null:true}}, {lifecycle:{ne:"archived"}}]` — `ne` בודד מסנן
החוצה שורות NULL ויסתיר כל משימה ישנה (CLAUDE.md, PLAN_OBJECT_ARCHIVAL).

### 2.2 השינוי בפינלייזרים

בשני הקבצים, במקום `updateOpenMission(archived: true)` ללא תנאי:

```
view = computeHeadcount(openMission)   // לפני יצירת ה-Mesimabetahalich
willBeFilled = view.filled + 1
archiveOpenMission = willBeFilled >= view.need
archiveSiblingAsks = archiveOpenMission
```

- `archiveOpenMission === false` ⇒ ה‑OpenMission נשאר `archived: false`, ממשיך
  להופיע בלוח הפתוח, ב‑lev ובשידוכים; **בקשות ההצטרפות האחרות נשארות בתוקף**
  ורק ה‑Ask של המתקבל מתארכב.
- `archiveOpenMission === true` ⇒ בדיוק ההתנהגות של היום.

### 2.3 מירוץ (race) — שניים מתקבלים בו־זמנית

שני מאשרים שלוחצים יחד על שני מועמדים שונים במשימה עם `remaining: 1` יכולים
ליצור שני Mesimabetahalich. GraphQL של Strapi לא נותן טרנזקציה.

ההכרעה: **לא נחסום — נדווח.** המצב `filled > need` הוא לגיטימי־אך־חריג;
הכרטיס יראה "5 מתוך 4 — יותר ממה שתוכנן", והרקמה תחליט (זה לא נזק: אף אחד לא
נפגע מכך שהצטרף אדם נוסף לצוות). חסימה כאן הייתה מצריכה נעילה אופטימית בשדה
גרסה שאין לנו, ומחיר הטעות ההפוכה — דחיית אדם שאמרו לו "כן" — גרוע בהרבה.
שדה `overfilled` נגזר במודול הטהור וה‑UI מציג אותו בעדינות.

### 2.4 שחרור מקום — הכיוון ההפוך

כשחבר עוזב משימה (`archiveObject`/`released` לפי PLAN_OBJECT_ARCHIVAL),
`filled` יורד. אם ה‑OpenMission כבר מארכב — הוא **נפתח מחדש**.

**זה כבר קיים** (נמצא בזמן ביצוע P1):
[`reopenOpenMission`](../src/lib/server/archive/apply.ts#L290) רץ בכל
`scope === 'release'` על `missionInProgress` וכותב
`archived: false, isRishon: false, rishon: null, lifecycle: active`.
`archive` (לא `release`) לא פותח מחדש — ובצדק: שם הצורך עצמו בוטל.
לכן `reopenMissionSlot` שתוכנן כאן **לא נבנה**. מה שעוד חסר: הרצה מחדש של
[`matchOpenMissionToUsers`](../src/lib/server/matching/engine.ts) אחרי הפתיחה,
כדי שמועמדים חדשים יקבלו הצעה — נדחה ל‑P7 יחד עם כרטיס החור.

### 2.5 שעות, ערך ואקוויטי — ההכרעה שחייבת להיאמר בקול

`OpenMission.noofhours` היום הוא מספר יחיד. עם `howMeny: 4` — האם זה 10 שעות
לכל אחד או 10 שעות סה"כ?

**ההכרעה: `noofhours` הוא לאדם.** זה מה שהפינלייזר כבר עושה בפועל —
הוא מעתיק `hoursassinged: finalNhours` לכל Mesimabetahalich בנפרד
([`finalizeJoinAcceptance.ts:190`](../src/lib/server/actions/configs/finalizeJoinAcceptance.ts#L190)),
כלומר עם `howMeny: 4` הרקמה כבר מתחייבת ל‑4×10 שעות. הכלל רק נאמר במפורש,
והטופס חייב לכתוב אותו: **"שעות לאדם"**, ולידו "סה"כ לרקמה: 40 שעות ×
₪X = ₪Y" — דרך [`EquityPreview`](../src/lib/components/equity/EquityPreview.svelte)
הקיים, כי זו הדילול האמיתי שהמצביעים מאשרים.

### 2.6 תצוגה

כל מקום שמציג משימה פתוחה מקבל "N מתוך M מאוישים": כרטיסי lev
([`sugestma.svelte`](../src/lib/components/lev/cards/sugestma.svelte),
[`pma.svelte`](../src/lib/components/lev/cards/pma.svelte)), הלוח הפתוח
([`OpenBoard.svelte`](../src/lib/components/prPr/open/OpenBoard.svelte)), עמוד
המשימה, וכרטיסי הגילוי
([`normalizeCards.ts`](../src/lib/server/discovery/normalizeCards.ts) —
שם `howMany` כבר עובר, רק `filled` חסר).

---

## 3. חלק ב' — מודל המשמרות: סכימת Strapi

נוצר ב‑`1.0b` (ריפו ה‑Strapi). חמש קולקציות. **שימו לב:** קולקציה חדשה דורשת
שתי הרשאות — תפקיד `Authenticated` **וגם** ה‑API token
(`project_strapi_new_collection_permissions`), ו‑`validate:qids` בודק רק
מוטציות, כך ששדה שגוי בשאילתה עובר בשקט.

### 3.1 `shift-plan` — תכנית האיוש

מה שהרקמה אישרה: "המשימה הזאת צריכה איוש בשעות האלה". יושבת על ה‑OpenMission,
ושורדת אחרי שהמשימה מאוישת.

```jsonc
{
  "options": { "draftAndPublish": false },   // תכנית פעילה אין לה טיוטה
  "attributes": {
    "project":      { "relation": "manyToOne", "target": "api::project.project" },
    "open_mission": { "relation": "manyToOne", "target": "api::open-mission.open-mission" },
    "mission":      { "relation": "manyToOne", "target": "api::mission.mission" },
    "name":         { "type": "string" },
    "pattern":      { "type": "json" },      // §3.6
    "timezone":     { "type": "string", "default": "Asia/Jerusalem" },
    // כל שדות הזמן nullable, בלי default: NULL = ירושה מ-Project (§3.7), ומשם
    // לקבוע בקוד (7 / 28 / 48 / 24 / 21). default כאן היה מבטל את דריסת הרקמה.
    "cycleDays":         { "type": "integer", "min": 1 },
    "horizonDays":       { "type": "integer", "min": 1 },
    "closeOffsetHours":  { "type": "integer", "min": 0 },
    "draftWindowHours":  { "type": "integer", "min": 0 },
    "declareOpenDays":   { "type": "integer", "min": 1 },
    "maxBackups":   { "type": "integer" },    // NULL = כל מי שזמין מקבל דרגה (§6.3)
    "minRestHours": { "type": "integer" },
    "fairness":     { "type": "enumeration", "enum": ["commitments","manual"], "default": "commitments" },  // §6.2
    "carryDecay":   { "type": "decimal", "default": 0.5 },
    "balanceCache": { "type": "json" },      // cache בלבד — §6.5
    "lifecycle":    { "type": "enumeration", "enum": ["active","archiveProposed","archived","released"] },
    "status":       { "type": "enumeration", "enum": ["active","paused"], "default": "active" },
    "archived":     { "type": "boolean", "default": false }
  }
}
```

### 3.2 `shift` — משמרת קונקרטית

```jsonc
"attributes": {
  "shift_plan":   { "relation": "manyToOne", "target": "api::shift-plan.shift-plan" },
  "project":      { "relation": "manyToOne", "target": "api::project.project" },
  "roster_period":{ "relation": "manyToOne", "target": "api::roster-period.roster-period" },
  "start": { "type": "datetime", "required": true },
  "end":   { "type": "datetime", "required": true },
  "slotKey": { "type": "string", "unique": true },   // "<planId>|<startISO>" — ה-materializer לעולם לא מכפיל
  "need":  { "type": "integer", "default": 1, "min": 1 },
  "state": { "type": "enumeration",
             "enum": ["open","rostered","running","done","cancelled"], "default": "open" },
  "tafkidim": { "relation": "manyToOne", "target": "api::tafkidim.tafkidim" },  // משמרת של תפקיד מסוים
  "note":  { "type": "text" }
}
```

`draftAndPublish: false`. משמרת שבוטלה נשארת כשורה (`cancelled`) — למחוק אותה
זה למחוק את ההיסטוריה שעליה נשען מאזן ההוגנות.

### 3.3 `shift-availability` — הצהרת זמינות

```jsonc
"attributes": {
  "shift":  { "relation": "manyToOne", "target": "api::shift.shift" },
  "users_permissions_user": { "relation": "manyToOne", "target": "plugin::users-permissions.user" },
  "shift_plan": { "relation": "manyToOne", "target": "api::shift-plan.shift-plan" },
  "project":    { "relation": "manyToOne", "target": "api::project.project" },
  "stance": { "type": "enumeration", "enum": ["want","can","ifNeeded","cannot"], "required": true },
  "prefRank":   { "type": "integer" },     // הסדר של החבר עצמו בתוך המחזור
  "declKey":    { "type": "string", "unique": true },  // "<shiftId>|<userId>" — הצהרה אחת לאדם למשמרת
  "declaredAt": { "type": "datetime", "required": true },
  "note":       { "type": "text" }
}
```

- **`declaredAt` מפורש ולא `createdAt`** — כי שינוי עמדה צריך לאפס את שובר
  השוויון "מי הצהיר קודם", אחרת אפשר להצהיר `cannot` מוקדם ולהפוך ל‑`want`
  ברגע האחרון עם בכורה של מי שהקדים.
- ארבע עמדות ולא שלוש: `ifNeeded` הוא "אני מעדיף שלא, אבל אל תשאיר חור בגללי".
  בלעדיו אנשים משקרים `can` — ואז המערכת לא יודעת מה באמת רצוי.
- `prefRank` הוא **הסוכנות שהמשתמש ביקש**: מתוך כל מה שסימנתי `can`, אלה
  הבחירות הראשונות שלי. זה מה שקובע *על אילו* משמרות ה"מספר 1" שלי מושקע (§6.3).

### 3.4 `roster-period` — מחזור שיבוץ

```jsonc
"attributes": {
  "shift_plan": { "relation": "manyToOne", "target": "api::shift-plan.shift-plan" },
  "project":    { "relation": "manyToOne", "target": "api::project.project" },
  "start":    { "type": "datetime", "required": true },
  "end":      { "type": "datetime", "required": true },
  "closesAt": { "type": "datetime", "required": true },
  "state":    { "type": "enumeration",
                "enum": ["open","draft","closed","cancelled"], "default": "open" },
  "draftedAt": { "type": "datetime" },
  "closedAt":  { "type": "datetime" },
  "periodKey": { "type": "string", "unique": true },  // "<planId>|<startISO>"
  "seed":      { "type": "string" },       // שובר־שוויון משוחזר — §1.6
  "holes":     { "type": "integer", "default": 0 },
  "quotaSnapshot": { "type": "json" },     // המכסות שחושבו, לתצוגה ולביקורת
  "timegrama": { "relation": "oneToOne", "target": "api::timegrama.timegrama" }
}
```

### 3.5 `shift-assignment` — השיבוץ

```jsonc
"attributes": {
  "shift":      { "relation": "manyToOne", "target": "api::shift.shift" },
  "users_permissions_user": { "relation": "manyToOne", "target": "plugin::users-permissions.user" },
  "roster_period": { "relation": "manyToOne", "target": "api::roster-period.roster-period" },
  "shift_plan": { "relation": "manyToOne", "target": "api::shift-plan.shift-plan" },
  "project":    { "relation": "manyToOne", "target": "api::project.project" },
  "mesimabetahalich": { "relation": "manyToOne", "target": "api::mesimabetahalich.mesimabetahalich" },
  "rank":   { "type": "integer", "required": true },   // 1 = ראשי, 2/3 = גיבוי
  "state":  { "type": "enumeration",
              "enum": ["draft","confirmed","released","done"], "default": "draft" },
  "source": { "type": "enumeration",
              "enum": ["auto","swap","volunteer","cover"], "default": "auto" },
  "reason": { "type": "string" },        // קוד הסבר — §6.6
  "releasedAt": { "type": "datetime" },
  "releaseReason": { "type": "text" },
  "coveredFor": { "relation": "oneToOne", "target": "api::shift-assignment.shift-assignment" },
  "timer": { "relation": "oneToOne", "target": "api::timer.timer" }   // §10
}
```

אין `noShow`. אדם שלא הגיע — השיבוץ נשאר `confirmed` ולא הפך ל‑`done`;
המערכת לא מדביקה תווית שיפוטית על בן אדם.

### 3.6 מבנה ה‑`pattern`

```jsonc
{
  "version": 1,
  "weeks": 1,                  // 1 = שבועי; 2 = מחזור דו-שבועי
  "days": [
    { "dow": 0, "windows": [ { "start": "11:00", "end": "15:00", "need": 2 },
                             { "start": "15:00", "end": "19:00", "need": 1 } ] },
    { "dow": 5, "windows": [] }        // שישי סגור
  ],
  "exceptions": [
    { "date": "2026-10-02", "windows": [] }          // חג — סגור
  ]
}
```

`dow` 0=ראשון. חלון שחוצה חצות (`22:00`→`02:00`) מזוהה לפי `end <= start`
ומתגלגל ליום הבא — חייב טסט ייעודי.

### 3.7 פרמטרים ברמת הרקמה

כמו `dormancyDays` ו‑`stipendPolicy`, גם כאן ברירות מחדל יושבות על `Project`
ולכל תכנית יש דריסה:

| שדה על `Project` | ברירת מחדל אם NULL |
|---|---|
| `shiftCycleDays` | 7 |
| `shiftCloseOffsetHours` | 48 |
| `shiftDraftWindowHours` | 24 |

**NULL = legacy = ברירת המחדל**, וכל סינון חייב `or: [{null:true}, …]`.

### 3.8 התחייבות משמרות — תנאי של ההשמה, לא הצהרה חופשית

**ההכרעה שלך (שינוי מול ההמלצה המקורית, §14 #3).** כל מועמד אומר, כשהוא
מצטרף, כמה משמרות הוא מתחייב אליהן במחזור: "אני סגור רק על 2 בשבוע" או "אני
רוצה עד 7 בשבוע". זה **תנאי של ההשמה** — בדיוק כמו שעות ותעריף — ולא העדפה
שמשנים בלחיצה:

| שלב | איפה זה חי | איך משתנה |
|---|---|---|
| בקשת הצטרפות | `Ask.shiftsMin` / `Ask.shiftsMax` | המועמד מציע |
| משא ומתן | `Negopendmission.shiftsMin` / `shiftsMax` (סבב) | קונטרה, כמו שעות/תעריף |
| אחרי ההשמה | `Mesimabetahalich.shiftsMin` / `shiftsMax` | הפינלייזר מעתיק מהסבב האחרון, כמו `hoursassinged` |
| שינוי בהמשך | סבב `negoarch` של [`proposeObjectEdit`](../src/lib/server/actions/configs/proposeObjectEdit.ts) (`editObject`, `mode: 'keep'`) | הצבעה ברקמה — אותו מסלול כמו הוספת שעות או עדכון תעריף |

כל ארבעת השדות `integer`, nullable. **NULL = אין התחייבות מוצהרת** ⇒ המינימום
0 והמקסימום לא מוגבל (מלבד הזמינות בפועל). בסכימה: שני שדות על `Ask`, על
`Negopendmission` ועל `Mesimabetahalich`, ושני שדות ברכיב
`ComponentDesisionNegoarch` כדי ש‑`proposeObjectEdit` יוכל לשאת אותם.

**שתי שכבות שלא מתערבבות:**
- **התחייבות** (כמה) — תנאי השמה, קונצנזוס, משתנה רק בהצבעה.
- **זמינות** (אילו) — `shift-availability` (§3.3), הצהרה חופשית ומתמשכת של
  האדם על עצמו.

מי שהתחייב ל‑2 אבל סימן `can` על 5 משמרות — ישובץ ל‑2 מתוכן לכל היותר
כמספר 1, ובשאר יהיה גיבוי. מי שהתחייב ל‑4 וסימן `can` רק על 1 — **לא ישובץ
בכוח לשלוש הנוספות** (§1.1). הפער מוצג לו ("התחייבת ל‑4, הצהרת זמינות ל‑1")
ולרקמה, אבל אינו הופך לשיבוץ.

**התחייבות גבוהה היא המנוע של סגירת חורים.** מי שהתחייב ל‑7 ושובץ ל‑4 הוא
הראשון שמקבל את כרטיס החור (§7.1) — "יש לך עוד 3 שהתחייבת אליהן, והחלון הזה
פתוח".

---

## 4. מה לא נבנה — והחלופות שנשקלו

| רעיון | למה לא |
|---|---|
| טבלת `shift_slot` (שורה לכל ראש נדרש) במקום `need` | מכפילה שורות פי 3‑5, ומחייבת מחיקה/יצירה בכל שינוי `need`. ה‑flatten נעשה בזיכרון במודול הטהור. |
| הרחבת `Act` (משימת צ'קליסט) למשמרת | `Act` הוא פריט עבודה עם `naasa`; למשמרת יש קיבולת, דירוג, וזמינות מוצהרת. הצפה של `Act` הייתה מרעילה את כל לוח הקנבן. |
| שימוש ב‑`resource-booking` הקיים | הוא על תפוסת **משאב** (`Sp`), לא על זמן של אדם. המודל דומה מאוד — ולכן §6 מחקה את הארכיטקטורה שלו — אבל המשמעות הפוכה: שם הזמנה *תופסת*, כאן הצהרה *מציעה*. |
| `Monter` כמחזור השיבוץ | `Monter` הוא מונה מחזורי למשימה קבועה (שעות/תשלום), לא חלון שיבוץ. נשאיר אותו לתפקידו; `roster-period` חי לצידו. |
| מאזן הוגנות כשדה מצטבר על המשתמש | מצב שנשמר ולא ניתן לשחזור. מחושב מהשיבוצים הסגורים, עם cache מסומן. |

---

## 5. ספריית לוח השנה — הכרעה נקייה

הדרישה: לחשוב מאפס מה נכון, ולא להיגרר ל‑`@event-calendar` רק כי הוא מותקן.

### 5.1 מה באמת צריך לצייר

| מסך | היחידה | האם זה "לוח אירועים"? |
|---|---|---|
| הצהרת זמינות | תא בדיד: (יום × חלון) עם 4 מצבים | **לא.** זה טופס בצורת רשת. |
| הסידור השבועי | תא בדיד עם 1‑3 שמות מדורגים + תג קיבולת | **לא.** אירוע אחד לא מתאר תא עם need:2 ו‑rank 1/2/3. |
| "המשמרות הבאות שלי" (חוצה־רקמות) | רשימה כרונולוגית | לא. רשימה. |
| שכבת־על חודשית חופשית | אירועים אמיתיים | כן — וזה המסך היחיד. |

שלושה מתוך ארבעה המסכים אינם לוח אירועים. הם **רשת של תאים עם קיבולת**.

### 5.2 ההכרעה

**לבנות `ShiftGrid.svelte` משלנו** (CSS Grid), ולא להשתמש ב‑`@event-calendar`
בשלושת המסכים המרכזיים. הנימוקים, לפי סדר המשקל:

1. **RTL.** ההערה שכבר בקוד
   ([`sidur.svelte:30‑33`](../src/lib/components/prPr/sidur/sidur.svelte#L30))
   מתעדת שה‑`locale` של הספרייה מניע רק פורמט תאריכים — הכפתורים ושורת
   ה‑all‑day נשארים אנגלית, ותוקנו ידנית ב‑`buttonText`. ברקמה עברית/ערבית זה
   חוב קבוע.
2. **קיבולת ודירוג.** תא צריך להראות "2 מתוך 3 · אחריו: דנה, יואב". מודל אירוע
   לא מבטא את זה; היינו מפברקים אירועי־רפאים.
3. **מובייל.** רוב ההצהרות ייעשו בטלפון. רשת 7×N שלנו קורסת לרשימת ימים
   בשליטתנו; `time-grid` לא.
4. **`$t()`.** רכיב שלנו מתורגם לחמש השפות דרך המנגנון הרגיל.
5. **נגישות.** תא רב־מצבי צריך `role="gridcell"` + `aria-label` שמתאר מצב וקיבולת.
6. **תלות.** ~~`@event-calendar/interaction` מיובא היום **רק** ב‑`sidur.svelte`.~~ **תוקן ב‑P11:**
   `ResourceCalendar.svelte` טוען אותו דינמית, ולכן הוא נשאר (§13.12).

מה כן נשאיר לספרייה: אם וכאשר תידרש **שכבת־על חודשית חוצת־משימות**
(§9.4, שלב מאוחר) — שם `@event-calendar/day-grid` הוא בדיוק הכלי הנכון,
לקריאה בלבד.

### 5.3 מה כן נשאיל מהמערכת

- **`@internationalized/date`** (כבר תלות) לחישובי אזור זמן ו‑DST במקום
  `new Date(x.getTime() + n*60000)`. יום מעבר שעון מייצר משמרת של 3 או 5 שעות
  במקום 4 — זו שגיאת שכר, לא באג תצוגה.
- **`SveltyPicker`** לבחירת שעה בטופס — כבר בשימוש, עובד, מוכר.

---

## 6. מודולים טהורים — `src/lib/shifts/`

כולם טהורים, דטרמיניסטיים, ללא גישה לרשת, עם טסטים. הארכיטקטורה מועתקת
מ‑[`src/lib/resources/`](../src/lib/resources/).

### 6.1 `patternToShifts.ts`

`materialize(pattern, timezone, from, to) → ShiftInstance[]`

טסטים חובה: מעבר DST (שעון קיץ ישראל: מרץ/אוקטובר), חלון חוצה חצות, חריג
שמרוקן יום, מחזור דו־שבועי, אידמפוטנטיות (הרצה חוזרת לא יוצרת כפילויות —
מפתח הזהות הוא `planId|startISO`).

### 6.2 `quota.ts`

```
computeQuotas({ slots, candidates, commitments, availableCount, carryOver })
  → { quotas: Map<userId, number>, shortage: number, surplus: number, belowMin: userId[] }
```

**מעודכן לפי §3.8: המכסה היא "מילוי מים" (water‑filling) בתוך ההתחייבויות.**

1. `slots` = Σ`need` על כל המשמרות במחזור.
2. לכל חבר: `lo = shiftsMin ?? 0`, `hi = min(shiftsMax ?? ∞, availableCount)` —
   מקסימום אפקטיבי הוא גם ההתחייבות וגם כמה משמרות הוא בפועל הצהיר שהוא זמין
   אליהן. אף אחד לא מקבל מכסה שאין לו זמינות לכסות.
3. מחפשים רמה משותפת `L` כך ש‑`Σ clamp(L − carry_i, lo_i, hi_i) = slots`.
   כלומר: **כולם מקבלים אותו מספר, חוץ ממי שההתחייבות שלו מגבילה אותו
   למטה או מרימה אותו למעלה.** זה המשפט שה‑UI מציג, וזה כל ההסבר.
4. עיגול לשלמים בשיטת **השארית הגדולה** כך ש‑Σמכסות = `slots` **בדיוק**
   (עיגול נאיבי מייצר חור או עודף פנטום), בלי לחצות אף `hi_i`.
5. שני מצבי קצה, שניהם **מדווחים ולא נפתרים בכוח**:
   - `Σhi < slots` ⇒ `shortage = slots − Σhi`: אין מספיק התחייבות ברקמה כדי
     לכסות. זה ידוע **לפני** הטיוטה, ופותח את כרטיס החור (§7.1) מוקדם.
   - `Σlo > slots` ⇒ יותר התחייבות מעבודה. אף מינימום אינו זכות כלפי הרקמה —
     לא ממציאים משמרות. המכסות יורדות מתחת ל‑`lo` באופן שווה, ורשימת
     `belowMin` מוצגת כדי שאיש לא יופתע.

`carryOver` הוא חוב מסבבים קודמים: מי שלקח 2 מעל המכסה בסבב שעבר מתחיל עם
`carry = 2×carryDecay`, ולכן ה‑`L` האפקטיבי שלו נמוך יותר — אבל לעולם לא מתחת
ל‑`lo` שלו ולא מעל ה‑`hi`.

ההבדל בין `equalQuota` ל‑`weighted` שבגרסה הקודמת נעלם: ההתחייבויות *הן*
המשקל. רקמה שאף אחד בה לא הצהיר התחייבות מקבלת מכסה שווה (כל ה‑`lo=0`,
`hi=∞`) — אותה התנהגות כמו קודם.

### 6.3 `draftRoster.ts` — האלגוריתם

הלב. פונקציה אחת, דטרמיניסטית:

```ts
draftRoster({ shifts, candidates, commitments, availabilities, quotas, carryOver, seed, maxBackups, minRestHours })
  → { assignments: Draft[], holes: Hole[], quotaSnapshot, unusedCapacity }
```

**מעבר ראשון — מספר 1 לכל מקום:**

1. פורסים את המשמרות ל‑*מקומות* (`need` מקומות למשמרת).
2. בוחרים את **המקום הנדיר ביותר**: זה שלמספר הקטן ביותר של מועמדים זמינים
   (`stance != cannot`) שעוד יש להם מכסה פנויה. שוברי שוויון: מועד התחלה מוקדם,
   ואז `shiftId`. — הנדיר קודם, אחרת המועמד היחיד שיכול לשבת נלקח למשמרת קלה
   ונוצר חור מיותר.
3. בין המועמדים למקום הזה, דירוג לקסיקוגרפי:

   | # | קריטריון | למה |
   |---|---|---|
   | א | `stance`: `want`(3) > `can`(2) > `ifNeeded`(1) | רצון לפני יכולת |
   | ב | `prefRank` נמוך יותר | **הסוכנות**: האדם בחר איפה להשקיע את התור שלו |
   | ג | פער־מכסה גדול יותר (`quota − assigned`) | מי שרחוק מהחלק שלו |
   | ד | חוב `carryOver` גדול יותר | מי שקופח בסבבים קודמים |
   | ה | `declaredAt` מוקדם יותר | **תמריץ להצהיר מוקדם** |
   | ו | `hash(seed + userId + shiftId)` | אקראי יציב — לא אותו אחד לנצח |

4. מסננים קשיחים לפני הדירוג: חפיפה עם מקום שכבר קיבל, `minRestHours`,
   תפקיד (`shift.tafkidim`) אם הוגדר, **ו‑`shiftsMax` של ההשמה** (§3.8) — זו
   לא העדפה אלא תנאי שהרקמה הסכימה עליו.
5. אם אף מועמד לא נותר עם מכסה פנויה — **מעבר שני** על אותו מקום, הפעם מותר
   לחרוג מהמכסה **עד `shiftsMax` ולא מעבר לו**; הקריטריון (ג) יורד, והשיבוץ
   מסומן `reason: 'overQuota'` ונרשם ל‑`carryOver` לטובת הסבב הבא.
6. אם עדיין אין איש — **חור**. מעבר ל‑`shiftsMax` אדם נכנס רק בעצמו, דרך
   כרטיס החור (§7.1) — לעולם לא על ידי האלגוריתם.

**מעברי גיבוי (rank 2, 3, …):** אותו דירוג, בלי (ג) — להיות גיבוי אינו נתח.
במקומו נשמר `backupLoad` כשובר שוויון רך, כדי שגם הגיבויים יתפזרו.

**עומק הגיבוי נגזר, לא קבוע (ההכרעה שלך, §14 #8).** כל מי שהצהיר
`want`/`can`/`ifNeeded` על המשמרת מקבל דרגה — ברקמה של 3 זה עד rank 3,
במשימה עם 12 מועמדים זה עד rank 12. הגודל חסום מעצמו: דרגה ניתנת רק למי
שהצהיר זמינות, כך שהרשימה לעולם אינה ארוכה ממספר האנשים שבאמת יכולים לבוא.
`shift-plan.maxBackups` נשאר כשדה **אופציונלי** (NULL = ללא תקרה) לרקמה
גדולה שרוצה לקצר את שרשרת ההתראות בביטול (§7.2).

**למה זה עונה בדיוק על מה שביקשת:** "מי שקובע ראשון הוא ראשון" נכון — אבל רק
בתוך אותה דרגת־פער. (ה) הוא שובר שוויון חמישי, לא ראשון. מי שהצהיר ראשון
על *הכל* לא יקבל את הכל: המכסה עוצרת אותו, ומאותו רגע הוא מועמד רק לדרגות
הגיבוי. ומתוך המכסה שלו — **הוא** בוחר באילו משמרות להיות מספר 1, דרך `prefRank`.

### 6.4 דוגמה מלאה

3 חברים, 5 משמרות של `need: 1` בשבוע. רון הצהיר ראשון על כל החמש.

| משמרת | רון | דנה | יואב |
|---|---|---|---|
| א' 11‑15 | can (יום א, 09:00) | — | can (יום ב) |
| ב' 11‑15 | can (יום א) | can (יום ג) | — |
| ג' 11‑15 | can (יום א) | want, prefRank 1 (יום ג) | — |
| ד' 11‑15 | can (יום א) | can (יום ג) | can (יום ב) |
| ה' 11‑15 | can (יום א) | — | — |

מכסות: 5 מקומות / 3 מועמדים = 1.67 ⇒ בשיטת השארית הגדולה [דנה 2, רון 2, יואב 1]
(שלושתם באותה שארית; שובר השוויון הוא החוב ההיסטורי, ואז מזהה המשתמש).

**זו התוצאה שהאלגוריתם מפיק בפועל** — נעולה ב‑
[`draft.test.ts`](../src/lib/shifts/draft.test.ts) ("the worked example"):

| סדר | המקום הנדיר | הזוכה | הסיבה (`reason`) |
|---|---|---|---|
| 1 | ה' (מועמד אחד) | רון | `onlyCandidate` |
| 2 | א' (רון, יואב) | רון | `declaredFirst` — שניהם במרחק 1 מהמכסה; רון הצהיר קודם |
| 3 | ב' (רון מיצה מכסה ⇒ רק דנה) | דנה | `onlyCandidate` |
| 4 | ג' (רק דנה) | דנה | `onlyCandidate` |
| 5 | ד' (דנה מיצתה ⇒ רק יואב) | יואב | `onlyCandidate` |

גיבויים: א' ← יואב; ג' ← רון; ד' ← רון ודנה (rank 2, 3, בסדר מוגדר).

רון: 2 (מכסתו). דנה: 2. יואב: 1. **רון הצהיר ראשון על הכל וקיבל 2 מתוך 5** —
בדיוק החלק שלו — ובכל השאר הוא מספר 2 אוטומטית. ההצהרה המוקדמת הכריעה רק
בנקודה אחת (א'), שבה שני מועמדים היו באותו מרחק מהמכסה — כלומר היא תמריץ,
לא בעלות. זה הכשל שהתכנית נועדה למנוע.

### 6.5 `balance.ts`

מאזן מצטבר מהמחזורים הסגורים: `balance_i = Σ(assigned1_i − quota_i) × decay^age`.
נשמר cache ב‑`shift-plan.balanceCache` ומסומן במפורש כ‑cache, כמו
`Sp.panui` — המודול הטהור נשאר המקור, וה‑cache רק חוסך סריקת היסטוריה.

### 6.6 `explain.ts`

ממיר `reason` לקוד `$t()`. הקודים:
`scarcest` · `wanted` · `ownPreference` · `belowQuota` · `owed` · `declaredFirst`
· `tieBreak` · `overQuota` · `onlyCandidate` · `volunteered` · `swapped` · `cover`.

### 6.7 `coverage.ts`

מי במשמרת עכשיו, מי הבא בתור, איפה החורים, ומתי המחזור נסגר — הנגזרת שכל
ה‑UI קורא.

---

## 7. מחזור החיים של מחזור שיבוץ

```
                    ┌────────── declareOpenDays ──────────┐
 פתיחה           הצהרות זורמות                  T−closeOffset      T = תחילת המחזור
   │                                                  │                  │
 open ────────────────────────────────────────────► draft ──────────► closed
   │                                            (טיוטה פורסמה)   (closesAt = T−offset+window)
   │                                                  │
   └── חבר מצהיר want/can/ifNeeded/cannot             └── חלון התנגדות: שחרור / החלפה / התנדבות לחור
```

1. **`open`** — נפתח `horizonDays` מראש. חברים מצהירים, בכל רגע, על כל משמרת
   בטווח. אין "טופס שבועי" חובה: ההצהרה היא זרם מתמשך (בדיוק כפי שביקשת —
   "כל אחד יכול כל הזמן להודיע לגבי העתיד").
2. **`draft`** — `closeOffsetHours` לפני תחילת המחזור, cron מריץ `draftRoster`
   וכותב `shift-assignment` במצב `draft`. לכל מועמד נשלח כרטיס lev
   (`shiftDraft`) עם הסידור שלו **וההסבר**.
3. **חלון ההתנגדות** (`draftWindowHours`) — שלוש פעולות, אף אחת מהן לא ווטו:
   - **שחרור** — מחזיר את המקום למאגר מיידית, מקדם את rank 2, ומודיע לו.
   - **החלפה** — `Decision` דו־צדדי `kind: 'shiftSwap'` בין שני החברים בלבד.
     מתבגר בהסכמה הדדית או בשתיקה — לפי `min(restime, closesAt)`.
   - **התנדבות לחור** — `claimShiftHole`, מיידי, בלי הצבעה (אף אחד לא נפגע).
4. **`closed`** — ב‑`closesAt` ה‑timegrama מבשיל: כל `draft` הופך ל‑`confirmed`,
   מחושב `holes`, מתעדכן `carryOver`, ונשלחת הודעת "הסידור נסגר".
5. **`cancelled`** — התכנית עברה ל‑`paused`/`archived` באמצע.

**השעון:** `whatami: 'rosterPeriod'` ב‑Timegrama. חובה להוסיף אותו גם
ל‑`HANDLED_KINDS` וגם ל‑`RELATION_FIELDS` ב‑[`+server.js`](../src/routes/api/timegrama/+server.js)
— relation שנשכח מהרשימה נראה בדיוק כמו יעד שנמחק, והשעון ייסגר בטעות.
כלל זה מתועד ב‑[`PLAN_TIMEGRAMA.md`](./PLAN_TIMEGRAMA.md) §6.

### 7.1 סולם החורים — אף שלב אינו כפייה

| שלב | מתי | מה קורה |
|---|---|---|
| 1 | בטיוטה | `ifNeeded` מקודם ל‑`can` ומשובץ |
| 2 | בטיוטה, או מוקדם יותר כש‑`shortage > 0` (§6.2) | **כרטיס החור** (למטה) |
| 3 | בטיוטה | הודעה למועמדים שה‑`Ask` שלהם עדיין עומד (בזכות §2.2) |
| 4 | בסגירה, איש לא ענה על הכרטיס | **שתיקה = פתיחה מחדש**: `howMeny` גדל במספר החורים, המשימה נפתחת לגיוס, והשידוך רץ (§1.7) |
| 5 | חור באותו חלון ב‑K מחזורים (ברירת מחדל 3) | המערכת **מציעה** `editObject` על ה‑OpenMission: "החלון הזה לא מתמלא — לצמצם?" קונצנזוס מלא, אף פעם לא אוטומטי |

**כרטיס החור (`ani: 'shiftHole'`) — ההכרעה שלך, §14 #7.** הכרטיס מציג שתי
אפשרויות, ושתיהן סוגרות אותו:

| כפתור | מה קורה | מתי הכרטיס נסגר |
|---|---|---|
| **"אני אקח את החלון"** | `claimShiftHole` — שיבוץ מיידי, `source: 'volunteer'`. מותר גם מעבר ל‑`shiftsMax` — אדם רשאי תמיד לבחור לעשות יותר ממה שהתחייב, רק האלגוריתם לא רשאי לבחור את זה בשבילו. | **מיד, אצל כולם** — החור נסגר |
| **"לפתוח את המשימה למועמד נוסף"** | אישור להצעת הפתיחה מחדש שכבר עומדת על השולחן | בסגירת המחזור, או מוקדם יותר אם כל חברי המשימה אישרו |

- **מי מקבל את הכרטיס:** כל חברי המשימה. מי שיש לו מרווח התחייבות
  (`shiftsMax − assigned > 0`) רואה אותו **ראשון ובולט**, עם המשפט "התחייבת
  ל‑7, שובצת ל‑4 — החלון הזה פתוח". זה המנגנון שהופך התחייבות גבוהה למילוי
  חורים (§3.8). אם אין אף אחד כזה, הכרטיס עולה גם לשאר חברי הרקמה.
- **ההצעה העומדת היא פתיחה מחדש**, כך ששתיקה מבשילה אותה בסגירה (שלב 4). אף
  אחד לא צריך "להגיד כן" כדי שהגיוס יקרה — רק כדי שיקרה מוקדם יותר.
- **אין כפתור "אין צורך"** על הכרטיס. צמצום הביקוש (לסגור את החלון מהדרישה)
  משנה את תנאי המשימה ולכן הוא `editObject` נפרד — שלב 5, או ידני.

### 7.2 ביטול ברגע האחרון

זה בדיוק מה שדרגות הגיבוי נועדו לו. `releaseShiftAssignment` על משמרת
`confirmed`:
1. rank 2 מקבל התראה דחופה (socket + מייל) עם קבלה/דחייה בלחיצה.
2. לא ענה תוך `min(2h, עד תחילת המשמרת)` → rank 3, וכן הלאה לאורך כל
   השרשרת (עומק נגזר, §6.3; `maxBackups` אם הוגדר).
3. השרשרת נגמרה → כרטיס החור (§7.1), במצב דחוף.
4. השחרור **מזכה** את המשחרר לרעה במאזן (הוא לא לקח את הנתח), ומזכה לטובה את
   המכסה על המחליף. בלי קנסות ובלי "ציון אמינות" — המאזן הוא חשבונאות, לא שיפוט.

---

## 8. Server Actions

כולן ב‑[`src/lib/server/actions/configs/`](../src/lib/server/actions/configs/)
ורשומות ב‑`registry.ts`. כתיבה עוברת **רק** דרך מערכת הפעולות.

| פעולה | authRules | מה עושה |
|---|---|---|
| `createShiftPlan` | `jwt`, `projectMember` | יוצרת תכנית על OpenMission + מממשת אופק ראשון |
| `updateShiftPlan` | `jwt`, `projectMember` | שינוי דפוס. **אם המשימה כבר מאוישת — פותח `editObject`** (PLAN_OBJECT_ARCHIVAL), לא כותב ישירות |
| `pauseShiftPlan` / `resumeShiftPlan` | `jwt`, `projectMember` | השהיה זמנית |
| `declareShiftAvailability` | `jwt`, **`self`** | ההצהרה של אדם על עצמו. `self` מוודא שה‑userId בפרמטר = `context.userId` |
| `setShiftPreferences` | `jwt`, `self` | `prefRank` בלבד. כמה משמרות (`shiftsMin`/`shiftsMax`) **אינו** העדפה אלא תנאי השמה — משתנה רק דרך `proposeObjectEdit` (§3.8) |
| `releaseShiftAssignment` | `jwt`, `self` | שחרור + קידום גיבוי |
| `claimShiftHole` | `jwt`, `projectMember` | התנדבות לחור פתוח — "אני אקח את החלון" בכרטיס החור. מותר גם מעבר ל‑`shiftsMax`: אדם בוחר לעשות יותר; רק האלגוריתם לא רשאי (§7.1) |
| `proposeShiftSwap` | `jwt`, `self` | פותח `Decision kind:'shiftSwap'` דו־צדדי |
| `decideShiftSwap` | `jwt`, `custom` (רק שני הצדדים) | הסכמה/קונטרה |
| ~~`reopenMissionSlot`~~ | — | **לא נבנה** — `reopenOpenMission` ב‑`archive/apply.ts` כבר עושה את זה (§2.4) || **`runRosterDraft`** | `serviceAdmin` | cron בלבד |
| **`closeRosterPeriod`** | `serviceAdmin` | cron / timegrama |
| **`materializeShifts`** | `serviceAdmin` | הרחבת האופק |

שלוש האחרונות חיות ב‑`/api/cron/shifts` (GET מוגן בסוד) ולא נגישות ללקוח.

**מלכודת ידועה:** `/api/send` מחליף את `$idL` למשתמש הנוכחי **גם** בקריאות
`isSer` — job שרץ מה‑cron יקבל משתמש ריק מ‑qid שמשתמש ב‑`$idL`. לכל qid שנדרש
גם ל‑cron צריך תאום עם `$uid` מפורש, מוגבל ל‑`serviceAdmin` ב‑`qidsDigest.js`
(ראה `project_send_idl_rebound_on_service`).

---

## 9. QIDs ו‑UI

### 9.1 QIDs

| מזהה | מה מחזיר |
|---|---|
| `2xx shiftBoard` | תכנית + משמרות בחלון + שיבוצים + הצהרות, לפרויקט |
| `2xx myShiftDeclarations` | ההצהרות שלי (`$idL`) בטווח |
| `2xx rosterPeriodDetail` | מחזור בודד: מכסות, שיבוצים, חורים, מצב |
| `2xx myUpcomingShifts` | המשמרות הבאות שלי, חוצה־רקמות |
| `2xx shiftsForRoster` | **תאום `$uid`, `serviceAdmin`** — לשימוש ה‑cron |

### 9.2 רכיבים חדשים — `src/lib/components/shifts/`

| רכיב | תפקיד |
|---|---|
| `ShiftGrid.svelte` | הרשת המשותפת: יום × חלון, מצבי תא, RTL, מובייל |
| `AvailabilityGrid.svelte` | `ShiftGrid` במצב הצהרה — לחיצה מחזורית want→can→ifNeeded→cannot |
| `RosterGrid.svelte` | `ShiftGrid` במצב קריאה — שמות מדורגים, תג קיבולת, חורים באדום |
| `ShiftPlanForm.svelte` | הטופס המעוצב מחדש (§9.5) |
| `ShiftExplain.svelte` | "למה קיבלתי את זה" — מ‑`explain.ts` |
| `FairnessBar.svelte` | מכסה מול בפועל, לכל חבר |
| `HolesPanel.svelte` | החורים + כפתור התנדבות |

### 9.3 מסכים

- **`/moach/[pid]/shifts`** — מחליף את `sidur.svelte`. ארבעה טאבים:
  *הסידור* · *הזמינות שלי* · *הוגנות ומאזן* · *הגדרות*. כותרת: מצב המחזור
  וספירה לאחור לסגירה.
- **`/me/shifts`** — "המשמרות הבאות שלי" חוצה־רקמות.
- **תג בניווט** — מספר המשמרות שטרם הצהרתי עליהן + חורים פתוחים.

### 9.4 כרטיסי lev

לפי [`HOWTO_ADD_LEV_OBJECT.md`](./HOWTO_ADD_LEV_OBJECT.md) ו‑[`LEV_CARD_CONVENTIONS.md`](./LEV_CARD_CONVENTIONS.md),
וכל `ani` חדש חייב גם רישום ב‑`cardKinds.js` (שלושת מצבי התצוגה:
רשימה/כרטיסים/מטבעות — `project_lev_view_modes`):

| `ani` | מתי | פעולות |
|---|---|---|
| `shiftDeclare` | מחזור נפתח ולא הצהרתי | "הצהר זמינות" |
| `shiftDraft` | טיוטה פורסמה | אישור · שחרור · הצע החלפה · שיחה |
| `shiftHole` | חור פתוח | התנדב · שוחח |
| `shiftSwap` | הוצעה לי החלפה | הסכם · קונטרה · שיחה (דו־צדדי) |
| `shiftStarting` | המשמרת שלי מתחילה | התחל טיימר |

**חובה:** עטיפת מודאלים ב‑`<Portal>` מ‑`bits-ui` — ה‑transform של Swiper כולא
`position: fixed` (`project_lev_overlay_portal`). והשעון המשותף הוא
`$lib/stores/clock.svelte.ts` — לעולם לא `setInterval` בתוך כרטיס.

### 9.5 עיצוב הטופס מחדש

מחליף את הבלוק ב‑`mission.svelte` (§0.2). ארבעה צעדים, לא טבלה אחת:

**צעד 1 — האם זו משימת איוש?** מתג יחיד. כבוי (ברירת מחדל) = הכל כמו היום.

**צעד 2 — הדפוס השבועי.** **שורה ליום, לא עמודה** — 7 שורות מתקפלות למובייל.
כל יום: מתג פתוח/סגור, ורשימת חלונות (`התחלה`–`סיום`, `כמה אנשים בו־זמנית`),
עם "+ חלון". מתקן את שני הבאגים של היום: מספר החלונות הוא `windows.length`
(מקור אמת אחד), וההוספה היא כפתור מפורש ולא `onchange` על שדה מספר.

**צעד 3 — כמה אנשים צריך.** הצעד שחסר היום. המערכת מחשבת ומראה:

```
סה"כ שעות איוש בשבוע:  4×5 + 8×2 = 36 שעות
כמה שעות לאדם בשבוע?   [ 12 ]        ← המשתמש קובע
──────────────────────────────────────
דרושים  ⌈36 / 12⌉ = 3 אנשים          ← נכתב ל-howMeny, ניתן לעריכה
```

ולידו, במפורש: *"המשימה תישאר פתוחה עד שיצטרפו 3 אנשים. בקשות הצטרפות נוספות
יישארו בתוקף."* — כי זו ההתנהגות החדשה מ‑§2 והמשתמש חייב לדעת עליה **לפני**
שהוא מפרסם.

ומתחת, דרך [`EquityPreview`](../src/lib/components/equity/EquityPreview.svelte)
הקיים: החשיפה האמיתית של הרקמה = 3 × שעות לאדם × תעריף (§2.5).

**צעד 4 — מחזור וסגירה.** אורך מחזור, כמה לפני נסגר, חלון התנגדות — מלאים
מברירות המחדל של הרקמה ומקופלים. רוב המשתמשים לא יפתחו.

**תצוגה מקדימה חיה**: שבועיים קדימה ב‑`RosterGrid` במצב ריק.

**וכל הטקסטים ב‑`$t('shifts.…')`** — לא `missionByLang`. זה גם מתקן את
`ru`/`es` שחסרים היום.

---

## 10. שעות, כסף ואקוויטי

משמרת שנעבדה חייבת להפוך לשעות, אחרת האקוויטי לא משקף את העבודה.

- **ההכרעה: משמרת אינה שעות אוטומטית.** `shift-assignment.timer` מקשר
  ל‑`Timer` אמיתי. בתחילת המשמרת נשלח כרטיס `shiftStarting` עם "התחל טיימר",
  ובסופה נסגר. אם לא הופעל טיימר — בסיום המשמרת נשלחת הצעה "לרשום N שעות?"
  בלחיצה אחת, שיוצרת רישום רגיל שעובר `finiapruval` כמו כל שעה אחרת.
- **למה לא אוטומטי:** שעות מאושרות הן הבסיס לאקוויטי ולסטייפנד
  ([`PLAN_STIPEND.md`](./PLAN_STIPEND.md): "התשלום נגזר משעות **מאושרות**,
  לעולם לא מוקלדות"). זקיפה אוטומטית של שעות על סמך לוח שנה היא בדיוק הקלדה —
  היא מייצרת אקוויטי מעבודה שאיש לא אישר.
- **סטייפנד:** תכנית משמרות עם `stipendMode` ממשיכה לעבוד בלי שינוי — השעות
  שנצברות מהמשמרות נכנסות ל‑`computeStipendCycle` כמו כל שעה.

---

## 11. דגל, מיגרציה ותאימות לאחור

- **`SHIFTS` env**: `off` (ברירת מחדל) · `shadow` (הטיוטה מחושבת ונרשמת ללוג,
  לא נכתבים שיבוצים) · `on`. בדיוק כמו `RESOURCE_BOOKINGS`.
- **אין נתונים להעביר.** `sidur.svelte` הוא מוקאפ; אין שורה אחת אמיתית.
- **`isshift` קיים אך תמיד `false`** בפועל — משימות ישנות ימשיכו בדיוק כמו היום.
- **§2 (`howMeny`) הוא שינוי התנהגות אמיתי** למשימות קיימות עם `howMeny > 1`.
  צריך לספור כמה כאלה יש בפרודקשן לפני ההפעלה; אם יש — הן ייפתחו מחדש, וזו
  ההתנהגות שהמשתמשים התכוונו אליה מלכתחילה. בכל מקרה מאחורי הדגל
  `MISSION_HEADCOUNT` בשלב הראשון.
- **`@event-calendar/interaction`** מוסר מ‑`package.json` רק אחרי שעמוד
  המשמרות הוחלף.

---

## 12. בדיקות

| קובץ | מה מוודא |
|---|---|
| `patternToShifts.test.ts` | DST, חצות, חריגים, אידמפוטנטיות |
| `quota.test.ts` | Σמכסות = Σמקומות **בדיוק** (largest remainder) |
| `draftRoster.test.ts` | הדוגמה מ‑§6.4 יוצאת בדיוק; אין חפיפות; `minRestHours` נשמר |
| `draftRoster.pbt.test.ts` | fast-check: אף שיבוץ ללא הצהרה תואמת (§1.1); דטרמיניזם מלא על אותו seed; שום מועמד לא חורג מהמכסה כל עוד יש חלופה |
| `balance.test.ts` | קיזוז לאורך מחזורים, דעיכה |
| `headcount.test.ts` | NULL‑lifecycle נספר כפעיל |
| `shiftFairness.pbt.test.ts` | על פני 20 מחזורים אקראיים, פער המכסות המצטבר בין כל שני חברים חסום |

בנוסף: `npm run check` (השער), `npm run check:i18n` (namespace חדש `shifts`
צריך שער route ב‑`ROUTED`), `npm run check:script`, `npm run validate:qids`.

---

## 13. שלבי ביצוע — יומן

> כל שלב נסגר עם `npm run check` + הטסטים שלו. `[x]` = מומש (commit/deploy
> מצוין בנפרד).

- [x] **P0 — תכנון.** המסמך הזה; ההכרעות ב‑§14 סגורות 2026‑09‑22.
- [x] **P1 — `howMeny` (חלק א').** מומש 2026‑09‑22–23, **טרם commit/deploy.**
      לא דורש שינוי ב‑Strapi — כל השדות כבר קיימים. פירוט ב‑§13.1.
- [ ] **P1b — שארית P1.** תג "N מתוך M" בכרטיסי lev (מסלול
      `levDataExtractors` ושלושת מצבי התצוגה) וב‑[`normalizeCards.ts`](../src/lib/server/discovery/normalizeCards.ts)
      (גילוי); עריכת `howMeny` אחרי יצירה דרך סבב `proposeObjectEdit` (הרכיב
      `negoarch` לא נושא אותו היום); עותק ההתראה "נותרו N מקומות" (תבנית
      ההתראה של הפינלייזרים סטטית).
- [x] **P2 — סכימה ב‑1.0b.** נכתבה ונבדקה 2026‑09‑23, **טרם commit/deploy**
      (ענף `shabab`). חמש הקולקציות, שדות ה‑`Project`, שדות ההתחייבות של §3.8
      והצד של `Timegrama`. פירוט ומה שנשאר לך ב‑§13.2.
- [x] **P3 — מודולים טהורים.** `src/lib/shifts/` — 73 טסטים. פירוט ב‑§13.3.
- [x] **P4 — `ShiftGrid` + הצהרות.** שכבת השרת, `declareShiftAvailability`,
      העמוד החדש עם "הסידור" ו"הזמינות שלי". פירוט ב‑§13.4.
- [x] **P5 — מנוע הטיוטה והסגירה.** `engine.ts`, `/api/cron/shifts`, timegrama
      `roster_period`, מצב shadow, לשונית ההוגנות. פירוט ב‑§13.5.
- [x] **P6 — הטופס והתחייבות המשמרות.** תכנית האיוש נוצרת עם המשימה ומאושרת
      באותה הצבעה; ההתחייבות נאמרת בבקשה, עוברת להשמה ומשתנה בהצבעת עריכה.
      שני פערים נוספים של P1 נסגרו. פירוט ב‑§13.6.
- [x] **P7 — כרטיסי lev וסולם החורים.** שלושה `ani` (הצהרה, טיוטה, חור),
      שחרור עם הודעה לבא בתור, "אני אקח" ו"לפתוח למועמד נוסף", שתיקה = גיוס
      בסגירה. פירוט ב‑§13.8.
- [ ] **P7b — שארית P7.** שינוי תבנית המשמרות בהצבעת עריכה; הצעת `editObject`
      לחלון שלא מתמלא K מחזורים (§7.1 שלב 5).
- [x] **P8 — החלפות.** `Decision kind:'shiftSwap'` דו־צדדי: הצעה, אישור, קונטרה,
      ביטול; שתיקה משלימה רק כשהמקבל/ת כבר הצהיר/ה. פירוט ב‑§13.9.
- [ ] **P8b — שארית P8.** פורום להחלפה (`forumAccess`), היסטוריית תנאי הסבבים.
- [x] **P9 — שעות.** כרטיס `shiftStarting` (הפעלת הטיימר הרגיל + קישור), כרטיס
      `shiftLog` (רישום בדיעבד דרך `timerSave`, או "לא עבדתי"). פירוט ב‑§13.10.
- [x] **P10 — כללי קבע ו‑`/me/shifts`.** כלל = הצהרה עומדת שנגזרת בקריאה וממלאת
      רק את השתיקה; `/me/shifts` חוצה־רקמות. פירוט ב‑§13.11.
- [x] **P11 — i18n מלא.** שגיאות מקודדות (`errors.ts`), 221 מפתחות ×5, `sidur.svelte`
      נמחק. `@event-calendar/interaction` **נשאר** — `ResourceCalendar` משתמש בו. פירוט ב‑§13.12.
- [ ] **P12 — הפעלה.** `SHIFTS=on` ברקמת פיילוט אחת, מחזור אחד, סקירה. **ספר ההרצה
      כתוב (§13.13); הביצוע דורש deploy של 1.0b ושל 1.0main — בידיים שלך.**

### 13.1 P1 — מה נעשה בפועל

**הלוגיקה**

| קובץ | מה |
|---|---|
| [`src/lib/missions/headcount.ts`](../src/lib/missions/headcount.ts) | חדש, טהור. `computeHeadcount`, `effectOfAcceptance`, `holdsSeat`, `normalizeNeed`. `lifecycle` NULL = פעיל; `archiveProposed` עדיין תופס מקום (הארכוב רק הוצע); `howMeny` מגיע מ‑GraphQL כמחרוזת (`biginteger`). |
| [`headcount.test.ts`](../src/lib/missions/headcount.test.ts) | 22 טסטים. |
| [`src/lib/server/missions/headcountGate.ts`](../src/lib/server/missions/headcountGate.ts) | חדש. קורא את התפוסה (qid `327getOpenMissionHeadcount`) לפני המוטציה. **הדגל `MISSION_HEADCOUNT`**: כל ערך חוץ מ‑`off` = פעיל. `off` = ההתנהגות הישנה בדיוק, בלי deploy. קריאה שנכשלה ⇒ חזרה להתנהגות הישנה + `degraded` בלוג. |
| [`finalizeJoinAcceptance.ts`](../src/lib/server/actions/configs/finalizeJoinAcceptance.ts) | `archived: ${headcount.archiveOpenMission}` במקום `true` קשיח; בקשות אחרות מתארכבות רק כשהמשימה מלאה; ה‑`Monter` נשלח בנפרד (לא "רוכב" על איטרציית הארכוב); מחזיר `headcount` ללקוח. |
| [`finalizeAskAcceptance.ts`](../src/lib/server/actions/configs/finalizeAskAcceptance.ts) | אותו דבר, ועוד **שני תיקונים שנמצאו בדרך:** (1) ה‑`Monter` של שירות מחזורי **לא נוצר בכלל** כשהייתה בקשה אחת בלבד (`otherAsks.length > 1`) — המקרה הרגיל; (2) בווריאנט `solo` בקשות אחרות לא אורכבו אף פעם, והצביעו על משימה מארכבת. עכשיו מתנהג כמו התאום `finalizeJoinAcceptance`. |
| [`createMission.ts`](../src/lib/server/actions/configs/createMission.ts) | פרמטר `howMeny` חדש. **בלעדיו לא ניתן היה ליצור משימה לכמה אנשים מה‑UI בכלל** — `howMeny` היה תמיד NULL. במשימה מוקצית (ענף 2, הצעה לאדם מסוים) נכפה 1. |

**שאילתות** — [`qids.js`](../src/routes/api/send/qids.js): `327getOpenMissionHeadcount`
חדש (הרשאות `user` + `serviceAdmin`); `$howMeny: Long` ב‑`163createPendm` וב‑`164createOpenMission`;
`howMeny` + `mesimabetahaliches { lifecycle finnished }` ב‑`getProjectMissions` וב‑`51GetOpenMissionById`
(ללא שום relation של משתמש — אורח קורא את העמוד עם טוקן השירות); `howMeny` ב‑`pendms`.
`Pendm → OpenMission` כבר העתיק `howMeny` ב‑[`pend.svelte`](../src/routes/api/timegrama/pend.svelte#L72).

**UI**

| קובץ | מה |
|---|---|
| [`mission.svelte`](../src/lib/components/prPr/mission.svelte) | שדה "כמה אנשים דרושים?" (מוסתר במשימה מוקצית), הסבר ההתנהגות **לפני** הפרסום, "לאדם" ליד השעות, שורת "סה"כ לרקמה", ו‑`EquityPreview` מוכפל במספר המקומות (§2.5 — החשיפה האמיתית). טקסטים ב‑`$t('mission.form.…')`. |
| [`OpenMissionCard.svelte`](../src/lib/components/prPr/open/OpenMissionCard.svelte) | תג "N מתוך M" / "נותרו N מקומות" / "יותר ממה שתוכנן"; בהצעה ממתינה — "דרושים N". |
| [`OpenMissionCard.svelte.test.ts`](../src/lib/components/prPr/open/OpenMissionCard.svelte.test.ts) | 5 טסטי רינדור. |
| [`availableMission/[id]`](../src/routes/(regandnon)/availableMission/[id]/+page.svelte) | אותו תג בעמוד הציבורי — מה שמועמד רואה לפני שהוא מבקש. |
| `moach.json` ×5, `mission.json` ×5 | 5+5 מפתחות, בחמש השפות. |

**בדיקות שעברו:** `headcount` (22), רינדור (5), `nego`/`send` הקיימים (115);
`npm run check` — אפס שגיאות בקבצים שנגעתי בהם; `check:i18n`, `check:script`,
`validate:qids` נקיים. `validate:qids` לא בודק שדות של שאילתות — נבדקו ידנית
מול `STRAPI_SCHEMA_REFERENCE.md`. עמוד `/availableMission/[id]` נטען SSR
בחמש משימות קיימות: 200, בלי שגיאת GraphQL, `howMeny: null`, ובלי תג (נכון —
כולן לאדם אחד).

**לא נבדק חי:** התג עם `howMeny > 1` וההשמה עצמה מול Strapi — דורשים ליצור
משימה אמיתית לכמה אנשים ולקבל אליה שני אנשים. זה המבחן הראשון אחרי deploy.

**commit:** `e39d5e32` ב‑1.0main. ב‑`mission.svelte`, שורת ה‑`EquityPreview`
נשמרה ב‑commit כ‑`perPersonValue * seats` — העטיפה `inRikma(…)` שייכת לעבודת
ריבוי המטבעות שעדיין לא נכנסה, ונשארה רק בעץ העבודה.

**סוויטת הטסטים המלאה:** 47 כשלונות ב‑10 קבצים שקדמו לעבודה הזאת ואינם
מייבאים אף קובץ שנגעתי בו (רישום כפול ב‑`registry`, mock של `fetch` בלי
`res.text` ב‑`proposeObjectArchive`, `TaskApprovalButton.test.ts` שנקרא בלי
`.svelte.` ולכן רץ בפרויקט הלא נכון, ועוד).

### 13.2 P2 — הסכימה ב‑1.0b

**מה נוצר** (ענף `shabab`, לא commit ולא deploy):

| קובץ | מה |
|---|---|
| `src/api/{shift-plan,shift,shift-availability,roster-period,shift-assignment}/` | חמש הקולקציות: `schema.json` + boilerplate של `factories.createCore*` (מועתק מ‑`ratson-proposal`) |
| `src/api/project/…/schema.json` | `shiftCycleDays`, `shiftCloseOffsetHours`, `shiftDraftWindowHours` (`localized: false` — `Project` מתורגם), `shift_plans` |
| `src/api/timegrama/…/schema.json` | `roster_period` (`inversedBy`, כמו כל ה‑relations של timegrama) |
| `ask`, `negopendmission`, `mesimabetahalich`, `components/desision/negoarch.json` | `shiftsMin`, `shiftsMax` (§3.8) |

**הכרעות שנלקחו בזמן הכתיבה:**

- **`draftAndPublish: false` בכל החמש** — אותו נימוק כמו `resource-booking`: ליומן
  אין מצב טיוטה, ושורה בלי `publishedAt` הייתה בלתי נראית לשאילתות.
- **שלושה מפתחות ייחודיים** — `shift.slotKey`, `shift-availability.declKey`,
  `roster-period.periodKey`. ה‑cron והלחיצה הכפולה יכולים לרוץ פעמיים; `unique`
  הופך כפילות לשגיאה במקום לשורה שנייה. משמרת שבוטלה ונוספה מחדש באותה שעה
  **מחייה את השורה הקיימת** (אותו מפתח) — חוק ל‑P3/P5.
- **שדות הזמן של התכנית nullable בלי default** — אחרת דריסת הרקמה (§3.7) לא
  הייתה נכנסת לתוקף אף פעם.
- **מינימום צדדים הפוכים**, כמו ב‑`resource-booking`: רק `project.shift_plans`,
  `shift-plan.{shifts,roster_periods}`, `roster-period.{shifts,assignments}`,
  `shift.{availabilities,assignments}` ו‑`timegrama.roster_period`. המשתמש,
  `open_mission`, `mission`, `tafkidim`, `mesimabetahalich`, `timer` — **חד‑כיווניים**.
  בפרט **סכימת המשתמש לא נגעה**: "ההצהרות שלי" / "המשמרות שלי" מסננות מהשורש
  (`shiftAvailabilities(filters: {users_permissions_user: …})`).
- **ה‑`Decision` של `shiftSwap` (P8) לא נכנס כאן — נוסף ב‑§13.9.** P2 כולל בדיוק מה ש‑§3
  מגדיר, ועוד שדות ההתחייבות של §3.8. ה‑swap ייכנס עם העיצוב של P8, לא כניחוש
  עכשיו.

**שמות ה‑GraphQL** — הופקו מ‑`naming` של `@strapi/plugin-graphql` עצמו, לא נוחשו:

| קולקציה | type | רשימה / יחיד | כתיבה | enums |
|---|---|---|---|---|
| `shift-plan` | `ShiftPlan` | `shiftPlans` / `shiftPlan` | `createShiftPlan` / `updateShiftPlan` | `ENUM_SHIFTPLAN_FAIRNESS`, `_LIFECYCLE`, `_STATUS` |
| `shift` | `Shift` | `shifts` / `shift` | `createShift` / `updateShift` | `ENUM_SHIFT_STATE` |
| `shift-availability` | `ShiftAvailability` | `shiftAvailabilities` / `shiftAvailability` | `createShiftAvailability` / `updateShiftAvailability` | `ENUM_SHIFTAVAILABILITY_STANCE` |
| `roster-period` | `RosterPeriod` | `rosterPeriods` / `rosterPeriod` | `createRosterPeriod` / `updateRosterPeriod` | `ENUM_ROSTERPERIOD_STATE` |
| `shift-assignment` | `ShiftAssignment` | `shiftAssignments` / `shiftAssignment` | `createShiftAssignment` / `updateShiftAssignment` | `ENUM_SHIFTASSIGNMENT_STATE`, `_SOURCE` |

זכור: ב‑`FiltersInput` ה‑enums הם `StringFilterInput`, לא `ENUM_…`
(`project_strapi_enum_filters_are_strings`).

**נבדק:**

1. **סריקה סטטית של כל 115 הסכימות** — כל `target` קיים, כל זוג
   `inversedBy`/`mappedBy` מצביע חזרה עם קרדינליות תואמת, כל ערך enum הוא שם
   GraphQL חוקי. אפס בעיות חדשות; ארבע הקיימות הן אלה שכבר מתועדות ב‑
   [`PLAN_RESOURCE_CALENDAR.md`](./PLAN_RESOURCE_CALENDAR.md) §11.
2. **שלב ה‑`register()` של Strapi עצמו** — טעינה ואימות של כל ה‑content types
   והרכיבים, **בלי לפתוח DB** (`bootstrap()` הוא המתודה שיוצרת את `this.db`, והיא
   לא נקראת; הבדיקה גם נכשלת אם נוצר handle). כל החמש נרשמו, וכל השדות החדשים
   נמצאים על הסכימות הקיימות.
3. **לא הרצתי את Strapi מול DB.** ב‑`.env` של 1.0b, `DATABASE_HOST` **אינו
   מקומי** — ו‑Strapi מריץ מיגרציות אוטומטית מול כל DB שהוא מתחבר אליו.

**באג שנמצא בדרך (לא שלנו):** `strapi ts:generate-types` נופל על כל שדה עם
`min: 0` ובלי `max` — `(max && typeofMax) ?? (min && typeofMin)` הופך את 0 ל‑0.
`act`, `sp` ו‑`stipend-pledge` כבר חיים עם `min: 0`, כך שה‑runtime מקבל את זה;
רק ה‑typegen שבור מאז, וזו הסיבה ש‑`types/generated/` ב‑1.0b לא מעודכן
(אין בו אפילו `ResourceBooking`). הפרונט לא נשען עליו — הוא מייצר טיפוסים מה‑
GraphQL החי.

**מה שנשאר לך:**

1. **commit + deploy** של 1.0b (ענף `shabab`). המיגרציה רק מוסיפה טבלאות
   ועמודות — אין שינוי או מחיקה של שדה קיים.
2. **Settings → Users & Permissions → Roles → Authenticated** — על כל חמש
   הקולקציות: `find`, `findOne`, `create`, `update`. **בלי `delete`** — שורה
   מבוטלת נשארת, המאזן מחושב מההיסטוריה.
3. **אותן הרשאות ל‑API token** שה‑cron משתמש בו, אם הוא לא full‑access
   (`project_strapi_new_collection_permissions`) — ה‑materializer ומנוע הסגירה
   (P5) כותבים דרכו.
4. `npm run types:update` ב‑1.0main — ואז `STRAPI_SCHEMA_REFERENCE.md` יכלול את
   החמש.

### 13.3 P3 — המודולים הטהורים

כולם ב‑[`src/lib/shifts/`](../src/lib/shifts/), בלי גישה לרשת ובלי מבני Strapi —
נתונים שטוחים בלבד, כדי שאותו סידור ייצא ב‑cron, בתצוגה המקדימה ובטסט.

| קובץ | מה | טסטים |
|---|---|---|
| `types.ts` | הצורות המשותפות | — |
| `pattern.ts` | `materialize` (אזור זמן + DST דרך `@internationalized/date`), `validatePattern`, `weeklyStaffedHours`, `suggestHeadcount` | 18 — כולל לילות מעבר השעון של 2026 (3 ו‑5 שעות) |
| `quota.ts` | מילוי מים בתוך ההתחייבויות, פתרון מדויק לפי נקודות שבירה (לא חיפוש בינארי), שארית גדולה, `shortage` / `belowMin` | 14 — כולל properties |
| `draft.ts` | `draftRoster` + `stableHash` (cyrb53) | 23 — כולל properties |
| `balance.ts` | `placesTaken`, `carryOver` עם דעיכה | ב‑`support.test.ts` |
| `settings.ts` | ירושת תכנית→רקמה→קבוע, חלונות מחזור מיושרים לחצות מקומית של ראשון, `phaseAt` | ב‑`support.test.ts` — כולל מעבר DST |
| `coverage.ts` | מי מגיע, שרשרת הגיבוי, חורים, "המשמרות שלי", `headroom` לכרטיס החור | ב‑`support.test.ts` |
| `explain.ts` | קוד סיבה → מפתח `$t()`, מחזור העמדות בלחיצה, `explainQuota` | ב‑`support.test.ts` |

**ה‑properties שנבדקים** (fast-check): אף שיבוץ בלי הצהרה תואמת; אף פעם מעל
`shiftsMax`; אף פעם שתי משמרות חופפות לאותו אדם; מקומות + חורים = `need` בכל
משמרת; דטרמיניזם ואי‑תלות בסדר ההצהרות; בלי התחייבויות — אף אחד לא מקבל
שתיים יותר מאחר; המכסות תמיד בין הגבולות וסכומן `min(מקומות, Σhi)` בדיוק.

**שלוש הבהרות שעלו בזמן הכתיבה:**

1. **`slotKey` כולל את התפקיד** — `<planId>|<startISO>|<tafkidimId>`. שני חלונות
   שמתחילים יחד לתפקידים שונים הם שתי משמרות; לאותו תפקיד — `validatePattern`
   מסמן כפילות (צריך `need: 2`, לא שני חלונות).
2. **חריגה ממכסה קורית רק כשהמכסה הבטיחה מקום שלא ניתן לקחת** — למשל אדם שהצהיר
   על שתי משמרות חופפות. המכסה כבר לוקחת בחשבון את הזמינות, אז במצב רגיל אין
   צורך במעבר השני.
3. **מחזור נפתח בחצות מקומית** ומתקדם לפי תאריך מקומי, לא לפי מילישניות — אחרת
   בשבוע של מעבר השעון המחזור היה מתחיל ב‑23:00 או ב‑01:00.

### 13.4 P4 — שכבת השרת, ההצהרות והעמוד

**שכבת השרת** — [`src/lib/server/shifts/`](../src/lib/server/shifts/):

| קובץ | מה |
|---|---|
| `mode.ts` | הדגל `SHIFTS`: `off` (ברירת מחדל) / `shadow` / `on` |
| `exec.ts` | תעבורה עם **משתני GraphQL** — `asUser` (JWT של החבר) ו‑`asService` (ה‑cron). משתנים ולא literals, כי מפתחות ה‑JSON הם מזהי משתמש ("12" אינו שם GraphQL חוקי) |
| `read.ts` | Strapi → הצורות השטוחות של `src/lib/shifts`. שם שדה ששונה נשבר כאן, בקול, ולא בשקט באלגוריתם |
| `store.ts` | כל קריאה וכתיבה של חמש הקולקציות. מסמכים גולמיים ולא `qids.js` — אותה הכרעה כמו `bookingStore.ts`, כי `validate:qids` נכשל על קולקציות שעוד לא עלו |
| `store.test.ts` | מול Strapi מזויף: כל מסמך עובר parse, כל משתנה מוצהר גם בשימוש, והכרעות ה‑store (יצירה מול עדכון, איפוס `declaredAt`, מה sync רשאי לגעת) |

**הפעולה** — [`declareShiftAvailability`](../src/lib/server/actions/configs/declareShiftAvailability.ts):
**אין פרמטר `userId` בכלל** — השורה נכתבת תמיד ל‑`context.userId` מה‑JWT החתום,
כך שאי אפשר להצהיר זמינות בשם מישהו אחר. בודקת שהקורא מאויש במשימה (§14 #5),
ושהמשמרת לא בוטלה ולא הסתיימה. הצהרה אפשרית גם אחרי סגירת הסידור — `can`
מאוחר הוא בדיוק מה ששרשרת הגיבוי צריכה בביטול של הרגע האחרון. כל פעולות
המשמרות נרשמות מ‑[`configs/shifts.ts`](../src/lib/server/actions/configs/shifts.ts)
כדי שהוספת פעולה לא תיגע ברשימה המשותפת.

**ה‑UI** — [`src/lib/components/shifts/`](../src/lib/components/shifts/):
`ShiftGrid` (עמודה ליום, נערמת במובייל, זמנים באזור הזמן של התכנית),
`AvailabilityGrid` (לחיצה = העמדה הבאה, שמירה אופטימית, ביטול עם הודעה אם
נכשלה; כוכב = בחירה ראשונה), `RosterGrid` (מי מגיע, מי בתור, חורים באדום,
**הסיבה לכל שיבוץ** ב‑title ולקורא מסך). העמוד
[`/moach/[projectId]/shifts`](../src/routes/(reg)/moach/[projectId]/shifts/+page.svelte)
מחליף את ההדגמה: בורר תכנית, ניווט בין מחזורים, שלב המחזור והמועד הבא, ושתי
לשוניות. כשל בקריאה = הודעה בעמוד, לעולם לא 500.

**namespace חדש `shifts`** — 51 מפתחות × 5 שפות, בשער `/lev`, `/moach/*`, `/me`.
הסיבות מנוסחות בגוף שלישי, כי הן מוצגות גם ליד השמות של אחרים.

**שינוי מול התכנון:** אין חזרה ל"לא הצהרתי". מחזור הלחיצה הוא
רוצה ← יכול/ה ← אם צריך ← לא יכול/ה ← רוצה, כי ל‑`shift-availability` אין הרשאת
`delete` (§13.2), ו‑`cannot` אומר כל מה שתא ריק היה אומר — ויותר, כי הוא מראה
שהשאלה נראתה.

**נבדק:** 86 טסטים על כל שכבות המשמרות (כולל 7 רינדור); `npm run check`,
`check:i18n`, `check:script` נקיים; טסטי ה‑authz עוברים עם הפעולה הרשומה.
**לא נבדק חי** — העמוד מאחורי התחברות, והקולקציות טרם עלו.

### 13.5 P5 — המנוע

[`src/lib/server/shifts/engine.ts`](../src/lib/server/shifts/engine.ts):

- **`tickPlan`** (כל שעה, מה‑cron): מממש את הדפוס **מעכשיו** ועד סוף האופק (תכנית
  שנוצרה באמצע שבוע לא מגדלת משמרות בעבר), פותח כל מחזור שכבר מותר להצהיר עליו,
  מפרסם טיוטה ב‑`draftAt` וסוגר ב‑`closesAt`. מחזור שכבר רץ כשנראה לראשונה —
  `cancelled`, לא משובץ בדיעבד.
- **`runDraft`**: ה‑seed הוא `periodKey` ונשמר; ההתחייבויות נטענות מהמשימה;
  המאזן מ‑`balanceCache`. כל שורות השיבוץ נכתבות ב‑`draft`, ה‑`quotaSnapshot`
  נשמר על המחזור, ונפתח timegrama לסגירה.
- **`closePeriod`**: `draft` ← `confirmed`, המשמרות ← `rostered`, והמאזן זז לפי
  `C_n = (נלקח − מכסה) + decay · C_{n−1}` — אותה רקורסיה ש‑`carryOver()` מחשבת
  מכל ההיסטוריה.
- **`rebuildBalance`** בונה את ה‑cache מחדש מההיסטוריה — ההוכחה שהוא באמת רק
  cache (§1.4). נגיש כ‑`/api/cron/shifts?plan=<id>&rebuild=1`.
- **אידמפוטנטי בכל שלב**: טיוטה שכבר כתבה שורות לא כותבת שוב; מחזור סגור לא
  נסגר פעמיים — ה‑cron וה‑timegrama יכולים שניהם להגיע.

**שני תיקונים לתכנון, שעלו מקריאת ה‑dispatcher:**

1. **ה‑`whatami` הוא `roster_period`, לא `rosterPeriod`.** ה‑dispatcher קורא
   `attributes[whatami]`, כך שה‑whatami חייב להיות שם ה‑relation עצמו.
2. **השדה נשאל רק כש‑`SHIFTS` דלוק.** ה‑dispatcher שואל את כל ה‑relations
   **בשאילתה אחת**; שדה שעוד לא קיים ב‑Strapi היה מפיל את השאילתה — ו**עוצר
   את כל שעוני ההסכמה בפלטפורמה**, לא רק של המשמרות. בנוסף, כש‑`SHIFTS=off`,
   שעון `roster_period` נשאר עומד במקום להיסגר כ"יעד שנמחק".

**`/api/cron/shifts`** — GET עם `?key=<CRON_SECRET>`, כמו שאר ה‑crons. צריך
**לתזמן אותו כל שעה**, לצד `/api/timegrama`.

**shadow**: אין שורות שיבוץ, אין timegrama, המאזן לא זז. הסידור שהיה נכתב נשמר
ב‑`quotaSnapshot.shadow` ומוצג בלשונית הסידור תחת באנר "סידור ניסיון".

**לשונית ההוגנות** — [`FairnessPanel`](../src/lib/components/shifts/FairnessPanel.svelte):
לכל חבר/ה — התחייבות, מכסה והסיבה לה (`explainQuota`), כמה שובץ/ה, והמאזן
המצטבר. חוסר כיסוי (`shortage`) מוצג במפורש.

**נבדק:** [`engine.test.ts`](../src/lib/server/shifts/engine.test.ts) מריץ מחזור
שלם מול Strapi בזיכרון (הקוד הטהור אמיתי): פתיחה ← טיוטה (פעם אחת, עם שעון
סגירה) ← סגירה (אושר, `rostered`, מאזן) ; cron + timegrama על אותה סגירה;
ספירת חורים; מחזור שכבר רץ; תכנית מושהית; ו‑shadow שלא כותב דבר מחייב.
94 טסטים בכל שכבות המשמרות, `check`, `check:i18n`, `check:script`,
`check:proxy` נקיים.

### 13.6 P6 — התכנית עם המשימה, וההתחייבות לאורך כל חייה

**תכנית האיוש היא חלק מהצעת המשימה.**
[`ShiftPlanForm`](../src/lib/components/shifts/ShiftPlanForm.svelte) מחליף בטופס
המשימה את הטבלה בת 7 העמודות שמעולם לא נשלחה (ואת ה‑CSS שרק היא השתמשה בו —
אומת מול HEAD שלא נוסף אף סלקטור לא‑בשימוש). שורה ליום, חלונות לכל יום, "כמה
אנשים דרושים" מחושב ומוצע — ונכנס לטופס רק בלחיצה על "לקבוע N אנשים". הטופס
מוצג רק כש‑`SHIFTS` דלוק ([`/api/shifts/status`](../src/routes/api/shifts/status/+server.ts)) —
טופס שהשרת מתעלם ממנו בשקט גרוע מהיעדר טופס.

`createMission` בודק את הדפוס **לפני** שנוצר משהו, ואז:

| ענף | התכנית |
|---|---|
| הצעה לרקמה (pendm) | נוצרת `paused` ותלויה ב‑pendm (שדה `shift-plan.pendm` חדש ב‑1.0b). **מופעלת כשההצבעה עוברת** — גם במסלול השעון ([`pend.svelte`](../src/routes/api/timegrama/pend.svelte)) וגם במסלול ההצבעה המיידית ([`voteOnPendm.ts`](../src/lib/server/actions/configs/voteOnPendm.ts)) |
| משימה פתוחה (רקמת יחיד / מוקצית) | נוצרת `active` על ה‑OpenMission |
| שיוך עצמי ברקמת יחיד | אין OpenMission לאייש — לא נוצרת |

תכנית שנכשלה לא מפילה את המשימה — המשימה עומדת, והטופס מודיע שהתכנית לא נשמרה.

**ההתחייבות למשמרות (§3.8) — מהבקשה ועד שינוי בהצבעה:**

1. **בבקשה** — בעמוד המשימה הציבורי, למשימת משמרות, המועמד/ת ממלא/ת "לפחות /
   לכל היותר"; `applyToMission` כותב ל‑`Ask` (או ישר ל‑`Mesimabetahalich` בנתיב
   היחיד).
2. **בקבלה** — שלושת מסלולי הקבלה (`finalizeJoinAcceptance`,
   `finalizeAskAcceptance`, ומסלול השתיקה ב‑[`timegrama/ask.svelte`](../src/routes/api/timegrama/ask.svelte))
   מעתיקים ל‑`Mesimabetahalich` את ההתחייבות מהסבב האחרון שמציין אחת, אחרת
   מהבקשה — כמו שעות ותעריף (`commitmentForAsk`).
3. **בשינוי** — `proposeObjectEdit` מקבל `shiftsMin`/`shiftsMax` (על משימה
   בתהליך) ו‑`howMany` (על משימה פתוחה); סבב `negoarch` נושא אותם,
   `applyObjectChange` כותב אותם, וכרטיס העריכה בלב מציג "מ‑→ל‑" כמו בשעות
   ובתעריף. הגדלת `howMany` על משימה שנסגרה פותחת אותה מחדש אם יש מקום פנוי;
   הקטנה לא מוציאה אף אחד.

כל הכתיבה והקריאה של השדות החדשים עוברת דרך `store.ts` או מוגנת ב‑`shiftsEnabled()` —
**אף קוד חי לא שואל שדה שעוד לא קיים ב‑Strapi** לפני שהדגל נדלק.

**שני פערים נוספים של P1 שנמצאו ותוקנו כאן:**

1. **מסלול השתיקה סגר משימות לכמה אנשים.** `timegrama/ask.svelte` (אישור
   מועמדות בשתיקת הרקמה) ארכב את ה‑OpenMission ואת כל הבקשות האחרות ללא תנאי
   — P1 תיקן רק את שני הפינלייזרים של הפעולות. עכשיו הוא עובר באותו שער
   (`acceptanceEffectAsAdmin`).
2. **הצבעה מיידית איבדה את מספר האנשים.** `voteOnPendm` יצר את ה‑OpenMission
   בלי להעתיק `howMeny` (ו‑`isshift`) מההצעה — הצעה ל‑5 שאושרה בהצבעה מיידית
   הפכה למשימה לאדם אחד. רק מסלול השעון העתיק.

**נשאר ל‑commit נפרד ("דורש 1.0b"):** הצגת השינויים בכרטיס בלב דורשת את
השדות החדשים בשאילתת הלב הסטטית (`ARCH_DECISION_FIELDS`), ושליפת
`shiftsMin`/`shiftsMax` למסכי המשימה כדי להעביר `shiftCommitment` ל‑
`MissionControls`. שאילתות סטטיות אי אפשר לגדר בדגל — ולכן הן יוצאות ב‑commit
משלהן, שמותר לפרוס **רק אחרי** 1.0b (§13.7).

**לא נעשה:** קונטרה על ההתחייבות בזמן משא ומתן על מועמדות — ה‑`negopendmission`
נושא את השדות, והקבלה כבר קוראת אותם, אבל טופס הקונטרה ([`negoM.svelte`](../src/lib/components/prPr/negoM.svelte))
עוד לא מציע אותם. שינוי דפוס השעות עצמו בהצבעת עריכה — נכנס עם P7 (הצעת
"צמצום חלון").

**נבדק:** 35 טסטים חדשים/מעודכנים (`decisionView` — שורות "מ‑→ל‑" לשלושת השדות;
`store` — ההתחייבות, הסבב האחרון מנצח, הפעלת תכנית שחיכתה להצבעה;
`headcountGate` — מסלול השתיקה), ו‑352 טסטים בכל האזורים שנגעתי בהם.
`check`, `check:i18n` (השער הורחב ל‑`/availableMission`, `/concierge`,
`/onboard` — הטופס מיובא שם), `check:script`, `validate:qids` נקיים.

### 13.7 סדר הפריסה — ה‑commit שדורש את 1.0b

**עד 166.5 כולל, כל commit של המשמרות בטוח לפריסה בלי 1.0b:** כל קריאה או כתיבה
של שדה שעוד לא קיים עוברת דרך `store.ts` או מוגנת ב‑`shiftsEnabled()`, ו‑`SHIFTS`
כבוי כברירת מחדל.

**166.6 שונה, ובמכוון.** הוא מוסיף שדות חדשים לשאילתות סטטיות ב‑`qids.js` —
ואלה אי אפשר לגדר בדגל:

| שאילתה | מה נוסף | בשביל מה |
|---|---|---|
| `ARCH_DECISION_FIELDS` (הלב, דף ההצבעה) | `negoarch { shiftsMin shiftsMax howMany }`, `archOpenMission.howMeny`, `archMesimabetahalich { shiftsMin shiftsMax }` | כרטיס העריכה מציג "מ‑→ל‑" לתנאי המשמרות — המצביעים רואים על מה הם חותמים |
| `getMissionInProgress`, `getProjectMissions` | `shiftsMin shiftsMax`, `open_missions { isshift }` | להעביר `shiftCommitment` ל‑`MissionControls` ([`commitmentOf`](../src/lib/shifts/commitment.ts)) |

⚠️ **פריסת 166.6 לפני 1.0b שוברת את דף הלב לכולם** (GraphQL דוחה שדה לא
קיים — כל השאילתה נופלת). הסדר המחייב:

1. deploy של 1.0b (הסכימה מ‑§13.2 + `shift-plan.pendm` + `negoarch.howMany/shiftPattern`);
2. deploy של 1.0main עד 166.6 ומעלה;
3. `SHIFTS=shadow`.

זה אותו כלל שכבר חל על עבודת ריבוי המטבעות ועל הספרייה המשותפת ("deploy
Strapi first").

### 13.8 P7 — כרטיסי הלב וסולם החורים

**מה הלב מקבל.** פונקציה טהורה אחת, [`buildShiftWork`](../src/lib/shifts/work.ts),
מחליטה אילו כרטיסים קיימים לחבר אחד. השרת רק קורא את הנתונים
([`loadShiftWork`](../src/lib/server/shifts/work.ts)) ומעביר אותם אליה. שום
כרטיס לא נשמר: כרטיס נעלם כי העולם השתנה — החבר הצהיר, החלון נסגר, מישהו לקח
את החור.

| `ani` | מתי | מה אפשר לעשות |
|---|---|---|
| `shiftDeclare` | מחזור בשלב ההצהרות, ויש לי משמרות עתידיות שלא עניתי עליהן | מעבר לרשת "הזמינות שלי". גם "לא יכול/ה" היא תשובה |
| `shiftDraft` | טיוטה פורסמה ויש לי בה מקום, כל עוד חלון ההתנגדות פתוח | "לא אוכל להגיע בסוף" לכל מקום — שחרור, לא וטו על הסידור |
| `shiftHole` | משמרת עתידית שאף אחד לא מכסה (מחזור בטיוטה או סגור) | "אני אקח" / "לפתוח למועמד נוסף" — שתי היציאות סוגרות את הכרטיס (§14 #7) |

שני דברים שנשמרו בכוונה:

- **במצב shadow מוצג רק `shiftDeclare`.** כרטיס טיוטה או חור היה מדבר על סידור
  שלא מחייב אף אחד.
- **סדר החורים בא מהשרת:**
  1. הבא/ה בתור בשרשרת הגיבוי.
  2. מי שאין לו/ה חפיפה.
  3. מי שנשאר לו/ה יותר מקום בהתחייבות.
  4. המוקדם יותר.
  
  בלב זה מתורגם לתוספת `pl` ([`levShifts.ts`](../src/lib/utils/levShifts.ts)).

**הפעולות** ([`shiftCardActions.ts`](../src/lib/server/actions/configs/shiftCardActions.ts)):

- **`getShiftWork`** — קריאה בלבד. מחזירה ריק כש‑`SHIFTS=off`.
- **`releaseShiftAssignment`** — משחרר את המקום ומודיע לבא/ה בתור (socket + push).
  - הדירוג שנשמר לא משתנה — [`coverageOf`](../src/lib/shifts/coverage.ts) כבר
    מקדם את הגיבוי הבא, לכל אורך השרשרת.
- **`claimShiftHole`** — "אני אקח".
  - מותר גם מעבר ל‑`shiftsMax`: אדם תמיד רשאי לבחור לעשות יותר, ורק האלגוריתם
    לא רשאי לבחור את זה בשבילו.
  - חסום על חפיפה עם מקום שכבר יש לי.
  - ההצהרה מתעדכנת ל‑`want`, כי ההסכמה נאמרה עכשיו.
  - אם כבר היה לי מקום גיבוי באותה משמרת, השורה הזו משתחררת.
  - אם מישהו הקדים — `claimed:false`, בלי שגיאה.
- **`reopenForShiftHole`** — "לפתוח למועמד נוסף".
  - עושה `howMeny + 1` על ה‑OpenMission, מחזיר `archived:false`, ומריץ את
    השידוך מחדש.
  - לכל היותר פעם אחת למחזור: `quotaSnapshot.reopenedAt` על ה‑`roster-period`.

**שתיקה = פתיחה מחדש.** [`closePeriod`](../src/lib/server/shifts/engine.ts)
במצב `on` עושה את אותו גיוס בעצמו כשנשארו חורים ואף אחד עוד לא פתח. זה מתורגם
ל"עוד מועמד/ת אחד/ת" למחזור קצר — לא לפי מספר החורים, כדי לא להציף.

**הלב:**

- `LevCard.svelte` מקבל שלושה ענפים.
- `cardKinds.js`:
  - `RENDERABLE`, `KIND_META`: teal, teal, red.
  - שורות לתצוגת הרשימה.
  - כפתור: `answer` / `view` / `answer`.
- `levDerived.ts` מצרף את `processedShiftWork` ל‑`mergedFeed`, וה‑`milon` מציג
  אותם תמיד.
- עמוד הלב קורא ל‑`getShiftWork` ליד `getStipendWork`.
- מפתחות i18n: `shifts.cards.*`, `lev.list.kind.shift*`, `lev.list.sub.shift*`.

**טסטים:**

| קובץ | טסטים |
|---|---|
| `work.test.ts` | 9 |
| `engine.test.ts` | 10 (שלושה חדשים: גיוס בשתיקה כשנשארו חורים, לא פעמיים באותו מחזור, לא כשהמחזור מאויש) |
| `levShifts.test.ts` | 2 |

**לא נעשה — P7b:**

- **שינוי ה‑`shiftPattern` בהצבעת עריכה.** הרכיב `negoarch` כבר נושא
  `shiftPattern` (§13.2), אבל ה‑UI של `proposeObjectEdit` עוד לא מציע אותו.
- **שלב 5 בסולם (§7.1)** — הצעת `editObject` אחרי K מחזורים שבהם אותו חלון לא
  מתמלא. דורש מעקב חורים לפי חלון בין מחזורים.

### 13.9 P8 — החלפות

**הדגם.** החלפה היא `Decision` עם `kind: 'shiftSwap'`, והיא דו־צדדית: רק שני
החברים חותמים.

- **התנאים:** המקום של המציע/ה (`swapGive`) עובר לחבר/ה השני/ה (`swapTo`).
  אופציונלית, מקום של החבר/ה השני/ה (`swapTake`) חוזר למציע/ה. אם אין מקום
  חוזר — "פשוט קח/י את שלי".
- **חתימות:** כל חתימה היא שורת `vots`, ו‑`order` שלה הוא הסבב.
- **תור:** מי שעוד לא חתם/ה על הסבב העומד — אליו/ה ההחלפה ממתינה
  ([`swapTurn`](../src/lib/shifts/swap.ts)).
- **קונטרה:** משנה רק את `swapTake` (גם ל"כלום בתמורה"), פותחת סבב חדש, ומאפסת
  את השעון.

**שתיקה היא הסכמה — רק איפה שכבר נאמרה הסכמה.** §1.1 גובר: הסידור לעולם לא
משבץ מי שלא הצהיר, והחלפה לא יכולה להיות דלת אחורית לכלל הזה. לכן שתיקה משלימה
החלפה ([`silenceMayComplete`](../src/lib/shifts/swap.ts)) רק כששני תנאים
מתקיימים:

1. מי שלא ענה/תה הצהיר/ה `want`/`can`/`ifNeeded` על המשמרת שהוא/היא אמור/ה
   לקבל.
2. קבלתה לא מעבירה אותו/ה את ה‑`shiftsMax` במחזור.

בכל מקרה אחר, בלי תשובה עד המועד, ההחלפה **פוקעת** והסידור נשאר כמו שהיה.
כרטיס הלב אומר מראש איזה משני המצבים חל. ה‑cron בודק את התנאים שוב ברגע
ההבשלה, כי הצהרה או מקסימום יכולים להשתנות בינתיים.

**אין "לא".** האפשרויות הן אישור, קונטרה, או ביטול ההצעה **שלי** (רק המציע/ה).
ההצעה של המציע/ה היא שלו/ה לבטל, ואף אחד אחר לא "דוחה" אותה.

**המועד** = המוקדם מבין:

- `restime` של הרקמה;
- `closesAt` של הטיוטה, כל עוד היא פתוחה;
- תחילת אחת המשמרות.

([`swapDeadline`](../src/lib/shifts/swap.ts), ‏§1.3.)

**הביצוע** ([`applySwap`](../src/lib/server/shifts/swaps.ts)):

- **בדיקה חוזרת לפני כתיבה.** אם התנאים כבר לא עומדים — ההחלפה פוקעת ולא
  נכתב כלום. דוגמאות: מישהו שוחרר, נוצרה חפיפה, המשמרת התחילה.
- **שמירה על ההיסטוריה:** השורות הישנות משתחררות (`releaseReason: 'swap'`),
  ונוצרות שורות rank 1 חדשות עם `source: 'swap'`, `reason: 'swapped'`,
  ו‑`coveredFor` שמצביע על השורה שהוחלפה.
- **מקום גיבוי** שהיה למקבל/ת באותה משמרת משתחרר.

**בדיקות** ([`checkSwap`](../src/lib/shifts/swap.ts)):

- רק מקום שלי שבו אני מגיע/ה, לא מקום בתור.
- רק מול מי שמשובץ/ת במשימה.
- לא משמרת שהתחילה.
- לא מישהו שכבר מגיע/ה לאותה משמרת.
- לעולם לא שתי משמרות חופפות.
- הצעה פתוחה אחת לכל מקום.

**ה‑Decision לא מקושר ל‑`projects` — במכוון.** כל קורא של החלטות רקמה (הלב,
לשונית ההצבעות) היה מציג אותו לכל הרקמה כהצבעה. ההחלפה נמצאת דרך היחסים שלה,
`swapFrom`/`swapTo`/`swapPlan`. אין לה `timegrama`: השעון שלה הוא ה‑cron של
המשמרות (`tickPlan` → [`matureDueSwaps`](../src/lib/server/shifts/swaps.ts)),
ורק כש‑`SHIFTS=on`.

**סכימה (1.0b, טרם commit):** ל‑`Decision` נוספו:

| שדה | סוג |
|---|---|
| `kind` | הערך `shiftSwap` |
| `swapGive`, `swapTake` | `manyToOne` → `shift-assignment` |
| `swapFrom`, `swapTo` | `manyToOne` → user |
| `swapPlan` | `manyToOne` → `shift-plan` |
| `swapDeadline` | datetime |
| `swapStatus` | `open \| done \| lapsed \| withdrawn` |
| `swapSilence` | boolean |

כל היחסים חד־כיווניים. נבדק ב‑register של Strapi בלי DB.

**קוד:**

| מה | איפה |
|---|---|
| חוקים (טהור) | [`swap.ts`](../src/lib/shifts/swap.ts) |
| שרת | [`swaps.ts`](../src/lib/server/shifts/swaps.ts); ב‑`store.ts`: `createSwap`, `loadSwap`, `loadOpenSwapsFor`, `loadDueSwaps`, `updateSwap`, `loadAssignmentsByIds`, `loadUserNames` |
| פעולות | [`shiftSwapActions.ts`](../src/lib/server/actions/configs/shiftSwapActions.ts): `proposeShiftSwap`, `decideShiftSwap` |
| עבודת הלב | `buildShiftWork` מחזיר גם `swaps` (עם `myTurn`, `options` לקונטרה) |
| כרטיס | `ShiftSwapCard.svelte` (`ani: 'shiftSwap'`) — רק החלפות שממתינות לי |
| עמוד המשמרות | `SwapPanel.svelte` מתחת לסידור — המקומות שלי, "להציע החלפה", ההצעות שלי שממתינות עם ביטול |
| i18n | `shifts.swap.*` כולל `problem.*`, וב‑`lev.list.*` המפתחות `shiftSwap` |

**טסטים:** `swap.test.ts` 13, `work.test.ts` +3, `levShifts.test.ts` +1.

**לא נעשה — P8b:**

- **שיחה (פורום) על החלפה.** `forums` קיים על ה‑`Decision`, אבל
  [`forumAccess.ts`](../src/lib/server/actions/forumAccess.ts) צריך ללמוד את
  המשתתפים של `shiftSwap` לפני שפותחים אותו.
- **היסטוריית סבבים.** הסבב שומר רק את התנאים העומדים ואת החתימות, בלי תנאי
  הסבבים הקודמים.

### 13.10 P9 — שעות

ההכרעה של §10 נשמרת בקוד: **משמרת אף פעם לא הופכת לשעות מעצמה.** המערכת רק
מציעה, בשני רגעים, ושניהם עוברים בנתיב השעות הרגיל.

| `ani` | מתי | מה קורה |
|---|---|---|
| `shiftStarting` | מ‑30 דקות לפני משמרת שלי ועד סופה, כשאין לה טיימר | "להפעיל טיימר" — בדיוק אותה הפעלה של חוגת הטיימר (`startMissionTimer` מ‑`timerControls.js`). אחריה `linkShiftTimer` קושר את הטיימר הפעיל של המשימה למשמרת (`shift-assignment.timer`), כדי שהכרטיס לא ישאל שוב |
| `shiftLog` | משמרת **מאושרת** שהסתיימה בלי טיימר, עד 7 ימים אחריה | "לרשום N שעות?" — `logShiftHours` יוצר טיימר סגור בדיוק לטווח המשמרת, עם התעריף הנוכחי כחותמת כמו `timerStart`, ושומר אותו דרך `timerSave`. אותו נתיב, אותו `finiapruval`, אותה חותמת תעריף כמו כל שעה אחרת. **"לא עבדתי במשמרת הזו"** משחרר את המקום (`releaseReason: 'notWorked'`), ומאזן ההוגנות מפסיק לספור אותו |

- **רק משמרת `confirmed` נרשמת.** טיוטה שלא נסגרה היא לא משמרת שמישהו הסכים
  עליה.
- **המונה החודשי** (`howmanyhoursalready`) זז רק אם המשמרת בחודש הנוכחי — אותו
  כלל שדיאלוג הטיימר מפעיל.
- **חלון העבודה של הלב** נטען עכשיו גם מחזור אחד אחורה, כדי שמשמרת של אתמול
  עדיין תשאל על השעות שלה.

**קוד:**

| מה | איפה |
|---|---|
| טהור | `hoursItems` ב‑[`work.ts`](../src/lib/shifts/work.ts) (`START_LEAD_MINUTES`, `LOG_LOOKBACK_DAYS`) |
| פעולות | [`shiftHoursActions.ts`](../src/lib/server/actions/configs/shiftHoursActions.ts): `linkShiftTimer`, `logShiftHours` |
| כרטיס | `ShiftHoursCard.svelte` (שני ה‑`ani`) |
| i18n | `shifts.hours.*`, ‏`lev.list.*.shiftStarting/shiftLog` |

**טסטים:** `work.test.ts` +2.

**לא נעשה:**

- **עצירת הטיימר בסוף המשמרת.** הטיימר נעצר ונשמר בדיאלוג הרגיל, כמו כל טיימר.
  עצירה אוטומטית הייתה מחליטה בשביל החבר/ה כמה עבד/ה.
- **כרטיס "מתחילה" בלי טיימר טעון.** הכרטיס מפנה לדף הטיימרים; לא נבנה מסלול
  יצירת טיימר בצד השרת לכרטיס הזה.

### 13.11 P10 — כללי קבע ו‑`/me/shifts`

**כלל קבע הוא הצהרה עומדת.** "אף פעם לא בשישי" הוא אותה הסכמה של לחיצה בטבלה
(§1.1), שנאמרת פעם אחת לכל המשמרות שהיא מתאימה להן. לכן הוא לא נשמר לכל משמרת:
הוא **נגזר בזמן הקריאה** ([`withStandingRules`](../src/lib/shifts/rules.ts)),
כמו הכיסוי והמאזן (§1.4). שינוי כלל חל מיד על כל משמרת עתידית שלא נענתה, ולא
משאיר שורות ישנות.

- **הצהרה מפורשת תמיד גוברת** — כלל ממלא רק את השתיקה. בין הכללים של אדם,
  הראשון שמתאים קובע: כלל צר ("שישי בבוקר: יכול") מעל כלל רחב ("שישי: לא יכול")
  יוצר חריגה.
- **שובר השוויון של הצהרה מוקדמת (§6.3)** — ה‑`declaredAt` של מה שכלל גוזר הוא
  רגע שמירת הכלל (`shiftRulesAt`). מי שאמר/ה פעם אחת ומוקדם מקבל/ת בדיוק מה
  שמקבל מי שלחץ/ה על כל משמרת מוקדם.
- **איפה הכללים חלים:** בטיוטה (`runDraft`), בכרטיס "הצהרה" (משמרת שכלל ענה
  עליה אינה "לא נענתה"), בבדיקת השתיקה של החלפה (§13.9), ובטבלת הזמינות — שם
  תשובה מכלל מסומנת "לפי כלל קבע" ולחיצה עליה הופכת אותה למפורשת.
- **איפה הם נשמרים:** על המושב של החבר/ה במשימה — `mesimabetahalich.shiftRules`
  (json) ו‑`shiftRulesAt`, ליד `shiftsMin`/`shiftsMax`.
- **ההבדל מ‑`shiftsMin`/`shiftsMax`:** כמה משמרות חבר/ה חייב/ת הוא תנאי שהרקמה
  הסכימה עליו ומשתנה בהצבעה (§3.8). **מתי** הוא/היא פנוי/ה — שלו/ה בלבד.
  `setShiftRules` מאמת בעלות על המושב ולא פותח הצבעה.

**`/me/shifts`** — כל המשמרות הבאות שלי, מכל הרקמות, מקובצות לפי יום מקומי
(באזור הזמן של כל תכנית):

- לכל שורה: מגיע/ה או מספר בתור, תג "טיוטה", וקישור לסידור של הרקמה.
- נקרא עם ה‑JWT של החבר/ה.
- במצב shadow מוצגת הודעה במקום רשימה.
- בעמוד המשמרות של הרקמה יש קישור אליו.

**סכימה (1.0b, טרם commit):** `mesimabetahalich.shiftRules` (json) ו‑`shiftRulesAt`
(datetime). נבדק ב‑register של Strapi.

**קוד:**

| מה | איפה |
|---|---|
| טהור | [`rules.ts`](../src/lib/shifts/rules.ts): `validateRules`, `normalizeRules`, `ruleStance`, `withStandingRules` |
| פעולה | [`shiftRulesActions.ts`](../src/lib/server/actions/configs/shiftRulesActions.ts) (`setShiftRules`) |
| רכיב | `StandingRules.svelte` בלשונית "הזמינות שלי" |
| עמוד | `src/routes/(reg)/me/shifts` |
| שרת | `loadPlanLabels` ב‑store; `toCommitments` קורא את הכללים |

**טסטים:** `rules.test.ts` 6.

### 13.12 P11 — i18n מלא וניקוי

- **שגיאות מקודדות.** כל סירוב שמגיע לחבר/ה מפעולות המשמרות הוא קוד ולא משפט
  אנגלי ([`errors.ts`](../src/lib/shifts/errors.ts)): `shift:<code>` →
  `shifts.error.*`, ‏`swap:<problem>` → `shifts.swap.problem.*`,
  ‏`rules:<issue>:<i>` → `shifts.rules.issue.*`. הסיבה: השרת לא יודע באיזו שפה
  החבר/ה קורא/ת, ומשפט אנגלי בכרטיס עברי הוא בדיוק הרגרסיה שכללי ה‑i18n
  אוסרים. `describeShiftError` בכל הכרטיסים מתרגם בחזרה, ונופל לטקסט השרת רק
  בהודעה לא מקודדת (למשל ממערכת הטיימרים).
- **`shifts.json`:** 221 מפתחות, זהים בחמש השפות. `check:i18n`, ‏`check:script`
  ובדיקת זוגיות המפתחות — נקיים. אין מחרוזת עברית או ערבית קשיחה ברכיבי
  המשמרות.
- **התראות שרת** (`notifier` בפעולות) נשארות אובייקטים `{ he, en }` לפי שפת
  **הנמען** — זה המקרה היחיד ש‑`$t()` לא מבטא (CLAUDE.md).
- **`sidur.svelte` נמחק.** אף אחד כבר לא ייבא אותו מאז P4.
- **`@event-calendar/interaction` נשאר — תיקון ל‑§5.2 סעיף 6.** הקביעה שהוא
  מיובא רק ב‑`sidur.svelte` לא נכונה: [`ResourceCalendar.svelte`](../src/lib/components/resource/ResourceCalendar.svelte)
  טוען אותו בייבוא דינמי (לוח הזמינות של משאבים). הסרה ניסיונית נתפסה ב‑`npm run check`
  והוחזרה, כך ש‑`package.json` לא השתנה.

**טסטים:** `errors.test.ts` 3 — המיפוי, קיום מילים לכל קוד ב‑`he`, והנפילה
לחלופה.

### 13.13 P12 — הפעלה: ספר ההרצה

**P12 הוא פריסה, ולכן לא בוצע בקוד.** זה הסדר המחייב. כל שלב הפיך עד שלב 6.

**1. 1.0b (ענף `shabab`) — commit ו‑deploy.** כל הסכימה עדיין לא ב‑commit:

| שלב | מה |
|---|---|
| P2 | חמש הקולקציות; `Project.shiftCycleDays/shiftCloseOffsetHours/shiftDraftWindowHours`; `shiftsMin/Max` על `ask`, `negopendmission`, `mesimabetahalich`, `negoarch`; `timegrama.roster_period` |
| P6 | `shift-plan.pendm`; `negoarch.howMany/shiftPattern` |
| P8 | `Decision.kind` ‏`shiftSwap` + שדות `swap*` |
| P10 | `mesimabetahalich.shiftRules/shiftRulesAt` |

כל אלה נבדקו ב‑register של Strapi בלי DB. אין להריץ את 1.0b מקומית.

**2. הרשאות Strapi — שני מקומות לכל קולקציה חדשה** (`project_strapi_new_collection_permissions`):

- **Authenticated role וגם API token**, על `shift-plan`, `shift`,
  `shift-availability`, `roster-period`, `shift-assignment`:
  - הפעולות: `find`, `findOne`, `create`, `update`.
  - **בלי `delete`** — שום דבר במערכת לא מוחק שורה. שחרור ושינוי נשמרים
    כהיסטוריה.
- **לוודא שקיימות כבר:**
  - `decision`: create / update / find.
  - `mesimabetahalich`: update — נדרש ל‑`setShiftRules`.
  - `timer`: create — נדרש ל‑`logShiftHours`.
  - `users-permissions.user`: find — שמות בצד השני של החלפה.

**3. 1.0main — deploy עד 166.11.** מ‑166.6 ואילך אי אפשר לפרוס לפני שלב 1
(§13.7): GraphQL דוחה שדה לא קיים ומפיל את דף הלב לכולם.

**4. משתני סביבה:**

- **`CRON_SECRET` — חובה.** בלעדיו `/api/cron/shifts` פתוח לכל מי שמכיר את
  הכתובת.
- **`SHIFTS=shadow`:**
  - חברים מצהירים, והמנוע מחשב טיוטה ושומר אותה על ה‑`roster-period` בלבד.
  - לא נכתב שום שיבוץ, ואין כרטיסי טיוטה, חור, החלפה או שעות.
- **`MISSION_HEADCOUNT`** — משאירים ריק (פעיל). `off` מחזיר את התנהגות המשימה
  הישנה אחד לאחד.

**5. cron — כל שעה:** `GET /api/cron/shifts?key=<CRON_SECRET>`.

- פתיחת מחזורים, טיוטה, סגירה, גיוס בשתיקה (§13.8), הבשלת החלפות (§13.9).
- `?plan=<id>` מריץ תכנית אחת, ו‑`&rebuild=1` בונה מחדש את מאזן ההוגנות שלה.

**6. פיילוט — רקמה אחת, מחזור אחד ב‑shadow:**

1. יוצרים משימה עם תכנית איוש בטופס החדש.
2. החברים מצהירים (ואפשר גם כללי קבע).
3. אחרי `draftAt`, לשונית "הוגנות" מציגה את הסידור שהיה נוצר, תחת באנר shadow.
4. **לבדוק:**
   - אף אחד לא שובץ במשמרת שלא הצהיר עליה, ואף אחד לא מעל ה‑`shiftsMax` שלו/ה.
   - לכל מקום יש סיבה.
   - החורים הגיוניים.
   - אותו אדם לא תמיד מספר 1.

**7. `SHIFTS=on` באותה רקמה, למחזור אחד. לבדוק בסוף המחזור:**

- טיוטה פורסמה, ונשלחו כרטיסים.
- שחרור מקדם את הבא/ה בתור.
- חור נסגר ב"אני אקח", או שהמשימה נפתחה למועמד נוסף.
- החלפה אחת לפחות עברה מקצה לקצה.
- השעות נרשמו דרך הטיימר או דרך `shiftLog`, ועברו `finiapruval`.
- המאזן (`balanceCache`) זז.

**8. חזרה אחורה בכל שלב: `SHIFTS=off`.**

- כל הקריאות והכרטיסים נכבים, וה‑cron לא נוגע בכלום.
- הנתונים נשארים, והמשימות עובדות כמו לפני המערכת.
- ה‑timegrama של `roster_period` ממתין ולא נסגר (§13.5).

---

## 14. הכרעות — סגורות (2026‑09‑22)

| # | השאלה | ההכרעה |
|---|---|---|
| 1 | `noofhours` — לאדם או סה"כ? | **לאדם** (§2.5). מומש ב‑P1: הטופס אומר "לאדם" ומציג את הסך לרקמה |
| 2 | האם `ifNeeded` קיים כעמדה רביעית? | **כן** |
| 3 | מכסה שווה לכולם, או לפי מה שכל אחד רוצה? | **שונה מההמלצה:** כל מועמד מתחייב ל‑`shiftsMin`/`shiftsMax` במחזור **כתנאי של ההשמה** — נסגר בזמן הקבלה לרקמה, ומשתנה רק בהצבעה דרך `proposeObjectEdit`, כמו שעות ותעריף (§3.8). המכסה = מילוי מים בתוך ההתחייבויות (§6.2) |
| 4 | האם משמרת מייצרת שעות אוטומטית? | **לא** (§10) |
| 5 | מי יכול להצהיר זמינות? | **רק מי שיש לו `Mesimabetahalich` פעיל במשימה** |
| 6 | אורך מחזור ברירת מחדל | **7 ימים**, סגירה 48ש' לפני, חלון התנגדות 24ש' |
| 7 | הגדלת `howMeny` בעקבות חור | **שונה מההמלצה:** לא שקטה. כרטיס חור עם שתי אפשרויות — "אני אקח את החלון" או "לפתוח למועמד נוסף"; מי שלוקח סוגר את הכרטיס; שתיקה עד הסגירה = פתיחה מחדש (§1.7, §7.1) |
| 8 | כמה דרגות גיבוי? | **שונה מההמלצה:** נגזר — כל מי שהצהיר זמינות מקבל דרגה, כך שהשרשרת גדלה עם הרקמה ומספר המועמדים; `maxBackups` נשאר תקרה אופציונלית (§6.3) |

---

## 15. הרחבות עתידיות — מה המבנה כבר מאפשר

- **משמרות לפי תפקיד** — `shift.tafkidim` כבר בסכימה; המסנן הקשיח ב‑§6.3 שלב 4
  כבר מתייחס אליו. צריך רק UI.
- **משמרות חוצות־רקמות** (אדם שמשרת שתי רקמות) — `/me/shifts` כבר אוסף חוצה,
  והמסנן "חפיפה" צריך להתרחב מהתכנית לכלל השיבוצים של האדם.
- **קונצרנז' ולקוחות** — משמרת שירות שנצרכת על ידי לקוח
  ([`PLAN_CONCIERGE.md`](./PLAN_CONCIERGE.md)): להוסיף `sheirut` ל‑`shift`.
- **החלפות רב־צדדיות** (שלושה במעגל) — `Decision` תומך בכמה חותמים; האלגוריתם
  יידרש למצוא מעגלים.
- **תחזית ביקוש** — `balance.ts` + היסטוריית חורים כבר מספיקים כדי לומר
  "בשלושת החודשים האחרונים שישי לא התמלא ב‑70%".
- **קיבולת משתנה לאורך המשמרת** — היום `need` קבוע לחלון. חלון שצריך 3 בשיא
  ו‑1 בקצוות נפתר היום בפיצול לשני חלונות; אם יתברר שזה מסורבל, `need`
  יהפוך למערך מדורג.
- **P2P / שרשרת חתומה** — `shift-assignment` הוא אובייקט הסכמה לכל דבר, ולכן
  מועמד טבעי ל‑`shadowSign` (`project_space_shadow_bridge`) כשהשלב יגיע.

---

## 16. סיכום בשורה אחת

הרקמה מצהירה **מתי צריך איוש**; כל חבר מצהיר **מתי הוא יכול**; המערכת מחשבת
סידור **דטרמיניסטי, מוסבר והוגן לאורך זמן** מתוך ההצהרות בלבד; ומה שלא
מתמלא — מגייסים, לא כופים.
