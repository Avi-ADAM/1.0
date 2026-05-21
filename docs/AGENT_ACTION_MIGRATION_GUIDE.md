# מדריך מיגרציה לסוכן — המרת פונקציות למערכת Actions

> **מסמך זה מיועד לסוכן AI** שמבצע מיגרציה של פונקציות ישנות למערכת ה-Unified Action System.  
> קרא אותו **לפני** שאתה נוגע בכל קוד.

---

## 1. רקע — למה מערכת Actions?

הפרויקט עובד עם SvelteKit + Strapi (GraphQL). בעבר, כל קומפוננט/route שלח בקשות GraphQL ישירות דרך `sendToSer()` או `fetch('/graphql', ...)`.

**הבעיות עם הגישה הישנה:**
- ה-JWT token חשוף בצד לקוח → סכנת אבטחה
- קוד כפול בין pages שונים (אותה query מועתקת 10 פעמים)
- אין ולידציה אחידה של פרמטרים
- אין מנגנון הרשאות עקבי
- קשה להפעיל מ-MCP bot עתידי

**מה שה-Action System פותר:**
- Token נשאר בשרת בלבד (HttpOnly cookies → ActionService → Strapi)
- קוד מרכזי לכל ה-endpoints
- ולידציה + הרשאות מוגדרות פעם אחת
- Notifications (push, email, telegram, socket) מופעלות אוטומטית
- Client מקבל UpdateStrategy — ידע מה לרענן

---

## 2. ארכיטקטורת המערכת

```
Client (.svelte)
    │
    │ executeAction('actionKey', { params })
    ▼
/src/lib/client/actionClient.ts
    │
    │ POST /api/action
    ▼
/src/routes/api/action/+server.ts
    │
    │ ActionService.executeAction()
    ▼
/src/lib/server/actions/ActionService.ts
    ├── ValidationEngine (validates params)
    ├── AuthorizationEngine (checks JWT/permissions)
    ├── StrapiClient (executes GraphQL)
    └── NotificationOrchestrator (sends notifications async)
    │
    ▼
Result + UpdateStrategy → Client
```

**קבצי הליבה:**
| קובץ | תפקיד |
|------|--------|
| `src/lib/server/actions/types.ts` | כל ה-TypeScript interfaces |
| `src/lib/server/actions/registry.ts` | רישום ה-actions הידועים |
| `src/lib/server/actions/configs/` | קובץ לכל action |
| `src/lib/client/actionClient.ts` | ממשק צד-לקוח |
| `src/routes/api/action/+server.ts` | API endpoint |

---

## 3. שלבי המרת פונקציה — Step by Step

### שלב א: ניתוח הפונקציה הקיימת

לפני שכותבים קוד, עני על השאלות:

1. **מה הפונקציה עושה?** (קריאה/כתיבה/עדכון?)
2. **מה ה-GraphQL operation ID (queId / mutation name)?**
3. **אילו params נדרשים?** (שמות, טיפוסים, האם required?)
4. **מי מורשה לבצע?** (JWT בלבד? חבר פרויקט? custom?)
5. **מה צריך לקרות אחרי?** (רענון דף? עדכון חלקי? notification?)
6. **האם שולחת email/push/telegram?**

**דוגמה לניתוח:**
```javascript
// קוד ישן שמצאנו ב-me/+page.svelte שורה 861:
const res = await fetch('/graphql', {
  method: 'POST',
  body: JSON.stringify({
    query: `mutation { updateUsersPermissionsUser(id: "${userId}", data: { showGuide: false }) { data { id } } }`
  })
});

// ניתוח:
// 1. פעולה: עדכון showGuide של משתמש
// 2. GraphQL: updateUsersPermissionsUser mutation  
// 3. Params: userId (string, required), showGuide (boolean, required)
// 4. הרשאות: JWT בלבד (מעדכן את עצמו)
// 5. Update: partialUpdate על user data
// 6. Notifications: אין
```

---

### שלב ב: יצירת קובץ Action Config

צור קובץ חדש: `src/lib/server/actions/configs/[actionName].ts`

