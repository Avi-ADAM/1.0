# `restime` — חלון החלטה, שתיקה כהסכמה, ואיפוס על-ידי הצעה נגדית

> נספח ל-[PLAN_user_sovereign_consent.md](./PLAN_user_sovereign_consent.md),
> [PLAN_rikma_as_state_machine.md](./PLAN_rikma_as_state_machine.md),
> ו-[PLAN_serverless_p2p_data.md](./PLAN_serverless_p2p_data.md).
>
> שאלת המוצא: ב-1lev1 קיים מנגנון בשם **`restime`** — Project enum
> (`feh`/`sth`/`nsh`/`sevend` = 48h/72h/96h/168h) שמגדיר זמן לקבלת
> החלטות. אם אין התנגדות בזמן הזה — האישורים שכבר נצברו מספיקים.
> **הצעה נגדית מאפסת את השעון** (קוד היום: `orderon` עולה ב-1,
> הצבעות קודמות לא נספרות לסיבוב החדש). דפוס יפה ומוכר —
> *lazy consensus with counter-proposal reset*.
>
> השאלה: איך זה משתלב במודל החתום-המבוזר? **זמן אינו תכונה native
> ב-DAG**, ו**שתיקה קשה להוכיח** בשרשרת ארבעה איכויות. זה הקושי
> ההלכתי האמיתי.

---

## 1. שלוש התכונות שצריך לשמר

מהקוד הקיים (`completeMission.ts`, `voteOnPendm.ts`, `voteOnPmash.ts`):

1. **חלון זמן קבוע** (`finishDate = createTs + calcX(restime)`)
   — מצב "ממתין להחלטה" עם תאריך סיום ידוע מראש.
2. **שתיקה = הסכמה**, אבל מותנה בסף ⌣ הצבעות שכבר נספרו "בסיבוב הנכון".
3. **הצעה נגדית מאפסת**: `orderon++`; ההצבעות שב-orderon הישן לא תקפות לסיבוב החדש. ה-deadline חוזר אחורה.

המנגנון הזה לא טריוויאלי אבל גם לא מקרי — זו דרך מוכרת לקבל החלטה
**כשלא ניתן להבטיח 100% נוכחות**:

| מודל | היכן הוא חי | דמיון |
|---|---|---|
| Apache Lazy Consensus | קהילת קוד פתוח | "אם אף אחד לא מתנגד תוך 72h, ההצעה עוברת" |
| EU Silence Procedure | דיפלומטיה | מאשרים החלטה בכתב; השתיקה מ-N ימים = הסכמה |
| Robert's Rules — Tabling | פרלמנטריזם | החלטה נדחית עד שמישהו מבקש לפתוח, אחרת היא עוברת |
| Roman Catholic "tacit consent" | חוק קנוני | שתיקת הסמכות בזמן קצוב = הסכמה |

המכנה המשותף: **הזמן הוא משתתף שלישי**. הוא נותן לכולם הזדמנות, ועובד
לטובת התקדמות. הקושי הטכני בכל מימוש: זמן מתקדם בלי אירועים, ושתיקה
דורשת הוכחת absence.

---

## 2. שלושה אתגרים שונים מאוד שצריך להפריד

### א. הזמן עצמו — מי קובע מתי `finishDate` עבר?

ב-Phase 0 ה-DAG לא "מתקתק". אירועים מצטרפים רק כשמישהו חותם. שיחה
בלי הצבעות אחרי 80 שעות = שום אירוע. **אי אפשר ליצור אירוע "ה-restime
עבר" באופן ספונטני**.

### ב. שתיקה — איך מוכיחים שאף אחד לא התנגד?

הוכחת absence היא הבעיה הקשה של מערכות מבוזרות. מה אם counter-proposal
נחתם, אבל הסנכרון של החותם נכשל ולא הגיע למישהו אחר? קלייאנט שלא ראה
אותו ירוץ "ה-restime עבר; כולם הסכימו" — בטעות.

### ג. שעון לא-אמין — שני קלייאנטים, שעונים שונים

מובייל אחד ב-UTC-5, אחר ב-UTC+9, אחד עם קלוק מוטעה ב-2 שעות. מי קובע
מתי באמת 72 שעות עברו?

הפתרונות לכל אחד מבדלים אבל מתחברים.

