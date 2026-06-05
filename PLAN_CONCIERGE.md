# תכנית קונסיירז' — ממשאלה למוצר אישי

> תכנית בלבד – בלי קוד. שמונה מטרות עוקבות, כל אחת חלוקה לשלבים, רגרסיה מוגנת ע"י feature flag.
> נכתב: 2026-05-18 · **עודכן: 2026-06-05** (סנכרון מול הקוד בפועל + הבנת הפלאו הנוכחית).
> משלים את [PLAN_COMPLEX_PRODUCTS.md](./PLAN_COMPLEX_PRODUCTS.md) — לא מחליף.

---

## ★ סטטוס נוכחי (2026-06-05) — מה בנוי בפועל מול התכנית

> סעיף זה נכתב אחרי מעבר על הקוד. הוא **גובר** על עמודת ה-flag/סטטוס בטבלת המיילסטונים (§5),
> שנכתבה כתחזית. הרבה מ-M0–M6.5 כבר עומד; השמות בפועל סטו מהתכנית המקורית.

### בנוי ועובד ✅

| שכבה                      | מה קיים בפועל                                                                                                                                                                                                                                                      | הערה מול התכנית                                                                                                                |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------ |
| **Routes**                | `/concierge` (hub: "שלי" + browse), `/concierge/new`, `/concierge/[id]`, `/wish/[id]` (ציבורי)                                                                                                                                                                     | כמתוכנן (§1). ה-hub מציג כרטיסי משאלה עם % כיסוי, מס' הצעות, סטטוס.                                                            |
| **שלב 1 — כתיבה + AI חי** | `/concierge/new`: RichText חופשי, חילוץ **חי** (debounce 1.2s) דרך `POST /api/concierge-extract` → משימות/משאבים/כישורים/קטגוריות + matches (אנשים/משאבים פנויים/משימות קיימות). "תכשיטי" פרטים מעשיים (מתי/היכן/תקציב/מי-מציע/מי-רואה/הזמנת-שותפים/יוזמה-משותפת). | מקדים את M6 — החילוץ קורה **תוך כדי כתיבה**, לא כ-job אחרי יצירה.                                                              |
| **שלב 2 — מסך גיבוש**     | `/concierge/[id]`: `PLAN_ROWS` (שורה לכל משימה/משאב) + ספקים ממוינים + עריכת פירוק inline (הוסף/הסר/חובה↔רצוי) דרך `updateRatsonExtraction` + "טוטאל"/כיסוי + harmony ring + כרוניקה.                                                                              | מימוש ה"מסך עריכה וגיבוש תכנית" שתיארת.                                                                                        |
| **הצמדה לקיים**           | enrichment גרાונדד מה-DB: אנשים לפי כישורים, משאבים פנויים (Sp), מוצרים מוכנים. נשמר ב-`ai_meta.enrichment` ונקרא ב-`/[id]` בלי לחשב מחדש.                                                                                                                         | תואם [[concierge-enrichment-persistence]].                                                                                     |
| **בקשה מספק / "הזמיני"**  | אדם → `requestWishMission`, משאב → `requestWishResource`, מוצר מוכן → `requestSuggestion` (Track service-request). הלקוח **מחבר את ההצעה** דרך `mission.svelte`/`ResourceCreator.svelte` ב-`specMode`.                                                             | מימוש מתוקן של §5.3 (הלקוח יוצר, לא הספק).                                                                                     |
| **binding למוצר מורכב**   | `requestWishMission` יוצר draft `derivedComplexMatanot` (qid 139) + `pendm` חסר-ריקמה (137) + שורת BOM לא-מוקצית (125) + proposal (101). הספק מאשר השמה ב-`acceptWishOffer` (143/144 assign + 112 willingness).                                                    | פאזת ההרכבה של §5.3 — בנויה.                                                                                                   |
| **שער הסכמה (לקוחה)**     | `acceptRatsonProposal` / `rejectRatsonProposal` בכרטיסי ההצעה.                                                                                                                                                                                                     | M5 (חלקי — ראה פערים).                                                                                                         |
| **Surfacing לנמען**       | `/deals` טאבים "בקשות ממתינות" (Track A) + "משאלות אלייך" (Track B, `IncomingWishCard`); `/moach/[projectId]/wishes` (qid 107).                                                                                                                                    | תואם §5.2. אובייקט-לב (`ani:wishInvite`) **דולג** ל-MVP.                                                                       |
| **Matching**              | `matchRatson(mode='keyword')` נורה אוטומטית אחרי פרסום.                                                                                                                                                                                                            | M3 בנוי; vector/ai_full כ-enum בלבד (החילוץ החי כבר משתמש ב-Gemini/Pinecone).                                                  |
| **Schema**                | כל שדות §2.1 קיימים + הרחבת **shared-purchase** (`joinKind`/`minJoiners`/`maxJoiners`/`joinDeadline`). ישויות `ratson-proposal` (+ `ratson_willingness_entry`, `covered_missions/resources`) ו-`ratson-match-job`.                                                 | תואם [[shared-purchase-status]]. `access_mode` בפועל: `personal`/`free_threshold`/`pay_to_access` (לא private/friends/public). |

