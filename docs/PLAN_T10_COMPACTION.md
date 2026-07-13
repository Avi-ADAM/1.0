# PLAN — T10: Compaction — snapshots חתומי-קוורום כנקודות גיזום

> משימה T10 מ-[HANDOFF_DISTRIBUTED_DB.md](./HANDOFF_DISTRIBUTED_DB.md) §4.
> PLAN_serverless_p2p_data §13.5 קובע שב-S2b זה **לא אופציונלי**: אחרי ש-T4
> הכניס ~29 סוגי אירועים, לוג של רקמה פעילה גדל מהר — ובלי גיזום כל לקוח
> חדש (וכל reload) משחזר את כל ההיסטוריה מבראשית.
>
> **קריטריון הקבלה (מה-HANDOFF)**: רפליקה חדשה מתכנסת ל-stateRoot זהה משני
> המסלולים — היסטוריה מלאה מול snapshot+זנב.

---

## 1. העיקרון

Snapshot הוא **אירוע רגיל בתוך ה-DAG** (`snapshot.commit`), שה-predicate שלו
נושא את המצב המלא המנורמל (`normalizeState`) של הרקמה נכון ל-heads מסוימים,
ואת ה-`stateRoot` שלו. הוא מבשיל להיות **נקודת גיזום** דרך אותו מנגנון
הסכמה כמו כל דבר אחר במערכת (super-principles):

- `snapshot.vote` של כל חבר — פה-אחד ⇒ בשל מיידית;
- או שתיקה: `consensus.timeout` על subject ה-snapshot בקצב ה-restime של
  הרקמה ⇒ בשל בשתיקה. אין "לא" מוחלט — חבר שחולק מפרסם counter (מצביע
  על אי-התאמת root, שזה באג שצריך לתקן, לא העדפה).

אחרי הבשלה + חלון בטיחות, רפליקה רשאית **לגזום מקומית**: למחוק מה-IDB את כל
האירועים שבסגירת-האבות (ancestryClosure) של הורי ה-snapshot, ולשמור במקומם
את המצב המנורמל. שחזור = `restoreState(snapshot.state)` ואז fold של הזנב.

```
[genesis] … [ev₁] … [evₙ]  ← heads H
                     │
             [snapshot.commit  parents=H  predicate={heads:H, stateRoot, state}]
                     │
             [snapshot.vote…] [אירועי המשך — "הזנב"]
```

## 2. הכרעות תכנון (והנימוקים)

1. **המצב נוסע inline ב-predicate, לא by-reference.** רקמות FreeMates הן
   2–20 איש; מצב מנורמל שלם הוא עשרות-מאות KB לכל היותר. inline ⇒ ה-snapshot
   מגיע דרך צינור הסנכרון הרגיל בלי route חדש, נחתם כמו כל אירוע, ושורד
   דרך אותה מראה. שדה `stateRef` שמור לעתיד (אותו דפוס כמו bodyRef ב-GDPR).
2. **ה-snapshot חי בתוך ה-DAG עם `parents = heads המכוסים`.** כך
   `computeDiff` של עמית מלא מול לקוח מגוזם עובד בלי שינוי פרוטוקול: heads
   של הלקוח המגוזם הם צאצאי ה-snapshot ⇒ הסגירה אצל העמית המלא כוללת את כל
   מה שנגזם ⇒ ה-diff לעולם לא שולח מחדש היסטוריה מכוסה. **אפס שינוי
   ב-protocol.ts.**
3. **`topoSort` כבר סובל הורים חסרים** (אירוע עם הורה שנגזם מטופל כשורש) —
   הזנב נטען כרגיל. `project()` פוצל ל-`projectFrom(base, events)` כך
   שהניקוד מתחיל מ-state משוחזר במקום מ-emptyState.
4. **`restoreState` הוא ההופכי המדויק של `normalizeState`** (bigint מ-string,
   Sets/Maps מ-arrays). חוזה: `normalizeState(restoreState(n)) ≡ n` —
   נבדק property-style. שינוי עתידי ב-normalizeState ⇒ חובה לעדכן את
   restoreState + טסט הסימטריה (זה חלק מאינווריאנט 2; ה-snapshot נושא
   `stateV: STATE_ROOT_VERSION` ולקוח מסרב לשחזר גרסה שאינו מכיר).
