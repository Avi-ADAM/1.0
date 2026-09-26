# אפיון — Socket Real-Time: מה קיים, מה חסר, מה להוסיף

> **מטרה:** לנצל את תשתית ה-Socket.IO שכבר קיימת בצורה מלאה,  
> ולהפוך את האפליקציה ל-real-time באמת — לא רק notifications, אלא UI חי.

---

## 1. מה קיים כיום

### 1.1 ארכיטקטורה קיימת

```
[Client Browser]
     │ socket.io-client
     ▼
[Socket Server] — standalone Node.js app (/socket-server/)
     ▲
     │ POST /broadcast (HTTP)
[ActionService] (SvelteKit server)
     │
     ▼ (after action execution)
[NotificationOrchestrator] → SocketIOServer.broadcast()
```

**קבצים קיימים:**
| קובץ | תפקיד |
|------|--------|
| `/socket-server/index.js` | Socket.IO server עצמאי (מנהל connections) |
| `/src/lib/stores/socketClient.ts` | Store בclient — מתחבר, מקשיב, מפעיל updateStrategy |
| `/src/lib/server/notifications/SocketIOServer.ts` | Client של SvelteKit → Socket server |

### 1.2 מה ה-Socket עושה כרגע

```typescript
// socketClient.ts — event שמגיע:
socket.on('notification', (payload: NotificationPayload) => {
  // מציג toast
  showToast(payload.title, payload.body);
  
  // מפעיל UpdateStrategy
  if (payload.updateStrategy) {
    executeUpdateStrategy(payload.updateStrategy);
  }
});
```

**NotificationPayload:**
```typescript
interface NotificationPayload {
  title: string;
  body: string;
  icon?: string;
  url?: string;
  updateStrategy?: UpdateStrategy;  // fullRefresh | partialUpdate | optimistic | none
  metadata?: Record<string, any>;
}
```

### 1.3 מה UpdateStrategy עושה כרגע

```typescript
// types: 'fullRefresh' | 'partialUpdate' | 'optimistic' | 'none'

// fullRefresh → invalidateAll() (טעון מחדש כל הדף)
// partialUpdate → reload מפתחות store מסוימים
// optimistic → מעדכן store מיד (optimistic)
// none → רק toast, ללא עדכון
```

**בעיה:** `fullRefresh` = כל הדף נטען מחדש = UX גרוע.  
`partialUpdate` עדיין לא ברור מה בדיוק הוא מרענן.

---

## 2. מה חסר — Gap Analysis

### 2.1 אין Real-Time State Sync אמיתי
**קיים:** notification מגיע → toast + reload דף  
**חסר:** שינוי data בזמן אמת ב-UI ללא reload

**דוגמה:** אם מישהו מעדכן task בkanban — user אחר לא רואה את זה עד שהוא מרענן.

### 2.2 אין Presence System
**חסר:** "מי מחובר עכשיו לפרויקט הזה?"  
**ערך:** שיתוף עבודה, ראיית עמיתים online

### 2.3 אין Collaborative Editing
**חסר:** אם שני אנשים עורכים אותו task — conflict  
**נדרש:** lock mechanism או operational transform בסיסי

### 2.4 אין Live Cursor / Activity Indicators
**חסר:** "X עורך את המשימה הזאת עכשיו"

### 2.5 Kanban — אין real-time
**קיים:** כשמשתמש A מזיז task → אין עדכון ל-B  
**נדרש:** task moves מתעדכנים live

### 2.6 Timer — אין real-time
**קיים:** timer מוצג רק על הbutton של המשתמש עצמו  
**נדרש:** ראיית timer פעיל של עמיתים (מי עובד על מה)

### 2.7 Forum / Chat — חצי real-time
**קיים:** הודעות מגיעות דרך socket  
**חסר:** "typing..." indicator, read receipts

### 2.8 Voting — אין real-time
**קיים:** הצבעה מוצגת רק אחרי refresh  
**נדרש:** counter מתעדכן live כשמישהו מצביע

---

## 3. ארכיטקטורה מוצעת — Real-Time מלא

### 3.1 Socket Events — מפה מלאה

**Events שה-server שולח ל-client:**

