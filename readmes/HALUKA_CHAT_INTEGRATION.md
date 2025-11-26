# שילוב צ'אט Haluka במערכת הפורומים הגלובלית

## סקירה כללית
שילבנו את הצ'אטים של העברות כספים (halukas) במערכת הפורומים הגלובלית, בדומה לאופן שבו עובדים צ'אטים של משימות בתהליך.

## שינויים שבוצעו

### 1. קומפוננטת didiget.svelte
- **הוספת prop `forumId`**: מאפשר לזהות אם יש פורום קיים להעברת הכסף
- **עדכון פונקציית `react()`**: 
  - אם יש `forumId` - פותחת את הפורום הקיים
  - אם אין `forumId` - יוצרת צ'אט זמני שיווצר רק כשהמשתמש ישלח הודעה ראשונה
- **שימוש ב-stores גלובליים**: `nowChatId`, `isChatOpen`, `newChat`, `forum`

### 2. קומפוננטת didigetCard.svelte
- הוספת prop `forumId` לתמיכה בפורומים קיימים

### 3. קומפוננטת cards.svelte
- העברת `forumId` מה-data ל-Vid component

### 4. src/lib/stores/pendMisMes.js
הרחבת הפונקציה `initialForum()` לתמיכה בהעברות כספים:

#### שינויים ב-GraphQL Query:
```graphql
halukasres {
  data {
    id
    attributes {
      amount
      usersend {data {id attributes {username}}}
      userrecive {data {id attributes {username}}}
      project {data {id attributes {projectName profilePic{...}}}}
      forum {
        data {
          id
          attributes {
            subject spec done
            messages(filters:{archived: {ne:true}}) {...}
          }
        }
      }
    }
  }
}

halukasend {
  # אותו מבנה
}
```

**שינויים בשמות השדות:**
- `halukasres` ו-`halukasend` (ללא filters - הסינון נעשה בצד השרת)
- `project_1` → `project`

#### שינויים בפונקציית extractForums():
הפונקציה עכשיו מחלצת פורומים משלושה מקורות:
1. **פורומים של משימות בתהליך** (mesimabetahaliches) - הלוגיקה הקיימת
2. **פורומים של העברות כספים שקיבלתי** (halukasres)
3. **פורומים של העברות כספים ששלחתי** (halukassend)

לכל פורום של haluka נוסף metadata:
```javascript
{
  pid: project.id,
  projectName: project.attributes.projectName,
  projectPic: project.attributes.profilePic...,
  halukId: haluka.id,
  transferDetails: `קבלת/העברת ${amount} מ/ל-${username}`
}
```

## לוגיקת הצ'אט הזמני

כמו ב-bethas, הצ'אט עובד בשני מצבים:

### מצב 1: פורום קיים (forumId !== null)
```javascript
if (forumId) {
  nowChatId.set(forumId);
  isChatOpen.set(true);
}
```

### מצב 2: צ'אט חדש (forumId === null)
```javascript
newChat.set({
  started: true,
  created: false,
  id: 0,
  md: { 
    mbId: 0,  // אין mesimabetahalich
    pid: Number(projectId),
    halukId: Number(pendId)
  }
});

forum.set({
  [-1]: {
    loading: false,
    messages: messege || [],
    md: {
      pid: Number(projectId),
      mbId: 0,
      halukId: Number(pendId),
      projectName: projectName,
      projectPic: src,
      transferDetails: `${kind === 'send' ? 'העברת' : 'קבלת'} ${amount}`
    }
  }
});

nowChatId.set(-1);
isChatOpen.set(true);
```

הפורום יווצר בפועל רק כשהמשתמש ישלח את ההודעה הראשונה.

## מבנה ה-metadata

### עבור משימות בתהליך:
```javascript
{
  pid: projectId,
  projectName: "...",
  projectPic: "...",
  mesimaName: "..."
}
```

### עבור העברות כספים:
```javascript
{
  pid: projectId,
  projectName: "...",
  projectPic: "...",
  halukId: halukaId,
  transferDetails: "קבלת/העברת X מ/ל-Y"
}
```

## תיקון תצוגת התיאור בצ'אט

### בעיה
כשפותחים צ'אט של haluka, התיאור היה מוצג כ-"small description" במקום התיאור הנכון.

### פתרון

