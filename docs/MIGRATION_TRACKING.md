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
| Actions קיימים (הוגרו) | ~45 |
| קריאות sendToSer במערכת | ~280 |
| קבצי components עם POST ישן | ~28 |
| POST operations לא מוגרות | ~50 |
| GET operations לא מוגרות | ~20 |

---

## 🔴 עדיפות קריטית — POST מ-Components (לא עוברים דרך /api/action)

### אלה הפונקציות שחייבות notifications + real-time ולא מקבלות אותם כרגע

---

### `src/lib/components/lev/`

| פעולה | קובץ | שורות | Pattern ישן | Action חדש | Notifications נדרשות | סטטוס |
|-------|------|--------|-------------|------------|----------------------|--------|
| שליחת email notification על בקשת שירות | `lev/reqtosherut.svelte` | 272–285 | `fetch('/api/sma', POST)` | `sendSheirutRequestEmail` | מבקש + חברי פרויקט | `[ ]` |
| שליחת email notification על בקשת שירות (2) | `lev/reqtosherut.svelte` | 421–434 | `fetch('/api/sma', POST)` | `sendSheirutRequestEmail` | מבקש + חברי פרויקט | `[ ]` |
| אישור הלוקה (כולם אישרו) | `lev/halukaask.svelte` | 170–182 | `fetch('/api/approveHaluka', POST)` | `approveHaluka` ← **קיים!** לבדוק אם מחובר | משתתפים + פרויקט | `[ ]` |
| עדכון לחיצה על כרטיס ברוך הבא | `lev/welcomeTo.svelte` | 41–57 | `fetch('/graphql', mutation updateWelcomTop)` | `updateWelcomeCard` | — | `[ ]` |
| סטטוס task (taskishor/busabe/updStat) | `lev/missionInProgress.svelte` | 720–727, 742–749, 764–771 | `sendToSer(...)` × 3 | `updateTaskStatus` | חברי פרויקט (real-time) | `[ ]` |
| לחיצה על כרטיס ברוך הבא | `lev/cards/welcomeToCard.svelte` | 26 | `sendToSer(...)` | `updateWelcomeCard` | — | `[ ]` |
| בקשת join לפרויקט | `lev/reqtojoin.svelte` | 354–361, 428–435 | `sendToSer(...)` × 2 | `requestProjectJoin` | מנהל פרויקט | `[ ]` |

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
| עדכון סטטוס task | `prPr/tasks/chooseM.svelte` | 48 | `sendToSer(...)` | `updateTask` ← **קיים!** לבדוק אם מחובר | חברי פרויקט | `[ ]` |
| סימון act כ-done / set status | `prPr/tasks/Myacts.svelte` | 127–155 | `sendToSer(...)` × 2 | `markActDone` + `setActStatus` | מקצה + חברי פרויקט | `[ ]` |
| פעולות הלוקה / tosplit | `prPr/whowhat.svelte` | 252–481 | `sendToSer(...)` (פעולות מרובות) | לפי סוג: `createHaluka` / `createTosplit` ← **קיימים!** | משתתפים + פרויקט | `[ ]` |

---

### `src/lib/components/userPr/`

| פעולה | קובץ | שורות | Pattern ישן | Action חדש | Notifications נדרשות | סטטוס |
|-------|------|--------|-------------|------------|----------------------|--------|
| יצירת API key | `userPr/editBasic.svelte` | 231–239 | `fetch('/api/api-keys', POST)` | `createApiKey` | user (email אישור) | `[ ]` |
| מחיקת API key | `userPr/editBasic.svelte` | 266–268 | `fetch('/api/api-keys', DELETE)` | `deleteApiKey` | user | `[ ]` |
| שינוי סיסמה | `userPr/editBasic.svelte` | 361–373 | `axios.post('/api/auth/change-password')` | `changePassword` | user (email אישור security) | `[ ]` |
| עדכון guide status | `userPr/editBasic.svelte` | 450–465 | `fetch('/graphql', mutation updateUsersPermissionsUser)` | `toggleGuideStatus` | — | `[ ]` |
| עדכון relations של משתמש | `userPr/edit.svelte` | 128–148 | `fetch('/graphql', mutation updateUsersPermissionsUser)` | `updateUserRelations` | user + פרויקטים קשורים | `[ ]` |
| יצירת resource/need (sp) | `userPr/newsp.svelte` | 77–99 | `fetch('/graphql', mutation createSp)` | `createResourceRequest` | חברי פרויקט + matching users | `[ ]` |
| עדכון resource/need (sp) | `userPr/editsp.svelte` | 62–84 | `fetch('/graphql', mutation updateSp)` | `updateResourceRequest` | חברי פרויקט | `[ ]` |

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

---

## הנחיות למעקב

1. **עדיפות ראשונה:** טבלאות 🔴 — POST מ-components. אלה בלי notifications ו-real-time
2. **לפני migration:** בדוק שה-action לא כבר קיים ברשימת "הוגרו"
3. **לא למחוק sendToSer** עד שכל ה-`[ ]` הפכו ל-`[x]`
4. **תאריך עדכון אחרון:** 2026-05-21
