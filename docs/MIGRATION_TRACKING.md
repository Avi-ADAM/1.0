# מעקב מיגרציה — Unified Action System

> **עדכן מסמך זה** אחרי כל מיגרציה: שנה `[ ]` ל-`[x]` ורשום תאריך.
>
> **עדיפות:** POST (כתיבה) > GET (קריאה).  
> POST שעוקפים את המערכת = חוסר notifications, חוסר real-time, חוסר token security.  
> GET שעוקפים = פחות קריטי, לטפל בסוף.

---

## סטטיסטיקות

| מדד | ערך |
|-----|-----|
| Actions קיימים (הוגרו) | ~63 |
| קריאות sendToSer במערכת | ~280 |
| קבצי components עם POST ישן | ~25 |
| POST operations לא מוגרות | ~36 |
| GET operations לא מוגרות | ~20 |

---

## 🔴 עדיפות קריטית — POST מ-Components (לא עוברים דרך /api/action)

### אלה הפונקציות שחייבות notifications + real-time ולא מקבלות אותם כרגע

---

### `src/lib/components/lev/`

| פעולה | קובץ | שורות | Pattern ישן | Action חדש | Notifications נדרשות | סטטוס |
|-------|------|--------|-------------|------------|----------------------|--------|
| אישור קבלה למשימה (solo + allVoted) + email | `lev/reqtosherut.svelte` | agree() | `fetch('/graphql')` × 2 + `fetch('/api/sma')` × 2 | `finalizeAskAcceptance` | accepted user (email) + project members (socket) | `[x]` 2026-05-22 |
| אישור הלוקה (כולם אישרו) + הצבעה חלקית | `lev/halukaask.svelte` | agree() | `fetch('/api/approveHaluka', POST)` + raw GraphQL | `approveHaluka` (custom handler) + `addVote(type:'tosplit')` | משתתפים + פרויקט | `[x]` 2026-05-22 |
| עדכון לחיצה על כרטיס ברוך הבא | `lev/welcomeTo.svelte` | — | — | — | — | קובץ לא קיים, דילוג |
| סטטוס task (taskishor/busabe/updStat) | `lev/missionInProgress.svelte` | taskishor/busabe/updStat | `sendToSer(61/62/63)` × 3 | `updateTask` (extended 31updateTask with naasa+status) | חברי פרויקט (real-time) | `[x]` 2026-05-22 |
| עדכון אחוז התקדמות משימה | `lev/missionInProgress.svelte` | stat() | `fetch('/graphql')` inline mutation | `updateMissionStatus` | חברי פרויקט (socket) | `[x]` 2026-05-22 |
| שמירת שעות טיימר ישן למשימה | `lev/missionInProgress.svelte` | save() | `fetch('/graphql')` → `11saveTimer` | `updateMissionTimerState` (save mode: hoursdon) | חברי פרויקט (socket) | `[x]` 2026-05-22 |
| ניקוי טיימר ישן למשימה | `lev/missionInProgress.svelte` | handleClearClick() | `fetch('/graphql')` → `10stopTimer` | `updateMissionTimerState` (clear mode) | חברי פרויקט (socket) | `[x]` 2026-05-22 |
| לחיצה על כרטיס ברוך הבא | `lev/cards/welcomeToCard.svelte` | onChatClick | `sendToSer(44updateWelcomeCard)` | `updateWelcomeCard` | — | `[x]` 2026-05-22 |
| אישור join למשימה (solo + allVoted) + member add | `lev/reqtojoin.svelte` | agree() | `sendToSer(...)` × 2 + raw fetch | `finalizeJoinAcceptance` + `addVote(type:'ask')` | new member (email) + project members (socket) | `[x]` 2026-05-22 |
| הצבעה על pending mission (YES/NO) + consensus → OpenMission | `lev/pandingMesima.svelte` | agree()/decline()/afterwhy() | `sendToSer(85)` + raw GraphQL | `voteOnPendm` (server-authoritative: DB fetch, orderon calc, consensus check) | project members (socket) | `[x]` 2026-05-22 |
| הוספת תגובה/דיון ל-pendm | `lev/pandingMesima.svelte` | afreact() | `sendToSer(...)` raw GraphQL | `addDiunEntry` (entityType:'pendm') | project members (socket) | `[x]` 2026-05-22 |
| הצבעה על pending resource (YES/NO) + consensus → OpenMashaabim | `lev/pmas.svelte` | agree()/decline()/afterwhy() | `sendToSer(...)` + raw GraphQL | `voteOnPmash` (server-authoritative: DB fetch, orderon calc, consensus check) | project members (socket) | `[x]` 2026-05-22 |
| הוספת תגובה/דיון ל-pmash | `lev/pmas.svelte` | afreact() | `sendToSer(...)` raw GraphQL | `addDiunEntry` (entityType:'pmash') | project members (socket) | `[x]` 2026-05-22 |
| הצבעה על בקשת משאב (YES/NO) + consensus → Rikmash | `lev/weget.svelte` | agree()/decline() | `fetch('/graphql')` × 2 (inline mutations) | `voteOnMaap` (server-authoritative: DB fetch, agprice calc, consensus → Rikmash+Sp.panui=false) | project members (socket) | `[x]` 2026-05-22 |
| אישור שליחת כסף (sender) | `lev/didiget.svelte` | agree() kind='send' | `fetch('/graphql')` inline mutation → senderconf:true | `confirmHaluka` (kind:'send' — server verifies usersend) | חברי פרויקט (socket) | `[x]` 2026-05-22 |
| אישור קבלת כסף (receiver) + חלוקת hervachti | `lev/didiget.svelte` | agree() kind='receive' | `SendTo(updateUser×n)` + `SendTo(updateHaluka)` + client-side spCheck | `confirmHaluka` (kind:'receive' — server-side spCheck + hervachti distribution) | חברי פרויקט (socket) | `[x]` 2026-05-22 |
| הוספת תגובה להעברת כסף | `lev/didiget.svelte` | afreact() | `fetch('/graphql')` inline mutation chatre (broken objToString) | `addHalukaChatEntry` (server fetches current chatre, appends, saves back) | חברי פרויקט (socket) | `[x]` 2026-05-22 |
| הצבעה על החלטת פרויקט — שינוי לוגו (kind=pic) + consensus | `lev/decisionMaking.svelte` | agree() kind!='sheirutpends' | `fetch('/graphql')` × broken (template literal discarded + que() as tagged template) — consensus never fired | `voteOnDecision` (server-authoritative: DB fetch, dedup, consensus → archiveDecision + updateProject.profilePic + markTimegrama) | חברי פרויקט (socket) | `[x]` 2026-05-22 |
| הצבעה על sheirutpend מ-decisionMaking | `lev/decisionMaking.svelte` | agree() kind='sheirutpends' | `addVote(type:'decision')` בטעות לכל ה-kinds | `addVote(type:'sheirutpend')` — ה-action הנכון הקיים (handles consensus → createSheirut) | חברי פרויקט (socket) | `[x]` 2026-05-22 |

