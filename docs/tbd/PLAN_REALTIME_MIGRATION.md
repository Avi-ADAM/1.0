# תכנית — מיגרציית Real-Time: כל שינוי מגיע לכל מסך שמציג אותו

> **מצב:** תכנון (2026-10-08). קובץ המעקב: [`REALTIME_TRACKING.md`](./REALTIME_TRACKING.md).
> **קשור:** [`SPEC_SOCKET_REALTIME.md`](./SPEC_SOCKET_REALTIME.md) (presence / typing / עריכה
> במקביל — **מחוץ** לתכנית הזאת, ראו R6), [`../inprogress/MIGRATION_TRACKING.md`](../inprogress/MIGRATION_TRACKING.md)
> (כתיבות שעדיין עוקפות את ה-Action System — הן בלתי נראות לסוקט בכלל),
> [`../inprogress/PLAN_TIMEGRAMA.md`](../inprogress/PLAN_TIMEGRAMA.md) (הבשלה בשתיקה רצה מחוץ ל-Action System),
> [`../inprogress/PLAN_SMART_NOTICES.md`](../inprogress/PLAN_SMART_NOTICES.md) (שלב 6: **התוכן** של התראה חיצונית ב-5 שפות — כאן רק **לאן** היא נשלחת, §6).

---

## 1. איך זה עובד היום

```
[דפדפן A] ──/api/action──▶ ActionService.executeAction
                               │ handler / qid
                               ▼
                         NotificationOrchestrator.notify(config.notification)   ← רק אם יש notification
                               │ resolve recipients (projectMembers / specificUsers / …)
                               ▼
                    SocketIOServer.broadcast → POST socket-server/broadcast
                               │ emit('notification', payload) לכל socket של כל נמען
                               ▼
[דפדפן B] socketClient.on('notification')
     ├─ handleUpdateStrategy (גלובלי):  fullRefresh → invalidate(() => true)   ← כל ה-loads בכל דף
     │                                   partialUpdate → invalidate(key)        ← no-op ברוב המקרים
     └─ onNotification listeners (לפי דף/‏store) — מנתבים לפי metadata.type או updateStrategy
```

| רכיב | קובץ |
|---|---|
| שרת הסוקט (standalone) | `socket-server/src/index.ts` — אירועים: `notification`, `space:changed`, `p2p:*`; HTTP: `/broadcast`, `/space-changed` |
| לקוח השרת מצד SvelteKit | `src/lib/server/notifications/SocketIOServer.ts` |
| מי מקבל ומה נשלח | `src/lib/server/notifications/NotificationOrchestrator.ts` |
| לקוח הסוקט בדפדפן | `src/lib/stores/socketClient.ts` (singleton, `CLIENT_ID` לכל טאב) |
| מנוע הרענון של הלב | `src/lib/utils/levSocketHandler.ts` + `levSliceRegistry.ts` / `levSliceLoader.ts` |
| אסטרטגיות "optimistic" | `src/lib/client/updateStrategies.ts` |

**הצימוד המרכזי:** "לרענן מסך של מישהו אחר" קיים רק כתופעת לוואי של *התראה לבני אדם*
(`config.notification` עם ערוץ `socket`). action בלי התראה — לא מזיז שום מסך.

---

## 2. המיפוי — איפה אנחנו עומדים

הספירה נעשתה בזמן ריצה מתוך ה-registry (240 actions רשומים), לא מ-grep. הפירוט המלא,
action-action ודף-דף, נמצא בקובץ המעקב.

### 2.1 Actions — 209 actions כותבים (31 נוספים הם קריאה בלבד: `get*`/`load*`/`ensure*`/…)

