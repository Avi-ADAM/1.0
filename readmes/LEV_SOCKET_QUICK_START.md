# Quick Start - בדיקת Socket Updates בעמוד הלב

## מה עשינו?

✅ הוספנו Socket listener לעמוד הלב שמקשיב להתראות מהמערכת החדשה
✅ המערכת מזהה 4 סוגי update strategies ומטפלת בהם
✅ יצרנו דף בדיקה (`/test-lev-socket`) לבדיקות
✅ התראות מוצגות בשפה הנכונה (עברית/אנגלית/ערבית)

## איך לבדוק עכשיו?

### שלב 1: הפעל את Socket Server

```bash
cd socket-server
npm run dev
```

אמור להופיע:
```
Socket.IO server running on port 3001
```

### שלב 2: הפעל את האפליקציה

```bash
# בחלון טרמינל אחר, מהתיקייה הראשית:
npm run dev
```

### שלב 3: פתח 2 טאבים

**טאב 1:** `http://localhost:5173/lev`
- זה עמוד הלב הרגיל
- פתח את הקונסול (F12)
- אמור לראות: `🔌 Socket מחובר`

**טאב 2:** `http://localhost:5173/test-lev-socket`
- זה דף הבדיקה
- אמור לראות סטטוס: `🟢 מחובר`

### שלב 4: בצע בדיקה

בטאב 2 (דף הבדיקה):

1. **לחץ על "דמה התראה"**
   - זה ישלח התראה מדומה (ללא שמירה ב-DB)
   - בטאב 1 (עמוד הלב) אמורה להופיע התראה
   - המידע אמור להתעדכן (תראה בקונסול: `🔄 Partial update triggered`)

2. **או: שלח createTosplit אמיתי**
   - הכנס Project ID (מספר הפרויקט שלך)
   - לחץ "שלח createTosplit"
   - זה ישמור ב-DB ושלח התראות לכל חברי הפרויקט

## מה אמור לקרות?

### בעמוד הלב (טאב 1):

1. **התראה מופיעה:**
   ```
   🔔 הצעה לחלוקת רווחים
   הוגשה הצעה חדשה לחלוקת רווחים. היכנס ללב כדי להצביע
   ```

2. **בקונסול:**
   ```
   🔔 Received notification from action system: {actionKey: 'createTosplit', ...}
   🔄 Partial update triggered by: createTosplit Keys: ['tosplits', 'halukas', 'splits']
   === START FUNCTION CALLED ===
   ```

3. **המידע מתעדכן:**
   - פונקציית `start()` רצה מחדש
   - כל הנתונים נטענים מהשרת
   - ה-UI מתעדכן עם המידע החדש

### בדף הבדיקה (טאב 2):

בלוג תראה:
```
[12:34:56] ✅ JWT נמצא
[12:34:56] ✅ User ID: 123
[12:34:56] 🔌 Socket מחובר
[12:34:57] 🧪 מדמה התראה...
[12:34:57] ✅ התראה נשלחה
```

## Actions שכבר עובדים עם Socket

כרגע יש לנו 3 actions מוכנים:

### 1. createTosplit
```javascript
await actionClient.execute('createTosplit', {
  data: {
    project: projectId,
    halukas: [...],
    hervachti: [...],
    vots: [...]
  }
});
```

**מה קורה:**
- נשמר ב-Strapi
- כל חברי הפרויקט מקבלים התראה
- עמוד הלב מתעדכן אוטומטית

### 2. createHaluka
```javascript
await actionClient.execute('createHaluka', {
  data: {
    project: projectId,
    usersend: senderId,
    userrecive: receiverId,
    amount: 100
  }
});
```

**מה קורה:**
- נשמר ב-Strapi
- אין התראות (כי ההתראות נשלחות ברמת tosplit)
- עמוד הלב מתעדכן

### 3. updateTask
```javascript
await actionClient.execute('updateTask', {
  taskId: '123',
  data: {
    status: 'completed'
  }
});
```

