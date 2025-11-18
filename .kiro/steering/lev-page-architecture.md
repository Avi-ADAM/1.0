---
inclusion: manual
---

# ארכיטקטורת עמוד הלב (Lev Page Architecture)

## סקירה כללית

עמוד הלב הוא המסך המרכזי של המערכת שמציג למשתמש את כל הפעולות, ההצעות וההחלטות הממתינות לו.
העמוד תומך בשתי תצוגות: **מטבעות** (coins) ו**קלפים** (cards).

## היררכיית הקומפוננטות

```
src/routes/(reg)/lev/+page.svelte (ROOT)
├── src/lib/components/lev/newcoinui.svelte (תצוגת מטבעות)
│   └── [קומפוננטות מטבעות ספציפיות]
└── src/lib/components/lev/cards/cards.svelte (תצוגת קלפים)
    └── [קומפוננטות קלפים ספציפיות]
```

## זרימת המידע

### 1. שלב איסוף הנתונים (+page.svelte)

**קובץ מקור**: `src/routes/(reg)/lev/+page.svelte`

**תפקיד**: 
- שליפת נתונים מהשרת דרך GraphQL
- עיבוד ומיון הנתונים
- יצירת מערך `arr1` המאוחד

**תהליך**:
```javascript
// 1. שליפת נתונים ראשונית
await fetchMainUserData() → miData

// 2. עיבוד לפי סוגים
showOpenPro(miData)      → meData (הצעות משימות)
createasked(miData)      → dictasked/askedcoin (בקשות הצטרפות)
createpends(miData)      → pends (משימות ממתינות)
processMesimabetahalicha → mtaha (משימות בתהליך)
processIshursium()       → fiapp (אישורי משימות)
pmash()                  → pmashes (משאבים ממתינים)
crMaap()                 → wegets (בקשות משאבים)
rashbi()                 → haluask (בקשות חלוקה)
processHachla()          → hachlatot (החלטות)
makeWalcom()             → walcomen (ברוכים הבאים)
tveria()                 → tverias (העברות כספים)

// 3. איחוד למערך אחד
bubleUiAngin() → arr1 = [...tverias, ...walcomen, ...askedcoin, ...]
```

### 2. מבנה אובייקט ב-arr1

כל אובייקט במערך `arr1` מכיל:

```javascript
{
  ani: "סוג האובייקט", // 'pends', 'askedcoin', 'mtaha', 'pmashes', וכו'
  azmi: "קטגוריה",      // 'harchava', 'ziruf', 'mesima', וכו'
  pl: מספר,             // עדיפות למיון
  coinlapach: מספר,     // מזהה ייחודי
  projectId: מספר,      // מזהה פרויקט
  projectName: "שם",    // שם הפרויקט
  src: "URL",           // תמונת פרויקט
  // ... שדות ספציפיים לכל סוג
}
```

### 3. שלב התצוגה

#### תצוגת מטבעות (Coins View)

**קובץ**: `src/lib/components/lev/newcoinui.svelte`

**תפקיד**:
- מציג את כל האובייקטים כמטבעות במרחב 2D
- מחשב מיקומים במעגלים סביב מרכז
- מטפל בגלילה ומירכוז

**לוגיקת תצוגה**:
```svelte
{#each arr1 as buble, i}
  {@const myline = orders[i]}
  
  {#if buble.ani === 'haluk' && milon.desi == true}
    <Hal {...buble} />
  {:else if buble.ani === 'mtaha' && milon.betaha == true}
    <MissionInProgress {...buble} />
  {:else if buble.ani === 'pends' && milon.pend == true}
    <PendingM {...buble} />
  <!-- ... עוד סוגים -->
  {/if}
{/each}
```

#### תצוגת קלפים (Cards View)

**קובץ**: `src/lib/components/lev/cards/cards.svelte`

**תפקיד**:
- מציג את האובייקטים כקלפים ב-Swiper
- מאפשר ניווט בין קלפים
- מטפל בסינון ומיון

**לוגיקת תצוגה**:
```svelte
<Swiper>
  {#each filteredArr as buble, i}
    <SwiperSlide>
      {#if buble.ani === 'haluk'}
        <Hal cards="true" {...buble} />
      {:else if buble.ani === 'mtaha'}
        <MissionInProgress cards="true" {...buble} />
      <!-- ... עוד סוגים -->
      {/if}
    </SwiperSlide>
  {/each}
</Swiper>
```

## דו-תצוגתיות (Dual Display Pattern)

כל סוג אובייקט מיושם בשני קבצים:

### 1. קומפוננטה ראשית (Main Component)
**מיקום**: `src/lib/components/lev/[name].svelte`

**אחריות**:
- לוגיקה עסקית
- ניהול state
- קריאות API
- טיפול באירועים
- תצוגת מטבע (coin)

**דוגמה**: `src/lib/components/lev/halukaask.svelte`

### 2. קומפוננטת תצוגת קלף (Card Display Component)
**מיקום**: `src/lib/components/lev/cards/[name].svelte`

