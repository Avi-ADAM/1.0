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
| … מצהירים `realtime.scopes` (`LEGACY_NO_REALTIME` ב-`realtime.contract.test.ts`) | 0 | כולם — הרשימה ריקה והוסרה (2026-10-11) |
| … שקטים לגמרי (אין אירוע סוקט) | 95 | 95 |
| … `fullRefresh` משודר | 21 | 0 (לא מועבר לנמענים) |
| דפים שמציגים נתונים משותפים | 76 | 76 |
| … 🟢 ממוקד | 11 | 16 |
| … ⚪ / 🔴 / 🟠 (לא מתעדכנים בזמן אמת) | 62 | 2 (timers של הרקמה, create) — negotiation דולג: רפרנס בלבד |
| `invalidate(() => true)` בלקוח | קיים | הוסר מהסוקט (נשאר רק כשהמבצע מריץ `fullRefresh` מהתוצאה שלו) |
| מאזיני `notification` שמרעננים מסכים | 8 (R5) | 0 — נשארו רק מאזינים לבני אדם: הטוסט, שורת הצ'אט והפרופיל ב-layout הראשי, והפגישה (2026-10-11) |
| `updateStrategy` משודר לנמענים | כל action עם התראה | 0 — רק הטאב המבצע מריץ אותו מהתשובה שלו (2026-10-11) |
| **התראות לבני אדם** (§6 בתכנית) | | |
| actions שהערוצים שלהם חסרים מול ה-intent היעד (⚠) | 106 | 50 |
| … מתוכם `consent` — מחכים לתשובה של מישהו, וזה לא יוצא מהאתר | 55 | 16 |
| … טלגרם חסר | 86 | 35 |
| actions ששולחים יותר מהיעד (✂ — מייל נשאר למי שאין ערוץ אחר) | 10 | 1 |
| קבצים שבוחרים ערוצים ביד (`LEGACY_CHANNEL_LISTS`) | 109 | 9 |
| actions שעברו ל-`intent` | 0 | 106 |

## שלבים

