# תוכנית רפקטורינג: חלוקת מידע לצ'אנקים (Data Chunking)

## 📊 ניתוח המצב הנוכחי

### דף הלב (Lev Page)
**גודל**: 3,280 שורות קוד
**משתני state**: ~40+ משתנים
**מערכי נתונים**: 13 מערכים שונים שמתאחדים ל-`arr1`

```javascript
// כל הנתונים נשלפים בבת אחת:
arr1 = [
  ...tverias,      // העברות כספים
  ...walcomen,     // ברוכים הבאים
  ...askedcoin,    // בקשות הצטרפות למשימות
  ...askedm,       // בקשות משאבים
  ...pends,        // משימות ממתינות
  ...mtaha,        // משימות בתהליך
  ...fiapp,        // אישורי משימות
  ...pmashes,      // משאבים ממתינים
  ...wegets,       // בקשות משאבים נכנסות
  ...meData,       // הצעות משימות
  ...huca,         // הצעות משאבים
  ...haluask,      // בקשות חלוקה
  ...hachlatot     // החלטות
]
```

### דף המוח (Moach Page)
**גודל**: 2,649 שורות קוד
**משתני state**: ~35+ משתנים
**מערכי נתונים**: 10+ מערכים

```javascript
// נתונים עיקריים:
- project (פרטי הפרויקט)
- projectUsers (חברי הפרויקט)
- bmiData (משימות בתהליך)
- omiData (משימות פתוחות)
- pmiData (משימות ממתינות)
- fmiData (משימות שהסתיימו)
- rikmashes (משאבים)
- opmash (משאבים פתוחים)
- salee (מכירות)
- vallues (ערכים)
```

## 🎯 מטרות הרפקטורינג

1. **ביצועים**: טעינה מהירה יותר - רק מה שצריך
2. **זיכרון**: פחות נתונים בזיכרון בו-זמנית
3. **עדכונים**: עדכון חלקי של מידע ספציפי דרך Socket
4. **ניווט**: מעבר בין דפים ללא טעינה מחדש של הכל
5. **תחזוקה**: קוד יותר מודולרי וקל לתחזוקה

## 📦 אסטרטגיית חלוקה (Chunking Strategy)

### עקרון: "Lazy Loading + Smart Caching"

```
┌─────────────────────────────────────────┐
│         User Data Store (Global)        │
│  - userId, username, profilePic         │
│  - projects list (IDs only)             │
└─────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│      Project Data Store (Per Project)   │
│  - Basic project info                   │
│  - Members list                          │
│  - Counters (tasks, resources, etc.)    │
└─────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│    Category Stores (Lazy Loaded)        │
│  - Tasks Store                           │
│  - Resources Store                       │
│  - Votes Store                           │
│  - Messages Store                        │
│  - Distributions Store                   │
└─────────────────────────────────────────┘
```

## 🗂️ מבנה Stores המוצע

### 1. User Store (תמיד טעון)
```typescript
// src/lib/stores/userStore.ts
interface UserStore {
  id: string;
  username: string;
  email: string;
  profilePic: string;
  lang: string;
  projects: Array<{
    id: string;
    name: string;
    profilePic: string;
    unreadCount: number; // מונה עדכונים
  }>;
}
```

### 2. Project Store (טעון לפי צורך)
```typescript
// src/lib/stores/projectStore.ts
interface ProjectStore {
  [projectId: string]: {
    // Basic Info (תמיד טעון)
    id: string;
    name: string;
    description: string;
    profilePic: string;
    members: UserBasic[];
    
    // Counters (תמיד טעון)
    counters: {
      pendingTasks: number;
      activeTasks: number;
      pendingResources: number;
      pendingVotes: number;
      unreadMessages: number;
    };
    
    // Data Chunks (טעון לפי דרישה)
    chunks: {
      tasks?: TasksChunk;
      resources?: ResourcesChunk;
      votes?: VotesChunk;
      messages?: MessagesChunk;
      distributions?: DistributionsChunk;
    };
    
    // Metadata
    lastFetch: {
      tasks?: Date;
      resources?: Date;
      votes?: Date;
      messages?: Date;
      distributions?: Date;
    };
  };
}
```

