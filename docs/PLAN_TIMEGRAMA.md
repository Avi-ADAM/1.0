# TIMEGRAMA — שעון ההבשלה של הריקמה

> **סטטוס: טיוטה לדיון (סבב 1). טרם אושרה, טרם יושמה.**
> המסמך ממפה את המצב הקיים במלואו, מונה את התקלות עם ראיות (file:line),
> ומציע ארכיטקטורת יעד + תכנית עבודה בשלבים שאפשר לעקוב אחריה לאורך כמה
> סשנים. כל פריט עבודה מסומן ב-`[ ]` ומיועד לסימון תוך כדי התקדמות.
>
> נכתב ב-2026-08-24. עודכן לאחרונה: 2026-08-24.

---

## 1. למה המסמך הזה קיים

עברנו למערכת ה-**Action** (`src/lib/server/actions/`) כדי שלכל פעולה יהיה
מקום אחד, חתימה אחת, שער הרשאות אחד, וכדי שאפשר יהיה לקרוא לה מכל מקום —
לקוח, שרת, API חיצוני, cron. היום יש ~140 קונפיגורציות פעולה ורישום אחד
(`registry.ts`).

**TIMEGRAMA היא היוצאת מן הכלל היחידה שנשארה.**

`timegrama` הוא "שעון ההבשלה": הרשומה שאומרת *"בתאריך X, אם אף אחד לא ענה,
הגרסה שעל השולחן מאושרת"*. זה הביטוי הטכני של אחד מעקרונות-העל של המערכת —
**שתיקה היא הסכמה, בקצב הריקמה**. כלומר כמעט כל זרימת ההסכמה במערכת
(`ask`, `askm`, `pendm`, `pmash`, `decision` על כל הזנים שלו, `finiapruval`,
`stipend_payment`, רדימות, ארכוב בסוף מחזור) תלויה בו.

ובכל זאת:

- הקוד שמריץ אותו יושב ב-`src/routes/api/timegrama/` בעשרה קבצי
  `.svelte` (שאינם קומפוננטות — הם `<script module>` בלבד), עם GraphQL גולמי
  משורשר בתוך תבניות מחרוזת, ולא עובר דרך `actionService` בכלל.
- הלוגיקה בכל אחד מהם **משוכפלת** מתוך ה-Action המקבילה (`ask.svelte` מול
  `finalizeAskAcceptance.ts`, `finiapp.svelte` מול `closeFiniapruval.ts`,
  `pend.svelte` מול `voteOnPendm.ts`). שתי הדרכים יכולות להתפצל — ולמעשה
  כבר התפצלו.
- **חלק מהזנים אין להם קוד בכלל.** ה-cron מושך אותם, לא יודע מה לעשות
  איתם, לא מסמן `done`, וחוזר עליהם שוב בעוד שעה. לנצח.
- אין שום מדד, שום לוג מובנה, שום שדה שגיאה. timegrama שנכשל נראה בדיוק
  כמו timegrama שממתין.

זה בדיוק התיאור שהתלוננו עליו: *"הכרטיס פשוט נדחף שעה ועוד שעה"*.

---

## 2. מפת המצב הקיים

### 2.1 שרשרת ההפעלה

```
cron חיצוני  ──►  GET /api/pingrama            src/routes/api/pingrama/+server.js
                    │  (REND_URL || https://api.1lev1.com/)
                    │  fetch עם AbortController של 10 שניות
                    ▼
                  GET {REND}/api/timegrama      src/routes/api/timegrama/+server.js
                    │
                    │  שאילתה אחת: timegramas(done:{ne:true}, date:{lte: now+1h})
                    │  → לכל רשומה: x(id, whatami, tgid, fetch)
                    │     • date עבר      → קריאה מיידית (לא ב-await!)
                    │     • date בעתיד    → setTimeout עד שעה קדימה
                    ▼
                  x()  ──►  מפזר if/else ל-10 מטפלים
```

אין קונפיגורציית cron בריפו — ההפעלה חיצונית לחלוטין. אין אימות על ה-endpoint
(`GET /api/timegrama` פתוח).

מסלול נפרד ומקביל: `GET /api/monthi` (`src/routes/api/monthi/+server.js`) פותח
מחזורי `Maap` חודשיים ו**יוצר** להם timegrama — אבל אף אחד לא סוגר אותם
(ר׳ B2).

