# הרקמה כמכונת-מצב חתומה — שווי, קונסנזוס, ואמת מתמטית

> נספח רעיוני ל-[PLAN_user_sovereign_consent.md](./PLAN_user_sovereign_consent.md)
> ו-[PLAN_central_rikma_definition.md](./PLAN_central_rikma_definition.md).
>
> רעיון מרכזי: **כל רקמה היא מכונת-מצב חתומה**. כל אירוע (סיום משימה,
> צירוף חבר, הוספת שעות, הוספת ערך משאב, הצבעה) הוא טרנזיציה. האמת
> עליו אינה "השרת אישר" — היא **מתמטית, נגזרת מכל ההיסטוריה**. אם
> המתמטיקה לא מסתדרת עם הרצף הקודם — האירוע לא חוקי. נקודה.
>
> זה לא "בלוקצ'יין" במובן Bitcoin (שם החשיבות היא ההסכמה הגלובלית).
> זה state-machine מקומי לרקמה, עם ה**שווי היחסי של כל חבר** כתכונה
> נגזרת ומאומתת.

---

## 1. ההבחנה: chain-of-hashes לעומת chain-of-state

יש שני דברים שונים שאנשים אומרים כשהם אומרים "בלוקצ'יין":

| קונספט | מה זה | למה לנו זה לא העיקר |
|---|---|---|
| **chain-of-hashes** (Bitcoin) | כל בלוק כולל hash של הקודם → manipulation גוררת שינוי לכל הרצף | יש לנו את זה בחינם דרך ה-DAG (parents = hashes); זה הבסיס, לא הסיפור |
| **chain-of-state** (Ethereum / smart contracts) | כל בלוק מקבע (commits) state חדש. ה-state הוא תוצאת חוק (state transition function) שמופעל על ה-state הקודם | **זה העיקר**. ככה הופכים "שווי חבר" ל-property מתמטית-מאומתת |

מה שב-Phase 0 כבר יש לנו: `project(events) → ProjectState` — פונקציה
טהורה שמכפילה אירועים ל-state. מה שחסר: **שום אירוע לא מקבע איזה
state הוא מייצר.** כל מי שרוצה לדעת את היתרה של חבר X חייב להריץ את
ה-projection מההתחלה.

ההצעה: **כל אירוע יקבע את ה-state-root שלו** — hash דטרמיניסטי של
ה-`ProjectState` כפי שנגזר ממנו. ברגע שיש את זה, השווי של חבר X
ב-block N הופך לעובדה ניתנת-להוכחה (Merkle proof) — לא תוצאת ריצה מקומית.

---

## 2. הוספה ל-`ConsentEvent` — שלושה שדות, השאר נשאר זהה

```ts
type ConsentEvent = {
  // ... כל מה שכבר יש ב-Phase 0 ...

  // חדשים:
  parentStateRoots?: string[];   // hash של state מהורים. אם 1 הורה — אחד; אם merge — N
  stateRoot: string;             // hash של state אחרי החלת האירוע. canonical.
  delta?: Delta[];               // השינויים הקונקרטיים שהאירוע מציע (מפורט §3)
  quorum?: QuorumProof;          // אם האירוע דורש הסכמה — חתימות הקוורום (§4)
};

type Delta =
  | { kind: 'hervachti.add',  member: string, amount: number, matbea: string }
  | { kind: 'hervachti.move', from: string, to: string, amount: number, matbea: string }
  | { kind: 'member.add',     member: string }
  | { kind: 'member.remove',  member: string }
  | { kind: 'share.bump',     member: string, oldPct: number, newPct: number }  // מחושב
  | { kind: 'value.set',      path: string, before: unknown, after: unknown }
  | { kind: 'consensus.reach', subject: string, decision: 'approve' | 'reject' };

type QuorumProof = {
  rule: string;                  // 'unanimous' | 'majority' | 'agreers_only' | hash
  evidence: string[];            // ids של אירועי-הצבעה שמקיימים את הכלל
  reachingMember?: string;       // איזה חבר עבר את הסף (לאודיט)
};
```

