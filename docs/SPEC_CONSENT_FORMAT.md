# מפרט: פורמט הנתונים החתום של שכבת ההסכמה (consent-v1)

> **מעמד**: מסמך נורמטיבי, evergreen. הוא מתאר את מה שהקוד **כבר עושה**
> (ספטמבר–אוקטובר 2026), לא תכנית. כל מה שנחתם, מגובב או מוצפן בשכבה
> המבוזרת — אירועי הסכמה, DeviceCert, מעטפות sealed, state roots — חייב
> להיות ניתן לשחזור **בייט-לבייט** בכל מימוש.
>
> **החוזה הוא ה-vectors**, לא הפרוזה: [`spec/consent-v1/`](../spec/consent-v1/).
> מימוש שעובר את כולם תואם; אם המסמך הזה והקבצים סותרים — הקבצים קובעים,
> והמסמך באג.
>
> **מימוש הייחוס**: TypeScript — `src/lib/crypto/`, `src/lib/consent/`,
> `src/lib/space/`. הוא רץ זהה בדפדפן, ב-Service Worker, ב-Node (שרת) ובתוך
> WebView של Tauri.
>
> **למה המסמך קיים**: כדי שמעבר עתידי של הליבה ל-Rust (WASM בדפדפן ובשרת,
> נייטיב ב-Tauri) יהיה החלפת מימוש ולא פיצול קונצנזוס. ההחלטה והתזמון —
> [HANDOFF_DISTRIBUTED_DB §8](./inprogress/HANDOFF_DISTRIBUTED_DB.md) ו-
> [PLAN_serverless_p2p_data §9](./inprogress/PLAN_serverless_p2p_data.md).

מילות חובה: **חייב** (MUST), **אסור** (MUST NOT), **רצוי** (SHOULD).

---

## 1. קידודים

| מה | קידוד |
|---|---|
| בינארי בשדות (`sig`, `id`, `iv`, `ct`, מפתחות) | **b64url בלי ריפוד** (RFC 4648 §5) |
| מפתח ציבורי של מכשיר (`device`, `devicePubKey`) | b64url של **SPKI DER**. Ed25519 = 44 בייט (`302a300506032b6570032100‖pk`), P-256 = 91 בייט, נקודה לא-דחוסה |
| זמנים (`ts`, `notBefore`, …) | מילישניות מ-Unix epoch, מספר JSON |
| כסף | `{ amount: string, code: string }` — `amount` = מספר שלם של יחידות קטנות (אגורות) כמחרוזת עשרונית. **לעולם לא float** (החלטה D-12, `src/lib/crypto/money.ts`) |
| טקסט | UTF-8 |

**b64url קנוני בלבד.** מפענח מחמיר (כמו `base64` ב-Rust) דוחה ביטים
עודפים שאינם אפס בתו האחרון; `atob` מקבל אותם. מכיוון שמחרוזת ה-`sig`
נכנסת ל-`id`, שתי כתיבות של אותם בייטים = אותה חתימה תחת שני מזהים.
לכן מאמת **חייב** לדחות `sig` כש-`encode(decode(sig)) ≠ sig`
(`bad_sig_encoding`; vector: `signatures.json › non-canonical-sig-encoding`).

## 2. JSON קנוני

RFC 8785 (JCS) **ועוד שלושה כללים שלנו**. קוד: `src/lib/crypto/canonical.ts`.
Vectors: `canonical.json`.

### 2.1 הבסיס (JCS)
- בלי רווחים. מערכים שומרים סדר.
- **מספרים**: כל מספר הוא IEEE-754 double, ומודפס באלגוריתם
  ECMAScript `Number::toString` (`1e+21`, `1e-7`, `0.000001`, `-0` → `0`).
  `NaN`/`Infinity` — שגיאה.
  - ⚠ מימוש שמנתח שלמים במדויק (`serde_json` ל-`u64`) **אינו תואם**:
    `9007199254740993` חייב להפוך ל-`9007199254740992`. ב-Rust: לנתח הכל
    ל-`f64` ולהדפיס עם `ryu-js`.
