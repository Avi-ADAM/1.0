# תור הביצוע — השכבה המבוזרת (S2b → S3 → Rust → עמידות קוונטית)

> **המסמך הזה הוא נקודת הכניסה היחידה.** סוכן שמקבל "תקדם את זה" קורא אותו,
> מבצע את המשימה הפתוחה הבאה בתור, מעדכן אותו, ומסיים. כל השאר (HANDOFF,
> SPEC, התכניות) הם חומר עיון שהמשימות מפנות אליו.
>
> **להפעלה** — להדביק לסוכן:
>
> ```
> קרא את docs/inprogress/PLAN_DISTRIBUTED_EXECUTION.md ופעל לפי §0. תקדם את המשימה הבאה בתור.
> ```
>
> אפשר גם לכוון: `…תקדם את B2` / `…רק משימות מסלול B` / `…עד שתי משימות`.

---

## 0. פרוטוקול לסשן (לסוכן — לפי הסדר, בלי לדלג)

1. **קרא**: את המסמך הזה כולו; ב-[HANDOFF_DISTRIBUTED_DB](./HANDOFF_DISTRIBUTED_DB.md)
   את §1 (מפת מצב), §3 (אינווריאנטים), §6 (אל תעשה); ואת הסעיפים במפרט
   [SPEC_CONSENT_FORMAT](../SPEC_CONSENT_FORMAT.md) שהמשימה מפנה אליהם.
   `CLAUDE.md` ו-`AGENTS.md` חלים כרגיל.
2. **בחר משימה**: אם המשתמש נקב באחת — אותה. אחרת: הראשונה בטבלת §3
   שמצבה ⬜ או ◐, שכל התלויות שלה ✔, ושאינה מסומנת 🧑. משימה ◐ קודמת
   לחדשה (סיים את מה שהתחיל). אם אין כזו — דווח מה חוסם ועצור.
3. **קו בסיס** לפני שינוי:
   ```bash
   npx vitest run src/lib/crypto src/lib/consent src/lib/space src/lib/server/consent src/lib/server/relay src/lib/client
   ```
   רשום כמה עוברים/נכשלים. (`npm test` המלא מכיל כשלים קיימים שלא קשורים —
   ההשוואה היא "לא גדל בגללי", לא "הכל ירוק".)
4. **סמן ◐** את המשימה בטבלה, ובצע אותה לפי הכרטיס שלה ב-§4 — הצעדים, הקבצים,
   תנאי הקבלה. משימה שלא נגמרת בסשן אחד: עצור בנקודה ירוקה (טסטים עוברים),
   כתוב ביומן (§6) בדיוק איפה עצרת ומה הצעד הבא.
5. **אמת**: הרץ שוב את קו הבסיס + `npx vitest run src/lib/consent/vectors`
   + `npm run check` (השווה למספר השגיאות לפני — הבסיס היום ~1384, לא אפס;
   אסור שיגדל). שינוי UI → אמת בדפדפן (השרת ב-5173 בלבד).
6. **עדכן מסמכים**: מצב המשימה בטבלה (✔ / ◐), שורה ביומן §6, ומפת המצב ב-
   HANDOFF §1 אם שורה שם השתנתה. החלטה חדשה → לכרטיס ולמפרט, לא רק לקוד.
7. **commit אחד** בסוף הסשן, **רק עם הקבצים שלך**: `git add <נתיבים>` —
   **לעולם לא** `git add -A` / `git add .` / `git stash` (בעץ העבודה יש עבודה
   אחרת של המשתמש). הודעה: `dist: <ID> <תיאור>` + שורת ה-Co-Authored-By.
   **לא לדחוף** אלא אם המשתמש כתב במפורש לדחוף — כל push ל-main עולה ל-Vercel.
8. **דווח בעברית**: מה נעשה, מה נבדק ואיך, מה נשאר, ומה ממתין למשתמש (§5).

### כללים קשיחים (מעבר לאינווריאנטים של HANDOFF §3)

- **בדיקת freeze אדומה ב-`vectors.test.ts` = עצור.** השינוי הזיז בייטים חתומים,
  ids או roots. **אסור** להריץ `npm run vectors:consent` כדי להירגע. מותר
  לייצר מחדש רק כשהמשימה **מוסיפה** vectors חדשים, וה-diff מראה תוספות בלבד
  (או bump גרסה שהמשתמש אישר).
- **שום דגל לא נדלק בפרודקשן**, שום env לא משתנה ב-Vercel/VPS, שום deploy
  ל-1.0b — אלה משימות 🧑. הסוכן מכין, מתעד, ועוצר.
- **`publishSealed` / E2E — אסור למשתמשים אמיתיים** (שער S3, PLAN_serverless_p2p_data §1).
- **אין מפתח פרטי בזיכרון JS/WASM בדפדפן.** אם משימה נראית כמחייבת את זה — עצור ושאל.
- **כל שינוי בפורמט** (שדה, פעולה עם reducer, צורת state) → מפרט + vector
  באותו commit (אינווריאנט 9).
- **ספק? עצור ושאל.** במיוחד: bump של `STATE_ROOT_VERSION`, שינוי ב-`canonical.ts`,
  כל דבר ש-SPEC §12 מסמן כפתוח.

---

## 1. איפה אנחנו (אוקטובר 2026)

**Strapi הוא מקור האמת היחיד בפועל.** השכבה המבוזרת בנויה במידה רבה, אבל
רצה כ-shadow לצידו:

| שלב | בקוד | בפרודקשן |
|---|---|---|
| S1 חתימות shadow | ✔ | **חלקי** — 7 actions חותמים (addVote, chat, completeMission, createMission, createHaluka, createSale, counterSaleClaim). נשמר במראה ב-Strapi (`CONSENT_MIRROR`), **לא נאכף** |
| S2a relay + סנכרון | ✔ | **כבוי** — `SPACE_SYNC_PROJECTS` ריק; override של מפתח ב-`localStorage.SPACE_SYNC_ENABLED='1'` |
| S2b reducers + projection | ✔ | **כבוי** — הקורא היחיד: רכיב shadow בדף split |
| S3a הצפנה | ליבה + טסטים | **אסור** |
| T7 DeviceCert / T9 שחזור / כספת | ✔ / ◐ / ✔ | כבויים (`DEVICE_CERT_ENFORCE`, `VAULT_ENABLED`) |
| R0 מפרט + vectors | ✔ | — (חוזה, לא פיצ'ר) |

**שער S2b** (PLAN_serverless_p2p_data §1) עוד לא התחיל בפועל: אין רקמה אחת
שרצה על ה-Space. מסלול A הוא מה שמזיז את זה.

---

## 2. המסלולים

| מסלול | מטרה | למה עכשיו |
|---|---|---|
| **A — S2b חי** | רקמת פיילוט על ה-Space, טלמטריה, ואז דף שקורא מה-projection | זה השער. כל השאר מתוכנן מעבר לו |
| **B — הקשחת הפורמט** | סגירת O-1…O-7 של SPEC §12 + אימות אינקרמנטלי | קוד טהור + טסטים, בלי deploy — **אידיאלי לסופ"ש** |
| **C — עמידות קוונטית** | Node 24, KEM היברידי, `cosig` | KEM היברידי = תנאי לשער S3 (SPEC §13) |
| **D — Tauri R1** | חתימה במפתח חומרה (כולל ML-DSA) | חסום על מסלול ה-SPA ב-PLAN_TAURI_MOBILE (שלבים 1–2) |
| **E — R2 ליבת Rust** | crate אחד, WASM + נייטיב | **לא להתחיל.** תנאי כניסה ב-HANDOFF §8.3 |

---

## 3. התור (הסדר = סדר הביצוע)

מקרא: ⬜ פתוח · ◐ בתהליך · ✔ בוצע · 🧑 דורש את המשתמש (deploy / env / החלטה) · גודל: S ≈ סשן קצר, M ≈ סשן, L ≈ 2–3 סשנים

| # | ID | משימה | גודל | תלוי ב- | מצב |
|---|---|---|---|---|---|
| 1 | A0 | מיפוי ה-relay בטופולוגיה של פרודקשן (Vercel מול VPS) + המלצה | S | — | ✔ |
| 1b | A0b | push ב-chunks של ≤200 + relay מסרב לרוץ על Vercel (ממצאי A0) | S | A0 | ✔ |
| 2 | B1 | vectors ל-quorum ול-deltaCheck (O-4) | M | — | ✔ |
| 3 | B2 | ECDSA low-S בצד החותם (O-2) | S | — | ✔ |
| 4 | A1 | דגל Space לפי רקמה (allowlist בשרת) | M | — | ✔ |
| 5 | A3 | טלמטריית אי-התאמות לשרת | M | A1 | ✔ |
| 6 | A2 | הרחבת חתימות ה-shadow — באצוות | L | — | ✔ אצוות 1–4 + A2b P1–P4 (הגדרות רקמה). פגישות ⏸ (עוברות ל-magik-meetings); פערי כיסוי מתועדים בכרטיס |
| 7 | B6 | אימות התחייבויות אינקרמנטלי (O(n²) → O(n)) | M–L | — | ✔ |
| 8 | C0 | יישור Node 24 (Dockerfile, פיתוח) + גילוי יכולות PQ | S | — | ⬜ 🧑 (התקנה/deploy) |
| 9 | B4 | מזהה מכשיר כטביעת אצבע (O-7) | L | — | ◐ קריאה ✔; פליטה ⬜ (מתג, אחרי deploy) |
| 10 | C2 | KEM היברידי — `WrappedKey` v2 (O-9) | M | C0 | ⬜ |
| 11 | B3 | מדיניות קצוות Ed25519 + vectors (O-1) | M | — | ✔ |
| 12 | C1 | שדה `cosig` — חתימה היברידית על עוגנים (O-8) | L | C0, B4 | ⬜ |
| 13 | B5 | מזכר החלטה: חבילת bump v3 (O-3, O-5, O-6) | S | — | ✔ קריאה; פליטה ⬜ (אותו מתג כמו B4) |
| 14 | A4 | פיילוט: רקמה אחת על ה-Space, 30 יום / 1,000 אירועים | — | A0b, A1, A3 | ⬜ 🧑 |
| 15 | A5 | דף ראשון קורא מה-projection (עם fallback) | M | A4 | ⬜ |
| — | D1 | Tauri R1 | L | PLAN_TAURI_MOBILE שלבים 1–2 | ⬜ חסום |
| — | E1 | R2 ליבת Rust | L+ | שער S3 + HANDOFF §8.3 | ⬜ לא להתחיל |

---

## 4. כרטיסי משימה

### A0 — איפה ה-relay באמת רץ
**למה**: היומן של ה-relay הוא in-memory (HANDOFF §7.2). על Vercel serverless
כל cold start מנפיק `epoch` חדש ⇒ לקוחות מסנכרנים מ-0 שוב ושוב. לפני פיילוט
צריך לדעת איפה `/api/relay/[spaceId]` רץ בפועל.
**צעדים**: קרא `svelte.config.js` (בחירת adapter), `docker-compose.api.yml`,
`Dockerfile`, `vercel.json` אם קיים, ו-`src/lib/server/relay/`. ענה: לאיזה host
הדפדפן פונה עבור `/api/relay`, ומה קורה ליומן ולסמן הלקוח בכל אחד.
**תוצר**: סעיף "A0 — ממצאים" בכרטיס הזה + המלצה (להצמיד את ה-relay ל-VPS /
להתמיד את רצף ה-seq / לקבל full-pull בפיילוט). **בלי שינוי קוד.**
**קבלה**: המשתמש יכול להחליט מהממצא בלי לקרוא קוד.

#### A0 — ממצאים (2026-10-29)

**בשורה אחת**: בפרודקשן הווב ה-relay **כבר רץ על ה-VPS**, בקונטיינר יחיד —
לא על Vercel. החשש של HANDOFF §7.2 (epoch חדש בכל cold start) לא חל על הדפדפן.
אבל יש שני פערים שהפיילוט ייתקל בהם, ואחד מהם הוא באג.

**לאן הדפדפן פונה** — `relayClient.ts` קורא ל-`/api/relay/…` יחסי.
`installApiBasePatch()` (`src/routes/+layout.js` → `$lib/platform`) מעביר כל
`/api/*` אל `VITE_API_BASE`, שדלוק ב-Vercel עם `https://api.1lev1.com`
(PLAN_PROXY_SECURITY, "מה מחזיק את זה"). nginx (1.0b,
`nginx/default.conf.template`) מעביר `api.1lev1.com/api/` אל
`sveltekit-api:3000` — **קונטיינר אחד** (`docker-compose.api.yml`, adapter-node,
בלי replicas, בלי blue/green בצד ה-API). ה-wake של T1 יוצא משם ל-socket-server
ברשת הפנימית.

| מסלול | איפה ה-relay | היומן והסמן |
|---|---|---|
| ווב בפרודקשן | VPS, תהליך אחד | יציב בין deploys. כל deploy של ה-API = `logEpoch` חדש ⇒ כל רפליקה מסנכרנת פעם אחת מ-0 |
| ווב, deploy בלי `VITE_API_BASE` (למשל preview, אם אין בו את המשתנה) | Vercel lambdas | **split-brain**: כמה מופעים במקביל, לכל אחד יומן ו-epoch משלו; push שנחת במופע א' לא נראה במופע ב' |
| אפליקציית Tauri | `VITE_URL` = `https://1lev1.com` (PLAN_TAURI_MOBILE) = Vercel | אותו split-brain. לא פעיל היום — אין משתמשי מובייל עם הדגל |
| `npm run dev` | התהליך המקומי | `VITE_API_BASE` ריק ב-`.env` — יומן בזיכרון של ה-dev server |

**פער 1 — אחרי restart היומן הגלוי ריק.** `relayEnsureHydrated` טוען מהמראה רק
מעטפות **sealed** (T3). אירועים גלויים נכתבים ל-`consentStore`, אבל ה-collection
‏`consent-event` ב-Strapi ממופתח לפי `subjectType/subjectId` ואין בו `spaceId` —
אי אפשר לשלוף ממנו "את כל אירועי `project:X`". לכן אחרי deploy ה-relay מתמלא
מחדש רק כשרפליקה שמחזיקה את האירועים מסנכרנת ודוחפת את ה-diff. מכשיר חדש
שמגיע לפני שחבר ותיק פתח את האפליקציה — רואה space ריק. בפיילוט של 2–3 חברים
יומיים זה נסגר מעצמו תוך שעות; זה לא מקור אמת שאבד (הרפליקות וה-mirror מחזיקים).

**פער 2 — באג: דחיפה אחרי restart נכשלת מעל 200 אירועים.** אחרי restart ה-heads
ב-relay ריקים ⇒ `computeDiff` מחזיר את **כל** ההיסטוריה ⇒ `pushEvents` שולח
הכל בבקשה אחת ⇒ ה-route מחזיר 413 (`MAX_BATCH = 200`) ⇒ `sync()` זורק,
והרפליקה נשארת ב-`status: 'error'` בכל סבב, עד שמישהו אחר ממלא. היעד של A4
הוא 1,000 אירועים — הפיילוט **ייתקע** בדיוק ב-deploy הראשון אחרי 200.

**המלצה**:

1. **לפיילוט: לקבל full-pull על ה-VPS.** הטופולוגיה הנכונה כבר קיימת; לא צריך
   להעביר שום דבר. resync מ-0 בכל deploy של ה-API זול בקנה מידה של רקמה.
2. **לפני A4 — משימה A0b (S, קוד בלבד):** (א) `pushEvents` מחלק ל-chunks של
   ≤200; (ב) ה-route של ה-relay מסרב (503 `relay_not_on_this_host`) כשהוא רץ על
   Vercel (`VERCEL` ב-env) — כך deploy בלי `VITE_API_BASE` או אפליקציית מובייל
   מקבלים שגיאה גלויה במקום split-brain שקט.
3. **לא עכשיו — התמדת היומן הגלוי:** שדה `spaceId` ב-`consent-event` (1.0b,
   🧑 deploy) + טעינה עצלה כמו T3. נחוץ רק אם יתברר בפיילוט שפער 1 מורגש.
4. **מובייל (D1/Tauri):** ה-relay צריך לפנות ל-`api.1lev1.com` גם שם — לתקן
   כשמסלול ה-SPA מתקדם, לא קודם.

**אומת בפרודקשן (2026-10-29):** ב-`www.1lev1.com` ה-`fetch` מותקן, ו-
`fetch('/api/health')` נוחת ב-`https://api.1lev1.com/api/health` (200). **Preview
לא נבדק**: קריאת ה-env דרך ה-MCP של Vercel דורשת אישור גישה לצוות
`aviadams-projects`. A0b (ב) סוגר את הסיכון בכל מקרה.

### A0b — push מחולק + relay רק על ה-VPS
**למה**: פער 2 של A0 (413 אחרי restart מעל 200 אירועים — הפיילוט נתקע) והסיכון
ל-split-brain כש-`/api/relay` מגיע ל-Vercel.
**צעדים**: (א) `pushEvents` / `pushSealed` ב-`relayClient.ts` מחלקים ל-chunks של
`MAX_BATCH` (לייצא את הקבוע ממקום משותף, לא לשכפל 200), בסדר ש-`computeDiff`
החזיר; כישלון ב-chunk עוצר ומחזיר את הסיבה. (ב) ב-route, כש-`env.VERCEL` (דרך
`$env/dynamic/private`) — 503 `relay_not_on_this_host`, ל-GET ול-POST.
**קבלה**: טסט ש-push של 450 אירועים יוצא כ-3 בקשות ושה-relay מכיל את כולם; טסט
ל-503 תחת `VERCEL=1`; `syncRoundtrip.test.ts` ירוק.

### B1 — vectors ל-quorum ול-deltaCheck (O-4)
**למה**: במצב strict האימות כולל `verifyQuorum` ו-`checkDeltas`, ואין להם
vectors — מימוש שני יכול להתפצל בדיוק שם.
**צעדים**: ב-`src/lib/consent/vectors/build.ts` הוסף קובץ חמישי `quorum.json`:
לכל `rule.kind` ב-`quorum.ts` (unanimous, majority, k-of-n, agreers-only,
timeout, weighted-unanimous-positive, weighted-threshold) — מקרה עובר ומקרה
נכשל, עם אירועי הצבעה חתומים, `memberWeights` כמחרוזות, והתוצאה + ה-reason.
ולכל `Delta.kind` ב-`deltaCheck.ts` — לפני/אחרי/דלתא → ok או reason.
עדכן `VECTOR_FILES`, את `vectors.test.ts` (freeze + replay), `spec/consent-v1/README.md`,
ו-SPEC §10 + §12 (O-4 → סגור).
**קבלה**: `npx vitest run src/lib/consent/vectors` ירוק; `npm run vectors:consent`
פעמיים ⇒ אותם קבצים; ה-diff של הקבצים הקיימים **ריק**.

### B2 — ECDSA low-S (O-2)
**למה**: WebCrypto מחזיר S גבוה או נמוך באקראי; שתי הצורות מאומתות ⇒ אותה
חתימה בשני ids.
**צעדים**: ב-`signCanonical` (`src/lib/crypto/sign.ts`), לאלגוריתם `ECDSA-P256`
בלבד: אם `s > n/2` החלף ל-`n − s` (P1363: 32 בייט r ‖ 32 בייט s; BigInt).
**המאמת לא משתנה** (אירועים ישנים עם S גבוה נשארים תקפים). vector חדש
ב-`signatures.json`: חתימה עם S גבוה מאומתת; `signCanonical` מנרמל אותה.
SPEC §3 + §12 (O-2 → "חותם מנרמל; מאמת מקבל את שתיהן").
**קבלה**: טסט שחותם 50 פעם ב-P-256 ובודק ש-`s ≤ n/2` תמיד; freeze ללא diff בקיים.

### A1 — דגל Space לפי רקמה
**למה**: היום הדגל הוא localStorage בדפדפן — אי אפשר להריץ פיילוט על רקמה.
**צעדים**: env בשרת `SPACE_SYNC_PROJECTS` (רשימת project ids, ריק = כבוי;
דרך `$env/dynamic/private` — לא `process.env`, ראו זיכרון "vite dev doesn't fill
process.env"). חשוף אותו ללקוח דרך ה-layout data של `(reg)` (רשימה, לא סוד).
`spaceSyncEnabled(projectId?)` ב-`spaceStore.svelte.ts`: localStorage נשאר
override של מפתחים; אחרת — הפרויקט ברשימה. עדכן את הקוראים (`shadowSign.ts`,
`SpaceProjectionShadow.svelte`) להעביר projectId. עדכן `HOWTO_SPACE_SYNC.md`.
**קבלה**: טסט יחידה לשלושת המצבים; בלי env — התנהגות זהה להיום.

### A3 — טלמטריית אי-התאמות לשרת
**למה**: קריטריון היציאה מ-shadow (HANDOFF T2: 30 יום או 1,000 אירועים, 0
אי-התאמות לא מוסברות) לא ניתן למדידה כשהטלמטריה היא `console.log`.
**צעדים**: endpoint `POST /api/consent/telemetry` (מאומת, rate-limited) שמקבל
`{projectId, kind, chainValue, strapiValue}` בלי PII; אגרגציה לקובץ/לוג בשרת
בדפוס של `src/lib/p2p/telemetry.ts` + סקריפט דוח. `SpaceProjectionShadow`
שולח במקום/בנוסף ל-console. הוסף ל-`qidsAccess`/authz לפי `CLAUDE.md`.
**קבלה**: טסט ל-endpoint (מאומת בלבד, ולידציה); `npm run check:proxy` ירוק.

#### A3 — מה נבנה (2026-10-30)

- **צורה**: שורה אחת לכל **snapshot** של ההשוואה, לא לכל אי-התאמה:
  `{v:1, pid, events, compared, mismatches:[{kind:'balance', member, chain, strapi}]}`
  (אגורות כמחרוזת עשרונית). snapshot נקי הוא הראיה שנספרת ליציאה, ו-`events`
  הוא המונה של "1,000 אירועים". אין שם, אין אימייל, אין מזהה המדווח. `member`
  הוא מזהה החבר שהיתרה שלו שונה, כי זה מה שאי-התאמה מתארת. קוד משותף:
  `$lib/consent/shadowTelemetry.ts` (`validateShadowReport`, `shadowReportKey`).
- **שרת**: `POST /api/consent/telemetry` → `$lib/server/consent/shadowTelemetry.ts`.
  מחובר בלבד (`locals.uid`), JSON בלבד, 30 לדקה למשתמש (`RateLimiter` הקיים),
  שורה `[space-shadow-telemetry]` ב-stdout, ועל ה-VPS היא מגיעה ל-Axiom
  (`vps-docker`). JSONL אופציונלי ב-`CONSENT_TELEMETRY_FILE`.
- **לקוח**: `SpaceProjectionShadow` שולח רק כשהרפליקה `synced` (לוג שנמשך
  חלקית שונה מ-Strapi מעצם הגדרתו), וכל snapshot נשלח פעם אחת בסשן
  (`$lib/client/shadowTelemetry.ts`).
- **דוח**: `node scripts/space-shadow-report.mjs <jsonl | log | ייצוא Axiom> [--json]`
  — לכל רקמה: ימים, אירועים, snapshots נקיים, אי-התאמות ייחודיות (שלושה חברים
  שרואים אותו פער = אחת), והאם הקריטריון מתקיים (30 יום **וגם** 1,000 אירועים,
  ו-0 אי-התאמות).
- **authz**: ה-endpoint אינו qid ואינו action, ולכן אין לו מקום ב-`qidsAccess`.
  זה אותו דפוס כמו `/api/v1/p2p/telemetry`.
- **מה שהטלמטריה לא מבחינה בו**: פער בין נתוני ה-GraphQL שהדף טען לבין אירוע
  שנחתם אחריהם מופיע כאי-התאמה. בדוח הוא ייראה כאי-התאמה שנעלמה ב-snapshot
  הבא; ההסבר הוא עבודה של אדם.

### A2 — הרחבת חתימות ה-shadow (באצוות של 3–4 actions לסשן)
**למה**: 7 actions חותמים; פיילוט על projection שחסרות בו רוב הפעולות יראה
אי-התאמות שהן חוסר כיסוי, לא באגים.
**הדפוס הקיים**: `src/lib/consent/specs/s2b.ts` (מקור יחיד לצורת ה-predicate,
עם deriver שמשלב params + תוצאת action) ← `s2bShadowJobs` ←
`shadowSignForAction` ב-`src/lib/client/shadowSignRegistry.ts`. טסטים ב-`s2b.test.ts`.
**המועמדים** (יש reducer, אין חתימה) — אמת לכל אחד את ה-action המדויק לפני מיפוי:

| reducer | config מועמד |
|---|---|
| `tosplit.create` | `createTosplit` — ✔ אצווה 1 (ids בלבד: `halukaIds`, `saleIds`) |
| `haluka.approve` / `haluka.confirm` | `approveHaluka` / `confirmHaluka` — ✔ אצווה 1, **סטטוס בלבד** (בלי `hervachDeltas` — ראו "ממצא היתרות"; confirm רק ב-`kind:'receive'`) |
| `pgisha.create` / `pgisha.approve` | `createNewMeeting` / `approveMeeting` — **⏸ הוצא מהתור (2026-10-30)**: הפגישות עוברות לאתר נפרד (magik-meetings), שם הן MVP לתקשורת גם בלי שרת ועם אורחים. לאורח אין מפתח, ומי שחותם בשבילו הוא שאלת תכנון, לא אצווה. בנוסף, סשן אחר מעביר עכשיו את כל ה-UI של הפגישות. לחזור לזה רק אחרי שההעברה תסתיים, ובתכנון משותף עם magik-meetings |
| `time.tick` | `timerStart` / `timerStop` — ✔ אצווה 2 (ראו "טיימרים" למטה) |
| `pendm.vote` / `decision.vote` / `ask.vote` / `sheirutpend.vote` | ✔ אצווה 4: `voteOnPendm` → `pendm.vote`, `voteOnDecision` → `decision.vote` (חוץ מ-`saleClaim`, שנחתם כבר ב-`decisionMaking`). **לא**: `voteOnAskm`/`voteOnMaap`/`voteOnPmash` (בקשות ומשאבים, אין reducer), `approveSheirutpend` (עדכון ישיר ולא הצבעה, ואין לו קוראים) |
| `project.join` | `finalizeJoinAcceptance` — **לא מתאים כמו שהוא**: ה-reducer מוסיף את `ev.actor`, אבל ה-action מורץ ע"י החבר המאשר ולא ע"י המצטרף. צריך `predicate.member` ב-reducer (שינוי פורמט + vector) או חתימה בצד המצטרף |
| `mission.approve` | `closeFiniapruval` — ✔ אצווה 3, **בלי `amount`** (ראו "אישור משימה" למטה) |
| `project.amend` | ✔ A2b P1–P2: `updateProjectDetails` (רקמה של חבר אחד, קישורים משניים, הצעות) + ה-yes שסוגר ב-`voteOnDecision`. שתיקה = P3 |

לכל action: spec ב-`s2b.ts` + רישום + טסט שמוודא שה-predicate בדיוק בצורה
שה-reducer קורא (הרץ את האירוע דרך `project()` ובדוק את ה-state).
**קבלה לכל אצווה**: טסטים ירוקים; עדכון הטבלה כאן (✔ לכל שורה שנעשתה).

#### ממצא היתרות (2026-10-30) — ✔ הוכרע באותו יום

`User.hervachti` ב-Strapi הוא **מספר אחד למשתמש, על פני כל הרקמות שלו**. הוא
זז רק בשני מקומות: אישור חלוקה (`applyTosplitApproval`, ‏`hervachUpdates`) ואישור
קבלה של ההעברה האחרונה (`confirmHaluka`, מ-`Tosplit.hervachti`). מנגד:

1. **ההשוואה של T2/A3** מעמידה את `projection.balances` של רקמה **אחת** מול
   ה-`hervachti` **הגלובלי**. חבר בשתי רקמות עם חלוקות ⇒ אי-התאמה קבועה שאינה
   באג. רוב משתמשי הטסט (256/258/261) הם בדיוק כאלה.
2. **genesis (T6)** מייבא את אותו `hervachti` גלובלי כיתרת הפתיחה של הרקמה —
   אותה טעות, בעוגן החתום.
3. **`mission.approve`** מזכה את ה-balance בערך העבודה, ו-`hervachti` לא זז
   באישור משימה. לכן אלה שני מושגים שונים בשם אחד.

**מה צריך להכריע:** מה `balances` בפרויקציה אמור לייצג — כסף שהתקבל מחלוקות
ברקמה הזו (ואז ערך ההשוואה בצד Strapi = סכום רכיבי `Tosplit.hervachti` של
החלוקות שהסתיימו ברקמה, ו-`mission.approve` לא נוגע בו), או שווי שנצבר (ואז
ההשוואה מול `hervachti` שגויה מהיסוד ויש למצוא ערך אחר). עד ההחלטה: אצווה 1
חותמת סטטוס בלבד, והדוח של A3 יראה אי-התאמות יתרה שאינן באגים.

**ההחלטה (המשתמש, 2026-10-30): יתרה = כסף מחלוקות באותה רקמה בלבד.** ל-`hervachti`
הגלובלי יש ערך משלו: הוא יוצר "שרשרת" בין-רקמתית שמוודאת שהמספרים מסונכרנים בכל
מקום. אבל להשתמש בו פירושו שרקמה אחת מאומתת דרך רקמה אחרת, וזה לא רלוונטי
לריבונות של רקמה. לכן הבסיס הוא לפי רקמה. **מה מומש:**

- `$lib/consent/rikmaSplitBalances` (טהור) — שני הכללים של Strapi בדיוק: באישור
  חלוקה כל רשומה שאינה `noten`/`mekabel` (כמו `hervachDeltasFrom`); כשההעברה האחרונה
  מאושרת — רשומות הנותן והמקבל (כמו `confirmHaluka`). באגורות, עיגול לכל רשומה.
- `/api/consent/genesis/[projectId]` מחזיר עכשיו את היתרה **לפי רקמה** (מ-`/api/tosplits`
  דרך `$lib/server/consent/rikmaBalancesExport`), 0 לחבר שלא קיבל כלום, ו-
  `balanceSource: 'rikma-splits'`. genesis שנחתם לפני השינוי נושא את הערך הגלובלי;
  ברקמות הטסט זה לא משנה.
- `SpaceProjectionShadow` משווה מול אותו export (ולא מול `user_1s.hervachti`), טוען אותו
  מחדש כשהלוג גדל, ושולח טלמטריה רק כשהמספרים של Strapi שייכים לאותו גודל לוג.
- `mission.approve` ייחתם **בלי** `amount` — כשיגיע תורו (אצווה 3).
- **לא נבדק מול Strapi חי**: שאילתת ה-REST (populate של component + relation). אם
  היא נכשלת, ה-export מחזיר 502 והפאנל נשאר אפור. זה נראה מיד אחרי deploy.

#### טיימרים — אצווה 2 (2026-10-30)

- **ה-subject הוא הטיימר** (`timer:<id>`), לא המשימה: ב-stop אין מזהה משימה, ורשימת
  ה-intervals של הטיימר היא הרשומה ב-Strapi שמשווים אליה. ה-reducer ממפתח לפי
  id בלבד, ולכן לא השתנו פורמט או vector. ה-start נושא `mission` לקישור בהמשך.
- **`order` = זמן ה-interval** (start או stop, ב-ms). כך start ו-stop לא בולעים זה
  את זה, ו-stop חוזר על אותו interval (טאב שני, עדכון בוט כפול) מתקפל לראשון
  במקום להיספר פעמיים.
- **`sessionMs`** = סכום ה-intervals שה-stop סגר, כלומר אלה שמסתיימים בזמן העצירה
  האחרון (`closedByStop`). זה לא `totalHours`, שמעוגל לדקות.
- **החיבור**: הטיימרים בדפדפן שולחים ל-`/api/action` דרך `executeTimerAction`
  (`func/timers.js`), לא דרך `actionClient`, ולכן ה-hook נקרא שם.
- **השוואה**: `/api/consent/timers/[projectId]?ids=` מחזיר מ-Strapi את סכום
  ה-intervals הסגורים (ms מדויקים) לטיימרים שביקשו, ברקמה הזו בלבד, עד 100.
  הפאנל משווה רק טיימרים שה-start הראשון שלהם בשרשרת פתח טיימר חדש (`fresh`),
  כי לטיימר ישן שחודש יש שעות שהשרשרת לא ראתה. אי-התאמה נשלחת כ-`kind:'timer'`.
- **פערי כיסוי שיופיעו כאי-התאמת טיימר** (אלה פערים אמיתיים, לא רעש):
  - עריכת intervals ב-`TimeEditor`;
  - סגירת interval יתום בזמן resume או ב-`timerSave`;
  - start/stop מהשרת (בוט טלגרם, MCP `timerActionTool`, mastra) — **נסגר ברובו
    בחתימה משותפת של המכשיר** (למטה); נשאר פער רק כשאין מכשיר שיכול לחתום.
  טיימר ידני (`manual`) לא נחתם בכלל, כי השעות שלו מוקלדות.

#### חתימה משותפת של המכשיר — טיימר מערוץ חיצוני (2026-10-30)

לשרת אין מפתח של החבר, ולכן start/stop מטלגרם, מה-MCP או מהעוזר באתר לא נחתמו.
עכשיו השרת מבקש מהמכשירים של החבר לחתום, ובאותה הזדמנות מודיע לו שהשעון שלו זז
ומאיפה.

- **הזרימה**: `executeTimerAction` בשרת שולח `via` (‏`telegram` / `mcp` /
  `assistant`) → `/api/action` (רק לקורא פנימי, `isInternalRequest`) קורא ל-
  `requestDeviceCosign` (‏`$lib/server/consent/deviceCosign`) → push לכל
  ה-`machshirs` של החבר, עם `cosign` בתוך ההודעה ו-TTL של שעה → ה-service worker
  (`cosignInSw`, ‏`$lib/crypto/swCosign`) בודק, חותם במפתח המכשיר עם heads מקומיים,
  שומר ב-IDB + spaceIndex (כמו `replica.publish`) ומציע ל-relay. push שנכשל לא
  אובד: ה-sync הבא של טאב מציע אותו שוב.
- **מה החתימה הזו אומרת**: "המכשיר שלי ראה שהשרת דיווח את זה, סמוך לזמן שזה קרה".
  זה צר יותר מלחיצה במכשיר, ולכן `judgeCosignRequest` (‏`$lib/consent/cosign`,
  טהור) חותם רק על `time.tick` של החבר של המכשיר, עם `order` במרחק של עד שעה
  משעון המכשיר ו-`sessionMs` עד 7 ימים. האירוע נושא `via` ב-predicate, שדה
  אופציונלי שה-reducer מתעלם ממנו. ה-vector הוא `timer-cosigned-by-device`.
  **אסור להרחיב את רשימת הפעולות בלי לחשוב מחדש**: מכשיר שחותם על כל מה שהשרת
  מבקש מבטל את הערך של כל חתימה בשרשרת.
- **"לא אני"**: כפתור בהודעה שמוביל למקום שבו אפשר לבטל את הגישה של הערוץ
  (`/me/settings/mcp`, ולטלגרם `/me/settings`). זה עדיין **לא** אירוע מחלוקת חתום.
  אירוע כזה דורש פעולה חדשה, reducer ו-vector.
- **גבולות**: רק רקמות ב-`SPACE_SYNC_PROJECTS`. space עם E2E (יש בו `epoch.rotate`)
  לא נחתם מה-worker, כי אסור לשלוח בו טקסט גלוי, ולכן מוצגת רק ההודעה. מסירת
  push לא מובטחת: באייפון היא מגיעה רק ל-PWA מותקנת, ודפדפן סגור בדסקטופ לא יקבל
  אותה. חתימה כפולה מכמה מכשירים מתקפלת לאחת, כי ה-dedupe לפי `order`.
- **תוקן בדרך**: `swSign.openDb` פתח את ה-IDB בגרסה 1 בזמן שהדף כבר בגרסה 3,
  ולכן כל חתימה ב-worker נכשלה ב-VersionError. עכשיו הוא פותח בגרסה הקיימת.
  בנוסף, `missionTimers` (העוזר) העביר את `{summary, completedTasks}` כמזהה
  הפרויקט ל-`stopTimer`.
- **לא נבדק במכשיר אמיתי**: push → חתימה ב-worker → relay. זה דורש מנוי push
  חי ורקמה ברשימה.
- **לא נבדק מול Strapi חי**: שאילתת `/api/timers` (filter `id $in` + populate של
  component). אם היא נכשלת, השוואת הטיימרים פשוט לא סופרת כלום, וחצי היתרות
  ממשיך כרגיל.

#### אישור משימה — אצווה 3 (2026-11-06)

- **קריאה אחת, שני אירועים**: `closeFiniapruval` הוא גם ההצבעה וגם הסגירה. כל קריאה
  חותמת `mission.approve.vote` על `finiapruval:<id>` (‏`what`, ‏`why`, ‏`order` = הסבב
  העומד, `$lib/finiapruval/rounds`), וה-yes שסוגר אישור **סיום** חותם גם
  `mission.approve` על השלב (`mesimabetahalich`, כמו `mission.complete`), עם `payee`
  ו-`finiapruvalId` בלבד. **אין `amount`**, לפי החלטת היתרות.
- **אישור שעות** (`isTimerSave`: שמירת טיימר, חודש) חותם רק את ההצבעה. `mission.approve`
  שם היה סוגר בפרויקציה משימה שעדיין רצה.
- **מה ה-action מחזיר עכשיו**: `round`, ובסגירה גם `missionStageId` ו-`payee`. אלה
  נגזרים רק מנתונים שהשרת כבר קרא (qid 117), בלי שאילתה נוספת.
- **החיבור**: `fiappru.svelte` שולח ל-`/api/action` ישירות, ולכן ה-hook נקרא שם, כמו
  בטיימרים.
- **quorum**: `policy.ts` דורש QuorumProof ל-`mission.approve`. במצב `available`
  היעדרו הוא אזהרה בלבד, וה-evidence (ההצבעות) נמצא בשרשרת בשביל המאמת שיבנה אותו.
- **פערי כיסוי**: סגירה בשתיקה (timegrama, בצד השרת); counter (`counterFiniapruval`)
  לא נחתם; שעות שמוחזקות ללקוחה (`heldForCustomer`) חותמות את ההצבעה בלבד.
- **לא נבדק בדפדפן**: דורש הצבעה אמיתית ברקמה שב-`SPACE_SYNC_PROJECTS`.

#### הצבעות — אצווה 4 (2026-11-06)

- **אותה צורה כמו `addVote`**: `voteOnPendm` ו-`voteOnDecision` נחתמים דרך
  `addVoteConsentSpec` עצמו (subject `pend:<id>` / `decision:<id>`). כך הספירה
  ומפתח ה-dedupe משותפים, והצבעה שנחתמת פעמיים מתקפלת לאחת.
- **הסבב מהשרת**: `voteOnPendm` מחזיר עכשיו `order` (ה-`orderon` שהוא מחשב ולא מקבל
  מהלקוח). `voteOnDecision` כבר החזיר `order` בסוגים שיש בהם סבבים (ארכוב/עריכה,
  מלגה, מבצע), ובשאר הסוגים זה 0.
- **`saleClaim` נשאר בנקודת הקריאה** (`decisionMaking.svelte`, עם `standingOrder`),
  ולכן הוא מדולג ב-registry.
- **`project.amend` — ⏸ שאלה למשתמש** (הצעה ב-"A2b" למטה): `updateProjectDetails` משנה ישירות רק ברקמה
  של חבר אחד. ברקמה עם יותר חברים הוא פותח `Decision` לכל שדה, והשינוי נכנס רק
  כשההחלטה מבשילה: בהצבעה האחרונה, או בשתיקה בצד השרת. בנוסף, אוצר המילים של
  `path` לא הוגדר אף פעם: ה-vectors משתמשים ב-`restime` במילישניות, ו-Strapi שומר
  קוד (`'feh'`). צריך להחליט (א) מי חותם על השינוי ומתי, ו-(ב) רשימת paths וסוגי ערכים,
  ואז זה שינוי פורמט עם vector.

#### A2b — `project.amend` (2026-11-06; אושר, P1–P4 בוצעו)

**מה קיים היום.** `updateProjectDetails` משנה ישירות רק ברקמה של חבר אחד. ברקמה עם
יותר חברים הוא פותח `Decision` לכל שדה שהשתנה (12 סוגים: `name`, `pubdes`, `prides`,
`newFlink`, `newWlink`, `timtoM`, `pic`, `codeLicense`, `vallueadd`/`vallueles`,
`address`/`look`), ומעדכן קישורים משניים (github/discord/drive/twitter/whatsapp)
ישירות. ההחלטה מבשילה בשני מקומות שמחילים את אותו שינוי בקוד כפול: ה-yes האחרון
ב-`voteOnDecision`, או השתיקה ב-`/api/timegrama/decision`. היום שום שלב בזה לא נחתם,
חוץ מההצבעות (אצווה 4).

**העיקרון.** `project.amend` נחתם **כשהשינוי נכנס לתוקף**, לא כשהוא מוצע. ההצעה וההסכמה
נחתמות כ-`decision.create` + `decision.vote`, לפי "לרכוב על מודל ה-Decision". ה-reducer לא
משתנה, ולכן אין bump של `STATE_ROOT_VERSION`.

**1. אוצר ה-paths — רשימה סגורה (v1), ערך מלא ולא דלתא**

| path | ערך | מאיזה kind / שדה |
|---|---|---|
| `name` | מחרוזת | `name` |
| `publicDescription` / `descripFor` | מחרוזת או null | `pubdes` / `prides` |
| `links/website`, `links/facebook` | מחרוזת או null | `newWlink` / `newFlink` |
| `links/github`, `links/discord`, `links/drive`, `links/twitter`, `links/whatsapp` | מחרוזת או null | עדכון ישיר |
| `restime` | **הקוד של Strapi** (`'feh'`, …), לא מילישניות | `timtoM` |
| `pic` | מזהה upload כמחרוזת | `pic` |
| `codeLicense` | `{license, openYears}` | `codeLicense` |
| `values` | **כל הקבוצה אחרי השינוי**, ids ממוינים לפי code units | `vallueadd` / `vallueles` |
| `address` / `look` | הערך שהוחל אחרי הוולידציה מחדש | `address` / `look` |

- **ערך מלא**, כי `value.set` (deltaCheck) והשוואה מול Strapi עובדים על ערכים, ושני
  אירועים על אותו path מתקפלים לפי הסדר הטופולוגי בלי לדעת מה היה לפניהם.
- **`restime` כקוד**: זה אוצר המילים של הפלטפורמה; ממנו נגזרים המילישניות
  (`calcDeadlineMs`). ה-`restime: 172800000` שב-`events.json` הוא נתון לדוגמה ב-
  `project.create`, ששום reducer לא מפרש. SPEC יקבע שהערך הוא הקוד, וה-vector החדש
  ישתמש בקוד. ה-vector הקיים לא זז.
- **מקור יחיד**: פונקציה טהורה `decisionToAmend(kind, decisionAttrs, current?) →
  {path, value} | null` ב-`$lib/consent/specs/projectAmend.ts`. שני המחילים בשרת משתמשים
  בה במקום הקוד הכפול, וגם החותם בלקוח. ככה מה שנחתם הוא בדיוק מה שנכתב ל-Strapi.

**2. מי חותם ומתי — שלושה רגעים**

| רגע | מי חותם | מה נחתם |
|---|---|---|
| **רקמה של חבר אחד**, עריכה ישירה | העורך, מהלקוח, דרך ה-registry | `project.amend` לכל path שהשתנה. ה-action מחזיר `applied: [{path, value}]` |
| **קישורים משניים** ברקמה עם כמה חברים | אותו דבר | אותו דבר (הם לא עוברים Decision היום) |
| **פתיחת הצעה** | המציע | `decision.create` (`kind`, `ref` = ה-path, והערך המוצע) + ה-`decision.vote` שלו (השרת כבר כותב לו yes) |
| **ה-yes האחרון** | המצביע, מהלקוח | `decision.vote` (קיים) + `project.amend` עם `decisionId`. ‏`voteOnDecision` מחזיר `applied` בהבשלה |
| **הבשלה בשתיקה** | **ראו 3** | `consensus.timeout` + `project.amend` |

`decisionId` הוא שדה אופציונלי ב-predicate שה-reducer מתעלם ממנו (כמו `via` בטיימרים).
ההצבעות על `decision:<id>` הן ה-evidence ל-QuorumProof בעתיד (`unanimous`). עד strict
ההיעדר שלו הוא אזהרה.

**3. שתיקה — ההחלטה העיקרית שנדרשת ממך**

לשרת אין מפתח של אף חבר. שתי אפשרויות:

- **(א) חתימה עצלה — מומלץ.** הלקוח הראשון של חבר שפותח את הרקמה ורואה Decision
  שה-timegrama סגר (`archived`, בלי `project.amend` מתאים בשרשרת) חותם
  `consensus.timeout` (`attestedNow`, `expectedEnd`) ואחריו `project.amend`. זה בדיוק
  המודל של PLAN_restime_in_signed_chain §3.2: timeout הוא אירוע שכל מי שראה את
  הדדליין עובר יכול לחתום. המציע מועדף, אבל כל חבר רשאי. שתי חתימות מקבילות של אותו
  ערך לא מזיקות: ה-reducer קובע את אותו ערך. **מחיר**: עד שמישהו נכנס, ה-projection
  מפגר אחרי Strapi, ובטלמטריה זה נראה כ"אי-התאמה שנעלמת".
- **(ב) חתימה משותפת של מכשיר (push).** כמו בטיימרים. **לא מומלץ**: `judgeCosignRequest`
  צר בכוונה ("מכשיר שחותם על כל מה שהשרת מבקש מבטל את הערך של כל חתימה"). הרחבה
  שלו להגדרות רקמה היא בדיוק ההרחבה שהכרטיס של הטיימרים אוסר.

**4. השוואה (אחרי שזה נחתם)** — `SpaceProjectionShadow` משווה `settings` מול שדות
הרקמה ב-Strapi, רק ל-paths שיש להם `project.amend` בשרשרת (ל-genesis של T6 אין
settings). טלמטריה `kind:'setting'`.

**שלבים (אחרי אישור):** P1 מפרט + `decisionToAmend` + vector (S) · P2 חבר אחד, קישורים
משניים, `decision.create`, ה-yes האחרון, ואיחוד שני המחילים (M) · P3 שתיקה בחתימה עצלה (M) ·
P4 השוואה וטלמטריה (S).

**אושר (המשתמש, 2026-11-06):** `restime` כקוד, `values` כקבוצה מלאה, שתיקה = חתימה עצלה (א).

**P1–P2 — מה נבנה (2026-11-06)**
- `$lib/consent/specs/projectAmend.ts`: `AMEND_PATHS`, `decisionToAmend`, `identityAmend`,
  `directEditAmends`, `amendToStrapiWrite` ו-`amendOrder`, וגם ה-specs של `project.amend` ושל
  `decision.create` להצעת הגדרה. SPEC §6.6. vector `events.json › rikma-settings` (תוספת בלבד).
- **ממצא בבנייה: `order`.** מפתח ה-dedupe לא כולל את ה-path. בלי `order`, כל amend של
  אותו חבר היה מתקפל לאחרון שלו, ושינוי שם היה מוחק שינוי restime. לכן
  `order = "<path>#<decisionId | direct>"`. Decision שנחתם פעמיים עדיין מתקפל לאחד.
- **שני המחילים אוחדו**: `voteOnDecision` (ה-yes האחרון) ו-`/api/timegrama/decision`
  (שתיקה) מחילים את השינוי דרך `decisionToAmend` + `amendToStrapiWrite`. ב-timegrama
  זה מחליף GraphQL inline עם escaping ידני ב-qid עם משתנים (`strapiClient`, כמו מסלול
  הזהות שכבר היה שם). `applyIdentityDecision` מחזיר גם `amend`.
- **מה נחתם**: `updateProjectDetails` מחזיר `amends` (רקמה של חבר אחד, קישורים משניים)
  ו-`decisions[].path/value`. ה-registry חותם `project.amend`, `decision.create` וה-yes
  של המציע. `voteOnDecision` בהבשלה מחזיר `amend`, והמצביע חותם `project.amend`
  עם `decisionId`.
- **הבדלי התנהגות קטנים** (מכוונים): טקסט מ-Decision נכתב אחרי trim, ו-`vallues` נכתב ממוין.
**P3 — שתיקה, חתימה עצלה (2026-11-06)**
- **אין שדה חדש ב-Strapi.** מה ש-Decision של הגדרה שינה הוא פונקציה טהורה של השדות
  שלו (`decisionToAmend`). יש שני חריגים, ושניהם נפתרים מול הרקמה כפי שהיא עכשיו:
  - `values`: רק ה-Decision האחרון שהבשיל מדווח, עם הקבוצה של עכשיו. הערך הוא הקבוצה
    המלאה, ולכן דילוג על הקודמים לא מאבד כלום.
  - `address`: מדווח רק כל עוד הוא עדיין ה-slug, כי כתובת שנדחתה לא הוחלה.
- **שרת**: `GET /api/consent/settings/[projectId]` (חבר בלבד; REST כמו שאר ה-exports)
  → `$lib/server/consent/settingsMatured`. מחזיר את 50 ה-Decisions האחרונים, עם `amend`,
  `maturedBy` (‏`vote` כשכל החברים אמרו כן, אחרת `silence`), `maturedAt`, `expectedEnd`
  ו-`counted`.
- **לקוח**: `planLazySettingsSigns` (טהור, ב-`projectAmend.ts`) ו-`$lib/client/settingsLazySign`.
  הם רצים פעם אחת בסשן לכל רקמה, אחרי שה-replica הראשון ב-`SpaceProjectionShadow` מסונכרן.
  בשתיקה נחתם קודם `consensus.timeout` (‏`closingRound:0`, `attestedNow`) ואז ה-amend.
  כשההחלטה הבשילה בהצבעה שלא נחתמה, נחתם ה-amend בלבד.
- **ההגנה החשובה**: חתימה מאוחרת של Decision ישן נכנסת אחרי כל ה-heads, ולכן גוברת על
  מה שקדם לה. לכן נחתם **רק ה-Decision החדש ביותר לכל path**, ורק כשאין בשרשרת amend
  של אותו path שנחתם אחרי ש-`maturedAt` עבר.
- **מחיר ידוע**: עד שחבר פותח את דף החלוקה, השרשרת מפגרת אחרי Strapi. כרגע זה הדף היחיד
  שמסנכרן Space.
- **לא נבדק מול Strapi חי**: שאילתת ה-REST (‏`filters[kind][$in]`, ‏populate של `vots`
  ושל `timegrama`). אם היא נכשלת, ה-endpoint מחזיר 502 ושום דבר לא נחתם.
**P4 — השוואה וטלמטריה (2026-11-06)**
- `$lib/consent/settingsShadow` (טהור): משווה רק paths שיש להם `project.amend` בשרשרת.
  ל-genesis של T6 אין settings, ולכן path שהשרשרת לא ראתה הוא לא-ידוע, לא שגוי. ההשוואה
  ב-canonical JSON, ושני הצדדים בצורה הנורמלית של אוצר המילים
  (`settingsFromProjectAttrs` לצד של Strapi).
- **הטלמטריה לא נושאת ערכים.** תיאור הוא הטקסט של הרקמה, והפורמט מקבל ספרות בלבד. לכן
  `kind:'setting'`, ‏`member` = האינדקס של ה-path ב-`AMEND_PATHS`, ו-`chain`/`strapi` =
  טביעת FNV-1a של 32 ביט. לכן `AMEND_PATHS` **מוסיפים לסוף בלבד**. הדוח
  (`space-shadow-report.mjs`) מחזיק עותק שלו, וטסט מוודא ששניהם זהים.
- **מקור**: `/api/consent/settings/[projectId]` מחזיר גם `current`. הפאנל קורא אותו יחד
  עם היתרות והטיימרים, בכל פעם שהלוג גדל.
- **אי-התאמה צפויה שאינה באג**: מה-הבשלה בשתיקה ועד החתימה העצלה (P3) Strapi כבר
  מעודכן והשרשרת עוד לא. בדוח זה ייראה כאי-התאמה שנעלמת ב-snapshot הבא.
- **פערים**: `proposeProjectLink` ב-mastra קורא ל-action בצד השרת, ולכן אין
  מי שיחתום.
- **לא נבדק מול Strapi חי ולא בדפדפן**: הכתיבה של timegrama דרך `strapiClient`
  (`updateProjectDetails` / `43updateProfilePic` עם טוקן האדמין). זה אותו טוקן ואותה
  דרך שמסלול הזהות כבר משתמש בהן.

### B6 — אימות התחייבויות אינקרמנטלי
**למה**: `verifyCommitments` משחזר את כל סגור האבות לכל אירוע ⇒ O(n²) בסנכרון
(HANDOFF §8.3). היום לא מורגש (רק snapshots נושאים התחייבויות); ב-strict של S3b כן.
**צעדים**: cache של `ProjectState` לפי id של אירוע (או לפי קבוצת heads) בתוך
`commitment.ts`, עם מפתח שמכסה את הסגור; `projectFrom(base, tail)` כבר קיים
(T10). **הסמנטיקה לא משתנה** — אותו root בדיוק.
**קבלה**: טסט property (fast-check): תוצאות זהות עם ובלי cache על DAGs אקראיים;
benchmark: 500 אירועים עם התחייבויות — מספר קריאות ל-`applyEvent` לינארי; freeze ללא diff.

#### B6 — מה נבנה (2026-11-06)

- **הרעיון**: state של סגור-אבות הוא פונקציה טהורה של (projectId, ה-heads), כי id הוא
  hash של התוכן. לכן cache לפי heads אף פעם לא מתיישן. ה-state של אירוע = ה-state
  של ההורים + `applyEvent` אחד, כי האירוע הוא צאצא של כל השאר, ו-topoSort שם אותו
  אחרון בלי לשנות את סדר האחרים.
- **החריג**: אב עם אותו מפתח dedupe. אז ה-dedupe יכול להפיל אחד מהשניים, ורק replay
  מלא מדויק. גם state של הורה שלא נמצא ב-cache נופל ל-`project` מלא. הבדיקה
  שמרנית: היא סורקת את כל ה-pool, כך שהתנגשות עם ענף אחר עולה רק בביצועים.
- **איפה**: `stateAt` ו-`createCommitmentCache` (LRU, ברירת מחדל 256) ב-`commitment.ts`.
  בברירת מחדל ה-cache חי לקריאה אחת בלבד. `ingestEvent` ו-`verifyConsentEvent` (שרת)
  מעבירים את `defaultCommitmentCache` המשותף, **רק אחרי שהחתימה וה-id אומתו**: ה-cache
  ממופתח לפי ids, וטסטים עם ids מזויפים שחוזרים על עצמם היו מרעילים cache גלובלי.
- **קבלה**: property (fast-check, 40 DAGs אקראיים עם merges, התנגשויות dedupe ו-roots
  שקריים): אותן תוצאות עם ובלי cache, בסדר רגיל ובסדר הפוך, ועם cache קטן שמפנה.
  שרשרת של 500 אירועים: ‏≤2 replays מלאים ו-499 צעדים אינקרמנטליים (מאפס זה ~N²/2).
  ה-vectors ללא diff.

### C0 — Node 24 + גילוי יכולות PQ 🧑
**למה**: ML-DSA/ML-KEM ב-WebCrypto קיימים מ-Node 24.7. Vercel כבר על 24
(`engines`), ה-VPS (`Dockerfile`, `node:22-alpine`) ומכונת הפיתוח על 22.
**צעדים (הסוכן)**: עדכן `Dockerfile` ל-`node:24-alpine`; הוסף
`src/lib/crypto/pqCapabilities.ts` — `await crypto.subtle.supports?.(…)` /
ניסיון `generateKey({name:'ML-DSA-65'})` ו-`ML-KEM-768` עם catch → `{mldsa, mlkem}`;
טסט שמדלג (`it.skipIf`) כשאין תמיכה.
**🧑 המשתמש**: התקנת Node 24 מקומית, deploy של ה-VPS (קרא `deploy-api.ps1`
והזיכרון על compose v1 לפני). **הסוכן לא מבצע deploy.**
**קבלה**: build של ה-Docker image עובר מקומית (אם Docker זמין); הטסטים עוברים ב-22 וב-24.

### B4 — מזהה מכשיר כטביעת אצבע (O-7)
**למה**: `device` = SPKI מלא; במפתח ML-DSA-65 זה ~2.6KB בכל אירוע.
**צעדים**: `deviceId(spki) = b64url(SHA-256(SPKI DER))` (43 תווים). המאמת מקבל
את שתי הצורות (מבחין לפי אורך/פענוח). `PubKeyResolver` + `consentStore` +
`peerKeys` מאתרים מפתח לפי טביעה. **חותמים ממשיכים לפלוט SPKI** עד דגל נפרד —
המשימה רק מאפשרת קריאה. `epoch.wraps` ממופה לפי `device` — בדוק שגם הוא סובל
את שתי הצורות. אם נדרש שדה/אינדקס ב-Strapi (1.0b) — 🧑, תעד ועצור.
מפרט §1 + §4 + vectors (אירוע עם `device` כטביעה, מאומת מול אותו מפתח).
**קבלה**: vectors חדשים עוברים; כל הקיימים ללא diff; טסט relay roundtrip עם שתי הצורות.

**✔ שלב הקריאה (2026-11-06)**:
- `src/lib/crypto/deviceId.ts` — `deviceFingerprint`, `isDeviceFingerprint` (43 תווים,
  b64url קנוני של 32 בייט; אין SPKI באורך הזה), `sameDevice`, `findDevice`.
- **בלי שינוי Strapi**: `consentStore.getKey` מקבל טביעה ומתאים אותה מול
  `getKeysForUser(actor)` (לכל משתמש מעט מפתחות); `resolvePeerKey` סורק את `peerKeys`
  של ה-actor, ממלא מהרשת פעם אחת (עם ה-negative cache הקיים). טביעה מאתרת רק מפתח של
  ה-actor עצמו, ומפתח מבוטל נשאר מבוטל.
- `verifyDeviceCert`: הכלל "`device` מציין את ה-parent" במקום שוויון מחרוזות;
  `devices/reset` (protest) מקבל את שתי הצורות.
- `epoch.wraps` ממופתח לפי ה-SPKI של המקבל מתוך מאגר המפתחות, לא לפי `device` של
  אירוע — לא מושפע (גם `vault` משווה recipients מהמאגר).
- vectors (`signatures.json`, תוספת בלבד): `deviceId` לכל מפתח + `deviceIdRule`;
  תקפים `device-id-event`, `device-cert-by-device-id`; פסולים
  `device-id-of-unknown-key`, `device-id-of-another-key`, `device-id-non-canonical-spelling`.
  SPEC §1, §3, §4, §10, §12 (O-7 ◐).

**⬜ שלב הפליטה (לא עכשיו)**: חותמים יפלטו `deviceId` רק אחרי שכל הלקוחות מריצים את
קוד הקריאה — לקוח ישן **מפיל** אירוע עם טביעה (`unknown_or_revoked_device`) ונשאר בלי
אותו בשרשרת שלו. לכן: deploy של הקריאה (Vercel + VPS), חלון של כמה שבועות, ורק אז מתג
(ברירת מחדל כבוי). זה רלוונטי באמת רק עם מפתחות ML-DSA (C1) — ב-Ed25519 החיסכון 16 תווים.

### C2 — KEM היברידי (O-9)
**למה**: תנאי (ד) לשער S3 (PLAN_serverless_p2p_data §1, SPEC §13.2).
**צעדים**: ב-`src/lib/space/e2e/kem.ts`: `WrappedKey` v2 = `{v:2, epk, kemCt, iv, ct}`;
`kek = HKDF-SHA256(ikm = ss_ecdh ‖ ss_mlkem, salt = 32×0, info = "freemates-epoch-wrap-v2")`.
מפתח KEM של מכשיר מתרחב לזוג (ECDH + ML-KEM-768); רישום ב-key registry.
`kemUnwrap` מבחין v1/v2; v1 קריא לנצח. **גילוי יכולות** (C0): בלי ML-KEM —
v1 בלבד, וזה נרשם (לא נופלים בשקט לקלאסי כשהנמען יודע v2).
**לא לפתור** חוסר ML-KEM בדפדפן במפתח בזיכרון — זה trade-off של שער S3 (SPEC §13.2), להשאיר כהחלטה.
vectors ב-`e2e.json` (נוצרים רק ב-Node ≥ 24.7).
**קבלה**: e2e tests ירוקים ב-v1 וב-v2; vector v2 עם ערכי ביניים (`ss_ecdh`, `ss_mlkem`, `kek`).

### B3 — קצוות Ed25519 (O-1)
**למה**: מימושים לא מסכימים על S לא קנוני, מפתח מסדר קטן, R לא קנוני.
**צעדים**: אסוף מקרי קצה ידועים (חפש "Taming the many EdDSAs" / test vectors של
ZIP-215), הרץ אותם מול `crypto.subtle.verify` של Node, תעד מה מתקבל. בחר כלל
(המלצה: מה ש-WebCrypto עושה + דחייה מפורשת של מפתח מסדר קטן ב-`register`).
vectors ב-`signatures.json` (`edge` cases) + SPEC §3/§12.
**קבלה**: כל מקרה מתועד עם התוצאה הצפויה; freeze ללא diff בקיים.

**✔ בוצע (2026-11-06)**: ניסוי מול Node 22 הראה ש-WebCrypto לבד **מקבל** מפתח מסדר קטן
(עם R = O, ‏S = 0 — כל הודעה), מפתח בקידוד לא קנוני, מפתח מסדר מעורב ו-R = O; דוחה רק
S ≥ L. הכלל (SPEC §3) מחמיר מההמלצה המקורית: לא רק דחייה ברישום אלא גם באימות, ו-A
בתת-החבורה מסדר ראשוני + R ≠ O — כך שכל מימוש (dalek `verify_strict`, OpenSSL, דפדפנים)
מגיע לאותה הכרעה. `src/lib/crypto/ed25519Strict.ts` (BigInt טהור, memo לפי מפתח);
`verify.ts`, `keys/register`, `devices/pair`. ‏`signatures.json › ed25519Edge`: 7 שלשות
(תוספת בלבד). טסט נפרד מתעד מה WebCrypto עושה לבד — אם עדכון Node משנה אותו, מעדכנים
את הטבלה ב-SPEC, לא את ה-vectors.

### C1 — `cosig` (O-8)
**צעדים**: לפי SPEC §13.3 — `cosig?: {device, alg, sig}[]`; כל cosig חותם על
הגוף בלי `id/sig/cosig`; `sig` על הגוף כולל `cosig`; `id` כמו היום. `verifySignedObject`
מאמת כל cosig. `alg: 'ML-DSA-65'` דרך WebCrypto (C0). מדיניות "עוגן חייב cosig
אחרי מועד מעבר" — **רק כקוד מוכן מאחורי קבוע תאריך null**, לא מופעל.
**קבלה**: vectors (Node ≥ 24.7); אירוע ישן בלי cosig — ללא diff; הסרת cosig ⇒ `bad_signature`.

### B5 — מזכר bump v3 🧑
**צעדים**: מזכר קצר (סעיף בכרטיס הזה) שמציע לאחד את O-3 (`eventId` ב-state),
O-5 (מפתח dedupe בלי escaping), O-6 (`Boolean("false")`) ל-bump אחד: מה משתנה,
איך מזהים אירוע ישן מול חדש (`v` של אירוע? `STATE_ROOT_VERSION`?), מה קורה ל-
snapshots/genesis קיימים. **בלי מימוש** עד אישור המשתמש.

**מזכר (2026-11-06) — ממתין לאישור.**

*מה כל אחד מהשלושה אומר בקוד היום:*
- **O-3**: `tosplitVote` ו-`stageVote` כותבים `eventId: ev.id` ל-`votes`, ו-`normalizeState`
  (v2) מכניס אותו ל-root. `id` כולל את החתימה, שחותמת על `stateRoot` ⇒ הצבעה לא יכולה
  להתחייב ל-root של עצמה. אף קורא לא צריך את השדה הזה ב-root (genesis קורא
  `snapshots[].eventId`, ש-`snapshots` מוחרג ממנו ממילא).
- **O-5**: `dedupeKey` = `${actor}|${type}:${id}|${action}|${order}`. ‏`subject.id` ו-`action`
  חופשיים, אז `id:"x|a", action:"b"` ו-`id:"x", action:"a|b"` מתנגשים — אותו actor בלבד
  (actor מספרי), כלומר אירוע של חבר מסתיר אירוע אחר **שלו**. גם `order: 0` ו-`order: "0"`
  מתנגשים. היום אף יצרן לא פולט `|` בשדות האלה או `order` מספרי כמחרוזת.
- **O-6**: `what` נקרא ב-`Boolean()` ⇒ `"false"` = כן. היום כל היצרנים פולטים boolean.

*ההצעה — bump אחד, מסומן ב-`v` של האירוע:*
1. **`v: 2` לאירוע** = "אני נקרא בכללים החדשים". ‏`v: 1` נשאר תקף ונקרא בכללים הישנים לנצח
   (אינווריאנט 1). ‏`isConsentEventShape` מקבל 1 ו-2.
2. **O-6 לפי אירוע**: ב-`v: 2` `what` חייב להיות boolean, אחרת האירוע לא תקף בצורה.
   ב-`v: 1` — `Boolean()` כמו היום.
3. **O-5 אחיד לכל הגרסאות**: `dedupeKey` = canonical JSON של
   `[actor, type, id, action, order]`. חייב להיות אחיד — אחרת הצבעת `v:1` והצבעה חוזרת
   ב-`v:2` של אותו חבר לא מתקפלות ושתיהן נספרות. השינוי משנה תוצאה **רק** לאירועים עם
   `|` באחד השדות או `order` מספרי-כמחרוזת; ב-vectors אין כאלה (ייבדק ב-diff), במראה
   בפרודקשן צריך סריקה אחת (🧑 — Strapi נעול לסקריפט, ראו הזיכרון).
4. **O-3 ב-`STATE_ROOT_VERSION = 3`**: `normalizeState` v3 משמיט את `eventId` מ-`votes`
   ומ-`stageVotes` (נשאר ב-state בזיכרון). ‏`normalizeStateV2` נשאר קפוא בקוד לנצח.
   התחייבות על אירוע `v:1` מאומתת ב-v2, על `v:2` ב-v3. snapshot/genesis נושאים `stateV`
   ממילא — `verifyGenesisPredicate` ו-`restoreState` יקבלו 2 ו-3, לפי השדה. genesis קיים
   (`stateV: 2`) נשאר תקף, לא צריך genesis חדש.
5. **פריסה כמו B4**: קודם קוראים (deploy של Vercel + VPS), חלון, ורק אז מתג שגורם לחותמים
   לפלוט `v: 2` — **אותו מתג** שמפעיל את פליטת `deviceId` (לקוח ישן מפיל את שניהם באותה
   סיבה). מתג אחד, חלון אחד.
6. vectors: תרחיש חדש עם שרשרת מעורבת `v:1`/`v:2` (הצבעה חוזרת שחוצה גרסאות, `what:"false"`
   בשתי הגרסאות, `|` ב-`subject.id`, התחייבות של הצבעה ל-root של עצמה). קיימים — ללא diff.
   גודל: M, ‏1–2 סשנים.

**✔ מומש (2026-11-06), עם שינוי אחד מהמזכר — O-5:** במימוש התברר ש-`events.json` מקבע את
מחרוזות המפתח עצמן (`dedupeKeys`), ש-`dedupe-tostring-and-dangling` מקבע `1 ≡ "1"`, ושב-Strapi
יש עמודת `dedupeKey`. מפתח JSON היה משנה vector קפוא. במקומו: **escaping** של `\\` ו-`|` (ושל
`:` ב-type) — הזהות על כל מפתח קיים, אותה הגנה מההתנגשות, אחיד לשתי הגרסאות. ה-ToString של
`order` נשאר קפוא.
- `emitFormat.ts` — המתג (`EMIT_FORMAT_V2 = false`): `v`, `device` כ-deviceId, ו-`stateV` של snapshots.
  `signEvent.emitEnvelope` משמש את `buildAndSignEvent` ואת `swSign`; עם המתג דלוק הוא מסרב
  לחתום `what` שאינו boolean.
- `event.ts`: `v: 1 | 2`, `isConsentEventShape` (v2: predicate אובייקט, `what` boolean),
  `voteWhat` (v1 `Boolean`, v2 `=== true`) — ב-`stageVote`, `tosplitVote`, `quorum`; `dedupeKey` עם escape.
- `stateRoot.ts`: `normalizeState`/`computeStateRoot`/`canonicalBytesOfState` מקבלים גרסה (2 | 3),
  `stateVersionForEvent`; `commitment.ts` לפי האירוע ולפי `stateV` של snapshot; `genesis.ts`,
  `compaction.ts`, `stateRestore.ts` מקבלים 2 ו-3, כל אחד בגרסה שלו.
- vectors: `format-v2-mixed` (10 אירועים: deviceId, `"false"` ב-v1, הצבעה חוזרת שחוצה גרסאות,
  התחייבות של הצבעה ל-root של עצמה, זוג המפתחות שהתנגשו) + `shapeRejects` (4) + `formatV2Rule`;
  `events.json` +600 שורות, 0 נמחקו, יציב בשתי הרצות.

*חלופות שנשקלו:*
- **שינוי במקום, בלי `v:2`** (כל עוד הכל shadow): הכי זול בקוד, אבל מזיז roots של vectors
  קפואים, פוסל genesis קיימים (`stateV: 2`), ומפר את אינווריאנט 1. לא מומלץ.
- **placeholder ל-id במקום להשמיט את `eventId`** (O-3): משאיר את השדה ב-root אבל מחייב
  כל מאמת לחשב root פעמיים (עם ובלי האירוע עצמו). מסובך יותר בלי תועלת — אף אחד לא קורא
  את השדה מה-root.
- **לדחות**: אפשרי כל עוד אף יצרן לא פולט `stateRoot` על הצבעה; אבל כל אירוע `v:1` שנוצר
  עד אז נושא את המוזרויות לנצח, ופורט ל-Rust יצטרך לשכפל אותן. כדאי לפני הפיילוט (A4).

### A4 — פיילוט 🧑
המשתמש בוחר רקמה פעילה (עדיף עם 2–3 חברים שמשתמשים כל יום), מגדיר
`SPACE_SYNC_PROJECTS` בפרודקשן (**ב-env של Vercel**: ה-load של `(reg)` רץ שם, לא
על ה-VPS; אחרי שינוי צריך redeploy), ועוקב בדוח של A3. הסוכן מכין
runbook: מה להפעיל, איך לכבות, מה בודקים בשבוע הראשון.

### A5 — דף ראשון מה-projection
אחרי שקריטריון היציאה של A4 מתקיים: דף אחד (הצעה: יתרות ב-split) מציג מה-
projection, עם fallback ל-Strapi כשה-Space ריק או לא מסונכרן.

---

## 5. ממתין למשתמש

| נושא | מה צריך | חוסם את |
|---|---|---|
| ממצאי A0 | ההמלצה: ה-VPS, כמו היום, עם full-pull אחרי deploy (הניתוב ל-VPS אומת בפרודקשן). לאשר | A4 |
| C0 | התקנת Node 24 מקומית; deploy VPS עם `node:24-alpine` | C1, C2 (vectors PQ) |
| ~~B5~~ | ✔ אושר 2026-11-06 ומומש (קריאה). נשאר: להדליק את `emitFormat.ts` אחרי deploy + חלון | — |
| A4 | בחירת רקמת פיילוט + env בפרודקשן | A5 |
| ~~O-10~~ | ✔ הוכרע 2026-11-06: "לא" = יציאה מהקוורום, לא וטו; גם אחרי שיחה — רק מו"מ, לא "לא" מוחלט | — |
| שער S3 | ההחלטה המוצרית (PLAN_serverless_p2p_data §1, תנאים א–ד) | S3, E1 |

---

## 6. יומן

> שורה לכל סשן: תאריך · ID · מה נעשה · טסטים · commit · הצעד הבא אם ◐.

- 2026-10-08 · R0 · מפרט SPEC_CONSENT_FORMAT + vectors (canonical/signatures/events/e2e); הקשחת canonical (NFC-sort, surrogate, b64url קנוני); מסקנות Rust ו-PQ בתכניות · 448 טסטים בשכבה + 14 vectors · לא בוצע commit · —
- 2026-10-29 · A0 · מיפוי ה-relay: בפרודקשן הווב הוא על ה-VPS (`VITE_API_BASE` → nginx → קונטיינר `sveltekit-api` יחיד); נמצאו פער rehydrate של אירועים גלויים (אין `spaceId` ב-`consent-event`) ובאג 413 בדחיפה אחרי restart מעל 200 אירועים ⇒ נפתחה A0b, ו-A4 תלויה בה · מסמכים בלבד, בלי שינוי קוד · commit `dist: A0` · הבא: A0b
- 2026-10-29 · A0b · `RELAY_MAX_BATCH` ב-`space/protocol.ts` (מקור יחיד ללקוח ול-route); `pushEvents`/`pushSealed` מחלקים ל-chunks בסדר ה-diff ועוצרים בכישלון הראשון; `relay/host.ts` + 503 `relay_not_on_this_host` ב-GET/POST כש-`VERCEL` מוגדר. ניתוב ה-`/api` של הדפדפן ל-`api.1lev1.com` אומת באתר החי; Preview לא נבדק (חסר אישור צוות ב-Vercel). נוסף `docs/inprogress/SPACE_RELAY_EXPLAINER.html` — הסבר לא-טכני · 442→450 בשכבה (8 חדשים ב-`pushChunked.test.ts`), 14 vectors ללא diff, check: ‏1315 שגיאות (מתחת לבסיס) ואף אחת בקבצים שנגעתי בהם · commit `dist: A0b` · הבא: A1 (או B1/B2 במסלול B)
- 2026-10-30 · A1 · `$lib/space/syncFlag.ts` (טהור: `decideSpaceSync`, `parseSpaceSyncProjects`); `(reg)/+layout.server.js` מעביר `spaceSyncProjects` מ-`SPACE_SYNC_PROJECTS` (`$env/dynamic/private`); `spaceSyncEnabled(projectId?)` קורא את `page.data` (‏`$app/state`, בלי תלות בסדר mount) וזוכר את הרשימה האחרונה; הקוראים (`shadowSign`, `SpaceProjectionShadow`, `startAutoSync`) מעבירים רקמה. **ה-env נכנס ל-Vercel, לא ל-VPS** — ה-load רץ שם. הוסר `console.log` דיבאג מ-`startAutoSync` · 450→458 (8 ב-`syncFlag.test.ts`), 14 vectors, check: ‏1315 שגיאות (ללא שינוי) ו-1286 אזהרות (מ-1287). לא נבדק בדפדפן: דורש dev server עם המשתנה וסשן מחובר מקומי · commit `dist: A1` · הבא: A3 (טלמטריה), או B1/B2
- 2026-10-30 · A1 (הפעלה) · לפי בקשת המשתמש: `SPACE_SYNC_PROJECTS` הוגדר ב-Vercel (פרויקט `1-0`, Production בלבד, plain) עם 19 רקמות הטסט מ-`hiddenProjects.ts` (`45,46,51,56,55,54,63,72,80,67,43,83,84,85,82,86,81,79,88`). זה שלב מקדים ל-A4, על רקמות טסט בלבד. **לכבות**: למחוק את המשתנה ב-Vercel ולעשות redeploy · נדחף יחד עם A1
- 2026-10-30 · A3 · `POST /api/consent/telemetry` (מחובר, 30 לדקה, ולידציה שמסירה כל שדה זר) + `SpaceProjectionShadow` שולח snapshot לכל מצב synced שונה + `scripts/space-shadow-report.mjs` שמחשב את קריטריון היציאה לכל רקמה. השורות נכנסות ל-Axiom דרך ה-VPS, ו-JSONL אופציונלי ב-`CONSENT_TELEMETRY_FILE` · 458→478 (20 ב-`server/consent/shadowTelemetry.test.ts`), 14 vectors, check:proxy ירוק, check: ‏1315/1286 ללא שינוי · commit `dist: A3` · **🧑 deploy ל-VPS** (ה-endpoint רץ שם) · הבא: A2 (הרחבת החתימות), או B1/B2
- 2026-10-30 · A2 אצווה 1 · מחזור החלוקה נחתם: `createTosplit` → `tosplit.create` (ids), `approveHaluka` → `haluka.approve` לכל העברה (סטטוס בלבד, בלי deltas), `confirmHaluka` (`kind:'receive'` בלבד) → `haluka.confirm`. **ממצא**: `User.hervachti` גלובלי למשתמש ⇒ השוואת היתרות של A3 ו-genesis של T6 משווים יתרת רקמה למספר על פני כל הרקמות; `mission.approve` לא נחתם עד החלטה (§5). `project.join` לא מתאים בלי שינוי reducer. פערי כיסוי ידועים: אישור חלוקה בשתיקה (timegrama, צד שרת) ו-`confirmHaluka` מדף `/deals` (fetch ישיר, לא `executeAction`) לא חותמים · 478→488, 14 vectors, check 1315/1286 · commit `dist: A2.1` · הבא: החלטת היתרות; אצווה 2 (`pgisha.*`, `time.tick`)
- 2026-10-30 · A2 החלטת היתרות · המשתמש הכריע: יתרה = כסף מחלוקות באותה רקמה. `rikmaSplitBalances` (שני הכללים של Strapi) + `rikmaBalancesExport` (REST, דפדוף); ה-export של genesis וההשוואה ב-`SpaceProjectionShadow` עברו ליתרה לפי רקמה; תוקנו בדרך `projectName` (נקרא משדה לא קיים) ו-`console.log` של כל תשובת Strapi. דיאגרמה נוספה ל-`SPACE_RELAY_EXPLAINER.html` (סשן הצד) · 12 טסטים חדשים, 511 בשכבה (כולל `server/haluka`), 14 vectors, check 1315/1286, check:proxy ירוק · שאילתת ה-REST לא נבדקה מול Strapi חי · commit `dist: A2 balances` · **🧑 deploy ל-VPS** (ה-export רץ שם) · הבא: אצווה 2 (`pgisha.*`, `time.tick`), ואז `mission.approve` בלי סכום
- 2026-10-30 · A2 אצווה 2 · **פגישות הוצאו מהתור** (החלטת המשתמש): הן עוברות ל-magik-meetings, יש שם שאלת אורחים בלי מפתח, וסשן אחר מעביר את ה-UI. **טיימרים נחתמים**: `timerStart`/`timerStop` → `time.tick` על `timer:<id>`, עם `order` = זמן ה-interval ו-`sessionMs` = מה שה-stop סגר. החיבור ב-`executeTimerAction` (`func/timers.js`), כי הטיימרים לא עוברים דרך `actionClient`. השוואה: `/api/consent/timers/[projectId]?ids=`, ו-`kind:'timer'` בטלמטריה, רק לטיימרים `fresh`. `strapiGet` הוצא ל-`$lib/server/consent/strapiRest`. פערי כיסוי: TimeEditor, intervals יתומים, start/stop מהשרת (בוט, MCP) · +16 טסטים (482 בשכבה, 200 ב-crypto/vault/timers), 14 vectors, check 1311/1277 (ללא שגיאות בקבצים שנגעתי), check:proxy ירוק · שאילתת `/api/timers` לא נבדקה מול Strapi חי · commit `dist: A2.2` · **🧑 deploy ל-VPS** (ה-endpoint רץ שם) · הבא: `mission.approve` בלי סכום (אצווה 3)
- 2026-10-30 · T6 תיקון (נמצא ברקמת טסט בפרודקשן) · כפתור הייסוד החזיר `verify:commitment:snapshot_upTo_not_ancestor:genesis`: `verifyCommitments` הריץ על genesis את כלל T10 (`upTo` חייב להיות אב), וזה תמיד נכשל, כי genesis הוא אירוע בלי הורים. ה-relay דחה אותו, ולכן הוא נשאר רק בדפדפן של המציע. עכשיו genesis נבדק לפי ה-state ה-inline שלו: בלי הורים, `restoreState` מצליח, וה-hash שווה ל-root. האירוע שנדחה יידחף מחדש בסנכרון הבא, דרך `computeDiff` · +4 ב-`commitment.test.ts`, ‏462 בשכבה, ה-vectors ללא diff · **🧑 deploy ל-VPS וגם ל-Vercel**, כי אותו אימות רץ גם ב-relay וגם ב-ingest של כל דפדפן
- 2026-11-06 · A2 אצווה 3 · `closeFiniapruval` → `mission.approve.vote` (כל הצבעה, על `finiapruval:<id>`, `order` = הסבב) + `mission.approve` (רק ה-yes שסוגר אישור סיום; payee, בלי `amount`). ה-action מחזיר `round`/`missionStageId`/`payee`; החיבור ב-`fiappru.svelte` (fetch ישיר). פערי כיסוי: סגירה בשתיקה, counter, שעות שמוחזקות ללקוחה · +5 ב-`s2b.test.ts` · לא נבדק בדפדפן · הבא ב-A2: הצבעות (`voteOnPendm`/… מול `addVote`), `project.amend`
- 2026-11-06 · B2 · `$lib/crypto/lowS` (‏`normalizeLowS`/`mirrorS`, BigInt על P1363); `signCanonical` מנרמל ECDSA-P256 לפני חישוב ה-id, המאמת לא השתנה. vector `ecdsa-p256-high-s-event` + `lowSSig`, נגזר מהחתימה הקפואה ולכן דטרמיניסטי. SPEC §3 + §12 (O-2 ✔) · +4 ב-`lowS.test.ts` (כולל 50 חתימות שכולן low-S), diff ב-`signatures.json` = 23 שורות תוספת בלבד, יציב בשתי הרצות
- 2026-11-06 · B1 · `spec/consent-v1/quorum.json`: 5 הצבעות חתומות, 22 מקרי quorum (לכל 7 הכללים עובר + נכשל, ועוד evidence חסר, מצביע לא זכאי, אירוע הקשר שמדולג, הצבעה חוזרת), 23 מקרי deltaCheck (כל 8 ה-kinds, completeness, `unchecked`). ה-state בקובץ = רק מה ש-`checkDeltas` קורא (`deltaStateFromJson`). **ממצא O-10**: `agreers-only` מקבל "לא" בניגוד להערה שלו; ה-vectors עוקפים את המקרה עד החלטה. SPEC §10 + §12 (O-4 ✔) · 549 בשכבה (היו 535), 19 vectors (היו 14), check: ‏1218 שגיאות (ביומן 1311; אין חדשות בקבצים שנגעתי) · commit `dist: A2.3 B1 B2` · הבא: B6 (מסלול B), או A2 (הצבעות)
- 2026-11-06 · A2 אצווה 4 · `voteOnPendm` → `pendm.vote` (הסבב מהשרת, `order` חדש בתוצאה), `voteOnDecision` → `decision.vote` (כל הסוגים חוץ מ-`saleClaim`, שכבר נחתם בנקודת הקריאה), דרך `addVoteConsentSpec` עצמו, ולכן אותה צורה ואותו dedupe. `project.amend` הוחזר כשאלה (§5): השינוי מבשיל בצד השרת, ואוצר ה-paths לא מוגדר · +4 ב-`s2b.test.ts` · לא נבדק בדפדפן
- 2026-11-06 · B6 · cache של `ProjectState` לפי heads ב-`commitment.ts` (`stateAt`, LRU); `applyEvent` אחד על ה-state של ההורים, ו-replay מלא רק כשיש התנגשות dedupe עם אב או כשאין state ב-cache. משותף רק ב-`ingestEvent` ובאימות בצד השרת, אחרי אימות החתימה · `commitmentCache.pbt.test.ts`: property על 40 DAGs + שרשרת 500 (≤2 replays מלאים), ‏555 בשכבה, 19 vectors ללא diff, check ‏1218 (ללא שינוי) · commit `dist: A2.4 B6` · הבא: C0 (🧑 Node 24) או B4 (מזהה מכשיר כטביעה), ו-A2 אחרי החלטת `project.amend`
- 2026-11-06 · A2b (תכנון) · הצעה ל-`project.amend`: רשימת paths סגורה עם ערכים מלאים, `decisionToAmend` כמקור יחיד שגם מאחד את שני המחילים בשרת, חתימה ברגע שהשינוי נכנס לתוקף (עריכה ישירה, ה-yes האחרון, ושתיקה בחתימה עצלה של `consensus.timeout`), ו-4 שלבים · מסמכים בלבד · ממתין לאישור (§5)
- 2026-11-06 · A2b P1–P2 · אוצר ה-paths (`projectAmend.ts`, SPEC §6.6, vector `rikma-settings`); **ממצא**: מפתח ה-dedupe בלי path מקפל את כל ה-amends של חבר, ולכן `order = "<path>#<decision|direct>"`; שני המחילים בשרת (`voteOnDecision`, `timegrama/decision`) אוחדו סביב `decisionToAmend` + `amendToStrapiWrite` (ב-timegrama: qid עם משתנים במקום GraphQL inline); חתימה של עריכה ישירה, הצעה + yes של המציע, וה-yes שסוגר · +13 ב-`projectAmend.test.ts`, +4 ב-`s2b.test.ts`, טסט הזהות עודכן לצורת ההחזרה. בשכבה הכל ירוק, `events.json` +493 שורות תוספת בלבד ויציב, check ‏1218, check:proxy ירוק. ב-configs נכשלים `proposeObjectArchive` (mock של `res.text`) ו-`updateTask`, שלא מייבאים שום דבר שנגעתי בו · commit `dist: A2b P1-P2` · **🧑 deploy ל-VPS** (‏`voteOnDecision`, `updateProjectDetails`; ו-timegrama, איפה שהוא רץ) · הבא: P3 (שתיקה, חתימה עצלה של `consensus.timeout`)
- 2026-11-06 · A2b P3 · שתיקה בחתימה עצלה: `/api/consent/settings/[projectId]` (חבר בלבד; ה-amend נגזר מה-Decision עצמו, בלי שדה חדש ב-Strapi; `values` רק האחרון, `address` רק כשהוא עדיין ה-slug) + `planLazySettingsSigns` (רק החדש ביותר לכל path, ורק כשאין amend מאוחר יותר) + חתימה פעם בסשן ב-`SpaceProjectionShadow` (‏`consensus.timeout` ואז `project.amend`) · +7 ב-`projectAmend.test.ts`, +5 ב-`settingsMatured.test.ts`; ‏593 בשכבה, vectors ללא diff, check ‏1218, check:proxy ירוק · REST לא נבדק מול Strapi חי, ולא בדפדפן · commit `dist: A2b P3` · **🧑 deploy ל-VPS** (ה-endpoint רץ שם) · הבא: P4 (השוואת settings מול Strapi + טלמטריה `kind:'setting'`)
- 2026-11-06 · A2b P4 · השוואת settings ב-`SpaceProjectionShadow` (רק paths שנחתמו, canonical JSON) + `kind:'setting'` בטלמטריה בלי ערכים (אינדקס path + טביעת FNV-1a); `current` ב-endpoint; הדוח מציג את שם ה-path, וטסט מקבע את העותק של `AMEND_PATHS` · +9 ב-`settingsShadow.test.ts`; ‏600 בשכבה, vectors ללא diff, check ‏1218, check:proxy ירוק · לא נבדק בדפדפן · commit `dist: A2b P4` · **A2 ✔**. הבא בתור: C0 (🧑 Node 24) או B4 (מזהה מכשיר כטביעה); פתוח מ-§5: O-10
- 2026-11-06 · B4 קריאה · `deviceId` = b64url(SHA-256(SPKI)) מתקבל בכל מאמת (שרת, לקוח, cert, reset) בלי שדה Strapi; vectors תוספת בלבד (5 אובייקטים + `deviceId` לכל מפתח), יציבים בשתי הרצות · +5 ב-`deviceId.test.ts`, +2 ב-`syncRoundtrip.test.ts` (שתי הצורות דרך ה-relay; טביעה של משתמש אחר; מבוטל), +2 ב-vectors; ‏607 בשכבה, check ‏1218, check:proxy ירוק · commit `dist: B4 read deviceId` · הבא: פליטה רק אחרי deploy + חלון; O-10 הוצג להכרעה
- 2026-11-06 · O-10 · הוכרע (המשתמש): "לא" ב-`agreers-only` = יציאה מהקוורום, לא וטו; גם אחרי שיחה — רק מו"מ. הקוד כבר כך — תוקנה ההערה ב-`quorum.ts`, ו-`SPEC_VOTING_SYSTEM` (tbd) יושר; vectors `agreers-only-no-leaves` + `-revote-no-leaves` (תוספת בלבד) · אין שינוי אימות
- 2026-11-06 · B3 · Ed25519 קפדני: A קנוני + בתת-החבורה מסדר ראשוני, S < L, R ≠ O, לפני `crypto.subtle.verify` — באימות וברישום. Node 22 לבד מקבל 5 מ-6 המקרים הפסולים (טבלה ב-SPEC §3) · `ed25519Edge` (7 שלשות, תוספת בלבד) · +12 ב-`ed25519Strict.test.ts`, +1 ב-vectors; ‏620 בשכבה, check ‏1218, check:proxy ירוק · O-1 ✔
- 2026-11-06 · B5 · מזכר bump v3 בכרטיס: `v:2` לאירוע (O-6 לפי אירוע), dedupe JSON אחיד לכל הגרסאות (O-5), `STATE_ROOT_VERSION 3` בלי `eventId` (O-3), אותו מתג כמו פליטת `deviceId` · ממתין לאישור, בלי מימוש
- 2026-11-06 · B5 מימוש (קריאה) · `v:2` (what boolean, roots ב-v3), state root v3 בלי `eventId` של הצבעות, dedupe עם escape (במקום JSON — המפתחות קפואים ב-`events.json`), מתג פליטה אחד כבוי ב-`emitFormat.ts` · `format-v2-mixed` + `shapeRejects`, תוספת בלבד · +12 ב-`formatV2.test.ts`, +4 ב-vectors; ‏636 בשכבה, check ‏1218, check:proxy ירוק · O-3/O-5/O-6 ✔ · הבא: להדליק את המתג אחרי deploy + חלון (B4+B5 יחד)