---

### `src/lib/components/prPr/`

| פעולה | קובץ | שורות | Pattern ישן | Action חדש | Notifications נדרשות | סטטוס |
|-------|------|--------|-------------|------------|----------------------|--------|
| notification על מש"ל חדשה (pendmash) | `prPr/totalNeeds.svelte` | 477–490 | `fetch('/api/nuti', POST)` | `notifyPendmash` | חברי פרויקט + בעלי עניין | `[ ]` |
| notification על mission pending (1) | `prPr/mission.svelte` | 633–648 | `fetch('/api/nuti', POST)` | `notifyMissionPending` | חברי פרויקט + ליד משימה | `[ ]` |
| notification על mission pending (2) | `prPr/mission.svelte` | 678–692 | `fetch('/api/nuti', POST)` | `notifyMissionPending` | חברי פרויקט + ליד משימה | `[ ]` |
| לוג אירוע מערכת (system event log) | `prPr/mission.svelte` | 870–883 | `fetch('/api/ste', POST)` | `logSystemEvent` | admin/logs | `[ ]` |
| יצירת matana (תמונה + GraphQL) | `prPr/newmatana.svelte` | 67–87 | `axios.post(/api/upload)` + `fetch('/graphql', mutation createMatana)` | `createMatana` | חברי פרויקט | `[ ]` |
| יצירת mission | `prPr/mission.svelte` | 369 | `sendToSer(...)` | `createMission` | חברי פרויקט (real-time kanban) | `[ ]` |
| עדכון סטטוס task | `prPr/tasks/chooseM.svelte` | 48 | `sendToSer(...)` | `updateTask` ← **קיים!** לבדוק אם מחובר | חברי פרויקט | `[x]` 2026-06-07 |
| סימון act כ-done / set status | `prPr/tasks/Myacts.svelte` | 127–155 | `sendToSer(...)` × 2 | `markActDone` + `setActStatus` | מקצה + חברי פרויקט | `[ ]` |
| פעולות הלוקה / tosplit | `prPr/whowhat.svelte` | 252–481 | `sendToSer(...)` (פעולות מרובות) | לפי סוג: `createHaluka` / `createTosplit` ← **קיימים!** | משתתפים + פרויקט | `[ ]` |

