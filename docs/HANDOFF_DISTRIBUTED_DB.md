# HANDOFF — מערכת הדאטהבייס המבוזרת: מדריך המשך למי שבא אחריי

> **למי המסמך הזה מיועד**: למפתח או למודל AI שממשיך את העבודה על שכבת
> הנתונים המבוזרת ואין לו את ההקשר של מי שבנה אותה. המסמך כתוב בהנחה שאתה
> **לא** מכיר את התכנון — קרא אותו עד הסוף לפני שאתה נוגע בקוד.
>
> **סדר קריאה חובה**:
> 1. המסמך הזה (מפת מצב + חוקים)
> 2. [PLAN_user_sovereign_consent.md](./PLAN_user_sovereign_consent.md) — היסודות (Phase 0–5)
> 3. [PLAN_serverless_p2p_data.md](./PLAN_serverless_p2p_data.md) — סולם ההדחה S0→S5
> 4. [HOWTO_SPACE_SYNC.md](./HOWTO_SPACE_SYNC.md) — שימוש מעשי בשכבת ה-Space
> 5. הטסטים עצמם — הם הספסיפיקציה המדויקת ביותר שיש

---

## 1. מפת מצב — מה בנוי ועובד (נכון ליולי 2026)

```
שלב                                    סטטוס      איפה
S1  אירועי הסכמה חתומים (shadow)       ✔ בנוי     src/lib/crypto, src/lib/consent
S2a Space + relay + סנכרון heads/diff  ✔ בנוי     src/lib/space, src/lib/server/relay
S3a הצפנה קבוצתית (epoch keys, E2E)    ✔ ליבה     src/lib/space/e2e
S2b ~25 reducers + UI מ-projection     ✗ הבא בתור  (משימה T4 להלן)
S3b WebRTC, אכיפת הצפנה, הסרת Strapi   ✗           (T8)
S4  שחזור חברתי, key transparency      ✗           (T9)
```

### קבצים, לפי שכבות (מלמטה למעלה)

**קריפטו בסיסי** — `src/lib/crypto/`
- `canonical.ts` — JSON קנוני (JCS): מפתחות ממוינים, בלי רווחים. **כל חתימה
  וכל hash במערכת עוברים דרכו.**
- `sign.ts` / `verify.ts` — חתימה/אימות של כל אובייקט עם
  `{actor, device, id, sig}`. `id = sha256(canonical(body+sig))`.
- `identity.ts` — זהות Ed25519 של המכשיר, non-extractable ב-IndexedDB
  (רשומה `id:'self'` ב-store `identity`).
- `keystore.ts` — עטיפת IndexedDB. **גרסת DB: 2.** ראה §3 לפני שינוי.

**אירועי הסכמה** — `src/lib/consent/`
- `event.ts` — הטיפוס `ConsentEvent` + מרחב ה-actions. **הוספת שדות =
  אופציונליים בלבד, לנצח** (אירועים ישנים חייבים להישאר תקפים).
- `ingest.ts` — הצינור היחיד להכנסת אירוע: אימות חתימה → dedupe →
  אימות commitments → שמירה. **אסור לעקוף אותו.**
- `projection.ts` + `reducers/` — `project(events) → ProjectState`. פונקציה
  טהורה. topo-sort של ה-DAG ואז fold.
- `stateRoot.ts` — hash דטרמיניסטי של ProjectState. **שינוי מבנה
  ProjectState ⇒ חובה לעדכן את normalizeState ולהעלות STATE_ROOT_VERSION.**

**שכבת ה-Space (S2a)** — `src/lib/space/`
- `protocol.ts` — הליבה הטהורה: `computeHeads`, `computeDiff`,
  `ancestryClosure`. פרוטוקול בסגנון git fetch, אגנוסטי לתעבורה.
- `relayClient.ts` — HTTP מול `/api/relay/[spaceId]`.
- `peerKeys.ts` — resolver של מפתחות ציבוריים של עמיתים (cache ב-IDB,
  מילוי מ-`/api/consent/keys/[userId]`) + `fetchKemRecipients`.
