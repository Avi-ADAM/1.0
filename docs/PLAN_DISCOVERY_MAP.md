# מפת גילוי — קנייה משותפת ונותני שירות — Plan v1

> נכתב: 2026-07-03. מסמך משלים ל-[PLAN_SHARED_PURCHASE.md](./PLAN_SHARED_PURCHASE.md) (v2) ול-[PLAN_LOCATION_MAPS.md](./PLAN_LOCATION_MAPS.md). **לא מחליף אותם** — הוא ממקד אותם למסך אחד: **מפה ציבורית אחת, שני צדדים של שוק**.
>
> - **צד הצרכן**: לגלות על המפה ביקושים באזורי — משאלות שמחפשות מצטרפים, מאגדי-ביקוש (maagad), והצעות מותנות-סף של ספקים ("מיניבוס — 7/10 נרשמו") — ולהצטרף.
> - **צד נותן השירות**: לגלות על המפה הזדמנויות — משימות פתוחות ומשאבים מבוקשים מריקמות, צרכים שפורסמו מהקונסיירז', ומאגדי-ביקוש שמחכים לספק.

---

## 0. סטטוס תשתית (נבדק מול הקוד, 2026-07-03)

| שכבה | מצב | הערה |
| --- | --- | --- |
| MapLibre GL | ✅ מותקן (`maplibre-gl` ב-package.json) | ההמלצה של PLAN_LOCATION_MAPS כבר מומשה |
| `LocationPicker.svelte` / `LocationView.svelte` | ✅ קיימים | raster OSM style, עיגול-רדיוס, geolocation — דפוסי הבסיס לשימוש חוזר |
| `Ratson` | ✅ `lat/lng/radius/isOnline/location_hint` + `joinKind/minJoiners/maxJoiners/joinDeadline/allowJoin` + `frequency/access_mode/status_ratson` | כל מה שצריך לשכבת-הצרכן כבר בסכמה |
| `ComponentNewLocation` (`lat/lng/radius/location_hint/location_mode`) | ✅ קיים על `open-mission`, `open-mashaabim`, `sp`, `project` | שלב 1 של PLAN_LOCATION_MAPS §3 בוצע בפועל בבקאנד |
| `open-mission.ratson` + `source` | ✅ | מזהה צרכים שמקורם בקונסיירז' (`publishWishNeedToCommunity`) |
| `maagad` / `maagad-member` / `maagad-offer` | ❌ לא קיימים | P0 של PLAN_SHARED_PURCHASE — נוצר בסשן זה (ראה §4) |
| גיאו-utils (`haversine`, `withinRadius`) | ❌ | נוצר בסשן זה |
| **ענף המקור ב-1.0b** | ✅ `shabab` | ענף `master` הוא Strapi v3 מ-2022; המקור החי הוא ענף **`shabab`** (Strapi 4.20.0). קבצי הסכמה החדשים נוצרו בפורמט v4 מעל `shabab`; ראה `docs/SPEC_SHARED_PURCHASE_MAP.md` שם לצעדים ידניים אחרי דיפלוי (הרשאות + codegen). |

---

## 1. עיקרון-העל: מפה אחת, שתי עדשות

מסך אחד — `/demand` (ציבורי, `(regandnon)`) — עם מתג עדשה:

```
🧺 מחפשים יחד (צרכן)                    🛠 נותנים שירות (ספק)
├─ משאלות שמחפשות מצטרפים               ├─ משימות פתוחות (ריקמות)
├─ מאגדי ביקוש (forming/visible)        ├─ משאבים מבוקשים (ריקמות)
└─ הצעות-סף של ספקים (Track C)          ├─ צרכי קונסיירז' (open-mission.ratson≠null)
                                        └─ מאגדים שמחכים לספק (visible)
```

הרציונל: אלה שני צדדים של אותו שוק, ואותה נקודה על המפה יכולה לעניין את שניהם ("12 משקי בית מחפשים סל ירקות" — הצרכן ה-13 מצטרף, הספק מציע). מפה אחת = אפס כפילות קוד, ומעבר-עדשה הוא רק החלפת שכבות. העמוד ציבורי בכוונה — זהו מנוע-הגיוס של §6.2 ב-PLAN_SHARED_PURCHASE: ביקוש מצטבר גלוי מושך ספקים ומצטרפים שעוד לא נרשמו.

## 2. שכבות, מקורות נתונים וכללי תצוגה

