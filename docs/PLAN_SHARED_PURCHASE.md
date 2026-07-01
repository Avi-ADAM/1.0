# Shared Purchase — קנייה משותפת ואיגוד ביקושים — Plan v2

> מסמך עצמאי. **לא לערוך** את `PLAN_CONCIERGE.md` / `PLAN_COMPLEX_PRODUCTS.md`.
> **v2 (2026-07-01)** — שכתוב של v1. השינוי המרכזי: v1 בנה הכל סביב מודל אחד — "משאלה של יוזם אחד שאחרים מצטרפים אליה ומחליטים יחד" — ומשם נבעו כל מנגנוני הקונצנזוס, ההצבעות וה-willingness. v2 מוסיף את המסלול שהיה חסר: **איגוד ביקושים (Demand Aggregation)** — צרכנים עצמאיים שהמערכת מאגדת בלי שיצטרכו לוותר, להתפשר או להחליט שום דבר יחד — וממקם את מסלול-הקונצנזוס של v1 כמסלול משני לשימושים שבאמת דורשים החלטה משותפת.
> הנחה: סכמת הקונסיירז' (ratson-proposal, extracted_missions/resources, status_ratson, chat_forum, process, `matchRatson`, Pinecone) **קיימת ועובדת** (ראה סטטוס ב-`PLAN_CONCIERGE.md` §★).

---

## 1. שלוש צורות של "קנייה משותפת" — ולמה חייבים להפריד ביניהן

הבעיה העסקית: יש שירותים שקיימים **רק** בנפח. ספק ירקות מקומי לא יפתח משק בשביל סל שבועי אחד — אבל 10 סלים באותו אזור זה עסק. נהג מיניבוס לא ייסע בשביל נוסע אחד — אבל 10 נוסעים במחיר-למושב זה משתלם לכולם. מוצר דיגיטלי (קורס, כלי, מנוי) לא תלוי אזור בכלל — הסף שלו גלובלי.

הבעיה האנושית: ברגע שמחברים אנשים זרים לקבוצת-קנייה ומבקשים מהם **להחליט יחד**, מקבלים ויתורים, מריבות, ונטישה. לכן ההבחנה הקריטית היא לא "כמה אנשים" אלא **כמה החלטות משותפות** המוצר דורש:

| | **A — יוזמה משותפת** | **B — מאגד ביקושים** | **C — הצעה מותנית-סף** |
| --- | --- | --- | --- |
| מי מתחיל | אדם אחד פותח משאלה ומזמין שותפים | אף אחד — המערכת מזהה משאלות דומות ומאגדת | **ספק** מפרסם "אני אפתח את זה אם N יחתמו" |
| דוגמה | שיפוץ גינה שכונתית; אירוע שמתכננים יחד | סל ירקות שבועי; הסעה קבועה לעיר; מנוי SaaS | טיול מאורגן במיניבוס (מינ' 10); סדנה (מינ' 8) |
| החלטות קבוצתיות | **כן** — תכולה, מחיר, מי משלם מה | **אפס** — כל אחד חותם על עסקה אישית | **אפס** — take it or leave it, פר-אדם |
| כסף | משותף (Tosplit/Haluka) | **אישי** — N עסקאות נפרדות שמופעלות יחד | אישי — מחיר-למושב |
| מנגנון הסכמה | הצבעות, קונצנזוס, willingness (v1) | אין. חתימה אישית = ההסכמה כולה | אין. חתימה אישית |
| אזוריות | לפי המשאלה | פיזי=מקומי, דיגיטלי=גלובלי | לפי הגדרת הספק |
| פוטנציאל מריבה | גבוה — מנוהל במפורש | **אפס by design** | אפס |

**התובנה המרכזית של v2**: רוב מקרי-השימוש שחשבנו שהם A הם בעצם B או C. סל ירקות, הסעות, מנויים, סדנאות, טיולים סטנדרטיים — אף אחד מהם לא צריך שהקבוצה תחליט שום דבר. הקבוצה קיימת **רק כדי להגיע לסף הכדאיות**, וזה תפקיד של המערכת, לא של האנשים. מסלול A נשאר נחוץ — אבל רק למה שבאמת משותף (תכנון אירוע, שיפוץ ציבורי), והוא לא חוסם את B/C, שפשוטים ממנו בסדר גודל (לא נוגעים ב-`addVote.ts` בכלל).

אותו מוצר יכול לחיות בשני מסלולים: "טיול לגליל" כ-C (הספק קבע מסלול ומחיר, חותמים או לא) לעומת "בואו נתכנן טיול יחד" כ-A. **ברירת המחדל של המערכת: המסלול נטול-המריבות.** A נבחר רק במפורש.

---

## 2. עקרונות אל-מריבה (חוקי היסוד של מסלולי B/C)

אלה לא המלצות UX — אלה אילוצים אדריכליים. כל פיצ'ר עתידי במסלול B/C חייב לעבור אותם:

1. **ריבונות אישית** — המשאלה של כל צרכן נשארת שלו. הצטרפות למאגד לא ממזגת משאלות, לא משנה אותן ולא מחייבת כלום. עזיבה לפני חתימה — חופשית ושקטה.
2. **אפס החלטות קבוצתיות** — הסטנדרטיזציה קורית אצל הספק (הוא מגדיר את המוצר), ההתאמה האישית קורית בשוליים (כל חבר בוחר אופציות אישיות: גודל סל, נקודת איסוף, תוספות). אין שום שאלה שמופנית ל"קבוצה".
3. **אין כסף משותף** — כל חתימה יוצרת עסקה אישית (Sheirutpend אישי מול הספק). אין קופה, אין חלוקה, אין Tosplit/Haluka במסלולים האלה. סכסוך תשלום/איכות הוא בין צרכן יחיד לספק — לעולם לא בין צרכן לצרכן.
4. **הפעלה אטומית** — אף עסקה לא נכנסת לתוקף עד שההצעה הגיעה לסף שלה בתוך המועד. הגיעה — כולן מופעלות יחד; לא הגיעה — כולן פוקעות בשקט ואף אחד לא חייב כלום. אין מצב שבו מישהו "נתקע" משלם על קבוצה שהתפרקה.
5. **תחרות במקום הצבעה** — אם שני ספקים מציעים לאותו מאגד, הקבוצה **לא מצביעה** איזה לבחור. כל הצעה חיה בנפרד, כל חבר חותם על מה שמתאים לו, וההצעה שמגיעה לסף שלה מופעלת (יכולות גם שתיים). השוק מכריע, לא אסיפה.
6. **אנונימיות עד חתימה** — חברי מאגד רואים מספרים מצטברים ("11 משקי בית, תקציב מצטבר ~1,650₪/שבוע"), לא זהויות. אין לחץ חברתי, אין "למה הוא הצטרף והיא לא". זהות נחשפת לספק רק אחרי חתימה, ולחברים אחרים — רק אם המשתמש בחר (`visibility` פר-חבר).
7. **הצטרפות ≠ התחייבות; חתימה = התחייבות** — שתי רמות בלבד. עניין (רך, הפיך, אנונימי) → חתימה על הצעה קונקרטית (מחייבת, עם פרטים מלאים: מחיר, מועד, תנאי ביטול). שום שלב-ביניים עמום.
8. **פקיעה שקטה כברירת מחדל** — מאגד שלא הבשיל לא "נכשל" בפומבי ולא מייצר אשמה. הוא ממשיך לצבור עניין, או פוקע בלי רעש.

> **למה זה מחסל את המריבות**: כל מריבה בקבוצת-קנייה נובעת מאחד משלושה — תכולה משותפת, כסף משותף, או בחירה משותפת. עקרונות 2, 3, 5 מוציאים את שלושתם מהמשוואה מבנית. מה שנשאר לכל משתתף זו החלטה צרכנית רגילה: "העסקה האישית הזאת שווה לי או לא".

---

## 3. תשתית קיימת לשימוש חוזר (עודכן מול הקוד)

| צורך | שכבה קיימת | הערה |
| --- | --- | --- |
| המשאלה האישית | `Ratson` על כל שדותיו — כולל **`frequency`** (מחזוריות! סל שבועי), **`isOnline`** (דיגיטלי/גלובלי), `lat/lng/radius`, `categories`, `vallues`, `ai_meta`, `pinecone_id` | הכל קיים; `frequency`+`isOnline` הופכים לשדות מפתח באיגוד |
| פירוק מובנה של המשאלה | קונסיירז': `extracted_missions/resources` + חילוץ חי בכתיבה | קיים — זה מה שמאפשר לזהות ש"ירקות אורגניים כל שבוע" ≈ "סל ירקות שבועי" |
| דמיון סמנטי | Pinecone (Gemini 3072d) + `matchRatson` (keyword/vector) | קיים — האיגוד הוא `matchRatson` בין משאלות-למשאלות במקום משאלה-לספקים |
| הצעת ספק | `ratson-proposal` + surfacing ב-`/moach/[projectId]/wishes`, `/deals` | קיים למשאלה בודדת; מורחב למאגד (§6) |
| הסכמה→עסקה | `createSheirutpend` → `approveSheirutpend` → `createSheirutFromPending` | קיים — מקבל מצב "מותנה-סף" (§7) |
| התראות | `NotificationOrchestrator` (email/push/telegram/socket) | קיים |
| שדות גיוס | `joinKind`/`minJoiners`/`maxJoiners`/`joinDeadline` על Ratson | **כבר במיגרציה** (ראה PLAN_CONCIERGE ★) — משמשים את מסלול A ואת C |
| פיצול כסף קבוצתי | `Tosplit`/`Haluka` | רלוונטי **רק למסלול A** |
| הצבעות | `Vote` + `addVote.ts` | רלוונטי **רק למסלול A** — מסלולי B/C לא נוגעים בו |
| גיאו | `User.lat/lng/radius`, `Ratson.lat/lng/radius` — לוגיקת haversine **חסרה** | §10 |

---

## 4. מסלול B — המאגד (Demand Pool): סכמה

### 4.1 ישות חדשה: `api::maagad.maagad` (מאגד ביקוש)

אשכול של משאלות דומות שהמערכת (או אדם) פתחה. המאגד **לא מחליף** את המשאלות — הוא שכבת-על שמצביעה עליהן.

| שדה | סוג | תיאור |
| --- | --- | --- |
| `name` | String | תיאור קנוני של הביקוש ("סל ירקות אורגני שבועי — עמק יזרעאל") |
| `canonical_desc` | Text | ניסוח מאוחד שה-AI מפיק מהמשאלות החברות — מה שספק רואה |
| `scope` | enum `['local','regional','global']` | `global` נגזר אוטומטית כשרוב המשאלות `isOnline` |
| `lat` / `lng` / `radius` | Decimal | centroid + רדיוס-כיסוי של החברים (ריק כש-`global`) |
| `frequency` | enum כמו ב-Ratson (`one_time`,`weekly`,`monthly`…) | מחזוריות הביקוש |
| `categories` / `vallues` | relations (כמו Ratson) | ל-matching ספקים |
| `pinecone_id` | String | embedding של `canonical_desc` — לאיגוד המשכי ולהתאמת ספקים |
| `status_maagad` | enum `['forming','visible','offered','activating','active','dormant','closed']` | ראה מחזור-חיים §7.4 |
| `origin` | enum `['system_cluster','user_opened','supplier_offer']` | מי יצר — אשכול אוטומטי / משתמש שפתח מאגד במקום משאלה / ספק (מסלול C) |
| `viability_hint` | Integer nullable | הערכת "כמה צריך כדי שיהיה כדאי" — heuristic/AI, לתצוגת progress לפני שיש הצעה אמיתית |
| `chat_forum` | oneToOne → chat | פורום שאלות-לספק (לא פורום החלטות! ראה §12) |
| `process` | oneToOne → partof | עוגן process, כמו Ratson |

