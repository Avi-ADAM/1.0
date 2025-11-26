# Lev Page Socket Integration - Complete Guide

## סקירה כללית

המערכת החדשה מאפשרת עדכון אוטומטי של עמוד הלב (Lev page) בזמן אמת כאשר מתבצעות פעולות במערכת. זה מבוסס על:

1. **Unified Action System** - מערכת מאוחדת לניהול פעולות
2. **Socket.IO** - תקשורת בזמן אמת
3. **Update Strategies** - אסטרטגיות עדכון חכמות

## איך זה עובד?

### זרימת המידע

```
User Action → Action API → Action Service → Strapi (Save)
                                    ↓
                          Notification Orchestrator
                                    ↓
                    ┌───────────────┼───────────────┐
                    ↓               ↓               ↓
              Socket.IO         Email          Telegram
                    ↓
            All Project Members
                    ↓
            Lev Page Updates
```

### שלבים מפורטים

1. **משתמש מבצע פעולה** (למשל: יוצר Tosplit)
   ```javascript
   await actionClient.execute('createTosplit', { data: {...} });
   ```

2. **Action Service מעבד את הפעולה**
   - מאמת פרמטרים
   - בודק הרשאות
   - שומר ב-Strapi

3. **Notification Orchestrator שולח התראות**
   - מזהה מי צריך לקבל עדכון (כל חברי הפרויקט)
   - שולח דרך כל הערוצים (Socket, Email, Telegram, Push)

4. **Socket.IO משדר לכל המחוברים**
   ```javascript
   socket.emit('notification', {
     actionKey: 'createTosplit',
     title: { he: 'הצעה לחלוקת רווחים' },
     body: { he: 'הוגשה הצעה חדשה...' },
     updateStrategy: {
       type: 'partialUpdate',
       config: { dataKeys: ['tosplits', 'halukas'] }
     }
   });
   ```

5. **עמוד הלב מקבל ומעדכן**
   ```javascript
   socket.on('notification', async (notification) => {
     // מציג toast
     toast.info(notification.title.he, { 
       description: notification.body.he 
     });
     
     // מעדכן מידע
     if (notification.updateStrategy?.type === 'partialUpdate') {
       update = true;
       await start(); // טוען מחדש את כל המידע
     }
   });
   ```

## קוד שנוסף לעמוד הלב

### 1. Imports

```javascript
import { socketClient } from '$lib/stores/socketClient';
import { onDestroy } from 'svelte';
```

### 2. Socket Listener (בתוך onMount)

```javascript
// ===== NEW UNIFIED ACTION SYSTEM LISTENER =====
socket.on('notification', async (notification) => {
  console.log('🔔 Received notification from action system:', notification);
  
  const { actionKey, updateStrategy, data: notificationData } = notification;
  
  // Handle different update strategies
  if (updateStrategy?.type === 'fullRefresh') {
    console.log('📥 Full refresh triggered by:', actionKey);
    update = true;
    await start();
    
    // Show toast notification
    const lang = get(locale);
    const title = notification.title?.[lang] || notification.title?.he || 'עדכון';
    const body = notification.body?.[lang] || notification.body?.he || '';
    
    if (document.visibilityState === 'visible') {
      toast.info(title, { description: body });
    } else {
      nutifi(title, body);
    }
  } 
  else if (updateStrategy?.type === 'partialUpdate') {
    console.log('🔄 Partial update triggered by:', actionKey);
    update = true;
    await start();
    
    const lang = get(locale);
    const title = notification.title?.[lang] || notification.title?.he || 'עדכון';
    const body = notification.body?.[lang] || notification.body?.he || '';
    
    if (document.visibilityState === 'visible') {
      toast.info(title, { description: body });
    } else {
      nutifi(title, body);
    }
  }
  else if (updateStrategy?.type === 'optimistic') {
    console.log('⚡ Optimistic update triggered by:', actionKey);
    const lang = get(locale);
    const title = notification.title?.[lang] || notification.title?.he || 'עדכון';
    const body = notification.body?.[lang] || notification.body?.he || '';
    
    if (document.visibilityState === 'visible') {
      toast.success(title, { description: body });
    }
  }
  else {
    console.log('📢 Notification only (no update):', actionKey);
    const lang = get(locale);
    const title = notification.title?.[lang] || notification.title?.he || 'התראה';
    const body = notification.body?.[lang] || notification.body?.he || '';
    
    if (document.visibilityState === 'visible') {
      toast.info(title, { description: body });
    } else {
      nutifi(title, body);
    }
  }
});
// ===== END NEW UNIFIED ACTION SYSTEM LISTENER =====
```