#### 1. עדכון chatSmall.svelte
```javascript
smalldes={$forum[$nowChatId].md.mesimaName || $forum[$nowChatId].md.transferDetails || ""}
nameChatPartner={$forum[$nowChatId].md.transferDetails ? 
  {"he":"צ'אט על העברת כסף","en":"chat on money transfer"}[$lang] : 
  nameChatPartner[$lang]}
```

עכשיו הקומפוננטה בודקת אם יש `transferDetails` ומשתמשת בו במקום `mesimaName`.

#### 2. עדכון react() ב-didiget.svelte
כשפותחים פורום קיים, אנחנו מוודאים שיש לו metadata:
```javascript
if (forumId) {
  let tempF = $forum;
  if (!tempF[forumId] || !tempF[forumId].md) {
    tempF[forumId] = {
      loading: false,
      messages: tempF[forumId]?.messages || [],
      md: {
        pid: Number(projectId),
        mbId: 0,
        halukId: Number(pendId),
        projectName: projectName,
        projectPic: src,
        transferDetails: `${kind === 'send' ? 'העברת' : 'קבלת'} ${amount}`
      }
    };
    forum.set(tempF);
  }
  nowChatId.set(forumId);
  isChatOpen.set(true);
}
```

## שיפור תצוגת שדה ההודעה (diun.svelte)

### בעיה
שדה ההודעה הציג תמיד "נימוק" גם כשמדובר בהעברת כסף, וללא תמיכה בשפות.

### פתרון
הוספנו תרגומים מלאים ולוגיקה משופרת:

```javascript
const labelTexts = {
  money: {
    he: "פרטים שיעזרו לההעברה להתבצע (מספר חשבון, פרטי העברה וכו')",
    en: "Details to help complete the transfer (account number, transfer details, etc.)",
    ar: "تفاصيل للمساعدة في إتمام التحويل (رقم الحساب، تفاصيل التحويل، إلخ)"
  },
  rejection: {
    he: "נימוק לדחייה (מינימום 27 תווים)",
    en: "Reason for rejection (minimum 27 characters)",
    ar: "سبب الرفض (27 حرفًا على الأقل)"
  },
  discussion: {
    he: "הודעה - נא להתייחס להודעות קודמות",
    en: "Message - please refer to previous messages",
    ar: "رسالة - يرجى الرجوع إلى الرسائل السابقة"
  },
  forum: {
    he: "כתוב הודעה...",
    en: "Write a message...",
    ar: "اكتب رسالة..."
  }
};

let labelText = $derived(
  money ? labelTexts.money[$lang] :
  no ? labelTexts.rejection[$lang] :
  ani === "forum" ? labelTexts.forum[$lang] :
  labelTexts.discussion[$lang]
);
```

הכיוון של ה-textarea עכשיו משתנה לפי השפה:
```html
<div dir={$lang === 'en' ? 'ltr' : 'rtl'} class='textinput'>
```

## תיקון תמיכה בפגישות (chatSmall.svelte)

### בעיה
כשניסו לפתוח צ'אט של פגישה, הייתה שגיאה: `Cannot read properties of undefined (reading 'md')`

### סיבה
הקוד ניסה לגשת ל-`$forum[$nowChatId].md` אבל פגישות נמצאות ב-`$meetingsData` ויש להן מבנה שונה (ללא `md`).

### פתרון
הוספנו תמיכה נפרדת לשני סוגי הצ'אטים:

```svelte
{#if $forum[$nowChatId]?.md}
  {@const md = $forum[$nowChatId].md}
  <Diun
    rikmaName={md.projectName || ""}
    smalldes={md.mesimaName || md.transferDetails || ""}
    nameChatPartner={md.transferDetails ? 
      {"he":"צ'אט על העברת כסף","en":"chat on money transfer"}[$lang] : 
      nameChatPartner[$lang]}
    ...
  />
{:else if $meetingsData[$nowChatId]}
  {@const meeting = $meetingsData[$nowChatId]}
  <Diun
    rikmaName={meeting.attributes?.title || "פגישה"}
    smalldes={meeting.attributes?.description || ""}
    nameChatPartner={{"he":"צ'אט על פגישה","en":"chat on meeting"}[$lang]}
    ...
  />
{:else}
  <div>טוען נתונים...</div>
{/if}
```

עכשיו המערכת תומכת בשלושה סוגי צ'אטים:
1. **משימות בתהליך** - עם `mesimaName`
2. **העברות כספים** - עם `transferDetails`
3. **פגישות** - עם `title` ו-`description`