**מה קורה:**
- נשמר ב-Strapi
- חברי הפרויקט מקבלים התראה
- עמוד הלב מתעדכן

## איך להוסיף Action חדש?

### דוגמה: createMessage

```typescript
// src/lib/server/actions/configs/createMessage.ts

export const createMessageConfig: ActionConfig = {
  key: 'createMessage',
  description: 'Create a new forum message',
  graphqlOperation: '1chatsend',
  
  paramSchema: {
    forumId: { type: 'string', required: true },
    message: { type: 'string', required: true }
  },
  
  authRules: [
    { type: 'jwt' },
    { type: 'projectMember', config: { projectIdParam: 'projectId' } }
  ],
  
  notification: {
    recipients: {
      type: 'projectMembers',
      config: {
        projectIdParam: 'projectId',
        excludeSender: true
      }
    },
    templates: {
      title: {
        he: 'הודעה חדשה בפורום',
        en: 'New Forum Message'
      },
      body: {
        he: 'נוספה הודעה חדשה לפורום',
        en: 'A new message was added to the forum'
      }
    },
    channels: ['socket', 'email', 'telegram'],
    metadata: {
      url: 'lev',
      priority: 'normal'
    }
  },
  
  updateStrategy: {
    type: 'partialUpdate',
    config: {
      dataKeys: ['messages', 'forums']
    }
  }
};

// רישום
registerAction(createMessageConfig);
```

### שימוש:

```javascript
// בקומפוננטה
import { actionClient } from '$lib/client/actionClient';

async function sendMessage() {
  const result = await actionClient.execute('createMessage', {
    forumId: '123',
    projectId: '456',
    message: 'שלום לכולם!'
  });
  
  if (result.success) {
    toast.success('ההודעה נשלחה');
    // זהו! כל חברי הפרויקט יקבלו עדכון אוטומטית
  }
}
```

## Troubleshooting

### Socket לא מתחבר

**בדוק:**
```bash
# Socket Server רץ?
cd socket-server
npm run dev

# אמור להיות על פורט 3001
```

**בקונסול:**
```javascript
// בדוק חיבור
console.log(socketClient.getSocket()?.connected);

// בדוק JWT
const jwt = document.cookie.split('; ').find(r => r.startsWith('jwt='));
console.log('JWT:', jwt);
```

### התראות לא מגיעות

**בדוק בקונסול של עמוד הלב:**
```
🔔 Received notification from action system: ...
```

אם לא רואה את זה:
1. Socket Server לא רץ
2. המשתמש לא חבר בפרויקט
3. ה-Action לא מוגדר עם `notification`

### המידע לא מתעדכן

**בדוק בקונסול:**
```
🔄 Partial update triggered by: ...
=== START FUNCTION CALLED ===
```

אם לא רואה:
1. אין `updateStrategy` ב-Action Config
2. פונקציית `start()` נכשלת (בדוק errors)

## מה הלאה?

### אופטימיזציות:

1. **Partial Refresh אמיתי** - במקום לטעון הכל, לטעון רק מה שהשתנה
2. **Debouncing** - אם מגיעות הרבה התראות, לעדכן רק פעם אחת
3. **Optimistic Updates** - לעדכן את ה-UI מיד, לפני שהשרת מגיב

### Actions נוספים להוסיף:

- ✅ createTosplit (מוכן)
- ✅ createHaluka (מוכן)
- ✅ updateTask (מוכן)
- ⏳ createMessage
- ⏳ createNegotiation
- ⏳ startTimer / stopTimer
- ⏳ approveHaluka
- ⏳ voteOnTosplit

## סיכום

המערכת עובדת! 🎉

כל פעולה שמוגדרת עם `notification` ו-`updateStrategy` תעדכן אוטומטית את עמוד הלב לכל חברי הפרויקט.

**לבדיקה מהירה:**
1. הפעל Socket Server: `cd socket-server && npm run dev`
2. פתח `/test-lev-socket`
3. לחץ "דמה התראה"
4. בדוק שבעמוד הלב מופיעה התראה והמידע מתעדכן

זהו! 🚀