### 3. Tasks Chunk Store
```typescript
// src/lib/stores/chunks/tasksChunk.ts
interface TasksChunk {
  // משימות ממתינות לאישור
  pending: PendingTask[];
  
  // משימות בתהליך
  active: ActiveTask[];
  
  // בקשות הצטרפות למשימות
  joinRequests: JoinRequest[];
  
  // הצעות משימות חדשות
  suggestions: TaskSuggestion[];
  
  // אישורי סיום משימות
  completionApprovals: CompletionApproval[];
  
  // משימות שהסתיימו (רק מטא-דאטה)
  completed: CompletedTaskMeta[];
}
```

### 4. Resources Chunk Store
```typescript
// src/lib/stores/chunks/resourcesChunk.ts
interface ResourcesChunk {
  // משאבים ממתינים
  pending: PendingResource[];
  
  // בקשות משאבים
  requests: ResourceRequest[];
  
  // הצעות משאבים
  suggestions: ResourceSuggestion[];
  
  // משאבים שהתקבלו
  received: ReceivedResource[];
}
```

### 5. Votes Chunk Store
```typescript
// src/lib/stores/chunks/votesChunk.ts
interface VotesChunk {
  // הצבעות ממתינות
  pending: PendingVote[];
  
  // החלטות שהתקבלו
  decisions: Decision[];
  
  // בקשות חלוקה
  distributions: DistributionRequest[];
}
```

### 6. Messages Chunk Store
```typescript
// src/lib/stores/chunks/messagesChunk.ts
interface MessagesChunk {
  // הודעות לפי פורום
  [forumId: string]: {
    messages: Message[];
    lastFetch: Date;
    hasMore: boolean;
  };
}
```

## 🔄 זרימת טעינת נתונים (Data Loading Flow)

### תרחיש 1: כניסה לדף הלב

```typescript
// 1. טעינה ראשונית (מהירה)
async function loadLevPage(userId: string) {
  // טען רק counters ומידע בסיסי
  const projects = await fetchUserProjects(userId);
  
  // עבור כל פרויקט - רק counters
  for (const project of projects) {
    await fetchProjectCounters(project.id);
  }
  
  // עכשיו המשתמש רואה כמה פריטים יש בכל קטגוריה
  // אבל עדיין לא טענו את הנתונים המלאים
}

// 2. טעינה עצלה (Lazy Loading)
async function loadVisibleItems() {
  // טען רק את הפריטים שהמשתמש רואה
  const visibleCategories = getVisibleCategories(); // לפי milon
  
  for (const category of visibleCategories) {
    await loadCategoryData(category);
  }
}

// 3. טעינה בעת גלילה (Infinite Scroll)
async function loadMoreItems(category: string) {
  const chunk = await fetchNextChunk(category, offset);
  appendToStore(category, chunk);
}
```

### תרחיש 2: מעבר מלב למוח

```typescript
// המשתמש כבר בדף הלב, עובר למוח
async function navigateToMoach(projectId: string) {
  // בדוק אם יש כבר נתונים בזיכרון
  const cached = projectStore.get(projectId);
  
  if (cached && !isStale(cached.lastFetch.tasks)) {
    // השתמש בנתונים מהזיכרון - מיידי!
    return cached;
  }
  
  // אם אין או ישן - טען רק את מה שחסר
  const missing = getMissingChunks(projectId, ['tasks', 'resources']);
  await loadChunks(projectId, missing);
}
```

### תרחיש 3: עדכון דרך Socket

```typescript
// התקבל עדכון על משימה
socketClient.onNotification((notification) => {
  if (notification.actionKey === 'updateTask') {
    const { projectId, taskId, updates } = notification.data;
    
    // עדכן רק את המשימה הספציפית
    updateTaskInStore(projectId, taskId, updates);
    
    // עדכן counters אם צריך
    if (updates.status === 'completed') {
      decrementCounter(projectId, 'activeTasks');
    }
  }
});
```

## 📋 תוכנית יישום (Implementation Plan)

### Phase 1: הקמת תשתית Stores (שבוע 1-2)

#### Task 1.1: יצירת User Store
```bash
src/lib/stores/
├── userStore.ts          # Store ראשי למשתמש
├── userStore.test.ts     # טסטים
└── types/
    └── user.ts           # טיפוסים
```

