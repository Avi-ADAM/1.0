# תכנית היצע אישי — משאבים, משימות ומוצרים של משתמש יחיד (User Offerings)

> תכנית בלבד — בלי קוד. נכתב: 2026-07-09.
> משלים את [PLAN_ONBOARDING.md](./PLAN_ONBOARDING.md), [PLAN_CONCIERGE.md](./PLAN_CONCIERGE.md),
> [PLAN_COMPLEX_PRODUCTS.md](./PLAN_COMPLEX_PRODUCTS.md) ו-[PLAN_DISCOVERY_MAP.md](./PLAN_DISCOVERY_MAP.md) — לא מחליף.

---

## 0. הבעיה ואבחון המצב הקיים (מהקוד)

**הבעיה:** היום מתנה (Matanot), משימה (open-mission) ומשאב (open-mashaabim) נוצרים רק
על ידי ריקמות. ספק יחיד — פרילנסר, בעל ציוד, נותן שירות — אין לו דרך להציע את עצמו
ללקוחות בלי לפתוח ריקמה, ליצור בה מתנה, ואם זה שירות מבוסס-משימה — לפתוח מוצר מורכב
ולקשר. בעמוד `/quorum` אנחנו מבטיחים לספקים "הוסיפו את עצמכם" ושולחים ל-`/demand?lens=supply`
(שורה ~179 ב-`src/routes/quorum/+page.svelte`), אבל בעמוד demand אין שום כפתור הוספה.

מה כבר קיים ומה חסר, לפי שכבה:

| שכבה | מה קיים בפועל | הפער |
|---|---|---|
| **משאב אישי (Sp)** | CRUD מלא ב-`/me` (`userPr/newsp.svelte`, `editsp.svelte`, `edit.svelte`), `createSp`/`updateSp`, `archiveUserResource` action, יצירה גם ב-onboarding (`/api/onboard/save`). הקונסיירז' כבר משתמש ב-Sp `panui=true` כמקור גראונדינג להצעות. | Sp מוגדר רק כ"נתינה כשותפות ברקמות". אין דרך לפרסם אותו כמוצר שלקוח מזמין ישירות. |
| **משימות שאני עושה** | `user.missions_i_can_do` + `mission.users_can_do` (+`kindOf`, `embedding_id`, `synonyms`, `usage_count`) **כבר בסכמת Strapi** (הוכנו ב-PLAN_ONBOARDING §2.2/M3.5). | **אפס שימוש בפרונט** — אין עורך (`MissionsIDoEditor` לא נבנה), אין QIDs (208–211 לא נרשמו), לא מוצג בפרופיל ולא ב-onboarding. |
| **מוצר אישי (Matanot)** | `Matanot` נטוע בפרויקט (`projectcreates`); יצירה מ-`prPr/newmatana.svelte` בתוך moach; קנייה ב-`/gift/[id]` → `createSheirutpend` שדורש project. | אין `owner_user`, אין מסלול יצירה/עריכה למשתמש בלי ריקמה. |
| **demand / quorum** | `/demand` — מפת discovery עם עדשות join/supply (`PLAN_DISCOVERY_MAP`). עדשת supply מציגה open-missions/open-mashaabims של ריקמות + מאגדים. | אין CTA הוספה. ההבטחה של quorum ("ספקים — פרסמו הצעת סף") לא ממומשת מהעמוד. |
| **מאגד — ספק יחיד** | `createMaagadOffer` **כבר תומך** בספק יחיד (`proposer_user` בלי `proposer_project`) וגם ב-Track C (מאגד חדש ביוזמת ספק). | `confirmMaagadQuorum` מדלג על יצירת Sheirutpend כשאין `proposer_project` (מתועד בהערת קוד ב-`maagad.ts`) — ההצעה "מופעלת" אבל אף עסקה לא נוצרת בפועל. |
| **קונסיירז' — ריקמה מאחורי הקלעים** | `materializeWish` (qids 166/167/168) **כבר יוצר ריקמת שותפים ייעודית**: ספקים=חברים, לקוח=לקוח, המוצר המורכב מתארח עליה, `createSheirutFromPending` מפעיל BOM. | זו בדיוק התבנית שצריך למחזר; חסר רק שהמקורות האישיים (missions_i_can_do, מוצרים אישיים) ייכנסו ל-matching (פער §4 ב-PLAN_CONCIERGE). |