| שלב | סטטוס |
|---|---|
| R0 — תיקוני B1, B4, B5, B6, B10, B11 | [x] 2026-10-08 — קוד ובדיקות יחידה; הבדיקה הידנית בשני דפדפנים עוד פתוחה |
| N1-ask — משפחת ה-ask (בקשות הצטרפות, מועמדות, מו"מ עליה, ההכרעה) עברה ל-`intent` + מייל כגיבוי (N10) | [x] 2026-10-08 — 17 actions + `deal/offerDeal` (חתימת הלקוחה, C-19) + `wish/volunteerProposal`; ה-scopes שלהם עוד ב-R4 |
| N1-vote — הצבעות, מו"מ על הצעות, ארכוב/עריכה, כתובת/מראה הרקמה עברו ל-`intent`; `voteIntent` (consent כשסבב **נפתח**, לא על כל חתימה) | [x] 2026-10-08 — 14 actions + `createSheirutFromPending` (helper); ה-scopes שלהם עוד ב-R4 |
| N1-wish+deal — wish (הצעות, מו"מ, השמה, הזמנות) ו-deal (בקשות מוצר, מחיר, עסקה, תשלום) עברו ל-`intent` | [x] 2026-10-08 — 24 actions + `sheirut/dealEdit`; `createSheirutHaluka` ו-`confirmSheirutHaluka` קיבלו התראה (לא הייתה) |
| N0 — `intent` → ערוצים (`notifications/intent.ts`), ה-ratchet `channels.contract.test.ts`, N1, N2 | [x] 2026-10-08 — קוד ובדיקות יחידה; אף action עוד לא עבר ל-`intent` |
| R1 — חוזה (scopes, `ActionConfig.realtime`, broadcaster, `x-client-id`, socket-server `event`, ratchet test) | [x] 2026-10-08 — `src/lib/realtime/scopes.ts`, `src/lib/server/realtime/broadcaster.ts`, `ActionService` שלב 5a, `x-client-id` ב-`actionClient` → `ActionContext.clientId`, `socket-server` `event` (`broadcast-event.ts`), `realtime.contract.test.ts` (209 ב-legacy, 31 `READ_ONLY`). אף action עוד לא מצהיר, אז שום דבר לא משודר עדיין. **לפרוס את socket-server לפני ה-action הראשון שמצהיר `realtime`** — שרת ישן יפלוט את השינוי כ-`notification` |
| R2 — bus + מתאמי kit / lev / moach + `useRealtime` + resync | [x] 2026-10-08 — `src/lib/realtime/bus.ts` (factory: echo לפי `originClientId`, חלון 250ms, כל subscriber מקבל רק את השינויים שלו אחד-אחד, resync אחרי חיבור **חוזר** בלבד), `bus.svelte.ts` (`realtimeBus` + `useRealtime`), `routing.ts` (scope → `depends` / slices של הלב / sections של moach), `adapters/lev.ts` + `adapters/moach.ts`. מחובר: ה-layout הראשי (`start`), `/lev`, `moach/[pid]/+layout`. `depends.contract.test.ts` — כל `depends('rt:…')` / `rtKey` / `useRealtime` בקוד הוא pattern שה-bus יודע להתאים. המאזינים הישנים הוסרו ב-R6 (2026-10-11) |
| socket-server — בקשת polling אחת (`/socket.io/?transport=polling`) הפילה את התהליך (`ERR_HTTP_HEADERS_SENT`): ה-handler של ה-HTTP נרשם אחרי socket.io וענה 404 על הנתיב שלו | [x] 2026-10-09 — `socket-server/src/socket-path.ts` + בדיקה; נפרס, 3 בקשות polling בפרודקשן = 200 בלי restart. `deploy-socket.ps1` מוודא את הקובץ בכל פריסה |
| socket-server — `event` / `rt:changed` בפרודקשן | [x] 2026-10-09 — `deploy-socket.ps1` (פריסה ראשונה מעץ העבודה, `7049d4e3-dirty`); `/health` ציבורי תקין, `/broadcast` בלי סוד 401, `:rollback` שמור |
| R3 — דפים, גל 1 | [~] 2026-10-10 — כל הדפים מחוברים חוץ מ-`negotiation/[id]` (נדחה); 12 נבדקו חי בהזרקה ל-bus. פתוח: `/lev`, `VoteDetail`, deals/wish/concierge בשני דפדפנים — כשה-actions שלהם יפרסמו (R4). המאזינים הישנים הוסרו ב-R6 (2026-10-11) |
| R4 — actions לפי תחום | [x] 2026-10-11 — **כל ה-actions הכותבים מצהירים `realtime`; `LEGACY_NO_REALTIME` התרוקן והוסר מה-ratchet.** נבדקו חי: vote/archive, wish, createTask/updateTask; שאר התחומים לא נבדקו חי. — **planning + assistant + library + leftovers: 25 actions** (2026-10-11). שתי ישויות חדשות באוצר: `plan` (לוח תכנון) ו-`doc` (פריט בספרייה המשותפת); ב-moach הן ממופות במכוון ל"שום section" (שינוי בהן לא מרענן את `base`), והמסכים שלהן מקשיבים בעצמם — `PlanBoards` דרך `useRealtime(['plan:*'])` (מסונן לרקמה), ו-`moach/[pid]/docs` דרך `depends(rt:doc:*)`. סשן של העוזר שייך לבעלים בלבד ⇒ `user:<me>` · self; `materializeRikmaBlueprint` מוסיף את הרקמה. `cacheTranslations` מצהיר `scopes: () => []` עם הסבר. **לא נבדק חי.** **meeting + chat: 12 actions** (2026-10-11). פגישה אינה רקמה ⇒ `meeting:<id>` הוא scope של צדדים, וה-broadcaster מוצא את המשתתפים בעצמו (`meetingPartiesOf`, שאילתה 63 בטוקן של המבצע ובטוקן השירות, כמו משאלה); בפגישה חדשה המוזמנים נקובים ב-`partiesFrom`. צ'אט פורום ⇒ `forum:<id>` למשתתפי הפורום בלבד; צ'אט הצבעה/בקשה ⇒ הרקמה + ההצבעה (+ המועמד; `addAsk(m)ChatEntry` מבררים עכשיו את הרקמה והמועמד אחרי השמירה). התראות: 5 קבצים עברו ל-`intent` במלואם (הזמנה לפגישה `consent`, זמינות `outcome`/`ambient`, הודעות דיון/חלוקה/פגישה `ambient`); ב-`approveMeeting`/`joinMeeting`/`startMeeting` עברו רק ההתראות שלא מאבדות ערוץ — "הפגישה אושרה/התחילה" (SPE) והודעת צ'אט (SPTE) נשארו literal עד החלטה. נמצא ותוקן B15. **לא נבדק חי.** — **maagad + process + rikma details + github + user: 34 actions** (2026-10-11). מאגד אינו רקמה ⇒ `maagad:<id>` עם קהל `parties`: החברים שעוד בו והספקים שההצעות שלהם עליו (ה-handlers כבר טוענים את המאגד, ועכשיו מחזירים `partyIds`); עזיבה נשארת שקטה (`self`, §2.1); אישור הסף מוסיף את רקמת הספק, שבה נוצרות העסקאות. תהליך = `process:<id>`; צירוף ישות לתהליך מוסיף גם את הישות. כל מה שאישי למשתמש (פרופיל, העדפות התראות, כרטיס ברוכים הבאים, הצעות) ⇒ `user:<me>` · self. `githubIssueClosed` ו-`githubWorkClaimable` לא כותבים כלום ⇒ READ_ONLY. התראות: 6 קבצים עברו ל-`intent` — הגשת שעות על PR ⇒ `consent` (כמו שמירת טיימר לאישור); פנייה מתוך משאלה ⇒ `consent` (כמו בקשת מוצר); הצעה במאגד, "הגעת לסף" לספק, issue שנסגר ועבודה לתביעה ⇒ `personal`; "יצאנו לדרך" ⇒ `outcome`; עדכון פרטי רקמה, ניתוק מאגר קוד ועדכון פרופיל ⇒ `ambient` כמו היום. נמצא B14. **לא נבדק חי.** — **resource + product: 17 actions** (2026-10-11). משאבים ומוצרים של רקמה ⇒ קהל `project`; משאב אישי (`sp`) והיומן שלו ⇒ הרקמה כשהיא נקובה (הזמנה לרקמה), אחרת רק המכשירים של הבעלים. `resource:<id>` מכסה משאב פתוח, בתהליך ואישי, כמו בתחומים הקודמים. `createResource` מחזיר עכשיו `createdKind` (`Pmash` / `OpenMashaabim`), כי ה-id שהוא מחזיר יכול להיות הצבעה או משאב. התראות: 6 קבצים עברו ל-`intent` — הצעת משאב ומוצר חדש להצבעה ⇒ `consent`; מוצר שאושר ⇒ `outcome`; משאב חודשי שנסגר ועדכון פרסום ⇒ `ambient` כמו היום. **לא נבדק חי.** — **stipend + shift: 16 actions** (2026-10-11). רוב ה-handlers כאן מוצאים את הרקמה בעצמם (תשלום ← התחייבות ← רקמה, משמרת ← תוכנית ← רקמה) ולא קיבלו אותה כפרמטר — עכשיו הם מחזירים `projectId` (ובמלגה גם `pledgeId`), וה-scopes קוראים משם. מלגה = `stipend:<id>` + `decision:decision`; משמרת = `shift:<id>`; החלפת משמרת היא Decision בין שני חברים ⇒ `parties` (בלי `project` — אחרי החלפה שבוצעה הסידור של שאר החברים יתעדכן רק בפעולה הבאה, כי ה-handler לא יודע את הרקמה). התראות: 8 קבצים עברו ל-`intent` — הצעות והצעות נגדיות ⇒ `consent`; העברה שנשלחה ⇒ `consent` (אישור הקבלה הוא שמזיז אחוזים, ויש שעון); החלפת משמרת: הצעה/נגדית `consent`, התוצאה `personal` (`tell()` מקבל `intent`). נמצא B13. **לא נבדק חי.** — **money: 16 actions** (2026-10-11). מכירות, חלוקות ונתח האתר הם מצב של הרקמה (יתרות, tosplits) ⇒ קהל `project`; חלוקה = `decision:tosplit`, תשלום בודד = `split`, טענת מחזיק = `decision:decision`. לקוח של הוראת קבע ומקבל העברת נתח-אתר נוספים כצדדים — `reportRecurringSaleCycle` / `customerReportRecurringSaleCycle` מחזירים עכשיו `projectId` (ו-`customerId`), שלא היה להם. `toggleMoneyReceiver`: ה-`id` הוא עסקה (sheirut), לא משתמש. ההתראות של 8 קבצים עברו ל-`intent` מתוך קריאת הקוד: טענות מחזיק והצעות נגדיות ⇒ `consent`; אישור העברה (`confirmHaluka`) ⇒ `ambient` כמו היום; דיווח ללקוח ובקשת תרומה ⇒ `personal`. `approveHaluka` נשאר עם `channels` (ארבעה ערוצים לכולם) — `outcome` היה מוריד מייל וטלגרם. **לא נבדק חי**: כל פעולה כאן רושמת כסף אמיתי. — **mission / act / timer: 16 actions** (2026-10-11). משימות ומטלות ⇒ `project` + `mission:<id>` / `act:<id>`; אישורי סיום ⇒ `decision:finiapruval`. טיימר רץ הוא עניין של מי שמחזיק בו: `timerStart/Stop/LogUpdate` ⇒ `timer:<uid>` ל-`self` בלבד, ורק `timerSave` (השעות נכנסות למשימה) הולך לרקמה. ההצעות המקצועיות האישיות והקטלוג ⇒ `user:<me>` ל-`self`. **נבדק בשני דפדפנים** (256 → 258, רקמה 87): `createTask` — מטלה 134 הופיעה בטבלת המטלות של 258 בלי טעינת דף; `updateTask` — הסטטוס עבר ל"ממתין לאישרור" וחזר. `__data.json` נטען פעמיים ב-`updateTask`: פעם מ-`rt:changed` ופעם מהמאזין הישן של ה-layout, שמקבל את ההתראה ל-projectMembers — צפוי עד R6. הטיימרים לא נבדקו חי: לדף `/timers` עוד אין מאזין `timer:*` (הוא נשען על `timers.js`), אז היום רק מתאם moach (`timer` ⇒ missions) צורך אותם. ההתראות לבני אדם עברו ל-`intent` ב-11 מהקבצים: אישורי סיום, `completeMission`, `createMission` ו-`customizeOpenMission` ⇒ `consent` (מוסיף טלגרם, ובחלקם מייל); `createTask` ⇒ `consent` ולא `personal` — המבצע מתבקש לאשר (`myIshur`), אז אין ✂; `timerSave` ⇒ `consent` כשנפתח אישור שעות, אחרת `outcome`; הטיימרים ⇒ `ambient` (כמו היום). `linkActToMission` ⇒ `outcome`: מטלה שהופכת למשימה היא החלטה של כל הרקמה, אז הפוש נשאר (כשנוצרה pendm, `createMission` כבר ביקש הסכמה מכל חבר); ה-scope שלה הוא `decision:pendm` כשזו הצבעה. `updateTask` נשאר עם `channels` עד שה-intent שלו ייקבע מתוך מה שהפעולה עושה. **הסיווג בעמודת ה-intent היעד נוצר אוטומטית על ידי סוכן אחר — הצעה לבדיקה, לא החלטה; לא מורידים ערוץ על סמך הטבלה** (המשתמש, 2026-10-11). — **wish + deal: 39 actions** (2026-10-11; נשארו `clusterRatsons` — תחום maagad, `materializeRikmaBlueprint` — עוזר ההרשמה). משאלה אינה שייכת לרקמה, אז ה-broadcaster מוצא את הקהל שלה בעצמו: `wish:<id>` ⇒ בעלי המשאלה וכל המציעים (`partiesOf` → `105queryRatsonWithProposals` בטוקן השירות). עסקה ⇒ `project` + הצדדים שה-handler מחזיר. **נבדק בשלושה דפדפנים 2026-10-11** (משאלה 18: הבעלים 261 משנה קצב, ו-256 ו-258, המציעים, רואים את דף המשאלה נטען מחדש בלי רענון; הקצב הוחזר ל-`feh`). הבדיקה מצאה שטוקן השירות לבדו לא קורא את הצדדים של משאלה (השינוי הגיע רק למבצע) — `wishPartiesOf` שואל עכשיו גם עם ה-JWT של המבצע ומאחד. — **vote + archive: 34 actions** מצהירים `realtime` (נשארו: `archiveSpaceDoc` — ערוץ `space:changed` משלו; `proposeRikmaBlueprint` — עוד אין רקמה). נבדק בשני דפדפנים (256 ↔ 258, החלטה 78 על משימה 191): הצעת עריכה → הצעה נגדית → אישור, כל צד רואה את הסבב של השני בלי טעינת דף, והשם חזר למקור. `partiesFrom` מצטרף עכשיו גם לקהל `project` (מועמד שעוד אינו חבר). הבדיקה מצאה באג קודם ב-`VoteDetail` — ראו B12. — פיילוט `updateMissionStatus` **נבדק בשני דפדפנים 2026-10-10** (256 → 258, רקמה 87, משימה 191): `rt:changed` הגיע ל-258 עם `project:87`, `mission:191` ו-`originClientId` של הטאב השני; ה-bus מסר אחרי ~0.5ש׳; מתאם moach שלח **בקשה אחת** (`getProjectMissions` של 87), בלי טעינת דף; שינוי שאף מסך לא מקשיב לו — אפס בקשות; ההד של הטאב המקורי מסונן. הבדיקה מצאה באג: `/api/action` בנה `ActionService` משלו בלי broadcaster — אף פעולה מהדפדפן לא פרסמה. תוקן (`realtimeFor(notifier)` משותף ל-`/api/action` ול-`actions/index.ts`) |
| R5 — דפים, גל 2 + timegrama + הסרת `invalidate(() => true)` | [~] 2026-10-11 — **בנוי.** גל 2: 32 loaders עם `depends(rtKey(...))`, ודפי `onMount` עם `useRealtime` מסונן לרקמה (`batchTouchesRikma`); `/myacts` ו-`/me` נבדקו חי. timegrama מפרסם הבשלות (B9, צד המסכים). `fullRefresh` לא משודר יותר ו-`invalidate(() => true)` הוסר מהסוקט (B2). פתוח: `moach/[pid]/edit` (התראה, לא רענון), `negotiation/[id]` ו-`/api/send` (B9), N5 (הודעה לבני אדם על הבשלה בשתיקה). |
| R6 — ניקוי מאזינים ישנים | [x] 2026-10-11 — **בנוי, לא נבדק חי.** `levSocketHandler` נמחק (939 שורות): נשארו רק שני ה-patchers של ההצבעה, שהקלף המצביע מריץ על עצמו לפני שהשרת עונה — עברו ל-`$lib/utils/levVotePatch.ts` עם בדיקות. הוסרו המאזינים של `moach/[pid]/+layout` (יחד עם `VOTE_TYPES` / `sectionsForNotification` ב-`moachRealtime.js`), דף ההצבעות, `VoteDetail`, `RikmaPage` (ויחד איתו ה-`depends('project:<id>')` שרק הוא הזיז), והפורום; וגם ה-`socketClient.connect` הכפול ב-moach ובפורום — ה-layout הראשי מחבר. **שני מסלולים עברו ל-bus:** הטיימרים (`listenForTimerChanges` ← `timer:<me>`; `$lib/func/timers.js` שולח עכשיו `x-client-id`, אחרת הטאב המפעיל היה מקבל את ההד של עצמו, ו-`updateMissionTimerState` מצהיר גם `timer:<me>`) והצ'אט בקלפי הלב (`listenForForumChanges` ← `forum:*`, אידמפוטנטי — שני ה-layouts קוראים לו, וקודם כל כניסה הוסיפה מאזין). `socketClient` כבר לא מריץ `updateStrategy` (B3), וה-orchestrator לא משדר אותו (`actionResult.updateStrategy` מנוקה). `metadata.type` נשאר לטוסט, לצ'אט, לפרופיל ולפגישה. N7 נסגר באותו commit. |

### באגים מהמיפוי

| # | | סטטוס |
|---|---|---|
| B1 | `config.updateStrategy` לא משודר לנמענים (18 actions, מסומנים ⚠cfgUS lost למטה) | [x] 2026-10-08 — `withUpdateStrategy` ב-`ActionService` מעביר ל-notifier את מה שהיוזם מקבל. 5 configs שהיו דוחפים נתון גולמי ל-stores של הלב עברו ל-`refetchScope`: `createTosplit` (`halukas`), `create/approve/rejectSheirutpend` (`sheirutpends`), `closeFiniapruval` (`fiapp`, `mtaha`). `updateTask` מתחיל לעדכן משימה קיימת בלב של כולם. ה-registry מקבל עכשיו `refetchScope` גם ב-config. |
| B2 | `fullRefresh` ⇒ `invalidate(() => true)` בכל דף (להסיר רק ב-R5) | [x] 2026-10-11 — `NotificationOrchestrator` לא מעביר יותר `fullRefresh` לנמענים (גם לא בתוך `actionResult`), ו-`socketClient` לא עושה עליו `invalidate(() => true)`. הטאב של המבצע עדיין מריץ אותו מהתוצאה שלו (`actionClient`). |
| B3 | `partialUpdate` ⇒ `invalidate('pends')` — no-op | [x] 2026-10-11 — `handleUpdateStrategy` הוסר מ-`socketClient` (R6); אסטרטגיה רצה רק בטאב המבצע, דרך `actionClient` |
| B4 | `moachStore.invalidate` עצל — הדף הפתוח לא מתעדכן | [x] 2026-10-08 — `moachStore.refresh` קורא מחדש `missions`/`financials` (debounce 300ms) כשהרקמה כבר מחזיקה אותם; `base` דרך `depends(moachBaseKey)` ב-layout load. המיפוי סוג→section ב-`moachRealtime.js` (עם בדיקות). אירוע בלי projectId עדיין רק מסמן stale. |
| B5 | `approveHaluka` עם `recipients: custom` ⇒ אין נמענים | [x] 2026-10-08 — אומת: `HalukaNotificationService` משמש רק את `/api/approveHaluka` הישן, שאף לקוח לא קורא לו. עכשיו `projectMembers` (socket/email/telegram/push), ו-`refetchScope` על `halukas` עם projectId. ה-endpoint הישן והשירות **נמחקו** (2026-10-08) — ה-endpoint גם אישר כל tosplit/haluka עם הצבעות שהקורא המציא, בלי בדיקת חברות. |
| B6 | `task-updated` / `timer-updated` בלי מאזינים | [x] 2026-10-08 — כל `updateStrategies.ts` היה מת: הפונקציות שנרשמו לא מוזכרות באף config, ואלה שמוזכרות (`refreshTimers`, `appendVote`, …) לא נרשמו מעולם. נמחק יחד עם הדוגמה והקריאה ב-forum layout. |
| B7 | אין resync אחרי ניתוק: מה שנשלח בזמן שהסוקט נפל — אבד. | [x] 2026-10-08 (ל-`rt:changed`) — אחרי חיבור חוזר: כל `depends('rt:…')` רץ שוב, הלב טוען מלא פעם אחת, moach קורא את שלושת ה-sections. התראות `notification` שהוחמצו לא חוזרות — זה לא תפקידן |
| B8 | echo: רק טיימרים מסננים לפי `originClientId` | [x] 2026-10-08 — `rt:changed` מסונן לפי הטאב (`x-client-id`), והמכשירים האחרים של אותו משתמש מקבלים. `notification` כבר לא מרענן מסכים (R6, 2026-10-11), אז ההד שלו הוא רק טוסט — וה-layout מדלג על טוסט שהמשתמש עצמו יזם (`initiatorId`). הטיימרים עברו מ-`metadata.originClientId` ל-header (`x-client-id`) |
| B9 | timegrama ו-`/api/send` כותבים בלי סוקט | [x] 2026-10-12 — **timegrama סגור:** ה-dispatcher קורא את הרקמה של כל יעד יחד עם התור (`relationSelection`), ואחרי שהמטפל רץ מפרסם `maturedScopes` (`src/lib/server/realtime/timegramaScopes.ts`) דרך ה-broadcaster המשותף (`realtimeBroadcaster`); אם הקריאה המורחבת נדחית — קורא את התור כמו קודם ומבשיל בלי לפרסם. לא הורץ מול התור האמיתי (הריצה מבשילה שעונים אמיתיים). **`/api/send` בתוך הריפו (2026-10-12):** לא פרסום גנרי מתוך ה-proxy — כתיבה דרך `/api/send` היא מצב לא רצוי, והכתיבות עוברות ל-actions (שמצהירים `realtime` ממילא). מכל ה-mutation qids שהלקוח שלח: `Myacts` ⇒ `updateTask` (`naasa` / `status`); צ'אט בפוטר ⇒ `ensureMissionForum` (חדש — בודק שהמשימה שייכת לרקמה) / `ensureHalukaForum`; טלגרם ⇒ `linkTelegram` (חדש — תמיד השורה של הקורא; אימות ה-`hash` של ה-widget עוד פתוח: צריך את הטוקן של `onelev_bot`); חישוב שעות מחדש ⇒ `updateMissionTimerState`; חלוקת רווחים: סימון המכירות + שעון השתיקה נכנסו לתוך `createTosplit`, ועריכת הצעה עומדת ⇒ `updateTosplitProposal` (חדש — ההתאמה עברה לשרת כפונקציה טהורה `planTransfers`, עם בדיקת חברות, שייכות לרקמה וחלוקה שעוד לא נסגרה). 5 helpers מתים נמחקו (`createMesimabetahalich.js`, `func/moach/crtask`, `func/send/timeGrama`, `func/send/crratson`, `grid/nameAndPname`). הסריקה (`mutation` qid במחרוזת בקוד לקוח) מוצאת עכשיו רק הערות, שמות actions שזהים ל-qid, ו-`negotiation/[id]` (רפרנס). **לא נבדק חי** (חלוקת רווחים כותבת כסף אמיתי). **מחוץ לריפו:** `magik-meetings` ו-`consensus1lev1` מעבירים ל-`api.1lev1.com/api/send` (פגישות: ~14 mutations; מו"מ: 9) — אסור למחוק את ה-qids שלהם, וההעברה ל-`/api/action` היא עבודה שם. |
| B10 | דפי בדיקה ציבוריים: `test-socket`, `test-lev-socket`, `test-migration` | [x] 2026-10-08 — נמחקו |
| B11 | `socketClient.connect()` מפיל ובונה מחדש socket חי; ה-layouts של moach ושל forum קוראים לו בכל כניסה ⇒ אירועים אובדים בזמן החיבור מחדש | [x] 2026-10-08 — אותו משתמש עם socket מחובר/פעיל ⇒ no-op (בדיקה ב-`socketClient.test.ts`) |
| B12 | `VoteDetail` (עמוד הצבעה בודדת): ה-`$effect` שזורע את ה-stores קרא גם את `projectBase`, אז כל ריצה חוזרת של ה-layout (הצבעה אחרת ברקמה, המאזין הישן או מתאם moach) זרעה מחדש את העותק מהטעינה הראשונה מעל מה ש-`refetch()` קרא — סבב נגדי של חבר אחר "קפץ" חזרה לסבב הקודם. פגע גם במאזין הישן, לא רק ב-realtime | [x] 2026-10-11 — ה-effect עוקב רק אחרי `entity` (`untrack`) |
| B13 | `reopenForShiftHole` שלח את ההתראה ל-`projectMembers` לפי `projectIdParam: 'projectId'` — אבל אין לה פרמטר כזה (היא מקבלת `periodId` ו-`shiftId`), אז ההתראה "המשימה נפתחת למועמד נוסף" הגיעה לאף אחד. | [x] 2026-10-11 — ה-handler מחזיר `projectId`, ה-config קורא `data.projectId`, ו-`projectMembers` ב-`NotificationOrchestrator` נופל עכשיו לתוצאה כש-params לא מכיל את הרקמה (כמו ש-`specificUsers` כבר עשה). |
| B14 | `updateProjectDetails` ברקמה של יותר מחבר אחד לא משנה כלום — הוא פותח הצבעה (`Decision`) לכל שדה שהשתנה, עם שעון. ההתראה היחידה לחברים היא "פרטי הפרויקט עודכנו", בסוקט בלבד: הטקסט לא נכון (שום דבר עוד לא עודכן) ואין פוש לבקשת הסכמה. | [x] 2026-10-12 — `NotificationConfig.templatesFor(params, result)` (חדש, אופציונלי: מחזיר תבניות לריצה הזו או `undefined` = `templates`) + `intent` כפונקציה: כשנפתחו הצבעות — "הוצע שינוי בפרטי הרקמה — אפשר לאשר, לשוחח או להציע נגדית; בלי תגובה עד שהשעון נגמר השינוי מאושר" ב-`consent`; עדכון ישיר (רקמה של חבר אחד) — "פרטי הרקמה עודכנו" ב-`ambient`. בדיקות ב-`intent.test.ts`. |
| B15 | הודעה בצ'אט של פגישה (`sendMeetingMessage`) שלחה את ההתראה ל-`meetingParticipants`, שהעביר את **מזהה הפורום** לשאילתה `pgisha(id:)` — כלומר למשתתפי הפגישה שבמקרה יש לה אותו מספר כמו הפורום, או לאף אחד. | [x] 2026-10-11 — ה-action מקבל `meetingId` (דף הפגישה שולח `data.meeting.id`), וה-recipient `meetingParticipants` קורא `meetingIdParam`. לא נבדק חי. |

### התראות לבני אדם — באגים מהמיפוי

מיפוי 2026-10-08: הערוצים של כל action נקראו מה-registry בזמן ריצה (`config.notification`), ובקריאות
inline מהקובץ עצמו ומה-helpers (`deal/offerDeal.ts`, `sheirut/dealEdit.ts`, `wish/volunteerProposal.ts`).

| # | | סטטוס |
|---|---|---|
| N1 | נמען ב-ru/es מקבל פוש/טלגרם/מייל בשפת **השולח** (`selectLanguage` נפל ל-`context.lang`, ומשם לעברית) | [x] 2026-10-08 — `recipientTemplateLang`: השפה של הנמען; בלי תבנית לשפה שלו ⇒ אנגלית. שלושת השירותים + בדיקות. |
| N2 | מי שביצע את הפעולה מקבל פוש/טלגרם/מייל על עצמו בכל config בלי `excludeSender` (`addVote`, `timerSave`, `voteOn*`, `applyToMission`, …) | [x] 2026-10-08 — ה-orchestrator מסנן את היוזם מהערוצים החיצוניים תמיד; ה-socket לא השתנה (B8 / R1 מטפלים בו). |
| N3 | הערוצים נבחרים ביד בכל קובץ ⇒ 55 בקשות `consent` לא יוצאות מהאתר במלואן: `addVote` / `voteOn*` / `submitNego*` / `proposeRikmaIdentity` — socket בלבד; `counterOnAsk(m)`, `proposeObjectArchive`, `proposeStipend*`, `createSale` (תביעה על כסף של מישהו אחר), חתימת הלקוחה בעסקה (C-19) — בלי טלגרם ומייל. שתיקה של מי שלא שמע היא לא הסכמה. | [x] 2026-10-12 — כל ה-actions שנמנו כאן מצהירים `consent` (נבדק מול ה-registry בזמן ריצה). ה-ratchet `LEGACY_CHANNEL_LISTS` ריק: 9 הקבצים האחרונים עברו ל-`intent` לפי הקוד — `approveHaluka` ⇒ `outcome` (תוצאה רקמתית על כסף); `chat` (`createChatMessage`), `approveMeeting`, `joinMeeting`, `startMeeting` ⇒ `personal` (הודעה/פגישה של הנמען, שום דבר לא מחכה לתשובתו); `updateTask`, `archiveUserResource`, ההודעה של אורח בפגישה ⇒ `ambient`; `example.ts` (לא רשום — דוגמה לכתיבת config) הוסב גם הוא. |
| N4 | `specificUsers` בלי `userIds` (ריק / לא נמצא ב-result) נופל ל**כל חברי הרקמה** — הרחבה שקטה. עם `consent` זה מייל לכל הרקמה. | [x] 2026-10-12 — גם רשימה **חסרה** היא "אף אחד" (אזהרה בלוג); מזהה בודד (`requesterId`) נקרא כרשימה של אחד. `acceptRatsonProposal` עבר ל-`projectMembers` מפורש (שקורא את הרקמה מהתוצאה). סריקה של כל ה-`specificUsers` (שם הרשימה מופיע ב-handler/פרמטרים): נשארו בלי מקור רק `approve/rejectSheirutpend` — ראו N13 (הדחייה נכשלת ב-mutation ממילא, ולאישור אין קורא ב-UI), שעכשיו מגיעים לאף אחד במקום לחברי הרקמה עם "בקשתך אושרה". |
| N5 | הבשלה בשתיקה (timegrama) לא מודיעה לאף אחד — הצד השני של B9 | [x] 2026-10-11 — **לא נבדק חי** (ריצה מבשילה שעונים אמיתיים). כל handler קורא ל-`tellMatured` (`$lib/server/notifications/matured.ts`) בנקודה שבה הוא באמת הבשיל — לא על שעון שרק נסגר — עם הודעה מ-`maturedNotices.ts` (מודול טהור, he/en/ar, נבדק). ה-intent לפי התאום המפורש: תוצאה לכל הרקמה ⇒ `outcome` לחברים (pendm, pmash, finiapruval, tosplit, maap, sheirutpend, archive/edit, stipend, שינוי פרטי רקמה, roster, הסרה בסוף מחזור); על אדם אחד ⇒ `personal` (המועמד שהתקבל, saleClaim לשני הצדדים בלבד, הצעת מחיר ללקוח, askwant, תשלום מלגה); הבשלה שפותחת סבב שמחכה למישהו ⇒ `consent` — משימה שהוצעה על שם מישהו (השתיקה **שלו** לא נספרת), גרסה שמחכה לחתימת הלקוחה (C-14) או המממן, והצעת שחרור בגלל רדימות (למחזיק ולחברים). מי שמקבל הודעה אישית מוצא מההודעה לרקמה (`except`). הצעה על שם מישהו שפגה ⇒ הוא והרקמה שומעים שהיא חזרה. `wishProposal` כבר מודיע דרך `acceptWishOffer`. ה-dispatcher מעביר `fetch` לכל ה-handlers. מחוץ ל-N5 ונשאר: שעון שנסגר **בלי** הבשלה (התנגדות, אף חבר לא אישר — askwant D2) עדיין שקט — `docs/tbd/TIMEGRAMA_REMINDERS.md` |
| N6 | התבניות הן `{he, en, ar}` בלבד ⇒ ru/es קוראים אנגלית (N1). התיקון המלא הוא `notification.notice` של [`PLAN_SMART_NOTICES`](../inprogress/PLAN_SMART_NOTICES.md) שלב 6 — **לא** להוסיף es/ru ידנית ל-140 תבניות | [ ] SMART_NOTICES שלב 6 |
| N7 | נתיבי התראה ישנים: `/api/nutiUser`, `/api/nutifyPm`, `nutifyUser.svelte`, `pusherer.svelte`, `bolkMail.svelte` (`HalukaNotificationService` נמחק 2026-10-08, ראו B5) — כמעט מתים (רק `timegrama/stipendPayment.svelte` קורא ל-`nutiUser`) | [x] 2026-10-11 — נמחקו, יחד עם `sendBolkTelegram.svelte` שרק הם השתמשו בו. הבשלת מלגה בשתיקה מודיעה עכשיו דרך ה-orchestrator (`serverNotifier` מ-`$lib/server/actions`, `personal`, קישור ל-`/moach/<pid>/stipend`) — אותו מסלול ש-N5 ישתמש בו. `/api/nuti` ו-`/api/sma` נשארו (יש להם קוראים); `relay.test.ts` עודכן |
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
| `moach/[pid]/votes` | onMount | 🟢 | `loadVotes()` על `VOTE_TYPES` | `decision:*` | [x] 2026-10-10 — `useRealtime(project:<pid>)` + `touchesVotes`; נבדק חי 2026-10-10 (הזרקה ל-bus בטאב של 258): הצבעה ⇒ `getProjectVotes` + התג, מכירה ⇒ כלום. המאזין הישן הוסר ב-R6 (2026-10-11) |
| `moach/[pid]/votes/[kind]/[id]` | load + `VoteDetail` | 🟢 | `refetch()` על `VOTE_TYPES` | `decision:<kind>:<id>` | [~] 2026-10-10 — `VoteDetail`: `useRealtime(decision:<kind>:<id>)` (`fini` ⇒ `finiapruval`); לא נבדק חי — צריך הצבעה פתוחה |
| `moach/[pid]/votes/[voteId]` | `VoteDetail` | 🟢 | כנ"ל | `decision:*:<id>` | n/a — פתק הצבעה בודד (`Vote`), לא משתנה |
| `deals/[id]` | load | ⚪ | — | `deal:<id>` | [~] 2026-10-10 — `depends(rt:deal:<id>)`; לא נבדק חי (אותו מנגנון כמו progress/[missionId]) |
| `deals/offers/[id]` | load | ⚪ | — | `deal:<id>` | [~] 2026-10-10 — `depends(rt:deal:<id>)`; לא נבדק חי |
| `wish/[id]` | load | ⚪ | — | `wish:<id>` | [~] 2026-10-10 — `depends(rt:wish:<id>)`; לא נבדק חי |
| `concierge/[id]` | load | ⚪ | — | `wish:<id>` | [~] 2026-10-10 — `depends(rt:wish:<id>)`; לא נבדק חי |
| `negotiation/[id]` | load | ⚪ | — | `decision:*:<id>` / `mission:<id>` | [—] 2026-10-12 — **דולג.** הדף אינו בשימוש בפרודקשין: הוא התפתח לאתר consensus (`consensus1lev1`), ושם כל המו"מ מתנהל; נשמר כרפרנס, עם הערה בראש הקובץ. |
| `project/[id]` · `r/[slug]` | load (`RikmaPage`) | 🟡 | `invalidate('project:<id>')` על `VOTE_TYPES` | `project:<pid>` | [x] 2026-10-10 — `loadRikmaPage`: `depends(rt:project:<pid>)`; נבדק חי 2026-10-10 (הזרקה ל-bus בטאב של 258): רקמה 87 ⇒ `__data.json` אחד, רקמה אחרת ⇒ כלום. המאזין הישן הוסר ב-R6 (2026-10-11) |

### גל 2 (R5)

| דף | מקור | היום | scopes יעד | סטטוס |
|---|---|---|---|---|
| `/timers` | timers store | 🟢 | `timer:<me>` | [x] 2026-10-11 — `listenForTimerChanges` (bus, `timer:<me>`) במקום `initialWebSocketForTimer`; גם בלב ובשני דפי ה-progress של moach. לא נבדק חי |
| `/forum` · `/forum/[forumId]` | load | 🟢 | `forum:*` / `forum:<id>` (היום `app:forums`, `app:forum:<id>`) | [x] 2026-10-11 — `depends(rt:forum:*` / `rt:forum:<id>)`; לא נבדק חי. המאזין של ה-layout הוסר ב-R6; `app:forums` / `app:forum:<id>` נשארו ל-`actionClient` של הטאב השולח |
| `/meeting/[id]` | load + patch | 🟢 | `meeting:<id>` (ה-patch לפי `metadata.type` נשאר) | n/a — הדף מעתיק את ה-data ל-state פעם אחת, אז `depends` לא היה מגיע למסך; ה-patch לפי `metadata.type` נשאר (כמו בתוכנית) |
| `/meeting` | load | ⚪ | `meeting:*`, `user:<me>` | [x] 2026-10-11 — `depends(rt:meeting:*`, `rt:user:*)`; לא נבדק חי |
| `/me` | load + userStore | 🟢 | `user:<me>` (היום `app:meProfile`) | [x] 2026-10-11 — `depends(rt:user:*)`; **נבדק חי** (258, `toggleGuideStatus` עם הערך הקיים): load הדף בלבד רץ פעם אחת (`invalidated=001`), בלי ריענון דף |
| `/me/income` | load | 🟡 | `user:<me>`, `split:*`, `sale:*` | [x] 2026-10-11 — `depends(rt:user:*`, `rt:split:*`, `rt:sale:*)`; לא נבדק חי |
| `/me/offerings` · `/me/resources` · `/me/shifts` | load | ⚪ | `user:<me>`, `product:*` / `resource:*` / `shift:*` | [x] 2026-10-11 — `depends(rt:user:*` + `product:*` / `resource:*` / `shift:*)`; לא נבדק חי |
| `/sales-center` · `deals/sales-center` | load | ⚪ | `sale:*`, `deal:*` | [x] 2026-10-11 — `depends(rt:sale:*`, `rt:deal:*)`; לא נבדק חי (`/sales-center` הוא redirect) |
| `/deals` · `deals/offers` · `deals/request/[id]` | load | ⚪ | `deal:*` | [x] 2026-10-11 — `depends(rt:deal:*` / `rt:deal:<id>)`; לא נבדק חי |
| `/concierge` | load | ⚪ | `wish:*` | [x] 2026-10-11 — `depends(rt:wish:*)`; לא נבדק חי |
| `/moach` (רשימת הרקמות) | load | ⚪ | `project:*` | [x] 2026-10-11 — `depends(rt:project:*)`; לא נבדק חי |
| `moach/[pid]/chains` | load + moachStore | 🟢 (R0: section חי) | `mission:*`, `resource:*`, `financials` | [x] 2026-10-11 — ה-`missions` כבר חי; `chainsExtra` (משאבים פתוחים, ארכיון) הוחלף רק בכניסה הראשונה — עכשיו ה-load תלוי ב-`resource:*`/`mission:*` וכל ריצה מחליפה אותו; לא נבדק חי |
| `moach/[pid]/chains/[chainId]` | onMount | 🔴 | `mission:*`, `resource:*` | [x] 2026-10-11 — `useRealtime(mission:*, resource:*, act:*)` מסונן לרקמה ⇒ טעינה שקטה; לא נבדק חי |
| `moach/[pid]/processes` | moachStore | 🟠 | `process:*` | [x] 2026-10-11 — `useRealtime(process:*, mission:*, resource:*)` מסונן לרקמה; לא נבדק חי |
| `moach/[pid]/processes/[processId]` | onMount | 🔴 | `process:<id>` | [x] 2026-10-11 — `useRealtime` על ישויות מחזור החיים, מסונן לרקמה; לא נבדק חי |
| `moach/[pid]/services` | moachStore | 🟠 | `deal:*` | [x] 2026-10-11 — קורא `base.sheiruts`, ו-`deal` מנותב רק ל-`financials` ⇒ `useRealtime(deal:*)` מבטל את `moachBaseKey`; לא נבדק חי |
| `moach/[pid]/sales/[saleId]` | moachStore | 🟠 | `sale:<id>` | [x] 2026-10-11 — `useRealtime(sale:*)` מסונן לרקמה; לא נבדק חי |
| `moach/[pid]/splits/[splitId]` | moachStore | 🟠 | `split:<id>` | [x] 2026-10-11 — `useRealtime(split:*, decision:tosplit:*)` מסונן לרקמה; לא נבדק חי |
| `moach/[pid]/timers` | moachStore | 🟠 | `timer:*` של חברי הרקמה | [~] 2026-10-11 — ה-section `missions` מתעדכן כשטיימר נשמר; טיימר **רץ** מפורסם רק למכשירים של בעליו (`timer:<uid>` · self, החלטת R4), אז הוא לא יופיע אצל אחרים עד השמירה |
| `moach/[pid]/create` | moachStore | 🟠 | `project:<pid>` (רשימות הבחירה בטופס) | n/a — טופס; רשימות הבחירה נקראות בכניסה |
| `moach/[pid]/stipend` | onMount | 🔴 | `stipend:*` | [x] 2026-10-11 — `useRealtime(stipend:*)` מסונן לרקמה; לא נבדק חי |
| `moach/[pid]/object/[type]` · `object/[type]/[id]` | onMount | 🔴 | `mission:<id>` / `resource:<id>` / `product:<id>` | [x] 2026-10-11 — `useRealtime` על ישויות מחזור החיים, מסונן לרקמה; לא נבדק חי |
| `moach/[pid]/edit` | layout data | 🟢 | `project:<pid>` → `base` (התראת "השתנה בזמן שערכת", לא רענון) | [x] 2026-10-12 — מיזוג תלת-כיווני לפי שדות (`$lib/realtime/editMerge.ts`, טהור): כשמתאם moach קורא מחדש את `projectBase`, `EditProjectDetails` משווה אותו לגרסה שממנה הטופס התחיל — שדה שהחבר לא נגע בו מתעדכן בשקט (הודעת `updatedQuietly`), שדה ששני הצדדים שינו אחרת מוצג כקונפליקט עם "לטעון את הגרסה החדשה" / "להשאיר את שלי". נקבע לפי הנתונים ולא לפי אירועים — כמעט כל action ברקמה מפרסם `project:<pid>`. תיאור עשיר נבדק לפי טקסט (blocks מול HTML). נבדק ברכיב (`EditProjectDetails.svelte.test.ts`), לא בשני דפדפנים |
| `moach/[pid]/resources` | load | ⚪ | `resource:*` | [x] 2026-10-11 — `depends(rt:resource:*)`; לא נבדק חי |
| `moach/[pid]/shifts` | load | ⚪ | `shift:*` | [x] 2026-10-11 — `depends(rt:shift:*)`; לא נבדק חי |
| `moach/[pid]/wishes` | load | ⚪ | `wish:*` | [x] 2026-10-11 — `depends(rt:wish:*)`; לא נבדק חי |
| `moach/[pid]/archive` | load | ⚪ | `mission:*`, `resource:*`, `product:*` | [x] 2026-10-11 — `depends(rt:mission:*`, `resource:*`, `product:*)`; לא נבדק חי |
| `moach/[pid]/demand` | load | ⚪ | `mission:*`, `resource:*` | [x] 2026-10-11 — `depends(rt:mission:*`, `rt:resource:*)`; לא נבדק חי |
| `moach/[pid]/docs` | load | ⚪ | לבדוק: אולי מכוסה כבר ב-`space:changed` (ערוץ נפרד, לא לגעת) | [x] 2026-10-11 — `depends(rt:doc:*)` (ישות `doc` חדשה, R4); `space:changed` הוא ערוץ אחר (ה-Space), לא נגעתי; לא נבדק חי |
| `moach/[pid]/look` | load | ⚪ | `project:<pid>` | [x] 2026-10-11 — כבר מכוסה: `loadRikmaPage` מצהיר `depends(rt:project:<pid>)` (R3) |
| `/myacts` | onMount | 🔴 | `act:*`, `user:<me>` | [x] 2026-10-11 — `useRealtime(act:*, mission:*)` ⇒ `fetchMyActs`; אחרי קריאה עצמית מוצג `myActsStore` ולא העותק של הלב; **נבדק חי** (256 ⇒ `updateTask` על מטלה 134 עם הערך הקיים; טאב של 258): בקשה אחת, בלי ריענון דף |
| `/myCalander` · `/newTimers` | onMount | 🔴 | `timer:<me>` | [x] 2026-10-11 — `useRealtime(timer:*)` (טעינה שקטה); לא נבדק חי |
| `availableMission` · `availableMission/[id]` | load | ⚪ | `mission:*` / `mission:<id>` | [x] 2026-10-11 — `depends(rt:mission:*` / `rt:mission:<id>)`; לא נבדק חי — מגיע רק לחברי הרקמה (קהל השינוי), כמו ה-`fullRefresh` שהחליף |
| `availiableResorce` · `availiableResorce/[id]` | load | ⚪ | `resource:*` / `resource:<id>` | [x] 2026-10-11 — `depends(rt:resource:*` / `rt:resource:<id>)`; לא נבדק חי |
| `/demand` | load | ⚪ | `mission:*`, `resource:*` | [x] 2026-10-11 — `depends(rt:mission:*`, `rt:resource:*)`; לא נבדק חי |
| `gift` · `gift/[id]` | load | ⚪ | `product:*` / `product:<id>` | [x] 2026-10-11 — `depends(rt:product:*` / `rt:product:<id>)`; לא נבדק חי |
| `maagad/[id]` | load | ⚪ | `maagad:<id>` | [x] 2026-10-11 — `depends(rt:maagad:<id>)`; לא נבדק חי |
| `offer/[key]` | load | ⚪ | `deal:*` | [x] 2026-10-11 — `depends(rt:deal:*)`; לא נבדק חי |
| `preview/rikma/[shareKey]` | load | ⚪ | `project:<pid>` | n/a — תצוגה של סשן עוזר, לא של רקמה; הצופים מחוץ לקהל של כל שינוי |
| `/project` · `project/[id]/join` · `project/[id]/support` | load | ⚪ | `project:*` / `project:<pid>` (ל-support יש כבר `depends('project-support:…')` שאף אחד לא מבטל) | [x] 2026-10-11 — `depends(rt:project:*` / `rt:project:<id>)`; לא נבדק חי |
| `user/[id]` | load | ⚪ | `user:<id>` | [x] 2026-10-11 — `depends(rt:user:<id>)`; לא נבדק חי |

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
| `applyAssistantSession` | assistantSessions | none |  | — |  | — | — | `user:<me>` · self (הסשן של הבעלים בלבד) — מה שנכתב לפרופיל/למשאלה מפורסם דרך ה-actions שהוא קורא | [x] 2026-10-11 — לא נבדק חי |
| `attachEntityToProcess` | attachEntityToProcess | none |  | — |  | — ⚠ | A | `project`, `process`, הישות (`mission` / `resource` / `decision:maap|pendm|pmash`) | [x] 2026-10-11 — לא נבדק חי |
| `cacheTranslations` | cacheTranslations | none |  | — |  | — | — | אין — `scopes: () => []` במכוון (מטמון לפי תוכן, נקרא רק בטעינה) | [x] 2026-10-11 — לא נבדק חי |
| `checkRikmaSlug` | checkRikmaSlug | read-only |  |  |  |  |  |  | n/a |
| `claimAssistantSession` | assistantSessions | none |  | — |  | — | — | `user:<me>` · self (הסשן של הבעלים בלבד) | [x] 2026-10-11 — לא נבדק חי |
| `claimGithubWork` | githubActions | config | projectMembers (−me) | toast | base → moach(lazy) | intent ✓ | C | `project`, `mission`, `timer:<uid>`, `decision:finiapruval` | [x] 2026-10-11 — לא נבדק חי |
| `createPlanBoard` | planningBoards | none |  | — |  | — | — | `project`, `plan` (הלוח) | [x] 2026-10-11 — לא נבדק חי |
| `createPlanBoardFromItems` | planningRuns | none |  | — |  | — | — | `project`, `plan` (הלוח) | [x] 2026-10-11 — לא נבדק חי |
| `createPlanBoardFromText` | planningRuns | none |  | — |  | — | — | `project`, `plan` (הלוח) | [x] 2026-10-11 — לא נבדק חי |
| `createPlanItem` | planningBoards | none |  | — |  | — | — | `project`, `plan` (הלוח) | [x] 2026-10-11 — לא נבדק חי |
| `createProcess` | createProcess | none |  | — |  | — ⚠ | A | `project`, `process` | [x] 2026-10-11 — לא נבדק חי |
| `createSpaceDoc` | spaceDocs | none |  | — |  | — ⚠ | A | `project`, `doc` | [x] 2026-10-11 — לא נבדק חי |
| `createWeave` | createWeave | none |  | — |  | — | — | `project` (החדשה), `user:<me>` | [x] 2026-10-11 — לא נבדק חי |
| `createWorkWay` | createWorkWay | none |  | — |  | — | — | `user:<me>` · self | [x] 2026-10-11 — לא נבדק חי |
| `dismissExternalOffer` | fetchExternalOffers | none |  | — |  | — | — | `wish` · self | [x] 2026-10-11 — לא נבדק חי |
| `expandPlanBoard` | planningRuns | none |  | — |  | — | — | `project`, `plan` (הלוח) | [x] 2026-10-11 — לא נבדק חי |
| `fetchExternalOffers` | fetchExternalOffers | read-only |  |  |  |  |  |  | n/a |
| `getAssistantSession` | assistantSessions | read-only |  |  |  |  |  |  | n/a |
| `githubIssueClosed` | githubActions | config | specificUsers | toast | base → moach(lazy) | intent ✓ | P | — | n/a — לא כותב כלום; קיים בשביל ההתראה (READ_ONLY) |
| `githubWorkClaimable` | githubActions | config | specificUsers | toast | base → moach(lazy) | intent ✓ | P | — | n/a — לא כותב כלום; קיים בשביל ההתראה (READ_ONLY) |
| `importPlanBoardRows` | assistantSessions | none |  | — |  | — | — | `user:<me>` · self (הסשן של הבעלים בלבד) | [x] 2026-10-11 — לא נבדק חי |
| `linkGithubAccount` | githubActions | none |  | — | base | — | — | `user:<userId>` · parties: החבר | [x] 2026-10-11 — לא נבדק חי |
| `markPlanItemCreated` | planningBoards | none |  | — |  | — | — | `project`, `plan` (הלוח) | [x] 2026-10-11 — לא נבדק חי |
| `reviseAssistantSession` | assistantSessions | none |  | — |  | — | — | `user:<me>` · self (הסשן של הבעלים בלבד) | [x] 2026-10-11 — לא נבדק חי |
| `seedPlanBoards` | planningRuns | none |  | — |  | — | — | `project`, `plan` לכל לוח שנזרע | [x] 2026-10-11 — לא נבדק חי |
| `setAssistantItems` | assistantSessions | none |  | — |  | — | — | `user:<me>` · self (הסשן של הבעלים בלבד) | [x] 2026-10-11 — לא נבדק חי |
| `setGithubInstallationStatus` | githubActions | none |  | — | base | — | — | `project` לכל רקמה שמאגר שלה השתנה | [x] 2026-10-11 — לא נבדק חי |
| `setSupportPage` | setSupportPage | none |  | — |  | — ⚠ | A | `project` | [x] 2026-10-11 — לא נבדק חי |
| `startAssistantSession` | assistantSessions | none |  | — |  | — | — | `user:<me>` · self (הסשן של הבעלים בלבד) | [x] 2026-10-11 — לא נבדק חי |
| `undoAssistantRevision` | assistantSessions | none |  | — |  | — | — | `user:<me>` · self (הסשן של הבעלים בלבד) | [x] 2026-10-11 — לא נבדק חי |
| `unlinkGithubAccount` | githubActions | none |  | — | base | — | — | `user:<me>` · self | [x] 2026-10-11 — לא נבדק חי |
| `updatePlanBoard` | planningBoards | none |  | — |  | — | — | `project`, `plan` (הלוח) | [x] 2026-10-11 — לא נבדק חי |
| `updatePlanItem` | planningBoards | none |  | — |  | — | — | `project`, `plan` (הלוח) | [x] 2026-10-11 — לא נבדק חי |
| `updateSpaceDoc` | spaceDocs | none |  | — |  | — | — | `project`, `doc` | [x] 2026-10-11 — לא נבדק חי |

### timer — 5 actions (live 0 · full 0 · toast 5 · silent 0 · read-only 0)

| action | file | socket today | recipients | effect for others | metadata.type → who reacts | ערוצים היום | intent יעד | target scopes | status |
|---|---|---|---|---|---|---|---|---|---|
| `timerLogUpdate` | timerLogUpdate | config | specificUsers | toast ⚠cfgUS lost | timerEdit → timers-store | intent ✓ | A | `timer:<uid>` · self | [x] 2026-10-11 — עוד לא נבדק בשני דפדפנים |
| `timerSave` | timerSave | config | projectMembers | toast ⚠cfgUS lost | timerUpdate → timers-store | intent ✓ | O·C | `project`, `mission`, `timer:<uid>` | [x] 2026-10-11 — עוד לא נבדק בשני דפדפנים |
| `timerStart` | timerStart | config | specificUsers | toast ⚠cfgUS lost | timerUpdate → timers-store | intent ✓ | A | `timer:<uid>`, `mission` · self | [x] 2026-10-11 — עוד לא נבדק בשני דפדפנים |
| `timerStop` | timerStop | config | specificUsers | toast ⚠cfgUS lost | timerUpdate → timers-store | intent ✓ | A | `timer:<uid>` · self | [x] 2026-10-11 — עוד לא נבדק בשני דפדפנים |
| `updateMissionTimerState` | updateMissionTimerState | config | projectMembers (−me) | toast | timerState → timers-store | intent ✓ | A | `project`, `mission` | [x] 2026-10-11 — עוד לא נבדק בשני דפדפנים |

### meeting — 6 actions (live 0 · full 0 · toast 6 · silent 0 · read-only 0)

| action | file | socket today | recipients | effect for others | metadata.type → who reacts | ערוצים היום | intent יעד | target scopes | status |
|---|---|---|---|---|---|---|---|---|---|
| `approveMeeting` | approveMeeting | inline |  | toast ⚠cfgUS lost | meetingUpdate → meeting-page<br>meetingConfirmed → meeting-page | חלקי | ? (הצטרפות `O` ✓; "אושרה סופית" נשאר SPE — `outcome` מוריד מייל) | `meeting` · parties: משתתפי הפגישה (`meetingPartiesOf`) | [x] 2026-10-11 — לא נבדק חי |
| `createNewMeeting` | createNewMeeting | inline |  | toast ⚠cfgUS lost | meeting → meeting-page | intent ✓ | C | `meeting` · parties: המוזמנים (`selected`) + המשתתפים | [x] 2026-10-11 — לא נבדק חי |
| `joinMeeting` | joinMeeting | inline |  | toast ⚠cfgUS lost | participantReady → meeting-page<br>meetingStarted → meeting-page | חלקי | ? ("מוכן" `A` ✓; "הפגישה התחילה" נשאר SPE — מוריד מייל) | `meeting` · parties: משתתפי הפגישה (`meetingPartiesOf`) | [x] 2026-10-11 — לא נבדק חי |
| `sendMeetingMessage` | sendMeetingMessage | config | meetingParticipants (−me) | toast ⚠cfgUS lost | meetingMessage → meeting-page | intent ✓ | A | `meeting`, `forum` (ראו B15) | [x] 2026-10-11 — לא נבדק חי |
| `startMeeting` | startMeeting | inline |  | toast ⚠cfgUS lost | meetingJoinRequest → meeting-page<br>meetingStarted → meeting-page | חלקי | ? (בקשת התחלה `O` ✓; "הפגישה התחילה" נשאר SPE — מוריד מייל) | `meeting` · parties: משתתפי הפגישה (`meetingPartiesOf`) | [x] 2026-10-11 — לא נבדק חי |
| `toggleOnline` | toggleOnline | inline |  | toast ⚠cfgUS lost | userAvailability → meeting-page<br>meetingReady → meeting-page | intent ✓ | O / A (לפי status) | `user:<me>`, `meeting` לכל פגישה שהזמינות בה השתנתה | [x] 2026-10-11 — לא נבדק חי |

### chat — 16 actions (live 1 · full 0 · toast 3 · silent 2 · read-only 10)

| action | file | socket today | recipients | effect for others | metadata.type → who reacts | ערוצים היום | intent יעד | target scopes | status |
|---|---|---|---|---|---|---|---|---|---|
| `addAskChatEntry` | addAskChatEntry | none |  | — |  | — ⚠ | P | `project`, `decision:ask` · + המועמד | [x] 2026-10-11 — לא נבדק חי |
| `addAskmChatEntry` | addAskmChatEntry | none |  | — |  | — ⚠ | P | `project`, `decision:askm` · + המועמד | [x] 2026-10-11 — לא נבדק חי |
| `addDiunEntry` | addDiunEntry | config | projectMembers (−me) | toast | diunEntry → moach(lazy) | intent ✓ | A | `project`, `decision:pendm|pmash` | [x] 2026-10-11 — לא נבדק חי |
| `addHalukaChatEntry` | addHalukaChatEntry | config | projectMembers (−me) | toast | halukaChatEntry → moach(lazy) | intent ✓ | A | `project`, `split` | [x] 2026-10-11 — לא נבדק חי |
| `createChatMessage` | chat | config | specificUsers (−me) | partial(lev) | chatMessage → forum+chat-store | SPTE ✂ | ? (SPTE נשאר — `personal` מוריד מייל למי שיש לו פוש/טלגרם) | `forum` · parties: משתתפי הפורום (אף פעם לא כל הרקמה — דו-צדדי בתביעת מכירה) | [x] 2026-10-11 — לא נבדק חי |
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
| `sendAskMessage` | sendAskMessage | config | askParticipants (−me) | toast ⚠cfgUS lost | askMessage → header-chat | intent ✓ | P | `project`, `decision:ask`, `forum` · + המועמד | [x] 2026-10-11 — לא נבדק חי |

### wish — 21 actions (live 0 · full 0 · toast 8 · silent 13 · read-only 0)

| action | file | socket today | recipients | effect for others | metadata.type → who reacts | ערוצים היום | intent יעד | target scopes | status |
|---|---|---|---|---|---|---|---|---|---|
| `acceptRatsonProposal` | acceptRatsonProposal | config | specificUsers (−me) | toast | ratsonProposal → moach(lazy)<br>sheirutUpdate → moach(lazy) | intent ✓ | C | `wish` (← בעלי המשאלה והמציעים, `partiesOf`) | [x] 2026-10-11 — עוד לא נבדק בשני דפדפנים |
| `acceptWishOffer` | acceptWishOffer | inline |  | toast | ratsonProposal → moach(lazy) | intent ✓ | P·C | `wish` (← בעלי המשאלה והמציעים, `partiesOf`) | [x] 2026-10-11 — עוד לא נבדק בשני דפדפנים |
| `clusterRatsons` | maagad | none |  | — | maagad | — | — | `maagad` לכל מאגד שנוצר · parties: המוזמנים | [x] 2026-10-11 — לא נבדק חי |
| `counterRatsonProposal` | counterRatsonProposal | none |  | — | ratsonProposal | intent ✓ | C | `wish` (← בעלי המשאלה והמציעים, `partiesOf`) | [x] 2026-10-11 — עוד לא נבדק בשני דפדפנים |
| `createRatson` | createRatson | none |  | — |  | — | — | `wish` (החדשה) | [x] 2026-10-11 — עוד לא נבדק בשני דפדפנים |
| `declineWishOffer` | declineWishOffer | config | specificUsers | toast | ratsonProposal → moach(lazy) | intent ✓ | P | `wish` (← בעלי המשאלה והמציעים, `partiesOf`) | [x] 2026-10-11 — עוד לא נבדק בשני דפדפנים |
| `hideRatsonProposal` | hideRatsonProposal | none |  | — |  | — | — | `wish` (← בעלי המשאלה והמציעים, `partiesOf`) | [x] 2026-10-11 — עוד לא נבדק בשני דפדפנים |
| `matchRatson` | matchRatson | none |  | — |  | — | — | `wish` (← בעלי המשאלה והמציעים, `partiesOf`) | [x] 2026-10-11 — עוד לא נבדק בשני דפדפנים |
| `materializeRikmaBlueprint` | assistantSessions | none |  | — |  | — | — | `user:<me>`, `project` (החדשה או זו שיובאו אליה) | [x] 2026-10-11 — לא נבדק חי |
| `materializeWish` | materializeWish | config | specificUsers | toast | sheirutCreated → moach(lazy) | intent ✓ | P | `wish`, `project` (הרקמה שנוצרה), `product`, `deal` ×2 | [x] 2026-10-11 — עוד לא נבדק בשני דפדפנים |
| `offerNewProductsToWishes` | offerNewProductsToWishes | config | specificUsers | toast | ratsonProposal → moach(lazy) | intent ✓ | P | `project`, `product` · +`recipientIds` | [x] 2026-10-11 — עוד לא נבדק בשני דפדפנים |
| `offerWishHelp` | offerWishHelp | config | specificUsers | toast | ratsonProposal → moach(lazy) | intent ✓ | C | `wish` (← בעלי המשאלה והמציעים, `partiesOf`) | [x] 2026-10-11 — עוד לא נבדק בשני דפדפנים |
| `publishWishNeedToCommunity` | publishWishNeedToCommunity | none |  | — |  | — | — | `wish` (← בעלי המשאלה והמציעים, `partiesOf`) | [x] 2026-10-11 — עוד לא נבדק בשני דפדפנים |
| `refreshWishMatches` | refreshWishMatches | none |  | — |  | — | — | `wish` (← בעלי המשאלה והמציעים, `partiesOf`) | [x] 2026-10-11 — עוד לא נבדק בשני דפדפנים |
| `rejectRatsonProposal` | rejectRatsonProposal | none |  | — |  | — ⚠ | A | `wish` (← בעלי המשאלה והמציעים, `partiesOf`) | [x] 2026-10-11 — עוד לא נבדק בשני דפדפנים |
| `requestWishMission` | requestWishMission | config | specificUsers | toast | ratsonProposal → moach(lazy) | intent ✓ | C | `wish` (← בעלי המשאלה והמציעים, `partiesOf`) | [x] 2026-10-11 — עוד לא נבדק בשני דפדפנים |
| `requestWishResource` | requestWishResource | config | specificUsers | toast | ratsonProposal → moach(lazy) | intent ✓ | C | `wish` (← בעלי המשאלה והמציעים, `partiesOf`) | [x] 2026-10-11 — עוד לא נבדק בשני דפדפנים |
| `setWishRestime` | setWishRestime | none |  | — |  | — ⚠ | P | `wish` (← בעלי המשאלה והמציעים, `partiesOf`) | [x] 2026-10-11 — נבדק בשלושה דפדפנים |
| `updateRatsonDraft` | updateRatsonDraft | none |  | — |  | — | — | `wish` (← בעלי המשאלה והמציעים, `partiesOf`) | [x] 2026-10-11 — עוד לא נבדק בשני דפדפנים |
| `updateRatsonExtraction` | updateRatsonExtraction | none |  | — |  | — | — | `wish` (← בעלי המשאלה והמציעים, `partiesOf`) | [x] 2026-10-11 — עוד לא נבדק בשני דפדפנים |
| `updateWishTerms` | updateWishTerms | none |  | — |  | — ⚠ | P | `wish` (← בעלי המשאלה והמציעים, `partiesOf`) | [x] 2026-10-11 — עוד לא נבדק בשני דפדפנים |

### deal — 22 actions (live 2 · full 0 · toast 13 · silent 5 · read-only 2)

| action | file | socket today | recipients | effect for others | metadata.type → who reacts | ערוצים היום | intent יעד | target scopes | status |
|---|---|---|---|---|---|---|---|---|---|
| `acceptSheirutQuote` | sheirutQuote | config | specificUsers (−me) | toast | sheirutUpdate → moach(lazy) | intent ✓ | P | `deal` (הבקשה + השירות שנוצר) · parties: `recipientIds` | [x] 2026-10-11 — עוד לא נבדק בשני דפדפנים |
| `approveSheirutpend` | approveSheirutpend | config | specificUsers | toast ⚠cfgUS lost | sheirutUpdate → moach(lazy) | intent ✓ (N13) | P | `project`, `deal` | [x] 2026-10-11 — עוד לא נבדק בשני דפדפנים |
| `claimDirectOffer` | directOffer | inline |  | toast | directOffer → moach(lazy) | intent ✓ | P | `wish` (← בעלי המשאלה והמציעים, `partiesOf`) | [x] 2026-10-11 — עוד לא נבדק בשני דפדפנים |
| `confirmDealPartReceived` | confirmDealPartReceived | config | specificUsers | toast | dealPaid → moach(lazy) | intent ✓ | P | `deal` · parties: כל הלקוחות והספקים (`partyIds`) | [x] 2026-10-11 — עוד לא נבדק בשני דפדפנים |
| `confirmSheirutHaluka` | confirmSheirutHaluka | none |  | — |  | intent ✓ | P | `split` · parties: `recipientIds` | [x] 2026-10-11 — עוד לא נבדק בשני דפדפנים |
| `counterDealEdit` | counterDealEdit | inline |  | toast | voteUpdate → votes+rikma+moach(lazy) | intent ✓ | C | `project`, `decision:decision`, `deal`, `mission` · +הלקוחות | [x] 2026-10-11 — עוד לא נבדק בשני דפדפנים |
| `createSheirutHaluka` | createSheirutHaluka | none |  | — |  | intent ✓ | C | `project`, `deal`, `split` · +המקבל | [x] 2026-10-11 — עוד לא נבדק בשני דפדפנים |
| `createSheirutpend` | createSheirutpend | config | projectMembers (−me) | toast ⚠cfgUS lost | sheirutUpdate → moach(lazy) | intent ✓ | C | `project`, `deal` | [x] 2026-10-11 — עוד לא נבדק בשני דפדפנים |
| `draftDirectOffer` | draftDirectOffer | none |  | — |  | — | — | `wish`, `product` | [x] 2026-10-11 — עוד לא נבדק בשני דפדפנים |
| `getDealDue` | getDealDue | read-only |  |  |  |  |  |  | n/a |
| `getSheirutpendQuote` | sheirutQuote | read-only |  |  | sheirutUpdate |  |  |  | n/a |
| `issueDirectOfferLink` | directOffer | inline |  | toast | directOffer → moach(lazy) | — | — | `wish` (← בעלי המשאלה והמציעים, `partiesOf`) | [x] 2026-10-11 — עוד לא נבדק בשני דפדפנים |
| `noteSheirutpend` | sheirutQuote | none |  | — | sheirutUpdate | — ⚠ | P | `deal` · parties: `recipientIds` | [x] 2026-10-11 — עוד לא נבדק בשני דפדפנים |
| `proposeSheirut` | proposeSheirut | config | projectMembers (−me) | partial(lev) | sheirutUpdate → moach(lazy) | intent ✓ | C | `project`, `deal` | [x] 2026-10-11 — עוד לא נבדק בשני דפדפנים |
| `quoteSheirutpend` | sheirutQuote | config | specificUsers (−me) | toast | sheirutUpdate → moach(lazy) | intent ✓ | C | `deal` (הבקשה + השירות שנוצר) · parties: `recipientIds` | [x] 2026-10-11 — עוד לא נבדק בשני דפדפנים |
| `rejectSheirutpend` | rejectSheirutpend | config | specificUsers | toast ⚠cfgUS lost | sheirutUpdate → moach(lazy) | intent ✓ (N13) | P | `project`, `deal` | [x] 2026-10-11 — עוד לא נבדק בשני דפדפנים |
| `requestSheirutJoin` | requestSheirutJoin | config | projectMembers (−me) | partial(lev) | sheirutUpdate → moach(lazy) | intent ✓ | C | `project`, `deal` | [x] 2026-10-11 — עוד לא נבדק בשני דפדפנים |
| `revokeDirectOfferLink` | directOffer | inline |  | toast | directOffer → moach(lazy) | — | — | `wish` (← בעלי המשאלה והמציעים, `partiesOf`) | [x] 2026-10-11 — עוד לא נבדק בשני דפדפנים |
| `signDealEdit` | signDealEdit | inline |  | toast | voteUpdate → votes+rikma+moach(lazy) | intent ✓ | A·O | `project`, `decision:decision`, `deal`, `mission` · +הלקוחות | [x] 2026-10-11 — עוד לא נבדק בשני דפדפנים |
| `signDealOffer` | signDealOffer | config | specificUsers | toast | dealOfferSigned → moach(lazy) | intent ✓ | P | `project`, `deal` ×2 · parties: `recipientIds` | [x] 2026-10-11 — עוד לא נבדק בשני דפדפנים |
| `updateDirectOffer` | directOffer | inline |  | toast | directOffer → moach(lazy) | — | — | `wish` (← בעלי המשאלה והמציעים, `partiesOf`) | [x] 2026-10-11 — עוד לא נבדק בשני דפדפנים |
| `updateSheirut` | updateSheirut | none |  | — |  | — ⚠ | P | `project`, `deal` | [x] 2026-10-11 — עוד לא נבדק בשני דפדפנים |

### money — 23 actions (live 2 · full 0 · toast 7 · silent 7 · read-only 7)

| action | file | socket today | recipients | effect for others | metadata.type → who reacts | ערוצים היום | intent יעד | target scopes | status |
|---|---|---|---|---|---|---|---|---|---|
| `approveHaluka` | approveHaluka | config | custom | partial(lev) |  | SPTE ✂ | ? (לא `O` — מוריד מייל וטלגרם) | `project`, `decision:tosplit` | [x] 2026-10-11 — לא נבדק חי (כל פעולה כאן רושמת כסף אמיתי) |
| `confirmHaluka` | confirmHaluka | config | projectMembers (−me) | toast | halukaConfirm → moach(lazy) | intent ✓ | A | `project`, `split`, `deal` ×N (חלקי עסקה ששולמו) | [x] 2026-10-11 — לא נבדק חי (כל פעולה כאן רושמת כסף אמיתי) |
| `counterSaleClaim` | counterSaleClaim | inline |  | partial(lev) | saleClaimCounter → moach(lazy) | intent ✓ | C | `project`, `decision:decision` | [x] 2026-10-11 — לא נבדק חי (כל פעולה כאן רושמת כסף אמיתי) |
| `createDonationSale` | createDonationSale | inline |  | toast | saleClaim → moach(lazy) | intent ✓ | C | `project`, `sale`, `decision:decision` | [x] 2026-10-11 — לא נבדק חי (כל פעולה כאן רושמת כסף אמיתי) |
| `createHaluka` | createHaluka | none |  | — |  | — ⚠ | C | `project`, `split` | [x] 2026-10-11 — לא נבדק חי (כל פעולה כאן רושמת כסף אמיתי) |
| `createPlatformSale` | createPlatformSale | none |  | — |  | — | — | `project` ×2 (הפלטפורמה + המקור), `sale` | [x] 2026-10-11 — לא נבדק חי (כל פעולה כאן רושמת כסף אמיתי) |
| `createSale` | createSale | inline |  | toast | saleClaim → moach(lazy) | intent ✓ | C | `project`, `product`, `sale`, `decision:decision` (saleClaim), `deal` | [x] 2026-10-11 — לא נבדק חי (כל פעולה כאן רושמת כסף אמיתי) |
| `createSiteShareTransfer` | createSiteShareTransfer | none |  | — |  | — ⚠ | C | `project`, `split` · +המקבל | [x] 2026-10-11 — לא נבדק חי (כל פעולה כאן רושמת כסף אמיתי) |
| `createTosplit` | createTosplit | config | projectMembers (−me) | toast ⚠cfgUS lost |  | intent ✓ | C | `project`, `decision:tosplit` | [x] 2026-10-11 — לא נבדק חי (כל פעולה כאן רושמת כסף אמיתי) |
| `customerReportRecurringSaleCycle` | customerReportRecurringSaleCycle | inline |  | toast | recurringSaleCustomerReport → moach(lazy) | intent ✓ | C | `project`, `sale` | [x] 2026-10-11 — לא נבדק חי (כל פעולה כאן רושמת כסף אמיתי) |
| `decideSiteShare` | decideSiteShare | none |  | — |  | — | — | `project`, `decision:tosplit`, `deal` (שירות ההכנסה) | [x] 2026-10-11 — לא נבדק חי (כל פעולה כאן רושמת כסף אמיתי) |
| `getOpenSiteShareDecisions` | getOpenSiteShareDecisions | read-only |  |  |  |  |  |  | n/a |
| `getPlatformProject` | getPlatformProject | read-only |  |  |  |  |  |  | n/a |
| `getRikmaSplitsArchive` | getRikmaSplitsArchive | read-only |  |  |  |  |  |  | n/a |
| `getSiteShareAggregate` | getSiteShareAggregate | read-only |  |  |  |  |  |  | n/a |
| `getSiteShareArchive` | getSiteShareArchive | read-only |  |  |  |  |  |  | n/a |
| `getSiteShareDecision` | getSiteShareDecision | read-only |  |  |  |  |  |  | n/a |
| `getSiteSharePayables` | getSiteSharePayables | read-only |  |  |  |  |  |  | n/a |
| `reportRecurringSaleCycle` | reportRecurringSaleCycle | inline |  | toast | recurringSaleCycle → moach(lazy) | intent ✓ | P | `project`, `sale` · +הלקוח | [x] 2026-10-11 — לא נבדק חי (כל פעולה כאן רושמת כסף אמיתי) |
| `requestDonation` | requestDonation | inline |  | toast | donationRequest → moach(lazy) | intent ✓ | P | `project`, `mission` | [x] 2026-10-11 — לא נבדק חי (כל פעולה כאן רושמת כסף אמיתי) |
| `seedSiteShareDecisions` | seedSiteShareDecisions | none |  | — |  | — | — | `project`, `decision:tosplit` | [x] 2026-10-11 — לא נבדק חי (כל פעולה כאן רושמת כסף אמיתי) |
| `setRikmaCurrency` | setRikmaCurrency | none |  | — |  | — ⚠ | A | `project` | [x] 2026-10-11 — לא נבדק חי (כל פעולה כאן רושמת כסף אמיתי) |
| `toggleMoneyReceiver` | toggleMoneyReceiver | none |  | — |  | — ⚠ | A | `project`, `deal` | [x] 2026-10-11 — לא נבדק חי (כל פעולה כאן רושמת כסף אמיתי) |

### stipend — 9 actions (live 0 · full 6 · toast 0 · silent 1 · read-only 2)

| action | file | socket today | recipients | effect for others | metadata.type → who reacts | ערוצים היום | intent יעד | target scopes | status |
|---|---|---|---|---|---|---|---|---|---|
| `confirmStipendPayment` | confirmStipendPayment | inline |  | full | stipendPayment → moach(lazy) | intent ✓ | P | `project`, `stipend` | [x] 2026-10-11 — לא נבדק חי |
| `counterStipendTerms` | counterStipendTerms | inline |  | full | voteUpdate → votes+rikma+moach(lazy) | intent ✓ | C | `project`, `decision:decision` | [x] 2026-10-11 — לא נבדק חי |
| `getStipendOverview` | getStipendOverview | read-only |  |  |  |  |  |  | n/a |
| `getStipendWork` | getStipendWork | read-only |  |  |  |  |  |  | n/a |
| `markStipendTransferSent` | markStipendTransferSent | inline |  | full | stipendPayment → moach(lazy) | intent ✓ | C | `project`, `stipend` | [x] 2026-10-11 — לא נבדק חי |
| `proposeStipendPledge` | proposeStipendPledge | inline |  | full | voteUpdate → votes+rikma+moach(lazy) | intent ✓ | C | `project`, `stipend` (ההתחייבות), `decision:decision` | [x] 2026-10-11 — לא נבדק חי |
| `proposeStipendProgram` | proposeStipendProgram | inline |  | full | voteUpdate → votes+rikma+moach(lazy) | intent ✓ | C | `project`, `stipend` (התוכנית), `decision:decision` | [x] 2026-10-11 — לא נבדק חי |
| `publishStipendFundingRequest` | publishStipendFundingRequest | none |  | — |  | — | — | `project`, `stipend`, `resource` (הבקשה הפתוחה) | [x] 2026-10-11 — לא נבדק חי |
| `settleStipendCycle` | settleStipendCycle | inline |  | full | stipendPayment → moach(lazy) | intent ✓ | P·C | `project`, `stipend`, `split` | [x] 2026-10-11 — לא נבדק חי |

### shift — 11 actions (live 0 · full 5 · toast 0 · silent 4 · read-only 2)

| action | file | socket today | recipients | effect for others | metadata.type → who reacts | ערוצים היום | intent יעד | target scopes | status |
|---|---|---|---|---|---|---|---|---|---|
| `claimShiftHole` | shiftCardActions | inline |  | full | shiftCall → moach(lazy)<br>shiftReopen → moach(lazy) | SP | O | `project`, `shift` | [x] 2026-10-11 — לא נבדק חי |
| `decideShiftSwap` | shiftSwapActions | inline |  | full | shiftSwap → moach(lazy) | intent ✓ | C·P | `decision:decision` · parties: שני הצדדים | [x] 2026-10-11 — לא נבדק חי |
| `declareShiftAvailability` | declareShiftAvailability | none |  | — |  | — ⚠ | A | `project`, `shift` | [x] 2026-10-11 — לא נבדק חי |
| `getPendmShiftPlan` | shiftCardActions | read-only |  |  | shiftCall → moach(lazy)<br>shiftReopen → moach(lazy) |  |  |  | n/a |
| `getShiftWork` | shiftCardActions | read-only |  |  | shiftCall → moach(lazy)<br>shiftReopen → moach(lazy) |  |  |  | n/a |
| `linkShiftTimer` | shiftHoursActions | none |  | — |  | — | — | `timer:<uid>` · self | [x] 2026-10-11 — לא נבדק חי |
| `logShiftHours` | shiftHoursActions | none |  | — |  | — ⚠ | C | `project`, `mission`, `timer:<uid>` | [x] 2026-10-11 — לא נבדק חי |
| `proposeShiftSwap` | shiftSwapActions | inline |  | full | shiftSwap → moach(lazy) | intent ✓ | C | `decision:decision` · parties: שני הצדדים | [x] 2026-10-11 — לא נבדק חי |
| `releaseShiftAssignment` | shiftCardActions | inline |  | full | shiftCall → moach(lazy)<br>shiftReopen → moach(lazy) | intent ✓ | P | `project`, `shift` | [x] 2026-10-11 — לא נבדק חי |
| `reopenForShiftHole` | shiftCardActions | config | projectMembers | full | shiftCall → moach(lazy)<br>shiftReopen → moach(lazy) | intent ✓ | A | `project`, `shift`, `mission` | [x] 2026-10-11 — לא נבדק חי |
| `setShiftRules` | shiftRulesActions | none |  | — |  | — | — | `mission` · self | [x] 2026-10-11 — לא נבדק חי |

### archive — 7 actions (live 1 · full 3 · toast 0 · silent 2 · read-only 1)

| action | file | socket today | recipients | effect for others | metadata.type → who reacts | ערוצים היום | intent יעד | target scopes | status |
|---|---|---|---|---|---|---|---|---|---|
| `archivePersonalMatanot` | archivePersonalMatanot | none |  | — |  | — | — | `product` · self | [x] 2026-10-11 |
| `archiveSpaceDoc` | spaceDocs | none |  | — |  | — ⚠ | A | `project`, `doc` | [x] 2026-10-11 — לא נבדק חי |
| `archiveUserResource` | archiveUserResource | config | specificUsers | partial(lev) | profile → userStore | S | — | `user:<me>` · self | [x] 2026-10-11 |
| `counterObjectChange` | counterObjectChange | inline |  | full | voteUpdate → votes+rikma+moach(lazy) | intent ✓ | C | `project`, `decision:decision` | [x] 2026-10-11 — נבדק בשני דפדפנים |
| `previewArchiveMembership` | previewArchiveMembership | read-only |  |  |  |  |  |  | n/a |
| `proposeObjectArchive` | proposeObjectArchive | inline |  | full | voteUpdate → votes+rikma+moach(lazy) | intent ✓ | C | `project`, `decision:decision` (+ ההמשך), האובייקט | [x] 2026-10-11 |
| `proposeObjectEdit` | proposeObjectEdit | inline |  | full | voteUpdate → votes+rikma+moach(lazy) | intent ✓ | C | `project`, `decision:decision`, האובייקט | [x] 2026-10-11 — נבדק בשני דפדפנים |

### maagad — 8 actions (live 0 · full 0 · toast 3 · silent 5 · read-only 0)

| action | file | socket today | recipients | effect for others | metadata.type → who reacts | ערוצים היום | intent יעד | target scopes | status |
|---|---|---|---|---|---|---|---|---|---|
| `confirmMaagadQuorum` | maagad | config | specificUsers (−me) | toast | maagad → moach(lazy) | intent ✓ | O | `maagad`, `project` (רקמת הספק, שם נוצרות העסקאות) + חברי המאגד | [x] 2026-10-11 — לא נבדק חי |
| `createMaagadOffer` | maagad | config | specificUsers (−me) | toast | maagad → moach(lazy) | intent ✓ | P | `maagad` · parties: חברי המאגד והספקים שלו | [x] 2026-10-11 — לא נבדק חי |
| `expireMaagadOffers` | maagad | none |  | — | maagad | — ⚠ | P | `maagad` לכל הצעה שפגה · parties: החותמים והספק | [x] 2026-10-11 — לא נבדק חי |
| `joinMaagad` | maagad | none |  | — | maagad | — ⚠ | A | `maagad` · parties: חברי המאגד והספקים שלו | [x] 2026-10-11 — לא נבדק חי |
| `leaveMaagad` | maagad | none |  | — | maagad | — ⚠ | A | `maagad` · self (עזיבה שקטה, §2.1) | [x] 2026-10-11 — לא נבדק חי |
| `openMaagad` | maagad | none |  | — | maagad | — | — | `maagad`, `user:<me>` · self | [x] 2026-10-11 — לא נבדק חי |
| `signMaagadOffer` | maagad | config | specificUsers (−me) | toast | maagad → moach(lazy) | intent ✓ | P | `maagad` · parties: חברי המאגד והספקים שלו | [x] 2026-10-11 — לא נבדק חי |
| `unsignMaagadOffer` | maagad | none |  | — | maagad | — ⚠ | A | `maagad` · parties: חברי המאגד והספקים שלו | [x] 2026-10-11 — לא נבדק חי |

### project — 4 actions (live 0 · full 2 · toast 0 · silent 2 · read-only 0)

| action | file | socket today | recipients | effect for others | metadata.type → who reacts | ערוצים היום | intent יעד | target scopes | status |
|---|---|---|---|---|---|---|---|---|---|
| `disconnectProjectRepo` | githubActions | config | projectMembers (−me) | full | base → moach(lazy) | intent ✓ | A | `project` | [x] 2026-10-11 — לא נבדק חי |
| `scanProjectDirections` | planningRuns | none |  | — |  | — | — | `project`, `plan` לכל כיוון שהוצע | [x] 2026-10-11 — לא נבדק חי |
| `syncProjectRepos` | githubActions | none |  | — | base | — | — | `project` | [x] 2026-10-11 — לא נבדק חי |
| `updateProjectDetails` | updateProjectDetails | config | projectMembers (−me) | full | base → moach(lazy) | intent ✓ | A (ראו B14) | `project`, `decision:decision` לכל הצבעה שנפתחה | [x] 2026-10-11 — לא נבדק חי |

### vote — 31 actions (live 9 · full 4 · toast 12 · silent 5 · read-only 1)

| action | file | socket today | recipients | effect for others | metadata.type → who reacts | ערוצים היום | intent יעד | target scopes | status |
|---|---|---|---|---|---|---|---|---|---|
| `acceptCounterOnAsk` | acceptCounterOnAsk | config | projectMembers (−me) | toast | base → moach(lazy) | intent ✓ | O | `project`, `decision:ask` | [x] 2026-10-11 |
| `acceptCounterOnAskm` | acceptCounterOnAskm | config | projectMembers (−me) | toast | base → moach(lazy) | intent ✓ | O | `project`, `decision:askm` | [x] 2026-10-11 |
| `addVote` | addVote | config | projectMembers | partial(lev) | voteUpdate → votes+rikma+moach(lazy) | intent ✓ | A·O | `project`, לפי `type` (`decision:*` / `deal`), `deal` (נוצר) | [x] 2026-10-11 |
| `applyToMission` | applyToMission | config | projectMembers | toast | missionApplication → moach(lazy) | intent ✓ | C | `project` (אם יש), `mission`, `decision:ask` | [x] 2026-10-11 |
| `candidateCounterOnAsk` | candidateCounterOnAsk | config | projectMembers (−me) | toast | base → moach(lazy) | intent ✓ | C | `project`, `decision:ask`, `mission` | [x] 2026-10-11 |
| `candidateCounterOnAskm` | candidateCounterOnAskm | config | projectMembers (−me) | toast | base → moach(lazy) | intent ✓ | C | `project`, `decision:askm`, `resource` | [x] 2026-10-11 |
| `counterOnAsk` | counterOnAsk | config | specificUsers | toast | base → moach(lazy) | intent ✓ | C | `project`, `decision:ask`, `mission` · +המועמד | [x] 2026-10-11 |
| `counterOnAskm` | counterOnAskm | config | specificUsers | toast | base → moach(lazy) | intent ✓ | C | `project`, `decision:askm`, `resource` · +המועמד | [x] 2026-10-11 |
| `declineAskmRequest` | declineAskmRequest | none |  | — |  | — ⚠ | P | `project`, `decision:askm` | [x] 2026-10-11 |
| `declineMissionRequest` | declineMissionRequest | none |  | — |  | — ⚠ | P | `project`, `mission` · +המועמד | [x] 2026-10-11 |
| `declineOpenMission` | declineOpenMission | none |  | — |  | — | — | `mission` · self | [x] 2026-10-11 |
| `declineSpForMashaabim` | declineSpForMashaabim | none |  | — |  | — | — | `project`, `resource` | [x] 2026-10-11 |
| `dismissSelfNomination` | dismissSelfNomination | config | specificUsers | toast | selfNomination → moach(lazy) | intent ✓ | P | `project`, `mission` / `resource` | [x] 2026-10-11 |
| `finalizeAskAcceptance` | finalizeAskAcceptance | config | projectMembers | full | missionCreated → moach(lazy) | intent ✓ | O | `project`, `decision:ask`, `mission` · +המתקבל | [x] 2026-10-11 |
| `finalizeAskmAcceptance` | finalizeAskmAcceptance | config | projectMembers | refetch(lev) | askmAccepted → moach(lazy) | intent ✓ | O | `project`, `decision:askm`, `resource` · +המתקבל | [x] 2026-10-11 |
| `finalizeJoinAcceptance` | finalizeJoinAcceptance | config | projectMembers | full | missionCreated → moach(lazy) | intent ✓ | O | `project`, `decision:ask`, `mission` · +המתקבל | [x] 2026-10-11 |
| `getDecisionDetails` | getDecisionDetails | read-only |  |  |  |  |  |  | n/a |
| `nominateSelfMission` | nominateSelfMission | config | projectMembers | toast | selfNomination → moach(lazy) | intent ✓ | C | `project`, `mission`, `decision:ask` | [x] 2026-10-11 |
| `nominateSelfResource` | nominateSelfResource | config | projectMembers | toast | selfNomination → moach(lazy) | intent ✓ | C | `project`, `resource`, `decision:askm` | [x] 2026-10-11 |
| `proposeOnOpenMashaabim` | proposeOnOpenMashaabim | config | specificUsers | toast | mashaabimRequest → moach(lazy) | intent ✓ | C | `project`, `resource`, `decision:askm` | [x] 2026-10-11 |
| `proposeOnOpenMission` | proposeOnOpenMission | config | specificUsers | toast | missionApplication → moach(lazy) | intent ✓ | C | `project` (אם יש), `mission`, `decision:ask` | [x] 2026-10-11 |
| `proposeRikmaBlueprint` | assistantSessions | none |  | — |  | — | — | `user:<me>` · self (הסשן של הבעלים בלבד) | [x] 2026-10-11 — לא נבדק חי |
| `proposeRikmaIdentity` | proposeRikmaIdentity | config | projectMembers (−me) | full | base → moach(lazy) | intent ✓ | C | `project`, `decision:decision` לכל החלטה שנפתחה | [x] 2026-10-11 |
| `submitNegoMaap` | submitNegoMaap | config | projectMembers (−me) | full | maapNego → moach(lazy) | intent ✓ | C | `project`, `decision:maap` | [x] 2026-10-11 |
| `submitNegoMash` | submitNegoMash | config | projectMembers (−me) | partial(lev) | base → moach(lazy) | intent ✓ | C | `project`, `decision:pmash` | [x] 2026-10-11 |
| `submitNegoMission` | submitNegoMission | config | projectMembers (−me) | partial(lev) | base → moach(lazy) | intent ✓ | C | `project`, `decision:pendm` או `decision:ask` + `mission` | [x] 2026-10-11 |
| `voteOnAskm` | voteOnAskm | config | projectMembers (−me) | refetch(lev) | voteUpdate → votes+rikma+moach(lazy) | intent ✓ | A | `project`, `decision:askm` | [x] 2026-10-11 |
| `voteOnDecision` | voteOnDecision | config | projectMembers | partial(lev) | saleClaimConfirmed → moach(lazy)<br>voteUpdate → votes+rikma+moach(lazy)<br>decisionVote → votes+rikma+moach(lazy) | intent ✓ | A·O | `project`, `decision:decision` | [x] 2026-10-11 — נבדק בשני דפדפנים |
| `voteOnMaap` | voteOnMaap | config | projectMembers | partial(lev) | maapVote → votes+rikma+moach(lazy) | intent ✓ | A·C·O | `project`, `decision:maap` | [x] 2026-10-11 |
| `voteOnPendm` | voteOnPendm | config | projectMembers | partial(lev) | voteUpdate → votes+rikma+moach(lazy)<br>pendmVote → votes+rikma+moach(lazy) | intent ✓ | A·O | `project`, `decision:pendm`, `mission` (נוצרה) | [x] 2026-10-11 |
| `voteOnPmash` | voteOnPmash | config | projectMembers | partial(lev) | pmashVote → votes+rikma+moach(lazy) | intent ✓ | A·O | `project`, `decision:pmash` | [x] 2026-10-11 |

### mission — 13 actions (live 1 · full 0 · toast 8 · silent 3 · read-only 1)

| action | file | socket today | recipients | effect for others | metadata.type → who reacts | ערוצים היום | intent יעד | target scopes | status |
|---|---|---|---|---|---|---|---|---|---|
| `closeFiniapruval` | closeFiniapruval | config | projectMembers | toast ⚠cfgUS lost | finiapruvalVote → moach(lazy) | intent ✓ | O | `project`, `decision:finiapruval` | [x] 2026-10-11 — עוד לא נבדק בשני דפדפנים |
| `completeMission` | completeMission | inline |  | partial(lev) | finiappmi → moach(lazy) | intent ✓ | C | `project`, `mission`, `decision:finiapruval` (כשנפתח אישור) | [x] 2026-10-11 — עוד לא נבדק בשני דפדפנים |
| `counterFiniapruval` | counterFiniapruval | inline |  | toast | finiapruvalCounter → moach(lazy) | intent ✓ | C | `project`, `decision:finiapruval` | [x] 2026-10-11 — עוד לא נבדק בשני דפדפנים |
| `createMission` | createMission | inline |  | toast | voteUpdate → votes+rikma+moach(lazy) | intent ✓ | C | `project`, `mission` / `decision:pendm` (לפי מה שנוצר) | [x] 2026-10-11 — עוד לא נבדק בשני דפדפנים |
| `createMissionOffer` | createMissionOffer | none |  | — |  | — | — | `user:<me>` · self | [x] 2026-10-11 — עוד לא נבדק בשני דפדפנים |
| `createMissionTemplate` | createMissionTemplate | none |  | — |  | — | — | `user:<me>` · self | [x] 2026-10-11 — עוד לא נבדק בשני דפדפנים |
| `createTask` | createTask | config | specificUsers (−me) | toast |  | intent ✓ | C | `project`, `act`, `mission` | [x] 2026-10-11 — נבדק בשני דפדפנים (256 → 258, רקמה 87, מטלה 134) |
| `customizeOpenMission` | customizeOpenMission | config | specificUsers | toast | missionApplication → moach(lazy) | intent ✓ | C | `project`, `mission`, `decision:ask` (כמו `proposeOnOpenMission`) | [x] 2026-10-11 — עוד לא נבדק בשני דפדפנים |
| `getMissionForEdit` | getMissionForEdit | read-only |  |  |  |  |  |  | n/a |
| `linkActToMission` | linkActToMission | config | projectMembers (−me) | toast ⚠cfgUS lost |  | intent ✓ | O | `project`, `act`, `mission` / `decision:pendm` | [x] 2026-10-11 — עוד לא נבדק בשני דפדפנים |
| `updateMissionOffer` | updateMissionOffer | none |  | — |  | — | — | `user:<me>` · self | [x] 2026-10-11 — עוד לא נבדק בשני דפדפנים |
| `updateMissionStatus` | updateMissionStatus | config | projectMembers (−me) | toast | missionStatus → moach(lazy) | intent ✓ | A | `project:<pid>`, `mission:<mId>` | [x] 2026-10-10 — נבדק בשני דפדפנים (לא נדחף) |
| `updateTask` | example | config | projectMembers (−me) | toast ⚠cfgUS lost |  | SP | ? (לא `A` — לא מורידים פוש) | `project`, `act`, `mission` ×N | [x] 2026-10-11 — נבדק בשני דפדפנים (256 → 258, רקמה 87, מטלה 134) |

### resource — 13 actions (live 1 · full 1 · toast 3 · silent 8 · read-only 0)

| action | file | socket today | recipients | effect for others | metadata.type → who reacts | ערוצים היום | intent יעד | target scopes | status |
|---|---|---|---|---|---|---|---|---|---|
| `blockResourceDates` | blockResourceDates | none |  | — |  | — | — | `resource` · self | [x] 2026-10-11 — לא נבדק חי |
| `cancelResourceBooking` | cancelResourceBooking | none |  | — |  | — ⚠ | P | `resource` · self | [x] 2026-10-11 — לא נבדק חי |
| `confirmResourceBooking` | confirmResourceBooking | none |  | — |  | — ⚠ | P | `project` (אם יש), `resource` | [x] 2026-10-11 — לא נבדק חי |
| `createMashaabim` | createMashaabim | none |  | — |  | — | — | `user:<me>` · self | [x] 2026-10-11 — לא נבדק חי |
| `createMashaabimRequest` | createMashaabimRequest | config | specificUsers | toast | mashaabimRequest → moach(lazy) | intent ✓ | C | `project`, `resource`, `decision:askm` | [x] 2026-10-11 — לא נבדק חי |
| `createResource` | createResource | inline |  | toast | voteUpdate → votes+rikma+moach(lazy) | intent ✓ | C | `project`, `decision:pmash` / `resource` (לפי מה שנוצר, `createdKind`), `resource` (חוזר) | [x] 2026-10-11 — לא נבדק חי |
| `createResourceBooking` | createResourceBooking | none |  | — |  | — ⚠ | C | `project` (אם יש), `resource` ×2, `deal` | [x] 2026-10-11 — לא נבדק חי |
| `createResourceRequest` | createResourceRequest | none |  | — |  | — ⚠ | C | `user:<me>`, `resource` · self | [x] 2026-10-11 — לא נבדק חי |
| `customizeOpenMashaabim` | customizeOpenMashaabim | config | specificUsers | toast | mashaabimRequest → moach(lazy) | intent ✓ | C | `project`, `resource`, `decision:askm` (כמו `proposeOnOpenMashaabim`) | [x] 2026-10-11 — לא נבדק חי |
| `markResourceDone` | markResourceDone | config | projectMembers (−me) | full | resourceDone → moach(lazy) | intent ✓ | A | `project`, `resource` | [x] 2026-10-11 — לא נבדק חי |
| `publishUserResourceAsProduct` | publishUserResourceAsProduct | config | specificUsers | partial(lev) | profile → userStore | intent ✓ | A | `user:<me>`, `resource`, `product` · self | [x] 2026-10-11 — לא נבדק חי |
| `releaseResourceBooking` | releaseResourceBooking | none |  | — |  | — ⚠ | P | `project` (אם יש), `resource` | [x] 2026-10-11 — לא נבדק חי |
| `updateResourceRequest` | updateResourceRequest | none |  | — |  | — ⚠ | A | `user:<me>`, `resource` · self | [x] 2026-10-11 — לא נבדק חי |

### product — 5 actions (live 0 · full 0 · toast 2 · silent 2 · read-only 1)

| action | file | socket today | recipients | effect for others | metadata.type → who reacts | ערוצים היום | intent יעד | target scopes | status |
|---|---|---|---|---|---|---|---|---|---|
| `approveMatanot` | approveMatanot | config | projectMembers (−me) | toast |  | intent ✓ | O | `project`, `product` | [x] 2026-10-11 — לא נבדק חי |
| `createComplexMatanot` | createComplexMatanot | config | projectMembers (−me) | toast |  | intent ✓ | C | `project`, `product`, `process` | [x] 2026-10-11 — לא נבדק חי |
| `createPersonalMatanot` | createPersonalMatanot | none |  | — |  | — | — | `project` (הרקמה האישית), `product` | [x] 2026-10-11 — לא נבדק חי |
| `loadCatalog` | loadCatalog | read-only |  |  |  |  |  |  | n/a |
| `setMatanotDiscovery` | setMatanotDiscovery | none |  | — |  | — | — | `user:<me>`, `product` · self | [x] 2026-10-11 — לא נבדק חי |

### user — 11 actions (live 2 · full 0 · toast 1 · silent 7 · read-only 1)

| action | file | socket today | recipients | effect for others | metadata.type → who reacts | ערוצים היום | intent יעד | target scopes | status |
|---|---|---|---|---|---|---|---|---|---|
| `dismissNotice` | noticePrefs | none |  | — |  | — | — | `user:<me>` · self | [x] 2026-10-11 — לא נבדק חי |
| `ensurePersonalRikma` | ensurePersonalRikma | read-only |  |  |  |  |  |  | n/a |
| `refreshMySuggestions` | refreshMySuggestions | none |  | — |  | — | — | `user:<me>` · self | [x] 2026-10-11 — לא נבדק חי |
| `requestSuggestion` | requestSuggestion | config | specificUsers | toast | ratsonProposal → moach(lazy) | intent ✓ | C | `project` (רקמת הספק), `wish`, `deal` · + המוזמן | [x] 2026-10-11 — לא נבדק חי |
| `restoreNotice` | noticePrefs | none |  | — |  | — | — | `user:<me>` · self | [x] 2026-10-11 — לא נבדק חי |
| `saveNoticePrefs` | noticePrefs | none |  | — |  | — | — | `user:<me>` · self | [x] 2026-10-11 — לא נבדק חי |
| `toggleGuideStatus` | toggleGuideStatus | none |  | — |  | — | — | `user:<me>` · self | [x] 2026-10-11 — לא נבדק חי |
| `updateUserBasic` | updateUserBasic | config | specificUsers | partial(lev) | profile → userStore | intent ✓ | A | `user:<me>` · self | [x] 2026-10-11 — לא נבדק חי |
| `updateUserProfilePic` | updateUserProfilePic | config | specificUsers | partial(lev) | profile → userStore | intent ✓ | A | `user:<me>` · self | [x] 2026-10-11 — לא נבדק חי |
| `updateUserRelation` | updateUserRelation | none |  | — |  | — | — | `user:<me>` · self | [x] 2026-10-11 — לא נבדק חי |
| `updateWelcomeCard` | updateWelcomeCard | none |  | — |  | — | — | `user:<me>` · self | [x] 2026-10-11 — לא נבדק חי |

### other — 1 actions (live 0 · full 0 · toast 0 · silent 1 · read-only 0)

| action | file | socket today | recipients | effect for others | metadata.type → who reacts | ערוצים היום | intent יעד | target scopes | status |
|---|---|---|---|---|---|---|---|---|---|
| `shareRikmaPreview` | assistantSessions | none |  | — |  | — | — | `user:<me>` · self (הסשן של הבעלים בלבד) | [x] 2026-10-11 — לא נבדק חי |
