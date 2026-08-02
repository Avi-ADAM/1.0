# תכנית: קוטביות במו"מ — מי הצד הנמוך, מי הגבוה, ומה כבר מוסכם

זיהוי אוטומטי של **הצד הנמוך והצד הגבוה** בכל תנאי במו"מ, גזירת **הליבה
המוסכמת** (מה שאיש לא חולק עליו) מול **הפער הפתוח**, וסגירה אוטומטית כשההצעות
מצטלבות.

נכתב: 2026-08-02 · ענף: `claude/negotiation-high-low-sides-jupqtj`
מסמכים משלימים: `Avi-ADAM/consensus/docs/main-repo-polarity-spec.md` (צד ה-AI
והגרף), `Avi-ADAM/1.0b/docs/PLAN_NEGOTIATION_POLARITY_BACKEND.md` (סכמה).
קרוא לפני: `docs/PLAN_NEGOTIATION_CANDIDATES.md`, `CLAUDE.md` §"הסכמה והחלטות".

---

## 0. תקציר מנהלים

היום סבב מו"מ הוא **חבילה אטומה**: אדם מציע ערכים, השני מצביע כן/לא, והמערכת
לא יודעת אם ההצעה החדשה *טובה יותר* או *גרועה יותר* לצד השני. לכן כל סבב דורש
פינג-פונג מלא, וגם כשההצעות כבר "עברו זו את זו" (מישהו מוכן לתת 300 כשהשני
ביקש 200) — אף אחד לא אומר לנו שהעסקה סגורה.

התכנית מוסיפה שכבה דקה ואופציונלית:

1. **קוטביות (polarity)** — לכל שדה ניתן-למו"מ, לאיזה צד עדיף ערך גבוה יותר.
   מגיעה מ־**קטלוג סטטי** (מחיר/שעות/שווי — ודאי), מ**הצהרת המציע** (טקסט), או
   מ־**AI + אשרור שני הצדדים** (בריפו `consensus`). ברירת המחדל: `none` — בדיוק
   ההתנהגות של היום.
2. **מודול חישוב טהור** (`src/lib/nego/polarity.ts`) שגוזר מהסבבים הקיימים:
   הצד הנמוך, הצד הגבוה, הליבה המוסכמת, הפער, והאם ההצעות הצטלבו.
3. **תצוגה** — פס "מוסכם / במחלוקת" בכרטיסי המו"מ, ומשוב חי בזמן העריכה
   ("ההצעה שלך סוגרת את הפער — היא תיסגר מיד עם השליחה").
4. **שער דו-צדדי מורחב** — הצעה שהיא **ויתור מוחלט** (טובה-יותר-או-שווה לצד
   השני בכל שדה) נחשבת להסכמה שלו בלי לחכות ללחיצה נוספת.

**עיקרון על:** שום דבר כאן לא כופה סקאלה. שדה בלי קוטביות ידועה מתנהג בדיוק
כמו היום; המערכת רק מפסיקה להתעלם ממידע שכבר קיים אצלה.

---

## 1. הבעיה, במילים של המשתמש

> "אם מישהו מוכן לתת 200 ומישהו אחר בא ואומר 300 — אנחנו יודעים מה הצד הנמוך
> ומה הגבוה. אפשר לומר: יש כבר הסכמה על 200, ו-100 עדיין בתהליך אישור."

שלוש תובנות נפרדות מסתתרות במשפט הזה, וכדאי להפריד ביניהן כי כל אחת דורשת
מנגנון אחר:

| # | תובנה | מה נדרש | סיכון |
|---|-------|---------|-------|
| **א** | יש **סדר** בין ההצעות (נמוך/גבוה) | קוטביות של השדה | נמוך — מתמטיקה טהורה |
| **ב** | ה**מינימום מוסכם** על כולם | קוטביות + חלוקוּת (divisible) | בינוני — צימוד בין סעיפים |
| **ג** | כשההצעות **מצטלבות** — העסקה סגורה | קוטביות + זיהוי צדדים | נמוך, אם שמרנים |

היום המערכת לא יודעת אף אחת מהשלוש, למרות שכל הנתונים כבר בבסיס הנתונים.

---

## 2. מה כבר קיים בקוד (מיפוי)

### 2.1 סבבי מו"מ — הנתונים כבר שם