---

## 3. ארכיטקטורת התשובה: שלושה אירועים חדשים + שני שדות

### 3.1 `proposal.counter` — הצעה נגדית כאירוע chain-native

```ts
{
  action: 'proposal.counter',
  subject: { type: '...', id: '...' },    // אותו subject כמו ההצעה המקורית
  predicate: {
    counterTo: 'evt-original-proposal',   // ה-id של ההצעה המוקצנת
    content: { ... }                      // הצעה נגדית עצמה
  },
  parents: ['evt-original-proposal'],     // כפיית ה-DAG
  // ... חתימה רגילה ...
}
```

**אפקט ב-projection**: בודק ה-subject מקבל `currentRound++`, וה-`roundStart`
שלו נקבע ל-`ev.ts`. ההצבעות הקודמות שב-round הישן נשארות בלוג (אודיט)
אבל לא נספרות לסיבוב החדש. **זה בדיוק `orderon` של היום, אבל
chain-native ודטרמיניסטי.**

### 3.2 `consensus.timeout` — סגירה על בסיס שתיקה

```ts
{
  action: 'consensus.timeout',
  subject: { type: '...', id: '...' },
  predicate: {
    closingRound: 2,
    roundStart: 1748000000000,            // ts של הסיבוב הזה
    roundDuration: 72 * 3600 * 1000,      // החלון (משאוב מ-restime של ה-rikma)
    expectedEnd: 1748259200000,           // = roundStart + roundDuration
    counted: ['ev_v1', 'ev_v2'],          // הצבעות שספרו (ב-round הזה)
    attestedNow: 1748263000000            // השעון של החותם בשעת החתימה
  },
  quorum: {                                // מהמודל ב-PLAN_rikma_as_state_machine
    rule: 'timeout',
    evidence: ['ev_v1', 'ev_v2', 'ev_proposal'],
    absenceClaim: {
      dagHeadId: 'evX',                   // ה-head שהחותם רואה
      syncedFromPeers: ['peerA', 'peerB'] // עדי-סנכרון לחיזוק טענת ה-absence
    }
  },
  stateRoot: '...',                        // (PLAN_rikma_as_state_machine)
  delta: [{ kind: 'consensus.reach', subject, decision: 'approve' }],
  sig: '...'                               // חתימה של החבר שזיהה שהשעון עבר
}
```

**מי חותם?** כל חבר ברקמה שזיהה שהשעון עבר. הראשון לחתום זוכה — הצאצא
ב-DAG מתחיל מ-`consensus.timeout` הראשון שצורף.

### 3.3 `time.tick` — מעקף לבעיית השעון (השלב הראשון)

ב-S2-S3 (לפני בשלות p2p מלאה), ה-relay של ה-SvelteKit פולט אירועי-זמן
חתומים בקצב קבוע (כל 15 דקות?):

```ts
{
  action: 'time.tick',
  subject: { type: 'global', id: 'clock' },
  predicate: { wallClock: 1748000000000 },
  sig: '<relay-key>'
}
```

לקוחות סומכים על ה-relay בנושא הזה (לא בתוכן — תוכן נשאר מוצפן/חתום
על-ידי משתמשים), כדי לקבע שעון משותף. ב-S4+ זה מוחלף בשעון-עמיתים
(§5.2).

---

## 4. שני שדות חדשים על Project / Ratson

