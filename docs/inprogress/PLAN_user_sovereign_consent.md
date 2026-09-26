# מודל נתונים ריבוני-משתמש עם הסכמה קריפטוגרפית

## Context — למה זה נבנה

ה-FreeMates/1lev1 מבוסס היום על Strapi מרכזי + JWT: השרת הוא הסמכות היחידה,
וכל "הסכמה" (vote, approve, join) היא רשומה בודדת ב-DB שאי אפשר לאמת מבחוץ.
התוצאה: אין הוכחה קריפטוגרפית שמשתמש באמת הסכים, ערך פרויקט מחושב על נתונים
שהשרת יכול לשנות בלי חתימה, ואין מודל אחיד ל"מי הסכים על מה ומתי".

המטרה: להפוך את **המשתמש למקור האמת**. כל מוטציה משמעותית בפרויקט הופכת
ל**אירוע הסכמה חתום** שנשמר ב-DAG (Merkle-DAG) על המכשיר האישי, ומשוקף לשרת
שמשמש כמראה בלבד. כל צד שלישי יכול לאמת חתימה מקומית מול המפתח הציבורי
המפורסם של המשתמש, ומצב הפרויקט (מי חייב למי, רווחים, חברות) מחושב כ-
**projection טהור** מעל לוג האירועים החתומים — event sourcing.

### החלטות שהמשתמש קיבל
- **טווח**: תשתית רחבה לכל הפעולות (לא רק tosplit). פעולה ראשונה מומלצת:
  tosplit כי כבר יש לה דרישה לפה-אחד.
- **מפתח פרטי**: היברידי — `Ed25519` ב-WebCrypto + IndexedDB (חתימת אירועים),
  Passkey/WebAuthn כשער-משתמש שמשחרר גישה לחתימה (גם UX מוכר וגם דרישת פעולה
  פיזית של בעל המכשיר).
- **התאוששות מאיבוד מכשירים**: החלטה דחויה — Phase 2 יציין placeholder בלבד.

---

## ארכיטקטורה בקצרה

```
 ┌─────────────────────────────────────────────────────────────┐
 │ Device (browser tab)                                        │
 │   UI ──postMessage──► Service Worker (single key owner)     │
 │                          │                                  │
 │                          ├─ IndexedDB: privKey, events,     │
 │                          │              deviceCerts          │
 │                          └─ Passkey gate (user verification)│
 │                          │                                  │
 │                          └──► POST /api/consent/events ─────┼──► Strapi mirror
 │                          ◄──  Socket.io: new event ids      │     (consent-event,
 │                                                             │      user-key)
 └─────────────────────────────────────────────────────────────┘
                  ▲                                  ▲
                  └──── peer verification ───────────┘
              (any client fetches event + actor's pubkey,
               verifies locally — no server trust needed)
```

מצב פרויקט = `project(events)` — פונקציה טהורה שמקפלת את האירועים החתומים
לאובייקט `ProjectState` (חברים, balances, tosplits, halukas). UI הקיים ממשיך
לעבוד כי הוא רק קורא את ה-projection.

---

## מודל האירוע הקנוני

```ts
type ConsentEvent = {
  v: 1;
  id: string;          // b64url(sha256(canonical(bytes without id)))
  actor: string;       // userId
  device: string;      // b64(SPKI) של המכשיר שחתם
  action: string;      // 'tosplit.create' | 'tosplit.vote' | 'haluka.approve' | ...
  subject: { type: string; id: string };
  predicate?: Record<string, unknown>;
  parents: string[];   // קצוות ב-DAG → ערעור הורה פוסל צאצא
  ts: number;
  nonce: string;       // 16B random
  sig: string;         // Ed25519 על canonical(event ללא id/sig)
};
```

`canonicalize` = JCS: keys ממוינים, ללא whitespace, NFC, מספרים דצימליים.
הפסילה של חתימה אחת לא מערערת אחרות — DAG, לא chain.

**מיפוי דוגמא — הצבעה על tosplit**: היום `vots[]` בתוך `tosplit`. במודל החדש:
- היוצר חותם `tosplit.create` עם `subject.id = contentHash(proposal)`,
  `parents = [sale.recorded ids]`, `predicate = { halukas, hervachti }`.
- כל מצביע חותם `tosplit.vote` עם `parents = [tosplit.create id]`,
  `predicate = { what: true|false }`.
- "אישור פה-אחד" = ב-projection יש `tosplit.vote` תקף לכל חבר פעיל
  (חבר = יש לו `project.join` שלא בוטל).

---

## מבנה קבצים חדש

