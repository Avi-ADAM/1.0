# HANDOFF — מערכת הדאטהבייס המבוזרת: מדריך המשך למי שבא אחרי פייבל

> **למי המסמך הזה מיועד**: למפתח או למודל AI שממשיך את העבודה על שכבת
> הנתונים המבוזרת ואין לו את ההקשר של מי שבנה אותה. המסמך כתוב בהנחה שאתה
> **לא** מכיר את התכנון — קרא אותו עד הסוף לפני שאתה נוגע בקוד.
>
> **סדר קריאה חובה**:
>
> 1. המסמך הזה (מפת מצב + חוקים)
> 2. [PLAN_user_sovereign_consent.md](./PLAN_user_sovereign_consent.md) — היסודות (Phase 0–5)
> 3. [PLAN_serverless_p2p_data.md](./PLAN_serverless_p2p_data.md) — סולם ההדחה S0→S5
> 4. [HOWTO_SPACE_SYNC.md](../HOWTO_SPACE_SYNC.md) — שימוש מעשי בשכבת ה-Space
> 5. הטסטים עצמם — הם הספסיפיקציה המדויקת ביותר שיש

---

## 1. מפת מצב — מה בנוי ועובד (נכון ליולי 2026)

```
שלב                                    סטטוס      איפה
S1  אירועי הסכמה חתומים (shadow)       ✔ בנוי     src/lib/crypto, src/lib/consent
S2a Space + relay + סנכרון heads/diff  ✔ בנוי     src/lib/space, src/lib/server/relay
S3a הצפנה קבוצתית (epoch keys, E2E)    ✔ ליבה     src/lib/space/e2e
S2b reducers לקטגוריה א' (T4)          ✔ בנוי     src/lib/consent/reducers (יולי 2026)
S2b UI קורא מ-projection (T2, shadow)  ✔ בנוי     SpaceProjectionShadow בדף split (יולי 2026)
T1  socket wake (space:changed)        ✔ בנוי     socket-server + relay notify + spaceStore
T3  התמדת מעטפות sealed (מראה)         ✔ בנוי     sealedMirror.ts + קולקציה ב-1.0b
T5  אכיפת הרשאות rotate                ✔ בנוי     src/lib/space/rotateGuard.ts
T6  Genesis snapshot (מיגרציה)         ✔ בנוי     consent/genesis, space/genesis (יולי 2026)
T7  שרשרת DeviceCert + זיווג (shadow)  ✔ בנוי     crypto/deviceCert, /me/devices
T10 compaction (snapshots כנק' גיזום)  ✔ בנוי     space/compaction, PLAN_T10_COMPACTION
T11 סגירת מרוץ ה-rotate                ✔ בנוי     e2e/epoch (candidates), rotateRace.test
S3b WebRTC, אכיפת הצפנה, הסרת Strapi   ✗           (T8)
T9a epoch.grant (שיתוף מפתח בלי רוטציה) ✔ בנוי     e2e/epoch.ts, spaceStore.grantEpochKeys (ספט' 2026)
T9b אפוטרופסים (שחזור זהות)            ◐ ליבה     consent/recovery.ts — בלי שרת/UI
T9c Shamir (space אישי מוצפן)           ⏸ נדחה     אין צרכן — PLAN_T9_SOCIAL_RECOVERY §5
S4  key transparency                   ✗
R0  מפרט פורמט + test vectors          ✔ בנוי     docs/SPEC_CONSENT_FORMAT.md, spec/consent-v1 (אוק' 2026)
R1  חתימה נייטיבית ב-Tauri (keystore)  ✗           דורש את מסלול ה-SPA — §8
R2  ליבת Rust אחת (WASM + נייטיב)     ✗           מתוזמן ל-S3b, בתנאים — §8
PQ  עמידות קוונטית (היברידי)           ✗           KEM = תנאי לשער S3; חתימות על עוגנים — §8.4
```

> **התור הפעיל** של כל השורות הפתוחות כאן — מסודר, עם תנאי קבלה ופרוטוקול
> לסוכן שממשיך לבד: [PLAN_DISTRIBUTED_EXECUTION.md](./PLAN_DISTRIBUTED_EXECUTION.md).

> **🚧 שער S2b (החלטה מיולי 2026)**: היעד המחייב הוא **S2b** — עד אליו כל
> שלב הוא רווח נקי (מהירות, offline, חתימות) בלי לאבד יכולת תפעולית.
> מ-S3 בפרודקשן (E2E כברירת מחדל) מתחיל הפסד אופציונלי: השרת מפסיק לראות
> נתונים ⇒ אין support-by-DB, אין תיקוני דאטה ידניים, ומפתח שאבד = נתונים
> שאבדו. S3a שנבנה כאן הוא ליבה + טסטים — **אסור להפעיל publishSealed
> למשתמשים אמיתיים** לפני: (א) החלטה מוצרית מחודשת (ראו
> PLAN_serverless_p2p_data §1, "נקודת האיזון המוצרית"); (ב) T5 ו-T9
> סגורים. גם אז — E2E סלקטיבית ל-spaces שמבקשים, לא כברירת מחדל לכולם.

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
  דטרמיניסטי בשני הצדדים. **T11 (ממומש)**: הפתיחה מנסה את _כל_ מפתחות
  המועמדים (זוכה קודם) — אירועים שנחתמו במפתח המפסיד בחלון המרוץ נשארים
  קריאים לכולם, כי אירוע ה-rotate המפסיד נושא את ה-wraps של עצמו; חתימה
  עתידית משתמשת רק במפתח הזוכה. מפסיד שהודר מה-wraps של הזוכה מזוהה דרך
  `replica.needsReRotate()` והתרופה היא rotate חדש (ה-caller מחליט מתי,
  נגד סופות rotate).
- מפתחות epoch גולמיים חיים **בזיכרון בלבד** (מפת `epochKeysRaw` ברפליקה);
  reload משחזר אותם מאירועי rotate + מפתח ה-KEM הפרטי שב-IDB.

---

## 2. איך מריצים ובודקים