### 2.2 עשרת המטפלים

| קובץ | `whatami` | מה עושה | סגנון גישה לנתונים |
|---|---|---|---|
| `pend.svelte` | `pendm` | משימה ממתינה → OpenMission (+Ask למיועד, +match-suggestions) | `SendToAdmin` + GraphQL גולמי |
| `pendM.svelte` | `pmash` | משאב ממתין → OpenMashaabim (+match-suggestions) | `SendToAdmin` + GraphQL גולמי |
| `ask.svelte` | `ask` | מועמדות למשימה → Mesimabetahalich + צירוף חבר | `SendToAdmin` + GraphQL גולמי |
| `askm.svelte` | `askm` | מועמדות למשאב → `runResourceAskmAcceptance` | `strapiClient` + qids ✅ |
| `finiapp.svelte` | `finiapruval` | אישור שעות → FinnishedMission | `SendToAdmin` + GraphQL גולמי |
| `decision.svelte` | `decision` | כל זני ה-Decision (saleClaim, archiveObject/editObject, stipend*, pic/name/…) | מעורב: `SendToAdmin` + `execFromAdmin` |
| `mesimabetahalich.svelte` | `mesimabetahalich` | שעון רדימות → `openDormancyProposal` | `execFromAdmin` ✅ |
| `archiveEffective.svelte` | `mashabetahalich`, `matanot` | ארכוב בסוף מחזור | `SendToAdmin` + GraphQL גולמי |
| `stipendPayment.svelte` | `stipend_payment` | "הכסף הגיע?" → confirmed on silence | `SendToAdmin` + GraphQL גולמי |

שלושה סגנונות גישה שונים לאותו backend, ואף אחד מהם אינו `actionService`.

### 2.3 האינוונטר המלא — מי יוצר, מי מטפל, מי הפעולה המקבילה

| `whatami` | יוצר (producer) | מטפל ב-`x()` | Action מקבילה קיימת | סטטוס |
|---|---|---|---|---|
| `ask` | `applyToMission.ts:417`, `createMission.ts:278`, `nego/timegrama.ts:81`, `pend.svelte:199`, `archive/pendingOffers.ts:395` | ✔ `Ask` | `finalizeAskAcceptance` | **משוכפל** |
| `askm` | `availiableResorce/[id]/+page.svelte:209`, qid `127`, `runResourceAskmAcceptance.ts` | ✔ `Askm` | `finalizeAskmAcceptance` | ✅ תקין (משתמש ב-helper משותף) |
| `pendm` | `createMission.ts`, qid `165` | ✔ `Pend` | `voteOnPendm` | **משוכפל** |
| `pmash` | `createResource.ts:555` | ✔ `PendM` | `voteOnPmash` | **משוכפל + באג** (B4) |
| `finiapruval` | `completeMission.ts:173`, `timerSave.ts:203`, `timers/flushRateChange.ts:336` | ✔ `finiapp` | `closeFiniapruval` | **משוכפל + באגים** (B3, B5) |
| `decision` | `counterSaleClaim.ts:90`, `createSale.ts:268`, `createDonationSale.ts:144`, `updateProjectDetails.ts:144`, `archive/decision.ts:161`, `archive/vote.ts:223`, `stipend/decision.ts:158,227` | ✔ `Decision` | `voteOnDecision` | **משוכפל** (הכי מסוכן — 12+ זנים) |
| `mesimabetahalich` | `archive/dormancyClock.ts:70` | ✔ `Dormancy` | — | ✅ תקין |
| `mashabetahalich` | `archive/apply.ts:329` | ✔ `ArchiveEffective` | — | ✅ תקין |
| `matanot` | `archive/apply.ts:329` | ✔ `ArchiveEffective` | — | ✅ תקין |
| `stipend_payment` | `settleStipendCycle.ts:154` | ✔ `StipendPayment` | `confirmStipendPayment` | **משוכפל** |
| **`maap`** | `monthi/+server.js:342`, qid `mrCreateCycleTimegrama` | ❌ **אין** | `voteOnMaap` | 🔴 **יתום** (B2) |
| **`tosplit`** | `prPr/whowhat.svelte:841` | ❌ **אין** | `addVote` (type=`tosplit`) | 🔴 **יתום** (B2) |
| **`sheirutpend`** | `prPr/sheirut/addSheirut.svelte:82` | ❌ **אין** | `addVote` (type=`sheirutpend`) | 🔴 **יתום + לא נוצר בפרודקשן** (B2, B6) |
| **`askwant`** | `prPr/sheirut/sheirutShow.svelte:57` | ❌ **אין** | — | 🔴 **יתום + לא נוצר בפרודקשן** (B2, B6) |
| `act` | — (רק בסכמה + בשאילתה) | ❌ אין | — | ⚪ שדה מת |
| `actt` | — | ❌ אין | — | ⚪ שדה מת |
| `matanotpend` | — | ❌ אין, **וגם לא נשלף בשאילתה** | — | ⚪ שדה מת |
| `open_mission` | — | ❌ אין, **וגם לא נשלף בשאילתה** | — | ⚪ שדה מת |
| `open_mashaabim` | — | ❌ אין, **וגם לא נשלף בשאילתה** | — | ⚪ שדה מת |
| `timer` | — | ❌ אין, **וגם לא נשלף בשאילתה** | — | ⚪ שדה מת |