## תיקון יצירת פורום חדש להעברות כספים

### בעיה
כשניסו ליצור הודעה ראשונה בצ'אט חדש של haluka, הייתה שגיאה:
```
1 relation(s) of type api::mesimabetahalich.mesimabetahalich associated with this entity do not exist
```

### סיבה
הפונקציה `createForum` ניסתה ליצור פורום עם `mesimabetahaliches: 0` גם עבור halukas, אבל זה לא תקין.

### פתרון

#### 1. הוספת query חדש ב-qids.js:
```javascript
'2forumCrHaluka': `mutation CreateForumHaluka($pid : ID, $halukId: ID , $da: DateTime)
 { createForum(
     data: {
      project:$pid,
      haluka:$halukId,
      publishedAt:$da
     }
      ){data{id}}
    }`
```

**שים לב:** השדה הוא `haluka` (יחיד) ולא `halukas` (רבים).

#### 2. עדכון createForum.svelte:
```javascript
export async function createForum(pid=0,mbId=0,halukId=null){
  const da = new Date()
  const dai = da.toISOString()
  
  // אם יש halukId, יוצרים פורום עבור haluka
  if(halukId !== null && halukId !== undefined){
    let d = await sendToSer({pid,da:dai,halukId},'2forumCrHaluka',...)
    ...
  }
  
  // אחרת, יוצרים פורום עבור mesimabetahalich
  let d = await sendToSer({pid,da:dai,mbId},'2forumCr',...)
  ...
}
```

#### 3. עדכון chatSmall.svelte:
```javascript
let t = await createForum($newChat.md.pid,$newChat.md.mbId,$newChat.md.halukId)
```

עכשיו הפונקציה בודקת אם יש `halukId` ומשתמשת ב-query המתאים.

## תיקון שגיאה בטעינת פורומים

### בעיה
לאחר יצירת פורום חדש להעברת כסף, כשמנסים לטעון את רשימת הפורומים מחדש, הייתה שגיאה:
```
Cannot read properties of undefined (reading 'attributes')
```

### סיבה
כשיוצרים פורום חדש, הוא עדיין לא מקושר ל-haluka בשרת באופן מלא, אז `haluka.attributes.project` יכול להיות undefined.

### פתרון
הוספנו בדיקות בטיחות ב-`extractForums`:

```javascript
// Extract forums from halukas (received)
if (data.usersPermissionsUser.data.attributes.halukasres?.data) {
  data.usersPermissionsUser.data.attributes.halukasres.data.forEach(
    (haluka) => {
      // בדיקה שגם forum וגם project קיימים
      if (haluka.attributes.forum?.data && haluka.attributes.project?.data) {
        const forumo = haluka.attributes.forum.data;
        const project = haluka.attributes.project.data;
        ...
      }
    }
  );
}
```

אותה בדיקה נוספה גם ל-`halukasend`.

### תיקון נוסף - פורומים של halukas בתוך projects
כשפורום של haluka מופיע גם ברשימת הפורומים של הפרויקט, הקוד ניסה לגשת ל-`mesimabetahaliches` שלא קיים. הוספנו בדיקה:

```javascript
// רק אם יש mesimabetahaliches (לא haluka)
if (forumo.attributes.mesimabetahaliches?.data?.[0]) {
  // מעבד את הפורום
  ...
  forums.push(forumo);
}
```

עכשיו הקוד מדלג על פורומים שאין להם `mesimabetahaliches` (כמו פורומים של halukas) כשעובר על פורומים של פרויקטים.

## הגבלת התראות רק לנותן ולמקבל

### בעיה
כשנשלחה הודעה בצ'אט של העברת כסף, כל חברי הפרויקט קיבלו התראות במייל וטלגרם, אבל ההיגיון הוא שרק הנותן והמקבל צריכים לקבל התראות.

### פתרון

#### 1. עדכון query ב-qids.js:
הוספנו שדה `users_permissions_users` (משתתפים) ליצירת הפורום:
```javascript
'2forumCrHaluka': `mutation CreateForumHaluka($pid : ID, $halukId: ID , $da: DateTime, $participants: [ID])
 { createForum(
     data: {
      project:$pid,
      haluka:$halukId,
      publishedAt:$da,
      users_permissions_users:$participants
     }
      ){data{id}}
    }`
```