```bash
npm install
npx vitest --run src/lib/space src/lib/server/relay   # השכבה המבוזרת (35 טסטים)
npx vitest --run src/lib/crypto src/lib/consent src/lib/server/consent  # היסודות (154)
npx vitest --run src/lib/consent/vectors   # החוזה חוצה-השפות (SPEC_CONSENT_FORMAT §10)
npm run check    # svelte-check — טיפוסים
```

**ה-vectors ב-`spec/consent-v1/` הם החוזה.** אם `vectors.test.ts` נכשל
ב-"freeze", השינוי שלך הזיז בייטים חתומים, ids או state roots — כלומר שבר
כל חתימה/התחייבות קיימת וכל מימוש אחר. **אל תריץ `npm run vectors:consent`
כדי "לתקן"**; תחזיר את ההתנהגות, או תעלה גרסה (אינווריאנטים 1–2) ורק אז
תייצר מחדש ותבדוק את ה-diff.

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
5. **ב-Space עם E2E, שום אירוע שאינו חלוקת מפתח (`epoch.rotate` /
   `epoch.grant`, ‏`isKeyDistributionEvent`) לא עוזב את המכשיר בגלוי.**
   ה-guard נמצא ב-`publish()` וב-`sync()` (סינון pushable). אם אתה נוגע
   ב-sync — שמור על הסינון הזה, זו דליפת פרטיות אם לא.
6. **הצינור הכפול של מעטפה**: חתימת חוץ מוכיחה שולח מול ה-relay; החתימה
   **הפנימית** של האירוע היא הסמכות. פתיחת מעטפה בלי להריץ את האירוע
   הפנימי דרך `ingestEvent` = חור אבטחה.
7. **דטרמיניזם מעל הכל**: כל הכרעה בין צדדים (epoch כפול, dedupe, סדר
   topo) חייבת להיות פונקציה של הנתונים בלבד, לעולם לא של "מי הגיע קודם
   לשרת". אם אתה מוסיף הכרעה חדשה — כתוב טסט שמריץ אותה בשני סדרים.
   כל tie-break או "id נמוך מנצח" עובר דרך `compareIds`
   (‏`$lib/consent/ids`, השוואת code units) — **לעולם לא `localeCompare`**,
   שסדרו תלוי ב-locale/ICU של הריצה ומתהפך על ids ב-b64url (`-`, `_`,
   אותיות גדולות/קטנות; אפילו `aa` בקולציה דנית).
8. **אל תוסיף תלות חיצונית לשכבת הקריפטו.** הכל WebCrypto מובנה. ספרייה
   חיצונית = משטח תקיפה + בעיית bundle. אם משהו נראה בלתי אפשרי בלי
   ספרייה, כנראה שהתכנון שגוי.
   *חריג מתוכנן אחד (§8, R2)*: ליבת Rust שמחליפה את הליבה — לא נוספת
   לצידה — ורק אחרי שהיא עוברת את כל ה-vectors. גם אז, **בדפדפן המפתחות
   הפרטיים נשארים ב-WebCrypto** (non-extractable); WASM מקבל לוגיקה, לא
   מפתחות.
9. **מימוש אחד לכל פלטפורמה, וה-vectors מעליו.** כל תוספת לפורמט (שדה,
   פעולה עם reducer, שינוי state) מגיעה עם vector שמקבע אותה
   (`src/lib/consent/vectors/build.ts`). שני מימושים שמתקיימים במקביל
   לאורך זמן = שני מקורות אמת לקונצנזוס — זה מותר רק כ-differential
   testing בזמן מעבר.

---

## 4. תור המשימות — לפי סדר, עם הוראות

> **עדכון סדר (יולי 2026)** — הסדר המספרי כבר לא משקף את הסיכונים:
>
> 1. **T3 עולה ראשון** אם השרת רץ על Vercel: היומן in-memory לא שורד
>    serverless (ראו §7 מובייל, נקודה 2) — בלי התמדה הסנכרון דגרדד
>    ל-full-pull תמידי.
> 2. אחריו T1 → T2 → **T5 לפני T4**: אכיפת הרשאות rotate היא חור אבטחה
>    ידוע; אסור שמשתמש אמיתי יהיה תלוי ב-space מוצפן לפניה.
> 3. T9 (שחזור חברתי) הוא תנאי-סף ל-E2E בפרודקשן, לא "משימה אחרונה" —
>    ראו שער S2b ב-§1.
> 4. שתי משימות שהיו חסרות נוספו: T10 (compaction) ו-T11 (מרוץ rotate).

### T1 — חיבור socket להערת סנכרון (קל) — ✔ בוצע (יולי 2026)

**מה נבנה**: `socket-server` קיבל `space:subscribe`/`space:unsubscribe` (rooms)
ו-endpoint‏ `POST /space-changed`; ה-route של ה-relay קורא ל-`notifySpaceChanged`
(‏`src/lib/server/relay/notify.ts`, best-effort) רק כשמשהו חדש באמת נקלט;
`socketClient` קיבל `subscribeSpace`/`onSpaceChanged` (מנויים שורדים reconnect);
`startAutoSync` נרשם ל-wake ומותח את ה-polling ל-3 דקות כ-fallback.
**נותר לאמת ידנית**: שני טאבים עם הדגל דלוק — פעולה בטאב א' מופיעה בטאב ב'
בתוך שנייה-שתיים (דורש stack מלא: Strapi + socket-server + app).

**מטרה מקורית**: במקום polling כל 20 שניות, אירוע socket מעיר את הרפליקה.
**איך**: השרת כבר משדר דרך Socket.io (חפש `io.emit` תחת `src/lib/server`).
אחרי `relayAppend`/`relayAppendSealed` ב-route של ה-relay, שדר
`space:changed` עם `{spaceId}` (בלי תוכן!). בלקוח, מי שמחזיק רפליקה מאזין
וקורא `replica.pollAndSyncIfBehind()`. השאר את ה-polling כ-fallback עם
interval ארוך (2–5 דקות).
**קבלה**: שני טאבים; פעולה בטאב א' מופיעה בטאב ב' בתוך שנייה-שתיים.