**מורכבות**: 🟢 נמוכה
**זמן משוער**: 1-2 ימים
**תלויות**: אין

#### Task 1.2: יצירת Project Store
```bash
src/lib/stores/
├── projectStore.ts       # Store לפרויקטים
├── projectStore.test.ts
└── types/
    └── project.ts
```

**מורכבות**: 🟡 בינונית
**זמן משוער**: 2-3 ימים
**תלויות**: userStore

#### Task 1.3: יצירת Chunk Stores
```bash
src/lib/stores/chunks/
├── tasksChunk.ts
├── resourcesChunk.ts
├── votesChunk.ts
├── messagesChunk.ts
├── distributionsChunk.ts
└── types/
    ├── tasks.ts
    ├── resources.ts
    ├── votes.ts
    ├── messages.ts
    └── distributions.ts
```

**מורכבות**: 🟡 בינונית
**זמן משוער**: 3-5 ימים
**תלויות**: projectStore

### Phase 2: יצירת Data Loaders (שבוע 2-3)

#### Task 2.1: GraphQL Query Splitter
```typescript
// src/lib/data/loaders/queryBuilder.ts

// במקום query אחד ענק, בנה queries ממוקדים
export function buildTasksQuery(projectId: string, options: {
  includePending?: boolean;
  includeActive?: boolean;
  includeCompleted?: boolean;
  limit?: number;
  offset?: number;
}) {
  // בנה query רק עם מה שצריך
}
```

**מורכבות**: 🟡 בינונית
**זמן משוער**: 3-4 ימים
**תלויות**: Chunk Stores

#### Task 2.2: Lazy Loader Service
```typescript
// src/lib/data/loaders/lazyLoader.ts

export class LazyLoader {
  async loadChunk(
    projectId: string,
    chunkType: ChunkType,
    options?: LoadOptions
  ): Promise<void> {
    // טען chunk ספציפי
    // שמור ב-store
    // עדכן lastFetch
  }
  
  async loadVisibleChunks(
    projectId: string,
    visibleCategories: string[]
  ): Promise<void> {
    // טען רק את מה שנראה
  }
  
  isStale(lastFetch: Date, maxAge: number = 5 * 60 * 1000): boolean {
    // בדוק אם הנתונים ישנים
  }
}
```

**מורכבות**: 🟡 בינונית
**זמן משוער**: 3-4 ימים
**תלויות**: Query Builder

#### Task 2.3: Cache Manager
```typescript
// src/lib/data/cache/cacheManager.ts

export class CacheManager {
  // ניהול זיכרון cache
  setMaxSize(bytes: number): void;
  
  // ניקוי cache ישן
  cleanup(): void;
  
  // שמירה ל-localStorage
  persist(): void;
  
  // טעינה מ-localStorage
  restore(): void;
}
```

**מורכבות**: 🟡 בינונית
**זמן משוער**: 2-3 ימים
**תלויות**: Stores

### Phase 3: רפקטורינג דף הלב (שבוע 3-5)

#### Task 3.1: פיצול +page.svelte
```bash
src/routes/(reg)/lev/
├── +page.svelte              # רק orchestration
├── +page.ts                  # data loading
├── components/
│   ├── LevContainer.svelte   # container ראשי
│   ├── CategoryFilter.svelte # סינון קטגוריות
│   └── LoadingState.svelte   # מצבי טעינה
└── hooks/
    ├── useLevData.ts         # hook לטעינת נתונים
    ├── useChunkLoader.ts     # hook לטעינה עצלה
    └── useSocketUpdates.ts   # hook לעדכוני socket
```

**מורכבות**: 🔴 גבוהה
**זמן משוער**: 5-7 ימים
**תלויות**: Lazy Loader, Stores

#### Task 3.2: עדכון קומפוננטות קיימות
```typescript
// לפני:
let arr1 = $state([...allData]);

// אחרי:
import { tasksChunk } from '$lib/stores/chunks/tasksChunk';
import { resourcesChunk } from '$lib/stores/chunks/resourcesChunk';

// כל קומפוננטה מקבלת רק את מה שהיא צריכה
let myTasks = $derived($tasksChunk.pending);
let myResources = $derived($resourcesChunk.pending);
```

**מורכבות**: 🔴 גבוהה
**זמן משוער**: 7-10 ימים
**תלויות**: Task 3.1

