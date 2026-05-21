# מעקב מיגרציה — Unified Action System

> **עדכן מסמך זה** אחרי כל מיגרציה: שנה `[ ]` ל-`[x]` ורשום תאריך.  
> סדר הטיפול: **🔴 קריטי → 🟠 גבוה → 🟡 בינוני → 🟢 נמוך**

---

## סטטיסטיקות

| מדד | ערך |
|-----|-----|
| Actions קיימים (הוגרו) | ~45 |
| קריאות sendToSer במערכת | ~280 |
| קבצים עם קריאות ישנות | ~88 |
| פונקציות ממוקדות לאימגרציה | 23 |

---

## 🔴 עדיפות קריטית — Routes ראשיים

### `/lev`
| פונקציה | קובץ | שורות | פעולה ישנה | Action חדש | סטטוס |
|---------|------|--------|-------------|------------|--------|
| טעינת נתוני lev | `routes/(reg)/lev/+page.server.ts` | 8–20 | `sendToSer('getLevData')` | `getLevData` | `[ ]` |
| אתחול socket listeners | `routes/(reg)/lev/+page.svelte` | 40–80 | `setupSocketListeners()` | שילוב עם socket store קיים | `[ ]` |

### `/moach`
| פונקציה | קובץ | שורות | פעולה ישנה | Action חדש | סטטוס |
|---------|------|--------|-------------|------------|--------|
| רשימת פרויקטים | `routes/(reg)/moach/+page.server.ts` | 11 | `sendToSer({uid}, '64getUserProjectList')` | `getUserProjectList` | `[ ]` |
| בסיס פרויקט + auth | `routes/(reg)/moach/[projectId]/+layout.server.ts` | 8 | `sendToSer({pid}, 'getProjectBaseInfoWithAuth')` | `getProjectBaseInfo` | `[ ]` |

### `/me`
| פונקציה | קובץ | שורות | פעולה ישנה | Action חדש | סטטוס |
|---------|------|--------|-------------|------------|--------|
| עדכון הגדרות guide | `routes/(reg)/me/+page.svelte` | 861, 896 | `fetch('/graphql', { mutation: updateUsersPermissionsUser })` | `toggleGuideStatus` | `[ ]` |
| עדכון פרופיל משתמש | `routes/(reg)/me/+page.svelte` | 700–760 | `fetch('/api/upload')` + `fetch('/graphql')` | `updateUserProfile` | `[ ]` |
| העלאת תמונת פרופיל | `routes/(reg)/me/+page.svelte` | 780–830 | POST ל-`/api/upload` | `uploadProfilePicture` | `[ ]` |

---

## 🟠 עדיפות גבוהה — Moach Views

### Kanban ותתי-מסכים
| פונקציה | קובץ | שורות | פעולה ישנה | Action חדש | סטטוס |
|---------|------|--------|-------------|------------|--------|
| טעינת משימות | `routes/(reg)/moach/[projectId]/kanban/+page.svelte` | 20–45 | `sendToSer('getProjectMissions')` | `getProjectMissions` | `[ ]` |
| טעינת נתוני Gantt | `routes/(reg)/moach/[projectId]/gantt/+page.svelte` | 15–40 | `sendToSer('getProjectMissions')` | `getProjectMissions` | `[ ]` |
| טעינת פרוגרס | `routes/(reg)/moach/[projectId]/progress/[missionId]/+page.svelte` | 18 | `sendToSer('getMissionInProgress')` | `getMissionDetails` | `[ ]` |
| טעינת הצבעות | `routes/(reg)/moach/[projectId]/votes/+page.svelte` | 12–30 | `sendToSer('getVotesData')` | `getProjectVotes` | `[ ]` |

