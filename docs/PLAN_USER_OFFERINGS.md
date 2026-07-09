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

> **הערת ריפו:** `1.0b` בסשן הזה הוא ריפו Strapi **v3** ישן (פורמט `api/*/models/*.json`,
> חסרות ישויות חיות כמו ratson/maagad/sheirut/decision) ואינו משקף את הפרודקשן.
> שינויי הסכמה בסעיף 2 מוגדרים דקלרטיבית — יש להחילם על ה-Strapi v4 החי ואז
> `npm run types:update` בריפו הפרונט.

---

## 1. עיקרון מנחה: "פרסום אישי, עסקה ריקמתית"

מפרידים שתי שכבות:

1. **שכבת פרסום (Publication)** — אישית לגמרי. המשתמש מנהל מהפרופיל:
   משאבים (Sp), משימות שהוא יודע לעשות (`missions_i_can_do`), ומוצרים אישיים
   (Matanot עם `owner_user`). אין צורך בריקמה כדי *להיראות*.
2. **שכבת עסקה (Transaction)** — תמיד רוכבת על ריקמה, כי כל מנגנוני ההסכמה,
   המכירה, ה-tosplit וה-restime בנויים עליה (עקרון "Ride the Decision model").

הגשר בין השכבות: **ריקמה אישית** (`project.isPersonal=true`, חבר יחיד) שנוצרת
**בהסכמת המשתמש** בפעם הראשונה שהוא מפרסם משהו כמוצר ללקוחות ("נקים לך ריקמה
אישית שתנהל את המכירות שלך"). קונצנזוס של חבר-יחיד כבר נתמך בכל המנגנונים
(`createComplexMatanot` מדלג על matanotpend כשיש חבר יחיד; sheirutpend של חבר
יחיד מבשיל מיד) — אז אין צורך בזרימת מכירה חדשה.

שלושה מסלולי עסקה, כולם מתנקזים לריקמה:

| טריגר | ריקמה | סטטוס |
|---|---|---|
| לקוח קונה מוצר אישי ישירות (`/gift/[id]`) | **הריקמה האישית** של המוכר (קיימת כבר מרגע הפרסום) | חדש — סעיף 3.2 |
| קונסיירז' מרכיב תכנית מכמה ספקים | ריקמת שותפים ייעודית — `materializeWish` **ללא שינוי** | קיים ✅ |
| מאגד: הצעת-סף של ספק יחיד מגיעה לקוורום | `ensurePersonalRikma` בזמן `confirmMaagadQuorum` | סוגר פער מתועד — סעיף 3.5 |

למה ריקמה אישית **eager (בזמן פרסום)** ולא lazy (בזמן מכירה ראשונה)?
כל ה-downstream (עמוד gift, sheirutpend, sale, tosplit, פורומים) מניח project.
יצירה בזמן הפרסום — עם מסך הסבר ואישור — מקיימת את "בהתייעצות עם המשתמש",
מפשטת את כל ההמשך לאפס special-cases, וריקמה אחת לכל משתמש (לא לכל מוצר)
מונעת הצפה. ריקמות `isPersonal` מוסתרות מרשימות ריקמות ציבוריות.

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

> המוצר האישי **עדיין מקושר** ל-`projectcreates` (הריקמה האישית) — כל זרימת
> המכירה הקיימת עובדת. `owner_user`/`origin` הם לתצוגה ("נמכר ע"י דנה" במקום שם ריקמה).

### 2.3 `api::mission.mission` — ללא שינוי

`users_can_do`, `kindOf`, `embedding_id`, `synonyms`, `usage_count` כבר קיימים.
תמחור פר-משימה-פר-משתמש נדחה (ראה שאלות פתוחות §8) — מתחילים עם
`user.pricing_pref` (JSON, קיים) ברמת הפרופיל.

### 2.4 `api::project.project`

| שדה | סוג | תיאור |
|---|---|---|
| `isPersonal` | Boolean default false | ריקמה אישית (חבר יחיד, נוצרה אוטומטית). מוסתרת מרשימות ריקמות, moach מציג לה תצוגה מצומצמת. |

### 2.5 `users-permissions-user`

| שדה | סוג | תיאור |
|---|---|---|
| `personal_project` | oneToOne → project | הריקמה האישית (אם נוצרה). idempotency ל-`ensurePersonalRikma`. |

### 2.6 QIDs חדשים (`src/routes/api/send/qids.js`)

- `250listMyOfferings` — פרופיל: sps (עם offerScope+matanot) + missions_i_can_do + מוצרים אישיים, בקריאה אחת.
- `251linkUserToMissions` — bulk update של `missions_i_can_do` (+עדכון `usage_count`). *(= 210 מ-PLAN_ONBOARDING)*
- `252suggestMissionsForUser` — missions לפי overlap כישורים/embedding. *(= 211)*
- `253searchMissionTemplates` — autocomplete על missions (שם + synonyms). *(= 208)*
- `254publishSpAsProduct` — mutation מרוכב: עדכון sp.offerScope + יצירת/ארכוב matanot מקושר.
- `255listPersonalMatanots` — מוצרי `origin='personal'` של משתמש.
- `256mapPersonalOfferings` — שכבת מפה ל-demand: מוצרים אישיים + Sp `offerScope∈{customers,both}` עם מיקום.

---

## 3. Server Actions (Unified Action System)

כל החדשים תחת `src/lib/server/actions/configs/`, רשומים ב-`index.ts` — כך שגם
ה-MCP/agent יוכל להפעיל אותם ("מואץ', פרסם את המקרן שלי כמוצר").

### 3.1 `ensurePersonalRikma.ts`
- idempotent: אם `user.personal_project` קיים — מחזיר אותו.
- אחרת: קורא ל-`createWeave` הקיים (שם: "הריקמה של {username}", `isPersonal=true`,
  restime ברירת-מחדל קצר), מעדכן `user.personal_project`.
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

### 3.4 `setMissionsICanDo.ts`
- input: `missionIds[]` (+ אפשרות ליצור template חדש דרך `createMissionTemplate` הקיים,
  שכבר עובר מודרציה/embedding בצינור vocab).
- מעדכן `missions_i_can_do`, מקדם `usage_count`, ומחזיר את `mission.skills`
  כהצעה (לא אוטומטית) להוספה לכישורי המשתמש — כמתואר ב-PLAN_ONBOARDING §2.2.
- **authRules:** `jwt`.

### 3.5 הרחבת `confirmMaagadQuorum` (ב-`maagad.ts`)
- כשאין `proposer_project`: `ensurePersonalRikma(proposer_user)` → ממשיך למינטינג
  ה-Sheirutpend פר-חבר על הריקמה האישית (מסיר את ה-skip המתועד בקוד).
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

הפרופיל הוא כבר המקום שבו משתמש מנהל משאבים — נשארים שם, לא ממציאים עמוד חדש.
בלוק המשאבים הקיים (ה-`Edit` עם `kish='sps'`) מתרחב למקבץ **"ההיצע שלי"** עם
שלוש לשוניות/כרטיסיות באותה שפה עיצובית:

1. **משאבים** — הרשימה הקיימת. ב-`editsp.svelte`/`newsp.svelte` נוסף שדה בחירה
   "למי מוצע?" — `רקמות בלבד` (ברירת מחדל, ההתנהגות של היום) / `גם ללקוחות ישירות`.
   בחירת "ללקוחות" מחייבת מחיר, ובשמירה קוראת ל-`publishUserResourceAsProduct`.
   בפעם הראשונה — מודאל הסבר: *"כדי לנהל מכירות, נקים לך ריקמה אישית. ההזמנות
   יאושרו על ידך בלבד."* (אישור חד-פעמי).
2. **משימות שאני עושה** — רכיב חדש `MissionsIDoEditor.svelte`
   (`src/lib/components/offerings/`) — autocomplete על mission templates
   (qid 253, חיפוש סמנטי כמו ב-VocabSelector), צ'יפים של הנבחרות, "אולי גם זה?"
   (qid 252), ויצירת template חדש בשם בלבד. זהו בדיוק הרכיב שתוכנן
   ב-PLAN_ONBOARDING M3.5 — נבנה פעם אחת ומשולב גם שם וגם כאן.
3. **המוצרים שלי** — רשימת `origin='personal'` (qid 255) + כפתור "➕ מוצר חדש"
   שפותח את `ComposeProduct` (simple mode) → `createPersonalMatanot`.
   עריכה — `/gift/[id]/edit` הקיים (עובד, כי למוצר יש ריקמה אישית והמשתמש חבר בה).

> **עריכה — נקודה אחת:** כל עריכת מוצר אישי היא `/gift/[id]/edit`; כל עריכת משאב
> היא `editsp` בפרופיל (וה-Matanot המקושר מתעדכן ממנו אוטומטית ב-action);
> משימות נערכות רק כרשימת צ'יפים. אין שני מקומות עריכה לאותו אובייקט.

### 4.2 Onboarding (Track A — ספק)

- **שלב משאבים** (M5 של PLAN_ONBOARDING, `newsp` בתוך wrapper): מוסיפים את אותו
  toggle "גם ללקוחות ישירות" — אותו רכיב, אותו action.
- **שלב חדש — "מה אני יודע לעשות"**: `MissionsIDoEditor` כשלב אחרי ה-review
  (מימוש M3.5). אם עלה CV — ה-tasks המחולצים כבר ממופים ל-missions ומוצגים
  כברירת בחירה.
- **עמוד done**: שני CTA — "פרסם מוצר ראשון" (→ /me#offerings) ו"ראה מה מחפשים
  עכשיו" (→ /demand?lens=supply).

### 4.3 `/demand` — כפתור ההוספה שחסר

- **FAB "➕ הוסיפו את ההיצע שלכם"** — מוצג תמיד, מודגש כשהעדשה supply
  (זה היעד של ה-CTA מ-quorum). אנונימי → `/signup?next=/demand?lens=supply`.
- פותח **`AddSupplySheet.svelte`** (bottom-sheet, `src/lib/components/offerings/`)
  עם ארבעה מסלולים:
  1. **משימה שאני עושה** → `MissionsIDoEditor` (inline, שמירה מיידית).
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
- זרימת הקנייה — ללא שינוי: `createSheirutpend` על הריקמה האישית; אישור המכירה
  הוא של המוכר היחיד (הקונצנזוס של חבר-יחיד מבשיל מיד).

### 4.5 `/user/[id]` — חלון ראווה

העמוד הציבורי כבר טוען `user.sps` — מרחיבים ל"חלון ראווה":
- משאבים עם `offerScope∈{customers,both}` — כרטיס עם מחיר + "הזמן" → `/gift/[matanotId]`.
- "משימות שאני עושה" — צ'יפים; כפתור "בקש דרך הקונסיירז'" → `/concierge/new?provider=[id]`
  (פרה-פילינג של הספק במשאלה).
- מוצרים אישיים — גריד כרטיסים → `/gift/[id]`.

### 4.6 quorum

ללא שינוי בעמוד — ה-CTA הקיים (`/demand?lens=supply`) מקבל סוף-סוף יעד אמיתי (ה-FAB).

---

## 5. זרימת "מישהו בחר בי" — הריקמה מאחורי הקלעים

| תרחיש | מה קורה | מה חדש |
|---|---|---|
| לקוח קונה מוצר אישי | sheirutpend על הריקמה האישית → אישור המוכר → Sheirut → sale/tosplit רגילים | כלום — הריקמה כבר קיימת מהפרסום |
| קונסיירז': משימה/משאב שלי נבחרו לתכנית | `requestWishMission`/`requestWishResource` → אני מאשר ב-`acceptWishOffer` → הלקוח סוגר → `materializeWish` יוצר ריקמת-שותפים ייעודית (אני=חבר) | רק המקורות ל-matching (§3.6); ההסכמה שלי = `acceptWishOffer` הקיים — זו ה"התייעצות עם המשתמש" |
| מאגד: הצעת-הסף שלי הגיעה לקוורום | `confirmMaagadQuorum` → `ensurePersonalRikma` → Sheirutpend פר-חתום על הריקמה האישית | §3.5 — סוגר את הפער המתועד |

עקרון ההסכמה: יצירת ריקמה אוטומטית קורית רק אחרי פעולה מפורשת של המשתמש
(אישור מודאל הפרסום / `acceptWishOffer` / `confirmMaagadQuorum` שהוא עצמו לוחץ) —
לעולם לא בהפתעה.

---

## 6. מיילסטונים ו-feature flags

| # | מילסטון | תוצר | flag |
|---|---|---|---|
| **M0** | סכמה (§2) על Strapi החי + `npm run types:update` + QIDs 250–256 | טיפוסים מעודכנים | – |
| **M1** | `ensurePersonalRikma` + `publishUserResourceAsProduct` + toggle ב-`editsp`/`newsp` + מודאל ההסבר | משאב אישי נמכר כמוצר ב-/gift | `userOfferings.resources` |
| **M2** | `MissionsIDoEditor` + `setMissionsICanDo` + סקשן "ההיצע שלי" ב-/me | פרופיל מציג ומנהל את שלושת הסוגים | `userOfferings.missions` |
| **M3** | `createPersonalMatanot` + "המוצרים שלי" + התאמות `/gift/[id]` (owner_user) | משתמש יוצר ועורך מוצר בלי ריקמה גלויה | `userOfferings.products` |
| **M4** | FAB + `AddSupplySheet` ב-/demand + שכבת `products` במפה (qid 256 + normalizer) | ההבטחה מ-quorum ממומשת | `userOfferings.demandAdd` |
| **M5** | הרחבת `confirmMaagadQuorum` (§3.5) | ספק יחיד במאגד מקבל עסקאות אמיתיות | `userOfferings.maagadSolo` |
| **M6** | מקורות matching לקונסיירז' (§3.6) | משימות/מוצרים אישיים צפים במשאלות | `userOfferings.conciergeMatch` |
| **M7** | חלון ראווה ב-/user/[id] + שלבי onboarding (§4.2) | מסע ספק שלם: הרשמה → פרופיל → היצע → demand | `userOfferings.storefront` |

M1 הוא הניצחון המהיר (הכול קיים חוץ מהשדות וה-action); M2–M4 הם עיקר ה-UI;
M5–M6 סוגרים את לולאות התיווך.

---

## 7. קבצים שייגעו (estimate)

### חדשים — Server
- `src/lib/server/actions/configs/ensurePersonalRikma.ts`
- `src/lib/server/actions/configs/publishUserResourceAsProduct.ts`
- `src/lib/server/actions/configs/createPersonalMatanot.ts`
- `src/lib/server/actions/configs/setMissionsICanDo.ts`
- `src/lib/server/map/normalizeMapItems.js` — normalizer ל-`products`

### חדשים — Components (`src/lib/components/offerings/`)
- `MissionsIDoEditor.svelte` (משמש /me, onboarding, AddSupplySheet)
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
- `src/routes/(reg)/onboard/provider/**` — שלב missions + toggle במשאבים
- `src/routes/api/send/qids.js` — QIDs 250–256
- `src/lib/server/actions/configs/index.ts` — רישום 4 actions
- `src/lib/translations/**` — he/en/ar לכל המחרוזות החדשות
- Strapi (v4 החי): `sp`, `matanot`, `project`, `user` (§2)

---

## 8. סיכונים ושאלות פתוחות

1. **תמחור פר-משימה** — `missions_i_can_do` הוא בוליאני; מחיר לשעה חי ברמת
   הפרופיל (`pricing_pref`). אם יתברר שספקים רוצים מחיר שונה למשימות שונות —
   ישות `mission-offer {user, mission, perHour, note}` בשלב עתידי. **החלטה נדרשת: האם לדחות?** (המלצה: לדחות.)
2. **הצפת ריקמות אישיות** — כל מקום שמציג רשימות ריקמות (lev, רשימת moach,
   demand, חיפוש) חייב לסנן `isPersonal=true` או למתג אחרת. לעבור על כל ה-queries בעת M1.
3. **מודרציה** — מוצר אישי חשוף לציבור בלי הצבעת חברים; `screenLabel` רץ inline
   ב-actions (§3.2/3.3), ומוצר מסומן נשמר unpublished + טלגרם לבעלים (כמו vocab).
4. **כפילות Sp↔Matanot** — עריכת Sp חייבת לסנכרן את ה-Matanot המקושר (name/price/pic)
   בתוך ה-action, לא בקליינט; אחרת יסטו.
5. **מחיקת/ארכוב Sp שפורסם** — `archiveUserResource` יורחב לארכב גם את ה-Matanot
   המקושר ולבדוק שאין Sheirut פעיל עליו (אם יש — חסימה עם הסבר).
6. **1.0b** — ריפו ה-Strapi בסשן זה ישן (v3); אין לבצע בו שינויי סכמה. מקור האמת
   לסכמה הוא ה-instance החי + `src/generated/`.
7. **i18n** — כל המחרוזות (טוגלים, מודאל ההסבר, FAB, שכבת מפה) ב-he/en/ar מיום ראשון.