> **הערת ריפו:** בריפו ה-Strapi (`1.0b`) הענף החי הוא **`shabab`** (v4,
> `src/api/*/content-types/*/schema.json`); `master` הוא v3 ישן. כל שינוי סכמה
> מתבצע על בסיס `shabab` (ראה `CLAUDE.md` שם), ואחרי deploy —
> `npm run types:update` בריפו הפרונט.

---

## 1. עיקרון מנחה: "פרסום אישי, עסקה ריקמתית"

מפרידים שתי שכבות:

1. **שכבת פרסום (Publication)** — אישית לגמרי. המשתמש מנהל מהפרופיל:
   משאבים (Sp), משימות שהוא יודע לעשות (`missions_i_can_do`), ומוצרים אישיים
   (Matanot עם `owner_user`). אין צורך בריקמה כדי *להיראות*.
2. **שכבת עסקה (Transaction)** — תמיד רוכבת על ריקמה, כי כל מנגנוני ההסכמה,
   המכירה, ה-tosplit וה-restime בנויים עליה (עקרון "Ride the Decision model").

הגשר בין השכבות: **ריקמה רגילה לכל דבר** שנוצרת **בהסכמת המשתמש** בפעם
הראשונה שהוא מפרסם משהו כמוצר ללקוחות ("נקים לך ריקמה שתנהל את המכירות שלך").
היא מתחילה עם חבר אחד, אבל **אין לה שום סטטוס מיוחד או נוקשה** — כל החוקים
במערכת ממילא בודקים כמה חברים יש בריקמה ורק אז מפעילים מו"מ/הצבעה
(`createComplexMatanot` מדלג על matanotpend כשיש חבר יחיד; sheirutpend של חבר
יחיד מבשיל מיד). זה מכוון: **אנחנו תמיד רוצים שת"פים** — הריקמה שנוצרה היא
נקודת פתיחה להזמנת שותפים, לא "חשבון עצמאי" סגור. ה-UI יעודד את זה
(CTA "הזמן שותפים לריקמה" אחרי הפרסום הראשון), וברגע שמצטרף חבר שני כל
מנגנוני הקונצנזוס נדלקים מעצמם.

שלושה מסלולי עסקה, כולם מתנקזים לריקמה:

| טריגר | ריקמה | סטטוס |
|---|---|---|
| לקוח קונה מוצר אישי ישירות (`/gift/[id]`) | **ריקמת הבית** של המוכר (קיימת כבר מרגע הפרסום) | חדש — סעיף 3.2 |
| קונסיירז' מרכיב תכנית מכמה ספקים | ריקמת שותפים ייעודית — `materializeWish` **ללא שינוי** | קיים ✅ |
| מאגד: הצעת-סף של ספק יחיד מגיעה לקוורום | `ensurePersonalRikma` בזמן `confirmMaagadQuorum` | סוגר פער מתועד — סעיף 3.5 |

