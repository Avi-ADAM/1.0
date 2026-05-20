# תכנית קונסיירז' — ממשאלה למוצר אישי

> תכנית בלבד – בלי קוד. שמונה מטרות עוקבות, כל אחת חלוקה לשלבים, רגרסיה מוגנת ע"י feature flag.
> נכתב: 2026-05-18
> משלים את [PLAN_COMPLEX_PRODUCTS.md](./PLAN_COMPLEX_PRODUCTS.md) — לא מחליף.

---

## 0. רקע ותמונת מצב

### מה כבר קיים (וכמעט בלי שימוש)

| שכבה          | קובץ/ישות                                                                                                                 | מצב                                                                                                                                                                                                                                                                                                                                                                  |
| ------------- | ------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Strapi schema | `api::ratson.ratson`                                                                                                      | **קיים ועשיר**: `name`, `desc`, `longDes`, `logo`, `startDate`, `finnishDate`, `vallues`, `missions[]`, `mashaabims[]`, `matanots[]`, `categories[]`, `sub_category`, `language`, `lat/lng/radius`, `location_hint`, `age_group`, `frequency`, `isOnline`, `bounti`, `totalbounti`, `allowJoin`, `fulfilled`, `access_mode`, **`ai_meta` (JSON)**, **`pinecone_id`** |
| Mutation      | `5crratson` ב‑`src/routes/api/send/qids.js`                                                                               | קיים — יוצר Ratson בסיסי בלי AI                                                                                                                                                                                                                                                                                                                                      |
| Send wrapper  | `src/lib/func/send/crratson.svelte`                                                                                       | קיים — `module` script, קורא ל‑`sendToSer`                                                                                                                                                                                                                                                                                                                           |
| Form UI       | `src/lib/components/addnew/newIwant.svelte`                                                                               | קיים, רץ מ‑`foot.svelte` (גלובלי). פותח: שם, תיאור קצר, RichText ארוך, תמונה, daterange, allowJoin, vallues (MultiSelect), bounti+totalbounti. **לא מבקש missions/mashaabims** ו**לא מציע התאמות**.                                                                                                                                                                  |
| Reverse refs  | `Mission.ratsons`, `Mashaabim.ratsons`, `Vallue.ratsons`, `Category.ratsons`, `Matanot.ratsons`, `Sheirut.ratsons` (חלקי) | קיים בסכימה — אף קוד באתר לא משתמש בזה                                                                                                                                                                                                                                                                                                                               |

### המסקנה התכנונית

> זה לא feature חדש — זו **הפעלה** של פיצ׳ר ישן שהונח חצי‑דרך. ה‑schema, ה‑mutation והטופס היו שם. מה שחסר זה (1) AI extraction, (2) matching, (3) flow הצעות→מו"מ, (4) gateway למוצר מורכב.

### ההפרדה מ‑PLAN_COMPLEX_PRODUCTS

- **Complex Matanot** = "הצד שמייצר" — פרויקט מגדיר BOM מראש, מוכר.
- **Concierge / Ratson** = "הצד שצורך" — לקוח מתאר משאלה בחופשי, המערכת מאתרת או מרכיבה.
- שני המסלולים נפגשים ב‑M7: Ratson → `createComplexMatanot` אוטומטי שמחבר בין נכסים של פרויקטים שונים.

---

## 1. החלטה אדריכלית — מסלול נפרד /concierge

### למה לא חלק מ‑/deals?

- /deals = **tracking של commerce אקטיבי** (Sheirut, Sheirutpend, התקדמות BOM). הכניסה למסך = "כבר יש לי deal".
- /concierge = **discovery לפני commerce**. הכניסה = "אני לא יודע מה אני רוצה / לא מצאתי".
- שני מודלים מנטליים שונים, ערבוב פוגע בשניהם.

### למה לא subdomain נפרד?

- כל הישויות (Project, Mission, Mashaabim, User) חיות באותו Strapi. subdomain ידרוש או duplication של schema/auth או cross‑origin chatter.
- Concierge חייב לקרוא ולעדכן את אותם stores (`pendMisMes`, `lang`, `pageContext`) כמו /deals ו‑/moach.

### מה כן