**Template מלא:**
```typescript
// src/lib/server/actions/configs/toggleGuideStatus.ts

import type { ActionConfig } from '../types';

const toggleGuideStatusConfig: ActionConfig = {
  key: 'toggleGuideStatus',
  description: 'Toggle the guide visibility for a user',

  // GraphQL operation ID מה-QIDS, או custom handler
  graphqlOperation: 'updateUsersPermissionsUser', // ← queId מ-sendToSer, או string של mutation
  
  // פרמטרים שהפונקציה מקבלת
  paramSchema: {
    userId: {
      type: 'string',
      required: true,
      description: 'The ID of the user to update'
    },
    showGuide: {
      type: 'boolean',
      required: true,
      description: 'Whether to show the guide'
    }
  },

  // כלל הרשאות — מי יכול לבצע?
  authRules: [
    { type: 'jwt' } // כל משתמש מחובר
    // לפרויקטים: { type: 'projectMember', config: { projectIdParam: 'projectId' } }
    // לפורום: { type: 'forumParticipant', config: { forumIdParam: 'forumId' } }
  ],

  // עדכון ה-client אחרי הפעולה
  updateStrategy: {
    type: 'partialUpdate',
    config: {
      dataKeys: ['userData'] // מפתחות store שצריך לרענן
    }
  },

  // Notifications (אופציונלי)
  // notification: {
  //   recipients: { type: 'specificUsers', config: { userIdParams: ['userId'] } },
  //   templates: {
  //     title: { he: 'עדכון', en: 'Update' },
  //     body: { he: 'הגדרות עודכנו', en: 'Settings updated' }
  //   },
  //   channels: ['socket']
  // }
};

export default toggleGuideStatusConfig;
```

**אם צריך logic מורכב (לא GraphQL פשוט), השתמש ב-custom handler:**
```typescript
graphqlOperation: async (params, context, { strapi }) => {
  // קוד מותאם אישית
  const result = await strapi.query('someQuery', { id: params.userId });
  
  // עיבוד נוסף
  if (result.someCondition) {
    await strapi.mutate('anotherMutation', { ... });
  }
  
  return result;
}
```

---

### שלב ג: רישום ה-Action ב-Registry

פתח `src/lib/server/actions/registry.ts` והוסף:

```typescript
import toggleGuideStatusConfig from './configs/toggleGuideStatus';

// בתוך המפה הקיימת:
export const ACTION_REGISTRY: Record<string, ActionConfig> = {
  // ... existing actions ...
  toggleGuideStatus: toggleGuideStatusConfig,  // ← הוסף כאן
};
```

---

### שלב ד: הוספת Type-Safe Helper ב-ActionClient (אופציונלי)

פתח `src/lib/client/actionClient.ts` והוסף helper:

```typescript
// Helper type-safe לשימוש קל
export async function toggleGuideStatus(
  userId: string,
  showGuide: boolean,
  options?: ActionOptions
): Promise<ActionResult> {
  return executeAction('toggleGuideStatus', { userId, showGuide }, options);
}
```

---

### שלב ה: עדכון הקוד הישן ב-.svelte

**לפני (קוד ישן):**
```javascript
const res = await fetch('/graphql', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    query: `mutation { ... }`
  })
});
const data = await res.json();
```

**אחרי (קוד חדש):**
```javascript
import { executeAction } from '$lib/client/actionClient';

// option 1: generic
const result = await executeAction('toggleGuideStatus', { 
  userId: currentUserId, 
  showGuide: false 
});

// option 2: type-safe helper (אם הוספת ב-actionClient)
const result = await toggleGuideStatus(currentUserId, false);

if (result.success) {
  // עדכון UI (או UpdateStrategy עושה את זה אוטומטית)
}
```

---

### שלב ו: בדיקה

1. **בדוק TypeScript errors:** `npm run check`
2. **בדוק שה-registry.ts מייבא נכון**
3. **בדוק שה-params מגיעים נכון מה-client**
4. **בדוק שה-authRules מגדירים בצורה מדויקת** (אל תשים `jwt` אם צריך בדיקת membership)
5. **בדוק notifications** — האם המדיה הנכונה נשלחת?

---

## 4. סוגי authRules

### `jwt` — כל משתמש מחובר
```typescript
authRules: [{ type: 'jwt' }]
```

### `projectMember` — חבר בפרויקט
```typescript
authRules: [{
  type: 'projectMember',
  config: { projectIdParam: 'projectId' } // param שמכיל project ID
}]
```

### `forumParticipant` — משתתף בפורום
```typescript
authRules: [{
  type: 'forumParticipant',
  config: { forumIdParam: 'forumId' }
}]
```

### `sheirutCustomer` — לקוח שירות
```typescript
authRules: [{
  type: 'sheirutCustomer',
  config: { sheirutIdParam: 'sheirutId' }
}]
```

### `or` — אחד מכמה כללים
```typescript
authRules: [{
  type: 'or',
  config: {
    rules: [
      { type: 'projectMember', config: { projectIdParam: 'projectId' } },
      { type: 'role', config: { roles: ['admin'] } }
    ]
  }
}]
```

---

## 5. סוגי UpdateStrategy

