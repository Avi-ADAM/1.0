# תוכנית אינטגרציה של Socket System בדפים הקיימים

## מצב נוכחי

### מה בנוי:
1. ✅ Socket.IO Server (port 3001)
2. ✅ `socketClient` store - מנהל חיבור ו-notifications
3. ✅ `updateStrategies` - פונקציות לעדכון UI
4. ✅ `+layout.svelte` - מתחבר ל-socket ומציג toast
5. ✅ דוגמאות עובדות (TaskApprovalButton)

### מה חסר:
1. ❌ דף הלב לא משתמש ב-`socketClient` החדש
2. ❌ דף המוח לא מאזין לעדכונים
3. ❌ קומפוננטות לא מאזינות ל-socket events

## תוכנית פעולה

### שלב 1: הוספת Socket Listener לדף הלב

```svelte
<!-- src/routes/(reg)/lev/+page.svelte -->
<script>
  import { socketClient } from '$lib/stores/socketClient';
  import { onMount, onDestroy } from 'svelte';
  
  // ... קוד קיים ...
  
  let unsubscribeSocket;
  
  onMount(() => {
    // האזנה לעדכונים מ-socket
    unsubscribeSocket = socketClient.onNotification((notification) => {
      console.log('[Lev] Received notification:', notification);
      
      // טיפול בעדכונים לפי actionKey
      if (notification.actionKey === 'updateTask') {
        // רענון רשימת המשימות
        refreshTaskList(notification.data);
      } else if (notification.actionKey === 'createHaluka') {
        // רענון חלוקות
        refreshHalukaList(notification.data);
      } else if (notification.actionKey === 'createMessage') {
        // עדכון צ'אט
        refreshChat(notification.data);
      }
      
      // אם יש updateStrategy - הפעל אותו
      if (notification.updateStrategy) {
        handleUpdateStrategy(notification.updateStrategy, notification.data);
      }
    });
  });
  
  onDestroy(() => {
    if (unsubscribeSocket) {
      unsubscribeSocket();
    }
  });
  
  // פונקציות עדכון ספציפיות
  async function refreshTaskList(data) {
    // רענון arr1 (רשימת המשימות)
    await invalidate('arr1');
    // או שליפה ישירה:
    // arr1 = await fetchTasks();
  }
  
  async function refreshHalukaList(data) {
    // רענון רשימת החלוקות
    // ... קוד לרענון
  }
  
  async function refreshChat(data) {
    // עדכון הצ'אט
    // ... קוד לעדכון
  }
</script>
```

### שלב 2: יצירת Custom Events לקומפוננטות

```typescript
// src/lib/utils/socketEvents.ts

/**
 * Dispatch custom event for task updates
 */
export function dispatchTaskUpdate(taskId: string, taskData: any) {
  if (typeof window === 'undefined') return;
  
  window.dispatchEvent(new CustomEvent('task-updated', {
    detail: { taskId, task: taskData }
  }));
}

/**
 * Listen for task updates in components
 */
export function onTaskUpdate(callback: (detail: any) => void) {
  if (typeof window === 'undefined') return () => {};
  
  const handler = (event: CustomEvent) => callback(event.detail);
  window.addEventListener('task-updated', handler);
  
  return () => window.removeEventListener('task-updated', handler);
}
```

### שלב 3: עדכון קומפוננטות ספציפיות

```svelte
<!-- src/lib/components/lev/cards/cards.svelte -->
<script>
  import { onMount, onDestroy } from 'svelte';
  import { onTaskUpdate } from '$lib/utils/socketEvents';
  
  let tasks = $state([]);
  let unsubscribe;
  
  onMount(() => {
    // האזנה לעדכוני משימות
    unsubscribe = onTaskUpdate(({ taskId, task }) => {
      console.log('[Cards] Task updated:', taskId);
      
      // עדכון המשימה ברשימה
      tasks = tasks.map(t => 
        t.id === taskId ? { ...t, ...task } : t
      );
    });
  });
  
  onDestroy(() => {
    if (unsubscribe) unsubscribe();
  });
</script>
```

### שלב 4: רישום Update Strategies ספציפיות לדף הלב