---

## 3. תקלות — ממופות ומדורגות

### 🔴 B1 — התור מוגבל בעמוד ברירת מחדל, בלי מיון ובלי גבול תחתון

`src/routes/api/timegrama/+server.js:59`

```graphql
timegramas (filters:{done:{ne: true}, date:{ lte: "…" }}) { data { … } }
```

אין `pagination`, אין `sort`. Strapi מחזיר עמוד ראשון בגודל ברירת המחדל
(`graphql.defaultLimit` — בין 10 ל-100, תלוי בקונפיגורציית ה-backend). אין
גבול תחתון על `date`, אז **כל timegrama תקוע מכל ההיסטוריה** נמצא בקבוצת
המועמדים ומתחרה על אותם N מקומות.

**זו ההשערה המובילה לשורש הבעיה שדווחה.** ברגע שנוצרים N רשומות תקועות
(יתומות מזן חסר-מטפל, או כאלה שנכשלות שוב ושוב), הן תופסות את העמוד הראשון
**לצמיתות** וכל timegrama חדש בעולם לא ייראה על ידי ה-cron. המערכת כולה
נעצרת בשקט מוחלט: אין שגיאה, אין לוג, פשוט "לא קרה כלום".

**חייב אימות ראשון**, לפני כל תיקון אחר:

```graphql
{ timegramas(filters:{done:{ne:true}, date:{lte:"<עכשיו>"}},
             pagination:{limit:1}) { meta{pagination{total}} } }
```

אם `total` גדול משמעותית מגודל העמוד — זה האישור.

---

### 🔴 B2 — ארבעה זנים נוצרים ואף פעם לא מטופלים

`maap`, `tosplit`, `sheirutpend`, `askwant` — כולם נוצרים בקוד חי, כולם
נשלפים בשאילתה של `+server.js`, ולאף אחד אין ענף ב-`x()`
(`src/routes/api/timegrama/+server.js:20-50`).

התוצאה מדויקת: `x()` נקראת, לא נכנסת לשום `if`, מסיימת בלי לעשות דבר,
`done` נשאר `false` — ובעוד שעה הכול חוזר. **זה "נדחף שעה ועוד שעה"**, וזה
גם מה שמייצר בהתמדה את מלאי הרשומות התקועות שמפוצץ את B1.

לגבי `maap` יש טוויסט: ההערה ב-`monthi/+server.js:339` אומרת *"the cycle
auto-approves once the window elapses (clients cast the YES)"* — ואכן
`src/lib/components/lev/weget.svelte:161-163,277` מריץ `autoApprove()`
בצד הלקוח כשהשעון פג. כלומר מחזור חודשי מאושר רק אם **חבר ריקמה במקרה
פותח את עמוד הלב**. זו לא הבשלה, זו הגרלה. גם `tosplit` ו-`sheirutpend`
זוכים להצבעה דרך `addVote.ts` אבל אף מסלול שם לא סוגר את ה-timegrama.

---

### 🟠 B3 — נתיבי יציאה מוקדמים שלא מסמנים `done`

כשמטפל מחליט "אין מה לעשות כאן", עליו לסגור את השעון. אחרת הרשומה
נשארת בתור לנצח (ומזינה את B1).

