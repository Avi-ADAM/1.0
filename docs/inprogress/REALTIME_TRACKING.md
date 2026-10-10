# מעקב — מיגרציית Real-Time

> התכנית: [`PLAN_REALTIME_MIGRATION.md`](./PLAN_REALTIME_MIGRATION.md).
> **עדכנו את הקובץ הזה בכל commit של המיגרציה:** `[ ]` → `[x] YYYY-MM-DD <sha>`, ומלאו את
> עמודת ה-scopes. המונים למעלה מתעדכנים ידנית; מ-R1 והלאה ה-ratchet test
> (`LEGACY_NO_REALTIME`) הוא מקור האמת לצד ה-actions, והקובץ הזה הוא התצוגה האנושית שלו.
>
> מיפוי מצב-פתיחה: 2026-10-08, סריקה בזמן ריצה של ה-registry (240 actions) + קריאת כל מאזיני
> הסוקט בצד הלקוח. סיווג הדפים נעשה בקריאה סטטית — בשלב R3/R5 לאמת כל דף בשני דפדפנים.

## מונים

| | פתיחה (2026-10-08) | עכשיו |
|---|---:|---:|
| actions כותבים | 209 | 209 |
| … מצהירים `realtime.scopes` (`LEGACY_NO_REALTIME` ב-`realtime.contract.test.ts`) | 0 | 1 |
| … שקטים לגמרי (אין אירוע סוקט) | 95 | 95 |
| … `fullRefresh` משודר | 21 | 21 |
| דפים שמציגים נתונים משותפים | 76 | 76 |
| … 🟢 ממוקד | 11 | 16 |
| … ⚪ / 🔴 / 🟠 (לא מתעדכנים בזמן אמת) | 62 | 57 |
| `invalidate(() => true)` בלקוח | קיים | קיים |
| **התראות לבני אדם** (§6 בתכנית) | | |
| actions שהערוצים שלהם חסרים מול ה-intent היעד (⚠) | 106 | 62 |
| … מתוכם `consent` — מחכים לתשובה של מישהו, וזה לא יוצא מהאתר | 55 | 27 |
| … טלגרם חסר | 86 | 47 |
| actions ששולחים יותר מהיעד (✂ — מייל נשאר למי שאין ערוץ אחר) | 10 | 5 |
| קבצים שבוחרים ערוצים ביד (`LEGACY_CHANNEL_LISTS`) | 109 | 54 |
| actions שעברו ל-`intent` | 0 | 54 |

## שלבים