## Update Strategies

המערכת תומכת ב-4 אסטרטגיות עדכון:

### 1. fullRefresh
טוען מחדש את **כל** המידע מהשרת.

```javascript
updateStrategy: {
  type: 'fullRefresh'
}
```

**מתי להשתמש:**
- כשיש שינוי משמעותי במבנה הנתונים
- כשלא ברור בדיוק מה השתנה

### 2. partialUpdate
טוען מחדש רק חלקים ספציפיים מהמידע.

```javascript
updateStrategy: {
  type: 'partialUpdate',
  config: {
    dataKeys: ['tosplits', 'halukas', 'splits']
  }
}
```

**מתי להשתמש:**
- כשיודעים בדיוק איזה מידע השתנה
- רוב המקרים (יעיל יותר)

**כרגע:** מבצע full refresh, בעתיד נוכל לייעל

### 3. optimistic
מעדכן את ה-UI מיד, בלי לחכות לשרת.

```javascript
updateStrategy: {
  type: 'optimistic'
}
```

**מתי להשתמש:**
- פעולות מהירות (like, vote)
- כשרוצים UX מהיר

### 4. none
רק מציג התראה, לא מעדכן מידע.

```javascript
updateStrategy: {
  type: 'none'
}
```

**מתי להשתמש:**
- התראות מידע בלבד
- כשהמידע לא רלוונטי לעמוד הנוכחי

## איך להוסיף Action חדש עם Socket Updates

### שלב 1: הגדר את ה-Action Config

```typescript
// src/lib/server/actions/configs/myAction.ts

export const myActionConfig: ActionConfig = {
  key: 'myAction',
  description: 'תיאור הפעולה',
  graphqlOperation: 'QIDS_NUMBER',
  
  paramSchema: {
    // הגדר פרמטרים...
  },
  
  authRules: [
    { type: 'jwt' },
    { type: 'projectMember', config: { projectIdParam: 'projectId' } }
  ],
  
  // ⭐ זה החלק החשוב!
  notification: {
    recipients: {
      type: 'projectMembers',
      config: {
        projectIdParam: 'projectId',
        excludeSender: true // לא לשלוח למי שביצע את הפעולה
      }
    },
    
    templates: {
      title: {
        he: 'כותרת בעברית',
        en: 'Title in English',
        ar: 'عنوان بالعربية'
      },
      body: {
        he: 'תוכן ההתראה בעברית',
        en: 'Notification body in English',
        ar: 'محتوى الإشعار بالعربية'
      }
    },
    
    channels: ['socket', 'email', 'telegram', 'push'],
    
    metadata: {
      url: 'lev', // לאן להפנות את המשתמש
      priority: 'high' // או 'normal', 'low'
    }
  },
  
  // ⭐ אסטרטגיית העדכון
  updateStrategy: {
    type: 'partialUpdate',
    config: {
      dataKeys: ['הנתונים', 'שצריכים', 'להתעדכן']
    }
  }
};
```

### שלב 2: רשום את ה-Action

```typescript
// src/lib/server/actions/configs/index.ts

import { myActionConfig } from './myAction';

registerAction(myActionConfig);
```

### שלב 3: השתמש ב-Action

```javascript
// בקומפוננטה כלשהי

import { actionClient } from '$lib/client/actionClient';

async function doSomething() {
  const result = await actionClient.execute('myAction', {
    projectId: '123',
    // שאר הפרמטרים...
  });
  
  if (result.success) {
    toast.success('הפעולה הצליחה!');
    // לא צריך לעשות כלום נוסף!
    // כל חברי הפרויקט יקבלו עדכון אוטומטית
  }
}
```

## בדיקה

### דף בדיקה
פתח: `http://localhost:5173/test-lev-socket`