---

### `src/lib/components/userPr/`

| פעולה | קובץ | שורות | Pattern ישן | Action חדש | Notifications נדרשות | סטטוס |
|-------|------|--------|-------------|------------|----------------------|--------|
| יצירת API key | `userPr/editBasic.svelte` | 231–239 | `fetch('/api/api-keys', POST)` | `createApiKey` | user (email אישור) | `[ ]` |
| מחיקת API key | `userPr/editBasic.svelte` | 266–268 | `fetch('/api/api-keys', DELETE)` | `deleteApiKey` | user | `[ ]` |
| שינוי סיסמה | `userPr/editBasic.svelte` | 361–373 | `axios.post('/api/auth/change-password')` | `changePassword` | user (email אישור security) | `[ ]` |
| עדכון guide status | `userPr/editBasic.svelte` | 450–465 | `fetch('/graphql', mutation updateUsersPermissionsUser)` | `toggleGuideStatus` | — | `[x]` 2026-06-08 |
| עדכון relations של משתמש | `userPr/edit.svelte` | 128–148 | `fetch('/graphql', mutation updateUsersPermissionsUser)` | `updateUserRelations` | user + פרויקטים קשורים | `[ ]` |
| יצירת resource/need (sp) | `userPr/newsp.svelte` | 77–99 | `fetch('/graphql', mutation createSp)` | `createResourceRequest` | חברי פרויקט + matching users | `[x]` 2026-06-07 |
| עדכון resource/need (sp) | `userPr/editsp.svelte` | 62–84 | `fetch('/graphql', mutation updateSp)` | `updateResourceRequest` | חברי פרויקט | `[x]` 2026-06-07 |

---

### `src/lib/components/addnew/` + `registration/` + selectors

| פעולה | קובץ | שורות | Pattern ישן | Action חדש | Notifications נדרשות | סטטוס |
|-------|------|--------|-------------|------------|----------------------|--------|
| יצירת skill חדשה + לוקליזציה | `addnew/addNewSkill.svelte` | multiple | `fetch('/api/ste', POST)` × 2 | `createSkillWithTranslation` | — | `[ ]` |
| יצירת value + לוקליזציה | `registration/vallues.svelte` | multiple | `fetch('/api/ste', POST)` | `createValue` | — | `[ ]` |
| יצירת role + לוקליזציה | `registration/roles.svelte` | multiple | `fetch('/api/ste', POST)` | `createRole` | — | `[ ]` |
| יצירת workway + לוקליזציה | `registration/workways.svelte` | multiple | `fetch('/api/ste', POST)` | `createWorkway` | — | `[ ]` |
| לוקליזציה ב-ValueSelector | `ui/ValueSelector.svelte` | multiple | `fetch('/api/ste', POST)` × 2 | ← לאחד עם `/api/ste` action | — | `[ ]` |
| לוקליזציה ב-SkillSelector | `ui/SkillSelector.svelte` | multiple | `fetch('/api/ste', POST)` × 2 | ← לאחד עם `/api/ste` action | — | `[ ]` |
| לוקליזציה ב-RoleSelector | `ui/RoleSelector.svelte` | multiple | `fetch('/api/ste', POST)` × 2 | ← לאחד עם `/api/ste` action | — | `[ ]` |
| יצירת iwant logs | `addnew/newIwant.svelte` | multiple | `fetch('/api/ste', POST)` × 3 | `createIwantLog` | — | `[ ]` |
| יצירת Mission template (קטלוג) + token | `addnew/addNewMission.svelte` | subm() | `fetch('/graphql', mutation createMission)` + `page.data.tok` bearer | `createMissionTemplate` (JWT, queId 21createMission) | — | `[x]` 2026-06-08 |