**אחריות**:
- תצוגה בלבד (presentation only)
- קבלת props מהקומפוננטה הראשית
- העברת אירועים חזרה להורה
- אין לוגיקה עסקית

**דוגמה**: `src/lib/components/lev/cards/haluka.svelte`

### דוגמה מלאה: בקשת חלוקה (Haluka)

```
halukaask.svelte (ראשי)
├── מכיל את כל הלוגיקה
├── מטפל ב-API calls
├── מנהל state (already, noofusersOk, וכו')
├── מציג תצוגת מטבע כברירת מחדל
└── אם cards={true} → מעביר props ל-haluka.svelte

haluka.svelte (תצוגת קלף)
├── מקבל props מ-halukaask
├── מציג UI של קלף
├── מעביר אירועים חזרה (onAgree, onDecline)
└── אין לוגיקה עסקית
```

## סוגי אובייקטים (Object Types)

| ani | תיאור | קומפוננטה ראשית | קומפוננטת קלף |
|-----|-------|-----------------|---------------|
| `haluk` | בקשת חלוקת רווחים | `halukaask.svelte` | `cards/haluka.svelte` |
| `mtaha` | משימה בתהליך | `missionInProgress.svelte` | `cards/inpro.svelte` |
| `pends` | משימה ממתינה | `pandingMesima.svelte` | `cards/pma.svelte` |
| `pmashes` | משאב ממתין | `pmas.svelte` | `cards/pma.svelte` |
| `askedcoin` | בקשת הצטרפות | `reqtojoin.svelte` | `cards/reqtojoin.svelte` |
| `askedm` | בקשת משאב | `reqtom.svelte` | `cards/reqtom.svelte` |
| `fiapp` | אישור משימה | `fiappru.svelte` | `cards/fini.svelte` |
| `wegets` | בקשת משאב נכנסת | `weget.svelte` | `cards/dowegeot.svelte` |
| `meData` | הצעת משימה | `projectSuggestor.svelte` | `cards/sugestmi.svelte` |
| `huca` | הצעת משאב | `mashsuggest.svelte` | `cards/sugestma.svelte` |
| `walcomen` | ברוך הבא | `welcomTo.svelte` | `cards/welcomeToCard.svelte` |
| `hachla` | החלטה | `decisionMaking.svelte` | `cards/hachlata.svelte` |
| `vidu` | העברת כסף | `didiget.svelte` | `cards/didigetCard.svelte` |

## מעבר בין תצוגות

```javascript
// ב-+page.svelte
let cards = $state(true); // true = קלפים, false = מטבעות

function cardsi(event) {
  cards = event.cards;
}

// העברה לילדים
{#if cards == true}
  <Cardsui {arr1} onCards={cardsi} ... />
{:else}
  <Coinsui {arr1} onCards={cardsi} ... />
{/if}
```

## טיפול באירועים (Event Handling)

### זרימת אירועים מלמטה למעלה:

```
קומפוננטת קלף/מטבע
  ↓ (onAgree, onDecline, וכו')
קומפוננטה ראשית
  ↓ (onCoinLapach)
cards.svelte / newcoinui.svelte
  ↓ (onStart)
+page.svelte
  ↓ (coinLapach)
עדכון arr1 + קריאה ל-start()
```

### דוגמה:

```javascript
// בקומפוננטת קלף
<button onclick={() => onAgree?.({ alr: 'f' })}>אישור</button>

// בקומפוננטה ראשית
function agree(alr) {
  // לוגיקה...
  onCoinLapach?.({ ani: "haluk", coinlapach: coinlapach });
}

// ב-cards.svelte
function delo(event) {
  onStart?.({ cards: false, ani: event.ani, coinlapach: event.coinlapach });
}

// ב-+page.svelte
function coinLapach(event) {
  const indexy = arr1.findIndex(c => c.coinlapach === event.coinlapach);
  arr1.splice(indexy, 1);
  arr1 = [...arr1];
  start(); // רענון נתונים
}
```

## סינון ומיון

### מערך milon - שליטה על תצוגה

```javascript
let milon = $state({
  hachla: true,   // החלטות
  fiap: true,     // אישורים
  welc: true,     // ברוכים הבאים
  sugg: true,     // הצעות
  pend: true,     // ממתינים
  asks: true,     // בקשות
  betaha: true,   // בתהליך
  desi: true,     // החלטות
  ppmash: true,   // משאבים ממתינים
  pmashs: true,   // הצעות משאבים
  pmaap: true,    // בקשות משאבים
  askmap: true    // בקשות משאבים ממני
});
```

### סינון לפי פרויקט

```javascript
// ב-cards.svelte
let filteredArr = $derived(
  currentProjectIdFilter !== null
    ? arr1.filter(item => item.projectId === currentProjectIdFilter)
    : arr1
);
```

## שמירה ושחזור (Persistence)

### Local Storage

```javascript
// שמירה
localStorage.setItem('miDataLM', JSON.stringify(arr1));
localStorage.setItem('pendMisMes', JSON.stringify($pendMisMes));

// שחזור
if (localStorage.getItem('miDataLM') !== null) {
  arr1 = JSON.parse(localStorage.getItem('miDataLM'));
}
```

