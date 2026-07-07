# תוכנית מיגרציה: מודולריזציה של "מוח הריקמה" (Moach)

## סקירה כללית
מעבר מדף מונוליטי [`+page.svelte`](src/routes/(reg)/moach/+page.svelte) (3,177 שורות, שאילתת GraphQL ענקית אחת, 13 טאבים מבוססי-state) למבנה מבוסס נתיבים שמחזיק:

- **`/moach/[projectId]/[tab]`** — דף נפרד לכל טאב.
- **`/moach/[projectId]/[entity]/[entityId]`** — דף ייעודי לכל ישות שיש לה דיון, הצבעה, או החלטה (משימה בתהליך, הצבעה, פעולה, חלוקה, מכירה, תהליך, שרשרת).

זה משרת שתי מטרות שלובות:
1. **בני אדם** — Deep linking, ביצועים טובים יותר, ושיתוף קישור לישות ספציפית.
2. **סוכני AI** — כל ישות בפרויקט ניתנת לכתובת URL יחידה. הסוכן יכול לנווט/לקרוא את הקונטקסט/לפעול ברמת הישות, באמצעות meta-tags ו-JSON-LD מובנים בכל דף.

קובץ נלווה: [`MOACH_AI_AGENT_GUIDE.md`](MOACH_AI_AGENT_GUIDE.md) — הסבר מפורט לסוכני AI על כל הדפים, הישויות, והפעולות הזמינות.

---

## 1. יעדי המיגרציה

* **נתיבים ייעודיים לטאבים** — כל טאב יהפוך לדף עצמאי (למשל `/moach/123/kanban`).
* **נתיבים ייעודיים לישויות** — לכל `mesimabetahalich`, `vot`, `act`, `tosplit`, `sale`, `process`, `chain` — דף משלה עם URL stable.
* **ניהול נתונים חכם** — Store מסונכרן ל-LocalStorage, מניעת השאילתה המונוליטית (`start()` הנוכחית כיום מושכת את כל הפרויקט).
* **שיפור ביצועים** — טעינה ראשונית מהירה יותר על ידי פיצול השאילתה.
* **אבטחה משופרת** — שימוש ב-Server Load Functions וב-Unified Action System ([`src/lib/server/actions`](src/lib/server/actions/)).
* **חווית משתמש** — Deep linking, חזרה ישירה לטאב/ישות אחרי refresh.
* **AI-friendly** — מטה-דאטה וסכמה מובנית בכל דף ישות, לפי `MOACH_AI_AGENT_GUIDE.md`.

## 2. מבנה התיקיות החדש

```text
src/routes/(reg)/moach/
├── +page.svelte                       # דף בחירת פרויקט (כיום בתוך else)
└── [projectId]/
    ├── +layout.svelte                 # UI משותף: AuthorityBadge, header, navigation, timers, social links
    ├── +layout.js                     # Load: project base info + members + initial timers fetch
    ├── +layout.server.js              # auth + Server-side base data (אופציונלי, לפי שימוש)
    │
    ├── +page.svelte                   # redirect → /main
    │
    ├── main/+page.svelte              # תיאור, ערכים
    ├── create/+page.svelte            # ChoosMission / ChoosNeed / ProcessCreator (3-way mode)
    ├── gantt/+page.svelte             # Gantt
    ├── split/+page.svelte             # Fini, Hach
    ├── progress/
    │   ├── +page.svelte               # רשימה (Bethas)
    │   └── [missionId]/+page.svelte   # ★ מסימה בתהליך יחידה (ראה §4)
    ├── sales/
    │   ├── +page.svelte               # Hamatanot
    │   └── [saleId]/+page.svelte      # ★ מכירה/מתנה יחידה
    ├── shifts/+page.svelte            # Sidur
    ├── acts/
    │   ├── +page.svelte               # ActsTable
    │   └── [actId]/+page.svelte       # ★ פעולה (act) יחידה
    ├── timers/+page.svelte            # TimersOfUsers
    ├── kanban/+page.svelte            # Kanbanboard
    ├── processes/
    │   ├── +page.svelte               # ProcessBoard
    │   └── [processId]/+page.svelte   # קיים כיום ב-process/[processid] — הגירה לכאן
    ├── chains/
    │   ├── +page.svelte               # ProcessChainView
    │   └── [chainId]/+page.svelte     # ★ שרשרת יחידה
    ├── votes/
    │   ├── +page.svelte               # רשימת הצבעות פתוחות בפרויקט (חדש)
    │   └── [voteId]/+page.svelte      # ★ הצבעה יחידה
    ├── splits/
    │   └── [splitId]/+page.svelte     # ★ tosplit יחיד עם halukas + vots
    └── services/+page.svelte          # Sheirut (כיום בהערה במונוליט - להחליט: להחזיר או למחוק)
```

