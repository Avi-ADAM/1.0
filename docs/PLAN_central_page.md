# מסמך תכנון – עמוד מרכזי חדש ("Hub") במקום `/(reg)/lev`

> מטרה: לבנות עמוד מרכזי חדש שייתן למשתמש **בהירות ושליטה** על כל השותפויות, ההצבעות, המשימות והעסקאות שלו – עם **טעינה מהירה משמעותית** מעמוד הלב הנוכחי, התומך ב-realtime דרך ה-`socketClient` וה-Unified Action System.

---

## 1. תקציר מנהלים

עמוד הלב הקיים (`src/routes/(reg)/lev/+page.svelte`) הוא עמוד "אחד-לכל" שמושך בשאילתה מסיבית אחת (`83levMainUserQuery`) את **כל** האובייקטים של המשתמש (asks, askms, suggestions, pmashes, wegets, halukas, welcome, transfers, decisions, sheirutpends, sales, purchases, mtaha, fiapp, pends, chats, forums וכו'), מעבד אותם בלקוח דרך 16 stores נגזרים, ומציג Swiper של "מטבעות"/"כרטיסים". זה מקור הכבדות.

העמוד החדש המוצע (להלן: **`Hub`** או `/(reg)/hub`) ייתן את **אותם ערכי משתמש** דרך:

1. **שאילתה ראשונית רזה** – רק _ספירות וכותרות_ + 5 פריטים דחופים (top-priority) לרינדור ראשון אופטימי.
2. **טעינה הדרגתית (progressive hydration)** של הסוגים הפחות-דחופים, או נטענים _רק על דרישה_ כשהמשתמש פותח קטגוריה / כרטיס.
3. **שימוש חוזר בקומפוננטות הכרטיס הקיימות** (`src/lib/components/lev/cards/*.svelte`) כדי להקטין מיגרציה.
4. **דפים עצמאיים `/(regandnon)/kind/[type]/[id]`** שמאפשרים שיתוף קישור ישיר להצבעה / משימה / הצעה / חלוקה.
5. **Realtime** דרך `socketClient.onNotification` עם `updateStrategy.partialUpdate` – אותו המנגנון כמו היום, אבל על stores קטנים וממוקדים יותר.

---

## 2. מצב נוכחי – מה איטי בלב, ולמה

מיפוי קצר על-בסיס הקוד הקיים:

| מקור איטיות                           | מיקום                                                   | סיבה                                                                                                                                                                                                                                        |
| ------------------------------------- | ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| שאילתת GraphQL ענקית                  | `qids.js: 83levMainUserQuery` (1902+)                   | משיכת כל ה-`asks`, `askms`, `vots`, `forums`, `chat`, `messages(pagination: 100)`, `pmashes`, `wegets`, `halukas`, `welcome`, `transfers`, `decisions`, `sheirutpends`, `sales`, `purchases`, `projects.*`, `profilePic.formats` בקריאה אחת |
| שאילתה שנייה כבדה                     | `levDataLoader.ts:147 fetchOpenMissions(topIds[0..50])` | הגדלת `descrip`, `acts`, `dates`, `skills`, `tafkidims`, `work_ways`, `project.user_1s` עבור 50 הצעות                                                                                                                                       |
| 16 derived stores                     | `levDerived.ts`                                         | כל אחד מחושב מחדש על כל שינוי של `projectsStore` או של ה-source store שלו, כולל merge+sort של `finalSwiperArray`                                                                                                                            |
| processing בלקוח                      | `levProcessors.ts` (1000+ שורות)                        | מיפוי לקוח-צד של כל סוג ל-`DisplayItem` כולל `formatTime`, `restime`, `processVotes` וכו'                                                                                                                                                   |
| Swiper + 1324 שורות במ-`cards.svelte` | `src/lib/components/lev/cards/cards.svelte`             | טעינת `Swiper`, `swiper/css`, `Manipulation/Mousewheel/Keyboard/EffectFade/Navigation`, כל קומפוננטת-כרטיס מיובאת eagerly                                                                                                                   |
| `console.log` ב-hot path              | `levDerived.ts:388`, ועוד                               | לוגים מודפסים על כל שינוי של `finalSwiperArray`                                                                                                                                                                                             |
| הידרציה כפולה                         | snapshot מ-localStorage **+** קריאת GraphQL מיד אחריה   | תמיד שני re-renders של אותם פריטים, גם כשה-snapshot טרי                                                                                                                                                                                     |
| Reactive thrashing מטיימרים           | `processedMtaha` עם `timers` store                      | "signature" מצמצם, אבל עדיין רץ על כל `tick` של טיימר                                                                                                                                                                                       |

> **תובנה מרכזית**: בעמוד הלב יש _צימוד הדוק_ בין "מה המשתמש רואה" לבין "כל מה שהשרת יודע על המשתמש". העמוד החדש ינתק את הצימוד הזה.

---

## 3. עיצוב העמוד החדש – `/(reg)/hub`

### 3.1 פריסה גסה (top-to-bottom, mobile-first, RTL)

```
┌─────────────────────────────────────────────┐
│  שורת מצב (KPI bar) — sticky, < 1KB JSON    │
│  [🗳 4 הצבעות]  [⏰ 1 דחוף!]  [💼 7 הצעות]  │
│  [🛒 2 קניות פעילות]  [💰 3 מכירות]         │
├─────────────────────────────────────────────┤
│  קישור CTA: "צור קניה מותאמת אישית" ➜       │
├─────────────────────────────────────────────┤
│  קצרים על הצבעות שלי (top 3 לפי דחיפות)     │
│  [VoteSummaryCard …]                        │
├─────────────────────────────────────────────┤
│  מה מתפתח בעסקאות (sales+purchases stream) │
│  [TimelineRow …]   [SeeAll → /kind/sale]    │
├─────────────────────────────────────────────┤
│  קיצורי דרך לפי "סוג":                      │
│  [🧩 משימות בתהליך] [🤝 ריקמות] [📨 כניסות] │
├─────────────────────────────────────────────┤
│  Action feed (5 פריטים, lazy)               │
└─────────────────────────────────────────────┘
```

### 3.2 רכיבי UI

| רכיב                       | מקור                                                          | הערות                                             |
| -------------------------- | ------------------------------------------------------------- | ------------------------------------------------- |
| `KpiBar.svelte`            | חדש – `src/lib/components/hub/KpiBar.svelte`                  | מציג מספרים. **לא** מקבל את הפריטים – רק `counts` |
| `UrgentVotePill.svelte`    | חדש                                                           | מודלק באדום כש-`deadline - now < THRESHOLD`       |
| `VoteSummaryCard.svelte`   | re-use של `cards/hachlata.svelte` במצב `low={true}`           | חוסך מיגרציה                                      |
| `SalesStream.svelte`       | re-use של `cards/SaleCard.svelte` + `CustomerSaleCard.svelte` | מקסימום 3 פריטים                                  |
| `KindShortcut.svelte`      | חדש                                                           | קטן, מוביל ל-`/kind/[type]`                       |
| `CustomPurchaseCta.svelte` | חדש – placeholder עד שהמודול ייבנה                            | ניווט ל-`/deals/new` (מסלול קיים בעצי `deals`)    |
| `ActionFeed.svelte`        | re-use של `cards.svelte` במצב מצומצם                          | מטעין רק את ה-5 הראשונים                          |

### 3.3 רעיונות "לא מחייבים" – מיפוי לדאטה הקיים

| רעיון                    | מאיפה המידע                                                    | חישוב                                                                               |
| ------------------------ | -------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| כמה הצבעות שלא הגבתי     | `asks.vots` + `askms.vots` + `halukas.vots` + `decisions.vots` | פילטר: `vots.find(v => v.users_permissions_user.data.id === uid && v.what == null)` |
| הצבעה אדומה (פג תוקף)    | `asks.timegrama.date` או `attributes.deadline` / `sqadualed`   | `(deadline - now) < 24h` ⇒ אדום, `< 1h` ⇒ פעימה                                     |
| סיכום קניות + מה מתפתח   | `purchasesStore` + `salesStore` + `sheirutpStore`              | קבוצה אחת לפי `status`/`stage`                                                      |
| יצירת קניה מותאמת אישית  | CTA → `/deals/new` (מודול עתידי)                               | אין דאטה כרגע; ניצור route placeholder                                              |
| כמה הצעות אני יכול להגיש | `suggestionsStore.length` ב-snapshot                           | המספר עצמו נטען מהשאילתה הרזה                                                       |

---

## 4. ארכיטקטורת טעינה מהירה

### 4.1 שאילתה ראשונית רזה – `LevHubSummary`

יווצר qid חדש (לדוגמה `'85levHubSummary'`) שיחזיר **רק** ספירות וכותרות, ללא הודעות/פורומים/skills/work_ways/profilePic.formats:

```graphql
query LevHubSummary($idL: ID!) {
  usersPermissionsUser(id: $idL) {
    data {
      id
      attributes {
        username
        profilePic {
          data {
            attributes {
              url
            }
          }
        } # url בלבד, ללא formats
        hervachti
        # ספירות בלבד – אם Strapi לא תומך בספירה ישירה, להחזיר id+priority בלבד
        asks(filters: { archived: { eq: false } }) {
          data {
            id
            attributes {
              createdAt
              timegrama {
                data {
                  attributes {
                    date
                  }
                }
              }
              vots {
                what
                users_permissions_user {
                  data {
                    id
                  }
                }
              }
            }
          }
        }
        askms(filters: { archived: { eq: false } }) {
          data {
            id
            attributes {
              createdAt
              vots {
                what
                users_permissions_user {
                  data {
                    id
                  }
                }
              }
            }
          }
        }
        # ... וכן הלאה רק עם id + שדות לחישוב KPI
      }
    }
  }
}
```

**שינוי קונספטואלי**: השאילתה הרזה מחזירה את הרשימה המלאה של ה-ids + שדות-מפתח שצריך לחישוב KPI (deadline, מי כבר הצביע). הקומפוננטות עצמן (כרטיס בודד) מבקשות _את שאר הנתונים_ רק כשהן מוצגות.

### 4.2 SSR מטופלת ב-`+page.server.ts`

```ts
// src/routes/(reg)/hub/+page.server.ts
export const load: PageServerLoad = async ({ locals, fetch }) => {
  const summary = fetchHubSummary(locals.uid, locals.tok, locals.lang);
  return {
    streamed: { summary } // SvelteKit streamed promises
  };
};
```

בעמוד:

```svelte
{#await data.streamed.summary}
  <HubSkeleton />
{:then summary}
  <KpiBar {...summary.kpi} />
  <ActionFeed initial={summary.topFive} />
{/await}
```

יתרון: ה-HTML הראשון נשלח **מיד**, ה-KPI מופיע בתוך 200-400ms, וה-feed מופיע ברגע שה-promise נפתר – ללא חסימה.

### 4.3 מטמון Server-side (אופציונלי, שלב 2)

```
GET /api/hub/summary?uid=...
→ Redis/Memory cache: hub:{uid}:summary  TTL 30s
→ invalidation: כל notify מ-`NotificationOrchestrator` למשתמש זה מוחק את המפתח
```

זה ייתן <100ms בקריאה הראשונה אחרי שמישהו פתח את העמוד בתוך 30 שניות.

### 4.4 מטמון Client-side – snapshot **לא חוסם**

הקוד הקיים ב-`levDataLoader.ts` שומר ב-localStorage. הנוהל החדש:

- מציגים `KpiBar` מה-snapshot אם הוא ≤ 60 שניות ישן, **בלי** לחכות.
- במקביל `fetchHubSummary` מתעדכן ברקע ומחליף ערכים בעדינות (transition + `tick`).

### 4.5 קיבוץ קומפוננטות (code-splitting)

```svelte
const VoteSummaryCard = $lazy(() => import('$lib/components/lev/cards/hachlata.svelte'));
const SalesStream     = $lazy(() => import('$lib/components/hub/SalesStream.svelte'));
```

ב-Svelte ניתן להשיג זאת עם `{#await import('...') then Mod}<svelte:component this={Mod.default} ... />{/await}`. ה-Swiper הכבד **לא ייטען** אם המשתמש לא פתח את ה-ActionFeed.

---

## 5. מערכת ניתוב `/kind/[type]/[id]`

### 5.1 מבנה

```
src/routes/(regandnon)/kind/
├── +page.svelte                # רשימת קטגוריות זמינות
├── [type]/
│   ├── +page.server.ts         # load לפי type בלבד – רשימה מלאה לסוג זה
│   ├── +page.svelte            # רשימת הפריטים בסוג הזה
│   └── [id]/
│       ├── +page.server.ts     # load לפי type+id
│       └── +page.svelte        # תצוגה מלאה של פריט בודד
```

### 5.2 סוגים נתמכים (`type`)

| `type`       | מקור הנתונים                                  | קומפוננטה לתצוגה בודדת                                                                             |
| ------------ | --------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| `vote`       | asks/askms/halukas/decisions עם vot של ה-user | `decisionMaking.svelte` for decision making, or asks/askms/halukas for those from the cards folder |
| `mission`    | `pendsStore` / `mtahaStore`                   | `pandingMesima.svelte` / `missionInProgress.svelte`                                                |
| `suggestion` | `suggestionsStore`                            | `mashsuggest.svelte`                                                                               |
| `pmash`      | `pmashesStore`                                | `pmas.svelte`                                                                                      |
| `weget`      | `wegetsStore`                                 | `weget.svelte`                                                                                     |
| `haluka`     | `halukasStore`                                | `halukaask.svelte`                                                                                 |
| `sale`       | `salesStore` / `purchasesStore`               | `cards/SaleCard.svelte`                                                                            |
| `sheirutp`   | `sheirutpStore`                               | `ProductRequestCoin.svelte`                                                                        |
| `welcome`    | `welcomeStore`                                | `welcomTo.svelte`                                                                                  |
| `rikma`      | `projectsStore`                               | חדש – `RikmaJoinPage.svelte`                                                                       |

### 5.3 יתרונות

- **שיתוף קישור ישיר** – אפשר לשלוח push notification עם URL ל-`/kind/vote/123` ולפתוח את ההצבעה אצל המשתמש.
- **גמישות**: ה-Hub מקשר ל-`/kind/[type]`, אבל גם הצ'אט/הטלגרם/האימייל יכולים.
- **קריא ל-SEO** (לסוגים פתוחים) – ה-route תחת `(regandnon)`.

### 5.4 אבטחה

ה-`+page.server.ts` ב-`/kind/[type]/[id]/` יבדוק שייכות:

- אם ה-`type` הוא משאב פרטי – `locals.uid` חייב להופיע ב-`item.users_permissions_user` או ב-`item.project.user_1s`.
- אחרת – 403, אלא אם ה-type מסומן כפומבי (`rikma` הזמינה לכל).

---

## 6. Realtime + Unified Action System

### 6.1 שכבת ה-socket

ה-`socketClient` (`src/lib/stores/socketClient.ts`) כבר מספק `onNotification`. נשתמש בו דרך handler חדש:

```
src/lib/utils/hubSocketHandler.ts
└── setupHubSocketListeners(uid, lang)
    └── מאזין ל-actionKey ולוקח את updateStrategy
        ├── partialUpdate: dataKeys=['kpi.votes']  →  ++ to votes counter
        ├── partialUpdate: dataKeys=['feed']       →  re-fetch top 5
        ├── partialUpdate: dataKeys=['kind/vote/123']  →  invalidate route data
        └── fullRefresh:                            →  invalidate('/(reg)/hub')
```

### 6.2 שינוי קטן ב-`UpdateStrategy`

מומלץ להוסיף תמיכה ב-`scope` ב-`UpdateStrategyConfig` (`src/lib/server/actions/types.ts:244`):

```ts
export interface UpdateStrategyConfig {
  dataKeys?: string[];
  scope?: 'lev' | 'hub' | 'both';   // ← חדש
  routeHints?: string[];             // ← לרענון `invalidate(routeHint)` בלקוח
  ...
}
```

זה יאפשר ל-action server-side לאותת ספציפית ל-Hub.

### 6.3 הימנעות מ-thrashing של טיימרים

ב-Hub, ה-`KpiBar` **לא** מתעדכן על-פי tick של טיימר. רק קומפוננטת `<MissionInProgress>` בודדת ב-`/kind/mission/[id]` מאזינה לזרם הטיימרים.

---

## 7. המלצות לשיפור עמוד הלב **הקיים** (לפני/בלי המיגרציה)

חלוקה לרבדים – ניתן לבצע בהדרגה:

### 7.1 רבד מהיר (יום-יומיים)

1. **הסרת `console.log` מ-hot paths** – `levDerived.ts:388`, `cards.svelte:94,128,129,142,167,177,205,206,215,245,268,295,299,...`.
2. **Lazy import של Swiper** – לטעון רק כש-`cards === true`. כיום מתבצע `import Swiper from 'swiper/svelte'` בתוך `cards.svelte` ברמת ה-module, אך הקובץ עצמו נטען eagerly מ-`+page.svelte`.
3. **הסרת `console.log` מתוך פילטור** ב-`finalSwiperArray` (`levDerived.ts:388`). הוא רץ על _כל_ שינוי שמרכיב את הזרם.
4. **`pagination: { limit: 100 }` ל-messages** ב-`83levMainUserQuery` (qids.js:1983) – מיותר ב-load הראשוני. להוריד ל-20 או להעביר ל-lazy.

### 7.2 רבד בינוני (שבוע)

5. **לפצל את שאילתת ה-83** לשתי-שלוש שאילתות קטנות שירוצו במקביל (`Promise.all`):
   - `83a`: user + projects + counts (קל)
   - `83b`: votes/asks/askms/decisions (בינוני)
   - `83c`: sheirut/sales/purchases (בינוני)
     הראשונה מצוירת מיד, השאר מסונכרנים.
6. **הוצאת `profilePic.formats`** מ-`83` – שורה זו פר project/user מכפילה משקל. ה-`url` הראשוני מספיק; `formats` נטען רק כשפותחים כרטיס.
7. **ביטול ה-snapshot כשאין שינוי גרסה** – אם ה-`finalSwiperArray.length` לא השתנה ביחס ל-snapshot, לדלג על re-render.

### 7.3 רבד עמוק (שבועיים)

8. **SSR partial של עמוד הלב** עם streamed promises (כמו ב-Hub).
9. **Virtual scrolling** ב-`cards.svelte` במקום Swiper לכל הפריטים – Swiper מצייר את כל ה-slides בזיכרון.
10. **שדה `priority`/`pl` בשרת** – לעשות את ה-sort בשרת ולא בלקוח.

---

## 8. תכנית מימוש (Milestones)

| שלב                      | תוצרים                                                                                      | משך משוער         |
| ------------------------ | ------------------------------------------------------------------------------------------- | ----------------- |
| M1 – שלד                 | route `/(reg)/hub`, `+page.server.ts` עם `LevHubSummary` placeholder, KPI bar עם נתוני mock | 1-2 ימים          |
| M2 – שאילתה רזה          | qid `85levHubSummary` + integration ב-API send + KPI אמיתי                                  | 2 ימים            |
| M3 – Realtime            | `hubSocketHandler.ts` + שדות `scope/routeHints` ב-`UpdateStrategy`                          | 1 יום             |
| M4 – `/kind/[type]/[id]` | route generic + 3 types ראשונים: `vote`, `mission`, `sale`                                  | 3-4 ימים          |
| M5 – שאר ה-types ב-kind  | + audit אבטחה לכל type                                                                      | 2-3 ימים          |
| M6 – CTA לקנייה מותאמת   | placeholder + ניווט ל-`/deals/new`                                                          | חצי יום           |
| M7 – שיפורי לב הקיים     | פריטים 1-4 מסעיף 7.1                                                                        | 1-2 ימים (במקביל) |
| M8 – הפעלה הדרגתית       | feature flag (cookie/`localStorage`) שמעביר חלק מהמשתמשים מ-`/lev` ל-`/hub`                 | חצי יום           |

> סיכום: ~10-14 ימי עבודה לאיש פיתוח אחד עד הפעלה הדרגתית.

---

## 9. סיכונים והפחתות

| סיכון                                          | הפחתה                                                                                               |
| ---------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| כפילות מקור-אמת בין `levStores` ל-Hub stores   | להמשיך להשתמש _באותם_ `levStores`, רק לבחור ב-Hub איזה derived stores לטעון                         |
| Realtime פספוסים בעת מעבר עמוד                 | להעביר את ה-`socketClient.connect` ל-`+layout.svelte` (כבר שם) ולוודא שה-listeners נפרשים לפי ההקשר |
| URLs ל-`/kind/...` לא תקפים אחרי מחיקה         | redirect מנומס + הודעה                                                                              |
| Snapshot localStorage מתישן                    | TTL 5 דקות + invalidate על logout                                                                   |
| מיגרציה של קומפוננטות-כרטיס שמסתמכות על `arr1` | בכרטיס בודד לעטוף ב-adapter `toCardProps(item)` קצר                                                 |

---

## 10. שאלות פתוחות לדיון

1. האם להשאיר את `/lev` כברירת מחדל וה-Hub כ-opt-in (cookie/toggle), או להפוך את ה-Hub מיד לעמוד הבית של משתמשים מחוברים?
2. האם ה-`/kind/[type]/[id]` צריך להיות ציבורי (תחת `(regandnon)`) או רק למחוברים? – יוצע: hybrid לפי `type`.
3. עיצוב המודול "קניה מותאמת אישית" – האם להמשיך תחת `/deals/new` הקיים או route נפרד?
4. מה ה-threshold ל"הצבעה פגה תוקף = אדום"? 24h ברירת מחדל מוצעת – האם זה ה-UX הרצוי?

---

_נכתב לטובת תכנון. אין שינוי קוד עד אישור._