### Snapshot (SvelteKit)

```javascript
export const snapshot = {
  capture: () => {
    const snapshotData = JSON.stringify(arr1);
    localStorage.setItem('arr1Snapshot', snapshotData);
    return JSON.parse(snapshotData);
  },
  restore: async (value) => {
    if (updateV === false) {
      arr1 = value;
    }
  }
};
```

## עדכונים בזמן אמת (Real-time Updates)

### Socket.IO Integration

```javascript
socket.on('pmash:update', (datan) => {
  let index = arr1.findIndex(
    element => element.ani === 'pmashes' && element.pendId == datan.data.id
  );
  
  if (index != -1) {
    // עדכון הודעות
    let arr = arr1[index].messege;
    arr.push(newMessage);
    pendMasMes.set(old);
  }
});
```

## הנחיות לפיתוח

### הוספת סוג אובייקט חדש

1. **צור פונקציית עיבוד ב-+page.svelte**:
```javascript
function processNewType(data) {
  let newArray = [];
  // עיבוד הנתונים
  newArray.push({
    ani: 'newtype',
    azmi: 'category',
    pl: priority,
    // ... שדות נוספים
  });
  return newArray;
}
```

2. **הוסף לקריאה ב-start()**:
```javascript
async function start() {
  // ...
  let newItems = processNewType(miData);
  // ...
}
```

3. **הוסף ל-bubleUiAngin()**:
```javascript
arr1 = [
  ...existingArrays,
  ...newItems
].sort(({ pl: a }, { pl: b }) => a - b);
```

4. **צור קומפוננטה ראשית**:
```
src/lib/components/lev/newtype.svelte
```

5. **צור קומפוננטת קלף**:
```
src/lib/components/lev/cards/newtype.svelte
```

6. **הוסף תנאי ב-newcoinui.svelte**:
```svelte
{:else if buble.ani === 'newtype' && milon.newtype == true}
  <NewType {...buble} />
```

7. **הוסף תנאי ב-cards.svelte**:
```svelte
{:else if buble.ani === 'newtype' && milon.newtype == true}
  <SwiperSlide>
    <NewType cards="true" {...buble} />
  </SwiperSlide>
```

8. **הוסף ל-milon**:
```javascript
let milon = $state({
  // ...
  newtype: true
});
```

### כללי קוד

1. **הפרדת אחריות**: קומפוננטה ראשית = לוגיקה, קומפוננטת קלף = תצוגה בלבד
2. **העברת props**: העבר רק את מה שנחוץ לתצוגה
3. **אירועים**: השתמש ב-callbacks (`onAgree`, `onDecline`) ולא ב-dispatch
4. **טיפוסים**: הוסף JSDoc לכל props
5. **שמות**: השתמש בשמות עבריים עקביים עם המערכת

### דוגמת קומפוננטה ראשית

```svelte
<script>
  /**
   * @typedef {Object} Props
   * @property {boolean} [cards] - האם בתצוגת קלפים
   * @property {any} coinlapach - מזהה ייחודי
   * @property {(payload: { ani: string, coinlapach: any }) => void} [onCoinLapach]
   */
  
  /** @type {Props} */
  let { cards = false, coinlapach, onCoinLapach } = $props();
  
  // לוגיקה עסקית כאן
  
  function handleAction() {
    // עיבוד
    onCoinLapach?.({ ani: "type", coinlapach });
  }
</script>

{#if cards == false}
  <!-- תצוגת מטבע -->
{:else}
  <CardComponent {onAgree}={handleAction} ... />
{/if}
```

### דוגמת קומפוננטת קלף

```svelte
<script>
  /**
   * @typedef {Object} Props
   * @property {(payload: any) => void} [onAgree]
   */
  
  /** @type {Props} */
  let { onAgree } = $props();
</script>

<div class="card">
  <!-- UI בלבד -->
  <button onclick={() => onAgree?.({ data: 'value' })}>
    אישור
  </button>
</div>
```

## קבצים קשורים

- **עיבוד נתונים**: `src/lib/utils/levDataProcessors.js`
- **שאילתות GraphQL**: `src/lib/utils/levGraphQLQueries.js`
- **עיבוד הצבעות**: `src/lib/utils/levVotingProcessors.js`
- **עיבוד הודעות**: `src/lib/utils/levMessageProcessors.js`
- **אנימציות**: `src/lib/utils/levAnimationUtils.js`

## טיפים לפתרון בעיות

1. **אובייקט לא מוצג**: בדוק את `milon` ו-`ani` value
2. **נתונים לא מתעדכנים**: בדוק socket listeners ו-`start()` calls
3. **קלף ריק**: ודא שהקומפוננטה מקבלת את כל ה-props הנדרשים
4. **מיקום מטבע שגוי**: בדוק את `checkLine()` ו-`orders` calculation
5. **אירוע לא עובד**: עקוב אחרי שרשרת ה-callbacks מלמטה למעלה