### Actions בפועל (גובר על §3 ו-§5.3)

רשומים ב-`src/lib/server/actions/configs/index.ts`:
`createRatson` · `matchRatson` · `acceptRatsonProposal` · `rejectRatsonProposal` ·
`updateRatsonExtraction` · `requestSuggestion` · `requestWishMission` · `requestWishResource` ·
`acceptWishOffer` · `declineWishOffer`.

> שמות התכנית המקוריים (`analyzeRatson`, `createRatsonProposal` כ-action, `closeRatson`,
> `createRatsonNego`) **לא** מומשו כ-action נפרד — הוחלפו/אוחדו ע"י הרשימה לעיל.
> QIDs בפועל: 100,101,102,105,106,107,108,109,111,112,125,137,139,143,144 (+ legacy `5crratson`).

### פערים מול הפלאו שאתה מתאר עכשיו ❌ / ◑

1. **מו"מ (negotiation)** ❌ — `negoM.svelte`/`negoPend.svelte` **טרם יובאו**. ב-`AcceptWishOffer.svelte` כפתור המו"מ הוא placeholder ("מו״מ — בקרוב"). זה ה-import-and-adapt שאתה מבקש.
2. **פרסום לקהילה דרך כרטיסי הלב** ◑ (נבנה 2026-06-05, צד-משימה) — **לא** אובייקט-לב חדש: שימוש חוזר ב-`open-mission`/`open-mashaabim` (שמרונדרים כבר כ-[sugestmi](src/lib/components/lev/cards/sugestmi.svelte)/[sugestma](src/lib/components/lev/cards/sugestma.svelte)). פעולה `publishWishNeedToCommunity` יוצרת open-mission **חסר-פרויקט** מקושר ל-`ratson` (+`source` בסכמה) עם הכישורים שחולצו → צף דרך מנוע ההתאמה הקיים (skills→open_missions). מיתוג "קונסירג'" (לוגו `/logo-concierge.png`) דרך `processSuggestions` כשיש `ratson`. כפתור "📣 פרסמי לקהילה" לכל משימה ב-`/[id]`. qids 169/170/172 + `source`/`ratson` ב-q84. **חסר:** צד-משאב לא צף עדיין (צריך קישור `mashaabim` template כדי להתאים ל-Sp) ולא ממותג; ולולאת "מתנדב מהלב → השמה לשורת BOM".
3. **רוויזיית AI עם טקסט חופשי** ◑ — עריכת הפירוק ידנית (הוסף/הסר/חובה↔רצוי) קיימת; "בקשת רוויזיה מה-AI עם כל המידע שנצבר + בקשה טקסטואלית" **לא** (יש רק חילוץ ראשוני חי).
4. **רשימת ספקים מלאה לכל משימה/משאב** ◑ — כיום: אנשים לפי כישורים + משאבים-פנויים לפי Sp + מוצרים מוכנים. **חסר:** "משתמשים שביצעו את המשימה" ו"קישור-טמפלט בפרופיל" כמקורות גראונדינג; קישור-אוטומטי-לטמפלט + "יצירת טמפלט בשם בלבד" בשלב 1.
5. **הערכת עלות בלי ספק** ◑ — `requestWishMission` כן יוצר pendm/recipe (→ עלות), אבל קשור להזמנת ספק ספציפי; "pend להערכה בלבד, גם בלי הצעת ספק" עדיין לא מסלול עצמאי.
6. **Materialize — יצירת ריקמת השותפים** ✅ (נבנה 2026-06-05) — פעולה `materializeWish` + כפתור "סגרי את ההסכמה" חי ב-`/[id]`. כשכל שורות ה-BOM משובצות (ספקים אישרו), הלקוחה סוגרת → נוצרת **ריקמה ייעודית** (`166crWishWeave`: הספקים=חברים, הלקוחה=לקוחה/לא-חברה), המוצר המורכב מתארח עליה (`167hostWishMatanot`), כל `pendm.rishon`/`pmash.selfProposalUser` נקשר לספק, ואז `createSheirutFromPending` הקיים מייצר Sheirut + מפעיל BOM (mesimabetahalich/maap) → `/deals`. readiness נאכף בשרת. `ratson.status='fulfilled'`. (qids: 166/167/168 + הרחבת q72 ב-`pendm.rishon`.)
   - **עריכה מלאה ללקוח** ✅ — `requestWishMission`/`requestWishResource` מקבלים כעת `targetUserId` **אופציונלי**: בלי יעד נוצרת שורת BOM לא-משובצת (להערכת עלות / שיבוץ בהמשך). כפתורי "➕ הוסיפי משימה / ◐ הגדירי משאב" ב-`/[id]` פותחים `mission.svelte`/`ResourceCreator` ב-specMode.
