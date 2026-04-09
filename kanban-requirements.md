# אפיון ודרישות טכניות: רכיב Kanban Board למשימות (Svelte 5)

## 1. מטרת הרכיב
יצירת תצוגת לוח Kanban דינאמית בתוך דף ה"מוח" (`moach/+page.svelte`) המאפשרת למשתמשים לראות, לנהל ולשנות סטטוסים של משימות באמצעות גרירה והשמטה (Drag & Drop). הרכיב יספק מבט על (Bird's-eye view) חזותי וברור של כל המשימות בריקמה בחלוקה לעמודות סטטוס.

---

## 2. מבנה הנתונים והעמודות (Columns)
בהתבסס על השאילתות הקיימות (GraphQL) בדף ה-moach, לוח הקאנבן יכיל את 4 העמודות הבאות:

1. **משימות פתוחות (To Do / Open)**
   - **מקור נתונים:** `omiData` (מתוך `project.open_missions`)
   - **תיאור:** משימות הממתינות לשיבוץ/לקיחה מתנדבים.
2. **ממתינות לאישור (Pending)**
   - **מקור נתונים:** `pmiData` (מתוך `project.pendms`)
   - **תיאור:** משימות שהוצעו וממתינות לאישור חברי הריקמה.
3. **בתהליך עיבוד (In Progress)**
   - **מקור נתונים:** `bmiData` (מתוך `project.mesimabetahaliches`)
   - **תיאור:** משימות שנלקחו ונמצאות כרגע בעבודה.
4. **בוצעו / הסתיימו (Done / Finished)**
   - **מקור נתונים:** `fmiData` (מתוך `project.finnished_missions`)
   - **תיאור:** משימות שהושלמו בהצלחה.

---

## 3. ממשק משתמש (UI/UX) ועיצוב
על פי הנחיות הפרויקט המצפות לעיצוב מתקדם (Premium, Modern & Dynamic):
* **עיצוב באמצעות Tailwind CSS:** גריד ברור של 4 (או 3) עמודות במסכים גדולים. בגלילה אופקית/תצוגה נערמת במסכים קטנים. שפה עיצובית תואמת Dark Mode והצבעים הקיימים (כדוגמת צבע העיצוב ה-`barbi` והזהב).
* **תמיכה ב-i18n:** שימוש במשתנה ה-`$lang` מה-Store והתאמת הרכיב ל-RTL (ימין-לשמאל) לעברית ו-LTR לאנגלית.
* **כרטיסיית משימה (Task Card):** כל כרטיס יציג:
  - שם המשימה ופרטים קצרים (כגון שעות צפויות אם יש).
  - עיצוב ייחודי (Micro-animations בהובר מרומז, פינות מעוגלות `rounded-xl`, הצללות עדינות `shadow-md` או אפקטי ציפה).
* **אינדיקציית גרירה:** העמודה שאליה גוררים תשנה מעט את צבע הרקע.

---

## 4. מפרט טכני - Svelte 5 (Runes)

* הרכיב יקבל את מערכי המשימות כ-`$props` וינהל העתק לוקאלי כמצב (`$state`) כדי להאפשר גרירות (Optimistic UI).
* **Drag and Drop:** 
  - אפשר להשתמש בספרייה כמו `svelte-dnd-action` שיודעת לטפל ברשימות בקלות או ב-Native HTML5 מובנה.
* **פעולות שרת ויציאה מהקומפוננטה:**
  - בהעתקת כרטיס לעמודה אחרת ה-Kanban ישדר אירוע לחלוטין (Dispatch) להורה (`moach/+page.svelte`).
  - הורה זה יפעיל את שרתי היעד בהתאם (למשל, Unified Action System) למעבר סטטוס, ויפתח חלוניות במידת הצורך. (לדוגמה, להציג Pop-up שואל "הכנס שעות" שמועברים לעמודת סיום).
* **הרחבת המשימה בחלון קופץ (Pop-up Modal):**
  - ה-Kanban ישדר אירוע לחיצה (`onCardClick`) בעת לחיצה על כרטיסיה.
  - האירוע יחזיר אובייקט המכיל את מזהה המשימה ואת סוגה (למשל: `{ id: 123, kind: 'openM' }`).
  - דף האב (`moach/+page.svelte`) יקלוט את האירוע וישתמש בפונקציה הקיימת `openDescrip(event)` כדי לפתוח את הקומפוננטות המורחבות הקיימות (כמו צפייה במשימה, הרשמה או הוספת פרטים) באותו Dialog / Modal בדיוק כפי שנעשה בתצוגות הרגילות.

---

## 5. ממשק קומפוננטה בסיסי מדגים

```svelte
<!-- src/lib/components/prPr/kanban/KanbanBoard.svelte -->
<script lang="ts">
  import { lang } from '$lib/stores/lang.js';

  let { 
    openMissions = [], 
    pendingMissions = [], 
    inProgressMissions = [], 
    finishedMissions = [],
    onMissionMoved, // call when item is dropped: (missionId, sourceCol, destCol)
    onCardClick // call when task card clicked: (missionDetails)
  } = $props();

  let columns = $state([
    { id: 'open', title: { he: 'פתוחות', en: 'Open' }, items: openMissions },
    { id: 'pending', title: { he: 'ממתין לאישור', en: 'Pending' }, items: pendingMissions },
    { id: 'progress', title: { he: 'בתהליך', en: 'In Progress' }, items: inProgressMissions },
    { id: 'done', title: { he: 'בוצעו', en: 'Done' }, items: finishedMissions }
  ]);
</script>

<div class="grid grid-cols-1 md:grid-cols-4 gap-4 p-4" dir={$lang === 'he' ? 'rtl' : 'ltr'}>
   {#each columns as col (col.id)}
     <div class="column bg-slate-800/50 rounded-xl p-3 shadow-lg">
       <h3 class="text-gold font-bold mb-4">{col.title[$lang]}</h3>
       <!-- render droppable tasks here -->
     </div>
   {/each}
</div>
```

## 6. תוכנית אינטגרציה (`moach/+page.svelte`)
1. יצירת ספרית הקאנבן תחת `src/lib/components/prPr/kanban`.
2. ייבוא ה-`KanbanBoard.svelte` ע"י `moach/+page.svelte`.
3. העברת משתני המצב הקיימים כ-props: 
   ```svelte
   <KanbanBoard 
     openMissions={omiData} 
     pendingMissions={pmiData} 
     inProgressMissions={bmiData} 
     finishedMissions={fmiData} 
     onCardClick={(event) => openDescrip(event)}
   />
   ```
4. להקצות אזור UI חדש / לחצן (ליד "פעולות תהליך") שיציג את הלוח (אפשרות View: טבלה לעומת Kanban).