הנתיב הקיים `src/routes/(reg)/moach/process/[processid]/+page.svelte` יועתק ל-`processes/[processId]/+page.svelte` עם redirect מהנתיב הישן.

## 3. רשימת הטאבים המלאה (כולל חסרים)

הטבלה משקפת את כל הטאבים הקיימים בקוד הנוכחי, כולל אלו שלא הופיעו בגרסה הקודמת של המסמך.

| # | טאב | מסלול חדש | רכיב | נתונים נדרשים | ישויות עם דף ייעודי |
|---|---|---|---|---|---|
| 1 | **ראשי** (main) | `/main` | `RichText`, `Tile` | `projectName`, `descripFor`, `publicDescription`, `vallues` | — |
| 2 | **יצירה** (create) | `/create` | `Hand`, `Handd`, `ChoosMission`, `ChoosNeed`, `ProcessCreator`, `TotalNeeds`, `Mission` | `open_missions`, `open_mashaabims`, `pendms`, `vallues`, `user_1s`, `restime`, `processes` | — |
| 3 | **גאנט** (gantt) | `/gantt` | `Gantt` | `mesimabetahaliches`, `pendms`, `open_missions`, `finnished_missions` | — |
| 4 | **חלוקה** (split) | `/split` | `Fini`, `Hach` | `finnished_missions`, `rikmashes`, `user_1s`, `tosplits` | `/splits/[id]` ★ |
| 5 | **בתהליך** (progress) | `/progress` | `Bethas` | `mesimabetahaliches` | **`/progress/[id]`** ★ |
| 6 | **שירותים** (services) | `/services` | `Sheirut` | `sheiruts` | — *(כיום מסומן בהערה)* |
| 7 | **מכירות** (sales) | `/sales` | `Hamatanot` | `sales`, `matanotofs`, `tosplits`, `finnished_missions`, `rikmashes` | `/sales/[id]` ★ |
| 8 | **משמרות** (shifts) | `/shifts` | `Sidur` | (פנימי לרכיב) | — |
| 9 | **פעולות** (acts) | `/acts` | `ActsTable` | `acts` | **`/acts/[id]`** ★ |
| 10 | **טיימרים** (timers) | `/timers` | `TimersOfUsers` | `projectTimers` (קריאה נפרדת קיימת) | — |
| 11 | **קאנבן** (kanban) | `/kanban` | `Kanbanboard` | `open_missions`, `pendms`, `mesimabetahaliches`, `finnished_missions`, `acts` | — |
| 12 | **תהליכים** (processes) | `/processes` | `ProcessBoard` | `processes` | `/processes/[id]` |
| 13 | **שרשראות** (chains) | `/chains` | `ProcessChainView` | (כל המשימות + opmash + rikmashes + acts) | `/chains/[id]` ★ |
| **14** | **הצבעות** (votes) ★ חדש | `/votes` | `VoteList` (חדש) | מקבץ של: `vots` בתוך tosplits + `finiapruvals` + `asks` + הצבעות לוגו (`picvots`) | **`/votes/[id]`** ★ |

**סיכום השינויים מול הגרסה הקודמת של המסמך:**
- ✅ נוספו: טאב 6 (services), טאב 12 (processes), טאב 13 (chains).
- ✅ נוסף: טאב 14 (votes) — מאחד את כל מנגנוני ההצבעה הקיימים שהיום מפוזרים.
- ✅ נוספו: דפי ישות לכל ישות שיש בה דיון/הצבעה/החלטה.