---

## 🟠 עדיפות גבוהה — POST מ-Routes

### `/me`
| פעולה | קובץ | שורות | Pattern ישן | Action חדש | Notifications נדרשות | סטטוס |
|-------|------|--------|-------------|------------|----------------------|--------|
| עדכון הגדרות guide | `routes/(reg)/me/+page.svelte` | 861, 896 | `fetch('/graphql', mutation updateUsersPermissionsUser)` | `toggleGuideStatus` | — | `[ ]` |
| עדכון פרופיל + העלאת תמונה | `routes/(reg)/me/+page.svelte` | 700–830 | `fetch('/api/upload')` + `fetch('/graphql')` | `updateUserProfile` | — | `[ ]` |

### `/moach`
| פעולה | קובץ | שורות | Pattern ישן | Action חדש | Notifications נדרשות | סטטוס |
|-------|------|--------|-------------|------------|----------------------|--------|
| שמירת onboarding | `routes/api/onboard/save/+server.ts` | 33, 97 | `fetch('/graphql')` × many | `saveOnboardingData` | — | `[ ]` |

---

## 🟡 עדיפות בינונית — API Endpoints ישנים (POST שמטפלים בהם)

> אלה server-side endpoints שהם עצמם ישנים — לא הקריאות אליהם אלא המימוש שלהם

| Endpoint | קובץ | מה הוא עושה | פתרון | סטטוס |
|---------|------|------------|--------|--------|
| `POST /api/nuti` | `routes/api/nuti/+server.js` | שולח email + PendJustCreated template ישירות | ← לעבוד דרך `EmailService` של NotificationOrchestrator | `[ ]` |
| `POST /api/nutiUser` | `routes/api/nutiUser/+server.js` | bulk email + push + telegram ישיר | ← לעבור ל-`NotificationOrchestrator.notify()` | `[ ]` |
| `POST /api/nutifyPm` | `routes/api/nutifyPm/+server.js` | שליחת push notifications | ← `PushService` דרך NotificationOrchestrator | `[ ]` |
| `POST /api/sma` | `routes/api/sma/+server.js` | שליחת SMS/email (שירות) | ← לאחד עם notification system | `[ ]` |
| `POST /api/approveHaluka` | `routes/api/approveHaluka/+server.js` | אישור הלוקה (legacy) | ← action `approveHaluka` קיים, לבדוק אם מחבר | `[ ]` |
| `POST /api/ste` | `routes/api/ste/+server.js` | יצירת entities + לוקליזציה | `createEntityWithTranslation` action | `[ ]` |
| `POST /api/meeting` | `routes/api/meeting/+server.js` | ניהול פגישות | בדוק אם מכוסה ע"י `createNewMeeting` | `[ ]` |

---

## 🟢 עדיפות נמוכה — GET שעוקפים את המערכת

> חוסר אבטחה קטן יותר (token בשרת בכל מקרה), אבל כדאי לאחד

### Server-Side Loads (page.server.ts)
| פעולה | קובץ | Action חדש | סטטוס |
|-------|------|------------|--------|
| רשימת פרויקטים | `moach/+page.server.ts` | `getUserProjectList` | `[ ]` |
| בסיס פרויקט + auth | `moach/[projectId]/+layout.server.ts` | `getProjectBaseInfo` | `[ ]` |
| משימות פרויקט | `moach/[projectId]/acts/+page.server.ts` | `getProjectMissions` | `[ ]` |
| missions + templates | `moach/[projectId]/create/+page.server.ts` | `getProjectMissionsAndTemplates` | `[ ]` |
| נתוני מכירה חדשה | `moach/[projectId]/sales/new/+page.server.ts` | `getNewSalePageData` | `[ ]` |
| chains data | `moach/[projectId]/chains/+page.server.js` | `getChainsData` | `[ ]` |