### 4.2 ישות חדשה: `api::maagad-member.maagad-member`

חברות של צרכן במאגד. נפרד מ-`ratson-share` של מסלול A — כי הסמנטיקה הפוכה (אין תרומה לקופה, אין role).

| שדה | סוג | תיאור |
| --- | --- | --- |
| `maagad` | manyToOne → maagad | |
| `user` | manyToOne → users_permissions_user | |
| `ratson` | manyToOne → ratson nullable | המשאלה המקורית שבגללה אוגד; nullable כי אפשר להצטרף למאגד גם בלי משאלה קודמת (כפתור "גם אני") |
| `status_member` | enum `['suggested','interested','signed','active','left','expired']` | `suggested` = המערכת הציעה לו, טרם הגיב |
| `signed_offer` | manyToOne → maagad-offer nullable | על איזו הצעה חתם |
| `sheirutpend` | manyToOne → sheirutpend nullable | העסקה האישית שנוצרה בחתימה |
| `options` | JSON | בחירות אישיות מתוך `maagad-offer.options` (גודל סל, נקודת איסוף…) |
| `visibility` | enum `['anonymous','first_name','full']` default `anonymous` | מה חברים אחרים רואים |
| `joinedAt` / `signedAt` / `leftAt` | DateTime | |

### 4.3 ישות חדשה: `api::maagad-offer.maagad-offer`

הצעת ספק למאגד. **סטנדרטית ואטומית**: מחיר-ליחידה, סף, מועד. זה החוזה שכל חבר חותם עליו אישית.

| שדה | סוג | תיאור |
| --- | --- | --- |
| `maagad` | manyToOne → maagad | |
| `proposer_user` / `proposer_project` | relations (כמו ratson-proposal) | |
| `title` / `description` | String / Text | מה בדיוק מקבלים |
| `unit_price` | Decimal + `currency` → matbea | מחיר לצרכן (לסל, למושב, למנוי) |
| `price_tiers` | JSON nullable | מדרגות: `[{min:10, price:100},{min:20, price:80}]` — המחיר יורד ככל שנחתמים יותר; **החיוב לפי המדרגה שהושגה בפועל בהפעלה** (כולם מרוויחים מהצטרפות של עוד אנשים — תמריץ חיובי במקום מריבה) |
| `min_participants` | Integer | הסף. מתחתיו — אין עסקה |
| `max_participants` | Integer nullable | קיבולת |
| `sign_deadline` | DateTime | עד מתי אוספים חתימות |
| `options` | JSON | אופציות אישיות שהספק מגדיר: `[{key:'size', choices:['S','M','L'], priceDelta:[0,15,30]}, {key:'pickup', choices:[…]}]` |
| `recurrence` | enum + `cycle_terms` JSON | להצעה מחזורית: מה קורה כל מחזור, תנאי יציאה (§7.5) |
| `cancellation_terms` | Text | תנאי ביטול — חלק מהחוזה שחותמים עליו |
| `status_offer` | enum `['open','quorum_reached','activated','expired','withdrawn']` | |
| `signed_count` | Integer (denormalized) | לתצוגת progress מהירה |

> **אין** שדה "הצבעת קבוצה על ההצעה". כמה הצעות `open` יכולות לחיות במקביל על אותו מאגד (עקרון 5).

### 4.4 הרחבות מינימליות לישויות קיימות

- `Sheirutpend.maagad_offer` manyToOne → maagad-offer (nullable) + `Sheirutpend.conditional` Boolean default false — עסקה מותנית-סף לא ניתנת ל-`createSheirutFromPending` עד שההצעה `activated` (guard בשרת). **אפס השפעה על זרימות קיימות** — השדות nullable/false.
- `Ratson.maagad` manyToOne → maagad (nullable) — למשאלה שאוגדה; המשאלה נשארת חיה ועצמאית.
- `Ratson.aggregation_opt_out` Boolean default false — משתמש שלא רוצה שהמשאלה שלו תאוגד.

---

## 5. אלגוריתם האיגוד — איך המערכת מזהה ש-10 אנשים רוצים אותו דבר

Job מתוזמן (+ טריגר אחרי כל `createRatson`/עדכון): `clusterRatsons`.