## 4. פילוסופיה: דף לכל ישות (Entity-per-URL)

### למה זה חשוב?
היום ה-context של "מסימה בתהליך X" קיים רק כ-state חולף בתוך `+page.svelte` (modal, scroll position, עוטף JSX). כתוצאה:
- אי אפשר לשלוח קישור לחבר על מסימה ספציפית (Deep link).
- AI agent לא יכול "לקרוא" את הקונטקסט של ישות ולפעול עליה — חייב לטעון את כל הפרויקט.
- כל אינטראקציה דורשת טעינת השאילתה המונוליטית מההתחלה.

### העיקרון
לכל ישות שמחזיקה **דיון, הצבעה, או החלטה** יש URL יחיד תחת `/moach/[projectId]/`:

| ישות | URL | מה יש בה |
|---|---|---|
| `mesimabetahalich` | `/moach/[pid]/progress/[id]` | פרטי המסימה, acts, finiapruvals, forum/chat embedded |
| `vot` (הצבעה) | `/moach/[pid]/votes/[id]` | מצב הצבעה, מי הצביע, מה ההצעה, deadline |
| `tosplit` | `/moach/[pid]/splits/[id]` | halukas (חלקים), hervachti (אישורים אישיים), vots, סטטוס |
| `act` (פעולה) | `/moach/[pid]/acts/[id]` | פרטי הפעולה, מי עושה, מי מאשר |
| `sale` | `/moach/[pid]/sales/[id]` | פרטי המכירה, מה התקבל, חלוקה |
| `process` | `/moach/[pid]/processes/[id]` | קיים — תהליך + שרשרת |
| `chain` | `/moach/[pid]/chains/[id]` | שרשרת מ-pendm → openMission → mesimabetahalich → finished |

### מבנה דף ישות (סטנדרטי)
כל דף ישות יכלול את אותם מקטעים בעלי anchor IDs קבועים:
1. **`#header`** — Breadcrumb (`Moach > [project name] > [tab] > [entity name]`), שם, סטטוס, badge של תאריכים.
2. **`#description`** — תוכן עיקרי של הישות.
3. **`#participants`** — אנשים מעורבים + תפקידיהם.
4. **`#discussion`** — forum/chat embedded (אם רלוונטי).
5. **`#actions`** — פעולות זמינות בקונטקסט הזה (button to vote/approve/join).
6. **`#timeline`** — היסטוריית אירועים (אופציונלי).
7. **AI metadata** — `<svelte:head>` עם meta tags + `<script type="application/ld+json">` מובנה (ראה §7 והקובץ הנלווה לסוכני AI).

## 5. אסטרטגיית ניהול נתונים (Moach Store)

יוקם Store חדש ב-`src/lib/stores/moachStore.js` שישתמש ב-Runes של Svelte 5 וב-LocalStorage:

```javascript
// סכימה מוצעת ל-Store
import { browser } from '$app/environment';

const STORAGE_KEY = 'moach.cache.v1';
const TTL = {
  base:        5 * 60_000,  // 5 דק' לנתוני בסיס
  missions:    60_000,      // דקה למשימות
  financials:  30_000,      // 30 שניות לפיננסי
  entity:      15_000       // 15 שניות לדפי ישות בודדת
};

export const projectData = $state({
  projects: {},   // { [projectId]: { base, missions, financials, entities: {}, _ts: { ... } } }
  currentId: null,
  loading: false
});

// פונקציות:
// loadFromLocalStorage()           - הידרציה ראשונית
// persist()                        - debounced write
// updateProjectData(pid, type, d)  - עדכון slice + bump _ts
// updateEntity(pid, entityId, d)   - עדכון ישות יחידה
// isDataFresh(pid, type)           - השוואה מול TTL[type]
// invalidate(pid, type)            - לפי socket notification
```