7. **ניהול מהמסך + שלב אחרי-סיום** ❌ — ניהול ע"י הספקים מהמשאלה, וההצעה לספקים בסיום (לארכב את הריקמה אחרי חלוקת כסף / להמשיך ולפרסם את המוצר המורכב ולשתף פעולה ללקוחות נוספים) — עתידי, לא בנוי.

---

## 0.1. הפלאו המעודכן (כפי שמובן עכשיו) — מקור אמת

> תיאור זה גובר על §8 (התרחיש המקורי). שני שלבים + שער + פאזת ייצור.

**שלב 1 — ניסוח וחילוץ ראשוני.** המשתמש כותב משימה במילותיו. ה-AI מפרק ל-**משימות**, **משאבים** ו-**מוצרים** ראשוניים:

- **מוצרים = מתנות** — מוצגים **רק** אם יש התאמה למשהו שפרויקט כבר יצר.
- **משימות ומשאבים** — מנסים להיצמד לטמפלט קיים (משימה) או ל-Sp שמישהו פרסם (משאב). אם לא נמצא — המערכת **מציעה יצירת טמפלט בשלב הראשוני, בשם בלבד**.

**שלב 2 — מסך גיבוש תכנית.** רואים את כל המשימות/המוצרים/המשאבים שאותרו:

- אם יש טמפלט → קישור לטמפלט. אם המוצר קיים → כפתור **"הזמן מוצר"** מיידי.
- לכל משימה/משאב (עם טמפלט או בלי) → **רשימת ספקים** שיכולים לתת אותה: מי שביצע את המשימה / מי שרשום בפרופיל עם קישור-לטמפלט-זה / דרך כישורים-תפקידים. למשאב — רק דרך Sp.
- אפשרות ליצור **openMision משימה מיוחד** (כמו בקשה לספק) גם למשימות בלי הצעת-ספק — לצורך **הערכת עלות** ("כמה תעלה ההרפתקה").
- אם אין ספקים → "פרסם משימות/משאבים" והמערכת תציע אותם לקהילה ב-**מסך הלב** (כרטיסי `sugestmi`/`sugestma` במאפיינים מעט שונים; פרוקיט="קונסירג'").
- המשתמש רואה אילו **הצעות** יש לו (לבצע משימות / לתת משאבים) ובעתיד גם **מו"מ** (תנאים שונים — ייבוא `negoM`/`negoPend`).
- **עריכה חופשית** של רשימת המשימות (הוסף/הסר), או **בקשת רוויזיה מה-AI** עם כל המידע שנצבר + בקשה טקסטואלית.