- `spaceStore.svelte.ts` — הרפליקה: `hydrate()` (טעינה מיידית מ-IDB),
  `sync()`, `publish()`, `publishSealed()`, `rotateEpoch()`,
  `startAutoSync()`. דגל: `localStorage.SPACE_SYNC_ENABLED='1'`.

**הצפנה קבוצתית (S3a)** — `src/lib/space/e2e/`
- `kem.ts` — לכל מכשיר יש זוג מפתחות **שני**, ECDH P-256 (המפתח Ed25519 לא
  יכול לעשות הסכמת-מפתח). עטיפת ECIES: אפמרלי → HKDF-SHA256 → AES-GCM.
- `epoch.ts` — מפתח AES-256 לכל Space לכל epoch. חלוקה: אירוע
  `epoch.rotate` **גלוי** (אי אפשר להצפין את הודעת חלוקת המפתח במפתח
  שהיא מחלקת) שה-predicate שלו מכיל את המפתח עטוף לכל מכשיר-חבר.
- `seal.ts` — `SealedEnvelope`: האירוע החתום מוצפן ב-AES-GCM עם AAD שקושר
  את הכותרת (spaceId/epoch/שולח); מעטפת חוץ חתומה ב-Ed25519 שה-relay
  מאמת בלי לראות תוכן.

**צד שרת** — `src/lib/server/relay/log.ts` + `src/routes/api/relay/[spaceId]/+server.ts`
- יומן append-only עם seq רציף לכל Space; זרם אחד לאירועים גלויים
  ולמעטפות חתומות. אירועים גלויים נשמרים גם ב-consentStore (מראת Strapi);
  מעטפות — בזיכרון בלבד (משימה T3).
- restart שרת ⇒ `logEpoch` חדש ⇒ הלקוח מזהה ומסנכרן מ-0; ה-dedupe בולע.

### סמנטיקת ה-epochs (חשוב להבין לפני כל שינוי)

- **חבר מצטרף** → אין רוטציה; עוטפים את מפתח ה-epoch הנוכחי גם אליו
  (מצטרף רואה את ההיסטוריה של ה-epoch — סמנטיקה מכוונת).
- **חבר מוסר** → רוטציה **חובה**; המפתח החדש נעטף רק לנשארים. המוסר קורא
  את העבר (היה שם — בלתי נמנע והוגן), לא את העתיד.
- שני `epoch.rotate` לאותו מספר (מרוץ) → הזוכה הוא בעל ה-event-id הנמוך,
  דטרמיניסטי בשני הצדדים. המפסיד אמור לזהות ולרוטט מחדש.
- מפתחות epoch גולמיים חיים **בזיכרון בלבד** (מפת `epochKeysRaw` ברפליקה);
  reload משחזר אותם מאירועי rotate + מפתח ה-KEM הפרטי שב-IDB.

---

## 2. איך מריצים ובודקים

```bash
npm install
npx vitest --run src/lib/space src/lib/server/relay   # השכבה המבוזרת (35 טסטים)
npx vitest --run src/lib/crypto src/lib/consent src/lib/server/consent  # היסודות (154)
npm run check    # svelte-check — טיפוסים
```

**עובדות סביבה שיחסכו לך שעות**:
- `npm test` המלא מכיל **27 כשלים קיימים מראש** שלא קשורים לשכבה הזו
  (levDataExtractors, TaskApprovalButton, actions registry, StrapiClient,
  levDerived, levDataLoader). **אל תנסה "לתקן" אותם כחלק מעבודה כאן ואל
  תיבהל מהם** — בדוק רק שהמספר לא גדל בגללך.
- אין fake-indexeddb בסביבת הטסטים. טסטים לשכבה הזו בונים מפתחות ומכשירים
  **בזיכרון** (ראה `makeDevice` ב-`e2e.test.ts`) ולא נוגעים ב-IDB.
- הפרויקט מקומפל עם `strict: false` ⇒ narrowing של discriminated unions
  **לא עובד**. לכן כל טיפוס תוצאה מגדיר `reason?: undefined` על ענף ההצלחה
  (דפוס `VerifyResult`). שמור על הדפוס או ש-svelte-check ייכשל.