#### 2. עדכון createForum.svelte:
הפונקציה עכשיו מקבלת ומעבירה את רשימת המשתתפים:
```javascript
export async function createForum(pid=0,mbId=0,halukId=null,participants=null){
  ...
  if(halukId !== null && halukId !== undefined){
    let d = await sendToSer({pid,da:dai,halukId,participants},'2forumCrHaluka',...)
    ...
  }
  ...
}
```

#### 3. עדכון didiget.svelte:
הוספנו את רשימת המשתתפים ל-metadata:
```javascript
newChat.set({
  ...
  md: { 
    ...
    senderId: send,
    receiverId: recive,
    participants: [send, recive]  // רק הנותן והמקבל
  }
});
```

#### 4. עדכון chatSmall.svelte:
מעבירים את המשתתפים ליצירת הפורום:
```javascript
let t = await createForum($newChat.md.pid,$newChat.md.mbId,$newChat.md.halukId,$newChat.md.participants)
```

עכשיו כשיוצרים פורום חדש להעברת כסף, הוא מקושר רק לנותן ולמקבל, ולכן רק הם יקבלו התראות על הודעות חדשות.

#### 5. עדכון createMessage.svelte:
הוספנו העברת `userIds` להתראות:
```javascript
const notificationData = {
  pid: md.pid,
  title: {...},
  body: {...}
};

// אם יש participants (רשימת משתתפים ספציפית), נשלח רק אליהם
if (md.participants && Array.isArray(md.participants)) {
  notificationData.userIds = md.participants;
}

sendApi(notificationData, "nutifyPm")
```

#### 6. עדכון nutifyPm/+server.js:
הוספנו סינון משתמשים לפי `userIds`:
```javascript
const userIds = da.userIds || null;
let projectUsers = jsonim.data.project.data.attributes.user_1s.data;

// אם יש userIds, נסנן רק את המשתמשים האלה
if (userIds && Array.isArray(userIds) && userIds.length > 0) {
  projectUsers = projectUsers.filter(user => 
    userIds.includes(String(user.id)) || userIds.includes(Number(user.id))
  );
}
```

עכשיו ההתראות (מייל, טלגרם, push notifications) נשלחות רק למשתמשים שברשימת ה-`participants`.

### תיקון נוסף - participants גם לפורומים קיימים
הוספנו את `participants` גם כשפותחים פורום קיים (לא רק חדש):
```javascript
if (forumId) {
  if (!tempF[forumId] || !tempF[forumId].md) {
    tempF[forumId] = {
      ...
      md: {
        ...
        senderId: send,
        receiverId: recive,
        participants: [send, recive]  // גם לפורום קיים
      }
    };
  }
}
```

זה מבטיח שגם כשפותחים צ'אט קיים של העברת כסף, ההתראות יישלחו רק לנותן ולמקבל.

#### 7. עדכון pendMisMes.js - participants בטעינת פורומים:
הוספנו את `participants` למטא-דאטה כשטוענים פורומים מהשרת:
```javascript
// Extract forums from halukas (received)
const senderId = haluka.attributes.usersend.data.id;
const receiverId = haluka.attributes.userrecive.data.id;

forum[forumo.id].md = {
  ...
  senderId: senderId,
  receiverId: receiverId,
  participants: [String(senderId), String(receiverId)]
};
```

עכשיו גם כשפותחים צ'אט מרשימת הצ'אטים (ולא מ-didiget), ה-metadata כבר מכיל את ה-`participants`.

## שימוש

הקומפוננטה didiget עכשיו משתלבת באופן מלא עם מערכת הצ'אטים הגלובלית:
- פתיחת צ'אטים קיימים עם metadata נכון
- יצירת צ'אטים חדשים
- תצוגת תיאור נכון: "צ'אט על העברת כסף" + פרטי ההעברה
- שדה הודעה מותאם: "פרטים שיעזרו לההעברה להתבצע" במקום "נימוק"
- תמיכה מלאה בשלוש שפות: עברית, אנגלית, ערבית
- כיוון טקסט אוטומטי לפי השפה (RTL/LTR)
- תמיכה בשלושה סוגי צ'אטים: משימות, העברות כספים, ופגישות
- סנכרון הודעות בזמן אמת (דרך WebSocket)
- תצוגה אחידה עם שאר הצ'אטים במערכת
