# מדריך לעדכון קלפים לסגנון מודרני

## סקירה כללית
מדריך זה מתאר כיצד לעדכן את כל קלפי ה-lev לסגנון המודרני עם אפקטי glow, עיצוב מעוגל, ותמיכה מלאה ב-dark mode.

## קלפים לדוגמה
- `ProductRequestCard.svelte` - קלף מודרני מלא
- `inpro.svelte` - קלף משימה בתהליך

## רכיבים נדרשים
```javascript
import CardHeader from './CardHeader.svelte';
import VoteStatusDisplay from './VoteStatusDisplay.svelte';
```

## מבנה בסיסי של קלף מודרני

### 1. Props - הוספת glowColor
```javascript
let {
  // ... props קיימים
  glowColor = 'green', // או 'gold', 'barbi', 'blue'
  user_1s = [],
  users = [],
  activeOrder = 0,
  onProj
} = $props();
```

### 2. Container עם אפקטי Glow
```svelte
<div
  onclick={toggleScrollable}
  role="button"
  tabindex="0"
  onkeypress={(e) => {
    e.key === 'Enter' && toggleScrollable();
  }}
  dir={$lang == 'he' ? 'rtl' : 'ltr'}
  style="overflow-y:auto"
  class="{isMobileOrTablet()
    ? 'w-full h-full'
    : ' w-[90%] h-[90%]'}  lg:w-[90%] {isVisible
    ? $lang == 'he'
      ? 'boxleft'
      : 'boxright'
    : ''} flex d flex-col bg-white dark:bg-gray-800 rounded-2xl overflow-hidden {isScrolable.value
    ? 'shadow-glow border-glow'
    : 'shadow-lg border border-gray-100 dark:border-gray-700'} transition-all duration-300 relative"
  style:--glow-rgb={glowColor === 'gold'
    ? '238, 232, 170'
    : glowColor === 'barbi'
      ? '255, 0, 146'
      : glowColor === 'blue'
        ? '116, 191, 255'
        : glowColor === 'green'
          ? '2, 255, 187'
          : '2, 255, 187'}
>
```

### 3. Header עם CardHeader
```svelte
<CardHeader
  logoSrc={src}
  {projectName}
  cardType={head[$lang]}
  cardTitle={missionName}
  memberCount={noOfusers}
  {glowColor}
  onProjectClick={handleProjectClick}
/>
```

### 4. Content Area
```svelte
<div
  class="{isScrolable.value
    ? 'bg-white dark:bg-slate-800'
    : 'bg-gray-200 dark:bg-slate-700'} transition-all-300 p-4 flex-1 overflow-y-auto d space-y-4"
>
  <!-- תוכן הקלף -->
</div>
```

### 5. Vote Status Display (אם רלוונטי)
```svelte
{#if user_1s && user_1s.length > 0}
  <div class="px-4">
    <VoteStatusDisplay
      votes={users || []}
      members={user_1s}
      {activeOrder}
    />
  </div>
{/if}
```

### 6. Actions Footer
```svelte
<div class="p-4 bg-gray-50 dark:bg-gray-900/50 flex gap-3 border-t border-gray-100 dark:border-gray-700">
  {#if low == false}
    <button
      class="flex-1 py-2 bg-white dark:bg-gray-800 border-2 border-red-500 text-red-500 hover:bg-red-50 font-bold rounded-xl transition-all"
      onclick={() => decline('f')}
    >
      <!-- אייקון או טקסט -->
    </button>
    <button
      class="flex-2 py-2 bg-gradient-to-r from-barbi to-mpink text-white font-extrabold rounded-xl shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all"
      onclick={() => agree('f')}
    >
      <!-- אייקון או טקסט -->
    </button>
  {:else if low == true}
    <Lowbtn isCart="true" />
  {/if}
</div>
```

### 7. Styles
```svelte
<style>
  .flex-2 {
    flex: 2;
  }

  .shadow-glow {
    box-shadow:
      0 4px 6px -1px rgba(0, 0, 0, 0.1),
      0 2px 4px -1px rgba(0, 0, 0, 0.06),
      0 0 20px rgba(var(--glow-rgb), 0.4),
      0 0 40px rgba(var(--glow-rgb), 0.3),
      0 0 60px rgba(var(--glow-rgb), 0.2),
      inset 0 0 20px rgba(var(--glow-rgb), 0.05);
  }

  .border-glow {
    border: 2px solid rgba(var(--glow-rgb), 0.5);
    box-shadow:
      0 4px 6px -1px rgba(0, 0, 0, 0.1),
      0 2px 4px -1px rgba(0, 0, 0, 0.06),
      0 0 20px rgba(var(--glow-rgb), 0.4),
      0 0 40px rgba(var(--glow-rgb), 0.3),
      0 0 60px rgba(var(--glow-rgb), 0.2),
      inset 0 0 20px rgba(var(--glow-rgb), 0.05),
      0 0 0 1px rgba(var(--glow-rgb), 0.3);
  }
</style>
```

## צבעי Glow לפי סוג קלף

| סוג קלף | glowColor | תיאור |
|---------|-----------|--------|
| משימה בתהליך | `blue` | כחול - משימות פעילות |
| בקשת משאב | `barbi` | ורוד - בקשות |
| אישור משאב | `green` | ירוק - אישורים |
| הצבעה כללית | `gold` | זהב - הצבעות |
| חלוקה | `gold` | זהב - חלוקות |

## קלפים שצריך לעדכן

### ✅ כבר מעודכנים
- `ProductRequestCard.svelte`
- `inpro.svelte`

### ⏳ צריך לעדכן
1. `dowegeot.svelte` - glowColor: `green`
2. `fini.svelte` - glowColor: `blue`
3. `reqtojoin.svelte` - glowColor: `barbi`
4. `rektom.svelte` - glowColor: `gold`
5. `hachlata.svelte` - glowColor: `gold`
6. `sugestma.svelte` - glowColor: `barbi`
7. `sugestmi.svelte` - glowColor: `barbi`
8. `pma.svelte` - glowColor: `gold`
9. `pending.svelte` - glowColor: `blue`
10. `haluka.svelte` - glowColor: `gold`
11. `didigetCard.svelte` - glowColor: `green`

## שלבי העדכון לכל קלף

1. **הוסף imports**:
   ```javascript
   import CardHeader from './CardHeader.svelte';
   import VoteStatusDisplay from './VoteStatusDisplay.svelte';
   ```

2. **עדכן props** - הוסף `glowColor`, `user_1s`, `users`, `activeOrder`, `onProj`

3. **החלף את ה-container** - השתמש במבנה המודרני עם `style:--glow-rgb`

4. **החלף את ה-header** - השתמש ב-`CardHeader` במקום הקוד הישן

5. **עדכן את ה-content area** - השתמש בקלאסים המודרניים

6. **הוסף VoteStatusDisplay** - אם יש הצבעות

7. **עדכן את ה-footer** - השתמש בכפתורים המודרניים

8. **הוסף styles** - העתק את ה-styles של glow

## דוגמה מלאה - עדכון dowegeot.svelte

ראה את הקובץ `ProductRequestCard.svelte` לדוגמה מלאה של קלף מודרני.

## בדיקות

לאחר עדכון כל קלף, בדוק:
- ✅ הקלף מוצג נכון ב-light mode
- ✅ הקלף מוצג נכון ב-dark mode
- ✅ אפקט ה-glow עובד כשהקלף פעיל
- ✅ הכפתורים עובדים
- ✅ ה-VoteStatusDisplay מוצג נכון (אם רלוונטי)
- ✅ הקלף responsive למובייל
