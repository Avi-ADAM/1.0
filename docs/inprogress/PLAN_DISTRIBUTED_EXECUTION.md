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
| S2a relay + סנכרון | ✔ | **כבוי** — רק `localStorage.SPACE_SYNC_ENABLED='1'` בדפדפן ספציפי |
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
| 1b | A0b | push ב-chunks של ≤200 + relay מסרב לרוץ על Vercel (ממצאי A0) | S | A0 | ⬜ |
| 2 | B1 | vectors ל-quorum ול-deltaCheck (O-4) | M | — | ⬜ |
| 3 | B2 | ECDSA low-S בצד החותם (O-2) | S | — | ⬜ |
| 4 | A1 | דגל Space לפי רקמה (allowlist בשרת) | M | — | ⬜ |
| 5 | A3 | טלמטריית אי-התאמות לשרת | M | A1 | ⬜ |
| 6 | A2 | הרחבת חתימות ה-shadow — באצוות | L | — | ⬜ |
| 7 | B6 | אימות התחייבויות אינקרמנטלי (O(n²) → O(n)) | M–L | — | ⬜ |
| 8 | C0 | יישור Node 24 (Dockerfile, פיתוח) + גילוי יכולות PQ | S | — | ⬜ 🧑 (התקנה/deploy) |
| 9 | B4 | מזהה מכשיר כטביעת אצבע (O-7) | L | — | ⬜ |
| 10 | C2 | KEM היברידי — `WrappedKey` v2 (O-9) | M | C0 | ⬜ |
| 11 | B3 | מדיניות קצוות Ed25519 + vectors (O-1) | M | — | ⬜ |
| 12 | C1 | שדה `cosig` — חתימה היברידית על עוגנים (O-8) | L | C0, B4 | ⬜ |
| 13 | B5 | מזכר החלטה: חבילת bump v3 (O-3, O-5, O-6) | S | — | ⬜ 🧑 (אישור) |
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

**לבדיקה ידנית (🧑, דקה):** ב-Vercel → Settings → Environment Variables, שה-
`VITE_API_BASE` מוגדר ל-Production (ולבחור אם גם ל-Preview). הממצא נשען על
PLAN_PROXY_SECURITY; לא ראיתי את ה-env בעצמי.

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

### A2 — הרחבת חתימות ה-shadow (באצוות של 3–4 actions לסשן)
**למה**: 7 actions חותמים; פיילוט על projection שחסרות בו רוב הפעולות יראה
אי-התאמות שהן חוסר כיסוי, לא באגים.
**הדפוס הקיים**: `src/lib/consent/specs/s2b.ts` (מקור יחיד לצורת ה-predicate,
עם deriver שמשלב params + תוצאת action) ← `s2bShadowJobs` ←
`shadowSignForAction` ב-`src/lib/client/shadowSignRegistry.ts`. טסטים ב-`s2b.test.ts`.
**המועמדים** (יש reducer, אין חתימה) — אמת לכל אחד את ה-action המדויק לפני מיפוי:

| reducer | config מועמד |
|---|---|
| `tosplit.create` | `createTosplit` |
| `haluka.approve` / `haluka.confirm` | `approveHaluka` / `confirmHaluka` |
| `pgisha.create` / `pgisha.approve` | `createNewMeeting` / `approveMeeting` |
| `time.tick` | `timerStart` / `timerStop` (**שים לב**: start ו-stop חולקים מפתח dedupe — `sessionMs` ב-stop חובה; SPEC §6.2) |
| `pendm.vote` / `decision.vote` / `ask.vote` / `sheirutpend.vote` | `voteOnPendm` / `voteOnDecision` / `voteOnAskm` / `approveSheirutpend` — **בדוק קודם** אם `addVote` כבר מכסה את אותו מסלול; אל תחתום פעמיים |
| `project.join` | `finalizeJoinAcceptance` |
| `mission.approve` | `closeFiniapruval` (הכסף כ-`{amount: string, code}` — D-12) |
| `project.amend` | `updateProjectDetails` (רק השדות שה-reducer מבין: `path`/`value`) |