| זרימה | ישות-אב | ישות-סבב | מי הצדדים | סימון צד |
|-------|---------|----------|-----------|----------|
| משאב פנימי | `pmash` | `nego-mash` (`isOriginal`, `users_permissions_user`) | חברי ריקמה בלבד | אין — **חד-צדדי** |
| משימה פנימית | `pendm` | `negopendmission` | חברי ריקמה בלבד | אין — **חד-צדדי** |
| מועמדות למשאב | `askm` | `nego-mash` (`ordern`, `proposedBy`) | מועמד ↔ ריקמה | ✅ `proposedBy` |
| מועמדות למשימה | `ask` | `negopendmission` (`ordern`, `proposedBy`) | מועמד ↔ ריקמה | ✅ `proposedBy` |
| שירות | `sheirutpend` | `sheirutnego` (`price`, `quant`, תאריכים) | לקוח ↔ ספק | נגזר מ-`users_permissions_user` |
| מתנות/רצון | `matanotpend`, `ratson-proposal` | `nego` (`proposedPrice`, `proposedQuantity`, `proposedHours`) | מציע ↔ ריקמה | נגזר |
| טענת מכירה | `Decision(kind:'saleClaim')` | `vots` עם `order` | מדווח ↔ מחזיק | דו-צדדי לפי הגדרה |

> **מסקנה חשובה:** במסלולי המועמדוּת יש כבר `proposedBy: candidate|project` —
> חצי מהעבודה של "מי הצד" כבר עשויה. במסלולים הפנימיים אין צדדים כי כולם על
> אותו צד (הריקמה מול עצמה) — שם המודל מתנוון ל**התכנסות** במקום ל**הצטלבות**
> (§4.4).

### 2.2 שכבות שנוגעות בעניין

- `src/lib/server/nego/negoGate.ts` — `computeNegoGate` — נקודת ההרחבה המרכזית.
  היום: `approvable = hasPMyes && takerYes && !hasNo`.
- `src/lib/components/prPr/negoM.svelte` (937 שורות) ו-`negoPend.svelte` (636) —
  בונות `newValues`/`originalValues` בשליחה. **כאן כבר יש דיף** — רק לא יודעים
  מה כיוונו.
- `src/lib/func/negoBridge.js` + ריפו `consensus` — כל תנאי כבר עובר כ-`BridgeField`
  עם `kind: 'number'|'date'|'text'`, `original`, `proposed`. חסר רק `polarity`.
- `consensus/src/lib/discussion/scale.ts` — `stanceValue` 0..100 לכל סעיף,
  `issueConsensus`, `locationFromClauses`. תשתית מצוינת לצד הטקסטואלי.
- `src/routes/api/timegrama/{ask,askm,pend,pendM}.svelte` — הפקיעה השקטה.
- `src/lib/revenue/` — התקדים לאיך נראה מודול חישוב טהור ובדוק בפרויקט הזה.

---

## 3. המודל

### 3.1 שני צדדים גנריים

כל מו"מ באתר, בכל הזרימות, הוא בין:

- **`provider`** — מי שנותן ערך אמיתי (עובד, בעל משאב, ספק שירות, מוכר).
- **`consumer`** — מי שמקבל אותו ומשלם (הריקמה, הלקוח).

זה **לא** "מי טוב ומי רע" — זו רק הגדרת כיוון לצירים. במסלולי המועמדוּת:
`proposedBy:'candidate'` → `provider`, `proposedBy:'project'` → `consumer`.
בשירות: יוצר ה-`sheirutpend` מול בעל ה-`sheirut`. במו"מ הפנימי: **כל הסבבים
`consumer`** (הריקמה מתמחרת מול עצמה) — ר' §4.4.

### 3.2 קוטביות של שדה

```ts
type Polarity = 'provider' | 'consumer' | 'none';
// 'provider'  — ערך גבוה יותר עדיף לנותן  (מחיר, שכר לשעה, שווי-לב)
// 'consumer'  — ערך גבוה יותר עדיף למקבל  (כמות יחידות, אחוזי אחריות)
// 'none'      — אין סדר מוסכם → מתנהג כמו היום
```

בנוסף לכל שדה:

```ts
interface FieldSpec {
  key: string;                 // 'price' | 'perhour' | 'total' | …
  labelKey: string;            // מפתח i18n — לא טקסט קשיח
  kind: 'number' | 'date' | 'text';
  polarity: Polarity;
  /** האם אפשר "לפצל" את הערך — תנאי לליבה מוסכמת מספרית */
  divisible: boolean;
  /** מקור הקוטביות; קובע כמה אגרסיבית המערכת תסמוך עליה */
  source: 'catalog' | 'author' | 'ai' | 'none';
}
```