### `fullRefresh` — רענון מלא של הדף
```typescript
updateStrategy: { type: 'fullRefresh' }
```

### `partialUpdate` — רענון מפתחות store מסוימים
```typescript
updateStrategy: {
  type: 'partialUpdate',
  config: { dataKeys: ['tasks', 'missions', 'votes'] }
}
```

### `optimistic` — עדכון אופטימיסטי (מיד, לפני תגובת שרת)
```typescript
updateStrategy: {
  type: 'optimistic',
  config: { updateFunction: 'appendVote' }
  // updateFunction חייבת להיות מוגדרת ב-actionClient.ts
}
```

### `none` — אין עדכון אוטומטי
```typescript
updateStrategy: { type: 'none' }
```

---

## 6. מבנה Notification Config

```typescript
notification: {
  // מי מקבל?
  recipients: {
    type: 'projectMembers',       // כל חברי הפרויקט
    // type: 'specificUsers'      // משתמשים מוגדרים
    // type: 'meetingParticipants' // משתתפי פגישה
    // type: 'askParticipants'    // מצביעים ב-ask
    config: {
      projectIdParam: 'projectId', // שם ה-param
      excludeSender: true          // לא לשלוח לשולח עצמו
    }
  },
  
  // תוכן ההודעה (placeholder: {{senderName}}, {{content}}, {{projectName}})
  templates: {
    title: { he: '{{senderName}} עדכן משימה', en: '{{senderName}} updated a task' },
    body: { he: 'משימה: {{name}}', en: 'Task: {{name}}' }
  },
  
  // ערוצי שליחה
  channels: ['socket', 'email', 'push', 'telegram'],
  
  // תבנית email (אחת מהקיימות)
  emailTemplate: 'SimpleNuti', // 'PendJustCreated', 'HalukaApproved', 'ComeVoteJoin'
  
  // מטא-דאטה
  metadata: {
    icon: '/icon.png',
    url: '/moach/{{projectId}}'
  }
}
```

---

## 7. שימוש ב-Server-Side Actions (SSR / +page.server.ts)

לעיתים צריך לקרוא ל-action מתוך `+page.server.ts` ולא מה-client:

```typescript
// src/routes/(reg)/moach/+page.server.ts
import { ActionService } from '$lib/server/actions/ActionService';

export const load = async ({ cookies, fetch }) => {
  const actionService = new ActionService(fetch);
  
  const result = await actionService.executeAction(
    'getUserProjects',
    { userId: cookies.get('id') },
    {
      userId: cookies.get('id'),
      jwt: cookies.get('jwt'),
      lang: cookies.get('lang') || 'he',
      isSer: true  // ← מסמן שזו קריאת שרת (משתמש ב-admin token)
    }
  );
  
  return {
    projects: result.data
  };
};
```

---

## 8. דגלים חשובים — שגיאות נפוצות

| שגיאה | פתרון |
|-------|--------|
| `Action not found in registry` | הוסף לקובץ registry.ts |
| `Validation failed: field required` | וודא שכל required params נשלחים מה-client |
| `Authorization failed` | בדוק שה-authRules מתאים לסיטואציה |
| `GraphQL operation not found` | בדוק שה-queId נכון ב-QIDS system |
| `Cannot read cookies on client` | אל תקרא לבקשת server ישירות מ-client, השתמש ב-actionClient |
| TypeScript errors ב-paramSchema | בדוק שה-types מדויקים (string/number/boolean/array/object) |

---

## 9. Checklist לפני Merge

- [ ] קובץ action config נוצר ב-`configs/`
- [ ] נרשם ב-`registry.ts`
- [ ] TypeScript נקי (`npm run check`)  
- [ ] authRules מוגדרים נכון (לא חסרים, לא יתרים)
- [ ] paramSchema מלא עם כל השדות
- [ ] הקוד הישן (sendToSer/fetch/graphql) הוסר
- [ ] הוספת helper type-safe ל-actionClient (אם צריך)
- [ ] notifications מוגדרות (אם הפונקציה הישנה שלחה emails/push)
- [ ] updateStrategy מתאים (לא fullRefresh כשאפשר partialUpdate)
- [ ] נבדק על branch claude/unified-action-migration-dbVrQ

---

## 10. דוגמאות קיימות ללמידה

לדוגמאות טובות, ראה actions שכבר הוגרו:
- `src/lib/server/actions/configs/updateTask.ts` — action מורכב עם validation
- `src/lib/server/actions/configs/addVote.ts` — action עם custom handler
- `src/lib/server/actions/configs/createHaluka.ts` — action עם notifications
- `src/lib/server/actions/configs/timerStart.ts` — action פשוט עם JWT auth