**ה-state עצמו** הוא ה-`ProjectState` שכבר תוכנן. ה-`stateRoot` הוא
hash של הסריאליזציה הקנונית שלו (Merkle root על המבנה: חברים → hervachti
→ tosplits → halukas). שינויים בעתיד ל-`ProjectState` (תוספת ratsons,
proposals וכו') מצריכים החלטה איך הם נכנסים ל-root — אבל זו עבודת מנואל,
לא ארכיטקטונית.

---

## 3. השווי היחסי = projection על Merkle tree

זה לב התשובה לשאלה שלך.

**היום (Phase 0)**:
```
share(memberX) = state.balances.get(memberX) / Σ state.balances.values()
```
פונקציה. תוצאה. אין הוכחה.

**עם state commitment**:
```
share(memberX, blockId) = {
  // 1. כל לקוח יכול להוכיח עם Merkle path:
  proof = MerkleProof(blockId.stateRoot, "balances/" + memberX)
  // 2. ולספק את הסכום הכולל:
  totalProof = MerkleProof(blockId.stateRoot, "balances/_sum")
  // 3. החישוב:
  return proof.value / totalProof.value
}
```

**ההשלכה המעשית**: לפני, "מה החלק של אבי ב-3 ביוני?" דרש שמרת בעצמך את
כל ההיסטוריה. אחרי, מספיק לך **ה-stateRoot של אותו יום** + Merkle proofs
של שתי שורות. **קל פי 1000.**

ויותר חשוב — האימות הוא **חיצוני**. צד שלישי (בית משפט, רשות מס, פרובידר
שמחפש לעבוד עם הקבוצה) יכול לקבל את ה-proof ולוודא ללא גישה לרקמה.

---

## 4. קונסנזוס כתכונה ניתנת-לאימות בבלוק

כיום (ב-Phase 0 + תכנית tosplit), קונסנזוס הוא תוצאה של projection: רץ
על האירועים, סופר הצבעות, מחליט. זה עובד אבל לא מקבע — אם אדם מציג "ההצבעה
עברה", אין דרך קלה לאמת זה ללא ריצה.

**עם QuorumProof**:
- אחרי הצבעה N של חבר אחרון שמספיק לעבור את הסף, נוצר אירוע `consensus.reach`
- שדה `quorum.evidence` מכיל את ה-IDs של כל אירועי ההצבעה שתורמים
- שדה `quorum.rule` מכיל את הכלל (`'unanimous'` / hash של פונקציית-קונסנזוס)
- האימות פשוט: עבור לרשימה, ודא שכל אחד הוא הצבעה חתומה תקפה, ודא שיחד
  הם מקיימים את הכלל. **O(N) עם N = גודל הקוורום, לא גודל ההיסטוריה.**

זה הופך כל החלטה משמעותית ל-**verifiable receipt**: "כאן ההחלטה,
כאן הראיות שעברה את הסף, כאן הקנון שמגדיר 'עברה'". כל אחד יכול לאמת
לבד. אין צורך באמון.

**יישום בקונסיירז'** (חיבור ל-PLAN_concierge_in_p2p §4.1): "המשאלה ננעלה
על 8 חברים מתחייבים" → אירוע `ratson.lock` עם `quorum.evidence = [join_ev_1,
... join_ev_8]`. פרובידר רואה אירוע יחיד וכמה הוכחות. לא צריך לקרוא את
כל ה-Space. בדיוק ההבטחה ה"covenant" שכתבתי שם, עכשיו עם בסיס מתמטי קונקרטי.

---

## 5. שש השלכות שלא ניתן להגיע אליהן בלי state-commitment

המעבר מ-projection-מקומי ל-state-committed מתאפשר:

### 5.1 Snapshots = checkpoints קלים-משקל
ברקמה בת שנה עם 100,000 אירועים, "כמה אבי שווה?" דורש לטעון את כל
ה-100,000. **פתרון**: כל N אירועים, קוורום חותם על `snapshot` שמכיל
את ה-stateRoot באותה נקודה. לקוח חדש מתחיל מהsnapshot האחרון ומסנכרן רק
מה שאחרי. **כיום ב-PLAN_serverless_p2p_data זה הוזכר כ-future. כאן זה
הופך mandatory.**

### 5.2 הוכחות ניידות של חברות ושווי
"אני שותפה ב-1lev1 עם 0.3% מהרקמה" — היום זה הצהרה. עם state commitment
+ Merkle proof, זו **תעודה קריפטוגרפית** שמתאמת מול stateRoot שכל אחד
יכול לדעת. שמיש למחזיק חשבון בנק שרוצה לראות את ההוכחה, או למוסד פיננסי
שמעוניין לתת אשראי על בסיס נכס הקואופ.

### 5.3 ניידות בין רקמות (פדרציה)
אם השווי של אבי ברקמת "תפירה ירוקה" ניתן להוכחה קריפטוגרפית, **הוא
יכול להעביר חלק ממנו** לרקמה אחרת (כהשקעה / כביטחון / כתמורה). מקודם
הייתה זו עסקה הסכמית (Tosplit חדש בכל פעם); עכשיו זו עברה של נכס
מוכח. **משק פדרטיבי בין רקמות.**

### 5.4 fork-and-continue (כמו hard fork קואופרטיבי)
קבוצה ברקמה שלא מסכימה עם הכיוון יכולה **לקחת את הענף ולהמשיך**.
ה-stateRoot של נקודת-הפיצול הוא ההיסטוריה המשותפת; משם כל ענף מתפתח
לחוד. **חברים שומרים את השווי שצברו עד נקודת הפיצול.** זה חוקי, שקוף,
ולא דורש "פנייה לבית משפט". פיצול חברתי מנהל את עצמו.

### 5.5 סכסוכים נפתרים על-ידי replay מתמטי
"אמרת שתעביר לי 30%, אני זוכר שהסכמנו ל-40%" → שניהם מציגים את הענפים
שלהם, ה-stateRoots מצביעים על נקודות שונות, האירוע ש**שניהם הסכימו עליו**
האחרון הוא הנכון. **המתמטיקה היא השופט.** כל מנהל-קהילה מקבל כלי שעובד
טוב יותר מ"מי צודק, רגשית".

### 5.6 הרקמה המרכזית הופכת ל-public ledger מלא
בPLAN_central_rikma_definition קבענו שהרקמה המרכזית פטורה מהצפנת P2P
("ההפך — היא היחידה שחייבת להיות פומבית"). עם state commitments,
**ספרי החשבונות הציבוריים של 1lev1 הופכים לדפדפן ציבורי בסגנון Etherscan**:
כל אחד יכול להיכנס, לראות את ה-blocks, לראות את החלוקות, לאמת את
הקונסנזוסים. **proof-by-architecture, אגרסיבית יותר משהבטחנו עד עכשיו.**

---

## 6. דוגמה מעבודה מהקצה לקצה — אישור משימה

נדמיין את התרחיש: "יורי השלימה משימה בפיתוח המוצר הראשי של הרקמה
המרכזית — 4.5 שעות, תעריף ₪80, סה"כ ₪360".

**אירוע 1** — יורי חותמת על השלמת המשימה:
```json
{
  v: 1,
  id: 'evY-001', actor: 'yuri', device: 'dev_y',
  action: 'mission.complete',
  subject: { type: 'mission', id: 'm-platform-feature-A' },
  predicate: { hours: 4.5, selfRate: 80, proofUrl: 'pr/123' },
  parents: ['previousHeadId'],
  ts: 1748000000000,
  sig: '...yuri-signed...',

  parentStateRoots: ['root-prev-abc'],
  stateRoot: 'root-after-Y001',
  delta: [{ kind: 'value.set', path: 'pending/m-platform-A',
            before: null, after: { hours: 4.5, rate: 80, by: 'yuri' } }]
}
```
המשימה במצב "ממתינה לקוורום". אין עדיין שינוי ב-hervachti.

**אירועים 2, 3, 4** — שלושה חברים פנימיים חותמים אישור:
```json
{ action: 'mission.approve.vote', actor: 'avi',  ... predicate: { approve: true } }
{ action: 'mission.approve.vote', actor: 'dana', ... predicate: { approve: true } }
{ action: 'mission.approve.vote', actor: 'eden', ... predicate: { approve: true } }
```

**אירוע 5** — `consensus.reach` (יכול להיווצר אוטומטית ע"י כל לקוח):
```json
{
  action: 'mission.approve',
  subject: { type: 'mission', id: 'm-platform-A' },
  predicate: { acceptedHours: 4.5, acceptedRate: 80, payee: 'yuri' },
  parents: ['evY-001', 'evV1', 'evV2', 'evV3'],
  stateRoot: 'root-after-approve',
  delta: [
    { kind: 'hervachti.add', member: 'yuri', amount: 360, matbea: 'ILS' },
    { kind: 'share.bump', member: 'yuri', oldPct: 8.3, newPct: 9.1 }
  ],
  quorum: {
    rule: 'majority-3-of-5',
    evidence: ['evV1','evV2','evV3'],
    reachingMember: 'eden'
  },
  sig: '...'  // נחתם ע"י החבר שראשון זיהה שהקוורום עבר
}
```

**מה צד שלישי יכול לאמת מבלי לראות שום אירוע אחר?**
1. החתימות של evV1/evV2/evV3 תקפות (מפתחות ציבוריים פומביים).
2. הם באמת חברים פנימיים לפי `parentStateRoots` (Merkle proof על members tree).
3. ה-`rule` מקויים: 3 ≥ ceil(5/2).
4. ה-`delta` מתמטית עקבי: יורי הייתה עם hervachti X, הוסיפה 360, היא עכשיו עם X+360.
5. ה-`stateRoot` החדש מצביע על state עם yuri.hervachti = X+360.

**O(1) אימות לכל אחד מהבדיקות**. לא צריך לטעון את כל הרקמה.

---

## 7. פירוט הקשר ל-Phase 0 שכבר shipped

Phase 0 (המסמך הראשון, כבר מוטמע) נתן לנו:
- `signCanonical` / `verifySignedObject` → הליבה הקריפטוגרפית
- `canonicalize` → סריאליזציה דטרמיניסטית
- `project(events) → ProjectState` → state transition function
- `topoSort` → סדר דטרמיניסטי

**מה צריך להוסיף**:

| רכיב חדש | קובץ מוצע | תפקיד |
|---|---|---|
| `merkleize(state)` | `src/lib/crypto/merkleize.ts` | מ-ProjectState ל-Merkle root + proofs |
| `stateRoot(events)` | חזרה לתוך `projection.ts` | hash דטרמיניסטי של state |
| Delta validators | `src/lib/consent/deltaCheck.ts` | מאמת שה-delta בבלוק תואם לתוצאה הצפויה |
| QuorumProof verifier | `src/lib/consent/quorumCheck.ts` | מאמת ש-evidence + rule = pass |
| Snapshot signing | reducer חדש `snapshot.commit` | אישור קוורומלי על stateRoot ב-Y blocks אחורה |
| Merkle proof builder | `merkleProve(stateRoot, path) → Proof` | למקרים של אימות חיצוני |

**שינוי בליבת ה-flow**:
- `ingestEvent` (קיים) → אחרי `verifySignedObject` יקרא ל-`deltaCheck` ו-`quorumCheck`.
- אירוע ש-state-root שלו לא תואם → דחייה, בדיוק כמו חתימה שגויה.

**זה משנה דק את האנדרציה אבל לא את הארכיטקטורה.** ה-DAG, החתימות,
ה-projection — כולם נשארים. נוסף שכבת **אימות שווי**.

---

## 8. הקושיות הקשות שצריך להחליט לפניהן

### 8.1 כלל סריאליזציה ל-state
`Merkleize` של state עם `Map<string, number>` (balances), `Map<string, TosplitView>`,
ו-`Set<string>` (members) דורש כלל קנוני. הבחירה משפיעה על כל אימות עתידי
ולא ניתנת לשינוי בלי break. **המלצה**: לבסס על JCS שכבר יש לנו +
Sparse Merkle Tree (key-sorted) שמתאים לטיפוסי Map. ספרייה: לכתוב לבד
(פשוט יחסית, ~150 שורות).

### 8.2 איזה reducers דורשים QuorumProof?
לא כל אירוע דורש קוורום. אבל יותר אירועים מאשר היום:
- `mission.approve` ← חייב.
- `member.add` ← חייב.
- `member.remove` ← חייב.
- `value.set` על שדה רגיש (קונפיג רקמה) ← חייב.
- `chat.message` ← לא נדרש.
- `tosplit.vote` ← לא נדרש (האירוע **הוא** הצבעה).

טבלה מלאה נחוצה. לא קשה לבנות; מסוכן להחמיץ.

### 8.3 מי יוצר את אירוע ה-`consensus.reach`?
אחרי שהקוורום עבר, מי מייצר את האירוע ש"נועל" אותו? כל לקוח שמזהה?
זה ייצור כפילויות. **המלצה**: ה-rule הוא דטרמיניסטי — האירוע נחתם ע"י
המצביע האחרון שעבר את הסף; אם יש כפילות, ה-DAG בוחר הראשון בסדר טופולוגי.

### 8.4 גודל הבלוק
delta + quorum + stateRoot מוסיפים נפח לאירועים. רוב האירועים יהיו עדיין
קטנים (< 1KB), אבל אירוע של אישור משימה גדולה עם quorum-7 = ~3KB. נסבל,
אך לפלטפורמת מובייל זה מצטבר. **המלצה**: דחיסה גנרית של `predicate` במידת הצורך.

### 8.5 איך מטפלים ב-`Decimal` ב-Merkle
`hervachti` הוא מספר עם שתי ספרות אחרי הנקודה. JSON של floats זה אסון
לאמינות. **המלצה**: לאחסן ב-`bigint` של "אגורות" (× 100) ולהציג כ-decimal
ב-UI בלבד. **חייבים לקבע את זה עכשיו** — שינוי מאוחר ישבור כל proof קיים.

---

## 9. מה זה משחרר במוצר — חיבור מלא ל-5 התכניות

הסיפור מתחבר עכשיו לחלוטין:

| תכנית | מה state commitments מוסיף לה |
|---|---|
| **PLAN_user_sovereign_consent** | ChainEvent של היום (חתום ב-DAG) הופך **גם** לבסיס מתמטי לכל שווי שנגזר ממנו |
| **PLAN_serverless_p2p_data** | snapshots קוורומליים פותרים את "גידול הלוג" שהוזכר כסיכון; light clients ניתנים לבניה |
| **PLAN_concierge_in_p2p** | ה-`ratson.lock` כ-covenant מקבל בסיס מתמטי: 8 חתימות-הצטרפות = הוכחה ניתנת-לאימות חיצונית; וה-Vickrey האקזוטי הופך לא רק "ניתן לראייה" אלא **ניתן להוכחה במשפט** |
| **PLAN_action_migration_vs_p2p** | `consentSpec` שהצעתי שם הופך לשדה שמכיל גם את ה-`deltaSchema` של ה-action; ה-action הופך מ"מה מעדכן" ל"מה מקבע" |
| **PLAN_central_rikma_definition** | רקמה מרכזית כ-public ledger הופכת לנגיש לכולם; "platformRing" של חבר ניתן לאימות מבחוץ; ה-investment BOM הופך לסכום של hash-chained proofs |
| **PLAN_SITE_SHARE** | התקרה (§2.5) מאומתת מתמטית; הצרכן יכול לבדוק "כן, ה-investment הזה אכן שווה את הסכום הזה כי הנה ה-events" |

---

## 10. סיכום — הצעד הבא הקטן והגדול ביותר

**טכנית**: זו תוספת של ~3 שדות ל-`ConsentEvent` + 4 קבצי-עזר. לא ארכיטקטורה
מחדש; שכבת אימות נוספת.

**מוצרית**: זה הופך את 1lev1 מ-"אפליקציה שיתופית" ל-**משק שיתופי
ניתן-לאימות**. ההבדל בין "סמוך עלינו, החלוקה הוגנת" ל-"כל אחד יכול
לאמת מתמטית שהחלוקה הוגנת" הוא הבדל מהותי בנפש המוצר.

**מבחינת ההשקה**: לא חוסם את Phase 1, 2, או 3. אפשר לפרוס בלי
state commitments ולהוסיף אותם אחר כך — כל האירועים הישנים פשוט יקבלו
stateRoot retroactively (שיכבד-לאחור על-ידי כל לקוח). הסיכון: ה-stateRoots
של הישן ייקבעו רק כשמטמיעים את הסכמה הזו, ולכן ההיסטוריה לא ניתנת-לאימות
ל-snapshots ישנים. **לקבל את זה ולקדם.**

המלצה: לשרשר את התכנון הזה ל-Phase 1.5 (אחרי שמטמיעים shadow signing
על tosplit, לפני שעוברים לאכיפה ולשאר ה-actions). זו השכבה שהופכת את
הסיפור הקריפטוגרפי לסיפור כלכלי-קואופרטיבי שלם.

---

*"בסופו של דבר מה חשוב — מה השווי היחסי של כל חבר ברקמה."* התובנה הזו
היא **הנקודה המארגנת** של כל הארכיטקטורה. כל מה שכתבנו עד עכשיו היה
בנייה אליה. עכשיו אפשר לקבע אותה במתמטיקה.