```
src/lib/crypto/
  algorithm.ts          # זיהוי Ed25519/ECDSA-P256 fallback
  canonical.ts          # JCS-style deterministic JSON
  b64.ts                # b64url helpers
  keystore.ts           # עטיפת IndexedDB ל-CryptoKey non-extractable
  identity.ts           # ensureIdentity(userId): יצירה/טעינה
  passkey.ts            # WebAuthn gate שמתיר חתימה לסשן קצוב
  sign.ts               # signEvent, signDeviceCert
  verify.ts             # verifyEvent + chain walk של DeviceCert

src/lib/consent/
  event.ts              # types + constants של action namespace
  store.svelte.ts       # $state-backed event log (מ-IndexedDB)
  ingest.ts             # verify + dedupe + append
  sync.ts               # pull diff מהמראה / push pending
  devicePairing.ts      # QR pair flow
  projection.ts         # פונקציה טהורה events → ProjectState
  reducers/
    index.ts            # dispatch table לפי action
    tosplitCreate.ts
    tosplitVote.ts
    halukaApprove.ts
    projectJoin.ts
    deviceCert.ts

src/lib/components/consent/
  PairDeviceQr.svelte
  ScanPairQr.svelte
  ConsentBadge.svelte   # תווית "מאומת" ליד הצבעה
  DevicesPanel.svelte

src/routes/api/consent/
  events/+server.ts             # POST שיקוף, GET לפי subject
  events/[id]/+server.ts        # GET אירוע בודד
  keys/register/+server.ts      # POST מפתח ציבורי + DeviceCert
  keys/[userId]/+server.ts      # GET מפתחות פעילים
  devices/cert/+server.ts       # POST cert מ-pairing

src/routes/(reg)/me/devices/+page.svelte
```

קבצים קיימים לעריכה:
- `src/service-worker.js` — להוסיף message handler `consent.sign` + `sync` tag.
- `src/lib/server/actions/configs/createTosplit.ts` — `signedEvents` param,
  אימות צד-שרת, שיקוף ל-`consent-event`.
- `src/lib/server/actions/configs/addVote.ts` — ענף `type:'tosplit'`
  שדורש `signedEvent` תקף.
- `src/routes/(reg)/moach/[projectId]/split/+page.svelte` — `ConsentBadge` +
  קריאה מ-projection במקום מ-denormalized.
- `src/lib/stores/moachStore.svelte.js` — להחזיק `ProjectState` במקביל,
  invalidate על אירוע חדש מ-socket.
- `src/lib/components/prPr/hachcal.svelte` ו-`src/lib/components/lev/halukaask.svelte`
  — לחתום לפני `sendToSer`.

תלות חדשה: שום ספרייה חיצונית — WebCrypto + WebAuthn מובנים.
(לצד-שרת ב-Node 22: `node:crypto.webcrypto` תומך ב-Ed25519 מאז 21.7.)

---

## Service Worker — בעלים יחיד של המפתח

ה-SW נבחר כי:
1. תהליך יחיד שמחזיק את ה-`CryptoKey` non-extractable (אין race בין טאבים).
2. יכול לחתום ולסנכרן ברקע (`background-sync`) גם כשהטאב סגור.
3. כבר קיים בקוד (`src/service-worker.js`) — מוסיפים handler, לא יוצרים תהליך חדש.

קוד שיתווסף (סכמטי):
```js
self.addEventListener('message', async (ev) => {
  if (ev.data?.type === 'consent.sign') {
    const ok = await ensurePasskeyGate();           // משחרר ל-N דקות
    if (!ok) return ev.ports[0].postMessage({ ok: false, reason: 'gate' });
    const signed = await signEventInSw(ev.data.payload);
    await idbAdd('pendingSync', signed);
    self.registration.sync.register('consent-sync').catch(() => {});
    ev.ports[0].postMessage({ ok: true, event: signed });
  }
});
self.addEventListener('sync', (ev) => {
  if (ev.tag === 'consent-sync') ev.waitUntil(flushPending());
});
```

UI מדבר עם ה-SW דרך `MessageChannel` (לא Broadcast — כדי לקבל reply ממוקד).

---

## Multi-device pairing (Phase 2)

מודל אמון: כל מכשיר מאושר על-ידי `DeviceCert` חתום של מכשיר מאושר קיים.
המכשיר הראשון = trust-on-first-use עם אימות email out-of-band.

```ts
type DeviceCert = {
  v: 1; kind: 'deviceCert';
  userId: string;
  devicePubKey: string;             // b64(SPKI)
  deviceLabel: string;
  capabilities: ('sign' | 'admin')[];
  notBefore: number; notAfter?: number;
  parentDevicePubKey: string;       // החותם
  nonce: string;
  sig: string;
};
```

זרימה: מכשיר חדש מציג QR `{userId, devicePubKey, nonce}` → מכשיר קיים סורק,
משתמש מאשר → חתימה → publish ל-`/api/consent/devices/cert`.

ביטול: כל מכשיר מאושר יכול לחתום `device.revoke` — ה-projection מחשיב מפתח
כפעיל רק אם cert תקף ולא בוטל ב-`ts` של האירוע.

---

## פאזות הטמעה

### Phase 0 — תשתית קריפטו (1 שבוע)
- `src/lib/crypto/*` כולל unit tests (`vitest` + `fast-check` ל-canonical).
- `src/lib/consent/event.ts` + `store.svelte.ts` בסיסי.
- הרחבת `service-worker.js` עם handler חתימה, מאחורי `localStorage.CONSENT_ENABLED`.
- routes שרת: `keys/register`, `keys/[userId]`, `events` (POST+GET).