- טסטים תחת `src/routes/` נכללים רק אם הם `.ts` (ה-exclude הוא `*.test.js`).
  העדף לשים לוגיקת שרת ב-`src/lib/server/` ולבדוק אותה שם.
- ה-relay מאמת חתימות בצד Node דרך `verifyServerSide.ts` שמזריק webcrypto
  ל-globalThis — אם אתה כותב route חדש שמאמת, ייבא משם ולא ישירות.

---

## 3. אינווריאנטים — דברים שאסור לשבור

1. **אירוע חתום הוא לנצח.** אסור לשנות את הקנוניקליזציה, את סדר השדות
   בחתימה, או להפוך שדה אופציונלי לחובה. כל שינוי ב-`ConsentEvent` =
   שדות אופציונליים חדשים בלבד.
2. **`stateRoot`**: כל שינוי במבנה `ProjectState` מחייב עדכון
   `normalizeState` + העלאת `STATE_ROOT_VERSION` + טסטים. אם אינך בטוח —
   אל תוסיף שדות ל-ProjectState; `epoch.rotate` הושאר בלי reducer בדיוק
   מהסיבה הזו.
3. **IndexedDB**: לעולם אל תשנה store קיים; רק להוסיף stores חדשים תחת
   בדיקת `objectStoreNames.contains` + העלאת `DB_VERSION` ב-1. משתמשים
   אמיתיים מחזיקים DB בגרסה הישנה.
4. **ה-relay לעולם לא סמכות.** אסור להוסיף לו לוגיקה עסקית, סינון תוכן,
   או כתיבה שהלקוח תלוי בה. הוא תיבת דואר. כל אימות שהוא עושה הוא
   אנטי-ספאם שהלקוח חוזר עליו מקומית.
5. **ב-Space עם E2E, שום אירוע שאינו `epoch.rotate` לא עוזב את המכשיר
   בגלוי.** ה-guard נמצא ב-`publish()` וב-`sync()` (סינון pushable).
   אם אתה נוגע ב-sync — שמור על הסינון הזה, זו דליפת פרטיות אם לא.
6. **הצינור הכפול של מעטפה**: חתימת חוץ מוכיחה שולח מול ה-relay; החתימה
   **הפנימית** של האירוע היא הסמכות. פתיחת מעטפה בלי להריץ את האירוע
   הפנימי דרך `ingestEvent` = חור אבטחה.
7. **דטרמיניזם מעל הכל**: כל הכרעה בין צדדים (epoch כפול, dedupe, סדר
   topo) חייבת להיות פונקציה של הנתונים בלבד, לעולם לא של "מי הגיע קודם
   לשרת". אם אתה מוסיף הכרעה חדשה — כתוב טסט שמריץ אותה בשני סדרים.
8. **אל תוסיף תלות חיצונית לשכבת הקריפטו.** הכל WebCrypto מובנה. ספרייה
   חיצונית = משטח תקיפה + בעיית bundle. אם משהו נראה בלתי אפשרי בלי
   ספרייה, כנראה שהתכנון שגוי.

---

## 4. תור המשימות — לפי סדר, עם הוראות

### T1 — חיבור socket להערת סנכרון (קל, התחל כאן)
**מטרה**: במקום polling כל 20 שניות, אירוע socket מעיר את הרפליקה.
**איך**: השרת כבר משדר דרך Socket.io (חפש `io.emit` תחת `src/lib/server`).
אחרי `relayAppend`/`relayAppendSealed` ב-route של ה-relay, שדר
`space:changed` עם `{spaceId}` (בלי תוכן!). בלקוח, מי שמחזיק רפליקה מאזין
וקורא `replica.pollAndSyncIfBehind()`. השאר את ה-polling כ-fallback עם
interval ארוך (2–5 דקות).
**קבלה**: שני טאבים; פעולה בטאב א' מופיעה בטאב ב' בתוך שנייה-שתיים.