### T2 — דף ראשון קורא מה-projection (חלון הראווה של הטעינה המהירה) — ✔ בוצע (יולי 2026)

**מה נבנה**: `src/lib/components/consent/SpaceProjectionShadow.svelte` בדף
`/moach/[projectId]/split` — hydrate מיידי מ-IDB, autoSync ברקע, badge בסגנון
ConsentBadge (אפור=projection ריק, ירוק=תואם, אדום=לא תואם) והשוואת יתרות
hervachti ברזולוציית אגורות (chain agorot מול Strapi שקלים×100). אי-התאמות
נרשמות ל-console עם התג `[space-shadow-telemetry]` — זה הבסיס לקריטריון
היציאה מ-shadow שמוגדר למטה. מוצג רק עם `SPACE_SYNC_ENABLED='1'`.

**גשר T2↔T4 (יולי 2026)**: חתימות הצל זורמות עכשיו אל ה-Space, לא רק למראה.
`signActionShadow` (‏`src/lib/client/shadowSign.ts`) גוזר projectId מה-params
(‏`deriveProjectIdFromAction`; ברירת מחדל `params.projectId ?? params.pid`,
עם override פר-spec דרך `ConsentSpec.projectIdFromParams`) — וכשיש project
והדגל דלוק, מפרסם דרך `replica.publish()` (או `publishSealed` ב-space מוצפן)
במקום POST ישיר ל-`/api/consent/events`. צינור אחד מזין את שניהם:
`relayAppend` עושה write-through ל-consentStore, ו-notify של T1 מעיר את
הרפליקות המנויות. אירוע בלי project (למשל `message.post` בלי הקשר) נשאר
במסלול המראה הישן. בלי הדגל — הכל כמו קודם.

**מטרה מקורית**: `/moach/[projectId]/split` מציג נתונים מ-`replica.projectFor()`
לצד הנתונים הקיימים (shadow, מאחורי הדגל).
**איך**: עקוב אחרי הדוגמה ב-HOWTO_SPACE_SYNC §הפעלה. אל תחליף את מקור
הנתונים הקיים — הצג badge השוואה (תואם/לא תואם) בסגנון `ConsentBadge`.
**קבלה**: עם הדגל דלוק, ה-projection המקומי מוצג מיידית (לפני ה-GraphQL)
ומתעדכן אחרי sync.
**קריטריון יציאה מ-shadow** (להגדיר כאן, לא בתחושת בטן): ה-badge מדווח
אי-התאמות לטלמטריה; עוברים ל-projection כמקור תצוגה רק אחרי תקופה
מוגדרת מראש (למשל 30 יום או 1,000 אירועים, המאוחר מביניהם) עם 0
אי-התאמות שאינן באג מוסבר-ומתוקן.

### T3 — התמדת מעטפות חתומות (צד Strapi, repo 1.0b) — ✔ בוצע (יולי 2026)

**מה נבנה**: קולקציה `api::sealed-envelope.sealed-envelope` ב-1.0b (append-only,
find/findOne/create, שדות envelopeId ייחודי / spaceId / ts / payload);
`src/lib/server/relay/sealedMirror.ts` (חיקוי אחד-לאחד של strapiMirror);
write-through fire-and-forget ב-`relayAppendSealed`; `relayEnsureHydrated`
נקרא בתחילת GET/POST של ה-route — טעינה עצלה פעם-אחת-לתהליך. טסט קבלה:
`mirrorPersistence.test.ts` (מילוי → `_resetRelayLogs` → המעטפות חוזרות,
dedupe על re-push). **נדרש בפריסה**: deploy של 1.0b עם הקולקציה החדשה.

**מטרה מקורית**: מעטפות sealed שורדות restart של ה-relay.
**איך**: קולקציה חדשה `sealed-envelope` ב-1.0b (שדות: id ייחודי, spaceId
אינדקס, payload JSON, ts). ב-`log.ts` → `relayAppendSealed`: write-through
בסגנון `mirrorSaveEvent` (best-effort, לעולם לא חוסם). ב-`relayRead` על
space ריק: טעינה עצלה מהמראה. חקה את `strapiMirror.ts` אחד-לאחד.
**קבלה**: טסט שממלא space, מדמה restart (`_resetRelayLogs`), ורואה את
המעטפות חוזרות מהמראה. **זכור**: זה עדיין mailbox, לא סמכות.

### T4 — S2b: הרחבת ה-reducers (העבודה הגדולה, מכנית) — ✔ בוצע (יולי 2026)

**מה נבנה** (הטסטים ב-`reducers/s2b.test.ts` + `specs/s2b.test.ts` הם הספסיפיקציה):

- **אוצר מילים**: `mission.create`, `pendm.vote`, `sheirutpend.vote`, `ask.vote`,
  `haluka.confirm`, `decision.create`, `forum.create`, `message.post`,
  `payload.redact`, `pgisha.create`, `pgisha.approve` נוספו ל-ACTIONS; לכל
  שם ב-ACTIONS (חוץ מ-`epoch.rotate` בכוונה) יש עכשיו reducer — 29 סה"כ.
- **ProjectState** קיבל את מפות קטגוריה א': `missions` (pendm/mesimabetahalich/
  finiapruval הם _states_ של MissionView אחד), `halukas`, `decisions`,
  `stageVotes` (טאלי הצבעות גנרי — pend/ask/sheirutpend/decision לא-saleClaim),
  `timers`, `forums` (עם הודעות), `meetings`, `away`, `settings`.
- **stateRoot v2**: כל המפות החדשות + `sales`/`saleClaims` (שהושארו מחוץ ל-v1
  במכוון) נכנסו ל-normalizeState; `STATE_ROOT_VERSION` הועלה 1→2 פעם אחת.
- **חיבור לזרימה** (שלב 6): `specs/s2b.ts` (מקור אמת יחיד ל-predicates) +
  `client/shadowSignRegistry.ts` — hook מרכזי ב-`executeAction` שחותם במקביל
  אחרי הצלחת action עבור `createMission`/`completeMission`/`createHaluka`/
  `createChatMessage` (מזהי subject נולדים בשרת ⇒ החתימה אחרי התוצאה, בדפוס
  createSale). actions עם חתימה פר-call-site (addVote, createSale) _לא_
  ברג'יסטרי — למניעת חתימה כפולה.