**Exit**: round-trip sign→verify עובר בטסטים; טאב יכול ליצור זהות ולחתום
אירוע דמה דרך ה-SW.

### Phase 1 — Shadow signing על tosplit (1 שבוע)
- `voteOnTosplit` חותם אירוע במקביל לקריאת `addVote` הקיימת.
- `createTosplit` מצרף `signedEvents` ל-payload; השרת משקף ל-`consent-event`
  אבל לא חוסם.
- `ConsentBadge` ירוק/אפור ב-UI split.
- `projection.ts` רץ במקביל — מתועד discrepancy ל-console.

**Exit**: ≥95% הצבעות חדשות מאומתות; projection תואם.

### Phase 2 — Pairing + ניהול מכשירים (1 שבוע)
- דף `/me/devices` עם QR + רשימת מכשירים.
- `device.revoke` reducer.
- Passkey gate ב-SW (משחרר חתימה לחלון של N דקות).
- placeholder UI להתאוששות (decision נדחה).

**Exit**: בדיקה ידנית — pairing טלפון מלפטופ, חתימה מהטלפון, אימות מדפדפן שלישי.

### Phase 3 — אכיפה ל-tosplit (1 שבוע)
- `createTosplit` ו-`addVote` (ענף tosplit) דוחים בלי signedEvent תקף.
- split page קוראת בלעדית מ-projection. ה-denormalized קאש בלבד.
- tosplits ישנים מסומנים "legacy / לא מאומת".

**Exit**: כל פעילות tosplit חדשה מבוססת קריפטוגרפית.

### Phase 4 — הרחבה לפעולות נוספות
פעולה ל-PR, שבוע shadow לפני אכיפה. סדר מומלץ:
`approveHaluka` → `approveMatanot` → `approveSheirutpend` →
`projectJoin/leave` → `completeMission` → שאר ה-actions בתיקיית configs.

### Phase 5 — verifiability ציבורית (אופציונלי)
`GET /v/:eventId` — דף ללא login שמאמת מול pubkey מפורסם. שימושי למחלוקות.

---

## פונקציות לשימוש חוזר מהקוד הקיים

- `sendToSer` (`src/lib/send/sendToSer.js`) — נשאר נקודת הכניסה לשרת.
  ה-action החדש `consentEvent` יישלח דרכו כדי לקבל בחינם את retry/auth/socket.
- `moachStore` (`src/lib/stores/moachStore.svelte.js`) — דפוס ה-cache עם TTL
  ו-localStorage שיכפול שלו ל-`consentStore` (אבל גיבוי ב-IndexedDB, לא localStorage,
  כי `CryptoKey` לא serializable ל-localStorage).
- מערכת ה-actions ב-`src/lib/server/actions/configs/` — לכל reducer חדש נוסיף
  action config שמשכפל את הפורמט הקיים.
- Socket.io הקיים (broadcast מהשרת) — נוסיף ערוץ `consent:event` עם event-id;
  הלקוח שולף מהמראה.

---

## סיכונים פתוחים

1. **התאוששות מאיבוד כל המכשירים** — נדחה. עד שיוחלט: אם משתמש איבד הכל,
   הוא מאבד יכולת לחתום במקום המזהה הנוכחי; אירועים ישנים שלו נשארים תקפים.
2. **GDPR vs immutable log** — payload רגיש מאוחסן off-event וניתן ל-tombstone;
   האירוע מצביע אל hash.
3. **גידול לוג** — Phase 5: snapshots חתומים על-ידי quorum.
4. **race של חתימות מקבילות** — dedupe לפי `(actor, subject, action, order)`;
   שניהם נשמרים לאודיט, last-by-ts wins.

---

## תכנית אימות

### Unit (Vitest)
- `canonical.test.ts` — fast-check: `canonical(parse(canonical(x))) === canonical(x)`.
- `sign.test.ts` — round-trip Ed25519 + fallback; tamper נכשל; מפתח לא נכון נכשל.
- `projection.test.ts` — סדר אקראי של אירועים בעלי DAG זהה → אותו state
  (commutativity תחת topo-sort).
- `devicePairing.test.ts` — cert מבוטל פוסל אירועים בעלי `ts > revokedAt`.

### Integration
- `routes/api/consent/events/+server.test.ts` — POST עם stub pubkey resolver;
  signature מזויפת → 400.
- `createTosplit.integration.test.ts` — happy path: bootstrap → sign → create →
  שתי זהויות מצביעות → projection מציג אישור.

### Manual (browser, end-to-end)
שני דפדפנים על `/moach/<id>/split`:
1. Chrome יוצר tosplit, חותם create + vote. devtools → IndexedDB יראה אירועים.
2. Firefox טוען — `ConsentBadge` מאמת. חותם vote משלו.
3. Reload Chrome — projection מראה אישור פה-אחד.
4. Offline test: לכבות רשת ב-Firefox, להצביע, לראות SW מצטבר ב-`pendingSync`,
   להחזיר רשת, לראות sync.
5. Pairing test: לזווג טלפון, להצביע ממנו, לאמת מדפדפן שלישי.
