# Project Helpers - מדריך שימוש

## סקירה כללית

`projectHelpers.js` מספק פונקציות עזר לעבודה עם נתוני פרויקטים. הפונקציות מחזירות **בדיוק** את אותה מבנה שהקוד הקיים מצפה לו, כך שאפשר להשתמש בהן ללא חשש משבירת קומפוננטות.

## למה להשתמש בפונקציות האלו?

### לפני (קוד חוזר):
```javascript
// זה מופיע 50+ פעמים בקוד!
{
  projectId: t.project.data.id,
  projectName: getProjectData(t.project.data.id, 'pn'),
  noof: getProjectData(t.project.data.id, 'noof'),
  src2: getProjectData(t.project.data.id, 'pp'),
  pid: getProjectData(t.project.data.id, 'uids')
}
```

### אחרי (קוד נקי):
```javascript
// קריאה אחת פשוטה
createProjectInfo(projectId)
```

## פונקציות זמינות

### 1. `createProjectInfo(projectId)`

יוצר אובייקט עם מידע בסיסי על פרויקט.

**פרמטרים:**
- `projectId` - מזהה הפרויקט (string או number)

**מחזיר:**
```javascript
{
  projectId: '123',
  projectName: 'שם הפרויקט',
  noof: 5,              // מספר חברים
  src2: 'url/pic.jpg',  // תמונת פרויקט
  pid: ['1', '2', '3']  // מערך מזהי משתמשים
}
```

**דוגמה:**
```javascript
import { createProjectInfo } from '$lib/utils/projectHelpers';

// במקום:
const obj = {
  projectId: project.id,
  projectName: getProjectData(project.id, 'pn'),
  noof: getProjectData(project.id, 'noof'),
  src2: getProjectData(project.id, 'pp'),
  pid: getProjectData(project.id, 'uids')
};

// כתוב:
const obj = {
  ...createProjectInfo(project.id),
  // שדות נוספים...
};
```

---

### 2. `createUserInfo(projectId, userId)`

יוצר אובייקט עם מידע על משתמש בפרויקט.

**פרמטרים:**
- `projectId` - מזהה הפרויקט
- `userId` - מזהה המשתמש

**מחזיר:**
```javascript
{
  uid: '456',
  username: 'שם המשתמש',
  src: 'url/user.jpg'  // תמונת פרופיל
}
```

**דוגמה:**
```javascript
import { createUserInfo } from '$lib/utils/projectHelpers';

// במקום:
const user = {
  uid: userId,
  username: getProjectData(projectId, 'un', userId),
  src: getProjectData(projectId, 'upic', userId)
};

// כתוב:
const user = createUserInfo(projectId, userId);
```

---

### 3. `createMessage(projectId, userId, message, options)`

יוצר אובייקט הודעה לצ'אט.

**פרמטרים:**
- `projectId` - מזהה הפרויקט
- `userId` - מזהה השולח
- `message` - תוכן ההודעה
- `options` (אופציונלי):
  - `timestamp` - זמן השליחה (ברירת מחדל: עכשיו)
  - `sentByMe` - האם נשלח על ידי (ברירת מחדל: false)
  - `what` - סטטוס (ברירת מחדל: true)
  - `changed` - האם שונה (ברירת מחדל: false)

**מחזיר:**
```javascript
{
  message: 'תוכן ההודעה',
  pic: 'url/user.jpg',
  timestamp: Date,
  sentByMe: false,
  what: true,
  changed: false
}
```

**דוגמה:**
```javascript
import { createMessage } from '$lib/utils/projectHelpers';

// במקום:
const msg = {
  message: `${getProjectData(projectId, 'un', userId)} אמר משהו`,
  pic: getProjectData(projectId, 'upic', userId),
  timestamp: new Date(),
  sentByMe: userId === myId,
  what: true,
  changed: false
};

// כתוב:
const msg = createMessage(
  projectId, 
  userId, 
  `${getProjectData(projectId, 'un', userId)} אמר משהו`,
  { sentByMe: userId === myId }
);
```

---

### 4. `createProjectUserInfo(projectId, userId, myId)`

משלב מידע על פרויקט ומשתמש לאובייקט אחד.

**פרמטרים:**
- `projectId` - מזהה הפרויקט
- `userId` - מזהה המשתמש
- `myId` - מזהה המשתמש הנוכחי