#### Task 3.3: אינטגרציה עם Socket
```typescript
// src/routes/(reg)/lev/hooks/useSocketUpdates.ts

export function useSocketUpdates(projectId: string) {
  onMount(() => {
    const unsubscribe = socketClient.onNotification((notification) => {
      // עדכן רק את ה-chunk הרלוונטי
      updateChunk(notification);
    });
    
    return unsubscribe;
  });
}
```

**מורכבות**: 🟡 בינונית
**זמן משוער**: 2-3 ימים
**תלויות**: Task 3.2, Socket System

### Phase 4: רפקטורינג דף המוח (שבוע 5-7)

#### Task 4.1: פיצול +page.svelte
```bash
src/routes/(reg)/moach/
├── +page.svelte              # orchestration
├── +page.ts                  # data loading
├── components/
│   ├── MoachContainer.svelte
│   ├── ProjectInfo.svelte    # מידע בסיסי
│   ├── TasksSection.svelte   # סקציית משימות
│   ├── ResourcesSection.svelte
│   └── MembersSection.svelte
└── hooks/
    ├── useMoachData.ts
    └── useProjectData.ts
```

**מורכבות**: 🔴 גבוהה
**זמן משוער**: 5-7 ימים
**תלויות**: Phase 3

#### Task 4.2: עדכון קומפוננטות
**מורכבות**: 🔴 גבוהה
**זמן משוער**: 5-7 ימים
**תלויות**: Task 4.1

### Phase 5: אופטימיזציה וטסטים (שבוע 7-8)

#### Task 5.1: Performance Testing
- מדידת זמני טעינה
- מדידת שימוש בזיכרון
- מדידת גודל bundle

**מורכבות**: 🟡 בינונית
**זמן משוער**: 2-3 ימים

#### Task 5.2: Integration Tests
- טסטים לזרימות מלאות
- טסטים לעדכוני socket
- טסטים למעבר בין דפים

**מורכבות**: 🟡 בינונית
**זמן משוער**: 3-4 ימים

#### Task 5.3: Documentation
- תיעוד ה-stores החדשים
- תיעוד ה-loaders
- מדריך migration

**מורכבות**: 🟢 נמוכה
**זמן משוער**: 2-3 ימים

## 📊 השוואת ביצועים (Expected Performance)

### לפני הרפקטורינג:
```
טעינה ראשונית של דף הלב:
├── GraphQL Query: ~2-3 שניות (query ענק)
├── עיבוד נתונים: ~1-2 שניות (13 מערכים)
├── רינדור: ~0.5-1 שניה
└── סה"כ: ~4-6 שניות

זיכרון:
├── arr1: ~5-10 MB
├── stores נוספים: ~2-3 MB
└── סה"כ: ~7-13 MB

מעבר בין דפים:
└── טעינה מחדש מלאה: ~4-6 שניות
```

### אחרי הרפקטורינג:
```
טעינה ראשונית של דף הלב:
├── GraphQL Query (counters): ~0.3-0.5 שניות
├── עיבוד נתונים: ~0.1-0.2 שניות
├── רינדור: ~0.2-0.3 שניות
├── Lazy load visible: ~0.5-1 שניה
└── סה"כ: ~1-2 שניות (שיפור של 60-70%)

זיכרון:
├── Stores בסיסיים: ~1-2 MB
├── Chunks טעונים: ~2-3 MB (רק מה שצריך)
└── סה"כ: ~3-5 MB (שיפור של 50-60%)

מעבר בין דפים:
├── מ-cache: ~0.1-0.2 שניות (מיידי!)
└── טעינה חלקית: ~0.5-1 שניה (רק מה שחסר)
```

## 🎯 יתרונות נוספים

### 1. עדכונים חכמים דרך Socket
```typescript
// לפני: רענון כל הדף
await start(); // טוען הכל מחדש

// אחרי: עדכון ממוקד
updateTaskInStore(projectId, taskId, updates); // רק משימה אחת
```

### 2. Infinite Scroll
```typescript
// טען עוד משימות בעת גלילה
async function loadMoreTasks() {
  const nextChunk = await fetchTasksChunk(projectId, {
    offset: currentOffset,
    limit: 20
  });
  
  appendToTasksStore(nextChunk);
}
```