**שער הסכמה + פאזת ייצור.** רק אחרי שאושרה **השמה לכל** המשימות והמשאבים → נוצרת **ריקמה** + **מוצר מורכב** מקושר אליה: כל הספקים = **חברים** בריקמה, הלקוח = **הלקוח** שקונה את המוצר המורכב. משם משתמשים בלוגיקת האישרורים של המכירות ([PLAN_COMPLEX_PRODUCTS.md](./PLAN_COMPLEX_PRODUCTS.md)). עדיף לאפשר ניהול **ממסך המשאלה** (וגם לספקים).

**אחרי סיום.** מציעים לספקים: לארכב את הריקמה (אחרי חלוקת הכסף) **או** להמשיך ולפרסם את המוצר המורכב שנוצר — להרכיב מוצרים מורכבים יחד ולהמשיך לשתף פעולה ללקוחות אחרים.

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

> ⚠️ עמודת ה-flag נכתבה כתחזית. **הסטטוס בפועל (2026-06-05)** מסומן בעמודה החדשה ומקורו ב-★ למעלה.

| סטטוס בפועל | #         | תמצית                                                                                                       |
| ----------- | --------- | ----------------------------------------------------------------------------------------------------------- |
| ✅ בנוי     | M0–M2     | טופס משאלה → `createRatson`; hub שלי+browse; `/[id]` view.                                                  |
| ✅ בנוי     | M3        | `matchRatson(keyword)` נורה אוטומטית; ProposalList.                                                         |
| ◑ חלקי      | M4        | משאלות פתוחות ב-`/moach/wishes`; הזמנה דרך `requestWishMission/Resource`. ספק-יוזם-עצמאי לא מלא.            |
| ✅ בנוי      | M5        | accept/reject + `acceptWishOffer` (השמה) + **materialize** (`materializeWish`: ריקמה ייעודית → `createSheirutFromPending` → `/deals`). |
| ✅+         | M6 / M6.5 | חילוץ AI **חי** בכתיבה + enrichment (Gemini/Pinecone) — מקדים את התכנית. **חסר:** רוויזיית-AI עם פרומפט.    |
| ❌          | M7–M9     | auto-compose מלא, multi-provider stitching, agent בצ'אט — עתידי.                                            |
| ❌          | —         | מו"מ (`negoM`/`negoPend`), פרסום-קהילה דרך `sugestmi`/`sugestma`, שלב אחרי-סיום (ארכוב/פרסום-מוצר).         |

#### טבלת התכנון המקורית (לשימור — לא משקפת סטטוס):

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

## 5.1. שער ההסכמה (consent gate) — איך M5 עובד בפועל

**עיקרון:** ההצעה בוחרת רק מי מועמד; ה-`Sheirutpend` הקיים הוא מנגנון ההסכמה. ראשון לקוחה מאשרת מצידה, ואז ה-Sheirutpend מאסף `vots` מהספקים. **רק כש-`createSheirutFromPending` רץ בהצלחה — הדיל קיים והעבודה מתחילה.**

### זרימה

```
ratson_proposal.status='suggested'  ← matchRatson יצר
        ↓ הלקוחה לוחצת "אני בוחרת"
ratson_proposal.status='accepted'   ← acceptRatsonProposal:
        ↓                              · יוצר Sheirutpend (state: vots=[], appruved=false)
        ↓                              · קושר Sheirutpend.matanots=[proposal.matanot]
        ↓                              · push לכל הספקים הרלוונטיים (notification של createSheirutpend הקיים)
Sheirutpend.vots מצטברים
        ↓ כשמושג הסף (ראה למטה)
createSheirutFromPending רץ → Sheirut נוצר → BOM מופעל (אם מורכב)
        ↓
ratson_proposal.status='accepted' (סופי) + ratson.status_ratson='fulfilled' אם זו הצעה אחרונה
```

### מי צריך לאשרר ובאיזה סף