| מקום | התנאי | סוגר `done`? |
|---|---|---|
| `finiapp.svelte:33` | ה-finiapruval לא נמצא | ❌ |
| `finiapp.svelte:38` | כבר `archived` | ❌ |
| `finiapp.svelte:43` | יש הצבעת "לא" | ❌ |
| `pendM.svelte:24` | ה-pmash כבר `archived` | ❌ |
| `pendM.svelte` (כל ה-`catch`) | כל שגיאה | ❌ |
| `ask.svelte:29` | ה-ask לא נמצא | ❌ |
| `ask.svelte:99` | שאילתה שנייה החזירה null | ❌ |
| `ask.svelte:178` | המוטציה החזירה null | ❌ |

`decision.svelte`, `stipendPayment.svelte`, `archiveEffective.svelte`,
`mesimabetahalich.svelte` ו-`askm.svelte` **כן** עושים זאת נכון — הם הדגם
לחיקוי.

---

### 🟠 B4 — `pendM.svelte` קורס על רשומה חסרה

`src/routes/api/timegrama/pendM.svelte:24`

```js
if (res.data.pmash.data.attributes.archived != true) {
```

אם ה-pmash נמחק, `res.data.pmash.data` הוא `null` → TypeError → נבלע
ב-`catch` → אין `done` → תקוע לנצח. `pend.svelte:27` כבר תוקן לדפוס הנכון
(`?.` + יציאה עם `markDone`); `pendM.svelte` לא.

---

### 🟠 B5 — טקסט חופשי מוזרק ללא escaping לתוך מחרוזות GraphQL

`src/routes/api/timegrama/finiapp.svelte:87-88,115-116`

```js
missionName: "${fa.missname}",
why: "${fa.why ?? ''}",
```