### 3. Offline Support
```typescript
// שמור chunks ב-localStorage
cacheManager.persist();

// טען מ-cache בטעינה הבאה
await cacheManager.restore();
```

### 4. Better Error Handling
```typescript
// אם chunk אחד נכשל, השאר עדיין עובדים
try {
  await loadTasksChunk(projectId);
} catch (error) {
  // הצג שגיאה רק לסקציית המשימות
  showError('tasks', error);
  // שאר הדף עדיין עובד!
}
```

## ⚠️ סיכונים ואתגרים

### 1. מורכבות גבוהה
**סיכון**: הרפקטורינג גדול עלול לשבור דברים
**פתרון**: 
- עבוד בשלבים קטנים
- כתוב טסטים לפני כל שינוי
- שמור את הקוד הישן בצד

### 2. תלויות בין נתונים
**סיכון**: חלק מהנתונים תלויים אחד בשני
**פתרון**:
- מפה ברורה של תלויות
- טען תלויות אוטומטית
- cache של תלויות

### 3. Socket Updates
**סיכון**: עדכונים עלולים להגיע לפני שה-chunk נטען
**פתרון**:
- תור של עדכונים ממתינים
- החל עדכונים רק אחרי טעינה
- fallback לרענון מלא

### 4. Backward Compatibility
**סיכון**: קומפוננטות ישנות מצפות ל-arr1
**פתרון**:
- שמור wrapper ל-arr1 שמאחד chunks
- מיגרציה הדרגתית של קומפוננטות
- feature flags

## 📈 מדדי הצלחה (Success Metrics)

### ביצועים:
- [ ] זמן טעינה ראשונית < 2 שניות
- [ ] זמן מעבר בין דפים < 0.5 שניות
- [ ] שימוש בזיכרון < 5 MB

### חוויית משתמש:
- [ ] אין "קפיאות" בגלילה
- [ ] עדכונים מיידיים (< 100ms)
- [ ] אין "ריצודים" בממשק

### קוד:
- [ ] כיסוי טסטים > 80%
- [ ] גודל bundle לא גדל > 10%
- [ ] זמן build לא גדל > 20%

## 🚀 המלצה להתחלה

### אופציה 1: Big Bang (מהיר אבל מסוכן)
**זמן**: 6-8 שבועות
**סיכון**: 🔴 גבוה
**יתרון**: תוצאות מהירות

### אופציה 2: Incremental (איטי אבל בטוח) ⭐ מומלץ
**זמן**: 10-12 שבועות
**סיכון**: 🟡 בינוני
**יתרון**: בטוח, ניתן לבדיקה

**שלבים**:
1. בנה stores חדשים בצד (2 שבועות)
2. הוסף loaders (2 שבועות)
3. רפקטור דף אחד (לב או מוח) (3 שבועות)
4. בדוק ובצע אופטימיזציה (1 שבוע)
5. רפקטור דף שני (3 שבועות)
6. פוליש סופי (1 שבוע)

### אופציה 3: Hybrid (מאוזן)
**זמן**: 8-10 שבועות
**סיכון**: 🟡 בינוני
**יתרון**: מאוזן

**שלבים**:
1. בנה stores + loaders (3 שבועות)
2. רפקטור שני הדפים במקביל (4 שבועות)
3. אופטימיזציה וטסטים (2 שבועות)

## 💡 המלצה סופית

אני ממליץ על **אופציה 2 (Incremental)** מהסיבות הבאות:

1. **בטיחות**: כל שלב ניתן לבדיקה לפני המשך
2. **למידה**: תוכל ללמוד מהשלבים הראשונים
3. **גמישות**: אפשר לעצור/לשנות כיוון בכל שלב
4. **איכות**: יותר זמן לטסטים ואופטימיזציה

### צעדים ראשונים מומלצים:

1. **שבוע 1**: צור User Store + Project Store בסיסי
2. **שבוע 2**: צור Tasks Chunk Store + Loader
3. **שבוע 3**: רפקטור קומפוננטה אחת בלב (למשל reqtojoin)
4. **שבוע 4**: בדוק ביצועים, תקן באגים
5. **שבוע 5**: אם הכל עובד - המשך לקומפוננטות נוספות

**האם תרצה שנתחיל עם שלב 1?**
