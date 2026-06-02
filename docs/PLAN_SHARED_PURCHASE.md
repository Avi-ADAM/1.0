# Shared Purchase / Consensus Buying — Plan

> מסמך עצמאי. **לא לערוך** את `PLAN_CONCIERGE.md` / `PLAN_COMPLEX_PRODUCTS.md`.
> הנחה: סכמת הקונסיירז' (ratson-proposal, extracted_missions/resources, status_ratson, chat_forum, process) **כבר קיימת ב-Strapi** (יושמה במחשב אחר, עדיין לא בפרודקשן). הסכמות החדשות כאן מוסיפות שכבת "קנייה משותפת" מעליה.

---

## 1. Context

המודל הקיים: משתמש בודד פותח Ratson, ספק קונה/מספק, הקבוצה משלמת דרך Sheirutpend עם הצבעת קונצנזוס יחידנית (סטראפי-side: `Sheirutpend.votes`, חישוב ב-`addVote.ts`).
המודל שאנחנו מוסיפים: **משאלה היא יוזמה משותפת**. כמה אנשים מצטרפים, מקבלים החלטות יחד, ומשלמים יחד — לטיול קבוצתי, שיפוץ ציבורי, אירוע קהילתי, רכישה משותפת. ה-`allowJoin` הקיים ב-Ratson מקבל סוף-סוף משמעות.

מטרות:

1. לחשוף `allowJoin` בטופס, להוסיף סוג-יוזמה (`joinKind`), שדות גיוס (min/max joiners, תאריך-סגירה).
2. לתת לעובר-אורח להצטרף ל-Ratson פתוח (UI ציבורי + action `joinRatson`).
3. לאפשר לקבוצה לקבל החלטות _פר-פריט_ ב-BOM שה-`extracted_*` / `ratson-proposal` ייצר.
4. כשאין קונצנזוס מלא — להפעיל fallback מוגדר-מראש (skip / agreers-only / willingness-pricing) במקום לחסום.
5. להציע משאלות פתוחות למשתמשים לפי גיאוגרפיה ותחומי עניין (lat/lng/radius + vallues, דרך Pinecone הקיים).
6. לתרגם הסכמה לתשלום: כשהקבוצה מתחייבת → Sheirutpend פר-פריט → Tosplit/Haluka מחלקים כל פריט בין המסכימים לפי המודל.

המרכיב הקריטי: הסכמה מתפצלת ל-3 רמות — (א) הסכמה על-עצם-הפריט, (ב) הסכמה על-מחיר, (ג) הסכמה מי משלם. רוב התשתית קיימת — חסר חיבור והגדרה.

---

## 2. תשתית קיימת לשימוש חוזר (לא להמציא מחדש)