| מה קורה אצל **שאר** המשתמשים כשה-action רץ | כמה | % |
|---|---:|---:|
| **שקט** — לא נשלח שום אירוע סוקט | 95 | 45% |
| **toast בלבד** — הודעה קופצת, שום נתון על המסך לא זז | 57 | 27% |
| **toast + מאזין לפי `metadata.type`** (טיימרים, פגישה, הצבעות, צ'אט, פרופיל) | 17 | 8% |
| **`fullRefresh`** — טעינה מלאה של הלב + `invalidate(() => true)` בכל דף | 21 | 10% |
| **ממוקד בלב** — `partialUpdate` / `refetchScope` | 19 | 9% |

כלומר רק כ-**17%** מה-actions (36) מעדכנים משהו באופן ממוקד, ורובם רק בדף הלב.

לפי תחום (live = ממוקד · full · toast · שקט):

| תחום | actions | live | full | toast | שקט |
|---|---:|---:|---:|---:|---:|
| process / planning / assistant | 34 | 0 | 0 | 3 | 28 |
| vote (הצבעות, מועמדות, מו"מ) | 31 | 9 | 4 | 12 | 5 |
| money (sale, haluka, site-share) | 23 | 2 | 0 | 7 | 7 |
| deal (sheirut, offer) | 22 | 2 | 0 | 13 | 5 |
| wish (ratson, proposals) | 21 | 0 | 0 | 8 | 13 |
| chat / forum | 16 | 1 | 0 | 3 | 2 |
| mission / act | 13 | 1 | 0 | 8 | 3 |
| resource | 13 | 1 | 1 | 3 | 8 |
| shift | 11 | 0 | 5 | 0 | 4 |
| user | 11 | 2 | 0 | 1 | 7 |
| stipend | 9 | 0 | 6 | 0 | 1 |
| maagad · project | 8 · 4 | 0 · 0 | 0 · 2 | 3 · 0 | 5 · 2 |
| archive / edit | 7 | 1 | 3 | 0 | 2 |
| meeting · timer | 6 · 5 | 0 · 0 | 0 · 0 | 6 · 5 | 0 · 0 |
| other (`shareRikmaPreview`) | 1 | 0 | 0 | 0 | 1 |

(ב-meeting ו-timer ה-"toast" מטעה: שם המסכים כן מתעדכנים, דרך `metadata.type` — דף הפגישה
ו-`timers.js`.)

### 2.2 דפים — 144 `+page.svelte`, מתוכם 76 מציגים נתונים משותפים שמשתנים

| דרגה | משמעות | כמה |
|---|---|---:|
| 🟢 ממוקד | מעדכן במקום, או קורא מחדש רק את מה שהשתנה | 11 |
| 🟡 גס | מריץ מחדש את כל ה-load של הדף, רק על סוגי אירועים מסוימים | 3 |
| 🟠 עצל | `moachStore.invalidate` רק מסמן את המטמון כישן — הדף **הפתוח** לא משתנה; מתעדכן בכניסה הבאה | 14 |
| ⚪ מקרי | אין מאזין משלו; מתרענן רק אם במקרה מגיע אחד מ-21 ה-`fullRefresh` (שמריץ מחדש **כל** load) | 39 |
| 🔴 חירש | אין מאזין והנתונים נטענים ב-`onMount` — לא יתעדכן עד ניווט | 9 |
| — | שיווק / auth / onboarding / טפסים / דפי בדיקה | 68 |

הדפים ה-🟢: `/lev`, `/timers`, `/forum`, `/forum/[forumId]`, `/meeting/[id]`, `/me`,
`moach/[pid]/votes`, `votes/[kind]/[id]`, `votes/[voteId]`, ו-`moach/[pid]/progress` + `progress/[missionId]`
(אלה האחרונים — לטיימרים בלבד).

### 2.3 באגים ופערים שנמצאו במיפוי

| # | מה | השפעה |
|---|---|---|
| B1 | `NotificationOrchestrator` שולח `updateStrategy: actionResult?.updateStrategy` — **רק** מה שה-handler החזיר. `config.updateStrategy` (הסטטי) לא מגיע לנמענים. 18 actions שולחים סוקט עם אסטרטגיה סטטית שנבלעת, ביניהם `updateTask` (ההערה שם אומרת "handled by levSocketHandler" — בפועל לא), `timerStart/Stop/Save`, `sendAskMessage`, `approve/rejectSheirutpend`, `closeFiniapruval`, `createTosplit`. | המשימה שחבר עדכן לא זזה בלב של האחרים |
| B2 | `fullRefresh` ב-`socketClient` עושה `invalidate(() => true)` — מריץ מחדש **כל** load בדף שבו הנמען נמצא, לכל action מתוך 21, גם כשהדף לא קשור. בדף הלב זה כפול: גם `initializeLevData` מלא. | זה ה"טוען את כל הדף" במקרה הרע |
| B3 | `partialUpdate` הגלובלי עושה `invalidate('pends')` וכו'. מזהה בלי `scheme:` מתפרש כ-URL — no-op. רק `app:meProfile` עובד בפועל. | קוד שנראה כאילו עובד |
| B4 | `moachStore.invalidate(pid, type)` רק מוחק timestamp. אף דף פתוח לא מגיב לזה; `type` לרוב איננו section בכלל (`sheirutUpdate`, `ratsonProposal`…) ואז זה no-op מוחלט. | כל דפי הרקמה (kanban, gantt, sales, split…) לא מתעדכנים בזמן אמת |
| B5 | `approveHaluka`: `recipients.type: 'custom'` — ה-orchestrator מחזיר `[]` ל-custom. ייתכן ש-`HalukaNotificationService` מכסה — **לבדוק**. | אישור חלוקה אולי לא מגיע לאף אחד |
| B6 | `updateTask`/`updateTimerState` ב-`updateStrategies.ts` משגרים `window` events (`task-updated`, `timer-updated`) שאין להם אף מאזין. | קוד מת |
| B7 | אין resync אחרי ניתוק: מה שנשלח בזמן שהסוקט נפל — אבד. | מסך ישן אחרי שינה/מעבר רשת |
| B8 | echo של השולח: רק הטיימרים מסננים לפי `originClientId`. בשאר, השולח מקבל את האירוע של עצמו (36 מתוך 79 ה-configs מסננים לפי `excludeSender`, אבל זה מסנן גם את המכשירים האחרים של אותו משתמש). | רענון מיותר מקומית / מכשיר שני לא מתעדכן |
| B9 | כתיבות דרך `/api/send` (qids ישירים) ו-maturations של timegrama לא עוברות ב-Action System — אין להן סוקט בכלל. | הבשלה בשתיקה לא מופיעה אצל אף אחד |
| B10 | `test-socket`, `test-lev-socket`, `test-migration` — דפי בדיקה ציבוריים. | ניקיון |
| B11 | `socketClient.connect()` מפיל ובונה מחדש socket חי; ה-layouts של moach ושל forum קוראים לו בכל כניסה (נמצא במהלך R0). | אירועים אובדים בזמן החיבור מחדש |

---

## 3. היעד — "מה השתנה", לא "איך לרענן"

### 3.1 עיקרון

ה-action מצהיר **מה** השתנה (scopes). כל מסך מצהיר **על מה** הוא מסתכל. המיפוי ביניהם
חי במקום אחד, בלקוח. השרת לא צריך לדעת איזה דף פתוח אצל מי, ו-action לא צריך לדעת
אילו דפים קיימים.

שתי הזרימות מופרדות:

| | התראה (קיים) | invalidation (חדש) |
|---|---|---|
| למי | לבני אדם | למסכים |
| תוכן | כותרת/גוף/‏URL, 5 שפות | `scopes[]` + `actionKey` + `originClientId` |
| ערוצים | socket / email / push / telegram | socket בלבד |
| מתי | כש-`config.notification` מוגדר | **תמיד** כש-action כותב מצליח |

### 3.2 אוצר ה-scopes

`src/lib/realtime/scopes.ts` (טהור, משותף לשרת וללקוח). כל scope הוא `entity:id`,
וכל action ברקמה מוסיף גם `project:<pid>`.

| scope | ישות Strapi | דוגמת action |
|---|---|---|
| `project:<pid>` | project (בסיס, חברים, הגדרות) | `updateProjectDetails` |
| `mission:<id>` | open-mission / mesimabetahalich | `createMission`, `updateMissionStatus` |
| `act:<id>` | mtaha (task) | `updateTask`, `createTask` |
| `resource:<id>` | open-mashaabim / mashabetahalich | `createResource`, `markResourceDone` |
| `product:<id>` | matanot | `approveMatanot` |
| `sale:<id>` | sale | `createSale`, `counterSaleClaim` |
| `split:<id>` | tosplit / haluka | `createTosplit`, `confirmHaluka` |
| `decision:<kind>:<id>` | pendm / pmash / maap / decision / ask / askm / finiapruval | `addVote`, `voteOnPendm` |
| `timer:<uid>` | timer של משתמש | `timerStart` |
| `forum:<id>` | forum | `chat` |
| `meeting:<id>` | pgisha | `startMeeting` |
| `wish:<id>` | ratson (+ proposals) | `counterRatsonProposal` |
| `deal:<id>` | sheirut / sheirutpend / offer | `signDealOffer` |
| `stipend:<id>` · `shift:<id>` · `process:<id>` · `maagad:<id>` | | |
| `user:<uid>` | פרופיל, הצעות לב | `updateUserBasic` |

### 3.3 צד שרת

```ts
// ActionConfig — שדה חדש
realtime?: {
  scopes: (params, result, ctx) => string[];          // מה השתנה
  audience?: 'project' | 'parties' | 'self';          // ברירת מחדל: project אם יש project:<pid>
  partiesFrom?: (params, result) => string[];         // ל-bilateral: saleClaim, deal, wish
};
```

- `ActionService`, אחרי הצלחה ובלי קשר ל-`notification`: `realtimeBroadcaster.publish({ scopes, actionKey, originClientId })`.
  fire-and-forget כמו ההתראות.
- **קהל:** בשלב ראשון — אותם resolvers שכבר יש (`projectMembers` עם המטמון, `specificUsers`),
  כולל השולח עצמו (המכשירים האחרים שלו צריכים את זה; הטאב המקורי מסנן לפי `originClientId`).
- **socket-server:** `/broadcast` מקבל `event` אופציונלי (ברירת מחדל `notification`) ושולח
  `rt:changed`. תואם אחורה; **לפרוס את socket-server לפני האפליקציה.**
- `actionClient` שולח header `x-client-id: CLIENT_ID`; `/api/action` מכניס אותו ל-`ActionContext`.
- `updateStrategy` נשאר **לטאב שהפעיל את ה-action בלבד** (התשובה של `/api/action`). הוא לא
  משודר יותר לאחרים — את זה עושים ה-scopes.

### 3.4 צד לקוח

`src/lib/realtime/bus.svelte.ts` — מאזין יחיד ל-`rt:changed`:

1. מסנן echo (`originClientId === CLIENT_ID`).
2. מאחד scopes בחלון של ~250ms (burst של הצבעות ⇒ רענון אחד).
3. מפיץ לשלושה מתאמים:

| מתאם | למי | איך |
|---|---|---|
| **kit** | כל דף עם `load` | `invalidate('rt:' + scope)`. ה-load מצהיר `depends('rt:project:12', 'rt:wish:7')`. שורה אחת לכל load. |
| **lev** | `/lev`, `/hub` | `scope → slice keys` (טבלה ליד `levSliceRegistry`) ⇒ `loadLevSlice` (מנגנון `refetchScope` שכבר קיים). |
| **moach** | דפי `moach/[pid]/*` שקוראים מ-`moachStore` | `scope → section` (`base` / `missions` / `financials`) ⇒ `moachStore.refresh(pid, section)` — מוחק timestamp **וגם** קורא מחדש אם ה-section מוצג. |

ובנוסף: `useRealtime(scopes, fn)` לקומפוננטות שטוענות ב-`onMount` (כמו `VoteDetail` היום).

4. **resync:** ב-`onReady` אחרי ניתוק — `invalidate` לכל ה-scopes שמישהו רשום אליהם, פעם אחת (B7).

### 3.5 אכיפה — ratchet, כמו ה-ownership guard של `/api/send`

`src/lib/server/actions/realtime.contract.test.ts`:

- כל action **כותב** ב-registry חייב `realtime` **או** להופיע ב-`LEGACY_NO_REALTIME` (רשימה
  שמתחילה ב-209 שמות).
- הבדיקה **נכשלת גם** אם action ברשימה כבר מצהיר `realtime` — כך הרשימה רק מתקצרת, ואי אפשר
  לשכוח לעדכן אותה.
- action חדש בלי `realtime` ⇒ CI אדום. כך המצב לא מתדרדר בזמן שהמיגרציה רצה.
- ה-scopes שחוזרים חייבים להתאים לאוצר (`isKnownScope`).

`npm run check:realtime` (סקריפט קטן): כל `depends('rt:…')` משתמש ב-entity מהאוצר, וכל scope
באוצר נצרך לפחות במקום אחד (אחרת אף מסך לא מקשיב לו).

---

## 4. שלבים

כל שלב קטן מספיק ל-commit אחד (ובהתאם להעדפה — commit אחד בסוף רצף עבודה, כי כל push ל-main
פורס ב-Vercel).

| שלב | מה | תלוי ב |
|---|---|---|
| **R0** | תיקונים בלי ארכיטקטורה חדשה: B1 (מיזוג `config.updateStrategy` ל-payload — 18 actions מתחילים לעבוד מיד), B5 (לבדוק `approveHaluka`), B6/B10 (מחיקת קוד מת ודפי בדיקה), B4 מינימלי (`moachStore.refresh` שקורא מחדש section מוצג). | — |
| **R1** | חוזה: `scopes.ts`, `ActionConfig.realtime`, `realtimeBroadcaster`, `x-client-id`, `event` ב-`/broadcast` (socket-server), ה-ratchet test. אף action עוד לא מצהיר — הכול ב-allowlist. | פריסת socket-server |
| **R2** | לקוח: `bus.svelte.ts`, שלושת המתאמים, `useRealtime`, resync. בדיקות יחידה עם socket מדומה. | R1 |
| **R3** | דפים, גל 1 — שיתופיים ושימושיים: `/lev`, `/hub`, `moach/[pid]/{main,kanban,gantt,acts,progress,sales,split,open,votes}`, `deals/[id]`, `wish/[id]`, `concierge/[id]`, `negotiation/[id]`, `project/[id]`. | R2 |
| **R4** | actions לפי תחום — ובכל קובץ שנפתח גם ההתראות לבני אדם (§6.4), לפי סדר ההשפעה על משתמשים: **vote + archive** (זרימות הסכמה — "שתיקה היא הסכמה" דורשת שכולם יראו את הגרסה העומדת) → **wish + deal** (פינג-פונג מו"מ, QA C-9) → **mission / act / timer** → **money** → **stipend / shift** → **resource / product** → **process / maagad / user**. | R1 (וכדאי R3 לתחום) |
| **R5** | דפים, גל 2 (השאר) + timegrama: maturation בשתיקה מפרסם scopes (B9). ואז **הסרת `invalidate(() => true)`** (B2) ו-`fullRefresh` המשודר. | כל דפי ה-⚪ מכוסים |
| **R6** | ניקוי: ה-patchers של `partialUpdate` ב-`levSocketHandler`, `updateStrategies.ts`, רשימות `VOTE_TYPES` המקומיות, המאזין של `moach/+layout`. `metadata.type` נשאר רק ל-toast ולפגישה. | R5 |
| *(נפרד)* | presence / typing / editing-lock / project rooms — `SPEC_SOCKET_REALTIME.md`. | R6 |

**סדר ההסרה חשוב:** `invalidate(() => true)` הוא היום הדבר **היחיד** שמרענן את 39 דפי ה-⚪.
להסיר אותו רק אחרי שכל דף ⚪ מכוסה ב-`depends('rt:…')` — אחרת דפים שמתעדכנים היום "במקרה"
יפסיקו להתעדכן בכלל.

---

## 5. הגדרת "גמור"

**action:** מצהיר `realtime.scopes`; יצא מ-`LEGACY_NO_REALTIME`; ההתראה שלו (אם יש) מצהירה `intent` שאומת מול §6.2, והקובץ יצא מ-`LEGACY_CHANNEL_LISTS`; בבדיקה ידנית עם שני משתמשי
בדיקה בשני דפדפנים — הפעולה של אחד משנה את המסך הפתוח של השני בלי רענון ובלי טעינת דף מלאה.

**דף:** כל מה שהוא מציג מכוסה ב-`depends('rt:…')` / מתאם lev / מתאם moach / `useRealtime`;
אין לו מאזין `onNotification` משלו; אותה בדיקה בשני דפדפנים עוברת.

השורה בקובץ המעקב מתעדכנת ל-`[x]` עם תאריך ו-commit.

---

## 6. התראות לבני אדם — בודקים בדרך

R4 פותח כמעט כל קובץ ב-`configs/`, ובאותם קבצים יושבות גם ההתראות לבני אדם (socket / push /
telegram / email) — והן לא עקביות. אז כל קובץ שנפתח ל-scopes נבדק גם להתראות, באותו commit.
**ההפרדה מ-§3.1 נשארת:** ה-scopes מזיזים מסכים, ההתראה מדברת לאדם. action יכול לקבל scopes בלי
שום התראה (`intent` `—`), ולהפך.

### 6.1 מה נמצא במיפוי (2026-10-08)

הערוצים נבחרו ביד בכל קובץ (`channels: [...]`, 109 קבצים), ואין כלל שקובע מה מגיע לאן:

- **55 actions שמחכים לתשובה של מישהו לא יוצאים מהאתר במלואם.** כל ההצבעות (`addVote`, `voteOn*`),
  כל המו"מ על מועמדות (`submitNego*`, `counterOnAsk(m)`, `candidateCounter*`), הצעות ארכוב/עריכה,
  מלגה, תביעת מכירה על כסף שמוחזק אצל מישהו אחר, החתימה של הלקוחה על חלק בעסקה (C-19). חלקם
  socket בלבד — מי שלא באתר לא יודע ששעון השתיקה רץ נגדו.
- טלגרם יוצא רק מ-~15 actions; מייל — מתערובת מקרית (צ'אט כן, הצבעה על משימה לא).
- נמען ב-ru/es קיבל את ההודעה בשפת **השולח** (N1); מי שביצע פעולה קיבל פוש/מייל על עצמו (N2).
- הפירוט, action-action (עמודות "ערוצים היום" / "intent יעד") והבאגים N1–N9 — בקובץ המעקב.

### 6.2 הכלל — `intent`, לא ערוצים

config מצהיר **מה ההתראה מבקשת מהקורא**, והערוצים נגזרים במקום אחד —
`src/lib/server/notifications/intent.ts`:

| intent | מה מבקשים מהקורא | ערוצים | דוגמאות |
|---|---|---|---|
| `consent` | מחכים לתשובה שלו — לחתום, לאשר, להציע נגד, לקבל בקשה. כמעט תמיד רץ נגדו שעון שתיקה | socket push telegram email | הצבעה חדשה, הצעה נגדית, תביעת מכירה, שעות לאישור, בקשה לספק |
| `personal` | עליו או אליו, ושום דבר לא מחכה (אושר, שולם, הודעה בצ'אט, מטלה שהוטלה עליו) | socket push telegram | `approveSheirutpend`, `createChatMessage`, `createTask` |
| `outcome` | תוצאה ברמת הרקמה שמשנה אחוזים / כסף / חברות | socket push | הבשלת הצבעה, חבר הצטרף, חלוקה אושרה |
| `ambient` | פעילות ברקמה שהוא חבר בה | socket | טיימר, עדכון סטטוס, תגובה בדיון |

**למה ככה:** שתיקה היא הסכמה — אז מה שמחכה לתשובה חייב להגיע לכל ערוץ שהאדם הגדיר, אחרת
השתיקה שלו היא אי-ידיעה. כל ערוץ מסנן לבד (אין `telegramId` / אין מכשיר / `noMail` ⇒ מדלגים),
אז "ארבעה ערוצים" = "כל מה שהוא הגדיר". מייל הוא הערוץ היחיד שיש לכולם, ולכן הוא שמור ל-`consent`.

`intent` יכול להיות פונקציה של הריצה — הצבעה רגילה `ambient`, הצבעה שהיא הצעה נגדית (מאפסת את
השעון לאחרים) `consent`, הבשלה `outcome`.

### 6.3 מה כבר נבנה (N0, 2026-10-08)

- `intent.ts`: `NotificationIntent`, `CHANNELS_BY_INTENT`, `resolveChannels` (intent גובר על
  `channels`; בלי שניהם — socket בלבד), `recipientTemplateLang` (N1).
- `NotificationConfig.intent` (ב-`types.ts`); `channels` נעשה אופציונלי ומסומן legacy.
- `NotificationOrchestrator`: הערוצים דרך `resolveChannels` — גם לקריאות inline (`notifier.notify`),
  כי כולן עוברות שם. היוזם לא מקבל push / telegram / email על מה שעשה בעצמו (N2), בלי קשר ל-`excludeSender`.
- `channels.contract.test.ts` — ratchet: `LEGACY_CHANNEL_LISTS` (109 קבצים) רק מתקצר. קובץ חדש עם
  `channels: [...]` ⇒ CI אדום; קובץ שעבר ל-`intent` ונשאר ברשימה ⇒ CI אדום.
- `intent.test.ts` — הדרגות, intent כפונקציה, ה-orchestrator לא שולח ליוזם החוצה.

**שום action עוד לא עבר** — ההתנהגות של כל config נשארה כפי שהייתה, חוץ מ-N1 ו-N2.

### 6.4 בכל קובץ שנפתח ב-R4 — צ'קליסט

1. **intent:** להחליף `channels: [...]` ב-`intent` לפי §6.2. לאמת את ההצעה בעמודה "intent יעד" —
   היא נגזרה מהמיפוי, לא מקריאת כל handler. ⚠ = יעלה ערוץ; ✂ = יוריד ערוץ — **לשאול לפני שמורידים**
   (בעיקר מייל בצ'אט, ב-`createTask`, ב-`approveHaluka`, ב-`acceptSheirutQuote`).
2. **נמענים:** בדיוק מי שהתשובה שלו מחכה (ל-bilateral — שני הצדדים, לא כל הרקמה). `specificUsers`
   חייב `userIds` שבאמת נמצאים ב-params / result — אחרת הוא נופל לכל הרקמה בשקט (N4).
3. **`metadata.url`:** deep-link לעמוד שבו עונים (פוש וטלגרם בלעדיו נוחתים ב-`/lev`). נתיב, לא URL מלא.
4. **שקט שלא אמור להיות שקט:** action עם `—` היום ויעד שאינו `—` (`createHaluka`, `logShiftHours`,
   `createResourceBooking`, `createSheirutHaluka`, `declineMissionRequest`, …) — להוסיף התראה.
5. **תוכן:** לא לגעת בתבניות `{he, en}` — זה SMART_NOTICES שלב 6 (`notification.notice`, 5 שפות).
   אם השלב הזה כבר קיים כשהקובץ נפתח — לעבור אליו באותו commit.
6. להוציא את הקובץ מ-`LEGACY_CHANNEL_LISTS` ולעדכן את השורה במעקב (ערוצים היום ← היעד, בלי ⚠).

### 6.5 מחוץ ל-R4

- **N5** — הבשלה בשתיקה (timegrama) לא מודיעה לאף אחד. נכנס ל-R5 יחד עם ה-scopes של timegrama:
  ההבשלה מודיעה לצדדים (`outcome`, ול-bilateral `personal`).
- **N7** — נתיבי ההתראה הישנים (`/api/nutiUser`, `/api/nutifyPm`, `HalukaNotificationService`, …) נמחקים ב-R6.
- **N9** — השתקת רקמה: כשתיבנה, היא חלה על `ambient` / `outcome` / `personal`. השתקת `consent` — הכרעה פתוחה.
