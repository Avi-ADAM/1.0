# תכנית מיגרציה למוצרים מורכבים (Complex Matanot)

> תכנית בלבד – בלי קוד. שלוש מטרות עוקבות שלכל אחת חלוקה לשלבים קטנים, רגרסיות מוגנות, ו-feature flag.
> נכתב: 2026-05-14

---

## 0. רקע ועיקרון מנחה

### היום:

- `Matanot` (מתנה/מוצר) בסטראפי הוא ישות "שטוחה" עם `name / price / quant / kindOf / desc / pic` ותאריכים, יש כבר אבל לא בשימוש: `missions`, `mashaabims`, `partofs`, `negos`, `fixPrice`, `appruved`.
- היצירה היום ב‑`src/lib/components/prPr/newmatana.svelte` שולחת mutation `createMatanot` ישירות (לא דרך `unified action system`).
- הקנייה היום: `/gift/[id]/+page.svelte` → `actionKey: createSheirutpend` → קריאה לקבוצה לאישור.
- המכירה היום ב‑`SaleCard.svelte` / `CustomerSaleCard.svelte` עובדת עם buble שטוח: `price / quant / total / weFinnish / moneyTransfered / iGotIt`.
- `Deals/[id]` כרגע **mock בלבד** (`src/lib/data/mockDeals.ts`), כבר יש לו רכיבים: `MissionList`, `ResourcePanel`, `CostPanel`, `ApprovalPanel`, `DealTimeline`, `ForumPanel`, `PartiesPanel`.

### עיקרון מנחה: שכבת "הרכב מוצר" (Bill of Materials)

מוצר מורכב = "מתכון" של (משימות × שעות/יחידה) + (משאבים × כמות/יחידה). כל מוצר נמכר ⇒ ה‑BOM מוכפל בכמות וגורר אוטומטית יצירת `Mesimabetahalich` (משימה בתהליך) חדשה, או חיוב יחידות מתוך משימה קיימת, וכן יצירת `Maap/Rikmash` עבור משאבים שצריך לרכוש.

### עקרונות פיתוח שמתחייבים מהמשימה:

1. **Unified Action System** – כל write‑path עובר דרך `src/lib/server/actions/configs/*` ולא דרך mutation ישירה ב‑Svelte. זה מה שיאפשר אינטגרציה למפ"ל MCP, ל‑Agent בצ׳אט ולסקשנים אחרים (Heart/Brain/Deals).
2. **Process Wrapping** – נשתמש ב‑`createProcess` + `attachEntityToProcess` הקיימים, כדי לעטוף את המוצר באותו flow של "תהליך": הצבעה, פורום ראשי, פורומים לכל פריט (mappingForum).
3. **Components Globalization** – הצגה (קריאה‑בלבד) מופרדת מ‑Compose (יצירה/עריכה). Compose נכנס ל‑`src/lib/components/products/` (חדש) כדי שייצרך מ‑Lev, Moach, gift, deals, ו‑agent.
4. **Backward compatibility** – `fixPrice=true` (ברירת מחדל הקיימת) ממשיך לעבוד בדיוק כמו היום. הזרימה החדשה תידלק רק כש‑`fixPrice=false`.

---

## 1. שינויי סטראפי (Schema migration)

### 1.1 שינויים ב‑`api::matanot.matanot` (קיים)

**שדות חדשים:**
| שדה | סוג | תיאור |
|------|-----|------|
| `pricingMode` | enum `['fixed','estimated','quote']` | מצב תמחור. `fixed` = התנהגות היום. `estimated` = מחושב מ‑BOM. `quote` = פתוח למו"מ. ברירת מחדל `fixed`. |
| `marginPct` | Decimal | אחוז רווח / overhead שמתווסף מעל סך ה‑BOM. ברירת מחדל 0. |
| `estimatedPrice` | Decimal | המחיר המחושב מה‑BOM (cache, מתעדכן ב‑hook). |
| `currency` | relation with matbea |
| `process` | oneToOne → `api::partof.partof` | עוגן ה‑"תהליך" של המוצר. נוצר אוטומטית ב‑`createComplexMatanot`. |
| `autoCreateTasks` | Boolean default false | האם ביצירת `Sheirut` ייווצרו אוטומטית `Mesimabetahalich` מ‑recipe. |
| `appruved` | (קיים, להפעיל) | אינדיקציה אם המוצר עבר הצבעה. |
| `status_of_voting` | enum `['draft','voting','active','archived']` | מצב מוצר. |

**יחסים חדשים:**