- **GDPR**: ההכרעה למעלה מומשה — `payload.redact` מרוקן body של הודעה /
  `completion.why` של משימה, מחבר-בלבד, עם `redacted: true`.

**מה נשאר פתוח מתוך T4**: אכיפת קוורום על `haluka.approve`/`mission.approve`
היא עדיין באחריות ה-verifier (כמו קודם); ו-actions נוספים (פגישות, timer,
project.amend) עדיין לא נחתמים מה-UI — ה-reducers מוכנים, נשאר להוסיף
entries ל-`s2bShadowJobs` כשמחברים כל זרימה.

**מטרה מקורית**: ~25 reducers שמכסים את קטגוריה א' (טבלה ב-PLAN_serverless_p2p_data §2).
**לפני שמתחילים — הכרעת מחיקה/GDPR**: מדיניות payload-by-reference +
tombstones (PLAN §13.4) משפיעה על מבנה האירועים של כל 25 הישויות; להכריע
פעם אחת כאן, כי אחרי 25 reducers זה שינוי יקר.

> **✔ ההכרעה (יולי 2026, מומשה כחלק מ-T4)** — שלושה חוקים:
>
> 1. **שדות מבניים** (סכומים, מזהים, סטטוסים, תאריכים) — inline ב-predicate,
>    לנצח. הם ליבת ההסכמה ולא נמחקים.
> 2. **תוכן חופשי בר-מחיקה** (גוף הודעה, `why` של השלמת משימה, תיאורים) —
>    בשלב ה-shadow מותר inline, אבל **כל reducer מאחסן אותו בשדה שהאירוע
>    הגנרי `payload.redact` יודע לרוקן** (tombstone). המחיקה היא אירוע חתום:
>    ה-view נשאר עם `redacted: true` והתוכן נעלם מה-projection. הלוג עצמו
>    לא משוכתב — ב-S2 השרת (mirror) רשאי בנוסף למחוק את ה-payload הגולמי
>    מהמראה; ב-S3 התוכן ממילא ciphertext.
> 3. **payload-by-reference** (`bodyRef` = sha256 של התוכן, התוכן מחוץ ללוג)
>    הוא נתיב השדרוג ל-S3 — שם השדה שמור כבר עכשיו, המימוש נדחה.
>    reducer שפוגש `bodyRef` בלי `body` מציג את ה-ref בלבד.
>
> אכיפת "מי רשאי למחוק" (המחבר בלבד / קוורום) היא באחריות ingest/verifier
> (כמו T5); ה-reducer מיישם redact רק כשה-actor הוא המחבר הרשום ב-view.
> **המתכון לכל ישות** (עשה אחת, מלא, לפני שתמשיך לבאה):

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

### T5 — אכיפת הרשאות רוטציה — ✔ בוצע (יולי 2026)

**מה נבנה**: `src/lib/space/rotateGuard.ts` — `validateEpochRotate` טהור:
(א) רציפות: אין דילוג קדימה (`epoch > current+1` נדחה); **תיקון T11**: epoch
שווה-או-ישן מתקבל בכוונה — רשומת מרוץ חייבת להתכנס בכל הרפליקות בלי תלות
בסדר הגעה, וההכרעה היא של כלל ה-lowest-id ולא של השומר; (ב) ל-space‏
`project:X` — ה-actor חבר פעיל
לפי ה-projection (bootstrap: epoch 0 על projection בלי חברים מותר; spaces
לא-פרויקטליים מדלגים על בדיקת חברות). מחובר ב-`ingestAndLink` (דחייה = כמו
חתימה פסולה) וב-`publish` (לא משדרים rotate שיידחה אצל כולם). ה-relay נשאר
טיפש בכוונה (אינווריאנט 4). טסטים: `rotateGuard.test.ts`.

**מצב לפני**: כל מי שמחזיק זהות יכול לפרסם `epoch.rotate` ל-Space.
בטסטים ובשלב shadow זה בסדר; לפני אכיפה — לא.
**איך**: ב-`ingest.ts` (או ב-hook ייעודי), אירוע `epoch.rotate` ל-space
`project:X` תקף רק אם ה-actor הוא חבר פעיל לפי ה-projection של אותו
project באותו רגע (`project.join` בלי `project.leave`). דחייה = כמו חתימה
פסולה. הוסף גם בדיקת רציפות: `epoch === current+1` (לא מדלגים).
**קבלה**: טסט — לא-חבר מפרסם rotate ⇒ נדחה; חבר מדלג מ-0 ל-5 ⇒ נדחה.

### T6 — Genesis snapshot (מיגרציה של פרויקט קיים) — ✔ בוצע (יולי 2026)

**מה נבנה** (הטסטים ב-`consent/genesis.test.ts` הם הספסיפיקציה):

- **שכבה טהורה**: `src/lib/consent/genesis.ts` — `buildGenesisState` (ייצוא
  Strapi → members + balances באגורות), `buildGenesisPredicate` (אותו מבנה
  predicate של T10, אבל `upTo='genesis'` ו-`heads=[]` — אין היסטוריה מכוסה),
  `verifyGenesisPredicate` (שער אימות: inline-state ↔ root),
  `diffGenesisAgainstExport` (השוואה מול ייצוא טרי — advisory, לא שער).
- **Reducer**: `snapshotCommit.ts` — snapshot **חסר-הורים** עם upTo='genesis'
  מחיל (merge) את ה-state המיובא: members=איחוד; balances=ה-genesis **מחליף**
  לחברים שהוא נושא (hervachti של Strapi כבר כולל אפקטים שנחתמו קודם —
  סכימה הייתה double-count); מפות ישויות=רק מפתחות חסרים. רק ה-genesis
  הראשון בסדר topo מוחל; יריב מאוחר רק מתועד כ-mark. דטרמיניסטי בשני
  סדרי הגעה (יש טסט).
- **ייצוא שרת**: GET `/api/consent/genesis/[projectId]` — user_1s + hervachti
  בתבנית של strapiMirror (admin token). קריאה בלבד; הסמכות היא החתימות.