- **מתנה פשוטה** (`matanot.pricingMode='fixed'` או `oneForeProject=true`): **חבר פרויקט אחד** מספיק. `approveSheirutpend` של חבר ראשון → `createSheirutFromPending` רץ. תואם הפטרן הקיים ב-`createSheirutpend`/`approveSheirutpend`.
- **מתנה מורכבת** (`pricingMode='estimated'`/`quote`, יש `matanot_recipe_missions[]`/`matanot_recipe_resources[]`): **כל החברים המעורבים חייבים לאשרר פה אחד**. "מעורב" = רשום ב-`recipeMission.pendm.rishon` או ב-`recipeResource.pmash.selfProposalUser` (התפקידים שהוקצו עם המתכון).

> זה אומר: ההצעה מ-`matchRatson` שואלת רק את העובדה "המוצר קיים ופנוי". איכות ההסכמה נשפטת ע"י Sheirutpend.appruved — אם רק יוצרת המתנה אישרה אבל לא הספק שמיועד למשימה, הסף לא הושג והדיל לא נסגר.

### לוח זמנים (לא אישרור אוטומטי)

- כשהלקוחה לוחצת "accept" — נכתב `Sheirutpend.createdAt`.
- ברירת מחדל: **72 שעות** למסעף ה-`vots` להגיע לסף. תזכורות אוטומטיות ב-T-24h ו-T-2h לכל מי שעוד לא הצביע (cron בנפרד, M5.1).
- חוסר תגובה ≠ הסכמה. אם הסף לא הושג בחלון → `Sheirutpend.archived=true` + `ratson_proposal.status_proposal='expired'`, התראה ללקוחה ("חלון הזמן עבר, אפשר לבחור מועמד אחר").

### דחייה

- **דחיית הלקוחה**: לפני accept — `rejectRatsonProposal` → status='rejected', שקט (אין spam לספק). אחרי accept — `cancelRatsonProposal` (לא במסגרת M5).
- **דחיית ספק**: חבר אחד שמצביע `no` ב-Sheirutpend → לוגיקת `approveSheirutpend`/`closeFiniapruval` כבר סוגרת את ה-Sheirutpend כדחויה. אנחנו רק מסנכרנים `ratson_proposal.status_proposal='rejected'` + התראה ללקוחה ("הציפייה בוטלה מצד הספק").

### פעולות חדשות (M5)

| Action                       | מי קורא   | מה עושה                                                                                                        |
| ---------------------------- | --------- | -------------------------------------------------------------------------------------------------------------- |
| `acceptRatsonProposal`       | הלקוחה    | `viewed → accepted`. מפעיל `createSheirutpend` (משתמש בפעולה הקיימת ←). מחזיר `{ proposalId, sheirutpendId }`. |
| `rejectRatsonProposal`       | הלקוחה    | `suggested/viewed → rejected`. שקט, ללא Sheirutpend.                                                           |
| `viewRatsonProposal`         | הלקוחה    | `suggested → viewed`. push לספק ("X בדקה את ההצעה").                                                           |
| `closeRatsonProposalExpired` | cron M5.1 | סורק Sheirutpend.archived=false עם createdAt+72h<now → archives + מסנכרן `ratson_proposal.status='expired'`.   |

### התראות (תואם להחלטה שמיפינו)

- matching אוטומטי → שקט
- `viewed` → push לכל proposer_users (low priority)
- `accepted` ע"י לקוחה (→ Sheirutpend נוצר) → push לחברי הפרויקט הרלוונטיים, **HIGH priority** (פעולה נדרשת)
- חבר אישר ב-Sheirutpend → push לאחרים בקבוצה (progress) + ללקוחה (T+ הצבעה)
- כל הנדרשים אישרו → Sheirut נוצר → push לכולם ("המעגל נסגר — מתחילים")
- ספק/חבר דחה → push ללקוחה ("הציפייה בוטלה")
- expired → push ללקוחה

---

## 5.2. איפה הנמען רואה "מבקשים ממך" (surfacing של requestSuggestion)

> נכתב: 2026-06-04. אחרי בניית `requestSuggestion` (PLAN §5) — השלב הבא: לתת לנמען מקום לראות שמשאלה מבקשת ממנו משימה/משאב.

`requestSuggestion` מייצר שני סוגי תוצרים. לכל אחד surface אחר:

| מסלול                                               | תוצר                                                            | איפה הנמען רואה את זה                                                                                                              | סטטוס     |
| --------------------------------------------------- | --------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- | --------- |
| **Track A** — מוצר (`kind='matanot'`)               | `Sheirutpend` (בקשת שירות)                                      | `/deals` → טאב **"בקשות ממתינות"** (`PendingRequestCard`, כולל pill "הגיע ממשאלה" דרך `sheirutpend.ratson_proposal`). **כבר עבד.** | ✅        |
| **Track B** — אדם/משאב (`kind='person'/'resource'`) | `ratson_proposal` (status `suggested`, `proposer_users=[נמען]`) | עד עכשיו: רק התראת push ל-`/lev`. **המסך החדש:** `/deals` → טאב **"משאלות אלייך"**.                                                | ✅ (חדש)  |
| **רמת ריקמה** (פרויקט מועמד)                        | `ratson_proposal` עם `project` (auto_generated מ-`matchRatson`) | `/moach/[projectId]/wishes` — **כבר היה קיים** (`107listRatsonsForProject`). זו ה"ריקמה" ששאלת עליה — מופעל.                       | ✅ (קיים) |

### מה נבנה ב-surface הזה (Track B → /deals)

- QID `111listMyWishInvitations` — `ratsonProposals` לפי `proposer_users.id == me` ו-`status_proposal ∈ {suggested, viewed}`.
- `dealsQueries.ts`: `IncomingWishInvitation` + `fetchWishInvitationsForUser` (best-effort, מצורף ל-`fetchDealsForUser` ב-`Promise.all`).
- `IncomingWishCard.svelte` + טאב "משאלות אלייך" ב-`deals/+page.svelte`. הכרטיס מקשר ל-`/concierge/[ratsonId]` (שם הנמען צופה ומגיב — `viewRatsonProposal`/accept/reject חיים שם).
- תרגומים: `deals.json` ×4 + מפתחות `deals.*` ב-`tr.json`.

### ⏭️ מה דילגנו ל-MVP: אובייקט במסך הלב (`/lev`)

ההתראה של `requestSuggestion` מפנה ל-`/lev`, וה-surface ה"טבעי" הראשון הוא כרטיס במסך הלב (`finalSwiperArray`) — אבל הוספת **טיפוס אובייקט חדש ללב** נוגעת ב-~8 קבצים (extractor → loader → snapshot version bump → processor → derived → mergeAndSort → milon → UI card). לכן ל-MVP **דילגנו** והסתפקנו ב-surface של `/deals` (שם כבר יש pipeline טעינה צד-שרת פשוט).

> כשנרצה להוסיף את זה (וכל אובייקט-לב עתידי): התיעוד המלא של ה-pipeline נמצא ב-[docs/HOWTO_ADD_LEV_OBJECT.md](./docs/HOWTO_ADD_LEV_OBJECT.md). זה ה"מתכון" שמקצר את הפעם הבאה. ה-`ani` המיועד לטיפוס הזה: `wishInvite`.

---

## 5.3. תגובת ספק להזמנה → מוצר מורכב (binding model)