```typescript
// Events קיימים:
'notification'         // general notification עם updateStrategy

// Events חדשים נדרשים:
'task:updated'         // { taskId, projectId, changes }
'task:moved'           // { taskId, projectId, fromStatus, toStatus }
'task:created'         // { task, projectId }
'task:deleted'         // { taskId, projectId }

'vote:cast'            // { subjectId, subjectType, voterId, what, progress }
'vote:resolved'        // { subjectId, result: 'passed' | 'rejected' }

'user:presence'        // { userId, projectId, status: 'online' | 'offline' | 'idle' }
'user:typing'          // { userId, forumId, isTyping: boolean }
'user:viewing'         // { userId, projectId, view: 'kanban' | 'gantt' | ... }
'user:editing'         // { userId, entityType, entityId, action: 'start' | 'stop' }

'timer:started'        // { userId, taskId, projectId }
'timer:stopped'        // { userId, taskId, projectId, duration }

'forum:message'        // { forumId, message }
'forum:read'           // { forumId, userId, messageId }

'process:step_changed' // { processId, fromStep, toStep }
'mission:completed'    // { missionId, projectId }
```

**Events שה-client שולח לsharing state:**
```typescript
'user:join_project'    // { projectId } → subscribe לroom
'user:leave_project'   // { projectId } → unsubscribe
'user:start_editing'   // { entityType, entityId }
'user:stop_editing'    // { entityType, entityId }
'user:typing'          // { forumId, isTyping }
```

---

### 3.2 Socket Rooms — ארגון connections

```javascript
// socket-server — ניהול rooms
socket.on('join_project', ({ projectId, userId }) => {
  socket.join(`project:${projectId}`);           // room פרויקט
  socket.join(`user:${userId}`);                  // room אישי (קיים)
  
  // הודע לכולם בפרויקט שמישהו הצטרף
  socket.to(`project:${projectId}`).emit('user:presence', {
    userId, status: 'online', projectId
  });
});

socket.on('disconnect', () => {
  // הודע לכל הrooms שהוא עזב
  for (const room of socket.rooms) {
    if (room.startsWith('project:')) {
      socket.to(room).emit('user:presence', { userId, status: 'offline' });
    }
  }
});
```

---

### 3.3 ActionService — Broadcast ספציפי

כרגע ActionService תמיד שולח `notification`. צריך להוסיף event-specific broadcasts:

```typescript
// ActionService.ts — הוסף socketEvent לActionConfig
interface ActionConfig {
  // ... existing ...
  socketEvent?: {
    eventName: string;         // 'task:updated'
    room: string;              // 'project:{{projectId}}'
    dataMapper: (params, result) => Record<string, any>;
  };
}

// updateTask.ts config:
socketEvent: {
  eventName: 'task:updated',
  room: 'project:{{projectId}}',
  dataMapper: (params, result) => ({
    taskId: params.taskId,
    projectId: params.projectId,
    changes: result.changes,
    updatedBy: params.userId
  })
}
```

---

### 3.4 Client-Side — Svelte 5 Real-Time Stores

```typescript
// lib/stores/realtimeStore.svelte.ts

// Presence store
export const presenceStore = $state<Record<string, UserPresence>>({});

// Kanban real-time
export const realtimeTaskUpdates = $state<TaskUpdate[]>([]);

// Voting real-time  
export const realtimeVoteUpdates = $state<Record<string, VoteProgress>>({});

// Socket setup
export function setupProjectSocket(projectId: string) {
  socket.emit('user:join_project', { projectId });
  
  socket.on('task:updated', (data) => {
    // עדכן store ישירות ← ללא reload!
    updateTaskInStore(data.taskId, data.changes);
  });
  
  socket.on('vote:cast', (data) => {
    realtimeVoteUpdates[data.subjectId] = data.progress;
  });
  
  socket.on('user:presence', (data) => {
    presenceStore[data.userId] = { status: data.status, lastSeen: Date.now() };
  });
  
  return () => socket.emit('user:leave_project', { projectId });
}
```

---

## 4. תכנית יישום — שלבים

### שלב 1: Task Real-Time ב-Kanban (גבוה — 3 ימים)

**מה:** כשמישהו מזיז/מעדכן task, כולם בפרויקט רואים בזמן אמת

**שינויים:**
1. `socket-server`: הוסף `join_project` / `leave_project` room management
2. `ActionService`: הוסף `socketEvent` לconfig של `updateTask`, `createTask`
3. `SocketIOServer.ts`: הוסף `broadcastToRoom(room, event, data)` method
4. `socketClient.ts`: הוסף listener ל-`task:updated`, `task:moved`
5. Kanban component: subscribe ל-socket events ועדכן UI

