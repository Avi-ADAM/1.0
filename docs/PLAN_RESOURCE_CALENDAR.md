# תכנית: זמינות משאבים ולוח שנה (Resource Availability & Calendar)

> סטטוס: **מומש, ממתין ל-deploy.** ההכרעות ב-§9 סגורות, §10 מסכם את הפרונט,
> ו-§11 את הסכימה בקנד — נוצרה בריפו `1.0b` (ענף `shabab`), טרם commit/deploy.
> עד שהיא עולה, `RESOURCE_BOOKINGS` נשאר `off` וההתנהגות זהה להיום.
> המסמך מתאר את המצב הקיים כפי שהוא בקוד, את הבאגים שנובעים ממנו, ואת המודל
> המוצע.
>
> מסמכים קשורים: [`PLAN_USER_OFFERINGS.md`](./PLAN_USER_OFFERINGS.md),
> [`PLAN_COMPLEX_PRODUCTS.md`](./PLAN_COMPLEX_PRODUCTS.md),
> [`PLAN_OBJECT_ARCHIVAL.md`](./PLAN_OBJECT_ARCHIVAL.md),
> [`PLAN_MATCH_SUGGESTIONS.md`](./PLAN_MATCH_SUGGESTIONS.md),
> [`PLAN_CONCIERGE.md`](./PLAN_CONCIERGE.md).

---

## 0. מה יש היום (מהקוד, לא מהזיכרון)

### 0.1 סוגי המשאב

`Enum_Mashaabim_Kindof` (וזהה ב‑`Sp`, `OpenMashaabim`, `Mashabetahalich`,
`Rikmash`) — חמישה ערכים בלבד:

| ערך | הכוונה בפועל | מי מרנדר אותו |
|---|---|---|
| `total` | נתינה חד‑פעמית / גישה ללא הגבלה (גם "מוצר דיגיטלי" נכנס לכאן) | `offerings.resource.kind_total` |
| `rent` | השכרה לטווח תאריכים | `kind_rent` |
| `monthly` | תשלום/מחזור חודשי | `kind_monthly` |
| `yearly` | תשלום/מחזור שנתי | `kind_yearly` |
| `perUnit` | ליחידה, עם כמות (`hm`) | `kind_perUnit` |

הבעיה המבנית: **ה‑enum מערבב שני צירים שונים**.

- ציר **חיוב/מחזוריות** — חד‑פעמי מול חודשי/שנתי/ליחידה.
- ציר **תפוסה** — האם הנתינה *תופסת* את המשאב (רכב, חדר, מקרן) או לא
  (קובץ, רישיון, ידע, קישור).

`rent` יושב על ציר התפוסה, `monthly`/`yearly` על ציר החיוב, ו‑`total` מכסה
בו‑זמנית "נתתי ונגמר" ו"גישה בלתי מוגבלת" — שני דברים הפוכים לחלוטין מבחינת
זמינות.

### 0.2 איך זמינות נשמרת היום — ולמה זה שבור

`Sp.panui` הוא **בוליאני יחיד** ("פנוי"). מה שקורה בקוד:

| מקום | מה עושה |
|---|---|
| [`voteOnMaap.ts:343`](../src/lib/server/actions/configs/voteOnMaap.ts) | קונצנזוס YES → `updateSp(panui: false)` |
| [`createResource.ts:457`](../src/lib/server/actions/configs/createResource.ts) | הקצאה עצמית → `updateSp(panui: false)` |
| [`markResourceDone.ts`](../src/lib/server/actions/configs/markResourceDone.ts) | סגירת מנוע → `status_mashab:'closed'`, `finnished:true` — **`panui` לא חוזר ל‑true** |
| `qids.js:10560`, `qids.js:12472` | סינון הצעות: `panui: { ne: false }` / `{ eq: true }` |

מכאן חמישה באגים ישירים:

1. **משאב שהושאל פעם אחת נעלם לתמיד.** אין שום מסלול שמחזיר `panui = true`.
2. **משאב דיגיטלי/בלתי‑מוגבל ננעל בדיוק כמו רכב.** קובץ שניתן לריקמה אחת
   כבר לא יוצע לאף ריקמה אחרת, למרות שאין שום מגבלה פיזית.
3. **`perUnit` לא סופר מלאי.** יש `hm` (כמות) אבל אין שדה "כמה כבר תפוס" על
   `Sp` — `reservedQuantity` קיים רק על `Mashabetahalich` (ראה
   `PLAN_COMPLEX_PRODUCTS §7`), כלומר רק בזרימת המוצרים, לא בזרימת המשאבים.
4. **להשכרה (`rent`) אין בכלל מנוע.**
   [`runResourceAskmAcceptance.ts:91`](../src/lib/server/actions/helpers/runResourceAskmAcceptance.ts)
   יוצר `Mashabetahalich` רק כאשר `recurring === true`, ו‑`kindOf` מנורמל
   ל‑`monthly | yearly` בלבד. השכרה מייצרת רק `Rikmash` (ארכיון) עם
   `sqadualed/sqadualef` — אין ישות חיה שאומרת "תפוס עד".
5. **`markResourceDone` סוגר מנוע אבל לא משחרר את ה‑Sp**, כך שגם במסלול
   החודשי/שנתי הזמינות לא חוזרת.

### 0.3 ארבעה שמות שונים לאותו טווח תאריכים

| ישות | התחלה | סיום |
|---|---|---|
| `Sp` (המשאב האישי) | `sdate` | `fdate` |
| `OpenMashaabim` (בקשת ריקמה) | `sqadualed` | `sqadualed**f**` |
| `Rikmash` (ארכיון) | `sqadualed` | `sqadual**ef**` |
| `Mashabetahalich` (מנוע) | `start` | `end` |
| `Sheirut` (לקוח) | `startDate` | `finnishDate` |

חמש ישויות, חמישה זוגות שמות, שניים מהם נבדלים באות אחת (`sqadualedf` מול
`sqadualef`) — וזו כבר תקלה בפועל: `voteOnMaap.ts:315` נאלץ להעיר על כך
בהערה כדי לא לטעות. אין מקום אחד שעונה "מתי המשאב הזה תפוס".

### 0.4 מה כן קיים ואפשר להישען עליו

- **`Mashabetahalich`** כבר נושא `start`, `end`, `status_mashab`
  (`draft|active|paused|closed|cancelled`), `lifecycle`, `reservedQuantity`,
  `quantityAssigned`, `cycleSize`, `unit`, `recurring`. זה כמעט מנוע הזמנות —
  רק שהוא נוצר רק למחזוריים ואין ממנו מבט לוח־שנתי.
- **ניהול תאריכים במשא ומתן כבר עובד**:
  [`conf/dateNego.svelte`](../src/lib/components/conf/dateNego.svelte) בשימוש
  `negoM.svelte` / `negoPend.svelte`. כלומר "אין לי בתאריך הזה" כבר יודע
  להיאמר כ‑**counter על התאריך**, לא כווטו — בדיוק לפי העל‑עקרון.
