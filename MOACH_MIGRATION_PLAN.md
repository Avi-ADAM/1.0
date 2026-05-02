# תוכנית מיגרציה: מודולריזציה של "מוח הריקמה" (Moach)

תוכנית זו מתארת את השלבים לשינוי מבנה דף המוח ממבנה מונוליטי מבוסס טאבים למבנה מבוסס נתיבים (Routes) בפורמט `/moach/[projectId]/[tab]`.

## 1. יעדי המיגרציה
*   **מעבר לנתיבים ייעודיים:** כל טאב יהפוך לדף עצמאי (למשל: `/moach/123/kanban`).
*   **ניהול נתונים חכם:** מניעת משיכת נתונים כפולה ושימוש ב-Store מסונכרן ל-LocalStorage.
*   **שיפור ביצועים:** טעינה ראשונית מהירה יותר על ידי פיצול השאילתה המונוליטית.
*   **אבטחה משופרת:** שימוש ב-Server Load Functions וב-Unified Action System.
*   **חווית משתמש:** תמיכה ב-Deep Linking (אפשרות לשלוח לינק לטאב ספציפי).

## 2. מבנה התיקיות החדש
המבנה החדש יתבסס על מערכת ה-Routing של SvelteKit:

```text
src/routes/(reg)/moach/
├── [projectId]/
│   ├── +layout.svelte        # רכיבי UI משותפים (כותרת, ניווט טאבים)
│   ├── +layout.js            # Load function לנתוני פרויקט בסיסיים
│   ├── main/                 # טאב ראשי (תיאור, ערכים)
│   │   └── +page.svelte
│   ├── tasks/                # טאב פעולות (ActsTable)
│   │   └── +page.svelte
│   ├── kanban/               # טאב קאנבן
│   │   └── +page.svelte
│   ├── gantt/                # טאב גאנט
│   │   └── +page.svelte
│   ├── progress/             # משימות בתהליך (Bethas)
│   │   └── +page.svelte
│   ├── split/                # חלוקה ורווחים
│   │   └── +page.svelte
│   ├── sales/                # מכירות ומתנות
│   │   └── +page.svelte
│   ├── shifts/               # סידור משמרות
│   │   └── +page.svelte
│   └── timers/               # טיימרים
│       └── +page.svelte
└── +page.svelte              # דף בחירת פרויקט (קיים כיום בתוך ה-else)
```

## 3. אסטרטגיית ניהול נתונים (Moach Store)

יוקם Store חדש ב-`src/lib/stores/moachStore.js` שישתמש ב-Runes של Svelte 5:

```javascript
// סכימה מוצעת ל-Store
export const projectData = $state({
    projects: {}, // מפתח לפי projectId. כל פרויקט מכיל אובייקט נתונים ו-timestamp.
    currentId: null,
    loading: false
});

// פונקציות עזר:
// - loadFromLocalStorage: טעינה מהירה של נתונים שמורים.
// - updateProjectData: עדכון נתונים ספציפיים לאחר Fetch.
// - isDataFresh(projectId, type): בדיקה האם המידע ב-Store עדכני מספיק.
```

### מניעת כפילות נתונים
1.  **Layout Load:** ימשוך נתונים בסיסיים הנדרשים לכל הדפים (שם פרויקט, לוגו, רשימת חברים).
2.  **Page Load:** כל דף (טאב) ימשוך רק את הנתונים הייעודיים לו (למשל, טאב גאנט ימשוך משימות).
3.  **Caching:** ה-Store יבדוק אם הנתונים כבר קיימים והאם הם "טריים" לפני ביצוע שאילתה חדשה.

## 4. אבטחה ושאילתות (QIDS)

*   שימוש ב-`sendToSer` דרך ה-`load` פונקציות בצד השרת.
*   פיצול השאילתה המונוליטית ל-QIDs קטנים וממוקדים ב-`src/routes/api/send/qids.js`:
    *   `getProjectBaseInfo`: מידע כללי וחברים.
    *   `getProjectTasks`: משימות (Open, Pending, In Progress, Finished).
    *   `getProjectFinancials`: נתוני חלוקה ומכירות.