### T2 — דף ראשון קורא מה-projection (חלון הראווה של הטעינה המהירה)
**מטרה**: `/moach/[projectId]/split` מציג נתונים מ-`replica.projectFor()`
לצד הנתונים הקיימים (shadow, מאחורי הדגל).
**איך**: עקוב אחרי הדוגמה ב-HOWTO_SPACE_SYNC §הפעלה. אל תחליף את מקור
הנתונים הקיים — הצג badge השוואה (תואם/לא תואם) בסגנון `ConsentBadge`.
**קבלה**: עם הדגל דלוק, ה-projection המקומי מוצג מיידית (לפני ה-GraphQL)
ומתעדכן אחרי sync.

### T3 — התמדת מעטפות חתומות (צד Strapi, repo 1.0b)
**מטרה**: מעטפות sealed שורדות restart של ה-relay.
**איך**: קולקציה חדשה `sealed-envelope` ב-1.0b (שדות: id ייחודי, spaceId
אינדקס, payload JSON, ts). ב-`log.ts` → `relayAppendSealed`: write-through
בסגנון `mirrorSaveEvent` (best-effort, לעולם לא חוסם). ב-`relayRead` על
space ריק: טעינה עצלה מהמראה. חקה את `strapiMirror.ts` אחד-לאחד.
**קבלה**: טסט שממלא space, מדמה restart (`_resetRelayLogs`), ורואה את
המעטפות חוזרות מהמראה. **זכור**: זה עדיין mailbox, לא סמכות.

### T4 — S2b: הרחבת ה-reducers (העבודה הגדולה, מכנית)
**מטרה**: ~25 reducers שמכסים את קטגוריה א' (טבלה ב-PLAN_serverless_p2p_data §2).
**המתכון לכל ישות** (עשה אחת, מלא, לפני שתמשיך לבאה):
1. פתח את ה-action הקיים ב-`src/lib/server/actions/configs/` (למשל
   `approveHaluka.ts`) והבן אילו שדות משתנים.
2. הוסף שם action ל-`ACTIONS` ב-`event.ts` (`haluka.approve` כבר קיים —
   בדוק קודם מה יש).
3. כתוב reducer ב-`src/lib/consent/reducers/` בתבנית של `tosplitVote.ts`:
   טהור, immutable, מתעלם מאירוע לא-תקין בשקט.
4. אם ה-reducer משנה את `ProjectState` — עצור וקרא אינווריאנט 2 (§3).
   רוב הישויות יצטרכו מפות חדשות ב-ProjectState ⇒ bump ל-STATE_ROOT_VERSION
   פעם אחת מרוכזת בסוף, לא 25 פעמים.
5. טסטים: (א) אירוע תקין משנה state כצפוי; (ב) סדר אקראי של אותם אירועים
   → אותו state; (ג) אירוע כפול לא משנה פעמיים.
6. חבר לזרימה הקיימת בדפוס של `specs/addVote.ts` (חתימה במקביל, לא במקום).
**סדר מומלץ**: mission → haluka → decision/hazbaah → timer → forum/message
→ sale → השאר. `pendm/negopendmission/mesimabetahalich` הם מצבים של
mission — reducer אחד עם predicate, לא שלושה.

### T5 — אכיפת הרשאות רוטציה (חור אבטחה ידוע, לסגור לפני production)
**מצב היום**: כל מי שמחזיק זהות יכול לפרסם `epoch.rotate` ל-Space.
בטסטים ובשלב shadow זה בסדר; לפני אכיפה — לא.
**איך**: ב-`ingest.ts` (או ב-hook ייעודי), אירוע `epoch.rotate` ל-space
`project:X` תקף רק אם ה-actor הוא חבר פעיל לפי ה-projection של אותו
project באותו רגע (`project.join` בלי `project.leave`). דחייה = כמו חתימה
פסולה. הוסף גם בדיקת רציפות: `epoch === current+1` (לא מדלגים).
**קבלה**: טסט — לא-חבר מפרסם rotate ⇒ נדחה; חבר מדלג מ-0 ל-5 ⇒ נדחה.