- **מחרוזות**: נמלטים רק `"` `\` ו-U+0000–U+001F (`\b \t \n \f \r`, אחרת
  `\u00xx` באותיות קטנות). `/`, DEL ו-U+2028 נפלטים כמו שהם.
- **מפתחות** ממוינים לפי **יחידות קוד UTF-16** — לא לפי בייטי UTF-8.
  השניים מתפצלים בתווים אסטרליים מול U+E000–U+FFFF (אימוג'י ממוין *לפני*
  U+E000). ב-Rust: להשוות `a.encode_utf16()` ל-`b.encode_utf16()`, לא
  `BTreeMap<String,_>`.
- ערך `undefined` (ב-JS) — המפתח מושמט.

### 2.2 התוספות שלנו
1. **NFC** — כל מחרוזת וכל מפתח מנורמלים ל-NFC **לפני** פליטה. האירוע
   השמור יכול להכיל טקסט לא-מנורמל (`café`); החתימה, ה-id וה-state
   root רואים את צורת ה-NFC. מימוש חייב לנרמל בעצמו, לא לסמוך על הקלט.
2. **מיון אחרי נרמול**, ו**שני מפתחות שמתמזגים תחת NFC = שגיאה**.
   (עד אוקטובר 2026 המימוש מיין לפני הנרמול; ההבדל קיים רק למפתחות לא-NFC,
   ששום יצרן אצלנו לא פולט — שמות שדות ומזהים הם ASCII.)
3. **surrogate בודד = שגיאה**, במחרוזת ובמפתח. UTF-8 מחמיר לא יכול להחזיק
   אותו, כך שגוף כזה היה ניתן לאימות רק ב-JS.

גוף שנכשל בכללים האלה **אסור** לחתום, ומאמת **חייב** לדחות אותו
(`non_canonical_body`).

## 3. אובייקט חתום

כל אובייקט עם `{ actor, device, sig, id }` — אירוע, DeviceCert, מעטפת
sealed — עובר באותו צינור (`src/lib/crypto/sign.ts`, `verify.ts`):

```
body      = האובייקט בלי id ובלי sig
sig       = Sign(privateKey, canonical(body))            → b64url
id        = b64url(SHA-256(canonical(body ∪ {sig})))      — כלומר האובייקט בלי id
```

| אלגוריתם | חתימה |
|---|---|
| **Ed25519** (ברירת מחדל) | RFC 8032, טהור (בלי prehash), 64 בייט |
| **ECDSA-P256** (גיבוי) | SHA-256, פורמט **IEEE P1363 `r‖s` 64 בייט — לא DER** |

סדר האימות (והסיבה שחוזרת):
1. `device` לא ידוע או מבוטל → `unknown_or_revoked_device`
2. `sig` לא מתפענח או לא קנוני (§1) → `bad_sig_encoding`
3. הגוף לא קנוני (§2.2) → `non_canonical_body`
4. החתימה לא מאומתת → `bad_signature`
5. ה-id לא תואם → `bad_id`

עוגן בלתי-תלוי: `signatures.json › rfc8032` הוא RFC 8032 §7.1 TEST 1 — מוכיח
שמסלול ייבוא המפתח (seed → מפתח ציבורי → חתימה) תקני.

## 4. ConsentEvent

`src/lib/consent/event.ts`. שדות החובה: `v:1, id, actor, device, action,
subject:{type,id}, parents:string[], ts, nonce, sig`. אופציונליים:
`predicate, parentStateRoots, stateRoot, delta, quorum`.

- **כל שדה חדש — אופציונלי, לנצח.** אירוע ישן חייב להישאר תקף.
- `parents` = מזהי אירועים (DAG). זיוף אב משנה את כל צאצאיו.
- מרחב ה-`action` — `ACTIONS` ב-`event.ts`. פעולה לא מוכרת היא **חוקית**
  (נשמרת, מסונכרנת), ראו §6.3.

**DeviceCert** (T7, `src/lib/crypto/deviceCert.ts`): אובייקט חתום עם
`kind:'deviceCert'`, `device = parentDevicePubKey` (המכשיר החותם), `actor =
userId`. נדחה אם חותם על עצמו, אם `actor≠userId`, או מחוץ לחלון התוקף ±5 דק'.

**מעטפת sealed** (S3a, `src/lib/space/e2e/seal.ts`): אובייקט חתום עם
`kind:'sealed'` — §9.

## 5. ייחוס פרויקט

`project(events, projectId)` מתחיל מ-`emptyState(projectId)`. `projectId`
null פירושו "הראשון שנראה" (`project.create`/`project.join` קובעים אותו;
אירועים של פרויקט אחר אחרי זה — no-op).

## 6. Projection — `project(events) → ProjectState`

`src/lib/consent/projection.ts`. פונקציה טהורה. vectors: `events.json`.

### 6.1 סדר (topoSort)
1. הקלט מכיל כל `id` פעם אחת לכל היותר.
2. אב שלא נמצא בקבוצה **מתעלמים ממנו** לצורך הסדר (dangling).
3. Kahn: בכל צעד, מבין המוכנים, הקטן לפי `(ts, id)` — `ts` מספרית, `id`
   ביחידות קוד UTF-16 (`compareIds`; **אסור** `localeCompare`).
4. מעגל (לא אמור לקרות עם מזהי hash) — השאר נדבקים בסוף, ממוינים `(ts, id)`.
5. התוצאה לא תלויה בסדר הקלט (ה-vectors בודקים גם סדר הפוך).

### 6.2 dedupe
מפתח: `` `${actor}|${subject.type}:${subject.id}|${action}|${order}` ``, כש-
`order = predicate.order ?? 0` עובר **ECMAScript ToString**. מכל מפתח נשמר
האירוע עם ה-`ts` הגדול ביותר; בשוויון — הראשון בסדר הטופולוגי. ואז מפעילים
את השורדים בסדר הטופולוגי.
- ⚠ `order: 1` ו-`order: "1"` הם **אותו מפתח** (vector
  `dedupe-tostring-and-dangling`).
- ⚠ `time.tick` של start ושל stop בלי `order` חולקים מפתח — רק המאוחר שורד
  (vector `rikma-lifecycle` s08).

### 6.3 קיפול
`applyEvent`: `reducers[action]` אם קיים, ואז `asOf = max(asOf, ev.ts)` —
**גם לפעולה בלי reducer** (`epoch.rotate`, `epoch.grant`, `vault.*`,
`recovery.*`, ופעולות עתידיות). מימוש שמסנן פעולות לא מוכרות לפני הקיפול
יקבל `asOf` אחר ו-root אחר.

### 6.4 סמנטיקה של JS שה-reducers נשענים עליה
ה-reducers מוגדרים ע"י מימוש הייחוס + ה-vectors. מי שמממש מחדש חייב לשחזר:

| התנהגות | פירוט | vector |
|---|---|---|
| **truthiness** | `Boolean(predicate.what)`: `false, 0, -0, "", null`, חסר → לא; **כל השאר כן — כולל המחרוזת `"false"`** | s07 |
| `typeof x === 'number'` | כולל שברים (`hours: 12.5`) | s04 |
| **`BigInt(string)`** | ECMAScript StringToBigInt: מקצץ רווחים (`" 12050 "` → 12050), `""` → 0, מקבל `0x10`; `"12.5"`/`"1e3"` → שגיאה (הדלתא מדולגת). גודל לא מוגבל | s27 |
| `Map` / `Set` | **סדר הכנסה**; עדכון מפתח קיים שומר מקומו; מחיקה (`member.away` back) מוציאה. ב-Rust: `IndexMap` עם `shift_remove`, **לא** `swap_remove` | — |
| מיון מחרוזות | `Array.prototype.sort()` = יחידות קוד UTF-16 | — |
| חשבון | IEEE-754 double (`timeTick`, סכומי שעות) | s09 |

### 6.5 חסר-ביטחון ידוע
מפתח ה-dedupe מחובר ב-`|` בלי escaping: `actor` שמכיל `|` יכול להתנגש
במפתח של מישהו אחר. כרגע `actor` = userId מספרי, אז זה לא מנוצל — אבל זו
התנהגות קפואה עד bump (O-5).

## 7. State root

`src/lib/consent/stateRoot.ts`, `STATE_ROOT_VERSION = 2`.

```
stateRoot = b64url(SHA-256(canonical(normalizeState(state))))
```

### 7.1 normalizeState (v2)
אובייקט עם `v, projectId, asOf, members, balances, tosplits, rounds, sales,
saleClaims, missions, halukas, decisions, stageVotes, timers, forums,
meetings, away, settings`.
- `Set<string>` → מערך ממוין. `Map<K,V>` → מערך `[K, normalize(V)]` ממוין
  לפי K. `bigint` → מחרוזת עשרונית. `undefined` → מושמט.
- `snapshots` **לא** נכלל (attestation על root לא יכול להיות חלק ממנו).
- הצורה המדויקת של כל ערך: `normalizedState` ב-`events.json`.
- **כל שינוי מבני ⇒ bump ל-`STATE_ROOT_VERSION` + `stateRestore.ts`.**

### 7.2 מה האירוע מתחייב אליו
- `parentStateRoots[i]` = root של הקיפול על **סגור האבות** של `parents[i]`.
- `stateRoot` = root של הקיפול על סגור האבות של כל ה-`parents` + האירוע עצמו.
- (`commitment.ts`; vector: s34 נושא את שניהם, ונבדק במצב strict.)

### 7.3 ⚠ פתוח: אירוע שה-reducer שלו קורא את `ev.id` (O-3)
`tosplit.vote` וכל ההצבעות דרך `stageVote` (וגם `decision.vote` גנרי) כותבות
`eventId: ev.id` לתוך ה-state. אבל `id` הוא hash שכולל את החתימה, שחותמת על
`stateRoot` — **הצבעה לא יכולה להתחייב ל-root של עצמה**. כרגע אף יצרן לא
פולט `stateRoot` על אירוע בודד (רק snapshots, שמוחרגים), כך שזה לא באג פעיל.
לפני שמפעילים התחייבויות על הצבעות צריך להחליט: להוציא את `eventId` מהצורה
המנורמלת (bump ל-v3), או להגדיר שה-root מחושב עם placeholder ל-id של האירוע
עצמו.

## 8. פרוטוקול ה-Space

`src/lib/space/protocol.ts`. `spaceId` תואם `^[A-Za-z0-9:_-]{1,80}$`
(`project:<pid>`, `vault:<pid>`). **heads** = אירועים שאף אירוע בקבוצה לא
מצביע עליהם, ממוינים ביחידות קוד UTF-16 (`expect.heads` ב-vectors).
**diff** = כל מה שמחוץ לסגור האבות של ה-heads של הצד השני, בסדר topoSort.

## 9. הצפנה קבוצתית (S3a)

`src/lib/space/e2e/`. vectors: `e2e.json`.

- **מפתח epoch**: 32 בייט, AES-256-GCM. התחייבות:
  `kc = b64url(SHA-256(UTF-8("freemates-epoch-kc-v1") ‖ key))`.
- **מעטפת sealed**: `ct = AES-GCM(key, iv[12], aad, canonical(innerEvent))`,
  תג 16 בייט מוצמד ל-`ct`.
  `aad = UTF-8(canonical({actor, device, epoch, kind:'sealed', spaceId}))`.
  המעטפת החיצונית היא אובייקט חתום (§3) עם `v:1, kind:'sealed', actor,
  device, spaceId, epoch, iv, ct, ts, nonce`. ה-relay מאמת רק אותה.
- **עטיפת מפתח (KEM)** — ECIES על ECDH P-256 (לא X25519: זה העקום שכל
  WebCrypto מספק):
  `shared = ECDH(eph, recipient)` (256 ביט) →
  `kek = HKDF-SHA256(salt = 32 בייט אפס, info = "freemates-epoch-wrap-v1", 256)` →
  `ct = AES-GCM(kek, iv[12], payload)` בלי AAD. נשלח `{epk: SPKI(eph), iv, ct}`.
  ה-vectors כוללים את `shared` ואת `kek` כדי לאתר פיצול בשלב הנכון.

## 10. ה-vectors

| קובץ | מה |
|---|---|
| `canonical.json` | קלט JSON כטקסט → מחרוזת קנונית + hash; ו-`rejects` |
| `signatures.json` | RFC 8032, מפתחות, אובייקטים תקפים (כולל DeviceCert ו-P-256), אובייקטים פסולים + סיבה |
| `events.json` | שלושה תרחישים: אירועים חתומים → סדר, dedupe, heads, root אחרי כל צעד, state מנורמל, root סופי |
| `e2e.json` | התחייבות מפתח, מעטפת sealed, עטיפת KEM עם ערכי ביניים |

- **גזירת מפתחות**: `seed = SHA-256(UTF-8("1lev1-consent-v1/" + label))` —
  `ed25519/alice`, `p256/dave`, `nonce/…` (16 בייט ראשונים), וכו'. כל מימוש
  יכול לשחזר את המפתחות בעצמו.
- **דטרמיניסטי** פרט לחתימת ה-ECDSA (אקראית ב-WebCrypto) — היא קפואה
  ונבדקת באימות בלבד.
- **`src/lib/consent/vectors/vectors.test.ts`** (חלק מ-`npm test`): (1) בנייה
  מחדש מהקוד משחזרת את הקבצים בדיוק; (2) כל טענה בקבצים מתקיימת דרך נקודות
  הכניסה הציבוריות.
- **יצירה מחדש**: `npm run vectors:consent`. זה **שינוי חוזה** — לבדוק את
  ה-diff. אם `id` או root של קלט קיים זז, השינוי שבר כל חתימה והתחייבות
  שכבר קיימת: מעלים גרסה (`STATE_ROOT_VERSION`, `v` של אירוע) במקום לייצר.
- **מימוש שני** (Rust): קורא את הקבצים, מאמת כל אובייקט, מקפל כל תרחיש
  ומשווה. `steps[i].rootAfter` מאתר את הצעד הראשון שבו נפרדו.

## 11. הנחיות לפורט ל-Rust (לא נורמטיבי)

- JSON: `serde_json` עם המרה ל-`f64` לכל מספר; הדפסת מספרים עם `ryu-js`;
  מיון מפתחות UTF-16; נרמול `unicode-normalization` (NFC).
- קריפטו: `ed25519-dalek`, `p256` (P1363 — `Signature::from_slice`),
  `sha2`, `hkdf`, `aes-gcm`, `base64` (`URL_SAFE_NO_PAD`, מחמיר).
- Maps: `indexmap` עם `shift_remove`.
- **בדפדפן — המפתחות נשארים ב-WebCrypto.** WASM מקבל את הלוגיקה
  (canonical, reducers, root); חתימה ופענוח קוראים ל-WebCrypto דרך
  host imports. מפתח פרטי בזיכרון WASM/JS = נסיגה ממפתח non-extractable.
- **ב-Tauri** — חתימה נייטיבית במפתח מגובה-חומרה (Android Keystore,
  iOS Keychain). Secure Enclave תומך רק ב-P-256 — ולכן ECDSA-P256 הוא
  מסלול ראשון-במעלה, לא רק גיבוי.

## 12. פתוחים

| # | נושא | למה זה חשוב |
|---|---|---|
| O-1 | **קפדנות Ed25519** — מימושים נבדלים במקרי קצה (S לא קנוני, מפתח ציבורי מסדר קטן, R לא קנוני): RFC 8032, `verify_strict` של dalek ו-ZIP-215 לא מסכימים ביניהם, וההתנהגות של WebCrypto בכל דפדפן לא נבדקה כאן | חתימה "מוזרה" שעוברת במימוש אחד בלבד = פיצול. להחליט על כלל אחד ולהוסיף vectors של מקרי קצה |
| O-2 | **ECDSA high-S** — WebCrypto ו-crate `p256` מקבלים את שני ה-S | אותה חתימה בשתי כתיבות = שני ids. להחליט: לדרוש low-S בחתימה (אי אפשר לשלוט בזה ב-WebCrypto) או לנרמל לפני חישוב ה-id |
| O-3 | הצבעה לא יכולה להתחייב ל-root של עצמה | §7.3 |
| O-4 | **אין עדיין vectors ל-quorum** (`quorum.ts`, `policy.ts`) ול-`deltaCheck` | הם חלק מהאימות ב-strict mode |
| O-5 | מפתח dedupe בלי escaping | §6.5 |
| O-6 | `Boolean("false") === true` ב-`what` | לא באג קריפטוגרפי, אבל מפתיע; תיקון = bump |
| O-7 | **`device` = ה-SPKI המלא** בכל אירוע | ב-Ed25519 זה 44 בייט; ב-ML-DSA-65 כ-1,974 בייט (~2.6KB ב-b64url) — בכל אירוע. לפני מפתחות PQ: מזהה מכשיר = `b64url(SHA-256(SPKI))` (43 תווים), המפתח עצמו רק במאגר המפתחות. מאמת מזהה את הצורה לפי האורך, ושתי הצורות תקפות לנצח (§13) |
| O-8 | **אין מקום לחתימה שנייה** על אותו אובייקט | חתימה היברידית (Ed25519 + ML-DSA) דורשת שדה אופציונלי והגדרה מה הוא מכסה ואיך ה-id מחושב (§13.3) |
| O-9 | **ה-KEM של S3 קלאסי בלבד** (ECDH P-256) | "אסוף עכשיו, פענח אחר כך": כל מעטפה sealed נשמרת לנצח במראה. **תנאי לפתיחת שער S3**: KEM היברידי (§13.2) |

## 13. עמידות קוונטית — מסקנות (אוקטובר 2026, לא נורמטיבי עד שייסגרו O-7…O-9)

### 13.1 מה מאוים ומה לא
| רכיב | מול מחשב קוונטי | דחיפות |
|---|---|---|
| SHA-256 (ids, `parents`, state root), AES-256-GCM | עמידים (Grover ⇒ ~128 ביט אפקטיבי) | — |
| **ECDH P-256 ב-KEM** (S3a) | נשבר. מה שמוצפן היום ונשמר — נקרא מחר | **גבוהה, אבל רק מרגע ש-S3 פתוח** — היום אין מעטפות של משתמשים אמיתיים |
| Ed25519 / ECDSA-P256 בחתימות | נשבר קדימה: מי שיחזיק מחשב כזה יגזור מפתח פרטי מהציבורי שבמאגר ויזייף אירועים מתוארכים לאחור | בינונית — "אירוע חתום הוא לנצח" הופך את זה לרלוונטי, אבל אין איום רטרואקטיבי על סודיות |
| TLS לשרת | דפדפנים כבר מנהלים X25519MLKEM768 | לא בקוד שלנו |

### 13.2 KEM היברידי — חובה לפני שער S3
`kek = HKDF-SHA256(ikm = ss_ecdh ‖ ss_mlkem, …)` — מעטפת עטיפה חדשה
(`WrappedKey` גרסה 2: `{v:2, epk, kemCt, iv, ct}`) לצד הקיימת. ML-KEM-768.
מעטפה ישנה (v1) נשארת קריאה לנצח. העטיפה היא לכל epoch ולכל מכשיר — לא
לכל אירוע — כך שה-~1,088 בייט של `kemCt` זניחים.
**פער פלטפורמה**: ML-KEM ב-WebCrypto קיים ב-Node ≥ 24.7 וב-Cloudflare
Workers; בדפדפנים — Chrome דיווח על כוונה לשלב, Safari/Firefox עוד לא.
בלי WebCrypto, מפתח ה-ML-KEM הפרטי חי בזיכרון JS/WASM — זה trade-off
(סודיות-עתיד מול הגנת-מפתח-היום) שדורש החלטה במסגרת שער S3, לא ברירת מחדל.

### 13.3 חתימות — לא על כל אירוע, על נקודות העיגון
ML-DSA-65: מפתח 1,952 בייט, חתימה 3,309 בייט (Ed25519: 32 / 64). חתימת PQ
על כל אירוע מנפחת אותו פי ~10. במקום זה — **חותמים היברידי על העוגנים**,
ושרשרת ה-hash (שכבר עמידה) מגינה על כל מה שמתחתם:
- **snapshot.commit (T10)**: חתימת PQ נוספת על ה-root וה-heads מקפיאה את
  כל ההיסטוריה שלפניו. זיוף עתידי של אירוע ישן לא יתאים ל-root החתום.
- **DeviceCert** ו-**recovery.guardians**: שורשי הזהות, חיים שנים.
- **צורת השדה (הצעה, O-8)**: `cosig?: { device: string, alg: string, sig: string }[]`
  — כל חתימה נוספת חותמת על `canonical(body)` **בלי** `id`, `sig`, `cosig`;
  `sig` הקלאסית חותמת על `body ∪ {cosig}` (כלומר כמו היום: הכל חוץ מ-`id`
  ו-`sig`), ו-`id` על `body ∪ {cosig, sig}` — בדיוק הנוסחה הקיימת של §3.
  כך אירוע ישן (בלי `cosig`) תקף בלי שינוי, והסרת `cosig` שוברת את `sig`.
  **ואחרי מועד מעבר שייקבע**: עוגן (snapshot, DeviceCert, guardians) בלי
  `cosig` נדחה — אחרת מי שישבור את החתימה הקלאסית פשוט יסיר את ה-PQ ויחתום
  מחדש.
**זמינות חותמים**: Node ≥ 24.7 (WebCrypto ML-DSA-44/65/87); אנדרואיד 17
(Keystore, בחומרה); iOS 26 (Secure Enclave — לפי מקורות משניים, לא אומת מול
Apple). בדפדפן — אין עדיין מפתח PQ non-extractable, ולכן **חותמי ה-PQ
הראשונים יהיו אפליקציית Tauri (R1) והשרת** (כעד, לא כסמכות), לא הדפדפן.
**מצב השרת**: Vercel רץ על Node 24 (`engines`), ה-`Dockerfile` של ה-VPS ומכונת
הפיתוח על 22 — צריך ליישר לפני כל vector של ML-DSA.