```typescript
// src/lib/client/levUpdateStrategies.ts

import { registerStrategy } from '$lib/client/updateStrategies';
import { invalidate } from '$app/navigation';

/**
 * Register all update strategies specific to Lev page
 */
export function registerLevStrategies() {
  // עדכון רשימת משימות
  registerStrategy('refreshLevTasks', async (data, config) => {
    console.log('[Lev] Refreshing tasks');
    await invalidate('arr1');
    
    // Dispatch event for components
    window.dispatchEvent(new CustomEvent('lev-tasks-updated', {
      detail: data
    }));
  });
  
  // עדכון חלוקות
  registerStrategy('refreshHalukas', async (data, config) => {
    console.log('[Lev] Refreshing halukas');
    await invalidate('halukas');
    
    window.dispatchEvent(new CustomEvent('lev-halukas-updated', {
      detail: data
    }));
  });
  
  // עדכון צ'אט
  registerStrategy('refreshLevChat', async (data, config) => {
    console.log('[Lev] Refreshing chat');
    
    window.dispatchEvent(new CustomEvent('lev-chat-updated', {
      detail: data
    }));
  });
  
  // עדכון יהלומים
  registerStrategy('refreshYahalomim', async (data, config) => {
    console.log('[Lev] Refreshing yahalomim');
    
    window.dispatchEvent(new CustomEvent('lev-yahalomim-updated', {
      detail: data
    }));
  });
}
```

### שלב 5: שימוש ב-Strategies בדף הלב

```svelte
<!-- src/routes/(reg)/lev/+page.svelte -->
<script>
  import { onMount } from 'svelte';
  import { registerLevStrategies } from '$lib/client/levUpdateStrategies';
  import { registerUpdateStrategies } from '$lib/client/updateStrategies';
  
  onMount(() => {
    // רישום כל ה-strategies
    registerUpdateStrategies(); // Built-in strategies
    registerLevStrategies();    // Lev-specific strategies
    
    // האזנה לעדכונים
    window.addEventListener('lev-tasks-updated', handleTasksUpdate);
    window.addEventListener('lev-halukas-updated', handleHalukasUpdate);
    window.addEventListener('lev-chat-updated', handleChatUpdate);
    
    return () => {
      window.removeEventListener('lev-tasks-updated', handleTasksUpdate);
      window.removeEventListener('lev-halukas-updated', handleHalukasUpdate);
      window.removeEventListener('lev-chat-updated', handleChatUpdate);
    };
  });
  
  function handleTasksUpdate(event) {
    console.log('[Lev] Tasks updated:', event.detail);
    // עדכון arr1 או משתנים אחרים
    arr1 = event.detail.tasks || arr1;
  }
  
  function handleHalukasUpdate(event) {
    console.log('[Lev] Halukas updated:', event.detail);
    // עדכון רשימת החלוקות
  }
  
  function handleChatUpdate(event) {
    console.log('[Lev] Chat updated:', event.detail);
    // עדכון הצ'אט
  }
</script>
```

## דוגמה מלאה: עדכון משימה בדף הלב

### 1. משתמש מאשר משימה (בכפתור)
```typescript
// TaskApprovalButton.svelte
await executeAction('updateTask', {
  taskId: '123',
  status: 'approved'
});
```

### 2. השרת שולח notification לכל חברי הפרויקט
```typescript
// Server sends via Socket.IO
{
  actionKey: 'updateTask',
  title: { he: 'משימה אושרה', en: 'Task Approved' },
  body: { he: 'המשימה אושרה בהצלחה', en: 'Task was approved' },
  data: { taskId: '123', status: 'approved' },
  updateStrategy: {
    type: 'optimistic',
    config: {
      updateFunction: 'refreshLevTasks',
      taskId: '123'
    }
  }
}
```

### 3. הדף מקבל ומעדכן
```typescript
// socketClient receives notification
socketClient.onNotification((notification) => {
  // Execute update strategy
  if (notification.updateStrategy) {
    const strategy = getStrategy('refreshLevTasks');
    strategy(notification.data, notification.updateStrategy.config);
  }
});

// refreshLevTasks runs
async function refreshLevTasks(data, config) {
  // Option 1: Invalidate and refetch
  await invalidate('arr1');
  
  // Option 2: Update specific task in array
  arr1 = arr1.map(task => 
    task.id === config.taskId 
      ? { ...task, status: data.status }
      : task
  );
  
  // Dispatch event for components
  window.dispatchEvent(new CustomEvent('task-updated', {
    detail: { taskId: config.taskId, task: data }
  }));
}
```

### 4. קומפוננטות מתעדכנות אוטומטית
```svelte
<!-- cards.svelte -->
<script>
  onMount(() => {
    window.addEventListener('task-updated', (event) => {
      const { taskId, task } = event.detail;
      // Update local state
      updateTaskInList(taskId, task);
    });
  });
</script>
```

## סיכום

המערכת בנויה ומוכנה, אבל צריך:

1. **להוסיף listeners בדפים** - כל דף צריך להאזין ל-`socketClient.onNotification`
2. **לרשום strategies ספציפיות** - כל דף יכול להגדיר איך לעדכן את המידע שלו
3. **להשתמש ב-custom events** - כדי שקומפוננטות יוכלו להגיב לעדכונים
4. **להחליף socket.io ישן** - להסיר את ה-`import { io }` הישן ולהשתמש ב-`socketClient`

האם תרצה שאתחיל ליישם את זה בדף הלב?