### מניעת כפילות נתונים
1. **Layout Load** ([`[projectId]/+layout.js`](src/routes/(reg)/moach/[projectId]/+layout.js)) — נתונים בסיסיים: שם פרויקט, לוגו (דרך `AuthorityBadge`), חברים, social links, `restime`, `vallues`.
2. **Layout side-effect** — `fetchProjectTimers` להציג אינדיקטורים פעילים על תמונות הפרופיל.
3. **Page Load** — כל דף טאב מושך רק את ה-slice הרלוונטי (Gantt → רק משימות; Split → רק פיננסי).
4. **Entity Load** — `[entityId]/+page.server.js` מושך **ישות יחידה** דרך QID ייעודי, לא את כל הפרויקט.
5. **Cache lookup** — לפני כל קריאה: בדיקת טריות מול ה-Store.

### סנכרון real-time
ה-Socket notifications הקיימות → invalidate ה-slice המתאים → re-fetch lazy בכניסה הבאה לדף.

## 6. אבטחה ושאילתות (QIDS)

`sendToSer` דרך load functions בצד השרת. פיצול ה-QIDs ב-[`src/routes/api/send/qids.js`](src/routes/api/send/qids.js):

| QID | מטרה | משמש ב |
|---|---|---|
| `getProjectBaseInfo` | שם, לוגו, חברים, social, vallues, restime | layout |
| `getProjectMissions` | open/pending/in-progress/finished + acts | gantt, kanban, chains, progress, acts |
| `getProjectFinancials` | tosplits, sales, matanotofs, rikmashes, finnished | split, sales |
| `getProjectShifts` | sheiruts | shifts, services |
| `getProjectVotes` | מאחד `vots` + `finiapruvals` + `asks` + `picvots` | votes |
| `getMissionInProgress` | mesimabetahalich יחיד + forums + finiapruvals | `/progress/[id]` |
| `getVote` | vot יחיד עם voters + parent context | `/votes/[id]` |
| `getTosplit` | tosplit עם halukas, vots, hervachti | `/splits/[id]` |
| `getAct` | act + מי אישר + linked mission | `/acts/[id]` |
| `getSale` | sale + matanot + users | `/sales/[id]` |
| `getChain` | שרשרת יחידה reconstructed | `/chains/[id]` |

כל פעולת **כתיבה** עוברת דרך ה-Unified Action System (`actionService.executeAction(...)`).

## 7. מטה-דאטה לסוכני AI

כל דף ישות יחשוף את אותה סכמה מובנית, כדי שסוכן AI יוכל "לקרוא" את הדף ולהבין מה אפשר לעשות בו.

### A. `<svelte:head>` עם meta tags
```html
<title>{entityName} — {projectName}</title>
<meta name="moach:entity-type" content="mesimabetahalich" />
<meta name="moach:entity-id"   content="{id}" />
<meta name="moach:project-id"  content="{projectId}" />
<meta name="moach:status"      content="active" />
```

### B. JSON-LD מובנה
```html
<script type="application/ld+json">
{
  "@type": "MoachEntity",
  "entityType": "vote",
  "id": "...",
  "projectId": "...",
  "title": "...",
  "status": "open",
  "createdAt": "...",
  "deadline": "...",
  "participants": [{ "id": "...", "username": "..." }],
  "availableActions": [
    { "id": "vote-yes", "label": "אני בעד", "method": "POST", "actionKey": "voteYes" },
    { "id": "vote-no",  "label": "אני נגד", "method": "POST", "actionKey": "voteNo"  }
  ],
  "relatedEntities": [
    { "type": "tosplit", "id": "...", "url": "/moach/.../splits/..." }
  ]
}
```

### C. Anchor IDs קבועים
`#header`, `#description`, `#participants`, `#discussion`, `#actions`, `#timeline`.

### D. ARIA roles ברורים
`<main>` עוטף את תוכן הישות, `<aside aria-label="actions">` עוטף controls, וכל פעולה כוללת `aria-label` תיאורי.

### E. קובץ הסבר נפרד
ראה [`MOACH_AI_AGENT_GUIDE.md`](MOACH_AI_AGENT_GUIDE.md).

## 8. URL ↔ Store