| צורך                           | שכבה קיימת                                                  | קובץ                                                                                                        |
| ------------------------------ | ----------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| תאחסון משתתפים                 | `Ratson.users_permissions_users` (relation)                 | סכמה line 1772                                                                                              |
| Toggle "פתוח להצטרפות"         | `Ratson.allowJoin` (Boolean)                                | סכמה line 1742 — שדה קיים, לא בטופס                                                                         |
| מטא-משאלה (כתובת/רדיוס/תחומים) | `Ratson.lat/lng/radius/vallues/categories/sub_category`     | קיים                                                                                                        |
| גזירת פריטים מהמשאלה           | `Ratson.extracted_missions/extracted_resources` (קונסיירז') | יושם                                                                                                        |
| Object ההצעה                   | `ratson-proposal` (קונסיירז' §2.2)                          | יושם                                                                                                        |
| ההצבעה עצמה                    | `Vote` relation + `addVote.ts`                              | `src/lib/server/actions/configs/addVote.ts:181-250`                                                         |
| העברה לתשלום                   | `createSheirutpend` → `createSheirutFromPending`            | `actions/configs/createSheirutpend.ts`, `createSheirutFromPending.ts`                                       |
| **פיצול תשלום**                | `Tosplit` + `Haluka` + `vots`/`prectentage`                 | סכמה line 2110/418; actions: `createHaluka`, `createSheirutHaluka`, `confirmSheirutHaluka`, `approveHaluka` |
| התאמה וקטורית                  | Pinecone wired (Gemini 3072d, 5 namespaces)                 | `src/lib/embed/pinecone.ts`, `embed/matcher.ts`                                                             |
| גיאו (סכמה בלבד)               | `User.lat/lng/radius`                                       | סכמה line ~5303 — לוגיקה ל-haversine **חסרה**                                                               |
| מנגנון התראות                  | `NotificationOrchestrator` (email/push/telegram/socket)     | `src/lib/server/notifications/NotificationOrchestrator.ts`                                                  |
| פרוסס + פורומים                | `createProcess`, `attachEntityToProcess`                    | `actions/configs/createProcess.ts`, `attachEntityToProcess.ts`                                              |
| Acts כהמלצות למשתמש            | `Act` entity + `User.acts`                                  | סכמה                                                                                                        |

**שינוי חיוני אחד בקיים**: כלל הקונצנזוס ב-`addVote.ts:228` הוא **קשיח לאחדפיות** (`positiveMemberVotes.length >= totalMembers`). חייב להפוך לקונפיגורבילי לפני שניתן לבנות קבוצת-קנייה.

---

## 3. הוספות סכמה ל-Strapi

### 3.1 הרחבת `api::ratson.ratson` — שדות חדשים

| שדה                        | סוג                                                                                                                  | תיאור                                                                                |
| -------------------------- | -------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| `joinKind`                 | enum `['solo','group_trip','public_renovation','group_purchase','community_event','recurring_subscription','other']` | אופי היוזמה. `solo` = ההתנהגות של היום (אחד מארגן). שאר הערכים מפעילים מסלול shared. |
| `minJoiners`               | Integer (default 1)                                                                                                  | סף מינימום משתתפים לפעולה                                                            |
| `maxJoiners`               | Integer (nullable)                                                                                                   | תקרה אופציונלית                                                                      |
| `joinDeadline`             | DateTime                                                                                                             | אחרי תאריך זה אי-אפשר להצטרף; אם `currentJoiners < minJoiners` — הריצה נכשלת/מוחזר   |
| `consensusRule`            | enum `['unanimous','agreers_only']` (default `agreers_only`)                                                         | כלל ההצבעה ברירת מחדל לכל החלטות בתוך ה-Ratson                                       |
| `partialConsensusFallback` | enum `['skip','agreers_only','willingness_pricing']` (default `skip`)                                                | מה לעשות עם פריט שלא עבר את הסף                                                      |
| `willingnessModel`         | enum `['proportional_cap','pareto_sum','vickrey_light','manual_split']` (default `proportional_cap`)                 | רלוונטי רק כש-fallback = `willingness_pricing`; ראה §6                               |
| `share_status`             | enum `['recruiting','locked','executing','completed','cancelled','expired']`                                         | מצב הקבוצה (אורתוגונלי ל-`status_ratson` שמתאר את המשאלה)                            |
| `lockedAt`                 | DateTime                                                                                                             | מתי הקבוצה ננעלה ועברה ל-execution                                                   |

**אילוצים**: כאשר `joinKind != 'solo'` ⇒ `allowJoin=true` חובה.

### 3.2 ישות חדשה: `api::ratson-share.ratson-share`

רשומה אחת פר-משתתף בקבוצה (יותר חזקה מ-relation `users_permissions_users` הקיים — נדרשת כדי לאחסן role, contribution, joinTime, willing-cap).

| שדה                   | סוג                                                 |
| --------------------- | --------------------------------------------------- |
| `ratson`              | manyToOne → ratson                                  |
| `user`                | manyToOne → users_permissions_user                  |
| `role`                | enum `['initiator','joiner','observer']`            |
| `maxContribution`     | Decimal nullable (תקרה גלובלית; אם null = ללא תקרה) |
| `currency`            | relation → matbea                                   |
| `joinedAt` / `leftAt` | DateTime                                            |
| `status_share`        | enum `['active','left','completed']`                |
| `notificationsOn`     | Boolean default true                                |

> ה-relation הישן `Ratson.users_permissions_users` נשאר בשימוש כקיצור-קריאה (mirror של active members) ומתעדכן אטומית בהוספת/הסרת share.

### 3.3 הרחבת `api::ratson-proposal.ratson-proposal` (יושם בקונסיירז')

תוספות שדות לתמיכה בהחלטה קבוצתית פר-הצעה:

| שדה                   | סוג                                                               | תיאור                                                                                           |
| --------------------- | ----------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| `votes`               | oneToMany ← Vote (reverse, על-ידי הוספת `ratson_proposal` ל-Vote) | רשומות הצבעה                                                                                    |
| `willingness_entries` | Component repeatable (`ratson_willingness_entry`, §3.4)           | התחייבויות פר-משתמש פר-פריט                                                                     |
| `final_breakdown`     | JSON nullable                                                     | פלט של `evaluateRatsonConsensus`: אילו פריטים נכנסו, מי משלם כמה, מה היה ה-fallback שנעשה בפועל |
| `tosplit`             | manyToOne → tosplit nullable                                      | קישור ל-Tosplit שנוצר אוטומטית עם נעילה                                                         |

### 3.4 רכיב חדש: `ratson_willingness_entry` (component, repeatable)

נאחסן רשומת willingness אחת פר-(משתמש × פריט ב-proposal):

| שדה             | סוג                                                                                    |
| --------------- | -------------------------------------------------------------------------------------- |
| `user`          | relation → users_permissions_user                                                      |
| `item_kind`     | enum `['proposal','covered_mission','covered_resource']`                               |
| `item_idx`      | Integer (אינדקס ל-`covered_missions[i]` / `covered_resources[j]`; `-1` עבור הצעה כולה) |
| `agree`         | Boolean (האם בכלל רוצה את הפריט)                                                       |
| `willingAmount` | Decimal (כמה מוכן לשלם)                                                                |
| `willingHours`  | Decimal nullable (אם הפריט הוא covered_mission — שעות שמוכן לתרום במקום כסף)           |
| `submittedAt`   | DateTime                                                                               |
| `note`          | String nullable                                                                        |

### 3.5 הרחבת `api::vote.vote` (קיים)

הוספת שני קישורים אופציונליים — מאפשרת לסקייל-בחזרה לקיים בלי ישות חדשה:

- `ratson` manyToOne → ratson (nullable)
- `ratson_proposal` manyToOne → ratson-proposal (nullable)
- `item_kind` enum (כמו 3.4) — מאפשר וויט פר-פריט במקום פר-הצעה
- `item_idx` Integer nullable

> ה-Vote הקיים כבר מקושר ל-sheirutpend, matanotpend, decision, sheirut — הוספת ratson + ratson_proposal עקבית עם הדפוס.

### 3.6 הרחבת `api::tosplit.tosplit` ו-`api::haluka.haluka`

- `Tosplit.ratson_proposal` manyToOne → ratson-proposal (nullable) — קישור פיצול ל-proposal.
- `Tosplit.split_origin` enum `['manual','willingness_proportional','willingness_pareto','willingness_vickrey','equal']` — מתעד מאיזה מודל המספרים נגזרו.
- `Haluka.ratson_share` manyToOne → ratson-share (nullable) — קישור החלק של אדם ספציפי בקבוצה.

> אין צורך ב-entity חדש ל-"שכבת הפיצול הקבוצתית" — Tosplit + Haluka **כבר** מתממשים את זה (עם vots, prectentage, finished, sales). רק הוספנו שני קישורים לקונטקסט.

---

## 4. שינוי בליבת ההצבעה (קריטי)

קובץ: `src/lib/server/actions/configs/addVote.ts:181-250`.

היום סף הקונצנזוס קשיח: `positiveMemberVotes.length >= totalMembers` (line ~228). יש להחליף בפונקציה משותפת חדשה:

```
src/lib/server/consensus/evaluateConsensus.ts  (חדש)
  evaluateConsensus({
    voters: User[],          // קבוצת המצביעים הזכאית (project members או ratson-shares)
    votes: Vote[],
    rule: 'unanimous'|'agreers_only'
  }) → { reached: boolean, agreers: User[], dissenters: User[], abstainers: User[] }
```

`addVote.ts` עובר לקרוא ל-`evaluateConsensus` עם הכלל המתאים לפי הישות שעליה מצביעים (sheirutpend ⇒ project rule הקיים; ratson_proposal ⇒ `ratson.consensusRule`).

**תאימות אחורה**: דיפולט = `unanimous` (ההתנהגות הקיימת). הזרימה של sheirutpend עם project יחיד ממשיכה לעבוד בלי שינוי.

---

## 5. Action Configs חדשים

תחת `src/lib/server/actions/configs/`:

1. **`joinRatson.ts`** — מוסיף משתמש ל-Ratson פתוח: יצירת `ratson-share`, עדכון `Ratson.users_permissions_users`, attach ל-`chat_forum`, התראת מנהל ה-Ratson. בדיקות: `allowJoin=true`, `share_status='recruiting'`, `currentJoiners < maxJoiners`, `now < joinDeadline`, לא קיים share אקטיבי לאותו user.
2. **`leaveRatson.ts`** — `status_share='left'`, leftAt. אם היוזם עוזב → או העברת בעלות לחבר ותיק או `share_status='cancelled'`.
3. **`lockRatson.ts`** — סוגר הצטרפויות. בדיקה: `currentJoiners >= minJoiners`. `share_status='locked'`, `lockedAt=now`. מפעיל matching אוטומטי (קונסיירז' `matchRatson`).
4. **`recordWillingness.ts`** — append/upsert ל-`ratson_proposal.willingness_entries` (לפי user × item). לוגית רץ פר-פריט; קליינט יכול לשלוח batch.
5. **`voteOnRatsonProposal.ts`** — wrapper דק על `addVote` הקיים, עם `ratson_proposal=id` ו-`item_kind/item_idx` אופציונליים. אחרי כל הצבעה, אם כל המצביעים בקבוצה השלימו → trigger אוטומטי ל-`evaluateRatsonConsensus`.
6. **`evaluateRatsonConsensus.ts`** — הליבה. לפעולה אחת:
   - לכל פריט ב-proposal (proposal-level + כל covered_mission + כל covered_resource): קורא `evaluateConsensus` עם הכלל מ-Ratson.
   - לפי תוצאה ו-`partialConsensusFallback`: מסמן את הפריט כ-`included`/`excluded`/`willingness_priced`.
   - אם `willingness_priced` — מחשב פיצול לפי `willingnessModel` (ראה §6).
   - שומר את התוצאה ב-`ratson_proposal.final_breakdown` (JSON).
   - **לא יוצר Sheirutpend עדיין** — מציג אותה לקבוצה לאישור סופי (avoid surprise).
7. **`confirmRatsonExecution.ts`** — אחרי שהקבוצה רואה את ה-final_breakdown ומאשרת:
   - יוצר Sheirutpend (קריאה ל-`createSheirutpend` הקיים) פר-פריט כלול, עם `users_permissions_users` = רק המסכימים/משתתפים בפריט.
   - יוצר Tosplit + Haluka פר-Sheirutpend על-בסיס `final_breakdown`; ממלא `prectentage` או `amount` לכל Haluka.
   - מקשר את כולם ל-`ratson_proposal.tosplit`.
   - `ratson.share_status='executing'`.
   - התראות לכל המשתתפים.
8. **`suggestRatsonsToUser.ts`** — מריץ matching של משאלות פתוחות (`access_mode='public'`, `allowJoin=true`, `share_status='recruiting'`) למשתמש: keyword (vallues/categories) + geo (haversine פר-`User.lat/lng/radius` × `Ratson.lat/lng/radius`) + vector (Pinecone — מבוסס `pinecone_id` של ה-Ratson). יוצר `Act` רשומות עם המלצות. job מתוזמן + on-demand.
9. **`cancelRatson.ts` / `expireRatson.ts`** — סגירה. אם כבר התחיל execution — מצריך הצבעת קונצנזוס לסגירה.

### QIDs חדשים בקובץ `src/routes/api/send/qids.js`

(לקבוע מספרים שלא מתנגשים עם 100-109 של קונסיירז'; הצעה: 130-145)

- `130joinRatson`, `131leaveRatson`, `132lockRatson`
- `133createRatsonShare`, `134updateRatsonShare`, `135queryRatsonShares`
- `136recordWillingness`, `137queryWillingnessForProposal`
- `138createRatsonVote`, `139queryRatsonVotes`
- `140updateRatsonProposalBreakdown`
- `141createTosplitFromRatson`, `142createHalukasFromBreakdown`
- `143listOpenJoinableRatsons`, `144listMyRatsonShares`
- `145createActForRatsonSuggestion`

---

## 6. מודלי Willingness Pricing (לבחירה פר-Ratson)

כש-`partialConsensusFallback='willingness_pricing'` והפריט לא קיבל קונצנזוס לגבי מחיר:

### 6.1 `proportional_cap` (ברירת מחדל מוצעת)

תנאי-קנייה: `Σ willingAmount ≥ itemPrice`.
חישוב Haluka: `share_i = (willingAmount_i / Σ willingAmount) × itemPrice` — כל אחד משלם פחות או שווה למה שהיה מוכן, סכום = מחיר בדיוק.
יתרון: אף אחד לא משלם יותר מההצעה שלו, סכום מדויק. מודל פשוט להסבר.

### 6.2 `pareto_sum`

תנאי-קנייה: `Σ willingAmount ≥ itemPrice`.
חישוב Haluka: כל אחד משלם **בדיוק** את `willingAmount_i`. עודף (`Σ - itemPrice`) מצטבר ל-bounti של ה-Ratson או למצטבר פרויקטלי.
יתרון: דווח-אמת מתוגמל (giving more = paying more), טוב לקהילות גיוס.

### 6.3 `vickrey_light`

תנאי-קנייה: `count(willingAmount_i ≥ minSharePrice) ≥ minPayersForItem`, כאשר `minSharePrice = itemPrice / minPayersForItem`.
חישוב Haluka: כולם משלמים את המחיר השני-הנמוך מבין המסכימים (מנגנון "shaving" של Vickrey).
יתרון: מאוד אטרקטיבי לפרויקטים — מעודד דיווח אמת. **חיסרון: מורכב להסבר**.

### 6.4 `manual_split`

ה-creator מקבל את ה-breakdown עם `willingAmount_i` כהמלצה, ועורך ידנית לפני `confirmRatsonExecution`. שמרני, בטוח, מתאים לתחילת הדרך.

> בכל המודלים: אם תנאי-הקנייה נכשל → הפריט נופל לפעולה הבאה לפי `partialConsensusFallback` (skip או agreers_only). `evaluateRatsonConsensus` מתעד את ה-fallback chain ב-`final_breakdown.fallback_trace[]`.

---

## 7. UI חדש

### 7.1 הרחבת `src/lib/components/addnew/newIwant.svelte` (טופס משאלה)

חשיפת `allowJoin` כ-Switch בולט. כש-`true` נפתח אקורדיון "קבוצה":

- `joinKind` (chooser)
- `minJoiners` / `maxJoiners`
- `joinDeadline`
- `consensusRule` (chooser, ברירת מחדל `majority`) + `consensusThreshold` (slider, רק אם `threshold`)
- `partialConsensusFallback` (chooser) + `willingnessModel` (chooser, רק אם `willingness_pricing`)
- preview של דוגמת ה-Haluka שתיווצר (תיאור מילולי)

> שיקול UX: הפרמטרים האלה מציפים. ברירת מחדל "Smart" — `consensusRule='majority'`, `partialConsensusFallback='agreers_only'` — מסתירה הכל ב"advanced".

### 7.2 רכיבי `src/lib/components/concierge/` חדשים (משלימים את §4 של PLAN_CONCIERGE)

- **`JoinersPanel.svelte`** — רשימת `ratson-share`, סטטוס recruiting/locked, כפתורי join/leave.
- **`ProposalGroupReview.svelte`** — תצוגה פר-פריט של הצעה עם:
  - מצב הצבעה (X/Y הצביעו, מי מסכים, מי לא)
  - שדות `willingAmount`/`willingHours` עבור המשתמש הנוכחי (אם רלוונטי)
  - תצוגה צפויה של ה-breakdown עם פעולת "calculate preview" ←‏ `evaluateRatsonConsensus` בלי commit
- **`FinalBreakdownView.svelte`** — תצוגת `final_breakdown` עם פירוט פר-משתמש (כמה אני משלם, על מה, לפי איזה fallback). כפתור confirm/cancel.
- **`SharePaymentCard.svelte`** — בכרטיסי `lev/cards/`, מציג את חלקי ה-Haluka הפעילים של המשתמש כתוצאה מ-Ratson share.

### 7.3 דף ציבורי `src/routes/(regandnon)/wish/[id]/+page.svelte` (קיים מקונסיירז')

תוספת: אם `allowJoin && share_status='recruiting'` — כפתור "Join" (CTA ראשי).

### 7.4 פיד הצעות בעמוד הבית/`lev`

רכיב חדש `src/lib/components/lev/SuggestedWishes.svelte` — מציג Acts מסוג `'ratson_suggestion'` ע"י `suggestRatsonsToUser` (geo + interests).

---

## 8. Geo Matching — תוספת חסרה

תחת `src/lib/server/geo/`:

- `haversine.ts` — חישוב מרחק קלאסי.
- `withinRadius.ts` — `(userLat, userLng, userRadius, ratsonLat, ratsonLng, ratsonRadius) → boolean | distance`.
- אינטגרציה ב-`suggestRatsonsToUser.ts` ובכל קוואיירי שמסנן רשימת Ratsons ציבוריים (rectangular bounding-box prefilter דרך Strapi `lat_gte/lte`, ואז haversine מדויק ב-Node).

> אם בעתיד נצטרך scale, ניתן לעבור ל-PostGIS plugin של Strapi. כרגע — bounding box + filter ב-Node מספיק עד עשרות אלפי Ratsons.

---

## 9. Milestones

| #    | מטרה                                                                                                                                        | תוצר                                                | flag                                 |
| ---- | ------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------- | ------------------------------------ |
| S0   | חשיפת `allowJoin` + `joinKind` בטופס. שמירה לאחור — joinKind='solo' מתנהג בדיוק כמו היום.                                                   | יוצר משאלה "פתוחה לקבוצה" עם metadata.              | –                                    |
| S1   | `ratson-share` + `joinRatson`/`leaveRatson`. UI: `JoinersPanel` + כפתור Join בעמוד public wish.                                             | זרים יכולים להצטרף; chat_forum משותף.               | `sharedPurchase.join=on`             |
| S2   | רפקטור `addVote.ts` ל-`evaluateConsensus` משותף עם 5 חוקים. retrofit ל-sheirutpend (unanimous נשאר ברירת מחדל ⇒ אפס רגרסיה).                | סף הצבעה הפך קונפיגורבילי.                          | `consensus.configurable=on`          |
| S3   | `voteOnRatsonProposal` + `recordWillingness` + `evaluateRatsonConsensus`. fallback רק ב-`skip` ו-`agreers_only`. UI: `ProposalGroupReview`. | קבוצה מצביעה על הצעה פר-פריט; פריטים נכנסים/יוצאים. | `sharedPurchase.partialConsensus=on` |
| S4   | `confirmRatsonExecution` יוצר Sheirutpend פר-פריט + Tosplit + Haluka equal-split (לפני willingness).                                        | תשלום בפועל לכל פריט מוסכם, חלוקה שווה.             | `sharedPurchase.execute=on`          |
| S5   | `willingnessModel='proportional_cap'` ו-`manual_split`. UI: `FinalBreakdownView`.                                                           | חלוקה לא-שווה לפי willing.                          | `sharedPurchase.willingness=on`      |
| S5.5 | `pareto_sum` + `vickrey_light` (לבחירה ב-Ratson).                                                                                           | מודלים מתקדמים.                                     | `sharedPurchase.advancedPricing=on`  |
| S6   | geo utils + `suggestRatsonsToUser` + `SuggestedWishes` ב-lev. Acts notifications.                                                           | משתמש מקבל המלצות לפי גיאו+תחומים.                  | `sharedPurchase.suggest=on`          |
| S7   | Pinecone matching למשאלות פתוחות (לא רק keyword). שילוב ב-`suggestRatsonsToUser`.                                                           | המלצות איכותיות גם בלי tagging.                     | `sharedPurchase.vectorSuggest=on`    |
| S8   | אינטגרציה ל-`/deals`: deal יחיד מציג את כל Sheirutpend-ים שנוצרו מאותו Ratson כ-sub-deals.                                                  | תצוגה מאוחדת.                                       | `sharedPurchase.dealsView=on`        |

S0–S2 הם החובה. S3–S5 הם הליבה. S5.5+ הם hardening ו-AI.

---

## 10. סיכונים ופתוחים

1. **התפוצצות פרמטרים בטופס** — 6 שדות חדשים עלולים להבריח משתמשים. פתרון: ברירת מחדל "Smart" + accordion "Advanced".
2. **משחקי דיווח-אמת** — `proportional_cap` מעודד דיווח-חסר ("אגיד שאני מוכן לפחות, אחרים ימלאו"). `pareto_sum` הפוך — מעודד שכבת-לחץ חברתית. `vickrey_light` הכי הוגן תאורטית, הכי מורכב להסבר. **הצעה**: התחל מ-`proportional_cap` כברירת מחדל, השאר את האחרים כ-opt-in מתקדם.
3. **תאימות אחורה ל-`addVote.ts`** — שינוי הליבה רגיש. mitigation: כיסוי בדיקות מקסימלי לפני merge; דיפולט `unanimous` שומר על ההתנהגות הקיימת.
4. **התראות-יתר ל-joiners** — כל הצבעה/willingness/comment פוטנציאלית מספאם. throttling ב-NotificationOrchestrator פר-Ratson + העדפת `notificationsOn` ב-share.
5. **פרטיות willingness** — הסכומים שכל אחד מוכן לשלם הם מידע רגיש. שדה ב-Ratson `willingnessVisibility` enum `['private','aggregate_only','full']` (default `aggregate_only`) — שולט מה רואה כל joiner.
6. **מקרי-קצה ב-Haluka** — עיגול שגרום ל-Σ הלוקות ≠ itemPrice. החלטה: יש לטפל ב-`confirmRatsonExecution` ע"י "תיקון יתרת אגורות" אצל היוזם או divisor mod.
7. **שחקנים זדוניים / spam-join** — אדם מצטרף ל-100 Ratsons ומפיל את הסף לעולם. mitigation: `User.reputation` + cap מירבי לכניסות פעילות בו-זמנית + הסרה אוטומטית אם אינו מצביע X פעמים.
8. **השפעה על `Sheirutpend` הקיים** — לא משנים את הסכמה שלו; רק יוצרים יותר Sheirutpend-ים פר-Ratson. צריך לוודא שהרכיבים הקיימים שמציגים Sheirut "אחד" (SaleCard, CustomerSaleCard) מתמודדים עם רשימה.

---

## 11. קבצים שייגעו (best estimate)

### חדשים — Server

- `src/lib/server/actions/configs/joinRatson.ts`
- `src/lib/server/actions/configs/leaveRatson.ts`
- `src/lib/server/actions/configs/lockRatson.ts`
- `src/lib/server/actions/configs/recordWillingness.ts`
- `src/lib/server/actions/configs/voteOnRatsonProposal.ts`
- `src/lib/server/actions/configs/evaluateRatsonConsensus.ts`
- `src/lib/server/actions/configs/confirmRatsonExecution.ts`
- `src/lib/server/actions/configs/suggestRatsonsToUser.ts`
- `src/lib/server/actions/configs/cancelRatson.ts`
- `src/lib/server/consensus/evaluateConsensus.ts` (משותף)
- `src/lib/server/consensus/willingnessModels.ts` (4 מודלי תמחור)
- `src/lib/server/geo/haversine.ts`, `withinRadius.ts`
- `src/lib/services/sharedPurchaseService.ts` (browser fetch helpers)

### חדשים — Routes

- `src/routes/(reg)/concierge/[id]/share/+page.svelte` (משלים את הקיים)

### חדשים — Components

- `src/lib/components/concierge/JoinersPanel.svelte`
- `src/lib/components/concierge/ProposalGroupReview.svelte`
- `src/lib/components/concierge/FinalBreakdownView.svelte`
- `src/lib/components/concierge/WillingnessInput.svelte`
- `src/lib/components/lev/SuggestedWishes.svelte`
- `src/lib/components/lev/cards/SharePaymentCard.svelte`

### עריכה

- `src/lib/components/addnew/newIwant.svelte` — אקורדיון "קבוצה" עם 6 שדות חדשים.
- `src/routes/(regandnon)/wish/[id]/+page.svelte` — כפתור Join + JoinersPanel.
- `src/lib/server/actions/configs/addVote.ts` — קריאה ל-`evaluateConsensus` החדש (שמירה אחורה לכלל `unanimous`).
- `src/routes/api/send/qids.js` — QIDs 130–145.
- `src/lib/server/actions/configs/index.ts` — registration.
- `src/lib/components/lev/cards/SaleCard.svelte`, `CustomerSaleCard.svelte` — תמיכה ב-Sheirutpend מרובים פר-Ratson.
- `src/lib/translations/he.ts` / `en.ts`.
- `src/lib/types/index.ts` — `RatsonShare`, `WillingnessEntry`, `FinalBreakdown`.

---

## 12. Verification (end-to-end)

לכל milestone, סדר בדיקה:

**יחידה**: Vitest לכל action חדש; snapshot tests ל-`evaluateConsensus` ו-`willingnessModels` עם seed scenarios (3-people unanimous-yes, 3-people 2-yes-1-no עם כל 4 fallback × 4 willingness model = 16 מצבים).

**אינטגרציה**:

1. הרצת dev server + Strapi מקומי.
2. יוצר 3 משתמשי דמה.
3. משתמש A יוצר Ratson עם `joinKind='group_trip'`, `consensusRule='majority'`, `partialConsensusFallback='willingness_pricing'`, `willingnessModel='proportional_cap'`.
4. משתמשים B, C מצטרפים (`joinRatson`).
5. ratson-proposal עם 3 פריטים נוצר (יושם בקונסיירז' — אם לא, mock פרופוזל ידני דרך הסטראפי-admin).
6. A מצביע yes על כל הפריטים, B yes על 2, C yes על 1 ועל הפריט השלישי שולח `willingAmount=20` למרות `agree=false`.
7. הפעלת `evaluateRatsonConsensus` — לבדוק `final_breakdown`: שני פריטים עברו majority (כולם משלמים שווה), פריט שלישי נפל ל-willingness_pricing (A+B משלמים לפי willing, C לא משלם).
8. `confirmRatsonExecution` — בודק שנוצרו 3 Sheirutpend + 3 Tosplit + 5 Halukas (2+2+1).
9. בדיקת ה-`/deals` שמציג deal מאוחד.

**MCP/Agent**: לאחר S4 מוודאים שכל ה-actions זמינים דרך `/api/v1/actions` ושאפשר להריץ flow מלא מתוך chat-agent עם prompts פשוטים.

**רגרסיה**: כל Sheirutpend קיים עם project יחיד ממשיך לעבור consensus כרגיל (unanimity על project members) — לפני merge של S2, להריץ את כל הטסטים של addVote ו-createSheirutFromPending.