### Client-Side Fetches (onMount / components)
| פעולה | קובץ | Action חדש | סטטוס |
|-------|------|------------|--------|
| פרטי mission בפרוגרס | `moach/.../progress/[missionId]/+page.svelte` | `getMissionDetails` | `[ ]` |
| נתוני פיננסים | `moach/.../sales/+page.svelte` | `getProjectFinancials` | `[ ]` |
| chains extra data (עם cache) | `moach/.../chains/+page.svelte` | `getChainExtraData` | `[ ]` |
| בחירת משימה | `prPr/MissionModal.svelte` | `getProjectMissions` | `[ ]` |
| user profile details | `userPr/edit.svelte` | `getUserDetails` | `[ ]` |

---

## Utilities לדפרקציה (אחרי מיגרציה מלאה)

| קובץ | שימושים | מתי להסיר |
|------|---------|-----------|
| `src/lib/send/sendToSer.js` | ~280 | אחרי שכל `[ ]` הפכו ל-`[x]` |
| `src/lib/send/sendToSerTyped.ts` | wrapper | יחד עם sendToSer |
| `src/routes/api/send/+server.js` | proxy endpoint | אחרי מיגרציה מלאה |

---

## Actions שכבר הוגרו ✅

> לפני כתיבת action חדש — בדוק שהוא לא כבר קיים כאן!