### Actions / Processes
| פונקציה | קובץ | שורות | פעולה ישנה | Action חדש | סטטוס |
|---------|------|--------|-------------|------------|--------|
| טעינת missions + templates | `routes/(reg)/moach/[projectId]/acts/+page.server.ts` | 8 | `sendToSer('getProjectMissions')` | `getProjectMissions` | `[ ]` |
| יצירה — missions + templates | `routes/(reg)/moach/[projectId]/create/+page.server.ts` | 8–9 | שני `sendToSer` | `getProjectMissionsAndTemplates` | `[ ]` |
| רשימת processes | `routes/(reg)/moach/[projectId]/processes/+page.svelte` | 15–35 | `sendToSer('getProcesses')` | `getProjectProcesses` | `[ ]` |
| פרטי acts | `routes/(reg)/moach/[projectId]/acts/[actId]/+page.svelte` | 12–30 | `sendToSer('getActDetails')` | `getActDetails` | `[ ]` |

### Chains
| פונקציה | קובץ | שורות | פעולה ישנה | Action חדש | סטטוס |
|---------|------|--------|-------------|------------|--------|
| טעינת chains — server | `routes/(reg)/moach/[projectId]/chains/+page.server.js` | 50–56 | `fetch('/graphql', chainsQuery)` | `getChainsData` | `[ ]` |
| טעינת extra data — client | `routes/(reg)/moach/[projectId]/chains/+page.svelte` | 118 | `fetch('/graphql', chainExtraQuery)` עם localStorage cache | `getChainExtraData` | `[ ]` |

### Sales / פיננסים
| פונקציה | קובץ | שורות | פעולה ישנה | Action חדש | סטטוס |
|---------|------|--------|-------------|------------|--------|
| נתוני מכירות בטעינה | `routes/(reg)/moach/[projectId]/sales/new/+page.server.ts` | 11–14 | 4 x `sendToSer` במקביל | `getNewSalePageData` | `[ ]` |
| נתוני פיננסים — client | `routes/(reg)/moach/[projectId]/sales/+page.svelte` | 22 | `sendToSer('getProjectFinancials')` ב-onMount | `getProjectFinancials` | `[ ]` |
| split view | `routes/(reg)/moach/[projectId]/split/+page.svelte` | ~20 | `sendToSer('getProjectFinancials')` | `getProjectFinancials` | `[ ]` |

---

## 🟡 עדיפות בינונית — API Endpoints ישנים

| Endpoint | קובץ | פעולה ישנה | פעולה חדשה | סטטוס |
|---------|------|-------------|------------|--------|
| POST `/api/nuti` | `routes/api/nuti/+server.js` | nodemailer ישיר + svelty-email | ← צריך לעבוד דרך EmailService | `[ ]` |
| POST `/api/nutiUser` | `routes/api/nutiUser/+server.js` | bulk email + push + telegram ישיר | ← לעבור לעבוד דרך NotificationOrchestrator | `[ ]` |
| POST `/api/nutifyPm` | `routes/api/nutifyPm/+server.js` | שליחת push ישיר | ← NotificationOrchestrator | `[ ]` |
| POST `/api/onboard/save` | `routes/api/onboard/save/+server.ts` | `fetch('/graphql')` לכמה entities | `saveOnboardingData` action | `[ ]` |
| POST `/api/meeting` | `routes/api/meeting/+server.js` | logic ישן | בדוק אם מכוסה ע"י `createNewMeeting` | `[ ]` |
| POST `/api/ste` | `routes/api/ste/+server.js` | GraphQL ישיר | לבדוק ולהגדיר action | `[ ]` |

---

## 🟢 עדיפות נמוכה — Utilities ישנים

| קובץ | בעיה | פתרון |
|------|------|--------|
| `src/lib/send/sendToSer.js` | proxy ישן עם 280+ שימושים | **לא למחוק** עד שכולם מוגרו. לאחר מיגרציה מלאה — להסיר |
| `src/lib/send/sendToSerTyped.ts` | TypeScript wrapper על sendToSer | להסיר יחד עם sendToSer |
| `src/routes/api/send/+server.js` | generic GraphQL proxy endpoint | להשאיר פעיל עד סוף מיגרציה, אז להסיר |

---

## Actions שכבר הוגרו ✅

> אלה הדוגמאות הטובות — לקרוא לפני כתיבת action חדש