### מיפוי נתוני הטאבים (מהשאילתה המונוליטית):
| טאב | רכיבים עיקריים | נתונים נדרשים |
| :--- | :--- | :--- |
| **Main** (1) | `RichText`, `Tile` | `projectName`, `descripFor`, `publicDescription`, `vallues` |
| **Create** (2) | `Hand`, `Handd`, `ChoosMission`, `TotalNeeds` | `open_missions`, `open_mashaabims`, `pendms`, `vallues`, `user_1s`, `restime`, `profilePic` |
| **Gantt** (3) | `Gantt` | `mesimabetahaliches`, `pendms`, `open_missions`, `finnished_missions` |
| **Split** (4) | `Fini`, `Hach` | `finnished_missions`, `rikmashes`, `user_1s` |
| **Progress** (5) | `Bethas` | `mesimabetahaliches` |
| **Sales** (7) | `Hamatanot` | `sales`, `matanotofs`, `tosplits`, `finnished_missions`, `rikmashes` |
| **Shifts** (8) | `Sidur` | (מנוהל פנימית ברכיב) |
| **Acts** (9) | `ActsTable` | `acts` |
| **Timers** (10) | `TimersOfUsers` | `timers` (משיכה נפרדת קיימת) |
| **Kanban** (11) | `Kanbanboard` | `open_missions`, `pendms`, `mesimabetahaliches`, `finnished_missions`, `acts` |

## 5. המעבר מ-Store ל-URL (המעבר הפשוט)
כיום האפליקציה מסתמכת על `idPr.js`. במבנה החדש:
1. ב-`src/routes/(reg)/moach/[projectId]/+layout.js` נחלץ את ה-`projectId` מהפרמטרים.
2. נעדכן את ה-Store `idPr` בתוך ה-Layout כדי לשמור על תאימות לאחור עם קומפוננטות קיימות שמאזינות לו.
3. נוודא שכל קריאה ל-`goto('/moach')` מוחלפת ב-`goto('/moach/' + id)`.

## 6. שלבי המיגרציה המומלצים

### שלב א': הכנת התשתית
1.  יצירת ה-Store החדש (`moachStore.js`) המשלב Runes ו-LocalStorage.
2.  בניית השלד: `src/routes/(reg)/moach/[projectId]/+layout.svelte` ו-`+layout.js`.
3.  הגדרת ה-Redirect האוטומטי מ-`/moach/[projectId]` לטאב הדיפולטי (main).

### שלב ב': פיצול רכיבי ה-UI
1.  העברת ה-Nav (סרגל הטאבים) ל-`+layout.svelte`.
2.  הפיכת ה-Buttons של הטאבים ל-`<a>` המקשרים לנתיבים החדשים.
3.  שימוש ב-`$page.url.pathname` כדי לסמן את הטאב הפעיל.

### שלב ג': העברת דפים (טאב אחר טאב)
1.  **Main & Info:** העברת התיאור והערכים ל-`main/+page.svelte`.
2.  **Tasks/Kanban/Gantt:** קבוצה זו חולקת נתוני משימות. ניתן להשתמש ב-Load function משותף או ב-Caching ב-Store.
3.  **Financials:** העברת ה-Hachcal וה-Hamatanot ל-`split` ו-`sales`.

### שלב ד': סנכרון מצב (State Sync)
1.  וידוא שכל הפעולות (Actions) בתוך הקומפוננטות (כמו יצירת משימה) מעדכנות את ה-Store המרכזי כדי שהשינוי ישתקף בכל הטאבים ללא רענון.
2.  שימוש ב-Socket notifications (מערכת קיימת) כדי לעדכן את ה-Store בזמן אמת.

## 7. דגשים טכניים חשובים
*   **URL vs Store:** ה-URL הוא ה-Source of Truth לזהות הפרויקט. ה-Store הוא ה-Source of Truth לתוכן.
*   **Loading States:** שימוש ב-SvelteKit Loaders מאפשר להציג Loading יפה (skeleton או ספינר) בזמן המעבר בין דפים.
*   **Shared Components:** רכיבים כמו `TaskModal` יועברו ל-Layout הראשי כדי לאפשר פתיחה שלהם מכל טאב ללא תלות בדף הספציפי.
*   **Backward Compatibility:** ה-Store `idPr` ימשיך להתקיים כגשר זמני עבור רכיבי Legacy עד שכולם יועברו להסתמכות על נתוני ה-URL.