- `src/routes/(reg)/concierge/+page.svelte` — רשימת המשאלות שלי + browse.
- `src/routes/(reg)/concierge/new/+page.svelte` — טופס משאלה (refactor של `newIwant.svelte`).
- `src/routes/(reg)/concierge/[id]/+page.svelte` — פרטי משאלה + matches + chat.
- `src/routes/(regandnon)/wish/[id]/+page.svelte` — תצוגה ציבורית (קריאה‑בלבד, ל‑share).
- `newIwant.svelte` הקיים ב‑footer **נשאר** כ‑modal entry‑point מהיר, אבל "השלב הבא" שלו מפנה ל‑`/concierge/[id]`.

### אינטגרציות חוצות

- **/deals**: tab חדש "From wishes" שמראה Sheirut‑ים שנפתחו מ‑Ratson (link דרך `sheirut.ratsons`).
- **/moach/[projectId]**: סקציה "Incoming wishes" — Ratsons שהפרויקט הזה מועמד לספק.
- **Footer chat**: כל מטץ' פותח forum mapping על Ratson↔Matanot/Project.
- **Lev**: יומן `/lev/wishes` — משאלות פעילות, פגות תוקף.

---

## 2. שינויי Strapi (Schema additions)

### 2.1 `api::ratson.ratson` — שדות חדשים

| שדה                     | סוג                                                                                                                                       | תיאור                                                                                |
| ----------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| `status_ratson`         | enum `['draft','open','matching','negotiating','fulfilled','expired','cancelled']`                                                        | מצב המשאלה                                                                           |
| `extracted_missions`    | Component repeatable `{ name, hoursEst, importance: enum['must','nice'], notes , missions: relation extracted_mission has many Missions}` | משימות שה‑AI חילץ מ‑longDes (לפני שהן מתורגמות ל‑Mission entities)                   |
| `extracted_resources`   | Component repeatable`{ name, kindOf, quantityEst, importance, notes, mashaabims: relation extracted_mashaabim has many Mashaabim }`       | משאבים שה‑AI חילץ                                                                    |
| `derivedComplexMatanot` | oneToOne →`matanot`                                                                                                                       | המוצר המורכב שנוצר אוטומטית מהמשאלה (M7+)                                            |
| `fulfillment_score`     | Decimal 0..1                                                                                                                              | cache של ההתאמה הטובה ביותר                                                          |
| `last_matched_at`       | DateTime                                                                                                                                  | מתי הורץ matching אחרון                                                              |
| `chat_forum`            | oneToOne →`chat`                                                                                                                          | פורום ראשי של המשאלה (דיון עם המציעים)                                               |
| `process`               | oneToOne →`partof`                                                                                                                        | עוגן process — מאפשר`attachEntityToProcess('ratson',…)` ופותח mapping forums פר‑הצעה |

### 2.2 ישות חדשה: `api::ratson-proposal.ratson-proposal`

הצעת מענה למשאלה. כל פרויקט/חבר שמציע פתרון = רשומה אחת.