| שכבה | מקור | סינון | מיקום (שרשרת fallback) | תצוגה |
| --- | --- | --- | --- | --- |
| משאלות-להצטרפות | `ratson` | `status_ratson ∈ {open,matching}` ∧ `access_mode ≠ personal` ∧ (`allowJoin` ∨ `joinKind ≠ solo`) | `ratson.lat/lng` | עיגול ורוד; פופאפ: שם, joinKind, x/minJoiners, deadline → `/wish/[id]` |
| מאגדים | `maagad` | `status_maagad ∈ {forming,visible,offered}` ∧ `scope ≠ global` | `maagad.lat/lng` (centroid) | עיגול סגול + מונה חברים; פופאפ: canonical_desc, progress ל-viability → `/maagad/[id]` |
| הצעות-סף | `maagad-offer` דרך המאגד | `status_offer = open` | המאגד העוטף | עיגול כתום + progress "7/10" → `/demand/[id]` |
| משימות פתוחות | `open-mission` | `archived = false` | `location.lat/lng` → `project.location` | משולש כחול; פופאפ: שם, פרויקט, שעות, כישורים → הצעה |
| משאבים מבוקשים | `open-mashaabim` | `archived = false` | `location.lat/lng` → `project.location` | ריבוע ירוק; פופאפ: שם, kindOf, פרויקט |
| צרכי קונסיירז' | תת-קבוצה של השניים למעלה | `ratson ≠ null` (או `source`) | `location` → `ratson.lat/lng` | אותו סימן + תג קונסיירז' (לוגו) |

**כללים חוצי-שכבות:**

1. **אונליין לא על המפה** — פריט `isOnline`/`location_mode='online'` מופיע ברשימת-הצד תחת "🌐 גלובלי", לא כנקודה (PLAN_LOCATION_MAPS §6: online לא נענש ולא ממוקם).
2. **פרטיות** (PLAN_SHARED_PURCHASE §2.6, §14.5): בעדשה הציבורית — עיגול קואורדינטות משאלה לרשת ~1 ק"מ (`roundCoord`), בלי שם בעלים, מספרים מצטברים בלבד; מאגד מציג טווח ("5–10 משקי בית") מתחת לסף חשיפה. זהות נחשפת רק בכניסה לעמוד הפריט לפי כללי הגישה הקיימים שלו.
3. **Clustering** — cluster יליד של MapLibre (`cluster:true` על GeoJSON source) פר-שכבה; צבע ה-cluster כצבע השכבה.
4. **סנכרון מפה↔רשימה** — רשימת-צד מציגה את הפריטים שב-viewport הנוכחי; hover ברשימה מדגיש במפה.
5. **Deep-links** — `?lens=supply&layers=missions,maagads&c=32.1,34.9,10` לשיתוף מסונן (ערוץ הגיוס של §6.2).

## 3. ארכיטקטורה

```
src/routes/(regandnon)/demand/+page.server.ts   ← SSR load: sendToSer × QIDs 207–210, normalizeMapItems
src/routes/(regandnon)/demand/+page.svelte      ← עדשות, פילטרים, רשימת-צד, mount המפה
src/lib/components/location/DiscoveryMap.svelte ← מפה גנרית: layers[], clusters, popups, אירועי bbox
src/lib/map/discoveryTypes.ts                   ← MapItem, MapLayerDef, normalizers
src/lib/server/geo/haversine.ts, withinRadius.ts, roundCoord.ts
src/routes/api/send/qids.js                     ← 207–210 (ראה §5)
```

- `DiscoveryMap` **גנרי**: מקבל `layers: MapLayerDef[]` (id, צבע, צורה, items, onSelect) ולא יודע כלום על ratson/maagad — כדי שישרת בהמשך גם את מסך-הלב (PLAN_LOCATION_MAPS שלב 5) ואת `/moach/[projectId]/demand`.
- טעינת maplibre רק ב-client (`onMount(() => import('maplibre-gl'))`) — כמו ב-`LocationPicker`.
- ה-load השרתי מנרמל הכל ל-`MapItem` אחיד: `{ id, kind, lat, lng, radius, title, subtitle, badges, href, isOnline, concierge }` — הפרטיות (עיגול קואורדינטות, השמטת זהויות) נאכפת **בשרת**, לא בלקוח.
- שאילתת maagad עטופה ב-try/catch נפרד: עד שהסכמה חיה בפרודקשן — degradation שקט לשכבות הקיימות (אותו דפוס כמו consent-event ב-PLAN_IMPLEMENTATION_ROADMAP).

## 4. סכמה (Strapi)

**חדש — שלוש הקולקציות של PLAN_SHARED_PURCHASE §4** (P0, ללא שינוי מהמפרט שם): `maagad`, `maagad-member`, `maagad-offer`. למפה קריטיים: `maagad.lat/lng/radius` (centroid), `scope`, `status_maagad`, `viability_hint`, `frequency`; `maagad-offer.min_participants/signed_count/sign_deadline/status_offer`.