**מחזיר:**
```javascript
{
  projectId: '123',
  projectName: 'שם הפרויקט',
  noof: 5,
  src2: 'url/proj.jpg',
  pid: ['1', '2', '3'],
  uid: '456',
  username: 'שם המשתמש',
  src: 'url/user.jpg',
  myid: '789'
}
```

**דוגמה:**
```javascript
import { createProjectUserInfo } from '$lib/utils/projectHelpers';

const fullInfo = createProjectUserInfo(projectId, userId, myId);
```

---

### 5. `createFullItemData(params)`

פונקציה מקיפה ליצירת אובייקט מלא לקומפוננטות.

**פרמטרים:**
```javascript
{
  projectId: string|number,
  userId: string|number,
  myId: string|number,
  ani: string,        // סוג האובייקט
  azmi: string,       // קטגוריה
  pl: number,         // עדיפות
  additional: {}      // שדות נוספים
}
```

**מחזיר:**
אובייקט מלא עם כל המידע הבסיסי + השדות הנוספים.

**דוגמה:**
```javascript
import { createFullItemData } from '$lib/utils/projectHelpers';

// במקום:
dictasked.push({
  projectId: t.project.data.id,
  projectName: getProjectData(t.project.data.id, 'pn'),
  noof: getProjectData(t.project.data.id, 'noof'),
  src2: getProjectData(t.project.data.id, 'pp'),
  myid: myId,
  pid: getProjectData(t.project.data.id, 'uids'),
  uid: t.users_permissions_user.data.id,
  username: getProjectData(t.project.data.id, 'un', t.users_permissions_user.data.id),
  src: getProjectData(t.project.data.id, 'upic', t.users_permissions_user.data.id),
  ani: 'askedcoin',
  azmi: 'ziruf',
  pl: 1,
  askId: ask.id,
  omid: openMission.id
});

// כתוב:
dictasked.push(createFullItemData({
  projectId: t.project.data.id,
  userId: t.users_permissions_user.data.id,
  myId: myId,
  ani: 'askedcoin',
  azmi: 'ziruf',
  pl: 1,
  additional: {
    askId: ask.id,
    omid: openMission.id
  }
}));
```

---

### 6. `isUserInProject(projectId, userId)`

בודק אם משתמש הוא חבר בפרויקט.

**פרמטרים:**
- `projectId` - מזהה הפרויקט
- `userId` - מזהה המשתמש

**מחזיר:** `boolean`

**דוגמה:**
```javascript
import { isUserInProject } from '$lib/utils/projectHelpers';

if (isUserInProject(projectId, userId)) {
  console.log('המשתמש חבר בפרויקט');
}
```

---

### 7. `getProjectMembers(projectId)`

מחזיר רשימת כל חברי הפרויקט.

**פרמטרים:**
- `projectId` - מזהה הפרויקט

**מחזיר:**
```javascript
[
  { uid: '1', username: 'משתמש 1', src: 'pic1.jpg' },
  { uid: '2', username: 'משתמש 2', src: 'pic2.jpg' }
]
```

**דוגמה:**
```javascript
import { getProjectMembers } from '$lib/utils/projectHelpers';

const members = getProjectMembers(projectId);
members.forEach(member => {
  console.log(member.username);
});
```

---

## דוגמאות מעשיות

### דוגמה 1: רפקטור של createasked

**לפני:**
```javascript
async function createasked(da) {
  const start = da.data.usersPermissionsUser.data.attributes.projects_1s.data;
  
  for (let i = 0; i < start.length; i++) {
    for (let j = 0; j < start[i].attributes.asks.data.length; j++) {
      const ask = start[i].attributes.asks.data[j];
      const t = ask.attributes;
      const projectId = t.project.data.id;
      
      dictasked.push({
        projectId: projectId,
        projectName: getProjectData(projectId, 'pn'),
        noof: getProjectData(projectId, 'noof'),
        src2: getProjectData(projectId, 'pp'),
        myid: myId,
        pid: getProjectData(projectId, 'uids'),
        uid: t.users_permissions_user.data.id,
        username: getProjectData(projectId, 'un', t.users_permissions_user.data.id),
        src: getProjectData(projectId, 'upic', t.users_permissions_user.data.id),
        ani: 'askedcoin',
        azmi: 'ziruf',
        pl: 1 + i + j,
        askId: ask.id,
        omid: t.open_mission.data.id,
        // ... 30 שדות נוספים
      });
    }
  }
}
```

