# סיכום מיגרציית דף הלב (Lev Page Migration Summary)

תאריך: 2025-12-29

## רקע
המיגרציה הועברה מלוגיקה ישנה (`+page.svelte.backup`) ללוגיקה חדשה עם ביזור דאטה ושילוב סוקטים (`+page.svelte`).

## הבעיה העיקרית
פרמטרים שאבדו בדרך ולא עברו כראוי לקומפוננטות, במיוחד:
- נתוני פרויקט (projectId, projectName, src)
- מזהים ייחודיים (welcomeId)
- גישה לנתונים שלא קיימים בשאילתה

## התיקונים שבוצעו

### 1. תיקון `extractWelcome` בקובץ `src/lib/utils/levDataExtractors.ts`
**בעיה:** ניסיון למשוך `projectName` ו-`src` ישירות מ-`welcom.attributes.project?.data?.attributes` שלא תמיד זמין בשאילתה.

**פתרון:**
- הוספת `welcomeId` מפורש (נדרש על ידי הקומפוננטות)
- הבהרה שנתוני פרויקט יישלפו על ידי ה-processor דרך `createProjectInfo`
- אין להסתמך על נתוני פרויקט מוטמעים בשאילתה

```typescript
welcome.push({
  id: welcom.id,
  welcomeId: welcom.id, // הוספה מפורשת
  projectId: projectId,
  // projectName ו-src יתווספו ב-processor
});
```

### 2. תיקון קומפוננטת `Welcomt` ב-`cards.svelte`
**בעיה:**
- שימוש ב-`buble.welcomId` במקום `buble.welcomeId`
- העברת `projectId={buble.id}` במקום `projectId={buble.projectId}`

**פתרון:**
```svelte
<Welcomt
  welcomId={buble.welcomeId}  <!-- תוקן -->
  projectId={buble.projectId} <!-- תוקן -->
  ...
/>
```

### 3. תיקון קומפוננטת `Welcomt` ב-`newcoinui.svelte`
**בעיה:** חסרים הרבה props נדרשים.

**פתרון:** הוספת כל ה-props החסרים:
- `welcomeId`
- `src`
- `projectId`
- `partnershipDetails`
- `pd`
- `onCoinLapach`

### 4. תיקון `ProjectSuggestor` (meData) ב-`newcoinui.svelte`
**בעיה:** גישה ישירה ל-`buble.attributes.project.data.attributes...` - מבנה ישן שלא קיים אחרי העיבוד.

**פתרון:** שימוש בשדות מעובדים:
```svelte
// לפני (לא עובד):
projectName={buble.attributes.project.data.attributes.projectName}
src={buble.attributes.project.data.attributes.profilePic.data?.attributes.formats.thumbnail.url}

// אחרי (עובד):
projectName={buble.projectName}
src={buble.src}
```

## ארכיטקטורה חדשה

### זרימת הנתונים
```
GraphQL Response
    ↓
extractWelcome/extractPends/etc (levDataExtractors.ts)
    ↓ (נתונים גולמיים עם projectId)
welcomeStore/pendsStore/etc (levStores.ts)
    ↓
processWelcome/processPends/etc (levProcessors.ts)
    ↓ (שימוש ב-createProjectInfo להעשרת נתוני פרויקט)
finalSwiperArray (levDerived.ts)
    ↓
קומפוננטות UI (cards.svelte, newcoinui.svelte)
```

### עקרונות מפתח
1. **Extractors** - מחלצים רק מה שזמין בשאילתה, שומרים `projectId`
2. **Processors** - משתמשים ב-`createProjectInfo(projectId)` לקבלת נתוני פרויקט עדכניים
3. **קומפוננטות** - מקבלות נתונים מעובדים ומוכנים לתצוגה

## המלצות לעתיד
1. לוודא שכל שדה שמועבר לקומפוננטה קיים ב-DisplayItem
2. להשתמש ב-`createProjectInfo` ו-`createUserInfo` במקום גישה ישירה לנתונים מקוננים
3. לבדוק שמות props תואמים בין הקוד הישן לחדש
4. להימנע מגישה ל-`buble.attributes` - השתמשו בשדות ישירות על `buble`

## קבצים שהשתנו
- `src/lib/utils/levDataExtractors.ts` - תיקון extractWelcome
- `src/lib/components/lev/cards/cards.svelte` - תיקון Welcomt props
- `src/lib/components/lev/newcoinui.svelte` - תיקון Welcomt ו-ProjectSuggestor props
- `src/lib/components/lev/coinui.svelte` - תיקון Welcomt ו-ProjectSuggestor props
- `src/lib/utils/levProcessors.ts` - תיקון processMtaha לשימוש בטיימרים מ-store
- `src/lib/stores/levDerived.ts` - הוספת timers store ל-processedMtaha

## תיקון הטיימרים (Real-time Timer Fix)

### הבעיה
הטיימרים של משימות בתהליך (mtaha) לא התעדכנו ב-real-time כי הם חושבו מקומית במקום להילקח מה-timers store הריאקטיבי.

### הפתרון
1. **עדכון `processMtaha`** - הפונקציה מקבלת עכשיו גם `timersData` כפרמטר אופציונלי
2. **שליפה מ-store** - קודם מנסים למצוא את הטיימר ב-timers store (לפי mission.id או mId)
3. **fallback** - אם לא נמצא, משתמשים בחישוב המקומי מ-`mission.activeTimer`
4. **עדכון `processedMtaha`** - ה-derived store מאזין עכשיו גם ל-timers store

```typescript
// levProcessors.ts
const timerFromStore = timersData?.find((t: any) => t.id === mission.id || t.mId === mission.id);

if (timerFromStore) {
  // Real-time data from WebSocket
  totalMilliseconds = timerFromStore.zman || 0;
  isActive = timerFromStore.running || false;
} else if (mission.activeTimer) {
  // Fallback to local calculation
  // ...
}
```

```typescript
// levDerived.ts
export const processedMtaha = derived(
  [mtahaStore, projectsStore, timers],
  ([$mtaha, $projects, $timers]) => processMtaha($mtaha, $projects, $timers)
);
```