**הרחבות קיימות** (§4.4): `ratson.maagad`, `ratson.aggregation_opt_out`, `sheirutpend.maagad_offer`, `sheirutpend.conditional` — נכללות ב-spec, נדרשות ל-P1+ (לא למפה עצמה).

**אין צורך בשדות מיקום חדשים** — בניגוד להנחת PLAN_LOCATION_MAPS §3, `ComponentNewLocation` כבר קיים על כל הישויות הרלוונטיות בפרודקשן.

**אופן המסירה**: קבצי v4 מלאים (`src/api/maagad*` + הרחבות `ratson`/`sheirutpend`) על ענף העבודה שמבוסס `shabab` ב-1.0b. אחרי מיזוג ודיפלוי: הענקת הרשאות (Public: find/findOne על maagad+maagad-offer) והרצת codegen בפרונט — פירוט ב-`docs/SPEC_SHARED_PURCHASE_MAP.md`.

## 5. QIDs (בלוק 220+ — 180–219 כבר תפוסים ע"י התכניות הקודמות ו-site-share)

**מפה (§2):**

| QID | תוכן |
| --- | --- |
| `220mapJoinableRatsons` | משאלות-להצטרפות לפי הסינון של §2 + lat notNull, עד 250 |
| `221mapOpenMissions` | משימות פתוחות + location + project(location, projectName) + skills + ratson(id) |
| `222mapOpenMashaabims` | משאבים מבוקשים, אותו מבנה |
| `223mapMaagadim` | מאגדים forming/visible/offered + ההצעות הפתוחות שלהם (guarded — §3) |

**פעולות מאגד (M2):** `224crMaagad`, `225crMaagadMember`, `226updateMaagadMember`, `227crMaagadOffer`, `228updateMaagadOffer`, `229queryMaagadFull`, `230updateMaagad`, `231queryMyMaagadMember`, `232listExpiredOpenOffers`, `233listOpenRatsonsForClustering`.

## 6. אבני דרך

| # | תוצר | תלות | סטטוס |
| --- | --- | --- | --- |
| M0 | מסמך זה + spec סכמה + קבצי v3 ב-1.0b | – | סשן זה |
| M1 | `/demand` ציבורי: מפה + שתי עדשות + שכבות ratson/open-mission/open-mashaabim מהסכמה הקיימת + רשימת-צד + deep-links | M0 | סשן זה |
| M2 | `/maagad/[id]` (צפייה/הצטרפות/עזיבה/חתימה/ביטול-חתימה, פרטיות בשרת) + actions: `openMaagad`/`joinMaagad`/`leaveMaagad`/`createMaagadOffer`/`signMaagadOffer`/`unsignMaagadOffer`/`confirmMaagadQuorum`/`expireMaagadOffers`/`clusterRatsons` (QIDs 224–233) + מכונות טהורות `offerStateMachine.ts` (22) + `clustering.ts` (11) + `MaagadOfferForm` + חיבור מהמפה | סכמה בפרודקשן (הענף מוכן) | **סשן זה** — חסר רק: Sheirutpend מותנה + הרצת pipeline העסקה פר-חבר בהפעלה; שדרוג `similarity()` ל-Pinecone |
| M3 | עדשת-ספק פעילה בהקשר פרויקט: `/moach/[projectId]/demand` משתמש באותו `DiscoveryMap` עם pre-filter גיאו של הפרויקט; חיבור ההפעלה ל-Sheirutpend מותנה (`activateMaagadOffer` → deal pipeline) | M2 + P2 של PLAN_SHARED_PURCHASE | הבא |
| M4 | הצעות-סף (Track C) על המפה עם progress חי (socket) + heat-layer ביקוש כשצפיפות גבוהה | P4 | עתידי |

## 7. אימות

- **יחידה**: Vitest ל-normalizers (fallback-שרשרת מיקום, עיגול פרטיות, סינון isOnline) ול-geo utils.
- **ידני M1**: משאלה עם allowJoin+מיקום מופיעה בעדשת-צרכן ולא בעדשת-ספק; משימה פתוחה עם מיקום-פרויקט בלבד יורשת אותו; פריט אונליין מופיע רק ברשימה; משאלת `access_mode=personal` לא מופיעה כלל; deep-link משחזר עדשה+שכבות+viewport.
- **רגרסיה**: אפס נגיעה בזרימות קיימות — כל הקוד חדש פרט ל-qids.js (הוספה בלבד) ולרישום תרגומים.
