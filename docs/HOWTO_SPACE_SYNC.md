# Space Sync — שכבת הדאטהבייס המבוזר (S2a), מדריך הפעלה

> מימוש שלב **S2a** מ-[PLAN_serverless_p2p_data.md](./PLAN_serverless_p2p_data.md) §3 ו-§12:
> relay מוצפן-בעתיד + פרוטוקול סנכרון heads/diff. רץ **במקביל** למערכת הקיימת
> (Strapi/GraphQL) ולא נוגע בה — בדיוק כמו שלב ה-shadow של תכנית ההסכמות.

## מה נבנה

```
src/lib/space/
  protocol.ts            # הליבה הטהורה: computeHeads / computeDiff / ancestryClosure
  protocol.test.ts       # כולל property-test של התכנסות (fast-check)
  relayClient.ts         # תעבורת HTTP מול /api/relay/[spaceId]
  peerKeys.ts            # PubKeyResolver צד-לקוח (IDB cache + /api/consent/keys)
  spaceStore.svelte.ts   # הרפליקה: hydrate מ-IDB ← מיידי, sync ברקע, publish local-first

src/lib/server/relay/
  log.ts                 # "תיבת הדואר": יומן append-only עם seq לכל Space
  log.test.ts
  syncRoundtrip.test.ts  # שתי רפליקות עם Ed25519 אמיתי מתכנסות דרך ה-relay

src/routes/api/relay/[spaceId]/+server.ts   # POST push / GET pull (?since=, ?headsOnly=1)
```

בנוסף: `freemates-crypto` IndexedDB עלה לגרסה 2 עם שני stores חדשים —
`spaceIndex` (אילו אירועים שייכים לאיזה Space) ו-`spaceCursors` (עד איזה seq
נמשך מה-relay). השדרוג אוטומטי ולא נוגע בנתונים קיימים.

## העקרונות

- **אותם אירועים בדיוק.** Space מסנכרן `ConsentEvent` חתומים של Phase 0 —
  אין פורמט חדש. ה-relay מאמת חתימה (אנטי-ספאם) אבל כל לקוח מאמת שוב
  מקומית; relay משקר = אירוע שנופל ב-verify אצל הלקוח (יש על זה טסט).
- **git, לא REST.** חילופי heads הם O(1) כשאין שינויים (`?headsOnly=1`);
  diff נשלח topo-sorted כך שהקליטה היא מעבר יחיד.
- **Local-first = טעינה מהירה.** `hydrate()` מרים את ה-Space מ-IndexedDB בלי
  רשת; `publish()` חותם ומחיל מקומית לפני ששולח. משתמש חוזר רואה projection
  לפני שהבקשה הראשונה יצאה מהמכשיר.
- **ה-relay לעולם לא סמכות.** היומן (מספרי ה-seq) הוא in-memory; האירועים
  עצמם נשמרים דרך consentStore (זיכרון + מראת Strapi). restart של השרת מנפיק
  `epoch` חדש — לקוח שמזהה epoch שונה מסנכרן מ-0 וה-dedupe בולע את הכפילויות.

## הפעלה (shadow, opt-in)

```js
localStorage.SPACE_SYNC_ENABLED = '1';
```

שימוש מדף Svelte:

```svelte
<script>
  import { openSpace, startAutoSync, spaceSyncEnabled } from '$lib/space/spaceStore.svelte';
  import { spaceIdForProject } from '$lib/space/protocol';

  const { projectId, userId } = $props();
  const replica = openSpace(spaceIdForProject(projectId));

  // טעינה מהירה: קודם מקומי, רשת ברקע
  replica.hydrate();
  $effect(() => startAutoSync(replica));           // מחזיר stop fn ל-onDestroy

  const state = $derived(replica.projectFor(projectId));  // ProjectState מקומי
</script>
```

כתיבה (חתימה מקומית + שילוח):

```js
await replica.publish(userId, {
  action: 'tosplit.vote',
  subject: { type: 'tosplit', id: tosplitId },
  predicate: { what: true }
  // parents לא צוין ⇒ ה-heads המקומיים — ה-DAG נשאר מחובר
});
```

## בדיקות

```bash
npx vitest --run src/lib/space src/lib/server/relay
```

- `protocol.test.ts` — property: כל פיצול אקראי של DAG בין שתי רפליקות מתכנס
  בסבב חילוף אחד; diff מול heads של עצמך תמיד ריק.
- `syncRoundtrip.test.ts` — exit criterion של S2a: שני "מכשירים" עם זהויות
  Ed25519 אמיתיות — create במכשיר א', vote במכשיר ב', שניהם מקרינים אותו
  `ProjectState`; אירוע מזויף מה-relay נזרק; פיצול offline מתאחה.

בדיקה ידנית בדפדפן: שני טאבים מחוברים, flag דלוק, `openSpace` על אותו projectId —
פעולה בטאב אחד מופיעה בשני תוך ≤20 שניות (interval ברירת המחדל), וב-devtools →
IndexedDB → `freemates-crypto` רואים את `spaceIndex`/`spaceCursors` מתמלאים.

## הצפנה קבוצתית (S3a) — relay עיוור

השכבה ממומשת ב-`src/lib/space/e2e/` (kem/epoch/seal). Space הופך ל-E2E
ברגע שיש בו אירוע `epoch.rotate`; מאותו רגע `publish()` רגיל נחסם
(מלבד rotate עצמו) והנתונים עוברים רק כ-ciphertext:

```js
import { fetchKemRecipients } from '$lib/space/peerKeys';

// התנעת הצפנה ל-Space (epoch 0) — עוטף את המפתח לכל מכשירי החברים
const { recipients, missing } = await fetchKemRecipients(memberUserIds);
await replica.rotateEpoch(userId, recipients, 'genesis');

// מכאן והלאה:
await replica.publishSealed(userId, {
  action: 'tosplit.vote',
  subject: { type: 'tosplit', id },
  predicate: { what: true }
});
```

הסרת חבר = `rotateEpoch(userId, recipientsWithoutThem, 'member.remove')`.
המוסר ממשיך לקרוא את העבר (היה שם) אך לא את העתיד. ה-relay רואה רק
מעטפות חתומות — יש טסט שמאמת שאף byte קריא לא יושב אצלו
(`src/lib/server/relay/sealedRelay.test.ts`).

## מה הלאה

ההמשך המלא, כולל תור משימות מפורט, אינווריאנטים שאסור לשבור ומלכודות
סביבה — ב-[HANDOFF_DISTRIBUTED_DB.md](./HANDOFF_DISTRIBUTED_DB.md).