| שדה                 | סוג                                                                     |
| ------------------- | ----------------------------------------------------------------------- | -------------------------------------- |
| `ratson`            | manyToOne → ratson                                                      |
| `proposer_user`     | manyToOne → users_permissions_user                                      |
| `proposer_project`  | manyToOne → project (אופציונלי)                                         |
| `kind`              | enum `['existing_matanot','existing_project','custom_offer','partial']` |
| `matanot`           | manyToOne → matanot (אם kind=existing_matanot)                          |
| `covered_missions`  | Component repeatable `{ extracted_mission_idx, hours, price }`          |
| `covered_resources` | Component repeatable `{ extracted_resource_idx, quantity, price }`      |
| `total_price`       | Decimal                                                                 |
| `currency`          | Relation → matbea                                                       |
| `nego`              | manyToOne → nego (אופציונלי — מקרי מו"מ)                                |
| `forum`             | oneToOne → chat (mapping forum פר‑הצעה)                                 |
| `status_proposal`   | enum `['suggested','viewed','accepted','rejected','expired']`           |
| `match_score`       | Decimal 0..1                                                            | התאמה ע"י AI/vector                    |
| `auto_generated`    | Boolean                                                                 | true אם המערכת הציעה, false אם ספק יזם |

### 2.3 ישות חדשה: `api::ratson-match-job.ratson-match-job`

job log לריצות ה‑matching (להבדל בין ידני, מתוזמן, AI‑מלא).

| שדה                          | סוג                                   |
| ---------------------------- | ------------------------------------- |
| `ratson`                     | manyToOne → ratson                    |
| `started_at` / `finished_at` | DateTime                              |
| `mode`                       | enum `['keyword','vector','ai_full']` |
| `proposals_created`          | Integer                               |
| `error`                      | Text                                  |

> ה‑Job עצמו לא מחזיק את ההצעות — רק metadata. ההצעות חיות ב‑`ratson-proposal`.

### 2.4 הרחבת ישויות קיימות

- `api::sheirut.sheirut`: כבר יש `ratsons` (קולקציה). להוסיף **`source_proposal` manyToOne → ratson-proposal** — כדי שנדע איזו הצעה הולידה את ה‑Sheirut.
- `api::matanot.matanot`: כבר יש `ratsons`. שדה חדש **`fulfills_ratsons` manyToMany → ratson** (סמנטי: "המוצר הזה הוצע פעם כתשובה למשאלות אלה" — לסטטיסטיקה).
- `api::nego.nego`: להוסיף **`ratson_proposal` manyToOne → ratson-proposal** — מו"מ ספציפי על הצעה.

### 2.5 QIDs חדשים ב‑`src/routes/api/send/qids.js`

- `100updateRatson` — עדכון משאלה קיימת (extracted\_\*, status, fields).
- `101createRatsonProposal`
- `102updateRatsonProposal`
- `103acceptRatsonProposal` — מעדכן status + יוצר Sheirut/Sheirutpend.
- `104rejectRatsonProposal`
- `105queryRatsonWithProposals` — שליפה מלאה (משאלה + הצעות + extracted + chat).
- `106listMyRatsons` — משאלות של משתמש.
- `107listRatsonsForProject` — משאלות שפרויקט מועמד לספק.
- `108createRatsonMatchJob`
- `109listOpenRatsons` — public browse (`access_mode='public'`).

---

## 3. Server Action Configs חדשים

תחת `src/lib/server/actions/configs/`:

1. **`createRatson.ts`** — מחליף את ה‑mutation הישירה מ‑`crratson.svelte`. יוצר Ratson + chat_forum + process (`createProcess` הקיים) + מתזמן `analyzeRatson` (אם בחר 'AI on').
2. **`updateRatson.ts`** — עריכת שדות בסיסיים.
3. **`analyzeRatson.ts`** (job/action) — קורא ל‑LLM (Claude / OpenAI), מחלץ `extracted_missions[]` ו‑`extracted_resources[]`, מעדכן `ai_meta`, יוצר embedding ושומר ב‑`pinecone_id`. אסינכרוני.
4. **`matchRatson.ts`** — מריץ matching:
   - שלב keyword (categories, vallues, sub_category).
   - שלב vector (pinecone) על `longDes`.
   - שלב AI semantic על extracted\_\*.
   - יוצר `ratson-proposal` רשומות (auto_generated=true).
   - כותב `ratson-match-job` log.
5. **`createRatsonProposal.ts`** — ספק יוזם הצעה (כפתור "אני יכול לעזור" מ‑/concierge/[id] הציבורי).
6. **`acceptRatsonProposal.ts`** — `status='accepted'`. אם kind=existing_matanot → קורא `createSheirutpend` הקיים. אם kind=custom_offer → קורא `createComplexMatanot` (PLAN_COMPLEX_PRODUCTS §2.1) עם ה‑BOM מ‑`covered_missions/resources`. מעדכן `ratson.status='negotiating'` או `'fulfilled'`.
7. **`rejectRatsonProposal.ts`** — סטטוס + הודעה אופציונלית.
8. **`createRatsonNego.ts`** — wrapper דק על `createNego` שמקשר ל‑`ratson_proposal`.
9. **`closeRatson.ts`** — fulfilled / cancelled / expired.

> כל ה‑actions עוברים דרך `/api/action` ‑ unified. זה מה שמאפשר ל‑MCP/agent להריץ אותם בלי UI.

---

## 4. רכיבי UI חדשים

תחת `src/lib/components/concierge/`:

| רכיב                          | תפקיד                                                                        |
| ----------------------------- | ---------------------------------------------------------------------------- |
| `WishForm.svelte`             | refactor של `newIwant.svelte`. מודולרי, מקבל `mode: 'modal'\|'page'`.        |
| `WishCard.svelte`             | תצוגה קומפקטית (רשימה)                                                       |
| `WishDetail.svelte`           | תצוגה מלאה — longDes, extracted lists (collapsible), proposals, chat         |
| `WishExtractionView.svelte`   | מציג את מה ש‑AI חילץ; כפתורי "approve"/"edit"/"reject" לכל extracted item    |
| `ProposalCard.svelte`         | הצעה בודדת — score, מי הציע, איזה matanot/project, מחיר, פעולות              |
| `ProposalList.svelte`         | רשימת הצעות ממוין לפי score                                                  |
| `MatchScoreBar.svelte`        | פסיכי קטן 0..100%                                                            |
| `OfferHelp.svelte`            | מ‑side של ספק — "אני יכול לעזור": בוחר משימות/משאבים שלו או מוצר קיים, מציע. |
| `ConciergeChat.svelte`        | wrapper על `ChatSmall` הקיים, פותח את ה‑chat_forum הראשי                     |
| `WishStatusBadge.svelte`      | תגית סטטוס                                                                   |
| `WishComposeAuto.svelte` (M7) | מציג את ה‑complex matanot שנוצר אוטומטית מהמשאלה + אפשרות עריכה              |

ב‑`src/lib/components/lev/`:

- `MyWishes.svelte` — קומפוננטה למסך lev, רשימת משאלות פתוחות + alerts על הצעות חדשות.

ב‑`src/lib/components/moach/`:

- `IncomingWishes.svelte` — Ratsons שמועמדים לפרויקט; כפתור "Propose".

---

## 5. Milestones (סדר מומלץ)

| #    | מילסטון                                                                                                                                                                                                               | תוצר                                         | flag                                                         |
| ---- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------- | ------------------------------------------------------------ |
| M0   | Audit + restore: `newIwant.svelte` עובר ל‑`createRatson` action. תיקון `page.data.tok` החסר, שגיאת `axios` import.                                                                                                    | טופס משאלה עובד מקצה לקצה כמו פעם.           | –                                                            |
| M1   | Schema migration: `status_ratson`, `extracted_*`, `chat_forum`, `process`, `derivedComplexMatanot`. ישויות חדשות: `ratson-proposal`, `ratson-match-job`. QIDs 100–109.                                                | Strapi rebuild + types regen.                | –                                                            |
| M2   | `/concierge` hub: רשימה של "המשאלות שלי" + browse public. `/concierge/[id]` view.                                                                                                                                     | משתמש רואה היסטוריה, לא רק יוצר.             | `concierge.hub=on`                                           |
| M3   | Matching ידני בסיסי (keyword בלבד — `categories`, `vallues`, `sub_category`). `matchRatson(mode='keyword')`. ProposalList קריאה‑בלבד.                                                                                 | משאלה חדשה מציגה הצעות keyword.              | `concierge.matchBasic=on`                                    |
| M4   | **OfferHelp** — ספקים יכולים לראות משאלות פתוחות מ‑`/moach/[projectId]` ולהציע מתוך מוצריהם הקיימים. `createRatsonProposal`.                                                                                          | ספקים יוזמים.                                | `concierge.providerOffer=on`                                 |
| M5   | Chat + accept/reject. כל הצעה פותחת mapping forum. `acceptRatsonProposal` → `createSheirutpend`.                                                                                                                      | המסלול המלא ל‑existing_matanot עובד.         | `concierge.acceptFlow=on`                                    |
| M6   | **AI extraction**: `analyzeRatson` — מחלץ `extracted_missions/resources` מ‑longDes. `WishExtractionView` עם human‑in‑the‑loop (approve/edit).                                                                         | משאלה הופכת למפרט מובנה.                     | `concierge.aiExtract=on`                                     |
| M6.5 | **Vector matching**: embed → Pinecone → `matchRatson(mode='vector')`. ranking משולב.                                                                                                                                  | התאמה איכותית גם בלי קטגוריות.               | `concierge.vectorMatch=on`                                   |
| M7   | **Auto‑compose**: `acceptRatsonProposal(kind='custom_offer')` קורא `createComplexMatanot` (PLAN*COMPLEX_PRODUCTS §2.1) עם BOM שנגזר מ‑extracted*\*. `WishComposeAuto.svelte` מציג את התוצאה לעריכת המשתמש לפני שליחה. | משאלה חופשית → מוצר מורכב חי, חוצה פרויקטים. | `concierge.autoCompose=on` תלוי `complexProducts.compose=on` |
| M8   | **Multi‑provider stitching**: הצעה אחת יכולה להיות "compound" — חלק מ‑provider A, חלק מ‑provider B. UI מציג כעגלת fulfillment, ההסכמה מפצלת ל‑Sheirutpend‑ים מקבילים.                                                 | קונסיירז' אמיתי שמרכיב בין מספר פרויקטים.    | `concierge.multiProvider=on`                                 |
| M9   | **Agent בצ׳אט**: MCP tools ‑ `createWishTool`, `analyzeWishTool`, `findMatchesTool`, `proposeCompoundOfferTool`, `acceptProposalTool`. שיחה מנחה: "ספר לי מה אתה רוצה" → analyze → suggest → compose.                 | קונסיירז' אוטונומי בצ׳אט.                    | `concierge.agent=on`                                         |

> M0–M5 הם **מסלול ללא AI** — אפשר להעלות לפרודקשן עוד לפני שמשלמים על LLM/Pinecone. M6+ דורש תשתית AI.

---

## 6. אלגוריתם Matching (M3 → M6.5)

### 6.1 שלב Keyword (M3)

```
score = w1·jaccard(ratson.vallues, project.vallues)
      + w2·jaccard(ratson.categories, project.categories)
      + w3·(ratson.sub_category == matanot.sub_category ? 1 : 0)
      + w4·proximity(ratson.lat/lng, project.lat/lng, ratson.radius)
      + w5·(ratson.language matches matanot.language ? 1 : 0)
threshold: 0.25 → יצירת Proposal
```

### 6.2 שלב Vector (M6.5)

- embed `longDes` ב‑`text-embedding-3-small` (או ada-002).
- `pinecone.upsert(id=pinecone_id, vec=embed, metadata={kind:'ratson'})`.
- בכל מוצר חדש — embed `name+desc+longDes` עם `metadata={kind:'matanot'}`.
- match: `pinecone.query(vec=ratson.embed, filter={kind:'matanot'}, top_k=20)`.
- score משולב: `0.4·keyword + 0.6·cosine`.

### 6.3 שלב AI Full (M7+)

LLM מקבל את ה‑extracted\_\* של המשאלה + top‑20 candidates ומחזיר:

- ranked proposals
- אופציה "compound": איזה חלקים לקחת מאיזה candidate
- חלקים חסרים → המלצה ל‑custom_offer + BOM גנרי

---

## 7. AI Extraction (M6) — מבנה הקריאה

```
SYSTEM: אתה עוזר שמפרק משאלה לתשתית 1lev1.
        חלץ:
        1. extracted_missions[]: כל "פעולה" (לדוגמה: 'לתפור שמלה', 'להוביל את הציוד')
        2. extracted_resources[]: כל "חפץ/חומר" (לדוגמה: 'בד אורגני', 'משאית')
        כל פריט: name, importance (must/nice), hoursEst/quantityEst (אם משתמע)
USER:   longDes של המשאלה
```

תוצאה נכנסת ל‑`ratson.ai_meta.extraction_raw` (JSON) ול‑components מובנים `extracted_*` שניתנים לעריכה ידנית.

> חשוב: לפני שיוצרים Mission/Mashaabim אמיתיים מה‑extracted, המשתמש מאשר. זה ה‑gateway לכל מה שאחרי, וזה גם מונע hallucination שזורם לסכימה.

---

## 8. תרחיש End‑to‑End לדוגמה (אחרי M7)

> משתמש כותב: "אני רוצה לארגן יום חופש לאמא שלי — טיפול ספא, ארוחה, בייביסיטר לילדים, מישהי שתעזור לה להגיע."

1. M0/M1: `createRatson` → status='draft' → chat_forum + process נוצרים.
2. M6: `analyzeRatson` רץ ⇒ `extracted_missions = [{name:'בייביסיטר', hoursEst:6, must}, {name:'הסעה', hoursEst:1, must}, {name:'טיפול ספא', hoursEst:2, must}]`, `extracted_resources = [{name:'ארוחה במסעדה', quantity:2, nice}]`.
3. WishExtractionView — המשתמשת רואה ועורכת.
4. M6.5: `matchRatson(vector+ai_full)` ⇒ מוצא:
   - מוצר קיים בפרויקט "ספא טבע": טיפול ספא 2 שעות (score 0.91).
   - חברה בפרויקט "אמהות עוזרות זו לזו" עם פנאי לבייביסיטר (score 0.78).
   - פרויקט הסעות "Lift" עם נהג זמין (score 0.72).
5. M8 (compound): המערכת מציעה proposal יחיד שמרכיב מה‑3, מציגה total + פיצול.
6. המשתמשת מאשרת ⇒ `acceptRatsonProposal(kind='compound')`:
   - יוצר Matanot מורכב חדש "יום אמא" (PLAN_COMPLEX_PRODUCTS §2.1) עם BOM 3‑שורות.
   - 3 Sheirutpend‑ים מקבילים נפתחים מול 3 הפרויקטים.
   - chat_forum הופך לדיון בין כל הצדדים.
7. /deals/[id] מציג את כל זה כ‑deal יחיד עם 3 sub‑fulfillments.

---

## 9. סיכונים ועניינים פתוחים

1. **LLM hallucination** — extraction יכול להמציא משימות שאין. **פתרון**: human‑in‑the‑loop חובה (M6 — `WishExtractionView`), חתימה דיגיטלית של המשתמש לפני matchRatson.
2. **Spam של הצעות** — ספקים יכולים להציף משאלה. **פתרון**: rate‑limit ב‑`createRatsonProposal` (3 ביום פר‑user, configurable פר‑project), `proposer_user.reputation_score`.
3. **פרטיות משאלות** — חלק רוצים שיתפרסם, חלק רק לחברים. **פתרון**: `access_mode` כבר קיים ב‑schema. ערכים: `private`, `project_only`, `friends`, `public`. `/wish/[id]` הציבורי בודק לפני render.
4. **עלויות AI** — `analyzeRatson` ו‑embed לכל משאלה. **פתרון**: M6 opt‑in (`useAI: boolean` ב‑form), cache embeddings, debounce match jobs (max 1 בשעה פר‑ratson).
5. **Sync של multi‑provider deals** — אם provider A מתחיל ו‑provider B מתעכב, ה‑deal "נתקע". **פתרון**: M8 — sheirut‑fulfillment.status='partial' + תזכורות אוטומטיות, אופציה לפיצול לדילים נפרדים.
6. **תאימות אחורה ל‑Ratson קיים** — אם כבר יש Ratsons ב‑DB (לבדוק) הם יקבלו `status_ratson='draft'`, `extracted_missions=[]`. ה‑UI החדש יעבוד עליהם אבל בלי AI features.
7. **i18n** — Hebrew/English לכל strings החדשים, ב‑`src/lib/translations/` (יש כבר תשתית).

---

## 10. קבצים שייגעו (best estimate)

### חדשים — Server

- `src/lib/server/actions/configs/createRatson.ts`
- `src/lib/server/actions/configs/updateRatson.ts`
- `src/lib/server/actions/configs/analyzeRatson.ts`
- `src/lib/server/actions/configs/matchRatson.ts`
- `src/lib/server/actions/configs/createRatsonProposal.ts`
- `src/lib/server/actions/configs/acceptRatsonProposal.ts`
- `src/lib/server/actions/configs/rejectRatsonProposal.ts`
- `src/lib/server/actions/configs/createRatsonNego.ts`
- `src/lib/server/actions/configs/closeRatson.ts`
- `src/lib/services/conciergeService.ts` (browser‑side fetch helpers)
- `src/lib/server/ai/extractWish.ts` (LLM prompt + parser)
- `src/lib/server/ai/embedWish.ts` (Pinecone client wrapper)

### חדשים — Routes

- `src/routes/(reg)/concierge/+page.svelte` + `+page.server.ts`
- `src/routes/(reg)/concierge/new/+page.svelte`
- `src/routes/(reg)/concierge/[id]/+page.svelte` + `+page.server.ts`
- `src/routes/(regandnon)/wish/[id]/+page.svelte` + `+page.server.ts` (public)

### חדשים — Components

- `src/lib/components/concierge/WishForm.svelte`
- `src/lib/components/concierge/WishCard.svelte`
- `src/lib/components/concierge/WishDetail.svelte`
- `src/lib/components/concierge/WishExtractionView.svelte`
- `src/lib/components/concierge/ProposalCard.svelte`
- `src/lib/components/concierge/ProposalList.svelte`
- `src/lib/components/concierge/MatchScoreBar.svelte`
- `src/lib/components/concierge/OfferHelp.svelte`
- `src/lib/components/concierge/ConciergeChat.svelte`
- `src/lib/components/concierge/WishStatusBadge.svelte`
- `src/lib/components/concierge/WishComposeAuto.svelte` (M7)
- `src/lib/components/lev/MyWishes.svelte`
- `src/lib/components/moach/IncomingWishes.svelte`

### עריכה

- `src/lib/components/addnew/newIwant.svelte` — מעבר ל‑`createRatson` action במקום `crratson.svelte`. מבטל את הקריאה הישירה ל‑axios upload, משתמש ב‑service. שילוב `WishForm.svelte`.
- `src/lib/func/send/crratson.svelte` — **deprecate**. שומרים ל‑backward compat עד M2 ואז מוחקים.
- `src/routes/api/send/qids.js` — QIDs 100–109 + הסרת `5crratson` ב‑M5 (אחרי שכל המקומות עברו).
- `src/lib/server/actions/configs/index.ts` — registration של 9 ה‑actions.
- `src/lib/components/footer/foot.svelte` — wire `newIwant` modal לסטטוס auth + הפניה ל‑`/concierge/[id]` בסיום.
- `src/lib/translations/he.ts` / `en.ts` — strings.
- `src/lib/types/index.ts` — `Ratson`, `RatsonProposal`, `WishExtraction` types.

### חדשים — MCP (M9)

- `src/lib/mcp/tools/createWishTool.ts`
- `src/lib/mcp/tools/analyzeWishTool.ts`
- `src/lib/mcp/tools/findMatchesTool.ts`
- `src/lib/mcp/tools/proposeCompoundOfferTool.ts`
- `src/lib/mcp/tools/acceptProposalTool.ts`

---

## 11. הערות הטמעה גלובליות

- **Stateless components**: כל הרכיבים תחת `src/lib/components/concierge/` חייבים להיות stateless logic‑wise. כל side‑effect דרך `/api/action`.
- **אין GraphQL mutations ב‑svelte**: כל הזרימות עוברות דרך unified actions — זה מה שמאפשר M9 (agent בצ׳אט) ב‑zero‑cost.
- **process wrapping**: כל Ratson מקבל `partof` משלו דרך `createProcess`. זה נותן לנו mainForum + יכולת `attachEntityToProcess` לכל proposal.
- **chat_forum הוא הלב**: התקשורת בין המבקש לכל ספק קורית שם. אין מסך נפרד למו"מ — הכל בצ׳אט, עם הקשרים (`spesificm`) פר‑הצעה.
- **MyWishes ב‑lev** מהווה גם counterparty notifications: רואה התראות על הצעות חדשות בלי לפתוח את /concierge.
- **Test coverage**: כל action חדש = unit + integration. matching = snapshot tests עם seed Ratsons.
- **Migration ל‑Ratsons קיימים**: backfill ב‑M1 — `UPDATE ratsons SET status_ratson = CASE WHEN fulfilled THEN 'fulfilled' ELSE 'open' END`.