**תוצאה:** Kanban מתעדכן live ללא refresh

---

### שלב 2: Presence System (בינוני — 2 ימים)

**מה:** "מי מחובר עכשיו?"

**שינויים:**
1. `socket-server`: ניהול presence per project room
2. `socketClient.ts`: שלח join/leave events בטעינת/עזיבת page
3. UI: chip/avatar indicator "מחובר עכשיו"

**תוצאה:** בלב הפרויקט רואים מי online

---

### שלב 3: Voting Real-Time (בינוני — 1.5 ימים)

**מה:** counter הצבעות מתעדכן live

**שינויים:**
1. `addVote.ts`: הוסף socketEvent ל-`vote:cast` ו-`vote:resolved`
2. `socketClient.ts`: listener ל-vote events
3. VotePanel component: reactive ל-realtimeVoteUpdates store

**תוצאה:** רואים הצבעות מגיעות בזמן אמת

---

### שלב 4: Timer Real-Time (נמוך — 2 ימים)

**מה:** רואים מי עובד עכשיו ועל מה

**שינויים:**
1. `timerStart/Stop.ts`: הוסף socket event
2. לב פרויקט: "X עובד עכשיו על [שם משימה]"

---

### שלב 5: Forum Typing Indicator (נמוך — 1 יום)

**מה:** "X מקליד..."

**שינויים:**
1. Forum component: שלח `user:typing` event בזמן הקלדה (debounced)
2. `socket-server`: broadcast ל-room
3. Forum component: הצג "X מקליד..."

---

### שלב 6: Editing Lock (נמוך — 2 ימים)

**מה:** מניעת עריכה במקביל

**שינויים:**
1. כשמשתמש פותח edit mode → emit `user:start_editing`
2. `socket-server`: שמור lock state
3. אחרים: מקבלים notification "X עורך כרגע"
4. כשסוגר → emit `user:stop_editing`

---

## 5. מצב Socket Server — שיפורים נדרשים

### 5.1 שיפורים בsocket-server קיים
```javascript
// socket-server/index.js — הוסף:

// 1. Room management
const projectRooms = new Map(); // projectId → Set<userId>

// 2. Presence tracking  
const userPresence = new Map(); // userId → { projectId, connectedAt }

// 3. New endpoint: room broadcast
app.post('/broadcast-room', (req, res) => {
  const { room, event, data } = req.body;
  io.to(room).emit(event, data);
  res.json({ success: true });
});

// 4. Graceful disconnect
io.on('disconnect', (socket) => {
  const presence = userPresence.get(socket.userId);
  if (presence) {
    io.to(`project:${presence.projectId}`).emit('user:presence', {
      userId: socket.userId, status: 'offline'
    });
    userPresence.delete(socket.userId);
  }
});
```

### 5.2 הוסף endpoint לquality metrics
```javascript
// GET /metrics
app.get('/metrics', (req, res) => {
  res.json({
    totalConnections: io.sockets.sockets.size,
    rooms: Object.fromEntries(
      [...io.sockets.adapter.rooms.entries()]
        .filter(([room]) => room.startsWith('project:'))
        .map(([room, clients]) => [room, clients.size])
    ),
    uptime: process.uptime()
  });
});
```

---

## 6. עדיפויות וROI

| Feature | מאמץ | ROI | עדיפות |
|---------|------|-----|--------|
| Task real-time (kanban) | 3 ימים | גבוה מאוד | 🔴 ראשון |
| Presence system | 2 ימים | גבוה | 🟠 שני |
| Voting real-time | 1.5 ימים | גבוה | 🟠 שני |
| Timer real-time | 2 ימים | בינוני | 🟡 שלישי |
| Typing indicator | 1 יום | בינוני | 🟡 שלישי |
| Editing lock | 2 ימים | נמוך | 🟢 רביעי |

---

## 7. דברים שצריך לבדוק לפני יישום

1. **Socket server scalability** — כרגע instance יחיד. אם יש כמה instances → צריך Redis adapter
2. **Authentication** — JWT verification ב-socket handshake (בדוק שזה קיים!)
3. **Reconnection state** — אם client מתנתק ומתחבר מחדש, האם מקבל missed events?
4. **Mobile** — Capacitor app עם socket.io-client — בדוק שעובד ב-background
5. **Memory leaks** — הוסף cleanup ל-event listeners כש-component מתפרק ב-Svelte