### T6 — Genesis snapshot (מיגרציה של פרויקט קיים)
לפי PLAN_serverless_p2p_data §11: ייצוא מצב מ-Strapi → snapshot קנוני →
כל החברים חותמים (`snapshot.commit` + `snapshot.vote` כבר קיימים
כ-actions!) → ה-snapshot הוא ההורה הראשון של ה-DAG. בנה על
`snapshotCommit.ts` הקיים. אל תמיר היסטוריה — רק את ההווה.

### T7 — שרשרת DeviceCert + זיווג מכשירים (Phase 2 שנשאר פתוח)
`register` היום הוא TOFU. יש טיפוס `DeviceCert` מוכן ב-`event.ts` ותכנון
מלא ב-PLAN_user_sovereign_consent §Multi-device. ה-UI (QR) הוא החלק הקל;
האימות בצד שרת ב-`register/+server.ts` (חתימת האב על ה-cert) הוא העיקר.

### T8 — WebRTC (S3b)
הפרוטוקול ב-`protocol.ts` אגנוסטי לתעבורה בכוונה: אותם `SYNC_HEADS`/
`SYNC_DIFF` על DataChannel. ה-relay נשאר signaling + fallback. אל תיגע
בפרוטוקול — רק תעבורה חדשה שקוראת לאותן פונקציות.

### T9 — שחזור חברתי (S4) — ⚠ קריפטוגרפיה רגישה
Shamir k-of-n על מפתח שחזור, רסיסים מוצפנים לשומרים (kemWrap קיים ומתאים).
**אזהרה למודל הממשיך**: אל תממש Shamir בעצמך מאפס בלי טסטים מול וקטורים
ידועים; שקול את המימוש הקיים היחיד שמותר לשקול — קוד ועדת תקינה מוכר —
או דחה את המשימה לאדם. טעות כאן = משתמשים נעולים בחוץ לנצח.

---

## 5. מה עוד לא בטוח (כנות, כדי שלא תצהיר הצהרות שווא)

- **אין אכיפת חברות על rotate** (T5) — כרגע כל בעל זהות יכול.
- **TOFU**: מכשיר ראשון מתקבל על אמון; חטיפת session בזמן הרישום = חטיפת
  זהות. Phase 2 (T7) סוגר.
- **מטא-דאטה**: ה-relay רואה spaceId, מי שולח, מתי, כמה. אל תבטיח פרטיות
  מוחלטת לפני S5.
- **אין forward secrecy בתוך epoch**: דליפת מפתח epoch חושפת את כל אותו
  epoch. השדרוג המתוכנן: MLS (RFC 9420) — אחרי שהכל עובד, לא לפני.
- **סיבוב cursor**: לקוח שלא סנכרן מעבר לחיי היומן בזיכרון תלוי במראה
  (T3 משלים).
- **`ct` לא מרופד**: אורך ההצפנה מסגיר סדר-גודל של התוכן. padding — S4.

## 6. אל תעשה (רשימה שנכתבה בדם של פרויקטים אחרים)

- אל תחליף את ה-DAG הביתי ב-CRDT גנרי "כי זה סטנדרטי" — אירוע חתום הוא
  גם הסכמה משפטית; Yjs מותר רק כ-payload לעריכת טקסט (PLAN §9).
- אל תוסיף שדה חובה ל-ConsentEvent. לעולם.
- אל תשנה את `canonical.ts`. אם נדמה לך שיש בו באג — יש לך באג.
- אל תמחק את מסלול ה-plaintext (S2) — spaces ישנים ימשיכו לחיות בו עד
  מיגרציה מסודרת (T6).
- אל תעשה "אופטימיזציה" שמכניסה תלות בסדר הגעה לשרת. דטרמיניזם > מהירות.
- אל תפרסם ל-npm/CDN שום דבר מהשכבה הזו בשלב הזה.

---

*נכתב ביולי 2026 כחלק ממסירת העבודה. הטסטים הם החוזה: אם שינית משהו וכל
הטסטים הקיימים עוברים בלי שריכך אותם — כנראה שאתה בסדר. אם ריככת טסט
כדי שיעבור — עצור וחשוב שוב.*