| Action Key | קובץ Config | תיאור |
|-----------|-------------|--------|
| `updateTask` | `configs/updateTask.ts` | עדכון task |
| `createTask` | `configs/createTask.ts` | יצירת task |
| `timerStart` | `configs/timerStart.ts` | התחלת טיימר |
| `timerStop` | `configs/timerStop.ts` | עצירת טיימר |
| `timerSave` | `configs/timerSave.ts` | שמירת זמן |
| `timerLogUpdate` | `configs/timerLogUpdate.ts` | עדכון log |
| `addVote` | `configs/addVote.ts` | כל סוגי הצבעה |
| `createHaluka` | `configs/createHaluka.ts` | יצירת העברת כסף |
| `approveHaluka` | `configs/approveHaluka.ts` | אישור העברה |
| `closeFiniapruval` | `configs/closeFiniapruval.ts` | סגירת אישור סיום |
| `completeMission` | `configs/completeMission.ts` | סיום משימה |
| `createTosplit` | `configs/createTosplit.ts` | פיצול תשלום |
| `createSheirutpend` | `configs/createSheirutpend.ts` | יצירת בקשת שירות |
| `approveSheirutpend` | `configs/approveSheirutpend.ts` | אישור בקשת שירות |
| `rejectSheirutpend` | `configs/rejectSheirutpend.ts` | דחיית בקשת שירות |
| `createSheirutFromPending` | `configs/createSheirutFromPending.ts` | שירות מבקשה |
| `createSheirutHaluka` | `configs/createSheirutHaluka.ts` | העברה בשירות |
| `confirmSheirutHaluka` | `configs/confirmSheirutHaluka.ts` | אישור העברה בשירות |
| `toggleMoneyReceiver` | `configs/toggleMoneyReceiver.ts` | שינוי מקבל כסף |
| `createProcess` | `configs/createProcess.ts` | יצירת process |
| `attachEntityToProcess` | `configs/attachEntityToProcess.ts` | צירוף ל-process |
| `ensureProcessForum` | `configs/ensureProcessForum.ts` | פורום לprocess |
| `ensureSheirutForum` | `configs/ensureSheirutForum.ts` | פורום לשירות |
| `ensureSheirutpendForum` | `configs/ensureSheirutpendForum.ts` | פורום לבקשה |
| `ensureStageForum` | `configs/ensureStageForum.ts` | פורום לשלב |
| `ensureHalukaForum` | `configs/ensureHalukaForum.ts` | פורום להעברה |
| `createNewMeeting` | `configs/createNewMeeting.ts` | יצירת פגישה |
| `startMeeting` | `configs/startMeeting.ts` | התחלת פגישה |
| `approveMeeting` | `configs/approveMeeting.ts` | אישור פגישה |
| `joinMeeting` | `configs/joinMeeting.ts` | הצטרפות לפגישה |
| `sendMeetingMessage` | `configs/sendMeetingMessage.ts` | הודעה בפגישה |
| `sendAskMessage` | `configs/sendAskMessage.ts` | הודעה ב-ask |
| `forum` | `configs/forum.ts` | פעולות פורום |
| `chat` | `configs/chat.ts` | פעולות צ'אט |
| `toggleOnline` | `configs/toggleOnline.ts` | סטטוס online |
| `createResource` | `configs/createResource.ts` | יצירת resource |
| `updateProjectDetails` | `configs/updateProjectDetails.ts` | עדכון פרטי פרויקט |
| `createComplexMatanot` | `configs/createComplexMatanot.ts` | BOM מורכב |
| `approveMatanot` | `configs/approveMatanot.ts` | אישור BOM |
| `finalizeAskAcceptance` | `configs/finalizeAskAcceptance.ts` | קבלה למשימה (solo/allVoted) + email MissionAccepted |
| `finalizeJoinAcceptance` | `configs/finalizeJoinAcceptance.ts` | הוספת user לפרויקט (reqtojoin — allVoted) |
| `updateWelcomeCard` | `configs/updateWelcomeCard.ts` | עדכון welcome card (נראה/נסגר) |
| `createMashaabimRequest` | `configs/createMashaabimRequest.ts` | יצירת בקשת משאבים (mashaabim) |
| `applyToMission` | `configs/applyToMission.ts` | הגשת מועמדות למשימה פתוחה |
| `declineOpenMission` | `configs/declineOpenMission.ts` | דחיית משימה פתוחה |
| `declineMissionRequest` | `configs/declineMissionRequest.ts` | דחיית בקשת משימה ע"י חבר פרויקט |
| `finalizeAskmAcceptance` | `configs/finalizeAskmAcceptance.ts` | קבלת מועמד ל-Askm (solo/allVoted) |
| `declineAskmRequest` | `configs/declineAskmRequest.ts` | דחיית בקשת Askm |
| `voteOnPendm` | `configs/voteOnPendm.ts` | הצבעה על pending mission — שרת-authoritative (DB fetch, orderon, consensus → OpenMission) |
| `voteOnPmash` | `configs/voteOnPmash.ts` | הצבעה על pending resource — שרת-authoritative (DB fetch, orderon, consensus → OpenMashaabim) |
| `addDiunEntry` | `configs/addDiunEntry.ts` | הוספת תגובה/דיון ל-pendm או pmash |
| `createRatson` | `configs/createRatson.ts` | יצירת רצון/wish (concierge flow) |
| `matchRatson` | `configs/matchRatson.ts` | התאמת רצון לפרויקט |
| `acceptRatsonProposal` | `configs/acceptRatsonProposal.ts` | אישור הצעת התאמה לרצון |
| `rejectRatsonProposal` | `configs/rejectRatsonProposal.ts` | דחיית הצעת התאמה לרצון |
| `voteOnMaap` | `configs/voteOnMaap.ts` | הצבעה על בקשת משאב (Maap/weget) — שרת-authoritative (DB fetch, agprice calc, consensus → Rikmash + Sp.panui=false) |
| `updateMissionStatus` | `configs/updateMissionStatus.ts` | עדכון אחוז התקדמות (status 0–100) על Mesimabetahalich |
| `updateMissionTimerState` | `configs/updateMissionTimerState.ts` | שמירה/ניקוי שדות טיימר ישנים על Mesimabetahalich (save=hoursdon / clear) |
| `confirmHaluka` | `configs/confirmHaluka.ts` | אישור Haluka ע"י שולח (senderconf) או מקבל (confirmed + spCheck + hervachti distribution) |
| `addHalukaChatEntry` | `configs/addHalukaChatEntry.ts` | הוספת entry לchatre של Haluka (שרת מביא מה-DB ומוסיף) |
| `voteOnDecision` | `configs/voteOnDecision.ts` | הצבעה על החלטת פרויקט — server-authoritative (DB fetch, dedup, consensus → archiveDecision + updateProject.profilePic (pic) + markTimegrama) |

---

## הנחיות למעקב

1. **עדיפות ראשונה:** טבלאות 🔴 — POST מ-components. אלה בלי notifications ו-real-time
2. **לפני migration:** בדוק שה-action לא כבר קיים ברשימת "הוגרו"
3. **לא למחוק sendToSer** עד שכל ה-`[ ]` הפכו ל-`[x]`
4. **תאריך עדכון אחרון:** 2026-05-29 (newlev page secured, unused GraphQL vars cleaned)