גרשיים, שורה חדשה או `\` בתוך `why` (טקסט שהמשתמש הקליד!) שוברים את
המוטציה. התוצאה: שגיאת GraphQL, אין `done`, ניסיון חוזר כל שעה — **לנצח,
כי הקלט לא ישתנה**. זה בדיוק "מתקבלות שגיאות".

`decision.svelte` כבר פתר את זה נכון עם `gqlStr()` (שורות 17-19);
`ask.svelte` משתמש ב-block strings (`"""…"""`) שעמידים יותר אך עדיין
שבירים מול `"""` בתוכן. `finiapp.svelte` לא מוגן כלל.

---

### 🟠 B6 — `sheirutpend` / `askwant` נוצרים ב-GraphQL גולמי מהלקוח → 403 בפרודקשן

`addSheirut.svelte:82` ו-`sheirutShow.svelte:57` קוראים ל-`SendTo(query)`,
ש-`src/lib/send/sendTo.svelte` שולח כ-`{data:{query}}` — כלומר בלי `queId`.
`src/routes/api/send/+server.js:80`:

```js
if (!isDev) throw error(403, 'Raw GraphQL queries are not allowed; use a queId');
```

כלומר בפרודקשן **גם היצירה עצמה נכשלת**, לא רק ההבשלה. שני הזרימות האלה
צריכות מיגרציה ל-Action בכל מקרה — ר׳ שלב 4.

---

### 🟡 B7 — הדיספצ'ר לא ממתין למטפלים

`src/routes/api/timegrama/+server.js:101`

```js
x(myid, element.attributes.whatami, tgid, fetch);   // ללא await
```

בתוך `await Promise.all(all.map(async …))` — אבל הקריאה עצמה לא ב-`await`,
אז `Promise.all` נפתר לפני שמשהו באמת רץ, ו-`GET` מחזיר `'Hello Cron!'`
מיד. תחת `adapter-node` העבודה בדרך כלל תסתיים; תחת כל ריצה serverless
או restart של הקונטיינר היא נקטעת באמצע — אחרי מוטציה ראשונה ולפני
`markDone`.

בנוסף, `setTimeout` של עד שעה (`:107`) מחזיק עבודה בזיכרון התהליך: deploy,
crash או flip של blue/green מוחקים אותה בלי זכר.

---

### 🟡 B8 — אין הגנת ריצה כפולה (idempotency)

אין נעילה, אין `claimedAt`, אין בדיקת `done` מחדש לפני הכתיבה. שתי ריצות
cron חופפות (או `setTimeout` מריצה קודמת + הריצה הנוכחית) יכולות לעבד את
אותה timegrama בו-זמנית ולייצר **שני** `Mesimabetahalich` לאותה מועמדות.

---

### 🟡 B9 — אין תצפית ואין מחזור חיים לכשל

ל-`Timegrama` יש בדיוק שני מצבים: `done: false` ו-`done: true`. אין
`attempts`, אין `lastError`, אין `lastAttemptAt`, אין `status`. לכן:

- אי אפשר להבדיל בין "ממתין" ל"נכשל 400 פעם".
- אין דרך לשאול "מה תקוע?" בלי לקרוא לוגים.
- אין backoff — כשל קבוע נדפק על ה-backend כל שעה עד קץ הימים.

---

### ⚪ B10 — פערים קטנים לתיעוד ובדיקה

- **`done:{ne:true}` ו-NULL.** ב-SQL, `ne` מחריג שורות NULL. הסכמה מגדירה
  `done: Attribute.Boolean & Attribute.DefaultTo<false>`
  (`src/lib/generated/contentTypes.d.ts:6931`), אז רשומות שנוצרו דרך
  GraphQL מקבלות `false` — אבל שורות ישנות או כאלה שנכתבו ישירות ל-DB
  יכולות להיות NULL ו**בלתי נראות לצמיתות**. צריך שאילתת בדיקה חד-פעמית.
- **`GET /api/timegrama` פתוח וללא אימות.** כל אחד יכול להריץ את מחזור
  ההבשלה. לא נורא (הוא אידמפוטנטי-בכוונה), אבל בשילוב עם B8 זה וקטור
  לריצות כפולות.
- **רעש בלוגים.** `+server.js:78,80,89,93` מדפיסים payload-ים שלמים בכל
  ריצה, מה שהופך את הלוג לבלתי-קריא בדיוק כשצריך אותו.
- **חמישה שדות יחס מתים** בסכמה (`act`, `actt`, `matanotpend`,
  `open_mission`, `open_mashaabim`, `timer`) — שלושה מהם אפילו לא נשלפים,
  כך שאם מישהו ייצור אחד כזה הוא ייפול ל-`console.warn` בשורה 93 ויתקע.

---

## 4. ארכיטקטורת יעד

> **העיקרון:** `timegrama` הוא **תור מתוזמן**, לא מקום שבו נכתבת לוגיקה
> עסקית. הלוגיקה שייכת ל-Action. מטפל timegrama הוא מתאם דק בלבד:
> *קרא את המצב → החלט אם הגרסה שעל השולחן ראויה להבשלה → קרא ל-Action →
> סמן את השעון*.

### 4.1 עיקרון ההרשאה — principal חדש: `timeout`

הבשלת שתיקה אינה פעולה של אף משתמש. היום המטפלים "מתחזים" למשתמש
(`askm.svelte` בונה `acceptCtx = { userId: takerId }`) או עוקפים את שכבת
ההרשאות לגמרי דרך `SendToAdmin`. שניהם רעים: הראשון משקר ביומן, השני
מוותר על השער.

ההצעה: `PrincipalKind` חדש `'timeout'`
(`src/lib/server/authz/types.ts:11`), שמשמעותו *"שעון הריקמה, לא אדם"*.
Action שרוצה להיות ניתנת להבשלה מצהירה עליו ב-`access`, בדיוק כמו
ש-`apiKey` הוצג בעבר. זה נותן:

- שער סטטי אמיתי גם על המסלול הזה (היום: אין);
- רשימה מפורשת וניתנת לביקורת של "מה מותר לזמן לעשות לבד";
- `confirmedBy: 'timeout' | 'silence'` בנתונים ממשיך לשקף את אותו מקור.

### 4.2 רישום זנים במקום `if/else`

`src/routes/api/timegrama/kinds.ts` — טבלה אחת שהיא מקור האמת:

```ts
export const TIMEGRAMA_KINDS = {
  ask:        { relation: 'ask',        handler: matureAsk },
  askm:       { relation: 'askm',       handler: matureAskm },
  pendm:      { relation: 'pendm',      handler: maturePendm },
  // …
} satisfies Record<string, TimegramaKind>;
```

ומכאן נגזרים אוטומטית: רשימת ה-relations שהשאילתה שולפת, הדיספצ'ר, ובדיקה
(`kinds.test.ts`) שמוודאת שכל `whatami` שמישהו **יוצר** בקוד קיים בטבלה.
זה הופך את B2 לבלתי-אפשרי מבנית.

### 4.3 מחזור חיים מפורש לרשומה

הרחבת `Timegrama` בסכמת Strapi:

| שדה | טיפוס | תפקיד |
|---|---|---|
| `status` | enum `pending \| running \| done \| failed \| skipped` | מצב אמיתי במקום בוליאני |
| `attempts` | Integer (default 0) | כמה פעמים נוסה |
| `lastAttemptAt` | DateTime | מתי לאחרונה |
| `lastError` | Text | הודעת השגיאה האחרונה |

`done` נשמר כפי שהוא לתאימות לאחור (`status:'done'` ⇒ `done:true`).

כללי הריצה: `attempts >= 5` ⇒ `status:'failed'` ויציאה מהתור (עם התראה),
backoff מעריכי בין ניסיונות, ו-`running` + `lastAttemptAt` כנעילה רכה נגד
ריצה כפולה (B8).

### 4.4 עיבוד אמין

- `for … of` עם `await` במקום `Promise.all` בלי await (B7).
- ויתור על `setTimeout` הארוך: מריצים רק מה שהגיע זמנו. תדירות cron של
  10-15 דקות זולה יותר מלהחזיק שעה של עבודה בזיכרון תהליך.
- `pagination` מפורשת + `sort: "date:asc"` + עיבוד עד תקרה לריצה, כך
  שהתור מתנקז ולא נחסם (B1).

### 4.5 תצפית

`GET /api/timegrama?dry=1` שמחזיר JSON: כמה ממתינים, כמה נכשלו, פילוח לפי
`whatami`, ועשרת הישנים ביותר. זה הכלי שיאפשר לענות "מה תקוע?" בלי לוגים,
וגם מה שיאמת את B1 בשלב 0.

---

## 5. תכנית עבודה

> סדר מכוון: קודם **לראות**, אחר כך **לעצור את הדימום**, ורק אז **לאחד**.
> אין טעם למגר לוגיקה ל-Action בזמן שהתור חסום — נשקיע יום ולא נראה שינוי.

### שלב 0 — אבחון (חצי סשן, ללא שינוי קוד)

- [ ] 0.1 להריץ ספירה מול Strapi: כמה timegramas עם `done:{ne:true}` ו-`date` בעבר. פילוח לפי `whatami`.
- [ ] 0.2 לוודא מה `graphql.defaultLimit` בפועל ב-backend, ולהשוות לספירה מ-0.1 → אישור או הפרכה של **B1**.
- [ ] 0.3 לספור רשומות עם `done: null` (`filters:{done:{null:true}}`) → **B10**.
- [ ] 0.4 לתעד את הממצאים בטבלה בסוף המסמך הזה ("יומן ריצה").

### שלב 1 — עצירת הדימום (סשן אחד, שינויים כירורגיים)

- [ ] 1.1 `+server.js`: `pagination:{limit:200}` + `sort:"date:asc"` — **B1**.
- [ ] 1.2 `+server.js`: `await x(…)` ולולאת `for…of` במקום `Promise.all` — **B7**.
- [ ] 1.3 `+server.js`: `whatami` לא מוכר ⇒ `console.warn` + `markDone` (במקום שתיקה) — **B2** באופן זמני.
- [ ] 1.4 `finiapp.svelte`: `markDone` בשלושת נתיבי היציאה המוקדמים — **B3**.
- [ ] 1.5 `finiapp.svelte`: `gqlStr()` על `missname` ו-`why` (להעתיק מ-`decision.svelte:17`) — **B5**.
- [ ] 1.6 `pendM.svelte`: optional chaining + `markDone` בכל נתיב — **B3, B4**.
- [ ] 1.7 `ask.svelte`: `markDone` בשלושת נתיבי היציאה — **B3**.
- [ ] 1.8 להוריד את לוגי ה-payload מ-`+server.js`, להשאיר שורת סיכום אחת לריצה — **B10**.
- [ ] 1.9 `npm run check` + `npm test`.

### שלב 2 — ניקוי התור הקיים (חצי סשן)

- [ ] 2.1 סקריפט חד-פעמי תחת `scripts/`: לסמן `done:true` לכל timegrama יתומה (`whatami` ללא מטפל) שתאריכה עבר.
- [ ] 2.2 להריץ מחדש את ספירת 0.1 ולוודא שהתור התנקז.
- [ ] 2.3 לתעד ביומן הריצה.

### שלב 3 — רישום זנים + תצפית (סשן אחד)

- [ ] 3.1 `src/routes/api/timegrama/kinds.ts` עם הטבלה מ-§4.2.
- [ ] 3.2 `+server.js` נגזר מהטבלה (שאילתה + דיספצ'ר).
- [ ] 3.3 `kinds.test.ts`: סריקת כל `whatami: '…'` בקוד ואימות שהוא רשום.
- [ ] 3.4 `?dry=1` עם סיכום JSON — **§4.5**.

### שלב 4 — סגירת הזנים היתומים (1-2 סשנים) — **B2**

- [ ] 4.1 `maap` → מטפל שקורא ל-`voteOnMaap` בשם הריקמה; להסיר את ה-`autoApprove()` הלקוחי מ-`weget.svelte:277`.
- [ ] 4.2 `tosplit` → מטפל שמבשיל את החלוקה העומדת (`addVote` type=`tosplit`).
- [ ] 4.3 `sheirutpend` → מיגרציה של `addSheirut.svelte` ל-Action (**B6**) + מטפל הבשלה.
- [ ] 4.4 `askwant` → מיגרציה של `sheirutShow.svelte` ל-Action (**B6**) + החלטה: מטפל, או ביטול ה-timegrama אם אין לו משמעות עסקית.
- [ ] 4.5 להסיר מהסכמה/מהשאילתה את שדות היחס המתים, או לתעד למה הם נשארים.

### שלב 5 — מחזור חיים ואמינות (סשן אחד + שינוי סכמה ב-Strapi)

- [ ] 5.1 הוספת `status`, `attempts`, `lastAttemptAt`, `lastError` ל-`Timegrama` ב-Strapi.
- [ ] 5.2 `npm run types:update`.
- [ ] 5.3 עטיפת כל מטפל ב-runner אחיד: `running` → מטפל → `done`/`failed` + `attempts++`.
- [ ] 5.4 backoff + תקרת ניסיונות + התראה ב-`failed` — **B9**.
- [ ] 5.5 נעילה רכה נגד ריצה כפולה — **B8**.

### שלב 6 — איחוד מול ה-Action System (2-3 סשנים, אחד לזן)

- [ ] 6.1 `PrincipalKind: 'timeout'` ב-`authz/types.ts` + טיפול ב-`applyAuthz` — **§4.1**.
- [ ] 6.2 `decision` → `voteOnDecision` (הכי גדול; להתחיל ממנו כי הוא הכי מסוכן).
- [ ] 6.3 `finiapruval` → `closeFiniapruval`.
- [ ] 6.4 `ask` → `finalizeAskAcceptance`.
- [ ] 6.5 `pendm` → `voteOnPendm`; `pmash` → `voteOnPmash`.
- [ ] 6.6 `stipend_payment` → `confirmStipendPayment`.
- [ ] 6.7 שינוי סיומות `.svelte` → `.ts` (הם `<script module>` בלבד, לא קומפוננטות).
- [ ] 6.8 מחיקת `SendToAdmin` הישיר מהמטפלים; מקור גישה אחד.

---

## 6. קונבנציה — איך מוסיפים זן timegrama חדש

> החלק הזה הוא **התוצר התיעודי** של המסמך. אחרי שלב 3 הוא הופך למחייב.

1. **קודם כול — האם יש Action?** אם ההבשלה עושה משהו שמשתמש יכול לעשות
   ידנית, ה-Action כבר קיימת. הבשלה = אותה Action עם principal `timeout`.
   אין Action ⇒ קודם כותבים אותה, לא כותבים לוגיקה בתוך `timegrama/`.
2. **`whatami` חייב להיות שם של יחס אמיתי** על `Timegrama` — הדיספצ'ר
   פותר אותו כמפתח (`element.attributes[whatami]`).
3. **לרשום ב-`kinds.ts`.** בלי זה הבדיקה תיפול. אין `if/else`.
4. **סוגרים תמיד את השעון.** כל נתיב יציאה — הצלחה, "כבר מטופל", "לא
   נמצא", "לא ראוי להבשלה" — מסתיים ב-`markDone`. היחיד שלא: שגיאה זמנית
   שראוי לנסות שוב עליה, וגם היא מגדילה `attempts`.
5. **בלי מחרוזות GraphQL מורכבות ידנית.** משתנים או `gqlStr()`. טקסט
   משתמש שנכנס למוטציה בלי escaping = תור תקוע לנצח.
6. **סבב נגדי מאפס את השעון** — סוגרים את הישן (`done:true`) ופותחים
   חדש. לא מעדכנים `date` על אותה רשומה, אחרת ריצה שכבר בדרך תבשיל את
   הגרסה הלא-נכונה.
7. **הבשלה חייבת להיות שקולה להסכמה מפורשת.** אותו קוד יישום לשני
   המסלולים (הדגם: `applyStandingVersion` ב-`archive/vote.ts`, שמשמש גם
   את ההצבעה וגם את `decision.svelte`). שני מסלולים = שתי אמיתות.
8. **חריגה מכלל 7 — כשהשתיקה אינה הסכמה.** יש מקרים שבהם צד אחד חייב
   לחתום מפורשות: המממן ב-stipend (`funderHasSigned`), והמיועד בהצעה
   מוקצית (`assignedOffer` ב-`ask.svelte:64`). לתעד את החריגה בקוד ובתוכנית
   הרלוונטית.

---

## 7. שאלות פתוחות להכרעה

| # | שאלה | למה זה משנה |
|---|---|---|
| Q1 | האם `askwant` (בקשת שירות) בכלל אמור להבשיל בשתיקה? | אם לא — למחוק את ה-timegrama בצד היצירה, לא לכתוב מטפל. |
| Q2 | `maap` — הבשלה בשתיקה מאשרת הוצאה כספית חודשית. זה תקין, או שצריך חתימת אחראי מפורשת (כמו המממן ב-stipend)? | קובע אם 4.1 הוא מטפל רגיל או חריגה לפי כלל 8. |
| Q3 | תדירות ה-cron — להישאר שעתי ולוותר על `setTimeout`, או לרדת ל-10-15 דקות? | משפיע על 4.4 ועל דיוק ה-`restime` בפועל. |
| Q4 | להוסיף אימות ל-`GET /api/timegrama` (secret כמו `x-strapi-gate`)? | B10. |
| Q5 | האם להשאיר `.svelte` או לעבור ל-`.ts` (6.7)? עלול לשבור import-ים או הרגלים. | קוסמטי אבל מבלבל היום. |
| Q6 | האם `PrincipalKind: 'timeout'` הוא הדרך, או להסתפק ב-`serviceAdmin` עם דגל בקונטקסט? | קובע את היקף 6.1. |

---

## 8. יומן ריצה

> לעדכן בכל סשן. מטרה: להמשיך מאיפה שעצרנו בלי לקרוא את כל המסמך מחדש.

| תאריך | שלב | מה נעשה | ממצאים |
|---|---|---|---|
| 2026-08-24 | — | מיפוי מלא של המערכת, כתיבת המסמך | 10 מטפלים, 4 זנים יתומים, 10 תקלות ממופות. B1 הוא החשוד המרכזי וטרם אומת. |

---

## 9. קבצים רלוונטיים

**ליבה**
- `src/routes/api/timegrama/+server.js` — הדיספצ'ר
- `src/routes/api/timegrama/*.svelte` — עשרת המטפלים
- `src/routes/api/pingrama/+server.js` — ה-proxy שה-cron החיצוני פוגע בו
- `src/routes/api/monthi/+server.js` — יוצר מחזורי `maap` + timegrama

**יוצרים (producers)** — ר׳ העמודה השנייה בטבלה §2.3

**לוגיקה משותפת שכבר עושה את זה נכון (דגמים לחיקוי)**
- `src/lib/server/archive/vote.ts` — `applyStandingVersion`
- `src/lib/server/stipend/apply.ts` — `applyStandingStipend`, `funderHasSigned`
- `src/lib/server/nego/negoGate.ts` — `computeNegoGate`
- `src/lib/server/actions/helpers/runResourceAskmAcceptance.ts`
- `src/lib/server/nego/timegrama.ts` — `ensureCandidacyTimegrama`

**תוכניות קשורות**
- `docs/PLAN_OBJECT_ARCHIVAL.md` · `docs/PLAN_STIPEND.md` ·
  `docs/PLAN_sale_holder_consent.md` · `docs/PLAN_NEGOTIATION_CANDIDATES.md` ·
  `docs/PLAN_API_PERMISSIONS.md` · `docs/PLAN_RECURRING_SALES.md`