* **URL** = source of truth לזהות (`projectId`, `tab`, `entityId`).
* **Store** = source of truth לתוכן (cached data + reactive state).
* ה-Store הקיים [`idPr`](src/lib/stores/idPr.js) נשמר כגשר תאימות זמני עד שכל הקומפוננטות מסתמכות על URL params; ב-`[projectId]/+layout.js` נסנכרן את `$idPr` עם `params.projectId`.

## 9. שלבי המיגרציה המומלצים

### שלב א' — תשתית (אין breaking changes)
1. יצירת `moachStore.js` עם Runes + LocalStorage + TTL.
2. וידוא שה-`MOACH_AI_AGENT_GUIDE.md` נוצר ועדכני.
3. הקמת שלד `[projectId]/+layout.{svelte,js}` ו-redirect ל-`/main`.
4. פיצול ראשון של QIDs (לפחות `getProjectBaseInfo` + `getProjectMissions`).

### שלב ב' — פיצול UI משותף
1. העברת sidebar/nav (סרגל הטאבים, שורות 2230-2436) ל-`+layout.svelte`.
2. החלפת כפתורי הטאב ב-`<a href="/moach/[id]/[tab]">`.
3. סימון הטאב הפעיל לפי `$page.url.pathname`.

### שלב ג' — דפי טאבים (סדר מומלץ — מהקל למורכב)
1. **main** (כמעט static).
2. **timers** (כבר עצמאי — TimersOfUsers).
3. **acts**, **shifts**, **services** (פשוטים יחסית).
4. **kanban**, **gantt**, **progress** (חולקים נתוני משימות → להשתמש ב-Store cache).
5. **split**, **sales** (פיננסי — נתונים מובחנים).
6. **create** (מורכב — 3-way mode chooser).
7. **processes**, **chains** (להגר מ-`process/[processid]` הקיים — הקוד שם הוא המודל לעקוב אחריו).

### שלב ד' — דפי ישויות (★)
1. `/progress/[missionId]` (הכי קריטי — היום ב-modal בלבד).
2. `/votes/[voteId]` + טאב `/votes` (חדש).
3. `/acts/[actId]`.
4. `/splits/[splitId]`.
5. `/sales/[saleId]`.
6. `/chains/[chainId]`.
7. הוספת meta tags + JSON-LD לכל דף ישות (לפי §7).
8. הוספת anchor IDs + ARIA קבועים.

### שלב ה' — סנכרון state + תאימות
1. כל Action handler מעדכן את ה-Store → reactive בכל הטאבים ללא רענון.
2. Socket notifications → invalidate cache → re-fetch lazy.
3. Backward compat redirect מ-`/moach?id=X` ומ-`/moach/process/[id]`.
4. הסרת `idPr` Store **רק** לאחר שכל הקומפוננטות עברו ל-URL params.

## 10. דגשים טכניים חשובים

* **URL vs Store** — URL ל-זהות, Store ל-תוכן.
* **Loading States** — SvelteKit Loaders + skeleton/ספינר בזמן navigate בין דפים.
* **Shared Components** — `TaskModal`, `AuthorityBadge`, פתיחת chat — ב-Layout הראשי.
* **Backward Compatibility** — `idPr` כגשר זמני, redirects מהנתיבים הישנים.
* **i18n** — 3 שפות (he/en/ar), מתאים לדוגמה הקיימת ב-[`process/[processid]`](src/routes/(reg)/moach/process/[processid]/+page.svelte).
* **Navigation** — כפתור "חזרה לרשימת רקמות" ברמת ה-Layout → `/moach`.
* **Empty states** — כל טאב מציג מסר ידידותי + CTA כשהמערך ריק (היום: `noVallue` ב-tab 4 הוא דוגמה).
* **Toast/Sonner** — להמשיך להשתמש ב-`svelte-sonner` הקיים.
* **MCP integration** — סוכני AI מתחברים דרך `mcp__1lev1-mcp__*`. ה-URLs החדשים יוסיפו אפיקי גישה ל-`getPageContextTool` ו-`navigateToPageTool` הקיימים.