לכל action: spec ב-`s2b.ts` + רישום + טסט שמוודא שה-predicate בדיוק בצורה
שה-reducer קורא (הרץ את האירוע דרך `project()` ובדוק את ה-state).
**קבלה לכל אצווה**: טסטים ירוקים; עדכון הטבלה כאן (✔ לכל שורה שנעשתה).

### B6 — אימות התחייבויות אינקרמנטלי
**למה**: `verifyCommitments` משחזר את כל סגור האבות לכל אירוע ⇒ O(n²) בסנכרון
(HANDOFF §8.3). היום לא מורגש (רק snapshots נושאים התחייבויות); ב-strict של S3b כן.
**צעדים**: cache של `ProjectState` לפי id של אירוע (או לפי קבוצת heads) בתוך
`commitment.ts`, עם מפתח שמכסה את הסגור; `projectFrom(base, tail)` כבר קיים
(T10). **הסמנטיקה לא משתנה** — אותו root בדיוק.
**קבלה**: טסט property (fast-check): תוצאות זהות עם ובלי cache על DAGs אקראיים;
benchmark: 500 אירועים עם התחייבויות — מספר קריאות ל-`applyEvent` לינארי; freeze ללא diff.

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

### A4 — פיילוט 🧑
המשתמש בוחר רקמה פעילה (עדיף עם 2–3 חברים שמשתמשים כל יום), מגדיר
`SPACE_SYNC_PROJECTS` בפרודקשן לפי ממצאי A0, ועוקב בדוח של A3. הסוכן מכין
runbook: מה להפעיל, איך לכבות, מה בודקים בשבוע הראשון.

### A5 — דף ראשון מה-projection
אחרי שקריטריון היציאה של A4 מתקיים: דף אחד (הצעה: יתרות ב-split) מציג מה-
projection, עם fallback ל-Strapi כשה-Space ריק או לא מסונכרן.

---

## 5. ממתין למשתמש

| נושא | מה צריך | חוסם את |
|---|---|---|
| ממצאי A0 | ההמלצה: ה-VPS, כמו היום, עם full-pull אחרי deploy. לאשר, ולוודא ש-`VITE_API_BASE` מוגדר ב-Vercel (גם ל-Preview?) | A4 |
| C0 | התקנת Node 24 מקומית; deploy VPS עם `node:24-alpine` | C1, C2 (vectors PQ) |
| B5 | אישור חבילת v3 | מימוש O-3/O-5/O-6 |
| A4 | בחירת רקמת פיילוט + env בפרודקשן | A5 |
| שער S3 | ההחלטה המוצרית (PLAN_serverless_p2p_data §1, תנאים א–ד) | S3, E1 |

---

## 6. יומן

> שורה לכל סשן: תאריך · ID · מה נעשה · טסטים · commit · הצעד הבא אם ◐.

- 2026-10-08 · R0 · מפרט SPEC_CONSENT_FORMAT + vectors (canonical/signatures/events/e2e); הקשחת canonical (NFC-sort, surrogate, b64url קנוני); מסקנות Rust ו-PQ בתכניות · 448 טסטים בשכבה + 14 vectors · לא בוצע commit · —
- 2026-10-29 · A0 · מיפוי ה-relay: בפרודקשן הווב הוא על ה-VPS (`VITE_API_BASE` → nginx → קונטיינר `sveltekit-api` יחיד); נמצאו פער rehydrate של אירועים גלויים (אין `spaceId` ב-`consent-event`) ובאג 413 בדחיפה אחרי restart מעל 200 אירועים ⇒ נפתחה A0b, ו-A4 תלויה בה · מסמכים בלבד, בלי שינוי קוד · commit `dist: A0` · הבא: A0b