5. **הבשלה נמדדת מה-projection עצמו, בלי מנגנון חדש**: `snapshot.vote`
   מנותב ל-reducer הגנרי `stageVote` (subject type ‏'snapshot') ⇒ unanimity
   ב-`stageVotes`; שתיקה ⇒ `rounds` closed ע"י consensus.timeout. הפונקציה
   `isSnapshotMatured(state, snapshotId)` רק קוראת את שניהם.
6. **ה-relay נשאר טיפש** (אינווריאנט 4): לא גוזם, לא שופט הבשלה. בגרסה זו
   הגיזום הוא מקומי-בלבד — הרווח: IDB קטן, hydrate/projectFor מהירים,
   reload לא משחזר היסטוריה. לקוח טרי עדיין מושך הכל מה-relay פעם אחת;
   הגשת snapshot+זנב ישירות ללקוח טרי היא שלב S3b (עמיתים/WebRTC) או
   הרחבת cursor עתידית — מחוץ לתחולה כאן.
7. **בונוס GDPR**: המצב המנורמל כבר כולל redactions (payload.redact רץ לפני
   הצילום) — גיזום מוחק בפועל את ה-payload הגולמי של תוכן שנמחק. זה משלים
   את הכרעת T4.
8. **חלון בטיחות לפני גיזום**: גם אחרי הבשלה, גוזמים רק אירועים שכוסו ע"י
   snapshot שהבשיל וגם עברו ממנו ≥ `PRUNE_SAFETY_MS` (ברירת מחדל: restime
   אחד נוסף) — הגנה מפני מרוצים עם counters איטיים.

## 3. מה לא נפתר כאן (מתועד ביושר)

- **double-apply מעמית זדוני**: לקוח מגוזם שמקבל בכוח אירוע מכוסה-לשעבר
  יחיל אותו שוב על ה-base (למשל זיכוי כפול). ה-relay הנוכחי לא ישלח כזה
  (cursor + diff), אבל T8/WebRTC יחייב הגנה: רשימת מזהים דחוסה/מסנן בלום
  ב-snapshot, או השוואת stateRoot תקופתית. נדחה במפורש ל-T8.
- **snapshot ב-space מוצפן (E2E)**: המצב inline הוא תוכן רגיש ⇒ חייב
  publishSealed. הליבה כאן טהורה ותתאים; החיווט נדחה לשלב S3.
- **מיגרציית Strapi (T6)**: אותו מנגנון בדיוק, רק שה-state הראשוני מיוצא
  מ-Strapi במקום מ-projection. T6 = T10 + סקריפט ייצוא + זרימת חתימה.

## 4. מפת קבצים

| קובץ | מה |
|---|---|
| `src/lib/consent/stateRestore.ts` | `restoreState(normalized)` — ההופכי של normalizeState |
| `src/lib/consent/projection.ts` | `projectFrom(base, events)` + project() הקיים רוכב עליו |
| `src/lib/consent/reducers/index.ts` | ניתוב `snapshot.vote` → stageVote |
| `src/lib/consent/reducers/snapshotCommit.ts` | predicate מורחב: `heads[]` לצד `upTo` (תאימות לאחור) |
| `src/lib/space/compaction.ts` | buildSnapshotPredicate · isSnapshotMatured · computePrunableIds |
| `src/lib/crypto/keystore.ts` | store חדש `spaceSnapshots` ⇒ DB_VERSION 2→3 (אינווריאנט 3) |
| `src/lib/space/spaceStore.svelte.ts` | hydrate מ-snapshot, proposeSnapshot(), compact() |
| `src/lib/space/compaction.test.ts` | קריטריון הקבלה + הבשלה + גיזום |
| `src/lib/consent/stateRestore.test.ts` | סימטריית normalize↔restore |

## 5. סדר ביצוע

1. `restoreState` + טסט סימטריה (טהור, בלי תלות).
2. `projectFrom` + טסט "מלא ≡ snapshot+זנב" (קריטריון הקבלה, טהור).
3. ניתוב `snapshot.vote` + הרחבת snapshotCommit ל-heads[].
4. `compaction.ts` — שלוש פונקציות טהורות + טסטים (כולל שני סדרי הגעה).
5. keystore v3 + חיווט רפליקה (hydrate מ-base, proposeSnapshot, compact).
6. עדכון HANDOFF + HOWTO.

*נכתב ביולי 2026. הטסטים הם החוזה — ראו הכלל בסוף ה-HANDOFF.*