- **שתי ספריות לוח שנה כבר מותקנות ובשימוש**: `@fullcalendar/*`
  (`timers/TimersCalendar.svelte`, `prPr/ProjectTimersCalendar.svelte`)
  ו‑`@event-calendar/*` (`prPr/sidur/sidur.svelte`, `lev/welcomTo.svelte`).
- **`/api/permissions` + `qidsAccess.js`** כבר שולטים בגישה לכל qid חדש.

### 0.5 השידוך (lev) מתעלם מתאריכים לחלוטין

[`src/lib/server/matching/scoring.ts`](../src/lib/server/matching/scoring.ts)
מחשב `score = matchedRoles + 2·matchedSkills + wwAdjustment − 2·missingSkills −
missingRoles`. אין שום רכיב תאריך, ו‑`engine.ts` לא מסנן לפי חפיפה. ריקמה
שצריכה מקרן ל‑3 ימים באפריל מקבלת הצעה על מקרן שמושכר עד דצמבר.

---

## 1. העיקרון: תפוסה היא **נגזרת**, לא דגל

> **מקור אמת אחד:** טווח תאריכים על משאב נרשם במקום אחד — רשומת הזמנה —
> ולא משנה מי הצד השני (ריקמה, לקוח קונסיירז', או המחזיק עצמו).
> "פנוי?" הוא **חישוב** מעל הרשומות האלה, לעולם לא שדה שמישהו כותב.

זה מקביל ישירות לכלל שכבר קיים בכסף: מכירה נספרת רק כשהיא *effective*, ולא
כי מישהו סימן דגל. גם כאן: משאב תפוס רק בטווח שיש עליו הזמנה חיה.

`Sp.panui` **לא נמחק** — הוא נשאר כמטמון תאימות ("יש בכלל זמינות כלשהי מהיום
והלאה") שנכתב על ידי השרת, ומפסיק להיות שער.

---

## 2. שינויי Strapi

### 2.1 קולקציה חדשה: `resource-booking` (הזמנת משאב)

| שדה | טיפוס | תפקיד |
|---|---|---|
| `sp` | manyToOne → `Sp` | **נושא הלוח.** המשאב הקונקרטי שמוחזק |
| `mashaabim` | manyToOne → `Mashaabim` | דנורמליזציה, לסינון לפי סוג משאב |
| `owner` | manyToOne → `users-permissions.user` | לצורך "הלוח שלי" |
| `start` | DateTime | תחילת התפוסה |
| `end` | DateTime (nullable) | סיום. **null = פתוח** (עד סגירה ידנית) |
| `quantity` | Decimal, default 1 | ל‑pool: כמה יחידות נתפסות |
| `status` | enum `hold \| confirmed \| active \| done \| cancelled` | ראה 2.2 |
| `holdExpiresAt` | DateTime | פקיעת ה‑hold (נגזר מ‑restime של הריקמה) |
| `source` | enum `rikma \| concierge \| personal \| blackout \| external` | מי יצר |
| `project` | manyToOne → `Project` (nullable) | הצד השני כשזו ריקמה |
| `sheirut` | manyToOne → `Sheirut` (nullable) | הצד השני כשזה לקוח קונסיירז' |
| `consumer_user` | manyToOne → user (nullable) | הצד השני כשזה אדם |
| `mashabetahalich` | manyToOne (nullable) | המנוע, כשקיים |
| `rikmash` | manyToOne (nullable) | הארכיון, כשנסגר |
| `maap` | manyToOne (nullable) | ההצבעה שיצרה |
| `open_mashaabim` | manyToOne (nullable) | הבקשה שממנה נולד |
| `note` | Text | הערה חופשית |

`source: 'blackout'` הוא **דיווח עצמי ריבוני** של המחזיק ("הרכב בטיפול
15–17.4") — נכנס לתוקף מיד, בלי הסכמה של אף אחד, בדיוק כמו
`holderStatus:'self'` במכירה. אין לו `project`/`sheirut`.

### 2.2 מכונת המצבים של `status`

```
        createResourceBooking
                 │
                 ▼
              hold ──── holdExpiresAt חלף ────► cancelled
                 │                                   ▲
      קונצנזוס / אישור לקוח                          │ cancelResourceBooking
                 ▼                                   │
            confirmed ──── start הגיע ────► active ───┘
                                              │
                                     end חלף / markResourceDone
                                              ▼
                                            done
```

- `hold` **תופס** קיבולת (מונע over‑booking בזמן שההצבעה רצה) אבל פוקע לבד.
  הפקיעה נתלית ב‑`timegrama` הקיים, לא בסקאנר חדש — ראה `PLAN_TIMEGRAMA.md`.
- `hold | confirmed | active` = תופס. `done | cancelled` = לא תופס.

### 2.3 שדות חדשים על `Sp`

| שדה | טיפוס | תפקיד |
|---|---|---|
| `availability` | enum `exclusive \| pooled \| unlimited \| consumable` | ציר התפוסה, נפרד מ‑`kindOf` |
| `capacity` | Int, default 1 | ל‑`pooled`: כמה יחידות במלאי |
| `leadTimeHours` | Int (nullable) | מרווח מינימלי בין הזמנות (ניקוי/הובלה) |
| `bookings` | oneToMany → `resource-booking` | הצד ההפוך |

**`null` = legacy**, כמו בכל שאר המערכת. הנגזרת מ‑`kindOf` הקיים:

| `kindOf` | `availability` שנגזר כשהשדה `null` |
|---|---|
| `rent` | `exclusive` |
| `monthly` / `yearly` | `exclusive` |
| `perUnit` | `pooled` (עם `capacity = hm ?? 1`) |
| `total` | `consumable` |

> ⚠️ `total` הוא המקרה הכואב: היום הוא משמש גם ל"מסרתי ונגמר" וגם ל"קובץ
> דיגיטלי, קחו כמה שתרצו". הנגזרת השמרנית היא `consumable` (התנהגות זהה
> להיום). המעבר ל‑`unlimited` נעשה **רק בבחירה מפורשת של המחזיק** ב‑UI, לא
> במיגרציה אוטומטית. ראה 7.

לכן כל פילטר חייב להיות
`or: [{availability: {null: true}}, {availability: {eq: "..."}}]` — `ne` חשוף
מחריג שורות NULL ב‑SQL ויסתיר כל משאב קיים.

### 2.4 שדות חדשים על `OpenMashaabim` (בקשת הריקמה)

| שדה | טיפוס | תפקיד |
|---|---|---|
| `dateFlex` | enum `exact \| flexible \| anytime` (null = `flexible`) | כמה התאריכים נוקשים |
| `minOverlapDays` | Int (nullable) | חפיפה מינימלית שמצדיקה הצעה |

`sqadualed`/`sqadualedf` הקיימים נשארים ומקבלים משמעות מחייבת: **הטווח
המבוקש**.

### 2.5 ערך חדש ב‑`Enum_Matchsuggestion_Status`

`dateBlocked` — הצעה שנחסמה על תאריכים בלבד (ראה 7).

> ⚠️ **מלכודת:** שני ה‑qids של עמוד הלב מסננים `status: { ne: "dismissed" }` —
> `209levMatchSuggestions` (משימות, `qids.js:14243`) ו‑**`212levResourceMatchSuggestions`**
> (משאבים, `qids.js:14361`). ערך חדש **יעבור את המסנן** ויוצג בלב. חובה לשנות
> את שניהם ל‑`status: { notIn: ["dismissed", "dateBlocked"] }` **באותו commit**
> שמוסיף את הערך, אחרת כל ההצעות החסומות יזלגו ללב.

---

## 3. מודול הזמינות (טהור, נבדק)

`src/lib/server/resources/availability.ts` — **מקור האמת היחיד לחישוב**,
בדיוק כמו ש‑`computeStipendEquity.ts` הוא לסטיפנד. אף call site לא מחשב
חפיפה בעצמו.

```ts
export interface Range { start: Date; end: Date | null }
export interface BookingLike {
  start: Date; end: Date | null; quantity: number;
  status: 'hold' | 'confirmed' | 'active' | 'done' | 'cancelled';
  holdExpiresAt?: Date | null;
}

/** חופפים? end=null נחשב אינסוף. נגיעה בקצה אינה חפיפה. */
export function overlaps(a: Range, b: Range): boolean;

/** ימי חפיפה בפועל (0 כשאין) */
export function overlapDays(a: Range, b: Range): number;

/** האם ההזמנה תופסת עכשיו (hold שפג = לא) */
export function isHolding(b: BookingLike, now?: Date): boolean;

/**
 * שיא היחידות התפוסות בו־זמנית בטווח — **שיא, לא סכום**. שלוש הזמנות בתוך
 * חודש אחד לא תופסות שלוש יחידות אלא אם הן חופפות זו לזו, ולכן כל הפונקציות
 * כאן רצות sweep על גבולות הקטעים.
 */
export function peakBookedQuantity(bookings: BookingLike[], range: Range, opts?): number;

/** התשובה המרכזית */
export function checkAvailability(sp: SpLike, bookings: BookingLike[], range: Range, qty?: number):
  | { kind: 'unlimited'; dateFit: 1 }
  | { kind: 'available'; dateFit: 1; freeWindows: Range[] }
  | { kind: 'partial'; dateFit: number; freeWindows: Range[]; freeDays: number;
      requestedDays: number; conflicts: BookingLike[] }
  | { kind: 'taken'; dateFit: 0; nextFreeFrom: Date | null; conflicts: BookingLike[] }
  | { kind: 'outOfWindow'; dateFit: 0; window: Range | null };

/** חלונות פנויים בטווח, לרינדור הלוח */
export function freeWindows(sp: SpLike, bookings: BookingLike[], range: Range, qty?): Range[];

/** מי משוחרר כשמאשרים הצעה מתנגשת — ראה §9.3 */
export function conflictingHolds(sp, bookings, winner, opts?): BookingLike[];
```

בדיקות:
- `availability.test.ts` — טבלת מקרים (נגיעה בקצה, `end=null`, hold שפג,
  `unlimited` תמיד `available`, `pooled` עם קיבולת חלקית, `leadTimeHours`).
- `availability.pbt.test.ts` (fast‑check) — האינווריאנטה שאסור לשבור:
  **לכל קבוצת הזמנות מאושרות, בכל נקודת זמן, `peakBookedQuantity ≤ capacity`.**

> ⚠️ `partial` הוא **לא** דחייה. לפי העל‑עקרון "אין 'לא' מוחלט", חפיפה חלקית
> נכנסת לזרימת ה‑nego הקיימת: היא מוצגת כהצעת נגד על התאריכים דרך
> `dateNego.svelte`, שכבר עובד ב‑`negoM`/`negoPend`.

---

## 4. Server Actions

| Action | מה עושה | `authRules` |
|---|---|---|
| `createResourceBooking` | פותח `hold`. בודק `checkAvailability` לפני. מחזיר `partial`/`taken` עם החלונות הפנויים במקום להיכשל סתם | `or(self על ה‑owner, projectMember)` |
| `confirmResourceBooking` | `hold → confirmed`. נקרא מ‑`voteOnMaap` בקונצנזוס ומ‑`createSheirutFromPending` | `custom` — רק מהזרימות האלה |
| `cancelResourceBooking` | `→ cancelled` | `or(self, projectMember)` |
| `blockResourceDates` | `source:'blackout'`, `status:'confirmed'` מיד | `self` בלבד |
| `releaseResourceBooking` | `→ done` + החזרת `Sp.panui` אם אין עוד תפוסה עתידית | `or(self, projectMember)` |

**נקודות תפירה בזרימות הקיימות** (זה הלב — בלי זה שום דבר לא נרשם):

1. [`createResource.ts`](../src/lib/server/actions/configs/createResource.ts) —
   ביצירת `open_mashaabim`/הקצאה עצמית: לפתוח `hold` במקום `panui:false`.
2. [`voteOnMaap.ts:274-343`](../src/lib/server/actions/configs/voteOnMaap.ts) —
   בקונצנזוס: `confirmResourceBooking` במקום `updateSp(panui:false)`
   (הכתיבה ל‑`panui` נשארת כמטמון, נגזרת).
3. [`runResourceAskmAcceptance.ts`](../src/lib/server/actions/helpers/runResourceAskmAcceptance.ts) —
   **להסיר את התנאי `recurring===true`**: גם `rent` ו‑`total` מקבלים
   `Mashabetahalich` עם `start`/`end`, בלי מחזורי חיוב (`recurring:false`,
   `cycleSize:null`). זה מה שנותן ל"השכרה" סוף‑סוף ישות חיה.
4. [`markResourceDone.ts`](../src/lib/server/actions/configs/markResourceDone.ts) —
   להוסיף `releaseResourceBooking`.
5. `createSheirutFromPending.ts` — `Sheirut.startDate/finnishDate` פותחים
   booking עם `source:'concierge'`.
6. `proposeObjectArchive` על `mashabetahalich` (מ‑`PLAN_OBJECT_ARCHIVAL`) —
   ביטול/שחרור מוקדם עובר בזרימת ההסכמה הקיימת, לא בפעולה חדשה.

---

## 5. QIDs (קריאות)

| qid | תפקיד |
|---|---|
| `2xxMyResourceBookings($uid,$from,$to,$spIds)` | הלוח האישי. מחזיר `sp`, טווח, `status`, `project`/`sheirut`, `source` |
| `2xxProjectResourceBookings($pid,$from,$to)` | לוח הריקמה — מה היא מחזיקה ועד מתי, ומה היא השאילה החוצה |
| `2xxSpAvailabilityWindow($spId,$from,$to)` | הזמנות של Sp יחיד — הקלט ל‑`checkAvailability` |
| `2xxSpsAvailabilityBulk($spIds,$from,$to)` | אצווה לשידוך, שלא לירות N שאילתות |

כולן נכנסות ל‑[`qidsAccess.js`](../src/routes/api/send/qidsAccess.js).
הרשאות: הלוח האישי `self`, לוח הריקמה `projectMember`, החלון הציבורי
(`2xxSpAvailabilityWindow`) מחזיר **רק טווחים תפוסים בלי זהות הצד השני**
למי שאינו ה‑owner — מי שוכר את המקרן זה לא עניינו של המחפש.

---

## 6. UI

### 6.1 רכיב משותף: `src/lib/components/resource/ResourceCalendar.svelte`

props: `{ bookings, resources, view, selectedSpIds, selectedParties, liveOnly,
onSelect, onPickDate }`. שלוש תצוגות — `list` / `month` / `week`; צבע לפי
`status` (hold=מקווקו, confirmed=זהב, active=ורוד, blackout=ניטרלי) מטוקני ערכת
הנושא בלבד, ותווית = שם המשאב + שם הריקמה/הלקוח.

**`list` היא ברירת המחדל והיא כתובה במארקאפ רגיל** — פתיחת העמוד בטלפון לא
מורידה שום ספריית לוח שנה. `@event-calendar` נטענת ב‑`import()` דינמי ממוזכר
רק כשמבקשים רשת חודשית/שבועית (ראה §9.1 להנמקה).

`resources` הוא רשימת המשאבים המלאה של המחזיק. בלעדיו הצ'יפים נגזרים
מההזמנות בלבד — ואז כל משאב **פנוי** נעלם מהמסנן, בדיוק המשאבים שהמחזיק הכי
רוצה לוודא שהם פנויים. יש על כך בדיקת רינדור.

### 6.2 עמוד חדש: `/me/resources` — "לוח המשאבים שלי"

- נגיש מכפתור 📅 ליד כל משאב ב‑`#my-resources` שבעמוד הפרופיל
  ([`userPr/edit.svelte`](../src/lib/components/userPr/edit.svelte), הבלוק
  שמרונדר עם `datan={'mash'}`), וגם מקישור אחד "לוח כל המשאבים" בראש הקטגוריה.
- מסננים: לפי משאב (multi‑select), לפי צד שני (ריקמה / לקוח / חסימה עצמית),
  לפי סטטוס, לפי טווח.
- `?sp=<id>` פותח ישירות במצב **משאב בודד** — בדיוק הדרישה "לפלטר ולראות רק
  אחד ספציפי".
- פעולת "חסום תאריכים" (`blockResourceDates`) בגרירה על הלוח.
- משאב עם `availability:'unlimited'` מוצג בפס נפרד "ללא תפוסה" ולא תופס
  שורות בלוח.

### 6.3 בריקמה: `/moach/[projectId]/resources`

טאב/עמוד עם אותו `ResourceCalendar`, שמראה:
- משאבים שהריקמה **מקבלת** (`Mashabetahalich` פעילים) ועד מתי,
- משאבים שהריקמה **מספקת** החוצה (ללקוחות קונסיירז' / לריקמות אחרות),
- התנגשויות צפויות (שני `Sheirut` על אותו משאב).

מתחבר ללוח הפתוח הקיים
([`prPr/open/OpenBoard.svelte`](../src/lib/components/prPr/open/OpenBoard.svelte)).

### 6.4 בלב: חפיפת תאריכים בהצעות

- ההצעות מגיעות מ‑qid **`212levResourceMatchSuggestions`** ומרונדרות ב‑
  [`lev/mashsuggest.svelte`](../src/lib/components/lev/mashsuggest.svelte).
  יש להוסיף ל‑qid את `sqadualed`/`sqadualedf` של ה‑`open_mashaabim` ואת
  `dateFit` מתוך `matchedOn` (JSON — לא צריך שדה חדש), ולהציג את החפיפה
  במפורש: "ביקשו 1.4–1.6 · פנוי אצלך 3.4–20.5 · חפיפה 47 ימים", עם כפתור
  **הצע תאריך אחר** שנכנס ל‑`dateNego` הקיים.
- ב‑[`resource/ResourceCreator.svelte:336`](../src/lib/components/resource/ResourceCreator.svelte)
  (`getUserSpByMashaabim`) — לסנן ולסדר לפי חפיפה במקום `panui: { ne: false }`.

---

## 7. השידוך (matching) — שער תאריכים

ב‑[`src/lib/server/matching/engine.ts`](../src/lib/server/matching/engine.ts),
בזרימת `matchOpenMashaabimToUsers`, **לפני** הניקוד:

1. `unlimited` → תמיד עובר.
2. אחרת — `checkAvailability` מול טווח הבקשה:
   - `available` → עובר, `dateFit = 1`
   - `partial` → עובר אם `overlapDays ≥ (minOverlapDays ?? 1)`,
     `dateFit = overlapDays / requestedDays`
   - `taken` / `outOfWindow` → **לא נשלחת הצעה**, אבל נרשמת
     `MatchSuggestion` עם `status:'dateBlocked'` כדי שאם ההזמנה החוסמת
     תבוטל, ההצעה תתעורר בלי לחשב הכול מחדש.
3. הניקוד ב‑[`scoring.ts`](../src/lib/server/matching/scoring.ts) מקבל רכיב
   נוסף, מוכפל ולא מחובר, כדי שחפיפה חלקית תוריד את כל הציון פרופורציונלית:
   `score = (matchedRoles + 2·matchedSkills + wwAdjustment − 2·missingSkills − missingRoles) × dateFit`
   — עם בדיקות שמראות ש‑`dateFit = 1` משחזר בדיוק את הציון הקיים
   (רגרסיה על `scoring.test.ts` הקיים).

`dateFlex: 'anytime'` על הבקשה מדלג על השער כולו.

---

## 8. מיגרציה ותאימות לאחור

| שלב | פעולה | סיכון |
|---|---|---|
| M0 | הוספת הקולקציה והשדות ב‑Strapi. אף קוד לא קורא מהם | אפס |
| M1 | `availability` נשאר `null` בכל השורות; `deriveAvailability(kindOf)` עונה במקומו | אפס — התנהגות זהה |
| M2 | Backfill: לכל `Mashabetahalich` פעיל עם `sp` → `resource-booking` `status:'active'` עם `start`/`end` שלו; לכל `Rikmash` סגור → `status:'done'` | נמוך, קריאה בלבד + יצירה |
| M3 | קריאה כפולה: `checkAvailability` רץ בצל ומדווח ל‑`metrics` איפה הוא חולק על `panui`. **`panui` עדיין השער** | אפס |
| M4 | היפוך: `checkAvailability` הוא השער, `panui` נכתב כנגזרת | בינוני — כאן צריך את M3 ירוק |
| M5 | UI: לוח אישי + לוח ריקמה | — |
| M6 | שער התאריכים בשידוך | בינוני — מסתיר הצעות; לפתוח מאחורי דגל |
| M7 | UI לבחירת `availability` מפורשת (`total` → `unlimited` למי שרוצה) | — |

**מה שלא עושים במיגרציה:** לא הופכים `total` ל‑`unlimited` אוטומטית. משאב
שנרשם כ"חד‑פעמי" יישאר `consumable` עד שהמחזיק יגיד אחרת — הפיכה אוטומטית
תפתח לשידוך משאבים שכבר לא קיימים.

---

## 9. הכרעות

1. **ספריית לוח שנה — `@event-calendar`, והתצוגה הראשית לא צריכה אף אחת.**
   ההכרעה נסגרה על מובייל. `@fullcalendar/core` תלוי ב‑**preact**, כלומר משגר
   ראנטיים VDOM שני לטלפון; `@event-calendar` תלוי רק ב‑svelte, הוא רכיב
   Svelte אמיתי (`<Calendar {plugins} {options} />`) ולא `new Calendar(el)`
   אימפרטיבי בתוך `onMount` כמו ב‑`TimersCalendar.svelte`.
   מעבר לזה: **ברירת המחדל היא תצוגת רשימה (agenda) שכתובה במארקאפ רגיל**,
   כך שפתיחת `/me/resources` בטלפון לא מורידה שום ספריית לוח שנה. הרשת
   החודשית/שבועית נטענת ב‑`import()` דינמי רק כשמבקשים אותה.
   איחוד שתי הספריות בשאר הקוד נשאר משימה נפרדת.

2. **גרנולריות — כפי שהוצע.** תמיד DateTime; `Sp.granularity` (`day | hour`)
   משפיע על עיגול בכתיבה ועל התצוגה בלבד. `roundToGranularity` מממש את זה,
   ואף פונקציית חישוב לא קוראת את השדה — ערך שגוי בו לא יכול לשנות אם שתי
   הזמנות מתנגשות.

3. **שתי הצעות על אותם תאריכים — אישור אחת משחרר את השנייה אוטומטית.**
   שתיהן נפתחות כ‑`hold` (אין "ראשון זוכה" שקט); ברגע שהמחזיק מאשר אחת,
   `conflictingHolds` מחזיר כל `hold` חי שחופף ושכבר לא נכנס תחת הקיבולת,
   והוא נסגר עם `cancelReason: 'conflict'`.
   שתי מגבלות מכוונות:
   - **רק `hold` משוחרר.** `confirmed`/`active` הוא הסכם חתום של מישהו אחר,
     והמנגנון הזה לא מבטל הסכמים.
   - **pool שיש בו מקום לשתיהן שומר את שתיהן** — השחרור קורה רק כשיש
     התנגשות קיבולת אמיתית.
   וכדי שזה לא ייהפך ל"לא" מוחלט: הצד ששוחרר מקבל את החלונות הפנויים
   (`freeWindows`) ואת `resources.conflict.released_*`, כלומר הזמנה להציע
   תאריכים אחרים דרך `dateNego` — השיחה ממשיכה, היא רק לא מחזיקה את המשאב.

4. **`Sheirut` וקישור ההזמנה** — נשאר פתוח, ייסגר יחד עם `PLAN_COMPLEX_PRODUCTS §7`.

5. **מי רואה מי שכר** — מוסתר. `309myResourceOccupancy` נעול ל‑`self` ב‑
   `guards.js`, ו‑qid החלון הציבורי (טרם נכתב) יחזיר טווחים תפוסים בלי זהות
   הצד השני.

6. **`total` → `unlimited`** — ידני, כפי שסוכם. `deriveAvailability` מחזיר
   `consumable` ל‑`total`, ויש על כך בדיקה ייעודית כדי שלא ישתנה בטעות.

---

## 10. מה מומש

### 10.1 הליבה (חישוב, טהור ונבדק)

| קובץ | מה |
|---|---|
| `src/lib/resources/types.ts` | טיפוסי ההזמנה, ציר התפוסה, `AvailabilityResult` |
| `src/lib/resources/availability.ts` | **מקור החישוב היחיד** — `checkAvailability`, `freeWindows`, `peakBookedQuantity`, `nextFreeFrom`, `conflictingHolds`, `roundToGranularity` |
| `availability.test.ts` (49) + `availability.pbt.test.ts` (10) | כולל האינווריאנטה "אין over‑booking" |
| `src/lib/resources/bookingView.ts` + טסט | שיטוח Strapi → `BookingView`, סינון, צבעים (טוקנים בלבד), קיבוץ לרשימה |
| `src/lib/resources/bookingsFromLegacy.ts` + טסט | קריאת תפוסה מ‑`Mashabetahalich` + `Rikmash` + `Sheirut` **בלי שינוי בקנד**, עם `perspective: 'holder' \| 'project'` |
| `src/lib/resources/dateMatchView.ts` + טסט | שורת החפיפה בכרטיס הלב — `null` כשאין מה להגיד |
| `src/lib/server/matching/scoring.ts` → `computeDateFit` + טסט | 0–1; כל קלט חסר מחזיר 1, כדי לא למחוק הצעות בשקט |

### 10.2 השרת (כתיבה, מאחורי דגל)

| קובץ | מה |
|---|---|
| `src/lib/server/resources/bookingStore.ts` + טסט | כל כתיבה ל‑`resource-booking` עוברת כאן: `bookingMode()`, `bestEffort`, `createBooking`, `setBookingStatus`, `confirmBookingAndRelease`, `releaseBookings`, `syncPanui` |
| `src/lib/server/resources/grantBooking.ts` + טסט | הפיכת מתן משאב מאושר לשורת יומן — `grantRange` / `grantQuantity` |
| 5 actions ב‑`configs/` | `createResourceBooking`, `confirmResourceBooking`, `cancelResourceBooking`, `blockResourceDates`, `releaseResourceBooking` (רשומות ב‑`configs/index.ts`) |
| `voteOnMaap.ts` | בקונצנזוס — פותח שורת יומן ומריץ `syncPanui` במקום להשאיר `panui:false` לנצח |
| `runResourceAskmAcceptance.ts` | כל קבלת askm רושמת שורת יומן, **גם `rent` ו‑`total`** — שם היום אין שום רשומה חיה |
| `createResource.ts` | הקצאה עצמית → שורת יומן + `syncPanui` |
| `markResourceDone.ts` | סוגר מנוע **ומשחרר** את ההזמנות. זה התיקון לבאג §0.2.1 |

### 10.3 ה‑UI

| קובץ | מה |
|---|---|
| `components/resource/ResourceCalendar.svelte` (+ `.svelte.test.ts`) | רשימה במארקאפ, רשת ב‑`import()` דינמי |
| `components/resource/DateOverlap.svelte` | "ביקשו … · פנוי אצלך … · חפיפה N ימים" + כפתור הצעת תאריך אחר |
| `routes/(reg)/me/resources/` | "לוח המשאבים שלי", כולל `?sp=<id>` |
| `routes/(reg)/moach/[projectId]/resources/` | לוח הריקמה — מה שהיא מחזיקה ומה שהיא התחייבה לספק |
| `moach/[projectId]/+layout.svelte` | טאב `resources` בקבוצת `opps`, ליד `open` |
| `userPr/edit.svelte` | קישור 📅 לכל משאב + קישור ללוח המלא |
| `lev/cards/sugestma.svelte` + `mashsuggest.svelte` + `LevCard.svelte` | שורת החפיפה על כרטיס הצעת המשאב |
| `offerings/MyResourcesEditor.svelte` | שלב המשאבים באונבורדינג (PLAN_ONBOARDING M5): תווית "פנוי / תפוס עד…" מחושבת ב-`deriveAvailability`+`nextFreeFrom` מעל `309myResourceOccupancy`, וקישור 📅 שמופיע רק כשיש בכלל תאריכים על המשאב |

### 10.4 פרוקסי, הרשאות ותרגום

| קובץ | מה |
|---|---|
| `qids.js` `309myResourceOccupancy` | תפוסה של מחזיק — נעולה ל‑`self` ב‑`guards.js` |
| `qids.js` `310projectResourceOccupancy` | תפוסה של ריקמה — נעולה לחברי הריקמה ב‑`guards.js` (בדיקת חברות אמיתית, לא רק id) |
| `qids.js` `204` / `205` | הורחבו בשדות התאריך שהשער ב‑§7 צריך |
| `src/lib/translations/*/resources.json` + `routes.js` + `moach.json` | namespace חדש ב‑5 שפות + תווית הטאב |
| `vitest.config.js` | שני projects — רק `*.svelte.test.ts` מקבל את תנאי ה‑`browser` |
| `client/actionClient.ts` | 5 המפתחות החדשים — ובדרך גם `voteOnMaap`, שמעולם לא נרשם ולכן `weget.svelte` צעק 3 שגיאות טיפוס |

### 10.5 הדגל `RESOURCE_BOOKINGS`

הקולקציה נכנסת **מתחת** לזרימות שכבר עובדות, ולכן כל כתיבה עוברת ב‑`bestEffort`
ואף פעם לא מפילה את הקורא. שלושה מצבים:

| ערך | מה קורה |
|---|---|
| `off` (ברירת מחדל) | לא נכתב ולא נקרא כלום. התנהגות זהה להיום, בדיוק. |
| `shadow` | שורות נכתבות והזמינות מחושבת, אבל `panui` עדיין השער. כאן משווים את שתי התשובות. |
| `enforce` | הזמינות היא השער. |

השלב האמצעי הוא לא פורמליות: `panui` **שגוי היום** (הוא לא חוזר ל‑true), אז
קפיצה ישירה ל‑`enforce` הייתה מחליפה תשובה שגויה אחת באחרת שלא נבדקה.

---

## 11. הסכימה ב‑Strapi — נוצרה

הקולקציה נכתבה בריפו הקנד (`1.0b`, ענף `shabab`) — **לא commit ולא deploy**.

### מה נוצר

| קובץ | מה |
|---|---|
| `src/api/resource-booking/content-types/resource-booking/schema.json` | הקולקציה עצמה |
| `src/api/resource-booking/{controllers,routes,services}/*.ts` | boilerplate של `factories.createCore*` |
| `src/api/sp/.../schema.json` | +`availability`, `capacity`, `leadTimeHours`, `granularity`, `resource_bookings` |
| `src/api/project/.../schema.json` | +`resource_bookings` |
| `src/extensions/users-permissions/content-types/User/schema.json` | +`resource_bookings` (הצד ההפוך של `owner`) |
| `src/api/match-suggestion/.../schema.json` | +`dateBlocked` ב‑`status` |

### שתי הכרעות ששונות ממה שהתכנית אמרה

**`draftAndPublish: false`.** ליומן אין מצב טיוטה — `status: 'hold'` *הוא*
הטיוטה. עם draft&publish, שורה בלי `publishedAt` הייתה בלתי נראית לשאילתות
ולכן **משחררת בשקט משאב שבפועל תפוס** — בדיוק סוג הבאג שהתכנית באה למנוע.
בעקבות זה הוסר `publishedAt` מ‑`createBooking`.

**רק שלושה צדדים הפוכים.** `sp`, `project` ו‑`owner` (המשתמש) קיבלו
`resource_bookings`, כי ה‑qids מקננים תחתיהם. כל השאר — `mashaabim`,
`sheirut`, `consumer_user`, `mashabetahalich`, `rikmash`, `maap`,
`open_mashaabim` — הם **חד‑כיווניים**, בדיוק כמו `maagad-member.user`
ו‑`decision.stipFunder` הקיימים. פחות סכימות נוגעות = פחות סיכון על DB חי.

`start` הוא השדה היחיד שסומן `required` — שורה בלי תאריך התחלה חסרת משמעות,
ועדיף שתיפול בקול (בתוך `bestEffort`) מאשר שתיכתב.

### נבדק סטטית

- שמות ה‑GraphQL חושבו מ‑`getTypeName` של `@strapi/plugin-graphql` עצמו:
  `resourceBookings` / `createResourceBooking` / `updateResourceBooking` —
  תואמים בדיוק למה ש‑`bookingStore.ts` שולח.
- כל 107 הסכימות נסרקו: כל `target` של relation קיים, וכל זוג
  `inversedBy`/`mappedBy` מצביע חזרה נכון. (ארבע אי‑התאמות שנמצאו הן קיימות
  מראש ולא קשורות: `cuntry`↔`deffinition`, `site-share-contribution`↔`project`,
  ו‑`role.permissions` שהוא content‑type של הפלאגין ולא בריפו.)

### מה שנשאר לך

1. ~~**commit + deploy** של `1.0b` (ענף `shabab`).~~ **בוצע.**
2. ~~**Settings → Users & Permissions → Roles → Authenticated** — לסמן
   `find` / `findOne` / `create` / `update` על `resource-booking`.~~ **בוצע.**
3. ~~`npm run types:update` בפרונט.~~ **בוצע** — `ResourceBooking` ו‑`Sp.availability`
   כבר ב‑`src/generated/`.
4. ~~לשנות את שני ה‑qids של הלב.~~ **בוצע** — `209levMatchSuggestions`
   ו‑`212levResourceMatchSuggestions` מסננים
   `status: { notIn: ["dismissed", "dateBlocked"] }`.
5. `RESOURCE_BOOKINGS=shadow` → backfill → השוואה → `enforce`. הכלים לזה
   נכתבו — **ראה §13**. מה שנשאר הוא הרצה והכרעה, לא קוד. ההשוואה כבר רצה פעם
   אחת מול הפרודקשן (§13.1.1): 22 `staleLocked` להחזיר להיצע, ו‑23 `blockers`
   שכולם חלון‑היצע שפג ולא תפוסה כפולה. שני הצעדים שנשארו הם הדגל עצמו
   וה‑backfill — ואחריהם השוואה שנייה.
6. **לשאול את ציר התפוסה בטופס היצירה.** `newsp.svelte` / `editsp.svelte` (§12)
   שואלים היום רק `kindOf`, ולכן קובץ דיגיטלי נכנס כ‑`total` ונגזר ל‑`consumable` —
   כלומר ננעל אחרי השאלה הראשונה (§0.2 באג 2). המקום הטבעי לשאלה הוא שלב
   המשאבים באונבורדינג ([`PLAN_ONBOARDING`](./PLAN_ONBOARDING.md) M5), שבו החבר
   מצהיר על המשאב בפעם הראשונה. חסום עד ש‑`Sp.availability` קיים — הכוונה
   המפורשת של המחזיק היא התנאי לעבור ל‑`unlimited` (§7), אז אי אפשר לגזור
   אותה במיגרציה.

---

## 12. קבצים שייגעו (הערכה)

**חדשים**
- `src/lib/server/resources/availability.ts` + `.test.ts` + `.pbt.test.ts`
- `src/lib/server/actions/configs/createResourceBooking.ts`,
  `confirmResourceBooking.ts`, `cancelResourceBooking.ts`,
  `blockResourceDates.ts`, `releaseResourceBooking.ts`
- `src/lib/components/resource/ResourceCalendar.svelte`,
  `ResourceCalendarFilters.svelte`, `BookingDetail.svelte`
- `src/routes/(reg)/me/resources/+page.svelte` + `+page.server.js`
- `src/routes/(reg)/moach/[projectId]/resources/+page.svelte`
- `src/lib/translations/<locale>/resources.json` (5 שפות)

**קיימים**
- `src/lib/server/actions/configs/createResource.ts`, `voteOnMaap.ts`,
  `markResourceDone.ts`, `createSheirutFromPending.ts`
- `src/lib/server/actions/helpers/runResourceAskmAcceptance.ts`
- `src/lib/server/actions/registry.ts`, `configs/index.ts`
- `src/lib/server/matching/engine.ts`, `scoring.ts` (+ בדיקות)
- `src/routes/api/send/qids.js`, `qidsAccess.js`
- `src/lib/components/userPr/edit.svelte`, `newsp.svelte`, `editsp.svelte`
- `src/lib/components/lev/mashsuggest.svelte`,
  `src/lib/components/resource/ResourceCreator.svelte`
- `src/lib/translations/routes.js` (שער ה‑namespace החדש) →
  `npm run check:i18n`

---

## 13. ההרצה: shadow → backfill → השוואה → enforce

שלב 5 ב‑§11 אינו שינוי קוד אלא **סדר פעולות**, ולכל שלב בו יש עכשיו כלי.
הכל יושב מאחורי endpoint אחד, נעול במפתח בדיוק כמו `/api/monthi`:

```
GET /api/resource-bookings?op=compare              # קריאה בלבד
GET /api/resource-bookings?op=backfill&dry=1       # מה ייכתב, בלי לכתוב
GET /api/resource-bookings?op=backfill             # כתיבה
```

המפתח הוא `ADMINMONTHER` — בכותרת `x-monthi-key`, או `?key=` למי שמריץ מ‑cron.

> ⚠️ **הרשאה שנייה, נפרדת מזו שב‑§11.2.** תפקיד `Authenticated` מכסה את
> הזרימות החיות (הן רצות עם ה‑JWT של המשתמש דרך `execFromContext`), אבל
> ה‑backfill רץ עם **טוקן ה‑API** של השרת (`SendToAdmin`), ולטוקן יש רשימת
> הרשאות משלו. טוקן מסוג *Custom* לא מקבל קולקציה חדשה מאליו, וזה נראה בדיוק
> כמו `"Forbidden access"` בלי שום רמז למה. לכן:
> **Settings → API Tokens → הטוקן של השרת → `find` / `findOne` / `create` /
> `update` על `resource-booking`.** ה‑endpoint מחזיר את המשפט הזה כ‑`hint`
> כשהוא נתקל בשגיאה הזו.

| קובץ | מה |
|---|---|
| `src/lib/resources/backfillPlan.ts` + טסט (15) | **מה** ייכתב: `Rikmash` → שורת יומן, כולל דה‑דופליקציה |
| `src/lib/resources/panuiCompare.ts` + טסט (11) | **ההשוואה**: `panui` מול תשובת היומן, ומי חוסם את ההיפוך |
| `src/lib/server/resources/backfill.ts` | ה‑IO: דפדוף על Strapi, כתיבה דרך `createBooking`, `syncPanui` |
| `src/routes/api/resource-bookings/+server.js` | ה‑endpoint הנעול |

### 13.1 סדר הפעולות

**1. `RESOURCE_BOOKINGS=shadow`** ב‑`.env` של ה‑API (ואז restart). מכאן כל
מתן משאב חדש רושם שורת יומן; `panui` עדיין השער, אז שום דבר בהתנהגות לא זז.

**2. Backfill.** קודם `&dry=1` — הוא מחזיר את הספירה לפי סטטוס ולפי סיבת דילוג
בלי לכתוב כלום, ו‑`&plan=1` מוסיף את השורות עצמן. כשהמספרים נראים סבירים,
אותה קריאה בלי `dry`.

עוגן ההרצה הוא `Rikmash` ולא המנוע, כי הוא הרשומה היחידה שנושאת `sp` — מנוע
מגיע למשאב *דרך* הארכיון שלו (בדיוק כמו `bookingsFromLegacy.ts`), ומנוע בלי
ארכיון אין לו משאב לרשום עליו. חלון הזמן נלקח מהמנוע כשיש אחד ומהארכיון כשאין,
והסטטוס מהמנוע (`closed`/`cancelled`/`finnished`) לפני התאריכים — כי הוא החלטה
שמישהו קיבל, והתאריכים רק מתארים אותה.

ההרצה **אידמפוטנטית**: שורה שכבר קיימת מזוהה לפי `rikmash`, לפי
`mashabetahalich`, ולבסוף לפי חתימת `sp|project|יום התחלה|יום סיום` — האחרונה
תופסת שורות שנכתבו בזרימה החיה לפני שהארכיון בכלל נוצר. אפשר להריץ שוב בלי
לשכפל.

בסוף ההרצה `syncPanui` רץ על כל משאב שנגעו בו — כי `panui` נשאר מטמון, ומטמון
שנכתב מיומן ריק הוא שקר.

> **מה שה‑backfill בכוונה לא עושה:** מתן `total` פתוח משנת 2023 בלי `sqadualef`
> נרשם כ‑`active` עם `end: null`, כלומר תפוס לתמיד. זה בדיוק מה ש‑`panui:false`
> אומר עליו היום, ולכן ההשוואה שותקת ושום משאב לא משתחרר בטעות. שחרור הוא
> הכרעה של המחזיק (`availability: 'unlimited'`, §7), לא של מיגרציה.

**3. השוואה** (`op=compare`). מחזיר, לכל `Sp`, את שתי התשובות ואת ההפרש:

- `staleLocked` — `panui:false` על משאב שהיומן אומר שהוא פנוי. זה באג §0.2.1
  (שום מסלול לא החזיר `panui` ל‑true). **צפוי שיהיו הרבה, וזה הרווח**: ההיפוך
  מחזיר את המשאבים האלה להיצע.
- `overOffered` — מוצע היום, תפוס לפי היומן. **זה הכיוון המסוכן**, ורק הוא
  נספר כ‑`blockers`: ב‑`enforce` הצעה חיה תיעלם. כל שורה כזו היא או תפוסה
  כפולה אמיתית שהייתה סמויה עד עכשיו, או שורת backfill שגויה — ויש לקרוא אותן
  אחת‑אחת לפני ההיפוך.

`panui` ריק (`null`) נחשב **מוצע**, כי כך הפילטרים החיים קוראים אותו
(`panui: { ne: false }`) — כל השוואה אחרת הייתה מודדת משהו שלא קורה בפועל.

**4. `RESOURCE_BOOKINGS=enforce`** — רק כאשר רשימת ה‑`blockers` ריקה או הוסברה.

כדי שאפשר יהיה לקרוא אותן בלי שאילתה נוספת, כל שורת השוואה נושאת `reason`
(`bookedOut` / `invalidWindow` / `offerWindowEnded` / `offerNotYetOpen` /
`unknown`) ואת חלון ההיצע עצמו (`offerStartsAt` / `offerEndsAt`), והסיכום מוסיף
`blockersByReason` — הספירה על **כל** הזנב, לא רק על ה‑50 הראשונים. חלון ההיצע
נבדק לפני ההזמנות כי הוא מכריע: מחוץ לחלון אין בכלל זמינות להזמין ממנה, וקריאה
ל‑`bookedOut` הייתה מפנה את הקורא להזמנות שאינן מה שתופס.

#### 13.1.1 ההרצה הראשונה של `op=compare` (6.9.2026, מול הפרודקשן, `mode: off`)

```
resources 94 | agree 49 | staleLocked 22 | overOffered 23
byModel  { consumable: 27, pooled: 14, exclusive: 4 }
blockersByReason { offerWindowEnded: 22, invalidWindow: 1 }
```

**23 ה‑blockers מוסברים במלואם, ואף אחד מהם אינו תפוסה כפולה.** היומן עדיין ריק
(ה‑backfill לא רץ), ולכן `holdingBookings: 0` בכולם: מה שסוגר אותם הוא חלון
ההיצע של המחזיק. 22 מהם הם שורות ה‑seed מ‑2022 שבהן `fdate = sdate + שנתיים`,
כלומר היצע שפג ב‑2024 ו‑`panui` נשאר `true`. ב‑`enforce` הם ייעלמו מההיצע — וזה
מה שהמחזיק כבר אמר כשקבע תאריך סיום.

היוצא היחיד הוא **`sp` 94 (`חומרי ניקוי`)**: `sdate: 2026-08-03` עם
`fdate: 1970-01-01` — חלון הפוך, כלומר שדה תאריך ריק שנשמר כ‑epoch. זו לא פקיעה
אלא באג נתונים בשורה אחת; שלושת מסלולי הכתיבה בקוד (`newsp` / `editsp` /
`createResource`) כולם שולחים `undefined` על תאריך ריק, אז מקורה מחוץ להם. יש
לנקות את `fdate` שלה ידנית בפאנל לפני ההיפוך.

> ההשוואה הזו נמדדה מול יומן ריק, ולכן היא מודדת `panui` מול חלון ההיצע בלבד.
> **צריך להריץ אותה שוב אחרי ה‑backfill** — שם, ורק שם, `bookedOut` יכול להופיע.

**החזרה היבשה של ה‑backfill** (`op=backfill&dry=1`, אותו יום) על 34 מתנים:

```
create 34 | skipped 0 | status_done 17 | status_active 17 | existing 0
```

והרצת אותן 34 השורות דרך `comparePanui` לפני שנכתבו — כלומר מה שההשוואה תראה
אחרי ההרצה — נותנת: `agree 53 · staleLocked 18 · overOffered 23`, עם
**`bookedOut: 0`**. ה‑backfill לא מוסיף אף חסם: הוא מזיז ארבעה משאבים
מ‑`staleLocked` ל‑`agree` (`panui:false` שהיומן מאשר עכשיו), ורשימת ה‑23 נשארת
בדיוק אותה רשימה של חלונות שפגו.

### 13.2 באג שההרצה הראשונה חשפה: `Sp.hm` לא קיים

הריצה הראשונה של `op=compare` נפלה מיד על
`Cannot query field "hm" on type "Sp"`. ל‑`Sp` אין `hm` — הכמות ליחידה נקראת
שם **`unit`**; `hm` הוא שמה של אותה כמות ב‑`Rikmash` וב‑`OpenMashaabim`, וזה
השם ש‑`ResourceLike` משתמש בו.

השגיאה הזו מפילה את **כל** המסמך, לא רק את השדה, ולכן היא שברה בשקט ארבעה
מקומות:

| קובץ | מה נשבר |
|---|---|
| `qids.js` `309myResourceOccupancy` / `310projectResourceOccupancy` | שתי השאילתות שמזינות את `/me/resources` ואת לוח הריקמה — כלומר העמודים האלה לא החזירו דבר |
| `bookingStore.ts` (`SP_FIELDS`, `loadSpLedger`) | כל `syncPanui` / `confirmBookingAndRelease` / `checkSpAvailability` — כלומר היומן היה נשבר ברגע ש‑`RESOURCE_BOOKINGS` יוצא מ‑`off`, ו‑`bestEffort` היה בולע את זה כאזהרה |
| `bookingView.ts` (`normalizeResourceNode`) | קרא `a.hm` על צומת `Sp` וקיבל תמיד `undefined` — כל pool נראה בקיבולת 1 |

תוקן: השאילתות מבקשות `unit`, והממפים קוראים `a.unit ?? a.hm` כדי לשרת את שתי
הצורות. `npm run validate:qids` לא תופס את זה — הוא מאמת שדות של **mutations**
בלבד, ועל queries רק בודק שהן פארסות.

### 13.3 מה עוד לא נכנס ל‑backfill

`Sheirut` (התחייבות לספק ללקוח קונסיירז') אינו חלק מההרצה: §8 M2 מגדיר אותה
על `Mashabetahalich` + `Rikmash` בלבד, והקישור `Sheirut`↔הזמנה עדיין פתוח
(§9.4, יחד עם `PLAN_COMPLEX_PRODUCTS §7`). עד שייסגר, לוח הריקמה ממשיך לקרוא
את ההתחייבויות האלה דרך `bookingsFromLegacy.ts`, כפי שהוא עושה היום.