למה יצירה **eager (בזמן פרסום)** ולא lazy (בזמן מכירה ראשונה)?
כל ה-downstream (עמוד gift, sheirutpend, sale, tosplit, פורומים) מניח project.
יצירה בזמן הפרסום — עם מסך הסבר ואישור — מקיימת את "בהתייעצות עם המשתמש",
מפשטת את כל ההמשך לאפס special-cases, וריקמה אחת לכל משתמש (לא לכל מוצר)
שומרת על סדר. `user.personal_project` משמש רק ל-idempotency ("כבר יש לך
ריקמת בית — נשתמש בה"), לא לסימון הריקמה כסוג נפרד.

---

## 2. שינויי Strapi (סכמה)

### 2.1 `api::sp.sp` — משאב אישי

| שדה | סוג | תיאור |
|---|---|---|
| `offerScope` | enum `['rikma','customers','both']` default `'rikma'` | למי המשאב מוצע. `rikma` = ההתנהגות הקיימת (שידוך לרקמות בלבד). |
| `matanot` | oneToOne → matanot *(sp = הצד היחיד)* | המוצר שנוצר כשהמשאב פורסם ללקוחות (ראה 3.2). null כל עוד `offerScope='rikma'`. |

> ללא שינוי בשדות הקיימים (`panui`, `price`, `kindOf`, `location`, `pics`…).
> `panui` ממשיך לסמן זמינות לשידוך ריקמות; `offerScope` הוא ציר נפרד.

### 2.2 `api::matanot.matanot` — מוצר אישי

| שדה | סוג | תיאור |
|---|---|---|
| `owner_user` | manyToOne → users-permissions-user | הבעלים כשהמוצר אישי. null = מוצר ריקמה רגיל. |
| `origin` | enum `['project','personal','wish']` default `'project'` | מקור המוצר — לסינון, מיתוג ואנליטיקס. `wish` = derivedComplexMatanot של קונסיירז'. |
| `sp` | reverse של 2.1 | — |

> המוצר האישי **עדיין מקושר** ל-`projectcreates` (ריקמת הבית) — כל זרימת
> המכירה הקיימת עובדת. `owner_user`/`origin` הם לתצוגה ("נמכר ע"י דנה" במקום שם ריקמה).

### 2.3 ישות חדשה: `api::mission-offer.mission-offer` — הצעת-משימה מתומחרת

**הוחלט (2026-07-09): התמחור הוא פר-משימה**, והעריכה נעשית עם **טופס המשימה
הקיים** (`prPr/mission.svelte`) כי יש בו את הפרטים החשובים — מיקום, כמות שעות,
תעריף, כישורים/תפקידים. לכן לא מסתפקים ב-`missions_i_can_do` הבוליאני אלא
מוסיפים ישות הצעה מובנית:

| שדה | סוג | תיאור |
|---|---|---|
| `users_permissions_user` | manyToOne → user (inversedBy `mission_offers`) | הספק |
| `mission` | manyToOne → mission (inversedBy `mission_offers`) | טמפלט המשימה — נדרש ל-discovery (skills/tafkidims דרכו); אם אין — נוצר "בשם בלבד" בצינור `createMissionTemplate` |
| `name` / `descrip` | String / Text | ניסוח אישי (ברירת מחדל מהטמפלט) |
| `hours` | Decimal | היקף טיפוסי/מינימלי |
| `perhour` / `price` | Decimal | תעריף לשעה או מחיר קבוע |
| `currency` | manyToOne → matbea | |
| `location` | Component `new.location` | כמו בטופס המשימה |
| `active` / `archived` | Boolean | זמינות / ארכוב |
| `note` | Text | |

`missions_i_can_do` הקיים נשאר כאינדקס קל (מתעדכן אוטומטית ב-action בכל
יצירת/ארכוב offer) — כך מסלולי ה-matching שכבר תוכננו עליו ממשיכים לעבוד.

### 2.4 `users-permissions-user`

| שדה | סוג | תיאור |
|---|---|---|
| `personal_project` | oneToOne → project (חד-כיווני) | ריקמת הבית שנוצרה אוטומטית — ל-idempotency בלבד, לא סימון סוג. |
| `mission_offers` | oneToMany ← mission-offer | reverse |
| `owned_matanots` | oneToMany ← matanot.owner_user | reverse |

> **אין `project.isPersonal`** — הריקמה שנוצרת היא ריקמה רגילה שמתחילה עם חבר
> אחד; החוקים בודקים מספר חברים, לא דגל. (הוחלט 2026-07-09.)

### 2.5 סטטוס מימוש הסכמה

**בוצע** בענף `claude/user-resource-product-offerings-6fudv7` בריפו `1.0b`
(מבוסס `shabab`): sp.offerScope + sp.matanot, matanot.owner_user/origin/sp,
user.personal_project/mission_offers/owned_matanots, mission.mission_offers,
collection `mission-offer` מלא + `CLAUDE.md` המתעד את הענף החי.

### 2.6 QIDs חדשים (`src/routes/api/send/qids.js`)

- `250listMyOfferings` — פרופיל: sps (עם offerScope+matanot) + mission_offers + מוצרים אישיים, בקריאה אחת.
- `251createMissionOffer` / `252updateMissionOffer` (כולל ארכוב) — הצעת-משימה + סנכרון `missions_i_can_do` ו-`usage_count`.
- `253searchMissionTemplates` — autocomplete על missions (שם + synonyms). *(= 208 מ-PLAN_ONBOARDING)*
- `254publishSpAsProduct` — mutation מרוכב: עדכון sp.offerScope + יצירת/ארכוב matanot מקושר.
- `255listPersonalMatanots` — מוצרי `origin='personal'` של משתמש.
- `256mapPersonalOfferings` — שכבת מפה ל-demand: מוצרים אישיים + Sp `offerScope∈{customers,both}` + mission-offers פעילים עם מיקום.
- `257suggestMissionsForUser` — missions לפי overlap כישורים/embedding. *(= 211)*
- `258maagadSupplySuggestions` — היצע רלוונטי למאגד (ראה §4.7): מתנות פרויקטים + מתנות/משאבים/הצעות-משימה של משתמשים לפי קטגוריות/סמנטיקה.

---

## 3. Server Actions (Unified Action System)

כל החדשים תחת `src/lib/server/actions/configs/`, רשומים ב-`index.ts` — כך שגם
ה-MCP/agent יוכל להפעיל אותם ("מואץ', פרסם את המקרן שלי כמוצר").

### 3.1 `ensurePersonalRikma.ts`
- idempotent: אם `user.personal_project` קיים — מחזיר אותו.
- אחרת: קורא ל-`createWeave` הקיים (שם: "הריקמה של {username}" — ניתן לשינוי,
  restime ברירת-מחדל קצר), מעדכן `user.personal_project`. **ריקמה רגילה** —
  בלי דגל מיוחד; פתוחה להזמנת שותפים כמו כל ריקמה.
- **authRules:** `jwt` (על עצמו בלבד).

### 3.2 `publishUserResourceAsProduct.ts`
- input: `spId`, `offerScope`, `price?`, `descrip?`.
- אם עוברים ל-`customers`/`both`: `ensurePersonalRikma` → יוצר `Matanot`
  (`origin='personal'`, `owner_user`, `fixPrice=true`, `pricingMode='fixed'`,
  name/desc/pic/price/location מועתקים מה-Sp, `projectcreates=[personalRikma]`,
  `sp=spId`) → מעדכן `sp.offerScope` + `sp.matanot`.
- חזרה ל-`rikma`: מארכב את ה-Matanot (`archived=true`), לא מוחק (שירותים חיים עליו).
- מודרציה: מריץ `screenLabel` (מ-`src/lib/server/vocab/moderation.ts`) על name+descrip
  לפני פרסום — אותו צינור של VOCAB_UNIFIED, לא ניתן לעקיפה.
- **authRules:** `jwt` + בעלות על ה-Sp.

### 3.3 `createPersonalMatanot.ts`
- וריאציה דקה של יצירת מתנה: `ensurePersonalRikma` → מריץ את מסלול היצירה הקיים
  (simple mode של `ComposeProduct`/`newmatana`) עם `origin='personal'`+`owner_user`.
- מכיוון שיש חבר יחיד — אין matanotpend, המוצר `active` מיד.
- **authRules:** `jwt`.

### 3.4 `createMissionOffer.ts` / `updateMissionOffer.ts`
- input: הפלט של `prPr/mission.svelte` ב-specMode (`{name, descrip, hours,
  ratePerHour, skills, roles, workways}` + location) + `missionId?` /
  `price?` / `currencyId?`.
- אם אין `missionId` — יוצר template דרך `createMissionTemplate` הקיים (שכבר
  עובר מודרציה/embedding בצינור vocab) ומקשר.
- יוצר/מעדכן `mission-offer`; מסנכרן `missions_i_can_do` + `usage_count`;
  מחזיר את `mission.skills` כהצעה (לא אוטומטית) לכישורי המשתמש —
  כמתואר ב-PLAN_ONBOARDING §2.2. ארכוב offer מסיר מ-`missions_i_can_do`
  אם אין offer פעיל אחר על אותו טמפלט.
- **authRules:** `jwt` + בעלות.

### 3.5 הרחבת `confirmMaagadQuorum` (ב-`maagad.ts`)
- כשאין `proposer_project`: `ensurePersonalRikma(proposer_user)` → ממשיך למינטינג
  ה-Sheirutpend פר-חבר על ריקמת הבית שלו (מסיר את ה-skip המתועד בקוד).
- אין שינוי בפרמטרים — שקוף לקליינט.

### 3.6 הרחבת מקורות ה-matching של הקונסיירז'
- ה-enrichment (`/api/concierge-extract` + `matchRatson`) יכלול:
  - **מוצרים אישיים** — היום ההצמדה היא ל"מוצרים שפרויקט יצר"; מוסיפים `origin='personal'`.
  - **ספקי משימות** — `mission.users_can_do` כמקור ספקים לכל שורת משימה
    (משלים את פער §4 ב-PLAN_CONCIERGE: "קישור-טמפלט בפרופיל" כמקור גראונדינג).
- `materializeWish` — ללא שינוי.

---

## 4. UI — מיקום ושילוב

### 4.1 `/me` — סקשן "ההיצע שלי" (העוגן המרכזי)

> **עדכון (2026-07-13, פידבק עיצוב):** בפרופיל עצמו אין נדל"ן לרשימות מלאות —
> נשארות רק **תגיות קומפקטיות** (`OfferingsBadges`): אייקון + מונה + פלוס.
> מוצרים ← מונה כל המוצרים מכל הרקמות, קישור ל-`/sales-center` (שכבר מרכז את
> כולם, כולל האישיים דרך ריקמת הבית), ופלוס שפותח את `CreateProductFlow` —
> בחירה "ריקמה חדשה / קיימת" ומיד טופס המוצר, עם **טיוטה** ב-localStorage.
> משימות ← מונה הצעות+בביצוע, תג ✓N למשימות שהושלמו, קישור ל-`/me/offerings`
> (הצעות + בביצוע + הושלמו-ואומתו) ופלוס שפותח שם את הטופס.
> הרשימות המלאות שלהלן חיות בדפי ההרחבה וב-onboarding, לא בפרופיל.

הפרופיל הוא כבר המקום שבו משתמש מנהל משאבים — נשארים שם, לא ממציאים עמוד חדש.
בלוק המשאבים הקיים (ה-`Edit` עם `kish='sps'`) מתרחב למקבץ **"ההיצע שלי"** עם
שלוש לשוניות/כרטיסיות באותה שפה עיצובית:

1. **משאבים** — הרשימה הקיימת. ב-`editsp.svelte`/`newsp.svelte` נוסף שדה בחירה
   "למי מוצע?" — `רקמות בלבד` (ברירת מחדל, ההתנהגות של היום) / `גם ללקוחות ישירות`.
   בחירת "ללקוחות" מחייבת מחיר, ובשמירה קוראת ל-`publishUserResourceAsProduct`.
   בפעם הראשונה — מודאל הסבר: *"כדי לנהל מכירות, נקים לך ריקמה אישית. ההזמנות
   יאושרו על ידך בלבד."* (אישור חד-פעמי).
2. **משימות שאני עושה** — רכיב חדש `MissionOffersEditor.svelte`
   (`src/lib/components/offerings/`): רשימת ההצעות הקיימות (שם, תעריף, מיקום,
   active) + "➕ הצעה חדשה" שפותח את **טופס המשימה הקיים**
   (`prPr/mission.svelte` ב-specMode — יש בו כבר מיקום, שעות, תעריף,
   כישורים/תפקידים) עם autocomplete על templates (qid 253) ו"אולי גם זה?"
   (qid 257). שמירה → `createMissionOffer`. זו הגרסה המתומחרת של
   `MissionsIDoEditor` מ-PLAN_ONBOARDING M3.5 — נבנה פעם אחת ומשולב גם
   ב-onboarding וגם כאן.
3. **המוצרים שלי** — רשימת `origin='personal'` (qid 255) + כפתור "➕ מוצר חדש"
   שפותח את `ComposeProduct` (simple mode) → `createPersonalMatanot`.
   עריכה — `/gift/[id]/edit` הקיים (עובד, כי למוצר יש ריקמה אישית והמשתמש חבר בה).

> **עריכה — נקודה אחת:** כל עריכת מוצר אישי היא `/gift/[id]/edit`; כל עריכת משאב
> היא `editsp` בפרופיל (וה-Matanot המקושר מתעדכן ממנו אוטומטית ב-action);
> משימות נערכות רק כרשימת צ'יפים. אין שני מקומות עריכה לאותו אובייקט.

### 4.2 Onboarding (Track A — ספק)

- **שלב משאבים** (M5 של PLAN_ONBOARDING, `newsp` בתוך wrapper): מוסיפים את אותו
  toggle "גם ללקוחות ישירות" — אותו רכיב, אותו action.
- **שלב חדש — "מה אני יודע לעשות"**: `MissionOffersEditor` (טופס המשימה) כשלב אחרי ה-review
  (מימוש M3.5). אם עלה CV — ה-tasks המחולצים כבר ממופים ל-missions ומוצגים
  כברירת בחירה.
- **עמוד done**: שני CTA — "פרסם מוצר ראשון" (→ /me#offerings) ו"ראה מה מחפשים
  עכשיו" (→ /demand?lens=supply).

### 4.3 `/demand` — כפתור ההוספה שחסר

- **FAB "➕ הוסיפו את ההיצע שלכם"** — מוצג תמיד, מודגש כשהעדשה supply
  (זה היעד של ה-CTA מ-quorum). אנונימי → `/signup?next=/demand?lens=supply`.
- פותח **`AddSupplySheet.svelte`** (bottom-sheet, `src/lib/components/offerings/`)
  עם ארבעה מסלולים:
  1. **משימה שאני עושה** → `MissionOffersEditor` (טופס המשימה, שמירה מיידית).
  2. **משאב** → `newsp` + toggle הלקוחות (אותם רכיבים מהפרופיל).
  3. **מוצר** → `ComposeProduct` simple → `createPersonalMatanot`.
  4. **הצעת-סף למאגד** → מסלול Track C הקיים (`createMaagadOffer` עם `newMaagad`) —
     כאן ההבטחה של quorum ("פרסם הצעת סף") מתממשת בפועל.
- **שכבת מפה חדשה `products`** בעדשת join (צבע חדש ב-`LAYER_COLORS`): מוצרים
  אישיים + Sp המוצעים ללקוחות, עם מיקום/isOnline (qid 256 → normalizer חדש
  ב-`normalizeMapItems.js`). `href` → `/gift/[id]`. לא מערבבים עם `offers`
  (שמורה להצעות-סף של מאגדים — סמנטיקה שונה).
- עדשת supply נשארת "מה מבוקש" (הזדמנויות לספקים) — ההוספה היא ה-FAB, לא שכבה.

### 4.4 `/gift/[id]` — מוצר אישי

- כשיש `owner_user` (`origin='personal'`): מציגים את המשתמש כמוכר (שם, תמונה,
  קישור ל-`/user/[id]`) במקום שם הריקמה; באדג' "ספק עצמאי".
- זרימת הקנייה — ללא שינוי: `createSheirutpend` על ריקמת הבית; אישור המכירה
  הוא של המוכר היחיד (הקונצנזוס של חבר-יחיד מבשיל מיד).

### 4.5 `/user/[id]` — חלון ראווה

העמוד הציבורי כבר טוען `user.sps` — מרחיבים ל"חלון ראווה":
- משאבים עם `offerScope∈{customers,both}` — כרטיס עם מחיר + "הזמן" → `/gift/[matanotId]`.
- "משימות שאני עושה" — כרטיסי mission-offer (שם, תעריף, מיקום); כפתור
  "בקש דרך הקונסיירז'" → `/concierge/new?provider=[id]` (פרה-פילינג של הספק במשאלה).
- מוצרים אישיים — גריד כרטיסים → `/gift/[id]`.

### 4.6 quorum

ללא שינוי בעמוד — ה-CTA הקיים (`/demand?lens=supply`) מקבל סוף-סוף יעד אמיתי (ה-FAB).

### 4.7 `/maagad/[id]` — היצע מוצע למאגד (ביקוש פוגש היצע)

היום עמוד המאגד מציג רק את הצעות-הסף (MaagadOffer) שהוגשו. מוסיפים סקשן
**"היצע קיים שמתאים לביקוש הזה"** שמציג — לפי קטגוריות/סמנטיקה
(`canonical_desc` + `pinecone_id` של המאגד, כמו הגראונדינג של הקונסיירז'):

1. **מתנות של פרויקטים** (matanot רגילים) — מה שריקמות כבר מוכרות ומתאים לביקוש.
2. **מתנות של משתמשים** (matanot `origin='personal'`).
3. **משאבים של משתמשים** (Sp עם `offerScope∈{customers,both}`).
4. **הצעות-משימה של משתמשים** (mission-offers פעילים).

(qid 258 `maagadSupplySuggestions`; חישוב server-side ב-load של העמוד או
ב-cron של המאגד, עם cache קצר.)

לכל פריט שני מצבים לפי הצופה:
- **חבר מאגד** רואה "זה מה שחיפשתם?" — קישור לפריט (`/gift/[id]` / פרופיל הספק).
- **בעל הפריט** (או כל ספק) רואה CTA **"הגש כהצעת-סף"** — פותח את
  `createMaagadOffer` הקיים עם פרה-פילינג מהפריט (title, unitPrice מהמחיר,
  description). כלומר ההצעה הרשמית תמיד עוברת דרך מנגנון ההצעות של המאגד
  (מחיר, מינימום, דדליין) — הסקשן הוא גשר discovery, לא מסלול מכירה עוקף.

בנוסף, notification לבעלי היצע תואם כשנפתח מאגד חדש ("יש ביקוש קבוצתי שמתאים
למה שאתה מציע") — משתמש באותו מנוע התאמה, מדורג לפי match_score.

---

## 5. זרימת "מישהו בחר בי" — הריקמה מאחורי הקלעים

| תרחיש | מה קורה | מה חדש |
|---|---|---|
| לקוח קונה מוצר אישי | sheirutpend על ריקמת הבית → אישור המוכר → Sheirut → sale/tosplit רגילים | כלום — הריקמה כבר קיימת מהפרסום |
| קונסיירז': משימה/משאב שלי נבחרו לתכנית | `requestWishMission`/`requestWishResource` → אני מאשר ב-`acceptWishOffer` → הלקוח סוגר → `materializeWish` יוצר ריקמת-שותפים ייעודית (אני=חבר) | רק המקורות ל-matching (§3.6); ההסכמה שלי = `acceptWishOffer` הקיים — זו ה"התייעצות עם המשתמש" |
| מאגד: הצעת-הסף שלי הגיעה לקוורום | `confirmMaagadQuorum` → `ensurePersonalRikma` → Sheirutpend פר-חתום על ריקמת הבית | §3.5 — סוגר את הפער המתועד |

עקרון ההסכמה: יצירת ריקמה אוטומטית קורית רק אחרי פעולה מפורשת של המשתמש
(אישור מודאל הפרסום / `acceptWishOffer` / `confirmMaagadQuorum` שהוא עצמו לוחץ) —
לעולם לא בהפתעה.

---

## 6. מיילסטונים ו-feature flags

| # | מילסטון | תוצר | flag |
|---|---|---|---|
| **M0** | סכמה (§2 — כבר בענף ב-1.0b) → merge ל-`shabab` + deploy + `npm run types:update` + QIDs 250–258 | טיפוסים מעודכנים | – |
| **M1** ✅ | `ensurePersonalRikma` + `publishUserResourceAsProduct` + בחירת "למי מוצע?" ב-`editsp`/`newsp` (עוצבו מחדש ככרטיסים מודרניים עם i18n ותיקון גובה) | משאב אישי נמכר כמוצר ב-/gift | `userOfferings.resources` |
| **M2** ✅ | `MissionOffersEditor` (עוטף את טופס המשימה ב-specMode) + `createMissionOffer`/`updateMissionOffer` (QIDs 258–264) + סקשן ב-/me | פרופיל מציג ומנהל משאבים + הצעות-משימה | `userOfferings.missions` |
| **M3** ✅ | `createPersonalMatanot`/`archivePersonalMatanot` + סקשן "המוצרים שלי" ב-/me + מוכר אישי ב-`/gift/[id]` (qids 265–266) | משתמש יוצר ועורך מוצר בלי ריקמה גלויה | `userOfferings.products` |
| **M4** ✅ | FAB "הוסיפו את ההיצע שלכם" + `AddSupplySheet` ב-/demand (עוגני `/me#my-*`; הצעת-סף → תצוגת מאגדים במפה) + שכבת `products` בעדשת join (qid 269 + `normalizeProduct`, מוצרי ריקמות ומוצרים אישיים) | ההבטחה מ-quorum ממומשת | `userOfferings.demandAdd` |
| **M5** ✅ | הרחבת `confirmMaagadQuorum` (§3.5, qid 267) — ריקמת בית לספק יחיד + עסקאות | ספק יחיד במאגד מקבל עסקאות אמיתיות | `userOfferings.maagadSolo` |
| **M6** ✅ | מקורות matching לקונסיירז' (§3.6): ספקי mission-offers ממוזגים ל-people ב-`enrichWish` (qid 270); מוצרים אישיים כבר נתפסים ע"י `203findMatanotByText` (active + לא-archived) | משימות/מוצרים אישיים צפים במשאלות | `userOfferings.conciergeMatch` |
| **M7** ✅ | `UserStorefront` ב-/user/[id] (qid 268) + שלב "מה תרצו להציע?" ב-onboarding הספק (`/onboard/provider/offers`, אחרי review, ניתן לדילוג) + דלת "לראות מה מחפשים" בעמוד הסיום → `/demand?lens=supply` | מסע ספק שלם: הרשמה → פרופיל → היצע → demand | `userOfferings.storefront` |
| **M8** ✅ (v1 מילות-מפתח) | סקשן "היצע קיים שמתאים" בעמוד המאגד (qids 203+271): מוצרים + הצעות-משימה לפי שם/קטגוריות, באדג' "שלי" לספק + CTA להצעת-סף. **שדרוג עתידי:** התאמה סמנטית (pinecone_id) + פרה-פילינג הטופס. | ביקוש קבוצתי פוגש היצע קיים | `userOfferings.maagadSupply` |

M1 הוא הניצחון המהיר (הכול קיים חוץ מהשדות וה-action); M2–M4 הם עיקר ה-UI;
M5–M6 ו-M8 סוגרים את לולאות התיווך.

---

## 7. קבצים שייגעו (estimate)

### חדשים — Server
- `src/lib/server/actions/configs/ensurePersonalRikma.ts`
- `src/lib/server/actions/configs/publishUserResourceAsProduct.ts`
- `src/lib/server/actions/configs/createPersonalMatanot.ts`
- `src/lib/server/actions/configs/createMissionOffer.ts` / `updateMissionOffer.ts`
- `src/lib/server/map/normalizeMapItems.js` — normalizer ל-`products`

### חדשים — Components (`src/lib/components/offerings/`)
- `MissionOffersEditor.svelte` (עוטף את `prPr/mission.svelte` בspecMode; משמש /me, onboarding, AddSupplySheet)
- `AddSupplySheet.svelte`
- `MyOfferingsSection.svelte` (המקבץ ב-/me)
- `PersonalSellerBadge.svelte` (ל-/gift ו-/user)

### עריכה
- `src/lib/components/userPr/newsp.svelte`, `editsp.svelte` — שדה offerScope + קריאת action
- `src/routes/(reg)/me/+page.svelte` + `+page.server.js` — סקשן ההיצע (qid 250)
- `src/routes/(regandnon)/demand/+page.svelte` + `+page.server.ts` — FAB + שכבה
- `src/lib/map/discoveryTypes.ts` — `MapLayerId` + `LAYER_COLORS` + `LENS_LAYERS`
- `src/routes/(regandnon)/gift/[id]/+page.svelte` — תצוגת מוכר אישי
- `src/routes/(regandnon)/user/[id]/+page.svelte` — חלון ראווה
- `src/lib/server/actions/configs/maagad.ts` — §3.5
- `src/lib/server/actions/configs/{matchRatson,requestSuggestion}.ts` + `/api/concierge-extract` — §3.6
- `src/routes/(regandnon)/maagad/[id]/+page.svelte` + `+page.server.ts` — §4.7
- `src/routes/(reg)/onboard/provider/**` — שלב missions + toggle במשאבים
- `src/routes/api/send/qids.js` — QIDs 250–258
- `src/lib/server/actions/configs/index.ts` — רישום ה-actions החדשים
- `src/lib/translations/**` — he/en/ar לכל המחרוזות החדשות
- Strapi (`1.0b` ענף `shabab`): `sp`, `matanot`, `user`, `mission`, `mission-offer` (§2 — **בוצע**)

---

## 8. סיכונים ושאלות פתוחות

1. ~~תמחור פר-משימה~~ — **הוכרע (2026-07-09): כן, פר-משימה**, דרך ישות
   `mission-offer` (§2.3) והטופס הקיים של המשימה (מיקום, שעות, תעריף).
2. **עידוד שת"פים** — הריקמה שנוצרת היא ריקמה רגילה וגלויה; במקום להסתיר,
   ה-UI מזמין להוסיף שותפים (CTA אחרי פרסום ראשון). לוודא שהיא לא מציפה
   רשימות בצורה מבלבלת (למשל למיין לפי פעילות, לא לפי תאריך יצירה).
3. **מודרציה** — מוצר אישי חשוף לציבור בלי הצבעת חברים; `screenLabel` רץ inline
   ב-actions (§3.2/3.3), ומוצר מסומן נשמר unpublished + טלגרם לבעלים (כמו vocab).
4. **כפילות Sp↔Matanot** — עריכת Sp חייבת לסנכרן את ה-Matanot המקושר (name/price/pic)
   בתוך ה-action, לא בקליינט; אחרת יסטו.
5. **מחיקת/ארכוב Sp שפורסם** — `archiveUserResource` יורחב לארכב גם את ה-Matanot
   המקושר ולבדוק שאין Sheirut פעיל עליו (אם יש — חסימה עם הסבר).
6. **i18n** — כל המחרוזות (טוגלים, מודאל ההסבר, FAB, שכבת מפה, סקשן המאגד)
   ב-he/en/ar מיום ראשון.