- **זרימת לקוח**: `src/lib/space/genesis.ts` — `proposeGenesis` (ייצוא →
  publish snapshot.commit חסר-הורים → ההצעה כוללת את קול המציע),
  `voteGenesis` (אימות קשיח + diff מדווח → snapshot.vote), `genesisStatus`.
  ההבשלה רוכבת על stageVotes/rounds הקיימים (isSnapshotMatured — פה-אחד
  של החברים המיובאים או שתיקת restime).
- **UI**: כפתורי ייסוד/חתימה בפאנל `SpaceProjectionShadow` בדף split.
  **נשאר פתוח**: סימון legacy read-only ל-Strapi אחרי הבשלה (לפי §11 —
  "פרויקט שלא כל חבריו חתמו נשאר ב-Strapi"); קריטריון היציאה מ-shadow של T2
  חל גם כאן. אל תמיר היסטוריה — רק את ההווה (מומש כך).

### T7 — שרשרת DeviceCert + זיווג מכשירים — ✔ בוצע במצב shadow (יולי 2026)

**מה נבנה**:

- **קריפטו**: `src/lib/crypto/deviceCert.ts` — `signDeviceCert` (מכשיר-אב חותם
  על מכשיר חדש, אותו pipeline של signCanonical/verifySignedObject) +
  `verifyDeviceCert` (עוגן ל-user+device הצפויים; self-cert נדחה; חלון תוקף
  עם סקיו 5 דק'; resolveFromStore כבר דוחה מפתחות מבוטלים).
- **מדיניות רישום**: `src/lib/server/consent/devicePolicy.ts` —
  `judgeRegistration` טהור: מכשיר ראשון TOFU; re-register חופשי; מכשיר נוסף
  עם cert תקף מתקבל; בלי cert — במצב shadow מתקבל-ונרשם, תחת
  `DEVICE_CERT_ENFORCE='1'` נדחה. ה-route‏ `keys/register` מתעד כל הכרעה עם
  `[device-cert-telemetry]` — זה הזרם שמכריע מתי להדליק אכיפה.
- **זיווג** (קוד 6 תווים, בלי מצלמה בגרסה זו): `pairing.ts` (סשנים בזיכרון,
  TTL ‏10 דק') + routes‏ `devices/pair` (פתיחה/עיון) ו-`devices/cert`
  (הגשת cert חתום — כולל נתיב retro-certify למכשירים שנרשמו TOFU לפני);
  צד לקוח ב-`src/lib/client/devicePairing.ts`; UI ב-`/me/devices`.
- **ביטול**: `devices/revoke` — אובייקט `deviceRevoke` חתום ע"י מכשיר פעיל
  (ה-JWT רק שער ספאם; החתימה היא הסמכות). `revokedReason: 'manual' | 'reset'`.
- **איפוס שרשרת** (ה-escape hatch ל"איבדתי את כל המכשירים" — אפשרי רק כל
  עוד השרת סמכות, לפני S3; אחרי E2E זה עובר ל-T9): `devices/reset` —
  מבטל הכל עם reason‏ 'reset'; אחרי `RESET_COOLDOWN_MS` (48ש') הרישום הבא
  הוא TOFU טרי; בתוך החלון מכשיר ישן ששרד יכול למחות (`resetProtest` חתום)
  ולהחזיר את המפתחות. ההתמדה דרך מראת user-key (revokedAt) — שורד restart.

**מה שנשאר כדי להדליק אכיפה** (מסודר): (1) לוודא שהזיווג ב-`/me/devices`
עובד בבדיקה ידנית בין שני דפדפנים/מכשירים; (2) תקופת תצפית על
`[device-cert-telemetry]` עד ש-`uncertified_shadow` נעלם מהזרם עבור משתמשים
פעילים; (3) `DEVICE_CERT_ENFORCE='1'` בפריסה. אזהרות ידועות: סשני הזיווג
בזיכרון (לא שורדים restart — קוד חדש ו-זהו); rate-limit על reset עדיין אין.

**התכנון המקורי**: `register` היה TOFU; טיפוס `DeviceCert` ותכנון מלא
ב-PLAN_user_sovereign_consent §Multi-device.

### T8 — WebRTC (S3b)

> **קדם-T8 (ספטמבר 2026): פיילוט מדידה בספריית הרקמה** —
> [PLAN_P2P_PILOT.md](./PLAN_P2P_PILOT.md). signaling דרך socket-server עם כרטיס
> חברוּת חתום, `src/lib/p2p/peer.ts` (העברה אחת על DataChannel, נבדק בדפדפן אמיתי),
> וטלמטריה שעונה על H1 (קישוריות בלי TURN) ו-H2 (זמינות עמית אונליין) לפני
> שמחליטים על S3. כש-T8 יתחיל: לשמור את ה-signaling ואת `peer.ts`, ולהוסיף
> `SYNC_HEADS/SYNC_DIFF` כסוג הודעה נוסף על אותו ערוץ.

הפרוטוקול ב-`protocol.ts` אגנוסטי לתעבורה בכוונה: אותם `SYNC_HEADS`/
`SYNC_DIFF` על DataChannel. ה-relay נשאר signaling + fallback. אל תיגע
בפרוטוקול — רק תעבורה חדשה שקוראת לאותן פונקציות.

> **S3b הוא גם נקודת ההחלטה על ליבת Rust (R2)** — ראו §8. ב-S3b השרת
> מפסיק להיות עד שיכול לאמת ולתקן; כל עמית מאמת את העמיתים שלו לבד, כך
> שכל פער בין מימושים (דפדפן מול אפליקציה, גרסה מול גרסה) הופך מיד לפיצול
> רקמה. לפני ש-S3b עולה: O-1…O-4 של SPEC_CONSENT_FORMAT §12 סגורים, ו-
> verifyCommitments הופך אינקרמנטלי (§8.3).

### T9 — שחזור חברתי — ◐ בתהליך (ספטמבר 2026)

**תכנון מלא ומצב**: [PLAN_T9_SOCIAL_RECOVERY.md](./PLAN_T9_SOCIAL_RECOVERY.md).
ההנחיה המקורית ("Shamir k-of-n על מפתח שחזור") פוצלה לשלושה חלקים, כי אובדן
כל המכשירים הוא שתי בעיות נפרדות: זהות ונתונים.

- **T9a — `epoch.grant` (✔):** ב-space קבוצתי (רקמה, כספת) החברים האחרים עדיין
  מחזיקים את המפתחות. grant עוטף מפתח **קיים** למכשירים נוספים בלי epoch חדש.
  האירוע גלוי, מפנה ל-rotate לפי id, ולעולם לא מתחרה ב-rotate. rotates חדשים
  נושאים התחייבות מפתח (`kc`), ולכן grant לא יכול להחדיר מפתח אחר. ההרשאה היא
  של T5 (`validateKeyEvent`), והחיבור ב-replica הוא `grantEpochKeys`. זה פותר גם
  את "חבר מצטרף → עוטפים לו את ה-epoch הנוכחי" (§1), שעד עכשיו לא היה לו מימוש,
  וגם את המכשיר שזווג ב-T7.
- **T9b — אפוטרופסים (◐):** שחזור **זהות** בלי קריפטוגרפיית סף. המשתמש חותם
  מראש על k-מתוך-n אפוטרופסים, ו-k מהם חותמים על המכשיר החדש, כולל מפתח ה-KEM
  שלו. אלה `ConsentEvent` רגילים, בלי collection חדש. הליבה הטהורה בנויה
  ב-`consent/recovery.ts`. השרת וה-UI הם הצעדים הבאים.
- **T9c — Shamir (⏸):** נדרש רק ל-space שאף אחד אחר לא קורא, ו-space כזה לא
  קיים. **האזהרה המקורית בתוקף**: לא לממש Shamir מאפס בלי וקטורי בדיקה ידועים
  (שקלו SLIP-0039), או להחזיר את ההחלטה לאדם.

**מיקום בסולם**: T9a+T9b הם תנאי-הסף ל-E2E ב-spaces **קבוצתיים**, והכספת
(`vault:<pid>`) היא הצרכן הראשון שלהם. T9c יהיה תנאי-הסף ל-space אישי מוצפן,
אם יוחלט עליו.

**תיקון שנעשה בדרך (אינווריאנט 7):** `epochCandidates` מיין לפי `localeCompare`,
בעוד ש-`epochStateFromEvents` השווה עם `<`. על id-ים ב-b64url הם חלוקים לפעמים,
ולכן טסט T11 נכשל באקראיות. היום שניהם עוברים דרך `compareIds`. **כלל:** בשכבה
הזו לא משתמשים ב-`localeCompare` לשום הכרעה. `consent/projection.ts`
ו-`reducers/forum.ts` עדיין משתמשים בו (נפתחה משימה, כי זה נוגע ב-stateRoot).

### T10 — Compaction: snapshots חתומי-קוורום — ✔ בוצע (יולי 2026)

**תכנון מלא**: [PLAN_T10_COMPACTION.md](../done/PLAN_T10_COMPACTION.md). **מה נבנה**:

- `consent/stateRestore.ts` — ההופכי המדויק של normalizeState (חוזה סימטריה
  נבדק; מסרב לגרסת state לא מוכרת). **כל שינוי עתידי ב-normalizeState חייב
  לעדכן גם אותו** — זה עכשיו חלק מאינווריאנט 2.
- `projection.ts` — `projectFrom(base, events)`; `project()` רוכב עליו;
  `applyEvent` כבר לא ממוטט state משותף (base של snapshot).
- `space/compaction.ts` — השכבה הטהורה: `buildSnapshotPredicate` (heads +
  root + state מנורמל inline), `verifySnapshotAgainstLocal` (הבדיקה לפני
  הצבעה — root מול replay מקומי וגם state מול root), `isSnapshotMatured`
  (unanimity ב-stageVotes או שתיקה דרך rounds/timeout), `computePrunableIds`
  (סגירת אבות של הורי ה-snapshot).
- `snapshot.vote` מנותב ל-stageVote; `snapshotCommit` תומך `heads[]`.
- keystore ‏v3 (store‏ `spaceSnapshots`, לפי אינווריאנט 3) + רפליקה:
  `hydrate` משחזר base, `projectFor` בונה עליו, `proposeSnapshot()`
  (publishSealed ב-E2E), `compact()` עם חלון בטיחות `PRUNE_SAFETY_MS` (48ש').
- **קריטריון הקבלה עובר** ב-`space/compaction.test.ts`: היסטוריה מלאה ≡
  snapshot+זנב עד רמת הבייטים הקנוניים, כולל טסט שגיזום בפועל משמר התכנסות.

**נשאר פתוח (מתועד גם ב-PLAN §3)**: הגנת double-apply מעמית זדוני (נדחה
ל-T8/WebRTC); הגשת snapshot+זנב ללקוח טרי מה-relay (היום הוא עדיין
full-pull פעם אחת; הרווח הנוכחי: IDB קטן ו-hydrate/replay מהירים); UI
שמציע snapshot תקופתי (כרגע `proposeSnapshot`/`compact` הם API של הרפליקה).

### T11 — סגירת מרוץ ה-rotate — ✔ בוצע (יולי 2026)

**הפתרון שנבחר** (חזק מהמוצע במקור — בלי אירועי re-wrap בכלל): הקריאות של
חלון המרוץ מובטחת מהדאטה עצמה. `epochCandidates` (‏`e2e/epoch.ts`) מחזיר את
_כל_ אירועי ה-rotate פר-epoch בסדר דטרמיניסטי (זוכה = id נמוך, ראשון);
הפתיחה (`openSealedEnvelope` ברפליקה / `epochKeysForOpen` הטהור) מנסה כל
מפתח מועמד — אירוע המפסיד נושא ממילא wraps לכל החברים, אז מה שנחתם במפתחו
קריא לכולם לנצח. חתימה עתידית משתמשת אך ורק במפתח הזוכה
(`ensureEpochKeyRaw` = candidates[0]) ⇒ התכנסות טבעית בלי תיאום.

- **תיקון נלווה חובה ב-T5**: כלל הרציפות המקורי (`epoch === current+1`)
  דחה את ה-rotate השני של מרוץ — תלות בסדר הגעה שמפרה אינווריאנט 7 ושוברת
  את הקריאות. עכשיו נדחים רק דילוגים קדימה.
- cache המפתחות ברפליקה עבר ממפתח-פר-epoch למפתח-פר-rotate-event-id.
- `detectRotateRaces` + `replica.rotateRaces()` — נראוּת; `needsReRotate()`
  — המקרה שנשאר אנושי: מפסיד שהודר מה-wraps של הזוכה קורא את העבר אבל לא
  את העתיד, והתרופה היא `rotateEpoch()` חדש (rotate הוא plaintext במכוון,
  אז גם מכשיר נעול יכול לפרסם אותו). לא אוטומטי — נגד סופות rotate.
- **הטסט הנדרש קיים** (`e2e/rotateRace.test.ts`): המרוץ רץ בשני סדרי הגעה;
  שני הצדדים קוראים את שני האירועים; הזוכה זהה בכל סדר; תעבורת פוסט-מרוץ
  מתכנסת למפתח יחיד; ותרחיש המפסיד-שהודר מאומת.

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
  (השינוי היחיד שנעשה בו, אוקטובר 2026: **דחייה** של קלט שרק JS יכול
  לגבב — surrogate בודד, מפתחות שמתמזגים תחת NFC — ומיון אחרי NFC. לכל
  קלט תקין הבייטים זהים, וה-vectors מקבעים את זה. SPEC_CONSENT_FORMAT §2.2.)
- אל תמחק את מסלול ה-plaintext (S2) — spaces ישנים ימשיכו לחיות בו עד
  מיגרציה מסודרת (T6).
- אל תעשה "אופטימיזציה" שמכניסה תלות בסדר הגעה לשרת. דטרמיניזם > מהירות.
- אל תפרסם ל-npm/CDN שום דבר מהשכבה הזו בשלב הזה.

---

## 7. אינטגרציה עם אפליקציית המובייל (Tauri) — ראו PLAN_TAURI_MOBILE.md

השכבה הזו היא קוד לקוח טהור (WebCrypto + IndexedDB) ולכן רצה כמו-שהיא
בתוך WebView של Tauri — ו-local-first הוא בדיוק מה שמובייל צריך
(`hydrate()` בלי רשת, offline טבעי). אבל שלוש נקודות חיכוך שאף מסמך לא
כיסה:

1. **אימות Bearer**: במובייל אין cookie‏ `jwt` אמין. כל route של השכבה
   הזו שמזהה משתמש — `/api/relay/[spaceId]`, `/api/consent/keys/*` —
   חייב להיכלל ב-`getAuthToken(event)` המרוכז של PLAN_TAURI_MOBILE §2.2
   (cookie **או** `Authorization: Bearer`).
2. **היומן in-memory לא שורד Vercel**: המובייל מדבר עם השרת הפרוס
   (Vercel/Node). על Vercel serverless אין זיכרון משותף בין invocations —
   כל בקשה עלולה לפגוש `logEpoch` אחר ⇒ הלקוח יסנכרן מ-0 שוב ושוב
   (ה-dedupe בולע, אבל זה full-pull תמידי). לכן T3 קודם לכל חשיפה
   אמיתית, או שה-relay מוצמד לפריסת Node יציבה (socket-server).
3. **T7 (זיווג מכשירים) הופך דחוף**: ברגע שיש אפליקציה, "שני מכשירים
   לאותו משתמש" הוא המצב הרגיל, לא מקרה קצה. TOFU per-device בלי שרשרת
   DeviceCert = לכל משתמש שתי זהויות מכשיר זרות זו לזו.

הערת עתיד: "SQLite-wasm על OPFS" (PLAN §3) נכון לדפדפן; בתוך Tauri עדיף
בבוא היום plugin SQLite נטיבי. לא דחוף.

בונוס התאמה: "הצלצול הריק" של PLAN §8 (push אטום שמעיר את הלקוח למשוך
ולפענח מקומית) הוא בדיוק המודל הנכון ל-FCM בשלב 4.2 של תכנית Tauri.

---

## 8. ליבת אימות ב-Rust (Tauri נייטיב + WASM בדפדפן) — מסקנות, אוקטובר 2026

**ההצעה** (מומחה חיצוני): מאחר ש-Tauri v2 ממילא נכנס לאפליקציות המובייל
והדסקטופ, לכתוב את ליבת האימות ב-Rust — נייטיב בתוך Tauri, WebAssembly
בדפדפן — כך שבכל הפלטפורמות ירוץ אותו קוד.

**ההכרעה**: הכיוון נכון כיעד, אבל לא עכשיו, ולא בגלל הנימוקים שהוצגו.
לא עברנו נקודת אל-חזור: מה שמחייב לנצח הוא **פורמט הבייטים** (§1–§9 של
SPEC_CONSENT_FORMAT), והוא תקני וניטרלי-שפה. ההיגיון ב-TS (~7,400 שורות לא-טסט
ב-crypto/consent/space, רובן פונקציות טהורות) הוא שבועות של פורט, לא שכתוב.

### 8.1 שלושת הנימוקים, לגופם

| נימוק | הערכה |
|---|---|
| **מהיר** | ברובו לא. הפרימיטיבים כבר נייטיב (WebCrypto, גם בתוך ה-WebView של Tauri); Ed25519 ב-WASM איטי יותר מ-WebCrypto בדפדפן. צווארי הבקבוק הם IndexedDB, רשת, ו-**אלגוריתם** (§8.3) — לא שפה |
| **בטוח** | נכון **רק בצד הנייטיבי, ורק לשמירת מפתחות**: Android Keystore/StrongBox, iOS Keychain. בדפדפן WASM **מחליש** — חתימה ב-WASM מחייבת מפתח בזיכרון JS/WASM במקום CryptoKey non-extractable שרק ה-SW מחזיק |
| **קוד אחיד** | כבר קיים: אותו TS רץ בדפדפן, ב-SW, ב-Node וב-WebView של Tauri. Rust *לצד* TS = שני מימושים = ההפך. זה מצדיק Rust רק כ**החלפה** |

### 8.2 השלבים

- **R0 — מפרט + vectors ✔ (אוקטובר 2026).** [SPEC_CONSENT_FORMAT](../SPEC_CONSENT_FORMAT.md),
  `spec/consent-v1/*.json`, `src/lib/consent/vectors/`. זה מה שמשאיר את
  הדלת פתוחה בזול: כל מימוש עתידי נמדד מול אותם קבצים. תוך כדי נמצאו
  ונסגרו שלושה מקומות שבהם מימוש Rust "נאיבי" היה מתפצל (מיון מפתחות
  אחרי NFC, surrogate בודד, b64url לא-קנוני של `sig`), ותועדו מוקשים
  סמנטיים של JS שה-reducers נשענים עליהם (SPEC §6.4) ושישה פתוחים (SPEC §12).
- **R1 — חתימה נייטיבית ב-Tauri.** פקודת Rust שחותמת במפתח מגובה-חומרה;
  ה-TS ממשיך לבנות את הגוף הקנוני ולאמת. **תנאי**: מסלול ה-SPA
  (PLAN_TAURI_MOBILE). במעטפת לאתר החי, חשיפת פקודת חתימה ל-`remote.urls`
  = כל iframe בעמוד יכול לבקש חתימה. Secure Enclave = P-256 בלבד, כך
  שבאייפון ECDSA-P256 הופך לנתיב הראשי — ומכאן ש-O-2 (high-S) חייב
  החלטה לפני R1.
- **R2 — ליבה אחת ב-Rust** (canonical, verify, reducers, stateRoot,
  commitments, quorum) — crate אחד, נבנה ל-WASM (דפדפן + Node) ולנייטיב
  (Tauri). **מתוזמן ל-S3b.** מעבר: differential testing מול TS (fast-check,
  אותם קלטים לשני המימושים) עד שקט מלא, ואז **מוחקים את ליבת ה-TS**.

### 8.3 למה דווקא S3b, ומה חייב לקרות לפניו

עד S2b השרת רואה הכל ויכול לאמת, להשוות ולתקן: פיצול בין מימושים מתגלה
ומטופל במרכז. ב-S3 הוא רואה ciphertext, וב-S3b (WebRTC) הוא אפילו לא בנתיב:
**כל עמית מאמת את העמיתים שלו לבד**. מאותו רגע:

1. פער בין לקוח ווב ללקוח אפליקציה (או בין שתי גרסאות) = רקמה שמתפצלת
   לשני מצבים, בלי שרת שיכריע. ליבה אחת מקומפלת לכל הפלטפורמות סוגרת את
   זה מבנית — וזה הנימוק האמיתי ל-R2, לא מהירות.
2. כלי אימות עצמאי (`1lev1-verify` — בינארי שמקבל ייצוא של space ומאמת
   שרשרת שלמה) הופך לבעל ערך: חבר או מבקר חיצוני בודק את הרקמה בלי לסמוך
   על אף אחד מאיתנו. בינארי Rust הוא הדרך הטבעית לספק אותו.
3. **ביצועים — קודם אלגוריתם.** `verifyCommitments` משחזר את כל סגור האבות
   לכל אירוע: אם כל אירוע נושא התחייבויות, סנכרון של n אירועים עולה O(n²).
   היום רק snapshots נושאים אותן, אז זה לא מורגש. לפני ש-S3b עובר ל-strict:
   projection אינקרמנטלי (מצב לכל head, החלת דלתא) — זה חוסך יותר מכל שפה.

**תנאי כניסה ל-R2** (בנוסף לשער S3 של §1): O-1 (כלל Ed25519 אחד + vectors
מקרי קצה), O-2 (high-S), O-3 (הצבעה שלא יכולה להתחייב ל-root של עצמה —
כנראה STATE_ROOT v3), O-4 (vectors ל-quorum ול-deltaCheck); ו-projection
אינקרמנטלי (סעיף 3 למעלה).

### 8.4 עמידות קוונטית (אוקטובר 2026)

פירוט מלא: SPEC_CONSENT_FORMAT §13. ההכרעות:

- **הצפנה קודמת לחתימה.** ECDH P-256 ב-KEM חשוף ל"אסוף עכשיו, פענח אחר
  כך" — מעטפות sealed נשמרות לנצח. **KEM היברידי (ECDH + ML-KEM-768) הוא
  תנאי (ד) לשער S3** (PLAN_serverless_p2p_data §1). היום אין חשיפה: S3 סגור.
- **חתימות — רק על העוגנים.** SHA-256 (ids, parents, root) כבר עמיד; מה
  שחלש זה החתימות. חתימה היברידית (Ed25519 + ML-DSA-65) על `snapshot.commit`,
  DeviceCert ו-`recovery.guardians` מגינה על כל ההיסטוריה שמתחת לעוגן בעלות
  של עוגן, לא של כל אירוע (חתימת ML-DSA-65 = 3,309 בייט).
- **לפני כל מפתח PQ**: מזהה מכשיר כטביעת אצבע (O-7) — אחרת כל אירוע נושא
  ~2.6KB של מפתח ציבורי; ושדה `cosig` מוגדר (O-8).
- **מי יחתום ראשון**: אפליקציית Tauri (אנדרואיד 17 Keystore, iOS 26 Secure
  Enclave — בחומרה) והשרת כעד. בדפדפן אין עדיין מפתח PQ non-extractable;
  אסור לפתור את זה במפתח בזיכרון JS.
- **שרת**: Vercel על Node 24 (ML-DSA/ML-KEM ב-WebCrypto); ה-VPS
  (`Dockerfile`) ומכונת הפיתוח על 22 — ליישר.

---

_נכתב ביולי 2026 כחלק ממסירת העבודה. הטסטים הם החוזה: אם שינית משהו וכל
הטסטים הקיימים עוברים בלי שריכך אותם — כנראה שאתה בסדר. אם ריככת טסט
כדי שיעבור — עצור וחשוב שוב._