**אחרי:**
```javascript
import { createFullItemData } from '$lib/utils/projectHelpers';

async function createasked(da) {
  const start = da.data.usersPermissionsUser.data.attributes.projects_1s.data;
  
  for (let i = 0; i < start.length; i++) {
    for (let j = 0; j < start[i].attributes.asks.data.length; j++) {
      const ask = start[i].attributes.asks.data[j];
      const t = ask.attributes;
      const projectId = t.project.data.id;
      
      dictasked.push(createFullItemData({
        projectId,
        userId: t.users_permissions_user.data.id,
        myId,
        ani: 'askedcoin',
        azmi: 'ziruf',
        pl: 1 + i + j,
        additional: {
          askId: ask.id,
          omid: t.open_mission.data.id,
          // ... שאר השדות הספציפיים
        }
      }));
    }
  }
}
```

### דוגמה 2: יצירת הודעות בצ'אט

**לפני:**
```javascript
for (let x = 0; x < dictasked[t].users.length; x++) {
  let src22 = getProjectData(
    dictasked[t].projectId,
    'upic',
    dictasked[t].users[x].users_permissions_user.data.id
  );
  
  dictasked[t].messeges.push({
    message: `${getProjectData(
      dictasked[t].projectId,
      'un',
      dictasked[t].users[x].users_permissions_user.data.id
    )} הצביע ${dictasked[t].users[x].what ? 'בעד' : 'נגד'}`,
    what: dictasked[t].users[x].what,
    pic: src22,
    timestamp: new Date(dictasked[t].users[x].zman),
    sentByMe: dictasked[t].users[x].users_permissions_user.data.id === myid,
    changed: false
  });
}
```

**אחרי:**
```javascript
import { createMessage, createUserInfo } from '$lib/utils/projectHelpers';

for (let x = 0; x < dictasked[t].users.length; x++) {
  const vote = dictasked[t].users[x];
  const userId = vote.users_permissions_user.data.id;
  const userInfo = createUserInfo(dictasked[t].projectId, userId);
  
  dictasked[t].messeges.push(createMessage(
    dictasked[t].projectId,
    userId,
    `${userInfo.username} הצביע ${vote.what ? 'בעד' : 'נגד'}`,
    {
      timestamp: new Date(vote.zman),
      sentByMe: userId === myid,
      what: vote.what
    }
  ));
}
```

## הנחיות שימוש

### ✅ מתי להשתמש

1. **כשיש קוד חוזר** - אם אתה כותב את אותן קריאות ל-`getProjectData` יותר מפעם אחת
2. **ביצירת אובייקטים חדשים** - כשאתה יוצר אובייקט חדש ל-`arr1` או למערכים אחרים
3. **ברפקטורינג** - כשאתה משפר קוד קיים

### ❌ מתי לא להשתמש

1. **אם צריך רק שדה אחד** - אם אתה צריך רק `projectName`, פשוט תשתמש ב-`getProjectData`
2. **אם המבנה שונה** - אם הקומפוננטה מצפה למבנה שונה, אל תכפה את הפונקציות האלו

### 🔄 מיגרציה הדרגתית

אין צורך לשנות את כל הקוד בבת אחת:

1. **התחל עם קוד חדש** - השתמש בפונקציות בקוד חדש שאתה כותב
2. **רפקטר בהזדמנות** - כשאתה נוגע בקוד ישן, שפר אותו
3. **אל תשבור דברים** - הקוד הישן ממשיך לעבוד בדיוק כמו קודם

## בדיקות

כל הפונקציות מכוסות בטסטים ב-`projectHelpers.test.js`.

להרצת הטסטים:
```bash
npm test projectHelpers
```

## תאימות לאחור

כל הפונקציות מחזירות **בדיוק** את אותה מבנה שהקוד הקיים מצפה לו. זה מובטח על ידי:

1. ✅ טסטים שמשווים את המבנה הישן לחדש
2. ✅ שימוש ב-`getProjectData` הקיים מתחת למכסה
3. ✅ אותם שמות שדות בדיוק

## תמיכה

אם יש בעיה או שאלה:
1. בדוק את הטסטים - הם מראים דוגמאות שימוש
2. בדוק את ה-JSDoc בקוד - יש תיעוד מפורט
3. השווה למבנה הישן - ודא שהשדות זהים

## רישיון

חלק ממערכת 1💗1