| שלב | סטטוס |
|---|---|
| R0 — תיקוני B1, B4, B5, B6, B10, B11 | [x] 2026-10-08 — קוד ובדיקות יחידה; הבדיקה הידנית בשני דפדפנים עוד פתוחה |
| N1-ask — משפחת ה-ask (בקשות הצטרפות, מועמדות, מו"מ עליה, ההכרעה) עברה ל-`intent` + מייל כגיבוי (N10) | [x] 2026-10-08 — 17 actions + `deal/offerDeal` (חתימת הלקוחה, C-19) + `wish/volunteerProposal`; ה-scopes שלהם עוד ב-R4 |
| N1-vote — הצבעות, מו"מ על הצעות, ארכוב/עריכה, כתובת/מראה הרקמה עברו ל-`intent`; `voteIntent` (consent כשסבב **נפתח**, לא על כל חתימה) | [x] 2026-10-08 — 14 actions + `createSheirutFromPending` (helper); ה-scopes שלהם עוד ב-R4 |
| N1-wish+deal — wish (הצעות, מו"מ, השמה, הזמנות) ו-deal (בקשות מוצר, מחיר, עסקה, תשלום) עברו ל-`intent` | [x] 2026-10-08 — 24 actions + `sheirut/dealEdit`; `createSheirutHaluka` ו-`confirmSheirutHaluka` קיבלו התראה (לא הייתה) |
| N0 — `intent` → ערוצים (`notifications/intent.ts`), ה-ratchet `channels.contract.test.ts`, N1, N2 | [x] 2026-10-08 — קוד ובדיקות יחידה; אף action עוד לא עבר ל-`intent` |
| R1 — חוזה (scopes, `ActionConfig.realtime`, broadcaster, `x-client-id`, socket-server `event`, ratchet test) | [x] 2026-10-08 — `src/lib/realtime/scopes.ts`, `src/lib/server/realtime/broadcaster.ts`, `ActionService` שלב 5a, `x-client-id` ב-`actionClient` → `ActionContext.clientId`, `socket-server` `event` (`broadcast-event.ts`), `realtime.contract.test.ts` (209 ב-legacy, 31 `READ_ONLY`). אף action עוד לא מצהיר, אז שום דבר לא משודר עדיין. **לפרוס את socket-server לפני ה-action הראשון שמצהיר `realtime`** — שרת ישן יפלוט את השינוי כ-`notification` |
| R2 — bus + מתאמי kit / lev / moach + `useRealtime` + resync | [x] 2026-10-08 — `src/lib/realtime/bus.ts` (factory: echo לפי `originClientId`, חלון 250ms, כל subscriber מקבל רק את השינויים שלו אחד-אחד, resync אחרי חיבור **חוזר** בלבד), `bus.svelte.ts` (`realtimeBus` + `useRealtime`), `routing.ts` (scope → `depends` / slices של הלב / sections של moach), `adapters/lev.ts` + `adapters/moach.ts`. מחובר: ה-layout הראשי (`start`), `/lev`, `moach/[pid]/+layout`. `depends.contract.test.ts` — כל `depends('rt:…')` / `rtKey` / `useRealtime` בקוד הוא pattern שה-bus יודע להתאים. המאזינים הישנים נשארים עד R6 |
| socket-server — בקשת polling אחת (`/socket.io/?transport=polling`) הפילה את התהליך (`ERR_HTTP_HEADERS_SENT`): ה-handler של ה-HTTP נרשם אחרי socket.io וענה 404 על הנתיב שלו | [x] 2026-10-09 — `socket-server/src/socket-path.ts` + בדיקה; נפרס, 3 בקשות polling בפרודקשן = 200 בלי restart. `deploy-socket.ps1` מוודא את הקובץ בכל פריסה |
| socket-server — `event` / `rt:changed` בפרודקשן | [x] 2026-10-09 — `deploy-socket.ps1` (פריסה ראשונה מעץ העבודה, `7049d4e3-dirty`); `/health` ציבורי תקין, `/broadcast` בלי סוד 401, `:rollback` שמור |
| R3 — דפים, גל 1 | [~] 2026-10-10 — כל הדפים מחוברים חוץ מ-`negotiation/[id]` (נדחה); 12 נבדקו חי בהזרקה ל-bus. פתוח: `/lev`, `VoteDetail`, deals/wish/concierge בשני דפדפנים — כשה-actions שלהם יפרסמו (R4). המאזינים הישנים נשארים עד R6 |
| R4 — actions לפי תחום | [ ] — פיילוט `updateMissionStatus` **נבדק בשני דפדפנים 2026-10-10** (256 → 258, רקמה 87, משימה 191): `rt:changed` הגיע ל-258 עם `project:87`, `mission:191` ו-`originClientId` של הטאב השני; ה-bus מסר אחרי ~0.5ש׳; מתאם moach שלח **בקשה אחת** (`getProjectMissions` של 87), בלי טעינת דף; שינוי שאף מסך לא מקשיב לו — אפס בקשות; ההד של הטאב המקורי מסונן. הבדיקה מצאה באג: `/api/action` בנה `ActionService` משלו בלי broadcaster — אף פעולה מהדפדפן לא פרסמה. תוקן (`realtimeFor(notifier)` משותף ל-`/api/action` ול-`actions/index.ts`) |
| R5 — דפים, גל 2 + timegrama + הסרת `invalidate(() => true)` | [ ] |
| R6 — ניקוי מאזינים ישנים | [ ] |

### באגים מהמיפוי

| # | | סטטוס |
|---|---|---|
| B1 | `config.updateStrategy` לא משודר לנמענים (18 actions, מסומנים ⚠cfgUS lost למטה) | [x] 2026-10-08 — `withUpdateStrategy` ב-`ActionService` מעביר ל-notifier את מה שהיוזם מקבל. 5 configs שהיו דוחפים נתון גולמי ל-stores של הלב עברו ל-`refetchScope`: `createTosplit` (`halukas`), `create/approve/rejectSheirutpend` (`sheirutpends`), `closeFiniapruval` (`fiapp`, `mtaha`). `updateTask` מתחיל לעדכן משימה קיימת בלב של כולם. ה-registry מקבל עכשיו `refetchScope` גם ב-config. |
| B2 | `fullRefresh` ⇒ `invalidate(() => true)` בכל דף (להסיר רק ב-R5) | [ ] |
| B3 | `partialUpdate` ⇒ `invalidate('pends')` — no-op | [ ] |
| B4 | `moachStore.invalidate` עצל — הדף הפתוח לא מתעדכן | [x] 2026-10-08 — `moachStore.refresh` קורא מחדש `missions`/`financials` (debounce 300ms) כשהרקמה כבר מחזיקה אותם; `base` דרך `depends(moachBaseKey)` ב-layout load. המיפוי סוג→section ב-`moachRealtime.js` (עם בדיקות). אירוע בלי projectId עדיין רק מסמן stale. |
| B5 | `approveHaluka` עם `recipients: custom` ⇒ אין נמענים | [x] 2026-10-08 — אומת: `HalukaNotificationService` משמש רק את `/api/approveHaluka` הישן, שאף לקוח לא קורא לו. עכשיו `projectMembers` (socket/email/telegram/push), ו-`refetchScope` על `halukas` עם projectId. ה-endpoint הישן והשירות **נמחקו** (2026-10-08) — ה-endpoint גם אישר כל tosplit/haluka עם הצבעות שהקורא המציא, בלי בדיקת חברות. |
| B6 | `task-updated` / `timer-updated` בלי מאזינים | [x] 2026-10-08 — כל `updateStrategies.ts` היה מת: הפונקציות שנרשמו לא מוזכרות באף config, ואלה שמוזכרות (`refreshTimers`, `appendVote`, …) לא נרשמו מעולם. נמחק יחד עם הדוגמה והקריאה ב-forum layout. |
| B7 | אין resync אחרי ניתוק: מה שנשלח בזמן שהסוקט נפל — אבד. | [x] 2026-10-08 (ל-`rt:changed`) — אחרי חיבור חוזר: כל `depends('rt:…')` רץ שוב, הלב טוען מלא פעם אחת, moach קורא את שלושת ה-sections. התראות `notification` שהוחמצו לא חוזרות — זה לא תפקידן |
| B8 | echo: רק טיימרים מסננים לפי `originClientId` | [~] 2026-10-08 — `rt:changed` מסונן לפי הטאב (`x-client-id`), והמכשירים האחרים של אותו משתמש מקבלים. `notification` עוד לא — R6 |
| B9 | timegrama ו-`/api/send` כותבים בלי סוקט | [ ] |
| B10 | דפי בדיקה ציבוריים: `test-socket`, `test-lev-socket`, `test-migration` | [x] 2026-10-08 — נמחקו |
| B11 | `socketClient.connect()` מפיל ובונה מחדש socket חי; ה-layouts של moach ושל forum קוראים לו בכל כניסה ⇒ אירועים אובדים בזמן החיבור מחדש | [x] 2026-10-08 — אותו משתמש עם socket מחובר/פעיל ⇒ no-op (בדיקה ב-`socketClient.test.ts`) |

### התראות לבני אדם — באגים מהמיפוי

מיפוי 2026-10-08: הערוצים של כל action נקראו מה-registry בזמן ריצה (`config.notification`), ובקריאות
inline מהקובץ עצמו ומה-helpers (`deal/offerDeal.ts`, `sheirut/dealEdit.ts`, `wish/volunteerProposal.ts`).

| # | | סטטוס |
|---|---|---|
| N1 | נמען ב-ru/es מקבל פוש/טלגרם/מייל בשפת **השולח** (`selectLanguage` נפל ל-`context.lang`, ומשם לעברית) | [x] 2026-10-08 — `recipientTemplateLang`: השפה של הנמען; בלי תבנית לשפה שלו ⇒ אנגלית. שלושת השירותים + בדיקות. |
| N2 | מי שביצע את הפעולה מקבל פוש/טלגרם/מייל על עצמו בכל config בלי `excludeSender` (`addVote`, `timerSave`, `voteOn*`, `applyToMission`, …) | [x] 2026-10-08 — ה-orchestrator מסנן את היוזם מהערוצים החיצוניים תמיד; ה-socket לא השתנה (B8 / R1 מטפלים בו). |
| N3 | הערוצים נבחרים ביד בכל קובץ ⇒ 55 בקשות `consent` לא יוצאות מהאתר במלואן: `addVote` / `voteOn*` / `submitNego*` / `proposeRikmaIdentity` — socket בלבד; `counterOnAsk(m)`, `proposeObjectArchive`, `proposeStipend*`, `createSale` (תביעה על כסף של מישהו אחר), חתימת הלקוחה בעסקה (C-19) — בלי טלגרם ומייל. שתיקה של מי שלא שמע היא לא הסכמה. | [ ] R4, action אחרי action |
| N4 | `specificUsers` בלי `userIds` (ריק / לא נמצא ב-result) נופל ל**כל חברי הרקמה** — הרחבה שקטה. עם `consent` זה מייל לכל הרקמה. | [~] 2026-10-08 — רשימה **ריקה** (`[]`) היא "אף אחד" (בדיקה ב-`intent.test.ts`). רשימה **חסרה** עדיין נופלת לרקמה — `acceptRatsonProposal` נשען על זה, וגם `approve/rejectSheirutpend` (N13). בסוף R4 — להסיר |
| N5 | הבשלה בשתיקה (timegrama) לא מודיעה לאף אחד — הצד השני של B9 | [ ] R5, יחד עם ה-scopes של timegrama |
| N6 | התבניות הן `{he, en, ar}` בלבד ⇒ ru/es קוראים אנגלית (N1). התיקון המלא הוא `notification.notice` של [`PLAN_SMART_NOTICES`](../inprogress/PLAN_SMART_NOTICES.md) שלב 6 — **לא** להוסיף es/ru ידנית ל-140 תבניות | [ ] SMART_NOTICES שלב 6 |
| N7 | נתיבי התראה ישנים: `/api/nutiUser`, `/api/nutifyPm`, `nutifyUser.svelte`, `pusherer.svelte`, `bolkMail.svelte` (`HalukaNotificationService` נמחק 2026-10-08, ראו B5) — כמעט מתים (רק `timegrama/stipendPayment.svelte` קורא ל-`nutiUser`) | [ ] R6 |
| N8 | `declineMissionRequest` / `declineAskmRequest` הם וטו ("אין לא מוחלט") ושקטים — המבקש לא שומע כלום. היעד `personal` רק מבטיח שישמע; להפוך אותם להצעה נגדית/הסתרה — תכנית נפרדת | [ ] |
| N11 | בקשת שירות שכל החברים אישרו (`addVote` → `createSheirutFromPending`) — **הלקוחה לא שמעה כלום**: ה-handler רץ ישירות, לא דרך `ActionService`, אז ה-notification שלו לא נשלח מעולם. אותו דבר ב-`materializeWish` | [x] 2026-10-08 ב-`addVote` (`personal` ללקוחה כשהיא לא חברה ברקמה). `materializeWish` — עם משפחת ה-wish |
| N12 | `proposeObjectArchive` עם `alsoProposeArchive` פותח הצעת ארכוב שנייה בשקט; `proposeObjectEdit` והצבעות archive/stipend עם רשימת נמענים ריקה נופלים לכל הרקמה (N4) | [x] 2026-10-08 — ההצעה הנוספת מודיעה (`consent`), ורשימה ריקה לא נשלחת |
| N13 | `approveSheirutpend` / `rejectSheirutpend`: `userIdsParam: 'requesterId'` שאף לקוח לא שולח, וה-mutation `73updateSheirutpend` מחזיר רק `id` ⇒ ההודעה "בקשתך אושרה/נדחתה" הולכת **לחברי הרקמה**, לא למבקש. בנוסף `rejectSheirutpend` שולח `{id, projectId}` ל-mutation שדורש `$data` — כנראה נכשל תמיד; וזה וטו ("אין לא מוחלט") | [ ] תכנית נפרדת — handler שקורא את המבקש, והחלפת הדחייה בהסתרה/הצעה נגדית |
| N14 | `createSheirutHaluka`: הלקוחה מדווחת "העברתי", וההעברה נסגרת **רק** במילה של המקבל — אבל המקבל לא שמע על זה | [x] 2026-10-08 — `consent` למקבל; `confirmSheirutHaluka` מודיע לשולח שהתקבל (`personal`) |
| N10 | מי שאין לו פוש ולא טלגרם לא שמע כלום על כל מה שאינו `consent` | [x] 2026-10-08 — `emailRecipients`: `personal` / `outcome` (וגם רשימות legacy עם push/telegram בלי email) שולחים מייל למי שההתראה לא מגיעה אליו בערוץ אחר. `ambient` נשאר באתר. |
| N9 | `mutedProjects` (SMART_NOTICES) עוד לא נקרא ב-orchestrator. כשייבנה: השתקה מורידה ערוצים חיצוניים ל-`ambient`/`outcome`/`personal`; האם אפשר להשתיק `consent` — הכרעה (שתיקה היא הסכמה אומרת שלא) | [ ] |

---

## דפים

מקרא: 🟢 ממוקד · 🟡 גס (load מלא של הדף, על סוגים מסוימים) · 🟠 עצל (`moachStore`, רק בכניסה
הבאה) · ⚪ מקרי (רק כשמגיע `fullRefresh` כלשהו) · 🔴 חירש (`onMount` בלי מאזין).
"מקור" = מאיפה הדף מקבל נתונים: `load` / `store` / `onMount`.

### גל 1 (R3)

| דף | מקור | היום | איך מגיב היום | scopes יעד | סטטוס |
|---|---|---|---|---|---|
| `/lev` | store | 🟢 | `levSocketHandler`: partial/refetch ממוקד; `fullRefresh` ⇒ `initializeLevData` מלא; טיימרים; צ'אט | `project:*`, `decision:*`, `mission:*`, `act:*`, `split:*`, `deal:*`, `wish:*`, `user:<me>` | [~] מתאם lev מחובר (R2); עוד לא נבדק חי |
| `/hub` | load + lev stores | ⚪ | stores הלב מתעדכנים רק כש-`/lev` פתוח | כמו `/lev` (מתאם lev) | [x] 2026-10-10 — `depends` על `LEV_PATTERNS` + `wish:*` (קהל השינוי הוא חברי הרקמה, אז כל שינוי שמגיע נוגע למשתמש); נבדק חי 2026-10-10 (הזרקה ל-bus בטאב של 258): `wish` ⇒ `__data.json` אחד, `forum` ⇒ כלום |
| `moach/[pid]/main` | layout load | ⚪ | — | `project:<pid>` | [x] 2026-10-10 — `base` דרך `moachBaseKey` (מתאם moach) |
| `moach/[pid]/kanban` | moachStore | 🟢 (R0: section חי) | `moachStore.refresh('missions')` על כל הודעה של הרקמה | `project:<pid>`, `mission:*`, `act:*` → section `missions` | [x] 2026-10-10 — section `missions` (מתאם moach) |
| `moach/[pid]/gantt` | moachStore | 🟢 (R0: section חי) | כנ"ל | כמו kanban | [x] 2026-10-10 — כמו kanban |
| `moach/[pid]/acts` | load + moachStore | 🟠 | stale בלבד | `act:*`, `mission:*` | [x] 2026-10-10 — המטלות נקראות מ-`base`, אז `act` מנותב עכשיו גם ל-`base`; נבדק חי 2026-10-10 (הזרקה ל-bus בטאב של 258): `act` ⇒ layout `__data.json` + `getProjectMissions` |
| `moach/[pid]/acts/[actId]` | moachStore | 🟠 | stale בלבד | `act:<id>` | [x] 2026-10-10 — `useRealtime(act:<id>)` ⇒ `getAct`; נבדק חי 2026-10-10 (הזרקה ל-bus בטאב של 258): מטלה אחרת ⇒ כלום |
| `moach/[pid]/progress` | load + timers store | 🟢 (טיימרים + R0 missions) | `timers.js` לפי `timer*`; `refresh('missions')` | + `mission:*`, `act:*` | [x] 2026-10-10 — קורא `missions` מה-store |
| `moach/[pid]/progress/[missionId]` | load + timers store | 🟢 (טיימרים בלבד) | כנ"ל | + `mission:<id>`, `act:*` | [x] 2026-10-10 — `depends(rt:mission:<id>)`; נבדק חי 2026-10-10 (הזרקה ל-bus בטאב של 258): רק ה-load של הדף (`invalidated=0`), משימה של רקמה אחרת ⇒ כלום |
| `moach/[pid]/open` | load + moachStore | 🟠 | stale בלבד | `mission:*`, `resource:*` (פתוחים) | [x] 2026-10-10 — הלוח קרא מה-load בלבד ולא היה מתעדכן; עכשיו קורא מה-store אחרי שזרע אותו; נבדק חי 2026-10-10 (הזרקה ל-bus בטאב של 258): `mission` ⇒ `getProjectMissions` אחד, רקמה אחרת ⇒ כלום |
| `moach/[pid]/sales` | moachStore | 🟢 (R0: section חי) | `refresh('financials')` רק על הצבעות / `financials` | `sale:*` → section `financials` | [x] 2026-10-10 — section `financials` (מתאם moach) |
| `moach/[pid]/split` | moachStore | 🟢 (R0: section חי) | כנ"ל | `split:*`, `sale:*` → `financials` | [x] 2026-10-10 — כמו sales |
| `moach/[pid]/votes` | onMount | 🟢 | `loadVotes()` על `VOTE_TYPES` | `decision:*` | [x] 2026-10-10 — `useRealtime(project:<pid>)` + `touchesVotes`; נבדק חי 2026-10-10 (הזרקה ל-bus בטאב של 258): הצבעה ⇒ `getProjectVotes` + התג, מכירה ⇒ כלום. המאזין הישן נשאר עד R6 |
| `moach/[pid]/votes/[kind]/[id]` | load + `VoteDetail` | 🟢 | `refetch()` על `VOTE_TYPES` | `decision:<kind>:<id>` | [~] 2026-10-10 — `VoteDetail`: `useRealtime(decision:<kind>:<id>)` (`fini` ⇒ `finiapruval`); לא נבדק חי — צריך הצבעה פתוחה |
| `moach/[pid]/votes/[voteId]` | `VoteDetail` | 🟢 | כנ"ל | `decision:*:<id>` | n/a — פתק הצבעה בודד (`Vote`), לא משתנה |
| `deals/[id]` | load | ⚪ | — | `deal:<id>` | [~] 2026-10-10 — `depends(rt:deal:<id>)`; לא נבדק חי (אותו מנגנון כמו progress/[missionId]) |
| `deals/offers/[id]` | load | ⚪ | — | `deal:<id>` | [~] 2026-10-10 — `depends(rt:deal:<id>)`; לא נבדק חי |
| `wish/[id]` | load | ⚪ | — | `wish:<id>` | [~] 2026-10-10 — `depends(rt:wish:<id>)`; לא נבדק חי |
| `concierge/[id]` | load | ⚪ | — | `wish:<id>` | [~] 2026-10-10 — `depends(rt:wish:<id>)`; לא נבדק חי |
| `negotiation/[id]` | load | ⚪ | — | `decision:*:<id>` / `mission:<id>` | [ ] נדחה — `Negotiation` לא באוצר ה-scopes ונכתב דרך `/api/send`, לא דרך action; צריך קודם entity באוצר וכתיבה דרך action |
| `project/[id]` · `r/[slug]` | load (`RikmaPage`) | 🟡 | `invalidate('project:<id>')` על `VOTE_TYPES` | `project:<pid>` | [x] 2026-10-10 — `loadRikmaPage`: `depends(rt:project:<pid>)`; נבדק חי 2026-10-10 (הזרקה ל-bus בטאב של 258): רקמה 87 ⇒ `__data.json` אחד, רקמה אחרת ⇒ כלום. המאזין הישן נשאר עד R6 |

### גל 2 (R5)

| דף | מקור | היום | scopes יעד | סטטוס |
|---|---|---|---|---|
| `/timers` | timers store | 🟢 | `timer:<me>` | [ ] |
| `/forum` · `/forum/[forumId]` | load | 🟢 | `forum:*` / `forum:<id>` (היום `app:forums`, `app:forum:<id>`) | [ ] |
| `/meeting/[id]` | load + patch | 🟢 | `meeting:<id>` (ה-patch לפי `metadata.type` נשאר) | [ ] |
| `/meeting` | load | ⚪ | `meeting:*`, `user:<me>` | [ ] |
| `/me` | load + userStore | 🟢 | `user:<me>` (היום `app:meProfile`) | [ ] |
| `/me/income` | load | 🟡 | `user:<me>`, `split:*`, `sale:*` | [ ] |
| `/me/offerings` · `/me/resources` · `/me/shifts` | load | ⚪ | `user:<me>`, `product:*` / `resource:*` / `shift:*` | [ ] |
| `/sales-center` · `deals/sales-center` | load | ⚪ | `sale:*`, `deal:*` | [ ] |
| `/deals` · `deals/offers` · `deals/request/[id]` | load | ⚪ | `deal:*` | [ ] |
| `/concierge` | load | ⚪ | `wish:*` | [ ] |
| `/moach` (רשימת הרקמות) | load | ⚪ | `project:*` | [ ] |
| `moach/[pid]/chains` | load + moachStore | 🟢 (R0: section חי) | `mission:*`, `resource:*`, `financials` | [ ] |
| `moach/[pid]/chains/[chainId]` | onMount | 🔴 | `mission:*`, `resource:*` | [ ] |
| `moach/[pid]/processes` | moachStore | 🟠 | `process:*` | [ ] |
| `moach/[pid]/processes/[processId]` | onMount | 🔴 | `process:<id>` | [ ] |
| `moach/[pid]/services` | moachStore | 🟠 | `deal:*` | [ ] |
| `moach/[pid]/sales/[saleId]` | moachStore | 🟠 | `sale:<id>` | [ ] |
| `moach/[pid]/splits/[splitId]` | moachStore | 🟠 | `split:<id>` | [ ] |
| `moach/[pid]/timers` | moachStore | 🟠 | `timer:*` של חברי הרקמה | [ ] |
| `moach/[pid]/create` | moachStore | 🟠 | `project:<pid>` (רשימות הבחירה בטופס) | [ ] |
| `moach/[pid]/stipend` | onMount | 🔴 | `stipend:*` | [ ] |
| `moach/[pid]/object/[type]` · `object/[type]/[id]` | onMount | 🔴 | `mission:<id>` / `resource:<id>` / `product:<id>` | [ ] |
| `moach/[pid]/edit` | onMount | 🔴 | `project:<pid>` (התראת "השתנה בזמן שערכת", לא רענון) | [ ] |
| `moach/[pid]/resources` | load | ⚪ | `resource:*` | [ ] |
| `moach/[pid]/shifts` | load | ⚪ | `shift:*` | [ ] |
| `moach/[pid]/wishes` | load | ⚪ | `wish:*` | [ ] |
| `moach/[pid]/archive` | load | ⚪ | `mission:*`, `resource:*`, `product:*` | [ ] |
| `moach/[pid]/demand` | load | ⚪ | `mission:*`, `resource:*` | [ ] |
| `moach/[pid]/docs` | load | ⚪ | לבדוק: אולי מכוסה כבר ב-`space:changed` (ערוץ נפרד, לא לגעת) | [ ] |
| `moach/[pid]/look` | load | ⚪ | `project:<pid>` | [ ] |
| `/myacts` | onMount | 🔴 | `act:*`, `user:<me>` | [ ] |
| `/myCalander` · `/newTimers` | onMount | 🔴 | `timer:<me>` | [ ] |
| `availableMission` · `availableMission/[id]` | load | ⚪ | `mission:*` / `mission:<id>` | [ ] |
| `availiableResorce` · `availiableResorce/[id]` | load | ⚪ | `resource:*` / `resource:<id>` | [ ] |
| `/demand` | load | ⚪ | `mission:*`, `resource:*` | [ ] |
| `gift` · `gift/[id]` | load | ⚪ | `product:*` / `product:<id>` | [ ] |
| `maagad/[id]` | load | ⚪ | `maagad:<id>` | [ ] |
| `offer/[key]` | load | ⚪ | `deal:*` | [ ] |
| `preview/rikma/[shareKey]` | load | ⚪ | `project:<pid>` | [ ] |
| `/project` · `project/[id]/join` · `project/[id]/support` | load | ⚪ | `project:*` / `project:<pid>` (ל-support יש כבר `depends('project-support:…')` שאף אחד לא מבטל) | [ ] |
| `user/[id]` | load | ⚪ | `user:<id>` | [ ] |

**מחוץ למיגרציה (~68):** שיווק ותוכן (`about`, `why`, `love`, `grow`, `faq`, …), auth
(`login*`, `signup*`, `confirm-email`), onboarding (`onboard/*`), טפסי יצירה (`wish/new`,
`concierge/new`, `deals/offers/new`, `sales/new`, `gift/[id]/edit`), הגדרות אישיות (`me/settings*`,
`me/devices`, `me/identity`), `assistant/continue`, `import/*`, `api`, `code`, `chat`, `quorum`,
`consensus`, דפי בדיקה (`test-*`, `testi`, `searchtest`, `migration-dashboard`).

---

## Actions

מקרא:
- **socket today** — `config` (דרך `config.notification`), `inline` (`notifier.notify` בתוך ה-handler
  או helper), `none`, `read-only`.
- **recipients** — `(−me)` = `excludeSender` (מסנן גם את המכשירים האחרים של השולח).
- **effect for others** — `—` שקט · `toast` בלבד · `full` = `fullRefresh` · `partial(lev)` /
  `refetch(lev)` = ממוקד, בדף הלב בלבד · `⚠cfgUS lost` = יש `config.updateStrategy` שלא מגיע (B1).
- **metadata.type → who reacts** — מי מאזין לסוג הזה היום. `moach(lazy)` = רק מסמן מטמון כישן.
  הסוג נאסף ברמת הקובץ, כך שבקבצים עם כמה actions (`maagad`, `shiftCardActions`, …) הוא עשוי
  להופיע גם ב-action שלא שולח אותו.
- **ערוצים היום** — הערוצים שה-action שולח בהם התראה לבני אדם: `S` socket · `P` push · `T` telegram ·
  `E` email · `—` אין. ⚠ = חסר ערוץ שה-intent היעד דורש. ✂ = שולח מייל לכולם, והיעד שולח מייל רק למי
  שאין לו פוש/טלגרם (N10); ב-`directOffer` הערוצים נאספו ברמת הקובץ, ייתכן שרק `claimDirectOffer` שולח.
- **intent יעד** — `C` consent · `P` personal · `O` outcome · `A` ambient · `—` בלי התראה לבני אדם (רק
  realtime). `A·C·O` = תלוי בריצה: הצבעה רגילה `A`, הצעה נגדית `C`, הבשלה `O` — `intent` כפונקציה.
  `intent ✓` = הקובץ כבר עבר (ההתראה בלבד — ה-scopes שלו עוד ב-R4). הסיווג הוא הצעה מהמיפוי; **לאמת אותו כשעורכים את הקובץ** (§6 בתכנית).
- **status** — `[ ]` / `[x] YYYY-MM-DD <sha>` / `n/a` (קריאה בלבד) / `פטור` (פרטי לגמרי — טיוטה
  של משתמש אחד; מצהיר `audience: 'self'` כדי שהמכשירים האחרים שלו יתעדכנו, או נשאר ב-allowlist
  עם נימוק).

התחומים ממוינים לפי סדר העבודה ב-R4 בתכנית — כאן הם לפי סדר הסריקה.

### process — 34 actions (live 0 · full 0 · toast 3 · silent 28 · read-only 3)

| action | file | socket today | recipients | effect for others | metadata.type → who reacts | ערוצים היום | intent יעד | target scopes | status |
|---|---|---|---|---|---|---|---|---|---|
| `applyAssistantSession` | assistantSessions | none |  | — |  | — | — |  | [ ] |
| `attachEntityToProcess` | attachEntityToProcess | none |  | — |  | — ⚠ | A |  | [ ] |
| `cacheTranslations` | cacheTranslations | none |  | — |  | — | — |  | [ ] |
| `checkRikmaSlug` | checkRikmaSlug | read-only |  |  |  |  |  |  | n/a |
| `claimAssistantSession` | assistantSessions | none |  | — |  | — | — |  | [ ] |
| `claimGithubWork` | githubActions | config | projectMembers (−me) | toast | base → moach(lazy) | SP ⚠ | C |  | [ ] |
| `createPlanBoard` | planningBoards | none |  | — |  | — | — |  | [ ] |
| `createPlanBoardFromItems` | planningRuns | none |  | — |  | — | — |  | [ ] |
| `createPlanBoardFromText` | planningRuns | none |  | — |  | — | — |  | [ ] |
| `createPlanItem` | planningBoards | none |  | — |  | — | — |  | [ ] |
| `createProcess` | createProcess | none |  | — |  | — ⚠ | A |  | [ ] |
| `createSpaceDoc` | spaceDocs | none |  | — |  | — ⚠ | A |  | [ ] |
| `createWeave` | createWeave | none |  | — |  | — | — |  | [ ] |
| `createWorkWay` | createWorkWay | none |  | — |  | — | — |  | [ ] |
| `dismissExternalOffer` | fetchExternalOffers | none |  | — |  | — | — |  | [ ] |
| `expandPlanBoard` | planningRuns | none |  | — |  | — | — |  | [ ] |
| `fetchExternalOffers` | fetchExternalOffers | read-only |  |  |  |  |  |  | n/a |
| `getAssistantSession` | assistantSessions | read-only |  |  |  |  |  |  | n/a |
| `githubIssueClosed` | githubActions | config | specificUsers | toast | base → moach(lazy) | SP ⚠ | P |  | [ ] |
| `githubWorkClaimable` | githubActions | config | specificUsers | toast | base → moach(lazy) | SP ⚠ | P |  | [ ] |
| `importPlanBoardRows` | assistantSessions | none |  | — |  | — | — |  | [ ] |
| `linkGithubAccount` | githubActions | none |  | — | base | — | — |  | [ ] |
| `markPlanItemCreated` | planningBoards | none |  | — |  | — | — |  | [ ] |
| `reviseAssistantSession` | assistantSessions | none |  | — |  | — | — |  | [ ] |
| `seedPlanBoards` | planningRuns | none |  | — |  | — | — |  | [ ] |
| `setAssistantItems` | assistantSessions | none |  | — |  | — | — |  | [ ] |
| `setGithubInstallationStatus` | githubActions | none |  | — | base | — | — |  | [ ] |
| `setSupportPage` | setSupportPage | none |  | — |  | — ⚠ | A |  | [ ] |
| `startAssistantSession` | assistantSessions | none |  | — |  | — | — |  | [ ] |
| `undoAssistantRevision` | assistantSessions | none |  | — |  | — | — |  | [ ] |
| `unlinkGithubAccount` | githubActions | none |  | — | base | — | — |  | [ ] |
| `updatePlanBoard` | planningBoards | none |  | — |  | — | — |  | [ ] |
| `updatePlanItem` | planningBoards | none |  | — |  | — | — |  | [ ] |
| `updateSpaceDoc` | spaceDocs | none |  | — |  | — | — |  | [ ] |

### timer — 5 actions (live 0 · full 0 · toast 5 · silent 0 · read-only 0)

| action | file | socket today | recipients | effect for others | metadata.type → who reacts | ערוצים היום | intent יעד | target scopes | status |
|---|---|---|---|---|---|---|---|---|---|
| `timerLogUpdate` | timerLogUpdate | config | specificUsers | toast ⚠cfgUS lost | timerEdit → timers-store | S | A |  | [ ] |
| `timerSave` | timerSave | config | projectMembers | toast ⚠cfgUS lost | timerUpdate → timers-store | SP ⚠ | C |  | [ ] |
| `timerStart` | timerStart | config | specificUsers | toast ⚠cfgUS lost | timerUpdate → timers-store | S | — |  | [ ] |
| `timerStop` | timerStop | config | specificUsers | toast ⚠cfgUS lost | timerUpdate → timers-store | S | — |  | [ ] |
| `updateMissionTimerState` | updateMissionTimerState | config | projectMembers (−me) | toast | timerState → timers-store | S | A |  | [ ] |

### meeting — 6 actions (live 0 · full 0 · toast 6 · silent 0 · read-only 0)

| action | file | socket today | recipients | effect for others | metadata.type → who reacts | ערוצים היום | intent יעד | target scopes | status |
|---|---|---|---|---|---|---|---|---|---|
| `approveMeeting` | approveMeeting | inline |  | toast ⚠cfgUS lost | meetingUpdate → meeting-page<br>meetingConfirmed → meeting-page | SPE ⚠ | P |  | [ ] |
| `createNewMeeting` | createNewMeeting | inline |  | toast ⚠cfgUS lost | meeting → meeting-page | SPTE | C |  | [ ] |
| `joinMeeting` | joinMeeting | inline |  | toast ⚠cfgUS lost | participantReady → meeting-page<br>meetingStarted → meeting-page | SPE ⚠ | P |  | [ ] |
| `sendMeetingMessage` | sendMeetingMessage | config | meetingParticipants (−me) | toast ⚠cfgUS lost | meetingMessage → meeting-page | S | A |  | [ ] |
| `startMeeting` | startMeeting | inline |  | toast ⚠cfgUS lost | meetingJoinRequest → meeting-page<br>meetingStarted → meeting-page | SPE ⚠ | P |  | [ ] |
| `toggleOnline` | toggleOnline | inline |  | toast ⚠cfgUS lost | userAvailability → meeting-page<br>meetingReady → meeting-page | SP ⚠ | P |  | [ ] |

### chat — 16 actions (live 1 · full 0 · toast 3 · silent 2 · read-only 10)

| action | file | socket today | recipients | effect for others | metadata.type → who reacts | ערוצים היום | intent יעד | target scopes | status |
|---|---|---|---|---|---|---|---|---|---|
| `addAskChatEntry` | addAskChatEntry | none |  | — |  | — ⚠ | P |  | [ ] |
| `addAskmChatEntry` | addAskmChatEntry | none |  | — |  | — ⚠ | P |  | [ ] |
| `addDiunEntry` | addDiunEntry | config | projectMembers (−me) | toast | diunEntry → moach(lazy) | S | A |  | [ ] |
| `addHalukaChatEntry` | addHalukaChatEntry | config | projectMembers (−me) | toast | halukaChatEntry → moach(lazy) | S | A |  | [ ] |
| `createChatMessage` | chat | config | specificUsers (−me) | partial(lev) | chatMessage → forum+chat-store | SPTE ✂ | P |  | [ ] |
| `ensureHalukaForum` | ensureHalukaForum | read-only |  |  |  |  |  |  | n/a |
| `ensureProcessForum` | ensureProcessForum | read-only |  |  |  |  |  |  | n/a |
| `ensureProjectForum` | ensureProjectForum | read-only |  |  |  |  |  |  | n/a |
| `ensureRatsonProposalForum` | ensureRatsonProposalForum | read-only |  |  |  |  |  |  | n/a |
| `ensureSheirutForum` | ensureSheirutForum | read-only |  |  |  |  |  |  | n/a |
| `ensureSheirutpendForum` | ensureSheirutpendForum | read-only |  |  |  |  |  |  | n/a |
| `ensureStageForum` | ensureStageForum | read-only |  |  |  |  |  |  | n/a |
| `ensureVoteForum` | ensureVoteForum | read-only |  |  |  |  |  |  | n/a |
| `getForumThread` | forum | read-only |  |  |  |  |  |  | n/a |
| `getUserForums` | forum | read-only |  |  |  |  |  |  | n/a |
| `sendAskMessage` | sendAskMessage | config | askParticipants (−me) | toast ⚠cfgUS lost | askMessage → header-chat | intent ✓ | P |  | [ ] |

### wish — 21 actions (live 0 · full 0 · toast 8 · silent 13 · read-only 0)

| action | file | socket today | recipients | effect for others | metadata.type → who reacts | ערוצים היום | intent יעד | target scopes | status |
|---|---|---|---|---|---|---|---|---|---|
| `acceptRatsonProposal` | acceptRatsonProposal | config | specificUsers (−me) | toast | ratsonProposal → moach(lazy)<br>sheirutUpdate → moach(lazy) | intent ✓ | C |  | [ ] |
| `acceptWishOffer` | acceptWishOffer | inline |  | toast | ratsonProposal → moach(lazy) | intent ✓ | P·C |  | [ ] |
| `clusterRatsons` | maagad | none |  | — | maagad | — | — |  | [ ] |
| `counterRatsonProposal` | counterRatsonProposal | none |  | — | ratsonProposal | intent ✓ | C |  | [ ] |
| `createRatson` | createRatson | none |  | — |  | — | — |  | [ ] |
| `declineWishOffer` | declineWishOffer | config | specificUsers | toast | ratsonProposal → moach(lazy) | intent ✓ | P |  | [ ] |
| `hideRatsonProposal` | hideRatsonProposal | none |  | — |  | — | — |  | [ ] |
| `matchRatson` | matchRatson | none |  | — |  | — | — |  | [ ] |
| `materializeRikmaBlueprint` | assistantSessions | none |  | — |  | — | — |  | [ ] |
| `materializeWish` | materializeWish | config | specificUsers | toast | sheirutCreated → moach(lazy) | intent ✓ | P |  | [ ] |
| `offerNewProductsToWishes` | offerNewProductsToWishes | config | specificUsers | toast | ratsonProposal → moach(lazy) | intent ✓ | P |  | [ ] |
| `offerWishHelp` | offerWishHelp | config | specificUsers | toast | ratsonProposal → moach(lazy) | intent ✓ | C |  | [ ] |
| `publishWishNeedToCommunity` | publishWishNeedToCommunity | none |  | — |  | — | — |  | [ ] |
| `refreshWishMatches` | refreshWishMatches | none |  | — |  | — | — |  | [ ] |
| `rejectRatsonProposal` | rejectRatsonProposal | none |  | — |  | — ⚠ | A |  | [ ] |
| `requestWishMission` | requestWishMission | config | specificUsers | toast | ratsonProposal → moach(lazy) | intent ✓ | C |  | [ ] |
| `requestWishResource` | requestWishResource | config | specificUsers | toast | ratsonProposal → moach(lazy) | intent ✓ | C |  | [ ] |
| `setWishRestime` | setWishRestime | none |  | — |  | — ⚠ | P |  | [ ] |
| `updateRatsonDraft` | updateRatsonDraft | none |  | — |  | — | — |  | [ ] |
| `updateRatsonExtraction` | updateRatsonExtraction | none |  | — |  | — | — |  | [ ] |
| `updateWishTerms` | updateWishTerms | none |  | — |  | — ⚠ | P |  | [ ] |

### deal — 22 actions (live 2 · full 0 · toast 13 · silent 5 · read-only 2)

| action | file | socket today | recipients | effect for others | metadata.type → who reacts | ערוצים היום | intent יעד | target scopes | status |
|---|---|---|---|---|---|---|---|---|---|
| `acceptSheirutQuote` | sheirutQuote | config | specificUsers (−me) | toast | sheirutUpdate → moach(lazy) | intent ✓ | P |  | [ ] |
| `approveSheirutpend` | approveSheirutpend | config | specificUsers | toast ⚠cfgUS lost | sheirutUpdate → moach(lazy) | intent ✓ (N13) | P |  | [ ] |
| `claimDirectOffer` | directOffer | inline |  | toast | directOffer → moach(lazy) | intent ✓ | P |  | [ ] |
| `confirmDealPartReceived` | confirmDealPartReceived | config | specificUsers | toast | dealPaid → moach(lazy) | intent ✓ | P |  | [ ] |
| `confirmSheirutHaluka` | confirmSheirutHaluka | none |  | — |  | intent ✓ | P |  | [ ] |
| `counterDealEdit` | counterDealEdit | inline |  | toast | voteUpdate → votes+rikma+moach(lazy) | intent ✓ | C |  | [ ] |
| `createSheirutHaluka` | createSheirutHaluka | none |  | — |  | intent ✓ | C |  | [ ] |
| `createSheirutpend` | createSheirutpend | config | projectMembers (−me) | toast ⚠cfgUS lost | sheirutUpdate → moach(lazy) | intent ✓ | C |  | [ ] |
| `draftDirectOffer` | draftDirectOffer | none |  | — |  | — | — |  | [ ] |
| `getDealDue` | getDealDue | read-only |  |  |  |  |  |  | n/a |
| `getSheirutpendQuote` | sheirutQuote | read-only |  |  | sheirutUpdate |  |  |  | n/a |
| `issueDirectOfferLink` | directOffer | inline |  | toast | directOffer → moach(lazy) | — | — |  | [ ] |
| `noteSheirutpend` | sheirutQuote | none |  | — | sheirutUpdate | — ⚠ | P |  | [ ] |
| `proposeSheirut` | proposeSheirut | config | projectMembers (−me) | partial(lev) | sheirutUpdate → moach(lazy) | intent ✓ | C |  | [ ] |
| `quoteSheirutpend` | sheirutQuote | config | specificUsers (−me) | toast | sheirutUpdate → moach(lazy) | intent ✓ | C |  | [ ] |
| `rejectSheirutpend` | rejectSheirutpend | config | specificUsers | toast ⚠cfgUS lost | sheirutUpdate → moach(lazy) | intent ✓ (N13) | P |  | [ ] |
| `requestSheirutJoin` | requestSheirutJoin | config | projectMembers (−me) | partial(lev) | sheirutUpdate → moach(lazy) | intent ✓ | C |  | [ ] |
| `revokeDirectOfferLink` | directOffer | inline |  | toast | directOffer → moach(lazy) | — | — |  | [ ] |
| `signDealEdit` | signDealEdit | inline |  | toast | voteUpdate → votes+rikma+moach(lazy) | intent ✓ | A·O |  | [ ] |
| `signDealOffer` | signDealOffer | config | specificUsers | toast | dealOfferSigned → moach(lazy) | intent ✓ | P |  | [ ] |
| `updateDirectOffer` | directOffer | inline |  | toast | directOffer → moach(lazy) | — | — |  | [ ] |
| `updateSheirut` | updateSheirut | none |  | — |  | — ⚠ | P |  | [ ] |

### money — 23 actions (live 2 · full 0 · toast 7 · silent 7 · read-only 7)

| action | file | socket today | recipients | effect for others | metadata.type → who reacts | ערוצים היום | intent יעד | target scopes | status |
|---|---|---|---|---|---|---|---|---|---|
| `approveHaluka` | approveHaluka | config | custom | partial(lev) |  | SPTE ✂ | O |  | [ ] |
| `confirmHaluka` | confirmHaluka | config | projectMembers (−me) | toast | halukaConfirm → moach(lazy) | S ⚠ | P |  | [ ] |
| `counterSaleClaim` | counterSaleClaim | inline |  | partial(lev) | saleClaimCounter → moach(lazy) | SP ⚠ | C |  | [ ] |
| `createDonationSale` | createDonationSale | inline |  | toast | saleClaim → moach(lazy) | SP ⚠ | C |  | [ ] |
| `createHaluka` | createHaluka | none |  | — |  | — ⚠ | C |  | [ ] |
| `createPlatformSale` | createPlatformSale | none |  | — |  | — | — |  | [ ] |
| `createSale` | createSale | inline |  | toast | saleClaim → moach(lazy) | SP ⚠ | C·O |  | [ ] |
| `createSiteShareTransfer` | createSiteShareTransfer | none |  | — |  | — ⚠ | C |  | [ ] |
| `createTosplit` | createTosplit | config | projectMembers (−me) | toast ⚠cfgUS lost |  | SPTE | C |  | [ ] |
| `customerReportRecurringSaleCycle` | customerReportRecurringSaleCycle | inline |  | toast | recurringSaleCustomerReport → moach(lazy) | SPE ⚠ | C |  | [ ] |
| `decideSiteShare` | decideSiteShare | none |  | — |  | — | — |  | [ ] |
| `getOpenSiteShareDecisions` | getOpenSiteShareDecisions | read-only |  |  |  |  |  |  | n/a |
| `getPlatformProject` | getPlatformProject | read-only |  |  |  |  |  |  | n/a |
| `getRikmaSplitsArchive` | getRikmaSplitsArchive | read-only |  |  |  |  |  |  | n/a |
| `getSiteShareAggregate` | getSiteShareAggregate | read-only |  |  |  |  |  |  | n/a |
| `getSiteShareArchive` | getSiteShareArchive | read-only |  |  |  |  |  |  | n/a |
| `getSiteShareDecision` | getSiteShareDecision | read-only |  |  |  |  |  |  | n/a |
| `getSiteSharePayables` | getSiteSharePayables | read-only |  |  |  |  |  |  | n/a |
| `reportRecurringSaleCycle` | reportRecurringSaleCycle | inline |  | toast | recurringSaleCycle → moach(lazy) | SP ⚠ | C |  | [ ] |
| `requestDonation` | requestDonation | inline |  | toast | donationRequest → moach(lazy) | SP ⚠ | C |  | [ ] |
| `seedSiteShareDecisions` | seedSiteShareDecisions | none |  | — |  | — | — |  | [ ] |
| `setRikmaCurrency` | setRikmaCurrency | none |  | — |  | — ⚠ | A |  | [ ] |
| `toggleMoneyReceiver` | toggleMoneyReceiver | none |  | — |  | — ⚠ | A |  | [ ] |

### stipend — 9 actions (live 0 · full 6 · toast 0 · silent 1 · read-only 2)

| action | file | socket today | recipients | effect for others | metadata.type → who reacts | ערוצים היום | intent יעד | target scopes | status |
|---|---|---|---|---|---|---|---|---|---|
| `confirmStipendPayment` | confirmStipendPayment | inline |  | full | stipendPayment → moach(lazy) | SP | O |  | [ ] |
| `counterStipendTerms` | counterStipendTerms | inline |  | full | voteUpdate → votes+rikma+moach(lazy) | SP ⚠ | C |  | [ ] |
| `getStipendOverview` | getStipendOverview | read-only |  |  |  |  |  |  | n/a |
| `getStipendWork` | getStipendWork | read-only |  |  |  |  |  |  | n/a |
| `markStipendTransferSent` | markStipendTransferSent | inline |  | full | stipendPayment → moach(lazy) | SP ⚠ | C |  | [ ] |
| `proposeStipendPledge` | proposeStipendPledge | inline |  | full | voteUpdate → votes+rikma+moach(lazy) | SPE ⚠ | C |  | [ ] |
| `proposeStipendProgram` | proposeStipendProgram | inline |  | full | voteUpdate → votes+rikma+moach(lazy) | SPE ⚠ | C |  | [ ] |
| `publishStipendFundingRequest` | publishStipendFundingRequest | none |  | — |  | — | — |  | [ ] |
| `settleStipendCycle` | settleStipendCycle | inline |  | full | stipendPayment → moach(lazy) | SP ⚠ | C |  | [ ] |

### shift — 11 actions (live 0 · full 5 · toast 0 · silent 4 · read-only 2)

| action | file | socket today | recipients | effect for others | metadata.type → who reacts | ערוצים היום | intent יעד | target scopes | status |
|---|---|---|---|---|---|---|---|---|---|
| `claimShiftHole` | shiftCardActions | inline |  | full | shiftCall → moach(lazy)<br>shiftReopen → moach(lazy) | SP | O |  | [ ] |
| `decideShiftSwap` | shiftSwapActions | inline |  | full | shiftSwap → moach(lazy) | SP ⚠ | P |  | [ ] |
| `declareShiftAvailability` | declareShiftAvailability | none |  | — |  | — ⚠ | A |  | [ ] |
| `getPendmShiftPlan` | shiftCardActions | read-only |  |  | shiftCall → moach(lazy)<br>shiftReopen → moach(lazy) |  |  |  | n/a |
| `getShiftWork` | shiftCardActions | read-only |  |  | shiftCall → moach(lazy)<br>shiftReopen → moach(lazy) |  |  |  | n/a |
| `linkShiftTimer` | shiftHoursActions | none |  | — |  | — | — |  | [ ] |
| `logShiftHours` | shiftHoursActions | none |  | — |  | — ⚠ | C |  | [ ] |
| `proposeShiftSwap` | shiftSwapActions | inline |  | full | shiftSwap → moach(lazy) | SP ⚠ | C |  | [ ] |
| `releaseShiftAssignment` | shiftCardActions | inline |  | full | shiftCall → moach(lazy)<br>shiftReopen → moach(lazy) | SP | O |  | [ ] |
| `reopenForShiftHole` | shiftCardActions | config | projectMembers | full | shiftCall → moach(lazy)<br>shiftReopen → moach(lazy) | S ⚠ | O |  | [ ] |
| `setShiftRules` | shiftRulesActions | none |  | — |  | — | — |  | [ ] |

### archive — 7 actions (live 1 · full 3 · toast 0 · silent 2 · read-only 1)

| action | file | socket today | recipients | effect for others | metadata.type → who reacts | ערוצים היום | intent יעד | target scopes | status |
|---|---|---|---|---|---|---|---|---|---|
| `archivePersonalMatanot` | archivePersonalMatanot | none |  | — |  | — | — |  | [ ] |
| `archiveSpaceDoc` | spaceDocs | none |  | — |  | — ⚠ | A |  | [ ] |
| `archiveUserResource` | archiveUserResource | config | specificUsers | partial(lev) | profile → userStore | S | — |  | [ ] |
| `counterObjectChange` | counterObjectChange | inline |  | full | voteUpdate → votes+rikma+moach(lazy) | intent ✓ | C |  | [ ] |
| `previewArchiveMembership` | previewArchiveMembership | read-only |  |  |  |  |  |  | n/a |
| `proposeObjectArchive` | proposeObjectArchive | inline |  | full | voteUpdate → votes+rikma+moach(lazy) | intent ✓ | C |  | [ ] |
| `proposeObjectEdit` | proposeObjectEdit | inline |  | full | voteUpdate → votes+rikma+moach(lazy) | intent ✓ | C |  | [ ] |

### maagad — 8 actions (live 0 · full 0 · toast 3 · silent 5 · read-only 0)

| action | file | socket today | recipients | effect for others | metadata.type → who reacts | ערוצים היום | intent יעד | target scopes | status |
|---|---|---|---|---|---|---|---|---|---|
| `confirmMaagadQuorum` | maagad | config | specificUsers (−me) | toast | maagad → moach(lazy) | SP | O |  | [ ] |
| `createMaagadOffer` | maagad | config | specificUsers (−me) | toast | maagad → moach(lazy) | SP ⚠ | C |  | [ ] |
| `expireMaagadOffers` | maagad | none |  | — | maagad | — ⚠ | P |  | [ ] |
| `joinMaagad` | maagad | none |  | — | maagad | — ⚠ | A |  | [ ] |
| `leaveMaagad` | maagad | none |  | — | maagad | — ⚠ | A |  | [ ] |
| `openMaagad` | maagad | none |  | — | maagad | — | — |  | [ ] |
| `signMaagadOffer` | maagad | config | specificUsers (−me) | toast | maagad → moach(lazy) | SP | O |  | [ ] |
| `unsignMaagadOffer` | maagad | none |  | — | maagad | — ⚠ | A |  | [ ] |

### project — 4 actions (live 0 · full 2 · toast 0 · silent 2 · read-only 0)

| action | file | socket today | recipients | effect for others | metadata.type → who reacts | ערוצים היום | intent יעד | target scopes | status |
|---|---|---|---|---|---|---|---|---|---|
| `disconnectProjectRepo` | githubActions | config | projectMembers (−me) | full | base → moach(lazy) | S | A |  | [ ] |
| `scanProjectDirections` | planningRuns | none |  | — |  | — | — |  | [ ] |
| `syncProjectRepos` | githubActions | none |  | — | base | — | — |  | [ ] |
| `updateProjectDetails` | updateProjectDetails | config | projectMembers (−me) | full | base → moach(lazy) | S | A |  | [ ] |

### vote — 31 actions (live 9 · full 4 · toast 12 · silent 5 · read-only 1)

| action | file | socket today | recipients | effect for others | metadata.type → who reacts | ערוצים היום | intent יעד | target scopes | status |
|---|---|---|---|---|---|---|---|---|---|
| `acceptCounterOnAsk` | acceptCounterOnAsk | config | projectMembers (−me) | toast | base → moach(lazy) | intent ✓ | O |  | [ ] |
| `acceptCounterOnAskm` | acceptCounterOnAskm | config | projectMembers (−me) | toast | base → moach(lazy) | intent ✓ | O |  | [ ] |
| `addVote` | addVote | config | projectMembers | partial(lev) | voteUpdate → votes+rikma+moach(lazy) | intent ✓ | A·O |  | [ ] |
| `applyToMission` | applyToMission | config | projectMembers | toast | missionApplication → moach(lazy) | intent ✓ | C |  | [ ] |
| `candidateCounterOnAsk` | candidateCounterOnAsk | config | projectMembers (−me) | toast | base → moach(lazy) | intent ✓ | C |  | [ ] |
| `candidateCounterOnAskm` | candidateCounterOnAskm | config | projectMembers (−me) | toast | base → moach(lazy) | intent ✓ | C |  | [ ] |
| `counterOnAsk` | counterOnAsk | config | specificUsers | toast | base → moach(lazy) | intent ✓ | C |  | [ ] |
| `counterOnAskm` | counterOnAskm | config | specificUsers | toast | base → moach(lazy) | intent ✓ | C |  | [ ] |
| `declineAskmRequest` | declineAskmRequest | none |  | — |  | — ⚠ | P |  | [ ] |
| `declineMissionRequest` | declineMissionRequest | none |  | — |  | — ⚠ | P |  | [ ] |
| `declineOpenMission` | declineOpenMission | none |  | — |  | — | — |  | [ ] |
| `declineSpForMashaabim` | declineSpForMashaabim | none |  | — |  | — | — |  | [ ] |
| `dismissSelfNomination` | dismissSelfNomination | config | specificUsers | toast | selfNomination → moach(lazy) | intent ✓ | P |  | [ ] |
| `finalizeAskAcceptance` | finalizeAskAcceptance | config | projectMembers | full | missionCreated → moach(lazy) | intent ✓ | O |  | [ ] |
| `finalizeAskmAcceptance` | finalizeAskmAcceptance | config | projectMembers | refetch(lev) | askmAccepted → moach(lazy) | intent ✓ | O |  | [ ] |
| `finalizeJoinAcceptance` | finalizeJoinAcceptance | config | projectMembers | full | missionCreated → moach(lazy) | intent ✓ | O |  | [ ] |
| `getDecisionDetails` | getDecisionDetails | read-only |  |  |  |  |  |  | n/a |
| `nominateSelfMission` | nominateSelfMission | config | projectMembers | toast | selfNomination → moach(lazy) | intent ✓ | C |  | [ ] |
| `nominateSelfResource` | nominateSelfResource | config | projectMembers | toast | selfNomination → moach(lazy) | intent ✓ | C |  | [ ] |
| `proposeOnOpenMashaabim` | proposeOnOpenMashaabim | config | specificUsers | toast | mashaabimRequest → moach(lazy) | intent ✓ | C |  | [ ] |
| `proposeOnOpenMission` | proposeOnOpenMission | config | specificUsers | toast | missionApplication → moach(lazy) | intent ✓ | C |  | [ ] |
| `proposeRikmaBlueprint` | assistantSessions | none |  | — |  | — | — |  | [ ] |
| `proposeRikmaIdentity` | proposeRikmaIdentity | config | projectMembers (−me) | full | base → moach(lazy) | intent ✓ | C |  | [ ] |
| `submitNegoMaap` | submitNegoMaap | config | projectMembers (−me) | full | maapNego → moach(lazy) | intent ✓ | C |  | [ ] |
| `submitNegoMash` | submitNegoMash | config | projectMembers (−me) | partial(lev) | base → moach(lazy) | intent ✓ | C |  | [ ] |
| `submitNegoMission` | submitNegoMission | config | projectMembers (−me) | partial(lev) | base → moach(lazy) | intent ✓ | C |  | [ ] |
| `voteOnAskm` | voteOnAskm | config | projectMembers (−me) | refetch(lev) | voteUpdate → votes+rikma+moach(lazy) | intent ✓ | A |  | [ ] |
| `voteOnDecision` | voteOnDecision | config | projectMembers | partial(lev) | saleClaimConfirmed → moach(lazy)<br>voteUpdate → votes+rikma+moach(lazy)<br>decisionVote → votes+rikma+moach(lazy) | intent ✓ | A·O |  | [ ] |
| `voteOnMaap` | voteOnMaap | config | projectMembers | partial(lev) | maapVote → votes+rikma+moach(lazy) | intent ✓ | A·C·O |  | [ ] |
| `voteOnPendm` | voteOnPendm | config | projectMembers | partial(lev) | voteUpdate → votes+rikma+moach(lazy)<br>pendmVote → votes+rikma+moach(lazy) | intent ✓ | A·O |  | [ ] |
| `voteOnPmash` | voteOnPmash | config | projectMembers | partial(lev) | pmashVote → votes+rikma+moach(lazy) | intent ✓ | A·O |  | [ ] |

### mission — 13 actions (live 1 · full 0 · toast 8 · silent 3 · read-only 1)

| action | file | socket today | recipients | effect for others | metadata.type → who reacts | ערוצים היום | intent יעד | target scopes | status |
|---|---|---|---|---|---|---|---|---|---|
| `closeFiniapruval` | closeFiniapruval | config | projectMembers | toast ⚠cfgUS lost | finiapruvalVote → moach(lazy) | SP | O |  | [ ] |
| `completeMission` | completeMission | inline |  | partial(lev) | finiappmi → moach(lazy) | SPE ⚠ | C |  | [ ] |
| `counterFiniapruval` | counterFiniapruval | inline |  | toast | finiapruvalCounter → moach(lazy) | SP ⚠ | C |  | [ ] |
| `createMission` | createMission | inline |  | toast | voteUpdate → votes+rikma+moach(lazy) | SPE ⚠ | C |  | [ ] |
| `createMissionOffer` | createMissionOffer | none |  | — |  | — | — |  | [ ] |
| `createMissionTemplate` | createMissionTemplate | none |  | — |  | — | — |  | [ ] |
| `createTask` | createTask | config | specificUsers (−me) | toast |  | SPTE ✂ | P |  | [ ] |
| `customizeOpenMission` | customizeOpenMission | config | specificUsers | toast | missionApplication → moach(lazy) | S ⚠ | C |  | [ ] |
| `getMissionForEdit` | getMissionForEdit | read-only |  |  |  |  |  |  | n/a |
| `linkActToMission` | linkActToMission | config | projectMembers (−me) | toast ⚠cfgUS lost |  | SP ✂ | A |  | [ ] |
| `updateMissionOffer` | updateMissionOffer | none |  | — |  | — | — |  | [ ] |
| `updateMissionStatus` | updateMissionStatus | config | projectMembers (−me) | toast | missionStatus → moach(lazy) | intent ✓ | A | `project:<pid>`, `mission:<mId>` | [x] 2026-10-10 — נבדק בשני דפדפנים (לא נדחף) |
| `updateTask` | example | config | projectMembers (−me) | toast ⚠cfgUS lost |  | SP ✂ | A |  | [ ] |

### resource — 13 actions (live 1 · full 1 · toast 3 · silent 8 · read-only 0)

| action | file | socket today | recipients | effect for others | metadata.type → who reacts | ערוצים היום | intent יעד | target scopes | status |
|---|---|---|---|---|---|---|---|---|---|
| `blockResourceDates` | blockResourceDates | none |  | — |  | — | — |  | [ ] |
| `cancelResourceBooking` | cancelResourceBooking | none |  | — |  | — ⚠ | P |  | [ ] |
| `confirmResourceBooking` | confirmResourceBooking | none |  | — |  | — ⚠ | P |  | [ ] |
| `createMashaabim` | createMashaabim | none |  | — |  | — | — |  | [ ] |
| `createMashaabimRequest` | createMashaabimRequest | config | specificUsers | toast | mashaabimRequest → moach(lazy) | intent ✓ | C |  | [ ] |
| `createResource` | createResource | inline |  | toast | voteUpdate → votes+rikma+moach(lazy) | SPE ⚠ | C |  | [ ] |
| `createResourceBooking` | createResourceBooking | none |  | — |  | — ⚠ | C |  | [ ] |
| `createResourceRequest` | createResourceRequest | none |  | — |  | — ⚠ | C |  | [ ] |
| `customizeOpenMashaabim` | customizeOpenMashaabim | config | specificUsers | toast | mashaabimRequest → moach(lazy) | S ⚠ | C |  | [ ] |
| `markResourceDone` | markResourceDone | config | projectMembers (−me) | full | resourceDone → moach(lazy) | S ⚠ | O |  | [ ] |
| `publishUserResourceAsProduct` | publishUserResourceAsProduct | config | specificUsers | partial(lev) | profile → userStore | S | — |  | [ ] |
| `releaseResourceBooking` | releaseResourceBooking | none |  | — |  | — ⚠ | P |  | [ ] |
| `updateResourceRequest` | updateResourceRequest | none |  | — |  | — ⚠ | A |  | [ ] |

### product — 5 actions (live 0 · full 0 · toast 2 · silent 2 · read-only 1)

| action | file | socket today | recipients | effect for others | metadata.type → who reacts | ערוצים היום | intent יעד | target scopes | status |
|---|---|---|---|---|---|---|---|---|---|
| `approveMatanot` | approveMatanot | config | projectMembers (−me) | toast |  | SP | O |  | [ ] |
| `createComplexMatanot` | createComplexMatanot | config | projectMembers (−me) | toast |  | SP ⚠ | C |  | [ ] |
| `createPersonalMatanot` | createPersonalMatanot | none |  | — |  | — | — |  | [ ] |
| `loadCatalog` | loadCatalog | read-only |  |  |  |  |  |  | n/a |
| `setMatanotDiscovery` | setMatanotDiscovery | none |  | — |  | — | — |  | [ ] |

### user — 11 actions (live 2 · full 0 · toast 1 · silent 7 · read-only 1)

| action | file | socket today | recipients | effect for others | metadata.type → who reacts | ערוצים היום | intent יעד | target scopes | status |
|---|---|---|---|---|---|---|---|---|---|
| `dismissNotice` | noticePrefs | none |  | — |  | — | — |  | [ ] |
| `ensurePersonalRikma` | ensurePersonalRikma | read-only |  |  |  |  |  |  | n/a |
| `refreshMySuggestions` | refreshMySuggestions | none |  | — |  | — | — |  | [ ] |
| `requestSuggestion` | requestSuggestion | config | specificUsers | toast | ratsonProposal → moach(lazy) | SPTE | C |  | [ ] |
| `restoreNotice` | noticePrefs | none |  | — |  | — | — |  | [ ] |
| `saveNoticePrefs` | noticePrefs | none |  | — |  | — | — |  | [ ] |
| `toggleGuideStatus` | toggleGuideStatus | none |  | — |  | — | — |  | [ ] |
| `updateUserBasic` | updateUserBasic | config | specificUsers | partial(lev) | profile → userStore | S | — |  | [ ] |
| `updateUserProfilePic` | updateUserProfilePic | config | specificUsers | partial(lev) | profile → userStore | S | — |  | [ ] |
| `updateUserRelation` | updateUserRelation | none |  | — |  | — | — |  | [ ] |
| `updateWelcomeCard` | updateWelcomeCard | none |  | — |  | — | — |  | [ ] |

### other — 1 actions (live 0 · full 0 · toast 0 · silent 1 · read-only 0)

| action | file | socket today | recipients | effect for others | metadata.type → who reacts | ערוצים היום | intent יעד | target scopes | status |
|---|---|---|---|---|---|---|---|---|---|
| `shareRikmaPreview` | assistantSessions | none |  | — |  | — | — |  | [ ] |