### 3.3 הקטלוג ההתחלתי (`src/lib/nego/negoFields.ts`)

שמרני בכוונה. **רק צירי כסף ברורים מקבלים קוטביות בהתחלה.**

| ישות | שדה | קוטביות | חלוקה | הערה |
|------|-----|---------|-------|------|
| `pmash` / `nego-mash` | `price` | `provider` | ✅ | עלות לריקמה |
| | `easy` | `provider` | ✅ | שווי-לב |
| | `hm` | `consumer` | ✅ | יותר יחידות באותו מחיר |
| | `total` (`price×hm×montsi`) | `provider` | ✅ | **הציר הראשי** |
| | `sqadualed` / `sqadualedf` | `none` | ❌ | תלוי-הקשר (שכירות מול פרויקט) — opt-in |
| | `kindOf`, `recurring`, `cycleSize` | `none` | ❌ | מבנה, לא כמות |
| `pendm` / `negopendmission` | `perhour` | `provider` | ✅ | |
| | `total` (`perhour×noofhours`) | `provider` | ✅ | **הציר הראשי** |
| | `noofhours` | `none` | ✅ | **דו-משמעי** — יותר שעות = יותר שכר אבל יותר עבודה. `author` בלבד |
| | `howMany` | `none` | ❌ | |
| | `date` / `dates` | `none` | ❌ | |
| `sheirutnego` | `price` | `provider` | ✅ | |
| | `quant` | `consumer` | ✅ | |
| `nego` (מתנות/רצון) | `proposedPrice` | `provider` | ✅ | |
| | `proposedQuantity` / `proposedHours` | `none` | ✅ | תלוי-הקשר |
| כל השאר | `name`, `descrip`, `spnot`, `hearotMeyuchadot`, `location`, יחסים (skills/roles/acts) | `none` | ❌ | טקסט/מבנה → §6 |

> **למה `total` ולא `price`?** כי הצדדים מתמרנים בין המרכיבים: להוריד מחיר
> ולהעלות כמות זו לא הנחה. הציר הכספי הכולל הוא היחיד שאי אפשר "לרמות" בו,
> והוא כבר מחושב בקומפוננטות (`totalNew`/`totalOrig` ב-`negoPend`) ואף קיים
> כשדה על `negopendmission.total` ועל `projects.negom.total`.

### 3.4 המתמטיקה

לכל שדה מקוטב, נרמל לציר יחיד שבו **גבוה = טוב יותר ל-`provider`** (שדה
`consumer` מוכפל ב-1−). לכל צד קח את **ההצעה האחרונה שלו**:

```
p = ההצעה האחרונה של provider   (הדרישה)
c = ההצעה האחרונה של consumer   (ההיצע)
```

מכאן:

| גודל | הגדרה | משמעות למשתמש |
|------|-------|----------------|
| `high` / `low` | `max(p,c)` / `min(p,c)` + מי הציע | "הצד הגבוה: אתה, 300. הצד הנמוך: הריקמה, 200" |
| `settled` | `low` (רק אם `divisible`) | "כבר מוסכם: 200" |
| `gap` | `high − low` | "פתוח לדיון: 100" |
| `crossed` | `c ≥ p` | **העסקה סגורה** |
| `closeAt` | `p` (דרישת ה-provider) | לעולם לא נותנים למישהו יותר ממה שביקש |

**זה לב העניין.** דוגמת המשתמש: הריקמה מציעה 200 (`c=200`), המועמד מבקש 300
(`p=300`). `crossed=false`, `settled=200`, `gap=100`. ברגע שהריקמה תעלה
ל-350 → `crossed=true` → סוגרים על **300**, לא על 350.

**`settled` הוא הצהרתי, לא חוזי** (בשלבים 1–2): הוא אומר "אף אחד לא חולק על
200", לא "200 כבר שולמו". ההעברה בפועל של הליבה המוסכמת היא שלב 3 (§8), ורק
בהסכמה מפורשת — כי סעיפים מצומדים (§9.1).

### 3.5 דומיננטיות — מתי הצעה היא ויתור

```ts
dominates(newRound, counterpartyLastRound) → 'dominates' | 'dominated' | 'incomparable'
```