הדף מאפשר:
1. ✅ לבדוק חיבור Socket
2. 🧪 לשלוח createTosplit אמיתי
3. 🎭 לדמות התראה (ללא שמירה ב-DB)
4. 📊 לראות לוגים בזמן אמת

### בדיקה ידנית

1. **פתח 2 טאבים:**
   - טאב 1: עמוד הלב (`/lev`)
   - טאב 2: דף בדיקה (`/test-lev-socket`)

2. **בטאב 2:**
   - וודא שה-Socket מחובר (🟢)
   - הכנס Project ID
   - לחץ "שלח createTosplit"

3. **בטאב 1 (עמוד הלב):**
   - אמורה להופיע התראה
   - המידע אמור להתעדכן אוטומטית
   - בדוק את הקונסול לראות לוגים

### בדיקה עם 2 משתמשים

1. **משתמש A:**
   - מחובר בדפדפן רגיל
   - פותח עמוד לב

2. **משתמש B:**
   - מחובר בדפדפן incognito
   - מבצע פעולה (createTosplit)

3. **תוצאה:**
   - משתמש A אמור לקבל התראה
   - עמוד הלב של משתמש A אמור להתעדכן
   - משתמש B לא אמור לקבל התראה (excludeSender: true)

## Troubleshooting

### Socket לא מתחבר

```javascript
// בדוק בקונסול:
console.log('Socket connected:', socketClient.getSocket()?.connected);

// בדוק שה-JWT תקין:
const jwt = document.cookie.split('; ').find(r => r.startsWith('jwt='));
console.log('JWT exists:', !!jwt);
```

### התראות לא מגיעות

1. **בדוק שה-Socket Server רץ:**
   ```bash
   cd socket-server
   npm run dev
   ```

2. **בדוק שה-Action מוגדר עם notification:**
   ```typescript
   notification: {
     recipients: { ... },
     templates: { ... },
     channels: ['socket', ...]
   }
   ```

3. **בדוק שהמשתמש חבר בפרויקט:**
   - רק חברי פרויקט מקבלים התראות

### המידע לא מתעדכן

1. **בדוק שיש updateStrategy:**
   ```typescript
   updateStrategy: {
     type: 'partialUpdate',
     config: { dataKeys: [...] }
   }
   ```

2. **בדוק את הקונסול:**
   - אמורים להיות לוגים: `🔄 Partial update triggered by: ...`

3. **בדוק שפונקציית start() עובדת:**
   ```javascript
   // בקונסול של עמוד הלב:
   await start();
   ```

## אופטימיזציות עתידיות

### 1. Partial Refresh אמיתי

כרגע `partialUpdate` מבצע full refresh. בעתיד נוכל:

```javascript
if (updateStrategy?.type === 'partialUpdate') {
  const { dataKeys } = updateStrategy.config;
  
  // רק לטעון את הנתונים הספציפיים
  if (dataKeys.includes('tosplits')) {
    await refreshTosplits();
  }
  if (dataKeys.includes('halukas')) {
    await refreshHalukas();
  }
  // וכו'...
}
```

### 2. Optimistic Updates

```javascript
// עדכון מיידי ב-UI
arr1 = [...arr1, newItem];

// שליחה לשרת ברקע
actionClient.execute('createItem', data)
  .catch(() => {
    // אם נכשל, החזר את השינוי
    arr1 = arr1.filter(item => item !== newItem);
  });
```

### 3. Debouncing

```javascript
let refreshTimeout;

socket.on('notification', (notification) => {
  clearTimeout(refreshTimeout);
  
  // חכה 500ms לפני refresh
  // אם מגיעות עוד התראות, אפס את הטיימר
  refreshTimeout = setTimeout(async () => {
    await start();
  }, 500);
});
```

## סיכום

המערכת החדשה מספקת:

✅ **עדכונים בזמן אמת** - כל חברי הפרויקט רואים שינויים מיד
✅ **התראות מרובות ערוצים** - Socket, Email, Telegram, Push
✅ **אסטרטגיות עדכון חכמות** - בחר איך לעדכן את ה-UI
✅ **קל להוספה** - רק להגדיר את ה-Action Config
✅ **תמיכה בריבוי שפות** - עברית, אנגלית, ערבית

הכל עובד אוטומטית - פשוט תגדיר את ה-Action ותשכח מזה! 🎉