- `recipeMissions: oneToMany → api::matanot-recipe-mission.matanot-recipe-mission` (חדש – ראה 1.2).
- `recipeResources: oneToMany → api::matanot-recipe-resource.matanot-recipe-resource` (חדש – ראה 1.3).
- `matanotpend: oneToOne → api::matanotpend.matanotpend` (חדש – נוצר אוטומטית ב‑`createComplexMatanot` אם יש **יותר מחבר פרויקט אחד**; מנהל הצבעה, מו"מ ופורום פנימי לפני פתיחת המוצר; ראה 1.6).

> הערה: היחסים הקיימים `missions`, `mashaabims`, `partofs`, `negos` נשארים כפי שהם, ה‑recipe collections החדשות מוסיפות _כמויות וצמתים_ שחסרים. אפשר בהמשך להחליט אם להאשיים.

### 1.2 ישות חדשה: `api::matanot-recipe-mission.matanot-recipe-mission`

"שורה ב‑BOM" – משימה הנדרשת לייצור יחידה אחת של המוצר.
| שדה | סוג |
|------|-----|
| `matanot` | manyToOne → matanot _(matanot = הצד היחיד)_ |
| `pendm` | manyToOne → pendm _(pendm = הצד היחיד)_ |
| `mesimabetahalich` | manyToOne → mesimabetahalich _(mesimabetahalich = הצד היחיד)_ – אופציונלי – אם רוצים לחייב משימה קיימת בתהליך, לא ליצור חדשה |
| `hoursPerUnit` | Decimal (e.g. 4) |
| `unitsPerProduct` | Decimal default 1 |
| `ratePerHour` | Decimal (כפול מ‑`mission.perhour` אם null) |
| `mode` | enum `['createNew','consumeExisting']` – createNew = ייצור Mesimabetahalich חדש לכל מכירה; consumeExisting = רק "מחייב" שעות ממשימה בתהליך קיימת |
| `notes` | Text |
| `partof` | manyToOne → partof _(partof = הצד היחיד)_ – כדי שהמשימה החדשה תיוולד תחת process המוצר |
| `assignedMember` | manyToOne → users*permissions_user *(users*permissions_user = הצד היחיד)* – אופציונלי; אם `null` → המשימה נפתחת כ"משימה פתוחה" ומסמנת ללקוחות שנדרש גיוס משאב |

### 1.3 ישות חדשה: `api::matanot-recipe-resource.matanot-recipe-resource`

"שורה ב‑BOM" – משאב הנדרש לייצור יחידה אחת.
| שדה | סוג |
|------|-----|
| `matanot` | manyToOne → matanot _(matanot = הצד היחיד)_ |
| `pmash` | manyToOne → pmash (template) _(pmash = הצד היחיד)_ |
| `mashabetahalich` | manyToOne → mashabetahalich _(mashabetahalich = הצד היחיד)_ – אופציונלי – משמש כשמכירה מחויבת על **משאב‑בתהליך קיים** (`mode='consumeMashabetahalich'`); כל יחידת מכירה גוררת `Rikmash` מחזור חדש על אותה Mashabetahalich. ראה 1.8 ו‑1.10 |
| `quantityPerUnit` | Decimal |
| `pricePerUnit` | Decimal (override; אם null נלקח מ‑mashaabim.price או מ‑mashabetahalich.pricePerUnit) |
| `kindOf` | enum (mirror של mashaabim.kindOf) |
| `mode` | enum `['createNew','consumeMashabetahalich','consumeOpenMashaabim','reuseSp']` – `createNew` = פותח את הזרימה המלאה Pmash→Open_mashaabim→Askm→Maap→**Mashabetahalich** (ראה 1.10); `consumeMashabetahalich` = מחייב מחזור (Rikmash) חדש על Mashabetahalich קיים — הברירה הטבעית לשכירות/משאב חוזר; `consumeOpenMashaabim` = יחידות מ‑open_mashaabim פתוח שעוד לא הפך ל‑Maap; `reuseSp` = שימוש ב‑Sp פרטי |
| `notes` | Text |
| `assignedMember` | manyToOne → users*permissions_user *(users*permissions_user = הצד היחיד)\* – אופציונלי; אם `null` → המשאב נפתח כ"משאב פתוח" ומסמן ללקוחות שנדרש גיוס |

### 1.4 ישות חדשה: `api::sheirut-fulfillment.sheirut-fulfillment`

מקשרת בין `Sheirut` (מכירה אקטיבית) ובין מה שבפועל נוצר/נצרך עבורה.
| שדה | סוג |
|------|-----|
| `sheirut` | manyToOne → sheirut _(sheirut = הצד היחיד)_ |
| `matanot` | manyToOne → matanot _(matanot = הצד היחיד)_ |
| `quantity` | Decimal |
| `createdMissions` | oneToMany → mesimabetahalich |
| `consumedMissionHours` | Component (mesimabetahalich + hours) |
| `createdMaaps` | oneToMany → maap |
| `createdPmashes` | oneToMany → pmash |
| `cmdm` | Component (mashabetahalich + quantity + maap) – לכל מכירה שמחויבת על Mashabetahalich קיים נוצר **`Maap` קוונטה** (cycleIndex אוטומטי, ראה 1.9.5) ושומר את הקישור כאן. ה‑Maap הוא ה‑link לזרימת ההצבעה הקיימת; ה‑Rikmash המצטבר (1.9) מתעדכן ב‑`approveMaap`. תחליף את `consumedOpenMashaabimUnits` הישן |
| `consumedOpenMU` | Component (open*mashaabim + units) – *legacy*, ייעלם אחרי M10 |
| `process` | manyToOne → partof *(partof = הצד היחיד)\_ |
| `agreedPrice` | Decimal (אחרי מו"מ) |
| `status_process` | enum `['pending','active','delivered','completed']` |

> זה הרכיב שיוצר את הקשר מ‑_deals/[id]_ אל הפרטים האמיתיים – הטבלאות והרכיבים הקיימים בעמוד deals יקראו מ‑sheirut‑fulfillment.

### 1.6 ישות חדשה: `api::matanotpend.matanotpend`

תהליך האישור הפנימי לפני פרסום מוצר חדש לחברי הפרויקט.

| שדה          | סוג                                              | תיאור                                                      |
| ------------ |--------------------------------------------------| ---------------------------------------------------------- |
| `matanot`    | oneToOne → matanot _(matanot = הצד היחיד)_       | המוצר שממתין לאישור                                        |
| `timeragram` | oneToOne → timeragram _(timeragram = הצד היחיד)_ | טיימר לסבב ההצבעה (ברירת מחדל 72 שעות, ניתן לשינוי בקריאה) |
| `votes`      | manyToOne →  vote                                | הצבעות חברי הפרויקט                                        |
| `nego`       | manyToOne → nego _(nego = הצד היחיד)_            | מו"מ ראשוני על פרטי המוצר לפני חשיפה ציבורית               |
| `forum`      | manyToOne → chat _(chat = הצד היחיד)_            | דיון פנימי לחברי הפרויקט בלבד                              |
| `status_pend`     | enum `['open','approved','rejected','expired']`  | מצב תהליך האישור                                           |
| `resolvedAt` | DateTime                                         | מתי הגיע לקונצנזוס (approved/rejected)                     |

> ה‑matanot נשאר ב‑`status_of_voting='voting'` כל עוד `matanotpend.status='open'`. כשהקונצנזוס מגיע → `approveMatanot` מעדכן את שניהם.

---

### 1.5 שינוי קטן ב‑`api::nego.nego` (קיים)

הוספת שדות לתמיכה במו"מ פר‑שורת‑BOM:

- `recipeMission` → manyToOne _(matanot-recipe-mission = הצד היחיד)_ – אופציונלי
- `recipeResource` → manyToOne _(matanot-recipe-resource = הצד היחיד)_ – אופציונלי
- `proposedHours` / `proposedQuantity` / `proposedPrice` (Decimal)
- `acceptedAt` / `rejectedAt` (DateTime)

### 1.7 QIDS חדשים שצריך לרשום ב‑`src/routes/api/send/qids.js`:

- `81createMatanotRecipeMission`, `82updateMatanotRecipeMission`, `83deleteMatanotRecipeMission`
- `84createMatanotRecipeResource`, `85updateMatanotRecipeResource`, `86deleteMatanotRecipeResource`
- `87createSheirutFulfillment`, `88updateSheirutFulfillment`
- `89queryComplexMatanot` (fetch מוצר עם כל ה‑recipe + process)
- `90updateMatanotStatus`, `91approveMatanot`
- `92createMatanotpend` (יצירת matanotpend + timeragram לאישור פנימי; רק אם יש יותר מחבר פרויקט אחד)
- `93updateRecipeAssignedMember` (שיוך / ביטול שיוך `assignedMember` לשורת recipe)
- `94createMashabetahalich` — *side-effect של `approveMaap` על Maap קבלה ראשוני (cycleIndex=0)*. יוצר Mashabetahalich + Rikmash מצטבר.
- `95updateMashabetahalich` — עדכון: `quantityAssigned`, `end`, `recurring`, `cycleSize`, `assignedMember`.
- `96closeMashabetahalich` — סגירה מפורשת (`status='closed'`, `finnished=true`, סיכום ב‑`rikmash.summary`).
- `97createMaapCycle` — יצירת `Maap` קוונטה חדשה תחת Mashabetahalich קיים (`cycleIndex = lastCycleIndex+1`, `vots=[]`). בקבלת קונצנזוס דרך `addVote` הקיים → `approveMaap` הקיים מפעיל side-effect מצטבר על Rikmash.
- `98queryMashabetahalichWithCycles` — Mashabetahalich + Rikmash (כולל `deliveries[]`) + Maap[] + forum.
- `99linkMashabetahalichToRecipeResource` — קישור Mashabetahalich קיים כמקור לשורת BOM.

> שים לב: **אין QID חדש ל‑Finiapruval** — כל ההצבעה רוכבת על `Maap` ועל `addVote` ו‑`approveMaap` שכבר רשומים במערכת. זה מצמצם את משטח השינוי ב‑QIDs ל‑6 ערכים בלבד.

---

## 1.7.5 הערת מסגרת: מסלול עצמאי כלל‑אתרי (Side Quest)

סעיפים 1.8 / 1.9 / 1.9.5 / 1.10 **אינם** פיצ׳ר של "מוצרים מורכבים". הם **מיגרציה כלל‑אתרית**: היום `Mashabetahalich` קיים ב‑Strapi כשלד ריק ולא בשימוש, ולכן כל זרימת המשאב באתר נעצרת ב‑`Maap → Rikmash` (ארכיון יחיד) — אין מעקב משאב חי. המיגרציה מציבה את `Mashabetahalich` כשכבת הביניים החסרה לכל המקומות שמטפלים במשאב באתר, ולא רק עבור BOM של מוצרים מורכבים.

**שאלת ההשוואה למשימות (תבנית מנחה):**

| Domain | "In‑Process" | "אובייקט אישור פר‑קוונטה" | "ארכיון מצטבר (1 פר‑in‑process)" |
| ------ | ------------ | ------------------------- | -------------------------------- |
| משימה  | `Mesimabetahalich` | `Finiapruval` | `FinnishedMission` _(אחד; מצטבר ע"י `finiapruvals[]`)_ |
| משאב   | **`Mashabetahalich`** _(שלד ריק היום)_ | **`Maap`** _(קיים, כבר בשימוש כקוונטה‑אישור)_ | **`Rikmash`** _(קיים; הופך למצטבר אחד פר‑Mashabetahalich)_ |

**מסקנה תכנונית**: אין צורך להמציא אובייקט אישור חדש (אין סיבה לדחוף `Finiapruval` לזרימה משאבית) — `Maap` הוא **בדיוק** המקבילה הקיימת ל‑Finiapruval. צריך רק שני קישורים חדשים ב‑Strapi (`Maap.mashabetahalich`, `Rikmash.mashabetahalich`) + שדה `cycleIndex` ב‑Maap.

**נקודות אינטגרציה כלל‑אתריות שהמיגרציה חייבת לעדכן (לא רק מוצרים מורכבים):**

- `src/lib/components/lev/*` — כל הרכיבים המציגים משאבים פעילים של החבר (`coinui.svelte`, `pmas.svelte`, `weget.svelte`, `mashsuggest.svelte`, `reqtom.svelte`, `yahalomim.svelte`) — צריכים להציג `Mashabetahalich` חיים, לא רק Maap‑ים סגורים.
- `src/lib/utils/levDataExtractors.ts` + `levProcessors.ts` — שליפת `Mashabetahalich.active` למשתמש + סכימת `quantityDelivered / quantityAssigned`.
- `src/routes/(reg)/moach/[projectId]/chains/[chainId]/+page.svelte` — סרגלי התקדמות משאב חי בתוך chain view.
- `src/routes/(regandnon)/availiableResorce/[id]/+page.svelte` — לאחר אישור Maap הופך קישור ל‑Mashabetahalich ולא ל‑Rikmash סגור.
- **`approveMaap.ts`** (קיים? לבדוק) — צריך לקרוא ל‑`createMashabetahalich`; ה‑Maap הראשון בזרימה הופך ל"Maap קבלה ראשוני" עם `cycleIndex=0`.
- ה‑skill `mcp__1lev1-mcp__*` — ה‑tool שמחזיר משאבים של חבר/פרויקט (`listUserMashabetahalichTool` חדש).
- מוצרים מורכבים (סעיף 2 והלאה) — **רק צרכן אחד** מבין רבים של ה‑Mashabetahalich שיהיה זמין.

**מסלול ההפעלה (Feature Flag):** `resourceLifecycle=on` עומד בפני עצמו. הוא יכול לעלות לפני M2 (יצירת מוצר מורכב) ובלי תלות. M5.5 בלוח המילסטונים מבטא רק את ההפעלה הראשונה של ה‑flag הזה.

## 1.8 הרחבת `api::mashabetahalich.mashabetahalich` (קיים אך ריק)

היום הישות ב‑Strapi רזה: `hoursassigned / howmanyhoursalready / perhour / timers`. **אין** project, kindOf, status, units, member, רישום מחזורים. בקוד היא לא בשימוש בכלל. נהפוך אותה למקבילה של `Mesimabetahalich` עבור משאבים — **מעקב משאב חי לאורך זמן**, עם מחזורי הספקה (שעה / יחידה / יום / חודש / שנה) שניתן לאשר אחד‑אחד **בלי לסגור את המשאב כולו ובלי הצבעה חדשה על קבלתו**.

**שדות חדשים:**
| שדה | סוג | תיאור |
|------|-----|------|
| `name` | String | שם תצוגה (מועתק מ‑Pmash/Mashaabim ביצירה) |
| `kindOf` | enum (mirror של `mashaabim.kindOf`) | סוג המשאב |
| `unit` | enum `['hour','unit','day','week','month','year']` | יחידת מעקב — קובע משמעות של `quantityAssigned` |
| `quantityAssigned` | Decimal | סה"כ יחידות שהובטחו (מכליל את `hoursassigned`) |
| `quantityDelivered` | Decimal | כמה כבר סופק בפועל (מכליל את `howmanyhoursalready`); מתקדם אטומית ב‑`confirmMashabetahalichDelivery` |
| `pricePerUnit` | Decimal | מחיר ליחידה (מכליל את `perhour` למשאבים שאינם שעות) |
| `currency` | Relation with matbea | |
| `start` / `end` | DateTime | חלון פעילות; `end=null` עד `closeMashabetahalich` |
| `recurring` | Boolean default false | אם true → מחזורי הספקה חוזרים אוטומטית בלי קונצנזוס חדש |
| `cycleSize` | Integer default 1 | כל כמה `unit` הוא מחזור (recurring monthly = unit=month, cycleSize=1) |
| `status_mashab` | enum `['draft','active','paused','closed','cancelled']` | מצב המעקב; draft עד אישור Maap, active תוך כדי, closed לאחר השלמה |
| `descrip` | Text | |
| `finnished` | Boolean | mirror ל‑`Mesimabetahalich.finnished` |
| `forappruval` | Boolean | mirror ל‑`Mesimabetahalich.forappruval` |
| `isMust` / `isYesod` | Boolean | mirror ל‑Pmash; נשאב ביצירה |
| `reservedQuantity` | Decimal default 0 | יחידות שכבר "הוזמנו" ע"י מכירות במקביל אך עוד לא אושרו (מניעת over‑booking, ראה 7) |
| `allowOverdelivery` | Boolean default false | אם true → מותר `quantityDelivered > quantityAssigned` (למשל שעות בונוס) |
| `summarizeOnClose` | Boolean default false | ב‑close יוצר Rikmash סיכום כולל |

**יחסים חדשים (מקבילים ל‑`Mesimabetahalich`):**
- `project` → manyToOne (חובה — כיום אין!).
- `pmash` → manyToOne → Pmash (template ref, אם הזרימה התחילה מ‑Pmash).
- `mashaabim` → manyToOne → Mashaabim (library ref).
- `users_permissions_user` (assignedMember) → manyToOne — הספק/חבר הצוות שמספק את המשאב (נמשך מ‑Askm/Maap הראשון).
- `partofs` → manyToMany → Partof — `attachEntityToProcess('mashabetahalich', …)` ביצירה → פותח mapping forum ייעודי.
- `forums` → oneToMany → Forum — דיון על המעקב בכלל (mainForum של ה‑process).
- `maaps` → oneToMany → Maap _(reverse side; הקישור מוגדר ב‑`Maap.mashabetahalich`, ראה 1.9.5)_. **רשימת כל ה‑Maap‑ים שהצביעו על קוונטה במשאב הזה.** ה‑Maap הראשון (cycleIndex=0) הוא ה"Maap קבלה ראשוני" שפתח את ה‑Mashabetahalich; Maap‑ים הבאים הם אישורי מחזור חוזרים.
- `rikmash` → **oneToOne** → Rikmash _(rikmash = הצד היחיד)_ — **ארכיון מצטבר אחד פר‑Mashabetahalich**, מקביל מדויק ל‑`Mesimabetahalich.finnished_missions` (ראו 1.9). מתעדכן ב‑`updateRikmashFromMaap` כל פעם ש‑Maap מאושר; **לא נוצרים Rikmash‑ים חדשים פר‑מחזור.**
- `seeders`, `timers` (קיים) → נשארים.

> שינוי משמעותי מהגרסה הקודמת של המסמך: **אין `finiapruvals`** על Mashabetahalich, **אין `rikmashes` רבים**. Maap הוא אובייקט האישור (קיים, יש לו vots), Rikmash הוא ארכיון מצטבר יחיד.

**אילוצים:**
- `quantityDelivered + reservedQuantity <= quantityAssigned + epsilon` (אלא אם `allowOverdelivery=true`).
- ב‑`status='closed'`: אסור ליצור `Maap` חדש על ה‑Mashabetahalich.
- `recurring=true` ⇒ חובה `cycleSize >= 1` ו‑`unit ∈ {day,week,month,year}`.

## 1.9 הרחבת `api::rikmash.rikmash` (קיים) — **ארכיון מצטבר אחד, לא רבים**

היום `Rikmash` הוא ארכיון "סגירת המשאב" — אחד פר‑Maap (oneToOne). זו הייתה התנהגות נכונה כשהמודל היה Maap=סגירה‑סופית. כעת, כש‑Maap מייצג **קוונטה אחת** מתוך רבות, נשמור על **ארכיון אחד פר‑Mashabetahalich** שמצטבר — בדיוק כמו `FinnishedMission` שמצטבר ע"י `finiapruvals[]`.

**מתבנית המשימות:**

```
Mesimabetahalich ──► FinnishedMission (1) ◄── Finiapruval[] (רבים, מצטברים על אותו FinnishedMission)
Mashabetahalich  ──► Rikmash         (1) ◄── Maap[]         (רבים, מצטברים על אותו Rikmash)
```

**שדות חדשים:**
| שדה | סוג | תיאור |
|------|-----|------|
| `mashabetahalich` | **oneToOne** → Mashabetahalich _(mashabetahalich = הצד היחיד)_ | המעקב שאליו שייך הארכיון. ה‑link הקריטי. |
| `quantityDelivered` | Decimal | **סה"כ מצטבר** של כל מה שאושר עד כה (Σ `Maap.quantityDelivered` של מאושרים) — שווה תמיד ל‑`mashabetahalich.quantityDelivered` (מ‑1.8). |
| `cyclesCount` | Integer | כמה מחזורים אושרו (Σ Maap.archived=true) — cache, לא חובה. |
| `deliveries` | **Component repeatable** `{cycleIndex, deliveredAt, quantity, maap (relation→Maap), confirmedBy (relation→users_permissions_user), linkedSheirutFulfillment (relation→sheirut-fulfillment), note}` | יומן כל הקוונטות. מתעדכן ב‑append כל פעם ש‑`Maap` מאושר. ה‑array מאפשר תצוגת timeline מבלי להריץ עוד query נפרד על Maap‑ים. |
| `firstDeliveryAt` / `lastDeliveryAt` | DateTime | cache לחיפוש מהיר. |
| `summary` | Text | סיכום חופשי שנכתב ב‑`closeMashabetahalich`. |

**ה‑oneToOne הקיים `Maap.rikmash`:**
- היום: 1 Maap = 1 Rikmash.
- חדש: **כל ה‑Maaps תחת אותו Mashabetahalich מצביעים לאותו Rikmash.** ה‑oneToOne ב‑Strapi הופך ל‑manyToOne (`Maap.rikmash = manyToOne → Rikmash`, ו‑`Rikmash.maaps = oneToMany ← Maap` — reverse side).
- migration: ל‑Maap‑ים קיימים שכבר יש להם Rikmash 1:1 — נשאיר את הקישור, ה‑manyToOne פשוט מכליל את הסמנטיקה.

**שדות קיימים שנשארים:** `name`, `kindOf`, `agprice`, `hm`, `isMust`, `isYesod`, `price`, `total`, `sqadualed`, `sqadualef`, `spnot`, `users_permissions_user`, `project`, `maap` (oneToOne ל‑Maap הראשון/קבלה — נשמר לתאימות), `open_mashaabim`, `sp`, `haamadas`. הם מתעדכנים פעם אחת ביצירת ה‑Rikmash (יחד עם ה‑Mashabetahalich), ולא משתנים פר‑Maap.

**תאימות לאחור:** Rikmash קיים בלי `mashabetahalich`: ה‑UI החדש יראה אותו כ‑single‑cycle archive (`deliveries=[]`, `cyclesCount=1`). migration רטרואקטיבי (ראה 9) ייצור Mashabetahalich סגור עבורו כדי לאחד את התצוגה.

## 1.9.5 הרחבת `api::maap.maap` (קיים)

`Maap` היום הוא "Maap קבלה" — הצבעה אחת על קבלת משאב, oneToOne ל‑Rikmash. נהפוך אותו ל**קוונטת אישור** שיכולה לחזור על עצמה תחת אותו Mashabetahalich. אובייקט ה‑Maap בעצמו לא משתנה משמעותית — רק מקבל קישור ל‑Mashabetahalich ומטא‑דאטה של מחזור.

**שדות חדשים:**
| שדה | סוג | תיאור |
|------|-----|------|
| `mashabetahalich` | manyToOne → Mashabetahalich _(mashabetahalich = הצד היחיד)_ | המעקב שעליו ה‑Maap מצביע. **השדה הקריטי שמחבר את הכול.** |
| `cycleIndex` | Integer | סדר הקוונטה: 0 = Maap קבלה ראשוני (פותח את ה‑Mashabetahalich); 1, 2, 3… = מחזורי הספקה. |
| `cycleStart` / `cycleEnd` | DateTime | חלון הקוונטה. |
| `quantityDelivered` | Decimal | כמה יחידות הקוונטה הזו מאשרת (לא חובה לכל ה‑Maap‑ים — ל‑cycleIndex=0 אפשר להשאיר null). |
| `unit` | enum (mirror של `mashabetahalich.unit`) | יחידה — נשאב אוטומטית מ‑Mashabetahalich, אבל מאפשר override (לדוגמה, מחזור בודד ב‑days כש‑mashabetahalich הוא months). |
| `linkedSheirutFulfillment` | manyToOne → sheirut-fulfillment | אופציונלי — אם הקוונטה נוצרה מ‑sale של מוצר מורכב המחויב על Mashabetahalich. |
| `isAcceptanceMaap` | Boolean default false | מסמן את ה‑Maap הראשוני (cycleIndex=0); משמש לסינון UI מהיר. |

**שדות קיימים נשארים:** `name`, `archived`, `vots` (Component הצבעות), `pmash`, `sp`, `open_mashaabim`, `rikmash`, `timegrama`, `partofs`, `isSelfProposal`. **כל זרימת ההצבעה הקיימת על Maap (`addVote`, ספירת קונצנזוס, `archived=true` בקבלת קונצנזוס) ממשיכה לעבוד בלי שינוי** — מה שמשתנה זה ה‑side‑effect של ההצבעה (במקום ליצור Rikmash חדש, מוסיף entry ל‑`Rikmash.deliveries` של ה‑Mashabetahalich).

**שינוי בהתנהגות `Maap.archived`:**
- היום: `archived=true` = "ה‑Maap הזה אושר וה‑Rikmash נוצר".
- חדש: `archived=true` = "הקוונטה הזו אושרה". ה‑Mashabetahalich נשאר חי כל עוד יש מקום ל‑Maaps חדשים, ונסגר רק ע"י `closeMashabetahalich`.

## 1.10 זרימת משאב לאורך זמן (Resource Lifecycle)

**עיקרון**: כל קוונטת הספקה היא `Maap` עם vots; הצבעה אחת לכל קוונטה. אין הצבעה גלובלית "על המשאב". ה‑Mashabetahalich הוא רק מצב המעקב; ה‑Rikmash הוא הארכיון המצטבר היחיד.

```
Pmash (template, אופציונלי, עובר הצבעה אם רוצים לקבעו)
   │
   ▼
Open_mashaabim ───► Askm (בקשת ספק)
                       │
                       ▼ (יוצר Maap ראשוני: cycleIndex=0, isAcceptanceMaap=true)
                     Maap#0 ──vots──► קונצנזוס
                       │
                       ▼ approveMaap(maap#0)
            ┌──────────────────────────────────────┐
            │ side-effect ראשוני (פעם אחת):       │
            │  • createMashabetahalich  →  ms      │
            │  • createRikmash           →  rk     │
            │  • ms.rikmash = rk; rk.mashabetahalich = ms │
            │  • maap#0.mashabetahalich = ms       │
            │  • rk.deliveries += {cycle:0, …}     │
            └──────────────────────────────────────┘
                       │
        ┌──────────────┼──────────────────────┐
        ▼              ▼                      ▼
    Maap#1         Maap#2              … Maap#N
 (cycleIndex=1, (cycleIndex=2,         (cycleIndex=N,
   vots → קונצ׳)   vots → קונצ׳)        vots → קונצ׳)
        │                                     │
        ▼                                     ▼
   approveMaap →                       closeMashabetahalich
   רק side-effects:                   (ms.status='closed',
   • ms.quantityDelivered += q          maap#0.archived נשאר true,
   • rk.deliveries += {cycle:i, …}      כל ה‑Maap‑ים נשארים historic)
   • rk.quantityDelivered += q
   • אם recurring → schedule
     timegrama ל‑Maap#i+1
```

**שלבים:**

0. **Pmash** (אופציונלי) — תבנית.
1. **Open_mashaabim** — פרסום חיפוש ספק (`createResource` קיים). פותח forum mapping.
2. **Askm** — חבר/חיצוני מגיש בקשה (`askForResource` קיים).
3. **Maap קבלה (cycleIndex=0, isAcceptanceMaap=true)** — נוצר מ‑Askm דרך `createMaap` (קיים). מצביעים. **בקבלת קונצנזוס (`approveMaap`) — side‑effect חדש:**
   - יוצר רשומת `Mashabetahalich` (חדש, סעיף 1.8) עם status='active', שדות מועתקים מ‑Maap/Askm/Pmash.
   - יוצר רשומת `Rikmash` (אחת! מצטברת) ומקשר oneToOne ל‑Mashabetahalich.
   - מקשר את Maap#0 ל‑Mashabetahalich.
   - מוסיף entry ל‑`rikmash.deliveries` עבור cycleIndex=0 (אם ה‑Maap הראשוני גם מספק יחידות).
   - `attachEntityToProcess('mashabetahalich', id, projectProcess)` — פותח mapping forum למשאב.
   - אם `recurring=true` → מתזמן `timegrama` ל‑Maap הבא.
4. **Maap מחזור הספקה (cycleIndex≥1)** — לכל מחזור הספקה (חודשי / יחידתי):
   - `createMaapCycle` (חדש): יוצר רשומת `Maap` חדשה תחת אותו `mashabetahalich`, `cycleIndex = lastCycleIndex+1`, `vots=[]`.
   - מצביעים על ה‑Maap **הקוונטה הזו בלבד** — `addVote` הקיים, סף קונצנזוס מ‑`project.settings.deliveryThreshold` (לרוב נמוך יותר מסף קבלה ראשון).
   - **אין הצבעה חדשה על המשאב.** ה‑Maap הוא יחידת ההצבעה.
   - בקבלת קונצנזוס (`approveMaap` הקיים, על Maap לא‑קבלה):
     - `Maap.archived=true`.
     - **side‑effect מצטבר על ה‑Rikmash היחיד**: `rikmash.deliveries += {cycleIndex, deliveredAt, quantity, maap, confirmedBy}`, `rikmash.quantityDelivered += Maap.quantityDelivered`, `rikmash.cyclesCount++`.
     - `mashabetahalich.quantityDelivered += Maap.quantityDelivered`.
     - אם `recurring=true` → מתזמן Maap הבא.
5. **`closeMashabetahalich`** (חדש) — סגירה. טריגרים:
   - (א) `quantityDelivered >= quantityAssigned`.
   - (ב) פעולה ידנית של חבר פרויקט עם vote (יוצרת Maap סגירה מיוחד `isClosingMaap=true`? — או פשוט מצביעים בפורום ה‑mashabetahalich).
   - (ג) `end` הגיע.
   - → `mashabetahalich.status='closed'`, `finnished=true`. `Maap`-ים קיימים נשארים `archived=true` במצבם ההיסטורי. `rikmash.summary` מתעדכן.

**הערה משווה למשימות:** הזרימה הזו מעתיקה 1:1 את `Mesimabetahalich → Finiapruval[] → FinnishedMission`. כל היכן שבמשימות יש `createFiniapruval`/`addVote on Finiapruval`/`finiapruval.archived` — אצל משאבים יש `createMaapCycle`/`addVote on Maap`/`maap.archived`. ה‑side‑effect של `archived=true` הוא זה שמכיל את ההבדל הוויזואלי בלבד (משאב = יחידות, משימה = שעות).

**אינטגרציה למוצרים מורכבים:**
- שורת `matanot-recipe-resource` עם `mode='consumeMashabetahalich'` ו‑`mashabetahalich=<id>` ⇒ כל מכירה גוררת `createMaapCycle` אוטומטי על `quantityPerUnit × salesQuantity`.
- ה‑Maap החדש מקושר ל‑`sheirut-fulfillment.consumedMashabetahalichDeliveries` (1.4), ומ‑Rikmash ל‑`deliveries[*].linkedSheirutFulfillment` — כך גם הכרטיס וגם המוצר רואים את הקוונטה בזמן אמת.
- **אטומיות**: `reservedQuantity` ב‑Mashabetahalich מונע over‑booking — `createSheirutFromComplexMatanot` מקדם `reservedQuantity` ב‑transaction, ו‑`approveMaap` (cycleIndex≥1) מזיז את הסכום מ‑`reserved` ל‑`delivered`.

---

## 2. מטרה ראשונה – יצירת מוצר מורכב + הצבעה + תצוגה ללקוח

### 2.1 שלב A – Action Configs חדשים (server)

כל הקבצים תחת `src/lib/server/actions/configs/`:

1. **`createComplexMatanot.ts`**
   - יוצר Matanot עם `pricingMode='estimated'` ו‑`status='draft'`.
   - קורא ל‑`createProcess` הקיים → מקבל `processId` + `mainForumId`.
   - מקשר `matanot.process = processId` ו‑`matanot.partofs = [processId]`.
   - לכל פריט ב‑`recipeMissions` שב‑request: יוצר רשומת `matanot-recipe-mission` + **יוצר תמיד `pendm` גם כשהמקור הוא template** (pendm מאפשר הגדרות מורחבות: הקצאת `assignedMember`, לוח זמנים, תנאי קבלה). מ‑pendm נוצרת `Mesimabetahalich` לאחר אישור, או קישור ל‑existing אם `consumeExisting`. **כל משימה ומשאב חייבים להיות מקושרים ל‑`assignedMember`**; אם הושאר `null` → הפריט מסומן `openTask=true`/`openResource=true` ומסמן ללקוחות שרכישת המוצר דורשת גיוס משאב נוסף.
   - אותו דבר ל‑`recipeResources` (Maap/Pmash דרך הלוגיקה הקיימת ב‑`createResource.ts`).
   - מחשב `estimatedPrice = Σ(hoursPerUnit × ratePerHour × unitsPerProduct) + Σ(quantityPerUnit × pricePerUnit)` × (1 + marginPct/100).
   - **matanotpend לפני פתיחה (אם יש יותר מחבר פרויקט אחד):**
     יוצר רשומת `matanotpend` (ראה 1.6) שמנהלת את תהליך האישור הפנימי:
     - `timeragram` – טיימר לסבב ההצבעה (ברירת מחדל 72 שעות, ניתן לשינוי בקריאה).
     - `votes` – רשומת הצבעה אחת לכל חבר פרויקט.
     - `nego` – מו"מ ראשוני על פרטי המוצר לפני חשיפה ציבורית.
     - `forum` – דיון פנימי לחברי פרויקט בלבד.
       ה‑matanot נשאר ב‑`status_of_voting='voting'` עד לקבלת קונצנזוס (`matanotpend.status='approved'`).
       **אם חבר פרויקט יחיד** – מדלג על יצירת matanotpend ועובר ישירות ל‑`status_of_voting='active'`.
   - **authRules:** `jwt` + `projectMember`.
   - **notification:** project members → "מוצר חדש להצבעה".

2. **`updateMatanotRecipe.ts`**
   - הוספה/הסרה/עדכון של שורה ב‑recipe (במהלך מו"מ או עריכה לפני הצבעה).
   - re‑calc של `estimatedPrice`.
   - מוגבל לחברי הפרויקט בלבד כל עוד `status='draft'`; כשהמוצר ב‑`voting` נדרשת approval flow (ראה 2.4).

3. **`approveMatanot.ts`**
   - אם המצב `voting` ויש קונצנזוס (לפי כללי ההצבעה הקיימים של project) → מעדכן `status='active'`, `appruved=true`.
   - אם `autoCreateTasks=true` ויש כבר `Mesimabetahalich` ממצב draft → רק מאשר את הסטטוס שלהן.

4. **`createSheirutFromComplexMatanot.ts`** (מטרה 2 – אבל לוגית קשור)
   - וריאציה ל‑`createSheirutpend` הקיים, שיודעת לקרוא את ה‑BOM ולחשב מחיר.
   - יוצרת בנוסף `sheirut-fulfillment` עם רשימת מה שצריך ליצור/לחייב.
   - אם המוצר אושר רק עכשיו ⇒ קוראת ל‑`createTask` (קיים) / `createResource` (קיים) – כל פריט BOM הופך לישות אמיתית בפרויקט.

4.5 **תוספת (M6 pre-step): `createSheirutFromPending` – מה שכבר מיושם**

`createSheirutFromPending` הורחב לזהות `pricingMode !== 'fixed'` ולבצע אוטומטית:
- לכל `matanot_recipe_mission` עם `mode='createNew'` ואין `mesimabetahalich` קיים → יוצר `Mesimabetahalich` (כולל `mission` אם מחובר ל‑Pendm שיש לו mission)
- לכל `matanot_recipe_resource` עם `mode='createNew'` ו‑`pmash` מחובר → יוצר `Maap` על ה‑Pmash
- לכל `Mesimabetahalich` שנוצר (או קיים) → יוצר `Act` תזכורת למאשר: "יש לך מוצר ליצור - [שם מתנה]"

**כיצד להתמודד עם `mesimabetahalich` קיים (mode=`consumeExisting`) — תכנית:**

> **הבעיה**: כשמוכרים מוצר שמחייב משימה קיימת (`consumeExisting`), אנחנו לא רוצים ליצור `Mesimabetahalich` חדש — אנחנו רוצים "לקחת" שעות מקיים. אבל צריך למנוע over-booking אם אותה משימה בשימוש ע"י מוצרים מרובים.

**שלבי המימוש (M6):**

1. **Strapi schema** (בנוסף על מה שיש ב-M1):
   - `Mesimabetahalich.reservedHours` (Decimal, default 0) — שעות שכבר "הוזמנו" ע"י מכירות שעוד לא הושלמו.
   - `SheirutFulfillment.consumedMesimaEntries` (Component repeatable `{mesimabetahalich (relation), hours, reserved, confirmed}`) — רשימת המשימות שנצרכו לטובת מכירה זו.

2. **לוגיקת אישור** (ב-`createSheirutFromPending` כשהזמן יגיע):
   ```
   availableHours = hoursassinged - howmanyhoursalready - reservedHours
   neededHours = hoursPerUnit * quantity
   
   if (availableHours < neededHours) → שגיאה "אין מספיק שעות פנויות ב-[שם משימה]"
   else → reservedHours += neededHours (אטומי)
   ```

3. **בעת אישור משלוח** (`confirmMesimaDelivery` — עתידי):
   - `howmanyhoursalready += neededHours`
   - `reservedHours -= neededHours`
   - עדכון `SheirutFulfillment.consumedMesimaEntries[i].confirmed = true`
   - אם `howmanyhoursalready >= hoursassinged` → `finnished = true`

4. **Act reminder** — אותו Acts שנוצר ב-`createNew`, רק כש-`consumeExisting` ה-Act מצביע על ה-Mesimabetahalich הקיים: "נוספה עוד מכירה שתלויה ב-[שם משימה] — {neededHours} שעות"

5. **חשוב לממוש**: ה-"אטומיות" ב-Strapi אין לה `BEGIN TRANSACTION` אמיתי. הגישה הפרקטית:
   - בצע `reservedHours += neededHours` ב-mutation אחד לפני יצירת ה-Sheirut.
   - אם יצירת ה-Sheirut נכשלת → יש לשחרר את ה-reservation ב-`catch` block.

5. **`createMatanotNego.ts`** (מטרה 2 – מו"מ פר‑פריט)
   - יוצר `Nego` חדש, מקושר ל‑`recipeMission` או `recipeResource` ספציפיים.
   - פותח forum mapping (`spesificm`) על שיטת `attachEntityToProcess` הקיימת – המשתמש מקבל דיון נפרד לכל פריט.

6. **`createMashabetahalich.ts`** — *לא action ישירה; side-effect של `approveMaap` על Maap קבלה ראשוני (cycleIndex=0)*
   - **שינוי ל‑`approveMaap.ts` הקיים (אם קיים — אחרת יוצרים)**: כשהוא מאשר Maap עם `isAcceptanceMaap=true` (=cycleIndex=0):
     - יוצר `Mashabetahalich` עם `status='active'`, שדות מועתקים מ‑Maap/Askm/Pmash.
     - יוצר `Rikmash` (אחד מצטבר), מקשר oneToOne.
     - מקשר את Maap#0 ל‑Mashabetahalich, מוסיף entry ראשון ל‑`rikmash.deliveries` (אם cycleIndex=0 גם מספק יחידות).
     - `attachEntityToProcess('mashabetahalich', …)` — mapping forum ייעודי.
     - אם `recurring=true` → מתזמן `timegrama` ל‑Maap הבא.
   - **authRules:** `jwt` + `projectMember` (תורש מ‑approveMaap).

7. **`createMaapCycle.ts`** (קוונטה חדשה תחת Mashabetahalich קיים)
   - input: `mashabetahalichId`, `quantityDelivered`, `cycleStart/cycleEnd` (אופציונלי, מחושב מ‑cycleIndex+cycleSize אם חסר), `note`.
   - בודק: Mashabetahalich.status='active', `quantityDelivered + reservedQuantity + thisQ <= quantityAssigned` (אלא אם `allowOverdelivery=true`).
   - יוצר `Maap` חדש (`mashabetahalich=ms.id`, `cycleIndex = (max(Maap.cycleIndex where mashabetahalich=ms.id))+1`, `vots=[]`, `isAcceptanceMaap=false`).
   - **הצבעה ממשיכה דרך `addVote` הקיים על ה‑Maap**, וה‑`approveMaap` הקיים (אחרי הרחבה) מבצע side-effect מצטבר:
     - `rikmash.deliveries += {cycleIndex, deliveredAt, quantity, maap, confirmedBy}`,
     - `rikmash.quantityDelivered += Maap.quantityDelivered`,
     - `mashabetahalich.quantityDelivered += Maap.quantityDelivered`,
     - אם `recurring=true` → מתזמן Maap הבא.
   - **authRules:** `jwt` + (`projectMember` **או** `assignedMember`).

8. **`closeMashabetahalich.ts`**
   - מעדכן `mashabetahalich.status='closed'`, `finnished=true`. **לא נוגע ב‑`Maap.archived`** של Maap‑ים קיימים — הם נשארים historic.
   - אופציונלית — `rikmash.summary` מתעדכן עם סיכום סופי.
   - **authRules:** `jwt` + `projectMember`.

9. **`linkMashabetahalichToRecipeResource.ts`**
   - קושר `matanot-recipe-resource.mashabetahalich = id`, מסמן `mode='consumeMashabetahalich'`, re‑calc `estimatedPrice` (משתמש ב‑`mashabetahalich.pricePerUnit`).
   - בודק שה‑Mashabetahalich שייך לאותו פרויקט כמו ה‑Matanot.
   - **authRules:** `jwt` + `projectMember`, רק אם `Matanot.status_of_voting ∈ {'draft','voting'}`.

> **תיקון לעומת גרסה קודמת:** אין `confirmMashabetahalichDelivery` ואין יצירת `Finiapruval` חדש. כל קוונטה היא `Maap` חדש שעוברת דרך זרימת `addVote`/`approveMaap` הקיימת. ה‑server-side השינוי הקריטי הוא **ב‑`approveMaap`** — שיפעיל את ה‑side-effect המצטבר על Rikmash במקום ליצור Rikmash חדש.

### 2.2 שלב B – רכיב יצירת מוצר (Compose) חדש

מיקום: `src/lib/components/products/ComposeProduct.svelte` (חדש, גלובלי)

- שני מודים: **simple** (משחזר את `newmatana.svelte` הנוכחי, `pricingMode='fixed'`) ו‑**complex**.
- **complex mode**: שני סקציות:
  1. **משימות נדרשות** (`MissionPickerList`) – מאפשר:
     - לבחור משימה קיימת (`Mission`) מהפרויקט + מספר שעות ליחידת מוצר.
     - לבחור משימה בתהליך קיימת (`Mesimabetahalich`) ולקבוע "כל מוצר צורך X שעות מתוכה" – mode=`consumeExisting`.
     - להגדיר משימה חדשה שתיווצר עם אישור המוצר (`createNew`, draft).
  2. **משאבים נדרשים** (`ResourcePickerList`) – באותו עיקרון: existing/new + כמות ליחידה.
- חישוב חי של `estimatedPrice` ושל שדה `marginPct` (slider).
- כפתור "שלח להצבעה" → קורא `createComplexMatanot` ואז עובר ל‑`status='voting'`.
- **גלובליות:** ה‑props של הרכיב הם `projectId, mode, onDone(matanot)`. אפשר להריץ מ‑moach (`/moach/[id]/sales`), מ‑lev, מ‑deals/new, מ‑agent.
- `newmatana.svelte` (הישן) הופך ל‑wrapper דק שטוען את `ComposeProduct` במצב simple. אפשר לאחר זמן להסירו.

### 2.3 שלב C – רכיב תצוגה ציבורית

מיקום: `src/lib/components/products/MatanotPublicView.svelte` (חדש)

- מציג כותרת/תיאור/תמונה כמו היום ב‑`/gift/[id]`.
- **חדש:** אם `pricingMode='estimated'`:
  - מציג טבלת BOM **בקצרה** (משימות + שעות, משאבים + כמות, סה"כ צפוי).
  - מציג את ה‑`mainForumId` של ה‑process כצ׳אט פתוח לדיון/מו"מ ציבורי (read‑only למשתמשים לא מחוברים).
  - לכל שורת BOM – אם המשתמש מחובר ולא חבר פרויקט – כפתור "הגש הצעת מו"מ" שפותח `createMatanotNego`.
  - **משימות/משאבים פתוחים** (`openTask=true` / `openResource=true`): מוצגים בתגית ייחודית "מחפשים ספק" / "טרם שויך". זה מסמן ללקוחות פוטנציאליים שמוצר זה מורכב יותר לקבלה – ייתכן שיש עיכוב עד גיוס המשאב.
- **`/gift/[id]/+page.svelte`** המעודכן מטעין את הרכיב הזה במקום ה‑markup הנוכחי, ועוטף ב‑modal-purchase עבור `fixed`/`estimated`.

### 2.4 שלב D – הצבעה ופורומים

- ה‑`process` של המוצר כבר נותן לנו `mainForumId` (דיון כללי) + יכולת `attachEntityToProcess` עבור כל פריט.
- בכל יצירת `recipeMission`/`recipeResource` עם `mode='createNew'`:
  - אם `Mesimabetahalich` נוצרת → `attachEntityToProcess('mesimabetahalich', …)` פותח לה forum דיון.
  - אם `Pmash` נוצרת → `attachEntityToProcess('pmash', …)` פותח forum mapping.
- ההצבעה משתמשת ב‑`addVote` הקיים על ה‑forum הראשי של ה‑process. בקבלת קונצנזוס → trigger ל‑`approveMatanot`.

### 2.5 שלב E – Routing

- `/gift/[id]` ⇒ מציג גם simple וגם complex.
- `/gift/[id]/edit` (חדש) ⇒ רק לחברי הפרויקט; טוען `ComposeProduct` עם הנתונים הקיימים.
- `/(reg)/moach/[projectId]/sales` כבר קיים – להוסיף כפתור "מוצר מורכב" שמטעין `ComposeProduct mode=complex`.

---

## 3. מטרה שניה – עדכון כרטיסי המכירה/קניה

### 3.1 עדכון `SaleCard.svelte` (צד המוכר/הצוות)

לאחר שיש לנו `sheirut.matanot.pricingMode`, כשטוענים את `buble` במחלץ הנתונים (`levDataExtractors.ts`):

- להעמיד שדות חדשים על buble:
  - `buble.recipeMissions` – רשימה משוטחת של {name, hoursPerUnit, hoursDelivered, status}.
  - `buble.recipeResources` – רשימה משוטחת של {name, quantityPerUnit, delivered, status}.
  - `buble.fulfillmentId` (sheirut-fulfillment.id).
- בגוף הכרטיס, מתחת ל‑Financial Details, להוסיף סקציה חדשה:
  - **משימות שבוצעו** – פס התקדמות לכל פריט (יורש ויזואלית מ‑`MissionList` ב‑deals).
  - **משאבים שנרכשו** – צ׳קיסט עם מחיר.
- כפתור "אישור משלוח" הקיים – נשאר, אבל disabled עד שכל שורת BOM שמסומנת `required=true` מסומנת delivered.
- ה‑Confirm Money button ⇒ ללא שינוי לוגי, פשוט מציג גם total מחושב מ‑BOM.

### 3.2 עדכון `CustomerSaleCard.svelte` (צד הלקוח)

- אותם שדות (`recipeMissions`, `recipeResources`).
- תצוגה: read‑only של ההתקדמות + לכל שורה כפתור "פתח דיון" שפותח את ה‑mapping forum (משתמש ב‑`onChat` הקיים).
- אם `pricingMode='quote'` ועוד אין הסכמה ⇒ במקום "אישור קבלת מוצר" – כפתור "מו"מ" / "הצעה נגדית".

### 3.3 רכיב משותף חדש

מיקום: `src/lib/components/products/MatanotProgress.svelte`

- input: `{ recipeMissions, recipeResources, perspective: 'seller'|'buyer' }`
- output: UI להתקדמות. נשתמש בו גם ב‑SaleCard, גם ב‑CustomerSaleCard, גם ב‑deals/[id].
- מאחד עם `DonutChart` / `MissionList` / `ResourcePanel` הקיימים תחת deals.

### 3.4 הרחבת `levDataExtractors.ts`

היום מחלץ את buble מתוך `sheirut`. צריך להוסיף:

- שליפת `sheirut.matanots.data[0].attributes.pricingMode`.
- שליפת `matanot.recipeMissions / recipeResources`.
- מיפוי `sheirut-fulfillment` ל‑arrays השטוחים.
- כל זה QID חדש – `89queryComplexMatanot` או הרחבת ה‑QID הקיים של sheirut.

---

## 4. מטרה שלישית – אינטגרציה ל‑`/deals/[id]` (החלפת ה‑mock)

### 4.1 שלב A – מכירות פשוטות תחילה

- להחליף את `mockDeals.ts` ב‑service אמיתי `src/lib/services/dealsService.ts` שמקבל `sheirut.id` ומחזיר מבנה תואם ל‑`DealDetailData`.
- מיפוי:
  - `deal.product` ← `sheirut.matanot.name`
  - `deal.totalCost` ← `sheirut-fulfillment.agreedPrice ?? sheirut.total`
  - `deal.paid` ← מוצא דרך `haluka` הקיים
  - `deal.missions.done/total` ← אם המוצר simple = 0/0; אם complex = ספירת recipeMissions לפי status
  - `deal.messages` ← הודעות מ‑`mainForumId` של ה‑process
  - `deal.parties` ← members של הפרויקט + customer (כמו `weFinnishMembers` ב‑SaleCard)
  - `deal.pendingApprovals` ← `negos` במצב open
- `routes/deals/+page.svelte` יקבל את הרשימה כ‑`load` של `+page.server.ts` חדש שקורא לאותו service.

### 4.2 שלב B – פעולות אישור/דחייה

- `ApprovalPanel` היום קורא `handleApprove/Reject` לוקאליים. נחבר אותם ל‑`addVote` (קיים) על מיפוי הפורומים של ה‑process.

### 4.3 שלב C – תמיכת complex

- אחרי שהמוצרים המורכבים עובדים בכלל, ה‑deals גם מציג טבלת BOM אמיתית.
- הרכיב `MissionList` ב‑deals/components כבר מצפה לאותו schema של recipeMissions ⇒ פשוט מזין את אותו array דרך service.

---

## 5. מטרה רחוקה – Agent בצ׳אט שיודע להרכיב מוצר

### 5.1 חשיפת actions ל‑MCP

- כל ה‑action configs החדשים (createComplexMatanot, updateMatanotRecipe, createMatanotNego, approveMatanot) מקבלים registration ב‑`src/lib/server/actions/configs/index.ts` – אוטומטית זמינים לכל קליינט שעובר דרך `/api/v1/actions`.
- להוסיף ב‑`src/lib/mcp/` (חדש או קיים – לבדוק `mcp__1lev1-mcp__*` הקיים) tool wrappers:
  - `composeProductTool` – פרמטרים: projectId, name, recipeMissions[], recipeResources[], marginPct. תחתית פנימית קוראת `createComplexMatanot`.
  - `findAvailableResourcesTool` – שליפת `mashaabims` + `Sp` של חברי הפרויקט.
  - `findAvailableMissionsTool` – שליפת `mesimabetahaliches` של הפרויקט עם שעות פנויות (mission.hoursassinged – howmanyhoursalready).
  - `proposeNegoTool` – יצירת `nego` על שורת BOM.

### 5.2 שיחה מובנית

- ה‑agent ינהל שיחה: "מה רוצה הלקוח?" → מחפש משימות+משאבים זמינים → מציע BOM → קורא `composeProductTool` → מקבל `mainForumId` של ה‑process וממשיך שם.
- כל זה ללא שינוי בקוד ה‑UI – כל פעולה עוברת דרך אותו unified action system.

---

## 6. סדר עבודה מומלץ (Milestones)

| #   | מילסטון                                              | תוצר                                       | פיצ׳ר פלאג                                     |
| --- | ---------------------------------------------------- | ------------------------------------------ | ---------------------------------------------- |
| M1  | סטראפי schema migrate + QIDS                         | Strapi rebuild + types regen               | –                                              |
| M2  | createComplexMatanot + tests                         | Server action שעובד דרך `/api/action`      | `complexProducts=off`                          |
| M3  | ComposeProduct UI + /gift/[id]/edit                  | יצירת מוצר מורכב visible לחברי פרויקט בלבד | `complexProducts.compose=on (project members)` |
| M4  | MatanotPublicView + /gift/[id] update                | תצוגה ציבורית של BOM + פורום ראשי          | `complexProducts.publicView=on`                |
| M5  | approveMatanot + vote flow                           | ההצבעה הופכת draft → active                | `complexProducts.voting=on`                    |
| **M0.5**| **Side-quest: Mashabetahalich כשכבת מעקב כלל‑אתרית (1.7.5–1.10)** | **מסלול עצמאי, יכול לעלות לפני M2:** schema migration ל‑Mashabetahalich/Rikmash/Maap + הרחבת `approveMaap` ל‑side-effect מצטבר + עדכון רכיבי lev/moach/availiableResorce להציג Mashabetahalich חי. אין תלות במוצרים מורכבים. | `resourceLifecycle=on` |
| M5.5| Mashabetahalich integration ב‑Matanot recipe (`linkMashabetahalichToRecipeResource`) | שורות BOM יכולות לצרוך Mashabetahalich קיים | תלות ב‑M0.5 |
| M6  | createSheirutFromComplexMatanot                      | רכישה אמיתית גוררת יצירת tasks/resources + מחזור Rikmash על Mashabetahalich קיים | `complexProducts.purchase=on` |
| M7  | SaleCard + CustomerSaleCard update + MatanotProgress | תצוגת התקדמות בכרטיסים                     | `complexProducts.cards=on`                     |
| M8  | createMatanotNego + מו"מ                             | לקוחות פוטנציאליים יכולים להציע מחיר       | `complexProducts.nego=on`                      |
| M9  | dealsService (simple sales)                          | /deals אמיתי במקום mock לסעיפים פשוטים     | `deals.real=on`                                |
| M10 | dealsService extended (complex)                      | /deals מציג BOM                            | `deals.complex=on`                             |
| M11 | MCP wrappers + agent prompts                         | Agent יכול להרכיב מוצר                     | `agent.composeProduct=on`                      |

---

## 7. סיכונים ועניינים פתוחים

1. **חישוב מחיר עקבי**: היום `newmatana.svelte` מחשב totalV ב‑frontend. ה‑BOM יחושב גם בשרת (במחיר ה‑estimated cached). חשוב שלא יהיו 2 מקורות אמת שונים – המקור הקובע = שרת.
2. **גרסאות BOM**: כשמוצר נמכר ואז ה‑recipe משתנה – המכירות הקודמות צריכות להישאר עם ה‑recipe שהיה בזמן הרכישה. פתרון: `sheirut-fulfillment` שומר snapshot מלא של ה‑BOM (component עם רשימת items + values), לא רק references.
3. **Locking של שעות**: אם משימה בתהליך עם 40 שעות נצרכת ע"י 5 מוצרים שונים, צריך לוגיקה למניעת over‑booking. הצעה: שדה `reservedHours` ב‑`mesimabetahalich` + check אטומי ב‑`createSheirutFromComplexMatanot`.
   - **מקבילה למשאבים**: `reservedQuantity` ב‑`Mashabetahalich` (סעיף 1.8) ממלא את אותו תפקיד למשאב‑בתהליך — `createSheirutFromComplexMatanot` מקדם אטומית, `confirmMashabetahalichDelivery` מזיז מ‑reserved ל‑delivered.
4. **Migration של מוצרים קיימים**: כל הקיימים `fixPrice=true → pricingMode='fixed'`. צריך migration script או default value בסטראפי.
   - **משאבים קיימים**: לכל `Maap.archived=true` עם `rikmash` יחיד — migration script יוצר `Mashabetahalich` רטרואקטיבי עם `quantityAssigned = quantityDelivered = rikmash.total / pricePerUnit`, `status='closed'`, ו‑`cycleIndex=null` ב‑Rikmash הקיים. אופציה: לדלג ולתת UI fallback להציג `Maap.rikmash` הישן כ"מעקב single‑cycle".
5. **i18n**: הוספת `pricingMode/status` ל‑Hebrew/English labels בקובץ `t={}` של כל רכיב.
6. **Tests**: לכל action חדש – `*.test.ts` + `*.integration.test.ts` באותו pattern של `updateTask` / `createResource`.

---

## 8. קבצים שייגעו (best estimate)

### חדשים

- `src/lib/server/actions/configs/createComplexMatanot.ts`
- `src/lib/server/actions/configs/updateMatanotRecipe.ts`
- `src/lib/server/actions/configs/approveMatanot.ts`
- `src/lib/server/actions/configs/createSheirutFromComplexMatanot.ts`
- `src/lib/server/actions/configs/createMatanotNego.ts`
- `src/lib/server/actions/configs/createMaapCycle.ts` _(קוונטה חדשה תחת Mashabetahalich קיים — Maap עם cycleIndex≥1)_
- `src/lib/server/actions/configs/closeMashabetahalich.ts`
- `src/lib/server/actions/configs/linkMashabetahalichToRecipeResource.ts`
- `src/lib/components/process/mashabetahalich/MashabetahalichTracker.svelte` (UI: timeline `rikmash.deliveries[]`, סרגל `quantityDelivered/quantityAssigned`, כפתור "פתח קוונטה" שקורא ל‑`createMaapCycle`; משובץ ב‑lev, ב‑deals/ResourcePanel, ב‑Moach וב‑availiableResorce)
- `src/lib/components/products/ComposeProduct.svelte`
- `src/lib/components/products/MatanotPublicView.svelte`
- `src/lib/components/products/MatanotProgress.svelte`
- `src/lib/components/products/MissionPickerList.svelte`
- `src/lib/components/products/ResourcePickerList.svelte`
- `src/lib/services/dealsService.ts`
- `src/routes/deals/+page.server.ts`
- `src/routes/(regandnon)/gift/[id]/edit/+page.svelte`
- `src/lib/mcp/tools/composeProductTool.ts` (וחברים)

### עריכה

- `src/routes/api/send/qids.js` (+ validator)
- `src/lib/server/actions/configs/index.ts` (registration)
- `src/lib/server/actions/configs/approveMaap.ts` _(הקריטי — שינוי ה‑side-effect: על Maap עם `isAcceptanceMaap=true` יוצר Mashabetahalich+Rikmash; על Maap קוונטה (cycleIndex≥1) מצטבר ל‑rikmash.deliveries במקום ליצור Rikmash חדש)_
- כל רכיבי `src/lib/components/lev/*` שמטפלים במשאבים פעילים (`coinui.svelte`, `pmas.svelte`, `weget.svelte`, `mashsuggest.svelte`, `reqtom.svelte`, `yahalomim.svelte`, `newcoinui.svelte`) — להציג Mashabetahalich חיים במקום רק Maap.archived=false.
- `src/lib/utils/levDataExtractors.ts` + `levProcessors.ts` — שליפת `Mashabetahalich.active` + סכימת `quantityDelivered/quantityAssigned`.
- `src/routes/(regandnon)/availiableResorce/[id]/+page.svelte` — אחרי קונצנזוס מציג Mashabetahalich חי, לא רק Rikmash סופי.
- `src/routes/(reg)/moach/[projectId]/chains/[chainId]/+page.svelte` + `ResourceChainRow.svelte` — סרגל התקדמות משאב חי.
- `src/lib/components/prPr/newmatana.svelte` (wrapper דק)
- `src/routes/(regandnon)/gift/[id]/+page.svelte` (+page.server.js)
- `src/lib/components/lev/cards/SaleCard.svelte`
- `src/lib/components/lev/cards/CustomerSaleCard.svelte`
- `src/lib/utils/levDataExtractors.ts`
- `src/routes/deals/+page.svelte` + `[id]/+page.svelte` (להחליף mock)
- `src/lib/types/index.ts` (Deal, DealDetailData להרחיב)

### מחיקה (אחרי M9)

- `src/lib/data/mockDeals.ts`

---

## 9. הערות הטמעה גלובליות

- כל הרכיבים תחת `src/lib/components/products/` חייבים להיות **stateless logic-wise** – כל ה‑side‑effects דרך actions. זה מה שמאפשר להריץ אותם מצ׳אט ה‑agent ומ‑MCP.
- אסור להוסיף mutations של GraphQL ב‑`.svelte` (כמו ש‑`newmatana.svelte` הקיים עושה היום). הכל דרך `fetch('/api/action')`.
- כל קריאת נתונים מהדפדפן עוברת דרך service ב‑`src/lib/services/` ולא ישירות אל GraphQL.
- Tests: כל action חדש חייב unit + integration לפי הסכמה הקיימת בפרויקט.
- **`Maap.archived` — שינוי סמנטי**: עד היום `archived=true` = "המשאב נסגר וה‑Rikmash שלו נוצר". מ‑M0.5: `archived=true` = "**הקוונטה הזו** אושרה". המשאב נשאר חי כל עוד `Mashabetahalich.status='active'`. קוד שמסנן `Maap.archived=false` ימשיך להציג Maap‑ים פתוחים לקוונטה הבאה — נכון. קוד שמראה "completed maaps" צריך לעבור לקריאה מ‑`mashabetahalich.status='closed'`.
- **`Rikmash` מצטבר, לא ארכיון‑פר‑מחזור**: מקבילה ל‑`FinnishedMission`. הוא מתעדכן ב‑side-effect של `approveMaap` (append ל‑`deliveries[]`, increment ל‑`quantityDelivered`). UI ה‑timeline קורא ישירות את `rikmash.deliveries` — אין שאילתת aggregation על Maap‑ים.
- **`addVote`/`approveMaap` הם המנוע**: אין `Finiapruval` בזרימה משאבית. כל קוונטה היא `Maap` נפרד, ה‑addVote הקיים מצביע עליו, ה‑approveMaap הקיים מבצע את ה‑side-effect (לפי `isAcceptanceMaap`/`cycleIndex`). זה ממזער שינויים ב‑schema (2 קישורים חדשים + 5 שדות ב‑Maap) ובקוד (מסך הראשי הוא `approveMaap` בלבד).
- **רכיב `MashabetahalichTracker.svelte` משותף**: stateless ב‑logic, מקבל `{mashabetahalichId, perspective: 'project'|'vendor'|'customer'}` ומציג: סרגל התקדמות `delivered/assigned`, timeline מ‑`rikmash.deliveries`, רשימת Maap‑ים פתוחים שמחכים להצבעה, כפתור "פתח קוונטה" (אם user מורשה) שקורא `createMaapCycle`, וקישור ל‑mapping forum. משובץ ב‑lev (כתחליף לחלק מ‑`coinui`), ב‑moach, ב‑`deals/[id]/ResourcePanel`, וב‑`MatanotProgress` ללקוח (read-only).