1. **מועמדות**: משאלות `status_ratson='open'`, לא `fulfilled`, לא `aggregation_opt_out`, שלא חברות כבר במאגד פעיל.
2. **דמיון סמנטי**: לכל משאלה — `pinecone.query` על namespace המשאלות (embedding כבר קיים מהקונסיירז'). סף התחלתי cosine ≥ 0.82 (לכייל עם דאטה אמיתי).
3. **תאימות קשיחה** (חובה, לא score):
   - **Scope**: אם המשאלה פיזית (`isOnline=false`) — חיתוך גיאוגרפי: `withinRadius` הדדי (או מרחק ≤ min(radius_i, radius_j)); אם דיגיטלית — מדלגים על גיאו לגמרי, מסננים רק שפה/מטבע.
   - **Frequency**: `weekly` לא מתאגד עם `one_time` (סל שבועי ≠ קנייה חד-פעמית של ירקות).
   - **קטגוריה**: לפחות קטגוריה משותפת אחת או sub_category זהה.
4. **גיבוש**: אשכול בגודל ≥ K (התחלה: K=3) → יצירת `maagad` עם `canonical_desc` שה-LLM מנסח מתוך המשאלות (בלי לחשוף פרטים אישיים), centroid גיאוגרפי, `viability_hint`.
5. **הזמנה, לא צירוף**: כל בעל-משאלה מקבל `maagad-member` בסטטוס `suggested` + התראה: *"יש עוד 6 אנשים באזורך שמחפשים סל ירקות שבועי. יחד — לספק מקומי שווה לפתוח את זה. מצטרף/ת?"*. **אף אחד לא מצורף אוטומטית** — עקרון 1.
6. **איגוד המשכי**: משאלה חדשה שדומה למאגד קיים (`pinecone_id` של המאגד) → הצעת הצטרפות ישירה במקום אשכול חדש. מאגדים דומים מדי → הצעת merge (פעולת אדמין/אוטומטית, החברים רק מקבלים עדכון — אין להם מה להחליט, החברות שלהם נשמרת כמו שהיא).

בנוסף — **פתיחה ידנית**: משתמש יכול לפתוח מאגד ישירות ("אני מחפש עוד אנשים לסל ירקות") — `origin='user_opened'`. זה *לא* הופך אותו למנהל ולא נותן לו סמכויות על אחרים; הוא סתם החבר הראשון. אין תפקיד "יוזם" במסלול B — עוד מקור-מריבות שנחסך.

---

## 6. חיבור לנותני השירות — הצד השני של השוק

המאגד שווה משהו רק אם ספק רואה אותו. שלושה ערוצים:

### 6.1 Surfacing לספקים קיימים

- **`/moach/[projectId]/demand`** (חדש, ליד `/wishes` הקיים): מאגדים `visible` שמתאימים לפרויקט — לפי `matchRatson` logic קיים אבל ברמת המאגד (categories/vallues/vector) + חיתוך גיאו בין אזור-השירות של הפרויקט ל-centroid+radius של המאגד (מאגד `global` עובר לכל ספק דיגיטלי מתאים). התצוגה: *"12 משקי בית ברדיוס 15 ק"מ ממך מחפשים סל ירקות שבועי, תקציב מצטבר ~1,800₪/שבוע"* — מספרים מצטברים, אפס זהויות (עקרון 6).
- **התראה יזומה**: מאגד חדש/גדל שחוצה את `viability_hint` → push לספקים המתאימים ביותר (top-N לפי score). זו ההזדמנות העסקית מוגשת אליהם.

### 6.2 Surfacing לספקים *פוטנציאליים* (גיוס!)

זה ההבדל בין "עוד פיצ'ר" ל"מנוע צמיחה": ביקוש מצטבר גלוי הוא כלי גיוס ספקים. עמוד ציבורי **`/demand`** (browse, ללא הרשמה) של מאגדים `visible` לפי אזור/קטגוריה — *"באזורך מחכים: 12 סלי ירקות, 8 חוגי ילדים, 15 מנויי חדר-כושר"*. CTA: "אתה יכול לספק את זה? הירשם והצע". שיתוף החוצה (share links) — חברי מאגד יכולים להפיץ כדי למשוך ספק.

### 6.3 ההצעה

`createMaagadOffer` — ספק מגיש הצעה (§4.3). ולידציה: מחובר לפרויקט/פרופיל, שדות חובה מלאים, `min_participants ≥ 2`. ההצעה נשלחת לכל החברים (`interested`+`suggested`) כהתראה + מופיעה בעמוד המאגד. שאלות הבהרה — ב-`chat_forum` של המאגד (שאלות צרכן↔ספק, גלוי לכולם; **לא** ערוץ החלטות).

**מו"מ במסלול B הוא עדכון-הצעה, לא דיון**: ספק שרואה שההצעה לא מתקדמת יכול לפרסם גרסה מתוקנת (מחיר/תנאים). חתימות קיימות על הגרסה הישנה נשארות בתוקף אם החדשה זהה-או-טובה-יותר לכולם (מחיר ≤, תנאים ⊇), אחרת נדרש אישור-מחדש בלחיצה. אין מו"מ קבוצתי.

---

## 7. חתימה, סף והפעלה אטומית

### 7.1 חתימה — `signMaagadOffer`

חבר חותם על הצעה: בוחר `options` אישיות, רואה מחיר סופי (unit_price + deltas; אם יש `price_tiers` — רואה טווח: "80–100₪ תלוי כמה נחתום"), מאשר `cancellation_terms`.
בשרת: `maagad-member.status='signed'` + `signed_offer` + יצירת **Sheirutpend אישי** `conditional=true` מול הספק, עם פירוט העסקה. עדכון `signed_count`.

### 7.2 הגעה לסף — הפעלה אטומית

כש-`signed_count ≥ min_participants` (בתוך `sign_deadline`):

1. `status_offer='quorum_reached'` + התראה לספק: **הספק מאשר סופית** (confirm) — הוא הצד שהתחייבותו תלויה בנפח, מגיע לו לראות את המספר הסופי. חלון אישור מוגדר (48h ברירת מחדל). אפשר גם auto-confirm אם סימן זאת מראש בהצעה.
2. עם אישור: `activateMaagadOffer` — לולאה על כל החתומים: `Sheirutpend.conditional=false` → המסלול הקיים (`approveSheirutpend`/`createSheirutFromPending`) רץ פר-עסקה. אם יש `price_tiers` — המחיר ננעל לפי המדרגה שהושגה, לכולם.
3. `status_offer='activated'`, `status_maagad='active'`, members→`active`. התראת "יצאנו לדרך" לכולם.
4. חתומים על הצעות *אחרות* של אותו מאגד שלא הופעלו — נשארים חתומים עד ה-deadline של אותה הצעה (ייתכנו שתי הצעות פעילות; צרכן שחתם על שתיהן — מקבל את שתיהן, זו הייתה בחירתו האישית. ה-UI מזהיר בחתימה כפולה).

### 7.3 אי-הגעה לסף — פקיעה שקטה

`sign_deadline` עבר ו-`signed_count < min`: `status_offer='expired'`, כל ה-Sheirutpend המותנים → archived, members חוזרים ל-`interested`. התראה רכה אחת ("ההצעה לא הבשילה הפעם; המאגד ממשיך לצבור חברים"). לספק — סיכום + אופציה להציע שוב בתנאים אחרים. **אף אחד לא חויב, אף אחד לא אשם** (עקרון 8).

מקרי ביניים: ספק רשאי להפעיל גם מתחת ל-min (זכותו, המחיר לפי ההצעה — לא מעלים מחיר על החתומים בדיעבד); חתום שמבטל לפני הפעלה → `signed_count--`, ואם ירד מתחת לסף אחרי שכבר `quorum_reached` — חלון backfill קצר (waitlist: `interested` שקיבלו "התפנה מקום") לפני שהספק מחליט.

### 7.4 מחזור חיי המאגד

```
forming (נוצר, מגייס עניין)
  → visible (≥K חברים interested — נחשף לספקים; לפני כן לא שווה להציג)
  → offered (יש הצעה אחת לפחות open)
  → activating (הצעה הגיעה לסף, ממתין לאישור ספק)
  → active (הצעה הופעלה — עסקאות רצות)
  → dormant (אין הצעות חיות ואין תנועה X ימים — לא מוצג לספקים, חברים נשארים)
  → closed (ידני/ניקוי)
```

`active` לא סוגר את המאגד: לסל שבועי, המאגד ממשיך לגייס (waitlist למחזור הבא / להגדלת קיבולת הספק).

### 7.5 מחזוריות — סל הירקות לאורך זמן

הצעה עם `recurrence != one_time` מפעילה עסקאות מתמשכות:

- ההפעלה יוצרת התקשרות-מסגרת פר-חבר; כל מחזור (שבוע) = fulfillment תחת אותו Sheirut (לא Sheirutpend חדש כל שבוע — להשתמש במנגנון `sheirut-fulfillment` הקיים מ-PLAN_COMPLEX_PRODUCTS).
- **יציאה ממנוי**: לפי `cycle_terms` שנחתמו (למשל הודעה של שבועיים). יוצא → הספק מקבל עדכון + waitlist backfill אוטומטי.
- **שחיקה מתחת לסף**: אם מספר הפעילים יורד מתחת ל-`min_participants` — לא מפרקים אוטומטית: התראה לספק + פתיחת גיוס מחודש (`visible` שוב) + חלון X מחזורים. הספק מחליט אם להמשיך, להעלות מחיר לפי tiers שהוגדרו מראש (רק אם הוגדרו — אין שינוי חד-צדדי), או לסיים לפי התנאים.

---

## 8. מסלול C — הצעה מותנית-סף יזומת-ספק

ה"מיניבוס": הספק לא מחכה שביקוש יתאגד — הוא מפרסם הצעה, והמערכת מגייסת לה חתומים.

- `createMaagadOffer` עם `origin='supplier_offer'`: נוצר `maagad` עטיפה (scope/גיאו/קטגוריות לפי ההצעה) + ההצעה עצמה. זה בדיוק אותו מנגנון של §6–7 — **אין קוד חדש מלבד נקודת-כניסה**.
- הפצה: (א) התאמה למשאלות פתוחות קיימות — `matchRatson` הפוך, המשאלות שמתאימות מקבלות את ההצעה כהצעת-הצטרפות; (ב) פיד ההמלצות בלב (`suggestToUser` §11); (ג) עמוד ציבורי `/demand/[id]` עם progress bar ("7/10 נרשמו — נשארו 4 ימים") — ניתן לשיתוף החוצה, מכניס משתמשים חדשים למערכת.
- כל השאר זהה: חתימה אישית, סף, deadline, הפעלה אטומית, פקיעה שקטה.

> זה גם המסלול הטבעי לספק שראה מאגד אבל רוצה להציע משהו קצת אחר ממה שהתבקש — הוא פשוט פותח הצעה נפרדת והשוק מכריע.

---

## 9. מסלול A — יוזמה משותפת (v1, מתומצת ומותנית)

נשאר בתוקף למקרים שהם באמת שיתופיים — קבוצה שמעצבת יחד תכולה (שיפוץ ציבורי, אירוע קהילתי, טיול שמתכננים ביחד). עיקרי v1 שנשמרים, בסדר עדיפות מופחת:

- **`ratson-share`** (§3.2 של v1) — חברות עם role/contribution — כבסיס להצטרפות ליוזמה.
- **רפקטור `addVote.ts` → `evaluateConsensus`** משותף עם כלל קונפיגורבילי (`unanimous`/`agreers_only`; דיפולט `unanimous` = אפס רגרסיה). זה השינוי היחיד בליבה קיימת, והוא נדרש **רק** למסלול A.
- **החלטות פר-פריט** על `ratson-proposal` (votes עם `item_kind`/`item_idx`) + **fallback** לפריט בלי קונצנזוס: `skip` / `agreers_only` / `willingness_pricing`.
- **מודלי willingness** — `proportional_cap` (דיפולט; אף אחד לא משלם יותר משהצהיר, הסכום מתכנס למחיר), `manual_split`; `pareto_sum`/`vickrey_light` נדחים ל-opt-in מתקדם מאוחר.
- **ביצוע**: `final_breakdown` מוצג לאישור סופי → Sheirutpend פר-פריט + `Tosplit`/`Haluka` לפי ה-breakdown.

**שינויים מ-v1 לאור עקרונות §2:**

1. **A הוא opt-in מפורש** — הטופס מציע קודם "לחפש/לפתוח מאגד" (B); "יוזמה משותפת עם החלטות קבוצתיות" היא בחירה מודעת עם הסבר על המחויבות.
2. **כלל-הכרעה נבחר מראש וגלוי למצטרפים** — מי שמצטרף יודע בדיוק איך מחליטים לפני שנכנס. אין שינוי כללים באמצע (נעילת `consensusRule` אחרי המצטרף הראשון).
3. **מבנה מריבה-ממוזערת גם כאן**: ברירת המחדל `agreers_only` — מי שלא רוצה פריט פשוט לא משתתף בו ולא משלם עליו (mini-מאגד פר-פריט), במקום לחסום את כולם. `unanimous` שמור למקרים שבאמת דורשים את כולם.
4. QIDs ופירוט מלא: v1 §3–§7 נשארים הרפרנס הטכני למסלול הזה (היסטוריית git של המסמך), מיושמים רק אחרי Track P (ראה §13).

---

## 10. גיאו ו-Scope

תחת `src/lib/server/geo/` (כמו v1): `haversine.ts`, `withinRadius.ts`. שימושים: איגוד (§5.3), התאמת ספק↔מאגד (§6.1), פיד המלצות. Prefilter מלבני דרך Strapi (`lat_gte/lte`) → haversine מדויק ב-Node. מספיק עד עשרות-אלפי רשומות; PostGIS בעתיד אם צריך.

**כלל ה-scope**: `isOnline=true` (מוצר דיגיטלי/מרחוק) ⇒ הגיאו לא משתתף בכלל — לא באיגוד ולא בהתאמת ספקים; מסננים רק שפה ומטבע. מאגד יכול להיות מעורב-scope רק אם השירות ניתן מרחוק לכולם. שירות פיזי בלי מיקום על המשאלה → prompt להשלמת מיקום לפני איגוד.

---

## 11. Actions + QIDs

תחת `src/lib/server/actions/configs/` (כולם דרך `/api/action` — זמינים גם ל-agent):

| Action | תמצית |
| --- | --- |
| `clusterRatsons` | job האיגוד (§5) — cron + טריגר אחרי createRatson |
| `openMaagad` | פתיחה ידנית ע"י משתמש (§5) או עטיפה למסלול C |
| `joinMaagad` / `leaveMaagad` | הצטרפות/עזיבה רכה (`interested`) — בלי התחייבות |
| `createMaagadOffer` | הצעת ספק (§6.3) / הצעה יזומה (§8) |
| `reviseMaagadOffer` | גרסה מתוקנת + לוגיקת שימור-חתימות (§6.3) |
| `signMaagadOffer` / `unsignMaagadOffer` | חתימה/ביטול-לפני-הפעלה (§7.1, §7.3) |
| `confirmMaagadQuorum` / `activateMaagadOffer` | אישור ספק + הפעלה אטומית (§7.2) |
| `expireMaagadOffers` | cron פקיעות (§7.3) + dormancy של מאגדים |
| `suggestMaagadimToUser` | פיד המלצות: מאגדים והצעות-סף מתאימים למשתמש (גיאו+תחומים+vector) → `Act` records |
| `suggestMaagadimToSupplier` | ההתאמה ההפוכה (§6.1) → התראות לספקים |

QIDs: **180–199** (בפועל תפוסים עד ~172, כולל כפילויות 166/167 — לוודא מול `qids.js` לפני קיבוע): 180crMaagad, 181crMaagadMember, 182updateMaagadMember, 183crMaagadOffer, 184updateMaagadOffer, 185queryMaagadFull, 186listMaagadimForUser, 187listMaagadimForSupplier, 188listPublicDemand, 189crConditionalSheirutpend, 190activateConditionalPends, 191queryMaagadMembers, 192–199 רזרבה (כולל מסלול A בהמשך).

---

## 12. UI

### צרכן

- **בטופס המשאלה (`newIwant.svelte`) — כלום.** זה העיקרון: המשתמש כותב משאלה רגילה; האיגוד קורה מאחורי הקלעים. תוספת יחידה: checkbox צנוע "אפשר לצרף אותי לביקוש קבוצתי" (default on; כותב ל-`aggregation_opt_out`).
- **`MaagadInviteCard`** (lev + push): *"יש עוד 6 כמוך…"* — הצטרפות בלחיצה. (אובייקט-לב חדש — לפי `docs/HOWTO_ADD_LEV_OBJECT.md`; `ani:'maagadInvite'`.)
- **`/maagad/[id]`** — עמוד המאגד: מספרים מצטברים (progress לעבר `viability_hint`), ההצעות הפתוחות, כפתור הצטרפות/חתימה, chat שאלות-לספק. בלי רשימת שמות (עקרון 6).
- **`OfferSignSheet`** — sheet חתימה: options אישיות, מחיר סופי/טווח tiers, תנאי ביטול, אישור.
- **`/deals`** — עסקה מותנית מוצגת עם badge "ממתין לסף — 7/10" עד ההפעלה; אחרי — deal רגיל.

### ספק

- **`/moach/[projectId]/demand`** — מאגדים מתאימים + כפתור "הצע"; טופס `MaagadOfferForm` (מחיר, tiers, min/max, deadline, options, recurrence, ביטול).
- **progress ההצעה** — כמה חתמו, זמן שנותר, אישור-סף.

### ציבורי

- **`/demand`** + **`/demand/[id]`** — browse ביקוש מצטבר + עמוד הצעה עם progress bar, ניתן לשיתוף (SEO/גיוס — §6.2).

---

## 13. Milestones

**Track P (מאגדים — B/C) קודם**: לא נוגע ב-addVote, לא דורש Tosplit/Haluka, ומכסה את רוב מקרי-השימוש. **Track G (יוזמה משותפת — A) אחריו**.

| # | מטרה | תוצר נבדק | flag |
| --- | --- | --- | --- |
| P0 | סכמה: `maagad`/`maagad-member`/`maagad-offer` + הרחבות Sheirutpend/Ratson (§4.4). geo utils (§10). | Strapi rebuild + types. | – |
| P1 | `clusterRatsons` + `openMaagad`/`joinMaagad`/`leaveMaagad` + `MaagadInviteCard` + `/maagad/[id]` (קריאה+הצטרפות). | 3 משאלות דומות → מאגד → הזמנות → הצטרפות. | `maagad.cluster=on` |
| P2 | Surfacing ספקים: `/moach/.../demand` + `suggestMaagadimToSupplier` + `createMaagadOffer` + `MaagadOfferForm`. | ספק רואה ביקוש ומגיש הצעה. | `maagad.supply=on` |
| P3 | חתימה והפעלה: `signMaagadOffer` + Sheirutpend מותנה + `confirmMaagadQuorum`/`activateMaagadOffer` + `expireMaagadOffers` + תצוגת `/deals`. | flow מלא: סף הושג → N עסקאות חיות; סף לא הושג → פקיעה נקייה. | `maagad.execute=on` |
| P4 | מסלול C: הצעה יזומת-ספק + `/demand` ציבורי + progress bar + share. | "מיניבוס 10 מקומות" מקצה לקצה כולל נרשמים מבחוץ. | `maagad.supplierOffer=on` |
| P5 | מחזוריות (§7.5): מסגרת + fulfillment פר-מחזור + יציאה/backfill/שחיקה. | סל ירקות רץ 4 שבועות עם עוזב אחד ומצטרף אחד. | `maagad.recurring=on` |
| P6 | ליטוש שוק: `price_tiers`, `reviseMaagadOffer`, waitlist, הצעות מתחרות, `suggestMaagadimToUser` מלא (vector). | — | `maagad.market=on` |
| G1 | `ratson-share` + join/leave ליוזמה + חשיפת `joinKind` בטופס (opt-in מפורש, §9.1). | — | `shared.join=on` |
| G2 | רפקטור `evaluateConsensus` (דיפולט unanimous, אפס רגרסיה). | — | `consensus.configurable=on` |
| G3 | הצבעה פר-פריט + fallback `skip`/`agreers_only` + UI review. | — | `shared.partialConsensus=on` |
| G4 | ביצוע: Sheirutpend פר-פריט + Tosplit/Haluka + `final_breakdown`. | — | `shared.execute=on` |
| G5 | willingness: `proportional_cap` + `manual_split` (המתקדמים — backlog). | — | `shared.willingness=on` |

---

## 14. סיכונים ופתוחים

1. **איגוד-יתר / איגוד-שווא** — cosine גבוה בין משאלות שונות מהותית ("סל ירקות" ~ "ירקות לגינה"). Mitigation: תאימות קשיחה (§5.3) חובה, סף גבוה, וההזמנה תמיד opt-in — איגוד שגוי עולה התראה מיותרת אחת, לא עסקה שגויה. לכייל את הסף על דאטה אמיתי לפני הרחבה.
2. **מסה קריטית (קר משני הצדדים)** — אין מאגדים בלי משאלות, אין הצעות בלי מאגדים. Mitigation: מסלול C (ספק יכול להתחיל לבד), `/demand` הציבורי כערוץ גיוס, ו-`viability_hint` שמציג progress גם בלי הצעה.
3. **אמינות חתימה** — חותמים ולא משלמים בהפעלה. Mitigation שלב 1: reputation + חסימת חותמים סדרתיים-נוטשים; שלב 2 (פתוח): שריון אמצעי תשלום בחתימה (tokenization) — דורש החלטת תשתית תשלומים נפרדת.
4. **ספק נוטש אחרי סף** — הקבוצה הבשילה והספק נעלם. Mitigation: חלון-אישור קצוב (§7.2) עם פקיעה אוטומטית + פגיעת reputation; החתומים חוזרים ל-`interested` והמאגד נשאר חי לספק הבא.
5. **פרטיות** — גם מספרים מצטברים יכולים לזהות באזור דליל ("3 משקי בית ביישוב X"). Mitigation: עיגול גיאוגרפי של centroid, הצגת טווחים ("5–10") מתחת לסף חשיפה, ו-`visibility` פר-חבר.
6. **כפל-מנגנונים B/A** — משתמשים יתבלבלו בין מאגד ליוזמה. Mitigation: שפה עקבית ("מצטרפים לביקוש" vs "שותפים ליוזמה"), ומסלול A מוסתר עד G1.
7. **חיוב מחזורי ושחיקה** (§7.5) — הנקודה החוזית העדינה ביותר; `cycle_terms` חייבים להיות מוצגים בחתימה, לא באותיות קטנות. פתוח: תבניות תנאים סטנדרטיות מוכנות-מראש שספק בוחר מהן (פחות ניסוחים חופשיים = פחות סכסוכים).
8. **עומס התראות** — clustering שרץ הרבה מייצר הזמנות חוזרות. Mitigation: התראת-הזמנה אחת פר מאגד×משתמש; digest שבועי לכל השאר; throttling ב-NotificationOrchestrator.
9. **גבול B↔A מטושטש בשטח** — קבוצה במסלול B תנסה "רק לשנות משהו קטן ביחד" בצ'אט. ה-chat_forum של מאגד הוא ערוץ שאלות-לספק בלבד; בקשות שינוי מוצר → הספק מוציא `reviseMaagadOffer`. לתעד את זה גם ב-UI (microcopy).

---

## 15. קבצים שייגעו (best estimate, Track P)

### חדשים — Server

- `src/lib/server/actions/configs/clusterRatsons.ts`
- `src/lib/server/actions/configs/openMaagad.ts` / `joinMaagad.ts` / `leaveMaagad.ts`
- `src/lib/server/actions/configs/createMaagadOffer.ts` / `reviseMaagadOffer.ts`
- `src/lib/server/actions/configs/signMaagadOffer.ts` / `unsignMaagadOffer.ts`
- `src/lib/server/actions/configs/confirmMaagadQuorum.ts` / `activateMaagadOffer.ts` / `expireMaagadOffers.ts`
- `src/lib/server/actions/configs/suggestMaagadimToUser.ts` / `suggestMaagadimToSupplier.ts`
- `src/lib/server/maagad/clustering.ts` (לוגיקת האיגוד — טהורה וניתנת לבדיקה)
- `src/lib/server/geo/haversine.ts`, `withinRadius.ts`
- `src/lib/services/maagadService.ts` (browser fetch helpers)

### חדשים — Routes

- `src/routes/(regandnon)/demand/+page.svelte` + `/demand/[id]/+page.svelte` (ציבורי)
- `src/routes/(reg)/maagad/[id]/+page.svelte`
- `src/routes/(reg)/moach/[projectId]/demand/+page.svelte`

### חדשים — Components

- `src/lib/components/maagad/MaagadCard.svelte`, `MaagadDetail.svelte`, `MaagadProgress.svelte`
- `src/lib/components/maagad/MaagadOfferCard.svelte`, `MaagadOfferForm.svelte`, `OfferSignSheet.svelte`
- `src/lib/components/lev/cards/MaagadInviteCard.svelte` (+ pipeline לפי HOWTO_ADD_LEV_OBJECT)

### עריכה

- `src/lib/components/addnew/newIwant.svelte` — checkbox opt-out בלבד (Track P; אקורדיון-הקבוצה של v1 נדחה ל-G1).
- `src/routes/api/send/qids.js` — QIDs 180–191.
- `src/lib/server/actions/configs/index.ts` — registration.
- `src/lib/components/deals/*` — badge "ממתין לסף" ל-Sheirutpend מותנה.
- `src/lib/translations/*` — strings.
- `src/lib/types/index.ts` — `Maagad`, `MaagadMember`, `MaagadOffer`.

---

## 16. Verification (end-to-end)

**יחידה**: Vitest ל-`clustering.ts` (scope/frequency/geo gates, ספי דמיון — עם seed vectors), למכונת-המצבים של offer (open→quorum→activated / expired, ביטול לפני/אחרי סף, backfill), ולחישוב tiers.

**אינטגרציה — תרחיש "סל ירקות" (P1–P3)**:

1. 4 משתמשי דמה באותו אזור + 1 רחוק + 1 `isOnline`; כולם יוצרים משאלות "ירקות שבועיים" בניסוחים שונים.
2. `clusterRatsons` → מאגד אחד עם 4 (הרחוק והדיגיטלי בחוץ). כל ה-4 קיבלו `suggested`.
3. 3 מצטרפים (`interested`), אחד מתעלם. מאגד → `visible`.
4. ספק דמה רואה אותו ב-`/moach/.../demand`, מגיש הצעה: 90₪/סל, min 3, deadline +7d, options גודל.
5. 3 חותמים (אחד עם option L) → נוצרו 3 Sheirutpend מותנים; `quorum_reached`; ספק מאשר → 3 עסקאות חיות ב-`/deals`, מחירים נכונים כולל delta.
6. תרחיש-מראה: הצעה שנייה min 5 → פוקעת ב-deadline → pends נארכבו, members חזרו `interested`, אפס עסקאות.

**תרחיש "מיניבוס" (P4)**: ספק פותח הצעת-סף (min 10) בלי מאגד קיים → 6 נרשמים מהמלצות + 4 דרך לינק ציבורי → הפעלה. וגם: 8 בלבד → הספק בוחר להפעיל מתחת לסף → עובד במחיר המקורי.

**רגרסיה**: כל זרימות Sheirutpend הקיימות (ללא `maagad_offer`) עוברות ללא שינוי — להריץ טסטים של createSheirutpend/approveSheirutpend/createSheirutFromPending לפני merge של P3. Track P לא נוגע ב-`addVote.ts` — אפס סיכון שם עד G2.

**MCP/Agent**: אחרי P3 — flow מלא דרך `/api/v1/actions` בצ'אט: "תמצא לי עוד אנשים שרוצים סל ירקות" → join → sign.