`'dominates'` (= ויתור מוחלט לטובת הצד השני) רק אם **כל** התנאים:

1. כל שדה ששונה בסבב החדש **מקוטב** (`polarity ≠ 'none'`), ומקורו קביל:
   `catalog`, או `author` **כשהמצהיר הוא המציע עצמו** (הצהרה נגד האינטרס שלו),
   או `ai` **שאושר על-ידי שני הצדדים**.
2. בכל שדה מקוטב, הערך החדש **טוב-או-שווה** לצד השני מול ההצעה האחרונה שלו.
3. לפחות שדה אחד טוב **ממש** יותר (אחרת זו הצעה זהה).
4. **אין** שדה לא-מקוטב ששונה (טקסט, מיקום, יחסים, `kindOf`…).

התוצאה: `'dominates'` היא **הסכמה גזורה** — הצד השני כבר הצהיר שהערך שלו מקובל
עליו, והצעה טובה-יותר עבורו לא יכולה להיות פחות מקובלת. תנאי 4 הוא מה ששומר
על השמרנות: שינוי טקסטואלי אחד מבטל את כל ההסקה.

> **חשוב:** דומיננטיות נמדדת רק מול תנאים שהצד השני **הביע בהם עמדה**. שדה
> שהוא מעולם לא נגע בו מושווה לערך הבסיס של הישות (`pmash`/`open_mission`),
> שהוא ממילא ההצעה המקורית שלו.

---

## 4. אלגוריתם, לפי זרימה

### 4.1 מועמדוּת (`ask` / `askm`) — דו-צדדי מלא

הזרימה שהכי מרוויחה. הסבבים כבר נושאים `ordern` + `proposedBy`.

```
rounds → קבץ לפי proposedBy → ההצעה האחרונה של כל צד
      → לכל שדה בקטלוג: standoff (low/high/settled/gap/crossed)
      → dominates(latest, counterpartyLatest)
```

### 4.2 חיבור ל-`computeNegoGate`

מרחיבים את `NegoGateInput` בשדות אופציונליים, בלי לשבור אף קורא קיים:

```ts
interface NegoGateInput {
  …                                  // כמו היום
  rounds?: RoundLike[];              // כבר קיים — יידרש עכשיו גם values
  polarity?: {
    mode: 'off' | 'log' | 'enforce'; // NEGO_POLARITY_MODE, בדומה ל-AUTHZ_MODE
    catalog: FieldSpec[];
    baseValues: Record<string, unknown>;  // ערכי הישות המקורית
  };
}
```

ובגוף:

```ts
// היום: takerYes = (!latest && takerApplied) || latest.proposedBy==='candidate' || vote
// נוסף:
const takerYesByDominance =
  latest?.proposedBy === 'project' &&
  dominates(latest, lastCandidateRound) === 'dominates';

const takerYes = …existing… || (enforce && takerYesByDominance);
```

וסימטרית `hasPMyes`: סבב `candidate` שהוא ויתור מוחלט מול ההצעה האחרונה של
הריקמה **אינו מאפס** את הסכמת הריקמה (היום כל סבב `candidate` מאפס — ר'
`PLAN_NEGOTIATION_CANDIDATES.md` §A.1). זו הטבה משמעותית: מועמד שמוריד דרישה
כדי לסגור, לא נענש בסיבוב המתנה נוסף.

**מצב `log`** רץ קודם בצל וכותב ללוג "היה מאושר אוטומטית" — בדיוק כמו שכבר
עשינו ב-`AUTHZ_MODE`. שבועיים בצל לפני `enforce`.

### 4.3 timegrama — הצעת-ויתור לא מאפסת את השעון

היום כל סבב נגדי מאריך/מאפס את ה-`restime` (`ensureCandidacyTimegrama`). סבב
שהוא `'dominates'` הוא **קבלה, לא הצעה נגדית** → אין איפוס, ואם השער נפתח
המימוש קורה בפקיעה הקרובה (או מיד, בזרימות ה-solo שכבר עושות זאת).

### 4.4 מו"מ פנימי (`pendm` / `pmash`) — התכנסות, לא הצטלבות

כאן כל המציעים על אותו צד (`consumer`): הריקמה מגבשת מה היא מוכנה לשלם. אין
הצטלבות — יש **התכנסות**:

```
settled  = min(כל ההצעות של חברים שהביעו עמדה)   // אף חבר לא מתנגד לסכום הזה
frontier = max(אותן הצעות)                        // הדרישה הגבוהה ביותר
gap      = frontier − settled
```

זה עדיין מידע יקר: "שלושה חברים הציעו 200/250/300 — 200 מוסכם על כולם, 100
פתוחים". שימו לב לסייג: `min` מחייב **רק את מי שהציע**. חבר ששתק לא הסכים
לכלום — עליו חלה שתיקת-ה-`restime` הרגילה, בלי שינוי.

תצוגה: אותו פס "מוסכם/במחלוקת", בלי התוויות "צד נמוך/גבוה" (אין צדדים) —
במקומן שמות המציעים.

### 4.5 `saleClaim` ושאר זרימות ה-`Decision`

`saleClaim` דו-צדדי מטבעו (מדווח ↔ מחזיק) והשדה היחיד באמת מקוטב הוא הסכום.
"קיבלתי 0" הוא הצעה נגדית לגיטימית → `settled=0`, `gap=כל הסכום`. אותה מכונה
בדיוק, בלי קוד ייעודי — רק adapter שממפה `vots`+`negom` ל-`Proposal[]`.

---

## 5. מבנה הקוד

### 5.1 חדש — לוגיקה טהורה ובדוקה

```
src/lib/nego/
  negoFields.ts       // הקטלוג הסטטי לפי sourceType (§3.3)
  polarity.ts         // computeStandoff, dominates, normalizeAxis
  polarity.test.ts    // יחידה
  polarity.pbt.test.ts// property-based (fast-check): סימטריה, מונוטוניות, אי-רגרסיה
  adapters.ts         // roundsToProposals לכל זרימה (ask/askm/pendm/pmash/sheirut/decision)
```

חוזה המודול:

```ts
export interface Proposal {
  roundId: string;
  ordern: number;
  side: 'provider' | 'consumer';
  userId: string;
  at: string;                              // ISO — לגרף ההתכנסות
  values: Record<string, number | string | null>;
  stance?: 'concession' | 'demand' | 'lateral' | 'unknown';
  fieldPolarity?: Record<string, DeclaredPolarity>;
}

export interface FieldStandoff {
  key: string; labelKey: string; kind: FieldSpec['kind'];
  polarity: Polarity; source: FieldSpec['source'];
  low:  { value: number; side: Side; userId: string; ordern: number } | null;
  high: { value: number; side: Side; userId: string; ordern: number } | null;
  settled: number | null;   // null כשהשדה לא divisible או לא מקוטב
  gap: number | null;
  crossed: boolean;
  closeAt: number | null;
  /** הצעות לאורך זמן — הקלט של גרף ההתכנסות */
  track: Array<{ ordern: number; at: string; side: Side; value: number }>;
}

export function computeStandoff(
  proposals: Proposal[],
  catalog: FieldSpec[],
  baseValues: Record<string, unknown>,
  opts?: { mode: 'bilateral' | 'convergent' }
): { fields: FieldStandoff[]; anyPolarized: boolean };

export function dominates(
  candidate: Proposal, counterpartyLatest: Proposal | null,
  catalog: FieldSpec[], baseValues: Record<string, unknown>
): 'dominates' | 'dominated' | 'incomparable';
```

טהור לחלוטין — בלי fetch, בלי stores, בלי `$t` (רק `labelKey`). מריץ זהה בשרת,
בלקוח ובקרון, כמו `src/lib/revenue/`.

### 5.2 שרת

- `src/lib/server/nego/negoGate.ts` — הרחבת `computeNegoGate` (§4.2).
- `src/lib/server/actions/configs/` — הפרמטרים `stance` ו-`fieldPolarity`
  מועברים ב-`submitNegoMission`, `submitNegoMash`, `counterOnAsk(m)`,
  `candidateCounterOnAsk(m)`, `proposeOnOpenMission/Mashaabim`,
  `customizeOpenMission/Mashaabim`. אין פעולה חדשה — רק שדות אופציונליים.
  אכיפה: `fieldPolarity` שמקורו `author` נשמר עם `declaredBy: context.userId`
  ולעולם לא מתקבל מהלקוח כ-`ai`-מאושר (§6.3).
- `src/routes/api/timegrama/{ask,askm}.svelte` — קוראים לשער המורחב; §4.3.

### 5.3 לקוח

