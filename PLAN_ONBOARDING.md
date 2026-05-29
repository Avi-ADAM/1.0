# תכנית הרשמה ואונבורדינג — Fast Signup + Branched Onboarding

> נכתב: 2026-05-19
> משלים את [PLAN_CONCIERGE.md](./PLAN_CONCIERGE.md) ואת [PLAN_COMPLEX_PRODUCTS.md](./PLAN_COMPLEX_PRODUCTS.md) — לא מחליף.
> מטרה: לפתוח את הדלת מהר ככל האפשר (פתיחת חשבון = מייל+סיסמה בלבד), ואז להפנות את המשתמש למסלול אונבורדינג מותאם לסוג הספק שהוא — כדי שהקונסיירז' יוכל לשדך אותו לפרויקטים ולקוחות תוך דקות, לא ימים.

---

## 0. אבחון המצב הקיים

### 0.1 התהליך הנוכחי (לפני השינוי)

| שלב | רכיב              | מה קורה                                                                                  |
| --- | ----------------- | ---------------------------------------------------------------------------------------- |
| 0   | `hello.svelte`    | מסך פתיחה — לחיצה על המפתח, אנימציה ארוכה (~16ש')                                        |
| 1   | `vallues.svelte`  | בחירת ערכים                                                                              |
| 2   | `skills.svelte`   | בחירת כישורים                                                                            |
| 3   | `roles.svelte`    | בחירת תפקידים                                                                            |
| 4   | `workways.svelte` | בחירת דרכי עבודה                                                                         |
| 5   | `password.svelte` | userName + email + password → `POST /api/auth/local/register` (שולח **את כל** השדות יחד) |
| 6   | מסך תודה          | "מייל אישור נשלח"                                                                        |

המסלול חי דרך `Bein.svelte` (mode=`registration`) ומסונכרן ע"י store `show`.

**הבעיות**:

1. **5 שלבי תוכן לפני שיש בכלל חשבון** — נטישה מסיבית. כל מי שלא משלים את כולם — נעלם.
2. **כפל**: `/onboard` היום הוא בדיוק אותם 4 שלבים שוב (`mode='onboarding'`, מתחיל מ‑step=1) — מבלבל את מי שכבר עבר את התהליך.
3. ה‑register endpoint **כבר מקבל** את כל השדות (skills, tafkidims, work_ways, vallues, cuntries) — אז כשהמשתמש מגיע ל‑`/onboard` הוא ממלא אותם מחדש בלי שיודעים מה כבר ב‑DB.
4. אין הסתעפות בכלל לסוג ספק: יחיד (פרילנסר/שכיר‑לשעבר) מול בעלי עסק קיים.
5. `cvupload.svelte` קיים, גמור, מחובר ל‑workflow ב‑Mastra (`/api/analyze-cv`) — **אבל לא משולב באף route**.

### 0.2 הנכסים שכבר קיימים (ולא דורשים בנייה)

| נכס                                              | מיקום                                                                                                        | מצב                                            |
| ------------------------------------------------ | ------------------------------------------------------------------------------------------------------------ | ---------------------------------------------- |
| ניתוח CV → skills/roles/methods/tasks + matching | `cvupload.svelte` + `/api/analyze-cv` + Mastra workflow `analyze-cv`                                         | **מוכן, לא משולב**                             |
| יצירת פרויקט עם URL params                       | `createProjectTool.ts` → `/me?action=createproject&name=…`                                                   | **קיים**                                       |
| יצירת מוצר פשוט                                  | `newmatana.svelte`                                                                                           | קיים                                           |
| יצירת מוצר מורכב                                 | מתוכנן ב‑PLAN_COMPLEX_PRODUCTS §2.1 (`createComplexMatanot`)                                                 | **נבנה**                                       |
| יצירת פרויקט מתיאור חופשי ע"י AI                 | `createProjectTool` + bot                                                                                    | **קיים**                                       |
| **משאבים אישיים לשיתוף (Sp)**                    | `src/lib/components/userPr/{newsp,editsp,edit}.svelte` + `api::sp.sp` + mutation `createSp`/`updateSp`       | **מוכן ומשולב ב‑/me — רק להוסיף ל‑onboarding** |
| Profile editor מלא                               | `src/lib/components/userPr/edit.svelte` (משלב SkillSelector, ValueSelector, RoleSelector, Workway, Need, Sp) | **קיים**                                       |

---

## 1. ארכיטקטורה החדשה

### 1.1 תרשים זרימה ברמת על

```
   ┌──────────────────────────────┐
   │  /  (landing)                │
   │  או  /signup                  │
   └───────────────┬──────────────┘
                   │
                   ▼
   ┌──────────────────────────────┐
   │  Step 1: Email + Password    │  ← רק זה!
   │  (מייל + 8 תווים + אות גדולה) │
   └───────────────┬──────────────┘
                   │ POST /api/auth/local/register
                   │ (minimal payload)
                   ▼
   ┌──────────────────────────────┐
   │  "בדקו את המייל"             │
   │  (Strapi שולח confirmation)  │
   └───────────────┬──────────────┘
                   │ user clicks link
                   ▼
   ┌──────────────────────────────┐
   │  /onboard  (post-confirm)    │
   │  שאלת ה‑Fork:                │
   │  ┌─────────┐  ┌────────────┐ │
   │  │ אני נותן │  │ אני בעל   │ │
   │  │ שירות    │  │ עסק קיים   │ │
   │  │ /פרילנסר │  │ /שותפות   │ │
   │  └────┬────┘  └─────┬──────┘ │
   └───────┼─────────────┼────────┘
           ▼             ▼
    Track A          Track B
   (Provider)       (Business)
```

### 1.2 Track A — מסלול נותן שירות (יחיד)

```
/onboard?track=provider
   │
   ├─► A1. בחירה: "להעלות קורות חיים" / "למלא ידנית"
   │        ↓ (אם CV)            ↓ (אם ידני)
   │   cvupload.svelte         vallues → skills → roles → workways
   │        │                       │
   │        ▼                       │
   │   review (קיים)          ←─────┘
   │   - matched (אוטומטי)
   │   - suggestions (אישור)
   │   - new items
   │   - tasks (חדש: רשימת משימות שאני יודע לעשות)
   │        │
   │        ▼
   ├─► A2. רשימת משאבים שאני יכול לשתף (Sp)
   │       שילוב newsp.svelte הקיים (לא לבנות חדש)
   │        │
   │        ▼
   ├─► A3. (אופציונלי) זמינות + מיקום + תמחור בסיסי
   │        │
   │        ▼
   └─► /me  (פרופיל מלא)
```

### 1.3 Track B — מסלול בעל עסק / שותפות

```
/onboard?track=business
   │
   ├─► B1. בחירה: "יש לי אתר/קישור" / "תאר במילים שלי" / "אני אמלא ידנית"
   │        ↓                      ↓                       ↓
   │  scrape + AI            AI מתיאור חופשי           formal form
   │   (חדש)                  (קיים — bot)              (קיים — /me?action=createproject)
   │        │                      │                       │
   │        └──────────────┬───────┴───────────────────────┘
   │                       ▼
   │                 פרויקט שנוצר עם
   │                 name/desc/details/values/url
   │                       │
   │                       ▼
   ├─► B2. הקפצה אוטומטית לדף יצירת מוצר ראשון
   │       (בחירת מסלול: simple / complex)
   │        │
   │        ▼
   │   simple (קיים newmatana)   או   complex (תכנון §2.1 ב-PLAN_COMPLEX_PRODUCTS)
   │        │                              │
   │        ▼                              ▼
   │   מוצר ראשון נוצר ←────────────────────┘
   │        │
   │        ▼
   ├─► B3. הזמנת שותפים (אופציונלי)
   │        │
   │        ▼
   └─► /moach/[projectId]/main
```

> **הערה אדריכלית**: Track B דורש שגם בעל העסק עצמו ימלא בסיס פרופיל אישי, אבל **רק את ה‑vallues** (כי שותפות = ערכים משותפים). Skills/Roles עוברים אליו ב‑background — כי הוא קודם כל יוצר ישות עסק, לא מציע את עצמו. אפשר להציע לו "השלם פרופיל אישי" כ‑CTA קטן ב‑/me.

---

## 2. שינויי Strapi

### 2.1 `api::users-permissions-user.users-permissions-user` — שדות חדשים

| שדה                 | סוג                                                                                          | תיאור                                                |
| ------------------- | -------------------------------------------------------------------------------------------- | ---------------------------------------------------- |
| `onboarding_track`  | enum `['provider','business','unset']` default `unset`                                       | המסלול שהמשתמש בחר                                   |
| `onboarding_status` | enum `['signed_up','email_pending','email_confirmed','profile_basic','profile_full','done']` | התקדמות (לרזולוציה במייל confirmation flow)          |
| `cv_url`            | Media (file)                                                                                 | אופציונלי, ה‑CV המקורי שהועלה                        |
| `cv_extraction`     | JSON                                                                                         | תוצאת ה‑extraction (raw) של ה‑LLM                    |
| `cv_extracted_at`   | DateTime                                                                                     | קאש                                                  |
| `missions_i_can_do` | manyToMany → `mission`                                                                       | משימות (mission templates) שאני יודע לעשות — ראה 2.2 |
| `availability_pref` | JSON                                                                                         | זמינות (days/hours/range)                            |
| `pricing_pref`      | JSON                                                                                         | תמחור בסיסי (perHour, perTask)                       |

> **חשוב**: השדות `sps` (קיים — relations ל‑`api::sp.sp`) ו‑`needs` כבר מטפלים במשאבים אישיים. **אין צורך** ב‑component חדש `shareable-resource` — המודול הקיים `newsp.svelte`/`editsp.svelte` עובד מול ישות `Sp` הקיימת בסטראפי. צריך רק לחבר אותו ל‑onboarding flow.

> **`auto_created_via` `enum`** — flag חדש לאנליטיקס: מאיזה מסלול הפרופיל / הפרויקט הראשון נוצר (`'manual' | 'cv' | 'url_scrape' | 'description_ai' | 'onboarding_wizard'`).

### 2.2 שימוש חוזר ב‑`api::mission.mission` הקיים (במקום ישות task חדשה)

`mission` הקיים כבר entity ספרייתי עם `missionName`, `descrip`, `skills` (manyToMany), `tafkidims` (manyToMany → roles) — בדיוק מה שצריך כדי לסמן "משימות שאני יודע לעשות". יצירת ישות `task` חדשה היתה כפילות.

**היתרונות של שימוש ב‑mission**:

1. **משימה כבר _כוללת_ כישורים ותפקידים** — "עיצוב לוגו" כ‑mission מכיל את ה‑skills שלה (Illustrator, branding, typography) ואת ה‑tafkidims (designer). ספק שמסמן "אני יודע לעשות X" מקבל את הכישורים שלה כהצעה אוטומטית לפרופיל.
2. **Bidirectional discovery חינם**:
   - "מי יודע לעצב לוגו?" → `mission.users_can_do` (relation חדש; ראה למטה).
   - "מה אני יודע לעשות?" → `user.missions_i_can_do`.
   - "אילו משימות מתאימות לכישורים שלי?" → join דרך `mission.skills ⋂ user.skills`.
3. **CV extraction → mission matching**: `cvupload` היום מחזיר `tasks: string[]`. במקום לשמור כטקסט — match כל מחרוזת מול `mission` קיים (embedding/fuzzy). מה שמתאים → relation. מה שלא → יצירת mission "draft" חדש.
4. **קונסיירז' (PLAN_CONCIERGE) כבר עובד עם missions** — ב‑Ratson יש `extracted_missions[]`, ה‑matchRatson כבר משווה מול mission entities. זה אומר שספק שסימן `missions_i_can_do` → אוטומטית מועמד לכל Ratson שמשימותיו מופיעות שם.
5. **משימות מוצעות לספק** ("אולי גם זה?"): query `mission` שב‑`skills`/`tafkidims` שלהן יש overlap גבוה עם הפרופיל → "אנשים עם כישורים דומים סימנו גם את אלו".

**הרחבות נדרשות ב‑`api::mission.mission`** (מינימליות — ה‑schema כבר עשיר):

| שדה (חדש)      | סוג                                                                | תיאור                         |
| -------------- | ------------------------------------------------------------------ | ----------------------------- |
| `users_can_do` | manyToMany → users-permissions-user (mappedBy `missions_i_can_do`) | ה‑inverse של השדה החדש ב‑user |

| `kindOf` | enum `['skill_task','admin','creative','physical','digital','other']` | קטגוריית‑על קצרה — שימושית ל‑grouping ב‑UI |
| `embedding_id` | String | Pinecone — לזיהוי מהיר של missions דומות (לצורך match מ‑CV) |
| `synonyms` | JSON (array of strings) | "עיצוב לוגו" / "logo design" / "branding visual" — עוזר ב‑match |
| `usage_count` | Integer default 0 | cache: כמה משתמשים סימנו `missions_i_can_do` — ל‑sorting |

> שאר השדות (`missionName`, `descrip`, `skills`, `tafkidims`) כבר קיימים — אין צורך לגעת.

### 2.3 ישות חדשה: `api::business-import-job.business-import-job`

לוג של scraping/AI‑gen בעל עסק (Track B1).

| שדה                          | סוג                                                                    |
| ---------------------------- | ---------------------------------------------------------------------- |
| `user`                       | manyToOne → users-permissions-user                                     |
| `source_url`                 | String                                                                 |
| `source_text`                | Text                                                                   |
| `status`                     | enum `['pending','scraped','generated','accepted','rejected','error']` |
| `extracted_project`          | JSON (proposed project payload)                                        |
| `extracted_products`         | JSON (proposed matanot[])                                              |
| `created_project`            | manyToOne → project                                                    |
| `error`                      | Text                                                                   |
| `started_at` / `finished_at` | DateTime                                                               |

> זה ה‑state machine ל‑Track B1.

### 2.4 QIDs חדשים ב‑`src/routes/api/send/qids.js`

- `200signupMinimal` — register endpoint עם email+password בלבד (wrapper דק).
- `201chooseTrack` — מעדכן `onboarding_track` + `onboarding_status='profile_basic'`.
- `202updateProvider` — מעדכן availability_pref, pricing_pref (skills/roles/values עוברים דרך actions קיימים).
- `203attachCvExtraction` — שומר את ה‑JSON מ‑`/api/analyze-cv` ל‑user (במקום ל‑user-profiles כמו היום).
- `204createBusinessImportJob` — Track B1.
- `205executeBusinessImport` — מריץ scrape + AI (אם source_url) או רק AI (אם source_text), מחזיר extracted_project + extracted_products.
- `206acceptBusinessImport` — יוצר את הפרויקט + מוצרים מתוך job, מקשר ל‑user.
- `207markOnboardingDone` — `onboarding_status='done'`.
- `208searchMissionTemplates` — חיפוש missions לפי שם/embedding (ל‑TasksEditor).
- `209createMissionTemplate` — wrapper של `createMission` שמפעיל embed.
- `210linkUserToMissions` — bulk update של `user.missions_i_can_do` (וגם push לכישורי הספק את ה‑skills של ה‑missions שנבחרו, עם hint לאישור — לא אוטומטית).
- `211suggestMissionsForUser` — מחזיר missions שדומות לפרופיל המשתמש (skills overlap או embedding על CV text).

> **אין QID חדש למשאבים אישיים** — `createSp`/`updateSp` כבר קיימים ועובדים מ‑`newsp.svelte`.

---

## 3. Server Actions חדשים

תחת `src/lib/server/actions/configs/`:

1. **`signupMinimal.ts`** — register עם email+password בלבד. שולח confirmation email (Strapi config).
2. **`completeProviderOnboarding.ts`** — מקבל את כל ה‑payload של Track A ובונה את הפרופיל בעסקה אחת (vallues + skills + roles + workways + tasks + availability). **משאבי Sp נשמרים ב‑pass נפרד דרך actions קיימים של Sp**.
3. **`analyzeAndAttachCv.ts`** — קורא ל‑`/api/analyze-cv` הקיים, שומר תוצאה ב‑`cv_extraction`, מחבר tasks ל‑entities.
4. **`createBusinessImportJob.ts`** — יוצר job, מתזמן `executeBusinessImport`.
5. **`executeBusinessImport.ts`** — אם `source_url` → scrape (cheerio/playwright); אם `source_text` → ישר ל‑LLM. מחזיר proposed project + 1–3 proposed matanot.
6. **`acceptBusinessImport.ts`** — יוצר project (קורא ל‑`createProject` הקיים), יוצר matanot (קורא ל‑`createMatanot`/`createComplexMatanot`), מסמן job=accepted.
7. **`markOnboardingDone.ts`** — סטטוס סופי + emit event ל‑concierge matching.

> חשוב: כל ה‑actions עוברים unified — זה מה שמאפשר לקונסיירז' ו‑MCP לקרוא להם אוטומטית.

---

## 4. Routes & UI

### 4.1 חדשים

| נתיב                                                       | תפקיד                                                                          |
| ---------------------------------------------------------- | ------------------------------------------------------------------------------ |
| `src/routes/(non)/signup/+page.svelte`                     | המסך החדש: email+password בלבד. מחליף את step 5 הקיים.                         |
| `src/routes/(non)/signup/check-email/+page.svelte`         | "בדקו את המייל"                                                                |
| `src/routes/(non)/confirm-email/+page.server.ts`           | callback מ‑Strapi confirmation; מנתב ל‑/onboard                                |
| `src/routes/(reg)/onboard/+page.svelte`                    | **לעריכה** — מציג את ה‑Fork (track=provider/business) ולא שלבי הפרופיל מיד     |
| `src/routes/(reg)/onboard/provider/+page.svelte`           | Track A — wrapper שמציג CV upload או manual                                    |
| `src/routes/(reg)/onboard/provider/manual/+page.svelte`    | פלואו ידני (קומפוננטות שלוקח מ‑registration: vallues, skills, roles, workways) |
| `src/routes/(reg)/onboard/provider/cv/+page.svelte`        | פלואו CV (משתמש ב‑`cvupload.svelte`)                                           |
| `src/routes/(reg)/onboard/provider/resources/+page.svelte` | A2 — **משלב `newsp.svelte` הקיים** ברשימה                                      |
| `src/routes/(reg)/onboard/business/+page.svelte`           | Track B — choose source                                                        |
| `src/routes/(reg)/onboard/business/url/+page.svelte`       | B1.a — paste URL → import job                                                  |
| `src/routes/(reg)/onboard/business/describe/+page.svelte`  | B1.b — free text → AI (חיבור לבוט קיים)                                        |
| `src/routes/(reg)/onboard/business/review/+page.svelte`    | B1 — מאשר את ה‑project + products שה‑AI הציע, לפני יצירה                       |
| `src/routes/(reg)/onboard/business/product/+page.svelte`   | B2 — בוחר simple/complex ופותח את הטופס הנכון                                  |

### 4.2 קומפוננטות חדשות

| רכיב                          | מיקום                                                                                                                                                                                             |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `TrackFork.svelte`            | `src/lib/components/onboard/` — שני כפתורים גדולים + אינדיקציה                                                                                                                                    |
| `CvOrManualChoice.svelte`     | `src/lib/components/onboard/`                                                                                                                                                                     |
| `ResourcesStep.svelte`        | `src/lib/components/onboard/` — wrapper דק שמכיל **`newsp.svelte` הקיים** ברשימה (multi‑add) + רשימת SPs קיימים של המשתמש                                                                         |
| `MissionsIDoEditor.svelte`    | `src/lib/components/onboard/` — autocomplete מתוך **`mission`** + יצירת חדש. בעת בחירה: הצעה לאשר את ה‑`mission.skills` כ‑skills של המשתמש. תחתיו: "אולי גם זה?" (suggested missions לפי overlap) |
| `BusinessSourcePicker.svelte` | `src/lib/components/onboard/` — URL/text/manual                                                                                                                                                   |
| `BusinessImportReview.svelte` | `src/lib/components/onboard/` — מציג extracted_project + extracted_products לאישור                                                                                                                |
| `OnboardingProgress.svelte`   | wrapper של `Bein` strip אבל לוגיקה חדשה (steps תלויי‑track)                                                                                                                                       |

> **שימו לב**: אין `ResourcesEditor` חדש — `newsp.svelte` ו‑`editsp.svelte` הקיימים מטפלים ב‑CRUD של Sp. `ResourcesStep.svelte` הוא רק wrapper ל‑onboarding שמשלים onClose callback עם "המשך לשלב הבא" במקום סגירת modal ב‑/me.

### 4.3 שינויים ברכיבים קיימים

- **`password.svelte`** — refactor: להסיר את הקריאה שלו ל‑skills/tafkidims/work_ways/vallues. רק email + password. שאר השדות יישלחו ב‑actions של ה‑onboarding (אחרי confirmation). שמירת backward‑compat: אם המשתמש לא עבר ב‑signup ויש לו נתונים — נצרף אותם.
- **`bein.svelte`** — להפסיק לעטוף את registration. השאר רק את ה‑onboarding mode. ה‑signup החדש לא משתמש ב‑bein בכלל (זה רק שני שדות).
- **`/onboard/+page.svelte`** — להחליף מ‑`show.set(1)` ל‑hub שבוחר track. אם track כבר נבחר (`user.onboarding_track !== 'unset'`) → redirect לתת‑נתיב.
- **`cvupload.svelte`** — לעדכן את ה‑POST ב‑`confirmProfile` שיקרא ל‑`completeProviderOnboarding` במקום `user-profiles` ישיר. לעבור ל‑`sendToSer` או fetch ל‑`/api/action`.
- **`newsp.svelte`** — לא משנים את הלוגיקה. **רק** וודאי שה‑`onClose` callback קיים ועובד (כבר עובד היום) — wrapper שלנו יעטוף אותו לקדם ל‑step הבא.

---

## 5. Mastra / AI Workflows חדשים

תחת `src/mastra/workflows/`:

1. **`analyze-cv`** — קיים. שלוש הרחבות מינימליות:
   - הוספת step שמ‑match את ה‑`tasks: string[]` שחוזר מה‑LLM אל `mission` templates קיימים ע"י embedding (Pinecone) + fuzzy. החזרה: `matched_missions[]` (ids) + `new_missions[]` (proposed missionName + descrip).
   - אם ה‑CV מציין "יש לי iPad Pro / רכב / חלל סטודיו" → להחזיר גם `proposed_sps: SpInput[]` שניתן לפרה‑מילוי בשלב A2.
   - וידוא ש‑output schema מתאים ל‑`completeProviderOnboarding`.
2. **`import-business-url`** (חדש) — קולט URL, scrape (playwright), שולח LLM שיוציא:
   ```ts
   { project: { name, desc, details, vals, ont, profit, res, url },
     products: [{ name, desc, price, kindOf, pricingMode }] }
   ```
3. **`import-business-text`** (חדש) — אותו output, אבל קלט הוא טקסט חופשי. שכפול קל של (2) ללא ה‑scrape step.

### 5.1 כלי MCP חדשים

תחת `src/mastra/tools/`:

- **`createBusinessImportTool.ts`** — קולט URL או text, מחזיר navigation URL ל‑review page. דומה במבנה ל‑`createProjectTool`.
- **`completeProviderOnboardingTool.ts`** — לאפשר ל‑agent לסגור פרופיל מתוך chat (לדוגמה: "מואץ', תסיים את הפרופיל שלי, אני מעצב גרפי 10 שנים").

---

## 6. ה‑Email Confirmation Flow

זה לב התכנית — היום Strapi כבר שולח confirmation email (default behavior), ואנחנו מאמתים בroute login

### 6.1 שינויים נדרשים

בעמוד '/login' לשנות את לוגית ה- confirmation=...`, אם success → set cookie + redirect ל‑`/onboard`.
4. **תקלות**: אם המייל לא הגיע — כפתור "שלח שוב" שקורא ל‑`POST /api/auth/send-email-confirmation`.

---

## 7. Milestones (סדר מומלץ)

| #        | מילסטון                                                                                                                                                                                    | תוצר                                                     | flag                              |
| -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------- | --------------------------------- |
| **M0**   | Audit + מציאת רגרסיות פוטנציאליות. תיעוד מה ה‑password.svelte שולח היום ב‑payload. בדיקה ש‑Strapi confirmation email עובד.                                                                 | בסיס יציב                                                | –                                 |
| **M1**   | `signupMinimal` + `/signup` route + `/signup/check-email`. Strapi confirmation על. password.svelte refactor — רק email+password. Backward‑compat: שמירת `/signup-old` למקרה שמתגלות בעיות. | משתמש חדש נרשם תוך 30 שניות עם מייל אישור                | `signup.minimal=on`               |
| **M2**   | `/onboard` הופך ל‑hub עם TrackFork. הסטה לפי `onboarding_track`. Schema migration: user.onboarding_track, onboarding_status.                                                               | משתמש מאושר רואה fork ומסומן track                       | `onboard.fork=on`                 |
| **M3**   | Track A manual — חיבור הקומפוננטות הקיימות (`vallues`/`skills`/`roles`/`workways`) ל‑route חדש `/onboard/provider/manual`. שמירה דרך `completeProviderOnboarding`.                         | פרופיל ספק שלם דרך טופס                                  | `onboard.providerManual=on`       |
| **M3.5** | Schema: הרחבת `mission` ( `users_can_do`, `kindOf`, `embedding_id`, `synonyms`, `usage_count`) + backfill ל‑missions קיימים. QIDs 208–211. רכיב `MissionsIDoEditor.svelte` ב‑Track A.      | ספק מסמן משימות שהוא יודע, מקבל הצעות skills + "אולי גם" | `onboard.missionsLib=on`          |
| **M4**   | Track A CV — `/onboard/provider/cv` משלב את `cvupload.svelte` קיים. ה‑workflow מ‑match את ה‑tasks לאוסף ה‑mission templates. חיווט ל‑`completeProviderOnboarding`.                         | פרופיל ספק שלם מ‑CV כולל missions_i_can_do               | `onboard.providerCv=on`           |
| **M5**   | Track A resources — `/onboard/provider/resources` משלב את `newsp.svelte` הקיים ברשימה (multi‑add). אם יש `proposed_sps` מ‑CV — פרה‑מילוי.                                                  | משאבים אישיים נכנסים לפרופיל בלי לעצב מחדש UI            | `onboard.resources=on`            |
| **M6**   | Track B manual — `/onboard/business/+page.svelte` עם redirect ל‑`/me?action=createproject`. כפתור "הוסף מוצר ראשון" → redirect ל‑newmatana קיים.                                           | בעל עסק יוצר פרויקט+מוצר ידנית דרך wizard                | `onboard.businessManual=on`       |
| **M7**   | Track B free text — חיבור ל‑bot קיים (`/api/bot`), workflow `import-business-text`. UI: `BusinessImportReview` להחזיר proposal. accept → קורא ל‑actions קיימים.                            | תיאור חופשי → פרויקט+מוצרים אוטומטית                     | `onboard.businessAI=on`           |
| **M8**   | Track B URL — `import-business-url` workflow עם playwright scrape. Schema: `business-import-job`.                                                                                          | URL → פרויקט+מוצרים                                      | `onboard.businessUrl=on`          |
| **M9**   | אינטגרציה עם complex products — אם המשתמש בוחר "מוצר מורכב" → קורא ל‑`createComplexMatanot` (M2 של PLAN_COMPLEX_PRODUCTS).                                                                 | מסלול שלם לבעל עסק עד מוצר מורכב                         | תלוי `complexProducts.compose=on` |
| **M10**  | אינטגרציה עם concierge — בסיום onboarding emit event שמטריגר `matchRatson` רטרואקטיבי על משאלות פתוחות שיכולות להתאים לספק החדש.                                                           | ספק חדש מקבל הצעות מטץ' תוך דקות                         | תלוי `concierge.matchBasic=on`    |

> **M1–M2 קריטיים** — הם מורידים את שיעור הנטישה לבד. M3–M5 נותנים סוף‑סוף פרופיל מלא לספקים יחידים. M6+ זה לבעלי עסק.

---

## 8. תרחיש End‑to‑End (אחרי M8)

> דנה (שכירה לשעבר, מעצבת UX, רוצה להתחיל לקבל פרויקטים בצד) נכנסת ל‑1lev1.

1. **/signup**: מקלידה email + password. לוחצת — מקבלת "בדקו את המייל". (15 שניות)
2. **מייל**: לוחצת על הקישור → `/confirm-email?confirmation=...` → cookie נקבע → redirect ל‑`/onboard`.
3. **Fork**: רואה "נותן שירות" / "בעל עסק". בוחרת **נותן שירות**.
4. **CV or manual**: בוחרת CV. מעלה PDF.
5. **Review** (`cvupload`): רואה:
   - Matched: UX, Figma, סקיצות (כבר במערכת)
   - Suggestions: "User Research" → קיים "User Studies"? כן/לא
   - New: "Notion templates" — תוסיף לאוצר המילים
   - Tasks: "ליצור wireframes", "להוביל workshops"
6. מאשרת. הפרופיל נשמר. עוברת לשלב **resources** (A2).
7. **Resources** (`ResourcesStep` עם `newsp` בפנים): רואה משאב מוצע מה‑CV — "iPad Pro + Apple Pencil". מאשרת, מוסיפה מחיר. דילוג על שאר.
8. **/me**: רואה פרופיל מלא. תוך 5 דקות מקבלת push: "מצאנו לך 3 משאלות שאת יכולה לעזור בהן".
9. (M10) קונסיירז' שלח ל‑3 בעלי משאלות הצעה אוטומטית עם דנה כפתרון.

> במקביל — איציק (בעלי בית קפה) נכנס:

1. **/signup** → אישור מייל.
2. **Fork**: בוחר **בעל עסק**.
3. **Source**: מדביק `https://my-cafe.co.il`.
4. (M8) `executeBusinessImport`: AI מחזיר project "בית קפה השקד" + 3 products (קפה הבית, ארוחת בוקר, סדנת אפיה).
5. **Review**: מאשר עם תיקונים קלים.
6. **Result**: פרויקט נוצר, 3 מוצרים נוצרים. הוא הופנה ל‑`/moach/[id]/main`.
7. **CTA**: "הזמן שותפים" / "צור מוצר מורכב" / "התחל לקבל הזמנות".

---

## 9. סיכונים פתוחים

1. **אובדן נתונים בין steps** — אם משתמש סוגר טאב באמצע onboarding. **פתרון**: `onboarding_status` ב‑DB + resume מהמקום שעצר.
2. **AI hallucination ב‑business import** — scraping של דף שיווקי יכול לתת תיאור צבעוני אבל לא מדויק. **פתרון**: `BusinessImportReview` חובה לפני יצירה, ערכים defaultיים מסומנים בצהוב.
3. **כפילויות missions** — אם משתמש מקליד "עיצוב לוגו" וכבר יש mission "logo design", צריך merge. **פתרון**: רכיב `MissionsIDoEditor` חייב לחפש עם embedding + fuzzy match על `missionName + synonyms` לפני יצירת mission חדש. בנוסף: כל יצירת template חדש דרך onboarding תיכנס כ‑draft ותעבור human approval ב‑ops dashboard לפני שהיא נחשפת לחיפוש של אחרים (למניעת זיהום הספרייה).
4. **אבטחה ב‑URL scraping** — לא לרוץ scraping על URLs פנימיים (10.x.x.x, localhost). **פתרון**: blocklist + timeout.
5. **תאימות אחורה ל‑משתמשים קיימים** — היום register שולח skills/roles/etc. כשנעבור ל‑signupMinimal, מי שכבר נרשם **לא** ייגע. המסלול הישן יישאר עד M2, ואז יומר. backfill: `UPDATE users SET onboarding_status='done' WHERE skills.length > 0`.
6. **i18n** — Hebrew/English. כל strings ב‑`src/lib/translations/`.
7. **מסך הפתיחה הארוך (`hello.svelte` 16ש' אנימציה)** — נטישה אצל מובייל. **פתרון**: דלג ל‑hello למשתמשים חוזרים, או קצר ל‑6ש'. רק במסלול signup חדש.
8. **ה‑Sp module ב‑newsp.svelte** — היום הוא נטוע ב‑`/me` כ‑modal. בעת ה‑integration ל‑onboarding לוודא שאין assumptions על parent context (לדוגמה `baciStore`, `idPr`, `meData`). אם יש — לפצל ל‑prop במקום store global.

---

## 10. מה לבנות _ראשון_ (אם מתחילים מחר)

מסלול MVP בן 3–4 ימי עבודה:

1. **יום 1**: M0+M1 — Schema migration + `signupMinimal` + `/signup` + Strapi confirmation. (משתמש חדש = email/password בלבד, מקבל מייל.)
2. **יום 2**: M2+M3 — TrackFork + Track A manual (חיבור קומפוננטות קיימות מהבית).
3. **יום 3**: M4+M5 — חיבור `cvupload.svelte` ל‑`/onboard/provider/cv` + `newsp.svelte` ל‑`/onboard/provider/resources`. זה הניצחון הגדול — CV → פרופיל מלא ב‑30 שניות, plus משאבים.
4. **יום 4**: M6 — Track B manual. (בעלי עסק נכנסים, נדחפים ל‑createProject + newmatana, גם בלי AI עדיין.)

זה כבר מספיק כדי שקונסיירז' יקבל ספקים מלאים. M7–M10 מצטרפים תוך שבועיים.

---

## 11. קבצים שייגעו (estimate)

### חדשים — Server

- `src/lib/server/actions/configs/signupMinimal.ts`
- `src/lib/server/actions/configs/completeProviderOnboarding.ts`
- `src/lib/server/actions/configs/analyzeAndAttachCv.ts`
- `src/lib/server/actions/configs/createBusinessImportJob.ts`
- `src/lib/server/actions/configs/executeBusinessImport.ts`
- `src/lib/server/actions/configs/acceptBusinessImport.ts`
- `src/lib/server/actions/configs/markOnboardingDone.ts`

### חדשים — Routes

- `src/routes/(non)/signup/+page.svelte`
- `src/routes/(non)/signup/check-email/+page.svelte`
- `src/routes/(non)/confirm-email/+page.server.ts`
- `src/routes/(reg)/onboard/provider/{+page.svelte, manual/+page.svelte, cv/+page.svelte, resources/+page.svelte}`
- `src/routes/(reg)/onboard/business/{+page.svelte, url/+page.svelte, describe/+page.svelte, review/+page.svelte, product/+page.svelte}`

### חדשים — Components

- `src/lib/components/onboard/TrackFork.svelte`
- `src/lib/components/onboard/CvOrManualChoice.svelte`
- `src/lib/components/onboard/ResourcesStep.svelte` ← wrapper דק סביב `newsp.svelte` הקיים
- `src/lib/components/onboard/MissionsIDoEditor.svelte` — autocomplete על mission templates + הצעת skills + "אולי גם זה?"
- `src/lib/components/onboard/BusinessSourcePicker.svelte`
- `src/lib/components/onboard/BusinessImportReview.svelte`
- `src/lib/components/onboard/OnboardingProgress.svelte`

### חדשים — Mastra

- `src/mastra/workflows/import-business-url.ts`
- `src/mastra/workflows/import-business-text.ts`
- `src/mastra/tools/createBusinessImportTool.ts`
- `src/mastra/tools/completeProviderOnboardingTool.ts`

### עריכה

- `src/lib/components/registration/password.svelte` — לקצץ ל‑email+password בלבד
- `src/lib/components/main/bein.svelte` — לבטל את ה‑registration mode (או להשאיר רק ל‑onboarding)
- `src/routes/(reg)/onboard/+page.svelte` — לעבור מ‑show.set(1) ל‑hub
- `src/lib/components/main/cvupload.svelte` — לחבר ל‑action
- `src/routes/api/send/qids.js` — QIDs 200–211
- `src/lib/server/actions/configs/index.ts` — רישום 7 actions חדשים
- Strapi schemas:
  - `user` (שדות onboarding\_\*, missions_i_can_do, cv\_\*)
  - `mission` (הרחבה: is_template, users_can_do, kindOf, embedding_id, synonyms, usage_count) **— לא ישות חדשה!**
  - `business-import-job` (חדש)

### לא משנים (אבל מוודאים שעובדים מ‑onboarding context)

- `src/lib/components/userPr/newsp.svelte` — משלבים as‑is, רק עוטפים ב‑wrapper
- `src/lib/components/userPr/editsp.svelte` — זמין מ‑/me, אין צורך לגעת
- `src/lib/components/userPr/edit.svelte` — profile editor מלא, נשאר כפי שהוא
- `src/lib/components/main/cvupload.svelte` — הלוגיקה נשארת; רק ה‑endpoint משתנה

---

## הערה לסיום

זה לא feature חדש — זה **שיתוף פעולה** של נכסים שכבר קיימים: `cvupload` הוא 90% מ‑Track A, `createProjectTool` + ה‑bot הם 80% מ‑Track B, `newsp.svelte` הוא 100% של רכיב המשאבים האישיים. מה שחסר זה ה‑**מסילה** שמובילה מהם זה לזה ושנהג שלוקח את המשתמש לנקודה הנכונה. M1–M5 (signup + fork + CV + Sp) נותנים את עיקר ההישג, M7–M8 (business AI) פותחים את הקצה השני.

# דגשים חשובים

יש לנו כבר לרוב האלמנטים כישורים תפקידים וערכים יכולת של זיהוי מילים קרובות תוכדי חיפוש בעצם חיפוש סמנטי אפשר לראות איך אנחנו מפעילים את זה מהקובץ edit.svelte נשמור על היכולת הזו

נאפשר למתשמשים קיימים גם להיכנס לonboarding אם יירצו בכך כלומר אנחנו תומכים בזב שחלק מהמאפיינים כבר מגיעים מלאים ואנחנו עורכים אותם מוסיפים ומורידים