| Action Key | קובץ Config | תיאור |
|-----------|-------------|--------|
| `updateTask` | `configs/updateTask.ts` | עדכון task בפרויקט |
| `createTask` | `configs/createTask.ts` | יצירת task חדש |
| `timerStart` | `configs/timerStart.ts` | התחלת טיימר |
| `timerStop` | `configs/timerStop.ts` | עצירת טיימר |
| `timerSave` | `configs/timerSave.ts` | שמירת זמן |
| `timerLogUpdate` | `configs/timerLogUpdate.ts` | עדכון log טיימר |
| `addVote` | `configs/addVote.ts` | הצבעה (pend/ask/decision/sheirutpend) |
| `createHaluka` | `configs/createHaluka.ts` | יצירת העברת כסף |
| `approveHaluka` | `configs/approveHaluka.ts` | אישור העברה |
| `closeFiniapruval` | `configs/closeFiniapruval.ts` | סגירת אישור סיום |
| `completeMission` | `configs/completeMission.ts` | סיום משימה |
| `createTosplit` | `configs/createTosplit.ts` | יצירת פיצול תשלום |
| `createSheirutpend` | `configs/createSheirutpend.ts` | יצירת בקשת שירות |
| `approveSheirutpend` | `configs/approveSheirutpend.ts` | אישור בקשת שירות |
| `rejectSheirutpend` | `configs/rejectSheirutpend.ts` | דחיית בקשת שירות |
| `createSheirutFromPending` | `configs/createSheirutFromPending.ts` | יצירת שירות מבקשה |
| `createSheirutHaluka` | `configs/createSheirutHaluka.ts` | יצירת העברה בשירות |
| `confirmSheirutHaluka` | `configs/confirmSheirutHaluka.ts` | אישור העברה בשירות |
| `toggleMoneyReceiver` | `configs/toggleMoneyReceiver.ts` | שינוי מקבל כסף |
| `createProcess` | `configs/createProcess.ts` | יצירת process |
| `attachEntityToProcess` | `configs/attachEntityToProcess.ts` | צירוף entity ל-process |
| `ensureProcessForum` | `configs/ensureProcessForum.ts` | יצירת פורום לprocess |
| `ensureSheirutForum` | `configs/ensureSheirutForum.ts` | יצירת פורום לשירות |
| `ensureSheirutpendForum` | `configs/ensureSheirutpendForum.ts` | יצירת פורום לבקשה |
| `ensureStageForum` | `configs/ensureStageForum.ts` | יצירת פורום לשלב |
| `ensureHalukaForum` | `configs/ensureHalukaForum.ts` | יצירת פורום להעברה |
| `createNewMeeting` | `configs/createNewMeeting.ts` | יצירת פגישה |
| `startMeeting` | `configs/startMeeting.ts` | התחלת פגישה |
| `approveMeeting` | `configs/approveMeeting.ts` | אישור פגישה |
| `joinMeeting` | `configs/joinMeeting.ts` | הצטרפות לפגישה |
| `sendMeetingMessage` | `configs/sendMeetingMessage.ts` | שליחת הודעה בפגישה |
| `sendAskMessage` | `configs/sendAskMessage.ts` | שליחת הודעה ב-ask |
| `forum` | `configs/forum.ts` | פעולות פורום |
| `chat` | `configs/chat.ts` | פעולות צ'אט |
| `toggleOnline` | `configs/toggleOnline.ts` | שינוי סטטוס online |
| `createResource` | `configs/createResource.ts` | יצירת resource |
| `updateProjectDetails` | `configs/updateProjectDetails.ts` | עדכון פרטי פרויקט |
| `createComplexMatanot` | `configs/createComplexMatanot.ts` | יצירת BOM מורכב |
| `approveMatanot` | `configs/approveMatanot.ts` | אישור BOM |

---

## הנחיות למעקב

1. **בכל PR מיגרציה** — עדכן את הטבלה המתאימה
2. **אחרי כל action חדש** — הוסף לרשימת "הוגרו"
3. **לא למחוק sendToSer** עד שכל הטבלות ריקות (כל `[ ]` הפכו ל-`[x]`)
4. **תאריך עדכון אחרון:** 2026-05-21