- `src/lib/components/prPr/NegoStandoff.svelte` (חדש) — הפס "מוסכם / במחלוקת"
  + תוויות צד נמוך/גבוה. מוצג בכרטיסי `reqtom`/`reqtojoin`/`projectSuggestor`/
  `mashsuggest`, ובראש `negoM`/`negoPend`.
- בתוך `negoM`/`negoPend`: **תצוגה מקדימה חיה** בזמן העריכה —
  `dominates(draft, counterpartyLatest)`:
  - `'dominates'` → "ההצעה שלך מקובלת על הצד השני מראש — שליחה תסגור את המו"מ
    על X."
  - `'dominated'` → "ההצעה שלך פחות טובה לצד השני מהצעתו הקודמת — היא תפתח סבב
    חדש."
  - `'incomparable'` → אין הודעה (המצב הרגיל).
- שדה טקסט ששונה → שורת צ'יפים להצהרה (§6.2).

### 5.4 i18n

namespace קיים `nego` + `negotiation`. מפתחות חדשים בכל 5 השפות:
`nego.settled`, `nego.open_gap`, `nego.low_side`, `nego.high_side`,
`nego.crossed_banner`, `nego.will_close_on` (עם `{{amount}}` — **לא** `{{n}}`,
ר' CLAUDE.md §i18n), `nego.declare_adds`, `nego.declare_reduces`,
`nego.declare_lateral`, `nego.ai_suggested_polarity`, `nego.confirm_polarity`.
לרוץ `npm run check:i18n` + `npm run check:script` אחרי ההוספה.

---

## 6. שדות טקסטואליים — שלוש מדרגות

המשתמש צדק שזה החלק הקשה. שלוש מדרגות, מהזולה לחכמה, **וכולן אופציונליות**:

### 6.1 מדרגה 0 — ברירת מחדל: `none`

טקסט ששונה → הסבב `incomparable` → פינג-פונג רגיל. אפס סיכון, אפס עבודה.
**זו ההתנהגות אם לא עושים כלום, וזו התשובה ל"אולי לפעמים זה לא רלוונטי".**

### 6.2 מדרגה 1 — הצהרת המציע (הזול והכן ביותר)

בשליחת סבב שנגע בטקסט, שאלה אחת בלחיצה אחת **על החבילה** (וזו בדיוק ההצעה של
המשתמש "לבקש מהמשתמש באופן ידני על ההצעה בכללותה"):

> ההצעה הזו, מבחינת הצד השני:
> **[ נותנת יותר ]  [ נותנת פחות ]  [ פשוט אחרת ]**

- **"נותנת יותר"** = `stance:'concession'` — הצהרה **נגד** האינטרס של המצהיר,
  ולכן אפשר לסמוך עליה: היא מספיקה כדי לעבור את תנאי 4 של הדומיננטיות גם
  כששדה טקסט השתנה. עדיין נדרש שלא תרע בשום שדה מקוטב.
- **"נותנת פחות"** = `demand` — סבב רגיל, אבל התצוגה יודעת לצייר את הכיוון.
- **"פשוט אחרת"** = `lateral` — אין סקאלה. **זה מצב לגיטימי לגמרי**, לא כישלון,
  והוא מה שקורה כשהצדדים מציעים פתרונות שונים במקום כמויות שונות.

אופציונלית, לכל שדה טקסט ששונה, אותם שלושה צ'יפים ברמת השדה. לא חובה.

### 6.3 מדרגה 2 — AI + אשרור דו-צדדי (ריפו `consensus`)

הריפו `consensus` כבר מפרק עמדות לסעיפים עם `stanceValue` 0..100 מול "היבטים"
(`Issue`). מוסיפים שם endpoint `POST /api/polarity` שמחזיר יחס **הכלה** בין שני
ניסוחים על אותו היבט:

```jsonc
{ "relation": "entails" | "entailed_by" | "incomparable",
  "confidence": 0.0-1.0, "why": "…" }
```

`entails` = "הניסוח א' כולל בתוכו את ב'" — האנלוג הטקסטואלי של `min`: הניסוח
המוכל הוא **הליבה המוסכמת**, וההפרש הוא הפער.

**כללי בטיחות, לא ניתנים לפשרה:**
- ה-AI **מציע בלבד**. `source:'ai'` נחשב קביל לדומיננטיות רק אחרי `confirmedBy`
  של **שני** הצדדים (שני userId שונים משני הצדדים) — נשמר בשרת, לא בלקוח.
- עד האשרור מוצג כ"הצעת AI" מנוקדת, והשדה מתנהג כ-`none`.
- `confidence < 0.8` → לא מציגים בכלל.
- degrade חינני בלי `GROQ_API_KEY` (`available:false`), כמו `/api/decompose`.

פירוט מלא: `consensus/docs/main-repo-polarity-spec.md`.

---

## 7. שינויי סכמה (1.0b, ענף `shabab`)

תוספתיים בלבד, אין שינוי שובר. פירוט: `1.0b/docs/PLAN_NEGOTIATION_POLARITY_BACKEND.md`.

| טבלה | שדה | טיפוס | תפקיד |
|------|-----|-------|-------|
| `negopendmission` | `stance` | enum `concession/demand/lateral/unknown` | הצהרת המציע על החבילה |
| | `fieldPolarity` | json | `{ [key]: { dir, source, declaredBy, confirmedBy[] } }` |
| `nego-mash` | `stance` | enum (זהה) | |
| | `fieldPolarity` | json | |
| `sheirutnego` | `stance` | enum (שלב 2ב') | |
| `negotiation` (consensus) | — | — | ללא שינוי; הקוטביות נוסעת ב-`sourceMeta.fields[].polarity` הקיים כ-json |

**מה בכוונה לא נוסף:** אין `settled`/`gap`/`lowSide` בבסיס הנתונים. אלה
**נגזרים** מהסבבים, בדיוק כמו שהוחלט ב-`PLAN_NEGOTIATION_CANDIDATES.md` §2 לגבי
`currentRound`/`turn`. שמירת ערך מחושב תיצור מקור-אמת שני שייצא מסנכרון.

qids: הרחבת `getAskNegoRounds` / `getAskmNegoRounds` / שאילתות ה-`83levMainUserQuery`
להחזיר `stance`, `fieldPolarity` ואת שדות הערכים (`price`,`easy`,`hm`,`perhour`,
`noofhours`,`total`) על הסבבים — חלקם כבר מוחזרים.

---

## 8. שלבים

### שלב 1 — קריאה בלבד, בלי שינוי סכמה ⏳
1. `negoFields.ts` + `polarity.ts` + מבחנים (יחידה + pbt).
2. `adapters.ts` ל-`ask`/`askm` ול-`pendm`/`pmash`.
3. `NegoStandoff.svelte` + שילוב בכרטיסים ובראש `negoM`/`negoPend`.
4. תצוגה מקדימה חיה בזמן עריכה (`dominates` על הטיוטה).
5. i18n ב-5 שפות + `check:i18n` + `check:script` + `npm run check`.

**ערך מיידי, סיכון אפס:** אף החלטה לא משתנה — רק מה שהמשתמש רואה. אם המספרים
נראים שגויים בשלב הזה, מתקנים לפני שנוגעים בשער.

### שלב 2 — הצהרות ואוטומציה ⏳
6. סכמת Strapi (`stance`, `fieldPolarity`) + qids + `npm run types:update`.
7. צ'יפים להצהרת המציע (§6.2) בשליחה; העברת השדות בפעולות.
8. `dominates` בתוך `computeNegoGate` מאחורי `NEGO_POLARITY_MODE`.
   `off` → `log` (בצל, שבועיים, מדידה) → `enforce`.
9. timegrama: ויתור לא מאפס שעון (§4.3).
10. באנר "המו"מ נסגר אוטומטית — ההצעות הצטלבו" + נוטיפיקציה לשני הצדדים.

### שלב 3 — טקסט, גרף וליבה מבוצעת ⏳
11. `consensus`: `/api/polarity`, `settledCore` ב-`scale.ts`, אשרור דו-צדדי.
12. `consensus`: גרף התכנסות (`track` לפי סבב/זמן) — "המרחק בין הצדדים לאורך
    המו"מ". זה מה שהופך את הגשר משדה-מול-שדה לתמונה.
13. הרחבת ה-bridge: `polarity` + `rounds` ב-`BridgeField`/`sourceMeta`,
    `settled` ב-`resolution`.
14. **ביצוע הליבה המוסכמת** — הצעד הגדול: לאשר בפועל את 200 בזמן שממשיכים
    לדון על 100. דורש הסכמה מפורשת של שני הצדדים על הפיצול (§9.1), ולכן
    אחרון בתור וייתכן שראוי לו מסמך משלו.

---

## 9. סיכונים ושאלות פתוחות

### 9.1 צימוד בין סעיפים — הסיכון האמיתי
"אני מוכן ל-300 **רק אם** התאריך זז." נעילת 200 כ"מוסכם" בלי ההקשר מסלפת.
**מיטיגציה:** בשלבים 1–2 `settled` הוא **תצוגתי בלבד** ("אף אחד לא חולק"), לא
התחייבות; היחידה המחייבת נשארת החבילה. שלב 3 (ביצוע בפועל) ידרוש לחיצה מפורשת
של שני הצדדים על הפיצול. `dominates` חסין לזה מבנית — הוא דורש שיפור בכל השדות
בבת אחת.

### 9.2 עיגון (anchoring) — סיכון מוצרי, לא טכני
להראות "אתה הצד הגבוה" עלול לגרום לצד הנמוך לא לזוז ("למה שאזוז, אני כבר
הנמוך?"). **מיטיגציה:** לנסח סביב **הליבה המשותפת** ("הסכמתם על 200 — נשארו
100") ולא סביב "מי דורש יותר"; להימנע מכל תווית שיפוטית. תואם את "אין 'לא'
מוחלט" — המסך מדגיש התקדמות, לא עמדות.

### 9.3 `noofhours` והדו-משמעיים
יותר שעות = יותר שכר אבל יותר עבודה. לכן `none` בקטלוג, ו-`total` הוא הציר.
אם בפועל יתברר שמשתמשים מתמקחים על שעות — לפתוח דרך הצהרת מציע, לא דרך
ניחוש בקטלוג.

### 9.4 חלוקוּת
לתאריך אין "רצפה מוסכמת" (אין חצי תאריך). לכן `divisible:false` → מציגים
`gap`+`crossed` בלבד, בלי מספר "מוסכם". התאריכים ממילא `none` בקטלוג ההתחלתי.

### 9.5 מו"מ בן צד אחד
במסלול הפנימי אין הצטלבות (§4.4). לא לנסות להמציא שם "צד גבוה/נמוך" — להציג
התכנסות בין מציעים.

### 9.6 שאלות למשתמש
1. במסלול הפנימי (`pendm`/`pmash`) — הצגת ה"מינימום המוסכם" בין חברי ריקמה
   מועילה או מייצרת לחץ להתיישר כלפי מטה?
2. סגירה אוטומטית בהצטלבות — לסגור **מיד** או להראות "מוכן לסגירה, אשרו"?
   ברירת המחדל שבתכנית: לסגור אוטומטית ולהודיע, כי זה בדיוק "שתיקה = הסכמה".
3. האם `sqadualedf` בשכירות משאב הוא באמת `consumer` (החזקה ארוכה יותר)? אם כן
   אפשר להוסיף אותו לקטלוג לפי `kindOf:'rent'` בלבד.

---

## 10. צ'קליסט

### שלב 1
- [ ] `src/lib/nego/negoFields.ts` — קטלוג לפי sourceType
- [ ] `src/lib/nego/polarity.ts` — `computeStandoff` / `dominates` / `normalizeAxis`
- [ ] `src/lib/nego/polarity.test.ts` + `polarity.pbt.test.ts`
- [ ] `src/lib/nego/adapters.ts` — ask/askm/pendm/pmash → `Proposal[]`
- [ ] `NegoStandoff.svelte` + שילוב בכרטיסים
- [ ] תצוגה מקדימה חיה ב-`negoM`/`negoPend`
- [ ] i18n ×5 + `check:i18n` + `check:script` + `npm run check` + `npm test`

### שלב 2
- [ ] 1.0b: `stance` + `fieldPolarity` על `negopendmission` ו-`nego-mash`
- [ ] qids מחזירים אותם; `npm run types:update`
- [ ] צ'יפים להצהרה + העברה ב-6 פעולות המו"מ
- [ ] `dominates` ב-`computeNegoGate` מאחורי `NEGO_POLARITY_MODE` (off/log/enforce)
- [ ] timegrama: ויתור לא מאפס
- [ ] באנר + נוטיפיקציית "המו"מ נסגר בהצטלבות"

### שלב 3
- [ ] consensus: `/api/polarity` + `settledCore` + אשרור דו-צדדי
- [ ] consensus: גרף התכנסות
- [ ] bridge: `polarity` + `rounds` + `settled` ב-resolution
- [ ] ביצוע הליבה המוסכמת (מסמך נפרד)