> נכתב: 2026-06-04. ההמשך הישיר של §5.2. אומת מול `src/generated/STRAPI_SCHEMA_REFERENCE.md`.
>
> **⚠️ תיקון (אותו יום) — מי יוצר את המשימה:** הסעיף נכתב במקור כאילו **הספק** יוצר את המשימה (בחירת ריקמה + `mission.svelte` במודאל האישור). זו התנהגות שגויה. **המודל הנכון:** **הלקוח** מחבר את המשימה (= ההצעה/חוזה) בזמן ההזמנה — `mission.svelte` ב-`specMode` (פולט spec, מסתיר UI תלוי-פרויקט). פעולת `requestWishMission` יוצרת draft `derivedComplexMatanot` + `pendm` **חסר-ריקמה** (`137createPendmForRecipe` בלי `project` → `isglobal`) + שורת `matanot-recipe-mission` **לא-מוקצית** + proposal (מזהה השורה ב-`covered_missions[].extracted_mission_idx`). הספק רק **מאשר השמה**: `acceptWishOffer` מצומצמת ל-`assignedMember` בלבד (qid `143`/`144`) — **בלי בחירת ריקמה, בלי יצירה**. מודאל `AcceptWishOffer.svelte` = צפייה + [תמונה מלאה→/wish/id] + [אישור השמה] + [מו"מ — placeholder]. הריקמה נוצרת רק בסוף (phase 2, טרם מומש). הטבלה למטה משקפת את הישויות; ה"סדר בנייה" המקורי למטה הוחלף ע"י התיקון הזה.

### העיקרון: ספק = יוצר pendm/pmash בריקמה שלו; המשאלה = מוצר מורכב שמרכיב את כולם; הלקוחה = קונה

הקבלת היחסים (כל השדות **כבר קיימים ב‑Strapi** — אפס שינוי סכמה):

| מה                     | היכן מוגדר                                                                                                                                                 |
| ---------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| התרומה של הספק (משימה) | `pendm` בריקמת הספק (נוצר ע"י `mission.svelte`/`createMission` הקיים) → שורת BOM `matanot-recipe-mission.pendm` + `assignedMember`=ספק, `mode='createNew'` |
| התרומה של הספק (משאב)  | `pmash` בריקמת הספק (`ResourceCreator.svelte`/`createResource`) → `matanot-recipe-resource.pmash` + `assignedMember`                                       |
| המוצר המורכב           | `matanot` (`pricingMode='estimated'/'quote'`, `process`) — ה‑aggregator                                                                                    |
| משאלה ↔ מוצר           | `ratson.derivedComplexMatanot` (oneToOne→matanot) + `ratson.process`                                                                                       |
| התחייבות הספק          | רכיב `ratson_willingness_entry` על ה‑proposal (`agree,item_idx,item_kind,willingHours/Amount,user`)                                                        |
| הלקוחה כקונה           | `sheirut` (נפתח מהמוצר המורכב; `sheirutpend` מפזר הסכמה לכל ריקמת ספק)                                                                                     |
| מה נוצר/נצרך בזמן אמת  | `sheirut-fulfillment` (`createdMissions`/`createdMaaps`) — מזין את `deals/[id]`                                                                            |

### שתי פאזות (החלטת בעלות — מאושר)

1. **פאזת הרכבה (commitment):** **לא** יוצרים ריקמה — כבד ומזהם. המוצר המורכב הוא aggregator קל‑משקל המעוגן ל‑`ratson.process`; כל `pendm/pmash` חי בריקמה הקיימת של הספק. כל תרומה רק **מוסיפה שורת recipe** למוצר. (M8 stitching חוצה‑ריקמות.)
2. **פאזת ייצור (אחרי שכולם התחייבו + הלקוחה אישרה):** אין מנוס — **יוצרים ריקמה ייעודית לכל השותפים**. **הלקוחה היא הלקוחה של הריקמה, לא חברה בה.** המוצר המורכב עובר/נקשר לריקמה הזו, ו‑`createSheirutFromPending` מפעיל את ה‑BOM.

### סדר בנייה מוצע (אינקרמנטלי)

- **S1 — accept modal נשלף (reusable):** `AcceptWishOffer.svelte` (props: `proposalId, ratsonId, item{kind,idx,name,hours/qty}`). בוחר ריקמה מארחת (מגשר על `projectId:null`) → מטמיע `mission.svelte`/`ResourceCreator.svelte` ממולא מ‑`extracted_*`. שמיש מ‑wish/lev/deals.
- **S2 — action `acceptWishOffer`:** יוצר/מוצא את `ratson.derivedComplexMatanot` (lazy, מעוגן ל‑`ratson.process`), מוסיף שורת `matanot-recipe-mission/resource` עם ה‑pendm/pmash שנוצר, כותב `ratson_willingness_entry`, מעדכן `status_proposal`, מתריע ללקוחה.
- **S3 — decline:** action קטן (status + התראה).
- **S4 — materialize:** כשכל הצרכים מכוסים + הלקוחה מאשרת → יצירת ריקמת השותפים + `createSheirutFromPending` (M7 path קיים) + `sheirut-fulfillment` → `deals/[id]`.

> פתוח: בחירת ה‑`item_kind`/idx מתוך `extracted_*`; mapping בין proposal יחיד (person/resource) לבין שורת ה‑recipe; תמחור (`willingAmount`/`ratePerHour`).

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