| שדה | סוג | תפקיד |
|---|---|---|
| `restimeMs` | Integer (ms) | נורמליזציה של `restime` ל-ms. מאפשר ערכים שאינם 48/72/96/168 (קונסיירז' עתידי, רקמות ייחודיות). ה-enum הקיים נשאר עבור UX, מתורגם ל-ms בעת `project.create` או `project.amend` |
| `clockTolerance` | Integer (ms, default `15 * 60 * 1000`) | החלון להבדלי שעונים בין חברים. אם חבר אחד אומר "ה-restime עבר ב-`X`" ואחר אומר "ב-`X+5min`" — זה בסדר. ב-`X+30min` — חשד |

`restimeMs` יכול גם להיות מ-`predicate` של `project.create` ולא משדה
על ה-entity (לעקביות עם המודל החתום). אבל בתחילה — שדה כדי שה-UI הנוכחי
ימשיך לעבוד.

---

## 5. כללי validation — מה הופך `consensus.timeout` לתקף

חבר שראה אירוע `consensus.timeout` חוזר ב-DAG מבצע 5 בדיקות לפני שמכבד אותו:

1. **חתימה תקפה** (כמו כל אירוע).
2. **`closingRound` תואם ל-projection** — ה-round הנוכחי של ה-subject
   באמת ה-`closingRound` ולא שונה.
3. **`expectedEnd` מחושב נכון**: `roundStart + restimeMs == expectedEnd`.
4. **השעון עבר**, *לפי המודל שנבחר ל-clocking* (§3.3 או §5.2): השעון
   המשותף ≥ `expectedEnd - clockTolerance`.
5. **אין `proposal.counter` ב-DAG בין `roundStart` ל-`expectedEnd`**.
   זו ה-absence proof. הוכחה ניתנת לאימות ב-O(round-size events).

אם 5 הבדיקות עוברות → ה-projection מקבל את ההחלטה כסגורה. אם אחד נכשל
→ האירוע נדחה, ה-round ממשיך.

**הסיכון הקריטי שצריך לטפל בו**: מקרה ההכחשה הסביר. א' חתם
`proposal.counter` ב-71h, ב' חתם `consensus.timeout` ב-73h *לפני* שראה
את ה-counter. שניהם תקפים מבחינתם. ה-DAG מקבל את שניהם.

**הפתרון** (חכם וטבעי ל-state-machine): ה-`consensus.timeout` מצביע
על `dagHeadId` ספציפי שהחותם ראה. אם ה-DAG מכיל `proposal.counter`
שהוא **אבא** של `consensus.timeout` (כלומר היה גלוי לחותם) — `proposal.counter`
מנצח. אם הוא מקבילי (ענף נפרד) — ה-projection מסמן את ההחלטה
כ"שנויה במחלוקת" וההגדרה דורשת round חדש שמתחיל מ-`merge` event.

זה לא טבעי משפטית? להפך. **זו עקרון של דיני חוזים**: אם הצעה הגיעה
לפני אישור — היא מבטלת את האישור.

---

## 6. מודלי שעון מתקדמים יותר (אחרי §3.3)

### 6.1 שעון-עמיתים (S4+) — heartbeat-based

כל חבר פולט `member.heartbeat` עם השעון שלו אחת לזמן (שעה?). ה"שעון
של הרשת" = median של ה-heartbeats שזוהו ב-N הזמן האחרון. דומה לכלל ה-
median-timestamp של Bitcoin (חוסם attacker שמוסיף שעון אחד מטעה).

יתרון: **אין trust בשרת**. חסרון: דורש זרימה של heartbeats — צריך מספיק
חברים פעילים. רקמה קטנה מאוד (3 חברים) עלולה לסבול.

### 6.2 שעון מעורב — חלוקה לפי סוג ההחלטה

- החלטה תפעולית (אישור משימה, הצבעה על Tosplit) — שעון הרלאי (זול
  ומהיר).
- החלטה חוקתית (הסרת חבר, שינוי כלל קונסנזוס) — דורש שעון-עמיתים
  עם quorum חתימות-זמן עצמאיות.

זה משלב את **6.1 ו-6.2** של ה-state-machine doc: כללים שונים לסוגי
החלטות שונים, מסומלים ב-`consensusSpec` שמותאם ל-action.

### 6.3 הצרכן "לוקח חופש" — pause-clock

חבר שיוצא לחופשה חותם `member.away` עם `until: 1748xxxxxx`. בזמן הזה
שתיקתו **לא** נספרת כהסכמה אקטיבית — ההכרעה מתבצעת רק אם הקוורום
שמוגדר בכלל מתאחד **בלי** את החבר ה-"away" (או שה-deadline מוארכת
אוטומטית עד שיחזור — בחירה לפי חוקי הרקמה).

מאוד תואם לערכים: שתיקה היא הסכמה רק כשהיה לחבר ההזדמנות. **הופך
את ה-lazy consensus להוגן** באמת ב-edge cases.

---

## 7. שש מסקנות פילוסופיות-מוצריות שלא ראיתי בקוד היום

ההמרה ל-chain-native מאפשרת לראות את `restime` בעיניים חדשות:

### 7.1 השרשרת מתעדת לא רק את ההחלטה, אלא את **תהליך השכנוע**

היום: ב-DB יש המצב הסופי + הצבעות בודדות.
ב-chain: כל הצעה-נגדית, כל איפוס, כל פאוזה — אירועים שמרכיבים את
ה-narrative. **"איך הגעתם להחלטה הזו" הופך לשאלה ניתנת-לאימות**, לא
פולקלור. שימושי לקבוצה לומדת על עצמה, ולחובות שקיפות.

### 7.2 שתיקה כהסכמה היא **טכנולוגיה אזרחית**

ה-`consensus.timeout` + `proposal.counter` הוא **פרוצדורה משפטית
ניתנת-לאזרחית** — קבוצה יכולה להחזיק ספר חתום שמתעד "ההצעה הזו עברה
כי לאף אחד לא הייתה התנגדות בחלון שהקבוצה עצמה הגדירה". זה משפטית
חזק יותר ממה ש-Strapi נותן היום. שווה תרגום ל-PDF חתום באקסל לחוזים:
"ראיון לפי 1lev1 §X.Y.Z = שתיקה במשך 72 שעות אחרי הצעה שמסומנת `subject:Z`
שעות = הסכמה משפטית".

### 7.3 ה-`restime` הופך לפרמטר הוגן של רקמה — לא מקרי

היום הוא חבוי באנום (`feh`/`sth`/...). ב-chain הוא חלק מ-genesis של
הרקמה (`project.create.predicate.restimeMs`). כל שינוי שלו דורש
הסכמה — `project.amend.restimeMs`. **חברים בקואופ קובעים את "קצב
ההחלטה" שלהם** כפעולה מודעת, לא ברירת מחדל.

### 7.4 escalation אחרי K סיבובי-איפוס

טפילי-counter שמאפסים שעון אינסופית — בעיה רטורית-מובהקת. ב-chain ניתן
לבטא: "אחרי 5 counter-proposals על אותו subject, ה-rule משתנה אוטומטית
מ-`unanimous` ל-`majority`". זה גם encoded ב-`project.config`. **ניתן
ל-detect ולפתור אוטומטית.**

### 7.5 השעון כמשתתף שלישי = מודל לפעולה כלכלית

מי שזיהה שה-`expectedEnd` עבר וחתם את ה-`consensus.timeout` תרם
שירות לרקמה — קוד נכתב, אישור נסגר. ניתן לתגמל את החבר הזה ב-hervachti
זעיר (`reachingMember`-style). **growth-loop קטן** של "מי שמתעניין
שדברים יקרו, מתוגמל".

### 7.6 timed-locked מעבר ל-restime — Sabbath

לחלק מההחלטות ה**רגישות**, ניתן לקבע `cooldownMs` נוסף **אחרי**
שה-`consensus.timeout` נחתם. ההחלטה תקפה, אבל לא נכנסת לתוקף עד
שגם ה-cooldown עובר. **"זמן לחשוב מחדש" אחרי שקיבלת החלטה גדולה.**
ייחודי לדמוקרטיות חכמות.

---

## 8. הקושיות הפתוחות שצריך להחליט

1. **`time.tick` השרת — כמה תכוף?** 15 דקות נשמע סביר, אבל זה
   הגדרה שמשפיעה על דחיפות החלטות. החלטה מוצרית.
2. **`clockTolerance` — כמה רחב?** 15 דקות מאזן בין יציבות לבין חשד
   הוגן. בדיוק כמו בהסכמת timestamps של חוזים — `~5 minutes`.
3. **escalation אוטומטי אחרי K סיבובים** — האם זה ברירת-מחדל או opt-in
   לרקמות? המלצה: opt-in דרך `project.config.maxResetRounds`.
4. **שעון-עמיתים מתי?** השלב המוצע: S4 של PLAN_serverless_p2p_data.
   לפני זה, השרת = שעון.
5. **`member.away` חובה?** האם מותר לקבוצה לקבוע "אסור לצאת לחופשה,
   כל שתיקה = הסכמה"? **לא** — זה ערכים. המלצה: היכולת ל-`away`
   היא זכות חברתית בלתי-מנוקבת.

---

## 9. סכמת שינויים — מינימליסטית

### חדשים
- שדות על `Project`/`Ratson`: `restimeMs` (int), `clockTolerance` (int).
- 3 reducers חדשים: `proposal.counter`, `consensus.timeout`, `member.away`.
- `time.tick` events (Phase 0-3 — מ-relay; Phase 4+ — מ-heartbeats).
- שדות על subject view ב-`ProjectState`: `currentRound` (int), `roundStart` (ts).

### שאינם משתנים
- אנום `restime` הקיים נשאר ל-UI.
- `voteOnPendm` / `voteOnPmash` / `addVote` ימשיכו לקבל פרמטר `orderon`,
  שיוגדר על-ידי ה-projection מ-`currentRound`.
- שדה `finishDate` במודל הישן הופך ל-derived (computed) ב-frontend.

### לא צריך
- ישות חדשה ל-rounds — `currentRound` ב-projection מספיק.
- שינוי בסכמת Strapi הקיימת ב-Phase 0–1 (כי `restime` כבר קיים).

---

## 10. חיבור לכל 7 התכניות

| תכנית | מה restime במודל החתום מוסיף לה |
|---|---|
| **PLAN_user_sovereign_consent** | האירוע ה-12 בתת-namespace שלנו: `consensus.timeout`. שתיקה הופכת חתומה. |
| **PLAN_serverless_p2p_data** | אתגר השעון פותר את "אין שרת מרכזי גם לזמן" — היברידי (relay → peer-clock) משלים את סולם ההדחה |
| **PLAN_concierge_in_p2p** | `Ratson.joinDeadline` ב-PLAN_SHARED_PURCHASE הופך לאחיד עם `restime`. **`consensus.timeout` הוא ה-lock event הטבעי** — קבוצה ננעלת כי הזמן עבר ולא נכנסה counter |
| **PLAN_action_migration_vs_p2p** | ה-`consentSpec` של כל action שכולל `requireConsensus: true` מקבל גם `restimeFrom: 'project'\|'ratson'\|'custom'` |
| **PLAN_central_rikma_definition** | החלטות חוקתיות של הרקמה המרכזית מקבלות restime ארוך (חודש?); ההחלטה לשינוי הופכת לפעולה רישומית, לא רעש |
| **PLAN_SITE_SHARE** | ההצעה לשלם פחות/יותר היא **לא** restime-bound (auto-approved §5). מסביר למה: זה אישרור אסימטרי שמכוון לאמון, לא דמוקרטיה |
| **PLAN_rikma_as_state_machine** | `consensus.timeout` הוא דוגמה מרכזית של QuorumProof type `'timeout'`; ה-`absenceClaim` בו הוא דוגמה ל-Merkle proof על absence (נדיר וקשה אבל פתיר) |

---

## 11. סיכום

המנגנון הקיים של `restime` הוא **נכון מוצרית** וקיים. השאלה לא הייתה
"איך לבנות אותו", אלא "איך לשמר אותו במודל החתום". התשובה:

- שלושה event types חדשים: `proposal.counter`, `consensus.timeout`, `member.away`.
- שדה אחד חדש לרקמה: `restimeMs`.
- שני שדות נגזרים ב-projection: `currentRound`, `roundStart`.
- שעון: מקור הצמדה משתנה לאורך סולם ההדחה — מ-relay tick (S2-S3) ל-peer
  heartbeats (S4+). הקוד שעובד עם השעון אגנוסטי למקור.
- "שתיקה כהסכמה" הופכת מ-`orderon` (DB column) לפרוצדורה משפטית
  ניתנת-לאימות עם DAG חתום.

המנגנון הזה מתקרר ביפה — הוא **לא הוסיף מורכבות, רק העביר אותה מקום**.
מהמורכבות החבויה של "מי קובע שהזמן עבר" (השרת היום) לפרמטר מפורש שכל
הקבוצה רואה ויכולה לשנות.

זה גם הצעד שמשלים את הקואופ: לא רק *השווי* של כל חבר מתמטית מאומת
(PLAN_rikma_as_state_machine), אלא גם *תהליך ההחלטה עצמו* — איך הגענו
מ-X ל-Y — שמור באופן ניתן-לאימות. **ספרי דמוקרטיה שיתופית פתוחים.**
